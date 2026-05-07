// notifications.js — Smart Notifications Service
// NOTE: expo-notifications removed (incompatible with Expo Go SDK 53+)
// Local smart tips are shown via UI instead of push notifications

// ── No-op stubs so nothing breaks ─────────────────────────
export const requestNotifPermission  = async () => false;
export const cancelAllNotifications  = async () => {};

// ── Smart trigger — silently skips scheduling ──────────────
export const triggerSmartNotifications = async (state) => {
  try {
    // Push notifications not available in Expo Go SDK 53+
    // Tips are shown in-app via getNotifSuggestions() instead
    return 0;
  } catch (e) {
    console.warn('[SmartNotif]', e);
    return 0;
  }
};

// ── Smart tips for in-app UI display (no push needed) ─────
export const getNotifSuggestions = (state) => {
  const suggestions = [];
  const salary   = Number(state?.salary) || 0;
  const sipTotal = (state?.sips  || []).reduce((a, x) => a + (Number(x?.amount) || 0), 0);
  const savPct   = (state?.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
  const goals    = state?.goals || [];
  const wantsPct = (state?.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
  const debts    = state?.debts || [];

  if (sipTotal === 0 && salary > 0)
    suggestions.push({ icon:'📈', msg:'Start a SIP — even ₹500/mo compounds to wealth', color:'#4F8CFF' });
  if (sipTotal > 0 && sipTotal < salary * 0.1)
    suggestions.push({ icon:'💰', msg:`Increase SIP to at least ₹${Math.round(salary*0.15).toLocaleString('en-IN')}/mo`, color:'#22C55E' });
  if (savPct < 20 && salary > 0)
    suggestions.push({ icon:'⚠️', msg:`Savings at ${savPct}% — automate 20% on salary day`, color:'#F59E0B' });
  if (wantsPct > 35)
    suggestions.push({ icon:'💸', msg:`Wants at ${wantsPct}% — review discretionary spending`, color:'#EF4444' });

  const highRate = debts.find(d => Number(d?.rate || 0) >= 24);
  if (highRate)
    suggestions.push({ icon:'🔥', msg:`${highRate.name} at ${highRate.rate}% — pay extra to clear faster`, color:'#EF4444' });

  goals.forEach(g => {
    const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
    if (pct >= 80 && pct < 100)
      suggestions.push({ icon:'🎯', msg:`${g.title} is ${pct}% done — one final push!`, color:'#22C55E' });
    if (pct >= 100)
      suggestions.push({ icon:'🎉', msg:`${g.title} goal achieved! Set the next one.`, color:'#22C55E' });
  });

  return suggestions.slice(0, 5);
};
