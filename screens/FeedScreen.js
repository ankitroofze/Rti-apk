import NameWithTick from '../components/NameWithTick';
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
import AppNavbar from '../components/AppNavbar';
import NewsLimitModal from '../components/NewsLimitModal';
import ProfileAvatar from '../components/ProfileAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import WebLayout from '../components/WebLayout';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl, storeWebUriToIdbMedia } from '../utils/webMediaStore';
import { safePause, safePlay, safeSetMuted } from '../utils/videoPlayerSafe';
import { useGlobalMuted, getGlobalMuted } from '../utils/Globalmutestore';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';
import { getAdRedirectMeta, openAdRedirect } from '../utils/adRedirect';

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
  const tagOptions = ['Success Story', 'Application Filed', 'Victory', 'Question', 'Official Update', 'Corruption Exposed'];

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
      setMediaType(isVideo ? 'Video' : 'Image');
      setMediaUri(asset.uri);
    } catch {
      Alert.alert('Upload failed', 'Unable to select this media.');
    } finally {
      setPicking(false);
    }
  };

  const handlePost = () => {
    if (!caption.trim()) { Alert.alert('Caption required', 'Please write something.'); return; }
    if (!mediaUri) { Alert.alert('Media required', 'Please choose a video or photo.'); return; }
    onPost({ caption, headline, tag, mediaUri, mediaType });
    setCaption('');
    setHeadline('');
    setMediaUri('');
    setMediaType('Video');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.uploadSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>📰 New Post</Text>
          <TouchableOpacity style={styles.mediaBox} activeOpacity={0.7} onPress={pickMedia}>
            <Text style={styles.mediaBoxIcon}>🎥</Text>
            <Text style={styles.mediaBoxText}>{mediaUri ? `${mediaType} selected` : (picking ? 'Opening...' : 'Add Video / Photo')}</Text>
            <Text style={styles.mediaBoxSub}>{mediaUri ? 'Tap to change media' : '(choose from gallery)'}</Text>
          </TouchableOpacity>
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
function ActionColumn({ post, onLike, onComment, onShare, onBookmark, onDescription, scaleAnim, isMobileLayout, bottomInset = 0 }) {
  const formatCount = (n) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
    n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n);

  // ✅ FIX: post.likes ab backend se aata hua TRUE total hai (apna like bhi
  // usme already included hai), isliye yahan +1 add nahi karna.
  const likeCount    = formatCount(Number(post.likes));
  const shareCount   = formatCount(Number(post.shares));
  const commentCount = post.commentsCount ?? (Array.isArray(post.comments) ? post.comments.length : 0);
  const viewCount    = formatCount(Number(post.views || 0));

  const sz = isMobileLayout ? 44 : 52;
  const iconSz = isMobileLayout ? 22 : 26;

  const circle = (bg) => ({
    width: sz, height: sz, borderRadius: sz / 2,
    backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 3,
  });

  const textShadow = Platform.OS !== 'web'
    ? { textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }
    : {};

  const containerStyle = isMobileLayout
  ? { position: 'absolute', right: 6, bottom: bottomInset > 0 ? bottomInset + 20 : 100, alignItems: 'center', gap: 14, zIndex: 20 }
    : { width: 90, paddingLeft: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', height: '100%', gap: 22, flexShrink: 0 };

  const btn          = { alignItems: 'center', gap: 2 };
  const countStyle   = { color: '#fff', fontSize: 12, fontWeight: '700', ...textShadow };
  const labelStyle   = { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', ...textShadow };

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={btn} onPress={() => onLike(post.id)} activeOpacity={0.75}>
        <Animated.View style={[circle(post.liked ? 'rgba(255,59,92,0.28)' : 'rgba(0,0,0,0.5)'), { transform: [{ scale: scaleAnim }] }]}>
          <HeartIcon filled={post.liked} size={iconSz} />
        </Animated.View>
        <Text style={[countStyle, { color: post.liked ? '#ff3b5c' : '#fff' }]}>{likeCount}</Text>
        {!isMobileLayout ? <Text style={labelStyle}>Like</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity style={btn} onPress={() => onComment(post.id)} activeOpacity={0.75}>
        <View style={circle('rgba(0,0,0,0.5)')}><CommentIcon size={iconSz} /></View>
        <Text style={countStyle}>{commentCount}</Text>
        {!isMobileLayout ? <Text style={labelStyle}>Comment</Text> : null}
      </TouchableOpacity>

      <TouchableOpacity style={btn} onPress={() => onShare(post.id)} activeOpacity={0.75}>
        <View style={circle('rgba(0,0,0,0.5)')}><ShareIcon size={iconSz} /></View>
        <Text style={countStyle}>{shareCount}</Text>
        {!isMobileLayout ? <Text style={labelStyle}>Share</Text> : null}
      </TouchableOpacity>

      {!post.isAd ? (
        <View style={btn}>
          <View style={circle('rgba(0,0,0,0.5)')}><Ionicons name="eye-outline" size={iconSz} color="#fff" /></View>
          <Text style={countStyle}>{viewCount}</Text>
          {!isMobileLayout ? <Text style={labelStyle}>Views</Text> : null}
        </View>
      ) : null}

      {/* Save (bookmark) button abhi ke liye hata diya gaya hai */}
    </View>
  );
}

// Is session me jin reels ka view record ho chuka hai
const feedViewedIds = new Set();

// Reel Card
function ReelCard({ post, onLike, onBookmark, onComment, onShare, onDescription, onProfilePress, onAdPress, onFollow, isActive, isNear = true, bottomInset = 0, cardWidth, cardHeight, isMobileLayout }) {
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserHasBlueTick, setCurrentUserHasBlueTick] = useState(false);

  const comments    = Array.isArray(safePost.comments) ? safePost.comments : [];
  const caption     = String(safePost.caption || '');
  const userName    = String(safePost.user || 'User');
  const avatarUri   = String(safePost.avatar || safePost.author_profile_image || '');
  const location    = String(safePost.location || safePost.author_seat_name || '');
  const headline    = String(safePost.headline || '');
  const role        = String(safePost.role || safePost.author_role || '');
  const time        = String(safePost.time || '');
    const postId      = String(safePost.id || '');
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
  const authorEmail = String(safePost.createdBy || safePost.created_by || '').trim().toLowerCase();
  const authorId     = safePost.author_id ?? safePost.authorId ?? null;
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
    Linking.openURL(docUrl).catch(() => Alert.alert('Error', 'Could not open the link.'));
  }, [docUrl]);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const currentUser = await UserStore.getCurrentUser();
        if (currentUser && currentUser.email) {
          setCurrentUserEmail(currentUser.email);
          setCurrentUserHasBlueTick(UserStore.hasBlueTick(currentUser));
        }
        if (authorEmail && onFollow) {
          const status = await UserStore.getFollowStatus(authorEmail);
          setIsFollowing(status.isFollowing);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
      }
    };
    initializeComponent();
  }, [authorEmail, onFollow]);

  const handleFollowPress = async () => {
    if (!authorEmail) return;
    // ✅ FAST: pehle button badlo (optimistic), API peeche chale; fail ho to wapas.
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (currentUser && currentUser.email === authorEmail) {
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
      Alert.alert('Error', 'Unable to update follow status. Please try again.');
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
  const activeSource = isNear ? videoSource : null;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const player = useVideoPlayer(activeSource, (p) => {
    try {
      p.loop = true;
      p.muted = getGlobalMuted();   // global mute state se start
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

  // Reset poster/ready when video source changes
  useEffect(() => {
    setShowPoster(true);
    setPlayerReady(false);
  }, [activeSource]);

  useEffect(() => { setCaptionExpanded(false); }, [postId]);

  // Apply muted state to player
  useEffect(() => {
    if (!canPlayVideo || !player || !activeSource) return;
    safeSetMuted(player, muted);
  }, [canPlayVideo, activeSource, muted, player]);

  // Handle play/pause based on active state + player readiness
  useEffect(() => {
    if (!canPlayVideo || !player || !activeSource || !playerReady) return;

    const playVideo = async () => {
      if (isActive && !paused) {
        try {
          await safePlay(player);
        } catch (error) {
          console.log('Auto-play failed:', error);
          setPaused(true);
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
    ? (Platform.OS === 'web' ? 80 : (bottomInset > 0 ? bottomInset + 12 : navbarH + safeBot + 12))
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
            <>
              <VideoView
                player={player}
                style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', backgroundColor: '#000' }]}
                contentFit="cover"
                nativeControls={false}
                fullscreenOptions={{ enabled: false }}
                playsInline
              />
              {showPoster && safeThumbnailUrl ? (
                <Image
                  source={{ uri: safeThumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  onError={() => setThumbnailError(true)}
                />
              ) : null}
            </>
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
                    <Image key={`${u}-${i}`} source={{ uri: u }} style={{ width: galleryW, height: cardHeight }} resizeMode="cover" />
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
              resizeMode="cover"
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

        {canPlayVideo && (muted || paused) ? (
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
          post={{ ...safePost, likes: Number(safePost.likes || 0), shares, comments, commentsCount: safePost.commentsCount ?? comments.length, views: Number(safePost.views || 0) + viewBump }}
          onLike={handleLikePress} onComment={onComment} onShare={onShare}
          onBookmark={onBookmark} onDescription={onDescription}
          scaleAnim={scaleAnim} isMobileLayout={true} bottomInset={bottomInset}
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

          {headline ? <Text style={styles.reelHeadline} numberOfLines={2}>{headline}</Text> : null}

          <TouchableOpacity activeOpacity={0.85} onPress={() => onDescription(postId)}>
            <Text style={styles.reelCaption} numberOfLines={captionExpanded ? undefined : 2}>{caption}</Text>
            {caption.length > 80 && (
              <Text style={styles.reelCaptionMore}>more</Text>
            )}
          </TouchableOpacity>

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

          {(safePost.commentsCount > 0 || comments.length > 0) && (
            <TouchableOpacity onPress={() => onComment(postId)} style={{ marginTop: 5 }}>
              <Text style={styles.reelViewComments}>View all {safePost.commentsCount ?? comments.length} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
}

// Main Feed Screen
export default function FeedScreen({ navigation }) {
  const [posts, setPosts]               = useState([]);
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
  const snapOffsets = useMemo(
    () => Array.from({ length: Math.max(posts.length, 1) }, (_, i) => i * cardHeight),
    [posts.length, cardHeight]
  );

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
        let next = normalizedComments;
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
        return { ...post, comments: next, commentsCount: countFeedComments(next) };
      }));
    } catch {}
  }, [commentProfilesByEmail]);

  // ✅ FIX: ek post pe ek waqt sirf ek hi like-request in-flight rahe —
  // isse fast double-tap ke wajah se backend pe do POST /likes call jaake
  // "like → auto unlike" wala race condition nahi hota.
  const likeInFlightRef = useRef(new Set());

  const handleLike = useCallback(async (id) => {
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
  }, [posts]);

  const handleBookmark = useCallback(async (id) => {
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
  }, [posts]);

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
      await syncPostComments(targetPostId, { keepIfEmpty: true, ensureComment: replyToId ? null : saved });
    } catch {
      await syncPostComments(targetPostId, { keepIfEmpty: true });
    }
  }, [commentPost, currentUser.avatar, currentUser.name, currentUser.profile_image, currentUserEmail, descPost, syncPostComments, commentProfilesByEmail]);

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
    setPosts(prev =>
      prev.map(p => ({
        ...p,
        comments: Array.isArray(p.comments) ? p.comments.filter(c => {
          if (c.id === commentId) return false;
          if (Array.isArray(c.replies)) {
            c.replies = c.replies.filter(r => r.id !== commentId);
          }
          return true;
        }) : p.comments,
        commentsCount: Math.max(0, (p.commentsCount ?? (Array.isArray(p.comments) ? p.comments.length : 0)) - 1)
      }))
    );
    try {
      await UserStore.deleteNewsComment(commentPost, commentId);
    } catch {}
  }, [commentPost]);

  const handleLikeComment = useCallback(async (commentId) => {
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
      await UserStore.likeNewsComment(commentPost, commentId);
    } catch {}
  }, [commentPost, currentUserEmail]);

  const handleNewPost = useCallback(async ({ caption, headline, tag, mediaUri, mediaType }) => {
  const isVideoPost = mediaType === 'Video';
  const currentEmail = String(currentUser.email || currentUserEmail || '').trim().toLowerCase();
  const mediaTypeMap = { None: 0, Image: 1, Video: 2, File: 3 };

  // ✅ Free limit ab sirf backend enforce karta hai (403 NEWS_LIMIT_REACHED) — local pre-check hata diya.

  // ✅ FIX: pehle backend pe asli news banao, tabhi like/comment/view kaam karenge
  const apiResult = await AuthAPI.createNews({
    type: 2, // Feed (Reel)
    title: headline || 'My RTI Story',
    subTitle: '',
    description: caption,
    reportType: tag,
    mediaType: mediaTypeMap[mediaType] ?? 0,
    mediaUri,
    mediaName: isVideoPost ? 'video.mp4' : 'image.jpg',
    mediaMime: isVideoPost ? 'video/mp4' : 'image/jpeg',
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
  const nextPost = {
    id: postId,
    user: currentUser.name || 'User',
    avatar: currentUser.avatar || '',
    verified: Boolean(currentUser.has_blue_tick), role: 'Citizen', location: 'India', time: 'Just now',
    author_has_blue_tick: Boolean(currentUser.has_blue_tick),
    type: isVideoPost ? 'video' : 'image',
    media: mediaUri,
    video: isVideoPost ? mediaUri : null,
    thumbnail: isVideoPost ? '' : mediaUri,
    image: isVideoPost ? '' : mediaUri,
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

const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
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
    }
  }, [isScreenFocused]);

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
              if (loadMore) {
                const seen = new Set(prevPosts.map((post) => String(post.id)));
                return [...prevPosts, ...cleanedPosts.filter((post) => !seen.has(String(post.id)))];
              }
              return cleanedPosts.map((np) => {
                const old = prevPosts.find((op) => String(op.id) === String(np.id));
                return (old && Array.isArray(old.comments) && old.comments.length && !(np.comments && np.comments.length))
                  ? { ...np, comments: old.comments }
                  : np;
              });
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
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 0 }}
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