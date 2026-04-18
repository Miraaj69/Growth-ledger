// storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'gl_v7';

export const save = async (state) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...state, attendance: [...(state.attendance instanceof Set ? state.attendance : new Set())] }));
  } catch(e) { console.warn('save:', e); }
};

export const load = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return { ...p, attendance: new Set(p.attendance || []) };
  } catch(e) { return null; }
};

export const clear = async () => {
  try { await AsyncStorage.removeItem(KEY); } catch(e) {}
};
