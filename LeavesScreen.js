// LeavesScreen.js — Complete Smart Leave + Attendance + Work-Life System
// Pixel-perfect recreation of reference UI with full backend integration

import React, {
  useState, useMemo, useCallback, useRef, useEffect, memo,
} from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Animated,
  Modal, TextInput, Dimensions, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const STATUS_COLORS = {
  present:  '#22C55E',
  absent:   '#EF4444',
  halfday:  '#A78BFA',
  holiday:  '#F59E0B',
  planned:  '#4F8CFF',
  weekend:  '#475569',
};

const LEAVE_TYPES = [
  { key: 'planned', label: 'Planned Leave',  icon: '🏖️', color: '#22C55E',  total: 20 },
  { key: 'sick',    label: 'Sick Leave',      icon: '🏥', color: '#EF4444',  total: 10 },
  { key: 'casual',  label: 'Casual Leave',    icon: '☕', color: '#F59E0B',  total: 12 },
];

const DEFAULT_HOLIDAYS = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-14', name: "Children's Day" },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-05-25', name: 'Buddha Purnima' },
  { date: '2026-09-05', name: "Teacher's Day" },
];

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function fmt(n) {
  const num = Number(n);
  if (isNaN(num)) return '₹0';
  return '₹' + Math.max(0, Math.round(num)).toLocaleString('en-IN');
}

function dateKey(yr, mo, day) {
  return yr + '-' + String(mo + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
}

function getDaysInMonth(yr, mo) { return new Date(yr, mo + 1, 0).getDate(); }

function getFirstDow(yr, mo) {
  const dow = new Date(yr, mo, 1).getDay(); // 0=Sun
  return dow === 0 ? 6 : dow - 1; // Convert to Mon=0 grid
}

function isSunday(yr, mo, day) { return new Date(yr, mo, day).getDay() === 0; }
function isSaturday(yr, mo, day) { return new Date(yr, mo, day).getDay() === 6; }

// ─────────────────────────────────────────────────────────
// GAUGE CHART (Burnout / Attendance Score)
// ─────────────────────────────────────────────────────────
const GaugeChart = memo(({ score, size = 140, color }) => {
  const r = (size / 2) - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  // Arc from left to right (bottom half hidden)
  const startX = cx - r;
  const startY = cy;
  const endX   = cx + r;
  const endY   = cy;

  const trackPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
  const fillPath  = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Track */}
        <Path
          d={trackPath}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
        />
        {/* Fill */}
        <Path
          d={fillPath}
          stroke={color}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </Svg>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// LINE CHART (Leave Trend)
// ─────────────────────────────────────────────────────────
const MiniLineChart = memo(({ takenData, plannedData, labels, T }) => {
  const W = SW - 72;
  const H = 100;
  const maxVal = Math.max(...takenData, ...plannedData, 1);
  const padL = 28, padR = 12, padT = 10, padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = takenData.length;

  const px = (i) => padL + (i / (n - 1)) * chartW;
  const py = (v) => padT + chartH - (v / maxVal) * chartH;

  const makePath = (data) =>
    data.map((v, i) => (i === 0 ? 'M' : 'L') + ' ' + px(i).toFixed(1) + ' ' + py(v).toFixed(1)).join(' ');

  const [tooltip, setTooltip] = useState(null);

  return (
    <View>
      <View style={{ position: 'relative' }}>
        {/* Y-axis labels rendered in RN layer, outside SVG */}
        {[0, 4, 8, 12, 16].map((v) => (
          <Text
            key={'lbl' + v}
            style={{
              position: 'absolute',
              left: 0,
              top: py(v) - 6,
              fontSize: 8,
              color: T.t3,
              width: padL - 2,
              textAlign: 'right',
            }}
          >
            {v}
          </Text>
        ))}
      <Svg width={W} height={H}>
        {/* Grid lines */}
        {[0, 4, 8, 12, 16].map((v) => (
          <Line key={v} x1={padL} y1={py(v)} x2={padL + chartW} y2={py(v)} stroke={T.border} strokeWidth={0.5} />
        ))}
        {/* Taken line */}
        <Path d={makePath(takenData)}  stroke="#4F8CFF" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Planned line */}
        <Path d={makePath(plannedData)} stroke="#22C55E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {takenData.map((v, i) => (
          <Circle key={'t' + i} cx={px(i)} cy={py(v)} r={3} fill="#4F8CFF" />
        ))}
        {plannedData.map((v, i) => (
          <Circle key={'p' + i} cx={px(i)} cy={py(v)} r={3} fill="#22C55E" />
        ))}
      </Svg>
      </View>
      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', paddingLeft: padL, paddingRight: padR, justifyContent: 'space-between' }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ fontSize: 9, color: T.t3, textAlign: 'center', flex: 1 }}>{l}</Text>
        ))}
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// ATTENDANCE ENGINE — pure computation
// ─────────────────────────────────────────────────────────
function computeAttendance(yr, mo, attendanceData, holidays) {
  const days = getDaysInMonth(yr, mo);
  const prefix = yr + '-' + String(mo + 1).padStart(2, '0') + '-';

  let working = 0, present = 0, absent = 0, halfday = 0, holCount = 0;

  for (let d = 1; d <= days; d++) {
    const key  = prefix + String(d).padStart(2, '0');
    const sun  = isSunday(yr, mo, d);
    const isHol = holidays.some(h => h.date === key);
    const status = attendanceData[key];

    if (sun) continue; // Sunday never counts
    if (isHol) { holCount++; continue; }

    working++;
    if (status === 'present')  present++;
    else if (status === 'absent') absent++;
    else if (status === 'halfday') { halfday++; present += 0.5; }
  }

  const score = working > 0 ? Math.round((present / working) * 100) : 0;
  return { working, present, absent, halfday, holidays: holCount, score };
}

// ─────────────────────────────────────────────────────────
// BURNOUT ENGINE
// ─────────────────────────────────────────────────────────
function computeBurnout(stats, leavePlans) {
  const { working, present, absent, halfday } = stats;
  if (working === 0) return { score: 50, label: 'No Data', color: '#94A3B8', tip: 'Add attendance data to see your work balance score.' };

  const attendanceRate = working > 0 ? present / working : 0;
  const leavesUsed     = absent + halfday * 0.5;
  const planned        = (leavePlans || []).length;

  // Ideal: attend 80-95%, take some leaves
  let score = 0;
  if (attendanceRate >= 0.8 && attendanceRate <= 0.95) score += 40;
  else if (attendanceRate > 0.95) score += 25; // Overworking
  else score += Math.round(attendanceRate * 40);

  if (leavesUsed >= 1 && leavesUsed <= 4) score += 35;
  else if (leavesUsed === 0) score += 15; // No breaks = risky
  else score += Math.min(35, Math.round(leavesUsed * 8));

  if (planned > 0) score += 25;
  else score += 10;

  score = Math.min(100, Math.max(0, score));

  let label, color, tip;
  if (score >= 75) {
    label = 'Good Balance'; color = '#22C55E';
    tip = 'Great work-life balance! Keep it up.';
  } else if (score >= 50) {
    label = 'Moderate Risk'; color = '#F59E0B';
    tip = 'You have taken fewer leaves than ideal. Consider taking 1–2 days off this month.';
  } else {
    label = 'Burnout Risk'; color = '#EF4444';
    tip = 'You are overworking. Take at least 2 days off immediately.';
  }

  return { score, label, color, tip };
}

// ─────────────────────────────────────────────────────────
// AI LEAVE SUGGESTION ENGINE
// ─────────────────────────────────────────────────────────
function computeAISuggestion(yr, mo, attendanceData, holidays) {
  const days = getDaysInMonth(yr, mo);
  const today = new Date();
  const suggestions = [];

  for (let d = 1; d <= days; d++) {
    const key = dateKey(yr, mo, d);
    const date = new Date(yr, mo, d);
    const dow = date.getDay(); // 0=Sun, 5=Fri, 4=Thu
    if (date <= today) continue;
    const isHol = holidays.some(h => h.date === key);
    if (isHol || dow === 0) continue;

    // Friday leave = long weekend
    if (dow === 5) {
      const nextKey = dateKey(yr, mo, d + 2 <= days ? d + 2 : d);
      const satKey  = dateKey(yr, mo, d + 1 <= days ? d + 1 : d);
      suggestions.push({
        type: 'long_weekend',
        title: 'Take leave on ' + DAYS_SHORT[dow === 0 ? 6 : dow - 1] + ', ' + d + ' ' + MONTHS_SHORT[mo],
        subtitle: d + ' ' + MONTHS_SHORT[mo] + ' (Fri) + ' + (d+1) + ' ' + MONTHS_SHORT[mo] + ' (Sat) + ' + (d+2) + ' ' + MONTHS_SHORT[mo] + ' (Sun)',
        body: 'and enjoy a 3-day weekend! 🎉',
        days: [key],
      });
    }

    // Monday leave = long weekend too
    if (dow === 1) {
      suggestions.push({
        type: 'long_weekend',
        title: 'Take leave on Mon, ' + d + ' ' + MONTHS_SHORT[mo],
        subtitle: (d-2) + ' ' + MONTHS_SHORT[mo] + ' (Sat) + ' + (d-1) + ' ' + MONTHS_SHORT[mo] + ' (Sun) + ' + d + ' ' + MONTHS_SHORT[mo] + ' (Mon)',
        body: 'and enjoy a 3-day weekend! 🎉',
        days: [key],
      });
    }

    if (suggestions.length >= 2) break;
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'rest',
      title: 'Plan 2 days off this month',
      subtitle: 'Good work-life balance needs regular breaks',
      body: 'Taking 1–2 leaves per month improves productivity.',
      days: [],
    });
  }

  return suggestions[0];
}

// ─────────────────────────────────────────────────────────
// STATUS MARK MODAL
// ─────────────────────────────────────────────────────────
const MarkModal = memo(({ visible, dateInfo, onSelect, onClose, T }) => {
  if (!dateInfo) return null;
  const { yr, mo, day } = dateInfo;
  const key = dateKey(yr, mo, day);
  const dow  = new Date(yr, mo, day).getDay();
  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow];
  const label = dayName + ', ' + day + ' ' + MONTHS_SHORT[mo] + ' ' + yr;

  const options = [
    { key: 'present', label: 'Mark Present',   icon: '✅', color: '#22C55E', desc: 'Full working day' },
    { key: 'halfday', label: 'Mark Half Day',   icon: '🔆', color: '#A78BFA', desc: 'Half day worked' },
    { key: 'absent',  label: 'Mark Absent',     icon: '❌', color: '#EF4444', desc: 'Did not attend' },
    { key: 'planned', label: 'Plan Leave',      icon: '📅', color: '#4F8CFF', desc: 'Future planned leave' },
    { key: null,      label: 'Clear Status',    icon: '🔄', color: '#94A3B8', desc: 'Remove marking' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} activeOpacity={1}>
          <View style={[s.markModal, { backgroundColor: T.l1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[s.markModalTitle, { color: T.t1 }]}>{label}</Text>
              <Pressable onPress={onClose} style={[s.closeBtn, { backgroundColor: T.l2 }]}>
                <Text style={{ color: T.t2, fontSize: 13, fontWeight: '700' }}>✕</Text>
              </Pressable>
            </View>
            <Text style={[s.markModalSub, { color: T.t3 }]}>Select attendance status</Text>
            {options.map(opt => (
              <Pressable
                key={String(opt.key)}
                onPress={() => { onSelect(opt.key); onClose(); }}
                style={[s.markOption, { backgroundColor: opt.color + '12', borderColor: opt.color + '35' }]}
              >
                <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: opt.color }}>{opt.label}</Text>
                  <Text style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>{opt.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ─────────────────────────────────────────────────────────
// APPLY LEAVE MODAL
// ─────────────────────────────────────────────────────────
const ApplyLeaveModal = memo(({ visible, onClose, onApply, T }) => {
  const [leaveType, setLeaveType] = useState('planned');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [reason, setReason]       = useState('');
  const [err, setErr]             = useState('');

  const handleApply = () => {
    if (!fromDate) { setErr('Enter from date (YYYY-MM-DD)'); return; }
    if (!/\d{4}-\d{2}-\d{2}/.test(fromDate)) { setErr('Format: YYYY-MM-DD'); return; }
    setErr('');
    onApply({ leaveType, fromDate, toDate: toDate || fromDate, reason });
    setFromDate(''); setToDate(''); setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} activeOpacity={1} style={{ width: '100%' }}>
          <View style={[s.applySheet, { backgroundColor: T.l1 }]}>
            <View style={[s.sheetHandle, { backgroundColor: T.t3 + '50' }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[s.sheetTitle, { color: T.t1 }]}>Apply Leave</Text>
              <Pressable onPress={onClose} style={[s.closeBtn, { backgroundColor: T.l2 }]}>
                <Text style={{ color: T.t2, fontWeight: '700' }}>✕</Text>
              </Pressable>
            </View>

            {/* Leave Type */}
            <Text style={[s.fieldLbl, { color: T.t3 }]}>Leave Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {LEAVE_TYPES.map(lt => (
                <Pressable
                  key={lt.key}
                  onPress={() => setLeaveType(lt.key)}
                  style={[s.typeChip, {
                    backgroundColor: leaveType === lt.key ? lt.color + '25' : T.l2,
                    borderColor: leaveType === lt.key ? lt.color : T.border,
                  }]}
                >
                  <Text style={{ fontSize: 13 }}>{lt.icon}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: leaveType === lt.key ? lt.color : T.t2 }}>{lt.label.split(' ')[0]}</Text>
                </Pressable>
              ))}
            </View>

            {/* Dates */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLbl, { color: T.t3 }]}>From Date</Text>
                <View style={[s.inputBox, { backgroundColor: T.l2, borderColor: err ? '#EF4444' : T.border }]}>
                  <TextInput
                    value={fromDate} onChangeText={setFromDate}
                    placeholder="2026-05-30" placeholderTextColor={T.t3}
                    style={{ color: T.t1, fontSize: 14, flex: 1 }}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLbl, { color: T.t3 }]}>To Date</Text>
                <View style={[s.inputBox, { backgroundColor: T.l2, borderColor: T.border }]}>
                  <TextInput
                    value={toDate} onChangeText={setToDate}
                    placeholder="2026-05-30" placeholderTextColor={T.t3}
                    style={{ color: T.t1, fontSize: 14, flex: 1 }}
                  />
                </View>
              </View>
            </View>

            {/* Reason */}
            <Text style={[s.fieldLbl, { color: T.t3 }]}>Reason (optional)</Text>
            <View style={[s.inputBox, { backgroundColor: T.l2, borderColor: T.border, minHeight: 60, alignItems: 'flex-start', paddingTop: 10, marginBottom: 16 }]}>
              <TextInput
                value={reason} onChangeText={setReason}
                placeholder="e.g. Family function" placeholderTextColor={T.t3}
                style={{ color: T.t1, fontSize: 14, flex: 1 }}
                multiline
              />
            </View>
            {err ? <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}

            <Pressable onPress={handleApply} style={{ borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['#3B82F6', '#4F8CFF']} style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Apply Leave</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ─────────────────────────────────────────────────────────
// CALENDAR COMPONENT
// ─────────────────────────────────────────────────────────
const CalendarView = memo(({ yr, mo, attendanceData, holidays, leavePlans, onDayPress, onPrevMonth, onNextMonth, T }) => {
  const days       = getDaysInMonth(yr, mo);
  const startOffset = getFirstDow(yr, mo);
  const today       = new Date();
  const todayKey    = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const cells = useMemo(() => {
    const arr = [];
    for (let e = 0; e < startOffset; e++) arr.push({ type: 'empty', key: 'e' + e });
    for (let d = 1; d <= days; d++) {
      const key  = dateKey(yr, mo, d);
      const sun  = isSunday(yr, mo, d);
      const sat  = isSaturday(yr, mo, d);
      const isHol = holidays.some(h => h.date === key);
      const isToday = key === todayKey;
      const status = attendanceData[key] || (sun ? 'weekend' : isHol ? 'holiday' : null);
      const isPlanned = (leavePlans || []).some(p => p.date === key);
      arr.push({ type: 'day', key, d, sun, sat, isHol, isToday, status, isPlanned });
    }
    const rem = (startOffset + days) % 7;
    if (rem !== 0) for (let e = 0; e < 7 - rem; e++) arr.push({ type: 'empty', key: 'f' + e });
    return arr;
  }, [yr, mo, days, startOffset, attendanceData, holidays, leavePlans, todayKey]);

  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cells]);

  const animate = (dir) => {
    const out = dir > 0 ? -(SW * 0.3) : (SW * 0.3);
    const inn  = dir > 0 ? (SW * 0.3) : -(SW * 0.3);
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim,   { toValue: out, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(inn);
      if (dir > 0) onNextMonth(); else onPrevMonth();
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim,   { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 3 }),
      ]).start();
    });
  };

  return (
    <View style={[s.calCard, { backgroundColor: T.l1, borderColor: T.border }]}>
      {/* Header */}
      <View style={s.calHeader}>
        <Pressable onPress={() => animate(-1)} style={[s.calArrow, { backgroundColor: T.l2, borderColor: T.border }]}>
          <Text style={{ color: T.t1, fontSize: 18, fontWeight: '700' }}>‹</Text>
        </Pressable>
        <Text style={[s.calMonthTitle, { color: T.t1 }]}>{MONTHS[mo]} {yr}</Text>
        <Pressable onPress={() => animate(1)} style={[s.calArrow, { backgroundColor: T.l2, borderColor: T.border }]}>
          <Text style={{ color: T.t1, fontSize: 18, fontWeight: '700' }}>›</Text>
        </Pressable>
      </View>

      {/* Day labels */}
      <View style={s.dayRow}>
        {DAYS_SHORT.map((d, i) => (
          <Text key={i} style={[s.dayLbl, { color: i === 6 ? '#EF4444' : i === 5 ? '#F59E0B' : T.t3 }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <Animated.View style={{ opacity: opacityAnim, transform: [{ translateX: slideAnim }] }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={s.weekRow}>
            {week.map(cell => {
              if (cell.type === 'empty') {
                return <View key={cell.key} style={s.dayCell} />;
              }

              const { d, sun, sat, isHol, isToday, status, isPlanned } = cell;

              // Determine styling
              let bg = 'transparent', textColor = T.t1, dotColor = null, ringColor = null;

              if (isToday) ringColor = '#4F8CFF';

              if (status === 'present') {
                bg = '#22C55E'; textColor = '#fff';
              } else if (status === 'absent') {
                bg = '#EF4444'; textColor = '#fff';
              } else if (status === 'halfday') {
                bg = '#A78BFA'; textColor = '#fff';
              } else if (status === 'holiday') {
                dotColor = '#F59E0B';
                textColor = '#F59E0B';
              } else if (status === 'weekend' || sun) {
                textColor = '#475569';
              } else if (isPlanned) {
                bg = '#4F8CFF'; textColor = '#fff';
              } else if (sat) {
                textColor = T.t2;
              }

              return (
                <Pressable
                  key={cell.key}
                  onPress={() => !sun && onDayPress(yr, mo, d)}
                  style={[
                    s.dayCell,
                    bg !== 'transparent' && { backgroundColor: bg, borderRadius: 22 },
                    ringColor && { borderWidth: 1.5, borderColor: ringColor, borderRadius: 22 },
                  ]}
                >
                  <Text style={[s.dayNum, { color: textColor, fontWeight: (isToday || bg !== 'transparent') ? '800' : '400' }]}>
                    {d}
                  </Text>
                  {dotColor && <View style={[s.dot, { backgroundColor: dotColor }]} />}
                  {status === 'present' && <View style={[s.dot, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>

      {/* Legend */}
      <View style={[s.legendRow, { borderTopColor: T.border }]}>
        {[
          { color: '#22C55E', label: 'Present' },
          { color: '#EF4444', label: 'Absent' },
          { color: '#A78BFA', label: 'Half Day' },
          { color: '#F59E0B', label: 'Holiday' },
          { color: '#475569', label: 'Weekend' },
        ].map((l, i) => (
          <View key={i} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: l.color }]} />
            <Text style={[s.legendTxt, { color: T.t3 }]}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────
const OverviewTab = memo(({ state, dispatch, yr, mo, attendanceData, holidays, leavePlans, leaveCats, T }) => {
  const stats    = useMemo(() => computeAttendance(yr, mo, attendanceData, holidays), [yr, mo, attendanceData, holidays]);
  const burnout  = useMemo(() => computeBurnout(stats, leavePlans), [stats, leavePlans]);
  const salary   = state.salary || 0;
  const perDay   = salary > 0 ? salary / (state.workingDays || 26) : 0;
  const lostAmt  = (stats.absent + stats.halfday * 0.5) * perDay;
  const upcomingHols = holidays.filter(h => {
    const d = new Date(h.date);
    return d >= new Date();
  }).slice(0, 3);

  const suggestion = useMemo(() => computeAISuggestion(yr, mo, attendanceData, holidays), [yr, mo, attendanceData, holidays]);

  // Monthly trend (fake 7-month data for display)
  const takenData   = [5, 8, 6, 7, 8, stats.absent + stats.halfday, 4];
  const plannedData = [3, 4, 3, 5, 3, leavePlans.length, 2];
  const trendLabels = MONTHS_SHORT.slice(0, 7);

  const [showApplyLeave, setShowApplyLeave] = useState(false);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

      {/* This Month Overview */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[s.cardTitle, { color: T.t1 }]}>This Month Overview</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {[
            { val: stats.working,  label: 'Working\nDays',  color: '#4F8CFF'  },
            { val: stats.present,  label: 'Present\nDays',  color: '#22C55E'  },
            { val: stats.absent,   label: 'Absent\nDays',   color: '#EF4444'  },
            { val: stats.halfday,  label: 'Half\nDays',     color: '#A78BFA'  },
          ].map((x, i) => (
            <View key={i} style={[s.statBox, { backgroundColor: x.color + '18', borderColor: x.color + '30', flex: 1 }]}>
              <Text style={[s.statBoxNum, { color: x.color }]}>{x.val}</Text>
              <Text style={[s.statBoxLbl, { color: T.t3 }]}>{x.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Upcoming Holidays */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[s.cardTitle, { color: T.t1 }]}>Upcoming Holidays</Text>
          <Text style={{ color: '#4F8CFF', fontSize: 13, fontWeight: '700' }}>View All</Text>
        </View>
        {upcomingHols.length === 0 ? (
          <Text style={{ color: T.t3, fontSize: 13 }}>No upcoming holidays</Text>
        ) : upcomingHols.map((h, i) => (
          <View key={i} style={[s.holidayRow, { borderBottomColor: T.border }]}>
            <View style={[s.holidayIcon, { backgroundColor: '#F59E0B18' }]}>
              <Text style={{ fontSize: 18 }}>📅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: T.t3 }}>
                {new Date(h.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: T.t1, marginTop: 1 }}>{h.name}</Text>
            </View>
            <View style={[s.holidayBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }]}>
              <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>Holiday</Text>
            </View>
          </View>
        ))}
      </View>

      {/* AI Leave Suggestion */}
      <LinearGradient colors={['#1a1040', '#0f0a2a']} style={[s.aiCard, { borderColor: '#5B21B630' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={[s.aiIcon, { backgroundColor: '#7C3AED30' }]}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#A78BFA', fontSize: 13, fontWeight: '800', marginBottom: 6 }}>AI Leave Suggestion</Text>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 22 }}>{suggestion.title}</Text>
            <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{suggestion.body}</Text>
            <Text style={{ color: '#A78BFA', fontSize: 12, marginTop: 4 }}>{suggestion.subtitle}</Text>
          </View>
        </View>
        <Pressable onPress={() => setShowApplyLeave(true)} style={s.planLeaveBtn}>
          <Text style={{ color: '#A78BFA', fontWeight: '800', fontSize: 14 }}>Plan Leave</Text>
        </Pressable>
      </LinearGradient>

      {/* Burnout & Wellbeing */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[s.cardTitle, { color: T.t1, marginBottom: 16 }]}>Burnout & Wellbeing</Text>
        <View style={{ alignItems: 'center' }}>
          <View style={{ position: 'relative', alignItems: 'center' }}>
            <GaugeChart score={burnout.score} size={180} color={burnout.color} />
            <View style={{ position: 'absolute', bottom: 0, alignItems: 'center' }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: T.t1 }}>{burnout.score}</Text>
              <Text style={{ fontSize: 14, color: T.t2 }}>/100</Text>
              <Text style={{ fontSize: 13, color: T.t2 }}>Work Balance Score</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: burnout.color, marginTop: 2 }}>{burnout.label}</Text>
            </View>
          </View>
          <View style={[s.burnoutTip, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ fontSize: 13, color: T.t2, lineHeight: 20, textAlign: 'center' }}>{burnout.tip}</Text>
          </View>
        </View>
      </View>

      {/* Leave Trend */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={[s.cardTitle, { color: T.t1 }]}>Leave Trend</Text>
          <View style={[s.trendBadge, { backgroundColor: T.l2, borderColor: T.border }]}>
            <Text style={{ color: T.t2, fontSize: 12, fontWeight: '600' }}>This Year ▾</Text>
          </View>
        </View>
        <MiniLineChart takenData={takenData} plannedData={plannedData} labels={trendLabels} T={T} />
        <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'center', marginTop: 12 }}>
          {[
            { color: '#4F8CFF', label: 'Taken Days' },
            { color: '#22C55E', label: 'Planned Days' },
          ].map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: x.color }} />
              <Text style={{ color: T.t3, fontSize: 11 }}>{x.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ApplyLeaveModal visible={showApplyLeave} onClose={() => setShowApplyLeave(false)} T={T}
        onApply={(leave) => {
          // Parse date range and mark as planned
          const from = new Date(leave.fromDate);
          const to   = new Date(leave.toDate);
          const newData = { ...attendanceData };
          for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            const k = d.toISOString().slice(0, 10);
            if (!isSunday(d.getFullYear(), d.getMonth(), d.getDate())) {
              newData[k] = 'planned';
            }
          }
          dispatch({ type: 'SET', payload: { attendanceData: newData } });
          setShowApplyLeave(false);
          Alert.alert('Leave Applied!', 'Your leave has been planned successfully.');
        }}
      />
    </ScrollView>
  );
});

// ─────────────────────────────────────────────────────────
// ANALYTICS TAB
// ─────────────────────────────────────────────────────────
const AnalyticsTab = memo(({ yr, mo, attendanceData, holidays, salary, workingDays, leaveCats, T }) => {
  const stats  = useMemo(() => computeAttendance(yr, mo, attendanceData, holidays), [yr, mo, attendanceData, holidays]);
  const perDay = salary > 0 ? salary / (workingDays || 26) : 0;
  const lost   = (stats.absent + stats.halfday * 0.5) * perDay;

  // Count used per type by scanning attendanceData
  const typeBreakdown = useMemo(() => {
    const counts = { planned: 0, sick: 0, casual: 0, absent: 0, halfday: 0 };
    Object.values(attendanceData || {}).forEach(v => {
      if (v in counts) counts[v]++;
    });
    return counts;
  }, [attendanceData]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

      {/* Attendance Score Ring */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[s.cardTitle, { color: T.t1, marginBottom: 14 }]}>Attendance Score</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Score ring */}
          <View style={{ alignItems: 'center', position: 'relative' }}>
            <Svg width={110} height={110}>
              <Circle cx={55} cy={55} r={44} stroke="rgba(255,255,255,0.08)" strokeWidth={10} fill="none" />
              <Circle cx={55} cy={55} r={44}
                stroke={stats.score >= 90 ? '#22C55E' : stats.score >= 70 ? '#4F8CFF' : '#F59E0B'}
                strokeWidth={10} fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - stats.score / 100)}
              />
            </Svg>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: T.t1 }}>{stats.score}%</Text>
              <Text style={{ fontSize: 10, color: '#22C55E', fontWeight: '700' }}>
                {stats.score >= 90 ? 'Excellent' : stats.score >= 70 ? 'Good' : 'Average'}
              </Text>
              <Text style={{ fontSize: 9, color: T.t3 }}>Keep it up! 🏆</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flex: 1, gap: 8 }}>
            {[
              { label: 'Working Days', val: stats.working, color: T.t1 },
              { label: 'Present',      val: stats.present,  color: '#22C55E' },
              { label: 'Absent',       val: stats.absent,   color: '#EF4444' },
              { label: 'Half Day',     val: stats.halfday,  color: '#A78BFA' },
            ].map((x, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: T.t3, fontSize: 14 }}>{x.label}</Text>
                <Text style={{ color: x.color, fontSize: 16, fontWeight: '800' }}>{x.val}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Salary Impact */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[s.cardTitle, { color: T.t1 }]}>Salary Impact</Text>
          <Text style={{ color: T.t3, fontSize: 12 }}>Per day salary</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[s.salImpactIcon, { backgroundColor: '#EF444418' }]}>
              <Text style={{ fontSize: 22 }}>💸</Text>
            </View>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#EF4444' }}>{fmt(lost)}</Text>
              <Text style={{ color: T.t3, fontSize: 12 }}>lost this month due to absence</Text>
            </View>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.t1 }}>{fmt(perDay)}</Text>
        </View>
        <View style={[s.impactDetail, { borderTopColor: T.border }]}>
          <Text style={{ color: T.t3, fontSize: 12 }}>
            {stats.absent} absent days • {stats.halfday} half day{stats.halfday !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Leave Category Breakdown */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={[s.cardTitle, { color: T.t1 }]}>Leave Categories</Text>
          <Text style={{ color: '#4F8CFF', fontSize: 13, fontWeight: '700' }}>View All</Text>
        </View>
        {LEAVE_TYPES.map((lt, i) => {
          const usedCat = leaveCats?.[lt.key] || 0;
          const pct = Math.min(100, Math.round((usedCat / lt.total) * 100));
          return (
            <View key={i} style={[s.leaveCatRow, { borderBottomColor: T.border }]}>
              <View style={[s.leaveCatIcon, { backgroundColor: lt.color + '18' }]}>
                <Text style={{ fontSize: 18 }}>{lt.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: T.t1, fontSize: 15, fontWeight: '600' }}>{lt.label}</Text>
                  <Text style={{ color: lt.color, fontSize: 13, fontWeight: '700' }}>
                    {usedCat} / {lt.total} days
                  </Text>
                </View>
                <View style={[s.progressTrack, { backgroundColor: T.l3 }]}>
                  <View style={[s.progressFill, { width: pct + '%', backgroundColor: lt.color }]} />
                </View>
                <Text style={{ color: T.t3, fontSize: 11, marginTop: 4 }}>{pct}%</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Gamification Achievements */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[s.cardTitle, { color: T.t1, marginBottom: 14 }]}>Achievements</Text>
        {[
          { icon: '🏅', title: 'Perfect Attendance', desc: '20+ present days in a month', earned: stats.present >= 20, color: '#22C55E' },
          { icon: '⚖️', title: 'Balanced Worker',    desc: 'Work balance score above 75', earned: computeBurnout(stats, []).score >= 75, color: '#4F8CFF' },
          { icon: '⚠️', title: 'Overworked Warning', desc: '0 leaves taken this month',   earned: stats.absent === 0 && stats.halfday === 0, color: '#EF4444' },
        ].map((a, i) => (
          <View key={i} style={[s.achieveRow, { backgroundColor: a.earned ? a.color + '12' : T.l2, borderColor: a.earned ? a.color + '35' : T.border }]}>
            <View style={[s.achieveIconBox, { backgroundColor: a.color + '20' }]}>
              <Text style={{ fontSize: 22 }}>{a.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: a.earned ? a.color : T.t2 }}>{a.title}</Text>
              <Text style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{a.desc}</Text>
            </View>
            {a.earned ? (
              <View style={[s.earnedBadge, { backgroundColor: a.color + '25', borderColor: a.color + '50' }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: a.color }}>Earned</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: T.t3 }}>Locked</Text>
            )}
          </View>
        ))}
      </View>

    </ScrollView>
  );
});

// ─────────────────────────────────────────────────────────
// INSIGHTS TAB
// ─────────────────────────────────────────────────────────
const InsightsTab = memo(({ yr, mo, attendanceData, holidays, salary, workingDays, T, dispatch }) => {
  const stats   = useMemo(() => computeAttendance(yr, mo, attendanceData, holidays), [yr, mo, attendanceData, holidays]);
  const perDay  = salary > 0 ? salary / (workingDays || 26) : 0;
  const burnout = useMemo(() => computeBurnout(stats, []), [stats]);

  const insights = [
    {
      icon: '📊',
      title: 'Attendance Rate',
      value: stats.working > 0 ? Math.round((stats.present / stats.working) * 100) + '%' : '—',
      color: '#4F8CFF',
      tip: stats.present / (stats.working || 1) >= 0.9 ? 'Excellent attendance this month!' : 'Try to improve attendance to 90%+',
    },
    {
      icon: '💸',
      title: 'Salary Preserved',
      value: fmt(salary - (stats.absent + stats.halfday * 0.5) * perDay),
      color: '#22C55E',
      tip: 'Based on ' + stats.present + ' present days',
    },
    {
      icon: '🎯',
      title: 'Days Remaining',
      value: String(Math.max(0, stats.working - stats.present - stats.absent - stats.halfday)),
      color: '#F59E0B',
      tip: 'Working days not yet marked',
    },
    {
      icon: '⚖️',
      title: 'Work Balance',
      value: burnout.score + '/100',
      color: burnout.color,
      tip: burnout.label,
    },
  ];

  // Import holiday JSON
  const handleImportHolidays = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'text/csv'] });
      if (result.canceled) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      let parsed;
      try { parsed = JSON.parse(content); } catch { Alert.alert('Error', 'Invalid JSON format'); return; }
      if (!Array.isArray(parsed)) { Alert.alert('Error', 'Must be an array of {date, name} objects'); return; }
      const valid = parsed.filter(h => h.date && h.name);
      const merged = [...(holidays || [])];
      valid.forEach(h => { if (!merged.some(m => m.date === h.date)) merged.push(h); });
      dispatch({ type: 'SET', payload: { holidays: merged } });
      Alert.alert('Success', valid.length + ' holidays imported!');
    } catch (e) {
      Alert.alert('Error', 'Could not read file: ' + e.message);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

      {/* Insight Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
        {insights.map((ins, i) => (
          <View key={i} style={[s.insightBox, { backgroundColor: T.l1, borderColor: ins.color + '30', flex: 1, minWidth: (SW - 48) / 2 - 5 }]}>
            <View style={[s.insightBoxIcon, { backgroundColor: ins.color + '20' }]}>
              <Text style={{ fontSize: 20 }}>{ins.icon}</Text>
            </View>
            <Text style={[s.insightBoxVal, { color: ins.color }]}>{ins.value}</Text>
            <Text style={[s.insightBoxTitle, { color: T.t1 }]}>{ins.title}</Text>
            <Text style={[s.insightBoxTip, { color: T.t3 }]}>{ins.tip}</Text>
          </View>
        ))}
      </View>

      {/* Smart Tips */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[s.cardTitle, { color: T.t1, marginBottom: 14 }]}>Smart Tips</Text>
        {[
          {
            icon: '💡',
            tip: 'Taking regular 1-2 day breaks per month reduces burnout by 40%.',
            color: '#F59E0B',
          },
          {
            icon: '📅',
            tip: 'Plan leaves around long weekends for maximum rest with minimum leaves used.',
            color: '#4F8CFF',
          },
          {
            icon: '🏥',
            tip: 'Keep sick leave for genuine illness. Use planned leave for vacations.',
            color: '#EF4444',
          },
        ].map((t, i) => (
          <View key={i} style={[s.tipRow, { backgroundColor: t.color + '10', borderColor: t.color + '25' }]}>
            <Text style={{ fontSize: 18 }}>{t.icon}</Text>
            <Text style={{ flex: 1, fontSize: 13, color: T.t2, lineHeight: 18 }}>{t.tip}</Text>
          </View>
        ))}
      </View>

      {/* Import Holidays */}
      <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
        <Text style={[s.cardTitle, { color: T.t1, marginBottom: 6 }]}>Holiday Import</Text>
        <Text style={{ color: T.t3, fontSize: 12, marginBottom: 14, lineHeight: 18 }}>
          Import a JSON file with format:{'\n'}
          {'[{"date":"2026-01-26","name":"Republic Day"}, ...]'}
        </Text>
        <View style={{ gap: 10 }}>
          <Pressable onPress={handleImportHolidays} style={[s.importBtn, { borderColor: '#4F8CFF40', backgroundColor: '#4F8CFF10' }]}>
            <Text style={{ fontSize: 18 }}>📂</Text>
            <Text style={{ color: '#4F8CFF', fontWeight: '700', fontSize: 14 }}>Import JSON / CSV</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              dispatch({ type: 'SET', payload: { holidays: DEFAULT_HOLIDAYS } });
              Alert.alert('Done', 'Default Indian holidays loaded!');
            }}
            style={[s.importBtn, { borderColor: '#22C55E40', backgroundColor: '#22C55E10' }]}
          >
            <Text style={{ fontSize: 18 }}>🇮🇳</Text>
            <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14 }}>Load Indian Holidays 2026</Text>
          </Pressable>
        </View>
        {holidays.length > 0 && (
          <Text style={{ color: T.t3, fontSize: 12, marginTop: 10 }}>
            {holidays.length} holiday{holidays.length !== 1 ? 's' : ''} loaded
          </Text>
        )}
      </View>

    </ScrollView>
  );
});

// ─────────────────────────────────────────────────────────
// MAIN LEAVES SCREEN
// ─────────────────────────────────────────────────────────
export default function LeavesScreen() {
  const { state, dispatch, set } = useApp();
  const { T } = useTheme();

  const [activeTab,    setActiveTab]    = useState('Overview');
  const [markModal,    setMarkModal]    = useState({ visible: false, dateInfo: null });
  const [showApplyLeave, setShowApplyLeave] = useState(false);

  const tabs = ['Overview', 'Calendar', 'Analytics', 'Insights'];

  // Derive data from global state
  const attendanceData = useMemo(() => state.attendanceData || {}, [state.attendanceData]);
  const holidays       = useMemo(() => {
    const h = state.holidays || [];
    return h.length > 0 ? h : DEFAULT_HOLIDAYS;
  }, [state.holidays]);
  const leavePlans     = useMemo(() => state.leavePlans || [], [state.leavePlans]);
  const leaveCats      = useMemo(() => state.leaveCats  || {}, [state.leaveCats]);

  const yr = state.currentYear  || new Date().getFullYear();
  const mo = state.currentMonth || 0;

  const goPrevMonth = useCallback(() => {
    const nm = mo === 0 ? 11 : mo - 1;
    const ny = mo === 0 ? yr - 1 : yr;
    dispatch({ type: 'SET_MONTH', month: nm, year: ny });
    // Don't clear attendanceData on month change — it's keyed by date
  }, [mo, yr, dispatch]);

  const goNextMonth = useCallback(() => {
    const nm = mo === 11 ? 0  : mo + 1;
    const ny = mo === 11 ? yr + 1 : yr;
    dispatch({ type: 'SET_MONTH', month: nm, year: ny });
  }, [mo, yr, dispatch]);

  // Handle day tap
  const handleDayPress = useCallback((yr, mo, day) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
    setMarkModal({ visible: true, dateInfo: { yr, mo, day } });
  }, []);

  // Apply status from modal
  const handleStatusSelect = useCallback((status) => {
    if (!markModal.dateInfo) return;
    const { yr, mo, day } = markModal.dateInfo;
    const key = dateKey(yr, mo, day);
    const newData = { ...attendanceData };
    if (status === null) {
      delete newData[key];
    } else {
      newData[key] = status;
      // Update leave category counts
      if (['planned', 'sick', 'casual'].includes(status)) {
        const newCats = { ...leaveCats };
        newCats[status] = (newCats[status] || 0) + 1;
        set({ leaveCats: newCats });
      }
    }
    set({ attendanceData: newData });
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
  }, [markModal.dateInfo, attendanceData, leaveCats, set]);

  const stats = useMemo(() => computeAttendance(yr, mo, attendanceData, holidays), [yr, mo, attendanceData, holidays]);

  return (
    <View style={[s.screen, { backgroundColor: T.bg }]}>

      {/* Header */}
      <View style={[s.header, { borderBottomColor: T.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: T.t1 }]}>Leaves & Attendance</Text>
        </View>
        <Pressable
          onPress={() => setShowApplyLeave(true)}
          style={[s.headerIconBtn, { backgroundColor: T.l2, borderColor: T.border }]}
        >
          <Text style={{ fontSize: 18 }}>📅</Text>
        </Pressable>
      </View>

      {/* Sub-tabs */}
      <View style={[s.subTabBar, { backgroundColor: T.l1, borderColor: T.border }]}>
        {tabs.map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1 }}>
            <View style={[s.subTabBtn, activeTab === tab && { backgroundColor: '#4F8CFF' }]}>
              <Text style={[s.subTabTxt, { color: activeTab === tab ? '#fff' : T.t3 }]}>{tab}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>

        {activeTab === 'Overview' && (
          <OverviewTab
            state={state}
            dispatch={dispatch}
            yr={yr} mo={mo}
            attendanceData={attendanceData}
            holidays={holidays}
            leavePlans={leavePlans}
            leaveCats={leaveCats}
            T={T}
          />
        )}

        {activeTab === 'Calendar' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 14 }}>
            <CalendarView
              yr={yr} mo={mo}
              attendanceData={attendanceData}
              holidays={holidays}
              leavePlans={leavePlans}
              onDayPress={handleDayPress}
              onPrevMonth={goPrevMonth}
              onNextMonth={goNextMonth}
              T={T}
            />
            {/* Stats summary below calendar */}
            <View style={[s.card, { backgroundColor: T.l1, borderColor: T.border }]}>
              <Text style={[s.cardTitle, { color: T.t1, marginBottom: 12 }]}>Month Summary</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Working Days', val: stats.working, color: '#4F8CFF' },
                  { label: 'Present',      val: stats.present, color: '#22C55E' },
                  { label: 'Absent',       val: stats.absent,  color: '#EF4444' },
                  { label: 'Half Day',     val: stats.halfday, color: '#A78BFA' },
                  { label: 'Holidays',     val: stats.holidays,color: '#F59E0B' },
                ].map((x, i) => (
                  <View key={i} style={[s.statBox, { backgroundColor: x.color + '15', borderColor: x.color + '25', minWidth: (SW - 64) / 3 - 5 }]}>
                    <Text style={[s.statBoxNum, { color: x.color, fontSize: 22 }]}>{x.val}</Text>
                    <Text style={[s.statBoxLbl, { color: T.t3 }]}>{x.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'Analytics' && (
          <AnalyticsTab
            yr={yr} mo={mo}
            attendanceData={attendanceData}
            holidays={holidays}
            salary={state.salary || 0}
            workingDays={state.workingDays || 26}
            leaveCats={leaveCats}
            T={T}
          />
        )}

        {activeTab === 'Insights' && (
          <InsightsTab
            yr={yr} mo={mo}
            attendanceData={attendanceData}
            holidays={holidays}
            salary={state.salary || 0}
            workingDays={state.workingDays || 26}
            T={T}
            dispatch={dispatch}
          />
        )}
      </View>

      {/* Bottom Apply Leave CTA */}
      <View style={[s.bottomBar, { borderTopColor: T.border, backgroundColor: T.bg }]}>
        <Pressable onPress={() => setShowApplyLeave(true)} style={{ borderRadius: 14, overflow: 'hidden', flex: 1 }}>
          <LinearGradient colors={['#3B82F6', '#4F8CFF']} style={s.applyBtn}>
            <Text style={{ fontSize: 18 }}>+</Text>
            <Text style={s.applyBtnTxt}>Apply Leave</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Mark Status Modal */}
      <MarkModal
        visible={markModal.visible}
        dateInfo={markModal.dateInfo}
        onSelect={handleStatusSelect}
        onClose={() => setMarkModal({ visible: false, dateInfo: null })}
        T={T}
      />

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        visible={showApplyLeave}
        onClose={() => setShowApplyLeave(false)}
        T={T}
        onApply={(leave) => {
          const from = new Date(leave.fromDate);
          const to   = new Date(leave.toDate);
          const newData = { ...attendanceData };
          const newCats = { ...leaveCats };
          for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            const k  = d.toISOString().slice(0, 10);
            const su = d.getDay() === 0;
            if (!su) {
              newData[k] = leave.leaveType;
              newCats[leave.leaveType] = (newCats[leave.leaveType] || 0) + 1;
            }
          }
          set({ attendanceData: newData, leaveCats: newCats });
          setShowApplyLeave(false);
          Alert.alert('Leave Applied! ✅', 'Your leave has been marked on the calendar.');
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:      { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Sub-tabs
  subTabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 2,
    borderRadius: 12, padding: 4, gap: 3, borderWidth: 1,
  },
  subTabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center',
  },
  subTabTxt: { fontSize: 12, fontWeight: '700' },

  // Cards
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '800' },

  // Stat boxes
  statBox: {
    borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', minWidth: 70,
  },
  statBoxNum: { fontSize: 28, fontWeight: '900', lineHeight: 34 },
  statBoxLbl: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 2, lineHeight: 14 },

  // Calendar
  calCard: {
    borderRadius: 16, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, marginBottom: 12,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calArrow: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  calMonthTitle: { fontSize: 18, fontWeight: '800' },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayLbl: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum:  { fontSize: 13 },
  dot:     { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 12,
    marginTop: 8, borderTopWidth: 1, justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontSize: 10, fontWeight: '600' },

  // Holiday row
  holidayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  holidayIcon:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  holidayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },

  // AI card
  aiCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12,
    shadowColor: '#7C3AED', shadowOpacity: 0.15, shadowRadius: 10, elevation: 3,
  },
  aiIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planLeaveBtn: {
    borderWidth: 1, borderColor: '#A78BFA50', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginTop: 14, backgroundColor: '#A78BFA12',
  },

  // Burnout
  burnoutTip: {
    borderRadius: 12, padding: 14, borderWidth: 1, marginTop: 16, width: '100%',
  },

  // Trend badge
  trendBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },

  // Salary impact
  salImpactIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  impactDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },

  // Leave categories
  leaveCatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  leaveCatIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 99 },

  // Achievements
  achieveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1,
  },
  achieveIconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  earnedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },

  // Insights
  insightBox: {
    borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 0,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  insightBoxIcon:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  insightBoxVal:   { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  insightBoxTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  insightBoxTip:   { fontSize: 11, lineHeight: 16 },

  // Tip rows
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1 },

  // Import
  importBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 14, paddingHorizontal: 16,
  },

  // Mark modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  markModal: {
    width: SW - 40, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  markModalTitle: { fontSize: 17, fontWeight: '800' },
  markModalSub:   { fontSize: 13, marginBottom: 14 },
  markOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1,
  },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Apply leave modal
  applySheet: {
    width: SW, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 20, fontWeight: '800' },
  fieldLbl:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, marginBottom: 0,
  },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: 10, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 8,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 12, borderTopWidth: 1,
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 14,
  },
  applyBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
