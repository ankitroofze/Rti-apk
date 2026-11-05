// pages/EPaperScreen.js
// ═══════════════════════════════════════════════════════════════════════════
//  Newspapers — User side (backend driven)
//    GET /api/newspapers                 -> list  (backend khud: last 1 month + active + published)
//    GET /api/newspapers?date=YYYY-MM-DD -> date-wise
//    GET /api/newspapers/{id}            -> complete details (newspaper card click par)
//
//  Rules:
//    • Sirf backend se aaye newspapers dikhte hain — frontend par koi extra filtering NAHI
//      (na 30-day, na status/active/published/deleted). Backend pehle se filter karta hai.
//    • Cover  = `thumbnail`
//    • PDF open / download = `pdf_url`
//  (Purana local reporter/newspaper-builder screen: pages/EPaperLegacyScreen.js)
// ═══════════════════════════════════════════════════════════════════════════
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Linking, Modal, Platform, Pressable, RefreshControl,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';
import { smartGoBack } from '../utils/smartBack';

const IS_WEB = Platform.OS === 'web';
const RED = '#b91c1c';

// ─── helpers (sirf display ke liye — kisi newspaper ko hide NAHI karte) ───────
const titleOf = (n = {}) => n.title || n.name || n.newspaper_name || `Newspaper #${n.id}`;
// Backend kabhi full URL deta hai, kabhi sirf relative path (e.g. "newspapers/thumbs/a.jpg").
// Relative path ko storage URL bana do, warna thumbnail / PDF load nahi hote.
const FILE_ORIGIN = (() => {
  try { return new URL(process.env.EXPO_PUBLIC_API_URL || 'https://rtiapi.roofze.in/api').origin; }
  catch { return 'https://rtiapi.roofze.in'; }
})();
const toFileUrl = (value) => {
  const v = String(value || '').trim();
  if (!v) return null;
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:') || v.startsWith('blob:')) return v;
  if (v.startsWith('/')) return `${FILE_ORIGIN}${v}`;
  return `${FILE_ORIGIN}/storage/${v}`;
};
const thumbOf = (n = {}) => toFileUrl(n.thumbnail_url || n.thumbnail);              // cover = thumbnail (full URL pehle)
const pdfOf = (n = {}) => toFileUrl(n.pdf_url || n.pdf);                           // PDF = pdf_url (full URL pehle)
const dateOf = (n = {}) => n.date || n.publish_date || n.published_date || n.newspaper_date || n.published_at || n.created_at || '';
const fmtDate = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return String(raw);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const isValidDateInput = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v));
const todayStr = () => new Date().toISOString().slice(0, 10);

const openUrl = (url) => {
  if (!url) return;
  if (IS_WEB) window.open(url, '_blank', 'noopener');
  else Linking.openURL(url).catch(() => {});
};
const downloadPdf = (url, name) => {
  if (!url) return;
  if (IS_WEB) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${String(name || 'newspaper').replace(/[^\w\-]+/g, '_')}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    Linking.openURL(url).catch(() => {});
  }
};

// ─── Newspaper card ───────────────────────────────────────────────────────────
const NewspaperCard = ({ item, width, onPress }) => {
  const thumb = thumbOf(item);
  return (
    <TouchableOpacity style={[s.card, { width }]} activeOpacity={0.88} onPress={() => onPress(item)}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={s.cover} resizeMode="cover" />
      ) : (
        <View style={[s.cover, s.coverEmpty]}>
          <Ionicons name="newspaper-outline" size={34} color="#FCA5A5" />
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{titleOf(item)}</Text>
        {dateOf(item) ? (
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
            <Text style={s.metaText}>{fmtDate(dateOf(item))}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// ─── Detail modal (GET /newspapers/{id}) ──────────────────────────────────────
const DetailModal = ({ visible, preview, detail, loading, error, onClose, onRetry }) => {
  if (!visible) return null;
  const n = detail || preview || {};
  const thumb = thumbOf(n);
  const pdf = pdfOf(n);
  return (
    <Modal visible transparent animationType={IS_WEB ? 'fade' : 'slide'} onRequestClose={onClose}>
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={m.sheet} onPress={() => {}}>
          <View style={m.header}>
            <Text style={m.title} numberOfLines={2}>{titleOf(n)}</Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {thumb ? <Image source={{ uri: thumb }} style={m.cover} resizeMode="contain" /> : null}

            {loading ? (
              <View style={{ paddingVertical: 18 }}><ActivityIndicator color={RED} /></View>
            ) : error ? (
              <View style={m.errBox}>
                <Text style={m.errText}>{error}</Text>
                <TouchableOpacity onPress={onRetry} style={m.retryBtn}><Text style={m.retryText}>Retry</Text></TouchableOpacity>
              </View>
            ) : null}

            {dateOf(n) ? <Text style={m.date}>{fmtDate(dateOf(n))}</Text> : null}
            {n.description ? <Text style={m.desc}>{n.description}</Text> : null}
          </ScrollView>

          <View style={m.actions}>
            <TouchableOpacity
              style={[m.actBtn, { backgroundColor: RED }, !pdf && m.disabled]}
              disabled={!pdf}
              onPress={() => openUrl(pdf)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={m.actText}>Open PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.actBtn, { backgroundColor: '#0f172a' }, !pdf && m.disabled]}
              disabled={!pdf}
              onPress={() => downloadPdf(pdf, titleOf(n))}
              activeOpacity={0.85}
            >
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={m.actText}>Download</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EPaperScreen({ navigation }) {
  const { width: winW } = useWindowDimensions();
  const cols = winW >= 1100 ? 4 : winW >= 800 ? 3 : 2;
  const GAP = 12;
  const PAD = 14;
  const maxW = Math.min(winW, 1200);
  const cardW = Math.floor((maxW - PAD * 2 - GAP * (cols - 1)) / cols);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [dateInput, setDateInput] = useState('');
  const [activeDate, setActiveDate] = useState('');     // applied date filter ('' = list API)
  const [dateError, setDateError] = useState('');
  const reqRef = useRef(0);

  const [selected, setSelected] = useState(null);       // list item (preview)
  const [detail, setDetail] = useState(null);           // GET /newspapers/{id}
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(async (date = '') => {
    const reqId = ++reqRef.current;
    setError('');
    try {
      // ✅ date nahi => GET /newspapers , date => GET /newspapers?date=YYYY-MM-DD
      const res = await AuthAPI.getNewspapers(date ? { date } : {});
      if (reqId !== reqRef.current) return;
      if (!res.ok) {
        setError(res.message || 'Failed to load newspapers.');
        setItems([]);
      } else {
        setItems(res.newspapers);       // ✅ jo backend de, wahi dikhao — koi extra filter nahi
      }
    } catch {
      if (reqId === reqRef.current) { setError('Something went wrong.'); setItems([]); }
    }
    if (reqId === reqRef.current) { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(activeDate); }, [load, activeDate]));

  const applyDate = () => {
    const v = dateInput.trim();
    if (!isValidDateInput(v)) { setDateError('Use date format YYYY-MM-DD'); return; }
    setDateError('');
    setActiveDate(v);                  // useFocusEffect dependency => reload
  };
  const clearDate = () => { setDateInput(''); setDateError(''); setActiveDate(''); };

  const openDetail = useCallback(async (item) => {
    setSelected(item);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    // ✅ newspaper par click => GET /newspapers/{id}
    const res = await AuthAPI.getNewspaperById(item.id);
    if (res.ok && res.newspaper) setDetail(res.newspaper);
    else setDetailError(res.message || 'Could not load newspaper details.');
    setDetailLoading(false);
  }, []);

  const closeDetail = () => { setSelected(null); setDetail(null); setDetailError(''); };

  const onRefresh = () => { setRefreshing(true); load(activeDate); };

  const header = IS_WEB ? (
    <ModuleWebHeader title="Newspapers" navigation={navigation} />
  ) : (
    <ModuleMobileHeader title="Newspapers" navigation={navigation} onBack={() => smartGoBack(navigation, 'QuickMenu')} />
  );

  const listHeader = (
    <View style={s.filterWrap}>
      <View style={s.filterRow}>
        <Ionicons name="calendar-outline" size={16} color={RED} />
        {IS_WEB ? (
          // eslint-disable-next-line react-native/no-raw-text
          React.createElement('input', {
            type: 'date',
            value: dateInput,
            max: todayStr(),
            onChange: (e) => setDateInput(e.target.value),
            style: { flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', fontSize: 14, outline: 'none', minWidth: 0 },
          })
        ) : (
          <TextInput onSubmitEditing={applyDate}
            style={s.dateInput}
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        )}
        <TouchableOpacity style={s.applyBtn} onPress={applyDate} activeOpacity={0.85}>
          <Text style={s.applyText}>Search</Text>
        </TouchableOpacity>
        {activeDate ? (
          <TouchableOpacity style={s.clearBtn} onPress={clearDate} activeOpacity={0.85}>
            <Text style={s.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {dateError ? <Text style={s.errInline}>{dateError}</Text> : null}
      {activeDate ? <Text style={s.activeInfo}>Showing newspapers for {fmtDate(activeDate)}</Text> : null}
    </View>
  );

  const emptyView = loading ? (
    <View style={s.center}><ActivityIndicator size="large" color={RED} /><Text style={s.centerText}>Loading newspapers...</Text></View>
  ) : error ? (
    <View style={s.center}>
      <Ionicons name="cloud-offline-outline" size={34} color="#f87171" />
      <Text style={s.emptyTitle}>Could not load</Text>
      <Text style={s.centerText}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); load(activeDate); }}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
    </View>
  ) : (
    <View style={s.center}>
      <Ionicons name="newspaper-outline" size={34} color="#FCA5A5" />
      <Text style={s.emptyTitle}>{activeDate ? 'No newspaper for this date' : 'No newspapers available'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      {header}
      <FlatList
        key={`cols-${cols}`}
        data={items}
        numColumns={cols}
        keyExtractor={(it, i) => String(it?.id ?? i)}
        columnWrapperStyle={cols > 1 ? { gap: GAP, marginBottom: GAP } : undefined}
        renderItem={({ item }) => <NewspaperCard item={item} width={cardW} onPress={openDetail} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RED]} tintColor={RED} />}
        contentContainerStyle={{ padding: PAD, paddingBottom: 40, maxWidth: 1200, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      />
      <DetailModal
        visible={Boolean(selected)}
        preview={selected}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
        onRetry={() => selected && openDetail(selected)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  filterWrap: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 14 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#0f172a' },
  applyBtn: { backgroundColor: RED, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  clearBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  clearText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  errInline: { color: '#dc2626', fontSize: 12, marginTop: 6 },
  activeInfo: { color: '#64748b', fontSize: 12, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#EDE8E1', overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 0.75, backgroundColor: '#f1f5f9' },
  coverEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 11, color: '#94a3b8' },
  center: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  centerText: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  retryBtn: { marginTop: 6, backgroundColor: RED, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: 'center' },
  sheet: {
    backgroundColor: '#fff', width: '100%', maxWidth: 520, maxHeight: '90%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: IS_WEB ? 20 : 0, borderBottomRightRadius: IS_WEB ? 20 : 0,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0f172a' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#f1f5f9', marginBottom: 12 },
  date: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  desc: { fontSize: 14, color: '#334155', lineHeight: 20 },
  errBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 10, alignItems: 'center', gap: 8 },
  errText: { color: '#b91c1c', fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: RED, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.4 },
});