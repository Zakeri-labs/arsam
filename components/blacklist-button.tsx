'use client';

import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmDialog } from '@/components/confirm-dialog';

// Small "Blacklist" button next to a phone number (Mr Zakeri, 21 Nov 2026).
// A blacklisted number disappears from the requests and customers lists;
// the general manager can take it off the list in Settings.
export default function BlacklistButton({
  phone,
  name,
  onDone,
}: {
  phone: string;
  name?: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const block = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: 'افزودن به لیست سیاه',
      message: `شماره‌ی ⁦${phone}⁩${name ? ` (${name})` : ''} دیگر در درخواست‌ها و لیست مشتریان نمی‌آید. برداشتن از لیست سیاه از بخش تنظیمات ممکن است.`,
      confirmText: 'بلاک شود',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در افزودن به لیست سیاه');
      toast.success('شماره به لیست سیاه رفت');
      onDone();
    } catch (err: any) {
      toast.error(err?.message || 'خطا در افزودن به لیست سیاه');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={block}
      disabled={busy}
      title="افزودن به لیست سیاه"
      aria-label={`افزودن ${phone} به لیست سیاه`}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-transparent px-1.5 py-1 font-sans text-[10.5px] font-bold tracking-normal text-white/45 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 disabled:opacity-60 sm:text-[11px]"
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
      Blacklist
    </button>
  );
}
