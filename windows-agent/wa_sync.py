"""Abu Arsam office WhatsApp sync (Windows).

Reads new messages from the installed WhatsApp Desktop app on this PC (its local,
encrypted SQLite databases + its media folder) and posts them to the Abu Arsam
admin panel (Settings -> «اتصال واتس‌اپ دفتر», inbox -> «صندوق واتس‌اپ»).

Read-only towards WhatsApp: it never writes to WhatsApp's files and never sends
WhatsApp messages. Everything decrypted lives only in a temp folder that is
deleted at the end of every run.

The database page format and the one-time key extraction come from ZAPiXDESK
(https://github.com/kraftdenker/ZAPiXDESK, GPL-3.0, (c) 2025 Alberto Magno);
the page and WAL decryption below re-implements its algorithm.

Commands (python wa_sync.py <command>):
  setup --panel https://www.abuarsam.com --token wa_...   save panel URL + agent key
  extract-keys      one time, needs an admin (UAC) prompt; closes WhatsApp for a moment
  discover          list databases, tables, columns and row counts (local only)
  sql "<query>"     run a read query on the decrypted databases (local only)
  test              run the configured mapping and print 10 messages, sends nothing
  run               one sync cycle (what the scheduled task runs)
  install-task      run `run` every 5 minutes with Windows Task Scheduler (no admin)
  remove-task       stop the scheduled task
  status            show config, last run and the panel's view of this agent
"""
from __future__ import annotations

import argparse
import ctypes
import datetime as dt
import getpass
import hashlib
import json
import mimetypes
import os
import re
import shutil
import sqlite3
import struct
import subprocess
import sys
import tempfile
import time
import traceback
import urllib.error
import urllib.request
import zipfile
from ctypes import wintypes
from pathlib import Path

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

VERSION = "1.0.0"
PAGE = 4096
WAL_HEADER, FRAME_HEADER = 32, 24
APP_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "AbuArsamWA"
CONFIG, KEYS, STATE, LOG, LOCK = (APP_DIR / n for n in ("config.json", "keys.bin", "state.json", "log.txt", "run.lock"))
WA_PACKAGE = "5319275A.WhatsAppDesktop_cv1g1gvanyjgm"
TASK_NAME = "AbuArsam WhatsApp Sync"

ZAPIX_COMMIT = "6bc8d2a4f9c2afe986ed05f556096bfbac4bf850"
ZAPIX_FILES = {
    "ZAPiXDESK.ps1": "06316c875aac0c4be7c5139c8dc39541ace375df9d13c5cff1423577c43250a6",
    "BouncyCastle.Cryptography.dll": "2f6740280b26d235076ea2b244fe6a13136ce6bdad71cb9313b63db4beb33a09",
}

BATCH = 200
MAX_BATCHES_PER_RUN = 25
MAX_MEDIA = 50 * 1024 * 1024
SKIP_JID = re.compile(r"@(g\.us|broadcast|newsletter|call)$|^status@|^0@", re.I)


# ---------------------------------------------------------------- small helpers

def log(msg: str) -> None:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    line = f"{dt.datetime.now():%Y-%m-%d %H:%M:%S} {msg}"
    print(line)
    if LOG.exists() and LOG.stat().st_size > 1_000_000:
        LOG.replace(LOG.with_suffix(".old.txt"))
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def phone_key(phone: str) -> str:
    """Same rules as lib/phone-key.ts in the panel."""
    d = "".join(str(int(ch)) for ch in str(phone or "") if ch.isdecimal())  # Persian/Arabic digits too
    if d.startswith("00"):
        d = d[2:]
    if len(d) == 11 and d.startswith("968"):
        d = d[3:]
    if len(d) == 13 and d.startswith("980"):
        d = d[3:]
    if len(d) == 12 and d.startswith("98"):
        d = d[2:]
    if len(d) == 11 and d.startswith("09"):
        d = d[1:]
    return d


# ------------------------------------------------- Windows DPAPI (user scope)

class _Blob(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]


def _dpapi(data: bytes, protect: bool) -> bytes:
    crypt32, kernel32 = ctypes.windll.crypt32, ctypes.windll.kernel32
    buf = ctypes.create_string_buffer(data, len(data))
    src, out = _Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char))), _Blob()
    fn = crypt32.CryptProtectData if protect else crypt32.CryptUnprotectData
    if not fn(ctypes.byref(src), None, None, None, None, 0, ctypes.byref(out)):
        raise OSError("DPAPI failed")
    try:
        return ctypes.string_at(out.pbData, out.cbData)
    finally:
        kernel32.LocalFree(out.pbData)


def save_secret(path: Path, obj: dict) -> None:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    path.write_bytes(_dpapi(json.dumps(obj).encode(), True))


def load_secret(path: Path) -> dict:
    return json.loads(_dpapi(path.read_bytes(), False))


def load_config() -> dict:
    if not CONFIG.exists():
        sys.exit("Not set up yet: run `python wa_sync.py setup --panel URL --token KEY` first.")
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def save_config(cfg: dict) -> None:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")


def load_state() -> dict:
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def save_state(state: dict) -> None:
    STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def localstate() -> Path:
    p = Path(os.environ["LOCALAPPDATA"]) / "Packages" / WA_PACKAGE / "LocalState"
    if not p.exists():
        sys.exit(f"WhatsApp Desktop data not found at {p}. Is the Microsoft Store WhatsApp app installed and signed in?")
    return p


# ------------------------------------------------------- page / WAL decryption

def _page(key: bytes, page_no: int, data: bytes) -> bytes:
    iv = page_no.to_bytes(4, "little", signed=True) + data[-12:]
    d = Cipher(algorithms.AES(key), modes.OFB(iv)).decryptor()
    return d.update(data) + d.finalize()


def decrypt_db(key: bytes, src: Path, dst: Path) -> None:
    raw = src.read_bytes()
    out = bytearray()
    for i in range(0, len(raw) - len(raw) % PAGE, PAGE):
        out += _page(key, i // PAGE + 1, raw[i:i + PAGE])
    out[0x10:0x18] = raw[0x10:0x18]  # page-1 header bytes are stored in clear
    dst.write_bytes(bytes(out))


def _wal_sum(data: bytes, s0: int, s1: int, big: bool) -> tuple[int, int]:
    for a, b in struct.iter_unpack((">" if big else "<") + "II", data):
        s0 = (s0 + a + s1) & 0xFFFFFFFF
        s1 = (s1 + b + s0) & 0xFFFFFFFF
    return s0, s1


def decrypt_wal(key: bytes, src: Path, dst: Path) -> None:
    raw = src.read_bytes()
    if len(raw) < WAL_HEADER:
        return
    header = raw[:WAL_HEADER]
    big = int.from_bytes(header[0:4], "big") == 0x377F0683
    s0, s1 = int.from_bytes(header[24:28], "big"), int.from_bytes(header[28:32], "big")
    out = bytearray(header)
    frame = FRAME_HEADER + PAGE
    end = WAL_HEADER + (len(raw) - WAL_HEADER) // frame * frame  # drop a half-written last frame
    for i in range(WAL_HEADER, end, frame):
        fh = bytearray(raw[i:i + FRAME_HEADER])
        enc = raw[i + FRAME_HEADER:i + frame]
        page_no = int.from_bytes(fh[0:4], "big")
        dec = bytearray(_page(key, page_no, enc))
        if page_no == 1:
            dec[0x10:0x18] = enc[0x10:0x18]
        s0, s1 = _wal_sum(bytes(fh[0:8]), s0, s1, big)
        s0, s1 = _wal_sum(bytes(dec), s0, s1, big)
        fh[16:24] = s0.to_bytes(4, "big") + s1.to_bytes(4, "big")
        out += fh + dec
    dst.write_bytes(bytes(out))


def decrypted_copy(work: Path, keys: dict) -> dict[str, Path]:
    """Copies the encrypted databases named in keys['dbs'] and decrypts them into work/."""
    ls = localstate()
    found = {}
    for rel, hexkey in keys["dbs"].items():
        src = ls / rel
        if not src.exists():
            continue
        name = Path(rel).stem
        enc_db, enc_wal = work / f"{name}.enc", work / f"{name}.enc-wal"
        try:
            shutil.copyfile(src, enc_db)
            if Path(str(src) + "-wal").exists():
                shutil.copyfile(str(src) + "-wal", enc_wal)
        except PermissionError:
            raise RuntimeError(f"WhatsApp is holding {rel} locked (see Repair in SKILL.md)")
        key = bytes.fromhex(hexkey)
        decrypt_db(key, enc_db, work / f"{name}.db")
        if enc_wal.exists():
            decrypt_wal(key, enc_wal, work / f"{name}.db-wal")
        enc_db.unlink(missing_ok=True)
        enc_wal.unlink(missing_ok=True)
        found[name] = work / f"{name}.db"
    if not found:
        raise RuntimeError("none of the databases in keys.bin exist any more; run extract-keys again")
    return found


def open_dbs(paths: dict[str, Path], main: str) -> sqlite3.Connection:
    con = sqlite3.connect(paths[main])
    con.row_factory = sqlite3.Row
    for name, p in paths.items():
        if name != main:
            con.execute("ATTACH DATABASE ? AS " + re.sub(r"\W", "_", name), (str(p),))
    con.execute("SELECT count(*) FROM sqlite_master").fetchone()  # fails here if a key is wrong
    return con


# --------------------------------------------------------------- panel client

def api(cfg: dict, method: str, path: str, body: dict | None = None) -> dict:
    token = load_secret(Path(cfg["token_file"]))["token"]
    req = urllib.request.Request(
        cfg["panel"].rstrip("/") + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": f"abuarsam-wa/{VERSION}"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read() or b"{}")


def upload_media(cfg: dict, file: Path) -> str | None:
    size = file.stat().st_size
    if not size or size > MAX_MEDIA:
        return None
    signed = api(cfg, "POST", "/api/whatsapp/agent/upload", {"fileName": file.name, "size": size})
    mime = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
    req = urllib.request.Request(signed["signedUrl"], data=file.read_bytes(), method="PUT", headers={"Content-Type": mime})
    urllib.request.urlopen(req, timeout=300).read()
    return signed["path"]


# ------------------------------------------------------------- message mapping

def normalise(row: sqlite3.Row, cfg: dict, contacts: dict[str, str]) -> dict | None:
    r = dict(row)
    jid = str(r.get("chat_jid") or "")
    if not jid or SKIP_JID.search(jid):
        return None
    user = jid.split("@")[0].split(":")[0]
    phone = str(r.get("phone") or "") or (user if jid.endswith(("@s.whatsapp.net", "@c.us")) else "")
    phone = phone or contacts.get(jid, "")  # @lid: only a real number found via lid_phone_sql
    phone = re.sub(r"(?!^\+)[^\d]", "", phone.strip())  # drop spaces/()- that a contact number may carry
    # No real phone (e.g. an @lid chat with no number) -> drop it. A phone is how the
    # blacklist matches, so a chat we cannot tie to a number must never be uploaded.
    if not re.fullmatch(r"\+?\d{8,15}", phone):
        return None
    ts = float(r.get("ts") or 0)
    if ts > 1e12:
        ts /= 1000
    kind = cfg.get("kind_map", {}).get(str(r.get("kind")), str(r.get("kind") or "text"))
    return {
        "id": f"{jid}:{r['id']}",  # scope the id by chat so a mis-mapped id can't collide across chats
        "phone": phone if phone.startswith("+") else "+" + phone,
        "contact_name": r.get("contact_name") or None,
        "from_me": bool(r.get("from_me")),
        "sent_at": dt.datetime.fromtimestamp(ts, dt.timezone.utc).isoformat(),
        "kind": kind if kind in {"text", "voice", "image", "video", "document", "sticker"} else "other",
        "body": r.get("body") or None,
        "media_file": r.get("media_file") or None,
        "media_mime": r.get("media_mime") or None,
        "media_name": r.get("media_name") or None,
    }


def fetch(con: sqlite3.Connection, cfg: dict, cursor: int, since: float) -> list[sqlite3.Row]:
    return con.execute(cfg["messages_sql"], {"cursor": cursor, "since": since, "since_ms": since * 1000, "limit": BATCH}).fetchall()


def contact_phones(con: sqlite3.Connection, cfg: dict) -> dict[str, str]:
    q = cfg.get("lid_phone_sql")
    return {str(a): str(b) for a, b in con.execute(q).fetchall()} if q else {}


# ------------------------------------------------------------------- commands

def cmd_setup(a) -> None:
    cfg = json.loads(CONFIG.read_text(encoding="utf-8")) if CONFIG.exists() else {}
    if not a.panel.lower().startswith("https://"):
        sys.exit("The panel URL must be https:// (the key is sent with every request).")
    # The key is typed at the prompt, not passed on the command line, so it stays
    # out of the shell history and any chat transcript.
    token = (a.token or getpass.getpass("Paste the agent key (wa_...): ")).strip()
    if not token.startswith("wa_"):
        sys.exit("The key must start with wa_ (Settings -> «اتصال واتس‌اپ دفتر» -> «ساخت کلید اتصال»).")
    cfg.update({"panel": a.panel.rstrip("/"), "token_file": str(APP_DIR / "token.bin")})
    cfg.setdefault("backfill_days", 30)
    cfg.setdefault("main_db", "genericStorage")
    save_secret(Path(cfg["token_file"]), {"token": token})
    save_config(cfg)
    try:
        n = len(api(cfg, "GET", "/api/whatsapp/agent")["blacklist_sha256"])
        log(f"setup ok: panel reachable, key accepted, {n} blacklisted numbers")
    except urllib.error.HTTPError as e:
        sys.exit(f"panel refused the key (HTTP {e.code}); make a new key in Settings and run setup again")


def _download_zapix(dest: Path) -> None:
    for name, sha in ZAPIX_FILES.items():
        url = f"https://raw.githubusercontent.com/kraftdenker/ZAPiXDESK/{ZAPIX_COMMIT}/{name}"
        data = urllib.request.urlopen(url, timeout=120).read()
        if hashlib.sha256(data).hexdigest() != sha:
            sys.exit(f"{name}: checksum mismatch, refusing to run it")
        (dest / name).write_bytes(data)
    ps1 = dest / "ZAPiXDESK.ps1"
    s = ps1.read_text(encoding="utf-8-sig")
    patches = [  # record the per-database keys and the session folder; no blocking pop-up at the end
        ('$dbKey = Convert-HexStringToByteArray $lastFromThisType.ValueHex',
         '$dbKey = Convert-HexStringToByteArray $lastFromThisType.ValueHex\n'
         '                "KEYTYPE${currentKey}: $($lastFromThisType.ValueHex)" | Out-File -FilePath "$targetOutput\\$metaDataFileName" -Append'),
        ('$workingDir = "$targetOutput\\sessions\\$targetSession"',
         '$workingDir = "$targetOutput\\sessions\\$targetSession"\n'
         '        "SESSION: $targetSession" | Out-File -FilePath "$targetOutput\\$metaDataFileName" -Append'),
        ('[Windows.Forms.MessageBox]::Show("WhatsApp acquisition and decryption completed. Results save in $zipTarget", "Acquisition Complete","Ok","Information") | Out-Null', ''),
    ]
    for old, new in patches:
        if s.count(old) != 1:
            sys.exit(f"ZAPiXDESK layout changed; patch point not found: {old[:60]}")
        s = s.replace(old, new)
    ps1.write_text(s, encoding="utf-8-sig")


def cmd_extract_keys(_a) -> None:
    ls = localstate()
    with tempfile.TemporaryDirectory(prefix="abuarsam-zx-") as tmp:
        tmp = Path(tmp)
        tool, out = tmp / "tool", tmp / "out"
        tool.mkdir(), out.mkdir()
        _download_zapix(tool)
        log("extract-keys: starting ZAPiXDESK (approve the admin prompt; WhatsApp closes and reopens)")
        inner = f"-NoProfile -ExecutionPolicy Bypass -File \"{tool / 'ZAPiXDESK.ps1'}\" -OutputPath \"{out}\""
        subprocess.run(["powershell", "-NoProfile", "-Command",
                        f"Start-Process powershell -Verb RunAs -Wait -WorkingDirectory '{tool}' -ArgumentList '{inner}'"], check=True)
        zips = sorted(out.glob("ZAPiXDESK_*.zip"))
        if not zips:
            sys.exit("ZAPiXDESK produced no output (admin prompt declined, or decryption failed - see its window).")
        with zipfile.ZipFile(zips[-1]) as z:
            meta_name = next(n for n in z.namelist() if n.endswith("ZAPiXDESK.mtd.txt"))
            meta = z.read(meta_name).decode("utf-8", "replace")
        # the zip holds every decrypted chat: it dies with tmp right here
    lines = dict(re.findall(r"^(KEYTYPE\d|SESSION|DBKEY): *([0-9A-Fa-f]+)\s*$", meta, re.M))
    dbs: dict[str, str] = {}
    if "SESSION" in lines:  # WebView2 app (Dec 2025 onwards)
        sess = f"sessions/{lines['SESSION']}"
        for name in ("genericStorage",):
            if "KEYTYPE1" in lines:
                dbs[f"{sess}/{name}.db"] = lines["KEYTYPE1"]
        for name in ("contacts", "contactsState", "mediaDownloads", "abprops", "metaconfig"):
            if "KEYTYPE2" in lines:
                dbs[f"{sess}/{name}.db"] = lines["KEYTYPE2"]
    elif "DBKEY" in lines:  # older UWP app: one key for every database in LocalState
        dbs = {str(p.relative_to(ls)).replace("\\", "/"): lines["DBKEY"] for p in ls.rglob("*.db")}
    if not dbs:
        sys.exit("No database keys found in ZAPiXDESK's output. Run it by hand to see its messages.")
    save_secret(KEYS, {"dbs": dbs, "extracted": dt.datetime.now().isoformat()})
    log(f"extract-keys ok: keys for {len(dbs)} databases saved (DPAPI-protected)")


def _with_dbs(fn):
    keys = load_secret(KEYS) if KEYS.exists() else sys.exit("No keys yet: run extract-keys first.")
    cfg = json.loads(CONFIG.read_text(encoding="utf-8")) if CONFIG.exists() else {}
    with tempfile.TemporaryDirectory(prefix="abuarsam-wa-") as work:
        paths = decrypted_copy(Path(work), keys)
        con = open_dbs(paths, cfg.get("main_db", "genericStorage") if cfg.get("main_db", "genericStorage") in paths else next(iter(paths)))
        try:
            return fn(con, paths, cfg)
        finally:
            con.close()


def cmd_discover(_a) -> None:
    def show(con, paths, _cfg):
        for (schema,) in [(r[1],) for r in con.execute("PRAGMA database_list")]:
            print(f"\n=== database {schema}")
            for (t,) in con.execute(f"SELECT name FROM {schema}.sqlite_master WHERE type='table' ORDER BY name"):
                cols = ", ".join(c[1] for c in con.execute(f"PRAGMA {schema}.table_info('{t}')"))
                n = con.execute(f"SELECT count(*) FROM {schema}.\"{t}\"").fetchone()[0]
                print(f"  {t} ({n} rows): {cols}")
    _with_dbs(show)
    print(f"\nWhatsApp LocalState (media lives under here): {localstate()}")


def cmd_sql(a) -> None:
    reveal = getattr(a, "reveal", False)
    def trim(v):
        # by default keep only the shape of long text, so exploring the schema
        # does not pull whole chat messages into the terminal / transcript
        if not reveal and isinstance(v, str) and len(v) > 24:
            return f"<text {len(v)} chars>"
        return v
    def q(con, _p, _c):
        if not reveal:
            print("(long text hidden; add --reveal only when you run this yourself in a terminal)")
        for r in con.execute(a.query).fetchmany(a.limit):
            print({k: trim(v) for k, v in dict(r).items()})
    _with_dbs(q)


def cmd_test(a) -> None:
    cfg = load_config()
    if not cfg.get("messages_sql"):
        sys.exit("messages_sql is not in config.json yet (see SKILL.md, step 4).")
    reveal = getattr(a, "reveal", False)
    def q(con, _p, _c):
        contacts = contact_phones(con, cfg)
        rows = fetch(con, cfg, 0, time.time() - cfg.get("backfill_days", 30) * 86400)
        print(f"{len(rows)} rows in the first batch; first 10 after mapping"
              f"{'' if reveal else ' (text hidden; add --reveal only in your own terminal)'}:")
        for r in rows[:10]:
            m = normalise(r, cfg, contacts)
            if m and m["media_file"]:
                m["media_exists"] = (localstate() / m["media_file"]).exists() or Path(m["media_file"]).exists()
            print(json.dumps(_mask(m, reveal), ensure_ascii=False))
    _with_dbs(q)


def _resolve_media(path: str | None) -> Path | None:
    if not path:
        return None
    p = Path(path)
    p = p if p.is_absolute() else localstate() / p
    return p if p.is_file() else None


def _sweep_stale_temp() -> None:
    """Delete decrypted databases left behind by a run that was killed mid-way."""
    base = Path(tempfile.gettempdir())
    for d in list(base.glob("abuarsam-wa-*")) + list(base.glob("abuarsam-zx-*")):
        try:
            shutil.rmtree(d, ignore_errors=True)
        except Exception:
            log(f"could not clean leftover temp folder {d}")


def _mask(m: dict | None, reveal: bool) -> dict | None:
    """Hide chat contents unless --reveal, so `test`/`sql` output never carries private text."""
    if m is None or reveal:
        return m
    out = dict(m)
    if out.get("phone"):
        out["phone"] = re.sub(r"\d(?=\d{4})", "*", str(out["phone"]))
    if out.get("body") is not None:
        out["body"] = f"<text {len(str(out['body']))} chars>"
    for k in ("contact_name", "media_name"):
        if out.get(k):
            out[k] = "<hidden>"
    return out


def cmd_run(_a) -> None:
    cfg = load_config()
    if not cfg.get("messages_sql"):
        sys.exit("messages_sql is not configured yet.")
    APP_DIR.mkdir(parents=True, exist_ok=True)
    if LOCK.exists() and time.time() - LOCK.stat().st_mtime < 30 * 60:
        return  # previous run still going
    LOCK.write_text(str(os.getpid()))
    try:
        _sweep_stale_temp()
        state = load_state()
        # the panel sends only SHA-256 of each blacklisted number, never the numbers
        blocked = set(api(cfg, "GET", "/api/whatsapp/agent")["blacklist_sha256"])

        def is_blocked(phone: str) -> bool:
            return hashlib.sha256(phone_key(phone).encode()).hexdigest() in blocked

        def sync(con, _p, _c):
            contacts = contact_phones(con, cfg)
            cursor = int(state.get("cursor", 0))
            # the backfill window is fixed at the first run, so late rows with old dates stay out
            since = state.setdefault("since", time.time() - cfg.get("backfill_days", 30) * 86400)
            sent = 0
            for _ in range(MAX_BATCHES_PER_RUN):
                rows = fetch(con, cfg, cursor, since)
                if not rows:
                    break
                out = []
                for r in rows:
                    m = normalise(r, cfg, contacts)
                    if m and not is_blocked(m["phone"]):
                        media = _resolve_media(m.pop("media_file"))
                        if media:
                            try:
                                m["media_path"] = upload_media(cfg, media)
                                m["media_name"] = m["media_name"] or media.name
                            except Exception as e:  # keep the text even if the file fails
                                log(f"media upload failed for {m['id']}: {e}")
                        out.append(m)
                if out:
                    sent += api(cfg, "POST", "/api/whatsapp/agent", {"messages": out, "agent": f"{VERSION}/{os.environ.get('COMPUTERNAME', '')}"})["stored"]
                cursor = int(rows[-1]["cursor"])
                state["cursor"] = cursor
                save_state(state)
                if len(rows) < BATCH:
                    break
            if not sent:  # still tell the panel we are alive
                api(cfg, "POST", "/api/whatsapp/agent", {"messages": [], "agent": f"{VERSION}/{os.environ.get('COMPUTERNAME', '')}"})
            return sent

        n = _with_dbs(sync)
        state["last_ok"] = dt.datetime.now().isoformat()
        save_state(state)
        log(f"run ok: {n} messages sent")
    except Exception as e:
        log(f"run failed: {e}\n{traceback.format_exc()}")
        raise
    finally:
        LOCK.unlink(missing_ok=True)


def cmd_install_task(_a) -> None:
    pyw = Path(sys.executable).with_name("pythonw.exe")
    exe = pyw if pyw.exists() else Path(sys.executable)
    tr = f'"{exe}" "{Path(__file__).resolve()}" run'
    subprocess.run(["schtasks", "/Create", "/F", "/SC", "MINUTE", "/MO", "5", "/TN", TASK_NAME, "/TR", tr], check=True)
    log(f"scheduled task «{TASK_NAME}» runs every 5 minutes")


def cmd_remove_task(_a) -> None:
    subprocess.run(["schtasks", "/Delete", "/F", "/TN", TASK_NAME], check=False)


def cmd_status(_a) -> None:
    cfg = load_config()
    print("panel:", cfg.get("panel"), "| mapping set:", bool(cfg.get("messages_sql")), "| keys:", KEYS.exists())
    print("state:", load_state())
    try:
        print("blacklisted numbers on the panel:", len(api(cfg, "GET", "/api/whatsapp/agent")["blacklist_sha256"]))
    except Exception as e:
        print("panel check failed:", e)
    if LOG.exists():
        print("".join(LOG.read_text(encoding="utf-8").splitlines(keepends=True)[-8:]))


def main() -> None:
    p = argparse.ArgumentParser(description="Abu Arsam office WhatsApp sync")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("setup")
    s.add_argument("--panel", required=True)
    s.add_argument("--token", default=None, help="optional; omit it to type the key at a hidden prompt")
    q = sub.add_parser("sql")
    q.add_argument("query")
    q.add_argument("--limit", type=int, default=20)
    q.add_argument("--reveal", action="store_true", help="show full text (run this yourself in a terminal)")
    t = sub.add_parser("test")
    t.add_argument("--reveal", action="store_true", help="show full text (run this yourself in a terminal)")
    for name in ("extract-keys", "discover", "run", "install-task", "remove-task", "status"):
        sub.add_parser(name)
    a = p.parse_args()
    {"setup": cmd_setup, "extract-keys": cmd_extract_keys, "discover": cmd_discover, "sql": cmd_sql, "test": cmd_test,
     "run": cmd_run, "install-task": cmd_install_task, "remove-task": cmd_remove_task, "status": cmd_status}[a.cmd](a)


if __name__ == "__main__":
    main()
