// calculations.js — pure financial functions, no hardcoded values

export const fmt = (n) =>
  '₹' + Number(Math.max(0, Math.round(n))).toLocaleString('en-IN');

export const pct = (v, t) =>
  t ? Math.min(100, Math.max(0, Math.round((v / t) * 100))) : 0;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ── SIP ────────────────────────────────────────────────────────
export const sipMaturity = (amount, months, annualPct) => {
  const r = annualPct / 100 / 12;
  if (r === 0) return amount * months;
  return Math.round(amount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r));
};

export const sipCAGR = (invested, maturity, years) =>
  years > 0 ? ((Math.pow(maturity / Math.max(invested, 1), 1 / years) - 1) * 100).toFixed(1) : '0';

export const inflAdj = (val, years, rate = 6) =>
  Math.round(val / Math.pow(1 + rate / 100, years));

// ── DEBT ───────────────────────────────────────────────────────
export const debtMonths = (rem, emi) =>
  rem <= 0 ? 0 : Math.ceil(rem / Math.max(emi, 1));

// ── GOALS ──────────────────────────────────────────────────────
export const monthlyNeeded = (target, saved, months) =>
  months > 0 ? Math.max(0, Math.round((target - saved) / months)) : 0;

export const deadlineMonths = (deadline) => {
  if (!deadline) return 12;
  return Math.max(1, Math.round((new Date(deadline) - new Date()) / 1000 / 60 / 60 / 24 / 30));
};

// ── RETIREMENT ────────────────────────────────────────────────
export const retirementCorpus = (annualInc, yearsToRetire) =>
  Math.round(annualInc * 0.7 * 25 * Math.pow(1.06, yearsToRetire));

// ── EMERGENCY FUND ────────────────────────────────────────────
export const efTarget = (monthlyExp, months = 6) => monthlyExp * months;

// ── DERIVED TOTALS — all computed from state, NO hardcoding ──
export const derived = (s) => {
  const attendance  = s.attendance instanceof Set ? s.attendance : new Set(s.attendance || []);
  const present     = attendance.size;
  const perDay      = s.salary / Math.max(s.workingDays, 1);
  const earnedSalary= perDay * present;
  const otherIncome = s.incomes.filter((_, i) => i > 0).reduce((a, x) => a + (x.amount || 0), 0);
  const totalIncome = earnedSalary + otherIncome;          // ← SINGLE SOURCE OF TRUTH
  const sipTotal    = s.sips.reduce((a, x) => a + x.amount, 0);
  const debtEmi     = s.debts.reduce((a, d) => a + d.emi, 0);
  const debtTotal   = s.debts.reduce((a, d) => a + d.remaining, 0);
  const manualTotal = s.manualExpenses.reduce((a, e) => a + e.amount, 0);
  const needsBudget = s.salary * ((s.expenses.find(e => e.label === 'Needs')?.pct || 50) / 100);
  const wantsBudget = s.salary * ((s.expenses.find(e => e.label === 'Wants')?.pct || 30) / 100);
  const savingsBudget = s.salary * ((s.expenses.find(e => e.label === 'Savings')?.pct || 20) / 100);
  const totalAssets = s.assets.reduce((a, x) => a + x.value, 0);
  const netWorth    = totalAssets - debtTotal;
  const balance     = Math.max(0, totalIncome - manualTotal - debtEmi - sipTotal);
  const lostSalary  = perDay * (s.workingDays - present);

  return {
    attendance, present, perDay, earnedSalary, otherIncome,
    totalIncome,    // USE THIS everywhere — same value Dashboard + CashFlow
    sipTotal, debtEmi, debtTotal, manualTotal,
    needsBudget, wantsBudget, savingsBudget,
    totalAssets, netWorth, balance, lostSalary,
  };
};

// ── SCORE ──────────────────────────────────────────────────────
export const calcScore = (s) => {
  const { present, sipTotal, debtTotal } = derived(s);
  const savPct  = s.expenses.find(e => e.label === 'Savings')?.pct || 20;
  const wntPct  = s.expenses.find(e => e.label === 'Wants')?.pct || 30;
  const sipR    = sipTotal / Math.max(s.salary, 1);
  const debtR   = debtTotal / Math.max(s.salary * 12, 1);
  const attR    = present / Math.max(s.workingDays, 1);
  const savS    = clamp(savPct * 2.5, 0, 25);
  const debtS   = debtTotal === 0 ? 25 : clamp(25 - debtR * 25, 0, 25);
  const sipS    = clamp(sipR * 200, 0, 25);
  const expS    = clamp((100 - wntPct) / 2, 0, 15);
  const attS    = clamp(attR * 10, 0, 10);
  const total   = Math.round(savS + debtS + sipS + expS + attS);
  const color   = total >= 80 ? '#22C55E' : total >= 65 ? '#14B8A6' : total >= 50 ? '#4F8CFF' : total >= 35 ? '#F59E0B' : '#EF4444';
  const label   = total >= 90 ? 'Outstanding 🌟' : total >= 80 ? 'Excellent 🔥' : total >= 70 ? 'Great 💪' : total >= 55 ? 'Good 👍' : total >= 40 ? 'Fair ⚠️' : 'Needs Work 🆘';
  return { total, color, label, breakdown: [
    { label:'Savings Rate',  score:Math.round(savS),  max:25, color:'#22C55E' },
    { label:'Debt Health',   score:Math.round(debtS), max:25, color:'#4F8CFF' },
    { label:'SIP Investing', score:Math.round(sipS),  max:25, color:'#A78BFA' },
    { label:'Expense Ctrl',  score:Math.round(expS),  max:15, color:'#F59E0B' },
    { label:'Attendance',    score:Math.round(attS),  max:10, color:'#14B8A6' },
  ]};
};

// ── SMART INSIGHTS ────────────────────────────────────────────
export const smartInsights = (s) => {
  const d = derived(s);
  const insights = [];
  const wntPct  = s.expenses.find(e => e.label === 'Wants')?.pct || 30;
  const savPct  = s.expenses.find(e => e.label === 'Savings')?.pct || 20;
  const foodExp = s.manualExpenses.find(e => e.cat === 'Food')?.amount || 0;

  // Food overspend check
  if (foodExp > d.totalIncome * 0.25)
    insights.push({ icon:'🍔', msg:`Food spending ${fmt(foodExp)} = ${pct(foodExp, d.totalIncome)}% of income — target <20%`, color:'#EF4444', action:'Reduce by ₹' + Math.round(foodExp - d.totalIncome * 0.2) });

  // Wants overspend
  if (wntPct > 35)
    insights.push({ icon:'💸', msg:`Wants at ${wntPct}% — cut to 30% to free ${fmt(s.salary * (wntPct - 30) / 100)}/mo`, color:'#F59E0B', action:'Reduce Wants %' });

  // No SIP
  if (d.sipTotal === 0)
    insights.push({ icon:'📈', msg:'No SIP active — ₹500/mo in Nifty 50 Index grows to ₹1L+ in 10 years', color:'#4F8CFF', action:'Start SIP Now' });

  // High rate debt
  const highRate = s.debts.find(d => d.rate >= 24);
  if (highRate)
    insights.push({ icon:'🔥', msg:`${highRate.name} at ${highRate.rate}% is destroying wealth — pay ₹2K extra/mo`, color:'#EF4444', action:'Pay Extra EMI' });

  // Emergency fund low
  const ef = s.goals.find(g => g.title.toLowerCase().includes('emergency'));
  if (ef && pct(ef.saved, ef.target) < 50)
    insights.push({ icon:'🛟', msg:`Emergency fund only ${pct(ef.saved, ef.target)}% complete — build to ${fmt(efTarget(d.needsBudget))}`, color:'#F59E0B', action:'Build Emergency Fund' });

  // Low savings
  if (savPct < 15)
    insights.push({ icon:'🎯', msg:`Savings rate only ${savPct}% — industry standard is 20%+. Automate it.`, color:'#4F8CFF', action:'Increase Savings' });

  // Balance check
  if (d.balance < s.salary * 0.05)
    insights.push({ icon:'⚠️', msg:`Month-end balance ${fmt(d.balance)} is very low — review expenses`, color:'#EF4444', action:'Review Expenses' });

  // Positive — debt free + investing
  if (d.debtTotal === 0 && d.sipTotal > 0)
    insights.push({ icon:'🎉', msg:'Debt-free + investing — you are in the top 5% of savers!', color:'#22C55E', action:null });

  return insights;
};

// ── NEXT ACTION ───────────────────────────────────────────────
export const nextAction = (s) => {
  const d = derived(s);
  const score  = calcScore(s).total;
  const wntPct = s.expenses.find(e => e.label === 'Wants')?.pct || 30;
  const savPct = s.expenses.find(e => e.label === 'Savings')?.pct || 20;
  if (d.sipTotal === 0)          return { icon:'📈', title:'Start a SIP today',    desc:'₹500/mo in Nifty 50 = ₹1L+ in 10 years.', color:'#22C55E' };
  if (d.debtTotal > s.salary*3)  return { icon:'🏦', title:'Tackle debt first',    desc:`Pay ₹2K extra on high-rate debt.`, color:'#EF4444' };
  if (wntPct > 35)               return { icon:'💳', title:'Cut Wants spending',   desc:`${wntPct}% → 30% frees ${fmt(s.salary*(wntPct-30)/100)}/mo.`, color:'#F59E0B' };
  if (savPct < 20)               return { icon:'💰', title:'Increase Savings %',   desc:'Automate on salary day. Aim 20%.', color:'#4F8CFF' };
  if (score >= 80)               return { icon:'🚀', title:'Boost your SIP',       desc:`Double to ${fmt(d.sipTotal*2)}/mo for 2x corpus.`, color:'#A78BFA' };
                                 return { icon:'🎯', title:'Set a financial goal', desc:'Give your savings a purpose.', color:'#14B8A6' };
};

// ── ALERTS ────────────────────────────────────────────────────
export const calcAlerts = (s) => {
  const d = derived(s);
  const alerts = [];
  const wntPct  = s.expenses.find(e => e.label === 'Wants')?.pct || 30;
  const savPct  = s.expenses.find(e => e.label === 'Savings')?.pct || 20;
  const absent  = s.workingDays - d.present;
  const highRate = s.debts.find(x => x.rate >= 24);
  if (absent >= 5)             alerts.push({ icon:'📉', msg:`${absent} absent days → ${fmt(d.perDay * absent)} salary lost`, color:'#EF4444' });
  if (wntPct >= 40)            alerts.push({ icon:'💸', msg:`Wants ${wntPct}% — cut to 30%, save ${fmt(s.salary*(wntPct-30)/100)}/mo`, color:'#F59E0B' });
  if (highRate)                alerts.push({ icon:'🔥', msg:`${highRate.name} at ${highRate.rate}% — pay ₹2K extra/mo`, color:'#EF4444' });
  if (d.sipTotal === 0)        alerts.push({ icon:'📈', msg:'No SIP — ₹500/mo today = ₹1L+ in 10 years', color:'#4F8CFF' });
  if (savPct < 15)             alerts.push({ icon:'🎯', msg:`Savings only ${savPct}% — target 20%`, color:'#F59E0B' });
  if (d.manualTotal > d.needsBudget) alerts.push({ icon:'⚠️', msg:`Expenses ${fmt(d.manualTotal)} exceed budget ${fmt(d.needsBudget)}`, color:'#EF4444' });
  return alerts;
};

// ── DECISIONS ─────────────────────────────────────────────────
export const calcDecisions = (s) => {
  const d = derived(s);
  const decisions = [];
  const highRate = s.debts.length > 0 ? s.debts.reduce((a, x) => x.rate > a.rate ? x : a, s.debts[0]) : null;
  const smallest = s.debts.length > 0 ? s.debts.reduce((a, x) => x.remaining < a.remaining ? x : a, s.debts[0]) : null;
  const avgRet   = s.sips.length > 0 ? s.sips.reduce((a, x) => a + x.returns, 0) / s.sips.length : 12;
  const efSaved  = s.goals.find(g => g.title.toLowerCase().includes('emergency'))?.saved || 0;
  const efNeed   = efTarget(d.needsBudget);

  if (d.debtTotal > 0 && d.sipTotal > 0 && highRate)
    decisions.push(highRate.rate > avgRet + 3
      ? { q:'Invest or repay debt?', rec:'Repay Debt First',    reason:`${highRate.name} at ${highRate.rate}% > SIP returns ~${avgRet.toFixed(0)}%. Guaranteed ${highRate.rate}% return by repaying.`, icon:'🏦', color:'#EF4444' }
      : { q:'Invest or repay debt?', rec:'Keep Investing',      reason:`SIP ~${avgRet.toFixed(0)}% > debt ${highRate.rate}%. Continue investing while paying minimum EMI.`, icon:'📈', color:'#22C55E' });

  decisions.push({ q:'Should I switch jobs?', rec: s.salary < 80000 ? 'Yes — seek 35%+ hike' : 'Negotiate first', reason: s.salary < 80000 ? `A 40% hike = ${fmt(s.salary*1.4)}/mo (+${fmt(s.salary*0.4*12)}/yr). At your level switching > internal promotion.` : `At ${fmt(s.salary)}/mo, negotiate 20-25% first. Switch only if refused.`, icon:'💼', color:'#4F8CFF' });

  if (efSaved < efNeed * 0.5)
    decisions.push({ q:'Emergency fund or invest?', rec:'Build Emergency Fund', reason:`Only ${pct(efSaved,efNeed)}% of 6-month fund built. One crisis can derail all your investments.`, icon:'🛟', color:'#F59E0B' });

  decisions.push({ q:'Do I have enough insurance?', rec:`Need ${fmt(s.salary*12*10)} cover`, reason:`10x annual income rule. Pure term plan at your age = ₹800-1,200/mo premium.`, icon:'🛡️', color:'#A78BFA' });

  if (smallest)
    decisions.push({ q:'Which debt to pay first?', rec:`Snowball: ${smallest.name}`, reason:`Smallest debt ${fmt(smallest.remaining)} — pay it off in ${debtMonths(smallest.remaining, smallest.emi+5000)} months with ₹5K extra/mo. Win + motivation.`, icon:'❄️', color:'#14B8A6' });

  return decisions;
};

// ── PERSONALITY ───────────────────────────────────────────────
export const calcPersonality = (s) => {
  const savPct  = s.expenses.find(e => e.label === 'Savings')?.pct || 20;
  const wntPct  = s.expenses.find(e => e.label === 'Wants')?.pct || 30;
  const sipR    = s.sips.reduce((a,x)=>a+x.amount,0) / Math.max(s.salary,1);
  const debtR   = s.debts.reduce((a,d)=>a+d.remaining,0) / Math.max(s.salary,1);
  if (sipR > 0.15 && savPct >= 25) return { type:'💰 Investor',  desc:'You grow money smartly. Keep compounding.',    color:'#22C55E', bg:'#052e16' };
  if (wntPct <= 25 && savPct >= 20) return { type:'🧠 Balanced',  desc:'Perfect money discipline. You are crushing it.',color:'#4F8CFF', bg:'#0c1a4e' };
  if (wntPct >= 40)                 return { type:'💸 Spender',   desc:'Redirect 10% of wants to savings today.',      color:'#F59E0B', bg:'#431407' };
  if (debtR >= 3)                   return { type:'⚠️ Risky',     desc:'High debt load — avalanche method now.',        color:'#EF4444', bg:'#1f0a0a' };
  if (savPct >= 15)                 return { type:'📈 Growing',   desc:'On the right path. Boost your SIP.',           color:'#14B8A6', bg:'#042f2e' };
                                    return { type:'🌱 Beginner',  desc:'Set your first savings goal today.',            color:'#A78BFA', bg:'#1a0a38' };
};

export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
