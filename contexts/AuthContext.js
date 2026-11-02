import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearIdCardVerification } from '../utils/idCardService';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

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
        // 🔒 Session email nahi hai par purana bearer token bacha hai (purane logout se) -> hata do, reuse na ho
        if (!email) { try { await AuthAPI.clearAuthToken(); } catch {} }
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

  // 🔒 Koi bhi screen UserStore.clearCurrentUser()/logoutCleanup() se logout kare, auth state bhi turant false ho
  useEffect(() => UserStore.subscribeSessionCleared(() => setIsLoggedIn(false)), []);

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

  // 🔒 Ek hi centralized cleanup: push token unregister -> auth_token + current_user_email hatao -> account caches saaf
  const logout = async () => {
    try {
      await UserStore.logoutCleanup();
    } catch {}
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch {}
    clearIdCardVerification(); // agle user ko purana ID card/QR na dikhe
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