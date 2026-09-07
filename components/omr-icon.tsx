import React from 'react';

interface OMRIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function OMRIcon({ size = 'md', className = '', showText = false }: OMRIconProps) {
  const svgSizeMap = {
    sm: 'w-4 h-2.5',
    md: 'w-5 h-3',
    lg: 'w-6 h-3.5',
  };

  return (
    <span
      className={`inline-flex items-center select-none shrink-0 ${className}`}
      title="ریال عمان (OMR)"
    >
      {/* Official Omani Rial Symbol (Clean Minimal SVG, No Border/Box) */}
      <svg
        className={`${svgSizeMap[size]} fill-current shrink-0 text-gold`}
        viewBox="0 0 741.36 415.06"
        fill="currentColor"
      >
        <g id="RHhDp6">
          <path d="M259.9,219.89c-.63-49.2,11.44-95.41,35.76-137.75C331.7,19.4,371.24-.36,439.78,34.99c10.67,5.5,53.6,35.43,57.81,44.54,5.03,10.87-27.48,103.87-29.11,122.3-34.69-37.51-99.37-98.66-154.85-69.62-45.05,23.58-12.02,62.54,11.46,87.68h406.25l-39.14,70.23-289.2-2c-1.11,4.66.87,3.3,2.53,4.6,12.44,9.72,80.97,31.54,94.75,31.54l172.05,1.99-39.49,71.25H10.03l39.24-71.24h272.14l-37.11-36.13H69.33l39.23-70.23h151.33Z"/>
        </g>
      </svg>

      {showText && <span className="font-extrabold dir-rtl mr-1 text-gold text-[10px]">ر.ع.</span>}
    </span>
  );
}
