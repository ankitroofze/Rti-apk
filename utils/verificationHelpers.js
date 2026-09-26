// utils/verificationHelpers.js
// ─────────────────────────────────────────────────────────
// Member ID-card QR verification.
// The QR on the ID card encodes a PUBLIC web link
// (https://rtinews.in/verify?d=...) so anyone can scan it with a normal
// camera app — the app itself does not need to be installed.
// Saara member data QR ke andar hi base64 mein encode hota hai
// (koi backend call ki zaroorat nahi — is card ke liye).
// ─────────────────────────────────────────────────────────

import { generateMemberId, getRank, getIssueDate, getValidUptoDate, fmt } from './profileHelpers';

export const VERIFY_BASE_URL = 'https://www.bhartiyamahitiadhikar.com/whats-rti.aspx';

// Base64url encode/decode (works same on web + native, no Buffer needed)
function b64urlEncode(str) {
  const b64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(str)))
    : Buffer.from(str, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  let b64 = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const decoded = typeof atob === 'function'
    ? decodeURIComponent(escape(atob(b64)))
    : Buffer.from(b64, 'base64').toString('utf-8');
  return decoded;
}

// Simple non-cryptographic token so a casual tamper attempt is visible.
// (Not real security — there's no backend for this card — just an integrity hint.)
function buildToken(payload) {
  const raw = `${payload.id}|${payload.vu}|${payload.n}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) { h = (h << 5) - h + raw.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36).toUpperCase();
}

// Builds the compact payload that gets embedded in the QR.
// Keys are kept short (n, id, ...) to keep the QR small enough to scan reliably.
export function buildVerificationPayload(profile = {}) {
  const rank = getRank(profile.referral_count || 0);
  const seatName = String(profile?.state_seat?.seat_name || profile?.author_seat_name || '').trim();
  const designation = seatName || `${rank.title} - RTI News Member`;
  const issueDate = getIssueDate(profile);
  const validUpto = getValidUptoDate(profile);

  const payload = {
    n: profile.name || '',
    id: generateMemberId(profile.email),
    d: designation,
    a: [profile.village, profile.state].filter(Boolean).join(', '),
    mt: rank.title,
    id_dt: issueDate.toISOString().slice(0, 10),
    vu: validUpto.toISOString().slice(0, 10),
    gen: new Date().toISOString(),
  };
  payload.tok = buildToken(payload);
  return payload;
}

export function buildVerificationUrl(profile = {}) {
  const payload = buildVerificationPayload(profile);
  const encoded = b64urlEncode(JSON.stringify(payload));
  return `${VERIFY_BASE_URL}`;
}

// Decodes the `d` query param back into the member payload.
// Returns null if the QR/link data is missing or corrupted.
export function decodeVerificationData(encoded) {
  try {
    const json = b64urlDecode(encoded);
    const payload = JSON.parse(json);
    if (!payload || !payload.id) return null;
    const expectedToken = buildToken(payload);
    return { ...payload, tokenValid: payload.tok === expectedToken };
  } catch (_e) {
    return null;
  }
}

// Active/Inactive status purely from the decoded Valid Upto date.
export function getVerificationStatus(payload) {
  if (!payload?.vu) return { active: false, label: 'Invalid' };
  const validUpto = new Date(payload.vu);
  if (Number.isNaN(validUpto.getTime())) return { active: false, label: 'Invalid' };
  const endOfValidDay = new Date(validUpto.getFullYear(), validUpto.getMonth(), validUpto.getDate(), 23, 59, 59, 999);
  const active = Date.now() <= endOfValidDay.getTime();
  return { active, label: active ? 'Active' : 'Inactive' };
}

export function fmtDisplayDate(isoDateOrString) {
  if (!isoDateOrString) return '';
  const d = new Date(isoDateOrString);
  if (Number.isNaN(d.getTime())) return String(isoDateOrString);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function fmtDisplayDateTime(isoDateOrString) {
  if (!isoDateOrString) return '';
  const d = new Date(isoDateOrString);
  if (Number.isNaN(d.getTime())) return String(isoDateOrString);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}
