// pages/MyEcomSubscriptionScreen.js
// Dikhata hai ki user ka E-Commerce (Sell page) subscription active hai ya nahi.
import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useState, useCallback } from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import SubscriptionStatusCard from '../components/SubscriptionStatusCard';
import { getCardTheme, getNativeThemeImage } from '../constants/subscriptionThemes';

export default function MyEcomSubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);
  const [credits, setCredits] = useState(0);
const load = useCallback(async () => {
    setLoading(true);
     const user = await UserStore.getCurrentUserSynced();
    const isActive = user ? UserStore.hasActiveEcomSubscription(user) : false;
    if (!isActive) {
      setLoading(false);
      navigation.replace('EcomSubscription', { redirectTo: 'My Ecom Subscription' });
      return;
    }
    setSub(user.ecome_subscription);
    setCredits(Number(user?.ecome_credits || 0));
    setLoading(false);
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      {Platform.OS !== 'web' ? (
<ModuleAndroidHeader title="My Ecom Subscription" onBack={() => navigation.goBack()} />
) : (
<>
<View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.75}>
        <Feather name="arrow-left" size={20} color="#F97316" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
</>
)}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My E-Commerce Subscription</Text>
        <Text style={styles.subtitle}>Status of your Sell page (marketplace) plan</Text>

        {loading ? (
          <ActivityIndicator color="#F97316" style={{ marginTop: 30 }} />
        ) : (
          <SubscriptionStatusCard
            isActive={Boolean(sub)}
            planName={sub?.plan_name}
            price={sub?.price}
            countLabel={sub ? `${credits} listing credit${credits === 1 ? '' : 's'} remaining` : null}
            purchasedAt={sub?.purchased_at}
            expiresAt={sub?.expires_at}
                      buyButtonLabel="Subscribe to E-Commerce Plan"
            onBuyPress={() => navigation.navigate('EcomSubscription', { redirectTo: 'My Ecom Subscription' })}
            themeImage={getNativeThemeImage(getCardTheme(3))}
            textColor="#ffffff"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backText: { color: '#F97316', fontSize: 14, fontWeight: '500' },
  scrollContent: { padding: 20, alignItems: 'center' },
  title: { width: '100%', maxWidth: 560, fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 2 },
  subtitle: { width: '100%', maxWidth: 560, fontSize: 13, color: '#6B7280', marginBottom: 18 },
});