'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import type { SourceStatus } from '@/types/hud';
import { Button } from '@/components/ui/button';
import { AutoScrollBanner } from './auto-scroll-banner';
import { SourceManager } from './source-manager';
import { FeedStream } from './feed-stream';
import { FocusControls } from './focus-controls';
import { BookmarkShelf } from './bookmark-shelf';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { pushToast } from '@/store/toast-store';

const demoSources = [
  {
    id: 'demo-hn',
    type: 'rss' as const,
    displayName: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    status: 'idle' as const,
    lastPolledAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'demo-tldr',
    type: 'rss' as const,
    displayName: 'TLDR AI',
    url: 'https://www.tldrnewsletter.com/ai/rss',
    status: 'idle' as const,
    lastPolledAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'demo-twitter',
    type: 'twitter' as const,
    displayName: 'RundownAI',
    handle: '@RundownAI',
    status: 'idle' as const,
    lastPolledAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

const demoItems = [
  {
    id: 'item-1',
    title: 'OpenAI releases lightweight agent orchestration toolkit for developers',
    summary:
      'The toolkit prioritizes reliability and step tracing, making it easier to monitor agent runs in production-grade workflows.',
    url: 'https://news.ycombinator.com/item?id=42420000',
    sourceId: 'demo-hn',
    sourceName: 'Hacker News',
    sourceHandle: undefined,
    sourceType: 'rss' as const,
    publishedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    focusTopics: ['ai-research', 'agentic'],
    focusScore: 0.86,
    popularityScore: 0.62,
    finalScore: 0.78,
    isBookmarked: false,
  },
  {
    id: 'item-2',
    title: 'RundownAI: Why lightweight LLMs are winning the enterprise edge',
    summary:
      'A breakdown of the tradeoffs between large frontier models and efficient distillations, plus benchmarks on device deployment.',
    url: 'https://rundown.ai/briefings/lightweight-edge',
    sourceId: 'demo-twitter',
    sourceName: 'RundownAI',
    sourceHandle: '@RundownAI',
    sourceType: 'twitter' as const,
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    focusTopics: ['ai-infra', 'edge'],
    focusScore: 0.74,
    popularityScore: 0.71,
    finalScore: 0.73,
    isBookmarked: true,
    tweetId: 'demo-2',
    tweetUsername: 'rundownai',
    tweetMetrics: { likeCount: 520, retweetCount: 87 },
  },
  {
    id: 'item-3',
    title: 'Anthropic shares roadmap for Claude team collaboration features',
    summary:
      'Shared focus profiles and conversation hand-offs aim to make AI assistants more useful for cross-functional teams.',
    url: 'https://www.tldrnewsletter.com/ai/claude-roadmap',
    sourceId: 'demo-tldr',
    sourceName: 'TLDR AI',
    sourceHandle: undefined,
    sourceType: 'rss' as const,
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    focusTopics: ['productivity', 'ai-tools'],
    focusScore: 0.68,
    popularityScore: 0.58,
    finalScore: 0.65,
    isBookmarked: false,
  },
  {
    id: 'item-4',
    title: 'YC founders debate AGI timelines in trending X thread',
    summary:
      'A heated exchange over whether open models will outpace closed labs triggered a wave of expert responses overnight.',
    url: 'https://x.com/thread/agi-timelines',
    sourceId: 'demo-twitter',
    sourceName: 'X — Followed',
    sourceHandle: '@debate_ai',
    sourceType: 'twitter' as const,
    publishedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    focusTopics: ['debate', 'ai-governance'],
    focusScore: 0.61,
    popularityScore: 0.84,
    finalScore: 0.69,
    isBookmarked: false,
    tweetId: 'demo-4',
    tweetUsername: 'debate_ai',
    tweetMetrics: { likeCount: 1120, retweetCount: 340, replyCount: 87 },
  },
  {
    id: 'item-5',
    title: 'Stability AI open-sources new image-to-video base model',
    summary:
      'The model generates 8-second clips with coherency improvements and offers a permissive license for commercial use.',
    url: 'https://news.ycombinator.com/item?id=42417654',
    sourceId: 'demo-hn',
    sourceName: 'Hacker News',
    sourceHandle: undefined,
    sourceType: 'rss' as const,
    publishedAt: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    focusTopics: ['generative', 'video'],
    focusScore: 0.72,
    popularityScore: 0.55,
    finalScore: 0.66,
    isBookmarked: false,
  },
];

export const HudRoot = () => {
type ApiSource = {
  id: string;
  type: 'rss' | 'twitter';
  display_name?: string | null;
  url?: string | null;
  handle?: string | null;
  status?: string | null;
  last_polled_at?: string | null;
};

type BookmarkRow = {
  item_id: string;
  bookmarked_at: string;
  surfaced_at?: string | null;
};

  const sources = useAppStore((state) => state.sources.items);
  const setSources = useAppStore((state) => state.setSources);
  const setFeedItems = useAppStore((state) => state.setFeedItems);
  const setFeedNextCursor = useAppStore((state) => state.setFeedNextCursor);
  const setSourcesStatus = useAppStore((state) => state.setSourcesStatus);
  const setFeedStatus = useAppStore((state) => state.setFeedStatus);
  const setBookmarkEntries = useAppStore((state) => state.setBookmarkEntries);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const focusWeight = useAppStore((state) => state.preferences.focusWeight);
  const sourcesStatus = useAppStore((state) => state.sources.status);
  const feedStatus = useAppStore((state) => state.feed.status);
  const focusMixLabel = `${Math.round(focusWeight * 100)}% focus · ${Math.round((1 - focusWeight) * 100)}% signal`;
  const errorNotified = useRef(new Set<string>());

  useEffect(() => {
    const seen = errorNotified.current;
    sources.forEach((source) => {
      if (source.status === 'error') {
        if (!seen.has(source.id)) {
          seen.add(source.id);
          const label = source.displayName ?? source.handle ?? 'source';
          pushToast(`We could not refresh ${label}. Check the handle or token and try again.`, 'error', { duration: 5000 });
        }
      } else {
        seen.delete(source.id);
      }
    });
  }, [sources]);

  const fetchAccountData = useCallback(async () => {
    try {
      const [prefsRes, bookmarksRes] = await Promise.all([
        fetch('/api/preferences', { cache: 'no-store' }),
        fetch('/api/bookmarks', { cache: 'no-store' }),
      ]);
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        if (prefsData?.preferences) {
          updatePreferences({
            focusWeight: prefsData.preferences.focusWeight,
            autoScrollIntervalMs: prefsData.preferences.autoScrollIntervalMs,
            theme: prefsData.preferences.theme,
            showAiSummaries: prefsData.preferences.showAiSummaries,
            focusTopics: prefsData.preferences.focusTopics ?? {},
          });
        }
      }
      if (bookmarksRes.ok) {
        const bookmarkData: { bookmarks?: BookmarkRow[] } = await bookmarksRes.json();
        if (Array.isArray(bookmarkData?.bookmarks)) {
          setBookmarkEntries(
            bookmarkData.bookmarks.map((item) => ({
              itemId: item.item_id,
              bookmarkedAt: item.bookmarked_at,
              surfacedAt: item.surfaced_at ?? undefined,
            })),
          );
        }
      }
    } catch (error) {
      console.warn('Failed to fetch account data', error);
    }
  }, [setBookmarkEntries, updatePreferences]);

  useEffect(() => {
    async function bootstrap() {
      if (sources.length === 0) {
        setSourcesStatus('loading');
        // Try to pull sources from API (requires auth). Fallback to demo.
        try {
          const res = await fetch('/api/sources', { cache: 'no-store' });
          if (res.ok) {
            const data: { sources?: ApiSource[] } = await res.json();
            if (Array.isArray(data.sources) && data.sources.length > 0) {
              const validStatuses: ReadonlyArray<SourceStatus> = ['idle', 'queued', 'fetching', 'error'];
              setSources(
                data.sources.map((s) => {
                  const maybeStatus = (s.status ?? 'idle') as SourceStatus | string;
                  const status: SourceStatus = validStatuses.includes(maybeStatus as SourceStatus)
                    ? (maybeStatus as SourceStatus)
                    : 'idle';
                  return {
                    id: s.id,
                    type: s.type,
                    displayName: s.display_name ?? 'Source',
                    url: s.url ?? undefined,
                    handle: s.handle ?? undefined,
                    status,
                    lastPolledAt: s.last_polled_at ?? undefined,
                  };
                }),
              );
              setSourcesStatus('success');
              // Fetch feed for these sources
              setFeedStatus('loading');
              const feedRes = await fetch(`/api/feed?limit=15&mixRatio=${focusWeight.toFixed(2)}`, { cache: 'no-store' });
              if (feedRes.ok) {
                const feed = await feedRes.json();
                setFeedItems(feed.items ?? []);
                setFeedNextCursor(feed.nextCursor ?? null);
                setFeedStatus('success');
                await fetchAccountData();
                return;
              }
            }
            // If authenticated but no sources, show empty state (do not fallback)
            setSourcesStatus('success');
            setFeedStatus('success');
            setFeedNextCursor(null);
            await fetchAccountData();
            return;
          }
        } catch {
          // ignore and fall back to demo below
        }
        // Demo fallback
        setTimeout(() => {
          setSources(demoSources);
          setSourcesStatus('success');
          setFeedItems(demoItems);
          setFeedNextCursor(null);
          setFeedStatus('success');
          setBookmarkEntries(
            demoItems
              .filter((item) => item.isBookmarked)
              .map((item) => ({
                itemId: item.id,
                bookmarkedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
              })),
          );
        }, 800);
      }
    }
    bootstrap();
  }, [fetchAccountData, focusWeight, setFeedItems, setFeedNextCursor, setFeedStatus, setSources, setSourcesStatus, setBookmarkEntries, sources.length]);

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      {sourcesStatus === 'loading' && feedStatus === 'loading' && (
        <LoadingIndicator />
      )}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-[#4C7EFF]">
            High-Signal HUD
          </p>
          <h1 className="text-3xl font-semibold text-[#0F0F0F] dark:text-[#F8F8F8]">
            Morning brief · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
          <div className="hidden sm:inline-flex items-center gap-3">
            <span>Focus mix:</span>
            <div className="rounded-full bg-[#4C7EFF]/15 px-4 py-1 text-[#4C7EFF]">{focusMixLabel}</div>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="secondary" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="grid gap-8 lg:grid-cols-[320px_1fr_280px] xl:grid-cols-[340px_1fr_320px]">
        <div className="space-y-8">
          <SourceManager />
          <FocusControls />
        </div>

        <div className="space-y-6">
          <AutoScrollBanner />
          <FeedStream />
        </div>

        <div className="space-y-6">
          <BookmarkShelf />
          <div className="rounded-3xl border border-[#1f1f1f]/10 dark:border-[#f5f5f5]/10 bg-white/70 dark:bg-[#111]/80 p-6 text-sm text-[#0F0F0F]/65 dark:text-[#F8F8F8]/65">
            <p className="font-medium text-[#0F0F0F] dark:text-[#F8F8F8]">
              Coming soon
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>• Bring your own OpenAI or Gemini key for summaries.</li>
              <li>• Shared focus profiles for teams.</li>
              <li>• Semantic clustering to avoid duplicates.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
