'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ChevronRight, Delete, CheckCircle2, RotateCcw,
  Building2, RefreshCw, FileText, Landmark, BarChart3,
  Plane, PenLine, XCircle, ScrollText, type LucideIcon
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const OMAN_PREFIX = '+968';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'categories' | 'services' | 'phone' | 'confirmed';

interface Category { id: string; fa: string; Icon: LucideIcon }
interface ServiceItem { id: string; title: string }

const CATEGORIES: Category[] = [
  { id: 'Company Setup Services',        fa: 'ثبت شرکت',        Icon: Building2  },
  { id: 'Renewal Services',              fa: 'تمدید خدمات',     Icon: RefreshCw  },
  { id: 'Ejari Registration Services',   fa: 'ایجاری / بلدیه',  Icon: FileText   },
  { id: 'Banking Services',              fa: 'خدمات بانکی',     Icon: Landmark   },
  { id: 'Tax Services',                  fa: 'امور مالیاتی',    Icon: BarChart3  },
  { id: 'Tourism Services',              fa: 'گردشگری',         Icon: Plane      },
  { id: 'License Modification Services', fa: 'اصلاح لایسنس',    Icon: PenLine    },
  { id: 'Cancellation Services',         fa: 'کنسلی و انحلال',  Icon: XCircle    },
  { id: 'General Government Services',   fa: 'خدمات دولتی',     Icon: ScrollText },
];

// ─── Live Clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-end">
      <span className="text-white font-black text-2xl tabular-nums tracking-tight">
        {now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-white/40 text-xs font-medium mt-0.5">
        {now.toLocaleDateString('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' })}
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
    <div className="grid gap-2.5">
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
                  transition-all duration-100 active:scale-90 select-none
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
  const [step,   setStep]   = useState<Step>('categories');
  const [cat,    setCat]    = useState<Category | null>(null);
  const [svcs,   setSvcs]   = useState<ServiceItem[]>([]);
  const [svc,    setSvc]    = useState<ServiceItem | null>(null);
  const [loading,setLoading]= useState(false);
  const [phone,  setPhone]  = useState('');
  const [busy,   setBusy]   = useState(false);
  const [ticket, setTicket] = useState<number | null>(null);
  const [cd,     setCd]     = useState(12);

  // Fetch services when category selected
  useEffect(() => {
    if (!cat) return;
    setLoading(true);
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setSvcs(
        (d.fa || [])
          .filter((s: any) => s.category === cat.id)
          .map((s: any) => ({ id: s.id, title: s.title }))
      ))
      .catch(() => setSvcs([]))
      .finally(() => setLoading(false));
  }, [cat]);

  // Auto-reset countdown after confirmation
  useEffect(() => {
    if (step !== 'confirmed') return;
    setCd(12);
    const t = setInterval(() => setCd(p => {
      if (p <= 1) { clearInterval(t); reset(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const reset = useCallback(() => {
    setStep('categories');
    setCat(null);
    setSvc(null);
    setPhone('');
    setTicket(null);
    setSvcs([]);
  }, []);

  const submit = async () => {
    if (phone.length < 8) return;
    setBusy(true);
    try {
      const res = await fetch('/api/qms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `${OMAN_PREFIX}${phone}`,
          serviceTitle: svc?.title || '',
          serviceId: svc?.id || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTicket(data.queueNumber);
        setStep('confirmed');
      } else {
        alert(data.error || 'خطا در ثبت نوبت');
      }
    } catch {
      alert('خطا در ارتباط با سرور');
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
      className="min-h-screen flex flex-col font-sans"
      style={{ background: 'linear-gradient(160deg,#07111f 0%,#0f1e37 55%,#091526 100%)' }}
      dir="rtl"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="logo-shimmer-container">
            <Image src="/logo.png" alt="Arsam" width={44} height={54} className="object-contain" priority />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-wide leading-none">آرسام</p>
            <p className="text-gold/60 text-[11px] font-medium mt-0.5">سامانه نوبت‌دهی</p>
          </div>
        </div>
        <LiveClock />
      </header>

      {/* ── Step dots ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 pt-5 pb-1 shrink-0">
        {(['categories','services','phone'] as const).map((s, i) => {
          const passed  = (step === 'services' && i === 0) || (step === 'phone' && i < 2) || step === 'confirmed';
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
                دسته‌بندی خدمت مورد نظر خود را انتخاب کنید
              </p>
              <div className="grid grid-cols-3 gap-4">
                {CATEGORIES.map((c, i) => {
                  const CatIcon = c.Icon;
                  return (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { setCat(c); setStep('services'); }}
                      className="group relative flex flex-col items-center justify-center gap-3.5 py-8 px-4 rounded-2xl text-center transition-all duration-200 active:scale-97 overflow-hidden"
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
                        {c.fa}
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
                  className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-bold transition-colors"
                >
                  <ChevronRight size={16} />
                  بازگشت
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
                    <span className="text-white font-black text-lg">{cat.fa}</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                </div>
              ) : svcs.length === 0 ? (
                <p className="text-white/25 text-center py-16 text-sm">خدمتی در این دسته یافت نشد</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[58vh] overflow-y-auto">
                  {svcs.map((s, i) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { setSvc(s); setPhone(''); setStep('phone'); }}
                      className="group flex items-center justify-between px-5 py-4 rounded-xl text-right transition-all active:scale-98"
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
                        className="text-white/15 group-hover:text-gold/60 rotate-180 transition-all"
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
                className="flex items-center gap-1.5 text-white/35 hover:text-white text-sm font-bold transition-colors mb-5"
              >
                <ChevronRight size={16} />
                بازگشت
              </button>

              {/* Selected service chip */}
              <div
                className="rounded-xl px-4 py-2.5 mb-5 text-center"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.18)' }}
              >
                <p className="text-gold/50 text-[10px] font-bold mb-0.5 tracking-wide">خدمت انتخاب‌شده</p>
                <p className="text-white font-bold text-sm leading-snug">{svc?.title}</p>
              </div>

              {/* Phone display */}
              <div
                className="rounded-2xl px-5 py-4 mb-4 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-white/25 text-xs mb-1.5">شماره موبایل</p>
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  <span className="text-gold/60 font-bold text-xl">{OMAN_PREFIX}</span>
                  <span className="text-white font-black text-3xl tracking-widest min-w-[160px] text-left">
                    {phone || <span className="text-white/12">_ _ _ _ _ _ _ _</span>}
                  </span>
                </div>
              </div>

              <NumPad value={phone} onChange={setPhone} />

              <button
                onClick={submit}
                disabled={phone.length < 8 || busy}
                className="mt-4 w-full py-4 rounded-2xl font-black text-base transition-all active:scale-98 disabled:opacity-30"
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
                ) : 'دریافت نوبت'}
              </button>
            </motion.div>
          )}

          {/* Step 4 — Confirmed */}
          {step === 'confirmed' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="flex flex-col items-center text-center"
            >
              <CheckCircle2 className="text-emerald-400 mb-4" size={48} strokeWidth={1.5} />
              <p className="text-white/50 text-base font-medium mb-1">نوبت شما با موفقیت ثبت شد</p>
              <p className="text-white/25 text-sm mb-8">{svc?.title}</p>

              {/* Ticket */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 20 }}
                className="relative flex items-center justify-center mb-8"
              >
                <div
                  className="absolute inset-0 rounded-full blur-3xl"
                  style={{ background: 'rgba(201,162,39,0.12)', transform: 'scale(1.5)' }}
                />
                <div
                  className="relative flex flex-col items-center justify-center w-44 h-44 rounded-full"
                  style={{
                    border: '1.5px solid rgba(201,162,39,0.4)',
                    background: 'linear-gradient(145deg, rgba(201,162,39,0.1), rgba(201,162,39,0.03))',
                  }}
                >
                  <span className="text-gold/50 text-xs font-bold mb-1 tracking-wide">شماره نوبت</span>
                  <span className="text-gold font-black leading-none" style={{ fontSize: '72px' }}>
                    {ticket}
                  </span>
                </div>
              </motion.div>

              {/* Countdown */}
              <div className="w-36 h-px rounded-full bg-white/8 overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full bg-gold/40"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 12, ease: 'linear' }}
                />
              </div>
              <p className="text-white/20 text-xs mb-6">بازگشت خودکار در {cd} ثانیه</p>

              <button
                onClick={reset}
                className="flex items-center gap-2 text-white/30 hover:text-white/70 text-sm font-bold transition-colors"
              >
                <RotateCcw size={14} />
                نوبت جدید
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="text-center py-3 text-white/12 text-[11px] border-t border-white/4 shrink-0">
        ARSAM Business Services — Muscat, Oman
      </footer>
    </div>
  );
}
