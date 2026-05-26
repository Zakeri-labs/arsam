'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Service, Language } from '@/lib/content';
import { CheckCircle2, ChevronRight, MessageSquare, FileText, ArrowLeft, Send, Clock, UploadCloud, X, Paperclip } from 'lucide-react';

const categoryImages: Record<string, string> = {
  'Company Setup Services': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600&auto=format&fit=crop',
  'Renewal Services': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
  'Ejari Registration Services': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop',
  'Banking Services': 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=600&auto=format&fit=crop',
  'Tax Services': 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=600&auto=format&fit=crop',
  'Tourism Services': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600&auto=format&fit=crop',
  'License Modification Services': 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=600&auto=format&fit=crop',
  'Cancellation Services': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop',
  'General Government Services': 'https://images.unsplash.com/photo-1529101091764-c301647b7e38?q=80&w=600&auto=format&fit=crop',
};

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  ctaButton: string;
}

const localizations = {
  en: {
    whatsappBtn: 'WhatsApp',
    formBtn: 'Order Form',
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
    whatsappTemplate: 'Hello, I am interested in the "%SERVICE_NAME%" service. Please provide more details.',
    serviceFeeLabel: 'Service Fee:',
    govtFeeLabel: 'Government Fees:',
    systemRegLabel: 'System Registration:',
    systemRegVal: '30 Mins',
    finalIssueLabel: 'Final Issuance:',
    requirementsLabel: 'Required Documents:',
    workingDaysLabel: 'Working Days',
    uploadLabel: 'Upload Documents (Optional)',
    dragDropText: 'Drag & drop files here or click to browse',
    maxSizeText: 'Support multiple files (PDF, JPG, PNG)'
  },
  fa: {
    whatsappBtn: 'واتساپ',
    formBtn: 'فرم درخواست',
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
    whatsappTemplate: 'سلام، من علاقه‌مند به دریافت خدمات "%SERVICE_NAME%" هستم. لطفاً اطلاعات بیشتری ارسال کنید.',
    serviceFeeLabel: 'دستمزد خدمات:',
    govtFeeLabel: 'هزینه‌های دولتی:',
    systemRegLabel: 'ثبت درخواست:',
    systemRegVal: '۳۰ دقیقه',
    finalIssueLabel: 'صدور نهایی:',
    requirementsLabel: 'مدارک مورد نیاز :',
    workingDaysLabel: 'روز کاری',
    uploadLabel: 'آپلود مدارک (اختیاری)',
    dragDropText: 'فایل‌ها را بکشید و رها کنید یا کلیک کنید',
    maxSizeText: 'پشتیبانی از چندین فایل (PDF، JPG، PNG)'
  },
  ar: {
    whatsappBtn: 'واتساب',
    formBtn: 'نموذج الطلب',
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
    whatsappTemplate: 'مرحباً، أنا مهتم بالحصول على خدمة "%SERVICE_NAME%". يرجى تزويدي بمزيد من التفاصيل.',
    serviceFeeLabel: 'رسوم الخدمة:',
    govtFeeLabel: 'الرسوم الحكومية:',
    systemRegLabel: 'تسجيل الطلب:',
    systemRegVal: '٣٠ دقيقة',
    finalIssueLabel: 'الإصدار النهائي:',
    requirementsLabel: 'المستندات المطلوبة:',
    workingDaysLabel: 'أيام عمل',
    uploadLabel: 'تحميل المستندات (اختياري)',
    dragDropText: 'اسحب وأسقط الملفات هنا أو انقر للتصفح',
    maxSizeText: 'دعم ملفات متعددة (PDF, JPG, PNG)'
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

  const portraitUrl = service?.imageUrl || (service?.category ? categoryImages[service.category] : null) || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600&auto=format&fit=crop';

  const [view, setView] = useState<'details' | 'form' | 'success'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Reset form state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setView('details');
      setName('');
      setPhone('');
      setDescription('');
      setErrors({});
      setFiles([]);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!service) return null;

  const handleWhatsAppRequest = () => {
    const template = t.whatsappTemplate.replace('%SERVICE_NAME%', service.title);
    const encodedText = encodeURIComponent(template);
    const whatsappUrl = `https://wa.me/971552554688?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: boolean; phone?: boolean } = {};
    if (!name.trim()) newErrors.name = true;
    if (!phone.trim()) newErrors.phone = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('description', description.trim());
      formData.append('serviceTitle', service.title);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/requests', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setView('success');
      } else {
        alert(language === 'fa' ? 'خطا در ثبت درخواست' : language === 'ar' ? 'فشل في تقديم الطلب' : 'Failed to submit request');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
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
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md md:max-w-3xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[580px]"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Portrait Image Column (Desktop only) */}
            <div className={`hidden md:block w-[280px] h-full shrink-0 relative overflow-hidden bg-navy/25 ${isRtl ? 'order-last border-r' : 'order-first border-l'} border-border/40`}>
              <Image 
                src={portraitUrl} 
                alt={service.title} 
                fill 
                className="object-cover transition-transform duration-700 hover:scale-105" 
                sizes="300px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent z-10" />
              <div className="absolute bottom-6 right-6 left-6 z-20 text-right select-none animate-fadeIn" dir="rtl">
                <span className="text-[10px] font-black text-gold tracking-widest uppercase block mb-1">الافق الذهبی</span>
                <h3 className="text-sm font-black text-white leading-snug">{service.title}</h3>
                <div className="h-0.5 w-8 bg-gold mt-2.5 rounded-full" />
              </div>
            </div>

            {/* Main Content Area (Form / Details) */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between h-full relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute end-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground z-30 bg-white/70 backdrop-blur-sm shadow-sm"
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
                  className="pt-4 md:pt-0 text-start flex flex-col justify-between"
                >
                  {/* Mobile portrait banner (compact) */}
                  <div className="md:hidden relative h-32 w-full overflow-hidden rounded-2xl mb-4 border border-border/40 shrink-0">
                    <Image 
                      src={portraitUrl} 
                      alt={service.title} 
                      fill 
                      className="object-cover" 
                      sizes="300px"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent z-10" />
                    <div className="absolute bottom-3 right-4 left-4 z-20 text-right text-white" dir="rtl">
                      <span className="text-[9px] font-extrabold text-gold tracking-wider block mb-0.5">الافق الذهبی</span>
                      <h3 className="text-xs font-bold leading-tight">{service.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-gold" style={{ backgroundColor: '#fdf0d0' }}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {service.title}
                    </h2>
                  </div>

                  {/* Service pricing & timeline details */}
                  <div className="mb-5 flex flex-col gap-2.5">
                    {service.governmentFees && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t.govtFeeLabel}</span>
                        <span className="font-semibold text-foreground bg-secondary/80 px-3 py-0.5 rounded-full text-[12px] border border-border/40">
                          {service.governmentFees}
                        </span>
                      </div>
                    )}
                    {service.serviceFee && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t.serviceFeeLabel}</span>
                        <span className="font-semibold text-foreground bg-secondary/80 px-3 py-0.5 rounded-full text-[12px] border border-border/40">
                          {service.serviceFee}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{t.systemRegLabel}</span>
                      <span className="font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-0.5 rounded-full text-[12px] border border-emerald-200/40">
                        {t.systemRegVal}
                      </span>
                    </div>
                    {service.workingDays && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t.finalIssueLabel}</span>
                        <span className="font-semibold bg-[#fdf0d0] text-[#a05e2b] dark:bg-amber-950/40 dark:text-amber-300 px-3 py-0.5 rounded-full text-[12px] border border-amber-200/40">
                          {service.workingDays}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Requirements List (slate-coloured bullet points) */}
                  {service.requirements && service.requirements.length > 0 && (
                    <div className="mb-5 border-t border-border/50 pt-4 text-start">
                      <h4 className="text-xs font-bold text-navy mb-2 block">{t.requirementsLabel}</h4>
                      <ul className="flex flex-col gap-2 text-[13px] text-slate-600 dark:text-slate-400 font-medium">
                        {service.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="shrink-0 text-slate-400">-</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Long text description */}
                  <p className="mb-6 leading-relaxed text-muted-foreground text-sm border-t border-border/50 pt-4">
                    {service.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* WhatsApp CTA */}
                    <button
                      onClick={handleWhatsAppRequest}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-3.5 text-xs font-bold text-white shadow-md shadow-[#25D366]/20 transition-transform active:scale-98 hover:brightness-105"
                    >
                      <MessageSquare className="h-4.5 w-4.5 fill-current shrink-0" />
                      <span className="truncate">{t.whatsappBtn}</span>
                    </button>

                    {/* Form Request CTA */}
                    <button
                      onClick={() => setView('form')}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-navy px-3 py-3.5 text-xs font-bold text-white transition-transform active:scale-98 hover:bg-navy-light shadow-md shadow-navy/15"
                    >
                      <FileText className="h-4.5 w-4.5 shrink-0" />
                      <span className="truncate">{t.formBtn}</span>
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
                    <div className="flex flex-col gap-1.5 text-start">
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
                    <div className="flex flex-col gap-1.5 text-start">
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
                    <div className="flex flex-col gap-1.5 text-start">
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

                    {/* Premium Drag and Drop File Upload Field */}
                    <div className="flex flex-col gap-1.5 text-start">
                      <label className="text-xs font-semibold text-foreground px-1">
                        {t.uploadLabel}
                      </label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                          isDragging
                            ? 'border-gold bg-secondary bg-opacity-70 scale-[0.99]'
                            : 'border-border/80 bg-secondary/30 hover:border-gold/50 hover:bg-secondary/40'
                        }`}
                      >
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <UploadCloud className={`h-8 w-8 mb-2 transition-transform duration-300 text-gold ${isDragging ? 'scale-110' : ''}`} />
                        <p className="text-xs font-bold text-foreground">
                          {t.dragDropText}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {t.maxSizeText}
                        </p>
                      </div>

                      {/* Selected files list with size and removal trigger */}
                      {files.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border/40 px-3 py-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Paperclip className="h-3.5 w-3.5 text-gold shrink-0" />
                                <span className="truncate font-semibold text-foreground max-w-[200px]">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="rounded-full p-1 hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
          </div>
        </motion.div>
      </>
      )}
    </AnimatePresence>
  );
}
