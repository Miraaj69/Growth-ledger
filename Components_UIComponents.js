import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Easing,
} from 'react-native';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW, TYPE } from './Constants_theme';
import { useTheme } from './Context_ThemeContext';

// ─── CARD ─────────────────────────────────────────────────────────────────────
// Premium glassmorphism card — subtle border, soft shadow, spring press
export function Card({ children, style, onPress, glow, variant = 'default', noPad }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      tension: 350,
      friction: 8,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 280,
      friction: 7,
    }).start();

  const variantStyle = {
    default: {
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
    },
    elevated: {
      backgroundColor: colors.bgElevated,
      borderColor: colors.borderMid,
    },
    flat: {
      backgroundColor: colors.bgSection,
      borderColor: colors.border,
    },
    highlight: {
      backgroundColor: SEMANTIC.primaryDim,
      borderColor: SEMANTIC.primaryMid,
    },
  }[variant] || {};

  const content = (
    <Animated.View
      style={[
        styles.card,
        variantStyle,
        glow && SHADOW.heroGlow,
        !glow && SHADOW.card,
        !noPad && styles.cardPadding,
        style,
        { transform: [{ scale }] },
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        accessible
      >
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
// Production-grade button with 4 variants, spring animation, loading state
export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style, fullWidth,
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 0.94, useNativeDriver: true, tension: 400, friction: 8 }),
      Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 300, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const configs = {
    primary: {
      bg: SEMANTIC.primary,
      textColor: '#FFFFFF',
      border: 'transparent',
    },
    success: {
      bg: SEMANTIC.success,
      textColor: '#FFFFFF',
      border: 'transparent',
    },
    danger: {
      bg: SEMANTIC.danger,
      textColor: '#FFFFFF',
      border: 'transparent',
    },
    ghost: {
      bg: 'transparent',
      textColor: SEMANTIC.primary,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      textColor: colors.textSub,
      border: colors.borderMid,
    },
    outlinePrimary: {
      bg: SEMANTIC.primaryDim,
      textColor: SEMANTIC.primaryText,
      border: SEMANTIC.primaryMid,
    },
  };

  const sizeConfigs = {
    xs: { py: 6,  px: 12, fs: 12, radius: RADIUS.sm,  iconSize: 14 },
    sm: { py: 9,  px: 18, fs: 13, radius: RADIUS.md,  iconSize: 15 },
    md: { py: 13, px: 24, fs: 14, radius: RADIUS.lg,  iconSize: 16 },
    lg: { py: 16, px: 32, fs: 15, radius: RADIUS.xl,  iconSize: 17 },
  };

  const c  = configs[variant] || configs.primary;
  const sz = sizeConfigs[size] || sizeConfigs.md;
  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={[
          styles.button,
          {
            backgroundColor:   c.bg,
            paddingVertical:   sz.py,
            paddingHorizontal: sz.px,
            borderRadius:      sz.radius,
            borderWidth:       c.border !== 'transparent' ? 1 : 0,
            borderColor:       c.border,
            opacity:           isDisabled ? 0.45 : 1,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={c.textColor} size="small" />
        ) : (
          <>
            {icon && <View style={{ marginRight: SPACING.sm }}>{icon}</View>}
            <Text
              style={{
                color:       c.textColor,
                fontSize:    sz.fs,
                fontWeight:  FONT.semibold,
                letterSpacing: 0.1,
              }}
            >
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
// Clean pill badges — no borders, just dim fill + colored text
export function StatusBadge({ status, size = 'sm' }) {
  const config = {
    pending:   { label: 'Pending',   color: SEMANTIC.warning, bg: SEMANTIC.warningDim, dot: SEMANTIC.warning },
    completed: { label: 'Done',      color: SEMANTIC.success, bg: SEMANTIC.successDim, dot: SEMANTIC.success },
    overdue:   { label: 'Overdue',   color: SEMANTIC.danger,  bg: SEMANTIC.dangerDim,  dot: SEMANTIC.danger  },
  }[status] || { label: status, color: SEMANTIC.warning, bg: SEMANTIC.warningDim, dot: SEMANTIC.warning };

  const isLg = size === 'lg';

  return (
    <View style={[
      styles.statusBadge,
      { backgroundColor: config.bg },
      isLg && { paddingVertical: 6, paddingHorizontal: 12 },
    ]}>
      <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
      <Text style={[
        styles.statusText,
        { color: config.color },
        isLg && { fontSize: 13 },
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ label, color = SEMANTIC.primary, bg, style }) {
  const computedBg = bg || color + '18';
  return (
    <View style={[styles.badge, { backgroundColor: computedBg }, style]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
          <Text style={[styles.sectionAction, { color: SEMANTIC.primaryText }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '✦', title, subtitle, action, onAction }) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.emptyState,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.emptyIconWrap, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      )}
      {action && onAction && (
        <Button label={action} onPress={onAction} variant="outlinePrimary" size="sm" style={{ marginTop: SPACING.lg }} />
      )}
    </Animated.View>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
// Animated progress bar with smooth fill on mount
export function ProgressBar({ progress = 0, color = SEMANTIC.primary, height = 5, style, animated = true }) {
  const { colors } = useTheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: Math.min(progress, 100),
        duration: 700,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  const width = animated
    ? widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })
    : `${Math.min(progress, 100)}%`;

  return (
    <View style={[
      styles.progressTrack,
      { height, backgroundColor: colors.border, borderRadius: height },
      style,
    ]}>
      <Animated.View
        style={[
          styles.progressFill,
          { width, height, backgroundColor: color, borderRadius: height },
        ]}
      />
    </View>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export function Skeleton({ width, height = 16, radius, style }) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <Animated.View
      style={[
        {
          width:         width || '100%',
          height,
          borderRadius:  radius ?? height / 2,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
export function SkeletonCard({ style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, styles.cardPadding, SHADOW.card,
      { backgroundColor: colors.bgCard, borderColor: colors.border }, style]}>
      <Row style={{ gap: SPACING.md, marginBottom: SPACING.md }}>
        <Skeleton width={36} height={36} radius={RADIUS.sm} />
        <View style={{ flex: 1, gap: SPACING.sm }}>
          <Skeleton height={13} width="65%" />
          <Skeleton height={11} width="40%" />
        </View>
      </Row>
      <Skeleton height={11} width="90%" style={{ marginBottom: SPACING.sm }} />
      <Skeleton height={11} width="72%" />
    </View>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export function Divider({ style, label }) {
  const { colors } = useTheme();
  if (label) {
    return (
      <Row style={[styles.dividerRow, style]}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>{label}</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </Row>
    );
  }
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

// ─── ROW ─────────────────────────────────────────────────────────────────────
export function Row({ children, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {children}
    </View>
  );
}

// ─── SPACER ──────────────────────────────────────────────────────────────────
export function Spacer({ size = SPACING.md, horizontal }) {
  return (
    <View
      style={horizontal ? { width: size } : { height: size }}
      pointerEvents="none"
    />
  );
}

// ─── STAT CHIP ────────────────────────────────────────────────────────────────
// Compact metric pill — used in rows, not main cards
export function StatChip({ value, label, color, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statChip, { borderColor: color + '28', backgroundColor: color + '10' }, style]}>
      <Text style={[styles.statChipValue, { color }]}>{value}</Text>
      <Text style={[styles.statChipLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── ICON CONTAINER ──────────────────────────────────────────────────────────
export function IconContainer({ emoji, color, size = 36, style }) {
  return (
    <View style={[
      styles.iconContainer,
      {
        width:           size,
        height:          size,
        borderRadius:    size * 0.28,
        backgroundColor: color + '18',
        borderColor:     color + '28',
      },
      style,
    ]}>
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
}

// ─── PULSE DOT ────────────────────────────────────────────────────────────────
// Animated status indicator
export function PulseDot({ color = SEMANTIC.success, size = 8 }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size * 2.2,
        height: size * 2.2,
        borderRadius: size * 1.1,
        backgroundColor: color,
        opacity: 0.25,
        transform: [{ scale: pulse }],
      }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth:  1,
    overflow:     'hidden',
  },
  cardPadding: {
    padding: SPACING.lg,
  },

  button: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
  },

  statusBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingVertical:   4,
    paddingHorizontal: 10,
    borderRadius:      RADIUS.full,
  },
  statusDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  statusText: {
    fontSize:     11,
    fontWeight:   FONT.semibold,
    letterSpacing: 0.2,
  },

  badge: {
    paddingVertical:   3,
    paddingHorizontal: 9,
    borderRadius:      RADIUS.full,
  },
  badgeText: {
    fontSize:   10,
    fontWeight: FONT.semibold,
    letterSpacing: 0.3,
  },

  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACING.md,
  },
  sectionTitle: {
    fontSize:     15,
    fontWeight:   FONT.semibold,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize:   13,
    fontWeight: FONT.medium,
  },

  emptyState: {
    alignItems:    'center',
    paddingVertical: 64,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width:        72,
    height:       72,
    borderRadius: 20,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize:     17,
    fontWeight:   FONT.semibold,
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
    textAlign:    'center',
  },
  emptySubtitle: {
    fontSize:   13,
    lineHeight: 20,
    textAlign:  'center',
    maxWidth:   260,
  },

  progressTrack: {
    overflow: 'hidden',
  },
  progressFill: {},

  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.md,
  },
  dividerLine: {
    flex:   1,
    height: 1,
  },
  dividerLabel: {
    fontSize:   11,
    fontWeight: FONT.medium,
    letterSpacing: 0.3,
  },

  statChip: {
    alignItems:    'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius:  RADIUS.lg,
    borderWidth:   1,
    flex:          1,
  },
  statChipValue: {
    fontSize:   22,
    fontWeight: FONT.bold,
    letterSpacing: -0.6,
  },
  statChipLabel: {
    fontSize:   11,
    fontWeight: FONT.medium,
    marginTop:  3,
  },

  iconContainer: {
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  1,
  },
});
