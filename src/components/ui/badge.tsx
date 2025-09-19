'use client';

import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'accent' | 'outline';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-[#e8e8e8] text-[#0F0F0F] dark:bg-[#1a1a1a] dark:text-[#F8F8F8]',
  accent: 'bg-[#4C7EFF]/15 text-[#4C7EFF]',
  outline:
    'border border-[#1f1f1f]/20 dark:border-[#f5f5f5]/20 text-[#0F0F0F] dark:text-[#F8F8F8]',
};

export const Badge = ({ className, tone = 'default', ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
      toneClasses[tone],
      className,
    )}
    {...props}
  />
);
