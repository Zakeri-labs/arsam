'use client';

import { motion } from 'framer-motion';
import type { Service, Language } from '@/lib/content';

interface ServiceCardProps {
  service: Service;
  index: number;
  onClick: () => void;
}

export function ServiceCard({ service, index, onClick }: ServiceCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="group flex w-full flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-start transition-all hover:border-primary hover:bg-primary/5"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex w-full items-start justify-between">
        <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
          {service.title}
        </h3>
        <svg
          className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {service.description}
      </p>
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, index) => (
        <ServiceCard
          key={service.id}
          service={service}
          index={index}
          onClick={() => onServiceClick(service)}
        />
      ))}
    </div>
  );
}
