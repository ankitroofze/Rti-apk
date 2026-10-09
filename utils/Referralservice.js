// utils/referralService.js
// ─────────────────────────────────────────────────────────
// Referral code / link / QR — SIRF backend se.
//
//  • GET /referral (login token ke saath) -> referral_code, referral_link, QR payload
//  • Frontend referral link ya code KABHI khud generate nahi karta.
//  • Link na aaye to UI "not available" dikhata hai (galat link banane se behtar).
//  • Register link (?ref=CODE) khulne par code sirf prefill hota hai.
// ─────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const firstStr = (...vals) => { for (const v of vals) { const s = str(v); if (s) return s; } return ''; };

// Backend response ko ek fixed shape me badalta hai. Field ke naam alag-alag ho sakte hain,
// isliye common names check kiye hain. Value ko modify NAHI karte.
export function normalizeReferral(payload) {
  const root = payload?.data?.data || payload?.data || payload || {};
  const code = firstStr(root.referral_code, root.my_referral_code, root.code);
  const link = firstStr(root.referral_link, root.referral_url, root.share_link, root.link, root.url);
  // QR: backend ne alag payload/image diya ho to wahi; warna wahi referral link (spec: QR me link encode hota hai)
  const qr = firstStr(root.qr_payload, root.referral_qr_payload, root.referral_qr, root.qr_code, root.qr, link);
  return {
    code,
    link,
    qr,
    qrIsImage: /^data:image\//i.test(qr) || /\.(png|jpe?g|svg)(\?|$)/i.test(qr),
    raw: root,
  };
}

let cache = null;
let inflight = null;

export async function getReferralInfo({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = AuthAPI.getReferrals()
    .then((res) => {
      if (!res?.ok) return { ok: false, message: res?.message || 'Referral info unavailable.', isAuth: Boolean(res?.isAuth) };
      const info = { ok: true, ...normalizeReferral(res.data) };
      cache = info;
      return info;
    })
    .catch(() => ({ ok: false, message: 'Network error.' }))
    .finally(() => { inflight = null; });
  return inflight;
}

// Logout par call karo.
export function clearReferralInfo() { cache = null; inflight = null; }

export function useReferralInfo() {
  const [info, setInfo] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    let alive = true;
    getReferralInfo().then((res) => { if (alive) { setInfo(res); setLoading(false); } });
    return () => { alive = false; };
  }, []);
  const refresh = useCallback(async () => {
    const res = await getReferralInfo({ force: true });
    setInfo(res);
    return res;
  }, []);
  return { info, loading, refresh };
}

// ── Register link se ?ref=CODE padhna (sirf prefill, code banana nahi) ──
const cleanCode = (v) => {
  const s = String(v || '').trim();
  return /^[A-Za-z0-9_-]{3,40}$/.test(s) ? s : '';
};
const refFromUrl = (url = '') => {
  const m = String(url).match(/[?&]ref=([^&#]+)/i);
  if (!m) return '';
  try { return cleanCode(decodeURIComponent(m[1])); } catch { return ''; }
};

export async function readReferralCodeFromUrl() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return refFromUrl(window.location?.search || '');
    }
    const initial = await Linking.getInitialURL();
    return refFromUrl(initial || '');
  } catch { return ''; }
}