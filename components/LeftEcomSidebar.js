import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SOCIAL_ITEMS = [
  { icon: 'logo-facebook', color: '#1877F2', url: 'https://www.facebook.com/' },
  { icon: 'logo-twitter', color: '#1DA1F2', url: 'https://twitter.com/' },
  { icon: 'logo-youtube', color: '#FF0000', url: 'https://www.youtube.com/' },
  { icon: 'logo-instagram', color: '#E1306C', url: 'https://www.instagram.com/' },
  { icon: 'paper-plane', color: '#229ED9', url: 'https://t.me/' },
];

// Sirf tab tak jab tak real Ecome listings na aayein, ye demo cards dikhenge
const DEMO_PRODUCTS = [
  { id: 'demo-1', title: 'iPhone 15 (128GB)', subtitle: 'Latest Apple iPhone', price: '69,999', image: 'https://picsum.photos/seed/iphone15/160/160' },
  { id: 'demo-2', title: 'boAt Rockerz 550', subtitle: 'Wireless Headphone', price: '1,799', image: 'https://picsum.photos/seed/boat550/160/160' },
  { id: 'demo-3', title: 'Noise ColorFit Pro 5', subtitle: 'Smart Watch', price: '1,999', image: 'https://picsum.photos/seed/noisecf5/160/160' },
];

function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={16} color="#e11d48" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function LeftEcomSidebar({ navigation, stories = [], onOpenDetails, commonCopy }) {
  const trendingTopics = useMemo(() => {
    return [...stories]
      .sort((a, b) => (Number(b?.views) || 0) - (Number(a?.views) || 0))
      .slice(0, 5)
      .map((s) => s.title)
      .filter(Boolean);
  }, [stories]);

  const products = useMemo(() => {
    const real = stories.filter((s) => s.isEcome).slice(0, 3);
    return real.length ? real.map((p) => ({
      id: p.id, title: p.title, subtitle: p.description || 'Ecome listing',
      price: p.price || '', image: p.image,
    })) : DEMO_PRODUCTS;
  }, [stories]);

  const openScreen = (screenName) => navigation?.navigate?.(screenName);

  return (
    <View style={styles.sidebarShell}>
      {/* ── Trending Topics ── */}
      <SectionCard title="Trending Topics" icon="flame">
        {(trendingTopics.length ? trendingTopics : [
          'Lok Sabha Election 2024', 'NEET UG Result 2024', 'Monsoon Update India',
          'Indian Economy Growth', 'India vs Bangladesh T20',
        ]).map((topic, i) => (
          <TouchableOpacity key={i} style={styles.trendRow} activeOpacity={0.75} onPress={() => onOpenDetails?.({ title: topic })}>
            <Ionicons name="trending-up" size={18} color="#ad1010" />
            <Text style={styles.trendText} numberOfLines={1}>{topic}</Text>
          </TouchableOpacity>
        ))}
      </SectionCard>

      {/* ── E-Commerce ── */}
      <SectionCard title="E-Commerce" icon="cart">
        {products.map((p) => (
          <View key={p.id} style={styles.productRow}>
            <Image source={{ uri: p.image }} style={styles.productImage} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.productSubtitle} numberOfLines={1}>{p.subtitle}</Text>
              <Text style={styles.productPrice}>₹{p.price}</Text>
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.viewBtn} activeOpacity={0.85} onPress={() => openScreen('FarmingBuy')}>
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={() => Linking.openURL('tel:')}>
                  <Ionicons name="call" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
    <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.88} onPress={() => openScreen('FarmingBuy')}>
          <Ionicons name="storefront-outline" size={16} color="#fff" />
          <Text style={styles.exploreBtnText}>Explore All Products</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Connect With Us ── */}
      <SectionCard title="Connect With Us" icon="people">
        <Text style={styles.connectSubtitle}>Stay updated on our social media</Text>
        <View style={styles.socialRow}>
          {SOCIAL_ITEMS.map((s, i) => (
            <TouchableOpacity key={i} style={[styles.socialBtn, { backgroundColor: s.color }]} activeOpacity={0.85} onPress={() => Linking.openURL(s.url)}>
              <Ionicons name={s.icon} size={16} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
   sidebarShell: { width: '350px', gap: 5 },
  card: { borderWidth: 1, borderColor: '#dddee0', backgroundColor: '#fff', borderRadius: 6, padding: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#000000' },

  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  trendText: { fontSize: 14.5, color: '#1e293b', fontWeight: '500', flex: 1 },

  productRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  productImage: { width: 70, height: 70, borderRadius: 2, backgroundColor: '#aec7e0' },
  productTitle: { fontSize: 14.5, fontWeight: '400', color: '#0f172a' },
  productSubtitle: { fontSize: 13, color: '#4b596d', marginTop: 10 },
  productPrice: { fontSize: 14.5, fontWeight: '500', color: '#0f172a', marginTop: 2 },
  productActions: { flexDirection: 'row', gap: 14, marginTop: 5 },
 viewBtn: {
  flex: 1,
  backgroundColor: '#f9f9fa',
  borderRadius: 2,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: '#ececec',
},
  viewBtnText: { fontSize: 14.5, fontWeight: '700', color: '#0f172a' },
  callBtn: { width: 30, height: 30, borderRadius: 2, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },

  exploreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 11, marginTop: 4 },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  connectSubtitle: { fontSize: 11.5, color: '#64748b', marginBottom: 10 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});