// ─── SAFEXA PREMIUM DESIGN SYSTEM v3.0 ──────────────────────────────────────
// Philosophy: Surgical precision. One accent. Three states. Zero noise.
// Inspired by: Linear, Raycast, Apple Health, Groww

export const THEMES = {
  dark: {
    bg:            '#080C14',
    bgDeep:        '#050709',
    bgElevated:    '#0D1220',
    bgCard:        'rgba(255,255,255,0.035)',
    bgCardHover:   'rgba(255,255,255,0.06)',
    bgCardActive:  'rgba(255,255,255,0.08)',
    bgSection:     'rgba(255,255,255,0.025)',
    bgInput:       'rgba(255,255,255,0.05)',
    border:        'rgba(255,255,255,0.07)',
    borderMid:     'rgba(255,255,255,0.10)',
    borderStrong:  'rgba(255,255,255,0.16)',
    text:          '#EDF2FF',
    textSub:       'rgba(237,242,255,0.55)',
    textMuted:     'rgba(237,242,255,0.25)',
    textDisabled:  'rgba(237,242,255,0.15)',
    tabBar:        '#0A0E1A',
    tabBarBorder:  'rgba(255,255,255,0.06)',
    sheet:         '#0F1522',
    sheetHandle:   'rgba(255,255,255,0.12)',
    overlay:       'rgba(2,4,12,0.80)',
    scrim:         'rgba(0,0,0,0.60)',
    isDark:        true,
  },
  light: {
    bg:            '#F4F7FC',
    bgDeep:        '#EAEEF6',
    bgElevated:    '#FFFFFF',
    bgCard:        '#FFFFFF',
    bgCardHover:   '#F7F9FD',
    bgCardActive:  '#EEF2FA',
    bgSection:     '#FFFFFF',
    bgInput:       '#F1F5FB',
    border:        '#E4E9F2',
    borderMid:     '#D8DFF0',
    borderStrong:  '#C8D0E8',
    text:          '#0D1526',
    textSub:       'rgba(13,21,38,0.56)',
    textMuted:     'rgba(13,21,38,0.32)',
    textDisabled:  'rgba(13,21,38,0.18)',
    tabBar:        '#FFFFFF',
    tabBarBorder:  '#E4E9F2',
    sheet:         '#FFFFFF',
    sheetHandle:   '#D0D8EC',
    overlay:       'rgba(10,18,40,0.50)',
    scrim:         'rgba(0,0,0,0.30)',
    isDark:        false,
  },
  amoled: {
    bg:            '#000000',
    bgDeep:        '#000000',
    bgElevated:    '#060606',
    bgCard:        '#0C0C0C',
    bgCardHover:   '#121212',
    bgCardActive:  '#181818',
    bgSection:     '#080808',
    bgInput:       '#111111',
    border:        'rgba(255,255,255,0.05)',
    borderMid:     'rgba(255,255,255,0.08)',
    borderStrong:  'rgba(255,255,255,0.12)',
    text:          '#F0F4FF',
    textSub:       'rgba(240,244,255,0.55)',
    textMuted:     'rgba(240,244,255,0.25)',
    textDisabled:  'rgba(240,244,255,0.12)',
    tabBar:        '#000000',
    tabBarBorder:  'rgba(255,255,255,0.05)',
    sheet:         '#0A0A0A',
    sheetHandle:   'rgba(255,255,255,0.10)',
    overlay:       'rgba(0,0,0,0.88)',
    scrim:         'rgba(0,0,0,0.70)',
    isDark:        true,
  },
};

// ─── SEMANTIC COLORS ─────────────────────────────────────────────────────────
// Single accent: Electric Blue. Three states: Green / Amber / Red.
// These never change between themes — they ARE the language.

export const SEMANTIC = {
  // Primary accent — electric blue
  primary:       '#4F7CFF',
  primaryDim:    'rgba(79,124,255,0.12)',
  primaryMid:    'rgba(79,124,255,0.20)',
  primaryGlow:   'rgba(79,124,255,0.28)',
  primaryText:   '#7EA8FF',  // slightly lighter for text on dark

  // Success — emerald
  success:       '#22C55E',
  successDim:    'rgba(34,197,94,0.12)',
  successMid:    'rgba(34,197,94,0.20)',
  successText:   '#4ADE80',

  // Warning — amber
  warning:       '#F59E0B',
  warningDim:    'rgba(245,158,11,0.12)',
  warningMid:    'rgba(245,158,11,0.20)',
  warningText:   '#FBBf24',

  // Danger — coral red
  danger:        '#EF4444',
  dangerDim:     'rgba(239,68,68,0.12)',
  dangerMid:     'rgba(239,68,68,0.20)',
  dangerText:    '#F87171',
};

// ─── TYPOGRAPHY SCALE ────────────────────────────────────────────────────────
export const TYPE = {
  // Display — Hero numbers, giant compliance %
  display:    { fontSize: 56, fontWeight: '800', letterSpacing: -2.5, lineHeight: 62 },
  displayMd:  { fontSize: 40, fontWeight: '800', letterSpacing: -1.8, lineHeight: 46 },
  displaySm:  { fontSize: 32, fontWeight: '700', letterSpacing: -1.2, lineHeight: 38 },

  // Headings
  h1:         { fontSize: 26, fontWeight: '700', letterSpacing: -0.6, lineHeight: 34 },
  h2:         { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 },
  h3:         { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, lineHeight: 24 },

  // Body
  bodyLg:     { fontSize: 15, fontWeight: '400', letterSpacing: -0.1, lineHeight: 24 },
  body:       { fontSize: 14, fontWeight: '400', letterSpacing: 0,    lineHeight: 22 },
  bodySm:     { fontSize: 13, fontWeight: '400', letterSpacing: 0,    lineHeight: 20 },

  // UI Labels
  label:      { fontSize: 12, fontWeight: '500', letterSpacing: 0.1,  lineHeight: 18 },
  labelSm:    { fontSize: 11, fontWeight: '500', letterSpacing: 0.2,  lineHeight: 16 },
  labelXs:    { fontSize: 10, fontWeight: '600', letterSpacing: 0.5,  lineHeight: 14 },

  // Numbers — tabular
  numLg:      { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, lineHeight: 36 },
  num:        { fontSize: 22, fontWeight: '700', letterSpacing: -0.6, lineHeight: 30 },
  numSm:      { fontSize: 16, fontWeight: '600', letterSpacing: -0.3, lineHeight: 22 },
};

// ─── FONT WEIGHTS (for StyleSheet) ───────────────────────────────────────────
export const FONT = {
  light:     '300',
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
  black:     '900',
};

// ─── SPACING — strict 4pt base, 8pt grid ─────────────────────────────────────
export const SPACING = {
  px:  1,
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  '3xl': 40,
  '4xl': 48,
};

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────
export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
};

// ─── SHADOWS ─────────────────────────────────────────────────────────────────
// Minimal, directional shadows — no neon glow blobs
export const SHADOW = {
  // Subtle card lift
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius:  6,
    elevation:     3,
  },
  // Medium elevation — modals, sheets
  elevated: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius:  16,
    elevation:     8,
  },
  // Only FAB gets color glow — intentional, premium
  fab: {
    shadowColor:   '#4F7CFF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  14,
    elevation:     10,
  },
  // Compliance ring / hero element — soft glow
  heroGlow: {
    shadowColor:   '#4F7CFF',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius:  20,
    elevation:     6,
  },
};

// ─── BACKWARD COMPAT COLORS ALIAS ────────────────────────────────────────────
export const COLORS = {
  ...THEMES.dark,
  ...SEMANTIC,
};
