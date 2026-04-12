// src/store/AppContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { saveState, loadState } from '../utils/storage';
import { createInitialState } from '../utils/initialState';

const AppContext = createContext(null);

// ─── REDUCER ──────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, ...action.payload, lastSaved: new Date().toISOString().slice(0, 10) };
    case 'TOGGLE_ATTENDANCE': {
      const att = new Set(state.attendance);
      att.has(action.day) ? att.delete(action.day) : att.add(action.day);
      return {
        ...state,
        attendance: att,
        xpTotal: (state.xpTotal || 0) + (att.has(action.day) ? 10 : -10),
      };
    }
    case 'ADD_SIP':
      return { ...state, sips: [...state.sips, action.sip] };
    case 'UPDATE_SIP':
      return { ...state, sips: state.sips.map((s, i) => (i === action.idx ? { ...s, ...action.patch } : s)) };
    case 'REMOVE_SIP':
      return { ...state, sips: state.sips.filter((_, i) => i !== action.idx) };
    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.debt] };
    case 'UPDATE_DEBT':
      return { ...state, debts: state.debts.map((d, i) => (i === action.idx ? { ...d, ...action.patch } : d)) };
    case 'REMOVE_DEBT':
      return { ...state, debts: state.debts.filter((_, i) => i !== action.idx) };
    case 'ADD_EXPENSE':
      return { ...state, manualExpenses: [...state.manualExpenses, action.expense] };
    case 'UPDATE_EXPENSE':
      return { ...state, manualExpenses: state.manualExpenses.map((e, i) => (i === action.idx ? { ...e, ...action.patch } : e)) };
    case 'REMOVE_EXPENSE':
      return { ...state, manualExpenses: state.manualExpenses.filter((_, i) => i !== action.idx) };
    case 'UPDATE_EXPENSE_PCT':
      return { ...state, expenses: state.expenses.map((e, i) => (i === action.idx ? { ...e, pct: action.pct } : e)) };
    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, action.income] };
    case 'REMOVE_INCOME':
      return { ...state, incomes: state.incomes.filter((_, i) => i !== action.idx) };
    case 'UPDATE_INCOME':
      return { ...state, incomes: state.incomes.map((inc, i) => (i === action.idx ? { ...inc, ...action.patch } : inc)) };
    case 'HYDRATE':
      return { ...action.state };
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

// ─── PROVIDER ─────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => createInitialState());
  const saveTimer = useRef(null);
  const hydrated  = useRef(false);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      const saved = await loadState();
      if (saved) {
        dispatch({ type: 'HYDRATE', state: { ...createInitialState(), ...saved } });
      }
      hydrated.current = true;
    })();
  }, []);

  // Auto-save with debounce (800ms)
  useEffect(() => {
    if (!hydrated.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(state);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const set = useCallback((payload) => dispatch({ type: 'SET', payload }), []);

  return (
    <AppContext.Provider value={{ state, dispatch, set }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
