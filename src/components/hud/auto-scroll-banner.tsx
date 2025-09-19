'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from '@/lib/utils/time';

export const AutoScrollBanner = () => {
  const feedItems = useAppStore((state) => state.feed.items);
  const autoScrollActive = useAppStore((state) => state.feed.autoScrollActive);
  const intervalMs = useAppStore((state) => state.preferences.autoScrollIntervalMs);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const highlightItems = useMemo(() => {
    if (feedItems.length === 0) return [];
    return [...feedItems]
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 6);
  }, [feedItems]);

  useEffect(() => {
    if (!autoScrollActive || paused || highlightItems.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % highlightItems.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoScrollActive, paused, highlightItems.length, intervalMs]);

  useEffect(() => {
    if (index >= highlightItems.length) {
      setIndex(0);
    }
  }, [highlightItems.length, index]);

  if (highlightItems.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#1f1f1f]/15 dark:border-[#f5f5f5]/20 bg-white/70 dark:bg-[#111]/70 p-4 text-sm text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
        Stories will auto-cycle here once feeds sync. We default to a gentle 7s
        cadence that pauses on hover.
      </div>
    );
  }

  const activeItem = highlightItems[index];

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-[#1f1f1f]/10 dark:border-[#f5f5f5]/10 bg-white dark:bg-[#111] p-6 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-[#4C7EFF]">
        <span>Now Surfacing</span>
        <span>
          {index + 1}/{highlightItems.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 text-xs text-[#0F0F0F]/60 dark:text-[#F8F8F8]/60">
          <Badge tone="outline">{activeItem.sourceName}</Badge>
          {activeItem.publishedAt && (
            <span>{formatDistanceToNow(activeItem.publishedAt)} ago</span>
          )}
          <span className="flex items-center gap-1">
            <Badge tone="accent">Blend {Math.round(activeItem.finalScore * 100)}</Badge>
          </span>
        </div>
        <p className="text-lg font-semibold text-[#0F0F0F] transition group-hover:text-[#4C7EFF] dark:text-[#F8F8F8]">
          {activeItem.title}
        </p>
        {activeItem.summary && (
          <p className="max-w-xl text-sm text-[#0F0F0F]/70 dark:text-[#F8F8F8]/70">
            {activeItem.summary}
          </p>
        )}
      </div>
      <div className="absolute inset-x-6 bottom-4 h-1 rounded-full bg-[#e3e7f9] dark:bg-[#1d2b4d]">
        <div
          className="h-1 rounded-full bg-[#4C7EFF] transition-[width]"
          style={{
            width: paused || !autoScrollActive ? '0%' : '100%',
            transitionDuration: `${intervalMs}ms`,
          }}
        />
      </div>
    </div>
  );
};
