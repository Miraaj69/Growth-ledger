// src/components/UIComponents.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Typography, Shadows } from '../constants/theme';

// ─── CARD ─────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 20 }).start();

  const card = (
    <Animated.View style={[styles.card, { transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );

  return onPress ? (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {card}
    </Pressable>
  ) : card;
};

// ─── GRADIENT CARD ─────────────────────────────────────────────────
export const GradientCard = ({ children, colors, style, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 20 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={colors || ['#0b1f52', '#1a3a82', '#1e4fa0']} style={[styles.card, style]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ─── CHIP / BADGE ─────────────────────────────────────────────────
export const Chip = ({ label, color = Colors.blue, dot = false, size = 'sm' }) => (
  <View style={[styles.chip, { backgroundColor: color + '20', paddingHorizontal: size === 'md' ? 12 : 9, paddingVertical: size === 'md' ? 4 : 3 }]}>
    {dot && <View style={[styles.chipDot, { backgroundColor: color }]} />}
    <Text style={[styles.chipText, { color, fontSize: size === 'md' ? 12 : 11 }]}>{label}</Text>
  </View>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────
export const ProgressBar = ({ value, total, color = Colors.blue, height = 5 }) => {
  const fill = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;
  return (
    <View style={[styles.barTrack, { height }]}>
      <View style={[styles.barFill, { width: `${fill}%`, backgroundColor: color, shadowColor: color }]} />
    </View>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────
export const SectionHeader = ({ title, right, rightColor = Colors.blue, onRight }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right && (
      <Pressable onPress={onRight}>
        <Text style={[styles.sectionRight, { color: rightColor }]}>{right}</Text>
      </Pressable>
    )}
  </View>
);

// ─── PRIMARY BUTTON ───────────────────────────────────────────────
export const PrimaryButton = ({ label, onPress, disabled, loading, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} disabled={disabled || loading}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={disabled ? [Colors.layer2, Colors.layer2] : ['#1D4ED8', Colors.blue]}
          style={[styles.primaryBtn, style]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.primaryBtnText, { color: disabled ? Colors.t3 : '#fff' }]}>{label}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ─── INPUT FIELD ──────────────────────────────────────────────────
export const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', prefix, style }) => (
  <View style={[styles.inputWrap, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={styles.inputRow}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <TextInput
        value={String(value ?? '')}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.t3}
        keyboardType={keyboardType}
        style={styles.inputText}
      />
    </View>
  </View>
);

// ─── TOGGLE ───────────────────────────────────────────────────────
export const Toggle = ({ value, onChange }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 30 }).start();
  }, [value]);

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.1)', Colors.blue] });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <Pressable onPress={onChange}>
      <Animated.View style={[styles.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: tx }] }]} />
      </Animated.View>
    </Pressable>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────
export const EmptyState = ({ icon, title, sub, cta, onCta }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {sub && <Text style={styles.emptySub}>{sub}</Text>}
    {cta && (
      <PrimaryButton label={cta} onPress={onCta} style={{ marginTop: Spacing.md }} />
    )}
  </View>
);

// ─── SKELETON ─────────────────────────────────────────────────────
export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style }) => (
  <View style={[styles.skeleton, { width, height, borderRadius }, style]} />
);

// ─── STAT ROW ─────────────────────────────────────────────────────
export const StatRow = ({ label, value, valueColor, last = false }) => (
  <View style={[styles.statRow, !last && styles.statRowBorder]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.layer1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    gap: 5,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  chipText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  barTrack: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 6,
  },
  sectionTitle: {
    ...Typography.h4,
  },
  sectionRight: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.blue,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputWrap: {
    backgroundColor: Colors.layer2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.t3,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.t3,
    marginRight: 6,
  },
  inputText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.t1,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 99,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm + 4,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeleton: {
    backgroundColor: Colors.layer2,
    opacity: 0.7,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    ...Typography.body,
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.t1,
  },
});
