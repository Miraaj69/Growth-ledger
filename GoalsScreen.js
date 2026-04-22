// GoalsScreen.js v2 — Premium Goal-Based Investing System
import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import {
  ScrollView, View, Text, Pressable, StyleSheet,
  Alert, Modal, Platform, Animated, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R, SHADOW as SDW } from './theme';
import { Bar, Chip, Btn, Empty } from './UI';
import { fmt, fmtShort, safeNum, safePct } from './helpers';

const { width: SW } = Dimensions.get('window');
const tap  = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);  } catch {} };
const tapM = () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} };

const BLUE = '#3B82F6'; const GREEN = '#22C55E'; const AMBER = '#F59E0B';
const RED = '#EF4444'; const PURPLE = '#A78BFA'; const TEAL = '#14B8A6'; const PINK = '#EC4899';

const GOAL_PRESETS = [
  { key:'house',     icon:'🏠', label:'House',     defaultTarget:5000000,  defaultYears:10, color:BLUE,   tip:'Equity SIP (12%) — ideal for 10+ yr goals' },
  { key:'car',       icon:'🚗', label:'Car',       defaultTarget:1000000,  defaultYears:5,  color:GREEN,  tip:'Hybrid fund (10%) — 5 yr horizon' },
  { key:'retirement',icon:'👴', label:'Retirement',defaultTarget:50000000, defaultYears:30, color:TEAL,   tip:'Start early — compounding does the magic!' },
  { key:'education', icon:'🎓', label:'Education', defaultTarget:2000000,  defaultYears:8,  color:AMBER,  tip:'Child education fund — equity + debt mix' },
  { key:'travel',    icon:'✈️', label:'Travel',    defaultTarget:300000,   defaultYears:3,  color:PURPLE, tip:'Short term — liquid / RD works well' },
  { key:'wedding',   icon:'💍', label:'Wedding',   defaultTarget:1500000,  defaultYears:4,  color:PINK,   tip:'Balanced fund (8%) — 3-5 yr' },
  { key:'emergency', icon:'🛟', label:'Emergency', defaultTarget:300000,   defaultYears:1,  color:RED,    tip:'Keep in liquid fund — no lock-in' },
  { key:'custom',    icon:'🎯', label:'Custom',    defaultTarget:0,        defaultYears:5,  color:BLUE,   tip:'Define your own dream goal' },
];

// ── Calculation Engine ──────────────────────────────────
function recommendedReturn(years) {
  if (years >= 10) return 12;
  if (years >= 5)  return 10;
  if (years >= 3)  return 8;
  return 6;
}
function recommendedStrategy(years) {
  if (years >= 10) return 'Equity SIP (Nifty 50)';
  if (years >= 5)  return 'Hybrid Fund';
  if (years >= 3)  return 'Balanced Advantage';
  return 'Liquid / Debt Fund';
}
function calcSIPRequired(target, currentSaved, months, annualReturn) {
  const t = safeNum(target), s = safeNum(currentSaved), n = Math.max(1, safeNum(months));
  const r = safeNum(annualReturn || recommendedReturn(n / 12)) / 100 / 12;
  const fvSaved = r > 0 ? s * Math.pow(1 + r, n) : s;
  const gap = Math.max(0, t - fvSaved);
  if (gap <= 0) return 0;
  if (r <= 0) return Math.ceil(gap / n);
  return Math.max(0, Math.ceil(gap * r / ((Math.pow(1 + r, n) - 1) * (1 + r))));
}
function calcSIPFutureValue(monthlySIP, months, annualReturn) {
  const p = safeNum(monthlySIP), n = Math.max(1, safeNum(months));
  const r = safeNum(annualReturn) / 100 / 12;
  if (r <= 0) return p * n;
  return Math.round(p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}
function buildGrowthData(sip, savedLump, months, annualReturn) {
  const r = safeNum(annualReturn) / 100 / 12;
  const p = safeNum(sip), s = safeNum(savedLump), n = Math.max(1, safeNum(months));
  const totalYrs = Math.ceil(n / 12);
  const step = Math.max(1, Math.floor(totalYrs / 8));
  const points = [];
  for (let yr = 0; yr <= totalYrs; yr += step) {
    const mo = yr * 12;
    const fvLump = r > 0 ? s * Math.pow(1 + r, mo) : s;
    const fvSIP  = r > 0 ? p * ((Math.pow(1 + r, mo) - 1) / r) * (1 + r) : p * mo;
    points.push({ year: yr, corpus: Math.round(fvLump + fvSIP), invested: Math.round(s + p * mo) });
    if (yr + step > totalYrs && yr < totalYrs) {
      const moL = totalYrs * 12;
      const fvLL = r > 0 ? s * Math.pow(1 + r, moL) : s;
      const fvSL = r > 0 ? p * ((Math.pow(1 + r, moL) - 1) / r) * (1 + r) : p * moL;
      points.push({ year: totalYrs, corpus: Math.round(fvLL + fvSL), invested: Math.round(s + p * moL) });
      break;
    }
  }
  return points;
}
function buildInsights(goal) {
  const insights = [];
  const months = safeNum(goal.years) * 12;
  const sip = safeNum(goal.sip), target = safeNum(goal.target), saved = safeNum(goal.saved);
  const ret = safeNum(goal.returnRate) || recommendedReturn(safeNum(goal.years));
  if (!sip || !target) return insights;
  const extraSIP = Math.round(sip * 0.2);
  const r = ret / 100 / 12;
  const fvLump = saved * Math.pow(1 + r, months);
  const gap = Math.max(0, target - fvLump);
  if (gap > 0 && r > 0) {
    const newMonths = Math.ceil(Math.log(1 + (gap * r) / ((sip + extraSIP) * (1 + r))) / Math.log(1 + r));
    const savedM = Math.max(0, months - newMonths);
    if (savedM >= 2) insights.push({ icon:'⚡', color:BLUE, title:`Increase SIP by ${fmtShort(extraSIP)}/mo`, desc:`Reach goal ${savedM} months earlier!` });
  }
  const extSIP = calcSIPRequired(target, saved, months + 12, ret);
  if (sip - extSIP > 500) insights.push({ icon:'💡', color:AMBER, title:`Extend by 1 year → save ${fmtShort(sip - extSIP)}/mo`, desc:`SIP drops from ${fmtShort(sip)} to ${fmtShort(extSIP)}/mo` });
  const lumpSum = Math.round(target * 0.1);
  const sipWithLump = calcSIPRequired(target, saved + lumpSum, months, ret);
  if (sip - sipWithLump > 500) insights.push({ icon:'💰', color:GREEN, title:`Invest ${fmtShort(lumpSum)} lump sum now`, desc:`Monthly SIP reduces by ${fmtShort(sip - sipWithLump)}/mo` });
  return insights;
}

// ── Growth Chart ────────────────────────────────────────
const GrowthChart = memo(({ goal, T }) => {
  const ret = safeNum(goal.returnRate) || recommendedReturn(safeNum(goal.years));
  const data = useMemo(() => buildGrowthData(safeNum(goal.sip), safeNum(goal.saved), safeNum(goal.years) * 12, ret), [goal.sip, goal.saved, goal.years, ret]);
  if (data.length < 2) return null;
  const CHART_H = 90, CHART_W = SW - 96;
  const maxVal = Math.max(...data.map(d => d.corpus), 1);
  const color = goal.color || BLUE;
  const pts = data.map((d, i) => ({ x: i / (data.length - 1) * CHART_W, y: CHART_H - (d.corpus / maxVal) * CHART_H }));
  const inv = data.map((d, i) => ({ x: i / (data.length - 1) * CHART_W, y: CHART_H - (d.invested / maxVal) * CHART_H }));
  const last = data[data.length - 1];
  return (
    <View style={GS.chartWrap}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
        <Text style={{ fontSize:13, fontWeight:'700', color:T.t1 }}>Growth Projection</Text>
        <View style={{ flexDirection:'row', gap:10 }}>
          {[[color,'Corpus'],[T.t3,'Invested']].map(([c,l],i) => (
            <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <View style={{ width:8, height:8, borderRadius:4, backgroundColor:c }} />
              <Text style={{ fontSize:9, color:T.t3 }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height:CHART_H + 20 }}>
        <View style={{ width:CHART_W, height:CHART_H, position:'relative', marginLeft:4 }}>
          {[0,0.25,0.5,0.75,1].map((f,i) => (
            <View key={i} style={{ position:'absolute', left:0, right:0, top:f*CHART_H, height:1, backgroundColor:T.border }} />
          ))}
          {inv.map((pt,i) => {
            if (i === inv.length-1) return null;
            const nx=inv[i+1], sw=nx.x-pt.x, sh=nx.y-pt.y, len=Math.sqrt(sw*sw+sh*sh), ang=Math.atan2(sh,sw)*180/Math.PI;
            return <View key={i} style={{ position:'absolute', left:pt.x, top:pt.y, width:len, height:1.5, backgroundColor:T.t3, opacity:0.4, transform:[{rotate:`${ang}deg`}], transformOrigin:'left center' }} />;
          })}
          {pts.map((pt,i) => {
            if (i === pts.length-1) return null;
            const nx=pts[i+1], sw=nx.x-pt.x, sh=nx.y-pt.y, len=Math.sqrt(sw*sw+sh*sh), ang=Math.atan2(sh,sw)*180/Math.PI;
            return <View key={i} style={{ position:'absolute', left:pt.x, top:pt.y, width:len, height:2.5, backgroundColor:color, borderRadius:2, transform:[{rotate:`${ang}deg`}], transformOrigin:'left center' }} />;
          })}
          {pts.map((pt,i) => (
            <View key={i} style={{ position:'absolute', left:pt.x-3.5, top:pt.y-3.5, width:7, height:7, borderRadius:3.5, backgroundColor:color, borderWidth:1.5, borderColor:T.l1 }} />
          ))}
          <View style={{ position:'absolute', right:0, top:Math.max(0, pts[pts.length-1].y-20), backgroundColor:color+'25', borderRadius:6, paddingHorizontal:5, paddingVertical:1, borderWidth:1, borderColor:color+'50' }}>
            <Text style={{ fontSize:9, fontWeight:'800', color }}>{fmtShort(last.corpus)}</Text>
          </View>
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:4, marginLeft:4, width:CHART_W }}>
          {data.filter((_,i) => i===0||i===Math.floor(data.length/2)||i===data.length-1).map((d,i) => (
            <Text key={i} style={{ fontSize:9, color:T.t3 }}>{d.year===0?'Now':`Yr ${d.year}`}</Text>
          ))}
        </View>
      </View>
      <View style={[GS.chartFooter, { borderColor:T.border }]}>
        {[['Invested',fmtShort(last.invested),T.t1],['Corpus',fmtShort(last.corpus),color],['Gains','+'+fmtShort(Math.max(0,last.corpus-last.invested)),GREEN]].map(([l,v,c],i) => (
          <React.Fragment key={i}>
            {i>0 && <View style={{ width:1, height:24, backgroundColor:T.border }} />}
            <View style={{ flex:1, alignItems:'center' }}>
              <Text style={{ fontSize:10, color:T.t3, marginBottom:2 }}>{l}</Text>
              <Text style={{ fontSize:13, fontWeight:'700', color:c }}>{v}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
});

// ── Update Savings Modal ─────────────────────────────────
const UpdateModal = memo(({ goal, visible, onClose, onUpdate, T }) => {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('set');
  const color = goal?.color || BLUE;
  useEffect(() => { if (visible) setAmount(String(safeNum(goal?.saved))); }, [visible, goal]);
  const computed = useMemo(() => mode === 'set' ? safeNum(amount) : safeNum(goal?.saved) + safeNum(amount), [amount, mode, goal]);
  const handleSave = () => { if (computed < 0) return; onUpdate(computed); onClose(); setAmount(''); };
  if (!goal) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={GS.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} activeOpacity={1}>
          <View style={[GS.updateSheet, { backgroundColor:T.l1 }]}>
            <View style={GS.handle} />
            <Text style={[GS.sheetTitle, { color:T.t1 }]}>{goal.icon} {goal.title}</Text>
            <Text style={[{ fontSize:12, color:T.t3, marginBottom:14 }]}>Saved: {fmt(safeNum(goal.saved))} · Target: {fmt(safeNum(goal.target))}</Text>
            <View style={[GS.modeToggle, { backgroundColor:T.l2 }]}>
              {[['set','Set Total'],['add','Add Amount']].map(([m,l]) => (
                <Pressable key={m} onPress={() => { tap(); setMode(m); setAmount(''); }}
                  style={[GS.modeBtn, mode===m && { backgroundColor:color }]}>
                  <Text style={{ fontSize:13, fontWeight:'700', color:mode===m?'#fff':T.t3 }}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[GS.updateInput, { backgroundColor:T.l2, borderColor:T.border }]}>
              <Text style={{ fontSize:18, color:T.t3, marginRight:8 }}>₹</Text>
              <TextInput value={amount} onChangeText={v=>setAmount(v.replace(/[^0-9]/g,''))} keyboardType="numeric"
                placeholder={String(safeNum(goal.saved))} placeholderTextColor={T.t3}
                style={{ flex:1, fontSize:24, fontWeight:'800', color:T.t1 }} autoFocus />
            </View>
            <View style={{ marginVertical:10 }}>
              <Bar value={computed} total={Math.max(safeNum(goal.target),1)} color={color} h={8} />
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:5 }}>
                <Text style={{ fontSize:11, color:T.t3 }}>New: {fmt(computed)}</Text>
                <Text style={{ fontSize:12, fontWeight:'700', color }}>{safePct(computed, safeNum(goal.target))}%</Text>
              </View>
            </View>
            <Pressable onPress={handleSave} style={[GS.saveBtn, { backgroundColor:color }]}>
              <Text style={{ fontSize:16, fontWeight:'800', color:'#fff' }}>Update Progress</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ── Goal Card ────────────────────────────────────────────
const GoalCard = memo(({ goal, idx, salary, onDelete, dispatch }) => {
  const { T } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const color   = goal.color || BLUE;
  const months  = safeNum(goal.years) * 12;
  const target  = safeNum(goal.target);
  const saved   = safeNum(goal.saved);
  const sip     = safeNum(goal.sip);
  const ret     = safeNum(goal.returnRate) || recommendedReturn(safeNum(goal.years));
  const pct     = safePct(saved, target);
  const remaining = Math.max(0, target - saved);
  const totalInvested = sip * months;
  const futureValue = useMemo(() => {
    const fvSIP  = calcSIPFutureValue(sip, months, ret);
    const fvLump = ret > 0 ? saved * Math.pow(1 + ret/100/12, months) : saved;
    return Math.round(fvSIP + fvLump);
  }, [sip, months, ret, saved]);
  const gains   = Math.max(0, futureValue - totalInvested - saved);
  const insights = useMemo(() => buildInsights(goal), [goal]);
  const statusColor = pct>=100?GREEN:pct>=75?TEAL:pct>=50?BLUE:pct>=25?AMBER:RED;
  const statusLabel = pct>=100?'🎉 Achieved!':pct>=75?'🔥 Almost there':pct>=50?'💪 Halfway':pct>=25?'📈 Building':'🌱 Just started';

  const toggle = useCallback(() => {
    tap();
    const next = !expanded;
    setExpanded(next);
    Animated.spring(expandAnim, { toValue:next?1:0, useNativeDriver:false, speed:20, bounciness:2 }).start();
  }, [expanded]);
  const onIn  = () => Animated.spring(scaleAnim, { toValue:0.978, useNativeDriver:true, speed:40 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue:1,     useNativeDriver:true, speed:28 }).start();

  return (
    <Animated.View style={{ transform:[{scale:scaleAnim}], marginBottom:14 }}>
      <Pressable onPress={toggle} onPressIn={onIn} onPressOut={onOut}
        onLongPress={() => { tapM(); Alert.alert(goal.title, 'Options', [
          { text:'Update Savings', onPress:() => setShowUpdate(true) },
          { text:'Delete Goal', style:'destructive', onPress:() => onDelete(idx) },
          { text:'Cancel', style:'cancel' },
        ]); }}
        style={[GS.goalCard, { backgroundColor:T.l1, borderColor:T.border }]}>

        {/* Header */}
        <View style={GS.cardHeader}>
          <LinearGradient colors={[color+'30', color+'10']} style={GS.iconWrap}>
            <Text style={{ fontSize:24 }}>{goal.icon||'🎯'}</Text>
          </LinearGradient>
          <View style={{ flex:1, marginLeft:12 }}>
            <Text style={[GS.goalTitle, { color:T.t1 }]} numberOfLines={1}>{goal.title}</Text>
            <View style={{ flexDirection:'row', gap:6, marginTop:3 }}>
              <View style={[GS.statusBadge, { backgroundColor:statusColor+'20' }]}>
                <Text style={[GS.statusText, { color:statusColor }]}>{statusLabel}</Text>
              </View>
              <View style={[GS.yearBadge, { backgroundColor:T.l2 }]}>
                <Text style={{ fontSize:9, color:T.t3, fontWeight:'700' }}>{safeNum(goal.years)}Y · {recommendedStrategy(safeNum(goal.years)).split(' ')[0]}</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={[GS.targetAmt, { color }]}>{fmtShort(target)}</Text>
            <Text style={[GS.targetLabel, { color:T.t3 }]}>target</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={{ marginTop:12, marginBottom:5 }}>
          <Bar value={saved} total={Math.max(target,1)} color={color} h={8} />
        </View>
        <View style={GS.progFooter}>
          <Text style={[GS.progText, { color:T.t3 }]}>{fmt(saved)} saved</Text>
          <Text style={[GS.progPct, { color }]}>{pct}% done</Text>
          <Text style={[GS.progText, { color:T.t3 }]}>{fmt(remaining)} to go</Text>
        </View>

        {/* Stats strip */}
        <View style={[GS.statsRow, { borderColor:T.border }]}>
          <View style={GS.statCell}>
            <Text style={[GS.statVal, { color:PURPLE }]}>{fmt(sip)}</Text>
            <Text style={[GS.statLbl, { color:T.t3 }]}>Monthly SIP</Text>
          </View>
          <View style={[GS.statCell, { borderLeftWidth:1, borderRightWidth:1, borderColor:T.border }]}>
            <Text style={[GS.statVal, { color:T.t1 }]}>{fmtShort(totalInvested)}</Text>
            <Text style={[GS.statLbl, { color:T.t3 }]}>Total Invest</Text>
          </View>
          <View style={GS.statCell}>
            <Text style={[GS.statVal, { color:GREEN }]}>{fmtShort(futureValue)}</Text>
            <Text style={[GS.statLbl, { color:T.t3 }]}>Final Value</Text>
          </View>
        </View>

        {/* Expand chevron */}
        <View style={GS.expandRow}>
          <Text style={[GS.expandText, { color:T.t3 }]}>{expanded?'Less detail':'Full analysis'}</Text>
          <Animated.Text style={{ color:T.t3, fontSize:14, transform:[{rotate:expandAnim.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}] }}>▾</Animated.Text>
        </View>

        {/* Expanded */}
        {expanded && (
          <View style={[GS.expandedWrap, { borderColor:T.border }]}>
            {/* Strategy rec */}
            <View style={[GS.stratBadge, { backgroundColor:color+'12', borderColor:color+'30' }]}>
              <Text style={{ fontSize:14 }}>📊</Text>
              <View style={{ flex:1, marginLeft:10 }}>
                <Text style={{ fontSize:12, fontWeight:'700', color }}>
                  {recommendedStrategy(safeNum(goal.years))} recommended
                </Text>
                <Text style={{ fontSize:11, color:T.t3, marginTop:1 }}>{goal.tip || `Expected ${ret}% p.a. return`}</Text>
              </View>
            </View>

            {/* Breakdown grid */}
            <View style={GS.breakGrid}>
              {[
                ['Target',        fmt(target),          color ],
                ['Duration',      `${safeNum(goal.years)} years`, T.t1  ],
                ['Current Saved', fmt(saved),            GREEN ],
                ['Return Rate',   `${ret}% p.a.`,        T.t1  ],
                ['Total Invest',  fmtShort(totalInvested), T.t1 ],
                ['Wealth Gains',  `+${fmtShort(gains)}`, GREEN ],
              ].map(([l,v,c],i) => (
                <View key={i} style={[GS.breakCell, { backgroundColor:T.l2, borderColor:T.border, width:'48%' }]}>
                  <Text style={{ fontSize:10, color:T.t3, marginBottom:3 }}>{l}</Text>
                  <Text style={{ fontSize:14, fontWeight:'800', color:c }}>{v}</Text>
                </View>
              ))}
            </View>

            {/* Growth chart */}
            <GrowthChart goal={goal} T={T} />

            {/* Smart insights */}
            {insights.length > 0 && (
              <View style={[GS.insightsBox, { backgroundColor:T.l2, borderColor:T.border }]}>
                <Text style={[GS.insightsTitle, { color:T.t1 }]}>💡 Smart Insights</Text>
                {insights.map((ins,i) => (
                  <View key={i} style={[GS.insightRow, { borderTopColor:T.border }]}>
                    <View style={[GS.insightIcon, { backgroundColor:ins.color+'18' }]}>
                      <Text style={{ fontSize:14 }}>{ins.icon}</Text>
                    </View>
                    <View style={{ flex:1, marginLeft:10 }}>
                      <Text style={{ fontSize:12, fontWeight:'700', color:ins.color }}>{ins.title}</Text>
                      <Text style={{ fontSize:11, color:T.t3, marginTop:1, lineHeight:15 }}>{ins.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={GS.actRow}>
              <Pressable onPress={() => { tap(); setShowUpdate(true); }}
                style={[GS.actBtn, { backgroundColor:color+'18', borderColor:color+'35' }]}>
                <Text style={{ fontSize:13 }}>📝</Text>
                <Text style={[GS.actLabel, { color }]}>Update Savings</Text>
              </Pressable>
              <Pressable onPress={() => Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
                { text:'Cancel', style:'cancel' },
                { text:'Delete', style:'destructive', onPress:() => onDelete(idx) },
              ])} style={[GS.actBtn, { backgroundColor:RED+'12', borderColor:RED+'28' }]}>
                <Text style={{ fontSize:13 }}>🗑️</Text>
                <Text style={[GS.actLabel, { color:RED }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>

      <UpdateModal goal={goal} visible={showUpdate} onClose={() => setShowUpdate(false)}
        onUpdate={(v) => dispatch({ type:'UPD_GOAL', idx, patch:{ saved:v } })} T={T} />
    </Animated.View>
  );
});

// ── Add Goal Modal ───────────────────────────────────────
const INIT_FORM = { title:'', type:'custom', icon:'🎯', color:BLUE, target:'', years:'', saved:'', returnRate:'', tip:'' };

const AddGoalModal = memo(({ visible, onClose, onAdd, T }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT_FORM);
  const [errs, setErrs] = useState({});

  const reset = useCallback(() => { setStep(0); setForm(INIT_FORM); setErrs({}); }, []);
  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrs(e => ({...e,[k]:''})); };

  const selectPreset = (p) => {
    tap();
    setForm({ title:p.key==='custom'?'':p.label, type:p.key, icon:p.icon, color:p.color,
      target:p.defaultTarget>0?String(p.defaultTarget):'', years:String(p.defaultYears),
      saved:'', returnRate:String(recommendedReturn(p.defaultYears)), tip:p.tip });
    setStep(1);
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Enter goal name';
    if (!form.target || Number(form.target)<=0) e.target = 'Enter target amount';
    if (!form.years || Number(form.years)<=0)   e.years  = 'Enter time in years';
    setErrs(e); return Object.keys(e).length===0;
  };

  const computed = useMemo(() => {
    const t=safeNum(form.target), m=safeNum(form.years)*12, s=safeNum(form.saved), ret=safeNum(form.returnRate)||recommendedReturn(safeNum(form.years));
    const sip = calcSIPRequired(t, s, m, ret);
    const fv  = calcSIPFutureValue(sip, m, ret) + (s>0 ? s*Math.pow(1+ret/100/12,m) : 0);
    const inv = sip * m;
    return { sip, fv:Math.round(fv), invested:inv, ret, gains:Math.max(0,Math.round(fv)-inv-s) };
  }, [form.target, form.years, form.saved, form.returnRate]);

  const handleAdd = () => {
    tapM();
    onAdd({ title:form.title.trim(), type:form.type, icon:form.icon, color:form.color,
      target:safeNum(form.target), years:safeNum(form.years), saved:safeNum(form.saved),
      returnRate:safeNum(form.returnRate)||computed.ret, sip:computed.sip, tip:form.tip,
      createdAt:new Date().toISOString() });
    reset(); onClose();
  };

  const STEPS = ['Type','Details','Preview'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <Pressable style={GS.overlay} onPress={() => { reset(); onClose(); }}>
        <Pressable onPress={() => {}} activeOpacity={1}>
          <View style={[GS.addSheet, { backgroundColor:T.l1 }]}>
            <View style={GS.handle} />
            <View style={GS.addTitleRow}>
              <Text style={[GS.sheetTitle, { color:T.t1 }]}>Add New Goal</Text>
              <Pressable onPress={() => { reset(); onClose(); }} style={[GS.closeBtn, { backgroundColor:T.l2 }]}>
                <Text style={{ fontSize:16, color:T.t2 }}>✕</Text>
              </Pressable>
            </View>

            {/* Step indicator */}
            {step > 0 && (
              <View style={GS.stepRow}>
                {STEPS.map((s,i) => (
                  <React.Fragment key={i}>
                    <View style={{ alignItems:'center' }}>
                      <View style={[GS.stepDot, { backgroundColor:i<=step?BLUE:T.l2, borderColor:i<=step?BLUE:T.border }]}>
                        <Text style={{ fontSize:11, color:i<=step?'#fff':T.t3, fontWeight:'700' }}>{i<step?'✓':i+1}</Text>
                      </View>
                      <Text style={{ fontSize:9, color:i===step?BLUE:T.t3, marginTop:3 }}>{s}</Text>
                    </View>
                    {i < STEPS.length-1 && <View style={[GS.stepLine, { backgroundColor:i<step?BLUE:T.border }]} />}
                  </React.Fragment>
                ))}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* STEP 0: Type selection */}
              {step===0 && (
                <View style={{ padding:4 }}>
                  <Text style={[GS.stepHint, { color:T.t3 }]}>What are you saving for?</Text>
                  <View style={GS.presetGrid}>
                    {GOAL_PRESETS.map((p,i) => (
                      <Pressable key={i} onPress={() => selectPreset(p)}
                        style={[GS.presetCard, { backgroundColor:T.l2, borderColor:p.color+'35' }]}>
                        <LinearGradient colors={[p.color+'28',p.color+'08']} style={GS.presetIconWrap}>
                          <Text style={{ fontSize:24 }}>{p.icon}</Text>
                        </LinearGradient>
                        <Text style={[GS.presetLabel, { color:T.t1 }]}>{p.label}</Text>
                        {p.defaultTarget>0 && <Text style={[GS.presetHint, { color:T.t3 }]}>~{fmtShort(p.defaultTarget)}</Text>}
                        <Text style={[GS.presetYears, { color:p.color }]}>{p.defaultYears}Y</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* STEP 1: Details */}
              {step===1 && (
                <View style={GS.stepContent}>
                  <Text style={[GS.fieldLabel, { color:T.t3 }]}>Goal Name</Text>
                  <View style={[GS.fieldInput, { backgroundColor:T.l2, borderColor:errs.title?RED:T.border }]}>
                    <Text style={{ fontSize:18, marginRight:8 }}>{form.icon}</Text>
                    <TextInput value={form.title} onChangeText={v=>set('title',v)}
                      placeholder="e.g. Dream Home" placeholderTextColor={T.t3}
                      style={{ flex:1, fontSize:16, color:T.t1 }} />
                  </View>
                  {errs.title && <Text style={GS.fieldErr}>{errs.title}</Text>}

                  <View style={GS.fieldRow}>
                    <View style={{ flex:1 }}>
                      <Text style={[GS.fieldLabel, { color:T.t3 }]}>Target Amount (₹)</Text>
                      <View style={[GS.fieldInput, { backgroundColor:T.l2, borderColor:errs.target?RED:T.border }]}>
                        <TextInput value={form.target} onChangeText={v=>set('target',v.replace(/[^0-9]/g,''))}
                          keyboardType="numeric" placeholder="50,00,000" placeholderTextColor={T.t3}
                          style={{ fontSize:16, fontWeight:'700', color:T.t1 }} />
                      </View>
                      {errs.target && <Text style={GS.fieldErr}>{errs.target}</Text>}
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={[GS.fieldLabel, { color:T.t3 }]}>Time (Years)</Text>
                      <View style={[GS.fieldInput, { backgroundColor:T.l2, borderColor:errs.years?RED:T.border }]}>
                        <TextInput value={form.years} onChangeText={v=>{ set('years',v.replace(/[^0-9]/g,'')); const yrs=Number(v); if(yrs>0) set('returnRate',String(recommendedReturn(yrs))); }}
                          keyboardType="numeric" placeholder="10" placeholderTextColor={T.t3}
                          style={{ fontSize:16, fontWeight:'700', color:T.t1 }} />
                      </View>
                      {errs.years && <Text style={GS.fieldErr}>{errs.years}</Text>}
                    </View>
                  </View>

                  <View style={GS.fieldRow}>
                    <View style={{ flex:1 }}>
                      <Text style={[GS.fieldLabel, { color:T.t3 }]}>Current Savings (₹)</Text>
                      <View style={[GS.fieldInput, { backgroundColor:T.l2, borderColor:T.border }]}>
                        <TextInput value={form.saved} onChangeText={v=>set('saved',v.replace(/[^0-9]/g,''))}
                          keyboardType="numeric" placeholder="0" placeholderTextColor={T.t3}
                          style={{ fontSize:16, fontWeight:'700', color:T.t1 }} />
                      </View>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={[GS.fieldLabel, { color:T.t3 }]}>Expected Return (%)</Text>
                      <View style={[GS.fieldInput, { backgroundColor:T.l2, borderColor:T.border }]}>
                        <TextInput value={form.returnRate} onChangeText={v=>set('returnRate',v.replace(/[^0-9.]/g,''))}
                          keyboardType="numeric" placeholder={String(recommendedReturn(safeNum(form.years)))} placeholderTextColor={T.t3}
                          style={{ fontSize:16, fontWeight:'700', color:T.t1 }} />
                      </View>
                    </View>
                  </View>

                  <View style={[GS.stratBadge, { backgroundColor:form.color+'12', borderColor:form.color+'30' }]}>
                    <Text style={{ fontSize:14 }}>📊</Text>
                    <View style={{ flex:1, marginLeft:10 }}>
                      <Text style={{ fontSize:12, fontWeight:'700', color:form.color }}>{recommendedStrategy(safeNum(form.years))} recommended</Text>
                      <Text style={{ fontSize:11, color:T.t3 }}>{form.tip||'Based on your time horizon'}</Text>
                    </View>
                  </View>

                  {safeNum(form.target)>0 && safeNum(form.years)>0 && (
                    <View style={[GS.livePreview, { backgroundColor:PURPLE+'12', borderColor:PURPLE+'30' }]}>
                      <Text style={{ fontSize:12, fontWeight:'700', color:PURPLE, marginBottom:8 }}>⚡ Live Calculation</Text>
                      <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                        <View>
                          <Text style={{ fontSize:10, color:T.t3 }}>Monthly SIP</Text>
                          <Text style={{ fontSize:22, fontWeight:'800', color:PURPLE }}>{fmt(computed.sip)}</Text>
                        </View>
                        <View style={{ alignItems:'center' }}>
                          <Text style={{ fontSize:10, color:T.t3 }}>Total Invested</Text>
                          <Text style={{ fontSize:16, fontWeight:'700', color:T.t1 }}>{fmtShort(computed.invested)}</Text>
                        </View>
                        <View style={{ alignItems:'flex-end' }}>
                          <Text style={{ fontSize:10, color:T.t3 }}>Final Corpus</Text>
                          <Text style={{ fontSize:16, fontWeight:'700', color:GREEN }}>{fmtShort(computed.fv)}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* STEP 2: Preview */}
              {step===2 && (
                <View style={GS.stepContent}>
                  <View style={[GS.prevCard, { backgroundColor:T.l2, borderColor:T.border }]}>
                    <LinearGradient colors={[form.color+'25',form.color+'08']} style={GS.prevHeader}>
                      <Text style={{ fontSize:30 }}>{form.icon}</Text>
                      <View style={{ marginLeft:14, flex:1 }}>
                        <Text style={{ fontSize:18, fontWeight:'800', color:T.t1 }}>{form.title}</Text>
                        <Text style={{ fontSize:11, color:T.t3 }}>{recommendedStrategy(safeNum(form.years))} · {computed.ret}% p.a.</Text>
                      </View>
                      <View style={{ alignItems:'flex-end' }}>
                        <Text style={{ fontSize:20, fontWeight:'800', color:form.color }}>{fmtShort(safeNum(form.target))}</Text>
                        <Text style={{ fontSize:9, color:T.t3 }}>target</Text>
                      </View>
                    </LinearGradient>
                    {[
                      ['Goal Duration',    `${form.years} years`,              T.t1   ],
                      ['Current Savings',  fmt(safeNum(form.saved)),            GREEN  ],
                      ['Monthly SIP',      fmt(computed.sip),                   PURPLE ],
                      ['Total Invested',   fmtShort(computed.invested),         T.t1   ],
                      ['Expected Corpus',  fmtShort(computed.fv),               GREEN  ],
                      ['Wealth Gains',     `+${fmtShort(computed.gains)}`,      GREEN  ],
                    ].map(([l,v,c],i) => (
                      <View key={i} style={[GS.prevRow, { borderBottomColor:T.border }]}>
                        <Text style={{ fontSize:13, color:T.t3 }}>{l}</Text>
                        <Text style={{ fontSize:14, fontWeight:'700', color:c }}>{v}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[GS.livePreview, { backgroundColor:AMBER+'12', borderColor:AMBER+'30' }]}>
                    <Text style={{ fontSize:12, color:AMBER, lineHeight:18 }}>
                      💡 Start {fmt(computed.sip)}/month SIP → grows to{' '}
                      <Text style={{ fontWeight:'800' }}>{fmtShort(computed.fv)}</Text> in {form.years} years
                      — that is <Text style={{ fontWeight:'800' }}>+{fmtShort(computed.gains)}</Text> in wealth gains!
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            {step > 0 && (
              <View style={GS.addFooter}>
                <Pressable onPress={() => setStep(s=>s-1)} style={[GS.backBtn, { borderColor:T.border }]}>
                  <Text style={{ color:T.t2, fontWeight:'700' }}>← Back</Text>
                </Pressable>
                <Pressable onPress={() => { if(step===1){ if(!validateStep1()) return; setStep(2); } else handleAdd(); }}
                  style={{ flex:2, borderRadius:14, overflow:'hidden' }}>
                  <LinearGradient colors={[form.color, form.color+'CC']} style={GS.nextGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Text style={GS.nextText}>{step===1?'Preview Goal →':'✅ Create Goal'}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ── Total SIP Summary ───────────────────────────────────
const SIPSummary = memo(({ goals, salary, T }) => {
  const totalSIP    = goals.reduce((s,g) => s+safeNum(g.sip), 0);
  const totalTarget = goals.reduce((s,g) => s+safeNum(g.target), 0);
  const totalSaved  = goals.reduce((s,g) => s+safeNum(g.saved), 0);
  const sipRatio    = salary>0 ? (totalSIP/salary)*100 : 0;
  const isOver      = salary>0 && sipRatio>50;
  const isHigh      = salary>0 && sipRatio>35 && !isOver;
  if (goals.length===0) return null;
  return (
    <View style={{ marginBottom:14 }}>
      <LinearGradient colors={['#0c1a4e','#1a3080']} style={[GS.summaryCard, { borderColor:'rgba(79,140,255,0.2)' }]} start={{x:0,y:0}} end={{x:1,y:1}}>
        <Text style={GS.summaryEye}>Goals Overview</Text>
        <View style={GS.summaryTop}>
          {[[goals.length,'Goals','#fff'],[goals.filter(g=>safePct(safeNum(g.saved),safeNum(g.target))>=100).length,'Achieved','#86efac'],[fmtShort(totalSIP),'Total SIP','#c4b5fd']].map(([v,l,c],i) => (
            <View key={i} style={{ flex:1, alignItems:i===0?'flex-start':i===2?'flex-end':'center' }}>
              <Text style={[GS.summaryBig, { color:c }]}>{v}</Text>
              <Text style={GS.summaryLbl}>{l}</Text>
            </View>
          ))}
        </View>
        <Bar value={totalSaved} total={Math.max(totalTarget,1)} color="#4F8CFF" h={7} />
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:5 }}>
          <Text style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Saved: {fmtShort(totalSaved)}</Text>
          <Text style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Target: {fmtShort(totalTarget)}</Text>
        </View>
        {salary>0 && (
          <View style={[GS.sipLoad, { borderTopColor:'rgba(255,255,255,0.08)' }]}>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>SIP load: {Math.round(sipRatio)}% of income</Text>
            <View style={{ flex:1, marginHorizontal:12 }}>
              <View style={{ backgroundColor:'rgba(255,255,255,0.1)', height:5, borderRadius:99, overflow:'hidden' }}>
                <View style={{ width:`${Math.min(100,sipRatio)}%`, height:'100%', borderRadius:99, backgroundColor:isOver?RED:isHigh?AMBER:GREEN }} />
              </View>
            </View>
            <Text style={{ fontSize:11, fontWeight:'700', color:isOver?'#fca5a5':isHigh?'#fcd34d':'#86efac' }}>{isOver?'⚠️ High':isHigh?'🔶 Watch':'✅ Good'}</Text>
          </View>
        )}
      </LinearGradient>
      {isOver && (
        <View style={[GS.warnBanner, { backgroundColor:RED+'15', borderColor:RED+'35' }]}>
          <Text style={{ fontSize:18 }}>⚠️</Text>
          <View style={{ flex:1, marginLeft:10 }}>
            <Text style={{ fontSize:13, fontWeight:'700', color:RED }}>Over-Investing Warning</Text>
            <Text style={{ fontSize:11, color:RED+'CC', marginTop:2, lineHeight:16 }}>SIP ({fmtShort(totalSIP)}/mo) is {Math.round(sipRatio)}% of income. Max recommended: 40%. Extend timelines or reduce goals.</Text>
          </View>
        </View>
      )}
      {isHigh && !isOver && (
        <View style={[GS.warnBanner, { backgroundColor:AMBER+'15', borderColor:AMBER+'35' }]}>
          <Text style={{ fontSize:18 }}>💡</Text>
          <View style={{ flex:1, marginLeft:10 }}>
            <Text style={{ fontSize:12, color:AMBER }}>SIP is {Math.round(sipRatio)}% of income — manageable but ensure 6-month emergency fund first.</Text>
          </View>
        </View>
      )}
    </View>
  );
});

// ── Portfolio Insights ──────────────────────────────────
const PortfolioInsights = memo(({ goals, salary, T }) => {
  const items = useMemo(() => {
    if (goals.length===0) return [];
    const msgs = [];
    const totalSIP = goals.reduce((s,g)=>s+safeNum(g.sip),0);
    const sipRatio = salary>0 ? totalSIP/salary : 0;
    const behind = goals.filter(g=>safePct(safeNum(g.saved),safeNum(g.target))<25);
    if (behind.length>0) msgs.push({ icon:'⚠️', color:RED, msg:`${behind.length} goal${behind.length>1?'s are':' is'} less than 25% funded — increase SIP or extend timeline.` });
    const near = goals.filter(g=>{ const p=safePct(safeNum(g.saved),safeNum(g.target)); return p>=80&&p<100; });
    if (near.length>0) msgs.push({ icon:'🔥', color:GREEN, msg:`${near.length} goal${near.length>1?'s are':' is'} 80%+ complete — final push!` });
    if (sipRatio>0&&sipRatio<0.1&&salary>0) msgs.push({ icon:'📈', color:BLUE, msg:`You are investing only ${Math.round(sipRatio*100)}% of income. Try increasing to 20% for faster results.` });
    const shortGoals = goals.filter(g=>safeNum(g.years)<=3);
    if (shortGoals.length>0) msgs.push({ icon:'💡', color:AMBER, msg:'Short-term goals (≤3Y) should use debt/liquid funds — avoid equity for these.' });
    if (goals.length>=4) msgs.push({ icon:'🎯', color:PURPLE, msg:'With 4+ goals, prioritize by urgency. Direct extra savings to the nearest deadline first.' });
    return msgs;
  }, [goals, salary]);
  if (items.length===0) return null;
  return (
    <View style={[GS.insightsBanner, { backgroundColor:T.l1, borderColor:T.border }]}>
      <Text style={[GS.insightsBannerTitle, { color:T.t1 }]}>💡 Portfolio Insights</Text>
      {items.map((ins,i) => (
        <View key={i} style={[GS.globalInsRow, { borderTopColor:T.border }]}>
          <Text style={{ fontSize:14 }}>{ins.icon}</Text>
          <Text style={{ fontSize:12, color:ins.color, flex:1, marginLeft:8, lineHeight:17 }}>{ins.msg}</Text>
        </View>
      ))}
    </View>
  );
});

// ── Main Screen ──────────────────────────────────────────
export default function GoalsScreen() {
  const { state:s, dispatch } = useApp();
  const { T } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter]   = useState('all');

  const goals  = s.goals  || [];
  const salary = safeNum(s.salary);
  const filtered = useMemo(() => {
    if (filter==='done')   return goals.filter(g=>safePct(safeNum(g.saved),safeNum(g.target))>=100);
    if (filter==='active') return goals.filter(g=>safePct(safeNum(g.saved),safeNum(g.target))<100);
    return goals;
  }, [goals, filter]);

  const addGoal = useCallback((g) => dispatch({ type:'ADD_GOAL', goal:g }), [dispatch]);
  const delGoal = useCallback((i) => dispatch({ type:'DEL_GOAL', idx:i }),  [dispatch]);

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
      {/* Header */}
      <View style={GS.header}>
        <View>
          <Text style={[GS.headerTitle, { color:T.t1 }]}>Goal Planner</Text>
          <Text style={[GS.headerSub, { color:T.t3 }]}>Turn dreams into investment plans</Text>
        </View>
        <Pressable onPress={() => { tap(); setShowAdd(true); }} style={[GS.addHeaderBtn, { backgroundColor:BLUE }]}>
          <Text style={{ fontSize:18, color:'#fff' }}>+</Text>
          <Text style={{ fontSize:13, fontWeight:'700', color:'#fff' }}>New Goal</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal:16 }}>
        <SIPSummary goals={goals} salary={salary} T={T} />
        {goals.length>0 && <PortfolioInsights goals={goals} salary={salary} T={T} />}
      </View>

      {/* Filters */}
      {goals.length>0 && (
        <View style={GS.filterRow}>
          {[['all','All Goals'],['active','In Progress'],['done','Achieved']].map(([k,l]) => (
            <Pressable key={k} onPress={() => { tap(); setFilter(k); }}
              style={[GS.filterTab, { backgroundColor:filter===k?BLUE:T.l1, borderColor:filter===k?BLUE:T.border }]}>
              <Text style={{ fontSize:12, fontWeight:'700', color:filter===k?'#fff':T.t3 }}>{l}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Goal cards */}
      <View style={{ paddingHorizontal:16 }}>
        {filtered.length===0 ? (
          <View style={[GS.emptyCard, { backgroundColor:T.l1, borderColor:T.border }]}>
            <Text style={{ fontSize:52, marginBottom:14 }}>🎯</Text>
            <Text style={[GS.emptyTitle, { color:T.t1 }]}>
              {filter==='done'?'No goals achieved yet':filter==='active'?'All goals achieved! 🎉':'No goals yet'}
            </Text>
            <Text style={[GS.emptySub, { color:T.t3 }]}>
              {filter==='all'?'Add your first goal — house, car, retirement or anything you dream of. Get a personalized SIP plan instantly.':'Keep investing and goals will appear here soon!'}
            </Text>
            {filter==='all' && (
              <Pressable onPress={() => setShowAdd(true)} style={{ width:'100%', borderRadius:14, overflow:'hidden', marginTop:16 }}>
                <LinearGradient colors={['#1D4ED8','#3B82F6']} style={{ paddingVertical:16, alignItems:'center' }} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={{ fontSize:15, fontWeight:'800', color:'#fff' }}>+ Plan Your First Goal</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        ) : filtered.map((goal,i) => (
          <GoalCard key={goal.id||i} goal={goal} idx={goals.indexOf(goal)} salary={salary} onDelete={delGoal} dispatch={dispatch} />
        ))}
      </View>

      <AddGoalModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addGoal} T={T} />
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────
const GS = StyleSheet.create({
  // Screen
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:56, paddingHorizontal:16, paddingBottom:16 },
  headerTitle:   { fontSize:30, fontWeight:'800', letterSpacing:-0.5 },
  headerSub:     { fontSize:13, marginTop:2 },
  addHeaderBtn:  { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:10, borderRadius:12 },
  filterRow:     { flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:14 },
  filterTab:     { paddingHorizontal:14, paddingVertical:8, borderRadius:10, borderWidth:1 },
  // Summary
  summaryCard:   { borderRadius:20, padding:18, borderWidth:1 },
  summaryEye:    { fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 },
  summaryTop:    { flexDirection:'row', marginBottom:14 },
  summaryBig:    { fontSize:28, fontWeight:'800' },
  summaryLbl:    { fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 },
  sipLoad:       { flexDirection:'row', alignItems:'center', marginTop:12, paddingTop:10, borderTopWidth:1 },
  warnBanner:    { flexDirection:'row', alignItems:'flex-start', borderRadius:14, padding:14, borderWidth:1, marginTop:10 },
  // Portfolio insights
  insightsBanner:     { borderRadius:16, padding:16, borderWidth:1, marginBottom:14 },
  insightsBannerTitle:{ fontSize:15, fontWeight:'700', marginBottom:10 },
  globalInsRow:  { flexDirection:'row', alignItems:'flex-start', paddingTop:10, borderTopWidth:1 },
  // Goal card
  goalCard:    { borderRadius:18, padding:16, borderWidth:1, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:4 },
  cardHeader:  { flexDirection:'row', alignItems:'center' },
  iconWrap:    { width:52, height:52, borderRadius:15, alignItems:'center', justifyContent:'center' },
  goalTitle:   { fontSize:17, fontWeight:'800', letterSpacing:-0.2 },
  statusBadge: { paddingHorizontal:8, paddingVertical:2, borderRadius:99 },
  statusText:  { fontSize:10, fontWeight:'700' },
  yearBadge:   { paddingHorizontal:7, paddingVertical:2, borderRadius:6 },
  targetAmt:   { fontSize:20, fontWeight:'800' },
  targetLabel: { fontSize:10, marginTop:1 },
  progFooter:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  progText:    { fontSize:11 },
  progPct:     { fontSize:12, fontWeight:'800' },
  statsRow:    { flexDirection:'row', borderRadius:12, borderWidth:1, overflow:'hidden', marginBottom:0 },
  statCell:    { flex:1, paddingVertical:10, paddingHorizontal:8, alignItems:'center' },
  statVal:     { fontSize:14, fontWeight:'800', textAlign:'center' },
  statLbl:     { fontSize:9, marginTop:2, textAlign:'center' },
  expandRow:   { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6, paddingTop:10, marginTop:6 },
  expandText:  { fontSize:11 },
  expandedWrap:{ borderTopWidth:1, paddingTop:14, marginTop:4, gap:12 },
  stratBadge:  { flexDirection:'row', alignItems:'center', borderRadius:12, padding:12, borderWidth:1 },
  breakGrid:   { flexDirection:'row', flexWrap:'wrap', gap:8 },
  breakCell:   { borderRadius:10, padding:10, borderWidth:1 },
  insightsBox: { borderRadius:12, padding:12, borderWidth:1 },
  insightsTitle:{ fontSize:13, fontWeight:'700', marginBottom:8 },
  insightRow:  { flexDirection:'row', alignItems:'flex-start', paddingTop:8, borderTopWidth:1 },
  insightIcon: { width:30, height:30, borderRadius:8, alignItems:'center', justifyContent:'center' },
  actRow:      { flexDirection:'row', gap:10 },
  actBtn:      { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderRadius:12, paddingVertical:10, borderWidth:1 },
  actLabel:    { fontSize:12, fontWeight:'700' },
  // Chart
  chartWrap:   { gap:0 },
  chartFooter: { flexDirection:'row', alignItems:'center', marginTop:10, paddingTop:10, borderTopWidth:1 },
  // Modals
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  handle:      { width:40, height:4, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:2, alignSelf:'center', marginBottom:16 },
  sheetTitle:  { fontSize:20, fontWeight:'800', marginBottom:4 },
  updateSheet: { borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:Platform.OS==='ios'?40:20 },
  modeToggle:  { flexDirection:'row', borderRadius:12, padding:3, marginBottom:14, gap:3 },
  modeBtn:     { flex:1, paddingVertical:9, borderRadius:10, alignItems:'center' },
  updateInput: { flexDirection:'row', alignItems:'center', borderRadius:14, padding:14, borderWidth:1.5, marginBottom:4 },
  saveBtn:     { borderRadius:14, paddingVertical:16, alignItems:'center' },
  addSheet:    { borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:Platform.OS==='ios'?40:20, maxHeight:'94%' },
  addTitleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  closeBtn:    { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  stepRow:     { flexDirection:'row', alignItems:'flex-start', justifyContent:'center', marginBottom:18 },
  stepDot:     { width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center', borderWidth:2 },
  stepLine:    { flex:1, height:2, marginTop:13, marginHorizontal:4 },
  stepHint:    { fontSize:14, marginBottom:14, textAlign:'center' },
  stepContent: { paddingBottom:8 },
  presetGrid:  { flexDirection:'row', flexWrap:'wrap', gap:10 },
  presetCard:  { width:'47%', borderRadius:16, padding:14, alignItems:'center', borderWidth:1.5 },
  presetIconWrap:{ width:52, height:52, borderRadius:14, alignItems:'center', justifyContent:'center', marginBottom:8 },
  presetLabel: { fontSize:14, fontWeight:'700', marginBottom:2 },
  presetHint:  { fontSize:10, marginBottom:2 },
  presetYears: { fontSize:11, fontWeight:'800' },
  fieldLabel:  { fontSize:12, fontWeight:'600', letterSpacing:0.3, marginBottom:6 },
  fieldInput:  { borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1.5, flexDirection:'row', alignItems:'center', marginBottom:2 },
  fieldRow:    { flexDirection:'row', gap:10, marginTop:12 },
  fieldErr:    { fontSize:11, color:RED, marginTop:2, marginBottom:4 },
  livePreview: { borderRadius:12, padding:14, borderWidth:1, marginTop:12 },
  prevCard:    { borderRadius:16, overflow:'hidden', borderWidth:1, marginBottom:12 },
  prevHeader:  { flexDirection:'row', alignItems:'center', padding:16 },
  prevRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1 },
  addFooter:   { flexDirection:'row', gap:10, paddingTop:14 },
  backBtn:     { flex:1, borderWidth:1.5, borderRadius:14, paddingVertical:14, alignItems:'center', justifyContent:'center' },
  nextGrad:    { paddingVertical:16, paddingHorizontal:20, alignItems:'center' },
  nextText:    { fontSize:15, fontWeight:'800', color:'#fff' },
  emptyCard:   { borderRadius:18, padding:32, borderWidth:1, alignItems:'center' },
  emptyTitle:  { fontSize:20, fontWeight:'800', marginBottom:8 },
  emptySub:    { fontSize:13, lineHeight:20, textAlign:'center' },
});
