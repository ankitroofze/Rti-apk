import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const SQLite = Platform.OS === 'web' ? null : require('expo-sqlite');
import {
  DEMO_PLAYBACK_URL,
  DEMO_STREAM_TITLE,
  YOUTUBE_RTMPS_URL,
  YOUTUBE_STREAM_KEY_PLACEHOLDER,
} from '../constants/liveStreamingConfig';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { getAwardeeFontSize } from '../utils/profileHelpers';

const MEDIA_ORIGIN = 'https://rtiapi.roofze.in';
function resolveMediaUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^(https?:|blob:|data:|file:|content:|ph:|asset:)/i.test(value)) return value;
  return `${MEDIA_ORIGIN}/storage/${value.replace(/^\/+/, '')}`;
}

const USERS_KEY        = 'users';
const OTP_KEY          = 'mock_reset_otps';
const CURRENT_USER_KEY = 'current_user_email';
const STATE_SEATS_KEY  = 'state_seat_allocations_v1';
const PENDING_REG_KEY  = 'pending_registration_v1';
let _pendingRegistrationMemory = null; // in-memory backup of pending registration
const NEWS_ACTION_LOG_KEY = 'news_feed_action_log_v1';
const AD_LEAD_SUBMISSIONS_KEY = 'ad_lead_submissions_v1'; // 👈 NEW
const ENGAGEMENT_DB_NAME = 'rti_news_engagement_v1.db';
const ENGAGEMENT_FALLBACK_KEY = 'news_engagement_fallback_v1';

let engagementDbPromise = null;
let engagementDbInitialized = false;

const safeJsonParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};



const readEngagementFallback = async () => {
  const raw = await AsyncStorage.getItem(ENGAGEMENT_FALLBACK_KEY);
  const state = safeJsonParse(raw, {
    likesByPost: {},            // postId -> { [email]: true }
    sharesByPost: {},           // postId -> number
    viewsByPost: {},            // postId -> number
    commentsByPost: {},         // postId -> comment[]
    commentLikesById: {},       // commentId -> { [email]: true }
    bookmarksByPost: {},        // postId -> { [email]: true }
  });

  if (!state || typeof state !== 'object') {
    return {
      likesByPost: {},
      sharesByPost: {},
      viewsByPost: {},
      commentsByPost: {},
      commentLikesById: {},
      bookmarksByPost: {},
    };
  }

state.likesByPost = state.likesByPost && typeof state.likesByPost === 'object' ? state.likesByPost : {};
  state.sharesByPost = state.sharesByPost && typeof state.sharesByPost === 'object' ? state.sharesByPost : {};
  state.viewsByPost = state.viewsByPost && typeof state.viewsByPost === 'object' ? state.viewsByPost : {};
  state.commentsByPost = state.commentsByPost && typeof state.commentsByPost === 'object' ? state.commentsByPost : {};
  state.commentLikesById = state.commentLikesById && typeof state.commentLikesById === 'object' ? state.commentLikesById : {};
  state.bookmarksByPost = state.bookmarksByPost && typeof state.bookmarksByPost === 'object' ? state.bookmarksByPost : {};
  return state;
};

const writeEngagementFallback = async (state) => {
  await AsyncStorage.setItem(ENGAGEMENT_FALLBACK_KEY, JSON.stringify(state || {}));
};

// ✅ NEW: bina-login (guest) like ke liye local storage — login ke baad backend/local user account me migrate hoga
const GUEST_LIKES_KEY = 'guest_pending_likes_v1';

const readGuestLikes = async () => {
  const raw = await AsyncStorage.getItem(GUEST_LIKES_KEY);
  return safeJsonParse(raw, {});
};

const writeGuestLikes = async (state) => {
  await AsyncStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(state || {}));
};

const getEngagementDb = async () => {
  if (Platform.OS === 'web') return null;
  if (!engagementDbPromise) {
    engagementDbPromise = SQLite.openDatabaseAsync(ENGAGEMENT_DB_NAME);
  }
  const db = await engagementDbPromise;
  if (!engagementDbInitialized) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_email)
      );

      CREATE TABLE IF NOT EXISTS post_shares (
        post_id TEXT PRIMARY KEY NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_views (
        post_id TEXT PRIMARY KEY NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL,
        user_email TEXT,
        author TEXT,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        edited_at TEXT,
        parent_comment_id INTEGER,
        deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS comment_likes (
        comment_id INTEGER NOT NULL,
        user_email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (comment_id, user_email),
        FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS post_bookmarks (
        post_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_email)
      );

      CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON post_bookmarks(user_email);
    `);

    // Lightweight migration for older db files.
    try { await db.execAsync('ALTER TABLE post_comments ADD COLUMN parent_comment_id INTEGER'); } catch {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id)'); } catch {}
    engagementDbInitialized = true;
  }
  return db;
};



const upsertCounter = async (db, table, postId) => {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO ${table} (post_id, count, updated_at)
     VALUES (?, 1, ?)
     ON CONFLICT(post_id) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`,
    postId,
    now
  );
};

const getEngagementForPostsSqlite = async (postIds = [], currentEmail = '', focusPostId = null) => {
  const db = await getEngagementDb();
  if (!db || !Array.isArray(postIds) || postIds.length === 0) {
    return { statsByPost: {}, commentsByPost: {} };
  }

  const ids = postIds.filter(Boolean).map((v) => String(v));
  if (ids.length === 0) return { statsByPost: {}, commentsByPost: {} };
  const placeholders = ids.map(() => '?').join(',');

  const likesRows = await db.getAllAsync(
    `SELECT post_id, COUNT(*) AS count
     FROM post_likes
     WHERE post_id IN (${placeholders})
     GROUP BY post_id`,
    ids
  );

  const commentsRows = await db.getAllAsync(
    `SELECT post_id, COUNT(*) AS count
     FROM post_comments
     WHERE deleted = 0 AND post_id IN (${placeholders})
     GROUP BY post_id`,
    ids
  );

  const sharesRows = await db.getAllAsync(
    `SELECT post_id, count
     FROM post_shares
     WHERE post_id IN (${placeholders})`,
    ids
  );

  const viewsRows = await db.getAllAsync(
    `SELECT post_id, count
     FROM post_views
     WHERE post_id IN (${placeholders})`,
    ids
  );

  const bookmarkedRows = currentEmail
    ? await db.getAllAsync(
      `SELECT post_id FROM post_bookmarks WHERE user_email = ? AND post_id IN (${placeholders})`,
      [currentEmail, ...ids]
    )
    : [];

  const likedRows = currentEmail
    ? await db.getAllAsync(
      `SELECT post_id FROM post_likes WHERE user_email = ? AND post_id IN (${placeholders})`,
      [currentEmail, ...ids]
    )
    : [];

  const likedSet = new Set((likedRows || []).map((r) => String(r.post_id)));
  const bookmarkedSet = new Set((bookmarkedRows || []).map((r) => String(r.post_id)));
  const likeMap = new Map((likesRows || []).map((r) => [String(r.post_id), Number(r.count || 0)]));
  const commentCountMap = new Map((commentsRows || []).map((r) => [String(r.post_id), Number(r.count || 0)]));
  const shareMap = new Map((sharesRows || []).map((r) => [String(r.post_id), Number(r.count || 0)]));
  const viewMap = new Map((viewsRows || []).map((r) => [String(r.post_id), Number(r.count || 0)]));

  const statsByPost = {};
  ids.forEach((id) => {
    statsByPost[id] = {
      likes: likeMap.get(id) || 0,
      comments: commentCountMap.get(id) || 0,
      shares: shareMap.get(id) || 0,
      views: viewMap.get(id) || 0,
      likedByCurrentUser: likedSet.has(id),
      bookmarkedByCurrentUser: bookmarkedSet.has(id),
    };
  });

  const commentsByPost = {};
  if (focusPostId) {
    const pid = String(focusPostId);
    const comments = await db.getAllAsync(
      `SELECT id, post_id, user_email, author, text, created_at, edited_at, parent_comment_id
       FROM post_comments
       WHERE post_id = ? AND deleted = 0
       ORDER BY created_at DESC
       LIMIT 300`,
      pid
    );

    const commentIds = (comments || []).map((c) => Number(c.id)).filter((n) => Number.isFinite(n));
    const likedCommentSet = new Set();
    const likesCountMap = new Map();

    if (commentIds.length) {
      const cph = commentIds.map(() => '?').join(',');
      const likeCounts = await db.getAllAsync(
        `SELECT comment_id, COUNT(*) AS count
         FROM comment_likes
         WHERE comment_id IN (${cph})
         GROUP BY comment_id`,
        commentIds
      );
      (likeCounts || []).forEach((r) => likesCountMap.set(Number(r.comment_id), Number(r.count || 0)));

      if (currentEmail) {
        const likedComments = await db.getAllAsync(
          `SELECT comment_id FROM comment_likes WHERE user_email = ? AND comment_id IN (${cph})`,
          [currentEmail, ...commentIds]
        );
        (likedComments || []).forEach((r) => likedCommentSet.add(Number(r.comment_id)));
      }
    }

    const normalized = (comments || []).map((c) => {
      const commentId = Number(c.id);
      const created = c.created_at ? new Date(c.created_at) : null;
      return {
        id: `cmt-${commentId}`,
        text: String(c.text || '').trim(),
        author: String(c.author || 'User'),
        author_email: String(c.user_email || ''),
        date: created ? created.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
        edited_at: c.edited_at || null,
        likes: likesCountMap.get(commentId) || 0,
        liked_by: likedCommentSet.has(commentId) && currentEmail ? [currentEmail] : [],
        parent_comment_id: Number.isFinite(Number(c.parent_comment_id)) ? Number(c.parent_comment_id) : null,
      };
    });

    const byId = new Map(normalized.map((c) => [c.id, c]));
    const topLevel = [];
    normalized.forEach((c) => {
      const parentId = c.parent_comment_id;
      if (!parentId) { topLevel.push({ ...c, replies: [] }); return; }
      const parentKey = `cmt-${parentId}`;
      const parent = byId.get(parentKey);
      if (!parent) { topLevel.push({ ...c, replies: [] }); return; }
    });

    // Attach replies (second pass) using a map of top-level items.
    const topMap = new Map(topLevel.map((c) => [c.id, c]));
    normalized.forEach((c) => {
      const parentId = c.parent_comment_id;
      if (!parentId) return;
      const parentKey = `cmt-${parentId}`;
      const parent = topMap.get(parentKey);
      if (!parent) return;
      parent.replies = Array.isArray(parent.replies) ? parent.replies : [];
      parent.replies.push({ ...c });
    });

    // Keep newest-first for top-level and replies.
    topLevel.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    topLevel.forEach((c) => {
      if (Array.isArray(c.replies)) c.replies.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    });

    commentsByPost[pid] = topLevel;
  }

  return { statsByPost, commentsByPost };
};

const getEngagementForPostsFallback = async (postIds = [], currentEmail = '', focusPostId = null) => {
  const state = await readEngagementFallback();
  const ids = (postIds || []).filter(Boolean).map((v) => String(v));

  const statsByPost = {};
  ids.forEach((id) => {
    const likesMap = state.likesByPost?.[id] || {};
    const likedByCurrentUser = Boolean(currentEmail && likesMap[currentEmail]);
    const bookmarksMap = state.bookmarksByPost?.[id] || {};
    const bookmarkedByCurrentUser = Boolean(currentEmail && bookmarksMap[currentEmail]);
    statsByPost[id] = {
      likes: Object.keys(likesMap).length,
      comments: Array.isArray(state.commentsByPost?.[id]) ? state.commentsByPost[id].length : 0,
      shares: Number(state.sharesByPost?.[id] || 0),
      views: Number(state.viewsByPost?.[id] || 0),
      likedByCurrentUser,
      bookmarkedByCurrentUser,
    };
  });

  const commentsByPost = {};
  if (focusPostId) {
    const pid = String(focusPostId);
    const list = Array.isArray(state.commentsByPost?.[pid]) ? state.commentsByPost[pid] : [];
    const normalized = list.map((c) => ({
      ...c,
      liked_by: Array.isArray(c.liked_by) ? c.liked_by : [],
      parent_comment_id: c.parent_comment_id || null,
    }));

    const byId = new Map(normalized.map((c) => [String(c.id), c]));
    const topLevel = [];
    normalized.forEach((c) => {
      const parent = c.parent_comment_id ? String(c.parent_comment_id) : '';
      if (!parent) { topLevel.push({ ...c, replies: [] }); return; }
      const parentComment = byId.get(parent);
      if (!parentComment) topLevel.push({ ...c, replies: [] });
    });

    const topMap = new Map(topLevel.map((c) => [String(c.id), c]));
    normalized.forEach((c) => {
      const parent = c.parent_comment_id ? String(c.parent_comment_id) : '';
      if (!parent) return;
      const parentComment = topMap.get(parent);
      if (!parentComment) return;
      parentComment.replies = Array.isArray(parentComment.replies) ? parentComment.replies : [];
      parentComment.replies.push({ ...c });
    });

    commentsByPost[pid] = topLevel;
  }

  return { statsByPost, commentsByPost };
};
const STATE_SEAT_ROLES = [
  // National Level
  { id: 'chief_editor_published',         name: 'Chief Editor / Publisher',        level: 'national' },
  { id: 'executive_editor',               name: 'Executive Editor',                level: 'national' },
  { id: 'deputy_editor_national',         name: 'Deputy Editor (National)',        level: 'national' },
  { id: 'public_relations_officer',       name: 'Public Relations Officer (PRO)',  level: 'national' },
  { id: 'national_bureau_chief',          name: 'National Bureau Chief',           level: 'national' },
  // State Level
  { id: 'state_chief_editor',             name: 'State Chief Editor',              level: 'state' },
  { id: 'state_bureau_chief',             name: 'State Bureau Chief',              level: 'state' },
  { id: 'state_coordinator',              name: 'State Coordinator',               level: 'state' },
  { id: 'senior_state_correspondent',     name: 'Senior State Correspondent',      level: 'state' },
  { id: 'special_state_reporter',         name: 'Special State Reporter',          level: 'state' },
  // District Level
  { id: 'district_head',                  name: 'District Head',                   level: 'district' },
  { id: 'district_bureau_chief',          name: 'District Bureau Chief',           level: 'district' },
  { id: 'district_correspondent',         name: 'District Correspondent',          level: 'district' },
  { id: 'senior_district_reporter',       name: 'Senior District Reporter',        level: 'district' },
  { id: 'district_coordinator',           name: 'District Coordinator',            level: 'district' },
  // Taluka Level
  { id: 'taluka_head',                    name: 'Taluka Head',                     level: 'taluka' },
  { id: 'taluka_correspondent',           name: 'Taluka Correspondent',            level: 'taluka' },
  { id: 'sub_reporter',                   name: 'Sub-Reporter',                    level: 'taluka' },
  { id: 'taluka_representative',          name: 'Taluka Representative',           level: 'taluka' },
  { id: 'regional_reporter',              name: 'Regional Reporter',               level: 'taluka' },
  // Village Level
  { id: 'village_correspondent',          name: 'Village Correspondent',           level: 'village' },
  { id: 'village_representative',         name: 'Village Representative',          level: 'village' },
  { id: 'village_reporter',               name: 'Village Reporter',                level: 'village' },
  { id: 'public_communication_associate', name: 'Public Communication Associate',  level: 'village' },
  { id: 'rural_reporter',                 name: 'Rural Reporter',                  level: 'village' },
];

// ✅ NEW: backend jo numeric role_id (1-6) plan ke saath bhejta hai, wo isi se
// STATE_SEAT_ROLES ke seat se match hota hai — purchase karte hi seat auto-assign hogi
const PLAN_ROLE_ID_TO_SEAT_ID = {
  '1': 'chief_editor_published',
  '2': 'executive_editor',
  '3': 'deputy_editor_national',
  '4': 'public_relations_officer',
  '5': 'national_bureau_chief',
  '6': 'state_chief_editor',
  '7': 'state_bureau_chief',
  '8': 'state_coordinator',
  '9': 'senior_state_correspondent',
  '10': 'special_state_reporter',
  '11': 'district_head',
  '12': 'district_bureau_chief',
  '13': 'district_correspondent',
  '14': 'senior_district_reporter',
  '15': 'district_coordinator',
  '16': 'taluka_head',
  '17': 'taluka_correspondent',
  '18': 'sub_reporter',
  '19': 'taluka_representative',
  '20': 'regional_reporter',
  '21': 'village_correspondent',
  '22': 'village_representative',
  '23': 'village_reporter',
  '24': 'public_communication_associate',
  '25': 'rural_reporter',
};
// eslint-disable-next-line import/namespace
const certificateDirectory = FileSystem['documentDirectory'];
const CERTIFICATE_DIR = certificateDirectory
  ? `${certificateDirectory}certificates/`
  : null;

const getRoleFromPlanId = (planId = '') => {
  const id = String(planId).toLowerCase();
  if (id === 'plan-premium') return 'premium';
  if (id === 'plan-pro')     return 'pro';
  if (id === 'plan-basic')   return 'basic';
  return 'free';
};

const ROLE_LABELS = {
  free:    'Free Member',
  basic:   'Basic Member',
  pro:     'Pro Member',
  premium: 'Premium Member',
};

const getRoleLabel = (role = 'free') => ROLE_LABELS[role] || 'Free Member';

// 5-level referral commission config — final % rate aap/business team decide kare
const COMMISSION_LEVELS = [
  { level: 1, rate: 0.10 },
  { level: 2, rate: 0.05 },
  { level: 3, rate: 0.03 },
  { level: 4, rate: 0.02 },
  { level: 5, rate: 0.01 },
];

// Sirf Verified Blue Tick / Approved Representative hi commission earn kar sakta hai
const isCommissionEligible = (user) => Boolean(hasBlueTick(user) || user.is_approved_representative);

const RANK_TIERS = [
  { rank: 'Director',  min: 500, bonus: 10000 },
  { rank: 'Manager',   min: 100, bonus: 2000  },
  { rank: 'Leader',    min: 25,  bonus: 500   },
  { rank: 'Promoter',  min: 5,   bonus: 100   },
  { rank: 'Starter',   min: 1,   bonus: 0     },
  { rank: 'Member',    min: 0,   bonus: 0     },
];

const calculateRank = (referralCount = 0) => {
  const tier = RANK_TIERS.find((t) => referralCount >= t.min);
  return tier ? tier.rank : 'Member';
};

const getReferralTier = (referralCount = 0) => (
  RANK_TIERS.find((t) => Number(referralCount || 0) >= t.min) || RANK_TIERS[RANK_TIERS.length - 1]
);

const getNextReferralTier = (referralCount = 0) => {
  const current = Number(referralCount || 0);
  const ascending = [...RANK_TIERS].reverse();
  return ascending.find((tier) => tier.min > current) || null;
};

const normalizeIndianMobileNumber = (value = '') => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(0, 10);
};

const isValidIndianMobileNumber = (value = '') => /^[6-9]\d{9}$/.test(normalizeIndianMobileNumber(value));

const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RTI-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const generateUniqueReferralCode = (existingUsers = []) => {
  const usedCodes = new Set(existingUsers.map((u) => u.my_referral_code).filter(Boolean));
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode();
    attempts++;
  } while (usedCodes.has(code) && attempts < 100);
  return code;
};

const defaultWalletTransactions = [
  {
    id:     'txn-welcome-credit',
    amount: 500,
    type:   'credit',
    source: 'bonus',
    date:   '2026-03-24',
  },
];

// const defaultSubscriptionPlans = [
//   {
//     plan_id:   'plan-basic',
//     plan_name: 'Basic Access',
//     price:     199,
//     duration:  '30 Days',
//     features:  ['News Feed', 'e-Paper', 'Notifications'],
//     role:      'basic',
//   },
//   {
//     plan_id:   'plan-pro',
//     plan_name: 'Pro Access',
//     price:     499,
//     duration:  '90 Days',
//     features:  ['News Feed', 'e-Paper', 'Live Streaming', 'Wallet', 'Certification'],
//     role:      'pro',
//   },
//   {
//     plan_id:   'plan-premium',
//     plan_name: 'Premium Access',
//     price:     899,
//     duration:  '180 Days',
//     features:  ['All Features', 'Priority Support', 'Certificate Download', 'Referral Bonus'],
//     role:      'premium',
//   },
// ];


let cachedBackendPlans = [];
let roleLookupPlans = []; // bina user-filter wali poori plans list (active plan ka naam/price/roles dhoondhne ke liye)

// ✅ FIX: role ab plan ke NAME se decide hoga (numeric id se nahi), kyunki backend id har baar alag ho sakti hai
const getRoleFromPlanName = (planName = '') => {
  const name = String(planName).toLowerCase();
  if (name.includes('premium')) return 'premium';
  if (name.includes('pro'))     return 'pro';
  if (name.includes('basic'))   return 'basic';
  return 'free';
};


const normalizeBackendPlan = (raw = {}) => {
  const locationLabel = [raw.taluka, raw.district, raw.state].filter(Boolean).join(', ');
  const planName = raw.title || raw.plan_name || raw.name || locationLabel || `Plan #${raw.id}`;

  const basePrice = Number(raw.price ?? 0);
  const offerPrice = raw.offer_price !== undefined && raw.offer_price !== null
    ? Number(raw.offer_price)
    : null;
  // ✅ offer_price hi asli chargeable price hai agar mojood hai
  const finalPrice = (offerPrice !== null && !Number.isNaN(offerPrice)) ? offerPrice : basePrice;

  return {
    plan_id:      raw.id ?? raw.plan_id,          // ✅ real backend numeric id
    plan_name:    planName,
    price:        finalPrice,
    original_price: (offerPrice !== null && offerPrice !== basePrice) ? basePrice : null,
    duration:     raw.days ? `${raw.days} Days` : (raw.duration || ''),
    credits:      Number(raw.credits ?? 0),
    state:        raw.state || '',
    district:     raw.district || '',
   taluka:       raw.taluka || '', village:      raw.village || '',
    description:  raw.description || '',
role_id_raw:  raw.role_id || '',               // ✅ comma-separated multi-role id, ab handled
    validity_days: Number(raw.days || raw.validity_days || 30),
    // ✅ Sold flag — sirf tab true hoga jab backend plans list me ye field bheje
    // (is_sold / sold / is_taken / seat_taken / is_available:false). Warna false.
        is_sold: [raw.is_sold, raw.sold, raw.is_taken, raw.seat_taken].some((v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true') || raw.is_available === false || raw.is_available === 0 || raw.is_available === '0',
    features:     Array.isArray(raw.features) ? raw.features : [],
    // ✅ FIX: plan ke naam se hi role decide hoga (premium/pro/basic/free) — jo plan buy karoge wahi role milega
    role:         getRoleFromPlanName(planName),
    is_premium:   Boolean(raw.is_premium),
  };
};

// ✅ FIX (Issue #1): admin ne jis state/district/taluka ke liye plan banaya
// hai, wahi plan sirf usi state+district+taluka wale user ko dikhna chahiye.
// Agar admin ne koi field khaali chhodi hai to us level par restriction nahi maani jayegi.
const locationFieldMatches = (planValue = '', userValue = '') => {
  const plan = String(planValue || '').trim().toLowerCase();
  if (!plan) return true; // admin ne field set nahi ki -> is level pe restriction nahi
  return plan === String(userValue || '').trim().toLowerCase();
};

const planMatchesUserLocation = (plan, user) => {
  if (!plan) return false;
  return (
    locationFieldMatches(plan.state, user?.state) &&
    locationFieldMatches(plan.district, user?.district) &&
    locationFieldMatches(plan.taluka, user?.taluka)
  );
};

/// ✅ NEW: backend comment object -> app ke comment shape.  `me` = current user (liked_by / author_email sync ke liye)
const mapApiCommentToLocal = (raw = {}, me = null) => {
  const authorObj = raw.user || raw.author || {};
  const myEmail = String(me?.email || '').trim().toLowerCase();
  const isMine = Boolean(raw.is_mine);
  const likedByMe = Boolean(raw.liked_by_me);
  return {
    id: raw.id ? `cmt-${raw.id}` : `cmt-${Date.now()}`,
    text: String(raw.comment ?? raw.sub_comment ?? raw.text ?? '').trim(),
    author: authorObj.name || raw.author_name || raw.user_name || 'User',
    author_email: String(authorObj.email || raw.author_email || raw.email || (isMine ? myEmail : '')).trim().toLowerCase(),
    author_id: authorObj.id != null ? String(authorObj.id) : (raw.user_id != null ? String(raw.user_id) : ''),
    author_avatar: authorObj.profile_image_url || '',
    author_has_blue_tick: Boolean(authorObj.has_blue_tick || raw.author_has_blue_tick || raw.has_blue_tick || hasBlueTick(authorObj)),
    date: raw.created_at ? new Date(raw.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    // backend ka `is_edited` use karo; purane response me ye field nahi hota to purana logic
    edited_at: raw.is_edited !== undefined
      ? (raw.is_edited ? (raw.updated_at || new Date().toISOString()) : null)
      : (raw.updated_at && raw.updated_at !== raw.created_at ? raw.updated_at : null),
    likes: Number(raw.likes_count ?? raw.likes ?? 0),
    liked_by: likedByMe && myEmail ? [myEmail] : [],
    liked_by_me: likedByMe,
    is_mine: isMine,
    replies_count: Number(raw.replies_count || 0),
    parent_comment_id: raw.parent_id || raw.parent_comment_id || raw.parent_comment || raw.reply_to || raw.parent?.id
      || (raw.comment_id && String(raw.comment_id) !== String(raw.id) ? raw.comment_id : null) || null,
  };
};

// ✅ NEW: reply ka id comment id se clash na kare isliye `rpl-` prefix. rpl-id -> parent comment id yaha yaad rakhte hain.
const REPLY_PARENT_MAP = new Map();
const mapApiReplyToLocal = (raw = {}, me = null) => {
  const base = mapApiCommentToLocal({ ...raw, id: null, comment: raw.reply, comment_id: null }, me);
  const id = raw.id ? `rpl-${raw.id}` : `rpl-${Date.now()}`;
  if (raw.id && raw.comment_id) REPLY_PARENT_MAP.set(id, String(raw.comment_id));
  return { ...base, id, replies_count: 0, parent_comment_id: raw.comment_id ?? null, is_reply: true };
};

// ✅ NEW: 'cmt-12' / 'rpl-5' / 12 -> { kind, id }
const parseCommentRef = (value) => {
  const s = String(value ?? '').trim();
  if (s.startsWith('rpl-')) return { kind: 'reply', id: Number(s.slice(4)) };
  return { kind: 'comment', id: s.startsWith('cmt-') ? Number(s.slice(4)) : Number(s) };
};

// Backend kabhi replies parent ke andar (replies/sub_comments/children) bhejta hai, kabhi flat.
// Dono ko ek flat list me badal do, nested ke liye parent_id khud laga do.
const flattenApiComments = (rawList = []) => {
  const map = new Map();
  const order = [];
  const walk = (list, parentId = null) => {
    (Array.isArray(list) ? list : []).forEach((c) => {
      if (!c) return;
      const key = c.id != null ? String(c.id) : `anon-${order.length}`;
      const hasParent = Boolean(c.parent_id || c.parent_comment_id);
      if (map.has(key)) {
        const existing = map.get(key);
        if (parentId && !(existing.parent_id || existing.parent_comment_id)) existing.parent_id = parentId;
      } else {
        const item = { ...c };
        if (parentId && !hasParent) item.parent_id = parentId;
        map.set(key, item);
        order.push(key);
      }
      walk(c.replies || c.sub_comments || c.children || c.subComments, c.id ?? parentId);
    });
  };
  walk(rawList);
  return order.map((key) => map.get(key));
};

// ✅ NEW: flat comment list ko top-level + replies tree me convert karta hai
const buildCommentTreeFromApi = (rawList = [], { sort = true, me = null } = {}) => {
  if (__DEV__) console.log('[COMMENTS-RAW]', JSON.stringify((Array.isArray(rawList) ? rawList : []).slice(0, 8)));
  const normalized = flattenApiComments(rawList).map((c) => mapApiCommentToLocal(c, me));
  const topLevel = normalized.filter((c) => !c.parent_comment_id).map((c) => ({ ...c, replies: [] }));
  const topMap = new Map(topLevel.map((c) => [c.id, c]));

  normalized.forEach((c) => {
    if (!c.parent_comment_id) return;
    const parentKey = `cmt-${c.parent_comment_id}`;
    const parent = topMap.get(parentKey);
    if (parent) parent.replies.push({ ...c });
    else topLevel.push({ ...c, replies: [] }); // orphan reply, top-level dikha do
  });

   if (sort) {
    topLevel.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    topLevel.forEach((c) => c.replies.sort((a, b) => String(b.id).localeCompare(String(a.id))));
  }
  return topLevel;
};

// ✅ NEW: ek post ke comments backend se fetch karta hai (GET /comments/{newsId})
const fetchBackendCommentsForPost = async (postId) => {
  try {
    const me = await UserStore.getCurrentUser().catch(() => null);
    const res = await AuthAPI.getCommentsDetailed(postId);
    if (!res.ok || !Array.isArray(res.comments)) return [];
    const tree = buildCommentTreeFromApi(res.comments, { sort: false, me });
    // detail screens ko nested replies chahiye — jin comments par replies hain unki pehli page laao
    await Promise.all(
      tree.filter((c) => c.replies_count > 0).map(async (c) => {
        const r = await AuthAPI.getReplies(String(c.id).replace('cmt-', ''));
        if (r.ok) c.replies = r.replies.map((x) => mapApiReplyToLocal(x, me));
      })
    );
    return tree;
  } catch {
    return [];
  }
};

const normalizeEcomDetail = (raw = {}) => {
  const owner = raw.user || raw.owner || {};
  const rawImages = Array.isArray(raw.images) ? raw.images : (raw.image ? [raw.image] : []);
  return {
    id: raw.id,
    ecom_sub_id: raw.ecom_sub_id || raw.category_id || '',
    title: raw.product_name || raw.title || 'E-Commerce Product',
    sector: raw.category || '',
    category: raw.category || '',
    description: raw.description || '',
    quantity: String(raw.quantity ?? ''),
    price: String(raw.price ?? ''),
    city: raw.city || '',
    contact: raw.conatct || raw.contact || '',
    start_date: raw.start_date || '',
    end_date: raw.end_date || '',
    status: Number(raw.status ?? 1),
 mediaItems: rawImages.map((img) => ({
      uri: typeof img === 'string' ? img : (img?.url || img?.path || ''),
      type: 'image',
    })).filter((m) => m.uri),
    createdBy: String(raw.user_id || owner.email || '').trim().toLowerCase(),
    owner_email: String(owner.email || '').trim().toLowerCase(),
    owner_name: owner.name || raw.author_name || 'Seller',
    owner_profile_image: owner.profile_image || '',
    owner_has_blue_tick: Boolean(owner.has_blue_tick || raw.owner_has_blue_tick || hasBlueTick(owner)),
    createdAt: raw.created_at || '',
    updatedAt: raw.updated_at || '',
  };
};

const defaultActiveSubscription = {
  plan_id:   'plan-basic',
  plan_name: 'Basic Access',
  price:     199,
  duration:  '30 Days',
};

// ✅ FIX: purana guess-based ID mapping (1,2,3) hata diya — ab plan_id backend ka real numeric id hai,
// isliye direct use hoga, extra mapping ki zaroorat nahi
const getBackendPlanId = (planId) => {
  const numeric = Number(planId);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const getLocalPlanIdFromBackendId = (backendPlanId) => {
  const numeric = Number(backendPlanId);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const defaultEPapers = [
  { id: 'epaper-1', title: 'RTI News - 24 March 2026', pdf_file: 'https://rti-news.local/papers/rti-news-2026-03-24.pdf', publish_date: '2026-03-24', views: 54, downloads: 18 },
  { id: 'epaper-2', title: 'RTI News - 23 March 2026', pdf_file: 'https://rti-news.local/papers/rti-news-2026-03-23.pdf', publish_date: '2026-03-23', views: 47, downloads: 13 },
  { id: 'epaper-3', title: 'RTI News - 22 March 2026', pdf_file: 'https://rti-news.local/papers/rti-news-2026-03-22.pdf', publish_date: '2026-03-22', views: 39, downloads: 10 },
];

const defaultStreams = [];

// ✅ NEW: Quiz result tier logic — 40% se neeche Fail (certificate nahi),
// 40-54% Pass (Learner badge), 55-79% Good (Aware badge), 80-100% Excellent (Expert badge)
const getQuizResultTier = (percentage = 0) => {
  const pct = Number(percentage) || 0;
  if (pct < 40) return { passed: false, result_type: 'Fail', badge_label: null };
  if (pct <= 54) return { passed: true, result_type: 'Pass', badge_label: 'Learner' };
  if (pct <= 79) return { passed: true, result_type: 'Good', badge_label: 'Aware' };
  return { passed: true, result_type: 'Excellent', badge_label: 'Expert' };
};

const defaultCertifications = [
  {
    id: 'cert-1', quiz_title: 'RTI Basics',
    questions: [
      { question: 'What does RTI stand for?', options: { A: 'Right to Information', B: 'Right to Income', C: 'Right to Integrity', D: 'None of the above' } },
      { question: 'Within how many days must RTI response be given?', options: { A: '15 days', B: '30 days', C: '45 days', D: '60 days' } },
      { question: 'Who can file an RTI?', options: { A: 'Only lawyers', B: 'Any Indian citizen', C: 'Only government employees', D: 'Journalists only' } },
    ],
    score: 78, result_type: 'Good', certificate_file: null, attempts: 1, downloads: 2,
  },
  {
    id: 'cert-2', quiz_title: 'RTI Advanced',
    questions: [
      { question: 'Which authority handles RTI appeals?', options: { A: 'District Court', B: 'Central Information Commission', C: 'Supreme Court', D: 'High Court' } },
      { question: 'What is the RTI fee for BPL cardholders?', options: { A: 'Rs. 10', B: 'Rs. 50', C: 'Free', D: 'Rs. 100' } },
    ],
    score: 42, result_type: 'Fail', certificate_file: null, attempts: 1, downloads: 0,
  },
];

const defaultNotifications = [
  { id: 'notif-1', title: 'Welcome to RTI News',     message: 'Your account setup is complete and modules are ready to use.', date: '2026-03-24', status: 'Unread' },
  { id: 'notif-2', title: 'Wallet Bonus Added',       message: 'Welcome bonus has been credited to your wallet successfully.',  date: '2026-03-24', status: 'Read'   },
  { id: 'notif-3', title: 'Profile Update Reminder',  message: 'Complete your profile details to unlock better visibility.',    date: '2026-03-23', status: 'Unread' },
];

const defaultSettings = { language: 'English', password: '' };

// ─── Normalizers ──────────────────────────────────────────────────────────────

const getWalletTransactionSortValue = (transaction = {}) => {
  const idValue   = Number(String(transaction.id || '').replace(/\D/g, '')) || 0;
  const dateValue = new Date(transaction.date || 0).getTime();
  return Number.isFinite(dateValue) && dateValue > 0 ? dateValue + idValue : idValue;
};

const normalizeWalletTransactions = (transactions = []) => {
  if (!Array.isArray(transactions) || !transactions.length) return defaultWalletTransactions;
  return transactions
    .map((t, i) => ({
      id:     t.id     || `txn-${i + 1}`,
      amount: Number(t.amount || t.credit || 0),
      type:   t.type   || (Number(t.credit || 0) > 0 ? 'credit' : 'debit'),
      source: `${t.source || t.transaction_type || 'commission'}${String(t.status || '').toLowerCase() === 'pending' ? ' (Pending)' : ''}`,
      date:   t.date   || '2026-03-24',
    }))
    .sort((a, b) => getWalletTransactionSortValue(b) - getWalletTransactionSortValue(a));
};

const normalizeWithdrawRequests = (requests = []) => {
  if (!Array.isArray(requests)) return [];
  return requests.map((r, i) => ({
    id:                  r.id                  || `withdraw-${i + 1}`,
    amount:              Number(r.amount       || 0),
    payment_mode:        r.payment_mode || r.method || 'bank',
    account_holder_name: r.account_holder_name || '',
    bank_name:           r.bank_name      || '',
    account_number:      r.account_number || '',
    ifsc:                r.ifsc_code || r.ifsc || '',
    ifsc_code:           r.ifsc_code || r.ifsc || '',
    upi_id:              r.upi_id         || '',
    pan_number:          r.pan_number     || '',
    status:              r.status         || 'pending',
    payout_reference:    r.payout_reference || null,
    rejection_reason:    r.rejection_reason || null,
    date:                r.date || r.created_at || '2026-03-24',
  }));
};
const normalizeSubscription = (s = {}) => ({
  plan_id:   s.plan_id   || defaultActiveSubscription.plan_id,
  plan_name: s.plan_name || defaultActiveSubscription.plan_name,
  price:     Number(s.price ?? defaultActiveSubscription.price),
  duration:  s.duration  || defaultActiveSubscription.duration,
  features:  Array.isArray(s.features) ? s.features : [],
  credits:   Number(s.credits ?? 0),
  role:      s.role      || getRoleFromPlanId(s.plan_id),
   purchased_at: s.purchased_at || null,
  role_id_raw:  s.role_id_raw  || '',
  validity_days: s.validity_days || undefined,
    expires_at:   s.expires_at   || null,
  is_premium:   Boolean(s.is_premium),
});
const normalizeSubscriptionPlan = (plan) => {
  if (!plan || (!plan.plan_id && !plan.plan_name)) return null;
  return normalizeSubscription(plan);
};

const normalizeComments = (comments = []) => {
  if (!Array.isArray(comments)) return [];
  return comments.map((c, i) => {
    const likedBy = Array.isArray(c.liked_by) ? c.liked_by : [];
    const likes = Number(c.likes ?? likedBy.length) || 0;
    return {
      id: c.id || `cmt-${i + 1}`,
      text: String(c.text || '').trim(),
      author: c.author || c.author_name || 'User',
      author_email: c.author_email || c.email || c.authorEmail || '',
      date: c.date || '2026-03-24',
      edited_at: c.edited_at || null,
      parent_comment_id: c.parent_comment_id || c.parentCommentId || null,
      liked_by: likedBy,
      likes,
      replies: normalizeComments(c.replies),
    };
  });
};

const decodeHtmlEntities = (value = '') =>
  String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

const cleanRichTextToPlain = (value = '') =>
  decodeHtmlEntities(
    String(value || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>\s*<div>/gi, '\n')
      .replace(/<\/p>\s*<p>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

const normalizeNewsFeed = (items = []) => {
  const src = Array.isArray(items) && items.length ? items : [];
  return src.map((item, i) => ({
      id:          item.id          || `news-${i + 1}`,
    type:        Number(item.type) === 2 ? 2 : 1,
    createdBy:   String(item.createdBy || item.created_by || '').trim().toLowerCase(),
    // ✅ FIX: author_id (mapApiNewsToFeedItem se aata hai) pehle yahan drop ho
    // jaata tha — isliye NewsFeedCard se profile pe navigate karte waqt userId
    // hamesha null jaata tha aur follow API target id resolve nahi kar paata tha.
    author_id:   item.author_id ?? item.authorId ?? null,
    author_email: String(item.author_email || '').trim().toLowerCase(),
    title:       cleanRichTextToPlain(item.title || '') || 'News Update',
    description: cleanRichTextToPlain(item.description || item.subtitle || ''),
    subtitle:    cleanRichTextToPlain(item.subtitle || ''),
    media:       item.media || (item.mediaType === 'Image'
      ? `${item.images?.length || 0} image(s)`
      : item.mediaType === 'Video' ? 'video attached'
      : item.mediaType === 'File' ? (item.file?.name ? `file: ${item.file.name}` : 'file attached')
      : 'no media'),
    category:    item.category || item.state || 'General',
    report_type: item.report_type || item.category || '',
    language:    String(item.language || item.lang || item.news_language || '').trim().toLowerCase(),
    mediaType:   item.mediaType || 'None',
    state:       item.state || item.category || 'General',
    district:    item.district || '',
    taluka:      item.taluka || '',
    author_name: item.author_name || item.createdByName || item.createdBy || 'RTI News',
    author_profile_image: item.author_profile_image || item.authorProfileImage || item.createdByProfileImage || item.profile_image || '',
    author_subscription_plan: item.author_subscription_plan || item.authorSubscriptionPlan || null,
    author_subscription_type: item.author_subscription_type || item.authorSubscriptionType || '',
    author_has_blue_tick: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick || false),
    author_is_premium: Boolean(item.author_is_premium || item.createdByPremium || false),
    author_is_subscriber: Boolean(item.author_is_subscriber || item.author_is_premium || item.createdBySubscriber || false),
    author_role: item.author_role || item.authorRole || item.createdByRole || '',
    author_role_label: item.author_role_label || item.authorRoleLabel || item.createdByRoleLabel || '',
    author_seat_id: String(item.author_seat_id || item.authorSeatId || item.createdBySeatId || '').trim(),
    author_seat_name: String(item.author_seat_name || item.authorSeatName || item.createdBySeatName || '').trim(),
        liked_by:    Array.isArray(item.liked_by) ? item.liked_by : [],
    liked_by_me: item.liked_by_me === undefined ? undefined : Boolean(item.liked_by_me),
    latest_comments: Array.isArray(item.latest_comments) ? item.latest_comments : [],
    comments_list: normalizeComments(item.comments_list),
    images:      Array.isArray(item.images) ? item.images : [],
    video:       item.video || null,
    file:        item.file || null,
    date:        item.date        || '2026-03-24',
    createdAt:   item.createdAt || item.created_at || item.date || '',
    views:       Number(item.views  || 0),
    shares:      Number(item.shares || 0),
    likes:       Number(item.likes  || 0),
    comments:    Number(item.comments ?? (Array.isArray(item.comments_list) ? item.comments_list.length : 0)),
  }));
};

// ─────────────────────────────────────────────────────────
// Backend /news response ko feed item shape me convert karta hai.
// Laravel field names (tittle, sub_tittle, report_type, media_type, media)
// ko app ke expected fields (title, description, category, mediaType) me map karta hai.
// ─────────────────────────────────────────────────────────
// ✅ NEW: backend ki date kisi bhi shape me aaye (string / number / object), hamesha string banao.
// Isse "[object Object]" kabhi UI tak nahi pahunchega.
const toSafeDateString = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  if (typeof value === 'number') {
    const d = new Date(value < 1e12 ? value * 1000 : value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  if (typeof value === 'object') {
    const inner = value.date ?? value.iso ?? value.$date ?? value.created_at ?? value.value ?? value.timestamp;
    if (inner != null && inner !== value) return toSafeDateString(inner);
    const firstDateLike = Object.values(value).find((v) => typeof v === 'string' && !Number.isNaN(new Date(v).getTime()));
    return firstDateLike || '';
  }
  return '';
};

const mapApiNewsToFeedItem = (apiItem = {}) => {
  const author = apiItem.user || apiItem.author || {};
  const authorSeat = author.state_seat || author.seat || {};
  const mediaTypeRaw = apiItem.media_type ?? apiItem.mediaType ?? 0;
  const mediaTypeMap = { 0: 'None', 1: 'Image', 2: 'Video', 3: 'File' };
  const mediaType = mediaTypeMap[Number(mediaTypeRaw)] || 'None';
   const mediaUrl = apiItem.media_url || apiItem.media || '';

  // ✅ FIX: multiple images — pehli image (media_url) + baaki sab images (backend kisi bhi
  // key me bheje: images / news_images / media_images ...), duplicate hata ke ek list banao.
  const imageUrlOf = (x) => {
    if (!x) return '';
    if (typeof x === 'string') return x.trim();
    return String(x.url || x.image_url || x.media_url || x.image || x.path || x.file || x.src || '').trim();
  };
  const collectedImages = [];
  const pushImage = (x) => {
    const u = resolveMediaUrl(imageUrlOf(x));
    if (u && !collectedImages.includes(u)) collectedImages.push(u);
  };
  if (mediaType === 'Image') {
    pushImage(mediaUrl);
    [
      apiItem.images, apiItem.news_images, apiItem.media_images, apiItem.extra_images,
      apiItem.gallery, apiItem.photos, apiItem.media_urls, apiItem.medias, apiItem.media_files,
    ].forEach((src) => {
      if (Array.isArray(src)) {
        src.forEach(pushImage);
      } else if (typeof src === 'string' && src.trim().startsWith('[')) {
        try { JSON.parse(src).forEach(pushImage); } catch { /* ignore */ }
      }
    });
  }

  // 🔍 TEMP DEBUG — pehli 3 news ka raw data console me (images/date kaisa aa raha hai dekhne ke liye)
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    globalThis.__newsRawLog = (globalThis.__newsRawLog || 0) + 1;
    if (globalThis.__newsRawLog <= 3) {
      console.log('[DEBUG news raw]', apiItem.id, 'keys:', Object.keys(apiItem).join(','),
        '| media_url:', apiItem.media_url, '| images:', JSON.stringify(apiItem.images),
        '| created_at:', JSON.stringify(apiItem.created_at), '| final images:', collectedImages.length);
    }
  }

  return {
       id: apiItem.id ?? apiItem._id,
    type: Number(apiItem.type) === 2 ? 2 : 1, // 1 = News, 2 = Feed (Reel); purani posts = 1
    author_id: author.id ?? apiItem.user_id ?? null,
    createdBy: String(author.email || apiItem.created_by || '').trim().toLowerCase(),
    author_email: String(author.email || apiItem.created_by || '').trim().toLowerCase(),
    title: apiItem.tittle || apiItem.title || '',
   subtitle: apiItem.sub_tittle || apiItem.sub_title || apiItem.subtitle || '',
    description: apiItem.description || '',
    category: apiItem.report_type || apiItem.category || 'General',
    report_type: apiItem.report_type || apiItem.category || '',
    mediaType,
    media: mediaType === 'Image' ? undefined : mediaUrl,
images: mediaType === 'Image' ? collectedImages : [],
    video: mediaType === 'Video' && mediaUrl ? { uri: mediaUrl } : null,
    file: mediaType === 'File' && mediaUrl ? { uri: mediaUrl, name: apiItem.media_name || 'file' } : null,
    author_name: author.name || apiItem.author_name || 'RTI News',
    author_profile_image: author.profile_image_url || author.profile_image || '',
    // Keep subscription details with the author so all clients can apply the
    // same Premium Plan-only badge rule to an existing post.
    author_subscription_plan: author.subscription_plan || author.active_plan || apiItem.author_subscription_plan || null,
    author_subscription_type: author.subscription_type || apiItem.author_subscription_type || '',
    author_has_blue_tick: hasBlueTick(author),
    author_is_premium: Boolean(author.is_premium),
    author_is_subscriber: Boolean(author.is_subscriber),
    // ✅ FIX: backend se author ka seat/role naam bhi map karo — pehle ye missing tha
    // isliye "Reporter" fallback hamesha dikhta tha chahe user ne koi bhi role liya ho
    author_seat_id: String(authorSeat.seat_id || apiItem.author_seat_id || '').trim(),
    author_seat_name: String(authorSeat.seat_name || apiItem.author_seat_name || '').trim(),
    author_role_label: author.role_label || apiItem.author_role_label || '',
    date: toSafeDateString(apiItem.created_at ?? apiItem.date),
    createdAt: toSafeDateString(apiItem.created_at ?? apiItem.date),
    views: Number(apiItem.views || 0),
     shares: Number(apiItem.share_count ?? apiItem.shares ?? 0),
    likes: Number(apiItem.likes || apiItem.likes_count || 0),
    comments: Number(apiItem.comments || apiItem.comments_count || 0),
        liked_by: Array.isArray(apiItem.liked_by) ? apiItem.liked_by : [],
    liked_by_me: apiItem.liked_by_me === undefined ? undefined : Boolean(apiItem.liked_by_me),
    latest_comments: Array.isArray(apiItem.latest_comments) ? apiItem.latest_comments.slice(0, 2) : [],
  };
};

const stripHtmlToText = (value = '') => cleanRichTextToPlain(value);

const getRelativeTimeLabel = (dateLike) => {
  const d = new Date(dateLike || 0);
  const t = d.getTime();
  if (!Number.isFinite(t) || t <= 0) return '';
  const diffMs = Date.now() - t;
  if (!Number.isFinite(diffMs) || diffMs < 0) return '';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return 'Just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString('en-IN');
};

const REEL_TAG_COLORS = {
  Crime:    '#ef4444',
  Murder:   '#ef4444',
  Accident: '#f97316',
  Politics: '#3b82f6',
  Other:    '#14b8a6',
  General:  '#16a34a',
};

const getReelVideoUri = (item = {}) => {
  if (typeof item.video === 'string' && item.video.trim()) return item.video.trim();
  if (item.video && typeof item.video.uri === 'string' && item.video.uri.trim()) return item.video.uri.trim();
  if (typeof item.media === 'string' && item.media.trim() && String(item.mediaType || '').toLowerCase() === 'video') {
    return item.media.trim();
  }
  return null;
};

const getReelThumbnailUri = (item = {}) => {
  if (typeof item.thumbnail === 'string' && item.thumbnail.trim()) return item.thumbnail.trim();
  if (typeof item.image === 'string' && item.image.trim()) return item.image.trim();
  if (Array.isArray(item.images) && item.images.length) {
    const first = item.images.find((u) => typeof u === 'string' && u.trim());
    if (first) return first.trim();
  }
  return null;
};

const toReelPostFromNewsItem = (item = {}, currentEmail = '') => {
  const videoUri = getReelVideoUri(item);
  const hasVideo = Boolean(videoUri);
  const createdByEmail = String(item.createdBy || item.created_by || '').trim().toLowerCase();

  const tagBase = String(item.report_type || item.category || item.state || 'General');
  const tag = tagBase;
  const tagColor = REEL_TAG_COLORS[tagBase] || '#16a34a';

  const headline = stripHtmlToText(item.title || item.headline || 'News Update');
  const caption = stripHtmlToText(item.subtitle || item.caption || item.excerpt || item.description || '');
  const fullDescription = stripHtmlToText(item.description || item.fullDescription || caption);

  const locationParts = [item.taluka, item.district, item.state].filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  const location = String(item.author_seat_name || item.authorSeatName || locationParts.join(', ') || 'India');

  const likes = Number(item.likes || 0);
  const shares = Number(item.shares || 0);

  const likedBy = Array.isArray(item.liked_by) ? item.liked_by : [];
  const liked = Boolean(currentEmail && likedBy.includes(currentEmail));

  const commentsList = Array.isArray(item.comments_list) ? item.comments_list : [];
  const comments = commentsList
    .map((c, idx) => ({
      id: String(c.id || `cmt-${idx + 1}`),
      user: String(c.author || c.author_name || 'User'),
      text: String(c.text || '').trim(),
    }))
    .filter((c) => c.text);

  return {
    id: String(item.id || `reel-${Date.now()}`),
    // ✅ FIX: reel card se profile pe navigate karte waqt bhi userId chahiye
    author_id: item.author_id ?? item.authorId ?? null,
    user: String(item.author_name || item.createdByName || item.createdBy || 'User'),
    avatar: String(item.author_profile_image || item.authorProfileImage || item.createdByProfileImage || item.profile_image || ''),
    verified: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || false),
    author_has_blue_tick: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || false),
    role: String(item.author_role_label || item.authorRoleLabel || item.author_role || item.authorRole || ''),
    location,
    time: String(item.time || getRelativeTimeLabel(item.createdAt || item.date || '')),
    type: hasVideo ? 'video' : (Array.isArray(item.images) && item.images.length ? 'image' : 'image'),
    media: hasVideo ? videoUri : (getReelThumbnailUri(item) || ''),
    thumbnail: getReelThumbnailUri(item),
    image: Array.isArray(item.images) && item.images.length ? item.images[0] : (item.image || ''),
    headline,
    caption,
    fullDescription,
    likes: Number.isFinite(likes) ? likes : 0,
    shares: Number.isFinite(shares) ? shares : 0,
    comments,
    liked,
    bookmarked: Boolean(item.bookmarked),
    tag,
    tagColor,
    status: item.status || 'approved',
    createdAt: item.createdAt || item.date || null,
    createdBy: createdByEmail,
  };
};

const getNewsSortValue = (item = {}) => {
  const createdAtValue = new Date(item.createdAt || item.date || 0).getTime();
  const idValue = Number(String(item.id || '').replace(/\D/g, '')) || 0;
  return Number.isFinite(createdAtValue) && createdAtValue > 0 ? createdAtValue + idValue : idValue;
};

const normalizeUserNewsItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: item.id,
      type: Number(item.type) === 2 ? 2 : 1,
      author_id: item.author_id ?? item.authorId ?? null,
      createdBy: String(item.createdBy || item.created_by || '').trim().toLowerCase(),
      title: cleanRichTextToPlain(item.title || ''),
      description: cleanRichTextToPlain(item.description || item.subtitle || ''),
      subtitle: cleanRichTextToPlain(item.subtitle || ''),
      media: item.media || (item.mediaType === 'Image'
        ? `${item.images?.length || 0} image(s)`
        : item.mediaType === 'Video' ? 'video attached'
        : item.mediaType === 'File' ? (item.file?.name ? `file: ${item.file.name}` : 'file attached')
        : 'no media'),
      category: item.category || item.state || 'General',
      language: String(item.language || item.lang || item.news_language || '').trim().toLowerCase(),
      mediaType: item.mediaType || 'None',
      state: item.state || item.category || 'General',
      district: item.district || '',
      taluka: item.taluka || '',
      author_name: item.author_name || item.createdByName || item.createdBy || 'RTI News',
      author_profile_image: item.author_profile_image || item.authorProfileImage || item.createdByProfileImage || item.profile_image || '',
      author_has_blue_tick: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick || false),
      author_is_premium: Boolean(item.author_is_premium || item.createdByPremium || false),
      author_is_subscriber: Boolean(item.author_is_subscriber || item.author_is_premium || item.createdBySubscriber || false),
      author_role: item.author_role || item.authorRole || item.createdByRole || '',
      author_role_label: item.author_role_label || item.authorRoleLabel || item.createdByRoleLabel || '',
      author_seat_id: String(item.author_seat_id || item.authorSeatId || item.createdBySeatId || '').trim(),
      author_seat_name: String(item.author_seat_name || item.authorSeatName || item.createdBySeatName || '').trim(),
      liked_by: Array.isArray(item.liked_by) ? item.liked_by : [],
      comments_list: normalizeComments(item.comments_list),
      images: Array.isArray(item.images) ? item.images : [],
image: Array.isArray(item.images) && item.images.length > 0
  ? item.images[0]
  : (item.image || ''),
thumbnail: Array.isArray(item.images) && item.images.length > 0
  ? item.images[0]
  : (item.thumbnail || item.image || ''),
video: item.video || null,
file: item.file || null,
date: item.date, createdAt: item.createdAt || item.date,
      status: item.status || 'approved',
      views: Number(item.views || 0), shares: Number(item.shares || 0),
      likes: Number(item.likes || 0),
      comments: Number(item.comments ?? (Array.isArray(item.comments_list) ? item.comments_list.length : 0)),
    }))
    .sort(() => Math.random() - 0.5);
};

const normalizeEmailValue = (value = '') => String(value || '').trim().toLowerCase();

const sanitizeNewsField = (value = '') => cleanRichTextToPlain(value);

const sanitizeNewsItemUpdates = (updates = {}) => ({
  title: sanitizeNewsField(updates.title),
  subtitle: sanitizeNewsField(updates.subtitle),
  description: sanitizeNewsField(updates.description),
  category: sanitizeNewsField(updates.category),
  state: sanitizeNewsField(updates.state),
  district: sanitizeNewsField(updates.district),
  taluka: sanitizeNewsField(updates.taluka),
});

const canManageNewsItem = (user, item = {}) => {
  const currentEmail = normalizeEmailValue(user?.email);
  if (!currentEmail) return false;
  if (String(user?.role || '').trim().toLowerCase() === 'admin') return true;
  const ownerEmail = normalizeEmailValue(item.createdBy || item.created_by);
  return Boolean(ownerEmail) && ownerEmail === currentEmail;
};

const updateNewsItemInCollection = (items, postId, buildNextItem) => {
  if (!Array.isArray(items) || !items.length) {
    return { items, found: false, changed: false, updatedItem: null };
  }

  let found = false;
  let changed = false;
  let updatedItem = null;

  const nextItems = items.map((item) => {
    if (String(item?.id || '').trim() !== postId) return item;
    found = true;
    const nextItem = buildNextItem(item);
    if (nextItem !== item) changed = true;
    updatedItem = nextItem;
    return nextItem;
  });

  return {
    items: found ? nextItems : items,
    found,
    changed,
    updatedItem,
  };
};

const removeNewsItemFromCollection = (items, postId) => {
  if (!Array.isArray(items) || !items.length) {
    return { items, found: false, changed: false };
  }

  const nextItems = items.filter((item) => String(item?.id || '').trim() !== postId);
  const found = nextItems.length !== items.length;

  return {
    items: found ? nextItems : items,
    found,
    changed: found,
  };
};

const clearNewsItemEngagement = async (postId) => {
  const normalizedPostId = String(postId || '').trim();
  if (!normalizedPostId) return;

  if (Platform.OS === 'web') {
    const state = await readEngagementFallback();
    const existingComments = Array.isArray(state.commentsByPost?.[normalizedPostId])
      ? state.commentsByPost[normalizedPostId]
      : [];

    existingComments.forEach((comment) => {
      const commentId = String(comment?.id || '').trim();
      if (commentId && state.commentLikesById?.[commentId]) {
        delete state.commentLikesById[commentId];
      }
    });

    delete state.likesByPost[normalizedPostId];
    delete state.sharesByPost[normalizedPostId];
    delete state.viewsByPost[normalizedPostId];
    delete state.commentsByPost[normalizedPostId];
    delete state.bookmarksByPost[normalizedPostId];

    await writeEngagementFallback(state);
    return;
  }

  const db = await getEngagementDb();
  if (!db) return;

  const commentRows = await db.getAllAsync(
    'SELECT id FROM post_comments WHERE post_id = ?',
    normalizedPostId
  );
  const commentIds = (commentRows || [])
    .map((row) => Number(row?.id))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (commentIds.length) {
    const placeholders = commentIds.map(() => '?').join(',');
    await db.runAsync(
      `DELETE FROM comment_likes WHERE comment_id IN (${placeholders})`,
      commentIds
    );
  }

  await db.runAsync('DELETE FROM post_likes WHERE post_id = ?', normalizedPostId);
  await db.runAsync('DELETE FROM post_bookmarks WHERE post_id = ?', normalizedPostId);
  await db.runAsync('DELETE FROM post_shares WHERE post_id = ?', normalizedPostId);
  await db.runAsync('DELETE FROM post_views WHERE post_id = ?', normalizedPostId);
  await db.runAsync('DELETE FROM post_comments WHERE post_id = ?', normalizedPostId);
};

const normalizeEPapers = (items = []) => {
  const src = Array.isArray(items) && items.length ? items : defaultEPapers;
  return src
    .map((item, i) => ({
      id:           item.id           || `epaper-${i + 1}`,
      title:        item.title        || `e-Paper ${i + 1}`,
      description:  item.description  || '',
      pdf_file:     item.pdf_file     || '',
      publish_date: item.publish_date || item.date || item.createdAt?.slice(0, 10) || '2026-03-24',
      createdAt:    item.createdAt    || item.publish_date || item.date || '2026-03-24',
      createdBy:    item.createdBy    || '',
      state:        item.state        || '',
      status:       item.status       || 'approved',
      mediaType:    item.mediaType    || 'None',
      images:       Array.isArray(item.images) ? item.images : [],
      video:        item.video || null,
      views:        Number(item.views     || 0),
      downloads:    Number(item.downloads || 0),
    }))
    .sort((a, b) => new Date(b.createdAt || b.publish_date || 0) - new Date(a.createdAt || a.publish_date || 0));
};

const normalizeStreams = (items = []) => {
  const src = Array.isArray(items) && items.length ? items : [];
  return src.map((item, i) => {
    const status = (item.status || 'upcoming').toLowerCase();
    const streamUrl = item.stream_url || item.youtube_link || '';
    return {
      id:           item.id           || `stream-${i + 1}`,
      stream_title: item.stream_title || 'Live Stream',
      stream_url:   streamUrl,
      ingest_url:   item.ingest_url || '',
      stream_key:   item.stream_key || '',
      status,
    };
  });
};
const normalizeCertifications = (items = []) => {
  const src = Array.isArray(items) && items.length ? items : defaultCertifications;
  return src.map((item, i) => ({
    id:               item.id || item.quiz_type_id || item.quizTypeId || `cert-${i + 1}`,
    quiz_type_id:     item.quiz_type_id || item.quizTypeId || item.id || null,
    quiz_title:       item.quiz_title       || item.quiz_id || `Quiz ${i + 1}`,
    // ✅ FIX (root cause of "certificate not generating after pass"): quiz_type
    // pehle yahan copy hi nahi hota tha, isliye AttemptQuizScreen tak quiz.quiz_type
    // hamesha undefined pahunchta tha aur certificate ka isExamQuiz check hamesha
    // false ban jaata tha — chahe quiz asal me "exam" type ka hi kyun na ho.
    quiz_type:        item.quiz_type        || null,
    questions:        Array.isArray(item.questions) ? item.questions : [],
    score:            item.score            ?? null,
    result_type:      item.result_type      || (item.result === 'Passed' ? 'Pass' : item.result === 'Retry' ? 'Fail' : null),
    certificate_file: item.certificate_file || null,
    local_certificate_path: item.local_certificate_path || null,
    certificate_number: item.certificate_number || null,
    user_name:  item.user_name  || '',
    issued_at:  item.issued_at  || item.date || null,
    attempts:   Number(item.attempts  || 0),
    downloads:  Number(item.downloads || 0),
  }));
};
const normalizeNotifications = (items = []) => {
  const src = Array.isArray(items) && items.length ? items : defaultNotifications;
  return src.map((item, i) => ({
    id:      item.id      || `notif-${i + 1}`,
    title:   item.title   || 'Notification',
    message: item.message || '',
    date:    item.date    || '2026-03-24',
    status:  item.status  || 'Unread',
    type:            item.type            || '',   // 👈 NEW
    submission_id:   item.submission_id   || '',    // 👈 NEW
  }));
};

const normalizeSettings = (s = {}) => ({
  language: s.language || defaultSettings.language,
  password: s.password || defaultSettings.password,
});

const normalizeStateKey = (state = '') => String(state || '').trim().toLowerCase();

// ✅ FIX (Issue #2): seat ab STATE ke bajaye poori TALUKA (state+district+taluka)
// ke level par lock hogi — Mumbai/Borivali ke liye alag lock, Pune/Kothrud ke liye alag.
const normalizeTalukaKey = (state = '', district = '', taluka = '') =>
  [state, district, taluka].map((v) => String(v || '').trim().toLowerCase()).join('|');

const UNLIMITED_SEAT_IDS = [];

// ✅ NEW: admin ne is particular plan ko kis level par banaya hai (state /
// state+district / state+district+taluka) — usi level par seat lock hogi
const getPlanSeatScopeKey = (plan, fallbackUser = null) => {
  const state    = String(plan?.state || fallbackUser?.state || '').trim().toLowerCase();
  const district = String(plan?.district || '').trim().toLowerCase();
  const taluka   = String(plan?.taluka || '').trim().toLowerCase();
  // ✅ NEW: Village-level plans bhi ab apni location par hi lock honge
  // (pehle village tha hi nahi, isliye village-level seat kabhi kisi
  // specific village se lock nahi hoti thi)
  const village  = String(plan?.village || '').trim().toLowerCase();

  if (village)  return `village|${state}|${district}|${taluka}|${village}`;
  if (taluka)   return `taluka|${state}|${district}|${taluka}`;
  if (district) return `district|${state}|${district}`;
  if (state)    return `state|${state}`;
  return ''; // plan me koi location hi nahi -> lock mat lagao
};

// ✅ NEW: kisi seat/role ke liye us user ko dikhne wala matching plan dhundta hai,
// taaki us plan ke apne state/district/taluka se scope decide ho sake
const findPlanForSeat = (seatId, user) => {
  const roleIdRaw = Object.keys(PLAN_ROLE_ID_TO_SEAT_ID)
    .find((key) => PLAN_ROLE_ID_TO_SEAT_ID[key] === seatId);
  if (!roleIdRaw) return null;
  return cachedBackendPlans.find((p) => {
    const planRoleIds = String(p.role_id_raw || '').split(',').map((id) => id.trim());
    return planRoleIds.includes(roleIdRaw) && planMatchesUserLocation(p, user);
  }) || null;
};

const getStateSeatRole = (seatRoleId = '') =>
  STATE_SEAT_ROLES.find((r) => r.id === seatRoleId) || null;

const normalizeStateSeat = (seat = null) => {
  if (!seat || typeof seat !== 'object') return null;
  const state = String(seat.state || '').trim();
  const seat_id = String(seat.seat_id || '').trim();
  if (!state || !seat_id) return null;
  const role = getStateSeatRole(seat_id);
  return {
    state,
    district: String(seat.district || '').trim(),
    taluka: String(seat.taluka || '').trim(),
    village: String(seat.village || '').trim(), // ✅ NEW
    seat_id,
    seat_name: String(seat.seat_name || role?.name || '').trim(),
    assigned_at: seat.assigned_at || null,
    plan_id: String(seat.plan_id || '').trim(),
  };
};

const getStateSeatAllocationsFromStorage = async () => {
  const raw = await AsyncStorage.getItem(STATE_SEATS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const normalizePaymentHistory = (items = []) => {
  const src = Array.isArray(items) ? items : [];
  return src.map((item, i) => ({
    order_id:   item.order_id   || `ORD_${i + 1}`,
    payment_id: item.payment_id || '',
    amount:     Number(item.amount || 0),
    status:     item.status     || 'pending',
    date:       item.date       || '2026-03-24',
    plan_id:    item.plan_id    || '',
    plan_name:  item.plan_name  || '',
    module:     item.module     || 'role',
    signature:  item.signature  || '',
    gateway_order_id: item.gateway_order_id || item.razorpay_order_id || '',
  }));
};

const isPremiumPlan = (plan) => {
  // Backend ka asli flag sabse upar: sirf is_premium plan hi "Premium" hai
  if (plan?.is_premium === true || plan?.is_premium === 1 || plan?.is_premium === '1') return true;
  // Role subscriptions are returned by the backend as either "Premium" or
  // "Premium Plan". Do not match arbitrary text (Premium Ads/Quiz etc.).
  const planName = String(plan?.plan_name || plan?.name || plan?.title || '')
    .trim().replace(/\s+/g, ' ').toLowerCase();
  const planId = String(plan?.plan_id || plan?.id || '').trim().toLowerCase();
  return planName === 'premium' || planName === 'premium plan' || planId === 'plan-premium';
};
const getRoleSubscriptionPlan = (user = {}) => (
  user?.subscription_plan || user?.active_plan || user?.role_subscription_plan || user?.subscription || null
);
const hasBlueTick = (user = {}) => {
  if (!user) return false;
  // Backend ka seedha flag (server plan + expiry khud check karke bhejta hai) — sabse pehle
  const serverFlag = user.has_blue_tick ?? user.is_blue_tick ?? user.blue_tick;
  if (serverFlag === true || serverFlag === 1 || serverFlag === '1') return true;
  // Sirf asli Premium plan (backend is_premium) + active subscription = blue tick.
  return Boolean(
    (isPremiumPlan(getRoleSubscriptionPlan(user)) || hasPremiumAccess(user)) &&
    hasActiveSubscription(user)
  );
};

// ✅ NEW: Seat/Designation walo ko badge nahi, lekin Blue-Tick-jaise features
// chahiye (spec point 7). Badge dikhane ke liye hamesha hasBlueTick() use karo,
// feature-access (jahan bhi "blue tick users ko ye milta hai" wala gate ho)
// ke liye ye wala use karo.
const hasBlueTickFeatures = (user = {}) => {
  if (!user) return false;
  const hasActiveSeat = Boolean(user.state_seat?.seat_id) && Boolean(user.is_subscribed);
  return Boolean(hasBlueTick(user) || hasActiveSeat);
};
const hasPremiumAccess = (user = {}) => {
  if (!user) return false;
  return isPremiumPlan(user.subscription_plan) || String(user.subscription_type || '').toLowerCase() === 'premium';
};

const hasActiveSubscription = (user = {}) => {
  if (!user) return false;
  const plan = getRoleSubscriptionPlan(user);
  const expiresAt = plan?.expires_at || plan?.expiry || plan?.end_date;
  if (expiresAt) {
    const expiresTime = new Date(`${expiresAt}T23:59:59`).getTime();
    if (!Number.isNaN(expiresTime) && Date.now() > expiresTime) return false;
  }
  if (user.is_subscribed !== undefined) return Boolean(user.is_subscribed);
  // Public profile/news responses may provide the active plan but omit the
  // private `is_subscribed` flag. Respect an active server plan in that case.
  const planStatus = String(plan?.status || plan?.subscription_status || '').trim().toLowerCase();
  if (plan && !['cancelled', 'canceled', 'expired', 'inactive', 'failed'].includes(planStatus)) return true;
  const history = Array.isArray(user.payment_history) ? user.payment_history : [];
  if (history.some((h) => String(h.status || '').toLowerCase() === 'success')) return true;
  return false;
};
// Quiz subscription ab sirf expiry-date se nahi, balki bache hue "quiz count" se bhi
// gate hoti hai — jaise hi remaining count 0 ho jaata hai, expiry valid hone ke bawajood
// user ko dobara subscription lena padta hai. `quiz_subscription_remaining_count` undefined
// hone par (purane/legacy users) backward-compatible rehte hue sirf expiry check hota hai.
const hasActiveQuizSubscription = (user = {}) => {
  if (!user) return false;
  const expiry = user.quiz_subscription_expiry;
  if (!expiry) return false;
  if (!(new Date(expiry) > new Date())) return false;
  const remaining = user.quiz_subscription_remaining_count;
  if (remaining === undefined || remaining === null) return true; // legacy: no count tracked, unlimited till expiry
  return Number(remaining) > 0;
};

const getQuizSubscriptionRemainingCount = (user = {}) => {
  if (!user) return 0;
  if (!hasActiveQuizSubscription(user)) return 0;
  const remaining = user.quiz_subscription_remaining_count;
  return remaining === undefined || remaining === null ? null : Number(remaining); // null = unlimited (legacy)
};

// ✅ NEW: Ecom (Sell page) subscription active hai ya nahi — user.ecome_subscription
// + user.ecome_credits ki expiry check karta hai (getCreditExpiryState defined neeche,
// isliye ye function file me neeche declare hone ke baad hi use hoga — JS hoisting ke
// through call time par koi dikkat nahi aati kyunki dono `const` hain lekin function
// tabhi call hote hain jab actual gate check ho, tab tak dono declare ho chuke hote hain).
const hasActiveEcomSubscription = (user = {}) => {
  if (!user) return false;
  const state = getCreditExpiryState(user.ecome_credits, user.ecome_subscription);
  if (!state.subscription || state.expired) return false;
  return Number(state.credits) > 0; // 🔢 credits 0 ho gaye to bhi inactive
};

// ✅ NEW: Ads subscription — same dual condition: credits khatam YA date khatam, dono se expire hoga.
const hasActiveAdSubscription = (user = {}) => {
  if (!user) return false;
  const state = getCreditExpiryState(user.ad_credits, user.ad_subscription);
  if (!state.subscription || state.expired) return false;
  return Number(state.credits) > 0;
};
const normalizeEmailList = (items = []) => (
  Array.from(new Set(
    (Array.isArray(items) ? items : [])
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
  ))
);

const CREDIT_VALIDITY_DAYS = 30;

// ✅ Web/other device pe kiya purchase is device pe laane ke liye (backend /my-subscriptions se)
let lastCreditSyncAt = 0;
const pickNum = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};
const detectSubType = (s = {}) => {
  const t = String(s.type || s.category || s.subscription_type || s.plan_type || s.module || '').toLowerCase().trim();
    if (t.includes('quiz') || t.includes('certif') || t.includes('exam')) return 'quiz';
    const tn = t.replace(/[^a-z]/g, '');
  if (tn.includes('ecom')) return 'ecom';
  if (s.ecom_sub_id || s.ecom_subscription_id) return 'ecom';
  if (/^(ads?|advert\w*|adsubscription|adssubscription)$/.test(tn)) return 'ads';
  return null;
};
const isBackendSubActive = (s = {}) => {
  const status = String(s.status || '').toLowerCase();
  const paid = Number(s.payment_status) === 1 || status === 'active';
  if (!paid) return false;
  const exp = s.expires_at || s.expiry || s.end_date;
  if (exp) {
    const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
    if (Number.isFinite(t) && Date.now() > t) return false;
  }
  return true;
};

const addDaysToDateString = (dateValue, days = CREDIT_VALIDITY_DAYS) => {
  const base = dateValue ? new Date(dateValue) : new Date();
  const safeBase = Number.isFinite(base.getTime()) ? base : new Date();
  safeBase.setDate(safeBase.getDate() + Number(days || CREDIT_VALIDITY_DAYS));
  return safeBase.toISOString().slice(0, 10);
};

const getCreditExpiryState = (credits = 0, subscription = null) => {
  const plan = subscription && typeof subscription === 'object' ? subscription : null;
  const expiresAt = plan?.expires_at || (plan?.purchased_at ? addDaysToDateString(plan.purchased_at) : '');
  const expiresTime = expiresAt ? new Date(`${expiresAt}T23:59:59`).getTime() : 0;
  const expired = Boolean(expiresTime && Date.now() > expiresTime);
  const normalizedPlan = plan ? { ...plan, expires_at: expiresAt, validity_days: Number(plan.validity_days || CREDIT_VALIDITY_DAYS) } : null;

  if (!expired) {
    return {
      credits: Number(credits || 0),
      subscription: normalizedPlan,
      expired: false,
      expires_at: expiresAt,
    };
  }

  return {
    credits: 0,
    subscription: normalizedPlan ? { ...normalizedPlan, status: 'expired', expired_at: expiresAt } : null,
    expired: true,
    expires_at: expiresAt,
  };
};

const normalizeUser = (user = {}) => {
  const referralCount = Number(user.referral_count || 0);
  const savedPlan = normalizeSubscriptionPlan(user.subscription_plan);
  const role = user.role || getRoleFromPlanId(savedPlan?.plan_id) || 'free';
  // ✅ FIX: is_subscribed pehle hi derive kar lo (role ke basis par bhi), taaki
  // has_blue_tick isse sahi tarah compute ho sake — nahi to raw user.is_subscribed
  // missing hone par premium user ko bhi blue tick nahi milta tha.
  const isSubscribed = user.is_subscribed !== undefined
                         ? Boolean(user.is_subscribed)
                         : role !== 'free';
  const normalizedMobile = normalizeIndianMobileNumber(user.mobile || user.mobile_number || user.contact_number || '');
  const normalizedMobileNumber = normalizeIndianMobileNumber(user.mobile_number || user.mobile || user.contact_number || '');

  return {
    ...user,
    // ✅ FIX: email hamesha lowercase save hogi
      id: user.id ?? user.user_id ?? null,   
     email: user.email ? user.email.trim().toLowerCase() : '',
    name:                user.name                || '',
    mobile:              normalizedMobile,
    contact_number:      user.contact_number      || user.mobile_number || user.mobile || '',
    phone_number:        user.phone_number        || '',
    mobile_number:       normalizedMobileNumber,
    state:               user.state               || '',
    district:            user.district            || '',
    taluka:              user.taluka              || '',
    location_complete:   user.location_complete   !== undefined ? user.location_complete : false,
    state_seat:          normalizeStateSeat(user.state_seat),
    subscription_type:   user.subscription_type   || role || 'free',
    role,
    role_label:          getRoleLabel(role),
    // ✅ FIX: raw user.role/user.is_subscribed ki jagah derived role + isSubscribed
    // pass karo, taaki premium subscription lete hi blue tick turant milna shuru ho.
    has_blue_tick:       hasBlueTick({ ...user, role, is_subscribed: isSubscribed }),
    is_subscribed:       isSubscribed,
    village:             user.village             || '',
    bio:                 user.bio                 || '',
   profile_image:       user.profile_image       || '',
    pending_phone:        user.pending_phone        ?? null,
    pending_bio:           user.pending_bio           ?? null,
    profile_update_status: user.profile_update_status ?? null,
    pending_profile_image:     user.pending_profile_image     ?? null,
    pending_profile_image_url: user.pending_profile_image_url ?? null,
    id_card:             user.id_card             || '',
    appointment_letter:  user.appointment_letter  || '',
    my_referral_code:    isSubscribed ? (user.my_referral_code || '') : '',
    referred_by:         user.referred_by         || '',
    referral_code_used:  user.referral_code_used  || '',
    referral_count:      referralCount,
    referral_qualified:  Boolean(user.referral_qualified),
    referral_qualified_at: user.referral_qualified_at || '',
    referral_bonus_paid: Boolean(user.referral_bonus_paid),
    valid_referrals:     Array.isArray(user.valid_referrals) ? user.valid_referrals : [],
    referral_bonus_milestones: Array.isArray(user.referral_bonus_milestones) ? user.referral_bonus_milestones : [],
    followers:           normalizeEmailList(user.followers),
    following:           normalizeEmailList(user.following),
    rank:                calculateRank(referralCount),
    join_date:           user.join_date           || new Date().toISOString().slice(0, 10),
    wallet_transactions: normalizeWalletTransactions(user.wallet_transactions),
    withdraw_requests:   normalizeWithdrawRequests(user.withdraw_requests),
    subscription_plan:   savedPlan,
    payment_history:     normalizePaymentHistory(user.payment_history),
    settings:            normalizeSettings(user.settings),
    ad_credits:          Number(user.ad_credits ?? 0),
    ad_subscription:     user.ad_subscription || null,
    ads:                 Array.isArray(user.ads) ? user.ads : [],
    ecome_credits:       Number(user.ecome_credits ?? 0),
    // Last-known `free_posts_remaining` from POST /news (display-only hint). null = unknown/subscriber.
    free_news_credits:   user.free_news_credits == null ? null : Number(user.free_news_credits),
    ecome_subscription:  user.ecome_subscription || null,
    ecome_listings:      Array.isArray(user.ecome_listings) ? user.ecome_listings : [],
    ecome_enquiries:     Array.isArray(user.ecome_enquiries) ? user.ecome_enquiries : [],
    farming_listings:    Array.isArray(user.farming_listings) ? user.farming_listings : [],
    farming_enquiries:   Array.isArray(user.farming_enquiries) ? user.farming_enquiries : [],
    farming_purchases:   Array.isArray(user.farming_purchases) ? user.farming_purchases : [],
    farming_sell_offers: Array.isArray(user.farming_sell_offers) ? user.farming_sell_offers : [],
    farming_price_feedback: Array.isArray(user.farming_price_feedback) ? user.farming_price_feedback : [],
  };
};

// ─── Storage Helpers ──────────────────────────────────────────────────────────

// ✅ FIX: getUsersFromStorage mein email normalize karo
const getUsersFromStorage = async () => {
  const data  = await AsyncStorage.getItem(USERS_KEY);
  const users = data ? JSON.parse(data) : [];
  return users.map((u) => normalizeUser({
    ...u,
    // ✅ Purane users jinka email uppercase tha, unhe bhi fix karo
    email: u.email ? u.email.trim().toLowerCase() : u.email,
  }));
};

// ─── Network Helper ───────────────────────────────────────────────────────────

const getLevelFromCurrentUser = (user, currentUser, usersByEmail) => {
  if (!currentUser || !user?.email) return '-';
  if (user.email === currentUser.email) return '0';
  let level  = 1;
  let cursor = user.referred_by;
  const visited = new Set();
  while (cursor && !visited.has(cursor)) {
    if (cursor === currentUser.email) return String(level);
    visited.add(cursor);
    const parent = usersByEmail.get(cursor);
    cursor = parent?.referred_by || '';
    level += 1;
  }
  return user.referred_by ? 'Linked' : 'Direct';
};

const recordQualifyingTransaction = async ({ buyerEmail, amount, packageType = 'subscription', transactionId, isRenewal = false }) => {
  // ✅ Commission sirf ROLE subscription purchase par — quiz / ecommerce / ads par nahi
  if (packageType !== 'subscription') return { ok: true, credited: false };
  const normalizedEmail = String(buyerEmail || '').trim().toLowerCase();
  if (!normalizedEmail || !amount) return { ok: false, credited: false };

  const users = await getUsersFromStorage();
  const usersByEmail = new Map(users.map((u) => [String(u.email || '').trim().toLowerCase(), u]));
  const buyer = usersByEmail.get(normalizedEmail);
  if (!buyer) return { ok: true, credited: false };

  const today = new Date().toISOString().slice(0, 10);
  const updates = new Map(); // email -> partial update object
  let cursorEmail = String(buyer.referred_by || '').trim().toLowerCase();
  let creditedAny = false;

  for (const { level, rate } of COMMISSION_LEVELS) {
    if (!cursorEmail || !usersByEmail.has(cursorEmail)) break;
    const ancestor = usersByEmail.get(cursorEmail);

    if (isCommissionEligible(ancestor)) {
      const commissionAmount = Math.round(Number(amount) * rate * 100) / 100;
      const ledgerEntry = {
        id: `ledger-${Date.now()}-L${level}`,
        referrer_id: ancestor.email,
        referred_user_id: normalizedEmail,
        level,
        package_type: packageType,
        transaction_id: transactionId || `TXN-${Date.now()}`,
        purchase_date: today,
        is_renewal: isRenewal,
        eligible_amount: amount,
        commission_rate: rate,
        commission_amount: commissionAmount,
        status: 'approved', // Admin verification flow backend me lagega
      };
      const walletTxn = {
        id: `txn-comm-${Date.now()}-L${level}`,
        amount: commissionAmount,
        type: 'credit',
        source: isRenewal ? `referral_commission_renewal_L${level}` : `referral_commission_L${level}`,
        date: today,
      };
      const existing = updates.get(cursorEmail) || {
        commission_ledger: Array.isArray(ancestor.commission_ledger) ? ancestor.commission_ledger : [],
        wallet_transactions: normalizeWalletTransactions(ancestor.wallet_transactions),
        total_commission: Number(ancestor.total_commission || 0),
      };
      existing.commission_ledger = [ledgerEntry, ...existing.commission_ledger];
      existing.wallet_transactions = [walletTxn, ...existing.wallet_transactions];
      existing.total_commission += commissionAmount;
      updates.set(cursorEmail, existing);
      creditedAny = true;
    }
    cursorEmail = String(ancestor.referred_by || '').trim().toLowerCase();
  }

  if (!creditedAny) return { ok: true, credited: false };

  const updatedUsers = users.map((user) => {
    const email = String(user.email || '').trim().toLowerCase();
    const upd = updates.get(email);
    if (!upd) return user;
    return normalizeUser({ ...user, ...upd });
  });

  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  return { ok: true, credited: true };
};

  
// ─── Certificate SVG Builder ──────────────────────────────────────────────────

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const buildCertificateSvg = ({
  userName, quizTitle, score, resultType, issueDate,
  certificateNumber, photoUri, email, village, contactNumber,
}) => {
  const safePhoto = photoUri && !String(photoUri).startsWith('blob:') ? escapeXml(photoUri) : '';
  const nameFontSize = getAwardeeFontSize(userName, 44); // ✅ lamba naam chota font, ek line me fit
  const photoMarkup = safePhoto
    ? `<image href="${safePhoto}" x="1088" y="650" width="170" height="210" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)" />`
    : `<rect x="1088" y="650" width="170" height="210" rx="10" fill="#E5E7EB" /><text x="1173" y="760" text-anchor="middle" fill="#6B7280" font-size="24" font-weight="700">PHOTO</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="990" viewBox="0 0 1400 990" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c8a94a"/><stop offset="50%" stop-color="#f0d080"/><stop offset="100%" stop-color="#c8a94a"/>
    </linearGradient>
    <clipPath id="photoClip"><rect x="1088" y="650" width="170" height="210" rx="10" /></clipPath>
  </defs>
  <rect width="1400" height="990" fill="#e8d5a3"/>
  <rect x="20" y="20" width="1360" height="950" fill="#f5efe0" stroke="#c8a94a" stroke-width="8"/>
  <rect x="34" y="34" width="1332" height="922" fill="#fdfaf3" stroke="#c8a94a" stroke-width="3"/>
  <text x="120" y="105" fill="#003399" font-size="34" font-weight="900">BhaRTIya VOICE</text>
  <text x="120" y="130" fill="#555555" font-size="13">RNI/MAH/MUL/66399</text>
  <circle cx="700" cy="96" r="48" fill="#fff8e1" stroke="#c8a94a" stroke-width="4"/>
  <text x="700" y="105" text-anchor="middle" fill="#003399" font-size="14" font-weight="900">BHARTIYA VOICE</text>
  <text x="700" y="120" text-anchor="middle" fill="#cc0000" font-size="7" font-weight="700">ALL INDIA RTI NEWS NETWORK</text>
  <rect x="1115" y="68" width="170" height="48" rx="5" fill="#003399"/>
  <text x="1200" y="97" text-anchor="middle" fill="#FFFFFF" font-size="13" font-weight="700">All India RTI News Network</text>
  <text x="1110" y="132" fill="#555555" font-size="13">UDYAM-MH-29-0022246</text>
  <rect x="34" y="155" width="1332" height="58" fill="#cc0000"/>
  <text x="700" y="193" text-anchor="middle" fill="#FFFFFF" font-size="34" font-weight="900">Bhartiya Mahiti Adhikar</text>
  <text x="700" y="238" text-anchor="middle" fill="#333333" font-size="16">News Paper Published in Marathi, Hindi &amp; English language</text>
  <text x="700" y="260" text-anchor="middle" fill="#333333" font-size="16"><tspan font-weight="700">Hon. Mr. Shoukat Abdulkalam Naikwadi </tspan>Chief Editor</text>
  <rect x="450" y="290" width="500" height="62" rx="6" fill="url(#gold)" stroke="#8b6914" stroke-width="2"/>
  <text x="700" y="331" text-anchor="middle" fill="#4a2800" font-size="28">Certificate <tspan font-style="italic">of</tspan> <tspan font-weight="900">Excellence</tspan></text>
  <text x="700" y="397" text-anchor="middle" fill="#333333" font-size="22">This is to certify that</text>
   <text x="700" y="452" text-anchor="middle" fill="#cc0000" font-size="${nameFontSize}" font-weight="900">${escapeXml(userName)}</text>
  <text x="700" y="500" text-anchor="middle" fill="#333333" font-size="20">has successfully passed the examination conducted by</text>
  <text x="700" y="537" text-anchor="middle" fill="#1a1a1a" font-size="24" font-weight="700">${escapeXml(quizTitle)}</text>
  <text x="700" y="575" text-anchor="middle" fill="#333333" font-size="20">with</text>
  <line x1="320" y1="612" x2="1080" y2="612" stroke="#c8a94a" stroke-width="3"/>
  <text x="700" y="652" text-anchor="middle" fill="#1a5c1a" font-size="42" font-weight="900">${escapeXml(resultType)}</text>
  <line x1="320" y1="668" x2="1080" y2="668" stroke="#c8a94a" stroke-width="3"/>
    <text x="700" y="686" text-anchor="middle" fill="#333333" font-size="18">Subjected to the movement of Right to Information in the organisational social work field since "15th" Years</text>
  <text x="700" y="746" text-anchor="middle" fill="#8b0000" font-size="26" font-style="italic" font-weight="700">Congratulations on your outstanding achievement!</text>
  <text x="160" y="790" fill="#333333" font-size="70">&#128220;</text>
  <rect x="300" y="770" width="520" height="150" rx="12" fill="#fff9eb" stroke="#ead9ab"/>
  <text x="324" y="800" fill="#8b6914" font-size="15" font-weight="800">MEMBER DETAILS</text>
  <text x="324" y="825" fill="#333333" font-size="15">Name: <tspan font-weight="800">${escapeXml(userName)}</tspan></text>
  <text x="324" y="848" fill="#333333" font-size="15">Email: <tspan font-weight="800">${escapeXml(email || '-')}</tspan></text>
  <text x="324" y="871" fill="#333333" font-size="15">Village: <tspan font-weight="800">${escapeXml(village || '-')}</tspan></text>
  <text x="324" y="894" fill="#333333" font-size="15">Contact: <tspan font-weight="800">${escapeXml(contactNumber || '-')}</tspan></text>
  <text x="324" y="917" fill="#333333" font-size="15">Certificate No: <tspan font-weight="800">${escapeXml(certificateNumber)}</tspan></text>
  <rect x="1082" y="644" width="182" height="222" rx="12" fill="#f0e6c8" stroke="#c8a94a" stroke-width="4"/>
  ${photoMarkup}
  <text x="700" y="948" text-anchor="middle" fill="#8b0000" font-size="18" font-weight="800">Hon. Mr. Shoukat Abdulkalam Naikwadi</text>
  <text x="700" y="965" text-anchor="middle" fill="#333333" font-size="13">Chief Editor / Owner / Publisher / All India President Bhartiya Mahiti Adhikar</text>
  <rect x="515" y="872" width="370" height="36" rx="18" fill="#fdfaf3" stroke="#8b6914"/>
  <text x="700" y="895" text-anchor="middle" fill="#333333" font-size="15">Date of Issue: ${escapeXml(issueDate)}</text>
  <rect x="34" y="970" width="1332" height="32" fill="#b22222"/>
  <text x="700" y="991" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="600">Certificate No. ${escapeXml(certificateNumber)} | ritechek@gmail.com | www.bhartiyamahitiadhikar.com</text>
</svg>`;
};

const ensureCertificateDirectoryAsync = async () => {
  try {
    console.log("documentDirectory:", FileSystem.documentDirectory); // <-- add this

    if (!FileSystem.documentDirectory) {
      console.log("documentDirectory is null — check platform/permissions");
      return null;
    }

    const dir = FileSystem.documentDirectory + "Certificates/";
    const dirInfo = await FileSystem.getInfoAsync(dir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    return dir;
  } catch (error) {
    console.log("Directory Error:", error?.message, error?.stack); // <-- log full error
    return null;
  }
};

const saveCertificateSvg = async (svgMarkup, fileName) => {
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { ok: true, savedPath: null, isLocalSvg: true };
    } catch (err) {
      return { ok: false, message: err?.message || 'Unable to download certificate.' };
    }
  }

  const dir = await ensureCertificateDirectoryAsync();
  if (!dir) {
    return { ok: false, message: 'Certificate directory not found.' };
  }

  const svgPath = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(svgPath, svgMarkup, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return { ok: true, savedPath: svgPath, isLocalSvg: true };
};

// ─── Global Follow-State Pub/Sub ───────────────────────────────────────────
// ✅ Ek hi user_id/email ke follow buttons app mein kai jagah render hote hain
// (news card, public profile, followers/following list). Follow/unfollow hote
// hi sabko turant notify karne ke liye ye chhota pub/sub.
const _followStateListeners = new Set();
// The follow-list endpoints can briefly return an older snapshot immediately
// after a mutation. Keep successful mutations in this session so a screen
// focus/refetch cannot undo a follow the user has just made.
const _optimisticFollowing = new Map();
const _followOverrides = new Map();

const _followTargetKey = (email, id) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  // Following endpoint reliably returns ids but may omit email, so id must be
  // the canonical key whenever it is available.
  if (id != null) return `id:${String(id)}`;
  return normalizedEmail ? `email:${normalizedEmail}` : '';
};

const _rememberFollowing = (email, id, isFollowing, info = null) => {
  const key = _followTargetKey(email, id);
  if (!key) return;
  _followOverrides.set(key, Boolean(isFollowing));
  if (isFollowing) {
    // name / profile_image bhi yaad rakho — pehle sirf {email,id} save hota tha, isliye
    // Following list me naam "User" aur photo blank dikhti thi.
    const prev = _optimisticFollowing.get(key) || {};
    _optimisticFollowing.set(key, {
      ...prev,
      email: String(email || '').trim().toLowerCase(),
      id: id ?? null,
      ...(info?.name ? { name: info.name } : {}),
      ...(info?.profile_image ? { profile_image: info.profile_image } : {}),
    });
  } else {
    _optimisticFollowing.delete(key);
    // Remove a legacy email-only entry too if the current action has an id.
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail) _optimisticFollowing.delete(`email:${normalizedEmail}`);
  }
};

const _mergeFollowing = (following) => {
  const merged = new Map();
  (Array.isArray(following) ? following : []).forEach((user) => {
    const key = _followTargetKey(user?.email || user?.user_email, user?.id ?? user?.user_id);
    if (key) merged.set(key, user);
  });
  _followOverrides.forEach((isFollowing, key) => {
    if (!isFollowing) merged.delete(key);
  });
  // ✅ FIX: pehle optimistic entry (sirf {email,id}, naam/photo ke bina) backend ki asli
  // entry ko OVERWRITE kar deti thi — isliye list me naam "User" aur photo gayab thi.
  // Ab backend ki entry hi jeetegi; optimistic sirf tab add hoti hai jab backend list
  // me abhi tak wo user aaya hi nahi (stale read).
  _optimisticFollowing.forEach((user, key) => {
    if (!merged.has(key)) merged.set(key, _normalizeFollowListItem(user));
  });
  return [...merged.values()];
};

const _matchesFollowTarget = (payload, email, id) => {
  const normEmail = String(email || '').trim().toLowerCase();
  const payloadEmail = String(payload?.email || '').trim().toLowerCase();
  if (normEmail && payloadEmail && normEmail === payloadEmail) return true;
  if (id != null && payload?.id != null && String(id) === String(payload.id)) return true;
  return false;
};

const _broadcastFollowChange = (email, id, isFollowing, info = null) => {
  _rememberFollowing(email, id, isFollowing, info);
  const payload = { email: String(email || '').trim().toLowerCase(), id: id ?? null, isFollowing };
  _followStateListeners.forEach((cb) => {
    try { cb(payload); } catch { /* listener error ignore */ }
  });
};

// Backend follower/following list items sirf { id, firstname, lastname, profile_image, bio }
// bhejte hain — koi top-level "name" ya "email" field nahi hoti. UI ko ek consistent
// "name" chahiye hota hai, isliye yahin normalize kar do taaki Followers/Following
// modal aur app mein kahin bhi yeh list use ho, sahi naam/image dikhe.
const _normalizeFollowListItem = (raw) => {
  const u = raw || {};
  const fullName = [u.firstname, u.lastname].filter((p) => p && String(p).trim()).join(' ').trim();
  return {
    ...u,
    id: u.id ?? u.user_id ?? null,
    name: fullName || u.name || u.username || 'User',
    email: String(u.email || u.user_email || '').trim().toLowerCase(),
    profile_image: u.profile_image || u.profile_image_url || '',
  };
};

// ─── User Store ───────────────────────────────────────────────────────────────
export const UserStore = {

  // ✅ Kisi bhi follow/unfollow ka live update sunne ke liye subscribe karo.
  // callback(payload) milega jahan payload = { email, id, isFollowing }.
  // Match karne ke liye UserStore.matchesFollowTarget(payload, myEmail, myId) use karo.
  // Return hua function unsubscribe karta hai.
  subscribeFollowState: (callback) => {
    _followStateListeners.add(callback);
    return () => _followStateListeners.delete(callback);
  },
  matchesFollowTarget: (payload, email, id) => _matchesFollowTarget(payload, email, id),

  // ✅ NEW: kisi bhi user ka public profile uske numeric id se laata hai
  // (GET /profile/{id}). posts[] ko mapApiNewsToFeedItem se normalize karta hai
  // taaki NewsFeedCard ise seedha render kar sake (media_type 2 = video bhi
  // isi mapper se handle hota hai).
  getPublicProfileById: async (id) => {
    try {
      if (!id) return null;
      const res = await AuthAPI.getPublicProfileById(id);
      if (!res?.ok) return null;
            const profile = res.profile || {};
      return {
        ...profile,
        id: profile.id ?? profile.user_id ?? null,
        avatar: profile.avatar || profile.profile_image || null,
        seat_name: String(profile.state_seat?.seat_name || '').trim(),
        posts: Array.isArray(profile.posts) ? profile.posts.map(mapApiNewsToFeedItem) : [],
      };
    } catch (err) {
      console.error('[UserStore.getPublicProfileById] Error:', err);
      return null;
    }
  },

  // ✅ NEW: engagement store (post_likes SQLite / likesByPost localStorage — jisse story.liked_by
  // banta hai) ko sync karta hai. Jab bhi kahin se bhi like/unlike API call ho (feed card, details
  // screen, etc.) ye function call karna zaroori hai — warna wo jagah ka apna local "liked" flag
  // is asli source-of-truth se out-of-sync ho jaata hai aur poll/refresh par ulta "auto unlike" ho
  // jaata hai (feed card me exactly yehi bug tha).
  syncLocalLikeEngagement: async (postId, liked) => {
    try {
      const id = String(postId || '').trim();
      if (!id) return;
      const user = await UserStore.getCurrentUser();
      const email = String(user?.email || '').trim().toLowerCase();
      if (!email) return;

      if (Platform.OS === 'web') {
        const state = await readEngagementFallback();
        state.likesByPost[id] = state.likesByPost[id] || {};
        if (liked) {
          state.likesByPost[id][email] = true;
        } else {
          delete state.likesByPost[id][email];
        }
        await writeEngagementFallback(state);
      } else {
        const db = await getEngagementDb();
        if (db) {
          if (liked) {
            await db.runAsync(
              'INSERT OR IGNORE INTO post_likes (post_id, user_email, created_at) VALUES (?, ?, ?)',
              id,
              email,
              new Date().toISOString()
            );
          } else {
            await db.runAsync('DELETE FROM post_likes WHERE post_id = ? AND user_email = ?', id, email);
          }
        }
      }
    } catch {}
  },

  getUser: async (email) => {
    try {
      // ✅ FIX: search bhi lowercase se karo
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const users = await getUsersFromStorage();
      return users.find((u) => u.email === normalizedEmail) || null;
    } catch { return null; }
  },

  getUserByReferralCode: async (code) => {
    try {
      if (!code) return null;
      const users = await getUsersFromStorage();
      return users.find((u) => u.my_referral_code === code.toUpperCase()) || null;
    } catch { return null; }
  },

  getAllUsers: async () => {
    try { return await getUsersFromStorage(); }
    catch { return []; }
  },

  hasPremiumAccess: (user) => hasPremiumAccess(user),
  hasActiveSubscription: (user) => hasActiveSubscription(user),
  hasActiveQuizSubscription: (user) => hasActiveQuizSubscription(user),
  getQuizSubscriptionRemainingCount: (user) => getQuizSubscriptionRemainingCount(user),
hasActiveEcomSubscription: (user) => hasActiveEcomSubscription(user),
    hasActiveAdSubscription: (user) => hasActiveAdSubscription(user),

  // ✅ NEW: pehle backend se sync (await) karta hai, phir fresh user deta hai
  getCurrentUserSynced: async () => {
    try { await UserStore.syncCreditSubscriptionsFromBackend({ force: true }); } catch (e) { /* ignore */ }
    return UserStore.getCurrentUser();
  },
syncCreditSubscriptionsFromBackend: async ({ force = false } = {}) => {
  try {
    if (!force && Date.now() - lastCreditSyncAt < 20000) return;
    lastCreditSyncAt = Date.now();

    const user = await UserStore.getCurrentUser();
    if (!user) return;

    const [res, quizRes] = await Promise.all([
      AuthAPI.getMySubscriptions(),
      AuthAPI.getMyQuizSubscriptions(),
    ]);
    if (!res?.ok && !quizRes?.ok) {
      console.warn('[syncCreditSubscriptions] both endpoints failed:', res?.message, quizRes?.message);
      return;
    }

    // Backend kabhi array, kabhi {ads:[..], ecom:[..], quiz:[..]} jaisa grouped object bhejta hai —
    // dono ko flat list me badal do, aur group ka naam 'type' bana do (agar record me type nahi hai).
    const TYPE_KEYS = ['type', 'category', 'subscription_type', 'plan_type', 'module'];
    const flatten = (raw, hint = null) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.flatMap((x) => flatten(x, hint));
      if (typeof raw !== 'object') return [];
      const isRecord = ['id', 'plan_id', 'plan_name', 'expires_at', 'status', 'payment_status', 'purchased_at']
        .some((k) => raw[k] !== undefined);
      if (isRecord) {
        const hasType = TYPE_KEYS.some((k) => raw[k]);
        return [hasType || !hint ? raw : { ...raw, type: hint }];
      }
      return Object.keys(raw).flatMap((k) => (
        raw[k] && typeof raw[k] === 'object' ? flatten(raw[k], ['data', 'subscriptions', 'items'].includes(k) ? hint : k) : []
      ));
    };

    const mainList = res?.ok ? flatten(res.subscriptions) : [];
    const quizList = quizRes?.ok ? flatten(quizRes.subscriptions, 'quiz').map((s) => ({ ...s, type: 'quiz' })) : [];
    const list = [...mainList, ...quizList];
    console.log('[syncCreditSubscriptions] backend list:', JSON.stringify(list));

    // ── Lenient active check: pending/failed/expired ko chhod kar baaki sab active ──
    const isActiveSub = (s = {}) => {
      const status = String(s.status ?? '').toLowerCase();
      if (['expired', 'inactive', 'cancelled', 'canceled', 'failed', 'refunded', 'pending', 'created'].includes(status)) return false;
      const ps = s.payment_status;
      if (ps !== undefined && ps !== null && ps !== '') {
        if (!['1', 'true', 'paid', 'success', 'captured', 'completed', 'active'].includes(String(ps).toLowerCase())) return false;
      }
      const exp = s.expires_at || s.expiry || s.end_date || s.expiry_date;
      if (exp) {
        const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
        if (Number.isFinite(t) && Date.now() > t) return false;
      }
      return true;
    };

    // har type (ads / ecom / quiz) ki sabse nayi active subscription
    const latest = {};
    list.filter(isActiveSub).forEach((s) => {
      const type = detectSubType(s);
      if (!type) return;
      const stamp = String(s.purchased_at || s.created_at || s.start_date || '');
      if (!latest[type] || stamp > String(latest[type].purchased_at || latest[type].created_at || latest[type].start_date || '')) latest[type] = s;
    });
    console.log('[syncCreditSubscriptions] detected types:', Object.keys(latest).join(',') || 'NONE');

    const build = (s) => {
      const days = pickNum(s.days, s.validity_days, s.duration_days, s.plan?.days, s.plan?.validity_days);
      const purchasedAt = String(s.purchased_at || s.start_date || s.created_at || new Date().toISOString()).slice(0, 10);
      const expiresAt = String(s.expires_at || s.expiry || s.end_date || s.expiry_date || '').slice(0, 10)
        || addDaysToDateString(purchasedAt, days || CREDIT_VALIDITY_DAYS);
      return {
        plan_id: s.plan_id ?? s.plan?.id ?? s.id,
        plan_name: s.plan_name || s.title || s.name || s.plan?.title || s.plan?.plan_name || 'Subscription Plan',
        price: pickNum(s.price, s.amount, s.plan?.price) ?? 0,
        credits: pickNum(s.credits, s.plan?.credits) ?? 0,
        duration: `${days || CREDIT_VALIDITY_DAYS} Days`,
        validity_days: days || CREDIT_VALIDITY_DAYS,
        purchased_at: purchasedAt,
        expires_at: expiresAt,
        status: 'active',
      };
    };
    const isNew = (local, sub) => !local
      || String(local.plan_id) !== String(sub.plan_id)
      || String(local.purchased_at || '').slice(0, 10) !== sub.purchased_at
      || String(local.expires_at || '').slice(0, 10) !== sub.expires_at;

    const updates = {};

    if (latest.ads) {
      const sub = build(latest.ads);
      const backendCredits = pickNum(latest.ads.remaining_credits, latest.ads.credits_remaining, latest.ads.credits_left, latest.ads.ad_credits);
      if (isNew(user.ad_subscription, sub)) {
        updates.ad_subscription = sub;
        updates.ad_credits = backendCredits ?? sub.credits ?? 0;
      } else if (backendCredits !== null && backendCredits !== Number(user.ad_credits ?? 0)) {
        updates.ad_credits = backendCredits;
      }
    }

    if (latest.ecom) {
      const sub = build(latest.ecom);
      const backendCredits = pickNum(latest.ecom.remaining_credits, latest.ecom.credits_remaining, latest.ecom.credits_left, latest.ecom.ecome_credits);
      if (isNew(user.ecome_subscription, sub)) {
        updates.ecome_subscription = sub;
        updates.ecome_credits = backendCredits ?? sub.credits ?? 0;
      } else if (backendCredits !== null && backendCredits !== Number(user.ecome_credits ?? 0)) {
        updates.ecome_credits = backendCredits;
      }
    }

    if (latest.quiz) {
      const sub = build(latest.quiz);
      const total = pickNum(latest.quiz.quiz_count, latest.quiz.total_count, latest.quiz.plan?.quiz_count);
      const backendRemaining = pickNum(latest.quiz.remaining_count, latest.quiz.remaining_attempts, latest.quiz.quiz_remaining);
      if (isNew(user.quiz_subscription_plan, sub)) {
        updates.quiz_subscription_expiry = new Date(`${sub.expires_at}T23:59:59`).toISOString();
        updates.quiz_subscription_plan = {
          plan_id: sub.plan_id, plan_name: sub.plan_name, price: sub.price,
          duration: sub.validity_days, quiz_count: total,
          purchased_at: sub.purchased_at, expires_at: sub.expires_at,
        };
        updates.quiz_subscription_total_count = total;
        updates.quiz_subscription_remaining_count = backendRemaining ?? total;
      } else if (backendRemaining !== null && backendRemaining !== user.quiz_subscription_remaining_count) {
        updates.quiz_subscription_remaining_count = backendRemaining;
      }
    }

    console.log('[syncCreditSubscriptions] updates:', JSON.stringify(updates));
    if (Object.keys(updates).length) await UserStore.updateUser(user.email, updates);
  } catch (err) {
    console.warn('[syncCreditSubscriptionsFromBackend] failed:', err);
  }
},

getMySubscriptions: async () => {
  try {
    const res = await AuthAPI.getMySubscriptions();
    if (!res.ok) return { ok: false, isAuth: !!res.isAuth, items: [] };
    const items = (res.subscriptions || []).map((s) => ({
      id: s.id ?? s.plan_id,
      type: s.type || s.category || s.subscription_type || 'general',
      planName: s.plan_name || s.title || s.name || 'Subscription Plan',
      price: s.price !== undefined ? Number(s.price) : null,
      status: String(s.status || (Number(s.payment_status) === 1 ? 'active' : 'inactive')).toLowerCase(),
      purchasedAt: s.purchased_at || s.created_at || null,
      expiresAt: s.expires_at || s.expiry || null,
    }));
    return { ok: true, items };
  } catch { return { ok: false, isAuth: false, items: [] }; }
},

// ✅ NEW: backend se real ecom (Sell page) subscription plans fetch karta hai
// GET /ecom-subscriptions
getEcomSubscriptionPlans: async () => {
  try {
    const res = await AuthAPI.getEcomSubscriptions();
    if (!res.ok || !Array.isArray(res.plans) || !res.plans.length) return [];
    return res.plans.map((p) => {
      const validityDays = Number(p.days ?? p.validity_days ?? p.duration_days ?? 30);
      return {
        id: p.id ?? p.plan_id,
        label: p.title || p.plan_name || p.name || 'E-Commerce Plan',
        price: Number(p.price ?? 0),
        credits: Number(p.credits ?? p.listing_credits ?? p.listings ?? 0),
               duration: `${validityDays} Days`,
        validity_days: validityDays,
      };
    });
  } catch { return []; }
},

// ✅ NEW: backend se real quiz subscription plans fetch karta hai (no login needed)
getQuizSubscriptionPlans: async () => {
  try {
    const res = await AuthAPI.getQuizSubscriptionPlans();
    if (!res.ok || !Array.isArray(res.plans)) return [];
    return res.plans.map((p) => {
      const days = Number(p.days ?? p.validity_days ?? p.duration_days ?? (Number(p.duration ?? p.months ?? p.validity_months ?? 1) * 30));
      const duration = days;
      // Backend field name abhi confirm nahi hai isliye common naming variants sab try karte hain.
      const quizCountRaw = p.quiz_count ?? p.quizCount ?? p.attempts ?? p.no_of_quiz ?? p.total_quiz ?? p.quiz_limit;
      const quizCount = quizCountRaw !== undefined && quizCountRaw !== null ? Number(quizCountRaw) : null; // null = unlimited/unspecified
      return {
        id: p.id ?? p.plan_id,
        label: p.title || p.plan_name || p.name || `${days} Day${days > 1 ? 's' : ''}`,
        price: Number(p.price ?? 0),
        duration,
        days,
        unit: days > 1 ? 'days' : 'day',
        perMonth: days > 0 ? Math.round((Number(p.price ?? 0) / days) * 30) : Number(p.price ?? 0),
        quizCount,
      };
    });
  } catch { return []; }
},

// ✅ NEW: Razorpay order create karta hai quiz subscription plan ke liye
createQuizSubscriptionOrder: async ({ planId }) => {
  try {
    const orderResult = await AuthAPI.purchaseQuizSubscription({ planId });
    if (!orderResult?.ok) return { ok: false, message: orderResult?.message || 'Unable to create order.' };
    return { ok: true, razorpay: orderResult.razorpay };
  } catch {
    return { ok: false, message: 'Unable to create order.' };
  }
},

// ✅ NEW: Razorpay payment verify + local user state update (expiry/plan/notification)
verifyQuizPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }) => {
  try {
    const user = await UserStore.getCurrentUser();
    if (!user) return { ok: false, message: 'Please login again.' };

    const verifyRes = await AuthAPI.verifyQuizSubscriptionPayment({
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    });
    if (!verifyRes?.ok) {
      return { ok: false, message: verifyRes?.message || 'Payment verification failed.' };
    }

       const validityDays = Number(plan?.days) || (Number(plan?.duration || 1) * 30);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityDays);
    const today = new Date().toISOString().slice(0, 10);

    // plan.quizCount === kitne quiz attempts is subscription me milte hain.
    // null/undefined matlab backend ne count nahi bheja — us case me legacy/unlimited-till-expiry
    // behaviour maintain karte hain (hasActiveQuizSubscription isko null treat karega).
    const quizCount = (plan?.quizCount !== undefined && plan?.quizCount !== null) ? Number(plan.quizCount) : null;

    const notification = {
      id: `notif-quiz-sub-${Date.now()}`,
      title: `🎉 Quiz Subscription Activated!`,
      message: quizCount
        ? `${plan?.label || 'Quiz'} Subscription active ho gaya. Aap ab ${quizCount} quiz attempt kar sakte hain.`
        : `${plan?.label || 'Quiz'} Subscription active ho gaya. Ab aap quizzes attempt kar sakte hain.`,
      date: today,
      status: 'Unread',
    };

        const quizPayment = {
      order_id:   `ORD_QUIZ_${Date.now()}`,
      payment_id: razorpay_payment_id || `PAY_QUIZ_${Date.now()}`,
      amount:     Number(plan?.price || 0),
      status:     'success',
      date:       today,
      plan_id:    plan?.id,
      plan_name:  plan?.label,
      module:     'quiz',
      signature:  razorpay_signature || '',
    };

    const updatedUser = await UserStore.updateUser(user.email, {
      quiz_subscription_expiry: expiryDate.toISOString(),
      quiz_subscription_plan: {
        plan_id: plan?.id,
        plan_name: plan?.label,
        price: plan?.price,
        duration: plan?.duration,
        quiz_count: quizCount,
        purchased_at: today,
        expires_at: expiryDate.toISOString().slice(0, 10),
      },
      quiz_subscription_total_count: quizCount,
      quiz_subscription_remaining_count: quizCount,
      notifications: [notification, ...normalizeNotifications(user.notifications)],
      payment_history: [...normalizePaymentHistory(user.payment_history), quizPayment],
    });
       if (!updatedUser) return { ok: false, message: 'Subscription save nahi ho paya.' };
    await recordQualifyingTransaction({
      buyerEmail: user.email,
      amount: Number(plan?.price || 0),
      packageType: 'quiz',
      transactionId: razorpay_payment_id || `TXN-${Date.now()}`,
      isRenewal: Boolean(user.quiz_subscription_expiry),
    });
    return { ok: true, user: updatedUser };
  } catch (err) {
    console.error('[UserStore.verifyQuizPayment] Error:', err);
    return { ok: false, message: 'Something went wrong during verification.' };
  }
},

// ✅ NEW: har successful quiz attempt (submit) ke baad quiz-subscription ka remaining
// count ek se decrement karta hai. Legacy users jinke paas count hi track nahi ho raha
// (remaining_count undefined/null) unke liye kuch nahi karta — unke liye subscription
// abhi bhi purani tarah expiry-only rehti hai.
consumeQuizAttempt: async () => {
  try {
    const user = await UserStore.getCurrentUser();
    if (!user) return { ok: false, message: 'Please login again.' };
    const remaining = user.quiz_subscription_remaining_count;
    if (remaining === undefined || remaining === null) return { ok: true, remaining: null };
    const nextRemaining = Math.max(0, Number(remaining) - 1);
    const updatedUser = await UserStore.updateUser(user.email, {
      quiz_subscription_remaining_count: nextRemaining,
    });
    if (!updatedUser) return { ok: false, message: 'Unable to update quiz count.' };
    return { ok: true, remaining: nextRemaining };
  } catch (err) {
    console.error('[UserStore.consumeQuizAttempt] Error:', err);
    return { ok: false, message: 'Unable to update quiz count.' };
  }
},
     hasBlueTick: (user) => hasBlueTick(user),
   hasBlueTickFeatures: (user) => hasBlueTickFeatures(user),
  isPremiumPlan: (plan) => isPremiumPlan(plan),
  getRoleFromPlanId,
  getRoleLabel,
    getSeatIdsForRoleId: (roleIdRaw) =>
    String(roleIdRaw || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => PLAN_ROLE_ID_TO_SEAT_ID[id])
      .filter(Boolean),
  getSeatIdForRoleId: (roleIdRaw) => UserStore.getSeatIdsForRoleId(roleIdRaw)[0] || '',
  getSeatRoleNameForPlanRoleId: (roleIdRaw) =>
    UserStore.getSeatIdsForRoleId(roleIdRaw)
      .map((seatId) => getStateSeatRole(seatId)?.name)
      .filter(Boolean)
      .join(', '),
  getReferralTier,
  getNextReferralTier,
  getReferralTiers: () => [...RANK_TIERS].reverse().filter((tier) => tier.rank !== 'Member'),

        saveUser: async ({
    name,
    mobile,
    email,
    password,
    state             = '',
    district          = '',
    taluka            = '',
    subscription_type = 'free',
    referral_code_used = null,
    profile_image     = '',
    bio               = '',
  }) => {
    try {
      // ✅ FIX: Register karte waqt email lowercase karo
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const normalizedMobile = normalizeIndianMobileNumber(mobile);

      const users = await getUsersFromStorage();

      // ✅ FIX: Duplicate check normalized email se
      const existing = users.find((u) => u.email === normalizedEmail);
      if (existing) {
        return { ok: false, message: 'This email is already registered!' };
      }

      if (!isValidIndianMobileNumber(normalizedMobile)) {
        return { ok: false, message: 'Please enter a valid Indian mobile number.' };
      }

      const existingByMobile = users.find(
        (u) => normalizeIndianMobileNumber(u.mobile || u.mobile_number || u.contact_number) === normalizedMobile
      );
      if (existingByMobile) {
        return { ok: false, message: 'This mobile number is already registered!' };
      }

      const my_referral_code = '';

      let referred_by = '';
      if (referral_code_used) {
        const parentUser = users.find(
          (u) => u.my_referral_code === referral_code_used.toUpperCase().trim()
        );
            // Referral code ki asli validation server ne register par hi kar di hai (galat ho to 422).
        // Referrer is phone ki local list me na ho to bhi registration fail nahi honi chahiye.
        if (parentUser) referred_by = parentUser.email;
      }

          const newUser = normalizeUser({
        name,
        mobile: normalizedMobile,
        email: normalizedEmail, // ✅ lowercase email save karo
        password,
        state,
        district,
        taluka,
        profile_image,
        bio,
        location_complete: false,
        subscription_type,
        role: 'free',
        is_subscribed: false,
        my_referral_code,
        referred_by,
        referral_code_used: referral_code_used || '',
        referral_count: 0,
        join_date: new Date().toISOString().slice(0, 10),
        wallet_transactions: defaultWalletTransactions,
        withdraw_requests:   [],
        subscription_plan:   null,
        payment_history:     [],
        settings:            defaultSettings,
      });

      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return { ok: true, user: newUser };
    } catch (_err) {
      return { ok: false, message: 'Registration failed. Please try again.' };
    }
  },

  saveUserFromApi: async ({ id, name, mobile, email, password = '', state = '' }) => {
    try {
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      if (!normalizedEmail) return { ok: false, message: 'Email missing.' };

      const users = await getUsersFromStorage();
      const existing = users.find((u) => u.email === normalizedEmail);

      // ✅ FIX: agar user pehle se hai lekin id missing hai, to yahin patch kar do
      if (existing) {
        if (id && !(Number.isFinite(Number(existing.id)) && Number(existing.id) > 0)) {
          const patched = await UserStore.updateUser(normalizedEmail, { id });
          return { ok: true, user: patched || existing };
        }
        return { ok: true, user: existing };
      }

      const normalizedMobile = normalizeIndianMobileNumber(mobile || '');
      const my_referral_code = await generateUniqueReferralCode(users);

      const newUser = normalizeUser({
        id: id ?? null, // ✅ FIX: backend ka real numeric id ab yahan save hoga
        name,
        mobile: normalizedMobile,
        email: normalizedEmail,
        password,
        state,
        location_complete: false,
        role: 'free',
        is_subscribed: false,
        my_referral_code,
        referred_by: '',
        referral_code_used: '',
        referral_count: 0,
        join_date: new Date().toISOString().slice(0, 10),
        wallet_transactions: defaultWalletTransactions,
        withdraw_requests: [],
        subscription_plan: null,
        payment_history: [],
        settings: defaultSettings,
      });

      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return { ok: true, user: newUser };
    } catch (_err) {
      return { ok: false, message: 'Local sync failed.' };
    }
  },
   updateUser: async (email, updates) => {

    try {
      const data  = await AsyncStorage.getItem(USERS_KEY);
      const users = data ? JSON.parse(data) : [];
      // ✅ FIX: update bhi lowercase email se match karo
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      // ✅ FIX: agar updates.email naya email de raha hai, wahi final email banega
      // (pehle yaha hamesha purana normalizedEmail hi force ho jaata tha, isliye
      // email change kabhi save hi nahi hota tha)
      const finalEmail = updates.email
        ? String(updates.email).trim().toLowerCase()
        : normalizedEmail;
      let updatedUser = null;

      const updatedUsers = users.map((user) => {
        const userEmail = user.email ? user.email.trim().toLowerCase() : '';
        if (userEmail !== normalizedEmail) return user;
        const mergedReferralCount = updates.referral_count !== undefined
          ? Number(updates.referral_count)
          : Number(user.referral_count || 0);

        updatedUser = normalizeUser({
          ...user,
          ...updates,
          email: finalEmail, // ✅ naya email (agar diya gaya ho) ab save hoga
          referral_count: mergedReferralCount,
          my_referral_code: updates.my_referral_code || user.my_referral_code || generateUniqueReferralCode(users),
          rank: calculateRank(mergedReferralCount),
          wallet_transactions: normalizeWalletTransactions(updates.wallet_transactions !== undefined ? updates.wallet_transactions : user.wallet_transactions),
          withdraw_requests:   normalizeWithdrawRequests(updates.withdraw_requests !== undefined ? updates.withdraw_requests : user.withdraw_requests),
          subscription_plan:   normalizeSubscriptionPlan(updates.subscription_plan !== undefined ? updates.subscription_plan : user.subscription_plan),
          payment_history:     normalizePaymentHistory(updates.payment_history !== undefined ? updates.payment_history : user.payment_history),
          settings:            normalizeSettings(updates.settings !== undefined ? updates.settings : user.settings),
        });
        return updatedUser;
      });

      if (!updatedUser) return null;
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

      // ✅ FIX: email change hua toh session pointer (CURRENT_USER_KEY) bhi update karo,
      // warna agli baar getCurrentUser() purane email se dhoondega aur user record
      // "not found" ho jayega (login/profile silently reset ho sakta hai)
      if (finalEmail !== normalizedEmail) {
        const currentSessionEmail = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (currentSessionEmail && currentSessionEmail.trim().toLowerCase() === normalizedEmail) {
          await AsyncStorage.setItem(CURRENT_USER_KEY, finalEmail);
        }
      }

      return updatedUser;
    } catch { return null; }
  },
  activateBlueTickForCurrentUser: async () => {
    // Kept as a safe compatibility API for old navigation paths. A badge may
    // only come from a verified active "Premium Plan" subscription.
    return { ok: false, message: 'Blue tick is included only with an active Premium Plan.' };
  },

   completeLocationSetup: async (email, state, district = '', taluka = '', village = '') => {
    return await UserStore.updateUser(email, { state, district, taluka, village, location_complete: true });
  },

// ✅ FIX: setCurrentUser mein lowercase save karo
  setCurrentUser: async (email) => {
    try {
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      await AsyncStorage.setItem(CURRENT_USER_KEY, normalizedEmail);
      // ✅ FIX: login turant baad, jab token fresh hota hai, tabhi ek baar id resolve/save kar lo.
      // Isse like/dislike ke time dobara /profile hit karne ki zaroorat nahi padegi.
      UserStore.ensureUserId().catch(() => {});
      // Guest likes are queued locally until a real login/token is available.
      // Sync them only after login, never while the visitor is logged out.
      UserStore.syncGuestLikesToUser(normalizedEmail).catch(() => {});
      return true;
    } catch { return false; }
  },

  // ✅ FIX: guest (bina-login) local likes ab exist hi nahi karte — likes
  // purely API-based hain aur login ke bina like possible nahi. Ye function
  // ab sirf backward-compatibility ke liye no-op hai.
  syncGuestLikesToUser: async () => {},

  // UserStore ke andar, getCurrentUser ke paas add karo
// ensureUserId: async () => {
//   try {
//     const user = await UserStore.getCurrentUser();
//     if (!user) return null;
//     if (Number.isFinite(Number(user.id)) && Number(user.id) > 0) return user;

//     // id missing hai — profile se fetch karke repair karo
//     const profileRes = await AuthAPI.getProfile();
//     if (profileRes.ok && profileRes.user?.id) {
//       const updatedUser = await UserStore.updateUser(user.email, { id: profileRes.user.id });
//       return updatedUser || user;
//     }
//     return user;
//   } catch { return null; }
// },

  getCurrentUser: async () => {
    try {
      UserStore.syncCreditSubscriptionsFromBackend().catch(() => {});
      const email = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (!email) return null;
      // ✅ FIX: stored email bhi lowercase se match karo
      const normalizedEmail = email.trim().toLowerCase();
      const users = await getUsersFromStorage();
      let found = users.find((u) => u.email === normalizedEmail) || null;

         // ✅ FIX: agar local record missing hai (purana broken login), auto-repair karo
    if (!found) {
        const profileRes = await AuthAPI.getProfile();
        if (profileRes.ok && profileRes.user) {
          const apiUser = profileRes.user?.profile || profileRes.user;
          const syncResult = await UserStore.saveUserFromApi({
            name: `${apiUser.firstname || ''} ${apiUser.lastname || ''}`.trim() || apiUser.name || '',
            mobile: apiUser.mobile_no || apiUser.mobile || apiUser.phone || '',
            email: normalizedEmail,
            state: apiUser.state || '',
              id: apiUser.id,
          });
      if (syncResult.ok) {
  found = await UserStore.syncSubscriptionFromBackend(syncResult.user);
}
        }
      }

      // ✅ AUTO-EXPIRE: 30 din (ya jo bhi validity) nikal chuki ho to user ko
      // turant "common user" bana do — role/subscription sab reset ho jayega,
      // taaki premium wali koi bhi cheez ab lock ho jaaye aur common user ki
      // functionality apply ho jaaye.
      if (found && found.is_subscribed) {
        const expiresAt = found.subscription_plan?.expires_at;
        if (expiresAt) {
          const expiresTime = new Date(`${expiresAt}T23:59:59`).getTime();
          if (!Number.isNaN(expiresTime) && Date.now() > expiresTime) {
            found = await UserStore.updateUser(found.email, {
              is_subscribed: false,
              role: 'free',
              role_label: getRoleLabel('free'),
              subscription_type: 'free',
              subscription_plan: null,
              state_seat: null,
            }) || found;
          }
        }
      }

      return found;
    } catch { return null; }
  },

 ensureUserId: async () => {
  try {
    const user = await UserStore.getCurrentUser();
    console.log('[ensureUserId] getCurrentUser ->', JSON.stringify(user));
    if (!user) return null;
    if (Number.isFinite(Number(user.id)) && Number(user.id) > 0) return user;

  const profileRes = await AuthAPI.getProfile();
    console.log('[ensureUserId] getProfile ->', JSON.stringify(profileRes));
    const resolvedId = profileRes.user?.profile?.id || profileRes.user?.id;
    if (profileRes.ok && resolvedId) {
      const updatedUser = await UserStore.updateUser(user.email, { id: resolvedId });
      console.log('[ensureUserId] updateUser ->', JSON.stringify(updatedUser));
      return updatedUser || user;
    }
    return user;
  } catch (err) { console.log('[ensureUserId] ERROR', err); return null; }
},
  clearCurrentUser: async () => {
    try { await AsyncStorage.removeItem(CURRENT_USER_KEY); return true; }
    catch { return false; }
  },

  deleteCurrentUser: async () => {
    try {
      const email = await AsyncStorage.getItem(CURRENT_USER_KEY);
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      if (!normalizedEmail) return { ok: false, message: 'No account is logged in.' };

      const data = await AsyncStorage.getItem(USERS_KEY);
      const users = data ? JSON.parse(data) : [];
      const updatedUsers = users.filter((u) => String(u.email || '').trim().toLowerCase() !== normalizedEmail);

      if (updatedUsers.length === users.length) {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
        return { ok: false, message: 'Account not found.' };
      }

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Unable to delete account.' };
    }
  },

   setPendingRegistration: async (data = {}) => {
    try {
             const payload = {
        name: String(data.name || '').trim(),
        mobile: normalizeIndianMobileNumber(data.mobile || ''),
        email: String(data.email || '').trim().toLowerCase(),
        password: String(data.password || ''),
        referral_code_used: data.referral_code_used ? String(data.referral_code_used).trim() : '',
        profile_image: String(data.profile_image || ''),
        bio: String(data.bio || '').trim(),
        created_at: new Date().toISOString(),
      };
      if (!payload.email) return false;
      // ✅ Memory copy pehle — storage fail/late ho tab bhi Taluka/Village ko data mil jaye
      _pendingRegistrationMemory = payload;
      try { await AsyncStorage.setItem(PENDING_REG_KEY, JSON.stringify(payload)); }
      catch (e) { console.warn('[setPendingRegistration] storage write failed:', e?.message); }
      return true;
    } catch {
      return false;
    }
  },

  getPendingRegistration: async () => {
    try {
      let parsed = null;
      try {
        const raw = await AsyncStorage.getItem(PENDING_REG_KEY);
        if (raw) parsed = JSON.parse(raw);
      } catch {}
      // Storage me na mile to memory wali copy use karo
      if (!parsed || !parsed.email) parsed = _pendingRegistrationMemory;
      if (!parsed || !parsed.email) return null;
      return {
        ...parsed,
        email: String(parsed.email).trim().toLowerCase(),
      };
    } catch {
      return null;
    }
  },

  clearPendingRegistration: async () => {
    _pendingRegistrationMemory = null;
    try {
      await AsyncStorage.removeItem(PENDING_REG_KEY);
      return true;
    } catch {
      return false;
    }
  },

  getReferralSummary: async () => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return null;

      const users = await getUsersFromStorage();
      const directReferrals = users.filter((u) => u.referred_by === currentUser.email);
      const validReferrals = directReferrals.filter((u) => Boolean(u.referral_qualified || u.is_subscribed));
      const validCount = validReferrals.length;
      const currentTier = getReferralTier(validCount);
      const nextTier = getNextReferralTier(validCount);

      return {
        my_referral_code: currentUser.my_referral_code || '',
        referral_count:   validCount,
        total_referrals:  directReferrals.length,
        pending_referrals: Math.max(0, directReferrals.length - validCount),
        rank:             currentTier.rank,
        bonus:            currentTier.bonus,
        next_rank:        nextTier,
        tiers:            [...RANK_TIERS].reverse().filter((tier) => tier.rank !== 'Member'),
        direct_referrals: directReferrals.map((u) => ({
          name:      u.name,
          email:     u.email,
          join_date: u.join_date,
          rank:      u.rank,
          state:     u.state,
          qualified: Boolean(u.referral_qualified || u.is_subscribed),
          subscription: u.subscription_plan?.plan_name || '',
        })),
      };
    } catch { return null; }
  },

  getMyNetwork: async () => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return null;

     const users        = await getUsersFromStorage();
      const usersByEmail = new Map(users.map((u) => [u.email, u]));

      // ✅ FIX: sirf apna account aur wahi users dikhao jinhone tumhara referral
      // use kiya hai (referred_by === currentUser.email) — baaki sabhi app-wide
      // users pehle yahan bina filter ke aa jaate the.
           const downlineEmails = new Set([String(currentUser.email || '').trim().toLowerCase()]);
      for (let i = 0; i < 5; i++) {
        users.forEach((u) => {
          const parent = String(u.referred_by || '').trim().toLowerCase();
          if (parent && downlineEmails.has(parent)) {
            downlineEmails.add(String(u.email || '').trim().toLowerCase());
          }
        });
      }
      const rows = users
        .filter((user) => downlineEmails.has(String(user.email || '').trim().toLowerCase()))
        .map((user) => ({
          user_id:       user.email,
          name:          user.name || 'Unnamed User',
          mobile:        user.mobile || '-',
          state:         user.state || '-',
          rank:          user.rank || 'Member',
          role:          user.role || 'free',
          role_label:    getRoleLabel(user.role || 'free'),
          subscription_type: user.subscription_type || user.role || 'free',
          subscription_plan: user.subscription_plan || null,
          is_subscribed: hasActiveSubscription(user),
          referred_by:   user.referred_by || 'Direct Signup',
          level:         getLevelFromCurrentUser(user, currentUser, usersByEmail),
          join_date:     user.join_date || '2026-03-24',
               commission:    Number(user.total_commission || 0),
          isCurrentUser: user.email === currentUser.email,
        }))
        .sort((a, b) => {
          if (a.isCurrentUser) return -1;
          if (b.isCurrentUser) return 1;
          return a.name.localeCompare(b.name);
        });

        // ✅ Backend se wo log jinhone MERA referral code use kiya (dusre device ke bhi)
      let mergedRows = rows;
      try {
        const refRes = await AuthAPI.getReferrals();
        if (refRes?.ok) {
          const root = refRes.data?.data || refRes.data || {};
          const apiUsers = Array.isArray(root.referred_users) ? root.referred_users
            : Array.isArray(root.referrals) ? root.referrals
            : Array.isArray(root.users) ? root.users : [];
          const truthy = (v) => v === true || v === 1 || v === '1' || String(v || '').toLowerCase() === 'active';
          const seen = new Set();
          rows.forEach((r) => {
            const id = String(r.user_id || '').trim().toLowerCase();
            const mob = String(r.mobile || '').replace(/\D/g, '').slice(-10);
            if (id) seen.add(id);
            if (mob) seen.add(mob);
          });
          const extra = [];
                 if (apiUsers.length) console.log('[getMyNetwork] referred user sample:', JSON.stringify(apiUsers[0]));
          apiUsers.forEach((raw, idx) => {
            const u = { ...(raw?.user || raw?.referred_user || raw?.member || {}), ...raw };
            const email = String(u.email || u.email_address || '').trim().toLowerCase();
            const mobile = String(u.phone || u.mobile || u.mobile_number || u.mobile_no || '').replace(/\D/g, '').slice(-10);
            if ((email && seen.has(email)) || (mobile && seen.has(mobile))) return;
            const fullName = String(
              u.name || u.full_name || u.fullname || u.user_name || u.username ||
              [u.firstname || u.first_name, u.middlename || u.middle_name, u.lastname || u.last_name].filter(Boolean).join(' ') || ''
            ).trim() || 'Unnamed User';
            const role = u.role || u.subscription_type || 'free';
            extra.push({
              user_id:       email || `api-${u.id ?? idx}`,
              name:          fullName,
              mobile:        mobile || '-',
              state:         u.state || '-',
              rank:          u.rank || 'Member',
              role,
              role_label:    getRoleLabel(role),
              subscription_type: u.subscription_type || role,
              subscription_plan: u.subscription_plan || null,
              is_subscribed: truthy(u.is_subscribed ?? u.subscribed ?? u.has_subscription ?? u.status),
              referred_by:   currentUser.email,
              level:         String(u.level || '1'),
              join_date:     String(u.created_at || u.join_date || '').slice(0, 10) || '-',
              commission:    Number(u.commission ?? u.total_commission ?? 0) || 0,
              isCurrentUser: false,
            });
          });
          extra.sort((a, b) => a.name.localeCompare(b.name));
          mergedRows = [...rows, ...extra];
        }
      } catch (e) {
        console.warn('[getMyNetwork] backend referred_users failed:', e);
      }

      return {
        currentUser,
        totalMembers:  mergedRows.length,
        linkedMembers: mergedRows.filter((r) => r.level !== '-' && !r.isCurrentUser).length,
        rows: mergedRows,
      };
    } catch { return null; }
  },
  getWalletSummary: async () => {
    try {
      const [walletRes, txnRes] = await Promise.all([
        AuthAPI.getWalletApi(),
        AuthAPI.getWalletTransactionsApi({ perPage: 50 }),
      ]);
      if (!walletRes.ok || !walletRes.wallet) return null;
      const w = walletRes.wallet;
      const transactions = normalizeWalletTransactions(txnRes.ok ? txnRes.transactions : []);
      return {
        total_balance: w.withdrawable_balance || 0,
        total_credit:  w.total_earned || 0,
        total_debit:   Math.max((w.total_earned || 0) - (w.withdrawable_balance || 0) - (w.pending_commission || 0), 0),
        transactions,
        wallet: w,
      };
    } catch { return null; }
  },

  getWithdrawSummary: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      const [walletRes, withdrawalsRes] = await Promise.all([
        AuthAPI.getWalletApi(),
        AuthAPI.getWalletWithdrawalsApi({ perPage: 100 }),
      ]);
      if (!walletRes.ok || !walletRes.wallet) return null;
      const wallet = walletRes.wallet;
      const requests = normalizeWithdrawRequests(withdrawalsRes.ok ? withdrawalsRes.requests : [])
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return { currentUser: user, wallet, available_balance: wallet.withdrawable_balance || 0, requests };
    } catch { return null; }
  },

  createWithdrawRequest: async (payload) => {
    try {
      const res = await AuthAPI.createWithdrawalApi(payload);
      if (!res.ok) return { ok: false, message: res.message, errors: res.errors };
      return { ok: true, request: res.withdrawal, wallet: res.wallet };
    } catch { return { ok: false, message: 'Unable to create withdrawal request.' }; }
  },

  cancelWithdrawRequest: async (id) => {
    try {
      const res = await AuthAPI.cancelWithdrawalApi(id);
      if (!res.ok) return { ok: false, message: res.message };
      return { ok: true, wallet: res.wallet };
    } catch { return { ok: false, message: 'Unable to cancel withdrawal request.' }; }
  },

// ✅ FIX: Backend se subscription ki real truth fetch karke local storage sync karo
  // Isse "buy karne ke baad bhi subscribe maang raha hai" wala mismatch bug fix hoga
syncRoleSubscriptionV3: async (existingUser) => {
    try {
      const user = existingUser || await UserStore.getCurrentUser();
      if (!user) return null;

      const toList = (r) => {
        if (!r) return [];
        if (Array.isArray(r)) return r;
        if (typeof r === 'object') {
          const inner = r.user_subscriptions || r.subscriptions || r.data || r.role_subscriptions || r.items;
          if (Array.isArray(inner)) return inner;
          if (inner && typeof inner === 'object') return [inner];
          return [r];
        }
        return [];
      };

      const [roleRes, allRes] = await Promise.all([
        AuthAPI.getMyRoleSubscriptions(),
        AuthAPI.getMySubscriptions(),
      ]);
      if (!roleRes?.ok && !allRes?.ok) return user;

      const roleList = roleRes?.ok ? toList(roleRes.subscriptions) : [];
      const allList = allRes?.ok
        ? toList(allRes.subscriptions).filter((s) =>
            /role|member|premium/.test(String(s.type || s.category || s.subscription_type || s.plan_type || s.module || '').toLowerCase()))
        : [];
      const subs = [...roleList, ...allList];
      console.log('[syncRoleSubscriptionV3] role list:', JSON.stringify(roleRes?.subscriptions), '| combined list:', JSON.stringify(allRes?.subscriptions));

      const num = (...vals) => {
        for (const v of vals) {
          if (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) return Number(v);
        }
        return null;
      };
      const LIVE_WORDS = ['active', 'success', 'paid'];
      const DEAD_WORDS = ['expired', 'inactive', 'cancelled', 'canceled', 'failed', 'refunded'];
      const isExpiredByDate = (s) => {
        const exp = s.expires_at || s.expiry || s.end_date;
        if (!exp) return false;
        const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
        return Number.isFinite(t) && Date.now() > t;
      };
      const stateOf = (s = {}) => {
        const st = String(s.status ?? '').toLowerCase();
        if (DEAD_WORDS.includes(st) || isExpiredByDate(s)) return 'dead';
        const ps = s.payment_status;
        const hasPs = ps !== undefined && ps !== null && ps !== '';
        if (hasPs && Number(ps) !== 1 && !LIVE_WORDS.includes(st)) return 'pending';
        return 'live';
      };
      const stampOf = (s = {}) => String(s.purchased_at || s.created_at || '');
      const activeSub = subs.filter((s) => stateOf(s) === 'live').sort((a, b) => stampOf(b).localeCompare(stampOf(a)))[0];

      if (!activeSub) {
        const boughtAt = new Date(user.subscription_plan?.purchased_at || 0).getTime();
        const isFresh = Number.isFinite(boughtAt) && (Date.now() - boughtAt) < 10 * 60 * 1000;
        const allDead = subs.length > 0 && subs.every((s) => stateOf(s) === 'dead');
        if (allDead && user.is_subscribed && !isFresh) {
          const downgraded = await UserStore.updateUser(user.email, {
            is_subscribed: false,
            role: 'free',
            role_label: getRoleLabel('free'),
            subscription_type: 'free',
            subscription_plan: null,
            state_seat: null,
          });
          return downgraded || user;
        }
        return user;
      }

      if (!cachedBackendPlans.length) {
        try {
          const plansRes = await AuthAPI.getRoleSubscriptionPlans(user.id);
          if (plansRes.ok && Array.isArray(plansRes.plans)) {
            cachedBackendPlans = plansRes.plans.map(normalizeBackendPlan);
          }
        } catch (e) { /* ignore */ }
      }

      const nested = [activeSub.plan, activeSub.role_subscription_plan, activeSub.subscription_plan, activeSub.subscriptionPlan]
        .find((o) => o && typeof o === 'object') || {};
      const local = user.subscription_plan;
      const planIdRaw = activeSub.plan_id ?? activeSub.role_subscription_plan_id ?? activeSub.subscription_plan_id ?? nested.id ?? activeSub.id;
      const localPlanId = getLocalPlanIdFromBackendId(planIdRaw);
      const nameHint = activeSub.plan_name || activeSub.title || activeSub.name || nested.title || nested.plan_name || nested.name || '';

      // plan dhoondo: pehle user-filtered cache me, phir bina filter wali poori list me, phir naam se
      const findPlan = () => {
        for (const pool of [cachedBackendPlans, roleLookupPlans]) {
          const hit = (localPlanId && pool.find((p) => Number(p.plan_id) === localPlanId))
            || (nameHint && pool.find((p) => String(p.plan_name).trim().toLowerCase() === String(nameHint).trim().toLowerCase()));
          if (hit) return hit;
        }
        return null;
      };
      let matchedPlan = findPlan();
      if (!matchedPlan) {
        try {
          const allPlansRes = await AuthAPI.getRoleSubscriptionPlans(); // bina user filter
          if (allPlansRes.ok && Array.isArray(allPlansRes.plans)) {
            roleLookupPlans = allPlansRes.plans.map(normalizeBackendPlan);
            matchedPlan = findPlan();
          }
        } catch (e) { /* ignore */ }
      }

      const days = num(activeSub.days, activeSub.validity_days, activeSub.duration_days, nested.days, matchedPlan?.validity_days) || 30;
      const today = new Date().toISOString().slice(0, 10);
      const purchasedAt = String(
        activeSub.purchased_at || activeSub.start_date || activeSub.created_at || local?.purchased_at || today
      ).slice(0, 10);
      const expiresAt = String(activeSub.expires_at || activeSub.expiry || activeSub.end_date || '').slice(0, 10)
        || addDaysToDateString(purchasedAt, days);

      const localName = local?.plan_name && local.plan_name !== 'Subscription Plan' ? local.plan_name : '';
      const planName = matchedPlan?.plan_name || nameHint || localName || 'Subscription Plan';
      const newRole = matchedPlan?.role || getRoleFromPlanName(planName);

      // price: plan ka price -> backend ka paid amount -> is device ki payment history -> purana local
      const paidLocal = (Array.isArray(user.payment_history) ? user.payment_history : [])
        .filter((h) => h.module === 'role' && String(h.status).toLowerCase() === 'success'
          && (!localPlanId || String(h.plan_id) === String(localPlanId)))
        .slice(-1)[0];
      // ✅ Priority: backend ka ASLI paid amount pehle (taaki Android/iOS/Web sab par same dikhe),
      // phir plan ka offer price, phir baaki. Device-local values sabse last.
      const price = [
        activeSub.paid_amount, activeSub.amount, activeSub.total_amount, activeSub.final_price,
        matchedPlan?.price, activeSub.offer_price, nested.offer_price, activeSub.price, nested.price,
        paidLocal?.amount, local?.price,
      ].map(Number).find((n) => Number.isFinite(n) && n > 0) ?? 0;

      // roles (designations) — role_id comma-separated (1-6)
      const roleIdRaw = String(matchedPlan?.role_id_raw || activeSub.role_id || nested.role_id || local?.role_id_raw || '');

      const unchanged = user.is_subscribed && user.role === newRole && local
        && String(local.plan_id) === String(localPlanId ?? planIdRaw ?? local.plan_id)
        && String(local.purchased_at || '').slice(0, 10) === purchasedAt
        && String(local.expires_at || '').slice(0, 10) === expiresAt
        && Number(local.price) > 0 && Boolean(localName)
        && (!roleIdRaw || String(local.role_id_raw || '') === roleIdRaw);
      if (unchanged) return user;

      const mergedPlan = {
        ...(matchedPlan || {}),
        plan_id: localPlanId ?? planIdRaw ?? local?.plan_id,
        plan_name: planName,
        price,
        duration: `${days} Days`,
        validity_days: days,
        role: newRole,
         role_id_raw: roleIdRaw,
        is_premium: Boolean(matchedPlan?.is_premium ?? nested.is_premium ?? activeSub.is_premium),
        purchased_at: purchasedAt,
        expires_at: expiresAt,
      };

      const updatedUser = await UserStore.updateUser(user.email, {
        subscription_plan: mergedPlan,
        subscription_type: newRole,
        role: newRole,
        role_label: getRoleLabel(newRole),
        is_subscribed: true,
      });
      return updatedUser || user;
    } catch (err) {
      console.warn('[syncRoleSubscriptionV3] failed:', err);
      return await UserStore.getCurrentUser();
    }
  },

  syncRoleSubscriptionV2: async (existingUser) => {
    return UserStore.syncRoleSubscriptionV3(existingUser);
  },

  // ⚠️ purana version — ab use nahi hota, delete kar sakte ho
  _unusedV2Sync: async (existingUser) => {
    try {
      const user = existingUser || await UserStore.getCurrentUser();
      if (!user) return null;

      // response kisi bhi shape me ho — array / {data:[..]} / {data:{..}} / single object
      const toList = (r) => {
        if (!r) return [];
        if (Array.isArray(r)) return r;
        if (typeof r === 'object') {
          const inner = r.user_subscriptions || r.subscriptions || r.data || r.role_subscriptions || r.items;
          if (Array.isArray(inner)) return inner;
          if (inner && typeof inner === 'object') return [inner];
          return [r];
        }
        return [];
      };

      // dono endpoints try karo: /my-role-subscriptions aur combined /my-subscriptions (type=role)
      const [roleRes, allRes] = await Promise.all([
        AuthAPI.getMyRoleSubscriptions(),
        AuthAPI.getMySubscriptions(),
      ]);
      if (!roleRes?.ok && !allRes?.ok) return user; // network/auth problem — local jaisa hai waisa rehne do

      const roleList = roleRes?.ok ? toList(roleRes.subscriptions) : [];
      const allList = allRes?.ok
        ? toList(allRes.subscriptions).filter((s) =>
            /role|member|premium/.test(String(s.type || s.category || s.subscription_type || s.plan_type || s.module || '').toLowerCase()))
        : [];
      const subs = [...roleList, ...allList];
      console.log('[syncRoleSubscriptionV2] role list:', JSON.stringify(roleRes?.subscriptions), '| combined list:', JSON.stringify(allRes?.subscriptions));

      const num = (...vals) => {
        for (const v of vals) {
          if (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) return Number(v);
        }
        return null;
      };
      const LIVE_WORDS = ['active', 'success', 'paid'];
      const DEAD_WORDS = ['expired', 'inactive', 'cancelled', 'canceled', 'failed', 'refunded'];
      const isExpiredByDate = (s) => {
        const exp = s.expires_at || s.expiry || s.end_date;
        if (!exp) return false;
        const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
        return Number.isFinite(t) && Date.now() > t;
      };
      // 'live' | 'pending' | 'dead'
      const stateOf = (s = {}) => {
        const st = String(s.status ?? '').toLowerCase();
        if (DEAD_WORDS.includes(st) || isExpiredByDate(s)) return 'dead';
        const ps = s.payment_status;
        const hasPs = ps !== undefined && ps !== null && ps !== '';
        if (hasPs && Number(ps) !== 1 && !LIVE_WORDS.includes(st)) return 'pending';
        return 'live';
      };
      const stampOf = (s = {}) => String(s.purchased_at || s.created_at || '');
      const activeSub = subs.filter((s) => stateOf(s) === 'live').sort((a, b) => stampOf(b).localeCompare(stampOf(a)))[0];

      if (!activeSub) {
        // sirf tab downgrade karo jab backend me entries hon aur SAB clearly expire/cancel ho chuki hon.
        // Khaali list, pending, ya samajh na aane wali response pe kabhi downgrade nahi.
        const boughtAt = new Date(user.subscription_plan?.purchased_at || 0).getTime();
        const isFresh = Number.isFinite(boughtAt) && (Date.now() - boughtAt) < 10 * 60 * 1000;
        const allDead = subs.length > 0 && subs.every((s) => stateOf(s) === 'dead');
        if (allDead && user.is_subscribed && !isFresh) {
          const downgraded = await UserStore.updateUser(user.email, {
            is_subscribed: false,
            role: 'free',
            role_label: getRoleLabel('free'),
            subscription_type: 'free',
            subscription_plan: null,
            state_seat: null,
          });
          return downgraded || user;
        }
        return user;
      }

      // plans cache khaali ho (naya device / fresh login) to pehle plans laao
      if (!cachedBackendPlans.length) {
        try {
          const plansRes = await AuthAPI.getRoleSubscriptionPlans(user.id);
          if (plansRes.ok && Array.isArray(plansRes.plans)) {
            cachedBackendPlans = plansRes.plans.map(normalizeBackendPlan);
          }
        } catch (e) { /* plans na mile to bhi backend ke data se plan bana lenge */ }
      }

      const planIdRaw = activeSub.plan_id ?? activeSub.role_subscription_plan_id ?? activeSub.subscription_plan_id ?? activeSub.id;
      const localPlanId = getLocalPlanIdFromBackendId(planIdRaw);
      const matchedPlan = localPlanId ? (cachedBackendPlans.find((p) => Number(p.plan_id) === localPlanId) || null) : null;

      const days = num(activeSub.days, activeSub.validity_days, activeSub.duration_days, matchedPlan?.validity_days) || 30;
      const today = new Date().toISOString().slice(0, 10);
      const purchasedAt = String(
        activeSub.purchased_at || activeSub.start_date || activeSub.created_at || user.subscription_plan?.purchased_at || today
      ).slice(0, 10);
      const expiresAt = String(activeSub.expires_at || activeSub.expiry || activeSub.end_date || '').slice(0, 10)
        || addDaysToDateString(purchasedAt, days);
      const planName = matchedPlan?.plan_name || activeSub.plan_name || activeSub.title || activeSub.name
        || activeSub.plan?.title || user.subscription_plan?.plan_name || 'Subscription Plan';
      const newRole = matchedPlan?.role || getRoleFromPlanName(planName);

      const local = user.subscription_plan;
      const unchanged = user.is_subscribed && user.role === newRole && local
        && String(local.plan_id) === String(localPlanId ?? planIdRaw ?? local.plan_id)
        && String(local.purchased_at || '').slice(0, 10) === purchasedAt
        && String(local.expires_at || '').slice(0, 10) === expiresAt;
      if (unchanged) return user;

      const mergedPlan = {
        ...(matchedPlan || {}),
        plan_id: localPlanId ?? planIdRaw ?? local?.plan_id,
        plan_name: planName,
        price: matchedPlan?.price ?? num(activeSub.price, activeSub.amount, activeSub.plan?.price, local?.price) ?? 0,
        duration: `${days} Days`,
        validity_days: days,
        role: newRole,
        purchased_at: purchasedAt,
        expires_at: expiresAt,
      };

      const updatedUser = await UserStore.updateUser(user.email, {
        subscription_plan: mergedPlan,
        subscription_type: newRole,
        role: newRole,
        role_label: getRoleLabel(newRole),
        is_subscribed: true,
      });
      return updatedUser || user;
    } catch (err) {
      console.warn('[syncRoleSubscriptionV2] failed:', err);
      return await UserStore.getCurrentUser();
    }
  },

  syncSubscriptionFromBackend: async (existingUser) => {
    return UserStore.syncRoleSubscriptionV2(existingUser);
  },

  // ⚠️ purana version — ab use nahi hota, delete kar sakte ho
  _unusedOldSyncSubscription: async (existingUser) => {
    try {
      const user = existingUser || await UserStore.getCurrentUser();
      if (!user) return null;

      const res = await AuthAPI.getMyRoleSubscriptions();
      if (!res.ok) return user;

      // response kisi bhi shape me ho (array / {data:[..]} / single object) — sab handle
      let raw = res.subscriptions;
      if (raw && !Array.isArray(raw)) raw = raw.subscriptions || raw.data || raw.role_subscriptions || [raw];
      const subs = Array.isArray(raw) ? raw : [];
      console.log('[syncSubscriptionFromBackend] backend subs:', JSON.stringify(subs));

      const num = (...vals) => {
        for (const v of vals) {
          if (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) return Number(v);
        }
        return null;
      };
      const isLive = (s = {}) => {
        const st = String(s.status || '').toLowerCase();
        const paid = Number(s.payment_status) === 1 || ['active', 'success', 'paid'].includes(st);
        if (!paid) return false;
        const exp = s.expires_at || s.expiry || s.end_date;
        if (exp) {
          const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
          if (Number.isFinite(t) && Date.now() > t) return false;
        }
        return true;
      };
      const stampOf = (s = {}) => String(s.purchased_at || s.created_at || '');
      const activeSub = subs.filter(isLive).sort((a, b) => stampOf(b).localeCompare(stampOf(a)))[0];

      if (!activeSub) {
        // abhi kiya hua purchase (10 min ke andar) ho to backend delay ki wajah se downgrade mat karo
        const boughtAt = new Date(user.subscription_plan?.purchased_at || 0).getTime();
        const isFresh = Number.isFinite(boughtAt) && (Date.now() - boughtAt) < 10 * 60 * 1000;
        if (Array.isArray(raw) && user.is_subscribed && !isFresh) {
          const downgraded = await UserStore.updateUser(user.email, {
            is_subscribed: false,
            role: 'free',
            role_label: getRoleLabel('free'),
            subscription_type: 'free',
            subscription_plan: null,
            state_seat: null,
          });
          return downgraded || user;
        }
        return user;
      }

      // ✅ FIX: plans cache khaali ho (naya device / fresh login) to pehle plans laao,
      // warna matchedPlan null rehta tha aur subscription_plan null save ho jata tha
      if (!cachedBackendPlans.length) {
        try {
          const plansRes = await AuthAPI.getRoleSubscriptionPlans(user.id);
          if (plansRes.ok && Array.isArray(plansRes.plans)) {
            cachedBackendPlans = plansRes.plans.map(normalizeBackendPlan);
          }
        } catch (e) { /* plans na mile to bhi backend ke subscription data se plan bana lenge */ }
      }

      const planIdRaw = activeSub.plan_id ?? activeSub.role_subscription_plan_id ?? activeSub.subscription_plan_id;
      const localPlanId = getLocalPlanIdFromBackendId(planIdRaw);
      const matchedPlan = localPlanId ? (cachedBackendPlans.find((p) => Number(p.plan_id) === localPlanId) || null) : null;

      const days = num(activeSub.days, activeSub.validity_days, activeSub.duration_days, matchedPlan?.validity_days) || 30;
      const today = new Date().toISOString().slice(0, 10);
      const purchasedAt = String(
        activeSub.purchased_at || activeSub.start_date || activeSub.created_at || user.subscription_plan?.purchased_at || today
      ).slice(0, 10);
      const expiresAt = String(activeSub.expires_at || activeSub.expiry || activeSub.end_date || '').slice(0, 10)
        || addDaysToDateString(purchasedAt, days);
      const planName = matchedPlan?.plan_name || activeSub.plan_name || activeSub.title || activeSub.name
        || activeSub.plan?.title || user.subscription_plan?.plan_name || 'Subscription Plan';
      const newRole = matchedPlan?.role || getRoleFromPlanName(planName);

      const local = user.subscription_plan;
      const unchanged = user.is_subscribed && user.role === newRole && local
        && String(local.plan_id) === String(localPlanId ?? planIdRaw ?? local.plan_id)
        && String(local.purchased_at || '').slice(0, 10) === purchasedAt
        && String(local.expires_at || '').slice(0, 10) === expiresAt;
      if (unchanged) return user;

      const mergedPlan = {
        ...(matchedPlan || {}),
        plan_id: localPlanId ?? planIdRaw ?? local?.plan_id,
        plan_name: planName,
        price: matchedPlan?.price ?? num(activeSub.price, activeSub.amount, activeSub.plan?.price, local?.price) ?? 0,
        duration: `${days} Days`,
        validity_days: days,
        role: newRole,
        purchased_at: purchasedAt,
        expires_at: expiresAt,
      };

      const updatedUser = await UserStore.updateUser(user.email, {
        subscription_plan: mergedPlan,
        subscription_type: newRole,
        role: newRole,
        role_label: getRoleLabel(newRole),
        is_subscribed: true,
      });

      return updatedUser || user;
    } catch {
      return await UserStore.getCurrentUser();
    }
  },

  // ⚠️ purana version — ab use nahi hota (naya upar wala hai). Chaho to delete kar sakte ho.
  _oldSyncSubscriptionFromBackend: async (existingUser) => {
    try {
      const user = existingUser || await UserStore.getCurrentUser();
      if (!user) return null;

      const res = await AuthAPI.getMyRoleSubscriptions();
      if (!res.ok) return user;

      const subs = Array.isArray(res.subscriptions)
        ? res.subscriptions
        : (res.subscriptions ? [res.subscriptions] : []);

           const activeSub = subs.find(
        (s) => Number(s.payment_status) === 1 || String(s.status || '').toLowerCase() === 'active'
      );
      if (!activeSub) {
        // ✅ AUTO-EXPIRE: backend confirm karta hai ki ab koi active subscription
        // nahi hai — local user ko bhi turant common bana do.
        if (user.is_subscribed) {
          const downgraded = await UserStore.updateUser(user.email, {
            is_subscribed: false,
            role: 'free',
            role_label: getRoleLabel('free'),
            subscription_type: 'free',
            subscription_plan: null,
            state_seat: null,
          });
          return downgraded || user;
        }
        return user;
      }

      
      const localPlanId = getLocalPlanIdFromBackendId(activeSub.plan_id);
      if (!localPlanId) return user;

      // ✅ FIX: dummy array ki jagah cached backend plans se match karo
    const matchedPlan = cachedBackendPlans.find((p) => p.plan_id === localPlanId) || null;
      const newRole = matchedPlan ? matchedPlan.role : getRoleFromPlanName(activeSub.plan_name || activeSub.name || '');

      const backendExpiresAt = activeSub.expires_at || activeSub.expiry || null;
      const expiryUnchanged = !backendExpiresAt || backendExpiresAt === user.subscription_plan?.expires_at;
      if (user.role === newRole && user.is_subscribed && expiryUnchanged) return user;

      const mergedPlan = matchedPlan
        ? {
            ...matchedPlan,
            purchased_at: activeSub.purchased_at || activeSub.created_at || user.subscription_plan?.purchased_at || null,
            expires_at:   activeSub.expires_at   || activeSub.expiry     || user.subscription_plan?.expires_at   || null,
          }
        : user.subscription_plan;

      const updatedUser = await UserStore.updateUser(user.email, {
        subscription_plan: mergedPlan,
        subscription_type: newRole,
        role: newRole,
        role_label: getRoleLabel(newRole),
        is_subscribed: true,
      });

      return updatedUser || user;
    } catch {
      return await UserStore.getCurrentUser();
    }
  },   // 👈 YE COMMA hona chahiye, semicolon ya kuch aur nahi

// ✅ FIX: Ye asli getStateSeatSummary tha — pehle galti se naam badal gaya tha
   getStateSeatSummary: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;

      const state = String(user.state || '').trim();
      const current_seat = normalizeStateSeat(user.state_seat);

      // ✅ state minimum chahiye hi hai (state-level plans ke liye bhi)
      if (!state) {
        return {
          currentUser: user,
          state: '',
          current_seat,
          seats: STATE_SEAT_ROLES.map((role) => ({ ...role, status: 'disabled' })),
        };
      }

      const allocations = await getStateSeatAllocationsFromStorage();
      const now = Date.now();

      const seats = STATE_SEAT_ROLES.map((role) => {
        // ✅ "Pratinidhi" kabhi lock nahi hoti — hamesha available rahegi
        if (UNLIMITED_SEAT_IDS.includes(role.id)) {
          const status = current_seat?.seat_id === role.id ? 'mine' : 'available';
          return { ...role, status };
        }

        // ✅ FIX: is role ka jo plan admin ne banaya hai, uske apne
        // state/district/taluka fields se decide hoga lock kis level par hai
        const matchedPlan = findPlanForSeat(role.id, user);
        const scopeKey = getPlanSeatScopeKey(matchedPlan, user);
        if (!scopeKey) {
          return { ...role, status: current_seat?.seat_id === role.id ? 'mine' : 'available' };
        }

        const scopeAlloc = allocations[scopeKey] && typeof allocations[scopeKey] === 'object'
          ? allocations[scopeKey]
          : {};
        const entry = scopeAlloc?.[role.id] || null;
        const expiresAt = entry?.expires_at ? new Date(entry.expires_at).getTime() : null;
        const isExpired = expiresAt !== null && !Number.isNaN(expiresAt) && expiresAt < now;
        const takenBy = (!isExpired && entry?.email) ? String(entry.email).trim().toLowerCase() : '';
        const status = takenBy
          ? (takenBy === user.email ? 'mine' : 'taken')
          : 'available';
        return { ...role, status };
      });

      return { currentUser: user, state, current_seat, seats };
    } catch { return null; }
  },

   // ✅ FAST: active plan sirf local saved user se (koi network call nahi) — screen turant dikha sake.
   // Fresh data baad me getSubscriptionSummary() se aata hai.
   getActivePlanQuick: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      return {
        currentUser: user,
        activePlan: UserStore.buildActivePlan(user, cachedBackendPlans),
        plans: cachedBackendPlans,
        currentRole:      user.role || 'free',
        currentRoleLabel: getRoleLabel(user.role || 'free'),
      };
    } catch { return null; }
   },

   buildActivePlan: (user, plans = []) => {
          if (!hasActiveSubscription(user)) return null;
          const ap = normalizeSubscriptionPlan(user.subscription_plan);
          if (!ap) return null;
          const known = [...plans, ...roleLookupPlans].find((p) => String(p.plan_id) === String(ap.plan_id));
          const roleIdRaw = user.subscription_plan?.role_id_raw || ap.role_id_raw || known?.role_id_raw || '';
          const roleNamesStr = UserStore.getSeatRoleNameForPlanRoleId(roleIdRaw);
          const genericName = !ap.plan_name || ap.plan_name === 'Subscription Plan';
          return {
            ...ap,
            plan_name: genericName ? (known?.plan_name || ap.plan_name) : ap.plan_name,
            price: Number(ap.price) > 0 ? ap.price : (known?.price ?? ap.price),
            duration: ap.duration || known?.duration || '',
            credits: Number(ap.credits ?? 0) || Number(known?.credits ?? 0),
            features: ap.features?.length ? ap.features : (known?.features || []),
            role_id_raw: roleIdRaw,
            role_names: roleNamesStr ? roleNamesStr.split(', ') : [],
          };
   },

   // opts.skipSync = true => backend sync chhod do (filter badalne par baar baar sync ki zaroorat nahi)
   getSubscriptionSummary: async (loc = {}, opts = {}) => {
    try {
    const baseUser = await UserStore.getCurrentUser();
    const user = opts.skipSync ? baseUser : await UserStore.syncSubscriptionFromBackend(baseUser);
      if (!user) return null;

      // ✅ FIX: dummy array ki jagah ab real plans backend se fetch honge
      // ✅ is_sold har baar fresh chahiye (location/hold ke hisaab se badalta hai) — cache skip
      let plans = [];
      {
       const plansRes = await AuthAPI.getRoleSubscriptionPlans(user.id, loc);
        if (plansRes.ok && Array.isArray(plansRes.plans)) {
          plans = plansRes.plans.map(normalizeBackendPlan);
          cachedBackendPlans = plans; // ✅ cache kar liya taaki baar baar fetch na ho
        } else {
                  console.warn('[getSubscriptionSummary] Plans fetch failed:', plansRes.message);
          plans = cachedBackendPlans;
        }
      }

           // ✅ Ab har user ko sabhi states/districts/talukas ke plans dikhenge —
      // user kisi bhi location ka subscription browse aur purchase kar sakta hai.
      return {
        currentUser: user,
activePlan:  UserStore.buildActivePlan(user, plans),
        plans: plans,
        currentRole:      user.role || 'free',
        currentRoleLabel: getRoleLabel(user.role || 'free'),
      };
    } catch { return null; }
  },
  
  getPaymentSummary: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      return { currentUser: user, pending_order: null, payment_history: normalizePaymentHistory(user.payment_history) };
    } catch { return null; }
  },

  // Backend ki single Payment History API (Role/Ads/Ecom/Quiz) — GET /payment-history
  getPaymentHistory: async (params = {}) => AuthAPI.getPaymentHistory(params),

  // News free-limit ab SIRF backend enforce karta hai (POST /news => 403 NEWS_LIMIT_REACHED).
  // Yahan sirf backend ki last-known `free_posts_remaining` value cache hoti hai (UI hint ke liye).
  // number => free user ke kitne posts bache, null => subscriber / unknown.
  setNewsFreePostsRemaining: async (value) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user?.email) return null;
      const next = value === null || value === undefined || !Number.isFinite(Number(value))
        ? null
        : Math.max(0, Number(value));
      if ((user.free_news_credits ?? null) === next) return next;
      await UserStore.updateUser(user.email, { free_news_credits: next });
      return next;
    } catch { return null; }
  },

createPaymentOrder: async ({ plan_id, seat_state, seat_district = '', seat_taluka = '', seat_village = '', seat_role_id }) => {
  try {
    console.log('[DEBUG createPaymentOrder] called with:', { plan_id, seat_state, seat_district, seat_taluka, seat_village, seat_role_id });
    const user = await UserStore.getCurrentUser();
    if (!user) { console.log('[DEBUG createPaymentOrder] BLOCKED: no user'); return null; }

    const backendPlanId = getBackendPlanId(plan_id);
    if (!backendPlanId) { console.log('[DEBUG createPaymentOrder] BLOCKED: bad plan_id ->', plan_id); return null; }

    // You need an AuthAPI method that hits your backend's
    // "create role-subscription razorpay order" endpoint,
    // mirroring createAdSubscriptionOrder / createEcomSubscriptionOrder.
   const seatMeta = getStateSeatRole(seat_role_id);
   console.log('[DEBUG createPaymentOrder] seatMeta ->', seatMeta, 'seat_role_id ->', seat_role_id);
   // ✅ FIX: pehle sirf seat ka naam (string) backend ko jaata tha, jisse
   // backend yeh pata hi nahi laga sakta tha ki yeh seat kis district/
   // taluka/village ke liye lock karni hai — ab full location + designation
   // id bhi bhej rahe hain taaki backend par seat-uniqueness check ho sake.
   // ✅ Premium plan par seat lock nahi hota — sirf plan_id jaayega
   const planForOrder = cachedBackendPlans.find((p) => p.plan_id === plan_id);
   const orderResult = await AuthAPI.purchaseRoleSubscription({
     planId: backendPlanId,
     isPremium: isPremiumPlan(planForOrder),
     state: seat_state || '',
     district: seat_district || '',
     taluka: seat_taluka || '',
     village: seat_village || '',
   });
   console.log('[DEBUG createPaymentOrder] orderResult ->', orderResult);
      // ✅ 409 seat_unavailable yahin ruk jaata hai — Razorpay checkout khulega hi nahi
      if (!orderResult?.ok) {
        return {
          error: true,
          seatUnavailable: Boolean(orderResult?.seatUnavailable),
          message: orderResult?.message || 'Unable to create order.',
        };
      }
    const activePlan = cachedBackendPlans.find((p) => p.plan_id === plan_id) || defaultActiveSubscription;

    return {
      order_id:     orderResult.razorpay.order_id,
      amount:       orderResult.razorpay.amount,
      plan_id:      activePlan.plan_id,
      plan_name:    activePlan.plan_name,
      duration:     activePlan.duration,
      role:         activePlan.role || getRoleFromPlanId(activePlan.plan_id),
      seat_state:   seat_state || '',
      seat_district: seat_district || '',
      seat_taluka:  seat_taluka || '',
      seat_village: seat_village || '',
      seat_role_id: seat_role_id || '',
      razorpay:     orderResult.razorpay, // { key, order_id, amount, currency }
      seat:         orderResult.seat || null, // reserved_until yahan milega (Premium par null)
    };
  } catch { return null; }
},

// ✅ NEW: payment fail / cancel — reserved seat turant release karne ke liye.
// module 'role' -> /role-subscriptions/payment/failed
// baaki (ads / ecom / quiz) -> purana shared /subscriptions/payment/failed
markPaymentFailed: async (razorpay_order_id, error_code, error_description, module = 'shared') => {
  try {
    if (!razorpay_order_id) return { ok: false };
    const payload = { razorpay_order_id, error_code, error_description };
    if (module === 'role') return await AuthAPI.markRoleSubscriptionPaymentFailed(payload);
    if (module === 'quiz') return await AuthAPI.markQuizSubscriptionPaymentFailed(payload);
    return await AuthAPI.markSubscriptionPaymentFailed(payload);
  } catch (err) {
    console.error('[UserStore.markPaymentFailed] Error:', err);
    return { ok: false };
  }
},


verifyPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id, seat_state, seat_role_id, plan: passedPlan }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };

      // ✅ Real verify — signature backend pe check hoti hai
      const verifyRes = await AuthAPI.verifyRoleSubscriptionPayment({
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
      });
      if (!verifyRes?.ok) {
        // ✅ seatUnavailable aage pass karo (409) taaki screen us plan ko Sold mark kar sake
        return {
          ok: false,
          seatUnavailable: Boolean(verifyRes?.seatUnavailable),
          message: verifyRes?.message || 'Payment verification failed.',
        };
      }

// ✅ FIX: pehle screen se passed asli plan use karo — cache lookup pe depend
      // mat karo (wo khaali ho sakta hai aur silently 'Basic Access' fallback deta
      // tha, jisse "premium" naam kho jaata tha aur role galat set hota tha)
      const basePlan = passedPlan
        || cachedBackendPlans.find((p) => p.plan_id === plan_id)
        || defaultActiveSubscription;
      // ✅ NEW: purchase date + expiry set karo (Ads/Ecom subscription jaisa hi pattern)
      // The verification response is authoritative: seat expiry is assigned
      // by the server only after payment has been verified.
      const verifiedData = verifyRes.data || {};
      const verifiedSubscription = verifiedData.subscription
        || verifiedData.role_subscription
        || verifiedData.data
        || {};
      const verifiedSeat = verifiedData.seat || verifiedSubscription.seat || null;
      const today = new Date().toISOString().slice(0, 10);
      const verifiedPurchasedAt = verifiedSubscription.purchased_at
        || verifiedSubscription.start_date
        || verifiedSubscription.created_at
        || verifiedData.purchased_at
        || today;
      const verifiedExpiresAt = verifiedSeat?.expires_at
        || verifiedSubscription.expires_at
        || verifiedSubscription.expiry
        || verifiedSubscription.end_date
        || verifiedData.expires_at
        || null;
      const activePlan = {
        ...basePlan,
        purchased_at: String(verifiedPurchasedAt).slice(0, 10),
        expires_at: verifiedExpiresAt || basePlan.expires_at || addDaysToDateString(today, Number(basePlan.validity_days || 30)),
      };
      const newRole = activePlan.role || getRoleFromPlanName(activePlan.plan_name || '');
      // ✅ FIX: signature verify ho chuka hai matlab payment pakka successful hai —
      // is_subscribed turant TRUE karo, backend ke GET /my-role-subscriptions ka
      // wait mat karo (uska delay hi "purchase kar liya phir bhi dobara maang raha
      // hai" wale bug ki asli wajah tha)
          const rolePayment = {
        order_id:   razorpay_order_id || `ORD_ROLE_${Date.now()}`,
        payment_id: razorpay_payment_id || `PAY_ROLE_${Date.now()}`,
        amount:     Number(activePlan.price || 0),
        status:     'success',
        date:       today,
        plan_id:    activePlan.plan_id,
        plan_name:  activePlan.plan_name,
        module:     'role',
        signature:  razorpay_signature || '',
      };

      let updatedUser = await UserStore.updateUser(user.email, {
        subscription_plan: activePlan,
        subscription_type: newRole,
        role: newRole,
        role_label: getRoleLabel(newRole),
        is_subscribed: true,
        // Role subscription ke baad free-limit hint stale ho jaata hai — clear karo.
        // (Backend har POST par live check karta hai, isliye extra flag nahi.)
        free_news_credits: null,
        payment_history: [...normalizePaymentHistory(user.payment_history), rolePayment],
      });
      // ✅ NEW: plan ke role_id (1-6) ko seat me map karke automatically assign karo —
      // koi manual seat-selection modal nahi chahiye, purchase hi seat de dega
        const allowedSeatIds = UserStore.getSeatIdsForRoleId(activePlan.role_id_raw);
        // agar checkout ke time koi specific role/seat select kiya tha (seat_role_id), usi ko priority do,
        // warna plan ke allowed roles me se pehla free seat use karo
        const mappedSeatId = allowedSeatIds.includes(seat_role_id) ? seat_role_id : allowedSeatIds[0];
      // The backend owns the actual role+location lock. Preserve this legacy
      // local allocation only for older responses that do not return a seat.
      if (mappedSeatId && !verifiedSeat) {
        // ✅ FIX: activePlan pass karo taaki iski apni state/district/taluka
        // scope se hi lock decide ho, sirf taluka-level assume na kare
        const seatResult = await UserStore.saveSelectedSeat(mappedSeatId, activePlan);
        if (seatResult?.ok) {
          updatedUser = await UserStore.getCurrentUser();
        }
      }

      // Best-effort refresh — fail bhi ho jaye to koi farak nahi, is_subscribed already TRUE hai
      const syncedUser = await UserStore.syncSubscriptionFromBackend();
      updatedUser = syncedUser || updatedUser;

      return { ok: true, role_label: getRoleLabel(newRole), user: updatedUser };
    } catch (err) {
      console.error('[UserStore.verifyPayment] Error:', err);
      return { ok: false, message: 'Something went wrong during verification.' };
    }
  },
  // verifyPayment: async ({ payment_id, order_id, signature, plan_id, seat_state, seat_role_id }) => {
  //   let allocationsBefore = null;
  //   try {
  //     const user = await UserStore.getCurrentUser();
  //     if (!user) return { ok: false, message: 'Please login again.' };

  //     // const today      = new Date().toISOString().slice(0, 10);
  //     // const activePlan = defaultSubscriptionPlans.find((p) => p.plan_id === plan_id) || defaultActiveSubscription;
  //     // const newRole    = getRoleFromPlanId(plan_id);
  //     // const newSubscriptionType = newRole;

  //    const today      = new Date().toISOString().slice(0, 10);
  //     // ✅ FIX: cached backend plans se match karo, dummy array se nahi
  //     const activePlan = cachedBackendPlans.find((p) => p.plan_id === plan_id) || defaultActiveSubscription;
  //     const newRole    = activePlan.role || getRoleFromPlanName(activePlan.plan_name || '');
  //     const newSubscriptionType = newRole;

  //     // ✅ FIX: Backend Sync — real server pe subscription activate karo, sirf local nahi
  //     const backendPlanId = getBackendPlanId(plan_id);
  //     if (backendPlanId) {
  //       const backendRes = await AuthAPI.purchaseRoleSubscription({
  //         planId: backendPlanId,
  //         paymentStatus: 1,
  //         transaction: payment_id || order_id || `TXN-${Date.now()}`,
  //       });
  //       if (!backendRes.ok) {
  //         return { ok: false, message: backendRes.message || 'Subscription activation failed on server. Please try again.' };
  //       }
  //     }

  //     const profileState = String(user.state || '').trim();
  //     const requestedSeatState = String(seat_state || '').trim();
  //     const requestedSeatRoleId = String(seat_role_id || '').trim();
  //     const wantsSeatSelection = Boolean(requestedSeatState || requestedSeatRoleId);

  //     const existingSeat = normalizeStateSeat(user.state_seat);
  //     const hasSeatInProfileState = Boolean(existingSeat?.state && normalizeStateKey(existingSeat.state) === normalizeStateKey(profileState));

  //     if (hasSeatInProfileState && wantsSeatSelection && requestedSeatRoleId && existingSeat?.seat_id && requestedSeatRoleId !== existingSeat.seat_id) {
  //       return { ok: false, message: `Aapne pehle se "${existingSeat.seat_name || existingSeat.seat_id}" seat select ki hai. Seat change nahi ho sakti.` };
  //     }

  //     let seatToAssign = null;

  //     if (profileState) {
  //       if (hasSeatInProfileState && requestedSeatState && normalizeStateKey(requestedSeatState) !== normalizeStateKey(profileState)) {
  //         return { ok: false, message: 'Selected seat state aapki profile state se match nahi karti.' };
  //       }

  //       if (!hasSeatInProfileState && !wantsSeatSelection) {
  //         return { ok: false, message: 'Payment se pehle apni state ki seat select karein.' };
  //       }

  //       if (!hasSeatInProfileState && wantsSeatSelection) {
  //         if (!requestedSeatState || !requestedSeatRoleId) {
  //           return { ok: false, message: 'Seat selection incomplete. Please select a seat again.' };
  //         }
  //         if (normalizeStateKey(requestedSeatState) !== normalizeStateKey(profileState)) {
  //           return { ok: false, message: 'Selected seat state aapki profile state se match nahi karti.' };
  //         }

  //         const roleMeta = getStateSeatRole(requestedSeatRoleId);
  //         if (!roleMeta) return { ok: false, message: 'Invalid seat selection. Please try again.' };

  //         allocationsBefore = await getStateSeatAllocationsFromStorage();
  //         const stateKey = normalizeStateKey(profileState);
  //         const stateAllocBefore = allocationsBefore[stateKey] && typeof allocationsBefore[stateKey] === 'object'
  //           ? allocationsBefore[stateKey]
  //           : {};

  //         const takenBy = String(stateAllocBefore?.[requestedSeatRoleId]?.email || '').trim().toLowerCase();
  //         if (takenBy && takenBy !== user.email) {
  //           return {
  //             ok: false,
  //             message: `"${roleMeta.name}" seat (${profileState}) already taken. Please select another seat.`,
  //           };
  //         }

  //         const allocationsAfter = {
  //           ...allocationsBefore,
  //           [stateKey]: {
  //             ...stateAllocBefore,
  //             [requestedSeatRoleId]: {
  //               email: user.email,
  //               name: user.name || '',
  //               assigned_at: today,
  //             },
  //           },
  //         };

  //         await AsyncStorage.setItem(STATE_SEATS_KEY, JSON.stringify(allocationsAfter));

  //         seatToAssign = {
  //           state: profileState,
  //           seat_id: requestedSeatRoleId,
  //           seat_name: roleMeta.name,
  //           assigned_at: today,
  //           plan_id: String(plan_id || '').trim(),
  //         };
  //       }
  //     }

  //     const newPayment = {
  //       order_id, payment_id,
  //       amount: activePlan.price || 0,
  //       status: 'success',
  //       date: today, plan_id,
  //       plan_name: activePlan.plan_name,
  //       signature,
  //     };

  //     const roleNotification = {
  //       id:      `notif-role-${Date.now()}`,
  //       title:   `🎉 ${activePlan.plan_name} Activated!`,
  //       message: `Your role has been upgraded to ${getRoleLabel(newRole)}. Enjoy your new features!`,
  //       date:    today,
  //       status:  'Unread',
  //     };

  //     const currentNotifications = normalizeNotifications(user.notifications);

  //     const updatedUser = await UserStore.updateUser(user.email, {
  //       subscription_plan: activePlan,
  //       subscription_type: newSubscriptionType,
  //       role:              newRole,
  //       role_label:        getRoleLabel(newRole),
  //       is_subscribed:     true,
  //       payment_history:   [...normalizePaymentHistory(user.payment_history).filter((item) => item.order_id !== order_id), newPayment],
  //       notifications:     [...currentNotifications, roleNotification],
  //       ...(seatToAssign ? { state_seat: seatToAssign } : {}),
  //     });

  //     if (!updatedUser) {
  //       if (allocationsBefore) await AsyncStorage.setItem(STATE_SEATS_KEY, JSON.stringify(allocationsBefore));
  //       return { ok: false, message: 'Payment verification failed.' };
  //     }
  //     await qualifyReferralForSubscribedUser(user.email);
  //     return { ok: true, role: newRole, role_label: getRoleLabel(newRole), plan: activePlan };
  //   } catch {
  //     if (allocationsBefore) {
  //       try { await AsyncStorage.setItem(STATE_SEATS_KEY, JSON.stringify(allocationsBefore)); } catch { /* noop */ }
  //     }
  //     return { ok: false, message: 'Payment verification failed.' };
  //   }
  // },

 getNewsFeedSummary: async (options = {}) => {
    try {
      const focusItemId = options && typeof options === 'object'
        ? (options.focusItemId ? String(options.focusItemId) : null)
        : null;
      const skipBlockedUsers = Boolean(options?.skipBlockedUsers);
      // ✅ FIX: 'all' = Home screen (GET /news, sabke posts), 'mine' (default) =
      // News Feed / Profile "My Posts" (GET /my-news, sirf apne posts)
     const feedType = options?.feedType === 'all' ? 'all' : 'mine';
      const feedCursor = options?.cursor || null;
      const feedContentType = options?.type === 1 || options?.type === 2 ? options.type : undefined; // 1 news, 2 reels
      const feedPerPage = options?.perPage || 10;
      let feedPagination = null;
      const currentUser = await UserStore.getCurrentUser();

      // ── Real news ab yahan se aati hai (dummy defaultNewsFeed hata diya) ──
      let apiItems = [];
      try {
        if (feedType === 'all') {
          // Home screen: sabhi users ke news, backend ke /news (index) route se
      const apiRes = await AuthAPI.getNewsList({ per_page: feedPerPage, ...(feedContentType ? { type: feedContentType } : {}), ...(feedCursor ? { cursor: feedCursor } : {}) });
          feedPagination = apiRes.pagination || null;
          if (apiRes.ok && Array.isArray(apiRes.news)) {
            apiItems = apiRes.news;
          } else if (apiRes.ok && Array.isArray(apiRes.news?.data)) {
            apiItems = apiRes.news.data;
          }
        } else {
          // News Feed / My Posts: sirf isi user ke news, dedicated my-news routes se
              const apiRes = focusItemId
            ? await AuthAPI.getMyNewsById(focusItemId)
            : await AuthAPI.getMyNews({ type: feedContentType });
          if (apiRes.ok && focusItemId) {
            apiItems = Array.isArray(apiRes.news) ? apiRes.news : [apiRes.news];
          } else if (apiRes.ok && Array.isArray(apiRes.news)) {
            apiItems = apiRes.news;
          } else if (apiRes.ok && Array.isArray(apiRes.news?.data)) {
            apiItems = apiRes.news.data; // paginated Laravel response ({data:[...], ...})
          }
          // 🔍 TEMP DEBUG — Android me kitni posts backend se aa rahi hain, ye check karne ke liye.
          console.log('[DEBUG my-news]', Platform.OS, 'count:', apiItems.length, apiItems.map(i => i.id));
        }
      } catch (e) {
        console.warn('[UserStore.getNewsFeedSummary] news request failed:', e);
      }


      // ✅ FIX: backend /news response mein author.has_blue_tick reliably nahi aata
      // (backend blue-tick track hi nahi karta), isliye premium user ka apna post
      // fetch hone ke baad blue tick gayab ho jaata tha. Ab apne hi posts ke liye
      // hum currentUser ka live blue-tick/premium/subscriber status use karte hain.
           const currentUserEmailForFeed = String(currentUser?.email || '').trim().toLowerCase();
      const currentUserHasBlueTickForFeed = Boolean(currentUser && UserStore.hasBlueTick(currentUser));
      const currentUserIsPremiumForFeed = Boolean(currentUser && UserStore.hasPremiumAccess(currentUser));
      const currentUserIsSubscriberForFeed = Boolean(currentUser && UserStore.hasActiveSubscription(currentUser));
      // ✅ FIX: apni hi post ka seat/role bhi live currentUser se lo — subscription
      // "PRO" se "Chief" (ya kisi bhi seat) me change hote he purani posts pe
      // bhi turant naya role/color aa jaayega.
      const currentUserSeatIdForFeed = String(currentUser?.state_seat?.seat_id || '').trim();
      const currentUserSeatNameForFeed = String(currentUser?.state_seat?.seat_name || '').trim();
      const currentUserRoleLabelForFeed = String(currentUser?.role_label || '').trim();

      const defaultItems = normalizeNewsFeed(apiItems.map(mapApiNewsToFeedItem)).map((item) => {
        const isOwnPost = Boolean(
          currentUserEmailForFeed
          && String(item.createdBy || item.created_by || '').trim().toLowerCase() === currentUserEmailForFeed
        );

        return {
          ...item,
          author_name: item.author_name || 'RTI News',
          author_profile_image: item.author_profile_image || '',
          author_seat_id: isOwnPost
            ? (currentUserSeatIdForFeed || item.author_seat_id)
            : item.author_seat_id,
          author_seat_name: isOwnPost
            ? (currentUserSeatNameForFeed || item.author_seat_name || 'Editorial Desk')
            : (item.author_seat_name || 'Editorial Desk'),
          author_role_label: isOwnPost
            ? (currentUserRoleLabelForFeed || item.author_role_label)
            : item.author_role_label,
          author_has_blue_tick: Boolean(
            isOwnPost ? currentUserHasBlueTickForFeed : item.author_has_blue_tick
          ),
          author_is_premium: Boolean(
            isOwnPost ? currentUserIsPremiumForFeed : item.author_is_premium
          ),
          author_is_subscriber: Boolean(
            isOwnPost ? currentUserIsSubscriberForFeed : item.author_is_subscriber
          ),
        };
      });
      /* Local aggregate intentionally disabled: feed content comes from /my-news.
      const aggregateItems = allUsers.flatMap((user) => {
        const injectAuthor = (item) => ({
          ...item,
          author_name:
            item.author_name || item.createdByName || user.name || '',
          author_profile_image:
            item.author_profile_image ||
            item.authorProfileImage ||
            item.createdByProfileImage ||
            item.profile_image ||
            user.profile_image || // ✅ FIX: user ka profile image inject karo
            '',
          author_has_blue_tick:
            Boolean(item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick || hasBlueTick(user)),
          author_seat_name:
            item.author_seat_name ||
            item.authorSeatName ||
            user.state_seat?.seat_name ||
            '',
          author_is_premium:
            Boolean(item.author_is_premium || item.createdByPremium || hasPremiumAccess(user)),
          author_is_subscriber:
            Boolean(item.author_is_subscriber || item.createdBySubscriber || hasActiveSubscription(user)),
        });

        return [
          ...normalizeUserNewsItems(user.news).map(injectAuthor),
          ...normalizeNewsFeed(user.news_feed).map(injectAuthor),
        ];
      }); */

      // A just-created item has already been accepted by POST /news, but the
      // list endpoint may lag behind it. Include only this user's real
      // server-created records so it appears immediately on Feed and Home.
           const justSubmittedItems = feedCursor ? [] : normalizeUserNewsItems(currentUser?.news || [])
        .filter((item) => !feedContentType || item.type === feedContentType);
      // A public-profile screen loads its own posts and must not make a
      // blocked-users request merely because the profile was opened.
      const blockedRes = skipBlockedUsers ? { ok: true, list: [] } : await UserStore.getBlockedUsers();
      const blockedEmailsForFeed = new Set((blockedRes?.list || []).map((u) => u.email).filter(Boolean));
      const blockedIdsForFeed = new Set((blockedRes?.list || []).map((u) => (u.id != null ? String(u.id) : '')).filter(Boolean));
      const isBlockedFeedItem = (item) => {
        const itemEmail = String(item.createdBy || '').trim().toLowerCase();
        const itemAuthorId = item.author_id != null ? String(item.author_id) : '';
        if (itemEmail && blockedEmailsForFeed.has(itemEmail)) return true;
        if (itemAuthorId && blockedIdsForFeed.has(itemAuthorId)) return true;
        return false;
      };
      // The API list can contain only the primary media URL immediately after a
      // publish, while this device has the additional selected images stored in
      // the user's local news record. Enrich that matching API item before
      // deduplication so a two-image post reaches the carousel as two images.
      const localNewsById = new Map(
        justSubmittedItems
          .filter((item) => item?.id != null)
          .map((item) => [String(item.id), item])
      );
      const apiItemsWithLocalGallery = defaultItems.map((item) => {
        const localItem = localNewsById.get(String(item?.id || ''));
        const localImages = Array.isArray(localItem?.images) ? localItem.images : [];
        if (localImages.length < 2) return item;
        const images = Array.from(new Set([
          ...(Array.isArray(item.images) ? item.images : []),
          ...localImages,
        ].filter(Boolean)));
        return images.length > 1 ? { ...item, images, image: item.image || images[0], thumbnail: item.thumbnail || images[0] } : item;
      });
      const mergedItems = [...apiItemsWithLocalGallery, ...justSubmittedItems]
        .filter((item) => !isBlockedFeedItem(item))
        // ✅ FIX: id missing/undefined hone par pehle ye galti se doosri post ko bhi
        // "duplicate" samajh kar hata deta tha (kyunki String(undefined) dono ke liye
        // same ban jaata tha). Ab id na ho to us item ko unique treat karo, kabhi drop na ho.
        .filter((item, index, arr) => {
          if (!item.id) return true;
          return arr.findIndex((e) => e.id && String(e.id) === String(item.id)) === index;
        })
        .sort((a, b) => getNewsSortValue(b) - getNewsSortValue(a));
      const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
      const postIds = mergedItems.map((i) => i.id).filter(Boolean);

      // Engagement is optional decoration for a server-backed news feed.
      // Do not lose every news card on Android if SQLite is unavailable while
      // the development build is starting or its database is being migrated.
      let engagement = { statsByPost: {}, commentsByPost: {} };
      try {
        engagement = Platform.OS === 'web'
          ? await getEngagementForPostsFallback(postIds, currentEmail, focusItemId)
          : await getEngagementForPostsSqlite(postIds, currentEmail, focusItemId);
      } catch (error) {
        console.warn('[UserStore.getNewsFeedSummary] engagement lookup failed:', error);
      }

      // ✅ FIX: sirf jis post ki detail khuli hai uske comments backend se laao (GET /comments/{newsId})
      const focusItemComments = focusItemId ? await fetchBackendCommentsForPost(focusItemId) : [];

      const itemsWithEngagement = mergedItems.map((item) => {
        const id = String(item.id || '');
        const stat = engagement?.statsByPost?.[id];
        const next = { ...item };

        if (stat) {
          const baseComments = Number(item.comments || 0);
          const baseShares = Number(item.shares || 0);
          const baseViews = Number(item.views || 0);

         next.comments = baseComments;
         next.shares = baseShares;
          next.views = baseViews + Number(stat.views || 0);

          // ✅ FIX: likes ab sirf backend API se aate hain — local SQLite/
          // AsyncStorage wala count/liked-by-me flag ab merge nahi hota,
          // taaki double-counting na ho.
          next.likes = Number(item.likes || 0);
          next.liked_by = Array.isArray(item.liked_by) ? item.liked_by : [];

          const legacyBookmarked = Boolean(item.bookmarked);
          next.bookmarked = Boolean(stat.bookmarkedByCurrentUser || legacyBookmarked);
        }

             if (focusItemId && id === focusItemId) {
          // ✅ FIX: comments ab local SQLite/AsyncStorage se nahi, seedha backend /comments/{newsId} se
          next.comments_list = focusItemComments;
        } else {
          // Ensure we don't accidentally show stale in-item comments.
          if (next.comments_list) delete next.comments_list;
        }

        return next;
      });


      // ✅ FIX: guest (bina-login) local-like overlay hata diya — likes ab
      // sirf backend API se, aur bina login ke like possible nahi hai.
      const finalItems = itemsWithEngagement;

      return {
        currentUser,
             items: finalItems,
        pagination: feedPagination,
        totalViews: finalItems.reduce((s, i) => s + (Number(i.views) || 0), 0),
        totalShares: finalItems.reduce((s, i) => s + (Number(i.shares) || 0), 0),
      };
    } catch {
      return null;
    }
  },

  getReelsFeedSummary: async (options = {}) => {
    try {
      const focusItemId = options && typeof options === 'object'
        ? (options.focusItemId ? String(options.focusItemId) : null)
        : null;
      const currentUser = await UserStore.getCurrentUser();
      const allUsers = await UserStore.getAllUsers();
      const currentEmail = String(currentUser?.email || '').trim().toLowerCase();

      const injected = allUsers.flatMap((user) => {
        const userEmail = String(user?.email || '').trim().toLowerCase();
        const injectAuthor = (item) => ({
          ...item,
          createdBy: item.createdBy || item.created_by || userEmail,
          author_name: item.author_name || item.createdByName || user.name || '',
          author_profile_image:
            item.author_profile_image ||
            item.authorProfileImage ||
            item.createdByProfileImage ||
            item.profile_image ||
            user.profile_image ||
            '',
          author_has_blue_tick: Boolean(
            item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick || hasBlueTick(user)
          ),
          author_is_premium: Boolean(item.author_is_premium || hasPremiumAccess(user)),
          author_is_subscriber: Boolean(item.author_is_subscriber || hasActiveSubscription(user)),
          author_role: item.author_role || item.authorRole || user.role || '',
          author_role_label: item.author_role_label || item.authorRoleLabel || user.role_label || '',
          author_seat_id: String(item.author_seat_id || item.authorSeatId || user.state_seat?.seat_id || '').trim(),
          author_seat_name: String(item.author_seat_name || item.authorSeatName || user.state_seat?.seat_name || '').trim(),
        });

        const rawItems = [
          ...(Array.isArray(user.news) ? user.news : []),
          ...(Array.isArray(user.news_feed) ? user.news_feed : []),
        ].map(injectAuthor);

        return rawItems;
      });

      // FeedScreen expects to show all users' posts (video OR image) without login-gated visibility.
      // We still skip items that have no playable media/thumbnail at all.
      const reels = injected
        .filter((item) => Boolean(getReelVideoUri(item) || getReelThumbnailUri(item)))
        .map((item) => toReelPostFromNewsItem(item, currentEmail))
        .sort((a, b) => getNewsSortValue(b) - getNewsSortValue(a));

      const postIds = reels.map((r) => r.id).filter(Boolean);
      const engagement = Platform.OS === 'web'
        ? await getEngagementForPostsFallback(postIds, currentEmail, focusItemId)
        : await getEngagementForPostsSqlite(postIds, currentEmail, focusItemId);

      const itemsWithEngagement = reels.map((item) => {
        const id = String(item.id || '');
        const stat = engagement?.statsByPost?.[id];
        const next = { ...item };
        if (stat) {
  // ✅ FIX: likes/liked ab sirf backend API se (item.likes / item.liked) —
  // local SQLite stat.likes ab merge nahi hota, double-count avoid karne ke liye.
  next.likes = Number(item.likes || 0);
  next.shares = Number(item.shares || 0) + Number(stat.shares || 0);
  next.commentsCount = Number(stat.comments || 0);
  next.liked = Boolean(item.liked);
  next.bookmarked = Boolean(item.bookmarked || stat.bookmarkedByCurrentUser);
}

        if (focusItemId && id === focusItemId) {
          const list = Array.isArray(engagement?.commentsByPost?.[focusItemId])
            ? engagement.commentsByPost[focusItemId]
            : [];
          next.comments = list.map((c) => ({
            id: String(c.id || ''),
            user: String(c.author || 'User'),
            text: String(c.text || ''),
            replies: Array.isArray(c.replies)
              ? c.replies.map((r) => ({
                id: String(r.id || ''),
                user: String(r.author || 'User'),
                text: String(r.text || ''),
              }))
              : [],
          }));
        }

        return next;
      });

      // ✅ FIX: guest local-like overlay hata diya (reels ke liye bhi) —
      // likes ab sirf backend API se.
      return { currentUser, items: itemsWithEngagement };
    } catch {
      return null;
    }
  },

  
  updateNewsFeedItem: async (itemId, action, meta = {}) => {
    try {
      const postId = String(itemId || '').trim();
      if (!postId) return { ok: false, message: 'Invalid post id.' };

      // ✅ FIX: like/unlike ab PURELY backend API ke through hota hai — koi
      // local SQLite/AsyncStorage tracking nahi. Guest (bina-login) users
      // ab like nahi kar sakte kyunki backend ko authenticated user chahiye.
      //
      // ✅ FIX 2: pehle hum har baar POST /likes call karke backend ke
      // "toggle" behavior pe bharosa karte the — agar app ke known state aur
      // backend ke real state mein kabhi mismatch ho (purane bug se ya kisi
      // aur session se), to har tap ulta result deta tha ("like → auto
      // unlike"). Ab hum caller se current known `liked` status (meta.liked
      // — jo khud API/liked_by se aaya hota hai) leke EXPLICIT endpoint
      // choose karte hain: already liked ho to DELETE /likes/{id} (unlike),
      // nahi to POST /likes (like). Isse result hamesha predictable rehta
      // hai, chahe backend POST khud toggle-style ho ya na ho.
      if (action === 'like') {
        const likeUser = await UserStore.getCurrentUser();
        if (!likeUser) return { ok: false, message: 'Please login to like this post.' };

        const wasLiked = Boolean(meta?.liked);

        if (wasLiked) {
          const res = await AuthAPI.unlikeNews(postId);
          if (!res.ok) {
            if (res.isAuth) return { ok: false, message: 'Session expired. Please login again.' };
            return { ok: false, message: res.message || 'Unable to unlike.' };
          }
          return { ok: true, liked: false };
        }

        // News likes are authenticated by the bearer token. Android users can
        // have a valid login before a numeric profile id has been hydrated, so
        // do not block their like action waiting for that unnecessary id.
        const res = await AuthAPI.likeNews({ newsId: postId });
        if (!res.ok) {
          if (res.isAuth) return { ok: false, message: 'Session expired. Please login again.' };
          return { ok: false, message: res.message || 'Unable to like.' };
        }
        return { ok: true, liked: Boolean(res.liked) };
      }

      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };

      if (action && typeof action === 'object' && !Array.isArray(action)) {
        const updates = sanitizeNewsItemUpdates(action);
        if (!updates.title) return { ok: false, message: 'Title is required.' };

        const users = await UserStore.getAllUsers();
        let foundPost = false;
        let allowed = false;
        let updatedItem = null;

        const updatedUsers = users.map((entry) => {
          const nextFromNews = updateNewsItemInCollection(entry.news, postId, (item) => {
            foundPost = true;
            if (!canManageNewsItem(user, item)) return item;
            allowed = true;
            const nextItem = {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            updatedItem = nextItem;
            return nextItem;
          });

          const nextFromFeed = updateNewsItemInCollection(entry.news_feed, postId, (item) => {
            foundPost = true;
            if (!canManageNewsItem(user, item)) return item;
            allowed = true;
            const nextItem = {
              ...item,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            updatedItem = nextItem;
            return nextItem;
          });

          if (!nextFromNews.changed && !nextFromFeed.changed) {
            return entry;
          }

          return normalizeUser({
            ...entry,
            news: nextFromNews.items,
            news_feed: nextFromFeed.items,
          });
        });

        if (!foundPost) return { ok: false, message: 'News item not found.' };
        if (!allowed) return { ok: false, message: 'You cannot edit this news item.' };

        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
        return { ok: true, item: updatedItem };
      }

      const email = String(user.email || '').trim().toLowerCase();
      const now = new Date().toISOString();

      // ✅ FIX: 'like' action ab upar hi (function ke shuru mein) purely API
      // se handle ho chuka hai — yahan koi local-storage wala like/unlike
      // logic nahi bacha. (Naya like-toggle code upar dekho.)

      if (Platform.OS === 'web') {
        const state = await readEngagementFallback();

        if (action === 'bookmark') {
          if (!email) return { ok: false, message: 'Email missing.' };
          state.bookmarksByPost[postId] = state.bookmarksByPost[postId] || {};
          const alreadySaved = Boolean(state.bookmarksByPost[postId][email]);
          if (alreadySaved) delete state.bookmarksByPost[postId][email];
          else state.bookmarksByPost[postId][email] = true;
          await writeEngagementFallback(state);
          return { ok: true, bookmarked: !alreadySaved };
        }

        if (action === 'share') {
          state.sharesByPost[postId] = Number(state.sharesByPost[postId] || 0) + 1;
          await writeEngagementFallback(state);
          return { ok: true };
        }

        if (action === 'view') {
          state.viewsByPost[postId] = Number(state.viewsByPost[postId] || 0) + 1;
          await writeEngagementFallback(state);
          return { ok: true };
        }

        return { ok: true };
      }


const db = await getEngagementDb();
      if (!db) return { ok: false, message: 'SQLite not available.' };

      // ✅ FIX: like already backend se upar handle ho chuka hai is function ke shuru mein (dono platform ke liye)
      if (action === 'bookmark') {
        if (!email) return { ok: false, message: 'Email missing.' };
        const exists = await db.getFirstAsync(
          'SELECT 1 AS ok FROM post_bookmarks WHERE post_id = ? AND user_email = ? LIMIT 1',
          postId,
          email
        );
        if (exists) {
          await db.runAsync('DELETE FROM post_bookmarks WHERE post_id = ? AND user_email = ?', postId, email);
          return { ok: true, bookmarked: false };
        }
        await db.runAsync(
          'INSERT INTO post_bookmarks (post_id, user_email, created_at) VALUES (?, ?, ?)',
          postId,
          email,
          now
        );
        return { ok: true, bookmarked: true };
      }

      if (action === 'share') {
        await upsertCounter(db, 'post_shares', postId);
        return { ok: true };
      }

      if (action === 'view') {
        await upsertCounter(db, 'post_views', postId);
        return { ok: true };
      }

      return { ok: true };
    } catch { return { ok: false, message: 'Unable to update news item.' }; }
  },

  deleteNewsFeedItem: async (itemId) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };

      const postId = String(itemId || '').trim();
      if (!postId) return { ok: false, message: 'Invalid post id.' };

      const users = await UserStore.getAllUsers();
      let foundPost = false;
      let allowed = false;

      const updatedUsers = users.map((entry) => {
        const nextFromNews = removeNewsItemFromCollection(entry.news, postId);
        const nextFromFeed = removeNewsItemFromCollection(entry.news_feed, postId);

        if (nextFromNews.found || nextFromFeed.found) {
          foundPost = true;
          const matchedItem = (Array.isArray(entry.news) ? entry.news : []).find((item) => String(item?.id || '').trim() === postId)
            || (Array.isArray(entry.news_feed) ? entry.news_feed : []).find((item) => String(item?.id || '').trim() === postId)
            || null;

          if (!canManageNewsItem(user, matchedItem)) {
            return entry;
          }

          allowed = true;
        }

        if (!nextFromNews.changed && !nextFromFeed.changed) {
          return entry;
        }

        return normalizeUser({
          ...entry,
          news: nextFromNews.items,
          news_feed: nextFromFeed.items,
        });
      });

      if (!foundPost) return { ok: false, message: 'News item not found.' };
      if (!allowed) return { ok: false, message: 'You cannot delete this news item.' };

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      await clearNewsItemEngagement(postId);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Unable to delete news item.' };
    }
  },

  recordNewsFeedMenuAction: async (itemId, action, extra = {}) => {
    try {
      const postId = String(itemId || '').trim();
      const actionName = String(action || '').trim().toLowerCase();
      if (!postId || !actionName) return { ok: false, message: 'Invalid action.' };

      const user = await UserStore.getCurrentUser();
      const email = String(user?.email || '').trim().toLowerCase();
      const raw = await AsyncStorage.getItem(NEWS_ACTION_LOG_KEY);
      const state = safeJsonParse(raw, { actions: [] });
      const actions = Array.isArray(state.actions) ? state.actions : [];

      actions.unshift({
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        post_id: postId,
        action: actionName,
        user_email: email,
        created_at: new Date().toISOString(),
        ...extra,
      });

      await AsyncStorage.setItem(
        NEWS_ACTION_LOG_KEY,
        JSON.stringify({ actions: actions.slice(0, 500) })
      );
      return { ok: true };
    } catch {
      return { ok: false, message: 'Unable to save action.' };
    }
  },

   // ✅ NEW: cursor-based comments page (GET /comments/{newsId}) — backend order as-is
  getNewsCommentsPage: async (newsId, { cursor = null, perPage = 20 } = {}) => {
    try {
      const me = await UserStore.getCurrentUser().catch(() => null);
      const res = await AuthAPI.getCommentsDetailed(newsId, { cursor, perPage });
      if (!res.ok) return { ok: false, notFound: Boolean(res.notFound), message: res.message };
      return {
        ok: true,
        comments: buildCommentTreeFromApi(res.comments, { sort: false, me }),
        hasMore: res.hasMore,
        nextCursor: res.nextCursor,
      };
    } catch { return { ok: false, message: 'Unable to load comments.' }; }
  },

  // ✅ NEW: ek comment ke replies (cursor pagination)  GET /comments/{commentId}/replies
  getCommentReplies: async (commentId, { cursor = null, perPage = 20 } = {}) => {
    try {
      const me = await UserStore.getCurrentUser().catch(() => null);
      const ref = parseCommentRef(commentId);
      const res = await AuthAPI.getReplies(ref.id, { cursor, perPage });
      if (!res.ok) return { ok: false, notFound: Boolean(res.notFound), message: res.message };
      return {
        ok: true,
        replies: res.replies.map((r) => mapApiReplyToLocal(r, me)),
        hasMore: res.hasMore,
        nextCursor: res.nextCursor,
      };
    } catch { return { ok: false, message: 'Unable to load replies.' }; }
  },

  addNewsComment: async (itemId, commentText, options = {}) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, isAuth: true, message: 'Please login again.' };
      const text = String(commentText || '').trim();
      if (!text) return { ok: false, message: 'Please enter a comment.' };
      if (text.length > 1000) return { ok: false, message: 'Comment can be at most 1000 characters.' };

      const postId = String(itemId || '').trim();
      if (!postId) return { ok: false, message: 'Invalid post id.' };

      const apiRes = await AuthAPI.postComment({
        newsId: options.isAd ? null : postId,
        adsId: options.isAd ? postId : null,
        text,
      });
      if (!apiRes.ok) {
        return { ok: false, isAuth: Boolean(apiRes.isAuth), message: apiRes.message || 'Unable to add comment.' };
      }

      const rawDetail = apiRes.comment || {};
      const mapped = mapApiCommentToLocal({ ...rawDetail, is_mine: true }, user);
      if (!mapped.text) mapped.text = text;
      if (!rawDetail.user && !rawDetail.author) {
        mapped.author = String(user.name || user.email || 'User');
        mapped.author_email = String(user.email || '').trim().toLowerCase();
        mapped.author_avatar = user.profile_image || '';
        mapped.author_has_blue_tick = hasBlueTick(user);
      }
      return { ok: true, comment: mapped, commentsCount: apiRes.commentsCount ?? null };
    } catch { return { ok: false, message: 'Unable to add comment.' }; }
  },
 // ✅ Reply -> POST /comments/{commentId}/replies  (reply ka parent hamesha top-level comment hota hai)
  replyNewsComment: async (itemId, parentCommentId, replyText) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, isAuth: true, message: 'Please login again.' };
      const text = String(replyText || '').trim();
      if (!text) return { ok: false, message: 'Please enter a reply.' };
      if (text.length > 1000) return { ok: false, message: 'Reply can be at most 1000 characters.' };

      // reply ke upar reply dabaya ho to uske parent comment par bhejo
      let ref = parseCommentRef(parentCommentId);
      if (ref.kind === 'reply') {
        const parent = REPLY_PARENT_MAP.get(`rpl-${ref.id}`);
        ref = { kind: 'comment', id: Number(parent) };
      }
      if (!Number.isFinite(ref.id) || ref.id <= 0) return { ok: false, message: 'Invalid comment id.' };

      const res = await AuthAPI.addReply(ref.id, text);
      if (!res.ok) {
        return { ok: false, isAuth: Boolean(res.isAuth), notFound: Boolean(res.notFound), message: res.message || 'Unable to add reply.' };
      }
      const rawReply = res.reply || {};
      const mapped = mapApiReplyToLocal({ ...rawReply, comment_id: rawReply.comment_id ?? ref.id, is_mine: true }, user);
      if (!mapped.text) mapped.text = text;
      if (!rawReply.user) {
        mapped.author = String(user.name || user.email || 'User');
        mapped.author_email = String(user.email || '').trim().toLowerCase();
        mapped.author_avatar = user.profile_image || '';
        mapped.author_has_blue_tick = hasBlueTick(user);
      }
      return { ok: true, comment: mapped, repliesCount: res.repliesCount };
    } catch { return { ok: false, message: 'Unable to add reply.' }; }
  },

  // ✅ Like toggle -> POST /comments/{id}/like  ya  /comment-replies/{id}/like
  likeNewsComment: async (itemId, commentId) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, isAuth: true, message: 'Please login again.' };
      const ref = parseCommentRef(commentId);
      if (!Number.isFinite(ref.id) || ref.id <= 0) return { ok: false, message: 'Invalid comment id.' };

      const res = ref.kind === 'reply' ? await AuthAPI.likeReply(ref.id) : await AuthAPI.likeComment(ref.id);
      if (!res.ok) return { ok: false, isAuth: Boolean(res.isAuth), notFound: Boolean(res.notFound), message: res.message || 'Unable to update like.' };
      return { ok: true, liked: res.liked, likesCount: res.likesCount };
    } catch { return { ok: false, message: 'Unable to update like.' }; }
  },

  // ✅ Edit -> POST /comments/{id}  ya  /comment-replies/{id}
  editNewsComment: async (itemId, commentId, nextText) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, isAuth: true, message: 'Please login again.' };
      const text = String(nextText || '').trim();
      if (!text) return { ok: false, message: 'Please enter a comment.' };
      if (text.length > 1000) return { ok: false, message: 'Comment can be at most 1000 characters.' };
      const ref = parseCommentRef(commentId);
      if (!Number.isFinite(ref.id) || ref.id <= 0) return { ok: false, message: 'Invalid comment id.' };

      const res = ref.kind === 'reply' ? await AuthAPI.editReply(ref.id, text) : await AuthAPI.editComment(ref.id, text);
      if (!res.ok) return { ok: false, isAuth: Boolean(res.isAuth), notFound: Boolean(res.notFound), message: res.message || 'Unable to edit comment.' };
      return { ok: true };
    } catch { return { ok: false, message: 'Unable to edit comment.' }; }
  },

  // ✅ Delete -> comment: purani DELETE /comments/{id} (comments_count milta hai) | reply: DELETE /comment-replies/{id} (replies_count milta hai)
  deleteNewsComment: async (itemId, commentId) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, isAuth: true, message: 'Please login again.' };
      const ref = parseCommentRef(commentId);
      if (!Number.isFinite(ref.id) || ref.id <= 0) return { ok: false, message: 'Invalid comment id.' };

      if (ref.kind === 'reply') {
        const res = await AuthAPI.deleteReply(ref.id);
        if (!res.ok) return { ok: false, isAuth: Boolean(res.isAuth), notFound: Boolean(res.notFound), message: res.message || 'Unable to delete reply.' };
        return { ok: true, isReply: true, repliesCount: res.repliesCount ?? null };
      }
      const apiRes = await AuthAPI.deleteComment(ref.id);
      if (!apiRes.ok) {
        return { ok: false, isAuth: Boolean(apiRes.isAuth), notFound: Boolean(apiRes.notFound), message: apiRes.message || 'Unable to delete comment.' };
      }
      return { ok: true, commentsCount: apiRes.commentsCount ?? null };
    } catch { return { ok: false, message: 'Unable to delete comment.' }; }
  },

  getEPaperSummary: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      const rawData = await AsyncStorage.getItem(USERS_KEY);
      const rawUsers = rawData ? JSON.parse(rawData) : [];
      const allPapers = rawUsers.flatMap((u) => {
        const epapers = Array.isArray(u.epapers) ? u.epapers : [];
        return epapers.map((paper) => ({
          id: paper.id || '',
          title: paper.title || '',
          description: paper.description || '',
          status: paper.status || 'approved',
          state: paper.state || '',
          publishDate: paper.publishDate || paper.createdAt?.slice(0, 10) || '',
          createdAt: paper.createdAt || '',
          createdBy: paper.createdBy || u.email || '',
          images: Array.isArray(paper.images) ? paper.images.slice(0, 1) : [],
          views: Number(paper.views || 0),
          downloads: Number(paper.downloads || 0),
        }));
      });
      // Deduplicate by id
      const seen = new Set();
      const papers = allPapers.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      const allLayouts = rawUsers.flatMap((u) =>
        Array.isArray(u.newspaper_layouts) ? u.newspaper_layouts : []
      );
      return {
        currentUser: user,
        items: papers,
        layouts: allLayouts,
        totalViews: papers.reduce((s, i) => s + i.views, 0),
        totalDownloads: papers.reduce((s, i) => s + i.downloads, 0),
      };
    } catch { return null; }
  },

  updateEPaperItem: async (itemId, action) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const items = normalizeEPapers(user.epapers).map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, views: action === 'view' ? item.views + 1 : item.views, downloads: action === 'download' ? item.downloads + 1 : item.downloads };
      });
      const updatedUser = await UserStore.updateUser(user.email, { epapers: items });
      if (!updatedUser) return { ok: false, message: 'Unable to update e-paper record.' };
      return { ok: true, items };
    } catch { return { ok: false, message: 'Unable to update e-paper record.' }; }
  },

  getLiveStreamingSummary: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      const apiResult = await AuthAPI.getYoutubeLiveList();
      if (!apiResult.ok) {
        return { currentUser: user, items: [], liveCount: 0, upcomingCount: 0, endedCount: 0, error: apiResult.message };
      }
      const streams = apiResult.items.map((stream, index) => ({
        id: stream.watch_url || `youtube-live-${index}`,
        stream_title: stream.title || 'RTI Live',
        stream_url: stream.watch_url || '',
        status: 'live',
      }));
      return { currentUser: user, items: streams, liveCount: streams.length, upcomingCount: 0, endedCount: 0 };
    } catch { return null; }
  },

  updateStreamStatus: async (streamId, newStatus) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const streams = normalizeStreams(user.live_streams).map((s) => s.id === streamId ? { ...s, status: newStatus } : s);
      const updatedUser = await UserStore.updateUser(user.email, { live_streams: streams });
      if (!updatedUser) return { ok: false, message: 'Unable to update stream status.' };
      return { ok: true };
    } catch { return { ok: false, message: 'Unable to update stream status.' }; }
  },

  startLiveStream: async ({ stream_title, stream_url, ingest_url, stream_key }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const existingStreams = normalizeStreams(user.live_streams).map((stream) => ({
        ...stream, status: stream.status === 'live' ? 'ended' : stream.status,
      }));
      const nextStream = {
        id: `stream-${Date.now()}`,
        stream_title: stream_title || 'Live Stream',
        stream_url: stream_url || '',
        ingest_url: ingest_url || YOUTUBE_RTMPS_URL,
        stream_key: stream_key || 'stream',
        status: 'live',
      };
      const updatedUser = await UserStore.updateUser(user.email, { live_streams: [nextStream, ...existingStreams] });
      if (!updatedUser) return { ok: false, message: 'Unable to create live stream.' };
      return { ok: true, stream: nextStream };
    } catch { return { ok: false, message: 'Unable to create live stream.' }; }
  },

  stopActiveLiveStream: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const streams = normalizeStreams(user.live_streams);
      const hasActive = streams.some((stream) => stream.status === 'live');
      if (!hasActive) return { ok: false, message: 'No active live stream found.' };
      const updatedUser = await UserStore.updateUser(user.email, {
        live_streams: streams.map((stream) => stream.status === 'live' ? { ...stream, status: 'ended' } : stream),
      });
 if (!updatedUser) return { ok: false, message: 'Unable to stop live stream.' };
      return { ok: true };
    } catch { return { ok: false, message: 'Unable to stop live stream.' }; }
  },

  connectYoutubeAccount: async () => {
    const result = await AuthAPI.getYoutubeAuthUrl();
    if (!result.ok) return result;
    try {
      const { Linking } = require('react-native');
      await Linking.openURL(result.url);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Unable to open YouTube authorization.' };
    }
  },
   createYoutubeLive: async (streamTitle, privacyStatus = 'unlisted', scheduledStartTime) => {
  const apiResult = await AuthAPI.createYoutubeLive(streamTitle, privacyStatus, scheduledStartTime);
    if (!apiResult.ok) return apiResult;
    const currentUser = await UserStore.getCurrentUser();
    if (currentUser?.email) {
      try {
        await UserStore.updateUser(currentUser.email, { youtube_connected: true });
      } catch {
        // The YouTube live stream is already created; a local UI-state save must not block it.
      }
    }
    const { ingestion_address, stream_key } = apiResult.data || {};
    const localResult = await UserStore.startLiveStream({
      stream_title: streamTitle,
      stream_url: '',
      ingest_url: ingestion_address,
      stream_key: stream_key,
    });
    if (!localResult.ok) return localResult;
   
    return {
   ok: true,
   liveData: apiResult.data,
   stream: localResult.stream
}
  },

 confirmYoutubeLive: async (broadcastId) => {
   return AuthAPI.startYoutubeBroadcast(broadcastId);
},

  endYoutubeLive: async (broadcastId) => {
    const apiResult = await AuthAPI.endYoutubeBroadcast(broadcastId);
    await UserStore.stopActiveLiveStream();
    return apiResult;
  },

 // Pulls the real attempt history from /quiz/history?user_id=...&quiz_type=exam —
  // this is what "My Attempts" screen shows, independent of the practice/training/exam
  // listing APIs.
  // NOTE (updated): /quiz/history ab quiz_type field seedha bhejta hai (e.g. "exam").
  // typeById (3 listing APIs se banaya map) ab sirf fallback hai agar kabhi wo field
  // missing aaye — pehle isi map par hi poori tarah depend karte the jo ki galat tha.
  getQuizHistory: async () => {
    try {
      const user = await UserStore.ensureUserId(); // ✅ FIX: id missing ho to yahin repair kar lo
      if (!user) return null;
      const userId = user.id || user.user_id;
      const [historyRes, practiceRes, trainingRes, examRes] = await Promise.all([
        AuthAPI.getQuizHistory(userId),
        AuthAPI.getPracticeQuizzes(),
        AuthAPI.getTrainingQuizzes(),
        AuthAPI.getExamQuizzes(),
      ]);
      if (historyRes?.isAuth) return { authExpired: true, currentUser: user, items: [] };
      if (!historyRes?.ok) return { currentUser: user, items: [] };

      const typeById = new Map();
      [['practice', practiceRes], ['training', trainingRes], ['exam', examRes]].forEach(([type, res]) => {
        if (res?.ok && Array.isArray(res.quizzes)) {
          res.quizzes.forEach((q) => { if (q?.id != null) typeById.set(String(q.id), type); });
        }
      });

      const items = (historyRes.history || [])
        // status 0 = started but never submitted — skip those, they're not real results.
        .filter((item) => item.status === 1)
        .map((item, i) => {
          const percentage = Number(item.percentage ?? 0);
          const resultType = getQuizResultTier(percentage).result_type;
          return {
            id:                 item.attempt_id ?? `history-${i + 1}`,
            quiz_title:         item.quiz_title || `Quiz ${i + 1}`,
            // ✅ FIX: backend /quiz/history ab quiz_type field seedha bhejta hai
            // (e.g. "exam"/"practice"/"training") — usko priority do. typeById
            // map (3 alag listing API se banaya) ab sirf fallback hai, jab kabhi
            // history response me quiz_type na aaye.
            quiz_type:          item.quiz_type || typeById.get(String(item.quiz_type_id)) || null,
            score:              item.obtained_marks ?? null,
            percentage,
            obtained_marks:     item.obtained_marks ?? null,
            total_marks:        item.total_marks ?? null,
            correct_answers:    item.correct_answers ?? null,
            wrong_answers:      item.wrong_answers ?? null,
            total_questions:    item.total_questions ?? null,
            result_type:        resultType,
            certificate_file:   null,
            certificate_number: null,
            user_name:          user.name || user.email || 'Participant',
            issued_at:          item.submitted_at || item.started_at || null,
          };
        });
      return { currentUser: user, items };
    } catch { return null; }
  },

 getCertificationSummary: async (subject, testType, difficulty) => {
    try {
      const user = await UserStore.ensureUserId(); // ✅ FIX: id missing ho to yahin repair kar lo
      if (!user) return null;
      const userId = user.id || user.user_id;

    // If a Test Type is selected, only hit that endpoint — this also guarantees
    // difficulty is only ever sent to the Practice endpoint (Training/Exam never receive it).
    const [practiceRes, trainingRes, examRes, historyRes] = await Promise.all([
  (!testType || testType === 'practice') ? AuthAPI.getPracticeQuizzes(subject, difficulty) : Promise.resolve({ ok: false, quizzes: [] }),
  (!testType || testType === 'training') ? AuthAPI.getTrainingQuizzes(subject) : Promise.resolve({ ok: false, quizzes: [] }),
  (!testType || testType === 'exam') ? AuthAPI.getExamQuizzes(subject) : Promise.resolve({ ok: false, quizzes: [] }),
  AuthAPI.getQuizHistory(userId),
]);

    // If the token expired, don't fall back to locally-cached dummy data —
    // surface it so the screen can prompt a re-login instead.
    const authExpired = [practiceRes, trainingRes, examRes].some((r) => r?.isAuth);
    if (authExpired) {
      return { authExpired: true, currentUser: user, items: [], totalAttempts: 0, passedCount: 0, totalDownloads: 0 };
    }

    // Real DB result per quiz — /quiz/history is the actual saved-in-database source
    // (same endpoint "My Attempts" uses). Keyed by quiz_type_id so it can be merged
    // onto the practice/training/exam listing items (which only carry metadata, no result).
    const historyByQuizTypeId = new Map();
    if (historyRes?.ok && Array.isArray(historyRes.history)) {
      historyRes.history
        .filter((h) => h.status === 1) // 0 = started but never submitted
        .forEach((h) => {
          const key = String(h.quiz_type_id);
          const prev = historyByQuizTypeId.get(key);
          const isNewer = !prev || Number(h.attempt_id) > Number(prev.attempt_id);
          const percentage = Number(h.percentage ?? 0);
          historyByQuizTypeId.set(key, {
            attempt_id:      isNewer ? h.attempt_id : prev.attempt_id,
            score:           isNewer ? percentage : prev.score,
            result_type:     isNewer ? getQuizResultTier(percentage).result_type : prev.result_type,
            obtained_marks:  isNewer ? (h.obtained_marks ?? null) : prev.obtained_marks,
            total_marks:     isNewer ? (h.total_marks ?? null) : prev.total_marks,
            issued_at:       isNewer ? (h.submitted_at || h.started_at || null) : prev.issued_at,
            attempts:        (prev?.attempts || 0) + 1,
          });
        });
    }

      // Local storage sirf non-result cheezein carry karta hai ab (jaise downloads count) —
      // asli result/score/attempts hamesha DB (history) se aate hain, kabhi local se nahi.
      const savedRaw = Array.isArray(user.certifications) ? user.certifications : [];
      const savedById = new Map(savedRaw.map((item) => [String(item.id), item]));
      const apiItems = [
        ['practice', practiceRes],
        ['training', trainingRes],
        ['exam', examRes],
      ].flatMap(([type, result]) => (
        result?.ok && Array.isArray(result.quizzes)
          ? result.quizzes.map((quiz) => ({
              ...quiz,
              quiz_type: type,
              quiz_title: quiz.quiz_title || quiz.title || quiz.name || `${type} Quiz`,
              questions: Array.isArray(quiz.questions) ? quiz.questions : [],
            }))
          : []
      ));
      // No dummy fallback: if the API genuinely has nothing (or the call failed),
      // show an empty list rather than bundled sample data.
      const items = apiItems.length
        ? normalizeCertifications(apiItems).map((item) => {
            const hist  = historyByQuizTypeId.get(String(item.id));
            const saved = savedById.get(String(item.id)) || {};
            return {
              ...item,
              downloads: saved.downloads ?? item.downloads, // local-only field
              ...(hist ? {
                score:           hist.score,
                result_type:     hist.result_type,
                obtained_marks:  hist.obtained_marks,
                total_marks:     hist.total_marks,
                attempts:        hist.attempts,
                issued_at:       hist.issued_at,
              } : {}),
            };
          })
        : [];

      // ✅ FIX: Top 3 cards (Attempts / Passed / Downloads) ab seedha /quiz/history (DB) se
      // count hote hain — "My Attempts" screen ke same source se. Pehle listing items se
      // match karte the (id mismatch hone par sab 0 aata tha) aur downloads sirf local the.
      const submitted = (historyRes?.ok && Array.isArray(historyRes.history))
        ? historyRes.history.filter((h) => h.status === 1)
        : null;
      if (submitted) {
        const passedAttempts = submitted.filter((h) => getQuizResultTier(Number(h.percentage ?? 0)).passed);
        // Certificate sirf Exam type + Pass (40%+) attempt par milta hai
        const downloadable = passedAttempts.filter((h) => !h.quiz_type || String(h.quiz_type).trim().toLowerCase() === 'exam');
        return {
          currentUser: user,
          items,
          totalAttempts:  submitted.length,
          passedCount:    passedAttempts.length,
          totalDownloads: downloadable.length,
        };
      }
      // History fail ho gayi to purana item-based fallback
      return { currentUser: user, items, totalAttempts: items.reduce((s, i) => s + i.attempts, 0), passedCount: items.filter((i) => i.result_type && i.result_type !== 'Fail').length, totalDownloads: items.reduce((s, i) => s + i.downloads, 0) };
    } catch { return null; }
  },
  submitQuizAnswers: async (certId, answers) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      let submittedItem = null;
      const items = normalizeCertifications(user.certifications).map((item) => {
        if (item.id !== certId) return item;
        const totalQ   = item.questions.length || 1;
        const answered = Object.keys(answers).length;
        const score    = Math.min(Math.round((answered / totalQ) * 100), 100);
         const tier     = getQuizResultTier(score);
        const pass     = tier.passed;
        const issuedAt = new Date().toISOString();
        const certificateNumber = `RTI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        submittedItem = {
          ...item, score,
          result_type: tier.result_type,
          certificate_file: pass ? 'pending_local_generation' : null,
          local_certificate_path: null,
          certificate_number: pass ? certificateNumber : null,
          user_name: user.name || user.email || 'Participant',
          issued_at: issuedAt,
          attempts: item.attempts + 1,
        };
        return submittedItem;
      });
      const updatedUser = await UserStore.updateUser(user.email, { certifications: items });
      if (!updatedUser) return { ok: false, message: 'Unable to submit quiz.' };
      return {
        ok: true,
        score: submittedItem?.score ?? 0,
        result_type: submittedItem?.result_type ?? 'Fail',
        certificate_file: submittedItem?.certificate_file ?? null,
        local_certificate_path: submittedItem?.local_certificate_path ?? null,
        certificate_number: submittedItem?.certificate_number ?? null,
        user_name: submittedItem?.user_name ?? user.name ?? 'Participant',
        date: submittedItem?.issued_at
          ? new Date(submittedItem.issued_at).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN'),
      };
    } catch { return { ok: false, message: 'Unable to submit quiz answers.' }; }
  },

  downloadCertificate: async (certId) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const certifications = normalizeCertifications(user.certifications);
      const targetItem = certifications.find((item) => item.id === certId);
      if (!targetItem) {
        return { ok: false, message: 'Certificate not found.' };
      }
      const issueDate = new Date().toLocaleDateString('en-IN');
      const certificateNumber = targetItem.certificate_number || `RTI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const svgMarkup = buildCertificateSvg({
        userName:      targetItem.user_name || user.name || 'Participant',
        quizTitle:     targetItem.quiz_title || 'Quiz Examination',
        score:         targetItem.score ?? 0,
        resultType:    targetItem.result_type || 'Pass',
        issueDate, certificateNumber,
        photoUri:      user.profile_image || '',
        email:         user.email || '',
        village:       user.village || '',
        contactNumber: user.contact_number || user.mobile || '',
      });

      const result = await saveCertificateSvg(svgMarkup, `certificate-${targetItem.id}.svg`);
      if (!result.ok) return result;

      const items = certifications.map((item) =>
        item.id !== certId ? item : {
          ...item,
          certificate_file:       result.savedPath || 'downloaded',
          local_certificate_path: result.savedPath,
          certificate_number:     certificateNumber,
          issued_at:              item.issued_at || new Date().toISOString(),
          downloads:              item.downloads + 1,
        }
      );
      const updatedUser = await UserStore.updateUser(user.email, { certifications: items });
      if (!updatedUser) return { ok: false, message: 'Unable to record download.' };
      return { ...result, certificateNumber };
    } catch (err) {
      console.error('downloadCertificate error:', err);
      return { ok: false, message: 'Unable to download certificate.' };
    }
  },

  // Builds and saves a certificate straight from a /quiz/history attempt item —
  // used by "My Attempts", since that history endpoint has no certificate_file of
  // its own and the attempt isn't necessarily present in local user.certifications.
downloadCertificateForAttempt: async (item) => {
  try {
    const user = await UserStore.getCurrentUser();

    if (!user) {
      return { ok: false, message: "Please login again." };
    }

   if (String(item.quiz_type || '').trim().toLowerCase() !== 'exam') {
      return {
        ok: false,
        message: "Certificate is only available for Exam type quizzes.",
      };
    }

    // ✅ 40% se neeche Fail — certificate generate hi nahi hoga
    const tier = getQuizResultTier(item.percentage ?? 0);
    if (!tier.passed) {
      return {
        ok: false,
        message: "Certificate is only available when you pass (40% or above).",
      };
    }

    const issueDate = new Date().toLocaleDateString("en-IN");

    const certificateNumber =
      item.certificate_number ||
      `RTI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const svgMarkup = buildCertificateSvg({
      userName: user.name || "Participant",
      quizTitle: item.quiz_title || "Quiz Examination",
      score: item.percentage ?? 0,
      resultType: tier.badge_label ? `${tier.result_type} — ${tier.badge_label}` : tier.result_type,
      issueDate,
      certificateNumber,
      photoUri: user.profile_image || "",
      email: user.email || "",
      village: user.village || "",
      contactNumber: user.contact_number || user.mobile || "",
    });

    const result = await saveCertificateSvg(svgMarkup, `certificate-${item.attempt_id}.svg`);
    if (!result.ok) return result;

    return { ...result, certificateNumber };
  } catch (err) {
    console.log("Certificate Error:", err);
    console.log("Error Message:", err?.message);
    console.log("Error Stack:", err?.stack);

    return {
      ok: false,
      message: err?.message || "Unable to download certificate.",
    };
  }
},

// ── OLD dynamic-question version — kept for future use ──
  // submitAdLeadForm_OLD_DYNAMIC: async (ad, answers = {}) => {
  //   ... (yaha purana poora method body comment ke andar paste karke rakh dena)
  // },

  // ── Ad Lead Form Submissions — FIXED FIELDS version ─────────────────────
 submitAdLeadForm: async (ad, { firstName, lastName, email, contact, message } = {}) => {
    try {
      if (!ad || !ad.id) return { ok: false, message: 'Invalid advertisement.' };

      const currentUser = await UserStore.getCurrentUser();
      const adId = ad.originalAdId || ad.id;

      // ✅ Real backend call — same /ecom-enquiries endpoint, "type: ads" se differentiate hoga
      const apiRes = await AuthAPI.createEcomEnquiry({
        ecom_id: adId,
        type: 'ads',
        first_name: firstName || '',
        last_name: lastName || '',
        email: email || currentUser?.email || '',
        contact: contact || currentUser?.mobile || '',
        message: message || '',
      });

      if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to submit form.' };

      // ✅ Submitter ko turant notification (usne kya answer diya wo dikhane ke liye)
      if (currentUser?.email) {
        const now = new Date().toISOString();
        const submissionId = `lead-sub-${Date.now()}`;
        const selfNotification = {
          id: `notif-ad-lead-self-${Date.now()}`,
          title: `You filled "${ad.title || 'Advertisement'}"`,
          message: `Name: ${firstName || ''} ${lastName || ''} | Email: ${email || ''} | Contact: ${contact || ''}${message ? ' | Message: ' + message : ''}`,
          date: now.slice(0, 10),
          status: 'Unread',
          type: 'ad_lead_self',
          submission_id: submissionId,
        };
        await UserStore.updateUser(currentUser.email, {
          notifications: [selfNotification, ...normalizeNotifications(currentUser.notifications)],
        });
      }

      return { ok: true, enquiry: apiRes.enquiry };
    } catch (err) {
      console.error('submitAdLeadForm error:', err);
      return { ok: false, message: 'Unable to submit form.' };
    }
  },
  getSettingsSummary: async () => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      return { currentUser: user, settings: normalizeSettings(user.settings) };
    } catch { return null; }
  },

  updateSettings: async ({ language, password }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const nextPassword = password || user.password;
      const updatedUser  = await UserStore.updateUser(user.email, { password: nextPassword, settings: { language, password: password || '' } });
      if (!updatedUser) return { ok: false, message: 'Unable to update settings.' };
      return { ok: true, user: updatedUser };
    } catch { return { ok: false, message: 'Unable to update settings.' }; }
  },

 changeCurrentUserPassword: async ({ currentPassword, newPassword }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      if (!currentPassword || currentPassword !== user.password) return { ok: false, message: 'Current password is incorrect.' };
      if (!newPassword || newPassword.length < 4) return { ok: false, message: 'New password must be at least 4 characters.' };
      if (newPassword === user.password) return { ok: false, message: 'New password must be different from the current password.' };
      const updatedUser = await UserStore.updateUser(user.email, { password: newPassword, settings: { ...normalizeSettings(user.settings), password: newPassword } });
      if (!updatedUser) return { ok: false, message: 'Unable to change password.' };
      return { ok: true, user: updatedUser };
    } catch { return { ok: false, message: 'Unable to change password.' }; }
  },

  updatePassword: async (email, password) => {
    try {
      // ✅ FIX: updatePassword bhi lowercase email se
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const data    = await AsyncStorage.getItem(USERS_KEY);
      const users   = data ? JSON.parse(data) : [];
      const updated = users.map((u) => {
        const userEmail = u.email ? u.email.trim().toLowerCase() : '';
        return userEmail === normalizedEmail ? { ...u, password } : u;
      });
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated.some((u) => (u.email || '').trim().toLowerCase() === normalizedEmail);
    } catch { return false; }
  },

  saveResetOtp: async ({ email, otp, expiresAt }) => {
    try {
      // ✅ FIX: OTP bhi lowercase email se save karo
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const data   = await AsyncStorage.getItem(OTP_KEY);
      const otpMap = data ? JSON.parse(data) : {};
      otpMap[normalizedEmail] = { otp, expiresAt };
      await AsyncStorage.setItem(OTP_KEY, JSON.stringify(otpMap));
      return true;
    } catch { return false; }
  },

  getResetOtp: async (email) => {
    try {
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const data   = await AsyncStorage.getItem(OTP_KEY);
      const otpMap = data ? JSON.parse(data) : {};
      return otpMap[normalizedEmail] || null;
    } catch { return null; }
  },

  clearResetOtp: async (email) => {
    try {
      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const data   = await AsyncStorage.getItem(OTP_KEY);
      const otpMap = data ? JSON.parse(data) : {};
      delete otpMap[normalizedEmail];
      await AsyncStorage.setItem(OTP_KEY, JSON.stringify(otpMap));
      return true;
    } catch { return false; }
  },

followUser: async (targetUserEmail, targetUserId) => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return { ok: false, message: 'Please login again.' };
      const targetEmail = String(targetUserEmail || '').trim().toLowerCase();
      const currentEmail = String(currentUser.email || '').trim().toLowerCase();
      if (!targetEmail && !targetUserId) return { ok: false, message: 'User not found.' };
      if (currentEmail === targetEmail) return { ok: false, message: 'Cannot follow yourself.' };

      let targetId = targetUserId ?? null;
      if (!targetId) {
        const targetUser = await UserStore.getUser(targetEmail);
        targetId = targetUser?.id ?? targetUser?.user_id ?? null;
      }
      if (!targetId) return { ok: false, message: 'Unable to resolve user id.' };

          const apiResult = await AuthAPI.followUserApi(targetId);
      if (!apiResult.ok) return apiResult;

         // ✅ FIX: success ke baad local cached currentUser.following update nahi hota tha.
      try {
         const myFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
        if (targetEmail && !myFollowing.includes(targetEmail)) {
          await UserStore.updateUser(currentEmail, { following: [...myFollowing, targetEmail] });
        }
      } catch { /* best-effort cache sync */ }

      // ✅ isi id/email ke sabhi follow buttons (app mein kahin bhi) ko turant notify karo
      _broadcastFollowChange(targetEmail, targetId, true);
      // Naam + photo background me bhar do (best-effort) taaki Following list me
      // backend ke refresh se pehle bhi sahi naam/photo dikhe.
      (async () => {
        try {
          const prof = await UserStore.getPublicProfileById(targetId);
          if (!prof) return;
          const fullName = [prof.firstname, prof.lastname].filter((x) => x && String(x).trim()).join(' ').trim();
          _rememberFollowing(targetEmail, targetId, true, {
            name: fullName || prof.name || '',
            profile_image: prof.profile_image || prof.profile_image_url || prof.avatar || '',
          });
        } catch { /* ignore */ }
      })();
      return {
        ok: true,
        message: 'Successfully followed user.',
        isFollowing: true,
        followersCount: apiResult.data?.followers_count ?? null,
        followingCount: apiResult.data?.following_count ?? null,
      };
    } catch (error) {
      console.error('followUser error:', error);
      return { ok: false, message: 'Unable to follow user.' };
    }
  },

  unfollowUser: async (targetUserEmail, targetUserId) => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return { ok: false, message: 'Please login again.' };
      const targetEmail = String(targetUserEmail || '').trim().toLowerCase();
      const currentEmail = String(currentUser.email || '').trim().toLowerCase();
      if (!targetEmail && !targetUserId) return { ok: false, message: 'User not found.' };

      let targetId = targetUserId ?? null;
      if (!targetId) {
        const targetUser = await UserStore.getUser(targetEmail);
        targetId = targetUser?.id ?? targetUser?.user_id ?? null;
      }
      if (!targetId) return { ok: false, message: 'Unable to resolve user id.' };

             const apiResult = await AuthAPI.unfollowUserApi(targetId);
      if (!apiResult.ok) return apiResult;

      // ✅ FIX: followUser wala hi cache-sync fix, unfollow ke liye.
      try {
        const myFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
        await UserStore.updateUser(currentEmail, { following: myFollowing.filter((e) => e !== targetEmail) });
      } catch { /* cache sync best-effort hai, API result asli source of truth hai */ }

      // ✅ isi id/email ke sabhi follow buttons ko turant notify karo
      _broadcastFollowChange(targetEmail, targetId, false);

      return {
        ok: true,
        message: 'Successfully unfollowed user.',
        isFollowing: false,
        followersCount: apiResult.data?.followers_count ?? null,
        followingCount: apiResult.data?.following_count ?? null,
      };
    } catch (error) {
      console.error('unfollowUser error:', error);
      return { ok: false, message: 'Unable to unfollow user.' };
    }
  },
     blockUser: async (targetUserEmail, targetUserId) => {
    try {
      let targetId = targetUserId ?? null;
      if (!targetId) {
        const targetUser = await UserStore.getUser(String(targetUserEmail || '').trim().toLowerCase());
        targetId = targetUser?.id ?? targetUser?.user_id ?? null;
      }
      if (!targetId) return { ok: false, message: 'Unable to resolve user id.' };
      // ✅ FIX: sirf POST /users/block hit karo — koi doosri API call nahi.
      // Backend khud follow-relation hata deta hai jab block hota hai, isliye
      // yahan se separate POST /users/unfollow call karne ki zaroorat nahi thi.
      const apiResult = await AuthAPI.blockUserApi(targetId);
      if (!apiResult.ok) return apiResult;

      // Local cache sirf update karo (koi network call nahi) taaki follow button
      // turant "not following" dikhaye, backend se dobara fetch kiye bina.
      try {
        const currentUser = await UserStore.getCurrentUser();
        const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
        const targetEmail = String(targetUserEmail || '').trim().toLowerCase();
        if (currentUser && targetEmail) {
          const myFollowing = Array.isArray(currentUser.following) ? currentUser.following : [];
          await UserStore.updateUser(currentEmail, { following: myFollowing.filter((e) => e !== targetEmail) });
        }
        _broadcastFollowChange(targetEmail, targetId, false);
      } catch { /* local cache sync best-effort hai */ }

      return { ok: true, message: 'User blocked.' };
    } catch (error) {
      console.error('blockUser error:', error);
      return { ok: false, message: 'Unable to block user.' };
    }
  },

  unblockUser: async (targetUserEmail, targetUserId) => {
    try {
      let targetId = targetUserId ?? null;
      if (!targetId) {
        const targetUser = await UserStore.getUser(String(targetUserEmail || '').trim().toLowerCase());
        targetId = targetUser?.id ?? targetUser?.user_id ?? null;
      }
      if (!targetId) return { ok: false, message: 'Unable to resolve user id.' };
      const apiResult = await AuthAPI.unblockUserApi(targetId);
      if (!apiResult.ok) return apiResult;
      return { ok: true, message: 'User unblocked.' };
    } catch (error) {
      console.error('unblockUser error:', error);
      return { ok: false, message: 'Unable to unblock user.' };
    }
  },
  getBlockedUsers: async () => {
    const result = await AuthAPI.getBlockedUsersApi();
    if (!result.ok) return result;
    const list = (Array.isArray(result.list) ? result.list : []).map((raw) => {
      const u = raw?.blocked_user || raw?.user || raw || {};
      return {
        id: u.id ?? u.user_id ?? raw?.user_id ?? raw?.blocked_user_id ?? null,
        email: String(u.email || raw?.email || '').trim().toLowerCase(),
        name: u.name || raw?.name || 'User',
        profile_image: u.profile_image || raw?.profile_image || '',
      };
    });
    return { ok: true, list };
  },

  getFollowStatus: async (targetUserEmail) => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return { isFollowing: false, followersCount: 0, followingCount: 0 };
      const targetEmail = String(targetUserEmail || '').trim().toLowerCase();

      const targetUser = await UserStore.getUser(targetEmail);
      if (!targetUser) return { isFollowing: false, followersCount: 0, followingCount: 0 };

      const isFollowing = normalizeEmailList(currentUser.following).includes(targetEmail);
      const followersCount = normalizeEmailList(targetUser.followers).length;
      const followingCount = normalizeEmailList(targetUser.following).length;

        return { isFollowing, followersCount, followingCount };
    } catch (error) {
      console.error('getFollowStatus error:', error);
      return { isFollowing: false, followersCount: 0, followingCount: 0 };
    }
  },

  // ✅ FIX (follow bugs):
  //  1. Pehle kisi DUSRE user ka summary mangne par uski following list me MERA optimistic
  //     follow bhi merge ho jata tha — isliye us user ki following me 1 dikhta tha aur
  //     list me wahi user khud dikhta tha (click karne par uska apna account khulta tha).
  //  2. isFollowing galat list se nikalta tha (target ki following me target ko dhundh
  //     raha tha). Ab hamesha MERI following list me target ko dhundhte hain.
  //  3. Backend ka followers list follow ke turant baad stale (0) aa sakta hai, isliye
  //     meri recent follow/unfollow action target ke followers me apply hoti hai.
  getFollowSummary: async (email, id) => {
    try {
      const targetEmail = String(email || '').trim().toLowerCase();
      let targetId = id != null && String(id) !== '' ? String(id) : '';

      const currentUser = await UserStore.getCurrentUser().catch(() => null);
      const myEmail = String(currentUser?.email || '').trim().toLowerCase();
      const myIdRaw = currentUser?.id ?? currentUser?.user_id ?? null;
      const myId = myIdRaw != null ? String(myIdRaw) : '';

      const isSelf = targetId
        ? Boolean(myId && myId === targetId)
        : (!targetEmail || (myEmail && targetEmail === myEmail));

      // Sirf email mila ho to local cache se numeric id resolve karne ki koshish.
      if (!isSelf && !targetId && targetEmail) {
        try {
          const cached = await UserStore.getUser(targetEmail);
          const cachedId = cached?.id ?? cached?.user_id ?? null;
          if (cachedId != null) targetId = String(cachedId);
        } catch { /* ignore */ }
      }

      const matchesTarget = (u) => {
        const uId = u?.id != null ? String(u.id) : '';
        const uEmail = String(u?.email || u?.user_email || '').trim().toLowerCase();
        return Boolean((targetId && uId && uId === targetId) || (targetEmail && uEmail && uEmail === targetEmail));
      };

      // ── Apni profile: purana behaviour (meri lists + optimistic merge) ──
      if (isSelf) {
        const [followingRes, followersRes] = await Promise.all([
          AuthAPI.getFollowingApi(),
          AuthAPI.getFollowersApi(),
        ]);
        const following = _mergeFollowing((followingRes.ok ? followingRes.list : []).map(_normalizeFollowListItem));
        const followers = (followersRes.ok ? followersRes.list : []).map(_normalizeFollowListItem);
        return {
          isFollowing: false,
          followingCount: following.length,
          following,
          followersCount: followers.length,
          followers,
          resolvedId: myIdRaw,
        };
      }

      // ── Kisi aur ka profile ──
      // Meri following (isFollowing nikalne ke liye) + (agar id mili) target ki lists.
      const [myFollowingRes, targetFollowingRes, targetFollowersRes] = await Promise.all([
        AuthAPI.getFollowingApi(),
        targetId ? AuthAPI.getFollowingApi(targetId) : Promise.resolve(null),
        targetId ? AuthAPI.getFollowersApi(targetId) : Promise.resolve(null),
      ]);

      const myFollowing = _mergeFollowing((myFollowingRes.ok ? myFollowingRes.list : []).map(_normalizeFollowListItem));
      let resolvedId = targetId || null;
      const isFollowing = myFollowing.some((u) => {
        if (matchesTarget(u)) { if (resolvedId == null && u.id != null) resolvedId = u.id; return true; }
        return false;
      });
      if (!resolvedId) {
        const m = myFollowing.find(matchesTarget);
        if (m?.id != null) resolvedId = m.id;
      }

      // Target ki id nahi mili => uski lists nahi la sakte; MERI lists dikhane ka risk
      // nahi lenge. Counts null bhejte hain taaki screen purane counts na toote.
      if (!targetId || !targetFollowingRes || !targetFollowersRes) {
        return { isFollowing, followingCount: null, following: [], followersCount: null, followers: [], resolvedId };
      }

      // Target ki following — target khud isme kabhi nahi hona chahiye.
      const targetFollowing = (targetFollowingRes.ok ? targetFollowingRes.list : [])
        .map(_normalizeFollowListItem)
        .filter((u) => !matchesTarget(u));

      // Target ke followers — meri recent follow/unfollow action apply karo.
      let targetFollowers = (targetFollowersRes.ok ? targetFollowersRes.list : []).map(_normalizeFollowListItem);
      const isMe = (u) => {
        const uId = u?.id != null ? String(u.id) : '';
        const uEmail = String(u?.email || '').trim().toLowerCase();
        return Boolean((myId && uId && uId === myId) || (myEmail && uEmail && uEmail === myEmail));
      };
      const override = _followOverrides.has(`id:${targetId}`)
        ? _followOverrides.get(`id:${targetId}`)
        : (targetEmail && _followOverrides.has(`email:${targetEmail}`) ? _followOverrides.get(`email:${targetEmail}`) : undefined);
      if (override === true && !targetFollowers.some(isMe) && (myId || myEmail)) {
        targetFollowers = [
          ...targetFollowers,
          _normalizeFollowListItem({
            id: myIdRaw,
            email: myEmail,
            name: currentUser?.name || '',
            profile_image: currentUser?.profile_image || '',
          }),
        ];
      } else if (override === false) {
        targetFollowers = targetFollowers.filter((u) => !isMe(u));
      }

      return {
        isFollowing,
        followingCount: targetFollowing.length,
        following: targetFollowing,
        followersCount: targetFollowers.length,
        followers: targetFollowers,
        resolvedId,
      };
    } catch (error) {
      console.error('getFollowSummary error:', error);
      return null;
    }
  },
   saveSelectedSeat: async (seatId, plan = null) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const seatRoleId = String(seatId || '').trim() === 'seat-common' ? 'common' : String(seatId || '').trim();
      if (!seatRoleId) return { ok: false, message: 'Invalid seat id.' };
      const profileState = String(user.state || '').trim();
      if (!profileState) return { ok: false, message: 'Please select your state first.' };
      const roleMeta = seatRoleId === 'common'
        ? { id: 'common', name: 'Common User' }
        : getStateSeatRole(seatRoleId);
      if (!roleMeta) return { ok: false, message: 'Invalid seat selection.' };
      const today = new Date().toISOString().slice(0, 10);
      const isUnlimitedSeat = UNLIMITED_SEAT_IDS.includes(seatRoleId);
      const expiresAt = plan?.expires_at || user.subscription_plan?.expires_at || null;

      // ✅ FIX: plan pass hua ho to usi se, warna user ko dikhne wale matching
      // plan se — scope (state/district/taluka) decide hoga
      const effectivePlan = plan || findPlanForSeat(seatRoleId, user);
      const scopeKey = isUnlimitedSeat ? '' : getPlanSeatScopeKey(effectivePlan, user);

      if (!isUnlimitedSeat && scopeKey) {
        const allocations = await getStateSeatAllocationsFromStorage();
        const scopeAlloc = allocations[scopeKey] && typeof allocations[scopeKey] === 'object' ? allocations[scopeKey] : {};
        const entry = scopeAlloc?.[seatRoleId] || null;
        const entryExpiresAt = entry?.expires_at ? new Date(entry.expires_at).getTime() : null;
        const isExpired = entryExpiresAt !== null && !Number.isNaN(entryExpiresAt) && entryExpiresAt < Date.now();
        const takenBy = (!isExpired && entry?.email) ? String(entry.email).trim().toLowerCase() : '';
        if (takenBy && takenBy !== user.email) {
          return { ok: false, message: `"${roleMeta.name}" seat is already taken here. Try again after it expires.` };
        }
        const updatedAllocations = {
          ...allocations,
          [scopeKey]: {
            ...scopeAlloc,
            [seatRoleId]: { email: user.email, name: user.name || '', assigned_at: today, expires_at: expiresAt },
          },
        };
        await AsyncStorage.setItem(STATE_SEATS_KEY, JSON.stringify(updatedAllocations));
      }

      const seatToAssign = {
        state: profileState,
        // ✅ FIX: pehle hamesha user ki profile location save hoti thi, chahe
        // plan kisi aur district/taluka/village ke liye bana ho. Ab plan ki
        // apni location (jis par seat actually lock hui hai) priority se
        // save hogi, user ki profile location sirf fallback hai.
        district: String(effectivePlan?.district || user.district || '').trim(),
        taluka: String(effectivePlan?.taluka || user.taluka || '').trim(),
        village: String(effectivePlan?.village || user.village || '').trim(), // ✅ NEW
        seat_id: seatRoleId,
        seat_name: roleMeta.name,
        assigned_at: today,
        plan_id: String(user.subscription_plan?.plan_id || '').trim(),
      };
      const updatedUser = await UserStore.updateUser(user.email, { state_seat: seatToAssign });
      if (!updatedUser) return { ok: false, message: 'Unable to save seat.' };
      return { ok: true, seat: seatToAssign };
    } catch (err) {
      console.error('saveSelectedSeat error:', err);
      return { ok: false, message: 'Unable to save seat.' };
    }
  },
 saveSubscription: async ({ plan_id, plan_name, seat_id, price, duration }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      // ✅ FIX: cached backend plans se match karo, dummy array se nahi
      const activePlan = cachedBackendPlans.find((p) => p.plan_id === plan_id)
        || { plan_id, plan_name, price: Number(price || 0), duration: duration || '', features: [] };
      const newRole = activePlan.role || getRoleFromPlanName(plan_name || activePlan.plan_name || '');

      // ✅ FIX: Backend Sync — real server pe subscription activate karo, sirf local nahi
      const backendPlanId = getBackendPlanId(plan_id);
      if (backendPlanId) {
        const seatMeta = getStateSeatRole(seat_id);
        const backendRes = await AuthAPI.purchaseRoleSubscription({
          planId: backendPlanId,
          stateSeat: seatMeta?.name || '',
          paymentStatus: 1,
          transaction: `TXN-${Date.now()}`,
        });
        if (!backendRes.ok) {
          return { ok: false, message: backendRes.message || 'Subscription activation failed on server. Please try again.' };
        }
      }
      const today = new Date().toISOString().slice(0, 10);
      const newPayment = { order_id: `ORD_${Date.now()}`, payment_id: `PAY_${Date.now()}`, amount: Number(activePlan.price || price || 0), status: 'success', date: today, plan_id: activePlan.plan_id, plan_name: activePlan.plan_name, signature: '' };
      const roleNotification = { id: `notif-sub-${Date.now()}`, title: `🎉 ${activePlan.plan_name} Activated!`, message: `Your subscription has been activated. Enjoy your new features!`, date: today, status: 'Unread' };
      const currentNotifications = normalizeNotifications(user.notifications);
      const updatedUser = await UserStore.updateUser(user.email, {
        subscription_plan: activePlan,
        subscription_type: newRole,
        role: newRole,
        role_label: getRoleLabel(newRole),
        is_subscribed: true,
        payment_history: [...normalizePaymentHistory(user.payment_history), newPayment],
        notifications: [...currentNotifications, roleNotification],
      });
          if (!updatedUser) return { ok: false, message: 'Unable to save subscription.' };
      const wasAlreadySubscribed = Boolean(user.is_subscribed);
      await recordQualifyingTransaction({
        buyerEmail: user.email,
        amount: Number(activePlan.price || price || 0),
        packageType: 'subscription',
        transactionId: newPayment.payment_id,
        isRenewal: wasAlreadySubscribed,
      });
      return { ok: true, plan: activePlan, role: newRole };
    } catch (err) {
      console.error('saveSubscription error:', err);
      return { ok: false, message: 'Unable to save subscription.' };
    }
  },

  // ✅ NEW: /ads-views index API se real per-ad view counts fetch karta hai
  getAdViewsMap: async () => {
    try {
      const res = await AuthAPI.getAdViewsList();
      if (!res.ok || !Array.isArray(res.views)) return {};
      const map = {};
      res.views.forEach((v) => {
        const id = String(v.ads_id ?? v.ad_id ?? v.id ?? '');
        if (!id) return;
        map[id] = Number(v.views ?? v.count ?? v.total ?? 0);
      });
      return map;
    } catch { return {}; }
  },

  getAdCreditsSummary: async () => {
    await UserStore.syncCreditSubscriptionsFromBackend();
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return null;
      const creditState = getCreditExpiryState(user.ad_credits, user.ad_subscription);
      if (creditState.expired && Number(user.ad_credits ?? 0) > 0) {
        await UserStore.updateUser(user.email, {
          ad_credits: 0,
          ad_subscription: creditState.subscription,
        });
      }
      // ✅ FIX: ads-views index API se real view counts integrate kiye
      // ✅ FIX: purane ads (jinme local end_date save nahi thi) ke liye backend se
      // start_date/end_date le aao. 4 sec me jawab na aaye to skip (page slow na ho).
      let backendAdsList = [];
      try {
        const backendRes = await Promise.race([
          AuthAPI.getAdsDetails(),
          new Promise((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        if (backendRes?.ok && Array.isArray(backendRes.ads)) backendAdsList = backendRes.ads;
      } catch (e) { /* ignore */ }
      const backendAdsById = new Map(backendAdsList.map((b) => [String(b.id), b]));
      const adsWithViews = (Array.isArray(user.ads) ? user.ads : []).map((ad) => {
        const b = backendAdsById.get(String(ad.id)) || {};
        return {
          ...ad,
          views: ad.views ?? 0,
          start_date: ad.start_date || b.start_date || '',
          end_date: ad.end_date || b.end_date || '',
        };
      });
      return {
        credits: creditState.credits,
        ads: adsWithViews,
        ad_subscription: creditState.subscription,
        expired: creditState.expired,
        expires_at: creditState.expires_at,
      };
    } catch { return null; }
  },
  
// ✅ NEW: Profile "My Posts" ke liye — user ke apne Advertisement posts.
// Sources: (1) user.ads (jo My Ads screen dikhati hai) + (2) backend GET /ads-details me
// jahan owner_id / user_id / owner_email ya redirection_url (profile/<email>) is user se match kare.
// Har ad ko post-shape me convert karta hai; id 'ad-<id>' hoti hai taaki news ki id se na takraye.
getMyAdPosts: async () => {
  try {
    const user = await UserStore.getCurrentUser();
    if (!user) return [];
    const myEmail = String(user.email || '').trim().toLowerCase();
    const myId = user.id != null ? String(user.id) : '';

    const byId = new Map();
    (Array.isArray(user.ads) ? user.ads : []).forEach((ad) => {
      if (ad?.id != null) byId.set(String(ad.id), ad);
    });

    try {
      const res = await AuthAPI.getAdsDetails();
      if (res?.ok && Array.isArray(res.ads)) {
        res.ads.forEach((ad) => {
          if (ad?.id == null) return;
          const ownerId = (ad.owner_id ?? ad.user_id) != null ? String(ad.owner_id ?? ad.user_id) : '';
          const ownerEmail = String(ad.owner_email || '').trim().toLowerCase();
          const m = String(ad.redirection_url || '').match(/profile\/([^/?]+)/);
          let deepEmail = '';
          if (m?.[1]) { try { deepEmail = decodeURIComponent(m[1]).trim().toLowerCase(); } catch { deepEmail = m[1].trim().toLowerCase(); } }
          const isMine = (ownerId && myId && ownerId === myId)
            || (ownerEmail && ownerEmail === myEmail)
            || (deepEmail && deepEmail === myEmail);
          if (isMine) byId.set(String(ad.id), { ...(byId.get(String(ad.id)) || {}), ...ad });
        });
      }
    } catch (e) { /* backend fail ho to local ads hi dikhenge */ }

    return Array.from(byId.values()).map((ad) => {
      const created = ad.created_at || ad.createdAt || ad.start_date || '';
      const img = ad.image || ad.photo || '';
      return {
        id: `ad-${ad.id}`,
        ad_id: ad.id,
        is_ad: true,
        post_type: 'ad',
        title: ad.title || 'Advertisement',
        content: ad.title || ad.description || '',
        description: ad.description || '',
        image: img,
        photo: img,
        createdAt: created,
        created_at: created,
        end_date: ad.end_date || '',
        views: Number(ad.views ?? 0),
        likes: 0,
        comments: 0,
      };
    });
  } catch (e) { console.log('[getMyAdPosts] failed:', e); return []; }
},

getActiveAdsFeed: async (options = {}) => {
  try {
    const res = await AuthAPI.getAdsDetails(); // GET /ads-details — no login required
    if (!res.ok || !Array.isArray(res.ads)) return [];

    const today = new Date().toISOString().slice(0, 10);

      const blockedRes = options?.skipBlockedUsers
      ? { ok: true, list: [] }
      : await UserStore.getBlockedUsers();
    const blockedEmailsForAds = new Set((blockedRes?.list || []).map((u) => u.email).filter(Boolean));
    const blockedIdsForAds = new Set((blockedRes?.list || []).map((u) => (u.id != null ? String(u.id) : '')).filter(Boolean));
    const currentUserForAds = await UserStore.getCurrentUser().catch(() => null);
    const currentUserEmailForAds = String(currentUserForAds?.email || '').trim().toLowerCase();
    const currentUserHasBlueTickForAds = Boolean(currentUserForAds && hasBlueTick(currentUserForAds));
    const isBlockedAdOwner = (ad) => {
      const ownerEmail = String(ad?.owner_email || '').trim().toLowerCase();
      const ownerId = (ad?.owner_id ?? ad?.user_id) != null ? String(ad.owner_id ?? ad.user_id) : '';
      if (ownerEmail && blockedEmailsForAds.has(ownerEmail)) return true;
      if (ownerId && blockedIdsForAds.has(ownerId)) return true;
      return false;
    };

    return res.ads
      .filter((ad) => Number(ad?.status ?? 1) === 1)
      // ✅ FIX: expired ads (end_date guzar chuki) ko Home feed pe mat dikhao
      .filter((ad) => !ad?.end_date || String(ad.end_date) >= today)
      .filter((ad) => !isBlockedAdOwner(ad))
      .map((ad) => {
        // ✅ FIX: actual field "redirection_url" hai ("url" nahi), aur usi
        // deep-link (rti-news://profile/<email>) se owner ka email nikal rahe hain
        const redirectionUrl = ad.redirection_url || '';
        let ownerEmail = ad.owner_email || '';
        const profileMatch = redirectionUrl.match(/profile\/([^/?]+)/);
        if (!ownerEmail && profileMatch?.[1]) {
          try { ownerEmail = decodeURIComponent(profileMatch[1]); } catch { ownerEmail = profileMatch[1]; }
        }

      const REDIRECTION_ID_TO_TYPE = { 1: 'profile', 2: 'website', 3: 'shop', 4: 'lead_form', 5: 'whatsapp' };
        const redirectType = REDIRECTION_ID_TO_TYPE[Number(ad.redirection)]
          || (redirectionUrl.startsWith('rti-news://profile/') ? 'profile' : (redirectionUrl ? 'external' : 'profile'));
        const extraValues = {};
        if (redirectType === 'website') extraValues.website_url = redirectionUrl;
        if (redirectType === 'shop') extraValues.shop_url = redirectionUrl;
        if (redirectType === 'whatsapp') extraValues.whatsapp_number = String(ad.owner_mobile || ad.contact_number || '');

        return {
          id: ad.id,
          feed_id: `ad-feed-${ad.id}`,
          title: ad.title || 'Sponsored Advertisement',
          description: ad.description || '',
          photo: ad.image || '',
          image: ad.image || '',
                    images: (() => {
            const rawList = Array.isArray(ad.images) ? ad.images : [];
            const urls = rawList
              .map((x) => (typeof x === 'string' ? x : (x?.url || x?.image_url || x?.image || '')))
              .filter(Boolean);
            return Array.from(new Set([ad.image, ...urls].filter(Boolean)));
          })(),
          video: ad.video || ad.video_url || '',
          url: redirectionUrl,
          redirect: redirectType,
          extraValues,
          state: ad.state || '',
          district: ad.district || '',
                owner_email: ownerEmail,
          owner_id: ad.owner_id ?? ad.user_id ?? null,
          owner_name: ad.owner_name || 'Advertiser',
        owner_profile_image: ad.owner_profile_image || '',
                  owner_has_blue_tick: Boolean(
            ad.owner_has_blue_tick ||
            ad.has_blue_tick ||
            hasBlueTick(ad.owner || ad.user || {}) ||
            (ownerEmail && currentUserEmailForAds && String(ownerEmail).trim().toLowerCase() === currentUserEmailForAds && currentUserHasBlueTickForAds)
          ),
          owner_mobile: ad.owner_mobile || ad.contact_number || '',
          allowCalls: ad.allowCalls !== false,
          created_at: ad.created_at || '',
          updated_at: ad.updated_at || '',
        };
      })
        .sort((a, b) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
  } catch (e) { console.log('[DEBUG getActiveAdsFeed] failed:', e); return []; }
},
// getAdsDetailsFeed ab isi ko point kare — same function, ek jagah se maintain hoga
getAdsDetailsFeed: async () => UserStore.getActiveAdsFeed(),

refreshNewsCounts: async (postId) => {
  const res = await AuthAPI.getNewsCounts({ newsId: postId });
  if (!res.ok) return null;
  return {
    likes: Number(res.counts?.likes || 0),
    comments: Number(res.counts?.comments || 0),
    shares: Number(res.counts?.shares || 0),
    views: Number(res.counts?.views || 0),
  };
},

recordAdImpression: async (adsId) => {
  if (!adsId) return { ok: false };
  return AuthAPI.recordAdView(adsId);
},




createAdOrder: async ({ planId }) => {
    try {
      const orderResult = await AuthAPI.createAdSubscriptionOrder({ planId });
      if (!orderResult?.ok) return { ok: false, message: orderResult?.message };
      return { ok: true, razorpay: orderResult.razorpay };
    } catch { return { ok: false, message: 'Unable to create order.' }; }
  },

  verifyAdPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }) => {
  try {
    const user = await UserStore.getCurrentUser();
    if (!user) return { ok: false, message: 'Please login again.' };

    const verifyRes = await AuthAPI.verifySubscriptionPayment({
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    });
    if (!verifyRes?.ok) return { ok: false, message: verifyRes?.message || 'Payment verification failed.' };

    // ✅ FIX: verify safal hone ke baad local user record me credits actually add karo
    const today = new Date().toISOString().slice(0, 10);
    const currentState = getCreditExpiryState(user.ad_credits, user.ad_subscription);
    const addedCredits = Number(plan?.credits || 0);
    const newCredits = Number(currentState.credits || 0) + addedCredits;
    const validDays = Number(plan?.validity_days || CREDIT_VALIDITY_DAYS);

    const adSubscription = {
      plan_id: plan?.id,
      plan_name: plan?.name,
      price: Number(plan?.price || 0),
      credits: addedCredits,
      duration: plan?.duration || `${validDays} Days`,
      validity_days: validDays,
      purchased_at: today,
      expires_at: addDaysToDateString(today, validDays),
      status: 'active',
    };

     const adPayment = {
      order_id:   `ORD_ADS_${Date.now()}`,
      payment_id: razorpay_payment_id || `PAY_ADS_${Date.now()}`,
      amount:     adSubscription.price,
      status:     'success',
      date:       today,
      plan_id:    adSubscription.plan_id,
      plan_name:  adSubscription.plan_name,
      module:     'ads',
      signature:  razorpay_signature || '',
    };

    const updatedUser = await UserStore.updateUser(user.email, {
      ad_credits: newCredits,
      ad_subscription: adSubscription,
      payment_history: [...normalizePaymentHistory(user.payment_history), adPayment],
    });

    if (!updatedUser) return { ok: false, message: 'Credits save nahi ho paaye.' };
    return { ok: true, credits: newCredits };
  } catch (err) {
    console.error('[UserStore.verifyAdPayment] Error:', err);
    return { ok: false, message: 'Verification failed.' };
  }
},

  createEcomOrder: async ({ planId }) => {
    try {
      const orderResult = await AuthAPI.createEcomSubscriptionOrder({ planId });
      if (!orderResult?.ok) return { ok: false, message: orderResult?.message };
      return { ok: true, razorpay: orderResult.razorpay };
    } catch { return { ok: false, message: 'Unable to create order.' }; }
  },

  // ✅ FIX: pehle verify hone ke baad bhi local user record me ecom subscription
  // save nahi hoti thi, isliye Sell page hamesha "not subscribed" hi dikhta tha.
  // Ab verify safal hone ke baad user.ecome_subscription / ecome_credits update
  // karte hain — bilkul verifyAdPayment jaisa.
  verifyEcomPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };

      const verifyRes = await AuthAPI.verifySubscriptionPayment({
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
      });
      if (!verifyRes?.ok) return { ok: false, message: verifyRes?.message || 'Payment verification failed.' };

      const today = new Date().toISOString().slice(0, 10);
      const currentState = getCreditExpiryState(user.ecome_credits, user.ecome_subscription);
      const addedCredits = Number(plan?.credits || 0);
      const newCredits = Number(currentState.credits || 0) + addedCredits;
      const validDays = Number(plan?.validity_days || CREDIT_VALIDITY_DAYS);

      const ecomSubscription = {
        plan_id: plan?.id,
        plan_name: plan?.label || plan?.plan_name,
        price: Number(plan?.price || 0),
        credits: addedCredits,
        duration: plan?.duration || `${validDays} Days`,
        validity_days: validDays,
        purchased_at: today,
        expires_at: addDaysToDateString(today, validDays),
        status: 'active',
      };

        const wasAlreadyEcomSubscribed = Boolean(user.ecome_subscription);
      const updatedUser = await UserStore.updateUser(user.email, {
        ecome_credits: newCredits,
        ecome_subscription: ecomSubscription,
      });

      if (!updatedUser) return { ok: false, message: 'Unable to save your subscription.' };
      await recordQualifyingTransaction({
        buyerEmail: user.email,
        amount: Number(ecomSubscription.price || 0),
        packageType: 'ecommerce',
        transactionId: razorpay_payment_id || `TXN-${Date.now()}`,
        isRenewal: wasAlreadyEcomSubscribed,
      });
      return { ok: true, credits: newCredits, subscription: ecomSubscription };
    } catch (err) {
      console.error('[UserStore.verifyEcomPayment] Error:', err);
      return { ok: false, message: 'Verification failed.' };
    }
  },
  // buyAdCredits: async ({ plan_id, plan_name, price, credits, duration, validity_days }) => {
  //   try {
  //     const user = await UserStore.getCurrentUser();
  //     if (!user) return { ok: false, message: 'Please login again.' };

  //     const today = new Date().toISOString().slice(0, 10);
  //     const currentState = getCreditExpiryState(user.ad_credits, user.ad_subscription);
  //     const validDays = Number(validity_days || CREDIT_VALIDITY_DAYS);
  //     const newCredits = Number(currentState.credits ?? 0) + Number(credits);

  //     const adSubscription = {
  //       plan_id,
  //       plan_name,
  //       price: Number(price),
  //       credits: Number(credits),
  //       duration: duration || `${validDays} Days`,
  //       validity_days: validDays,
  //       purchased_at: today,
  //       expires_at: addDaysToDateString(today, validDays),
  //       status: 'active',
  //     };

  //     const updatedUser = await UserStore.updateUser(user.email, {
  //       ad_credits: newCredits,
  //       ad_subscription: adSubscription,
  //     });

  //          const wasAlreadyAdSubscribed = Boolean(user.ad_subscription);
      // if (!updatedUser) return { ok: false, message: 'Unable to activate ad plan.' };
      // await recordQualifyingTransaction({
      //   buyerEmail: user.email,
      //   amount: Number(price || 0),
      //   packageType: 'ads',
      //   transactionId: `TXN-AD-${Date.now()}`,
      //   isRenewal: wasAlreadyAdSubscribed,
      // });
      // return { ok: true, credits: newCredits, plan: adSubscription };
  //   } catch { return { ok: false, message: 'Unable to activate ad plan.' }; }
  // },

// useAdCredit ko replace karo — ab yeh POST /ads-details call karega
useAdCredit: async (reason = 'post', adData = {}) => {
  try {
    const user = await UserStore.getCurrentUser();
    if (!user) return { ok: false, message: 'Please login again.' };

    const creditState = getCreditExpiryState(user.ad_credits, user.ad_subscription);
    if (creditState.expired) {
      await UserStore.updateUser(user.email, { ad_credits: 0, ad_subscription: creditState.subscription });
      return { ok: false, code: 'CREDITS_EXPIRED', message: 'Your ad credits have expired. Please buy a new monthly plan.' };
    }
    const currentCredits = Number(creditState.credits ?? 0);
    if (currentCredits <= 0) return { ok: false, message: 'No credits left. Please buy a new plan.' };

    const today = new Date().toISOString().slice(0, 10);

    if (reason === 'post') {
      const redirectType = String(adData.redirection || adData.redirect || '').trim().toLowerCase();
      const redirectUrl = redirectType === 'whatsapp'
        ? `https://wa.me/91${String(adData.extraValues?.whatsapp_number || '').replace(/\D/g, '')}`
        : redirectType === 'website'
          ? String(adData.extraValues?.website_url || '').trim()
          : redirectType === 'shop'
            ? String(adData.extraValues?.shop_url || '').trim()
            : redirectType === 'lead_form'
              ? 'rti-news://lead-form'
              : `rti-news://profile/${encodeURIComponent(user.email || '')}`;
   const startDate = adData.startDate || new Date().toISOString().slice(0, 10);
      // ✅ FIX: end_date ab fixed 30 din nahi jaayega — jo ad-subscription plan
      // purchase kiya hai (uska "days"/validity_days, e.g. 20) usi ke hisaab se jayega
      const subscriptionDays = Number(creditState.subscription?.validity_days);
      const durationDays = subscriptionDays > 0
        ? subscriptionDays
        : (Number(adData.durationDays) > 0 ? Number(adData.durationDays) : 30);
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const endDate = new Date(Date.UTC(sy, sm - 1, sd + durationDays)).toISOString().slice(0, 10);
      // ✅ FIX: ab real backend pe ad create hoga
      const apiRes = await AuthAPI.createAdsDetails({
        title: adData.title || '',
        description: adData.description || '',
        image: adData.image || adData.photo || '',
        images: adData.images || [],
                video: adData.video || '',
        url: adData.url || adData.redirectUrl || '',
        adsSubId: adData.adsSubId || adData.ads_sub_id || 1,
        redirection: adData.redirection || adData.redirect || adData.url || adData.redirectUrl || 'profile',
        redirectionUrl: redirectUrl,
        startDate,
        endDate,
        status: 1,
      });
      if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to create ad on server.' };

      const backendAd = apiRes.ad || {};
      const newAd = {
        ...adData,
        id: backendAd.id, // ✅ ab real backend id
        title: backendAd.title || adData.title,
        description: backendAd.description || adData.description,
        image: backendAd.image || adData.image,
        // ✅ FIX: local blob:/file: uri session ke baad mar jaati hai — backend ka URL prefer karo
        video: backendAd.video || backendAd.video_url || adData.video,
        images: (Array.isArray(backendAd.images) && backendAd.images.length) ? backendAd.images : adData.images,
        url: backendAd.url || adData.url,
        created_at: backendAd.created_at || today,
        // ✅ FIX: start/end date ab local ad me save hoti hai taaki Android My Ads me dikhe
        start_date: backendAd.start_date || startDate,
        end_date: backendAd.end_date || endDate,
        status: 'active',
      };
      const updatedAds = [newAd, ...(Array.isArray(user.ads) ? user.ads : [])];
      const updatedUser = await UserStore.updateUser(user.email, { ad_credits: currentCredits - 1, ads: updatedAds });
      if (!updatedUser) return { ok: false, message: 'Unable to use credit.' };
      return { ok: true, credits: currentCredits - 1, ad: newAd };
    }

    // ── reason !== 'post' → yeh update path hai ──
    if (!adData?.id) return { ok: false, message: 'Ad not found.' };
    const apiRes = await AuthAPI.updateAdsDetails(adData.id, {
      title: adData.title || '',
      description: adData.description || '',
      image: adData.image || adData.photo || '',
      url: adData.url || '',
    });
    if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to update ad on server.' };

    let updatedAd = null;
    const updatedAds = (Array.isArray(user.ads) ? user.ads : []).map((ad) => {
      if (ad.id !== adData.id) return ad;
      updatedAd = { ...ad, ...adData, updated_at: today };
      return updatedAd;
    });
    if (!updatedAd) return { ok: false, message: 'Ad not found.' };
    const updatedUser = await UserStore.updateUser(user.email, { ads: updatedAds });
    if (!updatedUser) return { ok: false, message: 'Unable to save changes.' };
    return { ok: true, credits: currentCredits, ad: updatedAd };
  } catch { return { ok: false, message: 'Unable to use credit.' }; }
},

// deleteAd ko replace karo — ab DELETE /ads-details/{id} bhi call hoga
deleteAd: async (adId) => {
  try {
    const user = await UserStore.getCurrentUser();
    if (!user) return { ok: false, message: 'Please login again.' };
    const apiRes = await AuthAPI.deleteAdsDetails(adId);
    if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to delete ad on server.' };
    const updatedAds = (Array.isArray(user.ads) ? user.ads : []).filter(ad => ad.id !== adId);
    const updatedUser = await UserStore.updateUser(user.email, { ads: updatedAds });
    if (!updatedUser) return { ok: false, message: 'Unable to delete ad.' };
    return { ok: true };
  } catch { return { ok: false, message: 'Unable to delete ad.' }; }
},

  getEcomePlans: () => ([
    { plan_id: 'ecome-starter-monthly', plan_name: 'Starter E-Commerce', price: 499, credits: 10, duration: '30 Days', validity_days: 30 },
    { plan_id: 'ecome-growth-monthly', plan_name: 'Growth E-Commerce', price: 899, credits: 25, duration: '30 Days', validity_days: 30 },
    { plan_id: 'ecome-power-monthly', plan_name: 'Power E-Commerce', price: 1499, credits: 50, duration: '30 Days', validity_days: 30 },
  ]),
  getEcomeMarketplaceSummary: async (options = {}) => {
    // Sync background mein chale, UI ko block na kare (Buy list ke liye)
    if (options.includeListings !== false) {
      UserStore.syncCreditSubscriptionsFromBackend().catch(() => {});
    } else {
      await UserStore.syncCreditSubscriptionsFromBackend();
    }
    try {
      const includeListings = options.includeListings !== false;
      const includeEnquiries = Boolean(options.includeEnquiries);
      const currentUser = await UserStore.getCurrentUser();
      const ecomeState = getCreditExpiryState(currentUser?.ecome_credits, currentUser?.ecome_subscription);
      if (currentUser && ecomeState.expired && Number(currentUser.ecome_credits ?? 0) > 0) {
        await UserStore.updateUser(currentUser.email, {
          ecome_credits: 0,
          ecome_subscription: ecomeState.subscription,
        });
      }
      const users = await getUsersFromStorage();
      const sellersByProduct = new Map();
      const buyersByProduct = new Map();
      const addByProduct = (map, productId, id, value) => {
        const key = String(productId || '');
        if (!key) return;
        const bucket = map.get(key) || new Map();
        bucket.set(String(id || `${key}-${bucket.size}`), value);
        map.set(key, bucket);
      };

      users.forEach((user) => {
        (Array.isArray(user.farming_sell_offers) ? user.farming_sell_offers : []).forEach((offer) => {
          addByProduct(sellersByProduct, offer.product_id, offer.id, {
            id: offer.id,
            name: offer.seller_name || offer.offerer_name || user.name || 'Seller',
            email: offer.seller_email || offer.offerer_email || user.email || '',
            crop: offer.product_name,
            price: offer.offer_price || offer.price || offer.product_price,
            quantity: offer.offer_quantity || offer.quantity || offer.product_quantity,
            contact: offer.seller_mobile || offer.offerer_mobile || '',
            created_at: offer.createdAt,
          });
        });

        (Array.isArray(user.farming_purchases) ? user.farming_purchases : []).forEach((purchase) => {
          addByProduct(buyersByProduct, purchase.product_id, purchase.id, {
            id: purchase.id,
            name: purchase.buyer_name || user.name || 'Buyer',
            email: purchase.buyer_email || user.email || '',
            crop: purchase.product_name,
            price: purchase.requested_price || purchase.price || purchase.product_price,
            quantity: purchase.requested_quantity || purchase.product_quantity,
            contact: purchase.buyer_mobile || '',
            created_at: purchase.createdAt,
          });
        });

        (Array.isArray(user.ecome_enquiries) ? user.ecome_enquiries : []).forEach((enquiry) => {
          addByProduct(buyersByProduct, enquiry.product_id, enquiry.id, {
            id: enquiry.id,
            name: enquiry.buyer_name || user.name || 'Buyer',
            email: enquiry.buyer_email || user.email || '',
            crop: enquiry.product_name,
            price: enquiry.requested_price || enquiry.product_price,
            quantity: enquiry.requested_quantity || enquiry.product_quantity,
            contact: enquiry.buyer_mobile || '',
            created_at: enquiry.createdAt,
          });
        });
      });
// ✅ FIX: plans ab real backend /ecom-subscriptions se aayenge, dummy local getEcomePlans() sirf fallback ke liye
      let plans = UserStore.getEcomePlans();
      try {
        // Buy list ko plans chahiye hi nahi — skip karo
        const plansRes = options.includeListings !== false && !options.needPlans
          ? { ok: false }
          : await AuthAPI.getEcomSubscriptions();
        if (plansRes.ok && Array.isArray(plansRes.plans) && plansRes.plans.length > 0) {
          plans = plansRes.plans.map((p) => ({
            plan_id: p.plan_id ?? p.id,
            plan_name: p.plan_name ?? p.name,
            price: Number(p.price ?? 0),
            credits: Number(p.credits ?? p.listing_credits ?? 0),
                       duration: `${Number(p.days ?? p.validity_days ?? 30)} Days`,
            validity_days: Number(p.days ?? p.validity_days ?? 30),
          }));
        }
      } catch (e) {
        console.warn('[getEcomeMarketplaceSummary] getEcomSubscriptions failed, using local fallback:', e);
      }

// ✅ FIX: listings ab real backend /ecom-details se aayengi, dummy local ecome_listings hata diya
            let listings = [];
      if (includeListings) {
        try {
        const detailsRes = await AuthAPI.getEcomDetails();
        if (detailsRes.ok && Array.isArray(detailsRes.details)) {
                 const blockedRes = options?.skipBlockedUsers
            ? { ok: true, list: [] }
            : await UserStore.getBlockedUsers();
          const blockedEmailsForEcom = new Set((blockedRes?.list || []).map((u) => u.email).filter(Boolean));
          const blockedIdsForEcom = new Set((blockedRes?.list || []).map((u) => (u.id != null ? String(u.id) : '')).filter(Boolean));
          const isBlockedEcomOwner = (item) => {
            const ownerEmail = String(item?.owner_email || '').trim().toLowerCase();
            const ownerCreatedBy = String(item?.createdBy || '').trim().toLowerCase();
            if (ownerEmail && blockedEmailsForEcom.has(ownerEmail)) return true;
            if (ownerCreatedBy && (blockedEmailsForEcom.has(ownerCreatedBy) || blockedIdsForEcom.has(ownerCreatedBy))) return true;
            return false;
          };
          listings = detailsRes.details
            .map(normalizeEcomDetail)
            .filter((item) => Number(item.status) === 1)
            .filter((item) => !isBlockedEcomOwner(item))
            .map((item) => ({
              ...item,
              sellers: Array.from(sellersByProduct.get(String(item.id))?.values?.() || []),
              buyers: Array.from(buyersByProduct.get(String(item.id))?.values?.() || []),
            }))
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        }
      } catch (e) {
        console.warn('[getEcomeMarketplaceSummary] getEcomDetails failed:', e);
        }
      }

      // ✅ FIX: enquiries ab backend /ecom-enquiries se aayengi (seller dashboard ke liye)
      let enquiries = [];
      if (includeEnquiries && currentUser) {
        try {
          const enqRes = await AuthAPI.getEcomEnquiries();
          if (enqRes.ok) {
            enquiries = Array.isArray(enqRes.enquiries)
              ? enqRes.enquiries
              : (Array.isArray(enqRes.enquiries?.data) ? enqRes.enquiries.data : []);
          }
        } catch (e) {
          console.warn('[getEcomeMarketplaceSummary] getEcomEnquiries failed:', e);
        }
      }

      return {
        currentUser,
        credits: ecomeState.credits,
        subscription: ecomeState.subscription,
        expired: ecomeState.expired,
        expires_at: ecomeState.expires_at,
        listings,
        enquiries,
        plans,
        priceFeedback: Array.isArray(currentUser?.farming_price_feedback) ? currentUser.farming_price_feedback : [],
      };
    } catch {
      return { currentUser: null, credits: 0, subscription: null, listings: [], enquiries: [], plans: UserStore.getEcomePlans(), priceFeedback: [] };
    }
  },
  saveFarmingPriceFeedback: async (feedbackData = {}) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };

      const productId = String(feedbackData.productId || feedbackData.product_id || '').trim();
      const contactKey = String(feedbackData.contactKey || feedbackData.contact_key || '').trim();
      const response = String(feedbackData.response || '').trim().toLowerCase();
      if (!productId || !contactKey) return { ok: false, message: 'Feedback target missing.' };
      if (!['like', 'dislike'].includes(response)) return { ok: false, message: 'Invalid feedback.' };

      const now = new Date().toISOString();
      const existing = Array.isArray(user.farming_price_feedback) ? user.farming_price_feedback : [];
      const duplicate = existing.some((item) => (
        String(item.product_id || '') === productId
        && String(item.contact_key || '') === contactKey
      ));
      if (duplicate) return { ok: true, alreadySaved: true };

      const feedback = {
        id: `farm-price-feedback-${Date.now()}`,
        product_id: productId,
        contact_key: contactKey,
        contact_type: String(feedbackData.contactType || feedbackData.contact_type || '').trim(),
        contact_name: String(feedbackData.contactName || feedbackData.contact_name || '').trim(),
        contact_email: String(feedbackData.contactEmail || feedbackData.contact_email || '').trim().toLowerCase(),
        price: String(feedbackData.price || '').trim(),
        quantity: String(feedbackData.quantity || '').trim(),
        response,
        user_email: String(user.email || '').trim().toLowerCase(),
        user_name: user.name || '',
        createdAt: now,
      };

      const updatedUser = await UserStore.updateUser(user.email, {
        farming_price_feedback: [feedback, ...existing],
      });
      if (!updatedUser) return { ok: false, message: 'Unable to save feedback.' };
      return { ok: true, feedback };
    } catch {
      return { ok: false, message: 'Unable to save feedback.' };
    }
  },

  buyEcomeCredits: async ({ plan_id, plan_name, price, credits, duration, validity_days }) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const today = new Date().toISOString().slice(0, 10);
      const currentState = getCreditExpiryState(user.ecome_credits, user.ecome_subscription);
      const validDays = Number(validity_days || CREDIT_VALIDITY_DAYS);
      const nextCredits = Number(currentState.credits ?? 0) + Number(credits || 0);
      const plan = {
        plan_id,
        plan_name,
        price: Number(price || 0),
        credits: Number(credits || 0),
        duration: duration || `${validDays} Days`,
        validity_days: validDays,
        purchased_at: today,
        expires_at: addDaysToDateString(today, validDays),
        status: 'active',
      };
          const ecomPayment = {
        order_id:   `ORD_ECOM_${Date.now()}`,
        payment_id: `PAY_ECOM_${Date.now()}`,
        amount:     plan.price,
        status:     'success',
        date:       today,
        plan_id:    plan.plan_id,
        plan_name:  plan.plan_name,
        module:     'ecom',
        signature:  '',
      };
      const updatedUser = await UserStore.updateUser(user.email, {
        ecome_credits: nextCredits,
        ecome_subscription: plan,
        payment_history: [...normalizePaymentHistory(user.payment_history), ecomPayment],
      });
      if (!updatedUser) return { ok: false, message: 'Unable to activate E-Commerce credits.' };
      return { ok: true, credits: nextCredits, plan };
    } catch {
      return { ok: false, message: 'Unable to activate E-Commerce credits.' };
    }
  },

  createEcomeListing: async (listingData = {}) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const creditState = getCreditExpiryState(user.ecome_credits, user.ecome_subscription);
      if (creditState.expired) {
        await UserStore.updateUser(user.email, {
          ecome_credits: 0,
          ecome_subscription: creditState.subscription,
        });
        return { ok: false, code: 'CREDITS_EXPIRED', message: 'Your E-Commerce credits have expired. Please buy a new monthly plan.' };
      }

      const currentCredits = Number(creditState.credits ?? 0);
      if (currentCredits <= 0) return { ok: false, code: 'NO_CREDITS', message: 'No E-Commerce credits left. Please buy an E-Commerce credit plan.' };

      // ✅ FIX: ab real backend /ecom-details pe listing create hoti hai
      const images = (Array.isArray(listingData.mediaItems) ? listingData.mediaItems : [])
        .filter((item) => item && item.uri)
        .slice(0, 5)
        .map((item) => ({
          uri: item.uri,
          previewUri: item.previewUri || '',
         type: item.mimeType || 'image/jpeg',
          name: item.name || 'image.jpg',
        }));

      const apiRes = await AuthAPI.createEcomDetails({
        ecomSubId: Number(listingData.ecomSubId) || 1,
        category: listingData.sector || listingData.category || '',
        productName: listingData.title || '',
        quantity: listingData.quantity || '',
        price: listingData.price || '',
        description: listingData.description || '',
        city: listingData.city || '',
        contact: listingData.contact || '',
        startDate: listingData.startDate || '',
        endDate: listingData.endDate || '',
        images,
      });

      if (!apiRes.ok) return {
        ok: false,
        isAuth: Boolean(apiRes.isAuth),
        message: apiRes.message || 'Unable to save your listing.',
      };

      const listing = normalizeEcomDetail(apiRes.detail || {});

         // Listing backend pe save ho chuki hai — credit update fail ho to bhi success maano
      try {
        await UserStore.updateUser(user.email, { ecome_credits: currentCredits - 1 });
      } catch (e) {
        console.warn('[createEcomeListing] credit update failed:', e);
      }
      return { ok: true, credits: currentCredits - 1, listing };
    } catch (err) {
      console.error('[createEcomeListing] failed:', err);
      return { ok: false, message: `Unable to save your listing. ${err?.message || ''}`.trim() };
    }
  },

  // ✅ NEW: single product view (backend /ecom-details/{id})
  getEcomeListingById: async (id) => {
    try {
      const apiRes = await AuthAPI.getEcomDetailsById(id);
      if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Product not found.' };
      return { ok: true, listing: normalizeEcomDetail(apiRes.detail || {}) };
    } catch {
      return { ok: false, message: 'Unable to fetch product.' };
    }
  },

  // ✅ NEW: product update
  updateEcomeListing: async (id, fields = {}) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const apiRes = await AuthAPI.updateEcomDetails(id, {
        ecom_sub_id: fields.ecomSubId,
        category: fields.sector || fields.category,
        product_name: fields.title,
        quantity: fields.quantity,
        price: fields.price,
        description: fields.description,
        city: fields.city,
        conatct: fields.contact,
        start_date: fields.startDate,
        end_date: fields.endDate,
      });
      if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to update listing.' };
      return { ok: true, listing: normalizeEcomDetail(apiRes.detail || {}) };
    } catch {
      return { ok: false, message: 'Unable to update listing.' };
    }
  },

  // ✅ NEW: product status change (active/inactive)
  updateEcomeListingStatus: async (id, statusValue) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const apiRes = await AuthAPI.updateEcomDetailsStatus(id, statusValue);
      if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to update status.' };
      return { ok: true, listing: normalizeEcomDetail(apiRes.detail || {}) };
    } catch {
      return { ok: false, message: 'Unable to update status.' };
    }
  },

  // ✅ NEW: product delete
  deleteEcomeListing: async (id) => {
    try {
      const user = await UserStore.getCurrentUser();
      if (!user) return { ok: false, message: 'Please login again.' };
      const apiRes = await AuthAPI.deleteEcomDetails(id);
      if (!apiRes.ok) return { ok: false, message: apiRes.message || 'Unable to delete listing.' };
      return { ok: true };
    } catch {
      return { ok: false, message: 'Unable to delete listing.' };
    }
  },

 createEcomeEnquiry: async (productId, enquiryData = {}) => {
  try {
    const currentUser = await UserStore.getCurrentUser();
    if (!currentUser) return { ok: false, message: 'Please login again.' };

   const res = await AuthAPI.createEcomEnquiry({
      ecom_id: productId,
      type: 'ecom',
      message: enquiryData.message || '',
      quantity: enquiryData.quantity || '',
      first_name: enquiryData.firstName || '',
      last_name: enquiryData.lastName || '',
      email: enquiryData.email || currentUser.email,
      contact: enquiryData.contact || currentUser.mobile || '',
    });

    if (!res.ok) return { ok: false, message: res.message || 'Unable to send enquiry.' };
    return { ok: true, enquiry: res.enquiry };
  } catch {
    return { ok: false, message: 'Unable to send enquiry.' };
  }
},

  createFarmingPurchase: async (productId, purchaseData = {}) => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return { ok: false, message: 'Please login again.' };

      const users = await getUsersFromStorage();
      let product = null;
      let sellerEmail = '';
      users.some((user) => {
        const match = (Array.isArray(user.farming_listings) ? user.farming_listings : [])
          .find((item) => String(item.id) === String(productId));
        if (match) {
          product = match;
          sellerEmail = String(user.email || '').trim().toLowerCase();
          return true;
        }
        return false;
      });

      if (!product || !sellerEmail) return { ok: false, message: 'Product not found.' };

      const now = new Date().toISOString();
      const buyerEmail = String(currentUser.email || '').trim().toLowerCase();
      const purchase = {
        id: `farm-buy-${Date.now()}`,
        product_id: product.id,
        product_name: product.title,
        product_sector: product.sector,
        product_quantity: product.quantity,
        product_price: product.price,
        product_city: product.city,
        product_contact: product.contact,
        buyer_email: buyerEmail,
        buyer_name: currentUser.name || buyerEmail || 'Buyer',
        buyer_mobile: purchaseData.callAllow === false
          ? ''
          : String(purchaseData.contact || currentUser.mobile || currentUser.mobile_number || currentUser.contact_number || '').trim(),
        seller_email: sellerEmail,
        seller_name: product.author_name || 'Seller',
        requested_quantity: String(purchaseData.quantity || product.quantity || '').trim(),
        requested_price: String(purchaseData.price || product.price || '').trim(),
        message: String(purchaseData.message || '').trim(),
        status: 'requested',
        createdAt: now,
      };

      const recipients = new Set([buyerEmail, sellerEmail, String(product.reporter_email || '').trim().toLowerCase()]);
      users.forEach((user) => {
        if (String(user.role || '').trim().toLowerCase() === 'admin') {
          recipients.add(String(user.email || '').trim().toLowerCase());
        }
      });
      recipients.delete('');

      const notification = {
        id: `notif-farm-buy-${Date.now()}`,
        title: 'New Farming Product Buy Request',
        message: `${purchase.buyer_name} wants to buy ${purchase.product_name} (${purchase.product_id}). Quantity: ${purchase.requested_quantity || purchase.product_quantity || 'N/A'}.`,
        date: now.slice(0, 10),
        status: 'Unread',
        product_id: purchase.product_id,
        purchase_id: purchase.id,
      };

      const updatedUsers = users.map((user) => {
        const email = String(user.email || '').trim().toLowerCase();
        if (!recipients.has(email)) return user;
        return normalizeUser({
          ...user,
          farming_purchases: [purchase, ...(Array.isArray(user.farming_purchases) ? user.farming_purchases : [])],
          notifications: [notification, ...normalizeNotifications(user.notifications)],
        });
      });

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return { ok: true, purchase };
    } catch {
      return { ok: false, message: 'Unable to send buy request.' };
    }
  },

  createFarmingSellOffer: async (productId, offerData = {}) => {
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) return { ok: false, message: 'Please login again.' };

      const users = await getUsersFromStorage();
      let product = null;
      let ownerEmail = '';
      users.some((user) => {
        const match = (Array.isArray(user.farming_listings) ? user.farming_listings : [])
          .find((item) => String(item.id) === String(productId));
        if (match) {
          product = match;
          ownerEmail = String(user.email || '').trim().toLowerCase();
          return true;
        }
        return false;
      });

      if (!product || !ownerEmail) return { ok: false, message: 'Product not found.' };

      const now = new Date().toISOString();
      const sellerEmail = String(currentUser.email || '').trim().toLowerCase();
      const offer = {
        id: `farm-sell-${Date.now()}`,
        product_id: product.id,
        product_name: product.title,
        product_sector: product.sector,
        product_quantity: product.quantity,
        product_price: product.price,
        product_city: product.city,
        product_contact: product.contact,
        seller_email: sellerEmail,
        seller_name: currentUser.name || sellerEmail || 'Seller',
        seller_mobile: offerData.callAllow === false
          ? ''
          : String(offerData.contact || currentUser.mobile || currentUser.mobile_number || currentUser.contact_number || '').trim(),
        owner_email: ownerEmail,
        owner_name: product.author_name || 'Seller',
        offer_quantity: String(offerData.quantity || product.quantity || '').trim(),
        offer_price: String(offerData.price || product.price || '').trim(),
        message: String(offerData.message || '').trim(),
        status: 'offered',
        createdAt: now,
      };

      const recipients = new Set([sellerEmail, ownerEmail, String(product.reporter_email || '').trim().toLowerCase()]);
      users.forEach((user) => {
        if (String(user.role || '').trim().toLowerCase() === 'admin') {
          recipients.add(String(user.email || '').trim().toLowerCase());
        }
      });
      recipients.delete('');

      const notification = {
        id: `notif-farm-sell-${Date.now()}`,
        title: 'New Farming Product Sell Offer',
        message: `${offer.seller_name} wants to sell ${offer.product_name} (${offer.product_id}). Quantity: ${offer.offer_quantity || offer.product_quantity || 'N/A'}.`,
        date: now.slice(0, 10),
        status: 'Unread',
        product_id: offer.product_id,
        offer_id: offer.id,
      };

      const updatedUsers = users.map((user) => {
        const email = String(user.email || '').trim().toLowerCase();
        if (!recipients.has(email)) return user;
        return normalizeUser({
          ...user,
          farming_sell_offers: [offer, ...(Array.isArray(user.farming_sell_offers) ? user.farming_sell_offers : [])],
          notifications: [notification, ...normalizeNotifications(user.notifications)],
        });
      });

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      return { ok: true, offer };
    } catch {
      return { ok: false, message: 'Unable to send sell offer.' };
    }
  },
};

export { buildCertificateSvg as buildCertificateSvgForPreview };