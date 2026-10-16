// utils/idCardService.js
// ─────────────────────────────────────────────────────────
// ID Card verification URL + QR.
//
//  • QR ka design hamesha frontend mein banta hai (IdCardQr component).
//  • Backend ka `qr_payload` / `verification_url` mile to wahi use hota hai.
//  • Na mile to buildFallbackQrUrl() se public API URL banta hai:
//      https://rtiapi.roofze.in/api/profile/{user_id}
//    Phone se scan karne par us API ka response khulta hai.
//
// Flow: GET /id-cards -> (card nahi hai to) POST /id-cards { subscription_id }
// ─────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { buildPageVerifyUrl } from '../constants/idCardVerifyConfig';
export { buildPageVerifyUrl };
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

let cache = null;        // { id, id_number, verification_url, qr_payload }
let inflight = null;     // chal rahi request (duplicate calls rokne ke liye)
let createTried = false; // POST sirf ek baar auto-try hota hai (loop nahi)

// Debug: QR kyun nahi aaya, uska chhota sa kaaran (card par dikhane ke liye)
const debugInfo = { reason: '' };
export const getIdCardReason = () => debugInfo.reason;

// Jahan verify.html host hai (public/verify.html). Agar app kisi sub-path par hai
// to yahan add karo, jaise 'https://rtinews.in/rti-news'
export const VERIFY_PAGE_BASE = 'https://rtiapi.roofze.in';

// QR ke andar ye link jayega -> scan karne par designed verification page khulega
// (verify.html khud API se member ka data laakar dikhata hai)
export const buildFallbackQrUrl = (profile = {}) => {
  const id = profile?.id ?? profile?.user_id ?? null;
  return id != null && id !== ''
    ? `${VERIFY_PAGE_BASE}/verify.html?id=${encodeURIComponent(id)}`
    : '';
};

const firstStr = (...vals) => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

// Backend kisi bhi naam se bheje, yahan sab ek shape mein aa jayega.
const normalizeCard = (c = {}) => {
  const verification_url = firstStr(
    c.verification_url, c.verificationUrl, c.verify_url, c.verify_link, c.url, c.link
  );
  const qr_payload = firstStr(
    c.qr_payload, c.qrPayload, c.qr_code, c.qrCode, c.qr_image, c.qr_url,
    c.qr_data, c.qr, verification_url
  );
  return {
    id: c.id,
    id_number: c.id_number || c.idNumber || '',
    valid_until: firstStr(c.valid_until, c.validUntil),
    verification_url,
    qr_payload,
  };
};

// API ki date ("2026-10-28" ya ISO) -> "28/10/2026" (timezone shift ke bina).
export const formatCardDate = (raw) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

const pickCard = (list = []) =>
  list.filter(Boolean).map(normalizeCard).find((c) => c.qr_payload) || null;

async function load() {
  // 1) GET /api/id-cards (login token AuthAPI ke andar header me jaata hai)
  const listRes = await AuthAPI.getIdCards();
  console.log('[IdCard] GET /id-cards ->', JSON.stringify(listRes || {}).slice(0, 800));
  debugInfo.reason = listRes.ok
    ? `GET ok: ${listRes.idCards?.length || 0} card, QR key not found`
    : `GET fail: ${listRes.message || 'error'}`;

  if (listRes.ok) {
    const card = pickCard(listRes.idCards);
    if (card) return card;
  } else if (listRes.isAuth || listRes.isNetwork) {
    return null;
  }

  // 2) Card nahi hai -> POST /api/id-cards { subscription_id }
  if (createTried) return null;

  const subRes = await AuthAPI.getMyRoleSubscriptions();
  if (!subRes.ok) {
    debugInfo.reason = `Subscriptions fail: ${subRes.message || 'error'}`;
    return null;
  }
  const raw = subRes.subscriptions;
  const subs = Array.isArray(raw)
    ? raw
   : (raw?.user_subscriptions || raw?.subscriptions || raw?.data || raw?.role_subscriptions || (raw ? [raw] : []));
  const isLive = (s = {}) => {
    const st = String(s.status ?? '').toLowerCase();
    if (['expired', 'inactive', 'cancelled', 'canceled', 'failed', 'refunded'].includes(st)) return false;
    const exp = s.expires_at || s.expiry || s.end_date;
    if (exp) {
      const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
      if (Number.isFinite(t) && Date.now() > t) return false;
    }
    return true;
  };
  const sub = subs.filter(isLive).sort((a, b) =>
    String(b.purchased_at || b.created_at || '').localeCompare(String(a.purchased_at || a.created_at || '')))[0];
  const subscriptionId = sub?.id ?? sub?.subscription_id;
  if (!subscriptionId) {
    debugInfo.reason = 'No active subscription found (POST was not sent)';
    return null;
  }

  createTried = true; // sirf tab jab sach mein POST kar rahe hain
  const created = await AuthAPI.createIdCard({ subscriptionId });
  console.log('[IdCard] POST /id-cards ->', JSON.stringify(created || {}).slice(0, 800));
  debugInfo.reason = created.ok
    ? 'POST ok but no QR in the response'
    : `POST fail: ${created.message || 'error'}`;

  if (created.ok) {
    const card = normalizeCard(created.idCard || {});
    if (card.qr_payload) return card;
    // POST ho gaya par QR response mein nahi aaya -> GET se dobara lo
    const again = await AuthAPI.getIdCards();
    if (again.ok) {
      const c2 = pickCard(again.idCards);
      if (c2) return c2;
    }
  }
  return null;
}

// Cached fetch. force=true -> dobara backend se laao.
export async function getIdCardVerification({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = load()
    .then((res) => { if (res) cache = res; return res; })
    .catch((e) => { console.warn('[IdCard] load error', e); return null; })
    .finally(() => { inflight = null; });
  return inflight;
}

// Logout par call karo taaki agle user ko purana card/QR na dikhe.
export function clearIdCardVerification() {
  cache = null; inflight = null; createTried = false;
}

// React hook — component me use karo.
export function useIdCardVerification() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    let tries = 0;
    const run = async () => {
      const res = await getIdCardVerification({ force: tries > 0 });
      if (!alive) return;
      if (res) { setData(res); setLoading(false); return; }
      tries += 1;
      if (tries < 4) {
        // token/network late ho to dobara try
        setTimeout(() => { if (alive) run(); }, 2500 * tries);
      } else {
        setData(null);
        setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, []);

  const refresh = useCallback(async () => {
    createTried = false;
    setLoading(true);
    const res = await getIdCardVerification({ force: true });
    setData(res);
    setLoading(false);
    return res;
  }, []);

  return { idCard: data, loading, refresh };
}