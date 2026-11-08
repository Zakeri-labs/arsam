'use client';

import { use, useEffect, useRef, useState } from 'react';
import { Download, Loader2, FileText, AlertTriangle, PenLine, CheckCircle2 } from 'lucide-react';
import SignaturePad from '@/components/signature-pad';
import type { ContractData } from '@/lib/contract-data';
import { useContractPdf } from '@/components/use-contract-pdf';
import { canAutoSave, canDeliverPdf, contractPdfFileName, deliverPdf, saveBlob } from '@/lib/contract-pdf';
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

// Remembered per tab, so refreshing the page does not save a duplicate file
function wasAutoSaved(key: string) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function rememberAutoSaved(key: string) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // private mode: at worst a refresh saves the file again
  }
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

function Notice({ tone, role, lines, children }: { tone: 'amber' | 'rose' | 'gold'; role?: 'alert'; lines: [string, string, string]; children?: React.ReactNode }) {
  const tones = {
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    gold: 'border-[#c9a04a]/30 bg-[#c9a04a]/10 text-[#e8cf94]',
  };
  return (
    <div role={role} className={`mx-auto mt-3 max-w-[770px] space-y-1 rounded-2xl border p-3 text-center text-[12px] font-semibold ${tones[tone]}`}>
      <p>{lines[0]}</p>
      <p dir="rtl" className="text-center!">{lines[1]}</p>
      <p dir="rtl" className="text-center!">{lines[2]}</p>
      {children}
    </div>
  );
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200';

export default function SharedContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [error, setError] = useState<'expired' | 'revoked' | 'invalid' | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState<Blob | null>(null); // the finished PDF, waiting for the customer's tap
  const [blocked, setBlocked] = useState(false); // this in-app browser cannot save files
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);
  const [tapped, setTapped] = useState(false); // the customer already took this file
  const [justSaved, setJustSaved] = useState(false); // brief tick on the button after a tap
  const delivering = useRef(false);
  const [signing, setSigning] = useState(false);
  const [drawn, setDrawn] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [signError, setSignError] = useState(false);
  const pdf = useContractPdf();

  const loadContract = () =>
    fetch(`/api/contract-share/${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.contract) throw new LinkError(data.code === 'expired' || data.code === 'revoked' ? data.code : 'invalid');
        setContract(data.contract);
        setSignatureUrl(data.signatureUrl || null);
      })
      .catch(err => setError(err instanceof LinkError ? err.code : 'invalid'));

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submitSignature = async () => {
    if (!drawn) return;
    setSaving(true);
    setSignError(false);
    try {
      const form = new FormData();
      form.append('file', new File([drawn], 'signature.png', { type: 'image/png' }));
      const res = await fetch(`/api/contract-share/${encodeURIComponent(token)}/sign`, { method: 'POST', body: form });
      if (!res.ok && res.status !== 409) throw new Error();
      setSigning(false);
      await loadContract();
    } catch {
      setSignError(true);
    } finally {
      setSaving(false);
    }
  };

  // The tap saves a file that already exists, so the browser still counts the save as the customer's
  // own action. Building it at this point would take seconds, and phones would drop the download.
  // With no file yet (the build failed), the tap reloads the page: html-to-image remembers a failed
  // image until then, so building again in place would only fail the same way.
  const download = async () => {
    if (!contract) return;
    if (!ready) {
      window.location.reload();
      return;
    }
    if (delivering.current) return;
    delivering.current = true;
    try {
      const result = await deliverPdf(ready, contractPdfFileName(contract.id));
      if (result === 'blocked') {
        setBlocked(true);
        window.scrollTo({ top: 0 });
      } else if (result !== 'cancelled') {
        setBlocked(false);
        setTapped(true);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
      }
    } finally {
      delivering.current = false;
    }
  };

  // Not while the customer is drawing their signature: a download prompt would interrupt it
  const signingNow = useRef(signing);
  signingNow.current = signing;

  // The customer opened the link to get the file: build it as soon as the contract has loaded, and
  // again after signing (the file changes). Each version (unsigned, signed) tries to save by itself
  // once per visit; a browser that refuses still has the finished file behind the button, one tap away.
  const { build } = pdf;
  const signed = !!contract?.renterSignatureUrl;
  useEffect(() => {
    if (!contract) return;
    let stale = false;
    setReady(null);
    setFailed(false);
    setTapped(false);
    build(contract, signatureUrl)
      .then(blob => {
        if (stale) return;
        const name = contractPdfFileName(contract.id);
        setReady(blob);
        setBlocked(!canDeliverPdf(blob, name));
        const key = `contract-saved:${token}:${signed ? 'signed' : 'unsigned'}`;
        if (canAutoSave() && !signingNow.current && !wasAutoSaved(key)) {
          rememberAutoSaved(key);
          saveBlob(blob, name);
        }
      })
      .catch(() => !stale && setFailed(true));
    return () => {
      stale = true;
    };
  }, [contract, signatureUrl, signed, token, build]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    setTimeout(() => setCopied(c => (c === 'done' ? null : c)), 2500);
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
                  Please contact ARSAM Rent a Car for a new link. · يرجى التواصل مع أبو أرسام لتأجير السيارات للحصول على رابط جديد.
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
              <div
                className="truncate text-[11px] font-semibold text-white/55"
                dir="rtl"
                title={`${(contract.contractNo || contract.id).toUpperCase()} · عقد إيجار سيارة · قرارداد اجاره خودرو`}
              >
                {(contract.contractNo || contract.id).toUpperCase()} · عقد إيجار سيارة · قرارداد اجاره خودرو
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={pdf.busy || (!ready && (signing || saving))} // retrying reloads the page, which would lose a drawn signature
            aria-busy={pdf.busy}
            aria-label={pdf.busy ? 'Preparing PDF' : 'Download PDF'}
            className={`flex min-h-11 min-w-[76px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-black tabular-nums transition-all active:scale-[0.99] disabled:opacity-70 ${FOCUS_RING} ${
              blocked
                ? 'border border-white/15 text-white/70'
                : 'bg-gradient-to-l from-[#c9a04a] to-amber-500 text-black shadow-lg shadow-amber-900/30 hover:brightness-110'
            }`}
          >
            {pdf.busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : justSaved ? <CheckCircle2 size={15} aria-hidden /> : <Download size={15} aria-hidden />}
            {pdf.busy ? `${pdf.progress ? `${pdf.progress.done}/${pdf.progress.total}` : '...'}` : 'PDF'}
          </button>
        </div>
      </header>

      <div className="sr-only" role="status">
        {pdf.busy ? 'Preparing PDF' : blocked ? "This app can't save files" : justSaved ? 'PDF saved' : ready && !tapped ? 'PDF is ready' : ''}
      </div>

      <div className="px-3">
        {failed && (
          <Notice
            tone="rose"
            role="alert"
            lines={[
              'The PDF could not be prepared. Tap PDF to try again.',
              'تعذّر تجهيز الملف. اضغط PDF للمحاولة مرة أخرى.',
              'فایل PDF آماده نشد. برای تلاش دوباره روی PDF بزنید.',
            ]}
          />
        )}
        {blocked && (
          <Notice
            tone="amber"
            lines={[
              "This app can't save files. Open the link in Safari or Chrome.",
              'لا يمكن الحفظ هنا. افتح الرابط في Safari أو Chrome.',
              'ذخیره در این برنامه ممکن نیست؛ لینک را در Safari یا Chrome باز کنید.',
            ]}
          >
            <button
              type="button"
              onClick={copyLink}
              className={`mt-2 min-h-11 rounded-xl bg-gradient-to-l from-[#c9a04a] to-amber-500 px-4 font-black text-black transition-all hover:brightness-110 ${FOCUS_RING}`}
            >
              {copied === 'done' ? 'Copied · تم النسخ · کپی شد' : 'Copy link · نسخ الرابط · کپی لینک'}
            </button>
            {copied === 'failed' && <p className="select-all break-all pt-2 text-white/80" dir="ltr">{window.location.href}</p>}
          </Notice>
        )}
        {(pdf.busy || ready) && !failed && !blocked && !tapped && !signing && (
          <Notice
            tone="gold"
            lines={
              pdf.busy
                ? ['Preparing your PDF…', 'جارٍ تجهيز ملف PDF…', 'فایل PDF در حال آماده‌سازی است…']
                : signed
                ? ['Your signed contract is ready. If the download did not start, tap PDF.', 'عقدك الموقّع جاهز. إذا لم يبدأ التنزيل، اضغط PDF.', 'قرارداد امضاشده آماده است. اگر دانلود شروع نشد، روی PDF بزنید.']
                : ['Your PDF is ready. If the download did not start, tap PDF.', 'ملف PDF جاهز. إذا لم يبدأ التنزيل، اضغط PDF.', 'فایل PDF آماده است. اگر دانلود شروع نشد، روی PDF بزنید.']
            }
          />
        )}
      </div>

      <div className="mx-auto max-w-[794px] px-3 pt-4">
        {contract.renterSignatureUrl ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 py-3 text-[12.5px] font-bold text-emerald-300">
            <CheckCircle2 size={16} />
            Signed · تم التوقيع · امضا شده
          </div>
        ) : signing ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-white p-3 text-left text-gray-800">
            <div className="mb-2 flex justify-between text-[12px] font-bold">
              <span>Sign with your finger · وقّع بإصبعك</span>
              <span dir="rtl">با انگشت امضا کنید</span>
            </div>
            <SignaturePad onChange={setDrawn} height={170} clearLabel="Clear · مسح · پاک کردن" hint="Sign here · وقّع هنا · اینجا امضا کنید" />
            <button
              type="button"
              onClick={submitSignature}
              disabled={!drawn || saving}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f1e37] py-3 text-[13px] font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a04a] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Confirm signature · تأكيد التوقيع · تأیید امضا
            </button>
            {signError && <p className="mt-2 text-[12px] text-rose-600">Could not save, please try again. · تعذّر الحفظ، يرجى المحاولة مرة أخرى. · ذخیره نشد، دوباره تلاش کنید.</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSigning(true)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a04a]/60 bg-[#c9a04a]/10 py-3.5 text-[14px] font-black text-[#c9a04a] active:scale-[0.99] ${FOCUS_RING}`}
          >
            <PenLine size={18} />
            Sign contract · توقيع العقد · امضای قرارداد
          </button>
        )}
      </div>

      <div className="px-3 py-4">
        <FitToWidth>
          <ContractDocument contract={contract} signatureUrl={signatureUrl} />
        </FitToWidth>
      </div>
    </main>
  );
}
