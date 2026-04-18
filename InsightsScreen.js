
// CRASH-PROOF: every value wrapped in safe helpers, try/catch on all calcs
import React, { useMemo, memo } from 'react';
import { ScrollView, View, Text, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import {
  fmt, fmtPct, safePct, deriveState, calcScore,
  buildInsights, MONTHS_SHORT,
} from './helpers';
import { SPACING as SP } from './theme';
import { Card, GCard, Chip, Bar, SectionHeader, Empty, AlertRow, StatRow } from './UI';
import { ScoreRing, BarChart } from './Charts';

// ── Category breakdown item ───────────────────────────────
const CatRow = memo(({ exp, totalIncome }) => {
  const { T } = useTheme();
  const amt = Number(exp?.amount) || 0;
  const pctVal = safePct(amt, totalIncome);
  const isOver = totalIncome > 0 && pctVal > 30;
  return (
    <View style={{ paddingVertical:10, borderBottomWidth:1, borderBottomColor:T.border }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ fontSize:18 }}>{exp?.icon || '💳'}</Text>
          <View>
            <Text style={{ fontSize:13, fontWeight:'600', color:T.t1 }}>{exp?.cat || 'Unknown'}</Text>
            {isOver && <Text style={{ fontSize:10, color:'#EF4444', marginTop:1 }}>High spending</Text>}
          </View>
        </View>
        <View style={{ alignItems:'flex-end' }}>
          <Text style={{ fontSize:14, fontWeight:'700', color: isOver?'#EF4444': exp?.color||T.t1 }}>{fmt(amt)}</Text>
          <Text style={{ fontSize:10, color:T.t3 }}>{pctVal}% of income</Text>
        </View>
      </View>
      <Bar value={amt} total={Math.max(totalIncome, 1)} color={isOver?'#EF4444': exp?.color||'#4F8CFF'} h={4} />
    </View>
  );
});

// ── Transaction row ───────────────────────────────────────
const TxnRow = memo(({ txn, last }) => {
  const { T } = useTheme();
  return (
    <View style={[{ flexDirection:'row', alignItems:'center', paddingVertical:10, gap:10 }, !last && { borderBottomWidth:1, borderBottomColor:T.border }]}>
      <View style={{ width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center', backgroundColor: txn?.type==='income'?'#22C55E10':'#1A2332' }}>
        <Text style={{ fontSize:15 }}>{txn?.icon || (txn?.type==='income'?'💰':'💳')}</Text>
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontWeight:'600', fontSize:13, color:T.t1 }} numberOfLines={1}>{txn?.desc || 'Transaction'}</Text>
        <Text style={{ fontSize:11, color:T.t3, marginTop:1 }}>{txn?.date || ''}</Text>
      </View>
      <Text style={{ fontWeight:'700', fontSize:13, color: txn?.type==='income'?'#22C55E':T.t1 }}>
        {txn?.type==='income'?'+':'-'}{fmt(txn?.amount||0)}
      </Text>
    </View>
  );
});

// ── MAIN SCREEN ───────────────────────────────────────────
export default function InsightsScreen() {
  // All hooks at top — no conditionals before hooks
  const { state: s } = useApp();
  const { T }        = useTheme();

  // SAFE derived values — wrapped in try/catch inside helper
  const d = useMemo(() => {
    try { return deriveState(s); }
    catch (err) { console.warn('[InsightsScreen] deriveState error:', err); return { totalIncome:0, sipTotal:0, debtTotal:0, manualTotal:0, balance:0, savePct:0, netWorth:0, totalAssets:0 }; }
  }, [s]);

  const score = useMemo(() => {
    try { return calcScore(s); }
    catch (err) { console.warn('[InsightsScreen] calcScore error:', err); return { total:0, color:'#EF4444', label:'No data', breakdown:[] }; }
  }, [s]);

  const insights = useMemo(() => {
    try { return buildInsights(s); }
    catch (err) { console.warn('[InsightsScreen] buildInsights error:', err); return [{ icon:'💡', msg:'Add your data to see insights', color:'#4F8CFF' }]; }
  }, [s]);

  const bars = useMemo(() => {
    try {
      return (s.monthlyData || []).slice(0, (s.currentMonth||0) + 1).map((v, i) => ({ v: Number(v)||0, l: MONTHS_SHORT[i] || '' })).slice(-6);
    } catch { return []; }
  }, [s.monthlyData, s.currentMonth]);

  const sbars = useMemo(() => {
    try {
      return (s.spendData || []).slice(0, (s.currentMonth||0) + 1).map((v, i) => ({ v: Number(v)||0, l: MONTHS_SHORT[i] || '' })).slice(-6);
    } catch { return []; }
  }, [s.spendData, s.currentMonth]);

  const manualExpenses = useMemo(() => (s.manualExpenses || []), [s.manualExpenses]);
  const transactions   = useMemo(() => (s.transactions || []), [s.transactions]);
  const leaves         = useMemo(() => (s.leaves || []), [s.leaves]);
  const assets         = useMemo(() => (s.assets || []), [s.assets]);
  const debts          = useMemo(() => (s.debts || []), [s.debts]);

  // Category spending breakdown
  const catData = useMemo(() => {
    try {
      if (!manualExpenses.length || d.totalIncome === 0) return [];
      return [...manualExpenses].sort((a, b) => (Number(b?.amount)||0) - (Number(a?.amount)||0));
    } catch { return []; }
  }, [manualExpenses, d.totalIncome]);

  // ── Overspend detection ──────────────────────────────────
  const overspendCats = useMemo(() => {
    try {
      return manualExpenses.filter(e => {
        const amt = Number(e?.amount) || 0;
        return d.totalIncome > 0 && safePct(amt, d.totalIncome) > 25;
      });
    } catch { return []; }
  }, [manualExpenses, d.totalIncome]);

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom:100 }}>

      {/* HEADER */}
      <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
        <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Insights</Text>
        <Text style={{ fontSize:13, color:T.t3, marginTop:2 }}>Analytics · Risk · Patterns</Text>
      </View>

      {/* SUMMARY CARDS */}
      <Animated.View entering={FadeInDown.duration(350).delay(50)}>
        <View style={{ flexDirection:'row', gap:8, marginHorizontal:SP.md, marginBottom:12 }}>
          {[
            { label:'Total Income',  val:fmt(d.totalIncome), color:'#22C55E', icon:'💰' },
            { label:'Total Spent',   val:fmt(d.manualTotal + d.debtEmi), color:'#EF4444', icon:'💸' },
            { label:'Savings Rate',  val:fmtPct(d.savePct), color: d.savePct>=20?'#22C55E':d.savePct>=10?'#F59E0B':'#EF4444', icon:'💰' },
          ].map((c, i) => (
            <View key={i} style={{ flex:1, backgroundColor:T.l2, borderRadius:R_val.md+2, padding:SP.sm+4, borderWidth:1, borderColor:T.border, alignItems:'center' }}>
              <Text style={{ fontSize:18, marginBottom:4 }}>{c.icon}</Text>
              <Text style={{ fontSize:14, fontWeight:'800', color:c.color }}>{c.val}</Text>
              <Text style={{ fontSize:10, color:T.t3, marginTop:2, textAlign:'center' }}>{c.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* SCORE */}
      <Animated.View entering={FadeInDown.duration(350).delay(80)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SectionHeader title="Financial Health Score" />
          {d.totalIncome === 0 ? (
            <Empty icon="📊" title="No data yet" sub="Enter your salary in the Money tab to see your financial health score." />
          ) : (
            <View style={{ flexDirection:'row', gap:16, alignItems:'center' }}>
              <ScoreRing score={score.total} color={score.color} size={108} sw={10} />
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:16, fontWeight:'700', color:score.color, marginBottom:10 }}>{score.label}</Text>
                {(score.breakdown||[]).map((b, i) => (
                  <View key={b.label||i} style={{ marginBottom:8 }}>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:3 }}>
                      <Text style={{ fontSize:11, color:T.t3 }}>{b.label}</Text>
                      <Text style={{ fontSize:11, fontWeight:'600', color:b.color }}>{b.score}/{b.max}</Text>
                    </View>
                    <Bar value={b.score} total={b.max} color={b.color} h={4} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
      </Animated.View>

      {/* SMART INSIGHTS */}
      <Animated.View entering={FadeInDown.duration(350).delay(110)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SectionHeader title="🧠 Smart Insights" />
          {insights.map((ins, i) => (
            <AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i===insights.length-1} />
          ))}
        </Card>
      </Animated.View>

      {/* OVERSPEND ALERT */}
      {overspendCats.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350).delay(130)} style={{ marginHorizontal:SP.md }}>
          <GCard colors={['#1f0a0a','#3d0a0a']} style={{ marginBottom:12 }}>
            <SectionHeader title="⚠️ Overspending Alert" rightColor="#EF4444" />
            {overspendCats.map((e, i) => (
              <View key={i} style={{ backgroundColor:'#EF444410', borderRadius:11, padding:SP.sm+2, marginBottom:7, borderWidth:1, borderColor:'#EF444428', flexDirection:'row', gap:9, alignItems:'flex-start' }}>
                <Text style={{ fontSize:16 }}>{e.icon||'💳'}</Text>
                <Text style={{ color:'#EF4444', fontSize:12, lineHeight:18, flex:1 }}>
                  <Text style={{ fontWeight:'700' }}>{e.cat}</Text> {fmt(e.amount)} = {safePct(e.amount,d.totalIncome)}% of income. Reduce to below 25%.
                </Text>
              </View>
            ))}
          </GCard>
        </Animated.View>
      )}

      {/* HIGH RATE DEBT RISK */}
      {debts.some(d_ => Number(d_?.rate||0) >= 24) && (
        <Animated.View entering={FadeInDown.duration(350).delay(150)} style={{ marginHorizontal:SP.md }}>
          <Card style={{ marginBottom:12, borderColor:'#EF444430', borderWidth:1 }}>
            <SectionHeader title="🔥 High-Rate Debt Risk" rightColor="#EF4444" />
            {debts.filter(d_ => Number(d_?.rate||0) >= 24).map((dbt, i) => (
              <AlertRow key={i} icon="🔥" msg={`${dbt.name||'Loan'} at ${dbt.rate}% — this rate eats your wealth. Pay ₹2K extra/mo.`} color="#EF4444" last={i===debts.length-1} />
            ))}
          </Card>
        </Animated.View>
      )}

      {/* TRANSACTIONS */}
      <Animated.View entering={FadeInDown.duration(350).delay(170)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SectionHeader title="Recent Transactions" right={transactions.length > 0 ? `${transactions.length} total` : undefined} />
          {transactions.length === 0 ? (
            <Empty icon="📋" title="No transactions yet" sub="Add expenses in the Money tab." />
          ) : (
            transactions.slice(0,5).map((txn, i) => (
              <TxnRow key={txn?.id||i} txn={txn} last={i===Math.min(4,transactions.length-1)} />
            ))
          )}
        </Card>
      </Animated.View>

      {/* CATEGORY BREAKDOWN */}
      <Animated.View entering={FadeInDown.duration(350).delay(190)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SectionHeader title="Spending by Category" />
          {catData.length === 0 ? (
            <Empty icon="💳" title="No expenses added" sub="Add your monthly expenses to see category breakdown." />
          ) : (
            catData.map((exp, i) => (
              <CatRow key={exp?.id||i} exp={exp} totalIncome={d.totalIncome} />
            ))
          )}
        </Card>
      </Animated.View>

      {/* CHARTS */}
      <Animated.View entering={FadeInDown.duration(350).delay(210)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <SectionHeader title="Earnings Trend" />
            <View style={{ alignItems:'flex-end' }}>
              <Text style={{ fontWeight:'800', fontSize:17, color:'#22C55E' }}>
                {fmt((s.monthlyData||[]).slice(0,(s.currentMonth||0)+1).reduce((a,v)=>a+(Number(v)||0),0))}
              </Text>
              <Text style={{ fontSize:11, color:T.t3 }}>YTD</Text>
            </View>
          </View>
          {bars.every(b => b.v === 0)
            ? <Empty icon="📈" title="No earnings data" sub="Your salary data will appear here month by month." />
            : <BarChart data={bars} color="#4F8CFF" height={64} />
          }
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(350).delay(225)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SectionHeader title="Spending Trend" />
          {sbars.every(b => b.v === 0)
            ? <Empty icon="📉" title="No spending data" sub="Add expenses to see spending trends." />
            : (
              <>
                <BarChart data={sbars} color="#F59E0B" height={56} />
                <View style={{ marginTop:12 }}>
                  <Bar value={d.manualTotal} total={Math.max(d.totalIncome,1)} color="#EF4444" h={5} />
                  <Text style={{ fontSize:11, color:T.t3, marginTop:5 }}>
                    {safePct(d.manualTotal, d.totalIncome)}% of income spent on manual expenses
                  </Text>
                </View>
              </>
            )
          }
        </Card>
      </Animated.View>

      {/* LEAVE BALANCE */}
      {leaves.length > 0 && leaves.some(l => l.total > 0) && (
        <Animated.View entering={FadeInDown.duration(350).delay(240)} style={{ marginHorizontal:SP.md }}>
          <Card style={{ marginBottom:12 }}>
            <SectionHeader title="Leave Balance" />
            {leaves.map((l, i) => {
              const left = (l.total||0) - (l.used||0);
              return (
                <View key={l.type||i} style={{ paddingVertical:SP.md, borderBottomWidth: i<leaves.length-1?1:0, borderBottomColor:T.border }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                    <Text style={{ color:T.t2, fontSize:13 }}>{l.label} ({l.type})</Text>
                    <View style={{ alignItems:'flex-end' }}>
                      <Text style={{ fontSize:13, fontWeight:'700', color:T.t1 }}>
                        {left} <Text style={{ fontWeight:'400', color:T.t3 }}>/ {l.total} left</Text>
                      </Text>
                      {left === 0 && <Text style={{ color:'#EF4444', fontSize:11, marginTop:1 }}>Exhausted</Text>}
                    </View>
                  </View>
                  <Bar value={left} total={Math.max(l.total,1)} color={left<=1?'#EF4444':'#22C55E'} h={5} />
                </View>
              );
            })}
          </Card>
        </Animated.View>
      )}

      {/* NET WORTH */}
      <Animated.View entering={FadeInDown.duration(350).delay(255)} style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SectionHeader title="Net Worth" />
          <View style={{ flexDirection:'row', gap:7, marginBottom:14, flexWrap:'wrap' }}>
            <Chip label={`Assets: ${fmt(d.totalAssets)}`} color="#22C55E" />
            <Chip label={`Debts: ${fmt(d.debtTotal)}`}   color="#EF4444" />
          </View>
          {assets.length === 0 ? (
            <Empty icon="🏦" title="No assets added" sub="Add your savings and investments in the Money tab." />
          ) : (
            assets.map((a, i) => (
              <StatRow key={a?.id||i} label={a?.label||'Asset'} value={fmt(a?.value||0)} color="#22C55E" last={i===assets.length-1} />
            ))
          )}
          <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:T.border, flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ fontSize:14, fontWeight:'700', color:T.t1 }}>Net Worth</Text>
            <Text style={{ fontSize:19, fontWeight:'800', color:d.netWorth>=0?'#22C55E':'#EF4444' }}>{fmt(Math.abs(d.netWorth))}</Text>
          </View>
        </Card>
      </Animated.View>

    </ScrollView>
  );
}

// Local alias for RADIUS (avoids import conflict with SectionHeader)
const R_val = { md:12, xl:20 };
