import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserStore } from '../store/UserStore';

const IS_WEB = Platform.OS === 'web';

const money = (val) => {
  if (!val) return '₹0';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const notify = (title, msg) => {
  if (IS_WEB) { alert(`${title}\n${msg}`); } else { Alert.alert(title, msg); }
};

const getBuyerName    = (p = {}) => p.name || p.buyer_name || [p.buyer_first_name, p.buyer_last_name].filter(Boolean).join(' ') || 'Unknown';
const getBuyerEmail   = (p = {}) => p.email || p.buyer_contact_email || p.buyer_email || '—';
const getBuyerContact = (p = {}) => p.contact || p.buyer_mobile || p.mobile || '';
const getQty          = (p = {}) => p.quantity || p.requested_quantity || p.product_quantity || 'N/A';
const getDate         = (p = {}) => {
  const raw = p.created_at || p.createdAt || p.date;
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Enquiry card inside expanded product ─────────────────────────────────────
const EnquiryBuyerCard = ({ enquiry, product, onCall, onWhatsApp, index }) => {
  const initials = getBuyerName(enquiry).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={styles.buyerCard}>
      {/* buyer avatar + name */}
      <View style={styles.buyerTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.buyerName}>{getBuyerName(enquiry)}</Text>
          <Text style={styles.buyerEmail} numberOfLines={1}>{getBuyerEmail(enquiry)}</Text>
        </View>
        <View style={styles.buyerIndexBadge}>
          <Text style={styles.buyerIndexText}>#{index + 1}</Text>
        </View>
      </View>

      {/* info chips */}
      <View style={styles.buyerChips}>
        <View style={styles.chip}>
          <Ionicons name="layers-outline" size={12} color="#ea580c" />
          <Text style={styles.chipText}>Qty: {getQty(enquiry)}</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="calendar-outline" size={12} color="#64748b" />
          <Text style={[styles.chipText, { color: '#64748b' }]}>{getDate(enquiry)}</Text>
        </View>
        {getBuyerContact(enquiry) ? (
          <View style={styles.chip}>
            <Ionicons name="call-outline" size={12} color="#64748b" />
            <Text style={[styles.chipText, { color: '#64748b' }]}>{getBuyerContact(enquiry)}</Text>
          </View>
        ) : null}
      </View>

      {/* message */}
      {enquiry.message ? (
        <View style={styles.messageBox}>
          <Ionicons name="chatbubble-outline" size={12} color="#94a3b8" style={{ marginTop: 1 }} />
          <Text style={styles.messageText}>{enquiry.message}</Text>
        </View>
      ) : null}

      {/* action buttons */}
      <View style={styles.buyerActions}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => onCall(getBuyerContact(enquiry))}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.waBtn}
          onPress={() => onWhatsApp(getBuyerContact(enquiry), enquiry, product)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={14} color="#fff" />
          <Text style={styles.actionBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SellerEnquiryDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading]         = useState(true);
  const [listings, setListings]       = useState([]);
  const [expandedId, setExpandedId]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) { notify('Not Logged In', 'Please login.'); setLoading(false); return; }
      const summary = await UserStore.getEcomeMarketplaceSummary();
      if (!summary) { setLoading(false); return; }
      const userEmail  = String(currentUser.email || '').trim().toLowerCase();
      const enquiries  = Array.isArray(summary.enquiries) ? summary.enquiries : [];
      const enriched   = (Array.isArray(summary.listings) ? summary.listings : [])
        .filter((l) => {
  const sellerEmail = String(l.createdBy || l.owner_email || '').trim().toLowerCase();
  return sellerEmail === userEmail;
})
        .map((l) => ({ ...l, enquiries: enquiries.filter((eq) => String(eq.product_id) === String(l.id)) }));
      setListings(enriched);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleCall = (contact) => {
    const phone = String(contact || '').replace(/\D/g, '');
    if (!phone) { notify('No Contact', 'No phone number available.'); return; }
    IS_WEB ? window.open(`tel:+91${phone}`) : Linking.openURL(`tel:+91${phone}`);
  };

  const handleWhatsApp = (contact, person, product) => {
    const phone = String(contact || '').replace(/\D/g, '');
    if (!phone) { notify('No Contact', 'No phone number available.'); return; }
    const msg = encodeURIComponent(`Hi, regarding your enquiry for: ${product.title}\nPrice: ${money(product.price)}`);
    const url = `https://wa.me/91${phone}?text=${msg}`;
    IS_WEB ? window.open(url, '_blank') : Linking.openURL(url);
  };

  // totals
  const totalEnquiries = listings.reduce((s, l) => s + (l.enquiries?.length || 0), 0);
  const productsWithEnquiries = listings.filter((l) => l.enquiries?.length > 0).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Loading enquiries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={{ height: IS_WEB ? 0 : insets.top, backgroundColor: '#111' }} />

      {/* ── Topbar ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={IS_WEB ? '#ea580c' : '#fff'} />
          {IS_WEB && <Text style={styles.backLabel}>Back</Text>}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enquiries Received</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color={IS_WEB ? '#ea580c' : '#fff'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── Page title (web) ── */}
        {IS_WEB && (
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Enquiries Received</Text>
            <Text style={styles.pageSub}>Buyers interested in your listings</Text>
          </View>
        )}

        {/* ── Stat row ── */}
        {listings.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Products</Text>
              <Text style={styles.statVal}>{listings.length}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#fed7aa' }]}>
              <Text style={[styles.statLabel, { color: '#9a3412' }]}>Total Enquiries</Text>
              <Text style={[styles.statVal, { color: '#ea580c' }]}>{totalEnquiries}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#bbf7d0' }]}>
              <Text style={[styles.statLabel, { color: '#166534' }]}>Active</Text>
              <Text style={[styles.statVal, { color: '#16a34a' }]}>{productsWithEnquiries}</Text>
            </View>
          </View>
        )}

        {listings.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="inbox-outline" size={32} color="#fed7aa" />
            </View>
            <Text style={styles.emptyTitle}>No enquiries yet</Text>
            <Text style={styles.emptySub}>Buyers will appear here when they enquire about your listings</Text>
          </View>
        ) : (
          listings.map((product) => {
            const isOpen   = expandedId === product.id;
            const eCount   = product.enquiries?.length || 0;
            return (
              <View key={String(product.id)} style={styles.productCard}>
                {/* left accent */}
                <View style={[styles.productAccent, eCount === 0 && { backgroundColor: '#e2e8f0' }]} />

                <View style={{ flex: 1 }}>
                  {/* ── Product header ── */}
                  <TouchableOpacity
                    style={styles.productHeader}
                    onPress={() => setExpandedId(isOpen ? null : product.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.productIconWrap}>
                      <Ionicons name="cube-outline" size={18} color={eCount > 0 ? '#ea580c' : '#94a3b8'} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
                      <View style={styles.productMetaRow}>
                        <Text style={styles.productPrice}>{money(product.price)}</Text>
                        {product.city ? (
                          <>
                            <Text style={styles.metaDot}>·</Text>
                            <Ionicons name="location-outline" size={11} color="#94a3b8" />
                            <Text style={styles.productCity}>{product.city}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.enquiryCountBadge}>
                      <Text style={styles.enquiryCountText}>{eCount}</Text>
                    </View>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#94a3b8"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>

                  {/* ── Expanded buyers ── */}
                  {isOpen && (
                    <View style={styles.expandedWrap}>
                      {eCount > 0 ? (
                        product.enquiries.map((enquiry, idx) => (
                          <EnquiryBuyerCard
                            key={idx}
                            index={idx}
                            enquiry={enquiry}
                            product={product}
                            onCall={handleCall}
                            onWhatsApp={handleWhatsApp}
                          />
                        ))
                      ) : (
                        <View style={styles.noEnquiryWrap}>
                          <Ionicons name="chatbubbles-outline" size={22} color="#cbd5e1" />
                          <Text style={styles.noEnquiryText}>No enquiries for this product yet</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IS_WEB ? '#fff' : '#f8fafc' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: IS_WEB ? 32 : 16,
    height: 52,
    backgroundColor: IS_WEB ? '#fff' : '#111',
    borderBottomWidth: 1,
    borderBottomColor: IS_WEB ? '#f0e8e0' : '#1e1e1e',
  },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  backLabel:   { fontSize: 13, color: '#ea580c', fontWeight: '500' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: IS_WEB ? '#0f172a' : '#fff' },
  refreshBtn:  { padding: 6 },

  container: {
    paddingHorizontal: IS_WEB ? 32 : 14,
    paddingTop: 4,
    maxWidth: IS_WEB ? 760 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingDot:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#ea580c' },
  loadingText: { fontSize: 13, color: '#94a3b8' },

  pageHeader: { paddingTop: 24, paddingBottom: 4 },
  pageTitle:  { fontSize: 26, fontWeight: '600', color: '#0f172a', letterSpacing: -0.4 },
  pageSub:    { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 16 },
  statBox:  { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600', textAlign: 'center' },
  statVal:   { fontSize: 22, fontWeight: '600', color: '#0f172a', marginTop: 4 },

  // ── Product card ──
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  productAccent: { width: 3, backgroundColor: '#ea580c' },
  productHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  productIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
  },
  productTitle:   { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  productPrice:   { fontSize: 12, fontWeight: '600', color: '#ea580c' },
  metaDot:        { fontSize: 11, color: '#cbd5e1' },
  productCity:    { fontSize: 11, color: '#94a3b8' },
  enquiryCountBadge: {
    minWidth: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  enquiryCountText: { fontSize: 12, fontWeight: '700', color: '#ea580c' },

  // ── Expanded section ──
  expandedWrap: {
    paddingHorizontal: 12, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    gap: 8,
  },
  noEnquiryWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 4 },
  noEnquiryText: { fontSize: 13, color: '#94a3b8' },

  // ── Buyer card ──
  buyerCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  buyerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:     { fontSize: 13, fontWeight: '700', color: '#ea580c' },
  buyerName:      { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  buyerEmail:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  buyerIndexBadge:{ backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  buyerIndexText: { fontSize: 10, fontWeight: '700', color: '#64748b' },

  buyerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: '#ea580c' },

  messageBox: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
    padding: 10, marginBottom: 10,
  },
  messageText: { fontSize: 12, color: '#475569', lineHeight: 18, flex: 1 },

  buyerActions: { flexDirection: 'row', gap: 8 },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#111', borderRadius: 10, paddingVertical: 10,
  },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Empty ──
  emptyBox:      { alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 52, marginTop: 12 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptySub:      { fontSize: 12, color: '#64748b', marginTop: 6, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
});