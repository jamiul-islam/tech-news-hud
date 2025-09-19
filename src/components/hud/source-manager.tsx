'use client';

import { useState, FormEvent } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { SourceType } from '@/types/hud';

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    upsertSource({
      id,
      type: activeTab,
      displayName,
      url: activeTab === 'rss' ? normalized : undefined,
      handle: activeTab === 'twitter' ? normalized : undefined,
      status: 'queued',
    });

    setValue('');
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
                    onClick={() => removeSource(source.id)}
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
