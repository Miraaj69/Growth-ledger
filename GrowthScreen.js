// GrowthScreen.js
import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, SH, Bar, Chip, StatRow, GCard, Empty, Input } from './UI';
import { fmt, safeNum, safePct, deriveState, efTarget } from './helpers';

const TABS = [
  { key: 'career',    label: '🚀 Career'    },
  { key: 'ef',        label: '🛟 Emrg Fund' },
  { key: 'behaviour', label: '📊 Analytics' },
];

// ── CAREER ROADMAP ────────────────────────────────────────
const CAREER_LADDER = [
  {
    role: 'HSE Officer', years: '0–3 years', icon: '🛡️', color: '#4F8CFF', active: true,
    skills: ['Risk Assessment', 'Incident Investigation', 'HIRA', 'Safety Audits'],
    salRange: '₹3L – ₹6L',
  },
  {
    role: 'Senior HSE Engineer', years: '3–6 years', icon: '⚡', color: '#22C55E', active: false,
    skills: ['ISO 45001 Lead', 'EHS Management', 'Team Leadership', 'Contractor Management'],
    salRange: '₹6L – ₹12L',
  },
  {
    role: 'HSE Manager', years: '6–10 years', icon: '🎯', color: '#A78BFA', active: false,
    skills: ['HSE Strategy', 'Budget Management', 'Regulatory Compliance', 'NEBOSH Diploma'],
    salRange: '₹12L – ₹25L',
  },
  {
    role: 'HSE Director / VP', years: '10+ years', icon: '👑', color: '#F59E0B', active: false,
    skills: ['Corporate HSE', 'Board Reporting', 'Global Standards', 'P&L Ownership'],
    salRange: '₹25L+',
  },
];

const CERTIFICATIONS = [
  { name: 'NEBOSH IGC',   body: 'NEBOSH UK',  icon: '🏅', importance: 'Essential', color: '#22C55E' },
  { name: 'IOSH Managing Safely', body: 'IOSH UK', icon: '🎖️', importance: 'Essential', color: '#4F8CFF' },
  { name: 'ISO 45001 LA', body: 'BSI / IRCA', icon: '📋', importance: 'High', color: '#A78BFA' },
  { name: 'NEBOSH Diploma',body: 'NEBOSH UK', icon: '🏆', importance: 'Advanced', color: '#F59E0B' },
  { name: 'ADIS',         body: 'IICPE',      icon: '📝', importance: 'Specialist', color: '#14B8A6' },
  { name: 'CSP (USA)',     body: 'BCSP',       icon: '🌟', importance: 'Premium',   color: '#EF4444' },
];

function CareerTab() {
  const { T } = useTheme();
  const { state: s } = useApp();
  const certs = s.certifications || [];
  const [expandedCert, setExpandedCert] = useState(null);

  const getCertStatus = (name) => {
    const found = certs.find(c => c?.name?.includes(name.split(' ')[0]));
    return found?.status || 'Planned';
  };

  return (
    <View>
      {/* ROADMAP */}
      <Card style={{ marginBottom: 12 }}>
        <SH title="HSE Career Roadmap" right="Your path" />
        {CAREER_LADDER.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[st.ladderIcon, {
                backgroundColor: step.active ? step.color : T.l2,
                borderColor: step.active ? 'transparent' : T.border,
                shadowColor: step.active ? step.color : 'transparent',
                shadowOpacity: step.active ? 0.5 : 0,
                shadowRadius: 12, elevation: step.active ? 6 : 0,
              }]}>
                <Text style={{ fontSize: 18 }}>{step.icon}</Text>
              </View>
              {i < CAREER_LADDER.length - 1 && (
                <View style={{ width: 2, height: 48, marginVertical: 3, backgroundColor: step.active ? step.color + '60' : T.border }} />
              )}
            </View>
            <View style={{ flex: 1, paddingTop: 8, paddingBottom: i < CAREER_LADDER.length - 1 ? 0 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: step.active ? step.color : T.t2 }}>{step.role}</Text>
                {step.active && <Chip label="You are here" color={step.color} dot sm />}
              </View>
              <Text style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>{step.years} · {step.salRange}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: i < CAREER_LADDER.length - 1 ? 12 : 0 }}>
                {step.skills.map(sk => (
                  <View key={sk} style={{ backgroundColor: step.color + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, color: step.color }}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </Card>

      {/* CERTIFICATIONS */}
      <Card style={{ marginBottom: 12 }}>
        <SH title="Key Certifications" right={`${certs.filter(c=>c?.status==='Done').length} done`} rightColor="#22C55E" />
        {CERTIFICATIONS.map((cert, i) => {
          const status = getCertStatus(cert.name);
          const statusColor = status === 'Done' ? '#22C55E' : status === 'In Progress' ? '#F59E0B' : T.t3;
          return (
            <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 }, i < CERTIFICATIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: cert.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>{cert.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 13, color: T.t1 }}>{cert.name}</Text>
                <Text style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>{cert.body} · {cert.importance}</Text>
              </View>
              <Chip label={status} color={statusColor} sm />
            </View>
          );
        })}
      </Card>

      {/* MILESTONES */}
      <Card>
        <SH title="Next Career Milestones" />
        {[
          { title: 'Complete ISO 45001 Lead Auditor', date: 'Next 3 months',  icon: '📋', color: '#A78BFA' },
          { title: 'Apply for Senior HSE roles',       date: 'After 6 months', icon: '🎯', color: '#22C55E' },
          { title: 'Start NEBOSH Diploma',             date: '1 year',         icon: '🏆', color: '#F59E0B' },
          { title: 'Target HSE Manager positions',     date: '3–5 years',      icon: '👑', color: '#4F8CFF' },
        ].map((m, i) => (
          <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }, i < 3 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: m.color + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>{m.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: T.t1 }}>{m.title}</Text>
              <Text style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{m.date}</Text>
            </View>
            <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: m.color }} />
          </View>
        ))}
      </Card>
    </View>
  );
}

// ── EMERGENCY FUND TRACKER ────────────────────────────────
function EFTab() {
  const { T }         = useTheme();
  const { state: s }  = useApp();
  const [manualSaved, setManualSaved] = useState('');

  const d = useMemo(() => { try { return deriveState(s); } catch { return { needsBudget:0, totalIncome:0 }; } }, [s]);

  const monthly  = d.needsBudget || d.totalIncome * 0.5;
  const target3  = monthly * 3;
  const target6  = monthly * 6;
  const efGoal   = (s.goals || []).find(g => g?.title?.toLowerCase().includes('emergency'));
  const saved    = safeNum(manualSaved) || safeNum(efGoal?.saved);

  return (
    <View>
      <Card style={{ marginBottom: 12 }}>
        <SH title="Your Emergency Fund" />
        <Input label="Current emergency savings (₹)" value={manualSaved}
          onChange={setManualSaved} type="numeric" prefix="₹" placeholder={saved > 0 ? String(saved) : 'Enter amount'} />
        {d.totalIncome === 0 && (
          <View style={{ backgroundColor: '#F59E0B10', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#F59E0B30' }}>
            <Text style={{ fontSize: 12, color: '#F59E0B' }}>Add salary in Money tab for accurate calculation</Text>
          </View>
        )}
      </Card>

      {monthly > 0 && (
        <>
          {/* 3-MONTH */}
          <Card style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 11, color: T.t3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>3-Month Fund</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: T.t1 }}>{fmt(target3)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: safePct(saved, target3) >= 100 ? '#22C55E' : '#4F8CFF' }}>
                  {safePct(saved, target3)}%
                </Text>
                {safePct(saved, target3) >= 100 && <Chip label="Achieved ✓" color="#22C55E" sm />}
              </View>
            </View>
            <Bar value={saved} total={target3} color="#4F8CFF" h={10} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: T.t3 }}>Saved: {fmt(saved)}</Text>
              <Text style={{ fontSize: 12, color: T.t3 }}>Need: {fmt(Math.max(0, target3 - saved))} more</Text>
            </View>
          </Card>

          {/* 6-MONTH */}
          <Card style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 11, color: T.t3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>6-Month Fund (Recommended)</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: T.t1 }}>{fmt(target6)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: safePct(saved, target6) >= 100 ? '#22C55E' : '#EF4444' }}>
                  {safePct(saved, target6)}%
                </Text>
                {safePct(saved, target6) >= 100 && <Chip label="Achieved ✓" color="#22C55E" sm />}
              </View>
            </View>
            <Bar value={saved} total={target6} color="#22C55E" h={10} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: T.t3 }}>Saved: {fmt(saved)}</Text>
              <Text style={{ fontSize: 12, color: T.t3 }}>Remaining: {fmt(Math.max(0, target6 - saved))}</Text>
            </View>
          </Card>

          {/* STATS */}
          <Card>
            <SH title="Fund Details" />
            <StatRow label="Monthly expenses (est.)" value={fmt(monthly)} />
            <StatRow label="3-month target"          value={fmt(target3)} color="#4F8CFF" />
            <StatRow label="6-month target"          value={fmt(target6)} color="#22C55E" />
            <StatRow label="Currently saved"         value={fmt(saved)} color={saved >= target6 ? '#22C55E' : '#F59E0B'} />
            <StatRow label="Monthly to complete 6M"  value={saved < target6 ? fmt(Math.round((target6 - saved) / 6)) : 'Complete! 🎉'} color="#A78BFA" last />
          </Card>
        </>
      )}
    </View>
  );
}

// ── BEHAVIOR ANALYTICS ────────────────────────────────────
function BehaviourTab() {
  const { T }        = useTheme();
  const { state: s } = useApp();

  const history = s.behaviorHistory || [];
  const expenses = s.expenses || [];
  const needsPct = expenses.find(e => e?.label === 'Needs')?.pct || 0;
  const wantsPct = expenses.find(e => e?.label === 'Wants')?.pct || 0;
  const savPct   = expenses.find(e => e?.label === 'Savings')?.pct || 0;

  const trendWants = history.length >= 2
    ? history[history.length - 1]?.wantsPct - history[0]?.wantsPct
    : 0;

  const getRating = (pct, type) => {
    if (type === 'savings') return pct >= 20 ? 'Great' : pct >= 15 ? 'OK' : 'Low';
    if (type === 'wants')   return pct <= 30 ? 'Great' : pct <= 40 ? 'OK' : 'High';
    if (type === 'needs')   return pct <= 50 ? 'Great' : pct <= 60 ? 'OK' : 'High';
    return 'OK';
  };

  const ratingColor = (r) => r === 'Great' ? '#22C55E' : r === 'OK' ? '#F59E0B' : '#EF4444';

  return (
    <View>
      {/* CURRENT SPLIT */}
      <Card style={{ marginBottom: 12 }}>
        <SH title="Current Expense Split" />
        {[
          { label: 'Needs',   pct: needsPct, target: 50, color: '#4F8CFF', type: 'needs'   },
          { label: 'Wants',   pct: wantsPct, target: 30, color: '#F59E0B', type: 'wants'   },
          { label: 'Savings', pct: savPct,   target: 20, color: '#22C55E', type: 'savings' },
        ].map((e, i) => {
          const rating = getRating(e.pct, e.type);
          return (
            <View key={i} style={[{ paddingVertical: 13 }, i < 2 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: e.color }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: T.t1 }}>{e.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: e.color }}>{e.pct}%</Text>
                  <Chip label={rating} color={ratingColor(rating)} sm />
                </View>
              </View>
              <Bar value={e.pct} total={100} color={e.color} h={7} />
              <Text style={{ fontSize: 11, color: T.t3, marginTop: 5 }}>Target: {e.target}% · Currently: {e.pct > e.target ? `+${e.pct - e.target}% over` : e.pct < e.target ? `−${e.target - e.pct}% under` : 'Exactly right'}</Text>
            </View>
          );
        })}
      </Card>

      {/* 50/30/20 RULE */}
      <Card style={{ marginBottom: 12 }}>
        <SH title="50/30/20 Rule Analysis" />
        <View style={{ backgroundColor: '#4F8CFF10', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#4F8CFF25', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: T.t2, lineHeight: 20 }}>
            <Text style={{ fontWeight: '700', color: '#4F8CFF' }}>50% Needs</Text>
            {' '}(rent, food, utilities) → <Text style={{ fontWeight: '700', color: '#F59E0B' }}>30% Wants</Text>
            {' '}(entertainment, dining) → <Text style={{ fontWeight: '700', color: '#22C55E' }}>20% Savings</Text>
            {' '}(investments + emergency)
          </Text>
        </View>
        <StatRow label="Your Needs"    value={`${needsPct}% (target 50%)`} color={needsPct <= 55 ? '#22C55E' : '#EF4444'} />
        <StatRow label="Your Wants"    value={`${wantsPct}% (target 30%)`} color={wantsPct <= 30 ? '#22C55E' : '#EF4444'} />
        <StatRow label="Your Savings"  value={`${savPct}% (target 20%)`}   color={savPct >= 20 ? '#22C55E' : '#EF4444'} last />
      </Card>

      {/* 3-MONTH TREND */}
      {history.length > 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <SH title="3-Month Behaviour Trend" />
          {trendWants !== 0 && (
            <View style={[{ flexDirection: 'row', gap: 9, padding: 10, borderRadius: 11, borderWidth: 1, marginBottom: 12 }, { backgroundColor: trendWants > 0 ? '#EF444410' : '#22C55E10', borderColor: trendWants > 0 ? '#EF444428' : '#22C55E28' }]}>
              <Text style={{ fontSize: 16 }}>{trendWants > 0 ? '📈' : '📉'}</Text>
              <Text style={{ fontSize: 12, color: trendWants > 0 ? '#EF4444' : '#22C55E', lineHeight: 18, flex: 1 }}>
                {trendWants > 0
                  ? `Wants spending has increased by ${trendWants}% over 3 months. Review discretionary expenses.`
                  : `Wants spending reduced by ${Math.abs(trendWants)}% — great discipline! Keep it up.`}
              </Text>
            </View>
          )}
          {history.map((b, i) => (
            <View key={i} style={[{ paddingVertical: 12 }, i < history.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: T.t1 }}>{b.month}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Chip label={`Wants ${b.wantsPct}%`} color={b.wantsPct > 30 ? '#EF4444' : '#22C55E'} sm />
                  <Chip label={`${b.attended} days`}   color={b.attended >= 22 ? '#22C55E' : '#F59E0B'} sm />
                </View>
              </View>
              <Bar value={b.attended} total={26} color={b.attended >= 22 ? '#22C55E' : '#F59E0B'} h={5} />
            </View>
          ))}
        </Card>
      ) : (
        <Card style={{ marginBottom: 12 }}>
          <Empty icon="📊" title="Building history" sub="Your behaviour data will appear here as you track monthly." />
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <SH title="Improvement Tips" />
        {[
          { icon: '🎯', tip: 'Automate savings on salary day — transfer 20% immediately' },
          { icon: '📱', tip: 'Delete shopping apps for 30 days to reduce impulse spending' },
          { icon: '🍱', tip: 'Meal prep on Sundays — saves ₹3,000-5,000/month on food' },
          { icon: '📊', tip: 'Review subscriptions monthly — cancel unused ones' },
          { icon: '💳', tip: 'Use cash/UPI budget for wants — physical money feels more real' },
        ].map((t, i) => (
          <View key={i} style={[{ flexDirection: 'row', gap: 12, paddingVertical: 10 }, i < 4 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
            <Text style={{ fontSize: 20 }}>{t.icon}</Text>
            <Text style={{ fontSize: 13, color: T.t2, lineHeight: 19, flex: 1 }}>{t.tip}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────
export default function GrowthScreen() {
  const { T } = useTheme();
  const [tab, setTab] = useState('career');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={{ paddingTop: 56, paddingHorizontal: SP.md, paddingBottom: SP.md }}>
        <Text style={{ fontSize: 27, fontWeight: '800', color: T.t1, letterSpacing: -0.5 }}>Growth</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>Career · Emergency Fund · Analytics</Text>
      </View>

      {/* TABS */}
      <View style={{ flexDirection: 'row', marginHorizontal: SP.md, marginBottom: 16, backgroundColor: T.l1, borderRadius: 14, padding: 5, gap: 4, borderWidth: 1, borderColor: T.border }}>
        {TABS.map(({ key, label }) => {
          const on = tab === key;
          return (
            <Pressable key={key} onPress={() => setTab(key)}
              style={{ flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center', backgroundColor: on ? '#4F8CFF' : 'transparent' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: on ? '#fff' : T.t3 }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: SP.md }}>
        {tab === 'career'    && <CareerTab />}
        {tab === 'ef'        && <EFTab />}
        {tab === 'behaviour' && <BehaviourTab />}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  ladderIcon: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
