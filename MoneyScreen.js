
import React, { useState, useMemo, memo, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, Alert, StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { fmt, safePct, deriveState, debtMonths, sipMaturity, sipCAGR, inflAdj, MONTHS_FULL } from './helpers';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, GCard, Chip, Bar, SH, Toggle, Empty, StatRow, Input, Btn, FAB, MonthPicker } from './UI';
import { DonutChart } from './Charts';

const TABS = [['salary','💰 Salary'],['expenses','💳 Expenses'],['sip','📈 SIP'],['debt','🏦 Debt']];

// ── Input validation ─────────────────────────────────────
const validatePositive = (val, fieldName) => {
  const n = Number(val);
  if (isNaN(n) || n < 0) return `${fieldName} cannot be negative`;
  return null;
};

// ── SALARY TAB ────────────────────────────────────────────
const SalaryTab = memo(({ s, dispatch, set }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  const today = new Date().getDate();
  const [salErr, setSalErr] = useState(null);

  const handleSalaryChange = useCallback((v) => {
    const err = validatePositive(v, 'Salary');
    setSalErr(err);
    if (!err) dispatch({ type:'SET_SALARY', salary: Number(v)||0 });
  }, [dispatch]);

  return (
    <View>
      <Card style={{ marginBottom:12 }}>
        <SH title="Your Salary" />
        <Input label="Monthly In-hand (₹)" value={s.salary||''} onChange={handleSalaryChange}
          type="numeric" prefix="₹" placeholder="Enter your salary" error={salErr} />
        <Input label="Working Days / Month" value={s.workingDays||26}
          onChange={v => { if(!validatePositive(v,'Days')) set({ workingDays:Math.max(1,Number(v)||26) }); }}
          type="numeric" placeholder="26" />

        {s.salary > 0 && (
          <View style={{ flexDirection:'row', gap:8, marginTop:4 }}>
            {[
              { l:'Per Day', v:fmt(d.perDay), c:'#4F8CFF' },
              { l:'Earned',  v:fmt(d.earnedSalary), c:'#22C55E' },
              { l:'Lost',    v:fmt(d.lostSalary), c:'#EF4444' },
            ].map((x,i)=>(
              <View key={i} style={{ flex:1, backgroundColor:T.l2, borderRadius:R.md, padding:SP.sm+4, alignItems:'center', borderWidth:1, borderColor:T.border }}>
                <Text style={{ fontSize:13, fontWeight:'800', color:x.c }}>{x.v}</Text>
                <Text style={{ fontSize:10, color:T.t3, marginTop:2 }}>{x.l}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Other income sources */}
      <Card style={{ marginBottom:12 }}>
        <SH title="Other Income Sources" right="+ Add" rightColor="#4F8CFF"
          onRight={() => dispatch({ type:'ADD_INCOME', income:{ label:'Freelance', amount:0, recurring:false } })} />
        {(s.incomes||[]).slice(1).length === 0 ? (
          <Text style={{ fontSize:13, color:T.t3, textAlign:'center', paddingVertical:12 }}>No other income sources added</Text>
        ) : (
          (s.incomes||[]).slice(1).map((inc, i) => (
            <View key={inc?.id||i} style={{ backgroundColor:T.l2, borderRadius:R.md, padding:SP.sm+2, flexDirection:'row', alignItems:'center', gap:8, marginBottom:7, borderWidth:1, borderColor:T.border }}>
              <Text style={{ fontSize:18 }}>💼</Text>
              <View style={{ flex:1 }}>
                <Input value={inc?.label||''} onChange={v => dispatch({ type:'UPD_INCOME', idx:i+1, patch:{label:v} })} placeholder="Income label" style={{ marginBottom:0, borderWidth:0, padding:0, backgroundColor:'transparent' }} />
                <Input value={inc?.amount||''} onChange={v => { if(!validatePositive(v,'Amount')) dispatch({ type:'UPD_INCOME', idx:i+1, patch:{amount:Number(v)||0} }); }}
                  type="numeric" placeholder="Amount" prefix="₹" style={{ marginBottom:0, borderWidth:0, padding:0, backgroundColor:'transparent' }} />
              </View>
              <Toggle value={inc?.recurring||false} onChange={() => dispatch({ type:'UPD_INCOME', idx:i+1, patch:{recurring:!inc?.recurring} })} />
              <Pressable onPress={() => Alert.alert('Remove?','Remove this income source?',[{text:'Cancel'},{text:'Remove',style:'destructive',onPress:()=>dispatch({type:'DEL_INCOME',idx:i+1})}])}>
                <Text style={{ fontSize:20, color:'#EF4444' }}>×</Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>

      {/* Attendance calendar */}
      <Card style={{ marginBottom:12 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:SP.md }}>
          <SH title={`${MONTHS_FULL[s.currentMonth||0]} ${s.currentYear||2025}`} />
          <Chip label={`${(s.attendance instanceof Set ? s.attendance : new Set()).size} present`} color="#22C55E" dot />
        </View>
        <View style={{ flexDirection:'row', marginBottom:6 }}>
          {['M','T','W','T','F','S','S'].map((d,i)=><Text key={i} style={{ flex:1, textAlign:'center', fontSize:10, color:T.t3, paddingBottom:4 }}>{d}</Text>)}
        </View>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4 }}>
          {Array.from({length:31},(_,i)=>i+1).map(d => {
            const att = s.attendance instanceof Set ? s.attendance : new Set();
            const on   = att.has(d);
            const isT  = d===today && (s.currentMonth||0)===new Date().getMonth();
            const wknd = d%7===0||d%7===6;
            return (
              <Pressable key={d} onPress={() => !wknd && dispatch({ type:'TOGGLE_ATT', day:d })}
                style={{ width:'12.5%', aspectRatio:1, borderRadius:8, alignItems:'center', justifyContent:'center',
                  backgroundColor: on?'#22C55E28':isT?'#4F8CFF22':'rgba(255,255,255,0.03)',
                  borderWidth:1, borderColor: on?'#22C55E44':isT?'#4F8CFF44':'transparent' }}>
                <Text style={{ fontSize:11, fontWeight:isT?'700':'400', color:on?'#22C55E':wknd?T.t3+'55':isT?'#4F8CFF':T.t2 }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </View>
  );
});

// ── EXPENSES TAB ──────────────────────────────────────────
const ExpensesTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  const total  = d.manualTotal;
  const budget = d.needsBudget;
  const isOver = total > budget && budget > 0;

  return (
    <View>
      {/* Donut summary */}
      <Card style={{ marginBottom:12 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:16 }}>
          <DonutChart segments={(s.expenses||[]).map(e=>({pct:e.pct,color:e.color}))} size={96} sw={12}
            centerLabel={s.salary > 0 ? fmt(s.salary) : '—'} />
          <View style={{ flex:1 }}>
            {(s.expenses||[]).map((e,i)=>(
              <View key={i} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
                  <View style={{ width:8, height:8, borderRadius:3, backgroundColor:e.color }} />
                  <Text style={{ fontSize:13, color:T.t2 }}>{e.label}</Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ fontWeight:'700', fontSize:13, color:e.color }}>
                    {s.salary > 0 ? fmt(s.salary*e.pct/100) : `${e.pct}%`}
                  </Text>
                  <Text style={{ fontSize:10, color:T.t3 }}>{e.pct}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Sliders */}
      {(s.expenses||[]).map((e,i) => (
        <Card key={i} style={{ marginBottom:10, paddingBottom:SP.md }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <View>
              <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>{e.label}</Text>
              <Text style={{ fontSize:12, color:T.t3, marginTop:2 }}>
                {s.salary > 0 ? fmt(s.salary*e.pct/100)+' / month' : `${e.pct}% of salary`}
              </Text>
            </View>
            <View style={{ backgroundColor:e.color+'20', borderRadius:11, paddingHorizontal:14, paddingVertical:7 }}>
              <Text style={{ fontSize:22, fontWeight:'800', color:e.color }}>{e.pct}%</Text>
            </View>
          </View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <Pressable onPress={()=>dispatch({type:'UPD_EXP_PCT',idx:i,pct:Math.max(0,e.pct-1)})}
              style={{ width:36,height:36,borderRadius:10,backgroundColor:T.l2,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:T.border }}>
              <Text style={{ fontSize:20, color:T.t1 }}>−</Text>
            </Pressable>
            <View style={{ flex:1 }}><Bar value={e.pct} total={100} color={e.color} h={6} /></View>
            <Pressable onPress={()=>dispatch({type:'UPD_EXP_PCT',idx:i,pct:Math.min(100,e.pct+1)})}
              style={{ width:36,height:36,borderRadius:10,backgroundColor:T.l2,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:T.border }}>
              <Text style={{ fontSize:20, color:T.t1 }}>+</Text>
            </Pressable>
          </View>
        </Card>
      ))}

      {/* Manual expenses */}
      <Text style={{ fontSize:14, fontWeight:'700', color:T.t1, marginBottom:10, marginTop:4 }}>Manual Expenses</Text>
      {budget > 0 && (
        <View style={{ backgroundColor:isOver?'#EF444412':'#22C55E10', borderRadius:R.md, padding:SP.sm+4, marginBottom:11, flexDirection:'row', justifyContent:'space-between', borderWidth:1, borderColor:isOver?'#EF444430':'#22C55E30' }}>
          <Text style={{ fontSize:13, color:T.t2 }}>Spent vs budget</Text>
          <Text style={{ fontWeight:'700', fontSize:13, color:isOver?'#EF4444':'#22C55E' }}>{fmt(total)} / {fmt(budget)}</Text>
        </View>
      )}
      {(s.manualExpenses||[]).map((ex, i) => (
        <View key={ex?.id||i} style={{ backgroundColor:T.l2, borderRadius:R.md+2, padding:SP.sm+3, marginBottom:9, flexDirection:'row', alignItems:'center', gap:9, borderWidth:1, borderColor:T.border }}>
          <Text style={{ fontSize:20 }}>{ex?.icon||'💳'}</Text>
          <View style={{ flex:1 }}>
            <Text style={{ fontWeight:'600', fontSize:13, color:T.t1 }}>{ex?.cat||'Expense'}</Text>
            {ex?.recurring && <Chip label="Auto" color="#14B8A6" sm />}
          </View>
          <Text style={{ fontFamily:'System', fontWeight:'700', fontSize:14, color:ex?.color||T.t1 }}>{fmt(ex?.amount||0)}</Text>
          <Toggle value={ex?.recurring||false} onChange={()=>dispatch({type:'UPD_MEXP',idx:i,patch:{recurring:!ex?.recurring}})} />
          <Pressable onPress={()=>Alert.alert('Remove?','Remove this expense?',[{text:'Cancel'},{text:'Remove',style:'destructive',onPress:()=>dispatch({type:'DEL_MEXP',idx:i})}])}>
            <Text style={{ fontSize:20, color:'#EF4444' }}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
});

// ── SIP TAB ───────────────────────────────────────────────
const SipTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  if ((s.sips||[]).length === 0) return (
    <Empty icon="📈" title="No SIPs added"
      sub="Start your wealth journey. ₹500/mo in index funds grows significantly over time."
      cta="Add first SIP"
      onCta={() => dispatch({ type:'ADD_SIP', sip:{ name:'Nifty 50 Index', amount:500, returns:12, months:12, goalLink:null } })} />
  );
  return (
    <View>
      <View style={{ flexDirection:'row', gap:10, marginBottom:12 }}>
        <GCard colors={['#052e16','#064e30']} style={{ flex:1 }}>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:6 }}>Total SIP/mo</Text>
          <Text style={{ fontSize:22, fontWeight:'800', color:'#fff' }}>{fmt(d.sipTotal)}</Text>
        </GCard>
        <GCard colors={['#0c1a4e','#1a3080']} style={{ flex:1 }}>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:6 }}>Est. 1Y Corpus</Text>
          <Text style={{ fontSize:22, fontWeight:'800', color:'#fff' }}>
            {fmt((s.sips||[]).reduce((a,x)=>a+sipMaturity(x.amount||0,12,x.returns||12),0))}
          </Text>
        </GCard>
      </View>
      {(s.sips||[]).map((si, i) => {
        const mat       = sipMaturity(si.amount||0, si.months||12, si.returns||12);
        const invest    = (si.amount||0) * (si.months||12);
        const inflAdjV  = inflAdj(mat, Math.round((si.months||12)/12));
        const cagr      = sipCAGR(invest, mat, (si.months||12)/12||1);
        return (
          <Card key={si?.id||i} style={{ marginBottom:12 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>{si.name||'SIP'}</Text>
                <View style={{ flexDirection:'row', gap:5, marginTop:5, flexWrap:'wrap' }}>
                  <Chip label={`${si.returns||12}% p.a.`} color="#22C55E" sm />
                  {si.goalLink && <Chip label={`→ ${si.goalLink}`} color="#A78BFA" sm />}
                </View>
              </View>
              <Text style={{ fontSize:22, fontWeight:'800', color:'#22C55E' }}>{fmt(si.amount||0)}</Text>
            </View>
            <StatRow label="Invested" value={fmt(invest)} />
            <StatRow label="Maturity (XIRR)" value={fmt(mat)} color="#22C55E" />
            <StatRow label="Inflation-adjusted" value={fmt(inflAdjV)} color="#F59E0B" />
            <StatRow label="CAGR" value={`${cagr}%`} color="#4F8CFF" last />
            <Bar value={invest} total={Math.max(mat,1)} color="#22C55E" h={5} />
            <Pressable onPress={()=>Alert.alert('Remove SIP?',`Remove ${si.name}?`,[{text:'Cancel'},{text:'Remove',style:'destructive',onPress:()=>dispatch({type:'DEL_SIP',idx:i})}])} style={{ marginTop:10 }}>
              <Text style={{ color:'#EF4444', fontSize:12, fontWeight:'600' }}>Remove SIP</Text>
            </Pressable>
          </Card>
        );
      })}
    </View>
  );
});

// ── DEBT TAB ─────────────────────────────────────────────
const DebtTab = memo(({ s, dispatch }) => {
  const { T } = useTheme();
  const d = useMemo(() => deriveState(s), [s]);
  if ((s.debts||[]).length === 0) return (
    <Empty icon="🏦" title="No debts tracked"
      sub="Add your loans or credit cards to plan smart repayment."
      cta="+ Add Debt"
      onCta={() => dispatch({ type:'ADD_DEBT', debt:{ name:'New Loan', amount:0, remaining:0, emi:0, rate:0, dueDate:5 } })} />
  );
  const highRate = (s.debts||[]).length>0 ? (s.debts||[]).reduce((a,x)=>Number(x?.rate||0)>Number(a?.rate||0)?x:a,s.debts[0]) : null;
  const smallest = (s.debts||[]).length>0 ? (s.debts||[]).reduce((a,x)=>Number(x?.remaining||0)<Number(a?.remaining||0)?x:a,s.debts[0]) : null;
  return (
    <View>
      <Card style={{ marginBottom:12 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <View>
            <Text style={{ fontSize:12, color:T.t3, marginBottom:3 }}>Total Outstanding</Text>
            <Text style={{ fontSize:28, fontWeight:'800', color:'#EF4444' }}>{fmt(d.debtTotal)}</Text>
          </View>
          <Chip label="Active" color="#EF4444" dot />
        </View>
        {highRate && smallest && (
          <View style={{ flexDirection:'row', gap:9, marginBottom:12 }}>
            {[
              { label:'🔥 Avalanche', sub:'Max interest', name:highRate.name||'', color:'#F59E0B' },
              { label:'❄️ Snowball',  sub:'Quick win',    name:smallest.name||'', color:'#4F8CFF' },
            ].map(m=>(
              <View key={m.label} style={{ flex:1, backgroundColor:T.l2, borderRadius:R.md, padding:SP.sm+4, borderWidth:1, borderColor:m.color+'25' }}>
                <Text style={{ fontSize:11, fontWeight:'700', color:m.color, marginBottom:3 }}>{m.label}</Text>
                <Text style={{ fontWeight:'600', fontSize:13, color:T.t1 }} numberOfLines={1}>{m.name}</Text>
                <Text style={{ fontSize:10, color:T.t3, marginTop:2 }}>{m.sub}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
      {(s.debts||[]).map((dbt, i) => {
        const paid   = (Number(dbt?.amount)||0) - (Number(dbt?.remaining)||0);
        const months = debtMonths(dbt?.remaining||0, dbt?.emi||1);
        const extraM = debtMonths(dbt?.remaining||0, (dbt?.emi||0)+2000);
        const intLeft= Math.round((Number(dbt?.remaining)||0)*(Number(dbt?.rate)||0)/100*months/12);
        return (
          <Card key={dbt?.id||i} style={{ marginBottom:12 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:15, fontWeight:'700', color:T.t1 }}>{dbt?.name||'Loan'}</Text>
                <View style={{ flexDirection:'row', gap:5, marginTop:5, flexWrap:'wrap' }}>
                  <Chip label={`${dbt?.rate||0}% p.a.`} color={Number(dbt?.rate||0)>=24?'#EF4444':'#F59E0B'} sm />
                  {dbt?.dueDate && <Chip label={`Due: ${dbt.dueDate}th`} color="#F59E0B" sm />}
                </View>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ fontSize:22, fontWeight:'800', color:'#EF4444' }}>{fmt(dbt?.remaining||0)}</Text>
                <Text style={{ fontSize:11, color:T.t3, marginTop:1 }}>remaining</Text>
              </View>
            </View>
            <Bar value={paid} total={Math.max(dbt?.amount||1,1)} color="#EF4444" h={5} />
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:7, marginBottom:12 }}>
              <Text style={{ fontSize:11, color:T.t3 }}>{safePct(paid,dbt?.amount||1)}% cleared</Text>
              <Text style={{ fontSize:11, color:T.t3 }}>{months} months left</Text>
            </View>
            <StatRow label="Monthly EMI" value={fmt(dbt?.emi||0)} />
            <StatRow label="Amount Paid" value={fmt(paid)} color="#22C55E" />
            <StatRow label="Interest Remaining" value={fmt(intLeft)} color="#EF4444" last />
            {(dbt?.emi||0) > 0 && (
              <View style={{ backgroundColor:'#22C55E10', borderRadius:R.md, padding:SP.sm+2, borderWidth:1, borderColor:'#22C55E28', flexDirection:'row', gap:7, marginTop:8 }}>
                <Text style={{ fontSize:14 }}>🚀</Text>
                <Text style={{ color:'#22C55E', fontSize:12, lineHeight:18, flex:1 }}>
                  Pay ₹2K extra/mo → clear in <Text style={{fontWeight:'700'}}>{extraM} months</Text> instead of {months}
                </Text>
              </View>
            )}
            <Pressable onPress={()=>Alert.alert('Remove debt?',`Remove ${dbt?.name}?`,[{text:'Cancel'},{text:'Remove',style:'destructive',onPress:()=>dispatch({type:'DEL_DEBT',idx:i})}])} style={{ marginTop:10 }}>
              <Text style={{ color:'#EF4444', fontSize:12, fontWeight:'600' }}>Remove debt</Text>
            </Pressable>
          </Card>
        );
      })}
    </View>
  );
});

// ── MAIN SCREEN ───────────────────────────────────────────
export default function MoneyScreen() {
  const { state: s, dispatch, set } = useApp();
  const { T } = useTheme();
  const [tab, setTab] = useState('salary');

  const fabActions = {
    sip:  [{ icon:'📈', label:'Add SIP',     color:'#22C55E', action:()=>dispatch({type:'ADD_SIP',  sip:{name:'New SIP',amount:500,returns:12,months:12,goalLink:null}}) }],
    debt: [{ icon:'🏦', label:'Add Debt',    color:'#EF4444', action:()=>dispatch({type:'ADD_DEBT', debt:{name:'New Loan',amount:0,remaining:0,emi:0,rate:0,dueDate:5}}) }],
    expenses:[{ icon:'💳', label:'Add Expense',color:'#F59E0B', action:()=>dispatch({type:'ADD_MEXP', exp:{cat:'Other',amount:0,icon:'💸',color:'#475569',recurring:false}}) }],
  };

  return (
    <View style={{ flex:1, backgroundColor:T.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:120 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
          <View>
            <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Money</Text>
            <Text style={{ fontSize:13, color:T.t3, marginTop:2 }}>All finances, one place</Text>
          </View>
          <MonthPicker month={s.currentMonth||0} year={s.currentYear||2025}
            onChange={(m,y) => dispatch({type:'SET_MONTH', month:m, year:y})} />
        </View>

        {/* AUTO-ADJUST */}
        <View style={{ marginHorizontal:SP.md, marginBottom:SP.md, backgroundColor:T.l2, borderRadius:R.md, padding:SP.sm+4, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:T.border }}>
          <View style={{ flexDirection:'row', gap:10, alignItems:'center' }}>
            <Text style={{ fontSize:18 }}>🤖</Text>
            <View>
              <Text style={{ fontWeight:'600', fontSize:14, color:T.t1 }}>Auto-Adjust Mode</Text>
              <Text style={{ fontSize:12, color:T.t3 }}>AI-driven rebalancing</Text>
            </View>
          </View>
          <Toggle value={s.autoAdjust||false} onChange={()=>set({autoAdjust:!s.autoAdjust})} />
        </View>

        {/* TABS */}
        <View style={{ flexDirection:'row', marginHorizontal:SP.md, marginBottom:SP.md, backgroundColor:T.l1, borderRadius:R.md+2, padding:5, gap:4, borderWidth:1, borderColor:T.border }}>
          {TABS.map(([k,l]) => {
            const on = tab === k;
            return (
              <Pressable key={k} onPress={()=>setTab(k)} style={{ flex:1 }}>
                <View style={[{ paddingVertical:10, borderRadius:12, alignItems:'center', justifyContent:'center' },
                  on && { backgroundColor:'#4F8CFF', shadowColor:'#4F8CFF', shadowOpacity:0.45, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:6 }]}>
                  <Text style={{ fontSize:11, fontWeight:on?'700':'500', color:on?'#fff':T.t3, letterSpacing:0.2 }}>{l}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal:SP.md }}>
          {tab==='salary'   && <SalaryTab   s={s} dispatch={dispatch} set={set} />}
          {tab==='expenses' && <ExpensesTab s={s} dispatch={dispatch} />}
          {tab==='sip'      && <SipTab      s={s} dispatch={dispatch} />}
          {tab==='debt'     && <DebtTab     s={s} dispatch={dispatch} />}
        </View>
      </ScrollView>

      {(fabActions[tab]||[]).length > 0 && <FAB actions={fabActions[tab]} />}
    </View>
  );
}
