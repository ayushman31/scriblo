"use client";

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export const useThemeWithDefault = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return { theme, setTheme };
};
