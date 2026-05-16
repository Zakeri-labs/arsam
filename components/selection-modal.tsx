'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { type Language, type Country, languageNames, countryNames, modalContent } from '@/lib/content';

interface SelectionModalProps {
  isOpen: boolean;
  step: 'language' | 'country';
  selectedLanguage: Language | null;
  onLanguageSelect: (lang: Language) => void;
  onCountrySelect: (country: Country) => void;
}

export function SelectionModal({
  isOpen,
  step,
  selectedLanguage,
  onLanguageSelect,
  onCountrySelect,
}: SelectionModalProps) {
  const content = selectedLanguage ? modalContent[selectedLanguage] : modalContent.en;
  const isRtl = selectedLanguage === 'fa' || selectedLanguage === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <svg
                  viewBox="0 0 100 100"
                  className="h-12 w-12 text-primary"
                  fill="currentColor"
                >
                  <circle cx="50" cy="30" r="20" opacity="0.8" />
                  <path d="M10 80 Q50 40 90 80" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'language' ? (
                <motion.div
                  key="language"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="mb-6 text-center text-xl font-semibold text-foreground">
                    Select Your Language
                  </h2>
                  <div className="flex flex-col gap-3">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <motion.button
                        key={lang}
                        onClick={() => onLanguageSelect(lang)}
                        className="group flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-6 py-4 text-lg font-medium text-foreground transition-all hover:border-primary hover:bg-primary/10"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>{languageNames[lang]}</span>
                        <svg
                          className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="mb-6 text-center text-xl font-semibold text-foreground">
                    {content.selectCountry}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {(Object.keys(countryNames.en) as Country[]).map((country) => (
                      <motion.button
                        key={country}
                        onClick={() => onCountrySelect(country)}
                        className="group flex items-center gap-4 rounded-xl border border-border bg-secondary/50 px-6 py-4 transition-all hover:border-primary hover:bg-primary/10"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-background">
                          {country === 'uae' ? (
                            <svg viewBox="0 0 36 24" className="h-8 w-auto">
                              <rect width="36" height="8" fill="#00732F" />
                              <rect y="8" width="36" height="8" fill="#FFFFFF" />
                              <rect y="16" width="36" height="8" fill="#000000" />
                              <rect width="9" height="24" fill="#FF0000" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 36 24" className="h-8 w-auto">
                              <rect width="36" height="24" fill="#FFFFFF" />
                              <rect width="36" height="8" fill="#EF2B2D" />
                              <rect y="16" width="36" height="8" fill="#009E49" />
                              <rect width="9" height="24" fill="#EF2B2D" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-lg font-medium text-foreground">
                            {selectedLanguage ? countryNames[selectedLanguage][country] : countryNames.en[country]}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {country === 'uae' ? 'UAE' : 'Oman'}
                          </span>
                        </div>
                        <svg
                          className={`ms-auto h-5 w-5 text-muted-foreground transition-transform group-hover:text-primary ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress indicator */}
            <div className="mt-8 flex justify-center gap-2">
              <div className={`h-2 w-2 rounded-full ${step === 'language' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-2 w-2 rounded-full ${step === 'country' ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
