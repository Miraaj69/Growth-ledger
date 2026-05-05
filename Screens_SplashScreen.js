import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Polygon,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  FeColorMatrix,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────
// ANIMATED BAR — each bar grows from bottom
// ─────────────────────────────────────────
const AnimatedBar = ({ x, maxH, delay, barW = 52, baseY, rx = 8 }) => {
  const scaleY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        delay,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: baseY,
        width: barW,
        height: maxH,
        borderRadius: rx,
        overflow: 'hidden',
        opacity,
        transform: [{ scaleY }, { translateY: maxH / 2 * (1 - 1) }],
        transformOrigin: 'bottom',
      }}
    >
      {/* Gold bar rendered as plain view with gradient feel via shadow */}
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: '#C8900A',
        borderRadius: rx,
      }]} />
      {/* Top highlight sheen */}
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 14,
        borderTopLeftRadius: rx,
        borderTopRightRadius: rx,
        backgroundColor: '#FFE066',
        opacity: 0.40,
      }} />
    </Animated.View>
  );
};

// ─────────────────────────────────────────
// ANIMATED ARROW LINE
// ─────────────────────────────────────────
const AnimatedArrow = ({ delay, containerW, containerH }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 100, delay, useNativeDriver: true }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 600,
        delay: 0,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // We draw a fixed line but clip it with animated width
  const lineWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerW * 0.85],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: containerH * 0.08,
        left: containerW * 0.06,
        opacity,
      }}
    >
      <Animated.View
        style={{
          width: lineWidth,
          height: 4,
          backgroundColor: '#FFD700',
          borderRadius: 2,
          transform: [{ rotate: '-38deg' }, { translateY: -containerH * 0.38 }],
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 10,
          elevation: 8,
        }}
      />
      {/* Arrowhead */}
      <Animated.View
        style={{
          position: 'absolute',
          right: -6,
          top: -14,
          opacity: progress,
          transform: [{ rotate: '52deg' }],
        }}
      >
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 20,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#FFD700',
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 12,
        }} />
      </Animated.View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────
// GLOW RING — pulsing halo behind icon
// ─────────────────────────────────────────
const GlowRing = ({ size, opacity: opacityVal, delay }) => {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: opacityVal, duration: 400, delay, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.96, duration: 1800, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: '#C8900A',
        opacity,
        transform: [{ scale }],
        shadowColor: '#D4A017',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      }}
    />
  );
};

// ─────────────────────────────────────────
// MAIN SPLASH SCREEN
// ─────────────────────────────────────────
export default function SplashScreen({ onFinish }) {
  // Animation values
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Phase 1 — haptic dot
  const dotOpacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0.5)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Phase 2 — icon card
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconGlow = useRef(new Animated.Value(0)).current;

  // Phase 3 — text
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const lineScaleX = useRef(new Animated.Value(0)).current;

  // Bar chart items — 5 bars
  const barAnims = [0, 1, 2, 3, 4].map(() => ({
    scaleY: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
  }));
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const arrowProgress = useRef(new Animated.Value(0)).current;

  const ICON_SIZE = SW * 0.44;
  const CARD_RADIUS = ICON_SIZE * 0.22;

  // Bar config inside the icon
  const BAR_AREA_W = ICON_SIZE * 0.78;
  const BAR_AREA_H = ICON_SIZE * 0.56;
  const BAR_W = BAR_AREA_W / 7.5;
  const BAR_GAP = (BAR_AREA_W - BAR_W * 5) / 4;
  const BARS = [
    { h: BAR_AREA_H * 0.30 },
    { h: BAR_AREA_H * 0.46 },
    { h: BAR_AREA_H * 0.62 },
    { h: BAR_AREA_H * 0.78 },
    { h: BAR_AREA_H * 0.96 },
  ];

  useEffect(() => {
    runSequence();
  }, []);

  const runSequence = async () => {
    // ── PHASE 1: Haptic + dot (0ms) ──
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    Animated.parallel([
      Animated.spring(dotScale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
      Animated.timing(dotOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Ring expand
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 0.6, duration: 200, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 2.2, duration: 600, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      ]).start();
    }, 200);

    // Dot fade out
    setTimeout(() => {
      Animated.timing(dotOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 600);

    // ── PHASE 2: Icon appears (700ms) ──
    setTimeout(() => {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 70,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(iconGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 700);

    // ── PHASE 3: Bars animate (1100ms) ──
    barAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(anim.scaleY, {
            toValue: 1, tension: 65, friction: 7, useNativeDriver: true,
          }),
        ]).start();
      }, 1100 + i * 100);
    });

    // ── PHASE 4: Arrow draws (1700ms) ──
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(arrowOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(arrowProgress, { toValue: 1, duration: 500, useNativeDriver: false }),
      ]).start();
    }, 1700);

    // ── PHASE 5: Text fades in (2100ms) ──
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(lineScaleX, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, delay: 400, useNativeDriver: true }),
      ]).start();
    }, 2100);

    // ── PHASE 6: Transition to Home (3400ms) ──
    setTimeout(() => {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish && onFinish();
      });
    }, 3400);
  };

  const glowOpacity = iconGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const glowRadius = iconGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* ── PHASE 1: Haptic dot + ring ── */}
      <Animated.View style={[
        styles.hapticRing,
        {
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }
      ]} />
      <Animated.View style={[
        styles.hapticDot,
        {
          opacity: dotOpacity,
          transform: [{ scale: dotScale }],
        }
      ]} />

      {/* ── LOGO CONTAINER ── */}
      <Animated.View style={[
        styles.iconWrapper,
        {
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
        }
      ]}>
        {/* Outer glow halos */}
        <GlowRing size={ICON_SIZE * 1.55} opacityVal={0.18} delay={900} />
        <GlowRing size={ICON_SIZE * 1.30} opacityVal={0.28} delay={1000} />
        <GlowRing size={ICON_SIZE * 1.10} opacityVal={0.45} delay={1100} />

        {/* Icon card */}
        <Animated.View style={[
          styles.iconCard,
          {
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: CARD_RADIUS,
            shadowOpacity: glowOpacity,
            shadowRadius: 40,
          }
        ]}>
          {/* Card background */}
          <View style={[StyleSheet.absoluteFill, {
            borderRadius: CARD_RADIUS,
            backgroundColor: '#120F08',
          }]} />

          {/* Card gold border */}
          <View style={[StyleSheet.absoluteFill, {
            borderRadius: CARD_RADIUS,
            borderWidth: 1.5,
            borderColor: 'rgba(200,144,10,0.55)',
          }]} />

          {/* Top glass sheen */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: ICON_SIZE * 0.38,
            borderTopLeftRadius: CARD_RADIUS,
            borderTopRightRadius: CARD_RADIUS,
            backgroundColor: 'rgba(255,255,255,0.055)',
          }} />

          {/* ── BAR CHART INSIDE ICON ── */}
          <View style={[styles.barContainer, {
            width: BAR_AREA_W,
            height: BAR_AREA_H,
            bottom: ICON_SIZE * 0.14,
          }]}>
            {BARS.map((bar, i) => {
              const anim = barAnims[i];
              return (
                <Animated.View
                  key={i}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: i * (BAR_W + BAR_GAP),
                    width: BAR_W,
                    height: bar.h,
                    borderRadius: BAR_W * 0.18,
                    overflow: 'hidden',
                    opacity: anim.opacity,
                    transform: [{
                      scaleY: anim.scaleY,
                    }],
                    transformOrigin: 'bottom',
                  }}
                >
                  <View style={[StyleSheet.absoluteFill, {
                    backgroundColor: '#C8900A',
                    borderRadius: BAR_W * 0.18,
                  }]} />
                  {/* Top sheen */}
                  <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: BAR_W * 0.35,
                    borderTopLeftRadius: BAR_W * 0.18,
                    borderTopRightRadius: BAR_W * 0.18,
                    backgroundColor: '#FFE066',
                    opacity: 0.45,
                  }} />
                  {/* Side shadow */}
                  <View style={{
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0,
                    width: BAR_W * 0.25,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    borderTopRightRadius: BAR_W * 0.18,
                    borderBottomRightRadius: BAR_W * 0.18,
                  }} />
                </Animated.View>
              );
            })}

            {/* ── TREND ARROW ── */}
            <Animated.View style={[
              styles.arrowContainer,
              {
                opacity: arrowOpacity,
                width: BAR_AREA_W,
                height: BAR_AREA_H,
              }
            ]}>
              <Svg width={BAR_AREA_W} height={BAR_AREA_H} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="arrowG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#D4A017" stopOpacity="0.7" />
                    <Stop offset="100%" stopColor="#FFE066" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                {/* Main arrow line */}
                <Line
                  x1={BAR_W * 0.5}
                  y1={BAR_AREA_H * 0.92}
                  x2={BAR_AREA_W - BAR_W * 0.5}
                  y2={BAR_AREA_H * 0.05}
                  stroke="#FFD700"
                  strokeWidth={BAR_W * 0.22}
                  strokeLinecap="round"
                />
                {/* Arrowhead */}
                <Polygon
                  points={`${BAR_AREA_W - BAR_W * 0.3},${BAR_AREA_H * 0.04} ${BAR_AREA_W - BAR_W},${BAR_AREA_H * 0.12} ${BAR_AREA_W - BAR_W * 0.1},${BAR_AREA_H * 0.22}`}
                  fill="#FFE066"
                />
              </Svg>
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── TEXT BLOCK ── */}
      <Animated.View style={[
        styles.textBlock,
        {
          opacity: textOpacity,
          transform: [{ translateY: textY }],
        }
      ]}>
        {/* App name */}
        <View style={styles.nameRow}>
          <Animated.Text style={styles.nameGold}>Growth</Animated.Text>
          <Animated.Text style={styles.nameWhite}> Ledger</Animated.Text>
        </View>

        {/* Gold line */}
        <Animated.View style={[
          styles.goldLine,
          { transform: [{ scaleX: lineScaleX }] }
        ]} />

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          YOUR WEALTH · YOUR PRIVACY
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060608',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hapticDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C8900A',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  hapticRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D4A017',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  iconCard: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
  },
  barContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  textBlock: {
    alignItems: 'center',
    position: 'absolute',
    bottom: SH * 0.18,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  nameGold: {
    fontSize: 44,
    fontWeight: '700',
    color: '#D4A017',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(212,160,23,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  nameWhite: {
    fontSize: 44,
    fontWeight: '300',
    color: '#E8E8F0',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  goldLine: {
    width: 160,
    height: 1.5,
    backgroundColor: '#C8900A',
    marginBottom: 14,
    opacity: 0.7,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '400',
    color: '#C8900A',
    letterSpacing: 3.5,
    opacity: 0.75,
  },
});
