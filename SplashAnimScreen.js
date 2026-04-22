// SplashAnimScreen.js — Premium animated splash screen
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export default function SplashAnimScreen({ onDone }) {
  // All animation refs
  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY       = useRef(new Animated.Value(40)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(20)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  // Glow pulse loop
  const startGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#000000');

    Animated.sequence([
      // 1. BG fade in
      Animated.timing(bgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // 2. Logo pops in with spring
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoY,       { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
      ]),

      // 3. Short pause
      Animated.delay(150),

      // 4. Text slides up
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textY,       { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      ]),

      // 5. Tagline fades in
      Animated.timing(tagOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),

      // 6. Loading bar fills
      Animated.timing(barWidth, { toValue: W * 0.55, duration: 1000, useNativeDriver: false }),

      // 7. Hold
      Animated.delay(300),

      // 8. Fade out to app
      Animated.timing(exitOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      onDone?.();
    });

    // Start glow after logo appears
    setTimeout(startGlow, 700);
  }, []);

  const glowStyle = {
    opacity: glowAnim,
    transform: [{
      scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }),
    }],
  };

  return (
    <Animated.View style={[st.container, { opacity: exitOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Deep space background */}
      <Animated.View style={[st.bg, { opacity: bgOpacity }]}>
        {/* Radial glow at center */}
        <View style={st.radialOuter} />
        <View style={st.radialInner} />
        {/* Particle dots */}
        {PARTICLES.map((p, i) => (
          <View key={i} style={[st.particle, { top: p.top, left: p.left, width: p.size, height: p.size, opacity: p.op }]} />
        ))}
      </Animated.View>

      {/* LOGO */}
      <Animated.View style={[st.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: logoY }] }]}>
        {/* Outer glow ring */}
        <Animated.View style={[st.glowRing, glowStyle]} />
        {/* Logo image */}
        <Image
          source={require('./assets/icon.png')}
          style={st.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* APP NAME */}
      <Animated.View style={[st.textWrap, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        <Text style={st.appName}>GROWTH LEDGER</Text>
        <View style={st.nameLine} />
      </Animated.View>

      {/* TAGLINE */}
      <Animated.Text style={[st.tagline, { opacity: tagOpacity }]}>
        Your Financial OS
      </Animated.Text>

      {/* LOADING BAR */}
      <View style={st.barTrack}>
        <Animated.View style={[st.barFill, { width: barWidth }]} />
      </View>
    </Animated.View>
  );
}

// Particle positions (decorative)
const PARTICLES = [
  { top: '10%', left: '8%',  size: 3, op: 0.6 },
  { top: '15%', left: '78%', size: 2, op: 0.4 },
  { top: '22%', left: '55%', size: 4, op: 0.3 },
  { top: '30%', left: '20%', size: 2, op: 0.5 },
  { top: '68%', left: '82%', size: 3, op: 0.5 },
  { top: '72%', left: '12%', size: 2, op: 0.4 },
  { top: '80%', left: '60%', size: 2, op: 0.3 },
  { top: '85%', left: '35%', size: 4, op: 0.25 },
  { top: '6%',  left: '45%', size: 2, op: 0.5 },
  { top: '90%', left: '88%', size: 3, op: 0.4 },
];

const st = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#000000',
    alignItems: 'center', justifyContent: 'center',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  radialOuter: {
    position: 'absolute',
    width: W * 1.2, height: W * 1.2,
    borderRadius: W * 0.6,
    backgroundColor: 'rgba(34,197,94,0.04)',
  },
  radialInner: {
    position: 'absolute',
    width: W * 0.7, height: W * 0.7,
    borderRadius: W * 0.35,
    backgroundColor: 'rgba(34,197,94,0.07)',
  },
  particle: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: '#22C55E',
  },
  logoWrap: {
    width: 160, height: 160,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  glowRing: {
    position: 'absolute',
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(34,197,94,0.12)',
    shadowColor: '#22C55E',
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  logo: {
    width: 150, height: 150,
    borderRadius: 34,
  },
  textWrap: {
    alignItems: 'center', marginBottom: 8,
  },
  appName: {
    fontSize: 28, fontWeight: '900',
    color: '#FFFFFF', letterSpacing: 4,
    textShadowColor: 'rgba(34,197,94,0.4)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  nameLine: {
    width: 60, height: 2, borderRadius: 1,
    backgroundColor: '#22C55E',
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOpacity: 0.8, shadowRadius: 6,
    elevation: 4,
  },
  tagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2, marginBottom: 60,
    fontWeight: '400',
  },
  barTrack: {
    width: W * 0.55, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.8, shadowRadius: 6,
    elevation: 4,
  },
});
