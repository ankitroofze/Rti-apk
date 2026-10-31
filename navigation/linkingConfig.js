import * as Linking from 'expo-linking';
import { getStateFromPath as defaultGetStateFromPath, getPathFromState as defaultGetPathFromState } from '@react-navigation/native';
import { Platform } from 'react-native';

const getDomainPrefixes = () => {
  const list = [
    Linking.createURL('/'),
    'https://rtinews.in',
    'https://www.rtinews.in',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'http://localhost:3000',
  ];
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    if (!list.includes(window.location.origin)) {
      list.push(window.location.origin);
    }
  }
  return list;
};

const screensConfig = {
  Home: '',
  About: 'about',
  Contact: 'contact',
  WhatIsRTI: 'what-is-rti',
  ImportantLaws: 'important-laws',
  NewsDetails: {
    path: 'news/:id',
    parse: {
      id: (id) => `${id}`,
    },
  },
  Feed: {
    path: 'reel/:id?',
    parse: {
      id: (id) => `${id}`,
    },
  },
  Login: 'login',
  Register: 'register',
  StateSelect: 'register/state',
  DistrictSelect: 'register/district',
  TalukaSelect: 'register/taluka',
  VillageSelect: 'register/village',
  ForgotPassword: 'forgot-password',
  ResetPassword: 'reset-password',
  Otp: 'otp',
  Profile: 'profile',
  'My Network': 'my-network',
  Wallet: 'wallet',
  Withdraw: 'withdraw',
  'Subscription Plans': 'subscription-plans',
  SubscriptionPlanDetails: {
    path: 'subscription-plans/:planId?',
    parse: {
      planId: (planId) => `${planId}`,
    },
  },
  'News Feed': 'news-feed',
  'Add News': 'add-news',
  'e-Paper': 'epaper',
  'Live Streaming': 'live-streaming',
  'Start Live': 'start-live',
  Certification: 'certification',
  MyAttempts: 'my-attempts',
  'My Subscriptions': 'my-subscriptions',
  Notifications: 'notifications',
  Settings: 'settings',
  PaymentHistory: 'payment-history',
  BlockedUsersScreen: 'blocked-users',
  'My Ads Subscription': 'my-ads-subscription',
  'My Ecom Subscription': 'my-ecom-subscription',
  'My Quiz Subscription': 'my-quiz-subscription',
  ViewMember: {
    path: 'member/:id?',
    parse: {
      id: (id) => `${id}`,
    },
  },
  EditMember: 'edit-member',
  UserProfile: {
    path: 'u/:userId',
    parse: {
      userId: (userId) => `${userId}`,
    },
  },
  UserPublicProfile: {
    path: 'user/:userId?',
    parse: {
      userId: (userId) => `${userId}`,
    },
  },
  VerifyMember: 'verify',
  Payment: 'payment',
  AttemptQuiz: 'quiz/attempt',
  QuizResult: 'quiz/result',
  CertificatePreview: 'certificate/preview',
  QuickMenu: {
    path: 'menu/:screen?',
    parse: {
      screen: (screen) => `${screen}`,
    },
  },
  Refer: 'refer',
  ChangeLocation: 'change-location',
  Advertise: 'advertise',
  ChoosePlan: 'choose-plan',
  PurchaseBlueTick: 'blue-tick',
  CommerceAdsCenter: 'commerce-ads',
  Ecome: 'shop',
  Sell: 'sell',
  FarmingBuy: 'farming',
  AdPlans: 'ad-plans',
  MyAds: 'my-ads',
  SellerEnquiryDashboard: 'seller/enquiries',
  MyEnquiries: 'my-enquiries',
  MyListings: 'my-listings',
  SellerReports: 'seller/reports',
  NewspaperPage: 'newspaper',
  NewspaperList: 'newspapers',
  Preview: 'preview',
  QuizSubscription: 'quiz-subscription',
  EcomSubscription: 'ecom-subscription',
  LegalPolicy: 'legal-policy',
  InfoPage: {
    path: 'info/:pageKey?',
    parse: {
      pageKey: (pageKey) => `${pageKey}`,
    },
  },
  AdLeadResponse: {
    path: 'ad-lead-response/:submissionId?',
    parse: {
      submissionId: (id) => `${id}`,
    },
  },
  IdCardVerify: {
    path: 'id-card/verify/:token?',
    parse: {
      token: (token) => `${token}`,
    },
  },
  QrScanner: 'qr-scanner',
  ChatList: 'chats',
  ChatConversation: {
    path: 'chat/:chatId?',
    parse: {
      chatId: (chatId) => `${chatId}`,
    },
  },
  GroupInfo: 'group-info',
};

const routeTitleMap = {
  Home: 'RTI News - Empowering Citizens Through Journalism',
  About: 'About Us | RTI News',
  Contact: 'Contact Us | RTI News',
  WhatIsRTI: 'What is RTI | RTI News',
  ImportantLaws: 'Important Laws | RTI News',
  NewsDetails: 'News | RTI News',
  Feed: 'Reels & Feeds | RTI News',
  Login: 'Sign In | RTI News',
  Register: 'Register | RTI News',
  Profile: 'My Profile | RTI News',
  UserPublicProfile: 'User Profile | RTI News',
  UserProfile: 'User Profile | RTI News',
  Wallet: 'My Wallet | RTI News',
  Withdraw: 'Withdraw Funds | RTI News',
  'Subscription Plans': 'Subscription Plans | RTI News',
  'News Feed': 'News Feed | RTI News',
  'Add News': 'Submit News | RTI News',
  'e-Paper': 'e-Paper | RTI News',
  'Live Streaming': 'Live Streaming | RTI News',
  'Start Live': 'Go Live | RTI News',
  Certification: 'Press Certification | RTI News',
  Ecome: 'Shop & Classifieds | RTI News',
  Sell: 'Create Listing | RTI News',
  Advertise: 'Advertise With Us | RTI News',
  NewspaperList: 'Newspapers | RTI News',
  LegalPolicy: 'Legal Policy & Terms | RTI News',
  InfoPage: 'Information | RTI News',
  Settings: 'Settings | RTI News',
  MyEnquiries: 'Ecom Enquiries | RTI News',
  MyListings: 'My Listings | RTI News',
  'My Network': 'My Network | RTI News',
  'My Subscriptions': 'My Subscriptions | RTI News',
  Notifications: 'Notifications | RTI News',
  QuickMenu: 'Quick Menu & Dashboard | RTI News',
  ChatList: 'Messages | RTI News',
  ChatConversation: 'Chat | RTI News',
  PaymentHistory: 'Payment History | RTI News',
  AdPlans: 'Advertising Plans | RTI News',
};

export const linkingConfig = {
  prefixes: getDomainPrefixes(),
  config: {
    screens: screensConfig,
  },
  getStateFromPath: (path, options) => {
    try {
      let normalized = String(path || '').trim();
      if (!normalized.startsWith('/')) normalized = `/${normalized}`;

      // Extract path & query string
      const [pathname, queryString] = normalized.split('?');
      const search = queryString ? `?${queryString}` : '';

      let mappedPath = pathname;

      // Top-level aliases & legacy routes
      if (mappedPath === '/dashboard') mappedPath = '/menu';
      else if (mappedPath === '/about-us') mappedPath = '/about';
      else if (mappedPath === '/contact-us') mappedPath = '/contact';
      else if (mappedPath === '/feed' || mappedPath === '/feeds' || mappedPath === '/reels') mappedPath = '/reel';
      else if (mappedPath.startsWith('/feed/')) mappedPath = `/reel/${mappedPath.slice(6)}`;
      else if (mappedPath.startsWith('/news-details/')) mappedPath = `/news/${mappedPath.slice(14)}`;
      else if (mappedPath === '/UserPublicProfile') mappedPath = '/user';
      else if (mappedPath === '/privacy' || mappedPath === '/privacy-policy') mappedPath = '/info/privacy';
      else if (mappedPath === '/terms' || mappedPath === '/terms-and-conditions') mappedPath = '/info/terms';
      else if (mappedPath === '/e-paper') mappedPath = '/epaper';
      else if (mappedPath === '/ecommerce' || mappedPath === '/store' || mappedPath === '/ecome') mappedPath = '/shop';
      else if (mappedPath === '/post-news') mappedPath = '/add-news';
      else if (mappedPath === '/network') mappedPath = '/my-network';
      else if (mappedPath === '/plans') mappedPath = '/subscription-plans';
      else if (mappedPath === '/my-subscription') mappedPath = '/my-subscriptions';
      else if (mappedPath === '/live') mappedPath = '/live-streaming';
      else if (mappedPath === '/broadcast') mappedPath = '/start-live';
      else if (mappedPath === '/certificate') mappedPath = '/certification';
      else if (mappedPath === '/alerts') mappedPath = '/notifications';
      else if (mappedPath === '/ecom-enquiries' || mappedPath === '/enquiries') mappedPath = '/my-enquiries';
      else if (mappedPath === '/listings') mappedPath = '/my-listings';
      else if (mappedPath === '/seller-enquiries') mappedPath = '/seller/enquiries';
      else if (mappedPath === '/seller-reports') mappedPath = '/seller/reports';
      else if (mappedPath === '/purchase-blue-tick') mappedPath = '/blue-tick';
      else if (mappedPath === '/farming-buy') mappedPath = '/farming';
      else if (mappedPath === '/quiz' || mappedPath === '/attempt-quiz') mappedPath = '/quiz/attempt';
      else if (mappedPath === '/certificate-preview') mappedPath = '/certificate/preview';
      else if (mappedPath.startsWith('/id-card-verify/')) mappedPath = `/id-card/verify/${mappedPath.slice(16)}`;

      const finalPath = `${mappedPath}${search}`;
      const state = defaultGetStateFromPath(finalPath, options);
      if (state) return state;

      return {
        routes: [{ name: 'Home' }],
      };
    } catch (_err) {
      return {
        routes: [{ name: 'Home' }],
      };
    }
  },
  getPathFromState: (state, options) => {
    try {
      return defaultGetPathFromState(state, options);
    } catch (_err) {
      return '/';
    }
  },
  documentTitle: {
    formatter: (options, route) => {
      const screenName = route?.name;
      if (screenName && routeTitleMap[screenName]) {
        return routeTitleMap[screenName];
      }
      const title = options?.title || screenName;
      return title ? `${title} | RTI News` : 'RTI News';
    },
  },
};
