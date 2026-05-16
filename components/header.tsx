'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Menu, ChevronDown } from 'lucide-react';
import { type Language, type Country } from '@/lib/content';

interface HeaderProps {
  language: Language;
  country: Country;
  onChangeSettings: () => void;
  onMenuClick?: () => void;
}

export function Header({ language, country, onChangeSettings, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/logo.png"
            alt="Shiny Horizon"
            width={50}
            height={60}
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Country selector */}
        <button
          onClick={onChangeSettings}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-sm">
            {country === 'uae' ? (
              <svg viewBox="0 0 36 24" className="h-full w-auto">
                <rect width="36" height="8" fill="#00732F" />
                <rect y="8" width="36" height="8" fill="#FFFFFF" />
                <rect y="16" width="36" height="8" fill="#000000" />
                <rect width="9" height="24" fill="#FF0000" />
              </svg>
            ) : (
              <svg viewBox="0 0 36 24" className="h-full w-auto">
                <rect width="36" height="24" fill="#FFFFFF" />
                <rect width="36" height="8" fill="#EF2B2D" />
                <rect y="16" width="36" height="8" fill="#009E49" />
                <rect width="9" height="24" fill="#EF2B2D" />
              </svg>
            )}
          </div>
          <span className="font-medium text-foreground">
            {country === 'uae' ? 'UAE' : 'Oman'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

interface HeroSectionProps {
  subtitle: string;
  language: Language;
  country: Country;
}

export function HeroSection({ subtitle, language, country }: HeroSectionProps) {
  const cityName = language === 'en' 
    ? (country === 'uae' ? 'Dubai' : 'Oman')
    : language === 'fa'
    ? (country === 'uae' ? 'دبی' : 'عمان')
    : (country === 'uae' ? 'دبي' : 'عُمان');

  const getFormattedTagline = () => {
    if (language === 'en') {
      return (
        <>
          Turn The Engine Of<br />Your Business On In{' '}
          <span className="text-primary">{cityName}</span>
        </>
      );
    } else if (language === 'fa') {
      return (
        <>
          موتور کسب‌وکار خود را<br />در{' '}
          <span className="text-primary">{cityName}</span> روشن کنید
        </>
      );
    } else {
      return (
        <>
          أطلق محرك أعمالك<br />في{' '}
          <span className="text-primary">{cityName}</span>
        </>
      );
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="px-4 pb-6 pt-4"
    >
      <span className="text-sm font-semibold uppercase tracking-wider text-gold">
        Shiny Horizon
      </span>
      <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground">
        {getFormattedTagline()}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </motion.section>
  );
}
