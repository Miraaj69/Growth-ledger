// BarChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './theme';

export default function BarChart({ data, color = Colors.blue, height = 64 }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <View style={[styles.container, { height }]}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const barH   = Math.max(4, (d.v / max) * (height - 18));
        return (
          <View key={i} style={styles.barWrap}>
            <View style={[styles.bar, { height: barH, backgroundColor: isLast ? color : `${color}38`, shadowColor: isLast ? color : 'transparent', shadowOpacity: isLast ? 0.6 : 0 }]} />
            <Text style={[styles.label, isLast && { color: Colors.t2, fontWeight: '600' }]}>{d.l}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barWrap:   { flex: 1, alignItems: 'center', gap: 5 },
  bar:       { width: '100%', borderRadius: 5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  label:     { fontSize: 9, color: Colors.t3 },
});
