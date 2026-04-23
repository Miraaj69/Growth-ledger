// GrowthScreen.js — Premium Redesign v2
// Layout matches screenshot exactly: EF tab active, all sections pixel-perfect
import React, {
  useState, useMemo, useRef, useCallback, memo,
} from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet,
  TextInput, Switch, Modal, Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp }   from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R, SHADOW as SDW } from './theme';
import { Card, SH, Bar, Chip, Empty } from './UI';
import { fmt, safeNum, safePct, deriveState } from './helpers';

// ─────────────────────────────────────────────────────────
// HAPTICS
// ─────────────────────────────────────────────────────────
const tap  = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);  } catch (_) {} };
const tapM = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {} };
const tap3 = () => { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {} };

// ─────────────────────────────────────────────────────────
// PRESS SCALE HOOK
// ─────────────────────────────────────────────────────────
function usePress(s) {
  var scale = s || 0.96;
  var anim = useRef(new Animated.Value(1)).current;
  var onIn  = useCallback(function() {
    Animated.spring(anim, { toValue: scale, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }, [anim, scale]);
  var onOut = useCallback(function() {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 28 }).start();
  }, [anim]);
  return { anim: anim, onIn: onIn, onOut: onOut };
}

// ─────────────────────────────────────────────────────────
// TAB META
// ─────────────────────────────────────────────────────────
var TAB_META = {
  career: { icon: '\uD83D\uDE80', label: 'Career' },
  leaves: { icon: '\uD83D\uDCC5', label: 'Leaves' },
  ef:     { icon: '\uD83D\uDEDF', label: 'EF'     },
  stats:  { icon: '\uD83D\uDCCA', label: 'Stats'  },
};

// ─────────────────────────────────────────────────────────
// PREMIUM PILL TAB BAR
// ─────────────────────────────────────────────────────────
function PillTabs(props) {
  var tabs = props.tabs;
  var active = props.active;
  var onChange = props.onChange;
  var theme = useTheme();
  var T = theme.T;
  return (
    <View style={[ptSt.wrap, { backgroundColor: T.l1, borderColor: T.border }]}>
      {tabs.map(function(key) {
        var on = active === key;
        var meta = TAB_META[key];
        return (
          <Pressable
            key={key}
            onPress={function() { tap(); onChange(key); }}
            style={{ flex: 1 }}
          >
            <View style={[ptSt.pill, on ? ptSt.pillActive : { backgroundColor: 'transparent' }]}>
              <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
              <Text style={[ptSt.label, { color: on ? '#fff' : T.t3 }, on && ptSt.labelActive]}>
                {meta.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

var ptSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 5,
    borderWidth: 1,
    marginBottom: 16,
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 5,
  },
  pillActive: {
    backgroundColor: '#4F8CFF',
    shadowColor: '#4F8CFF',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  label:       { fontSize: 12, fontWeight: '500' },
  labelActive: { fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────
// CIRCULAR PROGRESS
// ─────────────────────────────────────────────────────────
var CircularProgress = memo(function(props) {
  var pct = props.pct || 0;
  var size = props.size || 110;
  var strokeW = props.strokeW || 10;
  var clr = pct < 30 ? '#EF4444' : pct < 70 ? '#F59E0B' : '#22C55E';
  var fill = Math.min(pct, 100) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeW,
        borderColor: clr + '22',
      }} />
      <View style={{ position: 'absolute', width: size, height: size }}>
        <View style={{ position: 'absolute', width: size / 2, height: size, right: 0, overflow: 'hidden' }}>
          <View style={{
            width: size, height: size, borderRadius: size / 2,
            borderWidth: strokeW,
            borderColor: 'transparent',
            borderRightColor: fill > 0 ? clr : 'transparent',
            borderTopColor: fill > 0.25 ? clr : 'transparent',
            transform: [{ rotate: fill > 0.5 ? '0deg' : ((fill / 0.5) * 180 - 180) + 'deg' }],
          }} />
        </View>
        {fill > 0.5 && (
          <View style={{ position: 'absolute', width: size / 2, height: size, left: 0, overflow: 'hidden' }}>
            <View style={{
              width: size, height: size, borderRadius: size / 2,
              borderWidth: strokeW,
              borderColor: 'transparent',
              borderLeftColor: clr,
              borderBottomColor: fill > 0.75 ? clr : 'transparent',
              transform: [{ rotate: ((fill - 0.5) / 0.5 * 180) + 'deg' }],
            }} />
          </View>
        )}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: clr, letterSpacing: -1 }}>
          {pct}
          <Text style={{ fontSize: 14, fontWeight: '700' }}>%</Text>
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 1 }}>
          Complete
        </Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────
var StatusBadge = memo(function(props) {
  var pct = props.pct;
  var cfg = pct < 30
    ? { icon: '\u26A0\uFE0F', label: 'Risk Zone',       bg: '#FEF2F2', border: '#FECACA', text: '#EF4444' }
    : pct < 70
    ? { icon: '\uD83D\uDEE1\uFE0F', label: 'Building Safety', bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' }
    : { icon: '\u2705', label: 'Secure',           bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' };

  return (
    <View style={{
      backgroundColor: cfg.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: cfg.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Text style={{ fontSize: 14 }}>{cfg.icon}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color: cfg.text }}>{cfg.label}</Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// MINI STAT BOX
// ─────────────────────────────────────────────────────────
var MiniStat = memo(function(props) {
  var icon = props.icon;
  var label = props.label;
  var value = props.value;
  var sub = props.sub;
  var color = props.color;
  var theme = useTheme();
  var T = theme.T;
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: color + '18',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 6,
      }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 9, color: T.t3, fontWeight: '600', marginBottom: 2, textAlign: 'center' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: T.t1, letterSpacing: -0.3 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: T.t3 }}>{sub}</Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// FUND CARD — progress bar sub-card
// ─────────────────────────────────────────────────────────
var FundCard = memo(function(props) {
  var label = props.label;
  var target = props.target;
  var saved = props.saved;
  var color = props.color;
  var theme = useTheme();
  var T = theme.T;
  var pct = safePct(saved, target);
  return (
    <View style={{
      flex: 1,
      backgroundColor: T.l2,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: T.border,
    }}>
      <Text style={{ fontSize: 9, color: T.t3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: T.t1, letterSpacing: -0.5 }}>{fmt(target)}</Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color: pct >= 100 ? '#22C55E' : color }}>{pct}%</Text>
      </View>
      <Bar value={saved} total={Math.max(target, 1)} color={color} h={7} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: T.t3 }}>Saved: {fmt(saved)}</Text>
        <Text style={{ fontSize: 10, color: T.t3 }}>Need: {fmt(Math.max(0, target - saved))} more</Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// QUICK ACTION BUTTON
// ─────────────────────────────────────────────────────────
var QuickBtn = memo(function(props) {
  var label = props.label;
  var onPress = props.onPress;
  var accent = props.accent;
  var theme = useTheme();
  var T = theme.T;
  var pa = usePress(0.94);
  return (
    <Pressable
      onPress={function() { tap(); onPress && onPress(); }}
      onPressIn={pa.onIn}
      onPressOut={pa.onOut}
    >
      <Animated.View style={[{
        transform: [{ scale: pa.anim }],
        backgroundColor: accent ? '#4F8CFF' : T.l2,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: accent ? '#4F8CFF40' : T.border,
        alignItems: 'center',
        justifyContent: 'center',
      }, accent && {
        shadowColor: '#4F8CFF',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
      }]}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: accent ? '#fff' : '#4F8CFF' }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────
// AI INSIGHT ROW
// ─────────────────────────────────────────────────────────
var InsightRow = memo(function(props) {
  var icon = props.icon;
  var title = props.title;
  var sub = props.sub;
  var color = props.color;
  var last = props.last;
  var theme = useTheme();
  var T = theme.T;
  var pa = usePress(0.97);
  return (
    <Pressable onPressIn={pa.onIn} onPressOut={pa.onOut} onPress={function() { tap(); }}>
      <Animated.View style={[
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, transform: [{ scale: pa.anim }] },
        !last && { borderBottomWidth: 1, borderBottomColor: T.border },
      ]}>
        <View style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: color + '18',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: T.t1, marginBottom: 1 }}>{title}</Text>
          <Text style={{ fontSize: 11, color: T.t3 }}>{sub}</Text>
        </View>
        <Text style={{ fontSize: 16, color: T.t3 }}>{'>'}</Text>
      </Animated.View>
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────
// MILESTONE STEP
// ─────────────────────────────────────────────────────────
var MilestoneStep = memo(function(props) {
  var sub = props.sub;
  var label = props.label;
  var done = props.done;
  var active = props.active;
  var last = props.last;
  var theme = useTheme();
  var T = theme.T;
  var color = done ? '#22C55E' : active ? '#4F8CFF' : T.t4;
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      {!last && (
        <View style={{
          position: 'absolute', top: 14, left: '50%', right: '-50%',
          height: 2,
          backgroundColor: done ? '#22C55E' : active ? '#4F8CFF50' : T.border,
          zIndex: 0,
        }} />
      )}
      <View style={{
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: done ? '#22C55E' : active ? '#4F8CFF' : T.l2,
        borderWidth: done || active ? 0 : 1.5,
        borderColor: active ? '#4F8CFF' : T.border,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
        shadowColor: active || done ? color : 'transparent',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: active ? 4 : 0,
      }}>
        <Text style={{ fontSize: 12 }}>{done ? '\u2713' : active ? '\u25CF' : '\uD83D\uDD12'}</Text>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '800', color: color, marginTop: 6, textAlign: 'center' }}>
        {sub}
      </Text>
      <Text style={{ fontSize: 8, color: T.t3, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// CUSTOM AMOUNT MODAL
// ─────────────────────────────────────────────────────────
function CustomModal(props) {
  var visible = props.visible;
  var onClose = props.onClose;
  var onConfirm = props.onConfirm;
  var theme = useTheme();
  var T = theme.T;
  var val = useState('');
  var setVal = val[1];
  val = val[0];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable style={{
          backgroundColor: T.l1,
          borderRadius: 20,
          padding: 24,
          width: '82%',
          borderWidth: 1,
          borderColor: T.border,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: T.t1, marginBottom: 16 }}>Custom Amount</Text>
          <TextInput
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={T.t3}
            style={{
              backgroundColor: T.l2,
              borderRadius: 12,
              padding: 14,
              fontSize: 18,
              fontWeight: '700',
              color: T.t1,
              borderWidth: 1,
              borderColor: T.border,
              marginBottom: 16,
            }}
            autoFocus
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, backgroundColor: T.l2, borderRadius: 12, padding: 13, alignItems: 'center' }}
            >
              <Text style={{ color: T.t2, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={function() { tap3(); onConfirm(safeNum(val)); setVal(''); }}
              style={{ flex: 1, backgroundColor: '#4F8CFF', borderRadius: 12, padding: 13, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Add {val ? 'Rs.' + val : 'Rs.0'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// EMERGENCY FUND TAB
// ─────────────────────────────────────────────────────────
function EFTab() {
  var theme = useTheme();
  var T = theme.T;
  var app = useApp();
  var s = app.state;
  var set = app.set;
  var showCustom = useState(false);
  var setShowCustom = showCustom[1];
  showCustom = showCustom[0];

  var d = useMemo(function() {
    try { return deriveState(s); } catch (_) { return { needsBudget: 0, totalIncome: 0, salary: 0 }; }
  }, [s]);

  var monthly  = d.needsBudget || (d.salary * 0.5) || 0;
  var t3m      = monthly * 3;
  var t6m      = monthly * 6;
  var efSaved  = safeNum(s.efSaved) || 0;
  var pct6m    = safePct(efSaved, t6m);
  var pct3m    = safePct(efSaved, t3m);

  var monthlyNeeded6 = monthly > 0 ? Math.round(Math.max(0, t6m - efSaved) / 6) : 0;
  var dailyTarget    = Math.round(monthlyNeeded6 / 30);
  var weeklyTarget   = Math.round(monthlyNeeded6 / 4.3);
  var monthsLeft     = monthlyNeeded6 > 0 && d.salary > 0
    ? Math.ceil((t6m - efSaved) / Math.max(monthlyNeeded6, 1))
    : 0;
  var survivalMonths = monthly > 0 ? (efSaved / monthly).toFixed(1) : '0';

  var autoSave = s.efAutoSave || false;
  var autoAmt  = safeNum(s.efAutoAmt) || 2000;
  var nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  var addToFund = useCallback(function(amount) {
    if (amount <= 0) return;
    tap3();
    set({ efSaved: Math.max(0, efSaved + amount) });
  }, [efSaved, set]);

  var MILESTONES = [
    { sub: 'Rs.10K',  label: 'First Milestone', threshold: 10000 },
    { sub: 'Rs.25K',  label: 'Getting Started',  threshold: 25000 },
    { sub: '50%',     label: 'Halfway There',    threshold: t6m * 0.5 },
    { sub: '75%',     label: 'Almost Secure',    threshold: t6m * 0.75 },
    { sub: '100%',    label: 'Fully Secured',    threshold: t6m },
  ];

  var insights = useMemo(function() {
    var list = [];
    if (monthly > 0 && efSaved < t6m * 0.5)
      list.push({ icon: '\uD83D\uDCC9', title: 'Reduce dining out by ' + fmt(monthly * 0.1) + '/month', sub: 'You can save ' + fmt(monthly * 0.1 * 12) + ' in a year.', color: '#22C55E' });
    if (s.sips && s.sips.length > 0 && efSaved < t3m)
      list.push({ icon: '\u23F8\uFE0F', title: 'Consider pausing 1 SIP', sub: 'Temporarily to complete EF faster.', color: '#F59E0B' });
    list.push({ icon: '\u2B50', title: 'Bonus incoming?', sub: 'Add it to your emergency fund!', color: '#A78BFA' });
    return list;
  }, [efSaved, t3m, t6m, monthly, s.sips]);

  if (monthly === 0) {
    return (
      <Card>
        <Empty icon="\uD83D\uDEDF" title="Add salary first" sub="Enter your salary in Money tab for accurate EF calculation." />
      </Card>
    );
  }

  return (
    <View style={{ gap: 12 }}>

      {/* CARD 1: Emergency Fund Status */}
      <Card>
        <SH title="Emergency Fund Status" />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <CircularProgress pct={pct6m} />
          <View style={{ flex: 1, gap: 8 }}>
            <StatusBadge pct={pct6m} />
            <Text style={{ fontSize: 12, color: T.t2, lineHeight: 18 }}>
              {"You're building your safety net! You need "}
              <Text style={{ fontWeight: '700', color: T.t1 }}>{fmt(Math.max(0, t6m - efSaved))}</Text>
              {" more to reach your 6-month target."}
            </Text>
          </View>
          <View style={{
            width: 60, height: 60, borderRadius: 16,
            backgroundColor: '#EFF6FF',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 32 }}>{'\uD83C\uDFE6'}</Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: T.border,
          paddingTop: 14,
        }}>
          <MiniStat icon="\uD83D\uDCC5" label="Survival Months" value={survivalMonths} sub="months"  color="#4F8CFF" />
          <View style={{ width: 1, backgroundColor: T.border }} />
          <MiniStat icon="\u23F0" label="Time to Complete" value={String(monthsLeft)} sub="months" color="#A78BFA" />
          <View style={{ width: 1, backgroundColor: T.border }} />
          <MiniStat icon="\uD83C\uDFAF" label="Daily Target" value={'Rs.' + dailyTarget} sub="per day" color="#22C55E" />
          <View style={{ width: 1, backgroundColor: T.border }} />
          <MiniStat icon="\uD83D\uDCC6" label="Weekly Target" value={weeklyTarget > 999 ? 'Rs.' + (weeklyTarget / 1000).toFixed(1) + 'K' : 'Rs.' + weeklyTarget} sub="per week" color="#F59E0B" />
        </View>
      </Card>

      {/* CARD 2: Your Emergency Fund */}
      <Card>
        <SH title="Your Emergency Fund" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <FundCard label="3-MONTH FUND" target={t3m} saved={efSaved} color="#4F8CFF" />
          <FundCard label="6-MONTH FUND (RECOMMENDED)" target={t6m} saved={efSaved} color="#22C55E" />
        </View>
      </Card>

      {/* CARDS 3 & 4: Quick Actions + Auto Save */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <SH title="Quick Actions" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <QuickBtn label="+ Rs.500"   onPress={function() { addToFund(500); }} />
            <QuickBtn label="+ Rs.1,000" onPress={function() { addToFund(1000); }} />
            <QuickBtn label="+ Rs.5,000" onPress={function() { addToFund(5000); }} />
            <QuickBtn label="Custom"     onPress={function() { setShowCustom(true); }} />
          </View>
        </Card>

        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>Auto Save</Text>
            <Text style={{ fontSize: 16 }}>{'\u2699\uFE0F'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, color: T.t2 }}>Auto save from income</Text>
            <Switch
              value={autoSave}
              onValueChange={function(v) { tapM(); set({ efAutoSave: v }); }}
              trackColor={{ false: T.l3, true: '#4F8CFF' }}
              thumbColor="#fff"
            />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#4F8CFF' }}>
            {fmt(autoAmt)}
            <Text style={{ fontSize: 12, fontWeight: '500', color: T.t3 }}> / month</Text>
          </Text>
          <Text style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>
            Next auto-save: {nextMonth}
          </Text>
        </Card>
      </View>

      {/* CARDS 5 & 6: AI Insights + Real Life Impact */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>{'\uD83E\uDD16'}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: T.t1 }}>AI Insights</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#4F8CFF', fontWeight: '700' }}>View All</Text>
          </View>
          {insights.map(function(ins, i) {
            return (
              <InsightRow
                key={i}
                icon={ins.icon}
                title={ins.title}
                sub={ins.sub}
                color={ins.color}
                last={i === insights.length - 1}
              />
            );
          })}
        </Card>

        <Card style={{ flex: 1, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Text style={{ fontSize: 15 }}>{'\uD83D\uDEE1\uFE0F'}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>Real Life Impact</Text>
          </View>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 10,
            borderWidth: 1,
            borderColor: '#BBF7D0',
            marginBottom: 10,
          }}>
            <Text style={{ fontSize: 11, color: '#475569', lineHeight: 15 }}>
              If you lose your job today, you can maintain your lifestyle for
            </Text>
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#16A34A', letterSpacing: -1, marginTop: 4 }}>
              {survivalMonths}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#16A34A' }}>months</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 38 }}>{'\u2602\uFE0F'}</Text>
          </View>
        </Card>
      </View>

      {/* CARD 7: Milestones */}
      <Card>
        <SH title="Milestones" />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 4, paddingHorizontal: 4 }}>
          {MILESTONES.map(function(ms, i) {
            return (
              <MilestoneStep
                key={i}
                sub={ms.sub}
                label={ms.label}
                done={efSaved >= ms.threshold && ms.threshold > 0}
                active={efSaved < ms.threshold && (i === 0 || efSaved >= MILESTONES[i - 1].threshold)}
                last={i === MILESTONES.length - 1}
              />
            );
          })}
        </View>
      </Card>

      <CustomModal
        visible={showCustom}
        onClose={function() { setShowCustom(false); }}
        onConfirm={function(amt) { addToFund(amt); setShowCustom(false); }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// CAREER TAB
// ─────────────────────────────────────────────────────────
var LADDER = [
  { role: 'HSE Officer',       years: '0-3 yrs',  icon: '\uD83D\uDEE1\uFE0F', color: '#4F8CFF', active: true,  sal: 'Rs.3L-Rs.6L',   skills: ['Risk Assessment', 'HIRA', 'Incident Inv.'] },
  { role: 'Senior HSE Engr',   years: '3-6 yrs',  icon: '\u26A1',  color: '#22C55E', active: false, sal: 'Rs.6L-Rs.12L',  skills: ['ISO 45001 LA', 'EHS Mgmt', 'Team Lead'] },
  { role: 'HSE Manager',       years: '6-10 yrs', icon: '\uD83C\uDFAF', color: '#A78BFA', active: false, sal: 'Rs.12L-Rs.25L', skills: ['HSE Strategy', 'Budget', 'Regulatory'] },
  { role: 'HSE Director / VP', years: '10+ yrs',  icon: '\uD83D\uDC51', color: '#F59E0B', active: false, sal: 'Rs.25L+',       skills: ['Corporate HSE', 'Board', 'Global'] },
];
var CERTS = [
  { name: 'NEBOSH IGC',           body: 'NEBOSH UK', icon: '\uD83C\uDFC5', defStatus: 'Done'        },
  { name: 'IOSH Managing Safely', body: 'IOSH UK',   icon: '\uD83C\uDF96\uFE0F', defStatus: 'Done'  },
  { name: 'ISO 45001 LA',         body: 'BSI/IRCA',  icon: '\uD83D\uDCCB', defStatus: 'In Progress' },
  { name: 'NEBOSH Diploma',       body: 'NEBOSH UK', icon: '\uD83C\uDFC6', defStatus: 'Planned'     },
  { name: 'ADIS',                 body: 'IICPE',     icon: '\uD83D\uDCDD', defStatus: 'Planned'     },
];

function certStyle(status) {
  if (status === 'Done')        return { bg: '#22C55E22', color: '#22C55E', border: '#22C55E50', badge: '\u2713 Done' };
  if (status === 'In Progress') return { bg: '#F59E0B22', color: '#F59E0B', border: '#F59E0B50', badge: '\u23F3 In Progress' };
  return { bg: 'rgba(255,255,255,0.04)', color: '#6B7280', border: 'transparent', badge: '\uD83D\uDCDD Planned' };
}

function CareerTab() {
  var theme = useTheme();
  var T = theme.T;
  var app = useApp();
  var s = app.state;
  var userCerts = s.certifications || [];
  var getStatus = function(name) {
    return (userCerts.find(function(c) { return c && c.name && c.name.indexOf(name.split(' ')[0]) !== -1; }) || {}).status
      || (CERTS.find(function(c) { return c.name === name; }) || {}).defStatus
      || 'Planned';
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <SH title="Career Roadmap" />
        {LADDER.map(function(step, i) {
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={[cSt.icon, {
                  backgroundColor: step.active ? step.color : T.l2,
                  borderColor:     step.active ? 'transparent' : T.border,
                  shadowColor:     step.active ? step.color : 'transparent',
                  shadowOpacity:   step.active ? 0.5 : 0,
                  shadowRadius: 12, elevation: step.active ? 6 : 0,
                }]}>
                  <Text style={{ fontSize: 18 }}>{step.icon}</Text>
                </View>
                {i < LADDER.length - 1 && (
                  <View style={{ width: 2, height: 44, marginVertical: 3, backgroundColor: step.active ? step.color + '50' : T.border }} />
                )}
              </View>
              <View style={{ flex: 1, paddingTop: 8, paddingBottom: i < LADDER.length - 1 ? 0 : 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: step.active ? step.color : T.t2 }}>{step.role}</Text>
                  {step.active && <Chip label="You are here" color={step.color} dot sm />}
                </View>
                <Text style={{ fontSize: 11, color: T.t3, marginBottom: 6 }}>{step.years} · {step.sal}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: i < LADDER.length - 1 ? 8 : 0 }}>
                  {step.skills.map(function(sk) {
                    return (
                      <View key={sk} style={{ backgroundColor: step.color + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: step.color }}>{sk}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <SH
          title="Certifications"
          right={CERTS.filter(function(c) { return getStatus(c.name) === 'Done'; }).length + '/' + CERTS.length + ' done'}
          rightColor="#22C55E"
        />
        {CERTS.map(function(cert, i) {
          var status = getStatus(cert.name);
          var cs = certStyle(status);
          return (
            <View key={i} style={[cSt.certRow, {
              backgroundColor: cs.bg,
              borderColor: cs.border,
              borderWidth: status === 'Done' ? 1.5 : 1,
              marginBottom: i < CERTS.length - 1 ? 8 : 0,
            }]}>
              <View style={[cSt.certIcon, { backgroundColor: cs.color + '22' }]}>
                <Text style={{ fontSize: 20 }}>{cert.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: status === 'Done' ? cs.color : T.t1 }}>{cert.name}</Text>
                <Text style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>{cert.body}</Text>
              </View>
              <View style={{ backgroundColor: cs.color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: cs.color }}>{cs.badge}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// LEAVE TAB
// ─────────────────────────────────────────────────────────
var LEAVE_TYPES = [
  { type: 'PL', label: 'Planned Leave', icon: '\uD83C\uDFD6\uFE0F', color: '#4F8CFF' },
  { type: 'SL', label: 'Sick Leave',    icon: '\uD83C\uDFE5', color: '#EF4444' },
  { type: 'CL', label: 'Casual Leave',  icon: '\u2615', color: '#F59E0B' },
];

function LeaveTab() {
  var theme = useTheme();
  var T = theme.T;
  var app = useApp();
  var s = app.state;

  var initLeaves = LEAVE_TYPES.map(function(lt) {
    var match = (s.leaves || []).find(function(l) { return l.type === lt.type; });
    return Object.assign({}, lt, { total: String((match && match.total) || '0'), used: String((match && match.used) || '0') });
  });
  var leavesState = useState(initLeaves);
  var leaves = leavesState[0];
  var setLeaves = leavesState[1];

  var update = function(i, field, val) {
    setLeaves(function(prev) {
      return prev.map(function(l, idx) {
        return idx === i ? Object.assign({}, l, { [field]: val }) : l;
      });
    });
  };

  var parsed = leaves.map(function(l) {
    return Object.assign({}, l, {
      totalN: safeNum(l.total),
      usedN:  safeNum(l.used),
      remN:   Math.max(0, safeNum(l.total) - safeNum(l.used)),
      pct:    safePct(safeNum(l.used), safeNum(l.total)),
    });
  });
  var grand = {
    total: parsed.reduce(function(a, l) { return a + l.totalN; }, 0),
    used:  parsed.reduce(function(a, l) { return a + l.usedN;  }, 0),
    rem:   parsed.reduce(function(a, l) { return a + l.remN;   }, 0),
  };
  var grandPct = safePct(grand.used, grand.total);

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <SH title="Leave Overview" />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {[{ label: 'Total', val: grand.total, color: T.t1 }, { label: 'Used', val: grand.used, color: '#EF4444' }, { label: 'Remaining', val: grand.rem, color: '#22C55E' }].map(function(c, i) {
            return (
              <View key={i} style={{ flex: 1, backgroundColor: T.l2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: c.color }}>{c.val}</Text>
                <Text style={{ fontSize: 11, color: T.t3, marginTop: 3 }}>{c.label}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: T.t3 }}>Overall usage</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: grandPct > 70 ? '#EF4444' : '#22C55E' }}>{grandPct}%</Text>
        </View>
        <Bar value={grand.used} total={Math.max(grand.total, 1)} color={grandPct > 70 ? '#EF4444' : '#4F8CFF'} h={10} />
      </Card>

      <Card>
        <SH title="By Category" />
        {parsed.map(function(l, i) {
          return (
            <View key={l.type} style={[{ paddingVertical: 14 }, i < parsed.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>{l.icon}</Text>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: T.t1 }}>{l.label}</Text>
                </View>
                <View style={{ backgroundColor: l.color + '20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: l.color }}>{l.pct}%</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: T.t3, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Total</Text>
                  <TextInput
                    value={l.total}
                    onChangeText={function(v) { update(i, 'total', v); }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={T.t3}
                    style={{ backgroundColor: T.l2, borderRadius: 10, padding: 10, color: T.t1, fontWeight: '700', borderWidth: 1, borderColor: T.border, fontSize: 14 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: T.t3, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Used</Text>
                  <TextInput
                    value={l.used}
                    onChangeText={function(v) { update(i, 'used', v); }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={T.t3}
                    style={{ backgroundColor: T.l2, borderRadius: 10, padding: 10, color: T.t1, fontWeight: '700', borderWidth: 1, borderColor: T.border, fontSize: 14 }}
                  />
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 }}>
                  <Text style={{ fontSize: 10, color: T.t3, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Left</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: l.remN > 0 ? '#22C55E' : '#EF4444' }}>{l.remN}</Text>
                </View>
              </View>
              <Bar value={l.usedN} total={Math.max(l.totalN, 1)} color={l.color} h={7} />
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STATS TAB
// ─────────────────────────────────────────────────────────
function StatsTab() {
  var theme = useTheme();
  var T = theme.T;
  var app = useApp();
  var s = app.state;
  var expenses = s.expenses || [];
  var needsPct = (expenses.find(function(e) { return e && e.label === 'Needs'; }) || {}).pct  || 0;
  var wantsPct = (expenses.find(function(e) { return e && e.label === 'Wants'; }) || {}).pct  || 0;
  var savPct   = (expenses.find(function(e) { return e && e.label === 'Savings'; }) || {}).pct || 0;

  var rColor = function(r) { return r === 'Good' ? '#22C55E' : r === 'OK' ? '#F59E0B' : '#EF4444'; };
  var rate   = function(pct, type) {
    if (type === 'savings') return pct >= 20 ? 'Good' : pct >= 15 ? 'OK' : 'Low';
    if (type === 'wants')   return pct <= 30 ? 'Good' : pct <= 40 ? 'OK' : 'High';
    return pct <= 55 ? 'Good' : pct <= 65 ? 'OK' : 'High';
  };
  var rows = [
    { label: 'Needs',   pct: needsPct, target: 50, color: '#4F8CFF', type: 'needs'   },
    { label: 'Wants',   pct: wantsPct, target: 30, color: '#F59E0B', type: 'wants'   },
    { label: 'Savings', pct: savPct,   target: 20, color: '#22C55E', type: 'savings' },
  ];

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <SH title="Expense Split" />
        {rows.map(function(e, i) {
          var r = rate(e.pct, e.type);
          return (
            <View key={e.label} style={[{ paddingVertical: 13 }, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: e.color }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: T.t1 }}>{e.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: e.color }}>{e.pct}%</Text>
                  <Chip label={r} color={rColor(r)} sm />
                </View>
              </View>
              <Bar value={e.pct} total={100} color={e.color} h={7} />
              <Text style={{ fontSize: 11, color: T.t3, marginTop: 5 }}>
                Target: {e.target}% · {e.pct > e.target ? '+' + (e.pct - e.target) + '% over' : e.pct < e.target ? '-' + (e.target - e.pct) + '% under' : 'Right'}
              </Text>
            </View>
          );
        })}
      </Card>

      <Card>
        <SH title="Improvement Tips" />
        {[
          { icon: '\uD83C\uDFAF', tip: 'Automate savings on salary day - transfer 20% first' },
          { icon: '\uD83D\uDCF1', tip: 'No shopping apps for 30 days - saves Rs.3K-5K/month' },
          { icon: '\uD83C\uDF71', tip: 'Meal prep on Sundays - saves Rs.3,000-5,000/month on food' },
          { icon: '\uD83D\uDCB3', tip: 'Set a hard monthly limit on wants spending' },
        ].map(function(t, i) {
          return (
            <View key={i} style={[{ flexDirection: 'row', gap: 12, paddingVertical: 10 }, i < 3 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
              <Text style={{ fontSize: 20 }}>{t.icon}</Text>
              <Text style={{ fontSize: 13, color: T.t2, lineHeight: 19, flex: 1 }}>{t.tip}</Text>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────
var TABS = ['career', 'leaves', 'ef', 'stats'];

export default function GrowthScreen() {
  var theme = useTheme();
  var T = theme.T;
  var tabState = useState('ef');
  var tab = tabState[0];
  var setTab = tabState[1];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={{ paddingTop: 56, paddingHorizontal: SP.md, paddingBottom: SP.md }}>
        <Text style={{ fontSize: 27, fontWeight: '800', color: T.t1, letterSpacing: -0.5 }}>Growth</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 2 }}>
          Career · Leaves · Emergency Fund · Analytics
        </Text>
      </View>

      <View style={{ paddingHorizontal: SP.md }}>
        <PillTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'career' && <CareerTab />}
        {tab === 'leaves' && <LeaveTab />}
        {tab === 'ef'     && <EFTab />}
        {tab === 'stats'  && <StatsTab />}
      </View>
    </ScrollView>
  );
}

var cSt = StyleSheet.create({
  icon:     { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  certRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12 },
  certIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
