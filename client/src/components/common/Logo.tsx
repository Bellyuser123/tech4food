import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        {/* Shield Icon SVG */}
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-sm">
          <path
            d="M50 6L88 20V50C88 74 71.5 91 50 97C28.5 91 12 74 12 50V20L50 6Z"
            fill={isLight ? '#FAF7F0' : '#9E1B22'}
          />
          <path
            d="M50 12L82 24V50C82 70 68 85.5 50 91C32 85.5 18 70 18 50V24L50 12Z"
            stroke={isLight ? '#9E1B22' : '#FAF7F0'}
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          {/* 360 Temperature & Safety Gauge Indicator */}
          <circle
            cx="50"
            cy="51"
            r="20"
            stroke={isLight ? '#9E1B22' : '#FAF7F0'}
            strokeWidth="4"
            strokeDasharray="90 35"
            strokeLinecap="round"
          />
          <path
            d="M42 51L48 57L60 44"
            stroke={isLight ? '#9E1B22' : '#FAF7F0'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span
            className={`font-display font-extrabold tracking-tight ${textSizes[size]} ${
              isLight ? 'text-white' : 'text-stone-900'
            }`}
          >
            Plate<span className="text-burgundy-600 font-black">Proof</span>
          </span>
          <span
            className={`ml-1 px-1.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase ${
              isLight
                ? 'bg-white/20 text-cream-100'
                : 'bg-burgundy-100 text-burgundy-800 border border-burgundy-200'
            }`}
          >
            360
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-medium tracking-wide uppercase mt-0.5 ${subSizes[size]} ${
              isLight ? 'text-cream-200' : 'text-stone-500'
            }`}
          >
            Food Safety & Accountability
          </span>
        )}
      </div>
    </div>
  );
};
