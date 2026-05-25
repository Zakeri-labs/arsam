'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Building2, FileText, CreditCard, Users, Building, Landmark } from 'lucide-react';
import type { Service, Language } from '@/lib/content';

// Map service IDs to icons
const serviceIcons: Record<string, React.ReactNode> = {
  'establishment-card-renewal': <FileText className="h-5 w-5" />,
  'family-residency-renewal': <Users className="h-5 w-5" />,
  'investor-residency-renewal': <Users className="h-5 w-5" />,
  'trade-license-renewal': <FileText className="h-5 w-5" />,
  'ejari-1-month-inspection': <Building className="h-5 w-5" />,
  'ejari-1-month-no-inspection': <Building className="h-5 w-5" />,
  'ejari-1-month-sep-office': <Building className="h-5 w-5" />,
  'ejari-1-month-shop': <Building className="h-5 w-5" />,
  'ejari-1-year': <Building className="h-5 w-5" />,
  'ejari-1-year-sep-office': <Building className="h-5 w-5" />,
  'ejari-residential': <Building className="h-5 w-5" />,
  'business-account-high-risk': <Landmark className="h-5 w-5" />,
  'business-account-low-risk': <Landmark className="h-5 w-5" />,
  'corporate-tax-registration': <FileText className="h-5 w-5" />,
  'corporate-tax-filing': <FileText className="h-5 w-5" />,
  'fta-profile-update': <FileText className="h-5 w-5" />,
  'tax-reconsideration': <FileText className="h-5 w-5" />,
  'tourist-visa-30-days': <CreditCard className="h-5 w-5" />,
  'tourist-visa-60-days': <CreditCard className="h-5 w-5" />,
  'tourist-visa-multi-60-days': <CreditCard className="h-5 w-5" />,
  'tourist-visa-renewal': <CreditCard className="h-5 w-5" />,
  'change-activity': <Building2 className="h-5 w-5" />,
  'change-business-name': <Building2 className="h-5 w-5" />,
  'change-location': <Building2 className="h-5 w-5" />,
  'license-modification': <Building2 className="h-5 w-5" />,
  'family-residency-cancellation': <Users className="h-5 w-5" />,
  'investor-residency-cancellation': <Users className="h-5 w-5" />,
  'trade-license-cancellation': <Building2 className="h-5 w-5" />,
};

// Get simplified service names for the list view
const serviceDisplayNames: Record<Language, Record<string, { title: string; description: string }>> = {
  en: {
    'company-mainland': { title: 'Business Setup', description: 'Launch your business in the UAE with ease and confidence.' },
    'company-freezone': { title: 'Freezone Company', description: 'Establish your business in UAE free zones with full ownership.' },
    'license-renewal': { title: 'Trade License', description: 'Get your commercial, professional, or industrial license.' },
    'residency-renewal': { title: 'PRO Services', description: 'Hassle-free documentation and government liaison services.' },
    'family-visa': { title: 'Visa Services', description: 'Investor, partner, employee, and family visa solutions.' },
    'ejari': { title: 'Office Solutions', description: 'Flexible office spaces and workplace solutions.' },
    'corporate-account': { title: 'Banking Assistance', description: 'Corporate bank account opening made simple.' },
  },
  fa: {
    'company-mainland': { title: 'راه‌اندازی کسب‌وکار', description: 'کسب‌وکار خود را با اطمینان راه‌اندازی کنید.' },
    'company-freezone': { title: 'شرکت منطقه آزاد', description: 'با مالکیت کامل در مناطق آزاد ثبت شرکت کنید.' },
    'license-renewal': { title: 'مجوز تجاری', description: 'مجوز تجاری، حرفه‌ای یا صنعتی دریافت کنید.' },
    'residency-renewal': { title: 'خدمات PRO', description: 'خدمات اداری و رابطه با دولت بدون دردسر.' },
    'family-visa': { title: 'خدمات ویزا', description: 'ویزای سرمایه‌گذار، شریک، کارمند و خانواده.' },
    'ejari': { title: 'راه‌حل‌های دفتر', description: 'فضاهای اداری منعطف و راه‌حل‌های محل کار.' },
    'corporate-account': { title: 'کمک بانکی', description: 'افتتاح حساب بانکی شرکتی آسان شد.' },
  },
  ar: {
    'company-mainland': { title: 'تأسيس الأعمال', description: 'أطلق عملك في الإمارات بسهولة وثقة.' },
    'company-freezone': { title: 'شركة المنطقة الحرة', description: 'أسس عملك في المناطق الحرة مع ملكية كاملة.' },
    'license-renewal': { title: 'الرخصة التجارية', description: 'احصل على رخصتك التجارية أو المهنية أو الصناعية.' },
    'residency-renewal': { title: 'خدمات PRO', description: 'خدمات التوثيق والتنسيق الحكومي بدون متاعب.' },
    'family-visa': { title: 'خدمات التأشيرات', description: 'حلول تأشيرات المستثمرين والشركاء والموظفين والعائلات.' },
    'ejari': { title: 'حلول المكاتب', description: 'مساحات مكتبية مرنة وحلول مكان العمل.' },
    'corporate-account': { title: 'المساعدة البنكية', description: 'فتح حساب بنكي للشركات بسهولة.' },
  },
};

interface ServiceCardProps {
  service: Service;
  index: number;
  language: Language;
  onClick: () => void;
}

export function ServiceCard({ service, index, language, onClick }: ServiceCardProps) {
  const icon = serviceIcons[service.id] || <FileText className="h-5 w-5" />;
  const isRtl = language === 'fa' || language === 'ar';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      className="group flex w-full items-center gap-3 border-b border-border md:border md:rounded-xl md:shadow-sm bg-card px-4 py-4 text-start transition-colors hover:bg-muted/50 active:bg-muted"
    >
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gold" style={{ backgroundColor: '#fdf0d0' }}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-semibold text-foreground">
          {service.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {service.description}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:text-primary ${isRtl ? 'rotate-180' : ''}`} />
    </motion.button>
  );
}

interface ServiceGridProps {
  services: Service[];
  language: Language;
  onServiceClick: (service: Service) => void;
}

export function ServiceGrid({ services, language, onServiceClick }: ServiceGridProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {services.slice(0, 6).map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          index={index}
          language={language}
          onClick={() => onServiceClick(service)}
        />
      ))}
    </div>
  );
}

interface ServiceListProps {
  services: Service[];
  language: Language;
  onServiceClick: (service: Service) => void;
}

export function ServiceList({ services, language, onServiceClick }: ServiceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
      {services.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          index={index}
          language={language}
          onClick={() => onServiceClick(service)}
        />
      ))}
    </div>
  );
}
