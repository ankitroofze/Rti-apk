import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

const money = (val) => {
  if (!val) return '₹0';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const getEnquiryQuantity = (e = {}) => e.quantity || e.requested_quantity || e.product_quantity || 'N/A';
const getEnquiryDate = (e = {}) => {
  const raw = e.created_at || e.createdAt || e.date;
  if (!raw) return 'Unknown';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const getBuyerName    = (e = {}) => e.name || e.buyer_name || [e.buyer_first_name, e.buyer_last_name].filter(Boolean).join(' ') || 'N/A';
const getBuyerEmail   = (e = {}) => e.email || e.buyer_contact_email || e.buyer_email || 'N/A';
const getBuyerContact = (e = {}) => e.contact || e.buyer_mobile || 'N/A';

const notify = (title, msg) => {
  if (IS_WEB) { alert(`${title}\n${msg}`); } else { Alert.alert(title, msg); }
};

const STATUS_MAP = {
  replied:  { bg: '#dcfce7', text: '#15803d', icon: 'checkmark-circle',   label: 'Replied'  },
  closed:   { bg: '#f1f5f9', text: '#475569', icon: 'close-circle',       label: 'Closed'   },
  new:      { bg: '#fff7ed', text: '#ea580c', icon: 'information-circle',  label: 'New'      },
};
const getStatus = (s) => STATUS_MAP[(s || 'new').toLowerCase()] || STATUS_MAP.new;

// ─── Enquiry Detail Modal ──────────────────────────────────────────────────────
const EnquiryDetailModal = ({ visible, enquiry, product, onClose, onCall, onWhatsApp }) => {
  if (!enquiry || !product) return null;
  const st = getStatus(enquiry.status);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mStyles.backdrop} onPress={onClose}>
        <Pressable style={mStyles.sheet} onPress={() => {}}>

          {/* ── Handle bar ── */}
          <View style={mStyles.handle} />

          {/* ── Header ── */}
          <View style={mStyles.header}>
            <View style={mStyles.headerLeft}>
              <View style={mStyles.headerIcon}>
                <Ionicons name="receipt-outline" size={18} color="#ea580c" />
              </View>
              <View>
                <Text style={mStyles.title}>Enquiry Details</Text>
                <Text style={mStyles.titleSub}>{product.title || 'Product'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mStyles.body} keyboardShouldPersistTaps="handled">

            {/* ── Status banner ── */}
            <View style={[mStyles.statusBanner, { backgroundColor: st.bg }]}>
              <Ionicons name={st.icon} size={18} color={st.text} />
              <Text style={[mStyles.statusBannerText, { color: st.text }]}>Status: {st.label}</Text>
            </View>

            {/* ── Product card ── */}
            <View style={mStyles.card}>
              <View style={mStyles.cardHeader}>
                <View style={mStyles.cardIconWrap}>
                  <Ionicons name="cube-outline" size={16} color="#ea580c" />
                </View>
                <Text style={mStyles.cardTitle}>Product</Text>
              </View>
              <Row label="Name"     value={product.title}    />
              <Row label="Price"    value={money(product.price)} highlight />
              <Row label="Location" value={product.city}     />
            </View>

            {/* ── Buyer card ── */}
            <View style={mStyles.card}>
              <View style={mStyles.cardHeader}>
                <View style={[mStyles.cardIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="person-outline" size={16} color="#2563eb" />
                </View>
                <Text style={mStyles.cardTitle}>Your Enquiry</Text>
              </View>
              <Row label="Name"      value={getBuyerName(enquiry)}    />
              <Row label="Email"     value={getBuyerEmail(enquiry)}   />
              <Row label="Contact"   value={getBuyerContact(enquiry)} />
              <Row label="Quantity"  value={getEnquiryQuantity(enquiry)} />
              {enquiry.message && <Row label="Message" value={enquiry.message} multiline />}
              <Row label="Submitted" value={getEnquiryDate(enquiry)}  />
            </View>

            {/* ── Seller card ── */}
            <View style={mStyles.card}>
              <View style={mStyles.cardHeader}>
                <View style={[mStyles.cardIconWrap, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="storefront-outline" size={16} color="#16a34a" />
                </View>
                <Text style={mStyles.cardTitle}>Seller Contact</Text>
              </View>
              <Row label="Email" value={product.createdBy} />
              <Row label="Phone" value={product.contact}   />
            </View>

            </ScrollView>

            {/* ── Action buttons ── */}
            <View style={mStyles.actions}>
              <TouchableOpacity style={mStyles.callBtn} onPress={() => onCall(product.contact)} activeOpacity={0.85}>
                <Ionicons name="call" size={17} color="#fff" />
                <Text style={mStyles.actionBtnText}>Call Seller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mStyles.waBtn} onPress={() => onWhatsApp(product.contact, product)} activeOpacity={0.85}>
                <Ionicons name="logo-whatsapp" size={17} color="#fff" />
                <Text style={mStyles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const Row = ({ label, value, highlight, multiline }) => (
  <View style={[mStyles.row, multiline && { alignItems: 'flex-start' }]}>
    <Text style={mStyles.rowLabel}>{label}</Text>
    <Text
      style={[mStyles.rowValue, highlight && mStyles.rowValueHighlight, multiline && mStyles.rowValueMulti]}
      numberOfLines={multiline ? 0 : 2}
    >
      {value || 'N/A'}
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MyEnquiriesScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width: winWidth } = useWindowDimensions();
  const isTablet = !IS_WEB && winWidth >= 768;
  const insets = useSafeAreaInsets();
  const [loading, setLoading]           = useState(true);
  const [enquiries, setEnquiries]       = useState([]);
  const [selectedEnquiry, setSelected]  = useState(null);
  const [selectedProduct, setProduct]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) { notify('Not Logged In', 'Please login.'); setLoading(false); return; }
      const summary = await UserStore.getEcomeMarketplaceSummary();
      if (!summary) { setLoading(false); return; }
      const userEmail = String(currentUser.email || '').trim().toLowerCase();
      const listings  = Array.isArray(summary.listings) ? summary.listings : [];
      const enriched  = (Array.isArray(summary.enquiries) ? summary.enquiries : [])
        .filter((eq) => String(eq.buyer_email || '').trim().toLowerCase() === userEmail)
        .map((eq) => ({ ...eq, product: listings.find((l) => String(l.id) === String(eq.product_id)) }));
      setEnquiries(enriched);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleCall = (contact) => {
    const phone = String(contact || '').replace(/\D/g, '');
    if (!phone) { notify('No Contact', 'No phone number available.'); return; }
    const url = `tel:+91${phone}`;
    IS_WEB ? window.open(url) : Linking.openURL(url);
  };

  const handleWhatsApp = (contact, product) => {
    const phone = String(contact || '').replace(/\D/g, '');
    if (!phone) { notify('No Contact', 'No phone number available.'); return; }
    const msg = encodeURIComponent(`Hi, I am interested in: ${product.title}\nPrice: ${money(product.price)}`);
    const url = `https://wa.me/91${phone}?text=${msg}`;
    IS_WEB ? window.open(url, '_blank') : Linking.openURL(url);
  };

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

  const newCount     = enquiries.filter((e) => (e.status || 'new').toLowerCase() === 'new').length;
  const repliedCount = enquiries.filter((e) => (e.status || '').toLowerCase() === 'replied').length;

  return (
    <SafeAreaView style={styles.root}>
      <View style={{ height: IS_WEB ? 0 : insets.top, backgroundColor: '#ffffff' }} />

      {/* ── Topbar — matches AdvertiseScreen header style ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, fontsLoaded && { fontFamily: FONT.bold }]}>My Enquiries</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color="#ea580c" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 32 },
          isTablet && { maxWidth: 720, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* ── Page title (web) ── */}
        {IS_WEB && (
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, fontsLoaded && { fontFamily: FONT.bold }]}>My Enquiries</Text>
            <Text style={styles.pageSub}>{enquiries.length} total enquiries</Text>
          </View>
        )}

        {/* ── Stat row ── */}
        {enquiries.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statVal}>{enquiries.length}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#fed7aa' }]}>
              <Text style={[styles.statLabel, { color: '#9a3412' }]}>New</Text>
              <Text style={[styles.statVal, { color: '#ea580c' }]}>{newCount}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#bbf7d0' }]}>
              <Text style={[styles.statLabel, { color: '#166534' }]}>Replied</Text>
              <Text style={[styles.statVal, { color: '#16a34a' }]}>{repliedCount}</Text>
            </View>
          </View>
        )}

        {enquiries.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={32} color="#fed7aa" />
            </View>
            <Text style={[styles.emptyTitle, { fontFamily: FONT.bold }]}>No enquiries yet</Text>
            <Text style={styles.emptySub}>Your submitted enquiries will appear here</Text>
          </View>
        ) : (
          enquiries.map((enquiry, idx) => {
            const st = getStatus(enquiry.status);
            return (
              <TouchableOpacity
                key={idx}
                style={styles.card}
                onPress={() => { setSelected(enquiry); setProduct(enquiry.product); }}
                activeOpacity={0.85}
              >
                {/* left accent */}
                <View style={[styles.cardAccent, { backgroundColor: st.text }]} />

                <View style={styles.cardInner}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardProductName, { fontFamily: FONT.bold }]} numberOfLines={1}>
                        {enquiry.product?.title || 'Unknown Product'}
                      </Text>
                      <View style={styles.cardLocation}>
                        <Ionicons name="location-outline" size={11} color="#94a3b8" />
                        <Text style={styles.cardLocationText}>
                          {enquiry.product?.city || 'Unknown location'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusPillText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>

                  {/* Bottom row */}
                  <View style={styles.cardBottom}>
                    <View style={styles.cardChips}>
                      <View style={styles.priceChip}>
                        <Ionicons name="cash-outline" size={12} color="#ea580c" />
                        <Text style={styles.priceChipText}>{money(enquiry.product?.price)}</Text>
                      </View>
                      <View style={styles.qtyChip}>
                        <Ionicons name="layers-outline" size={12} color="#64748b" />
                        <Text style={styles.qtyChipText}>Qty: {getEnquiryQuantity(enquiry)}</Text>
                      </View>
                    </View>
                    <View style={styles.viewBtn}>
                      <Text style={styles.viewBtnText}>View</Text>
                      <Ionicons name="chevron-forward" size={13} color="#ea580c" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <EnquiryDetailModal
        visible={Boolean(selectedEnquiry && selectedProduct)}
        enquiry={selectedEnquiry}
        product={selectedProduct}
        onClose={() => { setSelected(null); setProduct(null); }}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
      />
    </SafeAreaView>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IS_WEB ? '#fff' : '#f8fafc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginLeft: -6 },
  backLabel:  { fontSize: 13, color: '#ea580c', fontWeight: '500' },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    color: '#353535',
  },
  refreshBtn: { padding: 6 },

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

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 16 },
  statBox:  {
    flex: 1, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  statLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' },
  statVal:   { fontSize: 22, fontWeight: '600', color: '#0f172a', marginTop: 4 },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardAccent: { width: 3, backgroundColor: '#ea580c' },
  cardInner:  { flex: 1, padding: 14 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  cardProductName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  cardLocation:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  cardLocationText:{ fontSize: 11, color: '#94a3b8' },
  statusPill:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText:  { fontSize: 10, fontWeight: '600' },
  cardBottom:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  cardChips:       { flexDirection: 'row', gap: 8 },
  priceChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#fed7aa' },
  priceChipText:   { fontSize: 11, fontWeight: '600', color: '#ea580c' },
  qtyChip:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#e2e8f0' },
  qtyChipText:     { fontSize: 11, fontWeight: '600', color: '#64748b' },
  viewBtn:         { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText:     { fontSize: 12, fontWeight: '600', color: '#ea580c' },

  // Empty
  emptyBox:      { alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 52, marginTop: 12 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptySub:      { fontSize: 12, color: '#64748b', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: IS_WEB ? 'center' : 'flex-end',
    alignItems: IS_WEB ? 'center' : 'stretch',
    padding: IS_WEB ? 24 : 0,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: IS_WEB ? 20 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: IS_WEB ? '85%' : '92%',
    width: IS_WEB ? '100%' : undefined,
    maxWidth: IS_WEB ? 520 : undefined,
    paddingBottom: 0,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  titleSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 16, paddingBottom: 80, gap: 12 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  statusBannerText: { fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#fff7ed',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 12,
  },
  rowLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500', minWidth: 70 },
  rowValue: { fontSize: 12, color: '#0f172a', fontWeight: '600', flex: 1, textAlign: 'right' },
  rowValueHighlight: { color: '#ea580c', fontSize: 13 },
  rowValueMulti: { textAlign: 'left', lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 8, paddingHorizontal: 16, paddingBottom: 24 },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: '#111', borderRadius: 12, paddingVertical: 13,
  },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 13,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});