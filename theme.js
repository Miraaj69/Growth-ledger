
// All design tokens. Components NEVER use hardcoded colors.

export const DARK = {
  mode: 'dark',
  bg:       '#080D1A',
  l1:       '#111827',
  l2:       '#1A2332',
  l3:       '#22304A',
  border:   'rgba(255,255,255,0.07)',
  borderHi: 'rgba(255,255,255,0.14)',
  t1:       '#F1F5F9',
  t2:       '#94A3B8',
  t3:       '#475569',
  t4:       '#1E2D42',
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

// Semantic colors — same across all themes
export const SEMANTIC = {
  blue:    '#4F8CFF',
  blueG:   'rgba(79,140,255,0.22)',
  blueD:   'rgba(79,140,255,0.12)',
  green:   '#22C55E',
  greenG:  'rgba(34,197,94,0.20)',
  greenD:  'rgba(34,197,94,0.10)',
  red:     '#EF4444',
  redG:    'rgba(239,68,68,0.20)',
  redD:    'rgba(239,68,68,0.10)',
  amber:   '#F59E0B',
  amberD:  'rgba(245,158,11,0.12)',
  purple:  '#A78BFA',
  purpleD: 'rgba(167,139,250,0.12)',
  teal:    '#14B8A6',
  tealD:   'rgba(20,184,166,0.12)',
  pink:    '#EC4899',
};

// Gradients
export const GRAD = {
  hero:      ['#0b1f52', '#1a3a82', '#1e4fa0'],
  heroLight: ['#EFF6FF', '#DBEAFE', '#BFDBFE'],
  green:     ['#052e16', '#064e30'],
  blue:      ['#0c1a4e', '#1a3080'],
  purpleBlue:['#A78BFA', '#4F8CFF'],
};

export const SPACING = { xs:4, sm:8, md:16, lg:24, xl:32 };
export const RADIUS  = { sm:8, md:12, lg:16, xl:20, xxl:28 };
export const SHADOW  = {
  card:  { shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:12, elevation:5 },
  blue:  { shadowColor:'#4F8CFF', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:14, elevation:7 },
  green: { shadowColor:'#22C55E', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:12, elevation:6 },
};
