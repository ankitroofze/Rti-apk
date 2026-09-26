// constants/subscriptionThemes.js
// ─────────────────────────────────────────────────────────
// SHARED across ALL subscription/plan purchase screens
// (Role/Membership, Quiz, Ads, Ecom) so that every plan card,
// every header, and every "Pay" button uses the exact same
// 5 background themes/colors — this is what keeps the four
// subscription pages visually consistent with each other.
//
// Index 0,5,10.. = purple | 1,6,11.. = red | 2,7,12.. = orange
// Index 3,8,13.. = blue   | 4,9,14.. = green
// ─────────────────────────────────────────────────────────


import { Platform } from 'react-native';

export const SUBSCRIPTION_CARD_THEMES = [
  { key: 'purple', image: require('../assets/images/profile-purple.png'), textColor: '#ffffff', mutedColor: 'rgba(255,255,255,0.85)', checkColor: '#ffffff' },
  { key: 'red',    image: require('../assets/images/profile-red.png'),    textColor: '#ffffff', mutedColor: 'rgba(255,255,255,0.85)', checkColor: '#ffffff' },
  { key: 'orange', image: require('../assets/images/profile-orange.png'), textColor: '#ffffff', mutedColor: 'rgba(255,255,255,0.85)', checkColor: '#ffffff' },
  { key: 'blue',   image: require('../assets/images/profile-blue.png'),   textColor: '#ffffff', mutedColor: 'rgba(255,255,255,0.85)', checkColor: '#ffffff' },
  { key: 'green',  image: require('../assets/images/profile-green.png'),  textColor: '#ffffff', mutedColor: 'rgba(255,255,255,0.85)', checkColor: '#ffffff' },
];

// ✅ Har module screen (Wallet, Withdraw, My Network, Live Streaming,
// Certification, Notifications, News Feed, Subscription Plans) ka top red
// header web par isi height ka hoga. Height badalni ho to SIRF yahan badlo —
// sab jagah automatically apply ho jayegi.
export const MODULE_HEADER_HEIGHT_WEB = 60;

// ✅ SHARED page background — jab bhi kisi module ka background badalna ho,
// sirf yehi ek line change karo, poore app me apply karne ke liye har
// module ki style file me isko import karke use karo (jaise Notifications
// page me kiya gaya hai neeche).
export const MODULE_PAGE_BG = '#EEF1F5';

export const getCardTheme = (index = 0) =>
  SUBSCRIPTION_CARD_THEMES[((index % SUBSCRIPTION_CARD_THEMES.length) + SUBSCRIPTION_CARD_THEMES.length) % SUBSCRIPTION_CARD_THEMES.length];
// Header bar — red wala hi use hota hai har subscription screen par
// ✅ Android/iOS par bada (high-res) image — poora header cover karega.
// Web bilkul pehle jaisa hi rahega, koi change nahi.
export const HEADER_BG_IMAGE = SUBSCRIPTION_CARD_THEMES[1].image;

// ✅ "Active" status card ke liye bhi bada image — sirf native (Android/iOS) par.
// Jin colors (blue/green) ka bada image available nahi hai, unke liye purana wala hi chalega.
export const getNativeThemeImage = (theme) => theme?.image;