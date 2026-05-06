// ─── GROWTH LEDGER — THEME CONTEXT v4.0 ──────────────────────────────────────
// Themes: light | dark | amoled | gold
// Gold is premium — stored separately so we can gate it behind paywall later

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, SEMANTIC, SPACING, RADIUS, FONT, SHADOW, GOLD } from './Constants_theme';

const ThemeContext = createContext(null);
const THEME_KEY   = 'gl_theme_v4';

export const THEME_META = {
  light: { label: 'Light',  icon: '☀️',  isPremium: false },
  dark:  { label: 'Dark',   icon: '🌙',  isPremium: false },
  amoled:{ label: 'AMOLED', icon: '⚫',  isPremium: false },
  gold:  { label: 'Gold',   icon: '✨',  isPremium: true  },
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState('amoled');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved && THEMES[saved]) setThemeNameState(saved);
    });
  }, []);

  const setTheme = (name) => {
    if (!THEMES[name]) return;
    setThemeNameState(name);
    AsyncStorage.setItem(THEME_KEY, name).catch(() => {});
  };

  const themeColors = { ...THEMES[themeName], ...SEMANTIC };

  // Pre-built card style — automatically adapts to gold theme
  const cardStyle = {
    backgroundColor: themeColors.bgCard,
    borderRadius:    RADIUS.xl,
    borderWidth:     1,
    borderColor:     themeColors.border,
    ...(themeColors.isGold ? SHADOW.goldGlow : SHADOW.card),
  };

  // Input style
  const inputStyle = {
    backgroundColor: themeColors.bgInput,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     themeColors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm + 2,
    fontSize:        14,
    color:           themeColors.text,
    letterSpacing:   -0.1,
  };

  // Button style — uses theme accent
  const btnPrimary = {
    backgroundColor: themeColors.accent,
    borderRadius:    RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems:      'center',
    justifyContent:  'center',
    ...(themeColors.isGold ? SHADOW.fabGold : SHADOW.fab),
  };

  return (
    <ThemeContext.Provider value={{
      theme:      themeName,
      setTheme,
      colors:     themeColors,
      spacing:    SPACING,
      radius:     RADIUS,
      font:       FONT,
      shadow:     SHADOW,
      gold:       GOLD,
      cardStyle,
      inputStyle,
      btnPrimary,
      // Convenience
      isGold:     themeColors.isGold,
      isDark:     themeColors.isDark,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
