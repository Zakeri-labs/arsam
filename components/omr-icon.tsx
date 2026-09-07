import React from 'react';

interface OMRIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function OMRIcon({ size = 'md', className = '', showText = false }: OMRIconProps) {
  const sizeMap = {
    sm: 'h-4 min-w-[20px] px-1 text-[9px]',
    md: 'h-5 min-w-[26px] px-1.5 text-[10px]',
    lg: 'h-6 min-w-[32px] px-2 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-md bg-gradient-to-r from-amber-500/20 via-gold/30 to-amber-500/20 text-gold border border-gold/40 font-black tracking-wide select-none shadow-xs ${sizeMap[size]} ${className}`}
      title="ریال عمان (OMR)"
    >
      {/* Omani Khanjar / Currency Symbol SVG */}
      <svg
        className="w-3.5 h-3.5 fill-current shrink-0 text-gold"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L15 8H9L12 2Z" />
        <path d="M12 22L9 16H15L12 22Z" />
        <path d="M2 12L8 9V15L2 12Z" />
        <path d="M22 12L16 15V9L22 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>

      <span className="font-extrabold dir-rtl">ر.ع.</span>
    </span>
  );
}
