// SimulatorScreen.js
import React, { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, SH, Bar, Chip, Input, StatRow, GCard } from './UI';
import { fmt, safeNum, sipMaturity, retirementCorpus, monthlyNeeded } from './helpers';

const TABS = [
  { key: 'hike',       label: '💼 Salary Hike' },
  { key: 'sip',        label: '📈 SIP Growth'   },
  { key: 'retirement', label: '🏖️ Retirement'   },
];

// ── SIP with Step-Up ──────────────────────────────────────
const sipWithStepUp = (monthly, years, returnPct, stepUpPct) => {
  const points = [];
  let total = 0;
  let cur   = safeNum(monthly);
  const r   = safeNum(returnPct) / 100 / 12;
  for (let m = 0; m < years * 12; m++) {
    if (m > 0 && m % 12 === 0) cur *= (1 + safeNum(stepUpPct) / 100);
    total = total * (1 + r) + cur;
    if ((m + 1) % 12 === 0) points.push({ year: (m + 1) / 12, value: Math.round(total) });
  }
  return { corpus: Math.round(total), points };
};

// ── SALARY HIKE TAB ───────────────────────────────────────
function SalaryHikeTab() {
  const { T } = useTheme();
  const [current, setCurrent]   = useState('');
  const [hikePct, setHikePct]   = useState('20');

  const result = useMemo(() => {
    const cur  = safeNum(current);
    const pct  = safeNum(hikePct);
    if (cur === 0) return null;
    const newMo  = Math.round(cur * (1 + pct / 100));
    const diffMo = newMo - cur;
    return { cur, newMo, diffMo, diffYr: diffMo * 12, pct };
  }, [current, hikePct]);

  return (
    <View style={{ paddingHorizontal: SP.md }}>
      <Card style={{ marginBottom: 12 }}>
        <SH title="Current Details" />
        <Input label="Current Monthly Salary (₹)" value={current} onChange={setCurrent}
          type="numeric" prefix="₹" placeholder="Enter salary" />
        <Text style={{ fontSize: 13, color: T.t2, fontWeight: '600', marginBottom: 8 }}>
          Expected Hike: <Text style={{ color: '#22C55E' }}>{safeNum(hikePct)}%</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setHikePct(v => String(Math.max(0, safeNum(v) - 5)))}
            style={[st.adjBtn, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 20, color: T.t1 }}>−</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Bar value={safeNum(hikePct)} total={100} color="#22C55E" h={8} />
          </View>
          <Pressable onPress={() => setHikePct(v => String(Math.min(100, safeNum(v) + 5)))}
            style={[st.adjBtn, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 20, color: T.t1 }}>+</Text>
          </Pressable>
        </View>
      </Card>

      {result ? (
        <>
          <GCard colors={['#052e16', '#064e30']} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>New Monthly Salary</Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>{fmt(result.newMo)}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>+{result.pct}% from {fmt(result.cur)}</Text>
          </GCard>
          <Card style={{ marginBottom: 12 }}>
            <SH title="Your Hike Breakdown" />
            <StatRow label="Current Monthly"  value={fmt(result.cur)} />
            <StatRow label="New Monthly"       value={fmt(result.newMo)}  color="#22C55E" />
            <StatRow label="Monthly Increase"  value={`+${fmt(result.diffMo)}`} color="#22C55E" />
            <StatRow label="Annual Increase"   value={`+${fmt(result.diffYr)}`} color="#22C55E" last />
          </Card>
          <Card>
            <SH title="What you could do with the extra" />
            {[
              { icon: '📈', label: 'Invest entire hike', val: `${fmt(result.diffMo * 12 * 10)} in 10Y @ 12%` },
              { icon: '🏦', label: 'Pay off debt faster', val: `${fmt(result.diffMo)}/mo extra EMI` },
              { icon: '💰', label: 'Add to emergency fund', val: `6-month fund in ${Math.ceil(result.cur * 6 / result.diffMo)} mo` },
            ].map((x, i) => (
              <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }, i < 2 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
                <Text style={{ fontSize: 22 }}>{x.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: T.t1 }}>{x.label}</Text>
                  <Text style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{x.val}</Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💼</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>Enter your current salary</Text>
            <Text style={{ fontSize: 13, color: T.t3, textAlign: 'center', marginTop: 6 }}>See exactly what your hike means in rupees</Text>
          </View>
        </Card>
      )}
    </View>
  );
}

// ── SIP GROWTH TAB ────────────────────────────────────────
function SipGrowthTab() {
  const { T } = useTheme();
  const [monthly, setMonthly]   = useState('');
  const [retPct, setRetPct]     = useState('12');
  const [years, setYears]       = useState('10');
  const [stepUp, setStepUp]     = useState('10');

  const result = useMemo(() => {
    const mo  = safeNum(monthly);
    const ret = safeNum(retPct);
    const yr  = safeNum(years, 1);
    const su  = safeNum(stepUp);
    if (mo === 0) return null;
    const corpus1Y  = sipMaturity(mo, 12, ret);
    const corpus5Y  = sipMaturity(mo, 60, ret);
    const withStepUp = sipWithStepUp(mo, yr, ret, su);
    const invested   = mo * 12 * yr;
    const gains      = withStepUp.corpus - invested;
    return { corpus1Y, corpus5Y, withStepUp, invested, gains, yr, points: withStepUp.points };
  }, [monthly, retPct, years, stepUp]);

  return (
    <View style={{ paddingHorizontal: SP.md }}>
      <Card style={{ marginBottom: 12 }}>
        <SH title="SIP Parameters" />
        <Input label="Monthly SIP (₹)" value={monthly} onChange={setMonthly}
          type="numeric" prefix="₹" placeholder="e.g. 5000" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Input label="Annual Return %" value={retPct} onChange={setRetPct}
            type="numeric" suffix="%" placeholder="12" style={{ flex: 1 }} />
          <Input label="Years" value={years} onChange={setYears}
            type="numeric" placeholder="10" style={{ flex: 1 }} />
        </View>
        <Text style={{ fontSize: 13, color: T.t2, fontWeight: '600', marginBottom: 8 }}>
          Annual Step-Up: <Text style={{ color: '#A78BFA' }}>{safeNum(stepUp)}%</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setStepUp(v => String(Math.max(0, safeNum(v) - 5)))}
            style={[st.adjBtn, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 20, color: T.t1 }}>−</Text>
          </Pressable>
          <View style={{ flex: 1 }}><Bar value={safeNum(stepUp)} total={30} color="#A78BFA" h={8} /></View>
          <Pressable onPress={() => setStepUp(v => String(Math.min(30, safeNum(v) + 5)))}
            style={[st.adjBtn, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 20, color: T.t1 }}>+</Text>
          </Pressable>
        </View>
      </Card>

      {result ? (
        <>
          {/* MAIN CORPUS */}
          <GCard colors={['#1a0a38', '#3d1a78']} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
              {result.yr}-Year Corpus (with {safeNum(stepUp)}% step-up)
            </Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>
              {fmt(result.withStepUp.corpus)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
              <View>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Invested</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>{fmt(result.invested)}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Gains</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#86efac' }}>{fmt(result.gains)}</Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <Bar value={result.invested} total={result.withStepUp.corpus} color="rgba(255,255,255,0.4)" h={5} />
            </View>
          </GCard>

          {/* MILESTONES */}
          <Card style={{ marginBottom: 12 }}>
            <SH title="Growth Milestones" />
            <StatRow label="1-Year Corpus"       value={fmt(result.corpus1Y)} color="#4F8CFF" />
            <StatRow label="5-Year Corpus"        value={fmt(result.corpus5Y)} color="#22C55E" />
            <StatRow label={`${result.yr}Y (Flat rate)`} value={fmt(sipMaturity(safeNum(monthly), result.yr * 12, safeNum(retPct)))} color="#F59E0B" />
            <StatRow label={`${result.yr}Y (With step-up)`} value={fmt(result.withStepUp.corpus)} color="#A78BFA" last />
          </Card>

          {/* YEAR BY YEAR */}
          {result.points.length > 0 && (
            <Card>
              <SH title="Year-by-Year Growth" />
              {result.points.map((p, i) => (
                <View key={i} style={[{ paddingVertical: 10 }, i < result.points.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: T.t2 }}>Year {p.year}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>{fmt(p.value)}</Text>
                  </View>
                  <Bar value={p.value} total={result.withStepUp.corpus} color="#A78BFA" h={4} />
                </View>
              ))}
            </Card>
          )}
        </>
      ) : (
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📈</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>Enter SIP amount</Text>
            <Text style={{ fontSize: 13, color: T.t3, textAlign: 'center', marginTop: 6 }}>See your wealth grow over time</Text>
          </View>
        </Card>
      )}
    </View>
  );
}

// ── RETIREMENT TAB ────────────────────────────────────────
function RetirementTab() {
  const { T } = useTheme();
  const [curAge,      setCurAge]      = useState('');
  const [retAge,      setRetAge]      = useState('');
  const [curSavings,  setCurSavings]  = useState('');
  const [monthlySal,  setMonthlySal]  = useState('');

  const result = useMemo(() => {
    const ca  = safeNum(curAge);
    const ra  = safeNum(retAge, ca + 1);
    const cs  = safeNum(curSavings);
    const sal = safeNum(monthlySal);
    if (ca === 0 || ra <= ca) return null;
    const years    = ra - ca;
    const annualInc = sal * 12;
    const corpus   = retirementCorpus(annualInc, years);
    const gap      = Math.max(0, corpus - cs);
    const monthly  = monthlyNeeded(corpus, cs, years * 12);
    const progress = cs > 0 ? Math.min(100, Math.round((cs / corpus) * 100)) : 0;
    return { years, corpus, gap, monthly, progress, cs, annualInc };
  }, [curAge, retAge, curSavings, monthlySal]);

  return (
    <View style={{ paddingHorizontal: SP.md }}>
      <Card style={{ marginBottom: 12 }}>
        <SH title="Retirement Details" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Input label="Current Age" value={curAge} onChange={setCurAge}
            type="numeric" placeholder="28" style={{ flex: 1 }} />
          <Input label="Retire At" value={retAge} onChange={setRetAge}
            type="numeric" placeholder="55" style={{ flex: 1 }} />
        </View>
        <Input label="Monthly Salary (₹)" value={monthlySal} onChange={setMonthlySal}
          type="numeric" prefix="₹" placeholder="Current in-hand salary" />
        <Input label="Current Savings (₹)" value={curSavings} onChange={setCurSavings}
          type="numeric" prefix="₹" placeholder="All savings + investments" />
      </Card>

      {result ? (
        <>
          <GCard colors={['#0c1a4e', '#1a3080']} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Retirement Corpus Needed</Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>{fmt(result.corpus)}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              25x rule · inflation-adjusted over {result.years} years
            </Text>
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Progress</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#86efac' }}>{result.progress}%</Text>
              </View>
              <Bar value={result.progress} total={100} color="#22C55E" h={6} />
            </View>
          </GCard>

          <Card style={{ marginBottom: 12 }}>
            <SH title="Your Retirement Plan" />
            <StatRow label="Years to Retire"        value={`${result.years} years`} />
            <StatRow label="Current Savings"         value={fmt(result.cs)} color="#22C55E" />
            <StatRow label="Corpus Needed"           value={fmt(result.corpus)} color="#4F8CFF" />
            <StatRow label="Gap to Fill"             value={fmt(result.gap)} color="#EF4444" />
            <StatRow label="Monthly SIP Needed"      value={fmt(result.monthly)} color="#A78BFA" last />
          </Card>

          {/* MILESTONES TIMELINE */}
          <Card>
            <SH title="Retirement Milestones" />
            {[
              { age: safeNum(curAge) + Math.round(result.years * 0.25), pct: 25, label: '25% milestone' },
              { age: safeNum(curAge) + Math.round(result.years * 0.5),  pct: 50, label: 'Halfway there' },
              { age: safeNum(curAge) + Math.round(result.years * 0.75), pct: 75, label: '75% milestone' },
              { age: safeNum(retAge), pct: 100, label: 'Retirement! 🎉' },
            ].map((m, i) => (
              <View key={i} style={[{ paddingVertical: 12 }, i < 3 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: T.t2 }}>Age {m.age} — {m.label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: m.pct === 100 ? '#22C55E' : T.t1 }}>{fmt(result.corpus * m.pct / 100)}</Text>
                </View>
                <Bar value={m.pct} total={100} color={m.pct === 100 ? '#22C55E' : '#4F8CFF'} h={4} />
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏖️</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>Plan your retirement</Text>
            <Text style={{ fontSize: 13, color: T.t3, textAlign: 'center', marginTop: 6 }}>Enter your age and salary to calculate{'\n'}how much you need to retire comfortably</Text>
          </View>
        </Card>
      )}
    </View>
  );
}

// ── MAIN SIMULATOR SCREEN ─────────────────────────────────
export default function SimulatorScreen() {
  const { T } = useTheme();
  const [tab, setTab] = useState('hike');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={{ paddingTop: 56, paddingHorizontal: SP.md, paddingBottom: SP.md }}>
        <Text style={{ fontSize: 27, fontWeight: '800', color: T.t1, letterSpacing: -0.5 }}>Simulator</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>Salary · SIP · Retirement</Text>
      </View>

      {/* TAB BAR */}
      <View style={{ flexDirection:'row', marginHorizontal:SP.md, backgroundColor:T.l2, borderRadius:16, padding:5, gap:4, marginBottom:4, borderWidth:1, borderColor:T.border }}>
        {TABS.map(({ key, label }) => {
          const on = tab === key;
          return (
            <Pressable key={key} onPress={() => setTab(key)} style={{ flex:1 }}>
              <View style={[{ paddingVertical:10, borderRadius:12, alignItems:'center', justifyContent:'center' },
                on && { backgroundColor:'#4F8CFF', shadowColor:'#4F8CFF', shadowOpacity:0.45, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:6 }]}>
                <Text style={{ fontSize:11, fontWeight: on?'700':'500', color: on?'#fff':T.t3, letterSpacing:0.2 }}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 12 }}>
        {tab === 'hike'       && <SalaryHikeTab />}
        {tab === 'sip'        && <SipGrowthTab />}
        {tab === 'retirement' && <RetirementTab />}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  adjBtn:  { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar:  { flexDirection: 'row', borderRadius: 14, padding: 5, gap: 4, marginBottom: 4, borderWidth: 1 },
  tabBtn:  { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
});
