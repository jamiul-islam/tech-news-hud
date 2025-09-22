'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pushToast } from '@/store/toast-store';

export const FocusControls = () => {
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const autoScrollActive = useAppStore((state) => state.feed.autoScrollActive);
  const toggleAutoScroll = useAppStore((state) => state.toggleAutoScroll);
  const lastPersisted = useRef<string>('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [loadingGeminiKey, setLoadingGeminiKey] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const focusPercent = useMemo(
    () => Math.round(preferences.focusWeight * 100),
    [preferences.focusWeight],
  );

  const handleThemeToggle = () => {
    const order: Array<typeof preferences.theme> = ['system', 'light', 'dark'];
    const nextIndex = (order.indexOf(preferences.theme) + 1) % order.length;
    updatePreferences({ theme: order[nextIndex] });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ai/key', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load AI key status');
        const data = await res.json();
        if (isMounted) {
          setHasGeminiKey(Boolean(data?.hasGeminiKey));
        }
      } catch (error) {
        console.warn('Failed to load Gemini key status', error);
      } finally {
        if (isMounted) setLoadingGeminiKey(false);
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasGeminiKey && preferences.showAiSummaries) {
      updatePreferences({ showAiSummaries: false });
    }
  }, [hasGeminiKey, preferences.showAiSummaries, updatePreferences]);

  const handleSaveGeminiKey = async () => {
    if (!keyInput.trim()) {
      pushToast('Enter a Gemini API key first.', 'error');
      return;
    }
    setSavingKey(true);
    try {
      const res = await fetch('/api/ai/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', apiKey: keyInput.trim() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = typeof payload?.error === 'string' ? payload.error : 'Failed to store Gemini key';
        throw new Error(message);
      }
      setHasGeminiKey(true);
      setKeyInput('');
      pushToast('Gemini API key saved.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to store Gemini key';
      pushToast(message, 'error');
      console.warn('Saving Gemini API key failed', error);
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    setSavingKey(true);
    try {
      const res = await fetch('/api/ai/key', { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = typeof payload?.error === 'string' ? payload.error : 'Failed to remove Gemini key';
        throw new Error(message);
      }
      setHasGeminiKey(false);
      updatePreferences({ showAiSummaries: false });
      pushToast('Gemini API key removed.', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove Gemini key';
      pushToast(message, 'error');
      console.warn('Removing Gemini API key failed', error);
    } finally {
      setSavingKey(false);
    }
  };

  useEffect(() => {
    const payload = {
      focusWeight: preferences.focusWeight,
      autoScrollIntervalMs: preferences.autoScrollIntervalMs,
      theme: preferences.theme,
      showAiSummaries: preferences.showAiSummaries,
      focusTopics: preferences.focusTopics,
    };
    const signature = JSON.stringify(payload);
    if (!lastPersisted.current) {
      lastPersisted.current = signature;
      return;
    }
    if (lastPersisted.current === signature) return;
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        lastPersisted.current = signature;
      } catch (error) {
        console.warn('Failed to persist preferences', error);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [preferences.autoScrollIntervalMs, preferences.focusTopics, preferences.focusWeight, preferences.showAiSummaries, preferences.theme]);

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
                Toggle once your Gemini key is connected.
              </p>
            </div>
            <Switch
              checked={preferences.showAiSummaries}
              disabled={!hasGeminiKey || savingKey || loadingGeminiKey}
              onClick={() => {
                if (!hasGeminiKey) {
                  pushToast('Add a Gemini API key first.', 'info');
                  return;
                }
                updatePreferences({ showAiSummaries: !preferences.showAiSummaries });
              }}
              aria-label="Toggle AI summaries"
            />
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Gemini API key</p>
            <p className="text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
              Stored privately for generating summaries. You can rotate or remove it anytime.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="gemini-api-key"
                type="password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder={hasGeminiKey ? '••••••••••••••••••' : 'Paste your Gemini API key'}
                disabled={savingKey}
                className="sm:flex-1"
              />
              <Button
                type="button"
                onClick={handleSaveGeminiKey}
                disabled={savingKey || keyInput.trim().length === 0}
              >
                {savingKey ? 'Saving…' : hasGeminiKey ? 'Update key' : 'Save key'}
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
              <span>
                {loadingGeminiKey
                  ? 'Checking key status…'
                  : hasGeminiKey
                  ? 'Gemini summaries enabled.'
                  : 'No Gemini key stored yet.'}
              </span>
              {hasGeminiKey && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveGeminiKey}
                  disabled={savingKey}
                >
                  Remove key
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
