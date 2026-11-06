// utils/saveFramedImage.js
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { ensureGalleryPermission } from './permissions';

// `capturedUri` = ViewShot.capture() ka result (preview jaisa hi final image, tmpfile).
export async function saveCapturedImage(capturedUri) {
  if (!capturedUri) throw new Error('Image capture nahi hui');
  if (!(await ensureGalleryPermission())) throw new Error('Gallery permission nahi mili');
  try {
    await CameraRoll.save(capturedUri, { type: 'photo' });
  } finally {
    // temp capture file hata do
    try { await RNFS.unlink(String(capturedUri).replace(/^file:\/\//, '')); } catch (_) { /* ignore */ }
  }
}