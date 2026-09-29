'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PenLine, Trash2, Upload, Loader2, Settings } from 'lucide-react';
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

export default function SettingsScreen() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings/signature')
      .then(r => r.json())
      .then(d => setUrl(d.url || null))
      .catch(() => toast.error('خطا در دریافت امضا'))
      .finally(() => setLoading(false));
  }, []);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const png = await toTransparentSignature(file);
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
    </div>
  );
}
