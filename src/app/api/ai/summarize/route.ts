/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAdminSupabase } from '@/lib/supabase/admin-client';

const BodySchema = z.object({
  itemId: z.string().uuid(),
  force: z.boolean().optional(),
});

const GEMINI_MODEL = 'gemini-1.5-flash-latest';

async function generateSummary(apiKey: string, title: string, snippet: string, url?: string | null) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `Summarize the following news item in two concise sentences. Focus on key facts and avoid speculation.

Title: ${title}
Content:
${snippet}
${url ? `Source: ${url}` : ''}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const errorMessage = payload?.error?.message ?? response.statusText;
    throw new Error(`Gemini API request failed: ${errorMessage}`);
  }

  const candidates = payload?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('Gemini response missing candidates');
  }

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Gemini response missing content parts');
  }

  const summaryText = parts
    .map((part: Record<string, unknown>) => (typeof part.text === 'string' ? part.text : ''))
    .join(' ')
    .trim();

  if (!summaryText) {
    throw new Error('Gemini returned empty summary');
  }

  return summaryText;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId, force = false } = parsed.data;

  const { data: item, error: itemError } = await (supabase as any)
    .from('items')
    .select('id, title, summary, url, metadata, sources!inner(user_id)')
    .eq('id', itemId)
    .maybeSingle();

  if (itemError) {
    return Response.json({ error: itemError.message }, { status: 500 });
  }

  if (!item) {
    return Response.json({ error: 'Item not found' }, { status: 404 });
  }

  if (item.sources?.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  const existingSummary = metadata.ai_summary;

  if (!force && typeof existingSummary === 'string' && existingSummary.trim().length > 0) {
    return Response.json({ summary: existingSummary, cached: true });
  }

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('ai_settings')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const settings = (profile?.ai_settings ?? {}) as Record<string, unknown>;
  const userKey = typeof settings.geminiApiKey === 'string' ? settings.geminiApiKey.trim() : '';
  const envFallback = process.env.GEMINI_API_KEY?.trim() ?? '';
  const geminiApiKey = userKey || envFallback;

  if (!geminiApiKey) {
    return Response.json({ error: 'Missing Gemini API key' }, { status: 400 });
  }

  const snippet = item.summary ?? '';
  const title = item.title ?? 'Untitled item';

  let summaryText: string;
  try {
    summaryText = await generateSummary(geminiApiKey, title, snippet, item.url ?? null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return Response.json({ error: message }, { status: 502 });
  }

  const admin = getAdminSupabase();
  const nextMetadata = {
    ...metadata,
    ai_summary: summaryText,
    ai_summary_provider: 'gemini',
    ai_summary_model: GEMINI_MODEL,
    ai_summary_updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await (admin as any)
    .from('items')
    .update({ metadata: nextMetadata })
    .eq('id', itemId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ summary: summaryText, cached: false });
}
