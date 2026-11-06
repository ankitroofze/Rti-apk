// constants/mediaConfig.js
// Ek hi jagah saari settings — PREVIEW aur DOWNLOAD (FFmpeg) dono yahin se padhte hain,
// taaki dono hamesha match karein (WYSIWYG).

// TODO: apna server URL likho (end me "/" ho ya na ho, dono chalega)
export const BASE_URL = 'https://YOUR-SERVER.com/uploads/';

// Original video ki awaaz rakhni hai? false = sirf music (preview me video muted, output me bhi).
// true  = original + music mix (preview me video unmuted, output me amix).
export const KEEP_ORIGINAL_AUDIO = false;

// Preview aur FFmpeg dono me ye same volume use hote hain.
export const MUSIC_VOLUME = 0.6;
export const ORIGINAL_VOLUME = 1.0;

// Image export ki max side (px). Preview chhota hota hai, par capture isi size me hota hai.
export const MAX_IMAGE_SIDE = 2160;

// Backend sirf name bhejta hai ("frame1.png", "song.mp3") -> BASE_URL + name.
// Agar backend kabhi full URL bhej de to wahi use hota hai. Spaces ko encode karta hai.
export function buildMediaUrl(nameOrUrl) {
  const v = String(nameOrUrl || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const base = String(BASE_URL).replace(/\/+$/, '');
  const name = v.replace(/^\/+/, '');
  return encodeURI(`${base}/${name}`);
}