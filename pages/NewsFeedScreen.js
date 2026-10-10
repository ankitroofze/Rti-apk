import NameWithTick from '../components/NameWithTick';
import React, { useCallback, useState, useEffect } from 'react';
import {
  Image, ImageBackground, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Share,
  StatusBar, Text, TextInput, TouchableOpacity, View, Alert, BackHandler, StyleSheet, useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import ProfileAvatar from '../components/ProfileAvatar';
import VideoPreview from '../components/VideoPreview';
import VerifiedBadge from '../components/VerifiedBadge';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { INDIAN_STATES } from './locationData';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';
import { useLanguage } from '../contexts/LanguageContext';
import { getAdRedirectMeta, openAdRedirect } from '../utils/adRedirect';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { getProfileTier } from '../utils/profileHelpers';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
import MediaGallery from '../components/MediaGallery';
import ModuleMobileHeader from '../components/ModuleMobileHeader';
// ── Design tokens — matched to the Advertise / Add News screens ────────────────
const C = {
  primary:      '#B91C1C',
  primaryDark:  '#7F1D1D',
  uploadBg:     '#FDF1F1',
  dashedBorder: '#DDDDDD',
  neutral400:   '#A3A3A3',
  textMain:     '#353535',
  textBody:     '#111111',
  textSub:      '#6B6B6B',
  textMuted:    '#8F8F8F',
  headerBorder: '#E6E6E6',
  border:       '#E5E5E5',
  white:        '#ffffff',
  bg:           '#F7F7F7',
  danger:       '#EF4444',
  green:        '#16a34a',
  greenLight:   '#f0fdf4',
  greenBorder:  '#bbf7d0',
};

const FONT = {
  regular: 'Roboto_400Regular',
  medium:  'Roboto_500Medium',
  bold:    'Roboto_700Bold',
  black:   'Roboto_900Black',
};

// ─── Filter constants ──────────────────────────────────────────────
const REPORT_TYPES = [
  'All', 'Breaking News', 'Investigation', 'Opinion',
  'Feature', 'Local News', 'National', 'International',
  'Sports', 'Business', 'Technology', 'Health', 'Politics',
];

const ROLE_TYPES = [
  'All', 'Subscriber', 'Premium', 'Reporter', 'Editor',
];


function itemMatchesLanguage(item, selectedLanguage) {
  const activeLanguage = String(selectedLanguage || '').trim().toLowerCase();
  if (!activeLanguage) return true;
  const itemLanguage = String(item?.language || item?.lang || item?.news_language || '').trim().toLowerCase();
  if (!itemLanguage) return true;
  return itemLanguage === activeLanguage;
}
function formatNewsDate(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function interleaveSponsoredCards(items = [], ads = []) {
  const sponsoredAds = Array.isArray(ads) ? ads : [];
  if (!sponsoredAds.length) return items.map((item) => ({ ...item, __type: 'news' }));
  if (!Array.isArray(items) || !items.length) return sponsoredAds.map((ad) => ({ ...ad, __type: 'ad' }));
  const mixed = [];
  let adIndex = 0;
  items.forEach((item, index) => {
    mixed.push({ ...item, __type: 'news' });
    if ((index + 1) % 3 === 0 && adIndex < sponsoredAds.length) {
      mixed.push({ ...sponsoredAds[adIndex], __type: 'ad' });
      adIndex += 1;
    }
  });
  return [...mixed, ...sponsoredAds.slice(adIndex).map((ad) => ({ ...ad, __type: 'ad' }))];
}

// ─── ResolvedImage ─────────────────────────────────────────────────
function ResolvedImage({ uri, style, resizeMode = 'cover' }) {
  const [resolvedUri, setResolvedUri] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!uri) return;
    if (Platform.OS === 'web' && isIdbMediaUri(uri)) {
      resolveIdbMediaUriToObjectUrl(uri).then((url) => {
        if (alive && url) setResolvedUri(url);
      }).catch(() => {});
    } else {
      setResolvedUri(uri);
    }
    return () => { alive = false; };
  }, [uri]);

  if (!resolvedUri) {
    return <View style={[style, styles.imagePlaceholder]} />;
  }
  return <Image source={{ uri: resolvedUri }} style={style} resizeMode={resizeMode} />;
}

function SponsoredAdCard({ ad, navigation }) {
  const location = [ad.district, ad.state].filter(Boolean).join(', ');

  useEffect(() => {
    if (ad?.id) {
      UserStore.recordAdImpression(ad.id);
    }
  }, [ad?.id]);

  const handlePress = () => {
    if (ad?.id) UserStore.recordAdImpression(ad.id);
    if (ad.url) {
      // ✅ FIX: backend field "url" hai, "redirect" nahi
      Linking.openURL(ad.url).catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.newsTopRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>Sponsored</Text>
        </View>
        <Text style={styles.newsDate}>{ad.updated_at || ad.created_at || ''}</Text>
      </View>

      <Text style={styles.newsTitle}>{ad.title || 'Sponsored Advertisement'}</Text>
      {ad.description ? <Text style={styles.newsDescription}>{ad.description}</Text> : null}

      {location ? (
        <View style={styles.locationTagRow}>
          <View style={styles.locationTag}>
            <Feather name="map-pin" size={10} color={C.primary} />
            <Text style={styles.locationTagText}>{location}</Text>
          </View>
        </View>
      ) : null}

      {ad.image ? (
        // ✅ FIX: backend field "image" hai, "photo" nahi
        <View style={styles.mediaPreviewWrap}>
          <ResolvedImage uri={ad.image} style={{ width: '100%', height: 220, borderRadius: 12 }} resizeMode="cover" />
        </View>
      ) : null}

      {ad.url ? (
        <TouchableOpacity style={styles.actionIconButton} onPress={handlePress}>
          <Feather name="external-link" size={15} color={C.primary} />
          <Text style={styles.actionIconText}>Visit</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── FilterChip ────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
    {active ? (
      <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterChip}>
        <Text style={styles.filterChipTextActive}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.filterChip}>
        <Text style={styles.filterChipText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);
// ─── FilterDropdown ────────────────────────────────────────────────
const FilterDropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  const isActive = value && value !== 'All';
  const content = (
    <>
      <Text
        style={[styles.dropdownBtnText, isActive && styles.dropdownBtnTextActive]}
        numberOfLines={1}
      >
        {value || label}
      </Text>
      <Feather
        name={open ? 'chevron-up' : 'chevron-down'}
        size={13}
        color={isActive ? C.white : C.textSub}
      />
    </>
  );
  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity onPress={() => setOpen((p) => !p)} activeOpacity={0.8}>
        {isActive ? (
          <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dropdownBtn}>
            {content}
          </LinearGradient>
        ) : (
          <View style={styles.dropdownBtn}>{content}</View>
        )}
      </TouchableOpacity>
      {open ? (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, value === opt && styles.dropdownItemActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemTextActive]}>
                  {opt}
                </Text>
                {value === opt ? <Feather name="check" size={12} color={C.textSub} /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

function FeedCommentItem({
  comment,
  currentUser,
  editingCommentId,
  editingCommentText,
  onEditingCommentTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteComment,
  onLikeComment,
  replyingToCommentId,
  replyText,
  onReplyTextChange,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  expandedReplyThreads,
  onToggleReplies,
  isReply = false,
}) {
  const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
  const ownerMatch =
    (comment.author_email && currentEmail && String(comment.author_email).trim().toLowerCase() === currentEmail)
    || (!comment.author_email && (comment.author === currentEmail || comment.author === currentUser?.name));
  const liked = currentEmail && Array.isArray(comment.liked_by) && comment.liked_by.includes(currentEmail);
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToCommentId === comment.id;
  const replyCount = Array.isArray(comment.replies) ? comment.replies.length : 0;
  const hasReplies = replyCount > 0;
  const areRepliesExpanded = Boolean(expandedReplyThreads?.[comment.id]);

  return (
    <View style={[styles.commentItem, isReply && styles.commentReplyItem]}>
      <View style={styles.commentTopRow}>
        <NameWithTick name={comment.author || 'User'} show={Boolean(comment.author_has_blue_tick)} style={styles.commentAuthor} badgeSize={12} />
        <Text style={styles.commentDate}>{comment.date || ''}{comment.edited_at ? ' • Edited' : ''}</Text>
      </View>

      {isEditing ? (
        <TextInput style={styles.commentEditInput} value={editingCommentText} onChangeText={onEditingCommentTextChange} multiline />
      ) : (
        <Text style={styles.commentText}>{comment.text}</Text>
      )}

      <View style={styles.commentActionRow}>
        <TouchableOpacity style={[styles.commentActionBtn, liked && styles.commentActionBtnActive]} onPress={() => onLikeComment(comment.id)}>
          <Feather name="heart" size={12} color={liked ? C.white : C.primary} />
          <Text style={[styles.commentActionText, liked && styles.commentActionTextActive]}>{liked ? 'Liked' : 'Like'}{comment.likes ? ` (${comment.likes})` : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentMiniBtn} onPress={() => onStartReply(comment.id)}>
          <Feather name="corner-down-right" size={12} color={C.primary} />
          <Text style={styles.commentMiniBtnText}>Reply</Text>
        </TouchableOpacity>

        {ownerMatch ? (
          isEditing ? (
            <>
              <TouchableOpacity style={styles.commentMiniBtn} onPress={onSaveEdit}>
                <Feather name="check" size={12} color={C.primary} />
                <Text style={styles.commentMiniBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commentMiniBtn} onPress={onCancelEdit}>
                <Feather name="x" size={12} color={C.neutral400} />
                <Text style={styles.commentMiniBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.commentMiniBtn} onPress={() => onStartEdit(comment)}>
                <Feather name="edit-2" size={12} color={C.primary} />
                <Text style={styles.commentMiniBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commentMiniBtn} onPress={() => onDeleteComment(comment.id)}>
                <Feather name="trash-2" size={12} color={C.danger} />
                <Text style={styles.commentMiniBtnDeleteText}>Delete</Text>
              </TouchableOpacity>
            </>
          )
        ) : null}
      </View>

      {isReplying ? (
        <View style={styles.commentReplyForm}>
          <TextInput
            style={styles.commentReplyInput}
            placeholder="Write a reply..."
            placeholderTextColor={C.neutral400}
            value={replyText}
            onChangeText={onReplyTextChange}
            multiline
          />
          <View style={styles.commentReplyActions}>
            <TouchableOpacity style={styles.commentMiniBtn} onPress={onSubmitReply}>
              <Feather name="send" size={12} color={C.primary} />
              <Text style={styles.commentMiniBtnText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentMiniBtn} onPress={onCancelReply}>
              <Feather name="x" size={12} color={C.neutral400} />
              <Text style={styles.commentMiniBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {hasReplies ? (
        <View style={styles.commentRepliesWrap}>
          <TouchableOpacity style={styles.commentRepliesToggle} onPress={() => onToggleReplies(comment.id)}>
            <View style={styles.commentRepliesLine} />
            <Text style={styles.commentRepliesToggleText}>
              {areRepliesExpanded ? 'Hide replies' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </Text>
          </TouchableOpacity>

          {areRepliesExpanded ? (
            <View style={styles.commentRepliesList}>
              {comment.replies.map((reply) => (
                <FeedCommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  editingCommentId={editingCommentId}
                  editingCommentText={editingCommentText}
                  onEditingCommentTextChange={onEditingCommentTextChange}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  onDeleteComment={onDeleteComment}
                  onLikeComment={onLikeComment}
                  replyingToCommentId={replyingToCommentId}
                  replyText={replyText}
                  onReplyTextChange={onReplyTextChange}
                  onStartReply={onStartReply}
                  onCancelReply={onCancelReply}
                  onSubmitReply={onSubmitReply}
                  expandedReplyThreads={expandedReplyThreads}
                  onToggleReplies={onToggleReplies}
                  isReply={true}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── Edit News Modal ───────────────────────────────────────────────
const EditNewsModal = ({ visible, newsItem, onClose, onUpdate, showToast }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    state: '',
    district: '',
    taluka: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (newsItem) {
      setFormData({
        title: newsItem.title || '',
        subtitle: newsItem.subtitle || '',
        description: newsItem.description || '',
        category: newsItem.category || '',
        state: newsItem.state || '',
        district: newsItem.district || '',
        taluka: newsItem.taluka || '',
      });
    }
  }, [newsItem]);

  const handleUpdate = async () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setLoading(true);
    const result = await UserStore.updateNewsFeedItem(newsItem.id, formData);
    setLoading(false);
    if (result.ok) {
      showToast('News updated successfully', 'success');
      if (typeof onUpdate === 'function') {
        await onUpdate();
      }
      onClose();
    } else {
      showToast(result.message || 'Update failed', 'error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.commentOverlay}>
        <View style={styles.editModalSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Edit News</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={C.neutral400} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.editInput}
              placeholder="Title *"
              placeholderTextColor={C.neutral400}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={styles.editInputMultiline}
              placeholder="Description"
              placeholderTextColor={C.neutral400}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
            <TextInput
              style={styles.editInput}
              placeholder="Category"
              placeholderTextColor={C.neutral400}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />
            <TextInput
              style={styles.editInput}
              placeholder="State"
              placeholderTextColor={C.neutral400}
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
            />
            <TextInput
              style={styles.editInput}
              placeholder="District"
              placeholderTextColor={C.neutral400}
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
            />
            <TextInput
              style={styles.editInput}
              placeholder="Taluka"
              placeholderTextColor={C.neutral400}
              value={formData.taluka}
              onChangeText={(text) => setFormData({ ...formData, taluka: text })}
            />
            <TouchableOpacity
              style={[styles.addNewsButton, loading && styles.addNewsButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Feather name="check-circle" size={16} color={C.white} />
              <Text style={styles.addNewsButtonText}>{loading ? 'Updating...' : 'Update News'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────
export default function NewsFeedScreen({ navigation }) {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black,
  });

  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const { language } = useLanguage();
  const successMessage = '';
  const [loading, setLoading] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activeCommentItem, setActiveCommentItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [feedMediaWidth, setFeedMediaWidth] = useState(0);
  const [editingNewsItem, setEditingNewsItem] = useState(null);

  const [filterState, setFilterState] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterTaluka, setFilterTaluka] = useState('');
  const [filterReportType, setFilterReportType] = useState('All');
  const [filterRoleType, setFilterRoleType] = useState('All');
  const [searchText, setSearchText] = useState('');

  const [newsData, setNewsData] = useState({
    currentUser: null,
    items: [],
    totalViews: 0,
    totalShares: 0,
  });
  const [adFeedItems, setAdFeedItems] = useState([]);

  const moduleName = 'News Feed';
  const insets = useSafeAreaInsets();
  const stateOptions = ['All', ...INDIAN_STATES];

  const isLocationState = (value = '') => INDIAN_STATES.includes(value);

  const applyLocationFilter = (items = [], user = null) => {
    if (!user || !UserStore.hasPremiumAccess(user) || !user.location_complete || !user.state) return items;
    return items.filter((item) => {
      if (!isLocationState(item.state)) return true;
      if (item.state && item.state !== user.state) return false;
      if (item.district && user.district && item.district !== user.district) return false;
      if (item.taluka && user.taluka && item.taluka !== user.taluka) return false;
      return true;
    });
  };

  const applyUIFilters = (items = []) => {
    return items.filter((item) => {
      if (filterState && filterState !== 'All') {
        if (item.state !== filterState) return false;
      }
      if (filterDistrict.trim()) {
        const q = filterDistrict.trim().toLowerCase();
        if (!(item.district || '').toLowerCase().includes(q)) return false;
      }
      if (filterTaluka.trim()) {
        const q = filterTaluka.trim().toLowerCase();
        if (!(item.taluka || '').toLowerCase().includes(q)) return false;
      }
      if (filterReportType && filterReportType !== 'All') {
        if ((item.category || '').toLowerCase() !== filterReportType.toLowerCase()) return false;
      }
      if (filterRoleType && filterRoleType !== 'All') {
        const role = filterRoleType.toLowerCase();
        if (role === 'subscriber' && !item.author_is_subscriber) return false;
        if (role === 'premium' && !item.author_is_premium) return false;
        if (role === 'reporter' && item.author_role !== 'reporter') return false;
        if (role === 'editor' && item.author_role !== 'editor') return false;
      }
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const haystack = `${item.title} ${item.subtitle} ${item.description} ${item.author_name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  };

  const activeFilterCount = [
    filterState !== 'All' && filterState,
    filterDistrict.trim(),
    filterTaluka.trim(),
    filterReportType !== 'All' && filterReportType,
    filterRoleType !== 'All' && filterRoleType,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterState('All');
    setFilterDistrict('');
    setFilterTaluka('');
    setFilterReportType('All');
    setFilterRoleType('All');
    setSearchText('');
  };

  const formatCommentsForView = useCallback((comments = []) => {
    if (!Array.isArray(comments)) return [];
    return comments.map((comment) => ({
      id: String(comment.id || ''),
      text: String(comment.text || ''),
      author: String(comment.author || 'User'),
      author_email: String(comment.author_email || ''),
      date: comment.date || '',
      edited_at: comment.edited_at || null,
      likes: Number(comment.likes || 0),
      liked_by: Array.isArray(comment.liked_by) ? comment.liked_by : [],
      parent_comment_id: comment.parent_comment_id || null,
      replies: formatCommentsForView(Array.isArray(comment.replies) ? comment.replies : []),
    }));
  }, []);

const syncFeed = useCallback(async (focusItemId = null) => {
    setLoading(true);
    // ✅ FIX: /my-role-subscriptions ab News Feed khulte waqt yahan sync hoga
    UserStore.syncSubscriptionFromBackend().catch(() => {});
    // News Feed me sirf News (type 1) dikhegi — Feed/Reel (type 2) posts Feed section me jaate hain.
    const data = await UserStore.getNewsFeedSummary(focusItemId ? { focusItemId } : { type: 1 });
    setLoading(false);
    if (!data) { navigation.replace('Login'); return null; }
    const newsOnlyItems = (Array.isArray(data.items) ? data.items : []).filter((item) => Number(item?.type) !== 2);
    const filteredItems = applyLocationFilter(newsOnlyItems, data.currentUser);
    const totalViews = filteredItems.reduce((sum, item) => sum + (Number(item.views) || 0), 0);
    const totalShares = filteredItems.reduce((sum, item) => sum + (Number(item.shares) || 0), 0);
    const payload = { ...data, items: filteredItems, totalViews, totalShares };
    setNewsData(payload);
    // Ads are loaded in My Ads, not while opening the News Feed.
    setAdFeedItems([]);
    
    if (focusItemId) {
      const target = filteredItems.find((item) => item.id === focusItemId);
      setActiveCommentItem(target || null);
      setLocalComments(formatCommentsForView(target?.comments_list || []));
    }
    return payload;
  }, [formatCommentsForView, navigation]);

  const loadNewsFeed = useCallback(async () => { await syncFeed(); }, [syncFeed]);

  useFocusEffect(useCallback(() => { loadNewsFeed(); }, [loadNewsFeed]));

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (commentModalVisible) {
        setCommentModalVisible(false);
        setLocalComments([]);
        setReplyingToCommentId(null);
        setReplyText('');
        setExpandedReplyThreads({});
        return true;
      }
      if (editModalVisible) {
        setEditModalVisible(false);
        setEditingNewsItem(null);
        return true;
      }
      if (filterPanelVisible) {
        setFilterPanelVisible(false);
        return true;
      }
      handleGoBack();
      return true;
    });
    return () => backHandler.remove();
  }, [commentModalVisible, editModalVisible, filterPanelVisible, navigation]);

  // ============================================================
  // Everything above this line is a hook — safe to bail out now.
  // ============================================================
  // Keep rendering while fonts load. Returning here would skip the callbacks
  // declared below and changes the hook order on the next render.

  const handleShare = async (item) => {
    const newsLink = `https://rtinews.in/news/${encodeURIComponent(item.id || item.title || 'story')}`;
    const image = item.image || item.images?.[0] || '';
    const shareText = `${item.title}\n\n${item.subtitle || item.description || ''}\n\n${image ? `Image: ${image}\n\n` : ''}Read full news: ${newsLink}`;
    const canShareMedia = Platform.OS !== 'web' && (await Sharing.isAvailableAsync());
    const ensureLocalFile = async (uri, fallbackExt = 'bin') => {
      if (!uri) return null;
      if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
      if (uri.startsWith('data:')) {
        const match = uri.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return null;
        const ext = (match[1] || '').includes('/') ? match[1].split('/')[1] : fallbackExt;
        const target = `${FileSystem.cacheDirectory}share-${Date.now()}.${ext}`;
        await FileSystem.writeAsStringAsync(target, match[2], { encoding: FileSystem.EncodingType.Base64 });
        return target;
      }
      return uri;
    };
    const mediaCandidate = item.video || (item.images?.length ? item.images[0] : null) || item.file?.uri;
    try {
      if (canShareMedia && mediaCandidate) {
        const uri = await ensureLocalFile(mediaCandidate, item.video ? 'mp4' : 'jpg');
        if (uri) { await Sharing.shareAsync(uri, { dialogTitle: item.title || 'Share media' }); }
        else { await Share.share({ title: item.title, message: shareText, url: newsLink }); }
      } else {
        await Share.share({ title: item.title, message: shareText, url: newsLink });
      }
    } catch { showToast('Share failed.', 'error'); return; }
    const result = await UserStore.updateNewsFeedItem(item.id, 'share');
    if (!result.ok) { showToast(result.message, 'error'); return; }
    loadNewsFeed();
  };

  const handleOpenFile = async (file) => {
    if (!file?.uri) return;
    try { await Linking.openURL(file.uri); }
    catch { showToast('Unable to open file.', 'error'); }
  };
const handleLike = async (item) => {
  const currentEmail = String(newsData.currentUser?.email || '').trim().toLowerCase();
  const wasLiked = Boolean(item.liked_by_me || (currentEmail && Array.isArray(item.liked_by) && item.liked_by.includes(currentEmail)));
  // Render immediately on Android and web; the server response then confirms it.
  setNewsData((prev) => ({
    ...prev,
    items: (prev.items || []).map((entry) => entry.id === item.id ? {
      ...entry,
      liked_by_me: !wasLiked,
      likes: Math.max(0, Number(entry.likes || 0) + (wasLiked ? -1 : 1)),
      liked_by: currentEmail
        ? (wasLiked ? (entry.liked_by || []).filter((email) => email !== currentEmail) : [...new Set([...(entry.liked_by || []), currentEmail])])
        : entry.liked_by,
    } : entry),
  }));
  const result = await UserStore.updateNewsFeedItem(item.id, 'like', { liked: wasLiked });
  if (!result.ok) { loadNewsFeed(); showToast(result.message, 'error'); return; }
  loadNewsFeed();
};

  const handleBookmark = async (item) => {
    const result = await UserStore.updateNewsFeedItem(item.id, 'bookmark');
    if (!result.ok) { showToast(result.message, 'error'); return; }
    loadNewsFeed();
  };

  const handleEdit = (item) => {
    // ✅ FIX: chhota EditNewsModal ki jagah, ab poori AddNewsScreen (jaisi Add News
    // ke waqt dikhti hai) hi khulti hai, sirf fields already filled hoti hain.
    navigation.navigate('Add News', { editItem: item });
  };

  const runDeleteNewsItem = async (item) => {
    const result = await UserStore.deleteNewsFeedItem(item.id);
    if (result.ok) {
      showToast('News deleted successfully', 'success');
      await loadNewsFeed();
      return;
    }
    showToast(result.message || 'Delete failed', 'error');
  };

  const handleDelete = async (item) => {
    if (Platform.OS === 'web') {
      const confirmed = typeof globalThis.confirm === 'function'
        ? globalThis.confirm('Are you sure you want to delete this news item? This action cannot be undone.')
        : true;
      if (!confirmed) return;
      await runDeleteNewsItem(item);
      return;
    }

    Alert.alert(
      'Delete News',
      'Are you sure you want to delete this news item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await runDeleteNewsItem(item);
          },
        },
      ]
    );
  };

  const openComments = async (item) => {
    setActiveCommentItem(item);
    setLocalComments(formatCommentsForView(item?.comments_list || []));
    setCommentText('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setReplyingToCommentId(null);
    setReplyText('');
    setExpandedReplyThreads({});
    setCommentModalVisible(true);
    await syncFeed(item?.id || null);
  };

  const toggleExpanded = (itemId) => setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const openAuthorProfile = (item) => {
    if (!item) return;
    const authorEmail = String(item.createdBy || '').trim().toLowerCase();
    const fallbackAuthor = {
      name: item.author_name || '',
      author_profile_image: item.author_profile_image || '',
      author_seat_name: item.author_seat_name || '',
      author_role_label: item.author_role_label || '',
      author_has_blue_tick: Boolean(item.author_has_blue_tick || item.has_blue_tick),
      has_blue_tick: Boolean(item.author_has_blue_tick || item.has_blue_tick),
      author_is_premium: Boolean(item.author_is_premium),
      author_is_subscriber: Boolean(item.author_is_subscriber),
    };
    if (!authorEmail && !fallbackAuthor.name && !fallbackAuthor.author_profile_image) {
      showToast('Author profile not available.', 'error');
      return;
    }
       navigation.navigate('UserProfile', { userId: item.author_id || undefined, email: authorEmail, author: fallbackAuthor });
  };

  const findParentCommentId = useCallback((comments = [], targetCommentId) => {
    for (const comment of comments) {
      if (comment.id === targetCommentId) return comment.id;
      if (Array.isArray(comment.replies) && comment.replies.some((reply) => reply.id === targetCommentId)) {
        return comment.id;
      }
    }
    return null;
  }, []);

  const updateFeedCommentCount = useCallback((itemId, delta) => {
    if (!itemId || !delta) return;
    setNewsData((prev) => ({
      ...prev,
      items: (prev.items || []).map((item) =>
        item.id === itemId
          ? { ...item, comments: Math.max(0, Number(item.comments || 0) + delta) }
          : item
      ),
    }));
  }, []);

  const handleAddComment = async () => {
    if (!activeCommentItem) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;
    const result = await UserStore.addNewsComment(activeCommentItem.id, trimmed);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    const added = result.comment || {};
    const newComment = {
      id: String(added.id || Date.now().toString()),
      text: String(added.text || trimmed),
      author: String(added.author || currentUser?.name || 'User'),
      author_email: String(added.author_email || currentUser?.email || ''),
      date: added.date || 'Now',
      edited_at: null,
      likes: 0,
      liked_by: [],
      parent_comment_id: null,
      replies: [],
    };
    setLocalComments((prev) => [newComment, ...prev]);
    setActiveCommentItem((prev) => prev ? { ...prev, comments: Number(prev.comments || 0) + 1 } : prev);
    updateFeedCommentCount(activeCommentItem.id, 1);
    setCommentText('');
  };

  const handleLikeComment = async (commentId) => {
    if (!activeCommentItem) return;
    const result = await UserStore.likeNewsComment(activeCommentItem.id, commentId);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
    setLocalComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          const wasLiked = Array.isArray(comment.liked_by) && currentEmail && comment.liked_by.includes(currentEmail);
          return {
            ...comment,
            likes: Math.max(0, Number(comment.likes || 0) + (wasLiked ? -1 : 1)),
            liked_by: wasLiked
              ? comment.liked_by.filter((email) => email !== currentEmail)
              : [...(comment.liked_by || []), currentEmail],
          };
        }
        if (Array.isArray(comment.replies)) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.id !== commentId) return reply;
              const wasLiked = Array.isArray(reply.liked_by) && currentEmail && reply.liked_by.includes(currentEmail);
              return {
                ...reply,
                likes: Math.max(0, Number(reply.likes || 0) + (wasLiked ? -1 : 1)),
                liked_by: wasLiked
                  ? reply.liked_by.filter((email) => email !== currentEmail)
                  : [...(reply.liked_by || []), currentEmail],
              };
            }),
          };
        }
        return comment;
      })
    );
  };

  const handleStartEdit = (comment) => {
    setReplyingToCommentId(null);
    setReplyText('');
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text || '');
  };
  const handleCancelEdit = () => { setEditingCommentId(null); setEditingCommentText(''); };

  const handleSaveEdit = async () => {
    if (!activeCommentItem || !editingCommentId) return;
    const trimmed = editingCommentText.trim();
    if (!trimmed) return;
    const result = await UserStore.editNewsComment(activeCommentItem.id, editingCommentId, trimmed);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    setLocalComments((prev) =>
      prev.map((comment) => {
        if (comment.id === editingCommentId) return { ...comment, text: trimmed, edited_at: new Date().toISOString() };
        if (Array.isArray(comment.replies)) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === editingCommentId ? { ...reply, text: trimmed, edited_at: new Date().toISOString() } : reply
            ),
          };
        }
        return comment;
      })
    );
    handleCancelEdit();
  };

  const handleDeleteComment = async (commentId) => {
    if (!activeCommentItem) return;
    const result = await UserStore.deleteNewsComment(activeCommentItem.id, commentId);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    let removedCount = 0;
    setLocalComments((prev) =>
      prev
        .map((comment) => {
          if (comment.id === commentId) {
            removedCount = 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0);
            return null;
          }
          if (Array.isArray(comment.replies)) {
            const nextReplies = comment.replies.filter((reply) => reply.id !== commentId);
            if (nextReplies.length !== comment.replies.length) {
              removedCount += comment.replies.length - nextReplies.length;
              return { ...comment, replies: nextReplies };
            }
          }
          return comment;
        })
        .filter(Boolean)
    );
    if (removedCount > 0) {
      setActiveCommentItem((prev) => prev ? { ...prev, comments: Math.max(0, Number(prev.comments || 0) - removedCount) } : prev);
      updateFeedCommentCount(activeCommentItem.id, -removedCount);
    }
    if (editingCommentId === commentId) handleCancelEdit();
    if (replyingToCommentId === commentId) {
      setReplyingToCommentId(null);
      setReplyText('');
    }
  };

  const handleToggleReplies = useCallback((commentId) => {
    setExpandedReplyThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  }, []);

  const handleStartReply = useCallback((commentId) => {
    const parentCommentId = findParentCommentId(localComments, commentId) || commentId;
    if (replyingToCommentId === commentId) {
      setReplyingToCommentId(null);
      setReplyText('');
      return;
    }
    setEditingCommentId(null);
    setEditingCommentText('');
    setReplyingToCommentId(commentId);
    setReplyText('');
    setExpandedReplyThreads((prev) => ({ ...prev, [parentCommentId]: true }));
  }, [findParentCommentId, localComments, replyingToCommentId]);

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    const trimmed = replyText.trim();
    if (!activeCommentItem || !replyingToCommentId || !trimmed) return;
    const result = await UserStore.replyNewsComment(activeCommentItem.id, replyingToCommentId, trimmed);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    const added = result.comment || {};
    const newReply = {
      id: String(added.id || Date.now().toString()),
      text: String(added.text || trimmed),
      author: String(added.author || currentUser?.name || 'User'),
      author_email: String(added.author_email || currentUser?.email || ''),
      date: added.date || 'Now',
      edited_at: null,
      likes: 0,
      liked_by: [],
      parent_comment_id: added.parent_comment_id || replyingToCommentId,
    };
    const parentCommentId = findParentCommentId(localComments, replyingToCommentId) || replyingToCommentId;
    setLocalComments((prev) =>
      prev.map((comment) => {
        if (comment.id === replyingToCommentId || comment.id === parentCommentId) {
          return {
            ...comment,
            replies: Array.isArray(comment.replies) ? [newReply, ...comment.replies] : [newReply],
          };
        }
        return comment;
      })
    );
    setExpandedReplyThreads((prev) => ({ ...prev, [parentCommentId]: true }));
    setActiveCommentItem((prev) => prev ? { ...prev, comments: Number(prev.comments || 0) + 1 } : prev);
    updateFeedCommentCount(activeCommentItem.id, 1);
    setReplyingToCommentId(null);
    setReplyText('');
  };

  const handleAddNews = async () => {
    const user = await UserStore.getCurrentUser();
    if (!user) { navigation.replace('Login'); return; }
    const isAdmin = user.role === 'admin';
    const hasSubscription = UserStore.hasActiveSubscription(user);
    if (!isAdmin && !hasSubscription) { showToast('Premium access required to add news.', 'error'); return; }
    if (!isAdmin && hasSubscription && !user.location_complete) {
      showToast('Select your location to activate premium services.', 'error');
      navigation.navigate('StateSelect', { fromPremium: true }); return;
    }
    navigation.navigate('Add News');
  };

  const displayedItems = applyUIFilters(newsData.items.filter((item) => itemMatchesLanguage(item, language)));
  const displayedCards = interleaveSponsoredCards(displayedItems, adFeedItems);
  const currentUser = newsData.currentUser;
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();
  const currentUserHasBlueTick = Boolean(currentUser && UserStore.hasBlueTick(currentUser));
  const canEditDelete = (item) => {
    if (!currentUser) return false;
    const isAdmin = currentUser.role === 'admin';
    const isOwner = String(item.createdBy || item.created_by || '').trim().toLowerCase() === currentUserEmail;
    return isAdmin || isOwner;
  };

   return (
    <View style={{ flex: 1 }}>
    <View style={styles.root}>
         {/* Fixed Header — ek hi common header (Android/iOS: ModuleMobileHeader.js, Web: ModuleWebHeader.js) */}
      {Platform.OS === 'web' ? (
        <ModuleWebHeader
          title={moduleName}
          navigation={navigation}
          onBack={handleGoBack}
          rightExtra={
            <TouchableOpacity onPress={handleAddNews} activeOpacity={0.8}>
              <Feather name="plus-circle" size={20} color="#ffffff" />
            </TouchableOpacity>
          }
        />
      ) : (
        <ModuleMobileHeader
          title={moduleName}
          navigation={navigation}
          onBack={handleGoBack}
          rightExtra={
            <TouchableOpacity onPress={handleAddNews} activeOpacity={0.7}>
              <Feather name="plus-circle" size={22} color="#ffffff" />
            </TouchableOpacity>
          }
        />
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 👇 Web par content ko bounded/centered rakhne ke liye wrapper — header ke maxWidth (720) se match */}
        <View style={styles.webContentWrap}>

         {/* Hero Card */}
        <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Live News</Text>
          <Text style={styles.heroTitle}>Current News Feed Records</Text>
          <Text style={styles.heroSubtitle}>Manage published updates and create a new article from here.</Text>
        </LinearGradient>

            {/* Metrics */}
        <View style={styles.metricsRow}>
          <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.metricCard, styles.metricPrimary]}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconCircle}>
                <Feather name="file-text" size={16} color={C.white} />
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>Total</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{displayedItems.length}</Text>
            <Text style={styles.metricLabel}>Articles</Text>
          </LinearGradient>

          <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.metricCard, styles.metricSecondary]}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconCircle}>
                <Feather name="eye" size={16} color={C.white} />
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>Views</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{displayedItems.reduce((s, i) => s + (Number(i.views) || 0), 0)}</Text>
            <Text style={styles.metricLabel}>Total Views</Text>
          </LinearGradient>

          <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.metricCard, styles.metricAccent]}>
            <View style={styles.metricTopRow}>
              <View style={styles.metricIconCircle}>
                <Feather name="share-2" size={16} color={C.white} />
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>Shares</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{displayedItems.reduce((s, i) => s + (Number(i.shares) || 0), 0)}</Text>
            <Text style={styles.metricLabel}>Total Shares</Text>
          </LinearGradient>
        </View>

        {/* Filter Card */}
        <View style={styles.filterCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Feather name="search" size={15} color={C.neutral400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search news, author..."
                placeholderTextColor={C.neutral400}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Feather name="x" size={14} color={C.neutral400} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.filterToggleBtn, filterPanelVisible && styles.filterToggleBtnActive]}
              onPress={() => setFilterPanelVisible((p) => !p)}
              activeOpacity={0.8}
            >
                          <Feather name="sliders" size={15} color={filterPanelVisible ? C.white : '#B91C1C'} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {activeFilterCount > 0 && !filterPanelVisible && (
            <View style={styles.activeChipsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filterState !== 'All' && filterState ? (
                  <TouchableOpacity style={styles.activeChip} onPress={() => setFilterState('All')}>
                    <Text style={styles.activeChipText}>{filterState}</Text>
                    <Feather name="x" size={11} color={C.white} style={styles.chipIcon} />
                  </TouchableOpacity>
                ) : null}
                {filterDistrict.trim() ? (
                  <TouchableOpacity style={styles.activeChip} onPress={() => setFilterDistrict('')}>
                    <Text style={styles.activeChipText}>{filterDistrict}</Text>
                    <Feather name="x" size={11} color={C.white} style={styles.chipIcon} />
                  </TouchableOpacity>
                ) : null}
                {filterTaluka.trim() ? (
                  <TouchableOpacity style={styles.activeChip} onPress={() => setFilterTaluka('')}>
                    <Text style={styles.activeChipText}>{filterTaluka}</Text>
                    <Feather name="x" size={11} color={C.white} style={styles.chipIcon} />
                  </TouchableOpacity>
                ) : null}
                {filterReportType !== 'All' && filterReportType ? (
                  <TouchableOpacity style={styles.activeChip} onPress={() => setFilterReportType('All')}>
                    <Text style={styles.activeChipText}>{filterReportType}</Text>
                    <Feather name="x" size={11} color={C.white} style={styles.chipIcon} />
                  </TouchableOpacity>
                ) : null}
                {filterRoleType !== 'All' && filterRoleType ? (
                  <TouchableOpacity style={styles.activeChip} onPress={() => setFilterRoleType('All')}>
                    <Text style={styles.activeChipText}>{filterRoleType}</Text>
                    <Feather name="x" size={11} color={C.white} style={styles.chipIcon} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.clearAllChip} onPress={resetFilters}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {filterPanelVisible ? (
            <View style={styles.filterPanel}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>📍  State</Text>
                <FilterDropdown label="Select State" value={filterState} options={stateOptions} onSelect={setFilterState} />
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>🏘  District / City</Text>
                <View style={styles.textFilterBox}>
                  <Feather name="search" size={13} color={C.neutral400} />
                  <TextInput style={styles.textFilterInput} placeholder="Type district or city..." placeholderTextColor={C.neutral400} value={filterDistrict} onChangeText={setFilterDistrict} />
                  {filterDistrict ? <TouchableOpacity onPress={() => setFilterDistrict('')}><Feather name="x" size={13} color={C.neutral400} /></TouchableOpacity> : null}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>🗂  Taluka</Text>
                <View style={styles.textFilterBox}>
                  <Feather name="search" size={13} color={C.neutral400} />
                  <TextInput style={styles.textFilterInput} placeholder="Type taluka..." placeholderTextColor={C.neutral400} value={filterTaluka} onChangeText={setFilterTaluka} />
                  {filterTaluka ? <TouchableOpacity onPress={() => setFilterTaluka('')}><Feather name="x" size={13} color={C.neutral400} /></TouchableOpacity> : null}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>🏷  Report Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    {REPORT_TYPES.map((rt) => <FilterChip key={rt} label={rt} active={filterReportType === rt} onPress={() => setFilterReportType(rt)} />)}
                  </View>
                </ScrollView>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>👤  Author Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    {ROLE_TYPES.map((rt) => <FilterChip key={rt} label={rt} active={filterRoleType === rt} onPress={() => setFilterRoleType(rt)} />)}
                  </View>
                </ScrollView>
              </View>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                  <Feather name="refresh-ccw" size={13} color={C.danger} />
                  <Text style={styles.resetBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

            {/* News Feed */}
      <View style={{ marginHorizontal: 16, marginBottom: 20, alignItems: 'center' }}>
  <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>News Feed</Text>
  <Text style={[styles.sectionText, { textAlign: 'center' }]}>
    Latest reports in one dedicated feed section.
            {activeFilterCount > 0 ? ` • ${displayedItems.length} result${displayedItems.length !== 1 ? 's' : ''} found` : ''}
          </Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading news feed...</Text>
          ) : displayedCards.length ? (
            displayedCards.map((item) => (
              item.__type === 'ad' ? (
                <SponsoredAdCard key={item.feed_id || item.id} ad={item} navigation={navigation} />
              ) : (
                             <View key={item.id} style={styles.newsCard}>
                <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </LinearGradient>

                <View style={styles.newsTopRow}>
                  <Text style={styles.newsDate}>{formatNewsDate(item.date)}</Text>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Feather name="edit-2" size={14} color={C.textSub} />
                  </TouchableOpacity>
                </View>

                {(() => {
                  const cat = String(item.category || '').trim().toLowerCase();
                  const isCat = (v) => { const t = String(v || '').trim().toLowerCase(); return !t || t === cat || t === 'breaking news'; };
                  return !isCat(item.state) || !isCat(item.district) || !isCat(item.taluka);
                })() ? (
                  <View style={styles.locationTagRow}>
                    {item.state && String(item.state).trim().toLowerCase() !== 'breaking news' && String(item.state).trim().toLowerCase() !== String(item.category || '').trim().toLowerCase() ? (
                      <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.locationTag}>
                        <Feather name="map-pin" size={10} color={C.white} />
                        <Text style={styles.locationTagText}>{item.state}</Text>
                      </LinearGradient>
                    ) : null}
                    {item.district ? (
                      <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.locationTag}>
                        <Feather name="home" size={10} color={C.white} />
                        <Text style={styles.locationTagText}>{item.district}</Text>
                      </LinearGradient>
                    ) : null}
                    {item.taluka ? (
                      <LinearGradient colors={['#450A0A', '#B91C1C', '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.locationTag}>
                        <Feather name="layers" size={10} color={C.white} />
                        <Text style={styles.locationTagText}>{item.taluka}</Text>
                      </LinearGradient>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.authorRow}>
                  <TouchableOpacity style={styles.authorAvatarBtn} onPress={() => openAuthorProfile(item)} activeOpacity={0.8}>
                    <ProfileAvatar uri={item.author_profile_image} size={34} style={styles.authorAvatar} forceDefault={!(item.author_seat_id || item.author_has_blue_tick || item.has_blue_tick || item.author_is_subscriber || item.author_is_premium)} />
                  </TouchableOpacity>
                  <Text style={styles.authorName}>{item.author_name || 'RTI News'}</Text>
                  {Boolean(
                    (currentUserEmail &&
                      String(item.createdBy || item.created_by || '').trim().toLowerCase() === currentUserEmail &&
                      currentUserHasBlueTick) ||
                    UserStore.hasBlueTick({
                      subscription_plan: item.author_subscription_plan,
                      is_subscribed: item.author_is_subscriber || item.author_is_premium,
                    })
                  ) ? (
                    <VerifiedBadge size={18} iconSize={10} style={styles.authorBadge} />
                  ) : null}
                  {(() => {
                    const itemTier = getProfileTier({
                      seat_id: item.author_seat_id,
                      has_blue_tick: Boolean(
                        item.author_has_blue_tick ||
                        (currentUserEmail && String(item.createdBy || item.created_by || '').trim().toLowerCase() === currentUserEmail && currentUserHasBlueTick)
                      ),
                      is_subscribed: Boolean(item.author_is_subscriber || item.author_is_premium),
                    });
                    const planForRole = item.author_subscription_plan || null;
                    const planRoleLabel = (planForRole?.role_names?.length
                      ? planForRole.role_names
                      : String(UserStore.getSeatRoleNameForPlanRoleId(planForRole?.role_id_raw || planForRole?.role_id || '') || '').split(', ')
                    ).filter(Boolean).join(', ');
                    // Seat name (Car Nicobar) hata diya. Plan ka role name dikhega.
                    const label = planRoleLabel || (itemTier.key !== 'common' ? itemTier.label : '');
                    if (!label) return null;
                    return (
                      <>
                        <Text style={styles.authorMetaDot}>•</Text>
                        <View style={[styles.authorSeatPill, { backgroundColor: `${itemTier.accent}1A`, borderColor: itemTier.accent }]}>
                          <Text style={[styles.authorSeat, { color: itemTier.accent }]} numberOfLines={1}>{label}</Text>
                        </View>
                      </>
                    );
                  })()}
                  {canEditDelete(item) && (
                    <TouchableOpacity style={styles.authorEditBtn} onPress={() => handleEdit(item)}>
                      <Feather name="edit-2" size={13} color={C.textSub} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.newsTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.newsSubtitle}>{item.subtitle}</Text> : null}

                {(() => {
                  const fullText = item.description || item.subtitle || 'No description added.';
                  const shortText = fullText.length > 140 ? `${fullText.slice(0, 140)}...` : fullText;
                  const hasDescription = fullText && fullText !== 'No description added.';
                  const isExpanded = !!expandedItems[item.id];
                  return (
                    <View style={styles.newsDescriptionWrap}>
                      <Text style={styles.newsDescription}>{isExpanded ? fullText : shortText}</Text>
                      {hasDescription ? (
                        <TouchableOpacity style={styles.moreBtn} onPress={() => toggleExpanded(item.id)}>
                          <Text style={styles.moreBtnText}>{isExpanded ? 'Less' : 'More'}</Text>
                        </TouchableOpacity>
                      ) : null}
                      {isExpanded ? (
                        <View style={styles.reportDetailsBox}>
                          <Text style={styles.reportDetailsTitle}>Report Details</Text>
                          <Text style={styles.reportDetailLine}>
                            <Text style={styles.reportDetailLabel}>Title: </Text>
                            <Text style={styles.reportDetailValue}>{item.title || 'N/A'}</Text>
                          </Text>
                          {item.subtitle ? (
                            <Text style={styles.reportDetailLine}>
                              <Text style={styles.reportDetailLabel}>Sub Title: </Text>
                              <Text style={styles.reportDetailValue}>{item.subtitle}</Text>
                            </Text>
                          ) : null}
                          <Text style={styles.reportDetailLine}>
                            <Text style={styles.reportDetailLabel}>Description: </Text>
                            <Text style={styles.reportDetailValue}>{fullText}</Text>
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })()}

                {canEditDelete(item) && (
                  <View style={styles.editDeleteRow}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                      <Feather name="edit-2" size={13} color={C.primary} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                      <Feather name="trash-2" size={13} color={C.danger} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}

                            {item.images?.length ? (
                  <View
                    style={styles.mediaPreviewWrap}
                    onLayout={(e) => {
                      const w = Math.round(e.nativeEvent.layout.width);
                      if (w && w !== feedMediaWidth) setFeedMediaWidth(w);
                    }}
                  >
                    {item.images.length === 1 ? (
                      <ResolvedImage uri={item.images[0]} style={styles.mediaSingleImage} resizeMode="cover" />
                    ) : (
                      <MediaGallery
                        images={item.images}
                        width={feedMediaWidth || Math.max(220, Math.min(windowWidth - 42, 720))}
                        maxHeight={260}
                        fit="cover"
                      />
                    )}
                  </View>
                ) : null}
                         {item.video ? (
                  <View style={styles.videoPreviewWrap}>
                    <VideoPreview uri={item.video} style={styles.videoPreview} contentFit="cover" />
                  </View>
                ) : null}

                {item.file ? (
                  <View style={styles.fileInfoBox}>
                    <Text style={styles.mediaLabel}>Upload File</Text>
                    <View style={styles.fileRow}>
                      <Feather name="file-text" size={14} color={C.primary} />
                      <Text style={styles.fileName} numberOfLines={1}>{item.file.name || 'Attachment'}</Text>
                      <TouchableOpacity style={styles.fileOpenBtn} onPress={() => handleOpenFile(item.file)}>
                        <Feather name="external-link" size={13} color={C.primary} />
                        <Text style={styles.fileOpenText}>Open</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

        
                <View style={styles.actionRow}>
                  {(() => {
                    const currentEmail = String(newsData.currentUser?.email || '').trim().toLowerCase();
                    const liked = Boolean(item.liked_by_me || (currentEmail && Array.isArray(item.liked_by) && item.liked_by.includes(currentEmail)));
                    return (
                      <TouchableOpacity style={[styles.actionIconButton, liked && styles.actionIconButtonActive]} onPress={() => handleLike(item)}>
                        <Feather name="heart" size={15} color={liked ? C.white : C.textSub} />
                        <Text style={[styles.actionIconText, liked && styles.actionIconTextActive]}>{item.likes || 0}</Text>
                      </TouchableOpacity>
                    );
                  })()}
                  <TouchableOpacity style={styles.actionIconButton} onPress={() => openComments(item)}>
                    <Feather name="message-circle" size={15} color={C.textSub} />
                    <Text style={styles.actionIconText}>{item.comments || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIconButton} onPress={() => handleShare(item)}>
                    <Feather name="share-2" size={15} color={C.textSub} />
                    <Text style={styles.actionIconText}>{item.shares}</Text>
                  </TouchableOpacity>
                         </View>
              </View>
              )
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={32} color={C.neutral400} />
              <Text style={styles.emptyText}>{activeFilterCount > 0 ? 'No news matches your filters.' : 'No news records found.'}</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.emptyResetBtn} onPress={resetFilters}>
                  <Text style={styles.emptyResetText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        </View>
        {/* 👆 webContentWrap ends here */}
      </ScrollView>

      {/* Edit News Modal */}
      <EditNewsModal
        visible={editModalVisible}
        newsItem={editingNewsItem}
        onClose={() => {
          setEditModalVisible(false);
          setEditingNewsItem(null);
        }}
        onUpdate={loadNewsFeed}
        showToast={showToast}
      />

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setLocalComments([]);
          setReplyingToCommentId(null);
          setReplyText('');
          setExpandedReplyThreads({});
        }}
      >
        <KeyboardAvoidingView
          style={styles.commentKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
        <View style={styles.commentOverlay}>
          <View style={styles.commentSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity onPress={() => {
                setCommentModalVisible(false);
                setLocalComments([]);
                setReplyingToCommentId(null);
                setReplyText('');
                setExpandedReplyThreads({});
              }}>
                <Feather name="x" size={20} color={C.neutral400} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.commentList}
              contentContainerStyle={styles.commentListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {localComments.length ? (
                localComments.map((c) => (
                  <FeedCommentItem
                    key={c.id}
                    comment={c}
                    currentUser={newsData.currentUser}
                    editingCommentId={editingCommentId}
                    editingCommentText={editingCommentText}
                    onEditingCommentTextChange={setEditingCommentText}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onDeleteComment={handleDeleteComment}
                    onLikeComment={handleLikeComment}
                    replyingToCommentId={replyingToCommentId}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onStartReply={handleStartReply}
                    onCancelReply={handleCancelReply}
                    onSubmitReply={handleSubmitReply}
                    expandedReplyThreads={expandedReplyThreads}
                    onToggleReplies={handleToggleReplies}
                  />
                ))
              ) : (
                <Text style={styles.commentEmptyText}>No comments yet.</Text>
              )}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={C.neutral400}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity style={styles.commentSendBtn} onPress={handleAddComment}>
                <Feather name="send" size={16} color={C.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
        </View>
    </View>
  );
}

// ── Styles — same design system as the Advertise / Add News screens ───────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
        customHeader: {
    width: '100%', alignSelf: 'stretch', overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 19, paddingVertical: 14,
    backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  customHeaderImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  customHeaderWeb: { paddingHorizontal: 20, height: MODULE_HEADER_HEIGHT_WEB, paddingVertical: 0 },
  headerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
   backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    headerTitle: { fontSize: 22, fontFamily: FONT.bold, color: '#ffffff' },
   headerAddButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    scrollView: { flex: 1 },
  mediaSingleImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 0, backgroundColor: '#EEF0F3' },
  scrollContent: { paddingBottom: 40, ...(Platform.OS === 'web' ? { alignItems: 'center' } : null) },

  // 👇 NEW: web par content ko header jitni hi maxWidth (720) mein center karta hai,
  // taaki poori browser width cover na ho — mobile/native par koi effect nahi.
  webContentWrap: { width: '100%', maxWidth: 720, alignSelf: 'center' },

heroCard: { margin: 16, marginBottom: 12, padding: 18, borderRadius: 14, overflow: 'hidden' },
heroEyebrow: { fontSize: 11, fontFamily: FONT.bold, color: C.white, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
heroTitle: { fontSize: 19, fontFamily: FONT.bold, color: C.white, marginBottom: 4 },
heroSubtitle: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },

  metricsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
metricCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12 },
metricPrimary: { borderColor: C.border },
metricSecondary: { borderColor: C.border },
metricAccent: { borderColor: C.border },metricTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, ...Platform.select({ web: { justifyContent: 'center', gap: 10 }, default: { justifyContent: 'space-between' } }) },
metricIconCircle: { width: 28, height: 28, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
metricBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
metricBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: C.white, textTransform: 'uppercase' },
metricValue: { fontSize: 24, fontFamily: FONT.black, color: C.white, textAlign: 'center' },
metricLabel: { fontSize: 12, fontFamily: FONT.medium, color: C.white, marginTop: 2, textAlign: 'center' },
  filterCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.white, borderRadius: 14, padding: 12 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
 searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.white, outlineStyle: 'none' },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FONT.regular, color: C.textBody, padding: 0 },
  filterToggleBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#B91C1C', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundColor: C.white },
  filterToggleBtnActive: { backgroundColor: C.primary },
  filterBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: C.danger, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  filterBadgeText: { fontSize: 9, fontFamily: FONT.bold, color: C.white },

  activeChipsRow: { flexDirection: 'row', marginTop: 10 },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  activeChipText: { fontSize: 11, fontFamily: FONT.medium, color: C.white },
  chipIcon: { marginLeft: 6 },
  clearAllChip: { justifyContent: 'center', paddingHorizontal: 10 },
  clearAllText: { fontSize: 11, fontFamily: FONT.bold, color: C.danger },

  filterPanel: { marginTop: 12, gap: 14 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 12, fontFamily: FONT.bold, color: C.textBody },
  textFilterBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: C.white },
  textFilterInput: { flex: 1, fontSize: 12, fontFamily: FONT.regular, color: C.textBody, padding: 0 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.danger, borderRadius: 100, paddingVertical: 10, marginTop: 4 },
  resetBtnText: { fontSize: 12, fontFamily: FONT.bold, color: C.danger },

  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.neutral400, backgroundColor: C.white, marginRight: 8 },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub },
  filterChipTextActive: { color: C.white, fontFamily: FONT.bold },

  dropdownWrapper: { position: 'relative' },
   dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.white },
  dropdownBtnActive: { backgroundColor: C.primary },
  dropdownBtnText: { fontSize: 12, fontFamily: FONT.medium, color: C.textBody, flex: 1 },
  dropdownBtnTextActive: { color: C.white, fontFamily: FONT.bold },
  dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 4, maxHeight: 220, zIndex: 20, elevation: 6 },
  dropdownScroll: { maxHeight: 220 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemActive: { backgroundColor: C.uploadBg },
  dropdownItemText: { fontSize: 12, fontFamily: FONT.medium, color: C.textBody },
  dropdownItemTextActive: { color: C.textSub, fontFamily: FONT.bold },

  card: { marginHorizontal: 16, marginBottom: 20, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
sectionTitle: { fontSize: 19, fontFamily: FONT.bold, color: C.textBody, marginBottom: 4 },
sectionText: { fontSize: 13, fontFamily: FONT.medium, color: C.textSub, marginBottom: 12 },
  loadingText: { fontSize: 13, fontFamily: FONT.medium, color: C.textSub, textAlign: 'center', paddingVertical: 20 },

newsCard: { width: '100%', alignSelf: 'stretch', minWidth: 0, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10, marginBottom: 10, backgroundColor: C.white, position: 'relative', overflow: 'hidden' },
newsTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6, marginTop: 6 },
categoryBadge: { position: 'absolute', top: 0, left: 0, borderTopLeftRadius: 12, borderBottomRightRadius: 12, paddingHorizontal: 10, paddingVertical: 4, zIndex: 2 },
categoryBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#fff', textTransform: 'uppercase' },
newsDate: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: FONT.bold, color: C.textBody },
locationTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },
locationTagText: { fontSize: 11, fontFamily: FONT.medium, color: C.white },
authorName: { fontSize: 15, fontFamily: FONT.bold, color: C.textBody },
actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, width: '100%' },
actionIconButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
   authorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
   authorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  authorAvatarBtn: { marginRight: 12 },
    authorAvatar: { borderRadius: 17 },
  authorLabel: { fontSize: 11, fontFamily: FONT.regular, color: C.textSub },
   authorName: { fontSize: 15, fontFamily: FONT.bold, color: C.textBody },
    authorBadge: { marginLeft: 2 },
  authorEditBtn: { marginLeft: 'auto', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  authorMetaDot: { fontSize: 11, color: C.textMuted, marginHorizontal: 2 },
    authorSeat: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, maxWidth: 140 },
  authorSeatPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  newsTitle: { fontSize: 15, fontFamily: FONT.bold, color: C.textBody, marginBottom: 4 },
  newsSubtitle: { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, marginBottom: 6 },
  newsDescriptionWrap: { marginBottom: 8 },
  newsDescription: { fontSize: 12, fontFamily: FONT.regular, color: C.textBody, lineHeight: 18 },
  moreBtn: { marginTop: 4 },
  moreBtnText: { fontSize: 11, fontFamily: FONT.bold, color: C.primary },
  reportDetailsBox: { marginTop: 10, backgroundColor: C.uploadBg, borderRadius: 10, padding: 10 },
  reportDetailsTitle: { fontSize: 11, fontFamily: FONT.bold, color: C.primary, marginBottom: 6, textTransform: 'uppercase' },
  reportDetailLine: { fontSize: 11, fontFamily: FONT.regular, color: C.textBody, marginBottom: 4 },
  reportDetailLabel: { fontFamily: FONT.bold, color: C.textBody },
  reportDetailValue: { fontFamily: FONT.regular, color: C.textSub },

  editDeleteRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.primary, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
  editButtonText: { fontSize: 11, fontFamily: FONT.bold, color: C.primary },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.danger, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
  deleteButtonText: { fontSize: 11, fontFamily: FONT.bold, color: C.danger },

  mediaPreviewWrap: { marginBottom: 10 },
  mediaLabel: { fontSize: 11, fontFamily: FONT.bold, color: C.textBody, marginBottom: 6 },
  mediaThumb: { width: 100, height: 100, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: C.border },
  videoPreviewWrap: { marginBottom: 10, borderRadius: 10, overflow: 'hidden' },
  videoPreview: { width: '100%', height: 190, borderRadius: 10 },
  mediaInfoBox: { backgroundColor: C.uploadBg, borderRadius: 10, padding: 10, marginBottom: 10 },
  mediaText: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub },
  fileInfoBox: { backgroundColor: C.uploadBg, borderRadius: 10, padding: 10, marginBottom: 10 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileName: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: C.textBody },
  fileOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  fileOpenText: { fontSize: 11, fontFamily: FONT.bold, color: C.primary },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, width: '100%' },
actionIconButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 },
  actionIconButtonActive: { backgroundColor: C.primary, borderColor: C.primary },
    actionIconText: { fontSize: 11, fontFamily: FONT.bold, color: C.textSub },
  actionIconTextActive: { color: C.white },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, textAlign: 'center' },
  emptyResetBtn: { borderWidth: 1, borderColor: C.primary, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9 },
  emptyResetText: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },

  imagePlaceholder: { backgroundColor: C.uploadBg },

  commentItem: { borderBottomWidth: 1, borderBottomColor: C.headerBorder, paddingVertical: 10 },
  commentReplyItem: { marginLeft: 20, borderBottomWidth: 0, borderLeftWidth: 2, borderLeftColor: C.uploadBg, paddingLeft: 10 },
  commentTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: 12, fontFamily: FONT.bold, color: C.textBody },
  commentDate: { fontSize: 10, fontFamily: FONT.regular, color: C.textMuted },
  commentEditInput: { borderWidth: 1, borderColor: C.primary, borderRadius: 8, padding: 8, fontSize: 12, fontFamily: FONT.regular, color: C.textBody, marginBottom: 6 },
  commentText: { fontSize: 12, fontFamily: FONT.regular, color: C.textBody, marginBottom: 6, lineHeight: 17 },
  commentActionRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.primary, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  commentActionBtnActive: { backgroundColor: C.primary },
  commentActionText: { fontSize: 10, fontFamily: FONT.bold, color: C.primary },
  commentActionTextActive: { color: C.white },
  commentMiniBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentMiniBtnText: { fontSize: 11, fontFamily: FONT.bold, color: C.primary },
  commentMiniBtnDeleteText: { fontSize: 11, fontFamily: FONT.bold, color: C.danger },
  commentReplyForm: { marginTop: 8, gap: 8 },
  commentReplyInput: { borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8, padding: 8, fontSize: 12, fontFamily: FONT.regular, color: C.textBody, minHeight: 40 },
  commentReplyActions: { flexDirection: 'row', gap: 14 },
  commentRepliesWrap: { marginTop: 8 },
  commentRepliesToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentRepliesLine: { width: 20, height: 1, backgroundColor: C.border },
  commentRepliesToggleText: { fontSize: 11, fontFamily: FONT.bold, color: C.primary },
  commentRepliesList: { marginTop: 6 },

  commentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  editModalSheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 20 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.headerBorder },
  commentTitle: { fontSize: 15, fontFamily: FONT.bold, color: C.textMain },
  editModalScroll: { paddingHorizontal: 16, paddingTop: 14 },
  editInput: { borderWidth: 1, borderColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13, fontFamily: FONT.regular, color: C.textBody, marginBottom: 12 },
  editInputMultiline: { borderWidth: 1, borderColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13, fontFamily: FONT.regular, color: C.textBody, marginBottom: 12, minHeight: 100, textAlignVertical: 'top' },
  addNewsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 100, paddingVertical: 14, marginTop: 6, marginBottom: 20 },
  addNewsButtonDisabled: { opacity: 0.7 },
  addNewsButtonText: { fontSize: 14, fontFamily: FONT.bold, color: C.white },

  commentKeyboardAvoider: { flex: 1 },
  commentSheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 10 },
  commentList: { paddingHorizontal: 16 },
  commentListContent: { paddingTop: 10, paddingBottom: 20 },
  commentEmptyText: { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, textAlign: 'center', paddingVertical: 30 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.headerBorder },
  commentInput: { flex: 1, borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontFamily: FONT.regular, color: C.textBody, maxHeight: 100 },
  commentSendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});