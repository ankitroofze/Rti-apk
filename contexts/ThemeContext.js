// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useColorScheme as useDeviceColorScheme, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webThemeCss } from '../theme/webColors';

const THEME_STORAGE_KEY = 'app_theme_mode';

function isThemeMode(value) {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getInitialThemeMode() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeMode(saved)) return saved;
    } catch {
      // The async storage path below also works when storage is unavailable.
    }
  }
  return 'light';
}

export const lightTheme = {
  mode: 'light',
  isDark: false,
  background: '#ffffff',
  pageBg: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  inputBg: '#ffffff',
  navBg: '#ffffff',
  navBorder: '#e2e8f0',
  primary: '#ea580c',
  accent: '#2563eb',
  success: '#16a34a',
  danger: '#e11d48',
  divider: '#f1f5f9',
};

export const darkTheme = {
  mode: 'dark',
  isDark: true,
  background: '#0a0f1d',
  pageBg: '#0f172a',
  card: '#131c31',
  cardBorder: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#1e293b',
  inputBg: '#1e293b',
  navBg: '#0a0f1d',
  navBorder: '#1e293b',
  primary: '#f97316',
  accent: '#3b82f6',
  success: '#22c55e',
  danger: '#f43f5e',
  divider: '#1e293b',
};

const ThemeContext = createContext({
  themeMode: 'light',
  isDark: false,
  theme: lightTheme,
  colors: lightTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState(getInitialThemeMode);
  const themeChanged = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!themeChanged.current && isThemeMode(saved)) {
          setThemeModeState(saved);
        }
      } catch (e) {
        console.error('Failed to load theme mode:', e);
      }
    })();
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    try {
      themeChanged.current = true;
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error('Failed to save theme mode:', e);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return deviceColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, deviceColorScheme]);

  const toggleTheme = useCallback(() => {
    const nextMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  }, [isDark, setThemeMode]);

  const activeTheme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const existingStyle = document.getElementById('app-theme-global-styles');
    if (!existingStyle) {
      const sheet = document.createElement('style');
      sheet.id = 'app-theme-global-styles';
      sheet.textContent = webThemeCss();
      document.head.appendChild(sheet);
    }

    if (document.body) {
      document.body.style.backgroundColor = activeTheme.background;
      document.body.style.color = activeTheme.text;
    }
  }, [isDark, activeTheme]);

  const contextValue = useMemo(() => ({
    themeMode,
    isDark,
    theme: activeTheme,
    colors: activeTheme,
    toggleTheme,
    setThemeMode,
  }), [themeMode, isDark, activeTheme, toggleTheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'light',
      isDark: false,
      theme: lightTheme,
      colors: lightTheme,
      toggleTheme: () => {},
      setThemeMode: () => {},
    };
  }
  return context;
}

export default ThemeContext;
