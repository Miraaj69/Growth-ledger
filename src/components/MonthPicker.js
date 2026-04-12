// src/components/MonthPicker.js
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Chip } from './UIComponents';
import { MONTHS_SHORT } from '../utils/calculations';

export default function MonthPicker({ month, year, onChange }) {
  const now    = new Date();
  const isCur  = month === now.getMonth() && year === now.getFullYear();

  const prev = () => {
    if (month === 0) onChange(11, year - 1);
    else onChange(month - 1, year);
  };

  const next = () => {
    if (isCur) return;
    if (month === 11) onChange(0, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={prev} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <View style={styles.mid}>
        <Text style={styles.label}>{MONTHS_SHORT[month]} {year}</Text>
        {isCur && <Chip label="Now" color={Colors.green} dot />}
      </View>
      <Pressable onPress={next} style={[styles.arrow, isCur && styles.arrowDisabled]}>
        <Text style={[styles.arrowText, isCur && { color: Colors.t4 }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  arrow:         { width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: Colors.layer2, alignItems: 'center', justifyContent: 'center' },
  arrowDisabled: { opacity: 0.4 },
  arrowText:     { fontSize: 18, color: Colors.t2, lineHeight: 24 },
  mid:           { alignItems: 'center', minWidth: 82, gap: 3 },
  label:         { fontFamily: 'Syne_700Bold', fontSize: 12, color: Colors.t1 },
});
