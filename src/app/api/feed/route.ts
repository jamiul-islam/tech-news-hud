import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { formatTwitterHandle } from '@/lib/utils/twitter';

type CacheEntry = { timestamp: number; payload: { items: unknown[]; nextCursor: string | null } };
const FEED_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;
const REFRESH_WINDOW_MS = 5 * 60 * 1000;
const STALE_AFTER_MS = 15 * 60 * 1000;
const lastRefreshRequests = new Map<string, number>();

type ItemRow = {
  id: string;
  source_id: string;
  title: string;
  summary: string | null;
  url: string;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
  focus_topics: string[] | null;
  sources?: { display_name: string | null; type: 'rss' | 'twitter'; handle?: string | null } | null;
};

type SourceForRefresh = {
  id: string;
  type: 'rss' | 'twitter';
  last_polled_at: string | null;
};

async function refreshStaleSources(sources: SourceForRefresh[]): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  const now = Date.now();
  const staleThreshold = now - STALE_AFTER_MS;

  const candidates = sources.filter((source) => {
    if (source.type !== 'rss') return false;
    const lastRequest = lastRefreshRequests.get(source.id) ?? 0;
    if (now - lastRequest < REFRESH_WINDOW_MS) return false;
    if (!source.last_polled_at) return true;
    const polledAt = new Date(source.last_polled_at).getTime();
    if (Number.isNaN(polledAt)) return true;
    return polledAt < staleThreshold;
  });

  if (candidates.length === 0) {
    return;
  }

  candidates.forEach((source) => lastRefreshRequests.set(source.id, now));

  await Promise.all(
    candidates.map(async (source) => {
      const slug = source.type === 'twitter' ? 'twitter-fetch' : 'rss-fetch';
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${slug}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sourceId: source.id }),
          },
        );
        if (!response.ok) {
          const text = await response.text();
        console.warn(`Failed to refresh ${slug} for source ${source.id}`, text);
      }
      } catch (error) {
        console.warn(`Error refreshing ${slug} for source ${source.id}`, error);
      }
    }),
  );
}

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  before: z.string().optional(), // ISO timestamp cursor
  mixRatio: z.coerce.number().min(0).max(1).default(0.7).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
    before: searchParams.get('before') ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: 'Invalid query' }, { status: 400 });
  }

  const { limit, before, mixRatio } = parsed.data;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `${user.id}:${limit}:${before ?? 'root'}:${(mixRatio ?? 0.7).toFixed(2)}`;
  const cached = FEED_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Response.json(cached.payload);
  }

  const { data: sourceData } = await supabase
    .from('sources')
    .select('id, type, last_polled_at')
    .eq('user_id', user.id);

  if (Array.isArray(sourceData) && sourceData.length > 0) {
    await refreshStaleSources(sourceData as SourceForRefresh[]);
  }

  let query = supabase
    .from('items')
    .select('id, source_id, title, summary, url, published_at, metadata, focus_topics, sources!inner(display_name, type, handle)', { count: 'exact' })
    .eq('sources.user_id', user.id)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (before) {
    query = query.lt('published_at', before);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const focusBlend = mixRatio ?? 0.7;
  const popBlend = 1 - focusBlend;

  const mapped = ((data as ItemRow[] | null) ?? []).map((row) => {
    const focusTopics: string[] = Array.isArray(row.focus_topics) ? (row.focus_topics as string[]) : [];
    const md = (row.metadata ?? {}) as Record<string, unknown>;
    let popularity = 0.5;
    const popVal = md['popularity'];
    if (typeof popVal === 'number') popularity = popVal as number;
    const focusScore = focusTopics.length > 0 ? 0.7 : 0.4;
    const finalScore = focusBlend * focusScore + popBlend * popularity;
    const sourceType: 'rss' | 'twitter' = row.sources?.type === 'twitter' ? 'twitter' : 'rss';
    const usernameRaw = typeof md['username'] === 'string' ? (md['username'] as string) : undefined;
    const fallbackHandle = row.sources?.handle ?? undefined;
    const username = (usernameRaw ?? fallbackHandle)?.toLowerCase();
    const sourceHandle = username ? formatTwitterHandle(username) : undefined;
    const authorName = typeof md['authorName'] === 'string' && md['authorName'] ? (md['authorName'] as string) : row.sources?.display_name ?? undefined;

    const tweetMetricsRaw = md['tweetMetrics'];
    const tweetMetrics =
      sourceType === 'twitter' && tweetMetricsRaw && typeof tweetMetricsRaw === 'object'
        ? (() => {
            const metrics = tweetMetricsRaw as Record<string, unknown>;
            const likeCount = typeof metrics.likeCount === 'number' ? metrics.likeCount : undefined;
            const retweetCount = typeof metrics.retweetCount === 'number' ? metrics.retweetCount : undefined;
            const replyCount = typeof metrics.replyCount === 'number' ? metrics.replyCount : undefined;
            const quoteCount = typeof metrics.quoteCount === 'number' ? metrics.quoteCount : undefined;
            if (!likeCount && !retweetCount && !replyCount && !quoteCount) return undefined;
            return { likeCount, retweetCount, replyCount, quoteCount };
          })()
        : undefined;

    const tweetId = typeof md['tweetId'] === 'string' ? (md['tweetId'] as string) : undefined;
    const aiSummary = typeof md['ai_summary'] === 'string' ? (md['ai_summary'] as string) : undefined;
    const aiSummaryUpdatedAt = typeof md['ai_summary_updated_at'] === 'string' ? (md['ai_summary_updated_at'] as string) : undefined;

    return {
      id: row.id,
      title: row.title,
      summary: row.summary ?? '',
      url: row.url,
      sourceId: row.source_id,
      sourceName: authorName ?? sourceHandle ?? row.sources?.display_name ?? 'Source',
      sourceHandle,
      sourceType,
      publishedAt: row.published_at ?? null,
      focusTopics,
      focusScore,
      popularityScore: popularity,
      finalScore,
      isBookmarked: false,
      tweetMetrics,
      tweetId,
      tweetUsername: username,
      aiSummary,
      aiSummaryUpdatedAt,
    };
  });

  const nextCursor = mapped.length === limit ? mapped[mapped.length - 1].publishedAt : null;
  const payload = { items: mapped, nextCursor };
  FEED_CACHE.set(cacheKey, { timestamp: Date.now(), payload });
  return Response.json(payload);
}
