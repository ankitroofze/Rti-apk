// utils/newsEngagementStore.js
// News card (feed) / News Details / Feed (reels) / Profile / Public Profile ke beech like / comment / share / view ka SHARED state.
// Kahin bhi like, comment, share, view badle => yahan publish hota hai, aur baaki sab jagah turant dikhta hai
// (web + Android + iOS), bina refresh kiye. Session me chalta hai; liked ki list phone me bhi save hoti hai.
//
// 3 cheezein:
//  1) publishEngagement()      -> user ne KHUD kuch kiya (like/comment/share/view) — turant sab screens par.
//  2) reconcileServerCounts()  -> server se fresh list aayi — dusre users ke like/comment bhi live dikhein.
//  3) useEngagementSync()      -> list wali screen ke liye ready hook (setItems patch kar deta hai).
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FRESH_MS = 10 * 60 * 1000;     // itne time tak yahan ka (taza) count server/route ke purane count se upar maana jaata hai
const OWN_GUARD_MS = 60 * 1000;      // user ke apne action ke itne der baad tak server-sync us field ko overwrite nahi karega
const MAX_ENTRIES = 500;
const FIELDS = ['liked', 'likes', 'comments', 'shares', 'views'];

const entries = new Map();       // id -> { liked, likes, comments, shares, views, ts, ft:{field:ts} }
const serverSnap = new Map();    // id -> last server counts dekhe hue (unchanged ko dobara notify nahi karte)
const listeners = new Set();     // fn(id, entryOrPatch, sourceId)

const keyOf = (id) => (id === undefined || id === null ? '' : String(id));

const toCount = (v) => {
  if (v === undefined || v === null || v === '' || typeof v === 'boolean' || Array.isArray(v)) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : undefined;
};

function prune() {
  if (entries.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, e] of entries) { if (now - e.ts > FRESH_MS) entries.delete(k); }
  while (entries.size > MAX_ENTRIES) {
    const first = entries.keys().next();
    if (first.done) break;
    entries.delete(first.value);
  }
  while (serverSnap.size > MAX_ENTRIES * 2) {
    const first = serverSnap.keys().next();
    if (first.done) break;
    serverSnap.delete(first.value);
  }
}

function notify(k, payload, sourceId) {
  listeners.forEach((fn) => { try { fn(k, payload, sourceId); } catch (_) { /* ignore */ } });
}

// 🔒 Logout / account switching par: pichle user ka liked/views state memory se hata do
export function resetEngagement() {
  entries.clear();
  serverSnap.clear();
}

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
  FIELDS.forEach((f) => {
    if (patch[f] === undefined || patch[f] === null) return;
    clean[f] = f === 'liked' ? Boolean(patch[f]) : Math.max(0, Number(patch[f]) || 0);
  });
  if (!Object.keys(clean).length) return;
  const now = Date.now();
  const prev = entries.get(k) || {};
  const ft = { ...(prev.ft || {}) };
  Object.keys(clean).forEach((f) => { ft[f === 'liked' ? 'likes' : f] = now; });
  const entry = { ...prev, ...clean, ts: now, ft };
  entries.set(k, entry);
  prune();
  notify(k, entry, sourceId);
}

// Server se fresh items aaye (list / feed / profile) => unke counts sab mounted cards + lists par live push karo.
// User ne abhi-abhi khud jo badla (OWN_GUARD_MS) usko server ke shayad-purane count se overwrite nahi karte.
export function reconcileServerCounts(items, sourceId = 'server-sync') {
  if (!Array.isArray(items) || !items.length) return;
  const now = Date.now();
  items.forEach((it) => {
    if (!it || it.isAd || it.is_ad || it.is_ecom) return;
    const k = keyOf(it.id);
    if (!k) return;

    const srv = {};
    const likes = toCount(it.likes);
    if (likes !== undefined) srv.likes = likes;
    const comments = toCount(it.comments_count ?? it.commentsCount ?? it.comments);
    if (comments !== undefined) srv.comments = comments;
    const shares = toCount(it.shares);
    if (shares !== undefined) srv.shares = shares;
    const views = toCount(it.views);
    if (views !== undefined) srv.views = views;

    const own = entries.get(k);
    const ownFresh = own && (now - own.ts) < FRESH_MS;
    ['likes', 'comments', 'shares', 'views'].forEach((f) => {
      if (srv[f] === undefined || !own) return;
      const at = own.ft?.[f] || 0;
      if (now - at < OWN_GUARD_MS) { delete srv[f]; }
    });
    // Own like ke kuch der baad tak server count peeche reh sakta hai — local ko neeche mat girao
    if (ownFresh && srv.likes !== undefined && own.likes !== undefined) {
      if (own.liked === true) srv.likes = Math.max(srv.likes, own.likes);
      else if (own.liked === false) srv.likes = Math.min(srv.likes, own.likes);
    }

    const prev = serverSnap.get(k) || {};
    const patch = {};
    Object.keys(srv).forEach((f) => { if (prev[f] !== srv[f]) patch[f] = srv[f]; });
    serverSnap.set(k, { ...prev, ...srv });
    if (Object.keys(patch).length) notify(k, patch, sourceId);
  });
}

export function subscribeEngagement(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ── list item par patch lagane ka default tareeka (likes / comments / shares / views / liked_by_me / liked_by) ──
export function defaultApplyEngagement(item, patch, email = '') {
  if (!item || !patch) return item;
  if (item.isAd || item.is_ad || item.is_ecom) return item;   // ads/ecom ki id news id se takra sakti hai
  let next = item;
  const set = (key, value) => {
    if (next[key] === value) return;
    if (next === item) next = { ...item };
    next[key] = value;
  };
  if (patch.likes !== undefined) set('likes', patch.likes);
  if (patch.comments !== undefined && !Array.isArray(item.comments)) set('comments', patch.comments);
  if (patch.shares !== undefined) set('shares', patch.shares);
  if (patch.views !== undefined) set('views', Math.max(Number(item.views || 0), patch.views));
  if (patch.liked !== undefined) {
    set('liked_by_me', patch.liked);
    const mail = String(email || '').trim().toLowerCase();
    if (mail) {
      const list = Array.isArray(item.liked_by) ? item.liked_by : [];
      const has = list.some((e) => String(e || '').trim().toLowerCase() === mail);
      if (patch.liked && !has) set('liked_by', [...list, mail]);
      if (!patch.liked && has) set('liked_by', list.filter((e) => String(e || '').trim().toLowerCase() !== mail));
    }
  }
  return next;
}

// React hook: list screen me `useEngagementSync(setItems, applyFn?)` — kisi bhi jagah like/comment/share badle
// to ye list ka item turant update kar deta hai. applyFn(item, patch) -> naya item (ya wahi item agar kuch na badla).
export function useEngagementSync(setItems, apply = defaultApplyEngagement, sourceId = '') {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => subscribeEngagement((id, patch, src) => {
    if (sourceId && src === sourceId) return;
    setItems((prev) => {
      if (!Array.isArray(prev) || !prev.length) return prev;
      let changed = false;
      const next = prev.map((it) => {
        if (!it || keyOf(it.id) !== id) return it;
        const upd = applyRef.current(it, patch);
        if (upd !== it) changed = true;
        return upd;
      });
      return changed ? next : prev;
    });
  }), [setItems, sourceId]);
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