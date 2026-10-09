import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';

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

function SectionCard({ title, icon, children, action }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={16} color="#e11d48" />
        <Text style={styles.cardTitle}>{title}</Text>
        {action}
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

  // ✅ Ecom products seedha wahi source se (View All wale page jaisa) taaki home par bhi 3 dikhein.
  const [ecomListings, setEcomListings] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const summary = await UserStore.getEcomeMarketplaceSummary();
        if (mounted && Array.isArray(summary?.listings)) setEcomListings(summary.listings);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const products = useMemo(() => {
    const fromListings = ecomListings.slice(0, 3).map((p) => ({
      id: `listing-${p.id}`, title: p.title, subtitle: p.description || 'Ecome listing',
      price: p.price || '', image: p.image || p.mediaItems?.[0]?.uri || '',
    }));
    if (fromListings.length) return fromListings;
    const real = stories.filter((s) => s.isEcome).slice(0, 3);
    return real.length ? real.map((p) => ({
      id: p.id, title: p.title, subtitle: p.description || 'Ecome listing',
      price: p.price || '', image: p.image,
    })) : DEMO_PRODUCTS;
  }, [ecomListings, stories]);

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
      <SectionCard
        title="E-Commerce"
        icon="cart"
        action={<TouchableOpacity onPress={() => openScreen('FarmingBuy')}><Text style={styles.viewAll}>View All <Ionicons name="arrow-forward" size={12} /></Text></TouchableOpacity>}
      >
        {products.map((p) => (
          <View key={p.id} style={styles.productRow}>
            <Image source={{ uri: p.image }} style={styles.productImage} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.productSubtitle} numberOfLines={1}>{p.subtitle}</Text>
              <Text style={styles.productPrice}>₹{p.price}</Text>
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.viewBtn} activeOpacity={0.85} onPress={() => openScreen('FarmingBuy')}>
                  <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" imageStyle={styles.buttonImage} style={styles.imageButton}><Text style={styles.viewBtnText}>View</Text></ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={() => Linking.openURL('tel:')}>
                  <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" imageStyle={styles.buttonImage} style={styles.imageButton}><Ionicons name="call" size={14} color="#fff" /></ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
    <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.88} onPress={() => openScreen('FarmingBuy')}>
          <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" imageStyle={styles.buttonImage} style={[styles.imageButton, styles.exploreButtonImage]}><Ionicons name="storefront-outline" size={16} color="#fff" /><Text style={styles.exploreBtnText}>Explore All Products</Text></ImageBackground>
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
   sidebarShell: { width: '100%', gap: 12 },
  card: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#172033', fontFamily: 'Roboto' },
  viewAll: { color: '#dc2626', fontSize: 12, fontWeight: '800', fontFamily: 'Roboto' },

  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trendText: { fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1, fontFamily: 'Roboto' },

  productRow: { flexDirection: 'row', gap: 10, marginBottom: 10, padding: 8, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 10, backgroundColor: '#fff' },
  productImage: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#aec7e0' },
  productTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', fontFamily: 'Roboto' },
  productSubtitle: { fontSize: 11, color: '#64748b', marginTop: 3, fontFamily: 'Roboto' },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#dc2626', marginTop: 4, fontFamily: 'Roboto' },
  productActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
 viewBtn: {
  flex: 1,
  height: 30,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
},
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'Roboto' },
  callBtn: { width: 30, height: 30, borderRadius: 6, overflow: 'hidden' },
  imageButton: { flex: 1, width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonImage: { borderRadius: 6 },

  exploreBtn: { borderRadius: 8, overflow: 'hidden', marginTop: 4, height: 42 },
  exploreButtonImage: { paddingVertical: 11 },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: 'Roboto' },

  connectSubtitle: { fontSize: 11.5, color: '#64748b', marginBottom: 10 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});