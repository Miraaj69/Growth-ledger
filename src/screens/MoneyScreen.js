// src/screens/MoneyScreen.js
import React, { useState } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet, FlatList, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../store/AppContext';
import { Colors, Spacing, Radius, Typography, Shadows } from '../constants/theme';
import { inr, pct, sipMaturity, cagrCalc, inflationAdjust, debtMonths, MONTHS_FULL } from '../utils/calculations';
import {
  Card, GradientCard, Chip, ProgressBar, SectionHeader, Toggle,
  EmptyState, StatRow, InputField,
} from '../components/UIComponents';
import DonutChart from '../components/DonutChart';
import MonthPicker from '../components/MonthPicker';
import FAB from '../components/FAB';

const TABS = [
  ['salary', '💰 Salary'],
  ['expenses', '💳 Expenses'],
  ['sip', '📈 SIP'],
  ['debt', '🏦 Debt'],
];

export default function MoneyScreen() {
  const { state: s, dispatch, set } = useApp();
  const [tab, setTab] = useState('salary');

  const present = s.attendance ? s.attendance.size : 0;
  const perDay  = s.salary / s.workingDays;

  const fabActions = {
    sip:  [{ icon: '📈', label: 'Add SIP',     color: Colors.green, action: () => dispatch({ type: 'ADD_SIP',  sip:  { name: 'New SIP',   amount: 1000, returns: 12, months: 12, goalLink: null } }) }],
    debt: [{ icon: '🏦', label: 'Add Debt',    color: Colors.red,   action: () => dispatch({ type: 'ADD_DEBT', debt: { name: 'New Loan',  amount: 50000, remaining: 50000, emi: 3000, rate: 10, dueDate: 5 } }) }],
    expenses: [{ icon: '💳', label: 'Add Expense', color: Colors.amber, action: () => dispatch({ type: 'ADD_EXPENSE', expense: { cat: 'Other', amount: 0, icon: '💸', color: Colors.t3, recurring: false } }) }],
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Money</Text>
            <Text style={styles.pageSub}>All finances, one place</Text>
          </View>
          <MonthPicker
            month={s.currentMonth} year={s.currentYear}
            onChange={(m, y) => set({ currentMonth: m, currentYear: y, attendance: new Set() })}
          />
        </View>

        {/* AUTO-ADJUST */}
        <View style={styles.autoRow}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
            <View>
              <Text style={styles.autoTitle}>Auto-Adjust Mode</Text>
              <Text style={styles.autoSub}>AI-driven rebalancing</Text>
            </View>
          </View>
          <Toggle value={s.autoAdjust} onChange={() => set({ autoAdjust: !s.autoAdjust })} />
        </View>

        {s.autoAdjust && (
          <View style={styles.suggestBox}>
            <Text style={[styles.suggestTitle, { color: Colors.green }]}>🤖 Smart Suggestions</Text>
            {[
              `Increase SIP to ${inr(s.sips.reduce((a, x) => a + x.amount, 0) + 1000)} — ₹1K more/mo rule`,
              `Reduce Wants from ${s.expenses.find((e) => e.label === 'Wants')?.pct || 30}% → 25%, save ${inr(s.salary * 5 / 100)}/mo`,
              s.debts.length > 0 ? `Pay ₹2K extra on ${s.debts.reduce((a, d) => d.rate > a.rate ? d : a, s.debts[0]).name}` : 'Great — no high-rate debt!',
            ].map((t, i) => <Text key={i} style={styles.suggestItem}>• {t}</Text>)}
          </View>
        )}

        {/* SEGMENT TABS */}
        <View style={styles.tabWrap}>
          {TABS.map(([k, l]) => {
            const on = tab === k;
            return (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tabBtn, on && styles.tabBtnActive]}>
                <Text style={[styles.tabText, on && styles.tabTextActive]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── SALARY ── */}
        {tab === 'salary' && <SalaryTab s={s} set={set} dispatch={dispatch} present={present} perDay={perDay} />}
        {/* ── EXPENSES ── */}
        {tab === 'expenses' && <ExpensesTab s={s} dispatch={dispatch} />}
        {/* ── SIP ── */}
        {tab === 'sip' && <SipTab s={s} dispatch={dispatch} />}
        {/* ── DEBT ── */}
        {tab === 'debt' && <DebtTab s={s} dispatch={dispatch} />}
      </ScrollView>

      {/* FAB */}
      {(fabActions[tab] || []).length > 0 && <FAB actions={fabActions[tab]} />}
    </View>
  );
}

// ─── SALARY TAB ───────────────────────────────────────────────────
function SalaryTab({ s, set, dispatch, present, perDay }) {
  const toggle = (d) => dispatch({ type: 'TOGGLE_ATTENDANCE', day: d });
  const today  = new Date().getDate();

  return (
    <View style={styles.tabContent}>
      {/* Setup */}
      <Card style={styles.section}>
        <SectionHeader title="Setup" />
        <InputField label="Monthly In-hand (₹)" value={s.salary} onChangeText={(v) => set({ salary: +v || 0 })} keyboardType="numeric" prefix="₹" />
        <InputField label="Working Days / Month"  value={s.workingDays} onChangeText={(v) => set({ workingDays: +v || 26 })} keyboardType="numeric" />
        <Text style={styles.subSectionLabel}>Other Income Sources</Text>
        {s.incomes.filter((_, i) => i > 0).map((inc, i) => (
          <View key={i} style={styles.incomeRow}>
            <Text style={{ fontSize: 18 }}>💼</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.incomeLabel} numberOfLines={1}>{inc.label}</Text>
              <Text style={[styles.incomeAmt, { color: Colors.green }]}>{inr(inc.amount)}</Text>
            </View>
            <Toggle value={inc.recurring} onChange={() => dispatch({ type: 'UPDATE_INCOME', idx: i + 1, patch: { recurring: !inc.recurring } })} />
            <Pressable onPress={() => dispatch({ type: 'REMOVE_INCOME', idx: i + 1 })}>
              <Text style={styles.removeBtn}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={() => dispatch({ type: 'ADD_INCOME', income: { label: 'Freelance', amount: 0, recurring: false } })}>
          <Text style={styles.addLink}>+ Add income source</Text>
        </Pressable>
      </Card>

      {/* Live stats */}
      <View style={styles.statRow3}>
        {[
          { l: 'Per Day', v: inr(perDay),                                  c: Colors.blue  },
          { l: 'Earned',  v: inr(perDay * present),                        c: Colors.green },
          { l: 'Lost',    v: inr(perDay * (s.workingDays - present)),       c: Colors.red   },
        ].map((x, i) => (
          <Card key={i} style={styles.statCard}>
            <Text style={[styles.statCardVal, { color: x.c }]}>{x.v}</Text>
            <Text style={styles.statCardLabel}>{x.l}</Text>
          </Card>
        ))}
      </View>

      {/* Calendar */}
      <Card style={styles.section}>
        <View style={styles.calHeader}>
          <SectionHeader title={`${MONTHS_FULL[s.currentMonth]} ${s.currentYear}`} />
          <Chip label={`${present} present`} color={Colors.green} dot />
        </View>
        <View style={styles.dayRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <Text key={i} style={styles.dayLabel}>{d}</Text>
          ))}
        </View>
        <View style={styles.calGrid}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
            const on   = s.attendance && s.attendance.has(d);
            const isT  = d === today && s.currentMonth === new Date().getMonth();
            const wknd = d % 7 === 0 || d % 7 === 6;
            return (
              <Pressable
                key={d}
                onPress={() => !wknd && toggle(d)}
                style={[
                  styles.dayCell,
                  on  && { backgroundColor: Colors.green + '28', borderColor: Colors.green + '44' },
                  isT && !on && { backgroundColor: Colors.blue + '22',  borderColor: Colors.blue  + '44' },
                ]}
              >
                <Text style={[
                  styles.dayNum,
                  on   && { color: Colors.green },
                  isT  && !on && { color: Colors.blue, fontWeight: '700' },
                  wknd && { color: Colors.t3 + '66' },
                ]}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────
function ExpensesTab({ s, dispatch }) {
  const total  = s.manualExpenses.reduce((a, e) => a + e.amount, 0);
  const budget = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);

  return (
    <View style={styles.tabContent}>
      {/* Donut */}
      <Card style={styles.section}>
        <View style={styles.donutRow}>
          <DonutChart segments={s.expenses.map((e) => ({ pct: e.pct, color: e.color }))} size={100} strokeWidth={14} />
          <View style={{ flex: 1 }}>
            {s.expenses.map((e, i) => (
              <View key={i} style={styles.donutLegRow}>
                <View style={styles.donutLegLeft}>
                  <View style={[styles.dot9, { backgroundColor: e.color }]} />
                  <Text style={styles.donutLegLabel}>{e.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.donutLegVal, { color: e.color }]}>{inr(s.salary * e.pct / 100)}</Text>
                  <Text style={styles.donutLegPct}>{e.pct}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Sliders */}
      {s.expenses.map((e, i) => (
        <Card key={i} style={[styles.section, { paddingBottom: Spacing.md }]}>
          <View style={styles.sliderHeader}>
            <View>
              <Text style={styles.sliderTitle}>{e.label}</Text>
              <Text style={styles.sliderSub}>{inr(s.salary * e.pct / 100)} / month</Text>
            </View>
            <View style={[styles.sliderPctBadge, { backgroundColor: e.color + '22' }]}>
              <Text style={[styles.sliderPct, { color: e.color }]}>{e.pct}%</Text>
            </View>
          </View>
          {/* Manual slider via - / + */}
          <View style={styles.sliderRow}>
            <Pressable onPress={() => dispatch({ type: 'UPDATE_EXPENSE_PCT', idx: i, pct: Math.max(0, e.pct - 1) })} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>−</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <ProgressBar value={e.pct} total={80} color={e.color} height={6} />
            </View>
            <Pressable onPress={() => dispatch({ type: 'UPDATE_EXPENSE_PCT', idx: i, pct: Math.min(80, e.pct + 1) })} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>+</Text>
            </Pressable>
          </View>
        </Card>
      ))}

      {/* Manual expenses */}
      <Text style={styles.subSectionLabelOuter}>Manual Expenses</Text>
      <View style={[styles.section, { backgroundColor: total > budget ? Colors.redD : Colors.greenD, borderRadius: Radius.md, padding: Spacing.sm + 4, marginBottom: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }]}>
        <Text style={{ fontSize: 13, color: Colors.t2 }}>Spent vs budget</Text>
        <Text style={{ fontWeight: '700', fontSize: 13, color: total > budget ? Colors.red : Colors.green }}>{inr(total)} / {inr(budget)}</Text>
      </View>
      {s.manualExpenses.map((ex, i) => (
        <View key={i} style={styles.manExpRow}>
          <Text style={{ fontSize: 20 }}>{ex.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.manExpCat}>{ex.cat}</Text>
            {ex.recurring && <Chip label="Auto" color={Colors.teal} />}
          </View>
          <Text style={[styles.manExpAmt, { color: ex.color }]}>{inr(ex.amount)}</Text>
          <Toggle value={ex.recurring} onChange={() => dispatch({ type: 'UPDATE_EXPENSE', idx: i, patch: { recurring: !ex.recurring } })} />
          <Pressable onPress={() => dispatch({ type: 'REMOVE_EXPENSE', idx: i })}>
            <Text style={styles.removeBtn}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ─── SIP TAB ──────────────────────────────────────────────────────
function SipTab({ s, dispatch }) {
  if (s.sips.length === 0) {
    return (
      <View style={styles.tabContent}>
        <EmptyState icon="📈" title="No SIPs added" sub="Start your wealth-building journey. ₹500/mo today = ₹1L+ in 10 years." cta="Add first SIP" onCta={() => dispatch({ type: 'ADD_SIP', sip: { name: 'Nifty 50 Index', amount: 1000, returns: 13, months: 24, goalLink: null } })} />
      </View>
    );
  }

  const total = s.sips.reduce((a, x) => a + x.amount, 0);
  const corpus= s.sips.reduce((a, x) => a + sipMaturity(x.amount, x.months, x.returns), 0);

  return (
    <View style={styles.tabContent}>
      <View style={styles.row2}>
        <LinearGradient colors={['#052e16', Colors.green + 'cc']} style={[styles.sipSummCard, { borderWidth: 1, borderColor: Colors.border }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.sipSummLabel}>Total SIP/mo</Text>
          <Text style={styles.sipSummVal}>{inr(total)}</Text>
        </LinearGradient>
        <LinearGradient colors={['#0c1a4e', Colors.blue + 'cc']} style={[styles.sipSummCard, { borderWidth: 1, borderColor: Colors.border }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.sipSummLabel}>Total Corpus</Text>
          <Text style={styles.sipSummVal}>{inr(corpus)}</Text>
        </LinearGradient>
      </View>

      {s.sips.map((si, i) => {
        const mat       = sipMaturity(si.amount, si.months, si.returns);
        const invest    = si.amount * si.months;
        const inflAdj   = inflationAdjust(mat, Math.round(si.months / 12));
        const cagr      = cagrCalc(invest, mat, si.months / 12);
        return (
          <Card key={i} style={styles.section}>
            <View style={styles.sipHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sipName}>{si.name}</Text>
                <View style={styles.chipRow}>
                  <Chip label={`${si.returns}% p.a.`} color={Colors.green} />
                  {si.goalLink && <Chip label={`→ ${si.goalLink}`} color={Colors.purple} />}
                </View>
              </View>
              <Text style={styles.sipAmt}>{inr(si.amount)}</Text>
            </View>

            <View style={styles.sipStats}>
              <StatRow label="Invested"              value={inr(invest)} />
              <StatRow label="Maturity (XIRR)"       value={inr(mat)}      valueColor={Colors.green} />
              <StatRow label="Inflation-adjusted"     value={inr(inflAdj)}  valueColor={Colors.amber} />
              <StatRow label="CAGR"                  value={`${cagr}%`}    valueColor={Colors.blue} last />
            </View>

            <ProgressBar value={invest} total={mat} color={Colors.green} height={5} />

            <Text style={styles.subSectionLabel}>Link to goal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {s.goals.map((g) => (
                <Pressable key={g.title} onPress={() => dispatch({ type: 'UPDATE_SIP', idx: i, patch: { goalLink: si.goalLink === g.title ? null : g.title } })} style={[styles.goalLinkBtn, { backgroundColor: si.goalLink === g.title ? g.color + '28' : 'rgba(255,255,255,0.05)', borderColor: si.goalLink === g.title ? g.color : Colors.border }]}>
                  <Text style={[styles.goalLinkText, { color: si.goalLink === g.title ? g.color : Colors.t3 }]}>{g.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => dispatch({ type: 'REMOVE_SIP', idx: i })}><Text style={styles.removeLink}>Remove SIP</Text></Pressable>
          </Card>
        );
      })}
    </View>
  );
}

// ─── DEBT TAB ─────────────────────────────────────────────────────
function DebtTab({ s, dispatch }) {
  if (s.debts.length === 0) {
    return (
      <View style={styles.tabContent}>
        <EmptyState icon="🏦" title="No debts tracked" sub="Add your loans or credit cards to plan smart repayment." cta="+ Add Debt" onCta={() => dispatch({ type: 'ADD_DEBT', debt: { name: 'Personal Loan', amount: 50000, remaining: 50000, emi: 3000, rate: 10, dueDate: 5 } })} />
      </View>
    );
  }

  const totalRem  = s.debts.reduce((a, d) => a + d.remaining, 0);
  const highRate  = s.debts.reduce((a, d) => d.rate > a.rate ? d : a, s.debts[0]);
  const smallest  = s.debts.reduce((a, d) => d.remaining < a.remaining ? d : a, s.debts[0]);

  return (
    <View style={styles.tabContent}>
      <Card style={styles.section}>
        <View style={styles.debtSummRow}>
          <View>
            <Text style={styles.debtSummLabel}>Total Outstanding</Text>
            <Text style={styles.debtSummVal}>{inr(totalRem)}</Text>
          </View>
          <Chip label="Active" color={Colors.red} dot />
        </View>
        <View style={styles.row2}>
          {[
            { label: '🔥 Avalanche', sub: 'Max interest', name: highRate.name, color: Colors.amber },
            { label: '❄️ Snowball',  sub: 'Motivation',   name: smallest.name, color: Colors.blue  },
          ].map((m) => (
            <View key={m.label} style={[styles.stratCard, { borderColor: m.color + '25' }]}>
              <Text style={[styles.stratLabel, { color: m.color }]}>{m.label}</Text>
              <Text style={styles.stratName}>{m.name}</Text>
              <Text style={styles.stratSub}>{m.sub}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.alertRow2, { backgroundColor: Colors.amberD, borderColor: Colors.amber + '30' }]}>
          <Text style={{ fontSize: 16 }}>💡</Text>
          <Text style={[styles.alertMsg2, { color: Colors.amber }]}>Avalanche saves the most money. Snowball keeps you motivated.</Text>
        </View>
      </Card>

      {s.debts.map((d, i) => {
        const paid   = d.amount - d.remaining;
        const months = debtMonths(d.remaining, d.emi);
        const extraM = debtMonths(d.remaining, d.emi + 2000);
        const intLeft= Math.round(d.remaining * d.rate / 100 * months / 12);
        return (
          <Card key={i} style={styles.section}>
            <View style={styles.debtHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.debtName}>{d.name}</Text>
                <View style={styles.chipRow}>
                  <Chip label={`${d.rate}% p.a.`} color={Colors.red} />
                  {d.dueDate && <Chip label={`Due: ${d.dueDate}th`} color={Colors.amber} />}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.debtRem}>{inr(d.remaining)}</Text>
                <Text style={styles.debtRemLabel}>remaining</Text>
              </View>
            </View>
            <ProgressBar value={paid} total={d.amount} color={Colors.red} height={5} />
            <View style={styles.debtMeta}>
              <Text style={styles.debtMetaText}>{pct(paid, d.amount)}% cleared</Text>
              <Text style={styles.debtMetaText}>{months} months left</Text>
            </View>
            <View style={styles.sipStats}>
              <StatRow label="Monthly EMI"        value={inr(d.emi)} />
              <StatRow label="Amount Paid"        value={inr(paid)}       valueColor={Colors.green} />
              <StatRow label="Interest Remaining" value={inr(intLeft)}    valueColor={Colors.red} last />
            </View>
            <View style={[styles.alertRow2, { backgroundColor: Colors.greenD, borderColor: Colors.green + '28', marginTop: 8 }]}>
              <Text style={{ fontSize: 14 }}>🚀</Text>
              <Text style={[styles.alertMsg2, { color: Colors.green }]}>
                Pay ₹2K extra/mo → clear in <Text style={{ fontWeight: '700' }}>{extraM} months</Text> instead of {months}
              </Text>
            </View>
            <Pressable onPress={() => dispatch({ type: 'REMOVE_DEBT', idx: i })}><Text style={styles.removeLink}>Remove debt</Text></Pressable>
          </Card>
        );
      })}
    </View>
  );
}

const Colors_amber_D = 'rgba(245,158,11,0.12)';
const Colors_green_D = 'rgba(34,197,94,0.09)';
const Colors_red_D   = 'rgba(244,63,94,0.12)';

const styles = StyleSheet.create({
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  pageTitle:          { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: Colors.t1, letterSpacing: -0.5 },
  pageSub:            { fontSize: 13, color: Colors.t3, marginTop: 2 },
  autoRow:            { marginHorizontal: Spacing.md, marginBottom: Spacing.sm + 4, backgroundColor: Colors.layer2, borderRadius: Radius.md, padding: Spacing.sm + 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  autoTitle:          { fontWeight: '600', fontSize: 14, color: Colors.t1 },
  autoSub:            { fontSize: 12, color: Colors.t3 },
  suggestBox:         { marginHorizontal: Spacing.md, marginBottom: Spacing.sm + 4, backgroundColor: Colors.green + '10', borderRadius: Radius.md, padding: Spacing.sm + 6, borderWidth: 1, borderColor: Colors.green + '25' },
  suggestTitle:       { fontWeight: '600', fontSize: 13, marginBottom: 6 },
  suggestItem:        { fontSize: 12, color: Colors.t2, lineHeight: 20 },
  tabWrap:            { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.layer1, borderRadius: Radius.md + 2, padding: 5, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tabBtn:             { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabBtnActive:       { backgroundColor: Colors.blue },
  tabText:            { fontSize: 12, fontWeight: '600', color: Colors.t3 },
  tabTextActive:      { color: '#fff' },
  tabContent:         { paddingHorizontal: Spacing.md },
  section:            { marginBottom: Spacing.sm + 2 },
  subSectionLabel:    { fontSize: 12, fontWeight: '600', color: Colors.t3, marginBottom: 8, marginTop: 4 },
  subSectionLabelOuter:{ fontFamily: 'Syne_700Bold', fontSize: 14, color: Colors.t1, marginBottom: 10, marginTop: 4 },
  addLink:            { color: Colors.blue, fontSize: 13, fontWeight: '600', marginTop: 4 },
  incomeRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.layer2, borderRadius: 12, padding: Spacing.sm + 2, marginBottom: 7, borderWidth: 1, borderColor: Colors.border },
  incomeLabel:        { fontSize: 13, fontWeight: '600', color: Colors.t1 },
  incomeAmt:          { fontSize: 14, fontWeight: '700' },
  removeBtn:          { fontSize: 20, color: Colors.red, paddingHorizontal: 4 },
  statRow3:           { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm + 2 },
  statCard:           { flex: 1, padding: Spacing.sm + 6, alignItems: 'center', gap: 3 },
  statCardVal:        { fontFamily: 'Syne_800ExtraBold', fontSize: 13 },
  statCardLabel:      { fontSize: 10, color: Colors.t3 },
  calHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  dayRow:             { flexDirection: 'row', marginBottom: 6 },
  dayLabel:           { flex: 1, textAlign: 'center', fontSize: 10, color: Colors.t3, paddingBottom: 4 },
  calGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dayCell:            { width: '12.5%', aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent' },
  dayNum:             { fontSize: 11, color: Colors.t2 },
  donutRow:           { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  donutLegLeft:       { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot9:               { width: 9, height: 9, borderRadius: 3 },
  donutLegLabel:      { fontSize: 13, color: Colors.t2 },
  donutLegVal:        { fontWeight: '700', fontSize: 13 },
  donutLegPct:        { fontSize: 10, color: Colors.t3 },
  sliderHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sliderTitle:        { fontFamily: 'Syne_700Bold', fontSize: 15, color: Colors.t1 },
  sliderSub:          { fontSize: 12, color: Colors.t3, marginTop: 2 },
  sliderPctBadge:     { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 7 },
  sliderPct:          { fontFamily: 'Syne_800ExtraBold', fontSize: 22 },
  sliderRow:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.layer2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  sliderBtnText:      { fontSize: 20, color: Colors.t1, lineHeight: 26 },
  manExpRow:          { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: Colors.layer2, borderRadius: 13, padding: Spacing.sm + 3, marginBottom: 9, borderWidth: 1, borderColor: Colors.border },
  manExpCat:          { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  manExpAmt:          { fontFamily: 'Syne_700Bold', fontSize: 14 },
  row2:               { flexDirection: 'row', gap: 10, marginBottom: Spacing.sm + 2 },
  sipSummCard:        { flex: 1, padding: Spacing.md, borderRadius: Radius.xl, gap: 6 },
  sipSummLabel:       { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  sipSummVal:         { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: '#fff' },
  sipHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sipName:            { fontFamily: 'Syne_700Bold', fontSize: 15, color: Colors.t1 },
  sipAmt:             { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: Colors.green },
  chipRow:            { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  sipStats:           { marginVertical: 10 },
  goalLinkBtn:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, marginTop: 8 },
  goalLinkText:       { fontSize: 11, fontWeight: '600' },
  removeLink:         { color: Colors.red, fontSize: 12, fontWeight: '600', marginTop: 10 },
  debtSummRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  debtSummLabel:      { fontSize: 12, color: Colors.t3, marginBottom: 3 },
  debtSummVal:        { fontFamily: 'Syne_800ExtraBold', fontSize: 28, color: Colors.red },
  stratCard:          { flex: 1, backgroundColor: Colors.layer2, borderRadius: 11, padding: Spacing.sm + 4, borderWidth: 1 },
  stratLabel:         { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  stratName:          { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  stratSub:           { fontSize: 10, color: Colors.t3, marginTop: 2 },
  alertRow2:          { flexDirection: 'row', gap: 9, padding: Spacing.sm + 2, borderRadius: 11, borderWidth: 1, alignItems: 'flex-start' },
  alertMsg2:          { fontSize: 12, lineHeight: 18, flex: 1 },
  debtHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  debtName:           { fontFamily: 'Syne_700Bold', fontSize: 15, color: Colors.t1 },
  debtRem:            { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: Colors.red },
  debtRemLabel:       { fontSize: 11, color: Colors.t3, marginTop: 1 },
  debtMeta:           { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7, marginBottom: 12 },
  debtMetaText:       { fontSize: 11, color: Colors.t3 },
  amberD:             Colors.amberDim,
  greenD:             Colors.greenDim,
  redD:               Colors.redDim,
});
