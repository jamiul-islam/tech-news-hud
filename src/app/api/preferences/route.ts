/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const Body = z.object({
  focusWeight: z.number().min(0).max(1).optional(),
  autoScrollIntervalMs: z.number().min(1000).max(60000).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  showAiSummaries: z.boolean().optional(),
  focusTopics: z.record(z.string(), z.number()).optional(),
});

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ preferences: null }, { status: 401 });

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('focus_tags, ai_settings')
    .eq('id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const ai = (data?.ai_settings ?? {}) as Record<string, unknown>;
  const focusTopicsRecord =
    ai.focusTopics && typeof ai.focusTopics === 'object' ? (ai.focusTopics as Record<string, number>) : {};

  const themeValue = ai.theme;
  const theme = themeValue === 'light' || themeValue === 'dark' || themeValue === 'system' ? themeValue : 'system';

  return Response.json({
    preferences: {
      focusWeight: typeof ai.focusWeight === 'number' ? (ai.focusWeight as number) : 0.7,
      autoScrollIntervalMs:
        typeof ai.autoScrollIntervalMs === 'number' ? (ai.autoScrollIntervalMs as number) : 7000,
      theme,
      showAiSummaries: ai.showAiSummaries === true,
      focusTopics: focusTopicsRecord,
    },
    focusTags: data?.focus_tags ?? [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const prefs = parsed.data;
  const focusTags = prefs.focusTopics ? Object.keys(prefs.focusTopics) : undefined;
  const aiSettings: Record<string, unknown> = {
    autoScrollIntervalMs: prefs.autoScrollIntervalMs,
    theme: prefs.theme,
    showAiSummaries: prefs.showAiSummaries,
    focusWeight: prefs.focusWeight,
    focusTopics: prefs.focusTopics ?? null,
  };

  const { error } = await (supabase as any)
    .from('profiles')
    .upsert(
      {
        id: user.id,
        focus_tags: focusTags,
        ai_settings: aiSettings,
      },
      { onConflict: 'id' },
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
