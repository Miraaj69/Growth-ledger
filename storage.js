// storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gl_state_v6';

export const saveState = async (state) => {
  try {
    const serialized = JSON.stringify({
      ...state,
      attendance: Array.from(state.attendance || []),
    });
    await AsyncStorage.setItem(KEY, serialized);
    return true;
  } catch (e) {
    console.warn('Storage save failed:', e);
    return false;
  }
};

export const loadState = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, attendance: new Set(parsed.attendance || []) };
  } catch (e) {
    console.warn('Storage load failed:', e);
    return null;
  }
};

export const clearState = async () => {
  try {
    await AsyncStorage.removeItem(KEY);
    return true;
  } catch (e) {
    console.warn('Storage clear failed:', e);
    return false;
  }
};
