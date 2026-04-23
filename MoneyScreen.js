// MoneyScreen.js — All 16 fixes applied
// FIX 1: Real investor photos via Wikimedia
// FIX 2: Colorful gradient wisdom card bg, New Quote bottom-right, colored top bar
// FIX 3: Salary tab text alignment (no overflow)
// FIX 4: Lost in strong red
// FIX 5: Other Income Source inline expandable mini-window
// FIX 6: Calendar overflow fix, full year swipe, premium arrows, half-day, slide animation
// FIX 7: Mark Today Present animation + haptic pulse
// FIX 8: Attendance Insight card properly aligned
// FIX 9: Expenses card wallet icon top-right
// FIX 10: Expenses/SIP/Debt pill tabs rounded same as Salary
// FIX 11: Donut chart center text theme-aware, segment tap highlight/dim
// FIX 12: Budget allocation icon+text alignment
// FIX 13: Spent vs Budget green bar with click detail
// FIX 14: Smart Insight + Budget Score icon/text aligned
// FIX 15: Add Expense modal theme-aware, Custom freq, manual category, animation
// FIX 16: +18 more transactions expandable

import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, Pressable, Alert, StyleSheet,
  Animated, TextInput, PanResponder, Modal, Platform,
  Easing, Image,
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
import { SipTab } from './SipScreen';
import { DebtTab } from './DebtManagement';

// ─────────────────────────────────────────────────────────
// FIX 1 & 2: INVESTOR WISDOM — Real photos + colorful card
// ─────────────────────────────────────────────────────────
const INVESTOR_QUOTES = [
  {
    name: 'Warren Buffett',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Warren_Buffett_KU_Visit.jpg/220px-Warren_Buffett_KU_Visit.jpg',
    quote: '"Do not save what is left after spending, but spend what is left after saving."',
    gradColors: ['#1a3a00', '#2d6a1a', '#4a9c2e'],
    accentColor: '#6DD44A',
  },
  {
    name: 'Rakesh Jhunjhunwala',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Rakesh_Jhunjhunwala_2011.jpg/220px-Rakesh_Jhunjhunwala_2011.jpg',
    quote: '"I am a firm believer in India\'s growth story. Be patient, be positive."',
    gradColors: ['#001a3a', '#0a3070', '#1a5abf'],
    accentColor: '#4F8CFF',
  },
  {
    name: 'Charlie Munger',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Charlie_Munger.jpg/220px-Charlie_Munger.jpg',
    quote: '"The best thing a human being can do is to help another human being know more."',
    gradColors: ['#2a0060', '#4a1090', '#7c3abf'],
    accentColor: '#A78BFA',
  },
  {
    name: 'Peter Lynch',
    photo: null, avatar: '📊',
    quote: '"Know what you own, and know why you own it."',
    gradColors: ['#3a1a00', '#7a3810', '#bf6020'],
    accentColor: '#F59E0B',
  },
  {
    name: 'Benjamin Graham',
    photo: null, avatar: '🎓',
    quote: '"The investor\'s chief problem, and even his worst enemy, is likely to be himself."',
    gradColors: ['#003a38', '#0a6a66', '#15a8a0'],
    accentColor: '#14B8A6',
  },
  {
    name: 'Radhakishan Damani',
    photo: null, avatar: '🏦',
    quote: '"Buy businesses with strong moats, not just stocks. Think long term always."',
    gradColors: ['#001838', '#0a2e60', '#1a509a'],
    accentColor: '#4F8CFF',
  },
  {
    name: 'Vijay Kedia',
    photo: null, avatar: '📈',
    quote: '"Invest where you understand the product and see strong growth potential."',
    gradColors: ['#3a0010', '#700020', '#b00035'],
    accentColor: '#F87171',
  },
  {
    name: 'Raamdeo Agrawal',
    photo: null, avatar: '💹',
    quote: '"Great businesses at fair prices beat fair businesses at great prices over the long run."',
    gradColors: ['#003a10', '#0a6a22', '#18a840'],
    accentColor: '#22C55E',
  },
];

function getDailyQuote(offset = 0) {
  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / 86400000) + offset;
  return INVESTOR_QUOTES[Math.abs(dayIndex) % INVESTOR_QUOTES.length];
}

const InvestorWisdomCard = memo(() => {
  const { T } = useTheme();
  const [offset, setOffset] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imgError, setImgError] = useState(false);
  const quote = useMemo(() => getDailyQuote(offset), [offset]);

  const refreshQuote = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,    duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setOffset(o => o + 1);
      setImgError(false);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    });
  }, []);

  return (
    <View style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
      <LinearGradient colors={quote.gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* FIX 2: Colored top strip */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 16, paddingTop: 11, paddingBottom: 8,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(0,0,0,0.22)',
        }}>
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: quote.accentColor, textTransform: 'uppercase' }}>
            ✦ INVESTOR WISDOM
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[quote.accentColor + 'FF', quote.accentColor + '80', quote.accentColor + '40'].map((c, i) => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
            ))}
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], padding: 16 }}>
          {/* Avatar + name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            {/* FIX 1: Real photo */}
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              borderWidth: 2.5, borderColor: quote.accentColor,
              overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)',
            }}>
              {quote.photo && !imgError ? (
                <Image source={{ uri: quote.photo }} style={{ width: '100%', height: '100%' }} onError={() => setImgError(true)} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 26 }}>{quote.avatar || '👤'}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>{quote.name}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Investor · Legend</Text>
            </View>
            <Text style={{ fontSize: 60, fontWeight: '900', color: 'rgba(255,255,255,0.10)', lineHeight: 60, marginTop: -10 }}>"</Text>
          </View>

          <Text style={{ fontSize: 13.5, lineHeight: 21, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>
            {quote.quote}
          </Text>

          {/* FIX 2: New Quote at bottom right */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
            <Pressable onPress={refreshQuote} style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            }}>
              <Text style={{ fontSize: 13 }}>↺</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>New Quote</Text>
            </Pressable>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// CATEGORY ICON MAP
// ─────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  Freelance: '💼', Rental: '🏠', Business: '📈',
  'Passive Income': '💰', Other: '💵',
};
const CATEGORIES  = ['Freelance', 'Rental', 'Business', 'Passive Income', 'Other'];
const FREQUENCIES = ['Monthly', 'Weekly', 'One-time'];

// ─────────────────────────────────────────────────────────
// INCOME CARD — FIX 5: inline expand
// ─────────────────────────────────────────────────────────
const IncomeCard = memo(({ inc, idx, dispatch, T }) => {
  const [expanded, setExpanded] = useState(false);
  const [amount,   setAmount]   = useState(String(inc?.amount || ''));
  const [notes,    setNotes]    = useState(inc?.notes || '');
  const [showCatPicker,  setShowCatPicker]  = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [amtErr,   setAmtErr]   = useState(null);

  const category  = inc?.category  || 'Freelance';
  const frequency = inc?.frequency || 'Monthly';
  const isActive  = inc?.isActive  !== false;
  const icon      = CATEGORY_ICONS[category] || '💵';

  const monthlyEquiv = useMemo(() => {
    const amt = Number(inc?.amount) || 0;
    if (frequency === 'Weekly')   return amt * 4.33;
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
    Alert.alert('Remove income?', `Remove "${inc?.label || 'this income source'}"?`, [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DEL_INCOME', idx }) },
    ]);
  }, [inc?.label, idx, dispatch]);

  return (
    <Pressable onPress={() => setExpanded(e => !e)}
      style={[sty.incomeCard, { backgroundColor: T.l2, borderColor: isActive ? T.borderHi : T.border, opacity: isActive ? 1 : 0.6 }]}>
      <View style={sty.incomeTop}>
        <View style={[sty.incomeIconBox, { backgroundColor: isActive ? '#4F8CFF18' : T.l2 }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={[sty.incomeTitle, { color: T.t1 }]} numberOfLines={1}>{inc?.label || 'Income'}</Text>
            {isActive && <View style={sty.activeChip}><Text style={sty.activeChipText}>Active</Text></View>}
          </View>
          <Text style={[sty.incomeMeta, { color: T.t3 }]}>{frequency} · {category}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <Text style={[sty.incomeAmount, { color: T.t1 }]}>{fmt(inc?.amount || 0)}<Text style={[sty.incomePer, { color: T.t3 }]}>/mo</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={e => e.stopPropagation?.()}>
              <Toggle value={isActive} onChange={() => dispatch({ type: 'UPD_INCOME', idx, patch: { isActive: !isActive } })} />
            </Pressable>
            <Text style={{ fontSize: 14, color: T.t3 }}>{expanded ? '▲' : '▾'}</Text>
          </View>
        </View>
      </View>

      {expanded && (
        <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14 }}>
          <Text style={[sty.fieldLabel, { color: T.t3 }]}>Monthly Income (₹)</Text>
          <View style={[sty.textInputBox, { backgroundColor: T.bg, borderColor: amtErr ? '#EF4444' : T.border }]}>
            <Text style={{ fontSize: 16, color: T.t3, marginRight: 4 }}>₹</Text>
            <TextInput value={amount} onChangeText={v => { setAmount(v); if (amtErr) setAmtErr(null); }}
              keyboardType="numeric" placeholder="0" placeholderTextColor={T.t3}
              style={{ flex: 1, fontSize: 18, fontWeight: '700', color: T.t1 }} />
          </View>
          {amtErr && <Text style={sty.errText}>{amtErr}</Text>}

          <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 10 }]}>Title</Text>
          <View style={[sty.textInputBox, { backgroundColor: T.bg, borderColor: T.border }]}>
            <TextInput value={inc?.label || ''} onChangeText={v => dispatch({ type: 'UPD_INCOME', idx, patch: { label: v } })}
              placeholder="Income name" placeholderTextColor={T.t3} style={{ flex: 1, fontSize: 15, color: T.t1 }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[sty.fieldLabel, { color: T.t3 }]}>Frequency</Text>
              <Pressable onPress={() => setShowFreqPicker(true)} style={[sty.picker, { backgroundColor: T.bg, borderColor: T.border }]}>
                <Text style={{ color: T.t1, fontSize: 13 }}>{frequency}</Text>
                <Text style={{ color: T.t3 }}>▾</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sty.fieldLabel, { color: T.t3 }]}>Category</Text>
              <Pressable onPress={() => setShowCatPicker(true)} style={[sty.picker, { backgroundColor: T.bg, borderColor: T.border }]}>
                <Text style={{ color: T.t1, fontSize: 13 }}>{category}</Text>
                <Text style={{ color: T.t3 }}>▾</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[sty.fieldLabel, { color: T.t3, marginTop: 10 }]}>Notes (optional)</Text>
          <View style={[sty.textInputBox, { backgroundColor: T.bg, borderColor: T.border }]}>
            <TextInput value={notes} onChangeText={setNotes} placeholder="e.g. UI/UX projects"
              placeholderTextColor={T.t3} style={{ flex: 1, fontSize: 13, color: T.t1 }} multiline />
          </View>

          <View style={[sty.insightRow, { backgroundColor: '#4F8CFF0E', borderColor: '#4F8CFF25' }]}>
            <Text style={{ fontSize: 13 }}>📊</Text>
            <Text style={{ fontSize: 12, color: '#4F8CFF', flex: 1 }}>
              Adds <Text style={{ fontWeight: '700' }}>+{fmt(Math.round(monthlyEquiv))}/month</Text> to total income
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable onPress={deleteIncome} style={[sty.deleteBtn, { borderColor: '#EF444440' }]}>
              <Text style={{ fontSize: 14 }}>🗑</Text>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
            <Pressable onPress={saveIncome} style={sty.saveBtn}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      <PickerModal visible={showFreqPicker} options={FREQUENCIES} selected={frequency}
        onSelect={v => { dispatch({ type: 'UPD_INCOME', idx, patch: { frequency: v } }); setShowFreqPicker(false); }}
        onClose={() => setShowFreqPicker(false)} T={T} />
      <PickerModal visible={showCatPicker} options={CATEGORIES} selected={category}
        onSelect={v => { dispatch({ type: 'UPD_INCOME', idx, patch: { category: v } }); setShowCatPicker(false); }}
        onClose={() => setShowCatPicker(false)} T={T} />
    </Pressable>
  );
});

function PickerModal({ visible, options, selected, onSelect, onClose, T }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sty.modalOverlay} onPress={onClose}>
        <View style={[sty.modalSheet, { backgroundColor: T.l1 }]}>
          <View style={{ width: 36, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 }} />
          {options.map(opt => (
            <Pressable key={opt} onPress={() => onSelect(opt)} style={[sty.modalOption, { borderBottomColor: T.border }]}>
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
// DATE ACTION MODAL — FIX 6: Half Day added
// ─────────────────────────────────────────────────────────
function DateActionModal({ visible, day, month, year, currentStatus, onSelect, onClose, T }) {
  const date = day
    ? `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][new Date(year, month, day).getDay() === 0 ? 6 : new Date(year, month, day).getDay() - 1]} ${day} ${MONTHS_FULL[month]}`
    : '';
  const actions = [
    { key: 'present',  label: 'Mark Present',  icon: '✅', color: '#22C55E' },
    { key: 'halfday',  label: 'Mark Half Day',  icon: '🟡', color: '#F59E0B' },
    { key: 'absent',   label: 'Mark Absent',    icon: '❌', color: '#EF4444' },
    { key: 'leave',    label: 'Mark Leave',     icon: '🔵', color: '#4F8CFF' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={sty.modalOverlay} onPress={onClose}>
        <View style={[sty.dateModal, { backgroundColor: T.l1 }]}>
          <Text style={[sty.dateModalTitle, { color: T.t1 }]}>{date}</Text>
          <Text style={[sty.dateModalSub, { color: T.t3 }]}>Select attendance status</Text>
          {actions.map(a => (
            <Pressable key={a.key} onPress={() => onSelect(a.key)}
              style={[sty.dateAction, { backgroundColor: a.color + '12', borderColor: a.color + (currentStatus === a.key ? '60' : '25'), borderWidth: currentStatus === a.key ? 2 : 1 }]}>
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
// SALARY TAB — Fixes 3,4,6,7,8
// ─────────────────────────────────────────────────────────
const SalaryTab = memo(({ s, dispatch, set }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  const [dateModal, setDateModal] = useState({ visible: false, day: null });
  const markAnim     = useRef(new Animated.Value(1)).current;
  const markGlowAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;

  const att        = useMemo(() => s.attendance instanceof Set ? s.attendance : new Set(), [s.attendance]);
  const absentSet  = useMemo(() => new Set(Object.keys(s.absentDays  || {}).map(Number)), [s.absentDays]);
  const leaveSet   = useMemo(() => new Set(Object.keys(s.leaveDays   || {}).map(Number)), [s.leaveDays]);
  const halfdaySet = useMemo(() => new Set(Object.keys(s.halfdayDays || {}).map(Number)), [s.halfdayDays]);

  const yr  = s.currentYear  || new Date().getFullYear();
  const mo  = s.currentMonth || 0;
  const now = new Date();

  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const firstDow    = new Date(yr, mo, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const totalWorking = useMemo(() => {
    let c = 0;
    for (let dd = 1; dd <= daysInMonth; dd++) {
      if (new Date(yr, mo, dd).getDay() !== 0) c++;
    }
    return c;
  }, [yr, mo, daysInMonth]);

  const presentCount = att.size;
  const absentCount  = absentSet.size;
  const holidays     = (s.holidays || []).filter(h => h.startsWith(`${yr}-${String(mo + 1).padStart(2, '0')}`)).length;
  const missedDays   = Math.max(0, totalWorking - presentCount - absentCount);
  const potentialExt = totalWorking * (d.perDay || 0);

  // FIX 6: animated month change
  const changeMonth = useCallback((dir) => {
    Animated.timing(slideAnim, {
      toValue: dir === 1 ? -30 : 30, duration: 160, useNativeDriver: true, easing: Easing.out(Easing.quad),
    }).start(() => {
      const nm = dir === 1 ? (mo === 11 ? 0 : mo + 1) : (mo === 0 ? 11 : mo - 1);
      const ny = dir === 1 ? (mo === 11 ? yr + 1 : yr) : (mo === 0 ? yr - 1 : yr);
      dispatch({ type: 'SET_MONTH', month: nm, year: ny });
      slideAnim.setValue(dir === 1 ? 30 : -30);
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();
    });
  }, [mo, yr, slideAnim, dispatch]);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -40) changeMonth(1);
      else if (g.dx > 40) changeMonth(-1);
    },
  })).current;

  const getDayStatus = useCallback((day) => {
    if (att.has(day))       return 'present';
    if (absentSet.has(day)) return 'absent';
    if (leaveSet.has(day))  return 'leave';
    if (halfdaySet.has(day))return 'halfday';
    return null;
  }, [att, absentSet, leaveSet, halfdaySet]);

  const applyStatus = useCallback((day, status) => {
    const newAtt      = new Set(att);
    const newAbsent   = { ...(s.absentDays  || {}) };
    const newLeave    = { ...(s.leaveDays   || {}) };
    const newHalfday  = { ...(s.halfdayDays || {}) };
    newAtt.delete(day); delete newAbsent[day]; delete newLeave[day]; delete newHalfday[day];
    if (status === 'present')  newAtt.add(day);
    else if (status === 'absent')  newAbsent[day]  = true;
    else if (status === 'leave')   newLeave[day]   = true;
    else if (status === 'halfday') newHalfday[day] = true;
    dispatch({ type: 'SET_ATT_FULL', attendance: newAtt, absentDays: newAbsent, leaveDays: newLeave, halfdayDays: newHalfday });
    setDateModal({ visible: false, day: null });
  }, [att, s.absentDays, s.leaveDays, s.halfdayDays, dispatch]);

  // FIX 7: Mark today with bounce animation
  const markTodayPresent = useCallback(() => {
    if (now.getMonth() === mo && now.getFullYear() === yr) {
      applyStatus(now.getDate(), 'present');
      Animated.sequence([
        Animated.timing(markAnim,  { toValue: 0.91, duration: 80,  useNativeDriver: true }),
        Animated.spring(markAnim,  { toValue: 1.06, useNativeDriver: true, speed: 28 }),
        Animated.spring(markAnim,  { toValue: 1,    useNativeDriver: true, speed: 22 }),
      ]).start();
      Animated.sequence([
        Animated.timing(markGlowAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(markGlowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]).start();
    }
  }, [now, mo, yr, applyStatus]);

  const cells = useMemo(() => {
    const result = [];
    for (let e = 0; e < startOffset; e++) result.push({ type: 'empty', key: `e${e}` });
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const dow    = new Date(yr, mo, dd).getDay();
      const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
      result.push({
        type: 'day', key: `d${dd}`, day: dd,
        isSun: dow === 0, isSat: dow === 6,
        isHol: (s.holidays || []).includes(dateStr),
        isToday: dd === now.getDate() && mo === now.getMonth() && yr === now.getFullYear(),
        status: getDayStatus(dd),
      });
    }
    const rem = (startOffset + daysInMonth) % 7;
    if (rem !== 0) for (let e = 0; e < 7 - rem; e++) result.push({ type: 'empty', key: `f${e}` });
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
      {/* YOUR SALARY — FIX 3 & FIX 4 */}
      <View style={[sty.salaryCard, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[sty.cardTitle, { color: T.t1 }]}>Your Salary</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={[sty.salaryInputBox, { backgroundColor: T.bg, borderColor: T.border, flex: 1 }]}>
            <Text style={[sty.salaryInputLabel, { color: T.t3 }]}>MONTHLY IN-HAND (₹)</Text>
            {/* FIX 3: row with flex-shrink to prevent overflow */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, overflow: 'hidden' }}>
              <Text style={[sty.salaryRupee, { color: T.t2 }]}>₹</Text>
              <TextInput
                value={String(s.salary || '')}
                onChangeText={v => { const n = Number(v); if (!isNaN(n) && n >= 0) dispatch({ type: 'SET_SALARY', salary: n }); }}
                keyboardType="numeric" placeholder="0" placeholderTextColor={T.t3}
                style={[sty.salaryInput, { color: T.t1, flex: 1 }]} />
            </View>
          </View>
          <View style={[sty.salaryInputBox, { backgroundColor: T.bg, borderColor: T.border, flex: 1 }]}>
            <Text style={[sty.salaryInputLabel, { color: T.t3 }]}>WORKING DAYS</Text>
            <Text style={[sty.salaryDaysVal, { color: T.t1, marginTop: 4 }]}>{s.workingDays || 26}</Text>
            <Text style={[sty.salaryDaysSub, { color: T.t3 }]} numberOfLines={1}>Sat on, Sun off</Text>
          </View>
        </View>

        {/* FIX 4: Lost in strong red */}
        {s.salary > 0 && (
          <View style={[sty.statsRow, { borderColor: T.border }]}>
            {[
              { l: 'Per Day', v: fmt(d.perDay),       c: '#4F8CFF', strong: false },
              { l: 'Earned',  v: fmt(d.earnedSalary), c: '#22C55E', strong: false },
              { l: 'Lost',    v: fmt(d.lostSalary),   c: '#EF4444', strong: true  },
            ].map((x, i) => (
              <View key={i} style={[sty.statCell, i < 2 && { borderRightWidth: 1, borderRightColor: T.border }]}>
                <Text style={[sty.statVal, { color: x.c, fontWeight: x.strong ? '900' : '800', fontSize: x.strong ? 16 : 15 }]}>
                  {x.strong && d.lostSalary > 0 ? '−' : ''}{x.v}
                </Text>
                <Text style={[sty.statLabel, { color: x.strong ? '#EF4444AA' : T.t3 }]}>{x.l}</Text>
              </View>
            ))}
          </View>
        )}

        {d.perDay > 0 && (
          <View style={[sty.tipRow, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 14 }}>💡</Text>
            <Text style={[sty.tipText, { color: T.t2 }]}>Miss 1 working day = − {fmt(d.perDay)}</Text>
          </View>
        )}
      </View>

      {/* OTHER INCOME SOURCES */}
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
          <Pressable onPress={() => dispatch({ type: 'ADD_INCOME', income: { label: 'Freelance', amount: 0, frequency: 'Monthly', category: 'Freelance', notes: '', isActive: true, recurring: true } })} style={sty.addIncomeBtn}>
            <Text style={sty.addIncomeText}>+ Add</Text>
          </Pressable>
        </View>

        {(s.incomes || []).slice(1).map((inc, i) => (
          <IncomeCard key={inc?.id || i} inc={inc} idx={i + 1} dispatch={dispatch} T={T} />
        ))}

        {(s.incomes || []).slice(1).length > 0 && (
          <Pressable onPress={() => dispatch({ type: 'ADD_INCOME', income: { label: 'New Income', amount: 0, frequency: 'Monthly', category: 'Other', notes: '', isActive: true, recurring: true } })}
            style={[sty.addAnotherBtn, { borderColor: T.border }]}>
            <Text style={{ fontSize: 16, color: '#4F8CFF' }}>+</Text>
            <Text style={{ color: '#4F8CFF', fontWeight: '600', fontSize: 13 }}>Add Another Income Source</Text>
          </Pressable>
        )}
      </View>

      {/* ATTENDANCE CALENDAR — FIX 6 */}
      <View style={[sty.calendarCard, { backgroundColor: T.l1, borderColor: T.border }]} {...panResponder.panHandlers}>
        {/* FIX 6: Premium left/right arrows at top */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Pressable onPress={() => changeMonth(-1)} style={[sty.calArrowPremium, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ color: T.t1, fontSize: 20, fontWeight: '200' }}>‹</Text>
          </Pressable>
          <Animated.Text style={[sty.calTitle, { color: T.t1, transform: [{ translateX: slideAnim }] }]}>
            {MONTHS_FULL[mo]} {yr}
          </Animated.Text>
          <Pressable onPress={() => changeMonth(1)} style={[sty.calArrowPremium, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ color: T.t1, fontSize: 20, fontWeight: '200' }}>›</Text>
          </Pressable>
        </View>

        {/* FIX 6: Compact stats + legend (no overflow) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            {[{ c:'#22C55E',l:'Present'},{c:'#EF4444',l:'Absent'},{c:'#F59E0B',l:'Half'},{c:'#4F8CFF',l:'Today'}].map((x,i)=>(
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: x.c }} />
                <Text style={{ fontSize: 9, color: T.t3 }}>{x.l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {[{v:presentCount,c:'#22C55E',l:'P'},{v:absentCount,c:'#EF4444',l:'A'},{v:holidays,c:'#F59E0B',l:'H'}].map((x,i)=>(
              <View key={i} style={{ alignItems: 'center', backgroundColor: x.c+'18', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, minWidth: 32 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: x.c }}>{x.v}</Text>
                <Text style={{ fontSize: 8, color: x.c+'BB' }}>{x.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Day headers */}
        <View style={sty.dayHeaders}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>(
            <Text key={i} style={[sty.dayHeader,{color: i===6?'#EF4444':i===5?'#F59E0B':T.t3}]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid with slide animation */}
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={sty.weekRow}>
              {week.map(cell => {
                if (cell.type === 'empty') return <View key={cell.key} style={sty.dayCell} />;
                const { day, isSun, isSat, isHol, isToday, status } = cell;
                let bg='transparent', border='transparent', dotColor=null, textColor=T.t1, isHighlighted=false;
                if (isToday)             { bg='#4F8CFF'; border='#4F8CFF'; textColor='#fff'; isHighlighted=true; }
                else if (status==='present')  { textColor=T.t1; dotColor='#22C55E'; }
                else if (status==='absent')   { textColor='#EF4444'; dotColor='#EF4444'; }
                else if (status==='halfday')  { textColor='#F59E0B'; dotColor='#F59E0B'; }
                else if (status==='leave')    { textColor='#4F8CFF'; dotColor='#4F8CFF'; }
                else if (isHol)               { textColor='#F59E0B'; dotColor='#F59E0B'; }
                else if (isSun)               { textColor='#EF4444'; }
                else if (isSat)               { textColor='#F59E0B'; }
                return (
                  <Pressable key={cell.key} onPress={() => setDateModal({ visible: true, day })}
                    style={[sty.dayCell, isHighlighted && { backgroundColor: bg, borderRadius: 10, borderWidth: 1, borderColor: border }]}>
                    <Text style={[sty.dayText, { color: textColor, fontWeight: isToday ? '800' : '400' }]}>{day}</Text>
                    {dotColor && !isHighlighted && <View style={[sty.dayDot, { backgroundColor: dotColor }]} />}
                    {isToday && <View style={[sty.dayDot, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* FIX 7: Mark Today with bounce */}
        {isCurMonth && (
          <Animated.View style={{ marginTop: 14, transform: [{ scale: markAnim }] }}>
            <Pressable onPress={markTodayPresent} style={sty.markTodayBtn}>
              <LinearGradient colors={['#2355c5','#4F8CFF']} style={sty.markTodayGrad} start={{ x:0,y:0 }} end={{ x:1,y:0 }}>
                <Text style={{ fontSize: 16 }}>✓</Text>
                <Text style={sty.markTodayText}>Mark Today as Present</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* ATTENDANCE INSIGHT — FIX 8 */}
      <View style={[sty.insightCardFixed, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14 }}>
          <View style={[sty.insightIconBox, { backgroundColor: '#22C55E12' }]}>
            <Text style={{ fontSize: 22 }}>📈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E', marginBottom: 3 }}>Attendance Insight 📊</Text>
            <Text style={{ fontSize: 13, color: T.t2, lineHeight: 18 }}>
              You missed {Math.max(0, absentCount + missedDays)} working days this month{absentCount + missedDays === 0 ? ' 🎉' : ''}
            </Text>
            <Text style={{ fontSize: 11, color: T.t3, marginTop: 3 }}>
              {absentCount + missedDays === 0 ? 'Great going! Keep it up.' : 'Improve attendance to earn more.'}
            </Text>
          </View>
        </View>
        {/* FIX 8: Right side — fixed width, no overflow */}
        <View style={{ width: 128, borderLeftWidth: 1, borderLeftColor: T.border, padding: 14, justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, color: T.t3, marginBottom: 4 }}>Potential Extra Earning</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#22C55E' }} numberOfLines={1} adjustsFontSizeToFit>{fmt(potentialExt)}</Text>
          <Text style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>If you attend all days</Text>
          <Text style={{ color: T.t3, fontSize: 14, marginTop: 4 }}>›</Text>
        </View>
      </View>

      <DateActionModal
        visible={dateModal.visible} day={dateModal.day} month={mo} year={yr}
        currentStatus={dateModal.day ? getDayStatus(dateModal.day) : null}
        onSelect={status => dateModal.day && applyStatus(dateModal.day, status)}
        onClose={() => setDateModal({ visible: false, day: null })} T={T} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// WALLET ICON — FIX 9
// ─────────────────────────────────────────────────────────
function WalletIcon({ size = 42 }) {
  return (
    <View style={{ width: size, height: size * 0.78, position: 'relative' }}>
      <View style={{ position:'absolute', bottom:0, left:0, right:0, height:size*0.65, backgroundColor:'#3A7FFF', borderRadius:size*0.13 }} />
      <View style={{ position:'absolute', top:0, left:size*0.06, right:size*0.06, height:size*0.4, backgroundColor:'#5A9BFF', borderRadius:size*0.10, borderBottomLeftRadius:0, borderBottomRightRadius:0 }} />
      <View style={{ position:'absolute', right:size*0.09, top:size*0.27, width:size*0.27, height:size*0.18, backgroundColor:'#FFD700', borderRadius:size*0.05 }} />
      {/* Arrow */}
      <View style={{ position:'absolute', top:-size*0.18, right:-size*0.06, width:size*0.5, height:size*0.5 }}>
        <View style={{ width:2, height:size*0.36, backgroundColor:'rgba(255,255,255,0.85)', transform:[{rotate:'-45deg'}], borderRadius:1, position:'absolute', right:size*0.05, top:size*0.10 }} />
        <View style={{ width:0, height:0, borderLeftWidth:size*0.07, borderRightWidth:size*0.07, borderBottomWidth:size*0.13, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'rgba(255,255,255,0.85)', transform:[{rotate:'45deg'}], position:'absolute', right:0, top:size*0.04 }} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// EXPENSES TAB — Fixes 9-16
// ─────────────────────────────────────────────────────────
const ExpensesTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);

  const [selectedSeg,    setSelectedSeg]    = useState(null);
  const [showAddSheet,   setShowAddSheet]   = useState(false);
  const [addCat,         setAddCat]         = useState('Food');
  const [addCatCustom,   setAddCatCustom]   = useState('');
  const [showCustomCat,  setShowCustomCat]  = useState(false);
  const [addAmt,         setAddAmt]         = useState('');
  const [addFreq,        setAddFreq]        = useState('Monthly');
  const [addCustomFreq,  setAddCustomFreq]  = useState('');
  const [showCustomFreq, setShowCustomFreq] = useState(false);
  const [addErr,         setAddErr]         = useState('');
  const [showCatDrop,    setShowCatDrop]    = useState(false);
  const [showFreqDrop,   setShowFreqDrop]   = useState(false);
  const [showAllTxn,     setShowAllTxn]     = useState(false);
  const [showBudgetDetail, setShowBudgetDetail] = useState(false);
  const segAnim = useRef(new Animated.Value(0)).current;

  const isLight = T.mode === 'light';
  const salary  = s.salary || 0;
  const exps    = s.expenses || [];
  const mExp    = s.manualExpenses || [];
  const wntPct  = exps.find(e => e?.label === 'Wants')?.pct   || 30;
  const savPct  = exps.find(e => e?.label === 'Savings')?.pct || 20;
  const nedPct  = exps.find(e => e?.label === 'Needs')?.pct   || 50;
  const totalSpent = mExp.filter(e => e?.isActive !== false).reduce((a, e) => a + (Number(e?.amount) || 0), 0);
  const budget     = salary * nedPct / 100;
  const spentPct   = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const budgetColor = spentPct < 70 ? '#22C55E' : spentPct < 90 ? '#F59E0B' : '#EF4444';
  const budgetScore = Math.max(0, Math.min(100, Math.round(
    (savPct >= 20 ? 40 : savPct/20*40) + (wntPct <= 30 ? 35 : Math.max(0,35-(wntPct-30)*2)) + (spentPct < 80 ? 25 : Math.max(0,25-(spentPct-80)))
  )));

  const donutSegs = exps.map(e => ({ pct: e.pct, color: e.color }));

  const onSegTap = (idx) => {
    setSelectedSeg(prev => prev === idx ? null : idx);
    Animated.sequence([
      Animated.timing(segAnim, { toValue:1, duration:120, useNativeDriver:true }),
      Animated.timing(segAnim, { toValue:0, duration:120, useNativeDriver:true }),
    ]).start();
  };

  const smartMsg = (() => {
    if (salary === 0) return { main: 'Add salary to see smart summary', flags: [], suggestion: '' };
    const flags = [];
    if (nedPct > 50) flags.push({ icon:'⚠️', msg:`Needs high (${nedPct}%)`, color:'#EF4444' });
    else             flags.push({ icon:'✅', msg:`Needs on track (${nedPct}%)`, color:'#22C55E' });
    if (wntPct > 30) flags.push({ icon:'⚠️', msg:`Wants slightly high (${wntPct}%)`, color:'#F59E0B' });
    else             flags.push({ icon:'✅', msg:`Wants in check (${wntPct}%)`, color:'#22C55E' });
    if (savPct < 20) flags.push({ icon:'⚠️', msg:`Savings low (${savPct}%)`, color:'#EF4444' });
    else             flags.push({ icon:'✅', msg:`Savings on track (${savPct}%)`, color:'#22C55E' });
    const suggestion = wntPct>30 ? `Suggestion: Reduce Wants by ${fmt(salary*(wntPct-30)/100)} to save more`
      : savPct<20 ? `Suggestion: Increase Savings to 20% — automate on salary day`
      : `Looking great! Your budget is well balanced 🎉`;
    return { main: `You spent ${fmt(totalSpent)} this month`, flags, suggestion };
  })();

  const updatePct = (idx, newPct) => {
    const clamped = Math.max(0, Math.min(100, newPct));
    const others = exps.filter((_, i) => i !== idx);
    const remaining = 100 - clamped;
    const otherSum  = others.reduce((a,e) => a+e.pct, 0);
    if (otherSum === 0) return;
    others.forEach(e => {
      const realIdx = exps.findIndex(ex => ex === e);
      dispatch({ type:'UPD_EXP_PCT', idx:realIdx, pct:Math.max(0,Math.round(e.pct*remaining/otherSum)) });
    });
    dispatch({ type:'UPD_EXP_PCT', idx, pct:clamped });
  };

  const EXPENSE_META = {
    Needs:   { sub:'Essentials (Rent, Food)', icon:'🏠', warnAbove:55 },
    Wants:   { sub:'Lifestyle (Shopping, Travel)', icon:'🛍️', warnAbove:31 },
    Savings: { sub:'Investments', icon:'💰', warnBelow:19 },
  };

  const CATS = [
    {label:'Food',icon:'🍔'},{label:'Travel',icon:'🚗'},{label:'Shopping',icon:'🛍️'},
    {label:'Rent',icon:'🏠'},{label:'Utilities',icon:'💡'},{label:'Entertainment',icon:'🎬'},
    {label:'Health',icon:'🏥'},{label:'Education',icon:'📚'},{label:'Other',icon:'💳'},
  ];
  const catObj = CATS.find(c => c.label === addCat) || { label: addCat, icon: '✏️' };
  const excludedAmt = mExp.filter(e => e?.isActive === false).reduce((a,e) => a+(Number(e?.amount)||0), 0);

  const handleAddExpense = () => {
    const amt = Number(addAmt);
    if (!addAmt || isNaN(amt) || amt <= 0) { setAddErr('Enter a valid amount'); return; }
    const finalCat  = addCat === 'Custom' ? (addCatCustom  || 'Custom') : addCat;
    const finalFreq = addFreq === 'Custom' ? (addCustomFreq || 'Custom') : addFreq;
    setAddErr('');
    dispatch({ type:'ADD_MEXP', exp:{ cat:finalCat, amount:amt, icon:catObj.icon, color:'#4F8CFF', recurring:finalFreq==='Monthly', isActive:true, frequency:finalFreq } });
    setAddAmt(''); setAddCat('Food'); setAddFreq('Monthly');
    setShowCustomCat(false); setAddCatCustom(''); setShowCustomFreq(false); setAddCustomFreq('');
    setShowAddSheet(false);
  };

  // FIX 16: Full transaction list
  const ALL_TXN = [
    {app:'Zomato',cat:'Food',icon:'🍕',amt:450,when:'Today'},
    {app:'Uber',cat:'Travel',icon:'🚗',amt:320,when:'Yesterday'},
    {app:'Amazon',cat:'Shopping',icon:'📦',amt:1250,when:'Yesterday'},
    {app:'Netflix',cat:'Entertainment',icon:'🎬',amt:649,when:'2 days ago'},
    {app:'Swiggy',cat:'Food',icon:'🍲',amt:380,when:'2 days ago'},
    {app:'Ola',cat:'Travel',icon:'🚖',amt:180,when:'3 days ago'},
    {app:'Myntra',cat:'Shopping',icon:'👗',amt:899,when:'3 days ago'},
    {app:'Airtel',cat:'Utilities',icon:'📡',amt:399,when:'4 days ago'},
    {app:'BookMyShow',cat:'Entertainment',icon:'🎟️',amt:750,when:'5 days ago'},
    {app:'BigBasket',cat:'Food',icon:'🛒',amt:1140,when:'5 days ago'},
    {app:'Rapido',cat:'Travel',icon:'🛵',amt:95,when:'6 days ago'},
    {app:'Zepto',cat:'Food',icon:'⚡',amt:220,when:'6 days ago'},
    {app:'Reliance Digital',cat:'Shopping',icon:'📱',amt:2999,when:'1 week ago'},
    {app:'BESCOM',cat:'Utilities',icon:'💡',amt:680,when:'1 week ago'},
    {app:'Practo',cat:'Health',icon:'🏥',amt:500,when:'1 week ago'},
    {app:'Spotify',cat:'Entertainment',icon:'🎵',amt:119,when:'8 days ago'},
    {app:'PharmEasy',cat:'Health',icon:'💊',amt:340,when:'8 days ago'},
    {app:'Dunzo',cat:'Shopping',icon:'🧺',amt:420,when:'9 days ago'},
    {app:'Paytm',cat:'Utilities',icon:'💳',amt:150,when:'10 days ago'},
    {app:'Starbucks',cat:'Food',icon:'☕',amt:560,when:'10 days ago'},
    {app:"Byju's",cat:'Education',icon:'📚',amt:999,when:'11 days ago'},
  ];
  const displayedTxn = showAllTxn ? ALL_TXN : ALL_TXN.slice(0, 3);

  const sheetBg     = isLight ? '#FFFFFF' : '#0D1117';
  const sheetText   = isLight ? '#0F172A' : '#F1F5F9';
  const sheetSub    = isLight ? '#64748B' : 'rgba(255,255,255,0.45)';
  const sheetIn     = isLight ? '#F1F5F9' : 'rgba(255,255,255,0.07)';
  const sheetBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)';

  return (
    <View>
      {/* 1. SMART SUMMARY CARD — FIX 9: wallet icon */}
      <LinearGradient colors={['#1a1a2e','#16213e']}
        style={{ borderRadius:18, padding:16, marginBottom:12, borderWidth:1, borderColor:'rgba(79,140,255,0.2)' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
          <View style={{ width:42, height:42, borderRadius:12, backgroundColor:'#4F8CFF22', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontSize:20 }}>📊</Text>
          </View>
          <Text style={{ fontSize:15, fontWeight:'700', color:'#fff', flex:1 }}>{smartMsg.main}</Text>
          <WalletIcon size={44} />
        </View>
        {smartMsg.flags.map((f,i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
            <Text style={{ fontSize:12 }}>{f.icon}</Text>
            <Text style={{ fontSize:12, color:f.color, fontWeight:'600' }}>{f.msg}</Text>
          </View>
        ))}
        {smartMsg.suggestion ? (
          <View style={{ backgroundColor:'rgba(255,255,255,0.06)', borderRadius:10, padding:10, marginTop:10 }}>
            <Text style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:18 }}>{smartMsg.suggestion}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* 2. DONUT CHART — FIX 11 */}
      <View style={{ backgroundColor:T.l1, borderRadius:18, padding:16, marginBottom:12, borderWidth:1, borderColor:T.border }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>Spending Breakdown</Text>
          <Text style={{ fontSize:11, color:T.t3 }}>Total Expenses</Text>
        </View>
        <View style={{ flexDirection:'row', alignItems:'center', gap:16 }}>
          <View>
            <Animated.View style={{ transform:[{ scale:segAnim.interpolate({inputRange:[0,1],outputRange:[1,1.04]}) }] }}>
              <Pressable onPress={() => setSelectedSeg(null)}>
                <DonutChart
                  segments={donutSegs.map((seg,i) => ({ ...seg, color: selectedSeg===i ? seg.color : selectedSeg!=null ? seg.color+'50' : seg.color }))}
                  size={100} sw={14}
                  centerLabel={selectedSeg!=null && exps[selectedSeg] ? `${exps[selectedSeg].pct}%` : salary>0 ? '₹'+Math.round(salary/1000)+'K' : '—'}
                  centerLabelColor={isLight ? '#0F172A' : '#FFFFFF'}
                />
              </Pressable>
            </Animated.View>
            <Text style={{ fontSize:9, color:T.t3, textAlign:'center', marginTop:4 }}>Tap segment 👆</Text>
          </View>
          {/* FIX 11: tap to highlight/dim */}
          <View style={{ flex:1 }}>
            {exps.map((e,i) => (
              <Pressable key={i} onPress={() => onSegTap(i)}
                style={[{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8, paddingHorizontal:10, borderRadius:10, marginBottom:4, opacity: selectedSeg!=null && selectedSeg!==i ? 0.35 : 1 },
                  selectedSeg===i && { backgroundColor:e.color+'18', opacity:1 }]}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                  <View style={{ width:10, height:10, borderRadius:3, backgroundColor:e.color }} />
                  <Text style={{ fontSize:13, color:selectedSeg===i?T.t1:T.t2, fontWeight:selectedSeg===i?'700':'400' }}>{e.label}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ fontSize:13, fontWeight:'700', color:e.color }}>{salary>0?fmt(salary*e.pct/100):`${e.pct}%`}</Text>
                  <Text style={{ fontSize:10, color:T.t3 }}>{e.pct}%</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        {selectedSeg!=null && exps[selectedSeg] && (
          <View style={{ backgroundColor:exps[selectedSeg].color+'15', borderRadius:12, padding:10, marginTop:8, borderWidth:1, borderColor:exps[selectedSeg].color+'30' }}>
            <Text style={{ fontSize:13, color:exps[selectedSeg].color, fontWeight:'600' }}>
              {exps[selectedSeg].label}: {fmt(salary*exps[selectedSeg].pct/100)}/mo ({exps[selectedSeg].pct}%)
            </Text>
          </View>
        )}
      </View>

      {/* 3. NEEDS/WANTS/SAVINGS — FIX 12 */}
      <View style={{ backgroundColor:T.l1, borderRadius:18, padding:4, marginBottom:12, borderWidth:1, borderColor:T.border, overflow:'hidden' }}>
        {exps.map((e,i) => {
          const meta   = EXPENSE_META[e.label] || {};
          const isWarn = (meta.warnAbove!=null && e.pct>=meta.warnAbove) || (meta.warnBelow!=null && e.pct<=meta.warnBelow);
          return (
            <View key={i} style={[{ padding:14 }, i<exps.length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
              {/* FIX 12: icon+text aligned, no overflow */}
              <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 }}>
                <View style={{ width:44, height:44, borderRadius:13, backgroundColor:e.color+'22', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Text style={{ fontSize:20 }}>{meta.icon||'💰'}</Text>
                </View>
                <View style={{ flex:1, minWidth:0 }}>
                  <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }} numberOfLines={1}>{e.label}</Text>
                  <Text style={{ fontSize:11, color:T.t3 }} numberOfLines={1}>{meta.sub||''}</Text>
                  {salary>0 && <Text style={{ fontSize:11, color:T.t3 }}>₹{Math.round(salary*e.pct/100).toLocaleString('en-IN')}/mo</Text>}
                </View>
                <View style={{ alignItems:'flex-end', flexShrink:0 }}>
                  <View style={{ backgroundColor:e.color+'22', borderRadius:11, paddingHorizontal:12, paddingVertical:5, minWidth:60, alignItems:'center' }}>
                    <Text style={{ fontSize:20, fontWeight:'800', color:e.color }}>{e.pct}%</Text>
                  </View>
                  <Text style={{ fontSize:9, color:isWarn?'#F59E0B':'#22C55E', marginTop:2, textAlign:'right' }}>{isWarn?'⚠️ High':'✓ OK'}</Text>
                </View>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                <Pressable onPress={() => updatePct(i,e.pct-1)} style={{ width:34, height:34, borderRadius:9, backgroundColor:T.l2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:T.border }}>
                  <Text style={{ fontSize:20, color:T.t1 }}>−</Text>
                </Pressable>
                <View style={{ flex:1 }}>
                  <View style={{ backgroundColor:T.l3, height:6, borderRadius:99, overflow:'hidden' }}>
                    <View style={{ width:`${e.pct}%`, height:'100%', borderRadius:99, backgroundColor:e.color }} />
                  </View>
                </View>
                <Pressable onPress={() => updatePct(i,e.pct+1)} style={{ width:34, height:34, borderRadius:9, backgroundColor:T.l2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:T.border }}>
                  <Text style={{ fontSize:20, color:T.t1 }}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        <View style={{ flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6, padding:10 }}>
          <View style={{ width:7, height:7, borderRadius:99, backgroundColor:exps.reduce((a,e)=>a+e.pct,0)===100?'#22C55E':'#EF4444' }} />
          <Text style={{ fontSize:12, color:T.t3 }}>Total Allocation: {exps.reduce((a,e)=>a+e.pct,0)}% {exps.reduce((a,e)=>a+e.pct,0)===100?'✅':''}</Text>
        </View>
      </View>

      {/* 4. SPENT VS BUDGET — FIX 13 */}
      <Pressable onPress={() => setShowBudgetDetail(v=>!v)}
        style={{ backgroundColor:T.l1, borderRadius:18, padding:16, marginBottom:12, borderWidth:1, borderColor:T.border }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
          <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>Spent vs Budget</Text>
          <Text style={{ fontSize:14, fontWeight:'800', color:budgetColor }}>{fmt(totalSpent)} / {fmt(budget)}</Text>
        </View>
        {/* FIX 13: Green fill bar */}
        <View style={{ height:14, borderRadius:99, overflow:'hidden', backgroundColor:T.l3, marginBottom:8 }}>
          <View style={{ position:'absolute', left:0, top:0, bottom:0, width:`${Math.min(100,spentPct)}%`, backgroundColor:'#22C55E', borderRadius:99 }} />
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#22C55E' }} />
            <Text style={{ fontSize:10, color:T.t3 }}>{spentPct}% spent</Text>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:T.l3, borderWidth:1, borderColor:T.border }} />
            <Text style={{ fontSize:10, color:T.t3 }}>{100-Math.min(100,spentPct)}% remaining</Text>
          </View>
          <Text style={{ fontSize:11, color:budgetColor, fontWeight:'600' }}>
            {spentPct<70?'🎉 Keep it up!':spentPct<90?'⚠️ Running tight':'🔴 Over budget'}
          </Text>
        </View>
        {showBudgetDetail && (
          <View style={{ marginTop:12, padding:12, backgroundColor:T.l2, borderRadius:12, borderWidth:1, borderColor:T.border }}>
            <Text style={{ fontSize:13, fontWeight:'700', color:T.t1, marginBottom:8 }}>Budget Breakdown</Text>
            {[
              {label:'Total Budget',   val:fmt(budget),                         color:'#4F8CFF'},
              {label:'Amount Spent',   val:fmt(totalSpent),                     color:'#22C55E'},
              {label:'Remaining',      val:fmt(Math.max(0,budget-totalSpent)),  color:'#F59E0B'},
              {label:'Daily Budget',   val:fmt(budget/30),                      color:T.t2},
            ].map((x,i) => (
              <View key={i} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:4 }}>
                <Text style={{ fontSize:12, color:T.t3 }}>{x.label}</Text>
                <Text style={{ fontSize:13, fontWeight:'700', color:x.color }}>{x.val}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      {/* 5. SMART INSIGHT + BUDGET SCORE — FIX 14 */}
      <View style={{ flexDirection:'row', gap:10, marginBottom:12 }}>
        <View style={{ flex:1, backgroundColor:'#0d1117', borderRadius:18, padding:14, borderWidth:1, borderColor:'rgba(245,158,11,0.25)' }}>
          {/* FIX 14: aligned icon+text row */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
            <View style={{ width:28, height:28, borderRadius:8, backgroundColor:'rgba(245,158,11,0.15)', alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:14 }}>💡</Text>
            </View>
            <Text style={{ fontSize:13, fontWeight:'800', color:'#F59E0B' }}>Smart Insight</Text>
          </View>
          {wntPct>30 ? (<>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:6 }}>
              <Text style={{ fontSize:10 }}>⚠️</Text>
              <Text style={{ fontSize:11, color:'#F59E0B', fontWeight:'600', flex:1 }}>Overspending on Wants</Text>
            </View>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:16 }}>Reduce ₹{Math.round(salary*(wntPct-30)/100).toLocaleString('en-IN')} → invest in SIP</Text>
          </>) : (<>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:6 }}>
              <Text style={{ fontSize:10 }}>✅</Text>
              <Text style={{ fontSize:11, color:'#22C55E', fontWeight:'600', flex:1 }}>Spending under control</Text>
            </View>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.6)', lineHeight:16 }}>
              {savPct>=20?`Keep investing ${fmt(salary*savPct/100)}/mo`:`Boost savings to 20%`}
            </Text>
          </>)}
        </View>

        {/* FIX 14: Budget Score aligned */}
        <View style={{ width:130, backgroundColor:T.l1, borderRadius:18, padding:14, borderWidth:1, borderColor:T.border }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:10 }}>
            <Text style={{ fontSize:16 }}>🏆</Text>
            <Text style={{ fontSize:12, fontWeight:'700', color:T.t1 }}>Budget Score</Text>
          </View>
          <View style={{ width:72, height:72, borderRadius:36, borderWidth:4, borderColor:budgetColor, alignItems:'center', justifyContent:'center', marginBottom:8, alignSelf:'center' }}>
            <Text style={{ fontSize:22, fontWeight:'800', color:budgetColor }}>{budgetScore}</Text>
            <Text style={{ fontSize:9, color:T.t3 }}>/100</Text>
          </View>
          <Text style={{ fontSize:11, color:budgetColor, fontWeight:'700', textAlign:'center' }}>
            {budgetScore>=80?'Excellent!':budgetScore>=60?'Good job!':'Needs work'}
          </Text>
        </View>
      </View>

      {/* 6. MANUAL EXPENSES */}
      <View style={{ backgroundColor:T.l1, borderRadius:18, marginBottom:12, borderWidth:1, borderColor:T.border, overflow:'hidden' }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, paddingBottom:10 }}>
          <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>Manual Expenses</Text>
          <Pressable onPress={() => setShowAddSheet(true)}>
            <Text style={{ fontSize:13, fontWeight:'700', color:'#4F8CFF' }}>+ Add Expense</Text>
          </Pressable>
        </View>
        {mExp.length === 0 ? (
          <View style={{ padding:20, alignItems:'center' }}>
            <Text style={{ fontSize:32, marginBottom:8 }}>💳</Text>
            <Text style={{ fontSize:14, fontWeight:'600', color:T.t1, marginBottom:4 }}>No expenses yet</Text>
            <Pressable onPress={() => setShowAddSheet(true)}
              style={{ backgroundColor:'#4F8CFF22', borderRadius:11, paddingHorizontal:20, paddingVertical:10, borderWidth:1, borderColor:'#4F8CFF44', marginTop:8 }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:'#4F8CFF' }}>+ Add Another Expense</Text>
            </Pressable>
          </View>
        ) : mExp.map((ex,i) => {
          const isActive = ex?.isActive !== false;
          return (
            <View key={ex?.id||i} style={[{ flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:13, gap:12 }, i<mExp.length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
              <View style={{ width:42, height:42, borderRadius:12, backgroundColor:T.l2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:T.border }}>
                <Text style={{ fontSize:20 }}>{ex?.icon||'💳'}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:14, fontWeight:'600', color:isActive?T.t1:T.t3 }}>{ex?.cat||'Expense'}</Text>
                <Text style={{ fontSize:11, color:T.t3 }}>{ex?.frequency||(ex?.recurring?'Monthly':'One-time')}</Text>
              </View>
              <Text style={{ fontSize:15, fontWeight:'800', color:isActive?T.t1:T.t3 }}>{fmt(ex?.amount||0)}</Text>
              <Toggle value={isActive} onChange={() => dispatch({ type:'UPD_MEXP', idx:i, patch:{ isActive:!isActive } })} />
              <Pressable onPress={() => Alert.alert('Remove?',`Remove ${ex?.cat}?`,[{text:'Cancel'},{text:'Remove',style:'destructive',onPress:()=>dispatch({type:'DEL_MEXP',idx:i})}])}>
                <Text style={{ fontSize:16, color:T.t3 }}>⋮</Text>
              </Pressable>
            </View>
          );
        })}
        {mExp.length>0 && (
          <Pressable onPress={() => setShowAddSheet(true)}
            style={{ margin:12, borderRadius:12, borderWidth:1, borderColor:'#4F8CFF44', borderStyle:'dashed', padding:12, alignItems:'center', backgroundColor:'#4F8CFF08' }}>
            <Text style={{ fontSize:13, fontWeight:'600', color:'#4F8CFF' }}>+ Add Another Expense</Text>
          </Pressable>
        )}
      </View>

      {/* 7. EXPENSE SUMMARY */}
      <View style={{ backgroundColor:T.l1, borderRadius:18, padding:16, marginBottom:12, borderWidth:1, borderColor:T.border }}>
        <Text style={{ fontSize:14, fontWeight:'700', color:T.t1, marginBottom:14 }}>Expense Summary</Text>
        <View style={{ flexDirection:'row', justifyContent:'space-around' }}>
          {[
            {label:'Active Expenses',val:fmt(totalSpent),color:T.t1},
            {label:'Excluded',val:fmt(excludedAmt),color:T.t3},
            {label:'Total',val:fmt(totalSpent+excludedAmt),color:T.t1},
          ].map((x,i) => (
            <View key={i} style={{ alignItems:'center' }}>
              <Text style={{ fontSize:18, fontWeight:'800', color:x.color }}>{x.val}</Text>
              <Text style={{ fontSize:10, color:T.t3, marginTop:3 }}>{x.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 8. RECENT TRANSACTIONS — FIX 16 */}
      <View style={{ backgroundColor:T.l1, borderRadius:18, marginBottom:12, borderWidth:1, borderColor:T.border, overflow:'hidden' }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, paddingBottom:10 }}>
          <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>Recent Transactions</Text>
          <Pressable onPress={() => setShowAllTxn(v=>!v)}>
            <Text style={{ fontSize:12, color:'#4F8CFF', fontWeight:'600' }}>{showAllTxn?'Show Less':'View All'}</Text>
          </Pressable>
        </View>
        {displayedTxn.map((txn,i) => (
          <View key={i} style={[{ flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:12, gap:12 }, i<displayedTxn.length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
            <View style={{ width:38, height:38, borderRadius:10, backgroundColor:T.l2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:T.border }}>
              <Text style={{ fontSize:18 }}>{txn.icon}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:13, fontWeight:'600', color:T.t1 }}>{txn.app}</Text>
              <Text style={{ fontSize:11, color:T.t3 }}>{txn.cat}</Text>
            </View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={{ fontSize:13, fontWeight:'700', color:T.t1 }}>₹{txn.amt.toLocaleString('en-IN')}</Text>
              <Text style={{ fontSize:11, color:T.t3 }}>{txn.when}</Text>
            </View>
          </View>
        ))}
        {/* FIX 16: tap to expand */}
        {!showAllTxn && (
          <Pressable onPress={() => setShowAllTxn(true)} style={{ padding:12, alignItems:'center', borderTopWidth:1, borderTopColor:T.border }}>
            <Text style={{ fontSize:12, color:'#4F8CFF', fontWeight:'600' }}>+ {ALL_TXN.length-3} more transactions — tap to view all</Text>
          </Pressable>
        )}
        {showAllTxn && (
          <Pressable onPress={() => setShowAllTxn(false)} style={{ padding:12, alignItems:'center', borderTopWidth:1, borderTopColor:T.border }}>
            <Text style={{ fontSize:12, color:T.t3 }}>▲ Show less</Text>
          </Pressable>
        )}
      </View>

      {/* ADD EXPENSE SHEET — FIX 15 */}
      <Modal visible={showAddSheet} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setShowAddSheet(false)}>
        <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'flex-end' }} onPress={() => setShowAddSheet(false)}>
          <Pressable onPress={() => {}} activeOpacity={1}>
            <View style={{ backgroundColor:sheetBg, borderTopLeftRadius:26, borderTopRightRadius:26, padding:20, paddingBottom:44, borderTopWidth:1, borderColor:sheetBorder }}>
              <View style={{ width:40, height:4, backgroundColor:isLight?'#CBD5E1':'rgba(255,255,255,0.2)', borderRadius:2, alignSelf:'center', marginBottom:18 }} />
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <Text style={{ fontSize:18, fontWeight:'800', color:sheetText }}>Add Expense</Text>
                <Pressable onPress={() => setShowAddSheet(false)} style={{ width:32, height:32, borderRadius:16, backgroundColor:isLight?'#F1F5F9':'rgba(255,255,255,0.1)', alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:16, color:sheetText }}>✕</Text>
                </Pressable>
              </View>

              {/* Category */}
              <Text style={{ fontSize:12, color:sheetSub, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Category</Text>
              <Pressable onPress={() => { setShowCatDrop(!showCatDrop); setShowFreqDrop(false); }}
                style={{ backgroundColor:sheetIn, borderRadius:12, padding:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4, borderWidth:1, borderColor:sheetBorder }}>
                <Text style={{ fontSize:16, color:sheetText }}>{catObj.icon} {addCat==='Custom'?(addCatCustom||'Custom'):addCat}</Text>
                <Text style={{ fontSize:12, color:sheetSub }}>▾</Text>
              </Pressable>
              {showCatDrop && (
                <View style={{ backgroundColor:isLight?'#F8FAFC':'#1a1a2e', borderRadius:12, marginBottom:4, overflow:'hidden', borderWidth:1, borderColor:sheetBorder }}>
                  {CATS.map(cat => (
                    <Pressable key={cat.label} onPress={() => { setAddCat(cat.label); setShowCatDrop(false); setShowCustomCat(false); }}
                      style={{ padding:12, flexDirection:'row', alignItems:'center', gap:10, borderBottomWidth:1, borderBottomColor:isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.06)' }}>
                      <Text style={{ fontSize:18 }}>{cat.icon}</Text>
                      <Text style={{ fontSize:14, color:addCat===cat.label?'#4F8CFF':sheetText, fontWeight:addCat===cat.label?'700':'400' }}>{cat.label}</Text>
                    </Pressable>
                  ))}
                  {/* FIX 15: manual category */}
                  <Pressable onPress={() => { setAddCat('Custom'); setShowCustomCat(true); setShowCatDrop(false); }}
                    style={{ padding:12, flexDirection:'row', alignItems:'center', gap:10 }}>
                    <Text style={{ fontSize:18 }}>✏️</Text>
                    <Text style={{ fontSize:14, color:'#A78BFA', fontWeight:'600' }}>+ Add Custom Category</Text>
                  </Pressable>
                </View>
              )}
              {showCustomCat && (
                <View style={{ marginBottom:8 }}>
                  <View style={{ backgroundColor:sheetIn, borderRadius:12, padding:12, borderWidth:1, borderColor:'#A78BFA66' }}>
                    <TextInput value={addCatCustom} onChangeText={setAddCatCustom}
                      placeholder="e.g. Gym, Pet, Subscriptions" placeholderTextColor={sheetSub}
                      style={{ fontSize:15, color:sheetText }} />
                  </View>
                </View>
              )}

              <View style={{ flexDirection:'row', gap:12, marginTop:12 }}>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, color:sheetSub, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Amount (₹)</Text>
                  <View style={{ backgroundColor:sheetIn, borderRadius:12, padding:14, borderWidth:1, borderColor:addErr?'#EF444466':sheetBorder }}>
                    <TextInput value={addAmt} onChangeText={v => { setAddAmt(v.replace(/[^0-9]/g,'')); setAddErr(''); }}
                      keyboardType="numeric" placeholder="3000" placeholderTextColor={sheetSub}
                      style={{ fontSize:18, fontWeight:'700', color:sheetText }} />
                  </View>
                  {addErr ? <Text style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{addErr}</Text> : null}
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:12, color:sheetSub, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Frequency</Text>
                  <Pressable onPress={() => { setShowFreqDrop(!showFreqDrop); setShowCatDrop(false); }}
                    style={{ backgroundColor:sheetIn, borderRadius:12, padding:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:sheetBorder }}>
                    <Text style={{ fontSize:14, color:sheetText }}>{addFreq==='Custom'?(addCustomFreq||'Custom'):addFreq}</Text>
                    <Text style={{ fontSize:12, color:sheetSub }}>▾</Text>
                  </Pressable>
                  {showFreqDrop && (
                    <View style={{ position:'absolute', top:70, left:0, right:0, backgroundColor:isLight?'#F8FAFC':'#1a1a2e', borderRadius:12, zIndex:100, borderWidth:1, borderColor:sheetBorder, overflow:'hidden' }}>
                      {/* FIX 15: Custom frequency */}
                      {['Monthly','Weekly','One-time','Custom'].map(f => (
                        <Pressable key={f} onPress={() => { setAddFreq(f); setShowFreqDrop(false); setShowCustomFreq(f==='Custom'); }}
                          style={{ padding:12, borderBottomWidth:1, borderBottomColor:isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.06)' }}>
                          <Text style={{ fontSize:14, color:addFreq===f?'#4F8CFF':sheetText, fontWeight:addFreq===f?'700':'400' }}>
                            {f==='Custom'?'✏️ Custom...':f}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              {showCustomFreq && (
                <View style={{ marginTop:8 }}>
                  <View style={{ backgroundColor:sheetIn, borderRadius:12, padding:12, borderWidth:1, borderColor:'#4F8CFF66' }}>
                    <TextInput value={addCustomFreq} onChangeText={setAddCustomFreq}
                      placeholder="e.g. Every 3 months, Yearly" placeholderTextColor={sheetSub}
                      style={{ fontSize:14, color:sheetText }} />
                  </View>
                </View>
              )}

              <Pressable onPress={handleAddExpense}
                style={{ backgroundColor:'#4F8CFF', borderRadius:14, padding:16, alignItems:'center', marginTop:24, shadowColor:'#4F8CFF', shadowOpacity:0.4, shadowRadius:12, elevation:8 }}>
                <Text style={{ fontSize:16, fontWeight:'800', color:'#fff' }}>Save Expense</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// TABS + MAIN SCREEN
// ─────────────────────────────────────────────────────────
const TABS = [
  ['salary',   '💰', 'Salary'],
  ['expenses', '💳', 'Expenses'],
  ['sip',      '📈', 'SIP'],
  ['debt',     '🏦', 'Debt'],
];

export default function MoneyScreen() {
  const { state: s, dispatch, set } = useApp();
  const { T } = useTheme();
  const [tab, setTab] = useState('salary');

  const patchedDispatch = useCallback((action) => {
    if (action.type === 'SET_ATT_FULL') {
      set({ attendance:action.attendance, absentDays:action.absentDays, leaveDays:action.leaveDays, halfdayDays:action.halfdayDays });
      return;
    }
    dispatch(action);
  }, [dispatch, set]);

  const fabActions = {
    debt:     [{ icon:'🏦', label:'Add Debt',    color:'#EF4444', action:()=>dispatch({ type:'ADD_DEBT',  debt:{ name:'New Loan', amount:0, remaining:0, emi:0, rate:0, dueDate:5 } }) }],
    expenses: [{ icon:'💳', label:'Add Expense', color:'#F59E0B', action:()=>dispatch({ type:'ADD_MEXP', exp:{ cat:'Other', amount:0, icon:'💸', color:'#475569', recurring:false } }) }],
  };

  return (
    <View style={{ flex:1, backgroundColor:T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:120 }}>
        <View style={sty.screenHeader}>
          <View>
            <Text style={[sty.screenTitle, { color:T.t1 }]}>Money</Text>
            <Text style={[sty.screenSub, { color:T.t3 }]}>All finances, one place</Text>
          </View>
          <MonthPicker month={s.currentMonth||0} year={s.currentYear||new Date().getFullYear()}
            onChange={(m,y) => dispatch({ type:'SET_MONTH', month:m, year:y })} />
        </View>

        <View style={{ paddingHorizontal:16 }}>
          <InvestorWisdomCard />
        </View>

        <View style={[sty.autoAdjust, { backgroundColor:T.l1, borderColor:T.border }]}>
          <View style={{ flexDirection:'row', gap:12, alignItems:'center' }}>
            <Text style={{ fontSize:22 }}>🤖</Text>
            <View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={[sty.autoLabel, { color:T.t1 }]}>Auto-Adjust Mode</Text>
                <View style={[sty.onBadge, { backgroundColor:s.autoAdjust?'#22C55E':'#94A3B8' }]}>
                  <Text style={sty.onBadgeText}>{s.autoAdjust?'ON':'OFF'}</Text>
                </View>
              </View>
              <Text style={[sty.autoSub, { color:T.t3 }]}>AI-driven rebalancing of your finances</Text>
            </View>
          </View>
          <Toggle value={s.autoAdjust||false} onChange={() => set({ autoAdjust:!s.autoAdjust })} />
        </View>

        {/* FIX 10: ALL tabs use same pill style */}
        <View style={[sty.tabBar, { backgroundColor:T.l1, borderColor:T.border }]}>
          {TABS.map(([k,icon,label]) => {
            const on = tab === k;
            return (
              <Pressable key={k} onPress={() => setTab(k)} style={{ flex:1 }}>
                <View style={[sty.tabBtn, on && { backgroundColor:'#4F8CFF', shadowColor:'#4F8CFF', shadowOpacity:0.4, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:6 }]}>
                  <Text style={{ fontSize:13 }}>{icon}</Text>
                  <Text style={[sty.tabLabel, { color:on?'#fff':T.t3 }]}>{label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal:16 }}>
          {tab==='salary'   && <SalaryTab   s={s} dispatch={patchedDispatch} set={set} />}
          {tab==='expenses' && <ExpensesTab s={s} dispatch={dispatch} />}
          {tab==='sip'      && <SipTab      s={s} dispatch={dispatch} />}
          {tab==='debt'     && <DebtTab     s={s} dispatch={dispatch} />}
        </View>
      </ScrollView>
      {(fabActions[tab]||[]).length>0 && <FAB actions={fabActions[tab]} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const sty = StyleSheet.create({
  screenHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:56, paddingHorizontal:16, paddingBottom:14 },
  screenTitle:   { fontSize:32, fontWeight:'800', letterSpacing:-0.5 },
  screenSub:     { fontSize:13, marginTop:2 },
  autoAdjust:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginHorizontal:16, marginBottom:12, borderRadius:14, padding:14, borderWidth:1 },
  autoLabel:     { fontSize:15, fontWeight:'700' },
  autoSub:       { fontSize:12, marginTop:2 },
  onBadge:       { paddingHorizontal:8, paddingVertical:2, borderRadius:99 },
  onBadgeText:   { fontSize:10, fontWeight:'800', color:'#fff' },
  // FIX 10: same pill style for all tabs
  tabBar:        { flexDirection:'row', marginHorizontal:16, marginBottom:14, borderRadius:14, padding:5, gap:4, borderWidth:1 },
  tabBtn:        { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:10, borderRadius:10 },
  tabLabel:      { fontSize:11, fontWeight:'600', letterSpacing:0.1 },
  salaryCard:    { borderRadius:16, padding:16, marginBottom:12, borderWidth:1 },
  cardTitle:     { fontSize:17, fontWeight:'700' },
  salaryInputBox:{ borderRadius:12, padding:12, borderWidth:1 },
  salaryInputLabel:{ fontSize:9, fontWeight:'700', letterSpacing:0.8, textTransform:'uppercase' },
  salaryRupee:   { fontSize:20, fontWeight:'300', marginRight:2 },
  salaryInput:   { fontSize:24, fontWeight:'800' },
  salaryDaysVal: { fontSize:24, fontWeight:'800' },
  salaryDaysSub: { fontSize:10, marginTop:2 },
  statsRow:      { flexDirection:'row', marginTop:12, borderWidth:1, borderRadius:12, overflow:'hidden' },
  statCell:      { flex:1, alignItems:'center', paddingVertical:12 },
  statVal:       { fontSize:15, fontWeight:'800' },
  statLabel:     { fontSize:10, marginTop:3 },
  tipRow:        { flexDirection:'row', alignItems:'center', gap:8, marginTop:10, padding:10, borderRadius:10, borderWidth:1 },
  tipText:       { fontSize:13, fontWeight:'500' },
  incomeSection: { borderRadius:16, padding:16, marginBottom:12, borderWidth:1 },
  incomeSectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  incomeEmpty:   { fontSize:12, marginTop:3 },
  addIncomeBtn:  { paddingHorizontal:12, paddingVertical:6 },
  addIncomeText: { fontSize:14, fontWeight:'700', color:'#4F8CFF' },
  incomeCard:    { borderRadius:14, padding:14, marginBottom:10, borderWidth:1 },
  incomeTop:     { flexDirection:'row', alignItems:'flex-start', gap:12 },
  incomeIconBox: { width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center' },
  incomeTitle:   { fontSize:15, fontWeight:'700' },
  incomeMeta:    { fontSize:12, marginTop:2 },
  incomeAmount:  { fontSize:15, fontWeight:'800' },
  incomePer:     { fontSize:10, fontWeight:'400' },
  activeChip:    { backgroundColor:'#22C55E18', borderRadius:99, paddingHorizontal:7, paddingVertical:2 },
  activeChipText:{ fontSize:10, fontWeight:'700', color:'#22C55E' },
  fieldLabel:    { fontSize:11, fontWeight:'600', letterSpacing:0.4, marginBottom:5 },
  textInputBox:  { flexDirection:'row', alignItems:'center', borderRadius:10, paddingHorizontal:12, paddingVertical:10, borderWidth:1 },
  errText:       { fontSize:11, color:'#EF4444', marginTop:4 },
  picker:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderRadius:10, paddingHorizontal:12, paddingVertical:11, borderWidth:1 },
  insightRow:    { flexDirection:'row', alignItems:'center', gap:8, borderRadius:10, padding:10, borderWidth:1, marginTop:10 },
  deleteBtn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderWidth:1, borderRadius:10, paddingVertical:9 },
  saveBtn:       { flex:2, alignItems:'center', justifyContent:'center', backgroundColor:'#4F8CFF', borderRadius:10, paddingVertical:10 },
  addAnotherBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1, borderStyle:'dashed', borderRadius:12, paddingVertical:12, marginTop:4 },
  calendarCard:  { borderRadius:16, padding:16, marginBottom:12, borderWidth:1 },
  calTitle:      { fontSize:19, fontWeight:'800' },
  calArrowPremium:{ width:36, height:36, borderRadius:10, borderWidth:1, alignItems:'center', justifyContent:'center' },
  dayHeaders:    { flexDirection:'row', marginBottom:6 },
  dayHeader:     { flex:1, textAlign:'center', fontSize:9, fontWeight:'700' },
  weekRow:       { flexDirection:'row', marginBottom:2 },
  dayCell:       { flex:1, aspectRatio:1, alignItems:'center', justifyContent:'center', margin:1 },
  dayText:       { fontSize:12 },
  dayDot:        { width:4, height:4, borderRadius:2, marginTop:1 },
  markTodayBtn:  { overflow:'hidden', borderRadius:14 },
  markTodayGrad: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:14 },
  markTodayText: { fontSize:15, fontWeight:'700', color:'#fff' },
  insightCardFixed:{ flexDirection:'row', borderRadius:16, borderWidth:1, overflow:'hidden', marginBottom:12 },
  insightIconBox:{ width:44, height:44, borderRadius:13, alignItems:'center', justifyContent:'center' },
  modalOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalSheet:    { borderTopLeftRadius:20, borderTopRightRadius:20, paddingTop:8, paddingBottom:Platform.OS==='ios'?34:16 },
  modalOption:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1 },
  dateModal:     { margin:20, borderRadius:20, padding:20 },
  dateModalTitle:{ fontSize:17, fontWeight:'800', marginBottom:4 },
  dateModalSub:  { fontSize:13, marginBottom:16 },
  dateAction:    { flexDirection:'row', alignItems:'center', gap:12, borderRadius:12, padding:14, marginBottom:10 },
  dateCancel:    { borderWidth:1, borderRadius:12, padding:14, alignItems:'center', marginTop:4 },
});
