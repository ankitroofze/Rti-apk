import NameWithTick from '../components/NameWithTick';
import NewsMusicSync from '../components/NewsMusicSync';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Image, Dimensions, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Keyboard,
  Animated, useWindowDimensions, Share, Linking, BackHandler,
} from 'react-native';
import styles from './FeedScreenStyles';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAudioPlayer } from 'expo-audio';
import AppNavbar from '../components/AppNavbar';
import NewsCameraModal from '../components/NewsCameraModal';
import VideoAudioEditorModal from '../components/VideoAudioEditorModal';
import NewsLimitModal from '../components/NewsLimitModal';
import ProfileAvatar from '../components/ProfileAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import WebLayout from '../components/WebLayout';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl, storeWebUriToIdbMedia } from '../utils/webMediaStore';
import { safePause, safePlay, safeSetMuted } from '../utils/videoPlayerSafe';
import { useGlobalMuted, getGlobalMuted, setGlobalMuted } from '../utils/Globalmutestore';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';
import { getAdRedirectMeta, openAdRedirect } from '../utils/adRedirect';
import { compressImage, compressVideo } from '../utils/mediaCompressor';
import { getEngagement, subscribeEngagement } from '../utils/newsEngagementStore';
import useLiveRefresh from '../utils/useLiveRefresh';
import { useAuth } from '../contexts/AuthContext';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const MOBILE_BREAKPOINT = 900;

function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = Math.max(0, Number(event?.endCoordinates?.height || 0));
      setInset(nextHeight);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setInset(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return inset;
}

// Real video with audio — public domain MP4
const SAMPLE_REEL_VIDEO       = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_REEL_VIDEO_ALT   = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const SAMPLE_REEL_VIDEO_ALT2  = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('idb-media:')) return true;
  if (url.startsWith('blob:')) return true;
  if (url.startsWith('http://localhost')) return false;
  return true;
}

function isPlayableVideoSource(uri) {
  if (typeof uri !== 'string' || !uri.trim()) return false;
  if (/(youtube\.com|youtu\.be)/i.test(uri)) return false;

  if (Platform.OS !== 'web') return true;
  if (/^(blob:|data:|idb-media:)/i.test(uri)) return true;
  // Android se upload hue video ke URL me extension na ho ya alag ho (.3gp, bina extension) to bhi web par
  // chalna chahiye. Ye function sirf video items ke liye bulaya jaata hai, isliye sirf saaf-saaf image/pdf URL reject karo.
  return /^https?:/i.test(uri) && !/\.(jpe?g|png|gif|webp|bmp|svg|heic|avif|pdf)(\?.*)?(#.*)?$/i.test(uri);
}

// Share Handler
function handleSharePost(post) {
  const shareText = `📰 ${post.headline}\n\n${post.caption}\n\n📍 ${post.location}\n\n🗞️ Read more on RTI News`;
  const shareUrl  = `https://rtinews.in/reel/${post.id}`;
  const fullMsg   = `${shareText}\n${shareUrl}`;

  if (Platform.OS === 'web') {
    return { text: shareText, url: shareUrl };
  }
  Share.share({ message: fullMsg, title: post.headline, url: shareUrl })
    .catch(() => {});
  return null;
}

function normalizeFeedComment(comment = {}, fallbackId = 'cmt-temp', profileByEmail = {}) {
  const authorEmail = String(comment.author_email || comment.user_email || '').trim().toLowerCase();
  const matchedProfile = authorEmail ? profileByEmail[authorEmail] || null : null;
  const authorAvatar = String(
    comment.author_profile_image ||
    comment.profile_image ||
    comment.avatar ||
    matchedProfile?.avatar ||
    matchedProfile?.profile_image ||
    ''
  ).trim();

  return {
    id: String(comment.id || fallbackId),
    user: String(comment.user || comment.author || 'User'),
    author: String(comment.author || comment.user || 'User'),
    author_email: authorEmail,
    author_has_blue_tick: Boolean(comment.author_has_blue_tick || comment.has_blue_tick),
    author_profile_image: authorAvatar,
    avatar: authorAvatar,
    text: String(comment.text || ''),
    likes: Number(comment.likes || 0),
    liked_by: Array.isArray(comment.liked_by) ? comment.liked_by : [],
    date: String(comment.date || ''),
    edited_at: comment.edited_at || null,
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply, index) => normalizeFeedComment(reply, `${fallbackId}-reply-${index + 1}`, profileByEmail))
      : [],
  };
}

function countFeedComments(comments = []) {
  return (Array.isArray(comments) ? comments : []).reduce(
    (total, comment) => total + 1 + countFeedComments(comment.replies),
    0
  );
}

// ✅ Shared engagement store (like / comment / share / view) ko reel post par lagao.
// Kisi bhi screen (Home card, News Details, Profile, ya dusre user ka like) se aaya count yahan turant dikhe.
// ✅ FIX: server ka feed `comments` count kabhi stale/galat hota hai (list me 0 comment, count 1).
// Asli comment list se verify hua count yaha rakhte hain: server wahi stale value dobara push kare to real count dikhao.
const feedCommentVerify = new Map(); // postId -> { server, real }
// ✅ FIX: jin posts ka comment count asli list se confirm ho chuka hai (ya confirm karna possible nahi tha).
// Jab tak confirm nahi, server ka (stale ho sakta hai) count screen par DIKHAYA NAHI jaata — warna
// "1" dikh kar comment kholte hi "0" ho jaata tha.
const feedCommentsConfirmed = new Set();

// ✅ FIX (comment gayab ho jaata tha): abhi user ne jo comment / reply kiya wo server list ya server ke
// stale count me turant nahi aata. Jab tak server list me na dikhe (max 3 min) use local list/count me rakhte hain.
const RECENT_COMMENT_MS = 3 * 60 * 1000;
const feedPendingComments = new Map(); // postId -> [{ comment, replyToId, ts }]
const pendKey = (c) => `${String(c?.text || '').trim()}|${String(c?.author_email || '')}`;
function listHasComment(list, c) {
  return (Array.isArray(list) ? list : []).some((x) =>
    String(x.id) === String(c.id) || pendKey(x) === pendKey(c) || listHasComment(x.replies, c));
}
function addPendingComment(postId, comment, replyToId) {
  const key = String(postId);
  const arr = (feedPendingComments.get(key) || []).filter((p) => Date.now() - p.ts < RECENT_COMMENT_MS);
  arr.push({ comment, replyToId: replyToId || null, ts: Date.now() });
  feedPendingComments.set(key, arr);
}
function removePendingComment(postId, commentId) {
  const key = String(postId);
  const arr = (feedPendingComments.get(key) || []).filter((p) => String(p.comment.id) !== String(commentId));
  if (arr.length) feedPendingComments.set(key, arr); else feedPendingComments.delete(key);
}
function hasRecentPending(postId) {
  const arr = feedPendingComments.get(String(postId));
  return Boolean(arr && arr.some((p) => Date.now() - p.ts < RECENT_COMMENT_MS));
}
function mergePendingComments(postId, serverList) {
  const key = String(postId);
  const pend = feedPendingComments.get(key);
  let out = Array.isArray(serverList) ? serverList : [];
  if (!pend || !pend.length) return out;
  const still = [];
  pend.forEach((p) => {
    if (Date.now() - p.ts >= RECENT_COMMENT_MS) return;
    if (listHasComment(out, p.comment)) return; // server list me aa gaya
    still.push(p);
    if (p.replyToId) {
      out = out.map((c) => (String(c.id) === String(p.replyToId)
        ? { ...c, replies: [...(c.replies || []), p.comment] } : c));
    } else {
      out = [...out, p.comment];
    }
  });
  if (still.length) feedPendingComments.set(key, still); else feedPendingComments.delete(key);
  return out;
}

// Server refresh me wahi stale count wapas aaye to verified real count laga do
function fixStaleCommentCount(post) {
  if (!post || post.isAd) return post;
  const v = feedCommentVerify.get(String(post.id));
  if (v && Number(post.commentsCount) === v.server && v.server !== v.real) {
    return { ...post, commentsCount: v.real };
  }
  return post;
}

function applyFeedEngagement(post, patch) {
  if (!post || !patch || post.isAd) return post;
  let next = post;
  const set = (key, value) => {
    if (next[key] === value) return;
    if (next === post) next = { ...post };
    next[key] = value;
  };
  if (patch.likes !== undefined) set('likes', patch.likes);
  if (patch.liked !== undefined) set('liked', patch.liked);
  if (patch.comments !== undefined) {
    let nextCount = patch.comments;
    if (hasRecentPending(post.id) && Number(nextCount) < Number(post.commentsCount || 0)) nextCount = post.commentsCount;
    const verified = feedCommentVerify.get(String(post.id));
    if (verified) {
      if (Number(nextCount) === verified.server) nextCount = verified.real;
      else feedCommentVerify.delete(String(post.id));
    }
    set('commentsCount', nextCount);
  }
  if (patch.shares !== undefined) set('shares', patch.shares);
  if (patch.views !== undefined) set('views', Math.max(Number(post.views || 0), patch.views));
  return next;
}

// Server se aayi fresh list par local (taza) engagement ka overlay — purane cached count se upar
function overlayFeedEngagement(post) {
  const eng = getEngagement(post?.id);
  return fixStaleCommentCount(eng ? applyFeedEngagement(post, eng) : post);
}

function getDisplayCommentAvatar(comment = {}, fallbackAvatar = '') {
  const avatar = String(
    comment.author_profile_image ||
    comment.avatar ||
    comment.profile_image ||
    fallbackAvatar ||
    ''
  ).trim();
  return avatar;
}

// Icons
function HeartIcon({ filled, size = 24 }) {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24"
        fill={filled ? '#ff3b5c' : 'none'} stroke={filled ? '#ff3b5c' : '#fff'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }
  return <Ionicons name={filled ? 'heart' : 'heart-outline'} size={size} color={filled ? '#ff3b5c' : '#fff'} />;
}

function CommentIcon({ size = 24 }) {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return <Ionicons name="chatbubble-outline" size={size - 2} color="#fff" />;
}

function ShareIcon({ size = 24 }) {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    );
  }
  return <Ionicons name="paper-plane-outline" size={size - 2} color="#fff" />;
}

function MoreDotsIcon({ size = 24 }) {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" stroke="none">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    );
  }
  return <Ionicons name="ellipsis-vertical" size={size - 2} color="#fff" />;
}

function BookmarkIcon({ filled, size = 24 }) {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24"
        fill={filled ? '#f97316' : 'none'} stroke={filled ? '#f97316' : '#fff'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return <Ionicons name={filled ? 'bookmark' : 'bookmark-outline'} size={size - 2} color={filled ? '#f97316' : '#fff'} />;
}

function MuteIcon({ muted, size = 20 }) {
  if (Platform.OS === 'web') {
    return muted ? (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    );
  }
  return (
    <Ionicons
      name={muted ? 'volume-mute' : 'volume-high'}
      size={size}
      color="#fff"
      style={{ textShadowColor: 'rgba(0,0,0,0.65)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
    />
  );
}

// Share Modal
function ShareModal({ visible, onClose, post }) {
  if (!post) return null;

  const shareText = encodeURIComponent(`📰 ${post.headline}\n\n${post.caption}\n\n📍 ${post.location}`);
  const shareUrl  = encodeURIComponent(`https://rtinews.in/reel/${post.id}`);

  const platforms = [
    {
      name: 'WhatsApp',
      emoji: '💬',
      color: '#25D366',
      action: () => {
        const url = `https://wa.me/?text=${shareText}%0A${shareUrl}`;
        Platform.OS === 'web' ? window.open(url, '_blank') : Linking.openURL(url);
      },
    },
    {
      name: 'Telegram',
      emoji: '✈️',
      color: '#0088cc',
      action: () => {
        const url = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
        Platform.OS === 'web' ? window.open(url, '_blank') : Linking.openURL(url);
      },
    },
    {
      name: 'Twitter / X',
      emoji: '🐦',
      color: '#1DA1F2',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        Platform.OS === 'web' ? window.open(url, '_blank') : Linking.openURL(url);
      },
    },
    {
      name: 'Facebook',
      emoji: '📘',
      color: '#1877F2',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        Platform.OS === 'web' ? window.open(url, '_blank') : Linking.openURL(url);
      },
    },
    {
      name: 'Copy Link',
      emoji: '🔗',
      color: '#6b7280',
      action: () => {
        const link = `https://rtinews.in/reel/${post.id}`;
        if (Platform.OS === 'web' && navigator?.clipboard) {
          navigator.clipboard.writeText(link).then(() => Alert.alert('Copied!', 'Link copied to clipboard'));
        } else {
          Alert.alert('Link', link);
        }
        onClose();
      },
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={localShareStyles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={localShareStyles.sheet}>
          <View style={localShareStyles.handle} />
          <Text style={localShareStyles.title}>🚀 Share This Story</Text>

          <View style={localShareStyles.previewBox}>
            <Text style={localShareStyles.previewHeadline} numberOfLines={2}>{post.headline}</Text>
            <Text style={localShareStyles.previewCaption} numberOfLines={2}>{post.caption}</Text>
            <Text style={localShareStyles.previewLocation}>📍 {post.location}</Text>
          </View>

          <View style={localShareStyles.grid}>
            {platforms.map((p) => (
              <TouchableOpacity key={p.name} style={localShareStyles.platformBtn} onPress={p.action} activeOpacity={0.8}>
                <View style={[localShareStyles.platformCircle, { backgroundColor: p.color }]}>
                  <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                </View>
                <Text style={localShareStyles.platformName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={localShareStyles.closeBtn} onPress={onClose}>
            <Text style={localShareStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const localShareStyles = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  handle:          { width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 14 },
  title:           { fontSize: 18, fontWeight: '800', color: '#f1f5f9', textAlign: 'center', marginBottom: 14, letterSpacing: -0.3 },
  previewBox:      { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  previewHeadline: { color: '#f1f5f9', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  previewCaption:  { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginBottom: 6 },
  previewLocation: { color: '#f97316', fontSize: 11, fontWeight: '700' },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 16 },
  platformBtn:     { alignItems: 'center', width: '18%', marginBottom: 8 },
  platformCircle:  { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  platformName:    { color: '#94a3b8', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  closeBtn:        { alignItems: 'center', paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  closeBtnText:    { color: '#64748b', fontSize: 14, fontWeight: '700' },
});

// Description Modal
function DescriptionModal({ visible, onClose, post, onShare, onAddComment, currentUser }) {
  const [text, setText] = useState('');
  const keyboardInset = useKeyboardInset();
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();
  const currentUserHasBlueTick = Boolean(currentUser && UserStore.hasBlueTick(currentUser));
  const currentUserAvatar = String(currentUser?.avatar || currentUser?.profile_image || '').trim();
  const authorEmail = String(post?.createdBy || post?.created_by || '').trim().toLowerCase();
  const isOwnPost = Boolean(authorEmail && currentUserEmail && authorEmail === currentUserEmail);
  // Apni post: current (backend-synced) user ka status. Dusron ki: feed ka backend flag.
  const verified = isOwnPost
    ? currentUserHasBlueTick
    : Boolean(
        post?.verified ||
        post?.author_has_blue_tick ||
        post?.has_blue_tick ||
        post?.authorHasBlueTick ||
        post?.createdByBlueTick
      );

  useEffect(() => {
    if (visible) setText('');
  }, [visible, post?.id]);

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <TouchableOpacity
            style={{ flex: 0.14, backgroundColor: 'transparent' }}
            activeOpacity={1}
            onPress={onClose}
          />

          <View style={{
            flex: 0.86,
            backgroundColor: '#0f172a',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 0,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginTop: 10, marginBottom: 14 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
            <ProfileAvatar
              uri={post.avatar || post.author_profile_image}
              size={40}
              style={{ marginRight: 10 }}
              imageStyle={{ borderWidth: 2, borderColor: '#f97316' }}
              placeholderStyle={{ borderWidth: 2, borderColor: '#f97316', backgroundColor: 'rgba(255,255,255,0.08)' }}
              iconColor="#ffffff"
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{post.user}</Text>
                {verified ? <VerifiedBadge size={16} /> : null}
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>{post.role} · {post.time}</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 }}
              onPress={onShare}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 20 }}>
              <Text style={{ fontWeight: '800' }}>{post.user} </Text>
              {post.caption}
            </Text>
            {post.location ? (
              <Text style={{ color: '#f97316', fontSize: 11, fontWeight: '600', marginTop: 4 }}>📍 {post.location}</Text>
            ) : null}
          </View>

          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16, marginBottom: 10 }} />

          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {Array.isArray(post.comments) && post.comments.length === 0 && (
              <Text style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginVertical: 16 }}>No comments yet. Be the first! 👇</Text>
            )}
            {Array.isArray(post.comments) && post.comments.map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' }}>
                <ProfileAvatar
                  uri={getDisplayCommentAvatar(c)}
                  size={32}
                  style={{ marginRight: 10 }}
                  imageStyle={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                  placeholderStyle={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                  iconColor="#ffffff"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 18 }}>
                    <Text style={{ fontWeight: '800' }}>{c.user} </Text>
                    {c.text}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                    <Text style={{ color: '#64748b', fontSize: 11 }}>{c.date || ''}</Text>
                    <TouchableOpacity><Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700' }}>Reply</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>♡</Text>
                  <Text style={{ color: '#64748b', fontSize: 10 }}>{c.likes || ''}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'android' ? Math.max(12, keyboardInset) : 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 10 }}>
            <ProfileAvatar
              uri={currentUserAvatar}
              size={32}
              placeholderStyle={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              iconColor="#ffffff"
            />
            <TextInput
              style={{
                flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 20, paddingHorizontal: 14, fontSize: 13, color: '#f1f5f9',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
              }}
              placeholder={`Add a comment for ${post.user}...`}
              placeholderTextColor="#64748b"
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' }}
              onPress={async () => {
                if (!text.trim()) return;
                await onAddComment?.(text.trim(), null, post.id);
                setText('');
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Dummy Data
const DUMMY_POSTS = [
  {
    id: '1', user: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/100?img=11',
    verified: false, role: 'RTI Activist', location: 'Lucknow, Uttar Pradesh', time: '2 min ago',
    type: 'video', media: SAMPLE_REEL_VIDEO,
    thumbnail: 'https://picsum.photos/seed/rti1/600/900',
    headline: 'RTI exposed missing water supply funds!',
    caption: 'Ward 14 in Lucknow had no water for 3 months. Filed an RTI, got a response in 30 days — pipeline repair budget was finally released. 🎉 #RTI #JanAdhikar #Water',
    fullDescription: 'Under the Right to Information Act 2005, I filed an application to the Municipal Corporation seeking records of water pipeline maintenance for Ward 14. After initial denial and first appeal, the information was finally provided revealing Rs. 14 lakh allocated for repairs had not been utilized for over 2 years. Following media coverage of the RTI response, the civic body released the funds and work commenced within 15 days. This is the power of RTI — every citizen can hold their government accountable.',
    likes: 1240, shares: 312,
    comments: [{ id: 'c1', user: 'Priya Verma', text: 'Great work bhai! 👏' }, { id: 'c2', user: 'Mohan Lal', text: 'RTI is a powerful tool!' }],
    liked: false, bookmarked: false, tag: 'Success Story', tagColor: '#16a34a',
  },
  {
    id: '2', user: 'Anjali Singh', avatar: 'https://i.pravatar.cc/100?img=47',
    verified: false, role: 'Teacher', location: 'Bhopal, Madhya Pradesh', time: '15 min ago',
    type: 'video', media: SAMPLE_REEL_VIDEO_ALT,
    thumbnail: 'https://picsum.photos/seed/rti2/600/900',
    headline: 'Where did the school funds go? Filed an RTI!',
    caption: 'Government Primary School No. 7 had no account of mid-day meal funds. Filed an RTI — documents requested within 20 days. #RTI #Education',
    fullDescription: 'As a teacher in a government primary school, I noticed discrepancies in the mid-day meal scheme records. Children were not receiving adequate meals despite full budget allocation. I filed an RTI application to the District Education Office requesting meal distribution records and fund utilization reports for the past 3 years. The response revealed significant irregularities which have now been referred to the State Vigilance Commission.',
    likes: 890, shares: 145,
    comments: [{ id: 'c3', user: 'Admin RTI', text: 'Best of luck!' }],
    liked: false, bookmarked: false, tag: 'Application Filed', tagColor: '#2563eb',
  },
  {
    id: '3', user: 'Vikram Patel', avatar: 'https://i.pravatar.cc/100?img=33',
    verified: false, role: 'Journalist', location: 'Ahmedabad, Gujarat', time: '1 hr ago',
    type: 'video', media: SAMPLE_REEL_VIDEO_ALT2,
    thumbnail: 'https://picsum.photos/seed/rti3/600/900',
    headline: 'Road built after RTI — this is people power!',
    caption: 'Narol area had no road for 2 years. Filed RTI and PWD started work within 15 days. 🛣️ #RTI #Gujarat',
    fullDescription: 'The residents of Narol locality had been complaining about a broken road for over 2 years. Multiple petitions went unheard. Using the RTI Act, I filed an application to the Public Works Department asking for the status of funds allocated for road repair under PMGSY. The RTI response revealed the funds had been sitting idle. Within 2 weeks of the RTI response being made public, the PWD commenced road construction. This story proves that transparency is the best weapon against government inaction.',
    likes: 3120, shares: 890,
    comments: [{ id: 'c5', user: 'Neha Shah', text: 'Inspiring!' }, { id: 'c6', user: 'Suresh Bhai', text: 'How did you file it?' }],
    liked: true, bookmarked: false, tag: 'Victory', tagColor: '#d97706',
  },
  {
    id: '4', user: 'Dr. Meera Devi', avatar: 'https://i.pravatar.cc/100?img=25',
    verified: false, role: 'Doctor & Activist', location: 'Patna, Bihar', time: '3 hrs ago',
    type: 'video', media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://picsum.photos/seed/rti4/600/900',
    headline: 'Where is the hospital medicine stock?',
    caption: 'Essential medicines were out of stock at Patna Civil Hospital. Filed an RTI for medicine purchase records. 💊 #RTI #Health',
    fullDescription: 'Essential medicines including antibiotics, antihypertensives and diabetes medication were consistently out of stock at Patna Civil Hospital for months. Patients were being forced to buy expensive medicines from private pharmacies. I filed an RTI application to the Civil Surgeon office demanding medicine procurement records, stock registers and expenditure statements. The documents revealed systematic pilferage and a parallel black market operation. The matter is now under CBI investigation.',
    likes: 2050, shares: 567,
    comments: [{ id: 'c8', user: 'Asha Devi', text: 'Same problem here!' }],
    liked: false, bookmarked: true, tag: 'Health RTI', tagColor: '#dc2626',
  },
  {
    id: '5', user: 'RTI Portal Official', avatar: 'https://i.pravatar.cc/100?img=60',
    verified: false, role: 'Official Account', location: 'New Delhi', time: '5 hrs ago',
    type: 'video', media: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    thumbnail: 'https://picsum.photos/seed/rti5/600/900',
    headline: 'File RTI from home — takes just 5 minutes!',
    caption: '📢 File RTI online at rtionline.gov.in. No fee, no agents! #RTIOnline #DigitalIndia',
    fullDescription: 'The RTI Online Portal (rtionline.gov.in) allows any Indian citizen to file an RTI application from their home in under 5 minutes. No fee is required for BPL cardholders. The application fee is just Rs. 10 for others (payable online). You can track your application status, receive responses digitally, and file first appeals — all without visiting any government office. Over 2 crore RTI applications have been filed online since 2013. Know your rights, exercise your rights.',
    likes: 8910, shares: 4200,
    comments: [{ id: 'c10', user: 'Raj Mishra', text: 'Very useful!' }],
    liked: false, bookmarked: false, tag: 'Official Update', tagColor: '#7c3aed',
  },
];

function feedPostFromNewsItem(item = {}, currentEmail = '') {
  const videoUri = String(
    typeof item.video === 'string'
      ? item.video
      : item.video?.uri || ''
  ).trim();
  const firstImage = Array.isArray(item.images)
    ? item.images.find((uri) => typeof uri === 'string' && uri.trim())
    : '';
  const imageUri = String(item.thumbnail || item.image || firstImage || '').trim();
  const isVideo = Boolean(videoUri);
  const authorEmail = String(item.createdBy || item.created_by || '').trim().toLowerCase();
  const title = String(item.title || item.headline || 'News Update').trim();
  const subtitle = String(item.subtitle || item.caption || '').trim();
  const description = String(item.description || item.fullDescription || subtitle || '').trim();
  const commentsList = Array.isArray(item.comments_list) ? item.comments_list : [];
  const likedBy = Array.isArray(item.liked_by) ? item.liked_by : [];

  return {
    id: String(item.id || `feed-${Date.now()}`),
    user: String(item.author_name || item.createdByName || item.createdBy || 'User'),
    avatar: String(item.author_profile_image || item.authorProfileImage || item.createdByProfileImage || item.profile_image || ''),
    verified: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick),
    author_has_blue_tick: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick),
    role: String(item.author_role_label || item.authorRoleLabel || item.author_role || item.authorRole || ''),
    location: String(item.author_seat_name || item.authorSeatName || [item.taluka, item.district, item.state].filter(Boolean).join(', ') || 'India'),
    time: String(item.time || item.createdAt || item.date || ''),
    type: isVideo ? 'video' : 'image',
    media: isVideo ? videoUri : imageUri,
    video: isVideo ? videoUri : null,
    thumbnail: imageUri,
    image: imageUri,
    headline: title,
    caption: subtitle || description,
    fullDescription: description || subtitle || title,
    likes: Number(item.likes || 0),
    shares: Number(item.shares || 0),
    comments: commentsList,
    commentsCount: Number(item.comments ?? commentsList.length ?? 0),
    views: Number(item.views ?? item.views_count ?? item.view_count ?? 0),
    liked: Boolean(currentEmail && likedBy.includes(currentEmail)),
    bookmarked: Boolean(item.bookmarked),
    tag: String(item.report_type || item.category || item.state || 'General'),
    tagColor: '#16a34a',
    createdAt: item.createdAt || item.date || null,
    createdBy: authorEmail,
    author_id: item.author_id ?? item.authorId ?? null,
  };
}

// Profile grid (Reels / Ads tab) se aaya item -> Feed (ReelCard) ke item me convert.
// Reel: FeedScreen ke fetch wala hi media/kind logic. Ad: feedPostFromAdItem (wahi sponsored card).
function feedPostFromProfileItem(item = {}, currentEmail = '') {
  if (!item || typeof item !== 'object') return null;
  const isAdItem = Boolean(item.isAd || item.is_ad || item.post_type === 'ad');
  if (isAdItem) {
    const rawAdId = item.ad_id ?? item.originalAdId ?? String(item.id || '').replace(/^ad-(feed-)?/, '');
    return feedPostFromAdItem({ ...item, id: rawAdId });
  }
  const mt = String(item.mediaType || '');
  const rawMedia = typeof item.media === 'string' ? item.media.trim() : '';
  const isHttp = /^https?:/i.test(rawMedia);
  const videoFromItem = String(typeof item.video === 'string' ? item.video : item.video?.uri || '').trim();
  let kind;
  if (mt === 'Video') kind = 'video';
  else if (mt === 'File') kind = 'pdf';
  else if (mt === 'Link') kind = 'link';
  else if (mt === 'Image') kind = 'image';
  else kind = (videoFromItem || (isHttp && /\.(mp4|m4v|mov|webm|ogv|m3u8)(\?.*)?$/i.test(rawMedia))) ? 'video' : 'image';
  const videoUri = kind === 'video' ? (videoFromItem || (isHttp ? rawMedia : '')) : '';
  const imagesList = kind === 'image' && Array.isArray(item.images)
    ? item.images.filter((u) => typeof u === 'string' && u.trim())
    : [];
  const imageUri = kind === 'image'
    ? String(item.thumbnail || item.image || imagesList[0] || (isHttp ? rawMedia : '') || '').trim()
    : '';
  if (kind === 'image' && !imagesList.length && imageUri) imagesList.push(imageUri);
  const docUrl = (kind === 'pdf' || kind === 'link') && isHttp ? rawMedia : '';
  const avatarRaw = item.avatar || item.author_profile_image || '';
  return {
    ...item,
    id: String(item.id || Date.now()),
    type: kind,
    media: kind === 'video' ? videoUri : kind === 'image' ? imageUri : docUrl,
    video: kind === 'video' ? videoUri : null,
    thumbnail: kind === 'video' ? String(item.thumbnail || '') : imageUri,
    image: imageUri,
    images: imagesList,
    avatar: isValidImageUrl(avatarRaw) ? avatarRaw : null,
    comments: [],
    commentsCount: Number(item.commentsCount ?? item.comments_count ?? (typeof item.comments === 'number' ? item.comments : 0)) || 0,
    liked: Boolean(
      item.liked_by_me === true ||
      item.liked === true ||
      (currentEmail && Array.isArray(item.liked_by) &&
        item.liked_by.some((e) => String(e || '').trim().toLowerCase() === currentEmail))
    ),
    bookmarked: Boolean(item.bookmarked),
    likes: Number(item.likes) || 0,
    shares: Number(item.shares) || 0,
  };
}

function feedPostFromAdItem(ad = {}) {
  const title = String(ad.title || 'Sponsored Advertisement').trim();
  const description = String(ad.description || '').trim();
  const location = [ad.district, ad.state].filter(Boolean).join(', ') || 'Sponsored';
  const images = Array.from(new Set([
    ad.photo,
    ad.image,
    ...(Array.isArray(ad.images) ? ad.images.map((item) => typeof item === 'string' ? item : (item?.url || item?.image_url || item?.image || '')) : []),
  ].filter(Boolean)));
  const video = String(ad.video || ad.video_url || '').trim();
  const cover = images[0] || '';

  return {
    id: String(ad.feed_id || `ad-feed-${ad.id || Date.now()}`),
    isAd: true,
    originalAdId: ad.id,
    user: String(ad.owner_name || 'Advertiser'),
    avatar: String(ad.owner_profile_image || ''),
    verified: Boolean(ad.owner_has_blue_tick),
    author_has_blue_tick: Boolean(ad.owner_has_blue_tick),
    role: 'Sponsored',
    location,
    time: String(ad.updated_at || ad.created_at || ''),
    type: video ? 'video' : 'image',
    media: video || cover,
    video: video || null,
    images,
    thumbnail: cover,
    image: cover,
    headline: title,
    caption: description,
    fullDescription: description || title,
    likes: 0,
    shares: 0,
    comments: [],
    commentsCount: 0,
    liked: false,
    bookmarked: false,
    tag: 'Sponsored',
    tagColor: '#F97316',
    createdAt: ad.created_at || null,
    createdBy: String(ad.owner_email || '').trim().toLowerCase(),
    redirect: ad.redirect || '',
    extraValues: ad.extraValues || {},
    allowCalls: ad.allowCalls !== false,
  };
}

function interleaveSponsoredPosts(posts = [], ads = []) {
  // ✅ Ad-free user ko bhi feed ads dikhte hain (sirf popup band hota hai)
  if (!Array.isArray(ads) || ads.length === 0) return posts;
  if (!Array.isArray(posts) || posts.length === 0) return ads;
  const mixed = [];
  let adIndex = 0;
  posts.forEach((post, index) => {
    mixed.push(post);
    if ((index + 1) % 3 === 0 && adIndex < ads.length) {
      mixed.push(ads[adIndex]);
      adIndex += 1;
    }
  });
  return [...mixed, ...ads.slice(adIndex)];
}

// Upload Modal
function UploadModal({ visible, onClose, onPost }) {
  const [caption, setCaption] = useState('');
  const [headline, setHeadline] = useState('');
  const [tag, setTag] = useState('Success Story');
  const [mediaUri, setMediaUri] = useState('');
  const [mediaType, setMediaType] = useState('Video');
  const [picking, setPicking] = useState(false);
  // Camera + Music/Voice editor (Add News jaisa)
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState('video');
  const [audioEditorVisible, setAudioEditorVisible] = useState(false);
  const [audioMix, setAudioMix] = useState(null); // { music, musicId, musicUrl, musicVolume, voiceUri, muteOriginal }
  const tagOptions = ['Success Story', 'Application Filed', 'Victory', 'Question', 'Official Update', 'Corruption Exposed'];

  // Native par video aate hi Music / Voice editor khol do (original awaaz mute)
  const openEditorForVideo = () => {
    if (Platform.OS === 'web') return;
    setTimeout(() => setAudioEditorVisible(true), 350);
  };

  const openCamera = async (mode = 'video') => {
    if (Platform.OS === 'web') {
      try {
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: mode === 'video' ? ['videos'] : ['images'],
          quality: 0.7,
          videoMaxDuration: 60,
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          handleCaptured({ type: a.type === 'video' ? 'video' : 'photo', uri: a.uri });
        }
      } catch {
        Alert.alert('Camera', 'Unable to open camera.');
      }
      return;
    }
    setCameraMode(mode);
    setCameraVisible(true);
  };

  const handleCaptured = ({ type, uri }) => {
    if (!uri) return false;
    setAudioMix(null);
    if (type === 'video') {
      setMediaType('Video');
      setMediaUri(uri);
      openEditorForVideo();
    } else {
      setMediaType('Image');
      setMediaUri(uri);
    }
    setCameraVisible(false);
    return true;
  };

  const pickMedia = async () => {
    if (picking) return;
    setPicking(true);
    try {
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['video/*', 'image/*'],
          multiple: false,
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets?.[0] || result;
        if (!asset?.uri) return;
        const isVideo = String(asset.mimeType || asset.type || '').toLowerCase().startsWith('video');
        const persisted = await storeWebUriToIdbMedia(asset.uri, {
          prefix: isVideo ? 'video' : 'image',
          mimeType: asset.mimeType || '',
        });
        setMediaType(isVideo ? 'Video' : 'Image');
        setMediaUri(persisted);
        setAudioMix(null);
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow media access to upload a reel.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.All || undefined,
        allowsMultipleSelection: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const isVideo = asset.type === 'video' || String(asset.mimeType || '').startsWith('video/');
      if (!isVideo) {
        const comp = await compressImage(asset.uri, { maxWidth: 1280, maxHeight: 1280, quality: 0.7 });
        setMediaType('Image');
        setMediaUri(comp?.uri || asset.uri);
      } else {
        const vComp = await compressVideo(asset);
        if (!vComp.ok) {
          Alert.alert('Video too large', vComp.message || 'Please select a video under 10 MB.');
          return;
        }
        setMediaType('Video');
        setMediaUri(asset.uri);
        openEditorForVideo();
      }
      setAudioMix(null);
    } catch {
      Alert.alert('Upload failed', 'Unable to select this media.');
    } finally {
      setPicking(false);
    }
  };

  const handlePost = () => {
    if (!caption.trim()) { Alert.alert('Caption required', 'Please write something.'); return; }
    if (!mediaUri) { Alert.alert('Media required', 'Please choose a video or photo.'); return; }
    const mix = (mediaType === 'Video' && audioMix && (audioMix.musicId || audioMix.voiceUri)) ? audioMix : null;
    onPost({ caption, headline, tag, mediaUri, mediaType, audioMix: mix });
    setCaption('');
    setHeadline('');
    setMediaUri('');
    setMediaType('Video');
    setAudioMix(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <VideoAudioEditorModal
          visible={audioEditorVisible}
          videoUri={mediaType === 'Video' ? mediaUri : null}
          initial={audioMix}
          onClose={() => setAudioEditorVisible(false)}
          onDone={(mix) => {
            setAudioMix(mix.musicId || mix.voiceUri ? mix : null);
            setAudioEditorVisible(false);
          }}
        />
        <NewsCameraModal
          visible={cameraVisible}
          initialMode={cameraMode}
          onClose={() => setCameraVisible(false)}
          onCapture={handleCaptured}
        />
        <View style={styles.uploadSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>📰 New Post</Text>
          <TouchableOpacity style={styles.mediaBox} activeOpacity={0.7} onPress={pickMedia}>
            <Text style={styles.mediaBoxIcon}>🎥</Text>
            <Text style={styles.mediaBoxText}>{mediaUri ? `${mediaType} selected` : (picking ? 'Opening...' : 'Add Video / Photo')}</Text>
            <Text style={styles.mediaBoxSub}>{mediaUri ? 'Tap to change media' : '(choose from gallery)'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => openCamera('video')}
              activeOpacity={0.85}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <Ionicons name="camera-outline" size={18} color="#f1f5f9" />
              <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: '700' }}>Camera</Text>
            </TouchableOpacity>
            {mediaUri && mediaType === 'Video' && Platform.OS !== 'web' ? (
              <TouchableOpacity
                onPress={() => setAudioEditorVisible(true)}
                activeOpacity={0.85}
                style={{ flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#ea580c' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
                  {audioMix?.musicId || audioMix?.voiceUri
                    ? `${audioMix.music?.title ? '🎵 ' + audioMix.music.title : ''}${audioMix.voiceUri ? '  🎙️ My Voice' : ''} (Edit)`
                    : '🎵 Add Music  /  🎙️ Record Voice'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput style={[styles.captionInput, { minHeight: 44, marginBottom: 10 }]} placeholder="Headline..." placeholderTextColor="#475569" value={headline} onChangeText={setHeadline} maxLength={100} />
          <TextInput style={styles.captionInput} placeholder="Write your RTI story..." placeholderTextColor="#475569" multiline value={caption} onChangeText={setCaption} maxLength={300} />
          <Text style={styles.charCount}>{caption.length}/300</Text>
          <Text style={styles.tagLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
            {tagOptions.map((t) => (
              <TouchableOpacity key={t} style={[styles.tagChip, tag === t && styles.tagChipActive]} onPress={() => setTag(t)}>
                <Text style={[styles.tagChipText, tag === t && styles.tagChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.postBtn} onPress={handlePost}><Text style={styles.postBtnText}>Post 🚀</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Comments Modal
function CommentsModal({ visible, onClose, post, comments, onAddComment, onEditComment, onDeleteComment, onLikeComment }) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');
  const keyboardInset = useKeyboardInset();
  const { height: WH, width: WW } = useWindowDimensions();
  // ✅ Web desktop par comments Instagram ki tarah RIGHT side panel me khulein (video dikhta rahe);
  // mobile / chhoti screen par pehle jaisa bottom sheet.
  const isDesktopWeb = Platform.OS === 'web' && WW >= 900;
  const WEB_PANEL_TOP = 90; // top navbar ki height
  const WEB_PANEL_WIDTH = Math.min(420, Math.max(340, WW * 0.28));
  const safeComments = Array.isArray(comments) ? comments : [];

  useEffect(() => {
    if (visible) {
      const getCurrentUser = async () => {
        try {
          const user = await UserStore.getCurrentUser();
          if (user) {
            if (user.email) {
              setCurrentUserEmail(String(user.email).trim().toLowerCase());
            }
            const realName = String(user.name || user.full_name || user.username || user.email?.split('@')[0] || 'User');
            setCurrentUserName(realName.trim());
            setCurrentUserAvatar(String(user.profile_image || user.avatar || '').trim());
          }
        } catch (error) {
          console.error('Error getting current user:', error);
        }
      };
      getCurrentUser();
      setExpandedReplyThreads({});
    }
  }, [visible]);
  const totalCount = safeComments.reduce((sum, c) => sum + 1 + (Array.isArray(c.replies) ? c.replies.length : 0), 0);

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEdit = async () => {
    if (!editingCommentText.trim()) return;
    if (onEditComment) {
      await onEditComment(editingCommentId, editingCommentText.trim());
    }
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleReplyComment = (commentId) => {
    const nextReplyTarget = safeComments.find((comment) => comment.id === commentId) || null;
    setReplyTo(nextReplyTarget);
    setExpandedReplyThreads((prev) => ({ ...prev, [commentId]: true }));
    setReplyingToCommentId(commentId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyingToCommentId(null);
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    if (onAddComment) {
      await onAddComment(replyText.trim(), replyingToCommentId);
    }
    if (replyingToCommentId) {
      setExpandedReplyThreads((prev) => ({ ...prev, [replyingToCommentId]: true }));
    }
    setReplyTo(null);
    setReplyingToCommentId(null);
    setReplyText('');
  };

  const handleToggleReplies = (commentId) => {
    setExpandedReplyThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <View style={[
        styles.modalOverlay,
        isDesktopWeb && { backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'flex-start' },
      ]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[
          styles.commentsSheet,
          isDesktopWeb
            ? {
                width: WEB_PANEL_WIDTH,
                height: WH - WEB_PANEL_TOP,
                maxHeight: WH - WEB_PANEL_TOP,
                minHeight: 0,
                marginTop: WEB_PANEL_TOP,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                boxShadow: '-6px 0 24px rgba(0,0,0,0.45)',
              }
            : { height: WH * 0.86 },
        ]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Comments {totalCount ? `(${totalCount})` : ''}</Text>
          {post ? (
            <View style={{ marginBottom: 10 }}>
              {post.headline ? <Text style={styles.commentPostHeadline} numberOfLines={2}>{post.headline}</Text> : null}
              {post.caption ? <Text style={styles.commentPostCaption} numberOfLines={2}>{post.caption}</Text> : null}
            </View>
          ) : null}
          <ScrollView
            style={{ flex: 1, minHeight: 120, marginBottom: 10 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {safeComments.length === 0 && <Text style={styles.noComments}>No comments yet. Be the first! 👇</Text>}
            {safeComments.map((c) => {
              const ownerMatch = (
                (currentUserEmail && String(c.author_email || '').trim().toLowerCase() === currentUserEmail) ||
                (currentUserName && String(c.user || c.author || '').trim().toLowerCase() === currentUserName.trim().toLowerCase())
              );
              const liked = Array.isArray(c.liked_by) && currentUserEmail && c.liked_by.includes(currentUserEmail);
              const replyCount = Array.isArray(c.replies) ? c.replies.length : 0;
              const areRepliesExpanded = Boolean(expandedReplyThreads[c.id]);

              return (
                <View key={c.id} style={styles.commentRow}>
                  <ProfileAvatar
                    uri={getDisplayCommentAvatar(c)}
                    size={34}
                    style={styles.commentAvatar}
                    imageStyle={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                    placeholderStyle={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    iconColor="#ffffff"
                  />
                  <View style={styles.commentBubble}>
                    <View style={styles.commentTopRow}>
                      <NameWithTick name={c.user} show={Boolean(c.author_has_blue_tick)} style={styles.commentUser} badgeSize={13} />
                      <Text style={styles.commentDate}>{c.date || ''}{c.edited_at ? ' • Edited' : ''}</Text>
                    </View>

                    {editingCommentId === c.id ? (
                      <TextInput
                        style={styles.commentEditInput}
                        value={editingCommentText}
                        onChangeText={setEditingCommentText}
                        multiline
                      />
                    ) : (
                      <Text style={styles.commentText}>{c.text}</Text>
                    )}

                    <View style={styles.commentActionRow}>
                      <TouchableOpacity
                        style={[styles.commentActionBtn, liked && styles.commentActionBtnActive]}
                        onPress={() => onLikeComment && onLikeComment(c.id)}
                      >
                        <Text style={[styles.commentActionText, liked && styles.commentActionTextActive]}>
                          {liked ? '♥' : '♡'} {c.likes ? `(${c.likes})` : ''}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => handleReplyComment(c.id)}
                      >
                        <Text style={styles.commentActionText}>Reply</Text>
                      </TouchableOpacity>

                      {ownerMatch ? (
                        editingCommentId === c.id ? (
                          <>
                            <TouchableOpacity style={styles.commentMiniBtn} onPress={handleSaveEdit}>
                              <Text style={styles.commentMiniBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.commentMiniBtn} onPress={handleCancelEdit}>
                              <Text style={styles.commentMiniBtnText}>Cancel</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <TouchableOpacity style={styles.commentMiniBtn} onPress={() => handleStartEdit(c)}>
                              <Text style={styles.commentMiniBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.commentMiniBtn} onPress={() => onDeleteComment && onDeleteComment(c.id)}>
                              <Text style={[styles.commentMiniBtnText, { color: '#ef4444' }]}>Delete</Text>
                            </TouchableOpacity>
                          </>
                        )
                      ) : null}
                    </View>

                    {replyingToCommentId === c.id && (
                      <View style={styles.commentReplyForm}>
                        <TextInput
                          style={styles.commentReplyInput}
                          placeholder="Write a reply..."
                          placeholderTextColor="#94a3b8"
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                        />
                        <View style={styles.commentReplyActions}>
                          <TouchableOpacity
                            style={styles.commentReplyBtn}
                            onPress={handleSubmitReply}
                            disabled={!replyText.trim()}
                          >
                            <Text style={styles.commentReplyBtnText}>Reply</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.commentReplyBtn, styles.commentCancelBtn]}
                            onPress={handleCancelReply}
                          >
                            <Text style={styles.commentCancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {replyCount > 0 && (
                      <View style={styles.commentRepliesWrap}>
                        <TouchableOpacity
                          style={styles.commentRepliesToggle}
                          onPress={() => handleToggleReplies(c.id)}
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
                        {c.replies.map((reply) => {
                          const replyOwnerMatch = (
                            (currentUserEmail && String(reply.author_email || '').trim().toLowerCase() === currentUserEmail) ||
                            (currentUserName && String(reply.user || reply.author || '').trim().toLowerCase() === currentUserName.trim().toLowerCase())
                          );
                          const replyLiked = Array.isArray(reply.liked_by) && currentUserEmail && reply.liked_by.includes(currentUserEmail);

                          return (
                            <View key={reply.id} style={styles.commentReplyItem}>
                              <View style={styles.commentReplyRow}>
                                <ProfileAvatar
                                  uri={getDisplayCommentAvatar(reply)}
                                  size={28}
                                  style={styles.commentReplyAvatar}
                                  imageStyle={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                                  placeholderStyle={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                                  iconColor="#ffffff"
                                />
                                <View style={{ flex: 1 }}>
                                  <View style={styles.commentTopRow}>
                                    <NameWithTick name={reply.author || 'User'} show={Boolean(reply.author_has_blue_tick)} style={styles.commentAuthor} badgeSize={12} />
                                    <Text style={styles.commentDate}>{reply.date || ''}{reply.edited_at ? ' • Edited' : ''}</Text>
                                  </View>

                                  {editingCommentId === reply.id ? (
                                    <TextInput
                                      style={styles.commentEditInput}
                                      value={editingCommentText}
                                      onChangeText={setEditingCommentText}
                                      multiline
                                    />
                                  ) : (
                                    <Text style={styles.commentText}>{reply.text}</Text>
                                  )}

                                  <View style={styles.commentActionRow}>
                                    <TouchableOpacity
                                      style={[styles.commentActionBtn, replyLiked && styles.commentActionBtnActive]}
                                      onPress={() => onLikeComment && onLikeComment(reply.id)}
                                    >
                                      <Text style={[styles.commentActionText, replyLiked && styles.commentActionTextActive]}>
                                        {replyLiked ? '♥' : '♡'} {reply.likes ? `(${reply.likes})` : ''}
                                      </Text>
                                    </TouchableOpacity>

                                    {replyOwnerMatch ? (
                                      editingCommentId === reply.id ? (
                                        <>
                                          <TouchableOpacity style={styles.commentMiniBtn} onPress={handleSaveEdit}>
                                            <Text style={styles.commentMiniBtnText}>Save</Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity style={styles.commentMiniBtn} onPress={handleCancelEdit}>
                                            <Text style={styles.commentMiniBtnText}>Cancel</Text>
                                          </TouchableOpacity>
                                        </>
                                      ) : (
                                        <>
                                          <TouchableOpacity style={styles.commentMiniBtn} onPress={() => handleStartEdit(reply)}>
                                            <Text style={styles.commentMiniBtnText}>Edit</Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity style={styles.commentMiniBtn} onPress={() => onDeleteComment && onDeleteComment(reply.id)}>
                                            <Text style={[styles.commentMiniBtnText, { color: '#ef4444' }]}>Delete</Text>
                                          </TouchableOpacity>
                                        </>
                                      )
                                    ) : null}
                                  </View>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.commentInputRow, { paddingBottom: Platform.OS === 'android' ? Math.max(12, keyboardInset) : 12 }]}>
            <ProfileAvatar uri={currentUserAvatar} size={32} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              {replyTo ? (
                <View style={styles.replyingPill}>
                  <Text style={styles.replyingText}>Replying to {replyTo.user}</Text>
                  <TouchableOpacity onPress={() => setReplyTo(null)}>
                    <Text style={styles.replyingClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <TextInput
                style={styles.commentInput}
                placeholder={replyTo ? `Reply to ${replyTo.user}...` : 'Write a comment...'}
                placeholderTextColor="#475569"
                value={text}
                onChangeText={setText}
              />
            </View>
            <TouchableOpacity style={styles.sendBtn} onPress={() => { if (!text.trim()) return; onAddComment(text.trim()); setText(''); }}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeBtnText}>Close</Text></TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Action Column
// Look: Instagram Reels jaisa — sirf icon + count, peeche koi black circle/shadow nahi.
// Neeche 3 dots (⋮) button: usme Views count + Upload date/time dikhta hai.
function ActionColumn({ post, onLike, onComment, onShare, onBookmark, onDescription, onMore, scaleAnim, isMobileLayout, bottomInset = 0 }) {
  const formatCount = (n) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
    n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n);

  // ✅ FIX: post.likes ab backend se aata hua TRUE total hai (apna like bhi
  // usme already included hai), isliye yahan +1 add nahi karna.
  const likeCount    = formatCount(Number(post.likes));
  const shareCount   = formatCount(Number(post.shares));
  // ✅ FIX: count confirm hone tak khaali (galat "1" / "0" flash na ho)
  const commentCount = post.commentsPending
    ? ''
    : (post.commentsCount ?? (Array.isArray(post.comments) ? post.comments.length : 0));

  const iconSz = isMobileLayout ? 30 : 32;

  // Bina background ke icon button (koi circle / black shadow nahi)
  const iconWrap = {
    width: iconSz + 10, height: iconSz + 10,
    alignItems: 'center', justifyContent: 'center',
  };

  const containerStyle = isMobileLayout
    ? { position: 'absolute', right: 8, top: '50%', marginTop: -70, alignItems: 'center', gap: 16, zIndex: 20 }
    : { width: 90, paddingLeft: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', height: '100%', gap: 22, flexShrink: 0 };

  const btn          = { alignItems: 'center', gap: 2 };
  const countStyle   = { color: '#fff', fontSize: 13, fontWeight: '600' };
  const labelStyle   = { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' };

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={btn} onPress={() => onLike(post.id)} activeOpacity={0.75}>
        <Animated.View style={[iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <HeartIcon filled={post.liked} size={iconSz} />
        </Animated.View>
        <Text style={[countStyle, { color: post.liked ? '#ff3b5c' : '#fff' }]}>{likeCount}</Text>
        {!isMobileLayout ? <Text style={labelStyle}>Like</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity style={btn} onPress={() => onComment(post.id)} activeOpacity={0.75}>
        <View style={iconWrap}><CommentIcon size={iconSz} /></View>
        <Text style={countStyle}>{commentCount}</Text>
        {!isMobileLayout ? <Text style={labelStyle}>Comment</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity style={btn} onPress={() => onShare(post.id)} activeOpacity={0.75}>
        <View style={iconWrap}><ShareIcon size={iconSz} /></View>
        <Text style={countStyle}>{shareCount}</Text>
        {!isMobileLayout ? <Text style={labelStyle}>Share</Text> : null}
      </TouchableOpacity>

      {/* 3 dots — Views count + Upload date/time yahan se dikhte hain */}
      {!post.isAd ? (
        <TouchableOpacity style={btn} onPress={() => onMore?.(post)} activeOpacity={0.75} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <View style={iconWrap}><MoreDotsIcon size={iconSz} /></View>
        </TouchableOpacity>
      ) : null}

      {/* Save (bookmark) button abhi ke liye hata diya gaya hai */}
    </View>
  );
}

// Reel ki details: Views + Upload date/time (3 dots dabane par)
function formatUploadDateTime(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  let d = null;
  if (typeof value === 'number') d = new Date(value);
  else {
    // "2026-10-28 12:45:10" (space wala) ko bhi ISO bana kar parse karo
    d = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(raw) ? raw.replace(' ', 'T') : raw);
  }
  if (!d || Number.isNaN(d.getTime())) return raw; // "2h ago" jaisa text ho to jaisa hai waisa dikhao
  try {
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date}, ${time}`;
  } catch (_) {
    return d.toString();
  }
}

function ReelInfoModal({ visible, onClose, views = 0, uploadedAt = '' }) {
  const viewsText = (() => {
    try { return Number(views || 0).toLocaleString('en-IN'); } catch (_) { return String(views || 0); }
  })();
  const when = formatUploadDateTime(uploadedAt);
  const rowStyle = { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 };
  const labelStyle = { color: '#6b7280', fontSize: 12, fontWeight: '600' };
  const valueStyle = { color: '#111827', fontSize: 16, fontWeight: '700', marginTop: 2 };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 22, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', marginBottom: 10 }} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 4 }}>Reel details</Text>

          <View style={rowStyle}>
            <Ionicons name="eye-outline" size={24} color="#374151" />
            <View>
              <Text style={labelStyle}>Views</Text>
              <Text style={valueStyle}>{viewsText}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />

          <View style={rowStyle}>
            <Ionicons name="time-outline" size={24} color="#374151" />
            <View style={{ flex: 1 }}>
              <Text style={labelStyle}>Uploaded on</Text>
              <Text style={valueStyle}>{when || 'Not available'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ marginTop: 8, alignSelf: 'stretch', backgroundColor: '#f3f4f6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Media ko stretch/zoom hone se bachane ke liye ─────────────────────────────
// Media ka asli width/height ratio pata karke decide karte hain:
//  • ratio card ke lagbhag barabar (jaise 9:16 reel)  → 'cover'  (full screen, bahut halka crop)
//  • ratio card se alag (landscape / square / logo)   → 'contain' (poori image/video asli size me, kaali patti ke saath)
function pickContentFit(ratio, cardW, cardH) {
  if (!ratio || !cardW || !cardH) return 'contain';
  // Web: video/image kabhi crop nahi hogi — poora dikhega (khaali jagah kaali patti)
  if (Platform.OS === 'web') return 'contain';
  const cardRatio = cardW / cardH;
  // Portrait media (9:16, 10:16, 2:3 ...) = reel — poori screen bharo (upar/neeche kaali patti nahi)
  if (ratio <= 0.7) return 'cover';
  return Math.abs(ratio / cardRatio - 1) <= 0.2 ? 'cover' : 'contain';
}

// Image ka ratio (Image.getSize se)
function useImageRatio(uri) {
  const [ratio, setRatio] = useState(null);
  useEffect(() => {
    setRatio(null);
    if (!uri || typeof uri !== 'string') return undefined;
    let alive = true;
    try {
      Image.getSize(uri, (w, h) => { if (alive && w > 0 && h > 0) setRatio(w / h); }, () => {});
    } catch (_) { /* ignore */ }
    return () => { alive = false; };
  }, [uri]);
  return ratio;
}

// Video ka ratio (expo-video player se; na mile to None)
function useVideoTrackRatio(player, enabled) {
  const [ratio, setRatio] = useState(null);
  useEffect(() => {
    setRatio(null);
    if (!enabled || !player) return undefined;
    let alive = true;
    const subs = [];
    const apply = (size) => {
      if (alive && size && size.width > 0 && size.height > 0) setRatio(size.width / size.height);
    };
    const read = () => { try { apply(player.videoTrack?.size); } catch (_) { /* released player */ } };
    try {
      read();
      subs.push(player.addListener('videoTrackChange', (e) => apply(e?.videoTrack?.size)));
      subs.push(player.addListener('sourceLoad', (e) => { apply(e?.availableVideoTracks?.[0]?.size); read(); }));
      subs.push(player.addListener('statusChange', () => read()));
    } catch (_) { /* purana expo-video */ }
    let tries = 0;
    const timer = setInterval(() => { tries += 1; read(); if (tries >= 15) clearInterval(timer); }, 300);
    subs.push({ remove: () => clearInterval(timer) });
    return () => { alive = false; subs.forEach((x) => { try { x?.remove?.(); } catch (_) {} }); };
  }, [player, enabled]);
  return ratio;
}

// Gallery ki har image apne ratio ke hisaab se fit hoti hai
function GalleryImage({ uri, width, height }) {
  const ratio = useImageRatio(uri);
  return (
    <View style={{ width, height, backgroundColor: '#000' }}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={pickContentFit(ratio, width, height)}
      />
    </View>
  );
}

// Is session me jin reels ka view record ho chuka hai
const feedViewedIds = new Set();

// Abhi-abhi upload hui reel (jab tak server wala merged video na aaye): original awaaz band,
// sirf user ki voice (aur chuna hua music) chalegi.
function LocalVoiceOver({ voiceUri, musicUrl, musicVolume = 0.6, playing }) {
  const voicePlayer = useAudioPlayer(null);
  const musicPlayer = useAudioPlayer(null);
  useEffect(() => {
    try {
      if (playing) {
        if (voiceUri) { voicePlayer.replace({ uri: voiceUri }); voicePlayer.loop = true; voicePlayer.volume = 1; voicePlayer.seekTo(0); voicePlayer.play(); }
        if (musicUrl) { musicPlayer.replace({ uri: musicUrl }); musicPlayer.loop = true; musicPlayer.volume = voiceUri ? Math.min(musicVolume, 0.35) : musicVolume; musicPlayer.seekTo(0); musicPlayer.play(); }
      } else {
        voicePlayer.pause(); musicPlayer.pause();
      }
    } catch (_) { /* player release ho chuka ho */ }
    return () => { try { voicePlayer.pause(); } catch (_) {} try { musicPlayer.pause(); } catch (_) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, voiceUri, musicUrl, musicVolume]);
  return null;
}

// Reel Card
function ReelCard({ post, onLike, onBookmark, onComment, onShare, onDescription, onProfilePress, onAdPress, onFollow, onVerifyComments, isActive, isNear = true, bottomInset = 0, cardWidth, cardHeight, isMobileLayout }) {
  const safePost = post || {};
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current; // resume par center me pause icon flash
  const [captionExpanded, setCaptionExpanded] = useState(false);
  // Mute/unmute ab GLOBAL hai — ek video par badlo to saare reels par same state lagti hai
  const [muted, , toggleMuted] = useGlobalMuted();
  const [paused, setPaused] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [resolvedMediaUri, setResolvedMediaUri] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);

  const authorEmail = String(safePost.createdBy || safePost.created_by || '').trim().toLowerCase();
  const authorId = safePost.author_id ?? safePost.authorId ?? null;
  const [isFollowing, setIsFollowing] = useState(() => UserStore.checkIsFollowingSync?.(authorEmail, authorId) ?? false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserHasBlueTick, setCurrentUserHasBlueTick] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false); // 3 dots → Views + Upload date/time

  const comments    = Array.isArray(safePost.comments) ? safePost.comments : [];
  const caption     = String(safePost.caption || '');
  const userName    = String(safePost.user || safePost.author_name || safePost.createdByName || 'User');
  const avatarUri   = String(safePost.avatar || safePost.author_profile_image || '');
  const location    = String(safePost.location || safePost.author_seat_name || '');
  const stripTags   = (v) => String(v || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').trim();
  // ✅ FIX: feed API ke item me `title` / `description` aate hain (headline/caption nahi) — isliye pehle kuch dikhta nahi tha
  const headline    = stripTags(safePost.headline || safePost.title || '');
  // Description: pehle poora description, na ho to caption/subtitle. Title jaisa ho to dobara na dikhao.
  const reelBodyRaw = stripTags(safePost.fullDescription || safePost.description || safePost.caption || safePost.subtitle || '');
  const reelBody    = reelBodyRaw && reelBodyRaw !== headline.trim() ? reelBodyRaw : '';
  const reelNeedsMore = headline.length > 60 || reelBody.length > 90 || reelBody.includes('\n');
  const role        = String(safePost.role || safePost.author_role || '');
  const time        = String(safePost.time || '');
    const postId      = String(safePost.id || '');
  // ✅ FIX: comment count tab hi dikhao jab asli list se confirm ho (ya list me comments dikh rahe ho)
  const commentsConfirmed = Boolean(safePost.isAd) || comments.length > 0 || feedCommentsConfirmed.has(postId);
  const commentsPending   = !commentsConfirmed && Number(safePost.commentsCount || 0) > 0;
  const shownCommentsCount = commentsPending ? 0 : Number(safePost.commentsCount ?? comments.length ?? 0);
  // ✅ FIX: reel active hote hi asli comment list se count verify karo (bina comment ke "View all 1 comments" na dikhe)
  useEffect(() => {
    if (!isActive || !postId || safePost.isAd) return;
    if (Number(safePost.commentsCount || 0) > 0) onVerifyComments?.(postId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, postId]);

  // View API: reel active hone par ek baar view record
  const [viewBump, setViewBump] = useState(0);
  useEffect(() => {
    if (!isActive || !postId || safePost.isAd) return undefined;
    if (feedViewedIds.has(postId)) return undefined;
    feedViewedIds.add(postId);
    let alive = true;
    UserStore.recordNewsView(postId).then((r) => { if (alive && r?.ok) setViewBump(1); }).catch(() => {});
    return () => { alive = false; };
  }, [isActive, postId]);

  const verified    = Boolean(
    safePost.verified ||
    safePost.author_has_blue_tick ||
    safePost.has_blue_tick ||
    safePost.authorHasBlueTick ||
    safePost.createdByBlueTick ||
    (authorEmail && currentUserEmail && authorEmail === currentUserEmail && currentUserHasBlueTick)
  );
  const shares      = Number(safePost.shares || 0);
  const isAd        = Boolean(safePost.isAd);
  const adRedirectMeta = isAd ? getAdRedirectMeta(safePost) : null;

  // media_type based rendering: video | image | pdf | link
  const postKind = String(safePost.type || 'image');
  const isDocKind = !isAd && (postKind === 'pdf' || postKind === 'link');
  const docUrl = String(safePost.media || '').trim();
  const galleryImages = useMemo(() => (
    postKind === 'image' && Array.isArray(safePost.images)
      ? safePost.images.filter((u) => typeof u === 'string' && u.trim())
      : []
  ), [postKind, safePost.images]);
  const [galleryW, setGalleryW] = useState(0);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const openDoc = useCallback(() => {
    if (!docUrl) { Alert.alert('Unavailable', 'Link is not available.'); return; }
    if (Platform.OS === 'web') { window.open(docUrl, '_blank', 'noopener'); return; }
    Linking.openURL(docUrl).catch(() => Alert.alert('Notice', 'Could not open the link.'));
  }, [docUrl]);

  useEffect(() => {
    let alive = true;
    const initializeComponent = async () => {
      try {
        const cached = UserStore.getCachedCurrentUser?.();
        const me = cached || await UserStore.getCurrentUser().catch(() => null);
        if (!alive) return;
        if (me && me.email) {
          setCurrentUserEmail(me.email);
          setCurrentUserHasBlueTick(UserStore.hasBlueTick(me));
        }
        if (authorEmail || authorId != null) {
          const isF = await UserStore.checkIsFollowing(authorEmail, authorId);
          if (alive) setIsFollowing(Boolean(isF));
        }
      } catch (error) {
        console.error('Error initializing component:', error);
      }
    };
    initializeComponent();
    return () => { alive = false; };
  }, [authorEmail, authorId]);

  useEffect(() => {
    if (!authorEmail && authorId == null) return undefined;
    const unsubscribe = UserStore.subscribeFollowState?.((payload) => {
      if (UserStore.matchesFollowTarget?.(payload, authorEmail, authorId)) {
        setIsFollowing(Boolean(payload.isFollowing));
      }
    });
    return () => { unsubscribe?.(); };
  }, [authorEmail, authorId]);

  const handleFollowPress = async () => {
    if (!authorEmail && authorId == null) return;
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      const activeUser = currentUser || UserStore.getCachedCurrentUser?.() || await UserStore.getCurrentUser().catch(() => null);
      if (activeUser && authorEmail && activeUser.email && String(activeUser.email).trim().toLowerCase() === authorEmail) {
        setIsFollowing(!next);
        Alert.alert('Cannot Follow', 'You cannot follow yourself.');
        return;
      }
      const result = next
        ? await UserStore.followUser(authorEmail, authorId)
        : await UserStore.unfollowUser(authorEmail, authorId);
      if (result?.ok === false) {
        setIsFollowing(!next);
        Alert.alert('Follow', result?.message || 'Unable to update follow status.');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      setIsFollowing(!next);
      Alert.alert('Notice', 'Unable to update follow status. Please try again.');
    }
  };

  const [resolvedThumbnailUrl, setResolvedThumbnailUrl] = useState(null);

  useEffect(() => {
  let alive = true;
  let objectUrl = null;
  const t = safePost?.thumbnail || safePost?.image;
  if (!t) { setResolvedThumbnailUrl(null); return; }
  if (isIdbMediaUri(t)) {
    resolveIdbMediaUriToObjectUrl(t).then((url) => {
      if (!alive) { if (url) { try { URL.revokeObjectURL(url); } catch {} } return; }
      objectUrl = url;
      if (url) setResolvedThumbnailUrl(url);
    });
  } else {
    setResolvedThumbnailUrl(t);
  }
  return () => {
    alive = false;
    try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
  };
}, [safePost?.thumbnail, safePost?.image]);
  const safeThumbnailUrl = useMemo(() => {
    const t = resolvedThumbnailUrl;
    if (!thumbnailError && t && (
      t.startsWith('blob:') ||
      t.startsWith('https://') ||
      t.startsWith('http://') ||
      isValidImageUrl(t)
    )) {
      return t;
    }
   // Agar thumbnail resolve nahi hua abhi, blank rakho — picsum mat dikhao
return t || '';
  }, [resolvedThumbnailUrl, thumbnailError, postId]);

  const mediaUri = String(safePost.media || '').trim();

  // ✅ FIX: Resolve IDB media URI to blob URL for web
  useEffect(() => {
    let alive = true;
    let objectUrl = null;

    (async () => {
      if (Platform.OS !== 'web') { setResolvedMediaUri(null); return; }
      if (!isIdbMediaUri(mediaUri)) { setResolvedMediaUri(null); return; }
      const next = await resolveIdbMediaUriToObjectUrl(mediaUri);
      if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
      objectUrl = next;
      setResolvedMediaUri(next);
    })();

    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [mediaUri]);

  // ✅ FIX: videoSource computed via useMemo so useVideoPlayer
  //         re-initializes when the blob URL becomes available.
  //         On web, IDB URIs wait for the resolved blob URL.
  //         On native, use mediaUri directly.
  const videoSource = useMemo(() => {
    if (safePost.type !== 'video') return null;

    if (Platform.OS === 'web' && isIdbMediaUri(mediaUri)) {
      // Wait until IDB has been resolved to a blob URL
      if (!resolvedMediaUri) return null;
      return { uri: resolvedMediaUri };
    }

    if (!mediaUri || !isPlayableVideoSource(mediaUri)) return null;
    return { uri: mediaUri };
  }, [safePost.type, mediaUri, resolvedMediaUri]);

  // ✅ FIX: canPlayVideo derived from videoSource (not effectiveMediaUri)
  const canPlayVideo = Boolean(videoSource);

  // ✅ FIX (crash): har card ka apna native player hona = FlatList window me 5 ExoPlayer/AVPlayer ek saath.
  // Kam RAM / kam hardware decoder wale phones par ye scroll karte waqt app band kar deta tha.
  // Ab sirf ACTIVE card + uske aas-paas ke (agle/pichle) cards ko source milta hai (max 3 player).
  // ✅ FIX (shuru me lag): agla reel turant preload hone se pehle video ki bandwidth kha leta tha.
  // Active reel ko seedha source milta hai; aas-paas wale reels 2.5 sec baad preload hote hain.
  const [nearDelayOk, setNearDelayOk] = useState(false);
  useEffect(() => {
    if (!isNear) { setNearDelayOk(false); return undefined; }
    const t = setTimeout(() => setNearDelayOk(true), 2500);
    return () => clearTimeout(t);
  }, [isNear]);
  const activeSource = isNear && (isActive || nearDelayOk) ? videoSource : null;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const player = useVideoPlayer(activeSource, (p) => {
    try {
      p.loop = true;
      try { p.playbackRate = 1; p.preservesPitch = true; } catch (_) {}   // video kabhi tez nahi
      try { p.bufferOptions = { preferredForwardBufferDuration: 15, minBufferForPlayback: 1.5, waitsToMinimizeStalling: true }; } catch (_) {}
      p.muted = getGlobalMuted() || Boolean(safePost.localMuteOriginal);   // global mute state se start (voice-over reel => original hamesha mute)
      p.volume = 1;
      p.autoplay = false;
      p.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay' && mountedRef.current) setPlayerReady(true);
      });
      p.addListener('playbackStateChange', ({ playbackState }) => {
        if (playbackState === 'playing' && mountedRef.current) setShowPoster(false);
      });
    } catch (_) { /* player release ho chuka ho to ignore */ }
  });

  // ✅ FIX (stretch/zoom): media ka asli ratio nikaal kar contentFit decide karo
  const videoRatio = useVideoTrackRatio(player, canPlayVideo && Boolean(activeSource));
  const thumbRatio = useImageRatio(safeThumbnailUrl || '');
  const mediaRatio = canPlayVideo ? (videoRatio || thumbRatio) : thumbRatio;
  const mediaFit   = pickContentFit(mediaRatio, cardWidth, cardHeight);
  // Video ka box: ratio pata ho aur 'contain' ho to card ke andar usi ratio ka box (letterbox khud banate hain)
  const videoBox = (() => {
    if (mediaFit !== 'contain' || !mediaRatio) return { w: cardWidth, h: cardHeight, boxed: false };
    let w = cardWidth;
    let h = Math.round(w / mediaRatio);
    if (h > cardHeight) { h = cardHeight; w = Math.round(h * mediaRatio); }
    return { w, h, boxed: true };
  })();

  // Reset poster/ready when video source changes
  useEffect(() => {
    setShowPoster(true);
    setPlayerReady(false);
  }, [activeSource]);

  useEffect(() => { setCaptionExpanded(false); }, [postId]);

  // Apply muted state to player
  useEffect(() => {
    if (!canPlayVideo || !player || !activeSource) return;
    safeSetMuted(player, muted || Boolean(safePost.localMuteOriginal));
    try { if (player.playbackRate !== 1) player.playbackRate = 1; } catch (_) { /* ignore */ }   // mute se speed nahi badlegi
  }, [canPlayVideo, activeSource, muted, player, safePost.localMuteOriginal]);

  // ✅ FIX (beech me ruk jaana): video chalte chalte ruk jaaye (buffering / audio focus) to khud dobara chalao.
  // User ne pause kiya ho (paused=true) to kuch nahi karta.
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    if (!isActive || !canPlayVideo || !player || !activeSource || !playerReady) return undefined;
    let lastT = -1;
    let stuck = 0;
    const id = setInterval(() => {
      if (pausedRef.current || !mountedRef.current) return;
      try {
        // ✅ FIX (shuru me lag): video abhi load / buffer ho raha ho to play() baar-baar mat bhejo —
        // har second ka play() buffering ko restart karke video ko atkata tha.
        if (player.status === 'loading') { stuck = 0; return; }
        const t = Number(player.currentTime) || 0;
        if (!player.playing) { stuck += 1; if (stuck >= 2) { safePlay(player); stuck = 0; } }
        else if (t === lastT) { stuck += 1; if (stuck >= 5) { safePlay(player); stuck = 0; } }
        else stuck = 0;
        lastT = t;
      } catch (_) { /* released player */ }
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, canPlayVideo, player, activeSource, playerReady]);

  // ✅ FIX (auto-play): 'readyToPlay' event kabhi miss ho jaaye to bhi 1.2s baad play try karo
  useEffect(() => {
    if (!isActive || !canPlayVideo || !activeSource || playerReady) return undefined;
    const t = setTimeout(() => { if (mountedRef.current) setPlayerReady(true); }, 1200);
    return () => clearTimeout(t);
  }, [isActive, canPlayVideo, activeSource, playerReady]);

  // Handle play/pause based on active state + player readiness
  useEffect(() => {
    if (!canPlayVideo || !player || !activeSource || !playerReady) return;

    const playVideo = async () => {
      if (isActive && !paused) {
        try {
          const r = player.play();
          if (r && typeof r.then === 'function') await r;
        } catch (error) {
          // Browser kabhi awaaz ke saath autoplay rok deta hai — tab muted karke chala do
          // (user speaker button se unmute kar sakta hai), warna video ruka rahega.
          console.log('Auto-play with sound blocked:', error);
          if (Platform.OS === 'web' && !getGlobalMuted()) {
            setGlobalMuted(true);
            safeSetMuted(player, true);
            safePlay(player);
          } else {
            // pause mat dikhao (user ko tap na karna pade) — thodi der baad dobara try
            setTimeout(() => { if (mountedRef.current) safePlay(player); }, 600);
          }
        }
      } else {
        safePause(player);
      }
    };

    playVideo();
  }, [canPlayVideo, activeSource, isActive, paused, player, playerReady]);

  // Cleanup on unmount
  // ✅ FIX (crash): expo-video unmount par player ko khud release kar deta hai. Release ho chuke
  // player par `removeAllListeners()` call karne se native exception aata tha (upar scroll / card
  // unmount par app band). Ab sirf safe pause — listeners player ke saath khud hat jaate hain.
  useEffect(() => {
    return () => { safePause(player); };
  }, [player]);

  // Pause video when card scrolls out of view
  useEffect(() => {
    if (!canPlayVideo || !player) return;
    if (!isActive) {
      safePause(player);
      try { player.currentTime = 0; } catch (_) { /* released player */ }
      setPaused(false);
      setShowPoster(true);
    }
  }, [isActive, canPlayVideo, player]);

  // ✅ Instagram jaisa: pichle reel ko pause kiya tha to naye reel par aate hi pause hat jaye, video seedha chale
  useEffect(() => {
    if (isActive) setPaused(false);
  }, [isActive]);

  const handleVideoToggle = useCallback(() => {
    if (isAd) {
      onAdPress?.(safePost);
      return;
    }
    if (!canPlayVideo || !player || !activeSource || !playerReady) return;

    if (paused) {
      setPaused(false);
      setShowPoster(false);
      safePlay(player);
      // center me pause icon dikhao, phir fade out
      flashAnim.stopAnimation();
      flashAnim.setValue(1);
      Animated.timing(flashAnim, { toValue: 0, duration: 450, delay: 500, useNativeDriver: USE_NATIVE_DRIVER }).start();
    } else {
      safePause(player);
      setPaused(true);
      // poster wapas mat lagao — warna ▶ icon chhup jaata hai aur frame hat jaata hai
    }
  }, [canPlayVideo, activeSource, isAd, onAdPress, paused, player, playerReady, safePost, flashAnim]);

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.45, duration: 110, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 110, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    onLike(postId);
  };

  const navbarH = Platform.OS === 'ios' ? 60 : 56;
const safeBot = Platform.OS === 'ios' ? 34 : 0;
  // Navbar ab video ke UPAR overlay hai (video uske peeche tak jaata hai), isliye offset navbar ki real height se.
  const bottomBottom = isMobileLayout
    ? (Platform.OS === 'web' ? 96 : (bottomInset > 0 ? bottomInset + 28 : navbarH + safeBot + 28))
    : 28;
  // const bottomRight = isMobileLayout ? 60 : 14;
  const bottomRight = 80; // icons ab video ke upar right me hain — caption unse na takraye

  const showPlayOverlay = paused && playerReady;

  return (
    <View style={{
      width: cardWidth, 
      height: cardHeight, 
      backgroundColor: '#000',
      flexDirection: isMobileLayout ? 'column' : 'row',
      overflow: 'hidden',
    }}>
      <View style={{
    flex: 1,
    height: cardHeight,
    position: 'relative', 
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: isMobileLayout ? 0 : 12,
    ...(Platform.OS === 'web' && isMobileLayout ? {
      maxHeight: '100%',
    } : {}),
  }}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleVideoToggle}
        >
          {isDocKind ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#111' }}>
              <Text style={{ fontSize: 56 }}>{postKind === 'pdf' ? '📄' : '🔗'}</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 12 }} numberOfLines={3}>
                {headline || (postKind === 'pdf' ? 'PDF Document' : 'External Link')}
              </Text>
              <TouchableOpacity
                onPress={openDoc}
                activeOpacity={0.85}
                style={{ marginTop: 18, backgroundColor: '#dc2626', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 24 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{postKind === 'pdf' ? 'Open / Download PDF' : 'Open Link'}</Text>
              </TouchableOpacity>
            </View>
          ) : canPlayVideo ? (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }]}>
              {/* ✅ FIX (stretch): video ko uske ASLI ratio wale box me rakha hai (MediaGallery jaisa),
                  Android par textureView — taaki surface kabhi width/height kheench na sake. */}
              <View style={{ width: videoBox.w, height: videoBox.h, overflow: 'hidden', backgroundColor: '#000' }}>
                {safePost.musicUrl && !safePost.localMusicUrl ? (
                  <NewsMusicSync player={player} musicUrl={safePost.musicUrl} volume={safePost.musicVolume} muted={muted} muteOriginal={safePost.muteOriginal} />
                ) : null}
                {(safePost.localVoiceUri || safePost.localMusicUrl) ? (
                  <LocalVoiceOver
                    voiceUri={safePost.localVoiceUri}
                    musicUrl={safePost.localMusicUrl}
                    musicVolume={safePost.localMusicVolume}
                    playing={Boolean(isActive && !paused && !muted)}
                  />
                ) : null}
                <VideoView
                  player={player}
                  style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                  contentFit={(videoBox.boxed || Platform.OS === 'web') ? 'contain' : 'cover'}
                  nativeControls={false}
                  fullscreenOptions={{ enabled: false }}
                  playsInline
                  surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
                />
                {showPoster && safeThumbnailUrl ? (
                  <Image
                    source={{ uri: safeThumbnailUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={(videoBox.boxed || Platform.OS === 'web') ? 'contain' : 'cover'}
                    onError={() => setThumbnailError(true)}
                  />
                ) : null}
              </View>
            </View>
          ) : galleryImages.length > 1 ? (
            <View style={StyleSheet.absoluteFill} onLayout={(e) => setGalleryW(e.nativeEvent.layout.width)}>
              {galleryW > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => setGalleryIdx(Math.round(e.nativeEvent.contentOffset.x / galleryW))}
                >
                  {galleryImages.map((u, i) => (
                    <GalleryImage key={`${u}-${i}`} uri={u} width={galleryW} height={cardHeight} />
                  ))}
                </ScrollView>
              ) : null}
              <View pointerEvents="none" style={{ position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{galleryIdx + 1}/{galleryImages.length}</Text>
              </View>
            </View>
          ) : safeThumbnailUrl ? (
            <Image
              source={{ uri: safeThumbnailUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={mediaFit}
              onError={() => setThumbnailError(true)}
            />
          ) : null}
        </TouchableOpacity>

        <View style={{ ...styles.reelOverlayBottom, pointerEvents: 'none' }} />

        {showPlayOverlay && (
          <View pointerEvents="none" style={styles.pausedOverlay}>
            <View style={styles.playBadge}>
              <Ionicons name="play" size={42} color="#fff" style={{ marginLeft: 5 }} />
            </View>
          </View>
        )}

        {canPlayVideo && !paused ? (
          <Animated.View pointerEvents="none" style={[styles.pausedOverlay, { backgroundColor: 'transparent', opacity: flashAnim }]}>
            <View style={styles.playBadge}>
              <Ionicons name="pause" size={42} color="#fff" />
            </View>
          </Animated.View>
        ) : null}

        {canPlayVideo && paused ? (
          <View pointerEvents="box-none" style={styles.reelMuteCenter}>
            <TouchableOpacity
              style={styles.muteBtn}
              onPress={toggleMuted}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MuteIcon muted={muted} size={28} />
            </TouchableOpacity>
          </View>
        ) : null}

        <ActionColumn
          post={{ ...safePost, likes: Number(safePost.likes || 0), shares, comments, commentsCount: shownCommentsCount, commentsPending, views: Number(safePost.views || 0) + viewBump }}
          onLike={handleLikePress} onComment={onComment} onShare={onShare}
          onBookmark={onBookmark} onDescription={onDescription}
          onMore={() => setInfoVisible(true)}
          scaleAnim={scaleAnim} isMobileLayout={true} bottomInset={bottomInset}
        />

        <ReelInfoModal
          visible={infoVisible}
          onClose={() => setInfoVisible(false)}
          views={Number(safePost.views || 0) + viewBump}
          uploadedAt={safePost.createdAt || safePost.time || ''}
        />

        <View style={[styles.reelBottom, { bottom: bottomBottom, right: bottomRight }]}>
          {safePost.tag ? (
            <View style={[styles.reelTagBadge, { backgroundColor: String(safePost.tagColor || '#16a34a') }]}>
              <Text style={styles.reelTagText}>{String(safePost.tag || '')}</Text>
            </View>
          ) : null}

          <View style={styles.reelUserRow}>
            <TouchableOpacity style={{ flexDirection: 'row', flex: 1, minWidth: 0, alignItems: 'center', gap: 10 }} onPress={() => onProfilePress(safePost)} activeOpacity={0.85}>
              <ProfileAvatar uri={avatarUri} size={40} style={styles.reelUserAvatar} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.reelUserName, { flexShrink: 1 }]} numberOfLines={1}>{userName}</Text>
                  {Boolean(verified) ? <VerifiedBadge size={16} /> : null}
                </View>
                {(role || time) ? (
                  <Text style={styles.reelUserRole} numberOfLines={1}>{[role, time].filter(Boolean).join(' · ')}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
            {authorEmail && currentUserEmail !== authorEmail ? (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnFollowing]}
                onPress={handleFollowPress}
                disabled={followLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextFollowing]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {location ? (
            <View style={styles.reelLocationRow}>
              <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.reelLocationText} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}

          {/* Title + Description (neeche). Lamba ho to 2 line ke baad "See more" — tap par poora text,
              zyada lamba ho to andar scroll hota hai. */}
          {(headline || reelBody) ? (
            <View style={captionExpanded ? { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 10, marginTop: 4 } : null}>
              <ScrollView
                scrollEnabled={captionExpanded}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={captionExpanded ? { maxHeight: Math.round((cardHeight || 600) * 0.4) } : null}
              >
                {headline ? (
                  <Text style={styles.reelHeadline} numberOfLines={captionExpanded ? undefined : 2}>{headline}</Text>
                ) : null}
                {reelBody ? (
                  <Text style={styles.reelCaption} numberOfLines={captionExpanded ? undefined : 2}>{reelBody}</Text>
                ) : null}
              </ScrollView>
              {reelNeedsMore ? (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setCaptionExpanded((v) => !v)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 10 }}>
                  <Text style={styles.reelCaptionMore}>{captionExpanded ? 'See less' : 'See more'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {isAd && adRedirectMeta ? (
            <TouchableOpacity
              style={{
                marginTop: 12,
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#f97316',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
              }}
              onPress={() => onAdPress?.(safePost)}
              activeOpacity={0.86}
            >
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>{adRedirectMeta.label}</Text>
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 15 }}>›</Text>
            </TouchableOpacity>
          ) : null}

          {!commentsPending && (shownCommentsCount > 0 || comments.length > 0) && (
            <TouchableOpacity onPress={() => onComment(postId)} style={{ marginTop: 5 }}>
              <Text style={styles.reelViewComments}>View all {shownCommentsCount || comments.length} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
}

// Login required popup
function LoginRequiredModal({ visible, onClose, onLogin }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 18, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name="log-in-outline" size={28} color="#f97316" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 }}>Sign in required</Text>
          <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 18 }}>
            Please sign in to like, comment or save posts.
          </Text>
          <TouchableOpacity
            onPress={onLogin}
            activeOpacity={0.85}
            style={{ alignSelf: 'stretch', backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 15 }}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 14 }}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Main Feed Screen
export default function FeedScreen({ navigation, route }) {
  const targetReelId = route?.params?.id ? String(route.params.id) : null;
  const [posts, setPosts]               = useState([]);
  const pinnedPostRef = useRef(null);
  const profileReelsParam = Array.isArray(route?.params?.reels) && route.params.reels.length ? route.params.reels : null;
  const profileModeRef = useRef(false);
  profileModeRef.current = Boolean(profileReelsParam);

  const [uploadVisible, setUploadVisible] = useState(false);
  const [newsLimitModal, setNewsLimitModal] = useState({ visible: false, message: '' });
  const [commentPost, setCommentPost]   = useState(null);
  const [sharePost, setSharePost]       = useState(null);
  const [descPost, setDescPost]         = useState(null);
  const [activeIndex, setActiveIndex]   = useState(0);
  const [currentUser, setCurrentUser]   = useState({ name: 'User', email: '', avatar: '', has_blue_tick: false });
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [commentProfilesByEmail, setCommentProfilesByEmail] = useState({});
  const [feedViewportHeight, setFeedViewportHeight] = useState(0);
  const [navBarH, setNavBarH] = useState(0); // neeche wale curved navbar ki real height
  const isScreenFocused = useIsFocused();

  // ✅ Feed kholte hi video UNMUTED (awaaz ke saath) shuru hoga.
  // User chahe to top-right speaker button se mute kar sakta hai (mute sab reels par lagega).
  useFocusEffect(
    useCallback(() => {
      setGlobalMuted(false);
    }, [])
  );
  const feedCursorRef = useRef(null);
  const feedHasMoreRef = useRef(false);
  const feedLoadingRef = useRef(false);
  const feedRequestIdRef = useRef(0);
  const loadMoreFeedRef = useRef(() => {});

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const responsiveWidth = getResponsiveWindowWidth(windowWidth);
  const isMobileLayout = Platform.OS !== 'web' || (() => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator?.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isNarrow = window.innerWidth <= 900;
  return isMobileUA || isNarrow;
})();
  const isWebPlatform   = Platform.OS === 'web';

 const WEB_TOPNAV_H = 0;
const WEB_BOTTOMNAV_H = 0;
  const NAVBAR_H = Platform.OS === 'ios' ? 94 : 70;
const APPROX_NAVBAR_H = Platform.OS === 'web' ? 56 : (Platform.OS === 'ios' ? 94 : 70);

const MOBILE_CHROME_BAR = (Platform.OS === 'web' && isMobileLayout) ? 0 : 0;
const browserHeight = typeof window !== 'undefined' ? window.innerHeight : windowHeight;
const cardHeight = feedViewportHeight > 0 ? feedViewportHeight : browserHeight;
  const feedListRef = useRef(null);

  // Profile ke Reels / Ads tab se tap -> yahin (Feed) khulta hai, usi reel / ad par.
  // route.params: { id, post }. Target pehle loaded list me dhundhte hain; na mile (purani reel / ad)
  // to `post` ko list ke top par inject karte hain.
  const targetPostParam = route?.params?.post || null;
  const injectedTarget = useMemo(
    () => (targetPostParam ? feedPostFromProfileItem(targetPostParam, String(currentUserEmail || '').trim().toLowerCase()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetPostParam]
  );
  const wantedTargetId = injectedTarget?.id ? String(injectedTarget.id) : targetReelId;
  const handledTargetRef = useRef(null);

  useEffect(() => {
    if (profileModeRef.current) return;
    if (!wantedTargetId || !posts.length) return;
    if (handledTargetRef.current === wantedTargetId) return;
    const idx = posts.findIndex((p) => String(p.id) === wantedTargetId);
    if (idx < 0) {
      if (injectedTarget) {
        pinnedPostRef.current = injectedTarget;
        setTimeout(() => { if (pinnedPostRef.current === injectedTarget) pinnedPostRef.current = null; }, 6000);
        setPosts((prev) => (prev.some((p) => String(p.id) === wantedTargetId) ? prev : [injectedTarget, ...prev]));
      }
      return;
    }
    handledTargetRef.current = wantedTargetId;
    setActiveIndex(idx);
    try {
      feedListRef.current?.scrollToIndex?.({ index: idx, animated: false });
    } catch (_) {}
    // Params saaf karo, taaki dobara Feed tab kholne par ye purana target na khule
    try { navigation?.setParams?.({ id: undefined, post: undefined }); } catch (_) {}
  }, [wantedTargetId, injectedTarget, posts]);

  // ── Profile mode ──────────────────────────────────────────────────────────
  // Profile ke Reels tab se aane par Feed me SIRF usi user ki reels dikhti hain
  // (tapped reel se shuru, scroll par usi ki baaki reels). Wapas jaakar normal
  // News Feed kholne par random reels hi aate hain (blur par ye mode reset hota hai).
  const profileReelsKey = profileReelsParam ? profileReelsParam.map((r) => String(r?.id ?? '')).join(',') : '';
  useEffect(() => {
    if (!profileReelsParam || !profileReelsParam.length) return;
    const email = String(currentUserEmail || '').trim().toLowerCase();
    const seen = new Set();
    const list = [];
    profileReelsParam.forEach((it) => {
      const p = feedPostFromProfileItem(it, email);
      if (p && p.id && !seen.has(String(p.id))) { seen.add(String(p.id)); list.push(p); }
    });
    if (!list.length) return;
    pinnedPostRef.current = null;
    setPosts(list);
    const idx = Math.max(0, list.findIndex((p) => String(p.id) === String(targetReelId || '')));
    setActiveIndex(idx);
    const t = setTimeout(() => {
      try { feedListRef.current?.scrollToIndex?.({ index: idx, animated: false }); } catch (_) {}
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileReelsKey]);

  // Feed se bahar jaate hi (back / navbar) profile mode band -> agli baar normal random feed
  useFocusEffect(
    useCallback(() => () => {
      if (profileModeRef.current) {
        profileModeRef.current = false;
        handledTargetRef.current = null;
        setPosts([]);
        try { navigation?.setParams?.({ id: undefined, post: undefined, reels: undefined }); } catch (_) {}
      }
    }, [navigation])
  );
  const snapOffsets = useMemo(
    () => Array.from({ length: Math.max(posts.length, 1) }, (_, i) => i * cardHeight),
    [posts.length, cardHeight]
  );

  // ✅ WEB: Instagram jaisa snap scroll — ek scroll / swipe / arrow key = ek poora reel (agla reel poori screen par).
  // react-native-web `snapToOffsets` support nahi karta, isliye DOM level par wheel + keyboard + scroll-settle handle karte hain.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !(cardHeight > 0)) return undefined;

    let detach = null;
    let pollTimer = null;

    const attach = (node) => {
      const maxIdx = Math.max(posts.length - 1, 0);
      const clampIdx = (i) => Math.max(0, Math.min(maxIdx, i));
      const currentIdx = () => Math.round(node.scrollTop / cardHeight);
      // ✅ ROOT CAUSE FIX: react-native-web list ke DOM node par apna `scrollTo({x, y, animated})` laga deta hai
      // (version ke hisaab se). Usme `top/behavior` samajh nahi aata, isliye `node.scrollTo({top})` kuch nahi
      // karta (ya 0 par reset kar deta) aur feed kabhi scroll nahi hota tha. Isliye browser ka ASLI
      // Element.scrollTo seedha call karte hain — har react-native-web version par same chalta hai.
      const nativeScrollTo = (typeof Element !== 'undefined' && Element.prototype && Element.prototype.scrollTo) || null;
      const goTo = (idx) => {
        const top = clampIdx(idx) * cardHeight;
        try {
          if (nativeScrollTo) nativeScrollTo.call(node, { top, behavior: 'smooth' });
          else node.scrollTop = top;
        } catch (_) { node.scrollTop = top; }
        // safety: smooth scroll na chale (kuch browsers / reduced-motion) to bhi reel badal jaye
        setTimeout(() => { if (Math.abs(node.scrollTop - top) > 2 && Math.abs(node.scrollTop - top) > cardHeight * 0.9) node.scrollTop = top; }, 700);
      };

      // Card ke andar koi apna scroll (caption etc.) ho to wheel usi ko do
      const hasInnerScroll = (el) => {
        let cur = el;
        while (cur && cur !== node) {
          if (cur.nodeType === 1 && cur.scrollHeight > cur.clientHeight + 2) {
            const oy = window.getComputedStyle(cur).overflowY;
            if (oy === 'auto' || oy === 'scroll') return true;
          }
          cur = cur.parentNode;
        }
        return false;
      };

      // ✅ FIX (laptop touchpad par scroll nahi hota tha): touchpad ek gesture me bahut saare chhote
      // wheel events bhejta hai (deltaY 1, 2, 3 ...). Pehle har event ko alag dekha jaata tha — pehla event
      // chhota hone par "ignore", aur baaki events "streaming" maan kar ignore => poora gesture bekaar.
      // Ab ek gesture ke saare delta JOD (accumulate) kar lete hain; threshold paar hote hi ek reel aage/peeche.
      // Mouse wheel (alag-alag notch) pehle jaisa hi chalta hai.
      const GESTURE_GAP = 160;     // ms — isse zyada gap = naya gesture
      const TRIGGER_DELTA = 30;    // itna total scroll hote hi agla reel
      let acc = 0;
      let fired = false;
      let lockUntil = 0;
      let lastWheelAt = 0;
      const onWheel = (e) => {
        if (e.ctrlKey || hasInnerScroll(e.target)) return;
        e.preventDefault();
        const now = Date.now();
        if (now - lastWheelAt > GESTURE_GAP) { acc = 0; fired = false; }
        lastWheelAt = now;
        if (fired || now < lockUntil) return;
        const dy = e.deltaMode === 1 ? e.deltaY * 16 : (e.deltaMode === 2 ? e.deltaY * cardHeight : e.deltaY);
        acc += dy;
        if (Math.abs(acc) < TRIGGER_DELTA) return;
        fired = true;
        lockUntil = now + 450;
        goTo(currentIdx() + (acc > 0 ? 1 : -1));
      };

      const onKey = (e) => {
        const t = e.target;
        const tag = t && t.tagName ? String(t.tagName).toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(currentIdx() + 1); }
        else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(currentIdx() - 1); }
      };

      // Touch / scrollbar drag: scroll ruke to sabse paas ke reel par exact snap
      let idleTimer = null;
      const onScroll = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          const target = clampIdx(currentIdx()) * cardHeight;
          if (Math.abs(node.scrollTop - target) > 2) goTo(currentIdx());
        }, 140);
      };

      // ✅ Touch (phone browser): browser ka native scroll-snap — ungli se swipe karne par Instagram jaisa
      // ek reel pe sidha ruk jaata hai (beech me atakta nahi). Desktop par wheel/keyboard wala upar ka logic hi chalta hai.
      let snapObserver = null;
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));
      if (isTouch) {
        try {
          node.style.scrollSnapType = 'y mandatory';
          node.style.overscrollBehaviorY = 'contain';
          const applySnap = () => {
            const holder = node.firstElementChild;
            if (!holder) return;
            Array.from(holder.children).forEach((cell) => {
              cell.style.scrollSnapAlign = 'start';
              cell.style.scrollSnapStop = 'always';
            });
          };
          applySnap();
          if (typeof MutationObserver !== 'undefined' && node.firstElementChild) {
            snapObserver = new MutationObserver(applySnap);
            snapObserver.observe(node.firstElementChild, { childList: true });
          }
        } catch (_) { /* snap na lage to purana idle-snap chalega */ }
      }

      node.addEventListener('wheel', onWheel, { passive: false });
      node.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('keydown', onKey);
      return () => {
        if (snapObserver) snapObserver.disconnect();
        node.removeEventListener('wheel', onWheel);
        node.removeEventListener('scroll', onScroll);
        window.removeEventListener('keydown', onKey);
        if (idleTimer) clearTimeout(idleTimer);
      };
    };

    // ✅ FIX (race): web par WebLayout/WebReadyGate fonts load hone tak list mount hi nahi karta, isliye
    // effect chalte waqt list ka DOM node null hota tha aur scroll handler kabhi lagta hi nahi tha.
    // Ab node milne tak thodi-thodi der me dobara try karte hain.
    const tryAttach = () => {
      const node = feedListRef.current?.getScrollableNode?.();
      if (!node) return false;
      detach = attach(node);
      return true;
    };
    if (!tryAttach()) {
      let tries = 0;
      pollTimer = setInterval(() => {
        tries += 1;
        if (tryAttach() || tries > 50) { clearInterval(pollTimer); pollTimer = null; }
      }, 200);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (detach) detach();
    };
  }, [cardHeight, posts.length]);

  const cardWidth = isMobileLayout ? responsiveWidth : Math.min(responsiveWidth * 0.6, 580);
  // ✅ YAHAN ADD KARO — cardWidth ke bilkul baad:
  const effectiveCardWidth = isMobileLayout && Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.innerWidth
    : cardWidth;

  const syncPostComments = useCallback(async (id, opts = {}) => {
    try {
      const { keepIfEmpty = false, ensureComment = null } = opts || {};
      const summary = await UserStore.getNewsFeedSummary({ focusItemId: id });
      const item = summary?.items?.find((entry) => String(entry.id) === String(id));
      const rawComments = Array.isArray(item?.comments_list) ? item.comments_list : [];
      const normalizedComments = rawComments.map((comment, index) =>
        normalizeFeedComment(comment, `cmt-${index + 1}`, commentProfilesByEmail)
      );

      setPosts((prev) => prev.map((post) => {
        if (post.id !== id) return post;
        // ✅ FIX: server se post hi na mile / request fail ho (item nahi) to local comments mat udao
        let next = mergePendingComments(id, (!item && Array.isArray(post.comments)) ? post.comments : normalizedComments);
        // ✅ FIX: server list khali / fail aaye (list endpoint lag ya error) to local comments mat udao
        if (keepIfEmpty && next.length === 0 && Array.isArray(post.comments) && post.comments.length) {
          next = post.comments;
        }
        // ✅ FIX: abhi add kiya hua comment server list me na dikhe to bhi rakho
        if (ensureComment) {
          const exists = next.some((c) =>
            String(c.id) === String(ensureComment.id) ||
            (c.text === ensureComment.text && String(c.author_email || '') === String(ensureComment.author_email || ''))
          );
          if (!exists) next = [...next, ensureComment];
        }
        const realCount = countFeedComments(next);
        // server ka stale count 20s live-refresh me wapas na aaye
        if (item && !ensureComment && next === normalizedComments && !hasRecentPending(id)) {
          feedCommentVerify.set(String(id), { server: Number(item.comments), real: realCount });
        }
        return { ...post, comments: next, commentsCount: realCount };
      }));
    } catch {}
  }, [commentProfilesByEmail]);

  // ✅ FIX: reel dikhte hi (silently) asli comments se count theek karo — har post ke liye ek baar
  const commentsVerifiedRef = useRef(new Set());
  const commentsVerifyTriesRef = useRef({});
  const handleVerifyComments = useCallback(async (id) => {
    const key = String(id);
    if (commentsVerifiedRef.current.has(key)) return;
    if (hasRecentPending(key)) return; // user ka naya comment server count me nahi aaya hota — count kam mat karo
    if ((commentsVerifyTriesRef.current[key] || 0) >= 3) return;
    commentsVerifyTriesRef.current[key] = (commentsVerifyTriesRef.current[key] || 0) + 1;
    commentsVerifiedRef.current.add(key);
    try {
      const res = await AuthAPI.getCommentsDetailed(key);
      if (!res?.ok || !Array.isArray(res.comments)) {
        // fail — 3 try ke baad server ka count hi dikha do (hamesha khaali na rahe)
        if ((commentsVerifyTriesRef.current[key] || 0) >= 3) {
          feedCommentsConfirmed.add(key);
          setPosts((prev) => prev.map((p) => (String(p.id) === key ? { ...p } : p)));
        } else {
          commentsVerifiedRef.current.delete(key);
        }
        return;
      }
      if (res.hasMore) {
        // bahut zyada comments — server ka count hi sahi maano
        feedCommentsConfirmed.add(key);
        setPosts((prev) => prev.map((p) => (String(p.id) === key ? { ...p } : p)));
        return;
      }
      const real = res.comments.reduce(
        (sum, c) => sum + 1 + Number(c?.replies_count ?? (Array.isArray(c?.replies) ? c.replies.length : 0) ?? 0),
        0
      );
      setPosts((prev) => prev.map((p) => {
        if (String(p.id) !== key) return p;
        const server = Number(p.commentsCount || 0);
        feedCommentsConfirmed.add(key);
        if (server !== real) feedCommentVerify.set(key, { server, real });
        const localCount = Array.isArray(p.comments) ? countFeedComments(p.comments) : 0;
        return { ...p, commentsCount: Math.max(real, localCount) };   // hamesha naya object → card dobara render ho
      }));
    } catch {
      if ((commentsVerifyTriesRef.current[key] || 0) >= 3) {
        feedCommentsConfirmed.add(key);
        setPosts((prev) => prev.map((p) => (String(p.id) === key ? { ...p } : p)));
      } else {
        commentsVerifiedRef.current.delete(key);
      }
    }
  }, []);

  // ✅ FIX (0 comment par "1" dikhna): count sirf active reel par nahi, saare loaded reels par
  // feed khulte hi asli comment list se verify hota hai — "1 → baad me 0" wali der nahi lagti.
  useEffect(() => {
    const pending = posts
      .filter((p) => !p.isAd && Number(p.commentsCount || 0) > 0 && !commentsVerifiedRef.current.has(String(p.id)))
      .slice(0, 30);
    if (!pending.length) return undefined;
    let cancelled = false;
    // ✅ FIX (shuru me lag): feed khulte hi 30 comment-requests video ke download se ladte the —
    // ab pehle video ko bandwidth milti hai, 4 sec baad count verify hota hai (aur sirf pehle 10 reels).
    const startTimer = setTimeout(() => {
      (async () => {
        for (const p of pending.slice(0, 10)) {
          if (cancelled) break;
          await handleVerifyComments(p.id);
          await new Promise((r) => setTimeout(r, 150));
        }
      })();
    }, 4000);
    return () => { cancelled = true; clearTimeout(startTimer); };
  }, [posts, handleVerifyComments]);

  // ✅ Login required popup (like / comment / save bina login ke nahi)
  const { isLoggedIn } = useAuth();
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const requireLogin = useCallback((closeSheets = false) => {
    if (isLoggedIn) return true;
    if (closeSheets) { setCommentPost(null); setDescPost(null); }
    setLoginPromptVisible(true);
    return false;
  }, [isLoggedIn]);

  // ✅ FIX: ek post pe ek waqt sirf ek hi like-request in-flight rahe —
  // isse fast double-tap ke wajah se backend pe do POST /likes call jaake
  // "like → auto unlike" wala race condition nahi hota.
  const likeInFlightRef = useRef(new Set());

  const handleLike = useCallback(async (id) => {
    if (!requireLogin()) return;
    const targetPost = posts.find((post) => String(post.id) === String(id));
    if (targetPost?.isAd) {
      setPosts(prev => prev.map(p => p.id === id ? {
        ...p,
        liked: !p.liked,
        likes: Math.max(0, Number(p.likes || 0) + (p.liked ? -1 : 1)),
      } : p));
      return;
    }

    const key = String(id);
    if (likeInFlightRef.current.has(key)) return; // pehla tap abhi bhi pending hai
    likeInFlightRef.current.add(key);

    const originalLiked = Boolean(targetPost?.liked);
    const originalLikes = Number(targetPost?.likes || 0);
    const optimisticLiked = !originalLiked;
    const optimisticLikes = Math.max(0, originalLikes + (optimisticLiked ? 1 : -1));

    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, liked: optimisticLiked, likes: optimisticLikes }
      : p));

    try {
      const result = await UserStore.updateNewsFeedItem(id, 'like', { liked: originalLiked });
      if (result?.ok && typeof result.liked === 'boolean') {
        const finalLiked = result.liked;
        // Server ka likes_count final truth; na aaye to hi local ±1 fallback
        const finalLikes = Number.isFinite(result.likesCount)
          ? Math.max(0, result.likesCount)
          : Math.max(0, originalLikes + (finalLiked ? 1 : -1));
        setPosts(prev => prev.map(p => p.id === id
          ? { ...p, liked: finalLiked, likes: finalLikes }
          : p));
      } else {
        // API fail — optimistic change revert karo
        setPosts(prev => prev.map(p => p.id === id
          ? { ...p, liked: originalLiked, likes: originalLikes }
          : p));
        // Asli error dikhao (pehle chup-chaap revert hota tha, isliye unlike fail hone ka reason pata nahi chalta tha)
        console.warn('[Feed like] failed', { id, wasLiked: originalLiked, result });
        if (result?.message) Alert.alert(originalLiked ? 'Unlike failed' : 'Like failed', result.message);
      }
    } catch {
      setPosts(prev => prev.map(p => p.id === id
        ? { ...p, liked: originalLiked, likes: originalLikes }
        : p));
    } finally {
      likeInFlightRef.current.delete(key);
    }
  }, [posts, requireLogin]);

  const handleBookmark = useCallback(async (id) => {
    if (!requireLogin()) return;
    const targetPost = posts.find((post) => String(post.id) === String(id));
    if (targetPost?.isAd) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
      return;
    }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
    try {
      const result = await UserStore.updateNewsFeedItem(id, 'bookmark');
      if (result?.ok && typeof result.bookmarked === 'boolean') {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: result.bookmarked } : p));
      } else {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
      }
    } catch {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
    }
  }, [posts, requireLogin]);

  const handleComment = useCallback(async (id) => {
    setCommentPost(id);
    await syncPostComments(id);
  }, [syncPostComments]);

  const handleShare = useCallback((id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, shares: (Number(p.shares) || 0) + 1 } : p));
    setSharePost(id);
  }, []);

  const handleDescription = useCallback(async (id) => {
    setDescPost(id);
    await syncPostComments(id);
  }, [syncPostComments]);

  const handleAddComment = useCallback(async (text, replyToId = null, targetPostId = commentPost || descPost) => {
    if (!targetPostId) return;
    if (!requireLogin(true)) return;
    const tempId = Date.now().toString();
    const currentAvatar = String(currentUser.avatar || currentUser.profile_image || '').trim();
    const newComment = {
      id: tempId,
      user: currentUser.name || 'User',
      author: currentUser.name || 'User',
      author_email: currentUserEmail || '',
      author_profile_image: currentAvatar,
      avatar: currentAvatar,
      text,
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      liked_by: [],
    };

    addPendingComment(targetPostId, newComment, replyToId);
    setPosts(prev =>
      prev.map(p => p.id === targetPostId
        ? {
            ...p,
            comments: replyToId
              ? p.comments.map(c => c.id === replyToId
                  ? { ...c, replies: [...(c.replies || []), newComment] }
                  : c
                )
              : [...(Array.isArray(p.comments) ? p.comments : []), newComment],
            commentsCount: (p.commentsCount ?? (Array.isArray(p.comments) ? p.comments.length : 0)) + 1,
          }
        : p)
    );

    try {
      const result = replyToId
        ? await UserStore.replyNewsComment(targetPostId, replyToId, text)
        : await UserStore.addNewsComment(targetPostId, text);

      if (!result?.ok) {
        // ✅ FIX: comment server par save nahi hua — chup-chaap gayab karne ke bajay asli error dikhao
        console.warn('[Feed comment] failed', { targetPostId, replyToId, result });
        removePendingComment(targetPostId, tempId);
        setPosts(prev => prev.map(p => {
          if (p.id !== targetPostId) return p;
          const strip = (list) => (Array.isArray(list) ? list : [])
            .filter((c) => c.id !== tempId)
            .map((c) => (Array.isArray(c.replies) ? { ...c, replies: c.replies.filter((r) => r.id !== tempId) } : c));
          const nextComments = strip(p.comments);
          return { ...p, comments: nextComments, commentsCount: countFeedComments(nextComments) };
        }));
        Alert.alert('Comment failed', result?.message || 'Unable to post comment. Please try again.');
        return;
      }

      // Server ka real comment (real id ke saath) — temp comment ki jagah wahi rakho
      const saved = result.comment
        ? normalizeFeedComment({ ...newComment, ...result.comment, text: result.comment.text || text }, `cmt-${tempId}`, commentProfilesByEmail)
        : null;
      // pending entry ko server wale real comment se badlo (real id ke saath)
      if (saved) { removePendingComment(targetPostId, tempId); addPendingComment(targetPostId, saved, replyToId); }
      await syncPostComments(targetPostId, { keepIfEmpty: true, ensureComment: replyToId ? null : (saved || newComment) });
    } catch {
      await syncPostComments(targetPostId, { keepIfEmpty: true });
    }
  }, [commentPost, currentUser.avatar, currentUser.name, currentUser.profile_image, currentUserEmail, descPost, syncPostComments, commentProfilesByEmail, requireLogin]);

  const handleEditComment = useCallback(async (commentId, newText) => {
    setPosts(prev =>
      prev.map(p => ({
        ...p,
        comments: Array.isArray(p.comments) ? p.comments.map(c => {
          if (c.id === commentId) return { ...c, text: newText, edited_at: new Date().toISOString() };
          if (Array.isArray(c.replies)) {
            return {
              ...c,
              replies: c.replies.map(r => r.id === commentId ? { ...r, text: newText, edited_at: new Date().toISOString() } : r)
            };
          }
          return c;
        }) : p.comments
      }))
    );
    try {
      await UserStore.editNewsComment(commentPost, commentId, newText);
    } catch {}
  }, [commentPost]);

  const handleDeleteComment = useCallback(async (commentId) => {
    // ✅ FIX: pehle yahan SAARI reels ka comment count 1-1 kam ho jaata tha (sirf target post ka hona chahiye),
    // aur server fail hone par comment wapas bhi nahi aata tha.
    const targetId = commentPost || descPost;
    removePendingComment(targetId, commentId);
    setPosts(prev =>
      prev.map(p => {
        if (String(p.id) !== String(targetId)) return p;
        const before = countFeedComments(p.comments);
        const nextComments = (Array.isArray(p.comments) ? p.comments : [])
          .filter(c => c.id !== commentId)
          .map(c => (Array.isArray(c.replies) ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c));
        const removed = Math.max(0, before - countFeedComments(nextComments));
        const baseCount = Number(p.commentsCount ?? before);
        return { ...p, comments: nextComments, commentsCount: Math.max(0, baseCount - removed) };
      })
    );
    try {
      const res = await UserStore.deleteNewsComment(targetId, commentId);
      if (!res?.ok) await syncPostComments(targetId, { keepIfEmpty: false });
    } catch {
      await syncPostComments(targetId, { keepIfEmpty: false });
    }
  }, [commentPost, descPost, syncPostComments]);

  const handleLikeComment = useCallback(async (commentId) => {
    if (!requireLogin(true)) return;
    setPosts(prev =>
      prev.map(p => ({
        ...p,
        comments: Array.isArray(p.comments) ? p.comments.map(c => {
          if (c.id === commentId) {
            const liked = Array.isArray(c.liked_by) && currentUserEmail && c.liked_by.includes(currentUserEmail);
            return {
              ...c,
              liked_by: liked
                ? c.liked_by.filter(email => email !== currentUserEmail)
                : [...(c.liked_by || []), currentUserEmail],
              likes: liked ? (c.likes || 0) - 1 : (c.likes || 0) + 1
            };
          }
          if (Array.isArray(c.replies)) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === commentId) {
                  const liked = Array.isArray(r.liked_by) && currentUserEmail && r.liked_by.includes(currentUserEmail);
                  return {
                    ...r,
                    liked_by: liked
                      ? r.liked_by.filter(email => email !== currentUserEmail)
                      : [...(r.liked_by || []), currentUserEmail],
                    likes: liked ? (r.likes || 0) - 1 : (r.likes || 0) + 1
                  };
                }
                return r;
              })
            };
          }
          return c;
        }) : p.comments
      }))
    );
    try {
      const res = await UserStore.likeNewsComment(commentPost || descPost, commentId);
      if (!res?.ok) await syncPostComments(commentPost || descPost, { keepIfEmpty: true });
    } catch {
      await syncPostComments(commentPost || descPost, { keepIfEmpty: true });
    }
  }, [commentPost, descPost, currentUserEmail, syncPostComments, requireLogin]);

  const handleNewPost = useCallback(async ({ caption, headline, tag, mediaUri, mediaType, audioMix = null }) => {
  const isVideoPost = mediaType === 'Video';
  const currentEmail = String(currentUser.email || currentUserEmail || '').trim().toLowerCase();
  const mediaTypeMap = { None: 0, Image: 1, Video: 2, File: 3 };

  // ✅ Free limit ab sirf backend enforce karta hai (403 NEWS_LIMIT_REACHED) — local pre-check hata diya.

  // ── Music / voice-over / mute: phone par merge NAHI — raw video + fields backend ko jaate hain.
  // Backend final processed video banata hai aur `news.media` me wahi URL deta hai.
  const sendMediaUri = mediaUri;
  const audioMixForServer = isVideoPost && audioMix ? audioMix : null;

  // ✅ FIX: pehle backend pe asli news banao, tabhi like/comment/view kaam karenge
  const apiResult = await AuthAPI.createNews({
    type: 2, // Feed (Reel)
    title: headline || 'My RTI Story',
    subTitle: '',
    description: caption,
    reportType: tag,
    mediaType: mediaTypeMap[mediaType] ?? 0,
    mediaUri: sendMediaUri,
    mediaName: isVideoPost ? 'video.mp4' : 'image.jpg',
    mediaMime: isVideoPost ? 'video/mp4' : 'image/jpeg',
    // Music / voice-over — sirf tab bhejo jab phone par merge nahi ho paaya (backend ffmpeg se merge karega)
    audioMix: audioMixForServer,
  });

  if (!apiResult.ok) {
    if (apiResult.limitReached) {
      setUploadVisible(false);
      setNewsLimitModal({ visible: true, message: apiResult.message });
      return;
    }
    Alert.alert('Save failed', apiResult.message || 'Unable to save this reel. Please try again.');
    return;
  }

  // free_posts_remaining (number | null) — backend ki last-known value cache karo (null-safe)
  UserStore.setNewsFreePostsRemaining(apiResult.freePostsRemaining);

  const backendNewsId = apiResult?.news?.id ?? apiResult?.data?.id ?? apiResult?.data?.news?.id;
  if (!backendNewsId) {
    Alert.alert('Save failed', 'News created but ID missing from server response.');
    return;
  }

  const postId = String(backendNewsId);
  // ✅ Playback hamesha backend ke `news.media` se — local selected file ka URL nahi
  const serverItem = UserStore.mapApiNewsItem(apiResult.news || apiResult.data?.news || apiResult.data);
  const serverVideoUrl = isVideoPost ? (serverItem.video || serverItem.media || '') : '';
  const serverImageUrl = !isVideoPost ? (serverItem.images?.[0] || sendMediaUri) : '';
  const nextPost = {
    id: postId,
    user: currentUser.name || 'User',
    avatar: currentUser.avatar || '',
    verified: Boolean(currentUser.has_blue_tick), role: 'Citizen', location: 'India', time: 'Just now',
    author_has_blue_tick: Boolean(currentUser.has_blue_tick),
    type: isVideoPost ? 'video' : 'image',
    media: isVideoPost ? serverVideoUrl : serverImageUrl,
    video: isVideoPost ? serverVideoUrl : null,
    thumbnail: isVideoPost ? '' : serverImageUrl,
    image: isVideoPost ? '' : serverImageUrl,
    useFrame: Boolean(serverItem.useFrame),
    frameTemplate: serverItem.frameTemplate,
    frameMerged: Boolean(serverItem.frameMerged),
    musicUrl: serverItem.musicUrl || '',
    musicVolume: serverItem.musicVolume ?? 0.6,
    muteOriginal: Boolean(serverItem.muteOriginal),
    headline: headline || 'My RTI Story',
    caption, fullDescription: caption,
    likes: 0, shares: 0, comments: [],
    liked: false, bookmarked: false, tag, tagColor: '#16a34a',
    createdAt: new Date().toISOString(),
    createdBy: currentEmail,
  };
  setPosts(prev => [nextPost, ...prev]);

  // ✅ Local `user.news` me copy save nahi hoti — data sirf server se aata hai.
}, [currentUser, currentUserEmail]);

const lastViewableIndexRef = useRef(0);
const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      lastViewableIndexRef.current = viewableItems[0].index ?? 0;
      setActiveIndex(lastViewableIndexRef.current);
    }
  });

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 60 },
      onViewableItemsChanged: (params) => onViewableItemsChangedRef.current(params),
    },
  ]).current;

  const activeCommentData = posts.find(p => p.id === commentPost);
  const activeShareData   = posts.find(p => p.id === sharePost);
  const activeDescData    = posts.find(p => p.id === descPost);

  useEffect(() => {
    if (!isScreenFocused) {
      setActiveIndex(-1);
    } else {
      // ✅ FIX (auto-play): Feed par wapas aane par activeIndex -1 hi reh jaata tha (list ka viewable item
      // badla nahi to callback dobara chalta nahi) — isliye video khud play nahi hota tha, tap karna padta tha.
      setActiveIndex((cur) => (cur < 0 ? (lastViewableIndexRef.current || 0) : cur));
    }
  }, [isScreenFocused]);

  // ✅ LIVE SYNC: kisi bhi jagah (Home card, Details, Profile, ya server se dusre user ka like/comment) count badle
  // to is feed ke reels par turant dikhe — refresh nahi karna padega.
  useEffect(() => subscribeEngagement((id, patch) => {
    setPosts((prev) => {
      if (!Array.isArray(prev) || !prev.length) return prev;
      let changed = false;
      const next = prev.map((p) => {
        if (String(p.id) !== String(id)) return p;
        const upd = applyFeedEngagement(p, patch);
        if (upd !== p) changed = true;
        return upd;
      });
      return changed ? next : prev;
    });
  }), []);

  // Feed khula rahe to har 20 sec me chupchap latest counts lao (UserStore ise live push kar deta hai).
  // App background se wapas aane par bhi turant.
  useLiveRefresh(
    async () => {
      if (feedLoadingRef.current) return;
      await UserStore.getNewsFeedSummary({ type: 2, feedType: 'feeds', perPage: 10, comments: 0 });
    },
    { intervalMs: 20000, runOnFocus: false }
  );

  // ✅ FIX: Android back button se app band ho jaata tha (Feed stack ka root ban jaata hai).
  // Ab back = pichli screen, aur agar pichli screen nahi hai to Home. App tabhi band hoga
  // jab user Home par ho. Sirf Feed focus me ho tab active rehta hai.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (navigation?.canGoBack?.()) navigation.goBack();
        else navigation?.navigate?.('Home');
        return true;
      });
      return () => sub.remove();
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchFeed = async ({ loadMore = false } = {}) => {
        if (feedLoadingRef.current || (loadMore && (!feedHasMoreRef.current || !feedCursorRef.current))) return;
        feedLoadingRef.current = true;
        const requestId = ++feedRequestIdRef.current;
        try {
          let nextProfileMap = {};
          // GET /api/feeds — sirf feed/reel posts (type 2). Response key: `news`
          const summaryValue = await UserStore.getNewsFeedSummary({
            type: 2,
            feedType: 'feeds',
            perPage: 10,
            comments: 0,
            ...(loadMore && feedCursorRef.current ? { cursor: feedCursorRef.current } : {}),
          });
          const userProfileValue = summaryValue?.currentUser || await UserStore.getCurrentUser();
          if (!active || requestId !== feedRequestIdRef.current) return;

          const profileData = userProfileValue;
          if (profileData) {
            const realName   = profileData.name || profileData.full_name || profileData.username || profileData.email?.split('@')[0] || 'User';
            const realAvatar = isValidImageUrl(profileData.avatar || profileData.profile_image) ? (profileData.avatar || profileData.profile_image) : null;
            setCurrentUser({
              name: realName,
              email: String(profileData.email || '').trim().toLowerCase(),
              avatar: realAvatar,
              has_blue_tick: Boolean(UserStore.hasBlueTick(profileData)),
            });
            if (profileData.email) {
              setCurrentUserEmail(String(profileData.email).trim().toLowerCase());
            }
          }

          try {
            const allUsers = await UserStore.getAllUsers();
            if (active && Array.isArray(allUsers)) {
              nextProfileMap = allUsers.reduce((acc, user) => {
                const email = String(user?.email || '').trim().toLowerCase();
                if (!email) return acc;
                acc[email] = {
                  name: String(user?.name || user?.full_name || user?.username || '').trim(),
                  avatar: String(user?.profile_image || user?.avatar || '').trim(),
                  profile_image: String(user?.profile_image || user?.avatar || '').trim(),
                };
                return acc;
              }, {});
              setCommentProfilesByEmail(nextProfileMap);
            }
          } catch {}

          if (summaryValue?.items) {
            const currentEmail = String(profileData?.email || '').trim().toLowerCase();
            const sourceItems = summaryValue.items.map((item) => {
  // media_type: 1 = image, 2 = video, 3 = PDF, 4 = external URL
  const mt = String(item.mediaType || '');
  const rawMedia = typeof item.media === 'string' ? item.media.trim() : '';
  const isHttp = /^https?:/i.test(rawMedia);
  const videoFromItem = String(
    typeof item.video === 'string' ? item.video : item.video?.uri || ''
  ).trim();
  let kind;
  if (mt === 'Video') kind = 'video';
  else if (mt === 'File') kind = 'pdf';
  else if (mt === 'Link') kind = 'link';
  else if (mt === 'Image') kind = 'image';
  else kind = (videoFromItem || (isHttp && /\.(mp4|m4v|mov|webm|ogv|m3u8)(\?.*)?$/i.test(rawMedia))) ? 'video' : 'image';

  const videoUri = kind === 'video' ? (videoFromItem || (isHttp ? rawMedia : '')) : '';
  const imagesList = kind === 'image' && Array.isArray(item.images)
    ? item.images.filter((u) => typeof u === 'string' && u.trim())
    : [];
  // image post: images[] render hogi; images khali ho to `media` fallback image URL
  const imageUri = kind === 'image'
    ? String(item.thumbnail || item.image || imagesList[0] || (isHttp ? rawMedia : '') || '').trim()
    : '';
  if (kind === 'image' && !imagesList.length && imageUri) imagesList.push(imageUri);
  const docUrl = (kind === 'pdf' || kind === 'link') && isHttp ? rawMedia : '';

  return {
    ...item,
    id: String(item.id || Date.now()),
    type: kind,
    media: kind === 'video' ? videoUri : kind === 'image' ? imageUri : docUrl,
    video: kind === 'video' ? videoUri : null,
    // video ko kabhi image/thumbnail ki tarah use nahi karna — poster sirf backend thumbnail se
    thumbnail: kind === 'video' ? String(item.thumbnail || '') : imageUri,
    image: imageUri,
    images: imagesList,
    avatar: item.avatar || item.author_profile_image || '',
    // ✅ FIX: liked ab server ke `liked_by_me` (ya liked_by me apni email) se aata hai —
    // pehle yahan sirf item.liked padha jata tha jo API se kabhi set hi nahi hota tha,
    // isliye screen se wapas aane par like hamesha hat jaata tha.
    liked: Boolean(
      item.liked_by_me === true ||
      item.liked === true ||
      (currentEmail && Array.isArray(item.liked_by) &&
        item.liked_by.some((e) => String(e || '').trim().toLowerCase() === currentEmail))
    ),
    bookmarked: Boolean(item.bookmarked),
    likes: Number(item.likes) || 0,
    shares: Number(item.shares) || 0,
  };
});
            const cleanedPosts = sourceItems.map((item) => {
              const rawComments = Array.isArray(item.comments_list)
                ? item.comments_list
                : (Array.isArray(item.comments) ? item.comments : []);
              const normalizedComments = rawComments.map((comment, index) =>
                normalizeFeedComment(comment, `cmt-${item.id || 'post'}-${index + 1}`, nextProfileMap)
              );

              return {
  ...item,
  id: String(item.id || Date.now()),
  avatar: isValidImageUrl(item.avatar) ? item.avatar : null,
  media: item.media || '',
  video: item.video || null,
  thumbnail: item.thumbnail || null,
image: item.image || null,
  comments: normalizedComments,
  commentsCount: Number(
    item.commentsCount ??
    item.comments_count ??
    item.comments ??
    countFeedComments(normalizedComments)
  ),
  likes: Number(item.likes) || 0,
  shares: Number(item.shares) || 0,
  liked: Boolean(item.liked),
  bookmarked: Boolean(item.bookmarked),
};
            });
            setPosts((prevPosts) => {
              if (profileModeRef.current) return prevPosts;
              if (loadMore) {
                const seen = new Set(prevPosts.map((post) => String(post.id)));
                return [...prevPosts, ...cleanedPosts.filter((post) => !seen.has(String(post.id))).map(overlayFeedEngagement)];
              }
              const refreshed = cleanedPosts.map((np) => {
                const old = prevPosts.find((op) => String(op.id) === String(np.id));
                let merged = (old && Array.isArray(old.comments) && old.comments.length && !(np.comments && np.comments.length))
                  ? { ...np, comments: old.comments }
                  : np;
                if (hasRecentPending(np.id)) {
                  merged = { ...merged, comments: mergePendingComments(np.id, merged.comments), commentsCount: Math.max(Number(merged.commentsCount || 0), Number(old?.commentsCount || 0)) };
                }
                return overlayFeedEngagement(merged);
              });
              // Profile se khola gaya reel / ad refetch ke baad bhi top par bana rahe
              const pinned = pinnedPostRef.current;
              if (pinned && !refreshed.some((p) => String(p.id) === String(pinned.id))) return [pinned, ...refreshed];
              return refreshed;
            });
          } else {
            if (!loadMore) setPosts([]);
          }
          const pagination = summaryValue?.pagination || {};
          feedCursorRef.current = pagination.next_cursor || null;
          feedHasMoreRef.current = Boolean(pagination.has_more && pagination.next_cursor);
        } catch (e) { console.log('Feed fetch error:', e); }
        finally {
          if (requestId === feedRequestIdRef.current) feedLoadingRef.current = false;
        }
      };
      feedRequestIdRef.current += 1;
      feedLoadingRef.current = false;
      feedCursorRef.current = null;
      feedHasMoreRef.current = false;
      loadMoreFeedRef.current = () => fetchFeed({ loadMore: true });
      fetchFeed();
      return () => { active = false; loadMoreFeedRef.current = () => {}; };
    }, [])
  );

  const page = (
    <View style={{ flex: 1, backgroundColor: '#000', overflow: 'hidden' }}>
  {isWebPlatform ? <AppNavbar navigation={navigation} activeScreen="Feed" hideTopHeader={true} /> : null}

      <View
  style={{ flex: 1, backgroundColor: '#000', alignItems: isMobileLayout ? 'stretch' : 'center', justifyContent: 'flex-start', overflow: 'hidden' }}
  onLayout={(event) => {
    // ✅ FIX: height ko round NAHI karte. Android par real height fractional hoti hai (e.g. 764.57);
    // round karne se card height aur list ki asli height me farq aa jaata tha aur reverse swipe snap-back hota tha.
    const nextHeight = event?.nativeEvent?.layout?.height || 0;
    if (nextHeight > 0 && Math.abs(nextHeight - feedViewportHeight) > 0.5) {
      setFeedViewportHeight(nextHeight);
    }
  }}
>
        <View style={{
  width: isMobileLayout ? '100%' : effectiveCardWidth,
  height: cardHeight, 
  overflow: 'hidden',
  ...(!isMobileLayout && responsiveWidth > MOBILE_BREAKPOINT
    ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }
    : {}),
}}>
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <ReelCard
                post={item}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onComment={handleComment}
                onShare={handleShare}
                onDescription={handleDescription}
                onVerifyComments={handleVerifyComments}
                          onProfilePress={(postData) =>
                  navigation.navigate('UserProfile', {
                    userId: postData.author_id || undefined,
                    email: String(postData.createdBy || postData.created_by || '').trim().toLowerCase(),
                    author: {
                      name: postData.user,
                      author_profile_image: isValidImageUrl(postData.avatar) ? postData.avatar : null,
                      author_role_label: postData.role,
                      author_seat_name: postData.location,
                      author_has_blue_tick: Boolean(postData.author_has_blue_tick || postData.verified),
                      has_blue_tick: Boolean(postData.author_has_blue_tick || postData.verified),
                      author_is_premium: Boolean(postData.author_is_premium),
                      author_is_subscriber: false,
                      createdBy: String(postData.createdBy || postData.created_by || '').trim().toLowerCase(),
                    },
                  })
                }
                onAdPress={(adPost) => openAdRedirect(adPost, navigation, {
                  onProfilePress: (targetAd) =>
                    navigation.navigate('UserProfile', {
                      email: String(targetAd.createdBy || targetAd.created_by || '').trim().toLowerCase(),
                      author: {
                        name: targetAd.user,
                        author_profile_image: isValidImageUrl(targetAd.avatar) ? targetAd.avatar : null,
                        author_role_label: targetAd.role,
                        author_seat_name: targetAd.location,
                        author_has_blue_tick: Boolean(targetAd.author_has_blue_tick || targetAd.verified),
                        has_blue_tick: Boolean(targetAd.author_has_blue_tick || targetAd.verified),
                        createdBy: String(targetAd.createdBy || targetAd.created_by || '').trim().toLowerCase(),
                      },
                    }),
                })}
                onFollow={true}
                isActive={index === activeIndex && isScreenFocused}
                isNear={activeIndex >= 0 && Math.abs(index - activeIndex) <= 1 && isScreenFocused}
                bottomInset={isWebPlatform ? 0 : navBarH}
                cardWidth={effectiveCardWidth}
                cardHeight={cardHeight}
                isMobileLayout={isMobileLayout}
              />
            )}
            ref={feedListRef}
            // ✅ FIX (Android reverse-scroll snap-back): pehle `pagingEnabled` + `snapToInterval` dono the —
            // do snapping engines ek saath lad rahe the. Ab sirf ek: exact snapToOffsets.
            snapToOffsets={snapOffsets}
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => feedListRef.current?.scrollToOffset?.({ offset: info.averageItemLength * info.index, animated: false }), 60);
            }}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
            getItemLayout={(_, index) => ({ length: cardHeight, offset: cardHeight * index, index })}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            updateCellsBatchingPeriod={60}
            windowSize={3}
            // ✅ FIX: removeClippedSubviews Android par video cards ke saath scroll jump/blank deta hai
            removeClippedSubviews={false}
            onEndReached={() => loadMoreFeedRef.current?.()}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={{ flex: 1, minHeight: cardHeight || 400, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ionicons name="videocam-outline" size={32} color="#94a3b8" />
                </View>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>No Feeds Available</Text>
                <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', maxWidth: 280 }}>Check back later or explore other sections</Text>
              </View>
            }
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
      </View>

      <UploadModal visible={uploadVisible} onClose={() => setUploadVisible(false)} onPost={handleNewPost} />
      <NewsLimitModal
        visible={newsLimitModal.visible}
        message={newsLimitModal.message}
        onBuy={() => {
          setNewsLimitModal((prev) => ({ ...prev, visible: false }));
          navigation.navigate('Subscription Plans', { returnTo: 'Feed' });
        }}
        onCancel={() => setNewsLimitModal((prev) => ({ ...prev, visible: false }))}
      />

      <LoginRequiredModal
        visible={loginPromptVisible}
        onClose={() => setLoginPromptVisible(false)}
        onLogin={() => {
          setLoginPromptVisible(false);
          try { navigation.navigate('Login'); } catch {}
        }}
      />

      {activeCommentData ? (
        <CommentsModal
          visible={!!commentPost}
          onClose={() => setCommentPost(null)}
          post={activeCommentData}
          comments={Array.isArray(activeCommentData?.comments) ? activeCommentData.comments.map(c => ({
            ...c,
            user: c.user || c.author || 'User',
            text: c.text || '',
          })) : []}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onLikeComment={handleLikeComment}
        />
      ) : null}

      <ShareModal
        visible={!!sharePost}
        onClose={() => setSharePost(null)}
        post={activeShareData}
      />

      <DescriptionModal
        visible={!!descPost}
        onClose={() => setDescPost(null)}
        post={activeDescData}
        onShare={() => { setDescPost(null); handleShare(descPost); }}
        onAddComment={handleAddComment}
        currentUser={currentUser}
      />

      {!isWebPlatform && (
        // ✅ FIX: navbar pehle video ke NEECHE alag row me tha, isliye uske curved corners me peeche ka
        // black background dikhta tha. Ab navbar video ke upar overlay hai — corners me video hi dikhega.
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
          onLayout={(e) => {
            const h = e?.nativeEvent?.layout?.height || 0;
            if (h > 0 && Math.abs(h - navBarH) > 0.5) setNavBarH(h);
          }}
        >
          <AppNavbar
            navigation={navigation}
            activeScreen="Feed"
            hideTopHeader={true}
          />
        </View>
      )}
    </View>
  );

  return isWebPlatform && !isMobileLayout ? <WebLayout>{page}</WebLayout> : page;
}