'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Delete, CheckCircle2, RotateCcw, X, AlertCircle, Globe,
  Building2, RefreshCw, FileText, Landmark, BarChart3,
  Plane, PenLine, XCircle, ScrollText, type LucideIcon
} from 'lucide-react';

// ─── Constants & Languages ───────────────────────────────────────────────────

const OMAN_PREFIX = '+968';

export type Lang = 'fa' | 'en' | 'ar';

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇴🇲' },
];

const TRANSLATIONS: Record<Lang, {
  brandTitle: string;
  subtitle: string;
  selectCategory: string;
  selectService: string;
  phoneLabel: string;
  confirmButton: string;
  back: string;
  selectedServiceLabel: string;
  ticketTitle: string;
  ticketSubtitle: string;
  ticketNumberLabel: string;
  serviceRequested: string;
  mobileLabel: string;
  autoClose: string;
  confirmReset: string;
  noServices: string;
  serverError: string;
}> = {
  fa: {
    brandTitle: 'آرسام',
    subtitle: 'سامانه نوبت‌دهی هوشمند',
    selectCategory: 'دسته‌بندی خدمت مورد نظر خود را انتخاب کنید',
    selectService: 'خدمت مورد نظر را انتخاب کنید',
    phoneLabel: 'شماره موبایل',
    confirmButton: 'دریافت نوبت',
    back: 'بازگشت',
    selectedServiceLabel: 'خدمت انتخاب‌شده',
    ticketTitle: 'نوبت شما صادر شد',
    ticketSubtitle: 'لطفاً تا فراخوانی شماره منتظر بمانید',
    ticketNumberLabel: 'شماره نوبت',
    serviceRequested: 'خدمت درخواستی',
    mobileLabel: 'شماره همراه',
    autoClose: 'بستن خودکار در {sec} ثانیه',
    confirmReset: 'تأیید و بازگشت به ابتدا',
    noServices: 'خدمتی در این دسته یافت نشد',
    serverError: 'خطا در ثبت نوبت. لطفاً دوباره تلاش کنید.',
  },
  en: {
    brandTitle: 'ARSAM',
    subtitle: 'Queue Management System',
    selectCategory: 'Select your required service category',
    selectService: 'Select a service',
    phoneLabel: 'Mobile Number',
    confirmButton: 'Get Ticket',
    back: 'Back',
    selectedServiceLabel: 'Selected Service',
    ticketTitle: 'Ticket Number Issued',
    ticketSubtitle: 'Please wait until your number is called',
    ticketNumberLabel: 'Ticket No.',
    serviceRequested: 'Requested Service',
    mobileLabel: 'Mobile Number',
    autoClose: 'Auto closing in {sec}s',
    confirmReset: 'Done & Return to Main',
    noServices: 'No services found in this category',
    serverError: 'Failed to issue ticket. Please try again.',
  },
  ar: {
    brandTitle: 'آرسام',
    subtitle: 'نظام إدارة الدور الذكي',
    selectCategory: 'اختر فئة الخدمة المطلوبة',
    selectService: 'اختر الخدمة المطلوبة',
    phoneLabel: 'رقم الهاتف',
    confirmButton: 'احصل على التذكرة',
    back: 'رجوع',
    selectedServiceLabel: 'الخدمة المختارة',
    ticketTitle: 'تم إصدار رقم التذكرة',
    ticketSubtitle: 'يرجى الانتظار حتى يتم استدعاء رقمك',
    ticketNumberLabel: 'رقم التذكرة',
    serviceRequested: 'الخدمة المطلوبة',
    mobileLabel: 'رقم الهاتف',
    autoClose: 'إغلاق تلقائي خلال {sec} ثانية',
    confirmReset: 'تأكيد والعودة للبداية',
    noServices: 'لم يتم العثور على خدمات في هذه الفئة',
    serverError: 'فشل في إصدار التذكرة. يرجى المحاولة مرة أخرى.',
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'categories' | 'services' | 'phone';

interface Category {
  id: string;
  fa: string;
  en: string;
  ar: string;
  Icon: LucideIcon;
}

interface ServiceItem { id: string; title: string }

const CATEGORIES: Category[] = [
  { id: 'Company Setup Services',        fa: 'ثبت شرکت',        en: 'Company Setup',       ar: 'تأسيس الشركات',      Icon: Building2  },
  { id: 'Renewal Services',              fa: 'تمدید خدمات',     en: 'Renewals',            ar: 'تجديد الخدمات',       Icon: RefreshCw  },
  { id: 'Ejari Registration Services',   fa: 'ایجاری / بلدیه',  en: 'Ejari / Municipality',ar: 'إيجاري / البلدية',    Icon: FileText   },
  { id: 'Banking Services',              fa: 'خدمات بانکی',     en: 'Banking Services',    ar: 'الخدمات المصرفية',    Icon: Landmark   },
  { id: 'Tax Services',                  fa: 'امور مالیاتی',    en: 'Tax Services',        ar: 'الخدمات الضريبية',    Icon: BarChart3  },
  { id: 'Tourism Services',              fa: 'گردشگری',         en: 'Tourism & Visas',     ar: 'السياحة والتأشيرات', Icon: Plane      },
  { id: 'License Modification Services', fa: 'اصلاح لایسنس',    en: 'License Modification',ar: 'تعديل الرخصة',       Icon: PenLine    },
  { id: 'Cancellation Services',         fa: 'کنسلی و انحلال',  en: 'Cancellations',       ar: 'الإلغاء والتصفية',   Icon: XCircle    },
  { id: 'General Government Services',   fa: 'خدمات دولتی',     en: 'Govt. Services',      ar: 'الخدمات الحكومية',   Icon: ScrollText },
];

// ─── Live Clock ──────────────────────────────────────────────────────────────

function LiveClock({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const locale = lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar-OM' : 'en-US';

  return (
    <div className="flex flex-col items-end">
      <span className="text-white font-black text-xl sm:text-2xl tabular-nums tracking-tight">
        {now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-white/40 text-[11px] font-medium mt-0.5">
        {now.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
}

// ─── Number Pad ──────────────────────────────────────────────────────────────

function NumPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string) => {
    if (k === '⌫') return onChange(value.slice(0, -1));
    if (k === 'C')  return onChange('');
    if (value.length < 8) onChange(value + k);
  };

  const rows = [['1','2','3'],['4','5','6'],['7','8','9'],['C','0','⌫']];

  return (
    <div className="grid gap-2.5 w-full">
      {rows.map((row, r) => (
        <div key={r} className="grid grid-cols-3 gap-2.5">
          {row.map(k => {
            const special = k === '⌫' || k === 'C';
            return (
              <button
                key={k}
                onClick={() => press(k)}
                className={`
                  h-16 rounded-2xl flex items-center justify-center text-xl font-black
                  transition-all duration-100 active:scale-90 select-none cursor-pointer
                  ${special
                    ? 'bg-white/5 text-white/50 hover:bg-white/10'
                    : 'bg-white/10 text-white hover:bg-white/15 active:bg-gold/20'
                  }
                `}
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {k === '⌫' ? <Delete size={18} /> : k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function QMSPage() {
  const [lang,        setLang]        = useState<Lang>('fa');
  const [step,        setStep]        = useState<Step>('categories');
  const [cat,         setCat]         = useState<Category | null>(null);
  const [svcs,        setSvcs]        = useState<ServiceItem[]>([]);
  const [svc,         setSvc]         = useState<ServiceItem | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [phone,       setPhone]       = useState('');
  const [busy,        setBusy]        = useState(false);
  const [ticket,      setTicket]      = useState<number | null>(null);
  const [showModal,   setShowModal]   = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [cd,          setCd]          = useState(15);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const t = TRANSLATIONS[lang];
  const isRTL = lang !== 'en';

  // Fetch services when category or language changes
  useEffect(() => {
    if (!cat) return;
    setLoading(true);
    fetch('/api/services')
      .then(r => r.json())
      .then(d => {
        const langServices = d[lang] || d.fa || [];
        setSvcs(
          langServices
            .filter((s: any) => s.category === cat.id)
            .map((s: any) => ({ id: s.id, title: s.title }))
        );
      })
      .catch(() => setSvcs([]))
      .finally(() => setLoading(false));
  }, [cat, lang]);

  // Countdown timer for Modal reset
  useEffect(() => {
    if (!showModal) return;
    setCd(15);
    const interval = setInterval(() => setCd(p => {
      if (p <= 1) {
        clearInterval(interval);
        closeModalAndReset();
        return 0;
      }
      return p - 1;
    }), 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const closeModalAndReset = useCallback(() => {
    setShowModal(false);
    setTicket(null);
    setStep('categories');
    setCat(null);
    setSvc(null);
    setPhone('');
    setSvcs([]);
  }, []);

  const submit = async () => {
    if (phone.length < 8) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const formattedPhone = `${OMAN_PREFIX} ${phone}`;
      const res = await fetch('/api/qms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          serviceTitle: svc?.title || '',
          serviceId: svc?.id || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTicket(data.queueNumber);
        setShowModal(true);
      } else {
        setErrorMsg(data.error || t.serverError);
      }
    } catch {
      setErrorMsg(t.serverError);
    } finally {
      setBusy(false);
    }
  };

  const slide = {
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    exit:       { opacity: 0, y: -16 },
    transition: { duration: 0.22, ease: 'easeOut' },
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative"
      style={{ background: 'linear-gradient(160deg,#07111f 0%,#0f1e37 55%,#091526 100%)' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="grid grid-cols-3 items-center px-8 py-5 border-b border-white/6 shrink-0 relative">
        {/* Top Right (in RTL) / Top Left (in LTR): Language Selector */}
        <div className="flex items-center justify-start relative">
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              <Globe size={15} className="text-gold" />
              <span>{LANGUAGES.find(l => l.code === lang)?.flag}</span>
              <span>{LANGUAGES.find(l => l.code === lang)?.label}</span>
            </button>

            <AnimatePresence>
              {showLangDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute top-full mt-2 right-0 z-30 min-w-[130px] rounded-2xl p-1.5 bg-[#0e1c33] border border-white/12 shadow-2xl backdrop-blur-xl"
                >
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setShowLangDropdown(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        lang === l.code
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{l.label}</span>
                      <span>{l.flag}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Brand Name (Centered Text without Logo) */}
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-white font-black text-2xl tracking-wider leading-none">
            {t.brandTitle}
          </h1>
          <p className="text-gold/70 text-[11px] font-semibold mt-1 tracking-wide">
            {t.subtitle}
          </p>
        </div>

        {/* Top Left (in RTL) / Top Right (in LTR): Live Clock */}
        <div className="flex items-center justify-end">
          <LiveClock lang={lang} />
        </div>
      </header>

      {/* ── Step dots ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 pt-5 pb-1 shrink-0">
        {(['categories','services','phone'] as const).map((s, i) => {
          const passed  = (step === 'services' && i === 0) || (step === 'phone' && i < 2);
          const current = step === s;
          return (
            <div key={s} className={`rounded-full transition-all duration-400 ${
              current ? 'w-6 h-2 bg-gold' :
              passed  ? 'w-2 h-2 bg-gold/40' :
                        'w-2 h-2 bg-white/10'
            }`} />
          );
        })}
      </div>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-8 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* Step 1 — Categories */}
          {step === 'categories' && (
            <motion.div key="cats" {...slide} className="w-full max-w-4xl">
              <p className="text-white/35 text-sm font-medium text-center mb-7 tracking-wide">
                {t.selectCategory}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {CATEGORIES.map((c, i) => {
                  const CatIcon = c.Icon;
                  const catLabel = c[lang];
                  return (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { setCat(c); setStep('services'); }}
                      className="group relative flex flex-col items-center justify-center gap-3.5 py-8 px-4 rounded-2xl text-center transition-all duration-200 active:scale-97 overflow-hidden cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {/* Gold hover overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                        style={{ background: 'rgba(201,162,39,0.07)', border: '1px solid rgba(201,162,39,0.22)' }}
                      />
                      {/* Icon container */}
                      <div
                        className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-200"
                        style={{ background: 'rgba(201,162,39,0.1)' }}
                      >
                        <CatIcon
                          size={22}
                          strokeWidth={1.6}
                          className="text-gold/70 group-hover:text-gold transition-colors duration-200"
                        />
                      </div>
                      <span className="text-white/80 group-hover:text-white font-bold text-[15px] relative z-10 leading-tight transition-colors duration-200">
                        {catLabel}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Services */}
          {step === 'services' && (
            <motion.div key="svcs" {...slide} className="w-full max-w-2xl">
              {/* Back + title */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setStep('categories')}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} className={isRTL ? '' : 'rotate-180'} />
                  {t.back}
                </button>
                <div className="h-4 w-px bg-white/10" />
                {cat && (
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ background: 'rgba(201,162,39,0.12)' }}
                    >
                      <cat.Icon size={16} strokeWidth={1.7} className="text-gold/70" />
                    </div>
                    <span className="text-white font-black text-lg">{cat[lang]}</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                </div>
              ) : svcs.length === 0 ? (
                <p className="text-white/25 text-center py-16 text-sm">{t.noServices}</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[58vh] overflow-y-auto pr-1">
                  {svcs.map((s, i) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { setSvc(s); setPhone(''); setStep('phone'); }}
                      className="group flex items-center justify-between px-5 py-4 rounded-xl text-right transition-all active:scale-98 cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors shrink-0" />
                        <span className="text-white/75 group-hover:text-white font-semibold text-[15px] transition-colors">
                          {s.title}
                        </span>
                      </div>
                      <ChevronRight
                        size={15}
                        className={`text-white/15 group-hover:text-gold/60 transition-all ${isRTL ? 'rotate-180' : ''}`}
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3 — Phone */}
          {step === 'phone' && (
            <motion.div key="phone" {...slide} className="w-full max-w-xs">
              <button
                onClick={() => setStep('services')}
                className="flex items-center gap-1.5 text-white/35 hover:text-white text-sm font-bold transition-colors mb-5 cursor-pointer"
              >
                <ChevronRight size={16} className={isRTL ? '' : 'rotate-180'} />
                {t.back}
              </button>

              {/* Selected service chip */}
              <div
                className="rounded-xl px-4 py-2.5 mb-5 text-center"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.18)' }}
              >
                <p className="text-gold/50 text-[10px] font-bold mb-0.5 tracking-wide">{t.selectedServiceLabel}</p>
                <p className="text-white font-bold text-sm leading-snug">{svc?.title}</p>
              </div>

              {/* Phone display */}
              <div
                className="rounded-2xl px-5 py-4 mb-4 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-white/25 text-xs mb-1.5">{t.phoneLabel}</p>
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  <span className="text-gold/60 font-bold text-xl">{OMAN_PREFIX}</span>
                  <span className="text-white font-black text-3xl tracking-widest min-w-[160px] text-left">
                    {phone || <span className="text-white/12">_ _ _ _ _ _ _ _</span>}
                  </span>
                </div>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center flex items-center justify-center gap-2"
                >
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <NumPad value={phone} onChange={setPhone} />

              <button
                onClick={submit}
                disabled={phone.length < 8 || busy}
                className="mt-4 w-full py-4 rounded-2xl font-black text-base transition-all active:scale-98 disabled:opacity-30 cursor-pointer"
                style={{
                  background: phone.length >= 8
                    ? 'linear-gradient(135deg, #c9a227 0%, #e4bc3c 100%)'
                    : 'rgba(255,255,255,0.06)',
                  color: phone.length >= 8 ? '#0f1e37' : 'rgba(255,255,255,0.2)',
                  boxShadow: phone.length >= 8 ? '0 6px 24px rgba(201,162,39,0.3)' : 'none',
                }}
              >
                {busy ? (
                  <div className="h-5 w-5 rounded-full border-2 border-navy border-t-transparent animate-spin mx-auto" />
                ) : t.confirmButton}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── ANIMATED TICKET MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModalAndReset}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative z-10 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #0d1b30 0%, #081324 100%)',
                border: '1px solid rgba(201,162,39,0.35)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,162,39,0.15)',
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Close X */}
              <button
                onClick={closeModalAndReset}
                className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} text-white/30 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer`}
              >
                <X size={18} />
              </button>

              {/* Animated Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="flex items-center justify-center mb-3"
              >
                <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 size={36} strokeWidth={2} />
                </div>
              </motion.div>

              <h3 className="text-white font-black text-lg mb-1">{t.ticketTitle}</h3>
              <p className="text-white/40 text-xs mb-6 font-medium">{t.ticketSubtitle}</p>

              {/* Glowing Ticket Circle */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, delay: 0.2 }}
                className="relative flex items-center justify-center mx-auto mb-6"
              >
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-40"
                  style={{ background: 'rgba(201,162,39,0.4)', transform: 'scale(1.2)' }}
                />
                <div
                  className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full"
                  style={{
                    border: '2px solid rgba(201,162,39,0.6)',
                    background: 'radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.03) 100%)',
                    boxShadow: 'inset 0 0 20px rgba(201,162,39,0.2)',
                  }}
                >
                  <span className="text-gold/60 text-[10px] font-extrabold tracking-wider mb-0.5">{t.ticketNumberLabel}</span>
                  <span className="text-gold font-black leading-none tracking-tighter" style={{ fontSize: '64px' }}>
                    {ticket}
                  </span>
                </div>
              </motion.div>

              {/* User & Service Details Card */}
              <div
                className="rounded-2xl p-3.5 mb-6 text-right space-y-2 text-xs"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white/40">{t.mobileLabel}:</span>
                  <span className="text-white font-mono font-bold tracking-wider" dir="ltr">
                    {OMAN_PREFIX} {phone}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-white/40">{t.serviceRequested}:</span>
                  <span className="text-gold/90 font-bold truncate max-w-[180px]">{svc?.title}</span>
                </div>
              </div>

              {/* Countdown Bar */}
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-gold"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 15, ease: 'linear' }}
                />
              </div>
              <p className="text-white/25 text-[11px] mb-5">
                {t.autoClose.replace('{sec}', cd.toString())}
              </p>

              {/* Action Button */}
              <button
                onClick={closeModalAndReset}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #c9a227 0%, #e4bc3c 100%)',
                  color: '#0f1e37',
                  boxShadow: '0 6px 20px rgba(201,162,39,0.3)',
                }}
              >
                <span>{t.confirmReset}</span>
                <RotateCcw size={15} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="text-center py-3 text-white/12 text-[11px] border-t border-white/4 shrink-0">
        ARSAM Business Services — Muscat, Oman
      </footer>
    </div>
  );
}
