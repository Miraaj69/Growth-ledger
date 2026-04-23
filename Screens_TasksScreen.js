import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, FlatList, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SEMANTIC, SPACING, RADIUS, FONT, SHADOW } from './Constants_theme';
import { useTheme } from './Context_ThemeContext';
import { EmptyState, Row, Spacer, StatusBadge, SkeletonCard } from './Components_UIComponents';
import { TaskCard } from './Components_TaskCard';
import { FAB, FABSheet } from './Components_FABSheet';
import { useApp } from './Context_AppContext';

// ─── FILTER CONFIG ────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { id: 'all',       label: 'All',       emoji: null },
  { id: 'pending',   label: 'Pending',   emoji: '⏳' },
  { id: 'overdue',   label: 'Overdue',   emoji: '🚨' },
  { id: 'completed', label: 'Done',      emoji: '✅' },
];

// ─── FILTER CHIP ─────────────────────────────────────────────────────────────
function FilterChip({ label, emoji, active, color, onPress }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 400 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300 }).start();

  const activeColor = color || SEMANTIC.primary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
        style={[
          styles.chip,
          {
            backgroundColor: active ? activeColor + '18' : colors.bgCard,
            borderColor:     active ? activeColor + '40' : colors.border,
          },
        ]}
      >
        {emoji && <Text style={styles.chipEmoji}>{emoji}</Text>}
        <Text style={[
          styles.chipText,
          { color: active ? activeColor : colors.textSub },
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChangeText, colors }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      styles.searchBar,
      {
        backgroundColor: colors.bgCard,
        borderColor:     focused ? SEMANTIC.primaryMid : colors.border,
      },
    ]}>
      <Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text>
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search tasks, plants..."
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={[styles.clearBtn, { backgroundColor: colors.borderMid }]}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: FONT.bold }}>✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── TASKS SCREEN ─────────────────────────────────────────────────────────────
export default function TasksScreen({ navigation }) {
  const { colors } = useTheme();
  const { state, completeTask, deleteTask } = useApp();

  const [statusFilter, setStatusFilter] = useState('all');
  const [plantFilter,  setPlantFilter]  = useState('all');
  const [search,       setSearch]       = useState('');
  const [fabOpen,      setFabOpen]      = useState(false);

  // ─── FILTERED TASKS ──────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let tasks = [...state.tasks].sort((a, b) => {
      const priority = { overdue: 0, pending: 1, completed: 2 };
      return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
    });

    if (statusFilter !== 'all') tasks = tasks.filter(t => t.status === statusFilter);
    if (plantFilter  !== 'all') tasks = tasks.filter(t => t.plantId === plantFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      const clMap = {};
      state.checklists.forEach(c => { clMap[c.id] = c.name.toLowerCase(); });
      tasks = tasks.filter(t =>
        clMap[t.checklistId]?.includes(q) ||
        state.plants.find(p => p.id === t.plantId)?.name.toLowerCase().includes(q)
      );
    }

    return tasks;
  }, [state.tasks, state.checklists, statusFilter, plantFilter, search]);

  const overdueCount  = state.tasks.filter(t => t.status === 'overdue').length;
  const pendingCount  = state.tasks.filter(t => t.status === 'pending').length;

  const renderItem = useCallback(({ item }) => (
    <TaskCard
      task={item}
      onComplete={id => completeTask(id)}
      onDelete={id => deleteTask(id)}
      onPress={task => navigation.navigate('TaskDetail', { task })}
    />
  ), [completeTask, deleteTask, navigation]);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Tasks</Text>
          {overdueCount > 0 && (
            <Text style={[styles.overdueHint, { color: SEMANTIC.dangerText }]}>
              {overdueCount} overdue · needs attention
            </Text>
          )}
        </View>
        {/* Task count summary badge */}
        <View style={[styles.countBadge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.textSub }]}>
            {filteredTasks.length}
          </Text>
        </View>
      </View>

      {/* ── SEARCH ──────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} colors={colors} />
      </View>

      {/* ── STATUS FILTERS — horizontal scroll, consistent pills ────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {STATUS_FILTERS.map(f => (
          <FilterChip
            key={f.id}
            label={f.label}
            emoji={f.emoji}
            active={statusFilter === f.id}
            onPress={() => setStatusFilter(f.id)}
          />
        ))}
      </ScrollView>

      {/* ── PLANT FILTERS — plant color when active ─────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { paddingTop: 0 }]}
        style={[styles.filterScroll, { marginTop: -SPACING.xs }]}
      >
        <FilterChip
          label="All Plants"
          active={plantFilter === 'all'}
          onPress={() => setPlantFilter('all')}
        />
        {state.plants.map(p => (
          <FilterChip
            key={p.id}
            label={p.code || p.name}
            active={plantFilter === p.id}
            color={p.color}
            onPress={() => setPlantFilter(p.id)}
          />
        ))}
      </ScrollView>

      {/* ── SEPARATOR ───────────────────────────────────────────────────── */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* ── TASK LIST ───────────────────────────────────────────────────── */}
      <FlatList
        data={filteredTasks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        initialNumToRender={6}
        windowSize={10}
        ListEmptyComponent={
          <EmptyState
            emoji={search ? '⌕' : (statusFilter === 'completed' ? '✅' : '🎯')}
            title={
              search
                ? 'No results found'
                : statusFilter === 'completed'
                ? 'No completed tasks'
                : 'All caught up!'
            }
            subtitle={
              search
                ? `No tasks match "${search}"`
                : statusFilter !== 'all'
                ? 'Try changing your filters'
                : 'No tasks scheduled for this view.'
            }
            action={search || statusFilter !== 'all' ? 'Clear Filters' : null}
            onAction={() => { setSearch(''); setStatusFilter('all'); setPlantFilter('all'); }}
          />
        }
        ListFooterComponent={<Spacer size={100} />}
      />

      <FAB onPress={() => setFabOpen(true)} />
      <FABSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop:     SPACING.lg,
    paddingBottom:  SPACING.sm,
  },
  title: {
    fontSize:      28,
    fontWeight:    FONT.bold,
    letterSpacing: -0.8,
  },
  overdueHint: {
    fontSize:  12,
    fontWeight: FONT.medium,
    marginTop:  3,
  },
  countBadge: {
    paddingVertical:   5,
    paddingHorizontal: 12,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    marginBottom:      4,
  },
  countText: {
    fontSize:   13,
    fontWeight: FONT.semibold,
  },

  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     SPACING.sm,
  },
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderRadius:      RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical:   2,
    gap:               SPACING.sm,
  },
  searchIcon: {
    fontSize:   20,
    lineHeight: 24,
  },
  searchInput: {
    flex:       1,
    fontSize:   14,
    paddingVertical: 10,
    letterSpacing: -0.1,
  },
  clearBtn: {
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
  },

  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    gap:               SPACING.sm,
    flexDirection:     'row',
    alignItems:        'center',
  },

  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingVertical:   7,
    paddingHorizontal: 14,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },
  chipEmoji: {
    fontSize:   12,
    lineHeight: 16,
  },
  chipText: {
    fontSize:      12,
    fontWeight:    FONT.medium,
    letterSpacing: 0.1,
  },

  separator: {
    height:           1,
    marginHorizontal: SPACING.lg,
    marginBottom:     SPACING.sm,
  },

  listContent: {
    paddingHorizontal: SPACING.lg,
  },
});
