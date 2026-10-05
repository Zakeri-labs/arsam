'use client';

import { use, useEffect, useState } from 'react';
import { Download, Loader2, FileText, AlertTriangle } from 'lucide-react';
import type { ContractData } from '@/lib/contract-data';
import { useContractPdf } from '@/components/use-contract-pdf';

// Public page behind a contract's share link: no login, nothing to edit — only the PDF download.

class LinkError extends Error {
  constructor(public code: 'expired' | 'revoked' | 'invalid') {
    super(code);
  }
}

const ERROR_TEXT = {
  expired: { en: 'This link has expired.', ar: 'انتهت صلاحية الرابط', fa: 'مهلت این لینک تمام شده است' },
  revoked: { en: 'This link is no longer active.', ar: 'تم إلغاء هذا الرابط', fa: 'این لینک باطل شده است' },
  invalid: { en: 'This link is not valid.', ar: 'الرابط غير صالح', fa: 'لینک معتبر نیست' },
};

export default function SharedContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [error, setError] = useState<'expired' | 'revoked' | 'invalid' | null>(null);
  const [failed, setFailed] = useState(false);
  const pdf = useContractPdf();

  useEffect(() => {
    fetch(`/api/contract-share/${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.contract) throw new LinkError(data.code === 'expired' || data.code === 'revoked' ? data.code : 'invalid');
        setContract(data.contract);
        setSignatureUrl(data.signatureUrl || null);
      })
      .catch(err => setError(err instanceof LinkError ? err.code : 'invalid'));
  }, [token]);

  const download = async () => {
    if (!contract) return;
    setFailed(false);
    try {
      await pdf.download(contract, signatureUrl);
    } catch {
      setFailed(true);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#070e1b] via-[#0f1e37] to-[#162a4a] px-4 py-10 font-sans text-white">
      {pdf.element}
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl backdrop-blur-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ARSAM" className="mx-auto h-20 w-20 rounded-2xl bg-white object-contain p-2 shadow-lg" />
        <div className="mt-2 text-[11px] font-black tracking-[0.25em] text-[#c9a04a]">ARSAM RENT A CAR</div>

        {error ? (
          <div className="mt-6 space-y-2">
            <AlertTriangle className="mx-auto text-amber-400" />
            <p className="text-sm font-bold">{ERROR_TEXT[error].en}</p>
            <p className="text-[12px] text-white/55" dir="rtl">{ERROR_TEXT[error].ar} · {ERROR_TEXT[error].fa}</p>
            {error !== 'invalid' && (
              <p className="pt-2 text-[12px] text-white/70">
                Please contact ARSAM Rent a Car for a new link.
                <span className="mt-0.5 block" dir="rtl">لطفاً برای دریافت لینک جدید با آرسام تماس بگیرید.</span>
              </p>
            )}
          </div>
        ) : !contract ? (
          <Loader2 className="mx-auto mt-8 animate-spin text-[#c9a04a]" />
        ) : (
          <>
            <div className="mt-6 flex items-center justify-center gap-2 text-base font-black">
              <FileText size={18} className="text-[#c9a04a]" />
              Car Rental Agreement
            </div>
            <div className="mt-0.5 text-[13px] font-bold text-white/70" dir="rtl">عقد إيجار سيارة · قرارداد اجاره خودرو</div>

            <dl className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-[12px]">
              {[
                ['No.', (contract.contractNo || contract.id).toUpperCase()],
                ['Renter', contract.customerNameEn || contract.customerName],
                ['Car', `${contract.carTitleEn || contract.carTitle} · ${contract.plateNumber}`],
                ['Period', `${contract.startDate} → ${contract.endDate}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-white/45">{k}</dt>
                  <dd className="truncate font-bold">{v}</dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={download}
              disabled={pdf.busy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#c9a04a] to-amber-500 py-3.5 text-[14px] font-black text-black shadow-lg shadow-amber-900/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
            >
              {pdf.busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {pdf.busy ? `Preparing PDF${pdf.progress ? ` ${pdf.progress.done}/${pdf.progress.total}` : '...'}` : 'Download PDF'}
            </button>
            <div className="mt-2 text-[11.5px] font-semibold text-white/50" dir="rtl">تحميل العقد · دانلود قرارداد</div>
            {failed && <p className="mt-3 text-[12px] text-rose-300">Download failed, please try again.</p>}
          </>
        )}
      </div>
    </main>
  );
}
