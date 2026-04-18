// src/screens/InsightsScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp } from './AppContext';
import { C, S, R } from './theme';
import { fmt as inr, pct, sipMaturity, calcScore, calcAlerts, MONTHS_SHORT } from './calculations';
import { Card, GCard, Chip, Bar, SH, StatRow } from './UIComponents';
import ScoreRing from './ScoreRing';
import BarChart from './BarChart';

const AICard = ({ icon, color, title, summary }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={[styles.aiTitle, { color: C.t3 }]}>{title}</Text>
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

  const scoreColor = score.total >= 80 ? C.green : score.total >= 65 ? C.teal : score.total >= 50 ? C.blue : score.total >= 35 ? C.amber : C.red;
  const scoreLabel = score.total >= 90 ? 'Outstanding 🌟' : score.total >= 80 ? 'Excellent 🔥' : score.total >= 70 ? 'Great 💪' : score.total >= 55 ? 'Good 👍' : 'Fair ⚠️';

  // Simulated AI insights (in real app, these would be live Claude API calls)
  const aiInsights = [
    { icon: '💡', color: C.blue,   title: 'SPENDING',    summary: `Your Wants spending is ${s.expenses.find((e) => e.label === 'Wants')?.pct || 30}% of salary. Reducing to 25% would free up ${fmt(s.salary * 5 / 100)}/month — that's ${fmt(s.salary * 5 / 100 * 12)}/year you could invest.` },
    { icon: '📈', color: C.green,  title: 'INVESTMENT',  summary: `With ${s.sips.length} SIP${s.sips.length !== 1 ? 's' : ''} totaling ${fmt(sipTotal)}/mo, your estimated 1-year corpus is ${fmt(s.sips.reduce((a, x) => a + sipMaturity(x.amount, 12, x.returns), 0))}. Consider a 10% annual step-up for 40% more corpus in 5 years.` },
    { icon: '🏦', color: C.amber,  title: 'DEBT STRATEGY', summary: s.debts.length > 0 ? `Your highest-rate debt is ${s.debts.reduce((a, d) => d.rate > a.rate ? d : a, s.debts[0]).name} at ${s.debts.reduce((a, d) => d.rate > a.rate ? d : a, s.debts[0]).rate}%. Paying ₹2,000 extra per month could save months of interest — use the Avalanche method.` : 'You have no active debts — excellent! Consider redirecting EMI savings into SIPs for accelerated wealth building.' },
    { icon: '🚀', color: C.purple, title: 'CAREER',       summary: `At ${s.userAge || 28} years old with NEBOSH & IOSH certifications, you are positioned for a Senior HSE role. A job switch at 35-40% hike would net you ${fmt(s.salary * 0.375)}/month extra — ${fmt(s.salary * 0.375 * 12)}/year.` },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Insights</Text>
        <Text style={styles.pageSub}>Analytics · Risk · Patterns</Text>
      </View>

      {/* SCORE FULL */}
      <Card style={styles.section}>
        <SH title="Financial Health Score" />
        <View style={styles.scoreRow}>
          <ScoreRing score={score.total} color={scoreColor} size={110} strokeWidth={10} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            {score.breakdown.map((b) => (
              <View key={b.label} style={{ marginBottom: 8 }}>
                <View style={styles.scoreBreakRow}>
                  <Text style={styles.scoreBreakLabel}>{b.label}</Text>
                  <Text style={[styles.scoreBreakVal, { color: C.blue }]}>{b.score}/{b.max}</Text>
                </View>
                <Bar value={b.score} total={b.max} color={C.blue} height={4} />
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* RISK ANALYSIS */}
      {(s.debts.some((d) => d.rate >= 24) || s.sips.length === 1) && (
        <GCard colors={['#1f0a0a', '#3d0a0a']} style={styles.section}>
          <SH title="⚠️ Risk Analysis" rightColor={C.red} />
          {s.debts.filter((d) => d.rate >= 24).map((d, i) => (
            <View key={i} style={[styles.riskRow, { backgroundColor: C.redDim, borderColor: C.red + '28' }]}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
              <Text style={[styles.riskText, { color: C.red }]}><Text style={{ fontWeight: '700' }}>{d.name}</Text> at {d.rate}% — clear this before investing more.</Text>
            </View>
          ))}
          {s.sips.length === 1 && (
            <View style={[styles.riskRow, { backgroundColor: C.amberDim, borderColor: C.amber + '28' }]}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={[styles.riskText, { color: C.amber }]}>Single fund risk — diversify across 2-3 funds for stability.</Text>
            </View>
          )}
        </GCard>
      )}

      {/* TRANSACTIONS */}
      {s.transactions?.length > 0 && (
        <Card style={styles.section}>
          <SH title="Recent Transactions" />
          {s.transactions.slice(0, 5).map((t, i) => (
            <View key={i} style={[styles.txRow, i < 4 && styles.txBorder]}>
              <View style={[styles.txIcon, { backgroundColor: t.type === 'income' ? C.greenDim : C.layer2 }]}>
                <Text style={{ fontSize: 15 }}>{t.icon || '💳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{t.desc}</Text>
                <Text style={styles.txDate}>{t.date}</Text>
              </View>
              <Text style={[styles.txAmt, { color: t.type === 'income' ? C.green : C.t1 }]}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
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
          <Chip label="Smart insights" color={C.green} dot />
        </View>
        {aiInsights.map((c, i) => <AICard key={i} {...c} />)}
      </View>

      {/* KPI STRIP */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: S.md, marginBottom: 12 }} contentContainerStyle={{ gap: 10, paddingRight: S.md }}>
        {[
          { icon: '💰', label: 'Avg Save',    val: fmt(s.monthlyData.reduce((a, v, i) => a + (v - s.spendData[i]), 0) / 12), color: C.green  },
          { icon: '📊', label: 'Save Rate',   val: `${savePct}%`,                                                              color: C.blue   },
          { icon: '🏦', label: 'Debt Cleared',val: `${pct(debtPaid, debtTotal)}%`,                                             color: C.amber  },
          { icon: '📈', label: 'SIP Corpus',  val: fmt(s.sips.reduce((a, x) => a + sipMaturity(x.amount, x.months, x.returns), 0)), color: C.purple },
        ].map((c, i) => (
          <Card key={i} style={{ padding: S.md, minWidth: 135 }}>
            <Text style={{ fontSize: 20, marginBottom: 7 }}>{c.icon}</Text>
            <Text style={styles.kpiLabel}>{c.label}</Text>
            <Text style={[styles.kpiVal, { color: c.color }]}>{c.val}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* CHARTS */}
      <Card style={styles.section}>
        <View style={styles.chartHeaderRow}>
          <SH title="Earnings (YTD)" />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.chartTotal, { color: C.green }]}>{fmt(s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0))}</Text>
            <Text style={styles.chartSub}>total</Text>
          </View>
        </View>
        <BarChart data={bars} color={C.blue} height={64} />
      </Card>

      <Card style={styles.section}>
        <SH title="Spending Trend" />
        <BarChart data={sbars} color={C.amber} height={56} />
        <View style={{ marginTop: 12 }}>
          <Bar value={s.spendData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0)} total={s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0)} color={C.red} height={5} />
          <Text style={styles.spendPct}>{pct(s.spendData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0), s.monthlyData.slice(0, s.currentMonth + 1).reduce((a, v) => a + v, 0))}% of income spent YTD</Text>
        </View>
      </Card>

      {/* LEAVE */}
      <Card style={styles.section}>
        <SH title="Leave Balance" />
        {s.leaves.map((l, i) => (
          <View key={i} style={[styles.leaveItem, i < s.leaves.length - 1 && styles.leaveBorder]}>
            <View style={styles.leaveHeader}>
              <Text style={styles.leaveLabel}>{l.label} ({l.type})</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.leaveVal}>{l.total - l.used} <Text style={styles.leaveValSub}>/ {l.total} left</Text></Text>
                {l.total - l.used === 0 && <Text style={{ color: C.red, fontSize: 11 }}>Exhausted</Text>}
              </View>
            </View>
            <Bar value={l.total - l.used} total={l.total} color={l.total - l.used <= 1 ? C.red : C.green} height={5} />
          </View>
        ))}
      </Card>

      {/* NET WORTH */}
      <Card style={styles.section}>
        <SH title="Net Worth" />
        <View style={styles.nwChips}>
          <Chip label={`Assets: ${fmt(totalAss)}`}  color={C.green} size="md" />
          <Chip label={`Debts: ${fmt(totalDebt)}`}   color={C.red}   size="md" />
        </View>
        {s.assets.map((a, i) => (
          <View key={i} style={[styles.nwRow, i < s.assets.length - 1 && styles.nwBorder]}>
            <Text style={styles.nwLabel}>{a.label}</Text>
            <Text style={[styles.nwVal, { color: C.green }]}>{fmt(a.value)}</Text>
          </View>
        ))}
        <View style={styles.nwTotal}>
          <Text style={styles.nwTotalLabel}>Net Worth</Text>
          <Text style={[styles.nwTotalVal, { color: C.green }]}>{fmt(totalAss - totalDebt)}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          { paddingTop: 56, paddingHorizontal: S.md, paddingBottom: S.md },
  pageTitle:       { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: C.t1, letterSpacing: -0.5 },
  pageSub:         { fontSize: 13, color: C.t3, marginTop: 2 },
  section:         { marginHorizontal: S.md, marginBottom: 12 },
  scoreRow:        { flexDirection: 'row', gap: 16, alignItems: 'center' },
  scoreLabel:      { fontFamily: 'Syne_700Bold', fontSize: 16, marginBottom: 10 },
  scoreBreakRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  scoreBreakLabel: { fontSize: 11, color: C.t3 },
  scoreBreakVal:   { fontSize: 11, fontWeight: '600' },
  riskRow:         { flexDirection: 'row', gap: 9, padding: S.sm + 2, borderRadius: 11, borderWidth: 1, marginBottom: 7, alignItems: 'flex-start' },
  riskText:        { fontSize: 12, lineHeight: 18, flex: 1 },
  txRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  txBorder:        { borderBottomWidth: 1, borderBottomColor: C.border },
  txIcon:          { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:          { fontWeight: '600', fontSize: 13, color: C.t1 },
  txDate:          { fontSize: 11, color: C.t3, marginTop: 1 },
  txAmt:           { fontFamily: 'Syne_700Bold', fontSize: 13 },
  aiHeader:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginHorizontal: S.md },
  aiHeaderIcon:    { width: 28, height: 28, borderRadius: 9, backgroundColor: C.blue + '20', alignItems: 'center', justifyContent: 'center' },
  aiHeaderTitle:   { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.t1 },
  aiCard:          { flexDirection: 'row', gap: 10, borderRadius: 15, padding: S.sm + 6, borderWidth: 1, alignItems: 'flex-start' },
  aiTitle:         { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, marginBottom: 4, paddingLeft: 2, textTransform: 'uppercase' },
  aiText:          { flex: 1, fontSize: 13, color: C.t2, lineHeight: 19 },
  kpiLabel:        { fontSize: 10, fontWeight: '500', color: C.t3, marginBottom: 2 },
  kpiVal:          { fontFamily: 'Syne_800ExtraBold', fontSize: 18 },
  chartHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartTotal:      { fontFamily: 'Syne_800ExtraBold', fontSize: 17 },
  chartSub:        { fontSize: 11, color: C.t3 },
  spendPct:        { fontSize: 11, color: C.t3, marginTop: 5 },
  leaveItem:       { paddingVertical: 14 },
  leaveBorder:     { borderBottomWidth: 1, borderBottomColor: C.border },
  leaveHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  leaveLabel:      { fontSize: 13, color: C.t2 },
  leaveVal:        { fontSize: 13, fontWeight: '700', color: C.t1 },
  leaveValSub:     { fontWeight: '400', color: C.t3 },
  nwChips:         { flexDirection: 'row', gap: 7, marginBottom: 14, flexWrap: 'wrap' },
  nwRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  nwBorder:        { borderBottomWidth: 1, borderBottomColor: C.border },
  nwLabel:         { fontSize: 13, color: C.t2 },
  nwVal:           { fontWeight: '700', fontSize: 13 },
  nwTotal:         { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-between' },
  nwTotalLabel:    { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.t1 },
  nwTotalVal:      { fontFamily: 'Syne_800ExtraBold', fontSize: 19 },
});
