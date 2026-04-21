// SimulatorScreen.js — Charts + Smart Insights + Premium UI
import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import { SPACING as SP } from './theme';
import { Card, SH, Bar, Chip, Input, StatRow, GCard, AlertRow } from './UI';
import { fmt, fmtShort, safeNum, sipMaturity, retirementCorpus, monthlyNeeded } from './helpers';

const W = Dimensions.get('window').width;
const CHART_W = W - 64;

// ── Safe chart-kit import ─────────────────────────────────
let LineChart, BarChart, PieChart;
try {
  const ckit = require('react-native-chart-kit');
  LineChart  = ckit.LineChart;
  BarChart   = ckit.BarChart;
  PieChart   = ckit.PieChart;
} catch {
  const FB = ({ height = 160 }) => (
    <View style={{ height, alignItems:'center', justifyContent:'center', borderRadius:12, backgroundColor:'rgba(255,255,255,0.04)' }}>
      <Text style={{ color:'#475569', fontSize:12 }}>Install: npm install react-native-chart-kit</Text>
    </View>
  );
  LineChart = BarChart = PieChart = FB;
}

function PillTabs({ tabs, active, onChange }) {
  const { T } = useTheme();
  return (
    <View style={{ flexDirection:'row', marginHorizontal:SP.md, backgroundColor:T.l2,
      borderRadius:16, padding:5, gap:4, marginBottom:16, borderWidth:1, borderColor:T.border }}>
      {tabs.map(({ key, label }) => {
        const on = active === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={{ flex:1 }}>
            <View style={[{ paddingVertical:10, borderRadius:12, alignItems:'center', justifyContent:'center' },
              on && { backgroundColor:'#4F8CFF', shadowColor:'#4F8CFF', shadowOpacity:0.5,
                shadowRadius:12, shadowOffset:{ width:0, height:3 }, elevation:7 }]}>
              <Text style={{ fontSize:12, fontWeight:on?'700':'500', color:on?'#fff':T.t3 }}>{label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChartToggle({ type, onChange }) {
  const { T } = useTheme();
  return (
    <View style={{ flexDirection:'row', backgroundColor:T.l2, borderRadius:10, padding:4, gap:4, borderWidth:1, borderColor:T.border }}>
      {[['line','📈'],['bar','📊'],['pie','🥧']].map(([k, icon]) => (
        <Pressable key={k} onPress={() => onChange(k)}
          style={[{ paddingHorizontal:12, paddingVertical:6, borderRadius:7 }, k===type && { backgroundColor:'#4F8CFF' }]}>
          <Text style={{ fontSize:14, color:k===type?'#fff':T.t3 }}>{icon}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const fmtAxis = (v) => {
  const n = Number(v);
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`;
  if (n > 0)         return `₹${n}`;
  return '₹0';
};

const mkCfg = (T, hex = '#4F8CFF') => ({
  backgroundGradientFrom:       T.l1,
  backgroundGradientTo:         T.l1,
  backgroundGradientFromOpacity:0,
  backgroundGradientToOpacity:  0,
  color:       (o = 1) => `${hex}${Math.round(o*255).toString(16).padStart(2,'0')}`,
  labelColor:  ()      => '#94A3B8',
  strokeWidth: 2.5,
  barPercentage: 0.65,
  decimalPlaces: 0,
  propsForDots:            { r:'5', strokeWidth:'2', stroke:hex },
  propsForBackgroundLines: { stroke:'rgba(255,255,255,0.06)', strokeWidth:1 },
  propsForLabels:          { fontSize: 10, fontWeight: '600' },
});

const calcStepUp = (mo, yr, ret, su) => {
  let total = 0, cur = safeNum(mo);
  const r = safeNum(ret) / 100 / 12, pts = [];
  for (let m = 0; m < yr * 12; m++) {
    if (m > 0 && m % 12 === 0) cur *= (1 + safeNum(su) / 100);
    total = total * (1 + r) + cur;
    if ((m + 1) % 12 === 0) pts.push(Math.round(total));
  }
  return { corpus: Math.round(total), pts };
};

const sipInsights = (mo, inv, corpus, yr, ret) => {
  const profit = corpus - inv, r72 = ret > 0 ? Math.round(72/ret) : 0;
  return [
    profit > inv
      ? { icon:'🔥', msg:`Profit (${fmtShort(profit)}) exceeds investment — compounding is powering your wealth!`, color:'#22C55E' }
      : { icon:'⏳', msg:`Extend duration or increase step-up to maximise compounding.`, color:'#4F8CFF' },
    r72 > 0 ? { icon:'⚡', msg:`Rule of 72: money doubles every ~${r72} years at ${ret}% returns.`, color:'#A78BFA' } : null,
    mo >= 500 && yr >= 10 ? { icon:'💡', msg:`Starting 1 year late costs ≈ ${fmtShort(mo*12*(ret/100))} in missed returns.`, color:'#F59E0B' } : null,
    { icon:'🚀', msg:`Your ${fmtShort(inv)} becomes ${fmtShort(corpus)} — a ${(corpus/Math.max(inv,1)).toFixed(1)}x return!`, color:'#22C55E' },
  ].filter(Boolean);
};

// ── SIP TAB ───────────────────────────────────────────────
function SipTab() {
  const { T } = useTheme();
  const [mo,    setMo]    = useState('5000');
  const [ret,   setRet]   = useState('12');
  const [yr,    setYr]    = useState('10');
  const [su,    setSu]    = useState('10');
  const [cType, setCType] = useState('line');
  const [vMode, setVMode] = useState('total');

  const R = useMemo(() => {
    const m = safeNum(mo), r = safeNum(ret), y = Math.max(1, safeNum(yr)), s = safeNum(su);
    if (m === 0) return null;
    const suR  = calcStepUp(m, y, r, s);
    const inv  = m * 12 * y;
    const flat = sipMaturity(m, y*12, r);
    const c1=sipMaturity(m,12,r), c3=sipMaturity(m,36,r), c5=sipMaturity(m,60,r), c10=sipMaturity(m,120,r);
    // Line pts
    const pts = Math.min(y, 10), step = Math.max(1, Math.ceil(y/pts));
    const ll=[], lv=[], ip=[];
    for (let i = step; i <= y; i += step) { ll.push(`Y${i}`); lv.push(calcStepUp(m,i,r,s).corpus); ip.push(m*12*i); }
    if (!ll.includes(`Y${y}`)) { ll.push(`Y${y}`); lv.push(suR.corpus); ip.push(inv); }
    // Bar
    const ms = [{l:'1Y',c:c1,i:m*12},{l:'3Y',c:c3,i:m*36},{l:'5Y',c:c5,i:m*60},{l:'10Y',c:c10,i:m*120}].filter((_,idx)=>y>=[1,3,5,10][idx]);
    return { suR, inv, flat, c1,c3,c5,c10, ll, lv, ip, ms, y, r, m, profit:suR.corpus-inv,
      insights: sipInsights(m, inv, suR.corpus, y, r) };
  }, [mo, ret, yr, su]);

  return (
    <View style={{ paddingHorizontal:SP.md }}>
      <Card style={{ marginBottom:12 }}>
        <SH title="SIP Parameters" />
        <Input label="Monthly SIP (₹)" value={mo} onChange={setMo} type="numeric" prefix="₹" placeholder="5000" />
        <View style={{ flexDirection:'row', gap:10 }}>
          <Input label="Return %" value={ret} onChange={setRet} type="numeric" suffix="%" style={{ flex:1 }} />
          <Input label="Years" value={yr} onChange={setYr} type="numeric" style={{ flex:1 }} />
        </View>
        <Text style={{ fontSize:13, color:T.t2, fontWeight:'600', marginBottom:8 }}>
          Annual Step-Up: <Text style={{ color:'#A78BFA' }}>{safeNum(su)}%</Text>
        </Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <Pressable onPress={() => setSu(v=>String(Math.max(0,safeNum(v)-5)))} style={[st.adj,{backgroundColor:T.l2,borderColor:T.border}]}>
            <Text style={{ fontSize:20, color:T.t1 }}>−</Text></Pressable>
          <View style={{ flex:1 }}><Bar value={safeNum(su)} total={30} color="#A78BFA" h={8} /></View>
          <Pressable onPress={() => setSu(v=>String(Math.min(30,safeNum(v)+5)))} style={[st.adj,{backgroundColor:T.l2,borderColor:T.border}]}>
            <Text style={{ fontSize:20, color:T.t1 }}>+</Text></Pressable>
        </View>
      </Card>

      {R ? (<>
        {/* HERO */}
        <LinearGradient colors={['#1a0a38','#3d1a78','#180636']} style={[st.hero,{marginBottom:12}]} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:1 }}>{R.y}Y Corpus (Step-Up)</Text>
            <View style={{ flexDirection:'row', backgroundColor:'rgba(255,255,255,0.1)', borderRadius:8, padding:3, gap:3 }}>
              {['total','monthly'].map(m=>(
                <Pressable key={m} onPress={()=>setVMode(m)}
                  style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:6, backgroundColor:vMode===m?'rgba(255,255,255,0.2)':'transparent' }}>
                  <Text style={{ fontSize:10, color:'rgba(255,255,255,0.85)', fontWeight:vMode===m?'700':'400' }}>{m==='total'?'Total':'/Month'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={{ fontSize:38, fontWeight:'800', color:'#fff', letterSpacing:-2, lineHeight:46 }}>
            {vMode==='total' ? fmt(R.suR.corpus) : fmt(Math.round(R.suR.corpus/12))}
          </Text>
          <View style={{ flexDirection:'row', gap:24, marginTop:14, marginBottom:14 }}>
            {[{l:'Invested',v:R.inv,c:'rgba(255,255,255,0.85)'},{l:'Profit',v:R.profit,c:'#86efac'}].map(x=>(
              <View key={x.l}><Text style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{x.l}</Text>
                <Text style={{ fontSize:15, fontWeight:'700', color:x.c }}>{fmt(x.v)}</Text></View>
            ))}
            <View><Text style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Return</Text>
              <Text style={{ fontSize:15, fontWeight:'700', color:'#c4b5fd' }}>{Math.round((R.profit/Math.max(R.inv,1))*100)}%</Text></View>
          </View>
          <Bar value={R.inv} total={Math.max(R.suR.corpus,1)} color="rgba(255,255,255,0.35)" h={5} />
        </LinearGradient>

        {/* MILESTONES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}} contentContainerStyle={{gap:10}}>
          {[{l:'1Y',v:R.c1,c:'#4F8CFF'},{l:'3Y',v:R.c3,c:'#22C55E'},{l:'5Y',v:R.c5,c:'#A78BFA'},{l:'10Y',v:R.c10,c:'#F59E0B'}].map((m,i)=>(
            <View key={i} style={[st.ms,{backgroundColor:T.l2,borderColor:m.c+'30'}]}>
              <Text style={{ fontSize:11, color:T.t3, marginBottom:4 }}>{m.l}</Text>
              <Text style={{ fontSize:18, fontWeight:'800', color:m.c }}>{fmtShort(m.v)}</Text>
            </View>
          ))}
        </ScrollView>

        {/* CHART */}
        <Card style={{ marginBottom:12 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SH title="Growth Chart" />
            <ChartToggle type={cType} onChange={setCType} />
          </View>

          {cType==='line' && R.lv.length>=2 && (
            <View style={{ overflow:'hidden', borderRadius:12, marginHorizontal:-4 }}>
              <LineChart
                data={{ labels:R.ll, datasets:[{data:R.lv,color:()=>'#4F8CFF',strokeWidth:2.5},{data:R.ip,color:()=>'#22C55E88',strokeWidth:1.5}], legend:['Corpus','Invested'] }}
                width={CHART_W+8} height={200} chartConfig={mkCfg(T)} bezier style={{borderRadius:12}}
                formatYLabel={fmtAxis} withInnerLines withOuterLines={false} withDots yLabelsOffset={4} />
            </View>
          )}

          {cType==='bar' && R.ms.length>0 && (<>
            <View style={{ overflow:'hidden', borderRadius:12, marginHorizontal:-4 }}>
              <BarChart
                data={{ labels:R.ms.map(m=>m.l), datasets:[{data:R.ms.map(m=>m.c)}] }}
                width={CHART_W+8} height={200}
                chartConfig={{...mkCfg(T),color:(o=1)=>`rgba(79,140,255,${o})`}}
                style={{borderRadius:12}} formatYLabel={fmtAxis} showValuesOnTopOfBars fromZero />
            </View>
            <View style={{ marginTop:12 }}>
              {R.ms.map((m,i)=>(
                <View key={i} style={{ marginBottom:8 }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:3 }}>
                    <Text style={{ fontSize:12, color:T.t2 }}>{m.l}</Text>
                    <Chip label={`${Math.round((m.c/Math.max(m.i,1)-1)*100)}% gain`} color="#22C55E" sm />
                  </View>
                  <Bar value={m.i} total={Math.max(m.c,1)} color="#22C55E" h={5} />
                </View>
              ))}
            </View>
          </>)}

          {cType==='pie' && (
            <View style={{ alignItems:'center' }}>
              <PieChart
                data={[
                  {name:'Invested',population:R.inv,color:'#4F8CFF',legendFontColor:T.t2,legendFontSize:12},
                  {name:'Profit',population:Math.max(0,R.profit),color:'#22C55E',legendFontColor:T.t2,legendFontSize:12},
                ]}
                width={CHART_W} height={180} chartConfig={mkCfg(T)}
                accessor="population" backgroundColor="transparent" paddingLeft="15" absolute={false} />
              <Text style={{ fontSize:11, color:T.t3, marginTop:4 }}>Investment vs Profit split</Text>
            </View>
          )}
        </Card>

        <Card style={{ marginBottom:12 }}>
          <SH title="Full Breakdown" />
          <StatRow label="Total Invested"          value={fmt(R.inv)} />
          <StatRow label="Flat return corpus"      value={fmt(R.flat)}          color="#4F8CFF" />
          <StatRow label={`With ${safeNum(su)}% step-up`} value={fmt(R.suR.corpus)} color="#A78BFA" />
          <StatRow label="Total Profit"            value={fmt(R.profit)}        color="#22C55E" />
          <StatRow label="Return multiple"         value={`${(R.suR.corpus/Math.max(R.inv,1)).toFixed(1)}x`} color="#F59E0B" last />
        </Card>

        <Card><SH title="💡 Smart Insights" />
          {R.insights.map((ins,i)=><AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i===R.insights.length-1} />)}
        </Card>
      </>) : (
        <Card><View style={{ alignItems:'center', paddingVertical:28 }}>
          <Text style={{ fontSize:42, marginBottom:12 }}>📈</Text>
          <Text style={{ fontSize:16, fontWeight:'700', color:T.t1 }}>SIP Growth Simulator</Text>
          <Text style={{ fontSize:13, color:T.t3, textAlign:'center', marginTop:6, lineHeight:20 }}>
            Enter SIP amount to see Line, Bar & Pie charts{'\n'}with AI-powered smart insights
          </Text>
        </View></Card>
      )}
    </View>
  );
}

// ── SALARY TAB ────────────────────────────────────────────
function SalaryTab() {
  const { T } = useTheme();
  const [cur, setCur] = useState('');
  const [hike,setHike]= useState('20');

  const R = useMemo(()=>{
    const c=safeNum(cur),p=safeNum(hike);
    if(c===0)return null;
    const n=Math.round(c*(1+p/100)),d=n-c;
    const labels=['Now','Y1','Y2','Y3','Y5','Y10'];
    const values=[c,Math.round(c*1.2),Math.round(c*1.44),Math.round(c*1.73),Math.round(c*2.49),Math.round(c*6.19)];
    return { c,n,d,dy:d*12,p,labels,values,
      insights:[
        {icon:'📈',msg:`Invest 50% of hike (${fmt(Math.round(d*0.5))}/mo) → ${fmtShort(Math.round(d*0.5)*12*10)} in 10Y at 12%.`,color:'#22C55E'},
        {icon:'🛟',msg:`Build 6-month emergency fund (${fmt(c*6)}) in ${c>0?Math.ceil((c*6)/Math.max(d,1)):'-'} months using hike.`,color:'#4F8CFF'},
        {icon:'⚠️',msg:`Avoid lifestyle inflation — keep Wants at 30% even after hike.`,color:'#F59E0B'},
      ]};
  },[cur,hike]);

  return (
    <View style={{ paddingHorizontal:SP.md }}>
      <Card style={{ marginBottom:12 }}>
        <SH title="Salary Details" />
        <Input label="Current Monthly Salary (₹)" value={cur} onChange={setCur} type="numeric" prefix="₹" placeholder="65000" />
        <Text style={{ fontSize:13, color:T.t2, fontWeight:'600', marginBottom:8 }}>Expected Hike: <Text style={{color:'#22C55E'}}>{safeNum(hike)}%</Text></Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <Pressable onPress={()=>setHike(v=>String(Math.max(0,safeNum(v)-5)))} style={[st.adj,{backgroundColor:T.l2,borderColor:T.border}]}>
            <Text style={{ fontSize:20, color:T.t1 }}>−</Text></Pressable>
          <View style={{ flex:1 }}><Bar value={safeNum(hike)} total={100} color="#22C55E" h={8} /></View>
          <Pressable onPress={()=>setHike(v=>String(Math.min(100,safeNum(v)+5)))} style={[st.adj,{backgroundColor:T.l2,borderColor:T.border}]}>
            <Text style={{ fontSize:20, color:T.t1 }}>+</Text></Pressable>
        </View>
      </Card>

      {R ? (<>
        <LinearGradient colors={['#052e16','#064e30']} style={[st.hero,{marginBottom:12}]} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>New Monthly (+{R.p}% hike)</Text>
          <Text style={{ fontSize:38, fontWeight:'800', color:'#fff', letterSpacing:-2, lineHeight:46 }}>{fmt(R.n)}</Text>
          <View style={{ flexDirection:'row', gap:24, marginTop:14 }}>
            <View><Text style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Monthly extra</Text><Text style={{ fontSize:16, fontWeight:'700', color:'#86efac' }}>+{fmt(R.d)}</Text></View>
            <View><Text style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Yearly extra</Text><Text style={{ fontSize:16, fontWeight:'700', color:'#86efac' }}>+{fmt(R.dy)}</Text></View>
          </View>
        </LinearGradient>

        <Card style={{ marginBottom:12 }}>
          <SH title="10-Year Salary Projection" />
          <Text style={{ fontSize:11, color:T.t3, marginBottom:10 }}>Assuming ~20% avg annual hike</Text>
          {R.values.length>=2 && <View style={{ overflow:'hidden', borderRadius:12, marginHorizontal:-4 }}>
            <LineChart
              data={{ labels:R.labels, datasets:[{data:R.values,strokeWidth:2.5}] }}
              width={CHART_W+8} height={190}
              chartConfig={{...mkCfg(T,'#22C55E'),color:(o=1)=>`rgba(34,197,94,${o})`}}
              bezier style={{borderRadius:12}} formatYLabel={fmtAxis} withInnerLines withOuterLines={false} yLabelsOffset={4} />
          </View>}
        </Card>

        <Card style={{ marginBottom:12 }}>
          <SH title="Breakdown" />
          <StatRow label="Current Salary"  value={fmt(R.c)} />
          <StatRow label="New Salary"       value={fmt(R.n)}  color="#22C55E" />
          <StatRow label="Monthly Increase" value={`+${fmt(R.d)}`}  color="#22C55E" />
          <StatRow label="Annual Increase"  value={`+${fmt(R.dy)}`} color="#22C55E" last />
        </Card>

        <Card><SH title="💡 Smart Insights" />
          {R.insights.map((ins,i)=><AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i===R.insights.length-1} />)}
        </Card>
      </>) : (
        <Card><View style={{alignItems:'center',paddingVertical:28}}>
          <Text style={{fontSize:42,marginBottom:12}}>💼</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:T.t1}}>Salary Hike Simulator</Text>
          <Text style={{fontSize:13,color:T.t3,textAlign:'center',marginTop:6}}>Enter salary to see hike impact + 10-year growth chart</Text>
        </View></Card>
      )}
    </View>
  );
}

// ── RETIREMENT TAB ────────────────────────────────────────
function RetirementTab() {
  const { T } = useTheme();
  const [ca,setCa]=useState(''),[ra,setRa]=useState(''),
        [cs,setCs]=useState(''),[sal,setSal]=useState('');

  const R = useMemo(()=>{
    const a=safeNum(ca),b=safeNum(ra,a+1),c=safeNum(cs),s=safeNum(sal);
    if(a===0||b<=a)return null;
    const yr=b-a,corp=retirementCorpus(s*12,yr),gap=Math.max(0,corp-c),mo=monthlyNeeded(corp,c,yr*12),prog=Math.min(100,Math.round((c/Math.max(corp,1))*100));
    const cps=[Math.ceil(yr/4),Math.ceil(yr/2),Math.ceil(yr*3/4),yr];
    const cl=cps.map(y=>`Y${y}`),cv=cps.map(y=>c+sipMaturity(mo,y*12,10));
    return { yr,corpus:corp,gap,mo,prog,c,cl,cv,
      insights:[
        yr>20?{icon:'🚀',msg:`${yr} years is sufficient — ${fmt(mo)}/mo can build ${fmtShort(corp)}.`,color:'#22C55E'}
              :{icon:'⚠️',msg:`Only ${yr} years — start aggressive SIP + NPS immediately.`,color:'#EF4444'},
        c>corp*0.5?{icon:'🎉',msg:'You are already 50%+ toward your retirement goal!',color:'#22C55E'}
                  :{icon:'💡',msg:`Need ${fmtShort(corp-c)} more. Start ${fmt(mo)}/mo SIP now.`,color:'#4F8CFF'},
        {icon:'📊',msg:`Inflation makes real target ~${fmtShort(Math.round(corp*1.5))} — plan for this.`,color:'#A78BFA'},
      ]};
  },[ca,ra,cs,sal]);

  return (
    <View style={{ paddingHorizontal:SP.md }}>
      <Card style={{ marginBottom:12 }}>
        <SH title="Retirement Details" />
        <View style={{ flexDirection:'row', gap:10 }}>
          <Input label="Current Age" value={ca} onChange={setCa} type="numeric" placeholder="28" style={{flex:1}} />
          <Input label="Retire At"   value={ra} onChange={setRa} type="numeric" placeholder="55" style={{flex:1}} />
        </View>
        <Input label="Monthly Salary (₹)"  value={sal} onChange={setSal} type="numeric" prefix="₹" placeholder="65000" />
        <Input label="Current Savings (₹)" value={cs}  onChange={setCs}  type="numeric" prefix="₹" placeholder="All savings" />
      </Card>

      {R ? (<>
        <LinearGradient colors={['#0c1a4e','#1a3080']} style={[st.hero,{marginBottom:12}]} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Retirement Corpus Needed</Text>
          <Text style={{ fontSize:36, fontWeight:'800', color:'#fff', letterSpacing:-2, lineHeight:44 }}>{fmtShort(R.corpus)}</Text>
          <Text style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4, marginBottom:14 }}>25× rule · inflation-adjusted · {R.yr} years</Text>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>Goal progress</Text>
            <Text style={{ fontSize:11, fontWeight:'700', color:'#86efac' }}>{R.prog}%</Text>
          </View>
          <Bar value={R.prog} total={100} color="#22C55E" h={6} />
        </LinearGradient>

        {R.cv.length>=2 && <Card style={{ marginBottom:12 }}>
          <SH title="Savings Journey Chart" />
          <Text style={{ fontSize:11, color:T.t3, marginBottom:10 }}>Projected @ 10% returns + monthly SIP</Text>
          <View style={{ overflow:'hidden', borderRadius:12, marginHorizontal:-4 }}>
            <LineChart
              data={{ labels:R.cl, datasets:[{data:R.cv,strokeWidth:2.5}] }}
              width={CHART_W+8} height={190}
              chartConfig={{...mkCfg(T,'#4F8CFF'),color:(o=1)=>`rgba(79,140,255,${o})`}}
              bezier style={{borderRadius:12}} formatYLabel={fmtAxis} withInnerLines withOuterLines={false} yLabelsOffset={4} />
          </View>
        </Card>}

        <Card style={{ marginBottom:12 }}>
          <SH title="Plan Summary" />
          <StatRow label="Years to Retire"   value={`${R.yr} years`} />
          <StatRow label="Current Savings"    value={fmt(R.c)}         color="#22C55E" />
          <StatRow label="Corpus Needed"      value={fmtShort(R.corpus)} color="#4F8CFF" />
          <StatRow label="Gap to Fill"        value={fmt(R.gap)}       color="#EF4444" />
          <StatRow label="Monthly SIP Needed" value={fmt(R.mo)}        color="#A78BFA" last />
        </Card>

        <Card><SH title="💡 Smart Insights" />
          {R.insights.map((ins,i)=><AlertRow key={i} icon={ins.icon} msg={ins.msg} color={ins.color} last={i===R.insights.length-1} />)}
        </Card>
      </>) : (
        <Card><View style={{alignItems:'center',paddingVertical:28}}>
          <Text style={{fontSize:42,marginBottom:12}}>🏖️</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:T.t1}}>Retirement Planner</Text>
          <Text style={{fontSize:13,color:T.t3,textAlign:'center',marginTop:6,lineHeight:20}}>
            Enter age and salary to get corpus target{'\n'}with savings journey line chart
          </Text>
        </View></Card>
      )}
    </View>
  );
}

const TABS = [
  { key:'sip',        label:'📈 SIP'     },
  { key:'salary',     label:'💼 Salary'  },
  { key:'retirement', label:'🏖️ Retire' },
];

export default function SimulatorScreen() {
  const { T } = useTheme();
  const [tab, setTab] = useState('sip');
  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom:100 }}>
      <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
        <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Simulator</Text>
        <Text style={{ fontSize:13, color:T.t3, marginTop:2 }}>Charts · Smart Insights · Projections</Text>
      </View>
      <PillTabs tabs={TABS} active={tab} onChange={setTab} />
      {tab==='sip'        && <SipTab />}
      {tab==='salary'     && <SalaryTab />}
      {tab==='retirement' && <RetirementTab />}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  adj:  { width:36, height:36, borderRadius:10, borderWidth:1, alignItems:'center', justifyContent:'center' },
  hero: { borderRadius:20, padding:SP.md, borderWidth:1, borderColor:'rgba(255,255,255,0.1)' },
  ms:   { borderRadius:14, padding:14, minWidth:110, alignItems:'center', borderWidth:1 },
});
