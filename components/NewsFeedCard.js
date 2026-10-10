// components/NewsFeedCard.js
import NameWithTick from './NameWithTick';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Platform, Share, TextInput, KeyboardAvoidingView, Alert, Clipboard, ScrollView, Linking,
  Modal, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import ProfileAvatar from './ProfileAvatar';
import VerifiedBadge from './VerifiedBadge';
import { Ionicons, Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { CATEGORY_COLOR_MAP } from '../constants/homeData';
import { isValidImageUrl, buildPlaceholderImage, getLocalizedCategoryLabel, getLocalizedSeatLabel } from '../utils/storyHelpers';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';
import { safePause, safePlay } from '../utils/videoPlayerSafe';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { useAuth } from '../contexts/AuthContext';
import { getAdRedirectMeta, openAdRedirect } from '../utils/adRedirect';
import styles from './NewsFeedCardStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfileTier } from '../utils/profileHelpers';
import MediaGallery from './MediaGallery';
import { MediaLogo, MediaTicker } from './MediaBrandOverlay';

// ─────────────────────────────────────────────
// Like persistence helpers
// ─────────────────────────────────────────────
const LIKED_STORAGE_KEY_PREFIX = '@newsfeed_liked_ids_';

function getLikedStorageKey(email) {
  const safeEmail = String(email || 'guest').trim().toLowerCase();
  return LIKED_STORAGE_KEY_PREFIX + safeEmail;
}

async function getLikedIds(email) {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AsyncStorage.getItem(getLikedStorageKey(email));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setLikedId(email, storyId, liked) {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const current = await getLikedIds(email);
    if (liked) {
      current[storyId] = true;
    } else {
      delete current[storyId];
    }
    await AsyncStorage.setItem(getLikedStorageKey(email), JSON.stringify(current));
  } catch {}
}

// ─────────────────────────────────────────────
// CommentItem
// ─────────────────────────────────────────────
function CommentItem({
  currentUserId,
  comment,
  currentUserEmail,
  onEdit,
  onDelete,
  onReply,
  onLike,
  expandedReplyThreads,
  onToggleReplies,
  repliesMeta,
  onLoadMoreReplies,
  editingCommentId,
  editingCommentText,
  onEditingTextChange,
  onSubmitEdit,
  onCancelEdit,
  replyingToCommentId,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  isReply = false,
}) {
  const isCurrentUser = Boolean(
    comment.is_mine ||
    (currentUserId != null && comment.author_id && String(comment.author_id) === String(currentUserId)) ||
    (currentUserEmail && String(comment.author_email || '').trim().toLowerCase() === currentUserEmail)
  );
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToCommentId === comment.id;
  const isLiked = Boolean(comment.liked_by_me);
  const replyCount = Math.max(Number(comment.replies_count || 0), Array.isArray(comment.replies) ? comment.replies.length : 0);
  const hasReplies = replyCount > 0;
  const areRepliesExpanded = Boolean(expandedReplyThreads?.[comment.id]);

  return (
    <View style={[styles.commentItem, isReply && styles.commentReplyItem]}>
      <View style={styles.commentAvatar}>
        {comment.authorAvatar ? (
          <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatarImg} />
        ) : (
          <Text style={styles.commentAvatarText}>{comment.authorInitial}</Text>
        )}
      </View>

      <View style={styles.commentContent}>
        {isEditing ? (
          <View style={styles.commentEditContainer}>
            <TextInput
              style={styles.commentEditInput}
              value={editingCommentText}
              onChangeText={onEditingTextChange}
              multiline
              maxLength={300}
              placeholder="Edit comment..."
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.commentEditActions}>
              <TouchableOpacity style={styles.commentEditBtn} onPress={onSubmitEdit} activeOpacity={0.8}>
                <Text style={styles.commentEditBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.commentEditBtn, styles.commentCancelBtn]} onPress={onCancelEdit} activeOpacity={0.8}>
                <Text style={styles.commentCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.commentBubble}>
            <NameWithTick name={comment.author} show={Boolean(comment.author_has_blue_tick)} style={styles.commentAuthor} badgeSize={13} />
            <Text style={styles.commentText}>{comment.text}</Text>
            <Text style={styles.commentTime}>{comment.time}{comment.edited_at ? ' • Edited' : ''}</Text>
          </View>
        )}

        {!isEditing && (
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.commentActionBtn} onPress={() => onLike(comment.id)} activeOpacity={0.8}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={14} color={isLiked ? '#e11d48' : '#64748b'} />
              <Text style={[styles.commentActionText, isLiked && styles.commentActionTextLiked]}>
                {comment.likes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentActionBtn} onPress={() => onReply(comment.id)} activeOpacity={0.8}>
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
            {isCurrentUser ? (
              <>
                <TouchableOpacity style={styles.commentActionBtn} onPress={() => onEdit(comment.id, comment.text)} activeOpacity={0.8}>
                  <Text style={styles.commentActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentActionBtn} onPress={() => onDelete(comment.id)} activeOpacity={0.8}>
                  <Text style={[styles.commentActionText, styles.commentDeleteText]}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}

        {isReplying ? (
          <View style={styles.commentReplyForm}>
            <TextInput
              style={styles.commentReplyInput}
              value={replyText}
              onChangeText={onReplyTextChange}
              placeholder="Write a reply..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
              autoFocus={true}
            />
            <View style={styles.commentReplyActions}>
              <TouchableOpacity style={styles.commentReplyBtn} onPress={onSubmitReply} activeOpacity={0.8}>
                <Text style={styles.commentReplyBtnText}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.commentReplyBtn, styles.commentCancelBtn]} onPress={onCancelReply} activeOpacity={0.8}>
                <Text style={styles.commentCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {hasReplies ? (
          <View style={styles.commentRepliesWrap}>
            <TouchableOpacity
              style={styles.commentRepliesToggle}
              onPress={() => onToggleReplies(comment.id)}
              activeOpacity={0.8}
            >
              <View style={styles.commentRepliesLine} />
              <Text style={styles.commentRepliesToggleText}>
                {areRepliesExpanded
                  ? 'Hide replies'
                  : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
              </Text>
            </TouchableOpacity>

            {areRepliesExpanded ? (
              <View style={styles.commentReplies}>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                  comment={reply}
                    currentUserId={currentUserId}
                    currentUserEmail={currentUserEmail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                    onLike={onLike}
                    expandedReplyThreads={expandedReplyThreads}
                    onToggleReplies={onToggleReplies}
                    repliesMeta={repliesMeta}
                    onLoadMoreReplies={onLoadMoreReplies}
                    editingCommentId={editingCommentId}
                    editingCommentText={editingCommentText}
                    onEditingTextChange={onEditingTextChange}
                    onSubmitEdit={onSubmitEdit}
                    onCancelEdit={onCancelEdit}
                    replyingToCommentId={replyingToCommentId}
                    replyText={replyText}
                    onReplyTextChange={onReplyTextChange}
                    onSubmitReply={onSubmitReply}
                    onCancelReply={onCancelReply}
                    isReply={true}
                  />
                ))}
                {repliesMeta?.[comment.id]?.loading ? (
                  <ActivityIndicator size="small" color="#f97316" style={{ marginVertical: 6 }} />
                ) : null}
                {repliesMeta?.[comment.id]?.hasMore && !repliesMeta?.[comment.id]?.loading ? (
                  <TouchableOpacity onPress={() => onLoadMoreReplies(comment.id)} activeOpacity={0.8} style={styles.commentLoadMoreBtn}>
                    <Text style={styles.commentLoadMoreText}>Aur replies dekhein</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function isPlayableVideoSource(uri) {
  if (typeof uri !== 'string' || !uri.trim()) return false;
  if (/(youtube\.com|youtu\.be)/i.test(uri)) return false;
  if (Platform.OS !== 'web') return true;
  if (/^(blob:|data:)/i.test(uri)) return true;
  return /^https?:/i.test(uri) && /\.(mp4|m4v|mov|webm|ogv|m3u8)(\?.*)?$/i.test(uri);
}

function useVideoThumbnail(videoUri) {
  const [thumbnail, setThumbnail] = useState(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    setThumbnail(null);
    setCapturing(false);
    if (!videoUri || Platform.OS !== 'web') return;
    if (!/^https?:|^blob:|^data:/i.test(videoUri)) return;
    let cancelled = false;
    setCapturing(true);
    const video = document.createElement('video');
    video.src = videoUri;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    const cleanup = () => { video.src = ''; video.load(); };
    video.addEventListener('loadedmetadata', () => {
      if (cancelled) { cleanup(); return; }
      video.currentTime = Math.min(0.1, video.duration * 0.05 || 0.1);
    });
    video.addEventListener('seeked', () => {
      if (cancelled) { cleanup(); return; }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (dataUrl && dataUrl !== 'data:,' && dataUrl.length > 100) {
          if (!cancelled) setThumbnail(dataUrl);
        }
      } catch {}
      if (!cancelled) setCapturing(false);
      cleanup();
    });
    video.addEventListener('error', () => {
      if (!cancelled) { setCapturing(false); setThumbnail(null); }
      cleanup();
    });
    const timeout = setTimeout(() => {
      if (!cancelled) { setCapturing(false); setThumbnail(null); }
      cleanup();
    }, 8000);
    video.load();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      cleanup();
    };
  }, [videoUri]);

  return { thumbnail, capturing };
}

function useCardVisibility(ref, threshold = 0.3) {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = ref?.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => { setIsVisible(entry.intersectionRatio >= threshold); },
      { threshold: [0, threshold, 1.0] }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isVisible;
}

// ─────────────────────────────────────────────
// Inline Read More Text Component
// ─────────────────────────────────────────────
const EXCERPT_LINE_LIMIT = 1;

function InlineReadMore({ text, style, onPress }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const safeText = String(text || '').trim();
  const isAndroid = Platform.OS === 'android' || Platform.OS === 'ios'; // iOS bhi Android jaisa (Show more toggle hidden, poora text press)
  const shouldShowToggle = !isAndroid && (isTruncated || safeText.length > 180);

  useEffect(() => {
    setExpanded(false);
    setIsTruncated(false);
  }, [safeText]);

  if (!safeText) return null;

  const textNode = (
    <Text
      style={style}
      numberOfLines={expanded ? undefined : EXCERPT_LINE_LIMIT}
      onTextLayout={(e) => {
        if (!expanded) {
          setIsTruncated(e.nativeEvent.lines.length > EXCERPT_LINE_LIMIT);
        }
      }}
    >
      {safeText}
    </Text>
  );

  return (
    <View style={styles.inlineReadMoreWrap}>
      {isAndroid && onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          {textNode}
        </TouchableOpacity>
      ) : (
        textNode
      )}
      {shouldShowToggle ? (
        <TouchableOpacity
          style={styles.inlineReadMoreButton}
          onPress={() => setExpanded((prev) => !prev)}
          activeOpacity={0.75}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
        <Text style={styles.inlineReadMoreLink}>
            {expanded ? 'View Less' : 'View More'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
// ─────────────────────────────────────────────
// TrendingCard Component
// ─────────────────────────────────────────────
function TrendingCard({ item, onPress, onLike, onOpenComments, onShare, currentUserEmail }) {
  const liked = currentUserEmail && Array.isArray(item.liked_by) && item.liked_by.includes(currentUserEmail);
  return (
    <TouchableOpacity style={styles.trndCard} onPress={() => onPress(item)} activeOpacity={0.85}>
      <Image
        source={{ uri: item.images?.length ? item.images[0] : item.video || item.image }}
        style={styles.trndCardImg}
        resizeMode="cover"
      />
      <View style={styles.trndCategoryChip}>
        <Text style={styles.trndCategoryChipText}>{item.category || 'News'}</Text>
      </View>
      <Text style={styles.trndCardTitle} numberOfLines={2}>{item.title}</Text>
      <View style={styles.trndCardActions}>
        <TouchableOpacity style={styles.trndActionBtn} onPress={() => onLike(item)}>
          <Feather name="heart" size={12} color={liked ? '#e11d48' : '#94a3b8'} />
          <Text style={styles.trndActionText}>{item.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trndActionBtn} onPress={() => onOpenComments(item)}>
          <Feather name="message-circle" size={12} color="#94a3b8" />
          <Text style={styles.trndActionText}>{item.comments || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trndActionBtn} onPress={() => onShare(item)}>
          <Feather name="share-2" size={12} color="#94a3b8" />
          <Text style={styles.trndActionText}>{item.shares || 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// NewsSectionBlock Component
// ─────────────────────────────────────────────
function NewsSectionBlock({ title, items, onPress, onLike, onOpenComments, onShare, currentUserEmail }) {
  if (!items.length) return null;
  return (
    <View style={styles.sectionBlockCard}>
      <View style={styles.sectionBlockHeader}>
        <Text style={styles.sectionBlockTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        {items.map((item) => (
          <TrendingCard
            key={item.id}
            item={item}
            onPress={onPress}
            onLike={onLike}
            onOpenComments={onOpenComments}
            onShare={onShare}
            currentUserEmail={currentUserEmail}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Card Component
// ─────────────────────────────────────────────
// ✅ NEW: UserStore ke mapped comment -> card ke comment shape
const toCardComment = (c = {}) => ({
  id: String(c.id || ''),
  text: String(c.text || ''),
  author: String(c.author || 'User'),
  authorInitial: String(c.author || 'U').charAt(0).toUpperCase(),
  authorAvatar: String(c.author_avatar || ''),
  author_id: c.author_id != null ? String(c.author_id) : '',
  author_email: String(c.author_email || ''),
  author_has_blue_tick: Boolean(c.author_has_blue_tick),
  time: c.date || '',
  edited_at: c.edited_at || null,
  likes: Number(c.likes || 0),
  liked_by: Array.isArray(c.liked_by) ? c.liked_by : [],
  liked_by_me: Boolean(c.liked_by_me),
  is_mine: Boolean(c.is_mine),
  replies_count: Number(c.replies_count ?? (Array.isArray(c.replies) ? c.replies.length : 0)),
  replies: Array.isArray(c.replies) ? c.replies.map(toCardComment) : [],
});

// ✅ NEW: GET /news ke latest_comments[] (max 2) -> preview rows
const mapPreviewComments = (list) => (Array.isArray(list) ? list : []).slice(0, 2).map((c) => ({
  id: c?.id != null ? `cmt-${c.id}` : '',
  text: String(c?.comment ?? c?.text ?? '').trim(),
  author: String(c?.user?.name || c?.author || 'User'),
  avatar: String(c?.user?.profile_image_url || ''),
})).filter((c) => c.id && c.text);

export default function NewsFeedCard({
  story,
  isCompactLayout,
  navigation,
  onOpenDetails,
  onOpenLocation,
  onOpenCategory,
  onOpenAuthorProfile,
  onOpenLeadForm,   
  commonCopy,
  currentUser,
  displayedItems,
    altShade = false,
}) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { isLoggedIn } = useAuth();
  const isScreenFocused = useIsFocused();
  const cardRef = useRef(null);
  const likeInFlightRef = useRef(false);
  const lastOwnLikeActionAtRef = useRef(0); // ✅ user ke apne like/unlike ka timestamp — stale poll se overwrite rokne ke liye
  const isCardVisible = useCardVisibility(cardRef, 0.3);

 const [currentEmail, setCurrentEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
 const [isLiked, setIsLiked] = useState(Boolean(story.liked_by_me));
  const [likesCount, setLikesCount] = useState(Number(story.likes || 0));
  const [commentsCount, setCommentsCount] = useState(Number(story.comments || 0));
  const [sharesCount, setSharesCount] = useState(Number(story.shares || 0));
  const [viewsCount] = useState(Number(story.views || 0));
  const [showComments, setShowComments] = useState(false);
  const [mediaWidth, setMediaWidth] = useState(0);
  const [commentText, setCommentText] = useState('');
   const [localComments, setLocalComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const commentsLoadingRef = useRef(false);
  const commentsCursorRef = useRef(null);
  const commentsHasMoreRef = useRef(true);
  const [previewComments, setPreviewComments] = useState(() => mapPreviewComments(story.latest_comments));
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  // ✅ replies ki lazy-loading state: { [commentId]: { loading, loaded, hasMore, cursor } }
  const repliesMetaRef = useRef({});
  const [repliesMeta, setRepliesMeta] = useState({});
  const likeBusyRef = useRef(new Set());
  const [showActionMenu, setShowActionMenu] = useState(false);
  // ✅ Web: 3-dot menu chhota dropdown ban ke button ke neeche khulta hai (bottom sheet nahi)
  const moreBtnRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isBlockedNow, setIsBlockedNow] = useState(false);
  const followActionInFlightRef = useRef(false);  
  const inputRef = useRef(null);
  const storyAuthorEmail = String(story.author_email || story.createdBy || story.created_by || '').trim().toLowerCase();
  const storyAuthorId = story.author_id ?? story.authorId ?? null;
  const isOwnStory = storyAuthorId != null && currentUserId != null
    ? String(storyAuthorId) === String(currentUserId)
    : Boolean(storyAuthorEmail && storyAuthorEmail === currentEmail);
  const hasFollowTarget = Boolean(storyAuthorEmail) || storyAuthorId != null;
  const isAdStory = Boolean(story.isAd);
  const adRedirectMeta = isAdStory ? getAdRedirectMeta(story) : null;

  const trendingItems = useMemo(() => {
    if (!displayedItems || !Array.isArray(displayedItems)) return [];
    return [...displayedItems]
      .sort((a, b) => (Number(b.views || 0) + Number(b.likes || 0) * 2) - (Number(a.views || 0) + Number(a.likes || 0) * 2))
      .slice(0, 8);
  }, [displayedItems]);

  const politicsItems = useMemo(() => {
    if (!displayedItems || !Array.isArray(displayedItems)) return [];
    return displayedItems.filter((i) => (i.category || '').toLowerCase() === 'politics').slice(0, 8);
  }, [displayedItems]);

  const sportsItems = useMemo(() => {
    if (!displayedItems || !Array.isArray(displayedItems)) return [];
    return displayedItems.filter((i) => (i.category || '').toLowerCase() === 'sports').slice(0, 8);
  }, [displayedItems]);

  const openNewsDetails = useCallback((item) => {
    navigation.navigate('NewsDetail', { newsId: item.id, item });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowComments(false);
        setEditingCommentId(null);
        setEditingCommentText('');
        setReplyingToCommentId(null);
        setReplyText('');
        setExpandedReplyThreads({});
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      setShowComments(false);
      setEditingCommentId(null);
      setReplyingToCommentId(null);
      setExpandedReplyThreads({});
    };
  }, []);

  const findParentCommentId = useCallback((comments, targetCommentId) => {
    for (const comment of comments) {
      if (comment.id === targetCommentId) return comment.id;
      if (Array.isArray(comment.replies) && comment.replies.some((reply) => reply.id === targetCommentId)) {
        return comment.id;
      }
    }
    return null;
  }, []);

  const setReplyMeta = useCallback((commentId, patch) => {
    repliesMetaRef.current = { ...repliesMetaRef.current, [commentId]: { ...(repliesMetaRef.current[commentId] || {}), ...patch } };
    setRepliesMeta(repliesMetaRef.current);
  }, []);

  // GET /comments/{commentId}/replies  (cursor pagination). more=true -> agla page
  const loadReplies = useCallback(async (commentId, { more = false } = {}) => {
    const meta = repliesMetaRef.current[commentId] || {};
    if (meta.loading) return;
    if (more && !meta.hasMore) return;
    setReplyMeta(commentId, { loading: true });
    try {
      const res = await UserStore.getCommentReplies(commentId, { cursor: more ? meta.cursor : null, perPage: 20 });
      if (!res?.ok) { setReplyMeta(commentId, { loading: false }); return; }
      const page = res.replies.map(toCardComment);
      setLocalComments((prev) => prev.map((c) => {
        if (c.id !== commentId) return c;
        const old = Array.isArray(c.replies) ? c.replies : [];
        return { ...c, replies: more ? [...old, ...page.filter((p) => !old.some((x) => x.id === p.id))] : page };
      }));
      setReplyMeta(commentId, { loading: false, loaded: true, cursor: res.nextCursor || null, hasMore: Boolean(res.hasMore && res.nextCursor) });
    } catch {
      setReplyMeta(commentId, { loading: false });
    }
  }, [setReplyMeta]);

  const handleLoadMoreReplies = useCallback((commentId) => loadReplies(commentId, { more: true }), [loadReplies]);

  const handleToggleReplies = useCallback((commentId) => {
    const isOpen = Boolean(expandedReplyThreads[commentId]);
    setExpandedReplyThreads((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
    // pehli baar kholne par hi replies fetch karo
    if (!isOpen && !repliesMetaRef.current[commentId]?.loaded) loadReplies(commentId);
  }, [expandedReplyThreads, loadReplies]);

   useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await UserStore.getCurrentUser();
        if (!alive) return;
        setCurrentEmail(String(user?.email || '').trim().toLowerCase());
        setCurrentUserId(user?.id ?? user?.user_id ?? null);
      } catch {
        if (!alive) return;
        setCurrentEmail('');
        setCurrentUserId(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!currentEmail) return;
    let alive = true;
    (async () => {
      // ✅ agar user ne abhi-abhi (15 sec ke andar) khud like/unlike kiya hai,
      // to ye stale poll/refresh se aaya story prop trust nahi karenge —
      // warna optimistic update turant "auto unlike" hoke ulta ho jaata tha.
      if (Date.now() - lastOwnLikeActionAtRef.current < 15000) return;
     const serverLiked = story.liked_by_me !== undefined ? Boolean(story.liked_by_me) : Boolean(Array.isArray(story.liked_by) && story.liked_by.includes(currentEmail));
      if (!alive) return;
      setIsLiked(serverLiked);
    })();
    return () => { alive = false; };
  }, [currentEmail, story.id, story.liked_by, story.liked_by_me]);

  useEffect(() => {
    let alive = true;
    (async () => {
     if (!hasFollowTarget || !currentEmail || isOwnStory) {
        if (alive) setIsFollowingAuthor(false);
        return;
      }
            const summary = await UserStore.getFollowSummary?.(storyAuthorEmail, storyAuthorId);
      if (!alive) return;
      setIsFollowingAuthor(Boolean(summary?.isFollowing));
    })();
    return () => { alive = false; };
  }, [currentEmail, storyAuthorEmail, storyAuthorId, isOwnStory, hasFollowTarget]);
  // ✅ FIX: ab is id/email ka follow status app mein kahin bhi (dusre button se)
  // change ho to yeh button bhi turant sync ho jayega, bina refetch kiye.
  useEffect(() => {
    if (!hasFollowTarget) return undefined;
    const unsubscribe = UserStore.subscribeFollowState?.((payload) => {
      if (UserStore.matchesFollowTarget?.(payload, storyAuthorEmail, storyAuthorId)) {
        setIsFollowingAuthor(Boolean(payload.isFollowing));
      }
    });
    return () => { unsubscribe?.(); };
  }, [storyAuthorEmail, storyAuthorId]);
  useEffect(() => {
    // ✅ same grace-window guard — apne hi like ke turant baad stale count se overwrite na ho
    if (Date.now() - lastOwnLikeActionAtRef.current < 15000) {
      setCommentsCount(Number(story.comments || 0));
      setSharesCount(Number(story.shares || 0));
      return;
    }
    setLikesCount(Number(story.likes || 0));
    setCommentsCount(Number(story.comments || 0));
    setSharesCount(Number(story.shares || 0));
  }, [story.comments, story.likes, story.shares]);

  const rawImageUri = useMemo(() => {
    const candidates = [
      String(story.image || '').trim(),
      ...(Array.isArray(story.images) ? story.images.map((uri) => String(uri || '').trim()) : []),
    ].filter((uri) => isValidImageUrl(uri));
    return candidates[0] || '';
  }, [story.image, story.images]);

  const [resolvedImageUri, setResolvedImageUri] = useState(null);

  const categoryColor =
    CATEGORY_COLOR_MAP[(story.menuTags || []).find((tag) => tag !== 'latest') || 'latest'] ||
    CATEGORY_COLOR_MAP.latest;

  const userName = currentUser?.name || commonCopy?.you || 'User';

  const userAvatar = useMemo(() => {
    const avatar = String(currentUser?.profile_image || '').trim();
    return isValidImageUrl(avatar) ? avatar : '';
  }, [currentUser?.profile_image]);

  const videoUri = String(story.video || '').trim();
  const [resolvedVideoUri, setResolvedVideoUri] = useState(null);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    (async () => {
      if (Platform.OS !== 'web') { setResolvedVideoUri(null); return; }
      if (!isIdbMediaUri(videoUri)) { setResolvedVideoUri(null); return; }
      const next = await resolveIdbMediaUriToObjectUrl(videoUri);
      if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
      objectUrl = next;
      setResolvedVideoUri(next);
    })();
    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [videoUri]);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    (async () => {
      if (Platform.OS !== 'web') { setResolvedImageUri(null); return; }
      if (!isIdbMediaUri(rawImageUri)) { setResolvedImageUri(null); return; }
      const next = await resolveIdbMediaUriToObjectUrl(rawImageUri);
      if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
      objectUrl = next;
      setResolvedImageUri(next);
    })();
    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [rawImageUri]);

  const effectiveVideoUri = useMemo(() => {
    if (Platform.OS === 'web' && isIdbMediaUri(videoUri)) return resolvedVideoUri || '';
    return videoUri;
  }, [resolvedVideoUri, videoUri]);

  const effectiveImageUri = useMemo(() => {
    if (Platform.OS === 'web' && isIdbMediaUri(rawImageUri)) return resolvedImageUri || '';
    return rawImageUri;
  }, [rawImageUri, resolvedImageUri]);

const safeImage = isValidImageUrl(effectiveImageUri)
    ? effectiveImageUri
    : buildPlaceholderImage(story.id || story.title);

  const isFileAttachment = story.mediaType === 'File' && Boolean(story.file?.uri);

  // 2+ images => swipeable gallery. Bahar ka TouchableOpacity Android pe horizontal
  // swipe/scroll chheen leta tha, isliye gallery ke case me plain View use hota hai
  // (image tap MediaGallery ke andar onPressImage se handle hota hai).
  const hasImageGallery = Array.isArray(story.images) && story.images.filter(Boolean).length > 1;
  if (__DEV__) console.log('[GALLERY]', story.id, Platform.OS, 'images:', story.images?.length, JSON.stringify(story.images));
  const fileNameOrUri = String(story.file?.name || story.file?.uri || '').toLowerCase();
  const fileKind = isFileAttachment
    ? (fileNameOrUri.endsWith('.pdf') ? 'pdf' : /\.docx?$/i.test(fileNameOrUri) ? 'doc' : 'file')
    : null;
  const handleFileOpen = () => {
    if (story.file?.uri) Linking.openURL(story.file.uri).catch(() => {});
  };
  const postLink = useMemo(() => {
    if (story.url) return String(story.url);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/news/${encodeURIComponent(story.id || story.title || 'story')}`;
    }
    return `https://rtinews.in/news/${encodeURIComponent(story.id || story.title || 'story')}`;
  }, [story.id, story.title, story.url]);

  const canPlayVideo = Boolean(effectiveVideoUri) && isPlayableVideoSource(effectiveVideoUri);
  const { thumbnail: videoThumbnail, capturing: thumbnailCapturing } = useVideoThumbnail(
    canPlayVideo ? effectiveVideoUri : null
  );

  const [videoPaused, setVideoPaused] = useState(true);
  const [showVideoPoster, setShowVideoPoster] = useState(true);

  const player = useVideoPlayer(canPlayVideo ? { uri: effectiveVideoUri } : null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (!canPlayVideo) return;
    if (!isScreenFocused) {
      safePause(player);
      setVideoPaused(true);
      setShowVideoPoster(true);
    }
  }, [canPlayVideo, isScreenFocused, player]);

  useEffect(() => {
    if (!canPlayVideo) return;
    if (!isCardVisible && !videoPaused) {
      safePause(player);
      setVideoPaused(true);
      setShowVideoPoster(true);
    }
  }, [canPlayVideo, isCardVisible, player, videoPaused]);

  useEffect(() => {
    setVideoPaused(true);
    setShowVideoPoster(true);
    if (canPlayVideo) safePause(player);
  }, [canPlayVideo, effectiveVideoUri, player]);

  useEffect(() => {
    if (!canPlayVideo || !player) return;
    if (videoPaused) {
      safePause(player);
    } else {
      const ok = safePlay(player);
      if (!ok) setVideoPaused(true);
    }
  }, [canPlayVideo, videoPaused, player]);

   useEffect(() => {
    return () => { safePause(player); };
  }, [player]);

  // ✅ FIX: video poora chalne ke baad state "playing" hi atka rehta tha aur player end par khada tha,
  // isliye pause/play ke baad dobara play nahi hota tha. End par start par rewind + paused state.
  useEffect(() => {
    if (!canPlayVideo || !player || typeof player.addListener !== 'function') return undefined;
    const sub = player.addListener('playToEnd', () => {
      try { player.currentTime = 0; } catch (_) {}
      setVideoPaused(true);
    });
    return () => { try { sub?.remove?.(); } catch (_) {} };
  }, [canPlayVideo, player]);

  const [videoDurationLabel, setVideoDurationLabel] = useState('');
  useEffect(() => {
    if (!canPlayVideo || !player) return;
    const fmt = (secs) => {
      const total = Math.floor(secs || 0);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    const id = setInterval(() => {
      if (player?.duration) {
        setVideoDurationLabel(fmt(player.duration));
        clearInterval(id);
      }
    }, 400);
    return () => clearInterval(id);
  }, [canPlayVideo, player]);

  const handleVideoPress = () => {
    // Asli player state dekho (sirf React state par bharosa nahi) — taaki pause ke baad play hamesha chale
    let playingNow = false;
    try { playingNow = Boolean(player?.playing); } catch (_) { playingNow = !videoPaused; }
    if (!videoPaused && playingNow) {
      safePause(player);
      setVideoPaused(true);
      return;
    }
    try {
      const dur = Number(player?.duration || 0);
      if (dur > 0 && Number(player?.currentTime || 0) >= dur - 0.2) player.currentTime = 0;
    } catch (_) {}
    setShowVideoPoster(false);
    setVideoPaused(false);
    safePlay(player); // state pehle se false ho tab bhi seedha play karo
  };

  const handleAdPress = useCallback(() => {
    if (!isAdStory) return false;
    if (story.redirect === 'lead_form') {
      onOpenLeadForm?.(story);
      return true;
    }
    openAdRedirect(story, navigation, {
      onProfilePress: () => onOpenAuthorProfile(story),
    });
    return true;
  }, [isAdStory, navigation, onOpenAuthorProfile, onOpenLeadForm, story]);

  const handleImagePress = () => {
    if (handleAdPress()) return;
    onOpenDetails(story);
  };

  const showLoginRequired = useCallback(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Please login to continue.');
        return;
      }
      Alert.alert('Login required', 'Please login to continue.');
    } catch {}
  }, []);

  const goToLogin = useCallback(() => {
    try {
      if (navigation?.navigate) { navigation.navigate('Login'); return; }
    } catch {}
    showLoginRequired();
  }, [navigation, showLoginRequired]);

  const requireLogin = useCallback(() => {
    if (isLoggedIn && currentEmail) return true;
    goToLogin();
    return false;
  }, [currentEmail, isLoggedIn, goToLogin]);

const handleLike = async () => {
  if (!requireLogin()) return;
  if (likeInFlightRef.current) return;      // is news ka request pending hai — dobara nahi
  likeInFlightRef.current = true;

  const prevLiked = isLiked;
  const prevCount = likesCount;
  setIsLiked(!prevLiked);
  setLikesCount(Math.max(0, prevCount + (prevLiked ? -1 : 1)));
  lastOwnLikeActionAtRef.current = Date.now();

  try {
    let adUserId = null;
    if (isAdStory) {
      const u = await UserStore.ensureUserId();
      adUserId = u?.id || u?.user_id || null;
    }
    // ✅ News ke liye user_id NAHI jaata
    const result = await AuthAPI.likeNews({
      userId: adUserId,
      newsId: isAdStory ? null : story.id,
      adsId: isAdStory ? story.id : null,
    });

    if (!result?.ok) {
      setIsLiked(prevLiked);                // exact rollback
      setLikesCount(prevCount);
      lastOwnLikeActionAtRef.current = 0;
      if (result?.isAuth) goToLogin();
      else Alert.alert('Like', result?.message || 'Unable to update like. Please try again.');
      return;
    }

    // ✅ backend ka response final truth
    const finalLiked = Boolean(result.liked);
    setIsLiked(finalLiked);
    if (Number.isFinite(result.likesCount)) {
      setLikesCount(result.likesCount);
    } else {
      setLikesCount(Math.max(0, prevCount + (finalLiked ? 1 : 0) - (prevLiked ? 1 : 0)));
    }
  } catch {
    setIsLiked(prevLiked);
    setLikesCount(prevCount);
    lastOwnLikeActionAtRef.current = 0;
  } finally {
    likeInFlightRef.current = false;
  }
};
   const loadComments = useCallback(async ({ reset = false } = {}) => {
    if (commentsLoadingRef.current) return;                    // duplicate request nahi
    if (!reset && !commentsHasMoreRef.current) return;         // has_more=false -> stop
    commentsLoadingRef.current = true;
    setCommentsLoading(true);
    try {
      const res = await UserStore.getNewsCommentsPage(story.id, {
        cursor: reset ? null : commentsCursorRef.current,
        perPage: 20,
      });
      if (!res?.ok) return;
      if (reset) { repliesMetaRef.current = {}; setRepliesMeta({}); setExpandedReplyThreads({}); }
      const page = res.comments.map(toCardComment);
      setLocalComments((prev) => (
        reset ? page : [...prev, ...page.filter((p) => !prev.some((x) => x.id === p.id))]
      ));
      commentsCursorRef.current = res.nextCursor || null;
      commentsHasMoreRef.current = Boolean(res.hasMore && res.nextCursor);
      setCommentsHasMore(commentsHasMoreRef.current);
    } catch {
    } finally {
      commentsLoadingRef.current = false;
      setCommentsLoading(false);
    }
  }, [story.id]);

  // Comments dekhna PUBLIC hai (guest bhi). Add comment par login maanga jaata hai.
  const handleComment = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next) {
      if (isLoggedIn) setTimeout(() => inputRef.current?.focus(), 100);
      await loadComments({ reset: true });
    } else {
      setEditingCommentId(null);
      setEditingCommentText('');
      setReplyingToCommentId(null);
      setReplyText('');
      setExpandedReplyThreads({});
    }
  };
  const handleSubmitComment = async () => {
    if (!requireLogin()) return;
    const trimmed = commentText.trim().slice(0, 1000);
    if (!trimmed) return;
    try {
      const result = await UserStore.addNewsComment(story.id, trimmed, { isAd: isAdStory });
      if (!result?.ok) {
        if (result?.isAuth) goToLogin();
        else Alert.alert('Comment', result?.message || 'Unable to add comment.');
        return;
      }
      const newComment = { ...toCardComment(result.comment || {}), replies: [] };
      if (!newComment.authorAvatar) newComment.authorAvatar = userAvatar;
      if (!newComment.author_id && currentUserId != null) newComment.author_id = String(currentUserId);
      setLocalComments((prev) => [newComment, ...prev.filter((c) => c.id !== newComment.id)]);
      setPreviewComments((prev) => [
        { id: newComment.id, text: newComment.text, author: newComment.author, avatar: newComment.authorAvatar },
        ...prev,
      ].slice(0, 2));
      setCommentsCount((c) => (Number.isFinite(result.commentsCount) ? result.commentsCount : c + 1));
      setCommentText('');
    } catch {}
  };
  const handleEditComment = useCallback((commentId, currentText) => {
    setReplyingToCommentId(null);
    setReplyText('');
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  }, []);

  const handleSubmitEdit = async () => {
    const trimmed = editingCommentText.trim();
    if (!trimmed || !editingCommentId) return;
    try {
      const result = await UserStore.editNewsComment(story.id, editingCommentId, trimmed);
      if (!result?.ok) {
        if (result?.isAuth) goToLogin();
        else if (result?.notFound) await loadComments({ reset: true });
        else Alert.alert('Edit', result?.message || 'Unable to edit comment.');
        return;
      }
      setLocalComments((prev) =>
        prev.map((comment) => {
          if (comment.id === editingCommentId) return { ...comment, text: trimmed, edited_at: new Date().toISOString() };
          if (Array.isArray(comment.replies)) {
            return { ...comment, replies: comment.replies.map((r) => r.id === editingCommentId ? { ...r, text: trimmed, edited_at: new Date().toISOString() } : r) };
          }
          return comment;
        })
      );
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch {}
  };

  const handleCancelEdit = () => { setEditingCommentId(null); setEditingCommentText(''); };

   const handleDeleteComment = async (commentId) => {
    try {
      const result = await UserStore.deleteNewsComment(story.id, commentId);
      if (result?.notFound) {
        // already deleted / available nahi — list ko backend se reconcile karo
        await loadComments({ reset: true });
        return;
      }
      if (!result?.ok) {
        if (result?.isAuth) goToLogin();
        else Alert.alert('Delete', result?.message || 'Unable to delete comment.');
        return;
      }
      if (String(commentId).startsWith('rpl-')) {
        // reply delete: sirf replies_count badalta hai, news ka comments_count nahi
        setLocalComments((prev) =>
          prev.map((c) => (
            Array.isArray(c.replies) && c.replies.some((r) => r.id === commentId)
              ? {
                  ...c,
                  replies: c.replies.filter((r) => r.id !== commentId),
                  replies_count: Number.isFinite(result.repliesCount) ? result.repliesCount : Math.max(0, (c.replies_count || 0) - 1),
                }
              : c
          ))
        );
      } else {
        setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
        setPreviewComments((prev) => prev.filter((p) => p.id !== commentId));
        setCommentsCount((c) => (Number.isFinite(result.commentsCount) ? result.commentsCount : Math.max(0, c - 1)));
      }
      if (editingCommentId === commentId) { setEditingCommentId(null); setEditingCommentText(''); }
      if (replyingToCommentId === commentId) { setReplyingToCommentId(null); setReplyText(''); }
    } catch {}
  };
  const handleReplyComment = useCallback((commentId) => {
    if (!requireLogin()) return;
    const parentCommentId = findParentCommentId(localComments, commentId) || commentId;
    if (replyingToCommentId === commentId) {
      setReplyingToCommentId(null);
      setReplyText('');
    } else {
      setEditingCommentId(null);
      setEditingCommentText('');
      setReplyingToCommentId(commentId);
      setReplyText('');
      setExpandedReplyThreads((prev) => ({ ...prev, [parentCommentId]: true }));
      const parent = localComments.find((c) => c.id === parentCommentId);
      if (parent && Number(parent.replies_count || 0) > 0 && !repliesMetaRef.current[parentCommentId]?.loaded) loadReplies(parentCommentId);
    }
  }, [findParentCommentId, localComments, replyingToCommentId, requireLogin, loadReplies]);

  const handleSubmitReply = async () => {
    if (!requireLogin()) return;
    const trimmed = replyText.trim().slice(0, 1000);
    if (!trimmed || !replyingToCommentId) return;
    try {
      // reply hamesha top-level comment par jaata hai (reply ke upar reply = uska parent comment)
      const parentCommentId = findParentCommentId(localComments, replyingToCommentId) || replyingToCommentId;
      const result = await UserStore.replyNewsComment(story.id, parentCommentId, trimmed);
      if (!result?.ok) {
        if (result?.isAuth) goToLogin();
        else if (result?.notFound) await loadComments({ reset: true });
        else Alert.alert('Reply', result?.message || 'Unable to add reply.');
        return;
      }
      // sirf replies_count badhao — news ka comments_count reply par nahi badalta
      setLocalComments((prev) => prev.map((c) => (
        c.id === parentCommentId
          ? { ...c, replies_count: Number.isFinite(result.repliesCount) ? result.repliesCount : (c.replies_count || 0) + 1 }
          : c
      )));
      setExpandedReplyThreads((prev) => ({ ...prev, [parentCommentId]: true }));
      setReplyingToCommentId(null);
      setReplyText('');
      // server ke order me thread dobara laao
      await loadReplies(parentCommentId);
    } catch {}
  };

  const handleCancelReply = () => { setReplyingToCommentId(null); setReplyText(''); };

  const handleLikeComment = async (commentId) => {
    if (!requireLogin()) return;
    if (likeBusyRef.current.has(commentId)) return;   // double-tap guard
    likeBusyRef.current.add(commentId);

    const patch = (fn) => setLocalComments((prev) => prev.map((c) => {
      if (c.id === commentId) return fn(c);
      if (Array.isArray(c.replies) && c.replies.some((r) => r.id === commentId)) {
        return { ...c, replies: c.replies.map((r) => (r.id === commentId ? fn(r) : r)) };
      }
      return c;
    }));
    const toggle = (c) => {
      const was = Boolean(c.liked_by_me);
      return { ...c, liked_by_me: !was, likes: Math.max(0, (c.likes || 0) + (was ? -1 : 1)) };
    };

    patch(toggle);                                     // 1) optimistic
    try {
      const result = await UserStore.likeNewsComment(story.id, commentId);
      if (!result?.ok) {                               // 3) fail -> wapas
        patch(toggle);
        if (result?.isAuth) goToLogin();
        return;
      }
      patch((c) => ({                                  // 2) server se sync
        ...c,
        liked_by_me: Boolean(result.liked),
        likes: Number.isFinite(result.likesCount) ? result.likesCount : c.likes,
      }));
    } catch {
      patch(toggle);
    } finally {
      likeBusyRef.current.delete(commentId);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `📰 ${story.title}\n\n${story.excerpt || ''}\n\n🔗 ${story.url || 'https://rtinews.in'}\n\nRTI News App se padhe`;
      const richShareMessage = `${story.title}\n\n${story.excerpt || story.description || ''}\n\n${effectiveImageUri ? `Image: ${effectiveImageUri}\n\n` : ''}Read full news: ${postLink}\n\nRTI News App${shareMessage ? '' : ''}`;
      const result = await Share.share(
        { title: story.title, message: richShareMessage, url: postLink },
        { subject: story.title, dialogTitle: 'Share karo' }
      );
      if (result.action === Share.sharedAction && !isAdStory) {
        const res = await AuthAPI.shareNews(story.id);
        if (res?.ok) {
          if (Number.isFinite(res.shareCount)) setSharesCount(res.shareCount);   // backend ka count
        } else if (res?.rateLimited) {
          Alert.alert('Share', 'Please try again later.');
        }
      }
    } catch {}
  };

  const closeActionMenu = () => { setShowActionMenu(false); setMenuAnchor(null); };
  const toggleActionMenu = () => {
    if (showActionMenu) { closeActionMenu(); return; }
    if (Platform.OS === 'web' && moreBtnRef.current?.measureInWindow) {
      moreBtnRef.current.measureInWindow((x, y, w, h) => {
        const menuW = 190;
        const menuH = 140;
        const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const viewW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const openUp = y + h + menuH + 8 > viewH;
        setMenuAnchor({
          top: openUp ? Math.max(8, y - menuH - 4) : y + h + 4,
          left: Math.max(8, Math.min(x + w - menuW, viewW - menuW - 8)),
        });
        setShowActionMenu(true);
      });
      return;
    }
    setShowActionMenu(true);
  };
  const showActionResult = (title, message) => { try { Alert.alert(title, message); } catch {} };

  const handleReport = async () => {
    closeActionMenu();
    await UserStore.recordNewsFeedMenuAction(story.id, 'report', { title: story.title || '', reason: 'Reported from news feed menu' });
    showActionResult('Report submitted', 'Thanks. This post has been reported for review.');
  };
  const handleBlockAuthor = async () => {
    closeActionMenu();
    if (!currentEmail) { showActionResult('Login required', 'Please login to block this user.'); return; }
    if (!hasFollowTarget || isOwnStory) return;
    try {
      const result = await UserStore.blockUser(storyAuthorEmail, storyAuthorId);
      if (result?.ok === false) {
        showActionResult('Block', result?.message || 'Unable to block user.');
        return;
      }
      setIsBlockedNow(true); // is user ka post turant feed se hat jayega
    } catch {
      showActionResult('Block', 'Unable to block user.');
    }
  };

  const handleCopyLink = async () => {

    closeActionMenu();
    let copied = false;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postLink); copied = true;
      } else if (Clipboard?.setString) { Clipboard.setString(postLink); copied = true; }
    } catch { copied = false; }
    await UserStore.recordNewsFeedMenuAction(story.id, 'copy_link', { link: postLink, copied });
    showActionResult(copied ? 'Link copied' : 'Copy link', copied ? 'Post link copied.' : postLink);
  };

  const handleMenuShare = async () => { closeActionMenu(); await handleShare(); await UserStore.recordNewsFeedMenuAction(story.id, 'share', { link: postLink }); };

  const handleToggleFollowAuthor = async (event) => {
    event?.stopPropagation?.();
    if (followLoading || followActionInFlightRef.current) return;
    if (!currentEmail) { showActionResult('Login required', 'Please login to follow this user.'); return; }
    if (!hasFollowTarget || isOwnStory) return;

    followActionInFlightRef.current = true;
    const nextFollowing = !isFollowingAuthor;
    setFollowLoading(true);
    setIsFollowingAuthor(nextFollowing);
    try {
       const result = nextFollowing
        ? await UserStore.followUser(storyAuthorEmail, storyAuthorId)
        : await UserStore.unfollowUser(storyAuthorEmail, storyAuthorId);
      if (result?.ok === false) {
        setIsFollowingAuthor(!nextFollowing);
        showActionResult('Follow', result?.message || 'Unable to update follow status.');
        return;
      }
      setIsFollowingAuthor(Boolean(result?.isFollowing));
    } catch {
      setIsFollowingAuthor(!nextFollowing);
      showActionResult('Follow', 'Unable to update follow status.');
    } finally {
      followActionInFlightRef.current = false;
      setFollowLoading(false);
    }
  };

  const showPosterOverlay = videoPaused && showVideoPoster;
  const posterReady = videoThumbnail !== null;
  const stillCapturing = thumbnailCapturing && !posterReady;
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();
  const currentUserHasBlueTick = Boolean(currentUser && UserStore.hasBlueTick(currentUser));
  const [liveAuthorProfile, setLiveAuthorProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!storyAuthorId) { setLiveAuthorProfile(null); return; }
    UserStore.getPublicProfileById(storyAuthorId).then((profile) => {
      if (!cancelled) setLiveAuthorProfile(profile || null);
    });
    return () => { cancelled = true; };
  }, [storyAuthorId]);

  // Refresh the profile entitlement so a web purchase appears on Android and
  // an old post cannot retain a tick after the Premium Plan expires.
    const authorHasBlueTick = Boolean(
    story.author_has_blue_tick ||
    (liveAuthorProfile
      ? UserStore.hasBlueTick(liveAuthorProfile)
      : (
        (storyAuthorEmail && currentUserEmail === storyAuthorEmail && currentUserHasBlueTick) ||
        UserStore.hasBlueTick({
          subscription_plan: story.author_subscription_plan,
          is_subscribed: story.author_is_subscriber || story.author_is_premium,
        })
      ))
  );

  // Seat name (jaise "Car Nicobar") ab nahi dikhana. Uski jagah author ke
  // subscription plan ka role name dikhega.
  const authorPlanForRole = liveAuthorProfile?.subscription_plan || story.author_subscription_plan || null;
  const planRoleNames = (authorPlanForRole?.role_names?.length
    ? authorPlanForRole.role_names
    : String(UserStore.getSeatRoleNameForPlanRoleId(authorPlanForRole?.role_id_raw || authorPlanForRole?.role_id || '') || '')
        .split(', ')
  ).filter(Boolean);
  // Seat id ("district_head") se role ka naam banao -> "District Head".
  // Seat NAME ("Car Nicobar") use nahi karna, sirf seat ID se role ka naam.
  const authorSeatId = String(
    liveAuthorProfile?.state_seat?.seat_id || story.author_seat_id || story.author_state_seat?.seat_id || ''
  ).trim();
  const seatRoleFromId = authorSeatId
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  // Priority: plan ke role names > seat id wala role > plan name > role label
  const seatLabel =
    planRoleNames.join(', ') ||
    seatRoleFromId ||
    String(authorPlanForRole?.plan_name || authorPlanForRole?.name || '').trim() ||
    String(liveAuthorProfile?.role_label || story.author_role_label || '').trim();
  // TEMP DEBUG: check karne ke baad ye line hata dena.
  if (typeof console !== 'undefined') console.log('[PLAN-ROLE-DEBUG]', story.author_name, { authorSeatId, seatLabel, liveAuthorPlan: liveAuthorProfile?.subscription_plan, storyPlan: story.author_subscription_plan, seat_name_from_backend: liveAuthorProfile?.state_seat?.seat_name || story.author_seat_name });
  const authorTier = getProfileTier({
    seat_id: liveAuthorProfile?.state_seat?.seat_id || story.author_seat_id || story.author_state_seat?.seat_id,
    role: liveAuthorProfile?.role || story.author_role,
    subscription_type: liveAuthorProfile?.subscription_type || story.author_subscription_type,
    subscription_plan: liveAuthorProfile?.subscription_plan,
    has_blue_tick: authorHasBlueTick,
    is_subscribed: liveAuthorProfile
      ? Boolean(liveAuthorProfile.is_subscribed)
      : Boolean(story.author_is_subscribed || story.author_is_subscriber || story.author_is_premium),
  });
  const useGalleryWrap = hasImageGallery && !canPlayVideo && !isFileAttachment;
  const HeroWrap = useGalleryWrap ? View : TouchableOpacity;
  const heroWrapProps = useGalleryWrap
    ? {}
    : {
        onPress: canPlayVideo ? handleVideoPress : (isFileAttachment ? handleFileOpen : handleImagePress),
        activeOpacity: 0.95,
      };
  const authorAvatarUri = isValidImageUrl(story.author_profile_image) ? story.author_profile_image : '';

  if (isBlockedNow) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
           <View ref={cardRef} style={[styles.storyCardShell, Platform.OS !== 'web' && styles.androidStoryCardShell, altShade && styles.storyCardShellAlt]}>

        {/* ── Ad Top Box ── */}
        <View style={styles.adTopBox}>
          {/* Your existing ad component/AdMob banner here */}
        </View>

        {/* ── Trending Block ── */}
        <NewsSectionBlock
          title="Trending News"
          items={trendingItems}
          onPress={openNewsDetails}
          onLike={handleLike}
          onOpenComments={handleComment}
          onShare={handleShare}
          currentUserEmail={currentEmail}
        />

        {/* ── Author Row with Gaps and Better Buttons ── */}
        <TouchableOpacity style={styles.storyAuthorRow} onPress={() => onOpenAuthorProfile(story)} activeOpacity={0.86}>
       <ProfileAvatar uri={authorAvatarUri} size={44} style={styles.storyAuthorAvatar} forceDefault={authorTier.key === 'common'} />
          
          <View style={styles.storyAuthorTextWrap}>
            <View style={styles.storyAuthorNameRow}>
              <Text style={styles.storyAuthorName} numberOfLines={1}>{story.author_name || 'Unknown'}</Text>
              {authorHasBlueTick ? <VerifiedBadge size={18} iconSize={11} /> : null}
            </View>
            
                        {(seatLabel || authorTier.key !== 'common') ? (
              <View style={styles.storyReporterPill}>
                <Ionicons name="star" size={10} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={styles.storyReporterPillText} numberOfLines={1}>{seatLabel || authorTier.label}</Text>
              </View>
            ) : null}
            
            <View style={styles.storyAuthorMetaRow}>
                       {story.state ? (
                <View style={[styles.storyMetaPill, { flexShrink: 1 }]}>
                  <Ionicons name="location-outline" size={12} color="#94a3b8" />
                  <TouchableOpacity style={{ flexShrink: 1 }} onPress={() => onOpenLocation(story.state)} activeOpacity={0.82}>
                    <Text style={styles.storyMetaSmall} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                      {story.district ? `${story.district}, ${story.state}` : story.state}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
                          {(() => {
                const agoText = String(story.publishedAgo || story.date || '').trim();
                if (!agoText || /^updated recently$/i.test(agoText)) return null;
                return (
                  <View style={[styles.storyMetaPill, { flexShrink: 0 }]}>
                    <Ionicons name="time-outline" size={12} color="#94a3b8" />
                    <Text style={styles.storyMetaSmall} numberOfLines={1} maxFontSizeMultiplier={1.1}>{agoText}</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* ── Follow Button ── */}
       {hasFollowTarget && !isOwnStory ? (
            <TouchableOpacity
              style={[
                styles.storyFollowBtnWrap,
                followLoading && styles.storyFollowBtnDisabled,
              ]}
              onPress={handleToggleFollowAuthor}
              activeOpacity={0.84}
              disabled={followLoading}
            >
              <View style={styles.storyFollowBtn}>
                <Ionicons
                  name={isFollowingAuthor ? 'person' : 'person-add-outline'}
                  size={14}
                  color="#dc2626"
                />
                <Text style={styles.storyFollowBtnText}>
                  {followLoading ? '...' : (isFollowingAuthor ? 'Following' : 'Follow')}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
    
          {/* ── More Button ── */}
          <View ref={moreBtnRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.storyMoreBtnTop, showActionMenu && styles.storyMoreBtnTopActive]}
              onPress={(e) => { e.stopPropagation?.(); toggleActionMenu(); }}
              activeOpacity={0.82}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

              {/* ── Hero Image / Video (ab headline se upar, FB layout) ── */}
     <HeroWrap
       style={[
         styles.storyHeroImageWrap,
         hasImageGallery
           ? { height: undefined, backgroundColor: '#ffffff' }
           : null,
       ]}
       onLayout={(event) => {
         const w = Math.round(event.nativeEvent.layout.width);
         if (w && w !== mediaWidth) setMediaWidth(w);
       }}
       {...heroWrapProps}
     >
          {canPlayVideo ? (
            <>
              <VideoView player={player} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} contentFit="cover" nativeControls={false} fullscreenOptions={{ enabled: false }} playsInline onFirstFrameRender={() => setShowVideoPoster(false)} />
              {showPosterOverlay && (
                posterReady ? (
                  <Image source={{ uri: videoThumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : stillCapturing ? (
                  <View style={styles.videoLoadingOverlay}>
                    <View style={styles.videoLoadingBadge}><Text style={styles.videoLoadingText}>⏳</Text></View>
                  </View>
                ) : (
                  <View style={styles.videoLoadingOverlay} />
                )
              )}
              {videoPaused && (
                <View style={styles.storyVideoPlayOverlay}>
                  <TouchableOpacity
                    style={styles.storyVideoPlayBadge}
                    onPress={(e) => { e?.stopPropagation?.(); handleVideoPress(); }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={26} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              )}
              {!videoPaused && (
                <TouchableOpacity
                  style={styles.videoPlayingIndicator}
                  onPress={(e) => { e?.stopPropagation?.(); handleVideoPress(); }}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pause" size={18} color="#ffffff" />
                </TouchableOpacity>
              )}
            </>
        ) : isFileAttachment ? (
            <View style={styles.fileAttachmentBox}>
              <Ionicons
                name={fileKind === 'pdf' ? 'document-text' : 'document'}
                size={44}
                color={fileKind === 'pdf' ? '#DC2626' : '#2563EB'}
              />
              <Text style={styles.fileAttachmentName} numberOfLines={1}>
                {story.file?.name || (fileKind === 'pdf' ? 'PDF Document' : 'Document')}
              </Text>
              <TouchableOpacity style={styles.fileAttachmentBtn} onPress={handleFileOpen} activeOpacity={0.85}>
                <Ionicons name="eye-outline" size={14} color="#fff" />
                <Text style={styles.fileAttachmentBtnText}>
                  {fileKind === 'pdf' ? 'Open PDF' : fileKind === 'doc' ? 'Open Doc' : 'Open File'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : hasImageGallery && mediaWidth ? (
            <MediaGallery
              images={story.images}
              width={mediaWidth}
              maxHeight={240}
              fit="cover"
              onPressImage={handleImagePress}
            />
          ) : (
            <Image source={{ uri: safeImage }} style={styles.storyHeroImage} resizeMode="cover" />
          )}
          {/* ✅ Brand overlay: top-left logo + bottom auto-scroll "RTI INDIA NEWS" ticker */}
          <MediaLogo />
          <MediaTicker />
          {story.isFeatured ? (
            <View style={styles.topStoryRibbon}>
              <Text style={styles.topStoryRibbonText}>TOP STORY</Text>
            </View>
          ) : null}
          {/* Orange category tag (Breaking News etc.) hata diya — sirf ads par 'Sponsored' dikhega */}
          {isAdStory ? (
            <TouchableOpacity style={[styles.storyCategoryChip, { backgroundColor: `${categoryColor}CC` }]} onPress={handleAdPress} activeOpacity={0.84}>
              <Text style={styles.storyCategoryChipText}>Sponsored</Text>
            </TouchableOpacity>
          ) : null}

     {isAdStory && story.redirect === 'lead_form' ? (
            <View style={styles.adLeadStrip}>
              <TouchableOpacity
                style={[
                  styles.adLeadStripHalf,
                  story.owner_mobile ? styles.adLeadStripHalfBordered : null,
                ]}
                onPress={(e) => { e.stopPropagation?.(); handleAdPress(); }}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text-outline" size={16} color="#ffffff" />
                <Text style={styles.adLeadStripText}>Fill Lead Form</Text>
              </TouchableOpacity>

              {story.owner_mobile ? (
                <TouchableOpacity
                  style={styles.adLeadStripHalf}
                  onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`tel:${story.owner_mobile}`); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call-outline" size={16} color="#ffffff" />
                  <Text style={styles.adLeadStripText}>Call Now</Text>
                </TouchableOpacity>
              ) : null}
            </View>
        ) : isAdStory && (story.redirect === 'website' || story.redirect === 'shop' || story.redirect === 'whatsapp') ? (
            <View style={styles.adLeadStrip}>
              <TouchableOpacity
                style={[
                  styles.adLeadStripHalf,
                  story.owner_mobile ? styles.adLeadStripHalfBordered : null,
                ]}
                onPress={(e) => { e.stopPropagation?.(); handleAdPress(); }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={story.redirect === 'shop' ? 'storefront-outline' : story.redirect === 'whatsapp' ? 'logo-whatsapp' : 'globe-outline'}
                  size={16}
                  color="#ffffff"
                />
                <Text style={styles.adLeadStripText}>
                  {story.redirect === 'shop' ? 'Visit Shop' : story.redirect === 'whatsapp' ? 'Message on Whatsapp' : 'Visit Website'}
                </Text>
              </TouchableOpacity>
              {story.owner_mobile ? (
                <TouchableOpacity
                  style={styles.adLeadStripHalf}
                  onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`tel:${story.owner_mobile}`); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call-outline" size={16} color="#ffffff" />
                  <Text style={styles.adLeadStripText}>Call Now</Text>
                </TouchableOpacity>
              ) : null}
            </View>
                  ) : isAdStory && story.owner_mobile ? (
            <TouchableOpacity
              style={styles.adCallOnlyStrip}
              onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`tel:${story.owner_mobile}`); }}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={16} color="#ffffff" />
              <Text style={styles.adLeadStripText}>Call Now</Text>
            </TouchableOpacity>
          ) : null}

          {canPlayVideo && videoDurationLabel ? (
            <View style={styles.videoDurationBadge}>
              <Text style={styles.videoDurationText}>{videoDurationLabel}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.storyExpandBtn}
            onPress={(e) => { e.stopPropagation?.(); if (!handleAdPress()) onOpenDetails(story); }}
            activeOpacity={0.82}
          >
            <Ionicons name="expand-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
        </HeroWrap>

        {/* ── Headline + Excerpt (ab media ke niche, FB layout) ── */}
        <View style={styles.storyContentWrap}>
          <TouchableOpacity onPress={() => { if (!handleAdPress()) onOpenDetails(story); }} activeOpacity={0.88}>
            <Text style={styles.storyHeadlineText} numberOfLines={2} ellipsizeMode="tail">{story.title}</Text>
           
          </TouchableOpacity>
          {story.excerpt ? <InlineReadMore text={story.excerpt} style={styles.storyExcerptText} onPress={() => { if (!handleAdPress()) onOpenDetails(story); }} /> : null}
          {story.description && story.description !== story.excerpt ? <InlineReadMore text={story.description} style={styles.storyDescriptionText} onPress={() => { if (!handleAdPress()) onOpenDetails(story); }} /> : null}
        </View>

      

        {/* ── Like / Comment / Share — Shuru-style bordered pill buttons ── */}
        <View style={styles.singleActionRow}>
          <TouchableOpacity 
            style={[styles.singleActionItem, isLiked && styles.singleActionItemActive]} 
            onPress={handleLike} 
            activeOpacity={0.8}
          >
                      <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={16} 
              color={isLiked ? '#ef4444' : '#475569'} 
            />
                      <Text style={[styles.singleActionText, isLiked && styles.singleActionTextActive]}>
              Like{likesCount > 0 ? ` (${likesCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.singleActionItem} 
            onPress={handleComment} 
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#475569" />
            <Text style={styles.singleActionText}>Comment{commentsCount > 0 ? ` (${commentsCount})` : ''}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.singleActionItem} 
            onPress={handleShare} 
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-redo-outline" size={16} color="#475569" />
            <Text style={styles.singleActionText}>Share{sharesCount > 0 ? ` (${sharesCount})` : ''}</Text>
          </TouchableOpacity>

        
        </View>

          {!isAdStory && !showComments && (previewComments.length > 0 || commentsCount > 0) ? (
          <View style={styles.commentPreviewWrap}>
            {commentsCount > 0 ? (
              <TouchableOpacity onPress={handleComment} activeOpacity={0.8}>
                <Text style={styles.commentPreviewViewAll}>View all {commentsCount} comments</Text>
              </TouchableOpacity>
            ) : null}
            {previewComments.map((c) => (
              <View key={c.id} style={styles.commentPreviewRow}>
                {c.avatar ? (
                  <Image source={{ uri: c.avatar }} style={styles.commentPreviewAvatar} />
                ) : (
                  <View style={[styles.commentPreviewAvatar, styles.commentPreviewAvatarFallback]}>
                    <Text style={styles.commentPreviewAvatarText}>{String(c.author || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.commentPreviewText} numberOfLines={2}>
                  <Text style={styles.commentPreviewAuthor}>{c.author} </Text>{c.text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── More Menu ── */}
        <Modal visible={showActionMenu} transparent animationType={menuAnchor ? 'none' : 'fade'} statusBarTranslucent onRequestClose={closeActionMenu}>
          <TouchableWithoutFeedback onPress={closeActionMenu}>
            <View style={menuAnchor ? styles.storyMoreMenuBackdropWeb : styles.storyMoreMenuBackdrop}>
              <TouchableWithoutFeedback>
                <View style={menuAnchor ? [styles.storyMoreMenu, { position: 'absolute', top: menuAnchor.top, left: menuAnchor.left }] : styles.storyMoreMenuSheet}>
                  {!menuAnchor ? <View style={styles.storyMoreMenuHandle} /> : null}
                  <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleReport} activeOpacity={0.82}>
                    <Ionicons name="flag-outline" size={18} color="#ef4444" />
                    <Text style={styles.storyMoreMenuText}>Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleCopyLink} activeOpacity={0.82}>
                    <Ionicons name="link-outline" size={18} color="#0f172a" />
                    <Text style={styles.storyMoreMenuText}>Copy link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleMenuShare} activeOpacity={0.82}>
                    <Ionicons name="share-social-outline" size={18} color="#0ea5e9" />
                    <Text style={styles.storyMoreMenuText}>Share</Text>
                  </TouchableOpacity>
                  {hasFollowTarget && !isOwnStory && !isAdStory ? (
                    <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleBlockAuthor} activeOpacity={0.82}>
                      <Ionicons name="ban-outline" size={18} color="#ef4444" />
                      <Text style={styles.storyMoreMenuText}>Block</Text>
                    </TouchableOpacity>
                  ) : null}
                  {!menuAnchor ? (
                    <TouchableOpacity style={[styles.storyMoreMenuItem, { borderBottomWidth: 0, justifyContent: 'center' }]} onPress={closeActionMenu} activeOpacity={0.82}>
                      <Text style={[styles.storyMoreMenuText, { color: '#64748b' }]}>Cancel</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ── Comment Section ── */}
        {showComments ? (
          <View style={styles.commentSection}>
            <View style={styles.commentInputRow}>
              <ProfileAvatar uri={userAvatar} size={32} style={styles.commentUserAvatar} />
              <TextInput
                ref={inputRef}
                style={styles.commentInput}
                placeholder={commonCopy?.writeComment || 'Comment likhein...'}
                placeholderTextColor="#94a3b8"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={300}
                returnKeyType="send"
                blurOnSubmit={true}
              onSubmitEditing={handleSubmitComment}
                onFocus={() => { if (!isLoggedIn) { inputRef.current?.blur?.(); goToLogin(); } }}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, !commentText.trim() && styles.commentSendBtnDisabled]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={16} color={commentText.trim() ? '#ffffff' : '#94a3b8'} />
              </TouchableOpacity>
            </View>
            {localComments.length > 0 && (
              <View style={styles.commentsList}>
                {localComments.map((item) => (
                  <CommentItem
                    key={item.id}
                    comment={item}
                    currentUserEmail={currentEmail}
                  currentUserId={currentUserId}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    onReply={handleReplyComment}
                    onLike={handleLikeComment}
                    expandedReplyThreads={expandedReplyThreads}
                    onToggleReplies={handleToggleReplies}
                    repliesMeta={repliesMeta}
                    onLoadMoreReplies={handleLoadMoreReplies}
                    editingCommentId={editingCommentId}
                    editingCommentText={editingCommentText}
                    onEditingTextChange={setEditingCommentText}
                    onSubmitEdit={handleSubmitEdit}
                    onCancelEdit={handleCancelEdit}
                    replyingToCommentId={replyingToCommentId}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onSubmitReply={handleSubmitReply}
                    onCancelReply={handleCancelReply}
                  />
                ))}
                {commentsHasMore ? (
                  <TouchableOpacity onPress={() => loadComments()} disabled={commentsLoading} activeOpacity={0.8} style={styles.commentLoadMoreBtn}>
                    {commentsLoading
                      ? <ActivityIndicator size="small" color="#f97316" />
                      : <Text style={styles.commentLoadMoreText}>Aur comments dekhein</Text>}
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        {/* ── Politics Block ── */}
        <NewsSectionBlock
          title="Politics"
          items={politicsItems}
          onPress={openNewsDetails}
          onLike={handleLike}
          onOpenComments={handleComment}
          onShare={handleShare}
          currentUserEmail={currentEmail}
        />

        {/* ── Sports Block ── */}
        <NewsSectionBlock
          title="Sports"
          items={sportsItems}
          onPress={openNewsDetails}
          onLike={handleLike}
          onOpenComments={handleComment}
          onShare={handleShare}
          currentUserEmail={currentEmail}
        />

      </View>

      {/* ── Thin separator between cards ── */}
      <View style={[styles.cardSeparator, Platform.OS !== 'web' && styles.androidCardSeparator]} />
    </KeyboardAvoidingView>
  );
}