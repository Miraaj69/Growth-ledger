
// Pure utility functions. Zero hardcoded financial values.

// ── Formatting ──────────────────────────────────────────────
export const fmt = (n) => {
  const num = Number(n);
  if (isNaN(num) || num === null || num === undefined) return '₹0';
  return '₹' + Math.max(0, Math.round(num)).toLocaleString('en-IN');
};

export const fmtPct = (n) => {
  const num = Number(n);
  return isNaN(num) ? '0%' : `${Math.round(num)}%`;
};

export const fmtShort = (n) => {
  const num = Number(n);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
  return fmt(num);
};

// ── Safe number parsing ──────────────────────────────────────
export const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) || n < 0 ? fallback : n;
};

export const safePct = (v, t) => {
  const val = safeNum(v), total = safeNum(t);
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((val / total) * 100)));
};

// ── Financial calculations ───────────────────────────────────
export const sipMaturity = (amount, months, annualPct) => {
  const a = safeNum(amount), m = safeNum(months, 1), r = safeNum(annualPct);
  const rate = r / 100 / 12;
  if (rate === 0) return a * m;
  return Math.round(a * ((Math.pow(1 + rate, m) - 1) / rate) * (1 + rate));
};

export const sipCAGR = (invested, maturity, years) => {
  const i = safeNum(invested, 1), m = safeNum(maturity), y = safeNum(years, 1);
  if (i === 0 || y === 0) return '0';
  return ((Math.pow(m / i, 1 / y) - 1) * 100).toFixed(1);
};

export const inflAdj = (val, years, rate = 6) => {
  const v = safeNum(val), y = safeNum(years);
  return Math.round(v / Math.pow(1 + rate / 100, y));
};

export const debtMonths = (remaining, emi) => {
  const r = safeNum(remaining), e = safeNum(emi, 1);
  return r <= 0 ? 0 : Math.ceil(r / e);
};

export const monthlyNeeded = (target, saved, months) => {
  const t = safeNum(target), s = safeNum(saved), m = safeNum(months, 1);
  return Math.max(0, Math.round((t - s) / m));
};

export const efTarget = (monthlyExp, months = 6) => safeNum(monthlyExp) * months;

export const retirementCorpus = (annualInc, yearsToRetire) => {
  const a = safeNum(annualInc), y = safeNum(yearsToRetire, 1);
  return Math.round(a * 0.7 * 25 * Math.pow(1.06, y));
};

export const deadlineMonths = (deadline) => {
  if (!deadline) return 12;
  const diff = new Date(deadline) - new Date();
  return Math.max(1, Math.round(diff / 1000 / 60 / 60 / 24 / 30));
};

// ── Derived totals — SINGLE SOURCE OF TRUTH ─────────────────
export const deriveState = (s) => {
  try {
    const attendance = s.attendance instanceof Set ? s.attendance : new Set(s.attendance || []);
    const salary     = safeNum(s.salary);
    const workDays   = safeNum(s.workingDays, 26);
    const present    = attendance.size;
    const perDay     = workDays > 0 ? salary / workDays : 0;
    const earnedSal  = perDay * present;
    const otherInc   = (s.incomes || []).slice(1).reduce((a, x) => a + safeNum(x?.amount), 0);
    const totalIncome= earnedSal + otherInc;
    const sipTotal   = (s.sips || []).reduce((a, x) => a + safeNum(x?.amount), 0);
    const debtEmi    = (s.debts || []).reduce((a, d) => a + safeNum(d?.emi), 0);
    const debtTotal  = (s.debts || []).reduce((a, d) => a + safeNum(d?.remaining), 0);
    const manualTotal= (s.manualExpenses || []).reduce((a, e) => a + safeNum(e?.amount), 0);
    const totalAssets= (s.assets || []).reduce((a, x) => a + safeNum(x?.value), 0);
    const needsPct   = (s.expenses || []).find(e => e?.label === 'Needs')?.pct || 0;
    const needsBudget= salary * needsPct / 100;
    const balance    = Math.max(0, totalIncome - manualTotal - debtEmi - sipTotal);
    const lostSal    = perDay * (workDays - present);
    const netWorth   = totalAssets - debtTotal;
    const totalOut   = manualTotal + debtEmi + sipTotal;
    // Savings rate
    const savePct    = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
    return {
      attendance, salary, workDays, present, perDay,
      earnedSalary: earnedSal, otherIncome: otherInc, totalIncome,
      sipTotal, debtEmi, debtTotal, manualTotal, totalAssets,
      needsBudget, balance, lostSalary: lostSal, netWorth,
      totalOut, savePct,
    };
  } catch (err) {
    console.warn('[deriveState] error:', err);
    return {
      attendance: new Set(), salary:0, workDays:26, present:0, perDay:0,
      earnedSalary:0, otherIncome:0, totalIncome:0, sipTotal:0,
      debtEmi:0, debtTotal:0, manualTotal:0, totalAssets:0,
      needsBudget:0, balance:0, lostSalary:0, netWorth:0, totalOut:0, savePct:0,
    };
  }
};

// ── Insights / Analytics ────────────────────────────────────
export const buildInsights = (s) => {
  try {
    const d = deriveState(s);
    const insights = [];
    const wntPct   = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
    const savPct   = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
    const foodExp  = (s.manualExpenses || []).find(e => e?.cat === 'Food')?.amount || 0;
    const highRate = (s.debts || []).find(d => safeNum(d?.rate) >= 24);
    const ef       = (s.goals || []).find(g => g?.title?.toLowerCase().includes('emergency'));
    const efSaved  = safeNum(ef?.saved);
    const efNeed   = efTarget(d.needsBudget);

    if (d.totalIncome === 0) {
      insights.push({ icon:'💡', msg:'Add your salary to get personalized insights', color:'#4F8CFF', type:'info' });
      return insights;
    }
    if (foodExp > 0 && foodExp > d.totalIncome * 0.25)
      insights.push({ icon:'🍔', msg:`Food ${fmt(foodExp)} is ${safePct(foodExp,d.totalIncome)}% of income — target <20%`, color:'#EF4444', type:'warning' });
    if (wntPct >= 40)
      insights.push({ icon:'💸', msg:`Wants at ${wntPct}% — reduce to 30%, free up ${fmt(d.salary*(wntPct-30)/100)}/mo`, color:'#F59E0B', type:'warning' });
    if (d.sipTotal === 0 && d.totalIncome > 0)
      insights.push({ icon:'📈', msg:'No SIP active — ₹500/mo in Nifty 50 grows 10x in 25 years', color:'#4F8CFF', type:'info' });
    if (highRate)
      insights.push({ icon:'🔥', msg:`${highRate.name} at ${highRate.rate}% — pay ₹2K extra/mo to clear faster`, color:'#EF4444', type:'danger' });
    if (efNeed > 0 && efSaved < efNeed * 0.5)
      insights.push({ icon:'🛟', msg:`Emergency fund ${safePct(efSaved,efNeed)}% built — target ${fmt(efNeed)}`, color:'#F59E0B', type:'warning' });
    if (savPct < 15 && d.totalIncome > 0)
      insights.push({ icon:'🎯', msg:`Savings only ${savPct}% — automate 20% on salary day`, color:'#4F8CFF', type:'info' });
    if (d.balance < d.totalIncome * 0.05 && d.totalIncome > 0)
      insights.push({ icon:'⚠️', msg:`Month-end balance only ${fmt(d.balance)} — review expenses`, color:'#EF4444', type:'danger' });
    if (d.debtTotal === 0 && d.sipTotal > 0)
      insights.push({ icon:'🎉', msg:'Debt-free + investing — you are in top 5% of savers!', color:'#22C55E', type:'success' });
    if (insights.length === 0)
      insights.push({ icon:'✅', msg:'Your finances look healthy! Keep it up.', color:'#22C55E', type:'success' });
    return insights;
  } catch (err) {
    console.warn('[buildInsights] error:', err);
    return [{ icon:'💡', msg:'Add your data to see personalized insights', color:'#4F8CFF', type:'info' }];
  }
};

export const calcScore = (s) => {
  try {
    const d = deriveState(s);
    const savPct  = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
    const wntPct  = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
    const sipR    = d.salary > 0 ? d.sipTotal / d.salary : 0;
    const debtR   = d.salary > 0 ? d.debtTotal / (d.salary * 12) : 0;
    const attR    = d.workDays > 0 ? d.present / d.workDays : 0;
    const savS  = Math.min(savPct * 2.5, 25);
    const debtS = d.debtTotal === 0 ? 25 : Math.max(0, Math.min(25 - debtR * 25, 25));
    const sipS  = Math.min(sipR * 200, 25);
    const expS  = Math.min((100 - wntPct) / 2, 15);
    const attS  = Math.min(attR * 10, 10);
    const total = Math.round(savS + debtS + sipS + expS + attS);
    const color = total >= 80 ? '#22C55E' : total >= 65 ? '#14B8A6' : total >= 50 ? '#4F8CFF' : total >= 35 ? '#F59E0B' : '#EF4444';
    const label = total >= 90 ? 'Outstanding 🌟' : total >= 80 ? 'Excellent 🔥' : total >= 70 ? 'Great 💪' : total >= 55 ? 'Good 👍' : total >= 40 ? 'Fair ⚠️' : 'Needs Work 🆘';
    return { total, color, label, breakdown: [
      { label:'Savings Rate',  score:Math.round(savS),  max:25, color:'#22C55E' },
      { label:'Debt Health',   score:Math.round(debtS), max:25, color:'#4F8CFF' },
      { label:'SIP Investing', score:Math.round(sipS),  max:25, color:'#A78BFA' },
      { label:'Expense Ctrl',  score:Math.round(expS),  max:15, color:'#F59E0B' },
      { label:'Attendance',    score:Math.round(attS),  max:10, color:'#14B8A6' },
    ]};
  } catch (err) {
    console.warn('[calcScore] error:', err);
    return { total:0, color:'#EF4444', label:'No data', breakdown:[] };
  }
};

export const calcPersonality = (s) => {
  try {
    const d = deriveState(s);
    if (d.salary === 0) return { type:'🌱 New User', desc:'Enter your salary to get started.', color:'#A78BFA' };
    const savPct = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
    const wntPct = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
    const sipR   = d.salary > 0 ? d.sipTotal / d.salary : 0;
    const debtR  = d.salary > 0 ? d.debtTotal / d.salary : 0;
    if (sipR > 0.15 && savPct >= 25) return { type:'💰 Investor',  desc:'You grow money smartly.',         color:'#22C55E' };
    if (wntPct <= 25 && savPct >= 20) return { type:'🧠 Balanced',  desc:'Perfect money discipline.',       color:'#4F8CFF' };
    if (wntPct >= 40)                 return { type:'💸 Spender',   desc:'Redirect 10% to savings today.', color:'#F59E0B' };
    if (debtR >= 3)                   return { type:'⚠️ Risky',     desc:'High debt — act now.',            color:'#EF4444' };
    if (savPct >= 15)                 return { type:'📈 Growing',   desc:'Boost your SIP now.',             color:'#14B8A6' };
    return { type:'🌱 Beginner', desc:'Set your first savings goal.', color:'#A78BFA' };
  } catch { return { type:'🌱 Beginner', desc:'Set your first savings goal.', color:'#A78BFA' }; }
};

export const nextAction = (s) => {
  try {
    const d = deriveState(s);
    const sc = calcScore(s).total;
    const wntPct = (s.expenses || []).find(e => e?.label === 'Wants')?.pct || 0;
    const savPct = (s.expenses || []).find(e => e?.label === 'Savings')?.pct || 0;
    if (d.salary === 0)          return { icon:'💰', title:'Add your salary',     desc:'Go to Money tab and enter your salary.', color:'#4F8CFF' };
    if (d.sipTotal === 0)        return { icon:'📈', title:'Start a SIP today',   desc:'₹500/mo in Nifty 50 = wealth over time.', color:'#22C55E' };
    if (d.debtTotal > d.salary*3)return { icon:'🏦', title:'Tackle debt first',   desc:'Pay ₹2K extra on high-rate loans.', color:'#EF4444' };
    if (wntPct > 35)             return { icon:'💳', title:'Cut Wants spending',  desc:`${wntPct}% → 30% frees ${fmt(d.salary*(wntPct-30)/100)}/mo.`, color:'#F59E0B' };
    if (savPct < 20)             return { icon:'💰', title:'Increase Savings',    desc:'Automate savings on salary day.', color:'#4F8CFF' };
    if (sc >= 80)                return { icon:'🚀', title:'Boost your SIP',      desc:`Double to ${fmt(d.sipTotal*2)}/mo.`, color:'#A78BFA' };
    return { icon:'🎯', title:'Set a financial goal', desc:'Give your savings a purpose.', color:'#14B8A6' };
  } catch { return { icon:'💰', title:'Add your salary', desc:'Start by entering your salary.', color:'#4F8CFF' }; }
};

export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
