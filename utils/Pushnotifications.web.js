// Web push (Firebase Cloud Messaging) — native file (Pushnotifications.js) ka web equivalent.
// Same exports rakhe hain taaki bootstrap / navbar / screens me koi change na ho.
// Firebase SDK dynamic import hota hai: web bundle chhota rehta hai aur SSR/static export me crash nahi hota.
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import {
  FIREBASE_WEB_CONFIG,
  FIREBASE_VAPID_KEY,
  WEB_BASE_PATH,
  isFirebaseWebConfigured,
} from '../constants/firebaseWebConfig';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const TOKEN_KEY = 'rti_web_push_token';
const LAST_REG_KEY = 'rti_web_push_last_reg';
const REREGISTER_AFTER_MS = 12 * 60 * 60 * 1000; // 12 ghante
const SHOW_WHEN_FOCUSED = false; // true => tab open ho tab bhi OS notification dikhao

// ── Event buses (native jaisa) ───────────────────────────────────────────────
const listeners = new Set();
export const subscribePushEvents = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const emit = (payload) => listeners.forEach((cb) => { try { cb(payload); } catch {} });

const badgeListeners = new Set();
export const subscribeBadgeRefresh = (cb) => {
  badgeListeners.add(cb);
  return () => badgeListeners.delete(cb);
};
export const refreshBadge = () => badgeListeners.forEach((cb) => { try { cb(); } catch {} });

// ── Helpers ──────────────────────────────────────────────────────────────────
export const isWebPushSupported = () =>
  isBrowser && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

// 'default' | 'granted' | 'denied' | 'unsupported'
export const getPermissionState = () => (isWebPushSupported() ? Notification.permission : 'unsupported');

const store = {
  get: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { window.localStorage.removeItem(k); } catch {} },
};

const describeBrowser = () => {
  const ua = (isBrowser && navigator.userAgent) || '';
  let name = 'Browser';
  if (/Edg\//.test(ua)) name = 'Edge';
  else if (/OPR\//.test(ua)) name = 'Opera';
  else if (/Chrome\//.test(ua)) name = 'Chrome';
  else if (/Firefox\//.test(ua)) name = 'Firefox';
  else if (/Safari\//.test(ua)) name = 'Safari';
  return `Web ${name}`;
};

const swBase = () => `${WEB_BASE_PATH}/`;

// ── Service worker + Firebase messaging singletons ──────────────────────────
let swRegPromise = null;
async function getSwRegistration() {
  if (!swRegPromise) {
    // Config query-string se SW ko milta hai (SW env nahi padh sakta)
    const q = new URLSearchParams({
      apiKey: FIREBASE_WEB_CONFIG.apiKey,
      authDomain: FIREBASE_WEB_CONFIG.authDomain,
      projectId: FIREBASE_WEB_CONFIG.projectId,
      storageBucket: FIREBASE_WEB_CONFIG.storageBucket,
      messagingSenderId: FIREBASE_WEB_CONFIG.messagingSenderId,
      appId: FIREBASE_WEB_CONFIG.appId,
    }).toString();
    const base = swBase();
    swRegPromise = navigator.serviceWorker
      .register(`${base}firebase-messaging-sw.js?${q}`, { scope: base })
      .then(async (reg) => {
        await navigator.serviceWorker.ready;
        return reg;
      })
      .catch((e) => {
        swRegPromise = null;
        throw e;
      });
  }
  return swRegPromise;
}

let messagingPromise = null;
async function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getMessaging, isSupported } = await import('firebase/messaging');
      if (!(await isSupported())) return null;
      const app = getApps().length ? getApp() : initializeApp(FIREBASE_WEB_CONFIG);
      return getMessaging(app);
    })().catch((e) => {
      messagingPromise = null;
      throw e;
    });
  }
  return messagingPromise;
}

// ── Public API (native ke same naam) ────────────────────────────────────────
export const setupChannel = async () => {}; // web par channel nahi hota

export async function requestPermission() {
  if (!isWebPushSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const res = await Notification.requestPermission(); // user gesture se call karna best hai
    return res === 'granted';
  } catch {
    return false;
  }
}

/**
 * Login ke baad / app start par call hota hai.
 * - Default (askPermission=false): sirf tab token register karta hai jab permission pehle se "granted" ho
 *   (browser ko page-load par permission popup se bachane ke liye).
 * - askPermission=true: permission maangta hai (WebPushPrompt ke button click se call karo).
 */
export async function registerDeviceToken({ askPermission = false } = {}) {
  try {
    if (!isWebPushSupported()) return null;
    if (!isFirebaseWebConfigured()) {
      console.warn('[web-push] Firebase web config / VAPID key missing (.env dekho).');
      return null;
    }
    if (Notification.permission !== 'granted') {
      if (!askPermission) return null;
      const ok = await requestPermission();
      if (!ok) return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null; // browser FCM support nahi karta
    const { getToken } = await import('firebase/messaging');
    const reg = await getSwRegistration();
    const token = await getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return null;

    await AuthAPI.registerDeviceToken({ token, platform: 'web', deviceName: describeBrowser() });
    store.set(TOKEN_KEY, token);
    store.set(LAST_REG_KEY, String(Date.now()));
    return token;
  } catch (e) {
    console.warn('[web-push] registerDeviceToken failed:', e?.message || e);
    return null;
  }
}

// Logout se PEHLE await karo (AppNavbar already aisa karta hai)
export async function unregisterDeviceToken() {
  try {
    if (!isWebPushSupported()) return;
    let token = store.get(TOKEN_KEY);
    if (!token && Notification.permission === 'granted' && isFirebaseWebConfigured()) {
      try {
        const messaging = await getMessagingInstance();
        const { getToken } = await import('firebase/messaging');
        const reg = await getSwRegistration();
        token = messaging ? await getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg }) : null;
      } catch {}
    }
    if (token) await AuthAPI.unregisterDeviceToken(token);
    try {
      const messaging = await getMessagingInstance();
      if (messaging) {
        const { deleteToken } = await import('firebase/messaging');
        await deleteToken(messaging); // is browser ka token FCM se bhi hata do
      }
    } catch {}
    store.del(TOKEN_KEY);
    store.del(LAST_REG_KEY);
  } catch {
    // logout block nahi karna
  }
}

// Web FCM me onTokenRefresh nahi hota — tab focus par 12 ghante me ek baar token dobara sync karte hain
export function listenTokenRefresh() {
  if (!isBrowser) return () => {};
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    if (Notification?.permission !== 'granted') return;
    const last = Number(store.get(LAST_REG_KEY) || 0);
    if (Date.now() - last > REREGISTER_AFTER_MS) registerDeviceToken();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}

// Foreground (tab open): FCM khud notification nahi dikhata. Bell/list refresh + (tab focus me na ho to) OS notification.
export function listenForeground() {
  if (!isWebPushSupported() || !isFirebaseWebConfigured()) return () => {};
  let cancelled = false;
  let unsub = null;

  (async () => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging || cancelled) return;
      const { onMessage } = await import('firebase/messaging');
      unsub = onMessage(messaging, async (payload) => {
        const data = payload?.data || {};
        try {
          const focused = document.visibilityState === 'visible' && document.hasFocus();
          if ((SHOW_WHEN_FOCUSED || !focused) && Notification.permission === 'granted') {
            const reg = await getSwRegistration();
            await reg.showNotification(payload?.notification?.title || data.title || 'RTI Voice', {
              body: payload?.notification?.body || data.body || '',
              icon: payload?.notification?.icon || `${WEB_BASE_PATH}/favicon.ico`,
              data, // click par SW isi se sahi screen kholta hai
              tag: data.notification_id ? String(data.notification_id) : undefined,
            });
          }
        } catch {}
        emit(data);
        refreshBadge();
      });
      if (cancelled) unsub?.();
    } catch (e) {
      console.warn('[web-push] listenForeground failed:', e?.message || e);
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

// Tap: (a) tab already open -> SW postMessage, (b) tab band tha -> SW ne URL me ?push=... daal ke naya tab khola
export function listenOpened(navigate) {
  if (!isBrowser) return () => {};

  // (b) cold start
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('push');
    if (raw) {
      url.searchParams.delete('push');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') navigate(data);
    }
  } catch {}

  // (a) open tab
  if (!('serviceWorker' in navigator)) return () => {};
  const onMessage = (event) => {
    if (event?.data?.type === 'PUSH_CLICK' && event.data.data) navigate(event.data.data);
  };
  navigator.serviceWorker.addEventListener('message', onMessage);
  return () => navigator.serviceWorker.removeEventListener('message', onMessage);
}