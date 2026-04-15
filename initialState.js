// initialState.js
export const createInitialState = () => ({
  onboarded: true, salary: 65000, workingDays: 26, userAge: 28, retirementAge: 55,
  currentMonth: new Date().getMonth(), currentYear: new Date().getFullYear(),
  attendance: new Set(Array.from({ length: 20 }, (_, i) => i + 1)),
  expenses: [
    { label: 'Needs',   pct: 50, color: '#3B82F6' },
    { label: 'Wants',   pct: 28, color: '#F59E0B' },
    { label: 'Savings', pct: 22, color: '#22C55E' },
  ],
  sips: [
    { name: 'Nifty 50 Index', amount: 3000, returns: 14, months: 24, goalLink: 'Emergency Fund', startDate: '2024-01' },
    { name: 'ELSS Tax Saver', amount: 2000, returns: 16, months: 36, goalLink: 'Course Budget',  startDate: '2024-01' },
    { name: 'Mid Cap Fund',   amount: 1500, returns: 18, months: 12, goalLink: null,             startDate: '2024-06' },
  ],
  debts: [
    { name: 'Personal Loan', amount: 150000, remaining: 88000, emi: 9000, rate: 12, dueDate: 5  },
    { name: 'Credit Card',   amount: 40000,  remaining: 18000, emi: 5000, rate: 36, dueDate: 20 },
  ],
  leaves: [
    { type: 'PL', label: 'Privilege', total: 12, used: 4 },
    { type: 'SL', label: 'Sick',      total: 6,  used: 1 },
    { type: 'CL', label: 'Casual',    total: 8,  used: 2 },
  ],
  certifications: [
    { name: 'NEBOSH IGC',   body: 'NEBOSH UK', status: 'Done',        icon: '🏅', color: '#22C55E' },
    { name: 'IOSH MS',      body: 'IOSH UK',   status: 'Done',        icon: '🎖️', color: '#3B82F6' },
    { name: 'ISO 45001 LA', body: 'BSI Group', status: 'In Progress', icon: '📋', color: '#F59E0B' },
    { name: 'ADIS',         body: 'IICPE',     status: 'Planned',     icon: '📝', color: '#475569' },
  ],
  goals: [
    { title: 'Emergency Fund', target: 180000, saved: 95000,  color: '#22C55E', linked: 'Savings', deadline: '2025-06' },
    { title: 'Laptop Upgrade',  target: 80000,  saved: 32000,  color: '#3B82F6', linked: 'Wants',   deadline: '2025-12' },
    { title: 'Course Budget',   target: 25000,  saved: 10000,  color: '#A78BFA', linked: 'SIP',     deadline: '2025-09' },
  ],
  assets: [
    { label: 'SIP Portfolio',   value: 85000  },
    { label: 'Savings Account', value: 95000  },
    { label: 'Fixed Deposit',   value: 50000  },
  ],
  incomes: [
    { label: 'Salary',    amount: 65000, recurring: true  },
    { label: 'Freelance', amount: 8000,  recurring: false },
  ],
  manualExpenses: [
    { cat: 'Rent',      amount: 15000, icon: '🏠', color: '#3B82F6', recurring: true  },
    { cat: 'Food',      amount: 8000,  icon: '🍜', color: '#F59E0B', recurring: false },
    { cat: 'Travel',    amount: 3500,  icon: '🚗', color: '#A78BFA', recurring: false },
    { cat: 'Utilities', amount: 2000,  icon: '💡', color: '#14B8A6', recurring: true  },
    { cat: 'Shopping',  amount: 4500,  icon: '🛍️', color: '#EC4899', recurring: false },
  ],
  transactions: [
    { cat: 'Food',   desc: 'Swiggy',     amount: 450,  date: 'Jan 15', type: 'expense', icon: '🍜' },
    { cat: 'Travel', desc: 'Uber',        amount: 280,  date: 'Jan 14', type: 'expense', icon: '🚗' },
    { cat: 'Food',   desc: 'Zomato',      amount: 320,  date: 'Jan 13', type: 'expense', icon: '🍜' },
    { cat: 'Income', desc: 'Freelance',   amount: 8000, date: 'Jan 10', type: 'income',  icon: '💰' },
    { cat: 'Bills',  desc: 'Electricity', amount: 1400, date: 'Jan 8',  type: 'expense', icon: '💡' },
  ],
  monthlyData: [38000,44000,41000,48000,52000,45000,51000,54000,47000,58000,55000,65000],
  spendData:   [22000,24000,21000,26000,28000,24000,27000,30000,25000,31000,28000,35000],
  behaviorHistory: [
    { month: 'Nov', wantsPct: 32, savePct: 20, attended: 22 },
    { month: 'Dec', wantsPct: 36, savePct: 18, attended: 21 },
    { month: 'Jan', wantsPct: 28, savePct: 22, attended: 20 },
  ],
  autoAdjust: false, simSalaryHike: 20, simSipMulti: 2, simSipStepUp: 10,
  maskAmounts: false, biometricLock: false,
  notifs: { salary: true, sip: true, emi: false, weekly: true },
  xpTotal: 1240, level: 3, loginStreak: 5,
  lastSaved: new Date().toISOString().slice(0, 10),
});
