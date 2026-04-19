// TaxScreen.js
import React, { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, SH, Bar, Chip, Input, Btn, StatRow } from './UI';
import { fmt, safeNum, fmtPct } from './helpers';

// ── Tax calculation logic ─────────────────────────────────
const calcOldTax = (income, deductions = 0) => {
  const taxable = Math.max(0, income - deductions - 50000); // 50K standard deduction
  let tax = 0;
  if      (taxable > 1000000) tax = (taxable - 1000000) * 0.30 + 112500;
  else if (taxable > 500000)  tax = (taxable - 500000)  * 0.20 + 12500;
  else if (taxable > 250000)  tax = (taxable - 250000)  * 0.05;
  // Rebate u/s 87A
  if (taxable <= 500000) tax = 0;
  const cess = tax * 0.04;
  return Math.round(tax + cess);
};

const calcNewTax = (income) => {
  const taxable = Math.max(0, income - 75000); // 75K standard deduction new regime
  let tax = 0;
  if      (taxable > 1500000) tax = (taxable - 1500000) * 0.30 + 150000;
  else if (taxable > 1200000) tax = (taxable - 1200000) * 0.20 + 90000;
  else if (taxable > 1000000) tax = (taxable - 1000000) * 0.15 + 60000;
  else if (taxable > 700000)  tax = (taxable - 700000)  * 0.10 + 30000;
  else if (taxable > 400000)  tax = (taxable - 400000)  * 0.05;
  // Rebate u/s 87A — new regime up to 7L
  if (taxable <= 700000) tax = 0;
  const cess = tax * 0.04;
  return Math.round(tax + cess);
};

const SLABS_OLD = [
  { range: 'Up to ₹2.5L',    rate: '0%',   color: '#22C55E' },
  { range: '₹2.5L – ₹5L',   rate: '5%',   color: '#4F8CFF' },
  { range: '₹5L – ₹10L',    rate: '20%',  color: '#F59E0B' },
  { range: 'Above ₹10L',     rate: '30%',  color: '#EF4444' },
];
const SLABS_NEW = [
  { range: 'Up to ₹4L',      rate: '0%',   color: '#22C55E' },
  { range: '₹4L – ₹8L',     rate: '5%',   color: '#4F8CFF' },
  { range: '₹8L – ₹12L',    rate: '10%',  color: '#A78BFA' },
  { range: '₹12L – ₹16L',   rate: '15%',  color: '#14B8A6' },
  { range: '₹16L – ₹20L',   rate: '20%',  color: '#F59E0B' },
  { range: 'Above ₹20L',     rate: '30%',  color: '#EF4444' },
];

export default function TaxScreen() {
  const { T } = useTheme();
  const [salary, setSalary]     = useState('');
  const [ded80C, setDed80C]     = useState('');
  const [ded80D, setDed80D]     = useState('');
  const [dedHRA, setDedHRA]     = useState('');
  const [dedOther, setDedOther] = useState('');
  const [showSlabs, setShowSlabs] = useState(false);

  const annualIncome = safeNum(salary) * 12;

  const result = useMemo(() => {
    if (annualIncome === 0) return null;
    const totalDed = safeNum(ded80C) + safeNum(ded80D) + safeNum(dedHRA) + safeNum(dedOther);
    const oldTax   = calcOldTax(annualIncome, totalDed);
    const newTax   = calcNewTax(annualIncome);
    const better   = oldTax <= newTax ? 'old' : 'new';
    const saved    = Math.abs(oldTax - newTax);
    const effOld   = annualIncome > 0 ? ((oldTax / annualIncome) * 100).toFixed(1) : 0;
    const effNew   = annualIncome > 0 ? ((newTax / annualIncome) * 100).toFixed(1) : 0;
    return { oldTax, newTax, better, saved, effOld, effNew, totalDed };
  }, [annualIncome, ded80C, ded80D, dedHRA, dedOther]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[st.header, { paddingTop: 56 }]}>
        <Text style={[st.title, { color: T.t1 }]}>Tax Estimator</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>Old vs New Regime · India</Text>
      </View>

      {/* INPUTS */}
      <View style={{ paddingHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Your Income" />
          <Input label="Monthly Salary (₹)" value={salary} onChange={setSalary}
            type="numeric" prefix="₹" placeholder="e.g. 80000" />
          {annualIncome > 0 && (
            <View style={[st.annualBadge, { backgroundColor: T.blue + '15', borderColor: T.blue + '30' }]}>
              <Text style={{ fontSize: 13, color: T.blue }}>Annual Income: <Text style={{ fontWeight: '800' }}>{fmt(annualIncome)}</Text></Text>
            </View>
          )}
        </Card>

        {/* DEDUCTIONS */}
        <Card style={{ marginBottom: 12 }}>
          <SH title="Deductions (Old Regime)" right={showSlabs ? 'Hide' : 'Slabs'} onRight={() => setShowSlabs(!showSlabs)} />
          <Input label="80C (PPF/ELSS/LIC etc.)" value={ded80C} onChange={setDed80C}
            type="numeric" prefix="₹" placeholder="Max 1,50,000" />
          <Input label="80D (Health Insurance)" value={ded80D} onChange={setDed80D}
            type="numeric" prefix="₹" placeholder="Max 25,000" />
          <Input label="HRA Exemption" value={dedHRA} onChange={setDedHRA}
            type="numeric" prefix="₹" placeholder="As applicable" />
          <Input label="Other Deductions" value={dedOther} onChange={setDedOther}
            type="numeric" prefix="₹" placeholder="80E, 80G etc." />
          {result && (
            <View style={[st.annualBadge, { backgroundColor: '#22C55E15', borderColor: '#22C55E30' }]}>
              <Text style={{ fontSize: 13, color: '#22C55E' }}>Total deductions: <Text style={{ fontWeight: '800' }}>{fmt(result.totalDed)}</Text></Text>
            </View>
          )}
        </Card>

        {/* TAX SLAB TABLE */}
        {showSlabs && (
          <Card style={{ marginBottom: 12 }}>
            <SH title="Tax Slabs Comparison" />
            <View style={st.slabHeader}>
              <Text style={[st.slabCol, { color: T.t3 }]}>Old Regime</Text>
              <Text style={[st.slabCol, { color: T.t3 }]}>New Regime</Text>
            </View>
            {Math.max(SLABS_OLD.length, SLABS_NEW.length) > 0 && Array.from({ length: Math.max(SLABS_OLD.length, SLABS_NEW.length) }).map((_, i) => (
              <View key={i} style={[st.slabRow, { borderBottomColor: T.border }]}>
                {SLABS_OLD[i] ? (
                  <View style={st.slabCell}>
                    <Text style={{ fontSize: 11, color: T.t2 }}>{SLABS_OLD[i].range}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: SLABS_OLD[i].color }}>{SLABS_OLD[i].rate}</Text>
                  </View>
                ) : <View style={st.slabCell} />}
                {SLABS_NEW[i] ? (
                  <View style={st.slabCell}>
                    <Text style={{ fontSize: 11, color: T.t2 }}>{SLABS_NEW[i].range}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: SLABS_NEW[i].color }}>{SLABS_NEW[i].rate}</Text>
                  </View>
                ) : <View style={st.slabCell} />}
              </View>
            ))}
          </Card>
        )}

        {/* RESULTS */}
        {result ? (
          <>
            {/* WINNER BANNER */}
            <View style={[st.winnerBanner, { backgroundColor: result.better === 'old' ? '#4F8CFF18' : '#22C55E18', borderColor: result.better === 'old' ? '#4F8CFF40' : '#22C55E40' }]}>
              <Text style={{ fontSize: 22 }}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: result.better === 'old' ? '#4F8CFF' : '#22C55E' }}>
                  {result.better === 'old' ? 'Old Regime' : 'New Regime'} saves more
                </Text>
                <Text style={{ fontSize: 12, color: T.t2, marginTop: 2 }}>
                  You save <Text style={{ fontWeight: '700' }}>{fmt(result.saved)}</Text> annually by choosing this
                </Text>
              </View>
              <Chip label="Better ✓" color={result.better === 'old' ? '#4F8CFF' : '#22C55E'} />
            </View>

            {/* SIDE BY SIDE */}
            <View style={[st.row2, { marginBottom: 12 }]}>
              {[
                { label: 'Old Regime', tax: result.oldTax, eff: result.effOld, color: '#4F8CFF', better: result.better === 'old' },
                { label: 'New Regime', tax: result.newTax, eff: result.effNew, color: '#22C55E', better: result.better === 'new' },
              ].map(r => (
                <View key={r.label} style={[st.regimeCard, {
                  backgroundColor: r.better ? r.color + '16' : T.l2,
                  borderColor: r.better ? r.color + '44' : T.border,
                  borderWidth: r.better ? 2 : 1,
                }]}>
                  {r.better && <View style={[st.bestBadge, { backgroundColor: r.color }]}><Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>BEST</Text></View>}
                  <Text style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>{r.label}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: r.better ? r.color : T.t1 }}>{fmt(r.tax)}</Text>
                  <Text style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>Annual Tax</Text>
                  <View style={[st.divider, { backgroundColor: T.border }]} />
                  <StatRow label="Monthly" value={fmt(Math.round(r.tax / 12))} last />
                  <StatRow label="Eff. Rate" value={`${r.eff}%`} color={r.color} last />
                </View>
              ))}
            </View>

            {/* DETAILED BREAKDOWN */}
            <Card style={{ marginBottom: 12 }}>
              <SH title="Detailed Breakdown" />
              <StatRow label="Annual Income"      value={fmt(annualIncome)} />
              <StatRow label="Old Regime Tax"     value={fmt(result.oldTax)} color="#4F8CFF" />
              <StatRow label="New Regime Tax"     value={fmt(result.newTax)} color="#22C55E" />
              <StatRow label="Tax Saved"          value={fmt(result.saved)} color="#F59E0B" />
              <StatRow label="Old — Monthly Tax"  value={fmt(Math.round(result.oldTax / 12))} />
              <StatRow label="New — Monthly Tax"  value={fmt(Math.round(result.newTax / 12))} last />
            </Card>

            {/* BAR COMPARISON */}
            <Card>
              <SH title="Tax Burden Comparison" />
              <Text style={{ fontSize: 12, color: T.t3, marginBottom: 10 }}>% of annual income</Text>
              <Text style={{ fontSize: 12, color: T.t2, marginBottom: 5 }}>Old Regime — {result.effOld}%</Text>
              <Bar value={safeNum(result.effOld)} total={40} color="#4F8CFF" h={10} />
              <Text style={{ fontSize: 12, color: T.t2, marginBottom: 5, marginTop: 12 }}>New Regime — {result.effNew}%</Text>
              <Bar value={safeNum(result.effNew)} total={40} color="#22C55E" h={10} />
            </Card>
          </>
        ) : (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🧾</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 6 }}>Enter your salary</Text>
              <Text style={{ fontSize: 13, color: T.t3, textAlign: 'center', lineHeight: 20 }}>
                Fill in your monthly salary above to compare{'\n'}Old vs New tax regime automatically
              </Text>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header:      { paddingHorizontal: SP.md, paddingBottom: SP.md },
  title:       { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  annualBadge: { borderRadius: 10, padding: 10, marginTop: 4, borderWidth: 1 },
  slabHeader:  { flexDirection: 'row', marginBottom: 6 },
  slabCol:     { flex: 1, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  slabRow:     { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1 },
  slabCell:    { flex: 1, gap: 2 },
  winnerBanner:{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  row2:        { flexDirection: 'row', gap: 10 },
  regimeCard:  { flex: 1, borderRadius: 16, padding: 14, position: 'relative', overflow: 'hidden' },
  bestBadge:   { position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  divider:     { height: 1, marginVertical: 8 },
});
