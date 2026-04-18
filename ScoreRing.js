// ScoreRing.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from './theme';

export default function ScoreRing({ score, color, size = 110, sw = 10 }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { alignItems:'center', justifyContent:'center' }]}>
        <Text style={{ fontWeight:'800', fontSize:26, color, lineHeight:30 }}>{score}</Text>
        <Text style={{ fontSize:10, color:C.t3, marginTop:2 }}>/100</Text>
      </View>
    </View>
  );
}
