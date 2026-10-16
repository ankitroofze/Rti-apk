import React, { useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '../utils/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaymentHistoryScreen from '../pages/Paymenthistoryscreen';
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
import VillageSelectScreen from '../auth/VillageSelectScreen';
import ForgotPasswordScreen from '../auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../auth/ResetPasswordScreen';
// import DashboardScreen from '../pages/DashboardScreen';
import ProfileScreen from '../pages/ProfileScreen';
import MyNetworkScreen from '../pages/MyNetworkScreen';
import WalletScreen from '../pages/WalletScreen';
import WithdrawScreen from '../pages/WithdrawScreen';
import SubscriptionPlansScreen from '../pages/SubscriptionPlansScreen';
import SubscriptionPlanDetailsScreen from '../pages/SubscriptionPlanDetailsScreen';
import NewsFeedScreen from '../pages/NewsFeedScreen';
import AddNewsScreen from '../pages/Addnewsscreen';
import EPaperScreen from '../pages/EPaperScreen';
import LiveStreamingScreen from '../pages/LiveStreamingScreen';
import LiveBroadcastScreen from '../pages/LiveBroadcastScreen';
import CertificationScreen from '../pages/CertificationScreen';
import MyAttemptsScreen from '../pages/MyAttemptsScreen';
import NotificationsScreen from '../pages/NotificationsScreen';
import SettingsScreen from '../pages/SettingsScreen';
import BlockedUsersScreen from '../pages/BlockedUsersScreen';
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
import VerifyMemberScreen from '../pages/VerifyMemberScreen';
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
import LegalPolicyScreen from '../pages/LegalPolicyScreen';

const Stack = createNativeStackNavigator();
const NAVIGATION_STATE_KEY = 'rti-news-navigation-state';

export default function AppNavigator() {
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
    { name: 'VillageSelect', component: VillageSelectScreen },
    { name: 'ForgotPassword', component: ForgotPasswordScreen },
    { name: 'ResetPassword', component: ResetPasswordScreen },
    // { name: 'Dashboard', component: DashboardScreen },
    { name: 'Profile', component: ProfileScreen },
    { name: 'My Network', component: MyNetworkScreen },
    { name: 'Wallet', component: WalletScreen },
    { name: 'Withdraw', component: WithdrawScreen },
    { name: 'Subscription Plans', component: SubscriptionPlansScreen },
    { name: 'SubscriptionPlanDetails', component: SubscriptionPlanDetailsScreen },
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
    { name: 'PaymentHistory', component: PaymentHistoryScreen },
    { name: 'BlockedUsersScreen', component: BlockedUsersScreen },
    { name: 'My Ads Subscription', component: MyAdSubscriptionScreen },
    { name: 'My Ecom Subscription', component: MyEcomSubscriptionScreen },
    { name: 'My Quiz Subscription', component: MyQuizSubscriptionScreen },
    { name: 'ViewMember', component: ViewMemberScreen },
    { name: 'EditMember', component: EditMemberScreen },
    { name: 'UserProfile', component: UserPublicProfileScreen },
    { name: 'UserPublicProfile', component: UserPublicProfileScreen },
    { name: 'VerifyMember', component: VerifyMemberScreen },
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
    { name: 'LegalPolicy', component: LegalPolicyScreen },
  ];

  useEffect(() => {
    // Navigation state ab kahin save nahi hoti (route params me email/otp jaisa data
    // hota tha). Jin browsers me purani state pehle se save hai unse ek baar hata do.
    // Kuch hafton baad ye cleanup hataya ja sakta hai.
    try {
      if (Platform.OS === 'web') window.localStorage.removeItem(NAVIGATION_STATE_KEY);
    } catch {}
    setIsNavStateReady(true);
  }, []);

  // Android hardware back now always returns to the previous screen when the
  // stack has one. At the root we return false so Android handles its normal
  // app-exit behavior.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, []);

  if (!isNavStateReady) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        {stackScreens.map(({ name, component }) => (
          <Stack.Screen key={name} name={name} component={component} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}