export type SourceType = 'rss' | 'twitter';

export type SourceStatus = 'idle' | 'queued' | 'fetching' | 'error';

export interface Source {
  id: string;
  type: SourceType;
  displayName: string;
  url?: string;
  handle?: string;
  status: SourceStatus;
  lastPolledAt?: string;
}

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceId: string;
  sourceName: string;
  sourceHandle?: string;
  sourceType: SourceType;
  publishedAt?: string;
  focusTopics: string[];
  focusScore: number;
  popularityScore: number;
  finalScore: number;
  isBookmarked: boolean;
  tweetId?: string;
  tweetUsername?: string;
  tweetMetrics?: {
    likeCount?: number;
    retweetCount?: number;
    replyCount?: number;
    quoteCount?: number;
  };
}

export interface FocusPreferences {
  focusWeight: number; // 0-1 range representing blend weight
  autoScrollIntervalMs: number;
  theme: 'light' | 'dark' | 'system';
  showAiSummaries: boolean;
  focusTopics: Record<string, number>;
}

export interface BookmarkEntry {
  itemId: string;
  bookmarkedAt: string;
  surfacedAt?: string;
}

export type FetchState = 'idle' | 'loading' | 'success' | 'error';
