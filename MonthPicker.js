// MonthPicker.js
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, S, R } from './theme';
import { Chip } from './UIComponents';
import { MONTHS_SHORT } from './calculations';

export default function MonthPicker({ month, year, onChange }) {
  const now = new Date(), isCur = month === now.getMonth() && year === now.getFullYear();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => month===0?onChange(11,year-1):onChange(month-1,year)} style={styles.btn}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <View style={styles.mid}>
        <Text style={styles.label}>{MONTHS_SHORT[month]} {year}</Text>
        {isCur && <Chip label="Now" color={C.green} dot sm />}
      </View>
      <Pressable onPress={() => { if(isCur)return; month===11?onChange(0,year+1):onChange(month+1,year); }}
        style={[styles.btn, isCur && {opacity:0.35}]}>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection:'row', alignItems:'center', gap:6 },
  btn:   { width:30, height:30, borderRadius:R.sm, backgroundColor:C.l2, alignItems:'center', justifyContent:'center' },
  arrow: { fontSize:18, color:C.t2, lineHeight:24 },
  mid:   { alignItems:'center', minWidth:76, gap:3 },
  label: { fontSize:12, fontWeight:'700', color:C.t1 },
});
