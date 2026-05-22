'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { type Language, type Country, languageNames, countryNames } from '@/lib/content';
import { Globe, ChevronRight, MapPin, Shield } from 'lucide-react';

interface SelectionModalProps {
  isOpen: boolean;
  selectedLanguage: Language | null;
  onLanguageSelect: (lang: Language) => void;
}

const languageIcons: Record<Language, React.ReactNode> = {
  en: <span className="text-xs font-bold uppercase">En</span>,
  fa: <span className="text-base font-semibold">ف</span>,
  ar: <span className="text-base font-semibold">ع</span>,
};

export function SelectionModal({
  isOpen,
  selectedLanguage,
  onLanguageSelect,
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
          {/* Dark overlay background with opacity */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pt-14 pb-14 min-h-[100dvh]">
            
            {/* Top spacer for vertical centering */}
            <div className="flex-none" />

            {/* Selection Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-sm"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-4 py-2 w-full"
              >
                <h2 className="mb-1 text-center text-xl font-bold text-white">
                  Select Language
                </h2>
                <p className="mb-6 text-center text-sm text-white/80">
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
            </motion.div>

            {/* Bottom tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-white/60"
            >
              <div className="h-1 w-1 rounded-full bg-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Your Business, Our Priority
              </span>
              <div className="h-1 w-1 rounded-full bg-gold" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
