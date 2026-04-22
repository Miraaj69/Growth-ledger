// theme.js v12 — Premium Design Tokens
// ► 8pt grid · 4-stop depth system · single blue accent · semantic palette
// ► All components must import from here — zero hardcoded values

// ══════════════════════════════════════════════════════════
// THEME SURFACES (bg → l1 → l2 → l3 = deepest → shallowest)
// ══════════════════════════════════════════════════════════

export const DARK = {
  mode: 'dark',
  bg:       '#080D1A',   // screen background
  l1:       '#111827',   // cards
  l2:       '#1A2332',   // elevated cards / inputs
  l3:       '#22304A',   // pressed state / tags
  border:   'rgba(255,255,255,0.07)',
  borderHi: 'rgba(255,255,255,0.14)',
  t1:       '#F1F5F9',   // headings
  t2:       '#94A3B8',   // subheadings
  t3:       '#475569',   // captions
  t4:       '#1E2D42',   // dividers / disabled
};

export const AMOLED = {
  mode: 'amoled',
  bg:       '#000000',
  l1:       '#0A0A0A',
  l2:       '#111111',
  l3:       '#1A1A1A',
  border:   'rgba(255,255,255,0.06)',
  borderHi: 'rgba(255,255,255,0.12)',
  t1:       '#FFFFFF',
  t2:       '#A0AEC0',
  t3:       '#4A5568',
  t4:       '#1A202C',
};

export const LIGHT = {
  mode: 'light',
  bg:       '#F1F5F9',
  l1:       '#FFFFFF',
  l2:       '#F8FAFC',
  l3:       '#E2E8F0',
  border:   'rgba(0,0,0,0.08)',
  borderHi: 'rgba(0,0,0,0.15)',
  t1:       '#0F172A',
  t2:       '#475569',
  t3:       '#94A3B8',
  t4:       '#CBD5E1',
};

// ══════════════════════════════════════════════════════════
// SEMANTIC COLORS — theme-invariant, meaningful usage only
// ══════════════════════════════════════════════════════════
export const SEMANTIC = {
  // Primary accent — blue (#4F8CFF)
  blue:    '#4F8CFF',
  blueG:   'rgba(79,140,255,0.22)',
  blueD:   'rgba(79,140,255,0.12)',
  blueXD:  'rgba(79,140,255,0.06)',

  // Success / income / profit
  green:   '#22C55E',
  greenG:  'rgba(34,197,94,0.20)',
  greenD:  'rgba(34,197,94,0.10)',

  // Danger / loss / over-budget
  red:     '#EF4444',
  redG:    'rgba(239,68,68,0.20)',
  redD:    'rgba(239,68,68,0.10)',

  // Warning / attention
  amber:   '#F59E0B',
  amberD:  'rgba(245,158,11,0.12)',

  // SIP / growth / wealth
  purple:  '#A78BFA',
  purpleD: 'rgba(167,139,250,0.12)',

  // Teal — balance / neutral positive
  teal:    '#14B8A6',
  tealD:   'rgba(20,184,166,0.12)',

  // Pink — debt-free / milestones
  pink:    '#EC4899',
};

// ══════════════════════════════════════════════════════════
// GRADIENTS
// ══════════════════════════════════════════════════════════
export const GRAD = {
  hero:       ['#0f2460', '#1a3a8c', '#2355c5', '#2e6be6'],
  heroShort:  ['#1a3a8c', '#2e6be6'],
  heroLight:  ['#EFF6FF', '#DBEAFE', '#BFDBFE'],
  green:      ['#052e16', '#064e30'],
  blue:       ['#0c1a4e', '#1a3080'],
  purpleBlue: ['#A78BFA', '#4F8CFF'],
  amber:      ['#78350f', '#b45309'],
};

// ══════════════════════════════════════════════════════════
// SPACING — strict 8pt grid
// ══════════════════════════════════════════════════════════
export const SPACING = {
  xs:  4,   //  4px — icon gaps, tiny margins
  sm:  8,   //  8px — compact padding
  md:  16,  // 16px — standard card padding, section gaps
  lg:  24,  // 24px — section margins
  xl:  32,  // 32px — hero sections
  xxl: 48,  // 48px — large separators
};

// ══════════════════════════════════════════════════════════
// RADIUS
// ══════════════════════════════════════════════════════════
export const RADIUS = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

// ══════════════════════════════════════════════════════════
// SHADOWS — layered depth system
// ══════════════════════════════════════════════════════════
export const SHADOW = {
  // Subtle lift for flat cards
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  // Standard card elevation
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  // Hero / prominent cards
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  // Colored glow shadows (pass shadowColor override)
  blue: {
    shadowColor: '#4F8CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
  green: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  amber: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ══════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE — matches 8pt grid baselines
// ══════════════════════════════════════════════════════════
export const TYPE = {
  // Display / hero numbers
  hero:    { fontSize: 40, fontWeight: '900', letterSpacing: -2,   lineHeight: 44 },
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },

  // Headings
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, lineHeight: 24 },
  h3: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1, lineHeight: 20 },

  // Body
  body:  { fontSize: 14, fontWeight: '400', lineHeight: 22 },
  bodyM: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  bodyB: { fontSize: 14, fontWeight: '700', lineHeight: 22 },

  // Small
  sm:  { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  smM: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  smB: { fontSize: 12, fontWeight: '700', lineHeight: 18 },

  // Caption / label
  xs:  { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  xsB: { fontSize: 10, fontWeight: '700', lineHeight: 14, letterSpacing: 0.3 },

  // Overline / eyebrow
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
};
