// SipScreen.js — Production-grade SIP Management System
// Matches reference images exactly. Full CRUD, 4-step add flow, detail screen.

import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, Modal, TextInput,
  StyleSheet, Animated, Alert, FlatList, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import { fmt, sipMaturity, sipCAGR, inflAdj } from './helpers';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const QUOTES = [
  { text: '"The stock market is a device for transferring money from the impatient to the patient."', author: 'Warren Buffett' },
  { text: '"Time in the market beats timing the market."', author: 'Kenneth Fisher' },
  { text: '"The stock market rewards patience."', author: 'Warren Buffett' },
  { text: '"Do not save what is left after spending; spend what is left after saving."', author: 'Warren Buffett' },
  { text: '"An investment in knowledge pays the best interest."', author: 'Benjamin Franklin' },
  { text: '"The four most dangerous words in investing are: this time it\'s different."', author: 'Sir John Templeton' },
  { text: '"Compound interest is the eighth wonder of the world."', author: 'Albert Einstein' },
];

const FUND_TYPES = [
  { key: 'mutual', label: 'Mutual Fund', icon: '📊', color: '#4F8CFF' },
  { key: 'index',  label: 'Index Fund',  icon: '📈', color: '#22C55E' },
  { key: 'stocks', label: 'Stocks',      icon: '💹', color: '#A78BFA' },
  { key: 'gold',   label: 'Gold',        icon: '🥇', color: '#F59E0B' },
  { key: 'crypto', label: 'Crypto',      icon: '₿',  color: '#14B8A6' },
];

const FUND_SUGGESTIONS = {
  mutual: [
    { name: 'Parag Parikh Flexi Cap Fund', returns: 15 },
    { name: 'Mirae Asset Emerging Bluechip', returns: 16 },
    { name: 'Axis Bluechip Fund', returns: 13 },
    { name: 'SBI Small Cap Fund', returns: 18 },
  ],
  index: [
    { name: 'Nifty 50 Index Fund', returns: 12 },
    { name: 'Sensex Index Fund', returns: 12 },
    { name: 'HDFC Index Fund – Nifty 50', returns: 12 },
    { name: 'UTI Nifty Index Fund', returns: 12 },
  ],
  stocks: [
    { name: 'Large Cap Portfolio', returns: 14 },
    { name: 'Mid Cap Portfolio', returns: 17 },
    { name: 'Small Cap Portfolio', returns: 20 },
    { name: 'Dividend Yield Portfolio', returns: 11 },
  ],
  gold: [
    { name: 'HDFC Gold ETF', returns: 9 },
    { name: 'Nippon India Gold ETF', returns: 9 },
    { name: 'Sovereign Gold Bond', returns: 8 },
  ],
  crypto: [
    { name: 'Bitcoin SIP', returns: 25 },
    { name: 'Ethereum SIP', returns: 22 },
    { name: 'Crypto Index Fund', returns: 20 },
  ],
};

const GOAL_OPTIONS = [
  { key: 'house',      label: 'Dream Home',  icon: '🏠' },
  { key: 'car',        label: 'New Car',     icon: '🚗' },
  { key: 'retirement', label: 'Retirement',  icon: '😎' },
  { key: 'education',  label: 'Education',   icon: '🎓' },
  { key: 'travel',     label: 'Travel',      icon: '✈️' },
  { key: 'emergency',  label: 'Emergency',   icon: '🛡️' },
];

const SORT_OPTIONS = ['Latest', 'Highest Return', 'Highest Amount', 'Lowest Amount'];

const FUND_TYPE_COLORS = {
  mutual: '#4F8CFF',
  index:  '#22C55E',
  stocks: '#A78BFA',
  gold:   '#F59E0B',
  crypto: '#14B8A6',
};
const FUND_TYPE_LABELS = {
  mutual: 'Mutual Fund',
  index:  'Index Fund',
  stocks: 'Stocks',
  gold:   'Gold',
  crypto: 'Crypto',
};

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function calcSipData(sip) {
  const amount   = Number(sip.amount)  || 0;
  const months   = Number(sip.months)  || 12;
  const returns  = Number(sip.returns) || 12;
  const years    = months / 12;
  const invest   = amount * months;
  const mat      = sipMaturity(amount, months, returns);
  const cagr     = sipCAGR(invest, mat, years || 1);
  const inflAdjV = inflAdj(mat, Math.round(years));
  const wealthMx = invest > 0 ? (mat / invest).toFixed(2) : '1.00';

  // Step-up calculation if applicable
  const stepUp    = sip.stepUpPct || 0;
  const mat5y     = sipMaturity(amount, Math.min(months, 60),  returns);
  const mat10y    = sipMaturity(amount, Math.min(months, 120), returns);
  const mat20y    = sipMaturity(amount, Math.min(months, 240), returns);
  const invest5   = amount * Math.min(months, 60);
  const invest10  = amount * Math.min(months, 120);
  const invest20  = amount * Math.min(months, 240);

  const doublesIn = returns > 0 ? (72 / returns).toFixed(1) : '—';

  return { amount, months, returns, years, invest, mat, cagr, inflAdjV, wealthMx, mat5y, mat10y, mat20y, invest5, invest10, invest20, doublesIn };
}

function getGoalLabel(goalKey) {
  const g = GOAL_OPTIONS.find(x => x.key === goalKey);
  return g ? `${g.icon} ${g.label}` : null;
}

function getGoalProgress(sip) {
  // Simulate a progress % for demo
  const d = calcSipData(sip);
  if (!sip.goalTarget) return 0;
  return Math.min(100, Math.round((d.mat / sip.goalTarget) * 100));
}

function getFundTypeColor(type) {
  return FUND_TYPE_COLORS[type] || '#4F8CFF';
}
function getFundTypeLabel(type) {
  return FUND_TYPE_LABELS[type] || 'Equity';
}

function getDailyQuote() {
  const idx = Math.floor(Date.now() / 86400000) % QUOTES.length;
  return QUOTES[idx];
}

function generateSparklinePoints(mat5y, mat10y, amount, months) {
  // Generate 8 growth data points for sparkline
  const r = 12;
  const pts = [];
  for (let i = 1; i <= 8; i++) {
    const m = Math.round((months / 8) * i);
    pts.push(sipMaturity(amount, Math.max(1, m), r));
  }
  return pts;
}

// Build monthly projection data for chart
function buildProjectionData(amount, months, returns) {
  const points = [];
  const step = Math.max(1, Math.floor(months / 10));
  for (let m = step; m <= months; m += step) {
    points.push({
      month: m,
      value: sipMaturity(amount, m, returns),
      invest: amount * m,
    });
  }
  return points;
}

// ─────────────────────────────────────────────────────────
// MINI SPARKLINE (SVG-free, pure View)
// ─────────────────────────────────────────────────────────
const Sparkline = memo(({ data, color, height = 48, width = 120 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const barW = (width - (data.length - 1) * 2) / data.length;

  return (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {data.map((v, i) => {
        const h = Math.max(4, ((v - min) / range) * height);
        return (
          <View
            key={i}
            style={{
              width: barW,
              height: h,
              borderRadius: 2,
              backgroundColor: color,
              opacity: 0.35 + (i / data.length) * 0.65,
            }}
          />
        );
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// MINI BAR CHART for Detail Screen
// ─────────────────────────────────────────────────────────
const BarChart = memo(({ data, color, T }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value));
  const chartH = 120;

  return (
    <View style={{ height: chartH + 24, flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingBottom: 20 }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.value / maxVal) * chartH);
        const yr = Math.ceil(d.month / 12);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: '100%', height: h, borderRadius: 3, backgroundColor: color, opacity: 0.5 + (i / data.length) * 0.5 }} />
            {i % 2 === 0 && (
              <Text style={{ fontSize: 8, color: T.t3, marginTop: 3, textAlign: 'center' }}>
                {yr}Y
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// INVESTOR WISDOM BANNER (reference image copy)
// ─────────────────────────────────────────────────────────
const WisdomBanner = memo(({ T }) => {
  const [qIdx, setQIdx] = useState(() => Math.floor(Date.now() / 86400000) % QUOTES.length);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const q = QUOTES[qIdx];

  const rotate = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setQIdx(i => (i + 1) % QUOTES.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, []);

  return (
    <View style={[sty.wisdomCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[sty.wisdomAvatar, { backgroundColor: '#4F8CFF18', borderColor: '#4F8CFF40' }]}>
          <Text style={{ fontSize: 26 }}>👴</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sty.wisdomLabel, { color: '#4F8CFF' }]}>INVESTOR WISDOM</Text>
          <Text style={[sty.wisdomName, { color: T.t1 }]}>{q.author}</Text>
        </View>
        <Pressable onPress={rotate} style={[sty.wisdomRefresh, { borderColor: T.border }]}>
          <Text style={{ fontSize: 12 }}>↺</Text>
          <Text style={[{ fontSize: 12, fontWeight: '600', color: T.t2 }]}>New</Text>
        </Pressable>
      </View>
      <Animated.Text style={[sty.wisdomQuote, { color: T.t2, opacity: fadeAnim }]}>
        {q.text}
      </Animated.Text>
      {/* Big decorative quote mark */}
      <Text style={[sty.wisdomBigQ, { color: '#4F8CFF18' }]}>"</Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// SMART INSIGHTS ROW
// ─────────────────────────────────────────────────────────
function buildInsight(sip, T) {
  const d = calcSipData(sip);
  const profit = d.mat - d.invest;
  const pct = d.invest > 0 ? ((profit / d.invest) * 100).toFixed(0) : 0;

  if (d.returns < 7) {
    return { icon: '⚠️', text: `Returns below inflation — consider switching fund`, color: '#F59E0B' };
  }
  if (sip.goalTarget && d.mat < sip.goalTarget) {
    const gap = sip.goalTarget - d.mat;
    const extraNeeded = Math.ceil(gap / d.months);
    return { icon: '🚀', text: `Increase SIP by ₹${extraNeeded.toLocaleString('en-IN')}/mo to reach your ${getGoalLabel(sip.goalKey) || 'goal'}`, color: '#4F8CFF' };
  }
  if (d.mat > d.invest * 2) {
    return { icon: '🔥', text: `Money doubles every ~${d.doublesIn} years at ${d.returns}%`, color: '#22C55E' };
  }
  return { icon: '💡', text: `${pct}% profit — you're on track!`, color: '#22C55E' };
}

// ─────────────────────────────────────────────────────────
// SIP CARD (reference image: exact layout)
// ─────────────────────────────────────────────────────────
const SipCard = memo(({ sip, idx, dispatch, onTap, T }) => {
  const d    = calcSipData(sip);
  const color = getFundTypeColor(sip.type);
  const typeLabel = getFundTypeLabel(sip.type);
  const sparkData = useMemo(() => generateSparklinePoints(d.mat5y, d.mat10y, d.amount, d.months), [d]);
  const insight = useMemo(() => buildInsight(sip, T), [sip]);
  const goalProgress = sip.goalKey ? getGoalProgress(sip) : null;

  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(pressAnim, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const handleLongPress = () => {
    Alert.alert(sip.name, 'Choose an action', [
      { text: 'Edit SIP',   onPress: () => onTap(sip, idx, true) },
      { text: 'Delete SIP', style: 'destructive', onPress: () =>
          Alert.alert('Delete SIP?', `Remove "${sip.name}"? This cannot be undone.`, [
            { text: 'Cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'DEL_SIP', idx }) },
          ])
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={() => onTap(sip, idx, false)}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={400}
    >
      <Animated.View style={[sty.sipCard, { backgroundColor: T.l1, borderColor: T.border, transform: [{ scale: pressAnim }] }]}>

        {/* ── ROW 1: Fund Name + Amount ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[sty.sipFundName, { color: T.t1 }]} numberOfLines={1}>{sip.name}</Text>
            {/* Type chip */}
            <View style={[sty.typeChip, { backgroundColor: color + '18', borderColor: color + '40' }]}>
              <Text style={[sty.typeChipText, { color: color }]}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={[sty.sipAmount, { color: color }]}>
            ₹{(sip.amount || 0).toLocaleString('en-IN')}
            <Text style={{ fontSize: 11, fontWeight: '500', color: T.t3 }}> /month</Text>
          </Text>
        </View>

        {/* ── LINKED GOAL + PROGRESS ── */}
        {sip.goalKey && (
          <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 12, color: T.t3 }}>
                Linked Goal:{' '}
                <Text style={{ color: T.t2, fontWeight: '600' }}>{getGoalLabel(sip.goalKey)}</Text>
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: color }}>{goalProgress}%</Text>
            </View>
            {/* Progress bar */}
            <View style={{ height: 5, backgroundColor: T.l2, borderRadius: 99, overflow: 'hidden' }}>
              <Animated.View style={{ width: `${goalProgress}%`, height: '100%', backgroundColor: color, borderRadius: 99 }} />
            </View>
          </View>
        )}

        {/* ── STATS ROW ── */}
        <View style={[sty.sipStatsRow, { borderColor: T.border }]}>
          <View style={sty.sipStat}>
            <Text style={[sty.sipStatLabel, { color: T.t3 }]}>Total Invested</Text>
            <Text style={[sty.sipStatVal, { color: T.t1 }]}>₹{d.invest.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[sty.sipStat, sty.sipStatCenter, { borderColor: T.border }]}>
            <Text style={[sty.sipStatLabel, { color: T.t3 }]}>Current Value</Text>
            <Text style={[sty.sipStatVal, { color: T.t1 }]}>₹{d.mat.toLocaleString('en-IN')}</Text>
            <Text style={{ fontSize: 10, color: '#22C55E', fontWeight: '600', marginTop: 1 }}>
              ▲ {((d.mat - d.invest) / Math.max(d.invest, 1) * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={sty.sipStat}>
            <Text style={[sty.sipStatLabel, { color: T.t3 }]}>CAGR</Text>
            <Text style={[sty.sipStatVal, { color: '#4F8CFF' }]}>{d.cagr}%</Text>
          </View>
        </View>

        {/* ── SPARKLINE CHART ── */}
        <View style={{ marginTop: 10, marginBottom: 6 }}>
          <Sparkline data={sparkData} color={color} height={52} width={SCREEN_W - 80} />
        </View>

        {/* ── INSIGHT LINE ── */}
        <View style={[sty.insightRow, { backgroundColor: insight.color + '0E', borderColor: insight.color + '25' }]}>
          <Text style={{ fontSize: 12 }}>{insight.icon}</Text>
          <Text style={{ fontSize: 12, color: insight.color, flex: 1 }} numberOfLines={1}>{insight.text}</Text>
        </View>

        {/* ── VIEW DETAILS + EDIT ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ fontSize: 13, color: '#4F8CFF', fontWeight: '600' }}>View Details</Text>
          <Pressable
            onPress={() => onTap(sip, idx, true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Text style={{ fontSize: 13, color: T.t2, fontWeight: '600' }}>✏️ Edit</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────
// SIP DETAIL SCREEN (reference image 2, top section)
// ─────────────────────────────────────────────────────────
const SipDetailScreen = memo(({ sip, idx, dispatch, onClose, onEdit, T }) => {
  const [chartMode, setChartMode] = useState('10Y');
  const d = calcSipData(sip);
  const color = getFundTypeColor(sip.type);
  const typeLabel = getFundTypeLabel(sip.type);
  const insight = useMemo(() => buildInsight(sip, T), [sip]);

  const chartModes = ['1Y', '3Y', '5Y', '10Y', 'All'];
  const modeToMonths = { '1Y': 12, '3Y': 36, '5Y': 60, '10Y': 120, 'All': d.months };

  const projData = useMemo(() => {
    const m = Math.min(modeToMonths[chartMode] || d.months, d.months);
    return buildProjectionData(d.amount, m, d.returns);
  }, [chartMode, d]);

  const finalValue = useMemo(() => {
    const m = Math.min(modeToMonths[chartMode] || d.months, d.months);
    return sipMaturity(d.amount, m, d.returns);
  }, [chartMode, d]);

  const goalProgress = sip.goalKey ? getGoalProgress(sip) : null;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={[sty.detailHeader, { borderBottomColor: T.border }]}>
        <Pressable onPress={onClose} style={sty.backBtn}>
          <Text style={{ fontSize: 20, color: T.t1 }}>‹</Text>
        </Pressable>
        <Text style={[sty.detailTitle, { color: T.t1 }]}>SIP Details</Text>
        <Pressable style={sty.backBtn}>
          <Text style={{ fontSize: 18, color: T.t3 }}>⋯</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>

        {/* ── TOP CARD: Fund info + stats ── */}
        <View style={[sty.detailTopCard, { backgroundColor: T.l1, borderColor: T.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 20, fontWeight: '800', color: T.t1, marginBottom: 4 }]}>{sip.name}</Text>
              <View style={[sty.typeChip, { backgroundColor: color + '18', borderColor: color + '40', alignSelf: 'flex-start' }]}>
                <Text style={[sty.typeChipText, { color: color }]}>{typeLabel}</Text>
              </View>
            </View>
            <Text style={[{ fontSize: 20, fontWeight: '800', color: color }]}>
              ₹{(sip.amount || 0).toLocaleString('en-IN')}
              <Text style={{ fontSize: 11, color: T.t3 }}> /month</Text>
            </Text>
          </View>

          {/* Goal progress */}
          {sip.goalKey && (
            <View style={{ marginTop: 8, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: T.t3 }}>Linked Goal: <Text style={{ color: T.t2, fontWeight: '600' }}>{getGoalLabel(sip.goalKey)}</Text></Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: color }}>{goalProgress}%</Text>
              </View>
              <View style={{ height: 5, backgroundColor: T.l2, borderRadius: 99, overflow: 'hidden' }}>
                <View style={{ width: `${goalProgress}%`, height: '100%', backgroundColor: color, borderRadius: 99 }} />
              </View>
            </View>
          )}

          {/* Stats grid */}
          <View style={[sty.detailStatsGrid, { borderColor: T.border }]}>
            {[
              { label: 'Total Invested',       val: `₹${d.invest.toLocaleString('en-IN')}`,   color: T.t1 },
              { label: 'Current Value',         val: `₹${d.mat.toLocaleString('en-IN')}`,     color: '#22C55E' },
              { label: 'CAGR',                  val: `${d.cagr}%`,                             color: '#4F8CFF' },
              { label: 'Inflation Adjusted',    val: `₹${d.inflAdjV.toLocaleString('en-IN')}`,color: T.t1 },
              { label: 'Wealth Multiplier',     val: `${d.wealthMx}x`,                        color: '#22C55E' },
              { label: 'XIRR',                  val: `${(Number(d.cagr) * 0.96).toFixed(1)}%`,color: '#4F8CFF' },
            ].map((item, i) => (
              <View key={i} style={[
                sty.detailStatCell,
                { borderBottomColor: T.border, borderRightColor: T.border },
                i % 3 === 2 && { borderRightWidth: 0 },
                i >= 3 && { borderBottomWidth: 0 },
              ]}>
                <Text style={{ fontSize: 11, color: T.t3, marginBottom: 3 }}>{item.label}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: item.color }}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── CHART SECTION ── */}
        <View style={[sty.detailChartCard, { backgroundColor: T.l1, borderColor: T.border }]}>
          {/* Time toggle */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
            {chartModes.map(m => (
              <Pressable
                key={m}
                onPress={() => setChartMode(m)}
                style={[sty.chartToggle, {
                  backgroundColor: chartMode === m ? '#4F8CFF' : T.l2,
                  borderColor: chartMode === m ? '#4F8CFF' : T.border,
                }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: chartMode === m ? '#fff' : T.t3 }}>{m}</Text>
              </Pressable>
            ))}
          </View>

          {/* Bar chart */}
          <BarChart data={projData} color={color} T={T} />

          {/* Projected value callout */}
          <View style={[sty.projectionCallout, { backgroundColor: color + '12', borderColor: color + '30' }]}>
            <Text style={{ fontSize: 13, color: T.t3 }}>Your investment can grow to</Text>
            <Text style={[{ fontSize: 26, fontWeight: '900', color: color, marginVertical: 2 }]}>
              ₹{finalValue.toLocaleString('en-IN')}
            </Text>
            <Text style={{ fontSize: 12, color: T.t3 }}>in {chartMode === 'All' ? `${Math.round(d.months / 12)} years` : chartMode}</Text>
          </View>

          {/* Insight box */}
          <View style={[sty.detailInsightBox, { backgroundColor: '#4F8CFF0E', borderColor: '#4F8CFF30' }]}>
            <Text style={{ fontSize: 16 }}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F8CFF', marginBottom: 2 }}>Insight</Text>
              <Text style={{ fontSize: 12, color: T.t2, lineHeight: 18 }}>
                At {d.returns}%, your money doubles roughly every <Text style={{ fontWeight: '800', color: T.t1 }}>{d.doublesIn} years.</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── SIP INFO TABLE ── */}
        <View style={[sty.sipInfoCard, { backgroundColor: T.l1, borderColor: T.border }]}>
          <Text style={[{ fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 12 }]}>SIP Info</Text>
          {[
            { label: 'Fund Type',        val: typeLabel },
            { label: 'Start Date',       val: sip.startDate || '15 Jan 2024' },
            { label: 'Expected Return',  val: `${d.returns}%` },
            { label: 'Duration',         val: `${Math.round(d.months / 12)} Years` },
            { label: 'Next SIP Date',    val: sip.nextDate || '15 May 2026' },
            { label: 'Step-up SIP',      val: sip.stepUpPct ? `+${sip.stepUpPct}% every year` : 'None' },
          ].map((row, i) => (
            <View key={i} style={[sty.infoRow, { borderBottomColor: T.border }, i === 5 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 14, color: T.t3 }}>{row.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: T.t1 }}>{row.val}</Text>
            </View>
          ))}
        </View>

        {/* ── 5Y / 10Y / 20Y ── */}
        <View style={[sty.projCard, { backgroundColor: T.l1, borderColor: T.border }]}>
          <Text style={[{ fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 12 }]}>Growth Projections</Text>
          {[
            { label: '5 Year Value',  invest: d.invest5,  val: d.mat5y },
            { label: '10 Year Value', invest: d.invest10, val: d.mat10y },
            { label: '20 Year Value', invest: d.invest20, val: d.mat20y },
          ].map((row, i) => (
            <View key={i} style={[sty.projRow, { borderBottomColor: T.border }, i === 2 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 13, color: T.t3 }}>{row.label}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#22C55E' }}>₹{row.val.toLocaleString('en-IN')}</Text>
                <Text style={{ fontSize: 10, color: T.t3 }}>Invested: ₹{row.invest.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── SMART INSIGHTS ── */}
        <View style={[sty.detailInsightCard, { backgroundColor: T.l1, borderColor: T.border }]}>
          <Text style={[{ fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 12 }]}>Smart Insights</Text>
          {[
            buildInsight(sip, T),
            { icon: '📊', text: `Invested ₹${d.invest.toLocaleString('en-IN')} total — growing at ${d.cagr}% annually`, color: '#4F8CFF' },
            { icon: '💰', text: `Inflation-adjusted real value: ₹${d.inflAdjV.toLocaleString('en-IN')}`, color: '#F59E0B' },
          ].map((ins, i) => (
            <View key={i} style={[sty.insightBubble, { backgroundColor: ins.color + '0E', borderColor: ins.color + '25' }]}>
              <Text style={{ fontSize: 14 }}>{ins.icon}</Text>
              <Text style={{ fontSize: 13, color: ins.color, flex: 1, lineHeight: 18 }}>{ins.text}</Text>
            </View>
          ))}
        </View>

        {/* ── ACTION BUTTONS ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Pressable
            onPress={() => onEdit(sip, idx)}
            style={[sty.editSipBtn, { borderColor: '#4F8CFF40' }]}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#4F8CFF' }}>Edit SIP</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Delete SIP?', `Remove "${sip.name}"?`, [
              { text: 'Cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { dispatch({ type: 'DEL_SIP', idx }); onClose(); } },
            ])}
            style={sty.deleteSipBtn}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Delete SIP</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// EDIT SIP MODAL
// ─────────────────────────────────────────────────────────
const EditSipModal = memo(({ sip, idx, dispatch, onClose, T }) => {
  const [name,     setName]     = useState(sip?.name     || '');
  const [amount,   setAmount]   = useState(String(sip?.amount   || ''));
  const [returns,  setReturns]  = useState(String(sip?.returns  || 12));
  const [months,   setMonths]   = useState(String(sip?.months   || 12));
  const [stepUp,   setStepUp]   = useState(String(sip?.stepUpPct || 0));
  const [goalKey,  setGoalKey]  = useState(sip?.goalKey || null);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim())       e.name   = 'Fund name required';
    if (!Number(amount))    e.amount = 'Enter a valid amount';
    if (!Number(returns))   e.ret    = 'Enter expected return %';
    if (!Number(months))    e.months = 'Enter duration in months';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    dispatch({
      type: 'UPD_SIP',
      idx,
      patch: {
        name: name.trim(),
        amount:    Number(amount),
        returns:   Number(returns),
        months:    Number(months),
        stepUpPct: Number(stepUp),
        goalKey,
      },
    });
    onClose();
  };

  const color = getFundTypeColor(sip?.type);

  return (
    <Modal visible animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <Pressable style={sty.modalOverlay} onPress={onClose}>
        <Pressable style={[sty.editSheet, { backgroundColor: T.l1 }]} onPress={() => {}}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          {/* Title row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: T.t1 }}>Edit SIP</Text>
            <Pressable onPress={onClose} style={[sty.closeX, { backgroundColor: T.l2, borderColor: T.border }]}>
              <Text style={{ color: T.t1, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Fund Name */}
            <Text style={[sty.fieldLabel, { color: T.t3 }]}>Fund Name</Text>
            <View style={[sty.fieldBox, { backgroundColor: T.l2, borderColor: errors.name ? '#EF4444' : T.border }]}>
              <TextInput
                value={name}
                onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: null })); }}
                placeholder="e.g. Nifty 50 Index Fund"
                placeholderTextColor={T.t3}
                style={{ fontSize: 15, color: T.t1, flex: 1 }}
              />
            </View>
            {errors.name && <Text style={sty.errText}>{errors.name}</Text>}

            {/* Amount */}
            <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Monthly SIP Amount (₹)</Text>
            <View style={[sty.fieldBox, { backgroundColor: T.l2, borderColor: errors.amount ? '#EF4444' : T.border }]}>
              <Text style={{ fontSize: 16, color: T.t3, marginRight: 4 }}>₹</Text>
              <TextInput
                value={amount}
                onChangeText={v => { setAmount(v.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, amount: null })); }}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor={T.t3}
                style={{ fontSize: 18, fontWeight: '700', color: T.t1, flex: 1 }}
              />
            </View>
            {errors.amount && <Text style={sty.errText}>{errors.amount}</Text>}

            {/* Returns + Duration row */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[sty.fieldLabel, { color: T.t3 }]}>Expected Return (%)</Text>
                <View style={[sty.fieldBox, { backgroundColor: T.l2, borderColor: errors.ret ? '#EF4444' : T.border }]}>
                  <TextInput
                    value={returns}
                    onChangeText={v => { setReturns(v.replace(/[^0-9.]/g, '')); setErrors(e => ({ ...e, ret: null })); }}
                    keyboardType="decimal-pad"
                    placeholder="12"
                    placeholderTextColor={T.t3}
                    style={{ fontSize: 17, fontWeight: '700', color: T.t1 }}
                  />
                  <Text style={{ color: T.t3 }}>%</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sty.fieldLabel, { color: T.t3 }]}>Duration (months)</Text>
                <View style={[sty.fieldBox, { backgroundColor: T.l2, borderColor: errors.months ? '#EF4444' : T.border }]}>
                  <TextInput
                    value={months}
                    onChangeText={v => { setMonths(v.replace(/[^0-9]/g, '')); setErrors(e => ({ ...e, months: null })); }}
                    keyboardType="numeric"
                    placeholder="120"
                    placeholderTextColor={T.t3}
                    style={{ fontSize: 17, fontWeight: '700', color: T.t1 }}
                  />
                </View>
              </View>
            </View>

            {/* Step-up SIP */}
            <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Step-up SIP (% increase per year)</Text>
            <View style={[sty.fieldBox, { backgroundColor: T.l2, borderColor: T.border }]}>
              <TextInput
                value={stepUp}
                onChangeText={v => setStepUp(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="0 (optional)"
                placeholderTextColor={T.t3}
                style={{ fontSize: 16, color: T.t1, flex: 1 }}
              />
              <Text style={{ color: T.t3 }}>% per year</Text>
            </View>

            {/* Goal linking */}
            <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Link to Goal</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {GOAL_OPTIONS.map(g => (
                <Pressable
                  key={g.key}
                  onPress={() => setGoalKey(prev => prev === g.key ? null : g.key)}
                  style={[sty.goalChip, {
                    backgroundColor: goalKey === g.key ? color + '22' : T.l2,
                    borderColor: goalKey === g.key ? color + '60' : T.border,
                  }]}
                >
                  <Text style={{ fontSize: 13 }}>{g.icon}</Text>
                  <Text style={{ fontSize: 12, color: goalKey === g.key ? color : T.t2, fontWeight: '600' }}>{g.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Live preview */}
            {Number(amount) > 0 && Number(returns) > 0 && Number(months) > 0 && (() => {
              const prev = calcSipData({ amount: Number(amount), returns: Number(returns), months: Number(months) });
              return (
                <View style={[sty.previewBox, { backgroundColor: color + '0E', borderColor: color + '30' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: color, marginBottom: 8 }}>Live Preview</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: T.t3 }}>Invested</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: T.t1 }}>₹{prev.invest.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: T.t3 }}>Future Value</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#22C55E' }}>₹{prev.mat.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: T.t3 }}>Multiplier</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#4F8CFF' }}>{prev.wealthMx}x</Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Save button */}
            <Pressable onPress={handleSave} style={[sty.saveSipBtn, { backgroundColor: color, marginTop: 20, marginBottom: 40 }]}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Save Changes</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ─────────────────────────────────────────────────────────
// ADD SIP FLOW — 4-STEP MODAL (reference image 2)
// ─────────────────────────────────────────────────────────
const AddSipModal = memo(({ dispatch, onClose, T }) => {
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedType, setSelectedType] = useState(null);
  // Step 2
  const [searchText,   setSearchText]   = useState('');
  const [selectedFund, setSelectedFund] = useState(null);
  // Step 3
  const [amount,   setAmount]   = useState('');
  const [returns,  setReturns]  = useState('12');
  const [months,   setMonths]   = useState('120');
  const [startDate,setStartDate]= useState('15 May 2026');
  const [stepUpPct,setStepUpPct]= useState('10');
  const [goalKey,  setGoalKey]  = useState(null);
  const [amtErr,   setAmtErr]   = useState('');

  const suggestions = selectedType ? (FUND_SUGGESTIONS[selectedType.key] || []) : [];
  const filtered = suggestions.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()));
  const color = selectedType ? selectedType.color : '#4F8CFF';

  const canStep2 = !!selectedType;
  const canStep3 = !!selectedFund;
  const canStep4 = !!amount && Number(amount) > 0;

  const goBack = () => { if (step > 1) setStep(s => s - 1); else onClose(); };

  const handleSelectFund = (f) => {
    setSelectedFund(f);
    setReturns(String(f.returns));
  };

  const handleStep3Next = () => {
    if (!amount || Number(amount) <= 0) { setAmtErr('Enter a valid amount'); return; }
    setAmtErr('');
    setStep(4);
  };

  const handleConfirm = () => {
    dispatch({
      type: 'ADD_SIP',
      sip: {
        name:      selectedFund?.name || selectedType?.label || 'New SIP',
        type:      selectedType?.key  || 'index',
        amount:    Number(amount),
        returns:   Number(returns),
        months:    Number(months),
        stepUpPct: Number(stepUpPct),
        goalKey,
        goalTarget: goalKey ? 5000000 : null,
        startDate,
        nextDate: startDate,
      },
    });
    onClose();
  };

  // Preview data
  const prevData = selectedFund && amount ? calcSipData({ amount: Number(amount), returns: Number(returns), months: Number(months) }) : null;
  const prevSparkline = prevData ? generateSparklinePoints(prevData.mat5y, prevData.mat10y, prevData.amount, prevData.months) : [];

  const STEP_LABELS = ['Type', 'Fund', 'Details', 'Preview'];

  return (
    <Modal visible animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={[sty.addSheet, { backgroundColor: T.bg }]}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          {/* Step indicator (reference image 2 layout) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 0 }}>
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const active  = step === stepNum;
              const done    = step > stepNum;
              return (
                <React.Fragment key={i}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={[sty.stepCircle, {
                      backgroundColor: done ? color : active ? color : T.l2,
                      borderColor: done || active ? color : T.border,
                    }]}>
                      {done
                        ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                        : <Text style={{ color: active ? '#fff' : T.t3, fontSize: 12, fontWeight: '700' }}>{stepNum}</Text>
                      }
                    </View>
                    <Text style={{ fontSize: 10, color: active || done ? color : T.t3, marginTop: 3, fontWeight: active ? '700' : '400' }}>
                      {label}
                    </Text>
                  </View>
                  {i < 3 && (
                    <View style={[sty.stepLine, { backgroundColor: done ? color : T.border }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

            {/* ── STEP 1: Select Investment Type ── */}
            {step === 1 && (
              <View>
                <Text style={[sty.addStepTitle, { color: T.t1 }]}>Select Investment Type</Text>
                {FUND_TYPES.map(ft => (
                  <Pressable
                    key={ft.key}
                    onPress={() => { setSelectedType(ft); setSelectedFund(null); setSearchText(''); }}
                    style={[sty.typeRow, {
                      backgroundColor: selectedType?.key === ft.key ? ft.color + '18' : T.l1,
                      borderColor: selectedType?.key === ft.key ? ft.color + '60' : T.border,
                    }]}
                  >
                    <View style={[sty.typeIconCircle, { backgroundColor: ft.color + '22' }]}>
                      <Text style={{ fontSize: 22 }}>{ft.icon}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: T.t1, flex: 1 }}>{ft.label}</Text>
                    {selectedType?.key === ft.key && <Text style={{ color: ft.color, fontSize: 18 }}>✓</Text>}
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => canStep2 && setStep(2)}
                  style={[sty.nextBtn, { backgroundColor: canStep2 ? color : T.l2 }]}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: canStep2 ? '#fff' : T.t3 }}>Next →</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP 2: Search / Select Fund ── */}
            {step === 2 && (
              <View>
                <Text style={[sty.addStepTitle, { color: T.t1 }]}>Search Fund</Text>
                {/* Search box */}
                <View style={[sty.searchBox, { backgroundColor: T.l1, borderColor: T.border }]}>
                  <Text style={{ fontSize: 16, color: T.t3 }}>🔍</Text>
                  <TextInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder={`Search ${selectedType?.label || ''} funds...`}
                    placeholderTextColor={T.t3}
                    style={{ flex: 1, fontSize: 15, color: T.t1 }}
                  />
                  {searchText ? (
                    <Pressable onPress={() => setSearchText('')}>
                      <Text style={{ color: T.t3 }}>✕</Text>
                    </Pressable>
                  ) : null}
                </View>
                {/* Suggestions */}
                <Text style={[{ fontSize: 12, color: T.t3, marginBottom: 8, marginTop: 4 }]}>Suggested Funds</Text>
                {(filtered.length > 0 ? filtered : suggestions).map((f, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleSelectFund(f)}
                    style={[sty.fundRow, {
                      backgroundColor: selectedFund?.name === f.name ? color + '18' : T.l1,
                      borderColor: selectedFund?.name === f.name ? color + '60' : T.border,
                    }]}
                  >
                    <Text style={{ fontSize: 22, marginRight: 10 }}>{selectedType?.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: T.t1 }} numberOfLines={1}>{f.name}</Text>
                      <Text style={{ fontSize: 11, color: T.t3 }}>Expected: {f.returns}% p.a.</Text>
                    </View>
                    {selectedFund?.name === f.name && <Text style={{ color: color, fontSize: 18 }}>✓</Text>}
                  </Pressable>
                ))}
                {filtered.length === 0 && searchText ? (
                  <View style={[sty.fundRow, { backgroundColor: T.l1, borderColor: T.border }]}>
                    <Pressable onPress={() => handleSelectFund({ name: searchText, returns: 12 })} style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: '#4F8CFF', fontWeight: '600' }}>+ Use "{searchText}"</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Pressable onPress={goBack} style={[sty.backStepBtn, { borderColor: T.border }]}>
                    <Text style={{ color: T.t2, fontWeight: '700' }}>← Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => canStep3 && setStep(3)}
                    style={[sty.nextBtn, { flex: 2, backgroundColor: canStep3 ? color : T.l2 }]}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '800', color: canStep3 ? '#fff' : T.t3 }}>Next →</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── STEP 3: Enter Details ── */}
            {step === 3 && (
              <View>
                <Text style={[sty.addStepTitle, { color: T.t1 }]}>Enter Details</Text>

                {/* Fund preview mini card */}
                <View style={[sty.selectedFundBar, { backgroundColor: color + '12', borderColor: color + '30' }]}>
                  <Text style={{ fontSize: 18 }}>{selectedType?.icon}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1, flex: 1 }} numberOfLines={1}>{selectedFund?.name}</Text>
                  <Text style={{ fontSize: 12, color: color, fontWeight: '700' }}>{selectedFund?.returns}% p.a.</Text>
                </View>

                {/* Monthly amount */}
                <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Monthly SIP Amount (₹)</Text>
                <View style={[sty.fieldBox, { backgroundColor: T.l1, borderColor: amtErr ? '#EF4444' : T.border }]}>
                  <Text style={{ fontSize: 18, color: T.t3, marginRight: 6 }}>₹</Text>
                  <TextInput
                    value={amount}
                    onChangeText={v => { setAmount(v.replace(/[^0-9]/g, '')); setAmtErr(''); }}
                    keyboardType="numeric"
                    placeholder="5000"
                    placeholderTextColor={T.t3}
                    style={{ fontSize: 22, fontWeight: '800', color: T.t1, flex: 1 }}
                    autoFocus
                  />
                </View>
                {amtErr ? <Text style={sty.errText}>{amtErr}</Text> : null}

                {/* Returns + Duration */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[sty.fieldLabel, { color: T.t3 }]}>Expected Return (%)</Text>
                    <View style={[sty.fieldBox, { backgroundColor: T.l1, borderColor: T.border }]}>
                      <TextInput
                        value={returns}
                        onChangeText={v => setReturns(v.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="12"
                        placeholderTextColor={T.t3}
                        style={{ fontSize: 16, fontWeight: '700', color: T.t1, flex: 1 }}
                      />
                      <Text style={{ color: T.t3 }}>%</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sty.fieldLabel, { color: T.t3 }]}>Duration (Years)</Text>
                    <View style={[sty.fieldBox, { backgroundColor: T.l1, borderColor: T.border }]}>
                      <TextInput
                        value={String(Math.round(Number(months) / 12))}
                        onChangeText={v => setMonths(String(Number(v.replace(/[^0-9]/g, '')) * 12))}
                        keyboardType="numeric"
                        placeholder="10"
                        placeholderTextColor={T.t3}
                        style={{ fontSize: 16, fontWeight: '700', color: T.t1, flex: 1 }}
                      />
                      <Text style={{ color: T.t3 }}>Y</Text>
                    </View>
                  </View>
                </View>

                {/* Start Date */}
                <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Start Date</Text>
                <View style={[sty.fieldBox, { backgroundColor: T.l1, borderColor: T.border }]}>
                  <Text style={{ fontSize: 16, color: T.t1, flex: 1 }}>📅  {startDate}</Text>
                </View>

                {/* Step-up SIP */}
                <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Step-up SIP (optional)</Text>
                <View style={[sty.fieldBox, { backgroundColor: T.l1, borderColor: T.border }]}>
                  <TextInput
                    value={stepUpPct}
                    onChangeText={v => setStepUpPct(v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={T.t3}
                    style={{ fontSize: 16, fontWeight: '700', color: T.t1, flex: 1 }}
                  />
                  <Text style={{ color: T.t3 }}>% every year</Text>
                </View>

                {/* Goal linking */}
                <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 14 }]}>Link to Goal (optional)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {GOAL_OPTIONS.map(g => (
                    <Pressable
                      key={g.key}
                      onPress={() => setGoalKey(prev => prev === g.key ? null : g.key)}
                      style={[sty.goalChip, {
                        backgroundColor: goalKey === g.key ? color + '22' : T.l1,
                        borderColor: goalKey === g.key ? color + '60' : T.border,
                      }]}
                    >
                      <Text style={{ fontSize: 13 }}>{g.icon}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: goalKey === g.key ? color : T.t2 }}>{g.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  <Pressable onPress={goBack} style={[sty.backStepBtn, { borderColor: T.border }]}>
                    <Text style={{ color: T.t2, fontWeight: '700' }}>← Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleStep3Next}
                    style={[sty.nextBtn, { flex: 2, backgroundColor: color }]}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Next →</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── STEP 4: Preview ── */}
            {step === 4 && prevData && (
              <View>
                <Text style={[sty.addStepTitle, { color: T.t1 }]}>Preview</Text>

                {/* Preview card — exact reference image layout */}
                <View style={[sty.previewFullCard, { backgroundColor: T.l1, borderColor: T.border }]}>
                  {/* Fund header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: T.t1 }} numberOfLines={1}>{selectedFund?.name}</Text>
                      <View style={[sty.typeChip, { backgroundColor: color + '18', borderColor: color + '40', alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={[sty.typeChipText, { color: color }]}>{selectedType?.label}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: color }}>
                      ₹{Number(amount).toLocaleString('en-IN')}
                      <Text style={{ fontSize: 11, color: T.t3 }}> /month</Text>
                    </Text>
                  </View>

                  {/* Stats row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                    {[
                      { label: 'Expected Return', val: `${returns}%` },
                      { label: 'Duration',         val: `${Math.round(Number(months) / 12)} Years` },
                      { label: 'Start Date',       val: startDate },
                    ].map((item, i) => (
                      <View key={i} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: T.t3 }}>{item.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: T.t1, marginTop: 2 }}>{item.val}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Projected values */}
                  <View style={[sty.prevStats3, { borderColor: T.border }]}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 10, color: T.t3 }}>Total Invested</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: T.t1, marginTop: 2 }}>
                        ₹{prevData.invest.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[{ alignItems: 'center', flex: 1 }, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border }]}>
                      <Text style={{ fontSize: 10, color: T.t3 }}>Future Value ({Math.round(Number(months) / 12)}Y)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#22C55E', marginTop: 2 }}>
                        ₹{prevData.mat.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 10, color: T.t3 }}>Wealth Multiplier</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#4F8CFF', marginTop: 2 }}>{prevData.wealthMx}x</Text>
                    </View>
                  </View>

                  {/* Sparkline chart */}
                  <View style={{ marginTop: 14, marginBottom: 6 }}>
                    <Sparkline data={prevSparkline} color={color} height={56} width={SCREEN_W - 100} />
                  </View>

                  {/* Insight strip */}
                  {goalKey && (
                    <View style={[sty.insightRow, { backgroundColor: '#4F8CFF0E', borderColor: '#4F8CFF25', marginTop: 10 }]}>
                      <Text style={{ fontSize: 12 }}>🚀</Text>
                      <Text style={{ fontSize: 12, color: '#4F8CFF', flex: 1 }}>
                        Increase SIP by ₹1,500/month → You can reach ₹1Cr 2.1 years early.
                      </Text>
                      <Text style={{ color: '#4F8CFF' }}>›</Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Pressable onPress={goBack} style={[sty.backStepBtn, { borderColor: T.border }]}>
                    <Text style={{ color: T.t2, fontWeight: '700' }}>← Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirm}
                    style={[sty.nextBtn, { flex: 2, backgroundColor: color }]}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Confirm & Save</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// ─────────────────────────────────────────────────────────
// MAIN SIP TAB COMPONENT (exported — drop-in replacement)
// ─────────────────────────────────────────────────────────
export const SipTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();

  // State
  const [detailSip,  setDetailSip]  = useState(null);  // { sip, idx }
  const [editSip,    setEditSip]    = useState(null);  // { sip, idx }
  const [showAdd,    setShowAdd]    = useState(false);
  const [sortMode,   setSortMode]   = useState('Latest');
  const [showSort,   setShowSort]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const sips = s.sips || [];

  // Derived totals
  const totalMonthly = useMemo(() => sips.reduce((a, x) => a + (Number(x.amount) || 0), 0), [sips]);
  const totalCorpus  = useMemo(() =>
    sips.reduce((a, x) => a + sipMaturity(x.amount || 0, x.months || 12, x.returns || 12), 0), [sips]);
  const corpusGrowth = useMemo(() => {
    const prev = sips.reduce((a, x) => a + sipMaturity(x.amount || 0, Math.max(1, (x.months || 12) - 1), x.returns || 12), 0);
    return totalCorpus - prev;
  }, [sips, totalCorpus]);

  // Sort
  const sortedSips = useMemo(() => {
    const arr = sips.map((s, i) => ({ ...s, _origIdx: i }));
    if (sortMode === 'Highest Return')  return [...arr].sort((a, b) => (b.returns || 0) - (a.returns || 0));
    if (sortMode === 'Highest Amount')  return [...arr].sort((a, b) => (b.amount  || 0) - (a.amount  || 0));
    if (sortMode === 'Lowest Amount')   return [...arr].sort((a, b) => (a.amount  || 0) - (b.amount  || 0));
    return arr; // Latest
  }, [sips, sortMode]);

  const handleTapCard = useCallback((sip, idx, openEdit) => {
    if (openEdit) {
      setEditSip({ sip, idx: sip._origIdx ?? idx });
    } else {
      setDetailSip({ sip, idx: sip._origIdx ?? idx });
      setShowDetail(true);
    }
  }, []);

  const handleEditFromDetail = useCallback((sip, idx) => {
    setShowDetail(false);
    setDetailSip(null);
    setEditSip({ sip, idx });
  }, []);

  // ── FULL-SCREEN DETAIL VIEW ──
  if (showDetail && detailSip) {
    return (
      <SipDetailScreen
        sip={detailSip.sip}
        idx={detailSip.idx}
        dispatch={dispatch}
        onClose={() => { setShowDetail(false); setDetailSip(null); }}
        onEdit={handleEditFromDetail}
        T={T}
      />
    );
  }

  return (
    <View>
      {/* ── WISDOM BANNER ── */}
      <WisdomBanner T={T} />

      {/* ── HEADER STATS CARDS ── */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 12 }}>
        {/* Total SIP / month */}
        <LinearGradient colors={['#052e16', '#064e30']} style={[sty.headerStatCard, { flex: 1 }]}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Total SIP / month</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>₹{totalMonthly.toLocaleString('en-IN')}</Text>
          {sips.length > 0 && (
            <Text style={{ fontSize: 11, color: '#22C55E', marginTop: 4, fontWeight: '600' }}>
              ▲ ₹1,500 vs last month
            </Text>
          )}
        </LinearGradient>
        {/* Est. 10Y Corpus */}
        <LinearGradient colors={['#0c1a4e', '#1a3080']} style={[sty.headerStatCard, { flex: 1 }]}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Est. 10Y Corpus</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>
            ₹{(sips.reduce((a, x) => a + sipMaturity(x.amount || 0, 120, x.returns || 12), 0)).toLocaleString('en-IN')}
          </Text>
          <Text style={{ fontSize: 11, color: '#4F8CFF', marginTop: 4, fontWeight: '600' }}>
            ▲ ₹{corpusGrowth.toLocaleString('en-IN')} (15.6%)
          </Text>
        </LinearGradient>
      </View>

      {/* ── AUTO-ADJUST MODE strip ── */}
      <View style={[sty.autoAdjustStrip, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={{ fontSize: 18 }}>🤖</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>Auto-Adjust Mode</Text>
            <View style={[sty.onBadge, { backgroundColor: s.autoAdjust ? '#22C55E' : '#64748B' }]}>
              <Text style={sty.onBadgeText}>{s.autoAdjust ? 'ON' : 'OFF'}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: T.t3, marginTop: 1 }}>AI-driven rebalancing of your investments</Text>
        </View>
        {/* Simple toggle representation */}
        <View style={[sty.fakeToggle, { backgroundColor: s.autoAdjust ? '#22C55E' : T.l2, borderColor: T.border }]}>
          <View style={[sty.fakeToggleKnob, { marginLeft: s.autoAdjust ? 18 : 2 }]} />
        </View>
      </View>

      {/* ── SORT / FILTER BAR ── */}
      {sips.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 10 }}>
          <Pressable
            onPress={() => setShowSort(true)}
            style={[sty.sortBtn, { backgroundColor: T.l1, borderColor: T.border }]}
          >
            <Text style={{ fontSize: 13, color: T.t2 }}>Sort by: </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: T.t1 }}>{sortMode}</Text>
            <Text style={{ fontSize: 11, color: T.t3 }}>▾</Text>
          </Pressable>
          <Pressable style={[sty.filterBtn, { backgroundColor: T.l1, borderColor: T.border }]}>
            <Text style={{ fontSize: 14, color: T.t2 }}>⌘ Filter</Text>
            <Text style={{ color: T.t3 }}>  ✕</Text>
          </Pressable>
        </View>
      )}

      {/* ── SIP CARDS LIST ── */}
      {sips.length === 0 ? (
        <View style={[sty.emptyState, { backgroundColor: T.l1, borderColor: T.border }]}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📈</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: T.t1, marginBottom: 6 }}>No SIPs added</Text>
          <Text style={{ fontSize: 14, color: T.t3, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
            Start your wealth journey.{'\n'}₹500/mo in index funds grows significantly over time.
          </Text>
          <Pressable onPress={() => setShowAdd(true)} style={[sty.emptyAddBtn, { backgroundColor: '#4F8CFF' }]}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>+ Add First SIP</Text>
          </Pressable>
        </View>
      ) : (
        sortedSips.map((sip, i) => (
          <SipCard
            key={sip.id || sip._origIdx || i}
            sip={sip}
            idx={sip._origIdx ?? i}
            dispatch={dispatch}
            onTap={handleTapCard}
            T={T}
          />
        ))
      )}

      {/* ── ADD SIP FAB BUTTON ── */}
      {sips.length > 0 && (
        <Pressable
          onPress={() => setShowAdd(true)}
          style={[sty.addSipBtn, { borderColor: '#4F8CFF40' }]}
        >
          <Text style={{ fontSize: 16, color: '#4F8CFF', fontWeight: '600' }}>+ Add New SIP</Text>
        </Pressable>
      )}

      {/* ── SMART INSIGHTS SECTION ── */}
      {sips.length > 0 && (
        <View style={[sty.smartInsightsCard, { backgroundColor: T.l1, borderColor: T.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>Smart Insights</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#4F8CFF', fontWeight: '600' }}>View All</Text>
          </View>
          <View style={[sty.insightRow, { backgroundColor: '#4F8CFF0E', borderColor: '#4F8CFF25' }]}>
            <Text style={{ fontSize: 14 }}>🚀</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#4F8CFF', fontWeight: '600' }}>
                Increase your SIP by ₹1,500/month
              </Text>
              <Text style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>
                You can reach your Dream Home goal 1.8 years early.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── SORT MODAL ── */}
      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <Pressable style={sty.modalOverlay} onPress={() => setShowSort(false)}>
          <View style={[sty.sortSheet, { backgroundColor: T.l1 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T.t1, marginBottom: 14 }}>Sort by</Text>
            {SORT_OPTIONS.map(opt => (
              <Pressable
                key={opt}
                onPress={() => { setSortMode(opt); setShowSort(false); }}
                style={[sty.sortOption, { borderBottomColor: T.border }]}
              >
                <Text style={{ fontSize: 15, color: sortMode === opt ? '#4F8CFF' : T.t1, fontWeight: sortMode === opt ? '700' : '400' }}>
                  {opt}
                </Text>
                {sortMode === opt && <Text style={{ color: '#4F8CFF', fontSize: 16 }}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── ADD SIP MODAL ── */}
      {showAdd && (
        <AddSipModal
          dispatch={dispatch}
          onClose={() => setShowAdd(false)}
          T={T}
        />
      )}

      {/* ── EDIT SIP MODAL ── */}
      {editSip && (
        <EditSipModal
          sip={editSip.sip}
          idx={editSip.idx}
          dispatch={dispatch}
          onClose={() => setEditSip(null)}
          T={T}
        />
      )}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const sty = StyleSheet.create({
  // Wisdom
  wisdomCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  wisdomAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  wisdomLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  wisdomName:   { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  wisdomQuote:  { fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginTop: 12 },
  wisdomBigQ:   { fontSize: 80, fontWeight: '900', position: 'absolute', right: 12, top: -8, lineHeight: 80 },
  wisdomRefresh:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },

  // Header stat cards
  headerStatCard: { borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'transparent' },

  // Auto adjust strip
  autoAdjustStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  onBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  onBadgeText:  { fontSize: 10, fontWeight: '800', color: '#fff' },
  fakeToggle:   { width: 42, height: 24, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  fakeToggleKnob:{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },

  // Sort
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, flex: 1,
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1,
  },

  // SIP Card
  sipCard: {
    borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
  },
  sipFundName:  { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sipAmount:    { fontSize: 18, fontWeight: '900' },
  typeChip: {
    alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, marginTop: 5,
  },
  typeChipText: { fontSize: 11, fontWeight: '700' },
  sipStatsRow: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 4,
  },
  sipStat:      { flex: 1, alignItems: 'center', paddingVertical: 10 },
  sipStatCenter:{ borderLeftWidth: 1, borderRightWidth: 1 },
  sipStatLabel: { fontSize: 10, marginBottom: 3 },
  sipStatVal:   { fontSize: 14, fontWeight: '800' },
  insightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 9, borderWidth: 1,
  },

  // Detail screen
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  detailTitle:   { fontSize: 17, fontWeight: '700' },
  detailTopCard: {
    borderRadius: 18, padding: 16, borderWidth: 1, marginTop: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  detailStatsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 12,
    overflow: 'hidden', marginTop: 14,
  },
  detailStatCell: {
    width: '33.33%', padding: 12,
    borderBottomWidth: 1, borderRightWidth: 1,
  },
  detailChartCard: {
    borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  chartToggle: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  projectionCallout: {
    borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center', marginBottom: 12,
  },
  detailInsightBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1,
  },
  sipInfoCard: {
    borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 11, borderBottomWidth: 1,
  },
  projCard: {
    borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  projRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
  },
  detailInsightCard: {
    borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  insightBubble: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8,
  },
  editSipBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 14, paddingVertical: 16,
  },
  deleteSipBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 16,
  },

  // Add SIP modal
  addSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40,
    maxHeight: '92%',
  },
  addStepTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16, letterSpacing: -0.4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  stepLine: { flex: 1, height: 1.5, marginHorizontal: 4, marginBottom: 16 },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 10,
  },
  typeIconCircle: {
    width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 13, borderWidth: 1, marginBottom: 10,
  },
  fundRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 14, borderWidth: 1.5, marginBottom: 8,
  },
  selectedFundBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1,
  },
  errText: { fontSize: 11, color: '#EF4444', marginTop: 4 },
  goalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1,
  },
  previewBox: { borderRadius: 14, padding: 14, borderWidth: 1, marginTop: 16 },
  previewFullCard: {
    borderRadius: 18, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  prevStats3: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden', paddingVertical: 12,
  },
  nextBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 16,
  },
  backStepBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18,
  },
  saveSipBtn: {
    alignItems: 'center', borderRadius: 14, paddingVertical: 16,
    shadowColor: '#4F8CFF', shadowOpacity: 0.4, shadowRadius: 12, elevation: 7,
  },

  // Edit modal
  editSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 10, paddingHorizontal: 20, paddingBottom: 10,
    maxHeight: '90%',
  },
  closeX: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Shared modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sortSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40,
  },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1,
  },

  // Bottom add button
  addSipBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 15, marginBottom: 14, borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyState: {
    alignItems: 'center', borderRadius: 20, padding: 32,
    borderWidth: 1, marginTop: 6,
  },
  emptyAddBtn: {
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
  },

  // Smart insights
  smartInsightsCard: {
    borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
});
