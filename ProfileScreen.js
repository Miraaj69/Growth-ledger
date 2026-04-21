
import React, { useMemo, memo } from 'react';
import { ScrollView, View, Text, Pressable, Alert, Share, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from './AppContext';
import { useTheme } from './ThemeContext';
import { fmt, safePct, calcScore } from './helpers';
import { SPACING as SP, RADIUS as R } from './theme';
import { Card, GCard, Chip, Bar, SH, Toggle, AlertRow, Btn } from './UI';
import { clearState } from './storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { triggerSmartNotifications, getNotifSuggestions } from './notifications';

export default function ProfileScreen() {
  const { state: s, set, dispatch } = useApp();
  const { T, mode, cycleTheme }     = useTheme();

  const score = useMemo(() => calcScore(s), [s]);
  const done  = useMemo(() => (s.certifications||[]).filter(c=>c?.status==='Done').length, [s.certifications]);
  const totalInc = useMemo(() => (s.incomes||[]).reduce((a,x)=>a+(Number(x?.amount)||0),0), [s.incomes]);

  const achievements = useMemo(() => {
    const totalSaved = (s.goals||[]).reduce((a,g)=>a+(Number(g?.saved)||0),0);
    const sipTotal   = (s.sips||[]).reduce((a,x)=>a+(Number(x?.amount)||0),0);
    const debtPaid   = (s.debts||[]).reduce((a,d)=>a+((Number(d?.amount)||0)-(Number(d?.remaining)||0)),0);
    const certsDone  = (s.certifications||[]).filter(c=>c?.status==='Done').length;
    const present    = s.attendance instanceof Set ? s.attendance.size : 0;
    return [
      {icon:'🥇',label:'Saver',      desc:'Saved ₹1L+',    unlocked:totalSaved>=100000,         color:'#F59E0B'},
      {icon:'📈',label:'Investor',   desc:'Started SIP',   unlocked:sipTotal>0,                  color:'#22C55E'},
      {icon:'💪',label:'Debt Buster',desc:'Paid ₹50K',     unlocked:debtPaid>=50000,             color:'#4F8CFF'},
      {icon:'🎓',label:'Certified',  desc:'2+ certs',      unlocked:certsDone>=2,                color:'#A78BFA'},
      {icon:'🔥',label:'Consistent', desc:'20+ days',      unlocked:present>=20,                 color:'#EF4444'},
      {icon:'👑',label:'Elite',      desc:'Score 85+',     unlocked:score.total>=85,             color:'#F59E0B'},
      {icon:'🎯',label:'Planner',    desc:'3 goals',       unlocked:(s.goals||[]).length>=3,     color:'#14B8A6'},
      {icon:'💎',label:'Debt-Free',  desc:'Zero debt',     unlocked:(s.debts||[]).every(d=>(d?.remaining||0)===0)&&(s.debts||[]).length>0, color:'#EC4899'},
    ];
  }, [s, score]);

  const handleExport = async () => {
    try {
      const data = JSON.stringify({ ...s, attendance:[...(s.attendance instanceof Set?s.attendance:new Set())] }, null, 2);
      await Share.share({ message:data, title:'Growth Ledger Backup' });
    } catch (e) { Alert.alert('Export failed', e.message||'Unknown error'); }
  };

  const handleReset = () => {
    Alert.alert('Reset All Data','This will permanently delete all your financial data. This cannot be undone.',
      [{ text:'Cancel', style:'cancel' }, { text:'Reset Everything', style:'destructive', onPress:async()=>{ await clearState(); dispatch({type:'RESET'}); } }]
    );
  };

  const themeLabel = mode === 'dark' ? '🌙 Dark' : mode === 'amoled' ? '⬛ AMOLED' : '☀️ Light';

  const handleHolidayImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      const raw = await FileSystem.readAsStringAsync(file.uri);
      let dates = [];
      // Try JSON parse first
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) dates = parsed.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
        else if (parsed.holidays && Array.isArray(parsed.holidays)) dates = parsed.holidays;
        else { Alert.alert('Invalid Format', 'JSON must be an array of dates: ["2026-01-26", ...]'); return; }
      } catch {
        // Try CSV / line-separated
        dates = raw.split(/[\n,]/).map(d => d.trim().replace(/['"]/g, '')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
      }
      if (dates.length === 0) { Alert.alert('No valid dates found', 'Use format: YYYY-MM-DD'); return; }
      dispatch({ type: 'SET_HOLIDAYS', holidays: dates });
      Alert.alert('✅ Holidays Imported', `${dates.length} holiday dates loaded.\n\nThey will show in red on the attendance calendar.`);
    } catch (e) {
      Alert.alert('Import Failed', e.message || 'Could not read file');
    }
  };

  const holidayCount = (s.holidays || []).length;

  return (
    <ScrollView style={{ flex:1, backgroundColor:T.bg }} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom:100 }}>

      <View style={{ paddingTop:56, paddingHorizontal:SP.md, paddingBottom:SP.md }}>
        <Text style={{ fontSize:27, fontWeight:'800', color:T.t1, letterSpacing:-0.5 }}>Profile</Text>
      </View>

      {/* HERO */}
      <View style={{ marginHorizontal:SP.md, marginBottom:12 }}>
        <LinearGradient colors={['#0c1a3a','#1a3a78']}
          style={{ borderRadius:R.xl, padding:SP.lg, alignItems:'center', borderWidth:1, borderColor:T.border }}
          start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={{ width:76,height:76,borderRadius:26,backgroundColor:'rgba(255,255,255,0.12)',alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:2,borderColor:'rgba(255,255,255,0.14)' }}>
            <Text style={{ fontSize:38 }}>👤</Text>
          </View>
          <Text style={{ fontSize:21, fontWeight:'800', color:'#fff', marginBottom:3 }}>Financial Profile</Text>
          {s.userAge > 0 && <Text style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:12 }}>Age {s.userAge}</Text>}
          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:7 }}>
            <Chip label={`Score: ${score.total}/100`} color={score.color} dot />
            <Chip label={`Lv ${s.level||1} · ${s.xpTotal||0} XP`} color="#F59E0B" />
          </View>
          {s.lastSaved && <Text style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:8 }}>✓ Auto-saved · {s.lastSaved}</Text>}
        </LinearGradient>
      </View>

      {/* STATS */}
      <View style={{ flexDirection:'row', gap:8, marginHorizontal:SP.md, marginBottom:12 }}>
        {[
          { icon:'💰', label:'Income',  val: totalInc > 0 ? fmt(totalInc) : '—'          },
          { icon:'📊', label:'SIPs',    val: (s.sips||[]).length || '—'                  },
          { icon:'🎯', label:'Goals',   val: (s.goals||[]).length || '—'                 },
        ].map((st,i) => (
          <Card key={i} style={{ flex:1, padding:SP.sm+6, alignItems:'center' }}>
            <Text style={{ fontSize:22, marginBottom:5 }}>{st.icon}</Text>
            <Text style={{ fontSize:17, fontWeight:'800', color:T.t1 }}>{st.val}</Text>
            <Text style={{ fontSize:10, color:T.t3, marginTop:2 }}>{st.label}</Text>
          </Card>
        ))}
      </View>

      {/* ACHIEVEMENTS */}
      <View style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Achievements" right={`${achievements.filter(a=>a.unlocked).length}/${achievements.length}`} rightColor="#F59E0B" />
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
            {achievements.map((a,i) => (
              <View key={i} style={{ width:'28%', alignItems:'center' }}>
                <View style={{ width:50,height:50,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,
                  backgroundColor:a.unlocked?a.color+'22':T.l2, borderColor:a.unlocked?a.color+'44':T.border,
                  opacity:a.unlocked?1:0.28, marginBottom:5 }}>
                  <Text style={{ fontSize:20 }}>{a.icon}</Text>
                </View>
                <Text style={{ fontSize:10, fontWeight:'600', color:a.unlocked?T.t2:T.t3, textAlign:'center' }}>{a.label}</Text>
                <Text style={{ fontSize:9, color:T.t3, textAlign:'center', marginTop:1 }}>{a.desc}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* THEME */}
      <View style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Appearance" />
          <Pressable onPress={cycleTheme} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:SP.sm }}>
            <View style={{ flexDirection:'row', gap:12, alignItems:'center' }}>
              <Text style={{ fontSize:19 }}>🎨</Text>
              <View>
                <Text style={{ fontSize:14, color:T.t1 }}>Theme</Text>
                <Text style={{ fontSize:12, color:T.t3 }}>Tap to cycle themes</Text>
              </View>
            </View>
            <Chip label={themeLabel} color="#4F8CFF" />
          </Pressable>
        </Card>
      </View>

      {/* PRIVACY */}
      <View style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Privacy & Security" />
          {[
            { key:'maskAmounts',   icon:'👁️', label:'Mask Amounts',   sub:'Hide numbers in public' },
            { key:'biometricLock', icon:'🔐', label:'Biometric Lock', sub:'Face ID / Fingerprint'  },
          ].map((n,i) => (
            <View key={n.key} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:SP.sm+4, borderBottomWidth:i===0?1:0, borderBottomColor:T.border }}>
              <View style={{ flexDirection:'row', gap:12, alignItems:'center' }}>
                <Text style={{ fontSize:19 }}>{n.icon}</Text>
                <View>
                  <Text style={{ fontSize:14, color:T.t1 }}>{n.label}</Text>
                  <Text style={{ fontSize:12, color:T.t3 }}>{n.sub}</Text>
                </View>
              </View>
              <Toggle value={s[n.key]||false} onChange={()=>set({[n.key]:!s[n.key]})} />
            </View>
          ))}
        </Card>
      </View>

      {/* NOTIFICATIONS */}
      <View style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Reminders" />
          {[
            {key:'salary',icon:'💰',label:'Salary Day'},
            {key:'sip',   icon:'📈',label:'SIP Alert'},
            {key:'emi',   icon:'🏦',label:'EMI Due Date'},
            {key:'weekly',icon:'📊',label:'Weekly Report'},
          ].map((n,i,arr) => (
            <View key={n.key} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:SP.sm+4, borderBottomWidth:i<arr.length-1?1:0, borderBottomColor:T.border }}>
              <View style={{ flexDirection:'row', gap:12, alignItems:'center' }}>
                <Text style={{ fontSize:19 }}>{n.icon}</Text>
                <Text style={{ fontSize:14, color:T.t1 }}>{n.label}</Text>
              </View>
              <Toggle value={(s.notifs||{})[n.key]!==false} onChange={()=>set({notifs:{...(s.notifs||{}),[n.key]:!(s.notifs||{})[n.key]}})} />
            </View>
          ))}
        </Card>
      </View>

      {/* HOLIDAYS */}
      <View style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SH title="📅 Public Holidays" right={holidayCount > 0 ? `${holidayCount} loaded` : undefined} rightColor="#EF4444" />
          <Text style={{ fontSize:12, color:T.t3, lineHeight:18, marginBottom:12 }}>
            Import a JSON or CSV file with holiday dates (YYYY-MM-DD).
            They appear in red on your attendance calendar.
          </Text>
          {holidayCount > 0 && (
            <View style={{ backgroundColor:'#EF444412', borderRadius:11, padding:10, borderWidth:1, borderColor:'#EF444428', marginBottom:10 }}>
              <Text style={{ fontSize:12, color:'#EF4444', fontWeight:'600' }}>
                {holidayCount} holidays loaded — shown in red on calendar
              </Text>
              <Text style={{ fontSize:10, color:T.t3, marginTop:3 }}>
                {(s.holidays||[]).slice(0,3).join(', ')}{holidayCount > 3 ? ` + ${holidayCount-3} more` : ''}
              </Text>
            </View>
          )}
          <View style={{ flexDirection:'row', gap:10 }}>
            <View style={{ flex:1 }}>
              <Btn label="📂 Import Holidays" onPress={handleHolidayImport} />
            </View>
            {holidayCount > 0 && (
              <Pressable onPress={() => { Alert.alert('Clear Holidays?', 'Remove all imported holidays?', [{text:'Cancel'},{text:'Clear',style:'destructive',onPress:()=>dispatch({type:'CLEAR_HOLIDAYS'})}]); }}
                style={{ paddingHorizontal:14, paddingVertical:12, borderRadius:12, backgroundColor:'#EF444415', borderWidth:1, borderColor:'#EF444430', justifyContent:'center' }}>
                <Text style={{ fontSize:12, color:'#EF4444', fontWeight:'600' }}>🗑️ Clear</Text>
              </Pressable>
            )}
          </View>
          <Text style={{ fontSize:11, color:T.t3, marginTop:10, lineHeight:17 }}>
            💡 Tip: Create a JSON file like:{' '}
            <Text style={{ color:T.t2, fontFamily:'monospace' }}>["2026-01-26","2026-08-15"]</Text>
          </Text>
        </Card>
      </View>

      {/* ACTIONS */}
      <View style={{ marginHorizontal:SP.md }}>
        <Card style={{ marginBottom:12 }}>
          <SH title="Data & Actions" />
          {/* Smart Notifications Panel */}
          <View style={{ marginBottom:12 }}>
            <Card>
              <SH title="🔔 Smart Notifications" />
              {getNotifSuggestions(s).map((n, i) => (
                <AlertRow key={i} icon={n.icon} msg={n.msg} color={n.color} last={i===getNotifSuggestions(s).length-1} />
              ))}
              {getNotifSuggestions(s).length === 0 && (
                <Text style={{ fontSize:13, color:T.t3, textAlign:'center', paddingVertical:12 }}>
                  ✅ No critical alerts — finances look healthy!
                </Text>
              )}
              <Pressable onPress={()=>triggerSmartNotifications(s).catch(()=>{})}
                style={{ marginTop:12, backgroundColor:'#4F8CFF22', borderRadius:12, padding:12, borderWidth:1, borderColor:'#4F8CFF40', alignItems:'center' }}>
                <Text style={{ fontSize:13, fontWeight:'600', color:'#4F8CFF' }}>🔔 Send Smart Reminders Now</Text>
              </Pressable>
            </Card>
          </View>

          {[
            {icon:'💾',label:'Export JSON Backup', right:'↓ Save',  action:handleExport},
            {icon:'🔄',label:'Reset All Data',     right:'Reset',   action:handleReset, danger:true},
            {icon:'ℹ️',label:'About Growth Ledger',right:'v8.0'},
          ].map((it,i,arr) => (
            <Pressable key={i} onPress={it.action}
              style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:SP.sm+6, borderBottomWidth:i<arr.length-1?1:0, borderBottomColor:T.border }}>
              <View style={{ flexDirection:'row', gap:12, alignItems:'center' }}>
                <Text style={{ fontSize:19 }}>{it.icon}</Text>
                <Text style={{ fontSize:14, color:it.danger?'#EF4444':T.t1 }}>{it.label}</Text>
              </View>
              <Text style={{ fontSize:13, color:it.action?'#4F8CFF':T.t3, fontWeight:it.action?'600':'400' }}>{it.right}</Text>
            </Pressable>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
