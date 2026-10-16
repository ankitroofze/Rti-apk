// index.js ki sabse upar line par import karo: import './utils/pushBackground';
// Background / killed state ke messages ke liye handler component ke BAHAR register hona zaroori hai.
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { setPendingNotification } from './Pushpending';

messaging().setBackgroundMessageHandler(async () => {
  // OS notification khud dikhata hai (payload me "notification" block hai).
});
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Foreground me notifee se dikhayi notification, app background hone ke baad tap hui
  if (type === EventType.PRESS && detail?.notification?.data) {
    setPendingNotification(detail.notification.data);
  }
});