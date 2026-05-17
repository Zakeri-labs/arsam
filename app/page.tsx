'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SelectionModal } from '@/components/selection-modal';
import { Header, HeroSection } from '@/components/header';
import { ServiceList } from '@/components/service-card';
import { ServiceDetailModal } from '@/components/service-detail-modal';
import { BottomNav } from '@/components/bottom-nav';
import { type Language, type Country, type Service, content } from '@/lib/content';

export default function Home() {
  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState<'language' | 'country'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'about' | 'contact'>('home');

  useEffect(() => {
    const removeBadge = () => {
      const selectors = [
        'a[href*="v0.dev"]',
        '[class*="v0-badge"]',
        '[id*="v0-badge"]',
        '[class*="v0-brand"]',
        '[id*="v0-brand"]',
        '[class*="built-with-v0"]',
        '#v0-badge',
        '.v0-badge'
      ];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        } catch (e) {}
      });
      
      try {
        const customElements = document.querySelectorAll('*');
        customElements.forEach(el => {
          if (el.tagName.toLowerCase().includes('v0') || el.shadowRoot) {
            if (el.shadowRoot) {
              const badge = el.shadowRoot.querySelector('a[href*="v0.dev"]');
              if (badge) el.remove();
            }
          }
        });
      } catch (e) {}
    };

    removeBadge();
    
    const observer = new MutationObserver(() => {
      removeBadge();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    const interval = setInterval(removeBadge, 150);
    const timeout = setTimeout(() => clearInterval(interval), 4000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
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
        {currentContent && !showModal && (
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
            />
          </motion.div>
        )}
      </AnimatePresence>

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
