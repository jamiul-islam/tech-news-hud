import { HudRoot } from '@/components/hud/hud-root';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';

export default async function HudPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth');
  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#0F0F0F] dark:bg-[#0b0b0b] dark:text-[#F8F8F8]">
      <HudRoot />
    </div>
  );
}
