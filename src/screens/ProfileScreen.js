// src/screens/ProfileScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../store/AppContext';
import { Colors, Spacing, Radius } from '../constants/theme';
import { inr, pct, calcScore } from '../utils/calculations';
import { Card, GradientCard, Chip, ProgressBar, SectionHeader, Toggle } from '../components/UIComponents';
import ScoreRing from '../components/ScoreRing';
import { clearState } from '../utils/storage';

export default function ProfileScreen() {
  const { state: s, set, dispatch } = useApp();

  const score        = useMemo(() => calcScore(s), [s]);
  const scoreColor   = score.total >= 80 ? Colors.green : score.total >= 65 ? Colors.teal : score.total >= 50 ? Colors.blue : score.total >= 35 ? Colors.amber : Colors.red;
  const done         = s.certifications.filter((c) => c.status === 'Done').length;
  const totalInc     = s.incomes.reduce((a, x) => a + x.amount, 0);
  const achievements = useMemo(() => {
    const totalSaved = s.goals.reduce((a, g) => a + g.saved, 0);
    const sipTotal   = s.sips.reduce((a, x) => a + x.amount, 0);
    const debtPaid   = s.debts.reduce((a, d) => a + (d.amount - d.remaining), 0);
    const certsDone  = s.certifications.filter((c) => c.status === 'Done').length;
    const present    = s.attendance ? s.attendance.size : 0;
    return [
      { icon: '🥇', label: 'Saver',      desc: 'Saved ₹1L+',    unlocked: totalSaved >= 100000,            color: Colors.amber  },
      { icon: '📈', label: 'Investor',   desc: 'Started SIP',   unlocked: sipTotal > 0,                     color: Colors.green  },
      { icon: '💪', label: 'Debt Buster',desc: 'Paid ₹50K',     unlocked: debtPaid >= 50000,                color: Colors.blue   },
      { icon: '🎓', label: 'Certified',  desc: '2+ certs',      unlocked: certsDone >= 2,                   color: Colors.purple },
      { icon: '🔥', label: 'Consistent', desc: '20+ days',      unlocked: present >= 20,                    color: Colors.red    },
      { icon: '👑', label: 'Elite',      desc: 'Score 85+',     unlocked: score.total >= 85,                color: Colors.amber  },
      { icon: '🎯', label: 'Planner',    desc: '3 goals',       unlocked: s.goals.length >= 3,              color: Colors.teal   },
      { icon: '💎', label: 'Debt-Free',  desc: 'Zero debt',     unlocked: s.debts.every((d) => d.remaining === 0), color: Colors.pink },
      { icon: '🚀', label: 'High Earner',desc: '>₹1L income',  unlocked: totalInc >= 100000,                color: Colors.blue   },
    ];
  }, [s, score, totalInc]);

  const handleExport = async () => {
    try {
      const data = JSON.stringify({ ...s, attendance: [...(s.attendance || [])] }, null, 2);
      await Share.share({ message: data, title: 'Growth Ledger Backup' });
    } catch (e) {
      Alert.alert('Export failed', e.message);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset All Data', 'This will delete all your financial data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { await clearState(); dispatch({ type: 'RESET' }); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>

      {/* HERO */}
      <LinearGradient colors={['#0c1a3a', '#1a3a78']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={styles.heroName}>HSE Professional</Text>
        <Text style={styles.heroSub}>Safety Officer · Age {s.userAge || 28}</Text>
        <View style={styles.heroChips}>
          <Chip label={`Score: ${score.total}/100`} color={scoreColor} dot size="md" />
          <Chip label={`Lv ${s.level || 1} · ${s.xpTotal || 0} XP`} color={Colors.amber} size="md" />
        </View>
        <View style={styles.heroChips}>
          <Chip label="NEBOSH" color={Colors.green} />
          <Chip label="IOSH MS" color={Colors.blue} />
        </View>
        {s.lastSaved && <Text style={styles.savedText}>✓ Auto-saved · {s.lastSaved}</Text>}
      </LinearGradient>

      {/* STAT GRID */}
      <View style={styles.statGrid}>
        {[
          { icon: '💰', label: 'Income',  val: `₹${(totalInc / 1000).toFixed(0)}K`             },
          { icon: '📊', label: 'SIPs',    val: s.sips.length                                    },
          { icon: '🎓', label: 'Certs',   val: `${done}/${s.certifications.length}`             },
        ].map((st, i) => (
          <Card key={i} style={styles.statCard}>
            <Text style={{ fontSize: 22, marginBottom: 5 }}>{st.icon}</Text>
            <Text style={styles.statVal}>{st.val}</Text>
            <Text style={styles.statLabel}>{st.label}</Text>
          </Card>
        ))}
      </View>

      {/* ACHIEVEMENTS */}
      <Card style={styles.section}>
        <SectionHeader title="Achievements" right={`${achievements.filter((a) => a.unlocked).length}/${achievements.length}`} rightColor={Colors.amber} />
        <View style={styles.achieveGrid}>
          {achievements.map((a, i) => (
            <View key={i} style={styles.achieveItem}>
              <View style={[styles.achieveIcon, { backgroundColor: a.unlocked ? a.color + '20' : Colors.layer2, borderColor: a.unlocked ? a.color + '40' : Colors.border, opacity: a.unlocked ? 1 : 0.3 }]}>
                <Text style={{ fontSize: 20 }}>{a.icon}</Text>
              </View>
              <Text style={[styles.achieveLabel, { color: a.unlocked ? Colors.t2 : Colors.t3 }]}>{a.label}</Text>
              <Text style={styles.achieveDesc}>{a.desc}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* PRIVACY */}
      <Card style={styles.section}>
        <SectionHeader title="Privacy & Security" />
        {[
          { key: 'maskAmounts',    icon: '👁️', label: 'Mask Amounts',    sub: 'Hide numbers in public' },
          { key: 'biometricLock', icon: '🔐', label: 'Biometric Lock',  sub: 'Face ID / Fingerprint'  },
        ].map((n, i) => (
          <View key={n.key} style={[styles.settingRow, i === 0 && styles.settingBorder]}>
            <View style={styles.settingLeft}>
              <Text style={{ fontSize: 19 }}>{n.icon}</Text>
              <View>
                <Text style={styles.settingLabel}>{n.label}</Text>
                <Text style={styles.settingSub}>{n.sub}</Text>
              </View>
            </View>
            <Toggle value={s[n.key] || false} onChange={() => set({ [n.key]: !s[n.key] })} />
          </View>
        ))}
      </Card>

      {/* REMINDERS */}
      <Card style={styles.section}>
        <SectionHeader title="Reminders" />
        {[
          { key: 'salary', icon: '💰', label: 'Salary Day Reminder'  },
          { key: 'sip',    icon: '📈', label: 'SIP Investment Alert'  },
          { key: 'emi',    icon: '🏦', label: 'EMI Due Date Alert'    },
          { key: 'weekly', icon: '📊', label: 'Weekly AI Report'      },
        ].map((n, i, arr) => (
          <View key={n.key} style={[styles.settingRow, i < arr.length - 1 && styles.settingBorder]}>
            <View style={styles.settingLeft}>
              <Text style={{ fontSize: 19 }}>{n.icon}</Text>
              <Text style={styles.settingLabel}>{n.label}</Text>
            </View>
            <Toggle value={(s.notifs || {})[n.key] !== false} onChange={() => set({ notifs: { ...(s.notifs || {}), [n.key]: !(s.notifs || {})[n.key] } })} />
          </View>
        ))}
      </Card>

      {/* ACTIONS */}
      <Card style={styles.section}>
        <SectionHeader title="Data & Actions" />
        {[
          { icon: '💾', label: 'Export JSON Backup',   right: '↓ Save',  action: handleExport },
          { icon: '🎯', label: 'Set Financial Goals',  right: '→'                             },
          { icon: '🔄', label: 'Reset All Data',       right: 'Reset',   action: handleReset  },
          { icon: 'ℹ️', label: 'About Growth Ledger',  right: 'v6.0'                          },
        ].map((it, i, arr) => (
          <Pressable key={i} onPress={it.action} style={[styles.actionRow, i < arr.length - 1 && styles.settingBorder]}>
            <View style={styles.settingLeft}>
              <Text style={{ fontSize: 19 }}>{it.icon}</Text>
              <Text style={styles.settingLabel}>{it.label}</Text>
            </View>
            <Text style={[styles.actionRight, it.action && { color: Colors.blue }]}>{it.right}</Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  pageTitle:    { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: Colors.t1, letterSpacing: -0.5 },
  heroCard:     { marginHorizontal: Spacing.md, marginBottom: 12, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  avatar:       { width: 76, height: 76, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  heroName:     { fontFamily: 'Syne_800ExtraBold', fontSize: 21, color: Colors.t1, marginBottom: 3 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  heroChips:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 7 },
  savedText:    { fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 8 },
  statGrid:     { flexDirection: 'row', gap: 8, marginHorizontal: Spacing.md, marginBottom: 12 },
  statCard:     { flex: 1, padding: Spacing.sm + 6, alignItems: 'center' },
  statVal:      { fontFamily: 'Syne_800ExtraBold', fontSize: 17, color: Colors.t1 },
  statLabel:    { fontSize: 10, color: Colors.t3, marginTop: 2 },
  section:      { marginHorizontal: Spacing.md, marginBottom: 12 },
  achieveGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achieveItem:  { width: '28%', alignItems: 'center' },
  achieveIcon:  { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 5 },
  achieveLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  achieveDesc:  { fontSize: 9, color: Colors.t3, textAlign: 'center', marginTop: 1 },
  settingRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  settingBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingLeft:  { flexDirection: 'row', gap: 11, alignItems: 'center', flex: 1 },
  settingLabel: { fontSize: 14, color: Colors.t1 },
  settingSub:   { fontSize: 12, color: Colors.t3 },
  actionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  actionRight:  { fontSize: 13, color: Colors.t3 },
});
