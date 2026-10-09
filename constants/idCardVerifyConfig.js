// constants/idCardVerifyConfig.js
// BASE_URL environment se aata hai (hardcode nahi).
// .env me ye 2 values rakho (optional, na ho to neeche ke default chalenge):
//   EXPO_PUBLIC_API_URL=https://rtiapi.roofze.in/api
//   EXPO_PUBLIC_API_ORIGIN=https://rtiapi.roofze.in
//   EXPO_PUBLIC_VERIFY_ORIGIN=https://<jahan public/verify.html host hai>
import { Platform } from 'react-native';

const ENV_API = process.env.EXPO_PUBLIC_API_URL;
const ENV_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN;

// QR ka domain check isi origin se hota hai
export const API_ORIGIN = (ENV_ORIGIN || 'https://rtiapi.roofze.in').replace(/\/+$/, '');

// Jahan public/verify.html host hai (QR scan par ye page khulta hai)
export const VERIFY_PAGE_BASE = (process.env.EXPO_PUBLIC_VERIFY_ORIGIN || 'https://rtinews.in')

// ✅ QR me wahi string jaati hai jo GET /id-cards se `qr_payload` aayi — koi encode/modify nahi.
// (Naam purana hai, kyunki IdCardPreview + documentGenerator isi ko call karte hain.)
export const buildPageVerifyUrl = (qrPayload) => (typeof qrPayload === 'string' ? qrPayload : '');

// Web par proxy (CORS se bachne ke liye), native par direct API
export const BASE_URL = Platform.OS === 'web'
  ? '/api-proxy'
  : (ENV_API || `${API_ORIGIN}/api`).replace(/\/+$/, '');

// Scanned QR ko parse karta hai. Sirf apne domain (API_ORIGIN) ka link accept hota hai, warna null.
//   <API_ORIGIN>/.../id-cards/verify/<token>   (aage ?v=1 / ?format=json ho to bhi chalega)
// Dusre domain ka URL kabhi open nahi hota.
const VERIFY_PATH_RE = /\/id-cards\/verify\/([A-Za-z0-9]+)\/?(?:[?#].*)?$/;
export const extractVerifyToken = (raw) => {
  const text = String(raw || '').trim();
  // `${API_ORIGIN}/` se start hona zaroori (rtiapi.roofze.in.evil.com jaise tricks reject)
  if (text.toLowerCase().startsWith(`${API_ORIGIN.toLowerCase()}/`)) {
    const m = text.match(VERIFY_PATH_RE);
    if (m) return m[1];
  }
  return null; // dusra domain / galat format -> reject
};