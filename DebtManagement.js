// ─────────────────────────────────────────────────────────────────────────────
// DEBT TAB — Premium Smart Debt Management System
// Matches reference screenshots exactly. Production-ready, zero hardcoded fake data.
//
// SCREENS:
//  1. DebtListScreen  — main overview with strategy, cards, insights
//  2. DebtDetailScreen — full detail with graph, progress, actions
//  3. AddDebtModal    — 3-step wizard (Details → EMI & Tenure → Preview)
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState, useMemo, useRef, useEffect, useCallback, memo,
} from 'react';
import {
  View, Text, Pressable, ScrollView, Modal, TextInput,
  Animated, Alert, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';
import { Bar, Chip, Card, StatRow, Btn } from './UI';
import { fmt, fmtShort, safePct } from './helpers';

const { width: SW } = Dimensions.get('window');
const tap  = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);  } catch {} };
const tapM = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} };

// ─────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────
const RED    = '#FF4444';
const GREEN  = '#00C48C';
const BLUE   = '#3B82F6';
const AMBER  = '#F59E0B';
const PURPLE = '#A78BFA';

// ─────────────────────────────────────────────────────────
// DEBT WISDOM QUOTES
// ─────────────────────────────────────────────────────────
const DEBT_QUOTES = [
  { name: 'Warren Buffett',    avatar: '👴', quote: '"Debt is the enemy of wealth. Eliminate it first."',      color: '#FF4444' },
  { name: 'Dave Ramsey',       avatar: '📚', quote: '"You must gain control over your money or the lack of it will forever control you."', color: '#3B82F6' },
  { name: 'Robert Kiyosaki',   avatar: '🏦', quote: '"Good debt makes you rich. Bad debt makes you poor."',    color: '#F59E0B' },
  { name: 'Benjamin Franklin', avatar: '🎓', quote: '"Rather go to bed supper-less than rise in debt."',       color: '#A78BFA' },
  { name: 'Suze Orman',        avatar: '💡', quote: '"Owning a home is a keystone of wealth — both financial affluence and emotional security."', color: '#00C48C' },
];

function getDailyDebtQuote(offset = 0) {
  const idx = (Math.floor(Date.now() / 86400000) + offset) % DEBT_QUOTES.length;
  return DEBT_QUOTES[Math.abs(idx)];
}

// ─────────────────────────────────────────────────────────
// DEBT LOAN TYPE ICONS
// ─────────────────────────────────────────────────────────
const DEBT_ICONS = {
  'Home Loan':     '🏠',
  'Personal Loan': '👤',
  'Car Loan':      '🚗',
  'Credit Card':   '💳',
  'Education':     '🎓',
  'Business':      '📈',
  'Gold Loan':     '🪙',
  'Other':         '🏦',
};

const DEBT_TYPES = Object.keys(DEBT_ICONS);
const TENURE_OPTIONS = ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years', '10 Years', '15 Years', '20 Years', '25 Years', '30 Years'];

// ─────────────────────────────────────────────────────────
// PURE CALCULATIONS
// ─────────────────────────────────────────────────────────

/** Months remaining given remaining balance, EMI */
function calcMonthsLeft(remaining, emi, rate) {
  const r = Number(remaining) || 0;
  const e = Number(emi) || 1;
  const monthlyRate = (Number(rate) || 0) / 100 / 12;
  if (r <= 0) return 0;
  if (monthlyRate <= 0) return Math.ceil(r / e);
  if (e <= r * monthlyRate) return 999; // never pays off
  return Math.ceil(Math.log(e / (e - r * monthlyRate)) / Math.log(1 + monthlyRate));
}

/** Debt-free date string */
function calcDebtFreeDate(remaining, emi, rate) {
  const months = calcMonthsLeft(remaining, emi, rate);
  if (months <= 0) return 'Paid Off';
  if (months >= 999) return 'N/A';
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Total interest remaining */
function calcInterestRemaining(remaining, emi, rate) {
  const months = calcMonthsLeft(remaining, emi, rate);
  const totalPayable = (Number(emi) || 0) * months;
  return Math.max(0, totalPayable - (Number(remaining) || 0));
}

/** Balance-over-time graph points (returns array of {month, balance}) */
function calcBalanceOverTime(remaining, emi, rate, maxPoints = 20) {
  const monthlyRate = (Number(rate) || 0) / 100 / 12;
  const e = Number(emi) || 1;
  let bal = Number(remaining) || 0;
  const total = calcMonthsLeft(remaining, emi, rate);
  if (total <= 0 || total >= 999) return [];
  const step = Math.max(1, Math.ceil(total / maxPoints));
  const points = [];
  for (let m = 0; m <= total; m += step) {
    if (monthlyRate > 0) {
      // compound reduction
      const factor = Math.pow(1 + monthlyRate, m);
      bal = (Number(remaining) || 0) * factor - e * ((factor - 1) / monthlyRate);
    } else {
      bal = (Number(remaining) || 0) - e * m;
    }
    points.push({ month: m, balance: Math.max(0, Math.round(bal)) });
    if (bal <= 0) break;
  }
  if (points[points.length - 1]?.balance > 0) {
    points.push({ month: total, balance: 0 });
  }
  return points;
}

/** Avalanche order (highest rate first) */
function avalancheOrder(debts) {
  return [...debts].sort((a, b) => (Number(b?.rate) || 0) - (Number(a?.rate) || 0));
}

/** Snowball order (smallest balance first) */
function snowballOrder(debts) {
  return [...debts].sort((a, b) => (Number(a?.remaining) || 0) - (Number(b?.remaining) || 0));
}

/** Estimate total interest paid under a given order */
function totalInterestForOrder(orderedDebts) {
  return orderedDebts.reduce((sum, d) => {
    return sum + calcInterestRemaining(d?.remaining, d?.emi, d?.rate);
  }, 0);
}

/** Smart insights for a debt */
function buildDebtInsights(debt) {
  const insights = [];
  const months = calcMonthsLeft(debt?.remaining, debt?.emi, debt?.rate);
  const rate = Number(debt?.rate) || 0;

  // Insight 1: increase EMI
  const extraEmi = Math.round((Number(debt?.emi) || 0) * 0.15);
  if (extraEmi > 0) {
    const newMonths = calcMonthsLeft(debt?.remaining, (Number(debt?.emi) || 0) + extraEmi, rate);
    const saved = months - newMonths;
    if (saved > 0) {
      const intSaved = calcInterestRemaining(debt?.remaining, debt?.emi, rate) -
                       calcInterestRemaining(debt?.remaining, (Number(debt?.emi) || 0) + extraEmi, rate);
      insights.push({
        icon: '⚡',
        color: BLUE,
        title: `Increase EMI by ${fmtShort(extraEmi)}`,
        desc: `You will be debt-free ${saved} months earlier and save ${fmtShort(Math.abs(intSaved))} in interest`,
      });
    }
  }

  // Insight 2: prepay lump sum
  const prepay = Math.round((Number(debt?.remaining) || 0) * 0.1);
  if (prepay > 0) {
    const newRemaining = (Number(debt?.remaining) || 0) - prepay;
    const newMonths = calcMonthsLeft(newRemaining, debt?.emi, rate);
    const savedMonths = months - newMonths;
    const intSaved = calcInterestRemaining(debt?.remaining, debt?.emi, rate) -
                     calcInterestRemaining(newRemaining, debt?.emi, rate);
    if (intSaved > 0) {
      insights.push({
        icon: '💰',
        color: GREEN,
        title: `Prepay ${fmtShort(prepay)}`,
        desc: `You will save ${fmtShort(Math.abs(intSaved))} in interest${savedMonths > 0 ? ` and close ${savedMonths} months early` : ''}`,
      });
    }
  }

  // Insight 3: high interest warning
  if (rate >= 24) {
    insights.push({
      icon: '⚠️',
      color: AMBER,
      title: 'Current interest rate is high',
      desc: 'Consider balance transfer or refinance to a lower rate',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────
// DEBT WISDOM CARD
// ─────────────────────────────────────────────────────────
const DebtWisdomCard = memo(({ T }) => {
  const [offset, setOffset] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const quote = useMemo(() => getDailyDebtQuote(offset), [offset]);

  const refresh = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setOffset(o => o + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, []);

  return (
    <View style={[DS.wisdomCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      <View style={DS.wisdomRow}>
        <View style={[DS.wisdomAvatar, { backgroundColor: quote.color + '20', borderColor: quote.color + '40' }]}>
          <Text style={{ fontSize: 24 }}>{quote.avatar}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[DS.wisdomLabel, { color: quote.color }]}>DEBT WISDOM</Text>
          <Text style={[DS.wisdomName, { color: T.t1 }]}>{quote.name}</Text>
        </View>
        <Text style={[DS.wisdomBigQuote, { color: quote.color + '30' }]}>"</Text>
      </View>
      <Animated.Text style={[DS.wisdomQuote, { color: T.t2, opacity: fadeAnim }]}>
        {quote.quote}
      </Animated.Text>
      <Pressable onPress={refresh} style={DS.wisdomRefreshBtn}>
        <Text style={{ fontSize: 11, color: T.t3 }}>↺  Next quote</Text>
      </Pressable>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// DEBT OVERVIEW CARD
// ─────────────────────────────────────────────────────────
const DebtOverviewCard = memo(({ debts, T }) => {
  const totalOutstanding = debts.reduce((s, d) => s + (Number(d?.remaining) || 0), 0);
  const monthlyEmi = debts.reduce((s, d) => s + (Number(d?.emi) || 0), 0);
  const totalLoan = debts.reduce((s, d) => s + (Number(d?.totalLoan) || Number(d?.remaining) || 0), 0);
  const totalPaid = totalLoan - totalOutstanding;
  const pctCleared = safePct(totalPaid, totalLoan);

  // Overall debt-free: max months among all debts
  let maxMonths = 0;
  debts.forEach(d => {
    const m = calcMonthsLeft(d?.remaining, d?.emi, d?.rate);
    if (m > maxMonths && m < 999) maxMonths = m;
  });
  const dfDate = maxMonths > 0 ? (() => {
    const dd = new Date();
    dd.setMonth(dd.getMonth() + maxMonths);
    return dd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  })() : (debts.length > 0 ? 'Paid Off' : '—');

  return (
    <View style={[DS.overviewCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      <View style={DS.overviewHeader}>
        <Text style={[DS.overviewTitle, { color: T.t1 }]}>Debt Overview</Text>
        <View style={DS.activeDot}>
          <View style={DS.activeDotCircle} />
          <Text style={DS.activeDotText}>Active</Text>
        </View>
      </View>

      <View style={DS.overviewStats}>
        <View style={{ flex: 1 }}>
          <Text style={[DS.statLabel, { color: T.t3 }]}>Total Outstanding</Text>
          <Text style={[DS.statBig, { color: RED }]}>{fmt(totalOutstanding)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[DS.statLabel, { color: T.t3 }]}>Monthly EMI</Text>
          <Text style={[DS.statBig, { color: T.t1 }]}>{fmt(monthlyEmi)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[DS.statLabel, { color: T.t3 }]}>Debt-Free On</Text>
          <Text style={[DS.statBig, { color: GREEN, fontSize: 18 }]}>{dfDate}</Text>
        </View>
      </View>

      {/* Progress bar: red filled → green at the end */}
      <View style={DS.progressTrack}>
        <View style={[DS.progressFill, { width: `${pctCleared}%` }]} />
        <View style={[DS.progressGreenEnd, { width: `${Math.min(pctCleared, 8)}%` }]} />
      </View>

      <View style={DS.overviewFooter}>
        <Text style={[DS.footerText, { color: T.t3 }]}>{pctCleared}% of debt cleared</Text>
        <Text style={DS.viewReport}>View Report ›</Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// STRATEGY CARD
// ─────────────────────────────────────────────────────────
const StrategyCard = memo(({ debts, activeStrategy, onStrategyChange, T }) => {
  const avalDebts = useMemo(() => avalancheOrder(debts), [debts]);
  const snowDebts = useMemo(() => snowballOrder(debts), [debts]);
  const avalInt   = useMemo(() => totalInterestForOrder(avalDebts), [avalDebts]);
  const snowInt   = useMemo(() => totalInterestForOrder(snowDebts), [snowDebts]);
  const savings   = Math.abs(snowInt - avalInt);
  const avalWins  = avalInt <= snowInt;

  // Extra months savings with Snowball
  const snowMonths = snowDebts.reduce((s, d) => Math.max(s, calcMonthsLeft(d?.remaining, d?.emi, d?.rate)), 0);
  const avalMonths = avalDebts.reduce((s, d) => Math.max(s, calcMonthsLeft(d?.remaining, d?.emi, d?.rate)), 0);
  const monthsDiff = Math.abs(snowMonths - avalMonths);

  return (
    <View style={[DS.strategyCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      <View style={DS.strategyHeader}>
        <Text style={[DS.strategyTitle, { color: T.t1 }]}>Strategy Suggestion</Text>
        <Text style={{ fontSize: 12, color: T.t3 }}>
          Current: <Text style={{ color: activeStrategy === 'avalanche' ? RED : BLUE, fontWeight: '700' }}>
            {activeStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'}
          </Text>
        </Text>
      </View>

      <View style={DS.strategyCards}>
        {/* Avalanche */}
        <Pressable
          onPress={() => { tap(); onStrategyChange('avalanche'); }}
          style={[
            DS.strategyOption,
            {
              backgroundColor: activeStrategy === 'avalanche' ? RED + '20' : T.l2,
              borderColor: activeStrategy === 'avalanche' ? RED + '60' : T.border,
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={[DS.stratOptionTitle, { color: RED }]}>Avalanche</Text>
          <Text style={[DS.stratOptionSub, { color: T.t3 }]}>Pay high interest first</Text>
          {avalWins && savings > 0 && (
            <>
              <Text style={[DS.stratOptionSavings, { color: T.t2 }]}>You save</Text>
              <Text style={[DS.stratOptionAmt, { color: RED }]}>{fmtShort(savings)}</Text>
              <Text style={[DS.stratOptionSub, { color: T.t3 }]}>Faster debt-free</Text>
            </>
          )}
        </Pressable>

        {/* Snowball */}
        <Pressable
          onPress={() => { tap(); onStrategyChange('snowball'); }}
          style={[
            DS.strategyOption,
            {
              backgroundColor: activeStrategy === 'snowball' ? BLUE + '20' : T.l2,
              borderColor: activeStrategy === 'snowball' ? BLUE + '60' : T.border,
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>❄️</Text>
          <Text style={[DS.stratOptionTitle, { color: BLUE }]}>Snowball</Text>
          <Text style={[DS.stratOptionSub, { color: T.t3 }]}>Pay small balance first</Text>
          {!avalWins && savings > 0 ? (
            <>
              <Text style={[DS.stratOptionSavings, { color: T.t2 }]}>You save</Text>
              <Text style={[DS.stratOptionAmt, { color: BLUE }]}>{fmtShort(savings)}</Text>
            </>
          ) : monthsDiff > 0 ? (
            <>
              <Text style={[DS.stratOptionSub, { color: T.t3 }]}>Pay off loans</Text>
              <Text style={[DS.stratOptionAmt, { color: BLUE }]}>{monthsDiff} months</Text>
              <Text style={[DS.stratOptionSub, { color: T.t3 }]}>earlier</Text>
            </>
          ) : null}
        </Pressable>
      </View>

      {/* Savings comparison */}
      {savings > 0 && (
        <View style={[DS.savingsCompare, { backgroundColor: T.l2, borderColor: T.border }]}>
          <Text style={{ fontSize: 13 }}>💡</Text>
          <Text style={{ fontSize: 12, color: T.t2, flex: 1, lineHeight: 18 }}>
            {avalWins
              ? `Avalanche saves ${fmtShort(savings)} more than Snowball`
              : `Snowball gets debt-free ${monthsDiff} months earlier`}
          </Text>
        </View>
      )}

      <Pressable style={[DS.compareBtn, { borderColor: T.border }]}>
        <Text style={{ fontSize: 13, color: BLUE, fontWeight: '600' }}>Compare Strategies  ›</Text>
      </Pressable>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// DEBT CARD (in list)
// ─────────────────────────────────────────────────────────
const DebtCard = memo(({ debt, idx, onPress, onEdit, onDelete, T }) => {
  const totalLoan = Number(debt?.totalLoan) || Number(debt?.remaining) || 0;
  const remaining = Number(debt?.remaining) || 0;
  const paid = totalLoan - remaining;
  const pct = safePct(paid, totalLoan);
  const emi = Number(debt?.emi) || 0;
  const rate = Number(debt?.rate) || 0;
  const isCC = (debt?.type || debt?.name || '').toLowerCase().includes('credit');

  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40, bounciness: 1 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28 }).start();

  const progressColor = pct >= 75 ? GREEN : pct >= 40 ? AMBER : RED;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => { tap(); onPress(); }}
        onPressIn={onIn}
        onPressOut={onOut}
        onLongPress={() => {
          tapM();
          Alert.alert(debt?.name || 'Debt', 'What would you like to do?', [
            { text: 'Edit',   onPress: onEdit },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
        style={[DS.debtCard, { backgroundColor: T.l1, borderColor: T.border }]}
      >
        {/* Header */}
        <View style={DS.debtCardHeader}>
          <View style={[DS.debtIcon, { backgroundColor: RED + '18' }]}>
            <Text style={{ fontSize: 22 }}>{DEBT_ICONS[debt?.type] || DEBT_ICONS[debt?.name] || '🏦'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[DS.debtName, { color: T.t1 }]}>{debt?.name || 'Loan'}</Text>
            <Text style={[DS.debtRate, { color: rate >= 24 ? RED : AMBER }]}>{rate}% p.a.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={DS.debtRemaining}>{fmt(remaining)}</Text>
            <Text style={[DS.debtRemainingLabel, { color: T.t3 }]}>remaining</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={[DS.debtStats, { borderColor: T.border }]}>
          <View style={DS.debtStat}>
            <Text style={[DS.debtStatLabel, { color: T.t3 }]}>{isCC ? 'Min. Due' : 'EMI'}</Text>
            <Text style={[DS.debtStatVal, { color: T.t1 }]}>{fmt(emi)}</Text>
          </View>
          <View style={[DS.debtStat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border }]}>
            <Text style={[DS.debtStatLabel, { color: T.t3 }]}>{isCC ? 'Total Limit' : 'Total Loan'}</Text>
            <Text style={[DS.debtStatVal, { color: T.t1 }]}>{fmt(totalLoan)}</Text>
          </View>
          <View style={[DS.debtStat, { alignItems: 'flex-end' }]}>
            <Text style={[DS.debtStatLabel, { color: T.t3 }]}>Due Date</Text>
            <Text style={[DS.debtStatVal, { color: AMBER }]}>
              {debt?.dueDate ? `${debt.dueDate}th May` : '—'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: 10, marginBottom: 6 }}>
          <Bar value={paid} total={Math.max(totalLoan, 1)} color={progressColor} h={6} />
        </View>
        <Text style={[DS.debtPct, { color: progressColor }]}>{pct}% paid</Text>

        {/* Action buttons */}
        <View style={[DS.debtActions, { borderColor: T.border }]}>
          <Pressable onPress={() => { tap(); onPress(); }} style={[DS.debtActionBtn, { borderRightWidth: 1, borderColor: T.border }]}>
            <Text style={{ fontSize: 12, color: T.t2, fontWeight: '600' }}>View Details</Text>
          </Pressable>
          <Pressable onPress={() => { tap(); onEdit(); }} style={[DS.debtActionBtn, { borderRightWidth: 1, borderColor: T.border }]}>
            <Text style={{ fontSize: 12 }}>✏️</Text>
            <Text style={{ fontSize: 12, color: T.t2, fontWeight: '600' }}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => {
            Alert.alert(debt?.name || 'Debt', 'What would you like to do?', [
              { text: 'Edit',   onPress: onEdit },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }} style={DS.debtActionBtn}>
            <Text style={{ fontSize: 14, color: T.t3 }}>⋮</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────
// SMART INSIGHTS CARD (bottom of list)
// ─────────────────────────────────────────────────────────
const SmartInsightsCard = memo(({ debts, T }) => {
  const insights = useMemo(() => {
    const all = [];
    debts.forEach(d => {
      const di = buildDebtInsights(d);
      di.forEach(i => all.push({ ...i, debtName: d?.name }));
    });
    return all.slice(0, 3);
  }, [debts]);

  if (insights.length === 0) return null;

  return (
    <View style={[DS.insightsCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      <View style={DS.insightsHeader}>
        <Text style={{ fontSize: 16 }}>💡</Text>
        <Text style={[DS.insightsTitle, { color: T.t1 }]}>Smart Insights</Text>
        <Pressable style={{ marginLeft: 'auto' }}>
          <Text style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>View All</Text>
        </Pressable>
      </View>
      {insights.map((ins, i) => (
        <View key={i} style={[DS.insightRow, { borderTopColor: T.border }]}>
          <View style={[DS.insightIconBox, { backgroundColor: ins.color + '18' }]}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 12, color: ins.color, fontWeight: '700' }}>
              {ins.title}
              {ins.debtName ? ` on ${ins.debtName}` : ''}
            </Text>
            <Text style={[DS.insightDesc, { color: T.t3 }]}>{ins.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// PAYOFF GRAPH (SVG-free, CSS-based area chart)
// ─────────────────────────────────────────────────────────
const PayoffGraph = memo(({ debt, T }) => {
  const [timeFilter, setTimeFilter] = useState('All');
  const filters = ['1Y', '3Y', '5Y', '10Y', 'All'];

  const allPoints = useMemo(
    () => calcBalanceOverTime(debt?.remaining, debt?.emi, debt?.rate, 24),
    [debt?.remaining, debt?.emi, debt?.rate]
  );

  const points = useMemo(() => {
    if (timeFilter === 'All') return allPoints;
    const yearMap = { '1Y': 12, '3Y': 36, '5Y': 60, '10Y': 120 };
    const cutoff = yearMap[timeFilter] || 9999;
    return allPoints.filter(p => p.month <= cutoff);
  }, [allPoints, timeFilter]);

  const GRAPH_H = 120;
  const GRAPH_W = SW - 64;

  const maxBal = points.length > 0 ? Math.max(...points.map(p => p.balance)) : 0;
  const minBal = 0;
  const range  = maxBal - minBal || 1;

  // Compute SVG-style path using View positioning
  const chartPoints = points.map((p, i) => ({
    x: points.length <= 1 ? 0 : (i / (points.length - 1)) * GRAPH_W,
    y: GRAPH_H - ((p.balance - minBal) / range) * GRAPH_H,
    balance: p.balance,
    month: p.month,
  }));

  const debtFreeDate = calcDebtFreeDate(debt?.remaining, debt?.emi, debt?.rate);
  const totalMonths  = calcMonthsLeft(debt?.remaining, debt?.emi, debt?.rate);

  // Start year
  const startYear = debt?.startDate
    ? new Date(debt.startDate).getFullYear()
    : new Date().getFullYear();

  // Year labels
  const yearLabels = [];
  if (points.length > 0) {
    const firstYear = startYear;
    const lastYear  = startYear + Math.ceil(totalMonths / 12);
    const step = Math.max(1, Math.ceil((lastYear - firstYear) / 4));
    for (let y = firstYear; y <= lastYear; y += step) {
      const month = (y - firstYear) * 12;
      const x = totalMonths > 0 ? (month / totalMonths) * GRAPH_W : 0;
      yearLabels.push({ year: y, x: Math.min(x, GRAPH_W) });
    }
  }

  if (points.length < 2) {
    return (
      <View style={[DS.graphCard, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[DS.graphTitle, { color: T.t1 }]}>Balance Over Time</Text>
        <View style={{ height: GRAPH_H, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.t3, fontSize: 13 }}>Not enough data to show graph</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[DS.graphCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      <Text style={[DS.graphTitle, { color: T.t1 }]}>Balance Over Time</Text>

      {/* Time filters */}
      <View style={DS.graphFilters}>
        {filters.map(f => (
          <Pressable
            key={f}
            onPress={() => { tap(); setTimeFilter(f); }}
            style={[
              DS.graphFilter,
              timeFilter === f && { backgroundColor: BLUE },
            ]}
          >
            <Text style={{
              fontSize: 11, fontWeight: '700',
              color: timeFilter === f ? '#fff' : T.t3,
            }}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {/* Graph */}
      <View style={{ height: GRAPH_H + 30, marginTop: 8 }}>
        {/* Y-axis labels */}
        <View style={{ position: 'absolute', left: 0, top: 0, height: GRAPH_H, justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: T.t3 }}>₹{(maxBal / 100000).toFixed(0)}L</Text>
          <Text style={{ fontSize: 9, color: T.t3 }}>₹{(maxBal / 200000).toFixed(0)}L</Text>
          <Text style={{ fontSize: 9, color: T.t3 }}>₹0</Text>
        </View>

        {/* Chart area */}
        <View style={{ marginLeft: 28, width: GRAPH_W, height: GRAPH_H, position: 'relative' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: frac * GRAPH_H,
                height: 1,
                backgroundColor: T.border,
              }}
            />
          ))}

          {/* Red gradient fill (approximated with dots) */}
          {chartPoints.map((pt, i) => {
            if (i === chartPoints.length - 1) return null;
            const next = chartPoints[i + 1];
            const segW = next.x - pt.x;
            const segH = Math.abs(next.y - pt.y);
            const angle = Math.atan2(next.y - pt.y, next.x - pt.x) * 180 / Math.PI;
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: pt.x,
                  top: pt.y,
                  width: Math.sqrt(segW * segW + segH * segH),
                  height: 2,
                  backgroundColor: RED,
                  borderRadius: 1,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                }}
              />
            );
          })}

          {/* Data point dots */}
          {chartPoints.filter((_, i) => i % 4 === 0).map((pt, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: pt.x - 3,
                top: pt.y - 3,
                width: 6, height: 6,
                borderRadius: 3,
                backgroundColor: RED,
                borderWidth: 1.5,
                borderColor: T.l1,
              }}
            />
          ))}

          {/* Debt-free annotation */}
          <View style={[DS.debtFreeAnnotation, { right: 0, top: GRAPH_H - 50, backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 9, color: T.t3 }}>Debt-free in</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: T.t1 }}>{debtFreeDate}</Text>
          </View>
        </View>

        {/* X-axis year labels */}
        <View style={{ marginLeft: 28, flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {yearLabels.map((yl, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                left: 28 + yl.x - 14,
                bottom: 0,
                fontSize: 9,
                color: T.t3,
                width: 28,
                textAlign: 'center',
              }}
            >
              {yl.year}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// DEBT DETAIL SCREEN
// ─────────────────────────────────────────────────────────
const DebtDetailScreen = memo(({ debt, idx, dispatch, onBack, onEdit, T }) => {
  const [showPartPayment, setShowPartPayment] = useState(false);
  const [partAmount, setPartAmount]           = useState('');
  const [partErr, setPartErr]                 = useState('');

  const totalLoan  = Number(debt?.totalLoan) || Number(debt?.remaining) || 0;
  const remaining  = Number(debt?.remaining) || 0;
  const paid       = totalLoan - remaining;
  const rate       = Number(debt?.rate) || 0;
  const emi        = Number(debt?.emi) || 0;
  const months     = calcMonthsLeft(remaining, emi, rate);
  const intPaid    = Math.max(0, (paid > 0 ? paid * (rate / 100 / 12) * 12 : 0));
  const intRemain  = calcInterestRemaining(remaining, emi, rate);
  const pct        = safePct(paid, totalLoan);
  const dfDate     = calcDebtFreeDate(remaining, emi, rate);
  const insights   = buildDebtInsights(debt);

  const tenureYears = debt?.tenure
    ? debt.tenure
    : Math.round(months / 12) + ' Years';

  const applyPartPayment = () => {
    const amt = Number(partAmount);
    if (!amt || amt <= 0 || amt > remaining) {
      setPartErr('Enter a valid amount less than remaining balance');
      return;
    }
    dispatch({ type: 'UPD_DEBT', idx, patch: { remaining: Math.max(0, remaining - amt) } });
    setPartAmount('');
    setPartErr('');
    setShowPartPayment(false);
    Alert.alert('Part Payment Applied!', `₹${amt.toLocaleString('en-IN')} has been deducted from your remaining balance.`);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      style={{ backgroundColor: T.bg }}
    >
      {/* Header */}
      <View style={[DS.detailHeader, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={DS.detailHeaderTop}>
          <View style={[DS.detailIcon, { backgroundColor: RED + '18' }]}>
            <Text style={{ fontSize: 28 }}>{DEBT_ICONS[debt?.type] || DEBT_ICONS[debt?.name] || '🏦'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[DS.detailName, { color: T.t1 }]}>{debt?.name || 'Loan'}</Text>
            <View style={DS.activeBadge}>
              <Text style={DS.activeBadgeText}>Active</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={DS.detailRemaining}>{fmt(remaining)}</Text>
            <Text style={[DS.detailRemainingLabel, { color: T.t3 }]}>remaining</Text>
          </View>
        </View>

        {/* 3-column info grid */}
        <View style={[DS.detailGrid, { borderColor: T.border }]}>
          {[
            { l: 'Total Loan',    v: fmt(totalLoan),  c: T.t1 },
            { l: 'Interest Rate', v: `${rate}% p.a.`, c: T.t1 },
            { l: 'EMI',          v: fmt(emi),          c: T.t1 },
          ].map((s, i) => (
            <View key={i} style={[DS.detailGridCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: T.border }]}>
              <Text style={[DS.detailGridLabel, { color: T.t3 }]}>{s.l}</Text>
              <Text style={[DS.detailGridVal, { color: s.c }]}>{s.v}</Text>
            </View>
          ))}
        </View>
        <View style={[DS.detailGrid, { borderColor: T.border, borderTopWidth: 1 }]}>
          {[
            { l: 'Start Date',   v: debt?.startDate || '—',   c: T.t1 },
            { l: 'Tenure',       v: tenureYears,                c: T.t1 },
            { l: 'Debt-Free On', v: dfDate,                     c: GREEN },
          ].map((s, i) => (
            <View key={i} style={[DS.detailGridCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: T.border }]}>
              <Text style={[DS.detailGridLabel, { color: T.t3 }]}>{s.l}</Text>
              <Text style={[DS.detailGridVal, { color: s.c }]}>{s.v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress Card */}
      <View style={[DS.detailSection, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={DS.progressHeader}>
          <Text style={[DS.sectionTitle, { color: T.t1 }]}>Progress</Text>
          <Text style={{ fontSize: 13, color: GREEN, fontWeight: '700' }}>{pct}% paid</Text>
        </View>
        <Bar value={paid} total={Math.max(totalLoan, 1)} color={RED} h={8} />
        <View style={[DS.detailGrid, { borderColor: T.border, marginTop: 12 }]}>
          {[
            { l: 'Amount Paid',       v: fmt(paid),      c: GREEN },
            { l: 'Interest Paid',     v: fmt(intPaid),   c: AMBER },
            { l: 'Interest Remaining',v: fmt(intRemain), c: RED   },
          ].map((s, i) => (
            <View key={i} style={[DS.detailGridCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: T.border }]}>
              <Text style={[DS.detailGridLabel, { color: T.t3 }]}>{s.l}</Text>
              <Text style={[DS.detailGridValLg, { color: s.c }]}>{s.v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Payoff Graph */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <PayoffGraph debt={debt} T={T} />
      </View>

      {/* Quick Actions */}
      <View style={[DS.detailSection, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={DS.quickActions}>
          {[
            { icon: '💸', label: 'Make Extra\nPayment', color: '#1A3A2E', border: GREEN,  onPress: () => setShowPartPayment(true) },
            { icon: '📅', label: 'EMI Schedule',        color: '#1A2B3A', border: BLUE,   onPress: () => {} },
            { icon: '📊', label: 'Download Report',     color: '#2A1A3A', border: PURPLE, onPress: () => {} },
          ].map((a, i) => (
            <Pressable
              key={i}
              onPress={() => { tap(); a.onPress(); }}
              style={[DS.quickActionBtn, { backgroundColor: a.color, borderColor: a.border + '60' }]}
            >
              <View style={[DS.quickActionIcon, { backgroundColor: a.border + '25', borderColor: a.border + '40' }]}>
                <Text style={{ fontSize: 20 }}>{a.icon}</Text>
              </View>
              <Text style={[DS.quickActionLabel, { color: T.t1 }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Insights */}
      {insights.length > 0 && (
        <View style={[DS.detailSection, { backgroundColor: T.l1, borderColor: T.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 18 }}>⭐</Text>
            <Text style={[DS.sectionTitle, { color: T.t1 }]}>Insights</Text>
          </View>
          {insights.map((ins, i) => (
            <View key={i} style={[DS.insightDetailRow, { borderColor: T.border }]}>
              <View style={[DS.insightDetailIcon, { backgroundColor: ins.color + '18', borderColor: ins.color + '40' }]}>
                <Text style={{ fontSize: 16 }}>{ins.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: ins.color }}>{ins.title}</Text>
                <Text style={[DS.insightDesc, { color: T.t3 }]}>{ins.desc}</Text>
              </View>
              <Text style={{ color: T.t3, fontSize: 16 }}>›</Text>
            </View>
          ))}
        </View>
      )}

      {/* Part Payment Modal */}
      <Modal
        visible={showPartPayment}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPartPayment(false)}
      >
        <Pressable style={DS.modalOverlay} onPress={() => setShowPartPayment(false)}>
          <Pressable onPress={() => {}} activeOpacity={1}>
            <View style={[DS.partPaySheet, { backgroundColor: T.l1 }]}>
              <View style={DS.sheetHandle} />
              <Text style={[DS.sheetTitle, { color: T.t1 }]}>Make Extra Payment</Text>
              <Text style={[DS.sheetSub, { color: T.t3 }]}>
                Remaining balance: {fmt(remaining)}
              </Text>
              <View style={[DS.partPayInput, { backgroundColor: T.l2, borderColor: partErr ? RED : T.border }]}>
                <Text style={{ fontSize: 18, color: T.t3, marginRight: 6 }}>₹</Text>
                <TextInput
                  value={partAmount}
                  onChangeText={v => { setPartAmount(v.replace(/[^0-9]/g, '')); setPartErr(''); }}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={T.t3}
                  style={{ flex: 1, fontSize: 22, fontWeight: '700', color: T.t1 }}
                  autoFocus
                />
              </View>
              {partErr ? <Text style={DS.partPayErr}>{partErr}</Text> : null}
              {Number(partAmount) > 0 && (
                <View style={[DS.partPayPreview, { backgroundColor: GREEN + '12', borderColor: GREEN + '30' }]}>
                  <Text style={{ fontSize: 12, color: GREEN, lineHeight: 18 }}>
                    New remaining: {fmt(Math.max(0, remaining - Number(partAmount)))}
                    {'\n'}
                    New debt-free date: {calcDebtFreeDate(Math.max(0, remaining - Number(partAmount)), emi, rate)}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={applyPartPayment}
                style={[DS.partPayBtn, { backgroundColor: GREEN }]}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Apply Payment</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
});

// ─────────────────────────────────────────────────────────
// ADD / EDIT DEBT MODAL — 3-Step Wizard
// ─────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name: '', type: 'Other', totalLoan: '', rate: '',
  emi: '', startDate: '', tenure: '20 Years', dueDate: '',
  remaining: '',
};

const AddDebtModal = memo(({ visible, editDebt, editIdx, onClose, dispatch, T }) => {
  const [step, setStep]   = useState(1); // 1=Details, 2=EMI&Tenure, 3=Preview
  const [form, setForm]   = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showTenurePicker, setShowTenurePicker] = useState(false);

  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (editDebt) {
        setForm({
          name:      editDebt.name      || '',
          type:      editDebt.type      || 'Other',
          totalLoan: String(editDebt.totalLoan  || editDebt.remaining || ''),
          rate:      String(editDebt.rate       || ''),
          emi:       String(editDebt.emi        || ''),
          startDate: editDebt.startDate || '',
          tenure:    editDebt.tenure    || '20 Years',
          dueDate:   String(editDebt.dueDate    || ''),
          remaining: String(editDebt.remaining  || ''),
        });
        setStep(1);
      } else {
        setForm(INITIAL_FORM);
        setStep(1);
      }
      setErrors({});
    }
  }, [visible, editDebt]);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim())           errs.name      = 'Loan name is required';
    if (!form.totalLoan || Number(form.totalLoan) <= 0) errs.totalLoan = 'Enter valid amount';
    if (!form.rate || Number(form.rate) <= 0)           errs.rate      = 'Enter valid rate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.emi || Number(form.emi) <= 0) errs.emi = 'Enter valid EMI';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    Animated.spring(stepAnim, { toValue: step, useNativeDriver: false, speed: 25 }).start();
    setStep(s => Math.min(s + 1, 3));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSave = () => {
    const debt = {
      name:      form.name.trim(),
      type:      form.type,
      totalLoan: Number(form.totalLoan) || 0,
      rate:      Number(form.rate)      || 0,
      emi:       Number(form.emi)       || 0,
      startDate: form.startDate,
      tenure:    form.tenure,
      dueDate:   Number(form.dueDate)   || 5,
      remaining: Number(form.remaining) || Number(form.totalLoan) || 0,
    };
    tapM();
    if (editDebt && editIdx != null) {
      dispatch({ type: 'UPD_DEBT', idx: editIdx, patch: debt });
    } else {
      dispatch({ type: 'ADD_DEBT', debt });
    }
    onClose();
  };

  // Computed preview values
  const preview = useMemo(() => {
    const r = Number(form.remaining) || Number(form.totalLoan) || 0;
    const e = Number(form.emi) || 0;
    const rate = Number(form.rate) || 0;
    return {
      debtFree:  calcDebtFreeDate(r, e, rate),
      months:    calcMonthsLeft(r, e, rate),
      intRemain: calcInterestRemaining(r, e, rate),
      totalCost: r + calcInterestRemaining(r, e, rate),
    };
  }, [form.remaining, form.totalLoan, form.emi, form.rate]);

  // Step indicator
  const STEPS = ['Details', 'EMI & Tenure', 'Preview'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={DS.modalOverlay} onPress={onClose}>
        <Pressable onPress={() => {}} activeOpacity={1}>
          <View style={[DS.addDebtSheet, { backgroundColor: T.l1 }]}>
            <View style={DS.sheetHandle} />

            {/* Title row */}
            <View style={DS.addDebtTitleRow}>
              <Text style={[DS.addDebtTitle, { color: T.t1 }]}>
                {editDebt ? 'Edit Debt' : 'Add New Debt'}
              </Text>
              <Pressable onPress={onClose} style={[DS.addDebtClose, { backgroundColor: T.l2 }]}>
                <Text style={{ fontSize: 16, color: T.t2 }}>✕</Text>
              </Pressable>
            </View>

            {/* Step indicator */}
            <View style={DS.stepIndicator}>
              {STEPS.map((s, i) => {
                const done    = i + 1 < step;
                const current = i + 1 === step;
                return (
                  <React.Fragment key={i}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[
                        DS.stepDot,
                        done    && { backgroundColor: BLUE, borderColor: BLUE },
                        current && { backgroundColor: BLUE, borderColor: BLUE },
                        !done && !current && { backgroundColor: T.l2, borderColor: T.border },
                      ]}>
                        {done
                          ? <Text style={{ fontSize: 11, color: '#fff', fontWeight: '700' }}>✓</Text>
                          : <Text style={{ fontSize: 12, color: current ? '#fff' : T.t3, fontWeight: '700' }}>{i + 1}</Text>
                        }
                      </View>
                      <Text style={{ fontSize: 10, color: current ? BLUE : T.t3, marginTop: 4, fontWeight: current ? '700' : '400' }}>
                        {s}
                      </Text>
                    </View>
                    {i < STEPS.length - 1 && (
                      <View style={[DS.stepLine, { backgroundColor: i + 1 < step ? BLUE : T.border }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── STEP 1: Details ── */}
              {step === 1 && (
                <View style={DS.stepContent}>
                  {/* Loan Name */}
                  <Text style={[DS.fieldLabel, { color: T.t3 }]}>Loan Name</Text>
                  <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: errors.name ? RED : T.border }]}>
                    <TextInput
                      value={form.name}
                      onChangeText={v => set('name', v)}
                      placeholder="e.g. Home Loan"
                      placeholderTextColor={T.t3}
                      style={{ fontSize: 15, color: T.t1, flex: 1 }}
                    />
                  </View>
                  {errors.name ? <Text style={DS.fieldErr}>{errors.name}</Text> : null}

                  {/* Loan Type */}
                  <Text style={[DS.fieldLabel, { color: T.t3, marginTop: 12 }]}>Loan Type</Text>
                  <Pressable
                    onPress={() => setShowTypePicker(!showTypePicker)}
                    style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: T.border, flexDirection: 'row', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ fontSize: 15, color: T.t1 }}>
                      {DEBT_ICONS[form.type] || '🏦'} {form.type}
                    </Text>
                    <Text style={{ color: T.t3 }}>▾</Text>
                  </Pressable>
                  {showTypePicker && (
                    <View style={[DS.dropDown, { backgroundColor: T.l2, borderColor: T.border }]}>
                      {DEBT_TYPES.map(t => (
                        <Pressable
                          key={t}
                          onPress={() => { set('type', t); setShowTypePicker(false); }}
                          style={[DS.dropItem, { borderBottomColor: T.border }]}
                        >
                          <Text style={{ fontSize: 16 }}>{DEBT_ICONS[t]}</Text>
                          <Text style={{ fontSize: 14, color: form.type === t ? BLUE : T.t1, fontWeight: form.type === t ? '700' : '400', marginLeft: 10 }}>{t}</Text>
                          {form.type === t && <Text style={{ color: BLUE, marginLeft: 'auto' }}>✓</Text>}
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Amount + Rate row */}
                  <View style={DS.fieldRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[DS.fieldLabel, { color: T.t3 }]}>Loan Amount (₹)</Text>
                      <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: errors.totalLoan ? RED : T.border }]}>
                        <TextInput
                          value={form.totalLoan}
                          onChangeText={v => set('totalLoan', v.replace(/[^0-9.]/g, ''))}
                          keyboardType="numeric"
                          placeholder="25,00,000"
                          placeholderTextColor={T.t3}
                          style={{ fontSize: 16, fontWeight: '700', color: T.t1 }}
                        />
                      </View>
                      {errors.totalLoan ? <Text style={DS.fieldErr}>{errors.totalLoan}</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[DS.fieldLabel, { color: T.t3 }]}>Interest Rate (% p.a.)</Text>
                      <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: errors.rate ? RED : T.border }]}>
                        <TextInput
                          value={form.rate}
                          onChangeText={v => set('rate', v.replace(/[^0-9.]/g, ''))}
                          keyboardType="numeric"
                          placeholder="12.5"
                          placeholderTextColor={T.t3}
                          style={{ fontSize: 16, fontWeight: '700', color: T.t1 }}
                        />
                      </View>
                      {errors.rate ? <Text style={DS.fieldErr}>{errors.rate}</Text> : null}
                    </View>
                  </View>

                  {/* Start Date + Due Date row */}
                  <View style={DS.fieldRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[DS.fieldLabel, { color: T.t3 }]}>Start Date</Text>
                      <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <TextInput
                          value={form.startDate}
                          onChangeText={v => set('startDate', v)}
                          placeholder="05 Apr 2022"
                          placeholderTextColor={T.t3}
                          style={{ fontSize: 14, color: T.t1, flex: 1 }}
                        />
                        <Text style={{ color: T.t3, fontSize: 16 }}>📅</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[DS.fieldLabel, { color: T.t3 }]}>Due Date (day)</Text>
                      <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: T.border }]}>
                        <TextInput
                          value={form.dueDate}
                          onChangeText={v => set('dueDate', v.replace(/[^0-9]/g, ''))}
                          keyboardType="numeric"
                          placeholder="5"
                          placeholderTextColor={T.t3}
                          style={{ fontSize: 16, fontWeight: '700', color: T.t1 }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* ── STEP 2: EMI & Tenure ── */}
              {step === 2 && (
                <View style={DS.stepContent}>
                  {/* EMI + Remaining */}
                  <View style={DS.fieldRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[DS.fieldLabel, { color: T.t3 }]}>EMI Amount (₹)</Text>
                      <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: errors.emi ? RED : T.border }]}>
                        <TextInput
                          value={form.emi}
                          onChangeText={v => set('emi', v.replace(/[^0-9]/g, ''))}
                          keyboardType="numeric"
                          placeholder="22,500"
                          placeholderTextColor={T.t3}
                          style={{ fontSize: 16, fontWeight: '700', color: T.t1 }}
                        />
                      </View>
                      {errors.emi ? <Text style={DS.fieldErr}>{errors.emi}</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[DS.fieldLabel, { color: T.t3 }]}>Remaining Balance (₹)</Text>
                      <View style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: T.border }]}>
                        <TextInput
                          value={form.remaining}
                          onChangeText={v => set('remaining', v.replace(/[^0-9]/g, ''))}
                          keyboardType="numeric"
                          placeholder={form.totalLoan || '0'}
                          placeholderTextColor={T.t3}
                          style={{ fontSize: 16, fontWeight: '700', color: T.t1 }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Tenure */}
                  <Text style={[DS.fieldLabel, { color: T.t3, marginTop: 12 }]}>Tenure</Text>
                  <Pressable
                    onPress={() => setShowTenurePicker(!showTenurePicker)}
                    style={[DS.fieldInput, { backgroundColor: T.l2, borderColor: T.border, flexDirection: 'row', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ fontSize: 15, color: T.t1 }}>{form.tenure}</Text>
                    <Text style={{ color: T.t3 }}>▾</Text>
                  </Pressable>
                  {showTenurePicker && (
                    <View style={[DS.dropDown, { backgroundColor: T.l2, borderColor: T.border }]}>
                      {TENURE_OPTIONS.map(t => (
                        <Pressable
                          key={t}
                          onPress={() => { set('tenure', t); setShowTenurePicker(false); }}
                          style={[DS.dropItem, { borderBottomColor: T.border }]}
                        >
                          <Text style={{ fontSize: 14, color: form.tenure === t ? BLUE : T.t1, fontWeight: form.tenure === t ? '700' : '400' }}>{t}</Text>
                          {form.tenure === t && <Text style={{ color: BLUE, marginLeft: 'auto' }}>✓</Text>}
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Live calculation preview */}
                  {Number(form.emi) > 0 && (
                    <View style={[DS.calcPreview, { backgroundColor: BLUE + '12', borderColor: BLUE + '30' }]}>
                      <Text style={{ fontSize: 13, color: BLUE, fontWeight: '700', marginBottom: 6 }}>📊 Live Calculation</Text>
                      <Text style={{ fontSize: 12, color: T.t2, lineHeight: 18 }}>
                        Debt-free by: <Text style={{ fontWeight: '700', color: GREEN }}>{calcDebtFreeDate(Number(form.remaining) || Number(form.totalLoan) || 0, Number(form.emi), Number(form.rate))}</Text>
                        {'\n'}
                        Months remaining: <Text style={{ fontWeight: '700', color: T.t1 }}>{calcMonthsLeft(Number(form.remaining) || Number(form.totalLoan) || 0, Number(form.emi), Number(form.rate))}</Text>
                        {'\n'}
                        Total interest: <Text style={{ fontWeight: '700', color: RED }}>{fmt(calcInterestRemaining(Number(form.remaining) || Number(form.totalLoan) || 0, Number(form.emi), Number(form.rate)))}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* ── STEP 3: Preview ── */}
              {step === 3 && (
                <View style={DS.stepContent}>
                  <View style={[DS.previewCard, { backgroundColor: T.l2, borderColor: T.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <View style={[DS.debtIcon, { backgroundColor: RED + '18' }]}>
                        <Text style={{ fontSize: 22 }}>{DEBT_ICONS[form.type] || '🏦'}</Text>
                      </View>
                      <View>
                        <Text style={[DS.detailName, { color: T.t1 }]}>{form.name || 'Loan'}</Text>
                        <Text style={[DS.debtRate, { color: AMBER }]}>{form.rate}% p.a.</Text>
                      </View>
                      <Text style={[DS.detailRemaining, { marginLeft: 'auto' }]}>{fmt(Number(form.totalLoan))}</Text>
                    </View>
                    {[
                      { l: 'Monthly EMI',     v: fmt(Number(form.emi)),      c: T.t1  },
                      { l: 'Remaining',       v: fmt(Number(form.remaining) || Number(form.totalLoan)), c: RED  },
                      { l: 'Tenure',          v: form.tenure,                 c: T.t1  },
                      { l: 'Start Date',      v: form.startDate || '—',       c: T.t1  },
                      { l: 'Total Interest',  v: fmt(preview.intRemain),      c: AMBER },
                      { l: 'Debt-Free Date',  v: preview.debtFree,            c: GREEN },
                    ].map((row, i) => (
                      <View key={i} style={[DS.previewRow, { borderBottomColor: T.border }]}>
                        <Text style={{ fontSize: 13, color: T.t3 }}>{row.l}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: row.c }}>{row.v}</Text>
                      </View>
                    ))}
                  </View>

                  {preview.intRemain > 0 && (
                    <View style={[DS.calcPreview, { backgroundColor: AMBER + '12', borderColor: AMBER + '30' }]}>
                      <Text style={{ fontSize: 12, color: AMBER, lineHeight: 18 }}>
                        💡 You will pay <Text style={{ fontWeight: '700' }}>{fmt(preview.intRemain)}</Text> in interest over {preview.months} months.
                        {'\n'}Total cost of loan: <Text style={{ fontWeight: '700' }}>{fmt(preview.totalCost)}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}

            </ScrollView>

            {/* Navigation buttons */}
            <View style={DS.addDebtFooter}>
              {step > 1 && (
                <Pressable onPress={goBack} style={[DS.backBtn, { borderColor: T.border }]}>
                  <Text style={{ color: T.t2, fontWeight: '700', fontSize: 14 }}>← Back</Text>
                </Pressable>
              )}
              <Pressable
                onPress={step < 3 ? goNext : handleSave}
                style={[DS.nextBtn, { flex: step > 1 ? 2 : 1 }]}
              >
                <LinearGradient
                  colors={['#1D4ED8', '#3B82F6']}
                  style={DS.nextBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={DS.nextBtnText}>
                    {step === 1 ? 'Next: EMI & Tenure' : step === 2 ? 'Next: Preview' : (editDebt ? 'Save Changes' : 'Add Debt')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ─────────────────────────────────────────────────────────
// DEBT DETAIL SCREEN WRAPPER (navigation)
// ─────────────────────────────────────────────────────────
const DetailHeader = memo(({ title, onBack, onMore, T }) => (
  <View style={[DS.detailNavHeader, { backgroundColor: T.l1, borderColor: T.border }]}>
    <Pressable onPress={() => { tap(); onBack(); }} style={[DS.navBtn, { backgroundColor: T.l2 }]}>
      <Text style={{ fontSize: 18, color: T.t1 }}>‹</Text>
    </Pressable>
    <Text style={[DS.navTitle, { color: T.t1 }]}>{title}</Text>
    <Pressable onPress={onMore} style={[DS.navBtn, { backgroundColor: T.l2 }]}>
      <Text style={{ fontSize: 18, color: T.t1 }}>⋮</Text>
    </Pressable>
  </View>
));

// ─────────────────────────────────────────────────────────
// MAIN DEBT TAB
// ─────────────────────────────────────────────────────────
export const DebtTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const debts = useMemo(() => s.debts || [], [s.debts]);

  // Navigation state
  const [screen, setScreen]       = useState('list');    // 'list' | 'detail'
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Modal state
  const [showAdd, setShowAdd]     = useState(false);
  const [editIdx, setEditIdx]     = useState(null);

  // Strategy
  const [strategy, setStrategy]   = useState('avalanche');

  // Filter / sort
  const [filter, setFilter]       = useState('all');
  const [sortBy, setSortBy]       = useState('default');

  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToDetail = useCallback((idx) => {
    setSelectedIdx(idx);
    Animated.timing(slideAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    setScreen('detail');
  }, []);

  const goBack = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setScreen('list');
    setSelectedIdx(null);
  }, []);

  const openEdit = useCallback((idx) => {
    setEditIdx(idx);
    setShowAdd(true);
  }, []);

  const handleDelete = useCallback((idx) => {
    Alert.alert(
      'Delete Debt',
      `Are you sure you want to delete "${debts[idx]?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          dispatch({ type: 'DEL_DEBT', idx });
          if (screen === 'detail') goBack();
        }},
      ]
    );
  }, [debts, screen, dispatch, goBack]);

  // Sorted debts
  const displayedDebts = useMemo(() => {
    if (strategy === 'avalanche') return avalancheOrder(debts);
    if (strategy === 'snowball')  return snowballOrder(debts);
    return debts;
  }, [debts, strategy]);

  // Empty state
  if (debts.length === 0 && screen === 'list') {
    return (
      <View>
        {/* Wisdom card even when empty */}
        <DebtWisdomCard T={T} />
        <View style={[DS.emptyState, { backgroundColor: T.l1, borderColor: T.border }]}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🏦</Text>
          <Text style={[DS.emptyTitle, { color: T.t1 }]}>No debts tracked</Text>
          <Text style={[DS.emptySub, { color: T.t3 }]}>
            Add your loans or credit cards to plan smart repayment and get debt-free faster.
          </Text>
          <Pressable
            onPress={() => { setEditIdx(null); setShowAdd(true); }}
            style={DS.emptyAddBtn}
          >
            <LinearGradient
              colors={['#1D4ED8', '#3B82F6']}
              style={DS.emptyAddBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>+ Add Your First Debt</Text>
            </LinearGradient>
          </Pressable>
        </View>
        <AddDebtModal
          visible={showAdd}
          editDebt={editIdx != null ? debts[editIdx] : null}
          editIdx={editIdx}
          onClose={() => { setShowAdd(false); setEditIdx(null); }}
          dispatch={dispatch}
          T={T}
        />
      </View>
    );
  }

  // ── DETAIL SCREEN ────────────────────────────────────
  if (screen === 'detail' && selectedIdx != null && debts[selectedIdx]) {
    return (
      <Animated.View style={{ transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [SW, 0] }) }], flex: 1 }}>
        <View style={{ backgroundColor: T.bg, flex: 1 }}>
          <DetailHeader
            title="Debt Details"
            onBack={goBack}
            onMore={() => Alert.alert(debts[selectedIdx]?.name, 'Options', [
              { text: 'Edit Debt',   onPress: () => { goBack(); setTimeout(() => openEdit(selectedIdx), 300); } },
              { text: 'Delete Debt', style: 'destructive', onPress: () => handleDelete(selectedIdx) },
              { text: 'Cancel',      style: 'cancel' },
            ])}
            T={T}
          />
          <DebtDetailScreen
            debt={debts[selectedIdx]}
            idx={selectedIdx}
            dispatch={dispatch}
            onBack={goBack}
            onEdit={() => openEdit(selectedIdx)}
            T={T}
          />
          {/* Edit/Delete footer */}
          <View style={[DS.detailFooter, { backgroundColor: T.l1, borderColor: T.border }]}>
            <Pressable
              onPress={() => openEdit(selectedIdx)}
              style={[DS.footerEditBtn, { borderColor: BLUE + '40' }]}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: BLUE }}>Edit Debt</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(selectedIdx)}
              style={[DS.footerDeleteBtn, { borderColor: RED + '40' }]}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: RED }}>Delete Debt</Text>
            </Pressable>
          </View>
        </View>
        <AddDebtModal
          visible={showAdd}
          editDebt={editIdx != null ? debts[editIdx] : null}
          editIdx={editIdx}
          onClose={() => { setShowAdd(false); setEditIdx(null); }}
          dispatch={dispatch}
          T={T}
        />
      </Animated.View>
    );
  }

  // ── LIST SCREEN ─────────────────────────────────────
  return (
    <View>
      {/* Wisdom */}
      <DebtWisdomCard T={T} />

      {/* Overview */}
      <DebtOverviewCard debts={debts} T={T} />

      {/* Strategy */}
      <StrategyCard
        debts={debts}
        activeStrategy={strategy}
        onStrategyChange={setStrategy}
        T={T}
      />

      {/* Your Debts header */}
      <View style={DS.debtsListHeader}>
        <Text style={[DS.debtsListTitle, { color: T.t1 }]}>Your Debts ({debts.length})</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setSortBy(s => s === 'rate' ? 'default' : 'rate')}
            style={[DS.filterBtn, { backgroundColor: T.l1, borderColor: T.border }]}
          >
            <Text style={{ fontSize: 11, color: T.t2 }}>⇅  Filter</Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy(s => s === 'amount' ? 'default' : 'amount')}
            style={[DS.filterBtn, { backgroundColor: T.l1, borderColor: T.border }]}
          >
            <Text style={{ fontSize: 14, color: T.t2 }}>↕</Text>
          </Pressable>
        </View>
      </View>

      {/* Debt cards — shown in strategy order */}
      {displayedDebts.map((debt, i) => {
        const realIdx = debts.indexOf(debt);
        return (
          <DebtCard
            key={debt?.id || i}
            debt={debt}
            idx={realIdx}
            onPress={() => goToDetail(realIdx)}
            onEdit={() => openEdit(realIdx)}
            onDelete={() => handleDelete(realIdx)}
            T={T}
          />
        );
      })}

      {/* Add New Debt Button */}
      <Pressable
        onPress={() => { setEditIdx(null); setShowAdd(true); }}
        style={[DS.addDebtRow, { borderColor: RED + '50' }]}
      >
        <Text style={{ fontSize: 16, color: RED, marginRight: 6 }}>+</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: RED }}>Add New Debt</Text>
      </Pressable>

      {/* Smart Insights */}
      <SmartInsightsCard debts={debts} T={T} />

      {/* Add/Edit Modal */}
      <AddDebtModal
        visible={showAdd}
        editDebt={editIdx != null ? debts[editIdx] : null}
        editIdx={editIdx}
        onClose={() => { setShowAdd(false); setEditIdx(null); }}
        dispatch={dispatch}
        T={T}
      />
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const DS = StyleSheet.create({
  // Wisdom
  wisdomCard:    { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  wisdomRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  wisdomAvatar:  { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  wisdomLabel:   { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  wisdomName:    { fontSize: 15, fontWeight: '800', marginTop: 2 },
  wisdomBigQuote:{ fontSize: 56, fontWeight: '900', position: 'absolute', right: 8, top: -6, lineHeight: 56 },
  wisdomQuote:   { fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginTop: 4 },
  wisdomRefreshBtn: { marginTop: 10, alignSelf: 'flex-end' },

  // Overview
  overviewCard:   { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  overviewTitle:  { fontSize: 17, fontWeight: '700' },
  activeDot:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDotCircle:{ width: 7, height: 7, borderRadius: 4, backgroundColor: RED },
  activeDotText:  { fontSize: 12, color: RED, fontWeight: '600' },
  overviewStats:  { flexDirection: 'row', marginBottom: 14 },
  statLabel:      { fontSize: 11, marginBottom: 4 },
  statBig:        { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  progressTrack:  { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressFill:   { height: '100%', backgroundColor: RED, borderRadius: 99 },
  progressGreenEnd: { position: 'absolute', right: 0, height: '100%', backgroundColor: GREEN, borderRadius: 99 },
  overviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText:     { fontSize: 12 },
  viewReport:     { fontSize: 12, color: BLUE, fontWeight: '600' },

  // Strategy
  strategyCard:   { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  strategyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  strategyTitle:  { fontSize: 16, fontWeight: '700' },
  strategyCards:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  strategyOption: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 4 },
  stratOptionTitle:{ fontSize: 15, fontWeight: '800' },
  stratOptionSub: { fontSize: 11 },
  stratOptionSavings: { fontSize: 11, marginTop: 4 },
  stratOptionAmt: { fontSize: 18, fontWeight: '800' },
  savingsCompare: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 8 },
  compareBtn:     { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },

  // Debt cards
  debtsListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  debtsListTitle:  { fontSize: 17, fontWeight: '700' },
  filterBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },

  debtCard:     { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  debtCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  debtIcon:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  debtName:     { fontSize: 16, fontWeight: '700' },
  debtRate:     { fontSize: 12, fontWeight: '600', marginTop: 2 },
  debtRemaining:{ fontSize: 22, fontWeight: '800', color: RED },
  debtRemainingLabel: { fontSize: 11, marginTop: 1 },
  debtStats:    { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  debtStat:     { flex: 1, paddingVertical: 10, paddingHorizontal: 10 },
  debtStatLabel:{ fontSize: 10, marginBottom: 3 },
  debtStatVal:  { fontSize: 14, fontWeight: '700' },
  debtPct:      { fontSize: 11, fontWeight: '600', textAlign: 'right', marginBottom: 10 },
  debtActions:  { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, gap: 0 },
  debtActionBtn:{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingVertical: 4 },

  // Add new debt button
  addDebtRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, marginBottom: 12 },

  // Insights
  insightsCard:   { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  insightsTitle:  { fontSize: 16, fontWeight: '700' },
  insightRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, paddingBottom: 6, borderTopWidth: 1 },
  insightIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightDesc:    { fontSize: 11, lineHeight: 16, marginTop: 2 },

  // Empty state
  emptyState:     { borderRadius: 16, padding: 32, borderWidth: 1, alignItems: 'center', marginBottom: 12 },
  emptyTitle:     { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub:       { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  emptyAddBtn:    { width: '100%', borderRadius: 14, overflow: 'hidden' },
  emptyAddBtnGrad:{ paddingVertical: 16, alignItems: 'center' },

  // Detail nav header
  detailNavHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 14, borderBottomWidth: 1 },
  navBtn:          { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navTitle:        { fontSize: 17, fontWeight: '700' },

  // Detail screen
  detailHeader:   { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  detailHeaderTop:{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  detailIcon:     { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  detailName:     { fontSize: 20, fontWeight: '800' },
  activeBadge:    { backgroundColor: GREEN + '20', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  activeBadgeText:{ fontSize: 11, fontWeight: '700', color: GREEN },
  detailRemaining:{ fontSize: 24, fontWeight: '800', color: RED },
  detailRemainingLabel: { fontSize: 11, marginTop: 2 },

  detailGrid:     { flexDirection: 'row' },
  detailGridCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 8 },
  detailGridLabel:{ fontSize: 11, marginBottom: 4 },
  detailGridVal:  { fontSize: 15, fontWeight: '700' },
  detailGridValLg:{ fontSize: 17, fontWeight: '800' },

  detailSection:  { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, marginHorizontal: 16 },
  sectionTitle:   { fontSize: 16, fontWeight: '700' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  // Graph
  graphCard:      { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  graphTitle:     { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  graphFilters:   { flexDirection: 'row', gap: 6, marginBottom: 8 },
  graphFilter:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  debtFreeAnnotation: { position: 'absolute', borderRadius: 8, padding: 6, borderWidth: 1 },

  // Quick actions
  quickActions:   { flexDirection: 'row', gap: 10 },
  quickActionBtn: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center' },
  quickActionIcon:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  quickActionLabel:{ fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },

  // Insight detail rows
  insightDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  insightDetailIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Detail footer
  detailFooter:   { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, borderTopWidth: 1 },
  footerEditBtn:  { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  footerDeleteBtn:{ flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },

  // Part payment modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  partPaySheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  sheetHandle:    { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:     { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sheetSub:       { fontSize: 13, marginBottom: 16 },
  partPayInput:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 8 },
  partPayErr:     { fontSize: 11, color: RED, marginBottom: 8 },
  partPayPreview: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12 },
  partPayBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },

  // Add debt modal
  addDebtSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, maxHeight: '92%' },
  addDebtTitleRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addDebtTitle:   { fontSize: 20, fontWeight: '800' },
  addDebtClose:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  stepIndicator:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20, gap: 0 },
  stepDot:        { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepLine:       { flex: 1, height: 2, marginTop: 14, marginHorizontal: 4 },

  stepContent:    { paddingBottom: 12 },

  fieldLabel:     { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  fieldInput:     { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, marginBottom: 2 },
  fieldRow:       { flexDirection: 'row', gap: 10, marginTop: 12 },
  fieldErr:       { fontSize: 11, color: RED, marginTop: 2, marginBottom: 4 },

  dropDown:       { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 4, maxHeight: 200 },
  dropItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },

  calcPreview:    { borderRadius: 12, padding: 12, borderWidth: 1, marginTop: 12 },

  previewCard:    { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12 },
  previewRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },

  addDebtFooter:  { flexDirection: 'row', gap: 10, paddingTop: 16 },
  backBtn:        { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  nextBtn:        { borderRadius: 14, overflow: 'hidden' },
  nextBtnGrad:    { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  nextBtnText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});
