'use client';

import { ReactNode, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

type Props = {
  children: ReactNode;
};

export const AppProviders = ({ children }: Props) => {
  const theme = useAppStore((state) => state.preferences.theme);
  const setSession = useAppStore((state) => state.setSession);
  const resetSession = useAppStore((state) => state.resetSession);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession({
          status: 'success',
          userId: session.user.id,
          email: session.user.email ?? undefined,
        });
      } else {
        resetSession();
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession({
          status: 'success',
          userId: session.user.id,
          email: session.user.email ?? undefined,
        });
      } else {
        resetSession();
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [resetSession, setSession]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return <>{children}</>;
};
