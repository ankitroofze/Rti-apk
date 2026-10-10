// pages/MyEnquiriesScreen.js
// ═══════════════════════════════════════════════════════════════════════════
//  Ecom Enquiries — 2 tabs
//    • Received : mere ecom/products par aayi enquiries   (GET /ecom-enquiries/received, cursor pagination)
//    • Sent     : maine jo enquiries bheji                (GET /ecom-enquiries)
//  Route params (optional): { tab: 'received' | 'sent', ecomId: 3 }
// ═══════════════════════════════════════════════════════════════════════════
import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

const IS_WEB = Platform.OS === 'web';
const FONT = { regular: 'Roboto_400Regular', medium: 'Roboto_500Medium', bold: 'Roboto_700Bold', black: 'Roboto_900Black' };
const ORANGE = '#b91c1c';

// ─── helpers ──────────────────────────────────────────────────────────────────
const notify = (title, msg) => (IS_WEB ? alert(`${title}\n${msg}`) : Alert.alert(title, msg));

const money = (val) => {
  const n = Number(val);
  if (!val || isNaN(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
};

const fmtDate = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const toPhone = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `91${digits}` : digits;
};

const ecomOf = (e = {}) => e.ecom || {};
const ecomName = (e = {}) => ecomOf(e).product_name || e.product_name || 'Ecom';
const ecomImage = (e = {}) => ecomOf(e).image || ecomOf(e).images?.[0] || e.product_images?.[0] || null;
const ecomImages = (e = {}) => {
  const list = [ecomOf(e).image, ...(ecomOf(e).images || []), ...(e.product_images || [])].filter(Boolean);
  return Array.from(new Set(list));
};
// backend field ka spelling "conatct" hai (typo) — dono check karte hain
const sellerContact = (e = {}) => ecomOf(e).conatct || ecomOf(e).contact || '';
const isRemoved = (e = {}) => ecomOf(e).is_deleted === 0 || ecomOf(e).is_deleted === '0';
const enquirerName = (e = {}) =>
  e.enquirer?.name || [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Unknown';
const initialsOf = (name) =>
  String(name || '?').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

// ⚠️ status 1/2 ka exact matlab backend se confirm karke labels badal lena
const STATUS_MAP = {
  1: { bg: '#FEF2F2', text: '#b91c1c', icon: 'information-circle', label: 'Open' },
  2: { bg: '#f1f5f9', text: '#475569', icon: 'checkmark-done-circle', label: 'Closed' },
};
const getStatus = (s) => STATUS_MAP[Number(s)] || STATUS_MAP[1];

// ─── small UI pieces ──────────────────────────────────────────────────────────
const Thumb = ({ uri, size = 64, radius = 12 }) =>
  uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#f1f5f9' }} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="image-outline" size={size * 0.38} color="#FCA5A5" />
    </View>
  );

const Avatar = ({ person, size = 34 }) => {
  const uri = person?.profile_image_url;
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f1f5f9' }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, color: ORANGE, fontFamily: FONT.bold }}>{initialsOf(person?.name)}</Text>
    </View>
  );
};

const Chip = ({ icon, text, tint = '#64748b', bg = '#f8fafc', border = '#e2e8f0' }) => (
  <View style={[s.chip, { backgroundColor: bg, borderColor: border }]}>
    <Ionicons name={icon} size={12} color={tint} />
    <Text style={[s.chipText, { color: tint }]} numberOfLines={1}>{text}</Text>
  </View>
);

const Row = ({ label, value, highlight, multiline }) => (
  <View style={[m.row, multiline && { alignItems: 'flex-start' }]}>
    <Text style={m.rowLabel}>{label}</Text>
    <Text style={[m.rowValue, highlight && { color: ORANGE, fontFamily: FONT.bold }]} numberOfLines={multiline ? 0 : 2}>
      {value || '—'}
    </Text>
  </View>
);

const Segment = ({ tab, setTab, receivedCount, sentCount }) => (
  <View style={s.segmentWrap}>
    {[
      { key: 'received', label: 'Received', icon: 'download-outline', count: receivedCount },
      { key: 'sent', label: 'Sent', icon: 'paper-plane-outline', count: sentCount },
    ].map((t) => {
      const active = tab === t.key;
      return (
        <TouchableOpacity key={t.key} style={[s.segBtn, active && s.segBtnActive]} onPress={() => setTab(t.key)} activeOpacity={0.85}>
          <Ionicons name={t.icon} size={15} color={active ? '#fff' : '#64748b'} />
          <Text style={[s.segText, active && { color: '#fff' }]}>{t.label}</Text>
          <View style={[s.segCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={[s.segCountText, active && { color: '#fff' }]}>{t.count}</Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Enquiry card ─────────────────────────────────────────────────────────────
const EnquiryCard = ({ item, mode, onOpen, onCall, onWhatsApp }) => {
  const st = getStatus(item.status);
  const isReceived = mode === 'received';
  const ecom = ecomOf(item);
  const phone = isReceived ? item.contact : sellerContact(item);

  return (
    <TouchableOpacity style={s.card} onPress={() => onOpen(item)} activeOpacity={0.88}>
      <View style={[s.cardAccent, { backgroundColor: st.text }]} />
      <View style={s.cardInner}>
        {/* ecom row */}
        <View style={s.cardTop}>
          <Thumb uri={ecomImage(item)} />
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={s.cardTitle} numberOfLines={1}>{ecomName(item)}</Text>
              <View style={[s.pill, { backgroundColor: st.bg }]}>
                <Text style={[s.pillText, { color: st.text }]}>{st.label}</Text>
              </View>
            </View>
            <View style={s.metaRow}>
              <Ionicons name="location-outline" size={11} color="#94a3b8" />
              <Text style={s.metaText} numberOfLines={1}>{ecom.city || 'Location N/A'}</Text>
              {ecom.category ? <Text style={s.metaText}>  •  {ecom.category}</Text> : null}
            </View>
            <View style={s.badgeRow}>
              <Text style={s.price}>{money(ecom.price)}</Text>
              {isRemoved(item) && (
                <View style={[s.miniBadge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                  <Text style={[s.miniBadgeText, { color: '#dc2626' }]}>Ecom removed</Text>
                </View>
              )}
              {item.type === 'ads' && (
                <View style={[s.miniBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Text style={[s.miniBadgeText, { color: '#2563eb' }]}>Ad</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* enquirer (received) */}
        {isReceived && (
          <View style={s.personRow}>
            <Avatar person={item.enquirer || { name: enquirerName(item) }} />
            <View style={{ flex: 1 }}>
              <Text style={s.personName} numberOfLines={1}>{enquirerName(item)}</Text>
              <Text style={s.personSub} numberOfLines={1}>{item.email || item.contact || '—'}</Text>
            </View>
          </View>
        )}

        {/* message */}
        {item.message ? (
          <View style={s.msgBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color="#94a3b8" style={{ marginTop: 1 }} />
            <Text style={s.msgText} numberOfLines={3}>{item.message}</Text>
          </View>
        ) : null}

        {/* chips */}
        <View style={s.chipsRow}>
          <Chip icon="layers-outline" text={`Qty: ${item.qty || '—'}`} tint={ORANGE} bg="#FEF2F2" border="#FECACA" />
          <Chip icon="calendar-outline" text={fmtDate(item.created_at)} />
        </View>

        {/* actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actBtn, { backgroundColor: '#0f172a' }]} onPress={() => onCall(phone)} activeOpacity={0.85}>
            <Ionicons name="call" size={14} color="#fff" />
            <Text style={s.actText}>{isReceived ? 'Call' : 'Call Seller'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actBtn, { backgroundColor: '#16a34a' }]} onPress={() => onWhatsApp(phone, item)} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={14} color="#fff" />
            <Text style={s.actText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.viewBtn} onPress={() => onOpen(item)} activeOpacity={0.8}>
            <Text style={s.viewBtnText}>Details</Text>
            <Ionicons name="chevron-forward" size={13} color={ORANGE} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Detail modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ visible, item, mode, onClose, onCall, onWhatsApp, onEmail }) => {
  const { width: winW } = useWindowDimensions();
  // Wide screens: 2-column layout so everything fits without any scrolling.
  const wide = IS_WEB && winW >= 760;
  if (!item) return null;
  const st = getStatus(item.status);
  const ecom = ecomOf(item);
  const isReceived = mode === 'received';
  const images = ecomImages(item);
  const phone = isReceived ? item.contact : sellerContact(item);

  return (
    <Modal visible={visible} transparent animationType={IS_WEB ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={[m.sheet, wide && m.sheetWide]} onPress={() => {}}>
          {!wide && <View style={m.handle} />}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.title}>Enquiry #{item.id}</Text>
              <Text style={m.titleSub} numberOfLines={1}>{ecomName(item)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {(() => {
            const statusEl = (
              <View style={[m.statusBanner, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon} size={18} color={st.text} />
                <Text style={[m.statusText, { color: st.text }]}>Status: {st.label}</Text>
                {isRemoved(item) && <Text style={[m.statusText, { color: '#dc2626', marginLeft: 'auto' }]}>Ecom removed</Text>}
              </View>
            );
            const imagesEl = images.length > 0 ? (
              wide ? (
                <View style={m.galleryRow}>
                  {images.slice(0, 3).map((uri) => (
                    <Image key={uri} source={{ uri }} style={m.galleryWide} resizeMode="cover" />
                  ))}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {images.map((uri) => (
                    <Image key={uri} source={{ uri }} style={m.gallery} />
                  ))}
                </ScrollView>
              )
            ) : null;
            const ecomCard = (
              <View style={m.card}>
                <Text style={m.cardTitle}>Ecom / Product</Text>
                <Row label="Name" value={ecomName(item)} />
                <Row label="Category" value={ecom.category} />
                <Row label="Price" value={money(ecom.price)} highlight />
                <Row label="Available" value={ecom.quantity != null ? String(ecom.quantity) : ''} />
                <Row label="City" value={ecom.city} />
                {ecom.description ? <Row label="About" value={ecom.description} multiline /> : null}
              </View>
            );
            const senderCard = (
              <View style={m.card}>
                <Text style={m.cardTitle}>{isReceived ? 'Enquiry sender' : 'Your enquiry'}</Text>
                <Row label="Name" value={enquirerName(item)} />
                <Row label="Email" value={item.email} />
                <Row label="Contact" value={item.contact} />
                <Row label="Quantity" value={item.qty} />
                {item.message ? <Row label="Message" value={item.message} multiline /> : null}
                <Row label="Date" value={fmtDate(item.created_at)} />
              </View>
            );
            const sellerCard = !isReceived ? (
              <View style={m.card}>
                <Text style={m.cardTitle}>Seller contact</Text>
                <Row label="Phone" value={sellerContact(item)} />
              </View>
            ) : null;

            if (wide) {
              // No scroll: left = status + images + product, right = enquiry + seller
              return (
                <View style={m.bodyWide}>
                  <View style={m.colWide}>{statusEl}{imagesEl}{ecomCard}</View>
                  <View style={m.colWide}>{senderCard}{sellerCard}</View>
                </View>
              );
            }
            return (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.body}>
                {statusEl}{imagesEl}{ecomCard}{senderCard}{sellerCard}
              </ScrollView>
            );
          })()}

          <View style={m.actions}>
            <TouchableOpacity style={[m.actBtn, { backgroundColor: '#0f172a' }]} onPress={() => onCall(phone)} activeOpacity={0.85}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={m.actText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.actBtn, { backgroundColor: '#16a34a' }]} onPress={() => onWhatsApp(phone, item)} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={m.actText}>WhatsApp</Text>
            </TouchableOpacity>
            {isReceived && item.email ? (
              <TouchableOpacity style={[m.actBtn, { backgroundColor: ORANGE }]} onPress={() => onEmail(item.email, item)} activeOpacity={0.85}>
                <Ionicons name="mail" size={16} color="#fff" />
                <Text style={m.actText}>Email</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MyEnquiriesScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width: winWidth } = useWindowDimensions();
  const isTablet = !IS_WEB && winWidth >= 768;
  const insets = useSafeAreaInsets();

  const ecomId = route?.params?.ecomId || null;
  const [tab, setTab] = useState(route?.params?.tab === 'sent' ? 'sent' : 'received');

  // Received (cursor pagination)
  const [received, setReceived] = useState([]);
  const [recvLoading, setRecvLoading] = useState(true);
  const [recvMore, setRecvMore] = useState(false);
  const [recvError, setRecvError] = useState('');
  const recvCursor = useRef(null);
  const recvHasMore = useRef(false);
  const recvBusy = useRef(false);

  // Sent
  const [sent, setSent] = useState([]);
  const [sentLoading, setSentLoading] = useState(true);
  const [sentError, setSentError] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadReceived = useCallback(async (reset = false) => {
    if (recvBusy.current) return;
    if (!reset && !recvHasMore.current) return;
    recvBusy.current = true;
    reset ? setRecvLoading(true) : setRecvMore(true);
    try {
      const res = await AuthAPI.getReceivedEcomEnquiries({ cursor: reset ? null : recvCursor.current, ecomId });
      if (!res.ok) {
        setRecvError(res.message || 'Failed to load enquiries.');
        if (res.isAuth) notify('Session expired', 'Please login again.');
      } else {
        setRecvError('');
        recvCursor.current = res.nextCursor || null;
        recvHasMore.current = Boolean(res.hasMore && res.nextCursor);
        setReceived((prev) => (reset ? res.enquiries : [...prev, ...res.enquiries]));
      }
    } catch (e) {
      setRecvError('Something went wrong.');
    }
    recvBusy.current = false;
    setRecvLoading(false);
    setRecvMore(false);
  }, [ecomId]);

  const loadSent = useCallback(async () => {
    setSentLoading(true);
    try {
      const res = await AuthAPI.getEcomEnquiries();
      if (!res.ok) {
        setSentError(res.message || 'Failed to load enquiries.');
        if (res.isAuth) notify('Session expired', 'Please login again.');
      } else {
        setSentError('');
        setSent(Array.isArray(res.enquiries) ? res.enquiries : []);
      }
    } catch (e) {
      setSentError('Something went wrong.');
    }
    setSentLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadReceived(true);
    loadSent();
  }, [loadReceived, loadSent]));

  const onRefresh = async () => {
    setRefreshing(true);
    await (tab === 'received' ? loadReceived(true) : loadSent());
    setRefreshing(false);
  };

  const handleCall = (contact) => {
    const phone = toPhone(contact);
    if (!phone) return notify('No Contact', 'Phone number is not available.');
    const url = `tel:+${phone}`;
    IS_WEB ? window.open(url) : Linking.openURL(url);
  };

  const handleWhatsApp = (contact, item) => {
    const phone = toPhone(contact);
    if (!phone) return notify('No Contact', 'Phone number is not available.');
    const text = tab === 'received'
      ? `Hi ${enquirerName(item)}, regarding your enquiry about: ${ecomName(item)}`
      : `Hi, I have sent an enquiry for this product: ${ecomName(item)}\nPrice: ${money(ecomOf(item).price)}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    IS_WEB ? window.open(url, '_blank') : Linking.openURL(url);
  };

  const handleEmail = (email, item) => {
    const url = `mailto:${email}?subject=${encodeURIComponent(`Re: ${ecomName(item)}`)}`;
    IS_WEB ? window.open(url) : Linking.openURL(url);
  };

  const isReceived = tab === 'received';
  const data = isReceived ? received : sent;
  const loading = isReceived ? recvLoading : sentLoading;
  const error = isReceived ? recvError : sentError;

  // Red (profile-red) header — web, Android aur iOS teeno me same
  const refreshButton = (
    <TouchableOpacity onPress={onRefresh} activeOpacity={0.8} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="refresh-outline" size={20} color="#fff" />
    </TouchableOpacity>
  );

  const header = IS_WEB ? (
    <ModuleWebHeader
      title="Enquiries"
      navigation={navigation}
      onBack={() => navigation?.goBack?.()}
      rightExtra={refreshButton}
    />
  ) : (
    <ModuleMobileHeader
      title="Enquiries"
      navigation={navigation}
      onBack={() => navigation?.goBack?.()}
      rightExtra={refreshButton}
    />
  );

  const listHeader = (
    <View>
      {IS_WEB && (
        <View style={s.pageHeader}>
          <Text style={[s.pageTitle, fontsLoaded && { fontFamily: FONT.bold }]}>Enquiries</Text>
          <Text style={s.pageSub}>Received and Sent — all in one place</Text>
        </View>
      )}
      <Segment tab={tab} setTab={setTab} receivedCount={received.length} sentCount={sent.length} />
      {ecomId && isReceived ? (
        <View style={s.filterBanner}>
          <Ionicons name="funnel-outline" size={13} color={ORANGE} />
          <Text style={s.filterText}>Showing enquiries for one product only</Text>
        </View>
      ) : null}
    </View>
  );

  const emptyView = loading ? (
    <View style={s.centerBox}>
      <ActivityIndicator size="large" color={ORANGE} />
      <Text style={s.centerText}>Loading enquiries...</Text>
    </View>
  ) : error ? (
    <View style={s.emptyBox}>
      <View style={[s.emptyIconWrap, { backgroundColor: '#fef2f2' }]}>
        <Ionicons name="cloud-offline-outline" size={30} color="#f87171" />
      </View>
      <Text style={s.emptyTitle}>Could not load</Text>
      <Text style={s.emptySub}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => (isReceived ? loadReceived(true) : loadSent())} activeOpacity={0.85}>
        <Text style={s.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={s.emptyBox}>
      <View style={s.emptyIconWrap}>
        <Ionicons name={isReceived ? 'mail-open-outline' : 'paper-plane-outline'} size={30} color="#FCA5A5" />
      </View>
      <Text style={s.emptyTitle}>{isReceived ? 'No enquiries received yet' : 'You have not sent any enquiries yet'}</Text>
      <Text style={s.emptySub}>
        {isReceived ? 'When someone enquires about your product, it will appear here.' : 'Enquiries you send on a product will appear here.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      {header}
      <FlatList
        data={data}
        keyExtractor={(it) => `${tab}-${it.id}`}
        renderItem={({ item }) => (
          <EnquiryCard item={item} mode={tab} onOpen={setSelected} onCall={handleCall} onWhatsApp={handleWhatsApp} />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyView}
        ListFooterComponent={recvMore && isReceived ? <ActivityIndicator style={{ marginVertical: 18 }} color={ORANGE} /> : null}
        onEndReached={() => { if (isReceived) loadReceived(false); }}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ORANGE]} tintColor={ORANGE} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.container,
          { paddingBottom: insets.bottom + 32 },
          isTablet && { maxWidth: 720, alignSelf: 'center', width: '100%' },
        ]}
      />
      <DetailModal
        visible={Boolean(selected)}
        item={selected}
        mode={tab}
        onClose={() => setSelected(null)}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
        onEmail={handleEmail}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: IS_WEB ? '#fff' : '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E6E6E6' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginLeft: -6 },
  headerTitle: { flex: 1, fontSize: 15, color: '#353535' , fontFamily: FONT.regular },
  refreshBtn: { padding: 6 },

  container: { paddingHorizontal: IS_WEB ? 32 : 14, paddingTop: 4, maxWidth: IS_WEB ? 760 : undefined, width: '100%', alignSelf: 'center' },
  pageHeader: { paddingTop: 24, paddingBottom: 4 },
  pageTitle: { fontSize: 26, fontWeight: '600', color: '#0f172a', letterSpacing: -0.4 , fontFamily: FONT.medium },
  pageSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 , fontFamily: FONT.regular },

  segmentWrap: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 14, padding: 4, marginTop: 14, marginBottom: 14, gap: 4 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 11 },
  segBtnActive: { backgroundColor: ORANGE, shadowColor: ORANGE, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  segText: { fontSize: 13, color: '#64748b', fontFamily: FONT.bold, fontWeight: '600' },
  segCount: { minWidth: 20, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  segCountText: { fontSize: 10, color: '#475569', fontWeight: '700' , fontFamily: FONT.bold },

  filterBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  filterText: { fontSize: 12, color: '#991B1B' , fontFamily: FONT.regular },

  card: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a', fontFamily: FONT.bold },
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: '700' , fontFamily: FONT.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  metaText: { fontSize: 11, color: '#94a3b8' , fontFamily: FONT.regular },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  price: { fontSize: 15, color: ORANGE, fontWeight: '700', fontFamily: FONT.bold },
  miniBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  miniBadgeText: { fontSize: 10, fontWeight: '700' , fontFamily: FONT.bold },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  personName: { fontSize: 13, fontWeight: '600', color: '#0f172a', fontFamily: FONT.medium },
  personSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 , fontFamily: FONT.regular },

  msgBox: { flexDirection: 'row', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, marginTop: 12 },
  msgText: { flex: 1, fontSize: 12.5, color: '#475569', lineHeight: 18 , fontFamily: FONT.regular },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '600' , fontFamily: FONT.medium },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actText: { color: '#fff', fontSize: 12, fontWeight: '700' , fontFamily: FONT.bold },
  viewBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: ORANGE , fontFamily: FONT.medium },

  centerBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  centerText: { fontSize: 13, color: '#94a3b8' , fontFamily: FONT.regular },
  emptyBox: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 48, marginTop: 4 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', fontFamily: FONT.bold, textAlign: 'center', paddingHorizontal: 24 },
  emptySub: { fontSize: 12, color: '#64748b', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 , fontFamily: FONT.regular },
  retryBtn: { marginTop: 16, backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 9 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 , fontFamily: FONT.bold },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' : 'stretch', padding: IS_WEB ? 24 : 0 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: IS_WEB ? 24 : 0, borderBottomRightRadius: IS_WEB ? 24 : 0, maxHeight: '90%', width: IS_WEB ? 520 : '100%', paddingBottom: IS_WEB ? 0 : 12 },
  sheetWide: { width: 860, maxHeight: '94%', overflow: 'hidden' },
  bodyWide: { flexDirection: 'row', gap: 14, padding: 16, paddingBottom: 4, alignItems: 'flex-start' },
  colWide: { flex: 1 },
  galleryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  galleryWide: { flex: 1, height: 96, borderRadius: 12, backgroundColor: '#f1f5f9' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', fontFamily: FONT.bold },
  titleSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 , fontFamily: FONT.regular },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingBottom: 8 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  statusText: { fontSize: 13, fontWeight: '700' , fontFamily: FONT.bold },
  gallery: { width: 150, height: 110, borderRadius: 12, marginRight: 10, backgroundColor: '#f1f5f9' },
  card: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eef2f7' },
  cardTitle: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700', marginBottom: 8 , fontFamily: FONT.bold },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, gap: 16 },
  rowLabel: { fontSize: 12.5, color: '#64748b' , fontFamily: FONT.regular },
  rowValue: { flex: 1, fontSize: 13, color: '#0f172a', textAlign: 'right', fontFamily: FONT.medium },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 12 },
  actText: { color: '#fff', fontWeight: '700', fontSize: 13 , fontFamily: FONT.bold },
});