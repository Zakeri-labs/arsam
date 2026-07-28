'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Menu, ChevronDown, Globe } from 'lucide-react';
import { type Language, type Country } from '@/lib/content';

interface HeaderProps {
  language: Language;
  country: Country | null;
  onChangeSettings: () => void;
  onMenuClick?: () => void;
}

export function Header({ language, country, onChangeSettings }: HeaderProps) {
  return null;
}

interface HeroSectionProps {
  subtitle: string;
  language: Language;
  country: Country | null;
}

export function HeroSection({ subtitle, language, country }: HeroSectionProps) {
  const cityName = !country
    ? (language === 'en' ? 'UAE & Oman' : language === 'fa' ? 'امارات و عمان' : 'الإمارات وعُمان')
    : language === 'en' 
    ? (country === 'uae' ? 'Dubai' : 'Oman')
    : language === 'fa'
    ? (country === 'uae' ? 'دبی' : 'عمان')
    : (country === 'uae' ? 'دبي' : 'عُمان');

  const getFormattedTagline = () => {
    const targetCity = !country
      ? (language === 'en' ? 'Muscat' : language === 'fa' ? 'مسقط' : 'مسقط')
      : language === 'en' 
      ? (country === 'uae' ? 'Dubai' : 'Muscat')
      : language === 'fa'
      ? (country === 'uae' ? 'دبی' : 'مسقط')
      : (country === 'uae' ? 'دبي' : 'مسقط');

    if (language === 'en') {
      return (
        <>
          Turn the Engine of<br />Your Business On in{' '}
          <span className="text-primary">{targetCity}</span>
        </>
      );
    } else if (language === 'fa') {
      return (
        <>
          موتور کسب‌وکار خود را<br />در{' '}
          <span className="text-primary">{targetCity}</span> روشن کنید
        </>
      );
    } else {
      return (
        <>
          أطلق محرك أعمالك<br />في{' '}
          <span className="text-primary">{targetCity}</span>
        </>
      );
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="px-4 pb-3 pt-4"
    >
      <div className="flex items-center gap-3.5 sm:gap-5">
        {/* Sleek, proportional logo container without negative margin bleed */}
        <div className="logo-shimmer-container relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="ARSAM"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Text block */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-gold">
            {language === 'fa' || language === 'ar' ? 'آرسام' : 'ARSAM'}
          </span>
          <h1 className="mt-0.5 text-lg sm:text-2xl font-black leading-tight text-foreground">
            {getFormattedTagline()}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
