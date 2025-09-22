'use client';

import { ReactNode, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { ToastViewport } from '@/components/ui/toast-viewport';

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
    const body = document.body;

    const applyMode = (mode: 'light' | 'dark') => {
      const isDark = mode === 'dark';
      root.classList.toggle('dark', isDark);
      root.style.setProperty('--background-light', isDark ? '#0b0b0b' : '#f8f8f8');
      root.style.setProperty('--foreground-light', isDark ? '#f8f8f8' : '#0f0f0f');
      body.style.backgroundColor = isDark ? '#0b0b0b' : '#f8f8f8';
      body.style.color = isDark ? '#f8f8f8' : '#0f0f0f';
      root.style.colorScheme = isDark ? 'dark' : 'light';
    };

    let mediaQuery: MediaQueryList | null = null;
    let listener: ((event: MediaQueryListEvent) => void) | null = null;

    if (theme === 'dark') {
      applyMode('dark');
    } else if (theme === 'light') {
      applyMode('light');
    } else {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyMode(mediaQuery.matches ? 'dark' : 'light');
      listener = (event: MediaQueryListEvent) => {
        applyMode(event.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
    }

    return () => {
      if (mediaQuery && listener) {
        mediaQuery.removeEventListener('change', listener);
      }
    };
  }, [theme]);

  return (
    <>
      <ToastViewport />
      {children}
    </>
  );
};
