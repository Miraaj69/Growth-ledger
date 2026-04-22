
// Single source of truth. NO hardcoded financial values.
import React, {
  createContext, useContext, useReducer,
  useEffect, useRef, useCallback, useMemo,
} from 'react';
import { saveState, loadState } from './storage';

const AppContext = createContext(null);

// ── EMPTY STATE — no fake data ─────────────────────────────
const EMPTY_STATE = () => ({
  // User must enter these
  salary:       0,
  workingDays:  26,
  userAge:      0,
  retirementAge:60,
  currentMonth: new Date().getMonth(),
  currentYear:  new Date().getFullYear(),
  attendance:   new Set(),

  // Income sources (index 0 = salary, auto-synced)
  incomes: [
    { id:'salary', label:'Salary', amount:0, recurring:true },
  ],

  // Expense split — start at 0 so user sets their own
  expenses: [
    { label:'Needs',   pct:50, color:'#4F8CFF' },
    { label:'Wants',   pct:30, color:'#F59E0B' },
    { label:'Savings', pct:20, color:'#22C55E' },
  ],

  // All empty — user adds their own
  sips:           [],
  debts:          [],
  goals:          [],
  assets:         [],
  manualExpenses: [],
  transactions:   [],
  certifications: [],
  leaves: [
    { type:'PL', label:'Privilege', total:0, used:0 },
    { type:'SL', label:'Sick',      total:0, used:0 },
    { type:'CL', label:'Casual',    total:0, used:0 },
  ],

  // Chart history — populated as user logs data
  monthlyData: new Array(12).fill(0),
  spendData:   new Array(12).fill(0),

  // Simulator defaults
  simSalaryHike: 10,
  simSipMulti:   2,
  simSipStepUp:  10,

  // Gamification
  xpTotal:     0,
  level:       1,
  loginStreak: 1,

  // Settings
  autoAdjust:    false,
  maskAmounts:   false,
  biometricLock: false,
  notifs: { salary:true, sip:true, emi:true, weekly:true },
  themeMode:   'dark',
  lastSaved:   null,
  onboarded:   false,
});

// ── REDUCER ───────────────────────────────────────────────
function reducer(state, action) {
  try {
    switch (action.type) {

      case 'SET':
        return { ...state, ...action.payload, lastSaved: new Date().toISOString().slice(0,10) };

      // Salary update — keeps incomes[0] in sync
      case 'SET_SALARY': {
        const sal = Math.max(0, Number(action.salary) || 0);
        const incomes = (state.incomes || []).map((inc, i) =>
          i === 0 ? { ...inc, amount: sal } : inc
        );
        // Also update current month's data
        const monthlyData = [...(state.monthlyData || new Array(12).fill(0))];
        monthlyData[state.currentMonth] = sal;
        return { ...state, salary: sal, incomes, monthlyData };
      }

      // Attendance
      case 'TOGGLE_ATT': {
        const att = new Set(state.attendance instanceof Set ? state.attendance : new Set());
        att.has(action.day) ? att.delete(action.day) : att.add(action.day);
        const xpDelta = att.has(action.day) ? 10 : -10;
        return { ...state, attendance: att, xpTotal: Math.max(0, (state.xpTotal||0) + xpDelta) };
      }

      // XP system
    case 'ADD_XP': {
      const xp     = Math.max(0, Number(action.xp) || 0);
      const newXP  = (state.xpTotal || 0) + xp;
      const newLvl = Math.floor(newXP / 100) + 1;
      const hist   = [...(state.xpHistory || []), { date: new Date().toISOString().slice(0,10), xp, reason: action.reason || '' }].slice(-50);
      const newBadges = [...(state.badges || [])];
      if (newLvl >= 5  && !newBadges.includes('veteran'))  newBadges.push('veteran');
      if (newLvl >= 10 && !newBadges.includes('master'))   newBadges.push('master');
      if (newXP  >= 1000 && !newBadges.includes('whale'))  newBadges.push('whale');
      return { ...state, xpTotal: newXP, level: newLvl, xpHistory: hist, badges: newBadges };
    }

    // Daily login + streak
    case 'DAILY_LOGIN': {
      const today    = new Date().toISOString().slice(0,10);
      const last     = state.lastLoginDate;
      if (last === today) return state; // already logged today
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      const streak   = last === yesterday ? (state.loginStreak || 1) + 1 : 1;
      const xp       = 10 + Math.min(streak, 7) * 2; // bonus for streaks
      const newXP    = (state.xpTotal || 0) + xp;
      const newLvl   = Math.floor(newXP / 100) + 1;
      return { ...state, lastLoginDate: today, loginStreak: streak, xpTotal: newXP, level: newLvl, checkInDone: false };
    }

    // Daily check-in
    case 'DAILY_CHECKIN': {
      const today = new Date().toISOString().slice(0,10);
      if (state.lastCheckIn === today) return state;
      const newXP  = (state.xpTotal || 0) + 15;
      const newLvl = Math.floor(newXP / 100) + 1;
      return { ...state, lastCheckIn: today, checkInDone: true, xpTotal: newXP, level: newLvl };
    }

    // Income CRUD
      case 'ADD_INCOME':
        return { ...state, incomes: [...(state.incomes||[]), { ...action.income, id: Date.now().toString() }] };
      case 'UPD_INCOME':
        return { ...state, incomes: (state.incomes||[]).map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
      case 'DEL_INCOME':
        return { ...state, incomes: (state.incomes||[]).filter((_,i) => i!==action.idx) };

      // SIP CRUD
      case 'ADD_SIP':
        return { ...state, sips: [...(state.sips||[]), { ...action.sip, id: Date.now().toString() }] };
      case 'UPD_SIP':
        return { ...state, sips: (state.sips||[]).map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
      case 'DEL_SIP':
        return { ...state, sips: (state.sips||[]).filter((_,i) => i!==action.idx) };

      // Debt CRUD
      case 'ADD_DEBT':
        return { ...state, debts: [...(state.debts||[]), { ...action.debt, id: Date.now().toString() }] };
      case 'UPD_DEBT':
        return { ...state, debts: (state.debts||[]).map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
      case 'DEL_DEBT':
        return { ...state, debts: (state.debts||[]).filter((_,i) => i!==action.idx) };

      // Expense split
      case 'UPD_EXP_PCT':
        return { ...state, expenses: (state.expenses||[]).map((e,i) => i===action.idx ? {...e,pct:action.pct} : e) };

      // Manual expense CRUD
      case 'ADD_MEXP':
        return { ...state, manualExpenses: [...(state.manualExpenses||[]), { ...action.exp, id: Date.now().toString() }] };
      case 'UPD_MEXP':
        return { ...state, manualExpenses: (state.manualExpenses||[]).map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
      case 'DEL_MEXP': {
        const removed = (state.manualExpenses||[])[action.idx];
        // Add to transactions when deleted (recorded as expense)
        const txn = removed ? [{
          id: Date.now().toString(),
          desc: removed.cat, amount: removed.amount,
          cat: removed.cat, type:'expense',
          icon: removed.icon || '💳',
          date: new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short'}),
        }] : [];
        return {
          ...state,
          manualExpenses: (state.manualExpenses||[]).filter((_,i) => i!==action.idx),
          transactions: [...txn, ...(state.transactions||[])].slice(0,50),
        };
      }

      // Transaction
      case 'ADD_TXN':
        return { ...state, transactions: [{ ...action.txn, id: Date.now().toString() }, ...(state.transactions||[])].slice(0,50) };

      // Goal CRUD
      case 'ADD_GOAL':
        return { ...state, goals: [...(state.goals||[]), { ...action.goal, id: Date.now().toString() }] };
      case 'UPD_GOAL':
        return { ...state, goals: (state.goals||[]).map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
      case 'DEL_GOAL':
        return { ...state, goals: (state.goals||[]).filter((_,i) => i!==action.idx) };

      // Asset CRUD
      case 'ADD_ASSET':
        return { ...state, assets: [...(state.assets||[]), { ...action.asset, id: Date.now().toString() }] };
      case 'DEL_ASSET':
        return { ...state, assets: (state.assets||[]).filter((_,i) => i!==action.idx) };

      // Month change
      case 'SET_MONTH':
        return { ...state, currentMonth: action.month, currentYear: action.year, attendance: new Set() };

      // Onboarding complete
      case 'COMPLETE_ONBOARD':
        return { ...state, ...action.data, onboarded: true };

      // Hydrate from storage
      case 'HYDRATE':
        return { ...EMPTY_STATE(), ...action.state, attendance: new Set(action.state?.attendance || []) };

      // Full reset
      case 'RESET':
        return EMPTY_STATE();

      default:
        console.warn('[Reducer] Unknown action:', action.type);
        return state;
    }
  } catch (err) {
    console.warn('[Reducer] Error:', err, action);
    return state;
  }
}

// ── PROVIDER ──────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, EMPTY_STATE);
  const saveTimer = useRef(null);
  const hydrated  = useRef(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const saved = await loadState();
      if (saved) {
        dispatch({ type: 'HYDRATE', state: saved });
      }
      hydrated.current = true;
    })();
  }, []);

  // Auto-save with 800ms debounce
  useEffect(() => {
    if (!hydrated.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveState(state), 800);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const set = useCallback((payload) => dispatch({ type: 'SET', payload }), []);

  const value = useMemo(() => ({ state, dispatch, set }), [state, set]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
