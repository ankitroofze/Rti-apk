// screens/QuickMenuScreen.js
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBSCRIPTION_CARD_THEMES } from '../constants/subscriptionThemes';

// ✅ Subscription header wala hi red asset — sidebar bhi isi se match karega.
// Metro web build me require(png) khud hi ek usable value deta hai — kabhi
// plain string URL, kabhi { uri } object — dono cases handle kar rahe hain.
const _redAsset = SUBSCRIPTION_CARD_THEMES[1].image;
const SIDEBAR_RED_URI =
  Platform.OS === 'web'
    ? (typeof _redAsset === 'string'
        ? _redAsset
        : (typeof Image.resolveAssetSource === 'function'
            ? (Image.resolveAssetSource(_redAsset)?.uri || _redAsset?.uri || '')
            : (_redAsset?.uri || _redAsset?.default || '')))
    : '';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { UserStore } from '../store/UserStore';
import { getProfileTier } from '../utils/profileHelpers';
import { PROFILE_TIERS, PROFILE_BG_YELLOW } from '../constants/profileConstants';
import ProfileScreen from '../pages/ProfileScreen';
import AddNewsScreen from '../pages/Addnewsscreen';
import NewsFeedScreen from '../pages/NewsFeedScreen';
import MyNetworkScreen from '../pages/MyNetworkScreen';
import WalletScreen from '../pages/WalletScreen';
import WithdrawScreen from '../pages/WithdrawScreen';
import SubscriptionPlansScreen from '../pages/SubscriptionPlansScreen';
import EPaperScreen from '../pages/EPaperScreen';
import LiveStreamingScreen from '../pages/LiveStreamingScreen';
import LiveBroadcastScreen from '../pages/LiveBroadcastScreen';
import CertificationScreen from '../pages/CertificationScreen';
import MySubscriptionsScreen from '../pages/MySubscriptionsScreen';
import NotificationsScreen from '../pages/NotificationsScreen';
import EcomeScreen from './EcomeScreen';
import MyEnquiriesScreen from '../pages/MyEnquiriesScreen';
import AdPlansScreen from '../pages/AdPlansScreen';
import MyQuizSubscriptionScreen from '../pages/MyQuizSubscriptionScreen';
import QuizSubscriptionScreen from './QuizSubscriptionScreen';
import EcomSubscriptionScreen from './EcomSubscriptionScreen';
import SellScreen from './SellScreen';
import FarmingBuyScreen from './FarmingBuyScreen';
import MyAttemptsScreen from '../pages/MyAttemptsScreen';
import MyEcomSubscriptionScreen from '../pages/MyEcomSubscriptionScreen';
import CommerceAdsCenterScreen from '../pages/CommerceAdsCenterScreen';
import SbMyAdsPage from '../pages/MyAdsScreen';
import SbPaymentHistoryPage from '../pages/Paymenthistoryscreen';
import SbSettingsPage from '../pages/SettingsScreen';
import SbMyListingsPage from '../pages/MyListingsScreen';
import SbSellerEnquiryDashboardPage from '../pages/SellerEnquiryDashboardScreen';
import SbSellerReportsPage from '../pages/SellerReportsScreen';
import SbMyAdSubscriptionPage from '../pages/MyAdSubscriptionScreen';
import SbSubscriptionPlanDetailsPage from '../pages/SubscriptionPlanDetailsScreen';
import SbPaymentPage from '../pages/PaymentScreen';
import SbAdvertisePage from './AdvertiseScreen';
import SbBlockedUsersScreenPage from '../pages/BlockedUsersScreen';
import SbReferPage from './ReferScreen';
import SbChoosePlanPage from './ChoosePlanScreen';
import SbPurchaseBlueTickPage from './PurchaseBlueTickScreen';
import SbAdLeadResponsePage from './AdLeadResponseScreen';

// Font Family
const FONT_FAMILY = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto';

// ─────────────────────────────────────────────
//  CSS STRING (module-level constant)
// ─────────────────────────────────────────────
const QM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');
  html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; background: #fff; }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; -ms-overflow-style: none; box-sizing: border-box; font-family: 'Roboto', sans-serif; }
  @keyframes qmFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes qmBlink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.45; transform: scale(0.92); }
  }
  .qm-live-badge { animation: qmBlink 1.3s ease-in-out infinite; }
  .qm-live-icon { animation: qmBlink 1.3s ease-in-out infinite; }
  .qm-card.is-live { border-color: #fb7185 !important; }
  .qm-card.is-live:hover { box-shadow: 0 6px 20px rgba(225,29,72,0.18) !important; }
  .qm-root { display: flex; flex-direction: column; height: 100vh; overflow: hidden; font-family: 'Roboto', sans-serif; background: #fff; }
  .qm-topbar { height: 60px; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.07); display: flex; align-items: center; padding: 0 24px; gap: 14px; flex-shrink: 0; }
  .qm-logo { font-family: 'Roboto', sans-serif; font-size: 20px; color: #1e293b; flex: 1; font-weight: 600; }
  .qm-logo span { color: #94a3b8; }
  .qm-search { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; padding: 7px 14px; width: 220px; cursor: text; }
  .qm-search span { font-size: 13px; color: #94a3b8; font-weight: 500; }
  .qm-notif { width: 34px; height: 34px; border-radius: 6px; background: #f8fafc; border: 1px solid rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
  .qm-notif-dot { width: 7px; height: 7px; border-radius: 50%; background: #e11d48; position: absolute; top: 7px; right: 7px; border: 1.5px solid #fff; }
  .qm-avatar { width: 34px; height: 34px; border-radius: 6px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; }
  .qm-body { display: flex; flex: 1; overflow: hidden; }
  .qm-sidebar { width: 220px; background: #fff; border-right: 1px solid rgba(0,0,0,0.07); padding: 16px 12px; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; flex-shrink: 0; }
  .qm-sec-title { font-size: 10px; font-weight: 600; letter-spacing: 1.3px; text-transform: uppercase; color: #cbd5e1; padding: 10px 10px 4px; font-family: 'Roboto', sans-serif; }
  .qm-nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; transition: background 0.15s, color 0.15s; font-family: 'Roboto', sans-serif; }
  .qm-nav-item:hover { background: #f1f5f9; color: #1e293b; }
  .qm-nav-item.active { background: #1e293b; color: #fff; }
  .qm-nav-item.active .qm-nav-icon { background: rgba(255,255,255,0.15) !important; }
  .qm-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 5px 0; }
  .qm-main { flex: 1; padding: 32px 36px; overflow-y: auto; }
  .qm-page-header { margin-bottom: 28px; }
  .qm-breadcrumb { font-size: 12px; color: #cbd5e1; margin-bottom: 5px; font-family: 'Roboto', sans-serif; }
  .qm-page-title { font-family: 'Roboto', sans-serif; font-size: 30px; font-weight: 600; color: #1e293b; }
  .qm-page-sub { font-size: 14px; color: #94a3b8; margin-top: 3px; font-family: 'Roboto', sans-serif; font-weight: 500; }
  .qm-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 32px; }
  .qm-stat { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 6px; padding: 15px 17px; }
  .qm-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.9px; color: #cbd5e1; margin-bottom: 5px; font-family: 'Roboto', sans-serif; font-weight: 600; }
  .qm-stat-value { font-size: 24px; font-weight: 600; color: #1e293b; font-family: 'Roboto', sans-serif; }
  .qm-sec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .qm-sec-label { font-size: 10px; font-weight: 600; letter-spacing: 1.3px; text-transform: uppercase; color: #cbd5e1; white-space: nowrap; font-family: 'Roboto', sans-serif; }
  .qm-sec-line { flex: 1; height: 1px; background: rgba(0,0,0,0.07); }
  .qm-grid { display: grid; gap: 11px; margin-bottom: 32px; }
  .qm-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 6px; padding: 18px 16px 16px; cursor: pointer; display: flex; flex-direction: column; gap: 11px; position: relative; animation: qmFadeUp 0.3s ease both; transition: border-color 0.18s, transform 0.14s, box-shadow 0.18s; }
  .qm-card:hover { border-color: rgba(0,0,0,0.15); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
  .qm-card:active { transform: scale(0.97); }
  .qm-card.danger { background: #fff1f2; border-color: #fecdd3; }
  .qm-card.danger:hover { border-color: #fda4af; }
  .qm-card.ecome { background: linear-gradient(180deg, #79070d 0%, #a7010c 45%, #8f000a 100%); border-color: #86efac; }
  .qm-card.ecome:hover { border-color: #4ade80; box-shadow: 0 6px 24px rgba(22,163,74,0.12); }
  .qm-card-icon { width: 44px; height: 44px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .qm-card-name { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 3px; font-family: 'Roboto', sans-serif; }
  .qm-card-desc { font-size: 12px; color: #94a3b8; line-height: 1.4; font-family: 'Roboto', sans-serif; font-weight: 400; }
  .qm-card-arrow { position: absolute; top: 15px; right: 14px; font-size: 13px; color: #e2e8f0; }
  .qm-card-badge { position: absolute; top: 13px; right: 34px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; letter-spacing: 0.6px; text-transform: uppercase; font-family: 'Roboto', sans-serif; }
  .qm-root { width: 100vw; min-height: 100vh; height: 100vh; background: #fff; align-items: stretch; justify-content: stretch; padding: 0; }
  .qm-shell { width: 100vw; height: 100vh; display: grid; grid-template-columns: 216px minmax(0, 1fr); background: #fff; border: 0; border-radius: 0; overflow: hidden; box-shadow: none; }
  .qm-topbar { display: none; }
  .qm-body { display: contents; }
      .qm-sidebar {
    width: auto;
    background: var(--qm-sidebar-bg, #9d0410);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  .qm-sidebar > * { flex-shrink: 0; }
  .qm-brand {
    flex: 0 0 60px;
    height: 60px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    font-size: 20px;
    line-height: 26px;
    font-weight: 600;
    color: #ffffff;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255,255,255,0.25);
    margin-bottom: 8px;
    letter-spacing: -0.5px;
    font-family: 'Roboto', sans-serif;
  }
  .qm-brand span { color: #ffe4d1; }
   .qm-sec-title {
    color: rgba(255,255,255,0.75);
    font-size: 9px;
    letter-spacing: 2.5px;
    font-weight: 600;
    padding: 14px 20px 6px;
    text-transform: uppercase;
    font-family: 'Roboto', sans-serif;
  }
  .qm-nav-item {
    gap: 12px;
    padding: 10px 16px;
    margin: 1px 10px;
    border-radius: 6px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s;
    font-family: 'Roboto', sans-serif;
  }
  .qm-nav-item:hover {
    color: #ffffff;
    background: rgba(255,255,255,0.18);
    transform: translateX(2px);
  }
  .qm-nav-item.active {
    background: #ffffff !important;
    color: #c2410c !important;
    font-weight: 800;
    border-left: 3px solid #ffffff;
    padding-left: 13px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .qm-nav-item.danger { color: #ffe4e6 !important; }
  .qm-nav-item.danger:hover { background: rgba(225,29,72,0.25) !important; }
  .qm-nav-icon { width: 22px !important; height: 22px !important; background: transparent !important; }
  .qm-divider { display: block; height: 1px; background: rgba(255,255,255,0.25); margin: 6px 16px; }
  /* Premium / Verified user ka Profile open ho (yellow sidebar) — text white ki jagah black */
  .qm-sidebar.qm-sidebar-yellow .qm-brand { color: #111111; border-bottom-color: rgba(0,0,0,0.20); }
  .qm-sidebar.qm-sidebar-yellow .qm-brand span { color: #7c2d12; }
  .qm-sidebar.qm-sidebar-yellow .qm-sec-title { color: rgba(0,0,0,0.65); }
  .qm-sidebar.qm-sidebar-yellow .qm-nav-item { color: #111111; }
  .qm-sidebar.qm-sidebar-yellow .qm-nav-item:hover { color: #111111; background: rgba(0,0,0,0.08); }
  .qm-sidebar.qm-sidebar-yellow .qm-nav-item.active { color: #c2410c !important; }
  .qm-sidebar.qm-sidebar-yellow .qm-nav-item.danger { color: #b91c1c !important; }
  .qm-sidebar.qm-sidebar-yellow .qm-divider { background: rgba(0,0,0,0.20); }
  .qm-main { position: relative; padding: 26px 28px 32px; overflow-y: auto; background: #fff; }
  .qm-main::after { display: none; }
  .qm-page-header { display: none; }
  .qm-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 0 0 22px; width: 100%; }
  .qm-stat { min-height: 134px; border-radius: 6px; padding: 24px 16px 16px; background: #fff; box-shadow: none; }
  .qm-stat.wallet { border-color: #fdba74; }
  .qm-stat.network { border-color: #bfdbfe; }
  .qm-stat.articles { border-color: #ddd6fe; }
  .qm-stat.alerts { border-color: #fecdd3; }
  .qm-stat-icon { height: 24px; display: flex; align-items: center; margin-bottom: 7px; }
  .qm-stat-label { font-size: 8px; letter-spacing: 1px; font-weight: 600; margin-bottom: 1px; font-family: 'Roboto', sans-serif; }
  .qm-stat.wallet .qm-stat-label { color: #ea580c; }
  .qm-stat.network .qm-stat-label { color: #2563eb; }
  .qm-stat.articles .qm-stat-label { color: #6d28d9; }
  .qm-stat.alerts .qm-stat-label { color: #e11d48; }
  .qm-stat-value { font-size: 22px; line-height: 25px; color: #020617; font-weight: 600; font-family: 'Roboto', sans-serif; }
  .qm-stat-sub { font-size: 11px; line-height: 14px; margin-top: 6px; font-family: 'Roboto', sans-serif; font-weight: 400; }
  .qm-sec-header { margin: 0 0 10px; }
  .qm-sec-line { display: none; }
  .qm-sec-label { color: #ea580c; font-size: 9px; letter-spacing: 1.8px; font-weight: 600; padding-left: 7px; font-family: 'Roboto', sans-serif; }
  .qm-section-main .qm-sec-label { color: #ea580c; }
  .qm-section-finance .qm-sec-label { color: #4f46e5; }
  .qm-section-content .qm-sec-label { color: #6d28d9; }
  .qm-section-marketplace .qm-sec-label { color: #16a34a; }
  .qm-section-account .qm-sec-label { color: #e11d48; }
  .qm-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 10px; margin-bottom: 22px; width: 100%; }
  .qm-card { min-height: 96px; border-radius: 6px; padding: 24px 12px 12px; gap: 9px; box-shadow: none; }
  .qm-card:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(234, 88, 12, 0.10); }
  .qm-card-icon { width: 32px; height: 28px; border-radius: 6px; background: transparent !important; }
  .qm-card-name { font-size: 13px; line-height: 16px; margin: 0; font-weight: 600; font-family: 'Roboto', sans-serif; }
  .qm-card-desc { display: none; }
  .qm-card-arrow { display: none; }
  .qm-card-badge { top: 8px; right: 34px; background: transparent !important; padding: 0; font-size: 8px; font-family: 'Roboto', sans-serif; font-weight: 600; }
  .qm-card.style-blue { border-color: #fdba74; color: #ea580c; }
  .qm-card.style-purple { border-color: #ddd6fe; }
  .qm-card.style-teal { border-color: #99f6e4; }
  .qm-card.style-green, .qm-card.style-farmGreen { border-color: #bbf7d0; }
  .qm-card.style-amber { border-color: #fde68a; }
  .qm-card.style-orange { border-color: #fb923c; }
  .qm-card.style-pink { border-color: #f5d0fe; }
  .qm-card.style-indigo { border-color: #c7d2fe; }
  .qm-card.style-red { border-color: #fecdd3; }
  .qm-card.style-cyan { border-color: #a5f3fc; }
  .qm-card.danger { border-color: #fecdd3; background: #fff; }
  @media (min-width: 1500px) {
    .qm-shell { grid-template-columns: 232px minmax(0, 1fr); }
    .qm-main { padding: 28px 34px 36px; }
    .qm-stats, .qm-grid { gap: 12px; }
    .qm-stat { min-height: 136px; }
    .qm-card { min-height: 100px; }
  }
  @media (max-width: 760px) {
    .qm-shell { grid-template-columns: 1fr; height: 100vh; }
    .qm-sidebar { display: none; }
    .qm-stats, .qm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  .qm-shell { grid-template-columns: 256px minmax(0, 1fr); }
  .qm-sidebar { height: 100vh; overflow-y: auto; }
    .qm-module-item.active { background: #ffffff !important; color: #9d0410 !important; }
  .qm-module-item.danger { color: #e11d48 !important; }
 .qm-content-panel { min-width: 0; height: 100vh; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
  .qm-main { padding: 0 !important; overflow: hidden !important; background: #fff !important; }
  .qm-main > .qm-page-header,
  .qm-main > .qm-stats,
  .qm-main > div[class^="qm-section-"] { display: none !important; }
  .qm-embedded-page {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
  .qm-embedded-page > div {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
  @media (max-width: 760px) {
    html, body, #root { overflow: auto; }
    .qm-root { height: auto; min-height: 100vh; overflow: auto; }
    .qm-shell { width: 100vw; height: auto; min-height: 100vh; display: block; grid-template-columns: 1fr !important; overflow: visible; border-width: 0; }
    .qm-sidebar { display: none !important; }
    .qm-main { height: auto !important; min-height: 100vh; overflow: auto !important; padding: 14px !important; background: #fff !important; }
    .qm-content-panel { display: none !important; }
    .qm-main > .qm-page-header,
    .qm-main > .qm-stats,
    .qm-main > div[class^="qm-section-"] { display: block !important; }
    .qm-page-header { margin: 4px 0 18px; }
    .qm-page-title { font-size: 26px; font-family: 'Roboto', sans-serif; font-weight: 600; }
    .qm-page-sub { font-size: 13px; line-height: 18px; font-family: 'Roboto', sans-serif; font-weight: 400; }
    .qm-stats { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px; margin-bottom: 18px; }
    .qm-stat { min-height: 104px; padding: 16px 12px 12px; border-radius: 6px; }
    .qm-stat-value { font-size: 19px; line-height: 23px; font-family: 'Roboto', sans-serif; font-weight: 600; }
    .qm-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px; margin-bottom: 18px; }
    .qm-card { min-height: 92px; padding: 16px 10px 12px; border-radius: 6px; }
    .qm-card-name { font-size: 12px; line-height: 15px; overflow-wrap: anywhere; font-family: 'Roboto', sans-serif; font-weight: 600; }
    .qm-main::after { display: none; }
  }
`;

// ── CSS ab sirf QuickMenuWeb ke mount hone par inject hoga (neeche dekho),
// aur unmount hone par hata diya jayega — taaki dusre pages (Home, News
// Details, etc.) permanently "overflow: hidden" se affect na ho.

// All quick menu items (used in mobile list + web main cards)
const MENU_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Post News', icon: 'add-circle-outline', screen: 'Add News', iconStyle: 'blue' },
      { label: 'Profile', icon: 'person-circle-outline', screen: 'Profile', iconStyle: 'purple' },
      { label: 'News Feed', icon: 'newspaper-outline', screen: 'News Feed', iconStyle: 'teal', badge: 'New' },
      { label: 'My Network', icon: 'people-outline', screen: 'My Network', iconStyle: 'green' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', iconStyle: 'amber' },
      { label: 'Withdraw', icon: 'cash-outline', screen: 'Withdraw', iconStyle: 'orange' },
     { label: 'Subscription Plans', icon: 'diamond-outline', screen: 'Subscription Plans', iconStyle: 'pink' },
      { label: 'My Subscription', icon: 'layers-outline', screen: 'My Subscriptions', iconStyle: 'pink' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'e-Paper', icon: 'document-text-outline', screen: 'e-Paper', iconStyle: 'indigo' },
      { label: 'Live Streaming', icon: 'radio-outline', screen: 'Live Streaming', iconStyle: 'red', badge: 'LIVE', badgeColor: '#16a34a' },
      { label: 'Certification', icon: 'ribbon-outline', screen: 'Certification', iconStyle: 'cyan' },
      { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', iconStyle: 'green', badge: '0', badgeColor: '#e11d48' },
    ],
  },
  {
    title: 'Marketplace',
    items: [
    { label: 'Buy Product', icon: 'cart-outline', screen: 'FarmingBuy', iconStyle: 'farmGreen' },
      { label: 'Sell Product', icon: 'cloud-upload-outline', screen: 'Sell', iconStyle: 'farmGreen' },
      { label: 'My Ecom Product', icon: 'storefront-outline', screen: 'CommerceAdsCenter', iconStyle: 'farmGreen' },
      { label: 'Ecom Enquiries', icon: 'chatbubbles-outline', screen: 'MyEnquiries', iconStyle: 'orange' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Logout', icon: 'log-out-outline', screen: '__logout__', iconStyle: 'rose', isDestructive: true },
    ],
  },
];

// Looping pulse used to make the Live Streaming badge/icon blink for attention
function useBlink() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

function BlinkBadge({ children, style }) {
  const anim = useBlink();
  return (
    <Animated.View style={[style, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}>
      {children}
    </Animated.View>
  );
}

const ICON_STYLES = {
  blue:      { bg: '#eff6ff', border: '#dbeafe', color: '#2563eb' },
  purple:    { bg: '#f5f3ff', border: '#ede9fe', color: '#7c3aed' },
  teal:      { bg: '#f0fdfa', border: '#ccfbf1', color: '#0d9488' },
  green:     { bg: '#f0fdf4', border: '#dcfce7', color: '#16a34a' },
  amber:     { bg: '#fffbeb', border: '#fef3c7', color: '#d97706' },
  orange:    { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' },
  pink:      { bg: '#fdf2f8', border: '#fce7f3', color: '#db2777' },
  indigo:    { bg: '#eef2ff', border: '#e0e7ff', color: '#4f46e5' },
  red:       { bg: '#fff1f2', border: '#ffe4e6', color: '#e11d48' },
  cyan:      { bg: '#ecfeff', border: '#cffafe', color: '#0891b2' },
  rose:      { bg: '#fff1f2', border: '#fecdd3', color: '#f43f5e' },
  farmGreen: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
};

// Single uniform icon color/background used everywhere (cards + list rows)
// so icons no longer differ per category. Destructive (Logout) and the
// active sidebar item still get their own colors on purpose.
const UNIFORM_ICON = { bg: '#fff7ed', border: '#fed7aa', color: '#94a3b8' };

const CARD_DESCS = {
  'Post News': 'Share a story with your network',
  'Profile': 'Edit your public profile & bio',
  'News Feed': 'Latest stories from your network',
  'My Network': 'Manage connections & follows',
  'Wallet': 'Check balance & transactions',
  'Withdraw': 'Transfer earnings to bank',
 'Subscription Plans': 'Upgrade or manage your plan',
  'My Subscription': 'All your active plans in one place',
  'e-Paper': 'Read the digital edition',
  'Live Streaming': 'Go live or watch broadcasts',
  'Certification': 'Earn & showcase credentials',
 'Notifications': '0 unread alerts waiting',
  'Buy Product': 'Browse products listed for sale',
  'Sell Product': 'List your product for sale',
  'My Ecom Product': 'Edit or delete your products',
  'Ecom Enquiries': 'Received & sent enquiries',
  'Logout': 'Sign out of your account',
};

// ✅ "Subscription Plans" par hover karte hi ye 4 options flyout me dikhte hain
// (pehle ye "My Subscription" page ke andar 4 rows the, ab sidebar se direct).
const SUBSCRIPTION_SUBMENU = [
  { label: 'Role / Membership Plans', icon: 'ribbon-outline', screen: 'Subscription Plans' },
  { label: 'Quiz Subscription Plans', icon: 'checkbox-outline', screen: 'My Quiz Subscription' },
  { label: 'Ads Subscription Plans', icon: 'trending-up-outline', screen: 'AdPlans' },
  { label: 'Ecom Subscription Plans', icon: 'bag-handle-outline', screen: 'My Ecom Subscription' },
];

// In screens par bhi sidebar rehna chahiye (purchase list pages) — Subscription Plans active dikhe
const SUBSCRIPTION_GROUP_SCREENS = [
  'Subscription Plans', 'My Quiz Subscription', 'AdPlans', 'My Subscriptions', 'QuizSubscription',
];

// ✅ "Ecommerce" par hover => Ecom Subscription Plans / Sell Product / Buy Product
// (purana "Ecome (buy / sell)" landing page ab nahi dikhta)
const ECOM_SUBMENU = [
  { label: 'Ecom Subscription Plans', icon: 'bag-handle-outline', screen: 'My Ecom Subscription' },
  { label: 'Sell Product', icon: 'cloud-upload-outline', screen: 'Sell' },
  { label: 'Buy Product', icon: 'cart-outline', screen: 'FarmingBuy' },
  { label: 'My Ecom Product', icon: 'storefront-outline', screen: 'CommerceAdsCenter' },
];
const ECOM_GROUP_SCREENS = ['My Ecom Subscription', 'EcomSubscription', 'Sell', 'FarmingBuy', 'CommerceAdsCenter'];
// ✅ "Certification" par hover => Quiz Subscription Plans / Start Quiz / My Attempts
const CERT_SUBMENU = [
  { label: 'Quiz Subscription Plans', icon: 'card-outline', screen: 'My Quiz Subscription' },
  { label: 'Start Quiz', icon: 'play-circle-outline', screen: 'Certification' },
  { label: 'My Attempts', icon: 'list-outline', screen: 'MyAttempts' },
];
const CERT_GROUP_SCREENS = ['Certification', 'MyAttempts', 'My Quiz Subscription', 'QuizSubscription'];
// Ye screens do dropdowns me aati hain (Subscription Plans + Certification) — jis group se khola wahi highlight ho
const SHARED_GROUP_SCREENS = ['My Quiz Subscription', 'QuizSubscription'];
// Jo screen web par kabhi nahi dikhni chahiye => uski jagah ye khule
const SCREEN_ALIAS = { Ecome: 'FarmingBuy' };

const WEB_MODULES = [
  { label: 'Home', icon: 'home-outline', screen: 'Home', iconStyle: 'orange', isNavigation: true },
  { label: 'Profile', icon: 'person-circle-outline', screen: 'Profile', iconStyle: 'purple', component: ProfileScreen },
  { label: 'Post News', icon: 'add-circle-outline', screen: 'Add News', iconStyle: 'blue', component: AddNewsScreen },
  { label: 'News Feed', icon: 'newspaper-outline', screen: 'News Feed', iconStyle: 'teal', component: NewsFeedScreen },
  { label: 'My Network', icon: 'people-outline', screen: 'My Network', iconStyle: 'green', component: MyNetworkScreen },
  { label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', iconStyle: 'amber', component: WalletScreen },
  { label: 'Withdraw', icon: 'cash-outline', screen: 'Withdraw', iconStyle: 'orange', component: WithdrawScreen },
  { label: 'Subscription Plans', icon: 'diamond-outline', screen: 'Subscription Plans', iconStyle: 'pink', component: SubscriptionPlansScreen, subMenu: SUBSCRIPTION_SUBMENU, groupScreens: SUBSCRIPTION_GROUP_SCREENS },
  // sidebar me ab nahi dikhte (hideInSidebar) — sirf embedded screens ke taur par registered, taaki sidebar bana rahe
  { label: 'My Subscription', icon: 'layers-outline', screen: 'My Subscriptions', iconStyle: 'pink', component: MySubscriptionsScreen, hideInSidebar: true },
  { label: 'Quiz Subscription Plans', icon: 'checkbox-outline', screen: 'My Quiz Subscription', iconStyle: 'pink', component: MyQuizSubscriptionScreen, hideInSidebar: true },
  { label: 'Ads Subscription Plans', icon: 'trending-up-outline', screen: 'AdPlans', iconStyle: 'pink', component: AdPlansScreen, hideInSidebar: true },
  // ✅ FIX: Quiz / Ecom subscription ki "purchase" list screens bhi embedded — pehle standalone khulti thi (bina sidebar)
  { label: 'Quiz Subscription', icon: 'checkbox-outline', screen: 'QuizSubscription', iconStyle: 'pink', component: QuizSubscriptionScreen, hideInSidebar: true },
  { label: 'Ecom Subscription', icon: 'bag-handle-outline', screen: 'EcomSubscription', iconStyle: 'pink', component: EcomSubscriptionScreen, hideInSidebar: true },
  { label: 'Ecom Subscription Plans', icon: 'bag-handle-outline', screen: 'My Ecom Subscription', iconStyle: 'pink', component: MyEcomSubscriptionScreen, hideInSidebar: true },
  { label: 'e-Paper', icon: 'document-text-outline', screen: 'e-Paper', iconStyle: 'indigo', component: EPaperScreen },
  { label: 'Live Streaming', icon: 'radio-outline', screen: 'Live Streaming', iconStyle: 'red', component: LiveStreamingScreen, relatedScreens: ['Start Live'] },
  // Start Live bhi sidebar ke andar khulta hai (Live Streaming highlighted rehta hai)
  { label: 'Start Live', icon: 'radio-outline', screen: 'Start Live', iconStyle: 'red', component: LiveBroadcastScreen, hideInSidebar: true },
  { label: 'Certification', icon: 'ribbon-outline', screen: 'Certification', iconStyle: 'cyan', component: CertificationScreen, subMenu: CERT_SUBMENU, groupScreens: CERT_GROUP_SCREENS },
  { label: 'My Attempts', icon: 'list-outline', screen: 'MyAttempts', iconStyle: 'cyan', component: MyAttemptsScreen, hideInSidebar: true },
  { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', iconStyle: 'green', component: NotificationsScreen },
{ label: 'Ecommerce', icon: 'leaf-outline', screen: '__ecom__', iconStyle: 'farmGreen', subMenu: ECOM_SUBMENU, groupScreens: ECOM_GROUP_SCREENS, toggleOnly: true },
  { label: 'Sell Product', icon: 'cloud-upload-outline', screen: 'Sell', iconStyle: 'farmGreen', component: SellScreen, hideInSidebar: true },
  { label: 'Buy Product', icon: 'cart-outline', screen: 'FarmingBuy', iconStyle: 'farmGreen', component: FarmingBuyScreen, hideInSidebar: true },
  { label: 'My Ecom Product', icon: 'storefront-outline', screen: 'CommerceAdsCenter', iconStyle: 'farmGreen', component: CommerceAdsCenterScreen, hideInSidebar: true },
  { label: 'Ecom Enquiries', icon: 'chatbubbles-outline', screen: 'MyEnquiries', iconStyle: 'orange', component: MyEnquiriesScreen },
  // Baaki saare pages bhi ab sidebar ke andar khulte hain
  { label: 'My Ads', icon: 'document-outline', screen: 'MyAds', iconStyle: 'orange', component: SbMyAdsPage, hideInSidebar: true },
  { label: 'Payment History', icon: 'document-outline', screen: 'PaymentHistory', iconStyle: 'orange', component: SbPaymentHistoryPage, hideInSidebar: true },
  { label: 'Settings', icon: 'document-outline', screen: 'Settings', iconStyle: 'orange', component: SbSettingsPage, hideInSidebar: true },
  { label: 'My Listings', icon: 'document-outline', screen: 'MyListings', iconStyle: 'orange', component: SbMyListingsPage, hideInSidebar: true },
  { label: 'Received Enquiries', icon: 'document-outline', screen: 'SellerEnquiryDashboard', iconStyle: 'orange', component: SbSellerEnquiryDashboardPage, hideInSidebar: true },
  { label: 'Seller Reports', icon: 'document-outline', screen: 'SellerReports', iconStyle: 'orange', component: SbSellerReportsPage, hideInSidebar: true },
  { label: 'My Ad Subscription', icon: 'document-outline', screen: 'MyAdSubscription', iconStyle: 'orange', component: SbMyAdSubscriptionPage, hideInSidebar: true },
  { label: 'Plan Details', icon: 'document-outline', screen: 'SubscriptionPlanDetails', iconStyle: 'orange', component: SbSubscriptionPlanDetailsPage, hideInSidebar: true },
  { label: 'Payment', icon: 'document-outline', screen: 'Payment', iconStyle: 'orange', component: SbPaymentPage, hideInSidebar: true },
  { label: 'Advertise', icon: 'document-outline', screen: 'Advertise', iconStyle: 'orange', component: SbAdvertisePage, hideInSidebar: true },
  { label: 'Blocked Users', icon: 'document-outline', screen: 'BlockedUsersScreen', iconStyle: 'orange', component: SbBlockedUsersScreenPage, hideInSidebar: true },
  { label: 'Refer', icon: 'document-outline', screen: 'Refer', iconStyle: 'orange', component: SbReferPage, hideInSidebar: true },
  { label: 'Choose Plan', icon: 'document-outline', screen: 'ChoosePlan', iconStyle: 'orange', component: SbChoosePlanPage, hideInSidebar: true },
  { label: 'Blue Tick', icon: 'document-outline', screen: 'PurchaseBlueTick', iconStyle: 'orange', component: SbPurchaseBlueTickPage, hideInSidebar: true },
  { label: 'Ad Lead Response', icon: 'document-outline', screen: 'AdLeadResponse', iconStyle: 'orange', component: SbAdLeadResponsePage, hideInSidebar: true },
  { label: 'Logout', icon: 'log-out-outline', screen: '__logout__', iconStyle: 'rose', isDestructive: true },
];

// ─────────────────────────────────────────────
//  WEB LAYOUT
// ─────────────────────────────────────────────
const SLUG_TO_SCREEN = {
  profile: 'Profile',
  'post-news': 'Add News',
  'news-feed': 'News Feed',
  'my-network': 'My Network',
  wallet: 'Wallet',
  withdraw: 'Withdraw',
  'subscription-plans': 'Subscription Plans',
  'my-subscription': 'My Subscriptions',
  'my-subscriptions': 'My Subscriptions',
  epaper: 'e-Paper',
  'e-paper': 'e-Paper',
  'live-streaming': 'Live Streaming',
  certification: 'Certification',
  notifications: 'Notifications',
  ecome: 'FarmingBuy',
  ecommerce: 'FarmingBuy',
  shop: 'FarmingBuy',
  sell: 'Sell',
  buy: 'FarmingBuy',
  'commerce-ads-center': 'CommerceAdsCenter',
  'commerce-hub': 'CommerceAdsCenter',
  'ecom-enquiries': 'MyEnquiries',
  enquiries: 'MyEnquiries',
  settings: 'Settings',
  'my-ads': 'MyAds',
  farming: 'FarmingBuy',
};

const SCREEN_TO_SLUG = {
  Profile: 'profile',
  'Add News': 'post-news',
  'News Feed': 'news-feed',
  'My Network': 'my-network',
  Wallet: 'wallet',
  Withdraw: 'withdraw',
  'Subscription Plans': 'subscription-plans',
  'My Subscriptions': 'my-subscription',
  'e-Paper': 'epaper',
  'Live Streaming': 'live-streaming',
  Certification: 'certification',
  Notifications: 'notifications',
  Ecome: 'ecome',
  Sell: 'sell',
  MyEnquiries: 'ecom-enquiries',
  Settings: 'settings',
  MyAds: 'my-ads',
  FarmingBuy: 'farming',
  CommerceAdsCenter: 'commerce-ads-center',
};

function QuickMenuWeb({ navigation, route }) {
  const { logout } = useAuth();
  // Header / navbar se aaya ho to wahi screen (Profile / Notifications / ...) sidebar ke saath khulegi
  const resolveTargetScreen = (param) => {
    if (!param) return null;
    if (SCREEN_ALIAS[param]) return SCREEN_ALIAS[param];
    const lower = String(param).toLowerCase();
    if (SLUG_TO_SCREEN[lower]) return SLUG_TO_SCREEN[lower];
    const match = WEB_MODULES.find(
      (m) => m.screen && (m.screen.toLowerCase() === lower || m.label.toLowerCase() === lower)
    );
    return match?.screen || null;
  };

  const initialTarget = resolveTargetScreen(route?.params?.screen) || resolveTargetScreen(route?.params?.initialScreen);
  const initialScreen = (WEB_MODULES.find((m) => m.screen === initialTarget && m.component) || {}).screen || 'Profile';
  const [activeScreen, setActiveScreen] = React.useState(initialScreen);
  // ✅ FIX (web): embedded screens ko navigate() ke params (jaise editItem) aur `route` pehle milte hi nahi the,
  // isliye News Feed se Edit dabane par Add News hamesha khaali form kholta tha.
  // Standalone page se redirect hua ho (useQuickMenuRedirect) to uske params (quizItem, editListing, returnTo...) yahin se milte hain
  const [screenParams, setScreenParams] = React.useState(() => (
    route?.params?.screenParams && initialTarget ? { [initialScreen]: route.params.screenParams } : {}
  ));
  const activeScreenRef = React.useRef(initialScreen);
  activeScreenRef.current = activeScreen;
  // QuickMenu pehle se khula ho aur navbar se dobara navigate ho (naya initialScreen) to switch karo
  React.useEffect(() => {
    const target = resolveTargetScreen(route?.params?.screen) || resolveTargetScreen(route?.params?.initialScreen);
    if (target && WEB_MODULES.find((m) => m.screen === target && m.component)) {
      historyRef.current = [];
      if (route?.params?.screenParams) setScreenParams((prev) => ({ ...prev, [target]: route.params.screenParams }));
      setActiveScreen(target);
    }
  }, [route?.params?.screen, route?.params?.initialScreen, route?.params?.ts]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const handlePop = () => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts[0] === 'menu' && parts[1]) {
        const found = resolveTargetScreen(parts[1]);
        if (found) setActiveScreen(found);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);
  const historyRef = React.useRef([]);
  const [profileTier, setProfileTier] = React.useState(PROFILE_TIERS.common);
  // Subscription Plans par hover => uske NICHE 4 options ki list khulti hai
  // Dropdown (Subscription Plans / Certification / Ecommerce): click karne par khulta hai, dobara click karne par band.
  // openMenus[label] = true/false (user ne jo kiya); set nahi hai to current screen ke group me hone par khula dikhta hai.
  const [openMenus, setOpenMenus] = React.useState({});
  const [lastGroup, setLastGroup] = React.useState(null);  // shared screens (Quiz Subscription) kis dropdown se khuli

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const _styleId = 'qm-web-styles';
    let _el = document.getElementById(_styleId);
    const alreadyExisted = Boolean(_el);
    if (!_el) {
      _el = document.createElement('style');
      _el.id = _styleId;
      _el.textContent = QM_CSS;
      document.head.appendChild(_el);
    }
    return () => {
      // Sirf tab hatao jab ye screen khud isne banaya tha — taaki dusre
      // pages par jaate hi html/body ka overflow:hidden hat jaye.
      if (!alreadyExisted) {
        const existing = document.getElementById(_styleId);
        if (existing) existing.remove();
      }
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await UserStore.getCurrentUser();
      if (mounted && user) setProfileTier(getProfileTier({ ...user, has_blue_tick: UserStore.hasBlueTick(user) }));
    })();
    return () => { mounted = false; };
  }, [activeScreen]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    // Profile open ho to profile-owner ki exact tier artwork sidebar me bhi
    // dikhe. Baaki sab modules par normal profile-red artwork return hota hai.
    const activeAsset = activeScreen === 'Profile' ? profileTier?.bgImage : _redAsset;
    const uri = typeof activeAsset === 'string'
      ? activeAsset
       : (typeof Image.resolveAssetSource === 'function'
          ? (Image.resolveAssetSource(activeAsset)?.uri || activeAsset?.uri || SIDEBAR_RED_URI)
          : (activeAsset?.uri || activeAsset?.default || SIDEBAR_RED_URI));
    const bg = uri ? `url("${uri}")` : '#9d0410';
    document.documentElement.style.setProperty('--qm-sidebar-bg', bg);
  }, [activeScreen, profileTier]);
  const [isMobileWeb, setIsMobileWeb] = React.useState(() => {
    return Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth <= 760;
  });
  // Profile open + user ki tier yellow artwork (Premium / Verified) => sidebar par black text
  const isYellowSidebar = activeScreen === 'Profile' && profileTier?.bgImage === PROFILE_BG_YELLOW;
  const activeModule = WEB_MODULES.find((item) => item.screen === activeScreen) || WEB_MODULES[0];
  const ActiveComponent = activeModule.component || ProfileScreen;

  const embeddedNavigation = React.useMemo(() => {
    const goToEmbedded = (screenName, params) => {
      const cur = activeScreenRef.current;
      if (screenName !== cur) historyRef.current.push(cur);   // goBack() isi par wapas jayega
      setScreenParams((prev) => ({ ...prev, [screenName]: params }));
      setActiveScreen(screenName);
    };
    const openScreen = (screenName, ...args) => {
      screenName = SCREEN_ALIAS[screenName] || screenName;
      const module = WEB_MODULES.find((item) => item.screen === screenName && item.component);
      if (module) {
        goToEmbedded(screenName, args[0]);
        return;
      }
      navigation.navigate(screenName, ...args);
    };

    return {
      ...navigation,
      isQuickMenuEmbedded: true,   // standalone-redirect guard isse pehchanta hai
      navigate: openScreen,
      replace: openScreen,
      canGoBack: () => true,
      // ✅ FIX: back pehle hamesha 'Profile' set karta tha, to Profile / Notifications par back kuch karta hi nahi tha.
      // Ab: pehle embedded history, phir real stack, phir Home.
      goBack: () => {
        const prev = historyRef.current.pop();
        if (prev) { setActiveScreen(prev); return; }
        try {
          if (navigation?.canGoBack?.()) { navigation.goBack(); return; }
        } catch (_) { /* neeche Home */ }
        navigation.navigate('Home');
      },
      dispatch: (action) => {
        const lastRoute = action?.payload?.routes?.[action.payload.routes.length - 1];
        const nextRoute = SCREEN_ALIAS[lastRoute?.name] || lastRoute?.name;
        const module = WEB_MODULES.find((item) => item.screen === nextRoute && item.component);
        if (module) {
          goToEmbedded(nextRoute, lastRoute?.params);
          return;
        }
        navigation.dispatch(action);
      },
    };
  }, [navigation]);

  const handlePress = async (item) => {
    if (item.toggleOnly) return; // dropdown toggle render me hota hai
    if (item.screen === '__logout__') {
      await logout?.();
      navigation.navigate('Home');
      return;
    }
    if (item.isNavigation) {
      navigation.navigate(item.screen);
      return;
    }
    // Sidebar se khulne par hamesha fresh screen (purane edit params / history nahi)
    historyRef.current = [];
    setScreenParams((prev) => ({ ...prev, [item.screen]: undefined }));
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const slug = SCREEN_TO_SLUG[item.screen] || item.screen.toLowerCase().replace(/\s+/g, '-');
      try {
        window.history.pushState(null, '', `/menu/${slug}`);
      } catch (_) {}
    }
    setActiveScreen(item.screen);
  };

  // Sirf resize listener — CSS injection hataya gaya (ab module-level pe hoti hai)
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const updateLayout = () => setIsMobileWeb(window.innerWidth <= 760);
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  if (isMobileWeb) {
    return <QuickMenuMobile navigation={navigation} />;
  }

  return (
    <div className="qm-root">
      {/* TOPBAR */}
      <div className="qm-topbar">
        <div className="qm-logo">RTI India <span>News</span></div>
        <div className="qm-search">
          <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span>Search…</span>
        </div>
        <div className="qm-notif">
          <svg width="15" height="15" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div className="qm-notif-dot" />
        </div>
        <div className="qm-avatar">U</div>
      </div>

      <div className="qm-shell">
             <aside className={`qm-sidebar${isYellowSidebar ? ' qm-sidebar-yellow' : ''}`}>
                    <div className="qm-brand">RTI India <span>News</span></div>
          {[{ title: 'Navigation', items: WEB_MODULES }].map((section) => (
            <div key={section.title}>
              <div className="qm-sec-title">{section.title}</div>
              {section.items.filter((item) => !item.hideInSidebar).map((item) => {
                const hasSub = Array.isArray(item.subMenu) && item.subMenu.length > 0;
                const inGroup = hasSub && Array.isArray(item.groupScreens) && item.groupScreens.includes(activeScreen)
                  && (!SHARED_GROUP_SCREENS.includes(activeScreen) || (lastGroup || 'Subscription Plans') === item.label);
                const isItemActive = item.screen === activeScreen || inGroup || (Array.isArray(item.relatedScreens) && item.relatedScreens.includes(activeScreen));
                const subVisible = hasSub && (openMenus[item.label] !== undefined ? openMenus[item.label] : inGroup);
                const subTextColor = isYellowSidebar ? '#111111' : '#ffffff';
                return (
                <div key={item.label}>
                <div
                  className={`qm-nav-item qm-module-item${isItemActive ? ' active' : ''}${item.isDestructive ? ' danger' : ''}`}
                  onClick={() => (hasSub ? setOpenMenus((m) => ({ ...m, [item.label]: !subVisible })) : handlePress(item))}
                >
                  <div
                    className="qm-nav-icon"
                    style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={item.isDestructive ? (isYellowSidebar ? '#b91c1c' : '#ffe4e6') : isItemActive ? '#9d0410' : (isYellowSidebar ? '#111111' : '#ffffff')}
                    />
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {hasSub ? (
                    <Ionicons name={subVisible ? 'chevron-down' : 'chevron-forward'} size={14} color={isItemActive ? '#9d0410' : subTextColor} />
                  ) : null}
                </div>
                {subVisible ? (
                  <div style={{ margin: '2px 10px 4px 36px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {item.subMenu.map((sub) => {
                      const subActive = sub.screen === activeScreen
                        || (sub.screen === 'My Quiz Subscription' && activeScreen === 'QuizSubscription')
                        || (sub.screen === 'My Ecom Subscription' && activeScreen === 'EcomSubscription');
                      return (
                        <div
                          key={sub.screen}
                          onClick={() => { setLastGroup(item.label); setOpenMenus((m) => ({ ...m, [item.label]: true })); handlePress(sub); }}
                          onMouseEnter={(e) => { if (!subActive) e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = subActive ? 'rgba(255,255,255,0.28)' : 'transparent'; }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6,
                            cursor: 'pointer', fontSize: 12.5, fontWeight: subActive ? 800 : 600, color: subTextColor,
                            background: subActive ? 'rgba(255,255,255,0.28)' : 'transparent',
                            fontFamily: "'Roboto', sans-serif",
                          }}
                        >
                          <Ionicons name={sub.icon} size={14} color={subTextColor} />
                          <span>{sub.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                </div>
                );
              })}
              <div className="qm-divider" />
            </div>
          ))}
        </aside>

        <main className="qm-main">
          <div className="qm-content-panel">
            <div className="qm-embedded-page">
              <ActiveComponent
                key={`${activeScreen}:${screenParams[activeScreen]?.editItem?.id ?? ''}`}
                navigation={embeddedNavigation}
                route={{ key: activeScreen, name: activeScreen, params: screenParams[activeScreen] }}
              />
            </div>
          </div>
          <div className="qm-page-header">
            <div className="qm-breadcrumb">Dashboard <span style={{ color: '#94a3b8' }}>/ Quick Menu</span></div>
            <div className="qm-page-title">Quick Menu</div>
            <div className="qm-page-sub">All features at a glance — jump anywhere instantly.</div>
          </div>

          {/* Stats */}
          <div className="qm-stats">
            {[
              { label: 'Wallet', value: '₹4,820', sub: '↑ 12% this month', subColor: '#16a34a' },
              { label: 'Network', value: '1,340', sub: 'connections' },
              { label: 'Articles', value: '58', sub: 'published' },
           { label: 'Alerts', value: '0', sub: 'unread', subColor: '#e11d48' },
            ].map((s) => {
              const statMeta = {
                Wallet: { icon: 'wallet-outline', tone: 'wallet', color: '#ea580c' },
                Network: { icon: 'people-outline', tone: 'network', color: '#2563eb' },
                Articles: { icon: 'pencil-outline', tone: 'articles', color: '#6d28d9' },
                Alerts: { icon: 'notifications-outline', tone: 'alerts', color: '#e11d48' },
              }[s.label] || { icon: 'ellipse-outline', tone: '', color: '#64748b' };
              const statValue = s.label === 'Wallet' ? 'Rs. 4,820' : s.value;
              const statSub = s.label === 'Wallet' ? '+ 12% this month' : s.sub;
              return (
                <div key={s.label} className={`qm-stat ${statMeta.tone}`}>
                  <div className="qm-stat-icon">
                    <Ionicons name={statMeta.icon} size={16} color={statMeta.color} />
                  </div>
                  <div className="qm-stat-label">{s.label}</div>
                  <div className="qm-stat-value">{statValue}</div>
                  <div className="qm-stat-sub" style={{ color: s.subColor || '#111827' }}>{statSub}</div>
                </div>
              );
            })}
          </div>

          {/* Quick Menu Sections */}
          {MENU_SECTIONS.map((section, si) => (
            <div key={section.title} className={`qm-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="qm-sec-header">
                <span className="qm-sec-label">{section.title}</span>
                <div className="qm-sec-line" />
              </div>
              <div className="qm-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                {section.items.map((item, idx) => {
                  const ic = item.isDestructive ? ICON_STYLES.rose : UNIFORM_ICON;
                  const isEcome = item.screen === 'Ecome';
                  const isLive = item.screen === 'Live Streaming';
                  return (
                    <div
                      key={item.label}
                      className={`qm-card style-${item.iconStyle}${item.isDestructive ? ' danger' : ''}${isEcome ? ' ecome' : ''}${isLive ? ' is-live' : ''}`}
                      style={{ animationDelay: `${si * 0.04 + idx * 0.05}s` }}
                      onClick={() => handlePress(item)}
                    >
                      {item.badge && (
                        <span className={`qm-card-badge${isLive ? ' qm-live-badge' : ''}`} style={{
                          background: item.badgeColor ? item.badgeColor + '18' : '#eff6ff',
                          color: item.badgeColor || '#2563eb',
                        }}>{item.badge}</span>
                      )}
                      <div className={`qm-card-icon${isLive ? ' qm-live-icon' : ''}`} style={{ background: item.isDestructive ? '#ffe4e6' : ic.bg }}>
                        <Ionicons name={item.icon} size={22} color={item.isDestructive ? '#e11d48' : ic.color} />
                      </div>
                      <div>
                        <div className="qm-card-name" style={{ color: item.isDestructive ? '#e11d48' : ic.color }}>{item.label}</div>
                        <div className="qm-card-desc">{CARD_DESCS[item.label]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MOBILE LAYOUT
// ─────────────────────────────────────────────
function QuickMenuMobile({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const handlePress = async (item) => {
    if (item.screen === '__logout__') {
      await logout?.();
      navigation.navigate('Home');
      return;
    }
    // Wallet se back karne par wapas Quick Menu par aaye
    navigation.navigate(item.screen, item.screen === 'Wallet' ? { returnTo: 'QuickMenu' } : undefined);
  };

  return (
    <View style={styles.root}>
     <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('../assets/images/profile-red.png')}
        resizeMode="cover"
        imageStyle={styles.headerImg}
        style={[styles.header, Platform.OS === 'web' ? styles.headerWeb : { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Quick Menu</Text>
          <Text style={styles.headerSubtitle}>Access all features quickly</Text>
        </View>
      </ImageBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
      >
        {MENU_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.items.map((item) => {
              const style = item.isDestructive ? ICON_STYLES.rose : UNIFORM_ICON;
              const isEcome = item.screen === 'Ecome';
              const isLive = item.screen === 'Live Streaming';
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.listItem, isEcome && styles.ecomeItem, isLive && styles.liveItem]}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.6}
                >
                             {isLive ? (
                    <BlinkBadge style={styles.iconWrap}>
                      <Ionicons name={item.icon} size={30} color={style.color} />
                    </BlinkBadge>
                  ) : (
                    <View style={styles.iconWrap}>
                      <Ionicons name={item.icon} size={30} color={style.color} />
                    </View>
                  )}
                                    <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'stretch' }}>
                    <Text style={[styles.label, item.isDestructive && styles.labelDestructive, isEcome && styles.ecomeLabel, isLive && styles.liveLabel]}>
                      {item.label}
                    </Text>
                    {isEcome && (
                      <Text style={styles.ecomeDesc}>Buy, sell or rent e-commerce resources</Text>
                    )}
                    {isLive && (
                      <Text style={styles.liveDesc}>Tap to go live or watch now</Text>
                    )}
                  </View>
                  {item.badge && (
                    isLive ? (
                      <BlinkBadge style={[styles.badge, { backgroundColor: item.badgeColor ? item.badgeColor + '18' : '#eff6ff' }]}>
                        <Text style={[styles.badgeText, { color: item.badgeColor || '#2563eb' }]}>{item.badge}</Text>
                      </BlinkBadge>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: item.badgeColor ? item.badgeColor + '18' : '#eff6ff' }]}>
                        <Text style={[styles.badgeText, { color: item.badgeColor || '#2563eb' }]}>{item.badge}</Text>
                      </View>
                    )
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────
export default function QuickMenuScreen({ navigation, route }) {
  if (Platform.OS === 'web') return <QuickMenuWeb navigation={navigation} route={route} />;
  return <QuickMenuMobile navigation={navigation} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 16, 
    paddingBottom: 5, 
  },
  // Web (mobile view): fixed height red bar — image header ke bahar phail kar list ke upar na aaye
  headerWeb: {
    height: 64,
    flexShrink: 0,
    flexGrow: 0,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    paddingTop: 0,
  },
  headerImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
 headerTitle: { 
    fontSize: 15, 
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  headerSubtitle: { 
    fontSize: 11, 
    color: '#ffffff', 
    marginTop: 1,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },
  listContainer: { paddingHorizontal: 14, paddingTop: 4 },
 sectionLabel: { 
    fontSize: 10, 
    fontWeight: '400',
    color: '#94a3b8', 
    letterSpacing: 1.1, 
    textTransform: 'uppercase', 
    paddingTop: 16, 
    paddingBottom: 6, 
    paddingHorizontal: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
 listItem: { 
  flexDirection: 'row', 
  alignItems: 'center',   // 👈 ye line honi chahiye
  paddingVertical: 12,     // 9 se bada kar do thoda breathing space ke liye
  paddingHorizontal: 10, 
  gap: 13, 
  marginBottom: 2 
},
  ecomeItem: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 13,
    marginBottom: 4,
    borderRadius: 6, // ✅ Border radius 6px
  },
  ecomeLabel: { 
    color: '#15803d', 
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  ecomeDesc: { 
    fontSize: 11, 
    color: '#4ade80', 
    marginTop: 2,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  liveItem: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fda4af',
    paddingVertical: 13,
    marginBottom: 4,
    borderRadius: 6, // ✅ Border radius 6px
  },
  liveLabel: { 
    color: '#e11d48', 
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  liveDesc: { 
    fontSize: 11, 
    color: '#fb7185', 
    marginTop: 2,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  iconWrap: { 
    width: 48, 
    height: 48, 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center',
  },
 label: { 
  // FIX: pehle flex:1 tha — column wrapper me Text poori height le leta tha aur text upar chipak jaata tha
  // (icon neeche, naam upar). Ab text apni line-height me hi rehta hai aur wrapper use center karta hai.
  fontSize: 17,
  lineHeight: 22,
  includeFontPadding: false,  // Android ka extra top/bottom padding hataya
  textAlignVertical: 'center',
  fontWeight: '500',
  color: '#1e293b',
  fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
},
  labelDestructive: { 
    color: '#e11d48' 
  },
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 20,
    alignSelf: 'center',
  },
  badgeText: { 
    fontSize: 10, 
    includeFontPadding: false,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: FONT_FAMILY,
  },
});