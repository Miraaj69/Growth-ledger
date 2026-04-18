// UIComponents.js
import React, { useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Animated, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C, S, R, Sh, G } from './theme';

// ── Haptic press ──────────────────────────────────────────────
const haptic = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
};

// ── ANIMATED PRESS ────────────────────────────────────────────
const usePress = (scale = 0.974) => {
  const anim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(anim, { toValue: scale, useNativeDriver: true, speed: 35, bounciness: 2 }).start();
  const onOut = () => Animated.spring(anim, { toValue: 1,     useNativeDriver: true, speed: 25 }).start();
  return { anim, onIn, onOut };
};

// ── CARD ──────────────────────────────────────────────────────
export const Card = ({ children, style, onPress, glow }) => {
  const { anim, onIn, onOut } = usePress();
  const card = (
    <Animated.View style={[styles.card, glow && styles.cardGlow, { transform: [{ scale: anim }] }, style]}>
      {children}
    </Animated.View>
  );
  return onPress ? (
    <Pressable onPress={() => { haptic(); onPress(); }} onPressIn={onIn} onPressOut={onOut}>{card}</Pressable>
  ) : card;
};

// ── GRADIENT CARD ─────────────────────────────────────────────
export const GCard = ({ children, colors, style, onPress }) => {
  const { anim, onIn, onOut } = usePress();
  return (
    <Pressable onPress={() => { if(onPress){haptic(); onPress();} }} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={{ transform: [{ scale: anim }] }}>
        <LinearGradient colors={colors || G.hero} style={[styles.card, style]} start={{x:0,y:0}} end={{x:1,y:1}}>
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ── CHIP ──────────────────────────────────────────────────────
export const Chip = ({ label, color = C.blue, dot, sm }) => (
  <View style={[styles.chip, { backgroundColor: color + '20', paddingHorizontal: sm ? 8 : 11, paddingVertical: sm ? 3 : 4 }]}>
    {dot && <View style={[styles.chipDot, { backgroundColor: color }]} />}
    <Text style={[styles.chipText, { color, fontSize: sm ? 10 : 11 }]}>{label}</Text>
  </View>
);

// ── PROGRESS BAR ─────────────────────────────────────────────
export const Bar = ({ value, total, color = C.blue, h = 5, animated = true }) => {
  const fill = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;
  const w = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!animated) return;
    Animated.timing(w, { toValue: fill, duration: 900, useNativeDriver: false }).start();
  }, [fill]);
  const width = animated ? w.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] }) : `${fill}%`;
  return (
    <View style={[styles.barTrack, { height: h }]}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: color, shadowColor: color }]} />
    </View>
  );
};

// ── SECTION HEADER ────────────────────────────────────────────
export const SH = ({ title, right, rc = C.blue, onRight }) => (
  <View style={styles.sh}>
    <Text style={styles.shTitle}>{title}</Text>
    {right && <Pressable onPress={onRight}><Text style={[styles.shRight, { color: rc }]}>{right}</Text></Pressable>}
  </View>
);

// ── PRIMARY BUTTON ────────────────────────────────────────────
export const Btn = ({ label, onPress, disabled, loading, color, style }) => {
  const { anim, onIn, onOut } = usePress(0.96);
  return (
    <Pressable onPress={() => { if(!disabled&&!loading){haptic(); onPress?.();} }} onPressIn={onIn} onPressOut={onOut} disabled={disabled||loading}>
      <Animated.View style={{ transform:[{scale:anim}] }}>
        <LinearGradient colors={disabled ? [C.l2,C.l2] : color ? [color,color] : ['#2563EB',C.blue]}
          style={[styles.btn, style]} start={{x:0,y:0}} end={{x:1,y:0}}>
          {loading ? <ActivityIndicator color="#fff" size="small"/> : <Text style={[styles.btnText, {color:disabled?C.t3:'#fff'}]}>{label}</Text>}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ── INPUT ─────────────────────────────────────────────────────
export const Input = ({ label, value, onChange, placeholder, type = 'default', prefix, style }) => (
  <View style={[styles.input, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={styles.inputRow}>
      {prefix && <Text style={styles.inputPfx}>{prefix}</Text>}
      <TextInput value={String(value ?? '')} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={C.t3} keyboardType={type} style={styles.inputText} />
    </View>
  </View>
);

// ── TOGGLE (with animation) ───────────────────────────────────
export const Toggle = ({ value, onChange }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 30 }).start();
  }, [value]);
  const bg = anim.interpolate({ inputRange:[0,1], outputRange:['rgba(255,255,255,0.1)', C.blue] });
  const tx = anim.interpolate({ inputRange:[0,1], outputRange:[2, 22] });
  return (
    <Pressable onPress={() => { haptic(); onChange?.(); }}>
      <Animated.View style={[styles.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleThumb, { transform:[{translateX:tx}] }]} />
      </Animated.View>
    </Pressable>
  );
};

// ── EMPTY STATE ───────────────────────────────────────────────
export const Empty = ({ icon, title, sub, cta, onCta }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {sub && <Text style={styles.emptySub}>{sub}</Text>}
    {cta && <Btn label={cta} onPress={onCta} style={{ marginTop: S.md, paddingHorizontal: S.lg }} />}
  </View>
);

// ── STAT ROW ─────────────────────────────────────────────────
export const StatRow = ({ label, value, color, last }) => (
  <View style={[styles.statRow, !last && styles.statBorder]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statVal, color && { color }]}>{value}</Text>
  </View>
);

// ── STYLES ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  card:        { backgroundColor: C.l1, borderRadius: R.xl, padding: S.md, borderWidth:1, borderColor: C.border, ...Sh.card },
  cardGlow:    { borderColor: C.blue + '44', ...Sh.glow },
  chip:        { flexDirection:'row', alignItems:'center', borderRadius:99, gap:4 },
  chipDot:     { width:5, height:5, borderRadius:99 },
  chipText:    { fontWeight:'600', letterSpacing:0.2 },
  barTrack:    { backgroundColor:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' },
  barFill:     { height:'100%', borderRadius:99, shadowOpacity:0.4, shadowRadius:8, elevation:3 },
  sh:          { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: S.sm+6 },
  shTitle:     { fontSize:15, fontWeight:'700', color:C.t1 },
  shRight:     { fontSize:12, fontWeight:'600' },
  btn:         { borderRadius:R.lg, paddingVertical:S.md, paddingHorizontal:S.lg, alignItems:'center', justifyContent:'center', ...Sh.blue },
  btnText:     { fontSize:16, fontWeight:'700', letterSpacing:0.2 },
  input:       { backgroundColor:C.l2, borderRadius:R.md, paddingHorizontal:S.md, paddingVertical:S.sm+4, borderWidth:1, borderColor:C.border, marginBottom:S.sm+2 },
  inputLabel:  { fontSize:11, fontWeight:'600', color:C.t3, letterSpacing:0.5, marginBottom:6, textTransform:'uppercase' },
  inputRow:    { flexDirection:'row', alignItems:'center' },
  inputPfx:    { fontSize:22, fontWeight:'700', color:C.t3, marginRight:6 },
  inputText:   { flex:1, fontSize:22, fontWeight:'700', color:C.t1 },
  toggle:      { width:48, height:28, borderRadius:99, justifyContent:'center', paddingHorizontal:2 },
  toggleThumb: { width:22, height:22, borderRadius:11, backgroundColor:'#fff', shadowColor:'#000', shadowOpacity:0.4, shadowRadius:4, elevation:4 },
  empty:       { alignItems:'center', paddingVertical:S.xl, paddingHorizontal:S.lg },
  emptyIcon:   { fontSize:48, marginBottom:S.md },
  emptyTitle:  { fontSize:17, fontWeight:'700', color:C.t1, marginBottom:6, textAlign:'center' },
  emptySub:    { fontSize:13, color:C.t2, textAlign:'center', lineHeight:20 },
  statRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 },
  statBorder:  { borderBottomWidth:1, borderBottomColor:C.border },
  statLabel:   { fontSize:13, color:C.t2 },
  statVal:     { fontSize:14, fontWeight:'700', color:C.t1 },
});
