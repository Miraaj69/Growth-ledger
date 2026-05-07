import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Animated, RefreshControl, TouchableOpacity, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW, TYPE } from './Constants_theme';
import { useTheme } from './Context_ThemeContext';
import { Card, SectionHeader, Row, Spacer, ProgressBar, Skeleton, SkeletonCard, StatusBadge, StatChip } from './Components_UIComponents';
import { FAB, FABSheet } from './Components_FABSheet';
import { useApp } from './Context_AppContext';
import dayjs from 'dayjs';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── COMPLIANCE RING ─────────────────────────────────────────────────────────
function ComplianceRing({ value, color, size = 104, stroke = 9 }) {
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const anim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 1200,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const dashOffset = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: [circ, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="transparent"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color, fontSize: 22, fontWeight: FONT.extrabold, letterSpacing: -0.8 }}>
          {value}%
        </Text>
      </View>
    </View>
  );
}

// ─── GREETING ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Night Shift 🌙';
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤';
  return 'Good Evening 🌆';
}

// ─── COMPLIANCE COLOR ─────────────────────────────────────────────────────────
function getComplianceColor(pct) {
  if (pct >= 80) return SEMANTIC.success;
  if (pct >= 50) return SEMANTIC.warning;
  return SEMANTIC.danger;
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { getTodayStats, getPlantStats, state, generateTasksForToday, syncOverdueTasks } = useApp();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen,    setFabOpen]    = useState(false);

  // Entry animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const stats      = getTodayStats();
  const compliance = stats.compliance;
  const compColor  = getComplianceColor(compliance);

  useEffect(() => {
    syncOverdueTasks();
    generateTasksForToday();

    setTimeout(() => {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }, 300);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    syncOverdueTasks();
    generateTasksForToday();
    setTimeout(() => setRefreshing(false), 600);
  };

  const today    = dayjs();
  const dateStr  = today.format('ddd, D MMM');
  const greeting = getGreeting();

  // Insight text
  const getInsight = () => {
    if (stats.overdue > 0)   return `⚠️  ${stats.overdue} overdue task${stats.overdue > 1 ? 's' : ''} need attention`;
    if (stats.pending === 0 && stats.total > 0) return '✅  All tasks completed for today!';
    if (stats.total === 0)   return '📋  No tasks scheduled today';
    return `⏳  ${stats.pending} task${stats.pending > 1 ? 's' : ''} remaining today`;
  };

  const insightColor = stats.overdue > 0 ? SEMANTIC.danger
    : (stats.pending === 0 && stats.total > 0) ? SEMANTIC.success
    : SEMANTIC.warning;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SEMANTIC.primary}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <Row style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.greeting, { color: colors.text }]}>{greeting}</Text>
              <Text style={[s.date, { color: colors.textMuted }]}>{dateStr}</Text>
            </View>
            <TouchableOpacity
              style={[s.avatar, { backgroundColor: SEMANTIC.primaryDim, borderColor: SEMANTIC.primaryMid }]}
              activeOpacity={0.75}
            >
              <Text style={[s.avatarText, { color: SEMANTIC.primaryText }]}>EHS</Text>
            </TouchableOpacity>
          </Row>

          {/* ── COMPLIANCE HERO ───────────────────────────────────────────── */}
          {loading ? (
            <SkeletonCard style={{ height: 170, marginBottom: SPACING.lg }} />
          ) : (
            <Card glow style={s.heroCard}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: text hierarchy */}
                <View style={{ flex: 1, paddingRight: SPACING.lg }}>
                  <Text style={[s.heroLabel, { color: colors.textMuted }]}>TODAY'S COMPLIANCE</Text>

                  {/* BIG: % is the hero */}
                  <Text style={[s.heroPct, { color: compColor }]}>{compliance}%</Text>

                  {/* MEDIUM: fraction */}
                  <Text style={[s.heroFraction, { color: colors.text }]}>
                    {stats.completed} / {stats.total} tasks
                  </Text>

                  <Spacer size={SPACING.md} />
                  <ProgressBar progress={compliance} color={compColor} height={5} />
                </View>

                {/* Right: animated ring */}
                <ComplianceRing value={compliance} color={compColor} />
              </Row>

              {/* Insight banner */}
              {stats.total > 0 && (
                <View style={[s.insightBanner, {
                  backgroundColor: insightColor + '10',
                  borderColor:     insightColor + '25',
                }]}>
                  <Text style={[s.insightText, { color: insightColor }]}>{getInsight()}</Text>
                </View>
              )}
            </Card>
          )}

          {/* ── STAT CHIPS ────────────────────────────────────────────────── */}
          {loading ? (
            <Row style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
              {[0,1,2].map(i => <Skeleton key={i} height={72} style={{ flex: 1, borderRadius: RADIUS.lg }} />)}
            </Row>
          ) : (
            <Row style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.80}
              >
                <StatChip
                  value={stats.pending}
                  label="Pending"
                  color={SEMANTIC.warning}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.80}
              >
                <StatChip
                  value={stats.completed}
                  label="Done"
                  color={SEMANTIC.success}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.80}
              >
                <StatChip
                  value={stats.overdue}
                  label="Overdue"
                  color={SEMANTIC.danger}
                />
              </TouchableOpacity>
            </Row>
          )}

          {/* ── PLANT STATUS ──────────────────────────────────────────────── */}
          <SectionHeader
            title="Plant Status"
            action="View All"
            onAction={() => navigation.navigate('Tasks')}
            style={{ marginBottom: SPACING.md }}
          />

          {loading ? (
            [0, 1, 2].map(i => (
              <SkeletonCard key={i} style={{ marginBottom: SPACING.sm }} />
            ))
          ) : (
            state.plants.map((plant, index) => {
              const ps = getPlantStats(plant.id);
              const pc = getComplianceColor(ps.compliance);

              return (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  stats={ps}
                  compColor={pc}
                  onPress={() => navigation.navigate('Tasks')}
                  style={{ marginBottom: index < state.plants.length - 1 ? SPACING.sm : 0 }}
                />
              );
            })
          )}

          <Spacer size={100} />
        </Animated.View>
      </ScrollView>

      <FAB onPress={() => setFabOpen(true)} />
      <FABSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
    </SafeAreaView>
  );
}

// ─── PLANT CARD ───────────────────────────────────────────────────────────────
function PlantCard({ plant, stats, compColor, onPress, style }) {
  const { colors } = useTheme();

  return (
    <Card onPress={onPress} style={[s.plantCard, style]} noPad>
      <View style={s.plantCardInner}>
        <Row style={{ justifyContent: 'space-between', marginBottom: SPACING.sm }}>
          <Row style={{ gap: SPACING.sm, flex: 1 }}>
            {/* Color indicator — semantic only, not decorative */}
            <View style={[s.plantColorDot, { backgroundColor: plant.color }]} />
            <Text style={[s.plantName, { color: colors.text }]} numberOfLines={1}>
              {plant.name}
            </Text>
          </Row>
          <Row style={{ gap: SPACING.sm }}>
            <Text style={[s.plantPct, { color: compColor }]}>{stats.compliance}%</Text>
          </Row>
        </Row>

        {/* Progress — uses plant color as data indicator */}
        <ProgressBar progress={stats.compliance} color={plant.color} height={4} />

        <Text style={[s.plantMeta, { color: colors.textMuted }]}>
          {stats.completed} of {stats.total} tasks done
        </Text>
      </View>
    </Card>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: SPACING.lg,
  },

  header: {
    justifyContent: 'space-between',
    marginBottom:   SPACING.xl,
  },
  greeting: {
    fontSize:     22,
    fontWeight:   FONT.bold,
    letterSpacing: -0.5,
  },
  date: {
    fontSize:   13,
    fontWeight: FONT.regular,
    marginTop:  3,
  },
  avatar: {
    width:          42,
    height:         42,
    borderRadius:   21,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize:   11,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
  },

  heroCard: {
    marginBottom: SPACING.lg,
    padding:      SPACING.xl,
  },
  heroLabel: {
    fontSize:     10,
    fontWeight:   FONT.semibold,
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  heroPct: {
    fontSize:     52,
    fontWeight:   FONT.extrabold,
    letterSpacing: -2,
    lineHeight:   58,
  },
  heroFraction: {
    fontSize:   16,
    fontWeight: FONT.semibold,
    marginTop:  2,
    letterSpacing: -0.3,
  },

  insightBanner: {
    marginTop:    SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth:  1,
    paddingVertical:   SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  insightText: {
    fontSize:   13,
    fontWeight: FONT.medium,
    lineHeight: 20,
  },

  // Plant card
  plantCard: {},
  plantCardInner: {
    padding:       SPACING.md,
    paddingBottom: SPACING.sm + 2,
  },
  plantColorDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  plantName: {
    fontSize:   14,
    fontWeight: FONT.medium,
    flex:       1,
    letterSpacing: -0.2,
  },
  plantPct: {
    fontSize:   14,
    fontWeight: FONT.bold,
    letterSpacing: -0.3,
  },
  plantMeta: {
    fontSize:  11,
    marginTop: SPACING.xs + 2,
  },
});
