// src/components/DonutChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

export default function DonutChart({ segments, size = 92, strokeWidth = 13, centerLabel }) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}/>
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const el = (
            <Circle
              key={i}
              cx={size/2} cy={size/2} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
      </Svg>
      {centerLabel && (
        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <Text style={styles.label}>{centerLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label:  { fontFamily: 'Syne_700Bold', fontSize: 11, color: Colors.t1 },
});
