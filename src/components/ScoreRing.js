// src/components/ScoreRing.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../constants/theme';

export default function ScoreRing({ score, color, size = 110, strokeWidth = 10 }) {
  const r         = (size - strokeWidth) / 2;
  const circ      = 2 * Math.PI * r;
  const dashArr   = (score / 100) * circ;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashArr} ${circ - dashArr}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Text style={styles.sub}>/100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  score:  { fontFamily: 'Syne_800ExtraBold', fontSize: 26, lineHeight: 30 },
  sub:    { fontSize: 10, color: Colors.t3, marginTop: 2 },
});
