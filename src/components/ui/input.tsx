'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-full border border-[#1f1f1f]/15 dark:border-[#f5f5f5]/12 bg-white/80 dark:bg-[#111]/90 px-4 text-sm text-[#0F0F0F] dark:text-[#F8F8F8] placeholder:text-[#0f0f0f]/40 dark:placeholder:text-[#F8F8F8]/40 focus:border-[#4C7EFF]/50 focus:outline-none focus:ring-2 focus:ring-[#4C7EFF]/30 transition',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
