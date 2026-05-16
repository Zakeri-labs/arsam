'use client';

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
  en: <Globe className="h-5 w-5" />,
  fa: <span className="text-lg font-semibold">ع</span>,
  ar: <span className="text-lg font-semibold">ف</span>,
};

export function SelectionModal({
  isOpen,
  step,
  selectedLanguage,
  onLanguageSelect,
  onCountrySelect,
}: SelectionModalProps) {
  const isRtl = selectedLanguage === 'fa' || selectedLanguage === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Background with Dubai skyline */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'linear-gradient(to bottom, rgba(15, 30, 55, 0.7), rgba(15, 30, 55, 0.95)), url("https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80")'
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 py-12 pb-8">
            {/* Logo at top */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <Image
                src="/logo.png"
                alt="Shiny Horizon"
                width={160}
                height={200}
                className="h-auto w-32 object-contain"
                priority
              />
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
                    exit={{ opacity: 0, x: 20 }}
                    className="rounded-3xl bg-navy/90 p-6 backdrop-blur-md"
                  >
                    {/* Icon */}
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20">
                        <Globe className="h-7 w-7 text-white" />
                      </div>
                    </div>

                    <h2 className="mb-1 text-center text-xl font-semibold text-white">
                      Select Language
                    </h2>
                    <p className="mb-6 text-center text-sm text-white/60">
                      Please choose your preferred language
                    </p>

                    <div className="flex flex-col gap-3">
                      {(['en', 'fa', 'ar'] as Language[]).map((lang) => (
                        <motion.button
                          key={lang}
                          onClick={() => onLanguageSelect(lang)}
                          className="group flex items-center justify-between rounded-xl border border-white/10 bg-navy-light/50 px-4 py-3.5 transition-all hover:border-gold/50 hover:bg-navy-light"
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/70">
                              {languageIcons[lang]}
                            </div>
                            <span className="font-medium text-white">
                              {lang === 'en' ? 'English' : lang === 'fa' ? 'Persian (Farsi)' : 'Arabic'}
                            </span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="country"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="rounded-3xl bg-navy/90 p-6 backdrop-blur-md"
                  >
                    {/* Icon */}
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20">
                        <MapPin className="h-7 w-7 text-white" />
                      </div>
                    </div>

                    <h2 className="mb-1 text-center text-xl font-semibold text-white">
                      Select Country
                    </h2>
                    <p className="mb-6 text-center text-sm text-white/60">
                      {selectedLanguage === 'fa' 
                        ? 'لطفا کشور مورد نظر را انتخاب کنید'
                        : selectedLanguage === 'ar'
                        ? 'يرجى اختيار البلد الذي تريد العمل فيه'
                        : 'Please choose the country you want to operate in'}
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* UAE Option */}
                      <motion.button
                        onClick={() => onCountrySelect('uae')}
                        className="group flex items-center justify-between rounded-xl border border-white/10 bg-navy-light/50 px-4 py-3.5 transition-all hover:border-gold/50 hover:bg-navy-light"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
                            <svg viewBox="0 0 36 24" className="h-6 w-auto">
                              <rect width="36" height="8" fill="#00732F" />
                              <rect y="8" width="36" height="8" fill="#FFFFFF" />
                              <rect y="16" width="36" height="8" fill="#000000" />
                              <rect width="9" height="24" fill="#FF0000" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-white">
                              {selectedLanguage ? countryNames[selectedLanguage].uae : 'United Arab Emirates'}
                            </span>
                            <span className="text-xs text-white/50">UAE</span>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-white/40 transition-transform group-hover:text-gold ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                      </motion.button>

                      {/* Oman Option */}
                      <motion.button
                        onClick={() => onCountrySelect('oman')}
                        className="group flex items-center justify-between rounded-xl border border-white/10 bg-navy-light/50 px-4 py-3.5 transition-all hover:border-gold/50 hover:bg-navy-light"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
                            <svg viewBox="0 0 36 24" className="h-6 w-auto">
                              <rect width="36" height="24" fill="#FFFFFF" />
                              <rect width="36" height="8" fill="#EF2B2D" />
                              <rect y="16" width="36" height="8" fill="#009E49" />
                              <rect width="9" height="24" fill="#EF2B2D" />
                            </svg>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-white">
                              {selectedLanguage ? countryNames[selectedLanguage].oman : 'Oman'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-white/40 transition-transform group-hover:text-gold ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
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
              className="flex items-center gap-2 text-white/60"
            >
              {step === 'language' ? (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm">Your Business, Our Priority</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Secure • Reliable • Professional</span>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
