import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { UserStore } from '../store/UserStore';

const IS_WEB = Platform.OS === 'web';
const FONT = { regular: 'Roboto_400Regular', medium: 'Roboto_500Medium', bold: 'Roboto_700Bold', black: 'Roboto_900Black' };

const notify = (title, message) => {
  if (IS_WEB && typeof alert !== 'undefined') {
    alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
};

const money = (value) => {
  const raw = String(value || '').replace(/[^\d.]/g, '');
  if (!raw) return 'Price N/A';
  return `₹${Number(raw).toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const STATUS_CONFIG = {
  active:   { bg: '#fff7ed', text: '#c2410c' },
  pending:  { bg: '#fef9c3', text: '#a16207' },
  inactive: { bg: '#f1f5f9', text: '#64748b' },
};

// ─── Mobile card ───────────────────────────────────────────────────────────────
const ListingCardMobile = ({ item }) => {
  const status = (item.status || 'active').toLowerCase();
  const pill = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, status === 'pending' && styles.cardAccentAmber]} />
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, status === 'pending' && styles.iconWrapAmber]}>
          <Ionicons name="cube-outline" size={20} color={status === 'pending' ? '#d97706' : '#ea580c'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { fontFamily: FONT.bold }]} numberOfLines={1}>{item.title || 'Untitled Listing'}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {[item.sector, item.city || 'Location N/A'].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.statusText, { color: pill.text }]}>{item.status || 'active'}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, styles.chipPrice]}>
          <Ionicons name="cash-outline" size={13} color="#ea580c" />
          <Text style={[styles.chipText, styles.chipTextPrice]}>{money(item.price)}</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="layers-outline" size={13} color="#94a3b8" />
          <Text style={styles.chipText}>Qty {item.quantity || 'N/A'}</Text>
        </View>
        {formatDate(item.createdAt) ? (
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
            <Text style={styles.chipText}>{formatDate(item.createdAt)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

// ─── Web table row ─────────────────────────────────────────────────────────────
const ListingRowWeb = ({ item }) => {
  const status = (item.status || 'active').toLowerCase();
  const pill = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <View style={styles.tableRow}>
      <View style={{ flex: 2.5 }}>
        <Text style={[styles.rowName, { fontFamily: FONT.medium }]} numberOfLines={1}>{item.title || 'Untitled'}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[item.city, item.sector].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={[styles.rowCell, styles.rowPrice]}>{money(item.price)}</Text>
      <Text style={styles.rowCell}>{item.quantity || '—'}</Text>
      <Text style={styles.rowCell}>{formatDate(item.createdAt) || '—'}</Text>
      <View style={{ flex: 1 }}>
        <View style={[styles.statusPill, { backgroundColor: pill.bg, alignSelf: 'flex-start' }]}>
          <Text style={[styles.statusText, { color: pill.text }]}>{item.status || 'active'}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, subColor }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statVal, { fontFamily: FONT.bold }]}>{value}</Text>
    {sub ? <Text style={[styles.statSub, subColor && { color: subColor }]}>{sub}</Text> : null}
  </View>
);

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function MyListingsScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width: winWidth } = useWindowDimensions();
  const isTablet = !IS_WEB && winWidth >= 768;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser?.email) {
        setListings([]);
        notify('Login required', 'Please login to view your listings.');
        return;
      }
      const summary = await UserStore.getEcomeMarketplaceSummary();
      const currentEmail = String(currentUser.email || '').trim().toLowerCase();
      const myListings = (Array.isArray(summary?.listings) ? summary.listings : []).filter(
        (item) =>
          String(item.createdBy || item.owner_email || '').trim().toLowerCase() === currentEmail
      );
      setListings(myListings);
    } catch (error) {
      console.error('My listings load error:', error);
      notify('Load failed', 'Unable to load your listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  const activeCount = listings.filter((l) => (l.status || 'active').toLowerCase() === 'active').length;

  const totalValue = listings.reduce((sum, l) => {
    const raw = parseFloat(String(l.price || '').replace(/[^\d.]/g, '')) || 0;
    return sum + raw;
  }, 0);

  const formattedTotal =
    totalValue >= 100000
      ? `₹${(totalValue / 100000).toFixed(1)}L`
      : totalValue > 0
      ? `₹${totalValue.toLocaleString('en-IN')}`
      : '—';

  const filteredListings = listings.filter((l) =>
    (l.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = listings.filter((l) => (l.status || '').toLowerCase() === 'pending').length;

  return (
    <SafeAreaView style={styles.root}>
      <View style={{ height: IS_WEB ? 0 : insets.top, backgroundColor: '#fff' }} />

      {/* ── Topbar — matches AdvertiseScreen header style ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, fontsLoaded && { fontFamily: FONT.bold }]}>My Listings</Text>

        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Sell')} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={[styles.addBtnText, fontsLoaded && { fontFamily: FONT.bold }]}>{IS_WEB ? 'New listing' : 'New'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: (IS_WEB ? 0 : insets.bottom) + 32 },
            isTablet && { maxWidth: 720, alignSelf: 'center', width: '100%' },
          ]}
        >
          {/* ── Page title (web only) ── */}
          {IS_WEB && (
            <View style={styles.pageHeader}>
              <Text style={[styles.pageTitle, fontsLoaded && { fontFamily: FONT.bold }]}>Manage Listings</Text>
              <Text style={styles.pageSub}>Last updated just now</Text>
            </View>
          )}

          {/* ── Stat cards ── */}
          {listings.length > 0 && (
            <View style={styles.statsRow}>
              <StatCard
                label="Total Value"
                value={formattedTotal}
                sub={`${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
                subColor="#94a3b8"
              />
              <StatCard
                label="Active"
                value={`${activeCount} / ${listings.length}`}
                sub={pendingCount > 0 ? `${pendingCount} pending` : 'All clear'}
                subColor={pendingCount > 0 ? '#a16207' : '#16a34a'}
              />
            </View>
          )}

          {listings.length > 0 ? (
            <>
              {/* ── Toolbar ── */}
              <View style={styles.toolbar}>
                <View style={styles.searchWrap}>
                  <Ionicons name="search-outline" size={15} color="#94a3b8" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search listings..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                {IS_WEB && (
                  <Text style={styles.countLabel}>{filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}</Text>
                )}
              </View>

              {/* ── Web: table header ── */}
              {IS_WEB && (
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHdrText, { flex: 2.5 }]}>Product</Text>
                  <Text style={styles.tableHdrText}>Price</Text>
                  <Text style={styles.tableHdrText}>Qty</Text>
                  <Text style={styles.tableHdrText}>Date</Text>
                  <Text style={styles.tableHdrText}>Status</Text>
                </View>
              )}

              {/* ── Listing rows / cards ── */}
              <View style={IS_WEB ? styles.tableWrap : undefined}>
                {filteredListings.length > 0 ? (
                  filteredListings.map((item) =>
                    IS_WEB ? (
                      <ListingRowWeb key={String(item.id)} item={item} />
                    ) : (
                      <ListingCardMobile key={String(item.id)} item={item} />
                    )
                  )
                ) : (
                  <Text style={styles.noResults}>No listings match your search.</Text>
                )}
              </View>

              {/* ── CTA banner ── */}
              <View style={styles.ctaBanner}>
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="megaphone-outline" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ctaTitle, { fontFamily: FONT.bold }]}>Boost a listing</Text>
                  <Text style={styles.ctaSub}>Get 3× more buyer views</Text>
                </View>
                <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
                  <Text style={styles.ctaBtnText}>Explore ↗</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* ── Empty state ── */
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="layers-outline" size={32} color="#cbd5e1" />
              </View>
              <Text style={[styles.emptyTitle, { fontFamily: FONT.bold }]}>No listings yet</Text>
              <Text style={styles.emptySub}>Create your first product listing from the Sell screen.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Sell')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={17} color="#fff" />
                <Text style={styles.emptyBtnText}>Create Listing</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IS_WEB ? '#fff' : '#f8fafc' },

  // ── Header — matches AdvertiseScreen top bar (white bg, black arrow-back, bottom border) ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: IS_WEB ? 14 : 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginLeft: -6,
  },
  backLabel: { fontSize: 13, color: '#ea580c', fontWeight: '500' },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    color: '#353535',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ea580c',
    borderRadius: 999,
    paddingHorizontal: IS_WEB ? 16 : 14,
    paddingVertical: IS_WEB ? 7 : 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: IS_WEB ? 13 : 12,
  },

  // ── Container ──
  container: {
    paddingHorizontal: IS_WEB ? 32 : 16,
    paddingTop: IS_WEB ? 0 : 4,
    maxWidth: IS_WEB ? 900 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#94a3b8', fontSize: 13 },

  // ── Page title (web) ──
  pageHeader: { paddingTop: 24, paddingBottom: 4 },
  pageTitle: { fontSize: 26, fontWeight: '600', color: '#0f172a', letterSpacing: -0.4 },
  pageSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: IS_WEB ? 20 : 12,
    marginBottom: IS_WEB ? 20 : 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 14,
    padding: IS_WEB ? 18 : 14,
  },
  statLabel: {
    fontSize: 11,
    color: '#9a3412',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '600',
    marginBottom: 6,
  },
  statVal: {
    fontSize: IS_WEB ? 28 : 22,
    fontWeight: '600',
    color: '#ea580c',
  },
  statSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  // ── Toolbar ──
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  searchWrap: {
    flex: IS_WEB ? 0 : 1,
    width: IS_WEB ? 280 : undefined,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 9,
    outlineStyle: 'none',
  },
  countLabel: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  // ── Web table ──
  tableWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHdrText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#9a3412',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  rowName: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  rowMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  rowCell: { flex: 1, fontSize: 13, color: '#64748b' },
  rowPrice: { color: '#ea580c', fontWeight: '600' },
  noResults: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 24 },

  // ── Mobile card ──
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    backgroundColor: '#ea580c',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardAccentAmber: { backgroundColor: '#f59e0b' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff7ed',
  },
  iconWrapAmber: { backgroundColor: '#fffbeb' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  cardMeta: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize', letterSpacing: 0.3 },
  description: { fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 10, paddingLeft: 4 },

  // ── Chips ──
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingLeft: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f8fafc', borderRadius: 999,
    paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipPrice: { borderColor: '#fed7aa' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  chipTextPrice: { color: '#ea580c' },

  // ── CTA banner ──
  ctaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#ea580c',
    borderRadius: 14, padding: 16, marginTop: 16,
  },
  ctaIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  ctaSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  ctaBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  ctaBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // ── Empty state ──
  emptyBox: {
    alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 24, paddingVertical: 48, marginTop: 12,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#ea580c',
    borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});