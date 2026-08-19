import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from '../screens/HomeScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import WhatIsRTIScreen from '../screens/WhatIsRTIScreen';
import ImportantLawsScreen from '../screens/ImportantLawsScreen';
import NewsDetailsScreen from '../screens/NewsDetailsScreen';
import FeedScreen from '../screens/FeedScreen';
import LoginScreen from '../auth/LoginScreen';
import RegisterScreen from '../auth/RegisterScreen';
import StateSelectScreen from '../auth/StateSelectScreen';
import DistrictSelectScreen from '../auth/DistrictSelectScreen';
import TalukaSelectScreen from '../auth/TalukaSelectScreen';
import ForgotPasswordScreen from '../auth/ForgotPasswordScreen';
import OtpScreen from '../auth/OtpScreen';
import ResetPasswordScreen from '../auth/ResetPasswordScreen';
// import DashboardScreen from '../pages/DashboardScreen';
import ProfileScreen from '../pages/ProfileScreen';
import MyNetworkScreen from '../pages/MyNetworkScreen';
import WalletScreen from '../pages/WalletScreen';
import WithdrawScreen from '../pages/WithdrawScreen';
import SubscriptionPlansScreen from '../pages/SubscriptionPlansScreen';
import NewsFeedScreen from '../pages/NewsFeedScreen';
import AddNewsScreen from '../pages/Addnewsscreen';
import EPaperScreen from '../pages/EPaperScreen';
import LiveStreamingScreen from '../pages/LiveStreamingScreen';
import LiveBroadcastScreen from '../pages/LiveBroadcastScreen';
import CertificationScreen from '../pages/CertificationScreen';
import MyAttemptsScreen from '../pages/MyAttemptsScreen';
import NotificationsScreen from '../pages/NotificationsScreen';
import SettingsScreen from '../pages/SettingsScreen';
import MyAdSubscriptionScreen from '../pages/MyAdSubscriptionScreen';
import MyEcomSubscriptionScreen from '../pages/MyEcomSubscriptionScreen';
import MyQuizSubscriptionScreen from '../pages/MyQuizSubscriptionScreen';
import MySubscriptionsScreen from '../pages/MySubscriptionsScreen';
import ViewMemberScreen from '../pages/ViewMemberScreen';
import EditMemberScreen from '../pages/EditMemberScreen';
import PaymentScreen from '../pages/PaymentScreen';
import AttemptQuizScreen from '../pages/AttemptQuizScreen';
import QuizResultScreen from '../pages/QuizResultScreen';
import CertificatePreviewScreen from '../pages/CertificatePreviewScreen';
import UserPublicProfileScreen from '../pages/UserPublicProfileScreen';
import QuickMenuScreen from '../screens/QuickMenuScreen';
import ReferScreen from '../screens/ReferScreen';
import ChangeLocationScreen from '../screens/ChangeLocationScreen';
import AdvertiseScreen from '../screens/AdvertiseScreen';
import ChoosePlanScreen from '../screens/ChoosePlanScreen';
import PurchaseBlueTickScreen from '../screens/PurchaseBlueTickScreen';
import CommerceAdsCenterScreen from '../pages/CommerceAdsCenterScreen';
import EcomeScreen from '../screens/EcomeScreen';
import SellScreen from '../screens/SellScreen';
import FarmingBuyScreen from '../screens/FarmingBuyScreen';
import AdPlansScreen from '../pages/AdPlansScreen';
import MyAdsScreen   from '../pages/MyAdsScreen';
import SellerEnquiryDashboardScreen from '../pages/SellerEnquiryDashboardScreen';
import MyEnquiriesScreen from '../pages/MyEnquiriesScreen';
import MyListingsScreen from '../pages/MyListingsScreen';
import SellerReportsScreen from '../pages/SellerReportsScreen';
import NewspaperPage from '../pages/NewspaperPage';
import NewspaperList from '../screens/NewspaperList';
import PreviewScreen from '../pages/PreviewScreen';
import QuizSubscriptionScreen from '../screens/QuizSubscriptionScreen';
import EcomSubscriptionScreen from '../screens/EcomSubscriptionScreen';
const Stack = createNativeStackNavigator();
const NAVIGATION_STATE_KEY = 'rti-news-navigation-state';

async function readPersistedNavigationState() {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(NAVIGATION_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    }

    const raw = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function persistNavigationState(state) {
  try {
    const serialized = JSON.stringify(state);

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(NAVIGATION_STATE_KEY, serialized);
      return;
    }

    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, serialized);
  } catch {
    // Ignore persistence failures so navigation keeps working.
  }
}

export default function AppNavigator() {
  const [initialState, setInitialState] = useState();
  const [isNavStateReady, setIsNavStateReady] = useState(false);

  const stackScreens = [
    { name: 'Home', component: HomeScreen },
    { name: 'About', component: AboutScreen },
    { name: 'Contact', component: ContactScreen },
    { name: 'WhatIsRTI', component: WhatIsRTIScreen },
    { name: 'ImportantLaws', component: ImportantLawsScreen },
    { name: 'NewsDetails', component: NewsDetailsScreen },
    { name: 'Feed', component: FeedScreen },
    { name: 'Login', component: LoginScreen },
    { name: 'Register', component: RegisterScreen },
    { name: 'StateSelect', component: StateSelectScreen },
    { name: 'DistrictSelect', component: DistrictSelectScreen },
    { name: 'TalukaSelect', component: TalukaSelectScreen },
    { name: 'ForgotPassword', component: ForgotPasswordScreen },
    { name: 'Otp', component: OtpScreen },
    { name: 'ResetPassword', component: ResetPasswordScreen },
    // { name: 'Dashboard', component: DashboardScreen },
    { name: 'Profile', component: ProfileScreen },
    { name: 'My Network', component: MyNetworkScreen },
    { name: 'Wallet', component: WalletScreen },
    { name: 'Withdraw', component: WithdrawScreen },
    { name: 'Subscription Plans', component: SubscriptionPlansScreen },
    { name: 'News Feed', component: NewsFeedScreen },
    { name: 'Add News', component: AddNewsScreen },
    { name: 'e-Paper', component: EPaperScreen },
    { name: 'Live Streaming', component: LiveStreamingScreen },
    { name: 'Start Live', component: LiveBroadcastScreen },
    { name: 'Certification', component: CertificationScreen },
   { name: 'MyAttempts', component: MyAttemptsScreen },
    { name: 'My Subscriptions', component: MySubscriptionsScreen },
    { name: 'Notifications', component: NotificationsScreen },
    { name: 'Settings', component: SettingsScreen },
    { name: 'My Ads Subscription', component: MyAdSubscriptionScreen },
    { name: 'My Ecom Subscription', component: MyEcomSubscriptionScreen },
    { name: 'My Quiz Subscription', component: MyQuizSubscriptionScreen },
    { name: 'ViewMember', component: ViewMemberScreen },
    { name: 'EditMember', component: EditMemberScreen },
    { name: 'UserProfile', component: UserPublicProfileScreen },
    { name: 'UserPublicProfile', component: UserPublicProfileScreen },
    { name: 'Payment', component: PaymentScreen },
    { name: 'AttemptQuiz', component: AttemptQuizScreen },
    { name: 'QuizResult', component: QuizResultScreen },
    { name: 'CertificatePreview', component: CertificatePreviewScreen },
    { name: 'QuickMenu', component: QuickMenuScreen },
    { name: 'Refer', component: ReferScreen },
    { name: 'ChangeLocation', component: ChangeLocationScreen },
    { name: 'Advertise', component: AdvertiseScreen },
    { name: 'ChoosePlan', component: ChoosePlanScreen },
    { name: 'PurchaseBlueTick', component: PurchaseBlueTickScreen },
    { name: 'CommerceAdsCenter', component: CommerceAdsCenterScreen },
    { name: 'Ecome', component: EcomeScreen },
    { name: 'Sell', component: SellScreen },
    { name: 'FarmingBuy', component: FarmingBuyScreen },
    { name: 'AdPlans', component: AdPlansScreen },
    { name: 'MyAds', component: MyAdsScreen },
    { name: 'SellerEnquiryDashboard', component: SellerEnquiryDashboardScreen },
    { name: 'MyEnquiries', component: MyEnquiriesScreen },
    { name: 'MyListings', component: MyListingsScreen },
    { name: 'SellerReports', component: SellerReportsScreen },
    { name: 'NewspaperPage', component: NewspaperPage },
    { name: 'NewspaperList', component: NewspaperList },
    { name: 'Preview', component: PreviewScreen },
    { name: 'QuizSubscription', component: QuizSubscriptionScreen },
    { name: 'EcomSubscription', component: EcomSubscriptionScreen },
  ];

  useEffect(() => {
    let alive = true;

    (async () => {
      const savedState = await readPersistedNavigationState();
      if (!alive) return;
      if (savedState) {
        setInitialState(savedState);
      }
      setIsNavStateReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!isNavStateReady) {
    return null;
  }

  return (
    <NavigationContainer initialState={initialState} onStateChange={persistNavigationState}>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        {stackScreens.map(({ name, component }) => (
          <Stack.Screen key={name} name={name} component={component} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
