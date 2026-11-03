// utils/downloadMedia.js
// Ads / news ki image ya video download karne ka ek hi helper (web + Android + iOS).
//  - WEB    : file fetch -> blob -> browser direct download (koi popup / naya tab nahi).
//             Agar server CORS allow nahi karta to hi direct link naye tab me khulta hai
//             (uska fix: media server par `Access-Control-Allow-Origin: *` header lagao).
//  - NATIVE : file seedhi phone ki Gallery me save hoti hai (expo-media-library) — share sheet nahi.
//             Agar media-library na ho / permission na mile to Android me Downloads folder
//             (SAF) try hota hai, aur sabse last me hi share sheet khulti hai.
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from './webMediaStore';

const IMG_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'avif'];
const VID_EXTS = ['mp4', 'mov', 'webm', '3gp', 'mkv', 'm4v'];

function extFromUrl(url, type) {
  const clean = String(url || '').split('#')[0].split('?')[0];
  const m = clean.match(/\.([a-z0-9]{2,5})$/i);
  const e = m ? m[1].toLowerCase() : '';
  if (type === 'video') return VID_EXTS.includes(e) ? e : 'mp4';
  return IMG_EXTS.includes(e) ? e : 'jpg';
}

function mimeFor(ext, type) {
  if (type === 'video') return ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : 'video/mp4';
  return ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
}

function buildName(url, type) {
  return `rti-news-${type}-${Date.now()}.${extFromUrl(url, type)}`;
}

// ───────────────────────── WEB ─────────────────────────
async function downloadWeb(url, type) {
  const name = buildName(url, type);
  let href = String(url);
  let idbObjectUrl = null;

  if (isIdbMediaUri(href)) {
    idbObjectUrl = await resolveIdbMediaUriToObjectUrl(href);
    if (!idbObjectUrl) throw new Error('Media not available');
    href = idbObjectUrl;
  }

  const isLocal = /^(blob:|data:)/i.test(href);
  let finalHref = href;
  let blobUrl = null;
  let openedInNewTab = false;

  if (!isLocal) {
    try {
      const res = await fetch(href, { mode: 'cors', cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      blobUrl = URL.createObjectURL(blob);
      finalHref = blobUrl;
    } catch (_) {
      // CORS / network: direct link (naye tab me khulega)
      finalHref = href;
      openedInNewTab = true;
    }
  }

  const a = document.createElement('a');
  a.href = finalHref;
  a.download = name;
  a.rel = 'noopener';
  a.style.display = 'none';
  if (openedInNewTab) a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    try { if (blobUrl) URL.revokeObjectURL(blobUrl); } catch (_) { /* ignore */ }
    try { if (idbObjectUrl) URL.revokeObjectURL(idbObjectUrl); } catch (_) { /* ignore */ }
  }, 60000);

  return {
    ok: true,
    message: openedInNewTab ? 'File opened in a new tab — right click / long press to save.' : '',
  };
}

// ───────────────────────── NATIVE ─────────────────────────
function loadMediaLibrary() {
  try {
    // eslint-disable-next-line global-require
    return require('expo-media-library');
  } catch (_) {
    return null;
  }
}

// Gallery me direct save. true = ho gaya, false = nahi hua (fallback chalega).
async function saveToGallery(localUri) {
  const ML = loadMediaLibrary();
  if (!ML?.requestPermissionsAsync || !ML?.createAssetAsync) return false;
  try {
    // writeOnly=true: Android 13+ / iOS par sirf "add" permission maangta hai
    const perm = await ML.requestPermissionsAsync(true);
    if (!perm?.granted) return false;
    await ML.createAssetAsync(localUri);
    return true;
  } catch (_) {
    return false;
  }
}

// Android: user ek baar folder (jaise Downloads) chun le to file wahin save.
async function saveViaAndroidFolder(localUri, name, mimeType) {
  if (Platform.OS !== 'android') return false;
  try {
    const SAF = FileSystem.StorageAccessFramework;
    if (!SAF?.requestDirectoryPermissionsAsync || !SAF?.createFileAsync) return false;
    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (!perm?.granted) return false;
    const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    const dest = await SAF.createFileAsync(perm.directoryUri, name.replace(/\.[^.]+$/, ''), mimeType);
    await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
    return true;
  } catch (_) {
    return false;
  }
}

async function downloadNative(url, type) {
  const name = buildName(url, type);
  let local = String(url);

  if (/^https?:/i.test(local)) {
    const dest = `${FileSystem.cacheDirectory}${name}`;
    const res = await FileSystem.downloadAsync(local, dest);
    if (res.status && res.status >= 400) throw new Error(`Download failed (${res.status})`);
    local = res.uri;
  }

  const ext = extFromUrl(local, type);
  const mimeType = mimeFor(ext, type);

  // 1) Direct Gallery me save (best — ek tap, koi sheet nahi)
  if (await saveToGallery(local)) {
    return { ok: true, message: type === 'video' ? 'Video saved to Gallery.' : 'Image saved to Gallery.' };
  }

  // 2) Android folder (Downloads etc.)
  if (await saveViaAndroidFolder(local, name, mimeType)) {
    return { ok: true, message: 'File saved.' };
  }

  // 3) Last fallback: system share / save sheet
  if (!(await Sharing.isAvailableAsync())) throw new Error('Saving is not available on this device.');
  await Sharing.shareAsync(local, {
    mimeType,
    dialogTitle: type === 'video' ? 'Save video' : 'Save image',
    UTI: type === 'video' ? 'public.mpeg-4' : 'public.jpeg',
  });
  return { ok: true, message: '' };
}

// type: 'image' | 'video'. Hamesha { ok, message } return karta hai (throw nahi karta).
export async function downloadMedia(url, { type = 'image' } = {}) {
  const src = String(url || '').trim();
  if (!src) return { ok: false, message: 'Nothing to download.' };
  try {
    return Platform.OS === 'web' ? await downloadWeb(src, type) : await downloadNative(src, type);
  } catch (e) {
    return { ok: false, message: e?.message || 'Download failed. Please try again.' };
  }
}

export default downloadMedia;