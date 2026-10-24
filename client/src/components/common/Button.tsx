import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2 font-semibold', // 44px recommended mobile touch target
    lg: 'text-base px-6 py-3.5 min-h-[50px] gap-2.5 font-bold',
  };

  const variantStyles = {
    primary:
      'bg-burgundy-600 text-white hover:bg-burgundy-700 active:bg-burgundy-800 focus-visible:ring-burgundy-600 shadow-sm shadow-burgundy-900/10',
    secondary:
      'bg-cream-200 text-stone-800 hover:bg-cream-300 active:bg-cream-400 border border-cream-300 focus-visible:ring-stone-400',
    outline:
      'border-2 border-burgundy-600 text-burgundy-700 hover:bg-burgundy-50 active:bg-burgundy-100 focus-visible:ring-burgundy-600',
    ghost:
      'text-stone-700 hover:bg-stone-200/60 active:bg-stone-200 focus-visible:ring-stone-400',
    danger:
      'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 focus-visible:ring-red-600 shadow-sm',
    success:
      'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus-visible:ring-emerald-600 shadow-sm',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
