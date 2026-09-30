// pages/MyAdSubscriptionScreen.js
// Dikhata hai ki user ka Ads subscription active hai ya nahi.
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Platform, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import SubscriptionStatusCard from '../components/SubscriptionStatusCard';
import { getCardTheme, getNativeThemeImage, HEADER_BG_IMAGE } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';

const SAFE_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 50;
const FONT = {
  regular: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  medium:  Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
};

export default function MyAdSubscriptionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);
  const [credits, setCredits] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
       const user = await UserStore.getCurrentUserSynced();
    const isActive = user ? UserStore.hasActiveAdSubscription(user) : false; // ✅ dual check: credits + date
    if (!isActive) {
      setLoading(false);
      navigation.replace('AdPlans');
      return;
    }
    setSub(user.ad_subscription);
    setCredits(Number(user?.ad_credits || 0));
    setLoading(false);
  }, [navigation]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */}
      <ModuleWebHeader title="My Ads Subscription" navigation={navigation} />

      {/* Native header — same red image header jo Subscription Plans screen me hai */}
      {Platform.OS !== 'web' && (
        <ImageBackground source={HEADER_BG_IMAGE} style={styles.headerImageWrap} imageStyle={styles.headerImageInner} resizeMode="cover">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Feather name="arrow-left" size={20} color="#ffffff" />
            <Text style={styles.headerBackBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Ads Subscription</Text>
          <View style={{ width: 60 }} />
        </ImageBackground>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPlain}>
          <Text style={styles.heroTitlePlain}>My Ads Subscription</Text>
          <Text style={styles.heroSubtitlePlain}>Status of your Ads promotion plan</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#dc2626" style={{ marginTop: 30 }} />
        ) : (
          <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <SubscriptionStatusCard
              isActive={Boolean(sub)}
              planName={sub?.plan_name}
              price={sub?.price}
              countLabel={sub ? `${credits} ad credit${credits === 1 ? '' : 's'} remaining` : null}
              purchasedAt={sub?.purchased_at}
              expiresAt={sub?.expires_at}
              buyButtonLabel="Subscribe to Ads Plan"
              onBuyPress={() => navigation.navigate('AdPlans')}
              themeImage={getNativeThemeImage(getCardTheme(2))}
              textColor="#ffffff"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f9fb' },

  headerImageWrap: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#b91c1c',
    height: SAFE_TOP + 56,
    paddingTop: SAFE_TOP,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerImageInner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover' },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  headerBackBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: FONT.medium },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', fontFamily: FONT.medium },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  heroPlain: { marginTop: 14, marginBottom: 18, width: '100%', maxWidth: 560, alignSelf: 'center' },
  heroTitlePlain: { fontSize: 24, fontFamily: FONT.medium, fontWeight: '600', color: '#dc2626', marginBottom: 6 },
  heroSubtitlePlain: { fontSize: 14, fontFamily: FONT.regular, color: '#374151', lineHeight: 20 },
});