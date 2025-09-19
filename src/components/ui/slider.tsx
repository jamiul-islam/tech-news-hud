'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export type SliderProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn(
        'h-2 w-full appearance-none rounded-full bg-[#e6e6e6] dark:bg-[#1d1d1d] accent-[#4C7EFF]',
        'before:content-[] before:h-2 before:rounded-full',
        className,
      )}
      {...props}
    />
  ),
);

Slider.displayName = 'Slider';
