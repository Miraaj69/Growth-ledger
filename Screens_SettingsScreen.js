import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW } from './Constants_theme';
import { useTheme } from './Context_ThemeContext';
import { Row, Spacer, Divider } from './Components_UIComponents';

// ─── SECTION ─────────────────────────────────────────────────────────────────
function Section({ title, children, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, style]}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

// ─── SETTING ROW ─────────────────────────────────────────────────────────────
function SettingRow({ icon, label, sub, right, onPress, last, destructive }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 400 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300 }).start();

  const labelColor = destructive ? SEMANTIC.danger : colors.text;

  const content = (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Row style={styles.settingRow}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: labelColor }]}>{label}</Text>
          {sub && (
            <Text style={[styles.settingSub, { color: colors.textMuted }]}>{sub}</Text>
          )}
        </View>
        {right || (onPress && <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>)}
      </Row>
      {!last && (
        <View style={[styles.rowDivider, { backgroundColor: colors.border, marginLeft: 52 }]} />
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── THEME OPTION ─────────────────────────────────────────────────────────────
function ThemeOption({ name, label, icon, desc, selected, onPress, last }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 400 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300 }).start();

  return (
    <>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        <Animated.View style={[
          styles.themeOption,
          selected && { backgroundColor: SEMANTIC.primaryDim },
          { transform: [{ scale }] },
        ]}>
          {/* Theme preview swatch */}
          <View style={[
            styles.themePreview,
            {
              backgroundColor:
                name === 'dark'   ? '#0B0F1A' :
                name === 'light'  ? '#F4F7FC' : '#000000',
              borderColor:
                name === 'dark'   ? 'rgba(255,255,255,0.08)' :
                name === 'light'  ? '#E4E9F2' : 'rgba(255,255,255,0.05)',
            },
          ]}>
            {/* Mini card preview */}
            <View style={{
              width: 20, height: 6, borderRadius: 3,
              backgroundColor:
                name === 'light' ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)',
              marginBottom: 2,
            }} />
            <View style={{
              width: 14, height: 4, borderRadius: 2,
              backgroundColor:
                name === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
            }} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.themeLabel, { color: selected ? SEMANTIC.primaryText : colors.text }]}>
              {icon} {label}
            </Text>
            <Text style={[styles.themeDesc, { color: colors.textMuted }]}>{desc}</Text>
          </View>

          {/* Radio indicator */}
          <View style={[
            styles.radioOuter,
            {
              borderColor: selected ? SEMANTIC.primary : colors.borderMid,
              backgroundColor: selected ? SEMANTIC.primary : 'transparent',
            },
          ]}>
            {selected && <View style={styles.radioInner} />}
          </View>
        </Animated.View>
      </TouchableOpacity>
      {!last && <View style={[styles.rowDivider, { backgroundColor: colors.border, marginLeft: SPACING.md }]} />}
    </>
  );
}

// ─── SETTINGS SCREEN ─────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme();
  const c = colors;

  const [dailyReminder, setDailyReminder] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [autoGenerate,  setAutoGenerate]  = useState(true);
  const [appLock,       setAppLock]       = useState(false);

  const sw = (val, fn) => ({
    value: val,
    onValueChange: fn,
    trackColor: { false: c.borderMid, true: SEMANTIC.primary },
    thumbColor: '#fff',
    ios_backgroundColor: c.borderMid,
  });

  const confirmClear = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all tasks, history, and reports. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => Alert.alert('Done', 'All data has been cleared.'),
        },
      ]
    );
  };

  const themes = [
    { name: 'dark',   label: 'Dark',   icon: '🌑', desc: 'Default — easy on the eyes'    },
    { name: 'light',  label: 'Light',  icon: '☀️',  desc: 'Clean & bright'               },
    { name: 'amoled', label: 'AMOLED', icon: '⚫',  desc: 'True black — saves battery'   },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <Text style={[styles.title, { color: c.text }]}>Settings</Text>
        <Spacer size={SPACING.xl} />

        {/* ── PROFILE ─────────────────────────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={[styles.profileAvatar, {
            backgroundColor: SEMANTIC.primaryDim,
            borderColor:     SEMANTIC.primaryMid,
          }]}>
            <Text style={[styles.profileInitials, { color: SEMANTIC.primaryText }]}>EHS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: c.text }]}>Safety Officer</Text>
            <Text style={[styles.profileRole, { color: c.textMuted }]}>AVTL Plant · Administrator</Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: c.borderMid }]}
            activeOpacity={0.75}
          >
            <Text style={{ color: c.textSub, fontSize: 12, fontWeight: FONT.medium }}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Spacer size={SPACING.xl} />

        {/* ── APPEARANCE ──────────────────────────────────────────────── */}
        <Section title="APPEARANCE">
          {themes.map((t, i) => (
            <ThemeOption
              key={t.name}
              {...t}
              selected={theme === t.name}
              onPress={() => setTheme(t.name)}
              last={i === themes.length - 1}
            />
          ))}
        </Section>

        {/* ── NOTIFICATIONS ───────────────────────────────────────────── */}
        <Section title="NOTIFICATIONS">
          <SettingRow
            icon="🔔" label="Daily Reminder"
            sub="8:00 AM — daily checklist alert"
            right={<Switch {...sw(dailyReminder, setDailyReminder)} />}
          />
          <SettingRow
            icon="🚨" label="Overdue Alerts"
            sub="Immediate alert for overdue tasks"
            right={<Switch {...sw(overdueAlerts, setOverdueAlerts)} />}
          />
          <SettingRow
            icon="📊" label="Weekly Summary"
            sub="Every Monday — compliance report"
            right={<Switch {...sw(weeklySummary, setWeeklySummary)} />}
            last
          />
        </Section>

        {/* ── DEFAULTS ────────────────────────────────────────────────── */}
        <Section title="DEFAULTS">
          <SettingRow
            icon="🏭" label="Default Plant"
            sub="Tank Farm A"
            onPress={() => Alert.alert('Coming Soon', 'Plant selector will be available soon')}
          />
          <SettingRow
            icon="🔄" label="Default Frequency"
            sub="Monthly"
            onPress={() => Alert.alert('Coming Soon', 'Frequency picker will be available soon')}
          />
          <SettingRow
            icon="⚡" label="Auto Task Generation"
            sub="Generate scheduled tasks automatically"
            right={<Switch {...sw(autoGenerate, setAutoGenerate)} />}
            last
          />
        </Section>

        {/* ── DATA & BACKUP ───────────────────────────────────────────── */}
        <Section title="DATA & BACKUP">
          <SettingRow
            icon="📄" label="Export as PDF"
            sub="Download monthly safety report"
            onPress={() => Alert.alert('Export PDF', 'PDF export coming soon')}
          />
          <SettingRow
            icon="📊" label="Export as Excel"
            sub="Download task data spreadsheet"
            onPress={() => Alert.alert('Export Excel', 'Excel export coming soon')}
          />
          <SettingRow
            icon="☁️" label="Cloud Backup"
            sub="Sync data to secure cloud storage"
            onPress={() => Alert.alert('Backup', 'Cloud backup coming soon')}
          />
          <SettingRow
            icon="↩️" label="Restore from Backup"
            sub="Restore data from cloud backup"
            onPress={() => Alert.alert('Restore', 'Restore feature coming soon')}
          />
          <SettingRow
            icon="🗑️" label="Clear All Data"
            sub="Permanently delete all tasks and reports"
            onPress={confirmClear}
            destructive
            last
          />
        </Section>

        {/* ── SECURITY ────────────────────────────────────────────────── */}
        <Section title="SECURITY">
          <SettingRow
            icon="🔐" label="App Lock"
            sub="PIN or biometric protection"
            right={<Switch {...sw(appLock, setAppLock)} />}
          />
          <SettingRow
            icon="⏱️" label="Auto-lock Timer"
            sub="Lock after 5 min inactivity"
            onPress={() => {}}
            last
          />
        </Section>

        {/* ── ABOUT ───────────────────────────────────────────────────── */}
        <Section title="ABOUT">
          <SettingRow
            icon="ℹ️" label="Version"
            sub="Safexa v2.0.0"
          />
          <SettingRow
            icon="📱" label="Platform"
            sub="React Native + Expo SDK 51"
            last
          />
        </Section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <Text style={[styles.footer, { color: c.textDisabled }]}>
          Safexa · Industrial Safety Management{'\n'}
          © 2026 · All rights reserved
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: 60 },

  title: {
    fontSize:      28,
    fontWeight:    FONT.bold,
    letterSpacing: -0.8,
  },

  profileCard: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    borderRadius:      RADIUS.xl,
    borderWidth:       1,
    padding:           SPACING.lg,
  },
  profileAvatar: {
    width:          52,
    height:         52,
    borderRadius:   26,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize:      13,
    fontWeight:    FONT.bold,
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize:      16,
    fontWeight:    FONT.semibold,
    letterSpacing: -0.2,
  },
  profileRole: {
    fontSize:  12,
    marginTop: 2,
  },
  editBtn: {
    paddingVertical:   6,
    paddingHorizontal: 14,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },

  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize:      10,
    fontWeight:    FONT.semibold,
    letterSpacing: 1,
    marginBottom:  SPACING.sm,
    paddingHorizontal: SPACING.xs,
    textTransform: 'uppercase',
  },
  sectionBox: {
    borderRadius: RADIUS.xl,
    borderWidth:  1,
    overflow:     'hidden',
  },

  settingRow: {
    paddingVertical:   14,
    paddingHorizontal: SPACING.lg,
    gap:               SPACING.md,
  },
  settingIcon: {
    fontSize:   20,
    width:      28,
    textAlign:  'center',
    lineHeight: 24,
  },
  settingLabel: {
    fontSize:      14,
    fontWeight:    FONT.medium,
    letterSpacing: -0.1,
  },
  settingSub: {
    fontSize:  12,
    marginTop: 2,
    lineHeight: 18,
  },
  chevron: {
    fontSize:   18,
    fontWeight: FONT.light,
  },
  rowDivider: {
    height: 1,
  },

  // Theme option
  themeOption: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    paddingVertical:   SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius:      RADIUS.md,
    margin:            SPACING.xs,
  },
  themePreview: {
    width:          44,
    height:         36,
    borderRadius:   RADIUS.md,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  themeLabel: {
    fontSize:      14,
    fontWeight:    FONT.medium,
    letterSpacing: -0.1,
  },
  themeDesc: {
    fontSize:  12,
    marginTop: 2,
  },
  radioOuter: {
    width:          20,
    height:         20,
    borderRadius:   10,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  radioInner: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: '#fff',
  },

  footer: {
    fontSize:   11,
    textAlign:  'center',
    marginTop:  SPACING.md,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});
