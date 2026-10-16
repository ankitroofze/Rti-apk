import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  listenForeground,
  listenOpened,
  listenTokenRefresh,
  registerDeviceToken,
  setupChannel,
} from '../utils/Pushnotifications';
import { navigateFromNotification } from '../utils/Notificationnavigation';
import { navigationRef } from '../utils/navigationRef'; // shared ref (NavigationContainer bhi yahi use karta hai)
import { takePendingNotification } from '../utils/Pushpending';

// Notification tap par navigation ready na ho (app killed se khula) to thodi der retry karo
function openWhenReady(data, tries = 0) {
  if (navigationRef.isReady()) {
    navigateFromNotification(navigationRef, data);
    return;
  }
  if (tries < 40) setTimeout(() => openWhenReady(data, tries + 1), 250); // max ~10 sec
}

/**
 * App.js me AuthProvider ke andar ek baar render karo: <PushNotificationBootstrap />
 * - login hote hi (aur app start par logged in ho to) FCM token register karta hai
 * - foreground push dikhata hai, tap par sahi screen kholta hai
 */
export default function PushNotificationBootstrap() {
  const { isLoggedIn } = useAuth();

  // Listeners (foreground + tap)
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    setupChannel().catch(() => {});
    const unsubForeground = listenForeground();
    const unsubOpened = listenOpened((data) => openWhenReady(data));
    return () => { unsubForeground?.(); unsubOpened?.(); };
  }, []);

  // Background me notifee tap hua ho to app foreground aate hi sahi screen kholo
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const check = () => {
      const data = takePendingNotification();
      if (data) openWhenReady(data);
    };
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') { check(); setTimeout(check, 600); }
    });
    return () => sub.remove();
  }, []);

  // Token: har login / app start (logged in) par register, refresh par update
  useEffect(() => {
    if (Platform.OS === 'web' || !isLoggedIn) return undefined;
    registerDeviceToken();
    const unsubRefresh = listenTokenRefresh();
    return () => unsubRefresh?.();
  }, [isLoggedIn]);

  return null;
}