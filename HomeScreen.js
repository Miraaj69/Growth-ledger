// HomeScreen.js
import React, { useMemo, useState, useCallback, memo } from 'react';
import {
  ScrollView, View, Text, Pressable,
  StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import {
  fmt, deriveState, calcScore, calcPersonality,
  nextAction, buildInsights, MONTHS_SHORT, safePct,
  monthlyNeeded, deadlineMonths,
} from './helpers';
import { SPACING as SP, RADIUS as R, GRAD } from './theme';
import {
  Card, GCard, Chip, Bar, SH, MonthPicker, Empty, AlertRow,
} from './UI';
import { ScoreRing, DonutChart, BarChart } from './Charts';

export default function HomeScreen() {
  const { state: s, set } = useApp();
  const { T }             = useTheme();
  const [showAllInsights, setShowAllInsights] = useState(false);

  const d           = useMemo(() => deriveState(s),       [s]);
  const score       = useMemo(() => calcScore(s),         [s]);
  const personality = useMemo(() => calcPersonality(s),   [s]);
  const action      = useMemo(() => nextAction(s),        [s]);
  const insights    = useMemo(() => buildInsights(s),     [s]);

  const bars = useMemo(() =>
    (s.monthlyData || [])
      .slice(0, (s.currentMonth || 0) + 1)
      .map((v, i) => ({ v: Number(v) || 0, l: MONTHS_SHORT[i] || '' }))
      .slice(-6),
    [s.monthlyData, s.currentMonth]
  );

  const achievements = useMemo(() => {
    const totalSaved = (s.goals || []).reduce((a, g) => a + (Number(g?.saved) || 0), 0);
    const debtPaid   = (s.debts || []).reduce((a, d) => a + ((Number(d?.amount) || 0) - (Number(d?.remaining) || 0)), 0);
    const certsDone  = (s.certifications || []).filter(c => c?.status === 'Done').length;
    return [
      { icon: '🥇', label: 'Saver',       unlocked: totalSaved >= 100000,    color: '#F59E0B' },
      { icon: '📈', label: 'Investor',    unlocked: d.sipTotal > 0,           color: '#22C55E' },
      { icon: '💪', label: 'Debt Buster', unlocked: debtPaid >= 50000,        color: '#4F8CFF' },
      { icon: '🎓', label: 'Certified',   unlocked: certsDone >= 2,           color: '#A78BFA' },
      { icon: '🔥', label: 'Consistent',  unlocked: d.present >= 20,          color: '#EF4444' },
      { icon: '👑', label: 'Elite',       unlocked: score.total >= 85,        color: '#F59E0B' },
    ];
  }, [s, d, score]);

  const heroColors = T.mode === 'light' ? GRAD.heroLight : GRAD.hero;
  const mask = s.maskAmounts;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* HEADER */}
      <View style={[st.header, { paddingTop: 56 }]}>
        <View>
          <View style={st.headerRow}>
            <Text style={[st.appName, { color: T.t3 }]}>GROWTH LEDGER</Text>
            <View style={[st.lvlBadge, { backgroundColor: '#F59E0B22' }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>Lv {s.level || 1}</Text>
            </View>
          </View>
          <Text style={[st.pageTitle, { color: T.t1 }]}>Dashboard</Text>
        </View>
        <MonthPicker
          month={s.currentMonth || 0}
          year={s.currentYear || new Date().getFullYear()}
          onChange={(m, y) => set({ currentMonth: m, currentYear: y, attendance: new Set() })}
        />
      </View>

      {/* XP */}
      <View style={[st.xpWrap, { marginHorizontal: SP.md }]}>
        <View style={st.xpRow}>
          <Text style={{ fontSize: 11, color: T.t3 }}>XP · Level {s.level || 1}</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>{s.xpTotal || 0} / 2000</Text>
        </View>
        <Bar value={s.xpTotal || 0} total={2000} color="#F59E0B" h={4} />
      </View>

      {/* HERO */}
      <View style={{ marginHorizontal: SP.md, marginBottom: 12 }}>
        <GCard colors={heroColors} style={{ overflow: 'hidden' }}>
          <View style={st.heroBubble} />
          <Text style={st.heroSub}>Earned This Month</Text>
          <Text style={st.heroAmt}>{mask ? '₹••,•••' : fmt(d.earnedSalary)}</Text>
          <Text style={[st.heroMeta, { color: 'rgba(255,255,255,0.32)' }]}>
            {d.salary > 0
              ? `of ${mask ? '₹••,•••' : fmt(d.salary)} · ${d.present}/${d.workDays} days`
              : 'Add your salary in Money tab'}
          </Text>
          <Bar value={d.present} total={Math.max(d.workDays, 1)} color="rgba(255,255,255,0.6)" h={4} />
          <View style={st.heroStats}>
            {[
              { l: 'Per Day', v: d.salary > 0 ? fmt(d.perDay) : '—',      c: 'rgba(255,255,255,0.85)' },
              { l: 'Lost',    v: d.salary > 0 ? fmt(d.lostSalary) : '—',  c: '#fca5a5' },
              { l: 'Balance', v: d.balance > 0 ? fmt(d.balance) : '₹0',   c: '#86efac' },
            ].map(({ l, v, c }) => (
              <View key={l}>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginBottom: 2 }}>{l}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: c }}>{mask ? '₹••' : v}</Text>
              </View>
            ))}
          </View>
        </GCard>
      </View>

      {/* SCORE + PERSONALITY */}
      <View style={[st.row2, { marginHorizontal: SP.md }]}>
        <Card style={{ flex: 1, padding: SP.md }}>
          <Text style={[st.cardLabel, { color: T.t3 }]}>HEALTH SCORE</Text>
          {d.salary === 0 ? (
            <Text style={{ fontSize: 12, color: T.t3, lineHeight: 18 }}>Enter salary to see score</Text>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ScoreRing score={score.total} color={score.color} size={70} sw={7} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: score.color, lineHeight: 16, marginBottom: 6 }} numberOfLines={2}>
                  {score.label}
                </Text>
                {(score.breakdown || []).slice(0, 3).map(b => (
                  <Bar key={b.label} value={b.score} total={b.max} color={b.color} h={3} />
                ))}
              </View>
            </View>
          )}
        </Card>

        <LinearGradient
          colors={[personality.color + '15', personality.color + '08']}
          style={[{ flex: 1, borderRadius: R.xl, padding: SP.md, borderWidth: 1, borderColor: T.border }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={[st.cardLabel, { color: T.t3 }]}>PERSONALITY</Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: personality.color, lineHeight: 18 }}>
            {personality.type}
          </Text>
          <Text style={{ fontSize: 11, color: T.t3, lineHeight: 16, marginTop: 5 }} numberOfLines={3}>
            {personality.desc}
          </Text>
        </LinearGradient>
      </View>

      {/* NEXT ACTION */}
      <View style={{ marginHorizontal: SP.md }}>
        <Pressable style={[st.actionCard, { borderColor: action.color + '30', backgroundColor: action.color + '10' }]}>
          <View style={[st.actionIcon, { backgroundColor: action.color + '22' }]}>
            <Text style={{ fontSize: 20 }}>{action.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: action.color, letterSpacing: 0.3, marginBottom: 1 }}>NEXT ACTION</Text>
            <Text style={{ fontWeight: '700', fontSize: 14, color: T.t1, marginBottom: 1 }}>{action.title}</Text>
            <Text style={{ fontSize: 12, color: T.t2, lineHeight: 17 }} numberOfLines={2}>{action.desc}</Text>
          </View>
          <Text style={{ color: T.t3, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>

      {/* SMART INSIGHTS */}
      {insights.length > 0 && (
        <View style={{ marginHorizontal: SP.md, marginTop: 12 }}>
          <Card>
            <SH
              title="🧠 Smart Insights"
              right={`${showAllInsights ? 'Less' : 'All'} (${insights.length})`}
              onRight={() => setShowAllInsights(v => !v)}
            />
            {(showAllInsights ? insights : insights.slice(0, 2)).map((ins, i) => (
              <AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i === insights.length - 1} />
            ))}
          </Card>
        </View>
      )}

      {/* NET WORTH + INCOME */}
      <View style={[st.row2, { marginHorizontal: SP.md, marginTop: 12 }]}>
        <GCard colors={['#052e16', '#064e30']} style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>Net Worth</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#22C55E' }}>
            {mask ? '₹•L' : fmt(d.netWorth)}
          </Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>Assets − Debts</Text>
        </GCard>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: T.t3, marginBottom: 5 }}>This Month In</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#4F8CFF' }}>{fmt(d.totalIncome)}</Text>
          <Text style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>
            {(s.incomes || []).length} source{(s.incomes || []).length !== 1 ? 's' : ''}
          </Text>
        </Card>
      </View>

      {/* QUICK STATS */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ marginLeft: SP.md, marginTop: 12 }}
        contentContainerStyle={{ gap: 10, paddingRight: SP.md }}
      >
        {[
          { icon: '📈', label: 'SIP/mo',  val: d.sipTotal > 0 ? fmt(d.sipTotal) : 'None',  color: '#22C55E' },
          { icon: '🏦', label: 'EMI/mo',  val: d.debtEmi > 0 ? fmt(d.debtEmi) : 'None',   color: '#EF4444' },
          { icon: '💳', label: 'Debt',    val: d.debtTotal > 0 ? fmt(d.debtTotal) : '₹0',  color: '#A78BFA' },
          { icon: '💰', label: 'Balance', val: fmt(d.balance),                               color: d.balance > 0 ? '#22C55E' : '#EF4444' },
        ].map((c, i) => (
          <Card key={i} style={{ padding: SP.md, minWidth: 130 }}>
            <Text style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</Text>
            <Text style={{ fontSize: 10, color: T.t3, marginBottom: 2 }}>{c.label}</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: c.color }}>{c.val}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* ACHIEVEMENTS */}
      <View style={{ marginHorizontal: SP.md, marginTop: 12 }}>
        <Card>
          <SH
            title="Achievements"
            right={`${achievements.filter(a => a.unlocked).length}/${achievements.length}`}
            rightColor="#F59E0B"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {achievements.map((a, i) => (
              <View key={i} style={{ width: 64, alignItems: 'center' }}>
                <View style={[st.achIcon, {
                  backgroundColor: a.unlocked ? a.color + '22' : T.l2,
                  borderColor: a.unlocked ? a.color + '44' : T.border,
                  opacity: a.unlocked ? 1 : 0.3,
                }]}>
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: a.unlocked ? T.t2 : T.t3, textAlign: 'center', marginTop: 4 }}>
                  {a.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>

      {/* EXPENSE DONUT */}
      {d.salary > 0 && (
        <View style={{ marginHorizontal: SP.md, marginTop: 12 }}>
          <Card>
            <SH title="Expense Split" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <DonutChart
                segments={(s.expenses || []).map(e => ({ pct: e.pct, color: e.color }))}
                size={92} sw={12}
                centerLabel={fmt(d.salary)}
              />
              <View style={{ flex: 1 }}>
                {(s.expenses || []).map((e, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: e.color }} />
                      <Text style={{ fontSize: 13, color: T.t2 }}>{e.label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: e.color }}>{fmt(d.salary * e.pct / 100)}</Text>
                      <Text style={{ fontSize: 10, color: T.t3 }}>{e.pct}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* GOALS */}
      <View style={{ marginHorizontal: SP.md, marginTop: 12 }}>
        {(s.goals || []).length === 0 ? (
          <Card>
            <Empty icon="🎯" title="No goals yet" sub="Add financial goals in the Money tab." />
          </Card>
        ) : (
          <Card>
            <SH title="Financial Goals" />
            {(s.goals || []).map((g, i) => {
              const mLeft = g.deadline ? Math.max(1, Math.round((new Date(g.deadline) - new Date()) / 1000 / 60 / 60 / 24 / 30)) : 0;
              const rSave = mLeft > 0 ? Math.max(0, Math.round(((g.target || 0) - (g.saved || 0)) / mLeft)) : 0;
              const pctDone = safePct(g.saved, g.target);
              return (
                <View key={g.id || i} style={[{ paddingVertical: SP.md }, i < (s.goals || []).length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                    <View>
                      <Text style={{ fontWeight: '600', fontSize: 14, color: T.t1, marginBottom: 4 }}>{g.title}</Text>
                      {g.linked && <Chip label={`← ${g.linked}`} color={g.color} sm />}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: g.color }}>{pctDone}%</Text>
                      {mLeft > 0 && <Text style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{mLeft} mo left</Text>}
                    </View>
                  </View>
                  <Bar value={g.saved || 0} total={Math.max(g.target || 1, 1)} color={g.color} h={5} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                    <Text style={{ fontSize: 11, color: T.t3 }}>{fmt(g.saved || 0)}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: T.t3 }}>{fmt(g.target || 0)}</Text>
                      {rSave > 0 && <Text style={{ fontSize: 10, color: g.color, marginTop: 1 }}>Save {fmt(rSave)}/mo</Text>}
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </View>

      {/* EARNINGS CHART */}
      <View style={{ marginHorizontal: SP.md, marginTop: 12 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <SH title="Earnings Trend" />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '800', fontSize: 17, color: '#22C55E' }}>
                {fmt((s.monthlyData || []).slice(0, (s.currentMonth || 0) + 1).reduce((a, v) => a + (Number(v) || 0), 0))}
              </Text>
              <Text style={{ fontSize: 11, color: T.t3 }}>YTD</Text>
            </View>
          </View>
          {bars.every(b => b.v === 0) ? (
            <Empty icon="📊" title="No earnings data yet" sub="Your monthly data will appear here." />
          ) : (
            <BarChart data={bars} color="#4F8CFF" height={64} />
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.md, paddingBottom: SP.md },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  appName:    { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  lvlBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  pageTitle:  { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  xpWrap:     { marginBottom: SP.md },
  xpRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  heroBubble: { position: 'absolute', top: -40, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroSub:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  heroAmt:    { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 44, marginBottom: 4 },
  heroMeta:   { fontSize: 13, marginBottom: 14 },
  heroStats:  { flexDirection: 'row', gap: 20, marginTop: 16 },
  row2:       { flexDirection: 'row', gap: 10, marginBottom: 0 },
  cardLabel:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  actionCard: { borderRadius: 18, padding: SP.md, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, marginTop: 12 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  achIcon:    { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
