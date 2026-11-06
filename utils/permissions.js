// utils/permissions.js
import { PermissionsAndroid, Platform } from 'react-native';

// Android 10+ (API 29+): MediaStore se gallery me save hota hai, permission ki zarurat nahi.
// Android 9 aur neeche (API <= 28): WRITE_EXTERNAL_STORAGE runtime permission chahiye.
// iOS: runtime prompt CameraRoll.save khud dikhata hai (Info.plist me NSPhotoLibraryAddUsageDescription zaruri).
export async function ensureGalleryPermission() {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) >= 29) return true;
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Storage permission',
      message: 'Photo / video gallery me save karne ke liye permission chahiye.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    },
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}