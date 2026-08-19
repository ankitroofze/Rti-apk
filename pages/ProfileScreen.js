import { Feather, MaterialIcons } from '@expo/vector-icons';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Clipboard,
  Image,
  Platform,
  Modal,
  Pressable,
  Share,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AutoAppointmentLetterPreview from '../components/AppointmentLetterPreview';
import AppNavbar from '../components/AppNavbar';
import AutoIdCardPreview from '../components/IdCardPreview';
import VerifiedBadge from '../components/VerifiedBadge';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import ProfileStyles from '../styles/ProfileStyles';
import { RankBadge, ReferralCodeCard, SavedProfileCard, ProfileCompletionRow, ReferralRow, RankRow } from '../components/ProfileComponents';
import { initialForm, MAX_IMAGE_SIZE, DEFAULT_AVATAR } from '../constants/profileConstants';
import { getResponsiveWindowWidth } from '../utils/webDevice';
import {
  getRank,
  generateReferralCode,
  generateMemberId,
  hasDocumentSource,
  safeName,
} from '../utils/profileHelpers';
import { compressImageToBase64 } from '../utils/imageHandling';
import { buildIdCardHtml, buildAppointmentLetterHtml } from '../utils/documentGenerator';

// ── Web-only inline styles (Instagram desktop style) ─────────────────────────
const WEB_COL = 935;
const ORANGE = '#F97316';

const w = {
  root:        { flex: 1, backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 13, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#dbdbdb' },
  topBarNarrow: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  topLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topLeftNarrow: { flexWrap: 'wrap', gap: 12 },
  topRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topRightNarrow: { flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%', gap: 8 },
  backBtn:     { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  iconBtn:     { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  scroll:      { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 60 },
  col:         { width: WEB_COL, maxWidth: '100%', paddingHorizontal: 20 },

  // Profile header row
  profileRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 44, paddingBottom: 28, gap: 80 },
  profileRowNarrow: { flexDirection: 'column', alignItems: 'center', gap: 24 },
  avatarWrap:  { width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: ORANGE, flexShrink: 0, overflow: 'hidden', backgroundColor: '#FFF7ED' },
  avatarWrapNarrow: { alignSelf: 'center' },
  avatar:      { width: '100%', height: '100%' },
  profileInfo: { flex: 1, paddingTop: 8 },
  profileInfoNarrow: { width: '100%' },

  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  name:        { fontSize: 26, fontWeight: '300', color: '#0f172a', letterSpacing: -0.3, fontFamily: 'Roboto, sans-serif' },

  editBtn:     { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 3, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbdbdb' },
  editBtnText: { fontSize: 14, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  
  // ✨ Orange with Glossy Shine Effect
  postBtn:     { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, backgroundColor: ORANGE, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  postBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, fontFamily: 'Roboto, sans-serif' },
  moreBtn:     { padding: 4 },

  statsRow:    { flexDirection: 'row', gap: 44, marginBottom: 18 },
  statsRowNarrow: { flexWrap: 'wrap', gap: 20, justifyContent: 'space-between' },
  statItem:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statNum:     { fontSize: 16, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  statLabel:   { fontSize: 16, color: '#0f172a', fontFamily: 'Roboto, sans-serif' },

  bioSection:  { gap: 5 },
  bioName:     { fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  bioText:     { fontSize: 14, color: '#0f172a', lineHeight: 20, fontFamily: 'Roboto, sans-serif' },
  bioMeta:     { fontSize: 14, color: '#737373', fontFamily: 'Roboto, sans-serif' },
  rankRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rankText:    { fontSize: 14, fontWeight: '600', fontFamily: 'Roboto, sans-serif' },

  divider:     { height: 1, backgroundColor: '#dbdbdb', marginTop: 8 },

  // Info cards below divider
  cardsRow:    { paddingTop: 28, gap: 16 },
  cardsRowNarrow: { flexDirection: 'column' },

  // Combined stats row (Profile Completion, Referral, Rank in one line)
  combinedStatsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#ffffff', 
    borderRadius: 6, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
  },
  combinedStatsItem: { flex: 1, alignItems: 'center' },
  combinedStatsDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
  combinedStatsLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', marginBottom: 4, textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  combinedStatsValue: { fontSize: 18, fontWeight: '700', color: '#0f172a', textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  combinedStatsSub: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  referralCodeCompact: { fontSize: 14, fontWeight: '800', color: ORANGE, textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  copyBtnCompact: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#f1f5f9', borderRadius: 3 },
  copyBtnTextCompact: { fontSize: 10, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },

  // Progress card (keep for backward compatibility but hide if needed)
  progressCard: { backgroundColor: '#ffffff', borderRadius: 6, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  progressLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 4, fontFamily: 'Roboto, sans-serif' },
  progressVal:   { fontSize: 24, fontWeight: '800', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  memberIdLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 4, textAlign: 'right', fontFamily: 'Roboto, sans-serif' },
  memberIdVal:   { fontSize: 15, fontWeight: '800', color: ORANGE, textAlign: 'right', fontFamily: 'Roboto, sans-serif' },
  progressTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#0f172a', borderRadius: 3 },

  // Two-col layout for cards
  twoCol:      { flexDirection: 'row', gap: 16 },
  twoColNarrow: { flexDirection: 'column' },
  halfCard:    { flex: 1, backgroundColor: '#ffffff', borderRadius: 6, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  fullCard:    { backgroundColor: '#ffffff', borderRadius: 6, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  fullCardWithHeader: { backgroundColor: '#ffffff', borderRadius: 6, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' },
  
  // Edit button inside profile details card
  editInsideBtn: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbdbdb', zIndex: 10 },
  editInsideBtnText: { fontSize: 12, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12, fontFamily: 'Roboto, sans-serif' },

  // Guest
  guestCard:   { backgroundColor: '#ffffff', borderRadius: 6, padding: 40, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 28 },
  guestTitle:  { fontSize: 22, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  guestText:   { fontSize: 14, color: '#64748b', textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  
  // ✨ Glossy Login Button
  loginBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ORANGE, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 6, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, marginTop: 8 },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, fontFamily: 'Roboto, sans-serif' },
  
  // Post card styles
  postCard: { backgroundColor: '#ffffff', borderRadius: 6, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#f1f5f9' },
  postAuthor: { fontWeight: '700', color: '#0f172a', fontSize: 14, fontFamily: 'Roboto, sans-serif' },
  postTime: { fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'Roboto, sans-serif' },
  postContent: { fontSize: 14, color: '#0f172a', lineHeight: 20, marginBottom: 12, fontFamily: 'Roboto, sans-serif' },
  postImage: { width: '100%', height: 200, borderRadius: 6, marginBottom: 12, backgroundColor: '#f1f5f9' },
  postActions: { flexDirection: 'row', gap: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postActionText: { fontSize: 13, color: '#64748b', fontFamily: 'Roboto, sans-serif' },
  
  // Post view mode controls and grid styles
  postViewToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  postViewBtn: { width: 42, height: 42, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  
  // ✨ Glossy Active View Button
  postViewBtnActive: { backgroundColor: ORANGE, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  postGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  postGridItem: { width: 'calc(33.333% - 2px)', aspectRatio: 1, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  postGridThumb: { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#f1f5f9' },
  postGridImage: { width: '100%', height: '100%' },
  
  // Toggle buttons
  toggleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 6, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 3, alignItems: 'center' },
  
  // ✨ Glossy Active Segment Toggle Button
  toggleBtnActive: { backgroundColor: ORANGE, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  toggleBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b', fontFamily: 'Roboto, sans-serif' },
  toggleBtnTextActive: { color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  // Edit form container with margin top
  editFormContainer: { marginTop: 20 },
  editTopCancel: { marginBottom: 12, alignSelf: 'flex-start' },
  editTopCancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 3, backgroundColor: '#f1f5f9' },
  editTopCancelText: { fontSize: 14, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },

  // SavedProfileCard style override - same as Shuru website style
  savedProfileCard: {
    container: { backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
    body: { padding: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    rowLast: { borderBottomWidth: 0 },
    label: { fontSize: 13, color: '#64748b', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
    value: { fontSize: 13, color: '#0f172a', fontWeight: '600', fontFamily: 'Roboto, sans-serif' },
    valueLink: { fontSize: 13, color: ORANGE, fontWeight: '600', fontFamily: 'Roboto, sans-serif' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 3, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    
    // ✨ Glossy Primary Action Button
    actionBtnPrimary: { backgroundColor: ORANGE, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
    actionBtnText: { fontSize: 12, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
    actionBtnTextPrimary: { color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#f0fdf4' },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#16a34a', fontFamily: 'Roboto, sans-serif' },
    idRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
    idItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f8fafc', borderRadius: 3, borderWidth: 1, borderColor: '#e2e8f0' },
    idItemText: { fontSize: 12, color: '#0f172a', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  },
};

// Reusable SavedProfileCard component for both web and mobile
function SavedProfileCardComponent({ profile, onOpenIdCard, onOpenAppointmentLetter, onDownloadIdCard, onDownloadAppointmentLetter, isMobile }) {
  const getStatusLabel = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved' || s === 'active') return { label: 'Active', color: '#16a34a', bg: '#f0fdf4' };
    if (s === 'pending') return { label: 'Pending', color: '#d97706', bg: '#fffbeb' };
    if (s === 'rejected') return { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' };
    return { label: 'Not Applied', color: '#64748b', bg: '#f1f5f9' };
  };

  const idStatus = getStatusLabel(profile.id_card_status);
  const appointmentStatus = getStatusLabel(profile.appointment_letter_status);
  const isSubscribed = Boolean(profile.is_subscribed);
  const hasBlueTick = Boolean(profile.has_blue_tick);
  const subscriptionType = profile.subscription_type || profile.role_label || 'Free';
  // ✅ Sirf Pratinidhi subscription (role_id: 6) waalon ko hi
  // Appointment Letter / ID Card dikhega, baaki roles ko nahi.
  const isPratinidhi = String(profile.state_seat?.seat_id || '').trim().toLowerCase() === 'pratinidhi';

  // If mobile, use ProfileStyles, else use web styles
  const styles = isMobile ? ProfileStyles : w.savedProfileCard;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Details</Text>
        {hasBlueTick && (
          <View style={styles.badgeContainer}>
            <Feather name="check-circle" size={14} color="#16a34a" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile.name || 'Not set'}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile.email || 'Not set'}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{profile.contact_number || 'Not set'}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{profile.state || profile.village || 'Not set'}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Bio</Text>
          <Text style={styles.value} numberOfLines={2}>{profile.bio || 'Not set'}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Subscription</Text>
          <Text style={[styles.value, { color: isSubscribed ? '#16a34a' : '#64748b' }]}>
            {isSubscribed ? `${subscriptionType} ✅` : 'Free'}
          </Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Member ID</Text>
          <Text style={[styles.value, { color: ORANGE, fontWeight: '700' }]}>
            {generateMemberId(profile.email) || 'Not set'}
          </Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Referral Code</Text>
          <Text style={[styles.value, { color: ORANGE, fontWeight: '700' }]}>
            {profile.referral_code || generateReferralCode(profile.email)}
          </Text>
        </View>

        {isPratinidhi && (
          <>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onOpenIdCard} activeOpacity={0.85}>
                <Feather name="credit-card" size={14} color="#ffffff" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>View ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onOpenAppointmentLetter} activeOpacity={0.85}>
                <Feather name="file-text" size={14} color="#ffffff" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>View Letter</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.actionRow, { marginTop: 4 }]}>
              <TouchableOpacity style={[styles.actionBtn]} onPress={onDownloadIdCard} activeOpacity={0.85}>
                <Feather name="download" size={14} color="#0f172a" />
                <Text style={styles.actionBtnText}>Download ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn]} onPress={onDownloadAppointmentLetter} activeOpacity={0.85}>
                <Feather name="download" size={14} color="#0f172a" />
                <Text style={styles.actionBtnText}>Download Letter</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  
  useEffect(() => {
    // Android hardware back button
    const backHandlerSub = Platform.OS === 'android'
      ? BackHandler.addEventListener('hardwareBackPress', () => {
          navigation.navigate('Home');
          return true; // default back action ko rok diya
        })
      : null;

    // Browser back button (web) / iOS swipe-back gesture
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      navigation.navigate('Home');
    });

    return () => {
      backHandlerSub?.remove?.();
      unsubscribeBeforeRemove();
    };
  }, [navigation]);
  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const webWidth = getResponsiveWindowWidth(windowWidth);
  const isWebNarrow = Platform.OS === 'web' && webWidth < 860;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savedProfile, setSavedProfile] = useState(initialForm);
  const [form, setForm] = useState(initialForm);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileStats, setProfileStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [followLists, setFollowLists] = useState({ followers: [], following: [] });
  const [followModalType, setFollowModalType] = useState('');
  const [documentPreviewType, setDocumentPreviewType] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [showSavedProfile, setShowSavedProfile] = useState(true);
  const [postViewMode, setPostViewMode] = useState('grid');

  const loadCurrentUser = useCallback(async () => {
    setLoading(true);
    const user = await UserStore.getCurrentUser();
    setLoading(false);

    if (!user) {
      setIsLoggedIn(false);
      setProfileStats({ posts: 0, followers: 0, following: 0 });
      setFollowLists({ followers: [], following: [] });
      setUserPosts([]);
      return;
    }

    setIsLoggedIn(true);

    const rawImage = user.profile_image || '';
    const safeImage = rawImage.startsWith('blob:') ? '' : rawImage;
    const refCode = user.my_referral_code || generateReferralCode(user.email);

    const profileData = {
      account_email: user.email || '',
      name: user.name || '',
      email: user.email || '',
      village: user.village || '',
      state: user.state || '',
      bio: user.bio || '',
      contact_number: user.contact_number || '',
      phone_number: user.phone_number || '',
      mobile_number: user.mobile_number || user.mobile || user.contact_number || '',
      subscription_type: user.subscription_type || '',
      state_seat: user.state_seat || null,
      profile_image: safeImage,
      role_label: user.role_label || UserStore.getRoleLabel(user.role || 'free'),
      is_subscribed: UserStore.hasActiveSubscription(user),
      has_blue_tick: UserStore.hasBlueTick(user),
      id_card_image: user.id_card_image || '',
      appointment_letter_image: user.appointment_letter_image || '',
      id_card_status: user.id_card_status || '',
      appointment_letter_status: user.appointment_letter_status || '',
      referral_count: user.referral_count || 0,
      referral_code: refCode,
      profile_update_request: user.profile_update_request || null,
      profile_update_requests: Array.isArray(user.profile_update_requests) ? user.profile_update_requests : [],
      notifications: Array.isArray(user.notifications) ? user.notifications : [],
    };

    if (rawImage.startsWith('blob:')) {
      await UserStore.updateUser(user.email, { profile_image: '' });
    }
// ✅ FIX: /my-role-subscriptions ab Profile "My Posts" khulte waqt yahan sync hoga
    UserStore.syncSubscriptionFromBackend().catch(() => {});
    const [feedSummary, followSummary] = await Promise.all([
      UserStore.getNewsFeedSummary?.(),
      UserStore.getFollowSummary(user.email),
    ]);
    const normalizedEmail = String(user.email || '').trim().toLowerCase();
    const ownFeedPosts = Array.isArray(feedSummary?.items)
      ? feedSummary.items.filter((item) => String(item?.createdBy || item?.created_by || '').trim().toLowerCase() === normalizedEmail)
      : [];
    const ownLocalPosts = [
      ...(Array.isArray(user.news) ? user.news : []),
      ...(Array.isArray(user.news_feed) ? user.news_feed : []),
    ];
    const allPosts = [...ownFeedPosts, ...ownLocalPosts];
const mergedPostKeys = new Set(allPosts.map((item, index) => 
  String(item?.id || `fallback-${index}`)
));
    
    const seenIds = new Set();
const userPostsData = [...ownFeedPosts, ...ownLocalPosts].filter(item => {
  const key = item?.id ? String(item.id) : null;
  if (!key) return true; // keep posts without id
  if (seenIds.has(key)) return false;
  seenIds.add(key);
  return true;
});
setUserPosts(userPostsData);

    setProfileStats({
      posts: mergedPostKeys.size,
      followers: Number(followSummary?.followersCount ?? 0),
      following: Number(followSummary?.followingCount ?? 0),
    });
    setFollowLists({
      followers: Array.isArray(followSummary?.followers) ? followSummary.followers : [],
      following: Array.isArray(followSummary?.following) ? followSummary.following : [],
    });
    setSavedProfile(profileData);
    setForm(profileData);
  }, [navigation, showToast]);

  useFocusEffect(useCallback(() => {
    loadCurrentUser();
  }, [loadCurrentUser]));

  const openEdit = () => { 
    setForm(savedProfile); 
    setIsEditing(true); 
  };
  
  const closeEdit = () => { 
    setForm(savedProfile); 
    setIsEditing(false); 
  };
  
  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const hasDocumentSubscription = Boolean((isEditing ? form : savedProfile).is_subscribed);
  const getLatestProfileRequest = (profile = {}) => {
    const requests = Array.isArray(profile.profile_update_requests) ? profile.profile_update_requests : [];
    return requests[0] || profile.profile_update_request || null;
  };
  const profileUpdateRequest = getLatestProfileRequest(savedProfile);
  const profileRequestStatus = String(profileUpdateRequest?.status || '').toLowerCase();
  const profileRequestStatusMeta = {
    pending: { label: 'Pending admin approval', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    approved: { label: 'Approved by admin', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    rejected: { label: 'Rejected by admin', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  }[profileRequestStatus] || null;

  const handleGoHome = useCallback(() => { 
    if (isEditing) {
      closeEdit();
    } else {
      navigation?.navigate?.('Home'); 
    }
  }, [navigation, isEditing]);
  const handleOpenSettings = useCallback(() => { navigation?.navigate?.('Settings'); }, [navigation]);
  const handleOpenNotifications = useCallback(() => { navigation?.navigate?.('Notifications'); }, [navigation]);

  const handleShareProfile = useCallback(async () => {
    try {
      const name = (savedProfile?.name || 'RTI News Member').trim();
      const code = savedProfile?.referral_code || generateReferralCode(savedProfile?.email || '');
      const message = `${name}\nReferral Code: ${code}\n\nRTI News App`;
      await Share.share({ title: 'RTI News', message });
    } catch {}
  }, [savedProfile]);

  const handlePostNews = useCallback(async () => {
    const user = await UserStore.getCurrentUser();
    if (!user) { navigation.replace('Login'); return; }
    const isAdmin = user.role === 'admin';
    const hasSubscription = UserStore.hasActiveSubscription(user);
    if (!isAdmin && !hasSubscription) { showToast('Premium access required to add news.', 'error'); return; }
    if (!isAdmin && hasSubscription && !user.location_complete) {
      showToast('Select your location to activate premium services.', 'error');
      navigation.navigate('StateSelect', { fromPremium: true });
      return;
    }
    navigation.navigate('Add News');
  }, [navigation, showToast]);

  const openFollowList = (type) => { if (!isLoggedIn) return; setFollowModalType(type); };
  const closeFollowList = () => setFollowModalType('');
  const closeDocumentPreview = () => setDocumentPreviewType('');

  const openDocumentPreview = (type) => {
    if (!hasDocumentSource(savedProfile)) {
      showToast('Complete profile to generate document.', 'error');
      return;
    }
    setDocumentPreviewType(type);
  };

  const promptSubscriptionRequired = useCallback((documentLabel) => {
    Alert.alert('Subscription Required', `A subscription is required to view your ${documentLabel}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Subscription', onPress: () => navigation.navigate('Subscription Plans') },
    ]);
  }, [navigation]);

  const handleCopyReferralCode = () => {
    const code = savedProfile.referral_code || generateReferralCode(savedProfile.email);
    if (Platform.OS === 'web' && navigator?.clipboard) { navigator.clipboard.writeText(code); }
    else { Clipboard.setString(code); }
    showToast('Referral code copied!', 'success');
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      if (ImagePicker.requestMediaLibraryPermissionsAsync) {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) { showToast('Gallery permission is required.', 'error'); setUploading(false); return; }
      }
      const mediaType = ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images;
      const normalizedMediaType = typeof mediaType === 'string' && mediaType.toLowerCase().includes('images') ? ImagePicker.MediaType?.Images || 'images' : mediaType;
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: normalizedMediaType || 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: false, exif: false, maxWidth: 800, maxHeight: 800 });
      if (!r.canceled && r.assets?.length) {
        const asset = r.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) { showToast('Image is too large (max 5MB).', 'error'); setUploading(false); return; }
        let uri = asset.uri || '';
        
        // ─── LOCAL PREVIEW (existing code, unchanged) ───────────────────
        if (typeof document !== 'undefined' && uri) {
          try { const dataUri = await compressImageToBase64(uri); handleChange('profile_image', dataUri); }
          catch { handleChange('profile_image', uri); }
        } else { handleChange('profile_image', uri); }
        // ────────────────────────────────────────────────────────────────

     // ─── BACKEND UPLOAD (pending-approval) ────────────────────────────
        try {
          const hasExistingImage = Boolean(savedProfile.profile_image);
          const uploadResult = hasExistingImage
            ? await AuthAPI.updateProfileImage(uri)
            : await AuthAPI.uploadProfileImage(uri);

          if (hasExistingImage) {
            // ✅ Existing image change = pending, admin approve hone tak live
            // profile_image overwrite nahi hoga — sirf pending_profile_image_url save karo.
            if (uploadResult.ok && uploadResult.pendingImageUrl) {
              await UserStore.updateUser(savedProfile.email, {
                pending_profile_image_url: uploadResult.pendingImageUrl,
              });
              showToast('Image submitted for admin approval.', 'info');
            }
          } else if (uploadResult.ok && uploadResult.imageUrl) {
            // First-time upload — koi purani image thi hi nahi, turant apply karo
            handleChange('profile_image', uploadResult.imageUrl);
            await UserStore.updateUser(savedProfile.email, { profile_image: uploadResult.imageUrl });
          }
          // Agar upload fail hua to local preview waise hi rahega (no error toast needed)
        } catch {}
        // ────────────────────────────────────────────────────────────────

        showToast('Image selected successfully.', 'success');
      }
    } catch (err) { showToast('Unable to pick image right now.', 'error'); }
    finally { setUploading(false); }
  };

  const handleDownloadDocument = async (type) => {
    const profile = isEditing ? form : savedProfile;
    if (!profile.is_subscribed) { promptSubscriptionRequired(type === 'id-card' ? 'ID Card' : 'Appointment Letter'); return; }
    if (!hasDocumentSource(profile)) { showToast('Please complete profile details first.', 'error'); return; }
    try {
      setDownloadingDoc(type);
      let printWindow = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        printWindow = window.open('', '_blank');
        if (printWindow) { try { printWindow.document.open(); printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"/><title>Generating…</title></head><body style="font-family:Arial,sans-serif;padding:18px;color:#111827;"><h3 style="margin:0 0 8px 0;">Generating…</h3><div style="color:#6b7280;">Please wait.</div></body></html>'); printWindow.document.close(); } catch (_) {} }
      }
      const html = type === 'id-card' ? await buildIdCardHtml(profile, { webPreview: Platform.OS === 'web' && Boolean(printWindow) }) : await buildAppointmentLetterHtml(profile, { webPreview: Platform.OS === 'web' && Boolean(printWindow) });
      if (Platform.OS === 'web' && printWindow) {
        printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
        try { const start = Date.now(); const timer = setInterval(() => { if (!printWindow || printWindow.closed) { clearInterval(timer); return; } const ready = Boolean(printWindow.__PDF_READY__); if (ready) { clearInterval(timer); try { printWindow.focus(); } catch (_) {} try { printWindow.print(); } catch (_) {} return; } if (Date.now() - start > 20000) { clearInterval(timer); try { printWindow.focus(); } catch (_) {} showToast('PDF tab is open. Click "Download PDF" in that tab to print/save.', 'success'); } }, 120); } catch (_) {}
        showToast("Preparing PDF... print dialog will open.", 'success'); return;
      }
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const printViaIframe = async (htmlToPrint) => { const iframe = document.createElement('iframe'); iframe.setAttribute('title', 'pdf-print'); iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;'; document.body.appendChild(iframe); const win = iframe.contentWindow; const doc = iframe.contentDocument || win?.document; if (!win || !doc) throw new Error('iframe not ready'); doc.open(); doc.write(htmlToPrint); doc.close(); const waitForImages = async (timeoutMs = 15000) => { const start = Date.now(); while (Date.now() - start < timeoutMs) { const imgs = Array.from(doc.images || []); const allOk = imgs.every((img) => img.complete && (typeof img.naturalWidth !== 'number' || img.naturalWidth > 0)); if (allOk) return; await new Promise((r) => setTimeout(r, 80)); } }; await waitForImages(); try { win.focus(); } catch (_) {} win.print(); setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 1200); };
        try { await printViaIframe(html); showToast('Print dialog opened. Choose "Save as PDF" to download.', 'success'); } catch (_) { showToast('Unable to open print dialog.', 'error'); } return;
      }
      const a4 = { width: 595, height: 842 };
      let uri = '';
      try { ({ uri } = await Print.printToFileAsync({ html, base64: false, ...a4 })); } catch (e) { try { await Print.printAsync({ html, ...a4 }); showToast('Print opened.', 'success'); return; } catch (_) { throw e; } }
      const filename = `${type === 'id-card' ? 'ID-Card' : 'Appointment-Letter'}-${safeName(profile?.name)}.pdf`;
      const saved = await trySaveAndroid(uri, filename);
      if (saved) { showToast('PDF saved successfully.', 'success'); return; }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) { await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: type === 'id-card' ? 'Save ID Card PDF' : 'Save Appointment Letter PDF', UTI: 'com.adobe.pdf' }); showToast('PDF ready!', 'success'); }
      else { showToast(`PDF saved: ${uri.split('/').pop()}`, 'success'); }
    } catch (err) { showToast('Unable to generate PDF. Please try again.', 'error'); }
    finally { setDownloadingDoc(''); }
  };

  const trySaveAndroid = async (uri, filename) => {
    try {
      if (Platform.OS !== 'android') return false;
      const FileSystem = await import('expo-file-system/legacy');
      const SAF = FileSystem.StorageAccessFramework;
      if (!SAF?.requestDirectoryPermissionsAsync || !SAF?.createFileAsync) return false;
      const permissions = await SAF.requestDirectoryPermissionsAsync();
      if (!permissions?.granted) return false;
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const dest = await SAF.createFileAsync(permissions.directoryUri, filename, 'application/pdf');
      await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
      return true;
    } catch (_) { return false; }
  };

  const handleSave = async () => {
    const nextName = String(form.name || '').trim();
    const nextEmail = String(form.email || '').trim().toLowerCase();
    const nextBio = String(form.bio || '').trim();
    const nextContactRaw = String(form.contact_number || '').trim();
    const nextContactDigits = nextContactRaw.replace(/\D/g, '');

    if (!nextName) { showToast('Name is required.', 'error'); return; }
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) { showToast('Enter a valid email address.', 'error'); return; }
    if (nextContactDigits && nextContactDigits.length !== 10) { showToast('Enter a valid 10-digit mobile number.', 'error'); return; }

    // ─── Sirf changed fields ka diff banao ──────────────────────────
    const prevEmail = String(savedProfile.email || '').trim().toLowerCase();
    const prevName = savedProfile.name || '';
    const prevBio = savedProfile.bio || '';
    const prevContact = savedProfile.contact_number || '';

    const changedFields = {};
    if (nextName !== prevName) changedFields.name = nextName;
    if (nextEmail !== prevEmail) changedFields.email = nextEmail;
    if (nextBio !== prevBio) changedFields.bio = nextBio;
    if ((nextContactDigits || '') !== prevContact) {
      changedFields.contact_number = nextContactDigits || '';
      changedFields.phone_number = nextContactDigits || '';
      changedFields.mobile_number = nextContactDigits || '';
    }

    const hasChanges = Object.keys(changedFields).length > 0;
    if (!hasChanges) { showToast('No changes to save.', 'info'); return; }
    // ─────────────────────────────────────────────────────────────────

   setSaving(true);

    // ✅ FIX: ab asli backend endpoint POST /profile hit hota hai — phone/bio ka
    // pending state backend khud manage karta hai (pending_phone/pending_bio).
    // Naam/email fields is endpoint ke through pending nahi hote (backend contract
    // sirf phone+bio confirm karta hai), isliye unhe yahan se drop kar diya —
    // agar backend inhe bhi support karta hai to bata dena, alag se jod denge.
    const apiResult = await AuthAPI.updateProfile({
      phone: changedFields.contact_number !== undefined ? changedFields.contact_number : undefined,
      bio: changedFields.bio !== undefined ? changedFields.bio : undefined,
    });
    setSaving(false);

    if (!apiResult.ok) {
      if (apiResult.isAuth) { showToast('Session expired. Please login again.', 'error'); return; }
      showToast(apiResult.message || 'Unable to send request.', 'error');
      return;
    }

    const profile = apiResult.profile || {};
    const updated = await UserStore.updateUser(savedProfile.account_email || savedProfile.email, {
      pending_phone: profile.pending_phone ?? null,
      pending_bio: profile.pending_bio ?? null,
      profile_update_status: profile.profile_update_status ?? null,
    });
    if (!updated) { showToast('Error saving request locally.', 'error'); return; }

    setSavedProfile(updated); setForm(updated); setIsEditing(false);
    showToast('Request successfully sent.', 'success');
    setSuccessMessage('Request successfully sent.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
    
     

  const renderProfileUpdateRequest = () => {
    if (!profileUpdateRequest) return null;
    const requested = profileUpdateRequest.requested_updates || {};
    return (
      <View style={{ marginTop: 14, borderWidth: 1, borderColor: profileRequestStatusMeta?.border || '#e2e8f0', backgroundColor: profileRequestStatusMeta?.bg || '#f8fafc', borderRadius: 12, padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="clock" size={15} color={profileRequestStatusMeta?.color || '#64748b'} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>Profile Update Request</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '800', color: profileRequestStatusMeta?.color || '#64748b' }}>
            {profileRequestStatusMeta?.label || 'Request saved'}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#64748b' }}>
          Admin approval ke baad hi profile me changes show honge.
        </Text>
        
          <View style={{ gap: 4 }}>
          {requested.name !== undefined ? (
            <Text style={{ fontSize: 12, color: '#334155' }}>Name: <Text style={{ fontWeight: '700' }}>{requested.name || '-'}</Text></Text>
          ) : null}
          {requested.email !== undefined ? (
            <Text style={{ fontSize: 12, color: '#334155' }}>Email: <Text style={{ fontWeight: '700' }}>{requested.email || '-'}</Text></Text>
          ) : null}
          {requested.contact_number !== undefined ? (
            <Text style={{ fontSize: 12, color: '#334155' }}>Phone: <Text style={{ fontWeight: '700' }}>{requested.contact_number || '-'}</Text></Text>
          ) : null}
          {requested.bio !== undefined ? (
            <Text style={{ fontSize: 12, color: '#334155' }} numberOfLines={2}>Bio: <Text style={{ fontWeight: '700' }}>{requested.bio || '-'}</Text></Text>
          ) : null}
        </View>
      </View>
    );
  };

  const displayProfile = isEditing ? form : savedProfile;
  const displayHasBlueTick = Boolean(isLoggedIn && UserStore.hasBlueTick(displayProfile));
  const referralCode = displayProfile.referral_code || generateReferralCode(displayProfile.email);
  const rank = getRank(displayProfile.referral_count || 0);
  const completionPct = isLoggedIn
    ? (displayProfile.bio && displayProfile.contact_number && displayProfile.profile_image ? '88%' : '62%')
    : '0%';

  const editProfileForm = (
    <View style={w.editFormContainer}>
      <View style={w.editTopCancel}>
        <Pressable
          style={({ pressed }) => [
            w.editTopCancelBtn,
            pressed ? { opacity: 0.8 } : null,
          ]}
          onPress={closeEdit}
        >
          <Text style={w.editTopCancelText}>Cancel</Text>
        </Pressable>
      </View>
      <View style={ProfileStyles.formCard}>
       <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ position: 'relative' }}>
            <View style={w.avatarWrap}>
              <Image
                source={form.profile_image ? { uri: form.profile_image } : DEFAULT_AVATAR}
                style={w.avatar}
                resizeMode="cover"
              />
            </View>
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: ORANGE,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: '#ffffff',
              }}
              onPress={handlePickImage}
              disabled={uploading}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            {uploading ? 'Opening...' : 'Tap to change photo'}
          </Text>
        </View>

        <View style={ProfileStyles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={ProfileStyles.sectionHeading}>Edit Profile</Text>
            <Text style={ProfileStyles.sectionSubtitle}>Update your basic details.</Text>
            {successMessage ? <Text style={ProfileStyles.successText}>{successMessage}</Text> : null}
          </View>
        </View>
        <View style={ProfileStyles.fieldGrid}>
          <View style={ProfileStyles.fullWidthGroup}>
            <Text style={ProfileStyles.inputLabel}>Full Name *</Text>
            <View style={ProfileStyles.inputWrap}>
              <Feather name="user" size={16} color="#8a94a6" />
              <TextInput style={ProfileStyles.input} value={form.name} onChangeText={(v) => handleChange('name', v)} placeholder="Enter your name" placeholderTextColor="#94a3b8" />
            </View>
          </View>
          <View style={ProfileStyles.fullWidthGroup}>
            <Text style={ProfileStyles.inputLabel}>Email</Text>
            <View style={ProfileStyles.inputWrap}>
              <Feather name="mail" size={16} color="#8a94a6" />
              <TextInput style={ProfileStyles.input} value={form.email} onChangeText={(v) => handleChange('email', v)} placeholder="Enter email address" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.inputLabel}>Mobile Number</Text>
            <View style={ProfileStyles.inputWrap}>
              <Feather name="smartphone" size={16} color="#8a94a6" />
              <TextInput style={ProfileStyles.input} value={form.contact_number} onChangeText={(v) => handleChange('contact_number', v)} placeholder="10-digit mobile" placeholderTextColor="#94a3b8" keyboardType="phone-pad" maxLength={14} />
            </View>
          </View>
          <View style={ProfileStyles.fullWidthGroup}>
            <Text style={ProfileStyles.inputLabel}>Bio</Text>
            <View style={[ProfileStyles.inputWrap, ProfileStyles.textAreaWrap]}>
              <Feather name="file-text" size={16} color="#8a94a6" style={ProfileStyles.textAreaIcon} />
              <TextInput style={[ProfileStyles.input, ProfileStyles.textArea]} value={form.bio} onChangeText={(v) => handleChange('bio', v)} placeholder="Write something about you" placeholderTextColor="#94a3b8" multiline />
            </View>
          </View>
        </View>
        <View style={ProfileStyles.formFooterRow}>
          <TouchableOpacity style={ProfileStyles.cancelButton} onPress={closeEdit}>
            <Text style={ProfileStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ProfileStyles.submitButton} onPress={handleSave} disabled={saving}>
            <Text style={ProfileStyles.submitButtonText}>{saving ? 'Sending...' : 'Admin Approval'}</Text>
          </TouchableOpacity>
        </View>
        {renderProfileUpdateRequest()}
      </View>
    </View>
  );

  // Follow modal
  const followModal = (
    <Modal visible={Boolean(followModalType)} transparent animationType="slide" onRequestClose={closeFollowList}>
      <View style={ProfileStyles.followModalOverlay}>
        <View style={ProfileStyles.followModalCard}>
          <View style={ProfileStyles.followModalHeader}>
            <Text style={ProfileStyles.followModalTitle}>
              {followModalType === 'followers' ? 'Followers' : 'Following'}
            </Text>
            <TouchableOpacity style={ProfileStyles.followModalClose} onPress={closeFollowList} activeOpacity={0.75}>
              <Feather name="x" size={18} color="#111111" />
            </TouchableOpacity>
          </View>
          <ScrollView style={ProfileStyles.followModalList} contentContainerStyle={ProfileStyles.followModalListContent}>
            {(followLists[followModalType] || []).length ? (
              (followLists[followModalType] || []).map((item) => (
                <TouchableOpacity key={item.email} style={ProfileStyles.followUserRow} activeOpacity={0.8}
                  onPress={() => { closeFollowList(); navigation.navigate('UserPublicProfile', { email: item.email, author: item }); }}
                >
                  <Image source={item.profile_image ? { uri: item.profile_image } : DEFAULT_AVATAR} style={ProfileStyles.followUserAvatar} />
                  <View style={ProfileStyles.followUserInfo}>
                    <Text style={ProfileStyles.followUserName} numberOfLines={1}>{item.name || 'User'}</Text>
                    <Text style={ProfileStyles.followUserEmail} numberOfLines={1}>{item.email || ''}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#BBBBBB" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={ProfileStyles.followEmptyText}>
                {followModalType === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const documentPreviewModal = (
    <Modal visible={Boolean(documentPreviewType)} transparent animationType="slide" onRequestClose={closeDocumentPreview}>
      <View style={ProfileStyles.followModalOverlay}>
        <View style={[ProfileStyles.followModalCard, { maxHeight: '90%' }]}>
          <View style={ProfileStyles.followModalHeader}>
            <Text style={ProfileStyles.followModalTitle}>
              {documentPreviewType === 'id-card' ? 'ID Card' : 'Appointment Letter'}
            </Text>
            <TouchableOpacity style={ProfileStyles.followModalClose} onPress={closeDocumentPreview} activeOpacity={0.75}>
              <Feather name="x" size={18} color="#111111" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {documentPreviewType === 'id-card' ? (
              <AutoIdCardPreview profile={savedProfile} />
            ) : documentPreviewType === 'appointment-letter' ? (
              <AutoAppointmentLetterPreview profile={savedProfile} />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const openUserPost = async (post) => {
    if (!post) return;
    try { if (post.id) await UserStore.updateNewsFeedItem(post.id, 'view'); } catch {}
    navigation.navigate('NewsDetails', { article: post });
  };

  // Render user posts with grid/list toggle
  const renderUserPosts = () => {
    const isGrid = postViewMode === 'grid';
    const isNativeApp = Platform.OS !== 'web';
    const gridGap = 3;
    const nativeGridWidth = Math.max(windowWidth - 24, 300);
    const nativeTileSize = Math.floor((nativeGridWidth - gridGap * 2) / 3);
    const isImageUri = (value) => {
      const uri = String(value || '').trim();
      return /^(https?:|file:|content:|data:image|blob:)/i.test(uri);
    };
    const firstImageUri = (values) => {
      for (const value of values) {
        if (Array.isArray(value)) {
          const nested = firstImageUri(value);
          if (nested) return nested;
        } else if (isImageUri(value)) {
          return String(value).trim();
        }
      }
      return '';
    };
    const getPostImage = (post = {}) => firstImageUri([
      post.thumbnail,
      post.videoThumb,
      post.video_thumb,
      post.videoThumbnail,
      post.video_thumbnail,
      post.thumbnail_url,
      post.poster,
      post.image,
      post.cover_image,
      post.featured_image,
      post.photo,
      post.img,
      post.picture,
      post.imageUrl,
      post.image_url,
      post.coverImage,
      post.images,
      post.media,
    ]);
    const getPostKind = (post = {}) => String(post.mediaType || post.type || '').toLowerCase();

    if (userPosts.length === 0) {
      return (
        <View style={w.fullCard}>
          <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
            No posts yet. Click "Post News" to share your first post.
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View style={w.postViewToggle}>
          <TouchableOpacity
            style={[w.postViewBtn, isGrid && w.postViewBtnActive]}
            onPress={() => setPostViewMode('grid')}
            activeOpacity={0.8}
          >
            <Feather name="grid" size={18} color={isGrid ? '#ffffff' : '#64748b'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[w.postViewBtn, !isGrid && w.postViewBtnActive]}
            onPress={() => setPostViewMode('list')}
            activeOpacity={0.8}
          >
            <Feather name="list" size={18} color={!isGrid ? '#ffffff' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {isGrid ? (
          <View style={[w.postGrid, isNativeApp && { gap: 0, paddingHorizontal: 0 }]}>
            {userPosts.map((post, index) => {
              const postImage = getPostImage(post);
              const postKind = getPostKind(post);
              const isLastInRow = index % 3 === 2;
              return (
                <TouchableOpacity
                  key={post.id || index}
                  style={[
                    w.postGridItem,
                    isNativeApp && {
                      width: nativeTileSize,
                      height: nativeTileSize,
                      aspectRatio: undefined,
                      marginRight: isLastInRow ? 0 : gridGap,
                      marginBottom: gridGap,
                      borderRadius: 0,
                    },
                  ]}
                  onPress={() => openUserPost(post)}
                  activeOpacity={0.85}
                >
                  {postImage ? (
                    <>
                      <Image source={{ uri: postImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      {postKind.includes('video') ? (
                        <View style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="play" size={12} color="#ffffff" />
                        </View>
                      ) : null}
                      {Array.isArray(post.images) && post.images.length > 1 ? (
                        <View style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="copy" size={12} color="#ffffff" />
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <Feather name={postKind.includes('video') ? 'video' : postKind.includes('file') ? 'file-text' : 'file'} size={18} color="#ffffff" style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600', textAlign: 'center', lineHeight: 15 }} numberOfLines={6}>
                        {post.content || post.title || post.description || '📰'}
                      </Text>
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3 }}>
                        <Feather name="eye" size={10} color="#fff" />
                        <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{post.views || post.likes || 0}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          userPosts.map((post, index) => (
            <TouchableOpacity key={post.id || index} style={w.postCard} onPress={() => openUserPost(post)} activeOpacity={0.85}>
              <View style={w.postHeader}>
                <Image
                  source={savedProfile.profile_image ? { uri: savedProfile.profile_image } : DEFAULT_AVATAR}
                  style={w.postAvatar}
                />
                <View>
                  <Text style={w.postAuthor}>{savedProfile.name || 'User'}</Text>
                  <Text style={w.postTime}>{new Date(post.createdAt || post.date || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={w.postContent}>{post.content || post.title || post.description || ''}</Text>
              {getPostImage(post) ? <Image source={{ uri: getPostImage(post) }} style={w.postImage} resizeMode="cover" /> : null}
              <View style={w.postActions}>
  <TouchableOpacity
    style={w.postActionBtn}
    activeOpacity={0.75}
    onPress={async () => {
      try {
        if (post.id) await UserStore.updateNewsFeedItem(post.id, 'like');
        openUserPost(post);
      } catch {}
    }}
  >
    <Feather name="heart" size={18} color="#64748b" />
    <Text style={w.postActionText}>{post.likes || 0}</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={w.postActionBtn}
    activeOpacity={0.75}
    onPress={() => openUserPost(post)}
  >
    <Feather name="message-circle" size={18} color="#64748b" />
    <Text style={w.postActionText}>{post.comments || 0}</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={w.postActionBtn}
    activeOpacity={0.75}
    onPress={async () => {
      try {
        const title = post.title || post.content || 'RTI News';
        await Share.share({ title: 'RTI News', message: title });
      } catch {}
    }}
  >
    <Feather name="share-2" size={18} color="#64748b" />
    <Text style={w.postActionText}>Share</Text>
  </TouchableOpacity>
</View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  // Toggle buttons component
  const ToggleButtons = () => (
    <View style={w.toggleContainer}>
      <TouchableOpacity 
        style={[w.toggleBtn, !showSavedProfile && w.toggleBtnActive]} 
        onPress={() => setShowSavedProfile(false)}
        activeOpacity={0.8}
      >
        <Text style={[w.toggleBtnText, !showSavedProfile && w.toggleBtnTextActive]}>
          My Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[w.toggleBtn, showSavedProfile && w.toggleBtnActive]} 
        onPress={() => setShowSavedProfile(true)}
        activeOpacity={0.8}
      >
        <Text style={[w.toggleBtnText, showSavedProfile && w.toggleBtnTextActive]}>
          Profile Details
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Combined Stats Row Component
  const CombinedStatsRow = () => {
    const rankData = getRank(savedProfile.referral_count || 0);
    const nextRankNeeded = rankData.nextRankNeeded || 10;
    
    return (
      <View style={w.combinedStatsRow}>
        {/* Profile Completion */}
        <View style={w.combinedStatsItem}>
          <Text style={w.combinedStatsLabel}>Profile Completion</Text>
          <Text style={w.combinedStatsValue}>{completionPct}</Text>
        </View>
        
        <View style={w.combinedStatsDivider} />
        
        {/* Referral Code */}
        <View style={w.combinedStatsItem}>
          <Text style={w.combinedStatsLabel}>Referral Code</Text>
          <Text style={w.referralCodeCompact}>{referralCode}</Text>
          <TouchableOpacity onPress={handleCopyReferralCode} style={w.copyBtnCompact}>
            <Text style={w.copyBtnTextCompact}>Copy</Text>
          </TouchableOpacity>
        </View>
        
        <View style={w.combinedStatsDivider} />
        
        {/* Your Rank */}
        <View style={w.combinedStatsItem}>
          <Text style={w.combinedStatsLabel}>Your Rank</Text>
          <Text style={w.combinedStatsValue}>{rankData.icon} {rankData.title}</Text>
          <Text style={w.combinedStatsSub}>{savedProfile.referral_count || 0} / {nextRankNeeded}</Text>
        </View>
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════════════
  // WEB DESKTOP — Instagram-style
  // ══════════════════════════════════════════════════════════════════
  if (Platform.OS === 'web') {
    return (
      <View style={w.root}>
        {followModal}
        {documentPreviewModal}

        {/* Top Bar */}
        <View style={[w.topBar, isWebNarrow && w.topBarNarrow]}>
          <View style={[w.topLeft, isWebNarrow && w.topLeftNarrow]}>
            <Pressable
              style={({ pressed }) => [
                w.backBtn,
                Platform.OS === 'web' ? { cursor: 'pointer' } : null,
                pressed ? { opacity: 0.75 } : null,
              ]}
              onPress={handleGoHome}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color="#0f172a" />
            </Pressable>
            <Text style={w.topBarTitle}>{isEditing ? 'Edit Profile' : 'Profile'}</Text>
          </View>
          <View style={[w.topRight, isWebNarrow && w.topRightNarrow]}>
            {isLoggedIn && !isEditing && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    w.iconBtn,
                    Platform.OS === 'web' ? { cursor: 'pointer' } : null,
                    pressed ? { opacity: 0.75 } : null,
                  ]}
                  onPress={handleOpenSettings}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="settings" size={18} color="#0f172a" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    w.iconBtn,
                    Platform.OS === 'web' ? { cursor: 'pointer' } : null,
                    pressed ? { opacity: 0.75 } : null,
                  ]}
                  onPress={handleOpenNotifications}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="bell" size={18} color="#0f172a" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    w.iconBtn,
                    Platform.OS === 'web' ? { cursor: 'pointer' } : null,
                    pressed ? { opacity: 0.75 } : null,
                  ]}
                  onPress={handleShareProfile}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="share-2" size={18} color="#0f172a" />
                </Pressable>
              </>
            )}
          </View>
        </View>

        <ScrollView style={w.scroll} contentContainerStyle={w.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={w.col}>
            {isEditing ? (
              editProfileForm
            ) : (
              <>
                {/* Profile Header Row */}
                <View style={[w.profileRow, isWebNarrow && w.profileRowNarrow]}>
                  <View style={[w.avatarWrap, isWebNarrow && w.avatarWrapNarrow]}>
                    <Image
                      source={isLoggedIn && displayProfile.profile_image ? { uri: displayProfile.profile_image } : DEFAULT_AVATAR}
                      style={w.avatar}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={[w.profileInfo, isWebNarrow && w.profileInfoNarrow]}>
                    <View style={w.nameRow}>
                      <Text style={w.name}>
                        {isLoggedIn ? (displayProfile.name || 'Your Name') : 'RTI News Member'}
                      </Text>
                      {displayHasBlueTick ? <VerifiedBadge size={20} /> : null}
                      {isLoggedIn ? (
                        <>
                          <Pressable
                            style={({ pressed }) => [
                              w.postBtn,
                              Platform.OS === 'web' ? { cursor: 'pointer' } : null,
                              pressed ? { opacity: 0.85 } : null,
                            ]}
                            onPress={handlePostNews}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text style={w.postBtnText}>Post News</Text>
                          </Pressable>
                        </>
                      ) : null}
                    </View>
                    <View style={[w.statsRow, isWebNarrow && w.statsRowNarrow]}>
                      <View style={w.statItem}>
                        <Text style={w.statNum}>{profileStats.posts}</Text>
                        <Text style={w.statLabel}> posts</Text>
                      </View>
                      <TouchableOpacity style={w.statItem} onPress={() => openFollowList('followers')} activeOpacity={0.75}>
                        <Text style={w.statNum}>{isLoggedIn ? profileStats.followers : 0}</Text>
                        <Text style={w.statLabel}> followers</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={w.statItem} onPress={() => openFollowList('following')} activeOpacity={0.75}>
                        <Text style={w.statNum}>{isLoggedIn ? profileStats.following : 0}</Text>
                        <Text style={w.statLabel}> following</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoggedIn ? (
                      <View style={w.bioSection}>
                        {displayProfile.name ? <Text style={w.bioName}>{displayProfile.name}</Text> : null}
                        {displayProfile.bio ? <Text style={w.bioText}>{displayProfile.bio}</Text> : null}
                        <View style={w.rankRow}>
                          <Text style={[w.rankText, { color: rank.color }]}>{rank.icon} {rank.title}</Text>
                          {displayProfile.state ? (
                            <>
                              <Text style={{ color: '#dbdbdb', fontSize: 14 }}>·</Text>
                              <Text style={w.bioMeta}>📍 {displayProfile.state}</Text>
                            </>
                          ) : null}
                        </View>
                        {generateMemberId(displayProfile.email) ? (
                          <Text style={w.bioMeta}>Member ID: <Text style={{ fontWeight: '700', color: ORANGE }}>{generateMemberId(displayProfile.email)}</Text></Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={w.divider} />

                {!isLoggedIn ? (
                  <View style={w.guestCard}>
                    <Feather name="user" size={48} color={ORANGE} />
                    <Text style={w.guestTitle}>Login to view your profile</Text>
                    <Text style={w.guestText}>Access your posts, followers, referral code and more.</Text>
                    <TouchableOpacity style={w.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                      <Feather name="log-in" size={16} color="#ffffff" />
                      <Text style={w.loginBtnText}>Login / Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[w.cardsRow, isWebNarrow && w.cardsRowNarrow]}>
                    <ToggleButtons />

                    {/* Combined Stats Row - replaces the old progress and referral/rank cards */}
                    <CombinedStatsRow />

                    {/* Conditional rendering based on toggle */}
                    {showSavedProfile ? (
                      <View style={w.fullCardWithHeader}>
                        <Pressable
                          style={({ pressed }) => [
                            w.editInsideBtn,
                            pressed ? { opacity: 0.85 } : null,
                          ]}
                          onPress={openEdit}
                        >
                          <Text style={w.editInsideBtnText}>Edit Profile</Text>
                        </Pressable>
                        <Text style={w.sectionTitle}>Profile Details</Text>
                        {renderProfileUpdateRequest()}
                        <SavedProfileCardComponent
                          profile={savedProfile}
                          onOpenIdCard={() => openDocumentPreview('id-card')}
                          onOpenAppointmentLetter={() => openDocumentPreview('appointment-letter')}
                          onDownloadIdCard={() => handleDownloadDocument('id-card')}
                          onDownloadAppointmentLetter={() => handleDownloadDocument('appointment-letter')}
                          isMobile={false}
                        />
                      </View>
                    ) : (
                      <View>
                        <Text style={w.sectionTitle}>My Posts</Text>
                        {renderUserPosts()}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

            {loading && !isEditing ? <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>Loading profile...</Text> : null}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ══════════════════════════════════════════════════════════════════

  return (
    <View style={ProfileStyles.root}>
      <View style={ProfileStyles.bgOrbPrimary} />
      <View style={ProfileStyles.bgOrbSecondary} />
      <View style={ProfileStyles.bgOrbTertiary} />

      <View style={ProfileStyles.topBar}>
        <TouchableOpacity style={ProfileStyles.topBarBackBtn} onPress={handleGoHome} activeOpacity={0.75}>
          <Feather name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', marginLeft: 12 }}>{isEditing ? 'Edit Profile' : 'Profile'}</Text>
        <View style={ProfileStyles.topBarActions}>
          {isLoggedIn && !isEditing && (
            <>
              <TouchableOpacity style={ProfileStyles.topBarIconBtn} onPress={handleOpenSettings} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="settings" size={18} color="#0f172a" />
              </TouchableOpacity>
              <TouchableOpacity style={ProfileStyles.topBarIconBtn} onPress={handleOpenNotifications} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="bell" size={18} color="#0f172a" />
              </TouchableOpacity>
              <TouchableOpacity style={ProfileStyles.topBarIconBtn} onPress={handleShareProfile} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="share-2" size={18} color="#0f172a" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={ProfileStyles.scrollView} contentContainerStyle={ProfileStyles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={ProfileStyles.profileShell}>
          {isEditing ? (
            editProfileForm
          ) : (
            <>
              <View style={ProfileStyles.summaryCard}>
                <View style={ProfileStyles.summaryTopRow}>
                  <View style={ProfileStyles.avatarRing}>
                    <Image
                      source={isLoggedIn && displayProfile.profile_image ? { uri: displayProfile.profile_image } : DEFAULT_AVATAR}
                      style={ProfileStyles.avatar}
                    />
                    <View style={ProfileStyles.onlineDot} />
                  </View>
         <View style={ProfileStyles.summaryContent}>
                    <View style={ProfileStyles.headerNameRow}>
                      <View style={ProfileStyles.profileNameRow}>
                        <Text style={ProfileStyles.profileName}>
                          {isLoggedIn ? (displayProfile.name || 'Your Name') : 'RTI News Member'}
                        </Text>
                        {displayHasBlueTick ? <VerifiedBadge size={18} /> : null}
                      </View>
                      {isLoggedIn ? (
                        <TouchableOpacity style={ProfileStyles.quickPostNewsBtn} onPress={handlePostNews} activeOpacity={0.85}>
                          <Text style={ProfileStyles.quickPostNewsBtnText}>Post News</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={ProfileStyles.statsRow}>
                      <View style={ProfileStyles.statItem}>
                        <Text style={ProfileStyles.statValue}>{profileStats.posts}</Text>
                        <Text style={ProfileStyles.statLabel}>posts</Text>
                      </View>
                      <TouchableOpacity style={ProfileStyles.statItem} onPress={() => openFollowList('followers')} activeOpacity={0.75}>
                        <Text style={ProfileStyles.statValue}>{isLoggedIn ? profileStats.followers : 0}</Text>
                        <Text style={ProfileStyles.statLabel}>followers</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={ProfileStyles.statItem} onPress={() => openFollowList('following')} activeOpacity={0.75}>
                        <Text style={ProfileStyles.statValue}>{isLoggedIn ? profileStats.following : 0}</Text>
                        <Text style={ProfileStyles.statLabel}>following</Text>
                      </TouchableOpacity>
                    </View>
                    {isLoggedIn ? (
                      <View style={ProfileStyles.summaryRankRow}>
                        <Text style={ProfileStyles.summaryRankEmoji}>{rank.icon}</Text>
                        <Text style={[ProfileStyles.summaryRankText, { color: rank.color }]}>{rank.title}</Text>
                        {displayProfile.state ? (
                          <>
                            <Text style={ProfileStyles.summaryDot}>·</Text>
                            <MaterialIcons name="location-on" size={13} color="#F97316" />
                            <Text style={ProfileStyles.locationText}>{displayProfile.state}</Text>
                          </>
                        ) : null}
                      </View>
                    ) : (
                <View style={ProfileStyles.summaryRankRow}>
                        <Text style={ProfileStyles.summaryRankEmoji}>👤</Text>
                        <Text style={[ProfileStyles.summaryRankText, { color: '#AAAAAA' }]}>Guest</Text>
                      </View>
                    )}
                    {isLoggedIn && generateMemberId(displayProfile.email) ? (
                      <View style={ProfileStyles.memberIdRow}>
                        <Text style={ProfileStyles.memberIdLabelText}>Member ID:</Text>
                        <Text style={ProfileStyles.memberIdValueText}>{generateMemberId(displayProfile.email)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {isLoggedIn && displayProfile.bio ? (
                  <Text style={ProfileStyles.profileBio}>{displayProfile.bio}</Text>
                ) : null}
</View>
              {!isLoggedIn ? (
                <View style={ProfileStyles.loginPromptWrap}>
                  <View style={ProfileStyles.loginPromptIconWrap}>
                    <Feather name="user" size={32} color="#F97316" />
                  </View>
                  <Text style={ProfileStyles.loginPromptHeading}>Login</Text>
                  <Text style={ProfileStyles.loginPromptText}></Text>
                  <TouchableOpacity style={ProfileStyles.loginPromptBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                    <Feather name="log-in" size={16} color="#ffffff" />
                    <Text style={ProfileStyles.loginPromptBtnText}>Login / Sign Up</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
            <View style={{ marginTop: 8 }}>
                    <ProfileCompletionRow percent={parseInt(completionPct, 10) || 0} />
                    <ReferralRow referralCode={referralCode} onCopy={handleCopyReferralCode} />
                    <RankRow referralCount={savedProfile.referral_count || 0} />
                  </View>
                  <View style={[ProfileStyles.referralCard, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginHorizontal: 12, marginBottom: 8, padding: 8 }]}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: !showSavedProfile ? '#F97316' : '#f0f0f0' }}
                        onPress={() => setShowSavedProfile(false)}
                      >
                        <Text style={{ color: !showSavedProfile ? '#fff' : '#666', fontWeight: '600' }}>My Posts</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: showSavedProfile ? '#F97316' : '#f0f0f0' }}
                        onPress={() => setShowSavedProfile(true)}
                      >
                        <Text style={{ color: showSavedProfile ? '#fff' : '#666', fontWeight: '600' }}>Profile Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
              {showSavedProfile ? (
                    <>
                      {renderProfileUpdateRequest()}
                      <SavedProfileCard
                        profile={savedProfile}
                        onEdit={openEdit}
                        onOpenIdCard={() => openDocumentPreview('id-card')}
                        onOpenAppointmentLetter={() => openDocumentPreview('appointment-letter')}
                        onDownloadIdCard={() => handleDownloadDocument('id-card')}
                        onDownloadAppointmentLetter={() => handleDownloadDocument('appointment-letter')}
                      />
                    </>
                  ) : (
                    <View style={ProfileStyles.infoCard}>
                      <View style={ProfileStyles.headerStrip}>
                        <View style={ProfileStyles.headerLeft}>
                          <View style={ProfileStyles.headerIconWrap}>
                            <Feather name="file-text" size={18} color="#F97316" />
                          </View>
                          <Text style={ProfileStyles.cardTitle}>My Posts</Text>
                        </View>
                      </View>
                      {renderUserPosts()}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
        {loading && !isEditing ? <Text style={ProfileStyles.loadingText}>Loading profile...</Text> : null}
      </ScrollView>

      {followModal}
      {documentPreviewModal}

      {Platform.OS === 'android' ? (
        <View style={ProfileStyles.bottomShell}>
          <AppNavbar navigation={navigation} activeScreen="Profile" hideTopHeader={true} />
        </View>
      ) : null}
    </View>
  );
}