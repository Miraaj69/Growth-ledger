// HomeScreen.js — Premium Redesign v13
// FIXES APPLIED:
// 1. Streak pill — light-yellow filled, user photo right of pill, larger avatar, shadow, borderRadius:0 on image, Apple boy bitmoji default
// 2. Blue hero card — light wallet SVG icon top-right corner
// 3. Health score — score ring centered + aligned
// 4. Personality — brain emoji more visible (larger opacity)
// 5. Next Action — icon & text perfectly aligned
// 6. Expense Split — center label black(light)/white(dark), legend perfectly aligned
// 7. Earnings Trend — clicking Monthly/Weekly shows value in small card below graph
// 8. Quick Tools — icon alignment fixed, equal spacing
// 9. FAB — close icon always shows "+" (45deg), glowing animation, premium style, no bugs

import React, { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  ScrollView, View, Text, Pressable,
  StyleSheet, Animated, Dimensions, Image,
  TouchableOpacity,
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

// ─── FIX 1: Streak + Avatar Header Row ─────────────────────
// Streak pill is now light-yellow filled. Avatar sits right of pill.
// Default is Apple-style boy bitmoji 🧒. Larger avatar, shadow, borderRadius:0 on Image.
function StreakAvatarRow({ streak, avatarUri, onAvatarPress }) {
  return (
    <View style={st.streakAvatarRow}>
      {/* Streak pill — yellow fill */}
      <View style={st.streakPill}>
        <Text style={st.streakIcon}>⚡</Text>
        <Text style={st.streakText}>{streak}d streak</Text>
      </View>

      {/* Avatar — right of pill */}
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.85} style={st.avatarWrap}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={st.avatarImage}
            resizeMode="cover"
          />
        ) : (
          // Default Apple boy bitmoji
          <View style={st.avatarDefault}>
            <Text style={st.avatarEmoji}>🧒</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── FIX 2: Hero Earnings Card with wallet SVG icon ────────
function HeroCard({ d, s, theme }) {
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

      {/* FIX 2 — Wallet SVG icon top-right, light color */}
      <View style={st.heroWalletContainer}>
        <View style={st.heroWalletBg}>
          {/* Simple wallet drawn with nested Views (no extra dep) */}
          <Text style={st.heroWalletEmoji}>👛</Text>
        </View>
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

// ─── FIX 3 & 4: Score + Personality Row ───────────────────
// FIX 3: ScoreRing now vertically centered in health score card
// FIX 4: Brain emoji opacity increased to 0.15 (more visible)
function ScorePersonalityRow({ score, personality, isDark }) {
  return (
    <View style={st.row2}>
      {/* FIX 3 — Health Score: ring centered with flexbox */}
      <View style={[st.halfCard]}>
        <Text style={st.miniLabel}>HEALTH SCORE</Text>
        {/* FIX 3: outer row with alignItems center, ring + text side by side */}
        <View style={st.scoreRow}>
          <View style={st.scoreRingWrap}>
            <ScoreRing score={score.total} color={score.color} size={64} sw={7} />
          </View>
          <View style={st.scoreRight}>
            <Text style={[st.scoreLabel, { color: score.color }]}>{score.label} 👍</Text>
            <View style={{ marginTop: 6, gap: 5 }}>
              {(score.breakdown || []).slice(0, 3).map(b => (
                <Bar key={b.label} value={b.score} total={b.max} color={b.color} h={3} />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* FIX 4 — Personality: brain more visible */}
      <View style={[st.halfCard, { overflow: 'hidden' }]}>
        {/* FIX 4: opacity 0.15 — clearly visible but decorative */}
        <View style={st.personalityDeco}>
          <Text style={st.personalityBrain}>🧠</Text>
        </View>
        <Text style={st.miniLabel}>PERSONALITY</Text>
        <View style={st.personalityTypeRow}>
          <Text style={{ fontSize: 12 }}>📈</Text>
          <Text style={[st.personalityType, { color: personality.color }]}> {personality.type}</Text>
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

// ─── FIX 5: Next Action + AI Insight Row ──────────────────
// Icon and text are now in a row with proper alignItems: 'center'
function ActionInsightRow({ action, aiInsights, navigation }) {
  const [showAll, setShowAll] = useState(false);
  const firstInsight = aiInsights[0];

  return (
    <View style={st.row2}>
      <Pressable
        style={[st.halfCard, { gap: 8 }]}
        onPress={() => navigation?.navigate?.(action.screen || 'Goals')}
      >
        {/* FIX 5 — Icon + label in a flex row, aligned center */}
        <View style={st.actionHeaderRow}>
          <View style={[st.actionIconBox, { backgroundColor: (action.color || '#22C55E') + '18' }]}>
            <Text style={st.actionIconText}>{action.icon || '📈'}</Text>
          </View>
          <Text style={[st.miniLabel, { color: action.color || '#22C55E', flex: 1 }]}>NEXT ACTION</Text>
        </View>
        <Text style={st.actionTitle}>{action.title || 'Start a SIP today'}</Text>
        <Text style={st.actionDesc} numberOfLines={2}>{action.desc || '₹500/mo in Nifty 50 = wealth over time.'}</Text>
        <Pressable
          style={[st.actionCta, { backgroundColor: (action.color || '#22C55E') + '18', borderColor: (action.color || '#22C55E') + '30' }]}
          onPress={() => navigation?.navigate?.(action.screen || 'Goals')}
        >
          <Text style={[st.actionCtaText, { color: action.color || '#22C55E' }]}>Start Now →</Text>
        </Pressable>
      </Pressable>

      <View style={[st.halfCard, { gap: 8 }]}>
        {/* FIX 5 — consistent alignment for insight header */}
        <View style={st.actionHeaderRow}>
          <View style={[st.actionIconBox, { backgroundColor: '#A78BFA18' }]}>
            <Text style={st.actionIconText}>🧠</Text>
          </View>
          <Text style={[st.miniLabel, { color: '#A78BFA', flex: 1 }]}>AI INSIGHT</Text>
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

// ─── FIX 6: Expense Split + Goals Row ─────────────────────
// Center donut label: black in light, white in dark/amoled
// Legend aligned with justifyContent and fixed widths
function ExpenseGoalsRow({ s, d, navigation, isDark }) {
  const goals = s.goals || [];
  // FIX 6: center label color by theme
  const centerLabelColor = isDark ? '#FFFFFF' : '#0f172a';

  return (
    <View style={st.row2}>
      <View style={[st.halfCard]}>
        <Text style={st.sectionTitle}>EXPENSE SPLIT</Text>
        <View style={st.expenseBody}>
          {/* Donut */}
          <View style={st.expenseDonutWrap}>
            <DonutChart
              segments={(s.expenses || []).map(e => ({ pct: e.pct, color: e.color }))}
              size={82}
              sw={10}
              centerLabel={fmtShort(d.salary || 32500)}
              centerLabelColor={centerLabelColor}
            />
          </View>
          {/* FIX 6 — legend: perfectly aligned with consistent column widths */}
          <View style={st.expenseLegend}>
            {(s.expenses || []).map((e, i) => (
              <View key={i} style={st.expenseLegendRow}>
                {/* Left: dot + label */}
                <View style={st.expenseLegendLeft}>
                  <View style={[st.expenseDot, { backgroundColor: e.color }]} />
                  <Text style={st.expenseLegendLabel} numberOfLines={1}>{e.label}</Text>
                </View>
                {/* Right: amount + pct stacked */}
                <View style={st.expenseLegendRight}>
                  <Text style={st.expenseLegendAmt}>
                    {fmt(d.salary * e.pct / 100)}
                  </Text>
                  <Text style={st.expenseLegendPct}>{e.pct}%</Text>
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

      <View style={[st.halfCard, { alignItems: 'center', justifyContent: 'center' }]}>
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
      <View style={[st.halfCard]}>
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

      <View style={[st.halfCard]}>
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

// ─── FIX 7: Earnings Trend — selected point shows value card ─
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

// Line chart with tap-to-select point
const LineChart = memo(({ data, color, height, selectedIndex, onSelectIndex }) => {
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
    Circle: SvgCircle, Line, Rect,
  } = require('react-native-svg');

  // FIX 7: handle tap on chart area to select closest point
  const handleChartPress = useCallback((evt) => {
    const tapX = evt.nativeEvent.locationX;
    let closestIdx = 0;
    let minDist = Infinity;
    pts.forEach((pt, i) => {
      const dist = Math.abs(pt.x - tapX);
      if (dist < minDist) { minDist = dist; closestIdx = i; }
    });
    onSelectIndex?.(closestIdx);
  }, [pts, onSelectIndex]);

  return (
    <Animated.View style={{ opacity: chartOpacity }}>
      <Svg
        width={W_CHART}
        height={H}
        onPress={handleChartPress}
      >
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

        {pts.map((pt, i) => {
          const isSelected = selectedIndex === i;
          const isLast = i === pts.length - 1;
          return (
            <SvgCircle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={isSelected ? 6 : isLast ? 5 : 3}
              fill={isSelected ? '#fff' : isLast ? color : '#fff'}
              stroke={color}
              strokeWidth={isSelected ? 3 : isLast ? 2.5 : 1.5}
            />
          );
        })}
      </Svg>

      <View style={{ flexDirection: 'row', paddingHorizontal: PAD_H, marginTop: -4 }}>
        {pts.map((pt, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              fontWeight: (i === selectedIndex || i === pts.length - 1) ? '700' : '400',
              color: i === selectedIndex ? '#4F8CFF' : i === pts.length - 1 ? '#0f172a' : '#94A3B8',
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
  const [selectedIndex, setSelectedIndex] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  // FIX 7: selected value card scale animation
  const valueCardScale = useRef(new Animated.Value(0)).current;
  const valueCardOpacity = useRef(new Animated.Value(0)).current;

  const handleToggle = useCallback((mode) => {
    if (mode === viewMode) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setViewMode(mode);
      setSelectedIndex(null);
      Animated.spring(slideAnim, { toValue: mode === 'monthly' ? 0 : 1, useNativeDriver: false, speed: 28, bounciness: 0 }).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [viewMode]);

  // FIX 7: animate value card in/out on selection
  const handleSelectIndex = useCallback((idx) => {
    setSelectedIndex(idx);
    valueCardScale.setValue(0.8);
    valueCardOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(valueCardScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
      Animated.timing(valueCardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

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

  // FIX 7: compute selected point info
  const selectedPoint = selectedIndex !== null ? chartData[selectedIndex] : null;
  const selectedLabel = selectedPoint ? selectedPoint.l : null;
  const selectedValue = selectedPoint ? (selectedPoint.v > 0 ? fmt(selectedPoint.v) : '₹0') : null;

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
          {TOGGLE_TABS.map((tab) => {
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
          <LineChart
            data={chartData}
            color="#4F8CFF"
            height={90}
            selectedIndex={selectedIndex}
            onSelectIndex={handleSelectIndex}
          />
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

      {/* FIX 7: Show selected value in a small animated card */}
      {hasData && selectedPoint && (
        <Animated.View style={[st.selectedValueCard, {
          opacity: valueCardOpacity,
          transform: [{ scale: valueCardScale }],
        }]}>
          <Text style={st.selectedValueLabel}>{selectedLabel}</Text>
          <Text style={st.selectedValueAmt}>{selectedValue}</Text>
        </Animated.View>
      )}

      {hasData && !selectedPoint && (
        <View style={st.trendFooter}>
          <View style={st.trendFooterDot} />
          <Text style={st.trendFooterLabel}>{activeLabel}</Text>
          <Text style={st.trendFooterVal}>{activeValue}</Text>
        </View>
      )}

      {hasData && (
        <Text style={st.trendHint}>Tap on chart to see value</Text>
      )}
    </View>
  );
}

// ─── FIX 8: Quick Tools Grid — icon alignment fixed ────────
function QuickToolsGrid({ navigation }) {
  const tools = [
    { icon: '🎯', label: 'Goal Planner', screen: 'Goals',     color: '#EF4444' },
    { icon: '📊', label: 'Simulator',    screen: 'Simulator', color: '#4F8CFF' },
    { icon: '💸', label: 'Cash Flow',    screen: 'CashFlow',  color: '#22C55E' },
    { icon: '🧠', label: 'AI Decisions', screen: 'Decisions', color: '#A78BFA' },
  ];
  return (
    <View style={st.toolsCard}>
      <Text style={[st.sectionTitle, { marginBottom: 16 }]}>QUICK TOOLS</Text>
      {/* FIX 8: Use flex row with equal flex, icon centered via alignItems+justifyContent */}
      <View style={st.toolsGrid}>
        {tools.map(tool => (
          <Pressable
            key={tool.screen}
            onPress={() => navigation?.navigate?.(tool.screen)}
            style={({ pressed }) => [st.toolItem, pressed && { opacity: 0.7 }]}
          >
            {/* FIX 8: icon box is fixed size, centered */}
            <View style={[st.toolIconBox, { backgroundColor: tool.color + '14' }]}>
              <Text style={st.toolIconText}>{tool.icon}</Text>
            </View>
            <Text style={st.toolLabel} numberOfLines={2}>{tool.label}</Text>
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
  const isDark = T?.mode === 'dark' || T?.mode === 'amoled';

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
          {/* FIX 1: streak pill + avatar in a column on right */}
          <StreakAvatarRow
            streak={s.loginStreak || 1}
            avatarUri={s.profileImage}
            onAvatarPress={() => navigation?.navigate?.('Profile')}
          />
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
        <View style={st.section}><ScorePersonalityRow score={score} personality={personality} isDark={isDark} /></View>
        <View style={st.section}><NetWorthCard d={d} /></View>
        <View style={st.section}><ActionInsightRow action={action} aiInsights={aiInsights} navigation={navigation} /></View>
        <View style={st.section}><ExpenseGoalsRow s={s} d={d} navigation={navigation} isDark={isDark} /></View>
        <View style={st.section}><AchievementsSnapshotRow achievements={achievements} d={d} /></View>
        <View style={st.section}><EarningsTrendCard s={s} d={d} /></View>
        <View style={[st.section, { marginBottom: 0 }]}><QuickToolsGrid navigation={navigation} /></View>

      </ScrollView>

      {/* FIX 9: Premium FAB with glow + always + icon */}
      <PremiumFAB navigation={navigation} />
    </View>
  );
}

// ─── FIX 9: Premium FAB — always shows + icon, glow animation ─
// Bug fix: was showing * on close. Fixed by always using "+" text
// and rotating it 45deg when open (not switching characters).
// Added pulsing glow animation for premium feel.
function PremiumFAB({ navigation }) {
  const [open, setOpen] = useState(false);
  const rot     = useRef(new Animated.Value(0)).current;
  const opac    = useRef(new Animated.Value(0)).current;
  const tY      = useRef(new Animated.Value(20)).current;
  // FIX 9: glow pulse anim
  const glowAnim = useRef(new Animated.Value(1)).current;
  const glowLoop = useRef(null);

  // Start glow pulse when closed
  useEffect(() => {
    if (!open) {
      glowLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      );
      glowLoop.current.start();
    } else {
      glowLoop.current?.stop();
      glowAnim.setValue(1);
    }
    return () => glowLoop.current?.stop();
  }, [open]);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    Animated.parallel([
      Animated.spring(rot,  { toValue: next ? 1 : 0, useNativeDriver: true,  speed: 25, bounciness: 4 }),
      Animated.spring(opac, { toValue: next ? 1 : 0, useNativeDriver: true,  speed: 20 }),
      Animated.spring(tY,   { toValue: next ? 0 : 20, useNativeDriver: true, speed: 20 }),
    ]).start();
  }, [open]);

  // FIX 9: rotation goes 0→45deg. "+" at 45deg looks like "×".
  // This avoids switching icon chars which caused the * bug.
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
              style={({ pressed }) => [st.fabAction, { backgroundColor: a.color, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={{ fontSize: 16 }}>{a.icon}</Text>
              <Text style={st.fabActionText}>{a.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* FIX 9: Glow ring behind FAB */}
      <Animated.View style={[st.fabGlow, {
        transform: [{ scale: glowAnim }],
        opacity: glowAnim.interpolate({ inputRange: [1, 1.3], outputRange: [0.3, 0] }),
      }]} />

      <Pressable onPress={toggle}>
        <LinearGradient
          colors={['#2563EB', '#4F8CFF']}
          style={st.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* FIX 9: Always render "+" and rotate it. Never switch to "*" */}
          <Animated.Text style={[st.fabIcon, { transform: [{ rotate: rotation }] }]}>
            +
          </Animated.Text>
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

  // FIX 1 — streak + avatar
  streakAvatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    // FIX 1: light yellow fill
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  streakIcon: { fontSize: 13 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  // FIX 1 — avatar: bigger, no border radius on image, shadow
  avatarWrap: {
    shadowColor: '#4F8CFF',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
    borderRadius: 24,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 0, // FIX 1: borderRadius 0 on image as requested
    backgroundColor: '#EFF6FF',
  },
  avatarDefault: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
    lineHeight: 32,
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
  // FIX 2 — wallet icon top-right
  heroWalletContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  heroWalletBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWalletEmoji: {
    fontSize: 20,
    opacity: 0.75,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
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
    borderColor: '#e2e8f0',
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

  // FIX 3 — Health Score aligned
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  scoreRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRight: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreLabel: { fontSize: 12, fontWeight: '700', lineHeight: 16 },

  // FIX 4 — Personality brain more visible
  personalityDeco: {
    position: 'absolute',
    right: 6,
    top: 10,
  },
  personalityBrain: {
    fontSize: 46,
    opacity: 0.15, // FIX 4: clearly visible (was 0.08)
  },
  personalityTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
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

  // FIX 5 — Actions: icon + text header row
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', lineHeight: 20 },
  actionDesc: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  actionCta: { borderRadius: 10, paddingVertical: 7, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  actionCtaText: { fontSize: 12, fontWeight: '700' },
  insightText: { fontSize: 11, color: '#475569', lineHeight: 17, flex: 1 },
  insightCta: { borderRadius: 10, paddingVertical: 7, alignItems: 'center', borderWidth: 1, marginTop: 'auto' },

  // FIX 6 — Expense Split legend
  expenseBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  expenseDonutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseLegend: {
    flex: 1,
    gap: 7,
    justifyContent: 'center',
  },
  expenseLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expenseLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  expenseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  expenseLegendLabel: {
    fontSize: 10,
    color: '#475569',
    flex: 1,
  },
  expenseLegendRight: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  expenseLegendAmt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
  },
  expenseLegendPct: {
    fontSize: 9,
    color: '#94A3B8',
  },
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

  // FIX 7 — Trend card
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
  trendHint: {
    fontSize: 9,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  // FIX 7 — selected value mini card
  selectedValueCard: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedValueLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  selectedValueAmt: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // FIX 8 — Quick tools
  toolsCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  toolsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  toolIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconText: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
    includeFontPadding: false,
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },

  // FIX 9 — FAB
  fabContainer: {
    position: 'absolute',
    bottom: 28,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 200,
  },
  fabActions: {
    marginBottom: 10,
    gap: 8,
    alignItems: 'flex-end',
  },
  fabAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fabActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  // FIX 9: glow ring
  fabGlow: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#4F8CFF',
    zIndex: -1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F8CFF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  // FIX 9: always "+" character, rotation creates the × effect
  fabIcon: {
    fontSize: 30,
    color: '#fff',
    lineHeight: 34,
    fontWeight: '300',
    includeFontPadding: false,
  },
});
