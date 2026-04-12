// src/screens/InsightsScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp } from '../store/AppContext';
import { Colors, Spacing, Radius } from '../constants/theme';
import { inr, pct, sipMaturity, calcScore, calcAlerts, MONTHS_SHORT } from '../utils/calculations';
import { Card, GradientCard, Chip, ProgressBar, SectionHeader, StatRow } from '../components/UIComponents';
import ScoreRing from '../components/ScoreRing';
import BarChart from '../components/BarChart';

const AICard = ({ icon, color, title, summary }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={[styles.aiTitle, { color: Colors.t3 }]}>{title}</Text>
    <View style={[styles.aiCard, { backgroundColor: color + '12', borderColor: color + '25' }]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[styles.aiText]}>{summary}</Text>
    </View>
  </View>
);

export default function InsightsScreen() {
  const { state: s } = useApp();

  const present   = s.attendance ? s.attendance.size : 0;
  const perDay    = s.salary / s.workingDays;
  const earned    = perDay * present;
  const sipTotal  = s.sips.reduce((a, x) => a + x.amount, 0);
  const debtEmi   = s.debts.reduce((a, d) => a + d.emi, 0);
  const debtPaid  = s.debts.reduce((a, d) => a + (d.amount - d.remaining), 0);
  const debtTotal = s.debts.reduce((a, d) => a + d.amount, 0);
  const manTotal  = s.manualExpenses.reduce((a, e) => a + e.amount, 0);
  const totalAss  = s.assets.reduce((a, x) => a + x.value, 0);
  const totalDebt = s.debts.reduce((a, d) => a + d.remaining, 0);
  const spendEst  = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);
  const savePct   = Math.max(0, Math.round(((earned - spendEst - debtEmi - sipTotal) / Math.max(earned, 1)) * 100));
  const score     = useMemo(() => calcScore(s), [s]);

  const bars   = s.monthlyData.slice(0, s.currentMonth + 1).map((v, i) => ({ v, l: MONTHS_SHORT[i] })).slice(-6);
  const sbars  = s.spendData.slice(0, s.currentMonth + 1).map((v, i) => ({ v, l: MONTHS_SHORT[i] })).slice(-6);

  const scoreColor = score.total >= 80 ? Colors.green : score.total >= 65 ? Colors.teal : score.total >= 50 ? Colors.blue : score.total >= 35 ? Colors.amber : Colors.red;
  const scoreLabel = score.total >= 90 ? 'Outstanding 🌟' : score.total >= 80 ? 'Excellent 🔥' : score.total >= 70 ? 'Great 💪' : score.total >= 55 ? 'Good 👍' : 'Fair ⚠️';

  // Simulated AI insights (in real app, these would be live Claude API calls)
  const aiInsights = [
    { icon: '💡', color: Colors.blue,   title: 'SPENDING',    summary: `Your Wants spending is ${s.expenses.find((e) => e.label === 'Wants')?.pct || 30}% of salary. Reducing to 25% would free up ${inr(s.salary * 5 / 100)}/month — that's ${inr(s.salary * 5 / 100 * 12)}/year you could invest.` },
    { icon: '📈', color: Colors.green,  title: 'INVESTMENT',  summary: `With ${s.sips.length} SIP${s.sips.length !== 1 ? 's' : ''} totaling ${inr(sipTotal)}/mo, your estimated 1-year corpus is ${inr(s.sips.reduce((a, x) => a + sipMaturity(x.amount, 12, x.returns), 0))}. Consider a 10% annual step-up for 40% more corpus in 5 years.` },
    { icon: '🏦', color: Colors.amber,  title: 'DEBT STRATEGY', summary: s.debts.length > 0 ? `Your highest-rate debt is ${s.debts.reduce((a, d) => d.rate > a.rate ? d : a, s.debts[0]).name} at ${s.debts.reduce((a, d) => d.rate > a.rate ? d : a, s.debts[0]).rate}%. Paying ₹2,000 extra per month could save months of interest — use the Avalanche method.` : 'You have no active debts — excellent! Consider redirecting EMI savings into SIPs for accelerated wealth building.' },
    { icon: '🚀', color: Colors.purple, title: 'CAREER',       summary: `At ${s.userAge || 28} years old with NEBOSH & IOSH certifications, you are positioned for a Senior HSE role. A job switch at 35-40% hike would net you ${inr(s.salary * 0.375)}/month extra — ${inr(s.salary * 0.375 * 12)}/year.` },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Insights</Text>
        <Text style={styles.pageSub}>Analytics · Risk · Patterns</Text>
      </View>

      {/* SCORE FULL */}
      <Card style={styles.section}>
        <SectionHeader title="Financial Health Score" />
        <View style={styles.scoreRow}>
          <ScoreRing score={score.total} color={scoreColor} size={110} strokeWidth={10} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            {score.breakdown.map((b) => (
              <View key={b.label} style={{ marginBottom: 8 }}>
                <View style={styles.scoreBreakRow}>
                  <Text style={styles.scoreBreakLabel}>{b.label}</Text>
                  <Text style={[styles.scoreBreakVal, { color: Colors.blue }]}>{b.score}/{b.max}</Text>
                </View>
                <ProgressBar value={b.score} total={b.max} color={Colors.blue} height={4} />
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* RISK ANALYSIS */}
      {(s.debts.some((d) => d.rate >= 24) || s.sips.length === 1) && (
        <GradientCard colors={['#1f0a0a', '#3d0a0a']} style={styles.section}>
          <SectionHeader title="⚠️ Risk Analysis" rightColor={Colors.red} />
          {s.debts.filter((d) => d.rate >= 24).map((d, i) => (
            <View key={i} style={[styles.riskRow, { backgroundColor: Colors.redDim, borderColor: Colors.red + '28' }]}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
              <Text style={[styles.riskText, { color: Colors.red }]}><Text style={{ fontWeight: '700' }}>{d.name}</Text> at {d.rate}% — clear this before investing more.</Text>
            </View>
          ))}
          {s.sips.length === 1 && (
            <View style={[styles.riskRow, { backgroundColor: Colors.amberDim, borderColor: Colors.amber + '28' }]}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={[styles.riskText, { color: Colors.amber }]}>Single fund risk — diversify across 2-3 funds for stability.</Text>
            </View>
          )}
        </GradientCard>
      )}

      {/* TRANSACTIONS */}
      {s.transactions?.length > 0 && (
        <Card style={styles.section}>
          <SectionHeader title="Recent Transactions" />
          {s.transactions.slice(0, 5).map((t, i) => (
            <View key={i} style={[styles.txRow, i < 4 && styles.txBorder]}>
              <View style={[styles.txIcon, { backgroundColor: t.type === 'income' ? Colors.greenDim : Colors.layer2 }]}>
                <Text style={{ fontSize: 15 }}>{t.icon || '💳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{t.desc}</Text>
                <Text style={styles.txDate}>{t.date}</Text>
              </View>
              <Text style={[styles.txAmt, { color: t.type === 'income' ? Colors.green : Colors.t1 }]}>
                {t.type === 'income' ? '+' : '-'}{inr(t.amount)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* AI ADVISOR */}
      <View style={styles.section}>
        <View style={styles.aiHeader}>
          <View style={styles.aiHeaderIcon}><Text style={{ fontSize: 14 }}>🤖</Text></View>
          <Text style={styles.aiHeaderTitle}>AI Advisor</Text>
          <Chip label="Smart insights" color={Colors.green} dot />
        </View>
        {aiInsights.map((c, i) => <AICard key={i} {...c} />)}
      </View>

      {/* KPI STRIP */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: Spacing.md, marginBottom: 12 }} contentContainerStyle={{ gap: 10, paddingRight: Spacing.md }}>
        {[
          { icon: '💰', label: 'Avg Save',    val: inr(s.monthlyData.reduce((a, v, i) => a + (v - s.spendData[i]), 0) / 12), color: Colors.green  },
          { icon: '📊', label: 'Save Rate',   val: `${savePct}%`,                                                              color: Colors.blue   },
          { icon: '🏦', label: 'Debt Cleared',val: `${pct(debtPaid, debtTotal)}%`,                                             color: Colors.amber  },
          { icon: '📈', label: 'SIP Corpus',  val: inr(s.sips.reduce((a, x) => a + sipMaturity(x.amount, x.months, x.returns), 0)), color: Colors.purple },
        ].map((c, i) => (
          <Card key={i} style={{ padding: Spacing.md, minWidth: 135 }}>
            <Text style={{ fontSize: 20, marginBottom: 7 }}>{c.icon}</Text>
            <Text style={styles.kpiLabel}>{c.label}</Text>
            <Text style={[styles.kpiVal, { color: c.color }]}>{c.val}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* CHARTS */}
      <Card style={styles.section}>
        <View style={styles.chartHeaderRow}>
          <SectionHeader title="Earnings (YTD)" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.chartTotal, { color: Colors.green }]}>{inr(s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0))}</Text>
            <Text style={styles.chartSub}>total</Text>
          </View>
        </View>
        <BarChart data={bars} color={Colors.blue} height={64} />
      </Card>

      <Card style={styles.section}>
        <SectionHeader title="Spending Trend" />
        <BarChart data={sbars} color={Colors.amber} height={56} />
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={s.spendData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0)} total={s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0)} color={Colors.red} height={5} />
          <Text style={styles.spendPct}>{pct(s.spendData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0), s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0))}% of income spent YTD</Text>
        </View>
      </Card>

      {/* LEAVE */}
      <Card style={styles.section}>
        <SectionHeader title="Leave Balance" />
        {s.leaves.map((l, i) => (
          <View key={i} style={[styles.leaveItem, i < s.leaves.length - 1 && styles.leaveBorder]}>
            <View style={styles.leaveHeader}>
              <Text style={styles.leaveLabel}>{l.label} ({l.type})</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.leaveVal}>{l.total - l.used} <Text style={styles.leaveValSub}>/ {l.total} left</Text></Text>
                {l.total - l.used === 0 && <Text style={{ color: Colors.red, fontSize: 11 }}>Exhausted</Text>}
              </View>
            </View>
            <ProgressBar value={l.total - l.used} total={l.total} color={l.total - l.used <= 1 ? Colors.red : Colors.green} height={5} />
          </View>
        ))}
      </Card>

      {/* NET WORTH */}
      <Card style={styles.section}>
        <SectionHeader title="Net Worth" />
        <View style={styles.nwChips}>
          <Chip label={`Assets: ${inr(totalAss)}`}  color={Colors.green} size="md" />
          <Chip label={`Debts: ${inr(totalDebt)}`}   color={Colors.red}   size="md" />
        </View>
        {s.assets.map((a, i) => (
          <View key={i} style={[styles.nwRow, i < s.assets.length - 1 && styles.nwBorder]}>
            <Text style={styles.nwLabel}>{a.label}</Text>
            <Text style={[styles.nwVal, { color: Colors.green }]}>{inr(a.value)}</Text>
          </View>
        ))}
        <View style={styles.nwTotal}>
          <Text style={styles.nwTotalLabel}>Net Worth</Text>
          <Text style={[styles.nwTotalVal, { color: Colors.green }]}>{inr(totalAss - totalDebt)}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  header:          { paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  pageTitle:       { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: Colors.t1, letterSpacing: -0.5 },
  pageSub:         { fontSize: 13, color: Colors.t3, marginTop: 2 },
  section:         { marginHorizontal: Spacing.md, marginBottom: 12 },
  scoreRow:        { flexDirection: 'row', gap: 16, alignItems: 'center' },
  scoreLabel:      { fontFamily: 'Syne_700Bold', fontSize: 16, marginBottom: 10 },
  scoreBreakRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  scoreBreakLabel: { fontSize: 11, color: Colors.t3 },
  scoreBreakVal:   { fontSize: 11, fontWeight: '600' },
  riskRow:         { flexDirection: 'row', gap: 9, padding: Spacing.sm + 2, borderRadius: 11, borderWidth: 1, marginBottom: 7, alignItems: 'flex-start' },
  riskText:        { fontSize: 12, lineHeight: 18, flex: 1 },
  txRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  txBorder:        { borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon:          { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:          { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  txDate:          { fontSize: 11, color: Colors.t3, marginTop: 1 },
  txAmt:           { fontFamily: 'Syne_700Bold', fontSize: 13 },
  aiHeader:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginHorizontal: Spacing.md },
  aiHeaderIcon:    { width: 28, height: 28, borderRadius: 9, backgroundColor: Colors.blue + '20', alignItems: 'center', justifyContent: 'center' },
  aiHeaderTitle:   { fontFamily: 'Syne_700Bold', fontSize: 14, color: Colors.t1 },
  aiCard:          { flexDirection: 'row', gap: 10, borderRadius: 15, padding: Spacing.sm + 6, borderWidth: 1, alignItems: 'flex-start' },
  aiTitle:         { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, marginBottom: 4, paddingLeft: 2, textTransform: 'uppercase' },
  aiText:          { flex: 1, fontSize: 13, color: Colors.t2, lineHeight: 19 },
  kpiLabel:        { fontSize: 10, fontWeight: '500', color: Colors.t3, marginBottom: 2 },
  kpiVal:          { fontFamily: 'Syne_800ExtraBold', fontSize: 18 },
  chartHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartTotal:      { fontFamily: 'Syne_800ExtraBold', fontSize: 17 },
  chartSub:        { fontSize: 11, color: Colors.t3 },
  spendPct:        { fontSize: 11, color: Colors.t3, marginTop: 5 },
  leaveItem:       { paddingVertical: 14 },
  leaveBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  leaveHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  leaveLabel:      { fontSize: 13, color: Colors.t2 },
  leaveVal:        { fontSize: 13, fontWeight: '700', color: Colors.t1 },
  leaveValSub:     { fontWeight: '400', color: Colors.t3 },
  nwChips:         { flexDirection: 'row', gap: 7, marginBottom: 14, flexWrap: 'wrap' },
  nwRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  nwBorder:        { borderBottomWidth: 1, borderBottomColor: Colors.border },
  nwLabel:         { fontSize: 13, color: Colors.t2 },
  nwVal:           { fontWeight: '700', fontSize: 13 },
  nwTotal:         { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  nwTotalLabel:    { fontFamily: 'Syne_700Bold', fontSize: 14, color: Colors.t1 },
  nwTotalVal:      { fontFamily: 'Syne_800ExtraBold', fontSize: 19 },
});
