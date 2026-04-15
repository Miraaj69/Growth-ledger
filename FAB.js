// FAB.js
import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Shadows } from './theme';

export default function FAB({ actions }) {
  const [open, setOpen] = useState(false);
  const rot  = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(0)).current;
  const tY   = useRef(new Animated.Value(20)).current;

  const toggle = () => {
    const toOpen = !open;
    setOpen(toOpen);
    Animated.parallel([
      Animated.spring(rot,  { toValue: toOpen ? 1 : 0, useNativeDriver: true,  speed: 25 }),
      Animated.spring(opac, { toValue: toOpen ? 1 : 0, useNativeDriver: true,  speed: 20 }),
      Animated.spring(tY,   { toValue: toOpen ? 0 : 20, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const rotation = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={styles.container}>
      {open && (
        <Animated.View style={[styles.menu, { opacity: opac, transform: [{ translateY: tY }] }]}>
          {[...actions].reverse().map((a, i) => (
            <Pressable key={i} onPress={() => { a.action(); setOpen(false); }} style={[styles.action, { backgroundColor: a.color || Colors.blue }]}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
      <Pressable onPress={toggle}>
        <LinearGradient colors={['#1D4ED8', Colors.blue]} style={styles.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: rotation }] }]}>+</Animated.Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { position: 'absolute', bottom: Spacing.lg, right: Spacing.md, alignItems: 'flex-end', zIndex: 100 },
  menu:        { marginBottom: Spacing.sm, gap: Spacing.sm, alignItems: 'flex-end' },
  action:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.xxl, ...Shadows.md },
  actionIcon:  { fontSize: 18 },
  actionLabel: { color: '#fff', fontWeight: '600', fontSize: 13 },
  fab:         { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', ...Shadows.blue },
  fabIcon:     { fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 34 },
});
