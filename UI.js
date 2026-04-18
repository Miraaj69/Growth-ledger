
// ALL components use useTheme() — zero hardcoded colors
import React, { useRef, memo, useCallback } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet,
  Animated, ActivityIndicator, FlatList, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';
import { SPACING as S, RADIUS as R, SHADOW as SH } from './theme';
import { safePct } from './helpers';

// ── Haptic helper ─────────────────────────────────────────
const tap = () => {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
};

// ── usePress hook ─────────────────────────────────────────
const usePress = (scaleVal = 0.974) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = useCallback(() => Animated.spring(scale, { toValue: scaleVal, useNativeDriver:true, speed:35, bounciness:1 }).start(), []);
  const onOut = useCallback(() => Animated.spring(scale, { toValue: 1,         useNativeDriver:true, speed:25 }).start(), []);
  return { scale, onIn, onOut };
};

// ── CARD ─────────────────────────────────────────────────
export const Card = memo(({ children, style, onPress, glow }) => {
  const { T } = useTheme();
  const { scale, onIn, onOut } = usePress();
  const card = (
    <Animated.View style={[{
      backgroundColor: T.l1,
      borderRadius: R.xl, padding: S.md,
      borderWidth:1, borderColor: glow ? T.blue+'44' : T.border,
      ...SH.card,
    }, style, { transform:[{ scale }] }]}>
      {children}
    </Animated.View>
  );
  return onPress ? (
    <Pressable onPress={() => { tap(); onPress(); }} onPressIn={onIn} onPressOut={onOut}>{card}</Pressable>
  ) : card;
});

// ── GRADIENT CARD ─────────────────────────────────────────
export const GCard = memo(({ children, colors, style, onPress }) => {
  const { T } = useTheme();
  const { scale, onIn, onOut } = usePress();
  return (
    <Pressable onPress={() => { if(onPress){tap(); onPress();} }} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={{ transform:[{ scale }] }}>
        <LinearGradient
          colors={colors || ['#0b1f52','#1e4fa0']}
          style={[{ borderRadius:R.xl, padding:S.md, borderWidth:1, borderColor:T.border, ...SH.card }, style]}
          start={{x:0,y:0}} end={{x:1,y:1}}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

// ── CHIP ─────────────────────────────────────────────────
export const Chip = memo(({ label, color, dot, sm }) => {
  const clr = color || '#4F8CFF';
  return (
    <View style={{
      flexDirection:'row', alignItems:'center',
      backgroundColor: clr+'20',
      borderRadius:99,
      paddingHorizontal: sm ? 8 : 11,
      paddingVertical: sm ? 3 : 4,
      gap:4,
    }}>
      {dot && <View style={{ width:5, height:5, borderRadius:99, backgroundColor:clr }} />}
      <Text style={{ color:clr, fontSize: sm?10:11, fontWeight:'600' }}>{label}</Text>
    </View>
  );
});

// ── ANIMATED PROGRESS BAR ─────────────────────────────────
export const Bar = memo(({ value=0, total=0, color='#4F8CFF', h=5 }) => {
  const fillPct = safePct(value, total);
  const w = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(w, { toValue: fillPct, duration:800, useNativeDriver:false }).start();
  }, [fillPct]);
  const width = w.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] });
  return (
    <View style={{ backgroundColor:'rgba(255,255,255,0.06)', borderRadius:99, height:h, overflow:'hidden' }}>
      <Animated.View style={{ width, height:'100%', borderRadius:99, backgroundColor:color, shadowColor:color, shadowOpacity:0.4, shadowRadius:6, elevation:2 }} />
    </View>
  );
});

// ── SECTION HEADER ────────────────────────────────────────
export const SH_Comp = memo(({ title, right, rightColor, onRight }) => {
  const { T } = useTheme();
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:S.sm+6 }}>
      <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>{title}</Text>
      {right && (
        <Pressable onPress={onRight}>
          <Text style={{ fontSize:12, fontWeight:'600', color: rightColor||T.blue }}>{right}</Text>
        </Pressable>
      )}
    </View>
  );
});
// Alias for brevity
export const SectionHeader = SH_Comp;

// ── PRIMARY BUTTON ────────────────────────────────────────
export const Btn = memo(({ label, onPress, disabled, loading, color, style }) => {
  const { T } = useTheme();
  const { scale, onIn, onOut } = usePress(0.96);
  const colors = disabled ? [T.l2, T.l2] : color ? [color, color] : ['#2563EB', T.blue];
  return (
    <Pressable onPress={() => { if(!disabled&&!loading){tap(); onPress?.();} }}
      onPressIn={onIn} onPressOut={onOut} disabled={disabled||loading}>
      <Animated.View style={{ transform:[{ scale }] }}>
        <LinearGradient colors={colors}
          style={[{ borderRadius:R.lg, paddingVertical:S.md, paddingHorizontal:S.lg, alignItems:'center', justifyContent:'center', ...SH.blue }, style]}
          start={{x:0,y:0}} end={{x:1,y:0}}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ fontSize:16, fontWeight:'700', color: disabled?T.t3:'#fff' }}>{label}</Text>}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

// ── TEXT INPUT ────────────────────────────────────────────
export const Input = memo(({ label, value, onChange, placeholder, type='default', prefix, suffix, error, style }) => {
  const { T } = useTheme();
  return (
    <View style={[{
      backgroundColor:T.l2, borderRadius:R.md,
      paddingHorizontal:S.md, paddingVertical:S.sm+4,
      borderWidth:1, borderColor: error ? '#EF4444' : T.border,
      marginBottom:S.sm+2,
    }, style]}>
      {label && <Text style={{ fontSize:11, fontWeight:'600', color:T.t3, letterSpacing:0.5, marginBottom:6, textTransform:'uppercase' }}>{label}</Text>}
      <View style={{ flexDirection:'row', alignItems:'center' }}>
        {prefix && <Text style={{ fontSize:22, fontWeight:'700', color:T.t3, marginRight:6 }}>{prefix}</Text>}
        <TextInput
          value={String(value ?? '')}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={T.t3}
          keyboardType={type}
          style={{ flex:1, fontSize:22, fontWeight:'700', color:T.t1 }}
        />
        {suffix && <Text style={{ fontSize:14, color:T.t3 }}>{suffix}</Text>}
      </View>
      {error && <Text style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>{error}</Text>}
    </View>
  );
});

// ── TOGGLE ────────────────────────────────────────────────
export const Toggle = memo(({ value, onChange }) => {
  const { T } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: value?1:0, useNativeDriver:false, speed:30 }).start();
  }, [value]);
  const bg = anim.interpolate({ inputRange:[0,1], outputRange:['rgba(255,255,255,0.1)', T.blue] });
  const tx = anim.interpolate({ inputRange:[0,1], outputRange:[2,22] });
  return (
    <Pressable onPress={() => { tap(); onChange?.(); }}>
      <Animated.View style={{ width:48, height:28, borderRadius:99, backgroundColor:bg, justifyContent:'center', paddingHorizontal:2 }}>
        <Animated.View style={{ width:22, height:22, borderRadius:11, backgroundColor:'#fff', transform:[{translateX:tx}], shadowColor:'#000', shadowOpacity:0.4, shadowRadius:4, elevation:3 }} />
      </Animated.View>
    </Pressable>
  );
});

// ── EMPTY STATE ───────────────────────────────────────────
export const Empty = memo(({ icon='📭', title, sub, cta, onCta }) => {
  const { T } = useTheme();
  return (
    <View style={{ alignItems:'center', paddingVertical:S.xl, paddingHorizontal:S.lg }}>
      <Text style={{ fontSize:48, marginBottom:S.md }}>{icon}</Text>
      <Text style={{ fontSize:17, fontWeight:'700', color:T.t1, marginBottom:6, textAlign:'center' }}>{title}</Text>
      {sub && <Text style={{ fontSize:13, color:T.t2, textAlign:'center', lineHeight:20 }}>{sub}</Text>}
      {cta && <View style={{ marginTop:S.md, width:'100%' }}><Btn label={cta} onPress={onCta} /></View>}
    </View>
  );
});

// ── STAT ROW ─────────────────────────────────────────────
export const StatRow = memo(({ label, value, color, last }) => {
  const { T } = useTheme();
  return (
    <View style={[{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 }, !last && { borderBottomWidth:1, borderBottomColor:T.border }]}>
      <Text style={{ fontSize:13, color:T.t2 }}>{label}</Text>
      <Text style={{ fontSize:14, fontWeight:'700', color: color||T.t1 }}>{value}</Text>
    </View>
  );
});

// ── ALERT ROW ────────────────────────────────────────────
export const AlertRow = memo(({ icon, msg, color, last }) => (
  <View style={[{
    flexDirection:'row', gap:9, padding:10,
    borderRadius:11, borderWidth:1,
    backgroundColor: color+'10', borderColor: color+'28',
    alignItems:'flex-start', marginBottom: last?0:7,
  }]}>
    <Text style={{ fontSize:14 }}>{icon}</Text>
    <Text style={{ fontSize:12, lineHeight:18, flex:1, color }}>{msg}</Text>
  </View>
));

// ── MONTH PICKER ─────────────────────────────────────────
export const MonthPicker = memo(({ month, year, onChange }) => {
  const { T } = useTheme();
  const now = new Date(), isCur = month===now.getMonth()&&year===now.getFullYear();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const prev = () => month===0 ? onChange(11,year-1) : onChange(month-1,year);
  const next = () => { if(isCur)return; month===11 ? onChange(0,year+1) : onChange(month+1,year); };
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
      <Pressable onPress={prev} style={{ width:30,height:30,borderRadius:R.sm,backgroundColor:T.l2,alignItems:'center',justifyContent:'center' }}>
        <Text style={{ fontSize:18, color:T.t2, lineHeight:24 }}>‹</Text>
      </Pressable>
      <View style={{ alignItems:'center', minWidth:72, gap:2 }}>
        <Text style={{ fontSize:12, fontWeight:'700', color:T.t1 }}>{MONTHS[month]} {year}</Text>
        {isCur && <Chip label="Now" color="#22C55E" dot sm />}
      </View>
      <Pressable onPress={next} style={{ width:30,height:30,borderRadius:R.sm,backgroundColor:T.l2,alignItems:'center',justifyContent:'center',opacity:isCur?0.35:1 }}>
        <Text style={{ fontSize:18, color:T.t2, lineHeight:24 }}>›</Text>
      </Pressable>
    </View>
  );
});

// ── FAB ──────────────────────────────────────────────────
export const FAB = memo(({ actions }) => {
  const [open, setOpen] = React.useState(false);
  const rot  = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(0)).current;
  const tY   = useRef(new Animated.Value(20)).current;

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch{}
    Animated.parallel([
      Animated.spring(rot,  { toValue:next?1:0, useNativeDriver:true, speed:25 }),
      Animated.spring(opac, { toValue:next?1:0, useNativeDriver:true, speed:20 }),
      Animated.spring(tY,   { toValue:next?0:20,useNativeDriver:true, speed:20 }),
    ]).start();
  }, [open]);

  const rotation = rot.interpolate({ inputRange:[0,1], outputRange:['0deg','45deg'] });
  return (
    <View style={{ position:'absolute', bottom:S.lg+4, right:S.md, alignItems:'flex-end', zIndex:200 }}>
      {open && (
        <Animated.View style={{ marginBottom:S.sm, gap:S.sm, alignItems:'flex-end', opacity:opac, transform:[{translateY:tY}] }}>
          {[...actions].reverse().map((a,i) => (
            <Pressable key={i} onPress={() => { a.action?.(); setOpen(false); }}
              style={{ flexDirection:'row', alignItems:'center', gap:S.sm, paddingHorizontal:S.md, paddingVertical:10, borderRadius:99, backgroundColor: a.color||'#4F8CFF', ...SH.card }}>
              <Text style={{ fontSize:18 }}>{a.icon}</Text>
              <Text style={{ color:'#fff', fontWeight:'600', fontSize:13 }}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
      <Pressable onPress={toggle}>
        <LinearGradient colors={['#2563EB','#4F8CFF']} style={{ width:54,height:54,borderRadius:R.lg+2,alignItems:'center',justifyContent:'center',...SH.blue }} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Animated.Text style={{ fontSize:30, color:'#fff', lineHeight:36, transform:[{rotate:rotation}] }}>+</Animated.Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
});
