// CalculatorsScreen.js
// Premium Financial Calculators Module for Growth Ledger
// ─────────────────────────────────────────────────────────────
import React, { useState, useMemo, useRef, useCallback, memo } from 'react';
import {
  View, Text, ScrollView, Pressable, Animated,
  StyleSheet, TextInput, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R, SHADOW as SDW } from './theme';
import { Card, GCard, Bar, SH, Btn, StatRow, Chip } from './UI';

const { width: SW } = Dimensions.get('window');
const haptic = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {} };
const fmt = (n) => {
  const num = Number(n);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return '₹' + Math.round(num).toLocaleString('en-IN');
};
const safe = (v, fb = 0) => { const n = parseFloat(v); return (isNaN(n) || n < 0) ? fb : n; };

// ─────────────────────────────────────────────────────────────
// ANIMATED NUMBER
// ─────────────────────────────────────────────────────────────
const AnimNum = memo(({ value, style, prefix = '₹' }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const prevRef = useRef(0);
  const [display, setDisplay] = useState(value);

  React.useEffect(() => {
    const from = prevRef.current;
    const to   = value;
    prevRef.current = to;
    anim.setValue(0);
    let raf;
    Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value: t }) => {
      const cur = from + (to - from) * t;
      setDisplay(cur);
    });
    return () => anim.removeListener(listener);
  }, [value]);

  const num = Number(display);
  const big = isNaN(num) ? '₹0' :
    num >= 10000000 ? `${prefix}${(num / 10000000).toFixed(2)}Cr` :
    num >= 100000   ? `${prefix}${(num / 100000).toFixed(2)}L` :
    num >= 1000     ? `${prefix}${(num / 1000).toFixed(1)}K` :
    `${prefix}${Math.round(num).toLocaleString('en-IN')}`;
  return <Text style={style}>{big}</Text>;
});

// ─────────────────────────────────────────────────────────────
// STEPPER INPUT
// ─────────────────────────────────────────────────────────────
const Stepper = memo(({ label, value, onChange, step = 1, min = 0, max = 9999999, prefix = '', suffix = '' }) => {
  const { T } = useTheme();
  const dec = () => { haptic(); onChange(Math.max(min, safe(value) - step)); };
  const inc = () => { haptic(); onChange(Math.min(max, safe(value) + step)); };
  return (
    <View style={[st.stepWrap, { backgroundColor: T.l2, borderColor: T.border }]}>
      <Text style={[st.stepLabel, { color: T.t3 }]}>{label}</Text>
      <View style={st.stepRow}>
        <Pressable onPress={dec} style={[st.stepBtn, { backgroundColor: T.l3 }]}>
          <Text style={[st.stepBtnTx, { color: T.t1 }]}>−</Text>
        </Pressable>
        <View style={st.stepCenter}>
          {prefix ? <Text style={[st.stepPfx, { color: T.t3 }]}>{prefix}</Text> : null}
          <TextInput
            value={String(value)}
            onChangeText={v => onChange(v === '' ? '' : safe(v, min))}
            keyboardType="numeric"
            style={[st.stepInput, { color: T.t1 }]}
          />
          {suffix ? <Text style={[st.stepSfx, { color: T.t3 }]}>{suffix}</Text> : null}
        </View>
        <Pressable onPress={inc} style={[st.stepBtn, { backgroundColor: T.blue }]}>
          <Text style={[st.stepBtnTx, { color: '#fff' }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// RESULT METRIC CARD
// ─────────────────────────────────────────────────────────────
const Metric = memo(({ label, value, color, sub }) => {
  const { T } = useTheme();
  return (
    <View style={[st.metric, { backgroundColor: (color || T.blue) + '14', borderColor: (color || T.blue) + '30' }]}>
      <Text style={[st.metricLabel, { color: T.t3 }]}>{label}</Text>
      <AnimNum value={safe(value)} style={[st.metricVal, { color: color || T.t1 }]} />
      {sub ? <Text style={[st.metricSub, { color: T.t3 }]}>{sub}</Text> : null}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// INSIGHT BANNER
// ─────────────────────────────────────────────────────────────
const Insight = memo(({ icon, text, color }) => {
  const { T } = useTheme();
  return (
    <View style={[st.insight, { backgroundColor: (color || T.blue) + '14', borderColor: (color || T.blue) + '30' }]}>
      <Text style={st.insightIcon}>{icon}</Text>
      <Text style={[st.insightText, { color: T.t2 }]}>{text}</Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// MINI BAR CHART
// ─────────────────────────────────────────────────────────────
const MiniBarChart = memo(({ data, color }) => {
  const { T } = useTheme();
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={st.miniChart}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * 60);
        return (
          <View key={i} style={st.miniBarWrap}>
            <View style={[st.miniBar, { height: h, backgroundColor: color || '#4F8CFF', opacity: 0.6 + (i / data.length) * 0.4 }]} />
            {d.label ? <Text style={[st.miniBarLabel, { color: T.t3 }]}>{d.label}</Text> : null}
          </View>
        );
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// CALCULATOR PILL TABS
// ─────────────────────────────────────────────────────────────
const CALCS = [
  { key: 'sip',        label: 'SIP',   icon: '📈' },
  { key: 'swp',        label: 'SWP',   icon: '💸' },
  { key: 'lumpsum',    label: 'Lump',  icon: '💰' },
  { key: 'emi',        label: 'EMI',   icon: '🏦' },
  { key: 'fd',         label: 'FD',    icon: '🔒' },
  { key: 'rd',         label: 'RD',    icon: '🪙' },
  { key: 'retirement', label: 'Retire',icon: '🏖️' },
  { key: 'fire',       label: 'FIRE',  icon: '🔥' },
];

const CalcTabs = memo(({ active, onChange }) => {
  const { T } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabsRow}>
      {CALCS.map(c => {
        const on = active === c.key;
        return (
          <Pressable key={c.key} onPress={() => { haptic(); onChange(c.key); }}>
            <View style={[st.tab, { backgroundColor: on ? T.blue : T.l2, borderColor: on ? T.blue : T.border }]}>
              <Text style={st.tabIcon}>{c.icon}</Text>
              <Text style={[st.tabLabel, { color: on ? '#fff' : T.t2, fontWeight: on ? '700' : '500' }]}>{c.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

// ─────────────────────────────────────────────────────────────
// 1. SIP CALCULATOR
// ─────────────────────────────────────────────────────────────
const SIPCalc = memo(() => {
  const { T } = useTheme();
  const [monthly, setMonthly]   = useState(5000);
  const [rate,    setRate]      = useState(12);
  const [years,   setYears]     = useState(10);
  const [stepup,  setStepup]    = useState(0);

  const result = useMemo(() => {
    const P = safe(monthly, 0);
    const r = safe(rate, 0) / 100 / 12;
    const n = safe(years, 1) * 12;
    const su = safe(stepup, 0) / 100;

    if (P === 0 || years === 0) return { invested: 0, returns: 0, corpus: 0, chart: [] };

    let corpus = 0;
    let totalInvested = 0;
    let curP = P;
    const chart = [];

    for (let y = 1; y <= safe(years, 1); y++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += curP;
        corpus = (corpus + curP) * (1 + r);
      }
      chart.push({ value: corpus, label: `Y${y}` });
      curP = curP * (1 + su);
    }

    return {
      invested: totalInvested,
      returns:  corpus - totalInvested,
      corpus,
      chart: chart.filter((_, i) => i % Math.max(1, Math.floor(chart.length / 8)) === 0),
    };
  }, [monthly, rate, years, stepup]);

  const insight = useMemo(() => {
    if (result.corpus <= 0) return null;
    const crYears = safe(years);
    const oneCr   = 10000000;
    if (result.corpus >= oneCr) {
      return `🎯 You'll build ₹${(result.corpus / oneCr).toFixed(1)}Cr in ${crYears} years!`;
    }
    const extra = Math.ceil((oneCr - result.corpus) / result.corpus * crYears);
    return `📅 Keep investing ${extra} more years to reach ₹1 Cr`;
  }, [result, years]);

  return (
    <View style={st.calcWrap}>
      <SH title="SIP Calculator" right="Monthly SIP" />
      <Stepper label="Monthly Investment" value={monthly} onChange={setMonthly} step={500} min={500} max={500000} prefix="₹" />
      <Stepper label="Expected Return" value={rate} onChange={setRate} step={0.5} min={1} max={30} suffix="% /yr" />
      <Stepper label="Time Period" value={years} onChange={setYears} step={1} min={1} max={40} suffix=" years" />
      <Stepper label="Annual Step-up" value={stepup} onChange={setStepup} step={1} min={0} max={30} suffix="%" />

      <View style={st.metricsGrid}>
        <Metric label="Invested"  value={result.invested} color={T.blue}  />
        <Metric label="Returns"   value={result.returns}  color={T.green} />
      </View>
      <View style={[st.corpusBox, { backgroundColor: T.green + '14', borderColor: T.green + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Final Corpus</Text>
        <AnimNum value={result.corpus} style={[st.corpusVal, { color: T.green }]} />
      </View>

      <Bar value={result.invested} total={result.corpus} color={T.blue} h={8} />
      <View style={[st.barLegend]}>
        <Text style={[st.barLegLabel, { color: T.t3 }]}>
          <Text style={{ color: T.blue }}>■ </Text>Invested {result.corpus > 0 ? Math.round(result.invested / result.corpus * 100) : 0}%
        </Text>
        <Text style={[st.barLegLabel, { color: T.t3 }]}>
          <Text style={{ color: T.green }}>■ </Text>Returns {result.corpus > 0 ? Math.round(result.returns / result.corpus * 100) : 0}%
        </Text>
      </View>

      {result.chart.length > 0 && <MiniBarChart data={result.chart} color={T.green} />}
      {insight && <Insight icon="💡" text={insight} color={T.green} />}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 2. SWP CALCULATOR
// ─────────────────────────────────────────────────────────────
const SWPCalc = memo(() => {
  const { T } = useTheme();
  const [lumpsum,    setLumpsum]    = useState(1000000);
  const [withdrawal, setWithdrawal] = useState(10000);
  const [rate,       setRate]       = useState(8);
  const [years,      setYears]      = useState(10);

  const result = useMemo(() => {
    const bal = safe(lumpsum, 0);
    const wd  = safe(withdrawal, 0);
    const r   = safe(rate, 0) / 100 / 12;
    const n   = safe(years, 1) * 12;

    if (bal === 0 || wd === 0) return { remaining: bal, totalWithdrawn: 0, exhaustMonth: null, chart: [] };

    let balance = bal;
    let totalWd = 0;
    let exhaustMonth = null;
    const chart = [];

    for (let m = 1; m <= n; m++) {
      balance = balance * (1 + r) - wd;
      totalWd += wd;
      if (balance <= 0 && !exhaustMonth) {
        exhaustMonth = m;
        balance = 0;
      }
      if (m % 12 === 0) {
        chart.push({ value: Math.max(0, balance), label: `Y${m / 12}` });
      }
      if (balance <= 0) break;
    }

    const exhaustYrs = exhaustMonth ? (exhaustMonth / 12).toFixed(1) : null;
    return {
      remaining:      Math.max(0, balance),
      totalWithdrawn: totalWd,
      exhaustMonth,
      exhaustYrs,
      sustainable:    !exhaustMonth,
      chart,
    };
  }, [lumpsum, withdrawal, rate, years]);

  return (
    <View style={st.calcWrap}>
      <SH title="SWP Calculator" right="Systematic Withdrawal" />
      <Stepper label="Initial Investment" value={lumpsum} onChange={setLumpsum} step={50000} min={10000} max={100000000} prefix="₹" />
      <Stepper label="Monthly Withdrawal" value={withdrawal} onChange={setWithdrawal} step={500} min={100} max={500000} prefix="₹" />
      <Stepper label="Expected Return" value={rate} onChange={setRate} step={0.5} min={1} max={20} suffix="% /yr" />
      <Stepper label="Duration" value={years} onChange={setYears} step={1} min={1} max={40} suffix=" years" />

      <View style={st.metricsGrid}>
        <Metric label="Total Withdrawn" value={result.totalWithdrawn} color={T.blue}  />
        <Metric label="Remaining"       value={result.remaining}      color={result.remaining > 0 ? T.green : T.red} />
      </View>

      {result.sustainable
        ? <Insight icon="✅" text={`Your corpus sustains all ${years} years of withdrawals with ₹${fmt(result.remaining)} remaining.`} color={T.green} />
        : <Insight icon="⚠️" text={`Corpus depletes in ${result.exhaustYrs} years. Reduce monthly withdrawal or increase return rate.`} color={T.red} />
      }

      {result.chart.length > 0 && (
        <MiniBarChart data={result.chart} color={result.sustainable ? T.green : T.red} />
      )}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 3. LUMPSUM CALCULATOR
// ─────────────────────────────────────────────────────────────
const LumpsumCalc = memo(() => {
  const { T } = useTheme();
  const [principal, setPrincipal] = useState(100000);
  const [rate,      setRate]      = useState(12);
  const [years,     setYears]     = useState(10);

  const result = useMemo(() => {
    const P = safe(principal, 0);
    const r = safe(rate, 0) / 100;
    const n = safe(years, 1);
    const corpus = Math.round(P * Math.pow(1 + r, n));
    const gained = corpus - P;
    const xGain  = P > 0 ? (corpus / P).toFixed(1) : '0';
    const chart  = Array.from({ length: n }, (_, i) => ({
      value: Math.round(P * Math.pow(1 + r, i + 1)),
      label: `Y${i + 1}`,
    })).filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 8)) === 0);
    return { corpus, gained, xGain, chart };
  }, [principal, rate, years]);

  return (
    <View style={st.calcWrap}>
      <SH title="Lumpsum Calculator" right="One-time Investment" />
      <Stepper label="Investment Amount" value={principal} onChange={setPrincipal} step={10000} min={1000} max={100000000} prefix="₹" />
      <Stepper label="Expected Return" value={rate} onChange={setRate} step={0.5} min={1} max={40} suffix="% /yr" />
      <Stepper label="Time Period" value={years} onChange={setYears} step={1} min={1} max={40} suffix=" years" />

      <View style={st.metricsGrid}>
        <Metric label="Invested"     value={principal}     color={T.blue}  />
        <Metric label="Wealth Gain"  value={result.gained} color={T.green} />
      </View>
      <View style={[st.corpusBox, { backgroundColor: T.green + '14', borderColor: T.green + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Final Value</Text>
        <AnimNum value={result.corpus} style={[st.corpusVal, { color: T.green }]} />
        <Chip label={`${result.xGain}x growth`} color={T.green} />
      </View>
      {result.chart.length > 0 && <MiniBarChart data={result.chart} color={T.green} />}
      <Insight icon="🚀" text={`₹${fmt(principal)} grows to ${fmt(result.corpus)} — a ${result.xGain}x return in ${years} years.`} color={T.green} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 4. EMI CALCULATOR
// ─────────────────────────────────────────────────────────────
const EMICalc = memo(() => {
  const { T } = useTheme();
  const [loan,    setLoan]    = useState(1000000);
  const [rate,    setRate]    = useState(8.5);
  const [tenure,  setTenure]  = useState(20);

  const result = useMemo(() => {
    const P = safe(loan, 0);
    const r = safe(rate, 0) / 100 / 12;
    const n = safe(tenure, 1) * 12;
    if (P === 0 || n === 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };
    const emi = r === 0 ? P / n : Math.round(P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    const totalPayment  = emi * n;
    const totalInterest = totalPayment - P;
    return { emi, totalPayment, totalInterest };
  }, [loan, rate, tenure]);

  return (
    <View style={st.calcWrap}>
      <SH title="EMI Calculator" right="Loan EMI" />
      <Stepper label="Loan Amount" value={loan} onChange={setLoan} step={50000} min={10000} max={100000000} prefix="₹" />
      <Stepper label="Interest Rate" value={rate} onChange={setRate} step={0.25} min={1} max={30} suffix="% /yr" />
      <Stepper label="Tenure" value={tenure} onChange={setTenure} step={1} min={1} max={30} suffix=" years" />

      <View style={[st.corpusBox, { backgroundColor: T.blue + '14', borderColor: T.blue + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Monthly EMI</Text>
        <AnimNum value={result.emi} style={[st.corpusVal, { color: T.blue }]} />
      </View>

      <View style={st.metricsGrid}>
        <Metric label="Principal"      value={loan}                 color={T.blue}  />
        <Metric label="Total Interest" value={result.totalInterest} color={T.red}   />
      </View>
      <Metric label="Total Payment" value={result.totalPayment} color={T.t1} />

      <Bar value={loan} total={result.totalPayment} color={T.blue} h={8} />
      <View style={st.barLegend}>
        <Text style={[st.barLegLabel, { color: T.t3 }]}>
          <Text style={{ color: T.blue }}>■ </Text>Principal {result.totalPayment > 0 ? Math.round(loan / result.totalPayment * 100) : 0}%
        </Text>
        <Text style={[st.barLegLabel, { color: T.t3 }]}>
          <Text style={{ color: T.red }}>■ </Text>Interest {result.totalPayment > 0 ? Math.round(result.totalInterest / result.totalPayment * 100) : 0}%
        </Text>
      </View>
      <Insight icon="💡" text={`You pay ₹${fmt(result.totalInterest)} as interest — ${result.totalPayment > 0 ? Math.round(result.totalInterest / loan * 100) : 0}% extra on your principal.`} color={T.amber} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 5. FD CALCULATOR
// ─────────────────────────────────────────────────────────────
const FDCalc = memo(() => {
  const { T } = useTheme();
  const [principal, setPrincipal] = useState(100000);
  const [rate,      setRate]      = useState(7);
  const [years,     setYears]     = useState(5);

  const result = useMemo(() => {
    const P = safe(principal, 0);
    const r = safe(rate, 0) / 100 / 4;   // quarterly compounding
    const n = safe(years, 1) * 4;
    const maturity = Math.round(P * Math.pow(1 + r, n));
    const interest = maturity - P;
    return { maturity, interest };
  }, [principal, rate, years]);

  return (
    <View style={st.calcWrap}>
      <SH title="FD Calculator" right="Fixed Deposit" />
      <Stepper label="Deposit Amount" value={principal} onChange={setPrincipal} step={10000} min={1000} max={100000000} prefix="₹" />
      <Stepper label="Interest Rate" value={rate} onChange={setRate} step={0.25} min={1} max={15} suffix="% /yr" />
      <Stepper label="Duration" value={years} onChange={setYears} step={1} min={1} max={20} suffix=" years" />

      <View style={st.metricsGrid}>
        <Metric label="Deposited"    value={principal}      color={T.blue}  />
        <Metric label="Interest Earned" value={result.interest} color={T.green} />
      </View>
      <View style={[st.corpusBox, { backgroundColor: T.green + '14', borderColor: T.green + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Maturity Amount</Text>
        <AnimNum value={result.maturity} style={[st.corpusVal, { color: T.green }]} />
      </View>
      <Insight icon="🔒" text={`Safe guaranteed returns of ₹${fmt(result.interest)} in ${years} years. (Quarterly compounding)`} color={T.blue} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 6. RD CALCULATOR
// ─────────────────────────────────────────────────────────────
const RDCalc = memo(() => {
  const { T } = useTheme();
  const [monthly, setMonthly] = useState(5000);
  const [rate,    setRate]    = useState(7);
  const [years,   setYears]   = useState(3);

  const result = useMemo(() => {
    const P = safe(monthly, 0);
    const r = safe(rate, 0) / 100 / 4;
    const n = safe(years, 1);
    // RD maturity: each monthly deposit compounds quarterly
    let maturity = 0;
    const totalMonths = n * 12;
    for (let m = 1; m <= totalMonths; m++) {
      const quartersRemaining = (totalMonths - m) / 3;
      maturity += P * Math.pow(1 + r, quartersRemaining);
    }
    maturity = Math.round(maturity);
    const invested = P * totalMonths;
    const interest = maturity - invested;
    return { maturity, invested, interest };
  }, [monthly, rate, years]);

  return (
    <View style={st.calcWrap}>
      <SH title="RD Calculator" right="Recurring Deposit" />
      <Stepper label="Monthly Deposit" value={monthly} onChange={setMonthly} step={500} min={100} max={500000} prefix="₹" />
      <Stepper label="Interest Rate" value={rate} onChange={setRate} step={0.25} min={1} max={15} suffix="% /yr" />
      <Stepper label="Duration" value={years} onChange={setYears} step={1} min={1} max={10} suffix=" years" />

      <View style={st.metricsGrid}>
        <Metric label="Total Invested"  value={result.invested}  color={T.blue}  />
        <Metric label="Interest Earned" value={result.interest}  color={T.green} />
      </View>
      <View style={[st.corpusBox, { backgroundColor: T.green + '14', borderColor: T.green + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Maturity Amount</Text>
        <AnimNum value={result.maturity} style={[st.corpusVal, { color: T.green }]} />
      </View>
      <Insight icon="🪙" text={`Your monthly ₹${fmt(monthly)} deposits grow to ₹${fmt(result.maturity)} — earn ₹${fmt(result.interest)} extra.`} color={T.green} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 7. RETIREMENT CALCULATOR
// ─────────────────────────────────────────────────────────────
const RetirementCalc = memo(() => {
  const { T } = useTheme();
  const [currentAge,     setCurrentAge]     = useState(28);
  const [retireAge,      setRetireAge]      = useState(60);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [inflation,      setInflation]      = useState(6);
  const [returnRate,     setReturnRate]     = useState(12);

  const result = useMemo(() => {
    const curAge  = safe(currentAge, 0);
    const retAge  = safe(retireAge, 0);
    const expense = safe(monthlyExpense, 0);
    const inf     = safe(inflation, 0) / 100;
    const ret     = safe(returnRate, 0) / 100;

    const yearsToRetire = Math.max(1, retAge - curAge);
    const postRetireYrs = 85 - retAge;

    // Inflation-adjusted monthly expense at retirement
    const futureExpense = expense * Math.pow(1 + inf, yearsToRetire);

    // Required corpus (25x annual expenses rule, adjusted)
    const annualExpense = futureExpense * 12;
    const realReturn    = ((1 + ret) / (1 + inf)) - 1;
    const requiredCorpus = realReturn > 0
      ? annualExpense * (1 - Math.pow(1 + realReturn, -postRetireYrs)) / realReturn
      : annualExpense * postRetireYrs;

    // Monthly SIP needed to reach corpus
    const r   = ret / 12;
    const n   = yearsToRetire * 12;
    const sip = r > 0
      ? Math.round(requiredCorpus * r / ((Math.pow(1 + r, n) - 1) * (1 + r)))
      : Math.round(requiredCorpus / n);

    return { yearsToRetire, futureExpense, requiredCorpus, sip, postRetireYrs };
  }, [currentAge, retireAge, monthlyExpense, inflation, returnRate]);

  return (
    <View style={st.calcWrap}>
      <SH title="Retirement Calculator" right="Plan your retirement" />
      <Stepper label="Current Age" value={currentAge} onChange={setCurrentAge} step={1} min={18} max={60} suffix=" yrs" />
      <Stepper label="Retirement Age" value={retireAge} onChange={setRetireAge} step={1} min={40} max={75} suffix=" yrs" />
      <Stepper label="Monthly Expenses" value={monthlyExpense} onChange={setMonthlyExpense} step={5000} min={5000} max={1000000} prefix="₹" />
      <Stepper label="Expected Inflation" value={inflation} onChange={setInflation} step={0.5} min={2} max={15} suffix="%" />
      <Stepper label="Investment Return" value={returnRate} onChange={setReturnRate} step={0.5} min={5} max={25} suffix="%" />

      <View style={st.metricsGrid}>
        <Metric label="Years to Retire" value={result.yearsToRetire} color={T.blue} sub="years" />
        <Metric label="Future Monthly Need" value={result.futureExpense} color={T.amber} />
      </View>
      <View style={[st.corpusBox, { backgroundColor: T.blue + '14', borderColor: T.blue + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Required Retirement Corpus</Text>
        <AnimNum value={result.requiredCorpus} style={[st.corpusVal, { color: T.blue }]} />
      </View>
      <View style={[st.corpusBox, { backgroundColor: T.green + '14', borderColor: T.green + '40', marginTop: SP.sm }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Start Investing Monthly</Text>
        <AnimNum value={result.sip} style={[st.corpusVal, { color: T.green }]} />
      </View>
      <Insight icon="🏖️" text={`Start investing ₹${fmt(result.sip)}/mo today to retire comfortably at ${retireAge} for ${result.postRetireYrs}+ years.`} color={T.blue} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// 8. FIRE CALCULATOR
// ─────────────────────────────────────────────────────────────
const FIRECalc = memo(() => {
  const { T } = useTheme();
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [savingsRate,    setSavingsRate]    = useState(40);
  const [returnRate,     setReturnRate]     = useState(10);
  const [currentAge,     setCurrentAge]     = useState(28);

  const result = useMemo(() => {
    const expense = safe(monthlyExpense, 0);
    const sRate   = safe(savingsRate, 0) / 100;
    const ret     = safe(returnRate, 0) / 100;

    if (sRate <= 0 || expense <= 0) return { fireCorpus: 0, yearsToFIRE: 0, fireAge: 0, monthlySavings: 0 };

    // 25x annual expenses = FIRE number (4% rule)
    const fireCorpus = expense * 12 * 25;
    const income     = sRate > 0 ? expense / (1 - sRate) : expense * 2;
    const monthly    = income * sRate;
    const r          = ret / 12;

    // Months to reach FIRE corpus
    let balance = 0;
    let months  = 0;
    while (balance < fireCorpus && months < 600) {
      balance = (balance + monthly) * (1 + r);
      months++;
    }
    const yearsToFIRE = Math.ceil(months / 12);
    const fireAge     = safe(currentAge) + yearsToFIRE;

    return { fireCorpus, yearsToFIRE, fireAge, monthlySavings: monthly };
  }, [monthlyExpense, savingsRate, returnRate, currentAge]);

  return (
    <View style={st.calcWrap}>
      <SH title="FIRE Calculator" right="Financial Independence" />
      <Stepper label="Monthly Expenses" value={monthlyExpense} onChange={setMonthlyExpense} step={5000} min={5000} max={1000000} prefix="₹" />
      <Stepper label="Savings Rate" value={savingsRate} onChange={setSavingsRate} step={5} min={5} max={90} suffix="%" />
      <Stepper label="Investment Return" value={returnRate} onChange={setReturnRate} step={0.5} min={5} max={20} suffix="%" />
      <Stepper label="Current Age" value={currentAge} onChange={setCurrentAge} step={1} min={18} max={60} suffix=" yrs" />

      <View style={[st.corpusBox, { backgroundColor: T.red + '14', borderColor: T.red + '40' }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>Your FIRE Number (25x)</Text>
        <AnimNum value={result.fireCorpus} style={[st.corpusVal, { color: T.red }]} />
      </View>

      <View style={st.metricsGrid}>
        <Metric label="Years to FIRE"   value={result.yearsToFIRE} color={T.amber} sub="years" />
        <Metric label="Monthly Savings" value={result.monthlySavings} color={T.blue} />
      </View>

      <View style={[st.corpusBox, { backgroundColor: T.green + '14', borderColor: T.green + '40', marginTop: SP.sm }]}>
        <Text style={[st.corpusLabel, { color: T.t3 }]}>🎯 Achieve FIRE at Age</Text>
        <Text style={[st.corpusVal, { color: T.green, fontSize: 42 }]}>{result.fireAge || '—'}</Text>
      </View>
      <Insight
        icon="🔥"
        text={`With a ${savingsRate}% savings rate, you achieve financial independence in ${result.yearsToFIRE} years at age ${result.fireAge}.`}
        color="#F59E0B"
      />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
const CALC_MAP = {
  sip:        <SIPCalc />,
  swp:        <SWPCalc />,
  lumpsum:    <LumpsumCalc />,
  emi:        <EMICalc />,
  fd:         <FDCalc />,
  rd:         <RDCalc />,
  retirement: <RetirementCalc />,
  fire:       <FIRECalc />,
};

export default function CalculatorsScreen() {
  const { T } = useTheme();
  const [active, setActive] = useState('sip');

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: T.bg }]} edges={['top']}>
      {/* HEADER */}
      <View style={[st.header, { borderBottomColor: T.border }]}>
        <View>
          <Text style={[st.headerSub, { color: T.t3 }]}>Growth Ledger</Text>
          <Text style={[st.headerTitle, { color: T.t1 }]}>Calculators</Text>
        </View>
        <View style={[st.headerBadge, { backgroundColor: T.blue + '18', borderColor: T.blue + '40' }]}>
          <Text style={[st.headerBadgeTx, { color: T.blue }]}>8 Tools</Text>
        </View>
      </View>

      {/* CALC TABS */}
      <View style={[st.tabsWrap, { borderBottomColor: T.border }]}>
        <CalcTabs active={active} onChange={setActive} />
      </View>

      {/* CALC CONTENT */}
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={st.calcCard}>
          {CALC_MAP[active]}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.md, paddingVertical: SP.sm + 4, borderBottomWidth: 1 },
  headerSub:    { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle:  { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerBadge:  { borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  headerBadgeTx:{ fontSize: 12, fontWeight: '700' },

  tabsWrap:     { borderBottomWidth: 1, paddingVertical: SP.sm },
  tabsRow:      { paddingHorizontal: SP.md, gap: 8 },
  tab:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  tabIcon:      { fontSize: 14 },
  tabLabel:     { fontSize: 12, letterSpacing: 0.2 },

  scroll:       { padding: SP.md, paddingBottom: 120 },
  calcCard:     { padding: SP.md },
  calcWrap:     { gap: SP.sm + 4 },

  // Stepper
  stepWrap:     { borderRadius: R.md, borderWidth: 1, padding: SP.sm + 4, gap: 6 },
  stepLabel:    { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepBtnTx:    { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  stepCenter:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepInput:    { fontSize: 22, fontWeight: '700', textAlign: 'center', minWidth: 80 },
  stepPfx:      { fontSize: 16, fontWeight: '600', marginRight: 2 },
  stepSfx:      { fontSize: 14, fontWeight: '500', marginLeft: 2, alignSelf: 'flex-end', marginBottom: 3 },

  // Metrics
  metricsGrid:  { flexDirection: 'row', gap: SP.sm },
  metric:       { flex: 1, borderRadius: R.md, borderWidth: 1, padding: SP.sm + 4, gap: 4, alignItems: 'center' },
  metricLabel:  { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },
  metricVal:    { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  metricSub:    { fontSize: 10, textAlign: 'center' },

  // Corpus Box (hero result)
  corpusBox:    { borderRadius: R.lg, borderWidth: 1, padding: SP.md, alignItems: 'center', gap: 6 },
  corpusLabel:  { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  corpusVal:    { fontSize: 38, fontWeight: '800', letterSpacing: -1 },

  // Insight
  insight:      { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.md, borderWidth: 1, padding: SP.sm + 4 },
  insightIcon:  { fontSize: 18, marginTop: 1 },
  insightText:  { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },

  // Bar legend
  barLegend:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barLegLabel:  { fontSize: 11, fontWeight: '500' },

  // Mini chart
  miniChart:    { flexDirection: 'row', alignItems: 'flex-end', height: 72, gap: 3, paddingVertical: SP.xs },
  miniBarWrap:  { flex: 1, alignItems: 'center', gap: 2 },
  miniBar:      { width: '100%', borderRadius: 4, minHeight: 4 },
  miniBarLabel: { fontSize: 8, fontWeight: '500' },
});
