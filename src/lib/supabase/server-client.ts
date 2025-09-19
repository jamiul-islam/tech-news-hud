import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const getSupabaseServerClient = async (): Promise<SupabaseClient<Database>> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing on the server.');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if ('set' in cookieStore) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              (cookieStore as unknown as { set: (args: { name: string; value: string; options?: Record<string, unknown> }) => void }).set({ name, value, ...options });
            } catch (error) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Failed to set Supabase cookie in this context', error);
              }
            }
          });
        }
      },
    },
  });
};
