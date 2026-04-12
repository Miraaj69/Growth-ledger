// src/screens/GrowthScreen.js
import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../store/AppContext';
import { Colors, Spacing, Radius } from '../constants/theme';
import { inr, pct, sipMaturity, retirementTarget, emergencyTarget, monthlyForGoal, calcDecisions, MONTHS_SHORT } from '../utils/calculations';
import { Card, GradientCard, Chip, ProgressBar, SectionHeader, StatRow } from '../components/UIComponents';

const TABS = [['career','🚀 Career'],['simulator','🎯 Simulate'],['decisions','🧠 Decide'],['tax','🧾 Tax']];

export default function GrowthScreen() {
  const { state: s, set } = useApp();
  const [tab, setTab] = useState('career');

  const totalIncome = s.incomes.reduce((a, x) => a + x.amount, 0) * 12;
  const retYears    = Math.max(1, (s.retirementAge || 55) - (s.userAge || 28));
  const retCorpus   = retirementTarget(totalIncome, retYears);
  const curSavings  = s.assets.reduce((a, x) => a + x.value, 0);
  const monthNeeded = monthlyForGoal(retCorpus, curSavings, retYears * 12);
  const decisions   = useMemo(() => calcDecisions(s), [s]);

  const oldTax = totalIncome > 1500000 ? (totalIncome-1500000)*.3+375000 : totalIncome > 1200000 ? (totalIncome-1200000)*.25+225000 : totalIncome > 1000000 ? (totalIncome-1000000)*.2+112500 : 0;
  const newTax = totalIncome > 1500000 ? (totalIncome-1500000)*.3+187500 : totalIncome > 1200000 ? (totalIncome-1200000)*.2+127500 : 0;
  const better = oldTax < newTax ? 'Old' : 'New';

  const ladder = [
    { role:'HSE Officer',  years:'0–3 yrs', icon:'🛡️', color:Colors.blue,   active:true  },
    { role:'Senior HSE',   years:'3–6 yrs', icon:'⚡',  color:Colors.green,  active:false },
    { role:'HSE Manager',  years:'6–10 yrs',icon:'🎯', color:Colors.purple, active:false },
    { role:'HSE Director', years:'10+ yrs', icon:'👑', color:Colors.amber,  active:false },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Growth</Text>
        <Text style={styles.pageSub}>Career · Simulator · Decisions · Retirement</Text>
      </View>

      {/* SEGMENT TABS */}
      <View style={styles.tabWrap}>
        {TABS.map(([k, l]) => {
          const on = tab === k;
          return <Pressable key={k} onPress={() => setTab(k)} style={[styles.tabBtn, on && styles.tabBtnActive]}><Text style={[styles.tabText, on && styles.tabTextActive]}>{l}</Text></Pressable>;
        })}
      </View>

      {/* CAREER */}
      {tab === 'career' && (
        <View style={styles.tabContent}>
          <Card style={styles.section}>
            <SectionHeader title="HSE Career Roadmap" />
            {ladder.map((step, i) => (
              <View key={i} style={styles.ladderRow}>
                <View style={styles.ladderLeft}>
                  <View style={[styles.ladderIcon, { backgroundColor: step.active ? step.color : Colors.layer2, shadowColor: step.active ? step.color : 'transparent', borderColor: step.active ? 'transparent' : Colors.border }]}>
                    <Text style={{ fontSize: 18 }}>{step.icon}</Text>
                  </View>
                  {i < ladder.length - 1 && <View style={[styles.ladderLine, { backgroundColor: step.active ? step.color + '60' : 'rgba(255,255,255,0.07)' }]} />}
                </View>
                <View style={[styles.ladderRight, { paddingBottom: i < ladder.length - 1 ? 40 : 0 }]}>
                  <View style={styles.ladderTitleRow}>
                    <Text style={[styles.ladderRole, { color: step.active ? step.color : Colors.t2 }]}>{step.role}</Text>
                    {step.active && <Chip label="You are here" color={step.color} dot />}
                  </View>
                  <Text style={styles.ladderYears}>{step.years}</Text>
                </View>
              </View>
            ))}
          </Card>

          <Card style={styles.section}>
            <SectionHeader title="Certifications" right="Add +" />
            {s.certifications.map((c, i) => (
              <View key={i} style={[styles.certRow, i < s.certifications.length - 1 && styles.certBorder]}>
                <View style={[styles.certIcon, { backgroundColor: c.color + '20' }]}><Text style={{ fontSize: 19 }}>{c.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>{c.name}</Text>
                  <Text style={styles.certBody}>{c.body}</Text>
                </View>
                <Chip label={c.status} color={c.status === 'Done' ? Colors.green : c.status === 'In Progress' ? Colors.amber : Colors.t3} />
              </View>
            ))}
          </Card>

          <Card style={styles.section}>
            <SectionHeader title="Career Milestones" />
            {[
              { title:'Complete ISO 45001 LA', date:'Mar 2025', icon:'📋', color:Colors.amber },
              { title:'Apply for Senior HSE',   date:'Jun 2025', icon:'🎯', color:Colors.green },
              { title:'Start ADIS Cert',         date:'Aug 2025', icon:'📝', color:Colors.purple },
            ].map((t, i) => (
              <View key={i} style={[styles.milestoneRow, i < 2 && styles.milestoneBorder]}>
                <View style={[styles.milestoneIcon, { backgroundColor: t.color + '16' }]}><Text style={{ fontSize: 20 }}>{t.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>{t.title}</Text>
                  <Text style={styles.milestoneDate}>{t.date}</Text>
                </View>
                <View style={[styles.milestoneDot, { backgroundColor: t.color }]} />
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* SIMULATOR */}
      {tab === 'simulator' && (
        <View style={styles.tabContent}>
          {/* Salary hike */}
          <Card style={styles.section}>
            <SectionHeader title="Salary Hike Simulator" />
            <View style={styles.simRow}>
              <Text style={styles.simLabel}>Expected Hike</Text>
              <Text style={[styles.simVal, { color: Colors.green }]}>+{s.simSalaryHike || 20}%</Text>
            </View>
            <View style={styles.sliderRow}>
              <Pressable onPress={() => set({ simSalaryHike: Math.max(0, (s.simSalaryHike||20) - 5) })} style={styles.simBtn}><Text style={styles.simBtnT}>−</Text></Pressable>
              <View style={{ flex: 1 }}><ProgressBar value={s.simSalaryHike || 20} total={100} color={Colors.green} height={6} /></View>
              <Pressable onPress={() => set({ simSalaryHike: Math.min(100, (s.simSalaryHike||20) + 5) })} style={styles.simBtn}><Text style={styles.simBtnT}>+</Text></Pressable>
            </View>
            <View style={[styles.simResult, { backgroundColor: Colors.greenDim, borderColor: Colors.green + '25' }]}>
              <View style={styles.simResultRow}><Text style={styles.simResultLabel}>New Monthly Salary</Text><Text style={[styles.simResultVal, { color: Colors.green }]}>{inr(s.salary * (1 + (s.simSalaryHike||20) / 100))}</Text></View>
              <View style={styles.simResultRow}><Text style={styles.simResultLabel}>Extra/month</Text><Text style={styles.simResultValSm}>{inr(s.salary * (s.simSalaryHike||20) / 100)}</Text></View>
              <View style={styles.simResultRow}><Text style={styles.simResultLabel}>Extra/year</Text><Text style={styles.simResultValSm}>{inr(s.salary * (s.simSalaryHike||20) / 100 * 12)}</Text></View>
            </View>
          </Card>

          {/* SIP simulator */}
          <Card style={styles.section}>
            <SectionHeader title="SIP Growth Simulator" />
            <View style={styles.simRow}><Text style={styles.simLabel}>SIP Multiplier</Text><Text style={[styles.simVal, { color: Colors.purple }]}>{s.simSipMulti || 2}x</Text></View>
            <View style={styles.sliderRow}>
              <Pressable onPress={() => set({ simSipMulti: Math.max(1, (s.simSipMulti||2) - 0.5) })} style={styles.simBtn}><Text style={styles.simBtnT}>−</Text></Pressable>
              <View style={{ flex: 1 }}><ProgressBar value={(s.simSipMulti||2) - 1} total={4} color={Colors.purple} height={6} /></View>
              <Pressable onPress={() => set({ simSipMulti: Math.min(5, (s.simSipMulti||2) + 0.5) })} style={styles.simBtn}><Text style={styles.simBtnT}>+</Text></Pressable>
            </View>
            <View style={styles.simRow}><Text style={styles.simLabel}>Annual Step-Up</Text><Text style={[styles.simVal, { color: Colors.teal }]}>{s.simSipStepUp || 10}%</Text></View>
            <View style={styles.sliderRow}>
              <Pressable onPress={() => set({ simSipStepUp: Math.max(0, (s.simSipStepUp||10) - 5) })} style={styles.simBtn}><Text style={styles.simBtnT}>−</Text></Pressable>
              <View style={{ flex: 1 }}><ProgressBar value={s.simSipStepUp || 10} total={30} color={Colors.teal} height={6} /></View>
              <Pressable onPress={() => set({ simSipStepUp: Math.min(30, (s.simSipStepUp||10) + 5) })} style={styles.simBtn}><Text style={styles.simBtnT}>+</Text></Pressable>
            </View>
            {(() => {
              const base   = s.sips.reduce((a, x) => a + x.amount, 0);
              const newSip = base * (s.simSipMulti || 2);
              const mat1Y  = sipMaturity(newSip, 12, 14);
              const mat5Y  = sipMaturity(newSip, 60, 14);
              return (
                <View style={[styles.simResult, { backgroundColor: Colors.purpleDim, borderColor: Colors.purple + '25' }]}>
                  <View style={styles.simResultRow}><Text style={styles.simResultLabel}>New SIP/month</Text><Text style={[styles.simResultVal, { color: Colors.purple }]}>{inr(newSip)}</Text></View>
                  <View style={styles.simResultRow}><Text style={styles.simResultLabel}>1-Year corpus</Text><Text style={[styles.simResultValSm, { color: Colors.green }]}>{inr(mat1Y)}</Text></View>
                  <View style={styles.simResultRow}><Text style={styles.simResultLabel}>5-Year corpus</Text><Text style={[styles.simResultValSm, { color: Colors.green }]}>{inr(mat5Y)}</Text></View>
                </View>
              );
            })()}
          </Card>

          {/* Retirement */}
          <Card style={styles.section}>
            <SectionHeader title="Retirement Planner" />
            <View style={styles.ageRow}>
              {[{ label:'Current Age', key:'userAge' }, { label:'Retire At', key:'retirementAge' }].map((f) => (
                <View key={f.key} style={styles.ageCard}>
                  <Text style={styles.ageLabel}>{f.label}</Text>
                  <View style={styles.ageAdjRow}>
                    <Pressable onPress={() => set({ [f.key]: Math.max(18, (s[f.key]||28) - 1) })} style={styles.ageBtn}><Text style={styles.ageBtnT}>−</Text></Pressable>
                    <Text style={styles.ageVal}>{s[f.key] || 28}</Text>
                    <Pressable onPress={() => set({ [f.key]: Math.min(80, (s[f.key]||28) + 1) })} style={styles.ageBtn}><Text style={styles.ageBtnT}>+</Text></Pressable>
                  </View>
                </View>
              ))}
            </View>
            <View style={[styles.simResult, { backgroundColor: Colors.purpleDim, borderColor: Colors.purple + '25' }]}>
              {[
                { l:'Years to retire',    v:`${retYears} years` },
                { l:'Corpus needed',      v:inr(retCorpus),   c:Colors.purple, big:true },
                { l:'Current savings',    v:inr(curSavings) },
                { l:'Gap to fill',        v:inr(Math.max(0, retCorpus - curSavings)), c:Colors.red },
                { l:'Save/month needed',  v:inr(monthNeeded), c:Colors.green, big:true },
              ].map((r, i) => <View key={i} style={styles.simResultRow}><Text style={styles.simResultLabel}>{r.l}</Text><Text style={[r.big ? styles.simResultVal : styles.simResultValSm, r.c && { color: r.c }]}>{r.v}</Text></View>)}
              <ProgressBar value={curSavings} total={retCorpus} color={Colors.purple} height={5} />
              <Text style={styles.retPct}>{pct(curSavings, retCorpus)}% of retirement goal reached</Text>
            </View>
          </Card>

          {/* 5Y projection */}
          <GradientCard colors={['#080e2a', '#0f2060']} style={styles.section}>
            <SectionHeader title="5-Year Salary Projection" />
            {[12, 28, 50, 75, 110].map((p, i) => (
              <View key={i} style={styles.projRow}>
                <Text style={styles.projYear}>Y{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <ProgressBar value={Math.min(100, p)} total={100} color={Colors.blue} height={7} />
                </View>
                <Text style={styles.projVal}>{inr(Math.round(s.salary * (1 + p / 100)))}</Text>
              </View>
            ))}
          </GradientCard>
        </View>
      )}

      {/* DECISIONS */}
      {tab === 'decisions' && (
        <View style={styles.tabContent}>
          <View style={styles.decisionHeader}>
            <Text style={{ fontSize: 22 }}>🧠</Text>
            <View>
              <Text style={styles.decisionTitle}>AI Decision Engine</Text>
              <Text style={styles.decisionSub}>Based on your actual financial data</Text>
            </View>
          </View>
          {decisions.map((d, i) => (
            <Card key={i} style={styles.section}>
              <View style={styles.decisionRow}>
                <View style={[styles.decisionIcon, { backgroundColor: d.color + '18' }]}><Text style={{ fontSize: 20 }}>{d.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.decisionQ}>{d.q}</Text>
                  <Text style={[styles.decisionRec, { color: d.color }]}>{d.rec}</Text>
                </View>
              </View>
              <View style={[styles.decisionReason, { backgroundColor: d.color + '10', borderColor: d.color + '22' }]}>
                <Text style={styles.decisionReasonText}>{d.reason}</Text>
              </View>
            </Card>
          ))}
          {s.behaviorHistory && s.behaviorHistory.length > 0 && (
            <Card style={styles.section}>
              <SectionHeader title="Your Behavior Patterns" />
              {s.behaviorHistory.map((b, i) => (
                <View key={i} style={[styles.behaviorRow, i < s.behaviorHistory.length - 1 && styles.behaviorBorder]}>
                  <Text style={styles.behaviorMonth}>{b.month}</Text>
                  <View style={{ flex: 1, gap: 5 }}>
                    <ProgressBar value={b.attended} total={s.workingDays} color={b.attended >= 22 ? Colors.green : Colors.amber} height={4} />
                  </View>
                  <View style={{ gap: 5, alignItems: 'flex-end' }}>
                    <Chip label={`Wants ${b.wantsPct}%`} color={b.wantsPct > 30 ? Colors.red : Colors.green} />
                    <Chip label={`${b.attended} days`} color={b.attended >= 22 ? Colors.green : Colors.amber} />
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

      {/* TAX */}
      {tab === 'tax' && (
        <View style={styles.tabContent}>
          <Card style={styles.section}>
            <SectionHeader title="Tax Estimator (India)" />
            <View style={[styles.taxBadge, { backgroundColor: Colors.purpleDim, borderColor: Colors.purple + '28' }]}>
              <Text style={{ fontSize: 17 }}>🏆</Text>
              <Text style={[styles.taxBadgeText, { color: Colors.purple }]}><Text style={{ fontWeight: '700' }}>{better} Regime</Text> saves you more · Annual: {inr(totalIncome)}</Text>
            </View>
            <View style={styles.taxGrid}>
              {[{ label:'Old Regime', tax:oldTax, color:Colors.amber }, { label:'New Regime', tax:newTax, color:Colors.blue }].map((r) => (
                <View key={r.label} style={[styles.taxCard, { backgroundColor: r.label.startsWith(better) ? r.color + '16' : Colors.layer2, borderColor: r.label.startsWith(better) ? r.color + '40' : Colors.border }]}>
                  <Text style={styles.taxCardLabel}>{r.label}</Text>
                  <Text style={[styles.taxCardVal, { color: r.label.startsWith(better) ? r.color : Colors.t1 }]}>{inr(r.tax)}</Text>
                  <Text style={styles.taxCardSub}>Annual Tax</Text>
                  {r.label.startsWith(better) && <View style={{ marginTop: 6 }}><Chip label="Better ✓" color={r.color} /></View>}
                </View>
              ))}
            </View>
            <View style={styles.taxStats}>
              {[
                { l:'Monthly Tax',          v:inr(Math.min(oldTax, newTax) / 12) },
                { l:'Tax saved (vs other)', v:inr(Math.abs(oldTax - newTax)), c:Colors.green },
                { l:'Effective Rate',       v:`${((Math.min(oldTax, newTax) / Math.max(totalIncome, 1)) * 100).toFixed(1)}%` },
              ].map((r, i) => (
                <View key={i} style={[styles.taxStatRow, i < 2 && styles.taxStatBorder]}>
                  <Text style={styles.taxStatLabel}>{r.l}</Text>
                  <Text style={[styles.taxStatVal, r.c && { color: r.c }]}>{r.v}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Emergency Fund */}
          {(() => {
            const monthlyExp = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);
            const needed     = emergencyTarget(monthlyExp);
            const saved      = s.goals.find((g) => g.title.toLowerCase().includes('emergency'))?.saved || 0;
            return (
              <Card style={styles.section}>
                <SectionHeader title="Emergency Fund Status" />
                <View style={[styles.simResult, { backgroundColor: Colors.tealDim, borderColor: Colors.teal + '25' }]}>
                  {[
                    { l:'3-month target',  v:inr(needed / 2) },
                    { l:'6-month target',  v:inr(needed), c:Colors.teal, big:true },
                    { l:'Currently saved', v:inr(saved), c:Colors.green },
                    { l:'Still need',      v:inr(Math.max(0, needed - saved)), c:Colors.red },
                  ].map((r, i) => <View key={i} style={styles.simResultRow}><Text style={styles.simResultLabel}>{r.l}</Text><Text style={[r.big ? styles.simResultVal : styles.simResultValSm, r.c && { color: r.c }]}>{r.v}</Text></View>)}
                  <ProgressBar value={saved} total={needed} color={Colors.teal} height={6} />
                  <Text style={styles.retPct}>{pct(saved, needed)}% of 6-month fund</Text>
                </View>
              </Card>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.bg },
  header:           { paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  pageTitle:        { fontFamily: 'Syne_800ExtraBold', fontSize: 27, color: Colors.t1, letterSpacing: -0.5 },
  pageSub:          { fontSize: 13, color: Colors.t3, marginTop: 2 },
  tabWrap:          { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.layer1, borderRadius: Radius.md + 2, padding: 5, gap: 4, borderWidth: 1, borderColor: Colors.border },
  tabBtn:           { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabBtnActive:     { backgroundColor: Colors.blue },
  tabText:          { fontSize: 11, fontWeight: '600', color: Colors.t3 },
  tabTextActive:    { color: '#fff' },
  tabContent:       { paddingHorizontal: Spacing.md },
  section:          { marginBottom: Spacing.sm + 2 },
  ladderRow:        { flexDirection: 'row', gap: 13 },
  ladderLeft:       { alignItems: 'center' },
  ladderIcon:       { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowOpacity: 0.5, shadowRadius: 14, elevation: 6 },
  ladderLine:       { width: 2, flex: 1, marginVertical: 4 },
  ladderRight:      { flex: 1, paddingTop: 8 },
  ladderTitleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  ladderRole:       { fontFamily: 'Syne_700Bold', fontSize: 14 },
  ladderYears:      { fontSize: 12, color: Colors.t3 },
  certRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 11 },
  certBorder:       { borderBottomWidth: 1, borderBottomColor: Colors.border },
  certIcon:         { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  certName:         { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  certBody:         { fontSize: 12, color: Colors.t3, marginTop: 1 },
  milestoneRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  milestoneBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
  milestoneIcon:    { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle:   { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  milestoneDate:    { fontSize: 12, color: Colors.t3, marginTop: 2 },
  milestoneDot:     { width: 7, height: 7, borderRadius: 99 },
  simRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  simLabel:         { fontSize: 13, color: Colors.t2 },
  simVal:           { fontFamily: 'Syne_700Bold', fontSize: 14 },
  sliderRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  simBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.layer2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  simBtnT:          { fontSize: 20, color: Colors.t1, lineHeight: 26 },
  simResult:        { borderRadius: 12, padding: Spacing.sm + 4, borderWidth: 1, gap: 5 },
  simResultRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  simResultLabel:   { fontSize: 12, color: Colors.t2 },
  simResultVal:     { fontFamily: 'Syne_700Bold', fontSize: 14 },
  simResultValSm:   { fontWeight: '600', fontSize: 13, color: Colors.t1 },
  retPct:           { fontSize: 11, color: Colors.t3, marginTop: 5 },
  ageRow:           { flexDirection: 'row', gap: 9, marginBottom: 13 },
  ageCard:          { flex: 1, backgroundColor: Colors.layer2, borderRadius: 11, padding: Spacing.sm + 4, borderWidth: 1, borderColor: Colors.border },
  ageLabel:         { fontSize: 10, color: Colors.t3, marginBottom: 7 },
  ageAdjRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ageBtn:           { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.layer1, alignItems: 'center', justifyContent: 'center' },
  ageBtnT:          { fontSize: 18, color: Colors.t1 },
  ageVal:           { fontFamily: 'Syne_700Bold', fontSize: 20, color: Colors.t1 },
  projRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  projYear:         { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.35)', width: 28 },
  projVal:          { fontFamily: 'Syne_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.9)', width: 72, textAlign: 'right' },
  decisionHeader:   { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: Colors.layer2, borderRadius: 13, padding: Spacing.sm + 4, marginHorizontal: Spacing.md, marginBottom: Spacing.sm + 2, borderWidth: 1, borderColor: Colors.border },
  decisionTitle:    { fontWeight: '700', fontSize: 14, color: Colors.t1 },
  decisionSub:      { fontSize: 12, color: Colors.t3 },
  decisionRow:      { flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginBottom: 11 },
  decisionIcon:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  decisionQ:        { fontSize: 12, color: Colors.t3, marginBottom: 3 },
  decisionRec:      { fontFamily: 'Syne_800ExtraBold', fontSize: 15 },
  decisionReason:   { borderRadius: 11, padding: Spacing.sm + 2, borderWidth: 1 },
  decisionReasonText:{ fontSize: 13, color: Colors.t2, lineHeight: 19 },
  behaviorRow:      { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  behaviorBorder:   { borderBottomWidth: 1, borderBottomColor: Colors.border },
  behaviorMonth:    { fontWeight: '600', fontSize: 13, color: Colors.t1, width: 32 },
  taxBadge:         { flexDirection: 'row', gap: 9, padding: Spacing.sm + 4, borderRadius: 11, borderWidth: 1, marginBottom: 13, alignItems: 'center' },
  taxBadgeText:     { fontSize: 13, flex: 1, lineHeight: 19 },
  taxGrid:          { flexDirection: 'row', gap: 10, marginBottom: 13 },
  taxCard:          { flex: 1, borderRadius: 13, padding: 13, alignItems: 'center', borderWidth: 1 },
  taxCardLabel:     { fontSize: 11, color: Colors.t3, marginBottom: 5 },
  taxCardVal:       { fontFamily: 'Syne_800ExtraBold', fontSize: 19 },
  taxCardSub:       { fontSize: 10, color: Colors.t3, marginTop: 4 },
  taxStats:         { backgroundColor: Colors.layer2, borderRadius: 11, padding: Spacing.sm + 4 },
  taxStatRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  taxStatBorder:    { borderBottomWidth: 1, borderBottomColor: Colors.border },
  taxStatLabel:     { fontSize: 12, color: Colors.t2 },
  taxStatVal:       { fontWeight: '700', fontSize: 13, color: Colors.t1 },
});
