'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onClick, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled ?? false}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
      }}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer',
        checked ? 'bg-[#4C7EFF]' : 'bg-[#e3e3e3] dark:bg-[#2a2a2a]',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  ),
);

Switch.displayName = 'Switch';
