// AppContext.js — Single source of truth. All screens read from here.
import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { save, load } from './storage';
import { INIT } from './initialState';

const Ctx = createContext(null);

// ── REDUCER ───────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // Generic patch — most common
    case 'SET': return { ...state, ...action.payload, lastSaved: new Date().toISOString().slice(0,10) };

    // Attendance toggle + XP
    case 'TOGGLE_ATT': {
      const att = new Set(state.attendance instanceof Set ? state.attendance : new Set());
      att.has(action.day) ? att.delete(action.day) : att.add(action.day);
      const xpDelta = att.has(action.day) ? 10 : -10;
      return { ...state, attendance: att, xpTotal: Math.max(0, (state.xpTotal||0) + xpDelta) };
    }

    // Salary update — also updates incomes[0]
    case 'SET_SALARY': {
      const incomes = state.incomes.map((inc, i) => i === 0 ? { ...inc, amount: action.salary } : inc);
      return { ...state, salary: action.salary, incomes };
    }

    // Income CRUD
    case 'ADD_INCOME':    return { ...state, incomes: [...state.incomes, action.income] };
    case 'UPD_INCOME':    return { ...state, incomes: state.incomes.map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
    case 'DEL_INCOME':    return { ...state, incomes: state.incomes.filter((_,i) => i!==action.idx) };

    // SIP CRUD
    case 'ADD_SIP':    return { ...state, sips: [...state.sips, action.sip] };
    case 'UPD_SIP':    return { ...state, sips: state.sips.map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
    case 'DEL_SIP':    return { ...state, sips: state.sips.filter((_,i) => i!==action.idx) };

    // Debt CRUD
    case 'ADD_DEBT':   return { ...state, debts: [...state.debts, action.debt] };
    case 'UPD_DEBT':   return { ...state, debts: state.debts.map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
    case 'DEL_DEBT':   return { ...state, debts: state.debts.filter((_,i) => i!==action.idx) };

    // Expense split
    case 'UPD_EXP_PCT': return { ...state, expenses: state.expenses.map((e,i) => i===action.idx ? {...e,pct:action.pct} : e) };

    // Manual expense CRUD
    case 'ADD_MEXP':  return { ...state, manualExpenses: [...state.manualExpenses, action.exp] };
    case 'UPD_MEXP':  return { ...state, manualExpenses: state.manualExpenses.map((x,i) => i===action.idx ? {...x,...action.patch} : x) };
    case 'DEL_MEXP':  return { ...state, manualExpenses: state.manualExpenses.filter((_,i) => i!==action.idx) };

    // Transaction
    case 'ADD_TXN':   return { ...state, transactions: [action.txn, ...state.transactions].slice(0,50) };

    // Hydrate from storage
    case 'HYDRATE':   return { ...action.state };

    // Full reset
    case 'RESET':     return INIT();

    default: return state;
  }
}

// ── PROVIDER ──────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, INIT);
  const timer    = useRef(null);
  const ready    = useRef(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const saved = await load();
      if (saved) dispatch({ type: 'HYDRATE', state: { ...INIT(), ...saved, attendance: new Set(saved.attendance || []) } });
      ready.current = true;
    })();
  }, []);

  // Auto-save debounced 800ms
  useEffect(() => {
    if (!ready.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(state), 800);
    return () => clearTimeout(timer.current);
  }, [state]);

  const set = useCallback((payload) => dispatch({ type: 'SET', payload }), []);

  return <Ctx.Provider value={{ state, dispatch, set }}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
};
