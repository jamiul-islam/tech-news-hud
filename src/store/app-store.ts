'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BookmarkEntry,
  FeedItem,
  FocusPreferences,
  Source,
  FetchState,
} from '@/types/hud';

interface SessionState {
  userId?: string;
  email?: string;
  status: FetchState;
}

interface SourcesState {
  items: Source[];
  status: FetchState;
  error?: string;
}

interface FeedState {
  items: FeedItem[];
  status: FetchState;
  autoScrollActive: boolean;
  nextCursor: string | null;
}

type PreferencesState = FocusPreferences;

interface BookmarksState {
  items: BookmarkEntry[];
  lastSnoozedAt?: string;
}

interface AppState {
  session: SessionState;
  sources: SourcesState;
  feed: FeedState;
  preferences: PreferencesState;
  bookmarks: BookmarksState;
}

interface AppActions {
  setSession: (session: Partial<SessionState>) => void;
  resetSession: () => void;
  setSources: (sources: Source[]) => void;
  upsertSource: (source: Source) => void;
  removeSource: (sourceId: string) => void;
  setSourcesStatus: (status: FetchState, error?: string) => void;
  setFeedItems: (items: FeedItem[], options?: { append?: boolean }) => void;
  setFeedNextCursor: (cursor: string | null) => void;
  setFeedStatus: (status: FetchState) => void;
  toggleAutoScroll: (value?: boolean) => void;
  updatePreferences: (prefs: Partial<PreferencesState>) => void;
  setBookmarkEntries: (entries: BookmarkEntry[]) => void;
  upsertBookmark: (entry: BookmarkEntry) => void;
  removeBookmark: (itemId: string) => void;
  setLastSnoozedAt: (iso: string | undefined) => void;
}

const defaultPreferences: PreferencesState = {
  focusWeight: 0.7,
  autoScrollIntervalMs: 7000,
  theme: 'system',
  showAiSummaries: false,
  focusTopics: {},
};

const initialState: AppState = {
  session: {
    status: 'idle',
  },
  sources: {
    items: [],
    status: 'idle',
  },
  feed: {
    items: [],
    status: 'idle',
    autoScrollActive: true,
    nextCursor: null,
  },
  preferences: defaultPreferences,
  bookmarks: {
    items: [],
  },
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (session) =>
        set((state) => ({
          session: { ...state.session, ...session },
        })),
      resetSession: () => set({ session: { status: 'idle' } }),
      setSources: (sources) =>
        set((state) => ({
          sources: { ...state.sources, items: sources },
        })),
      upsertSource: (source) =>
        set((state) => {
          const existingIndex = state.sources.items.findIndex(
            (item) => item.id === source.id,
          );

          if (existingIndex === -1) {
            return {
              sources: {
                ...state.sources,
                items: [...state.sources.items, source],
              },
            };
          }

          const nextItems = state.sources.items.slice();
          nextItems[existingIndex] = { ...nextItems[existingIndex], ...source };

          return {
            sources: {
              ...state.sources,
              items: nextItems,
            },
          };
        }),
      removeSource: (sourceId) =>
        set((state) => ({
          sources: {
            ...state.sources,
            items: state.sources.items.filter((item) => item.id !== sourceId),
          },
        })),
      setSourcesStatus: (status, error) =>
        set((state) => ({
          sources: {
            ...state.sources,
            status,
            error,
          },
        })),
      setFeedItems: (items, options) =>
        set((state) => {
          if (options?.append) {
            const existing = state.feed.items;
            const existingIds = new Set(existing.map((item) => item.id));
            const merged = [...existing];
            for (const item of items) {
              if (!existingIds.has(item.id)) {
                merged.push(item);
              }
            }
            return {
              feed: {
                ...state.feed,
                items: merged,
              },
            };
          }

          return {
            feed: {
              ...state.feed,
              items,
            },
          };
        }),
      setFeedNextCursor: (cursor) =>
        set((state) => ({
          feed: {
            ...state.feed,
            nextCursor: cursor,
          },
        })),
      setFeedStatus: (status) =>
        set((state) => ({
          feed: { ...state.feed, status },
        })),
      toggleAutoScroll: (value) =>
        set((state) => ({
          feed: {
            ...state.feed,
            autoScrollActive:
              typeof value === 'boolean' ? value : !state.feed.autoScrollActive,
          },
        })),
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      setBookmarkEntries: (entries) =>
        set(() => ({
          bookmarks: { items: entries },
        })),
      upsertBookmark: (entry) =>
        set((state) => {
          const exists = state.bookmarks.items.some(
            (item) => item.itemId === entry.itemId,
          );
          return {
            bookmarks: {
              ...state.bookmarks,
              items: exists
                ? state.bookmarks.items.map((item) =>
                    item.itemId === entry.itemId ? entry : item,
                  )
                : [...state.bookmarks.items, entry],
            },
          };
        }),
      removeBookmark: (itemId) =>
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            items: state.bookmarks.items.filter((item) => item.itemId !== itemId),
          },
        })),
      setLastSnoozedAt: (iso) =>
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            lastSnoozedAt: iso,
          },
        })),
    }),
    {
      name: 'hud-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
        bookmarks: state.bookmarks,
      }),
    },
  ),
);

export const resetAppStore = () => {
  useAppStore.persist?.clearStorage();
  useAppStore.setState((state) => ({
    ...state,
    ...initialState,
  }));
};
