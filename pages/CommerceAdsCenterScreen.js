import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import ModuleWebHeader from '../components/Modulewebheader';
import { useQuickMenuRedirect } from '../utils/useQuickMenuRedirect';

const notify = (title, message) => {
  if (typeof alert !== 'undefined') {
    alert(`${title}\n${message}`);
  }
};

const StatCard = ({ icon, label, value, color, onPress, cardWidth }) => (
  <TouchableOpacity
    style={[styles.statCard, { width: cardWidth }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </TouchableOpacity>
);

const ActionButton = ({ icon, label, onPress, color, cardWidth }) => (
  <TouchableOpacity
    style={[styles.actionButton, { width: cardWidth }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const confirmDelete = (title, message, onYes) => {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(message)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onYes },
  ]);
};

const priceLabel = (value) => {
  const raw = String(value || '').replace(/[^\d.]/g, '');
  return raw ? `\u20B9${Number(raw).toLocaleString('en-IN')}` : 'Price N/A';
};

const ItemRow = ({ image, title, meta, extra, onEdit, onDelete, onPress, editLabel = 'Edit', stock, onToggleStock, stockBusy }) => (
  <TouchableOpacity style={styles.itemRow} activeOpacity={onPress ? 0.85 : 1} disabled={!onPress} onPress={onPress}>
    {image ? (
      <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />
    ) : (
      <View style={[styles.itemImage, styles.itemImageEmpty]}>
        <Ionicons name="image-outline" size={22} color="#94a3b8" />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
      {!!meta && <Text style={styles.itemMeta} numberOfLines={1}>{meta}</Text>}
      {!!extra && <Text style={styles.itemExtra} numberOfLines={1}>{extra}</Text>}
      {stock ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: stock.inStock ? '#166534' : '#b91c1c' }}>
            {stock.inStock ? '● In Stock' : '● Out of Stock'}
          </Text>
          {onToggleStock ? (
            // Row ka onPress (popup) na chale, isliye alag touchable me — edit kiye bina (bina credit) seedha toggle
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ marginLeft: 8 }}>
              <Switch
                value={stock.inStock}
                onValueChange={onToggleStock}
                disabled={Boolean(stockBusy)}
                trackColor={{ false: '#fca5a5', true: '#86efac' }}
                thumbColor={stock.inStock ? '#16a34a' : '#dc2626'}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
    <View style={styles.itemActions}>
      <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.85}>
        <Ionicons name="create-outline" size={16} color="#fff" />
        <Text style={styles.editBtnText}>{editLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.85}>
        <Ionicons name="trash-outline" size={16} color="#dc2626" />
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function CommerceAdsCenterScreen({ navigation }) {
  // Desktop web par ye page bhi sidebar wale shell ke andar hi khule
  const redirectingToSidebar = useQuickMenuRedirect(navigation, 'CommerceAdsCenter');
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_700Bold });
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ myListings: 0 });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // ── Responsive sizing ───────────────────────────────────────────────────
  // Use most of the available width, only cap it on very large screens (web/tablet)
  const CONTENT_MAX_WIDTH = 1100;
  const contentWidth = Math.min(windowWidth, CONTENT_MAX_WIDTH);
  const horizontalPadding = windowWidth > 700 ? 32 : 16;
  const gap = 16;

  // Decide columns based on available width so cards never look tiny in the middle
  const usableWidth = contentWidth - horizontalPadding * 2;
  const statColumns = usableWidth > 600 ? 3 : usableWidth > 460 ? 2 : 1;
  const actionColumns = usableWidth > 760 ? 3 : usableWidth > 460 ? 2 : 1;

  const statCardWidth = (usableWidth - gap * (statColumns - 1)) / statColumns;
  const actionCardWidth = (usableWidth - gap * (actionColumns - 1)) / actionColumns;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await UserStore.getCurrentUser();
      setUser(currentUser || null);

      const currentEmail = String(currentUser?.email || '').trim().toLowerCase();

      // 1) My Listings — jitne products maine add kiye (My Listings screen jaisa hi logic)
      const summary = await UserStore.getEcomeMarketplaceSummary();
      const listings = Array.isArray(summary?.listings) ? summary.listings : [];
      const myListings = listings.filter(
        (item) =>
          String(item.createdBy || item.owner_email || '').trim().toLowerCase() === currentEmail
      ).length;

      setProducts(listings.filter(
        (item) =>
          String(item.createdBy || item.owner_email || '').trim().toLowerCase() === currentEmail
      ));

      setStats({ myListings });
    } catch (error) {
      console.error('Commerce hub load error:', error);
      notify('Load failed', 'Unable to load commerce dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ✅ In Stock / Out of Stock toggle — turant UI badlo, fail ho to wapas purani value
  const [stockBusyId, setStockBusyId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null); // row click => modal
  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId)) || null;
  const handleToggleStock = async (item, next) => {
    if (stockBusyId) return;
    setStockBusyId(item.id);
    setProducts((prev) => prev.map((p) => (String(p.id) === String(item.id) ? { ...p, in_stock: next } : p)));
    const result = await UserStore.updateEcomeListingStock(item.id, next);
    if (!result?.ok) {
      setProducts((prev) => prev.map((p) => (String(p.id) === String(item.id) ? { ...p, in_stock: !next } : p)));
      notify('Update failed', result?.message || 'Unable to update stock.');
    }
    setStockBusyId(null);
  };

  const handleEditProduct = (item) => navigation.navigate('Sell', { editListing: item });

  const handleDeleteProduct = (item) => {
    confirmDelete('Delete Product', 'Are you sure you want to delete this product? This cannot be undone.', async () => {
      const result = await UserStore.deleteEcomeListing(item.id);
      if (result?.ok) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(item.id)));
        setStats((prev) => ({ ...prev, myListings: Math.max(0, prev.myListings - 1) }));
      } else {
        notify('Delete failed', result?.message || 'Unable to delete this product.');
      }
    });
  };

  if (redirectingToSidebar) return null;

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
         <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Web header — same shared red header as Settings/Wallet */}
      <ModuleWebHeader title="My Ecom Product" navigation={navigation} />

      {/* Native header — same red image design as Settings screen */}
      {Platform.OS !== 'web' && (
        <ImageBackground
          source={require('../assets/images/profile-red.png')}
          resizeMode="cover"
          style={[styles.header, { paddingHorizontal: horizontalPadding, paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Ecom Product</Text>
            <Text style={styles.headerSub}>Manage listings and enquiries</Text>
          </View>
        </ImageBackground>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.container,
            { width: contentWidth, paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="storefront" size={32} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>Welcome, {user?.name || 'Seller'}</Text>
              <Text style={styles.welcomeSub}>Your subscription marketplace dashboard</Text>
            </View>
          </View>

          <View style={[styles.statsGrid, { gap }]}>
            <StatCard
              icon="layers"
              label="My Listings"
              value={stats.myListings}
              color="#3b82f6"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('MyListings')}
            />
          </View>

          {/* ---- My Products (Edit / Delete) ---- */}
          {products.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Products ({products.length})</Text>
            {products.map((item) => (
              <ItemRow
                key={`prod-${item.id}`}
                image={item.image || item.mediaItems?.[0]?.uri || ''}
                title={item.title || 'Untitled Product'}
                meta={[item.sector, item.city].filter(Boolean).join('  \u2022  ')}
                extra={priceLabel(item.price)}
                stock={{ inStock: item.in_stock !== false }}
                onToggleStock={(v) => handleToggleStock(item, v)}
                stockBusy={String(stockBusyId) === String(item.id)}
                onPress={() => setSelectedProductId(item.id)}
                onEdit={() => handleEditProduct(item)}
                onDelete={() => handleDeleteProduct(item)}
              />
            ))}
          </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ---- Product modal: yahin se In Stock / Out of Stock toggle ---- */}
      {selectedProduct ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedProductId(null)}>
          <View style={styles.pmBackdrop}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedProductId(null)} />
            <View style={styles.pmCard}>
              <View style={styles.pmHeader}>
                <Text style={styles.pmTitle} numberOfLines={2}>{selectedProduct.title || 'Untitled Product'}</Text>
                <TouchableOpacity onPress={() => setSelectedProductId(null)} style={styles.pmClose} activeOpacity={0.8}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
              {(selectedProduct.image || selectedProduct.mediaItems?.[0]?.uri) ? (
                <Image source={{ uri: selectedProduct.image || selectedProduct.mediaItems?.[0]?.uri }} style={styles.pmImage} resizeMode="cover" />
              ) : null}
              <Text style={styles.pmMeta}>{[selectedProduct.sector, selectedProduct.city].filter(Boolean).join('  \u2022  ')}</Text>
              <Text style={styles.pmPrice}>{priceLabel(selectedProduct.price)}</Text>

              <View style={[styles.pmStockBox, selectedProduct.in_stock === false ? styles.pmStockOut : styles.pmStockIn]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: selectedProduct.in_stock === false ? '#b91c1c' : '#166534' }}>
                    {selectedProduct.in_stock === false ? 'Out of Stock' : 'In Stock'}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                    {selectedProduct.in_stock === false
                      ? 'Buyers ko "Out of Stock" dikh raha hai. Stock aane par ON karo.'
                      : 'Stock khatam ho jaye to toggle OFF karo.'}
                  </Text>
                </View>
                <Switch
                  value={selectedProduct.in_stock !== false}
                  onValueChange={(v) => handleToggleStock(selectedProduct, v)}
                  disabled={String(stockBusyId) === String(selectedProduct.id)}
                  trackColor={{ false: '#fca5a5', true: '#86efac' }}
                  thumbColor={selectedProduct.in_stock === false ? '#dc2626' : '#16a34a'}
                />
              </View>

              <View style={styles.pmActions}>
                <TouchableOpacity style={styles.editBtn} activeOpacity={0.85} onPress={() => { const p = selectedProduct; setSelectedProductId(null); handleEditProduct(p); }}>
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={() => { const p = selectedProduct; setSelectedProductId(null); handleDeleteProduct(p); }}>
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  headerSub: {
    fontSize: 13,
    color: '#ffffff',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  scrollContent: {
    alignItems: 'center',
  },
  container: {
    paddingTop: 20,
    alignSelf: 'center',
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    gap: 14,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
   welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  welcomeSub: {
    fontSize: 13,
    color: '#295e20',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 130,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    minHeight: 76,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  itemImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f1f5f9' },
  itemImageEmpty: { alignItems: 'center', justifyContent: 'center' },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pmBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  pmCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  pmHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  pmTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a' },
  pmClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  pmImage: { width: '100%', height: 170, borderRadius: 12, backgroundColor: '#f1f5f9', marginBottom: 10 },
  pmMeta: { fontSize: 12.5, color: '#64748b' },
  pmPrice: { fontSize: 16, fontWeight: '800', color: '#b91c1c', marginTop: 4, marginBottom: 12 },
  pmStockBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  pmStockIn: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pmStockOut: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  pmActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  itemExtra: { fontSize: 12.5, fontWeight: '700', color: '#b91c1c', marginTop: 3 },
  itemActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 36, borderRadius: 10, backgroundColor: '#b91c1c',
  },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, height: 36, borderRadius: 10,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
  },
  deleteBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '700' },
});