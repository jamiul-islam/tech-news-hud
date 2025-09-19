'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export const FocusControls = () => {
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const autoScrollActive = useAppStore((state) => state.feed.autoScrollActive);
  const toggleAutoScroll = useAppStore((state) => state.toggleAutoScroll);

  const focusPercent = useMemo(
    () => Math.round(preferences.focusWeight * 100),
    [preferences.focusWeight],
  );

  const handleThemeToggle = () => {
    const order: Array<typeof preferences.theme> = ['system', 'light', 'dark'];
    const nextIndex = (order.indexOf(preferences.theme) + 1) % order.length;
    updatePreferences({ theme: order[nextIndex] });
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-[#4C7EFF]">
          Focus Mix
        </h2>
        <p className="mt-2 text-sm text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
          Blend your focus topics with globally popular stories. Adjust the mix
          and auto-scroll cadence anytime.
        </p>
      </header>

      <div className="rounded-3xl border border-[#1f1f1f]/10 dark:border-[#f5f5f5]/10 bg-white/70 dark:bg-[#111]/90 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Focus weighting</span>
              <span className="text-[#4C7EFF]">{focusPercent}% focus</span>
            </div>
            <Slider
              min={0.5}
              max={0.9}
              step={0.05}
              value={preferences.focusWeight}
              onChange={(event) =>
                updatePreferences({ focusWeight: Number(event.target.value) })
              }
            />
            <p className="mt-2 text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
              Higher focus prioritizes your topics. Lower focus invites more
              popular stories for serendipity.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">Auto-scroll banner</p>
              <p className="text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
                Cycles every {Math.round(preferences.autoScrollIntervalMs / 1000)}s
                when active. Pauses on hover or manual scroll.
              </p>
            </div>
            <Switch
              checked={autoScrollActive}
              onClick={() => toggleAutoScroll()}
              aria-label="Toggle auto scroll"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
                {preferences.theme === 'system' && 'Follow system preference'}
                {preferences.theme === 'light' && 'Minimal light theme'}
                {preferences.theme === 'dark' && 'Midnight reading mode'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleThemeToggle}>
              {preferences.theme === 'system'
                ? 'System'
                : preferences.theme === 'light'
                ? 'Light'
                : 'Dark'}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">AI summaries</p>
              <p className="text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
                Toggle when you supply an OpenAI or Gemini key in settings.
              </p>
            </div>
            <Switch
              checked={preferences.showAiSummaries}
              onClick={() =>
                updatePreferences({ showAiSummaries: !preferences.showAiSummaries })
              }
              aria-label="Toggle AI summaries"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
