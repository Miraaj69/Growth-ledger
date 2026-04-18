// theme.js — Single source of truth for all design tokens
export const C = {
  // Backgrounds
  bg:      '#080D1A',
  l1:      '#111827',
  l2:      '#1A2332',
  l3:      '#22304A',

  // Borders
  border:  'rgba(255,255,255,0.07)',
  borderHi:'rgba(255,255,255,0.14)',

  // Brand
  blue:    '#4F8CFF',
  blueG:   'rgba(79,140,255,0.25)',
  blueD:   'rgba(79,140,255,0.12)',

  // Semantic
  green:   '#22C55E',
  greenG:  'rgba(34,197,94,0.22)',
  greenD:  'rgba(34,197,94,0.10)',
  red:     '#EF4444',
  redG:    'rgba(239,68,68,0.22)',
  redD:    'rgba(239,68,68,0.10)',
  amber:   '#F59E0B',
  amberD:  'rgba(245,158,11,0.12)',
  purple:  '#A78BFA',
  purpleD: 'rgba(167,139,250,0.12)',
  teal:    '#14B8A6',
  tealD:   'rgba(20,184,166,0.12)',
  pink:    '#EC4899',

  // Text
  t1:      '#F1F5F9',
  t2:      '#94A3B8',
  t3:      '#475569',
  t4:      '#1E2D42',
};

export const S = { xs:4, sm:8, md:16, lg:24, xl:32 };
export const R = { sm:8, md:12, lg:16, xl:20, xxl:28 };

export const Sh = {
  card:  { shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:16, elevation:6 },
  blue:  { shadowColor:'#4F8CFF', shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:16, elevation:8 },
  green: { shadowColor:'#22C55E', shadowOffset:{width:0,height:4}, shadowOpacity:0.35,shadowRadius:14, elevation:7 },
  glow:  { shadowColor:'#4F8CFF', shadowOffset:{width:0,height:0}, shadowOpacity:0.6, shadowRadius:20, elevation:10 },
};

// Gradient presets
export const G = {
  hero:      ['#0b1f52','#1a3a82','#1e4fa0'],
  green:     ['#052e16','#064e30'],
  blue:      ['#0c1a4e','#1a3080'],
  dark:      ['#080D1A','#111827'],
  blueGreen: ['#4F8CFF','#22C55E'],
  purpleBlue:['#A78BFA','#4F8CFF'],
};
