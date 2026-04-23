import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Modal, TouchableWithoutFeedback, ScrollView,
  TextInput,
} from 'react-native';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW } from './Constants_theme';
import { useTheme } from './Context_ThemeContext';
import { Button, Row, Spacer, Divider } from './Components_UIComponents';
import { FREQUENCIES } from './Constants_data';
import { useApp } from './Context_AppContext';
import dayjs from 'dayjs';

// ─── QUICK ACTION ITEM ────────────────────────────────────────────────────────
function QuickActionItem({ emoji, label, sub, onPress, last }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const bg    = useRef(new Animated.Value(0)).current;

  const onIn  = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97,  useNativeDriver: true,  tension: 400 }),
      Animated.timing(bg,    { toValue: 1,      duration: 80,  useNativeDriver: false }),
    ]).start();
  };
  const onOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true,  tension: 300 }),
      Animated.timing(bg,    { toValue: 0,    duration: 160, useNativeDriver: false }),
    ]).start();
  };

  const bgColor = bg.interpolate({
    inputRange:  [0, 1],
    outputRange: ['transparent', colors.bgCardHover],
  });

  return (
    <>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        <Animated.View style={[
          styles.actionItem,
          { transform: [{ scale }], backgroundColor: bgColor },
        ]}>
          <View style={[styles.actionEmoji, { backgroundColor: colors.bgCardHover, borderColor: colors.borderMid }]}>
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.actionSub, { color: colors.textMuted }]}>{sub}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
        </Animated.View>
      </TouchableOpacity>
      {!last && <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 + SPACING.md }} />}
    </>
  );
}

// ─── FAB BUTTON ───────────────────────────────────────────────────────────────
export function FAB({ onPress }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 7 }),
      Animated.timing(opacity, { toValue: 0.82, duration: 80,  useNativeDriver: true }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 280, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <Animated.View style={[{ transform: [{ scale }], opacity }]}>
        {/* Glow — intentional, only on FAB */}
        <View style={styles.fabGlow} />
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={styles.fab}
          accessible
          accessibilityLabel="Add new item"
          accessibilityRole="button"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── FAB SHEET ───────────────────────────────────────────────────────────────
export function FABSheet({ visible, onClose }) {
  const { colors } = useTheme();
  const translateY  = useRef(new Animated.Value(600)).current;
  const backdropOp  = useRef(new Animated.Value(0)).current;
  const [sheet, setSheet] = useState(null);

  React.useEffect(() => {
    if (visible) {
      setSheet(null);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 72,
          friction: 13,
        }),
        Animated.timing(backdropOp, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 600, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const close = () => {
    onClose();
    setSheet(null);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOp, backgroundColor: colors.overlay }]}
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sheet */}
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.sheet,
              transform:        [{ translateY }],
              borderColor:      colors.borderMid,
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.sheetHandle }]} />

          {/* Content */}
          {!sheet && (
            <MainMenu
              onSelect={setSheet}
              onClose={close}
              colors={colors}
            />
          )}
          {sheet === 'task'      && <AddTaskForm      onClose={close} />}
          {sheet === 'plant'     && <AddPlantForm     onClose={close} />}
          {sheet === 'checklist' && <AddChecklistForm onClose={close} />}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── MAIN MENU ────────────────────────────────────────────────────────────────
function MainMenu({ onSelect, onClose, colors }) {
  return (
    <View>
      <View style={styles.menuHeader}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Quick Add</Text>
        <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
          What would you like to create?
        </Text>
      </View>
      <Spacer size={SPACING.sm} />
      <QuickActionItem
        emoji="✅" label="Add Task" sub="Create a manual task entry"
        onPress={() => onSelect('task')}
      />
      <QuickActionItem
        emoji="🏭" label="Add Plant" sub="Register a new plant or unit"
        onPress={() => onSelect('plant')}
      />
      <QuickActionItem
        emoji="📋" label="Add Checklist" sub="Create a new checklist item"
        onPress={() => onSelect('checklist')}
        last
      />
      <Spacer size={SPACING.xl} />
    </View>
  );
}

// ─── FIELD LABEL ─────────────────────────────────────────────────────────────
function FieldLabel({ label, colors }) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
  );
}

// ─── FORM INPUT ──────────────────────────────────────────────────────────────
function FormInput({ value, onChangeText, placeholder, multiline, colors, maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.bgInput,
          borderColor:     focused ? SEMANTIC.primaryMid : colors.border,
          color:           colors.text,
          height:          multiline ? 80 : undefined,
        },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      maxLength={maxLength}
    />
  );
}

// ─── OPTION CHIPS ─────────────────────────────────────────────────────────────
function OptionChip({ label, active, color, onPress, colors }) {
  const activeColor = color || SEMANTIC.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.optionChip,
        {
          backgroundColor: active ? activeColor + '18' : colors.bgCard,
          borderColor:     active ? activeColor + '40' : colors.border,
        },
      ]}
    >
      <Text style={{
        color:      active ? activeColor : colors.textSub,
        fontSize:   12,
        fontWeight: FONT.medium,
        letterSpacing: 0.1,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── ADD TASK FORM ────────────────────────────────────────────────────────────
function AddTaskForm({ onClose }) {
  const { addTask, state } = useApp();
  const { colors }         = useTheme();
  const [plantId,     setP]   = useState(state.plants[0]?.id || '');
  const [checklistId, setC]   = useState(state.checklists[0]?.id || '');
  const [remark,      setR]   = useState('');
  const [priority,    setPri] = useState('normal');

  const submit = () => {
    if (!plantId || !checklistId) return;
    addTask({
      plantId, checklistId, remark, priority,
      date: dayjs().format('YYYY-MM-DD'),
    });
    onClose();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.menuHeader}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Task</Text>
      </View>
      <Spacer size={SPACING.md} />

      <FieldLabel label="PLANT" colors={colors} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
        <Row style={{ gap: SPACING.sm, paddingRight: SPACING.sm }}>
          {state.plants.map(p => (
            <OptionChip
              key={p.id} label={p.code || p.name}
              active={plantId === p.id}
              onPress={() => setP(p.id)}
              colors={colors}
            />
          ))}
        </Row>
      </ScrollView>

      <FieldLabel label="CHECKLIST" colors={colors} />
      <ScrollView style={{ maxHeight: 130, marginBottom: SPACING.lg }} showsVerticalScrollIndicator={false}>
        {state.checklists.map(c => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setC(c.id)}
            style={[
              styles.checklistItem,
              { borderBottomColor: colors.border },
              checklistId === c.id && {
                backgroundColor: SEMANTIC.primaryDim,
                borderRadius:    RADIUS.sm,
              },
            ]}
          >
            <Text style={[styles.checklistNo, { color: colors.textMuted }]}>{c.no}</Text>
            <Text style={[
              styles.checklistName,
              { color: checklistId === c.id ? SEMANTIC.primaryText : colors.text },
            ]} numberOfLines={1}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FieldLabel label="PRIORITY" colors={colors} />
      <Row style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
        {[
          { id: 'low',    label: '↓ Low'    },
          { id: 'normal', label: '→ Normal' },
          { id: 'high',   label: '↑ High'  },
        ].map(p => (
          <OptionChip
            key={p.id} label={p.label}
            active={priority === p.id}
            onPress={() => setPri(p.id)}
            colors={colors}
          />
        ))}
      </Row>

      <FieldLabel label="REMARK (OPTIONAL)" colors={colors} />
      <FormInput
        value={remark} onChangeText={setR}
        placeholder="Add a note or observation..."
        multiline colors={colors}
      />

      <Spacer size={SPACING.lg} />
      <Button label="Create Task" onPress={submit} fullWidth />
      <Spacer size={SPACING.xxl} />
    </ScrollView>
  );
}

// ─── ADD PLANT FORM ───────────────────────────────────────────────────────────
function AddPlantForm({ onClose }) {
  const { addPlant } = useApp();
  const { colors }   = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    addPlant({ name: name.trim(), code: code.trim().toUpperCase(), color: SEMANTIC.primary });
    onClose();
  };

  return (
    <View>
      <View style={styles.menuHeader}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Plant</Text>
      </View>
      <Spacer size={SPACING.md} />

      <FieldLabel label="PLANT NAME" colors={colors} />
      <FormInput
        value={name} onChangeText={setName}
        placeholder="e.g. Tank Farm C"
        colors={colors}
      />
      <Spacer size={SPACING.md} />

      <FieldLabel label="SHORT CODE" colors={colors} />
      <FormInput
        value={code} onChangeText={setCode}
        placeholder="e.g. TFC"
        colors={colors} maxLength={5}
      />

      <Spacer size={SPACING.lg} />
      <Button label="Add Plant" onPress={submit} fullWidth />
      <Spacer size={SPACING.xxl} />
    </View>
  );
}

// ─── ADD CHECKLIST FORM ───────────────────────────────────────────────────────
function AddChecklistForm({ onClose }) {
  const { addChecklist } = useApp();
  const { colors }       = useTheme();
  const [name, setName]  = useState('');
  const [freq, setFreq]  = useState('monthly');
  const [cat,  setCat]   = useState('Fire');

  const submit = () => {
    if (!name.trim()) return;
    addChecklist({ name: name.trim(), defaultFreq: freq, category: cat });
    onClose();
  };

  const categories = ['Fire', 'Safety', 'Emergency', 'Medical', 'Environment', 'Electrical', 'General'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.menuHeader}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Checklist</Text>
      </View>
      <Spacer size={SPACING.md} />

      <FieldLabel label="CHECKLIST NAME" colors={colors} />
      <FormInput
        value={name} onChangeText={setName}
        placeholder="e.g. Valve Integrity Check"
        colors={colors}
      />

      <Spacer size={SPACING.md} />
      <FieldLabel label="CATEGORY" colors={colors} />
      <View style={styles.chipGrid}>
        {categories.map(c => (
          <OptionChip
            key={c} label={c}
            active={cat === c}
            onPress={() => setCat(c)}
            colors={colors}
          />
        ))}
      </View>

      <Spacer size={SPACING.md} />
      <FieldLabel label="DEFAULT FREQUENCY" colors={colors} />
      <View style={styles.chipGrid}>
        {Object.values(FREQUENCIES).map(f => (
          <OptionChip
            key={f.id} label={f.label}
            active={freq === f.id}
            onPress={() => setFreq(f.id)}
            colors={colors}
          />
        ))}
      </View>

      <Spacer size={SPACING.lg} />
      <Button label="Add Checklist" onPress={submit} fullWidth />
      <Spacer size={SPACING.xxl} />
    </ScrollView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB
  fabContainer: {
    position:  'absolute',
    bottom:    28,
    right:     20,
    width:     58,
    height:    58,
  },
  fab: {
    width:          58,
    height:         58,
    borderRadius:   29,
    backgroundColor: SEMANTIC.primary,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         2,
    ...SHADOW.fab,
  },
  fabGlow: {
    position:       'absolute',
    top:            -10,
    left:           -10,
    right:          -10,
    bottom:         -10,
    borderRadius:   39,
    backgroundColor: SEMANTIC.primary,
    opacity:        0.18,
    zIndex:         1,
  },
  fabIcon: {
    color:      '#fff',
    fontSize:   28,
    fontWeight: FONT.light,
    lineHeight: 32,
    marginTop:  -1,
  },

  // Sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrapper: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius:  RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth:          1,
    borderBottomWidth:    0,
    padding:              SPACING.xl,
    maxHeight:            '90%',
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginBottom: SPACING.lg,
  },

  menuHeader: {
    marginBottom: SPACING.xs,
  },
  sheetTitle: {
    fontSize:      20,
    fontWeight:    FONT.bold,
    letterSpacing: -0.4,
  },
  sheetSub: {
    fontSize:  13,
    marginTop: 4,
    lineHeight: 20,
  },

  // Quick action rows
  actionItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    paddingVertical:   SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius:      RADIUS.md,
  },
  actionEmoji: {
    width:          48,
    height:         48,
    borderRadius:   RADIUS.md,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
  actionLabel: {
    fontSize:   15,
    fontWeight: FONT.medium,
    letterSpacing: -0.2,
  },
  actionSub: {
    fontSize:  12,
    marginTop: 2,
  },

  // Form
  fieldLabel: {
    fontSize:      10,
    fontWeight:    FONT.semibold,
    letterSpacing: 0.8,
    marginBottom:  SPACING.sm,
  },
  input: {
    borderWidth:       1,
    borderRadius:      RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm + 2,
    fontSize:          14,
    letterSpacing:     -0.1,
  },
  optionChip: {
    paddingVertical:   7,
    paddingHorizontal: 14,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING.sm,
    marginBottom:  SPACING.sm,
  },
  checklistItem: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.xs,
  },
  checklistNo: {
    fontSize:   11,
    fontFamily: 'monospace',
    width:      62,
    flexShrink: 0,
  },
  checklistName: {
    fontSize:   13,
    flex:       1,
    letterSpacing: -0.1,
  },
});
