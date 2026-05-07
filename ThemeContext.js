import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK, AMOLED, LIGHT, GOLDEN, SEMANTIC } from './theme';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'growth_ledger_theme_v1';

const THEMES = { dark: DARK, amoled: AMOLED, light: LIGHT, golden: GOLDEN };

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [loaded, setLoaded] = useState(false);

  // Load saved theme on startup
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved && THEMES[saved]) setMode(saved);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const cycleTheme = useCallback(() => {
    setMode(curr => {
      const order = ['dark', 'amoled', 'light', 'golden'];
      const next = order[(order.indexOf(curr) + 1) % order.length];
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setTheme = useCallback((m) => {
    if (!THEMES[m]) return;
    setMode(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    mode,
    T: { ...THEMES[mode], ...SEMANTIC },
    cycleTheme,
    setTheme,
    loaded,
  }), [mode, cycleTheme, setTheme, loaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
