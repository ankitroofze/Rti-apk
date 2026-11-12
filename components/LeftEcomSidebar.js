import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, Linking, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';
import { SOCIAL_LINKS } from '../constants/socialLinks';

const SOCIAL_ITEMS = [
  { icon: 'logo-facebook', color: '#1877F2', url: SOCIAL_LINKS.facebook },
  { icon: 'logo-twitter', color: '#1DA1F2', url: SOCIAL_LINKS.twitter },
  { icon: 'logo-youtube', color: '#FF0000', url: SOCIAL_LINKS.youtube },
  { icon: 'logo-instagram', color: '#E1306C', url: SOCIAL_LINKS.instagram },
  { icon: 'paper-plane', color: '#229ED9', url: 'https://t.me/' },
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
      .filter((s) => !s?.isAd && !s?.isEcome)
      .sort((a, b) => (Number(b?.views) || 0) - (Number(a?.views) || 0))
      .slice(0, 5)
      .map((s) => s.title)
      .filter(Boolean);
  }, [stories]);

  // ✅ Ecom products: Only real database listings loaded from backend API. Zero fake/dummy data.
  const [ecomListings, setEcomListings] = useState([]);
  const [loadingEcom, setLoadingEcom] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const summary = await UserStore.getEcomeMarketplaceSummary();
        if (mounted && Array.isArray(summary?.listings)) {
          setEcomListings(summary.listings);
        }
      } catch {}
      finally {
        if (mounted) setLoadingEcom(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const products = useMemo(() => {
    const isCleanImage = (img) => typeof img === 'string' && img.trim() && !img.includes('picsum.photos');

    // 1. Direct real backend listings from getEcomeMarketplaceSummary
    if (Array.isArray(ecomListings) && ecomListings.length > 0) {
      return ecomListings
        .filter((p) => !p.is_deleted && Number(p.is_deleted || 0) !== 1)
        .slice(0, 3).map((p) => {
        const rawImg = p.image || p.mediaItems?.[0]?.uri || (Array.isArray(p.images) ? p.images[0] : '') || '';
        const safeImg = isCleanImage(rawImg) ? rawImg.trim() : '';
        return {
          id: `listing-${p.id}`,
          listingId: String(p.id),
          title: p.title || p.product_name || 'E-Commerce Product',
          subtitle: p.description || p.category || 'Verified listing',
          price: p.price != null && String(p.price).trim() ? String(p.price).trim() : '',
          image: safeImg,
          phone: p.contact || '',
        };
      });
    }

    // 2. Real ecom stories passed from HomeScreen feed
    const realFromStories = (Array.isArray(stories) ? stories : [])
      .filter((s) => s.isEcome && !String(s.id).startsWith('demo-') && !s.is_deleted && Number(s.is_deleted || 0) !== 1);
    if (realFromStories.length > 0) {
      return realFromStories.slice(0, 3).map((p) => {
        const rawImg = p.image || (Array.isArray(p.images) ? p.images[0] : '') || '';
        const safeImg = isCleanImage(rawImg) ? rawImg.trim() : '';
        return {
          id: p.id,
          listingId: String(p.ecomId || p.id || '').replace(/^listing-|^ecome-/, ''),
          title: p.title || 'E-Commerce Product',
          subtitle: p.description || p.category || 'Verified listing',
          price: p.price != null && String(p.price).trim() ? String(p.price).trim() : '',
          image: safeImg,
          phone: p.contact || '',
        };
      });
    }

    // Zero fake products (iPhone/boAt/Noise/picsum removed permanently)
    return [];
  }, [ecomListings, stories]);

  const openScreen = (screenName) => navigation?.navigate?.(screenName);
  // Product par click => FarmingBuy khule aur usi product ka detail turant dikhe
  const openProduct = (p) => {
    const id = p?.listingId && !String(p.id).startsWith('demo-') ? p.listingId : undefined;
    navigation?.navigate?.('FarmingBuy', { openListingId: id });
  };

  return (
    <View style={styles.sidebarShell}>
      {/* ── Trending Topics ── */}
      <SectionCard title={commonCopy?.trendingTopics || 'Trending Topics'} icon="flame">
        {trendingTopics.length > 0 ? (
          trendingTopics.map((topic, i, arr) => (
            <TouchableOpacity key={i} style={[styles.trendRow, i === arr.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.75} onPress={() => onOpenDetails?.({ title: topic })}>
              <Ionicons name="trending-up" size={18} color="#ad1010" />
              <Text style={styles.trendText} numberOfLines={1}>{topic}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>{commonCopy?.noNews || 'No trending topics right now'}</Text>
          </View>
        )}
      </SectionCard>

      {/* ── E-Commerce ── */}
      <SectionCard
        title={commonCopy?.ecommerce || 'E-Commerce'}
        icon="cart"
        action={
          <TouchableOpacity onPress={() => openScreen('FarmingBuy')}>
            <Text style={styles.viewAll}>{commonCopy?.viewAll || 'View All'} <Ionicons name="arrow-forward" size={12} /></Text>
          </TouchableOpacity>
        }
      >
        {products.length > 0 ? (
          products.map((p, pIdx) => {
            const hasImage = Boolean(p.image && (p.image.startsWith('http://') || p.image.startsWith('https://') || p.image.startsWith('data:') || p.image.startsWith('file:')));
            return (
              <TouchableOpacity key={`ecom-${p.id || 'p'}-${pIdx}`} style={styles.productRow} activeOpacity={0.9} onPress={() => openProduct(p)}>
                {hasImage ? (
                  <Image source={{ uri: p.image }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.productImage, styles.productImageFallback]}>
                    <Ionicons name="storefront-outline" size={24} color="#dc2626" />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.productTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.productSubtitle} numberOfLines={1}>{p.subtitle}</Text>
                  <Text style={styles.productPrice}>{p.price ? `₹${p.price}` : '—'}</Text>
                  <View style={styles.productActions}>
                    <TouchableOpacity style={styles.viewBtn} activeOpacity={0.85} onPress={() => openProduct(p)}>
                      <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" imageStyle={styles.buttonImage} style={styles.imageButton}>
                        <Text style={styles.viewBtnText}>{commonCopy?.view || 'View'}</Text>
                      </ImageBackground>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.callBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        const cleanTel = p.phone ? String(p.phone).replace(/[^0-9+]/g, '') : '';
                        Linking.openURL(cleanTel ? `tel:${cleanTel}` : 'tel:');
                      }}
                    >
                      <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" imageStyle={styles.buttonImage} style={styles.imageButton}>
                        <Ionicons name="call" size={14} color="#fff" />
                      </ImageBackground>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : loadingEcom ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color="#dc2626" />
            <Text style={styles.emptySubtitle}>Loading products...</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={26} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No products listed yet</Text>
            <Text style={styles.emptySubtitle}>Visit marketplace to explore listings</Text>
          </View>
        )}

        <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.88} onPress={() => openScreen('FarmingBuy')}>
          <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" imageStyle={styles.buttonImage} style={[styles.imageButton, styles.exploreButtonImage]}>
            <Ionicons name="storefront-outline" size={16} color="#fff" />
            <Text style={styles.exploreBtnText}>{commonCopy?.exploreAllProducts || 'Explore All Products'}</Text>
          </ImageBackground>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Connect With Us ── */}
      <SectionCard title={commonCopy?.connectWithUs || 'Connect With Us'} icon="people">
        <Text style={styles.connectSubtitle}>{commonCopy?.stayUpdatedSocial || 'Stay updated on our social media'}</Text>
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
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)' },
      default: { shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#172033', fontFamily: 'Roboto' },
  viewAll: { color: '#dc2626', fontSize: 12, fontWeight: '800', fontFamily: 'Roboto' },

  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trendText: { fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1, fontFamily: 'Roboto' },

  productRow: { flexDirection: 'row', gap: 10, marginBottom: 10, padding: 8, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 10, backgroundColor: '#fff' },
  productImage: { width: 84, height: 84, borderRadius: 8, backgroundColor: '#f1f5f9' },
  productImageFallback: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Roboto',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'Roboto',
    textAlign: 'center',
  },

  exploreBtn: { borderRadius: 8, overflow: 'hidden', marginTop: 4, height: 42 },
  exploreButtonImage: { paddingVertical: 11 },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: 'Roboto' },

  connectSubtitle: { fontSize: 11.5, color: '#64748b', marginBottom: 10, fontFamily: 'Roboto' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
