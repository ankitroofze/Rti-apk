// components/NewsFeedCard.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Platform, Share, TextInput, KeyboardAvoidingView, Alert, Clipboard, ScrollView, Linking
} from 'react-native';
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
  comment,
  currentUserEmail,
  onEdit,
  onDelete,
  onReply,
  onLike,
  expandedReplyThreads,
  onToggleReplies,
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
  const isCurrentUser = currentUserEmail && String(comment.author_email || '').trim().toLowerCase() === currentUserEmail;
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToCommentId === comment.id;
  const isLiked = Array.isArray(comment.liked_by) && currentUserEmail && comment.liked_by.includes(currentUserEmail);
  const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
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
            <Text style={styles.commentAuthor}>{comment.author}</Text>
            <Text style={styles.commentText}>{comment.text}</Text>
            <Text style={styles.commentTime}>{comment.time}</Text>
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
              maxLength={300}
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
                    currentUserEmail={currentUserEmail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                    onLike={onLike}
                    expandedReplyThreads={expandedReplyThreads}
                    onToggleReplies={onToggleReplies}
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
const EXCERPT_LINE_LIMIT = 3;

function InlineReadMore({ text, style }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const safeText = String(text || '').trim();
  const shouldShowToggle = isTruncated || safeText.length > 180;

  useEffect(() => {
    setExpanded(false);
    setIsTruncated(false);
  }, [safeText]);

  if (!safeText) return null;

  return (
    <View style={styles.inlineReadMoreWrap}>
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
}) {
  const { isLoggedIn } = useAuth();
  const isScreenFocused = useIsFocused();
  const cardRef = useRef(null);
  const likeInFlightRef = useRef(false);
  const lastOwnLikeActionAtRef = useRef(0); // ✅ user ke apne like/unlike ka timestamp — stale poll se overwrite rokne ke liye
  const isCardVisible = useCardVisibility(cardRef, 0.3);

  const [currentEmail, setCurrentEmail] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(story.likes || 0));
  const [commentsCount, setCommentsCount] = useState(Number(story.comments || 0));
  const [sharesCount, setSharesCount] = useState(Number(story.shares || 0));
  const [viewsCount] = useState(Number(story.views || 0));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const inputRef = useRef(null);
  const storyAuthorEmail = String(story.createdBy || story.created_by || story.author_email || '').trim().toLowerCase();
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

  const handleToggleReplies = useCallback((commentId) => {
    setExpandedReplyThreads((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await UserStore.getCurrentUser();
        if (!alive) return;
        setCurrentEmail(String(user?.email || '').trim().toLowerCase());
      } catch {
        if (!alive) return;
        setCurrentEmail('');
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
      const serverLiked = Boolean(Array.isArray(story.liked_by) && story.liked_by.includes(currentEmail));
      const likedIds = await getLikedIds(currentEmail);
      const localLiked = Boolean(likedIds[story.id]);
      if (!alive) return;
      setIsLiked(serverLiked || localLiked);
    })();
    return () => { alive = false; };
  }, [currentEmail, story.id, story.liked_by]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!storyAuthorEmail || !currentEmail || storyAuthorEmail === currentEmail) {
        if (alive) setIsFollowingAuthor(false);
        return;
      }
      const summary = await UserStore.getFollowSummary?.(storyAuthorEmail);
      if (!alive) return;
      setIsFollowingAuthor(Boolean(summary?.isFollowing));
    })();
    return () => { alive = false; };
  }, [currentEmail, storyAuthorEmail]);

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

  const handleVideoPress = () => {
    if (videoPaused) { setVideoPaused(false); setShowVideoPoster(false); }
    else { setVideoPaused(true); }
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

  const requireLogin = useCallback(() => {
    if (isLoggedIn && currentEmail) return true;
    showLoginRequired();
    return false;
  }, [currentEmail, isLoggedIn, showLoginRequired]);

  const handleLike = async () => {
    if (!requireLogin()) return;
    if (likeInFlightRef.current) return; // ✅ ek user ek time me sirf ek like/unlike request — rapid taps ignore honge
    likeInFlightRef.current = true;

    const prev = isLiked;
    const newLiked = !prev;
    setIsLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    lastOwnLikeActionAtRef.current = Date.now(); // ✅ 15 sec ke liye stale poll resync ko block karo

    try {
      const user = await UserStore.ensureUserId();
      const userId = user?.id || user?.user_id;
      if (!userId) throw new Error('No user id');

      const result = prev
        ? await AuthAPI.unlikeNews(story.id)
        : await AuthAPI.likeNews({
            userId,
            newsId: isAdStory ? null : story.id,
            adsId: isAdStory ? story.id : null,
          });

    if (!result?.ok) {
        setIsLiked(prev);
        setLikesCount((c) => c + (prev ? 1 : -1));
        lastOwnLikeActionAtRef.current = 0; // ✅ fail ho gaya, ab poll ko turant sahi state resync karne do
        if (result?.isAuth) showLoginRequired();
        return;
      }

      const finalLiked = prev ? false : result.liked;
      setIsLiked(finalLiked);
      await setLikedId(currentEmail, story.id, finalLiked);
      // ✅ ROOT-FIX: engagement store (jisse story.liked_by/poll banta hai) ko bhi
      // sync karo — warna feed-card ka apna local flag alag rehta tha aur agla
      // poll aane par "auto unlike" ho jaata tha, chahe backend me like save ho chuka ho.
      await UserStore.syncLocalLikeEngagement(story.id, finalLiked);
    } catch {
      setIsLiked(prev);
      setLikesCount((c) => c + (prev ? 1 : -1));
      lastOwnLikeActionAtRef.current = 0; // ✅ fail ho gaya, ab poll ko turant sahi state resync karne do
    } finally {
      likeInFlightRef.current = false; // ✅ ab agla tap accept hoga
    }
  };

  const handleComment = async () => {
    if (!requireLogin()) return;
    setShowComments((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setEditingCommentId(null);
        setEditingCommentText('');
        setReplyingToCommentId(null);
        setReplyText('');
        setExpandedReplyThreads({});
      }
      return next;
    });
    if (!showComments) {
      try {
        const summary = await UserStore.getNewsFeedSummary({ focusItemId: story.id });
        const item = Array.isArray(summary?.items) ? summary.items.find((it) => it.id === story.id) : null;
        const rawComments = Array.isArray(item?.comments_list) ? item.comments_list : [];
        const formattedComments = rawComments.map((c) => ({
          id: String(c.id || ''),
          text: String(c.text || ''),
          author: String(c.author || 'User'),
          authorInitial: String(c.author || 'U').charAt(0).toUpperCase(),
          authorAvatar: '',
          author_email: String(c.author_email || ''),
          time: c.date || '',
          edited_at: c.edited_at || null,
          likes: Number(c.likes || 0),
          liked_by: Array.isArray(c.liked_by) ? c.liked_by : [],
          replies: Array.isArray(c.replies) ? c.replies.map((r) => ({
            id: String(r.id || ''),
            text: String(r.text || ''),
            author: String(r.author || 'User'),
            authorInitial: String(r.author || 'U').charAt(0).toUpperCase(),
            authorAvatar: '',
            author_email: String(r.author_email || ''),
            time: r.date || '',
            edited_at: r.edited_at || null,
            likes: Number(r.likes || 0),
            liked_by: Array.isArray(r.liked_by) ? r.liked_by : [],
          })) : [],
        }));
        setLocalComments(formattedComments);
        setExpandedReplyThreads({});
        setCommentsCount(Number(item?.comments || commentsCount || 0));
      } catch {}
    }
  };

  const handleSubmitComment = async () => {
    if (!requireLogin()) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;
    try {
      const result = await UserStore.addNewsComment(story.id, trimmed, { isAd: isAdStory });
      if (!result?.ok) return;
      const added = result.comment || {};
      const newComment = {
        id: String(added.id || Date.now().toString()),
        text: String(added.text || trimmed),
        author: String(added.author || userName),
        authorInitial: String(added.author || userName).charAt(0).toUpperCase(),
        authorAvatar: userAvatar,
        author_email: currentEmail,
        time: added.date || 'Now',
        edited_at: null,
        likes: 0,
        liked_by: [],
        replies: [],
      };
      setLocalComments((prev) => [newComment, ...prev]);
      setCommentsCount((c) => c + 1);
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
      if (!result?.ok) return;
      setLocalComments((prev) =>
        prev.map((comment) => {
          if (comment.id === editingCommentId) return { ...comment, text: trimmed };
          if (Array.isArray(comment.replies)) {
            return { ...comment, replies: comment.replies.map((r) => r.id === editingCommentId ? { ...r, text: trimmed } : r) };
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
      if (!result?.ok) return;
      setLocalComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return null;
          if (Array.isArray(c.replies)) return { ...c, replies: c.replies.filter((r) => r.id !== commentId) };
          return c;
        }).filter(Boolean)
      );
      setCommentsCount((c) => Math.max(0, c - 1));
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
    }
  }, [findParentCommentId, localComments, replyingToCommentId, requireLogin]);

  const handleSubmitReply = async () => {
    if (!requireLogin()) return;
    const trimmed = replyText.trim();
    if (!trimmed || !replyingToCommentId) return;
    try {
      const result = await UserStore.replyNewsComment(story.id, replyingToCommentId, trimmed, { isAd: isAdStory });
      if (!result?.ok) return;
      const added = result.comment || {};
      const newReply = {
        id: String(added.id || Date.now().toString()),
        text: String(added.text || trimmed),
        author: String(added.author || userName),
        authorInitial: String(added.author || userName).charAt(0).toUpperCase(),
        authorAvatar: userAvatar,
        author_email: currentEmail,
        time: added.date || 'Now',
        edited_at: null,
        likes: 0,
        liked_by: [],
      };
      const parentCommentId = findParentCommentId(localComments, replyingToCommentId);
      setLocalComments((prev) =>
        prev.map((c) => {
          if (c.id === replyingToCommentId || c.id === parentCommentId) {
            return { ...c, replies: Array.isArray(c.replies) ? [newReply, ...c.replies] : [newReply] };
          }
          return c;
        })
      );
      if (parentCommentId || replyingToCommentId) {
        setExpandedReplyThreads((prev) => ({ ...prev, [parentCommentId || replyingToCommentId]: true }));
      }
      setCommentsCount((c) => c + 1);
      setReplyingToCommentId(null);
      setReplyText('');
    } catch {}
  };

  const handleCancelReply = () => { setReplyingToCommentId(null); setReplyText(''); };

  const handleLikeComment = async (commentId) => {
    if (!requireLogin()) return;
    try {
      const result = await UserStore.likeNewsComment(story.id, commentId);
      if (!result?.ok) return;
      setLocalComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const wasLiked = Array.isArray(c.liked_by) && currentEmail && c.liked_by.includes(currentEmail);
            return { ...c, likes: Math.max(0, (c.likes || 0) + (wasLiked ? -1 : 1)), liked_by: wasLiked ? c.liked_by.filter((e) => e !== currentEmail) : [...(c.liked_by || []), currentEmail] };
          }
          if (Array.isArray(c.replies)) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id === commentId) {
                  const wasLiked = Array.isArray(r.liked_by) && currentEmail && r.liked_by.includes(currentEmail);
                  return { ...r, likes: Math.max(0, (r.likes || 0) + (wasLiked ? -1 : 1)), liked_by: wasLiked ? r.liked_by.filter((e) => e !== currentEmail) : [...(r.liked_by || []), currentEmail] };
                }
                return r;
              }),
            };
          }
          return c;
        })
      );
    } catch {}
  };

  const handleShare = async () => {
    try {
      const shareMessage = `📰 ${story.title}\n\n${story.excerpt || ''}\n\n🔗 ${story.url || 'https://rtinews.in'}\n\nRTI News App se padhe`;
      const result = await Share.share(
        { title: story.title, message: shareMessage, url: story.url || 'https://rtinews.in' },
        { subject: story.title, dialogTitle: 'Share karo' }
      );
      if (result.action === Share.sharedAction) {
        setSharesCount((c) => c + 1);
        try { await UserStore.updateNewsFeedItem(story.id, 'share'); } catch {}
      }
    } catch {}
  };

  const closeActionMenu = () => setShowActionMenu(false);
  const showActionResult = (title, message) => { try { Alert.alert(title, message); } catch {} };

  const handleReport = async () => {
    closeActionMenu();
    await UserStore.recordNewsFeedMenuAction(story.id, 'report', { title: story.title || '', reason: 'Reported from news feed menu' });
    showActionResult('Report submitted', 'Thanks. This post has been reported for review.');
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
    if (followLoading) return;
    if (!currentEmail) { showActionResult('Login required', 'Please login to follow this user.'); return; }
    if (!storyAuthorEmail || storyAuthorEmail === currentEmail) return;

    const nextFollowing = !isFollowingAuthor;
    setFollowLoading(true);
    setIsFollowingAuthor(nextFollowing);
    try {
      const result = nextFollowing
        ? await UserStore.followUser(storyAuthorEmail)
        : await UserStore.unfollowUser(storyAuthorEmail);
      if (result?.ok === false) {
        setIsFollowingAuthor(!nextFollowing);
        showActionResult('Follow', result?.message || 'Unable to update follow status.');
        return;
      }
      const summary = await UserStore.getFollowSummary?.(storyAuthorEmail);
      setIsFollowingAuthor(Boolean(summary?.isFollowing ?? nextFollowing));
    } catch {
      setIsFollowingAuthor(!nextFollowing);
      showActionResult('Follow', 'Unable to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const showPosterOverlay = videoPaused && showVideoPoster;
  const posterReady = videoThumbnail !== null;
  const stillCapturing = thumbnailCapturing && !posterReady;
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();
  const currentUserHasBlueTick = Boolean(currentUser && UserStore.hasBlueTick(currentUser));
  const authorHasBlueTick = Boolean(
    story.author_has_blue_tick || story.authorHasBlueTick || story.createdByBlueTick ||
    story.has_blue_tick ||
    (storyAuthorEmail && currentUserEmail === storyAuthorEmail && currentUserHasBlueTick)
  );

  const seatLabel = getLocalizedSeatLabel(story.author_seat_name, commonCopy);
  const authorAvatarUri = isValidImageUrl(story.author_profile_image) ? story.author_profile_image : '';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View ref={cardRef} style={styles.storyCardShell}>

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
          <ProfileAvatar uri={authorAvatarUri} size={44} style={styles.storyAuthorAvatar} />
          
          <View style={styles.storyAuthorTextWrap}>
            <View style={styles.storyAuthorNameRow}>
              <Text style={styles.storyAuthorName} numberOfLines={1}>{story.author_name || 'Unknown'}</Text>
              {authorHasBlueTick ? <VerifiedBadge size={18} iconSize={11} /> : null}
            </View>
            
            {seatLabel ? (
              <View style={styles.storyReporterPill}>
                <Ionicons name="star" size={10} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={styles.storyReporterPillText} numberOfLines={1}>{seatLabel}</Text>
              </View>
            ) : null}
            
            <View style={styles.storyAuthorMetaRow}>
              {story.state ? (
                <View style={styles.storyMetaPill}>
                  <Ionicons name="location-outline" size={12} color="#94a3b8" />
                  <TouchableOpacity onPress={() => onOpenLocation(story.state)} activeOpacity={0.82}>
                    <Text style={styles.storyMetaSmall}>
                      {story.district ? `${story.district}, ${story.state}` : story.state}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={styles.storyMetaPill}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={styles.storyMetaSmall}>{story.publishedAgo || story.date || 'Just now'}</Text>
              </View>
            </View>
          </View>

          {/* ── Follow Button ── */}
          {storyAuthorEmail && storyAuthorEmail !== currentEmail ? (
            <TouchableOpacity
              style={[
                styles.storyFollowBtn,
                isFollowingAuthor && styles.storyFollowBtnActive,
                followLoading && styles.storyFollowBtnDisabled,
              ]}
              onPress={handleToggleFollowAuthor}
              activeOpacity={0.84}
              disabled={followLoading}
            >
              <Ionicons 
                name={isFollowingAuthor ? 'person' : 'person-add-outline'} 
                size={14} 
                color={isFollowingAuthor ? '#f97316' : '#ffffff'} 
              />
              <Text style={[
                styles.storyFollowBtnText,
                isFollowingAuthor && styles.storyFollowBtnTextActive,
              ]}>
                {followLoading ? '...' : isFollowingAuthor ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Social Share Buttons (WhatsApp + Facebook with gap) ── */}
          <View style={styles.storySocialShareRow}>
            <TouchableOpacity
              style={[styles.storyShareCircle, { backgroundColor: '#25D366' }]}
              onPress={(e) => { e.stopPropagation?.(); handleShare(); }}
              activeOpacity={0.82}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.storyShareCircle, { backgroundColor: '#1877F2' }]}
              onPress={(e) => { e.stopPropagation?.(); handleShare(); }}
              activeOpacity={0.82}
            >
              <Ionicons name="logo-facebook" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── More Button ── */}
          <TouchableOpacity
            style={[styles.storyMoreBtnTop, showActionMenu && styles.storyMoreBtnTopActive]}
            onPress={(e) => { e.stopPropagation?.(); setShowActionMenu((v) => !v); }}
            activeOpacity={0.82}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ── Headline + Excerpt ── */}
        <View style={styles.storyContentWrap}>
          <TouchableOpacity onPress={() => { if (!handleAdPress()) onOpenDetails(story); }} activeOpacity={0.88}>
            <Text style={styles.storyHeadlineText}>{story.title}</Text>
            {story.subtitle ? <Text style={styles.storySubtitleText} numberOfLines={2}>{story.subtitle}</Text> : null}
          </TouchableOpacity>
          {story.excerpt ? <InlineReadMore text={story.excerpt} style={styles.storyExcerptText} /> : null}
          {story.description && story.description !== story.excerpt ? <InlineReadMore text={story.description} style={styles.storyDescriptionText} /> : null}
        </View>

        {/* ── Hero Image / Video ── */}
     <TouchableOpacity style={styles.storyHeroImageWrap} onPress={canPlayVideo ? handleVideoPress : (isFileAttachment ? handleFileOpen : handleImagePress)} activeOpacity={0.95}>
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
                  <View style={styles.storyVideoPlayBadge}><Ionicons name="play" size={24} color="#0f172a" /></View>
                </View>
              )}
              {!videoPaused && (
                <View style={styles.videoPlayingIndicator}><Ionicons name="pause" size={18} color="#ffffff" /></View>
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
          ) : (
            <Image source={{ uri: safeImage }} style={styles.storyHeroImage} resizeMode="cover" />
          )}
          {story.isFeatured ? (
            <View style={styles.topStoryRibbon}>
              <Text style={styles.topStoryRibbonText}>TOP STORY</Text>
            </View>
          ) : null}
          <TouchableOpacity style={[styles.storyCategoryChip, { backgroundColor: `${categoryColor}CC` }]} onPress={() => isAdStory ? handleAdPress() : onOpenCategory(story)} activeOpacity={0.84}>
            <Text style={styles.storyCategoryChipText}>{isAdStory ? 'Sponsored' : getLocalizedCategoryLabel(story.category, commonCopy)}</Text>
          </TouchableOpacity>

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
        </TouchableOpacity>

        {/* ── Shuru-style Info Row: Likes + Views (left) · Shares + View Post (right) ── */}
        <View style={styles.storyStatsRow}>
          <View style={styles.storyStatsLeft}>
            <View style={styles.storyStatPill}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={14} color={isLiked ? '#ef4444' : '#262626'} />
              <Text style={styles.storyStatText}>{likesCount}</Text>
              <Text style={styles.storyStatLabel}>Likes</Text>
            </View>
            <View style={styles.storyStatPill}>
              <Ionicons name="eye-outline" size={14} color="#262626" />
              <Text style={styles.storyStatText}>{viewsCount}</Text>
              <Text style={styles.storyStatLabel}>Views</Text>
            </View>
          </View>
          <View style={styles.storyStatsRight}>
            {sharesCount > 0 ? (
              <View style={styles.storyStatPill}>
                <Ionicons name="arrow-redo-outline" size={14} color="#262626" />
                <Text style={styles.storyStatText}>{sharesCount}</Text>
                <Text style={styles.storyStatLabel}>Shares</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.storyViewPostBtn}
              onPress={() => { if (!handleAdPress()) onOpenDetails(story); }}
              activeOpacity={0.82}
            >
              <Text style={styles.storyViewPostText}>View Post</Text>
              <Ionicons name="open-outline" size={13} color="#262626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Like / Comment / Share — Shuru-style bordered pill buttons ── */}
        <View style={styles.singleActionRow}>
          <TouchableOpacity 
            style={[styles.singleActionItem, isLiked && styles.singleActionItemActive]} 
            onPress={handleLike} 
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'} 
              size={16} 
              color={isLiked ? '#ef4444' : '#475569'} 
            />
            <Text style={[styles.singleActionText, isLiked && styles.singleActionTextActive]}>
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.singleActionItem} 
            onPress={handleComment} 
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#475569" />
            <Text style={styles.singleActionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.singleActionItem} 
            onPress={handleShare} 
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-redo-outline" size={16} color="#475569" />
            <Text style={styles.singleActionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.singleActionBookmark}
            onPress={() => { if (!handleAdPress()) onOpenDetails(story); }}
            activeOpacity={0.8}
          >
            <Ionicons name="bookmark-outline" size={17} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* ── More Menu ── */}
        {showActionMenu ? (
          <View style={styles.storyMoreMenuWrapper}>
            <View style={styles.storyMoreMenu}>
              <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleReport} activeOpacity={0.82}>
                <Ionicons name="flag-outline" size={18} color="#ef4444" />
                <Text style={styles.storyMoreMenuText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleCopyLink} activeOpacity={0.82}>
                <Ionicons name="link-outline" size={18} color="#0f172a" />
                <Text style={styles.storyMoreMenuText}>Copy link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.storyMoreMenuItem, { borderBottomWidth: 0 }]} onPress={handleMenuShare} activeOpacity={0.82}>
                <Ionicons name="share-social-outline" size={18} color="#0ea5e9" />
                <Text style={styles.storyMoreMenuText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

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
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    onReply={handleReplyComment}
                    onLike={handleLikeComment}
                    expandedReplyThreads={expandedReplyThreads}
                    onToggleReplies={handleToggleReplies}
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
      <View style={styles.cardSeparator} />
    </KeyboardAvoidingView>
  );
}