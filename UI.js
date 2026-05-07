// UI.js v12 — Premium Reusable Components
// ► Zero hardcoded colors · 8pt grid · Haptics on all interactions
// ► FIXED: Bar background now theme-aware (was dark-only hardcoded rgba)
// ► NEW: LoadingShimmer, ScoreLabel, SectionDivider added

import React, { useRef, memo, useCallback } from 'react';
import {
  View, Text, Pressable, TextInput,
  Animated, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as RD, SHADOW as SDW } from './theme';

// ── Haptic helpers ────────────────────────────────────────
const tap  = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);  } catch {} };
const tapM = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} };

// ── Press scale hook ──────────────────────────────────────
const usePress = (scaleVal = 0.974) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = useCallback(() =>
    Animated.spring(scale, { toValue: scaleVal, useNativeDriver: true, speed: 40, bounciness: 1 }).start(), []);
  const onOut = useCallback(() =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28 }).start(), []);
  return { scale, onIn, onOut };
};

// ══════════════════════════════════════════════════════════
// CARD — animated press scale + theme-aware surface
// ══════════════════════════════════════════════════════════
export const Card = memo(({ children, style, onPress, glow }) => {
  const { T } = useTheme();
  const { scale, onIn, onOut } = usePress();
  const inner = (
    <Animated.View style={[{
      backgroundColor: T.l1,
      borderRadius:    RD.xl,
      padding:         SP.md,
      borderWidth:     1,
      borderColor:     glow ? '#4F8CFF44' : T.border,
      ...SDW.card,
    }, style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
  return onPress ? (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      onPressIn={onIn}
      onPressOut={onOut}
    >
      {inner}
    </Pressable>
  ) : inner;
});

// ══════════════════════════════════════════════════════════
// GRADIENT CARD
// ══════════════════════════════════════════════════════════
export const GCard = memo(({ children, colors, style, onPress }) => {
  const { T } = useTheme();
  const { scale, onIn, onOut } = usePress();
  return (
    <Pressable
      onPress={() => { if (onPress) { tap(); onPress(); } }}
      onPressIn={onIn}
      onPressOut={onOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={colors || ['#0b1f52', '#1e4fa0']}
          style={[{
            borderRadius: RD.xl,
            padding:      SP.md,
            borderWidth:  1,
            borderColor:  T.border,
            ...SDW.card,
          }, style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

// ══════════════════════════════════════════════════════════
// CHIP — colored pill badge
// ══════════════════════════════════════════════════════════
export const Chip = memo(({ label, color, dot, sm }) => {
  const clr = color || '#4F8CFF';
  return (
    <View style={{
      flexDirection:    'row',
      alignItems:       'center',
      backgroundColor:  clr + '20',
      borderRadius:     99,
      paddingHorizontal: sm ? 8 : 11,
      paddingVertical:   sm ? 3 : 4,
      gap:              4,
    }}>
      {dot && (
        <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: clr }} />
      )}
      <Text style={{ color: clr, fontSize: sm ? 10 : 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// PROGRESS BAR
// FIX v12: Track background now theme-aware (was hardcoded dark rgba)
// ══════════════════════════════════════════════════════════
export const Bar = memo(({ value = 0, total = 0, color = '#4F8CFF', h = 5 }) => {
  const { T } = useTheme();
  const fill  = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;
  const w     = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(w, { toValue: fill, duration: 900, useNativeDriver: false }).start();
  }, [fill]);

  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  // Theme-aware track: dark themes → white 8% | light theme → black 8%
  const trackBg = T.mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={{ backgroundColor: trackBg, borderRadius: 99, height: h, overflow: 'hidden' }}>
      <Animated.View style={{
        width,
        height:      '100%',
        borderRadius: 99,
        backgroundColor: color,
        shadowColor:  color,
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation:    2,
      }} />
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// SECTION HEADER  (SH alias kept for back-compat)
// ══════════════════════════════════════════════════════════
export const SecHeader = memo(({ title, right, rightColor, onRight }) => {
  const { T } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm + 6 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1, letterSpacing: -0.1 }}>{title}</Text>
      {right && (
        <Pressable onPress={onRight}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: rightColor || '#4F8CFF' }}>{right}</Text>
        </Pressable>
      )}
    </View>
  );
});
export const SH = SecHeader; // back-compat alias

// ══════════════════════════════════════════════════════════
// SECTION DIVIDER — horizontal rule with optional label
// ══════════════════════════════════════════════════════════
export const SectionDivider = memo(({ label }) => {
  const { T } = useTheme();
  if (!label) {
    return <View style={{ height: 1, backgroundColor: T.border, marginVertical: SP.md }} />;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: SP.md, gap: SP.sm }}>
      <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: T.t3, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// PRIMARY BUTTON — gradient, loading state, haptics
// ══════════════════════════════════════════════════════════
export const Btn = memo(({ label, onPress, disabled, loading, color, style }) => {
  const { T } = useTheme();
  const { scale, onIn, onOut } = usePress(0.96);
  const gradColors = disabled
    ? [T.l2, T.l2]
    : color
    ? [color, color]
    : ['#2563EB', '#4F8CFF'];
  return (
    <Pressable
      onPress={() => { if (!disabled && !loading) { tapM(); onPress?.(); } }}
      onPressIn={onIn}
      onPressOut={onOut}
      disabled={disabled || loading}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={gradColors}
          style={[{
            borderRadius:    RD.lg,
            paddingVertical: SP.md,
            paddingHorizontal: SP.lg,
            alignItems:      'center',
            justifyContent:  'center',
            ...SDW.blue,
          }, style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ fontSize: 16, fontWeight: '700', color: disabled ? T.t3 : '#fff', letterSpacing: 0.1 }}>{label}</Text>
          }
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

// ══════════════════════════════════════════════════════════
// TEXT INPUT — theme-aware, label + prefix + suffix + error
// ══════════════════════════════════════════════════════════
export const Input = memo(({ label, value, onChange, placeholder, type = 'default', prefix, suffix, error, style }) => {
  const { T } = useTheme();
  return (
    <View style={[{
      backgroundColor:  T.l2,
      borderRadius:     RD.md,
      paddingHorizontal: SP.md,
      paddingVertical:   SP.sm + 4,
      borderWidth:      1,
      borderColor:      error ? '#EF4444' : T.border,
      marginBottom:     SP.sm + 2,
    }, style]}>
      {label && (
        <Text style={{
          fontSize: 10, fontWeight: '700', color: T.t3,
          letterSpacing: 0.6, marginBottom: 6,
          textTransform: 'uppercase',
        }}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{ fontSize: 22, fontWeight: '700', color: T.t3, marginRight: 6 }}>{prefix}</Text>
        )}
        <TextInput
          value={String(value ?? '')}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={T.t3}
          keyboardType={type}
          style={{ flex: 1, fontSize: 22, fontWeight: '700', color: T.t1 }}
        />
        {suffix && (
          <Text style={{ fontSize: 14, color: T.t3 }}>{suffix}</Text>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: '500' }}>{error}</Text>
      )}
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// TOGGLE — spring-animated pill switch
// ══════════════════════════════════════════════════════════
export const Toggle = memo(({ value, onChange }) => {
  const { T } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 35, bounciness: 3 }).start();
  }, [value]);

  const bg = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [T.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)', '#4F8CFF'],
  });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <Pressable onPress={() => { tap(); onChange?.(); }}>
      <Animated.View style={{
        width: 48, height: 28, borderRadius: 99,
        backgroundColor: bg,
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}>
        <Animated.View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: '#fff',
          transform: [{ translateX: tx }],
          shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
        }} />
      </Animated.View>
    </Pressable>
  );
});

// ══════════════════════════════════════════════════════════
// EMPTY STATE — icon + title + subtitle + optional CTA
// ══════════════════════════════════════════════════════════
export const Empty = memo(({ icon = '📭', title, sub, cta, onCta }) => {
  const { T } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: SP.xl, paddingHorizontal: SP.lg }}>
      <Text style={{ fontSize: 48, marginBottom: SP.md }}>{icon}</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: T.t1, marginBottom: 6, textAlign: 'center' }}>{title}</Text>
      {sub && (
        <Text style={{ fontSize: 13, color: T.t2, textAlign: 'center', lineHeight: 20 }}>{sub}</Text>
      )}
      {cta && (
        <View style={{ marginTop: SP.md, width: '100%' }}>
          <Btn label={cta} onPress={onCta} />
        </View>
      )}
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// STAT ROW — key/value pair with optional separator
// ══════════════════════════════════════════════════════════
export const StatRow = memo(({ label, value, color, last }) => {
  const { T } = useTheme();
  return (
    <View style={[{
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 11,
    }, !last && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
      <Text style={{ fontSize: 13, color: T.t2, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: color || T.t1 }}>{value}</Text>
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// ALERT ROW — colored alert pill
// ══════════════════════════════════════════════════════════
export const AlertRow = memo(({ icon, msg, color, last }) => (
  <View style={{
    flexDirection: 'row', gap: 9, padding: 11,
    borderRadius: 12, borderWidth: 1,
    backgroundColor: color + '10',
    borderColor:     color + '28',
    alignItems: 'flex-start',
    marginBottom: last ? 0 : 8,
  }}>
    <Text style={{ fontSize: 14, lineHeight: 18 }}>{icon}</Text>
    <Text style={{ fontSize: 12, lineHeight: 18, flex: 1, color, fontWeight: '500' }}>{msg}</Text>
  </View>
));

// ══════════════════════════════════════════════════════════
// MONTH PICKER — prev / label / next
// ══════════════════════════════════════════════════════════
export const MonthPicker = memo(({ month, year, onChange }) => {
  const { T } = useTheme();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now   = new Date();
  const isCur = month === now.getMonth() && year === now.getFullYear();
  const prev  = () => month === 0 ? onChange(11, year - 1) : onChange(month - 1, year);
  const next  = () => { if (isCur) return; month === 11 ? onChange(0, year + 1) : onChange(month + 1, year); };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable
        onPress={prev}
        style={{ width: 30, height: 30, borderRadius: RD.sm, backgroundColor: T.l2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border }}
      >
        <Text style={{ fontSize: 18, color: T.t2, lineHeight: 24 }}>‹</Text>
      </Pressable>

      <View style={{ alignItems: 'center', minWidth: 72, gap: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: T.t1 }}>{MONTHS[month]} {year}</Text>
        {isCur && <Chip label="Now" color="#22C55E" dot sm />}
      </View>

      <Pressable
        onPress={next}
        style={{ width: 30, height: 30, borderRadius: RD.sm, backgroundColor: T.l2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border, opacity: isCur ? 0.3 : 1 }}
      >
        <Text style={{ fontSize: 18, color: T.t2, lineHeight: 24 }}>›</Text>
      </Pressable>
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// FAB — floating action button with expandable menu
// ══════════════════════════════════════════════════════════
export const FAB = memo(({ actions }) => {
  const [open, setOpen] = React.useState(false);
  const rot  = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(0)).current;
  const tY   = useRef(new Animated.Value(20)).current;

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    tapM();
    Animated.parallel([
      Animated.spring(rot,  { toValue: next ? 1 : 0, useNativeDriver: true,  speed: 25 }),
      Animated.spring(opac, { toValue: next ? 1 : 0, useNativeDriver: true,  speed: 20 }),
      Animated.spring(tY,   { toValue: next ? 0 : 20, useNativeDriver: true, speed: 20 }),
    ]).start();
  }, [open]);

  const rotation = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={{ position: 'absolute', bottom: SP.lg + 4, right: SP.md, alignItems: 'flex-end', zIndex: 200 }}>
      {open && (
        <Animated.View style={{ marginBottom: SP.sm, gap: SP.sm, alignItems: 'flex-end', opacity: opac, transform: [{ translateY: tY }] }}>
          {[...actions].reverse().map((a, i) => (
            <Pressable
              key={i}
              onPress={() => { a.action?.(); setOpen(false); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: SP.sm,
                paddingHorizontal: SP.md, paddingVertical: 11,
                borderRadius: 99, backgroundColor: a.color || '#4F8CFF',
                shadowColor: a.color || '#4F8CFF',
                shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
              }}
            >
              <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
      <Pressable onPress={toggle}>
        <LinearGradient
          colors={['#2563EB', '#4F8CFF']}
          style={{
            width: 56, height: 56, borderRadius: RD.lg + 2,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#4F8CFF', shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.Text style={{ fontSize: 30, color: '#fff', lineHeight: 36, transform: [{ rotate: rotation }] }}>
            +
          </Animated.Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// LOADING SHIMMER — skeleton placeholder
// NEW in v12
// ══════════════════════════════════════════════════════════
export const Shimmer = memo(({ width = '100%', height = 16, radius = 8, style }) => {
  const { T } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View style={[{
      width, height,
      borderRadius: radius,
      backgroundColor: T.l3,
      opacity,
    }, style]} />
  );
});
