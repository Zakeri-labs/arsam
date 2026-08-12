'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronRight, Delete, CheckCircle2, RotateCcw, Clock } from 'lucide-react';

// ─── Category definitions ───────────────────────────────────────────────────

interface Category {
  id: string;
  fa: string;
  en: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'Company Setup Services',    fa: 'ثبت شرکت',         en: 'Company Setup',      icon: '🏢' },
  { id: 'Renewal Services',          fa: 'تمدید خدمات',      en: 'Renewals',           icon: '🔄' },
  { id: 'Ejari Registration Services', fa: 'ایجاری / بلدیه', en: 'Ejari / Municipal',  icon: '📋' },
  { id: 'Banking Services',          fa: 'خدمات بانکی',      en: 'Banking',            icon: '🏦' },
  { id: 'Tax Services',              fa: 'امور مالیاتی',     en: 'Tax Services',       icon: '📊' },
  { id: 'Tourism Services',          fa: 'گردشگری',          en: 'Tourism & Visas',    icon: '✈️' },
  { id: 'License Modification Services', fa: 'اصلاح لایسنس', en: 'License Modification', icon: '✏️' },
  { id: 'Cancellation Services',     fa: 'کنسلی و انحلال',   en: 'Cancellations',      icon: '🚫' },
  { id: 'General Government Services', fa: 'خدمات دولتی',   en: 'Govt. Services',     icon: '🏛️' },
];

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 'categories' | 'services' | 'phone' | 'confirmed';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
}

// ─── Live Clock ─────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-2xl font-black text-white tracking-widest font-mono">{timeStr}</span>
      <span className="text-xs text-white/60 font-medium">{dateStr}</span>
    </div>
  );
}

// ─── Number Pad ─────────────────────────────────────────────────────────────

interface NumberPadProps {
  value: string;
  onChange: (v: string) => void;
}

function NumberPad({ value, onChange }: NumberPadProps) {
  const handleKey = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === 'clear') {
      onChange('');
    } else {
      if (value.length < 13) onChange(value + key);
    }
  };

  const rows = [
    ['۱', '۲', '۳'],
    ['۴', '۵', '۶'],
    ['۷', '۸', '۹'],
    ['clear', '۰', 'del'],
  ];

  const toEn: Record<string, string> = {
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-3">
          {row.map((key) => {
            const isSpecial = key === 'del' || key === 'clear';
            return (
              <button
                key={key}
                onClick={() => handleKey(key === '۰' || key.match(/[۱-۹]/) ? toEn[key] : key)}
                className={`
                  h-20 rounded-2xl text-2xl font-black transition-all active:scale-90 select-none
                  ${isSpecial
                    ? 'bg-white/10 text-white/70 hover:bg-white/20 text-lg'
                    : 'bg-white/15 text-white hover:bg-white/25 shadow-lg shadow-black/30'
                  }
                `}
              >
                {key === 'del' ? <Delete className="h-7 w-7 mx-auto" /> : key === 'clear' ? 'پاک' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Main QMS Page ───────────────────────────────────────────────────────────

export default function QMSPage() {
  const [step, setStep] = useState<Step>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(15);

  // Auto-reset countdown after confirmation
  useEffect(() => {
    if (step !== 'confirmed') return;
    setCountdown(15);
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          handleReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Fetch services when category selected
  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingServices(true);
    fetch('/api/services')
      .then(r => r.json())
      .then(data => {
        const faServices: ServiceItem[] = (data.fa || [])
          .filter((s: any) => s.category === selectedCategory.id)
          .map((s: any) => ({ id: s.id, title: s.title, category: s.category }));
        setServices(faServices);
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [selectedCategory]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setStep('services');
  };

  const handleServiceSelect = (svc: ServiceItem) => {
    setSelectedService(svc);
    setPhone('');
    setStep('phone');
  };

  const handleConfirm = async () => {
    if (phone.length < 8) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/qms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          serviceTitle: selectedService?.title || '',
          serviceId: selectedService?.id || '',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQueueNumber(data.queueNumber);
        setStep('confirmed');
      } else {
        alert(data.error || 'خطا در ثبت نوبت');
      }
    } catch {
      alert('ارتباط با سرور برقرار نشد');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = useCallback(() => {
    setStep('categories');
    setSelectedCategory(null);
    setSelectedService(null);
    setPhone('');
    setQueueNumber(null);
    setServices([]);
  }, []);

  // ─── Slide variants ───────────────────────────────────────────────────────
  const slideIn = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -60 },
    transition: { type: 'spring', damping: 28, stiffness: 280 },
  };

  return (
    <div
      className="min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #07111F 0%, #0B1A2E 50%, #0F2044 100%)' }}
      dir="rtl"
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-10 py-4 border-b border-white/8 shrink-0"
        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Arsam" width={52} height={64} className="object-contain" priority />
          <div>
            <p className="text-white font-black text-xl tracking-wide">آرسام</p>
            <p className="text-white/50 text-xs font-medium">سیستم نوبت‌دهی هوشمند</p>
          </div>
        </div>

        {/* Clock */}
        <LiveClock />
      </header>

      {/* ─── Step Indicator ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 py-4 shrink-0">
        {(['categories', 'services', 'phone'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`
              flex items-center justify-center h-8 w-8 rounded-full text-sm font-black transition-all duration-300
              ${step === s || (step === 'confirmed' && i < 3)
                ? 'bg-amber-400 text-navy scale-110'
                : (step === 'services' && i === 0) || (step === 'phone' && i <= 1) || step === 'confirmed'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/8 text-white/30'
              }
            `}>{i + 1}</div>
            {i < 2 && <div className={`h-px w-10 transition-all duration-500 ${
              (step === 'services' && i === 0) || (step === 'phone' && i <= 1) || step === 'confirmed'
                ? 'bg-amber-400/60' : 'bg-white/10'
            }`} />}
          </div>
        ))}
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-6 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* STEP 1: Categories */}
          {step === 'categories' && (
            <motion.div key="categories" {...slideIn} className="w-full max-w-5xl">
              <h1 className="text-center text-white/80 text-xl font-bold mb-8 tracking-wide">
                دسته‌بندی خدمت مورد نظر خود را انتخاب کنید
              </h1>
              <div className="grid grid-cols-3 gap-5">
                {categories.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleCategorySelect(cat)}
                    className="group relative flex flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center transition-all duration-200 active:scale-95 overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                      style={{ background: 'linear-gradient(145deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)', border: '1px solid rgba(212,175,55,0.4)' }}
                    />
                    <span className="text-5xl relative z-10">{cat.icon}</span>
                    <div className="relative z-10">
                      <p className="text-white font-black text-lg leading-tight">{cat.fa}</p>
                      <p className="text-white/40 text-xs mt-1 font-medium">{cat.en}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Services */}
          {step === 'services' && (
            <motion.div key="services" {...slideIn} className="w-full max-w-3xl">
              {/* Back + Title */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setStep('categories')}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
                >
                  <ChevronRight className="h-5 w-5" />
                  بازگشت
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCategory?.icon}</span>
                  <div>
                    <h2 className="text-white font-black text-2xl">{selectedCategory?.fa}</h2>
                    <p className="text-white/40 text-xs">{selectedCategory?.en}</p>
                  </div>
                </div>
              </div>

              {/* Services List */}
              {loadingServices ? (
                <div className="flex justify-center items-center py-20">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center text-white/40 py-20 text-lg">خدمتی یافت نشد</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
                  {services.map((svc, i) => (
                    <motion.button
                      key={svc.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleServiceSelect(svc)}
                      className="group flex items-center justify-between rounded-2xl px-6 py-4 text-right transition-all active:scale-98"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-amber-400/70 group-hover:bg-amber-400 transition-colors shrink-0" />
                        <span className="text-white font-bold text-lg group-hover:text-amber-200 transition-colors text-right leading-snug">
                          {svc.title}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-amber-400 rotate-180 transition-all" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Phone Entry */}
          {step === 'phone' && (
            <motion.div key="phone" {...slideIn} className="w-full max-w-2xl">
              {/* Back */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => setStep('services')}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
                >
                  <ChevronRight className="h-5 w-5" />
                  بازگشت
                </button>
              </div>

              {/* Selected Service badge */}
              <div className="rounded-2xl px-5 py-3 mb-6 text-center"
                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}
              >
                <p className="text-amber-300/70 text-xs font-bold mb-0.5">خدمت انتخاب‌شده</p>
                <p className="text-white font-black text-lg leading-snug">{selectedService?.title}</p>
              </div>

              {/* Phone display */}
              <div className="rounded-3xl px-6 py-4 mb-5 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <p className="text-white/40 text-sm mb-1">شماره موبایل</p>
                <p className="text-white font-black text-4xl tracking-[0.2em] min-h-[52px] font-mono dir-ltr" dir="ltr">
                  {phone || <span className="text-white/20">_ _ _ _ _ _ _ _ _ _ _</span>}
                </p>
              </div>

              {/* Number pad */}
              <NumberPad value={phone} onChange={setPhone} />

              {/* Confirm button */}
              <motion.button
                onClick={handleConfirm}
                disabled={phone.length < 8 || submitting}
                className="mt-5 w-full rounded-3xl py-5 text-xl font-black transition-all active:scale-97 disabled:opacity-40"
                style={{
                  background: phone.length >= 8 && !submitting
                    ? 'linear-gradient(135deg, #D4AF37 0%, #F5D060 50%, #C9A227 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: phone.length >= 8 ? '#0B1A2E' : 'rgba(255,255,255,0.3)',
                  boxShadow: phone.length >= 8 ? '0 8px 32px rgba(212,175,55,0.4)' : 'none',
                }}
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-navy border-t-transparent mx-auto" />
                ) : (
                  '✔ تأیید و دریافت نوبت'
                )}
              </motion.button>
            </motion.div>
          )}

          {/* STEP 4: Confirmed */}
          {step === 'confirmed' && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="flex flex-col items-center text-center"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="mb-4"
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
              </motion.div>

              <p className="text-white/70 text-xl font-bold mb-2">نوبت شما ثبت شد!</p>

              {/* Queue Number */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="relative flex items-center justify-center my-4"
              >
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-3xl scale-150" />
                <div
                  className="relative flex items-center justify-center h-52 w-52 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
                    border: '3px solid rgba(212,175,55,0.6)',
                    boxShadow: '0 0 60px rgba(212,175,55,0.3)',
                  }}
                >
                  <div>
                    <p className="text-amber-300/70 text-sm font-bold mb-1">شماره نوبت</p>
                    <p className="text-amber-400 font-black leading-none" style={{ fontSize: '96px' }}>
                      {queueNumber}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Service name */}
              <p className="text-white/50 text-base font-medium mb-1">خدمت درخواستی:</p>
              <p className="text-white font-bold text-lg mb-6 max-w-xs">{selectedService?.title}</p>

              {/* Countdown */}
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-4 w-4 text-white/40" />
                <p className="text-white/40 text-sm">
                  بازگشت خودکار به صفحه اول در <span className="text-white font-bold">{countdown}</span> ثانیه
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden mb-6">
                <motion.div
                  className="h-full rounded-full bg-amber-400"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 15, ease: 'linear' }}
                />
              </div>

              {/* Manual reset */}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-all font-bold"
              >
                <RotateCcw className="h-4 w-4" />
                نوبت جدید
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="text-center py-3 text-white/20 text-xs shrink-0 border-t border-white/5">
        ARSAM — سیستم نوبت‌دهی دیجیتال © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
