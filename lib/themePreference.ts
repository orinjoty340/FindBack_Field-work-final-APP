import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'findback_theme';

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const value = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export async function saveThemePreference(value: ThemePreference) {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Non-fatal: the theme still applies for this session.
  }
}
