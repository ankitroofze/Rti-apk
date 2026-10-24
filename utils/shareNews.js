// utils/shareNews.js
// News share helpers:
//  1) Link share  -> WhatsApp/others me title + app-download line + news link (referral ke saath).
//                    Link preview (image/video thumbnail + RTI Voice frame) backend ke OG tags se banta hai.
//  2) Media share -> Image news = branded image file, Video news = video file.
import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getReferralInfo } from './Referralservice';

const APP_NAME = 'RTI Voice';
// Play Store / app download link — apna final link yahan daalo.
export const APP_DOWNLOAD_LINK = 'https://rtinews.in/app';

// ── Referral ───────────────────────────────────────────────────────────────────
// Logged-in user ka referral code backend (/referral) se aata hai.
export async function getMyReferralCode() {
  try {
    const info = await getReferralInfo();
    return info?.ok ? String(info.code || '') : '';
  } catch {
    return '';
  }
}

// News link ke saath ?ref=CODE attach. Pehle se ref ho to replace.
export function attachReferral(link, code) {
  const base = String(link || '').trim();
  const c = String(code || '').trim();
  if (!base || !c) return base;
  const noRef = base.replace(/([?&])ref=[^&#]*(&)?/i, (m, p1, p2) => (p2 ? p1 : '')).replace(/[?&]$/, '');
  const hashIdx = noRef.indexOf('#');
  const main = hashIdx >= 0 ? noRef.slice(0, hashIdx) : noRef;
  const hash = hashIdx >= 0 ? noRef.slice(hashIdx) : '';
  return `${main}${main.includes('?') ? '&' : '?'}ref=${encodeURIComponent(c)}${hash}`;
}

// ── Message pattern (reference screenshot jaisa) ───────────────────────────────
//   *Title*
//
//   तुमच्या परिसरातील सर्व बातम्या पाहण्यासाठी आणि
//   *बातम्या शेअर करून कमाई करण्यासाठी RTI Voice ॲप डाउनलोड करा* 👇
//
//   <link?ref=CODE>
export function buildShareText({ title, link, language = 'mr' }) {
  const t = String(title || '').trim();
  const lines = {
    mr: `तुमच्या परिसरातील सर्व बातम्या पाहण्यासाठी आणि\n*बातम्या शेअर करून कमाई करण्यासाठी ${APP_NAME} ॲप डाउनलोड करा* 👇`,
    hi: `अपने क्षेत्र की सभी खबरें देखने और\n*खबरें शेयर करके कमाई करने के लिए ${APP_NAME} ऐप डाउनलोड करें* 👇`,
    en: `To see all news from your area and\n*earn by sharing news, download the ${APP_NAME} app* 👇`,
  };
  const promo = lines[language] || lines.mr;
  return `${t ? `*${t}*\n\n` : ''}${promo}\n\n${link}`;
}

export async function shareNewsLink({ story, postLink, language }) {
  const code = await getMyReferralCode();
  const link = attachReferral(postLink, code);
  const message = buildShareText({ title: story?.title, link, language });
  const result = await Share.share(
    Platform.OS === 'ios' ? { message, url: link } : { message },
    { dialogTitle: 'Share' }
  );
  return { result, link, code };
}

// ── Media share ────────────────────────────────────────────────────────────────
const extFromUrl = (u, fallback) => {
  const m = String(u || '').split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : fallback;
};

async function downloadToCache(url, fallbackExt) {
  const dest = `${FileSystem.cacheDirectory}share-${Date.now()}.${extFromUrl(url, fallbackExt)}`;
  const res = await FileSystem.downloadAsync(url, dest);
  if (res.status && res.status >= 400) throw new Error(`download failed (${res.status})`);
  return res.uri;
}

// Video share. Agar backend ne branding wala video diya hai (story.branded_video) wahi bhejo,
// warna original video file.
export async function shareVideoFile(videoUrl) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing not available');
  const local = /^https?:/i.test(videoUrl) ? await downloadToCache(videoUrl, 'mp4') : videoUrl;
  await Sharing.shareAsync(local, { mimeType: 'video/mp4', dialogTitle: 'Share video', UTI: 'public.mpeg-4' });
}

// Branded image (ViewShot se bani file) share.
export async function shareImageFile(localUri) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing not available');
  await Sharing.shareAsync(localUri, { mimeType: 'image/jpeg', dialogTitle: 'Share image', UTI: 'public.jpeg' });
}