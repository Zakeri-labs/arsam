'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { type Language, type Country, languageNames, countryNames } from '@/lib/content';
import { Globe, ChevronRight, MapPin, Shield } from 'lucide-react';

interface SelectionModalProps {
  isOpen: boolean;
  step: 'language' | 'country';
  selectedLanguage: Language | null;
  onLanguageSelect: (lang: Language) => void;
  onCountrySelect: (country: Country) => void;
}

const languageIcons: Record<Language, React.ReactNode> = {
  en: <span className="text-xs font-bold uppercase">En</span>,
  fa: <span className="text-base font-semibold">ف</span>,
  ar: <span className="text-base font-semibold">ع</span>,
};

export function SelectionModal({
  isOpen,
  step,
  selectedLanguage,
  onLanguageSelect,
  onCountrySelect,
}: SelectionModalProps) {
  const isRtl = selectedLanguage === 'fa' || selectedLanguage === 'ar';

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalHeight = document.body.style.height;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.height = originalHeight;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 h-[100dvh] w-screen z-50 flex flex-col overflow-y-auto"
        >
          {/* Solid minimal premium background (slightly off-white) */}
          <div className="absolute inset-0 bg-[#f4f5f6]" />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pt-14 pb-14 min-h-[100dvh]">
            {/* Logo at top */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center p-4"
            >
              <div className="logo-shimmer-container">
                <Image
                  src="/black-lion.png"
                  alt="Shiny Horizon"
                  width={240}
                  height={240}
                  className="h-auto w-48 object-contain mix-blend-multiply drop-shadow-md"
                  priority
                />
              </div>
            </motion.div>

            {/* Selection Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-sm"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <AnimatePresence mode="wait">
                {step === 'language' ? (
                  <motion.div
                    key="language"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-2 w-full"
                  >
                    <h2 className="mb-1 text-center text-xl font-bold text-foreground">
                      Select Language
                    </h2>
                    <p className="mb-6 text-center text-sm text-muted-foreground">
                      Choose your preferred language
                    </p>

                    <div className="flex flex-col gap-2.5">
                      {(['en', 'fa', 'ar'] as Language[]).map((lang) => (
                        <motion.button
                          key={lang}
                          onClick={() => onLanguageSelect(lang)}
                          className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:border-gold hover:bg-secondary shadow-sm"
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full shadow-sm bg-white text-primary">
                              {languageIcons[lang]}
                            </div>
                            <span className="font-semibold text-sm text-foreground">
                              {lang === 'en' ? 'English' : lang === 'fa' ? 'Farsi (Persian)' : 'Arabic'}
                            </span>
                          </div>
                          <ChevronRight className={`h-4.5 w-4.5 text-muted-foreground transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'} group-hover:text-gold`} />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="country"
                    initial={{ opacity: 0, x: isRtl ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? 15 : -15 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-2 w-full"
                  >
                    <h2 className="mb-1 text-center text-xl font-bold text-foreground">
                      {selectedLanguage === 'fa' 
                        ? 'کشور مقصد خدمات'
                        : selectedLanguage === 'ar'
                        ? 'بلد وجهة الخدمات'
                        : 'Services Destination'}
                    </h2>
                    <p className="mb-6 text-center text-sm text-muted-foreground">
                      {selectedLanguage === 'fa' 
                        ? 'خدمات کدام کشور را می‌خواهید؟'
                        : selectedLanguage === 'ar'
                        ? 'في أي بلد تريد خدماتنا؟'
                        : "Which country's services do you need?"}
                    </p>

                    <div className="flex flex-col gap-2.5">
                      {/* UAE Option */}
                      <motion.button
                        onClick={() => onCountrySelect('uae')}
                        className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:border-gold hover:bg-secondary shadow-sm"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full shadow-sm bg-white">
                            <svg viewBox="0 0 36 24" className="h-5.5 w-auto">
                              <rect width="36" height="8" fill="#00732F" />
                              <rect y="8" width="36" height="8" fill="#FFFFFF" />
                              <rect y="16" width="36" height="8" fill="#000000" />
                              <rect width="9" height="24" fill="#FF0000" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start leading-none">
                            <span className="font-semibold text-sm text-foreground">
                              {selectedLanguage ? countryNames[selectedLanguage].uae : 'United Arab Emirates'}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">UAE</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4.5 w-4.5 text-muted-foreground transition-transform group-hover:text-gold ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                      </motion.button>

                      {/* Oman Option */}
                      <motion.button
                        onClick={() => onCountrySelect('oman')}
                        className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:border-gold hover:bg-secondary shadow-sm"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full shadow-sm bg-white">
                            <svg viewBox="0 0 36 24" className="h-5.5 w-auto">
                              <rect width="36" height="24" fill="#FFFFFF" />
                              <rect width="36" height="8" fill="#EF2B2D" />
                              <rect y="16" width="36" height="8" fill="#009E49" />
                              <rect width="9" height="24" fill="#EF2B2D" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start leading-none">
                            <span className="font-semibold text-sm text-foreground">
                              {selectedLanguage ? countryNames[selectedLanguage].oman : 'Oman'}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">OMAN</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4.5 w-4.5 text-muted-foreground transition-transform group-hover:text-gold ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Bottom tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-foreground/50"
            >
              <div className="h-1 w-1 rounded-full bg-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {step === 'language' ? 'Your Business, Our Priority' : 'Secure • Reliable • Professional'}
              </span>
              <div className="h-1 w-1 rounded-full bg-gold" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
