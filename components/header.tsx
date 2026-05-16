'use client';

import { motion } from 'framer-motion';
import type { Language, Country } from '@/lib/content';
import { languageNames, countryNames } from '@/lib/content';

interface HeaderProps {
  title: string;
  subtitle: string;
  tagline: string;
  language: Language;
  country: Country;
  onChangeSettings: () => void;
}

export function Header({
  title,
  subtitle,
  tagline,
  language,
  country,
  onChangeSettings,
}: HeaderProps) {
  const isRtl = language === 'fa' || language === 'ar';

  return (
    <header className="relative overflow-hidden bg-background pb-16 pt-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 end-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 start-0 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Top bar */}
        <div className="mb-12 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                viewBox="0 0 100 100"
                className="h-7 w-7 text-primary"
                fill="currentColor"
              >
                <circle cx="50" cy="30" r="20" opacity="0.8" />
                <path d="M10 80 Q50 40 90 80" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">{title}</span>
          </motion.div>

          {/* Settings button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onChangeSettings}
            className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <span className="hidden sm:inline">{languageNames[language]}</span>
            <span className="text-muted-foreground">•</span>
            <span>{country === 'uae' ? '🇦🇪' : '🇴🇲'}</span>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>

        {/* Hero content */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
            {countryNames[language][country]}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
          >
            {tagline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>
    </header>
  );
}
