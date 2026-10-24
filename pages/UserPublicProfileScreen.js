import NameWithTick from '../components/NameWithTick';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, BackHandler, Clipboard, Image, ImageBackground, KeyboardAvoidingView, Linking, Modal,
  Platform, ScrollView, Share, StatusBar, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileAvatar from '../components/ProfileAvatar';
import AutoIdCardPreview from '../components/IdCardPreview';
import AutoIdCardBackPreview from '../components/IdCardBackPreview';
import ScaledCard from '../components/ScaledCard';
import AutoAppointmentLetterPreview from '../components/AppointmentLetterPreview';
import { hasPublicDocumentSource, getProfileTier, generateMemberId, getSubscriptionName, resolveAreaText, cleanRoleNames } from '../utils/profileHelpers';
import { cardFromProfile } from '../utils/idCardService';
import { useToast } from '../components/ui/ToastProvider';
import VerifiedBadge from '../components/VerifiedBadge';
import VideoPreview from '../components/VideoPreview';
import { UserStore } from '../store/UserStore';
import { isValidImageUrl } from '../utils/storyHelpers';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';
import styles from '../styles/UserPublicProfileStyles';
import ProfileStyles from '../styles/ProfileStyles';

// Red header image ko poore header me fill karne ke liye
const RED_HEADER_IMG = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  width: '100%', height: '100%', resizeMode: 'cover',
};


// ── Helpers ────────────────────────────────────────────────────────────────────

function useResolvedUri(rawUri) {
  const [resolved, setResolved] = useState(() => {
    if (!rawUri || isIdbMediaUri(rawUri)) return null;
    return rawUri;
  });
  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    if (!rawUri) { setResolved(null); return; }
    if (!isIdbMediaUri(rawUri)) { setResolved(rawUri); return; }
    resolveIdbMediaUriToObjectUrl(rawUri).then((url) => {
      if (!alive) { if (url) { try { URL.revokeObjectURL(url); } catch {} } return; }
      objectUrl = url;
      setResolved(url || null);
    }).catch(() => { if (alive) setResolved(null); });
    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [rawUri]);
  return resolved;
}

function PostCardImage({ rawUri, style, resizeMode = 'cover' }) {
  const resolved = useResolvedUri(rawUri);
  const [error, setError] = useState(false);

  useEffect(() => { setError(false); }, [rawUri]);

  if (!resolved || error) {
    return (
      <View style={[style, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }]}>
        <Feather name="image" size={22} color="#cbd5e1" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setError(true)}
    />
  );
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatAccountAge(joinDate) {
  if (!joinDate) return '';
  const ts = new Date(joinDate).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffDays = Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
  const years = Math.floor(diffDays / 365);
  if (years >= 1) return `${years}y`;
  const months = Math.floor(diffDays / 30);
  if (months >= 1) return `${months}mo`;
  return `${Math.max(1, diffDays)}d`;
}

function getNumericCount(value) {
  if (Array.isArray(value)) return value.length;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roleLabelToEnglish(role = '') {
  const v = String(role || '').toLowerCase();
  if (v === 'reporter') return 'Reporter';
  if (v === 'editor') return 'Editor';
  if (v === 'admin') return 'Admin';
  return '';
}

const ORANGE = '#FF9967';
// Referral code ka color (label black rahega, sirf code red)
const REFERRAL_RED = '#DC2626';

// ── Modals ─────────────────────────────────────────────────────────────────────

const ProfileImageModal = ({ visible, imageUri, name, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }} activeOpacity={0.8}>
          <Feather name="x" size={22} color="#ffffff" />
        </TouchableOpacity>
        {name ? <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 20, letterSpacing: 0.3 }}>{name}</Text> : null}
        <TouchableWithoutFeedback>
          <ProfileAvatar uri={imageUri} size={360} iconSize={132} style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }} placeholderStyle={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)' }} iconColor="#ffffff" />
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

// ── Profile share sheet: WhatsApp / Facebook / Telegram / X / Email / Copy / More ──────────────
// NOTE: web par profile ka public link yahan se banta hai. Agar aapka web route alag ho to
// sirf neeche ke 2 constants badal do.
const PROFILE_SHARE_BASE = 'https://rtinews.in';
const PROFILE_SHARE_PATH = '/UserPublicProfile';

const ShareProfileSheet = ({ visible, onClose, name, url, message, onCopy, onMore }) => {
  const text = encodeURIComponent(message);
  const link = encodeURIComponent(url);
  const open = (target) => { onClose?.(); Linking.openURL(target).catch(() => {}); };
  const options = [
    { key: 'wa', label: 'WhatsApp', icon: 'whatsapp', color: '#25D366', onPress: () => open(`https://wa.me/?text=${text}`) },
    { key: 'fb', label: 'Facebook', icon: 'facebook', color: '#1877F2', onPress: () => open(`https://www.facebook.com/sharer/sharer.php?u=${link}`) },
    { key: 'tg', label: 'Telegram', icon: 'telegram', color: '#229ED9', onPress: () => open(`https://t.me/share/url?url=${link}&text=${encodeURIComponent(name + ' on RTI News')}`) },
    { key: 'x', label: 'X', icon: 'twitter', color: '#0f172a', onPress: () => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(name + ' on RTI News')}&url=${link}`) },
    { key: 'mail', label: 'Email', icon: 'email-outline', color: '#EA4335', onPress: () => open(`mailto:?subject=${encodeURIComponent(name + ' - RTI News')}&body=${text}`) },
    { key: 'copy', label: 'Copy Link', icon: 'link-variant', color: ORANGE, onPress: () => { onClose?.(); onCopy?.(); } },
    { key: 'more', label: 'More', icon: 'share-variant', color: '#64748b', onPress: () => { onClose?.(); onMore?.(); } },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', alignItems: 'center' }}>
          <TouchableWithoutFeedback>
            <View style={{ width: '100%', maxWidth: 520, backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 14 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Share Profile</Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 2, marginBottom: 14, paddingHorizontal: 24 }} numberOfLines={1}>{name}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
                {options.map((o) => (
                  <TouchableOpacity key={o.key} onPress={o.onPress} activeOpacity={0.75} style={{ width: '25%', alignItems: 'center', paddingVertical: 12 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: o.color, justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name={o.icon} size={26} color="#ffffff" />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 6 }} numberOfLines={1}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ paddingVertical: 14, alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#64748b' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const ProfileMenuSheet = ({ visible, onClose, onCopyLink, onReport, onBlock }) => (
  <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <TouchableOpacity onPress={onCopyLink} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0E6', justifyContent: 'center', alignItems: 'center' }}><Feather name="link" size={18} color={ORANGE} /></View>
              <View><Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>Copy Profile Link</Text><Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Share this profile with others</Text></View>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 24 }} />
            <TouchableOpacity onPress={onReport} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' }}><Feather name="flag" size={18} color="#f97316" /></View>
              <View><Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>Report</Text><Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Report inappropriate content</Text></View>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 24 }} />
            <TouchableOpacity onPress={onBlock} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, gap: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center' }}><Feather name="slash" size={18} color="#ef4444" /></View>
              <View><Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>Block</Text><Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Block this user from your feed</Text></View>
            </TouchableOpacity>
            <View style={{ height: 8, backgroundColor: '#f8fafc', marginTop: 8 }} />
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#64748b' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const BlockConfirmModal = ({ visible, name, onCancel, onConfirm }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 16, padding: 24 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>Block User</Text>
        <Text style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>{`Are you sure you want to block "${name}"?`}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.75} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} activeOpacity={0.75} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Block</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const COLLAPSE_CHAR_LIMIT = 180;
const ExpandableDescription = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const cleaned = String(text || '').trim();
  const isLong = cleaned.length > COLLAPSE_CHAR_LIMIT;
  if (!cleaned) return null;
  const displayText = (!isLong || expanded) ? cleaned : cleaned.slice(0, COLLAPSE_CHAR_LIMIT).trimEnd();
  return (
    <View style={styles.expandableContainer}>
      <Text style={styles.feedDescription}>
        {displayText}
        {isLong && !expanded ? (
          <Text onPress={() => setExpanded(true)} style={{ color: ORANGE, fontWeight: '600', fontSize: 13 }}>
            {'... '}<Text style={{ color: ORANGE, fontWeight: '600', fontSize: 13 }}>more</Text>
          </Text>
        ) : null}
      </Text>
      {isLong && expanded ? (
        <TouchableOpacity onPress={() => setExpanded(false)} activeOpacity={0.7} style={{ marginTop: 2 }}>
          <Text style={{ color: ORANGE, fontWeight: '600', fontSize: 13 }}>less</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function UserPublicProfileScreen({ route, navigation }) {
  const { showToast } = useToast();
  // showToast ki identity har toast ke baad badal sakti hai — usse effect dobara chalta tha,
  // stale backend data aata tha aur followers count achanak 0 ho jata tha. Ref se stable rakho.
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);
   const { email, author, userId } = route?.params || {};

  // ── Responsive width detection ─────────────────────────────────────────────
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const resolvedEmail = useMemo(
    () => (email ? String(email).trim().toLowerCase() : ''),
    [email]
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [gridView, setGridView] = useState(true);

  // ── Follow states ──────────────────────────────────────────────────────────
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
 const [followLists, setFollowLists] = useState({ followers: [], following: [] });
  const [followModalType, setFollowModalType] = useState('');
  const selfFollowActionRef = useRef(false);
  const followActionInFlightRef = useRef(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [modalName, setModalName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [viewerEmail, setViewerEmail] = useState('');

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // ✅ FIX: Android back / upar-neeche karte waqt app se bahar nikal jaata tha
  // (profile notification / link se khula ho to stack me pichli screen nahi hoti).
  // Ab: pichli screen hai to wahan, nahi to Home.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation?.canGoBack?.()) navigation.goBack();
      else navigation?.navigate?.('Home');
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await UserStore.getCurrentUser();
        if (!alive) return;
        setViewerEmail(String(user?.email || '').trim().toLowerCase());
      } catch { if (!alive) return; setViewerEmail(''); }
    })();
    return () => { alive = false; };
  }, []);

  // ── Load profile + posts ────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
           setLoading(true);
      let user = userId
        ? await UserStore.getPublicProfileById(userId)
        : (resolvedEmail ? await UserStore.getUser(resolvedEmail) : null);
      if (!active) return;
      setProfile(user || null);
          try {
        if (active) {
          setFollowStats({
            followers: getNumericCount(user?.followers_count ?? user?.followers ?? user?.referral_count ?? 0),
            following: getNumericCount(user?.following_count ?? user?.following ?? 0),
          });
          setFollowLists({ followers: [], following: [] });
        }
        // ✅ FIX: local cache / is_followed field kabhi update nahi hote follow ke baad,
        // isliye already-followed user ke profile pe bhi "Follow" hi dikhta tha.
        // Ab NewsFeedCard jaisa hi live check (getFollowSummary) use karo.
            const targetIdForFollow = userId ?? user?.id ?? null;
               const summary = (resolvedEmail || targetIdForFollow) ? await UserStore.getFollowSummary?.(resolvedEmail, targetIdForFollow) : null;
        if (active) {
          setIsFollowing(Boolean(summary?.isFollowing));
          // followersCount / followingCount null aaye (target ki id resolve nahi hui) to
          // purane counts mat todo — warna count achanak 0 ho jata tha.
          if (summary && summary.followersCount != null && summary.followingCount != null) {
            setFollowLists({ followers: summary.followers || [], following: summary.following || [] });
            setFollowStats({ followers: summary.followersCount, following: summary.followingCount });
          }
        }
        // ✅ NEW: agar backend se is post/author ka numeric id nahi mila (author_id null tha),
        // to follow/followers list se mile id se profile.id backfill kardo — isse Block/Report
        // jaise actions ke liye targetId resolve ho jaayega.
        // Dusre device par A ka local record nahi hota (ya purana hota hai) -> role/subscription
        // missing rehta tha aur profile hamesha default dikhta tha. Isliye tier 'common' aaye
        // ya posts na ho to server se full public profile (subscription ke saath) fetch karo.
        const tierLooksCommon = getProfileTier({
          ...(user || {}),
          has_blue_tick: user ? Boolean(UserStore.hasBlueTick(user)) : false,
        }).key === 'common';
        // FIX: local cache purana ho sakta hai (role/blue tick badal chuka ho) — isliye HAMESHA server se fresh lo.
        const needsFullProfile = true;
        if (active && !userId && summary?.resolvedId && needsFullProfile) {
          try {
            const full = await UserStore.getPublicProfileById(summary.resolvedId);
            if (full && active) {
              // Purane cached blue tick / plan flags hata do, phir fresh server data lagao
              const { has_blue_tick: _a, is_blue_tick: _b, blue_tick: _c, subscription_plan: _d, active_plan: _e, role_subscription_plan: _f, subscription: _g, subscription_type: _h, role: _i, state_seat: _j, ...cleanOld } = (user || {});
              user = { ...cleanOld, ...full };
              setProfile(user);
            }
          } catch { /* ignore */ }
        }
        if (active && !user?.id && summary?.resolvedId) {
          setProfile((prev) => (prev ? { ...prev, id: summary.resolvedId } : { id: summary.resolvedId }));
        }
      } catch { /* ignore */ }
        const fromProfile = [
        ...(Array.isArray(user?.posts) ? user.posts : []),
        ...(Array.isArray(user?.news) ? user.news : []),
        ...(Array.isArray(user?.news_feed) ? user.news_feed : []),
      ];

           const display = user || author || {};
      const authorName = String(display?.name || display?.author_name || '').trim();
      const effectiveEmail = String(resolvedEmail || user?.email || '').trim().toLowerCase();
      const effectiveId = String(userId ?? user?.id ?? '').trim();

      // userId pata ho to posts GET /profile/{id} se aa chuke hain; viewer ka /my-news yahan galat hai.
      const summary = (!effectiveId && (resolvedEmail || authorName))
        ? await UserStore.getNewsFeedSummary({ skipBlockedUsers: true })
        : null;
      const fromFeed = Array.isArray(summary?.items)
        ? summary.items.filter((it) => {
          const createdBy = String(it?.createdBy || '').trim().toLowerCase();
          if (effectiveEmail && createdBy) return createdBy === effectiveEmail;
          if (!effectiveEmail && authorName) {
            const itemAuthor = String(it?.author_name || it?.createdByName || it?.author || '').trim();
            return itemAuthor && itemAuthor.toLowerCase() === authorName.toLowerCase();
          }
          return false;
        })
        : [];

      // Ads are public profile content too. Include both locally saved ads and
      // server ads so another user can see the advertiser's posts on profile.
      const localAds = Array.isArray(user?.ads)
        ? user.ads.map((ad) => ({ ...ad, owner_email: ad?.owner_email || user?.email || resolvedEmail }))
        : [];
      const publicAds = await UserStore.getActiveAdsFeed?.({ skipBlockedUsers: true }) || [];
      const profileAds = [...localAds, ...publicAds]
        .filter((ad) => {
          const owner = String(ad?.owner_email || ad?.createdBy || '').trim().toLowerCase();
          const adOwnerId = String(ad?.owner_id ?? ad?.user_id ?? '').trim();
          if (effectiveEmail && owner === effectiveEmail) return true;
          return Boolean(effectiveId && adOwnerId && adOwnerId === effectiveId);
        })
        .map((ad) => ({
          ...ad,
          id: String(ad.feed_id || `ad-${ad.id}`),
          isAd: true,
          title: ad.title || 'Sponsored Advertisement',
          description: ad.description || '',
          image: ad.image || ad.photo || '',
          images: ad.image || ad.photo ? [ad.image || ad.photo] : [],
          createdBy: ad.owner_email || resolvedEmail,
          author_name: ad.owner_name || user?.name || 'Advertiser',
          createdAt: ad.updated_at || ad.created_at || '',
          date: ad.updated_at || ad.created_at || '',
        }));

      const merged = [...fromFeed, ...fromProfile, ...profileAds]
        .filter(Boolean)
        .filter((it, index, arr) => {
          const id = it?.id != null ? String(it.id) : '';
          if (!id) return arr.findIndex((x) => x === it) === index;
          return arr.findIndex((x) => x?.id != null && String(x.id) === id) === index;
        });

            setPosts(merged);
      setLoading(false);
      if (!user && resolvedEmail) showToastRef.current?.('User profile not found on this device. Showing available info.', 'error');
    })();
    return () => { active = false; };
  // A profile may be opened with only userId (the following API does not
  // always provide email). Include it so moving between profiles reloads.
  }, [resolvedEmail, userId, author]);

  // ✅ FIX: is profile ke liye follow button + followers count ab app mein kahin
  // bhi (news card se bhi) follow/unfollow hote hi turant sync ho jayega.
  useEffect(() => {
    if (!resolvedEmail && userId == null) return undefined;
    const unsubscribe = UserStore.subscribeFollowState?.((payload) => {
      if (UserStore.matchesFollowTarget?.(payload, resolvedEmail, userId)) {
        setIsFollowing(Boolean(payload.isFollowing));
        if (!selfFollowActionRef.current) {
          setFollowStats((prev) => ({
            ...prev,
            followers: Math.max(0, Number(prev.followers || 0) + (payload.isFollowing ? 1 : -1)),
          }));
        }
      }
    });
    return () => { unsubscribe?.(); };
  }, [resolvedEmail, userId]);
  // ── Derived profile values ──────────────────────────────────────────────────

    const display = profile || author || {};
  const name = String(display?.name || display?.author_name || 'User').trim() || 'User';
  const roleLabel = String(display?.role_label || display?.author_role_label || '').trim();
  const state = String(display?.state || display?.author_state || '').trim();
  const district = String(display?.district || display?.author_district || '').trim();
  const taluka = String(display?.taluka || display?.author_taluka || '').trim();
 const bio = String(display?.bio || '').trim();
  const rawReferralCode = String(display?.my_referral_code || display?.referral_code || '').trim();
    // Latest active Premium plan hamesha purane seat/role label se upar rahega
  const _hasRoleTier = ['representative', 'executive', 'chief'].includes(getProfileTier({
    state_seat: display?.state_seat, seat_id: display?.seat_id, seat_name: display?.seat_name,
    role: display?.role || display?.author_role,
    subscription_plan: display?.subscription_plan,
  }).key);
  const latestIsPremium = !_hasRoleTier && Boolean(UserStore.hasBlueTick(profile || display));
  const seatName = latestIsPremium ? '' : String(display?.state_seat?.seat_name || display?.author_seat_name || '').trim();
  const seatId = latestIsPremium ? '' : String(display?.state_seat?.seat_id || display?.author_seat_id || '').trim();
  const roleId = latestIsPremium ? 'premium' : String(display?.role || display?.author_role || '').trim().toLowerCase();
  const _mapRoleId = (id) => { try { return UserStore.getSeatRoleNameForPlanRoleId?.(id) || ''; } catch { return ''; } };
  const purchasedRoleNames = cleanRoleNames(
    Array.isArray(display?.subscription_plan?.role_names) && display.subscription_plan.role_names.length
      ? display.subscription_plan.role_names
      : (display?.subscription_plan?.role_id_raw || display?.subscription_plan?.role_id || ''),
    _mapRoleId
  );
  // The purchased plan designation is the visible role.  Generic cached
  // labels (for example "Free Member") must not replace it.
  const rolePillText = latestIsPremium
    ? 'Premium User'
    : (purchasedRoleNames || roleLabelToEnglish(roleId) || roleLabel || seatName || '');
  const joinDate = String(display?.join_date || '').trim();
  const networkCount = (() => {
    const val = Number(display?.referral_count || 0);
    return isNaN(val) ? 0 : val;
  })();

  const baseFollowersCount = (() => {
    const val = getNumericCount(display?.followers_count ?? display?.followers ?? networkCount ?? 0);
    return isNaN(val) ? 0 : val;
  })();
  const followersCount = (() => {
    const fallback = baseFollowersCount;
    const val = followStats.followers !== undefined && followStats.followers !== null
      ? Number(followStats.followers)
      : fallback;
    return Number.isFinite(val) ? val : fallback;
  })();
  const followingCount = (() => {
    const fallback = getNumericCount(display?.following_count ?? display?.following ?? 0);
    const val = followStats.following !== undefined && followStats.following !== null
      ? Number(followStats.following)
      : fallback;
    return Number.isFinite(val) ? val : fallback;
  })();
  const locationLine = [taluka, district, state].filter(Boolean).join(', ');
  const accountAge = formatAccountAge(joinDate);

  const photoUri = display?.profile_image || display?.author_profile_image || '';
  const safePhotoUri = isValidImageUrl(photoUri) ? photoUri : '';
  // Never trust stale post/legacy flags: entitlement belongs to this profile's
  // active Premium Plan and is identical on web and Android.
  const isVerified = !_hasRoleTier && Boolean(UserStore.hasBlueTick(profile || display));
  const isSubscribedProfile = Boolean(
    display?.is_subscribed || display?.author_is_subscribed || ['basic', 'pro', 'premium'].includes(roleId)
  );
  // Role Based Profile Look — jis user ka profile visit ho raha hai, USKA tier
  // (color/background) yahan se decide hota hai — visitor ko humesha profile
  // owner ka role-color he dikhega, chahe visitor khud kisi bhi role ka ho.
  const profileTier = getProfileTier({
    state_seat: latestIsPremium ? null : (display?.state_seat || { seat_id: seatId, seat_name: seatName }),
    role: latestIsPremium ? 'premium' : (display?.role || display?.author_role),
    subscription_type: latestIsPremium ? 'premium' : (display?.subscription_type || display?.author_subscription_type),
    subscription_plan: display?.subscription_plan,
    has_blue_tick: isVerified,
    is_subscribed: isSubscribedProfile,
  });
  const pillTheme = { bg: `${profileTier.accent}1F`, border: profileTier.accent, text: profileTier.accent };
  // Role/seat wale user ka pill uske seat ka naam dikhata hai (jaise "State Bureau Chief"),
  // baaki tiers me Common User / Premium User / Verified User.
  const tierPillLabel = (['representative', 'executive', 'chief'].includes(profileTier.key) && seatName) ? seatName : profileTier.label;
  // Badge/pill me SUBSCRIPTION ka naam dikhao (role tiers ke liye) — seat_name (jagah ka naam) nahi.
  const isRoleTier = ['representative', 'executive', 'chief'].includes(profileTier.key);
  const subscriptionPillLabel = isRoleTier
    ? (getSubscriptionName(display) || rolePillText || tierPillLabel)
    : tierPillLabel;
  // Referral code tab dikhta hai jab profile owner ne koi role / subscription / premium liya ho
  // (yaani tier common se upar ho) — visitor chahe Common user ho ya kuch bhi.
  const hasPaidAccess = profileTier.key !== 'common' || isSubscribedProfile;
  // Web / mobile-web par pehle common user ka pill gayab rehta tha jabki Android/iOS par 'Common User' dikhta tha
  const shownPillText = rolePillText || tierPillLabel;
  const referralCode = hasPaidAccess ? rawReferralCode : '';
  // ID Card + Appointment Letter: sirf jab owner ne ROLE subscription liya ho (Premium/Verified/Common nahi).
  // Visitor koi bhi ho (Common bhi) use ye dikhna chahiye.
  const hasRoleSubscription = ['representative', 'executive', 'chief'].includes(profileTier.key);
  const showDocuments = hasRoleSubscription && hasPublicDocumentSource(display);

  // ── "ID & Letter" tab content — apne ProfileScreen ke "Documents" section jaisa hi layout ──
  // stacked=true  -> mobile web / Android / iOS: ID front + back upar-neeche (220px), phir letter
  // stacked=false -> desktop web: ID front + back side-by-side (220px), phir letter
  // Sizes ProfileScreen jaise hi: ID 220/360, Letter 194/560. Download button visitor ko nahi dikhta.
  const docCardStyle = { backgroundColor: '#ffffff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 };
  const renderDocumentsTab = (stacked = true) => (
    <View style={{ marginTop: 16, paddingHorizontal: 12, paddingBottom: 24, width: '100%' }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Documents</Text>

      {/* ID Card (front + back) */}
      <View style={[docCardStyle, { alignItems: 'center' }]}>
        <View style={{ width: '100%', alignSelf: 'center', alignItems: 'center', paddingVertical: 8, flexDirection: stacked ? 'column' : 'row', ...(stacked ? {} : { flexWrap: 'wrap' }), justifyContent: 'center', gap: stacked ? 12 : 10 }}>
          <ScaledCard width={220} naturalWidth={360} style={{ alignSelf: 'center' }}>
            <AutoIdCardPreview profile={display} viewOnly />
          </ScaledCard>
          <ScaledCard width={220} naturalWidth={360} style={{ alignSelf: 'center' }}>
            <AutoIdCardBackPreview />
          </ScaledCard>
        </View>
      </View>

      {/* Appointment Letter */}
      <View style={docCardStyle}>
        <View style={{ width: '100%', alignItems: 'center', paddingVertical: 8 }}>
          <ScaledCard width={194} naturalWidth={560}>
            <AutoAppointmentLetterPreview profile={display} />
          </ScaledCard>
        </View>
      </View>
    </View>
  );
  // Documents tab hide ho gaya (owner ka role badla) to posts par wapas
  const effectiveTab = activeTab === 'documents' && !showDocuments ? 'posts' : activeTab;
  // Bio + location bhi sirf paid (role / premium) owner ke public profile par.
  const shownBio = hasPaidAccess ? bio : '';
  const shownLocationLine = hasPaidAccess ? locationLine : '';
  const shownState = hasPaidAccess ? state : '';
  // ID No: pehle backend ke id-card ka id_number, phir member_id, tab jaake generated fallback
  const idCardInfo = (() => { try { return cardFromProfile(display); } catch { return null; } })();
  const memberIdText = String(idCardInfo?.id_number || display?.id_number || display?.member_id || display?.memberId || '').trim()
    || (display?.email || resolvedEmail ? generateMemberId(display?.email || resolvedEmail) : '');
  // Mobile: backend `phone` bhejta hai; baaki naam purane local records ke liye
  const mobileText = String(
    display?.phone || display?.mobile_number || display?.phone_number || display?.contact_number || display?.mobile ||
    display?.author_mobile || display?.author_phone || ''
  ).trim();
  // Role + Area: seat ka naam (jaise "State Bureau Chief") aur uska area (state / district / taluka)
  const roleAreaRole = shownPillText || tierPillLabel || '';
  const seatArea = String(
    display?.state_seat?.area || display?.state_seat?.area_name || display?.state_seat?.location || display?.area || display?.author_area || ''
  ).trim();
  const roleAreaPlace = seatArea || resolveAreaText(display) || locationLine;
  const hasContactCard = Boolean(roleAreaRole || roleAreaPlace || mobileText || memberIdText);
  const renderContactCard = (extraStyle) => (hasContactCard ? (
    <View style={[{ marginHorizontal: 12, marginTop: 12, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 14 }, extraStyle]}>
      {[
        { key: 'role', icon: 'award', label: 'Role', value: roleAreaRole },
        { key: 'area', icon: 'map-pin', label: 'Area', value: roleAreaPlace },
        { key: 'mobile', icon: 'smartphone', label: 'Mobile', value: mobileText, onPress: mobileText ? () => Linking.openURL(`tel:${mobileText}`).catch(() => {}) : null },
        { key: 'id', icon: 'credit-card', label: 'ID No', value: memberIdText },
      ].filter((r) => r.value).map((r, i, arr) => (
        <TouchableOpacity
          key={r.key}
          activeOpacity={r.onPress ? 0.7 : 1}
          onPress={r.onPress || undefined}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: '#f1f5f9' }}
        >
          <Feather name={r.icon} size={15} color={profileTier.accent} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginLeft: 8, width: 58 }}>{r.label}</Text>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>{r.value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null);
  const resolvedProfilePhoto = useResolvedUri(safePhotoUri || null);

  // ── Sorted posts ────────────────────────────────────────────────────────────

  const sortedPosts = useMemo(() => {
    const src = Array.isArray(posts) ? posts : [];
    const sortValue = (it) => {
      const createdAt = new Date(it?.createdAt || it?.date || 0).getTime();
      const idValue = Number(String(it?.id || '').replace(/\D/g, '')) || 0;
      return Number.isFinite(createdAt) && createdAt > 0 ? createdAt + idValue : idValue;
    };
    return [...src].sort((a, b) => sortValue(b) - sortValue(a));
  }, [posts]);

  // Posts count: backend ka total (agar bheje) aur loaded posts me se jo bada ho.
  const postsCount = (() => {
    const backend = getNumericCount(display?.posts_count ?? display?.news_count ?? display?.total_posts ?? 0);
    return Math.max(sortedPosts.length, Number.isFinite(backend) ? backend : 0);
  })();

  // ── Post helpers ────────────────────────────────────────────────────────────

  const patchPostById = (postId, patch) => {
    const pid = String(postId || '');
    if (!pid) return;
    setPosts((prev) => Array.isArray(prev) ? prev.map((p) => String(p?.id || '') !== pid ? p : { ...p, ...patch }) : prev);
  };

  const loadCommentsForPost = async (postId) => {
    const pid = String(postId || '').trim();
    if (!pid) return;
    try {
      const summary = await UserStore.getNewsFeedSummary({ focusItemId: pid });
      const item = Array.isArray(summary?.items) ? summary.items.find((it) => String(it?.id || '') === pid) : null;
      const list = Array.isArray(item?.comments_list) ? item.comments_list : [];
      setActiveComments(list);
      patchPostById(pid, {
        comments: Number(item?.comments || 0),
        likes: Number(item?.likes || 0),
        shares: Number(item?.shares || 0),
        views: Number(item?.views || 0),
        liked_by: Array.isArray(item?.liked_by) ? item.liked_by : [],
      });
    } catch { setActiveComments([]); }
  };

  const openPost = async (post) => {
    if (!post) return;
    try { if (post.id) await UserStore.updateNewsFeedItem(post.id, 'view'); } catch {}
    navigation.navigate('NewsDetails', { article: post });
  };

  const handleLikePost = async (post) => {
    const pid = String(post?.id || '').trim();
    if (!pid) return;
    const prevLiked = Boolean(viewerEmail && Array.isArray(post?.liked_by) && post.liked_by.includes(viewerEmail));
    patchPostById(pid, {
      likes: Math.max(0, Number(post?.likes || 0) + (prevLiked ? -1 : 1)),
      liked_by: prevLiked ? [] : (viewerEmail ? [viewerEmail] : []),
    });
    const result = await UserStore.updateNewsFeedItem(pid, 'like', { liked: prevLiked });
    if (!result?.ok) {
      patchPostById(pid, { likes: Number(post?.likes || 0), liked_by: Array.isArray(post?.liked_by) ? post.liked_by : [] });
      showToast(result?.message || 'Unable to update like.', 'error');
      return;
    }
    if (typeof result.liked === 'boolean') {
      patchPostById(pid, {
        likes: Math.max(0, Number(post?.likes || 0) + (result.liked ? 1 : 0) - (prevLiked ? 1 : 0)),
        liked_by: result.liked && viewerEmail ? [viewerEmail] : [],
      });
    }
  };

  const handleSharePost = async (post) => {
    const pid = String(post?.id || '').trim();
    if (!pid) return;
    const message = `📰 ${stripHtml(post?.title || 'News')}\n\n${stripHtml(post?.subtitle || post?.description || '')}`;
    try { await Share.share({ title: stripHtml(post?.title || 'RTI News'), message }); }
    catch { showToast('Share failed.', 'error'); return; }
    patchPostById(pid, { shares: Number(post?.shares || 0) + 1 });
    const result = await UserStore.updateNewsFeedItem(pid, 'share');
    if (!result?.ok) showToast(result?.message || 'Unable to update share.', 'error');
  };

  const openCommentsForPost = async (post) => {
    const pid = String(post?.id || '').trim();
    if (!pid) return;
    setActiveCommentPostId(pid);
    setCommentText('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setReplyingToCommentId(null);
    setReplyText('');
    setCommentModalVisible(true);
    await loadCommentsForPost(pid);
  };

  const handleAddComment = async () => {
    if (!activeCommentPostId) return;
    const result = await UserStore.addNewsComment(activeCommentPostId, commentText);
    if (!result?.ok) { showToast(result?.message || 'Unable to add comment.', 'error'); return; }
    setCommentText('');
    await loadCommentsForPost(activeCommentPostId);
  };

  const handleLikeComment = async (commentId) => {
    if (!activeCommentPostId) return;
    const result = await UserStore.likeNewsComment(activeCommentPostId, commentId);
    if (!result?.ok) { showToast(result?.message || 'Unable to update comment.', 'error'); return; }
    await loadCommentsForPost(activeCommentPostId);
  };

  const handleReplyComment = (commentId) => { setReplyingToCommentId(commentId); setReplyText(''); setEditingCommentId(null); setEditingCommentText(''); };
  const handleCancelReply = () => { setReplyingToCommentId(null); setReplyText(''); };

  const handleSubmitReply = async () => {
    if (!activeCommentPostId || !replyingToCommentId) return;
    const result = await UserStore.replyNewsComment(activeCommentPostId, replyingToCommentId, replyText);
    if (!result?.ok) { showToast(result?.message || 'Unable to add reply.', 'error'); return; }
    handleCancelReply();
    await loadCommentsForPost(activeCommentPostId);
  };

  const handleStartEdit = (comment) => { setEditingCommentId(comment?.id || null); setEditingCommentText(comment?.text || ''); };
  const handleCancelEdit = () => { setEditingCommentId(null); setEditingCommentText(''); };

  const handleSaveEdit = async () => {
    if (!activeCommentPostId || !editingCommentId) return;
    const result = await UserStore.editNewsComment(activeCommentPostId, editingCommentId, editingCommentText);
    if (!result?.ok) { showToast(result?.message || 'Unable to edit comment.', 'error'); return; }
    handleCancelEdit();
    await loadCommentsForPost(activeCommentPostId);
  };

  const handleDeleteComment = async (commentId) => {
    if (!activeCommentPostId) return;
    const result = await UserStore.deleteNewsComment(activeCommentPostId, commentId);
    if (!result?.ok) { showToast(result?.message || 'Unable to delete comment.', 'error'); return; }
    if (editingCommentId === commentId) handleCancelEdit();
    await loadCommentsForPost(activeCommentPostId);
  };

  const openImageModal = (imageUri, personName) => { setModalImage(imageUri || ''); setModalName(personName || ''); setModalVisible(true); };

  const openAuthorProfile = (p) => {
    const authorEmail = String(p?.createdBy || p?.author_email || '').trim().toLowerCase();
    const authorName = String(p?.author_name || p?.createdByName || p?.author || '').trim();
    if (authorEmail && authorEmail === resolvedEmail) return;
    if (!authorEmail && authorName && authorName.toLowerCase() === name.toLowerCase()) return;
    // ✅ FIX: author_id bhi pass karo, warna target screen sirf local cache se
    // profile dhundhti hai aur profile.id kabhi milta nahi — isliye Block
    // jaisi actions (jinko real user id chahiye) API tak pahunchti hi nahi thi.
    navigation.push('UserPublicProfile', {
      email: authorEmail || undefined,
      userId: p?.author_id || undefined,
      author: {
        name: authorName || name,
        profile_image: p?.author_profile_image || p?.authorAvatar || safePhotoUri,
        role: p?.author_role || p?.createdByRole || roleId,
        role_label: p?.author_role_label || roleLabel,
        state: p?.state || state, district: p?.district || district, taluka: p?.taluka || taluka,
        author_seat_name: p?.author_seat_name || seatName,
        author_seat_id: p?.author_seat_id || seatId,
      },
    });
  };

  // Public https link (WhatsApp / Facebook me clickable). userId ho to wahi, warna email.
  const shareUserId = String(userId || profile?.id || display?.id || '').trim();
  const profileShareUrl = `${PROFILE_SHARE_BASE}${PROFILE_SHARE_PATH}?${shareUserId ? `userId=${encodeURIComponent(shareUserId)}` : `email=${encodeURIComponent(resolvedEmail || '')}`}`;
  const profileShareMessage = `${name} on RTI News\n${profileShareUrl}`;

  const handleCopyProfileLink = () => {
    setMenuVisible(false);
    Clipboard.setString(profileShareUrl);
    showToast('Profile link copied!', 'success');
  };

  const openShareSheet = () => setShareVisible(true);

  // "More": phone ka system share sheet (native) / browser ka share (web), na ho to link copy
  const handleShareMore = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title: `${name} - RTI News`, text: `${name} on RTI News`, url: profileShareUrl });
        } else {
          Clipboard.setString(profileShareUrl);
          showToast('Profile link copied!', 'success');
        }
        return;
      }
      await Share.share({ title: `${name} - RTI News`, message: profileShareMessage, url: profileShareUrl });
    } catch { /* user ne cancel kiya */ }
  };
  const handleShareProfile = openShareSheet;

  const handleCopyReferralCode = () => {
    if (!referralCode) return;
    Clipboard.setString(referralCode);
    showToast('Referral code copied!', 'success');
  };

  const handleReport = () => {
    setMenuVisible(false);
    Alert.alert('Report User', `Are you sure you want to report "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: async () => { try { await UserStore.reportUser?.(resolvedEmail); } catch {} showToast('User reported. We will review shortly.', 'success'); } },
    ]);
  };

   const handleBlock = () => {
    setMenuVisible(false);
    setBlockConfirmVisible(true);
  };

  const confirmBlock = async () => {
    setBlockConfirmVisible(false);
    const targetId = profile?.id ?? userId ?? null;
    console.log('[handleBlock] calling blockUser with', { resolvedEmail, targetId });
    try {
      const result = await UserStore.blockUser?.(resolvedEmail, targetId);
      console.log('[handleBlock] blockUser result:', result);
      if (result?.ok) {
        showToast(`"${name}" has been blocked.`, 'success');
        navigation.navigate('BlockedUsersScreen');
      } else {
        showToast(result?.message || 'Unable to block user. Please try again.', 'error');
      }
    } catch (err) {
      console.error('[handleBlock] blockUser threw:', err);
      showToast('Something went wrong while blocking.', 'error');
    }
  };
    const handleFollow = async () => {
    if (followLoading || followActionInFlightRef.current) return;
    followActionInFlightRef.current = true;
    if (resolvedEmail && resolvedEmail === viewerEmail) {
      followActionInFlightRef.current = false;
      showToast("You can't follow yourself.", 'error');
      return;
    }
    setFollowLoading(true);
    selfFollowActionRef.current = true;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowStats((prev) => ({
      ...prev,
      followers: Math.max(0, Number(prev.followers || 0) + (nextFollowing ? 1 : -1)),
    }));
    try {
      let result;
      if (nextFollowing) {
            result = await (UserStore.followUser
          ? UserStore.followUser(resolvedEmail, profile?.id ?? userId)
          : UserStore.updateNewsFeedItem?.(resolvedEmail, 'follow'));
      } else {
        result = await (UserStore.unfollowUser
          ? UserStore.unfollowUser(resolvedEmail, profile?.id ?? userId)
          : UserStore.updateNewsFeedItem?.(resolvedEmail, 'unfollow'));
      }
      if (result && result.ok === false) {
        setIsFollowing(!nextFollowing);
        setFollowStats((prev) => ({ ...prev, followers: Math.max(0, Number(prev.followers || 0) + (nextFollowing ? -1 : 1)) }));
        showToast(result?.message || 'Unable to update follow status.', 'error');
      } else {
        // NOTE: follow API ke response ka followers_count yahan use nahi karte — wo
        // stale/alag user ka aa sakta hai (isse count 1 se wapas 0 ho jata tha).
        showToast(nextFollowing ? `Following ${name}` : `Unfollowed ${name}`, 'success');
        // Followers list me apna naam turant add/remove (pehle list purani rehti thi)
        try {
          const me = await UserStore.getCurrentUser();
          const meId = me?.id ?? me?.user_id ?? null;
          const meEmail = String(me?.email || '').trim().toLowerCase();
          const meItem = { id: meId, email: meEmail, name: me?.name || 'User', profile_image: me?.profile_image || '' };
          const isMe = (u) => Boolean((meId != null && u?.id != null && String(u.id) === String(meId)) || (meEmail && String(u?.email || '').toLowerCase() === meEmail));
          setFollowLists((prev) => {
            const rest = (prev.followers || []).filter((u) => !isMe(u));
            return { ...prev, followers: nextFollowing ? [meItem, ...rest] : rest };
          });
        } catch { /* ignore */ }
      }
    } catch (err) {
      setIsFollowing(!nextFollowing);
      setFollowStats((prev) => ({
        ...prev,
        followers: Math.max(0, Number(prev.followers || 0) + (nextFollowing ? -1 : 1)),
      }));
    showToast('Something went wrong. Please try again.', 'error');
   } finally {
      selfFollowActionRef.current = false;
      followActionInFlightRef.current = false;
      setFollowLoading(false);
    }
  };

  // ── Comment item renderer ────────────────────────────────────────────────────

  const renderCommentItem = (c, isReply = false) => {
    const ownerMatch = (c.author_email && viewerEmail && String(c.author_email).trim().toLowerCase() === viewerEmail) || (!c.author_email && (c.author === viewerEmail));
    const liked = viewerEmail && Array.isArray(c.liked_by) && c.liked_by.includes(viewerEmail);
    return (
      <View key={c.id} style={isReply ? styles.commentReplyItem : styles.commentItem}>
        <View style={styles.commentTopRow}>
          <Text style={styles.commentAuthor}>{c.author || 'User'}</Text>
          <Text style={styles.commentDate}>{c.date || ''}{c.edited_at ? ' • Edited' : ''}</Text>
        </View>
        {editingCommentId === c.id ? (
          <TextInput style={styles.commentEditInput} value={editingCommentText} onChangeText={setEditingCommentText} multiline />
        ) : (
          <Text style={styles.commentText}>{c.text}</Text>
        )}
        <View style={styles.commentActionRow}>
          <TouchableOpacity style={[styles.commentActionBtn, liked && styles.commentActionBtnActive]} onPress={() => handleLikeComment(c.id)}>
            <Feather name="heart" size={13} color={liked ? '#ef4444' : '#e11d48'} />
            <Text style={[styles.commentActionText, liked && styles.commentActionTextActive]}>{liked ? 'Liked' : 'Like'}{c.likes ? ` (${c.likes})` : ''}</Text>
          </TouchableOpacity>
          {!isReply && (
            <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleReplyComment(c.id)}>
              <Feather name="message-circle" size={13} color="#64748b" />
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
          )}
          {ownerMatch ? (
            editingCommentId === c.id ? (
              <>
                <TouchableOpacity style={styles.commentMiniBtn} onPress={handleSaveEdit}><Feather name="check" size={13} color="#16a34a" /><Text style={[styles.commentMiniBtnText, { color: '#16a34a' }]}>Save</Text></TouchableOpacity>
                <TouchableOpacity style={styles.commentMiniBtn} onPress={handleCancelEdit}><Feather name="x" size={13} color="#64748b" /><Text style={styles.commentMiniBtnText}>Cancel</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.commentMiniBtn} onPress={() => handleStartEdit(c)}><Feather name="edit-2" size={13} color={ORANGE} /><Text style={styles.commentMiniBtnText}>Edit</Text></TouchableOpacity>
                <TouchableOpacity style={styles.commentMiniBtn} onPress={() => handleDeleteComment(c.id)}><Feather name="trash-2" size={13} color="#ef4444" /><Text style={[styles.commentMiniBtnText, { color: '#ef4444' }]}>Delete</Text></TouchableOpacity>
              </>
            )
          ) : null}
        </View>
        {replyingToCommentId === c.id && (
          <View style={styles.commentReplyForm}>
            <TextInput style={styles.commentReplyInput} placeholder="Write a reply..." placeholderTextColor="#94a3b8" value={replyText} onChangeText={setReplyText} multiline />
            <View style={styles.commentReplyActions}>
              <TouchableOpacity style={styles.commentReplyBtn} onPress={handleSubmitReply} disabled={!replyText.trim()}><Text style={styles.commentReplyBtnText}>Reply</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.commentReplyBtn, styles.commentCancelBtn]} onPress={handleCancelReply}><Text style={styles.commentCancelBtnText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        )}
        {!isReply && Array.isArray(c.replies) && c.replies.length > 0 && (
          <View style={styles.commentReplies}>
            {c.replies.map((reply) => renderCommentItem(reply, true))}
          </View>
        )}
      </View>
    );
  };

  // ── Post grid thumb (native mobile) ─────────────────────────────────────────

  const renderGridThumb = (p) => {
    const imageCandidates = [
      ...(Array.isArray(p.images) ? p.images : []),
      p.image, p.thumbnail, p.thumb, p.cover_image, p.coverImage,
      p.featured_image, p.featuredImage, p.photo,
    ]
      .map((u) => String(u || '').trim())
      .filter((u) => u && u !== 'null' && u !== 'undefined' && u.startsWith('http'));

    const thumb = imageCandidates.length ? imageCandidates[0] : null;
    const titleSnippet = String(p.title || '').trim().slice(0, 60);

    return (
      <TouchableOpacity
        key={p.id || p.title}
        style={styles.postThumb}
        onPress={() => openPost(p)}
        activeOpacity={0.85}
      >
        {thumb ? (
          <PostCardImage rawUri={thumb} style={styles.postThumbImage} resizeMode="cover" />
        ) : (
          <View style={[styles.postThumbImage, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', padding: 6 }]}>
            <Feather name="file-text" size={20} color="#cbd5e1" />
            {titleSnippet ? (
              <Text numberOfLines={3} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4, lineHeight: 12 }}>
                {titleSnippet}
              </Text>
            ) : null}
          </View>
        )}
        <View style={styles.postThumbOverlay}>
          <Feather name="eye" size={10} color="#ffffff" />
          <Text style={styles.postThumbOverlayText}>{Number(p.views || 0)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Feed card (list view) ────────────────────────────────────────────────────

  const renderFeedCard = (p) => {
    const postTitle = p.title || 'Untitled';
    const postDescription = stripHtml(p.description || p.body || p.content || p.summary || p.caption || p.excerpt || '');
    const postLocation = [p.taluka, p.district, p.state].filter(Boolean).join(', ');
    const postVideo = String(p.video || '').trim();
    // Every post on this page belongs to this profile owner. Use the same
    // live Premium Plan entitlement as the profile header.
    const postIsVerified = isVerified;

    const imageCandidates = [
      ...(Array.isArray(p.images) ? p.images : []),
      p.image, p.thumbnail, p.thumb, p.cover_image, p.coverImage,
      p.featured_image, p.featuredImage, p.photo,
    ]
      .map((u) => String(u || '').trim())
      .filter((u) => u && u !== 'null' && u !== 'undefined');

    const postImages = Array.from(new Set(imageCandidates));
    const postThumb = postImages.length ? postImages[0] : null;
    const showPending = p.status && String(p.status).toLowerCase() !== 'approved';
    const postAuthorPhoto = String(p?.author_profile_image || p?.authorAvatar || safePhotoUri || '').trim();
    const postAuthorName = String(p?.author_name || p?.createdByName || p?.author || name).trim();
    const liked = Boolean(viewerEmail && Array.isArray(p.liked_by) && p.liked_by.includes(viewerEmail));

    return (
      <View key={p.id || `${postTitle}-${p.date}`} style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <TouchableOpacity onPress={() => openImageModal(postAuthorPhoto, postAuthorName)} activeOpacity={0.8}>
            <ProfileAvatar uri={postAuthorPhoto} size={34} style={styles.feedAvatar} />
          </TouchableOpacity>
          <View style={styles.feedHeaderMain}>
            <View style={styles.feedNameRow}>
              {rolePillText ? <View style={styles.feedRoleMiniPill}><Text style={styles.feedRoleMiniText}>{rolePillText}</Text></View> : null}
              <TouchableOpacity onPress={() => openAuthorProfile(p)} activeOpacity={0.8}>
                <Text style={styles.feedName} numberOfLines={1}>{postAuthorName}</Text>
              </TouchableOpacity>
              {postIsVerified ? <VerifiedBadge size={18} iconSize={10} style={styles.feedVerifiedBadge} /> : null}
            </View>
            <View style={styles.feedMetaRow}>
              <Text style={styles.feedMetaText} numberOfLines={1}>{p.date || ''}</Text>
              {postLocation ? <><Text style={styles.feedMetaDot}>•</Text><Text style={styles.feedMetaText} numberOfLines={1}>{postLocation}</Text></> : null}
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => openPost(p)} activeOpacity={0.85}>
          <Text style={styles.feedTitle} numberOfLines={3}>{stripHtml(postTitle)}</Text>
        </TouchableOpacity>
        {postDescription ? <ExpandableDescription text={postDescription} /> : null}
        {postVideo ? <View style={styles.feedVideoBox}><VideoPreview uri={postVideo} style={styles.feedVideo} contentFit="cover" /></View> : null}
        {postThumb ? (
          <TouchableOpacity onPress={() => openPost(p)} activeOpacity={0.9}>
            <PostCardImage rawUri={postThumb} style={styles.feedImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}
        {postImages.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feedGalleryScroll}>
            <View style={styles.feedGalleryRow}>
              {postImages.slice(1).map((uri, index) => (
                <PostCardImage key={`${uri}-${index}`} rawUri={uri} style={styles.feedGalleryThumb} resizeMode="cover" />
              ))}
            </View>
          </ScrollView>
        ) : null}
        {showPending ? <View style={styles.feedStatusPill}><Text style={styles.feedStatusText}>{String(p.status).toUpperCase()}</Text></View> : null}
        <View style={styles.feedActions}>
          <TouchableOpacity style={[styles.feedActionButton, liked && styles.feedActionButtonActive]} onPress={() => handleLikePost(p)} activeOpacity={0.8}>
            <Feather name="heart" size={16} color={liked ? '#ef4444' : '#0f172a'} />
            <Text style={styles.feedActionText}>{Number(p.likes || 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton} onPress={() => openCommentsForPost(p)} activeOpacity={0.8}>
            <Feather name="message-circle" size={16} color="#0f172a" />
            <Text style={styles.feedActionText}>{Number(p.comments || 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.feedActionButton} onPress={() => handleSharePost(p)} activeOpacity={0.8}>
            <Feather name="share-2" size={16} color="#0f172a" />
            <Text style={styles.feedActionText}>{Number(p.shares || 0)}</Text>
          </TouchableOpacity>
          <View style={[styles.feedActionItem, { marginLeft: 'auto' }]}>
            <Feather name="eye" size={16} color="#0f172a" />
            <Text style={styles.feedActionText}>{Number(p.views || 0)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Render flags ────────────────────────────────────────────────────────────

  const isWeb = Platform.OS === 'web';
  // TRUE on web when screen is narrow (mobile browser / PWA on phone)
  const isMobileWeb = isWeb && windowWidth < 768;

  // ── Desktop web styles ──────────────────────────────────────────────────────
  const WEB_COL_WIDTH = 935;
  const WEB_THUMB = Math.floor((WEB_COL_WIDTH - 40 - 6) / 3);

  const webSt = {
    root: { flex: 1, backgroundColor: '#fafafa' },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 24, paddingVertical: 14,
      backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#dbdbdb',
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
    topBarTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    menuBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1 },
    scrollContent: { alignItems: 'center', paddingBottom: 60 },
    col: { width: WEB_COL_WIDTH, maxWidth: '100%', paddingHorizontal: 20 },
    profileRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 24, gap: 80 },
    avatarWrap: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: ORANGE, flexShrink: 0 },
    avatar: { width: '100%', height: '100%', borderRadius: 78 },
    profileInfo: { flex: 1, paddingTop: 8 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
    name: { fontSize: 26, fontWeight: '300', color: '#0f172a', letterSpacing: -0.3 },
    followBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0095f6' },
    followBtnActive: { backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' },
    followBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
    followBtnTextActive: { color: '#475569' },
    shareBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbdbdb' },
    shareBtnText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    moreBtn: { padding: 4 },
    statsRow: { flexDirection: 'row', gap: 40, marginBottom: 18 },
    statItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    statNum: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    statLabel: { fontSize: 16, color: '#0f172a' },
    bioSection: { gap: 4 },
    bioRole: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    bioSeat: { fontSize: 14, color: '#0f172a' },
    bioText: { fontSize: 14, color: '#0f172a', lineHeight: 20 },
    bioLocation: { fontSize: 14, color: '#737373' },
    divider: { height: 1, backgroundColor: '#dbdbdb', marginBottom: 0 },
    tabsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 60, position: 'relative', marginBottom: 8 },
    tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: 'transparent' },
    tabBtnActive: { borderTopColor: '#0f172a' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#737373', letterSpacing: 1 },
    tabTextActive: { color: '#0f172a' },
    gridToggle: { position: 'absolute', right: 0, top: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 0 },
    gridThumb: { width: WEB_THUMB, height: WEB_THUMB, overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative' },
    gridThumbImg: { width: '100%', height: '100%' },
    gridOverlay: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
    gridOverlayText: { fontSize: 11, color: '#ffffff', fontWeight: '600' },
    emptyCard: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 14, color: '#737373', fontWeight: '500' },
  };

  // ── Shared Modals ─────────────────────────────────────────────────────────
  const sharedModals = (
    <>
      <ProfileImageModal visible={modalVisible} imageUri={modalImage} name={modalName} onClose={() => setModalVisible(false)} />
      <ShareProfileSheet visible={shareVisible} onClose={() => setShareVisible(false)} name={name} url={profileShareUrl} message={profileShareMessage} onCopy={handleCopyProfileLink} onMore={handleShareMore} />
      <ProfileMenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} onCopyLink={handleCopyProfileLink} onReport={handleReport} onBlock={handleBlock} />
      <BlockConfirmModal visible={blockConfirmVisible} name={name} onCancel={() => setBlockConfirmVisible(false)} onConfirm={confirmBlock} />
      <Modal visible={Boolean(followModalType)} transparent animationType="slide" onRequestClose={() => setFollowModalType('')}>
        <TouchableOpacity style={styles.followModalOverlay} activeOpacity={1} onPress={() => setFollowModalType('')}>
          <TouchableWithoutFeedback>
            <View style={styles.followModalCard}>
              <View style={styles.followModalHeader}>
                <Text style={styles.followModalTitle}>{followModalType === 'followers' ? 'Followers' : 'Following'}</Text>
                <TouchableOpacity style={styles.followModalClose} onPress={() => setFollowModalType('')} activeOpacity={0.75}>
                  <Feather name="x" size={18} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.followModalList} contentContainerStyle={styles.followModalListContent}>
                {(followLists[followModalType] || []).length ? (
                  (followLists[followModalType] || []).map((item) => (
                                        <TouchableOpacity key={String(item.id ?? item.user_id ?? item.email)} style={styles.followUserRow} activeOpacity={0.8} onPress={() => { setFollowModalType(''); navigation.push('UserPublicProfile', { email: item.email, userId: item.id || item.user_id || undefined, author: item }); }}>
                      <ProfileAvatar uri={item.profile_image || ''} size={42} style={styles.followUserAvatar} />
                      <View style={styles.followUserInfo}>
                        <NameWithTick name={item.name || 'User'} user={item} style={styles.followUserName} />
                        <Text style={styles.followUserEmail} numberOfLines={1}>{item.email || ''}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.followEmptyText}>{followModalType === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</Text>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
      <Modal visible={commentModalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setCommentModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }} activeOpacity={1} onPress={() => setCommentModalVisible(false)} />
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', paddingBottom: Platform.OS === 'android' ? 12 : 0 }}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}><Feather name="x" size={20} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.commentList} contentContainerStyle={styles.commentListContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {activeComments?.length ? activeComments.map((c) => renderCommentItem(c)) : <Text style={styles.commentEmptyText}>No comments yet.</Text>}
            </ScrollView>
            <View style={[styles.commentInputRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: '#ffffff' }]}>
              <TextInput style={styles.commentInput} placeholder="Write a comment..." placeholderTextColor="#94a3b8" value={commentText} onChangeText={setCommentText} multiline />
              <TouchableOpacity style={[styles.commentSendBtn, !commentText.trim() && { opacity: 0.6 }]} onPress={handleAddComment} disabled={!commentText.trim()}>
                <Feather name="send" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );

  // ══════════════════════════════════════════════════════════════════
  // MOBILE WEB LAYOUT — web par narrow screen (< 768px)
  // Native mobile jaisa layout, windowWidth se dynamic thumb size
  // ══════════════════════════════════════════════════════════════════
  if (isMobileWeb) {
    const MOB_THUMB = Math.floor((windowWidth - 2) / 3);

    return (
      <View style={[styles.root, { backgroundColor: '#fafafa' }]}>
        {sharedModals}

        {/* Top Bar */}
        <ImageBackground source={profileTier.bgImage} resizeMode="cover" imageStyle={RED_HEADER_IMG} style={[styles.topBar, { backgroundColor: profileTier.gradientDark?.[1] || profileTier.accent, borderBottomColor: profileTier.gradientDark?.[2] || profileTier.accent, overflow: 'hidden' }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: '#FFFFFF' }]} numberOfLines={1}>{name}</Text>
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]} onPress={() => setMenuVisible(true)} activeOpacity={0.8}>
            <Feather name="more-vertical" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </ImageBackground>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Profile Header ── */}
          <View style={styles.profileSection}>
            <View style={styles.profileTopRow}>
              {/* LEFT: Avatar */}
              <TouchableOpacity
                style={[styles.avatarWrap, { borderColor: pillTheme.border }]}
                
                onPress={() => openImageModal(profileTier.key === 'common' ? '' : (resolvedProfilePhoto || safePhotoUri), name)}
                activeOpacity={0.85}
              >
               <ProfileAvatar uri={resolvedProfilePhoto || safePhotoUri} size={82} style={styles.avatar} forceDefault={profileTier.key === 'common'} />
              </TouchableOpacity>

              {/* RIGHT: name + stats */}
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={2}>{name}</Text>
                  {isVerified ? <VerifiedBadge size={22} iconSize={12} /> : null}
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{postsCount}</Text>
                    <Text style={styles.statLabel}>posts</Text>
                  </View>
                  <TouchableOpacity style={styles.statBox} onPress={() => setFollowModalType('followers')} activeOpacity={0.75}>
                    <Text style={styles.statValue}>
                      {followersCount > 999 ? `${(followersCount / 1000).toFixed(1)}k` : String(followersCount)}
                    </Text>
                    <Text style={styles.statLabel}>followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statBox} onPress={() => setFollowModalType('following')} activeOpacity={0.75}>
                    <Text style={styles.statValue}>{String(followingCount)}</Text>
                    <Text style={styles.statLabel}>following</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bio + Pills + Location */}
            {shownLocationLine ? (
              <View style={styles.locationLine}>
                <Feather name="map-pin" size={13} color={ORANGE} />
                <Text style={styles.locationLineText} numberOfLines={2}>{shownLocationLine}</Text>
              </View>
            ) : null}
            {accountAge ? (
              <View style={styles.locationLine}>
                <Feather name="calendar" size={13} color="#94a3b8" />
                <Text style={[styles.locationLineText, { color: '#94a3b8' }]}>Member {accountAge}</Text>
              </View>
            ) : null}
                    {subscriptionPillLabel ? (
              <View style={[styles.rolePill, { backgroundColor: pillTheme.bg, borderColor: pillTheme.border }]}>
                <Feather name="star" size={12} color={pillTheme.text} />
                <Text style={[styles.rolePillText, { color: pillTheme.text }]} numberOfLines={1}>{subscriptionPillLabel}</Text>
              </View>
            ) : null}
            {(seatName || seatId) && (seatName || seatId) !== shownPillText ? (
              <View style={[styles.seatPill, { backgroundColor: pillTheme.bg, borderColor: pillTheme.border }]}>
                <Feather name="award" size={12} color={pillTheme.text} />
                <Text style={[styles.seatPillText, { color: pillTheme.text }]} numberOfLines={1}>{seatName || seatId}</Text>
              </View>
            ) : null}
            {shownBio ? <Text style={[styles.bioInline, { marginTop: 6 }]} numberOfLines={4}>{shownBio}</Text> : null}
            {referralCode ? (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
    <Feather name="gift" size={12} color={REFERRAL_RED} />
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#111111' }}>Referral Code: <Text style={{ color: REFERRAL_RED }}>{referralCode}</Text></Text>
  </View>
) : null}
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionRow}>
                      <TouchableOpacity
              style={[
                styles.subscribeBtn,
                !isFollowing && { backgroundColor: pillTheme.border },
                isFollowing && { backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' },
                followLoading && { opacity: 0.7 },
              ]}
              onPress={handleFollow}
              activeOpacity={0.85}
              disabled={followLoading}
            >
              <Feather name={isFollowing ? 'user-check' : 'user-plus'} size={16} color={isFollowing ? '#475569' : '#ffffff'} />
              <Text style={[styles.subscribeBtnText, isFollowing && { color: '#475569' }]}>
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={openShareSheet} activeOpacity={0.85}>
                           <Feather name="share-2" size={16} color={pillTheme.border} />
              <Text style={styles.shareBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </View>

          {renderContactCard()}

          {/* ── Tabs ── */}
          <View style={styles.tabsRow}>
            <View style={styles.tabsLeft}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'posts' && styles.tabBtnActive]}
                onPress={() => setActiveTab('posts')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'activity' && styles.tabBtnActive]}
                onPress={() => setActiveTab('activity')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Activity</Text>
              </TouchableOpacity>
              {showDocuments ? (
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]}
                  onPress={() => setActiveTab('documents')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>ID & Letter</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {activeTab === 'posts' && sortedPosts.length > 0 ? (
              <View style={styles.gridToggleIcons}>
                <TouchableOpacity onPress={() => setGridView(true)} activeOpacity={0.8}>
                  <Feather name="grid" size={18} color={gridView ? ORANGE : '#94a3b8'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGridView(false)} activeOpacity={0.8}>
                  <Feather name="list" size={18} color={!gridView ? ORANGE : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* ── Tab Content ── */}
          {effectiveTab === 'documents' ? (
            renderDocumentsTab(true)
          ) : activeTab === 'activity' ? (
            <View style={styles.activityCard}>
              <Text style={styles.mutedText}>No activity yet.</Text>
            </View>
          ) : sortedPosts.length ? (
            gridView ? (
              // 3-col grid — tiles sized from live windowWidth
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {sortedPosts.map((p) => {
                  const imgCandidates = [
                    ...(Array.isArray(p.images) ? p.images : []),
                    p.image, p.thumbnail, p.thumb, p.cover_image, p.coverImage,
                    p.featured_image, p.featuredImage, p.photo,
                  ].map((u) => String(u || '').trim()).filter((u) => u && u !== 'null' && u !== 'undefined');
                  const thumb = imgCandidates.length ? imgCandidates[0] : null;
                  const hasVideo = Boolean(String(p.video || p.videoUrl || p.video_url || '').trim());
                  const titleSnippet = String(p.title || '').trim().slice(0, 60);
                  return (
                    <TouchableOpacity
                      key={p.id || p.title}
                      style={{ width: MOB_THUMB, height: MOB_THUMB, overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative', margin: 0.5 }}
                      onPress={() => openPost(p)}
                      activeOpacity={0.88}
                    >
                      {thumb ? (
                        <PostCardImage rawUri={thumb} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : hasVideo ? (
                        <View style={{ flex: 1, backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="play" size={18} color="#ffffff" />
                          </View>
                          {titleSnippet ? <Text numberOfLines={2} style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4, paddingHorizontal: 4 }}>{titleSnippet}</Text> : null}
                        </View>
                      ) : (
                        <View style={{ flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="file-text" size={22} color="#cbd5e1" />
                          {titleSnippet ? <Text numberOfLines={3} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4, paddingHorizontal: 4 }}>{titleSnippet}</Text> : null}
                        </View>
                      )}
                      <View style={{ position: 'absolute', bottom: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Feather name="eye" size={10} color="#ffffff" />
                        <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '600' }}>{Number(p.views || 0)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={{ paddingTop: 10 }}>
                {sortedPosts.map((p) => renderFeedCard(p))}
              </View>
            )
          ) : (
            <View style={styles.activityCard}>
              <Text style={styles.mutedText}>No posts found.</Text>
            </View>
          )}

        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // DESKTOP WEB LAYOUT — Instagram-style (>= 768px)
  // ══════════════════════════════════════════════════════════════════
  if (isWeb) {
    return (
      <View style={webSt.root}>
        {sharedModals}

        {/* ── Top Bar ── */}
                  <ImageBackground source={profileTier.bgImage} resizeMode="cover" imageStyle={RED_HEADER_IMG} style={[webSt.topBar, { backgroundColor: profileTier.gradientDark?.[1] || profileTier.accent, borderBottomColor: profileTier.gradientDark?.[2] || profileTier.accent, overflow: 'hidden' }]}>
          <TouchableOpacity style={[webSt.backBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[webSt.topBarTitle, { color: '#FFFFFF' }]}>Profile</Text>
          <TouchableOpacity style={[webSt.menuBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]} onPress={() => setMenuVisible(true)} activeOpacity={0.8}>
            <Feather name="more-vertical" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </ImageBackground>

        <ScrollView style={webSt.scroll} contentContainerStyle={webSt.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={webSt.col}>

            {/* ── Profile Header Row ── */}
            <View style={webSt.profileRow}>
              {/* LEFT: Avatar */}
              <TouchableOpacity
                                style={[webSt.avatarWrap, { borderColor: pillTheme.border }]}
                onPress={() => openImageModal(profileTier.key === 'common' ? '' : (resolvedProfilePhoto || safePhotoUri), name)}
                activeOpacity={0.85}
              >
               <ProfileAvatar uri={resolvedProfilePhoto || safePhotoUri} size={150} style={webSt.avatar} forceDefault={profileTier.key === 'common'} />
              </TouchableOpacity>

              {/* RIGHT: Info */}
              <View style={webSt.profileInfo}>
                {/* Row 1: name + verified + buttons */}
                <View style={webSt.nameRow}>
                  <Text style={webSt.name}>{name}</Text>
                  {isVerified ? <VerifiedBadge size={22} iconSize={13} /> : null}
                  <TouchableOpacity
                                     style={[webSt.followBtn, !isFollowing && { backgroundColor: pillTheme.border }, isFollowing && webSt.followBtnActive, followLoading && { opacity: 0.7 }]}
                    onPress={handleFollow}
                    activeOpacity={0.85}
                    disabled={followLoading}
                  >
                    <Text style={[webSt.followBtnText, isFollowing && webSt.followBtnTextActive]}>
                      {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webSt.shareBtn} onPress={openShareSheet} activeOpacity={0.85}>
                    <Text style={webSt.shareBtnText}>Share Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webSt.moreBtn} onPress={() => setMenuVisible(true)} activeOpacity={0.8}>
                    <Feather name="more-horizontal" size={22} color="#0f172a" />
                  </TouchableOpacity>
                </View>

                {/* Row 2: posts · followers · following */}
                <View style={webSt.statsRow}>
                  <View style={webSt.statItem}>
                    <Text style={webSt.statNum}>{postsCount}</Text>
                    <Text style={webSt.statLabel}> posts</Text>
                  </View>
                  <TouchableOpacity style={webSt.statItem} onPress={() => setFollowModalType('followers')} activeOpacity={0.75}>
                    <Text style={webSt.statNum}>{followersCount > 999 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount}</Text>
                    <Text style={webSt.statLabel}> followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webSt.statItem} onPress={() => setFollowModalType('following')} activeOpacity={0.75}>
                    <Text style={webSt.statNum}>{followingCount}</Text>
                    <Text style={webSt.statLabel}> following</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 3: bio section */}
                <View style={webSt.bioSection}>
                  {shownPillText ? <Text style={webSt.bioRole}>{shownPillText}</Text> : null}
                  {(seatName || seatId) && (seatName || seatId) !== shownPillText
                    ? <Text style={webSt.bioSeat}>{seatName || seatId}</Text>
                    : null}
                                 {shownBio ? <Text style={webSt.bioText}>{shownBio}</Text> : null}
                  {shownLocationLine ? <Text style={webSt.bioLocation}>📍 {shownLocationLine}</Text> : null}
                  {accountAge ? <Text style={webSt.bioLocation}>🗓 Member {accountAge}</Text> : null}
                </View>
              </View>
            </View>

            {referralCode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
                <Feather name="gift" size={12} color={REFERRAL_RED} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#111111' }}>Referral Code: <Text style={{ color: REFERRAL_RED }}>{referralCode}</Text></Text>
              </View>
            ) : null}

            {renderContactCard({ marginHorizontal: 0, marginBottom: 16 })}

            {/* ── Divider ── */}
            <View style={webSt.divider} />

            {/* ── Tabs ── */}
            <View style={webSt.tabsRow}>
              <TouchableOpacity
                style={[webSt.tabBtn, activeTab === 'posts' && webSt.tabBtnActive]}
                onPress={() => setActiveTab('posts')}
                activeOpacity={0.85}
              >
                <Feather name="grid" size={12} color={activeTab === 'posts' ? '#0f172a' : '#737373'} />
                <Text style={[webSt.tabText, activeTab === 'posts' && webSt.tabTextActive]}>POSTS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[webSt.tabBtn, activeTab === 'activity' && webSt.tabBtnActive]}
                onPress={() => setActiveTab('activity')}
                activeOpacity={0.85}
              >
                <Feather name="activity" size={12} color={activeTab === 'activity' ? '#0f172a' : '#737373'} />
                <Text style={[webSt.tabText, activeTab === 'activity' && webSt.tabTextActive]}>ACTIVITY</Text>
              </TouchableOpacity>
              {showDocuments ? (
                <TouchableOpacity
                  style={[webSt.tabBtn, activeTab === 'documents' && webSt.tabBtnActive]}
                  onPress={() => setActiveTab('documents')}
                  activeOpacity={0.85}
                >
                  <Feather name="credit-card" size={12} color={activeTab === 'documents' ? '#0f172a' : '#737373'} />
                  <Text style={[webSt.tabText, activeTab === 'documents' && webSt.tabTextActive]}>ID & LETTER</Text>
                </TouchableOpacity>
              ) : null}

              {activeTab === 'posts' && sortedPosts.length > 0 ? (
                <View style={webSt.gridToggle}>
                  <TouchableOpacity onPress={() => setGridView(true)} activeOpacity={0.8}>
                    <Feather name="grid" size={18} color={gridView ? ORANGE : '#94a3b8'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setGridView(false)} activeOpacity={0.8}>
                    <Feather name="list" size={18} color={!gridView ? ORANGE : '#94a3b8'} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* ── Posts Grid / List / Empty ── */}
            {effectiveTab === 'documents' ? (
              renderDocumentsTab(false)
            ) : activeTab === 'activity' ? (
              <View style={webSt.emptyCard}>
                <Feather name="activity" size={36} color="#cbd5e1" style={{ marginBottom: 10 }} />
                <Text style={webSt.emptyText}>No activity yet.</Text>
              </View>
            ) : sortedPosts.length ? (
              gridView ? (
                <View style={webSt.grid}>
                  {sortedPosts.map((p) => {
                    const imageCandidates = [
                      ...(Array.isArray(p.images) ? p.images : []),
                      p.image, p.thumbnail, p.thumb, p.cover_image, p.coverImage,
                      p.featured_image, p.featuredImage, p.photo,
                    ].map((u) => String(u || '').trim()).filter((u) => u && u !== 'null' && u !== 'undefined');
                    const thumb = imageCandidates.length ? imageCandidates[0] : null;
                    const hasVideo = Boolean(String(p.video || p.videoUrl || p.video_url || '').trim());
                    const titleSnippet = String(p.title || '').trim().slice(0, 60);
                    return (
                      <TouchableOpacity
                        key={p.id || p.title}
                        style={webSt.gridThumb}
                        onPress={() => openPost(p)}
                        activeOpacity={0.88}
                      >
                        {thumb ? (
                          <PostCardImage rawUri={thumb} style={webSt.gridThumbImg} resizeMode="cover" />
                        ) : hasVideo ? (
                          <View style={[webSt.gridThumbImg, { backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center' }]}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                              <Feather name="play" size={22} color="#ffffff" />
                            </View>
                            {titleSnippet ? <Text numberOfLines={2} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8, paddingHorizontal: 8 }}>{titleSnippet}</Text> : null}
                          </View>
                        ) : (
                          <View style={[webSt.gridThumbImg, { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }]}>
                            <Feather name="file-text" size={28} color="#cbd5e1" />
                            {titleSnippet ? <Text numberOfLines={3} style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 6, paddingHorizontal: 8 }}>{titleSnippet}</Text> : null}
                          </View>
                        )}
                        <View style={webSt.gridOverlay}>
                          <Feather name="eye" size={13} color="#ffffff" />
                          <Text style={webSt.gridOverlayText}>{Number(p.views || 0)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingTop: 10, maxWidth: 600, alignSelf: 'center', width: '100%' }}>
                  {sortedPosts.map((p) => renderFeedCard(p))}
                </View>
              )
            ) : (
              <View style={webSt.emptyCard}>
                <Feather name="camera-off" size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <Text style={webSt.emptyText}>No posts yet.</Text>
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // NATIVE MOBILE LAYOUT (iOS / Android)
  // Design: apni profile (ProfileScreen) jaisa — tier ka cover image,
  // beech me avatar, white card me naam/stats/pill, aur Edit Profile ki
  // jagah Follow + Share. Cover ka color profile OWNER ke role/tier se aata hai.
  // ══════════════════════════════════════════════════════════════════
  const showShield = profileTier.key !== 'common';
  const followedBg = '#E5E7EB';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {sharedModals}

      <ScrollView style={ProfileStyles.scrollView} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── Cover (tier image) + back / menu ── */}
        <ImageBackground
                  source={profileTier.bgImage}
          resizeMode="cover"
          style={[ProfileStyles.greenHeader, { backgroundColor: profileTier.gradientDark?.[1] || profileTier.accent }]}
          imageStyle={ProfileStyles.greenHeaderImage}
        >
          <View style={[ProfileStyles.greenHeaderTop, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={() => setMenuVisible(true)} activeOpacity={0.8}>
              <Feather name="more-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* ── Profile card ── */}
        <View style={ProfileStyles.summaryCard}>
          <View style={ProfileStyles.profileCardAvatarWrap}>
            <TouchableOpacity
              style={ProfileStyles.profileCardAvatarRing}
              onPress={() => openImageModal(profileTier.key === 'common' ? '' : (resolvedProfilePhoto || safePhotoUri), name)}
              activeOpacity={0.85}
            >
              <ProfileAvatar uri={resolvedProfilePhoto || safePhotoUri} size={100} style={ProfileStyles.profileCardAvatar} forceDefault={profileTier.key === 'common'} />
            </TouchableOpacity>
            {showShield ? (
              <View style={ProfileStyles.roleShieldBadge} pointerEvents="none">
                <MaterialCommunityIcons name="shield" size={40} color={profileTier.accent} />
                <MaterialCommunityIcons name="crown" size={17} color="#FFD700" style={ProfileStyles.roleShieldCrown} />
              </View>
            ) : null}
          </View>

          <View style={ProfileStyles.profileCardBody}>
            <View style={ProfileStyles.profileCardNameRow}>
              <Text style={ProfileStyles.profileCardName} numberOfLines={2}>{name}</Text>
              {isVerified ? <VerifiedBadge size={20} /> : null}
            </View>
            {memberIdText ? (
              <Text style={ProfileStyles.profileCardUsername}>Member ID: {memberIdText}</Text>
            ) : null}
            {shownState || shownLocationLine ? (
              <View style={ProfileStyles.profileCardLocation}>
                <MaterialIcons name="location-on" size={11} color="#555555" />
                <Text style={ProfileStyles.profileCardLocationText}>{shownState ? `${shownState}, India` : shownLocationLine}</Text>
              </View>
            ) : null}
            {shownBio ? <Text style={ProfileStyles.profileCardBioText} numberOfLines={4}>{shownBio}</Text> : null}
          </View>

          <View style={ProfileStyles.profileStatsExact}>
            <View style={ProfileStyles.profileStatExact}>
              <Text style={ProfileStyles.profileStatNumberExact}>{postsCount}</Text>
              <Text style={ProfileStyles.profileStatLabelExact}>Posts</Text>
            </View>
            <TouchableOpacity style={ProfileStyles.profileStatExact} onPress={() => setFollowModalType('followers')} activeOpacity={0.75}>
              <Text style={ProfileStyles.profileStatNumberExact}>{followersCount > 999 ? `${(followersCount / 1000).toFixed(1)}k` : String(followersCount)}</Text>
              <Text style={ProfileStyles.profileStatLabelExact}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ProfileStyles.profileStatExact} onPress={() => setFollowModalType('following')} activeOpacity={0.75}>
              <Text style={ProfileStyles.profileStatNumberExact}>{String(followingCount)}</Text>
              <Text style={ProfileStyles.profileStatLabelExact}>Following</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={profileTier.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={ProfileStyles.premiumPillExact}
          >
            <Text style={ProfileStyles.premiumPillTextExact} numberOfLines={2}>{subscriptionPillLabel}</Text>
          </LinearGradient>

          {/* Edit Profile ki jagah Follow, add-person ki jagah Share */}
          <View style={ProfileStyles.profileActionsExact}>
            <TouchableOpacity
              style={[ProfileStyles.editProfileExact, followLoading && { opacity: 0.7 }]}
              onPress={handleFollow}
              activeOpacity={0.85}
              disabled={followLoading}
            >
              {isFollowing ? (
                <View style={[ProfileStyles.editProfileGradient, { flexDirection: 'row', gap: 6, backgroundColor: followedBg }]}>
                  <Feather name="user-check" size={15} color="#475569" />
                  <Text style={[ProfileStyles.editProfileExactText, { color: '#475569' }]}>{followLoading ? '...' : 'Following'}</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={profileTier.gradientDark}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[ProfileStyles.editProfileGradient, { flexDirection: 'row', gap: 6 }]}
                >
                  <Feather name="user-plus" size={15} color="#FFFFFF" />
                  <Text style={ProfileStyles.editProfileExactText}>{followLoading ? '...' : 'Follow'}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[ProfileStyles.addPersonExact, { height: 40, width: 44, borderColor: profileTier.accent }]}
              onPress={handleShareProfile}
              activeOpacity={0.85}
            >
              <Feather name="share-2" size={16} color={profileTier.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Referral code (sirf jab owner ne role/subscription liya ho) — code red, label black ── */}
        {referralCode ? (
          <View style={[ProfileStyles.metricRowCard, { marginTop: 12 }]}>
            <View style={[ProfileStyles.metricIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="gift" size={17} color={REFERRAL_RED} />
            </View>
            <View style={ProfileStyles.metricBody}>
              <Text style={[ProfileStyles.metricLabel, { color: '#111111' }]}>Referral Code</Text>
              <Text style={[ProfileStyles.metricValue, { color: REFERRAL_RED }]}>{referralCode}</Text>
            </View>
            <TouchableOpacity style={ProfileStyles.metricCopyBtn} onPress={handleCopyReferralCode} activeOpacity={0.8}>
              <Text style={ProfileStyles.metricCopyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        ) : null}


        {renderContactCard()}

        {/* ── Tabs: Posts (left) | Activity (right) ── */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 12 }}>
          {[{ key: 'posts', label: 'Posts' }, { key: 'activity', label: 'Activity' }, ...(showDocuments ? [{ key: 'documents', label: 'ID & Letter' }] : [])].map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: active ? profileTier.accent : 'transparent' }}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: active ? profileTier.accent : '#64748B' }}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'posts' && sortedPosts.length > 0 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 10 }}>
            <TouchableOpacity onPress={() => setGridView(true)} activeOpacity={0.8}>
              <Feather name="grid" size={18} color={gridView ? profileTier.accent : '#94a3b8'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGridView(false)} activeOpacity={0.8}>
              <Feather name="list" size={18} color={!gridView ? profileTier.accent : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Tab Content ── */}
        {effectiveTab === 'documents' ? (
          renderDocumentsTab(true)
        ) : activeTab === 'activity' ? (
          <View style={styles.activityCard}>
            <Text style={styles.mutedText}>No activity yet.</Text>
          </View>
        ) : sortedPosts.length ? (
          gridView ? (
            <View style={styles.postGrid}>
              {sortedPosts.map((p) => renderGridThumb(p))}
            </View>
          ) : (
            <View style={{ paddingTop: 4 }}>
              {sortedPosts.map((p) => renderFeedCard(p))}
            </View>
          )
        ) : (
          <View style={styles.activityCard}>
            <Text style={styles.mutedText}>No posts found.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}