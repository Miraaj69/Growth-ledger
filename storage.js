
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gl_v8';

export const saveState = async (state) => {
  try {
    const toSave = {
      ...state,
      attendance: [...(state.attendance instanceof Set ? state.attendance : new Set())],
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
    console.log('[Storage] Saved successfully');
    return true;
  } catch (err) {
    console.warn('[Storage] Save failed:', err);
    return false;
  }
};

export const loadState = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) { console.log('[Storage] No saved state'); return null; }
    const parsed = JSON.parse(raw);
    parsed.attendance = new Set(parsed.attendance || []);
    console.log('[Storage] Loaded successfully');
    return parsed;
  } catch (err) {
    console.warn('[Storage] Load failed:', err);
    return null;
  }
};

export const clearState = async () => {
  try {
    await AsyncStorage.removeItem(KEY);
    console.log('[Storage] Cleared');
    return true;
  } catch (err) {
    console.warn('[Storage] Clear failed:', err);
    return false;
  }
};
