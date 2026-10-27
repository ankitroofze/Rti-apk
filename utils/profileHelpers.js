import { PROFILE_TIERS, SEAT_ID_TO_TIER } from '../constants/profileConstants';

// ── Role Based Profile Look: 6-tier resolver ─────────────────────────────────
// Priority: State Seat (Chief/Executive/Representative) > Blue Tick (Verified)
// > Subscription (Premium) > Common. Same helper ProfileScreen (apna profile)
// aur UserPublicProfileScreen (kisi aur ka profile) dono me use hota hai, taaki
// role change hote he dono jagah color turant sahi update ho.
export function getProfileTier(profileLike = {}) {
  // A purchased role may reach the UI before its optional `state_seat` object.
  // Resolve all backend role fields as well, so Chief never flashes as Common
  // (grey) and every profile surface uses the same colour immediately.
  // seat_id ke saath seat_name bhi check hota hai ("State Bureau Chief" ->
  // "state_bureau_chief"), kyunki kisi aur user ka public profile kholne par
  // kabhi kabhi API seat_id nahi sirf seat_name bhejti hai — pehle tab profile
  // grey "Common User" dikhta tha jabki user ke paas role hota tha.
  const tierCandidate = [
    profileLike?.state_seat?.seat_id,
    profileLike?.seat_id,
    profileLike?.state_seat?.seat_name,
    profileLike?.seat_name,
    profileLike?.role,
    profileLike?.subscription_type,
        profileLike?.subscription_plan?.role,
    String(profileLike?.subscription_plan?.role_id_raw || '').split(',')[0],

  ]
    .map((value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
    .find((value) => Boolean(SEAT_ID_TO_TIER[value]));
  const seatTierKey = tierCandidate ? SEAT_ID_TO_TIER[tierCandidate] : null;
  if (seatTierKey && PROFILE_TIERS[seatTierKey]) return PROFILE_TIERS[seatTierKey];
  if (profileLike?.has_blue_tick) return PROFILE_TIERS.verified;
  // Subscription API different screens par `is_subscribed` ke bina active
  // plan object bhej sakti hai. Plan milte hi premium theme apply karo, taaki
  // profile, author pill aur Follow button ek hi colour me refresh hon.
  const plan = profileLike?.subscription_plan || profileLike?.active_plan || null;
  const planStatus = String(plan?.status || plan?.subscription_status || '').toLowerCase();
  const hasPlan = Boolean(plan && (plan?.plan_id || plan?.id || plan?.plan_name || plan?.name));
  const subscriptionRole = [profileLike?.subscription_type, profileLike?.role]
    .map((value) => String(value || '').trim().toLowerCase())
    .some((value) => ['basic', 'pro', 'premium'].includes(value));
  if (profileLike?.is_subscribed || subscriptionRole || (hasPlan && !['cancelled', 'canceled', 'expired', 'inactive'].includes(planStatus))) return PROFILE_TIERS.premium;
  return PROFILE_TIERS.common;
}

export const AVATAR_IMAGE = require('../assets/images/avatar.png');

const REFERRAL_RANKS = [
  { id: 'director', minReferrals: 500, title: 'Director', icon: 'D', bonus: 10000, color: '#f59e0b', bgColor: '#fffbeb', badgeColor: '#d97706' },
  { id: 'manager', minReferrals: 100, title: 'Manager', icon: 'M', bonus: 2000, color: '#2563eb', bgColor: '#eff6ff', badgeColor: '#1d4ed8' },
  { id: 'leader', minReferrals: 25, title: 'Leader', icon: 'L', bonus: 500, color: '#7c3aed', bgColor: '#f5f3ff', badgeColor: '#6d28d9' },
  { id: 'promoter', minReferrals: 5, title: 'Promoter', icon: 'P', bonus: 100, color: '#16a34a', bgColor: '#f0fdf4', badgeColor: '#15803d' },
  { id: 'starter', minReferrals: 1, title: 'Starter', icon: 'S', bonus: 0, color: '#0f766e', bgColor: '#f0fdfa', badgeColor: '#0d9488' },
  { id: 'member', minReferrals: 0, title: 'Member', icon: 'M', bonus: 0, color: '#64748b', bgColor: '#f8fafc', badgeColor: '#94a3b8' },
];

// Rank Functions
export function getRank(n = 0) {
  return REFERRAL_RANKS.find((r) => n >= r.minReferrals) || REFERRAL_RANKS[REFERRAL_RANKS.length - 1];
}

export function getNextRank(n = 0) {
  const i = REFERRAL_RANKS.findIndex((r) => n >= r.minReferrals);
  return i > 0 ? REFERRAL_RANKS[i - 1] : null;
}

// Code Generation
export function generateReferralCode(_email = '') {
  // Referral code sirf subscription ke baad UserStore/backend se aayega
  return '';
}
export function generateMemberId(email = '') {
  const hash = String(email).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return `RTI${Math.abs(hash).toString(36).toUpperCase().slice(0, 10)}`;
}

// Date Formatting
export function fmt(d = new Date()) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtValidUpto(d = new Date()) {
  const n = new Date(d);
  n.setFullYear(n.getFullYear() + 1);
  return fmt(n);
}

// ✅ FIX: Valid Upto ab profile ke join_date (issue date) se fixed hota hai —
// pehle ye hamesha "aaj + 1 saal" calculate hota tha, isliye har baar card
// dekhne par Valid Upto date aage badhti jaati thi. Ab ek baar fix ho jaati hai.
export function getIssueDate(profile = {}) {
  const raw = profile?.join_date || profile?.created_at;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
}

// Returns a real Date object for Valid Upto (issue date + 1 year) — use this
// wherever you need to compare against "today" (e.g. active/inactive check).
export function getValidUptoDate(profile = {}) {
  const n = new Date(getIssueDate(profile));
  n.setFullYear(n.getFullYear() + 1);
  return n;
}

// true jab tak Valid Upto date nikal na jaaye (aaj Valid Upto se pehle ya usi din tak)
export function isMemberActive(profile = {}) {
  const validUpto = getValidUptoDate(profile);
  const endOfValidDay = new Date(validUpto.getFullYear(), validUpto.getMonth(), validUpto.getDate(), 23, 59, 59, 999);
  return new Date().getTime() <= endOfValidDay.getTime();
}

// Auto-fit font size for the awardee name on certificates — lamba naam ho
// toh font chota ho jaayega taaki ek hi line me certificate ke andar fit ho,
// bahar overflow ya cut na ho.
export function getAwardeeFontSize(name = '', baseSize = 44) {
  const len = String(name || '').trim().length || 1;
  if (len <= 14) return baseSize;
  const shrunk = baseSize * (14 / len);
  const minSize = baseSize * 0.42;
  return Math.round(Math.max(shrunk, minSize));
}

// HTML Escaping
export function esc(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Document Validation
export function hasDocumentSource(p) {
  return Boolean(p?.name?.trim() && p?.email?.trim());
}

// Public profile par email chhupa hota hai, isliye name + (id/email/member_id) kaafi hai.
export function hasPublicDocumentSource(p) {
  return Boolean(p?.name?.trim() && (p?.email?.trim() || p?.id || p?.user_id || p?.member_id));
}

// Safe File Naming
export function safeName(v = 'document') {
  return String(v || '')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Document State Management
export function getDocumentState(v, p) {
  if (v === 'generated') return v;
  if (!hasDocumentSource(p)) return 'incomplete';
  return p?.profile_image && p?.profile_image?.trim() ? 'ready' : 'incomplete';
}

// ✅ NEW: Common (non-subscribed) user kisi bhi premium-locked feature pe click/submit
// kare to yahi function use karo — "Premium Required" dikha ke Subscription Plans bhej dega.
export function requirePremium(user, hasActiveSubscription, showToast, navigation, returnTo) {
  if (hasActiveSubscription(user)) return true;
  showToast('Premium Required', 'error');
  navigation.navigate('Subscription Plans', { returnTo });
  return false;
}

// ── Role / Area / Subscription-name resolvers ────────────────────────────────
// Backend `state_seat.seat_name` kabhi role ka naam hota hai ("Taluka Head") aur kabhi
// jagah ka naam ("Taloje Majkur", "Car Nicobar"). Isliye seat_name ko tabhi ROLE maano
// jab wo asli role-id (SEAT_ID_TO_TIER) ho; warna wo AREA hai.
const slugId = (v = '') => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const humanizeId = (v = '') => String(v || '').replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
const isKnownRoleName = (v = '') => Boolean(SEAT_ID_TO_TIER[slugId(v)]);

export const realPlanName = (n) => {
  const v = String(n || '').trim();
  return v && v.toLowerCase() !== 'subscription plan' ? v : '';
};

// Subscription (plan) ka naam — badge/pill me yehi dikhna chahiye.
export function getSubscriptionName(profile = {}) {
  const plan = profile?.subscription_plan || profile?.active_plan || profile?.role_subscription_plan || null;
  return realPlanName(plan?.plan_name) || realPlanName(plan?.title) || realPlanName(plan?.name)
    || realPlanName(profile?.subscription_name) || realPlanName(profile?.plan_name) || '';
}

// Role naam saaf karo: numeric ids ("6", "6,7") -> mapRoleId se role naam; bacha hua pure number hata do.
export function cleanRoleNames(val, mapRoleId = null) {
  const parts = (Array.isArray(val) ? val : String(val ?? '').split(','))
    .map((x) => String(x ?? '').trim()).filter(Boolean);
  const out = [];
  parts.forEach((x) => {
    if (/^\d+$/.test(x)) {
      const mapped = typeof mapRoleId === 'function' ? String(mapRoleId(x) || '').trim() : '';
      if (mapped) out.push(mapped);
    } else {
      out.push(x);
    }
  });
  return out.join(', ');
}

// ID card ka "Role" — kabhi location ya number nahi. planRoleNames = UserStore se mila purchased role naam (optional).
// mapRoleId(id) = numeric role id ("6") ko role naam me badalne wala function (UserStore se).
export function resolveRoleTitle(profile = {}, planRoleNames = '', mapRoleId = null) {
  const seat = profile?.state_seat || profile?.seat || {};
  const clean = (val) => cleanRoleNames(val, mapRoleId);
  const seatId = seat?.seat_id || profile?.seat_id || '';
  const seatIdTitle = /^\d+$/.test(String(seatId).trim())
    ? clean(seatId)
    : (seatId ? humanizeId(seatId) : '');
  const seatNameAsRole = isKnownRoleName(seat?.seat_name) ? seat.seat_name : '';
  const planIdsTitle = clean(profile?.subscription_plan?.role_id_raw || profile?.subscription_plan?.role_id || '');
  return String(
    clean(profile?.subscription_plan?.role_names) || clean(planRoleNames) || planIdsTitle
    || clean(seat?.role_name) || clean(seat?.designation) || seatIdTitle || seatNameAsRole
    || clean(profile?.role_label) || clean(profile?.author_role_label) || ''
  ).trim();
}

// ID card ka "Area" — village/taluka/district/state, warna seat_name (jab wo jagah ka naam ho).
export function resolveAreaText(profile = {}) {
  const seat = profile?.state_seat || profile?.seat || {};
  const joined = [
    seat?.village ?? profile?.village,
    seat?.taluka ?? profile?.taluka,
    seat?.district ?? profile?.district,
    seat?.state ?? profile?.state,
  ].map((v) => String(v || '').trim()).filter(Boolean).join(', ');
  if (joined) return joined;
  const seatArea = String(seat?.area || seat?.area_name || seat?.location || profile?.area || profile?.author_area || profile?.location || '').trim();
  if (seatArea) return seatArea;
  const sn = String(seat?.seat_name || profile?.seat_name || profile?.author_seat_name || '').trim();
  return sn && !isKnownRoleName(sn) ? sn : '';
}

// ID card / contact me dikhane ke liye mobile number — backend kisi bhi key / nested object me bheje, mil jaayega.
// (pehle sirf kuch fixed keys padhi jaati thi, isliye public profile ke ID card me number gayab rehta tha.)
export function pickPhoneNumber(profile = {}) {
  const p = profile || {};
  const nestedSources = [p, p.user, p.data, p.profile, p.details, p.contact_info, p.contact, p.author, p.owner, p.state_seat, p.seat];
  const KEYS = [
    'phone', 'mobile', 'mobile_number', 'mobileNumber', 'phone_number', 'phoneNumber',
    'contact_number', 'contactNumber', 'contact_no', 'mobile_no', 'phone_no', 'whatsapp', 'whatsapp_number',
    'author_mobile', 'author_phone',
  ];
  const clean = (v) => {
    if (v == null || typeof v === 'object') return '';
    const t = String(v).trim();
    return t.replace(/\D/g, '').length >= 7 ? t : '';
  };
  for (const src of nestedSources) {
    if (!src || typeof src !== 'object') continue;
    for (const k of KEYS) {
      const v = clean(src[k]);
      if (v) return v;
    }
  }
  // last resort: koi bhi key jisme phone/mobile likha ho (email wali keys chhod ke)
  for (const src of nestedSources) {
    if (!src || typeof src !== 'object') continue;
    for (const k of Object.keys(src)) {
      if (/(phone|mobile|whatsapp)/i.test(k) && !/(email|verified|country|code|otp)/i.test(k)) {
        const v = clean(src[k]);
        if (v) return v;
      }
    }
  }
  return '';
}