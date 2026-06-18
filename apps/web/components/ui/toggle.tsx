'use client';

import { cn } from '../../lib/utils';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  activeColor?: 'blue' | 'green';
}

export function Toggle({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  activeColor = 'green',
}: ToggleProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', label && 'py-3')}>
      {label ? (
        <div className="min-w-0">
          <p className="text-sm text-[#1a1a2e]">{label}</p>
          {description && <p className="mt-0.5 text-xs text-[#888780]">{description}</p>}
        </div>
      ) : (
        <span className="sr-only">{id}</span>
      )}
      <label
        htmlFor={id}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
          disabled && 'cursor-not-allowed opacity-60',
          checked
            ? activeColor === 'blue'
              ? 'bg-[#3771c8]'
              : 'bg-[#0f6e56]'
            : 'bg-[#e2e8f0]',
        )}
      >
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-[#f8f9fa] shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </label>
    </div>
  );
}
