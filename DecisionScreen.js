// DecisionScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP } from './theme';
import { Card, SH, Bar, Chip, AlertRow, StatRow, GCard, Empty } from './UI';
import { fmt, safeNum, deriveState, safePct } from './helpers';

// ── Decision logic — all dynamic from user state ──────────
const buildDecisions = (s, d) => {
  const decisions = [];
  const wntPct  = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
  const savPct  = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
  const highRate = (s.debts || []).length > 0
    ? (s.debts || []).reduce((a, x) => safeNum(x?.rate) > safeNum(a?.rate) ? x : a, s.debts[0])
    : null;
  const avgSipRet = (s.sips || []).length > 0
    ? (s.sips || []).reduce((a, x) => a + safeNum(x?.returns), 0) / s.sips.length
    : 12;
  const efGoal    = (s.goals || []).find(g => g?.title?.toLowerCase().includes('emergency'));
  const efSaved   = safeNum(efGoal?.saved);
  const efTarget  = d.needsBudget * 6;
  const emiPct    = d.totalIncome > 0 ? safePct(d.debtEmi, d.totalIncome) : 0;

  // ── 1. INVEST vs REPAY DEBT ───────────────────────────
  if (d.debtTotal > 0 && d.sipTotal > 0 && highRate) {
    const debtRate = safeNum(highRate.rate);
    const rec      = debtRate > avgSipRet + 3 ? 'repay' : 'invest';
    decisions.push({
      icon:  rec === 'repay' ? '🏦' : '📈',
      q:     'Should I invest or repay debt first?',
      rec:   rec === 'repay' ? 'Repay Debt First' : 'Keep Investing',
      color: rec === 'repay' ? '#EF4444' : '#22C55E',
      why:   rec === 'repay'
        ? `${highRate.name} charges ${debtRate}% — higher than SIP returns (~${avgSipRet.toFixed(0)}%). Paying extra EMI gives guaranteed ${debtRate}% return.`
        : `Your SIP returns (~${avgSipRet.toFixed(0)}%) beat debt cost (${debtRate}%). Keep investing while paying minimum EMI.`,
      data: [
        { label: 'Highest debt rate', value: `${safeNum(highRate.rate)}%` },
        { label: 'Avg SIP return',    value: `${avgSipRet.toFixed(1)}%`   },
        { label: 'Total debt',        value: fmt(d.debtTotal)              },
      ],
    });
  }

  // ── 2. JOB SWITCH ─────────────────────────────────────
  if (d.salary > 0) {
    const hikeNeeded = 30;
    const newSal     = Math.round(d.salary * 1.35);
    decisions.push({
      icon:  '💼',
      q:     'Should I switch my job?',
      rec:   d.salary < 80000 ? 'Switch if 35%+ hike offered' : 'Negotiate first, switch if denied',
      color: '#4F8CFF',
      why:   d.salary < 80000
        ? `At ${fmt(d.salary)}/mo, switching jobs typically gives 30-40% raise. A 35% hike = ${fmt(newSal)}/mo — extra ${fmt((newSal - d.salary) * 12)}/year.`
        : `At ${fmt(d.salary)}/mo, negotiate 20-25% internally first. Switching mid-career costs notice period + joining gap. Switch only if negotiation fails.`,
      data: [
        { label: 'Current salary',      value: fmt(d.salary)        },
        { label: 'Target after switch', value: fmt(newSal)           },
        { label: 'Annual gain',         value: fmt((newSal - d.salary) * 12) },
      ],
    });
  }

  // ── 3. EMERGENCY FUND PRIORITY ────────────────────────
  if (d.totalIncome > 0) {
    const efPct = efTarget > 0 ? safePct(efSaved, efTarget) : 0;
    const rec   = efPct < 50 ? 'Build EF first' : efPct < 100 ? 'Continue building EF' : 'EF complete — invest more';
    decisions.push({
      icon:  '🛟',
      q:     'Emergency fund or invest?',
      rec,
      color: efPct < 50 ? '#EF4444' : efPct < 100 ? '#F59E0B' : '#22C55E',
      why:   efPct < 50
        ? `Emergency fund only ${efPct}% complete (${fmt(efSaved)} of ${fmt(efTarget)}). Without this safety net, any crisis forces you to liquidate investments at a loss.`
        : efPct < 100
        ? `You are ${efPct}% there. Keep adding ${fmt(Math.round((efTarget - efSaved) / 6))}/mo to complete in 6 months.`
        : `Emergency fund complete! Direct all extra savings to investments for maximum wealth building.`,
      data: [
        { label: '6-month target', value: fmt(efTarget)   },
        { label: 'Saved so far',   value: fmt(efSaved)     },
        { label: 'Remaining',      value: fmt(Math.max(0, efTarget - efSaved)) },
      ],
    });
  }

  // ── 4. INSURANCE ─────────────────────────────────────
  if (d.salary > 0) {
    const termCover = d.salary * 12 * 10;
    decisions.push({
      icon:  '🛡️',
      q:     'Do I have enough life insurance?',
      rec:   `You need ${fmt(termCover)} cover`,
      color: '#A78BFA',
      why:   `10x annual income rule: ${fmt(d.salary * 12)} × 10 = ${fmt(termCover)} term cover. A pure term plan at age 28-35 costs ₹600-1,200/mo. Get it before health issues arise.`,
      data: [
        { label: 'Annual income',    value: fmt(d.salary * 12) },
        { label: 'Recommended cover',value: fmt(termCover)     },
        { label: 'Approx premium',   value: '₹600-1,200/mo'    },
      ],
    });
  }

  // ── 5. EMI BURDEN ────────────────────────────────────
  if (d.totalIncome > 0 && d.debtEmi > 0) {
    const safe = emiPct <= 35;
    decisions.push({
      icon:  '📊',
      q:     'Is my EMI burden healthy?',
      rec:   safe ? 'EMI is manageable' : 'EMI burden too high — reduce debt',
      color: safe ? '#22C55E' : '#EF4444',
      why:   safe
        ? `Your EMI is ${emiPct}% of income — within the safe 35% limit. You have good headroom for investments.`
        : `EMI at ${emiPct}% of income exceeds 35% safety limit. Close smallest debt first (snowball), then redirect EMI savings to investments.`,
      data: [
        { label: 'Monthly EMI',   value: fmt(d.debtEmi)       },
        { label: 'EMI/Income',    value: `${emiPct}%`          },
        { label: 'Safe limit',    value: '35%'                 },
      ],
    });
  }

  // ── 6. SAVINGS RATE ───────────────────────────────────
  if (d.totalIncome > 0) {
    const rec = savPct >= 20 ? 'Great savings rate!' : savPct >= 15 ? 'Increase savings to 20%' : 'Savings too low — automate';
    decisions.push({
      icon:  '💰',
      q:     'Is my savings rate healthy?',
      rec,
      color: savPct >= 20 ? '#22C55E' : savPct >= 15 ? '#F59E0B' : '#EF4444',
      why:   savPct >= 20
        ? `${savPct}% savings rate is excellent. At this pace you are building strong financial security.`
        : `Savings at ${savPct}% — below the recommended 20%. Automate savings on salary day: transfer ${fmt(Math.round(d.totalIncome * 0.2))} immediately to a separate account.`,
      data: [
        { label: 'Current savings %', value: `${savPct}%`                           },
        { label: 'Recommended',       value: '20%+'                                  },
        { label: 'Monthly gap',       value: fmt(Math.max(0, d.totalIncome * 0.2 - d.totalIncome * savPct / 100)) },
      ],
    });
  }

  return decisions;
};

export default function DecisionScreen() {
  const { state: s } = useApp();
  const { T }        = useTheme();
  const d = useMemo(() => { try { return deriveState(s); } catch { return { totalIncome:0,salary:0,sipTotal:0,debtTotal:0,debtEmi:0,needsBudget:0,balance:0,present:0,workDays:26,perDay:0 }; } }, [s]);
  const decisions = useMemo(() => buildDecisions(s, d), [s, d]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={{ paddingTop: 56, paddingHorizontal: SP.md, paddingBottom: SP.md }}>
        <Text style={{ fontSize: 27, fontWeight: '800', color: T.t1, letterSpacing: -0.5 }}>AI Decisions</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>Smart recommendations based on your data</Text>
      </View>

      {d.totalIncome === 0 ? (
        <View style={{ paddingHorizontal: SP.md }}>
          <Card>
            <Empty icon="🧠" title="No data yet"
              sub="Add your salary and expenses in the Money tab to get personalised AI recommendations." />
          </Card>
        </View>
      ) : (
        <View style={{ paddingHorizontal: SP.md }}>
          {/* SCORE BAR */}
          <GCard colors={['#0c1a4e', '#1a3080']} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Financial IQ</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 }}>
              {decisions.filter(d_ => ['#22C55E', '#4F8CFF'].includes(d_.color)).length} of {decisions.length} areas are healthy
            </Text>
            <Bar
              value={decisions.filter(d_ => ['#22C55E', '#4F8CFF'].includes(d_.color)).length}
              total={Math.max(decisions.length, 1)} color="#22C55E" h={8} />
          </GCard>

          {decisions.map((dec, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              {/* HEADER */}
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: dec.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{dec.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: T.t3, marginBottom: 3 }}>{dec.q}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: dec.color }}>{dec.rec}</Text>
                </View>
              </View>

              {/* REASONING */}
              <View style={{ backgroundColor: dec.color + '10', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: dec.color + '25', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: T.t2, lineHeight: 20 }}>{dec.why}</Text>
              </View>

              {/* DATA POINTS */}
              {dec.data.map((row, j) => (
                <StatRow key={j} label={row.label} value={row.value} last={j === dec.data.length - 1} />
              ))}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
