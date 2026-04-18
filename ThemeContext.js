
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { DARK, AMOLED, LIGHT, SEMANTIC } from './theme';

const ThemeContext = createContext(null);

const THEMES = { dark: DARK, amoled: AMOLED, light: LIGHT };

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');

  const cycleTheme = useCallback(() => {
    setMode(curr => curr === 'dark' ? 'amoled' : curr === 'amoled' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((m) => {
    if (THEMES[m]) setMode(m);
  }, []);

  const value = useMemo(() => ({
    mode,
    T: { ...THEMES[mode], ...SEMANTIC },   // T = full token set
    cycleTheme,
    setTheme,
  }), [mode, cycleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
