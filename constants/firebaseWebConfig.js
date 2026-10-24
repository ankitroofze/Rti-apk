// Web push (FCM) config. Values .env se aati hain (EXPO_PUBLIC_*), code me hardcode mat karo.
// Firebase Console -> Project settings -> General -> "Your apps" -> Web app -> config
// Firebase Console -> Project settings -> Cloud Messaging -> Web Push certificates -> Key pair (VAPID)
export const FIREBASE_WEB_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const FIREBASE_VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || '';

// Agar site subpath par hosted hai (jaise "/rti-news") to wahi dalo, warna khali chhodo.
// scripts/fix-web-base-path.js wale basePath ke saath same hona chahiye.
export const WEB_BASE_PATH = (process.env.EXPO_PUBLIC_WEB_BASE_PATH || '').replace(/\/+$/, '');

export const isFirebaseWebConfigured = () =>
  !!(FIREBASE_WEB_CONFIG.apiKey && FIREBASE_WEB_CONFIG.projectId &&
     FIREBASE_WEB_CONFIG.messagingSenderId && FIREBASE_WEB_CONFIG.appId && FIREBASE_VAPID_KEY);