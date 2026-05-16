'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Menu, ChevronDown, Globe } from 'lucide-react';
import { type Language, type Country } from '@/lib/content';

interface HeaderProps {
  language: Language;
  country: Country;
  onChangeSettings: () => void;
  onMenuClick?: () => void;
}

export function Header({ language, country, onChangeSettings }: HeaderProps) {
  return null;
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
      className="px-4 pb-8 pt-6"
    >
      <div className="flex items-stretch gap-4">
        {/* Logo — left side, negative top margin to extend higher, wider to make logo larger */}
        <div className="relative self-stretch flex-shrink-0" style={{ minWidth: '115px', marginLeft: '-16px', marginRight: '-4px', marginTop: '-16px' }}>
          <Image
            src="/logo.png"
            alt="Shiny Horizon"
            fill
            className="object-contain object-top"
            priority
          />
        </div>

        {/* Text block — top padding added to push text down, removed justify-end */}
        <div className="flex flex-col pt-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">
            Shiny Horizon
          </span>
          <h1 className="mt-0.5 text-2xl font-bold leading-[1.1] text-foreground">
            {getFormattedTagline()}
          </h1>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
