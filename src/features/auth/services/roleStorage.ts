import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_KEY = 'timelog.role';

export const getStoredRole = async (): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(ROLE_KEY);
    return value;
  } catch {
    return null;
  }
};

export const setStoredRole = async (role: string) => {
  try {
    await AsyncStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore
  }
};

export const clearStoredRole = async () => {
  try {
    await AsyncStorage.removeItem(ROLE_KEY);
  } catch {
    // ignore
  }
};
