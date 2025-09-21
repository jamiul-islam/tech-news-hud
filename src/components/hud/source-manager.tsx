'use client';

import { useState, FormEvent } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { SourceType } from '@/types/hud';
import { pushToast } from '@/store/toast-store';

const tabs: Array<{ key: SourceType; label: string; placeholder: string }> = [
  {
    key: 'rss',
    label: 'RSS',
    placeholder: 'https://example.com/feed.xml',
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    placeholder: 'https://x.com/username or @handle',
  },
];

export const SourceManager = () => {
  const [activeTab, setActiveTab] = useState<SourceType>('rss');
  const [value, setValue] = useState('');
  const sources = useAppStore((state) => state.sources.items);
  const upsertSource = useAppStore((state) => state.upsertSource);
  const removeSource = useAppStore((state) => state.removeSource);
  const setFeedItems = useAppStore((state) => state.setFeedItems);
  const setFeedStatus = useAppStore((state) => state.setFeedStatus);
  const focusWeight = useAppStore((state) => state.preferences.focusWeight);

  const refreshFeed = async () => {
    try {
      setFeedStatus('loading');
      const res = await fetch(`/api/feed?limit=50&mixRatio=${focusWeight.toFixed(2)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load feed');
      const data = await res.json();
      setFeedItems(data.items ?? []);
      setFeedStatus('success');
    } catch (err) {
      console.warn('Failed to refresh feed', err);
      setFeedStatus('error');
    }
  };

  const handleRemove = async (sourceId: string) => {
    const existing = sources.find((s) => s.id === sourceId);
    removeSource(sourceId);
    try {
      const res = await fetch(`/api/sources/${sourceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete source');
      await refreshFeed();
      pushToast('Source removed.', 'info');
    } catch (err) {
      if (existing) {
        upsertSource(existing);
      }
      pushToast('Failed to remove source.', 'error');
      console.warn('Remove source failed', err);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;

    const id = crypto.randomUUID();
    const normalized = value.trim();
    let displayName = normalized;

    if (activeTab === 'rss') {
      try {
        const url = new URL(normalized);
        displayName = url.hostname.replace(/^www\./, '');
      } catch {
        displayName = normalized;
      }
    } else {
      displayName = normalized.replace(/^https?:\/\//, '').replace(/^@/, '');
    }

    // Optimistic UI
    upsertSource({ id, type: activeTab, displayName, url: activeTab === 'rss' ? normalized : undefined, handle: activeTab === 'twitter' ? normalized : undefined, status: 'queued' });

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          url: activeTab === 'rss' ? normalized : undefined,
          handle: activeTab === 'twitter' ? normalized : undefined,
          displayName,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to add source');
      }
      const data = await res.json();
      if (data?.source?.id) {
        upsertSource({
          id: data.source.id,
          type: activeTab,
          displayName: data.source.display_name ?? displayName,
          url: data.source.url ?? undefined,
          handle: data.source.handle ?? undefined,
          status: data.source.status ?? 'idle',
          lastPolledAt: data.source.last_polled_at ?? undefined,
        });
      }
      refreshFeed();
      setTimeout(() => {
        refreshFeed();
      }, 2500);
      pushToast('Source added. Fetching latest stories…', 'success');
    } catch (err) {
      // revert optimistic on error
      removeSource(id);
      pushToast('Could not add that source. Please check the URL/handle.', 'error');
      console.warn('Add source failed', err);
    } finally {
      setValue('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-[#4C7EFF]">
          Sources
        </h2>
        <p className="text-sm text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
          Paste an RSS feed or X profile to pull the latest posts into your
          stream. We blend your focus topics with globally trending signals.
        </p>
      </header>

      <div className="rounded-3xl border border-[#1f1f1f]/10 dark:border-[#f5f5f5]/10 bg-white/70 dark:bg-[#111]/90 p-5 shadow-sm shadow-[#000]/[0.02]">
        <div className="mb-4 flex gap-2 rounded-full bg-[#f2f4f8] dark:bg-[#161616] p-1 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white text-[#0F0F0F] dark:bg-[#0f0f0f] dark:text-[#F8F8F8] shadow-sm'
                  : 'text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={tabs.find((tab) => tab.key === activeTab)?.placeholder}
            aria-label={`Add ${activeTab === 'rss' ? 'RSS feed URL' : 'X handle'}`}
          />
          <Button type="submit" disabled={!value.trim()}>
            Add Source
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0F0F0F]/50 dark:text-[#F8F8F8]/50">
          Connected
        </p>
        {sources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#1f1f1f]/20 dark:border-[#f5f5f5]/20 bg-white/70 dark:bg-[#111]/60 p-6 text-sm text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
            Nothing yet. Add your first RSS feed or X account to start building
            signal.
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <li key={source.id}>
                <Badge tone={source.status === 'error' ? 'outline' : 'accent'}>
                  <span className="capitalize">{source.type}</span>
                  <span aria-hidden>·</span>
                  {source.displayName}
                  <button
                    type="button"
                    aria-label={`Remove ${source.displayName}`}
                    className="ml-2 text-xs text-[#0F0F0F]/60 hover:text-[#0F0F0F] dark:text-[#F8F8F8]/60 dark:hover:text-[#F8F8F8]"
                    onClick={() => handleRemove(source.id)}
                  >
                    ×
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
