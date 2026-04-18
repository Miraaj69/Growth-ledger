// initialState.js
export const INIT = () => {
  const now = new Date();
  return {
    // ── Core ──────────────────────────────────────────────────
    salary:       65000,
    workingDays:  26,
    userAge:      28,
    retirementAge:55,
    currentMonth: now.getMonth(),
    currentYear:  now.getFullYear(),
    attendance:   new Set(Array.from({ length: 20 }, (_, i) => i + 1)),

    // ── Income sources (salary always index 0) ────────────────
    incomes: [
      { label: 'Salary',    amount: 65000, recurring: true  },
      { label: 'Freelance', amount: 8000,  recurring: false },
    ],

    // ── Expense split (must sum to 100%) ──────────────────────
    expenses: [
      { label: 'Needs',   pct: 50, color: '#4F8CFF' },
      { label: 'Wants',   pct: 28, color: '#F59E0B' },
      { label: 'Savings', pct: 22, color: '#22C55E' },
    ],

    // ── Manual expenses ────────────────────────────────────────
    manualExpenses: [
      { cat: 'Rent',      amount: 15000, icon: '🏠', color: '#4F8CFF', recurring: true  },
      { cat: 'Food',      amount: 8000,  icon: '🍜', color: '#F59E0B', recurring: false },
      { cat: 'Travel',    amount: 3500,  icon: '🚗', color: '#A78BFA', recurring: false },
      { cat: 'Utilities', amount: 2000,  icon: '💡', color: '#14B8A6', recurring: true  },
      { cat: 'Shopping',  amount: 4500,  icon: '🛍️', color: '#EC4899', recurring: false },
    ],

    // ── SIPs ──────────────────────────────────────────────────
    sips: [
      { name: 'Nifty 50 Index', amount: 3000, returns: 14, months: 24, goalLink: 'Emergency Fund' },
      { name: 'ELSS Tax Saver', amount: 2000, returns: 16, months: 36, goalLink: 'Course Budget'  },
      { name: 'Mid Cap Fund',   amount: 1500, returns: 18, months: 12, goalLink: null              },
    ],

    // ── Debts ─────────────────────────────────────────────────
    debts: [
      { name: 'Personal Loan', amount: 150000, remaining: 88000, emi: 9000, rate: 12, dueDate: 5  },
      { name: 'Credit Card',   amount: 40000,  remaining: 18000, emi: 5000, rate: 36, dueDate: 20 },
    ],

    // ── Goals ─────────────────────────────────────────────────
    goals: [
      { title: 'Emergency Fund', target: 180000, saved: 95000,  color: '#22C55E', linked: 'Savings', deadline: '2025-06' },
      { title: 'Laptop Upgrade',  target: 80000,  saved: 32000,  color: '#4F8CFF', linked: 'Wants',   deadline: '2025-12' },
      { title: 'Course Budget',   target: 25000,  saved: 10000,  color: '#A78BFA', linked: 'SIP',     deadline: '2025-09' },
    ],

    // ── Assets ────────────────────────────────────────────────
    assets: [
      { label: 'SIP Portfolio',   value: 85000  },
      { label: 'Savings Account', value: 95000  },
      { label: 'Fixed Deposit',   value: 50000  },
    ],

    // ── Leaves ────────────────────────────────────────────────
    leaves: [
      { type: 'PL', label: 'Privilege', total: 12, used: 4 },
      { type: 'SL', label: 'Sick',      total: 6,  used: 1 },
      { type: 'CL', label: 'Casual',    total: 8,  used: 2 },
    ],

    // ── Certifications ────────────────────────────────────────
    certifications: [
      { name: 'NEBOSH IGC',   body: 'NEBOSH UK', status: 'Done',        icon: '🏅', color: '#22C55E' },
      { name: 'IOSH MS',      body: 'IOSH UK',   status: 'Done',        icon: '🎖️', color: '#4F8CFF' },
      { name: 'ISO 45001 LA', body: 'BSI Group', status: 'In Progress', icon: '📋', color: '#F59E0B' },
      { name: 'ADIS',         body: 'IICPE',     status: 'Planned',     icon: '📝', color: '#475569' },
    ],

    // ── Transactions ──────────────────────────────────────────
    transactions: [
      { desc: 'Swiggy',       amount: 450,  cat: 'Food',   type: 'expense', icon: '🍜', date: 'Jan 15' },
      { desc: 'Uber',         amount: 280,  cat: 'Travel', type: 'expense', icon: '🚗', date: 'Jan 14' },
      { desc: 'Zomato',       amount: 320,  cat: 'Food',   type: 'expense', icon: '🍜', date: 'Jan 13' },
      { desc: 'Freelance',    amount: 8000, cat: 'Income', type: 'income',  icon: '💰', date: 'Jan 10' },
      { desc: 'Electricity',  amount: 1400, cat: 'Bills',  type: 'expense', icon: '💡', date: 'Jan 8'  },
    ],

    // ── Charts ────────────────────────────────────────────────
    monthlyData: [38000,44000,41000,48000,52000,45000,51000,54000,47000,58000,55000,65000],
    spendData:   [22000,24000,21000,26000,28000,24000,27000,30000,25000,31000,28000,35000],

    // ── Behavior history ──────────────────────────────────────
    behaviorHistory: [
      { month: 'Nov', wantsPct: 32, savePct: 20, attended: 22 },
      { month: 'Dec', wantsPct: 36, savePct: 18, attended: 21 },
      { month: 'Jan', wantsPct: 28, savePct: 22, attended: 20 },
    ],

    // ── Simulator ─────────────────────────────────────────────
    simSalaryHike: 20,
    simSipMulti:   2,
    simSipStepUp:  10,

    // ── Gamification ──────────────────────────────────────────
    xpTotal:     1240,
    level:       3,
    loginStreak: 5,

    // ── Settings ──────────────────────────────────────────────
    autoAdjust:    false,
    maskAmounts:   false,
    biometricLock: false,
    notifs:        { salary: true, sip: true, emi: false, weekly: true },
    lastSaved:     new Date().toISOString().slice(0, 10),
  };
};
