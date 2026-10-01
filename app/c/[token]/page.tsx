'use client';

import { use, useEffect, useRef, useState } from 'react';
import { Download, Loader2, FileText, AlertTriangle } from 'lucide-react';
import type { ContractData } from '@/lib/contract-data';
import { useContractPdf } from '@/components/use-contract-pdf';
import ContractDocument, { PAGE_WIDTH } from '@/components/contract-document';

// Public page behind a contract's share link: no login, nothing to edit. The contract opens right away
// as the document itself (shrunk to fit the screen); the PDF download is a button above it.

// Shows the fixed-width A4 pages scaled down to the available width (never scaled up)
function FitToWidth({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      const scale = Math.min(1, outer.current.clientWidth / PAGE_WIDTH);
      setFit({ scale, height: inner.current.scrollHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="mx-auto w-full" style={{ maxWidth: PAGE_WIDTH, height: fit.height || undefined }}>
      <div ref={inner} style={{ width: PAGE_WIDTH, transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

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

  if (error || !contract) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#070e1b] via-[#0f1e37] to-[#162a4a] px-4 py-10 font-sans text-white">
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
          ) : (
            <Loader2 className="mx-auto mt-8 animate-spin text-[#c9a04a]" />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-[#070e1b] via-[#0f1e37] to-[#162a4a] font-sans text-white">
      {pdf.element}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#070e1b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[794px] items-center justify-between gap-3 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ARSAM" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate text-[13px] font-black">
                <FileText size={14} className="shrink-0 text-[#c9a04a]" />
                Car Rental Agreement
              </div>
              <div className="truncate text-[10.5px] font-semibold text-white/55" dir="rtl">
                {(contract.contractNo || contract.id).toUpperCase()} · عقد إيجار سيارة · قرارداد اجاره خودرو
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={pdf.busy}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#c9a04a] to-amber-500 px-3.5 py-2 text-[12px] font-black text-black shadow-lg shadow-amber-900/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
          >
            {pdf.busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {pdf.busy ? `${pdf.progress ? `${pdf.progress.done}/${pdf.progress.total}` : '...'}` : 'PDF'}
          </button>
        </div>
        {failed && <p className="pb-2 text-center text-[11.5px] text-rose-300">Download failed, please try again.</p>}
      </header>

      <div className="px-3 py-4">
        <FitToWidth>
          <ContractDocument contract={contract} signatureUrl={signatureUrl} />
        </FitToWidth>
      </div>
    </main>
  );
}
