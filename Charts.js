
import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './ThemeContext';

// ── SCORE RING ────────────────────────────────────────────
export const ScoreRing = memo(({ score=0, color='#4F8CFF', size=110, sw=10 }) => {
  const safeScore = Math.min(100, Math.max(0, Number(score) || 0));
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (safeScore / 100) * circ;
  return (
    <View style={{ width:size, height:size }}>
      <Svg width={size} height={size} style={{ transform:[{rotate:'-90deg'}] }}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" />
      </Svg>
      <View style={{ position:'absolute', top:0,left:0,right:0,bottom:0, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ fontWeight:'800', fontSize:26, color, lineHeight:30 }}>{safeScore}</Text>
        <Text style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>/100</Text>
      </View>
    </View>
  );
});

// ── DONUT CHART ───────────────────────────────────────────
export const DonutChart = memo(({ segments=[], size=92, sw=13, centerLabel }) => {
  // Filter out invalid segments
  const valid = segments.filter(s => s && Number(s.pct) > 0);
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ width:size, height:size }}>
      <Svg width={size} height={size} style={{ transform:[{rotate:'-90deg'}] }}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        {valid.length > 0 ? valid.map((seg, i) => {
          const pctVal = Math.min(100, Math.max(0, Number(seg.pct) || 0));
          const dash = (pctVal / 100) * circ;
          const el = (
            <Circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={seg.color || '#4F8CFF'} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ-dash}`}
              strokeDashoffset={-offset} strokeLinecap="round" />
          );
          offset += dash;
          return el;
        }) : (
          // Empty state — grey ring
          <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw} />
        )}
      </Svg>
      {centerLabel && (
        <View style={{ position:'absolute',top:0,left:0,right:0,bottom:0, alignItems:'center',justifyContent:'center' }}>
          <Text style={{ fontWeight:'800', fontSize:10, color:'#F1F5F9' }}>{centerLabel}</Text>
        </View>
      )}
    </View>
  );
});

// ── BAR CHART ─────────────────────────────────────────────
export const BarChart = memo(({ data=[], color='#4F8CFF', height=64 }) => {
  const { T } = useTheme();
  // Safe data — ensure all values are valid numbers
  const safe = data.map(d => ({ v: Math.max(0, Number(d?.v) || 0), l: String(d?.l || '') }));
  const max  = Math.max(...safe.map(d => d.v), 1);
  if (safe.length === 0) {
    return (
      <View style={{ height, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ color:T.t3, fontSize:13 }}>No data yet</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection:'row', alignItems:'flex-end', gap:5, height }}>
      {safe.map((d, i) => {
        const isLast = i === safe.length - 1;
        const barH   = Math.max(4, (d.v / max) * (height - 18));
        return (
          <View key={i} style={{ flex:1, alignItems:'center', gap:4 }}>
            <View style={{
              width:'100%', height:barH,
              backgroundColor: d.v === 0 ? T.l3 : isLast ? color : color+'38',
              borderRadius:5,
              shadowColor: isLast && d.v > 0 ? color : 'transparent',
              shadowOpacity:0.6, shadowRadius:10, elevation: isLast?4:0,
            }} />
            <Text style={{ fontSize:9, color: isLast?T.t2:T.t3, fontWeight: isLast?'600':'400' }}>{d.l}</Text>
          </View>
        );
      })}
    </View>
  );
});
