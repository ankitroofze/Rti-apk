// Native (Android / iOS) push helpers. Web par utils/pushNotifications.web.js (no-op) use hota hai.
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

const CHANNEL_ID = 'default'; // backend channel_id = default — change mat karna

// Foreground push aane par bell/list refresh karne ke liye chhota event bus
const listeners = new Set();
export const subscribePushEvents = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const emit = (payload) => listeners.forEach((cb) => { try { cb(payload); } catch {} });

// Bell badge refresh bus: foreground push + inbox me read/delete ke baad count dobara laane ke liye
const badgeListeners = new Set();
export const subscribeBadgeRefresh = (cb) => {
  badgeListeners.add(cb);
  return () => badgeListeners.delete(cb);
};
export const refreshBadge = () => badgeListeners.forEach((cb) => { try { cb(); } catch {} });

export async function setupChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({ id: CHANNEL_ID, name: 'General', importance: AndroidImportance.HIGH });
  }
}

export async function requestPermission() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  const status = await messaging().requestPermission();
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

// Login ke baad + app start (logged in) par call karo. Same token dobara bhejna safe hai.
export async function registerDeviceToken() {
  try {
    const allowed = await requestPermission();
    if (!allowed) return null;
    await setupChannel();
    const token = await messaging().getToken();
    if (!token) return null;
    await AuthAPI.registerDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceName: `${Platform.OS} ${Platform.Version}`,
    });
    return token;
  } catch (e) {
    console.warn('[push] registerDeviceToken failed:', e?.message || e);
    return null;
  }
}

// Logout se PEHLE await karo (server logout sab tokens delete kar deta hai, par ye bhi zaroori hai)
export async function unregisterDeviceToken() {
  try {
    const token = await messaging().getToken();
    await AuthAPI.unregisterDeviceToken(token);
  } catch {
    // logout block nahi karna
  }
}

export function listenTokenRefresh() {
  return messaging().onTokenRefresh(async (token) => {
    await AuthAPI.registerDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceName: `${Platform.OS} ${Platform.Version}`,
    });
  });
}

// Foreground: FCM khud notification nahi dikhata, notifee se dikhao
export function listenForeground() {
  return messaging().onMessage(async (msg) => {
    try {
      await notifee.displayNotification({
        title: msg.notification?.title,
        body: msg.notification?.body,
        data: msg.data,
        android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
      });
    } catch {}
    emit(msg?.data || {});
    refreshBadge();
  });
}

// Tap: background->open, killed->open, foreground (notifee) tap
export function listenOpened(navigate) {
  const unsub1 = messaging().onNotificationOpenedApp((msg) => {
    if (msg?.data) navigate(msg.data);
  });

  messaging().getInitialNotification().then((msg) => {
    if (msg?.data) navigate(msg.data);
  }).catch(() => {});

  notifee.getInitialNotification().then((initial) => {
    if (initial?.notification?.data) navigate(initial.notification.data);
  }).catch(() => {});

  const unsub2 = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification?.data) navigate(detail.notification.data);
  });

  return () => { unsub1(); unsub2(); };
}