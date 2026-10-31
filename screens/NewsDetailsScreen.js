import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Alert,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RightUtilityPanel from '../components/RightUtilityPanel';
import { normalizeStoryItem, dedupeStories } from '../utils/storyHelpers';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import ProfileAvatar from '../components/ProfileAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import WebLayout from '../components/WebLayout';
import LeftEcomSidebar from '../components/LeftEcomSidebar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { UserStore } from '../store/UserStore';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';
import { safePause, safePlay } from '../utils/videoPlayerSafe';
import MediaGallery from '../components/MediaGallery';
import { getEngagement, publishEngagement, subscribeEngagement, getLikedLocal, persistLikedLocal } from '../utils/newsEngagementStore';

const IS_WEB = Platform.OS === 'web';

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const value = url.trim();
  if (!value || value === 'null' || value === 'undefined') return false;
  if (value.startsWith('idb-media:')) return true;
  if (value.startsWith('blob:')) return true;
  if (value.startsWith('data:image')) return true;
  if (value.startsWith('file://')) return Platform.OS !== 'web';
  if (value.startsWith('content://')) return Platform.OS !== 'web';
  if (value.startsWith('ph://')) return Platform.OS !== 'web';
  if (value.startsWith('asset://')) return Platform.OS !== 'web';
  // if (value.startsWith('http://localhost')) return false;
  if (value.startsWith('https://') || value.startsWith('http://')) return true;
  return false;
}

function isPlayableVideoSource(uri) {
  if (typeof uri !== 'string' || !uri.trim()) return false;
  if (/(youtube\.com|youtu\.be)/i.test(uri)) return false;
  if (Platform.OS !== 'web') return true;
  if (/^(blob:|data:)/i.test(uri)) return true;
  if (isIdbMediaUri(uri)) return true;
  // Android se upload hue video ke URL me extension na ho ya alag ho (.3gp, bina extension) to bhi web par
  // chalna chahiye. Ye function sirf video items ke liye bulaya jaata hai, isliye sirf saaf-saaf image/pdf URL reject karo.
  return /^https?:/i.test(uri) && !/\.(jpe?g|png|gif|webp|bmp|svg|heic|avif|pdf)(\?.*)?(#.*)?$/i.test(uri);
}

function buildPlaceholderImage(seedKey) {
  return `https://picsum.photos/seed/${encodeURIComponent(seedKey || 'news-details')}/960/680`;
}

function buildLocationLabel(article) {
  const parts = [article?.taluka, article?.district, article?.state]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

function formatArticleDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeArticle(rawArticle) {
  const article = rawArticle || {};
  const rawImage =
    (Array.isArray(article.images) ? article.images.find((u) => u && String(u).trim()) : '') ||
    article.image ||
    '';
  const safeImage = rawImage && rawImage !== 'null' && rawImage !== 'undefined'
    ? rawImage
    : buildPlaceholderImage(article.id || article.title);
  const galleryImages = Array.isArray(article.images)
    ? article.images.filter((u) => u && String(u).trim() && u !== 'null' && u !== 'undefined')
    : [safeImage];
  return {
    id: article.id || 'news-details-fallback',
    title: article.title || 'News Details',
    subtitle: stripHtml(article.subtitle || ''),
    excerpt: stripHtml(article.excerpt || article.subtitle || article.description || ''),
    description: stripHtml(article.description || article.excerpt || article.subtitle || ''),
    category: article.category || 'Latest News',
    menuTags: Array.isArray(article.menuTags) ? article.menuTags : ['latest'],
    state: article.state || '',
    district: article.district || '',
    taluka: article.taluka || '',
    author_name: article.author_name || article.author || 'RTI Desk',
    author_id: article.author_id || article.userId || null,
    author_email: String(article.author_email || article.createdBy || article.created_by || '').trim().toLowerCase(),
    createdBy: String(article.createdBy || article.created_by || article.author_email || '').trim().toLowerCase(),
    author_profile_image:
      article.author_profile_image ||
      article.authorProfileImage ||
      article.createdByProfileImage ||
      article.profile_image ||
      article.avatar ||
      article.userAvatar ||
      '',
    author_seat_name: article.author_seat_name || 'Reporter',
    author_role_label: article.author_role_label || '',
    author_has_blue_tick: Boolean(
      article.author_has_blue_tick ||
      article.has_blue_tick ||
      article.authorHasBlueTick ||
      article.createdByBlueTick
    ),
    author_is_premium: Boolean(article.author_is_premium),
    image: safeImage,
    images: galleryImages.length ? galleryImages : [safeImage],
    video: article.video || null,
    file: article.file || null,
    mediaType: article.mediaType || (article.video ? 'Video' : 'Image'),
    date: article.date || '05 May 2026',
    publishedAgo: article.publishedAgo || 'Updated recently',
    likes: Number(article.likes || 0),
    comments: Number(article.comments || 0),
    shares: Number(article.shares || 0),
    views: Number(article.views || 0),
  };
}

function buildArticleParagraphs(article) {
  const descriptionText = String(article.description || '').trim();
  const excerptText = String(article.excerpt || '').trim();
  const subtitleText = String(article.subtitle || '').trim();
  const sourceText = descriptionText || excerptText || subtitleText;
  if (!sourceText) return ['Detailed text is not available for this story yet.'];
  const paragraphs = sourceText
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;
  const words = sourceText.split(' ');
  if (words.length > 60) {
    const chunks = [];
    for (let i = 0; i < words.length; i += 60) {
      chunks.push(words.slice(i, i + 60).join(' '));
    }
    return chunks;
  }
  return paragraphs.length > 0 ? paragraphs : [sourceText];
}

function normalizeComment(rawComment) {
  const comment = rawComment || {};
  const author = String(comment.author || comment.user || 'User').trim() || 'User';
  const authorEmail = String(comment.author_email || comment.user_email || '').trim().toLowerCase();
  const authorAvatar = String(comment.authorAvatar || comment.author_avatar || comment.userAvatar || '').trim();
  return {
    id: String(comment.id || ''),
    text: String(comment.text || '').trim(),
    author,
    author_email: authorEmail,
    authorAvatar,
    authorInitial: author.charAt(0).toUpperCase(),
    time: String(comment.date || comment.timestamp || comment.created_at || ''),
    edited_at: comment.edited_at || null,
    likes: Number(comment.likes || 0),
    liked_by: Array.isArray(comment.liked_by) ? comment.liked_by : [],
    replies: Array.isArray(comment.replies) ? comment.replies.map(normalizeComment) : [],
  };
}

function countNestedComments(comments = []) {
  return (Array.isArray(comments) ? comments : []).reduce(
    (total, comment) => total + 1 + countNestedComments(comment.replies),
    0
  );
}

function isCommentOwner(comment, currentUserEmail, currentUserName) {
  const ownerEmail = String(comment?.author_email || '').trim().toLowerCase();
  const ownerName = String(comment?.author || '').trim().toLowerCase();
  const safeUserEmail = String(currentUserEmail || '').trim().toLowerCase();
  const safeUserName = String(currentUserName || '').trim().toLowerCase();
  if (ownerEmail && safeUserEmail) return ownerEmail === safeUserEmail;
  if (!ownerEmail && safeUserName) return ownerName === safeUserName;
  return false;
}

function useResolvedImageUri(rawUri) {
  const [resolved, setResolved] = useState(null);
  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    (async () => {
      if (!rawUri) { setResolved(null); return; }
      if (!isIdbMediaUri(rawUri)) {
        setResolved(rawUri);
        return;
      }
      const next = await resolveIdbMediaUriToObjectUrl(rawUri);
      if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
      objectUrl = next;
      setResolved(next || null);
    })();
    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [rawUri]);
  return resolved;
}

// Gallery ki saari images resolve karo (web pe 'idb-media:' links seedha load nahi hote)
function useResolvedImageUris(list) {
  const key = (list || []).join('|');
  const [out, setOut] = useState(() => (list || []).filter((u) => u && !isIdbMediaUri(u)));
  useEffect(() => {
    let alive = true;
    const created = [];
    (async () => {
      const res = await Promise.all((list || []).map(async (u) => {
        if (!u) return null;
        if (!isIdbMediaUri(u)) return u;
        const next = await resolveIdbMediaUriToObjectUrl(u);
        if (next) created.push(next);
        return next || null;
      }));
      if (!alive) { created.forEach((x) => { try { URL.revokeObjectURL(x); } catch {} }); return; }
      setOut(res.filter(Boolean));
    })();
    return () => {
      alive = false;
      created.forEach((x) => { try { URL.revokeObjectURL(x); } catch {} });
    };
  }, [key]);
  return out;
}

function CommentThreadItem({
  comment,
  currentUserEmail,
  currentUserName,
  expandedReplyThreads,
  editingCommentId,
  editingCommentText,
  onStartEdit,
  onEditingTextChange,
  onSubmitEdit,
  onCancelEdit,
  replyingToCommentId,
  replyText,
  onStartReply,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
  onDelete,
  onLike,
  onOpenProfile,
  formatCommentTime,
  isReply = false,
}) {
  const isOwner = isCommentOwner(comment, currentUserEmail, currentUserName);
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToCommentId === comment.id;
  const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
  const areRepliesExpanded = Boolean(expandedReplyThreads?.[comment.id]);
  const isLiked = Boolean(
    currentUserEmail
      && Array.isArray(comment.liked_by)
      && comment.liked_by.includes(currentUserEmail)
  );
  return (
    <View style={[styles.commentItem, isReply && styles.commentReplyItem]}>
      <TouchableOpacity
        onPress={() => onOpenProfile(comment.author, comment.authorAvatar, comment.author_email || comment.id)}
        activeOpacity={0.7}
      >
        <View style={styles.commentAvatar}>
          {comment.authorAvatar ? (
            <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatarImage} />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarText}>{comment.authorInitial}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => onOpenProfile(comment.author, comment.authorAvatar, comment.author_email || comment.id)}>
              <Text style={styles.commentUserName}>{comment.author}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>
              {formatCommentTime(comment.time)}
              {comment.edited_at ? ' | Edited' : ''}
            </Text>
          </View>
          {isEditing ? (
            <View style={styles.commentEditorWrap}>
              <TextInput
                style={styles.commentEditInput}
                placeholder="Edit comment..."
                placeholderTextColor="#94a3b8"
                value={editingCommentText}
                onChangeText={onEditingTextChange}
                multiline
                maxLength={500}
              />
              <View style={styles.commentInlineActions}>
                <TouchableOpacity style={styles.commentPrimaryAction} onPress={onSubmitEdit} activeOpacity={0.82}>
                  <Text style={styles.commentPrimaryActionText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentSecondaryAction} onPress={onCancelEdit} activeOpacity={0.82}>
                  <Text style={styles.commentSecondaryActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.commentText}>{comment.text}</Text>
          )}
        </View>
        {!isEditing ? (
          <View style={styles.commentActions}>
            <TouchableOpacity onPress={() => onLike(comment.id)} style={styles.commentActionButton} activeOpacity={0.82}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={isLiked ? '#ef4444' : '#64748b'}
              />
              <Text style={[styles.commentActionText, isLiked && styles.commentActionTextLiked]}>
                {comment.likes > 0 ? `${comment.likes} Likes` : 'Like'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onStartReply(comment.id)} style={styles.commentActionButton} activeOpacity={0.82}>
              <Ionicons name="return-up-forward-outline" size={16} color="#64748b" />
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
            {isOwner ? (
              <TouchableOpacity onPress={() => onStartEdit(comment.id, comment.text)} style={styles.commentActionButton} activeOpacity={0.82}>
                <Ionicons name="create-outline" size={16} color="#64748b" />
                <Text style={styles.commentActionText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
            {isOwner ? (
              <TouchableOpacity onPress={() => onDelete(comment.id)} style={styles.commentActionButton} activeOpacity={0.82}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={[styles.commentActionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {isReplying ? (
          <View style={styles.replyComposerWrap}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Reply to ${comment.author}...`}
              placeholderTextColor="#94a3b8"
              value={replyText}
              onChangeText={onReplyTextChange}
              multiline
              maxLength={500}
            />
            <View style={styles.commentInlineActions}>
              <TouchableOpacity style={styles.commentPrimaryAction} onPress={onSubmitReply} activeOpacity={0.82}>
                <Text style={styles.commentPrimaryActionText}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commentSecondaryAction} onPress={onCancelReply} activeOpacity={0.82}>
                <Text style={styles.commentSecondaryActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {replyCount > 0 ? (
          <View style={styles.commentRepliesWrap}>
            <TouchableOpacity
              style={styles.commentRepliesToggle}
              onPress={() => onStartReply(comment.id, { toggleOnly: true })}
              activeOpacity={0.82}
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
                  <CommentThreadItem
                    key={reply.id}
                    comment={reply}
                    currentUserEmail={currentUserEmail}
                    currentUserName={currentUserName}
                    expandedReplyThreads={expandedReplyThreads}
                    editingCommentId={editingCommentId}
                    editingCommentText={editingCommentText}
                    onStartEdit={onStartEdit}
                    onEditingTextChange={onEditingTextChange}
                    onSubmitEdit={onSubmitEdit}
                    onCancelEdit={onCancelEdit}
                    replyingToCommentId={replyingToCommentId}
                    replyText={replyText}
                    onStartReply={onStartReply}
                    onReplyTextChange={onReplyTextChange}
                    onSubmitReply={onSubmitReply}
                    onCancelReply={onCancelReply}
                    onDelete={onDelete}
                    onLike={onLike}
                    onOpenProfile={onOpenProfile}
                    formatCommentTime={formatCommentTime}
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

export default function NewsDetailsScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const responsiveWidth = getResponsiveWindowWidth(width);
    const isCompactLayout = !IS_WEB || isMobileWebDevice() || responsiveWidth < 980;

  const [trendingStories, setTrendingStories] = useState([]);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const summary = await UserStore.getNewsFeedSummary({ feedType: 'all' });
        const items = Array.isArray(summary?.items)
          ? summary.items.map((item, index) => normalizeStoryItem(item, index)).filter(Boolean)
          : [];
        if (isMounted) setTrendingStories(dedupeStories(items));
      } catch { if (isMounted) setTrendingStories([]); }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleOpenTrendingStory = useCallback((story) => {
    if (!story) return;
    navigation?.navigate?.('NewsDetails', { article: story });
  }, [navigation]);

  // Left sidebar (Trending Topics) sirf {title} deta hai — full story dhoondh ke open karo
  const handleOpenSidebarTopic = useCallback((topic) => {
    if (!topic) return;
    const full = trendingStories.find((s) => s?.title === topic?.title) || topic;
    navigation?.navigate?.('NewsDetails', { article: full });
  }, [navigation, trendingStories]);

  const routeArticle = route?.params?.article || null;
  const initialArticle = useMemo(() => normalizeArticle(routeArticle), [routeArticle]);

  const [article, setArticle] = useState(initialArticle);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialArticle.likes);
  const [commentCount, setCommentCount] = useState(initialArticle.comments);
  const [shareCount, setShareCount] = useState(initialArticle.shares);
  const [viewCount, setViewCount] = useState(initialArticle.views);
  const engId = useRef(`details-${Math.random().toString(36).slice(2)}`).current;
  // ✅ Card / dusri jagah se aaya taza like-comment-share-view (shared store) yahan lagao
  const applyEngagement = useCallback((entry) => {
    if (!entry) return;
    if (entry.liked !== undefined) setIsLiked(entry.liked);
    if (entry.likes !== undefined) setLikeCount(entry.likes);
    if (entry.comments !== undefined) setCommentCount(entry.comments);
    if (entry.shares !== undefined) setShareCount(entry.shares);
    if (entry.views !== undefined) setViewCount((prev) => Math.max(prev, entry.views));
  }, []);
  const [comments, setComments] = useState([]);
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [authorProfileImageUri, setAuthorProfileImageUri] = useState('');
  const [showAuthorImageModal, setShowAuthorImageModal] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFullBody, setShowFullBody] = useState(false);
  // Backend se live author profile — tick isi se decide hoga (article ka purana flag nahi)
  const [liveAuthor, setLiveAuthor] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const aid = String(article?.author_id ?? '').trim();
    if (!/^\d+$/.test(aid)) { setLiveAuthor(null); return undefined; }
    UserStore.getPublicProfileById(aid).then((p) => { if (!cancelled) setLiveAuthor(p || null); });
    return () => { cancelled = true; };
  }, [article?.author_id]);
  const authorVerified = liveAuthor ? Boolean(UserStore.hasBlueTick(liveAuthor)) : Boolean(article.author_has_blue_tick);

  const resolvedHeroImage = useResolvedImageUri(article.image);
  const resolvedGalleryImages = useResolvedImageUris(article.images);
  // Gallery ki width = image box ki asli width (pehle poori window width li ja rahi thi)
  const [heroWrapWidth, setHeroWrapWidth] = useState(0);
  // Fixed 16:9 frame (max 420) — image/gallery/video sab isi frame me poore fill hote hain
  const heroFrameHeight = heroWrapWidth ? Math.min(420, Math.round(heroWrapWidth * 9 / 16)) : 220;
  const resolvedAuthorImage = useResolvedImageUri(authorProfileImageUri || article.author_profile_image);

  const currentUserEmail = useMemo(
    () => String(currentUser?.email || '').trim().toLowerCase(),
    [currentUser?.email]
  );
  const currentUserName = useMemo(
    () => String(currentUser?.name || currentUser?.full_name || currentUser?.username || '').trim(),
    [currentUser?.full_name, currentUser?.name, currentUser?.username]
  );
  const articleId = String(routeArticle?.id || initialArticle.id || '').trim();

  const refreshAuthorFollowState = useCallback(async (authorEmail, userEmail = currentUserEmail) => {
    const targetEmail = String(authorEmail || '').trim().toLowerCase();
    const viewerEmail = String(userEmail || '').trim().toLowerCase();
    if (!targetEmail || !viewerEmail || targetEmail === viewerEmail) {
      setIsFollowingAuthor(false);
      return;
    }
    const followSummary = await UserStore.getFollowSummary?.(targetEmail);
    setIsFollowingAuthor(Boolean(followSummary?.isFollowing));
  }, [currentUserEmail]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const existingImage = String(article.author_profile_image || '').trim();
      if (isValidImageUrl(existingImage)) {
        setAuthorProfileImageUri(existingImage);
        return;
      }
      const authorEmail = String(article.author_email || article.createdBy || article.author_id || '').trim().toLowerCase();
      const authorName = String(article.author_name || '').trim().toLowerCase();
      try {
        let authorUser = authorEmail ? await UserStore.getUser(authorEmail) : null;
        if (!authorUser && authorName) {
          const allUsers = await UserStore.getAllUsers();
          authorUser = allUsers.find((user) =>
            String(user?.name || user?.full_name || user?.username || '').trim().toLowerCase() === authorName
          ) || null;
        }
        if (!alive) return;
        const nextImage = String(authorUser?.profile_image || authorUser?.avatar || '').trim();
        setAuthorProfileImageUri(isValidImageUrl(nextImage) ? nextImage : '');
      } catch {
        if (alive) setAuthorProfileImageUri('');
      }
    })();
    return () => { alive = false; };
  }, [article.author_email, article.author_id, article.author_name, article.author_profile_image, article.createdBy]);

  const loadArticleDetails = useCallback(async () => {
    const fallbackArticle = normalizeArticle(route?.params?.article);
    setArticle(fallbackArticle);
    setLikeCount(fallbackArticle.likes);
    setCommentCount(fallbackArticle.comments);
    setShareCount(fallbackArticle.shares);
    setViewCount(fallbackArticle.views);
    applyEngagement(getEngagement(fallbackArticle.id));

    try {
      const [user, summary] = await Promise.all([
        UserStore.getCurrentUser(),
        articleId ? UserStore.getNewsFeedSummary({ focusItemId: articleId, feedType: 'all' }) : Promise.resolve(null),
      ]);
      setCurrentUser(user || null);
      await refreshAuthorFollowState(fallbackArticle.createdBy || fallbackArticle.author_email, user?.email);

      const matchedItem = articleId && Array.isArray(summary?.items)
        ? summary.items.find((item) => String(item.id || '') === articleId)
        : null;

      if (!matchedItem) {
        const likedFallback = Boolean(
          user?.email
            && Array.isArray(route?.params?.article?.liked_by)
            && route.params.article.liked_by.includes(String(user.email).trim().toLowerCase())
        );
        const localSaved = user?.email ? await getLikedLocal(user.email) : {};
        setIsLiked(likedFallback || Boolean(localSaved[articleId]));
        applyEngagement(getEngagement(articleId));
        setComments([]);
        return;
      }

      const routeParamArticle = route?.params?.article || {};
      const mergedArticle = normalizeArticle({
        ...routeParamArticle,
        ...matchedItem,
        author_profile_image:
          matchedItem.author_profile_image ||
          routeParamArticle.author_profile_image ||
          routeParamArticle.authorProfileImage ||
          routeParamArticle.createdByProfileImage ||
          routeParamArticle.profile_image ||
          routeParamArticle.avatar ||
          '',
      });
      const likedByCurrentUser = Boolean(
        matchedItem.liked_by_me || (
          user?.email
          && Array.isArray(matchedItem.liked_by)
          && matchedItem.liked_by.includes(String(user.email).trim().toLowerCase())
        )
      );

      setArticle(mergedArticle);
      await refreshAuthorFollowState(mergedArticle.createdBy || mergedArticle.author_email, user?.email);
      setIsLiked(likedByCurrentUser);
      setLikeCount(Number(matchedItem.likes || 0));
      setShareCount(Number(matchedItem.shares || 0));
      setViewCount(Number(matchedItem.views || 0));
      const rawComments = Array.isArray(matchedItem.comments_list)
        ? matchedItem.comments_list
        : (Array.isArray(matchedItem.comments) ? matchedItem.comments : []);
      const normalizedComments = rawComments.map(normalizeComment);
      setComments(normalizedComments);
      setCommentCount(Number(
        matchedItem.comments ??
        matchedItem.comments_count ??
        countNestedComments(normalizedComments)
      ));
      // card par like karne se server summary me liked na aaye to phone me saved like bhi maano
      const localSavedLikes = user?.email ? await getLikedLocal(user.email) : {};
      if (!likedByCurrentUser && localSavedLikes[articleId]) setIsLiked(true);
      // taza shared count (card / yahin ka abhi ka action) stale server count se upar
      applyEngagement(getEngagement(articleId));
    } catch {
      setCurrentUser(null);
      setComments([]);
      setIsLiked(false);
      setIsFollowingAuthor(false);
    }
  }, [articleId, refreshAuthorFollowState, route?.params?.article]);

  useEffect(() => {
    setArticle(initialArticle);
    setLikeCount(initialArticle.likes);
    setCommentCount(initialArticle.comments);
    setShareCount(initialArticle.shares);
    setViewCount(initialArticle.views);
    applyEngagement(getEngagement(initialArticle.id));
  }, [initialArticle, applyEngagement]);

  // ✅ Card par like / comment / share / view badla to yahan turant
  useEffect(() => {
    if (!articleId) return undefined;
    return subscribeEngagement((id, entry, src) => {
      if (id === articleId && src !== engId) applyEngagement(entry);
    });
  }, [articleId, engId, applyEngagement]);

  useEffect(() => {
    loadArticleDetails();
  }, [loadArticleDetails]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadArticleDetails);
    return unsubscribe;
  }, [loadArticleDetails, navigation]);

  const locationLabel = useMemo(() => buildLocationLabel(article), [article]);
  const articleParagraphs = useMemo(() => buildArticleParagraphs(article), [article]);
  const activeCategoryTag = useMemo(
    () => (article.menuTags || []).find((tag) => tag !== 'latest') || 'latest',
    [article.menuTags]
  );

  const videoUri = String(typeof article.video === 'string' ? article.video : article.video?.uri || '').trim();
  const [resolvedVideoUri, setResolvedVideoUri] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoPoster, setShowVideoPoster] = useState(true);

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

  const effectiveVideoUri = useMemo(() => {
    if (Platform.OS === 'web' && isIdbMediaUri(videoUri)) return resolvedVideoUri || '';
    return videoUri;
  }, [resolvedVideoUri, videoUri]);

  const canPlayVideo = Boolean(effectiveVideoUri) && isPlayableVideoSource(effectiveVideoUri);
  const player = useVideoPlayer(canPlayVideo ? { uri: effectiveVideoUri } : null, (p) => {
    p.loop = false;
  });

  const handleVideoPress = useCallback(() => {
    if (!canPlayVideo) return;
    if (isVideoPlaying) {
      safePause(player);
      setIsVideoPlaying(false);
    } else {
      const ok = safePlay(player);
      if (!ok) return;
      setIsVideoPlaying(true);
      setShowVideoPoster(false);
    }
  }, [canPlayVideo, player, isVideoPlaying]);

  useEffect(() => {
    if (!canPlayVideo) return;
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      safePause(player);
      setIsVideoPlaying(false);
    });
    return unsubscribe;
  }, [canPlayVideo, navigation, player]);

  useEffect(() => {
    if (!canPlayVideo) return;
    const unsubscribeBlur = navigation.addListener('blur', () => {
      safePause(player);
      setIsVideoPlaying(false);
    });
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setShowVideoPoster(true);
    });
    return () => { unsubscribeBlur(); unsubscribeFocus(); };
  }, [canPlayVideo, navigation, player]);

  useEffect(() => {
    return () => { safePause(player); };
  }, [player]);

   const handleNavigateToCommentUserProfile = useCallback((userName, userAvatar, userEmail) => {
    if (!userName) return;
    try {
      navigation?.navigate('UserPublicProfile', {
        email: userEmail || undefined,
        author: { name: userName, profile_image: userAvatar },
      });
    } catch {}
  }, [navigation]);
    const handleToggleFollowAuthor = useCallback(async () => {
    const authorEmail = String(article.createdBy || article.author_email || '').trim().toLowerCase();
    const authorId = article.author_id || article.userId || null;
    if (!currentUserEmail) { Alert.alert('Login required', 'Please login to follow this user.'); return; }
    if (!authorEmail || authorEmail === currentUserEmail) return;

    const nextFollowing = !isFollowingAuthor;
    setIsFollowingAuthor(nextFollowing);
    try {
      const result = nextFollowing
        ? await UserStore.followUser(authorEmail, authorId)
        : await UserStore.unfollowUser(authorEmail, authorId);
      if (result?.ok === false) {
        setIsFollowingAuthor(!nextFollowing);
        Alert.alert('Follow', result?.message || 'Unable to update follow status.');
        return;
      }
      refreshAuthorFollowState(authorEmail, currentUserEmail).catch(() => {});
    } catch {
      setIsFollowingAuthor(!nextFollowing);
      Alert.alert('Follow', 'Unable to update follow status.');
    }
  }, [article.author_email, article.createdBy, currentUserEmail, followLoading, isFollowingAuthor, refreshAuthorFollowState]);

  const handleLike = useCallback(async () => {
    const wasLiked = isLiked;
    const prevCount = Number(likeCount || 0);
    setIsLiked(!wasLiked);
    setLikeCount(Math.max(0, prevCount + (wasLiked ? -1 : 1)));
    const result = await UserStore.updateNewsFeedItem(article.id, 'like', { liked: wasLiked });
    if (!result?.ok) { setIsLiked(wasLiked); setLikeCount(prevCount); Alert.alert('Error', result?.message || 'Could not update like'); return; }
    const finalLiked = result.liked !== undefined ? Boolean(result.liked) : !wasLiked;
    const finalCount = Number.isFinite(result.likesCount)
      ? result.likesCount
      : Math.max(0, prevCount + (finalLiked ? 1 : 0) - (wasLiked ? 1 : 0));
    setIsLiked(finalLiked);
    setLikeCount(finalCount);
    publishEngagement(article.id, { liked: finalLiked, likes: finalCount }, engId);   // ✅ card par bhi dikhe
    if (currentUserEmail) persistLikedLocal(currentUserEmail, article.id, finalLiked);
  }, [article.id, isLiked, likeCount, currentUserEmail, engId]);

  const handleShare = useCallback(async () => {
    try {
      const articleLink = `https://rtinews.in/news/${encodeURIComponent(article.id || article.title || 'story')}`;
      const articleImage = article.image || article.images?.[0] || '';
      const result = await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.excerpt || article.description || ''}\n\n${articleImage ? `Image: ${articleImage}\n\n` : ''}Read full news: ${articleLink}\n\nRTI News App`,
        url: articleLink,
      });
      const wasShared = Platform.OS === 'web' || result.action === Share.sharedAction;
      if (wasShared) {
        const shareResult = await UserStore.updateNewsFeedItem(article.id, 'share');
        if (shareResult?.ok) {
          const nextShares = Number(shareCount || 0) + 1;
          setShareCount(nextShares);
          publishEngagement(article.id, { shares: nextShares }, engId);
          await loadArticleDetails();
        }
      }
    } catch { Alert.alert('Error', 'Could not share this article'); }
  }, [article, loadArticleDetails, shareCount, engId]);

  const handleAddComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed) { Alert.alert('Error', 'Please enter a comment'); return; }
    const result = await UserStore.addNewsComment(article.id, trimmed);
    if (!result?.ok) { Alert.alert('Error', result?.message || 'Could not add comment'); return; }
    const addedComment = normalizeComment(result.comment || {
      text: trimmed,
      author: currentUserName || 'User',
      author_email: currentUserEmail || '',
    });
    setComments((prev) => [addedComment, ...prev]);
    const nextComments = Number.isFinite(result.commentsCount) ? result.commentsCount : Number(commentCount || 0) + 1;
    setCommentCount(nextComments);
    publishEngagement(article.id, { comments: nextComments }, engId);   // ✅ card par bhi
    setCommentText('');
    await loadArticleDetails();
  }, [article.id, commentText, commentCount, currentUserEmail, currentUserName, loadArticleDetails, engId]);

  const handleStartEditComment = useCallback((commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
    setReplyingToCommentId(null);
    setReplyText('');
  }, []);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleSubmitEditComment = useCallback(async () => {
    const trimmed = editingCommentText.trim();
    if (!editingCommentId || !trimmed) return;
    const result = await UserStore.editNewsComment(article.id, editingCommentId, trimmed);
    if (!result?.ok) { Alert.alert('Error', result?.message || 'Could not edit comment'); return; }
    setEditingCommentId(null);
    setEditingCommentText('');
    await loadArticleDetails();
  }, [article.id, editingCommentId, editingCommentText, loadArticleDetails]);

  const handleStartReplyComment = useCallback((commentId, options = {}) => {
    if (options?.toggleOnly) {
      setExpandedReplyThreads((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
      return;
    }
    setExpandedReplyThreads((prev) => ({ ...prev, [commentId]: true }));
    setReplyingToCommentId(commentId);
    setReplyText('');
    setEditingCommentId(null);
    setEditingCommentText('');
  }, []);

  const handleCancelReplyComment = useCallback(() => {
    setReplyingToCommentId(null);
    setReplyText('');
  }, []);

  const handleSubmitReplyComment = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!replyingToCommentId || !trimmed) return;
    const result = await UserStore.replyNewsComment(article.id, replyingToCommentId, trimmed);
    if (!result?.ok) { Alert.alert('Error', result?.message || 'Could not add reply'); return; }
    const addedReply = normalizeComment(result.comment || {
      text: trimmed,
      author: currentUserName || 'User',
      author_email: currentUserEmail || '',
    });
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === replyingToCommentId
          ? { ...comment, replies: [addedReply, ...(Array.isArray(comment.replies) ? comment.replies : [])] }
          : comment
      )
    );
    setExpandedReplyThreads((prev) => ({ ...prev, [replyingToCommentId]: true }));
    const nextComments = Number(commentCount || 0) + 1;
    setCommentCount(nextComments);
    publishEngagement(article.id, { comments: nextComments }, engId);
    setReplyingToCommentId(null);
    setReplyText('');
    await loadArticleDetails();
  }, [article.id, commentCount, currentUserEmail, currentUserName, engId, loadArticleDetails, replyingToCommentId, replyText]);

  const handleLikeComment = useCallback(async (commentId) => {
    const result = await UserStore.likeNewsComment(article.id, commentId);
    if (!result?.ok) { Alert.alert('Error', result?.message || 'Could not update comment like'); return; }
    await loadArticleDetails();
  }, [article.id, loadArticleDetails]);

  const handleDeleteComment = useCallback(async (commentId) => {
    const confirmed = IS_WEB
      ? window.confirm('Are you sure you want to delete this comment?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    if (!confirmed) return;
    const result = await UserStore.deleteNewsComment(article.id, commentId);
    if (!result?.ok) { Alert.alert('Error', result?.message || 'Could not delete comment'); return; }
    if (editingCommentId === commentId) { setEditingCommentId(null); setEditingCommentText(''); }
    if (replyingToCommentId === commentId) { setReplyingToCommentId(null); setReplyText(''); }
    const nextComments = Math.max(0, Number(commentCount || 0) - 1);
    setCommentCount(nextComments);
    publishEngagement(article.id, { comments: nextComments }, engId);
    await loadArticleDetails();
  }, [article.id, commentCount, editingCommentId, engId, loadArticleDetails, replyingToCommentId]);

  const handleOpenAttachment = useCallback(async () => {
    const fileUri = article?.file?.uri;
    if (!fileUri) return;
    try { await Linking.openURL(fileUri); } catch {}
  }, [article]);

  const handleOpenStateFeed = useCallback(() => {
    if (!article.state) return;
    navigation?.navigate?.('Home', {
      initialView: 'feed', initialMenuKey: 'latest', initialStateName: article.state,
    });
  }, [article.state, navigation]);

  const handleOpenCategoryFeed = useCallback(() => {
    navigation?.navigate?.('Home', {
      initialView: 'feed', initialMenuKey: activeCategoryTag, initialStateName: '',
    });
  }, [activeCategoryTag, navigation]);

  const formatCommentTime = useCallback((timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return String(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  const handleCloseCommentsModal = useCallback(() => {
    setShowCommentsModal(false);
    setEditingCommentId(null);
    setEditingCommentText('');
    setReplyingToCommentId(null);
    setReplyText('');
  }, []);

  const heroImageSource = useMemo(() => {
    const uri = resolvedHeroImage || article.image;
    if (!uri || uri === 'null' || uri === 'undefined') return null;
    return { uri };
  }, [resolvedHeroImage, article.image]);

  const authorImageUri = useMemo(() => {
    const uri = resolvedAuthorImage || authorProfileImageUri || article.author_profile_image;
    return uri && isValidImageUrl(uri) ? uri : '';
  }, [resolvedAuthorImage, authorProfileImageUri, article.author_profile_image]);

  const page = (
    <View style={styles.screenShell}>
      {IS_WEB ? <AppNavbar navigation={navigation} activeScreen={null} /> : null}
      {!IS_WEB ? (
        <AppNavbar navigation={navigation} activeScreen={null} hideBottomBar={true} />
      ) : null}

      <ScrollView
        style={styles.pageScrollView}
        contentContainerStyle={[
          styles.pageScrollContent,
          !IS_WEB && styles.pageScrollContentWithMobileNav,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageBodyShell}>
          <View style={[styles.pageBodyInner, isCompactLayout && styles.pageBodyInnerCompact]}>
            {!isCompactLayout ? (
              <View style={styles.leftSidebar}>
                <LeftEcomSidebar
                  navigation={navigation}
                  stories={trendingStories}
                  onOpenDetails={handleOpenSidebarTopic}
                />
              </View>
            ) : null}
            <View style={styles.storyColumn}>
                   <View style={[styles.storyCardShell, isCompactLayout && styles.storyCardShellCompact]}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation?.goBack?.()}
                  activeOpacity={0.84}
                >
                  <Ionicons name="arrow-back-outline" size={25} color="#64748b" />
                </TouchableOpacity>

                <View style={styles.storyAuthorRow}>
                  <View style={styles.storyAuthorIdentity}>
                    <TouchableOpacity
                      style={styles.storyAuthorAvatarButton}
                      onPress={() => setShowAuthorImageModal(true)}
                      activeOpacity={0.76}
                    >
                      <ProfileAvatar uri={authorImageUri} size={54} style={styles.storyAuthorAvatar} />
                    </TouchableOpacity>
                    <View style={styles.storyAuthorTextWrap}>
                      <View style={styles.storyAuthorNameRow}>
                        <Text style={styles.storyAuthorName}>{article.author_name}</Text>
                        {authorVerified ? <VerifiedBadge size={20} /> : null}
                      </View>
                      <Text style={styles.storyAuthorRoleText}>
                        {(() => {
                          const planForRole = article.author_subscription_plan || null;
                          const planRoleLabel = (planForRole?.role_names?.length
                            ? planForRole.role_names
                            : String(UserStore.getSeatRoleNameForPlanRoleId(planForRole?.role_id_raw || planForRole?.role_id || '') || '').split(', ')
                          ).filter(Boolean).join(', ');
                          return planRoleLabel || article.author_role_label || 'Reporter';
                        })()}
                      </Text>
                    </View>
                  </View>
                 {false ? (
                    <TouchableOpacity
                      style={[styles.followAuthorButton, isFollowingAuthor && styles.followAuthorButtonActive, followLoading && styles.followAuthorButtonDisabled]}
                      onPress={handleToggleFollowAuthor}
                      activeOpacity={0.84}
                      disabled={followLoading}
                    >
                      <Ionicons name={isFollowingAuthor ? 'person' : 'person-add-outline'} size={15} color={isFollowingAuthor ? (IS_WEB ? '#e11d48' : '#f97316') : '#ffffff'} />                      <Text style={[styles.followAuthorButtonText, isFollowingAuthor && styles.followAuthorButtonTextActive]}>
                        {followLoading ? '...' : isFollowingAuthor ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={[styles.storyHeadlineText, isCompactLayout && styles.storyHeadlineTextCompact]}>
                  {article.title}
                </Text>



                {article.excerpt ? (
                  <Text style={styles.storyExcerptText}>{article.excerpt}</Text>
                ) : null}

                <View style={styles.storyMetaRow}>
                  <View style={styles.storyMetaPill}>
                    <Ionicons name="calendar-outline" size={17} color="#94a3b8" />
                                   <Text style={styles.storyMetaPillText}>{formatArticleDate(article.date)}</Text>
                  </View>
                  {article.category ? (
                    <View style={styles.storyMetaPill}>
                      <Ionicons name="pricetag-outline" size={17} color="#94a3b8" />
                      <Text style={styles.storyMetaPillText} numberOfLines={1}>{article.category}</Text>
                    </View>
                  ) : null}
                  {locationLabel ? (
                    <View style={styles.storyMetaPill}>
                      <Ionicons name="pin-outline" size={17} color="#94a3b8" />
                      <Text style={styles.storyMetaPillText}>{locationLabel}</Text>
                    </View>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.storyHeroImageWrap,
                    isCompactLayout && styles.storyHeroImageWrapCompact,
                    (!canPlayVideo && article.images.length > 1)
                      ? { height: heroFrameHeight + 26, backgroundColor: 'transparent' }
                      : { height: heroFrameHeight },
                  ]}
                  onLayout={(e) => {
                    const w = Math.round(e.nativeEvent.layout.width);
                    if (w > 0 && w !== heroWrapWidth) setHeroWrapWidth(w);
                  }}
                >
                  {canPlayVideo ? (
                    <TouchableOpacity style={styles.videoContainer} activeOpacity={1} onPress={handleVideoPress}>
                      <VideoView
                        player={player}
                        style={styles.videoView}
                        contentFit="cover"
                        nativeControls={false}
                        fullscreenOptions={{ enabled: true }}
                        playsInline
                        onFirstFrameRender={() => { if (!isVideoPlaying) setShowVideoPoster(false); }}
                      />
                      {showVideoPoster && !isVideoPlaying ? (
                        <>
                          {heroImageSource ? (
                            <Image source={heroImageSource} style={styles.videoPoster} resizeMode="cover" />
                          ) : null}
                          <View style={styles.playButtonOverlay}>
                            <Ionicons name="play-circle" size={68} color="#ffffff" />
                            <Text style={styles.playButtonText}>Tap to Play</Text>
                          </View>
                        </>
                      ) : null}
                      {!isVideoPlaying && !showVideoPoster ? (
                        <View style={styles.playButtonOverlay}>
                          <Ionicons name="play-circle" size={68} color="#ffffff" />
                          <Text style={styles.playButtonText}>Tap to Play</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ) : article.images.length > 1 ? (
                    <MediaGallery
                      images={resolvedGalleryImages}
                      width={Math.max(1, heroWrapWidth || Math.min(responsiveWidth - (isCompactLayout ? 32 : 64), 668))}
                      fit="cover"
                      maxHeight={heroFrameHeight}
                      radius={5}
                    />
                  ) : heroImageSource ? (
                    <Image source={heroImageSource} style={styles.storyHeroImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={48} color="#94a3b8" />
                      <Text style={styles.imagePlaceholderText}>Loading image...</Text>
                    </View>
                  )}
                </View>

                {/* ✅ Stats in Single Line - Fixed */}
                <View style={styles.storyStatsRow}>
                  <View style={styles.storyStatItem}>
                    <Ionicons name="eye-outline" size={21} color="#64748b" />
                    <Text style={styles.storyStatText}>{viewCount.toLocaleString()} Views</Text>
                  </View>
                  <TouchableOpacity style={styles.storyStatItem} onPress={handleLike} activeOpacity={0.7}>
                    <Ionicons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={21}
                      color={isLiked ? "#ef4444" : "#64748b"}
                    />
                    <Text style={[styles.storyStatText, isLiked && styles.likedText]}>
                      {likeCount.toLocaleString()} {likeCount === 1 ? 'Like' : 'Likes'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.storyStatItem}
                    onPress={async () => { setShowCommentsModal(true); await loadArticleDetails(); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-outline" size={21} color="#64748b" />
                    <Text style={styles.storyStatText}>
                      {commentCount.toLocaleString()} {commentCount === 1 ? 'Comment' : 'Comments'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.storyStatItem} onPress={handleShare} activeOpacity={0.7}>
                    <Ionicons name="share-social-outline" size={21} color="#64748b" />
                    <Text style={styles.storyStatText}>
                      {shareCount.toLocaleString()} {shareCount === 1 ? 'Share' : 'Shares'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ✅ Description - Bigger Text */}
                <View style={styles.articleBodyWrap}>
                  {articleParagraphs.map((paragraph, index) => (
                    <Text
                      key={`${paragraph.slice(0, 20)}-${index}`}
                      style={[
                        styles.articleBodyParagraph,
                        index === articleParagraphs.length - 1 && styles.articleBodyParagraphLast,
                      ]}
                    >
                      {paragraph}
                    </Text>
                  ))}
                  {false ? (
                    <TouchableOpacity
                      onPress={() => setShowFullBody(prev => !prev)}
                      activeOpacity={0.8}
                      style={{ marginTop: 8 }}
                    >
                      <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' }}>
                        {showFullBody ? 'Show less ▲' : 'Read more ▼'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {false ? (
                  <View style={styles.storyBodySection}>
                    <Text style={styles.storyBodyTitle}>Gallery</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.galleryRow}>
                        {article.images.slice(1).map((imageUrl, index) => (
                          <GalleryImage key={`${imageUrl}-${index}`} rawUri={imageUrl} />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {article.video && !canPlayVideo ? (
                  <View style={styles.storyBodySection}>
                    <Text style={styles.storyBodyTitle}>Video</Text>
                    <Text style={styles.storyBodyText}>
                      Video preview is not available for this link. Please try a direct MP4/WebM URL.
                    </Text>
                  </View>
                ) : null}

                {article.file?.uri ? (
                  <View style={styles.storyBodySection}>
                    <Text style={styles.storyBodyTitle}>Attachment</Text>
                    <TouchableOpacity style={styles.attachmentButton} onPress={handleOpenAttachment} activeOpacity={0.84}>
                      <Ionicons name="document-attach-outline" size={18} color="#ffffff" />
                      <Text style={styles.attachmentButtonText}>
                        {article.file?.name || 'Open Attachment'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                      </View>
            </View>
            {!isCompactLayout ? (
              <View style={styles.trendingSidebar}>
                <RightUtilityPanel
                  navigation={navigation}
                  trendingStories={trendingStories}
                  onOpenDetails={handleOpenTrendingStory}
                />
              </View>
            ) : null}
          </View>

          <AppFooter navigation={navigation} />
        </View>
      </ScrollView>

      {!IS_WEB ? (
        <AppNavbar navigation={navigation} activeScreen={null} hideTopHeader={true} />
      ) : null}

      <Modal
        visible={showAuthorImageModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAuthorImageModal(false)}
      >
        <View style={styles.authorImageModalBackdrop}>
          <TouchableOpacity
            style={styles.authorImageModalClose}
            onPress={() => setShowAuthorImageModal(false)}
            activeOpacity={0.84}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <ScrollView
            style={styles.authorImageZoomScroll}
            contentContainerStyle={styles.authorImageZoomContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {authorImageUri ? (
              <Image source={{ uri: authorImageUri }} style={styles.authorImageZoom} resizeMode="contain" />
            ) : (
              <ProfileAvatar
                uri=""
                size={320}
                iconSize={120}
                style={styles.authorImageZoom}
                placeholderStyle={{ backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
                iconColor="#ffffff"
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseCommentsModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseCommentsModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments ({commentCount})</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitCommentButton, !commentText.trim() && styles.submitCommentButtonDisabled]}
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
              <Text style={styles.submitCommentText}>Post</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commentsList}>
            {comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={64} color="#cbd5e1" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment on this article</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <CommentThreadItem
                  key={comment.id}
                  comment={comment}
                  currentUserEmail={currentUserEmail}
                  currentUserName={currentUserName}
                  expandedReplyThreads={expandedReplyThreads}
                  editingCommentId={editingCommentId}
                  editingCommentText={editingCommentText}
                  onStartEdit={handleStartEditComment}
                  onEditingTextChange={setEditingCommentText}
                  onSubmitEdit={handleSubmitEditComment}
                  onCancelEdit={handleCancelEditComment}
                  replyingToCommentId={replyingToCommentId}
                  replyText={replyText}
                  onStartReply={handleStartReplyComment}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={handleSubmitReplyComment}
                  onCancelReply={handleCancelReplyComment}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  onOpenProfile={handleNavigateToCommentUserProfile}
                  formatCommentTime={formatCommentTime}
                />
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );

  return IS_WEB ? <WebLayout>{page}</WebLayout> : page;
}

function GalleryImage({ rawUri }) {
  const resolved = useResolvedImageUri(rawUri);
  if (!resolved) return null;
  return (
    <Image
      source={{ uri: resolved }}
      style={styles.galleryImage}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
    screenShell: { flex: 1, backgroundColor: IS_WEB ? '#f1f5f9' : '#ffffff' },
  pageScrollView: { flex: 1 },
  pageScrollContent: { paddingTop: 0, paddingBottom: IS_WEB ? 0 : 80, flexGrow: 1 },
  pageScrollContentWithMobileNav: { paddingBottom: 110 },
    pageBodyShell: { paddingTop: 0, marginTop: -1, backgroundColor: IS_WEB ? '#f1f5f9' : '#ffffff', flexGrow: 1 },
   pageBodyInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    flexDirection: IS_WEB ? 'row' : 'column',
    alignItems: 'flex-start',
       gap: 24,
    paddingTop: IS_WEB ? 18 : 0,
    paddingHorizontal: IS_WEB ? 16 : 0,
  },
  pageBodyInnerCompact: { flexDirection: 'column' },
    storyColumn: { flex: 1, width: '100%', maxWidth: 700, minWidth: 0 },
  trendingSidebar: { width: 340, flexShrink: 0 },
  leftSidebar: { width: 300, flexShrink: 0 },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  utilityRowCompact: { alignItems: 'stretch' },
  utilityChipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
  },
  backButtonText: { color: '#0f172a', fontSize: 13, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
  utilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  utilityChipText: { color: '#f97316', fontSize: 11, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
   storyCardShell: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)', overflow: 'hidden' },
      default: { elevation: 2, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    }),
  },
  storyCardShellCompact: IS_WEB
    ? { padding: 16, borderRadius: 10 }
    : { padding: 16, borderRadius: 0, borderWidth: 0, elevation: 0, shadowOpacity: 0 },
  storyAuthorRow: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  storyAuthorIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  storyAuthorAvatarButton: { marginRight: 12, cursor: Platform.OS === 'web' ? 'zoom-in' : 'default' },
  storyAuthorAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#e2e8f0' },
  storyAuthorTextWrap: { flex: 1 },
  storyAuthorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  storyAuthorName: { color: '#0f172a', fontSize: 22, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
  storyAuthorRoleText: { color: '#64748b', fontSize: 13, fontWeight: '700', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
   followAuthorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: IS_WEB ? '#e11d48' : '#f97316',
    flexShrink: 0,
  },
  followAuthorButtonActive: IS_WEB
    ? { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fda4af' }
    : { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fdba74' },
  followAuthorButtonDisabled: { opacity: 0.65 },
  followAuthorButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
  followAuthorButtonTextActive: { color: IS_WEB ? '#e11d48' : '#f97316' },
  storyHeadlineText: {
    color: '#0f172a',
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto',
  },
  storyHeadlineTextCompact: { fontSize: 24, lineHeight: 32, fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto' },
  storySubtitleText: { color: '#334155', fontSize: 18, lineHeight: 28, marginTop: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  storyExcerptText: { color: '#475569', fontSize: 16, lineHeight: 25, marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  storyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 },
   storyMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  storyMetaPillText: { color: '#64748b', fontSize: 13, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  storyHeroImageWrap: { marginTop: 18, height: 220, borderRadius: 5, overflow: 'hidden', backgroundColor: '#e2e8f0', marginBottom: 16, zIndex: 0, position: 'relative', flexShrink: 0 },
  storyHeroImageWrapCompact: { height: 220 },
  storyHeroImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  imagePlaceholderText: { color: '#94a3b8', fontSize: 13, marginTop: 8, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  videoContainer: { width: '100%', height: '100%', position: 'relative' },
  videoView: { width: '100%', height: '100%' },
  videoPoster: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  playButtonOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.3)' },
  playButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginTop: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  storyStatsRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    rowGap: 10,
    columnGap: 8,
  },
  storyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  storyStatText: { color: '#374151', fontSize: 14.5, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  likedText: { color: '#ef4444' },
  articleBodyWrap: { marginTop: 24 },
  articleBodyParagraph: {
    color: '#111827',
    fontSize: 18,
    lineHeight: 32,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto',
  },
  articleBodyParagraphLast: { marginBottom: 0 },
  storyBodySection: { marginTop: 22 },
  storyBodyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
  storyBodyText: { color: '#334155', fontSize: 15, lineHeight: 26, fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
  galleryRow: { flexDirection: 'row', gap: 10 },
  galleryImage: { width: 190, height: 130, borderRadius: 16, backgroundColor: '#e2e8f0' },
  attachmentButton: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: '#f97316' },
  attachmentButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto' },
  authorImageModalBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.94)', alignItems: 'center', justifyContent: 'center' },
  authorImageModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 24,
    right: 18,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  authorImageZoomScroll: { width: '100%', height: '100%' },
  authorImageZoomContent: { minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 },
  authorImageZoom: { width: '100%', maxWidth: 520, height: 520, borderRadius: 12 },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  modalCloseButton: { padding: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentInputContainer: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  commentInput: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 12, fontSize: 14, borderWidth: 1, borderColor: '#e2e8f0', maxHeight: 100, fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto' },
  submitCommentButton: { backgroundColor: '#f97316', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  submitCommentButtonDisabled: { backgroundColor: '#cbd5e1' },
  submitCommentText: { color: '#ffffff', fontWeight: '600', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentsList: { flex: 1 },
  noCommentsContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  noCommentsText: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 20, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  noCommentsSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'flex-start' },
  commentReplyItem: { marginLeft: 20, paddingLeft: 0, paddingRight: 0, paddingBottom: 8, borderBottomWidth: 0 },
  commentAvatar: { marginRight: 12 },
  commentAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  commentAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#ffffff', fontSize: 16, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentContent: { flex: 1 },
  commentBubble: { backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  commentUserName: { fontSize: 14, fontWeight: '700', color: '#0f172a', cursor: Platform.OS === 'web' ? 'pointer' : 'default', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentTime: { fontSize: 12, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentText: { fontSize: 14, color: '#334155', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto' },
  commentActions: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 8, paddingLeft: 4 },
  commentActionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionText: { fontSize: 12, color: '#64748b', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentActionTextLiked: { color: '#ef4444' },
  deleteText: { color: '#ef4444' },
  commentEditorWrap: { gap: 10 },
  commentEditInput: { minHeight: 82, borderWidth: 1, borderColor: '#dbe3ee', borderRadius: 14, backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 10, color: '#0f172a', fontSize: 14, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto' },
  commentInlineActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  commentPrimaryAction: { borderRadius: 999, backgroundColor: '#f97316', paddingHorizontal: 14, paddingVertical: 8 },
  commentPrimaryActionText: { color: '#ffffff', fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentSecondaryAction: { borderRadius: 999, backgroundColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8 },
  commentSecondaryActionText: { color: '#475569', fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  replyComposerWrap: { marginTop: 10, paddingLeft: 4, gap: 10 },
  replyInput: { minHeight: 70, borderWidth: 1, borderColor: '#dbe3ee', borderRadius: 14, backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 10, color: '#0f172a', fontSize: 14, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto' },
  commentRepliesWrap: { marginTop: 10 },
  commentRepliesToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, marginBottom: 4 },
  commentRepliesLine: { width: 24, height: 1, backgroundColor: '#cbd5e1' },
  commentRepliesToggleText: { fontSize: 12, fontWeight: '700', color: '#475569', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  commentReplies: { marginTop: 10, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 10 },
});