// GrowthScreen.js
import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useApp }   from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, SH, Bar, Chip, StatRow, GCard, Empty, Input, AlertRow } from './UI';
import { fmt, safeNum, safePct, deriveState } from './helpers';

// ─────────────────────────────────────────────────────────
// PREMIUM PILL TAB BAR
// ─────────────────────────────────────────────────────────
function PillTabs({ tabs, active, onChange }) {
  const { T } = useTheme();
  return (
    <View style={[pSt.wrap, { backgroundColor: T.l2, borderColor: T.border }]}>
      {tabs.map(({ key, label }) => {
        const on = active === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={pSt.item}>
            <View style={[pSt.pill, on && pSt.pillOn]}>
              <Text style={[pSt.label, { color: on ? '#fff' : T.t3 }, on && pSt.labelOn]}>
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const pSt = StyleSheet.create({
  wrap:    { flexDirection:'row', borderRadius:16, padding:5, gap:4, borderWidth:1, marginBottom:16 },
  item:    { flex:1 },
  pill:    { paddingVertical:10, borderRadius:12, alignItems:'center', justifyContent:'center' },
  pillOn:  { backgroundColor:'#4F8CFF', shadowColor:'#4F8CFF', shadowOpacity:0.45, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:6 },
  label:   { fontSize:12, fontWeight:'500', letterSpacing:0.2 },
  labelOn: { fontWeight:'700' },
});

// ─────────────────────────────────────────────────────────
// CERT STATUS HELPER
// ─────────────────────────────────────────────────────────
const certSt = (status) => {
  if (status === 'Done')        return { bg:'#22C55E22', color:'#22C55E', border:'#22C55E50', badge:'✓ Done'        };
  if (status === 'In Progress') return { bg:'#F59E0B22', color:'#F59E0B', border:'#F59E0B50', badge:'⏳ In Progress' };
  return { bg:'rgba(255,255,255,0.04)', color:'#6B7280', border:'transparent', badge:'📝 Planned' };
};

// ─────────────────────────────────────────────────────────
// CAREER TAB
// ─────────────────────────────────────────────────────────
const LADDER = [
  { role:'HSE Officer',       years:'0–3 yrs',  icon:'🛡️', color:'#4F8CFF', active:true,  sal:'₹3L–₹6L',  skills:['Risk Assessment','HIRA','Incident Inv.'] },
  { role:'Senior HSE Engr',   years:'3–6 yrs',  icon:'⚡',  color:'#22C55E', active:false, sal:'₹6L–₹12L', skills:['ISO 45001 LA','EHS Mgmt','Team Lead'] },
  { role:'HSE Manager',       years:'6–10 yrs', icon:'🎯', color:'#A78BFA', active:false, sal:'₹12L–₹25L',skills:['HSE Strategy','Budget','Regulatory'] },
  { role:'HSE Director / VP', years:'10+ yrs',  icon:'👑', color:'#F59E0B', active:false, sal:'₹25L+',    skills:['Corporate HSE','Board','Global'] },
];
const CERTS = [
  { name:'NEBOSH IGC',          body:'NEBOSH UK', icon:'🏅', defStatus:'Done'        },
  { name:'IOSH Managing Safely',body:'IOSH UK',   icon:'🎖️', defStatus:'Done'        },
  { name:'ISO 45001 LA',        body:'BSI/IRCA',  icon:'📋', defStatus:'In Progress' },
  { name:'NEBOSH Diploma',      body:'NEBOSH UK', icon:'🏆', defStatus:'Planned'     },
  { name:'ADIS',                body:'IICPE',     icon:'📝', defStatus:'Planned'     },
];

function CareerTab() {
  const { T }        = useTheme();
  const { state: s } = useApp();
  const userCerts    = s.certifications || [];
  const getStatus    = (name) => userCerts.find(c => c?.name?.includes(name.split(' ')[0]))?.status || CERTS.find(c => c.name === name)?.defStatus || 'Planned';

  return (
    <View>
      <Card style={{ marginBottom:12 }}>
        <SH title="Career Roadmap" />
        {LADDER.map((step, i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:13 }}>
            <View style={{ alignItems:'center' }}>
              <View style={[cSt.icon, {
                backgroundColor: step.active ? step.color : T.l2,
                borderColor:     step.active ? 'transparent' : T.border,
                shadowColor:     step.active ? step.color : 'transparent',
                shadowOpacity:   step.active ? 0.5 : 0, shadowRadius:12, elevation: step.active ? 6 : 0,
              }]}>
                <Text style={{ fontSize:18 }}>{step.icon}</Text>
              </View>
              {i < LADDER.length - 1 && (
                <View style={{ width:2, height:44, marginVertical:3, backgroundColor: step.active ? step.color+'50' : T.border }} />
              )}
            </View>
            <View style={{ flex:1, paddingTop:8, paddingBottom: i < LADDER.length-1 ? 0 : 4 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                <Text style={{ fontSize:14, fontWeight:'700', color: step.active ? step.color : T.t2 }}>{step.role}</Text>
                {step.active && <Chip label="You are here" color={step.color} dot sm />}
              </View>
              <Text style={{ fontSize:11, color:T.t3, marginBottom:6 }}>{step.years} · {step.sal}</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginBottom: i < LADDER.length-1 ? 8 : 0 }}>
                {step.skills.map(sk => (
                  <View key={sk} style={{ backgroundColor:step.color+'18', borderRadius:6, paddingHorizontal:7, paddingVertical:3 }}>
                    <Text style={{ fontSize:10, color:step.color }}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </Card>

      <Card style={{ marginBottom:12 }}>
        <SH title="Certifications"
          right={`${CERTS.filter(c => getStatus(c.name) === 'Done').length}/${CERTS.length} done`}
          rightColor="#22C55E" />
        {CERTS.map((cert, i) => {
          const status = getStatus(cert.name);
          const cs     = certSt(status);
          return (
            <View key={i} style={[cSt.certRow, { backgroundColor:cs.bg, borderColor:cs.border, borderWidth: status==='Done' ? 1.5 : 1, marginBottom: i < CERTS.length-1 ? 8 : 0 }]}>
              <View style={[cSt.certIcon, { backgroundColor:cs.color+'22' }]}>
                <Text style={{ fontSize:20 }}>{cert.icon}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontWeight:'700', fontSize:13, color: status==='Done' ? cs.color : T.t1 }}>{cert.name}</Text>
                <Text style={{ fontSize:11, color:T.t3, marginTop:1 }}>{cert.body}</Text>
              </View>
              <View style={{ backgroundColor:cs.color+'22', borderRadius:8, paddingHorizontal:8, paddingVertical:4 }}>
                <Text style={{ fontSize:11, fontWeight:'700', color:cs.color }}>{cs.badge}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// LEAVE TRACKER TAB
// ─────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  { type:'PL', label:'Planned Leave', icon:'🏖️', color:'#4F8CFF' },
  { type:'SL', label:'Sick Leave',    icon:'🏥', color:'#EF4444' },
  { type:'CL', label:'Casual Leave',  icon:'☕', color:'#F59E0B' },
];

const detectBurnout = (parsed) => {
  const sick      = parsed.find(l => l.type === 'SL')?.usedN || 0;
  const totalPct  = safePct(parsed.reduce((a,l)=>a+l.usedN,0), Math.max(parsed.reduce((a,l)=>a+l.totalN,0),1));
  if (sick >= 3)     return { level:'high', icon:'🔴', msg:'High sick leave usage — possible burnout. Please rest.', color:'#EF4444' };
  if (totalPct <= 5) return { level:'low',  icon:'🟡', msg:'Very few leaves taken — you may be overworking. Take at least 2 days off.', color:'#F59E0B' };
  if (totalPct >= 80)return { level:'high', icon:'🔴', msg:'Leave usage very high. Review if workload is sustainable.', color:'#EF4444' };
  if (totalPct >= 50)return { level:'med',  icon:'🟡', msg:'Moderate leave usage. Keep checking work-life balance.', color:'#F59E0B' };
  return { level:'ok', icon:'🟢', msg:'Healthy leave balance. Great work-life balance!', color:'#22C55E' };
};

const predictNextMonth = (parsed) => {
  const totalUsed = parsed.reduce((a,l)=>a+l.usedN,0);
  const sick      = parsed.find(l => l.type === 'SL')?.usedN || 0;
  const avg       = Math.max(1, Math.round(totalUsed / 6));
  if (sick >= 2) return { icon:'⚠️', msg:'You may need 2–3 sick leaves next month based on pattern.', color:'#EF4444' };
  if (totalUsed === 0) return { icon:'💡', msg:'No leaves taken yet. Plan some time off for rest.', color:'#4F8CFF' };
  return { icon:'📅', msg:`Predicted ~${avg} leaves next month based on usage trend.`, color:'#22C55E' };
};

const buildLeaveInsights = (parsed) => {
  const total   = parsed.reduce((a,l)=>a+l.totalN,0);
  const used    = parsed.reduce((a,l)=>a+l.usedN,0);
  const sick    = parsed.find(l=>l.type==='SL');
  const planned = parsed.find(l=>l.type==='PL');
  const insights = [];
  if (total === 0) return [{ icon:'💡', msg:'Add leave details to see insights.', color:'#4F8CFF' }];
  const pct = safePct(used, total);
  if (pct < 15) insights.push({ icon:'😓', msg:'Using very few leaves — rest is important for long-term productivity.', color:'#F59E0B' });
  if (pct > 80) insights.push({ icon:'⚠️', msg:`High leave consumption — only ${total - used} days remaining this year.`, color:'#EF4444' });
  if (pct >= 30 && pct <= 60) insights.push({ icon:'✅', msg:'Good work-life balance. Leave usage is healthy.', color:'#22C55E' });
  if (sick && safePct(sick.usedN, sick.totalN) > 60) insights.push({ icon:'🏥', msg:'High sick leave usage. Consider a health check-up.', color:'#EF4444' });
  if (planned && planned.usedN === 0 && planned.totalN > 0) insights.push({ icon:'🏖️', msg:'No planned leaves taken — schedule a vacation for better productivity.', color:'#4F8CFF' });
  if (insights.length === 0) insights.push({ icon:'📊', msg:'Track leaves regularly for better insights.', color:'#4F8CFF' });
  return insights;
};

function LeaveTab() {
  const { T } = useTheme();
  const { state: s } = useApp();

  const initLeaves = LEAVE_TYPES.map(lt => {
    const match = (s.leaves || []).find(l => l.type === lt.type);
    return { ...lt, total: String(match?.total || '0'), used: String(match?.used || '0') };
  });
  const [leaves, setLeaves] = useState(initLeaves);

  const update = (i, field, val) =>
    setLeaves(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const parsed = leaves.map(l => ({
    ...l,
    totalN: safeNum(l.total),
    usedN:  safeNum(l.used),
    remN:   Math.max(0, safeNum(l.total) - safeNum(l.used)),
    pct:    safePct(safeNum(l.used), safeNum(l.total)),
  }));

  const grand    = { total: parsed.reduce((a,l)=>a+l.totalN,0), used: parsed.reduce((a,l)=>a+l.usedN,0), rem: parsed.reduce((a,l)=>a+l.remN,0) };
  const grandPct = safePct(grand.used, grand.total);
  const burnout  = useMemo(() => detectBurnout(parsed),           [leaves]);
  const predict  = useMemo(() => predictNextMonth(parsed),        [leaves]);
  const insights = useMemo(() => buildLeaveInsights(parsed),      [leaves]);

  return (
    <View>
      {/* OVERVIEW */}
      <Card style={{ marginBottom:12 }}>
        <SH title="Leave Overview" />
        <View style={{ flexDirection:'row', gap:10, marginBottom:16 }}>
          {[{ label:'Total', val:grand.total, color:T.t1 }, { label:'Used', val:grand.used, color:'#EF4444' }, { label:'Remaining', val:grand.rem, color:'#22C55E' }].map((c,i) => (
            <View key={i} style={[lSt.summBox, { backgroundColor:T.l2, borderColor:T.border }]}>
              <Text style={{ fontSize:24, fontWeight:'800', color:c.color }}>{c.val}</Text>
              <Text style={{ fontSize:11, color:T.t3, marginTop:3 }}>{c.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
          <Text style={{ fontSize:12, color:T.t3 }}>Overall usage</Text>
          <Text style={{ fontSize:12, fontWeight:'700', color: grandPct > 70 ? '#EF4444' : '#22C55E' }}>{grandPct}%</Text>
        </View>
        <Bar value={grand.used} total={Math.max(grand.total,1)} color={grandPct > 70 ? '#EF4444' : '#4F8CFF'} h={10} />
      </Card>

      {/* CATEGORY BREAKDOWN */}
      <Card style={{ marginBottom:12 }}>
        <SH title="By Category" />
        {parsed.map((l, i) => (
          <View key={l.type} style={[{ paddingVertical:14 }, i < parsed.length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ fontSize:20 }}>{l.icon}</Text>
                <Text style={{ fontWeight:'700', fontSize:14, color:T.t1 }}>{l.label}</Text>
              </View>
              <View style={{ backgroundColor:l.color+'20', borderRadius:10, paddingHorizontal:10, paddingVertical:5 }}>
                <Text style={{ fontSize:12, fontWeight:'800', color:l.color }}>{l.pct}%</Text>
              </View>
            </View>
            <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:10, color:T.t3, fontWeight:'600', marginBottom:4, textTransform:'uppercase' }}>Total</Text>
                <Input value={l.total} onChange={v => update(i,'total',v)} type="numeric" placeholder="0" style={{ marginBottom:0 }} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:10, color:T.t3, fontWeight:'600', marginBottom:4, textTransform:'uppercase' }}>Used</Text>
                <Input value={l.used} onChange={v => update(i,'used',v)} type="numeric" placeholder="0" style={{ marginBottom:0 }} />
              </View>
              <View style={{ flex:1, alignItems:'center', justifyContent:'flex-end', paddingBottom:SP.sm }}>
                <Text style={{ fontSize:10, color:T.t3, fontWeight:'600', marginBottom:4, textTransform:'uppercase' }}>Left</Text>
                <Text style={{ fontSize:22, fontWeight:'800', color: l.remN > 0 ? '#22C55E' : '#EF4444' }}>{l.remN}</Text>
              </View>
            </View>
            <Bar value={l.usedN} total={Math.max(l.totalN,1)} color={l.color} h={7} />
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:5 }}>
              <Text style={{ fontSize:11, color:T.t3 }}>{l.usedN} used</Text>
              <Text style={{ fontSize:11, color:T.t3 }}>{l.remN} remaining</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* BURNOUT */}
      <Card style={{ marginBottom:12, borderWidth:1.5, borderColor:burnout.color+'44' }}>
        <SH title="🔍 Burnout Detection" />
        <View style={{ flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:burnout.color+'12', borderRadius:12, padding:13, borderWidth:1, borderColor:burnout.color+'30' }}>
          <Text style={{ fontSize:28 }}>{burnout.icon}</Text>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:14, fontWeight:'800', color:burnout.color, marginBottom:3 }}>
              {burnout.level==='ok' ? 'Healthy Balance' : burnout.level==='med' ? 'Monitor Workload' : 'Burnout Risk!'}
            </Text>
            <Text style={{ fontSize:12, color:T.t2, lineHeight:18 }}>{burnout.msg}</Text>
          </View>
        </View>
      </Card>

      {/* AI PREDICTION */}
      <Card style={{ marginBottom:12 }}>
        <SH title="🤖 AI Prediction" />
        <AlertRow icon={predict.icon} msg={predict.msg} color={predict.color} last />
      </Card>

      {/* INSIGHTS */}
      <Card style={{ marginBottom:12 }}>
        <SH title="💡 Smart Insights" />
        {insights.map((ins, i) => (
          <AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i===insights.length-1} />
        ))}
      </Card>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// EMERGENCY FUND TAB
// ─────────────────────────────────────────────────────────
function EFTab() {
  const { T } = useTheme();
  const { state: s } = useApp();
  const [manualSaved, setManualSaved] = useState('');

  const d = useMemo(() => { try { return deriveState(s); } catch { return { needsBudget:0, totalIncome:0 }; } }, [s]);

  const monthly = d.needsBudget || d.totalIncome * 0.5;
  const t3m     = monthly * 3;
  const t6m     = monthly * 6;
  const efGoal  = (s.goals||[]).find(g => g?.title?.toLowerCase().includes('emergency'));
  const saved   = safeNum(manualSaved) || safeNum(efGoal?.saved);

  return (
    <View>
      <Card style={{ marginBottom:12 }}>
        <SH title="Emergency Fund" />
        <Input label="Current emergency savings (₹)" value={manualSaved} onChange={setManualSaved}
          type="numeric" prefix="₹" placeholder={saved>0 ? String(saved) : '0'} />
      </Card>
      {monthly > 0 ? (
        <>
          {[{ label:'3-Month Fund', target:t3m, color:'#4F8CFF' }, { label:'6-Month Fund (Recommended)', target:t6m, color:'#22C55E' }].map(({ label, target, color }) => (
            <Card key={label} style={{ marginBottom:12 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:14 }}>
                <View>
                  <Text style={{ fontSize:11, color:T.t3, textTransform:'uppercase', letterSpacing:0.4, marginBottom:4 }}>{label}</Text>
                  <Text style={{ fontSize:24, fontWeight:'800', color:T.t1 }}>{fmt(target)}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ fontSize:22, fontWeight:'800', color: safePct(saved,target)>=100 ? '#22C55E' : color }}>
                    {safePct(saved,target)}%
                  </Text>
                  {safePct(saved,target)>=100 && <Chip label="Done ✓" color="#22C55E" sm />}
                </View>
              </View>
              <Bar value={saved} total={Math.max(target,1)} color={color} h={10} />
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8 }}>
                <Text style={{ fontSize:12, color:T.t3 }}>Saved: {fmt(saved)}</Text>
                <Text style={{ fontSize:12, color:T.t3 }}>Need: {fmt(Math.max(0,target-saved))} more</Text>
              </View>
            </Card>
          ))}
          <Card>
            <SH title="Summary" />
            <StatRow label="Monthly expenses"     value={fmt(monthly)} />
            <StatRow label="3-month target"       value={fmt(t3m)} color="#4F8CFF" />
            <StatRow label="6-month target"       value={fmt(t6m)} color="#22C55E" />
            <StatRow label="Saved"                value={fmt(saved)} color={saved>=t6m?'#22C55E':'#F59E0B'} />
            <StatRow label="Monthly to complete"  value={saved<t6m ? fmt(Math.round((t6m-saved)/6)) : 'Complete 🎉'} color="#A78BFA" last />
          </Card>
        </>
      ) : (
        <Card><Empty icon="🛟" title="Add salary first" sub="Enter salary in Money tab for accurate calculation." /></Card>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// STATS / ANALYTICS TAB
// ─────────────────────────────────────────────────────────
function StatsTab() {
  const { T } = useTheme();
  const { state: s } = useApp();
  const history  = s.behaviorHistory || [];
  const expenses = s.expenses || [];
  const needsPct = expenses.find(e=>e?.label==='Needs')?.pct  || 0;
  const wantsPct = expenses.find(e=>e?.label==='Wants')?.pct  || 0;
  const savPct   = expenses.find(e=>e?.label==='Savings')?.pct|| 0;
  const trendW   = history.length >= 2 ? history[history.length-1]?.wantsPct - history[0]?.wantsPct : 0;

  const rColor = r => r==='Good' ? '#22C55E' : r==='OK' ? '#F59E0B' : '#EF4444';
  const rate   = (pct, type) => {
    if (type==='savings') return pct>=20?'Good':pct>=15?'OK':'Low';
    if (type==='wants')   return pct<=30?'Good':pct<=40?'OK':'High';
    return pct<=55?'Good':pct<=65?'OK':'High';
  };

  const rows = [
    { label:'Needs',   pct:needsPct, target:50, color:'#4F8CFF', type:'needs'   },
    { label:'Wants',   pct:wantsPct, target:30, color:'#F59E0B', type:'wants'   },
    { label:'Savings', pct:savPct,   target:20, color:'#22C55E', type:'savings' },
  ];

  return (
    <View>
      <Card style={{ marginBottom:12 }}>
        <SH title="Expense Split" />
        {rows.map((e,i) => (
          <View key={e.label} style={[{ paddingVertical:13 }, i<rows.length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:10, height:10, borderRadius:3, backgroundColor:e.color }} />
                <Text style={{ fontSize:14, fontWeight:'600', color:T.t1 }}>{e.label}</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ fontSize:14, fontWeight:'800', color:e.color }}>{e.pct}%</Text>
                <Chip label={rate(e.pct,e.type)} color={rColor(rate(e.pct,e.type))} sm />
              </View>
            </View>
            <Bar value={e.pct} total={100} color={e.color} h={7} />
            <Text style={{ fontSize:11, color:T.t3, marginTop:5 }}>
              Target: {e.target}% · {e.pct>e.target ? `+${e.pct-e.target}% over` : e.pct<e.target ? `−${e.target-e.pct}% under` : '✓ Right'}
            </Text>
          </View>
        ))}
      </Card>

      {history.length > 0 ? (
        <Card style={{ marginBottom:12 }}>
          <SH title="3-Month Trend" />
          {trendW !== 0 && (
            <AlertRow icon={trendW>0?'📈':'📉'}
              msg={trendW>0 ? `Wants up ${trendW}% over 3 months — review expenses.` : `Wants down ${Math.abs(trendW)}% — great discipline!`}
              color={trendW>0?'#EF4444':'#22C55E'} last={false} />
          )}
          {history.map((b,i) => (
            <View key={i} style={[{ paddingVertical:12 }, i<history.length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <Text style={{ fontWeight:'600', fontSize:14, color:T.t1 }}>{b.month}</Text>
                <View style={{ flexDirection:'row', gap:6 }}>
                  <Chip label={`Wants ${b.wantsPct}%`} color={b.wantsPct>30?'#EF4444':'#22C55E'} sm />
                  <Chip label={`${b.attended} days`}   color={b.attended>=22?'#22C55E':'#F59E0B'} sm />
                </View>
              </View>
              <Bar value={b.attended} total={26} color={b.attended>=22?'#22C55E':'#F59E0B'} h={5} />
            </View>
          ))}
        </Card>
      ) : (
        <Card style={{ marginBottom:12 }}>
          <Empty icon="📊" title="Building history" sub="Monthly behaviour data appears here." />
        </Card>
      )}

      <Card>
        <SH title="Improvement Tips" />
        {[
          { icon:'🎯', tip:'Automate savings on salary day — transfer 20% first' },
          { icon:'📱', tip:'No shopping apps for 30 days — saves ₹3K–5K/month' },
          { icon:'🍱', tip:'Meal prep on Sundays — saves ₹3,000–5,000/month on food' },
          { icon:'💳', tip:'Set a hard monthly limit on wants spending' },
        ].map((t,i) => (
          <View key={i} style={[{ flexDirection:'row', gap:12, paddingVertical:10 }, i<3 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
            <Text style={{ fontSize:20 }}>{t.icon}</Text>
            <Text style={{ fontSize:13, color:T.t2, lineHeight:19, flex:1 }}>{t.tip}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────
const TABS = [
  { key:'career', label:'🚀 Career' },
  { key:'leaves', label:'📅 Leaves' },
  { key:'ef',     label:'🛟 EF'     },
  { key:'stats',  label:'📊 Stats'  },
];

export default function GrowthScreen() {
  const { T } = useTheme();
  const [tab, setTab] = useState('career');

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom:100 }}>
      <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
        <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Growth</Text>
        <Text style={{ fontSize:13, color:T.t3, marginTop:2 }}>Career · Leaves · Emergency Fund · Analytics</Text>
      </View>

      <View style={{ paddingHorizontal:SP.md }}>
        <PillTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'career' && <CareerTab />}
        {tab === 'leaves' && <LeaveTab />}
        {tab === 'ef'     && <EFTab />}
        {tab === 'stats'  && <StatsTab />}
      </View>
    </ScrollView>
  );
}

const cSt = StyleSheet.create({
  icon:    { width:42, height:42, borderRadius:13, borderWidth:1, alignItems:'center', justifyContent:'center' },
  certRow: { flexDirection:'row', alignItems:'center', gap:12, borderRadius:14, padding:12 },
  certIcon:{ width:40, height:40, borderRadius:11, alignItems:'center', justifyContent:'center' },
});
const lSt = StyleSheet.create({
  summBox: { flex:1, borderRadius:12, padding:12, alignItems:'center', borderWidth:1 },
});
