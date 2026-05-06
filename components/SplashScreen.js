import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#020617', '#081028', '#0f172a']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Background Glow */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {/* Glass Logo Card */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        }}
      >
        <BlurView intensity={60} tint="dark" style={styles.glassCard}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0.02)',
            ]}
            style={styles.gradientOverlay}
          />

          <View style={styles.logoContainer}>
            <Ionicons name="trending-up" size={42} color="#3b82f6" />
          </View>

          <Text style={styles.title}>Growth Ledger</Text>
          <Text style={styles.subtitle}>
            Premium Financial Intelligence
          </Text>
        </BlurView>
      </Animated.View>

      {/* Bottom Loader */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          marginTop: 40,
        }}
      >
        <View style={styles.loaderTrack}>
          <Animated.View style={styles.loaderFill} />
        </View>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footerText}>
        Smart Wealth • Smart Future
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },

  glow1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(59,130,246,0.18)',
    top: -40,
    left: -50,
  },

  glow2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16,185,129,0.14)',
    bottom: -40,
    right: -40,
  },

  glassCard: {
    width: width * 0.82,
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  loaderTrack: {
    width: 140,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  loaderFill: {
    width: '75%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },

  footerText: {
    position: 'absolute',
    bottom: 50,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    letterSpacing: 1,
  },
});
