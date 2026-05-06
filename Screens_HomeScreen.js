// ─── GROWTH LEDGER — HOME SCREEN ─────────────────────────────────────────────
// Sections: Header · Earned Card · Health+Personality · Net Worth
//           Next Action + AI Insight · Expense Split · Financial Goals
//           Achievements · Earnings Trend · Quick Tools
// Themes: light | dark | amoled | gold

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Easing,
  TouchableOpacity, Dimensions, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Line, G } from 'react-native-svg';
import { useTheme } from './Context_ThemeContext';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW, TYPE, GOLD, FF } from './Constants_theme';

const { width: SW } = Dimensions.get('window');
const CARD_PAD = 16;
const H_PAD    = 20;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return ['Night Owl 🌙',  'Sweet dreams ahead 🌟'];
  if (h < 12) return ['Good Morning 👋', "Let's grow your wealth 🚀"];
  if (h < 17) return ['Good Afternoon ☀️', 'Keep the momentum going 💪'];
  return ['Good Evening 🌆', 'Review your day 📊'];
}

function formatINR(n) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function getMonthLabel(offset = 0) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING — animated circular progress
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScoreRing({ score, size = 56, stroke = 5, color }) {
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const anim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: score,
      duration: 1400,
      delay: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circ, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke} fill="transparent"
          rotation="-90" origin={`${size / 2},${size / 2}`}
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 16, fontWeight: '700', color, fontFamily: FF.numBold }}>
        {score}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EARNINGS SPARKLINE CHART
// ─────────────────────────────────────────────────────────────────────────────
function SparklineChart({ data, color, height = 80 }) {
  const W = SW - H_PAD * 2 - CARD_PAD * 2;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const pad = 12;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = pad + ((1 - (d.value - min) / range) * (height - pad * 2));
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `C ${(points[i-1].x + p.x)/2} ${points[i-1].y} ${(points[i-1].x + p.x)/2} ${p.y} ${p.x} ${p.y}`
  ).join(' ');

  const areaD = `${pathD} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaD} fill="url(#sparkGrad)" />
      <Path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONUT CHART — Expense split
// ─────────────────────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 100, stroke = 18 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const dashLen = (seg.pct / 100) * circ;
        const dashOff = circ - dashLen;
        const el = (
          <Circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="transparent"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dashLen} ${circ - dashLen}`}
            strokeDashoffset={circ - offset * circ / 100}
            rotation="-90"
            origin={`${size / 2},${size / 2}`}
            strokeLinecap="butt"
          />
        );
        offset += seg.pct;
        return el;
      })}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, right, colors }) {
  return (
    <View style={s.secHeader}>
      <Text style={[s.secTitle, { color: colors.text, fontFamily: FF.subheading }]}>{title}</Text>
      {right && <Text style={[s.secLink, { color: colors.accentText, fontFamily: FF.ui }]}>{right}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, style, colors, glow }) {
  return (
    <View style={[
      s.card,
      { backgroundColor: colors.bgCard, borderColor: colors.border },
      glow && (colors.isGold ? SHADOW.goldGlow : SHADOW.heroGlow),
      style,
    ]}>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ progress, color, height = 4, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(progress, 100),
      duration: 900, delay: 400, easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[{ height, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }, style]}>
      <Animated.View style={{ height, width, backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { colors, theme } = useTheme();

  const [refreshing, setRefreshing]       = useState(false);
  const [monthOffset, setMonthOffset]     = useState(0);
  const [trendPeriod, setTrendPeriod]     = useState('Monthly');
  const [streakCount]                     = useState(1);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // ── Mock data (replace with real AppContext data later) ──
  const MOCK = {
    name:          'Miraj',
    earnedMonth:   32500,
    monthProgress: 73,
    daysLogged:    22,
    daysTotal:     30,
    perDay:        1250,
    logged:        '0/26',
    lost:          32500,
    balance:       0,
    lostAlert:     '₹32,500 lost — reduce absences to maximise',
    healthScore:   65,
    personality:   'Growing',
    netWorth:      0,
    monthIncome:   0,
    assets:        0,
    debts:         0,
    totalSpent:    32500,
    needs:         { amount: 16250, pct: 50 },
    wants:         { amount: 9750,  pct: 30 },
    savings:       { amount: 6500,  pct: 20 },
    expenseInsight:'Wants spending well controlled — saving ₹0/mo extra',
    goals:         [],
    achievements:  { unlocked: 0, total: 6, next: 'Investor Badge', nextHint: 'Start a SIP to unlock' },
    snapshot:      { sip: 'None', emi: 'None', debt: 0 },
    trendYTD:      32500,
    trendData: [
      { label: 'Jan', value: 8000  },
      { label: 'Feb', value: 14000 },
      { label: 'Mar', value: 20000 },
      { label: 'Apr', value: 32500 },
    ],
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const [greeting, sub] = getGreeting();
  const accent   = colors.accent;
  const accentTx = colors.accentText;
  const isGold   = colors.isGold;

  // Gold theme uses gold accent for rings; others use standard semantic colors
  const healthColor = isGold ? GOLD.main : SEMANTIC.success;
  const trendColor  = isGold ? GOLD.main : SEMANTIC.primary;

  const EXPENSE_SEGMENTS = [
    { pct: MOCK.needs.pct,   color: isGold ? GOLD.main     : SEMANTIC.primary },
    { pct: MOCK.wants.pct,   color: isGold ? GOLD.dark     : SEMANTIC.warning },
    { pct: MOCK.savings.pct, color: isGold ? GOLD['200']   : SEMANTIC.success },
  ];

  const statusBarStyle = colors.isDark ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bg} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.greetName, { color: colors.text, fontFamily: FF.heading }]}>
                {greeting}, {MOCK.name} 👋
              </Text>
              <Text style={[s.greetSub, { color: colors.textMuted, fontFamily: FF.body }]}>
                {sub}
              </Text>
            </View>
            <View style={s.headerRight}>
              {/* Streak chip */}
              <View style={[s.streakChip, { backgroundColor: colors.streakBg, borderColor: colors.streakBorder }]}>
                <Text style={{ fontSize: 13 }}>⚡</Text>
                <Text style={[s.streakText, { color: accentTx, fontFamily: FF.ui }]}>
                  {streakCount}d streak
                </Text>
              </View>
              {/* Avatar */}
              <View style={[s.avatar, { backgroundColor: colors.accentDim, borderColor: colors.accentMid }]}>
                <Text style={{ fontSize: 20 }}>🧑‍💼</Text>
              </View>
            </View>
          </View>

          {/* ── MONTH PICKER ───────────────────────────────────────────── */}
          <View style={s.monthPicker}>
            <Text style={[s.dashTitle, { color: colors.dashTitle, fontFamily: FF.heading }]}>Dashboard</Text>
            <View style={s.monthRow}>
              <TouchableOpacity
                style={[s.monthBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => setMonthOffset(o => o - 1)}
              >
                <Text style={{ color: colors.textSub }}>‹</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={[s.monthLabel, { color: colors.text, fontFamily: FF.ui }]}>
                  {getMonthLabel(monthOffset)}
                </Text>
                <View style={s.nowDot}>
                  <View style={[s.dot, { backgroundColor: SEMANTIC.success }]} />
                  <Text style={[s.nowText, { color: SEMANTIC.successText, fontFamily: FF.ui }]}>Now</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.monthBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => setMonthOffset(o => o + 1)}
              >
                <Text style={{ color: colors.textSub }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── EARNED CARD ────────────────────────────────────────────── */}
          <View style={[s.earnedCard, { backgroundColor: colors.earnedCardBg, borderColor: colors.earnedCardBorder }]}>
            {/* Top row */}
            <View style={s.earnedTop}>
              <View>
                <Text style={[s.earnedLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>
                  EARNED THIS MONTH
                </Text>
                <Text style={[s.earnedAmt, { color: colors.text, fontFamily: FF.numBold }]}>
                  ₹{MOCK.earnedMonth.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[s.walletIcon, { backgroundColor: colors.accentDim, borderColor: colors.accentMid }]}>
                <Text style={{ fontSize: 18 }}>👛</Text>
              </View>
            </View>

            {/* Progress row */}
            <View style={s.earnedProgRow}>
              <Text style={[s.earnedProgLabel, { color: colors.textMuted, fontFamily: FF.body }]}>
                Month progress {MOCK.monthProgress}%
              </Text>
              <Text style={[s.earnedProgLabel, { color: colors.textMuted, fontFamily: FF.body }]}>
                {MOCK.daysLogged}/{MOCK.daysTotal} days
              </Text>
            </View>
            <ProgressBar progress={MOCK.monthProgress} color={accent} height={5} style={{ marginBottom: 14 }} />

            {/* Stats row */}
            <View style={s.earnedStats}>
              {[
                { label: 'Per Day',  val: `₹${MOCK.perDay.toLocaleString('en-IN')}`, color: colors.text },
                { label: 'Logged',   val: MOCK.logged,                                color: colors.text },
                { label: 'Lost',     val: `₹${MOCK.lost.toLocaleString('en-IN')}`,   color: SEMANTIC.dangerText },
                { label: 'Balance',  val: `₹${MOCK.balance}`,                         color: colors.text },
              ].map(({ label, val, color: vc }) => (
                <View key={label} style={s.earnedStat}>
                  <Text style={[s.earnedStatLabel, { color: colors.textMuted, fontFamily: FF.body }]}>{label}</Text>
                  <Text style={[s.earnedStatVal, { color: vc, fontFamily: FF.numBold }]}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Alert banner */}
            {MOCK.lost > 0 && (
              <View style={[s.alertBanner, { backgroundColor: `${SEMANTIC.warning}12`, borderColor: `${SEMANTIC.warning}25` }]}>
                <Text style={{ fontSize: 12, marginRight: 6 }}>⚠️</Text>
                <Text style={[s.alertText, { color: SEMANTIC.warningText, fontFamily: FF.body }]}>
                  {MOCK.lostAlert}
                </Text>
              </View>
            )}
          </View>

          {/* ── HEALTH + PERSONALITY ────────────────────────────────────── */}
          <View style={s.twoCol}>
            {/* Health Score */}
            <Card colors={colors} style={s.halfCard}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>HEALTH SCORE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <ScoreRing score={MOCK.healthScore} color={healthColor} />
                <View>
                  <Text style={[s.scoreTag, { color: healthColor, fontFamily: FF.ui }]}>Good 👍</Text>
                  <ProgressBar progress={MOCK.healthScore} color={healthColor} height={3} style={{ width: 70, marginTop: 6 }} />
                </View>
              </View>
            </Card>

            {/* Personality */}
            <Card colors={colors} style={s.halfCard}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>PERSONALITY</Text>
              <View style={{ marginTop: 8 }}>
                <Text style={[s.personalityVal, { color: accent, fontFamily: FF.heading }]}>
                  📈 {MOCK.personality}
                </Text>
                <Text style={[s.personalityHint, { color: colors.textMuted, fontFamily: FF.body }]}>
                  Boost your SIP now.
                </Text>
              </View>
              <View style={[s.brainIcon, { backgroundColor: colors.accentDim }]}>
                <Text style={{ fontSize: 22 }}>🧠</Text>
              </View>
            </Card>
          </View>

          {/* ── NET WORTH OVERVIEW ─────────────────────────────────────── */}
          <View style={{ marginBottom: 12 }}>
            <Card colors={colors} glow style={{ marginBottom: 0 }}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>NET WORTH OVERVIEW</Text>
              <View style={s.nwRow}>
                {/* Left: net worth */}
                <View style={s.nwLeft}>
                  <View style={[s.walletIcon2, { backgroundColor: colors.accentDim }]}>
                    <Text style={{ fontSize: 16 }}>💼</Text>
                  </View>
                  <View>
                    <Text style={[s.nwAmt, { color: accent, fontFamily: FF.numBold }]}>
                      ₹{MOCK.netWorth.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[s.nwSubLabel, { color: colors.textMuted, fontFamily: FF.body }]}>Net Worth</Text>
                  </View>
                </View>
                {/* Divider */}
                <View style={[s.nwDivider, { backgroundColor: colors.borderMid }]} />
                {/* Right: this month income */}
                <View style={s.nwRight}>
                  <Text style={[s.nwAmt, { color: accent, fontFamily: FF.numBold }]}>
                    ₹{MOCK.monthIncome.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[s.nwSubLabel, { color: colors.textMuted, fontFamily: FF.body }]}>This Month Income</Text>
                  <Text style={[s.nwSubLabel, { color: colors.textDisabled, fontFamily: FF.body, fontSize: 11 }]}>
                    0 Income sources
                  </Text>
                </View>
              </View>

              {/* Bottom stats */}
              <View style={[s.nwBottomDivider, { backgroundColor: colors.border }]} />
              <View style={s.nwStats}>
                {[
                  { label: 'Assets', val: `₹${MOCK.assets}`, color: SEMANTIC.successText },
                  { label: 'Debts',  val: `₹${MOCK.debts}`,  color: SEMANTIC.dangerText  },
                  { label: 'Net Worth', val: `₹${MOCK.netWorth}`, color: colors.text     },
                ].map(({ label, val, color: vc }, i) => (
                  <View key={label} style={[s.nwStat, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
                    <Text style={[s.nwStatLabel, { color: colors.textMuted, fontFamily: FF.body }]}>{label}</Text>
                    <Text style={[s.nwStatVal, { color: vc, fontFamily: FF.numBold }]}>{val}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          {/* ── NEXT ACTION + AI INSIGHT ───────────────────────────────── */}
          <View style={s.twoCol}>
            {/* Next Action */}
            <Card colors={colors} style={s.halfCard}>
              <View style={s.actionTop}>
                <View style={[s.actionIcon, { backgroundColor: `${SEMANTIC.success}15` }]}>
                  <Text style={{ fontSize: 14 }}>📈</Text>
                </View>
                <Text style={[s.actionChip, { color: SEMANTIC.successText, fontFamily: FF.ui }]}>NEXT ACTION</Text>
              </View>
              <Text style={[s.actionTitle, { color: colors.text, fontFamily: FF.heading }]}>
                Start a SIP today
              </Text>
              <Text style={[s.actionDesc, { color: colors.textMuted, fontFamily: FF.body }]}>
                ₹500/mo in Nifty 50 = wealth over time.
              </Text>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.accentDim, borderColor: colors.accentMid }]}>
                <Text style={[s.actionBtnText, { color: accentTx, fontFamily: FF.ui }]}>Start Now →</Text>
              </TouchableOpacity>
            </Card>

            {/* AI Insight */}
            <Card colors={colors} style={s.halfCard}>
              <View style={s.actionTop}>
                <View style={[s.actionIcon, { backgroundColor: `${accent}15` }]}>
                  <Text style={{ fontSize: 14 }}>🧠</Text>
                </View>
                <Text style={[s.actionChip, { color: accentTx, fontFamily: FF.ui }]}>AI INSIGHT</Text>
                <Text style={[s.allChip, { color: colors.textMuted, fontFamily: FF.body }]}>All (1)</Text>
              </View>
              <Text style={[s.actionDesc, { color: colors.textSub, fontFamily: FF.body, marginTop: 6 }]}>
                💡 <Text style={{ fontWeight: FONT.semibold }}>Tip:</Text> Add your salary to unlock smarter insights.
              </Text>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.accentDim, borderColor: colors.accentMid, marginTop: 10 }]}>
                <Text style={[s.actionBtnText, { color: accentTx, fontFamily: FF.ui }]}>Add Salary →</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* ── EXPENSE SPLIT + FINANCIAL GOALS ────────────────────────── */}
          <View style={s.twoCol}>
            {/* Expense Split */}
            <Card colors={colors} style={s.halfCard}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>EXPENSE SPLIT</Text>
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <DonutChart segments={EXPENSE_SEGMENTS} size={90} stroke={16} />
                  <View style={{ position: 'absolute', alignItems: 'center' }}>
                    <Text style={[s.donutAmt, { color: colors.text, fontFamily: FF.numBold }]}>
                      ₹{(MOCK.totalSpent / 1000).toFixed(1)}K
                    </Text>
                    <Text style={[s.donutSub, { color: colors.textMuted, fontFamily: FF.body }]}>Spent</Text>
                  </View>
                </View>
              </View>
              {[
                { label: 'Needs',   ...MOCK.needs,   color: EXPENSE_SEGMENTS[0].color },
                { label: 'Wants',   ...MOCK.wants,   color: EXPENSE_SEGMENTS[1].color },
                { label: 'Savings', ...MOCK.savings, color: EXPENSE_SEGMENTS[2].color },
              ].map(seg => (
                <View key={seg.label} style={s.segRow}>
                  <View style={[s.segDot, { backgroundColor: seg.color }]} />
                  <Text style={[s.segLabel, { color: colors.textSub, fontFamily: FF.body }]}>{seg.label}</Text>
                  <Text style={[s.segVal, { color: colors.text, fontFamily: FF.numBold }]}>
                    ₹{seg.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[s.segPct, { color: colors.textMuted, fontFamily: FF.body }]}>{seg.pct}%</Text>
                </View>
              ))}
              <View style={[s.expInsightBanner, { backgroundColor: `${SEMANTIC.success}10`, borderColor: `${SEMANTIC.success}20` }]}>
                <Text style={{ fontSize: 10 }}>✅ </Text>
                <Text style={[s.expInsightText, { color: SEMANTIC.successText, fontFamily: FF.body }]}>
                  {MOCK.expenseInsight}
                </Text>
              </View>
            </Card>

            {/* Financial Goals */}
            <Card colors={colors} style={s.halfCard}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>FINANCIAL GOALS</Text>
              {MOCK.goals.length === 0 ? (
                <View style={s.emptyGoals}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
                  <Text style={[s.emptyGoalsTitle, { color: colors.text, fontFamily: FF.heading }]}>No goals yet</Text>
                  <Text style={[s.emptyGoalsDesc, { color: colors.textMuted, fontFamily: FF.body }]}>
                    Set your first goal and track your progress.
                  </Text>
                  <TouchableOpacity
                    style={[s.createGoalBtn, { backgroundColor: accent }]}
                    onPress={() => navigation?.navigate?.('Goals')}
                  >
                    <Text style={[s.createGoalText, { fontFamily: FF.ui }]}>Create First Goal →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                MOCK.goals.slice(0, 3).map(g => (
                  <View key={g.id} style={s.goalItem}>
                    <Text style={{ fontSize: 14 }}>{g.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.goalName, { color: colors.text, fontFamily: FF.ui }]}>{g.name}</Text>
                      <ProgressBar progress={(g.saved / g.target) * 100} color={accent} height={3} />
                    </View>
                    <Text style={[s.goalPct, { color: accentTx, fontFamily: FF.numBold }]}>
                      {Math.round((g.saved / g.target) * 100)}%
                    </Text>
                  </View>
                ))
              )}
            </Card>
          </View>

          {/* ── ACHIEVEMENTS + FINANCIAL SNAPSHOT ──────────────────────── */}
          <View style={s.twoCol}>
            {/* Achievements */}
            <Card colors={colors} style={s.halfCard}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>ACHIEVEMENTS</Text>
              <Text style={[s.achieveNext, { color: accentTx, fontFamily: FF.ui }]}>
                🏆 Next: {MOCK.achievements.next}
              </Text>
              <Text style={[s.achieveHint, { color: colors.textMuted, fontFamily: FF.body }]}>
                {MOCK.achievements.nextHint}
              </Text>
              <View style={s.badgeRow}>
                {['🥉','🥈','🥇','👑'].map((b, i) => (
                  <View key={i} style={[s.badge, {
                    backgroundColor: i < MOCK.achievements.unlocked ? colors.accentDim : colors.bgInput,
                    borderColor: i < MOCK.achievements.unlocked ? colors.accentMid : colors.border,
                  }]}>
                    <Text style={{ fontSize: 14, opacity: i < MOCK.achievements.unlocked ? 1 : 0.3 }}>{b}</Text>
                  </View>
                ))}
              </View>
              <View style={s.achieveProgRow}>
                <Text style={[s.achieveProgLabel, { color: colors.textMuted, fontFamily: FF.body }]}>
                  {MOCK.achievements.unlocked}/{MOCK.achievements.total} unlocked
                </Text>
              </View>
              <ProgressBar
                progress={(MOCK.achievements.unlocked / MOCK.achievements.total) * 100}
                color={accent} height={3}
              />
            </Card>

            {/* Financial Snapshot */}
            <Card colors={colors} style={s.halfCard}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>FINANCIAL SNAPSHOT</Text>
              {[
                { label: 'SIP',  val: MOCK.snapshot.sip },
                { label: 'EMI',  val: MOCK.snapshot.emi },
                { label: 'Debt', val: `₹${MOCK.snapshot.debt}` },
              ].map(item => (
                <View key={item.label} style={s.snapshotRow}>
                  <Text style={[s.snapshotLabel, { color: colors.textMuted, fontFamily: FF.body }]}>{item.label}</Text>
                  <Text style={[s.snapshotVal, { color: accent, fontFamily: FF.numBold }]}>{item.val}</Text>
                </View>
              ))}
            </Card>
          </View>

          {/* ── EARNINGS TREND ──────────────────────────────────────────── */}
          <Card colors={colors} style={{ marginBottom: 12 }}>
            <View style={s.trendHeader}>
              <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>EARNINGS TREND</Text>
              <View style={s.trendRight}>
                <Text style={[s.trendYTD, { color: trendColor, fontFamily: FF.numBold }]}>
                  {formatINR(MOCK.trendYTD)} YTD
                </Text>
                <View style={s.trendToggle}>
                  {['Monthly', 'Weekly'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[s.trendToggleBtn, trendPeriod === p && { backgroundColor: accent }]}
                      onPress={() => setTrendPeriod(p)}
                    >
                      <Text style={[s.trendToggleText, {
                        color: trendPeriod === p ? '#fff' : colors.textMuted,
                        fontFamily: FF.ui,
                      }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <SparklineChart data={MOCK.trendData} color={trendColor} height={80} />

            <View style={s.trendLabels}>
              {MOCK.trendData.map(d => (
                <Text key={d.label} style={[s.trendLabel, { color: colors.textMuted, fontFamily: FF.body }]}>
                  {d.label}
                </Text>
              ))}
            </View>

            <View style={{ marginTop: 6 }}>
              <Text style={[s.trendCurrent, { color: colors.textMuted, fontFamily: FF.body }]}>
                {getMonthLabel(monthOffset)}
              </Text>
              <Text style={[s.trendCurrentVal, { color: colors.text, fontFamily: FF.numBold }]}>
                ₹{MOCK.earnedMonth.toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>

          {/* ── QUICK TOOLS ─────────────────────────────────────────────── */}
          <Card colors={colors} style={{ marginBottom: 12 }}>
            <Text style={[s.cardLabel, { color: colors.textMuted, fontFamily: FF.ui }]}>QUICK TOOLS</Text>
            <View style={s.quickTools}>
              {[
                { icon: '🎯', label: 'Goal Planner',  screen: 'Goals'      },
                { icon: '📊', label: 'Simulator',     screen: 'Simulator'  },
                { icon: '💸', label: 'Cash Flow',     screen: 'CashFlow'   },
                { icon: '🧠', label: 'AI Decisions',  screen: 'Decisions'  },
              ].map(tool => (
                <TouchableOpacity
                  key={tool.label}
                  style={s.quickTool}
                  onPress={() => navigation?.navigate?.(tool.screen)}
                  activeOpacity={0.75}
                >
                  <View style={[s.quickToolIcon, { backgroundColor: colors.accentDim, borderColor: colors.accentMid }]}>
                    <Text style={{ fontSize: 20 }}>{tool.icon}</Text>
                  </View>
                  <Text style={[s.quickToolLabel, { color: colors.textSub, fontFamily: FF.body }]}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:            { flex: 1 },
  scroll:          { paddingHorizontal: H_PAD, paddingTop: 8 },

  // Header
  header:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  greetName:       { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  greetSub:        { fontSize: 12, marginTop: 2 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  streakText:      { fontSize: 12, fontWeight: '600' },
  avatar:          { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Month Picker
  monthPicker:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dashTitle:       { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  monthRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthBtn:        { width: 30, height: 30, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthLabel:      { fontSize: 13, fontWeight: '600' },
  nowDot:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot:             { width: 6, height: 6, borderRadius: 3 },
  nowText:         { fontSize: 10, fontWeight: '600' },

  // Earned Card
  earnedCard:      { borderRadius: RADIUS.xl, borderWidth: 1, padding: CARD_PAD, marginBottom: 12, ...SHADOW.card },
  earnedTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  earnedLabel:     { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  earnedAmt:       { fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  walletIcon:      { width: 40, height: 40, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  earnedProgRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  earnedProgLabel: { fontSize: 11 },
  earnedStats:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  earnedStat:      { alignItems: 'flex-start' },
  earnedStatLabel: { fontSize: 10, marginBottom: 3 },
  earnedStatVal:   { fontSize: 14, fontWeight: '700' },
  alertBanner:     { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, padding: 8 },
  alertText:       { fontSize: 11, flex: 1 },

  // Card
  card:            { borderRadius: RADIUS.xl, borderWidth: 1, padding: CARD_PAD, marginBottom: 12, ...SHADOW.card },
  cardLabel:       { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  secHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  secTitle:        { fontSize: 15, fontWeight: '700' },
  secLink:         { fontSize: 11, fontWeight: '600' },

  // Two Col
  twoCol:          { flexDirection: 'row', gap: 10, marginBottom: 0 },
  halfCard:        { flex: 1, minWidth: 0, marginBottom: 12 },

  // Health Score
  scoreTag:        { fontSize: 13, fontWeight: '700' },

  // Personality
  personalityVal:  { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  personalityHint: { fontSize: 11 },
  brainIcon:       { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },

  // Net Worth
  nwRow:           { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 12, gap: 0 },
  nwLeft:          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nwRight:         { flex: 1, paddingLeft: 14 },
  nwDivider:       { width: 1, height: 48, marginRight: 0 },
  nwAmt:           { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  nwSubLabel:      { fontSize: 11, marginTop: 2 },
  walletIcon2:     { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  nwBottomDivider: { height: 1, marginBottom: 10 },
  nwStats:         { flexDirection: 'row' },
  nwStat:          { flex: 1, alignItems: 'center', paddingVertical: 4 },
  nwStatLabel:     { fontSize: 10, marginBottom: 3 },
  nwStatVal:       { fontSize: 13, fontWeight: '700' },

  // Action cards
  actionTop:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  actionIcon:      { width: 26, height: 26, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  actionChip:      { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  allChip:         { fontSize: 9, marginLeft: 'auto' },
  actionTitle:     { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  actionDesc:      { fontSize: 11, lineHeight: 16 },
  actionBtn:       { borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 7, alignItems: 'center', marginTop: 10 },
  actionBtnText:   { fontSize: 11, fontWeight: '600' },

  // Expense Split
  donutAmt:        { fontSize: 13, fontWeight: '700' },
  donutSub:        { fontSize: 9 },
  segRow:          { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  segDot:          { width: 7, height: 7, borderRadius: 4 },
  segLabel:        { flex: 1, fontSize: 10 },
  segVal:          { fontSize: 11, fontWeight: '600' },
  segPct:          { fontSize: 10, width: 28, textAlign: 'right' },
  expInsightBanner: { flexDirection: 'row', borderRadius: RADIUS.sm, borderWidth: 1, padding: 6, marginTop: 8, alignItems: 'flex-start' },
  expInsightText:  { fontSize: 10, flex: 1, lineHeight: 14 },

  // Goals
  emptyGoals:      { alignItems: 'center', paddingVertical: 10 },
  emptyGoalsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  emptyGoalsDesc:  { fontSize: 10, textAlign: 'center', marginBottom: 10, lineHeight: 15 },
  createGoalBtn:   { borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12 },
  createGoalText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  goalItem:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  goalName:        { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  goalPct:         { fontSize: 12, fontWeight: '700', width: 34, textAlign: 'right' },

  // Achievements
  achieveNext:     { fontSize: 11, fontWeight: '700', marginTop: 6, marginBottom: 2 },
  achieveHint:     { fontSize: 10, marginBottom: 8 },
  badgeRow:        { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge:           { width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achieveProgRow:  { marginBottom: 4 },
  achieveProgLabel: { fontSize: 10 },

  // Snapshot
  snapshotRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  snapshotLabel:   { fontSize: 12 },
  snapshotVal:     { fontSize: 14, fontWeight: '700' },

  // Trend
  trendHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  trendRight:      { alignItems: 'flex-end', gap: 6 },
  trendYTD:        { fontSize: 14, fontWeight: '700' },
  trendToggle:     { flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  trendToggleBtn:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md },
  trendToggleText: { fontSize: 10, fontWeight: '600' },
  trendLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trendLabel:      { fontSize: 10 },
  trendCurrent:    { fontSize: 10, marginBottom: 2 },
  trendCurrentVal: { fontSize: 15, fontWeight: '700' },

  // Quick Tools
  quickTools:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  quickTool:       { alignItems: 'center', gap: 6 },
  quickToolIcon:   { width: 52, height: 52, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickToolLabel:  { fontSize: 10, textAlign: 'center', lineHeight: 14 },
});
