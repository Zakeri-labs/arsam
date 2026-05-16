'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Service, Language } from '@/lib/content';
import { CheckCircle2, ChevronRight, MessageSquare, FileText, ArrowLeft, Send } from 'lucide-react';

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  ctaButton: string;
}

const localizations = {
  en: {
    whatsappBtn: 'Request via WhatsApp',
    formBtn: 'Request via Form',
    formTitle: 'Request Service',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    phoneLabel: 'Phone Number',
    phonePlaceholder: 'e.g., +971 50 000 0000',
    descLabel: 'Additional Description (Optional)',
    descPlaceholder: 'Any specific requests or notes...',
    submitBtn: 'Send Request',
    backBtn: 'Back',
    closeBtn: 'Close',
    successTitle: 'Request Submitted!',
    successDesc: 'Thank you. Our experts will contact you shortly.',
    requiredField: 'This field is required',
    whatsappTemplate: 'Hello, I am interested in the "%SERVICE_NAME%" service. Please provide more details.'
  },
  fa: {
    whatsappBtn: 'درخواست از طریق واتساپ',
    formBtn: 'درخواست از طریق فرم',
    formTitle: 'درخواست خدمت',
    nameLabel: 'نام و نام خانوادگی',
    namePlaceholder: 'نام خود را وارد کنید',
    phoneLabel: 'شماره تماس',
    phonePlaceholder: 'مثال: ۰۹۱۲۳۴۵۶۷۸۹',
    descLabel: 'توضیحات (اختیاری)',
    descPlaceholder: 'درخواست خاص یا توضیحات بیشتر...',
    submitBtn: 'ارسال درخواست',
    backBtn: 'بازگشت',
    closeBtn: 'بستن',
    successTitle: 'درخواست شما ثبت شد!',
    successDesc: 'با تشکر از شما. کارشناسان ما به زودی با شما تماس خواهند گرفت.',
    requiredField: 'این فیلد الزامی است',
    whatsappTemplate: 'سلام، من علاقه‌مند به دریافت خدمات "%SERVICE_NAME%" هستم. لطفاً اطلاعات بیشتری ارسال کنید.'
  },
  ar: {
    whatsappBtn: 'طلب عبر الواتساب',
    formBtn: 'طلب عبر النموذج',
    formTitle: 'طلب خدمة',
    nameLabel: 'الاسم الكامل',
    namePlaceholder: 'أدخل اسمك الكامل',
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: 'مثال: +971 50 000 0000',
    descLabel: 'تفاصيل إضافية (اختياري)',
    descPlaceholder: 'أي طلبات خاصة أو ملاحظات...',
    submitBtn: 'إرسال الطلب',
    backBtn: 'العودة',
    closeBtn: 'إغلاق',
    successTitle: 'تم تقديم الطلب بنجاح!',
    successDesc: 'شكراً لك. سيتواصل معك خبراؤنا قريباً.',
    requiredField: 'هذا الحقل مطلوب',
    whatsappTemplate: 'مرحباً، أنا مهتم بالحصول على خدمة "%SERVICE_NAME%". يرجى تزويدي بمزيد من التفاصيل.'
  }
};

export function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  language,
}: ServiceDetailModalProps) {
  const isRtl = language === 'fa' || language === 'ar';
  const t = localizations[language] || localizations.en;

  const [view, setView] = useState<'details' | 'form' | 'success'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});

  // Reset form state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setView('details');
      setName('');
      setPhone('');
      setDescription('');
      setErrors({});
    }
  }, [isOpen]);

  if (!service) return null;

  const handleWhatsAppRequest = () => {
    const template = t.whatsappTemplate.replace('%SERVICE_NAME%', service.title);
    const encodedText = encodeURIComponent(template);
    const whatsappUrl = `https://wa.me/971552554688?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: boolean; phone?: boolean } = {};
    if (!name.trim()) newErrors.name = true;
    if (!phone.trim()) newErrors.phone = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulate form submission
    console.log('Submitted Request:', {
      service: service.title,
      name,
      phone,
      description,
    });

    setView('success');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
          />
          
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute end-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground z-10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              {view === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: isRtl ? 15 : -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? -15 : 15 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-gold" style={{ backgroundColor: '#fdf0d0' }}>
                    <FileText className="h-6 w-6" />
                  </div>

                  <h2 className="mb-2 text-xl font-bold text-foreground">
                    {service.title}
                  </h2>

                  <p className="mb-6 leading-relaxed text-muted-foreground text-sm">
                    {service.description}
                  </p>

                  <div className="flex flex-col gap-3">
                    {/* WhatsApp CTA */}
                    <button
                      onClick={handleWhatsAppRequest}
                      className="flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#25D366]/20 transition-transform active:scale-98 hover:brightness-105"
                    >
                      <MessageSquare className="h-4.5 w-4.5 fill-current" />
                      <span>{t.whatsappBtn}</span>
                    </button>

                    {/* Form Request CTA */}
                    <button
                      onClick={() => setView('form')}
                      className="flex items-center justify-center gap-2.5 rounded-2xl bg-navy px-6 py-3.5 text-sm font-semibold text-white transition-transform active:scale-98 hover:bg-navy-light shadow-md shadow-navy/15"
                    >
                      <FileText className="h-4.5 w-4.5" />
                      <span>{t.formBtn}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: isRtl ? -15 : 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 15 : -15 }}
                  transition={{ duration: 0.2 }}
                  className="pt-4"
                >
                  {/* Header with Back button */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setView('details')}
                      className="rounded-xl p-1.5 hover:bg-secondary text-muted-foreground transition-colors"
                      aria-label="Back"
                    >
                      <ArrowLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                    <h2 className="text-lg font-bold text-foreground">
                      {t.formTitle}
                    </h2>
                  </div>

                  {/* Form Service Indicator */}
                  <div className="mb-4 rounded-2xl bg-secondary/60 px-4 py-3 border border-border">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-0.5">
                      {t.formTitle}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {service.title}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Name field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground px-1">
                        {t.nameLabel} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors(prev => ({ ...prev, name: false }));
                        }}
                        placeholder={t.namePlaceholder}
                        className={`w-full rounded-2xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 ${
                          errors.name ? 'border-destructive focus:border-destructive' : 'border-border focus:border-gold'
                        }`}
                      />
                      {errors.name && (
                        <span className="text-[10px] text-destructive px-1">{t.requiredField}</span>
                      )}
                    </div>

                    {/* Phone field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground px-1">
                        {t.phoneLabel} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: false }));
                        }}
                        placeholder={t.phonePlaceholder}
                        className={`w-full rounded-2xl border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 ${
                          errors.phone ? 'border-destructive focus:border-destructive' : 'border-border focus:border-gold'
                        }`}
                        dir="ltr"
                      />
                      {errors.phone && (
                        <span className="text-[10px] text-destructive px-1">{t.requiredField}</span>
                      )}
                    </div>

                    {/* Description field */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground px-1">
                        {t.descLabel}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.descPlaceholder}
                        rows={3}
                        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-gold placeholder:text-muted-foreground/60 resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-3.5 text-sm font-semibold text-white transition-transform active:scale-98 hover:bg-navy-light"
                    >
                      <Send className="h-4 w-4" />
                      <span>{t.submitBtn}</span>
                    </button>
                  </form>
                </motion.div>
              )}

              {view === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center pt-6 pb-2"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <h2 className="mb-2 text-xl font-bold text-foreground">
                    {t.successTitle}
                  </h2>

                  <p className="mb-6 text-sm text-muted-foreground max-w-[280px]">
                    {t.successDesc}
                  </p>

                  <button
                    onClick={onClose}
                    className="w-full rounded-2xl bg-secondary px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
                  >
                    {t.closeBtn}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
