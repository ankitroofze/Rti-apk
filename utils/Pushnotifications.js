// Native (Android / iOS) push helpers. Web par utils/Pushnotifications.web.js use hota hai.
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

export const CHANNEL_ID = 'default'; // backend channel_id = default — matches backend FCM payload
export const CHANNEL_NAME = 'RTI News Notifications';

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

// Prevent duplicate notifications in memory (30s window)
const processedMessageIds = new Map();
const DEDUPE_WINDOW_MS = 30000;

export function isDuplicateMessage(id) {
  if (!id) return false;
  const strId = String(id);
  const now = Date.now();
  for (const [key, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS) {
      processedMessageIds.delete(key);
    }
  }
  if (processedMessageIds.has(strId)) {
    return true;
  }
  processedMessageIds.set(strId, now);
  return false;
}

/**
 * Configure high-priority notification channels using Notifee.
 * Channel: RTI News Notifications
 * Importance: HIGH (Heads-Up banner display)
 * Sound: Enabled
 * Vibration: Enabled
 */
export async function setupChannel() {
  if (Platform.OS === 'android') {
    // 1. Primary channel (matches backend channel_id = 'default')
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
      lights: true,
      badge: true,
    });

    // 2. Named channel for explicit 'rti_news_notifications' target
    await notifee.createChannel({
      id: 'rti_news_notifications',
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
      lights: true,
      badge: true,
    });

    // 3. Fallback channel for FCM default delivery
    await notifee.createChannel({
      id: 'fcm_fallback_notification_channel',
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
      lights: true,
      badge: true,
    });
  }
}

/**
 * Check whether notification permission is granted without prompting.
 * Respects Android 13+ POST_NOTIFICATIONS and user settings.
 */
export async function checkPermission() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (!granted) return false;
      } catch {
        return false;
      }
    }
    try {
      const settings = await notifee.getNotificationSettings();
      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        return false;
      }
    } catch {}
    return true;
  }

  try {
    const status = await messaging().hasPermission();
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * Request notification permission when required.
 * Handles Android 13+ POST_NOTIFICATIONS and Notifee settings.
 */
export async function requestPermission() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      try {
        const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (res !== PermissionsAndroid.RESULTS.GRANTED) return false;
      } catch {
        return false;
      }
    }
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } catch {
      return true;
    }
  }
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Display a professional Heads-Up floating banner notification via Notifee.
 * - Importance: HIGH (Android shows a floating banner at the top of the screen)
 * - Auto-dismisses the floating banner after ~4-5 seconds (Android OS default HUN duration)
 * - Persists in the Android notification shade/tray
 * - Respects permissions and blocked channel settings
 * - Prevents duplicate notifications
 */
export async function displayHeadsUpNotification({
  title,
  body,
  data = {},
  id,
  imageUrl,
} = {}) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  // 1. Respect user permission: Do not bypass disabled notification permissions
  const allowed = await checkPermission();
  if (!allowed) return;

  // 2. Ensure notification channels exist
  await setupChannel();

  // 3. Respect user channel preferences
  if (Platform.OS === 'android') {
    try {
      const isBlocked = await notifee.isChannelBlocked(CHANNEL_ID);
      if (isBlocked) return;
    } catch {}
  }

  const notificationId = id || data.notification_id || data.news_id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 4. Avoid showing duplicate notifications
  if (isDuplicateMessage(notificationId)) {
    return;
  }

  const notificationTitle = title || data.title || 'RTI News';
  const notificationBody = body || data.body || data.message || '';
  const resolvedImage = imageUrl || data.image || data.imageUrl || data.image_url;

  const androidConfig = {
    channelId: CHANNEL_ID,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [300, 500],
    pressAction: {
      id: 'default',
    },
    autoCancel: true,
    smallIcon: 'ic_launcher',
    largeIcon: resolvedImage || 'ic_launcher',
    lightUpScreen: true,
  };

  if (resolvedImage) {
    androidConfig.style = {
      type: AndroidStyle.BIGPICTURE,
      picture: resolvedImage,
    };
  } else if (notificationBody.length > 60) {
    androidConfig.style = {
      type: AndroidStyle.BIGTEXT,
      text: notificationBody,
    };
  }

  await notifee.displayNotification({
    id: String(notificationId),
    title: notificationTitle,
    body: notificationBody,
    data,
    android: androidConfig,
    ios: {
      sound: 'default',
    },
  });
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

// Foreground: FCM khud notification nahi dikhata, Notifee se WhatsApp-style heads-up dikhao
export function listenForeground() {
  return messaging().onMessage(async (msg) => {
    if (!msg) return;
    const msgId = msg.messageId || msg.data?.notification_id || msg.data?.news_id;
    if (isDuplicateMessage(msgId)) {
      return;
    }
    try {
      await displayHeadsUpNotification({
        title: msg.notification?.title || msg.data?.title,
        body: msg.notification?.body || msg.data?.body || msg.data?.message,
        data: msg.data || {},
        id: msgId,
        imageUrl: msg.notification?.android?.imageUrl || msg.data?.image || msg.data?.imageUrl,
      });
    } catch (err) {
      console.warn('[push] Error displaying foreground notification:', err?.message || err);
    }
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
    if ((type === EventType.PRESS || type === EventType.ACTION_PRESS) && detail?.notification?.data) {
      if (detail.notification.id) {
        notifee.cancelNotification(detail.notification.id).catch(() => {});
      }
      navigate(detail.notification.data);
    }
  });

  return () => {
    unsub1?.();
    unsub2?.();
  };
}
