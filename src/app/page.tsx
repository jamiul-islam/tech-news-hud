import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button.styles';
import { cn } from '@/lib/utils/cn';

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(76,126,255,0.08),_transparent_60%)] px-6 py-24 text-center">
      <div className="max-w-xl space-y-8">
        <p className="text-sm uppercase tracking-[0.4em] text-[#4C7EFF]">
          High-Signal Personal Briefing
        </p>
        <h1 className="text-4xl font-semibold text-[#0F0F0F] dark:text-[#F8F8F8] sm:text-5xl">
          Your calm command center for AI, startups, and the stories that matter.
        </h1>
        <p className="text-base text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
          Connect RSS feeds, newsletters, and X accounts. Let the HUD surface the
          perfect blend of focus topics and breakout signals, all in a gentle
          auto-scrolling reading experience.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link className={buttonClasses({ size: 'lg' })} href="/hud">
            Enter the HUD
          </Link>
          <Link
            className={cn(buttonClasses({ size: 'lg', variant: 'secondary' }), 'text-center')}
            href="/hud"
          >
            Start with demo feeds
          </Link>
        </div>
      </div>
    </div>
  );
}
