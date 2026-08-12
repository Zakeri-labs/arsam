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

// Convert Persian/Arabic digits to English digits
function toEnglishDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str
    .split('')
    .map(c => {
      const pIdx = persianDigits.indexOf(c);
      if (pIdx > -1) return pIdx.toString();
      const aIdx = arabicDigits.indexOf(c);
      if (aIdx > -1) return aIdx.toString();
      return c;
    })
    .join('');
}

function normalizePhoneNumber(phoneStr: string): { normalized: string; isValid: boolean } {
  const cleaned = toEnglishDigits(phoneStr).trim();
  if (!cleaned) return { normalized: '', isValid: false };

  // Remove spaces, dashes, dots, parentheses
  const digitsOnly = cleaned.replace(/[\s\-\(\)\.]/g, '');

  // 1. Iran numbers:
  // 09123456789 (11 digits starting with 09) -> +989123456789
  if (/^09\d{9}$/.test(digitsOnly)) {
    return { normalized: '+98' + digitsOnly.substring(1), isValid: true };
  }
  // 989123456789 (12 digits starting with 989) -> +989123456789
  if (/^989\d{9}$/.test(digitsOnly)) {
    return { normalized: '+' + digitsOnly, isValid: true };
  }
  // +989123456789
  if (/^\+989\d{9}$/.test(digitsOnly)) {
    return { normalized: digitsOnly, isValid: true };
  }

  // 2. UAE numbers:
  // 0501234567 or 055... or 058... (10 digits starting with 05) -> +971501234567
  if (/^05\d{8}$/.test(digitsOnly)) {
    return { normalized: '+971' + digitsOnly.substring(1), isValid: true };
  }
  // 971501234567 or 9715... (12 digits) -> +971501234567
  if (/^9715\d{8}$/.test(digitsOnly)) {
    return { normalized: '+' + digitsOnly, isValid: true };
  }
  // +9715...
  if (/^\+9715\d{8}$/.test(digitsOnly)) {
    return { normalized: digitsOnly, isValid: true };
  }

  // 3. Oman numbers:
  // 8 digits starting with 7 or 9 (e.g. 71713238 or 91234567) -> +96871713238
  if (/^[79]\d{7}$/.test(digitsOnly)) {
    return { normalized: '+968' + digitsOnly, isValid: true };
  }
  // 07... or 09... (9 digits) -> +96871713238
  if (/^0[79]\d{7}$/.test(digitsOnly)) {
    return { normalized: '+968' + digitsOnly.substring(1), isValid: true };
  }
  // 96871713238 or 9689... (11 digits) -> +96871713238
  if (/^968[79]\d{7}$/.test(digitsOnly)) {
    return { normalized: '+' + digitsOnly, isValid: true };
  }
  // +96871713238
  if (/^\+968[79]\d{7}$/.test(digitsOnly)) {
    return { normalized: digitsOnly, isValid: true };
  }

  // 4. Any international number starting with '+' followed by 8 to 15 digits
  if (/^\+\d{8,15}$/.test(digitsOnly)) {
    return { normalized: digitsOnly, isValid: true };
  }

  // 5. If starts with 00 (e.g. 00971... or 0098...)
  if (/^00\d{8,15}$/.test(digitsOnly)) {
    return { normalized: '+' + digitsOnly.substring(2), isValid: true };
  }

  return { normalized: cleaned, isValid: false };
}

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
    namePlaceholder: 'Full name',
    phoneLabel: 'Phone Number',
    phonePlaceholder: 'e.g., +971...',
    descLabel: 'Description (Optional)',
    descPlaceholder: 'Any specific requests...',
    submitBtn: 'Send Request',
    backBtn: 'Back',
    closeBtn: 'Close',
    successTitle: 'Request Submitted!',
    successDesc: 'Your request has been successfully submitted. We will contact you shortly.',
    requiredField: 'Required',
    phoneErrorInvalid: 'Include country code (+971, +98, +968...)',
    whatsappTemplate: 'Hello, I am interested in the "%SERVICE_NAME%" service. Please provide more details.',
    serviceFeeLabel: 'Service Fee:',
    govtFeeLabel: 'Government Fees:',
    systemRegLabel: 'System Registration:',
    systemRegVal: '30 Mins',
    finalIssueLabel: 'Final Issuance:',
    requirementsLabel: 'Required Documents:',
    workingDaysLabel: 'Working Days',
    uploadLabel: 'Upload Documents (Optional)',
    dragDropText: 'Drag & drop or click to browse',
    maxSizeText: 'PDF, JPG, PNG',
    requirementsUploadTitle: 'Upload Documents (Optional)',
    otherDocsLabel: 'Other / Additional Documents',
    chooseFile: 'Attach File',
    noFileChosen: 'No file selected',
    otherDocPrefix: 'Other Doc'
  },
  fa: {
    whatsappBtn: 'واتساپ',
    formBtn: 'فرم درخواست',
    formTitle: 'درخواست خدمت',
    nameLabel: 'نام و نام خانوادگی',
    namePlaceholder: 'نام کامل خود را وارد کنید',
    phoneLabel: 'شماره تماس',
    phonePlaceholder: 'مثال: ۰۹۱۲۳۴۵۶۷۸۹ یا +۹۷۱',
    descLabel: 'توضیحات (اختیاری)',
    descPlaceholder: 'درخواست خاص یا توضیحات بیشتر...',
    submitBtn: 'ارسال درخواست',
    backBtn: 'بازگشت',
    closeBtn: 'بستن',
    successTitle: 'درخواست شما ثبت شد!',
    successDesc: 'درخواست شما با موفقیت ثبت شد. به‌زودی با شما ارتباط خواهیم گرفت.',
    requiredField: 'الزامی',
    phoneErrorInvalid: 'لطفاً همراه پیش‌شماره (+98 / +971 / +968) وارد کنید',
    whatsappTemplate: 'سلام، من علاقه‌مند به دریافت خدمات "%SERVICE_NAME%" هستم. لطفاً اطلاعات بیشتری ارسال کنید.',
    serviceFeeLabel: 'دستمزد خدمات:',
    govtFeeLabel: 'هزینه‌های دولتی:',
    systemRegLabel: 'ثبت درخواست:',
    systemRegVal: '۳۰ دقیقه',
    finalIssueLabel: 'صدور نهایی:',
    requirementsLabel: 'مدارک مورد نیاز :',
    workingDaysLabel: 'روز کاری',
    uploadLabel: 'آپلود مدارک (اختیاری)',
    dragDropText: 'انتخاب فایل یا رهاسازی',
    maxSizeText: 'فرمت‌های PDF، JPG، PNG',
    requirementsUploadTitle: 'آپلود مدارک (اختیاری)',
    otherDocsLabel: 'سایر مدارک یا فایل اضافی',
    chooseFile: 'پیوست فایل',
    noFileChosen: 'انتخاب نشده',
    otherDocPrefix: 'سایر مدارک'
  },
  ar: {
    whatsappBtn: 'واتساب',
    formBtn: 'نموذج الطلب',
    formTitle: 'طلب خدمة',
    nameLabel: 'الاسم الكامل',
    namePlaceholder: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: 'مثال: +971...',
    descLabel: 'تفاصيل إضافية (اختياري)',
    descPlaceholder: 'أي ملاحظات خاصة...',
    submitBtn: 'إرسال الطلب',
    backBtn: 'العودة',
    closeBtn: 'إغلاق',
    successTitle: 'تم تقديم الطلب بنجاح!',
    successDesc: 'تم تسجيل طلبك بنجاح. سنتواصل معك قريباً.',
    requiredField: 'مطلوب',
    phoneErrorInvalid: 'يرجى إدخال رقم الهاتف مع رمز الدولة (+971, +98...)',
    whatsappTemplate: 'مرحباً، أنا مهتم بالحصول على خدمة "%SERVICE_NAME%". يرجى تزويدي بمزيد من التفاصيل.',
    serviceFeeLabel: 'رسوم الخدمة:',
    govtFeeLabel: 'الرسوم الحكومية:',
    systemRegLabel: 'تسجيل الطلب:',
    systemRegVal: '٣٠ دقيقة',
    finalIssueLabel: 'الإصدار النهائي:',
    requirementsLabel: 'المستندات المطلوبة:',
    workingDaysLabel: 'أيام عمل',
    uploadLabel: 'تحميل المستندات (اختياري)',
    dragDropText: 'اختر الملف أو اسحبه هنا',
    maxSizeText: 'PDF, JPG, PNG',
    requirementsUploadTitle: 'تحميل المستندات (اختياري)',
    otherDocsLabel: 'مستندات أخرى أو إضافية',
    chooseFile: 'إرفاق ملف',
    noFileChosen: 'لم يتم الاختيار',
    otherDocPrefix: 'مستندات أخرى'
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

  const hasImage = !!service?.imageUrl;
  const portraitUrl = service?.imageUrl || '';

  const [view, setView] = useState<'details' | 'form' | 'success'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});
  const [phoneErrorMsg, setPhoneErrorMsg] = useState<string>('');

  // Dedicated slots for requirements + extra files array
  const [slotFiles, setSlotFiles] = useState<Record<number, File>>({});
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setView('details');
      setName('');
      setPhone('');
      setDescription('');
      setErrors({});
      setPhoneErrorMsg('');
      setSlotFiles({});
      setExtraFiles([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!service) return null;

  const handleWhatsAppRequest = () => {
    const template = t.whatsappTemplate.replace('%SERVICE_NAME%', service.title);
    const encodedText = encodeURIComponent(template);
    const whatsappUrl = `https://wa.me/96894521746?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSlotFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlotFiles(prev => ({ ...prev, [index]: file }));
    }
  };

  const removeSlotFile = (index: number) => {
    setSlotFiles(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleExtraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setExtraFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeExtraFile = (index: number) => {
    setExtraFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhoneBlur = () => {
    if (phone.trim()) {
      const res = normalizePhoneNumber(phone);
      if (res.isValid) {
        setPhone(res.normalized);
        setErrors(prev => ({ ...prev, phone: false }));
        setPhoneErrorMsg('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: boolean; phone?: boolean } = {};
    
    if (!name.trim()) {
      newErrors.name = true;
    }

    // Smart Phone Validation & Normalization
    const phoneRes = normalizePhoneNumber(phone);
    if (!phone.trim()) {
      newErrors.phone = true;
      setPhoneErrorMsg(t.requiredField);
    } else if (!phoneRes.isValid) {
      newErrors.phone = true;
      setPhoneErrorMsg(t.phoneErrorInvalid);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phoneRes.normalized);
      formData.append('description', description.trim());
      formData.append('serviceTitle', service.title);
      
      const allFilesToUpload: File[] = [];

      // Requirement slot files
      if (service.requirements && service.requirements.length > 0) {
        service.requirements.forEach((req, idx) => {
          const file = slotFiles[idx];
          if (file) {
            const cleanReqName = req.replace(/[/\\?%*:|"<>]/g, '').trim().substring(0, 30);
            const renamedFile = new File([file], `[${cleanReqName}] ${file.name}`, { type: file.type });
            allFilesToUpload.push(renamedFile);
          }
        });
      }

      // Extra files
      extraFiles.forEach(file => {
        const renamedFile = new File([file], `[${t.otherDocPrefix}] ${file.name}`, { type: file.type });
        allFilesToUpload.push(renamedFile);
      });

      allFilesToUpload.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/requests', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setView('success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(language === 'fa' 
          ? `خطا در ثبت درخواست: ${errorData.details || errorData.error || 'پاسخ نامعتبر از سرور'}` 
          : `Failed to submit request: ${errorData.details || errorData.error || 'Server error'}`
        );
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      alert(language === 'fa' ? `خطا در ارتباط با سرور: ${err.message || err}` : `Network error: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
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
            className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col ${
              hasImage ? 'max-h-[92vh]' : 'p-5 max-h-[92vh] overflow-y-auto'
            }`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Landscape Image Banner */}
            {hasImage && (
              <div className="relative h-36 w-full overflow-hidden shrink-0 border-b border-border/40 bg-navy/5">
                <Image 
                  src={portraitUrl} 
                  alt={service.title} 
                  fill 
                  className="object-cover transition-transform duration-700 hover:scale-105" 
                  sizes="450px"
                  priority
                />
              </div>
            )}

            {/* Main Content Area */}
            <div className={hasImage ? "flex-1 p-4.5 overflow-y-auto flex flex-col justify-between relative" : "relative w-full"}>
              {/* Close button */}
              <button
                onClick={onClose}
                className={hasImage 
                  ? "absolute end-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground z-30 bg-white/80 backdrop-blur-sm shadow-sm border border-border/20" 
                  : "absolute end-0 top-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground z-10"
                }
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="pt-1 text-start flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gold" style={{ backgroundColor: '#fdf0d0' }}>
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="text-base font-bold text-foreground leading-tight">
                      {service.title}
                    </h2>
                  </div>

                  {/* Service pricing & timeline details (Prices temporarily hidden) */}
                  <div className="mb-3 flex flex-col gap-1 text-xs">
                    {/* Temporarily hidden prices
                    {service.governmentFees && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{t.govtFeeLabel}</span>
                        <span className="font-semibold text-foreground bg-secondary/80 px-2.5 py-0.5 rounded-full text-[11px] border border-border/40">
                          {service.governmentFees}
                        </span>
                      </div>
                    )}
                    {service.serviceFee && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{t.serviceFeeLabel}</span>
                        <span className="font-semibold text-foreground bg-secondary/80 px-2.5 py-0.5 rounded-full text-[11px] border border-border/40">
                          {service.serviceFee}
                        </span>
                      </div>
                    )}
                    */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{t.systemRegLabel}</span>
                      <span className="font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200/40">
                        {t.systemRegVal}
                      </span>
                    </div>
                    {service.workingDays && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{t.finalIssueLabel}</span>
                        <span className="font-semibold bg-[#fdf0d0] text-[#a05e2b] dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] border border-amber-200/40">
                          {service.workingDays}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Requirements List */}
                  {service.requirements && service.requirements.length > 0 && (
                    <div className="mb-3 border-t border-border/50 pt-2 text-start">
                      <h4 className="text-xs font-bold text-navy mb-1 block">{t.requirementsLabel}</h4>
                      <ul className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {service.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="shrink-0 text-slate-400">-</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Long text description */}
                  <p className="mb-4 leading-relaxed text-muted-foreground text-xs border-t border-border/50 pt-2.5">
                    {service.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* WhatsApp CTA */}
                    <button
                      onClick={handleWhatsAppRequest}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-2.5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#25D366]/20 transition-transform active:scale-98 hover:brightness-105"
                    >
                      <MessageSquare className="h-4 w-4 fill-current shrink-0" />
                      <span className="truncate">{t.whatsappBtn}</span>
                    </button>

                    {/* Form Request CTA */}
                    <button
                      onClick={() => setView('form')}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-navy px-2.5 py-2.5 text-xs font-bold text-white transition-transform active:scale-98 hover:bg-navy-light shadow-md shadow-navy/15"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
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
                  className="pt-1 text-start"
                >
                  {/* Header with Back button */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setView('details')}
                      className="rounded-xl p-1 hover:bg-secondary text-muted-foreground transition-colors"
                      aria-label="Back"
                    >
                      <ArrowLeft className={`h-4.5 w-4.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                    <h2 className="text-base font-bold text-foreground">
                      {t.formTitle}
                    </h2>
                  </div>

                  {/* Form Service Indicator */}
                  <div className="mb-3.5 rounded-xl bg-secondary/60 px-3.5 py-2.5 border border-border/50 flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
                      {t.formTitle}
                    </span>
                    <span className="text-xs font-extrabold text-foreground leading-snug break-words">
                      {service.title}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {/* Name & Phone side-by-side in ONE row (2 columns) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Name field */}
                      <div className="flex flex-col gap-1 text-start">
                        <label className="text-xs font-bold text-foreground px-0.5">
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
                          className={`w-full rounded-xl border bg-card px-3 py-2.5 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 ${
                            errors.name ? 'border-destructive focus:border-destructive' : 'border-border focus:border-gold'
                          }`}
                        />
                        {errors.name && (
                          <span className="text-[10px] text-destructive px-0.5">{t.requiredField}</span>
                        )}
                      </div>

                      {/* Phone field */}
                      <div className="flex flex-col gap-1 text-start">
                        <label className="text-xs font-bold text-foreground px-0.5">
                          {t.phoneLabel} <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: false }));
                          }}
                          onBlur={handlePhoneBlur}
                          placeholder={t.phonePlaceholder}
                          className={`w-full rounded-xl border bg-card px-3 py-2.5 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/60 ${
                            errors.phone ? 'border-destructive focus:border-destructive' : 'border-border focus:border-gold'
                          }`}
                          dir="ltr"
                        />
                        {errors.phone && (
                          <span className="text-[9px] text-destructive px-0.5 leading-tight">{phoneErrorMsg || t.requiredField}</span>
                        )}
                      </div>
                    </div>

                    {/* Description field */}
                    <div className="flex flex-col gap-1 text-start">
                      <label className="text-xs font-bold text-foreground px-0.5">
                        {t.descLabel}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.descPlaceholder}
                        rows={2}
                        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground outline-none transition-all focus:border-gold placeholder:text-muted-foreground/60 resize-none"
                      />
                    </div>

                    {/* Document Upload Section */}
                    <div className="flex flex-col gap-2.5 text-start border-t border-border/50 pt-3">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-gold shrink-0" />
                        <span>{t.requirementsUploadTitle}</span>
                      </label>

                      {/* Requirement upload rows */}
                      {service.requirements && service.requirements.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {service.requirements.map((req, idx) => {
                            const slotFile = slotFiles[idx];
                            return (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3.5 py-2.5 text-xs transition-all hover:border-gold/50"
                              >
                                <span className="font-semibold text-foreground/90 text-xs flex items-center gap-2 min-w-0 leading-tight">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0"></span>
                                  <span className="leading-snug break-words">{req}</span>
                                </span>

                                {slotFile ? (
                                  <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span className="truncate max-w-[110px]">{slotFile.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeSlotFile(idx)}
                                      className="rounded-full p-0.5 hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex items-center gap-1.5 rounded-xl bg-card border border-border/90 px-3 py-1.5 text-xs font-bold text-navy dark:text-gold hover:border-gold cursor-pointer transition-all shadow-2xs shrink-0 active:scale-95">
                                    <UploadCloud className="h-3.5 w-3.5 text-gold shrink-0" />
                                    <span>{t.chooseFile}</span>
                                    <input
                                      type="file"
                                      onChange={(e) => handleSlotFileChange(idx, e)}
                                      className="hidden"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Extra / Other Documents Slot */}
                      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/90 bg-secondary/20 px-3.5 py-2.5 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-foreground/80 text-xs flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{t.otherDocsLabel}</span>
                          </span>
                          <label className="flex items-center gap-1.5 rounded-xl bg-card border border-border/90 px-3 py-1.5 text-xs font-bold text-navy dark:text-gold hover:border-gold cursor-pointer transition-all shadow-2xs shrink-0 active:scale-95">
                            <UploadCloud className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{t.chooseFile}</span>
                            <input
                              type="file"
                              multiple
                              onChange={handleExtraFileChange}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </label>
                        </div>

                        {/* Extra Files list */}
                        {extraFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {extraFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded-lg bg-card border border-border/50 px-2.5 py-1 text-xs shadow-2xs"
                              >
                                <Paperclip className="h-3.5 w-3.5 text-gold shrink-0" />
                                <span className="truncate max-w-[120px] font-medium text-foreground">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeExtraFile(idx)}
                                  className="rounded-full hover:text-destructive text-muted-foreground transition-colors shrink-0"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-3 text-sm font-bold text-white transition-transform active:scale-98 hover:bg-navy-light disabled:opacity-50 cursor-pointer shadow-md shadow-navy/15"
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>{t.submitBtn}</span>
                        </>
                      )}
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
                  className="flex flex-col items-center text-center pt-5 pb-2 select-none animate-fadeIn"
                >
                  <div className="mb-4 flex h-18 w-18 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-md border-2 border-emerald-100/50 animate-bounce">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>

                  <h2 className="mb-2 text-lg font-black text-foreground">
                    {t.successTitle}
                  </h2>

                  <p className="mb-5 text-xs text-muted-foreground leading-relaxed max-w-[260px] font-bold">
                    {t.successDesc}
                  </p>

                  <button
                    onClick={onClose}
                    className="w-full rounded-xl bg-secondary px-5 py-2.5 text-xs font-black text-foreground transition-colors hover:bg-secondary/85 active:scale-98 border border-border/40 shadow-sm cursor-pointer"
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
