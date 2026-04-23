import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Share, Alert, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW, TYPE } from './Constants_theme';
import { useTheme } from './Context_ThemeContext';
import { Card, Row, Spacer, ProgressBar, SectionHeader, StatChip, IconContainer } from './Components_UIComponents';
import { useApp } from './Context_AppContext';
import { MONTHS } from './Constants_data';
import dayjs from 'dayjs';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── ANIMATED COMPLIANCE RING ─────────────────────────────────────────────────
function ComplianceRing({ value, color, size = 130, stroke = 11 }) {
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const anim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:  value,
      duration: 1200,
      delay:    300,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const offset = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: [circ, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track ring */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="transparent"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color, fontSize: 26, fontWeight: FONT.extrabold, letterSpacing: -1 }}>
          {value}%
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2, letterSpacing: 0.3 }}>
          COMPLIANCE
        </Text>
      </View>
    </View>
  );
}

// ─── WEEKLY BAR CHART ─────────────────────────────────────────────────────────
function WeeklyBarChart({ data, color }) {
  const max    = Math.max(...data.map(d => d.value), 1);
  const CHART_H = 56;
  const BAR_W   = 30;

  // Animate bars in
  const barAnims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = data.map((d, i) =>
      Animated.timing(barAnims[i], {
        toValue:  d.value / max,
        duration: 600,
        delay:    i * 60,
        easing:   Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, [data]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const barColor = isLast ? color : color + '44';

        return (
          <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
            <View style={{ height: CHART_H, justifyContent: 'flex-end' }}>
              <Animated.View
                style={{
                  width:           BAR_W,
                  height:          barAnims[i].interpolate({
                    inputRange:  [0, 1],
                    outputRange: [2, CHART_H],
                  }),
                  backgroundColor: barColor,
                  borderRadius:    5,
                }}
              />
            </View>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: 0.2 }}>
              {d.label}
            </Text>
            <Text style={{ fontSize: 9, color: isLast ? color : 'rgba(255,255,255,0.25)', fontWeight: FONT.medium }}>
              {d.value}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── INSIGHT CARD ─────────────────────────────────────────────────────────────
function InsightCard({ icon, text, color }) {
  return (
    <View style={[
      styles.insightCard,
      { backgroundColor: color + '10', borderColor: color + '25' },
    ]}>
      <Text style={styles.insightIcon}>{icon}</Text>
      <Text style={[styles.insightText, { color: color }]}>{text}</Text>
    </View>
  );
}

// ─── MONTH NAVIGATOR ─────────────────────────────────────────────────────────
function MonthNavigator({ month, year, onPrev, onNext, colors }) {
  return (
    <View style={[styles.monthNav, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <TouchableOpacity onPress={onPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}>
        <Text style={[styles.navArrow, { color: colors.textSub }]}>‹</Text>
      </TouchableOpacity>
      <Text style={[styles.navTitle, { color: colors.text }]}>
        {MONTHS[month - 1]} {year}
      </Text>
      <TouchableOpacity onPress={onNext} hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}>
        <Text style={[styles.navArrow, { color: colors.textSub }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── REPORTS SCREEN ──────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { colors }                   = useTheme();
  const { state, getMonthlyStats }   = useApp();
  const now                          = dayjs();
  const [month, setMonth]            = useState(now.month() + 1);
  const [year,  setYear]             = useState(now.year());

  const monthlyStats = useMemo(
    () => getMonthlyStats(month, year),
    [month, year, state.tasks]
  );

  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD');
  const monthEnd   = dayjs(monthStart).endOf('month').format('YYYY-MM-DD');
  const monthTasks = state.tasks.filter(t => t.date >= monthStart && t.date <= monthEnd);

  // Plant breakdown
  const plantBreakdown = useMemo(() =>
    state.plants.map(plant => {
      const tasks     = monthTasks.filter(t => t.plantId === plant.id);
      const completed = tasks.filter(t => t.status === 'completed').length;
      const pending   = tasks.filter(t => t.status === 'pending').length;
      const overdue   = tasks.filter(t => t.status === 'overdue').length;
      const pct       = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      return { ...plant, tasks: tasks.length, completed, pending, overdue, pct };
    }),
    [monthTasks]
  );

  // Weekly trend — last 6 weeks
  const weeklyData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const wStart = dayjs().subtract(5 - i, 'week').startOf('week').format('YYYY-MM-DD');
      const wEnd   = dayjs().subtract(5 - i, 'week').endOf('week').format('YYYY-MM-DD');
      const wTasks = state.tasks.filter(t => t.date >= wStart && t.date <= wEnd);
      const done   = wTasks.filter(t => t.status === 'completed').length;
      const pct    = wTasks.length > 0 ? Math.round((done / wTasks.length) * 100) : 0;
      return { label: `W${i + 1}`, value: pct };
    }),
    [state.tasks]
  );

  // Smart insight
  const insight = useMemo(() => {
    const prev = getMonthlyStats(month === 1 ? 12 : month - 1, month === 1 ? year - 1 : year);
    const diff = monthlyStats.compliance - (prev?.compliance || 0);

    if (monthlyStats.total === 0)
      return { icon: '📭', text: 'No tasks recorded this month', color: colors.textMuted };
    if (diff > 10)
      return { icon: '🚀', text: `Up ${diff}% vs last month — excellent!`, color: SEMANTIC.success };
    if (diff < -10)
      return { icon: '⚠️', text: `Down ${Math.abs(diff)}% vs last month`, color: SEMANTIC.danger };
    if (monthlyStats.compliance >= 90)
      return { icon: '🏆', text: 'Outstanding compliance this month!', color: SEMANTIC.success };
    return { icon: '📈', text: `${monthlyStats.compliance}% overall compliance`, color: SEMANTIC.primary };
  }, [monthlyStats, month, year]);

  const compColor = monthlyStats.compliance >= 80 ? SEMANTIC.success
    : monthlyStats.compliance >= 50 ? SEMANTIC.warning : SEMANTIC.danger;

  const prevMonth = () => month === 1  ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 12 ? (setMonth(1),  setYear(y => y + 1)) : setMonth(m => m + 1);

  const exportReport = async () => {
    const lines = [
      `Safety Report — ${MONTHS[month - 1]} ${year}`,
      '='.repeat(40),
      `Total Tasks  : ${monthlyStats.total}`,
      `Completed    : ${monthlyStats.completed}`,
      `Compliance   : ${monthlyStats.compliance}%`,
      '',
      'Plant-wise Breakdown:',
      ...plantBreakdown.map(p => `  ${p.name}: ${p.pct}% (${p.completed}/${p.tasks})`),
    ];
    try {
      await Share.share({ message: lines.join('\n'), title: 'Safety Report' });
    } catch {
      Alert.alert('Error', 'Could not share the report.');
    }
  };

  const c = colors;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <Row style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Reports</Text>
          <TouchableOpacity
            onPress={exportReport}
            style={[styles.exportBtn, { backgroundColor: c.bgCard, borderColor: c.border }]}
            activeOpacity={0.75}
          >
            <Text style={{ color: SEMANTIC.primaryText, fontSize: 13, fontWeight: FONT.medium }}>
              ↑ Export
            </Text>
          </TouchableOpacity>
        </Row>

        {/* ── MONTH NAVIGATOR ────────────────────────────────────────── */}
        <MonthNavigator
          month={month} year={year}
          onPrev={prevMonth} onNext={nextMonth}
          colors={c}
        />
        <Spacer size={SPACING.lg} />

        {/* ── INSIGHT BANNER ─────────────────────────────────────────── */}
        <InsightCard icon={insight.icon} text={insight.text} color={insight.color} />
        <Spacer size={SPACING.lg} />

        {/* ── HERO COMPLIANCE CARD ────────────────────────────────────── */}
        <Card glow style={styles.heroCard}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: SPACING.lg }}>
              {/* Label */}
              <Text style={[styles.heroLabel, { color: c.textMuted }]}>
                {MONTHS[month - 1].toUpperCase()} {year}
              </Text>

              {/* BIG % — hero element */}
              <Text style={[styles.heroPct, { color: compColor }]}>
                {monthlyStats.compliance}%
              </Text>
              <Text style={[styles.heroSub, { color: c.text }]}>
                Compliance Rate
              </Text>

              <Spacer size={SPACING.md} />
              <ProgressBar progress={monthlyStats.compliance} color={compColor} height={5} />

              {/* Stats row */}
              <Row style={{ marginTop: SPACING.md, gap: SPACING.xl }}>
                {[
                  { v: monthlyStats.total,     label: 'Total',   color: c.text       },
                  { v: monthlyStats.completed, label: 'Done',    color: SEMANTIC.success },
                  { v: monthlyStats.total - monthlyStats.completed, label: 'Missed', color: SEMANTIC.danger },
                ].map((s, i) => (
                  <View key={i}>
                    <Text style={{ color: s.color, fontSize: 20, fontWeight: FONT.bold, letterSpacing: -0.5 }}>
                      {s.v}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
                      {s.label}
                    </Text>
                  </View>
                ))}
              </Row>
            </View>

            {/* Animated ring */}
            <ComplianceRing value={monthlyStats.compliance} color={compColor} />
          </Row>
        </Card>

        <Spacer size={SPACING.lg} />

        {/* ── QUICK STATS ─────────────────────────────────────────────── */}
        <Row style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
          <StatChip
            value={monthTasks.filter(t => t.status === 'pending').length}
            label="Pending"
            color={SEMANTIC.warning}
          />
          <StatChip
            value={monthTasks.filter(t => t.status === 'overdue').length}
            label="Overdue"
            color={SEMANTIC.danger}
          />
          <StatChip
            value={monthTasks.filter(t => t.status === 'completed').length}
            label="Done"
            color={SEMANTIC.success}
          />
        </Row>

        {/* ── WEEKLY TREND ────────────────────────────────────────────── */}
        <SectionHeader title="Weekly Trend" style={{ marginBottom: SPACING.md }} />
        <Card style={styles.chartCard} noPad>
          <View style={styles.chartInner}>
            <WeeklyBarChart data={weeklyData} color={SEMANTIC.primary} />
          </View>
        </Card>

        <Spacer size={SPACING.xl} />

        {/* ── PLANT COMPLIANCE ────────────────────────────────────────── */}
        <SectionHeader title="Plant Breakdown" style={{ marginBottom: SPACING.md }} />
        {plantBreakdown.map((p, index) => {
          const pc = p.pct >= 80 ? SEMANTIC.success
            : p.pct >= 50 ? SEMANTIC.warning : SEMANTIC.danger;

          return (
            <Card
              key={p.id}
              style={{ marginBottom: index < plantBreakdown.length - 1 ? SPACING.sm : 0 }}
              noPad
            >
              <View style={styles.plantRow}>
                {/* Left: dot + name */}
                <View style={[styles.plantDot, { backgroundColor: p.color }]} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                    <Text style={[styles.plantName, { color: c.text }]}>{p.name}</Text>
                    <Text style={[styles.plantPct, { color: pc }]}>{p.pct}%</Text>
                  </Row>
                  <ProgressBar progress={p.pct} color={p.color} height={4} />
                  <Row style={{ marginTop: SPACING.sm, gap: SPACING.md }}>
                    <Text style={[styles.plantMeta, { color: c.textMuted }]}>✅ {p.completed}</Text>
                    <Text style={[styles.plantMeta, { color: c.textMuted }]}>⏳ {p.pending}</Text>
                    <Text style={[styles.plantMeta, { color: c.textMuted }]}>🚨 {p.overdue}</Text>
                    <Text style={[styles.plantMeta, { color: c.textMuted, marginLeft: 'auto' }]}>
                      {p.tasks} tasks
                    </Text>
                  </Row>
                </View>
              </View>
            </Card>
          );
        })}

        <Spacer size={SPACING.xl} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: 80 },

  header: {
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   SPACING.lg,
  },
  title: {
    fontSize:      28,
    fontWeight:    FONT.bold,
    letterSpacing: -0.8,
  },
  exportBtn: {
    paddingVertical:   8,
    paddingHorizontal: 14,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },

  monthNav: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderRadius:   RADIUS.xl,
    borderWidth:    1,
    paddingVertical:   12,
    paddingHorizontal: SPACING.lg,
  },
  navArrow: {
    fontSize:   22,
    fontWeight: FONT.light,
    lineHeight: 26,
  },
  navTitle: {
    fontSize:   15,
    fontWeight: FONT.semibold,
    letterSpacing: -0.3,
  },

  insightCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.md,
    borderRadius:   RADIUS.lg,
    borderWidth:    1,
    paddingVertical:   SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    fontSize:   13,
    fontWeight: FONT.medium,
    lineHeight: 20,
    flex:       1,
  },

  heroCard: {
    padding: SPACING.xl,
  },
  heroLabel: {
    fontSize:      10,
    fontWeight:    FONT.semibold,
    letterSpacing: 1.2,
    marginBottom:  SPACING.xs,
  },
  heroPct: {
    fontSize:      48,
    fontWeight:    FONT.extrabold,
    letterSpacing: -2,
    lineHeight:    54,
  },
  heroSub: {
    fontSize:      16,
    fontWeight:    FONT.semibold,
    letterSpacing: -0.2,
    marginTop:     2,
  },

  chartCard: {},
  chartInner: {
    padding:       SPACING.lg,
    paddingBottom: SPACING.md,
  },

  plantRow: {
    flexDirection:  'row',
    gap:            SPACING.md,
    padding:        SPACING.md,
    paddingLeft:    SPACING.md,
    alignItems:     'flex-start',
  },
  plantDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginTop:    5,
    flexShrink:   0,
  },
  plantName: {
    fontSize:      14,
    fontWeight:    FONT.medium,
    letterSpacing: -0.2,
  },
  plantPct: {
    fontSize:      14,
    fontWeight:    FONT.bold,
    letterSpacing: -0.3,
  },
  plantMeta: {
    fontSize: 11,
  },
});
