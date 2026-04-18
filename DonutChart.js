// DonutChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function DonutChart({ segments, size = 92, sw = 13, centerLabel }) {
  const r = (size - sw) / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const el = <Circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color}
            strokeWidth={sw} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset} strokeLinecap="round" />;
          offset += dash;
          return el;
        })}
      </Svg>
      {centerLabel && (
        <View style={[StyleSheet.absoluteFillObject, { alignItems:'center', justifyContent:'center' }]}>
          <Text style={{ fontWeight:'800', fontSize:11, color:'#F1F5F9' }}>{centerLabel}</Text>
        </View>
      )}
    </View>
  );
}
