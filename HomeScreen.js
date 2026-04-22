// HomeScreen.js — Upgraded: AI Insights + XP/Level/Streak + Daily Check-in
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, Pressable,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp }   from './AppContext';
import { useTheme } from './ThemeContext';
import {
  fmt, fmtShort, deriveState, calcScore, calcPersonality,
  nextAction, buildInsights, MONTHS_SHORT, safePct,
  monthlyNeeded, safeNum,
} from './helpers';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, GCard, Chip, Bar, SH, MonthPicker, Empty, AlertRow } from './UI';
import { ScoreRing, DonutChart, BarChart } from './Charts';

const W = Dimensions.get('window').width;

// ── XP constants ──────────────────────────────────────────
const XP_PER_LEVEL = 100;
const LEVEL_NAMES  = ['Beginner','Saver','Planner','Investor','Builder','Wealth Maker','Elite','Master','Legend','Guru'];
const getLevelName = (lvl) => LEVEL_NAMES[Math.min(lvl - 1, LEVEL_NAMES.length - 1)] || 'Guru';
const getLevelColor= (lvl) =>
  lvl >= 8 ? '#F59E0B' : lvl >= 6 ? '#A78BFA' : lvl >= 4 ? '#22C55E' : lvl >= 2 ? '#4F8CFF' : '#94A3B8';

// ── AI Insight Engine (standalone, pure function) ─────────
const generateAIInsights = (s, d) => {
  const insights = [];
  const salary    = safeNum(s.salary);
  const wntPct    = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
  const savPct    = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
  const needsPct  = (s.expenses || []).find(e => e?.label === 'Needs')?.pct || 50;
  const sipTotal  = d.sipTotal || 0;
  const debtTotal = d.debtTotal || 0;
  const balance   = d.balance || 0;
  const totalInc  = d.totalIncome || 0;

  if (totalInc === 0) {
    return [{ icon: '💰', msg: 'Add your salary in Money tab to get personalised AI insights', color: '#4F8CFF', level: 'info' }];
  }

  // Rule-of-thumb checks
  if (wntPct > 35)
    insights.push({ icon: '💸', msg: `Wants at ${wntPct}% — cut to 30% to free ${fmt(salary*(wntPct-30)/100)}/mo`, color: '#EF4444', level: 'danger' });
  else if (wntPct > 28)
    insights.push({ icon: '⚠️', msg: `Wants at ${wntPct}% — slightly high. Target 28% for balance.`, color: '#F59E0B', level: 'warn' });
  else
    insights.push({ icon: '✅', msg: `Wants well controlled at ${wntPct}% — you're financially disciplined!`, color: '#22C55E', level: 'good' });

  if (savPct < 15)
    insights.push({ icon: '🎯', msg: `Savings only ${savPct}% — automate ${fmt(salary*0.2-salary*savPct/100)} more on salary day`, color: '#EF4444', level: 'danger' });
  else if (savPct >= 25)
    insights.push({ icon: '🚀', msg: `Savings rate ${savPct}% is excellent! Top 10% of earners.`, color: '#22C55E', level: 'good' });

  // SIP insights
  if (sipTotal === 0 && totalInc > 0)
    insights.push({ icon: '📈', msg: 'No active SIP — even ₹500/mo in Nifty 50 builds ₹1L+ in 10 years', color: '#4F8CFF', level: 'info' });
  else if (sipTotal > 0 && sipTotal < totalInc * 0.1)
    insights.push({ icon: '📈', msg: `SIP is ${safePct(sipTotal,totalInc)}% of income — increase by ₹${Math.round(totalInc*0.15-sipTotal).toLocaleString('en-IN')}/mo to hit 15%`, color: '#F59E0B', level: 'warn' });
  else if (sipTotal >= totalInc * 0.2)
    insights.push({ icon: '🏆', msg: `SIP at ${safePct(sipTotal,totalInc)}% of income — you're a power investor!`, color: '#22C55E', level: 'good' });

  // Debt check
  if (debtTotal > salary * 6)
    insights.push({ icon: '🔥', msg: `High debt load — pay extra ₹2K/mo to clear ${fmtShort(debtTotal)} faster`, color: '#EF4444', level: 'danger' });
  else if (debtTotal === 0 && sipTotal > 0)
    insights.push({ icon: '🎉', msg: 'Debt-free + investing — top 5% financial health!', color: '#22C55E', level: 'good' });

  // Tax insight
  if (salary * 12 > 700000 && savPct < 20)
    insights.push({ icon: '🧾', msg: 'Increase 80C investments to save up to ₹45,000 in taxes annually', color: '#A78BFA', level: 'info' });

  // Month-end balance
  if (balance < totalInc * 0.05 && totalInc > 0)
    insights.push({ icon: '⚠️', msg: `Month-end balance ${fmt(balance)} is very low — review expenses`, color: '#EF4444', level: 'danger' });

  return insights.slice(0, 4);
};

// ── Streak indicator ──────────────────────────────────────
function StreakBadge({ streak, T }) {
  const fire = streak >= 7 ? '🔥🔥' : streak >= 3 ? '🔥' : '⚡';
  const clr  = streak >= 7 ? '#F59E0B' : streak >= 3 ? '#EF4444' : '#4F8CFF';
  return (
    <View style={[st.streakBadge, { backgroundColor: clr + '22', borderColor: clr + '44' }]}>
      <Text style={{ fontSize: 13 }}>{fire}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: clr }}>{streak}d streak</Text>
    </View>
  );
}

// ── XP Progress Section ───────────────────────────────────
function XPSection({ s, T }) {
  const xp       = s.xpTotal || 0;
  const level    = s.level || 1;
  const xpInLvl  = xp % XP_PER_LEVEL;
  const lvlColor = getLevelColor(level);
  const lvlName  = getLevelName(level);

  // Animate bar on mount
  const barAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: xpInLvl, duration: 900, useNativeDriver: false }).start();
  }, [xpInLvl]);
  const barW = barAnim.interpolate({ inputRange: [0, XP_PER_LEVEL], outputRange: ['0%', '100%'] });

  return (
    <View style={[st.xpSection, { borderColor: T.border }]}>
      <View style={st.xpLeft}>
        <View style={[st.lvlBadge, { backgroundColor: lvlColor + '22', borderColor: lvlColor + '44' }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: lvlColor }}>Lv {level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: T.t3 }}>{lvlName} · {xp} XP total</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: lvlColor }}>{xpInLvl}/{XP_PER_LEVEL}</Text>
          </View>
          {/* Animated XP bar */}
          <View style={[st.xpTrack, { backgroundColor: T.l2 }]}>
            <Animated.View style={[st.xpFill, { width: barW, backgroundColor: lvlColor, shadowColor: lvlColor }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Daily Check-in Card ───────────────────────────────────
function CheckInCard({ s, dispatch, T }) {
  const today    = new Date().toISOString().slice(0, 10);
  const done     = s.lastCheckIn === today;
  const [anim]   = useState(new Animated.Value(1));

  const handleCheckIn = () => {
    if (done) return;
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.spring(anim,  { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    dispatch({ type: 'DAILY_CHECKIN' });
  };

  if (done) {
    return (
      <View style={[st.checkCard, { backgroundColor: '#22C55E14', borderColor: '#22C55E30' }]}>
        <Text style={{ fontSize: 22 }}>✅</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#22C55E' }}>Daily check-in done!</Text>
          <Text style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>+15 XP earned • See you tomorrow 🌟</Text>
        </View>
        <Chip label="+15 XP" color="#22C55E" />
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: anim }] }}>
      <Pressable onPress={handleCheckIn}
        style={[st.checkCard, { backgroundColor: '#4F8CFF12', borderColor: '#4F8CFF30' }]}>
        <Text style={{ fontSize: 22 }}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>Did you track today's expenses?</Text>
          <Text style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>Tap to check in • Earn +15 XP</Text>
        </View>
        <View style={[st.checkBtn, { backgroundColor: '#4F8CFF' }]}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Check In</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Net Worth Mini Card ───────────────────────────────────
function NetWorthCard({ d, s, T }) {
  const debtRatio   = d.totalAssets > 0 ? safePct(d.debtTotal, d.totalAssets) : 0;
  const healthColor = debtRatio < 20 ? '#22C55E' : debtRatio < 50 ? '#F59E0B' : '#EF4444';

  return (
    <GCard colors={['#0c1a4e', '#1a3080']} style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Worth</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: d.netWorth >= 0 ? '#22C55E' : '#EF4444' }}>
        {fmtShort(d.netWorth)}
      </Text>
      <View style={{ marginTop: 10, gap: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Assets</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#22C55E' }}>{fmtShort(d.totalAssets)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Debts</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>{fmtShort(d.debtTotal)}</Text>
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <Bar value={d.totalAssets - d.debtTotal} total={Math.max(d.totalAssets, 1)} color={healthColor} h={4} />
      </View>
    </GCard>
  );
}

// ── Hero Card ─────────────────────────────────────────────
function HeroCard({ d, s, T }) {
  const month        = s.currentMonth || 0;
  const year         = s.currentYear  || new Date().getFullYear();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today        = new Date().getDate();
  const monthProg    = safePct(today, daysInMonth);
  const projectedEarning = d.perDay > 0 ? Math.round(d.perDay * daysInMonth) : 0;

  // Dynamic hero message
  const heroMsg = (() => {
    if (d.salary === 0) return 'Add your salary to track earnings 👆';
    if (d.present >= daysInMonth * 0.8) return `🔥 Full attendance — projected ${fmtShort(projectedEarning)} this month!`;
    if (d.lostSalary > 0) return `⚠️ ${fmt(d.lostSalary)} lost — reduce absences to maximise`;
    return `📈 On track to earn ${fmtShort(projectedEarning)} this month`;
  })();

  return (
    <GCard colors={['#0b1f52', '#1a3a82', '#1e4fa0']} style={{ overflow: 'hidden' }}>
      {/* Decorative bubble */}
      <View style={st.heroBubble} />
      <Text style={st.heroSub}>Earned This Month</Text>
      <Text style={st.heroAmt}>{d.salary > 0 ? fmt(d.earnedSalary) : '₹—'}</Text>

      {/* Month progress */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Month progress {monthProg}%</Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{today}/{daysInMonth} days</Text>
      </View>
      <Bar value={today} total={daysInMonth} color="rgba(255,255,255,0.55)" h={4} />

      {/* Stats row */}
      <View style={st.heroStats}>
        {[
          { l: 'Per Day',  v: d.salary > 0 ? fmt(d.perDay) : '—',       c: 'rgba(255,255,255,0.85)' },
          { l: 'Present',  v: `${d.present}/${d.workDays}`,               c: '#86efac'                 },
          { l: 'Lost',     v: d.salary > 0 ? fmt(d.lostSalary) : '—',    c: '#fca5a5'                 },
          { l: 'Balance',  v: d.balance > 0 ? fmtShort(d.balance) : '₹0', c: '#c4b5fd'                },
        ].map(({ l, v, c }) => (
          <View key={l}>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{l}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: c }}>{s.maskAmounts ? '₹••' : v}</Text>
          </View>
        ))}
      </View>

      {/* Dynamic message */}
      <View style={st.heroMsgBox}>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18 }}>{heroMsg}</Text>
      </View>
    </GCard>
  );
}

// ── Expense Insight Row ───────────────────────────────────
function ExpenseInsight({ s, d, T }) {
  const wntPct  = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
  const wntAmt  = d.salary * wntPct / 100;
  const idealWnt= d.salary * 0.3;
  const diff    = wntAmt - idealWnt;

  if (d.salary === 0) return null;
  return (
    <View style={[st.expInsight, { backgroundColor: diff > 0 ? '#EF444412' : '#22C55E12', borderColor: diff > 0 ? '#EF444425' : '#22C55E25' }]}>
      <Text style={{ fontSize: 13 }}>{diff > 0 ? '⚠️' : '✅'}</Text>
      <Text style={{ fontSize: 12, color: diff > 0 ? '#EF4444' : '#22C55E', flex: 1, lineHeight: 17 }}>
        {diff > 0
          ? `Wants ${fmt(Math.round(diff))} over budget — cut entertainment/dining`
          : `Wants spending well controlled — saving ${fmt(Math.abs(Math.round(diff)))}/mo extra`}
      </Text>
    </View>
  );
}

// ── Goals Progress Section ────────────────────────────────
function GoalsSection({ s, d, T, navigation }) {
  const goals = s.goals || [];
  if (goals.length === 0) {
    return (
      <Pressable onPress={() => navigation?.navigate?.('Goals')}
        style={[st.goalsEmpty, { borderColor: T.border, backgroundColor: T.l2 }]}>
        <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1, marginBottom: 4 }}>No goals yet</Text>
        <Text style={{ fontSize: 12, color: T.t3, textAlign: 'center', marginBottom: 12, lineHeight: 18 }}>
          Set financial goals — house, car, travel, retirement
        </Text>
        <View style={[st.goalsCtaBtn, { backgroundColor: '#4F8CFF' }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Create First Goal →</Text>
        </View>
      </Pressable>
    );
  }
  // Show top 2 goals with progress
  const top2 = goals.slice(0, 2);
  const totalPct = Math.round(goals.reduce((a, g) => a + safePct(g.saved||0, g.target||1), 0) / goals.length);
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Chip label={`${goals.length} goals · ${totalPct}% avg`} color="#4F8CFF" />
        <Pressable onPress={() => navigation?.navigate?.('Goals')}>
          <Text style={{ fontSize: 12, color: '#4F8CFF', fontWeight: '600' }}>See all →</Text>
        </Pressable>
      </View>
      {top2.map((g, i) => {
        const pct  = safePct(g.saved || 0, g.target || 1);
        const mth  = g.deadline ? Math.max(1, Math.round((new Date(g.deadline) - new Date()) / 1000 / 60 / 60 / 24 / 30)) : (g.duration || 12);
        const req  = monthlyNeeded(g.target || 0, g.saved || 0, mth);
        return (
          <View key={g.id || i} style={[st.goalRow, { borderBottomWidth: i < top2.length - 1 ? 1 : 0, borderBottomColor: T.border }]}>
            <View style={[st.goalIcon2, { backgroundColor: (g.color || '#4F8CFF') + '22' }]}>
              <Text style={{ fontSize: 16 }}>{g.icon || '🎯'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontWeight: '600', fontSize: 13, color: T.t1 }} numberOfLines={1}>{g.title}</Text>
                <Text style={{ fontWeight: '700', fontSize: 13, color: g.color || '#4F8CFF' }}>{pct}%</Text>
              </View>
              <Bar value={g.saved || 0} total={Math.max(g.target || 1, 1)} color={g.color || '#4F8CFF'} h={6} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 10, color: T.t3 }}>{fmt(g.saved || 0)} / {fmt(g.target || 0)}</Text>
                {req > 0 && <Text style={{ fontSize: 10, color: g.color || '#4F8CFF' }}>Need {fmt(req)}/mo</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
}

// ════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { state: s, set, dispatch } = useApp();
  const { T }   = useTheme();
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [trendMode, setTrendMode]             = useState('monthly'); // monthly / weekly

  const d           = useMemo(() => { try { return deriveState(s); } catch { return { totalIncome:0,salary:0,earnedSalary:0,sipTotal:0,debtTotal:0,debtEmi:0,manualTotal:0,balance:0,present:0,workDays:26,perDay:0,lostSalary:0,netWorth:0,totalAssets:0 }; } }, [s]);
  const score       = useMemo(() => calcScore(s),      [s]);
  const personality = useMemo(() => calcPersonality(s),[s]);
  const action      = useMemo(() => nextAction(s),     [s]);
  const insights    = useMemo(() => buildInsights(s),  [s]);
  const aiInsights  = useMemo(() => generateAIInsights(s, d), [s, d]);

  const bars = useMemo(() =>
    (s.monthlyData || []).slice(0, (s.currentMonth || 0) + 1).map((v, i) => ({ v: Number(v) || 0, l: MONTHS_SHORT[i] || '' })).slice(-6),
    [s.monthlyData, s.currentMonth]
  );

  const achievements = useMemo(() => {
    const totalSaved = (s.goals || []).reduce((a, g) => a + (Number(g?.saved) || 0), 0);
    const debtPaid   = (s.debts || []).reduce((a, dbt) => a + ((Number(dbt?.amount)||0)-(Number(dbt?.remaining)||0)), 0);
    return [
      { icon:'🥇', label:'Saver',      unlocked:totalSaved>=100000,    color:'#F59E0B' },
      { icon:'📈', label:'Investor',   unlocked:d.sipTotal>0,           color:'#22C55E' },
      { icon:'💪', label:'Debt Buster',unlocked:debtPaid>=50000,        color:'#4F8CFF' },
      { icon:'🔥', label:'Consistent', unlocked:d.present>=20,          color:'#EF4444' },
      { icon:'👑', label:'Elite',      unlocked:score.total>=85,        color:'#F59E0B' },
      { icon:'🎯', label:'Planner',    unlocked:(s.goals||[]).length>=3,color:'#14B8A6' },
    ];
  }, [s, d, score]);

  // Last month comparison
  const lastMonthEarning = (s.monthlyData || [])[(s.currentMonth || 1) - 1] || 0;
  const thisMonthEarning = (s.monthlyData || [])[s.currentMonth || 0] || d.earnedSalary;
  const monthDelta       = thisMonthEarning - lastMonthEarning;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── HEADER ── */}
      <View style={st.header}>
        <View>
          <Text style={[st.appLabel, { color: T.t3 }]}>GROWTH LEDGER</Text>
          <Text style={[st.pageTitle, { color: T.t1 }]}>Dashboard</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <StreakBadge streak={s.loginStreak || 1} T={T} />
          <MonthPicker
            month={s.currentMonth || 0}
            year={s.currentYear || new Date().getFullYear()}
            onChange={(m, y) => set({ currentMonth: m, currentYear: y, attendance: new Set() })}
          />
        </View>
      </View>

      {/* ── XP / LEVEL SECTION ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 10 }}>
        <XPSection s={s} T={T} />
      </View>

      {/* ── DAILY CHECK-IN ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
        <CheckInCard s={s} dispatch={dispatch} T={T} />
      </View>

      {/* ── HERO EARNINGS CARD ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
        <HeroCard d={d} s={s} T={T} />
      </View>

      {/* ── SCORE + PERSONALITY ── */}
      <View style={[st.row2, { paddingHorizontal: SP.md, marginBottom: 12 }]}>
        <Card style={{ flex: 1, padding: SP.md }}>
          <Text style={[st.cardLabel, { color: T.t3 }]}>HEALTH SCORE</Text>
          {d.salary === 0 ? (
            <Text style={{ fontSize: 12, color: T.t3, lineHeight: 18 }}>Enter salary to see</Text>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ScoreRing score={score.total} color={score.color} size={68} sw={7} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: score.color, lineHeight: 16, marginBottom: 4 }} numberOfLines={2}>{score.label}</Text>
                {(score.breakdown || []).slice(0, 3).map(b => <Bar key={b.label} value={b.score} total={b.max} color={b.color} h={3} />)}
              </View>
            </View>
          )}
        </Card>
        <LinearGradient
          colors={[personality.color + '15', personality.color + '08']}
          style={[{ flex: 1, borderRadius: R.xl, padding: SP.md, borderWidth: 1, borderColor: T.border }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={[st.cardLabel, { color: T.t3 }]}>PERSONALITY</Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: personality.color, lineHeight: 18 }}>{personality.type}</Text>
          <Text style={{ fontSize: 11, color: T.t3, lineHeight: 16, marginTop: 5 }} numberOfLines={3}>{personality.desc}</Text>
        </LinearGradient>
      </View>

      {/* ── NET WORTH + INCOME ── */}
      <View style={[st.row2, { paddingHorizontal: SP.md, marginBottom: 12 }]}>
        <NetWorthCard d={d} s={s} T={T} />
        <Card style={{ flex: 1 }}>
          <Text style={[st.cardLabel, { color: T.t3 }]}>THIS MONTH</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#4F8CFF', marginBottom: 6 }}>{fmt(d.totalIncome)}</Text>
          <Text style={{ fontSize: 10, color: T.t3, marginBottom: 6 }}>{(s.incomes || []).length} income sources</Text>
          {/* vs last month */}
          {lastMonthEarning > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontSize: 11, color: monthDelta >= 0 ? '#22C55E' : '#EF4444', fontWeight: '600' }}>
                {monthDelta >= 0 ? '↑' : '↓'} {fmtShort(Math.abs(monthDelta))}
              </Text>
              <Text style={{ fontSize: 10, color: T.t3 }}>vs last month</Text>
            </View>
          )}
        </Card>
      </View>

      {/* ── NEXT ACTION ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
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

      {/* ── AI INSIGHTS ENGINE ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
        <Card>
          <SH
            title="🧠 AI Insights"
            right={showAllInsights ? 'Less' : `All (${aiInsights.length})`}
            onRight={() => setShowAllInsights(v => !v)}
          />
          {(showAllInsights ? aiInsights : aiInsights.slice(0, 2)).map((ins, i) => (
            <AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i === (showAllInsights ? aiInsights : aiInsights.slice(0, 2)).length - 1} />
          ))}
        </Card>
      </View>

      {/* ── EXPENSE SPLIT + INSIGHT ── */}
      {d.salary > 0 && (
        <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
          <Card>
            <SH title="Expense Split" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <DonutChart segments={(s.expenses || []).map(e => ({ pct: e.pct, color: e.color }))} size={88} sw={11} centerLabel={fmtShort(d.salary)} />
              <View style={{ flex: 1 }}>
                {(s.expenses || []).map((e, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: e.color }} />
                      <Text style={{ fontSize: 12, color: T.t2 }}>{e.label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: '700', fontSize: 12, color: e.color }}>{fmt(d.salary * e.pct / 100)}</Text>
                      <Text style={{ fontSize: 9, color: T.t3 }}>{e.pct}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <ExpenseInsight s={s} d={d} T={T} />
          </Card>
        </View>
      )}

      {/* ── GOALS SECTION ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
        <Card>
          <SH title="Financial Goals" />
          <GoalsSection s={s} d={d} T={T} navigation={navigation} />
        </Card>
      </View>

      {/* ── ACHIEVEMENTS ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
        <Card>
          <SH title="Achievements" right={`${achievements.filter(a => a.unlocked).length}/${achievements.length}`} rightColor="#F59E0B" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {achievements.map((a, i) => (
              <View key={i} style={{ width: 60, alignItems: 'center' }}>
                <View style={[st.achIcon, {
                  backgroundColor: a.unlocked ? a.color + '22' : T.l2,
                  borderColor:     a.unlocked ? a.color + '44' : T.border,
                  opacity:         a.unlocked ? 1 : 0.28,
                }]}>
                  <Text style={{ fontSize: 18 }}>{a.icon}</Text>
                </View>
                <Text style={{ fontSize: 9, fontWeight: '600', color: a.unlocked ? T.t2 : T.t3, textAlign: 'center', marginTop: 4 }}>{a.label}</Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>

      {/* ── QUICK STATS STRIP ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginLeft: SP.md, marginBottom: 12 }} contentContainerStyle={{ gap: 10, paddingRight: SP.md }}>
        {[
          { icon: '📈', label: 'SIP/mo',  val: d.sipTotal  > 0 ? fmtShort(d.sipTotal)  : 'None', color: '#22C55E' },
          { icon: '🏦', label: 'EMI/mo',  val: d.debtEmi   > 0 ? fmtShort(d.debtEmi)   : 'None', color: '#EF4444' },
          { icon: '💳', label: 'Debt',    val: d.debtTotal > 0 ? fmtShort(d.debtTotal)  : '₹0',  color: '#A78BFA' },
          { icon: '💰', label: 'Balance', val: fmtShort(d.balance),                               color: d.balance > 0 ? '#22C55E' : '#EF4444' },
        ].map((c, i) => (
          <Card key={i} style={{ padding: SP.md, minWidth: 120 }}>
            <Text style={{ fontSize: 18, marginBottom: 5 }}>{c.icon}</Text>
            <Text style={{ fontSize: 9, color: T.t3, marginBottom: 2 }}>{c.label}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: c.color }}>{c.val}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* ── EARNINGS TREND ── */}
      <View style={{ paddingHorizontal: SP.md, marginBottom: 12 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <SH title="Earnings Trend" />
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '800', fontSize: 17, color: '#22C55E' }}>
                  {fmtShort((s.monthlyData || []).slice(0, (s.currentMonth || 0) + 1).reduce((a, v) => a + (Number(v) || 0), 0))}
                </Text>
                <Text style={{ fontSize: 10, color: T.t3 }}>YTD</Text>
              </View>
              {/* Monthly/Weekly toggle */}
              <View style={[st.toggle2, { backgroundColor: T.l2, borderColor: T.border }]}>
                {['monthly', 'weekly'].map(m => (
                  <Pressable key={m} onPress={() => setTrendMode(m)}
                    style={[st.toggleBtn, trendMode === m && { backgroundColor: '#4F8CFF' }]}>
                    <Text style={{ fontSize: 9, color: trendMode === m ? '#fff' : T.t3, fontWeight: '600' }}>
                      {m === 'monthly' ? 'Monthly' : 'Weekly'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          {bars.every(b => b.v === 0) ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 13, color: T.t3 }}>No earnings data yet</Text>
            </View>
          ) : (
            <BarChart data={bars} color="#4F8CFF" height={64} />
          )}
          {/* vs last month */}
          {lastMonthEarning > 0 && (
            <View style={[st.deltaRow, { borderTopColor: T.border }]}>
              <Text style={{ fontSize: 12, color: T.t3 }}>vs last month</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: monthDelta >= 0 ? '#22C55E' : '#EF4444' }}>
                {monthDelta >= 0 ? '↑ +' : '↓ '}{fmtShort(Math.abs(monthDelta))}
              </Text>
            </View>
          )}
        </Card>
      </View>

      {/* ── QUICK TOOLS ── */}
      <View style={{ paddingHorizontal: SP.md }}>
        <Card>
          <SH title="Quick Tools" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { icon: '🎯', label: 'Goal Planner',    screen: 'Goals'     },
              { icon: '🧾', label: 'Tax Estimator',   screen: 'Tax'       },
              { icon: '📊', label: 'Simulator',        screen: 'Simulator' },
              { icon: '🧠', label: 'AI Decisions',    screen: 'Decisions' },
              { icon: '🌊', label: 'Cash Flow',       screen: 'CashFlow'  },
              { icon: '📈', label: 'Insights',        screen: 'Insights'  },
            ].map((tool) => (
              <Pressable key={tool.screen}
                onPress={() => navigation?.navigate?.(tool.screen)}
                style={[st.toolCard, { backgroundColor: T.l2, borderColor: T.border }]}>
                <Text style={{ fontSize: 20 }}>{tool.icon}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: T.t1, marginTop: 4 }}>{tool.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md },
  appLabel:     { fontSize:11, fontWeight:'600', letterSpacing:0.6, marginBottom:2 },
  pageTitle:    { fontSize:26, fontWeight:'800', letterSpacing:-0.5 },
  row2:         { flexDirection:'row', gap:10, marginBottom:0 },
  cardLabel:    { fontSize:10, fontWeight:'600', letterSpacing:0.5, textTransform:'uppercase', marginBottom:8 },

  // XP section
  xpSection:    { backgroundColor:'rgba(255,255,255,0.03)', borderRadius:14, padding:12, borderWidth:1 },
  xpLeft:       { flexDirection:'row', alignItems:'center', gap:10 },
  lvlBadge:     { paddingHorizontal:10, paddingVertical:5, borderRadius:99, borderWidth:1, alignItems:'center', justifyContent:'center' },
  xpTrack:      { height:6, borderRadius:99, overflow:'hidden' },
  xpFill:       { height:'100%', borderRadius:99, shadowOpacity:0.5, shadowRadius:6, elevation:3 },

  // Streak
  streakBadge:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:99, borderWidth:1 },

  // Check-in
  checkCard:    { flexDirection:'row', alignItems:'center', gap:12, borderRadius:16, padding:14, borderWidth:1 },
  checkBtn:     { paddingHorizontal:14, paddingVertical:8, borderRadius:10, alignItems:'center' },

  // Hero
  heroBubble:   { position:'absolute', top:-40, right:-20, width:150, height:150, borderRadius:75, backgroundColor:'rgba(255,255,255,0.04)' },
  heroSub:      { fontSize:10, fontWeight:'600', color:'rgba(255,255,255,0.4)', letterSpacing:1.2, textTransform:'uppercase', marginBottom:8 },
  heroAmt:      { fontSize:36, fontWeight:'800', color:'#fff', letterSpacing:-2, lineHeight:42, marginBottom:10 },
  heroStats:    { flexDirection:'row', gap:18, marginTop:14, marginBottom:12 },
  heroMsgBox:   { backgroundColor:'rgba(255,255,255,0.06)', borderRadius:10, padding:10, marginTop:4 },

  // Expense insight
  expInsight:   { flexDirection:'row', gap:8, padding:10, borderRadius:12, borderWidth:1, alignItems:'center' },

  // Goals
  goalsEmpty:   { borderRadius:16, padding:20, borderWidth:1, borderStyle:'dashed', alignItems:'center' },
  goalsCtaBtn:  { paddingHorizontal:20, paddingVertical:10, borderRadius:12, alignItems:'center' },
  goalRow:      { flexDirection:'row', alignItems:'flex-start', gap:10, paddingVertical:12 },
  goalIcon2:    { width:38, height:38, borderRadius:11, alignItems:'center', justifyContent:'center' },

  // Action
  actionCard:   { borderRadius:18, padding:14, flexDirection:'row', gap:12, alignItems:'center', borderWidth:1 },
  actionIcon:   { width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center' },

  // Achievements
  achIcon:      { width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center', borderWidth:1 },

  // Toggle
  toggle2:      { flexDirection:'row', borderRadius:10, padding:3, gap:3, borderWidth:1 },
  toggleBtn:    { paddingHorizontal:10, paddingVertical:4, borderRadius:7 },
  deltaRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:10, marginTop:10, borderTopWidth:1 },

  // Tools
  toolCard:     { width:'30%', borderRadius:14, padding:12, alignItems:'center', borderWidth:1 },
});
