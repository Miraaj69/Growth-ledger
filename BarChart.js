// BarChart.js
import React from 'react';
import { View, Text } from 'react-native';
import { C } from './theme';

export default function BarChart({ data, color = C.blue, height = 64 }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <View style={{ flexDirection:'row', alignItems:'flex-end', gap:5, height }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const bh = Math.max(4, (d.v / max) * (height - 18));
        return (
          <View key={i} style={{ flex:1, alignItems:'center', gap:4 }}>
            <View style={{ width:'100%', height:bh, backgroundColor: isLast ? color : color+'38',
              borderRadius:5, shadowColor: isLast ? color : 'transparent', shadowOpacity:0.6, shadowRadius:10, elevation: isLast?4:0 }} />
            <Text style={{ fontSize:9, color: isLast ? C.t2 : C.t3, fontWeight: isLast ? '600' : '400' }}>{d.l}</Text>
          </View>
        );
      })}
    </View>
  );
}
