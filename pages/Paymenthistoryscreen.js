// pages/PaymentHistoryScreen.js
// ─────────────────────────────────────────────────────────────────
// Payment History — user ne ab tak kaunsa subscription kab liya,
// kitna pay kiya, kab shuru hua, kab khatam hoga — sab ek jagah.
// Sabhi module cover karta hai: Role/Membership, Ads, E-Commerce, Quiz.
//
// Data source: GET /payment-history (user ki apni history, token se user
// pehchana jaata hai). Module + status filter, date range aur pagination
// backend se hi hota hai. Agar API fail ho jaye to purana local
// payment_history (UserStore.getPaymentSummary) fallback ke taur pe dikhta hai.
// ─────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import S from '../styles/Paymenthistorystyles';
import ModuleWebHeader from '../components/Modulewebheader';

// ── Module meta — icon/color/label har subscription type ke liye ──
const MODULES = {
  role:  { key: 'role',  label: 'Role / Membership', icon: 'award',        color: '#7C3AED', bg: '#F3E8FF' },
  ads:   { key: 'ads',   label: 'Ads',               icon: 'volume-2',      color: '#EA580C', bg: '#FFF7ED' },
  ecom:  { key: 'ecom',  label: 'E-Commerce',        icon: 'shopping-bag',  color: '#2563EB', bg: '#EFF6FF' },
  quiz:  { key: 'quiz',  label: 'Quiz',              icon: 'help-circle',   color: '#16A34A', bg: '#F0FDF4' },
};
const STATUS_FILTERS = [
  { key: 'all',     label: 'All Status' },
  { key: 'paid',    label: 'Paid' },
  { key: 'created', label: 'Pending' },
  { key: 'failed',  label: 'Failed' },
];
const PER_PAGE = 20;
const FILTERS = [
  { key: 'all',  label: 'All' },
  { key: 'role', label: 'Role' },
  { key: 'ads',  label: 'Ads' },
  { key: 'ecom', label: 'E-Commerce' },
  { key: 'quiz', label: 'Quiz' },
];

// ── Date/time ko readable banata hai (agar backend full timestamp de raha hai to time bhi dikhega) ──
const formatDateTime = (value) => {
  if (!value) return { date: '—', time: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: String(value), time: null };
  const hasTime = /\d{2}:\d{2}/.test(String(value));
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = hasTime ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
  return { date, time };
};

const isPlanExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const t = new Date(`${expiresAt}T23:59:59`).getTime();
  return !Number.isNaN(t) && Date.now() > t;
};

export default function PaymentHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPlans, setCurrentPlans] = useState([]); // [{module, plan_name, price, purchased_at, expires_at}]
  const [transactions, setTransactions] = useState([]);  // API rows (ya fallback local rows)
  const [statusFilter, setStatusFilter] = useState('all');
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadCurrentPlans = useCallback(async () => {
    const user = await UserStore.getCurrentUser();
    const plans = [];
    if (user?.subscription_plan?.plan_name) {
      plans.push({
        module: 'role',
        plan_name: user.subscription_plan.plan_name,
        price: user.subscription_plan.price,
        purchased_at: user.subscription_plan.purchased_at,
        expires_at: user.subscription_plan.expires_at,
      });
    }
    if (user?.ad_subscription?.plan_name) {
      plans.push({
        module: 'ads',
        plan_name: user.ad_subscription.plan_name,
        price: user.ad_subscription.price,
        purchased_at: user.ad_subscription.purchased_at,
        expires_at: user.ad_subscription.expires_at,
      });
    }
    if (user?.ecome_subscription?.plan_name) {
      plans.push({
        module: 'ecom',
        plan_name: user.ecome_subscription.plan_name,
        price: user.ecome_subscription.price,
        purchased_at: user.ecome_subscription.purchased_at,
        expires_at: user.ecome_subscription.expires_at,
      });
    }
    if (user?.quiz_subscription_plan?.plan_name || user?.quiz_subscription_expiry) {
      plans.push({
        module: 'quiz',
        plan_name: user?.quiz_subscription_plan?.plan_name || 'Quiz Subscription',
        price: user?.quiz_subscription_plan?.price,
        purchased_at: user?.quiz_subscription_plan?.purchased_at,
        expires_at: user?.quiz_subscription_expiry,
      });
    }
    setCurrentPlans(plans);
  }, []);

  // Local (purana) payment_history ko API-row shape me convert karta hai — sirf fallback ke liye
  const mapLocalTxn = (t, idx) => ({
    payment_id: `local-${idx}`,
    module: t.module || 'role',
    plan: { title: t.plan_name || 'Subscription Plan' },
    amount: t.amount,
    status: (() => {
      const st = String(t.status || '').toLowerCase();
      if (['success', 'paid', 'completed'].includes(st)) return 'paid';
      if (['failed', 'error'].includes(st)) return 'failed';
      return 'created';
    })(),
    purchase_date: t.date,
    start_date: null,
    end_date: null,
    validity_status: null,
  });

  const fetchPage = useCallback(async (page, moduleKey, stKey) => {
    return UserStore.getPaymentHistory({
      module: moduleKey,
      status: stKey,
      page,
      per_page: PER_PAGE,
    });
  }, []);

  const load = useCallback(async () => {
    await loadCurrentPlans();
    const res = await fetchPage(1, activeFilter, statusFilter);
    if (res?.ok) {
      setTransactions(res.items);
      setMeta(res.meta);
      setSummary(res.summary);
      setUsingFallback(false);
      setErrorMsg('');
    } else {
      // API fail -> local history dikhao, par user ko bata do
      const paymentSummary = await UserStore.getPaymentSummary();
      const local = Array.isArray(paymentSummary?.payment_history) ? paymentSummary.payment_history : [];
      setTransactions(local.map(mapLocalTxn));
      setMeta(null);
      setSummary(null);
      setUsingFallback(true);
      setErrorMsg(res?.isAuth ? 'Session expired. Please login again.' : (res?.message || 'Could not load the payment history.'));
    }
    setLoading(false);
    setRefreshing(false);
  }, [activeFilter, statusFilter, fetchPage, loadCurrentPlans]);

  const loadMore = useCallback(async () => {
    if (loadingMore || usingFallback || !meta || meta.current_page >= meta.last_page) return;
    setLoadingMore(true);
    const res = await fetchPage(meta.current_page + 1, activeFilter, statusFilter);
    if (res?.ok) {
      setTransactions((prev) => [...prev, ...res.items]);
      setMeta(res.meta);
      setSummary(res.summary || summary);
    }
    setLoadingMore(false);
  }, [loadingMore, usingFallback, meta, fetchPage, activeFilter, statusFilter, summary]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

   const filteredPlans = activeFilter === 'all' ? currentPlans : currentPlans.filter((p) => p.module === activeFilter);
  // Payment status (API): created / paid / failed
  const paymentBadge = (status) => {
    const st = String(status || '').toLowerCase();
    if (st === 'paid') return [S.badgeSuccess, S.badgeSuccessText, 'Paid'];
    if (st === 'failed') return [S.badgeFailed, S.badgeFailedText, 'Failed'];
    return [S.badgePending, S.badgePendingText, 'Pending'];
  };

   return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <View style={S.root}>
        <ModuleWebHeader title="Payment History" navigation={navigation} />
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={require('../assets/images/profile-red.png')}
            style={S.headerImageWrap}
            imageStyle={S.headerImageInner}
            resizeMode="cover"
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBackBtn}>
              <Feather name="arrow-left" size={20} color="#ffffff" />
              <Text style={S.headerBackBtnText}>Back</Text>
            </TouchableOpacity>
            <Text style={S.headerTitle}>Payment History</Text>
            <View style={{ width: 70 }} />
          </ImageBackground>
        )}
        {loading ? (
          <ActivityIndicator color="#dc2626" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={S.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#dc2626']} tintColor="#dc2626" />}
          >
            {/* Filter chips */}
            <View style={S.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => { setLoading(true); setActiveFilter(f.key); }}
                  style={[S.filterChip, activeFilter === f.key && S.filterChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[S.filterChipText, activeFilter === f.key && S.filterChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current Plans (across modules) */}
            <Text style={S.sectionTitle}>Current Plans</Text>
            {filteredPlans.length === 0 ? (
              <View style={S.emptyBox}>
                <Feather name="inbox" size={28} color="#C7CBD4" />
                <Text style={S.emptyText}>There is no active plan in this category.</Text>
              </View>
            ) : (
              filteredPlans.map((p, idx) => {
                const meta = MODULES[p.module] || MODULES.role;
                const expired = isPlanExpired(p.expires_at);
                const start = formatDateTime(p.purchased_at);
                const end = formatDateTime(p.expires_at);
                return (
                  <View key={`${p.module}_${idx}`} style={S.planCardRow}>
                    <View style={[S.moduleIconWrap, { backgroundColor: meta.bg }]}>
                      <Feather name={meta.icon} size={19} color={meta.color} />
                    </View>
                    <View style={S.planCardBody}>
                      <Text style={S.moduleLabel}>{meta.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={S.planCardName} numberOfLines={1}>{p.plan_name}</Text>
                        {p.price != null ? <Text style={S.planCardPrice}>₹{p.price}</Text> : null}
                      </View>

                      <View style={S.planCardMetaRow}>
                        <View>
                          <Text style={S.planCardMetaLabel}>Started</Text>
                          <Text style={S.planCardMetaValue}>{start.date}{start.time ? ` · ${start.time}` : ''}</Text>
                        </View>
                        <View>
                          <Text style={S.planCardMetaLabel}>Ends</Text>
                          <Text style={S.planCardMetaValue}>{end.date}{end.time ? ` · ${end.time}` : ''}</Text>
                        </View>
                      </View>

                      <View style={[S.statusPill, expired ? S.statusPillExpired : S.statusPillActive, { marginTop: 8 }]}>
                        <Text style={[S.statusPillText, { color: expired ? '#B91C1C' : '#15803D' }]}>
                          {expired ? 'Expired' : 'Active'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* All Transactions — GET /payment-history */}
            <Text style={S.sectionTitle}>All Transactions</Text>

            {/* Status filter */}
            <View style={S.filterRow}>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => { setLoading(true); setStatusFilter(f.key); }}
                  style={[S.filterChip, statusFilter === f.key && S.filterChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[S.filterChipText, statusFilter === f.key && S.filterChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {usingFallback && errorMsg ? (
              <View style={S.noteBox}>
                <Text style={S.noteText}>{errorMsg} Abhi phone me saved history dikh rahi hai.</Text>
              </View>
            ) : null}

            {summary ? (
              <Text style={[S.planCardMetaLabel, { marginBottom: 10 }]}>
                {summary.total_records ?? 0} payment{Number(summary.total_records) === 1 ? '' : 's'} · Paid total ₹{Number(summary.paid_amount || 0).toLocaleString('en-IN')}
              </Text>
            ) : null}

            {transactions.length === 0 ? (
              <View style={S.emptyBox}>
                <Feather name="file-text" size={28} color="#C7CBD4" />
                <Text style={S.emptyText}>No transaction records found yet.</Text>
              </View>
            ) : (
              transactions.map((t, idx) => {
                const meta2 = MODULES[t.module] || MODULES.role;
                const [pillBg, pillTxt, pillLabel] = paymentBadge(t.status);
                const purchased = formatDateTime(t.purchase_date || t.created_at);
                const hasValidity = Boolean(t.validity_status);
                const expired = t.validity_status === 'expired';
                const startLabel = t.start_date ? formatDateTime(t.start_date).date : '—';
                const endLabel = t.end_date
                  ? formatDateTime(t.end_date).date
                  : (hasValidity ? 'No expiry' : '—');
                return (
                  <View key={String(t.payment_id ?? idx)} style={S.planCardRow}>
                    <View style={[S.moduleIconWrap, { backgroundColor: meta2.bg }]}>
                      <Feather name={meta2.icon} size={19} color={meta2.color} />
                    </View>
                    <View style={S.planCardBody}>
                      <Text style={S.moduleLabel}>{t.module_label || meta2.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={S.planCardName} numberOfLines={1}>{t.plan?.title || 'Subscription Plan'}</Text>
                        {t.amount != null ? <Text style={S.planCardPrice}>₹{t.amount}</Text> : null}
                      </View>

                      <View style={S.planCardMetaRow}>
                        <View>
                          <Text style={S.planCardMetaLabel}>Paid on</Text>
                          <Text style={S.planCardMetaValue}>{purchased.date}{purchased.time ? ` · ${purchased.time}` : ''}</Text>
                        </View>
                        <View>
                          <Text style={S.planCardMetaLabel}>Validity</Text>
                         <><Text style={S.planCardMetaValue}>{startLabel}</Text><Text style={S.planCardMetaValue}>→ {endLabel}</Text></>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                        <View style={[S.statusPill, pillBg]}>
                          <Text style={[S.statusPillText, pillTxt]}>{pillLabel}</Text>
                        </View>
                        {hasValidity ? (
                          <View style={[S.statusPill, expired ? S.statusPillExpired : S.statusPillActive]}>
                            <Text style={[S.statusPillText, { color: expired ? '#B91C1C' : '#15803D' }]}>
                              {expired ? 'Expired' : 'Active'}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {t.status === 'failed' && t.failure_description ? (
                        <Text style={[S.planCardMetaLabel, { marginTop: 6 }]} numberOfLines={2}>{t.failure_description}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}

            {!usingFallback && meta && meta.current_page < meta.last_page ? (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore}
                style={[S.filterChip, { alignSelf: 'center', marginTop: 8 }]}
                activeOpacity={0.8}
              >
                {loadingMore
                  ? <ActivityIndicator color="#dc2626" size="small" />
                  : <Text style={S.filterChipText}>Load more</Text>}
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}