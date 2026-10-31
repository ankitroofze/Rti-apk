// utils/newsEngagementStore.js
// News card (feed) aur News Details page ke beech like / comment / share / view ka SHARED state.
// Kahin bhi (card ya details) like, comment, share, view badle => yahan publish hota hai, aur dusri
// jagah turant dikhta hai (web + Android + iOS). Session me chalta hai; liked ki list phone me bhi save hoti hai.
import AsyncStorage from '@react-native-async-storage/async-storage';

const FRESH_MS = 10 * 60 * 1000; // itne time tak yahan ka (taza) count server/route ke purane count se upar maana jaata hai
const entries = new Map();       // id -> { liked, likes, comments, shares, views, ts }
const listeners = new Set();     // fn(id, entry, sourceId)

const keyOf = (id) => (id === undefined || id === null ? '' : String(id));

export function getEngagement(id) {
  const k = keyOf(id);
  if (!k) return null;
  const e = entries.get(k);
  if (!e) return null;
  if (Date.now() - e.ts > FRESH_MS) { entries.delete(k); return null; }
  return e;
}

// patch me sirf wahi fields do jo badli hain: { liked, likes, comments, shares, views }
export function publishEngagement(id, patch = {}, sourceId = '') {
  const k = keyOf(id);
  if (!k) return;
  const clean = {};
  ['liked', 'likes', 'comments', 'shares', 'views'].forEach((f) => {
    if (patch[f] === undefined || patch[f] === null) return;
    clean[f] = f === 'liked' ? Boolean(patch[f]) : Math.max(0, Number(patch[f]) || 0);
  });
  const entry = { ...(entries.get(k) || {}), ...clean, ts: Date.now() };
  entries.set(k, entry);
  listeners.forEach((fn) => { try { fn(k, entry, sourceId); } catch (_) { /* ignore */ } });
}

export function subscribeEngagement(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ── "liked" ki list phone me (NewsFeedCard jaisi hi key) ──
const LIKED_KEY_PREFIX = '@newsfeed_liked_ids_';
const likedKey = (email) => LIKED_KEY_PREFIX + String(email || 'guest').trim().toLowerCase();

export async function getLikedLocal(email) {
  try {
    const raw = await AsyncStorage.getItem(likedKey(email));
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

export async function persistLikedLocal(email, id, liked) {
  try {
    const cur = await getLikedLocal(email);
    if (liked) cur[id] = true; else delete cur[id];
    await AsyncStorage.setItem(likedKey(email), JSON.stringify(cur));
  } catch (_) { /* ignore */ }
}