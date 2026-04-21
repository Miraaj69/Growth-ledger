// GoalsScreen.js — Full Goal Planner
import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable,
  StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, SH, Bar, Chip, Btn, Input, StatRow, Empty, GCard, AlertRow } from './UI';
import { fmt, fmtShort, safeNum, safePct, monthlyNeeded, sipMaturity } from './helpers';

// ── Goal presets ──────────────────────────────────────────
const GOAL_PRESETS = [
  { label:'🏠 House',       target:'5000000', duration:'60', icon:'🏠', color:'#4F8CFF' },
  { label:'🚗 Car',         target:'800000',  duration:'24', icon:'🚗', color:'#22C55E' },
  { label:'✈️ Travel',      target:'200000',  duration:'12', icon:'✈️', color:'#A78BFA' },
  { label:'🎓 Education',   target:'1000000', duration:'36', icon:'🎓', color:'#F59E0B' },
  { label:'💍 Wedding',     target:'1500000', duration:'24', icon:'💍', color:'#EC4899' },
  { label:'🏖️ Retirement',  target:'10000000',duration:'300',icon:'🏖️', color:'#14B8A6' },
  { label:'💻 Gadget',      target:'150000',  duration:'12', icon:'💻', color:'#EF4444' },
  { label:'🎯 Custom',      target:'',        duration:'',   icon:'🎯', color:'#F59E0B' },
];

const STATUS_COLOR = (pct) =>
  pct >= 100 ? '#22C55E' : pct >= 75 ? '#14B8A6' : pct >= 50 ? '#4F8CFF' : pct >= 25 ? '#F59E0B' : '#EF4444';

const STATUS_LABEL = (pct) =>
  pct >= 100 ? '🎉 Achieved!' : pct >= 75 ? '🔥 Almost there' : pct >= 50 ? '💪 Halfway' : pct >= 25 ? '📈 Building' : '🌱 Just started';

// ── Add Goal Modal ─────────────────────────────────────────
function AddGoalModal({ visible, onClose, onAdd }) {
  const { T } = useTheme();
  const [step, setStep]         = useState(0); // 0=preset, 1=details
  const [preset, setPreset]     = useState(null);
  const [name, setName]         = useState('');
  const [target, setTarget]     = useState('');
  const [duration, setDuration] = useState('');
  const [saved, setSaved]       = useState('');
  const [monthly, setMonthly]   = useState('');

  const reset = () => { setStep(0); setPreset(null); setName(''); setTarget(''); setDuration(''); setSaved(''); setMonthly(''); };

  const selectPreset = (p) => {
    setPreset(p);
    if (p.label !== '🎯 Custom') {
      setName(p.label.split(' ').slice(1).join(' '));
      setTarget(p.target);
      setDuration(p.duration);
    }
    setStep(1);
  };

  const monthlyReq = useMemo(() => {
    const t = safeNum(target), s = safeNum(saved), d = safeNum(duration, 1);
    return d > 0 ? Math.max(0, Math.round((t - s) / d)) : 0;
  }, [target, saved, duration]);

  const handleAdd = () => {
    const t = safeNum(target), d = safeNum(duration);
    if (!name.trim()) { Alert.alert('Error', 'Please enter goal name'); return; }
    if (t === 0)       { Alert.alert('Error', 'Please enter target amount'); return; }
    if (d === 0)       { Alert.alert('Error', 'Please enter duration in months'); return; }
    onAdd({
      title: name.trim(),
      target: t,
      saved: safeNum(saved),
      color: preset?.color || '#4F8CFF',
      icon:  preset?.icon  || '🎯',
      duration: d,
      monthlyContrib: safeNum(monthly) || monthlyReq,
      deadline: new Date(Date.now() + d * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={[st.modal, { backgroundColor: T.bg }]} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={st.modalHeader}>
            <Text style={[st.modalTitle, { color: T.t1 }]}>
              {step === 0 ? 'Choose Goal Type' : 'Goal Details'}
            </Text>
            <Pressable onPress={() => { reset(); onClose(); }} style={[st.closeBtn, { backgroundColor: T.l2 }]}>
              <Text style={{ fontSize: 18, color: T.t2 }}>✕</Text>
            </Pressable>
          </View>

          {step === 0 ? (
            // PRESET SELECTION
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, padding:SP.md }}>
              {GOAL_PRESETS.map((p, i) => (
                <Pressable key={i} onPress={() => selectPreset(p)}
                  style={[st.presetCard, { backgroundColor:T.l2, borderColor: p.color+'30', borderWidth:1 }]}>
                  <Text style={{ fontSize:26, marginBottom:6 }}>{p.icon}</Text>
                  <Text style={{ fontSize:12, fontWeight:'600', color:T.t1, textAlign:'center' }}>
                    {p.label.split(' ').slice(1).join(' ')}
                  </Text>
                  {p.target ? (
                    <Text style={{ fontSize:10, color:T.t3, marginTop:3 }}>{fmtShort(safeNum(p.target))}</Text>
                  ) : (
                    <Text style={{ fontSize:10, color:p.color, marginTop:3 }}>Customize</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            // DETAILS FORM
            <View style={{ padding:SP.md }}>
              <Card style={{ marginBottom:12 }}>
                <SH title="Goal Details" />
                <Input label="Goal Name" value={name} onChange={setName} placeholder="e.g. Dream Home" />
                <Input label="Target Amount (₹)" value={target} onChange={setTarget}
                  type="numeric" prefix="₹" placeholder="e.g. 5000000" />
                <Input label="Duration (months)" value={duration} onChange={setDuration}
                  type="numeric" placeholder="e.g. 60 months" suffix="mo" />
                <Input label="Already Saved (₹)" value={saved} onChange={setSaved}
                  type="numeric" prefix="₹" placeholder="0 if starting fresh" />
              </Card>

              {/* Live preview */}
              {safeNum(target) > 0 && safeNum(duration) > 0 && (
                <Card style={{ marginBottom:16 }}>
                  <SH title="Your Goal Plan" />
                  <StatRow label="Target"           value={fmt(safeNum(target))} color={preset?.color||'#4F8CFF'} />
                  <StatRow label="Duration"         value={`${safeNum(duration)} months`} />
                  <StatRow label="Already saved"    value={fmt(safeNum(saved))} color="#22C55E" />
                  <StatRow label="Remaining"        value={fmt(Math.max(0, safeNum(target) - safeNum(saved)))} color="#EF4444" />
                  <StatRow label="Monthly required" value={fmt(monthlyReq)} color="#A78BFA" last />
                  <View style={{ marginTop:12 }}>
                    <Bar value={safeNum(saved)} total={Math.max(safeNum(target),1)} color={preset?.color||'#4F8CFF'} h={8} />
                    <Text style={{ fontSize:11, color:T.t3, marginTop:5 }}>
                      {safePct(safeNum(saved), safeNum(target))}% funded
                    </Text>
                  </View>
                </Card>
              )}

              <Btn label="✅ Add Goal" onPress={handleAdd} />
              <Pressable onPress={() => setStep(0)} style={{ marginTop:12, alignItems:'center' }}>
                <Text style={{ color:T.t3, fontSize:13 }}>← Back to presets</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Update Progress Modal ──────────────────────────────────
function UpdateModal({ goal, idx, visible, onClose, onUpdate }) {
  const { T }   = useTheme();
  const [add, setAdd]   = useState('');
  const [total, setTotal] = useState(String(goal?.saved || ''));

  const handleSave = () => {
    const newSaved = safeNum(total);
    if (newSaved < 0) { Alert.alert('Error', 'Amount cannot be negative'); return; }
    onUpdate(idx, { saved: newSaved });
    onClose();
  };

  if (!goal) return null;
  const pct = safePct(goal.saved, goal.target);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={st.overlay}>
        <View style={[st.updateModal, { backgroundColor: T.l1 }]}>
          <Text style={[st.modalTitle, { color:T.t1, marginBottom:4 }]}>{goal.icon} {goal.title}</Text>
          <Text style={{ color:T.t3, fontSize:13, marginBottom:16 }}>{pct}% complete · {fmt(goal.saved)} saved</Text>
          <Bar value={goal.saved} total={Math.max(goal.target,1)} color={goal.color||'#4F8CFF'} h={8} />
          <View style={{ height:16 }} />
          <Input label="Update Total Saved (₹)" value={total} onChange={setTotal}
            type="numeric" prefix="₹" placeholder={String(goal.saved)} />
          <View style={{ flexDirection:'row', gap:10, marginTop:8 }}>
            <Pressable onPress={onClose} style={[st.cancelBtn, { backgroundColor:T.l2 }]}>
              <Text style={{ color:T.t2, fontWeight:'600' }}>Cancel</Text>
            </Pressable>
            <View style={{ flex:1 }}><Btn label="Update Progress" onPress={handleSave} /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Goal Card ─────────────────────────────────────────────
const GoalCard = React.memo(({ goal, idx, onUpdate, onDelete }) => {
  const { T }   = useTheme();
  const [showUpdate, setShowUpdate] = useState(false);

  const pct      = safePct(goal.saved, goal.target);
  const remaining= Math.max(0, (goal.target||0) - (goal.saved||0));
  const mthLeft  = goal.deadline ? Math.max(1, Math.round((new Date(goal.deadline)-new Date())/1000/60/60/24/30)) : (goal.duration||12);
  const mthReq   = mthLeft > 0 ? Math.round(remaining / mthLeft) : 0;
  const statusClr= STATUS_COLOR(pct);
  const isComplete = pct >= 100;

  // Insight for this goal
  const insight = useMemo(() => {
    if (isComplete) return { icon:'🎉', msg:'Goal achieved! Time to celebrate and set the next one.', color:'#22C55E' };
    if (pct >= 80)  return { icon:'🔥', msg:`Almost there! Need ${fmt(mthReq)}/mo for ${mthLeft} months.`, color:'#22C55E' };
    if (mthReq > (goal.monthlyContrib||0) * 1.5)
      return { icon:'⚠️', msg:`Behind schedule. Increase contribution to ${fmt(mthReq)}/mo.`, color:'#EF4444' };
    return { icon:'📈', msg:`On track — ${fmt(mthReq)}/mo will reach your goal in ${mthLeft} months.`, color:'#4F8CFF' };
  }, [pct, mthReq, mthLeft, isComplete]);

  return (
    <>
      <Card style={{ marginBottom:12 }} glow={isComplete}>
        {/* Header */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
            <View style={[st.goalIcon, { backgroundColor: (goal.color||'#4F8CFF') + '22' }]}>
              <Text style={{ fontSize:22 }}>{goal.icon||'🎯'}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:16, fontWeight:'700', color:T.t1 }} numberOfLines={1}>{goal.title}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:3 }}>
                <Chip label={STATUS_LABEL(pct)} color={statusClr} sm />
                {isComplete && <Chip label="✓ Done" color="#22C55E" sm />}
              </View>
            </View>
          </View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={{ fontSize:22, fontWeight:'800', color:statusClr }}>{pct}%</Text>
            <Text style={{ fontSize:10, color:T.t3, marginTop:1 }}>{mthLeft} mo left</Text>
          </View>
        </View>

        {/* Progress bar */}
        <Bar value={goal.saved||0} total={Math.max(goal.target||1,1)} color={goal.color||'#4F8CFF'} h={10} />

        {/* Amounts row */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8, marginBottom:14 }}>
          <View>
            <Text style={{ fontSize:10, color:T.t3 }}>Saved</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:'#22C55E' }}>{fmt(goal.saved||0)}</Text>
          </View>
          <View style={{ alignItems:'center' }}>
            <Text style={{ fontSize:10, color:T.t3 }}>Remaining</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:'#EF4444' }}>{fmt(remaining)}</Text>
          </View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={{ fontSize:10, color:T.t3 }}>Target</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:goal.color||'#4F8CFF' }}>{fmt(goal.target||0)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:12, paddingTop:10, borderTopWidth:1, borderTopColor:T.border }}>
          <View>
            <Text style={{ fontSize:10, color:T.t3 }}>Required/mo</Text>
            <Text style={{ fontSize:13, fontWeight:'700', color:'#A78BFA' }}>{fmt(mthReq)}</Text>
          </View>
          <View>
            <Text style={{ fontSize:10, color:T.t3 }}>Planned/mo</Text>
            <Text style={{ fontSize:13, fontWeight:'700', color:T.t1 }}>{fmt(goal.monthlyContrib||0)}</Text>
          </View>
          <View>
            <Text style={{ fontSize:10, color:T.t3 }}>Time left</Text>
            <Text style={{ fontSize:13, fontWeight:'700', color:T.t1 }}>{mthLeft} months</Text>
          </View>
        </View>

        {/* Insight */}
        <AlertRow icon={insight.icon} msg={insight.msg} color={insight.color} last />

        {/* Actions */}
        <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
          <Pressable onPress={() => setShowUpdate(true)}
            style={[st.actionBtn, { backgroundColor: (goal.color||'#4F8CFF')+'22', borderColor: (goal.color||'#4F8CFF')+'40' }]}>
            <Text style={{ fontSize:12, fontWeight:'600', color: goal.color||'#4F8CFF' }}>📝 Update Progress</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
            { text:'Cancel' },
            { text:'Delete', style:'destructive', onPress: () => onDelete(idx) },
          ])} style={[st.actionBtn, { backgroundColor:'#EF444412', borderColor:'#EF444428' }]}>
            <Text style={{ fontSize:12, fontWeight:'600', color:'#EF4444' }}>🗑️ Remove</Text>
          </Pressable>
        </View>
      </Card>

      <UpdateModal
        goal={goal} idx={idx}
        visible={showUpdate}
        onClose={() => setShowUpdate(false)}
        onUpdate={onUpdate}
      />
    </>
  );
});

// ── Summary Header ────────────────────────────────────────
function GoalsSummary({ goals }) {
  const { T } = useTheme();
  const totalTarget = goals.reduce((a, g) => a + (g.target||0), 0);
  const totalSaved  = goals.reduce((a, g) => a + (g.saved||0), 0);
  const completed   = goals.filter(g => safePct(g.saved, g.target) >= 100).length;
  const overall     = safePct(totalSaved, totalTarget);

  if (goals.length === 0) return null;
  return (
    <GCard colors={['#0c1a4e','#1a3080']} style={{ marginHorizontal:SP.md, marginBottom:12 }}>
      <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>
        Goals Overview
      </Text>
      <View style={{ flexDirection:'row', gap:24, marginBottom:14 }}>
        <View>
          <Text style={{ fontSize:28, fontWeight:'800', color:'#fff' }}>{goals.length}</Text>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Total Goals</Text>
        </View>
        <View>
          <Text style={{ fontSize:28, fontWeight:'800', color:'#86efac' }}>{completed}</Text>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Achieved</Text>
        </View>
        <View>
          <Text style={{ fontSize:28, fontWeight:'800', color:'#c4b5fd' }}>{overall}%</Text>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Overall</Text>
        </View>
      </View>
      <Bar value={totalSaved} total={Math.max(totalTarget,1)} color="#4F8CFF" h={7} />
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}>
        <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Saved: {fmtShort(totalSaved)}</Text>
        <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Target: {fmtShort(totalTarget)}</Text>
      </View>
    </GCard>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────
export default function GoalsScreen() {
  const { state: s, dispatch } = useApp();
  const { T } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [filterDone, setFilterDone] = useState(false);

  const goals = s.goals || [];
  const filtered = filterDone ? goals.filter(g => safePct(g.saved, g.target) >= 100) : goals;

  const addGoal   = useCallback((goal)       => dispatch({ type:'ADD_GOAL',  goal }),  [dispatch]);
  const updGoal   = useCallback((idx, patch) => dispatch({ type:'UPD_GOAL',  idx, patch }), [dispatch]);
  const delGoal   = useCallback((idx)        => dispatch({ type:'DEL_GOAL',  idx }),   [dispatch]);

  // Overall insights
  const insights = useMemo(() => {
    if (goals.length === 0) return [];
    const msgs = [];
    const behind = goals.filter(g => {
      const pct = safePct(g.saved, g.target);
      const mth = g.duration || 12;
      const mthDone = Math.round((1 - pct/100) * mth);
      return pct < 50 && mthDone < mth * 0.3;
    });
    if (behind.length > 0)
      msgs.push({ icon:'⚠️', msg:`${behind.length} goal${behind.length>1?'s are':' is'} behind schedule. Consider increasing monthly contributions.`, color:'#EF4444' });
    const near = goals.filter(g => { const p = safePct(g.saved, g.target); return p >= 80 && p < 100; });
    if (near.length > 0)
      msgs.push({ icon:'🔥', msg:`${near.length} goal${near.length>1?'s are':' is'} 80%+ done — final push needed!`, color:'#22C55E' });
    if (goals.length >= 3)
      msgs.push({ icon:'💡', msg:'Pro tip: Prioritise goals by urgency. Link SIPs to your nearest deadline goals.', color:'#4F8CFF' });
    return msgs;
  }, [goals]);

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom:100 }}>
      {/* HEADER */}
      <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
        <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Goal Planner</Text>
        <Text style={{ fontSize:13, color:T.t3, marginTop:2 }}>Track every financial milestone</Text>
      </View>

      {/* SUMMARY */}
      <GoalsSummary goals={goals} />

      {/* OVERALL INSIGHTS */}
      {insights.length > 0 && (
        <View style={{ marginHorizontal:SP.md, marginBottom:12 }}>
          <Card>
            <SH title="💡 Goal Insights" />
            {insights.map((ins, i) => (
              <AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i===insights.length-1} />
            ))}
          </Card>
        </View>
      )}

      {/* FILTER + ADD */}
      <View style={{ flexDirection:'row', gap:10, marginHorizontal:SP.md, marginBottom:12, alignItems:'center' }}>
        <Pressable onPress={() => setFilterDone(!filterDone)}
          style={[st.filterBtn, { backgroundColor: filterDone?'#22C55E22':T.l2, borderColor: filterDone?'#22C55E44':T.border }]}>
          <Text style={{ fontSize:12, color: filterDone?'#22C55E':T.t3, fontWeight:'600' }}>
            {filterDone ? '✓ Achieved' : 'All Goals'}
          </Text>
        </Pressable>
        <View style={{ flex:1 }}>
          <Btn label="+ Add Goal" onPress={() => setShowAdd(true)} />
        </View>
      </View>

      {/* GOALS LIST */}
      {filtered.length === 0 ? (
        <View style={{ marginHorizontal:SP.md }}>
          <Card>
            <Empty icon="🎯" title={filterDone ? 'No completed goals yet' : 'No goals yet'}
              sub={filterDone ? 'Keep working on your goals!' : 'Add your first financial goal — house, car, travel or anything you dream of.'}
              cta={filterDone ? undefined : '+ Add First Goal'} onCta={() => setShowAdd(true)} />
          </Card>
        </View>
      ) : (
        <View style={{ paddingHorizontal:SP.md }}>
          {filtered.map((goal, i) => (
            <GoalCard key={goal.id||i} goal={goal} idx={goals.indexOf(goal)}
              onUpdate={updGoal} onDelete={delGoal} />
          ))}
        </View>
      )}

      <AddGoalModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addGoal} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  modal:       { flex:1 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:SP.md, paddingTop:SP.lg },
  modalTitle:  { fontSize:22, fontWeight:'800' },
  closeBtn:    { width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center' },
  presetCard:  { width:'47%', borderRadius:14, padding:14, alignItems:'center', gap:2 },
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding:SP.lg },
  updateModal: { width:'100%', borderRadius:20, padding:SP.lg },
  cancelBtn:   { flex:1, borderRadius:12, paddingVertical:14, alignItems:'center', justifyContent:'center' },
  goalIcon:    { width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center' },
  actionBtn:   { flex:1, borderRadius:11, paddingVertical:9, alignItems:'center', borderWidth:1 },
  filterBtn:   { paddingHorizontal:14, paddingVertical:9, borderRadius:11, borderWidth:1 },
});
