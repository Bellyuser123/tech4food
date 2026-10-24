import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'cream' | 'burgundy';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-stone-200/80 shadow-card',
    elevated: 'bg-white border border-stone-100 shadow-cardHover',
    bordered: 'bg-white border-2 border-stone-200 shadow-none',
    cream: 'bg-cream-100 border border-cream-300 shadow-sm',
    burgundy: 'bg-burgundy-900 text-white border border-burgundy-800 shadow-lg',
  };

  const hoverStyle = hoverable
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cardHover cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => <div className={`px-5 py-4 border-b border-stone-100 ${className}`} {...props}>{children}</div>;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-display font-bold text-lg text-stone-900 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => <p className={`text-xs text-stone-500 mt-1 ${className}`} {...props}>{children}</p>;

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => <div className={`p-5 ${className}`} {...props}>{children}</div>;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-5 py-3.5 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
