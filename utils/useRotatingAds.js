// utils/useRotatingAds.js
// ─────────────────────────────────────────────────────────
// Ads ko RANDOM order me, har 2 MINUTE me badalne wala hook.
//   const slots = useRotatingRandomAds(adsPool, slotCount, 120000);
//   slots[0], slots[1] ... => har slot me abhi kaunsa ad dikhana hai
//
// • Ek hi tick me alag-alag slots me jahan tak ho sake DUPLICATE ad nahi aata.
// • Naya tick pichle tick wale ads ko avoid karta hai (taaki har 2 sec me kuch naya dikhe).
// • Pool me 1 hi ad ho to wahi dikhta rahega (rotate karne ko kuch nahi).
// • Ad-free subscription walon ke liye bhi chalta hai — unke sirf POPUP ads band hote hain.
// ─────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

export const AD_ROTATE_MS = 120000; // 2 minute

const adKey = (ad, i) => String(ad?.id ?? ad?.originalAdId ?? `idx-${i}`);

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// pool me se `count` ads random chuno; `prev` me jo the unko peeche rakho
export function pickRandomAds(pool = [], count = 1, prev = []) {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
  if (!list.length || !(count > 0)) return [];
  const prevKeys = new Set((prev || []).map((a, i) => adKey(a, i)));
  const fresh = shuffle(list.filter((a, i) => !prevKeys.has(adKey(a, i))));
  const old = shuffle(list.filter((a, i) => prevKeys.has(adKey(a, i))));
  const ordered = [...fresh, ...old];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    // slots > pool ho to cycle karo (duplicate tabhi aata hai jab ads kam hon)
    out.push(ordered[i % ordered.length]);
  }
  return out;
}

export default function useRotatingRandomAds(pool, count = 1, intervalMs = AD_ROTATE_MS) {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
  const sig = list.map((a, i) => adKey(a, i)).join('|');
  const poolRef = useRef(list);
  const countRef = useRef(count);
  poolRef.current = list;
  countRef.current = count;

  const [picked, setPicked] = useState(() => pickRandomAds(list, count, []));

  // pool / slot count badle to turant naye sire se chuno
  useEffect(() => {
    setPicked(pickRandomAds(poolRef.current, countRef.current, []));
  }, [sig, count]);

  // har 2 minute me naya random set
  useEffect(() => {
    if (!(count > 0) || poolRef.current.length < 2) return undefined;
    const timer = setInterval(() => {
      setPicked((prev) => pickRandomAds(poolRef.current, countRef.current, prev));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [sig, count, intervalMs]);

  return picked;
}