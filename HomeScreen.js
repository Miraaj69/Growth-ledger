// HomeScreen.js — Premium Redesign v12
// Design: CRED / Groww / Apple Finance — clean, layered, depth-first
// FIXES: added `memo` to React import (was causing ReferenceError crash)

import React, { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  ScrollView, View, Text, Pressable,
  StyleSheet, Animated, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
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
const CARD_HALF = (W - SP.md * 2 - 10) / 2;

// ── AI Insight Engine ─────────────────────────────────────
const generateAIInsights = (s, d) => {
  const insights = [];
  const salary = safeNum(s.salary);
  const wntPct = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
  const savPct = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
  const sipTotal = d.sipTotal || 0;
  const debtTotal = d.debtTotal || 0;
  const totalInc = d.totalIncome || 0;

  if (totalInc === 0) {
    return [{ icon: '💡', msg: 'Tip: Add your salary to unlock smarter insights.', color: '#A78BFA', level: 'info' }];
  }
  if (wntPct > 35)
    insights.push({ icon: '💸', msg: `Wants at ${wntPct}% — cut to 30% to free ${fmt(salary * (wntPct - 30) / 100)}/mo`, color: '#EF4444', level: 'danger' });
  else if (wntPct > 28)
    insights.push({ icon: '⚠️', msg: `Wants at ${wntPct}% — slightly high. Target 28%.`, color: '#F59E0B', level: 'warn' });
  else
    insights.push({ icon: '✅', msg: `Wants well controlled at ${wntPct}% — financially disciplined!`, color: '#22C55E', level: 'good' });

  if (sipTotal === 0 && totalInc > 0)
    insights.push({ icon: '📈', msg: '₹500/mo in Nifty 50 = wealth over time. Start a SIP today.', color: '#4F8CFF', level: 'info' });

  if (debtTotal > salary * 6)
    insights.push({ icon: '🔥', msg: 'High debt — pay extra ₹2K/mo to clear faster', color: '#EF4444', level: 'danger' });

  return insights.slice(0, 4);
};

// ─── Streak Badge ─────────────────────────────────────────
function StreakBadge({ streak }) {
  return (
    <View style={st.streakBadge}>
      <Text style={st.streakIcon}>⚡</Text>
      <Text style={st.streakText}>{streak}d streak</Text>
    </View>
  );
}

// ─── Profile Avatar ───────────────────────────────────────
function Avatar({ uri }) {
  if (uri) {
    return <Image source={{ uri }} style={st.avatar} />;
  }
  return (
    <View style={st.avatarDefault}>
      <Text style={{ fontSize: 26 }}>🧑‍💼</Text>
    </View>
  );
}

// ─── Hero Earnings Card ───────────────────────────────────
function HeroCard({ d, s }) {
  const month = s.currentMonth || 0;
  const year = s.currentYear || new Date().getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();
  const monthProg = safePct(today, daysInMonth);

  const heroMsg = (() => {
    if (d.salary === 0) return 'Add your salary to start tracking earnings';
    if (d.lostSalary > 0) return `₹${Math.round(d.lostSalary).toLocaleString('en-IN')} lost — reduce absences to maximise`;
    return `On track to earn ${fmtShort(d.earnedSalary)} this month`;
  })();

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: monthProg, duration: 1200, useNativeDriver: false }).start();
  }, [monthProg]);
  const barW = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <LinearGradient
      colors={['#0f2460', '#1a3a8c', '#2355c5', '#2e6be6']}
      style={st.heroCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={st.heroDeco1} />
      <View style={st.heroDeco2} />

      {/* Wallet icon top-right */}
      <View style={st.heroWalletIcon}>
        <Text style={{ fontSize: 22, opacity: 0.3 }}>👛</Text>
      </View>

      <Text style={st.heroLabel}>EARNED THIS MONTH</Text>
      <Text style={st.heroAmount}>{d.salary > 0 ? fmt(d.earnedSalary) : '₹0'}</Text>

      {/* Month progress bar */}
      <View style={st.progressRow}>
        <Text style={st.progressText}>Month progress {monthProg}%</Text>
        <Text style={st.progressText}>{today}/{daysInMonth} days</Text>
      </View>
      <View style={st.progressTrack}>
        <Animated.View style={[st.progressFill, { width: barW }]} />
      </View>

      {/* Stats row */}
      <View style={st.heroStats}>
        {[
          { l: 'Per Day', v: d.salary > 0 ? fmt(d.perDay) : '₹1,250' },
          { l: 'Logged', v: `${d.present}/${d.workDays || 26}` },
          { l: 'Lost', v: d.salary > 0 ? fmt(d.lostSalary) : '₹32,500', red: true },
          { l: 'Balance', v: d.balance > 0 ? fmtShort(d.balance) : '₹0' },
        ].map(({ l, v, red }) => (
          <View key={l} style={{ flex: 1 }}>
            <Text style={st.heroStatLabel}>{l}</Text>
            <Text style={[st.heroStatVal, red && { color: '#fca5a5' }]}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Alert message */}
      <View style={st.heroAlert}>
        <Text style={{ fontSize: 12, marginRight: 6 }}>📊</Text>
        <Text style={st.heroAlertText} numberOfLines={1}>{heroMsg}</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Score + Personality Row ──────────────────────────────
function ScorePersonalityRow({ score, personality }) {
  return (
    <View style={st.row2}>
      {/* Health Score */}
      <View style={[st.halfCard, { borderColor: '#e2e8f0' }]}>
        <Text style={st.miniLabel}>HEALTH SCORE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <ScoreRing score={score.total} color={score.color} size={64} sw={7} />
          <View style={{ flex: 1 }}>
            <Text style={[st.scoreLabel, { color: score.color }]}>{score.label} 👍</Text>
            <View style={{ marginTop: 6, gap: 4 }}>
              {(score.breakdown || []).slice(0, 3).map(b => (
                <Bar key={b.label} value={b.score} total={b.max} color={b.color} h={3} />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Personality */}
      <View style={[st.halfCard, { borderColor: '#e2e8f0', position: 'relative', overflow: 'hidden' }]}>
        <View style={st.personalityDeco}>
          <Text style={{ fontSize: 44, opacity: 0.08 }}>🧠</Text>
        </View>
        <Text style={st.miniLabel}>PERSONALITY</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Text style={{ fontSize: 12 }}>📈</Text>
          <Text style={[st.personalityType, { color: personality.color }]}>{personality.type}</Text>
        </View>
        <Text style={st.personalityDesc}>{personality.desc || 'Boost your SIP now.'}</Text>
      </View>
    </View>
  );
}

// ─── Net Worth Card ───────────────────────────────────────
function NetWorthCard({ d }) {
  return (
    <View style={st.netWorthCard}>
      <Text style={st.sectionTitle}>NET WORTH OVERVIEW</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <View style={st.netWorthLeft}>
          <View style={st.walletBadge}>
            <Text style={{ fontSize: 20 }}>👛</Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={st.netWorthAmount}>{fmtShort(d.netWorth)}</Text>
            <Text style={st.netWorthSub}>Net Worth</Text>
          </View>
        </View>
        <View style={st.netDivider} />
        <View style={{ flex: 1, paddingLeft: 14 }}>
          <Text style={st.netIncomeAmt}>{fmt(d.totalIncome)}</Text>
          <Text style={st.netIncomeSub}>This Month Income</Text>
          <Text style={[st.netIncomeSub, { marginTop: 2 }]}>{(d.incomes || []).length} Income sources</Text>
        </View>
      </View>

      <View style={[st.netStatsRow, { borderTopColor: '#e2e8f0' }]}>
        {[
          { l: 'Assets', v: fmt(d.totalAssets), c: '#0f172a' },
          { l: 'Debts', v: fmt(d.debtTotal), c: '#EF4444' },
          { l: 'Net Worth', v: fmt(d.netWorth), c: '#0f172a' },
        ].map(({ l, v, c }, i) => (
          <View key={l} style={[st.netStatItem, i < 2 && { borderRightWidth: 1, borderRightColor: '#e2e8f0' }]}>
            <Text style={st.netStatLabel}>{l}</Text>
            <Text style={[st.netStatVal, { color: c }]}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Next Action + AI Insight Row ────────────────────────
function ActionInsightRow({ action, aiInsights, navigation }) {
  const [showAll, setShowAll] = useState(false);
  const firstInsight = aiInsights[0];

  return (
    <View style={st.row2}>
      <Pressable
        style={[st.halfCard, { borderColor: '#e2e8f0', gap: 8 }]}
        onPress={() => navigation?.navigate?.(action.screen || 'Goals')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[st.actionIconBox, { backgroundColor: (action.color || '#22C55E') + '18' }]}>
            <Text style={{ fontSize: 16 }}>{action.icon || '📈'}</Text>
          </View>
          <Text style={[st.miniLabel, { color: action.color || '#22C55E' }]}>NEXT ACTION</Text>
        </View>
        <Text style={st.actionTitle}>{action.title || 'Start a SIP today'}</Text>
        <Text style={st.actionDesc} numberOfLines={2}>{action.desc || '₹500/mo in Nifty 50 = wealth over time.'}</Text>
        <View style={st.actionChevron}>
          <Text style={{ fontSize: 14, color: action.color || '#22C55E' }}>›</Text>
        </View>
        <Pressable style={[st.actionCta, { backgroundColor: (action.color || '#22C55E') + '18', borderColor: (action.color || '#22C55E') + '30' }]}>
          <Text style={[st.actionCtaText, { color: action.color || '#22C55E' }]}>Start Now →</Text>
        </Pressable>
      </Pressable>

      <View style={[st.halfCard, { borderColor: '#e2e8f0', gap: 8 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[st.actionIconBox, { backgroundColor: '#A78BFA18' }]}>
              <Text style={{ fontSize: 16 }}>🧠</Text>
            </View>
            <Text style={[st.miniLabel, { color: '#A78BFA' }]}>AI INSIGHT</Text>
          </View>
          <Pressable onPress={() => setShowAll(v => !v)}>
            <Text style={{ fontSize: 11, color: '#4F8CFF', fontWeight: '600' }}>
              All ({aiInsights.length})
            </Text>
          </Pressable>
        </View>

        <Text style={st.insightText} numberOfLines={3}>
          {firstInsight ? `${firstInsight.icon} ${firstInsight.msg}` : '💡 Tip: Add your salary to unlock smarter insights.'}
        </Text>

        <Pressable
          style={[st.insightCta, { backgroundColor: '#A78BFA18', borderColor: '#A78BFA30' }]}
          onPress={() => navigation?.navigate?.('Money')}
        >
          <Text style={[st.actionCtaText, { color: '#A78BFA' }]}>Add Salary →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Expense Split + Goals Row ────────────────────────────
function ExpenseGoalsRow({ s, d, navigation }) {
  const goals = s.goals || [];

  return (
    <View style={st.row2}>
      <View style={[st.halfCard, { borderColor: '#e2e8f0' }]}>
        <Text style={st.sectionTitle}>EXPENSE SPLIT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <DonutChart
            segments={(s.expenses || []).map(e => ({ pct: e.pct, color: e.color }))}
            size={80}
            sw={10}
            centerLabel={fmtShort(d.salary || 32500)}
          />
          <View style={{ flex: 1, gap: 6 }}>
            {(s.expenses || []).map((e, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: e.color }} />
                  <Text style={{ fontSize: 10, color: '#475569' }}>{e.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#0f172a' }}>
                    {fmt(d.salary * e.pct / 100)}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#94A3B8' }}>{e.pct}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={st.expInsightPill}>
          <Text style={{ fontSize: 10 }}>✅</Text>
          <Text style={st.expInsightText} numberOfLines={2}>
            Wants spending well controlled — saving ₹0/mo extra
          </Text>
        </View>
      </View>

      <View style={[st.halfCard, { borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[st.sectionTitle, { alignSelf: 'flex-start' }]}>FINANCIAL GOALS</Text>
        {goals.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 16, gap: 8 }}>
            <Text style={{ fontSize: 36 }}>🎯</Text>
            <Text style={st.emptyGoalTitle}>No goals yet</Text>
            <Text style={st.emptyGoalSub}>Set your first goal and track your progress.</Text>
            <Pressable
              style={st.createGoalBtn}
              onPress={() => navigation?.navigate?.('Goals')}
            >
              <Text style={st.createGoalText}>Create First Goal →</Text>
            </Pressable>
          </View>
        ) : (
          goals.slice(0, 2).map((g, i) => {
            const pct = safePct(g.saved || 0, g.target || 1);
            return (
              <View key={g.id || i} style={{ width: '100%', marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>{g.title}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: g.color || '#4F8CFF' }}>{pct}%</Text>
                </View>
                <Bar value={g.saved || 0} total={Math.max(g.target || 1, 1)} color={g.color || '#4F8CFF'} h={5} />
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

// ─── Achievements + Snapshot Row ─────────────────────────
function AchievementsSnapshotRow({ achievements, d }) {
  const nextUnlocked = achievements.find(a => !a.unlocked);
  return (
    <View style={st.row2}>
      <View style={[st.halfCard, { borderColor: '#e2e8f0' }]}>
        <Text style={st.sectionTitle}>ACHIEVEMENTS</Text>
        {nextUnlocked && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Text style={{ fontSize: 10 }}>🏆</Text>
            <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '700' }}>
              Next: {nextUnlocked.label}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8 }}>
          {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {achievements.map((a, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <View style={[st.achBadge, {
                backgroundColor: a.unlocked ? a.color + '18' : '#f1f5f9',
                borderColor: a.unlocked ? a.color + '40' : '#e2e8f0',
                opacity: a.unlocked ? 1 : 0.4,
              }]}>
                <Text style={{ fontSize: 16 }}>{a.icon}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ marginTop: 8 }}>
          <Bar value={achievements.filter(a => a.unlocked).length} total={achievements.length} color="#F59E0B" h={4} />
        </View>
      </View>

      <View style={[st.halfCard, { borderColor: '#e2e8f0' }]}>
        <Text style={st.sectionTitle}>FINANCIAL SNAPSHOT</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {[
            { l: 'SIP', v: d.sipTotal > 0 ? fmtShort(d.sipTotal) : 'None', c: d.sipTotal > 0 ? '#22C55E' : '#94A3B8' },
            { l: 'EMI', v: d.debtEmi > 0 ? fmtShort(d.debtEmi) : 'None', c: d.debtEmi > 0 ? '#EF4444' : '#F59E0B' },
            { l: 'Debt', v: d.debtTotal > 0 ? fmtShort(d.debtTotal) : '₹0', c: '#A78BFA' },
          ].map(({ l, v, c }) => (
            <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>{l}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: c }}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Earnings Trend ───────────────────────────────────────
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_LABELS  = ['W1', 'W2', 'W3', 'W4'];
const TOGGLE_TABS  = ['Monthly', 'Weekly'];

function buildWeeklyBars(s, d) {
  const salary   = safeNum(d.earnedSalary) || safeNum(d.salary);
  const perDay   = safeNum(d.perDay);
  const base = perDay > 0 ? perDay * 5 : salary / 4;
  const seed = salary > 0 ? salary : 0;
  return WEEK_LABELS.map((l, i) => ({
    l,
    v: seed > 0 ? Math.round(base * [1.05, 0.95, 1.10, 0.90][i]) : 0,
  }));
}

function buildMonthlyBars(s) {
  const currentMonth = s.currentMonth || 0;
  return (s.monthlyData || [])
    .slice(0, currentMonth + 1)
    .map((v, i) => ({ v: Number(v) || 0, l: MONTH_LABELS[i] || '' }))
    .slice(-6);
}

// ── Line Chart — pure SVG, no extra deps ──────────────────
const LineChart = memo(({ data, color, height }) => {
  const W_CHART = Dimensions.get('window').width - 64;
  const H       = height;
  const PAD_V   = 8;
  const PAD_H   = 12;
  const vals    = data.map(d => d.v);
  const maxVal  = Math.max(...vals, 1);

  const pts = data.map((d, i) => ({
    x: PAD_H + (i / Math.max(data.length - 1, 1)) * (W_CHART - PAD_H * 2),
    y: PAD_V + (1 - d.v / maxVal) * (H - PAD_V * 2 - 18),
    v: d.v,
    l: d.l,
  }));

  const path = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cpx  = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const fillPath = pts.length > 0
    ? `${path} L ${pts[pts.length - 1].x},${H - 18} L ${pts[0].x},${H - 18} Z`
    : '';

  const chartOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    chartOpacity.setValue(0);
    Animated.timing(chartOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [data]);

  const {
    Svg, Path, Defs,
    LinearGradient: SvgGrad, Stop,
    Circle: SvgCircle, Line,
  } = require('react-native-svg');

  return (
    <Animated.View style={{ opacity: chartOpacity }}>
      <Svg width={W_CHART} height={H}>
        <Defs>
          <SvgGrad id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </SvgGrad>
        </Defs>

        {[0.25, 0.5, 0.75].map((pct, i) => {
          const gy = PAD_V + pct * (H - PAD_V * 2 - 18);
          return (
            <Line
              key={i}
              x1={PAD_H} y1={gy}
              x2={W_CHART - PAD_H} y2={gy}
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {fillPath ? <Path d={fillPath} fill="url(#fill)" /> : null}

        {path ? (
          <Path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {pts.map((pt, i) => (
          <SvgCircle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={i === pts.length - 1 ? 5 : 3}
            fill={i === pts.length - 1 ? color : '#fff'}
            stroke={color}
            strokeWidth={i === pts.length - 1 ? 2.5 : 1.5}
          />
        ))}
      </Svg>

      <View style={{ flexDirection: 'row', paddingHorizontal: PAD_H, marginTop: -4 }}>
        {pts.map((pt, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              fontWeight: i === pts.length - 1 ? '700' : '400',
              color: i === pts.length - 1 ? '#0f172a' : '#94A3B8',
            }}
          >
            {pt.l}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
});

function EarningsTrendCard({ s, d }) {
  const [viewMode, setViewMode] = useState('monthly');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const handleToggle = useCallback((mode) => {
    if (mode === viewMode) return;
    // Fade out first (native driver)
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setViewMode(mode);
      // slideAnim is non-native (width/position), run separately
      Animated.spring(slideAnim, { toValue: mode === 'monthly' ? 0 : 1, useNativeDriver: false, speed: 28, bounciness: 0 }).start();
      // fadeAnim is native, run separately
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [viewMode]);

  const chartData = useMemo(() => {
    if (viewMode === 'weekly') return buildWeeklyBars(s, d);
    return buildMonthlyBars(s);
  }, [viewMode, s, d]);

  const ytd = useMemo(() =>
    (s.monthlyData || []).slice(0, (s.currentMonth || 0) + 1).reduce((a, v) => a + (Number(v) || 0), 0),
    [s.monthlyData, s.currentMonth]
  );

  const weeklyTotal = useMemo(() =>
    buildWeeklyBars(s, d).reduce((a, b) => a + b.v, 0),
    [s, d]
  );

  const summaryValue  = viewMode === 'monthly' ? ytd : weeklyTotal;
  const summaryLabel  = viewMode === 'monthly' ? 'YTD' : 'This Month';
  const activeBarData = chartData[chartData.length - 1];
  const currentMonthStr = `${MONTH_LABELS[s.currentMonth || 0]} ${s.currentYear || new Date().getFullYear()}`;
  const activeLabel = viewMode === 'monthly' ? currentMonthStr : 'Week 4';
  const activeValue = activeBarData?.v > 0 ? fmt(activeBarData.v) : '₹0';

  const TOGGLE_W = 160;
  const PILL_W   = TOGGLE_W / 2 - 4;
  const pillLeft = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [2, PILL_W + 4] });

  const hasData = chartData.some(b => b.v > 0);

  return (
    <View style={st.trendCard}>
      <View style={st.trendHeader}>
        <View>
          <Text style={st.sectionTitle}>EARNINGS TREND</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
            <Text style={st.trendYtdVal}>{fmtShort(summaryValue)}</Text>
            <Text style={st.trendYtdLabel}>{summaryLabel}</Text>
          </View>
        </View>

        <View style={st.trendToggleWrap}>
          <Animated.View style={[st.trendPill, { left: pillLeft, width: PILL_W }]} />
          {TOGGLE_TABS.map((tab, idx) => {
            const isActive = viewMode === tab.toLowerCase();
            return (
              <Pressable
                key={tab}
                onPress={() => handleToggle(tab.toLowerCase())}
                style={[st.trendTabBtn, { width: PILL_W }]}
              >
                <Text style={[st.trendTabText, isActive && st.trendTabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Animated.View style={{ opacity: fadeAnim, marginTop: 16 }}>
        {hasData ? (
          <LineChart data={chartData} color="#4F8CFF" height={90} />
        ) : (
          <View style={st.trendEmpty}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>📊</Text>
            <Text style={st.trendEmptyText}>
              {viewMode === 'monthly'
                ? 'No monthly data yet — add your salary to begin'
                : 'No weekly data yet — add earnings to see trends'}
            </Text>
          </View>
        )}
      </Animated.View>

      {hasData && (
        <View style={st.trendFooter}>
          <View style={st.trendFooterDot} />
          <Text style={st.trendFooterLabel}>{activeLabel}</Text>
          <Text style={st.trendFooterVal}>{activeValue}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Quick Tools Grid ─────────────────────────────────────
function QuickToolsGrid({ navigation }) {
  const tools = [
    { icon: '🎯', label: 'Goal Planner', screen: 'Goals',     color: '#EF4444' },
    { icon: '📊', label: 'Simulator',    screen: 'Simulator', color: '#4F8CFF' },
    { icon: '💸', label: 'Cash Flow',    screen: 'CashFlow',  color: '#22C55E' },
    { icon: '🧠', label: 'AI Decisions', screen: 'Decisions', color: '#A78BFA' },
  ];
  return (
    <View style={st.toolsCard}>
      <Text style={[st.sectionTitle, { marginBottom: 14 }]}>QUICK TOOLS</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {tools.map(tool => (
          <Pressable
            key={tool.screen}
            onPress={() => navigation?.navigate?.(tool.screen)}
            style={st.toolItem}
          >
            <View style={[st.toolIconBox, { backgroundColor: tool.color + '12' }]}>
              <Text style={{ fontSize: 22 }}>{tool.icon}</Text>
            </View>
            <Text style={st.toolLabel}>{tool.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN HOME SCREEN
// ══════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { state: s, set } = useApp();
  const { T } = useTheme();

  const d = useMemo(() => {
    try { return deriveState(s); }
    catch {
      return {
        totalIncome: 0, salary: 0, earnedSalary: 0, sipTotal: 0,
        debtTotal: 0, debtEmi: 0, manualTotal: 0, balance: 0,
        present: 0, workDays: 26, perDay: 0, lostSalary: 0,
        netWorth: 0, totalAssets: 0, incomes: [],
      };
    }
  }, [s]);

  const score       = useMemo(() => calcScore(s),       [s]);
  const personality = useMemo(() => calcPersonality(s), [s]);
  const action      = useMemo(() => nextAction(s),      [s]);
  const aiInsights  = useMemo(() => generateAIInsights(s, d), [s, d]);

  const achievements = useMemo(() => {
    const totalSaved = (s.goals || []).reduce((a, g) => a + (Number(g?.saved) || 0), 0);
    const debtPaid   = (s.debts || []).reduce((a, dbt) => a + ((Number(dbt?.amount) || 0) - (Number(dbt?.remaining) || 0)), 0);
    return [
      { icon: '🥇', label: 'Saver',       unlocked: totalSaved >= 100000,           color: '#F59E0B' },
      { icon: '📈', label: 'Investor',    unlocked: d.sipTotal > 0,                  color: '#22C55E' },
      { icon: '💪', label: 'Debt Buster', unlocked: debtPaid >= 50000,               color: '#4F8CFF' },
      { icon: '🔥', label: 'Consistent',  unlocked: d.present >= 20,                 color: '#EF4444' },
      { icon: '👑', label: 'Elite',       unlocked: score.total >= 85,               color: '#F59E0B' },
      { icon: '🎯', label: 'Planner',     unlocked: (s.goals || []).length >= 3,     color: '#14B8A6' },
    ];
  }, [s, d, score]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const userName = s.userName || 'Miraj';

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── HEADER ── */}
        <View style={st.header}>
          <View style={{ flex: 1 }}>
            <Text style={st.greeting}>{greeting}, {userName} 👋</Text>
            <Text style={st.greetingSub}>{"Let's grow your wealth 🚀"}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <StreakBadge streak={s.loginStreak || 1} />
            <Avatar uri={s.profileImage} />
          </View>
        </View>

        {/* ── DASHBOARD TITLE + MONTH PICKER ── */}
        <View style={st.dashRow}>
          <Text style={st.dashTitle}>Dashboard</Text>
          <MonthPicker
            month={s.currentMonth || 0}
            year={s.currentYear || new Date().getFullYear()}
            onChange={(m, y) => set({ currentMonth: m, currentYear: y, attendance: new Set() })}
          />
        </View>

        {/* Sections */}
        <View style={st.section}><HeroCard d={d} s={s} /></View>
        <View style={st.section}><ScorePersonalityRow score={score} personality={personality} /></View>
        <View style={st.section}><NetWorthCard d={d} /></View>
        <View style={st.section}><ActionInsightRow action={action} aiInsights={aiInsights} navigation={navigation} /></View>
        <View style={st.section}><ExpenseGoalsRow s={s} d={d} navigation={navigation} /></View>
        <View style={st.section}><AchievementsSnapshotRow achievements={achievements} d={d} /></View>
        <View style={st.section}><EarningsTrendCard s={s} d={d} /></View>
        <View style={[st.section, { marginBottom: 0 }]}><QuickToolsGrid navigation={navigation} /></View>

      </ScrollView>

      <FABMenu navigation={navigation} />
    </View>
  );
}

// ─── FAB ─────────────────────────────────────────────────
function FABMenu({ navigation }) {
  const [open, setOpen] = useState(false);
  const rot  = useRef(new Animated.Value(0)).current;
  const opac = useRef(new Animated.Value(0)).current;
  const tY   = useRef(new Animated.Value(20)).current;

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    Animated.parallel([
      Animated.spring(rot,  { toValue: next ? 1 : 0, useNativeDriver: true,  speed: 25 }),
      Animated.spring(opac, { toValue: next ? 1 : 0, useNativeDriver: true,  speed: 20 }),
      Animated.spring(tY,   { toValue: next ? 0 : 20, useNativeDriver: true, speed: 20 }),
    ]).start();
  }, [open]);

  const rotation = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const actions = [
    { icon: '💰', label: 'Add Income',  color: '#22C55E', screen: 'Money' },
    { icon: '💸', label: 'Add Expense', color: '#EF4444', screen: 'Money' },
    { icon: '🎯', label: 'Create Goal', color: '#4F8CFF', screen: 'Goals' },
  ];

  return (
    <View style={st.fabContainer}>
      {open && (
        <Animated.View style={[st.fabActions, { opacity: opac, transform: [{ translateY: tY }] }]}>
          {[...actions].reverse().map((a, i) => (
            <Pressable
              key={i}
              onPress={() => { navigation?.navigate?.(a.screen); setOpen(false); }}
              style={[st.fabAction, { backgroundColor: a.color }]}
            >
              <Text style={{ fontSize: 16 }}>{a.icon}</Text>
              <Text style={st.fabActionText}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
      <Pressable onPress={toggle}>
        <LinearGradient
          colors={['#2563EB', '#4F8CFF']}
          style={st.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.Text style={[st.fabIcon, { transform: [{ rotate: rotation }] }]}>+</Animated.Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F59E0B40',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  streakIcon: { fontSize: 13 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarDefault: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F8CFF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  dashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    backgroundColor: '#F1F5F9',
  },
  dashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#1a3a8c',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroDeco1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroDeco2: {
    position: 'absolute',
    bottom: -60,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroWalletIcon: { position: 'absolute', top: 20, right: 20 },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 44,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 99,
  },
  heroStats: { flexDirection: 'row', marginBottom: 14 },
  heroStatLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  heroStatVal: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  heroAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroAlertText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1, lineHeight: 17 },
  // Cards
  row2: { flexDirection: 'row', gap: 10 },
  halfCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scoreLabel: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  personalityDeco: { position: 'absolute', right: 6, top: 10 },
  personalityType: { fontSize: 14, fontWeight: '800' },
  personalityDesc: { fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 16 },
  // Net Worth
  netWorthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  netWorthLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  walletBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  netWorthAmount: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  netWorthSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  netDivider: { width: 1, height: 48, backgroundColor: '#e2e8f0', marginHorizontal: 14 },
  netIncomeAmt: { fontSize: 18, fontWeight: '800', color: '#4F8CFF' },
  netIncomeSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  netStatsRow: { flexDirection: 'row', borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  netStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  netStatLabel: { fontSize: 10, color: '#94A3B8' },
  netStatVal: { fontSize: 14, fontWeight: '700' },
  // Actions
  actionIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', lineHeight: 20 },
  actionDesc: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  actionChevron: {
    position: 'absolute', top: 42, right: 14,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  actionCta: { borderRadius: 10, paddingVertical: 7, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  actionCtaText: { fontSize: 12, fontWeight: '700' },
  insightText: { fontSize: 11, color: '#475569', lineHeight: 17, flex: 1 },
  insightCta: { borderRadius: 10, paddingVertical: 7, alignItems: 'center', borderWidth: 1, marginTop: 'auto' },
  // Expense
  expInsightPill: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 5,
    backgroundColor: '#F0FDF4', borderRadius: 8, padding: 7, marginTop: 8,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  expInsightText: { fontSize: 10, color: '#22C55E', flex: 1, lineHeight: 14 },
  emptyGoalTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  emptyGoalSub: { fontSize: 11, color: '#64748b', textAlign: 'center', lineHeight: 16 },
  createGoalBtn: {
    backgroundColor: '#4F8CFF', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 9, marginTop: 4,
  },
  createGoalText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // Achievements
  achBadge: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  // Trend
  trendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trendYtdVal: { fontSize: 20, fontWeight: '800', color: '#22C55E', letterSpacing: -0.5 },
  trendYtdLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  trendToggleWrap: {
    flexDirection: 'row', backgroundColor: '#F1F5F9',
    borderRadius: 10, padding: 2, width: 160, height: 32,
    position: 'relative', alignItems: 'center',
  },
  trendPill: {
    position: 'absolute', height: 28, borderRadius: 8,
    backgroundColor: '#4F8CFF',
    shadowColor: '#4F8CFF', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  trendTabBtn: { alignItems: 'center', justifyContent: 'center', height: 28, zIndex: 1 },
  trendTabText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  trendTabTextActive: { color: '#ffffff', fontWeight: '700' },
  trendEmpty: { alignItems: 'center', paddingVertical: 24 },
  trendEmptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, maxWidth: 220 },
  trendFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  trendFooterDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4F8CFF' },
  trendFooterLabel: { fontSize: 11, color: '#94A3B8', flex: 1 },
  trendFooterVal: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  // Tools
  toolsCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  toolItem: { alignItems: 'center', gap: 6, flex: 1 },
  toolIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
  // FAB
  fabContainer: { position: 'absolute', bottom: 28, right: 16, alignItems: 'flex-end', zIndex: 200 },
  fabActions: { marginBottom: 10, gap: 8, alignItems: 'flex-end' },
  fabAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  fabActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  fab: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F8CFF', shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  fabIcon: { fontSize: 30, color: '#fff', lineHeight: 36 },
});
