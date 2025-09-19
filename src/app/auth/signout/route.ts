import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export async function POST() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function GET() {
  return POST();
}

