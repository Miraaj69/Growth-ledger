// ─── GROWTH LEDGER DESIGN SYSTEM v4.0 ────────────────────────────────────────
// Themes: light | dark | amoled | gold (premium)
// Fonts: Syne (display/headings) + DM Mono (numbers)

import {
  useFonts,
  Syne_400Regular, Syne_500Medium, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMMono_300Light, DMMono_400Regular, DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';

export function useGLFonts() {
  return useFonts({
    'Syne-Regular':   Syne_400Regular,
    'Syne-Medium':    Syne_500Medium,
    'Syne-SemiBold':  Syne_600SemiBold,
    'Syne-Bold':      Syne_700Bold,
    'Syne-ExtraBold': Syne_800ExtraBold,
    'DMMono-Light':   DMMono_300Light,
    'DMMono-Regular': DMMono_400Regular,
    'DMMono-Medium':  DMMono_500Medium,
  });
}

export const FF = {
  display:    'Syne-ExtraBold',
  heading:    'Syne-Bold',
  subheading: 'Syne-SemiBold',
  ui:         'Syne-Medium',
  body:       'Syne-Regular',
  numBold:    'DMMono-Medium',
  num:        'DMMono-Regular',
  numLight:   'DMMono-Light',
};

export const THEMES = {
  light: {
    bg: '#F4F7FC', bgDeep: '#EAEEF6', bgElevated: '#FFFFFF',
    bgCard: '#FFFFFF', bgCardHover: '#F7F9FD', bgCardActive: '#EEF2FA',
    bgSection: '#FFFFFF', bgInput: '#F1F5FB',
    border: '#E4E9F2', borderMid: '#D8DFF0', borderStrong: '#C8D0E8',
    text: '#0D1526', textSub: 'rgba(13,21,38,0.56)',
    textMuted: 'rgba(13,21,38,0.36)', textDisabled: 'rgba(13,21,38,0.18)',
    tabBar: '#FFFFFF', tabBarBorder: '#E4E9F2',
    sheet: '#FFFFFF', sheetHandle: '#D0D8EC',
    overlay: 'rgba(10,18,40,0.50)', scrim: 'rgba(0,0,0,0.30)',
    accent: '#4F7CFF', accentText: '#4F7CFF',
    accentDim: 'rgba(79,124,255,0.10)', accentMid: 'rgba(79,124,255,0.18)',
    streakBg: 'rgba(79,124,255,0.10)', streakBorder: 'rgba(79,124,255,0.20)',
    earnedCardBg: '#FFFFFF', earnedCardBorder: '#E4E9F2',
    dashTitle: '#0D1526',
    isDark: false, isGold: false,
  },
  dark: {
    bg: '#080C14', bgDeep: '#050709', bgElevated: '#0D1220',
    bgCard: 'rgba(255,255,255,0.04)', bgCardHover: 'rgba(255,255,255,0.07)',
    bgCardActive: 'rgba(255,255,255,0.09)', bgSection: 'rgba(255,255,255,0.025)',
    bgInput: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.07)', borderMid: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.16)',
    text: '#EDF2FF', textSub: 'rgba(237,242,255,0.55)',
    textMuted: 'rgba(237,242,255,0.28)', textDisabled: 'rgba(237,242,255,0.15)',
    tabBar: '#0A0E1A', tabBarBorder: 'rgba(255,255,255,0.06)',
    sheet: '#0F1522', sheetHandle: 'rgba(255,255,255,0.12)',
    overlay: 'rgba(2,4,12,0.80)', scrim: 'rgba(0,0,0,0.60)',
    accent: '#4F7CFF', accentText: '#7EA8FF',
    accentDim: 'rgba(79,124,255,0.12)', accentMid: 'rgba(79,124,255,0.20)',
    streakBg: 'rgba(79,124,255,0.12)', streakBorder: 'rgba(79,124,255,0.22)',
    earnedCardBg: 'rgba(255,255,255,0.04)', earnedCardBorder: 'rgba(255,255,255,0.07)',
    dashTitle: '#EDF2FF',
    isDark: true, isGold: false,
  },
  amoled: {
    bg: '#000000', bgDeep: '#000000', bgElevated: '#060606',
    bgCard: '#0C0C0C', bgCardHover: '#121212', bgCardActive: '#181818',
    bgSection: '#080808', bgInput: '#111111',
    border: 'rgba(255,255,255,0.05)', borderMid: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.13)',
    text: '#F0F4FF', textSub: 'rgba(240,244,255,0.55)',
    textMuted: 'rgba(240,244,255,0.28)', textDisabled: 'rgba(240,244,255,0.12)',
    tabBar: '#000000', tabBarBorder: 'rgba(255,255,255,0.05)',
    sheet: '#0A0A0A', sheetHandle: 'rgba(255,255,255,0.10)',
    overlay: 'rgba(0,0,0,0.88)', scrim: 'rgba(0,0,0,0.70)',
    accent: '#4F7CFF', accentText: '#7EA8FF',
    accentDim: 'rgba(79,124,255,0.12)', accentMid: 'rgba(79,124,255,0.20)',
    streakBg: 'rgba(79,124,255,0.12)', streakBorder: 'rgba(79,124,255,0.22)',
    earnedCardBg: '#0C0C0C', earnedCardBorder: 'rgba(255,255,255,0.05)',
    dashTitle: '#F0F4FF',
    isDark: true, isGold: false,
  },
  gold: {
    bg: '#0A0900', bgDeep: '#070600', bgElevated: '#121000',
    bgCard: '#131100', bgCardHover: '#1A1700', bgCardActive: '#221E00',
    bgSection: '#0F0D00', bgInput: '#181500',
    border: 'rgba(212,160,23,0.14)', borderMid: 'rgba(212,160,23,0.22)',
    borderStrong: 'rgba(212,160,23,0.40)',
    text: '#FFF8E7', textSub: 'rgba(255,248,231,0.60)',
    textMuted: 'rgba(255,248,231,0.35)', textDisabled: 'rgba(255,248,231,0.15)',
    tabBar: '#080700', tabBarBorder: 'rgba(212,160,23,0.14)',
    sheet: '#0F0D00', sheetHandle: 'rgba(212,160,23,0.22)',
    overlay: 'rgba(5,4,0,0.88)', scrim: 'rgba(0,0,0,0.75)',
    accent: '#D4A017', accentText: '#FFE066',
    accentDim: 'rgba(212,160,23,0.12)', accentMid: 'rgba(212,160,23,0.22)',
    streakBg: 'rgba(212,160,23,0.14)', streakBorder: 'rgba(212,160,23,0.30)',
    earnedCardBg: '#131100', earnedCardBorder: 'rgba(212,160,23,0.22)',
    dashTitle: '#D4A017',
    isDark: true, isGold: true,
  },
};

export const SEMANTIC = {
  primary: '#4F7CFF', primaryDim: 'rgba(79,124,255,0.12)',
  primaryMid: 'rgba(79,124,255,0.20)', primaryGlow: 'rgba(79,124,255,0.28)',
  primaryText: '#7EA8FF',
  success: '#22C55E', successDim: 'rgba(34,197,94,0.12)',
  successMid: 'rgba(34,197,94,0.20)', successText: '#4ADE80',
  warning: '#F59E0B', warningDim: 'rgba(245,158,11,0.12)',
  warningMid: 'rgba(245,158,11,0.20)', warningText: '#FBBF24',
  danger: '#EF4444', dangerDim: 'rgba(239,68,68,0.12)',
  dangerMid: 'rgba(239,68,68,0.20)', dangerText: '#F87171',
};

export const GOLD = {
  50: '#FFF8E7', 100: '#FFEDB3', 200: '#FFE066',
  main: '#D4A017', dark: '#C8900A', deep: '#8B6000', 900: '#7A5800',
  dim: 'rgba(212,160,23,0.12)', mid: 'rgba(212,160,23,0.22)',
  glow: 'rgba(212,160,23,0.40)', border: 'rgba(200,144,10,0.35)',
  borderStrong: 'rgba(200,144,10,0.60)',
};

export const TYPE = {
  display:   { fontSize: 56, fontWeight: '800', letterSpacing: -2.5, lineHeight: 64 },
  displayMd: { fontSize: 40, fontWeight: '800', letterSpacing: -1.8, lineHeight: 48 },
  displaySm: { fontSize: 32, fontWeight: '700', letterSpacing: -1.2, lineHeight: 40 },
  h1:        { fontSize: 26, fontWeight: '700', letterSpacing: -0.6, lineHeight: 34 },
  h2:        { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 },
  h3:        { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, lineHeight: 24 },
  bodyLg:    { fontSize: 15, fontWeight: '400', letterSpacing: -0.1, lineHeight: 24 },
  body:      { fontSize: 14, fontWeight: '400', letterSpacing: 0,    lineHeight: 22 },
  bodySm:    { fontSize: 13, fontWeight: '400', letterSpacing: 0,    lineHeight: 20 },
  label:     { fontSize: 12, fontWeight: '500', letterSpacing: 0.8,  lineHeight: 18 },
  labelSm:   { fontSize: 11, fontWeight: '500', letterSpacing: 1.2,  lineHeight: 16 },
  labelXs:   { fontSize: 10, fontWeight: '600', letterSpacing: 1.5,  lineHeight: 14 },
  numXl:     { fontSize: 44, fontWeight: '500', letterSpacing: -1.5, lineHeight: 52 },
  numLg:     { fontSize: 28, fontWeight: '500', letterSpacing: -0.8, lineHeight: 36 },
  num:       { fontSize: 22, fontWeight: '400', letterSpacing: -0.5, lineHeight: 30 },
  numSm:     { fontSize: 16, fontWeight: '400', letterSpacing: -0.2, lineHeight: 22 },
  numXs:     { fontSize: 13, fontWeight: '400', letterSpacing: 0,    lineHeight: 18 },
};

export const FONT = {
  light: '300', regular: '400', medium: '500',
  semibold: '600', bold: '700', extrabold: '800', black: '900',
};

export const SPACING = {
  px: 1, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, '3xl': 40, '4xl': 48, '5xl': 64,
};

export const RADIUS = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, '3xl': 32, full: 999,
};

export const SHADOW = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
  elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 16, elevation: 8 },
  fab: { shadowColor: '#4F7CFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10 },
  fabGold: { shadowColor: '#D4A017', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 },
  heroGlow: { shadowColor: '#4F7CFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.22, shadowRadius: 20, elevation: 6 },
  goldGlow: { shadowColor: '#D4A017', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.50, shadowRadius: 24, elevation: 12 },
  goldGlowStrong: { shadowColor: '#D4A017', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.80, shadowRadius: 40, elevation: 20 },
};

export const ANIM = {
  instant: 100, fast: 200, normal: 300, slow: 500, verySlow: 800,
  springSnappy: { tension: 120, friction: 8 },
  springNormal: { tension: 70,  friction: 7 },
  springBouncy: { tension: 60,  friction: 6 },
  springGentle: { tension: 40,  friction: 8 },
};

export const COLORS = { ...THEMES.dark, ...SEMANTIC };
