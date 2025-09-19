'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/utils/time';

export const BookmarkShelf = () => {
  const bookmarks = useAppStore((state) => state.bookmarks.items);
  const setLastSnoozedAt = useAppStore((state) => state.setLastSnoozedAt);
  const removeBookmark = useAppStore((state) => state.removeBookmark);
  const feedItems = useAppStore((state) => state.feed.items);

  const entries = useMemo(
    () =>
      bookmarks
        .map((bookmark) => {
          const item = feedItems.find((feedItem) => feedItem.id === bookmark.itemId);
          return item
            ? {
                bookmark,
                item,
              }
            : undefined;
        })
        .filter(Boolean)
        .slice(0, 3) as Array<{
        bookmark: (typeof bookmarks)[number];
        item: (typeof feedItems)[number];
      }>,
    [bookmarks, feedItems],
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#1f1f1f]/15 dark:border-[#f5f5f5]/20 bg-white/70 dark:bg-[#111]/70 p-6 text-sm text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
        Saved articles land here every ~30 minutes so you can revisit when
        you&apos;re ready.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.32em] text-[#4C7EFF]">
          Bookmarks
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-[#0F0F0F]/60 hover:text-[#4C7EFF] dark:text-[#F8F8F8]/60"
          onClick={() => setLastSnoozedAt(new Date().toISOString())}
        >
          Snooze 2h
        </Button>
      </div>

      <div className="space-y-3">
        {entries.map(({ bookmark, item }) => (
          <Card key={bookmark.itemId} className="p-4">
            <div className="space-y-2 text-sm">
              <a
                href={item.url}
                className="block font-medium text-[#0F0F0F] transition hover:text-[#4C7EFF] dark:text-[#F8F8F8]"
                target="_blank"
                rel="noreferrer"
              >
                {item.title}
              </a>
              <p className="text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
                Saved {formatDistanceToNow(bookmark.bookmarkedAt)} ago
              </p>
              <div className="flex items-center gap-2 text-xs text-[#0F0F0F]/50 dark:text-[#F8F8F8]/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs"
                  onClick={() => removeBookmark(bookmark.itemId)}
                >
                  Remove
                </Button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4C7EFF] hover:underline"
                >
                  Open →
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
