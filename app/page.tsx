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
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'language' | 'country'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'about' | 'contact'>('home');

  useEffect(() => {
    const storedLang = localStorage.getItem('preferredLanguage') as Language | null;
    const storedCountry = localStorage.getItem('preferredCountry') as Country | null;

    if (storedLang && storedCountry) {
      setSelectedLanguage(storedLang);
      setSelectedCountry(storedCountry);
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowModal(true);
      }, 800);
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

  // Loading screen with logo
  if (isLoading) {
    return (
      <div 
        className="flex min-h-screen flex-col items-center justify-center"
        style={{ 
          backgroundImage: 'linear-gradient(to bottom, rgba(15, 30, 55, 0.85), rgba(15, 30, 55, 0.95)), url("https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-white/10 p-6 backdrop-blur-md"
        >
          <div className="logo-shimmer-container">
            <Image
              src="/logo.png"
              alt="Shiny Horizon"
              width={200}
              height={250}
              className="h-auto w-40 object-contain"
              priority
            />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full bg-gold"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

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
