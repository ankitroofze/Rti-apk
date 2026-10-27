// components/SystemBars.js
// Android ka neeche wala NAVIGATION BAR (3 buttons / gesture area) pehle default white/grey rehta tha,
// jisse har screen ke neeche ek alag safed patti dikhti thi (Login, Register, Add News, ...).
// Ye component ek baar app root par lagta hai aur us bar ko app ke brand red (#97010b) me rang deta hai
// (buttons light/white), isliye har screen par neeche patti app ke design se match karti hai.
//
// Setup (ek baar):  npx expo install expo-navigation-bar   -> phir naya build banao (native module hai)
// Rang badalna ho to sirf BRAND_BAR_COLOR badlo (white chahiye to '#ffffff' aur BUTTON_STYLE = 'dark').

import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

export const BRAND_BAR_COLOR = '#97010b'; // profile-red.png ka average rang
const BUTTON_STYLE = 'light';             // red par white buttons

export async function applySystemBars() {
  if (Platform.OS !== 'android') return;
  try {
    // lazy require: package/native module na ho to app crash nahi hoga, bas bar default rahega
    // eslint-disable-next-line global-require
    const NavigationBar = require('expo-navigation-bar');
    await NavigationBar.setBackgroundColorAsync(BRAND_BAR_COLOR);
    await NavigationBar.setButtonStyleAsync(BUTTON_STYLE);
    if (NavigationBar.setBorderColorAsync) await NavigationBar.setBorderColorAsync(BRAND_BAR_COLOR);
  } catch (e) {
    // edge-to-edge (Android 15) build me ye calls no-op hote hain — us case me neeche README dekho
  }
}

export default function SystemBars() {
  useEffect(() => {
    applySystemBars();
    // camera / gallery / dusre app se wapas aane par Android bar ka rang reset kar deta hai — dobara lagao
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') applySystemBars(); });
    return () => sub?.remove?.();
  }, []);
  return null;
}