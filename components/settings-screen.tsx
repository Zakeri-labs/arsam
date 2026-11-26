'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PenLine, Trash2, Upload, Loader2, Settings, Check, Ban, Undo2, MessageCircle, Copy, KeyRound } from 'lucide-react';
import SignaturePad from '@/components/signature-pad';
import { confirmDialog } from '@/components/confirm-dialog';

// General-manager settings. Company signature: printed in the "In charge signature" box of every contract.

const MAX_WIDTH = 900;

/**
 * Turns a photo/scan of a signature into a clean transparent PNG:
 * near-white paper becomes transparent and the empty margins are cropped.
 */
async function toTransparentSignature(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bitmap) throw new Error('این فرمت تصویر پشتیبانی نمی‌شود؛ PNG یا JPG انتخاب کنید.');
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // Soft threshold keeps anti-aliased pen edges smooth
      const alpha = d[i + 3] * Math.max(0, Math.min(1, (225 - lum) / 60));
      d[i + 3] = alpha;
      if (alpha > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('امضایی در تصویر پیدا نشد؛ امضا را با خودکار تیره روی کاغذ سفید بکشید.');
  ctx.putImageData(img, 0, 0);

  const pad = 8;
  const cx = Math.max(0, minX - pad);
  const cy = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad) - cx;
  const ch = Math.min(h, maxY + pad) - cy;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d')!.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
  const blob = await new Promise<Blob | null>(r => out.toBlob(r, 'image/png'));
  if (!blob) throw new Error('خطا در پردازش تصویر امضا');
  return new File([blob], 'signature.png', { type: 'image/png' });
}

interface BlacklistEntry {
  key: string;
  phone: string;
  name: string | null;
  createdBy: string | null;
  createdAt: string;
}

// Numbers blacklisted from the requests / customers screens (Mr Zakeri, 21 Nov 2026).
function BlacklistSection() {
  const [items, setItems] = useState<BlacklistEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyPhone, setBusyPhone] = useState<string | null>(null);

  const load = () => {
    setFailed(false);
    setItems(null);
    fetch('/api/blacklist')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setFailed(true));
  };

  useEffect(load, []);

  const unblock = async (item: BlacklistEntry) => {
    if (!(await confirmDialog({ title: 'برداشتن از لیست سیاه', message: `شماره‌ی \u2066${item.phone}\u2069 دوباره در درخواست‌ها و مشتریان نمایش داده شود؟`, confirmText: 'برداشتن از لیست' }))) return;
    setBusyPhone(item.key);
    try {
      const res = await fetch(`/api/blacklist?key=${encodeURIComponent(item.key)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems(prev => (prev || []).filter(i => i.key !== item.key));
      toast.success('شماره از لیست سیاه برداشته شد');
    } catch {
      toast.error('خطا در برداشتن از لیست سیاه');
    } finally {
      setBusyPhone(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b172a] p-4 shadow-lg sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <Ban size={17} className="mt-0.5 shrink-0 text-rose-300" />
        <div>
          <h3 className="text-[13px] font-black">لیست سیاه شماره‌ها</h3>
          <p className="mt-1 text-[11px] leading-5 text-white/50">
            این شماره‌ها (مثلاً خانواده و آشنایان) در درخواست‌ها و لیست مشتریان نمی‌آیند. با دکمه‌ی Blacklist کنار هر شماره اضافه می‌شوند.
          </p>
        </div>
      </div>

      {failed ? (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[11.5px] font-bold text-rose-300">
          خطا در بارگذاری لیست سیاه
          <button type="button" onClick={load} className="mr-2 underline hover:text-rose-200">تلاش دوباره</button>
        </p>
      ) : items === null ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-white/40" /></div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-[12px] font-bold text-white/40">هیچ شماره‌ای در لیست سیاه نیست</p>
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
          {items.map(item => (
            <li key={item.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <bdo dir="ltr" className="block font-mono text-[12.5px] font-black tracking-wide" style={{ unicodeBidi: 'bidi-override', direction: 'ltr' }}>
                  {item.phone}
                </bdo>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-[10.5px] text-white/45">
                  {item.name && <span>{item.name}</span>}
                  <span>{new Date(item.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  {item.createdBy && <span>بلاک توسط <bdi>{item.createdBy}</bdi></span>}
                </p>
              </div>
              <button
                type="button"
                disabled={busyPhone === item.key}
                onClick={() => unblock(item)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-60"
              >
                {busyPhone === item.key ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
                برداشتن از لیست
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SyncStatus {
  connected: boolean;
  tokenCreated: string | null;
  lastSeenAt: string | null;
  lastBatch: number | null;
  agentInfo: string | null;
}

const faDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Office WhatsApp agent (windows-agent/): status and its access key.
function WhatsAppSection() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const load = () => {
    setFailed(false);
    fetch('/api/whatsapp/token')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setStatus)
      .catch(() => setFailed(true));
  };

  useEffect(load, []);

  const makeToken = async () => {
    if (status?.connected && !(await confirmDialog({
      title: 'کلید اتصال تازه',
      message: 'با ساختن کلید تازه، کلید قبلی روی سیستم دفتر دیگر کار نمی‌کند و باید کلید تازه را آن‌جا وارد کنید. ادامه می‌دهید؟',
      confirmText: 'ساخت کلید تازه',
    }))) return;
    setBusy(true);
    try {
      const res = await fetch('/api/whatsapp/token', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(data.error);
      setToken(data.token);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ساخت کلید اتصال');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token || '');
      toast.success('کلید کپی شد');
    } catch {
      toast.error('کپی نشد؛ کلید را دستی انتخاب کنید');
    }
  };

  const seenMinutes = status?.lastSeenAt ? (Date.now() - new Date(status.lastSeenAt).getTime()) / 60000 : null;
  const live = seenMinutes !== null && seenMinutes < 20;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b172a] p-4 shadow-lg sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <MessageCircle size={17} className="mt-0.5 shrink-0 text-emerald-300" />
        <div>
          <h3 className="text-[13px] font-black">اتصال واتس‌اپ دفتر</h3>
          <p className="mt-1 text-[11px] leading-5 text-white/50">
            برنامه‌ی کوچکی روی سیستم ویندوز دفتر، هر چند دقیقه پیام‌ها، ویس‌ها و فایل‌های تازه‌ی واتس‌اپ را می‌خواند و به «صندوق واتس‌اپ» می‌فرستد. شماره‌های لیست سیاه فرستاده نمی‌شوند.
          </p>
        </div>
      </div>

      {failed ? (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[11.5px] font-bold text-rose-300">
          خطا در خواندن وضعیت اتصال
          <button type="button" onClick={load} className="mr-2 underline hover:text-rose-200">تلاش دوباره</button>
        </p>
      ) : status === null ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-white/40" /></div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className={`rounded-full border px-2.5 py-0.5 font-bold ${live ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/15 bg-white/5 text-white/60'}`}>
              {!status.connected ? 'وصل نشده' : live ? 'وصل است' : status.lastSeenAt ? 'قطع است' : 'منتظر اولین اتصال'}
            </span>
            {status.lastSeenAt && (
              <span className="text-white/50">
                آخرین همگام‌سازی: {faDateTime(status.lastSeenAt)}{status.lastBatch !== null ? ` · ${status.lastBatch.toLocaleString('fa-IR')} پیام` : ''}
              </span>
            )}
          </div>

          {token && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-3">
              <p className="mb-2 text-[11px] leading-5 text-gold">این کلید فقط همین یک بار نشان داده می‌شود. آن را در نصب برنامه روی سیستم دفتر وارد کنید.</p>
              <div className="flex items-center gap-2">
                <code dir="ltr" className="min-w-0 flex-1 truncate rounded-lg bg-[#07111f] px-2.5 py-2 font-mono text-[11.5px] text-white">{token}</code>
                <button type="button" onClick={copy} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gold/40 px-3 py-2 text-[11px] font-bold text-gold hover:bg-gold/10">
                  <Copy size={13} /> کپی
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={makeToken}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-bold text-white/85 hover:bg-white/10 disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            {status.connected ? 'ساخت کلید اتصال تازه' : 'ساخت کلید اتصال'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsScreen() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawn, setDrawn] = useState<Blob | null>(null);

  useEffect(() => {
    fetch('/api/settings/signature')
      .then(r => r.json())
      .then(d => setUrl(d.url || null))
      .catch(() => toast.error('خطا در دریافت امضا'))
      .finally(() => setLoading(false));
  }, []);

  const upload = async (file: File, alreadyPng = false) => {
    setBusy(true);
    try {
      const png = alreadyPng ? file : await toTransparentSignature(file);
      const form = new FormData();
      form.append('file', png);
      const res = await fetch('/api/settings/signature', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'خطا در ذخیره امضا');
      setUrl(data.url);
      toast.success('امضای شرکت ذخیره شد و زیر همه قراردادها قرار می‌گیرد');
    } catch (err: any) {
      toast.error(err?.message || 'خطا در ذخیره امضا');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirmDialog({ title: 'حذف امضا', message: 'امضای شرکت حذف شود؟ قراردادها بدون امضا دانلود می‌شوند.', confirmText: 'حذف امضا' }))) return;
    setBusy(true);
    try {
      const res = await fetch('/api/settings/signature', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUrl(null);
      toast.success('امضا حذف شد');
    } catch {
      toast.error('خطا در حذف امضا');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 text-white" dir="rtl">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b172a] p-4 shadow-lg">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <Settings size={19} />
        </span>
        <div>
          <h2 className="text-sm font-black">تنظیمات</h2>
          <p className="mt-0.5 text-[11px] text-white/45">تنظیمات عمومی پنل و قراردادها (فقط مدیر کل)</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b172a] p-4 shadow-lg sm:p-5">
        <div className="mb-4 flex items-start gap-2.5">
          <PenLine size={17} className="mt-0.5 shrink-0 text-gold" />
          <div>
            <h3 className="text-[13px] font-black">امضای شرکت روی قراردادها</h3>
            <p className="mt-1 text-[11px] leading-5 text-white/50">
              این امضا در کادر «توقيع المسؤول» پایین همه‌ی قراردادهای دانلودی قرار می‌گیرد. می‌توانید از امضا روی کاغذ سفید عکس بگیرید؛
              پس‌زمینه‌ی سفید خودکار حذف و حاشیه‌ها بریده می‌شوند.
            </p>
          </div>
        </div>

        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white p-4">
          {loading ? (
            <Loader2 className="animate-spin text-gray-400" />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="امضای شرکت" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[12px] font-bold text-gray-400">هنوز امضایی ثبت نشده است</span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-gold to-amber-500 py-3 text-[12.5px] font-black text-black shadow-lg shadow-gold/15 hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {url ? 'جایگزینی فایل امضا' : 'بارگذاری فایل امضا'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { setDrawn(null); setDrawing(d => !d); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 py-3 text-[12.5px] font-black text-gold hover:bg-gold/20 disabled:opacity-60"
          >
            <PenLine size={16} />
            امضا با انگشت یا قلم
          </button>
          {url && (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-[12px] font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
            >
              <Trash2 size={15} />
              حذف امضا
            </button>
          )}
        </div>
        {drawing && (
          <div className="mt-4 rounded-2xl bg-white p-3">
            <SignaturePad onChange={setDrawn} />
            <button
              type="button"
              disabled={busy || !drawn}
              onClick={async () => {
                if (!drawn) return;
                await upload(new File([drawn], 'signature.png', { type: 'image/png' }), true);
                setDrawing(false);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-gold to-amber-500 py-3 text-[12.5px] font-black text-black disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              ذخیره امضا
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </div>

      <BlacklistSection />

      <WhatsAppSection />
    </div>
  );
}
