---
name: abuarsam-whatsapp
description: Install, check or repair the Abu Arsam office WhatsApp sync on this Windows PC. It reads new messages, voices and files from the installed WhatsApp Desktop app (local database + media folder) and sends them to the Abu Arsam admin panel (abuarsam.com/admin, «صندوق واتس‌اپ»). Use when asked to install it, when the panel says the office WhatsApp is disconnected, or after a WhatsApp update stops it.
---

# Abu Arsam office WhatsApp sync

`wa_sync.py` (next to this file) is the whole program. It is **read-only towards WhatsApp**:
it copies WhatsApp's encrypted databases to a temp folder, decrypts the copy, reads new
1:1 messages, uploads them with their voice/photo/document files to the panel, and deletes
the temp folder. It never writes to WhatsApp, never sends WhatsApp messages, skips groups,
status and channels, and skips every number on the panel's blacklist.

## Rules while you work
- Message contents are private. `discover`, `test` and `sql` hide chat text, names, file
  names and phone numbers by default and show only their shape (type codes, hex message ids,
  timestamps and the last 4 digits of a number stay visible). Do not add `--reveal`, and if a value must be seen, tell the person to
  run that command themselves in a terminal. Never paste chat contents into your replies, and
  never upload, email or copy the decrypted databases or the ZAPiXDESK output anywhere.
  `wa_sync.py` deletes them itself.
- The panel side must be ready first, in this order: `supabase_migration_whatsapp_sync.sql`,
  then `supabase_migration_whatsapp_blacklist_guard.sql`, then the code deployed. If the
  «صندوق واتس‌اپ» screen says it is not set up yet, stop and report it.
- Before going live, make sure the owner has put every private number (family and such) on the
  panel's blacklist (Settings → «لیست سیاه شماره‌ها», typed **with the country code**, e.g.
  `+968…`, `+964…`): blacklisting a number also deletes whatever was already synced for it.
- Do not change WhatsApp's own files and do not uninstall or re-login WhatsApp.
- The only network targets are the panel URL in config, the panel's file storage
  (`ftzmlowdyozcowsorcnp.supabase.co`, where voices and files are uploaded through signed links)
  and GitHub (pinned ZAPiXDESK, step 3). If a firewall or antivirus filters traffic, all three
  must be allowed.
- If a step fails in a way this file does not cover, stop and report the exact error.

## Install (first time)

1. **Check the PC.**
   - WhatsApp must be the Microsoft Store app, installed and signed in:
     `%LOCALAPPDATA%\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState` must exist.
   - Python 3.11 or newer: `python --version`. If it is missing, install it for this user only
     (no admin): `winget install -e --id Python.Python.3.12 --scope user`, then open a new terminal.
   - `python -m pip install --user cryptography`
   - The signed-in Windows user must be an administrator (`whoami /groups` lists
     `S-1-5-32-544`). Step 3 elevates **this same user**; approving the UAC prompt with another
     account's password would read that account's profile instead. If the user is not an
     admin, stop and report it (`extract-keys` refuses too).

2. **Put the program in place and connect it to the panel.**
   - Copy this folder to `%LOCALAPPDATA%\AbuArsamWA\agent\`. Run every later command from there.
   - The key comes from the panel: Settings → «اتصال واتس‌اپ دفتر» → «ساخت کلید اتصال»
     (starts with `wa_`). **Do not ask the person to paste the key to you, and do not put it
     on the command line** — it would land in your transcript and in the shell history.
   - Run `python wa_sync.py setup --panel https://www.abuarsam.com` and tell the person to
     paste the key at the hidden `Paste the agent key` prompt themselves.
     It must print `setup ok`. The key is stored encrypted with Windows DPAPI.

3. **Extract the database keys (one time, needs a person at the PC).**
   - Tell the person: an admin (UAC) prompt will appear, and WhatsApp will close for under a
     minute and reopen.
   - `python wa_sync.py extract-keys`
   - It downloads ZAPiXDESK at a pinned commit, checks the SHA-256 of both files, and refuses
     to run anything else. It saves only the database keys, DPAPI-protected, in `keys.bin`.
   - If the admin prompt cannot be approved on this PC by this same user, stop and report that.

4. **Map the WhatsApp tables (the WhatsApp schema is not documented and changes between versions).**
   - `python wa_sync.py discover` lists every database, table, column and row count.
     The main database is `genericStorage` (messages); `contacts` and `mediaDownloads` are
     attached under those names.
   - Explore with `python wa_sync.py sql "<query>" --limit 5`. Find:
     - the messages table: message id, chat id (jid), direction (from me), timestamp, text or
       caption, and message type;
     - the contact name (contacts database or a push-name column);
     - for media, the local file path (often in `mediaDownloads`), absolute or relative to
       LocalState.
   - Write `messages_sql` into `%LOCALAPPDATA%\AbuArsamWA\config.json`.
     - It must return these column names: `cursor` (an integer that only grows, usually the
       rowid), `id`, `chat_jid` (the id of the **chat**, never of the sender: in a group the
       sender is a person's jid, and using it would let group messages through as 1:1 chats), `from_me` (0/1), `ts` (unix seconds or ms), `body`, `kind`,
       `media_file`, `media_mime`, `media_name`, `contact_name`. Optionally it can also return
       `phone`.
     - It must end with: `WHERE <cursor> > :cursor AND <ts> >= :since ORDER BY <cursor> LIMIT :limit`.
       Use `:since_ms` instead of `:since` if the timestamps are in ms.
   - Add `kind_map` to translate WhatsApp's own type values into
     `text | voice | image | video | document | sticker | other`, for example
     `{"chat": "text", "ptt": "voice", "image": "image", "document": "document"}`.
   - If chats use `@lid` ids instead of phone numbers, add `lid_phone_sql` returning two
     columns (lid jid, phone number) so customers are matched by phone.
   - `backfill_days` (default 30) decides how far back the first run goes.

5. **Check before sending anything.**
   - `python wa_sync.py test` prints 10 mapped messages and sends nothing; chat text, names and
     full numbers are hidden, so you can check the mapping's shape (direction `from_me`, times,
     `kind`, `media_exists`, that a phone is present) without reading private content.
   - If the person needs to confirm the actual names or text look right, have them run
     `python wa_sync.py test --reveal` themselves in a terminal. Fix the mapping until it is right.
   - Media must be the real files: `media_file` should end in a normal extension (`.opus`,
     `.jpg`, `.pdf`, …) and `media_exists` be true. If the media under LocalState is stored
     encrypted (e.g. `.enc` files or unreadable bytes), stop and report it: the agent uploads
     files as they are and cannot decrypt media.

6. **Go live.**
   - `python wa_sync.py run` once. It must print `run ok: N messages sent`.
   - Ask the person to open abuarsam.com/admin → «صندوق واتس‌اپ» and confirm the chats appear
     with voices playing.
   - `python wa_sync.py install-task` runs it every 5 minutes, no admin needed and no window.
     The PC and WhatsApp must stay on and signed in.

7. **Report**: the output of `python wa_sync.py status`, and anything that needed a choice.

## Repair
- **`status` / `log.txt`** in `%LOCALAPPDATA%\AbuArsamWA\` show the last runs.
- **«a key is wrong», `file is not a database`, or WhatsApp was reinstalled or re-linked:**
  run `extract-keys` again (step 3), then `test`.
- **Messages stopped after a WhatsApp update but the keys work:** the schema changed. Redo
  step 4 with `discover`, then `test`.
- **«WhatsApp is holding ... locked»:** WhatsApp keeps the file open without sharing.
  - Report this; do not work around it silently.
  - As a last resort, with the owner's OK, the sync can run while WhatsApp is closed (for
    example at night).
- **HTTP 401 from the panel:** the key was replaced in Settings. Run `setup` again with the
  new key.
- **Stop everything:** `python wa_sync.py remove-task`.
