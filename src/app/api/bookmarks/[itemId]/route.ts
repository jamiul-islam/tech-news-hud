/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import type { NextRequest } from 'next/server';

const Params = z.object({ itemId: z.string().uuid() });

export async function DELETE(_: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const params = await context.params;
  const parsed = Params.safeParse(params);
  if (!parsed.success) return Response.json({ error: 'Invalid id' }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await (supabase as any)
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', parsed.data.itemId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
