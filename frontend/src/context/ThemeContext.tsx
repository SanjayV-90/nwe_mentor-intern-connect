import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'dark',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;

    root.removeAttribute('data-theme');
    root.classList.remove('light', 'dark');

    let systemTheme = 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      systemTheme = 'light';
    }

    const appliedTheme = theme === 'system' ? systemTheme : theme;
    setActualTheme(appliedTheme as 'light' | 'dark');

    root.setAttribute('data-theme', appliedTheme);
    root.classList.add(appliedTheme);
  }, [theme]);

  // Listen to system theme changes if set to system
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.removeAttribute('data-theme');
      root.classList.remove('light', 'dark');
      
      const systemTheme = mediaQuery.matches ? 'light' : 'dark';
      setActualTheme(systemTheme);
      root.setAttribute('data-theme', systemTheme);
      root.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
