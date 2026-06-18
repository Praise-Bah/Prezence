import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type InputVariant = 'default' | 'auth' | 'content';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
}

const labelVariantClasses: Record<InputVariant, string> = {
  default: 'text-sm font-medium text-gray-700',
  auth: 'text-base font-medium tracking-[0.4px] text-[#111112]',
  content: 'text-sm font-medium text-[#1a1a2e]',
};

const inputVariantClasses: Record<InputVariant, string> = {
  default:
    'h-10 rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-indigo-500 border-gray-300 bg-white',
  auth: 'rounded border px-4 py-2.5 text-base tracking-[0.2px] text-[#111112] placeholder:text-[#787c91] focus:ring-[#1d4e8a] border-[#cdd5e9] bg-[#fbfcfe]',
  content:
    'rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] px-[13px] py-[9px] text-base text-[#1a1a2e] placeholder:text-[rgba(10,10,10,0.5)] focus:ring-[#1d4e8a]',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, variant = 'default', className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={cn('flex flex-col', variant === 'auth' ? 'gap-1' : 'gap-1')}>
        {label && (
          <label
            htmlFor={inputId}
            className={labelVariantClasses[variant]}
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            inputVariantClasses[variant],
            error && 'border-red-400 focus:ring-red-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, variant = 'default', className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className={labelVariantClasses[variant]}>
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            variant === 'auth' || variant === 'content'
              ? 'min-h-[90px] rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] px-[13px] py-[9px] text-base text-[#1a1a2e] placeholder:text-[rgba(10,10,10,0.5)] focus:ring-[#1d4e8a]'
              : 'rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-indigo-500 border-gray-300 bg-white',
            error && 'border-red-400 focus:ring-red-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
