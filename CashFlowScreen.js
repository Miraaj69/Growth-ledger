// CashFlowScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, SH, Bar, Chip, StatRow, GCard, Empty } from './UI';
import { fmt, safeNum, safePct, deriveState, MONTHS_FULL } from './helpers';

export default function CashFlowScreen() {
  const { state: s } = useApp();
  const { T }        = useTheme();

  const d = useMemo(() => {
    try { return deriveState(s); }
    catch { return { totalIncome:0,salary:0,earnedSalary:0,otherIncome:0,sipTotal:0,debtEmi:0,debtTotal:0,manualTotal:0,balance:0,present:0,workDays:26,perDay:0,lostSalary:0,netWorth:0,totalAssets:0 }; }
  }, [s]);

  const totalOut = d.manualTotal + d.debtEmi + d.sipTotal;

  // Build flow nodes from actual state
  const flows = useMemo(() => {
    const nodes = [];
    if (d.earnedSalary > 0)
      nodes.push({ label:'Salary (Earned)', amount:d.earnedSalary, type:'in', color:'#22C55E', icon:'💰', sub:`${d.present}/${d.workDays} days × ${fmt(d.perDay)}/day` });
    (s.incomes || []).slice(1).filter(inc => safeNum(inc?.amount) > 0).forEach(inc =>
      nodes.push({ label:inc.label, amount:safeNum(inc.amount), type:'in', color:'#14B8A6', icon:'💼', sub: inc.recurring ? 'Recurring' : 'Variable' })
    );
    if (d.manualTotal > 0)
      nodes.push({ label:'Manual Expenses', amount:d.manualTotal, type:'out', color:'#F59E0B', icon:'🛒', sub:`${(s.manualExpenses||[]).length} categories` });
    if (d.debtEmi > 0)
      nodes.push({ label:'EMI Payments', amount:d.debtEmi, type:'out', color:'#EF4444', icon:'🏦', sub:`${(s.debts||[]).length} loan${(s.debts||[]).length!==1?'s':''}` });
    if (d.sipTotal > 0)
      nodes.push({ label:'SIP Investments', amount:d.sipTotal, type:'out', color:'#A78BFA', icon:'📈', sub:`${(s.sips||[]).length} fund${(s.sips||[]).length!==1?'s':''}` });
    nodes.push({ label:'Net Balance', amount:d.balance, type:'net', color:d.balance>=0?'#22C55E':'#EF4444', icon:'💵', sub:d.balance>=0?'Available to save / spend':'Over budget!' });
    return nodes;
  }, [s, d]);

  if (d.totalIncome === 0) {
    return (
      <View style={{ flex:1, backgroundColor:T.bg }}>
        <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
          <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Cash Flow</Text>
        </View>
        <View style={{ paddingHorizontal:SP.md }}>
          <Card><Empty icon="🌊" title="No income data" sub="Add your salary in the Money tab to see your cash flow." /></Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom:100 }}>
      <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
        <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Cash Flow</Text>
        <Text style={{ fontSize:13, color:T.t3, marginTop:2 }}>{MONTHS_FULL[s.currentMonth||0]} {s.currentYear||new Date().getFullYear()}</Text>
      </View>

      {/* SUMMARY STRIP */}
      <View style={{ flexDirection:'row', gap:8, marginHorizontal:SP.md, marginBottom:12 }}>
        {[
          { label:'Total In',    val:fmt(d.totalIncome), color:'#22C55E' },
          { label:'Total Out',   val:fmt(totalOut),       color:'#EF4444' },
          { label:'Net Balance', val:fmt(d.balance),      color:d.balance>=0?'#22C55E':'#EF4444' },
        ].map((c,i) => (
          <View key={i} style={{ flex:1, backgroundColor:T.l2, borderRadius:R.md+2, padding:SP.sm+4, borderWidth:1, borderColor:T.border, alignItems:'center' }}>
            <Text style={{ fontSize:14, fontWeight:'800', color:c.color }}>{c.val}</Text>
            <Text style={{ fontSize:10, color:T.t3, marginTop:2, textAlign:'center' }}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* OVERALL PROGRESS */}
      <View style={{ paddingHorizontal:SP.md, marginBottom:12 }}>
        <Card>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
            <Text style={{ fontSize:12, color:T.t3 }}>Income committed: {safePct(totalOut, d.totalIncome)}%</Text>
            <Text style={{ fontSize:12, fontWeight:'700', color:d.balance>=0?'#22C55E':'#EF4444' }}>{safePct(d.balance, d.totalIncome)}% free</Text>
          </View>
          <Bar value={totalOut} total={Math.max(d.totalIncome,1)} color={safePct(totalOut,d.totalIncome)>85?'#EF4444':'#4F8CFF'} h={10} />
        </Card>
      </View>

      {/* FLOW DIAGRAM */}
      <View style={{ paddingHorizontal:SP.md, marginBottom:12 }}>
        <Card>
          <SH title="Money Flow" />
          {flows.map((f, i) => (
            <View key={i}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12 }}>
                <View style={{ width:40, height:40, borderRadius:12, backgroundColor:f.color+'20', alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:18 }}>{f.icon}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[{ fontWeight:'600', fontSize:13 }, f.type==='net' && { fontWeight:'800' }, { color:f.type==='net'?f.color:T.t1 }]}>{f.label}</Text>
                  <Text style={{ fontSize:11, color:T.t3, marginTop:2 }}>{f.sub}</Text>
                  {f.type !== 'net' && (
                    <View style={{ marginTop:6 }}>
                      <Bar value={f.amount} total={Math.max(d.totalIncome,1)} color={f.color} h={3} />
                    </View>
                  )}
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ fontSize:15, fontWeight:'800', color:f.type==='net'?f.color:f.type==='in'?'#22C55E':'#EF4444' }}>
                    {f.type==='net'?'':(f.type==='in'?'+ ':'− ')}{fmt(f.amount)}
                  </Text>
                  {f.type!=='net' && <Text style={{ fontSize:10, color:T.t3, marginTop:2 }}>{safePct(f.amount, d.totalIncome)}%</Text>}
                </View>
              </View>
              {i < flows.length - 2 && <View style={{ paddingLeft:20, paddingVertical:1 }}><View style={{ width:2, height:10, marginLeft:19, backgroundColor:f.color+'35' }} /></View>}
            </View>
          ))}
        </Card>
      </View>

      {/* EXPENSE BREAKDOWN */}
      {(s.manualExpenses||[]).length > 0 && (
        <View style={{ paddingHorizontal:SP.md, marginBottom:12 }}>
          <Card>
            <SH title="Expense Breakdown" />
            {(s.manualExpenses||[]).map((e, i) => (
              <View key={e?.id||i} style={[{ paddingVertical:12 }, i<(s.manualExpenses||[]).length-1 && { borderBottomWidth:1, borderBottomColor:T.border }]}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:9 }}>
                    <Text style={{ fontSize:18 }}>{e?.icon||'💳'}</Text>
                    <View>
                      <Text style={{ fontWeight:'600', fontSize:13, color:T.t1 }}>{e?.cat||'Expense'}</Text>
                      {e?.recurring && <Chip label="Auto" color="#14B8A6" sm />}
                    </View>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ fontSize:14, fontWeight:'700', color:e?.color||T.t1 }}>{fmt(e?.amount||0)}</Text>
                    <Text style={{ fontSize:10, color:T.t3 }}>{safePct(e?.amount, d.totalIncome)}%</Text>
                  </View>
                </View>
                <Bar value={e?.amount||0} total={Math.max(d.totalIncome,1)} color={e?.color||'#4F8CFF'} h={4} />
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* MONTHLY SUMMARY */}
      <View style={{ paddingHorizontal:SP.md }}>
        <Card>
          <SH title="Monthly Summary" />
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:14 }}>
            {[
              { label:'Salary (earned)',  val:fmt(d.earnedSalary),  color:'#22C55E' },
              { label:'Other income',    val:fmt(d.otherIncome),   color:'#14B8A6' },
              { label:'SIP invested',    val:fmt(d.sipTotal),      color:'#A78BFA' },
              { label:'EMI paid',        val:fmt(d.debtEmi),       color:'#EF4444' },
              { label:'Manual expenses', val:fmt(d.manualTotal),   color:'#F59E0B' },
              { label:'Net balance',     val:fmt(d.balance),       color:d.balance>=0?'#22C55E':'#EF4444' },
            ].map((c,i) => (
              <View key={i} style={{ width:'47%', backgroundColor:T.l2, borderRadius:12, padding:12, borderWidth:1, borderColor:T.border }}>
                <Text style={{ fontSize:11, color:T.t3, marginBottom:4 }}>{c.label}</Text>
                <Text style={{ fontSize:16, fontWeight:'800', color:c.color }}>{c.val}</Text>
              </View>
            ))}
          </View>
          <Bar value={totalOut} total={Math.max(d.totalIncome,1)} color='#EF4444' h={6} />
          <Text style={{ fontSize:11, color:T.t3, marginTop:6 }}>{safePct(totalOut,d.totalIncome)}% of income committed this month</Text>
        </Card>
      </View>
    </ScrollView>
  );
}
