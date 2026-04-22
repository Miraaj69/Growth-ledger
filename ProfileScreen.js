// ProfileScreen.js — Premium Redesign v12
// Design: Layered depth, glassmorphism hero, grouped settings with consistent tokens

import React, { useMemo, memo } from 'react';
import {
  ScrollView, View, Text, Pressable,
  Alert, Share, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp }   from './AppContext';
import { useTheme } from './ThemeContext';
import { fmt, safePct, calcScore } from './helpers';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, GCard, Chip, Bar, SH, Toggle, AlertRow, Btn } from './UI';
import { clearState } from './storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { triggerSmartNotifications, getNotifSuggestions } from './notifications';

// ─── Stat Pill ────────────────────────────────────────────
const StatPill = memo(({ icon, label, val, color }) => {
  const { T } = useTheme();
  return (
    <View style={[pst.pill, { backgroundColor: T.l1, borderColor: T.border }]}>
      <Text style={{ fontSize: 20, marginBottom: 6 }}>{icon}</Text>
      <Text style={[pst.pillVal, { color: color || T.t1 }]}>{val}</Text>
      <Text style={[pst.pillLabel, { color: T.t3 }]}>{label}</Text>
    </View>
  );
});

const pst = StyleSheet.create({
  pill: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pillVal:   { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  pillLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ─── Achievement Badge ────────────────────────────────────
const AchBadge = memo(({ icon, label, desc, unlocked, color }) => {
  const { T } = useTheme();
  return (
    <View style={{ width: '30%', alignItems: 'center', marginBottom: 14 }}>
      <View style={[{
        width: 52, height: 52, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: unlocked ? color + '22' : T.l2,
        borderColor:     unlocked ? color + '44' : T.border,
        opacity: unlocked ? 1 : 0.28,
        marginBottom: 5,
        shadowColor: unlocked ? color : 'transparent',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: unlocked ? 3 : 0,
      }]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: unlocked ? T.t2 : T.t3, textAlign: 'center' }}>{label}</Text>
      <Text style={{ fontSize: 9, color: T.t3, textAlign: 'center', marginTop: 1 }}>{desc}</Text>
    </View>
  );
});

// ─── Settings Row ─────────────────────────────────────────
const SettingRow = memo(({ icon, label, sub, right, onPress, danger, isLast }) => {
  const { T } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
      }, !isLast && { borderBottomWidth: 1, borderBottomColor: T.border }]}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: danger ? '#EF444415' : T.l2,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: danger ? '#EF4444' : T.t1 }}>{label}</Text>
          {sub && <Text style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>{sub}</Text>}
        </View>
      </View>
      {right}
    </Pressable>
  );
});

// ─── Toggle Row ───────────────────────────────────────────
const ToggleRow = memo(({ icon, label, sub, value, onChange, isLast }) => {
  const { T } = useTheme();
  return (
    <View style={[{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
    }, !isLast && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.l2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: T.t1 }}>{label}</Text>
          {sub && <Text style={{ fontSize: 11, color: T.t3, marginTop: 1 }}>{sub}</Text>}
        </View>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
});

// ══════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { state: s, set, dispatch } = useApp();
  const { T, mode, cycleTheme }     = useTheme();

  const score    = useMemo(() => calcScore(s), [s]);
  const totalInc = useMemo(() => (s.incomes || []).reduce((a, x) => a + (Number(x?.amount) || 0), 0), [s.incomes]);

  const achievements = useMemo(() => {
    const totalSaved = (s.goals || []).reduce((a, g) => a + (Number(g?.saved) || 0), 0);
    const sipTotal   = (s.sips  || []).reduce((a, x) => a + (Number(x?.amount) || 0), 0);
    const debtPaid   = (s.debts || []).reduce((a, d) => a + ((Number(d?.amount) || 0) - (Number(d?.remaining) || 0)), 0);
    const certsDone  = (s.certifications || []).filter(c => c?.status === 'Done').length;
    const present    = s.attendance instanceof Set ? s.attendance.size : 0;
    return [
      { icon: '🥇', label: 'Saver',       desc: 'Saved ₹1L+',   unlocked: totalSaved >= 100000,     color: '#F59E0B' },
      { icon: '📈', label: 'Investor',    desc: 'Started SIP',  unlocked: sipTotal > 0,              color: '#22C55E' },
      { icon: '💪', label: 'Debt Buster', desc: 'Paid ₹50K',    unlocked: debtPaid >= 50000,         color: '#4F8CFF' },
      { icon: '🎓', label: 'Certified',   desc: '2+ certs',     unlocked: certsDone >= 2,            color: '#A78BFA' },
      { icon: '🔥', label: 'Consistent',  desc: '20+ days',     unlocked: present >= 20,             color: '#EF4444' },
      { icon: '👑', label: 'Elite',       desc: 'Score 85+',    unlocked: score.total >= 85,         color: '#F59E0B' },
      { icon: '🎯', label: 'Planner',     desc: '3 goals',      unlocked: (s.goals || []).length >= 3, color: '#14B8A6' },
      { icon: '💎', label: 'Debt-Free',   desc: 'Zero debt',    unlocked: (s.debts || []).every(d => (d?.remaining || 0) === 0) && (s.debts || []).length > 0, color: '#EC4899' },
    ];
  }, [s, score]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const handleExport = async () => {
    try {
      const data = JSON.stringify({
        ...s,
        attendance: [...(s.attendance instanceof Set ? s.attendance : new Set())],
      }, null, 2);
      await Share.share({ message: data, title: 'Growth Ledger Backup' });
    } catch (e) { Alert.alert('Export failed', e.message || 'Unknown error'); }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your financial data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Everything', style: 'destructive', onPress: async () => { await clearState(); dispatch({ type: 'RESET' }); } },
      ]
    );
  };

  const themeLabel = mode === 'dark' ? '🌙 Dark' : mode === 'amoled' ? '⬛ AMOLED' : '☀️ Light';

  const handleHolidayImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      const raw = await FileSystem.readAsStringAsync(file.uri);
      let dates = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) dates = parsed.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
        else if (parsed.holidays && Array.isArray(parsed.holidays)) dates = parsed.holidays;
        else { Alert.alert('Invalid Format', 'JSON must be an array of dates: ["2026-01-26", ...]'); return; }
      } catch {
        dates = raw.split(/[\n,]/).map(d => d.trim().replace(/['"]/g, '')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
      }
      if (dates.length === 0) { Alert.alert('No valid dates found', 'Use format: YYYY-MM-DD'); return; }
      dispatch({ type: 'SET_HOLIDAYS', holidays: dates });
      Alert.alert('Holidays Imported', `${dates.length} holiday dates loaded. They will show in red on the attendance calendar.`);
    } catch (e) { Alert.alert('Import Failed', e.message || 'Could not read file'); }
  };

  const holidayCount = (s.holidays || []).length;
  const notifSuggestions = getNotifSuggestions(s);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* ── HEADER ── */}
      <View style={{ paddingTop: 56, paddingHorizontal: SP.md, paddingBottom: SP.sm }}>
        <Text style={[st.pageTitle, { color: T.t1 }]}>Profile</Text>
        <Text style={{ fontSize: 13, color: T.t3, marginTop: 3 }}>Your financial identity</Text>
      </View>

      {/* ── HERO CARD ── */}
      <View style={{ marginHorizontal: SP.md, marginBottom: 12 }}>
        <LinearGradient
          colors={['#0c1a3a', '#1a3a78', '#1e4fa0']}
          style={st.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative blobs */}
          <View style={st.heroBlobTR} />
          <View style={st.heroBlobBL} />

          {/* Avatar */}
          <View style={st.avatarWrap}>
            <Text style={{ fontSize: 38 }}>👤</Text>
          </View>

          <Text style={st.heroName}>Financial Profile</Text>
          {s.userAge > 0 && (
            <Text style={st.heroAge}>Age {s.userAge}</Text>
          )}

          {/* Chips */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, marginBottom: 4 }}>
            <Chip label={`Score: ${score.total}/100`} color={score.color} dot />
            <Chip label={`Lv ${s.level || 1} · ${s.xpTotal || 0} XP`} color="#F59E0B" />
            <Chip label={`${unlockedCount}/${achievements.length} Achievements`} color="#A78BFA" />
          </View>

          {s.lastSaved && (
            <Text style={st.heroSaved}>✓ Auto-saved · {s.lastSaved}</Text>
          )}
        </LinearGradient>
      </View>

      {/* ── STATS ROW ── */}
      <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: SP.md, marginBottom: 12 }}>
        <StatPill icon="💰" label="Income"  val={totalInc > 0 ? (totalInc >= 100000 ? `₹${(totalInc / 100000).toFixed(1)}L` : `₹${(totalInc / 1000).toFixed(0)}K`) : '—'} color="#22C55E" />
        <StatPill icon="📊" label="SIPs"    val={(s.sips  || []).length || '—'} color="#4F8CFF" />
        <StatPill icon="🎯" label="Goals"   val={(s.goals || []).length || '—'} color="#A78BFA" />
      </View>

      {/* ── ACHIEVEMENTS ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH
            title="Achievements"
            right={`${unlockedCount} / ${achievements.length}`}
            rightColor="#F59E0B"
          />
          {/* XP Progress bar */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 10, color: T.t3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>Progress</Text>
              <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '700' }}>{Math.round((unlockedCount / achievements.length) * 100)}%</Text>
            </View>
            <Bar value={unlockedCount} total={achievements.length} color="#F59E0B" h={5} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {achievements.map((a, i) => (
              <AchBadge key={i} {...a} />
            ))}
          </View>
        </Card>
      </View>

      {/* ── APPEARANCE ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Appearance" />
          <SettingRow
            icon="🎨"
            label="Theme"
            sub="Tap to cycle: Light · Dark · AMOLED"
            onPress={cycleTheme}
            right={<Chip label={themeLabel} color="#4F8CFF" />}
            isLast
          />
        </Card>
      </View>

      {/* ── PRIVACY & SECURITY ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Privacy & Security" />
          <ToggleRow
            icon="👁️"
            label="Mask Amounts"
            sub="Hide numbers in public"
            value={s.maskAmounts || false}
            onChange={() => set({ maskAmounts: !s.maskAmounts })}
          />
          <ToggleRow
            icon="🔐"
            label="Biometric Lock"
            sub="Face ID / Fingerprint"
            value={s.biometricLock || false}
            onChange={() => set({ biometricLock: !s.biometricLock })}
            isLast
          />
        </Card>
      </View>

      {/* ── REMINDERS ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Reminders" />
          {[
            { key: 'salary', icon: '💰', label: 'Salary Day',    sub: 'Alert when salary month ends' },
            { key: 'sip',    icon: '📈', label: 'SIP Alert',     sub: 'Monthly SIP reminder'          },
            { key: 'emi',    icon: '🏦', label: 'EMI Due Date',  sub: 'Never miss a payment'          },
            { key: 'weekly', icon: '📊', label: 'Weekly Report', sub: 'Spending summary every week'   },
          ].map((n, i, arr) => (
            <ToggleRow
              key={n.key}
              icon={n.icon}
              label={n.label}
              sub={n.sub}
              value={(s.notifs || {})[n.key] !== false}
              onChange={() => set({ notifs: { ...(s.notifs || {}), [n.key]: !(s.notifs || {})[n.key] } })}
              isLast={i === arr.length - 1}
            />
          ))}
        </Card>
      </View>

      {/* ── PUBLIC HOLIDAYS ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH
            title="📅 Public Holidays"
            right={holidayCount > 0 ? `${holidayCount} loaded` : undefined}
            rightColor="#EF4444"
          />
          <Text style={{ fontSize: 12, color: T.t3, lineHeight: 18, marginBottom: 12 }}>
            Import a JSON or CSV file with holiday dates (YYYY-MM-DD).
            They appear in red on your attendance calendar.
          </Text>
          {holidayCount > 0 && (
            <View style={[st.holidayPill, { borderColor: '#EF444428' }]}>
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>
                {holidayCount} holidays loaded
              </Text>
              <Text style={{ fontSize: 10, color: T.t3, marginTop: 3 }}>
                {(s.holidays || []).slice(0, 3).join(', ')}{holidayCount > 3 ? ` + ${holidayCount - 3} more` : ''}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Btn label="📂 Import Holidays" onPress={handleHolidayImport} />
            </View>
            {holidayCount > 0 && (
              <Pressable
                onPress={() => Alert.alert('Clear Holidays?', 'Remove all imported holidays?', [
                  { text: 'Cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => dispatch({ type: 'CLEAR_HOLIDAYS' }) },
                ])}
                style={st.clearBtn}
              >
                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>🗑️ Clear</Text>
              </Pressable>
            )}
          </View>
          <Text style={{ fontSize: 11, color: T.t3, marginTop: 10, lineHeight: 17 }}>
            {'💡 Tip: Create a JSON file like: '}
            <Text style={{ color: T.t2 }}>{'["2026-01-26","2026-08-15"]'}</Text>
          </Text>
        </Card>
      </View>

      {/* ── SMART NOTIFICATIONS PANEL ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="🔔 Smart Notifications" />
          {notifSuggestions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ fontSize: 24, marginBottom: 6 }}>✅</Text>
              <Text style={{ fontSize: 13, color: T.t3, textAlign: 'center' }}>
                No critical alerts — finances look healthy!
              </Text>
            </View>
          ) : (
            notifSuggestions.map((n, i) => (
              <AlertRow key={i} icon={n.icon} msg={n.msg} color={n.color} last={i === notifSuggestions.length - 1} />
            ))
          )}
          <Pressable
            onPress={() => triggerSmartNotifications(s).catch(() => {})}
            style={st.notifBtn}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#4F8CFF' }}>
              🔔 Send Smart Reminders Now
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* ── DATA & ACTIONS ── */}
      <View style={{ marginHorizontal: SP.md }}>
        <Card style={{ marginBottom: 12 }}>
          <SH title="Data & Actions" />
          <SettingRow
            icon="💾"
            label="Export JSON Backup"
            sub="Share your data as a backup file"
            onPress={handleExport}
            right={<Text style={{ fontSize: 13, color: '#4F8CFF', fontWeight: '600' }}>↓ Save</Text>}
          />
          <SettingRow
            icon="ℹ️"
            label="About Growth Ledger"
            sub="Version 12.0"
            right={<Text style={{ fontSize: 12, color: T.t3 }}>v12.0</Text>}
          />
          <SettingRow
            icon="🔄"
            label="Reset All Data"
            sub="Permanently delete everything"
            onPress={handleReset}
            danger
            right={<Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600' }}>Reset</Text>}
            isLast
          />
        </Card>
      </View>

    </ScrollView>
  );
}

const st = StyleSheet.create({
  pageTitle: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#1a3a8c',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBlobTR: {
    position: 'absolute', top: -50, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroBlobBL: {
    position: 'absolute', bottom: -60, left: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)',
  },
  heroName: {
    fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3,
  },
  heroAge: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3,
  },
  heroSaved: {
    fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 10,
  },
  holidayPill: {
    backgroundColor: '#EF444412',
    borderRadius: 12, padding: 10,
    borderWidth: 1, marginBottom: 10,
  },
  clearBtn: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF444415',
    borderWidth: 1, borderColor: '#EF444430',
    justifyContent: 'center',
  },
  notifBtn: {
    marginTop: 12,
    backgroundColor: '#4F8CFF18',
    borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: '#4F8CFF35',
    alignItems: 'center',
  },
});
