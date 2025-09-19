/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const PostBody = z.object({ itemId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));
  const parsed = PostBody.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { error, data } = await (supabase as any)
    .from('bookmarks')
    .insert({ user_id: user.id, item_id: parsed.data.itemId })
    .select('id')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id }, { status: 201 });
}
