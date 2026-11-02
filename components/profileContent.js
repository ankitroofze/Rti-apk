// utils/profileContent.js
// Profile / Public Profile ke 4 content tabs (Posts · Reels · Ads · Ecom) ke liye shared helpers.
// Android, iOS, Web aur Web ka mobile view — sab yahi use karte hain.

export const CONTENT_TABS = [
  { key: 'post', label: 'Posts', icon: 'view-grid-outline', emptyText: 'No posts yet.' },
  { key: 'reel', label: 'Reels', icon: 'movie-play-outline', emptyText: 'No reels yet.' },
  { key: 'ad', label: 'Ads', icon: 'bullhorn-outline', emptyText: 'No ads yet.' },
  { key: 'ecom', label: 'Ecom', icon: 'shopping-outline', emptyText: 'No products yet.' },
];

// Har item ko 'post' | 'reel' | 'ad' | 'ecom' me classify karta hai.
//   ad   -> is_ad / isAd / post_type 'ad'
//   ecom -> is_ecom / post_type 'ecom'
//   reel -> backend type === 2 (Feed / Reel)
//   post -> baaki sab (news)
export function getPostKind(post = {}) {
  if (!post) return 'post';
  if (post.is_ad || post.isAd || post.post_type === 'ad') return 'ad';
  if (post.is_ecom || post.isEcom || post.post_type === 'ecom') return 'ecom';
  if (Number(post.type) === 2 || post.post_type === 'reel' || post.is_reel) return 'reel';
  return 'post';
}

export function filterPostsByKind(posts, kind) {
  const list = Array.isArray(posts) ? posts : [];
  return list.filter((p) => getPostKind(p) === kind);
}

export function countPostsByKind(posts) {
  const counts = { post: 0, reel: 0, ad: 0, ecom: 0 };
  (Array.isArray(posts) ? posts : []).forEach((p) => { counts[getPostKind(p)] += 1; });
  return counts;
}

// Kya ye post current user ka hai? (delete ka 3-dot sirf owner ko dikhana hai)
export function isOwnPost(post = {}, viewer = {}) {
  if (!post || !viewer) return false;
  if (post.is_ad || post.isAd || post.is_ecom || post.post_type === 'ad' || post.post_type === 'ecom') {
    // Ad / ecom ke owner fields alag-alag ho sakte hain
    const ownerEmail = String(post.owner_email || post.createdBy || post.author_email || '').trim().toLowerCase();
    const ownerId = String(post.owner_id ?? post.user_id ?? post.author_id ?? '').trim();
    const vEmail = String(viewer.email || '').trim().toLowerCase();
    const vId = viewer.id != null ? String(viewer.id).trim() : '';
    if (ownerEmail && vEmail && ownerEmail === vEmail) return true;
    if (ownerId && vId && ownerId === vId) return true;
    return false;
  }
  const vEmail = String(viewer.email || '').trim().toLowerCase();
  const vId = viewer.id != null ? String(viewer.id).trim() : '';
  const ownerEmail = String(post.createdBy || post.created_by || post.author_email || '').trim().toLowerCase();
  const ownerId = String(post.author_id ?? post.user_id ?? '').trim();
  if (vEmail && ownerEmail && ownerEmail === vEmail) return true;
  if (vId && ownerId && ownerId === vId) return true;
  return false;
}

// ── Media helpers (grid thumbnails ke liye) ─────────────────────────────────
const VIDEO_RE = /\.(mp4|m4v|mov|webm|ogv|m3u8|avi|mkv|3gp)(\?.*)?(#.*)?$/i;
export const isVideoUri = (value) => {
  const uri = String(value || '').trim();
  if (/^data:video/i.test(uri)) return true;
  return VIDEO_RE.test(uri);
};
export const isImageUri = (value) => {
  const uri = String(value || '').trim();
  if (!uri || isVideoUri(uri)) return false;
  return /^(https?:|file:|content:|data:image|blob:)/i.test(uri);
};

const firstVideoUri = (values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstVideoUri(value);
      if (nested) return nested;
    } else if (value && typeof value === 'object') {
      const nested = firstVideoUri([value.uri, value.url]);
      if (nested) return nested;
    } else if (typeof value === 'string' && isVideoUri(value)) {
      return value.trim();
    }
  }
  return '';
};

export function getPostVideo(post = {}) {
  const direct = [post.video, post.video_url, post.videoUrl, post.videoUri, post.videos];
  for (const v of direct) {
    const uri = typeof v === 'string'
      ? v
      : (Array.isArray(v) ? (typeof v[0] === 'string' ? v[0] : v[0]?.uri || v[0]?.url) : (v?.uri || v?.url));
    if (uri && String(uri).trim()) return String(uri).trim();
  }
  return firstVideoUri([post.media, post.images, post.image, post.file, post.attachment]);
}

const firstImageUri = (values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = firstImageUri(value);
      if (nested) return nested;
    } else if (value && typeof value === 'object') {
      const nested = firstImageUri([value.uri, value.url]);
      if (nested) return nested;
    } else if (isImageUri(value)) {
      return String(value).trim();
    }
  }
  return '';
};

export function getPostImage(post = {}) {
  return firstImageUri([
    post.thumbnail, post.videoThumb, post.video_thumb, post.videoThumbnail, post.video_thumbnail,
    post.thumbnail_url, post.poster, post.image, post.cover_image, post.featured_image, post.photo,
    post.img, post.picture, post.imageUrl, post.image_url, post.coverImage, post.images, post.media,
    post.mediaItems,
  ]);
}