// src/screens/CashFlowScreen.js
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp } from './AppContext';
import { Colors, Spacing, Radius } from './theme';
import { inr, pct, MONTHS_FULL } from './calculations';
import { Card, Chip, ProgressBar, SectionHeader } from './UIComponents';

export default function CashFlowScreen() {
  const { state: s } = useApp();

  const totalInc  = s.incomes.reduce((a, x) => a + x.amount, 0);
  const sipTotal  = s.sips.reduce((a, x) => a + x.amount, 0);
  const debtEmi   = s.debts.reduce((a, d) => a + d.emi, 0);
  const manTotal  = s.manualExpenses.reduce((a, e) => a + e.amount, 0);
  const needsBudg = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);
  const netBal    = Math.max(0, totalInc - manTotal - debtEmi - sipTotal);

  const flows = [
    { label: 'Total Income',              amount: totalInc,              type: 'in',  color: Colors.green,  icon: '💰', sub: s.incomes.map((i) => i.label).join(' + ')         },
    { label: 'Needs (Rent/Food/Bills)',   amount: manTotal,              type: 'out', color: Colors.blue,   icon: '🏠', sub: `${pct(manTotal, totalInc)}% of income`            },
    { label: 'EMI Payments',              amount: debtEmi,               type: 'out', color: Colors.red,    icon: '🏦', sub: `${s.debts.length} active loan${s.debts.length !== 1 ? 's' : ''}` },
    { label: 'SIP Investments',           amount: sipTotal,              type: 'out', color: Colors.purple, icon: '📈', sub: `${s.sips.length} fund${s.sips.length !== 1 ? 's' : ''}` },
    { label: 'Net Balance',               amount: netBal,                type: 'net', color: netBal > 0 ? Colors.green : Colors.red, icon: '💵', sub: netBal > 0 ? 'Available to spend/save' : 'Over budget!' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Cash Flow</Text>
        <Text style={styles.pageSub}>{MONTHS_FULL[s.currentMonth]} {s.currentYear}</Text>
      </View>

      {/* FLOW DIAGRAM */}
      <Card style={styles.section}>
        <SectionHeader title="Money Flow" />
        {flows.map((f, i) => (
          <View key={i}>
            <View style={styles.flowRow}>
              <View style={[styles.flowIcon, { backgroundColor: f.color + '20' }]}>
                <Text style={{ fontSize: 18 }}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.flowLabel, f.type === 'net' && { color: f.color }]}>{f.label}</Text>
                <Text style={styles.flowSub}>{f.sub}</Text>
                {f.type !== 'net' && (
                  <View style={{ marginTop: 6 }}>
                    <ProgressBar value={f.amount} total={totalInc} color={f.color} height={3} />
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.flowAmt, { color: f.type === 'net' ? f.color : f.type === 'in' ? Colors.green : Colors.red }]}>
                  {f.type === 'net' ? '' : f.type === 'in' ? '+ ' : '- '}{inr(f.amount)}
                </Text>
                {f.type !== 'net' && <Text style={styles.flowPct}>{pct(f.amount, totalInc)}%</Text>}
              </View>
            </View>
            {i < flows.length - 2 && (
              <View style={styles.flowConnector}>
                <View style={[styles.flowLine, { backgroundColor: f.color + '40' }]} />
              </View>
            )}
          </View>
        ))}
      </Card>

      {/* EXPENSE BREAKDOWN */}
      <Card style={styles.section}>
        <SectionHeader title="Expense Breakdown" />
        {s.manualExpenses.map((e, i) => (
          <View key={i} style={[styles.expItem, i < s.manualExpenses.length - 1 && styles.expBorder]}>
            <View style={styles.expLeft}>
              <Text style={{ fontSize: 18 }}>{e.icon}</Text>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.expCat}>{e.cat}</Text>
                  {e.recurring && <Chip label="Auto" color={Colors.teal} />}
                </View>
                <View style={{ marginTop: 6 }}>
                  <ProgressBar value={e.amount} total={totalInc} color={e.color} height={4} />
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.expAmt, { color: e.color }]}>{inr(e.amount)}</Text>
              <Text style={styles.expPct}>{pct(e.amount, totalInc)}%</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* MONTHLY SUMMARY */}
      <Card style={styles.section}>
        <SectionHeader title="Monthly Summary" />
        <View style={styles.summGrid}>
          {[
            { label: 'Total In',    val: inr(totalInc),                      color: Colors.green },
            { label: 'Total Out',   val: inr(manTotal + debtEmi + sipTotal),  color: Colors.red   },
            { label: 'Investing',   val: inr(sipTotal),                      color: Colors.purple},
            { label: 'Net Balance', val: inr(netBal),                        color: netBal > 0 ? Colors.green : Colors.red },
          ].map((c, i) => (
            <View key={i} style={[styles.summCard, { borderColor: c.color + '20' }]}>
              <Text style={styles.summLabel}>{c.label}</Text>
              <Text style={[styles.summVal, { color: c.color }]}>{c.val}</Text>
            </View>
          ))}
        </View>
        <ProgressBar value={manTotal + debtEmi + sipTotal} total={totalInc} color={Colors.red} height={6} />
        <Text style={styles.summPct}>{pct(manTotal + debtEmi + sipTotal, totalInc)}% of income committed</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  header:        { paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  pageTitle:     { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: Colors.t1, letterSpacing: -0.5 },
  pageSub:       { fontSize: 13, color: Colors.t3, marginTop: 2 },
  section:       { marginHorizontal: Spacing.md, marginBottom: 12 },
  flowRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  flowIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flowLabel:     { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  flowSub:       { fontSize: 11, color: Colors.t3, marginTop: 2 },
  flowAmt:       { fontFamily: 'Syne_700Bold', fontSize: 15 },
  flowPct:       { fontSize: 10, color: Colors.t3, marginTop: 2 },
  flowConnector: { paddingLeft: 20, paddingVertical: 2 },
  flowLine:      { width: 2, height: 16, marginLeft: 19 },
  expItem:       { paddingVertical: 12 },
  expBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  expLeft:       { flexDirection: 'row', gap: 10, alignItems: 'flex-start', flex: 1 },
  expCat:        { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  expAmt:        { fontFamily: 'Syne_700Bold', fontSize: 14 },
  expPct:        { fontSize: 10, color: Colors.t3, marginTop: 2 },
  summGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 13 },
  summCard:      { width: '47%', backgroundColor: Colors.layer2, borderRadius: 12, padding: Spacing.sm + 4, borderWidth: 1 },
  summLabel:     { fontSize: 11, color: Colors.t3, marginBottom: 4 },
  summVal:       { fontFamily: 'Syne_800ExtraBold', fontSize: 17 },
  summPct:       { fontSize: 11, color: Colors.t3, marginTop: 6 },
});
