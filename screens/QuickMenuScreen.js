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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import ProfileScreen from '../pages/ProfileScreen';
import AddNewsScreen from '../pages/Addnewsscreen';
import NewsFeedScreen from '../pages/NewsFeedScreen';
import MyNetworkScreen from '../pages/MyNetworkScreen';
import WalletScreen from '../pages/WalletScreen';
import WithdrawScreen from '../pages/WithdrawScreen';
import SubscriptionPlansScreen from '../pages/SubscriptionPlansScreen';
import EPaperScreen from '../pages/EPaperScreen';
import LiveStreamingScreen from '../pages/LiveStreamingScreen';
import CertificationScreen from '../pages/CertificationScreen';
import MySubscriptionsScreen from '../pages/MySubscriptionsScreen';
import NotificationsScreen from '../pages/NotificationsScreen';
import EcomeScreen from './EcomeScreen';

// Font Family
const FONT_FAMILY = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto';

// ─────────────────────────────────────────────
//  CSS STRING (module-level constant)
// ─────────────────────────────────────────────
const QM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');
  html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; background: #f5f4f0; }
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
  .qm-root { display: flex; flex-direction: column; height: 100vh; overflow: hidden; font-family: 'Roboto', sans-serif; background: #f5f4f0; }
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
  .qm-card.ecome { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #86efac; }
  .qm-card.ecome:hover { border-color: #4ade80; box-shadow: 0 6px 24px rgba(22,163,74,0.12); }
  .qm-card-icon { width: 44px; height: 44px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .qm-card-name { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 3px; font-family: 'Roboto', sans-serif; }
  .qm-card-desc { font-size: 12px; color: #94a3b8; line-height: 1.4; font-family: 'Roboto', sans-serif; font-weight: 400; }
  .qm-card-arrow { position: absolute; top: 15px; right: 14px; font-size: 13px; color: #e2e8f0; }
  .qm-card-badge { position: absolute; top: 13px; right: 34px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; letter-spacing: 0.6px; text-transform: uppercase; font-family: 'Roboto', sans-serif; }
  .qm-root { width: 100vw; min-height: 100vh; height: 100vh; background: #f8fafc; align-items: stretch; justify-content: stretch; padding: 0; }
  .qm-shell { width: 100vw; height: 100vh; display: grid; grid-template-columns: 216px minmax(0, 1fr); background: #fffdfb; border: 1px solid #fed7aa; border-radius: 0; overflow: hidden; box-shadow: none; }
  .qm-topbar { display: none; }
  .qm-body { display: contents; }
  .qm-sidebar {
    width: auto;
    border-right: 1px solid #f1e8e0;
    background: linear-gradient(180deg, #fff8f3 0%, #fffaf7 100%);
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  .qm-back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 14px 16px 0;
    padding: 7px 10px;
    border-radius: 6px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    width: fit-content;
    transition: background 0.15s, color 0.15s;
    font-family: 'Roboto', sans-serif;
  }
  .qm-back-btn:hover { background: #fff7ed; color: #ea580c; }
  .qm-brand {
    font-size: 20px;
    line-height: 26px;
    font-weight: 600;
    color: #0f172a;
    padding: 22px 20px 18px;
    border-bottom: 1px solid #ffe8d6;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
    font-family: 'Roboto', sans-serif;
  }
  .qm-brand span { color: #ea580c; }
  .qm-sec-title {
    color: #f97316;
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
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s;
    font-family: 'Roboto', sans-serif;
  }
  .qm-nav-item:hover {
    color: #ea580c;
    background: #fff7ed;
    transform: translateX(2px);
  }
  .qm-nav-item.active {
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
    color: #9a3412 !important;
    font-weight: 800;
    border-left: 3px solid #ea580c;
    padding-left: 13px;
    box-shadow: 0 2px 8px rgba(234,88,12,0.1);
  }
  .qm-nav-item.danger { color: #e11d48 !important; }
  .qm-nav-item.danger:hover { background: #fff1f2 !important; }
  .qm-nav-icon { width: 22px !important; height: 22px !important; background: transparent !important; }
  .qm-divider { display: block; height: 1px; background: linear-gradient(90deg, transparent, #ffe8d6, transparent); margin: 6px 16px; }
  .qm-main { position: relative; padding: 26px 28px 32px; overflow-y: auto; background: #fffdfb; }
  .qm-main::after { content: '•••'; position: absolute; top: 10px; right: 12px; color: #92400e; font-size: 13px; letter-spacing: 1px; }
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
  .qm-module-item.active { background: #ffedd5 !important; color: #9a3412 !important; }
  .qm-module-item.danger { color: #e11d48 !important; }
  .qm-content-panel { min-width: 0; height: 100vh; overflow: auto; background: #f8fafc; }
  .qm-main { padding: 0 !important; overflow: hidden !important; background: #f8fafc !important; }
  .qm-main > .qm-page-header,
  .qm-main > .qm-stats,
  .qm-main > div[class^="qm-section-"] { display: none !important; }
  .qm-embedded-page { height: 100vh; overflow: auto; }
  .qm-embedded-page > div { min-height: 100%; }
  @media (max-width: 760px) {
    html, body, #root { overflow: auto; }
    .qm-root { height: auto; min-height: 100vh; overflow: auto; }
    .qm-shell { width: 100vw; height: auto; min-height: 100vh; display: block; grid-template-columns: 1fr !important; overflow: visible; border-width: 0; }
    .qm-sidebar { display: none !important; }
    .qm-main { height: auto !important; min-height: 100vh; overflow: auto !important; padding: 14px !important; background: #fffdfb !important; }
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

// ── CSS ko module load hote hi inject karo (FOUC fix) ────────────────────────
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const _styleId = 'qm-web-styles';
  if (!document.getElementById(_styleId)) {
    const _el = document.createElement('style');
    _el.id = _styleId;
    _el.textContent = QM_CSS;
    document.head.appendChild(_el);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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
      { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', iconStyle: 'green', badge: '3', badgeColor: '#e11d48' },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { label: 'Ecome (buy / sell)', icon: 'leaf-outline', screen: 'Ecome', iconStyle: 'farmGreen' },
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
const UNIFORM_ICON = { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c' };

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
  'Notifications': '3 unread alerts waiting',
  'Ecome (buy / sell)': 'Buy, sell or rent e-commerce resources',
  'Logout': 'Sign out of your account',
};

const WEB_MODULES = [
  { label: 'Home', icon: 'home-outline', screen: 'Home', iconStyle: 'orange', isNavigation: true },
  { label: 'Profile', icon: 'person-circle-outline', screen: 'Profile', iconStyle: 'purple', component: ProfileScreen },
  { label: 'Post News', icon: 'add-circle-outline', screen: 'Add News', iconStyle: 'blue', component: AddNewsScreen },
  { label: 'News Feed', icon: 'newspaper-outline', screen: 'News Feed', iconStyle: 'teal', component: NewsFeedScreen },
  { label: 'My Network', icon: 'people-outline', screen: 'My Network', iconStyle: 'green', component: MyNetworkScreen },
  { label: 'Wallet', icon: 'wallet-outline', screen: 'Wallet', iconStyle: 'amber', component: WalletScreen },
  { label: 'Withdraw', icon: 'cash-outline', screen: 'Withdraw', iconStyle: 'orange', component: WithdrawScreen },
  { label: 'Subscription Plans', icon: 'diamond-outline', screen: 'Subscription Plans', iconStyle: 'pink', component: SubscriptionPlansScreen },
  { label: 'My Subscription', icon: 'layers-outline', screen: 'My Subscriptions', iconStyle: 'pink', component: MySubscriptionsScreen },
  { label: 'e-Paper', icon: 'document-text-outline', screen: 'e-Paper', iconStyle: 'indigo', component: EPaperScreen },
  { label: 'Live Streaming', icon: 'radio-outline', screen: 'Live Streaming', iconStyle: 'red', component: LiveStreamingScreen },
  { label: 'Certification', icon: 'ribbon-outline', screen: 'Certification', iconStyle: 'cyan', component: CertificationScreen },
  { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', iconStyle: 'green', component: NotificationsScreen },
  { label: 'Ecome (buy / sell)', icon: 'leaf-outline', screen: 'Ecome', iconStyle: 'farmGreen', component: EcomeScreen },
  { label: 'Logout', icon: 'log-out-outline', screen: '__logout__', iconStyle: 'rose', isDestructive: true },
];

// ─────────────────────────────────────────────
//  WEB LAYOUT
// ─────────────────────────────────────────────
function QuickMenuWeb({ navigation }) {
  const { logout } = useAuth();
  const [activeScreen, setActiveScreen] = React.useState('Profile');
  const [isMobileWeb, setIsMobileWeb] = React.useState(() => {
    return Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth <= 760;
  });
  const activeModule = WEB_MODULES.find((item) => item.screen === activeScreen) || WEB_MODULES[0];
  const ActiveComponent = activeModule.component || ProfileScreen;

  const embeddedNavigation = React.useMemo(() => {
    const openScreen = (screenName, ...args) => {
      const module = WEB_MODULES.find((item) => item.screen === screenName && item.component);
      if (module) {
        setActiveScreen(screenName);
        return;
      }
      navigation.navigate(screenName, ...args);
    };

    return {
      ...navigation,
      navigate: openScreen,
      replace: openScreen,
      goBack: () => setActiveScreen('Profile'),
      dispatch: (action) => {
        const nextRoute = action?.payload?.routes?.[action.payload.routes.length - 1]?.name;
        const module = WEB_MODULES.find((item) => item.screen === nextRoute && item.component);
        if (module) {
          setActiveScreen(nextRoute);
          return;
        }
        navigation.dispatch(action);
      },
    };
  }, [navigation]);

  const handlePress = async (item) => {
    if (item.screen === '__logout__') {
      await logout?.();
      navigation.navigate('Home');
      return;
    }
    if (item.isNavigation) {
      navigation.navigate(item.screen);
      return;
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
        <div className="qm-logo">News<span>Hub</span></div>
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
        <aside className="qm-sidebar">
          <div className="qm-back-btn" onClick={() => navigation.navigate('Home')}>
            <Ionicons name="chevron-back" size={16} color="inherit" />
            <span>Back</span>
          </div>
          <div className="qm-brand">News<span>Hub</span></div>
          {[{ title: 'Navigation', items: WEB_MODULES }].map((section) => (
            <div key={section.title}>
              <div className="qm-sec-title">{section.title}</div>
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className={`qm-nav-item qm-module-item${item.screen === activeScreen ? ' active' : ''}${item.isDestructive ? ' danger' : ''}`}
                  onClick={() => handlePress(item)}
                >
                  <div
                    className="qm-nav-icon"
                    style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={item.isDestructive ? '#e11d48' : item.screen === activeScreen ? '#9a3412' : UNIFORM_ICON.color}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
              <div className="qm-divider" />
            </div>
          ))}
        </aside>

        <main className="qm-main">
          <div className="qm-content-panel">
            <div className="qm-embedded-page">
              <ActiveComponent navigation={embeddedNavigation} />
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
              { label: 'Alerts', value: '3', sub: 'unread', subColor: '#e11d48' },
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
    navigation.navigate(item.screen);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#334155" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Quick Menu</Text>
          <Text style={styles.headerSubtitle}>Access all features quickly</Text>
        </View>
      </View>
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
                    <BlinkBadge style={[styles.iconWrap, { backgroundColor: style.bg, borderColor: style.border }]}>
                      <Ionicons name={item.icon} size={21} color={style.color} />
                    </BlinkBadge>
                  ) : (
                    <View style={[styles.iconWrap, { backgroundColor: style.bg, borderColor: style.border }]}>
                      <Ionicons name={item.icon} size={21} color={style.color} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
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
export default function QuickMenuScreen({ navigation }) {
  if (Platform.OS === 'web') return <QuickMenuWeb navigation={navigation} />;
  return <QuickMenuMobile navigation={navigation} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 6, // ✅ Border radius 6px
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  headerTitle: { 
    fontSize: 15, 
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  headerSubtitle: { 
    fontSize: 11, 
    color: '#94a3b8', 
    marginTop: 1,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  listContainer: { paddingHorizontal: 14, paddingTop: 4 },
  sectionLabel: { 
    fontSize: 10, 
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8', 
    letterSpacing: 1.1, 
    textTransform: 'uppercase', 
    paddingTop: 16, 
    paddingBottom: 6, 
    paddingHorizontal: 4,
    fontFamily: FONT_FAMILY,
  },
  listItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 9, 
    paddingHorizontal: 10, 
    borderRadius: 6, // ✅ Border radius 6px
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
    width: 40, 
    height: 40, 
    borderRadius: 6, // ✅ Border radius 6px
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1 
  },
  label: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '600', // ✅ Weight 600
    color: '#1e293b',
    fontFamily: FONT_FAMILY,
  },
  labelDestructive: { 
    color: '#e11d48' 
  },
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 20 
  },
  badgeText: { 
    fontSize: 10, 
    fontWeight: '600', // ✅ Weight 600
    fontFamily: FONT_FAMILY,
  },
});