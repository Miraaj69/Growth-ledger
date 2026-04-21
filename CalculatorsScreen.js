// CalculatorsScreen.js — Growth Ledger v3
// Premium Financial Toolkit: 8 calculators, SVG charts, smart insights, animated numbers
// Uses existing react-native-svg (no new dependencies)

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet,
  Animated, TextInput, Platform, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGrad, Stop, Rect, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as RD, SHADOW as SH } from './theme';
import { safeNum, fmtShort } from './helpers';

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - SP.md * 2 - 40; // card padding + extra for Y-axis

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const tap  = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);  } catch {} };
const tapM = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} };

const fmtCr = (n) => {
  const v = Math.round(Number(n) || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
};
const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const pct  = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────
const usePress = (s = 0.96) => {
  const anim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(anim, { toValue: s, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  const onOut = () => Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 28 }).start();
  return { anim, onIn, onOut };
};

// Counting animation for numbers
const useCountAnim = (target, duration = 800) => {
  const anim   = useRef(new Animated.Value(0)).current;
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    anim.setValue(from);
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    prevRef.current = target;
  }, [target]);
  return anim;
};

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION ENGINES
// ─────────────────────────────────────────────────────────────────────────────
const calcSIP = (monthly, returnPct, years, stepUpPct = 0) => {
  const p = safeNum(monthly), r = safeNum(returnPct) / 100 / 12;
  const n = safeNum(years) * 12, su = safeNum(stepUpPct) / 100;
  if (p <= 0 || n <= 0) return null;
  let corpus = 0, invested = 0, curP = p;
  const yearData = [];
  for (let m = 0; m < n; m++) {
    if (m > 0 && m % 12 === 0) curP *= (1 + su);
    corpus = corpus * (1 + (r || 0)) + curP;
    invested += curP;
    if ((m + 1) % 12 === 0)
      yearData.push({ year: (m + 1) / 12, corpus: Math.round(corpus), invested: Math.round(invested) });
  }
  const ret = Math.round(corpus - invested);
  // Insight: year when ₹1Cr crossed
  const croreYear = yearData.find(d => d.corpus >= 10000000)?.year ?? null;
  // Insight: double money year
  const doubleYear = yearData.find(d => d.corpus >= invested * 2)?.year ?? null;
  const wealthRatio = invested > 0 ? (corpus / invested).toFixed(1) : '0';
  return { corpus: Math.round(corpus), invested: Math.round(invested), returns: ret, yearData, croreYear, doubleYear, wealthRatio };
};

const calcSWP = (corpus, withdrawal, returnPct, years) => {
  let bal = safeNum(corpus);
  const w = safeNum(withdrawal), r = safeNum(returnPct) / 100 / 12;
  const n = safeNum(years) * 12;
  if (bal <= 0 || n <= 0) return null;
  let totalWithdrawn = 0, monthsDepleted = null;
  const monthData = [];
  for (let m = 0; m < n; m++) {
    bal = bal * (1 + (r || 0)) - w;
    totalWithdrawn += w;
    if (bal <= 0 && monthsDepleted === null) monthsDepleted = m + 1;
    if ((m + 1) % 12 === 0)
      monthData.push({ year: (m + 1) / 12, balance: Math.max(0, Math.round(bal)) });
  }
  const safe = safeNum(corpus);
  return {
    remaining: Math.max(0, Math.round(bal)),
    totalWithdrawn: Math.round(Math.min(totalWithdrawn, safe)),
    sustainable: bal > 0,
    monthsDepleted,
    yearsDepleted: monthsDepleted ? Math.ceil(monthsDepleted / 12) : null,
    monthData,
  };
};

const calcLumpsum = (principal, returnPct, years) => {
  const p = safeNum(principal), r = safeNum(returnPct) / 100, y = safeNum(years);
  if (p <= 0 || y <= 0) return null;
  const corpus = Math.round(p * Math.pow(1 + r, y));
  const yearData = [];
  for (let i = 1; i <= Math.min(y, 30); i++)
    yearData.push({ year: i, corpus: Math.round(p * Math.pow(1 + r, i)), invested: p });
  // Rule of 72: approx double years
  const doubleYears = r > 0 ? Math.round(72 / (safeNum(returnPct))) : null;
  return { corpus, invested: p, gain: corpus - p, yearData, doubleYears };
};

const calcEMI = (loan, ratePct, tenure) => {
  const P = safeNum(loan), r = safeNum(ratePct) / 100 / 12, n = safeNum(tenure) * 12;
  if (P <= 0 || n <= 0) return null;
  const emi = r === 0 ? Math.round(P / n) : Math.round(P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1));
  const totalPayment = Math.round(emi * n);
  const totalInterest = Math.max(0, totalPayment - P);
  // Year-wise principal vs interest split
  const yearData = [];
  let outstanding = P;
  for (let y = 1; y <= safeNum(tenure); y++) {
    let yInterest = 0, yPrincipal = 0;
    for (let m = 0; m < 12 && outstanding > 0; m++) {
      const monthInt = outstanding * r;
      const monthPri = Math.min(emi - monthInt, outstanding);
      yInterest   += monthInt;
      yPrincipal  += monthPri;
      outstanding -= monthPri;
    }
    yearData.push({ year: y, interest: Math.round(yInterest), principal: Math.round(yPrincipal) });
  }
  return { emi, totalPayment, totalInterest, yearData };
};

const calcFD = (principal, ratePct, years) => {
  const P = safeNum(principal), r = safeNum(ratePct) / 100, y = safeNum(years);
  if (P <= 0 || y <= 0) return null;
  const maturity = Math.round(P * Math.pow(1 + r / 4, 4 * y));
  const yearData = [];
  for (let i = 1; i <= Math.min(y, 20); i++)
    yearData.push({ year: i, corpus: Math.round(P * Math.pow(1 + r / 4, 4 * i)), invested: P });
  return { maturity, invested: P, interest: maturity - P, yearData };
};

const calcRD = (monthly, ratePct, years) => {
  const P = safeNum(monthly), r = safeNum(ratePct) / 100 / 4, n = safeNum(years) * 4;
  if (P <= 0 || n <= 0) return null;
  const invested = Math.round(P * 12 * safeNum(years));
  const maturity = r === 0 ? invested : Math.round(P * 12 * ((Math.pow(1+r,n)-1) / r) / 4);
  return { maturity: Math.max(invested, maturity), invested, interest: Math.max(0, maturity - invested) };
};

const calcRetirement = (curAge, retAge, expense, inflation, returnPct) => {
  const ca=safeNum(curAge), ra=safeNum(retAge), exp=safeNum(expense);
  const inf=safeNum(inflation)/100, ret=safeNum(returnPct)/100;
  const yrsToRetire=Math.max(1,ra-ca), yrsInRetire=Math.max(1,85-ra);
  if (exp<=0||yrsToRetire<=0) return null;
  const inflatedExp = Math.round(exp*Math.pow(1+inf,yrsToRetire));
  const corpus = Math.round(inflatedExp*12*25);
  const r=ret/12, n=yrsToRetire*12;
  const sipNeeded = r===0 ? Math.round(corpus/n) : Math.round(corpus*r/(Math.pow(1+r,n)-1));
  return { corpus, sipNeeded, inflatedExp, yrsToRetire, yrsInRetire };
};

const calcFIRE = (annualExp, savingsRatePct, returnPct, currentSavings) => {
  const exp=safeNum(annualExp), sr=safeNum(savingsRatePct)/100;
  const ret=safeNum(returnPct)/100, cs=safeNum(currentSavings);
  if (exp<=0||sr<=0) return null;
  const fireNumber = Math.round(exp*25);
  const annualSavings = Math.round(exp/Math.max(0.01,1-sr)*sr);
  let corpus=cs, years=0;
  while (corpus<fireNumber && years<100) { corpus=corpus*(1+ret)+annualSavings; years++; }
  const progress = Math.min(100, Math.round((cs/Math.max(1,fireNumber))*100));
  return { fireNumber, annualSavings, years, progress };
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG CHARTS (no external library, uses react-native-svg)
// ─────────────────────────────────────────────────────────────────────────────

// Smooth SVG line chart with area fill + dual series
function LineAreaChart({ data, keyMain, keySub, colorMain, colorSub, labelKey = 'year', T }) {
  if (!data?.length || data.length < 2) return null;
  const H = 175, W = CHART_W, PAD_L = 52, PAD_B = 28, PAD_T = 14, PAD_R = 10;
  const cW = W - PAD_L - PAD_R;
  const cH = H - PAD_T - PAD_B;

  const mainVals = data.map(d => d[keyMain] || 0);
  const subVals  = keySub ? data.map(d => d[keySub]  || 0) : [];
  const maxVal   = Math.max(...mainVals, ...subVals, 1);
  const step     = cW / Math.max(1, data.length - 1);

  const toX = (i) => PAD_L + i * step;
  const toY = (v) => PAD_T + cH - (v / maxVal) * cH;

  // Smooth bezier path
  const smoothPath = (vals) => {
    if (vals.length < 2) return '';
    const pts = vals.map((v, i) => [toX(i), toY(v)]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cpx = (pts[i][0] + pts[i+1][0]) / 2;
      d += ` C ${cpx} ${pts[i][1]}, ${cpx} ${pts[i+1][1]}, ${pts[i+1][0]} ${pts[i+1][1]}`;
    }
    return d;
  };

  const areaPath = (vals, linePath) => {
    const lastX = toX(vals.length - 1);
    return `${linePath} L ${lastX} ${PAD_T + cH} L ${PAD_L} ${PAD_T + cH} Z`;
  };

  const mainLine = smoothPath(mainVals);
  const subLine  = keySub ? smoothPath(subVals) : null;

  // Y-axis labels — 5 clean levels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y:     PAD_T + cH - f * cH,
    label: f === 0 ? '₹0' : fmtShort(maxVal * f),
  }));

  // X-axis labels — max 5 to avoid crowding
  const maxXLabels = 5;
  const xStep = Math.max(1, Math.ceil(data.length / maxXLabels));
  const xLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % xStep === 0 || i === data.length - 1)
    .map(({ d, i }) => ({ x: toX(i), label: d[labelKey] != null ? `Y${d[labelKey]}` : `${i+1}` }));

  return (
    <Svg width={W} height={H}>
      <Defs>
        <SvgGrad id="areaMain" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colorMain} stopOpacity="0.22" />
          <Stop offset="1" stopColor={colorMain} stopOpacity="0.02" />
        </SvgGrad>
        {keySub && (
          <SvgGrad id="areaSub" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colorSub} stopOpacity="0.14" />
            <Stop offset="1" stopColor={colorSub} stopOpacity="0.01" />
          </SvgGrad>
        )}
      </Defs>

      {/* Y-axis gridlines */}
      {yLabels.map((l, i) => (
        <React.Fragment key={i}>
          <Line x1={PAD_L} y1={l.y} x2={W - PAD_R} y2={l.y}
            stroke={T.border} strokeWidth="0.5" strokeDasharray={i === 0 ? '' : '3,4'} />
          <Text x={PAD_L - 6} y={l.y + 4} fontSize="9" fill={T.t3}
            textAnchor="end" fontWeight="600">{l.label}</Text>
        </React.Fragment>
      ))}

      {/* Area fills */}
      {keySub && subLine && (
        <Path d={areaPath(subVals, subLine)} fill="url(#areaSub)" />
      )}
      <Path d={areaPath(mainVals, mainLine)} fill="url(#areaMain)" />

      {/* Sub line */}
      {keySub && subLine && (
        <Path d={subLine} stroke={colorSub} strokeWidth="1.5"
          strokeDasharray="4,3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Main line */}
      <Path d={mainLine} stroke={colorMain} strokeWidth="2.5"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Endpoint dot */}
      <Circle cx={toX(mainVals.length - 1)} cy={toY(mainVals[mainVals.length - 1])}
        r="4" fill={colorMain} />
      <Circle cx={toX(mainVals.length - 1)} cy={toY(mainVals[mainVals.length - 1])}
        r="7" fill={colorMain} fillOpacity="0.2" />

      {/* X labels */}
      {xLabels.map((l, i) => (
        <Text key={i} x={l.x} y={H - 6} fontSize="10" fill={T.t3}
          textAnchor="middle" fontWeight="600">{l.label}</Text>
      ))}
    </Svg>
  );
}

// Grouped bar chart: two series side by side (e.g. principal vs interest)
function GroupedBarChart({ data, keyA, keyB, colorA, colorB, labelKey = 'year', T }) {
  if (!data?.length) return null;
  const H = 155, W = CHART_W, PAD_L = 52, PAD_B = 26, PAD_T = 10, PAD_R = 8;
  const cW = W - PAD_L - PAD_R;
  const cH = H - PAD_T - PAD_B;
  const n  = Math.min(data.length, 10); // cap bars
  const sliced = data.slice(0, n);

  const maxVal = Math.max(...sliced.map(d => Math.max(d[keyA] || 0, d[keyB] || 0)), 1);
  const groupW = cW / n;
  const barW   = Math.max(4, groupW * 0.35);
  const gap    = barW * 0.3;

  return (
    <Svg width={W} height={H}>
      {sliced.map((d, i) => {
        const groupX = PAD_L + i * groupW + groupW / 2;
        const hA = Math.max(2, ((d[keyA] || 0) / maxVal) * cH);
        const hB = Math.max(2, ((d[keyB] || 0) / maxVal) * cH);
        const xA = groupX - barW - gap / 2;
        const xB = groupX + gap / 2;
        return (
          <React.Fragment key={i}>
            <Rect x={xA} y={PAD_T + cH - hA} width={barW} height={hA}
              rx="3" fill={colorA} fillOpacity="0.85" />
            <Rect x={xB} y={PAD_T + cH - hB} width={barW} height={hB}
              rx="3" fill={colorB} fillOpacity="0.85" />
            <Text x={groupX} y={H - 4} fontSize="8.5" fill={T.t3}
              textAnchor="middle">{`Y${d[labelKey]}`}</Text>
          </React.Fragment>
        );
      })}
      {/* Base line */}
      <Line x1={PAD_L} y1={PAD_T + cH} x2={W - PAD_R} y2={PAD_T + cH}
        stroke={T.border} strokeWidth="1" />
      {/* Y label top */}
      <Text x={PAD_L - 4} y={PAD_T + 4} fontSize="8" fill={T.t3}
        textAnchor="end" fontWeight="600">{fmtShort(maxVal)}</Text>
    </Svg>
  );
}

// Donut pie chart with animated fill (SVG based)
function DonutPie({ a, b, colorA, colorB, labelA, labelB, size = 120 }) {
  const aAnim = useRef(new Animated.Value(0)).current;
  const total = Math.max(1, a + b);
  const pctA  = (a / total) * 100;
  useEffect(() => {
    Animated.timing(aAnim, { toValue: pctA, duration: 900, useNativeDriver: false }).start();
  }, [pctA]);

  const sw = 18, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const dashA = (pctA / 100) * circ;
  const dashB = circ - dashA;

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={colorB} strokeWidth={sw} strokeOpacity={0.85} />
          <Circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={colorA} strokeWidth={sw}
            strokeDasharray={`${dashA} ${dashB}`}
            strokeLinecap="round" />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
            {Math.round(pctA)}%
          </Text>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            {labelA}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colorA }} />
          <Text style={{ fontSize: 11, color: colorA, fontWeight: '600' }}>{labelA}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colorB }} />
          <Text style={{ fontSize: 11, color: colorB, fontWeight: '600' }}>{labelB}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Section({ children, T, style }) {
  return (
    <View style={[sc.wrap, { backgroundColor: T.l1, borderColor: T.border }, style]}>
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { borderRadius: RD.xxl, borderWidth: 1, padding: SP.md, marginBottom: SP.md, ...SH.card },
});

function SLabel({ text, T }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
      textTransform: 'uppercase', color: T.t3, marginBottom: 14 }}>
      {text}
    </Text>
  );
}

function Div({ T }) {
  return <View style={{ height: 1, backgroundColor: T.border, marginVertical: 10 }} />;
}

// Animated counting number display
function CountNum({ value, formatter = fmtCr, style }) {
  const anim = useCountAnim(value);
  return (
    <Animated.Text style={style}>
      {anim.__getValue ? formatter(Math.round(anim.__getValue())) : formatter(value)}
    </Animated.Text>
  );
}

// Result hero with gradient background
function ResultHero({ label, value, sub, colors, accent }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    fadeAnim.setValue(0); slideAnim.setValue(12);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 22, bounciness: 5, useNativeDriver: true }),
    ]).start();
  }, [value]);
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 14 }}>
      <LinearGradient colors={colors || ['#0c1a4e','#1a3080']}
        style={rh.wrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={rh.label}>{label}</Text>
        <Text style={rh.value}>{value}</Text>
        {sub ? <Text style={rh.sub}>{sub}</Text> : null}
      </LinearGradient>
    </Animated.View>
  );
}
const rh = StyleSheet.create({
  wrap:  { borderRadius: RD.xl, padding: SP.lg, alignItems: 'center' },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase',
           color: 'rgba(255,255,255,0.55)', marginBottom: 8 },
  value: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  sub:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: '500' },
});

// Stat row
function Stat({ label, value, color, big, T }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingVertical: 9 }}>
      <Text style={{ fontSize: 13, color: T.t2, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: big ? 20 : 14, fontWeight: big ? '800' : '700', color: color || T.t1 }}>
        {value}
      </Text>
    </View>
  );
}

// Smart insight pill (colored badge)
function Insight({ icon, text, color, T }) {
  return (
    <View style={[iSt.wrap, { backgroundColor: color + '18', borderColor: color + '38' }]}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={[iSt.text, { color }]}>{text}</Text>
    </View>
  );
}
const iSt = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: RD.md,
          borderWidth: 1, padding: 12, marginTop: 10 },
  text: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
});

// Split bar (two-color progress)
function SplitBar({ a, b, colorA, colorB, labelA, labelB }) {
  const total = Math.max(1, a + b);
  const animA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animA, { toValue: (a / total) * 100, duration: 900, useNativeDriver: false }).start();
  }, [a, b]);
  const wA = animA.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', height: 8, borderRadius: 99,
        overflow: 'hidden', backgroundColor: colorB + '55' }}>
        <Animated.View style={{ width: wA, backgroundColor: colorA, borderRadius: 99 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ fontSize: 11, color: colorA, fontWeight: '600' }}>● {labelA}  {Math.round((a/total)*100)}%</Text>
        <Text style={{ fontSize: 11, color: colorB, fontWeight: '600' }}>{Math.round((b/total)*100)}%  {labelB} ●</Text>
      </View>
    </View>
  );
}

// Mini single bar
function MiniBar({ pct: p, color, T }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(100, Math.max(0, p || 0)),
      duration: 800, useNativeDriver: false }).start();
  }, [p]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height: 6, borderRadius: 99, overflow: 'hidden',
      backgroundColor: T.l3, marginVertical: 8 }}>
      <Animated.View style={{ width, height: '100%', backgroundColor: color, borderRadius: 99 }} />
    </View>
  );
}

// Monthly / Yearly toggle
function ViewToggle({ mode, onChange, T }) {
  const { anim, onIn, onOut } = usePress(0.95);
  return (
    <View style={[vt.wrap, { backgroundColor: T.l2, borderColor: T.border }]}>
      {['monthly', 'yearly'].map((m) => {
        const on = mode === m;
        return (
          <Pressable key={m} onPress={() => { tap(); onChange(m); }}
            style={[vt.pill, on && { backgroundColor: T.blue + '22', borderColor: T.blue + '55' }]}>
            <Text style={[vt.label, { color: on ? T.blue : T.t3, fontWeight: on ? '700' : '500' }]}>
              {m === 'monthly' ? 'Monthly' : 'Yearly'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const vt = StyleSheet.create({
  wrap:  { flexDirection: 'row', borderRadius: 99, borderWidth: 1, padding: 3, alignSelf: 'flex-end', marginBottom: 12 },
  pill:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: 'transparent' },
  label: { fontSize: 12 },
});

// Chart legend row
function ChartLegend({ items }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: it.dash ? 16 : 8, height: it.dash ? 2 : 8,
            borderRadius: 2, backgroundColor: it.color,
            borderStyle: it.dash ? 'dashed' : 'solid' }} />
          <Text style={{ fontSize: 11, color: it.color, fontWeight: '600' }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Numeric input with +/− buttons
function NumInput({ label, value, onChange, prefix = '₹', suffix, step = 1,
  min = 0, max = 999999999, T }) {
  const inc = () => { tap(); onChange(String(Math.min(max, (safeNum(value)||0) + step))); };
  const dec = () => { tap(); onChange(String(Math.max(min, (safeNum(value)||0) - step))); };
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.7,
        textTransform: 'uppercase', color: T.t3, marginBottom: 7 }}>
        {label}
      </Text>
      <View style={[ni.row, { backgroundColor: T.l2, borderColor: T.borderHi }]}>
        <Pressable onPress={dec} style={ni.btn}>
          <Text style={[ni.btnTxt, { color: T.t2 }]}>−</Text>
        </Pressable>
        <View style={ni.area}>
          {prefix ? <Text style={[ni.pfx, { color: T.t3 }]}>{prefix}</Text> : null}
          <TextInput value={String(value ?? '')} onChangeText={onChange}
            keyboardType="numeric" style={[ni.input, { color: T.t1 }]}
            placeholderTextColor={T.t3} selectTextOnFocus />
          {suffix ? <Text style={[ni.sfx, { color: T.t3 }]}>{suffix}</Text> : null}
        </View>
        <Pressable onPress={inc} style={ni.btn}>
          <Text style={[ni.btnTxt, { color: T.blue }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
const ni = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', borderRadius: RD.md, borderWidth: 1, overflow: 'hidden' },
  area:   { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  pfx:    { fontSize: 17, fontWeight: '700', marginRight: 3 },
  sfx:    { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  input:  { flex: 1, fontSize: 22, fontWeight: '800', paddingVertical: Platform.OS === 'ios' ? 13 : 9 },
  btn:    { width: 46, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  btnTxt: { fontSize: 22, fontWeight: '300' },
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIP CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function SIPCalc({ T }) {
  const [monthly, setMonthly] = useState('5000');
  const [ret,     setRet]     = useState('12');
  const [years,   setYears]   = useState('10');
  const [stepUp,  setStepUp]  = useState('0');
  const [view,    setView]    = useState('yearly');

  const result = useMemo(() => calcSIP(monthly, ret, years, stepUp), [monthly, ret, years, stepUp]);

  const chartData = useMemo(() => {
    if (!result?.yearData) return [];
    if (view === 'yearly') return result.yearData;
    // monthly view: sample every month but show max 24 points
    return result.yearData.slice(-Math.min(result.yearData.length, 12));
  }, [result, view]);

  return (
    <>
      <Section T={T}>
        <SLabel text="Investment Details" T={T} />
        <NumInput label="Monthly Investment"  value={monthly} onChange={setMonthly} step={500}  T={T} />
        <NumInput label="Expected Return"     value={ret}     onChange={setRet}     prefix="" suffix="% p.a." step={0.5} min={0.5} T={T} />
        <NumInput label="Time Period"         value={years}   onChange={setYears}   prefix="" suffix="years" step={1} min={1} max={40} T={T} />
        <NumInput label="Annual Step-up"      value={stepUp}  onChange={setStepUp}  prefix="" suffix="%" step={1} min={0} max={50} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Final Corpus" value={fmtCr(result.corpus)}
            sub={`${fmtCr(result.invested)} invested  ·  ${fmtCr(result.returns)} earned`}
            colors={['#052e16','#064e3b','#065f46']}
          />

          {/* 3-up metric grid */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Invested',  val: fmtCr(result.invested), color: T.blue },
              { label: 'Returns',   val: fmtCr(result.returns),  color: T.green },
              { label: 'Multiple',  val: `${result.wealthRatio}×`, color: T.purple },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color }]}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          <SplitBar a={result.invested} b={result.returns} colorA={T.blue} colorB={T.green} labelA="Invested" labelB="Returns" />

          {/* CHART */}
          {chartData.length > 1 && (
            <View style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                  textTransform: 'uppercase', color: T.t3 }}>Growth Chart</Text>
                <ViewToggle mode={view} onChange={setView} T={T} />
              </View>
              <LineAreaChart data={chartData} keyMain="corpus" keySub="invested"
                colorMain={T.green} colorSub={T.blue} T={T} />
              <ChartLegend items={[
                { label: 'Corpus',   color: T.green },
                { label: 'Invested', color: T.blue, dash: true },
              ]} />
            </View>
          )}

          {/* SMART INSIGHTS */}
          <View style={{ marginTop: 6 }}>
            {result.croreYear && (
              <Insight icon="🎯" color={T.green} T={T}
                text={`You'll cross ₹1 Cr in Year ${result.croreYear} — stay invested!`} />
            )}
            {!result.croreYear && result.corpus < 10000000 && (
              <Insight icon="💡" color={T.blue} T={T}
                text={`Increase SIP by ₹500/mo or add ${Math.ceil((10000000 - result.corpus) / result.corpus * 100)}% step-up to reach ₹1 Cr faster`} />
            )}
            {result.returns > result.invested && (
              <Insight icon="🔥" color={T.green} T={T}
                text={`Your returns (${fmtCr(result.returns)}) exceed your investment — excellent compounding!`} />
            )}
            {safeNum(stepUp) === 0 && (
              <Insight icon="📈" color={T.amber} T={T}
                text={`Add just 10% annual step-up to grow your corpus by ~${Math.round((calcSIP(monthly, ret, years, 10)?.corpus || 0) / (result.corpus || 1) * 100 - 100)}%`} />
            )}
          </View>
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SWP CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function SWPCalc({ T }) {
  const [corpus, setCorpus] = useState('1000000');
  const [withd,  setWithd]  = useState('10000');
  const [ret,    setRet]    = useState('10');
  const [years,  setYears]  = useState('10');

  const result = useMemo(() => calcSWP(corpus, withd, ret, years), [corpus, withd, ret, years]);

  return (
    <>
      <Section T={T}>
        <SLabel text="Withdrawal Details" T={T} />
        <NumInput label="Initial Investment"  value={corpus} onChange={setCorpus} step={50000} T={T} />
        <NumInput label="Monthly Withdrawal"  value={withd}  onChange={setWithd}  step={1000}  T={T} />
        <NumInput label="Expected Return"     value={ret}    onChange={setRet}    prefix="" suffix="% p.a." step={0.5} min={0} T={T} />
        <NumInput label="Duration"            value={years}  onChange={setYears}  prefix="" suffix="years" step={1} min={1} max={40} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label={result.sustainable ? 'Corpus Remaining' : 'Corpus Depleted'}
            value={result.sustainable ? fmtCr(result.remaining) : `In ${result.yearsDepleted} yrs`}
            sub={result.sustainable
              ? `Fully sustainable for ${years} years`
              : `Exhausted after ${result.monthsDepleted} months`}
            colors={result.sustainable ? ['#052e16','#064e3b'] : ['#2d0a0a','#7f1d1d']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Withdrawn', val: fmtCr(result.totalWithdrawn),
                color: result.sustainable ? T.green : T.red },
              { label: 'Remaining', val: fmtCr(result.remaining), color: T.t1 },
              { label: 'Status', val: result.sustainable ? '✅ Safe' : '⚠️ Risk',
                color: result.sustainable ? T.green : T.red },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color, fontSize: 11 }]} numberOfLines={1}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          {result.monthData?.length > 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                textTransform: 'uppercase', color: T.t3, marginBottom: 8 }}>Balance Over Time</Text>
              <LineAreaChart data={result.monthData} keyMain="balance"
                colorMain={result.sustainable ? T.green : T.red} labelKey="year" T={T} />
            </View>
          )}

          {result.sustainable
            ? <Insight icon="🎉" color={T.green} T={T}
                text={`₹${Number(withd).toLocaleString('en-IN')}/mo for ${years} years — corpus stays alive with ${fmtCr(result.remaining)} remaining`} />
            : <Insight icon="⚠️" color={T.red} T={T}
                text={`Corpus depletes in ${result.yearsDepleted} years. Reduce withdrawal to ₹${fmtCr(safeNum(corpus) * safeNum(ret) / 100 / 12)} (interest-only) for infinite duration`} />
          }
          {result.sustainable && result.remaining > safeNum(corpus) * 0.5 && (
            <Insight icon="💡" color={T.blue} T={T}
              text={`You can safely withdraw up to ₹${fmtCr(safeNum(corpus) * safeNum(ret) / 100 / 12 * 0.9)}/mo and never deplete the principal`} />
          )}
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LUMPSUM CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function LumpsumCalc({ T }) {
  const [principal, setPrincipal] = useState('100000');
  const [ret,       setRet]       = useState('12');
  const [years,     setYears]     = useState('10');

  const result = useMemo(() => calcLumpsum(principal, ret, years), [principal, ret, years]);

  return (
    <>
      <Section T={T}>
        <SLabel text="One-time Investment" T={T} />
        <NumInput label="Investment Amount" value={principal} onChange={setPrincipal} step={10000} T={T} />
        <NumInput label="Expected Return"   value={ret}       onChange={setRet}       prefix="" suffix="% p.a." step={0.5} min={0.5} T={T} />
        <NumInput label="Time Period"       value={years}     onChange={setYears}     prefix="" suffix="years" step={1} min={1} max={40} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Maturity Value" value={fmtCr(result.corpus)}
            sub={`${fmtCr(result.invested)} → ${fmtCr(result.corpus)} in ${years} yrs`}
            colors={['#052e16','#064e3b']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Invested', val: fmtCr(result.invested), color: T.blue },
              { label: 'Gained',   val: fmtCr(result.gain),     color: T.green },
              { label: 'Multiple', val: `${(result.corpus/Math.max(1,result.invested)).toFixed(1)}×`, color: T.amber },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color }]}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Donut split */}
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <DonutPie a={result.gain} b={result.invested}
              colorA={T.green} colorB={T.blue}
              labelA="Returns" labelB="Principal" />
          </View>

          {result.yearData?.length > 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                textTransform: 'uppercase', color: T.t3, marginBottom: 8 }}>Growth Curve</Text>
              <LineAreaChart data={result.yearData} keyMain="corpus"
                colorMain={T.green} T={T} />
            </View>
          )}

          {result.doubleYears && (
            <Insight icon="⚡" color={T.blue} T={T}
              text={`Rule of 72: Your money doubles every ~${result.doubleYears} years at ${ret}% return`} />
          )}
          <Insight icon="💰" color={T.green} T={T}
            text={`${fmtCr(result.invested)} grows ${(result.corpus/Math.max(1,result.invested)).toFixed(1)}× in ${years} years — power of compounding!`} />
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EMI CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function EMICalc({ T }) {
  const [loan,   setLoan]   = useState('500000');
  const [rate,   setRate]   = useState('10');
  const [tenure, setTenure] = useState('5');

  const result = useMemo(() => calcEMI(loan, rate, tenure), [loan, rate, tenure]);
  const interestPct = result?.totalPayment > 0
    ? Math.round((result.totalInterest / result.totalPayment) * 100) : 0;

  return (
    <>
      <Section T={T}>
        <SLabel text="Loan Details" T={T} />
        <NumInput label="Loan Amount"   value={loan}   onChange={setLoan}   step={50000} T={T} />
        <NumInput label="Interest Rate" value={rate}   onChange={setRate}   prefix="" suffix="% p.a." step={0.25} min={0.25} T={T} />
        <NumInput label="Tenure"        value={tenure} onChange={setTenure} prefix="" suffix="years" step={1} min={1} max={30} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Monthly EMI" value={fmt(result.emi)}
            sub={`For ${tenure} years at ${rate}% p.a.`}
            colors={['#0c1a4e','#1a3080']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Principal', val: fmtCr(safeNum(loan)),         color: T.blue },
              { label: 'Interest',  val: fmtCr(result.totalInterest),  color: T.red },
              { label: 'Total',     val: fmtCr(result.totalPayment),   color: T.t1 },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color }]}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          <SplitBar a={safeNum(loan)} b={result.totalInterest}
            colorA={T.blue} colorB={T.red}
            labelA="Principal" labelB="Interest" />

          {/* Year-wise repayment breakdown */}
          {result.yearData?.length > 1 && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                textTransform: 'uppercase', color: T.t3, marginBottom: 8 }}>Annual Repayment</Text>
              <GroupedBarChart data={result.yearData} keyA="principal" keyB="interest"
                colorA={T.blue} colorB={T.red} T={T} />
              <ChartLegend items={[
                { label: 'Principal', color: T.blue },
                { label: 'Interest',  color: T.red },
              ]} />
            </View>
          )}

          <Insight icon="💡" color={T.amber} T={T}
            text={`You pay ${interestPct}% extra as interest (${fmtCr(result.totalInterest)}). Prepaying just ₹${fmtCr(safeNum(loan)*0.1)}/year can save ~${fmtCr(result.totalInterest*0.2)} in interest`} />
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FD CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function FDCalc({ T }) {
  const [principal, setPrincipal] = useState('100000');
  const [rate,      setRate]      = useState('7');
  const [years,     setYears]     = useState('5');

  const result = useMemo(() => calcFD(principal, rate, years), [principal, rate, years]);

  return (
    <>
      <Section T={T}>
        <SLabel text="Fixed Deposit" T={T} />
        <NumInput label="Investment Amount" value={principal} onChange={setPrincipal} step={10000} T={T} />
        <NumInput label="Interest Rate"     value={rate}      onChange={setRate}      prefix="" suffix="% p.a." step={0.25} min={0.25} T={T} />
        <NumInput label="Duration"          value={years}     onChange={setYears}     prefix="" suffix="years" step={1} min={1} max={20} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Maturity Amount" value={fmtCr(result.maturity)}
            sub={`Quarterly compounding · ${rate}% p.a.`}
            colors={['#042f2e','#134e4a']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Principal', val: fmtCr(result.invested), color: T.blue },
              { label: 'Interest',  val: fmtCr(result.interest), color: T.teal },
              { label: 'Gain %',    val: `${pct(result.interest, result.maturity)}%`, color: T.green },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color }]}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          <MiniBar pct={pct(result.interest, result.maturity)} color={T.teal} T={T} />

          {result.yearData?.length > 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                textTransform: 'uppercase', color: T.t3, marginBottom: 8 }}>Growth Curve</Text>
              <LineAreaChart data={result.yearData} keyMain="corpus"
                colorMain={T.teal} T={T} />
            </View>
          )}

          <Insight icon="🏛️" color={T.teal} T={T}
            text={`Safe guaranteed returns — ${fmtCr(result.interest)} earned with zero risk. Ideal for emergency fund`} />
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RD CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function RDCalc({ T }) {
  const [monthly, setMonthly] = useState('5000');
  const [rate,    setRate]    = useState('7');
  const [years,   setYears]   = useState('5');

  const result = useMemo(() => calcRD(monthly, rate, years), [monthly, rate, years]);

  return (
    <>
      <Section T={T}>
        <SLabel text="Recurring Deposit" T={T} />
        <NumInput label="Monthly Deposit" value={monthly} onChange={setMonthly} step={500} T={T} />
        <NumInput label="Interest Rate"   value={rate}    onChange={setRate}    prefix="" suffix="% p.a." step={0.25} min={0.25} T={T} />
        <NumInput label="Duration"        value={years}   onChange={setYears}   prefix="" suffix="years" step={1} min={1} max={20} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Maturity Value" value={fmtCr(result.maturity)}
            sub={`${fmtCr(result.invested)} deposited over ${years} years`}
            colors={['#042f2e','#134e4a']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Deposited', val: fmtCr(result.invested), color: T.blue },
              { label: 'Interest',  val: fmtCr(result.interest), color: T.teal },
              { label: 'Return %',  val: `${pct(result.interest, result.maturity)}%`, color: T.green },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color }]}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          <MiniBar pct={pct(result.interest, result.maturity)} color={T.teal} T={T} />

          <Insight icon="📅" color={T.blue} T={T}
            text={`₹${Number(monthly).toLocaleString('en-IN')}/mo builds discipline — earns ${fmtCr(result.interest)} extra in ${years} years`} />
          <Insight icon="💡" color={T.teal} T={T}
            text={`Compare: same ₹${Number(monthly).toLocaleString('en-IN')}/mo in a SIP at 12% returns ~${fmtCr((calcSIP(monthly, 12, years)?.corpus || 0) - result.maturity)} more`} />
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. RETIREMENT CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function RetirementCalc({ T }) {
  const [curAge,    setCurAge]    = useState('28');
  const [retAge,    setRetAge]    = useState('55');
  const [expense,   setExpense]   = useState('50000');
  const [inflation, setInflation] = useState('6');
  const [ret,       setRet]       = useState('12');

  const result = useMemo(
    () => calcRetirement(curAge, retAge, expense, inflation, ret),
    [curAge, retAge, expense, inflation, ret]
  );

  return (
    <>
      <Section T={T}>
        <SLabel text="Retirement Planning" T={T} />
        <NumInput label="Current Age"       value={curAge}    onChange={setCurAge}    prefix="" suffix="yrs" step={1} min={18} max={60} T={T} />
        <NumInput label="Retirement Age"    value={retAge}    onChange={setRetAge}    prefix="" suffix="yrs" step={1} min={40} max={80} T={T} />
        <NumInput label="Monthly Expenses"  value={expense}   onChange={setExpense}   step={5000} T={T} />
        <NumInput label="Inflation Rate"    value={inflation} onChange={setInflation} prefix="" suffix="%" step={0.5} min={2} max={15} T={T} />
        <NumInput label="Investment Return" value={ret}       onChange={setRet}       prefix="" suffix="% p.a." step={0.5} min={1} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Corpus Required" value={fmtCr(result.corpus)}
            sub={`Retire at ${retAge} · ${result.yrsToRetire} years away`}
            colors={['#1e1b4b','#312e81','#3730a3']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'SIP/mo', val: fmtCr(result.sipNeeded), color: T.purple },
              { label: 'Infl Exp', val: `${fmt(result.inflatedExp)}/mo`, color: T.amber },
              { label: 'Post-ret', val: `${result.yrsInRetire}yrs`, color: T.t1 },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color, fontSize: 11 }]} numberOfLines={1}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          <Insight icon="🏖️" color={T.purple} T={T}
            text={`Start ₹${result.sipNeeded.toLocaleString('en-IN')}/mo SIP today to retire at ${retAge} with ${fmtCr(result.corpus)} corpus`} />
          <Insight icon="📈" color={T.amber} T={T}
            text={`At ${inflation}% inflation, your ₹${Number(expense).toLocaleString('en-IN')}/mo expenses become ${fmt(result.inflatedExp)}/mo at retirement`} />
          {result.yrsToRetire < 15 && (
            <Insight icon="⚡" color={T.red} T={T}
              text={`Only ${result.yrsToRetire} years left — start SIP immediately, every year delayed increases required SIP by ~10%`} />
          )}
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FIRE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function FIRECalc({ T }) {
  const [annualExp,   setAnnualExp]   = useState('600000');
  const [savingsRate, setSavingsRate] = useState('40');
  const [ret,         setRet]         = useState('10');
  const [curSavings,  setCurSavings]  = useState('0');

  const result = useMemo(
    () => calcFIRE(annualExp, savingsRate, ret, curSavings),
    [annualExp, savingsRate, ret, curSavings]
  );

  const fireColor = result
    ? result.years <= 15 ? T.green : result.years <= 30 ? T.blue : T.amber
    : T.amber;

  // Sensitivity: what if we boost savings rate by 10%?
  const boostedResult = useMemo(
    () => calcFIRE(annualExp, String(Math.min(95, safeNum(savingsRate) + 10)), ret, curSavings),
    [annualExp, savingsRate, ret, curSavings]
  );

  return (
    <>
      <Section T={T}>
        <SLabel text="FIRE — Financial Independence" T={T} />
        <NumInput label="Annual Expenses"   value={annualExp}   onChange={setAnnualExp}   step={50000} T={T} />
        <NumInput label="Savings Rate"      value={savingsRate} onChange={setSavingsRate} prefix="" suffix="%" step={5} min={1} max={95} T={T} />
        <NumInput label="Investment Return" value={ret}         onChange={setRet}         prefix="" suffix="% p.a." step={0.5} min={1} T={T} />
        <NumInput label="Current Savings"   value={curSavings}  onChange={setCurSavings}  step={50000} T={T} />
      </Section>

      {result && (
        <Section T={T}>
          <ResultHero
            label="Years to Financial Freedom"
            value={result.years >= 100 ? '100+ years' : `${result.years} years`}
            sub={`FIRE Number: ${fmtCr(result.fireNumber)}`}
            colors={result.years <= 15
              ? ['#052e16','#064e3b']
              : result.years <= 30
              ? ['#0c1a4e','#1a3080']
              : ['#422006','#78350f']}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'FIRE #',   val: fmtCr(result.fireNumber),   color: T.blue },
              { label: 'Ann Save', val: fmtCr(result.annualSavings), color: T.green },
              { label: 'Progress', val: `${result.progress}%`,       color: fireColor },
            ].map((m, i) => (
              <View key={i} style={[mg.card, { backgroundColor: T.l2, borderColor: T.border, flex: 1 }]}>
                <Text style={[mg.val, { color: m.color }]}>{m.val}</Text>
                <Text style={[mg.label, { color: T.t3 }]}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Progress toward FIRE */}
          <Text style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>
            Progress to FIRE Number
          </Text>
          <MiniBar pct={result.progress} color={fireColor} T={T} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: T.t3 }}>
              {fmtCr(safeNum(curSavings))} saved
            </Text>
            <Text style={{ fontSize: 11, color: T.t2, fontWeight: '600' }}>
              Goal: {fmtCr(result.fireNumber)}
            </Text>
          </View>

          {/* Smart insights */}
          {result.years <= 15 && (
            <Insight icon="🔥" color={T.green} T={T}
              text={`Exceptional! Financial freedom in ${result.years} years — you're in the top 1% of savers!`} />
          )}
          {result.years > 15 && result.years <= 30 && boostedResult && (
            <Insight icon="💪" color={T.blue} T={T}
              text={`Boost savings rate to ${Math.min(95, safeNum(savingsRate) + 10)}% → reach FIRE in ${boostedResult.years} years (save ${result.years - boostedResult.years} years!)`} />
          )}
          {result.years > 30 && (
            <Insight icon="⚡" color={T.amber} T={T}
              text={`Target 50%+ savings rate. At current pace, you'll achieve FIRE in ${result.years} years — increase income or cut expenses`} />
          )}
          <Insight icon="📊" color={T.purple} T={T}
            text={`4% rule: withdraw ${fmtCr(result.fireNumber * 0.04)} per year from ${fmtCr(result.fireNumber)} corpus indefinitely`} />
        </Section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC GRID STYLES
// ─────────────────────────────────────────────────────────────────────────────
const mg = StyleSheet.create({
  card:  { borderRadius: RD.lg, borderWidth: 1, padding: 10, alignItems: 'center' },
  val:   { fontSize: 13, fontWeight: '800', letterSpacing: -0.3, marginBottom: 3 },
  label: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
});

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'sip',        label: 'SIP',     icon: '📈', accent: '#22C55E' },
  { key: 'swp',        label: 'SWP',     icon: '💸', accent: '#EF4444' },
  { key: 'lumpsum',    label: 'Lumpsum', icon: '💰', accent: '#22C55E' },
  { key: 'emi',        label: 'EMI',     icon: '🏦', accent: '#4F8CFF' },
  { key: 'fd',         label: 'FD',      icon: '🏛️', accent: '#14B8A6' },
  { key: 'rd',         label: 'RD',      icon: '📅', accent: '#14B8A6' },
  { key: 'retirement', label: 'Retire',  icon: '🏖️', accent: '#A78BFA' },
  { key: 'fire',       label: 'FIRE',    icon: '🔥', accent: '#F59E0B' },
];

const META = {
  sip:        { title: 'SIP Calculator',     sub: 'Build wealth month by month' },
  swp:        { title: 'SWP Calculator',     sub: 'Plan your withdrawal strategy' },
  lumpsum:    { title: 'Lumpsum Calculator', sub: 'One-time investment growth' },
  emi:        { title: 'EMI Calculator',     sub: 'Know your loan true cost' },
  fd:         { title: 'FD Calculator',      sub: 'Safe guaranteed returns' },
  rd:         { title: 'RD Calculator',      sub: 'Build discipline with deposits' },
  retirement: { title: 'Retirement Planner', sub: 'Calculate your freedom corpus' },
  fire:       { title: 'FIRE Calculator',    sub: 'Time to financial independence' },
};

const CALCS = {
  sip: SIPCalc, swp: SWPCalc, lumpsum: LumpsumCalc, emi: EMICalc,
  fd: FDCalc, rd: RDCalc, retirement: RetirementCalc, fire: FIRECalc,
};

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL TAB BAR
// ─────────────────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, T }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: SP.md, gap: 8 }}>
      {TABS.map((tab) => {
        const on = active === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)}
            style={[tb.pill, {
              backgroundColor: on ? tab.accent + '22' : T.l2,
              borderColor:     on ? tab.accent + '60' : T.border,
            }]}>
            <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
            <Text style={[tb.label, { color: on ? tab.accent : T.t2, fontWeight: on ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const tb = StyleSheet.create({
  pill:  { flexDirection: 'row', alignItems: 'center', gap: 6,
           paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1 },
  label: { fontSize: 13, letterSpacing: 0.1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function CalculatorsScreen() {
  const { T }    = useTheme();
  const [active, setActive] = useState('sip');
  const ActiveCalc  = CALCS[active] || SIPCalc;
  const { title, sub } = META[active] || {};
  const activeTab = TABS.find(t => t.key === active);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleTabChange = useCallback((key) => {
    if (key === active) return;
    tapM();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,  duration: 90, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 14, duration: 90, useNativeDriver: true }),
    ]).start(() => {
      setActive(key);
      slideAnim.setValue(-10);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, speed: 22, bounciness: 5, useNativeDriver: true }),
      ]).start();
    });
  }, [active]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>

      {/* ── HEADER ── */}
      <View style={[hd.row, { borderBottomColor: T.border }]}>
        <View>
          <Text style={[hd.title, { color: T.t1 }]}>Calculators</Text>
          <Text style={[hd.sub, { color: T.t3 }]}>Premium Financial Toolkit</Text>
        </View>
        <LinearGradient
          colors={[(activeTab?.accent || T.blue) + '30', (activeTab?.accent || T.blue) + '12']}
          style={hd.badge}>
          <Text style={[hd.badgeTxt, { color: activeTab?.accent || T.blue }]}>8 Tools</Text>
        </LinearGradient>
      </View>

      {/* ── TAB PICKER ── */}
      <View style={{ paddingVertical: 14 }}>
        <TabBar active={active} onChange={handleTabChange} T={T} />
      </View>

      {/* ── ACTIVE CALC TITLE ── */}
      <Animated.View style={{ paddingHorizontal: SP.md, marginBottom: 12,
        opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[ct.icon, { backgroundColor: (activeTab?.accent || T.blue) + '20' }]}>
            <Text style={{ fontSize: 18 }}>{activeTab?.icon}</Text>
          </View>
          <View>
            <Text style={[ct.title, { color: T.t1 }]}>{title}</Text>
            <Text style={[ct.sub, { color: T.t3 }]}>{sub}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── CONTENT ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SP.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ActiveCalc T={T} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const hd = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingHorizontal: SP.md, paddingTop: 6, paddingBottom: 14, borderBottomWidth: 1 },
  title:    { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  sub:      { fontSize: 12, fontWeight: '500', marginTop: 2 },
  badge:    { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  badgeTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
});
const ct = StyleSheet.create({
  icon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sub:   { fontSize: 12, fontWeight: '500', marginTop: 1 },
});
