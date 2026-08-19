import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
const CURRENT_USER_KEY = 'current_user_email';

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // ← NEW

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const email = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (!mounted) return;
        setIsLoggedIn(Boolean(email));
      } catch {
        if (!mounted) return;
        setIsLoggedIn(false);
      } finally {
        if (mounted) setIsAuthLoading(false); // ← NEW: loading khatam
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    try {
      const email = await AsyncStorage.getItem(CURRENT_USER_KEY);
      setIsLoggedIn(Boolean(email));
      return Boolean(email);
    } catch {
      setIsLoggedIn(false);
      return false;
    }
  };

  const login = () => setIsLoggedIn(true);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch {}
    setIsLoggedIn(false);
  };

  const value = useMemo(
    () => ({ isLoggedIn, isAuthLoading, login, logout, refresh }), // ← isAuthLoading add kiya
    [isLoggedIn, isAuthLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}