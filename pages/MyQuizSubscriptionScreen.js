// pages/MyQuizSubscriptionScreen.js
// Dikhata hai ki user ka Quiz/Certification subscription active hai ya nahi.
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import SubscriptionStatusCard from '../components/SubscriptionStatusCard';

export default function MyQuizSubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);
  const [remaining, setRemaining] = useState(null);

 const load = useCallback(async () => {
    setLoading(true);
    const user = await UserStore.getCurrentUser();
    const isActive = user ? UserStore.hasActiveQuizSubscription(user) : false;
    // ✅ NEW: koi active subscription nahi hai to seedha purchase list pe bhej do.
    if (!isActive) {
      setLoading(false);
      navigation.replace('QuizSubscription');
      return;
    }
    setSub(user.quiz_subscription_plan);
    setRemaining(UserStore.getQuizSubscriptionRemainingCount(user));
    setLoading(false);
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.75}>
        <Feather name="arrow-left" size={20} color="#F97316" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Quiz Subscription</Text>
        <Text style={styles.subtitle}>Status of your Certification quiz plan</Text>

        {loading ? (
          <ActivityIndicator color="#F97316" style={{ marginTop: 30 }} />
        ) : (
          <SubscriptionStatusCard
            isActive={Boolean(sub)}
            planName={sub?.plan_name}
            price={sub?.price}
            countLabel={
              sub
                ? (remaining === null
                  ? 'Unlimited attempts till expiry'
                  : `${remaining} quiz attempt${remaining === 1 ? '' : 's'} remaining`)
                : null
            }
            purchasedAt={sub?.purchased_at}
            expiresAt={sub?.expires_at}
            buyButtonLabel="Subscribe to Quiz Plan"
            onBuyPress={() => navigation.navigate('QuizSubscription')}
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
