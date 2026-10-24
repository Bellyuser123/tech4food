import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-stone-700 tracking-wide uppercase">
            {label}
            {props.required && <span className="text-burgundy-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-stone-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 transition-colors
              placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-burgundy-600 focus:border-transparent
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${
                error
                  ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                  : 'border-stone-300 hover:border-stone-400'
              }
              ${props.disabled ? 'bg-stone-100 cursor-not-allowed text-stone-400' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 pointer-events-none text-stone-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-stone-700 tracking-wide uppercase">
            {label}
            {props.required && <span className="text-burgundy-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border bg-white p-3.5 text-base sm:text-sm text-stone-900 transition-colors
            placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-burgundy-600 focus:border-transparent
            ${
              error
                ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                : 'border-stone-300 hover:border-stone-400'
            }
            ${props.disabled ? 'bg-stone-100 cursor-not-allowed text-stone-400' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
