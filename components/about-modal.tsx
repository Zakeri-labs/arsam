'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Globe, MapPin, Clock, CheckCircle2, ShieldCheck, Milestone } from 'lucide-react';
import Image from 'next/image';
import type { Language } from '@/lib/content';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface AboutContent {
  title: string;
  subtitle: string;
  p1: string;
  p2: string;
  p3: string;
  whyHeader: string;
  whyText: string;
  footerTagline: string;
  contactHeader: string;
  phoneLabel: string;
  emailLabel: string;
  websiteLabel: string;
  locationLabel: string;
  locationVal: string;
  hoursLabel: string;
  hoursVal: string;
  closeBtn: string;
}

const aboutContent: Record<Language, AboutContent> = {
  en: {
    title: 'AL UFUQ AL DAHABI',
    subtitle: 'Your Trusted Partner for Starting, Managing, and Growing Your Business in UAE & Oman',
    p1: 'At AL UFUQ AL DAHABI, we don\'t just provide administrative services; we make the process of setting up and managing your business simpler, faster, and more secure. With hands-on experience in company registration, corporate residency, license renewal, residency renewal, corporate taxation, corporate bank accounts, and business development services, we help business owners, investors, and individuals starting in the UAE and Oman to launch and manage their operations with a clear vision and correct legal pathways.',
    p2: 'From the very first step of selecting your activities and registering your company, to subsequent phases like obtaining residency, preparing documents, tracking renewals, managing tax filings, and structuring your business for growth, our team is by your side to ensure you move forward without confusion, wasted time, or costly mistakes. Over the years, we have successfully managed and completed hundreds of corporate cases in company formation, residency, license renewals, tax advisory, and business operations, earning the trust and high satisfaction of our corporate clients.',
    p3: 'At AL UFUQ AL DAHABI, our ultimate goal is to let you focus on growing your business instead of getting caught up in administrative, legal, and tax complexities. We handle the rest of the journey with precision, dedication, and expertise.',
    whyHeader: 'Why AL UFUQ AL DAHABI?',
    whyText: 'Because starting a business in a new country is not just about filling out a few forms. Behind every decision lie crucial legal, tax, and operational details that, if not handled correctly, will cause headaches later on—especially since administrative systems often have a strange way of complicating human life. With our deep expertise, meticulous follow-ups, and thorough knowledge of administrative pathways in the UAE and Oman, we ensure you navigate every step in a professional and secure manner.',
    footerTagline: 'From company setup to residency, from document renewals to taxation; your partner in building and expanding your business.',
    contactHeader: 'Contact & Location Info',
    phoneLabel: 'Phone & WhatsApp',
    emailLabel: 'Email Address',
    websiteLabel: 'Official Website',
    locationLabel: 'Business Address',
    locationVal: 'Dubai National Insurance Building, 9th Floor, Office 43, Opposite City Centre Deira, Dubai, United Arab Emirates',
    hoursLabel: 'Working Hours',
    hoursVal: 'Daily except Sundays, 10:00 AM to 10:00 PM',
    closeBtn: 'Back to Services',
  },
  fa: {
    title: 'الافق الذهبی (AL UFUQ AL DAHABI)',
    subtitle: 'همراه مطمئن شما برای شروع، مدیریت و توسعه کسب‌وکار در امارات و عمان',
    p1: 'در AL UFUQ AL DAHABI ما فقط خدمات اداری ارائه نمی‌دهیم؛ ما مسیر راه‌اندازی و مدیریت کسب‌وکار شما را ساده‌تر، سریع‌تر و مطمئن‌تر می‌کنیم. با تجربه‌ای عملی در حوزه ثبت شرکت، اخذ اقامت، تمدید لایسنس، تمدید اقامت، امور مالیاتی، افتتاح حساب شرکتی و خدمات مربوط به توسعه کسب‌وکار، ما به صاحبان بیزینس، سرمایه‌گذاران و افرادی که قصد شروع فعالیت در امارات و عمان را دارند کمک می‌کنیم تا با دیدی روشن و مسیر قانونی درست، کار خود را آغاز و مدیریت کنند.',
    p2: 'از اولین قدم، یعنی انتخاب نوع فعالیت و ثبت شرکت، تا مراحل بعدی مانند دریافت اقامت، آماده‌سازی مدارک، پیگیری تمدیدها، انجام امور مالیاتی و ساختاردهی بهتر به کسب‌وکار، تیم ما در کنار شماست تا بدون سردرگمی، اتلاف وقت و اشتباهات پرهزینه جلو بروید. ما طی این مدت موفق شده‌ایم پرونده‌های متعددی را در زمینه ثبت شرکت، اقامت، تمدید لایسنس، خدمات مالیاتی و امور بیزینسی با موفقیت انجام دهیم و رضایت مشتریان خود را به دست آوریم. تا امروز، بیش از صدها پرونده موفق توسط تیم ما مدیریت و تکمیل شده است؛ عددی که برای ما فقط یک آمار نیست، بلکه نشان‌دهنده اعتماد مشتریانی است که مسیر مهم کاری و مهاجرتی خود را به ما سپرده‌اند.',
    p3: 'در AL UFUQ AL DAHABI هدف ما این است که شما به جای درگیر شدن با پیچیدگی‌های اداری، قانونی و مالیاتی، روی رشد کسب‌وکار خود تمرکز کنید. باقی مسیر را ما با دقت، پیگیری و تجربه جلو می‌بریم.',
    whyHeader: 'چرا AL UFUQ AL DAHABI؟',
    whyText: 'چون شروع یک کسب‌وکار در کشور جدید فقط پر کردن چند فرم نیست. پشت هر تصمیم، جزئیات قانونی، مالیاتی و اجرایی وجود دارد که اگر درست انجام نشود، بعداً برایتان دردسر درست می‌کند، چون ظاهراً سیستم‌های اداری علاقه عجیبی به پیچیده کردن زندگی انسان دارند. ما با تجربه، پیگیری دقیق و شناخت مسیرهای اداری در امارات و عمان، کمک می‌کنیم هر مرحله را اصولی و مطمئن طی کنید.',
    footerTagline: 'از ثبت شرکت تا اقامت، از تمدید مدارک تا امور مالیاتی؛ همراه شما در مسیر ساخت و توسعه کسب‌وکار.',
    contactHeader: 'اطلاعات تماس و ارتباط با ما',
    phoneLabel: 'تلفن و واتساپ پشتیبانی',
    emailLabel: 'آدرس ایمیل رسمی',
    websiteLabel: 'وب‌سایت رسمی',
    locationLabel: 'آدرس دفتر مرکزی دبی',
    locationVal: 'امارات متحده عربی، شهر دبی، روبروی سیتی سنتر دیره، ساختمان Dubai National Insurance، طبقه ۹، واحد ۴۳',
    hoursLabel: 'ساعت کاری دفتر',
    hoursVal: 'همه‌روزه به جز یکشنبه‌ها (از ساعت ۱۰ صبح الی ۱۰ شب)',
    closeBtn: 'بازگشت به خدمات',
  },
  ar: {
    title: 'الأفق الذهبي (AL UFUQ AL DAHABI)',
    subtitle: 'شريكك الموثوق لتأسيس وإدارة وتنمية أعمالك في الإمارات وعمان',
    p1: 'في الأفق الذهبي، نحن لا نقدم فقط الخدمات الإدارية؛ بل نجعل مسار تأسيس وإدارة أعمالك أسهل، أسرع، وأكثر أماناً. من خلال خبرتنا العملية في مجالات تأسيس الشركات، الحصول على الإقامة، تجديد التراخيص التجارية، تجديد الإقامات، المعاملات الضريبية، فتح الحسابات البنكية للشركات، وخدمات تطوير الأعمال، نساعد أصحاب المشاريع، المستثمرين، والأفراد الراغبين في بدء نشاطهم في دولة الإمارات وسلطنة عمان على بدء وإدارة أعمالهم برؤية واضحة ومسار قانوني صحيح.',
    p2: 'من الخطوة الأولى المتمثلة في اختيار نوع النشاط وتأسيس الشركة، إلى المراحل التالية مثل الحصول على الإقامة، إعداد المستندات، متابعة التجديدات، تقديم الإقرارات الضريبية، وهيكلة أعمالك للنمو، يقف فريقنا بجانبك لضمان تقدمك دون حيرة، هدر للوقت، أو أخطاء مكلفة. لقد نجحنا على مدار السنوات الماضية في إدارة وإتمام مئات الملفات بنجاح في مجالات تأسيس الشركات، الإقامات، تجديد التراخيص، الاستشارات الضريبية، والأعمال التجارية، كاسبين ثقة ورضا عملائنا الكرام.',
    p3: 'في الأفق الذهبي، هدفنا هو تمكينك من التركيز على نمو أعمالك بدلاً من الانشغال بالتعقيدات الإدارية، القانونية، والضريبية. نحن نتولى بقية المسار بدقة، متابعة مستمرة، وخبرة واسعة.',
    whyHeader: 'لماذا الأفق الذهبي؟',
    whyText: 'لأن بدء عمل تجاري في بلد جديد لا يقتصر فقط على ملء بعض النماذج. فوراء كل قرار تكمن تفاصيل قانونية، ضريبية، وإجرائية بالغة الأهمية، إذا لم تُنفذ بشكل صحيح، فستسبب لك مشاكل لاحقاً—خاصة وأن الأنظمة الإدارية يبدو أنها تحب تعقيد حياة البشر. نحن بفضل خبرتنا، ومتابعتنا الدقيقة، ومعرفتنا بالمسارات الإدارية في الإمارات وعمان، نضمن لك اجتياز كل مرحلة بشكل صحيح وآمن.',
    footerTagline: 'من تأسيس الشركات إلى الإقامة، ومن تجديد المستندات إلى الضرائب؛ شريكك في بناء وتطوير الأعمال.',
    contactHeader: 'معلومات الاتصال والموقع',
    phoneLabel: 'الهاتف والواتساب المباشر',
    emailLabel: 'البريد الإلكتروني الرسمي',
    websiteLabel: 'الموقع الإلكتروني الرسمي',
    locationLabel: 'عنوان المكتب في دبي',
    locationVal: 'دولة الإمارات العربية المتحدة، مدينة دبي، مقابل سيتي سنتر ديرة، مبنى دبي الوطني للتأمين، الطابق 9، مكتب 43',
    hoursLabel: 'ساعات العمل الرسمية',
    hoursVal: 'يومياً ما عدا الأحد، من الساعة 10 صباحاً حتى 10 مساءً',
    closeBtn: 'العودة إلى الخدمات',
  },
};

export function AboutModal({ isOpen, onClose, language }: AboutModalProps) {
  const isRtl = language === 'fa' || language === 'ar';
  const t = aboutContent[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#f4f5f6] overflow-y-auto w-screen h-[100dvh]"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between bg-[#f4f5f6]/90 px-6 py-4 backdrop-blur-md border-b border-slate-200/50">
            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-full bg-slate-200/60 p-2 text-slate-700 transition-colors hover:bg-slate-200 active:scale-95"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <span className="text-sm font-bold text-navy">
              {language === 'fa' ? 'درباره ما' : language === 'ar' ? 'من نحن' : 'About Us'}
            </span>
            <div className="w-8 h-8 opacity-0" /> {/* Spacer to align title centered */}
          </div>

          {/* Content Wrapper */}
          <div className="flex-1 px-6 py-8 pb-32 max-w-2xl mx-auto w-full">
            {/* Elegant Brand Logo Banner */}
            <div className="flex flex-col items-center mb-8">
              <div className="logo-shimmer-container mb-4">
                <Image
                  src="/logo.png"
                  alt="Shiny Horizon"
                  width={150}
                  height={180}
                  className="h-auto w-28 object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold text-navy text-center mb-2">
                {t.title}
              </h1>
              <p className="text-xs text-gold font-semibold text-center max-w-md leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Intro Blocks */}
            <div className="space-y-5 text-sm leading-relaxed text-slate-700 text-justify">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-3 items-start"
              >
                <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <p>{t.p1}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-3 items-start"
              >
                <Milestone className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <p>{t.p2}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 items-start"
              >
                <ShieldCheck className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <p>{t.p3}</p>
              </motion.div>
            </div>

            {/* "Why Us" Showcase Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="my-8 rounded-2xl border-l-4 border-gold bg-[#eef0f2] p-5 shadow-sm"
            >
              <h2 className="mb-3 text-base font-bold text-navy">
                {t.whyHeader}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 text-justify">
                {t.whyText}
              </p>
            </motion.div>

            {/* Contact Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl border border-border bg-white p-6 shadow-md shadow-slate-200/50"
            >
              <h2 className="mb-5 text-base font-bold text-navy border-b pb-3 border-slate-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-gold" />
                {t.contactHeader}
              </h2>

              <div className="space-y-4 text-sm">
                {/* Phone & WhatsApp */}
                <a
                  href="https://wa.me/971552554688"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 active:bg-slate-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Phone className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t.phoneLabel}</p>
                      <p className="font-semibold text-foreground dir-ltr">+971 55 255 4688</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gold group-hover:underline">
                    {language === 'fa' ? 'چت و تماس' : language === 'ar' ? 'دردشة واتساب' : 'Chat / Call'}
                  </span>
                </a>

                {/* Email Address */}
                <a
                  href="mailto:Alirezaebrahimi.ceo@gmail.com"
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 active:bg-slate-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t.emailLabel}</p>
                      <p className="font-semibold text-foreground">Alirezaebrahimi.ceo@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gold group-hover:underline">
                    {language === 'fa' ? 'ارسال ایمیل' : language === 'ar' ? 'إرسال بريد' : 'Email Us'}
                  </span>
                </a>

                {/* Official Website */}
                <a
                  href="https://www.ofoghetalaei.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 active:bg-slate-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Globe className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t.websiteLabel}</p>
                      <p className="font-semibold text-foreground text-xs leading-none">www.ofoghetalaei.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gold group-hover:underline">
                    {language === 'fa' ? 'مشاهده سایت' : language === 'ar' ? 'زيارة الموقع' : 'Visit Site'}
                  </span>
                </a>

                {/* Office Working Hours */}
                <div className="flex items-center gap-3 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t.hoursLabel}</p>
                    <p className="font-semibold text-foreground text-xs leading-relaxed">
                      {t.hoursVal}
                    </p>
                  </div>
                </div>

                {/* Office Location */}
                <div className="flex items-start gap-3 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{t.locationLabel}</p>
                    <p className="font-semibold text-foreground text-xs leading-relaxed text-justify">
                      {t.locationVal}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom Tagline block */}
            <p className="mt-8 text-center text-xs text-muted-foreground italic leading-relaxed max-w-sm mx-auto">
              {t.footerTagline}
            </p>

            {/* Back Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={onClose}
                className="rounded-full bg-navy px-8 py-3 text-xs font-bold text-white transition-all shadow-md shadow-navy/20 hover:bg-navy/95 active:scale-98"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
