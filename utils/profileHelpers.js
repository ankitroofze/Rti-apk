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
export function generateReferralCode(email = '') {
  const hash = String(email).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return `RTINEWS${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}`;
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
