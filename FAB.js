// FAB.js
import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C, S, R, Sh } from './theme';

export default function FAB({ actions }) {
  const [open, setOpen] = useState(false);
  const rot  = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(0)).current;
  const tY   = useRef(new Animated.Value(20)).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch{}
    Animated.parallel([
      Animated.spring(rot,  { toValue: next?1:0, useNativeDriver:true, speed:25 }),
      Animated.spring(opac, { toValue: next?1:0, useNativeDriver:true, speed:20 }),
      Animated.spring(tY,   { toValue: next?0:20,useNativeDriver:true, speed:20 }),
    ]).start();
  };

  const rotation = rot.interpolate({ inputRange:[0,1], outputRange:['0deg','45deg'] });

  return (
    <View style={styles.wrap}>
      {open && (
        <Animated.View style={[styles.menu, { opacity:opac, transform:[{translateY:tY}] }]}>
          {[...actions].reverse().map((a, i) => (
            <Pressable key={i} onPress={() => { a.action?.(); setOpen(false); }}
              style={[styles.action, { backgroundColor: a.color || C.blue }]}>
              <Text style={{ fontSize:18 }}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
      <Pressable onPress={toggle}>
        <LinearGradient colors={['#2563EB', C.blue]} style={styles.fab} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Animated.Text style={[styles.fabIcon, { transform:[{rotate:rotation}] }]}>+</Animated.Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:        { position:'absolute', bottom:S.lg+4, right:S.md, alignItems:'flex-end', zIndex:200 },
  menu:        { marginBottom:S.sm, gap:S.sm, alignItems:'flex-end' },
  action:      { flexDirection:'row', alignItems:'center', gap:S.sm, paddingHorizontal:S.md, paddingVertical:10, borderRadius:R.xxl, ...Sh.card },
  actionLabel: { color:'#fff', fontWeight:'600', fontSize:13 },
  fab:         { width:54, height:54, borderRadius:R.lg+2, alignItems:'center', justifyContent:'center', ...Sh.blue },
  fabIcon:     { fontSize:30, color:'#fff', lineHeight:36 },
});
