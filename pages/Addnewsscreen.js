import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
let RichEditor = null;
let RichToolbar = null;
let actions = null;
if (Platform.OS !== 'web') {
  // ✅ FIX: 'react-native-pell-rich-editor' web pe WebView use karta hai jo
  // support nahi karta — static import hone ki wajah se ye page load hote hi
  // crash/hang kar deta tha. Ab sirf native (Android/iOS) pe hi load hoga.
  const richEditorLib = require('react-native-pell-rich-editor');
  RichEditor = richEditorLib.RichEditor;
  RichToolbar = richEditorLib.RichToolbar;
  actions = richEditorLib.actions;
}
import VideoPreview from '../components/VideoPreview';
import NewsLimitModal from '../components/NewsLimitModal';
import WebRichEditor from '../components/WebRichEditor';
import { useToast, useBusy } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { storeWebUriToIdbMedia } from '../utils/webMediaStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';


// ✅ FIX: sirf real server URL (http/https) ko hi "valid" maano.
// blob:, file://, content://, data: jaise local-only URIs kisi doosre
// device/browser par kaam nahi karte — isliye unhe news record me save
// nahi karna chahiye, warna sirf poster ko hi image dikhti hai, baaki
// sabko broken/blank image dikhta hai.
const isRemoteImageUrl = (uri) =>
  typeof uri === 'string' && /^https?:\/\//i.test(uri.trim());

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const REPORT_TYPES = [
  // Home header categories. "All" is only a feed filter, never a post type.
  'Latest News',
  'India',
  'Politics',
  'Business',
  'Sports',
  'Technology',
  'Entertainment',
  'Health',
  'Education',
  'Breaking News',
  'Investigation',
  'Opinion',
  'Feature',
  'Local News',
  'National',
  'International',
];

const ROLE_TYPES = [
  
  'Chief Editor',
  'Executive Editor',
  'Deputy Editor (National)',
  'Public Relations Officer',
  'National Bureau Chief',
  'Pratinidhi',
];
const MEDIA_TYPES = ['None', 'Image', 'Video', 'File'];
const NEWS_DRAFT_PREFIX = 'rti-news-draft:';

const UPLOADS_ROOT = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}uploads`
  : null;

function shouldPersistLocalUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  return /^(file:|content:|ph:|asset:)/i.test(uri);
}

function getFileExtensionFromUri(uri, fallbackExt = '') {
  const safeFallback = String(fallbackExt || '').replace(/^\./, '');
  if (!uri || typeof uri !== 'string') return safeFallback;
  const cleaned = uri.split('?')[0].split('#')[0];
  const match = cleaned.match(/\.([a-z0-9]{2,6})$/i);
  return match ? match[1].toLowerCase() : safeFallback;
}

async function persistToUploadsDir({ uri, subdir, fallbackExt }) {
  if (!UPLOADS_ROOT || Platform.OS === 'web') return uri;
  if (!shouldPersistLocalUri(uri)) return uri;

  try {
    const targetDir = `${UPLOADS_ROOT}/${subdir}`;
    await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    const ext = getFileExtensionFromUri(uri, fallbackExt) || 'bin';
    const dest = `${targetDir}/${Date.now()}-${Math.floor(Math.random() * 1e9)}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    try { console.warn('persistToUploadsDir failed', { uri, subdir }); } catch {}
    return uri;
  }
}

// ── Design tokens — matched to the Advertise (Ads) screen ──────────────────────
const C = {
  primary:      '#ea580c',
  primaryDark:  '#C8700F',
  gradientRed:  ['#450A0A', '#B91C1C', '#7F1D1D'],
  fieldBorder:  '#D1D5DB',
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

// ── Section label — "1. Title *" style used throughout the Ads screen ─────────
function SectionLabel({ number, title, hint, optional }) {
  return (
    <View style={st.wrap}>
      <Text style={st.title}>
        {number ? `${number}. ` : ''}<Text>{title}</Text>
        {optional ? (
          <Text style={st.optional}> (optional)</Text>
        ) : (
          <Text style={st.req}> *</Text>
        )}
      </Text>
      {hint ? <Text style={st.hint}>{hint}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap:     { flexDirection: 'column', marginBottom: 12 },
  title:    { fontSize: 15, fontFamily: FONT.bold, color: C.textBody },
  req:      { color: C.danger },
  optional: { color: C.neutral400, fontFamily: FONT.medium, fontSize: 13 },
  hint:     { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, marginTop: 2 },
});

function InfoHint({ text }) {
  return (
    <View style={ih.row}>
      <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
      <Text style={ih.text}>{text}</Text>
    </View>
  );
}
const ih = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  text: { fontSize: 10, fontFamily: FONT.medium, color: C.textMuted },
});

// ── Shared list-picker modal (State / Report Type / Role Type) ─────────────────
// Same chrome as the Ads screen's modals: bottom sheet on mobile, centered box on web.
function ListPickerModal({ visible, title, options, selected, onSelect, onClose, searchable }) {
  const [search, setSearch] = useState('');
  const isWeb = Platform.OS === 'web';
  const filtered = searchable
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const body = (
    <>
      {searchable ? (
        <View style={ms.searchWrap}>
          <Feather name="search" size={15} color={C.textSub} />
          <TextInput
            style={ms.searchInput}
            placeholder="Search..."
            placeholderTextColor={C.neutral400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      ) : null}
      <ScrollView showsVerticalScrollIndicator={false} style={ms.list}>
        {filtered.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[ms.item, selected === opt && ms.itemActive]}
            onPress={() => { onSelect(opt); onClose(); }}
          >
            <Text style={[ms.itemText, selected === opt && ms.itemTextActive]}>{opt}</Text>
            {selected === opt ? <Ionicons name="checkmark" size={16} color={C.primary} /> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  if (isWeb) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={ms.webOverlay}>
          <TouchableOpacity style={ms.webBackdrop} activeOpacity={1} onPress={onClose} />
          <View style={ms.webBox}>
            <View style={ms.webHeader}>
              <TouchableOpacity onPress={onClose} style={ms.webCloseBtn}>
                <Ionicons name="arrow-back" size={18} color={C.textBody} />
              </TouchableOpacity>
              <Text style={ms.webHeaderTitle}>{title}</Text>
              <View style={{ width: 34 }} />
            </View>
            {body}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <View style={ms.header}>
            <TouchableOpacity onPress={onClose} style={ms.backBtn}>
              <Ionicons name="arrow-back" size={20} color={C.textBody} />
            </TouchableOpacity>
            <Text style={ms.headerTitle}>{title}</Text>
          </View>
          {body}
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  // mobile bottom sheet
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  handle:       { width: 44, height: 4, backgroundColor: C.border, borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.headerBorder },
  backBtn:      { padding: 6, borderRadius: 8, backgroundColor: C.uploadBg },
  headerTitle:  { fontSize: 15, fontFamily: FONT.bold, color: C.textMain },
  // web centered box
  webOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  webBackdrop:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  webBox:       { width: '100%', maxWidth: 460, maxHeight: '80vh', backgroundColor: C.white, borderRadius: 16, overflow: 'hidden' },
  webHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.headerBorder },
  webCloseBtn:  { width: 34, height: 34, borderRadius: 8, backgroundColor: C.uploadBg, alignItems: 'center', justifyContent: 'center' },
  webHeaderTitle: { fontSize: 15, fontFamily: FONT.bold, color: C.textBody },
  // shared list
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.white },
  searchInput:  { flex: 1, fontSize: 13, fontFamily: FONT.regular, color: C.textBody, padding: 0 },
  list:         { paddingHorizontal: 8, marginTop: 4 },
  item:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8 },
  itemActive:   { backgroundColor: C.uploadBg },
  itemText:     { fontSize: 13, fontFamily: FONT.medium, color: C.textBody },
  itemTextActive: { color: C.primary, fontFamily: FONT.bold },
});

export default function AddNewsScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({
    Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black,
  });

  // ✅ EDIT MODE: jab NewsFeedScreen se "Edit" pe click hota hai, ye screen
  // usi item ke saath khulti hai (navigation.navigate('Add News', { editItem }))
  const editItem = route?.params?.editItem || null;
  const isEditMode = Boolean(editItem);
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && windowWidth <= 760;
   const isWebCompact = isWeb && windowWidth <= 640;
  const insets = useSafeAreaInsets();

  const decodeHtmlEntities = (value) => String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const htmlToPlain = (html) => String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>\s*<div>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const escapeHtml = (text) => String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const plainToHtml = (text) => `<div>${escapeHtml(text).replace(/\n/g, '<br/>')}</div>`;

  const [saving, setSaving] = useState(false);
  useBusy(saving);
  // POST /news => 403 NEWS_LIMIT_REACHED par popup. Edit mode mein ye kabhi nahi dikhta.
  const [limitModal, setLimitModal] = useState({ visible: false, message: '' });
  // Free user ke liye "X free posts left" (backend `free_posts_remaining`). null => hide.
  const [freePostsLeft, setFreePostsLeft] = useState(null);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribedUser, setIsSubscribedUser] = useState(false);
  const [locationState, setLocationState] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [locationTaluka, setLocationTaluka] = useState('');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [reportType, setReportType] = useState('');
  const [roleType, setRoleType] = useState('');
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [subtitleExpanded, setSubtitleExpanded] = useState(false);
  const [postType, setPostType] = useState(Number(editItem?.type) === 2 ? 2 : 1); // 1 = News, 2 = Feed (Reel)
  const [mediaType, setMediaType] = useState(Number(editItem?.type) === 2 ? 'Video' : 'None');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoThumb, setVideoThumb] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [selectedState, setSelectedState] = useState('');
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [reportPickerVisible, setReportPickerVisible] = useState(false);
  const [rolePickerVisible, setRolePickerVisible] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);

  const videoOriginalUriRef = useRef(null);
  const titleEditorRef = useRef(null);
  const titleHtmlRef = useRef('');
  const subtitleEditorRef = useRef(null);
  const subtitleHtmlRef = useRef('');
  const descriptionEditorRef = useRef(null);
  const descriptionHtmlRef = useRef('');
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // ✅ FIX: subscription ki real status backend se sync karo, tabhi user check karo
      // Isse "subscription buy karne ke baad bhi maang raha hai" wala bug fix hoga
          const user = await UserStore.getCurrentUser();
      if (!user) {
        // ✅ FIX: login ke baad seedha wapas isi screen pe bhejne ke liye
        navigation.replace('Login', { redirectTo: 'Add News' });
        return;
      }
const admin = user.role === 'admin';
      // ✅ Backend se fresh subscription status sync karo, taaki purana/stale local flag na dikhe
      const syncedUser = admin ? user : (await UserStore.syncSubscriptionFromBackend()) || user;
      const hasSubscription = UserStore.hasActiveSubscription(syncedUser);

        setUserName(user.name || 'User');
      setIsAdmin(admin);
      setIsSubscribedUser(hasSubscription);
      const lastKnownFree = syncedUser?.free_news_credits ?? user.free_news_credits;
      setFreePostsLeft(!admin && !hasSubscription && lastKnownFree != null && Number.isFinite(Number(lastKnownFree)) ? Number(lastKnownFree) : null);
      setLocationState(user.state || '');
      setLocationDistrict(user.district || '');
      setLocationTaluka(user.taluka || '');

      // Let users fill the form before buying. Access is checked at submit time,
      // so nothing typed is lost when they are sent to purchase a plan.
      const rawDraft = await AsyncStorage.getItem(`${NEWS_DRAFT_PREFIX}${String(user.email || '').toLowerCase()}`);
      if (rawDraft) {
        try { setSavedDraft(JSON.parse(rawDraft)); } catch { await AsyncStorage.removeItem(`${NEWS_DRAFT_PREFIX}${String(user.email || '').toLowerCase()}`); }
      }

      if (hasSubscription && user.location_complete) {
        setSelectedState(user.state || '');
      }
    };

    init();
    const timer = setTimeout(() => setEditorReady(true), 300);
    return () => clearTimeout(timer);
  }, [navigation, showToast]);

  useEffect(() => {
    if (!savedDraft || !editorReady || isEditMode) return;
    setTitle(savedDraft.title || ''); setSubtitle(savedDraft.subtitle || '');
    setDescriptionText(savedDraft.descriptionText || ''); setReportType(savedDraft.reportType || '');
    setRoleType(savedDraft.roleType || ''); setMediaType(savedDraft.mediaType || 'None'); setPostType(Number(savedDraft.postType) === 2 ? 2 : 1);
    setImages(Array.isArray(savedDraft.images) ? savedDraft.images : []); setVideo(savedDraft.video || null);
    setVideoThumb(savedDraft.videoThumb || null); setAttachment(savedDraft.attachment || null);
    setSelectedState(savedDraft.selectedState || ''); videoOriginalUriRef.current = savedDraft.videoOriginalUri || null;
    titleHtmlRef.current = savedDraft.titleHtml || plainToHtml(savedDraft.title || '');
    subtitleHtmlRef.current = savedDraft.subtitleHtml || plainToHtml(savedDraft.subtitle || '');
    descriptionHtmlRef.current = savedDraft.descriptionHtml || plainToHtml(savedDraft.descriptionText || '');
    titleEditorRef.current?.setContentHTML(titleHtmlRef.current);
    subtitleEditorRef.current?.setContentHTML(subtitleHtmlRef.current);
    descriptionEditorRef.current?.setContentHTML(descriptionHtmlRef.current);
    setSavedDraft(null);
  }, [savedDraft, editorReady, isEditMode]);

  // ✅ EDIT MODE: editorReady hone ke baad existing news ke fields form me bhar do
  useEffect(() => {
    if (!isEditMode || !editorReady || !editItem) return;

    const existingTitle = editItem.title || '';
    const existingSubtitle = editItem.subtitle || editItem.sub_tittle || '';
    const existingDescription = editItem.description || '';

    setTitle(existingTitle);
    setSubtitle(existingSubtitle);
    setDescriptionText(existingDescription);
    setReportType(editItem.report_type || editItem.category || editItem.reportType || '');
    setRoleType(editItem.role_type || editItem.roleType || '');
    setSelectedState(editItem.state || '');
    setPostType(Number(editItem.type) === 2 ? 2 : 1);

    const existingImages = Array.isArray(editItem.images)
      ? editItem.images.filter(Boolean)
      : (editItem.image ? [editItem.image] : []);
    const existingMediaType = existingImages.length ? 'Image' : editItem.video ? 'Video' : editItem.file ? 'File' : 'None';
    setMediaType(existingMediaType);
    setImages(existingImages);
    if (editItem.video) setVideo(editItem.video);
    if (editItem.file) setAttachment({ uri: editItem.file, name: editItem.file_name || 'attachment' });

    titleHtmlRef.current = plainToHtml(existingTitle);
    subtitleHtmlRef.current = plainToHtml(existingSubtitle);
    descriptionHtmlRef.current = plainToHtml(existingDescription);
    titleEditorRef.current?.setContentHTML(titleHtmlRef.current);
    subtitleEditorRef.current?.setContentHTML(subtitleHtmlRef.current);
    descriptionEditorRef.current?.setContentHTML(descriptionHtmlRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editorReady, editItem]);

  // ============================================================
  // Everything above this line is a hook — safe to bail out now.
  // ============================================================
  if (!fontsLoaded) return null;

  const handleLogout = async () => {
    await UserStore.clearCurrentUser();
    navigation.replace('Login');
  };

  const ensureLibraryPermission = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Gallery permission needed.', 'error');
      return false;
    }
    return true;
  };

  const normalizeMediaType = (typeValue) => {
    if (!typeValue) return undefined;
    const normalized = String(typeValue).toLowerCase();
    if (normalized.includes('images')) return ImagePicker.MediaType?.Images || 'images';
    if (normalized.includes('videos')) return ImagePicker.MediaType?.Videos || 'videos';
    if (normalized.includes('all')) return ImagePicker.MediaType?.All || 'all';
    return typeValue;
  };

  const getImagePickerTypes = () => {
    const mediaType = ImagePicker.MediaType;
    const mediaOption = ImagePicker.MediaTypeOptions;
    return {
      images: normalizeMediaType(mediaType?.Images || mediaOption?.Images),
      videos: normalizeMediaType(mediaType?.Videos || mediaOption?.Videos),
      all: normalizeMediaType(mediaType?.All || mediaOption?.All),
    };
  };

  const isVideoAsset = (asset) => {
    if (!asset) return false;
    return (
      asset.type === 'video' ||
      (asset.mimeType && asset.mimeType.startsWith('video/')) ||
      (asset.name && /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(asset.name)) ||
      (asset.uri && /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(asset.uri))
    );
  };

  const validateVideoDuration = (durationMs) => {
    const safeDuration = Number(durationMs || 0);
    if (!safeDuration) return true;
    if (safeDuration < 15000) {
      showToast('Video must be at least 15 seconds.', 'error');
      return false;
    }
    if (safeDuration > 60000) {
      showToast('Video must be 1 minute or less.', 'error');
      return false;
    }
    return true;
  };

  const generateVideoThumbnail = (videoSrc) => {
    return new Promise((resolve) => {
      try {
        const thumbVid = document.createElement('video');
        thumbVid.src = videoSrc;
        thumbVid.crossOrigin = 'anonymous';
        thumbVid.muted = true;
        thumbVid.preload = 'metadata';
        thumbVid.addEventListener('loadedmetadata', () => {
          thumbVid.currentTime = 0.5;
        });
        thumbVid.addEventListener('seeked', () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = thumbVid.videoWidth || 640;
            canvas.height = thumbVid.videoHeight || 360;
            canvas.getContext('2d').drawImage(thumbVid, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } catch {
            resolve(null);
          }
        });
        thumbVid.addEventListener('error', () => resolve(null));
        thumbVid.load();
      } catch {
        resolve(null);
      }
    });
  };

  const pickImages = async () => {
    try {
      const ok = await ensureLibraryPermission();
      if (!ok) return;

      const { images: imageTypes } = getImagePickerTypes();
      const imgPickResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: imageTypes || undefined,
        allowsMultipleSelection: true,
        base64: false,
        quality: 0.6,
        maxWidth: 1280,
        maxHeight: 1280,
        allowsEditing: false,
        exif: false,
      });

      if (!imgPickResult.canceled && imgPickResult.assets?.length) {
        const processedImages = [];
        const maxImages = 5;
        const remainingSlots = Math.max(0, maxImages - images.length);
        if (!remainingSlots) {
          showToast(`You can upload up to ${maxImages} images.`, 'info');
          return;
        }

        for (let i = 0; i < Math.min(imgPickResult.assets.length, remainingSlots); i++) {
          const asset = imgPickResult.assets[i];
          if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
            showToast(`Image ${i + 1} is too large (max 10MB). Skipping.`, 'warning');
            continue;
          }
          processedImages.push(asset.uri);
        }

        if (processedImages.length > 0) {
          setImages((prev) => [...prev, ...processedImages]);
          setTimeout(() => titleEditorRef.current?.focusContentEditor?.(), 180);
          if (imgPickResult.assets.length > remainingSlots) {
            showToast(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} added (maximum ${maxImages}).`, 'info');
          }
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showToast('Unable to open image picker.', 'error');
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const pickVideo = async () => {
    try {
      if (Platform.OS === 'web') {
        const webResult = await DocumentPicker.getDocumentAsync({
          type: 'video/*',
          multiple: false,
          copyToCacheDirectory: true,
        });
        if (webResult.canceled) return;

        const asset = webResult.assets?.[0] || webResult;
        if (!isVideoAsset(asset)) {
          showToast('Please select a video file.', 'error');
          return;
        }

        if (asset.size && asset.size > 50 * 1024 * 1024) {
          showToast('Video is too large (max 50MB).', 'error');
          return;
        }

        if (!validateVideoDuration(asset.duration)) return;

        videoOriginalUriRef.current = asset.uri;
        const persisted = await storeWebUriToIdbMedia(asset.uri, { prefix: 'video', mimeType: asset.mimeType || '' });
        setVideo(persisted);

        const thumb = await generateVideoThumbnail(persisted);
        if (thumb) setVideoThumb(thumb);

        showToast('Video selected.', 'success');
        return;
      }

      const ok = await ensureLibraryPermission();
      if (!ok) return;

      const { videos } = getImagePickerTypes();
      const nativeResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: videos || undefined,
        allowsMultipleSelection: false,
        base64: false,
        quality: 0.8,
        videoMaxDuration: 60,
        allowsEditing: false,
      });

      if (!nativeResult.canceled && nativeResult.assets?.[0]) {
        const asset = nativeResult.assets[0];

        if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
          showToast('Video is too large (max 50MB).', 'error');
          return;
        }

        if (!isVideoAsset(asset)) {
          showToast('Please select a video file.', 'error');
          return;
        }

        if (!validateVideoDuration(asset.duration)) return;
        setVideo(asset.uri);
        setTimeout(() => titleEditorRef.current?.focusContentEditor?.(), 180);
      }
    } catch (err) {
      console.warn('Video picker error:', err);
      showToast('Unable to open video picker.', 'error');
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0] || result;
      if (!asset?.uri) return;
      setAttachment({
        uri: asset.uri,
        name: asset.name || 'attachment',
        size: asset.size || null,
        mimeType: asset.mimeType || asset.type || '',
      });
      setTimeout(() => titleEditorRef.current?.focusContentEditor?.(), 180);
    } catch (_err) {
      showToast('Unable to open file picker.', 'error');
    }
  };

  const handleSubmit = async () => {
    const titleHtml = titleHtmlRef.current || '';
    const subtitleHtml = subtitleHtmlRef.current || '';
    const descriptionHtml = descriptionHtmlRef.current || '';
    const titlePlain = htmlToPlain(titleHtml);
    const subtitlePlain = htmlToPlain(subtitleHtml);
    const descriptionPlain = htmlToPlain(descriptionHtml);

    if (!titlePlain) { showToast('Title is required.', 'error'); return; }
    if (!descriptionPlain) { showToast('Description is required.', 'error'); return; }
    if (!reportType) { showToast('Please select a report type.', 'error'); return; }

    // Location picker hata diya gaya hai — state ab user ki profile se automatically aati hai
    // (optional; khali ho to bhi news post ho jayegi).
    const stateValue = locationState || selectedState || '';
    if (mediaType === 'Image' && images.length === 0) { showToast('Please upload at least one image.', 'error'); return; }
    if (postType === 2 && mediaType !== 'Video' && mediaType !== 'Image') { showToast('Feed needs a video or at least one image.', 'error'); return; }
    if (mediaType === 'Video' && !video) { showToast('Please upload a video.', 'error'); return; }
    if (mediaType === 'File' && !attachment) { showToast('Please upload a file.', 'error'); return; }

    setSaving(true);
    const user = await UserStore.getCurrentUser();
    if (!user) {
      showToast('Login again.', 'error');
      setSaving(false);
      return;
    }

    // ✅ Free limit ab sirf backend enforce karta hai (POST /news => 403 NEWS_LIMIT_REACHED).
    // Yahan koi local pre-check nahi — edit (PUT /update-news/{id}) par koi limit hai hi nahi.



    // ── Map mediaType string to backend's numeric code ──
    const mediaTypeMap = { None: 0, Image: 1, Video: 2, File: 3 };
    const mediaTypeNum = mediaTypeMap[mediaType] ?? 0;

    // ── Pick the single media file to send ──
    let mediaUriToSend = null;
    let mediaNameToSend = 'media';
    let mediaMimeToSend = '';

    if (mediaType === 'Image' && images.length > 0) {
      mediaUriToSend = images[0];
      mediaNameToSend = 'image.jpg';
      mediaMimeToSend = 'image/jpeg';
    } else if (mediaType === 'Video' && video) {
      mediaUriToSend = Platform.OS === 'web' && videoOriginalUriRef.current
        ? videoOriginalUriRef.current
        : video;
      mediaNameToSend = 'video.mp4';
      mediaMimeToSend = 'video/mp4';
    } else if (mediaType === 'File' && attachment) {
      mediaUriToSend = attachment.uri;
      mediaNameToSend = attachment.name || 'attachment';
      mediaMimeToSend = attachment.mimeType || '';
    }

    console.log("video:", video);
console.log("videoOriginalUriRef:", videoOriginalUriRef.current);
console.log("mediaUriToSend:", mediaUriToSend);
console.log("Platform:", Platform.OS);
    // ── Call the real backend API (create vs update depending on mode) ──
    const apiPayload = {
      type: postType,
      title: titlePlain,

      description: descriptionPlain,
      reportType: reportType,
      mediaType: mediaTypeNum,
      mediaUri: mediaUriToSend,
      mediaName: mediaNameToSend,
      mediaMime: mediaMimeToSend,
      extraImages: mediaType === 'Image' ? images.slice(1) : [],
    };

    const apiResult = isEditMode
      ? await AuthAPI.updateNews(editItem.id, apiPayload)
      : await AuthAPI.createNews(apiPayload);

    if (!apiResult.ok) {
      setSaving(false);
      // Sirf CREATE par, sirf code === 'NEWS_LIMIT_REACHED' — generic toast nahi, popup.
      if (!isEditMode && apiResult.limitReached) {
        setLimitModal({ visible: true, message: apiResult.message });
        return;
      }
      showToast(apiResult.message || `Failed to ${isEditMode ? 'update' : 'submit'} news to server.`, 'error');
      return;
    }

    // ✅ Create success: free_posts_remaining (free user) / remaining_credits (subscriber) — dono null-safe.
    // remaining_credits is screen par dikhte nahi, isliye sirf free count hint update hota hai.
    if (!isEditMode) {
      const nextFree = apiResult.freePostsRemaining; // number | null
      setFreePostsLeft(nextFree);
      UserStore.setNewsFreePostsRemaining(nextFree);
    }

    // ✅ EDIT MODE ends here — backend already has the updated record,
    // no need to duplicate it into the local news array like a fresh create.
    if (isEditMode) {
      setSaving(false);
      showToast('News updated successfully!', 'success');
      setTimeout(() => navigation.goBack(), 500);
      return;
    }


    const backendNewsId = apiResult?.news?.id ?? apiResult?.data?.id ?? apiResult?.data?.news?.id;
if (!backendNewsId) {
  setSaving(false);
  showToast('News created but ID missing from server response.', 'error');
  return;
}


 
 
    // ✅ FIX: backend already uploaded the media and returned a real, shareable URL.
    // Use that instead of a browser/device-local reference (idb-media:/file://)
    // which only works on the device that created the post.
    const backendNewsRecord = apiResult?.news || apiResult?.data?.news || apiResult?.data || {};
    console.log('[AddNews] backendNewsRecord (check field name here):', backendNewsRecord);

    const backendMediaUrl = String(
      backendNewsRecord.media_url || backendNewsRecord.media || backendNewsRecord.image_url ||
      backendNewsRecord.image || backendNewsRecord.file_url || backendNewsRecord.path || ''
    ).trim();

    const savedImages = mediaType === 'Image'
      ? await Promise.all(
        (Array.isArray(images) ? images : []).map((uri, idx) => (
          // Sirf pehli image hi backend ko bheji gayi thi (mediaUriToSend = images[0]),
          // isliye sirf usi ke liye real server URL milega. Baaki images abhi bhi
          // local-only rahengi jab tak backend multi-image upload support na kare.
          idx === 0 && backendMediaUrl
            ? backendMediaUrl
            : (Platform.OS === 'web'
                ? storeWebUriToIdbMedia(uri, { prefix: 'image', mimeType: 'image/jpeg' })
                : persistToUploadsDir({ uri, subdir: 'images', fallbackExt: 'jpg' }))
        ))
      )
      : [];

    const savedVideo = mediaType === 'Video' && video
      ? (backendMediaUrl || (
        Platform.OS === 'web'
          ? await storeWebUriToIdbMedia(video, { prefix: 'video', mimeType: 'video/mp4' })
          : await persistToUploadsDir({ uri: video, subdir: 'videos', fallbackExt: 'mp4' })
      ))
      : null;

    const savedVideoThumb = mediaType === 'Video' && videoThumb
      ? (
        Platform.OS === 'web'
          ? await storeWebUriToIdbMedia(videoThumb, { prefix: 'image', mimeType: 'image/jpeg' })
          : await persistToUploadsDir({ uri: videoThumb, subdir: 'images', fallbackExt: 'jpg' })
      )
      : '';

    const newsItem = {
      id: String(backendNewsId), 
      type: postType,
      title: titlePlain,

      title_html: titleHtml,

      description: descriptionPlain,
      description_html: descriptionHtml,
      mediaType,
      images: savedImages,
      video: savedVideo,
      image: mediaType === 'Video' ? savedVideoThumb :
             mediaType === 'Image' && savedImages.length > 0 ? savedImages[0] : '',
      thumbnail: mediaType === 'Video' ? savedVideoThumb :
             mediaType === 'Image' && savedImages.length > 0 ? savedImages[0] : '',
      file: mediaType === 'File' ? attachment : null,
      report_type: reportType,
      role_type: roleType,
      category: reportType || stateValue || 'General',
      language: String(language || '').trim().toLowerCase(),
      state: stateValue,
      district: isSubscribedUser ? locationDistrict : '',
      taluka: isSubscribedUser ? locationTaluka : '',
      status: user.role === 'admin' ? 'approved' : 'pending',
      createdBy: user.email,
      author_name: user.name || 'User',
            author_profile_image: isRemoteImageUrl(user.profile_image) ? user.profile_image : '',
      author_has_blue_tick: UserStore.hasBlueTick(user),
      author_is_premium: UserStore.hasPremiumAccess(user),
      author_is_subscriber: UserStore.hasActiveSubscription(user),
      author_role: user.role || 'free',
      author_role_label: user.role_label || '',
      author_seat_id: user.state_seat?.seat_id || '',
      author_seat_name: user.state_seat?.seat_name || '',
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-IN'),
      views: 0,
      shares: 0,
      likes: 0,
      comments: 0,
      liked_by: [],
    };

    const allNews = [...(user.news || []), newsItem];
    const updated = await UserStore.updateUser(user.email, { news: allNews });
    setSaving(false);

    if (!updated) {
      showToast('Failed to save. Try again.', 'error');
      return;
    }

    await AsyncStorage.removeItem(`${NEWS_DRAFT_PREFIX}${String(user.email || '').toLowerCase()}`);

    showToast(
      user.role === 'admin'
        ? 'News published successfully!'
        : 'Submitted! Waiting for admin approval.',
      'success'
    );

    setTitle('');
    setSubtitle('');
    setDescriptionText('');
    setReportType('');
    setRoleType('');
    setMediaType('None');
    setImages([]);
    setVideo(null);
    setVideoThumb(null);
    setAttachment(null);
    setSelectedState('');
    titleHtmlRef.current = '';
    subtitleHtmlRef.current = '';
    descriptionHtmlRef.current = '';
    titleEditorRef.current?.setContentHTML('');
    subtitleEditorRef.current?.setContentHTML('');
    descriptionEditorRef.current?.setContentHTML('');

    setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'News Feed' }],
        })
      );
    }, 800);
  };

  const closeLimitModal = () => setLimitModal((prev) => ({ ...prev, visible: false }));
  const handleBuyRoleSubscription = () => {
    closeLimitModal();
    // Form draft already save hota hai, isliye kharidne ke baad data nahi jayega.
    // returnTo => payment verify ke baad user wapas Add News par aata hai.
    navigation.navigate('Subscription Plans', { returnTo: 'Add News' });
  };

  const freePostsHint = !isEditMode && !isAdmin && freePostsLeft !== null
    ? (freePostsLeft > 0
        ? `${freePostsLeft} free post${freePostsLeft === 1 ? '' : 's'} left`
        : 'No free posts left')
    : null;

  const submitLabel = saving
    ? (isEditMode ? 'Updating...' : 'Posting...')
    : isEditMode ? 'Update' : isAdmin ? 'Publish News' : 'Post';

  // Pick the style-sheet (web vs mobile) — content/structure below is shared.
  const T = isWeb ? ws : s;

  // ── Post type (News / Feed) ──────────────────────────────────────────────────
  const handlePostTypeChange = (next) => {
    if (next === postType) return;
    setPostType(next);
    // Feed = video ya images. Media reset taaki purani image/file na jaye.
    setImages([]); setVideo(null); setVideoThumb(null); setAttachment(null);
    setMediaType(next === 2 ? 'Video' : 'None');
  };
  const postTypeSelector = (
    <View style={T.chipsRow}>
      {[{ v: 1, label: 'News', icon: 'file-text' }, { v: 2, label: 'Feed (Reel)', icon: 'film' }].map(({ v, label, icon }) => {
        const sel = postType === v;
        return (
          <TouchableOpacity key={v} onPress={() => handlePostTypeChange(v)} activeOpacity={0.85}>
            {sel ? (
              <LinearGradient colors={C.gradientRed} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={T.chip}>
                <Feather name={icon} size={13} color={C.white} />
                <Text style={[T.chipText, T.chipTextOn]}>{label}</Text>
              </LinearGradient>
            ) : (
              <View style={T.chip}>
                <Feather name={icon} size={13} color={C.textSub} />
                <Text style={T.chipText}>{label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Media type chips (shared) ────────────────────────────────────────────────
  const mediaTypeChips = (
    <View style={T.chipsRow}>
      {(postType === 2 ? ['Video', 'Image'] : MEDIA_TYPES).map((type) => {
        const sel = mediaType === type;
        const iconName = type === 'Image' ? 'image' : type === 'Video' ? 'video' : type === 'File' ? 'paperclip' : 'slash';
        return (
          <TouchableOpacity
            key={type}
            onPress={() => { setMediaType(type); setImages([]); setVideo(null); setAttachment(null); }}
            activeOpacity={0.85}
          >
            {sel ? (
              <LinearGradient colors={C.gradientRed} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={T.chip}>
                <Feather name={iconName} size={13} color={C.white} />
                <Text style={[T.chipText, T.chipTextOn]}>{type}</Text>
              </LinearGradient>
            ) : (
              <View style={T.chip}>
                <Feather name={iconName} size={13} color={C.textSub} />
                <Text style={T.chipText}>{type}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
  const imageUploadBlock = mediaType === 'Image' ? (
    <View style={T.mediaBlock}>
      <Text style={T.subLabel}>Upload one or more images (max 5, 10MB each).</Text>
      {images.length > 0 ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {images.map((img, idx) => (
              <View key={idx} style={T.thumbContainer}>
                <Image source={{ uri: img }} style={T.thumb} />
                <TouchableOpacity style={T.thumbRemoveBtn} onPress={() => removeImage(idx)}>
                  <Feather name="x" size={10} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={T.addMoreBtn} onPress={pickImages} activeOpacity={0.85}>
            <Ionicons name="add" size={15} color={C.primary} />
            <Text style={T.addMoreBtnText}>Add More Images</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={T.uploadOuter} onPress={pickImages} activeOpacity={0.85}>
          <View style={T.uploadInnerDashed}>
            <Feather name="image" size={36} color={C.primary} />
            <Text style={T.uploadCaption}>Add news photos (jpeg/png)</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  const videoUploadBlock = mediaType === 'Video' ? (
    <View style={T.mediaBlock}>
      <Text style={T.subLabel}>Upload one video (15s to 1 minute, max 50MB).</Text>
      {video ? (
        <View style={T.videoPreviewWrap}>
          <VideoPreview uri={video} style={T.videoPreview} contentFit="cover" />
          <TouchableOpacity style={T.changeOverlay} onPress={pickVideo}>
            <Feather name="repeat" size={12} color="#fff" />
            <Text style={T.changeOverlayText}>Change Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={T.videoRemoveBtn} onPress={() => setVideo(null)}>
            <Feather name="x" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={T.uploadOuter} onPress={pickVideo} activeOpacity={0.85}>
          <View style={T.uploadInnerDashed}>
            <Feather name="video" size={36} color={C.primary} />
            <Text style={T.uploadCaption}>Add a news video (mp4)</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  const fileUploadBlock = mediaType === 'File' ? (
    <View style={T.mediaBlock}>
      <Text style={T.subLabel}>Attach a supporting file (PDF, DOC, etc.).</Text>
      {attachment ? (
        <View style={T.fileInfoRow}>
          <Feather name="file-text" size={14} color={C.primary} />
          <Text style={T.fileInfoText} numberOfLines={1}>{attachment.name || 'attachment'}</Text>
          <TouchableOpacity style={T.fileRemoveBtn} onPress={() => setAttachment(null)}>
            <Feather name="x" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={T.uploadOuter} onPress={pickFile} activeOpacity={0.85}>
          <View style={T.uploadInnerDashed}>
            <Feather name="paperclip" size={36} color={C.primary} />
            <Text style={T.uploadCaption}>Add a supporting file</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  // ── WEB LAYOUT ─────────────────────────────────────────────────────────────────
  if (isWeb) {
    return (
      <View style={ws.root}>
                {/* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */}
                <ModuleWebHeader
                  title={isEditMode ? 'Edit news article' : 'Add news article'}
                  navigation={navigation}
                  onBack={() => navigation.goBack()}
                />

        <ScrollView style={ws.scroll} contentContainerStyle={ws.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
          <View style={ws.innerWrap}>

            {/* 0. Post type */}
            <View style={ws.section}>
              <SectionLabel title="Post As" />
              {postTypeSelector}
            </View>

            {/* 1. Title */}
            <View style={ws.section}>
              <SectionLabel number="1" title="Write News Title" />
              <TextInput
                style={ws.input}
                placeholder="Enter news title..."
                placeholderTextColor={C.neutral400}
                value={title}
                onChangeText={(text) => { setTitle(text); titleHtmlRef.current = plainToHtml(text); }}
                multiline
              />
            </View>

            {/* 2. Subtitle
            <View style={ws.section}>
              <SectionLabel number="2" title="Write Sub Title" optional />
              <Text style={ws.subLabel}>A short one-line summary below the headline.</Text>
              <TextInput
                style={ws.input}
                placeholder="Enter subtitle (optional)..."
                placeholderTextColor={C.neutral400}
                value={subtitle}
                onChangeText={(text) => { setSubtitle(text); subtitleHtmlRef.current = plainToHtml(text); }}
                multiline
              />
            </View> */}

            {/* 3. Description */}
            <View style={ws.section}>
              <SectionLabel number="3" title="Write Description For News" />
              <Text style={ws.subLabel}>Write the full report here. Be clear, concise and factual.</Text>
              <TextInput
                style={ws.inputMulti}
                placeholder="Enter description..."
                placeholderTextColor={C.neutral400}
                value={descriptionText}
                onChangeText={(text) => { setDescriptionText(text); descriptionHtmlRef.current = plainToHtml(text); }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* 4. Report Type */}
            <View style={ws.section}>
              <SectionLabel number="4" title="Select Report Type" />
                          <TouchableOpacity style={ws.select} onPress={() => setReportPickerVisible(true)}>
                <Feather name="tag" size={14} color={C.textSub} />
                <Text style={[ws.selectText, !reportType && ws.selectPlaceholder]}>
                  {reportType || 'Select report type...'}
                </Text>
                <Feather name="chevron-down" size={14} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {/* 5. Media Type */}
            <View style={ws.section}>
              <SectionLabel number="5" title="Select Media Type" optional />
              {mediaTypeChips}
              {imageUploadBlock}
              {videoUploadBlock}
              {fileUploadBlock}
            </View>

            {freePostsHint ? <Text style={s.freeHint}>{freePostsHint}</Text> : null}
            <View style={ws.footerRow}>
              <TouchableOpacity style={ws.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Text style={ws.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
                          <TouchableOpacity
                style={[ws.submitBtnWrap, saving && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient colors={C.gradientRed} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ws.submitBtn}>
                  <Feather name="send" size={15} color="#fff" />
                  <Text style={ws.submitBtnText}>{submitLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <ListPickerModal
          visible={reportPickerVisible}
          title="Select Report Type"
          options={REPORT_TYPES}
          selected={reportType}
          onSelect={setReportType}
          onClose={() => setReportPickerVisible(false)}
        />
        <NewsLimitModal
          visible={limitModal.visible}
          message={limitModal.message}
          onBuy={handleBuyRoleSubscription}
          onCancel={closeLimitModal}
        />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  return (
      <View style={{ flex: 1 }}>
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <ImageBackground
        source={require('../assets/images/profile-red.png')}
        resizeMode="cover"
        style={[s.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backRow} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>{isEditMode ? 'Edit News' : 'Add News'}</Text>
          <Text style={s.headerSubtitle}>Share your report with everyone</Text>
        </View>
      </ImageBackground>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* 0. Post type */}
          <View style={s.section}>
            <SectionLabel title="Post As" />
            {postTypeSelector}
          </View>

          {/* 1. Title */}
          <View style={s.section}>
            <View style={s.fieldHeaderRow}>
              <SectionLabel number="1" title="Write News Title" />
              {title.length > 40 ? (
                <TouchableOpacity onPress={() => setTitleExpanded((prev) => !prev)}>
                  <Text style={s.moreToggleText}>{titleExpanded ? 'Less' : 'More'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
                            {editorReady ? (
              <View style={s.editorBox}>
                {Platform.OS === 'web' ? (
                  <WebRichEditor
                    ref={titleEditorRef}
                    style={[s.richEditor, titleExpanded && s.richEditorExpanded]}
                    placeholder="Enter news title..."
                    onChange={(html) => { titleHtmlRef.current = html; setTitle(htmlToPlain(html)); }}
                  />
                ) : (
                  <RichEditor
                    ref={titleEditorRef}
                    style={[s.richEditor, titleExpanded && s.richEditorExpanded]}
                    placeholder="Enter news title..."
                    initialContentHTML=""
                    onChange={(html) => { titleHtmlRef.current = html; setTitle(htmlToPlain(html)); }}
                    editorStyle={s.richEditorInner}
                    useContainer={false}
                  />
                )}
              </View>
            ) : null}
          </View>

          {/* 2. Subtitle
          <View style={s.section}>
            <View style={s.fieldHeaderRow}>
              <SectionLabel number="2" title="Write Sub Title" optional />
              {subtitle.length > 60 ? (
                <TouchableOpacity onPress={() => setSubtitleExpanded((prev) => !prev)}>
                  <Text style={s.moreToggleText}>{subtitleExpanded ? 'Less' : 'More'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={s.subLabel}>Optional short subtitle.</Text>
                             {editorReady ? (
              <View style={s.editorBox}>
                {Platform.OS === 'web' ? (
                  <WebRichEditor
                    ref={subtitleEditorRef}
                    style={[s.richEditor, subtitleExpanded && s.richEditorExpanded]}
                    placeholder="Enter subtitle (optional)..."
                    onChange={(html) => { subtitleHtmlRef.current = html; setSubtitle(htmlToPlain(html)); }}
                  />
                ) : (
                  <RichEditor
                    ref={subtitleEditorRef}
                    style={[s.richEditor, subtitleExpanded && s.richEditorExpanded]}
                    placeholder="Enter subtitle (optional)..."
                    initialContentHTML=""
                    onChange={(html) => { subtitleHtmlRef.current = html; setSubtitle(htmlToPlain(html)); }}
                    editorStyle={s.richEditorInner}
                    useContainer={false}
                  />
                )}
              </View>
            ) : null}
          </View> */}

          {/* 3. Description */}
          <View style={s.section}>
<SectionLabel number="2" title="Write Description For News" />
            <Text style={s.subLabel}>Write the full report description.</Text>
                              {editorReady ? (
              <View style={s.editorBox}>
                {Platform.OS === 'web' ? (
                  <WebRichEditor
                    ref={descriptionEditorRef}
                    style={[s.richEditor, { minHeight: 140 }]}
                    placeholder="Enter description..."
                    onChange={(html) => {
                      descriptionHtmlRef.current = html;
                      setDescriptionText(decodeHtmlEntities(htmlToPlain(html)));
                    }}
                  />
                ) : (
                  <RichEditor
                    ref={descriptionEditorRef}
                    style={[s.richEditor, { minHeight: 140 }]}
                    placeholder="Enter description..."
                    initialContentHTML=""
                    onChange={(html) => {
                      descriptionHtmlRef.current = html;
                      setDescriptionText(decodeHtmlEntities(htmlToPlain(html)));
                    }}
                    editorStyle={s.richEditorInner}
                    useContainer={false}
                  />
                )}
              </View>
            ) : null}
          </View>

          {/* 4. Report Type */}
          <View style={s.section}>
            <SectionLabel number="4" title="Select Report Type" />
                        <TouchableOpacity style={s.select} onPress={() => setReportPickerVisible(true)}>
              <Feather name="tag" size={16} color={C.textSub} />
              <Text style={[s.selectText, !reportType && s.selectPlaceholder]}>
                {reportType || 'Select report type...'}
              </Text>
              <Feather name="chevron-down" size={16} color={C.textSub} />
            </TouchableOpacity>
          </View>

          {/* 5. Media Type */}
          <View style={s.section}>
            <SectionLabel number="5" title="Select Media Type" optional />
            {mediaTypeChips}
            {imageUploadBlock}
            {videoUploadBlock}
            {fileUploadBlock}
          </View>

          {freePostsHint ? <Text style={s.freeHint}>{freePostsHint}</Text> : null}
                  <TouchableOpacity
            style={saving && { opacity: 0.7 }}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient colors={C.gradientRed} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitBtn}>
              <Feather name="send" size={16} color="#fff" />
              <Text style={s.submitBtnText}>{submitLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ListPickerModal
        visible={reportPickerVisible}
        title="Select Report Type"
        options={REPORT_TYPES}
        selected={reportType}
        onSelect={setReportType}
        onClose={() => setReportPickerVisible(false)}
      />
      <NewsLimitModal
        visible={limitModal.visible}
        message={limitModal.message}
        onBuy={handleBuyRoleSubscription}
        onCancel={closeLimitModal}
      />
     </View>
    </View>
  );
}

// ── Shared style pieces reused by mobile (s) + web (ws) ─────────────────────────
const sharedField = {
  subLabel: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, marginTop: -6, marginBottom: 10 },

   select: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: C.fieldBorder, borderRadius: 8,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 13,
  },
  selectText: { flex: 1, fontSize: 13, fontFamily: FONT.medium, color: C.textBody },
  selectPlaceholder: { color: C.neutral400, fontFamily: FONT.regular },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.neutral400, backgroundColor: C.white,
  },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 12, fontFamily: FONT.medium, color: C.textSub },
  chipTextOn: { color: C.white, fontFamily: FONT.bold },

  mediaBlock: { marginTop: 12 },

   uploadOuter: {
    width: '100%', minHeight: 140,
    backgroundColor: C.uploadBg, borderWidth: 1, borderColor: C.fieldBorder,
    borderRadius: 8, overflow: 'hidden', padding: 10,
  },
  uploadInnerDashed: {
    flex: 1, minHeight: 120,
    borderWidth: 1, borderStyle: 'dashed', borderColor: C.dashedBorder, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20,
  },
  uploadCaption: { fontSize: 12, fontFamily: FONT.regular, color: C.textBody, textAlign: 'center', paddingHorizontal: 16 },

  thumbContainer: { marginRight: 10, position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: 8, borderWidth: 1, borderColor: C.headerBorder },
  thumbRemoveBtn: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: C.primary, borderRadius: 100,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start', backgroundColor: C.uploadBg,
  },
  addMoreBtnText: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },

  videoPreviewWrap: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  videoPreview: { width: '100%', height: 190, borderRadius: 8 },
  changeOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,
  },
  changeOverlayText: { color: '#fff', fontSize: 11, fontFamily: FONT.medium },
  videoRemoveBtn: {
    position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },

  fileInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 12,
  },
  fileInfoText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: C.textBody },
  fileRemoveBtn: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.danger,
    alignItems: 'center', justifyContent: 'center',
  },

  lockCard: { borderWidth: 1, borderColor: C.fieldBorder, borderRadius: 8, backgroundColor: C.white, padding: 12 },
  lockHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  lockTitle: { fontSize: 13, fontFamily: FONT.bold, color: C.textBody },
  lockSubtitle: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, marginTop: 2 },
   lockBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  lockBadgeText: { fontSize: 9, fontFamily: FONT.bold, color: '#fff', letterSpacing: 0.5 },
  lockText: { fontSize: 12, fontFamily: FONT.medium, color: C.textBody, marginTop: 10 },

   submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 100, paddingVertical: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
};

// ── Mobile Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  freeHint: { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, textAlign: 'center', marginBottom: 8 },
  ...sharedField,

  root: { flex: 1, backgroundColor: C.white },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backRow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginLeft: -6 },
  headerTitle: { flex: 1, fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
  headerSubtitle: { fontSize: 11, color: '#ffffff', marginTop: 1, fontFamily: FONT.regular },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  section: { marginBottom: 20 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moreToggleText: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },

    editorBox: { borderWidth: 1, borderColor: C.fieldBorder, borderRadius: 8, overflow: 'hidden', backgroundColor: C.white },
  richToolbar: { backgroundColor: C.white, height: 42, borderBottomWidth: 1, borderBottomColor: C.fieldBorder },
   editorBox: { borderWidth: 1, borderColor: C.fieldBorder, borderRadius: 8, overflow: 'hidden', backgroundColor: C.white },
   richEditor: { minHeight: 60, backgroundColor: C.white },
  richEditorExpanded: { minHeight: 140 },
  richEditorInner: { backgroundColor: C.white, color: C.textBody, placeholderColor: C.neutral400, contentCSSText: 'font-size: 13px; font-family: sans-serif; padding: 10px;' },
});

// ── Web Styles ─────────────────────────────────────────────────────────────────
const ws = StyleSheet.create({
  ...sharedField,

  root: { flex: 1, backgroundColor: C.bg, minHeight: '100vh' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  topBarCompact: { paddingHorizontal: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontFamily: FONT.bold, color: C.textMain },
  topBarTitleCompact: { flexShrink: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60, alignItems: 'center' },
  innerWrap: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 16 },

  section: { marginBottom: 22 },
  input: {
    minHeight: 48, borderWidth: 1, borderColor: C.fieldBorder, borderRadius: 8,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 14, fontSize: 13, color: C.textBody,
  },
  inputMulti: {
    minHeight: 140, borderWidth: 1, borderColor: C.fieldBorder, borderRadius: 8,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 14, fontSize: 13, color: C.textBody,
  },

  footerRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: 10, marginBottom: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: 100, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: C.primary, fontFamily: FONT.bold, fontSize: 14 },
  // ✅ Web par footerRow ke andar is TouchableOpacity ko flex:1 na hone ki wajah se ye
  // Cancel button jitni width nahi le raha tha (sirf apne content jitna simat gaya tha).
  // flex:1 ab ISI wrapper par hai — LinearGradient andar-se-andar khud stretch ho jaata hai.
  submitBtnWrap: { flex: 1 },
  submitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 100, paddingVertical: 13,
  },
});