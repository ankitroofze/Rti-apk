// utils/shareNews.js
// News share helpers:
//  1) Link share  -> WhatsApp/others me title + app-download line + news link (referral ke saath).
//                    Link preview (image/video thumbnail + RTI Voice frame) backend ke OG tags se banta hai.
//  2) Media share -> Image news = branded image file, Video news = video file.
import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getVideoWithMusic, needsVideoMerge, toCorsSafeMediaUrl } from './videoWithMusic';
import * as Sharing from 'expo-sharing';
import { getReferralInfo } from './Referralservice';
import { composeFramedImageWeb } from './composeFramedImage';

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
// opts = { musicUrl, musicVolume, muteOriginal, frame } => frame + music video ke saath merge hokar share hota hai.
export async function shareVideoFile(videoUrl, opts = {}) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing not available');
  let src = videoUrl;
  if (needsVideoMerge(opts)) {
    const m = await getVideoWithMusic(videoUrl, opts);   // fail ho to original video hi share hogi
    if (m.merged) src = m.uri;
  }
  const local = /^https?:/i.test(src) ? await downloadToCache(src, 'mp4') : src;
  await Sharing.shareAsync(local, { mimeType: 'video/mp4', dialogTitle: 'Share video', UTI: 'public.mpeg-4' });
}

// Branded image (ViewShot se bani file) share.
export async function shareImageFile(localUri) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing not available');
  await Sharing.shareAsync(localUri, { mimeType: 'image/jpeg', dialogTitle: 'Share image', UTI: 'public.jpeg' });
}

// ── WEB: video (frame + music) + news link ek saath ─────────────────────────────
// Browser share ke liye taaza click maangta hai, aur video banne me time lagta hai — isliye file taiyaar hone ke baad
// `confirm()` (existing popup me "Share" button) se user ka naya tap lete hain.
// Return: { handled: true }  => share ho gaya / user ne cancel kiya.
//         { handled: false } => browser file-share support nahi karta / video nahi bani — caller link share kare.
export async function shareVideoWithLinkWeb({ story, postLink, language, videoUrl, opts, confirm }) {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return { handled: false };
  if (!needsVideoMerge(opts)) return { handled: false };
  const m = await getVideoWithMusic(videoUrl, opts);
  if (!m.merged || !m.blob) return { handled: false };
  try {
    const file = new File([m.blob], `rti-news-video-${Date.now()}.${m.ext || 'mp4'}`, { type: m.blob.type || 'video/mp4' });
    if (!navigator.canShare({ files: [file] })) return { handled: false };
    const code = await getMyReferralCode();
    const link = attachReferral(postLink, code);
    const message = buildShareText({ title: story?.title, link, language });
    const ok = confirm ? await confirm() : true;
    if (!ok) return { handled: true, shared: false };
    await navigator.share({ files: [file], title: String(story?.title || ''), text: message });
    return { handled: true, shared: true, link, code };
  } catch (e) {
    if (e && e.name === 'AbortError') return { handled: true, shared: false };   // user ne share sheet band ki
    return { handled: false };
  } finally {
    try { if (m.owned) URL.revokeObjectURL(m.uri); } catch (_) { /* ignore */ }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ONE-TAP SHARE: media (video / image, frame + music ke saath) + news link ek saath
// ═════════════════════════════════════════════════════════════════════════════
// Link ke click par news seedha khule — iske liye link ka format `https://rtinews.in/news/<id>?ref=CODE` hai
// (web par SPA route, app me deep link / App Link; WhatsApp preview ke liye server/news-share.php OG tags deta hai).
//
//  WEB    : navigator.share({ files, text }) => file + title + link ek hi share me. Support na ho to link-only share.
//  ANDROID: react-native-share (installed ho to) => file + message (caption me link). Na ho to file share + link clipboard me copy.
//  iOS    : WhatsApp file ke saath text ignore karta hai, isliye link clipboard me bhi copy hota hai ("paste in caption").

// Metro dynamic require(name) allow nahi karta — har optional package ka static require try/catch me
function loadClipboardModule() {
  try {
    // eslint-disable-next-line global-require
    return require('expo-clipboard');
  } catch (_) {
    return null;
  }
}

function loadRNShareModule() {
  try {
    // eslint-disable-next-line global-require
    return require('react-native-share');
  } catch (_) {
    return null;
  }
}

async function copyToClipboard(text) {
  try {
    const EC = loadClipboardModule();
    if (EC?.setStringAsync) { await EC.setStringAsync(String(text)); return true; }
  } catch (_) { /* ignore */ }
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(text));
      return true;
    }
    // eslint-disable-next-line global-require
    const { Clipboard } = require('react-native');
    if (Clipboard?.setString) { Clipboard.setString(String(text)); return true; }
  } catch (_) { /* ignore */ }
  return false;
}

const mimeForKind = (kind, uri) => {
  const e = extFromUrl(uri, kind === 'video' ? 'mp4' : 'jpg');
  if (kind === 'video') return e === 'webm' ? 'video/webm' : e === 'mov' ? 'video/quicktime' : 'video/mp4';
  return e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : 'image/jpeg';
};

// ── WEB: file + link ──────────────────────────────────────────────────────────
async function prepareWebFile({ kind, mediaUrl, opts, frame }) {
  const safeMediaUrl = toCorsSafeMediaUrl(mediaUrl);
  if (kind === 'video') {
    if (!needsVideoMerge(opts)) {
      const r = await fetch(safeMediaUrl, { mode: 'cors', cache: 'no-store' });
      if (!r.ok) throw new Error('video fetch failed');
      const blob = await r.blob();
      return { blob, ext: extFromUrl(safeMediaUrl, 'mp4'), cleanup: () => {} };
    }
    const m = await getVideoWithMusic(safeMediaUrl, opts);
    if (!m.merged || !m.blob) throw new Error(m.error || 'video merge failed');
    return { blob: m.blob, ext: m.ext || 'mp4', cleanup: () => { try { if (m.owned) URL.revokeObjectURL(m.uri); } catch (_) { /* ignore */ } } };
  }
  if (!frame) {   // frame nahi => original image hi (letterbox / re-encode nahi)
    const r = await fetch(safeMediaUrl, { mode: 'cors', cache: 'no-store' });
    if (!r.ok) throw new Error('image fetch failed');
    return { blob: await r.blob(), ext: extFromUrl(safeMediaUrl, 'jpg'), cleanup: () => {} };
  }
  const c = await composeFramedImageWeb(safeMediaUrl, frame);
  return { blob: c.blob, ext: c.ext, cleanup: () => { try { URL.revokeObjectURL(c.uri); } catch (_) { /* ignore */ } } };
}

async function shareWebPackage({ story, kind, mediaUrl, opts, frame, message, link, confirm }) {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return { handled: false };
  let prepared = null;
  try {
    prepared = await prepareWebFile({ kind, mediaUrl, opts, frame });
    const type = prepared.blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
    const file = new File([prepared.blob], `rti-news-${kind}-${Date.now()}.${prepared.ext}`, { type });
    if (!navigator.canShare({ files: [file] })) return { handled: false };
    // browser ko "taaza click" chahiye — file banne ke baad popup se naya tap lete hain
    const ok = confirm ? await confirm() : true;
    if (!ok) return { handled: true, shared: false };
    await navigator.share({ files: [file], title: String(story?.title || ''), text: message });
    return { handled: true, shared: true, mode: 'media+link' };
  } catch (e) {
    if (e && e.name === 'AbortError') return { handled: true, shared: false };
    return { handled: false };
  } finally {
    try { prepared?.cleanup?.(); } catch (_) { /* ignore */ }
  }
}

// ── NATIVE: file + link ───────────────────────────────────────────────────────
async function prepareNativeFile({ kind, mediaUrl, opts, getNativeImageFile }) {
  if (kind === 'video') {
    let src = mediaUrl;
    if (needsVideoMerge(opts)) {
      const m = await getVideoWithMusic(mediaUrl, opts);   // fail ho to original video hi
      if (m.merged) src = m.uri;
    }
    return /^https?:/i.test(src) ? downloadToCache(src, 'mp4') : src;
  }
  if (getNativeImageFile) {
    const out = await getNativeImageFile();               // framed / branded image (view-shot) ka local uri
    if (out) return out;
  }
  return /^https?:/i.test(mediaUrl) ? downloadToCache(mediaUrl, 'jpg') : mediaUrl;
}

async function shareNativePackage({ kind, mediaUrl, opts, getNativeImageFile, message, link }) {
  const local = await prepareNativeFile({ kind, mediaUrl, opts, getNativeImageFile });
  const type = mimeForKind(kind, local);
  const fileUrl = /^file:\/\//i.test(local) ? local : `file://${local}`;

  const RNS = loadRNShareModule();
  const RNShare = RNS?.default || RNS;
  if (RNShare?.open) {
    try {
      const res = await RNShare.open({ url: fileUrl, type, message, title: 'Share', failOnCancel: false });
      if (res && res.success === false) return { shared: false, mode: 'cancelled' };   // user ne share sheet band ki
      // iOS WhatsApp message ko ignore karta hai — link clipboard me bhi rakh do
      const needsPaste = Platform.OS === 'ios' ? await copyToClipboard(message) : false;
      return { shared: true, mode: 'media+link', needsPaste };
    } catch (e) {
      if (String(e?.message || e).toLowerCase().includes('cancel')) return { shared: false, mode: 'cancelled' };
      /* niche fallback chalega */
    }
  }
  // Fallback: file share + link clipboard (caption me paste)
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing not available');
  const copied = await copyToClipboard(message);
  await Sharing.shareAsync(local, { mimeType: type, dialogTitle: kind === 'video' ? 'Share video' : 'Share image', UTI: kind === 'video' ? 'public.mpeg-4' : 'public.jpeg' });
  return { shared: true, mode: copied ? 'media+copied' : 'media', needsPaste: copied };
}

/**
 * Ek hi call: media (frame + music ke saath) + title + news link.
 * @param {{
 *   story: object, postLink: string, language?: string,
 *   kind: 'video'|'image'|'none', mediaUrl?: string,
 *   opts?: object,              // exportOptsFromStory(story)  (video: music + frame)
 *   frame?: object|null,        // frameOptsFromStory(story)   (image: frame)
 *   getNativeImageFile?: () => Promise<string|null>,   // native image: view-shot se bani local file
 *   confirm?: () => Promise<boolean>,                  // web: "Share" tap popup
 * }} p
 * @returns {Promise<{shared:boolean, mode:string, link:string, code:string, needsPaste?:boolean}>}
 *   mode: 'media+link' | 'media+copied' | 'media' | 'link' | 'cancelled'
 */
export async function shareNewsPackage({ story, postLink, language, kind = 'none', mediaUrl = '', opts = {}, frame = null, getNativeImageFile, confirm }) {
  const code = await getMyReferralCode();
  const link = attachReferral(postLink, code);
  const message = buildShareText({ title: story?.title, link, language });

  if (kind !== 'none' && mediaUrl) {
    try {
      if (Platform.OS === 'web') {
        const r = await shareWebPackage({ story, kind, mediaUrl, opts, frame, message, link, confirm });
        if (r.handled) return { shared: !!r.shared, mode: r.shared ? 'media+link' : 'cancelled', link, code };
      } else {
        const r = await shareNativePackage({ kind, mediaUrl, opts, getNativeImageFile, message, link });
        return { ...r, link, code };
      }
    } catch (_) { /* media fail => link share niche */ }
  }
  const result = await Share.share(Platform.OS === 'ios' ? { message, url: link } : { message }, { dialogTitle: 'Share' });
  const shared = Platform.OS === 'web' || result?.action === Share.sharedAction;
  return { shared, mode: shared ? 'link' : 'cancelled', link, code };
}