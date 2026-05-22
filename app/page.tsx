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
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>('en');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
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
    // const savedLang = localStorage.getItem('preferredLanguage') as Language;
    // const savedCountry = localStorage.getItem('preferredCountry') as Country;
    
    let splashTimer: NodeJS.Timeout;
    
    // Always show splash after 3 seconds for demonstration
    splashTimer = setTimeout(() => {
      if (!hasShownSplash) {
        setShowModal(true);
        setHasShownSplash(true);
      }
    }, 3000);

    // If we want to restore localStorage check, we can uncomment:
    // if (savedLang && savedCountry) { ... }

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
      if (splashTimer) clearTimeout(splashTimer);
    };
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    setShowModal(false);
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
    setShowModal(true);
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const isRtl = selectedLanguage === 'fa' || selectedLanguage === 'ar';
  
  // Base content for the HeroSection even if country is not selected yet
  const baseContent = selectedLanguage ? content[selectedLanguage][selectedCountry || 'uae'] : null;
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
        selectedLanguage={selectedLanguage}
        onLanguageSelect={handleLanguageSelect}
      />

      {/* Main Content */}
      <AnimatePresence>
        {baseContent && (
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
              subtitle={baseContent.header.subtitle}
              language={selectedLanguage!}
              country={selectedCountry}
            />

            {/* Main Dynamic Area */}
            <main className="px-4">
              {!selectedCountry ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 mb-8"
                >
                  <p className="text-[15px] leading-relaxed text-muted-foreground text-justify mb-10">
                    {selectedLanguage === 'fa' 
                      ? 'الافق الذهبی همراه مطمئن شما برای شروع، مدیریت و توسعه کسب‌وکار است. ما مسیر راه‌اندازی و توسعه شرکت شما را در کشورهای حوزه خلیج فارس ساده، سریع و امن می‌کنیم. لطفاً برای مشاهده خدمات، کشور مورد نظر خود را انتخاب کنید.'
                      : selectedLanguage === 'ar'
                      ? 'الأفق الذهبي هو شريكك الموثوق لبدء وإدارة وتطوير أعمالك. نحن نجعل عملية تأسيس وتطوير شركتك في دول الخليج بسيطة وسريعة وآمنة. يرجى تحديد الدولة المطلوبة لعرض خدماتنا.'
                      : 'AL UFUQ AL DAHABI is your trusted partner for starting, managing, and growing your business. We make the process of setting up and expanding your company in the Gulf region simple, fast, and secure. Please select your desired country to view our services.'}
                  </p>
                  
                  <h3 className="text-lg font-bold text-foreground text-center mb-6">
                    {selectedLanguage === 'fa' ? 'انتخاب کشور مقصد' : selectedLanguage === 'ar' ? 'اختر وجهتك' : 'Select Destination'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* UAE Button */}
                    <button
                      onClick={() => handleCountrySelect('uae')}
                      className="group flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-5 transition-all hover:border-gold hover:shadow-md active:scale-95"
                    >
                      <div className="relative w-20 h-14 overflow-hidden rounded-md shadow-sm">
                        <Image src="/UAEFlag.gif" alt="UAE Flag" fill className="object-cover" unoptimized />
                      </div>
                      <span className="font-bold text-sm text-foreground">
                        {selectedLanguage ? content[selectedLanguage].uae.header.title === 'الافق الذهبی' ? 'امارات متحده عربی' : content[selectedLanguage].uae.header.title === 'الأفق الذهبي' ? 'الإمارات العربية المتحدة' : 'United Arab Emirates' : 'UAE'}
                      </span>
                    </button>

                    {/* Oman Button */}
                    <button
                      onClick={() => handleCountrySelect('oman')}
                      className="group flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-5 transition-all hover:border-gold hover:shadow-md active:scale-95"
                    >
                      <div className="relative w-20 h-14 overflow-hidden rounded-md shadow-sm">
                        <Image src="/OmanFlag.gif" alt="Oman Flag" fill className="object-cover" unoptimized />
                      </div>
                      <span className="font-bold text-sm text-foreground">
                        {selectedLanguage ? content[selectedLanguage].oman.header.title === 'الافق الذهبی' ? 'سلطان‌نشین عمان' : content[selectedLanguage].oman.header.title === 'الأفق الذهبي' ? 'سلطنة عُمان' : 'Sultanate of Oman' : 'Oman'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              ) : currentContent && (
                <>
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
                </>
              )}
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
