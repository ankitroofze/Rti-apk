// components/NewsFeedCard.js
import NameWithTick from './NameWithTick';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Platform, Share, TextInput, KeyboardAvoidingView, Alert, Clipboard, ScrollView, Linking,
  Modal, TouchableWithoutFeedback, ActivityIndicator, useWindowDimensions,
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
import { safePause, safePlay, safeSetMuted } from '../utils/videoPlayerSafe';
import { subscribeUserScroll } from '../utils/feedScrollBus';
import { getEngagement, publishEngagement, subscribeEngagement } from '../utils/newsEngagementStore';
import { useGlobalMuted, getGlobalMuted, setGlobalMuted } from '../utils/Globalmutestore';
import PostGridThumb from './PostGridThumb';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { useAuth } from '../contexts/AuthContext';
import { getAdRedirectMeta, openAdRedirect } from '../utils/adRedirect';
import styles from './NewsFeedCardStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfileTier, resolveRoleTitle, cleanRoleNames } from '../utils/profileHelpers';
import MediaGallery from './MediaGallery';
import { MediaLogo } from './MediaBrandOverlay';
import NewsFrameOverlay, { getFrameBoxAspect, getFrameWindow, getLowerBannerHeight } from './NewsFrameOverlay';
import NewsVideoControls from './NewsVideoControls';
import { getFrameTemplate } from '../constants/frameTemplates';
import { captureRef } from 'react-native-view-shot';
import ShareBrandFrame from './ShareBrandFrame';
import { useLanguage } from '../contexts/LanguageContext';
import { shareNewsLink, shareImageFile, shareVideoFile, getMyReferralCode } from '../utils/shareNews';

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
              autoFocus={Platform.OS !== 'web'}
              ref={(node) => { if (node && Platform.OS === 'web' && !node.__replyFocused) { node.__replyFocused = true; try { node.focus({ preventScroll: true }); } catch (_) {} } }}
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
  // Android se upload hue video ke URL me extension na ho ya alag ho (.3gp, bina extension) to bhi web par
  // chalna chahiye. Ye function sirf video items ke liye bulaya jaata hai, isliye sirf saaf-saaf image/pdf URL reject karo.
  return /^https?:/i.test(uri) && !/\.(jpe?g|png|gif|webp|bmp|svg|heic|avif|pdf)(\?.*)?(#.*)?$/i.test(uri);
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

// Video chal raha ho aur user scroll kare => pause. SIRF asli scroll par (position sach me badli ho);
// bina scroll kiye video kabhi pause nahi hota.
function usePauseOnScroll(cardRef, active, onScroll) {
  const cbRef = useRef(onScroll);
  cbRef.current = onScroll;
  useEffect(() => {
    if (!active) return undefined;
    return subscribeUserScroll(() => cardRef?.current, () => cbRef.current?.());
  }, [cardRef, active]);
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
// VideoPopupModal — news video ko popup (modal) me bada karke dikhata hai
// (detail page par jaye bina). Sirf tabhi mount hota hai jab open ho,
// isliye har card ka extra player nahi banta.
// ─────────────────────────────────────────────
function VideoPopupModal({ uri, title, onClose }) {
  const { width, height } = useWindowDimensions();
  const player = useVideoPlayer({ uri }, (p) => { p.loop = false; });

  useEffect(() => {
    if (!player) return undefined;
    try { player.muted = getGlobalMuted(); player.volume = 1; } catch (_) {}
    // Popup ke native controls se mute/unmute karo to global state bhi badal do
    let sub;
    try {
      sub = player.addListener?.('volumeChange', (e) => {
        if (typeof e?.isMuted === 'boolean') setGlobalMuted(e.isMuted);
      });
    } catch (_) { /* purana expo-video: event nahi */ }
    safePlay(player);
    return () => { try { sub?.remove?.(); } catch (_) {} safePause(player); };
  }, [player]);

  const boxW = Math.min(width - 24, 920);
  const boxH = Math.max(180, Math.min(Math.round(boxW * 9 / 16), Math.round(height * 0.7)));

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View style={{ width: boxW, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#111' }}>
            <Text numberOfLines={2} style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' }}>{title || 'Video'}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginLeft: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <VideoView
            player={player}
            style={{ width: boxW, height: boxH, backgroundColor: '#000' }}
            contentFit="contain"
            nativeControls
            fullscreenOptions={{ enabled: true }}
            playsInline
          />
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// TrendingCard Component
// ─────────────────────────────────────────────
function TrendingCard({ item, onPress, onLike, onOpenComments, onShare, currentUserEmail }) {
  const liked = currentUserEmail && Array.isArray(item.liked_by) && item.liked_by.includes(currentUserEmail);
  // video wali news me `image` sirf random placeholder hota hai — isliye video ka asli frame dikhao
  const trendVideoUri = String(typeof item.video === 'string' ? item.video : item.video?.uri || '').trim();
  const isVideoItem = item.mediaType === 'Video' && Boolean(trendVideoUri);
  return (
    <TouchableOpacity style={styles.trndCard} onPress={() => onPress(item)} activeOpacity={0.85}>
      {isVideoItem ? (
        <View style={[styles.trndCardImg, { overflow: 'hidden' }]}>
          <PostGridThumb videoUri={trendVideoUri} />
          <View pointerEvents="none" style={{ position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="play" size={11} color="#fff" />
          </View>
        </View>
      ) : (
        <Image
          source={{ uri: item.images?.length ? item.images[0] : (item.image || item.thumbnail || undefined) }}
          style={styles.trndCardImg}
          resizeMode="cover"
        />
      )}
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

const formatUploadTime = (value) => {
  const date = new Date(value || 0);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

// Is session me jin news ka view record ho chuka hai (dobara API hit nahi hoga)
const viewedNewsIds = new Set();

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
  // Video wale hisse (hero) ka ref — scroll out check poore card par nahi, sirf video par hota hai
  const heroMeasureRef = useRef(null);
  const restartOnPlayRef = useRef(false); // scroll out se pause hua => agli baar shuru se play

 const [currentEmail, setCurrentEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  // ✅ Details page / dusre card se aaya taza like-comment-share-view (shared store) pehle liya jaata hai
  const engInit = getEngagement(story.id);
  const engId = useRef(`card-${Math.random().toString(36).slice(2)}`).current;
  const [isLiked, setIsLiked] = useState(engInit?.liked ?? Boolean(story.liked_by_me));
  const [likesCount, setLikesCount] = useState(engInit?.likes ?? Number(story.likes || 0));
  const [commentsCount, setCommentsCount] = useState(engInit?.comments ?? Number(story.comments || 0));
  const [sharesCount, setSharesCount] = useState(engInit?.shares ?? Number(story.shares || 0));
  const [viewsCount, setViewsCount] = useState(engInit?.views ?? Number(story.views || 0));
  const viewsStoryIdRef = useRef(story.id);
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
  const uploadTime = useMemo(
    () => formatUploadTime(story.createdAt || story.created_at || story.date),
    [story.createdAt, story.created_at, story.date]
  );

  useEffect(() => {
    const eng = getEngagement(story.id);   // taza shared count ho to wahi (stale props se upar)
    setLikesCount(eng?.likes ?? Number(story.likes || 0));
    setCommentsCount(eng?.comments ?? Number(story.comments || 0));
    setSharesCount(eng?.shares ?? Number(story.shares || 0));
    // ✅ views: server ka count aaye to wahi lo; lekin stale refresh se local (abhi badha hua) count neeche na gire
    const srvViews = Math.max(Number(story.views || 0), eng?.views ?? 0);
    if (viewsStoryIdRef.current !== story.id) {
      viewsStoryIdRef.current = story.id;
      setViewsCount(srvViews);
    } else {
      setViewsCount((prev) => Math.max(prev, srvViews));
    }
  }, [story.id, story.likes, story.comments, story.shares, story.views]);

  useEffect(() => {
    if (!isScreenFocused || !isCardVisible || isAdStory || !story.id) return undefined;
    // POST /counts {news_id} — per news session me sirf ek baar
    const key = String(story.id);
    if (viewedNewsIds.has(key)) return undefined;
    viewedNewsIds.add(key);
    let active = true;
    (async () => {
      try {
        const r = await UserStore.recordNewsView(story.id);
        if (!active || !r?.ok) return;
        // Response ka view_count seedha dikhao; na aaye to local +1
        setViewsCount((prev) => {
          const next = r.views != null ? Math.max(Number(r.views) || 0, prev) : prev + 1;
          publishEngagement(story.id, { views: next }, engId);
          return next;
        });
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [isScreenFocused, isCardVisible, isAdStory, story.id]);

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
      const engNow = getEngagement(story.id);
      if (engNow && engNow.liked !== undefined) { setIsLiked(engNow.liked); return; }   // details / dusre card ka taza like
     const serverLiked = story.liked_by_me !== undefined ? Boolean(story.liked_by_me) : Boolean(Array.isArray(story.liked_by) && story.liked_by.includes(currentEmail));
      // ✅ server false/missing bole tab bhi local saved like ko maano (refresh/page change ke baad red rahe)
      const localLiked = await getLikedIds(currentEmail);
      if (!alive) return;
      setIsLiked(serverLiked || Boolean(localLiked[story.id]));
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
    const eng = getEngagement(story.id);
    if (Date.now() - lastOwnLikeActionAtRef.current < 15000) {
      setCommentsCount(eng?.comments ?? Number(story.comments || 0));
      setSharesCount(eng?.shares ?? Number(story.shares || 0));
      return;
    }
    setLikesCount(eng?.likes ?? Number(story.likes || 0));
    setCommentsCount(eng?.comments ?? Number(story.comments || 0));
    setSharesCount(eng?.shares ?? Number(story.shares || 0));
  }, [story.comments, story.likes, story.shares]);

  // ✅ Details page (ya kahin aur) par like / comment / share / view badla => is card par turant
  useEffect(() => {
    if (story.id === undefined || story.id === null) return undefined;
    const myKey = String(story.id);
    return subscribeEngagement((id, entry, src) => {
      if (id !== myKey || src === engId) return;
      if (entry.liked !== undefined) { setIsLiked(entry.liked); lastOwnLikeActionAtRef.current = Date.now(); }
      if (entry.likes !== undefined) setLikesCount(entry.likes);
      if (entry.comments !== undefined) setCommentsCount(entry.comments);
      if (entry.shares !== undefined) setSharesCount(entry.shares);
      if (entry.views !== undefined) setViewsCount((prev) => Math.max(prev, entry.views));
    });
  }, [story.id, engId]);

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

  const videoUri = String(typeof story.video === 'string' ? story.video : story.video?.uri || '').trim();
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
  // ✅ Breaking-news red frame: sirf tab jab user ne news add karte time frame select kiya ho
  const framed = Boolean(story.useFrame) && !isAdStory && !isFileAttachment;
  // Kaunsa template (glossy / bar / banner) — backend `frame_template`; purani news => default template
  const frameTpl = getFrameTemplate(story.frameTemplate);
  const frameWin = getFrameWindow(frameTpl);
  const frameBoxH = mediaWidth ? Math.round(mediaWidth / getFrameBoxAspect(frameTpl)) : 0;
  const MediaBox = framed ? View : React.Fragment;
  const mediaBoxProps = framed
    ? {
        style: {
          position: 'absolute',
          left: `${frameWin.left * 100}%`,
          top: `${frameWin.top * 100}%`,
          width: `${frameWin.width * 100}%`,
          height: `${frameWin.height * 100}%`,
          overflow: 'hidden',
          borderRadius: 0,
        },
      }
    : {};
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
  const [videoEnded, setVideoEnded] = useState(false); // video poora dekh liya -> Replay button
  const [showVideoPoster, setShowVideoPoster] = useState(true);

  // ✅ SPEED: video player (aur uska download/buffering) ab tabhi banta hai jab user play dabaye.
  // Pehle feed ke har video card par turant player ban jata tha — 10 video = 10 players ek saath
  // network + memory kha rahe the, isliye images aur baaki feed slow load hoti thi.
  const [videoActivated, setVideoActivated] = useState(false);
  const [videoBuffering, setVideoBuffering] = useState(false);
  const player = useVideoPlayer(canPlayVideo && videoActivated ? { uri: effectiveVideoUri } : null, (p) => {
    p.loop = false;
    p.muted = getGlobalMuted();
  });

  // Global mute: feed me kisi bhi video par mute/unmute -> yahan bhi turant lagta hai
  const [globalMuted, , toggleGlobalMuted] = useGlobalMuted();
  useEffect(() => {
    if (!canPlayVideo || !player) return;
    safeSetMuted(player, globalMuted);
  }, [canPlayVideo, globalMuted, player]);

  useEffect(() => {
    if (!canPlayVideo) return;
    if (!isScreenFocused) {
      safePause(player);
      restartOnPlayRef.current = true;
      setVideoPaused(true);
      setShowVideoPoster(true);
    }
  }, [canPlayVideo, isScreenFocused, player]);

  // Scroll karte hi video pause (position wahi rehti hai, dobara play dabane par wahin se chalega)
  usePauseOnScroll(cardRef, canPlayVideo && !videoPaused, () => {
    safePause(player);
    setVideoPaused(true);
  });

  useEffect(() => {
    // sirf video URL badalne par reset (player naya banne par nahi — warna play turant ruk jata)
    setVideoPaused(true);
    setShowVideoPoster(true);
    setVideoActivated(false);
    setVideoBuffering(false);
    setVideoEnded(false);
  }, [canPlayVideo, effectiveVideoUri]);

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
    // Video khatam hone par: paused state + play button wapas. Kuch platforms par `playToEnd`
    // nahi aata, isliye `playingChange` se bhi end pakadte hain (playing band + time end ke paas).
    const onEnded = () => {
      setVideoEnded(true);   // Replay button dikhao
      setVideoPaused(true);
      setShowVideoPoster(false); // last frame dikhe, upar Replay button
    };
    const subEnd = player.addListener('playToEnd', onEnded);
    const subPlay = player.addListener('playingChange', (e) => {
      const playingNow = typeof e === 'object' ? e?.isPlaying : e;
      if (playingNow) return;
      try {
        const dur = Number(player.duration || 0);
        if (dur > 0 && Number(player.currentTime || 0) >= dur - 0.3) onEnded();
      } catch (_) {}
    });
    return () => {
      try { subEnd?.remove?.(); } catch (_) {}
      try { subPlay?.remove?.(); } catch (_) {}
    };
  }, [canPlayVideo, player]);

  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleVideoPress = () => {
    // Asli player state dekho (sirf React state par bharosa nahi) — taaki pause ke baad play hamesha chale
    let playingNow = false;
    try { playingNow = Boolean(player?.playing); } catch (_) { playingNow = !videoPaused; }
    if (!videoEnded && !videoPaused && playingNow) {
      safePause(player);
      setVideoPaused(true);
      return;
    }
    if (restartOnPlayRef.current) {
      // scroll out ke baad dobara play => shuru se
      restartOnPlayRef.current = false;
      setVideoEnded(false);
      try { if (player) player.currentTime = 0; } catch (_) { /* ignore */ }
    }
    if (videoEnded) {
      // ✅ REPLAY: video khatam ho chuka hai -> shuru se dobara chalao
      setVideoEnded(false);
      try {
        player.currentTime = 0;
      } catch (_) { /* ignore */ }
      try {
        if (typeof player?.replay === 'function') player.replay();
      } catch (_) { /* ignore */ }
    }
    if (!videoActivated) { setVideoActivated(true); setVideoBuffering(true); } // pehli baar: player ab banega
    setShowVideoPoster(false);
    setVideoPaused(false);
    safePlay(player); // state pehle se false ho tab bhi seedha play karo
  };

  // ── Video controls (prev / -5 / play / +15 / next / progress / time / fullscreen) ──
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef(null);
  const pausedRef = useRef(true);
  pausedRef.current = videoPaused;
  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    // paused me controls chhupte nahi; sirf chalte video me auto-hide
    if (!pausedRef.current) {
      controlsTimer.current = setTimeout(() => setControlsVisible(false), 3500);
    }
  }, []);
  useEffect(() => {
    // paused => controls hamesha dikhen; chalte time kuch second baad chhup jayen
    if (videoPaused) {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      setControlsVisible(true);
    } else {
      pokeControls();
    }
  }, [videoPaused, pokeControls]);
  useEffect(() => () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); }, []);

  const handleHeroVideoTap = () => {
    if (videoPaused) { handleVideoPress(); return; } // paused video par tap = play
    if (controlsVisible) {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      setControlsVisible(false);
    } else {
      pokeControls();
    }
  };

  const openVideoFullscreen = () => {
    safePause(player);
    setVideoPaused(true);
    setShowVideoModal(true);
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

  // ✅ FIX: ab like AUR unlike dono chalte hain (pehle "already liked" par return ho jata tha)
  const prevLiked = isLiked;
  const prevCount = likesCount;
  const nextLiked = !prevLiked;
  setIsLiked(nextLiked);
  setLikesCount(Math.max(0, prevCount + (nextLiked ? 1 : -1)));
  lastOwnLikeActionAtRef.current = Date.now();

  try {
    let result;
    const useUnlikeRoute = prevLiked && !isAdStory;   // news: explicit unlike (DELETE /likes/{id})
    if (useUnlikeRoute) {
      result = await AuthAPI.unlikeNews(story.id);
    } else {
      let adUserId = null;
      if (isAdStory) {
        const u = await UserStore.ensureUserId();
        adUserId = u?.id || u?.user_id || null;
      }
      // ✅ News ke liye user_id NAHI jaata
      result = await AuthAPI.likeNews({
        userId: adUserId,
        newsId: isAdStory ? null : story.id,
        adsId: isAdStory ? story.id : null,
      });
    }

    if (!result?.ok) {
      setIsLiked(prevLiked);                // exact rollback
      setLikesCount(prevCount);
      lastOwnLikeActionAtRef.current = 0;
      if (result?.isAuth) goToLogin();
      else Alert.alert(prevLiked ? 'Unlike' : 'Like', result?.message || 'Unable to update like. Please try again.');
      return;
    }

    // ✅ backend ka response final truth (unlike route par hamesha false)
    const finalLiked = useUnlikeRoute ? false : Boolean(result.liked);
    setIsLiked(finalLiked);
    setLikedId(currentEmail, story.id, finalLiked);   // ✅ phone me save / hatao (unlike par local entry delete)
    const finalCount = Number.isFinite(result.likesCount)
      ? result.likesCount
      : Math.max(0, prevCount + (finalLiked ? 1 : 0) - (prevLiked ? 1 : 0));
    setLikesCount(finalCount);
    publishEngagement(story.id, { liked: finalLiked, likes: finalCount }, engId);   // ✅ details page me bhi dikhe
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
      const nextComments = Number.isFinite(result.commentsCount) ? result.commentsCount : commentsCount + 1;
      setCommentsCount(nextComments);
      publishEngagement(story.id, { comments: nextComments }, engId);
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
        const nextComments = Number.isFinite(result.commentsCount) ? result.commentsCount : Math.max(0, commentsCount - 1);
        setCommentsCount(nextComments);
        publishEngagement(story.id, { comments: nextComments }, engId);
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

  const { language: appLanguage } = useLanguage();
  const shareFrameRef = useRef(null);
  const [shareJob, setShareJob] = useState(null); // { uri, refCode } => offscreen branded frame
  const hasShareVideo = Boolean(effectiveVideoUri) && !isAdStory;
  const hasShareImage = !hasShareVideo && isValidImageUrl(effectiveImageUri) && !isAdStory;

  const countShare = async () => {
    if (isAdStory) return;
    const res = await AuthAPI.shareNews(story.id);
    if (res?.ok) {
      const nextShares = Number.isFinite(res.shareCount) ? res.shareCount : sharesCount + 1;
      setSharesCount(nextShares);   // backend ka count
      publishEngagement(story.id, { shares: nextShares }, engId);
    } else if (res?.rateLimited) {
      Alert.alert('Share', 'Please try again later.');
    }
  };

  // Share button: News link + referral link, "title + app download line + link" pattern.
  // WhatsApp me link ka preview (image / video thumbnail + RTI Voice frame) backend OG tags se aata hai.
  const handleShare = async () => {
    try {
      const { result } = await shareNewsLink({ story, postLink, language: appLanguage });
      if (result.action === Share.sharedAction) await countShare();
    } catch {}
  };

  // Image news => branded IMAGE share, Video news => VIDEO share.
  const handleShareMedia = async () => {
    try {
      if (hasShareVideo) {
        await shareVideoFile(story.branded_video || story.brandedVideo || effectiveVideoUri);
        await countShare();
      } else if (hasShareImage) {
        const refCode = await getMyReferralCode();
        setShareJob({ uri: effectiveImageUri, refCode });   // frame render -> onImageLoad me capture
      } else {
        await handleShare();
      }
    } catch {
      Alert.alert('Share', 'Unable to share media. Please try again.');
    }
  };

  const onShareFrameLoaded = async () => {
    try {
      await new Promise((r) => setTimeout(r, 150));          // layout settle
      const out = await captureRef(shareFrameRef, { format: 'jpg', quality: 0.92, result: 'tmpfile', width: 1080, height: 1080 });
      await shareImageFile(out);
      await countShare();
    } catch {
      Alert.alert('Share', 'Unable to prepare branded image.');
    } finally {
      setShareJob(null);
    }
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
    if (!currentEmail) { showActionResult('Login required', 'Please login to follow this user.'); return; }
    if (!hasFollowTarget || isOwnStory) return;

    // ✅ FAST: button turant badal jaata hai (optimistic). API peeche chalti hai,
    // koi loading/disabled/toast nahi. Sirf fail hone par wapas purani state + error.
    // Fast double tap par har tap queue hota hai taaki final state hamesha sahi rahe.
    const nextFollowing = !isFollowingAuthor;
    setIsFollowingAuthor(nextFollowing);
    const prevChain = followActionInFlightRef.current || Promise.resolve();
    followActionInFlightRef.current = prevChain.then(async () => {
      try {
        const result = nextFollowing
          ? await UserStore.followUser(storyAuthorEmail, storyAuthorId)
          : await UserStore.unfollowUser(storyAuthorEmail, storyAuthorId);
        if (result?.ok === false) {
          setIsFollowingAuthor(!nextFollowing);
          showActionResult('Follow', result?.message || 'Unable to update follow status.');
        }
      } catch {
        setIsFollowingAuthor(!nextFollowing);
        showActionResult('Follow', 'Unable to update follow status.');
      }
    });
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
  // Backend (live profile) jo bole wahi final. Post me save purana flag sirf tab
  // use hoga jab live profile abhi load na hui ho.
  const isOwnStoryForTick = Boolean(storyAuthorEmail && currentUserEmail === storyAuthorEmail);
  const authorHasBlueTick = liveAuthorProfile
    ? Boolean(UserStore.hasBlueTick(liveAuthorProfile))
    : (isOwnStoryForTick
      ? currentUserHasBlueTick
      : Boolean(story.author_has_blue_tick));

  // Seat name (jaise "Car Nicobar") ab nahi dikhana. Uski jagah author ke
  // subscription plan ka role name dikhega.
  const authorPlanForRole = liveAuthorProfile?.subscription_plan || story.author_subscription_plan || null;
  // role_names backend se array YA string ("A, B") dono aa sakta hai -> hamesha array banao,
  // warna string par .filter() fatal render error deta tha.
  const _rawRoleNames = authorPlanForRole?.role_names;
  const _roleNamesList = Array.isArray(_rawRoleNames)
    ? _rawRoleNames
    : (typeof _rawRoleNames === 'string' && _rawRoleNames.trim() ? _rawRoleNames.split(',') : []);
  const planRoleNames = (_roleNamesList.length
    ? _roleNamesList
    : String(UserStore.getSeatRoleNameForPlanRoleId(authorPlanForRole?.role_id_raw || authorPlanForRole?.role_id || '') || '')
        .split(', ')
  ).map((n) => String(n || '').trim()).filter(Boolean);
  // Seat id ("district_head") se role ka naam banao -> "District Head".
  // Seat NAME ("Car Nicobar") use nahi karna, sirf seat ID se role ka naam.
  const authorSeatId = String(
    liveAuthorProfile?.state_seat?.seat_id || story.author_seat_id || story.author_state_seat?.seat_id || ''
  ).trim();
  // Backend kabhi role ki numeric id ("6") bhejta hai -> usse role naam banao, number kabhi mat dikhao.
  const _mapRoleId = (id) => { try { return UserStore.getSeatRoleNameForPlanRoleId?.(id) || ''; } catch { return ''; } };
  const seatLabel =
    resolveRoleTitle({ state_seat: { seat_id: authorSeatId }, subscription_plan: authorPlanForRole }, planRoleNames.join(', '), _mapRoleId) ||
    cleanRoleNames(String(authorPlanForRole?.plan_name || authorPlanForRole?.name || '').trim(), _mapRoleId) ||
    cleanRoleNames(String(liveAuthorProfile?.role_label || story.author_role_label || '').trim(), _mapRoleId);
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
        onPress: canPlayVideo ? handleHeroVideoTap : (isFileAttachment ? handleFileOpen : handleImagePress),
        activeOpacity: 0.95,
      };
  const authorAvatarUri = isValidImageUrl(story.author_profile_image) ? story.author_profile_image : '';
  // News location and an author's purchased-role area are different things.
  // Show the member's own current area here, falling back to the news location
  // only for older posts that do not carry author profile fields.
  const authorArea = String(
    liveAuthorProfile?.area || liveAuthorProfile?.state_seat?.area || liveAuthorProfile?.state_seat?.area_name ||
    story.author_area ||
    [
      liveAuthorProfile?.taluka || story.author_taluka,
      liveAuthorProfile?.district || story.author_district,
      liveAuthorProfile?.state || story.author_state,
    ].filter(Boolean).join(', ') ||
    [story.taluka, story.district, story.state].filter(Boolean).join(', ')
  ).trim();

  if (isBlockedNow) return null;

  return (
    <View>
      {shareJob && Platform.OS !== 'web' ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: -5000, top: 0 }}>
          <ShareBrandFrame
            ref={shareFrameRef}
            imageUri={shareJob.uri}
            title={story.title}
            refCode={shareJob.refCode}
            onImageLoad={onShareFrameLoaded}
            onImageError={() => { setShareJob(null); Alert.alert('Share', 'Image load failed.'); }}
          />
        </View>
      ) : null}
           <View ref={cardRef} collapsable={false} style={[styles.storyCardShell, Platform.OS !== 'web' && styles.androidStoryCardShell, altShade && styles.storyCardShellAlt]}>

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
                       {authorArea ? (
                <View style={[styles.storyMetaPill, { flexShrink: 1 }]}>
                  <Ionicons name="location-outline" size={12} color="#94a3b8" />
                  <TouchableOpacity style={{ flexShrink: 1 }} onPress={() => onOpenLocation(liveAuthorProfile?.state || story.author_state || story.state)} activeOpacity={0.82}>
                    <Text style={styles.storyMetaSmall} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                      {authorArea}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
                          {(() => {
                if (!uploadTime) return null;
                return (
                  <View style={[styles.storyMetaPill, { flexShrink: 0 }]}>
                    <Ionicons name="time-outline" size={12} color="#94a3b8" />
                    <Text style={styles.storyMetaSmall} numberOfLines={1} maxFontSizeMultiplier={1.1}>{uploadTime}</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* ── Follow Button ── */}
       {hasFollowTarget && !isOwnStory ? (
            <TouchableOpacity
              style={styles.storyFollowBtnWrap}
              onPress={handleToggleFollowAuthor}
              activeOpacity={0.84}
            >
              <View style={styles.storyFollowBtn}>
                <Ionicons
                  name={isFollowingAuthor ? 'person' : 'person-add-outline'}
                  size={14}
                  color="#dc2626"
                />
                <Text style={styles.storyFollowBtnText}>
                  {isFollowingAuthor ? 'Following' : 'Follow'}
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
         framed ? { height: frameBoxH || 200, backgroundColor: '#000', borderRadius: 8 } : null,
         // video poora dikhe (crop nahi): 16:9 frame + contain
         canPlayVideo && !framed && mediaWidth ? { height: Math.round(mediaWidth * 9 / 16), backgroundColor: '#000' } : null,
       ]}
       onLayout={(event) => {
         const w = Math.round(event.nativeEvent.layout.width);
         if (w && w !== mediaWidth) setMediaWidth(w);
       }}
       {...heroWrapProps}
     >
          <View ref={heroMeasureRef} collapsable={false} pointerEvents="none" style={StyleSheet.absoluteFill} />
          <MediaBox {...mediaBoxProps}>
          {canPlayVideo ? (
            <>
              {player ? (
                <VideoView player={player} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} contentFit="contain" nativeControls={false} fullscreenOptions={{ enabled: false }} playsInline onFirstFrameRender={() => { setShowVideoPoster(false); setVideoBuffering(false); }} />
              ) : null}
              {videoBuffering && !videoPaused ? (
                <View style={styles.videoLoadingOverlay} pointerEvents="none"><ActivityIndicator size="large" color="#ffffff" /></View>
              ) : null}
              {showPosterOverlay && (
                posterReady ? (
                  <Image source={{ uri: videoThumbnail }} style={StyleSheet.absoluteFill} resizeMode="contain" />
                ) : stillCapturing ? (
                  <View style={styles.videoLoadingOverlay}>
                    <View style={styles.videoLoadingBadge}><Text style={styles.videoLoadingText}>⏳</Text></View>
                  </View>
                ) : (
                  <View style={styles.videoLoadingOverlay} />
                )
              )}
              {/* Controls: ad player jaisa (prev / -5 / play / +15 / next + progress + time). Bada alag play button hata diya. */}
              <NewsVideoControls
                player={player}
                visible={controlsVisible}
                paused={videoPaused}
                ended={videoEnded}
                buffering={videoBuffering}
                bottomInset={framed ? getLowerBannerHeight(frameTpl, mediaWidth) : 0}
                onTogglePlay={handleVideoPress}
                onFullscreen={openVideoFullscreen}
                onInteract={pokeControls}
              />
              <TouchableOpacity
                style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
                onPress={(e) => { e?.stopPropagation?.(); toggleGlobalMuted(); }}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={globalMuted ? 'volume-mute' : 'volume-high'} size={18} color="#ffffff" />
              </TouchableOpacity>
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
              width={framed ? Math.round(mediaWidth * frameWin.width) : mediaWidth}
              maxHeight={framed ? Math.round(frameBoxH * frameWin.height) : 240}
              fit="cover"
              onPressImage={handleImagePress}
            />
          ) : (
            <Image source={{ uri: safeImage }} style={styles.storyHeroImage} resizeMode="cover" />
          )}
          </MediaBox>
          {/* ✅ Frame select hai => red frame + scrolling title/description; warna purana logo + ticker */}
          {framed ? (
            <NewsFrameOverlay
              width={mediaWidth}
              height={frameBoxH}
              title={story.title}
              description={story.description || story.excerpt || story.subtitle || ''}
              templateId={frameTpl.id}
            />
          ) : (
            <>
              <MediaLogo />
            </>
          )}
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

          {/* Video duration badge (1:29) hata diya */}
          {!canPlayVideo ? (
          <TouchableOpacity
            style={styles.storyExpandBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              if (handleAdPress()) return;
              // video news: detail page ki jagah popup me video kholo
              if (canPlayVideo) {
                safePause(player);
                setVideoPaused(true);
                setShowVideoModal(true);
                return;
              }
              onOpenDetails(story);
            }}
            activeOpacity={0.82}
          >
            <Ionicons name="expand-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
          ) : null}
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
          {!isAdStory ? (
            <View style={[styles.singleActionItem, styles.singleActionItemViews]} accessible accessibilityLabel={`${viewsCount} views`}>
              <Ionicons name="eye-outline" size={16} color="#475569" />
              <Text style={styles.singleActionText} numberOfLines={1}>{viewsCount.toLocaleString('en-IN')}</Text>
            </View>
          ) : null}
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
                      <Text style={[styles.singleActionText, isLiked && styles.singleActionTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Like{likesCount > 0 ? ` (${likesCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.singleActionItem} 
            onPress={handleComment} 
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#475569" />
            <Text style={styles.singleActionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Comment{commentsCount > 0 ? ` (${commentsCount})` : ''}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.singleActionItem} 
            onPress={handleShare} 
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-redo-outline" size={16} color="#475569" />
            <Text style={styles.singleActionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Share{sharesCount > 0 ? ` (${sharesCount})` : ''}</Text>
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

        {showVideoModal && canPlayVideo ? (
          <VideoPopupModal uri={effectiveVideoUri} title={story.title} onClose={() => setShowVideoModal(false)} />
        ) : null}

        {/* ── More Menu ── */}
        <Modal visible={showActionMenu} transparent animationType={menuAnchor ? 'none' : 'fade'} statusBarTranslucent onRequestClose={closeActionMenu}>
          <TouchableWithoutFeedback onPress={closeActionMenu}>
            <View style={menuAnchor ? styles.storyMoreMenuBackdropWeb : styles.storyMoreMenuBackdrop}>
              <TouchableWithoutFeedback>
                <View style={menuAnchor ? [styles.storyMoreMenu, { position: 'absolute', top: menuAnchor.top, left: menuAnchor.left }] : styles.storyMoreMenuSheet}>
                  {!menuAnchor ? <View style={styles.storyMoreMenuHandle} /> : null}
                  <TouchableOpacity style={styles.storyMoreMenuItem} onPress={handleMenuShare} activeOpacity={0.82}>
                    <Ionicons name="share-social-outline" size={18} color="#0ea5e9" />
                    <Text style={styles.storyMoreMenuText}>Share link</Text>
                  </TouchableOpacity>
                  {hasShareVideo || hasShareImage ? (
                    <TouchableOpacity
                      style={styles.storyMoreMenuItem}
                      onPress={async () => { closeActionMenu(); await handleShareMedia(); }}
                      activeOpacity={0.82}
                    >
                      <Ionicons name={hasShareVideo ? 'videocam-outline' : 'image-outline'} size={18} color="#0ea5e9" />
                      <Text style={styles.storyMoreMenuText}>{hasShareVideo ? 'Share video' : 'Share image'}</Text>
                    </TouchableOpacity>
                  ) : null}
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
    </View>
  );
}