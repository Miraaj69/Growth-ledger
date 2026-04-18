// CashFlowScreen.js — totalIncome = derived().totalIncome (SAME as HomeScreen)
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from './AppContext';
import { C, S, R } from './theme';
import { fmt, pct, derived, MONTHS_FULL } from './calculations';
import { Card, Chip, Bar, SH } from './UIComponents';

export default function CashFlowScreen() {
  const { state: s } = useApp();

  // ── SINGLE SOURCE: same derived() as HomeScreen ─────────────
  const d = useMemo(() => derived(s), [s]);

  // Flow nodes — all values from d (derived), zero hardcoding
  const flows = [
    {
      label: 'Salary (Earned)',
      amount: d.earnedSalary,
      type: 'in',
      color: C.green,
      icon: '💰',
      sub: `${d.present}/${s.workingDays} days × ${fmt(d.perDay)}/day`,
    },
    ...s.incomes.slice(1).filter(inc => inc.amount > 0).map(inc => ({
      label: inc.label,
      amount: inc.amount,
      type: 'in',
      color: C.teal,
      icon: '💼',
      sub: inc.recurring ? 'Recurring income' : 'Variable income',
    })),
    {
      label: 'EMI Payments',
      amount: d.debtEmi,
      type: 'out',
      color: C.red,
      icon: '🏦',
      sub: `${s.debts.length} active loan${s.debts.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'SIP Investments',
      amount: d.sipTotal,
      type: 'out',
      color: C.purple,
      icon: '📈',
      sub: `${s.sips.length} fund${s.sips.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Manual Expenses',
      amount: d.manualTotal,
      type: 'out',
      color: C.amber,
      icon: '🛒',
      sub: `${s.manualExpenses.length} categories`,
    },
    {
      label: 'Net Balance',
      amount: d.balance,
      type: 'net',
      color: d.balance > 0 ? C.green : C.red,
      icon: '💵',
      sub: d.balance > 0 ? 'Available to save / spend' : 'Over budget!',
    },
  ];

  const totalOut = d.debtEmi + d.sipTotal + d.manualTotal;

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      <View style={st.header}>
        <Text style={st.pageTitle}>Cash Flow</Text>
        <Text style={st.pageSub}>{MONTHS_FULL[s.currentMonth]} {s.currentYear}</Text>
      </View>

      {/* ── SUMMARY STRIP ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)}>
        <View style={[st.row2, st.mx]}>
          {[
            { label:'Total In',    val: fmt(d.totalIncome), color: C.green  },
            { label:'Total Out',   val: fmt(totalOut),      color: C.red    },
            { label:'Net Balance', val: fmt(d.balance),     color: d.balance > 0 ? C.green : C.red },
          ].map((c, i) => (
            <View key={i} style={[st.summCard, { borderColor: c.color+'25' }]}>
              <Text style={st.summLabel}>{c.label}</Text>
              <Text style={[st.summVal, { color: c.color }]}>{c.val}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ── FLOW DIAGRAM ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={st.mx}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Money Flow" />

          {/* Overall progress bar — out vs in */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
              <Text style={{ fontSize:12, color:C.t3 }}>Committed {pct(totalOut, d.totalIncome)}% of income</Text>
              <Text style={{ fontSize:12, fontWeight:'700', color: pct(totalOut,d.totalIncome)>85 ? C.red : C.green }}>
                {pct(d.balance, d.totalIncome)}% free
              </Text>
            </View>
            <Bar value={totalOut} total={d.totalIncome} color={C.red} h={6} />
          </View>

          {flows.map((f, i) => (
            <View key={i}>
              <View style={st.flowRow}>
                <View style={[st.flowIcon, { backgroundColor: f.color+'20' }]}>
                  <Text style={{ fontSize:18 }}>{f.icon}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[st.flowLabel, f.type==='net' && { color: f.color, fontWeight:'800' }]}>{f.label}</Text>
                  <Text style={st.flowSub}>{f.sub}</Text>
                  {f.type !== 'net' && (
                    <View style={{ marginTop:5 }}>
                      <Bar value={f.amount} total={d.totalIncome} color={f.color} h={3} />
                    </View>
                  )}
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={[st.flowAmt, { color: f.type==='net' ? f.color : f.type==='in' ? C.green : C.red }]}>
                    {f.type==='net' ? '' : f.type==='in' ? '+ ' : '− '}{fmt(f.amount)}
                  </Text>
                  {f.type !== 'net' && (
                    <Text style={st.flowPct}>{pct(f.amount, d.totalIncome)}%</Text>
                  )}
                </View>
              </View>

              {/* Connector line between flows */}
              {i < flows.length - 2 && (
                <View style={{ paddingLeft: 20, paddingVertical: 1 }}>
                  <View style={{ width:2, height:12, marginLeft:19, backgroundColor: f.color+'35' }} />
                </View>
              )}
            </View>
          ))}
        </Card>
      </Animated.View>

      {/* ── EXPENSE BREAKDOWN ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)} style={st.mx}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Expense Breakdown" />
          {s.manualExpenses.map((e, i) => (
            <View key={i} style={[st.expRow, i < s.manualExpenses.length-1 && st.expBorder]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
                <Text style={{ fontSize:18 }}>{e.icon}</Text>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 }}>
                    <Text style={st.expCat}>{e.cat}</Text>
                    {e.recurring && <Chip label="Auto" color={C.teal} sm />}
                  </View>
                  <Bar value={e.amount} total={d.totalIncome} color={e.color} h={3} />
                </View>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={[st.expAmt, { color: e.color }]}>{fmt(e.amount)}</Text>
                <Text style={st.expPct}>{pct(e.amount, d.totalIncome)}%</Text>
              </View>
            </View>
          ))}
        </Card>
      </Animated.View>

      {/* ── DEBT BREAKDOWN ── */}
      {s.debts.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={st.mx}>
          <Card style={{ marginBottom: 12 }}>
            <SH title="EMI Breakdown" />
            {s.debts.map((debt, i) => (
              <View key={i} style={[st.expRow, i < s.debts.length-1 && st.expBorder]}>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
                    <Text style={st.expCat}>{debt.name}</Text>
                    <Chip label={`${debt.rate}% p.a.`} color={debt.rate >= 24 ? C.red : C.amber} sm />
                  </View>
                  <Bar value={debt.remaining} total={debt.amount} color={C.red} h={3} />
                  <Text style={{ fontSize:10, color:C.t3, marginTop:4 }}>
                    {pct(debt.amount-debt.remaining, debt.amount)}% cleared · EMI {fmt(debt.emi)}/mo
                  </Text>
                </View>
                <View style={{ alignItems:'flex-end', marginLeft:12 }}>
                  <Text style={[st.expAmt, { color: C.red }]}>{fmt(debt.emi)}</Text>
                  <Text style={st.expPct}>/month</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* ── SIP BREAKDOWN ── */}
      {s.sips.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={st.mx}>
          <Card style={{ marginBottom: 12 }}>
            <SH title="SIP Breakdown" />
            {s.sips.map((sip, i) => (
              <View key={i} style={[st.expRow, i < s.sips.length-1 && st.expBorder]}>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
                    <Text style={st.expCat}>{sip.name}</Text>
                    <Chip label={`${sip.returns}% p.a.`} color={C.green} sm />
                  </View>
                  <Bar value={sip.amount} total={d.sipTotal} color={C.purple} h={3} />
                </View>
                <View style={{ alignItems:'flex-end', marginLeft:12 }}>
                  <Text style={[st.expAmt, { color: C.purple }]}>{fmt(sip.amount)}</Text>
                  <Text style={st.expPct}>/month</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* ── INCOME SOURCES ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(280)} style={st.mx}>
        <Card>
          <SH title="Income Sources" />
          {s.incomes.map((inc, i) => (
            <View key={i} style={[st.expRow, i < s.incomes.length-1 && st.expBorder]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
                <Text style={{ fontSize:18 }}>{i===0?'💰':'💼'}</Text>
                <View>
                  <Text style={st.expCat}>{inc.label}</Text>
                  <Chip label={inc.recurring ? 'Recurring' : 'Variable'} color={inc.recurring?C.green:C.amber} sm />
                </View>
              </View>
              <Text style={[st.expAmt, { color: C.green }]}>+{fmt(i===0 ? d.earnedSalary : inc.amount)}</Text>
            </View>
          ))}
          <View style={st.totalRow}>
            <Text style={st.totalLabel}>Total Income (This Month)</Text>
            {/* Same totalIncome as HomeScreen hero card */}
            <Text style={[st.totalVal, { color: C.green }]}>{fmt(d.totalIncome)}</Text>
          </View>
        </Card>
      </Animated.View>

    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:  { flex:1, backgroundColor: C.bg },
  mx:         { marginHorizontal: S.md },
  header:     { paddingTop:56, paddingHorizontal:S.md, paddingBottom:S.md },
  pageTitle:  { fontSize:27, fontWeight:'800', color:C.t1, letterSpacing:-0.5 },
  pageSub:    { fontSize:13, color:C.t3, marginTop:2 },
  row2:       { flexDirection:'row', gap:8, marginBottom:12 },
  summCard:   { flex:1, backgroundColor:C.l2, borderRadius:R.md+2, padding:12, borderWidth:1 },
  summLabel:  { fontSize:11, color:C.t3, marginBottom:4 },
  summVal:    { fontSize:17, fontWeight:'800' },
  flowRow:    { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12 },
  flowIcon:   { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  flowLabel:  { fontWeight:'600', fontSize:13, color:C.t1 },
  flowSub:    { fontSize:11, color:C.t3, marginTop:2 },
  flowAmt:    { fontSize:15, fontWeight:'800' },
  flowPct:    { fontSize:10, color:C.t3, marginTop:2 },
  expRow:     { paddingVertical:12, flexDirection:'row', alignItems:'center' },
  expBorder:  { borderBottomWidth:1, borderBottomColor:C.border },
  expCat:     { fontWeight:'600', fontSize:13, color:C.t1, marginBottom:2 },
  expAmt:     { fontSize:15, fontWeight:'800' },
  expPct:     { fontSize:10, color:C.t3, marginTop:2 },
  totalRow:   { marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:C.border, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  totalLabel: { fontSize:14, fontWeight:'700', color:C.t1 },
  totalVal:   { fontSize:19, fontWeight:'800' },
});
