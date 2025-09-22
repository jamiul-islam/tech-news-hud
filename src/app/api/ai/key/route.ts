/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const SaveBody = z.object({
  provider: z.literal('gemini').optional(),
  apiKey: z.string().min(10),
});

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ hasGeminiKey: false }, { status: 401 });

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('ai_settings')
    .eq('id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const settings = (data?.ai_settings ?? {}) as Record<string, unknown>;
  const geminiKey = settings.geminiApiKey;
  const hasGeminiKey = typeof geminiKey === 'string' && geminiKey.length > 0;

  return Response.json({ hasGeminiKey });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const parsed = SaveBody.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = parsed.data.apiKey.trim();

  const { data: profileData, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('ai_settings')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const existing = (profileData?.ai_settings ?? {}) as Record<string, unknown>;
  const nextSettings = {
    ...existing,
    geminiApiKey: apiKey,
  };

  const { error } = await (supabase as any)
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ai_settings: nextSettings,
      },
      { onConflict: 'id' },
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profileData, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('ai_settings')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const existing = (profileData?.ai_settings ?? {}) as Record<string, unknown>;
  if (!('geminiApiKey' in existing)) {
    return Response.json({ success: true });
  }

  const nextSettings = { ...existing };
  delete nextSettings.geminiApiKey;

  const { error } = await (supabase as any)
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ai_settings: nextSettings,
      },
      { onConflict: 'id' },
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
