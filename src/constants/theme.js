// src/constants/theme.js
export const Colors = {
  bg:          '#080D1A',
  layer1:      '#111827',
  layer2:      '#1A2332',
  layer3:      '#22304A',
  border:      'rgba(255,255,255,0.07)',
  borderHi:    'rgba(255,255,255,0.13)',

  blue:        '#3B82F6',
  blueGlow:    'rgba(59,130,246,0.28)',
  blueDim:     'rgba(59,130,246,0.13)',
  green:       '#22C55E',
  greenGlow:   'rgba(34,197,94,0.22)',
  greenDim:    'rgba(34,197,94,0.09)',
  amber:       '#F59E0B',
  amberDim:    'rgba(245,158,11,0.12)',
  red:         '#F43F5E',
  redDim:      'rgba(244,63,94,0.12)',
  purple:      '#A78BFA',
  purpleDim:   'rgba(167,139,250,0.12)',
  teal:        '#14B8A6',
  tealDim:     'rgba(20,184,166,0.12)',
  pink:        '#EC4899',
  pinkDim:     'rgba(236,72,153,0.12)',

  t1:          '#F1F5F9',
  t2:          '#94A3B8',
  t3:          '#475569',
  t4:          '#1E2D42',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

export const Typography = {
  hero:    { fontFamily: 'Syne_800ExtraBold', fontSize: 38, color: Colors.t1 },
  h1:      { fontFamily: 'Syne_700Bold',      fontSize: 28, color: Colors.t1 },
  h2:      { fontFamily: 'Syne_700Bold',      fontSize: 22, color: Colors.t1 },
  h3:      { fontFamily: 'Syne_700Bold',      fontSize: 16, color: Colors.t1 },
  h4:      { fontFamily: 'Syne_600SemiBold',  fontSize: 14, color: Colors.t1 },
  body:    { fontFamily: 'DMSans_400Regular',  fontSize: 14, color: Colors.t2 },
  bodyMd:  { fontFamily: 'DMSans_500Medium',   fontSize: 14, color: Colors.t2 },
  bodySm:  { fontFamily: 'DMSans_400Regular',  fontSize: 12, color: Colors.t3 },
  label:   { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: Colors.t3, letterSpacing: 0.6 },
  num:     { fontFamily: 'Syne_800ExtraBold',  fontSize: 24, color: Colors.t1 },
  numLg:   { fontFamily: 'Syne_800ExtraBold',  fontSize: 36, color: Colors.t1 },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 12,
  },
  blue: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  green: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
};
