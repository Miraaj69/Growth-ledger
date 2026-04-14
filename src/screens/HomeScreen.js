// src/screens/HomeScreen.js
import React, { useMemo, useState } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../store/AppContext';
import { Colors, Spacing, Radius, Typography, Shadows } from '../constants/theme';
import {
  inr, pct, calcScore, calcPersonality, calcAlerts, calcNextAction,
  calcDecisions, MONTHS_SHORT, sipMaturity,
} from '../utils/calculations';
import { Card, GradientCard, Chip, ProgressBar, SectionHeader, EmptyState } from '../components/UIComponents';
import ScoreRing from '../components/ScoreRing';
import DonutChart from '../components/DonutChart';
import BarChart from '../components/BarChart';
import MonthPicker from '../components/MonthPicker';

export default function HomeScreen({ navigation }) {
  const { state: s, dispatch, set } = useApp();
  const [colStreak,  setColStreak]  = useState(false);
  const [colAchieve, setColAchieve] = useState(false);
  const [colGoals,   setColGoals]   = useState(false);

  const present   = s.attendance ? s.attendance.size : 0;
  const perDay    = s.salary / s.workingDays;
  const earned    = perDay * present;
  const sipTotal  = s.sips.reduce((a, x) => a + x.amount, 0);
  const debtEmi   = s.debts.reduce((a, d) => a + d.emi, 0);
  const expNeeds  = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);
  const realBal   = Math.max(0, earned - expNeeds - debtEmi - sipTotal);
  const totalDebt = s.debts.reduce((a, d) => a + d.remaining, 0);
  const totalAss  = s.assets.reduce((a, x) => a + x.value, 0);
  const totalInc  = s.incomes.reduce((a, x) => a + x.amount, 0);
  const mask      = s.maskAmounts;

  const score       = useMemo(() => calcScore(s),       [s]);
  const personality = useMemo(() => calcPersonality(s), [s]);
  const alerts      = useMemo(() => calcAlerts(s),      [s]);
  const nextAction  = useMemo(() => calcNextAction(s),  [s]);

  const bars = s.monthlyData
    .slice(0, s.currentMonth + 1)
    .map((v, i) => ({ v, l: MONTHS_SHORT[i] }))
    .slice(-6);

  const xpForNext = 2000;
  const xpPct     = Math.min(100, ((s.xpTotal || 0) / xpForNext) * 100);

  const achievements = useMemo(() => {
    const totalSaved = s.goals.reduce((a, g) => a + g.saved, 0);
    const debtPaid   = s.debts.reduce((a, d) => a + (d.amount - d.remaining), 0);
    const certsDone  = s.certifications.filter((c) => c.status === 'Done').length;
    return [
      { icon: '🥇', label: 'Saver',      desc: 'Saved ₹1L+',    unlocked: totalSaved >= 100000,               color: Colors.amber  },
      { icon: '📈', label: 'Investor',   desc: 'Started SIP',   unlocked: sipTotal > 0,                        color: Colors.green  },
      { icon: '💪', label: 'Debt Buster',desc: 'Paid ₹50K',     unlocked: debtPaid >= 50000,                   color: Colors.blue   },
      { icon: '🎓', label: 'Certified',  desc: '2+ certs',      unlocked: certsDone >= 2,                      color: Colors.purple },
      { icon: '🔥', label: 'Consistent', desc: '20+ days',      unlocked: present >= 20,                       color: Colors.red    },
      { icon: '👑', label: 'Elite',      desc: 'Score 85+',     unlocked: score.total >= 85,                   color: Colors.amber  },
    ];
  }, [s, score, sipTotal, present]);

  const streaks = [
    { icon: '📅', label: 'Attendance',  value: present,       unit: 'days',   color: Colors.blue,  active: present >= 15 },
    { icon: '📈', label: 'SIP Active',  value: s.sips.length, unit: 'funds',  color: Colors.green, active: sipTotal > 0  },
    { icon: '💪', label: 'On Budget',   value: (s.expenses.find((e) => e.label === 'Wants')?.pct || 30) <= 30 ? 3 : 0, unit: 'months', color: Colors.amber, active: (s.expenses.find((e) => e.label === 'Wants')?.pct || 30) <= 30 },
    { icon: '🔥', label: 'Login Streak',value: s.loginStreak || 1, unit: 'days', color: Colors.red, active: (s.loginStreak || 1) >= 3 },
  ];

  const goalDeadlineMonths = (deadline) => {
    if (!deadline) return 12;
    const ms = new Date(deadline) - new Date();
    return Math.max(1, Math.round(ms / 1000 / 60 / 60 / 24 / 30));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.appName}>GROWTH LEDGER</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv {s.level || 1}</Text>
            </View>
          </View>
          <Text style={styles.pageTitle}>Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('Calendar')} style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>📅</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('AIChat')} style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </Pressable>
          <MonthPicker
            month={s.currentMonth}
            year={s.currentYear}
            onChange={(m, y) => set({ currentMonth: m, currentYear: y, attendance: new Set() })}
          />
        </View>
      </View>

      {/* XP BAR */}
      <View style={styles.xpWrap}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>XP · Level {s.level || 1}</Text>
          <Text style={styles.xpVal}>{s.xpTotal || 0} / {xpForNext} XP</Text>
        </View>
        <ProgressBar value={s.xpTotal || 0} total={xpForNext} color={Colors.amber} height={4} />
      </View>

      {/* HERO EARNED */}
      <GradientCard colors={['#0b1f52', '#1a3a82', '#1e4fa0']} style={styles.heroCard}>
        <View style={styles.heroBubble} />
        <Text style={styles.heroSub}>Earned This Month</Text>
        <Text style={styles.heroAmount}>{mask ? '₹••,•••' : inr(earned)}</Text>
        <Text style={styles.heroMeta}>
          of {mask ? '₹••,•••' : inr(s.salary)} · {present}/{s.workingDays} days
        </Text>
        <ProgressBar value={present} total={s.workingDays} color="rgba(255,255,255,0.6)" height={4} />
        <View style={styles.heroStats}>
          {[
            { l: 'Per Day', v: inr(perDay),                              c: 'rgba(255,255,255,0.85)' },
            { l: 'Lost',    v: inr((s.workingDays - present) * perDay),  c: '#fca5a5'                },
            { l: 'Balance', v: inr(realBal),                             c: '#86efac'                },
          ].map(({ l, v, c }) => (
            <View key={l}>
              <Text style={styles.heroStatLabel}>{l}</Text>
              <Text style={[styles.heroStatVal, { color: c }]}>{mask ? '₹••' : v}</Text>
            </View>
          ))}
        </View>
      </GradientCard>

      {/* SCORE + PERSONALITY */}
      <View style={styles.row2}>
        <Card style={[styles.halfCard, { paddingBottom: Spacing.sm }]}>
          <Text style={styles.cardLabel}>HEALTH SCORE</Text>
          <View style={styles.scoreRow}>
            <ScoreRing score={score.total} color={
              score.total >= 80 ? Colors.green :
              score.total >= 65 ? Colors.teal  :
              score.total >= 50 ? Colors.blue  :
              score.total >= 35 ? Colors.amber : Colors.red
            } size={70} strokeWidth={7}/>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={[styles.scoreLabel, { color:
                score.total >= 80 ? Colors.green :
                score.total >= 65 ? Colors.teal  :
                score.total >= 50 ? Colors.blue  :
                score.total >= 35 ? Colors.amber : Colors.red
              }]} numberOfLines={2}>
                {score.total >= 90 ? 'Outstanding 🌟' : score.total >= 80 ? 'Excellent 🔥' : score.total >= 70 ? 'Great 💪' : score.total >= 55 ? 'Good 👍' : 'Fair ⚠️'}
              </Text>
              {score.breakdown.slice(0, 3).map((b) => (
                <ProgressBar key={b.label} value={b.score} total={b.max} color={b.color} height={3} />
              ))}
            </View>
          </View>
        </Card>

        <LinearGradient
          colors={[personality.color + '15', personality.color + '08']}
          style={[styles.halfCard, { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.cardLabel}>PERSONALITY</Text>
          <Text style={[styles.personalityType, { color: personality.color }]}>{personality.type}</Text>
          <Text style={styles.personalityDesc} numberOfLines={2}>{personality.desc}</Text>
        </LinearGradient>
      </View>

      {/* NEXT ACTION */}
      <Pressable onPress={() => navigation.navigate('AIChat')} style={[styles.actionCard, { borderColor: nextAction.color + '30', backgroundColor: nextAction.color + '10' }]}>
        <View style={[styles.actionIconWrap, { backgroundColor: nextAction.color + '20' }]}>
          <Text style={{ fontSize: 20 }}>{nextAction.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionLabel, { color: nextAction.color }]}>NEXT ACTION</Text>
          <Text style={styles.actionTitle}>{nextAction.action}</Text>
          <Text style={styles.actionDetail} numberOfLines={2}>{nextAction.detail}</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </Pressable>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader title="Smart Alerts" right={`${alerts.length}`} rightColor={Colors.red} />
          {alerts.slice(0, 3).map((a, i) => (
            <View key={i} style={[styles.alertRow, { backgroundColor: a.color + '10', borderColor: a.color + '25' }]}>
              <Text style={styles.alertIcon}>{a.icon}</Text>
              <Text style={[styles.alertMsg, { color: a.color }]}>{a.msg}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* NET WORTH + INCOME */}
      <View style={styles.row2}>
        <LinearGradient colors={['#052e16', '#064e30']} style={[styles.halfCard, { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl }]}>
          <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.4)' }]}>Net Worth</Text>
          <Text style={[styles.halfCardVal, { color: Colors.green }]}>{mask ? '₹•L' : inr(totalAss - totalDebt)}</Text>
          <Text style={[styles.halfCardSub, { color: 'rgba(255,255,255,0.28)' }]}>Assets − Debts</Text>
        </LinearGradient>
        <Card style={styles.halfCard}>
          <Text style={styles.cardLabel}>Monthly Income</Text>
          <Text style={[styles.halfCardVal, { color: Colors.blue }]}>{inr(totalInc)}</Text>
          <Text style={styles.halfCardSub}>{s.incomes.length} source{s.incomes.length !== 1 ? 's' : ''}</Text>
        </Card>
      </View>

      {/* QUICK STATS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hscroll} contentContainerStyle={{ gap: 10, paddingRight: Spacing.md }}>
        {[
          { icon: '📈', label: 'SIP/mo',   val: inr(sipTotal),  color: Colors.green  },
          { icon: '🏦', label: 'EMI/mo',   val: inr(debtEmi),   color: Colors.red    },
          { icon: '🏖️', label: 'Leaves',   val: `${s.leaves.reduce((a,l)=>a+l.total,0)-s.leaves.reduce((a,l)=>a+l.used,0)} left`, color: Colors.amber },
          { icon: '💳', label: 'Debt',     val: inr(totalDebt), color: Colors.purple },
        ].map((c, i) => (
          <Card key={i} style={styles.quickCard}>
            <Text style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</Text>
            <Text style={styles.quickLabel}>{c.label}</Text>
            <Text style={[styles.quickVal, { color: c.color }]}>{c.val}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* STREAKS */}
      <Card style={styles.section}>
        <SectionHeader title="Streaks" right={colStreak ? 'Hide' : 'Show'} onRight={() => setColStreak(!colStreak)} />
        {!colStreak && (
          <View style={styles.grid2}>
            {streaks.map((st, i) => (
              <View key={i} style={[styles.streakCard, { backgroundColor: st.active ? st.color + '15' : Colors.layer2, borderColor: st.active ? st.color + '40' : Colors.border }]}>
                <View style={styles.streakIconRow}>
                  <Text style={{ fontSize: 16 }}>{st.icon}</Text>
                  {st.active && <View style={[styles.streakDot, { backgroundColor: st.color }]} />}
                </View>
                <Text style={[styles.streakVal, { color: st.active ? st.color : Colors.t3 }]}>
                  {st.value} <Text style={{ fontSize: 11 }}>{st.unit}</Text>
                </Text>
                <Text style={[styles.streakLabel, { color: st.active ? Colors.t2 : Colors.t3 }]}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* ACHIEVEMENTS */}
      <Card style={styles.section}>
        <SectionHeader
          title="Achievements"
          right={`${achievements.filter((a) => a.unlocked).length}/${achievements.length} · ${colAchieve ? 'Hide' : 'Show'}`}
          rightColor={Colors.amber}
          onRight={() => setColAchieve(!colAchieve)}
        />
        {!colAchieve && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {achievements.map((a, i) => (
              <View key={i} style={styles.achievement}>
                <View style={[styles.achieveIcon, {
                  backgroundColor: a.unlocked ? a.color + '20' : Colors.layer2,
                  borderColor:     a.unlocked ? a.color + '40' : Colors.border,
                  opacity:         a.unlocked ? 1 : 0.3,
                }]}>
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                </View>
                <Text style={[styles.achieveLabel, { color: a.unlocked ? Colors.t2 : Colors.t3 }]}>{a.label}</Text>
                <Text style={styles.achieveDesc}>{a.desc}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </Card>

      {/* EXPENSE DONUT */}
      <Card style={styles.section}>
        <SectionHeader title="Expense Split" />
        <View style={styles.donutRow}>
          <DonutChart
            segments={s.expenses.map((e) => ({ pct: e.pct, color: e.color }))}
            centerLabel={inr(s.salary)}
          />
          <View style={{ flex: 1 }}>
            {s.expenses.map((e, i) => (
              <View key={i} style={styles.donutLegendRow}>
                <View style={styles.donutLegendLeft}>
                  <View style={[styles.dot, { backgroundColor: e.color }]} />
                  <Text style={styles.donutLegendLabel}>{e.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.donutLegendVal, { color: e.color }]}>{inr(s.salary * e.pct / 100)}</Text>
                  <Text style={styles.donutLegendPct}>{e.pct}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* GOALS */}
      <Card style={styles.section}>
        <SectionHeader
          title="Financial Goals"
          right={colGoals ? 'Hide' : 'Show'}
          onRight={() => setColGoals(!colGoals)}
        />
        {!colGoals && s.goals.map((g, i) => {
          const monthsLeft = goalDeadlineMonths(g.deadline);
          const reqSave    = monthsLeft > 0 ? Math.max(0, Math.round((g.target - g.saved) / monthsLeft)) : 0;
          return (
            <View key={i} style={[styles.goalItem, i < s.goals.length - 1 && styles.goalBorder]}>
              <View style={styles.goalHeader}>
                <View>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  {g.linked && <Chip label={`← ${g.linked}`} color={g.color} />}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.goalPct, { color: g.color }]}>{pct(g.saved, g.target)}%</Text>
                  {g.deadline && <Text style={styles.goalEta}>{monthsLeft} mo left</Text>}
                </View>
              </View>
              <ProgressBar value={g.saved} total={g.target} color={g.color} height={5} />
              <View style={styles.goalFooter}>
                <Text style={styles.goalAmt}>{inr(g.saved)}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.goalAmt}>{inr(g.target)}</Text>
                  {reqSave > 0 && <Text style={[styles.goalReq, { color: g.color }]}>Save {inr(reqSave)}/mo</Text>}
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      {/* TREND CHART */}
      <Card style={styles.section}>
        <View style={styles.chartHeader}>
          <SectionHeader title="Earnings Trend" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.chartTotal, { color: Colors.green }]}>
              {inr(s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0))}
            </Text>
            <Text style={styles.chartSub}>YTD total</Text>
          </View>
        </View>
        <BarChart data={bars} color={Colors.blue} height={64} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  headerRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  headerActions:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName:         { fontSize: 12, fontWeight: '600', color: Colors.t3, letterSpacing: 0.5 },
  levelBadge:      { backgroundColor: Colors.amber + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  levelText:       { fontSize: 10, fontWeight: '700', color: Colors.amber },
  pageTitle:       { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: Colors.t1, letterSpacing: -0.5 },
  iconBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.blue + '20', borderWidth: 1, borderColor: Colors.blue + '33', alignItems: 'center', justifyContent: 'center' },
  xpWrap:          { marginHorizontal: Spacing.md, marginBottom: Spacing.sm + 4 },
  xpLabelRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpLabel:         { fontSize: 11, color: Colors.t3 },
  xpVal:           { fontSize: 11, fontWeight: '600', color: Colors.amber },
  heroCard:        { marginHorizontal: Spacing.md, marginBottom: 12, overflow: 'hidden' },
  heroBubble:      { position: 'absolute', top: -40, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroSub:         { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  heroAmount:      { fontFamily: 'Syne_800ExtraBold', fontSize: 38, color: '#fff', letterSpacing: -2, lineHeight: 44, marginBottom: 4 },
  heroMeta:        { fontSize: 13, color: 'rgba(255,255,255,0.32)', marginBottom: 14 },
  heroStats:       { flexDirection: 'row', gap: 20, marginTop: 16 },
  heroStatLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.32)', marginBottom: 2 },
  heroStatVal:     { fontFamily: 'Syne_700Bold', fontSize: 15 },
  row2:            { flexDirection: 'row', gap: 10, marginHorizontal: Spacing.md, marginBottom: 12 },
  halfCard:        { flex: 1, padding: Spacing.md, gap: 6 },
  cardLabel:       { fontSize: 10, fontWeight: '600', color: Colors.t3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  halfCardVal:     { fontFamily: 'Syne_800ExtraBold', fontSize: 20 },
  halfCardSub:     { fontSize: 10, color: Colors.t3, marginTop: 2 },
  scoreRow:        { flexDirection: 'row', gap: 10, alignItems: 'center' },
  scoreLabel:      { fontFamily: 'Syne_700Bold', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  personalityType: { fontFamily: 'Syne_800ExtraBold', fontSize: 13, lineHeight: 18 },
  personalityDesc: { fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 16, marginTop: 5 },
  actionCard:      { marginHorizontal: Spacing.md, marginBottom: 12, borderRadius: Radius.xl, padding: Spacing.md, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1 },
  actionIconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, marginBottom: 1 },
  actionTitle:     { fontWeight: '700', fontSize: 14, color: Colors.t1, marginBottom: 1 },
  actionDetail:    { fontSize: 12, color: Colors.t2, lineHeight: 17 },
  actionArrow:     { fontSize: 20, color: Colors.t3 },
  section:         { marginHorizontal: Spacing.md, marginBottom: 12 },
  alertRow:        { flexDirection: 'row', gap: 9, padding: 10, paddingHorizontal: 13, borderRadius: 11, borderWidth: 1, marginBottom: 7, alignItems: 'flex-start', paddingVertical: 10 },
  alertIcon:       { fontSize: 15 },
  alertMsg:        { fontSize: 12, lineHeight: 19, flex: 1 },
  hscroll:         { marginLeft: Spacing.md, marginBottom: 12 },
  quickCard:       { padding: Spacing.md, minWidth: 130 },
  quickLabel:      { fontSize: 10, fontWeight: '500', color: Colors.t3, marginBottom: 2 },
  quickVal:        { fontFamily: 'Syne_800ExtraBold', fontSize: 17 },
  grid2:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  streakCard:      { width: '47%', borderRadius: Radius.md + 2, padding: Spacing.sm + 4, borderWidth: 1 },
  streakIconRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  streakDot:       { width: 5, height: 5, borderRadius: 99 },
  streakVal:       { fontFamily: 'Syne_700Bold', fontSize: 17 },
  streakLabel:     { fontSize: 11, marginTop: 1 },
  achievement:     { width: 68, alignItems: 'center' },
  achieveIcon:     { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 5 },
  achieveLabel:    { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  achieveDesc:     { fontSize: 9, color: Colors.t3, textAlign: 'center', marginTop: 1 },
  donutRow:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegendRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  donutLegendLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot:             { width: 8, height: 8, borderRadius: 3 },
  donutLegendLabel:{ fontSize: 13, color: Colors.t2 },
  donutLegendVal:  { fontWeight: '700', fontSize: 13 },
  donutLegendPct:  { fontSize: 10, color: Colors.t3 },
  goalItem:        { paddingVertical: Spacing.md },
  goalBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.border },
  goalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  goalTitle:       { fontWeight: '600', fontSize: 14, color: Colors.t1, marginBottom: 4 },
  goalPct:         { fontWeight: '700', fontSize: 13 },
  goalEta:         { fontSize: 10, color: Colors.t3, marginTop: 1 },
  goalFooter:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  goalAmt:         { fontSize: 11, color: Colors.t3 },
  goalReq:         { fontSize: 10, marginTop: 1 },
  chartHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartTotal:      { fontFamily: 'Syne_800ExtraBold', fontSize: 17 },
  chartSub:        { fontSize: 11, color: Colors.t3 },
});
