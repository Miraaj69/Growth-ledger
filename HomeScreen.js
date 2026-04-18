// HomeScreen.js
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
import { C, S, R, G } from './theme';
import { fmt, pct, derived, calcScore, calcPersonality, calcAlerts, nextAction, smartInsights, deadlineMonths, monthlyNeeded, MONTHS_SHORT } from './calculations';
import { Card, GCard, Chip, Bar, SH, Toggle, Empty } from './UIComponents';
import ScoreRing from './ScoreRing';
import DonutChart from './DonutChart';
import BarChart from './BarChart';
import MonthPicker from './MonthPicker';

export default function HomeScreen({ navigation }) {
  const { state: s, dispatch, set } = useApp();
  const [showAll, setShowAll] = useState(false);

  // ── ALL DERIVED FROM SINGLE SOURCE ─────────────────────────
  const d = useMemo(() => derived(s), [s]);
  const score       = useMemo(() => calcScore(s), [s]);
  const personality = useMemo(() => calcPersonality(s), [s]);
  const alerts      = useMemo(() => calcAlerts(s), [s]);
  const action      = useMemo(() => nextAction(s), [s]);
  const insights    = useMemo(() => smartInsights(s), [s]);

  const bars = s.monthlyData.slice(0, s.currentMonth + 1).map((v, i) => ({ v, l: MONTHS_SHORT[i] })).slice(-6);
  const mask = s.maskAmounts;

  const achievements = useMemo(() => [
    { icon:'🥇', label:'Saver',      unlocked: s.goals.reduce((a,g)=>a+g.saved,0) >= 100000,     color:C.amber  },
    { icon:'📈', label:'Investor',   unlocked: d.sipTotal > 0,                                    color:C.green  },
    { icon:'💪', label:'Debt Buster',unlocked: s.debts.reduce((a,x)=>a+(x.amount-x.remaining),0)>=50000, color:C.blue },
    { icon:'🎓', label:'Certified',  unlocked: s.certifications.filter(c=>c.status==='Done').length>=2, color:C.purple},
    { icon:'🔥', label:'Consistent', unlocked: d.present >= 20,                                  color:C.red    },
    { icon:'👑', label:'Elite',      unlocked: score.total >= 85,                                 color:C.amber  },
  ], [s, d, score]);

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── HEADER ── */}
      <View style={st.header}>
        <View>
          <View style={st.headerRow}>
            <Text style={st.appName}>GROWTH LEDGER</Text>
            <View style={[st.lvlBadge, { backgroundColor: C.amber+'22' }]}>
              <Text style={[st.lvlText, { color: C.amber }]}>Lv {s.level || 1}</Text>
            </View>
          </View>
          <Text style={st.pageTitle}>Dashboard</Text>
        </View>
        <View style={st.headerRight}>
          <Pressable onPress={() => navigation?.navigate?.('AIChat')} style={[st.iconBtn, { backgroundColor: C.blue+'22', borderColor: C.blue+'33' }]}>
            <Text style={{ fontSize:18 }}>🤖</Text>
          </Pressable>
          <MonthPicker month={s.currentMonth} year={s.currentYear}
            onChange={(m, y) => set({ currentMonth:m, currentYear:y, attendance: new Set() })} />
        </View>
      </View>

      {/* ── XP BAR ── */}
      <View style={st.xpWrap}>
        <View style={st.xpRow}>
          <Text style={st.xpLabel}>XP · Level {s.level||1}</Text>
          <Text style={[st.xpVal, { color: C.amber }]}>{s.xpTotal||0} / 2000</Text>
        </View>
        <Bar value={s.xpTotal||0} total={2000} color={C.amber} h={4} />
      </View>

      {/* ── HERO EARNED CARD — uses totalIncome from derived() ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)} style={st.mx}>
        <GCard colors={G.hero} style={{ marginBottom: 12, overflow:'hidden' }}>
          <View style={st.heroBubble} />
          <Text style={st.heroSub}>Earned This Month</Text>
          <Text style={st.heroAmt}>{mask ? '₹••,•••' : fmt(d.earnedSalary)}</Text>
          <Text style={st.heroMeta}>
            of {mask ? '₹••,•••' : fmt(s.salary)} · {d.present}/{s.workingDays} days
          </Text>
          <Bar value={d.present} total={s.workingDays} color="rgba(255,255,255,0.6)" h={4} />
          <View style={st.heroStats}>
            {[
              { l:'Per Day', v: fmt(d.perDay),         c:'rgba(255,255,255,0.85)' },
              { l:'Lost',    v: fmt(d.lostSalary),      c:'#fca5a5' },
              { l:'Balance', v: fmt(d.balance),          c:'#86efac' },
            ].map(({ l, v, c }) => (
              <View key={l}>
                <Text style={st.heroStatL}>{l}</Text>
                <Text style={[st.heroStatV, { color: c }]}>{mask ? '₹••' : v}</Text>
              </View>
            ))}
          </View>
        </GCard>
      </Animated.View>

      {/* ── SCORE + PERSONALITY ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[st.row2, st.mx]}>
        <Card style={[st.half, { paddingBottom: S.sm }]}>
          <Text style={st.cardLabel}>HEALTH SCORE</Text>
          <View style={{ flexDirection:'row', gap:10, alignItems:'center' }}>
            <ScoreRing score={score.total} color={score.color} size={70} sw={7} />
            <View style={{ flex:1, gap:5 }}>
              <Text style={[st.scoreLabel, { color: score.color }]} numberOfLines={2}>{score.label}</Text>
              {score.breakdown.slice(0,3).map(b => <Bar key={b.label} value={b.score} total={b.max} color={b.color} h={3} />)}
            </View>
          </View>
        </Card>
        <LinearGradient colors={[personality.bg||'#1a0a38', personality.color+'18']}
          style={[st.half, st.halfGrad]} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Text style={st.cardLabel}>PERSONALITY</Text>
          <Text style={[st.persType, { color: personality.color }]}>{personality.type}</Text>
          <Text style={st.persDesc} numberOfLines={3}>{personality.desc}</Text>
        </LinearGradient>
      </Animated.View>

      {/* ── NEXT ACTION ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(150)} style={st.mx}>
        <Pressable style={[st.actionCard, { borderColor: action.color+'30', backgroundColor: action.color+'10' }]}
          onPress={() => navigation?.navigate?.('AIChat')}>
          <View style={[st.actionIcon, { backgroundColor: action.color+'22' }]}>
            <Text style={{ fontSize:20 }}>{action.icon}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={[st.actionTag, { color: action.color }]}>NEXT ACTION</Text>
            <Text style={st.actionTitle}>{action.title}</Text>
            <Text style={st.actionDesc} numberOfLines={2}>{action.desc}</Text>
          </View>
          <Text style={{ color: C.t3, fontSize:18 }}>›</Text>
        </Pressable>
      </Animated.View>

      {/* ── SMART INSIGHTS ── */}
      {insights.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={st.mx}>
          <Card style={{ marginBottom:12 }}>
            <SH title="🧠 Smart Insights" right={showAll ? 'Less' : `All ${insights.length}`} onRight={() => setShowAll(!showAll)} />
            {(showAll ? insights : insights.slice(0,2)).map((ins, i) => (
              <View key={i} style={[st.insightRow, { backgroundColor: ins.color+'10', borderColor: ins.color+'28' }]}>
                <Text style={{ fontSize:16 }}>{ins.icon}</Text>
                <View style={{ flex:1 }}>
                  <Text style={[st.insightMsg, { color: ins.color }]}>{ins.msg}</Text>
                  {ins.action && <Text style={[st.insightAct, { color: ins.color }]}>→ {ins.action}</Text>}
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* ── ALERTS ── */}
      {alerts.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={st.mx}>
          <Card style={{ marginBottom:12 }}>
            <SH title="Smart Alerts" right={`${alerts.length}`} rc={C.red} />
            {alerts.slice(0,3).map((a, i) => (
              <View key={i} style={[st.alertRow, { backgroundColor: a.color+'10', borderColor: a.color+'25', marginBottom: i<2?7:0 }]}>
                <Text style={{ fontSize:14 }}>{a.icon}</Text>
                <Text style={[st.alertMsg, { color: a.color }]}>{a.msg}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* ── NET WORTH + INCOME — BOTH use derived() ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(250)} style={[st.row2, st.mx]}>
        <GCard colors={G.green} style={st.half}>
          <Text style={[st.cardLabel, { color:'rgba(255,255,255,0.4)' }]}>Net Worth</Text>
          <Text style={[st.halfVal, { color: C.green }]}>{mask ? '₹•L' : fmt(d.netWorth)}</Text>
          <Text style={[st.halfSub, { color:'rgba(255,255,255,0.28)' }]}>Assets − Debts</Text>
        </GCard>
        <Card style={st.half}>
          <Text style={st.cardLabel}>Total Income</Text>
          {/* This totalIncome = earnedSalary + other — same as CashFlow */}
          <Text style={[st.halfVal, { color: C.blue }]}>{fmt(d.totalIncome)}</Text>
          <Text style={st.halfSub}>{s.incomes.length} source{s.incomes.length!==1?'s':''}</Text>
        </Card>
      </Animated.View>

      {/* ── QUICK STATS ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginLeft: S.md, marginBottom:12 }} contentContainerStyle={{ gap:10, paddingRight:S.md }}>
        {[
          { icon:'📈', label:'SIP/mo',  val: fmt(d.sipTotal),   color: C.green  },
          { icon:'🏦', label:'EMI/mo',  val: fmt(d.debtEmi),    color: C.red    },
          { icon:'💳', label:'Debt',    val: fmt(d.debtTotal),  color: C.purple },
          { icon:'💰', label:'Balance', val: fmt(d.balance),    color: d.balance > 5000 ? C.green : C.red },
        ].map((c, i) => (
          <Card key={i} style={{ padding:S.md, minWidth:130 }}>
            <Text style={{ fontSize:20, marginBottom:6 }}>{c.icon}</Text>
            <Text style={{ fontSize:10, color:C.t3, marginBottom:2 }}>{c.label}</Text>
            <Text style={{ fontSize:17, fontWeight:'800', color:c.color }}>{c.val}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* ── ACHIEVEMENTS ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={st.mx}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Achievements" right={`${achievements.filter(a=>a.unlocked).length}/${achievements.length}`} rc={C.amber} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:12 }}>
            {achievements.map((a, i) => (
              <View key={i} style={{ width:64, alignItems:'center' }}>
                <View style={[st.achIcon, { backgroundColor: a.unlocked?a.color+'22':C.l2, borderColor: a.unlocked?a.color+'44':C.border, opacity: a.unlocked?1:0.3 }]}>
                  <Text style={{ fontSize:20 }}>{a.icon}</Text>
                </View>
                <Text style={{ fontSize:10, fontWeight:'600', color: a.unlocked?C.t2:C.t3, textAlign:'center', marginTop:4 }}>{a.label}</Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      </Animated.View>

      {/* ── EXPENSE DONUT ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(320)} style={st.mx}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Expense Split" />
          <View style={{ flexDirection:'row', alignItems:'center', gap:16 }}>
            <DonutChart segments={s.expenses.map(e=>({pct:e.pct,color:e.color}))} size={96} sw={13} centerLabel={fmt(s.salary)} />
            <View style={{ flex:1 }}>
              {s.expenses.map((e, i) => (
                <View key={i} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:7 }}>
                    <View style={{ width:8, height:8, borderRadius:3, backgroundColor:e.color }} />
                    <Text style={{ fontSize:13, color:C.t2 }}>{e.label}</Text>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={{ fontWeight:'700', fontSize:13, color:e.color }}>{fmt(s.salary*e.pct/100)}</Text>
                    <Text style={{ fontSize:10, color:C.t3 }}>{e.pct}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* ── GOALS ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(340)} style={st.mx}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Financial Goals" />
          {s.goals.map((g, i) => {
            const mLeft = deadlineMonths(g.deadline);
            const mNeed = monthlyNeeded(g.target, g.saved, mLeft);
            return (
              <View key={i} style={[st.goalItem, i<s.goals.length-1 && st.goalBorder]}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:7 }}>
                  <View>
                    <Text style={st.goalTitle}>{g.title}</Text>
                    {g.linked && <Chip label={`← ${g.linked}`} color={g.color} sm />}
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={[st.goalPct, { color:g.color }]}>{pct(g.saved,g.target)}%</Text>
                    <Text style={st.goalEta}>{mLeft} mo left</Text>
                  </View>
                </View>
                <Bar value={g.saved} total={g.target} color={g.color} h={5} />
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:5 }}>
                  <Text style={st.goalAmt}>{fmt(g.saved)}</Text>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={st.goalAmt}>{fmt(g.target)}</Text>
                    {mNeed > 0 && <Text style={[st.goalNeed, { color:g.color }]}>Save {fmt(mNeed)}/mo</Text>}
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      </Animated.View>

      {/* ── EARNINGS CHART ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(360)} style={st.mx}>
        <Card>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <SH title="Earnings Trend" />
            <View style={{ alignItems:'flex-end' }}>
              <Text style={{ fontWeight:'800', fontSize:17, color:C.green }}>{fmt(s.monthlyData.slice(0,s.currentMonth+1).reduce((a,v)=>a+v,0))}</Text>
              <Text style={{ fontSize:11, color:C.t3 }}>YTD</Text>
            </View>
          </View>
          <BarChart data={bars} color={C.blue} height={64} />
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:   { flex:1, backgroundColor: C.bg },
  mx:          { marginHorizontal: S.md, marginBottom: 12 },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:56, paddingHorizontal:S.md, paddingBottom:S.md },
  headerRow:   { flexDirection:'row', alignItems:'center', gap:8, marginBottom:3 },
  headerRight: { flexDirection:'row', alignItems:'center', gap:8 },
  appName:     { fontSize:12, fontWeight:'600', color:C.t3, letterSpacing:0.5 },
  lvlBadge:    { paddingHorizontal:8, paddingVertical:2, borderRadius:99 },
  lvlText:     { fontSize:10, fontWeight:'700' },
  pageTitle:   { fontSize:27, fontWeight:'800', color:C.t1, letterSpacing:-0.5 },
  iconBtn:     { width:40, height:40, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center' },
  xpWrap:      { marginHorizontal:S.md, marginBottom: S.md },
  xpRow:       { flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  xpLabel:     { fontSize:11, color:C.t3 },
  xpVal:       { fontSize:11, fontWeight:'600' },
  heroBubble:  { position:'absolute', top:-40, right:-20, width:150, height:150, borderRadius:75, backgroundColor:'rgba(255,255,255,0.04)' },
  heroSub:     { fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.45)', letterSpacing:1.2, textTransform:'uppercase', marginBottom:10 },
  heroAmt:     { fontSize:38, fontWeight:'800', color:'#fff', letterSpacing:-2, lineHeight:44, marginBottom:4 },
  heroMeta:    { fontSize:13, color:'rgba(255,255,255,0.32)', marginBottom:14 },
  heroStats:   { flexDirection:'row', gap:20, marginTop:16 },
  heroStatL:   { fontSize:10, color:'rgba(255,255,255,0.32)', marginBottom:2 },
  heroStatV:   { fontSize:15, fontWeight:'700' },
  row2:        { flexDirection:'row', gap:10, marginBottom:12 },
  half:        { flex:1, padding:S.md, gap:6 },
  halfGrad:    { borderRadius:20, borderWidth:1, borderColor:C.border },
  cardLabel:   { fontSize:10, fontWeight:'600', color:C.t3, letterSpacing:0.5, textTransform:'uppercase', marginBottom:8 },
  halfVal:     { fontSize:20, fontWeight:'800' },
  halfSub:     { fontSize:10, color:C.t3, marginTop:2 },
  scoreLabel:  { fontSize:12, fontWeight:'700', lineHeight:16, marginBottom:6 },
  persType:    { fontSize:13, fontWeight:'800', lineHeight:18 },
  persDesc:    { fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:16, marginTop:5 },
  actionCard:  { borderRadius:18, padding:S.md, flexDirection:'row', gap:12, alignItems:'center', borderWidth:1, marginBottom:0 },
  actionIcon:  { width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center' },
  actionTag:   { fontSize:10, fontWeight:'600', letterSpacing:0.3, marginBottom:1 },
  actionTitle: { fontWeight:'700', fontSize:14, color:C.t1, marginBottom:1 },
  actionDesc:  { fontSize:12, color:C.t2, lineHeight:17 },
  insightRow:  { flexDirection:'row', gap:9, padding:S.sm+4, borderRadius:12, borderWidth:1, marginBottom:8, alignItems:'flex-start' },
  insightMsg:  { fontSize:12, lineHeight:18 },
  insightAct:  { fontSize:11, fontWeight:'600', marginTop:3 },
  alertRow:    { flexDirection:'row', gap:8, padding:10, borderRadius:11, borderWidth:1, alignItems:'flex-start' },
  alertMsg:    { fontSize:12, lineHeight:18, flex:1 },
  achIcon:     { width:50, height:50, borderRadius:15, alignItems:'center', justifyContent:'center', borderWidth:1 },
  goalItem:    { paddingVertical:S.md },
  goalBorder:  { borderBottomWidth:1, borderBottomColor:C.border },
  goalTitle:   { fontWeight:'600', fontSize:14, color:C.t1, marginBottom:4 },
  goalPct:     { fontWeight:'700', fontSize:13 },
  goalEta:     { fontSize:10, color:C.t3, marginTop:1 },
  goalAmt:     { fontSize:11, color:C.t3 },
  goalNeed:    { fontSize:10, marginTop:1 },
});
