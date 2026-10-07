'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wallet, Loader2, AlertTriangle } from 'lucide-react';
import OMRIcon from '@/components/omr-icon';
import type { CarTransaction } from '@/lib/db-cars';
import { summarizeContractFinance } from '@/lib/contract-finance';

const STATUS_BADGE = {
  paid: { label: 'پرداخت کامل', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  partial: { label: 'پرداخت ناقص', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  unpaid: { label: 'پرداخت‌نشده', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
} as const;

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 3 });

// Live financial position of a contract, read from its accounting rows. `refreshKey` changes after every
// save so the figures follow the edit; `dirty` warns that the form holds changes the figures do not include yet.
export default function ContractFinanceCard({ reservationId, refreshKey, dirty }: {
  reservationId: string;
  refreshKey: unknown;
  dirty?: boolean;
}) {
  const [rows, setRows] = useState<CarTransaction[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!reservationId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setFailed(false);
    fetch('/api/cars/transactions')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((all: CarTransaction[]) => {
        if (!cancelled) setRows(all.filter(t => t.reservationId === reservationId));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId, refreshKey]);

  const finance = useMemo(() => (rows ? summarizeContractFinance(rows) : null), [rows]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-black text-white">
          <Wallet size={15} className="text-gold" /> وضعیت مالی قرارداد
        </div>
        {finance && finance.status !== 'none' && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE[finance.status].cls}`}>
            {STATUS_BADGE[finance.status].label}
          </span>
        )}
      </div>

      {failed ? (
        <p className="text-[11px] text-rose-300">دریافت وضعیت مالی ناموفق بود.</p>
      ) : !finance ? (
        <div className="flex items-center gap-2 text-[11px] text-white/50"><Loader2 size={13} className="animate-spin" /> در حال دریافت...</div>
      ) : finance.status === 'none' ? (
        <p className="text-[11px] text-white/50">هنوز ردیف مالی برای این قرارداد ثبت نشده است.</p>
      ) : (
        <>
          {dirty && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-2 text-[10.5px] leading-5 text-amber-200">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>تغییرات فرم هنوز ذخیره نشده؛ این ارقام پس از ذخیره‌ی قرارداد به‌روز می‌شوند.</span>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-white/10 text-[11px]">
            <div className="grid grid-cols-4 bg-white/5 px-2.5 py-1.5 font-bold text-white/60">
              <span>بند</span><span className="text-left">کل</span><span className="text-left">پرداخت‌شده</span><span className="text-left">مانده</span>
            </div>
            {finance.lines.filter(l => l.key !== 'deposit').map(l => (
              <div key={l.key} className="grid grid-cols-4 border-t border-white/5 px-2.5 py-1.5 font-mono text-white/80">
                <span className="font-sans text-white/70">{l.label}</span>
                <span className="text-left">{fmt(l.total)}</span>
                <span className="text-left text-emerald-300">{fmt(l.paid)}</span>
                <span className={`text-left ${l.owed > 0 ? 'text-rose-300' : 'text-white/40'}`}>{fmt(l.owed)}</span>
              </div>
            ))}
            <div className="grid grid-cols-4 border-t border-white/10 bg-white/5 px-2.5 py-1.5 font-mono font-bold text-white">
              <span className="font-sans">جمع</span>
              <span className="text-left">{fmt(finance.totalCharged)}</span>
              <span className="text-left text-emerald-300">{fmt(finance.totalPaid)}</span>
              <span className="text-left text-rose-300">{fmt(finance.totalOwed)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-white/60">
            <span className="inline-flex items-center gap-1">مانده بدهی مشتری: <b className="text-white">{fmt(finance.totalOwed)}</b> <OMRIcon size="sm" /></span>
            {finance.depositCredit > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-300">ودیعه‌ی دریافت‌شده (طلب مشتری): <b>{fmt(finance.depositCredit)}</b> <OMRIcon size="sm" /></span>
            )}
            {finance.depositPending > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-300">ودیعه‌ی دریافت‌نشده: <b>{fmt(finance.depositPending)}</b> <OMRIcon size="sm" /></span>
            )}
            {finance.unconfirmed > 0 && (
              <span className="inline-flex items-center gap-1 text-sky-300">دریافت‌تأییدنشده: <b>{fmt(finance.unconfirmed)}</b> <OMRIcon size="sm" /></span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
