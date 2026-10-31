// Home feed scroll events ko cards tak pahunchane ke liye chhota event bus.
// HomeScreen ka ScrollView onScroll me emitFeedScroll(y) bulata hai.
// subscribeUserScroll(): video card sirf ASLI user-scroll par pause hota hai (khud-ba-khud hone wale
// scroll jaise auto-sliding banner / sidebar / marquee / chhote layout shift se nahi).
import { Platform } from 'react-native';

const listeners = new Set();

export function subscribeFeedScroll(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emitFeedScroll(y) {
  listeners.forEach((fn) => { try { fn(y); } catch (_) { /* ignore */ } });
}

const MIN_MOVE_PX = 4;      // itna scroll hone par hi maanenge ki user ne scroll kiya
const DEFAULT_GRACE_MS = 600; // play dabane ke turant baad ka chhota layout-scroll ignore

// getNode: () => card / video ka DOM node (web) ya view ref (native). onUserScroll: pause karne wala callback.
// Return: unsubscribe function. Isse sirf tab subscribe karo jab video chal raha ho.
export function subscribeUserScroll(getNode, onUserScroll, graceMs = DEFAULT_GRACE_MS) {
  const since = Date.now();
  let done = false;
  const fire = () => {
    if (done || Date.now() - since < graceMs) return;
    done = true;
    try { onUserScroll(); } catch (_) { /* ignore */ }
  };

  // Home ka ScrollView (web + Android + iOS): y offset badla to hi
  let base = null;
  const unsubBus = subscribeFeedScroll((y) => {
    if (typeof y === 'number') {
      if (base == null) { base = y; return; }
      if (Math.abs(y - base) < MIN_MOVE_PX) return;
    }
    fire();
  });

  // Web: page ya card ke ancestor scroll-container ka scroll (position sach me badli ho to)
  let removeDom = null;
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const node = getNode && getNode();
    if (node && typeof node.parentNode !== 'undefined') {
      const bases = new Map();
      bases.set(document, window.scrollY || document.documentElement.scrollTop || 0);
      let p = node.parentNode;
      while (p && p !== document && p !== document.body && p !== document.documentElement) {
        if (typeof p.scrollTop === 'number') bases.set(p, p.scrollTop);
        p = p.parentNode;
      }
      const onScroll = (e) => {
        const t = e && e.target;
        const isDoc = !t || t === document || t === document.documentElement || t === document.body;
        const key = isDoc ? document : t;
        if (!bases.has(key)) return; // card ka ancestor nahi (sidebar / slider / marquee) => ignore
        const cur = isDoc ? (window.scrollY || document.documentElement.scrollTop || 0) : t.scrollTop;
        if (Math.abs(cur - bases.get(key)) < MIN_MOVE_PX) return;
        fire();
      };
      document.addEventListener('scroll', onScroll, true);
      removeDom = () => document.removeEventListener('scroll', onScroll, true);
    }
  }

  return () => { done = true; unsubBus(); if (removeDom) removeDom(); };
}