// pages/MySubscriptionsScreen.js
// "Jo subscription liya hai" (top) + "baki purchase karne wale plans" (niche) — ek jagah.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';
const PURCHASE_LINKS = [
  { label: 'Role / Membership Plans', screen: 'Subscription Plans', icon: 'award' },
  { label: 'Quiz Subscription Plans', screen: 'My Quiz Subscription', icon: 'check-square' },
  { label: 'Ads Subscription Plans',  screen: 'AdPlans', icon: 'trending-up' },
  { label: 'Ecom Subscription Plans', screen: 'My Ecom Subscription', icon: 'shopping-bag' },
];

export default function MySubscriptionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await UserStore.getMySubscriptions();
    setLoading(false);
    if (!res.ok && res.isAuth) { navigation.replace('Login'); return; }
    setItems(res.items || []);
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const activeItems = items.filter((i) => i.status === 'active');

  // // ✅ NEW: koi bhi subscription active nahi hai to seedha Subscription Plans pe bhej do.
  // React.useEffect(() => {
  //   if (!loading && items.length > 0 && activeItems.length === 0) {
  //     navigation.replace('Subscription Plans');
  //   }
  // }, [loading, items, activeItems.length, navigation]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      {Platform.OS === 'web' ? (
        /* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */
        <ModuleWebHeader title="My Subscription" navigation={navigation} onBack={() => navigation.goBack()} />
      ) : (
        <ModuleMobileHeader title="My Subscription" navigation={navigation} onBack={() => navigation.goBack()} />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Subscriptions</Text>

        {loading ? (
          <ActivityIndicator color="#F97316" style={{ marginTop: 30 }} />
        ) : activeItems.length ? (
          activeItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.badge}>
                <Feather name="check-circle" size={13} color="#16a34a" />
                <Text style={styles.badgeText}>Active</Text>
              </View>
              <Text style={styles.planName}>{item.planName}</Text>
              {item.price !== null ? <Text style={styles.price}>₹{item.price}</Text> : null}
              <View style={styles.metaRow}>
                {item.purchasedAt ? (
                  <View><Text style={styles.metaLabel}>Purchased</Text><Text style={styles.metaValue}>{item.purchasedAt}</Text></View>
                ) : null}
                {item.expiresAt ? (
                  <View><Text style={styles.metaLabel}>Expires</Text><Text style={styles.metaValue}>{item.expiresAt}</Text></View>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          null
        )}

        <View style={{ height: 16 }} />
        {PURCHASE_LINKS.map((link) => (
          <TouchableOpacity
            key={link.screen}
            style={styles.purchaseRow}
            onPress={() => navigation.navigate(link.screen)}
            activeOpacity={0.75}
          >
            <Feather name={link.icon} size={16} color="#F97316" />
            <Text style={styles.purchaseRowText}>{link.label}</Text>
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
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
  subtitle: { width: '100%', maxWidth: 560, fontSize: 13, color: '#6B7280' },
  card: { width: '100%', maxWidth: 560, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  planName: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 2 },
  price: { fontSize: 14, color: '#555', marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 24, marginTop: 4 },
  metaLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: '#111', fontWeight: '600', marginTop: 2 },
  emptyText: { width: '100%', maxWidth: 560, fontSize: 13, color: '#9CA3AF', paddingVertical: 10 },
  purchaseRow: { width: '100%', maxWidth: 560, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10 },
  purchaseRowText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#111' },
});