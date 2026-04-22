// MoneyScreen.js — Premium redesign matching reference images exactly
// Features: Investor Wisdom, improved calendar with Present/Absent/Leave,
// rich Income Sources, Attendance Insight, Auto-Adjust toggle

import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, Pressable, Alert, StyleSheet,
  Animated, TextInput, PanResponder, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import {
  fmt, fmtShort, safePct, deriveState,
  debtMonths, sipMaturity, sipCAGR, inflAdj, MONTHS_FULL,
} from './helpers';
import { SPACING as SP, RADIUS as R } from './theme';
import {
  Card, GCard, Chip, Bar, SH, Toggle, Empty,
  StatRow, Input, Btn, FAB, MonthPicker,
} from './UI';
import { DonutChart } from './Charts';

// ─────────────────────────────────────────────────────────
// INVESTOR WISDOM DATA
// ─────────────────────────────────────────────────────────
const INVESTOR_QUOTES = [
  {
    name: 'Warren Buffett',
    avatar: '👴',
    quote: '"Do not save what is left after spending, but spend what is left after saving."',
    color: '#4F8CFF',
  },
  {
    name: 'Rakesh Jhunjhunwala',
    avatar: '🧔',
    quote: '"I am a firm believer in India\'s growth story. Be patient, be positive."',
    color: '#22C55E',
  },
  {
    name: 'Charlie Munger',
    avatar: '👨‍💼',
    quote: '"The best thing a human being can do is to help another human being know more."',
    color: '#A78BFA',
  },
  {
    name: 'Peter Lynch',
    avatar: '🧑‍💼',
    quote: '"Know what you own, and know why you own it."',
    color: '#F59E0B',
  },
  {
    name: 'Benjamin Graham',
    avatar: '🎓',
    quote: '"The investor\'s chief problem, and even his worst enemy, is likely to be himself."',
    color: '#14B8A6',
  },
  {
    name: 'Radhakishan Damani',
    avatar: '🏦',
    quote: '"Buy businesses with strong moats, not just stocks. Think long term always."',
    color: '#4F8CFF',
  },
  {
    name: 'Vijay Kedia',
    avatar: '📊',
    quote: '"Invest in businesses where you understand the product and see strong growth potential."',
    color: '#EF4444',
  },
  {
    name: 'Raamdeo Agrawal',
    avatar: '📈',
    quote: '"Great businesses at fair prices beat fair businesses at great prices over the long run."',
    color: '#22C55E',
  },
  {
    name: 'Harshad Mehta',
    avatar: '💡',
    quote: '"Risk comes from not knowing what you are doing. Learn before you leap."',
    color: '#F59E0B',
  },
];

// Date-based rotation so same quote shows all day
function getDailyQuote(offset = 0) {
  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / 86400000) + offset;
  return INVESTOR_QUOTES[Math.abs(dayIndex) % INVESTOR_QUOTES.length];
}

// ─────────────────────────────────────────────────────────
// INVESTOR WISDOM CARD
// ─────────────────────────────────────────────────────────
const InvestorWisdomCard = memo(() => {
  const { T } = useTheme();
  const [offset, setOffset] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const quote = useMemo(() => getDailyQuote(offset), [offset]);

  const refreshQuote = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setOffset(o => o + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, []);

  return (
    <View style={[sty.wisdomCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      {/* Header row */}
      <View style={sty.wisdomHeader}>
        {/* Big quote mark */}
        <Text style={[sty.wisdomBigQuote, { color: quote.color + '30' }]}>"</Text>

        {/* Left: avatar + meta */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={[sty.wisdomAvatar, { backgroundColor: quote.color + '18', borderColor: quote.color + '40' }]}>
            <Text style={{ fontSize: 26 }}>{quote.avatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={[sty.wisdomLabel, { color: quote.color }]}>INVESTOR WISDOM</Text>
              <Text style={{ fontSize: 11, color: quote.color }}>✦</Text>
            </View>
            <Text style={[sty.wisdomName, { color: T.t1 }]}>{quote.name}</Text>
          </View>
        </View>

        {/* Refresh */}
        <Pressable onPress={refreshQuote} style={[sty.wisdomRefresh, { borderColor: T.border }]}>
          <Text style={{ fontSize: 12 }}>↺</Text>
          <Text style={[sty.wisdomRefreshText, { color: T.t2 }]}>New Quote</Text>
        </Pressable>
      </View>

      {/* Quote text */}
      <Animated.Text style={[sty.wisdomQuote, { color: T.t2, opacity: fadeAnim }]}>
        {quote.quote}
      </Animated.Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// CATEGORY ICON MAP
// ─────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  Freelance: '💼',
  Rental: '🏠',
  Business: '📈',
  'Passive Income': '💰',
  Other: '💵',
};

const CATEGORIES = ['Freelance', 'Rental', 'Business', 'Passive Income', 'Other'];
const FREQUENCIES = ['Monthly', 'Weekly', 'One-time'];

// ─────────────────────────────────────────────────────────
// INCOME SOURCE CARD
// ─────────────────────────────────────────────────────────
const IncomeCard = memo(({ inc, idx, dispatch, T }) => {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState(String(inc?.amount || ''));
  const [notes, setNotes] = useState(inc?.notes || '');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [amtErr, setAmtErr] = useState(null);

  const expandAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      speed: 22,
      bounciness: 2,
    }).start();
  }, [expanded]);

  const category = inc?.category || 'Freelance';
  const frequency = inc?.frequency || 'Monthly';
  const isActive = inc?.isActive !== false;
  const icon = CATEGORY_ICONS[category] || '💵';

  const monthlyEquiv = useMemo(() => {
    const amt = Number(inc?.amount) || 0;
    if (frequency === 'Weekly') return amt * 4.33;
    if (frequency === 'One-time') return amt / 12;
    return amt;
  }, [inc?.amount, frequency]);

  const saveIncome = useCallback(() => {
    const n = Number(amount);
    if (isNaN(n) || n < 0) { setAmtErr('Enter a valid amount'); return; }
    setAmtErr(null);
    dispatch({ type: 'UPD_INCOME', idx, patch: { amount: n, notes } });
    setExpanded(false);
  }, [amount, notes, idx, dispatch]);

  const deleteIncome = useCallback(() => {
    Alert.alert(
      'Remove income?',
      `Remove "${inc?.label || 'this income source'}"?`,
      [
        { text: 'Cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DEL_INCOME', idx }) },
      ]
    );
  }, [inc?.label, idx, dispatch]);

  return (
    <Pressable
      onPress={() => setExpanded(e => !e)}
      style={[
        sty.incomeCard,
        { backgroundColor: T.l1, borderColor: isActive ? T.borderHi : T.border, opacity: isActive ? 1 : 0.6 },
      ]}
    >
      {/* Top row */}
      <View style={sty.incomeTop}>
        {/* Icon */}
        <View style={[sty.incomeIconBox, { backgroundColor: isActive ? '#4F8CFF18' : T.l2 }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>

        {/* Title + meta */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={[sty.incomeTitle, { color: T.t1 }]}>{inc?.label || 'Income'}</Text>
            {isActive && (
              <View style={sty.activeChip}>
                <Text style={sty.activeChipText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={[sty.incomeMeta, { color: T.t3 }]}>
            {frequency} • {category}
          </Text>
          {notes ? (
            <Text style={[sty.incomeNotes, { color: T.t3 }]} numberOfLines={1}>{notes}</Text>
          ) : null}
        </View>

        {/* Amount + toggle */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={[sty.incomeAmount, { color: T.t1 }]}>
            {fmt(inc?.amount || 0)}
            <Text style={[sty.incomePer, { color: T.t3 }]}> /month</Text>
          </Text>
          {isActive && (
            <Text style={sty.incomeAdded}>+{fmt(inc?.amount || 0)} added</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={e => { e.stopPropagation?.(); }} style={{ zIndex: 10 }}>
              <Toggle
                value={isActive}
                onChange={() => dispatch({ type: 'UPD_INCOME', idx, patch: { isActive: !isActive } })}
              />
            </Pressable>
            <Text style={{ fontSize: 14, color: T.t3 }}>⋮</Text>
          </View>
        </View>
      </View>

      {/* Expanded form */}
      {expanded && (
        <Animated.View style={{ overflow: 'hidden', marginTop: 12 }}>
          {/* Amount input */}
          <Text style={[sty.fieldLabel, { color: T.t3 }]}>Monthly Income (₹)</Text>
          <View style={[sty.textInputBox, { backgroundColor: T.l2, borderColor: amtErr ? '#EF4444' : T.border }]}>
            <Text style={{ fontSize: 16, color: T.t3, marginRight: 4 }}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={v => { setAmount(v); if (amtErr) setAmtErr(null); }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={T.t3}
              style={{ flex: 1, fontSize: 18, fontWeight: '700', color: T.t1 }}
            />
          </View>
          {amtErr && <Text style={sty.errText}>{amtErr}</Text>}

          {/* Title input */}
          <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 10 }]}>Title</Text>
          <View style={[sty.textInputBox, { backgroundColor: T.l2, borderColor: T.border }]}>
            <TextInput
              value={inc?.label || ''}
              onChangeText={v => dispatch({ type: 'UPD_INCOME', idx, patch: { label: v } })}
              placeholder="Income name"
              placeholderTextColor={T.t3}
              style={{ flex: 1, fontSize: 15, color: T.t1 }}
            />
          </View>

          {/* Frequency + Category row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[sty.fieldLabel, { color: T.t3 }]}>Frequency</Text>
              <Pressable
                onPress={() => setShowFreqPicker(true)}
                style={[sty.picker, { backgroundColor: T.l2, borderColor: T.border }]}
              >
                <Text style={{ color: T.t1, fontSize: 13 }}>{frequency}</Text>
                <Text style={{ color: T.t3 }}>▾</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sty.fieldLabel, { color: T.t3 }]}>Category</Text>
              <Pressable
                onPress={() => setShowCatPicker(true)}
                style={[sty.picker, { backgroundColor: T.l2, borderColor: T.border }]}
              >
                <Text style={{ color: T.t1, fontSize: 13 }}>{category}</Text>
                <Text style={{ color: T.t3 }}>▾</Text>
              </Pressable>
            </View>
          </View>

          {/* Notes */}
          <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 10 }]}>Notes (optional)</Text>
          <View style={[sty.textInputBox, { backgroundColor: T.l2, borderColor: T.border }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. UI/UX projects and consulting"
              placeholderTextColor={T.t3}
              style={{ flex: 1, fontSize: 13, color: T.t1 }}
              multiline
            />
          </View>

          {/* Monthly equivalent info */}
          <View style={[sty.insightRow, { backgroundColor: '#4F8CFF0E', borderColor: '#4F8CFF25' }]}>
            <Text style={{ fontSize: 13 }}>📊</Text>
            <Text style={{ fontSize: 12, color: '#4F8CFF', flex: 1 }}>
              This adds <Text style={{ fontWeight: '700' }}>+{fmt(Math.round(monthlyEquiv))}/month</Text> to your total income
            </Text>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable onPress={deleteIncome} style={[sty.deleteBtn, { borderColor: '#EF444440' }]}>
              <Text style={{ fontSize: 14 }}>🗑</Text>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
            <Pressable onPress={saveIncome} style={sty.saveBtn}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Mini picker modals */}
      <PickerModal
        visible={showFreqPicker}
        options={FREQUENCIES}
        selected={frequency}
        onSelect={v => { dispatch({ type: 'UPD_INCOME', idx, patch: { frequency: v } }); setShowFreqPicker(false); }}
        onClose={() => setShowFreqPicker(false)}
        T={T}
      />
      <PickerModal
        visible={showCatPicker}
        options={CATEGORIES}
        selected={category}
        onSelect={v => { dispatch({ type: 'UPD_INCOME', idx, patch: { category: v } }); setShowCatPicker(false); }}
        onClose={() => setShowCatPicker(false)}
        T={T}
      />
    </Pressable>
  );
});

// Simple bottom sheet picker modal
function PickerModal({ visible, options, selected, onSelect, onClose, T }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sty.modalOverlay} onPress={onClose}>
        <View style={[sty.modalSheet, { backgroundColor: T.l1 }]}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              style={[sty.modalOption, { borderBottomColor: T.border }]}
            >
              <Text style={{ fontSize: 15, color: opt === selected ? '#4F8CFF' : T.t1, fontWeight: opt === selected ? '700' : '400' }}>
                {CATEGORY_ICONS[opt] ? `${CATEGORY_ICONS[opt]}  ` : ''}{opt}
              </Text>
              {opt === selected && <Text style={{ color: '#4F8CFF', fontSize: 16 }}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// DATE ACTION MODAL — Present / Absent / Leave
// ─────────────────────────────────────────────────────────
function DateActionModal({ visible, day, month, year, currentStatus, onSelect, onClose, T }) {
  const date = day
    ? `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][new Date(year, month, day).getDay() === 0 ? 6 : new Date(year, month, day).getDay() - 1]} ${day} ${MONTHS_FULL[month]}`
    : '';

  const actions = [
    { key: 'present', label: 'Mark Present', icon: '✅', color: '#22C55E' },
    { key: 'absent',  label: 'Mark Absent',  icon: '❌', color: '#EF4444' },
    { key: 'leave',   label: 'Mark Leave',   icon: '🟡', color: '#F59E0B' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={sty.modalOverlay} onPress={onClose}>
        <View style={[sty.dateModal, { backgroundColor: T.l1 }]}>
          <Text style={[sty.dateModalTitle, { color: T.t1 }]}>{date}</Text>
          <Text style={[sty.dateModalSub, { color: T.t3 }]}>Select attendance status</Text>
          {actions.map(a => (
            <Pressable
              key={a.key}
              onPress={() => onSelect(a.key)}
              style={[
                sty.dateAction,
                {
                  backgroundColor: a.color + '12',
                  borderColor: a.color + (currentStatus === a.key ? '60' : '25'),
                  borderWidth: currentStatus === a.key ? 2 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{a.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: a.color, flex: 1 }}>{a.label}</Text>
              {currentStatus === a.key && <Text style={{ color: a.color, fontWeight: '700' }}>✓</Text>}
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={[sty.dateCancel, { borderColor: T.border }]}>
            <Text style={{ color: T.t2, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// SALARY TAB
// ─────────────────────────────────────────────────────────
const SalaryTab = memo(({ s, dispatch, set }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);

  // Calendar swipe gesture
  const panRef = useRef(null);
  const [dateModal, setDateModal] = useState({ visible: false, day: null });
  const [salErr, setSalErr] = useState(null);

  // Attendance maps: present = Set of days, absent/leave stored in separate maps
  const att     = useMemo(() => s.attendance instanceof Set ? s.attendance : new Set(), [s.attendance]);
  const absentSet = useMemo(() => new Set(Object.keys(s.absentDays || {}).map(Number)), [s.absentDays]);
  const leaveSet  = useMemo(() => new Set(Object.keys(s.leaveDays  || {}).map(Number)), [s.leaveDays]);

  const yr  = s.currentYear  || new Date().getFullYear();
  const mo  = s.currentMonth || 0;
  const now = new Date();

  const daysInMonth  = new Date(yr, mo + 1, 0).getDate();
  const firstDow     = new Date(yr, mo, 1).getDay();
  const startOffset  = firstDow === 0 ? 6 : firstDow - 1;

  // Derived stats
  const totalWorking = useMemo(() => {
    let c = 0;
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const dow = new Date(yr, mo, dd).getDay();
      if (dow !== 0) c++; // Sun off, Sat working
    }
    return c;
  }, [yr, mo, daysInMonth]);

  const presentCount = att.size;
  const absentCount  = absentSet.size;
  const holidays     = (s.holidays || []).filter(h =>
    h.startsWith(`${yr}-${String(mo + 1).padStart(2, '0')}`)
  ).length;

  const missedDays   = Math.max(0, totalWorking - presentCount - absentCount);
  const moneyLost    = missedDays * (d.perDay || 0) + absentCount * (d.perDay || 0);
  const potentialExt = totalWorking * (d.perDay || 0);

  // Swipe to change month
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) {
          // swipe left → next month
          const nm = mo === 11 ? 0 : mo + 1;
          const ny = mo === 11 ? yr + 1 : yr;
          dispatch({ type: 'SET_MONTH', month: nm, year: ny });
        } else if (g.dx > 40) {
          // swipe right → prev month
          const nm = mo === 0 ? 11 : mo - 1;
          const ny = mo === 0 ? yr - 1 : yr;
          dispatch({ type: 'SET_MONTH', month: nm, year: ny });
        }
      },
    })
  ).current;

  const getDayStatus = useCallback((day) => {
    if (att.has(day)) return 'present';
    if (absentSet.has(day)) return 'absent';
    if (leaveSet.has(day)) return 'leave';
    return null;
  }, [att, absentSet, leaveSet]);

  const applyStatus = useCallback((day, status) => {
    // Clear from all first
    const newAtt = new Set(att);
    const newAbsent = { ...(s.absentDays || {}) };
    const newLeave  = { ...(s.leaveDays  || {}) };
    newAtt.delete(day);
    delete newAbsent[day];
    delete newLeave[day];

    if (status === 'present') newAtt.add(day);
    else if (status === 'absent') newAbsent[day] = true;
    else if (status === 'leave') newLeave[day] = true;

    dispatch({ type: 'SET_ATT_FULL', attendance: newAtt, absentDays: newAbsent, leaveDays: newLeave });
    setDateModal({ visible: false, day: null });
  }, [att, s.absentDays, s.leaveDays, dispatch]);

  const markTodayPresent = useCallback(() => {
    if (now.getMonth() === mo && now.getFullYear() === yr) {
      const today = now.getDate();
      applyStatus(today, 'present');
    }
  }, [now, mo, yr, applyStatus]);

  // Build calendar cells
  const cells = useMemo(() => {
    const result = [];
    for (let e = 0; e < startOffset; e++) {
      result.push({ type: 'empty', key: `e${e}` });
    }
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const dow      = new Date(yr, mo, dd).getDay(); // 0=Sun, 6=Sat
      const isSun    = dow === 0;
      const isSat    = dow === 6;
      const dateStr  = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
      const isHol    = (s.holidays || []).includes(dateStr);
      const isToday  = dd === now.getDate() && mo === now.getMonth() && yr === now.getFullYear();
      const status   = getDayStatus(dd);
      result.push({ type: 'day', key: `d${dd}`, day: dd, isSun, isSat, isHol, isToday, status });
    }
    const total = startOffset + daysInMonth;
    const rem = total % 7;
    if (rem !== 0) {
      for (let e = 0; e < 7 - rem; e++) result.push({ type: 'empty', key: `f${e}`, isNext: true });
    }
    return result;
  }, [yr, mo, daysInMonth, startOffset, s.holidays, getDayStatus, now]);

  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cells]);

  const isCurMonth = mo === now.getMonth() && yr === now.getFullYear();

  return (
    <View>
      {/* ── YOUR SALARY CARD ── */}
      <View style={[sty.salaryCard, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[sty.cardTitle, { color: T.t1 }]}>Your Salary</Text>

        {/* Two input boxes */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {/* Monthly in-hand */}
          <View style={[sty.salaryInputBox, { backgroundColor: T.bg, borderColor: T.border, flex: 1 }]}>
            <Text style={[sty.salaryInputLabel, { color: T.t3 }]}>MONTHLY IN-HAND (₹)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[sty.salaryRupee, { color: T.t2 }]}>₹</Text>
              <TextInput
                value={String(s.salary || '')}
                onChangeText={v => {
                  const n = Number(v);
                  if (!isNaN(n) && n >= 0) dispatch({ type: 'SET_SALARY', salary: n });
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={T.t3}
                style={[sty.salaryInput, { color: T.t1 }]}
              />
            </View>
          </View>

          {/* Working days */}
          <View style={[sty.salaryInputBox, { backgroundColor: T.bg, borderColor: T.border, flex: 1 }]}>
            <Text style={[sty.salaryInputLabel, { color: T.t3 }]}>WORKING DAYS / MONTH</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[sty.salaryDaysVal, { color: T.t1 }]}>{s.workingDays || 26}</Text>
              <Text style={[sty.salaryDaysSub, { color: T.t3 }]}> (Sat working, Sun off)</Text>
            </View>
          </View>
        </View>

        {/* Per day / Earned / Lost */}
        {s.salary > 0 && (
          <View style={[sty.statsRow, { borderColor: T.border }]}>
            {[
              { l: 'Per Day', v: fmt(d.perDay),        c: '#4F8CFF' },
              { l: 'Earned',  v: fmt(d.earnedSalary),  c: '#22C55E' },
              { l: 'Lost',    v: fmt(d.lostSalary),    c: '#EF4444' },
            ].map((x, i) => (
              <View key={i} style={[sty.statCell, i < 2 && { borderRightWidth: 1, borderRightColor: T.border }]}>
                <Text style={[sty.statVal, { color: x.c }]}>{x.v}</Text>
                <Text style={[sty.statLabel, { color: T.t3 }]}>{x.l}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Insight tip */}
        {d.perDay > 0 && (
          <View style={[sty.tipRow, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 14 }}>💡</Text>
            <Text style={[sty.tipText, { color: T.t2 }]}>
              Miss 1 working day = − {fmt(d.perDay)}
            </Text>
          </View>
        )}
      </View>

      {/* ── OTHER INCOME SOURCES ── */}
      <View style={[sty.incomeSection, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={sty.incomeSectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 24 }}>💼</Text>
            <View>
              <Text style={[sty.cardTitle, { color: T.t1 }]}>Other Income Sources</Text>
              {(s.incomes || []).slice(1).length === 0 && (
                <Text style={[sty.incomeEmpty, { color: T.t3 }]}>No other income sources added</Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={() => dispatch({
              type: 'ADD_INCOME',
              income: {
                label: 'Freelance', amount: 0, frequency: 'Monthly',
                category: 'Freelance', notes: '', isActive: true, recurring: true,
              },
            })}
            style={sty.addIncomeBtn}
          >
            <Text style={sty.addIncomeText}>+ Add</Text>
          </Pressable>
        </View>

        {/* Income cards */}
        {(s.incomes || []).slice(1).map((inc, i) => (
          <IncomeCard key={inc?.id || i} inc={inc} idx={i + 1} dispatch={dispatch} T={T} />
        ))}

        {/* Add another button (when at least one exists) */}
        {(s.incomes || []).slice(1).length > 0 && (
          <Pressable
            onPress={() => dispatch({
              type: 'ADD_INCOME',
              income: {
                label: 'New Income', amount: 0, frequency: 'Monthly',
                category: 'Other', notes: '', isActive: true, recurring: true,
              },
            })}
            style={[sty.addAnotherBtn, { borderColor: T.border }]}
          >
            <Text style={{ fontSize: 16, color: '#4F8CFF' }}>+</Text>
            <Text style={{ color: '#4F8CFF', fontWeight: '600', fontSize: 13 }}>Add Another Income Source</Text>
          </Pressable>
        )}

        {/* Total additional income footer */}
        {(s.incomes || []).slice(1).filter(i => i.isActive !== false).length > 0 && (() => {
          const totalAdd = (s.incomes || []).slice(1)
            .filter(i => i?.isActive !== false)
            .reduce((a, i) => a + (Number(i?.amount) || 0), 0);
          return (
            <View style={[sty.incomeTotalRow, { borderTopColor: T.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={sty.incomeTotalIcon}>
                  <Text style={{ fontSize: 20 }}>🥧</Text>
                </View>
                <View>
                  <Text style={[sty.incomeTotalLabel, { color: T.t3 }]}>Total Additional Income</Text>
                  <Text style={[sty.incomeTotalVal, { color: T.t1 }]}>{fmt(totalAdd)} <Text style={[sty.incomePer, { color: T.t3 }]}>/month</Text></Text>
                </View>
              </View>
              <View style={[sty.incomeTotalRight, { backgroundColor: '#22C55E12', borderColor: '#22C55E30' }]}>
                <Text style={{ fontSize: 14 }}>📈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={sty.incomeTotalRightText}>
                    This adds <Text style={{ fontWeight: '800', color: '#22C55E' }}>+{fmt(totalAdd)}/month</Text>
                  </Text>
                  <Text style={[sty.incomeTotalRightSub, { color: T.t3 }]}>to your total income</Text>
                </View>
                <Text style={{ color: T.t3, fontSize: 16 }}>›</Text>
              </View>
            </View>
          );
        })()}
      </View>

      {/* ── ATTENDANCE CALENDAR ── */}
      <View
        style={[sty.calendarCard, { backgroundColor: T.l1, borderColor: T.border }]}
        {...panResponder.panHandlers}
      >
        {/* Calendar header */}
        <View style={sty.calHeader}>
          <View>
            <Text style={[sty.calTitle, { color: T.t1 }]}>{MONTHS_FULL[mo]} {yr}</Text>
            {/* Legend */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
              {[
                { c: '#22C55E', l: 'Present' },
                { c: '#EF4444', l: 'Absent' },
                { c: '#F59E0B', l: 'Holiday' },
                { c: '#4F8CFF', l: 'Today' },
              ].map((x, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: x.c }} />
                  <Text style={{ fontSize: 9, color: T.t3 }}>{x.l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats + arrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[sty.calStats, { backgroundColor: T.l2, borderColor: T.border }]}>
              <View style={sty.calStatItem}>
                <Text style={[sty.calStatVal, { color: '#22C55E' }]}>{presentCount}</Text>
                <Text style={[sty.calStatLabel, { color: T.t3 }]}>Present</Text>
              </View>
              <View style={[sty.calStatDivider, { backgroundColor: T.border }]} />
              <View style={sty.calStatItem}>
                <Text style={[sty.calStatVal, { color: '#EF4444' }]}>{absentCount}</Text>
                <Text style={[sty.calStatLabel, { color: T.t3 }]}>Absent</Text>
              </View>
              <View style={[sty.calStatDivider, { backgroundColor: T.border }]} />
              <View style={sty.calStatItem}>
                <Text style={[sty.calStatVal, { color: '#F59E0B' }]}>{holidays}</Text>
                <Text style={[sty.calStatLabel, { color: T.t3 }]}>Holidays</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                const nm = mo === 11 ? 0 : mo + 1;
                const ny = mo === 11 ? yr + 1 : yr;
                dispatch({ type: 'SET_MONTH', month: nm, year: ny });
              }}
              style={[sty.calArrow, { backgroundColor: T.l2, borderColor: T.border }]}
            >
              <Text style={{ color: T.t2, fontSize: 16 }}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Day headers */}
        <View style={sty.dayHeaders}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
            <Text
              key={i}
              style={[
                sty.dayHeader,
                { color: i === 6 ? '#EF4444' : i === 5 ? '#F59E0B' : T.t3 },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, wi) => (
          <View key={wi} style={sty.weekRow}>
            {week.map(cell => {
              if (cell.type === 'empty') {
                // Show prev/next month ghost dates
                return (
                  <View key={cell.key} style={sty.dayCell}>
                    <Text style={{ fontSize: 12, color: T.t3 + '40' }}>
                      {cell.isNext
                        ? wi === weeks.length - 1 ? week.indexOf(cell) + 1 : ''
                        : ''}
                    </Text>
                  </View>
                );
              }

              const { day, isSun, isSat, isHol, isToday, status } = cell;

              // Color logic matching reference image
              let bg, border, dotColor, textColor, isHighlighted = false;

              if (isToday) {
                bg = '#4F8CFF';
                border = '#4F8CFF';
                textColor = '#fff';
                isHighlighted = true;
              } else if (status === 'present') {
                bg = 'transparent';
                border = 'transparent';
                textColor = T.t1;
                dotColor = '#22C55E';
              } else if (status === 'absent') {
                bg = 'transparent';
                border = 'transparent';
                textColor = '#EF4444';
                dotColor = '#EF4444';
              } else if (status === 'leave') {
                bg = 'transparent';
                border = 'transparent';
                textColor = '#F59E0B';
                dotColor = '#F59E0B';
              } else if (isHol) {
                bg = 'transparent';
                border = 'transparent';
                textColor = '#F59E0B';
                dotColor = '#F59E0B';
              } else if (isSun) {
                textColor = '#EF4444';
              } else if (isSat) {
                textColor = '#F59E0B';
              } else {
                textColor = T.t1;
                dotColor = '#22C55E'; // default present indicator
              }

              const canTap = !isHol && true; // all days tappable

              return (
                <Pressable
                  key={cell.key}
                  onPress={() => canTap && setDateModal({ visible: true, day })}
                  style={[
                    sty.dayCell,
                    isHighlighted && { backgroundColor: bg, borderRadius: 10, borderWidth: 1, borderColor: border },
                  ]}
                >
                  <Text style={[sty.dayText, { color: textColor, fontWeight: isToday ? '800' : '400' }]}>
                    {day}
                  </Text>
                  {/* Dot indicator */}
                  {dotColor && !isHighlighted && (
                    <View style={[sty.dayDot, { backgroundColor: dotColor }]} />
                  )}
                  {isToday && (
                    <View style={[sty.dayDot, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Mark today button */}
        {isCurMonth && (
          <Pressable onPress={markTodayPresent} style={sty.markTodayBtn}>
            <LinearGradient
              colors={['#2355c5', '#4F8CFF']}
              style={sty.markTodayGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={{ fontSize: 16 }}>✓</Text>
              <Text style={sty.markTodayText}>Mark Today as Present</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* ── ATTENDANCE INSIGHT ── */}
      <View style={[sty.insightCard, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
          <View style={[sty.insightIconBox, { backgroundColor: '#22C55E12' }]}>
            <Text style={{ fontSize: 22 }}>📈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sty.insightTitle, { color: '#22C55E' }]}>
              Attendance Insight 📊
            </Text>
            <Text style={[sty.insightBody, { color: T.t2 }]}>
              You missed {Math.max(0, absentCount + missedDays)} working days this month
              {absentCount + missedDays === 0 ? ' 🎉' : ''}
            </Text>
            <Text style={[sty.insightSub, { color: T.t3 }]}>
              {absentCount + missedDays === 0
                ? 'Great going! Keep it up.'
                : `Improve attendance to earn more.`}
            </Text>
          </View>
        </View>

        {/* Right: potential earning */}
        <View style={[sty.insightRight, { borderLeftColor: T.border }]}>
          <Text style={[sty.insightRightLabel, { color: T.t3 }]}>Potential Extra Earning</Text>
          <Text style={[sty.insightRightVal, { color: '#22C55E' }]}>{fmt(potentialExt)}</Text>
          <Text style={[sty.insightRightSub, { color: T.t3 }]}>If you attend all days</Text>
          <Text style={{ color: T.t3, fontSize: 16, marginTop: 4 }}>›</Text>
        </View>
      </View>

      {/* Date action modal */}
      <DateActionModal
        visible={dateModal.visible}
        day={dateModal.day}
        month={mo}
        year={yr}
        currentStatus={dateModal.day ? getDayStatus(dateModal.day) : null}
        onSelect={status => dateModal.day && applyStatus(dateModal.day, status)}
        onClose={() => setDateModal({ visible: false, day: null })}
        T={T}
      />
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// EXPENSES TAB — unchanged but polished
// ─────────────────────────────────────────────────────────
const ExpensesTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  const total  = d.manualTotal;
  const budget = d.needsBudget;
  const isOver = total > budget && budget > 0;

  return (
    <View>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <DonutChart
            segments={(s.expenses || []).map(e => ({ pct: e.pct, color: e.color }))}
            size={96} sw={12}
            centerLabel={s.salary > 0 ? fmtShort(s.salary) : '—'}
          />
          <View style={{ flex: 1 }}>
            {(s.expenses || []).map((e, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: e.color }} />
                  <Text style={{ fontSize: 13, color: T.t2 }}>{e.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: e.color }}>
                    {s.salary > 0 ? fmt(s.salary * e.pct / 100) : `${e.pct}%`}
                  </Text>
                  <Text style={{ fontSize: 10, color: T.t3 }}>{e.pct}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card>
      {(s.expenses || []).map((e, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>{e.label}</Text>
              <Text style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>
                {s.salary > 0 ? fmt(s.salary * e.pct / 100) + '/month' : `${e.pct}% of salary`}
              </Text>
            </View>
            <View style={{ backgroundColor: e.color + '20', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: e.color }}>{e.pct}%</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => dispatch({ type: 'UPD_EXP_PCT', idx: i, pct: Math.max(0, e.pct - 1) })}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.l2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border }}>
              <Text style={{ fontSize: 20, color: T.t1 }}>−</Text>
            </Pressable>
            <View style={{ flex: 1 }}><Bar value={e.pct} total={100} color={e.color} h={6} /></View>
            <Pressable onPress={() => dispatch({ type: 'UPD_EXP_PCT', idx: i, pct: Math.min(100, e.pct + 1) })}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.l2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border }}>
              <Text style={{ fontSize: 20, color: T.t1 }}>+</Text>
            </Pressable>
          </View>
        </Card>
      ))}
      {budget > 0 && (
        <View style={{ backgroundColor: isOver ? '#EF444412' : '#22C55E10', borderRadius: R.md, padding: SP.sm + 4, marginBottom: 11, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: isOver ? '#EF444430' : '#22C55E30' }}>
          <Text style={{ fontSize: 13, color: T.t2 }}>Spent vs budget</Text>
          <Text style={{ fontWeight: '700', fontSize: 13, color: isOver ? '#EF4444' : '#22C55E' }}>{fmt(total)} / {fmt(budget)}</Text>
        </View>
      )}
      {(s.manualExpenses || []).map((ex, i) => (
        <View key={ex?.id || i} style={{ backgroundColor: T.l2, borderRadius: R.md + 2, padding: SP.sm + 3, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ fontSize: 20 }}>{ex?.icon || '💳'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 13, color: T.t1 }}>{ex?.cat || 'Expense'}</Text>
            {ex?.recurring && <Chip label="Auto" color="#14B8A6" sm />}
          </View>
          <Text style={{ fontWeight: '700', fontSize: 14, color: ex?.color || T.t1 }}>{fmt(ex?.amount || 0)}</Text>
          <Toggle value={ex?.recurring || false} onChange={() => dispatch({ type: 'UPD_MEXP', idx: i, patch: { recurring: !ex?.recurring } })} />
          <Pressable onPress={() => Alert.alert('Remove?', 'Remove this expense?', [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DEL_MEXP', idx: i }) }])}>
            <Text style={{ fontSize: 20, color: '#EF4444' }}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// SIP TAB
// ─────────────────────────────────────────────────────────
const SipTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  if ((s.sips || []).length === 0) return (
    <Empty icon="📈" title="No SIPs added"
      sub="Start your wealth journey. ₹500/mo in index funds grows significantly over time."
      cta="Add first SIP"
      onCta={() => dispatch({ type: 'ADD_SIP', sip: { name: 'Nifty 50 Index', amount: 500, returns: 12, months: 12, goalLink: null } })} />
  );
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <GCard colors={['#052e16', '#064e30']} style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Total SIP/mo</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{fmt(d.sipTotal)}</Text>
        </GCard>
        <GCard colors={['#0c1a4e', '#1a3080']} style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Est. 1Y Corpus</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>
            {fmt((s.sips || []).reduce((a, x) => a + sipMaturity(x.amount || 0, 12, x.returns || 12), 0))}
          </Text>
        </GCard>
      </View>
      {(s.sips || []).map((si, i) => {
        const mat = sipMaturity(si.amount || 0, si.months || 12, si.returns || 12);
        const invest = (si.amount || 0) * (si.months || 12);
        const inflAdjV = inflAdj(mat, Math.round((si.months || 12) / 12));
        const cagr = sipCAGR(invest, mat, (si.months || 12) / 12 || 1);
        return (
          <Card key={si?.id || i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>{si.name || 'SIP'}</Text>
                <View style={{ flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  <Chip label={`${si.returns || 12}% p.a.`} color="#22C55E" sm />
                  {si.goalLink && <Chip label={`→ ${si.goalLink}`} color="#A78BFA" sm />}
                </View>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#22C55E' }}>{fmt(si.amount || 0)}</Text>
            </View>
            <StatRow label="Invested" value={fmt(invest)} />
            <StatRow label="Maturity (XIRR)" value={fmt(mat)} color="#22C55E" />
            <StatRow label="Inflation-adjusted" value={fmt(inflAdjV)} color="#F59E0B" />
            <StatRow label="CAGR" value={`${cagr}%`} color="#4F8CFF" last />
            <Bar value={invest} total={Math.max(mat, 1)} color="#22C55E" h={5} />
            <Pressable onPress={() => Alert.alert('Remove SIP?', `Remove ${si.name}?`, [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DEL_SIP', idx: i }) }])} style={{ marginTop: 10 }}>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Remove SIP</Text>
            </Pressable>
          </Card>
        );
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// DEBT TAB
// ─────────────────────────────────────────────────────────
const DebtTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  if ((s.debts || []).length === 0) return (
    <Empty icon="🏦" title="No debts tracked"
      sub="Add your loans or credit cards to plan smart repayment."
      cta="+ Add Debt"
      onCta={() => dispatch({ type: 'ADD_DEBT', debt: { name: 'New Loan', amount: 0, remaining: 0, emi: 0, rate: 0, dueDate: 5 } })} />
  );
  const highRate = (s.debts || []).reduce((a, x) => Number(x?.rate || 0) > Number(a?.rate || 0) ? x : a, s.debts[0]);
  const smallest = (s.debts || []).reduce((a, x) => Number(x?.remaining || 0) < Number(a?.remaining || 0) ? x : a, s.debts[0]);
  return (
    <View>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 12, color: T.t3, marginBottom: 3 }}>Total Outstanding</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#EF4444' }}>{fmt(d.debtTotal)}</Text>
          </View>
          <Chip label="Active" color="#EF4444" dot />
        </View>
        {highRate && smallest && (
          <View style={{ flexDirection: 'row', gap: 9, marginBottom: 12 }}>
            {[
              { label: '🔥 Avalanche', sub: 'Max interest', name: highRate.name || '', color: '#F59E0B' },
              { label: '❄️ Snowball', sub: 'Quick win', name: smallest.name || '', color: '#4F8CFF' },
            ].map(m => (
              <View key={m.label} style={{ flex: 1, backgroundColor: T.l2, borderRadius: R.md, padding: SP.sm + 4, borderWidth: 1, borderColor: m.color + '25' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: m.color, marginBottom: 3 }}>{m.label}</Text>
                <Text style={{ fontWeight: '600', fontSize: 13, color: T.t1 }} numberOfLines={1}>{m.name}</Text>
                <Text style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{m.sub}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
      {(s.debts || []).map((dbt, i) => {
        const paid = (Number(dbt?.amount) || 0) - (Number(dbt?.remaining) || 0);
        const months = debtMonths(dbt?.remaining || 0, dbt?.emi || 1);
        const extraM = debtMonths(dbt?.remaining || 0, (dbt?.emi || 0) + 2000);
        const intLeft = Math.round((Number(dbt?.remaining) || 0) * (Number(dbt?.rate) || 0) / 100 * months / 12);
        return (
          <Card key={dbt?.id || i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1 }}>{dbt?.name || 'Loan'}</Text>
                <View style={{ flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  <Chip label={`${dbt?.rate || 0}% p.a.`} color={Number(dbt?.rate || 0) >= 24 ? '#EF4444' : '#F59E0B'} sm />
                  {dbt?.dueDate && <Chip label={`Due: ${dbt.dueDate}th`} color="#F59E0B" sm />}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#EF4444' }}>{fmt(dbt?.remaining || 0)}</Text>
                <Text style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>remaining</Text>
              </View>
            </View>
            <Bar value={paid} total={Math.max(dbt?.amount || 1, 1)} color="#EF4444" h={5} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7, marginBottom: 12 }}>
              <Text style={{ fontSize: 11, color: T.t3 }}>{safePct(paid, dbt?.amount || 1)}% cleared</Text>
              <Text style={{ fontSize: 11, color: T.t3 }}>{months} months left</Text>
            </View>
            <StatRow label="Monthly EMI" value={fmt(dbt?.emi || 0)} />
            <StatRow label="Amount Paid" value={fmt(paid)} color="#22C55E" />
            <StatRow label="Interest Remaining" value={fmt(intLeft)} color="#EF4444" last />
            {(dbt?.emi || 0) > 0 && (
              <View style={{ backgroundColor: '#22C55E10', borderRadius: R.md, padding: SP.sm + 2, borderWidth: 1, borderColor: '#22C55E28', flexDirection: 'row', gap: 7, marginTop: 8 }}>
                <Text style={{ fontSize: 14 }}>🚀</Text>
                <Text style={{ color: '#22C55E', fontSize: 12, lineHeight: 18, flex: 1 }}>
                  Pay ₹2K extra/mo → clear in <Text style={{ fontWeight: '700' }}>{extraM} months</Text> instead of {months}
                </Text>
              </View>
            )}
            <Pressable onPress={() => Alert.alert('Remove debt?', `Remove ${dbt?.name}?`, [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DEL_DEBT', idx: i }) }])} style={{ marginTop: 10 }}>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Remove debt</Text>
            </Pressable>
          </Card>
        );
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// TAB DEFINITIONS
// ─────────────────────────────────────────────────────────
const TABS = [
  ['salary',   '💰', 'Salary'],
  ['expenses', '💳', 'Expenses'],
  ['sip',      '📈', 'SIP'],
  ['debt',     '🏦', 'Debt'],
];

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────
export default function MoneyScreen() {
  const { state: s, dispatch, set } = useApp();
  const { T } = useTheme();
  const [tab, setTab] = useState('salary');

  // Patch reducer to support SET_ATT_FULL
  const patchedDispatch = useCallback((action) => {
    if (action.type === 'SET_ATT_FULL') {
      // Use set() to update absentDays and leaveDays, dispatch for attendance
      dispatch({ type: 'TOGGLE_ATT', day: -1 }); // no-op to trigger re-render
      set({
        attendance: action.attendance,
        absentDays: action.absentDays,
        leaveDays: action.leaveDays,
      });
      return;
    }
    dispatch(action);
  }, [dispatch, set]);

  const fabActions = {
    sip:  [{ icon: '📈', label: 'Add SIP',  color: '#22C55E', action: () => dispatch({ type: 'ADD_SIP',  sip:  { name: 'New SIP',   amount: 500, returns: 12, months: 12, goalLink: null } }) }],
    debt: [{ icon: '🏦', label: 'Add Debt', color: '#EF4444', action: () => dispatch({ type: 'ADD_DEBT', debt: { name: 'New Loan',  amount: 0,   remaining: 0, emi: 0, rate: 0, dueDate: 5 } }) }],
    expenses: [{ icon: '💳', label: 'Add Expense', color: '#F59E0B', action: () => dispatch({ type: 'ADD_MEXP', exp: { cat: 'Other', amount: 0, icon: '💸', color: '#475569', recurring: false } }) }],
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── HEADER ── */}
        <View style={sty.screenHeader}>
          <View>
            <Text style={[sty.screenTitle, { color: T.t1 }]}>Money</Text>
            <Text style={[sty.screenSub, { color: T.t3 }]}>All finances, one place</Text>
          </View>
          <MonthPicker
            month={s.currentMonth || 0}
            year={s.currentYear || new Date().getFullYear()}
            onChange={(m, y) => dispatch({ type: 'SET_MONTH', month: m, year: y })}
          />
        </View>

        {/* ── INVESTOR WISDOM ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <InvestorWisdomCard />
        </View>

        {/* ── AUTO-ADJUST MODE ── */}
        <View style={[sty.autoAdjust, { backgroundColor: T.l1, borderColor: T.border }]}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>🤖</Text>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[sty.autoLabel, { color: T.t1 }]}>Auto-Adjust Mode</Text>
                <View style={[sty.onBadge, { backgroundColor: s.autoAdjust ? '#22C55E' : '#94A3B8' }]}>
                  <Text style={sty.onBadgeText}>{s.autoAdjust ? 'ON' : 'OFF'}</Text>
                </View>
              </View>
              <Text style={[sty.autoSub, { color: T.t3 }]}>AI-driven rebalancing of your finances</Text>
            </View>
          </View>
          <Toggle value={s.autoAdjust || false} onChange={() => set({ autoAdjust: !s.autoAdjust })} />
        </View>

        {/* ── TABS ── */}
        <View style={[sty.tabBar, { backgroundColor: T.l1, borderColor: T.border }]}>
          {TABS.map(([k, icon, label]) => {
            const on = tab === k;
            return (
              <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1 }}>
                <View style={[
                  sty.tabBtn,
                  on && { backgroundColor: '#4F8CFF', shadowColor: '#4F8CFF', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
                ]}>
                  <Text style={{ fontSize: 14 }}>{icon}</Text>
                  <Text style={[sty.tabLabel, { color: on ? '#fff' : T.t3 }]}>{label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── TAB CONTENT ── */}
        <View style={{ paddingHorizontal: 16 }}>
          {tab === 'salary'   && <SalaryTab   s={s} dispatch={patchedDispatch} set={set} />}
          {tab === 'expenses' && <ExpensesTab s={s} dispatch={dispatch} />}
          {tab === 'sip'      && <SipTab      s={s} dispatch={dispatch} />}
          {tab === 'debt'     && <DebtTab     s={s} dispatch={dispatch} />}
        </View>
      </ScrollView>

      {(fabActions[tab] || []).length > 0 && <FAB actions={fabActions[tab]} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const sty = StyleSheet.create({
  // Screen header
  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14,
  },
  screenTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  screenSub:   { fontSize: 13, marginTop: 2 },

  // Investor Wisdom
  wisdomCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    overflow: 'hidden',
  },
  wisdomHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 0 },
  wisdomBigQuote:    { fontSize: 60, fontWeight: '900', position: 'absolute', right: 12, top: -8, lineHeight: 60 },
  wisdomAvatar:      { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  wisdomLabel:       { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  wisdomName:        { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginTop: 1 },
  wisdomQuote:       { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  wisdomRefresh:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 'auto' },
  wisdomRefreshText: { fontSize: 12, fontWeight: '600' },

  // Auto-adjust
  autoAdjust: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  autoLabel:    { fontSize: 15, fontWeight: '700' },
  autoSub:      { fontSize: 12, marginTop: 2 },
  onBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  onBadgeText:  { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Tab bar
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 14,
    borderRadius: 14, padding: 5, gap: 4, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },

  // Salary card
  salaryCard: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  cardTitle:       { fontSize: 17, fontWeight: '700' },
  salaryInputBox:  { borderRadius: 12, padding: 12, borderWidth: 1 },
  salaryInputLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  salaryRupee:     { fontSize: 22, fontWeight: '300', marginRight: 4 },
  salaryInput:     { fontSize: 28, fontWeight: '800', flex: 1 },
  salaryDaysVal:   { fontSize: 28, fontWeight: '800' },
  salaryDaysSub:   { fontSize: 11, marginLeft: 4 },
  statsRow: {
    flexDirection: 'row', marginTop: 12, borderWidth: 1,
    borderRadius: 12, overflow: 'hidden',
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statVal:  { fontSize: 15, fontWeight: '800' },
  statLabel:{ fontSize: 10, marginTop: 3 },
  tipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1,
  },
  tipText: { fontSize: 13, fontWeight: '500' },

  // Income section
  incomeSection: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  incomeSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  incomeEmpty: { fontSize: 12, marginTop: 3 },
  addIncomeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  addIncomeText:{ fontSize: 14, fontWeight: '700', color: '#4F8CFF' },

  // Income card
  incomeCard: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  incomeTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  incomeIconBox:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  incomeTitle:  { fontSize: 15, fontWeight: '700' },
  incomeMeta:   { fontSize: 12, marginTop: 2 },
  incomeNotes:  { fontSize: 11, marginTop: 1 },
  incomeAmount: { fontSize: 16, fontWeight: '800' },
  incomePer:    { fontSize: 11, fontWeight: '400' },
  incomeAdded:  { fontSize: 11, fontWeight: '600', color: '#22C55E' },
  activeChip: {
    backgroundColor: '#22C55E18', borderRadius: 99,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  activeChipText: { fontSize: 10, fontWeight: '700', color: '#22C55E' },

  // Income form fields
  fieldLabel:  { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, marginBottom: 5 },
  textInputBox:{
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  errText: { fontSize: 11, color: '#EF4444', marginTop: 4 },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1,
  },
  insightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 10, borderWidth: 1, marginTop: 10,
  },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 9,
  },
  saveBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4F8CFF', borderRadius: 10, paddingVertical: 10,
  },

  // Income total
  incomeTotalRow: {
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, gap: 10,
  },
  incomeTotalIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#4F8CFF12', alignItems: 'center', justifyContent: 'center',
  },
  incomeTotalLabel: { fontSize: 11 },
  incomeTotalVal:   { fontSize: 22, fontWeight: '800', marginTop: 2 },
  incomeTotalRight: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 12, borderWidth: 1,
  },
  incomeTotalRightText: { fontSize: 13, color: '#64748b' },
  incomeTotalRightSub:  { fontSize: 11, marginTop: 2 },

  // Add another button
  addAnotherBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 12, marginTop: 4,
  },

  // Calendar
  calendarCard: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  calTitle:  { fontSize: 20, fontWeight: '800' },
  calStats: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12, gap: 12,
  },
  calStatItem:    { alignItems: 'center' },
  calStatVal:     { fontSize: 16, fontWeight: '800' },
  calStatLabel:   { fontSize: 9, marginTop: 1 },
  calStatDivider: { width: 1, height: '100%' },
  calArrow: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },
  dayHeaders: { flexDirection: 'row', marginBottom: 6 },
  dayHeader:  { flex: 1, textAlign: 'center', fontSize: 9, fontWeight: '700' },
  weekRow:    { flexDirection: 'row', marginBottom: 2 },
  dayCell:    { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', margin: 1 },
  dayText:    { fontSize: 12 },
  dayDot:     { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  // Mark today button
  markTodayBtn:  { marginTop: 14, borderRadius: 14, overflow: 'hidden' },
  markTodayGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14,
  },
  markTodayText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Attendance insight
  insightCard: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    marginBottom: 12,
  },
  insightIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightTitle:   { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  insightBody:    { fontSize: 13, lineHeight: 18 },
  insightSub:     { fontSize: 11, marginTop: 2 },
  insightRight: {
    flex: 1, padding: 14, borderLeftWidth: 1,
    justifyContent: 'center', alignItems: 'flex-start',
  },
  insightRightLabel:{ fontSize: 11, marginBottom: 4 },
  insightRightVal:  { fontSize: 22, fontWeight: '800' },
  insightRightSub:  { fontSize: 11, marginTop: 2 },

  // Inner insight card (left side)
  insightCard: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    marginBottom: 12, overflow: 'hidden',
  },

  // Modals
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  dateModal: {
    margin: 20, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  dateModalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  dateModalSub:   { fontSize: 13, marginBottom: 16 },
  dateAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  dateCancel: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 4,
  },
});
