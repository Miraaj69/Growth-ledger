// calculations.js
export const inr = (n) =>
  '₹' + Number(Math.max(0, Math.round(n))).toLocaleString('en-IN');

export const pct = (v, t) =>
  t ? Math.min(100, Math.max(0, Math.round((v / t) * 100))) : 0;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const sipMaturity = (amount, months, annualRetPct) => {
  const r = annualRetPct / 100 / 12;
  if (r === 0) return amount * months;
  return Math.round(amount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r));
};

export const cagrCalc = (present, future, years) =>
  years > 0 ? ((Math.pow(future / Math.max(present, 1), 1 / years) - 1) * 100).toFixed(1) : 0;

export const inflationAdjust = (value, years, inflationRate = 6) =>
  Math.round(value / Math.pow(1 + inflationRate / 100, years));

export const debtMonths = (remaining, emi) =>
  remaining <= 0 ? 0 : Math.ceil(remaining / Math.max(emi, 1));

export const emergencyTarget = (monthlyExpenses, months = 6) => monthlyExpenses * months;

export const retirementTarget = (annualIncome, yearsToRetire) =>
  Math.round(annualIncome * 0.7 * 25 * Math.pow(1.06, yearsToRetire));

export const monthlyForGoal = (target, saved, months) =>
  months > 0 ? Math.max(0, Math.round((target - saved) / months)) : 0;

export const calcScore = (s) => {
  const present   = s.attendance ? s.attendance.size : 0;
  const sipTotal  = s.sips.reduce((a, x) => a + x.amount, 0);
  const totalDebt = s.debts.reduce((a, d) => a + d.remaining, 0);
  const savPct    = s.expenses.find((e) => e.label === 'Savings')?.pct || 20;
  const wntPct    = s.expenses.find((e) => e.label === 'Wants')?.pct || 30;
  const sipR      = sipTotal / Math.max(s.salary, 1);
  const debtR     = totalDebt / Math.max(s.salary * 12, 1);
  const attR      = present / Math.max(s.workingDays, 1);
  const savScore  = clamp(savPct * 2.5, 0, 25);
  const debtScore = totalDebt === 0 ? 25 : clamp(25 - debtR * 25, 0, 25);
  const sipScore  = clamp(sipR * 200, 0, 25);
  const expScore  = clamp((100 - wntPct) / 2, 0, 15);
  const attScore  = clamp(attR * 10, 0, 10);
  const total     = Math.round(savScore + debtScore + sipScore + expScore + attScore);
  return {
    total,
    breakdown: [
      { label: 'Savings Rate',  score: Math.round(savScore),  max: 25 },
      { label: 'Debt Health',   score: Math.round(debtScore), max: 25 },
      { label: 'SIP Investing', score: Math.round(sipScore),  max: 25 },
      { label: 'Expense Ctrl',  score: Math.round(expScore),  max: 15 },
      { label: 'Attendance',    score: Math.round(attScore),  max: 10 },
    ],
  };
};

export const calcPersonality = (s) => {
  const savPct   = s.expenses.find((e) => e.label === 'Savings')?.pct || 20;
  const wntPct   = s.expenses.find((e) => e.label === 'Wants')?.pct || 30;
  const sipTotal = s.sips.reduce((a, x) => a + x.amount, 0);
  const sipR     = sipTotal / Math.max(s.salary, 1);
  const debtR    = s.debts.reduce((a, d) => a + d.remaining, 0) / Math.max(s.salary, 1);
  if (sipR > 0.15 && savPct >= 25) return { type: '💰 Investor',  desc: 'You grow money smartly.',       color: '#22C55E' };
  if (wntPct <= 25 && savPct >= 20) return { type: '🧠 Balanced',  desc: 'Perfect money balance.',        color: '#3B82F6' };
  if (wntPct >= 40)                 return { type: '💸 Spender',   desc: 'Redirect 10% to savings.',      color: '#F59E0B' };
  if (debtR >= 3)                   return { type: '⚠️ Risky',     desc: 'High debt — act now.',          color: '#F43F5E' };
  if (savPct >= 15)                 return { type: '📈 Growing',   desc: 'Boost your SIP now.',           color: '#14B8A6' };
                                    return { type: '🌱 Beginner',  desc: 'Set your first goal today.',     color: '#A78BFA' };
};

export const calcAlerts = (s) => {
  const alerts   = [];
  const present  = s.attendance ? s.attendance.size : 0;
  const absent   = s.workingDays - present;
  const wntPct   = s.expenses.find((e) => e.label === 'Wants')?.pct || 30;
  const savPct   = s.expenses.find((e) => e.label === 'Savings')?.pct || 20;
  const sipTotal = s.sips.reduce((a, x) => a + x.amount, 0);
  const highRate = s.debts.find((d) => d.rate >= 24);
  const manTotal = s.manualExpenses.reduce((a, e) => a + e.amount, 0);
  const budget   = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);
  if (absent >= 5)       alerts.push({ icon: '📉', msg: `${absent} absent days → ${inr((s.salary / s.workingDays) * absent)} salary lost`, color: '#F43F5E' });
  if (wntPct >= 40)      alerts.push({ icon: '💸', msg: `Wants ${wntPct}% — cut to 25%, save ${inr(s.salary * (wntPct - 25) / 100)}/mo`, color: '#F59E0B' });
  if (highRate)          alerts.push({ icon: '🔥', msg: `${highRate.name} at ${highRate.rate}% — pay ₹2K extra/mo`, color: '#F43F5E' });
  if (sipTotal === 0)    alerts.push({ icon: '📈', msg: 'No active SIP — ₹500/mo in Nifty 50 = ₹1L+ in 10 years', color: '#3B82F6' });
  if (savPct < 15)       alerts.push({ icon: '🎯', msg: `Savings only ${savPct}% — target 20% minimum`, color: '#F59E0B' });
  if (manTotal > budget) alerts.push({ icon: '⚠️', msg: `Expenses ${inr(manTotal)} exceed Needs budget ${inr(budget)}`, color: '#F43F5E' });
  return alerts;
};

export const calcNextAction = (s) => {
  const score     = calcScore(s).total;
  const sipTotal  = s.sips.reduce((a, x) => a + x.amount, 0);
  const totalDebt = s.debts.reduce((a, d) => a + d.remaining, 0);
  const wntPct    = s.expenses.find((e) => e.label === 'Wants')?.pct || 30;
  const savPct    = s.expenses.find((e) => e.label === 'Savings')?.pct || 20;
  if (sipTotal === 0)            return { icon: '📈', action: 'Start a SIP today',   detail: '₹500/mo in Nifty 50 = ₹1L+ in 10 years.', color: '#22C55E' };
  if (totalDebt > s.salary * 3) return { icon: '🏦', action: 'Tackle debt first',   detail: 'Pay ₹2K extra on high-rate debt — saves months.', color: '#F43F5E' };
  if (wntPct > 35)              return { icon: '💳', action: 'Cut Wants spending',   detail: `${wntPct}% → 25% frees ${inr(s.salary * (wntPct - 25) / 100)}/mo.`, color: '#F59E0B' };
  if (savPct < 20)              return { icon: '💰', action: 'Increase Savings %',   detail: 'Automate savings on salary day. Aim 20%.', color: '#3B82F6' };
  if (score >= 80)              return { icon: '🚀', action: 'Boost your SIP',       detail: `Double SIP to ${inr(sipTotal * 2)}/mo for 2x returns.`, color: '#A78BFA' };
                                return { icon: '🎯', action: 'Set a new goal',        detail: 'Give your savings a purpose.', color: '#14B8A6' };
};

export const calcDecisions = (s) => {
  const decisions = [];
  const totalDebt = s.debts.reduce((a, d) => a + d.remaining, 0);
  const sipTotal  = s.sips.reduce((a, x) => a + x.amount, 0);
  const highRate  = s.debts.length > 0 ? s.debts.reduce((a, d) => (d.rate > a.rate ? d : a), s.debts[0]) : null;
  const monthlyExp = s.salary * ((s.expenses.find((e) => e.label === 'Needs')?.pct || 50) / 100);
  const efTarget  = emergencyTarget(monthlyExp);
  const efSaved   = s.goals.find((g) => g.title.toLowerCase().includes('emergency'))?.saved || 0;

  if (totalDebt > 0 && sipTotal > 0 && highRate) {
    const sipReturn = s.sips.length > 0 ? s.sips.reduce((a, x) => a + x.returns, 0) / s.sips.length : 12;
    decisions.push(
      highRate.rate > sipReturn + 3
        ? { q: 'Invest or repay debt first?', rec: 'Repay Debt',       reason: `${highRate.name} charges ${highRate.rate}% but SIPs return ~${sipReturn.toFixed(0)}%. Pay extra EMI.`, icon: '🏦', color: '#F43F5E' }
        : { q: 'Invest or repay debt first?', rec: 'Keep Investing',   reason: `SIP returns (~${sipReturn.toFixed(0)}%) exceed debt interest (${highRate.rate}%). Keep investing.`,   icon: '📈', color: '#22C55E' }
    );
  }
  decisions.push({ q: 'Should I switch job now?', rec: s.salary < 80000 ? 'Switch if 35%+ hike' : 'Negotiate first', reason: s.salary < 80000 ? `A 40% hike = ${inr(s.salary * 1.4)}/mo. Switching > promoting at your level.` : `At ${inr(s.salary)}/mo, negotiate 20-25% first.`, icon: '💼', color: '#3B82F6' });
  if (efSaved < efTarget * 0.5) decisions.push({ q: 'Emergency fund or invest?', rec: 'Emergency fund first', reason: `Only ${pct(efSaved, efTarget)}% of 6-month fund (${inr(efTarget)}) built.`, icon: '🛟', color: '#F59E0B' });
  decisions.push({ q: 'Do I have enough insurance?', rec: `Need ${inr(s.salary * 12 * 10)} life cover`, reason: `10x annual income rule. Pure term plan costs ₹800-1200/mo.`, icon: '🛡️', color: '#A78BFA' });
  return decisions;
};

export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
