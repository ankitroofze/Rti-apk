// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme as useDeviceColorScheme, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'app_theme_mode';

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
  const [themeMode, setThemeModeState] = useState('light'); // 'light' | 'dark' | 'system'
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved);
        }
      } catch (e) {
        console.error('Failed to load theme mode:', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    try {
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

  // Sync with Web DOM if on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (document.body) {
        document.body.style.backgroundColor = isDark ? '#0a0f1d' : '#ffffff';
        document.body.style.color = isDark ? '#f8fafc' : '#0f172a';
      }

      let styleEl = document.getElementById('app-theme-global-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'app-theme-global-styles';
        document.head.appendChild(styleEl);
      }

      if (isDark) {
        styleEl.textContent = `
          [data-theme="dark"] body {
            background-color: #0a0f1d !important;
            color: #f8fafc !important;
          }
          [data-theme="dark"] .qm-main,
          [data-theme="dark"] .qm-root {
            background-color: #0a0f1d !important;
            color: #f8fafc !important;
          }
          [data-theme="dark"] .qm-stat,
          [data-theme="dark"] .qm-card {
            background-color: #131c31 !important;
            color: #f8fafc !important;
            border-color: #1e293b !important;
          }
          [data-theme="dark"] .qm-stat-value,
          [data-theme="dark"] .qm-card-name {
            color: #f8fafc !important;
          }
          [data-theme="dark"] .qm-topbar {
            background-color: #0a0f1d !important;
            border-bottom-color: #1e293b !important;
          }
          [data-theme="dark"] .qm-search {
            background-color: #131c31 !important;
            border-color: #1e293b !important;
            color: #f8fafc !important;
          }
        `;
      } else {
        styleEl.textContent = '';
      }
    }
  }, [isDark]);

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
