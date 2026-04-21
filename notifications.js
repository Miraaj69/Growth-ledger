// notifications.js — Smart Notifications Service
// Uses expo-notifications for local reminders
import * as Notifications from 'expo-notifications';

// ── Setup handler ─────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

// ── Request permissions ────────────────────────────────────
export const requestNotifPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch { return false; }
};

// ── Schedule a single local notification ───────────────────
const schedule = async (title, body, seconds = 5) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: { seconds },
    });
  } catch (e) { console.warn('[Notif]', e); }
};

// ── Smart trigger logic based on user state ────────────────
export const triggerSmartNotifications = async (state) => {
  try {
    const granted = await requestNotifPermission();
    if (!granted) return;

    const salary   = Number(state?.salary)  || 0;
    const sipTotal = (state?.sips  || []).reduce((a, x) => a + (Number(x?.amount) || 0), 0);
    const savPct   = (state?.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
    const goals    = state?.goals || [];
    const wantsPct = (state?.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
    const debts    = state?.debts || [];
    const highRate = debts.find(d => Number(d?.rate || 0) >= 24);

    const notifs = [];

    // No SIP
    if (salary > 0 && sipTotal === 0)
      notifs.push({ title:'📈 Start Investing Today', body:'You have no active SIP. Even ₹500/mo in Nifty 50 grows significantly over time.', delay: 3 });

    // SIP is too low
    if (salary > 0 && sipTotal > 0 && sipTotal < salary * 0.1)
      notifs.push({ title:'💰 Boost Your SIP', body:`Your SIP is only ${Math.round((sipTotal/salary)*100)}% of salary. Experts recommend 15-20%.`, delay: 5 });

    // Low savings
    if (savPct < 15 && salary > 0)
      notifs.push({ title:'⚠️ Low Savings Rate', body:`Savings at ${savPct}% only. Automate 20% on salary day to build wealth faster.`, delay: 8 });

    // High wants
    if (wantsPct > 40)
      notifs.push({ title:'💸 Review Your Expenses', body:`You're spending ${wantsPct}% on wants. Cut to 30% and redirect savings to SIP.`, delay: 10 });

    // High rate debt
    if (highRate)
      notifs.push({ title:'🔥 High-Interest Debt Alert', body:`${highRate.name} at ${highRate.rate}% is costing you wealth. Pay ₹2K extra/mo to clear faster.`, delay: 12 });

    // Goal near completion
    const nearGoal = goals.find(g => {
      const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
      return pct >= 80 && pct < 100;
    });
    if (nearGoal) {
      const pct = Math.round((nearGoal.saved / nearGoal.target) * 100);
      notifs.push({ title:'🎯 Almost There!', body:`${nearGoal.title} is ${pct}% complete. Keep going — you're almost at your goal!`, delay: 15 });
    }

    // Goal complete
    const doneGoal = goals.find(g => g.saved >= g.target && g.target > 0);
    if (doneGoal)
      notifs.push({ title:'🎉 Goal Achieved!', body:`Congratulations! You've reached your ${doneGoal.title} goal. Time to set the next one!`, delay: 6 });

    // Under-investing
    if (salary > 0 && sipTotal + salary * savPct / 100 < salary * 0.15)
      notifs.push({ title:'📊 You Are Under-Investing', body:'Total investment is below 15% of income. Small increases now mean big wealth later.', delay: 18 });

    // Send max 3 notifications (avoid spamming)
    const toSend = notifs.slice(0, 3);
    for (const n of toSend) {
      await schedule(n.title, n.body, n.delay);
    }

    return toSend.length;
  } catch (e) {
    console.warn('[SmartNotif] Error:', e);
    return 0;
  }
};

// ── Cancel all pending notifications ──────────────────────
export const cancelAllNotifications = async () => {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); }
  catch {}
};

// ── Get notification suggestions (for UI display) ─────────
export const getNotifSuggestions = (state) => {
  const suggestions = [];
  const salary   = Number(state?.salary) || 0;
  const sipTotal = (state?.sips || []).reduce((a, x) => a + (Number(x?.amount) || 0), 0);
  const savPct   = (state?.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
  const goals    = state?.goals || [];
  const wantsPct = (state?.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;

  if (sipTotal === 0 && salary > 0)
    suggestions.push({ icon:'📈', msg:'Start a SIP — even ₹500/mo compounds to wealth',           color:'#4F8CFF' });
  if (sipTotal > 0 && sipTotal < salary * 0.1)
    suggestions.push({ icon:'💰', msg:`Increase SIP to at least ${Math.round(salary*0.15).toLocaleString('en-IN')}/mo`, color:'#22C55E' });
  if (savPct < 20)
    suggestions.push({ icon:'⚠️', msg:`Savings at ${savPct}% — automate 20% on salary day`,        color:'#F59E0B' });
  if (wantsPct > 35)
    suggestions.push({ icon:'💸', msg:`Wants at ${wantsPct}% — review discretionary spending`,     color:'#EF4444' });
  goals.forEach(g => {
    const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
    if (pct >= 80 && pct < 100)
      suggestions.push({ icon:'🎯', msg:`${g.title} is ${pct}% done — one final push!`,            color:'#22C55E' });
  });

  return suggestions.slice(0, 5);
};
