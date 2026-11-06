// utils/notify.js — success par toast (Android) / alert (iOS), failure par hamesha alert.
import { Alert, Platform, ToastAndroid } from 'react-native';

export function notify(message, isError = false) {
  if (!isError && Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
    return;
  }
  Alert.alert(isError ? 'Download failed' : 'Done', message);
}