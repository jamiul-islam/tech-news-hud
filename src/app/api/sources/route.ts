/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAdminSupabase } from '@/lib/supabase/admin-client';
import { formatTwitterHandle, normalizeTwitterHandle } from '@/lib/utils/twitter';

type SourceRow = {
  id: string;
  user_id: string;
  type: 'rss' | 'twitter';
  url: string | null;
  handle: string | null;
  display_name: string | null;
  status: string | null;
  last_polled_at: string | null;
  created_at?: string;
  updated_at?: string;
};

const BodySchema = z.object({
  type: z.enum(['rss', 'twitter']).optional(),
  url: z.string().url().optional(),
  handle: z.string().optional(),
  displayName: z.string().min(1).optional(),
});

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await (supabase as any)
    .from('sources')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ sources: (data as SourceRow[] | null) ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const { type, url, handle } = parsed.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await (supabase as any)
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
      },
      { onConflict: 'id' },
    );

  // Infer type if not provided
  const resolvedType: 'rss' | 'twitter' = type ?? (url ? 'rss' : 'twitter');

  let normalizedHandle: string | null = null;
  if (resolvedType === 'twitter') {
    normalizedHandle = normalizeTwitterHandle(handle ?? '');
    if (!normalizedHandle) {
      return Response.json({ error: 'Invalid X handle. Please use @username format.' }, { status: 400 });
    }
  } else if (!url) {
    return Response.json({ error: 'RSS URL is required.' }, { status: 400 });
  }

  const normalizedUrl = resolvedType === 'rss' ? (url ?? '').trim() : null;
  if (resolvedType === 'rss' && !normalizedUrl) {
    return Response.json({ error: 'RSS URL is required.' }, { status: 400 });
  }

  const displayName = parsed.data.displayName
    ?? (resolvedType === 'rss'
      ? (() => {
          try {
            const u = new URL(normalizedUrl as string);
            return u.hostname.replace(/^www\./, '');
          } catch {
            return normalizedUrl as string;
          }
        })()
      : formatTwitterHandle(normalizedHandle as string));

  const { data, error } = await (supabase as any)
    .from('sources')
    .insert({
      user_id: user.id,
      type: resolvedType,
      url: resolvedType === 'rss' ? (normalizedUrl as string) : null,
      handle: resolvedType === 'twitter' ? (normalizedHandle as string) : null,
      display_name: displayName,
      status: 'queued',
    })
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const createdSource = data as SourceRow;

  try {
    const admin = getAdminSupabase();
    await (admin as any).from('jobs').insert({
      source_id: createdSource.id,
      status: 'queued',
      scheduled_for: new Date().toISOString(),
    });
  } catch (jobError) {
    console.warn('Failed to enqueue job', jobError);
  }

  let ingestion: { success?: boolean; results?: unknown; status?: number; error?: unknown } | undefined;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const slug = createdSource.type === 'twitter' ? 'twitter-fetch' : 'rss-fetch';
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${slug}`;
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sourceId: createdSource.id }),
      });
      const payload = await response.json().catch(() => ({}));
      const success = typeof payload?.success === 'boolean' ? payload.success : response.ok;
      ingestion = {
        success,
        results: payload?.results,
        status: response.status,
        error: payload?.error,
      };
      if (!ingestion.success) {
        console.warn(`Ingestion function ${slug} reported failure`, { payload, status: response.status });
      }
    } catch (err) {
      console.warn(`Failed to trigger ${slug}`, err);
      ingestion = { success: false, results: null };
    }
  }

  return Response.json({ source: createdSource, ingestion }, { status: 201 });
}
