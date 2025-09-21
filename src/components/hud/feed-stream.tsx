'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pushToast } from '@/store/toast-store';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/utils/time';

const EmptyFeed = () => (
  <div className="rounded-3xl border border-dashed border-[#1f1f1f]/15 dark:border-[#f5f5f5]/20 bg-white/70 dark:bg-[#111]/70 p-10 text-center text-sm text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
    Add a source to see a blended feed of your focus topics and popular signals.
  </div>
);

const formatCount = (value?: number) => {
  if (!value || value < 0) return undefined;
  if (value < 1000) return value.toString();
  if (value < 10_000) return `${(value / 1000).toFixed(1)}K`;
  if (value < 1_000_000) return `${Math.round(value / 1000)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
};

export const FeedStream = () => {
  const items = useAppStore((state) => state.feed.items);
  const status = useAppStore((state) => state.feed.status);
  const setFeedItems = useAppStore((state) => state.setFeedItems);
  const upsertBookmark = useAppStore((state) => state.upsertBookmark);
  const removeBookmark = useAppStore((state) => state.removeBookmark);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA; // newest first
      }
      const scoreDelta = b.finalScore - a.finalScore;
      if (Math.abs(scoreDelta) > 0.0001) {
        return scoreDelta;
      }
      return b.popularityScore - a.popularityScore;
    });
  }, [items]);

  const toggleBookmark = async (id: string) => {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item,
    );
    setFeedItems(nextItems);

    const target = nextItems.find((item) => item.id === id);
    if (!target) return;

    if (target.isBookmarked) {
      upsertBookmark({ itemId: target.id, bookmarkedAt: new Date().toISOString() });
      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: target.id }),
        });
        pushToast('Saved to bookmarks', 'success');
      } catch (error) {
        pushToast('Bookmark failed to save', 'error');
        console.warn('Failed to save bookmark', error);
      }
    } else {
      removeBookmark(target.id);
      try {
        await fetch(`/api/bookmarks/${target.id}`, { method: 'DELETE' });
        pushToast('Bookmark removed', 'info');
      } catch (error) {
        pushToast('Bookmark removal failed', 'error');
        console.warn('Failed to delete bookmark', error);
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl bg-[#f1f1f1] dark:bg-[#1a1a1a]"
          />
        ))}
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <div className="space-y-4">
      {sortedItems.map((item) => (
        <Card key={item.id} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="outline" className="uppercase tracking-[0.25em] text-[10px]">
                    {item.sourceName}
                  </Badge>
                  {item.sourceHandle && (
                    <Badge tone="outline" className="text-[11px] font-medium">
                      {item.sourceHandle}
                    </Badge>
                  )}
                  {item.publishedAt && (
                    <span className="text-xs text-[#0F0F0F]/50 dark:text-[#F8F8F8]/50">
                      {formatDistanceToNow(item.publishedAt)} ago
                    </span>
                  )}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-semibold leading-snug text-[#0F0F0F] transition hover:text-[#4C7EFF] dark:text-[#F8F8F8]"
                >
                  {item.title}
                </a>
                {item.summary && (
                  <p className="text-sm text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
                    {item.summary}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
                <Badge tone="accent">Focus {Math.round(item.focusScore * 100)}%</Badge>
                <Badge tone="accent">Signal {Math.round(item.popularityScore * 100)}%</Badge>
                <Badge tone="outline">
                  Blend {Math.round(item.finalScore * 100)}
                </Badge>
                {item.focusTopics.map((topic) => (
                  <Badge key={topic} tone="outline">
                    #{topic}
                  </Badge>
                ))}
                {item.sourceType === 'twitter' && item.tweetMetrics && (
                  <>
                    {item.tweetMetrics.likeCount && (
                      <Badge tone="outline">Likes {formatCount(item.tweetMetrics.likeCount)}</Badge>
                    )}
                    {item.tweetMetrics.retweetCount && (
                      <Badge tone="outline">Reposts {formatCount(item.tweetMetrics.retweetCount)}</Badge>
                    )}
                    {item.tweetMetrics.replyCount && (
                      <Badge tone="outline">Replies {formatCount(item.tweetMetrics.replyCount)}</Badge>
                    )}
                    {item.tweetMetrics.quoteCount && (
                      <Badge tone="outline">Quotes {formatCount(item.tweetMetrics.quoteCount)}</Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                variant={item.isBookmarked ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleBookmark(item.id)}
              >
                {item.isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#4C7EFF] hover:underline"
              >
                Open original →
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
