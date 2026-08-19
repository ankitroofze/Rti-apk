import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar, Alert,
  useWindowDimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';

// ── Design Tokens ───
const C = {
  orange:       '#F97316',
  orangeLight:  '#FFF7ED',
  orangeMid:    '#FED7AA',
  orangeBorder: '#FFE8D6',
  orangeDark:   '#C2410C',
  green:        '#16a34a',
  greenLight:   '#f0fdf4',
  greenBorder:  '#bbf7d0',
  red:          '#ef4444',
  redLight:     '#fff0f0',
  white:        '#ffffff',
  bg:           '#F8F8F8',
  text:         '#111111',
  textSub:      '#888888',
  border:       '#EEEEEE',
};

const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 10
  : 54;

// ── Credit Meter ───────────────────────────────────────────────────────────────
function CreditMeter({ credits, total = 20 }) {
  const pct = Math.min(100, Math.round((credits / total) * 100));
  const color = credits === 0 ? C.red : credits <= 3 ? '#f59e0b' : C.orange;
  return (
    <View style={cm.wrap}>
      <View style={cm.topRow}>
        <View style={cm.left}>
          <Text style={cm.label}>Ad Credits</Text>
          <View style={cm.countRow}>
            <Text style={[cm.count, { color }]}>{credits}</Text>
            <Text style={cm.countSub}> remaining</Text>
          </View>
        </View>
        <View style={[cm.badge, { backgroundColor: color + '18', borderColor: color + '44' }]}>
          <Ionicons name="flash" size={14} color={color} />
          <Text style={[cm.badgeText, { color }]}>{pct}% left</Text>
        </View>
      </View>
      <View style={cm.bar}>
        <View style={[cm.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={cm.hint}>
        <Ionicons name="information-circle-outline" size={12} color={C.textSub} />
        <Text style={cm.hintText}>1 credit per post · 1 credit per edit</Text>
      </View>
    </View>
  );
}
const cm = StyleSheet.create({
  wrap:     { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.orangeBorder },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  left:     { flex: 1 },
  label:    { fontSize: 11, fontWeight: '800', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  countRow: { flexDirection: 'row', alignItems: 'baseline' },
  count:    { fontSize: 36, fontWeight: '900' },
  countSub: { fontSize: 14, color: C.textSub, fontWeight: '500' },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeText:{ fontSize: 12, fontWeight: '700' },
  bar:      { height: 8, backgroundColor: '#F0F0F0', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  fill:     { height: '100%', borderRadius: 99 },
  hint:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 11, color: C.textSub },
});

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyAds({ onPost, hasCredits }) {
  return (
    <View style={em.wrap}>
      <View style={em.iconCircle}>
        <Ionicons name="megaphone-outline" size={36} color={C.orange} />
      </View>
      <Text style={em.title}>No Ads Yet</Text>
      <Text style={em.sub}>
        {hasCredits
          ? 'You have credits! Post your first ad now.'
          : 'Buy a credit plan to start advertising.'}
      </Text>
      <TouchableOpacity style={em.btn} onPress={onPost} activeOpacity={0.85}>
        <Ionicons name={hasCredits ? 'add-circle-outline' : 'flash-outline'} size={16} color="#fff" />
        <Text style={em.btnText}>
          {hasCredits ? 'Post First Ad' : 'Buy Credits'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const em = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: C.orangeBorder },
  title:      { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  sub:        { fontSize: 13, color: C.textSub, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orange, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  btnText:    { color: '#fff', fontSize: 14, fontWeight: '800' },
});

// ── Ad Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:  { bg: C.greenLight,  border: C.greenBorder, color: C.green,  label: 'Active',  icon: 'checkmark-circle' },
    pending: { bg: '#fefce8',     border: '#fde68a',     color: '#b45309', label: 'Pending', icon: 'time-outline' },
    expired: { bg: '#f3f4f6',     border: '#e5e7eb',     color: '#6b7280', label: 'Expired', icon: 'close-circle-outline' },
  };
  const cfg = map[status] || map.active;
  return (
    <View style={[sb.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
      <Text style={[sb.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  text:  { fontSize: 11, fontWeight: '700' },
});

// ── Ad Card ────────────────────────────────────────────────────────────────────
function AdCard({ ad, onEdit, onDelete, isWeb }) {
  const date = ad.created_at
    ? new Date(ad.created_at).toLocaleDateString('en-IN')
    : '—';
  const updatedDate = ad.updated_at
    ? new Date(ad.updated_at).toLocaleDateString('en-IN')
    : null;

  return (
    <View style={[ac.card, isWeb && ac.cardWeb]}>
      {/* Top row */}
      <View style={ac.topRow}>
        <View style={ac.photoWrap}>
          {ad.photo ? (
            <Image source={{ uri: ad.photo }} style={ac.photo} resizeMode="cover" />
          ) : (
            <View style={ac.photoPlaceholder}>
              <Ionicons name="image-outline" size={22} color={C.textSub} />
            </View>
          )}
        </View>
        <View style={ac.info}>
          <Text style={ac.title} numberOfLines={2}>{ad.title || 'Untitled Ad'}</Text>
          <Text style={ac.desc} numberOfLines={2}>{ad.description || '—'}</Text>
          <View style={ac.metaRow}>
            <StatusBadge status={ad.status || 'active'} />
            <Text style={ac.date}>
              {updatedDate ? `Edited ${updatedDate}` : `Posted ${date}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Redirect info */}
      {ad.redirect && (
        <View style={ac.redirectRow}>
          <Ionicons name="link-outline" size={13} color={C.orange} />
          <Text style={ac.redirectText}>
            Redirect: <Text style={{ fontWeight: '700', color: C.orangeDark }}>{ad.redirect}</Text>
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={ac.btnRow}>
        <TouchableOpacity style={ac.editBtn} onPress={() => onEdit(ad)} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={14} color={C.orange} />
          <Text style={ac.editBtnText}>Edit (1 credit)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ac.deleteBtn} onPress={() => onDelete(ad.id)} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={14} color={C.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const ac = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 18,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardWeb: { marginBottom: 0 },
  topRow:  { flexDirection: 'row', gap: 12, marginBottom: 10 },
  photoWrap: { flexShrink: 0 },
  photo:    { width: 72, height: 72, borderRadius: 12 },
  photoPlaceholder: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.orangeBorder,
  },
  info:    { flex: 1, minWidth: 0 },
  title:   { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 4 },
  desc:    { fontSize: 12, color: C.textSub, marginBottom: 6, lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date:    { fontSize: 11, color: C.textSub },

  redirectRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.orangeLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10,
  },
  redirectText: { fontSize: 12, color: C.textSub, flex: 1 },

  btnRow:      { flexDirection: 'row', gap: 8 },
  editBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.orangeBorder },
  editBtnText: { fontSize: 13, fontWeight: '700', color: C.orange },
  deleteBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MyAdsScreen({ navigation }) {
  const { showToast } = useToast();
  const [credits, setCredits]   = useState(0);
  const [ads, setAds]           = useState([]);
  const [adPlan, setAdPlan]     = useState(null);
  const [loading, setLoading]   = useState(true);

  const { width: windowWidth } = useWindowDimensions();
  const isWeb   = Platform.OS === 'web';
  const isWide  = isWeb && windowWidth >= 860;
  const isCompactWeb = isWeb && windowWidth <= 640;

  const loadData = useCallback(async () => {
    setLoading(true);
    const summary = await UserStore.getAdCreditsSummary();
    if (summary) {
      setCredits(summary.credits || 0);
      setAds(Array.isArray(summary.ads) ? summary.ads : []);
      setAdPlan(summary.ad_subscription || null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handlePostAd = () => {
    if (credits <= 0) {
      if (Platform.OS === 'web') {
        showToast('You have no ad credits left. Redirecting to plans...', 'error');
        navigation.navigate('AdPlans', { returnTo: 'MyAds' });
        return;
      }
      Alert.alert(
        'No Credits',
        'You have no ad credits left. Buy a plan to continue posting ads.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('AdPlans', { returnTo: 'MyAds' }) },
        ]
      );
      return;
    }
    navigation.navigate('Advertise');
  };
  const handleEdit = (ad) => {
    const openEditPage = () => navigation.navigate('Advertise', { editAd: ad, useCredit: true });

    if (credits <= 0) {
      if (Platform.OS === 'web') {
        globalThis.alert?.('You need 1 credit to edit an ad. Buy more credits to continue.');
        return;
      }
      Alert.alert(
        'No Credits',
        'You need 1 credit to edit an ad. Buy more credits to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('AdPlans', { returnTo: 'MyAds' }) },
        ]
      );
      return;
    }

    if (Platform.OS === 'web') {
      showToast('1 credit will be deducted when you submit the edit.', 'info');
      openEditPage();
      return;
    }
    Alert.alert(
      'Edit Ad',
      'If you edit the ad, 1 credit will be deducted at the time of submission. Continue?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: openEditPage,
        },
      ]
    );
  };

  const handleDelete = (adId) => {
    const doDelete = async () => {
      const result = await UserStore.deleteAd(adId);
      if (result.ok) {
        setAds(prev => prev.filter(a => a.id !== adId));
      } else {
        if (Platform.OS === 'web') {
          showToast(result.message, 'error');
        } else {
          Alert.alert('Error', result.message);
        }
      }
    };

    if (Platform.OS === 'web') {
      const shouldDelete = globalThis.confirm?.('Are you sure you want to delete this ad? This cannot be undone.');
      if (shouldDelete) doDelete();
      return;
    }

    Alert.alert(
      'Delete Ad',
      'Are you sure you want to delete this ad? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]
    );
  };
  // ── WEB LAYOUT ──────────────────────────────────────────────────────────────
  if (isWeb) {
    return (
      <View style={ws.root}>
        {/* Top Bar */}
        <View style={[ws.topBar, isCompactWeb && ws.topBarCompact]}>
          <View style={[ws.topLeft, isCompactWeb && ws.topLeftCompact]}>
            <Ionicons name="home" size={14} color="#888888" />
            <Text style={ws.bcSep}>›</Text>
            <Text style={ws.bcStep}>Dashboard</Text>
            <Text style={ws.bcSep}>›</Text>
            <Text style={ws.bcCur}>My Ads</Text>
          </View>
          <TouchableOpacity style={[ws.backBtn, isCompactWeb && ws.backBtnCompact]} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={13} color={C.orangeDark} />
            <Text style={ws.backBtnText}>Back to menu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={ws.scroll}
          contentContainerStyle={[ws.scrollContent, isCompactWeb && ws.scrollContentCompact]}
          showsVerticalScrollIndicator={false}
        >
          <View style={ws.innerWrap}>

            {/* Page Heading */}
            <View style={[ws.pageHeadRow, isCompactWeb && ws.pageHeadRowCompact]}>
              <View style={isCompactWeb && ws.pageHeadTextCompact}>
                <Text style={[ws.pageTitle, isCompactWeb && ws.pageTitleCompact]}>My Advertisements</Text>
                <Text style={ws.pageSub}>Manage your ads and credit balance.</Text>
              </View>
              <TouchableOpacity
                style={[ws.postBtn, isCompactWeb && ws.postBtnCompact, credits <= 0 && ws.postBtnDim]}
                onPress={handlePostAd}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={17} color="#fff" />
                <Text style={ws.postBtnText}>Post New Ad</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={[ws.statsRow, isCompactWeb && ws.statsRowCompact]}>
              {/* Credit Meter */}
              <View style={[ws.statCard, isCompactWeb && ws.statCardCompact]}>
                <CreditMeter credits={credits} total={adPlan?.credits || 20} />
                <TouchableOpacity
                  style={ws.buyMoreBtn}
                  onPress={() => navigation.navigate('AdPlans', { returnTo: 'MyAds' })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flash-outline" size={14} color={C.orange} />
                  <Text style={ws.buyMoreText}>Buy More Credits</Text>
                </TouchableOpacity>
              </View>

              {/* Plan Info */}
              <View style={[ws.statCard, isCompactWeb && ws.statCardCompact]}>
                <Text style={ws.statCardTitle}>Current Plan</Text>
                {adPlan ? (
                  <>
                    <Text style={ws.planName}>{adPlan.plan_name}</Text>
                    <View style={ws.planMetaRow}>
                      <View style={ws.planMeta}>
                        <Ionicons name="flash" size={13} color={C.orange} />
                        <Text style={ws.planMetaText}>{adPlan.credits} credits purchased</Text>
                      </View>
                      <View style={ws.planMeta}>
                        <Ionicons name="calendar-outline" size={13} color={C.orange} />
                        <Text style={ws.planMetaText}>
                          Purchased {adPlan.purchased_at
                            ? new Date(adPlan.purchased_at).toLocaleDateString('en-IN')
                            : '—'}
                        </Text>
                      </View>
                      <View style={ws.planMeta}>
                        <Ionicons name="pricetag-outline" size={13} color={C.orange} />
                        <Text style={ws.planMetaText}>₹{adPlan.price}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={ws.noPlanWrap}>
                    <Text style={ws.noPlanText}>No active plan</Text>
                    <TouchableOpacity
                      style={ws.buyPlanBtn}
                      onPress={() => navigation.navigate('AdPlans', { returnTo: 'MyAds' })}
                      activeOpacity={0.85}
                    >
                      <Text style={ws.buyPlanBtnText}>View Plans →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Ads count */}
              <View style={[ws.statCard, isCompactWeb && ws.statCardCompact]}>
                <Text style={ws.statCardTitle}>Total Ads</Text>
                <Text style={ws.statBigNum}>{ads.length}</Text>
                <Text style={ws.statSubLabel}>advertisements posted</Text>
              </View>
            </View>

            {/* Ads List */}
            <View style={ws.adsSection}>
              <Text style={ws.adsSectionTitle}>Your Ads</Text>
              {loading ? (
                <Text style={ws.loadingText}>Loading...</Text>
              ) : ads.length === 0 ? (
                <EmptyAds onPost={handlePostAd} hasCredits={credits > 0} />
              ) : (
                <View style={[ws.adsGrid, isWide && ws.adsGridWide]}>
                  {ads.map(ad => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isWeb
                    />
                  ))}
                </View>
              )}
            </View>

          </View>
        </ScrollView>
      </View>
    );
  }

  // ── MOBILE LAYOUT ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.orange} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Advertisements</Text>
        <TouchableOpacity
          style={s.headerBuyBtn}
          onPress={() => navigation.navigate('AdPlans', { returnTo: 'MyAds' })}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={14} color={C.orange} />
          <Text style={s.headerBuyText}>Buy Credits</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Credit Meter */}
        <CreditMeter credits={credits} total={adPlan?.credits || 20} />

        {/* Plan Info */}
        {adPlan && (
          <View style={s.planCard}>
            <View style={s.planLeft}>
              <Text style={s.planLabel}>Active Plan</Text>
              <Text style={s.planName}>{adPlan.plan_name}</Text>
              <Text style={s.planMeta}>₹{adPlan.price} · {adPlan.credits} credits · 56 days</Text>
            </View>
            <TouchableOpacity
              style={s.upgradePill}
              onPress={() => navigation.navigate('AdPlans', { returnTo: 'MyAds' })}
              activeOpacity={0.8}
            >
              <Text style={s.upgradePillText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ads List */}
        <View style={s.adsSection}>
          <Text style={s.sectionTitle}>Your Ads ({ads.length})</Text>
          {loading ? (
            <Text style={s.loadingText}>Loading...</Text>
          ) : ads.length === 0 ? (
            <EmptyAds onPost={handlePostAd} hasCredits={credits > 0} />
          ) : (
            ads.map(ad => (
              <AdCard
                key={ad.id}
                ad={ad}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isWeb={false}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Post Button */}
      <View style={s.bottomBar}>
        <View style={s.bottomLeft}>
          <Ionicons name="flash" size={16} color={credits <= 0 ? C.textSub : C.orange} />
          <Text style={[s.bottomCredits, credits <= 0 && { color: C.textSub }]}>
            {credits} credits left
          </Text>
        </View>
        <TouchableOpacity
          style={[s.postBtn, credits <= 0 && s.postBtnDim]}
          onPress={handlePostAd}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={s.postBtnText}>Post New Ad</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Mobile Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: SAFE_TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
    elevation: 3,
    shadowColor: C.orange, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  backBtn:       { padding: 8, borderRadius: 10, backgroundColor: C.orangeLight, marginRight: 10 },
  headerTitle:   { flex: 1, fontSize: 17, fontWeight: '800', color: C.text },
  headerBuyBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.orangeLight, borderRadius: 10, borderWidth: 1, borderColor: C.orangeBorder },
  headerBuyText: { fontSize: 12, fontWeight: '700', color: C.orange },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },

  planCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 16,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.orangeBorder,
  },
  planLeft:    { flex: 1 },
  planLabel:   { fontSize: 10, fontWeight: '800', color: C.orange, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  planName:    { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 2 },
  planMeta:    { fontSize: 12, color: C.textSub },
  upgradePill: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.orange, borderRadius: 20 },
  upgradePillText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  adsSection:   { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },
  loadingText:  { fontSize: 13, color: C.textSub, textAlign: 'center', paddingVertical: 20 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: C.border,
    elevation: 12,
    shadowColor: C.orange, shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  bottomLeft:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomCredits: { fontSize: 14, fontWeight: '700', color: C.orange },
  postBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orange, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13, elevation: 4, shadowColor: C.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  postBtnDim:    { backgroundColor: '#ccc' },
  postBtnText:   { color: '#fff', fontSize: 14, fontWeight: '800' },
});

// ── Web Styles ─────────────────────────────────────────────────────────────────
const ws = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg, minHeight: '100vh' },

  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  topLeft:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bcSep:       { fontSize: 15, color: '#CCCCCC', marginHorizontal: 4 },
  bcStep:      { fontSize: 13, color: '#888888' },
  bcCur:       { fontSize: 13, fontWeight: '600', color: C.text },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.orangeBorder, borderRadius: 8 },
  backBtnText: { fontSize: 13, fontWeight: '600', color: C.orangeDark },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 60, alignItems: 'center' },
  innerWrap:     { width: '100%', maxWidth: 1100, alignSelf: 'center' },

  pageHeadRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  pageTitle:    { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSub:      { fontSize: 14, color: C.textSub },
  postBtn:      { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.orange, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexShrink: 0 },
  postBtnDim:   { backgroundColor: '#ccc' },
  postBtnText:  { color: '#fff', fontSize: 14, fontWeight: '800' },

  statsRow:    { flexDirection: 'row', gap: 14, marginBottom: 24, flexWrap: 'wrap' },
  statCard:    { flex: 1, minWidth: 240, backgroundColor: C.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  statCardTitle: { fontSize: 11, fontWeight: '800', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  statBigNum:  { fontSize: 40, fontWeight: '900', color: C.text, marginBottom: 4 },
  statSubLabel:{ fontSize: 13, color: C.textSub },

  planName:    { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 10 },
  planMetaRow: { gap: 6 },
  planMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planMetaText:{ fontSize: 12, color: C.textSub, fontWeight: '500' },

  noPlanWrap:  { alignItems: 'flex-start', gap: 10 },
  noPlanText:  { fontSize: 14, color: C.textSub },
  buyPlanBtn:  { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.orange, borderRadius: 10 },
  buyPlanBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  buyMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, justifyContent: 'center' },
  buyMoreText: { fontSize: 13, fontWeight: '700', color: C.orange },

  adsSection:      { width: '100%' },
  adsSectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 14 },
  loadingText:     { fontSize: 13, color: C.textSub, paddingVertical: 20 },
  adsGrid:         { gap: 12 },
  adsGridWide:     { flexDirection: 'row', flexWrap: 'wrap' },
});
