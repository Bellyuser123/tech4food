import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'safety' | 'warning' | 'critical' | 'neutral' | 'burgundy' | 'demo';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-bold rounded-lg',
  };

  const variantStyles = {
    safety: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    critical: 'bg-burgundy-50 text-burgundy-800 border border-burgundy-200',
    neutral: 'bg-stone-100 text-stone-700 border border-stone-200',
    burgundy: 'bg-burgundy-600 text-white',
    demo: 'bg-purple-100 text-purple-800 border border-purple-200 tracking-wider uppercase',
  };

  return (
    <span
      className={`inline-flex items-center select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
