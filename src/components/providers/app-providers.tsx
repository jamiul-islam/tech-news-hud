'use client';

import { ReactNode, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

type Props = {
  children: ReactNode;
};

export const AppProviders = ({ children }: Props) => {
  const theme = useAppStore((state) => state.preferences.theme);

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
