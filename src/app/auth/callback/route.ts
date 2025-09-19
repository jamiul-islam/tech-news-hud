import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/hud';
  if (!code) return redirect('/auth');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirect('/auth');
  redirect(next);
}

