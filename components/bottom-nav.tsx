'use client';

import { motion } from 'framer-motion';
import { Home, LayoutGrid, Info, Phone } from 'lucide-react';
import type { Language } from '@/lib/content';

interface BottomNavProps {
  activeTab: 'home' | 'services' | 'about' | 'contact';
  language: Language;
  onTabChange: (tab: 'home' | 'services' | 'about' | 'contact') => void;
}

const tabLabels: Record<Language, Record<string, string>> = {
  en: { home: 'Home', services: 'Services', about: 'About Us', contact: 'Contact' },
  fa: { home: 'خانه', services: 'خدمات', about: 'درباره ما', contact: 'تماس' },
  ar: { home: 'الرئيسية', services: 'الخدمات', about: 'عنا', contact: 'اتصل' },
};

export function BottomNav({ activeTab, language, onTabChange }: BottomNavProps) {
  const labels = tabLabels[language];

  const tabs = [
    { id: 'home' as const, icon: Home, label: labels.home },
    { id: 'services' as const, icon: LayoutGrid, label: labels.services },
    { id: 'about' as const, icon: Info, label: labels.about },
    { id: 'contact' as const, icon: Phone, label: labels.contact },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-safe backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
