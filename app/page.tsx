'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SelectionModal } from '@/components/selection-modal';
import { Header, HeroSection } from '@/components/header';
import { ServiceList } from '@/components/service-card';
import { ServiceDetailModal } from '@/components/service-detail-modal';
import { BottomNav } from '@/components/bottom-nav';
import { AboutModal } from '@/components/about-modal';
import { type Language, type Country, type Service, content } from '@/lib/content';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'language' | 'country'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>('fa');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>('uae');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [hasShownSplash, setHasShownSplash] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'about' | 'contact'>('home');

  useEffect(() => {
    // 1. Dynamic Runtime Style Sheet Injection (prevents Next.js build-time CSS purger from stripping our blocker styles)
    try {
      const style = document.createElement('style');
      style.innerHTML = `
        a[href*="v0.dev"],
        a[href*="vercel.com"],
        [class*="v0-badge"],
        [id*="v0-badge"],
        #v0-badge,
        .v0-badge,
        [class*="v0-brand"],
        [id*="v0-brand"],
        [class*="built-with-v0"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    } catch (e) {}

    const removeBadge = () => {
      const traverse = (root: Node | ShadowRoot) => {
        if (!root) return;

        // 1. Query Selector scans on Element roots
        if ('querySelectorAll' in root) {
          const selectors = [
            'a[href*="v0"]',
            'a[href*="vercel"]',
            '[class*="v0"]',
            '[id*="v0"]',
            '[class*="vercel"]',
            '[id*="vercel"]',
            '[class*="built-with"]',
            'iframe[src*="v0"]',
            'iframe[src*="vercel"]'
          ];
          selectors.forEach(sel => {
            try {
              const elements = (root as HTMLElement).querySelectorAll(sel);
              elements.forEach(el => el.remove());
            } catch (e) {}
          });
        }

        // 2. Scan child nodes recursively
        const children = Array.from(root.childNodes);
        children.forEach(child => {
          const el = child as HTMLElement;
          
          // Check text content inside node
          if (el.textContent) {
            const text = el.textContent;
            if (
              text.includes('Built with v0') || 
              text.includes('built with v0') || 
              text.includes('with v0') ||
              (el.innerHTML && el.innerHTML.includes('Built with v0'))
            ) {
              const tagName = el.tagName?.toLowerCase();
              if (tagName && tagName !== 'body' && tagName !== 'html' && tagName !== 'main') {
                el.remove();
                return;
              }
            }
          }

          // Deep-penetrate shadow DOM encapsulation
          if (el.shadowRoot) {
            const shadow = el.shadowRoot;
            traverse(shadow);
            
            // If shadow root contains v0/vercel remnants, erase the entire host element
            try {
              const hasBadge = shadow.querySelector('a[href*="v0"]') || 
                               shadow.querySelector('a[href*="vercel"]') ||
                               (shadow.textContent && shadow.textContent.includes('v0'));
              if (hasBadge) {
                el.remove();
                return;
              }
            } catch (e) {}
          }

          // Recursive call for normal children
          traverse(child);
        });
      };

      try {
        traverse(document.documentElement);
      } catch (e) {}
    };

    removeBadge();
    
    const observer = new MutationObserver(() => {
      removeBadge();
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    const interval = setInterval(removeBadge, 80);
    const timeout = setTimeout(() => clearInterval(interval), 7000);

    // Splash screen logic
    const savedLang = localStorage.getItem('preferredLanguage') as Language;
    const savedCountry = localStorage.getItem('preferredCountry') as Country;
    
    let splashTimer: NodeJS.Timeout;
    if (savedLang && savedCountry) {
      setSelectedLanguage(savedLang);
      setSelectedCountry(savedCountry);
      setHasShownSplash(true);
    } else {
      splashTimer = setTimeout(() => {
        if (!hasShownSplash) {
          setShowModal(true);
          setHasShownSplash(true);
        }
      }, 3000);
    }

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
      if (splashTimer) clearTimeout(splashTimer);
    };
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setModalStep('country');
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    if (selectedLanguage) {
      localStorage.setItem('preferredLanguage', selectedLanguage);
      localStorage.setItem('preferredCountry', country);
    }
    setShowModal(false);
  };

  const handleChangeSettings = () => {
    setModalStep('language');
    setShowModal(true);
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const isRtl = selectedLanguage === 'fa' || selectedLanguage === 'ar';
  const currentContent = selectedLanguage && selectedCountry 
    ? content[selectedLanguage][selectedCountry] 
    : null;

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      lang={selectedLanguage || 'en'}
      className="min-h-screen bg-background"
    >
      {/* Selection Modal */}
      <SelectionModal
        isOpen={showModal}
        step={modalStep}
        selectedLanguage={selectedLanguage}
        onLanguageSelect={handleLanguageSelect}
        onCountrySelect={handleCountrySelect}
      />

      {/* Main Content */}
      <AnimatePresence>
        {currentContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-20 max-w-5xl mx-auto"
          >
            {/* Header */}
            <Header
              language={selectedLanguage!}
              country={selectedCountry!}
              onChangeSettings={handleChangeSettings}
            />

            {/* Hero Section */}
            <HeroSection
              subtitle={currentContent.header.subtitle}
              language={selectedLanguage!}
              country={selectedCountry!}
            />

            {/* Services Section */}
            <main className="px-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
              >
                <h2 className="text-lg font-bold text-foreground">
                  {currentContent.services.title}
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="overflow-hidden rounded-2xl border border-border bg-card md:border-none md:bg-transparent md:overflow-visible"
              >
                <ServiceList
                  services={currentContent.services.items}
                  language={selectedLanguage!}
                  onServiceClick={handleServiceClick}
                />
              </motion.div>
            </main>

            {/* Bottom Navigation */}
            <BottomNav
              language={selectedLanguage!}
              onChangeSettings={handleChangeSettings}
              onAboutClick={() => setShowAboutModal(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Us Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        language={selectedLanguage || 'en'}
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        language={selectedLanguage || 'en'}
        ctaButton={currentContent?.cta.button || 'Contact Us'}
      />
    </div>
  );
}
