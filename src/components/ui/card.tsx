import { cn } from '@/lib/utils/cn';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-3xl border border-[#1f1f1f]/10 dark:border-[#f5f5f5]/10 bg-white/70 dark:bg-[#111]/90 shadow-sm shadow-[#000]/[0.03] backdrop-blur-sm',
      className,
    )}
    {...props}
  />
);
