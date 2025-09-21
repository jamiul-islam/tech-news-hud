import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

type CacheEntry = { timestamp: number; payload: { items: unknown[]; nextCursor: string | null } };
const FEED_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

type ItemRow = {
  id: string;
  source_id: string;
  title: string;
  summary: string | null;
  url: string;
  published_at: string | null;
  metadata: Record<string, unknown> | null;
  focus_topics: string[] | null;
  sources?: { display_name: string | null } | null;
};

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

  let query = supabase
    .from('items')
    .select('id, source_id, title, summary, url, published_at, metadata, focus_topics, sources!inner(display_name)', { count: 'exact' })
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
    return {
      id: row.id,
      title: row.title,
      summary: row.summary ?? '',
      url: row.url,
      sourceId: row.source_id,
      sourceName: row.sources?.display_name ?? 'Source',
      publishedAt: row.published_at ?? null,
      focusTopics,
      focusScore,
      popularityScore: popularity,
      finalScore,
      isBookmarked: false,
    };
  });

  const nextCursor = mapped.length === limit ? mapped[mapped.length - 1].publishedAt : null;
  const payload = { items: mapped, nextCursor };
  FEED_CACHE.set(cacheKey, { timestamp: Date.now(), payload });
  return Response.json(payload);
}
