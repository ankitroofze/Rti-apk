// ProfileScreen.js - Complete updated file with scroll fixes

import { smartGoBack } from '../utils/smartBack';
import { useQuickMenuRedirect } from '../utils/useQuickMenuRedirect';
import NameWithTick from '../components/NameWithTick';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { LinearGradient } from 'expo-linear-gradient';
import ModuleWebHeader from '../components/Modulewebheader';
import { useFocusEffect } from '@react-navigation/native';

import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Clipboard,
  Image,
  ImageBackground,
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
import AutoIdCardBackPreview from '../components/IdCardBackPreview';
import ScaledCard from '../components/ScaledCard';
import PostGridThumb from '../components/PostGridThumb';
import { PageLoader, useAppFontsReady } from '../components/WebReadyGate';
import VerifiedBadge from '../components/VerifiedBadge';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { PROFILE_TIERS, SEAT_ID_TO_TIER } from '../constants/profileConstants';
import ProfileStyles from '../styles/ProfileStyles';
import { AVATAR_IMAGE } from '../utils/profileHelpers';
import { RankBadge, ReferralCodeCard, SavedProfileCard, ProfileCompletionRow, ReferralRow, RankRow } from '../components/ProfileComponents';
import { initialForm, MAX_IMAGE_SIZE, DEFAULT_AVATAR } from '../constants/profileConstants';
import { getResponsiveWindowWidth } from '../utils/webDevice';
import {
  getRank,
  generateReferralCode,
  generateMemberId,
  hasDocumentSource,
  safeName,
  getProfileTier,
  requirePremium,
} from '../utils/profileHelpers';
import { compressImageToBase64 } from '../utils/imageHandling';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildIdCardFrontAndBackHtml, buildAppointmentLetterHtml } from '../utils/documentGenerator';

// ── Web-only inline styles ─────────────────────────────────────────────────────
const WEB_COL = 935;
// ✅ Backend jab plan ka naam match nahi kar paata to 'Subscription Plan' placeholder aata hai —
// usse asli plan naam mat samjho, tab 'Premium User' (tier label) dikhao.
const realPlanName = (n) => { const v = String(n || '').trim(); return v && v.toLowerCase() !== 'subscription plan' ? v : ''; };

const ORANGE = '#F97316';

const w = {
  root:        { flex: 1, backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 13, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#dbdbdb' },
  topBarNarrow: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  topLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topLeftNarrow: { flexWrap: 'wrap', gap: 12 },
  topRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topRightNarrow: { flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%', gap: 8 },
  backBtn:     { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  iconBtn:     { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 0 },
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

  // Combined stats row (Profile Completion, Referral, Rank in one line) - No border
  combinedStatsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#ffffff', 
    borderRadius: 6, 
    padding: 16, 
    borderWidth: 0,
    borderColor: 'transparent',
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
  fullCardWithHeader: { backgroundColor: '#ffffff', borderRadius: 6, padding: 20, borderWidth: 0, position: 'relative' },
  
  // Edit button inside profile details card - now text only, orange, no border
  editInsideBtn: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3, backgroundColor: 'transparent', borderWidth: 0, zIndex: 10 },
  editInsideBtnText: { fontSize: 12, fontWeight: '600', color: ORANGE, fontFamily: 'Roboto, sans-serif' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12, fontFamily: 'Roboto, sans-serif' },

  // Guest
  guestCard:   { backgroundColor: '#ffffff', borderRadius: 6, padding: 40, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 28 },
  guestTitle:  { fontSize: 22, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
  guestText:   { fontSize: 14, color: '#64748b', textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  
  // Glossy Login Button
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
  
  // Glossy Active View Button
  postViewBtnActive: { backgroundColor: ORANGE, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  postGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  postGridItem: { width: 'calc(20% - 3px)', aspectRatio: 1, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  postGridThumb: { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#f1f5f9' },
  postGridImage: { width: '100%', height: '100%' },
  
  // Toggle buttons
  toggleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 6, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 3, alignItems: 'center' },
  
  // Glossy Active Segment Toggle Button
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
        body: { paddingHorizontal: 16, paddingVertical: 26 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    rowLast: { borderBottomWidth: 0 },
    label: { fontSize: 13, color: '#64748b', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
    value: { fontSize: 13, color: '#0f172a', fontWeight: '600', fontFamily: 'Roboto, sans-serif' },
    valueLink: { fontSize: 13, color: ORANGE, fontWeight: '600', fontFamily: 'Roboto, sans-serif' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
       actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 3, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    // Glossy Primary Action Button
    actionBtnPrimary: { backgroundColor: ORANGE, borderTopWidth: 1.5, borderTopColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', shadowColor: ORANGE, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
      actionBtnText: { fontSize: 11, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto, sans-serif' },
    actionBtnTextPrimary: { color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#f0fdf4' },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#16a34a', fontFamily: 'Roboto, sans-serif' },
    idRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
    idItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f8fafc', borderRadius: 3, borderWidth: 1, borderColor: '#e2e8f0' },
    idItemText: { fontSize: 12, color: '#0f172a', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  },

  // ===== NEW WEB STYLES FOR RTI NEWS REFERENCE DESIGN =====
  page: { flex: 1, backgroundColor: '#f3f4f6', minHeight: '100vh' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  topHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  searchWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    flex: 1, 
    maxWidth: 400,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchInput: { flex: 1, paddingVertical: 4, paddingHorizontal: 8, color: '#ffffff', fontSize: 14, fontFamily: 'Roboto, sans-serif', outlineWidth: 0, borderWidth: 0, backgroundColor: 'transparent' },
  topHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  topAvatarWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  topAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  
  // FIX: Make body scrollable
  body: { flexDirection: 'row', gap: 20, padding: 20, maxWidth: 1240, width: '100%', marginHorizontal: 'auto', flex: 1 },
  bodyNarrow: { flexDirection: 'column', padding: 12 },
  
      navItemText: { fontSize: 14, color: '#4b5563', fontWeight: '400', fontFamily: 'Roboto, sans-serif' },
  tabBarRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexWrap: 'wrap' },
  tabBarItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  
  upgradeCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  upgradeIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  upgradeTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  upgradeSub: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 12 },
  upgradeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, alignItems: 'center' },
  upgradeBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  
  mainCol: { flex: 1, gap: 16, minWidth: 0 },
  rightCol: { width: 280, flexShrink: 0, gap: 16 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardHeading: { fontSize: 16, fontWeight: '700', color: '#111827' },
  viewAllLink: { fontSize: 13, fontWeight: '500' },
  
  profileHeadRow: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  profileHeadRowNarrow: { flexDirection: 'column', alignItems: 'center' },
  
  avatarBox: { width: 120, height: 120, borderRadius: 60, position: 'relative', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 60 },
  crownBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  cameraBtn: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  
  profileInfoCol: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
   nameText: { fontSize: 22, fontWeight: '400', color: '#111827', fontFamily: "'Roboto', sans-serif" },
  memberIdText: { fontSize: 13, color: '#6b7280', fontWeight: '400', fontFamily: "'Roboto', sans-serif" },
  profileBioText: { fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 18, fontWeight: '400', fontFamily: "'Roboto', sans-serif" },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#6b7280', fontWeight: '400', fontFamily: "'Roboto', sans-serif" },
  tierPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  tierPillText: { fontSize: 12, fontWeight: '400', fontFamily: "'Roboto', sans-serif" },
  
  statsBox: { flexDirection: 'row', gap: 28, paddingTop: 4 },
  statItem: { flexDirection: 'column', alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '400', color: '#111827', fontFamily: "'Roboto', sans-serif" },
  statLabel: { fontSize: 13, color: '#6b7280', fontWeight: '400', fontFamily: "'Roboto', sans-serif" },
  
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
 editProfileBtn: { width: '100%', height: 44, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  addPersonBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
    editProfileBtnText: { fontSize: 14, fontWeight: '400', color: '#ffffff', fontFamily: "'Roboto', sans-serif" },
  addPersonBtn: { width: 44, height: 44, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  
  // ID Card & Appointment Letter styles
  documentSection: { marginTop: 16 },
  documentSectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  documentCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  documentPreviewWrap: { alignItems: 'center', paddingVertical: 8 },
  downloadBtn: { marginTop: 12, width: '100%', borderRadius: 6, overflow: 'hidden' },
  downloadBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16 },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  
  // Guest styles
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: '70vh' },
  guestCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 48, alignItems: 'center', gap: 16, maxWidth: 400, width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  guestIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  guestText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  
  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginTop: 8 },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  
  // Post view toggle gradient buttons
  postViewGradientBtn: { width: 44, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  postViewGradientBtnActive: { borderColor: 'transparent' },
};

// Reusable SavedProfileCard component for both web and mobile
function SavedProfileCardComponent({ profile, onOpenIdCard, onOpenAppointmentLetter, onDownloadIdCard, onDownloadAppointmentLetter, isMobile, profileTier }) {
  // If mobile, use ProfileStyles, else use web styles
  const styles = isMobile ? ProfileStyles : w.savedProfileCard;
  return (
    <View style={styles.container}>
      <View style={styles.body}>
               <View style={{ flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* ── ID Card (front + back) + apna Download button ── */}
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 260 }}>
            <TouchableOpacity onPress={onOpenIdCard} activeOpacity={0.85}>
              <View style={{ flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <ScaledCard width={220} naturalWidth={360}>
                  <AutoIdCardPreview profile={profile} />
                </ScaledCard>
                <ScaledCard width={220} naturalWidth={360}>
                  <AutoIdCardBackPreview />
                </ScaledCard>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, width: '100%', borderRadius: 6, overflow: 'hidden' }} onPress={onDownloadIdCard} activeOpacity={0.85}>
              <LinearGradient colors={profileTier?.gradientDark || ['#374151', '#6B7280', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 }}>
                <Feather name="download" size={11} color="#ffffff" />
                <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Download ID</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Appointment Letter + apna Download button ── */}
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 260 }}>
            <TouchableOpacity onPress={onOpenAppointmentLetter} activeOpacity={0.85}>
              <ScaledCard width={194} naturalWidth={560}>
                <AutoAppointmentLetterPreview profile={profile} />
              </ScaledCard>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, width: '100%', borderRadius: 6, overflow: 'hidden' }} onPress={onDownloadAppointmentLetter} activeOpacity={0.85}>
              <LinearGradient colors={profileTier?.gradientDark || ['#374151', '#6B7280', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 }}>
                <Feather name="download" size={11} color="#ffffff" />
                <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Download Letter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── dono ke neeche ek line ── */}
        <View style={{ height: 1, backgroundColor: '#e2e8f0', marginTop: 18 }} />
      </View>
    </View>
  );
}
// ✅ Fonts/icons ready hone tak sirf loader — half-loaded page nahi dikhega
export default function ProfileScreen(props) {
  const fontsReady = useAppFontsReady();
  if (!fontsReady) return <PageLoader />;
  return <ProfileScreenInner {...props} />;
}

function ProfileScreenInner({ navigation, route }) {
  // Desktop web par Profile hamesha sidebar wale QuickMenu ke andar (alag bina-sidebar page nahi)
  const redirectingToSidebar = useQuickMenuRedirect(navigation, 'Profile');
  useEffect(() => {
    // Android hardware back button
    const backHandlerSub = Platform.OS === 'android'
      ? BackHandler.addEventListener('hardwareBackPress', () => {
          smartGoBack(navigation, 'Home');
          return true; // default back action ko rok diya
        })
      : null;

    // Browser back button (web) / iOS swipe-back gesture
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      // pichli screen ho to normal back (breadcrumb); sirf history na ho tab Home
      if (navigation.canGoBack()) return;
      e.preventDefault();
      navigation.navigate('Home');
    });

    return () => {
      backHandlerSub?.remove?.();
      unsubscribeBeforeRemove();
    };
  }, [navigation]);
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const webWidth = getResponsiveWindowWidth(windowWidth);
  const isWebNarrow = Platform.OS === 'web' && webWidth < 860;

  const [loading, setLoading] = useState(true);
   const [initializing, setInitializing] = useState(true); 
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
   const [savedProfile, setSavedProfile] = useState(initialForm);
  // ✅ FIX: loadCurrentUser ko `savedProfile` ki latest value chahiye thi bina
  // use dependency array me daale — warna khud savedProfile update karne se
  // infinite loop ban jaata tha (naya reference → effect phir chalta →
  // phir update → ...). Ref se latest value milti hai bina re-render trigger kiye.
  const savedProfileRef = useRef(savedProfile);
  useEffect(() => { savedProfileRef.current = savedProfile; }, [savedProfile]);
  const [form, setForm] = useState(initialForm);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileStats, setProfileStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [followLists, setFollowLists] = useState({ followers: [], following: [] });
  const [followModalType, setFollowModalType] = useState('');
   const followRevisionRef = useRef(0);
  const pendingImageUriRef = useRef(null); // NEW: image select hote hi API hit nahi, Save par hi bhejenge
  const [documentPreviewType, setDocumentPreviewType] = useState('');
  const [idCardSide, setIdCardSide] = useState('front');
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false); // posts aane se pehle "No posts yet" na dikhe
   // Mobile (Android/iOS): profile kholte hi "My Posts" highlighted rehta hai, isliye posts seedha dikhein (click ki zarurat nahi).
   // Web par purana behaviour (Profile Details) hi default rehta hai.
   const [showSavedProfile, setShowSavedProfile] = useState(Platform.OS === 'web');
  const [activeMenu, setActiveMenu] = useState('posts'); // profile menu: jis item pe click kiya wo Edit Profile button ke color me dikhega
  const [postViewMode, setPostViewMode] = useState('grid');
  const [approvalNoticeDismissed, setApprovalNoticeDismissed] = useState(false); // NEW: approved/rejected banner ka cross button
    const loadCurrentUser = useCallback(async () => {
    const revisionAtStart = followRevisionRef.current;
    let user = await UserStore.getCurrentUser();
    if (!user) {
      setIsLoggedIn(false);
      setProfileStats({ posts: 0, followers: 0, following: 0 });
      setFollowLists({ followers: [], following: [] });
      setUserPosts([]);
      setLoading(false);
      setPostsLoaded(true);
       setInitializing(false);
      return;
    }

    // ✅ OPTIMISTIC PAINT: cached local user turant dikhado, taaki
    // tab switch pe screen khaali/purani na dikhe. Loading sirf pehli
    // baar (jab savedProfile abhi tak khaali hai) dikhega.
       const isFirstLoad = !savedProfileRef.current || !savedProfileRef.current.email;
    if (isFirstLoad) setLoading(true);

    const cachedRawImage = user.profile_image || '';
    const cachedSafeImage = cachedRawImage.startsWith('blob:') ? '' : cachedRawImage;
    setSavedProfile((prev) => ({
      ...prev,
      ...user,
      profile_image: cachedSafeImage,
      referral_code: user.my_referral_code || generateReferralCode(user.email),
    }));
    setForm((prev) => ({
      ...prev,
      ...user,
      profile_image: cachedSafeImage,
      referral_code: user.my_referral_code || generateReferralCode(user.email),
    }));
    setIsLoggedIn(true);
      setInitializing(false);

    // ✅ SPEED FIX: pehle sab calls sequential (ek ke baad ek) thi,
    // ab Promise.all se saath me fire hongi — total wait time sabse
    // slow ek call jitna hoga, sabki sum nahi.
    let profileRes = null;
    let syncedSubscriptionUser = null;
    let feedSummary = null;
    let followSummary = null;
    let adPosts = [];
    try {
      [profileRes, syncedSubscriptionUser, feedSummary, followSummary, adPosts] = await Promise.all([
        AuthAPI.getProfile().catch(() => null),
        UserStore.syncSubscriptionFromBackend(user).catch(() => null),
        UserStore.getNewsFeedSummary?.().catch?.(() => null) ?? Promise.resolve(null),
        UserStore.getFollowSummary(user.email).catch(() => null),
        // ✅ Advertisement Posts bhi My Posts me dikhane ke liye
        UserStore.getMyAdPosts().catch(() => []),
      ]);
    } catch {
      // best-effort — fail ho to bhi cached data already dikh chuka hai, crash nahi
    }

    if (syncedSubscriptionUser) user = syncedSubscriptionUser;

    if (profileRes?.ok && profileRes.user) {
      const apiUser = profileRes.user?.profile || profileRes.user;
      const backendFullName = [apiUser.firstname, apiUser.lastname]
        .filter((part) => part && String(part).trim())
        .join(' ')
        .trim();

      const synced = await UserStore.updateUser(user.email, {
        name: backendFullName || user.name,
        email: apiUser.email || user.email,
        contact_number: apiUser.phone !== undefined ? (apiUser.phone || '') : user.contact_number,
        phone_number: apiUser.phone !== undefined ? (apiUser.phone || '') : user.phone_number,
        mobile_number: apiUser.phone !== undefined ? (apiUser.phone || '') : user.mobile_number,
        bio: apiUser.bio ?? user.bio,
        pending_phone: apiUser.pending_phone ?? null,
        pending_bio: apiUser.pending_bio ?? null,
        profile_update_status: apiUser.profile_update_status ?? null,
        profile_image: apiUser.profile_image_url || apiUser.profile_image || user.profile_image,
        pending_profile_image: apiUser.pending_profile_image ?? null,
        pending_profile_image_url: apiUser.pending_profile_image_url ?? null,
        profile_image_change_count: Number(apiUser.profile_image_change_count ?? apiUser.profile?.profile_image_change_count ?? user.profile_image_change_count ?? 0) || 0,
        state: apiUser.state || user.state,
        district: apiUser.district || user.district,
       taluka: apiUser.taluka || user.taluka, village: apiUser.village || user.village || '',
        my_referral_code: apiUser.referral_code || user.my_referral_code,
      });
      if (synced) user = synced;
    }

    const rawImage = user.profile_image || '';
    const safeImage = rawImage.startsWith('blob:') ? '' : rawImage;
    const refCode = user.my_referral_code || generateReferralCode(user.email);
    if (rawImage.startsWith('blob:')) {
      await UserStore.updateUser(user.email, { profile_image: '' });
    }

    // getNewsFeedSummary() defaults to the authenticated user's `/my-news`
    // endpoint. Android/iOS API objects don't always include `createdBy`, so
    // filtering by that web-only field used to make the native post count 0.
    const ownFeedPosts = Array.isArray(feedSummary?.items) ? feedSummary.items : [];
    const ownLocalPosts = [
      ...(Array.isArray(user.news) ? user.news : []),
      ...(Array.isArray(user.news_feed) ? user.news_feed : []),
    ];
    const ownAdPosts = Array.isArray(adPosts) ? adPosts : [];
    const allPosts = [...ownFeedPosts, ...ownLocalPosts, ...ownAdPosts];
    const mergedPostKeys = new Set(allPosts.map((item, index) =>
      String(item?.id || `fallback-${index}`)
    ));

    const seenIds = new Set();
    const postTs = (item) => Date.parse(item?.createdAt || item?.created_at || item?.date || '') || 0;
    const userPostsData = [...ownFeedPosts, ...ownLocalPosts, ...ownAdPosts].filter(item => {
      const key = item?.id ? String(item.id) : null;
      if (!key) return true;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    }).sort((a, b) => postTs(b) - postTs(a)); // newest first (news + ads ek saath)
    setUserPosts(userPostsData);

    if (revisionAtStart === followRevisionRef.current) {
      // FIX: follow API fail/null aaye to counts 0 mat karo — purane counts rakho.
      if (followSummary && followSummary.followersCount != null && followSummary.followingCount != null) {
        setProfileStats({
          posts: mergedPostKeys.size,
          followers: Number(followSummary.followersCount),
          following: Number(followSummary.followingCount),
        });
        setFollowLists({
          followers: Array.isArray(followSummary.followers) ? followSummary.followers : [],
          following: Array.isArray(followSummary.following) ? followSummary.following : [],
        });
      } else {
        setProfileStats((prev) => ({ ...prev, posts: mergedPostKeys.size }));
      }
    } else {
      setProfileStats((prev) => ({ ...prev, posts: mergedPostKeys.size }));
    }

    const profileData = {
      ...user,
      profile_image: safeImage,
      referral_code: refCode,
    };
    setSavedProfile(profileData);
    setForm(profileData);
    setIsLoggedIn(true);
    setLoading(false);
    setPostsLoaded(true);
  }, [navigation, showToast]);

   useFocusEffect(useCallback(() => {
    loadCurrentUser();
  }, [loadCurrentUser]));

  useEffect(() => {
    const unsubscribe = UserStore.subscribeFollowState?.((payload) => {
      followRevisionRef.current += 1;
      setProfileStats((prev) => ({
        ...prev,
        following: Math.max(0, Number(prev.following || 0) + (payload.isFollowing ? 1 : -1)),
      }));
    });
    return () => { unsubscribe?.(); };
  }, []);

  const openEdit = () => {
    // Common user (koi subscription / role / blue tick nahi) profile edit nahi kar sakta —
    // sabhi Edit entry points (Edit Profile button, camera badge, saved-profile card)
    // isi function se guzarte hain, isliye gate yahin lagaya hai.
    if (profileTier.key === 'common') {
      showToast('Profile editing is available only after purchasing a subscription.', 'error', { title: 'Subscription required' });
      return;
    }
    // One state transition is shared by the web and native render branches.
    // Keeping Profile Details active prevents the post-view branch from
    // masking the edit form on Android/iOS.
    setForm({ ...savedProfile });
    setShowSavedProfile(true);
    setActiveMenu('profile'); // edit ke time My Posts highlight na rahe
    setIsEditing(true);
  };
  
  const closeEdit = () => { 
    setForm(savedProfile); 
    setIsEditing(false); 
    pendingImageUriRef.current = null; // NEW: cancel par pending image bhi discard
  };
  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    // ID card + appointment letter ab in 5 official seat roles ke liye milega.
  // Pratinidhi (role 6) is list me NAHI hai — usko ab na color milega na
  // document, wo ek plain premium subscriber jaisa treat hoga.
  const documentProfile = isEditing ? form : savedProfile;
  const documentSeatId = String(documentProfile?.state_seat?.seat_id || documentProfile?.seat_id || documentProfile?.subscription_plan?.seat_id || documentProfile?.subscription_plan?.role_id || documentProfile?.subscription_plan?.role || documentProfile?.role || '').trim().toLowerCase();
  const DOCUMENT_ELIGIBLE_SEAT_IDS = [
    'chief_editor_published', '1', 'executive_editor', '2',
    'deputy_editor_national', '3', 'public_relations_officer', '4',
    'national_bureau_chief', '5',
    'state_chief_editor', '6', 'state_bureau_chief', '7',
    'state_coordinator', '8', 'senior_state_correspondent', '9',
    'special_state_reporter', '10',
    'district_head', '11', 'district_bureau_chief', '12',
    'district_correspondent', '13', 'senior_district_reporter', '14',
    'district_coordinator', '15',
    'taluka_head', '16', 'taluka_correspondent', '17',
    'sub_reporter', '18', 'taluka_representative', '19',
    'regional_reporter', '20',
    'village_correspondent', '21', 'village_representative', '22',
    'village_reporter', '23', 'public_communication_associate', '24',
    'rural_reporter', '25',
  ];
  const hasDocumentSubscription = Boolean(documentProfile?.is_subscribed)
    && [documentSeatId, String(documentProfile?.subscription_plan?.role_id_raw || '').split(',')[0].trim().toLowerCase()].some((v) => DOCUMENT_ELIGIBLE_SEAT_IDS.includes(v));
     // Backend numeric status bhejta hai: 1 = pending, 0 = approved, 2 = rejected
    const profileRequestStatus = { 1: 'pending', 0: 'approved', 2: 'rejected' }[Number(savedProfile.profile_update_status)] || null;
  const profileRequestSignature = `${savedProfile.profile_update_status ?? ''}|${savedProfile.pending_bio ?? ''}|${savedProfile.pending_phone ?? ''}|${savedProfile.pending_profile_image_url ?? ''}`;

  // Naya status aaye (se pending se approved/rejected, ya naya request submit ho)
  // to purana "dismissed" flag reset kardo taaki naya notice dikhe.
  // Refresh ke baad bhi dismiss yaad rahe isliye AsyncStorage me signature check karte hain.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = `dismissed_profile_update_${savedProfile.email || 'guest'}`;
        const storedSignature = await AsyncStorage.getItem(key);
        if (!cancelled) setApprovalNoticeDismissed(storedSignature === profileRequestSignature);
      } catch (_) {
        if (!cancelled) setApprovalNoticeDismissed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileRequestSignature, savedProfile.email]);
  const profileRequestStatusMeta = {
    pending: { label: 'Pending admin approval', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    approved: { label: 'Approved by admin', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    rejected: { label: 'Rejected by admin', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  }[profileRequestStatus] || null;
  const handleGoHome = useCallback(() => { 
    if (isEditing) {
      closeEdit();
    } else {
      smartGoBack(navigation, 'Home');
    }
  }, [navigation, isEditing]);
  const handleOpenSettings = useCallback(() => { navigation?.navigate?.('Settings'); }, [navigation]);
  const handleOpenNotifications = useCallback(() => { navigation?.navigate?.('Notifications'); }, [navigation]);

  const handleShareProfile = useCallback(async () => {
    try {
      const name = (savedProfile?.name || 'RTI News Member').trim();
      const code = savedProfile?.referral_code || generateReferralCode(savedProfile?.email || '');
      const message = code ? `${name}\nReferral Code: ${code}\n\nRTI News App` : `${name}\n\nRTI News App`;
      await Share.share({ title: 'RTI News', message });
    } catch {}
  }, [savedProfile]);

  // Post News button removed from profile screen

  const openFollowList = async (type) => {
    if (!isLoggedIn) return;
    setFollowModalType(type);
    const followSummary = await UserStore.getFollowSummary(savedProfile.email);   // fresh API call click pe
    setFollowLists((prev) => ({
      ...prev,
      followers: Array.isArray(followSummary?.followers) ? followSummary.followers : [],
      following: Array.isArray(followSummary?.following) ? followSummary.following : [],
    }));
  };
  const closeFollowList = () => setFollowModalType('');
  const closeDocumentPreview = () => { setDocumentPreviewType(''); setIdCardSide('front'); };

  const openDocumentPreview = (type) => {
    setIdCardSide('front');
    if (!hasDocumentSubscription) {
      showToast('ID Card and Appointment Letter are available only with the Pratinidhi subscription.', 'error');
      return;
    }
    // Subscription check temporarily disabled — ID Card & Appointment Letter preview
    // ab sabke liye khulega, sirf profile complete hona chahiye.
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
    if (!code) { showToast('You will get a referral code after taking a subscription.', 'info'); return; }
    if (Platform.OS === 'web' && navigator?.clipboard) { navigator.clipboard.writeText(code); }
    else { Clipboard.setString(code); }
    showToast('Referral code copied!', 'success');
  };

// Free photo change use ho chuka: proper message + "Purchase Subscription" button
  const PHOTO_LIMIT_MESSAGE = 'Free photo change already used. Take a Role or Premium subscription to change your profile photo again.';
  const promptPhotoLimit = (message) => {
    const text = message || PHOTO_LIMIT_MESSAGE;
    const goToPlans = () => navigation.navigate('Subscription Plans', { returnTo: 'Profile' });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${text}\n\nOpen subscription plans?`)) goToPlans();
      return;
    }
    Alert.alert('Purchase Subscription', text, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Purchase Role Subscription', onPress: goToPlans },
    ]);
  };

const handlePickImage = async () => {
    if (!canPickPhoto) { promptPhotoLimit(); return; }
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
        
        // LOCAL PREVIEW (existing code, unchanged)
        if (typeof document !== 'undefined' && uri) {
          try { const dataUri = await compressImageToBase64(uri); handleChange('profile_image', dataUri); }
          catch { handleChange('profile_image', uri); }
        } else { handleChange('profile_image', uri); }

             // STAGE ONLY — koi API hit nahi yahan. Actual upload Save button (handleSave) par hoga.
        pendingImageUriRef.current = uri;

        showToast('Image selected. Tap Admin Approval to submit.', 'info');
      }
    } catch (err) { showToast('Unable to pick image right now.', 'error'); }
    finally { setUploading(false); }
  };

  const handleDownloadDocument = async (type) => {
    const profile = isEditing ? form : savedProfile;
    if (!hasDocumentSubscription) {
      showToast('ID Card and Appointment Letter are available only with the Pratinidhi subscription.', 'error');
      return;
    }
    // Subscription check temporarily disabled — ID Card & Appointment Letter
    // download ab sabke liye kaam karega, sirf profile complete hona chahiye.
    if (!hasDocumentSource(profile)) { showToast('Please complete profile details first.', 'error'); return; }
    try {
      setDownloadingDoc(type);
      let printWindow = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        printWindow = window.open('', '_blank');
        if (printWindow) { try { printWindow.document.open(); printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"/><title>Generating…</title></head><body style="font-family:Arial,sans-serif;padding:18px;color:#111827;"><h3 style="margin:0 0 8px 0;">Generating…</h3><div style="color:#6b7280;">Please wait.</div></body></html>'); printWindow.document.close(); } catch (_) {} }
      }
      const html = type === 'id-card' ? await buildIdCardFrontAndBackHtml(profile, { webPreview: Platform.OS === 'web' && Boolean(printWindow) }) : await buildAppointmentLetterHtml(profile, { webPreview: Platform.OS === 'web' && Boolean(printWindow) });
      if (Platform.OS === 'web' && printWindow) {
        printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
        try { const start = Date.now(); const timer = setInterval(() => { if (!printWindow || printWindow.closed) { clearInterval(timer); return; } const ready = Boolean(printWindow.__PDF_READY__); if (ready) { clearInterval(timer); try { printWindow.focus(); } catch (_) {} try { printWindow.print(); } catch (_) {} return; } if (Date.now() - start > 20000) { clearInterval(timer); try { printWindow.focus(); } catch (_) {} showToast('PDF tab is open. Click "Download PDF" in that tab to print/save.', 'success'); } }, 120); } catch (_) {}
        showToast("Preparing PDF... print dialog will open.", 'success'); return;
      }
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const printViaIframe = async (htmlToPrint) => { const iframe = document.createElement('iframe'); iframe.setAttribute('title', 'pdf-print'); iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;'; document.body.appendChild(iframe); const win = iframe.contentWindow; const doc = iframe.contentDocument || win?.document; if (!win || !doc) throw new Error('iframe not ready'); doc.open(); doc.write(htmlToPrint); doc.close(); const waitForImages = async (timeoutMs = 15000) => { const start = Date.now(); while (Date.now() - start < timeoutMs) { const imgs = Array.from(doc.images || []); const allOk = imgs.every((img) => img.complete && (typeof img.naturalWidth !== 'number' || img.naturalWidth > 0)); if (allOk) return; await new Promise((r) => setTimeout(r, 80)); } }; await waitForImages(); try { win.focus(); } catch (_) {} win.print(); setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 1200); }; try { await printViaIframe(html); showToast('Print dialog opened. Choose "Save as PDF" to download.', 'success'); } catch (_) { showToast('Unable to open print dialog.', 'error'); } return;
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
    if (!requirePremium(savedProfile, UserStore.hasActiveSubscription, showToast, navigation, 'Profile')) return;
    const nextBio = String(form.bio || '').trim();
    const nextContactRaw = String(form.contact_number || '').trim();
    const nextContactDigits = nextContactRaw.replace(/\D/g, '');

    if (nextContactDigits && nextContactDigits.length !== 10) { showToast('Enter a valid 10-digit mobile number.', 'error'); return; }

    // Sirf changed fields ka diff banao
    const prevBio = savedProfile.bio || '';
    const prevContact = savedProfile.contact_number || '';

    const changedFields = {};
    if (nextBio !== prevBio) changedFields.bio = nextBio;
    if ((nextContactDigits || '') !== prevContact) {
      changedFields.contact_number = nextContactDigits || '';
      changedFields.phone_number = nextContactDigits || '';
      changedFields.mobile_number = nextContactDigits || '';
    }

       const pendingImageUri = pendingImageUriRef.current;
    const hasChanges = Object.keys(changedFields).length > 0 || Boolean(pendingImageUri);
    if (!hasChanges) { showToast('No changes to save.', 'info'); return; }

    setSaving(true);
    const hasExistingImage = Boolean(savedProfile.profile_image);

    // NEW: image change ho to sabse pehle image hi upload karo — asli POST /profile
    // (ya /profile/image agar pehle se image hai) yahi Save button click par hit hota hai.
      let imageUpdatePayload = {};
    if (pendingImageUri) {
      const imgResult = await AuthAPI.updateProfileImage(pendingImageUri);

      if (!imgResult.ok) {
        setSaving(false);
        if (imgResult.isAuth) { showToast('Session expired. Please login again.', 'error'); return; }
        if (imgResult.needsSubscription) {
          // Free change pehle hi use ho chuka — pending image hatao, purani photo wapas dikhao, subscription prompt do
          pendingImageUriRef.current = null;
          handleChange('profile_image', savedProfile.profile_image || '');
          promptPhotoLimit(imgResult.message);
          return;
        }
        showToast(imgResult.message || 'Unable to upload image.', 'error');
        return;
      }
      pendingImageUriRef.current = null; // image upload ho gayi — bio fail ho to retry par dobara upload na ho

             if (savedProfile.profile_image && imgResult.pendingImageUrl) {
        imageUpdatePayload = {
          pending_profile_image_url: imgResult.pendingImageUrl,
          profile_update_status: imgResult.profileUpdateStatus ?? 1,
        };
        } else if (!hasExistingImage && imgResult.imageUrl) {
        imageUpdatePayload = { profile_image: imgResult.imageUrl };
      }
      // Har successful upload par count +1 (backend value mile to wahi, warna local +1)
      imageUpdatePayload = {
        ...imageUpdatePayload,
        profile_image_change_count: Number(imgResult.imageChangeCount ?? (Number(savedProfile.profile_image_change_count || 0) + 1)) || 1,
      };
    }

    // FIX: ab asli backend endpoint POST /profile hit hota hai— phone/bio ka
    // pending state backend khud manage karta hai (pending_phone/pending_bio).
    // Naam/email fields is endpoint ke through pending nahi hote (backend contract
    // sirf phone+bio confirm karta hai), isliye unhe yahan se drop kar diya —
    // agar backend inhe bhi support karta hai to bata dena, alag se jod denge.
     let profile = {};
    const hasTextChanges = changedFields.name !== undefined
      || changedFields.email !== undefined
      || changedFields.bio !== undefined
      || changedFields.contact_number !== undefined;

    if (hasTextChanges) {
      const apiResult = await AuthAPI.updateProfile({
        name: changedFields.name !== undefined ? changedFields.name : undefined,
        email: changedFields.email !== undefined ? changedFields.email : undefined,
        phone: changedFields.contact_number !== undefined ? changedFields.contact_number : undefined,
        bio: changedFields.bio !== undefined ? changedFields.bio : undefined,
      });
      if (!apiResult.ok) {
        setSaving(false);
        if (apiResult.isAuth) { showToast('Session expired. Please login again.', 'error'); return; }
        showToast(apiResult.message || 'Unable to send request.', 'error');
        return;
      }
      profile = apiResult.profile || {};
    }
    setSaving(false);

       // Backend firstname/lastname alag-alag bhejta hai, "name" ek nahi —
    // dono ko jodkar frontend ka single `name` field banao.
    const backendFullName = [profile.firstname, profile.lastname]
      .filter((part) => part && String(part).trim())
      .join(' ')
      .trim();

    const updated = await UserStore.updateUser(savedProfile.account_email || savedProfile.email, {
      // Naam/email approval ke bina hi turant apply hote hain (pending nahi) —
      // isliye backend response (ya fallback me humne jo bheja tha) seedha save karo.
      name: backendFullName || changedFields.name || savedProfile.name,
      email: profile.email || changedFields.email || savedProfile.email,
      pending_phone: profile.pending_phone ?? savedProfile.pending_phone ?? null,
      pending_bio: profile.pending_bio ?? savedProfile.pending_bio ?? null,
      profile_update_status: profile.profile_update_status ?? savedProfile.profile_update_status ?? null,
      ...imageUpdatePayload,
    });
    if (!updated) { showToast('Error saving request locally.', 'error'); return; }

    pendingImageUriRef.current = null; // NEW: save ke baad clear
    setSavedProfile(updated); setForm(updated); setIsEditing(false);
    showToast('Request successfully sent.', 'success');
    setSuccessMessage('Request successfully sent.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
    
     

   
     const renderProfileUpdateRequest = () => {
    // Koi status hi nahi -> kabhi koi request submit hi nahi hui, banner mat dikhao
    if (!profileRequestStatus) return null;
    // Approved/Rejected ka message user cross dabakar hata chuka hai -> ab mat dikhao
    const canDismiss = profileRequestStatus === 'approved' || profileRequestStatus === 'rejected';
    if (canDismiss && approvalNoticeDismissed) return null;
    const pendingPhone = savedProfile.pending_phone;
    const pendingBio = savedProfile.pending_bio;
    const pendingImage = savedProfile.pending_profile_image_url || savedProfile.pending_profile_image;
    if (!pendingPhone && !pendingBio && !pendingImage) return null;
    return (
      <View style={{ marginTop: 14, borderWidth: 1, borderColor: profileRequestStatusMeta?.border || '#e2e8f0', backgroundColor: profileRequestStatusMeta?.bg || '#f8fafc', borderRadius: 5, padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="clock" size={15} color={profileRequestStatusMeta?.color || '#64748b'} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a', fontFamily: 'Roboto, sans-serif' }}>Profile Update Request</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: profileRequestStatusMeta?.color || '#64748b', fontFamily: 'Roboto, sans-serif' }}>
              {profileRequestStatusMeta?.label || 'Request saved'}
            </Text>
                    {canDismiss ? (
              <TouchableOpacity
                onPress={() => {
                  setApprovalNoticeDismissed(true);
                  const key = `dismissed_profile_update_${savedProfile.email || 'guest'}`;
                  AsyncStorage.setItem(key, profileRequestSignature).catch(() => {});
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={16} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <Text style={{ fontSize: 12, color: '#64748b', fontFamily: 'Roboto, sans-serif' }}>
          {profileRequestStatus === 'rejected'
            ? 'This request has been rejected by the admin. These changes will not be applied.'
            : profileRequestStatus === 'approved'
            ? 'This request has been approved by the admin.'
            : 'These changes will be applied to your profile once approved by the admin.'}
        </Text>
        <View style={{ gap: 4 }}>
          {pendingPhone ? (
            <Text style={{ fontSize: 12, color: '#334155', fontFamily: 'Roboto, sans-serif' }}>Phone: <Text style={{ fontWeight: '700' }}>{pendingPhone}</Text></Text>
          ) : null}
          {pendingBio ? (
            <Text style={{ fontSize: 12, color: '#334155', fontFamily: 'Roboto, sans-serif' }} numberOfLines={2}>Bio: <Text style={{ fontWeight: '700' }}>{pendingBio}</Text></Text>
          ) : null}
          {pendingImage ? (
            <Text style={{ fontSize: 12, color: '#334155', fontFamily: 'Roboto, sans-serif' }}>Photo: <Text style={{ fontWeight: '700' }}>New photo submitted</Text></Text>
          ) : null}
        </View>
      </View>
    );
  };
   const displayProfile = isEditing ? form : savedProfile;
  const profileSeatId = String(displayProfile?.state_seat?.seat_id || '').trim();
  const displayHasBlueTick = Boolean(isLoggedIn && UserStore.hasBlueTick(displayProfile));
  // TEMP DEBUG: tick kyu nahi aa raha — confirm hone ke baad ye line hata dena
  console.log('[TICK-DEBUG]', JSON.stringify({ plan: displayProfile?.subscription_plan, is_subscribed: displayProfile?.is_subscribed, subscription_type: displayProfile?.subscription_type, role: displayProfile?.role, tick: displayHasBlueTick, referral: displayProfile?.referral_code }));
  const hasPremiumSubscription = Boolean(isLoggedIn && UserStore.hasPremiumAccess(displayProfile));
  // Premium + Verified tier ka header yellow hai -> white text dikhta nahi, isliye wahan black text/icons
  const isYellowTier = Boolean(isLoggedIn && ['premium', 'verified'].includes(getProfileTier({ ...displayProfile, has_blue_tick: UserStore.hasBlueTick(displayProfile) }).key));
  // Role Based Profile Look — 6-tier color theme (Common/Premium/Verified/
  // Representative/Executive/Chief). Subscription ya seat change hote he
  // pillTheme aur profileTier dono automatically naye role ke color me update
  // ho jaate hain, kyunki ye displayProfile se hi derive ho rahe hain.
  const profileTier = isLoggedIn
    ? getProfileTier({ ...displayProfile, has_blue_tick: displayHasBlueTick })
    : PROFILE_TIERS.common;
   // Edit Profile button (gradientDark) ka main shade = menu ka active color
   const menuActiveColor = (profileTier.gradientDark && profileTier.gradientDark[1]) || profileTier.accent;
  // Settings > "Update account and profile details" se aaye to seedha Edit Profile form khule.
  // Profile load hone ke baad (initializing false) ek hi baar chalega, phir param clear.
  useEffect(() => {
    if (!route?.params?.openEdit || initializing || !isLoggedIn) return;
    navigation.setParams?.({ openEdit: undefined });
    openEdit();
  }, [route?.params?.openEdit, initializing, isLoggedIn]);
   const pillTheme = { bg: `${profileTier.accent}1F`, border: profileTier.accent, text: profileTier.accent };
  // ✅ FIX: purchased seat ka asli naam (Pratinidhi, PRO, etc.) generic tier
  // label ("Authorised Representative") se hamesha priority lega.
   const canChangePhoto = profileTier.key !== 'common';   // Role / Premium / Verified wale hamesha photo badal sakte hain
  // ✅ Naya (common) user: 1 baar photo FREE badal sakta hai. Uske baad Role/Premium subscription chahiye.
  // Backend `profile_image_change_count` bheje to wahi use hota hai; na bheje to
  // "image pehle se hai / pending hai" ko "free change use ho chuka" maana jaata hai.
  const photoChangeCount = Number(
    displayProfile?.profile_image_change_count
    ?? (displayProfile?.pending_profile_image_url ? 1 : 0)
  ) || 0;
  const canPickPhoto = canChangePhoto || photoChangeCount < 1;
    const profileSeatKeyLC = String(displayProfile?.state_seat?.seat_id || '').trim().toLowerCase();
  const purchasedRoleLabel = Array.isArray(displayProfile?.subscription_plan?.role_names)
    ? displayProfile.subscription_plan.role_names.filter(Boolean).join(', ')
    : UserStore.getSeatRoleNameForPlanRoleId?.(
      displayProfile?.subscription_plan?.role_id_raw || displayProfile?.subscription_plan?.role_id || ''
    );
  const profileTierLabel = purchasedRoleLabel || (SEAT_ID_TO_TIER[profileSeatKeyLC]
    ? displayProfile?.state_seat?.seat_name
    : ((profileTier.key === 'premium' && !displayHasBlueTick && realPlanName(displayProfile?.subscription_plan?.plan_name)) || profileTier.label));
  const referralCode = displayProfile.referral_code || generateReferralCode(displayProfile.email);
  const canSeeReferral = Boolean(isLoggedIn && UserStore.hasActiveSubscription(displayProfile));
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
               source={form.profile_image ? { uri: form.profile_image } : AVATAR_IMAGE}
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
            {uploading ? 'Opening...' : (canPickPhoto ? 'Tap to change photo' : 'Free photo change used')}
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
          <TouchableOpacity style={ProfileStyles.submitButtonWrap} onPress={async () => {
            try { await handleSave(); }
            catch (e) { setSaving(false); showToast(e?.message || 'Something went wrong. Please try again.', 'error'); }
          }} disabled={saving} activeOpacity={0.85}>
            <LinearGradient
              colors={profileTier.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ProfileStyles.submitButton}
            >
              <Text style={ProfileStyles.submitButtonText}>{saving ? 'Sending...' : 'Admin Approval'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {renderProfileUpdateRequest()}
      </View>
    </View>
  );

  // Follow modal
  const followModal = (
    <Modal visible={Boolean(followModalType)} transparent animationType={Platform.OS === 'web' ? 'fade' : 'slide'} onRequestClose={closeFollowList}>
      <View style={[ProfileStyles.followModalOverlay, Platform.OS === 'web' && { justifyContent: 'center', alignItems: 'center' }]}>
        {/* web par bahar click se band ho */}
        {Platform.OS === 'web' ? <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={closeFollowList} /> : null}
        <View style={[ProfileStyles.followModalCard, Platform.OS === 'web' && { width: 440, maxWidth: '92%', borderRadius: 12 }]}>
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
                <TouchableOpacity key={item.id || item.email} style={ProfileStyles.followUserRow} activeOpacity={0.8}
                                  onPress={() => { closeFollowList(); navigation.navigate('UserPublicProfile', { userId: item.id || undefined, email: item.email, author: item }); }}
                >
                  <Image source={item.profile_image ? { uri: item.profile_image } : DEFAULT_AVATAR} style={ProfileStyles.followUserAvatar} />
                  <View style={ProfileStyles.followUserInfo}>
                    <NameWithTick name={item.name || 'User'} user={item} style={ProfileStyles.followUserName} />
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
      <View style={[ProfileStyles.followModalOverlay, { justifyContent: 'flex-start' }]}>
        <View style={[ProfileStyles.followModalCard, { width: '100%', height: '100%', maxHeight: '100%', borderRadius: 0, marginTop: 0, flex: 1 }]}>
          <View style={ProfileStyles.followModalHeader}>
            <Text style={ProfileStyles.followModalTitle}>
              {documentPreviewType === 'id-card' ? 'ID Card' : 'Appointment Letter'}
            </Text>
            <TouchableOpacity style={ProfileStyles.followModalClose} onPress={closeDocumentPreview} activeOpacity={0.75}>
              <Feather name="x" size={18} color="#111111" />
            </TouchableOpacity>
          </View>
          {documentPreviewType === 'id-card' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 10 }}>
              <TouchableOpacity
                onPress={() => setIdCardSide('front')}
                activeOpacity={0.85}
                style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: idCardSide === 'front' ? '#EB8C28' : '#f1f5f9' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: idCardSide === 'front' ? '#fff' : '#374151' }}>Front</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIdCardSide('back')}
                activeOpacity={0.85}
                style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: idCardSide === 'back' ? '#EB8C28' : '#f1f5f9' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: idCardSide === 'back' ? '#fff' : '#374151' }}>Back</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {documentPreviewType === 'id-card' ? (
              idCardSide === 'back' ? <AutoIdCardBackPreview /> : <AutoIdCardPreview profile={savedProfile} />
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
    // ✅ Ad post: NewsDetails (news-only) nahi, My Ads screen kholo (wahin edit/delete hai)
    if (post.is_ad) { navigation.navigate('MyAds'); return; }
    try { if (post.id) await UserStore.updateNewsFeedItem(post.id, 'view'); } catch {}
    navigation.navigate('NewsDetails', { article: post });
  };

  // Render ID Card & Appointment Letter section
  const renderDocumentsSection = () => {
    if (!hasDocumentSubscription || !hasDocumentSource(savedProfile)) return null;
    
    return (
      <View style={w.documentSection}>
        <Text style={w.documentSectionTitle}>Documents</Text>
        
     {/* ID Card */}
        <View style={w.documentCard}>
          <View style={[w.documentPreviewWrap, { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }]}>
            <TouchableOpacity onPress={() => openDocumentPreview('id-card')} activeOpacity={0.85}>
              <ScaledCard width={220} naturalWidth={360}>
                <AutoIdCardPreview profile={savedProfile} />
              </ScaledCard>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openDocumentPreview('id-card')} activeOpacity={0.85}>
              <ScaledCard width={220} naturalWidth={360}>
                <AutoIdCardBackPreview />
              </ScaledCard>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={w.downloadBtn} onPress={() => handleDownloadDocument('id-card')} activeOpacity={0.85}>
            <LinearGradient
              colors={profileTier.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={w.downloadBtnGradient}
            >
              <Feather name="download" size={14} color="#ffffff" />
              <Text style={w.downloadBtnText}>Download ID Card</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Appointment Letter */}
        <View style={w.documentCard}>
          <View style={w.documentPreviewWrap}>
            <TouchableOpacity onPress={() => openDocumentPreview('appointment-letter')} activeOpacity={0.85}>
              <ScaledCard width={194} naturalWidth={560}>
                <AutoAppointmentLetterPreview profile={savedProfile} />
              </ScaledCard>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={w.downloadBtn} onPress={() => handleDownloadDocument('appointment-letter')} activeOpacity={0.85}>
            <LinearGradient
              colors={profileTier.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={w.downloadBtnGradient}
            >
              <Feather name="download" size={14} color="#ffffff" />
              <Text style={w.downloadBtnText}>Download Appointment Letter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render user posts with grid/list toggle
  const renderUserPosts = () => {
    const isGrid = postViewMode === 'grid';
    const isNativeApp = Platform.OS !== 'web';
    const gridGap = 3;
    const nativeGridWidth = Math.max(windowWidth - 24, 300);
    const nativeTileSize = Math.floor((nativeGridWidth - gridGap * 2) / 3);
    const isVideoUri = (value) => {
      const uri = String(value || '').trim();
      if (/^data:video/i.test(uri)) return true;
      return /\.(mp4|m4v|mov|webm|ogv|m3u8|avi|mkv|3gp)(\?.*)?(#.*)?$/i.test(uri);
    };
    const isImageUri = (value) => {
      const uri = String(value || '').trim();
      if (isVideoUri(uri)) return false;
      return /^(https?:|file:|content:|data:image|blob:)/i.test(uri);
    };
    const firstVideoUri = (values) => {
      for (const value of values) {
        if (Array.isArray(value)) {
          const nested = firstVideoUri(value);
          if (nested) return nested;
        } else if (value && typeof value === 'object') {
          const nested = firstVideoUri([value.uri, value.url]);
          if (nested) return nested;
        } else if (typeof value === 'string' && isVideoUri(value)) {
          return value.trim();
        }
      }
      return '';
    };
    const getPostVideo = (post = {}) => {
      const direct = [post.video, post.video_url, post.videoUrl, post.videoUri, post.videos];
      for (const v of direct) {
        const uri = typeof v === 'string' ? v : (Array.isArray(v) ? (typeof v[0] === 'string' ? v[0] : v[0]?.uri || v[0]?.url) : (v?.uri || v?.url));
        if (uri && String(uri).trim()) return String(uri).trim();
      }
      return firstVideoUri([post.media, post.images, post.image, post.file, post.attachment]);
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
            No posts yet. 
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View style={w.postViewToggle}>
          <TouchableOpacity
            onPress={() => setPostViewMode('grid')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isGrid ? profileTier.gradient : ['#f8fafc', '#f8fafc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[w.postViewGradientBtn, isGrid && w.postViewGradientBtnActive]}
            >
              <Feather name="grid" size={18} color={isGrid ? '#ffffff' : '#64748b'} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPostViewMode('list')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!isGrid ? profileTier.gradient : ['#f8fafc', '#f8fafc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[w.postViewGradientBtn, !isGrid && w.postViewGradientBtnActive]}
            >
              <Feather name="list" size={18} color={!isGrid ? '#ffffff' : '#64748b'} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {isGrid ? (
          <View style={[w.postGrid, isNativeApp && { gap: 0, paddingHorizontal: 0 }]}>
            {userPosts.map((post, index) => {
              const postImage = getPostImage(post);
              const postVideo = getPostVideo(post);
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
                  <PostGridThumb
                    imageUri={postImage}
                    videoUri={postVideo}
                    fallback={(
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
                  />
                  {(postVideo || postKind.includes('video')) && (postImage || postVideo) ? (
                    <View pointerEvents="none" style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="play" size={12} color="#ffffff" />
                    </View>
                  ) : null}
                  {Array.isArray(post.images) && post.images.length > 1 && !postVideo ? (
                    <View pointerEvents="none" style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="copy" size={12} color="#ffffff" />
                    </View>
                  ) : null}
                  {post.is_ad ? (
                    <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: '#f59e0b', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff' }}>AD</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          userPosts.map((post, index) => (
            <TouchableOpacity key={post.id || index} style={w.postCard} onPress={() => openUserPost(post)} activeOpacity={0.85}>
              <View style={w.postHeader}>
                <Image
               source={savedProfile.profile_image ? { uri: savedProfile.profile_image } : AVATAR_IMAGE}
                  style={w.postAvatar}
                />
                <View>
                  <Text style={w.postAuthor}>{savedProfile.name || 'User'}</Text>
                  <Text style={w.postTime}>{new Date(post.createdAt || post.date || Date.now()).toLocaleDateString()}{post.is_ad ? '  •  Advertisement' : ''}</Text>
                </View>
              </View>
              <Text style={w.postContent}>{post.content || post.title || post.description || ''}</Text>
              {(getPostImage(post) || getPostVideo(post)) ? (
                <View style={[w.postImage, { overflow: 'hidden' }]}>
                  <PostGridThumb imageUri={getPostImage(post)} videoUri={getPostVideo(post)} />
                </View>
              ) : null}
              <View style={w.postActions}>
  {post.is_ad ? (
    <View style={w.postActionBtn}>
      <Feather name="eye" size={18} color="#64748b" />
      <Text style={w.postActionText}>{post.views || 0}</Text>
    </View>
  ) : null}
  {!post.is_ad ? (
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
  ) : null}

  {!post.is_ad ? (
  <TouchableOpacity
    style={w.postActionBtn}
    activeOpacity={0.75}
    onPress={() => openUserPost(post)}
  >
    <Feather name="message-circle" size={18} color="#64748b" />
    <Text style={w.postActionText}>{post.comments || 0}</Text>
  </TouchableOpacity>
  ) : null}

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
                style={[w.toggleBtn, !showSavedProfile && w.toggleBtnActive, !showSavedProfile && { backgroundColor: pillTheme.border, shadowColor: pillTheme.border }]}
        onPress={() => setShowSavedProfile(false)}
        activeOpacity={0.8}
      >
        <Text style={[w.toggleBtnText, !showSavedProfile && w.toggleBtnTextActive]}>
          My Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
               style={[w.toggleBtn, showSavedProfile && w.toggleBtnActive, showSavedProfile && { backgroundColor: pillTheme.border, shadowColor: pillTheme.border }]}
        onPress={() => setShowSavedProfile(true)}
        activeOpacity={0.8}
      >
        <Text style={[w.toggleBtnText, showSavedProfile && w.toggleBtnTextActive]}>
          Profile Details
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Combined Stats Row Component - No border
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
                    <Text style={[w.referralCodeCompact, { color: pillTheme.text }]}>{referralCode || '—'}</Text>
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
  // WEB DESKTOP — RTI NEWS reference-design profile page.
  // ══════════════════════════════════════════════════════════════════
  const renderRtiNewsWebProfile = () => {
    const accent = profileTier.accent;
    const gradient = profileTier.gradient;
    // Yellow Premium artwork needs dark green copy for readable contrast.
    // Ordinary/free profiles keep their original neutral grey copy.
    const primaryProfileText = hasPremiumSubscription ? '#14532D' : '#111827';
    const secondaryProfileText = hasPremiumSubscription ? '#3F6F57' : '#6B7280';
    const joinedRaw = savedProfile.created_at || savedProfile.createdAt || '';
    const joinedLabel = joinedRaw
      ? new Date(joinedRaw).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const bioText = displayProfile.bio || 'RTI Activist | Transparency Advocate | Fighting for a better and transparent India.';

    if (!isLoggedIn) {
      return (
        <View style={w.page}>
          {renderWebTopHeader(accent, gradient)}
          <View style={w.guestWrap}>
            <View style={w.guestCard}>
              <View style={[w.guestIconWrap, { backgroundColor: `${accent}1A` }]}>
                <Feather name="user" size={30} color={accent} />
              </View>
              <Text style={w.guestTitle}>Login to view your profile</Text>
              <TouchableOpacity
                style={[w.emptyBtn, { backgroundColor: accent }]}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Feather name="log-in" size={15} color="#ffffff" />
                <Text style={w.emptyBtnText}>Login / Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (isEditing) {
      return (
        <View style={w.page}>
          {renderWebTopHeader(accent, gradient)}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{ width: '100%', maxWidth: 560 }}>{editProfileForm}</View>
          </ScrollView>
        </View>
      );
    }

    const NAV_ITEMS = [
      { key: 'profile', label: 'My Profile', icon: 'user', active: !showSavedProfile === false && true, onPress: () => setShowSavedProfile(true) },
      { key: 'posts', label: 'My Posts', icon: 'file-text', onPress: () => setShowSavedProfile(false) },
      { key: 'wallet', label: 'Wallet', icon: 'credit-card', onPress: () => navigation.navigate('Wallet', { returnTo: 'Profile' }) },
      { key: 'referral', label: 'Referral Program', icon: 'gift', onPress: () => navigation.navigate('Refer') },
    ];

    return (
      <View style={[w.page, { overflow: 'auto' }]}>
        {renderWebTopHeader(accent, gradient)}
       <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ maxWidth: 1240, width: '100%', marginHorizontal: 'auto' }}>
           <View style={[w.tabBarRow, { display: 'none' }]}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[w.tabBarItem, item.key === 'profile' && { borderBottomColor: accent, borderBottomWidth: 2 }]}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                >
                  <Feather name={item.icon} size={16} color={item.key === 'profile' ? accent : '#4b5563'} />
                  <Text style={[w.navItemText, item.key === 'profile' && { color: accent, fontWeight: '700' }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
                           <TouchableOpacity style={w.tabBarItem} onPress={() => navigation.navigate('My Subscriptions')} activeOpacity={0.75}>
                <Feather name="star" size={16} color={accent} />
                <Text style={[w.navItemText, { color: accent, fontWeight: '700' }]}>
                  {realPlanName(savedProfile?.subscription_plan?.plan_name) || 'Premium'}
                </Text>
              </TouchableOpacity>
            </View>

       <View style={[w.body, isWebNarrow && w.bodyNarrow, { maxWidth: '100%', marginHorizontal: 0, paddingTop: 20 }]}>
            <View style={w.mainCol}>
              {/* Profile summary card */}
              <View style={w.card}>
                <View style={[w.profileHeadRow, isWebNarrow && w.profileHeadRowNarrow]}>
                 <View style={w.avatarBox}>
                    <Image
                     source={displayProfile.profile_image ? { uri: displayProfile.profile_image } : AVATAR_IMAGE}
                      style={w.avatarImg}
                    />
                <TouchableOpacity onPress={openEdit} activeOpacity={0.8} style={!canPickPhoto ? { display: 'none' } : null}>
                      <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={w.cameraBtn}
                      >
                        <Feather name="camera" size={14} color="#ffffff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  <View style={w.profileInfoCol}>
                    <View style={w.nameRow}>
                      <Text style={[w.nameText, { color: primaryProfileText }]}>{displayProfile.name || 'Your Name'}</Text>
                      {displayHasBlueTick ? <VerifiedBadge size={16} /> : null}
                    </View>
                    {generateMemberId(displayProfile.email) ? (
                      <Text style={[w.memberIdText, { color: secondaryProfileText }]}>Member ID: {generateMemberId(displayProfile.email)}</Text>
                    ) : null}
                               {displayProfile.state ? (
                      <View style={w.locationRow}>
                        <Feather name="map-pin" size={12} color={secondaryProfileText} />
                        <Text style={[w.locationText, { color: secondaryProfileText }]}>{displayProfile.state}, India</Text>
                      </View>
                    ) : null}
                    {displayProfile.bio ? (
                      <Text style={[w.profileBioText, { color: primaryProfileText }]}>{displayProfile.bio}</Text>
                    ) : null}
                    {canSeeReferral && referralCode ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={[w.memberIdText, { color: secondaryProfileText }]}>Referral Code:</Text>
                        <Text style={[w.referralCodeCompact, { color: accent }]}>{referralCode}</Text>
                        <TouchableOpacity onPress={handleCopyReferralCode} activeOpacity={0.7}>
                          <Feather name="copy" size={14} color={accent} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    <View style={[w.tierPill, { backgroundColor: `${accent}1F`, borderColor: accent }]}>
                                           <Text style={[w.tierPillText, { color: accent }]}>{profileTierLabel}</Text>
                    </View>
                  </View>

                  <View style={[w.statsBox, isWebNarrow && { marginTop: 12 }]}>
                    <View style={w.statItem}>
                      <Text style={w.statNum}>{userPosts.length}</Text>
                      <Text style={w.statLabel}>Posts</Text>
                    </View>
                    <TouchableOpacity style={w.statItem} activeOpacity={0.7} onPress={() => openFollowList('followers')}>
                      <Text style={w.statNum}>{profileStats.followers}</Text>
                      <Text style={w.statLabel}>Followers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={w.statItem} activeOpacity={0.7} onPress={() => openFollowList('following')}>
                      <Text style={w.statNum}>{profileStats.following}</Text>
                      <Text style={w.statLabel}>Following</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                              <View style={[w.actionsRow, { alignItems: 'center' }]}>
                  <TouchableOpacity onPress={openEdit} activeOpacity={0.85} style={{ flex: 1 }}>
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={w.editProfileBtn}
                    >
                      <Text style={[w.editProfileBtnText, isYellowTier && { color: '#111111', fontWeight: '600' }]}>Edit Profile</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* My Posts card */}
              <View style={w.card}>
                <View style={w.cardHeaderRow}>
                  <Text style={w.cardHeading}>My Posts</Text>
                  <TouchableOpacity onPress={() => setShowSavedProfile(false)} activeOpacity={0.7}>
                    <Text style={[w.viewAllLink, { color: accent }]}>View All</Text>
                  </TouchableOpacity>
                </View>
                {!postsLoaded && userPosts.length === 0 ? (
                  <View style={[w.emptyBox, { minHeight: 180 }]}>
                    <ActivityIndicator size="small" color={accent} />
                  </View>
                ) : userPosts.length === 0 ? (
                  <View style={w.emptyBox}>
                    <View style={[w.emptyIconWrap, { backgroundColor: `${accent}14` }]}>
                      <Feather name="file-text" size={26} color={accent} />
                    </View>
                    <Text style={w.emptyTitle}>No posts yet</Text>
                    <Text style={w.emptySub}>You haven't created any posts yet.</Text>
                    <TouchableOpacity
                      style={[w.emptyBtn, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: accent }]}
                      onPress={() => navigation.navigate('Add News')}
                      activeOpacity={0.85}
                    >
                      <Text style={[w.emptyBtnText, { color: '#111827' }]}>Create Post</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ paddingTop: 4 }}>{renderUserPosts()}</View>
                )}
              </View>

              {/* Documents Section - ID Card & Appointment Letter */}
              {renderDocumentsSection()}
            </View>

           {/* Right column - Removed About Me container */}
            <View style={w.rightCol}>
              {/* Removed About Me card as requested */}
            </View>
          </View>
          </View>
        </ScrollView>
        {followModal}
      </View>
    );
  };

  // ✅ Profile ka web header ab baaki modules jaisa hi hai — wahi shared
  // component. Fark sirf itna: yahan background image user ke KHARIDE HUE
  // subscription/tier ki image hoti hai (profileTier.bgImage), isliye Chief
  // wale ko red, Executive ko purple, Premium ko green header dikhta hai.
  const renderWebTopHeader = (accent, gradient) => (
    <ModuleWebHeader
      title="My Profile"
      navigation={navigation}
      onBack={handleGoHome}
      bgImage={profileTier.bgImage}
     avatarUri={displayProfile.profile_image || null}
      avatarBgImage={profileTier.bgImage}
      avatarBgColor={profileTier.accent}
      highContrast={hasPremiumSubscription || isYellowTier}
    />
  );

  if (redirectingToSidebar) return null;

  if (Platform.OS === 'web') {
    return renderRtiNewsWebProfile();
  }

  // ══════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT (iOS / Android) — unchanged
  // ══════════════════════════════════════════════════════════════════

       return (
    <View style={Platform.OS === 'web' ? { flex: 1, backgroundColor: '#ffffff', minHeight: '100vh', width: '100%' } : { flex: 1 }}>
    <View style={[ProfileStyles.root, Platform.OS === 'web' && { maxWidth: 800, width: '100%', marginHorizontal: 'auto', minHeight: '100vh' }]}>
      <ScrollView style={ProfileStyles.scrollView} contentContainerStyle={ProfileStyles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ImageBackground
  source={profileTier.bgImage}
  resizeMode="cover"
  style={[ProfileStyles.greenHeader, { backgroundColor: profileTier.gradientDark?.[1] || profileTier.accent }]}
  imageStyle={ProfileStyles.greenHeaderImage}
>

                 <View style={[ProfileStyles.greenHeaderTop, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={handleGoHome}>
              <Feather name="arrow-left" size={20} color={isYellowTier ? '#111111' : '#FFFFFF'} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Web header jaisa: Subscription + Settings + Notifications */}
              <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={() => navigation?.navigate?.('Subscription Plans')} accessibilityLabel="Subscription">
                <Feather name="award" size={20} color={isYellowTier ? '#111111' : '#FFFFFF'} />
              </TouchableOpacity>
              <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={handleOpenSettings} accessibilityLabel="Settings">
                <Feather name="settings" size={20} color={isYellowTier ? '#111111' : '#FFFFFF'} />
              </TouchableOpacity>
              <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={handleOpenNotifications} accessibilityLabel="Notifications">
                <Feather name="bell" size={20} color={isYellowTier ? '#111111' : '#FFFFFF'} />
              </TouchableOpacity>
              <TouchableOpacity style={ProfileStyles.greenHeaderIcon} onPress={handleShareProfile}>
                <Feather name="more-vertical" size={20} color={isYellowTier ? '#111111' : '#FFFFFF'} />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
              <View style={ProfileStyles.profileShell}>
                {isEditing ? (
            editProfileForm
          ) : initializing ? (
            <View style={[ProfileStyles.summaryCard, { alignItems: 'center', justifyContent: 'center', minHeight: 220 }]}>
              <ActivityIndicator size="large" color="#F97316" />
            </View>
          ) : (
            <>
              {isLoggedIn ? (
                // ── Role Based Profile Look — profileTier/getProfileTier same
                // rehta hai (Common/Premium/Verified/Representative/Executive/
                // Chief), sirf UI ab reference design ke according hai ────────
                <View style={ProfileStyles.summaryCard}>
                  <View style={ProfileStyles.profileCardAvatarWrap}>
                    <View style={ProfileStyles.profileCardAvatarRing}>
                      <Image
                        source={displayProfile.profile_image ? { uri: displayProfile.profile_image } : AVATAR_IMAGE}
                        style={ProfileStyles.profileCardAvatar}
                      />
                     <LinearGradient
  colors={profileTier.gradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
style={[ProfileStyles.avatarCameraBadge, !canPickPhoto && { display: 'none' }]}
>
  <TouchableOpacity
    style={ProfileStyles.avatarCameraBadgeInner}
    onPress={openEdit}
    activeOpacity={0.8}
  >
    <Feather name="camera" size={12} color="#FFFFFF" />
  </TouchableOpacity>
</LinearGradient>
                    </View>

                    <View style={ProfileStyles.roleShieldBadge}>
                      <MaterialCommunityIcons name="shield" size={40} color={profileTier.accent} />
                      <MaterialCommunityIcons name="crown" size={17} color="#FFD700" style={ProfileStyles.roleShieldCrown} />
                    </View>
                  </View>

                  <View style={ProfileStyles.profileCardBody}>
                    <View style={ProfileStyles.profileCardNameRow}>
                      <Text style={ProfileStyles.profileCardName}>
                        {displayProfile.name || 'Your Name'}
                      </Text>
                      {displayHasBlueTick ? <VerifiedBadge size={20} /> : null}
                    </View>

                    {/* <Text style={ProfileStyles.profileCardUsername}>
                      @{displayProfile.username || 'ankityadav123'}
                    </Text> */}

                    {generateMemberId(displayProfile.email) ? (
                      <Text style={ProfileStyles.profileCardUsername}>
                        Member ID: {generateMemberId(displayProfile.email)}
                      </Text>
                    ) : null}

                                       {displayProfile.state ? (
                      <View style={ProfileStyles.profileCardLocation}>
                        <MaterialIcons name="location-on" size={11} color="#555555" />
                        <Text style={ProfileStyles.profileCardLocationText}>
                          {displayProfile.state}, India
                        </Text>
                      </View>
                    ) : null}

                    {displayProfile.bio ? (
                      <Text style={ProfileStyles.profileCardBioText}>{displayProfile.bio}</Text>
                    ) : null}
                  </View>

                  <View style={ProfileStyles.profileStatsExact}>
                    <View style={ProfileStyles.profileStatExact}>
                      <Text style={ProfileStyles.profileStatNumberExact}>{userPosts.length}</Text>
                      <Text style={ProfileStyles.profileStatLabelExact}>Posts</Text>
                    </View>

                    <TouchableOpacity style={ProfileStyles.profileStatExact} onPress={() => openFollowList('followers')}>
                      <Text style={ProfileStyles.profileStatNumberExact}>{profileStats.followers}</Text>
                      <Text style={ProfileStyles.profileStatLabelExact}>Followers</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={ProfileStyles.profileStatExact} onPress={() => openFollowList('following')}>
                      <Text style={ProfileStyles.profileStatNumberExact}>{profileStats.following}</Text>
                      <Text style={ProfileStyles.profileStatLabelExact}>Following</Text>
                    </TouchableOpacity>
                  </View>

                   <LinearGradient
  colors={profileTier.gradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={ProfileStyles.premiumPillExact}
>
  <Text style={ProfileStyles.premiumPillTextExact}>
    {profileTierLabel}
  </Text>
</LinearGradient>
                  <View style={ProfileStyles.profileActionsExact}>
                   <TouchableOpacity style={ProfileStyles.editProfileExact} onPress={openEdit} activeOpacity={0.85}>
   <LinearGradient
    colors={profileTier.gradientDark}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={ProfileStyles.editProfileGradient}
  >
    <Text style={ProfileStyles.editProfileExactText}>Edit Profile</Text>
  </LinearGradient>
</TouchableOpacity>

                  </View>
                </View>
              ) : (
                <View style={ProfileStyles.summaryCard}>
                  <View style={ProfileStyles.summaryTopRow}>
                    <View style={ProfileStyles.avatarRing}>
                      <Image source={DEFAULT_AVATAR} style={ProfileStyles.avatar} />
                      <View style={ProfileStyles.onlineDot} />
                    </View>
                    <View style={ProfileStyles.summaryContent}>
                      <View style={ProfileStyles.headerNameRow}>
                        <View style={ProfileStyles.profileNameRow}>
                          <Text style={ProfileStyles.profileName}>RTI News Member</Text>
                        </View>
                      </View>
                      <View style={ProfileStyles.statsRow}>
                        <View style={ProfileStyles.statItem}>
                          <Text style={ProfileStyles.statValue}>{userPosts.length}</Text>
                          <Text style={ProfileStyles.statLabel}>posts</Text>
                        </View>
                        <View style={ProfileStyles.statItem}>
                          <Text style={ProfileStyles.statValue}>0</Text>
                          <Text style={ProfileStyles.statLabel}>followers</Text>
                        </View>
                        <View style={ProfileStyles.statItem}>
                          <Text style={ProfileStyles.statValue}>0</Text>
                          <Text style={ProfileStyles.statLabel}>following</Text>
                        </View>
                      </View>
                      <View style={ProfileStyles.summaryRankRow}>
                        <Text style={ProfileStyles.summaryRankEmoji}>👤</Text>
                        <Text style={[ProfileStyles.summaryRankText, { color: '#AAAAAA' }]}>Guest</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
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
                            <View style={ProfileStyles.profileMenuExact}>
                  <TouchableOpacity style={ProfileStyles.profileMenuItemExact} onPress={() => { setActiveMenu('posts'); setShowSavedProfile(false); }} activeOpacity={0.75}>
                    <Feather name="file-text" size={20} color={activeMenu === 'posts' ? menuActiveColor : '#263238'} />
                    <Text style={[ProfileStyles.profileMenuTextExact, activeMenu === 'posts' && { color: menuActiveColor, fontWeight: '700' }]}>My Posts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={ProfileStyles.profileMenuItemExact} onPress={() => { setActiveMenu('wallet'); navigation.navigate('Wallet', { returnTo: 'Profile' }); }} activeOpacity={0.75}>
                    <Feather name="credit-card" size={20} color={activeMenu === 'wallet' ? menuActiveColor : '#263238'} />
                    <Text style={[ProfileStyles.profileMenuTextExact, activeMenu === 'wallet' && { color: menuActiveColor, fontWeight: '700' }]}>Wallet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[ProfileStyles.profileMenuItemExact, !canSeeReferral && { display: 'none' }]} onPress={() => { setActiveMenu('referral'); navigation.navigate('Refer'); }} activeOpacity={0.75}>
                    <Feather name="gift" size={20} color={activeMenu === 'referral' ? menuActiveColor : '#263238'} />
                    <Text style={[ProfileStyles.profileMenuTextExact, activeMenu === 'referral' && { color: menuActiveColor, fontWeight: '700' }]}>Referral Program</Text>
                  </TouchableOpacity>

                                      <TouchableOpacity style={ProfileStyles.profileMenuItemExact} onPress={() => navigation.navigate('My Subscriptions')} activeOpacity={0.75}>
                    <Feather name="star" size={20} color={profileTier.accent} />
                    <Text style={[ProfileStyles.profileMenuTextExact, ProfileStyles.profileMenuPremiumTextExact, { color: profileTier.accent }]}>
                      {realPlanName(savedProfile?.subscription_plan?.plan_name) || 'Premium Features'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

                                         {isLoggedIn ? (
  (canSeeReferral ? <ReferralRow referralCode={referralCode} onCopy={handleCopyReferralCode} color={menuActiveColor} /> : null)
) : null}

              {isLoggedIn ? (
                <>
                  {showSavedProfile ? (
                    <>
                      {renderProfileUpdateRequest()}
                      {hasDocumentSubscription ? <SavedProfileCard
                        profile={savedProfile}
                        profileTier={profileTier}
                        onEdit={openEdit}
                        onOpenIdCard={() => openDocumentPreview('id-card')}
                        onOpenAppointmentLetter={() => openDocumentPreview('appointment-letter')}
                        onDownloadIdCard={() => handleDownloadDocument('id-card')}
                        onDownloadAppointmentLetter={() => handleDownloadDocument('appointment-letter')}
                      /> : null}
                    </>
                  ) : (
                    <View style={{ paddingHorizontal: 8 }}>
                      <TouchableOpacity onPress={() => { setShowSavedProfile(true); setActiveMenu('profile'); }} style={{ marginBottom: 10 }}>
                        <Text style={{ color: ORANGE, fontWeight: '700' }}>← Back to Profile Details</Text>
                      </TouchableOpacity>
                      {renderUserPosts()}
                    </View>
                  )}
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {followModal}
      {documentPreviewModal}

           {Platform.OS !== 'web' ? (
        <View style={ProfileStyles.bottomShell}>
          <AppNavbar navigation={navigation} activeScreen="Profile" hideTopHeader={true} />
        </View>
      ) : null}
    </View>
    </View>
  );
}