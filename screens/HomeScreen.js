import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import WebLayout from '../components/WebLayout';
import { UserStore } from '../store/UserStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/ui/ToastProvider';
import AdLeadFormModal from '../components/AdLeadFormModal';
import HomePromoPopup from '../components/HomePromoPopup';
import { getSiteCopy } from '../constants/siteCopy';
// import { IS_WEB, DEMO_STORIES, FEATURED_STATE_OPTIONS } from '../constants/homeData';
import { IS_WEB, FEATURED_STATE_OPTIONS } from '../constants/homeData';
import {
  normalizeStoryItem, dedupeStories, storyMatchesMenu,
  buildHomeStateFromParams, buildPanelContent, buildStateDistrictList,
} from '../utils/storyHelpers';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';
import { openExternalUrl } from '../utils/adRedirect';
import NewsFeedCard from '../components/NewsFeedCard';
import NewsMenuSidebar from '../components/NewsMenuSidebar';
import LeftEcomSidebar from '../components/LeftEcomSidebar';
import StateDirectorySection from '../components/StateDirectorySection';
import RightUtilityPanel from '../components/RightUtilityPanel';
import MarqueeMenuBar from '../components/MarqueeMenuBar';

const PINK = '#FF2D78';
const PINK_LIGHT = '#fff5f9';
const PINK_BORDER = '#ffe0ed';
const PINK_MUTED = '#fdf2f7';

function storyMatchesLanguage(story, selectedLanguage) {
  const activeLanguage = String(selectedLanguage || '').trim().toLowerCase();
  if (!activeLanguage) return true;
  const storyLanguage = String(story?.language || story?.lang || story?.news_language || '').trim().toLowerCase();
  if (!storyLanguage) return true;
  return storyLanguage === activeLanguage;
}

function homeStoryFromAd(ad = {}) {
  const photo = String(
    ad.photo || ad.image || ad.image_url || ad.images?.[0] || ad.photos?.[0] || ''
  ).trim();
  return {
    id: String(ad.feed_id || `ad-feed-${ad.id || Date.now()}`),
    isAd: true,
    title: ad.title || 'Sponsored Advertisement',
    subtitle: 'Sponsored',
    excerpt: ad.description || '',
    description: ad.description || '',
    category: 'Sponsored',
    menuTags: ['latest', 'viral'],
    image: photo,
    images: photo ? [photo] : [],
    video: '',
    state: ad.state || '',
    district: ad.district || '',
    date: ad.updated_at || ad.created_at || '',
    publishedAgo: ad.updated_at || ad.created_at || '',
    author_name: ad.owner_name || 'Advertiser',
    author_profile_image: ad.owner_profile_image || '',
    author_has_blue_tick: Boolean(ad.owner_has_blue_tick),
    createdBy: ad.owner_email || '',
    owner_email: ad.owner_email || '',
    owner_name: ad.owner_name || 'Advertiser',
    owner_profile_image: ad.owner_profile_image || '',
    owner_role_label: ad.owner_role_label || 'Sponsored',
    owner_has_blue_tick: Boolean(ad.owner_has_blue_tick),
    owner_mobile: ad.owner_mobile || '',
    redirect: ad.redirect || 'profile',
    extraValues: ad.extraValues || {},
    allowCalls: ad.allowCalls !== false,
    originalAdId: ad.id,
    comments: 0,
    shares: 0,
    likes: 0,
    views: 0,
  };
}

function interleaveAdStories(stories = [], ads = []) {
  if (!ads.length) return stories;
  if (!stories.length) return ads;
  const mixed = [];
  let adIndex = 0;
  stories.forEach((story, index) => {
    mixed.push(story);
    if ((index + 1) % 3 === 0 && adIndex < ads.length) {
      mixed.push(ads[adIndex]);
      adIndex += 1;
    }
  });
  return [...mixed, ...ads.slice(adIndex)];
}
function homeStoryFromEcome(item = {}) {
  const image = item.image || item.images?.[0] || item.photos?.[0] || item.mediaItems?.[0]?.uri || '';
  return {
    id: `ecome-${item.id || item.ecom_id || Date.now()}`,
    isEcome: true,
    title: item.product_name || item.title || 'Ecome listing',
    description: item.description || '',
    image,
    price: item.price || '',
    quantity: item.quantity || '',
    city: item.city || item.location || '',
    category: item.category || 'Ecome',
    menuTags: ['latest'],
    sellerName: item.seller_name || item.owner_name || 'Verified seller',
  };
}

function interleaveHomeStories(news = [], ads = [], ecomeListings = []) {
  const combined = interleaveAdStories(news, ads);
  if (!ecomeListings.length) return combined;
  const result = [];
  let ecomeIndex = 0;
  combined.forEach((item, index) => {
    result.push(item);
   if ((index + 1) % 4 === 0) {
      for (let n = 0; n < 2 && ecomeIndex < ecomeListings.length; n += 1) result.push(ecomeListings[ecomeIndex++]);
    }
  });
  return [...result, ...ecomeListings.slice(ecomeIndex)];
}

function EcomeGridCard({ item, navigation }) {
  return (
    <TouchableOpacity style={ecomeRowStyles.cell} activeOpacity={0.88} onPress={() => navigation.navigate('FarmingBuy')}>
      {item.image
        ? <Image source={{ uri: item.image }} style={ecomeRowStyles.image} resizeMode="cover" />
        : <View style={[ecomeRowStyles.image, ecomeRowStyles.imageFallback]}><Ionicons name="storefront-outline" size={28} color="#dc2626" /></View>}
      <View style={ecomeRowStyles.body}>
        <View style={ecomeRowStyles.topRow}>
          <Text style={ecomeRowStyles.badge}>ECOME</Text>
          <Text style={ecomeRowStyles.category} numberOfLines={1}>{item.category}</Text>
        </View>
        <Text style={ecomeRowStyles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={ecomeRowStyles.price} numberOfLines={1}>{item.price ? `₹${item.price}` : 'Contact for price'}</Text>
        <View style={ecomeRowStyles.footer}>
          <Text style={ecomeRowStyles.seller} numberOfLines={1}>{item.city || item.sellerName}</Text>
          <Ionicons name="arrow-forward" size={13} color="#dc2626" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Ek line me 2 Ecom cards. Pehla card row banata hai, doosra (pair ka) null return karta hai.
function EcomeHomeRow({ story, index, list, navigation }) {
  let pos = 0;
  for (let k = index - 1; k >= 0 && list[k]?.isEcome; k -= 1) pos += 1;
  if (pos % 2 === 1) return null;
  const partner = list[index + 1]?.isEcome ? list[index + 1] : null;
  return (
    <View style={ecomeRowStyles.row}>
      <EcomeGridCard item={story} navigation={navigation} />
      {partner ? <EcomeGridCard item={partner} navigation={navigation} /> : <View style={ecomeRowStyles.cell} />}
    </View>
  );
}

function EcomeHomeCard({ item, navigation }) {
  return (
    <TouchableOpacity style={ecomeStyles.card} activeOpacity={0.88} onPress={() => navigation.navigate('FarmingBuy')}>
      {item.image ? <Image source={{ uri: item.image }} style={ecomeStyles.image} resizeMode="cover" /> : <View style={[ecomeStyles.image, ecomeStyles.imageFallback]}><Ionicons name="storefront-outline" size={30} color="#dc2626" /></View>}
      <View style={ecomeStyles.body}>
        <View style={ecomeStyles.topRow}><Text style={ecomeStyles.badge}>ECOME</Text><Text style={ecomeStyles.category}>{item.category}</Text></View>
        <Text style={ecomeStyles.title} numberOfLines={2}>{item.title}</Text>
        {item.description ? <Text style={ecomeStyles.description} numberOfLines={2}>{item.description}</Text> : null}
        <View style={ecomeStyles.metaRow}>
          <Text style={ecomeStyles.price}>{item.price ? `₹${item.price}` : 'Contact for price'}</Text>
          {item.quantity ? <Text style={ecomeStyles.quantity}>{item.quantity}</Text> : null}
        </View>
        <View style={ecomeStyles.footer}><Text style={ecomeStyles.seller} numberOfLines={1}>{item.city || item.sellerName}</Text><Text style={ecomeStyles.cta}>View listing <Ionicons name="arrow-forward" size={13} /></Text></View>
      </View>
    </TouchableOpacity>
  );
}

function RotatingSponsoredAd({ ads = [], onClose, onPress }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!ads.length || dismissedRef.current) { setVisible(false); return undefined; }
    setVisible(true);
    // Keep the same non-blocking popup open and only rotate its creative.
    const delay = 5000 + ((index % 2) * 1000); // 5, then 6 seconds
    const timer = setTimeout(() => {
      if (dismissedRef.current) return;
      setIndex((current) => (current + 1) % ads.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [ads.length, index]);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const ad = ads[index];
  const image = ad?.image || ad?.photo || ad?.image_url || ad?.images?.[0] || ad?.photos?.[0];
  if (!visible || !ad || !image) return null;

  return (
    <View style={popupStyles.overlay} pointerEvents="box-none">
        <View style={[popupStyles.card, index % 2 ? popupStyles.cardRight : popupStyles.cardLeft]} pointerEvents="auto">
          <TouchableOpacity style={popupStyles.close} onPress={dismiss} accessibilityLabel="Close advertisement">
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.9} onPress={() => onPress?.(ad)}>
            <Image source={{ uri: image }} style={popupStyles.image} resizeMode="cover" />
            <View style={popupStyles.label}><Text style={popupStyles.labelText}>SPONSORED</Text></View>
          </TouchableOpacity>
        </View>
    </View>
  );
}

function TopRotatingAdSlot({ ads = [], onPress }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (ads.length < 2) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % ads.length), 3000);
    return () => clearInterval(timer);
  }, [ads.length]);
  const ad = ads[index];
  const image = ad?.image || ad?.photo || ad?.image_url || ad?.images?.[0] || ad?.photos?.[0];
  if (!image) return null;
  return (
    <TouchableOpacity style={styles.topAdSlot} activeOpacity={0.92} onPress={() => onPress?.(ad)}>
      <Text style={styles.adCaption}>ADVERTISEMENT</Text>
      <Image source={{ uri: image }} style={styles.topAdImage} resizeMode="cover" />
    </TouchableOpacity>
  );
}

function InFeedAdSlot({ ad, onPress }) {
  const image = ad?.image || ad?.photo || ad?.image_url || ad?.images?.[0] || ad?.photos?.[0];
  if (!image) return null;
  return (
    <TouchableOpacity style={styles.inFeedAdSlot} activeOpacity={0.92} onPress={() => onPress?.(ad)}>
      <Text style={styles.adCaption}>ADVERTISEMENT</Text>
      <Image source={{ uri: image }} style={styles.inFeedAdImage} resizeMode="cover" />
    </TouchableOpacity>
  );
}

const SUBSCRIPTION_PLANS = [
  {
    plan_id: 'plan-basic',
    plan_name: 'Basic Access',
    price: 199,
    duration: '30 Days',
    label: 'Starter',
    features: ['News Feed', 'e-Paper', 'Notifications'],
    accentColor: '#14b87a',
    accentLight: '#e6faf3',
    dotColor: '#14b87a',
    popular: false,
  },
  {
    plan_id: 'plan-pro',
    plan_name: 'Pro Access',
    price: 499,
    duration: '90 Days',
    label: 'Most Popular',
    features: ['News Feed', 'e-Paper', 'Live Streaming', 'Wallet', 'Certification'],
    accentColor: PINK,
    accentLight: PINK_LIGHT,
    dotColor: PINK,
    popular: true,
  },
  {
    plan_id: 'plan-premium',
    plan_name: 'Premium Access',
    price: 899,
    duration: '180 Days',
    label: 'Best Value',
    features: ['All Features', 'Priority Support', 'Certificate Download', 'Referral Bonus'],
    accentColor: '#8b5cf6',
    accentLight: '#f5f3ff',
    dotColor: '#8b5cf6',
    popular: false,
  },
];

function SeatSelectModal({ visible, stateName, seats, selectedSeatId, onSelectSeatId, onCancel, onConfirm }) {
  const baseSeats = Array.isArray(seats) ? seats.slice(0, 5) : [];
  const commonSeat = { id: 'seat-common', name: 'Common Seat', status: 'available' };
  const seatsToShow = [...baseSeats, commonSeat];
  const isLoadingSeats = baseSeats.length === 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity
        style={[
          { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
          Platform.OS === 'web' && seatStyles.overlayWeb,
        ]}
        activeOpacity={1}
        onPress={onCancel}
      >
      <View style={seatStyles.sheet}>
        <View style={seatStyles.handle} />
        <Text style={seatStyles.title}>Select your seat</Text>
        <View style={seatStyles.stateRow}>
          <View style={seatStyles.stateDot} />
          <Text style={seatStyles.subtitle}>{stateName || '-'}</Text>
        </View>
        <View style={{ marginTop: 14, gap: 8 }}>
          {isLoadingSeats && baseSeats.length === 0 ? (
            <Text style={seatStyles.loadingText}>Loading seats…</Text>
          ) : null}
          {seatsToShow.map((seat) => {
            const isTaken = seat.status === 'taken';
            const isDisabled = seat.status === 'disabled';
            const isSelected = selectedSeatId === seat.id;
            const isCommon = seat.id === 'seat-common';
            const disabled = isTaken || isDisabled;
            return (
              <TouchableOpacity
                key={seat.id}
                activeOpacity={0.85}
                disabled={disabled}
                onPress={() => onSelectSeatId(seat.id)}
                style={[
                  seatStyles.seatCard,
                  isSelected && seatStyles.seatCardSelected,
                  disabled && seatStyles.seatCardDisabled,
                  isCommon && seatStyles.seatCardCommon,
                ]}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[
                    seatStyles.seatName,
                    disabled && seatStyles.seatNameDisabled,
                    isCommon && seatStyles.seatNameCommon,
                  ]}>
                    {seat.name}
                  </Text>
                  <Text style={[
                    seatStyles.seatStatus,
                    (isTaken || isDisabled) && seatStyles.seatStatusMuted,
                  ]}>
                    {isTaken ? 'Taken' : isDisabled ? 'Select state first' : 'Available'}
                  </Text>
                </View>
                {isSelected ? (
                  <View style={seatStyles.checkCircle}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                ) : (
                  <View style={seatStyles.checkCircleEmpty} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={seatStyles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
            <Text style={seatStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[seatStyles.confirmBtn, !selectedSeatId && seatStyles.confirmBtnDisabled]}
            onPress={onConfirm}
            activeOpacity={0.85}
            disabled={!selectedSeatId || isLoadingSeats}
          >
            <Text style={[seatStyles.confirmBtnText, !selectedSeatId && seatStyles.confirmBtnTextDisabled]}>
              Pay now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </TouchableOpacity>
    </Modal>
  );
}

const seatStyles= StyleSheet.create({
  overlayWeb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: 460,
          maxHeight: '85%',
          borderRadius: 24,
        }
      : {
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }),
    backgroundColor: '#ffffff',
    padding: 18,
    paddingBottom: 28,
  },
  handle: { width: 36, height: 4, backgroundColor: PINK_BORDER, borderRadius: 99, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4, fontFamily: 'Roboto' },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stateDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: PINK },
  subtitle: { fontSize: 12, color: '#b0b8cc', fontWeight: '500', fontFamily: 'Roboto' },
  loadingText: { fontSize: 12, color: '#b0b8cc', fontWeight: '500', paddingVertical: 10, fontFamily: 'Roboto' },
  seatCard: { borderWidth: 1.5, borderColor: '#f0f2f7', backgroundColor: '#fff', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seatCardSelected: { borderColor: PINK, backgroundColor: PINK_LIGHT },
  seatCardDisabled: { borderColor: '#f5f5f5', backgroundColor: '#fafafa' },
  seatCardCommon: { borderColor: PINK_BORDER, backgroundColor: PINK_MUTED },
  seatName: { fontSize: 13, fontWeight: '600', color: '#0f172a', fontFamily: 'Roboto' },
  seatNameDisabled: { color: '#b0b8cc' },
  seatNameCommon: { color: PINK },
  seatStatus: { marginTop: 3, fontSize: 11, fontWeight: '500', color: PINK, fontFamily: 'Roboto' },
  seatStatusMuted: { color: '#b0b8cc' },
  checkCircle: { width: 22, height: 22, borderRadius: 99, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center' },
  checkCircleEmpty: { width: 22, height: 22, borderRadius: 99, borderWidth: 1.5, borderColor: '#e2e8f0' },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#f0f2f7', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { color: '#0f172a', fontWeight: '600', fontSize: 13, fontFamily: 'Roboto' },
  confirmBtn: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center', backgroundColor: PINK },
  confirmBtnDisabled: { backgroundColor: '#f0f2f7' },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'Roboto' },
  confirmBtnTextDisabled: { color: '#b0b8cc' },
});

function SubscriptionModal({ visible, pendingPlan, onPlanPress, onClose }) {
  if (!visible) return null;
  return (
    <View style={subStyles.overlay}>
      <View style={subStyles.modalContent}>
        <View style={subStyles.crownCircle}>
          <Ionicons name="star" size={22} color={PINK} />
        </View>
        <Text style={subStyles.modalTitle}>Choose your plan</Text>
        <Text style={subStyles.modalSubtitle}>Unlock everything with one tap</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginTop: 16 }}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isActive = pendingPlan?.plan_id === plan.plan_id;
            return (
              <TouchableOpacity
                key={plan.plan_id}
                style={[subStyles.planCard, isActive && { borderColor: plan.accentColor, backgroundColor: plan.accentLight }]}
                onPress={() => onPlanPress(plan)}
                activeOpacity={0.85}
              >
                <View style={[subStyles.badge, { backgroundColor: plan.accentLight }]}>
                  <Text style={[subStyles.badgeText, { color: plan.accentColor }]}>{plan.label}</Text>
                </View>
                <View style={subStyles.planHeader}>
                  <View>
                    <Text style={[subStyles.planName, { color: plan.accentColor }]}>{plan.plan_name}</Text>
                    <Text style={subStyles.planDuration}>{plan.duration}</Text>
                  </View>
                  <Text style={subStyles.planPrice}>₹{plan.price}</Text>
                </View>
                <View style={subStyles.divider} />
                <View style={subStyles.featureRow}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={subStyles.featureItem}>
                      <View style={[subStyles.featureDot, { backgroundColor: plan.dotColor }]} />
                      <Text style={subStyles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={subStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={subStyles.closeBtnText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const subStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 28, padding: 22, width: '100%', maxWidth: Platform.OS === 'web' ? 560 : 400, alignItems: 'center' },
  crownCircle: { width: 48, height: 48, borderRadius: 99, backgroundColor: PINK_MUTED, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4, fontFamily: 'Roboto' },
  modalSubtitle: { fontSize: 12, color: '#b0b8cc', textAlign: 'center', fontFamily: 'Roboto' },
  planCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: PINK_BORDER, width: '100%' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginBottom: 8 },
  badgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, fontFamily: 'Roboto' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  planName: { fontSize: 15, fontWeight: '700', fontFamily: 'Roboto' },
  planDuration: { fontSize: 11, color: '#b0b8cc', marginTop: 2, fontFamily: 'Roboto' },
  planPrice: { fontSize: 22, fontWeight: '700', color: '#0f172a', fontFamily: 'Roboto' },
  divider: { height: 1, backgroundColor: PINK_BORDER, marginBottom: 10 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featureDot: { width: 6, height: 6, borderRadius: 99 },
  featureText: { fontSize: 11, color: '#64748b', fontFamily: 'Roboto' },
  closeBtn: { width: '100%', marginTop: 12, paddingVertical: 14, borderRadius: 18, backgroundColor: PINK_MUTED, alignItems: 'center' },
  closeBtnText: { fontSize: 13, fontWeight: '600', color: PINK, fontFamily: 'Roboto' },
});

// ── Main HomeScreen ───────────────────────────────────────────────────────────
export default function HomeScreen({ navigation, route }) {
  const { language } = useLanguage();
  const { showToast, showPopup } = useToast();
  const copy = useMemo(() => getSiteCopy(language), [language]);
  const commonCopy = copy.common;
  const homeCopy = copy.home;
  const { width, height: windowHeight } = useWindowDimensions();
  const responsiveWidth = getResponsiveWindowWidth(width);
  const isMobileDeviceWeb = isMobileWebDevice();
  const isDesktopRailLayout = IS_WEB && !isMobileDeviceWeb && responsiveWidth >= 1180;
  const isCompactLayout = !isDesktopRailLayout;
  const isMobileLayout = !IS_WEB || isMobileDeviceWeb || responsiveWidth < 768;

  const routeInitialView = route?.params?.initialView;
  const routeInitialMenuKey = route?.params?.initialMenuKey;
  const routeInitialStateName = route?.params?.initialStateName;

  const fromRegistration = Boolean(route?.params?.fromRegistration);
  const registrationJustCompleted = Boolean(route?.params?.registrationJustCompleted);

  const handledRegistrationToastRef = useRef(false);
  const handledSubscriptionModalRef = useRef(false);
  const pageScrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const handleRailWheel = IS_WEB
    ? (e) => {
        const delta = e?.deltaY || 0;
        if (!delta) return;
        e.preventDefault?.();
        const nextY = Math.max(0, scrollYRef.current + delta);
        scrollYRef.current = nextY;
        pageScrollRef.current?.scrollTo?.({ y: nextY, animated: false });
      }
    : undefined;
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatSummary, setSeatSummary] = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState('');
 const [pendingPlan, setPendingPlan] = useState(null);
  const [leadFormAd, setLeadFormAd] = useState(null);
  const [showAllAds, setShowAllAds] = useState(false);
  const initialHomeState = buildHomeStateFromParams(route?.params);
  const [viewMode, setViewMode] = useState(initialHomeState.nextViewMode);
  const [selectedMenuKey, setSelectedMenuKey] = useState(initialHomeState.nextMenuKey);
  const [selectedStateName, setSelectedStateName] = useState(initialHomeState.nextStateName);
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveStories, setLiveStories] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [leftRailHeight, setLeftRailHeight] = useState(0);
  const [rightRailHeight, setRightRailHeight] = useState(0);

  // Keep the rails in normal flow until their last card is fully visible.
  // After that point, bottom-align the rail in the viewport while the longer
  // center feed continues. This avoids a top gap and keeps all three columns
  // moving together at the start of scrolling.
  const railStickAfterFullyVisible = useCallback((railHeight) => {
    if (!IS_WEB || !isDesktopRailLayout || !railHeight) return null;
    return {
      position: 'sticky',
      top: Math.min(0, windowHeight - railHeight),
      alignSelf: 'flex-start',
    };
  }, [isDesktopRailLayout, windowHeight]);

  useEffect(() => {
    const nextHomeState = buildHomeStateFromParams({
      initialView: routeInitialView,
      initialMenuKey: routeInitialMenuKey,
      initialStateName: routeInitialStateName,
    });
    setViewMode(nextHomeState.nextViewMode);
    setSelectedMenuKey(nextHomeState.nextMenuKey);
    setSelectedStateName(nextHomeState.nextStateName);
    setSelectedDistrictName('');
    setSearchQuery('');
  }, [routeInitialView, routeInitialMenuKey, routeInitialStateName]);

  const loadNewsStories = useCallback(async () => {
    try {
      const [summary, activeAds, ecomeSummary] = await Promise.all([
        UserStore.getNewsFeedSummary({ feedType: 'all' }),
        UserStore.getActiveAdsFeed(),
        UserStore.getEcomeMarketplaceSummary(),
      ]);
      const fetchedStories = Array.isArray(summary?.items)
        ? summary.items.map((item, index) => normalizeStoryItem(item, index)).filter(Boolean)
        : [];
      // Newest published/created story must always appear first, even if the
      // API response arrives in a different order.
      fetchedStories.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || a.date || 0).getTime() || 0;
        const dateB = new Date(b.createdAt || b.created_at || b.date || 0).getTime() || 0;
        if (dateB !== dateA) return dateB - dateA;
        return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
      });
      const adStories = Array.isArray(activeAds) ? activeAds.map(homeStoryFromAd) : [];
      const ecomeStories = Array.isArray(ecomeSummary?.listings) ? ecomeSummary.listings.map(homeStoryFromEcome) : [];
      // Advertisements are shown only as rotating image popups, never mixed
      // into the editorial news cards.
      setActiveAds(adStories);
      setLiveStories(interleaveHomeStories(fetchedStories, [], ecomeStories));
    } catch { setLiveStories([]); }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await UserStore.getCurrentUser();
      setCurrentUser(user || null);
    } catch { setCurrentUser(null); }
  }, []);

    useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      // ✅ SPEED FIX: teeno ab ek saath (parallel) chalte hain, ek ke baad
      // ek nahi — total wait time sabse slow ek call jitna hoga, sum nahi.
      const [, , seats] = await Promise.all([
        loadNewsStories(),
        loadCurrentUser(),
        UserStore.getStateSeatSummary().catch(() => null),
      ]);
      if (!mounted) return;

      setSeatSummary(seats || null);
      const seatId = seats?.current_seat?.seat_id || '';
      setSelectedSeatId((prev) => prev || seatId);

      if (registrationJustCompleted && !handledRegistrationToastRef.current) {
        handledRegistrationToastRef.current = true;
        showToast('Registration successful! Welcome 🎉', 'success');
      }
      if (fromRegistration && !handledSubscriptionModalRef.current) {
        handledSubscriptionModalRef.current = true;
        setTimeout(() => navigation.navigate('Subscription Plans'), 1000);
      }
    })();
    return () => { mounted = false; };
  }, [fromRegistration, loadCurrentUser, loadNewsStories, registrationJustCompleted, showToast]));

  const handlePlanPress = (plan) => {
    setPendingPlan(plan);
    const stateName = seatSummary?.state || currentUser?.state || '';
    if (!stateName) {
      showPopup('Please select your state first.', 'error', {
        primaryLabel: 'Open',
        secondaryLabel: 'Cancel',
        onPrimaryPress: () => navigation.navigate('StateSelect', { fromPremium: true, autoOpen: true }),
      });
      return;
    }
    const existingSeatId = seatSummary?.current_seat?.seat_id || '';
    if (existingSeatId) {
      setSelectedSeatId(existingSeatId);
      handleDirectSubscribe(plan, existingSeatId);
      return;
    }
    setSeatModalOpen(true);
  };

    const handleDirectSubscribe = async (plan, seatId) => {
    try {
      // ⚠️ FIX: saveSubscription() sirf local storage update karta tha, backend pe
      // asli payment verify nahi hota tha isliye referral commission trigger hi nahi
      // hoti thi. Ab SubscriptionPlansScreen jaisa hi real Razorpay order+verify flow.
      navigation.navigate('Subscription Plans', { preselectedPlanId: plan.plan_id, seatId });
      return;
      if (!subscriptionResult?.ok) throw new Error(subscriptionResult?.message || 'Subscription could not be saved.');
      setCurrentUser((await UserStore.getCurrentUser()) || null);
      setShowSubscriptionModal(false);
      setPendingPlan(null);
      showToast(`${plan.plan_name} Subscription Successful! 🎉`, 'success');
    } catch (err) {
      console.error('Subscription save failed:', err);
      showToast(err?.message || 'Something went wrong. Please try again.', 'error');
    }
  };

  const handleSeatConfirm = async () => {
    if (!pendingPlan || !selectedSeatId) return;
    try {
      const seatResult = await UserStore.saveSelectedSeat(selectedSeatId);
      if (!seatResult?.ok) throw new Error(seatResult?.message || 'Unable to save selected seat.');
      const subscriptionResult = await UserStore.saveSubscription({
        plan_id: pendingPlan.plan_id, plan_name: pendingPlan.plan_name,
        seat_id: selectedSeatId, price: pendingPlan.price, duration: pendingPlan.duration,
      });
      if (!subscriptionResult?.ok) throw new Error(subscriptionResult?.message || 'Subscription could not be saved.');
      setCurrentUser((await UserStore.getCurrentUser()) || null);
      setSeatModalOpen(false);
      setShowSubscriptionModal(false);
      setPendingPlan(null);
      showToast(`${pendingPlan.plan_name} Subscription Successful! 🎉`, 'success');
    } catch (err) {
      console.error('Subscription save failed:', err);
      showToast(err?.message || 'Something went wrong. Please try again.', 'error');
    }
  };
const allStories = useMemo(() => {
  return dedupeStories([...liveStories]);
}, [liveStories]);

  const firstNewsStory = useMemo(
    () => allStories.find((s) => !s.isAd && !s.isEcome) || null,
    [allStories]
  );

  const allAdsList = useMemo(() => activeAds, [activeAds]);

  const visibleStories = useMemo(() => {
    if (viewMode === 'states') return [];
    let scopedStories = allStories
      .filter((story) => storyMatchesMenu(story, selectedMenuKey))
      .filter((story) => storyMatchesLanguage(story, language));
    if (selectedStateName) {
      scopedStories = scopedStories.filter((story) => String(story.state || '').toLowerCase() === selectedStateName.toLowerCase());
    }
    const q = String(searchQuery || '').trim().toLowerCase();
    if (q) {
      scopedStories = scopedStories.filter((story) =>
        [story.title, story.excerpt, story.description, story.category, story.state, story.district, story.author_name].join(' ').toLowerCase().includes(q)
      );
    }
     // Home shows only live API news; never pad the feed with dummy stories.
    // ✅ Web par center feed me sirf news cards — ecom/ads ko hata do (right panel me already dikh rahe hai)
    if (IS_WEB) {
      scopedStories = scopedStories.filter((story) => !story.isAd && !story.isEcome);
    }
    return scopedStories;
  }, [allStories, language, searchQuery, selectedMenuKey, selectedStateName, viewMode]);
  const stateDistrictOptions = useMemo(() => buildStateDistrictList(allStories, selectedStateName), [allStories, selectedStateName]);

  const panelContent = useMemo(() => buildPanelContent({
    viewMode, selectedMenuKey, selectedStateName,
    districtCount: stateDistrictOptions.length, commonCopy, homeCopy,
  }), [commonCopy, homeCopy, selectedMenuKey, selectedStateName, stateDistrictOptions.length, viewMode]);

  const utilityLocationOptions = useMemo(() => {
    if (selectedStateName) return stateDistrictOptions;
    if (viewMode === 'states' || selectedMenuKey === 'states') return FEATURED_STATE_OPTIONS;
    return [];
  }, [selectedMenuKey, selectedStateName, stateDistrictOptions, viewMode]);

  const handleMenuSelection = useCallback((menuKey) => {
    setSearchQuery(''); setSelectedDistrictName('');
    if (menuKey === 'states') { setViewMode('states'); setSelectedMenuKey('states'); setSelectedStateName(''); return; }
    setViewMode('feed'); setSelectedMenuKey(menuKey); setSelectedStateName('');
  }, []);

  const handleStateSelection = useCallback((stateName) => {
    setSearchQuery(''); setViewMode('feed');
    setSelectedMenuKey((k) => (k === 'states' ? 'latest' : k));
    setSelectedStateName(stateName); setSelectedDistrictName('');
  }, []);

  const handleDistrictSelection = useCallback((districtName) => { setSelectedDistrictName(districtName); }, []);

  const handleOpenDetails = useCallback(async (story) => {
    if (!story) return;
    try { if (story.id) await UserStore.updateNewsFeedItem(story.id, 'view'); } catch { }
    navigation?.navigate?.('NewsDetails', { article: story });
  }, [navigation]);

  const handleOpenLocation = useCallback((stateName) => {
    if (!stateName) return;
    setSearchQuery(''); setViewMode('feed'); setSelectedMenuKey('all'); setSelectedStateName(stateName); setSelectedDistrictName('');
  }, []);

  const handleOpenCategory = useCallback((story) => {
    const menuTag = (story?.menuTags || []).find((tag) => tag !== 'latest');
    if (!menuTag) return;
    setSearchQuery(''); setViewMode('feed'); setSelectedStateName(''); setSelectedDistrictName(''); setSelectedMenuKey(menuTag);
  }, []);

  const handleOpenAuthorProfile = useCallback(async (story) => {
    if (!story) return;
    const fallbackAuthor = {
      name: story.author_name || '', author_profile_image: story.author_profile_image || '',
      author_seat_name: story.author_seat_name || '', author_role_label: story.author_role_label || '',
      author_has_blue_tick: Boolean(story.author_has_blue_tick),
      author_is_premium: Boolean(story.author_is_premium),
    };
    if (!story.createdBy && !fallbackAuthor.name) return;
    const currentUser = await UserStore.getCurrentUser();
    const viewerEmail = String(currentUser?.email || '').trim().toLowerCase();
    const authorEmail = String(story.createdBy || '').trim().toLowerCase();
    const isOwnPost = (viewerEmail && authorEmail && viewerEmail === authorEmail)
      || (currentUser?.id && story.author_id && String(currentUser.id) === String(story.author_id));
    if (isOwnPost) {
      navigation?.navigate?.('Profile');
      return;
    }
    navigation?.navigate?.('UserPublicProfile', { email: story.createdBy || '', author: fallbackAuthor, userId: story.author_id || null });
  }, [navigation]);

const handleOpenLeadForm = useCallback((story) => {
  if (!story) return;
  setLeadFormAd(story);
}, []);

  const handleSponsoredAdPress = useCallback((ad) => {
    if (!ad) return;
    if (ad.redirect === 'lead_form') { handleOpenLeadForm(ad); return; }
    if (ad.redirect === 'whatsapp') {
      const phone = String(ad.extraValues?.whatsapp_number || ad.owner_mobile || '').replace(/\D/g, '');
      if (phone) openExternalUrl(`https://wa.me/91${phone}`);
      return;
    }
    if (ad.redirect === 'website' || ad.redirect === 'shop') {
      openExternalUrl(ad.redirect === 'shop' ? ad.extraValues?.shop_url : ad.extraValues?.website_url);
      return;
    }
    if (ad.redirect === 'profile') { handleOpenAuthorProfile(ad); return; }
    handleOpenDetails(ad);
  }, [handleOpenAuthorProfile, handleOpenDetails, handleOpenLeadForm]);

  // ── Full-screen "promo" popup (Android home only) — built from the first
  // active sponsored ad, styled like a big brand offer card. ────────────
  const homePromoAd = useMemo(() => {
    const source = allAdsList?.[0];
    if (!source) return null;
    const image = source.image || source.photo || source.image_url || source.images?.[0] || source.photos?.[0];
    const gallery = Array.isArray(source.images) && source.images.length
      ? source.images.slice(0, 3)
      : (image ? [image] : []);
    return {
      brandName: source.owner_name || 'Sponsored',
      headline: source.title || 'Great Deals. Bigger Savings.',
      subheadline: source.description || '',
      thumbnails: gallery,
      image,
      ctaLabel: 'SHOP NOW',
      redirect: source.redirect,
      extraValues: source.extraValues,
      owner_email: source.owner_email,
      owner_mobile: source.owner_mobile,
      ...source,
    };
  }, [allAdsList]);

  const handleViewMoreAds = useCallback(() => setShowAllAds(true), []);
  const handleBackFromAds = useCallback(() => setShowAllAds(false), []);
  // ── Search bar — ab feed column ke sabse upar, koi duplicate "post" bar
  // uske niche nahi hai (wo fake input hata diya gaya hai). Android par
  // thoda compact height rakha gaya hai. ──────────────────────────────────
  const renderSearchField = viewMode === 'states' ? null : (
    <View style={[styles.sectionSearchRow, isCompactLayout && styles.sectionSearchRowCompact]}>
           <View style={styles.sectionSearchField}>
        <Ionicons name="search-outline" size={16} color="#94a3b8" />
        <TextInput
          value={searchQuery} onChangeText={setSearchQuery}
          placeholder={homeCopy.searchFeedPlaceholder} placeholderTextColor="#94a3b8"
          style={styles.sectionSearchInput}
        />
        <Ionicons name="options-outline" size={18} color="#94a3b8" />
      </View>
      {(selectedStateName || selectedMenuKey !== 'all') ? (
        <TouchableOpacity
          style={styles.sectionResetButton}
          onPress={() => { setViewMode('feed'); setSelectedMenuKey('all'); setSelectedStateName(''); setSelectedDistrictName(''); setSearchQuery(''); }}
          activeOpacity={0.84}
        >
          <Ionicons name="refresh-outline" size={16} color="#f97316" />
          <Text style={styles.sectionResetButtonText}>{homeCopy.resetFeed}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const utilityPanel = (
  <RightUtilityPanel
      navigation={navigation} panelContent={panelContent}
      selectedStateName={selectedStateName} selectedDistrictName={selectedDistrictName}
      locationOptions={utilityLocationOptions}
      onSelectState={handleStateSelection} onSelectDistrict={handleDistrictSelection}
      isCompactLayout={isCompactLayout} commonCopy={commonCopy} homeCopy={homeCopy}
    trendingStories={allStories} onOpenDetails={handleOpenDetails}
      ads={allAdsList} onOpenLeadForm={handleOpenLeadForm}
      onViewMoreAds={handleViewMoreAds} onBackFromAds={handleBackFromAds}
      showingAllAds={showAllAds} firstNewsStory={firstNewsStory}
    />
  );

  const shouldShowRightRail = viewMode !== 'states';

  const pageContent = (
    <>
      <View style={styles.pageBodyShell}>

        {/* ✅ FULL WIDTH MARQUEE — search bar ke niche, sidebar ke upar, sirf web desktop pe
        {IS_WEB && !isMobileDeviceWeb && viewMode !== 'states' && (
          <View style={styles.marqueeFullWidthWrapper}>
            <MarqueeMenuBar
              activeMenuKey={selectedMenuKey}
              onSelectMenu={handleMenuSelection}
              commonCopy={commonCopy}
            />
          </View>
        )} */}
        {viewMode !== 'states' && Platform.OS !== 'android' ? <TopRotatingAdSlot ads={allAdsList} onPress={handleSponsoredAdPress} /> : null}

        <View style={[styles.pageBodyInner, isCompactLayout && styles.pageBodyInnerCompact, isMobileLayout && styles.pageBodyInnerMobile]}>

          {/* ✅ Left sidebar — web desktop: Marketplace (Ecom) + Popular Posts. Native: category menu. */}
          {/* Desktop side rails are temporarily hidden.  The central home feed remains full-width. */}
          {!isMobileLayout && (
         <View
              style={[
                styles.sidebarStickyWrapper,
                isCompactLayout && styles.sidebarStickyWrapperCompact,
                railStickAfterFullyVisible(leftRailHeight),
              ]}
              onLayout={(event) => setLeftRailHeight(event.nativeEvent.layout.height)}
            >
              {IS_WEB ? (
                <LeftEcomSidebar
                  navigation={navigation}
                  stories={allStories}
                  onOpenDetails={handleOpenDetails}
                  commonCopy={commonCopy}
                />
              ) : (
                <NewsMenuSidebar activeMenuKey={selectedMenuKey} onSelectMenu={handleMenuSelection} isCompactLayout={isCompactLayout} commonCopy={commonCopy} />
              )}
            </View>
          )}

          <View style={[styles.workspaceShell, isCompactLayout && styles.workspaceShellCompact, isMobileLayout && styles.workspaceShellMobile]}>
            {false && isCompactLayout && shouldShowRightRail && !isMobileLayout ? (
              <View style={[styles.utilityStickyWrapper, styles.utilityStickyWrapperCompact]}>{utilityPanel}</View>
            ) : null}
            <View style={[styles.feedColumnShell, viewMode === 'states' && styles.feedColumnShellStatesView, isCompactLayout && styles.feedColumnShellCompact, isMobileLayout && styles.feedColumnShellMobile]}>
              <View style={[styles.feedColumn, viewMode === 'states' && styles.feedColumnStatesView, isMobileLayout && styles.feedColumnMobile]}>
                {viewMode === 'states' ? (
                  <StateDirectorySection
                    stateSearchQuery={searchQuery} onSearchChange={setSearchQuery}
                    onSelectState={handleStateSelection} isCompactLayout={isCompactLayout} homeCopy={homeCopy}
                  />
         ) : showAllAds ? (
                  <>
                    <TouchableOpacity onPress={handleBackFromAds} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Ionicons name="arrow-back" size={16} color="#f97316" />
                      <Text style={{ color: '#f97316', fontWeight: '800', fontSize: 13 }}>Back to News Feed</Text>
                    </TouchableOpacity>
                    <View style={[styles.storyCardsStack, isMobileLayout && styles.storyCardsStackMobile]}>
                      {allAdsList.map((story) => (
                        <NewsFeedCard
                          key={story.id} story={story} isCompactLayout={isMobileLayout}
                          navigation={navigation}
                          onOpenDetails={handleOpenDetails} onOpenLocation={handleOpenLocation}
                          onOpenCategory={handleOpenCategory} onOpenAuthorProfile={handleOpenAuthorProfile}
                          onOpenLeadForm={handleOpenLeadForm}
                          commonCopy={commonCopy}
                                                currentUser={currentUser ? {
                            name: currentUser.name,
                            avatar: currentUser.profile_image,
                            email: currentUser.email,
                            has_blue_tick: UserStore.hasBlueTick(currentUser),
                            state_seat: currentUser.state_seat,
                            is_subscribed: currentUser.is_subscribed,
                          } : null}
                        />
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                                        {renderSearchField}
                                  {!IS_WEB && isMobileLayout && viewMode !== 'states' ? (
                      <MarqueeMenuBar
                        activeMenuKey={selectedMenuKey}
                        onSelectMenu={handleMenuSelection}
                        commonCopy={commonCopy}
                      />
                    ) : null}
                    <View style={[styles.storyCardsStack, isMobileLayout && styles.storyCardsStackMobile]}>
                      {visibleStories.map((story, index) => (
                        <React.Fragment key={story.id}>
                        {story.isEcome ? (
                      <EcomeHomeRow story={story} index={index} list={visibleStories} navigation={navigation} />
                      ) : (
                                            <NewsFeedCard
                           key={story.id} story={story} isCompactLayout={isMobileLayout}
                           altShade={isMobileLayout && index % 2 === 1}
  navigation={navigation}
  onOpenDetails={handleOpenDetails} onOpenLocation={handleOpenLocation}
  onOpenCategory={handleOpenCategory} onOpenAuthorProfile={handleOpenAuthorProfile}
  onOpenLeadForm={handleOpenLeadForm}  
  commonCopy={commonCopy}
    currentUser={currentUser ? {
    name: currentUser.name,
    avatar: currentUser.profile_image,
    email: currentUser.email,
    has_blue_tick: UserStore.hasBlueTick(currentUser),
    state_seat: currentUser.state_seat,
    is_subscribed: currentUser.is_subscribed,
  } : null}
                      />
                      )}
                      {(index + 1) % 4 === 0 ? <InFeedAdSlot ad={allAdsList[Math.floor(index / 4) % Math.max(allAdsList.length, 1)]} onPress={handleSponsoredAdPress} /> : null}
                      </React.Fragment>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>
           {!isCompactLayout && shouldShowRightRail ? (
              <View
                style={[styles.utilityStickyWrapper, railStickAfterFullyVisible(rightRailHeight)]}
                onLayout={(event) => setRightRailHeight(event.nativeEvent.layout.height)}
              >
                {utilityPanel}
              </View>
            ) : null}
          </View>
        </View>
      </View>
      {IS_WEB ? <AppFooter navigation={navigation} /> : null}
    </>
  );

  const page = (
    <View style={styles.screenShell}>
      <AppNavbar navigation={navigation} activeScreen="Home" hideBottomBar={true} />
      <ScrollView
        ref={pageScrollRef}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        style={styles.pageScrollView}
        contentContainerStyle={[
          styles.pageScrollContent,
          isMobileLayout && styles.pageScrollContentMobile,
          isMobileLayout && styles.pageScrollContentWithMobileNav,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {pageContent}
      </ScrollView>
      {isMobileLayout && (
        <AppNavbar navigation={navigation} activeScreen="Home" hideTopHeader={true} />
      )}
      <SeatSelectModal
        visible={seatModalOpen}
        stateName={seatSummary?.state || currentUser?.state || ''}
        seats={seatSummary?.seats || []}
        selectedSeatId={selectedSeatId}
        onSelectSeatId={setSelectedSeatId}
        onCancel={() => { setSeatModalOpen(false); setPendingPlan(null); }}
        onConfirm={handleSeatConfirm}
      />
      <SubscriptionModal
        visible={showSubscriptionModal}
        pendingPlan={pendingPlan}
        onPlanPress={handlePlanPress}
        onClose={() => { setShowSubscriptionModal(false); setPendingPlan(null); }}
      />

      <AdLeadFormModal
  visible={Boolean(leadFormAd)}
  ad={leadFormAd}
  onClose={() => setLeadFormAd(null)}
/>
      {/* <RotatingSponsoredAd ads={allAdsList} onPress={handleSponsoredAdPress} /> */}

            {(Platform.OS === 'android' || IS_WEB) && viewMode !== 'states' ? (
        <HomePromoPopup ad={homePromoAd} onPress={handleSponsoredAdPress} />
      ) : null}
    </View>
  );

  return IS_WEB ? <WebLayout>{page}</WebLayout> : page;
}

const styles = StyleSheet.create({
  screenShell: { flex: 1, backgroundColor: '#ffffff' },
  pageScrollView: { flex: 1, backgroundColor: '#ffffff' },
  pageScrollContent: { paddingTop: 4, paddingBottom: 0, backgroundColor: '#ffffff' },
  pageScrollContentMobile: { paddingTop: 0 },
  pageScrollContentWithMobileNav: { paddingBottom: 90 },
  // ✅ center everything below the header: full-width row that centers its
  // child (pageBodyInner) horizontally, so the whole body section sits in
  // the middle of the page instead of drifting to one side
  pageBodyShell: { paddingHorizontal: 0, paddingTop: 0, marginTop: -1, backgroundColor: '#ffffff', width: '100%', alignItems: 'center' },
  pageBodyInner: { maxWidth: 1440, width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 2 },
  pageBodyInnerCompact: { flexDirection: 'column' },
  pageBodyInnerMobile: { maxWidth: '100%' },

  // ✅ Full width marquee wrapper
  marqueeFullWidthWrapper: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
    marginBottom: 4,
  },
  topAdSlot: { width: '100%', maxWidth: 970, alignSelf: 'center', marginVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fafafa', padding: 5 },
  topAdImage: { width: '100%', height: 90, maxWidth: 960, backgroundColor: '#e2e8f0' },
  adCaption: { fontSize: 9, color: '#64748b', fontWeight: '700', marginBottom: 3, letterSpacing: 0.3 },
  inFeedAdSlot: { width: '100%', marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fafafa', padding: 8, alignItems: 'center' },
  inFeedAdImage: { width: '100%', height: 230, backgroundColor: '#e2e8f0' },

  sidebarStickyWrapper: {
    width: 300,
    // ✅ Left sidebar ko thoda aur left side shift kiya (screenshot request) —
    // negative marginLeft se ye workspace column ke aur kareeb / screen edge
    // ke aur paas chala jaata hai. Sirf desktop/web par lagta hai.
    // This must stay in normal document flow: the three columns scroll
    // together from the very first wheel movement. Once this shorter rail
    // ends, only the longer center feed continues—without a blank top gap.
    alignSelf: 'flex-start',
  },
  sidebarStickyWrapperCompact: { width: '100%', position: 'relative' },
  workspaceShell: { minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 2, paddingHorizontal: 0 },
  workspaceShellCompact: { width: '100%', flexDirection: 'column', paddingHorizontal: 12, gap: 12 },
  workspaceShellMobile: { paddingHorizontal: 0, gap: 0 },
  feedColumnShell: { width: 560, minWidth: 0, alignItems: 'center', paddingHorizontal: 0 },
  feedColumnShellStatesView: { width: 840 },
  feedColumnShellCompact: { width: '100%' },
  feedColumnShellMobile: { paddingHorizontal: 0, alignItems: 'stretch' },
  feedColumn: { width: '100%', minWidth: 0, maxWidth: 560, paddingBottom: 24, paddingTop: 4 },
  feedColumnMobile: { maxWidth: '100%', paddingTop: 8 },
  feedColumnStatesView: { maxWidth: 840 },

  // ✅ Right panel — top offset ab left sidebar ke barabar (0), pehle 60
  // tha jiski wajah se scroll karte waqt right side upar bada gap dikhta
  // tha aur left side sahi lagta tha
  utilityStickyWrapper: {
    width: 344,
    alignSelf: 'flex-start',
  },
  utilityStickyWrapperCompact: { width: '100%', position: 'relative' },

  // ── Search bar — sabse upar, chota + gol shape. Android par thoda
  // compact rakha gaya hai (kam height/padding). ──────────────────────────
  sectionSearchRow: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sectionSearchRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
  sectionSearchField: {
    flex: 1,
    minHeight: Platform.OS === 'android' ? 36 : 42,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ee',
    paddingHorizontal: Platform.OS === 'android' ? 12 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
    sectionSearchInput: {
    flex: 1,
    fontSize: Platform.OS === 'android' ? 12 : 13,
    color: '#0f172a',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  sectionResetButton: {
    minHeight: Platform.OS === 'android' ? 36 : 42,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionResetButtonText: { color: '#f97316', fontSize: 12, fontWeight: '800', fontFamily: 'Roboto' },
  storyCardsStack: { gap: 12 },
  storyCardsStackMobile: { gap: 0 },
});

const ecomeRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'stretch' },
  cell: { flex: 1, minWidth: 0, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 9, overflow: 'hidden' },
  image: { width: '100%', height: 120, backgroundColor: '#f3f4f6' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 8, flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 6 },
  badge: { color: '#e21111', fontSize: 9, fontWeight: '900', letterSpacing: 0.6, backgroundColor: '#f5d8d7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, fontFamily: 'Roboto' },
  category: { flex: 1, textAlign: 'right', color: '#64748b', fontSize: 10, fontWeight: '700', fontFamily: 'Roboto' },
  title: { color: '#0f172a', fontSize: 13, fontWeight: '800', lineHeight: 18, fontFamily: 'Roboto' },
  price: { color: '#e21111', fontSize: 14, fontWeight: '900', marginTop: 6, fontFamily: 'Roboto' },
  footer: { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  seller: { flex: 1, color: '#64748b', fontSize: 10.5, fontWeight: '600', fontFamily: 'Roboto' },
});

const ecomeStyles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  image: { width: 126, minHeight: 174, backgroundColor: '#f3f4f6' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 13, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 },
  badge: { color: '#dc2626', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, backgroundColor: '#fef2f2', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, fontFamily: 'Roboto' },
  category: { flex: 1, textAlign: 'right', color: '#64748b', fontSize: 10.5, fontWeight: '700', fontFamily: 'Roboto' },
  title: { color: '#0f172a', fontSize: 15, fontWeight: '800', lineHeight: 20, fontFamily: 'Roboto' },
  description: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 5, fontFamily: 'Roboto' },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 9 },
  price: { color: '#dc2626', fontSize: 16, fontWeight: '900', fontFamily: 'Roboto' },
  quantity: { color: '#64748b', fontSize: 11, fontWeight: '700', fontFamily: 'Roboto' },
  footer: { borderTopWidth: 0.5, borderTopColor: '#fafafa', marginTop: 10, paddingTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  seller: { flex: 1, color: '#64748b', fontSize: 11, fontWeight: '600', fontFamily: 'Roboto' },
  cta: { color: '#802a15', fontSize: 11, fontWeight: '800', fontFamily: 'Roboto' },
});

const popupStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 50, justifyContent: 'flex-end', alignItems: 'center', padding: 16, paddingBottom: 88, pointerEvents: 'box-none' },
  card: {
    width: '92%', maxWidth: 480, overflow: 'hidden', borderRadius: 0,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 12,
  },
  cardLeft: { alignSelf: 'flex-start' },
  cardRight: { alignSelf: 'flex-end' },
  image: { width: '100%', height: 220, backgroundColor: '#f1f5f9' },
  close: { position: 'absolute', zIndex: 2, right: 8, top: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,23,42,0.82)', alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', left: 0, bottom: 0, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(15,23,42,0.88)' },
  labelText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
});
