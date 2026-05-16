'use client';

import { Globe, Phone } from 'lucide-react';
import type { Language } from '@/lib/content';

interface BottomNavProps {
  language: Language;
  onChangeSettings: () => void;
}

const labels: Record<Language, { language: string; whatsapp: string; call: string }> = {
  en: { language: 'Language', whatsapp: 'WhatsApp', call: 'Call' },
  fa: { language: 'زبان', whatsapp: 'واتساپ', call: 'تماس' },
  ar: { language: 'اللغة', whatsapp: 'واتساب', call: 'اتصال' },
};

export function BottomNav({ language, onChangeSettings }: BottomNavProps) {
  const t = labels[language];

  const handleCall = () => {
    window.location.href = 'tel:+971552554688';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/971552554688', '_blank');
  };

  return (
    <nav className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center justify-between gap-1 rounded-full bg-navy p-1.5 shadow-lg shadow-navy/20 backdrop-blur-sm">
        {/* Language Button */}
        <button
          onClick={onChangeSettings}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10 active:bg-white/20"
        >
          <Globe className="h-4 w-4" />
          <span>{t.language}</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10" />

        {/* WhatsApp Button (Middle) */}
        <button
          onClick={handleWhatsApp}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10 active:bg-white/20"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.611-.917-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.028 6.987 2.894a9.825 9.825 0 012.883 6.988c-.002 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.602 6.005L0 24l6.149-1.613a11.77 11.77 0 005.9 1.573h.005c6.634 0 12.032-5.396 12.035-12.032a11.762 11.762 0 00-3.489-8.492" />
          </svg>
          <span>{t.whatsapp}</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10" />

        {/* Call Button */}
        <button
          onClick={handleCall}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10 active:bg-white/20"
        >
          <Phone className="h-4 w-4" />
          <span>{t.call}</span>
        </button>
      </div>
    </nav>
  );
}
