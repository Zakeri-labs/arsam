'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SelectionModal } from '@/components/selection-modal';
import { Header } from '@/components/header';
import { ServiceGrid } from '@/components/service-card';
import { ServiceDetailModal } from '@/components/service-detail-modal';
import { Footer } from '@/components/footer';
import { type Language, type Country, type Service, content } from '@/lib/content';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'language' | 'country'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Check for stored preferences on mount
  useEffect(() => {
    const storedLang = localStorage.getItem('preferredLanguage') as Language | null;
    const storedCountry = localStorage.getItem('preferredCountry') as Country | null;

    if (storedLang && storedCountry) {
      setSelectedLanguage(storedLang);
      setSelectedCountry(storedCountry);
      setIsLoading(false);
    } else {
      // Simulate page load then show modal
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
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

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <motion.svg
              viewBox="0 0 100 100"
              className="h-10 w-10 text-primary"
              fill="currentColor"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx="50" cy="30" r="20" opacity="0.8" />
              <path d="M10 80 Q50 40 90 80" stroke="currentColor" strokeWidth="8" fill="none" />
            </motion.svg>
          </div>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
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
          >
            {/* Header */}
            <Header
              title={currentContent.header.title}
              subtitle={currentContent.header.subtitle}
              tagline={currentContent.header.tagline}
              language={selectedLanguage!}
              country={selectedCountry!}
              onChangeSettings={handleChangeSettings}
            />

            {/* Services Section */}
            <main className="container mx-auto px-4 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  {currentContent.services.title}
                </h2>
                <p className="text-muted-foreground">
                  {selectedLanguage === 'en' 
                    ? 'Click on any service to learn more and get started'
                    : selectedLanguage === 'fa'
                    ? 'برای اطلاعات بیشتر و شروع کار روی هر سرویس کلیک کنید'
                    : 'انقر على أي خدمة لمعرفة المزيد والبدء'
                  }
                </p>
              </motion.div>

              <ServiceGrid
                services={currentContent.services.items}
                language={selectedLanguage!}
                onServiceClick={handleServiceClick}
              />
            </main>

            {/* Footer */}
            <Footer
              copyright={currentContent.footer.copyright}
              ctaTitle={currentContent.cta.title}
              ctaButton={currentContent.cta.button}
              language={selectedLanguage!}
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
