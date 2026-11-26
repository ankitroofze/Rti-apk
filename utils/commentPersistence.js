import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const EDITED_STORAGE_KEY = '@rti_edited_comments_v1';
const LEGACY_FEED_EDITED_KEY = '@rti_feed_edited_comments_v2';
const REPLY_PARENT_STORAGE_KEY = '@rti_reply_parents_v1';
const MAX_STORED_ENTRIES = 500;

const editedCommentsMap = new Map(); // commentId -> { text, edited_at, postId }
const replyParentMap = new Map();    // replyId -> { parentId, rootId, postId, ts }
let hydratedPromise = null;

function readSyncStorage(key) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.localStorage?.getItem(key) || window.sessionStorage?.getItem(key) || null;
  } catch (_) {
    return null;
  }
}

function writeSyncStorage(key, value) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(key, value);
    window.sessionStorage?.setItem(key, value);
  } catch (_) {}
}

function pruneMap(map) {
  while (map.size > MAX_STORED_ENTRIES) {
    const first = map.keys().next();
    if (first.done) break;
    map.delete(first.value);
  }
}

function hydrateFromObject(targetMap, obj, validator) {
  if (!obj || typeof obj !== 'object') return;
  Object.entries(obj).forEach(([k, val]) => {
    if (validator(val) && !targetMap.has(String(k))) {
      targetMap.set(String(k), val);
    }
  });
}

function loadSyncStores() {
  try {
    const rawEdits = readSyncStorage(EDITED_STORAGE_KEY);
    if (rawEdits) {
      hydrateFromObject(editedCommentsMap, JSON.parse(rawEdits), (v) => v && typeof v === 'object' && v.text);
    }
    const legacyEdits = readSyncStorage(LEGACY_FEED_EDITED_KEY);
    if (legacyEdits) {
      hydrateFromObject(editedCommentsMap, JSON.parse(legacyEdits), (v) => v && typeof v === 'object' && v.text);
    }
    const rawParents = readSyncStorage(REPLY_PARENT_STORAGE_KEY);
    if (rawParents) {
      hydrateFromObject(replyParentMap, JSON.parse(rawParents), (v) => v && typeof v === 'object' && v.parentId);
    }
  } catch (_) {}
}

loadSyncStores();

export async function ensureCommentPersistenceLoaded() {
  loadSyncStores();
  if (!hydratedPromise) {
    hydratedPromise = (async () => {
      try {
        const [rawEdits, legacyEdits, rawParents] = await Promise.all([
          AsyncStorage.getItem(EDITED_STORAGE_KEY).catch(() => null),
          AsyncStorage.getItem(LEGACY_FEED_EDITED_KEY).catch(() => null),
          AsyncStorage.getItem(REPLY_PARENT_STORAGE_KEY).catch(() => null),
        ]);
        if (rawEdits) hydrateFromObject(editedCommentsMap, JSON.parse(rawEdits), (v) => v && typeof v === 'object' && v.text);
        if (legacyEdits) hydrateFromObject(editedCommentsMap, JSON.parse(legacyEdits), (v) => v && typeof v === 'object' && v.text);
        if (rawParents) hydrateFromObject(replyParentMap, JSON.parse(rawParents), (v) => v && typeof v === 'object' && v.parentId);
      } catch (_) {}
    })();
  }
  return hydratedPromise;
}

ensureCommentPersistenceLoaded().catch(() => {});

function persistEditedMap() {
  try {
    pruneMap(editedCommentsMap);
    const obj = {};
    editedCommentsMap.forEach((val, key) => {
      if (val && val.text) obj[key] = val;
    });
    const str = JSON.stringify(obj);
    writeSyncStorage(EDITED_STORAGE_KEY, str);
    writeSyncStorage(LEGACY_FEED_EDITED_KEY, str);
    AsyncStorage.setItem(EDITED_STORAGE_KEY, str).catch(() => {});
    AsyncStorage.setItem(LEGACY_FEED_EDITED_KEY, str).catch(() => {});
  } catch (_) {}
}

function persistReplyParentMap() {
  try {
    pruneMap(replyParentMap);
    const obj = {};
    replyParentMap.forEach((val, key) => {
      if (val && val.parentId) obj[key] = val;
    });
    const str = JSON.stringify(obj);
    writeSyncStorage(REPLY_PARENT_STORAGE_KEY, str);
    AsyncStorage.setItem(REPLY_PARENT_STORAGE_KEY, str).catch(() => {});
  } catch (_) {}
}

/**
 * Compare two comment/reply IDs while keeping `cmt-` and `rpl-` namespaces distinct
 * so comment #12 and reply #12 are never treated as the same node.
 */
export function isSameCommentNodeId(idA, idB) {
  if (idA == null || idB == null) return false;
  const sA = String(idA).trim();
  const sB = String(idB).trim();
  if (!sA || !sB) return false;
  if (sA === sB) return true;
  const isReplyA = /^rpl-/i.test(sA);
  const isReplyB = /^rpl-/i.test(sB);
  const isCommentA = /^cmt-/i.test(sA);
  const isCommentB = /^cmt-/i.test(sB);
  if ((isReplyA && isCommentB) || (isCommentA && isReplyB)) return false;
  const cleanA = sA.replace(/^(cmt-|rpl-)/i, '');
  const cleanB = sB.replace(/^(cmt-|rpl-)/i, '');
  return cleanA.length > 0 && cleanA === cleanB;
}

export function recordEditedComment(commentId, text, postId = null) {
  const sId = String(commentId || '').trim();
  const cleanText = String(text || '').trim();
  if (!sId || !cleanText) return;
  loadSyncStores();
  const entry = {
    text: cleanText,
    edited_at: new Date().toISOString(),
    postId: postId ? String(postId) : null,
  };
  editedCommentsMap.delete(sId);
  editedCommentsMap.set(sId, entry);
  persistEditedMap();
}

export function clearEditedComment(commentId) {
  if (commentId == null) return;
  let removed = false;
  for (const key of Array.from(editedCommentsMap.keys())) {
    if (isSameCommentNodeId(key, commentId)) {
      editedCommentsMap.delete(key);
      removed = true;
    }
  }
  if (removed) persistEditedMap();
}

export function getEditedComment(commentId) {
  if (commentId == null) return null;
  loadSyncStores();
  const exact = editedCommentsMap.get(String(commentId).trim());
  if (exact) return exact;
  for (const [key, val] of editedCommentsMap.entries()) {
    if (isSameCommentNodeId(key, commentId)) return val;
  }
  return null;
}

export function applyEditedComment(comment) {
  if (!comment || typeof comment !== 'object') return comment;
  loadSyncStores();
  const match = getEditedComment(comment.id);
  const nextText = match?.text ? match.text : comment.text;
  const nextEditedAt = match?.text ? (match.edited_at || comment.edited_at || new Date().toISOString()) : comment.edited_at;
  const nextReplies = Array.isArray(comment.replies)
    ? comment.replies.map(applyEditedComment)
    : comment.replies;
  if (nextText !== comment.text || nextEditedAt !== comment.edited_at || nextReplies !== comment.replies) {
    return {
      ...comment,
      text: nextText,
      ...(comment.comment !== undefined ? { comment: nextText } : {}),
      ...(comment.reply !== undefined ? { reply: nextText } : {}),
      edited_at: nextEditedAt,
      replies: nextReplies,
    };
  }
  return comment;
}

export function applyEditedCommentsToTree(comments = []) {
  if (!Array.isArray(comments)) return [];
  return comments.map(applyEditedComment);
}

export function recordReplyParent(replyId, parentId, rootId = null, postId = null) {
  const rId = String(replyId || '').trim();
  const pId = String(parentId || '').trim();
  if (!rId || !pId || isSameCommentNodeId(rId, pId)) return;
  loadSyncStores();
  replyParentMap.delete(rId);
  replyParentMap.set(rId, {
    parentId: pId,
    rootId: rootId ? String(rootId).trim() : null,
    postId: postId ? String(postId).trim() : null,
    ts: Date.now(),
  });
  persistReplyParentMap();
}

export function getReplyParent(replyId) {
  if (replyId == null) return null;
  loadSyncStores();
  const exact = replyParentMap.get(String(replyId).trim());
  if (exact) return exact;
  for (const [key, val] of replyParentMap.entries()) {
    if (isSameCommentNodeId(key, replyId)) return val;
  }
  return null;
}

export function removeReplyParent(replyId) {
  if (replyId == null) return;
  let removed = false;
  for (const key of Array.from(replyParentMap.keys())) {
    if (isSameCommentNodeId(key, replyId)) {
      replyParentMap.delete(key);
      removed = true;
    }
  }
  if (removed) persistReplyParentMap();
}

/**
 * Recursively find a node, its direct parent node, and its top-level root node.
 */
export function findCommentNodeInTree(comments = [], targetId) {
  const walk = (list, parentNode, rootNode) => {
    for (const item of Array.isArray(list) ? list : []) {
      if (!item) continue;
      const currentRoot = rootNode || item;
      if (isSameCommentNodeId(item.id, targetId)) {
        return { node: item, parentNode, rootNode: currentRoot };
      }
      if (Array.isArray(item.replies) && item.replies.length > 0) {
        const hit = walk(item.replies, item, currentRoot);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(comments, null, null);
}

export function countCommentTree(comments = []) {
  return (Array.isArray(comments) ? comments : []).reduce((sum, item) => {
    const replies = Array.isArray(item?.replies) ? item.replies : [];
    const declaredReplies = Number(item?.replies_count ?? item?.repliesCount ?? 0);
    const missingReplies = Number.isFinite(declaredReplies)
      ? Math.max(0, Math.floor(declaredReplies) - replies.length)
      : 0;
    return sum + 1 + missingReplies + countCommentTree(replies);
  }, 0);
}

export function updateCommentTextInTree(comments = [], targetId, nextText) {
  const nowIso = new Date().toISOString();
  const walk = (list) => (Array.isArray(list) ? list : []).map((item) => {
    if (!item) return item;
    const isTarget = isSameCommentNodeId(item.id, targetId);
    const nextReplies = Array.isArray(item.replies) ? walk(item.replies) : item.replies;
    if (!isTarget && nextReplies === item.replies) return item;
    return {
      ...item,
      ...(isTarget ? { text: nextText, comment: nextText, reply: nextText, edited_at: nowIso } : {}),
      replies: nextReplies,
    };
  });
  return walk(comments);
}

export function insertReplyInTree(comments = [], targetParentId, newReply, { prepend = false } = {}) {
  let inserted = false;
  const walk = (list) => (Array.isArray(list) ? list : []).map((item) => {
    if (!item) return item;
    if (isSameCommentNodeId(item.id, targetParentId)) {
      inserted = true;
      const existing = Array.isArray(item.replies) ? item.replies : [];
      const filtered = existing.filter((r) => !isSameCommentNodeId(r.id, newReply.id));
      const nextReplies = prepend ? [newReply, ...filtered] : [...filtered, newReply];
      return {
        ...item,
        replies: nextReplies,
        replies_count: Math.max(Number(item.replies_count || 0) + 1, nextReplies.length),
      };
    }
    if (Array.isArray(item.replies) && item.replies.length > 0) {
      const nextReplies = walk(item.replies);
      if (nextReplies !== item.replies) {
        return { ...item, replies: nextReplies };
      }
    }
    return item;
  });
  const next = walk(comments);
  return { comments: next, inserted };
}

export function deleteCommentFromTree(comments = [], targetId) {
  let removedCount = 0;
  const walk = (list) => {
    if (!Array.isArray(list)) return list;
    let changed = false;
    const out = [];
    for (const item of list) {
      if (!item) continue;
      if (isSameCommentNodeId(item.id, targetId)) {
        removedCount += 1 + countCommentTree(item.replies);
        changed = true;
        continue;
      }
      if (Array.isArray(item.replies) && item.replies.length > 0) {
        const nextReplies = walk(item.replies);
        if (nextReplies !== item.replies) {
          changed = true;
          const directRemoved = Math.max(0, item.replies.length - nextReplies.length);
          const nextCount = Math.max(0, Number(item.replies_count ?? item.replies.length) - directRemoved);
          out.push({ ...item, replies: nextReplies, replies_count: nextCount });
          continue;
        }
      }
      out.push(item);
    }
    return changed ? out : list;
  };
  const nextComments = walk(comments) || [];
  return { nextComments, removedCount };
}

export function toggleCommentLikeInTree(comments = [], targetId, currentEmail = '', serverResult = null) {
  const mail = String(currentEmail || '').trim().toLowerCase();
  const walk = (list) => (Array.isArray(list) ? list : []).map((item) => {
    if (!item) return item;
    if (isSameCommentNodeId(item.id, targetId)) {
      const prevLiked = Boolean(item.liked_by_me) || (mail && Array.isArray(item.liked_by) && item.liked_by.includes(mail));
      const nextLiked = serverResult && typeof serverResult.liked === 'boolean' ? serverResult.liked : !prevLiked;
      const nextLikes = serverResult && Number.isFinite(serverResult.likesCount)
        ? serverResult.likesCount
        : Math.max(0, Number(item.likes || 0) + (nextLiked === prevLiked ? 0 : (nextLiked ? 1 : -1)));
      const prevList = Array.isArray(item.liked_by) ? item.liked_by : [];
      let nextLikedBy = prevList;
      if (mail) {
        nextLikedBy = nextLiked
          ? (prevList.includes(mail) ? prevList : [...prevList, mail])
          : prevList.filter((e) => e !== mail);
      }
      return {
        ...item,
        liked_by_me: nextLiked,
        likes: nextLikes,
        liked_by: nextLikedBy,
      };
    }
    if (Array.isArray(item.replies) && item.replies.length > 0) {
      const nextReplies = walk(item.replies);
      if (nextReplies !== item.replies) return { ...item, replies: nextReplies };
    }
    return item;
  });
  return walk(comments);
}

/**
 * Build a multi-level nested reply tree from a flat or partially nested reply list
 * belonging to a top-level comment (`rootCommentId`), using backend `parent_reply_id`
 * or locally persisted reply parent links.
 */
export function buildNestedReplies(repliesList = [], rootCommentId = null) {
  const flat = [];
  const seen = new Set();
  const flatten = (list, inheritedParentId = null) => {
    (Array.isArray(list) ? list : []).forEach((item) => {
      if (!item || !item.id) return;
      const key = String(item.id);
      const explicitParent = item.parent_reply_id
        ? (String(item.parent_reply_id).startsWith('rpl-') ? String(item.parent_reply_id) : `rpl-${item.parent_reply_id}`)
        : null;
      const storedParent = getReplyParent(key)?.parentId || null;
      const resolvedParent = explicitParent
        || inheritedParentId
        || (storedParent && !isSameCommentNodeId(storedParent, rootCommentId) ? storedParent : null);
      if (!seen.has(key)) {
        seen.add(key);
        flat.push({
          ...item,
          parent_reply_id: resolvedParent,
          replies: [],
        });
      }
      if (Array.isArray(item.replies) && item.replies.length > 0) {
        flatten(item.replies, key);
      }
    });
  };
  flatten(repliesList);

  const byId = new Map(flat.map((r) => [String(r.id), r]));
  const findByAnyId = (targetId) => {
    if (!targetId) return null;
    if (byId.has(String(targetId))) return byId.get(String(targetId));
    return flat.find((r) => isSameCommentNodeId(r.id, targetId)) || null;
  };

  const roots = [];
  flat.forEach((node) => {
    const pId = node.parent_reply_id;
    const parent = pId && !isSameCommentNodeId(pId, rootCommentId) ? findByAnyId(pId) : null;
    if (parent && parent !== node) {
      // Prevent cycles
      let cursor = parent;
      let cycle = false;
      const visited = new Set([node.id]);
      while (cursor) {
        if (visited.has(cursor.id)) { cycle = true; break; }
        visited.add(cursor.id);
        const cp = cursor.parent_reply_id;
        cursor = cp && !isSameCommentNodeId(cp, rootCommentId) ? findByAnyId(cp) : null;
      }
      if (!cycle) {
        parent.replies.push(node);
        return;
      }
    }
    roots.push(node);
  });

  const syncCounts = (list) => list.map((node) => {
    const nested = syncCounts(node.replies || []);
    return {
      ...node,
      replies: nested,
      replies_count: Math.max(Number(node.replies_count || 0), nested.length),
    };
  });

  return applyEditedCommentsToTree(syncCounts(roots));
}
