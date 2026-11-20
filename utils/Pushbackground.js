// index.js ki sabse upar line par import karo: import './utils/Pushbackground';
// Background / killed state ke messages ke liye handler component ke BAHAR register hona zaroori hai.
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { setPendingNotification } from './Pushpending';
import { displayHeadsUpNotification, setupChannel } from './Pushnotifications';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (!remoteMessage) return;

  // Ensure notification channel is set up even in killed/background headless state
  await setupChannel().catch(() => {});

  // If the message contains a "notification" payload, Android OS (Firebase)
  // automatically displays the notification in the tray & heads-up banner using our HIGH importance channel.
  // Displaying another notification via Notifee would cause duplicate notifications.
  if (remoteMessage.notification) {
    return;
  }

  // If it's a data-only FCM message, Android OS does NOT show a notification.
  // We must display it via Notifee so the user sees the floating Heads-Up notification.
  if (remoteMessage.data && (remoteMessage.data.title || remoteMessage.data.body || remoteMessage.data.message)) {
    await displayHeadsUpNotification({
      title: remoteMessage.data.title,
      body: remoteMessage.data.body || remoteMessage.data.message,
      data: remoteMessage.data,
      id: remoteMessage.messageId || remoteMessage.data.notification_id,
      imageUrl: remoteMessage.data.image || remoteMessage.data.imageUrl,
    });
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Foreground / headless Notifee notification tapped while app is in background
  if ((type === EventType.PRESS || type === EventType.ACTION_PRESS) && detail?.notification?.data) {
    if (detail?.notification?.id) {
      await notifee.cancelNotification(detail.notification.id).catch(() => {});
    }
    setPendingNotification(detail.notification.data);
  }
});
