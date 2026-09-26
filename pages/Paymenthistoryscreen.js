// pages/PaymentHistoryScreen.js
// ─────────────────────────────────────────────────────────────────
// Payment History — user ne ab tak kaunsa subscription kab liya,
// kitna pay kiya, kab shuru hua, kab khatam hoga — sab ek jagah.
// Sabhi module cover karta hai: Role/Membership, Ads, E-Commerce, Quiz.
//
// ⚠️ Data-availability note: is app me abhi sirf Role/Membership
// subscription ka poora transaction-by-transaction history backend
// se aata hai (UserStore.getPaymentSummary → payment_history[]).
// Ads / E-Commerce / Quiz ke liye sirf "abhi ka active plan" (current
// snapshot: plan name, price, start date, end date) available hai,
// unka purana transaction list backend me store nahi hota — isliye
// unhe "Current Plans" section me dikhaya gaya hai, aur Role ka poora
// transaction list "All Transactions" section me. Jis din Ads/Ecom/Quiz
// ka bhi history API/field ban jaye, bas neeche wale buildTransactions()
// function me unko bhi map kar dena — baaki UI automatically handle
// kar lega.
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
  ads:   { key: 'ads',   label: 'Ads',               icon: 'megaphone',     color: '#EA580C', bg: '#FFF7ED' },
  ecom:  { key: 'ecom',  label: 'E-Commerce',        icon: 'shopping-bag',  color: '#2563EB', bg: '#EFF6FF' },
  quiz:  { key: 'quiz',  label: 'Quiz',              icon: 'help-circle',   color: '#16A34A', bg: '#F0FDF4' },
};
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
  const [transactions, setTransactions] = useState([]);  // role payment_history

  const load = useCallback(async () => {
    const user = await UserStore.getCurrentUser();
    const paymentSummary = await UserStore.getPaymentSummary();

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
    setTransactions(Array.isArray(paymentSummary?.payment_history) ? paymentSummary.payment_history : []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

   const filteredPlans = activeFilter === 'all' ? currentPlans : currentPlans.filter((p) => p.module === activeFilter);
  // ✅ Ab Role/Ads/E-Commerce/Quiz — sabhi purchases payment_history me module-tagged aate hain
  const filteredTxns = activeFilter === 'all' ? transactions : transactions.filter((t) => (t.module || 'role') === activeFilter);
  // Agar backend se real transaction history nahi mili, to current active plan
  // ki details ko hi ek table-row jaisa bana dete hain (jaisa screenshot me chahiye)
  const buildTableRows = () => {
    if (filteredTxns.length > 0) {
      return filteredTxns.map((t) => {
        const { date } = formatDateTime(t.date);
        return {
          plan: t.plan_name || 'Subscription Plan',
          amount: t.amount,
          started: date,
          ends: '—',
          status: String(t.status || 'Pending'),
        };
      });
    }
    // Fallback: current plans se rows banao
    return filteredPlans.map((p) => {
      const meta = MODULES[p.module] || MODULES.role;
      const expired = isPlanExpired(p.expires_at);
      const start = formatDateTime(p.purchased_at);
      const end = formatDateTime(p.expires_at);
      return {
        plan: p.plan_name,
        module: meta.label,
        amount: p.price,
        started: start.date,
        ends: end.date,
        status: expired ? 'Expired' : 'Active',
      };
    });
  };
  const statusBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'success' || s === 'paid' || s === 'completed') return [S.badgeSuccess, S.badgeSuccessText, 'Success'];
    if (s === 'failed' || s === 'error') return [S.badgeFailed, S.badgeFailedText, 'Failed'];
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
                  onPress={() => setActiveFilter(f.key)}
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
                <Text style={S.emptyText}>Is category me koi active plan nahi hai.</Text>
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

            {/* All Transactions (Role/Membership — poora history yahi available hai) */}
            <Text style={S.sectionTitle}>All Transactions</Text>

                       {(() => {
              const rows = buildTableRows();
              if (rows.length === 0) {
                return (
                  <View style={S.emptyBox}>
                    <Feather name="file-text" size={28} color="#C7CBD4" />
                    <Text style={S.emptyText}>Abhi tak koi transaction record nahi mila.</Text>
                  </View>
                );
              }
              return (
                <View style={S.tableWrap}>
                  <View style={S.tableHeaderRow}>
                    <Text style={[S.tableHeaderCell, { flex: 1.6 }]}>Plan</Text>
                    <Text style={[S.tableHeaderCell, { flex: 0.9 }]}>Amount</Text>
                    <Text style={[S.tableHeaderCell, { flex: 1.1 }]}>Started</Text>
                    <Text style={[S.tableHeaderCell, { flex: 1.1 }]}>Ends</Text>
                    <Text style={[S.tableHeaderCell, { flex: 0.9, textAlign: 'right' }]}>Status</Text>
                  </View>
                  {rows.map((r, idx) => (
                    <View key={idx} style={[S.tableDataRow, idx % 2 !== 0 && S.tableDataRowAlt]}>
                      <Text style={[S.tableCellText, { flex: 1.6, fontWeight: '700', color: '#111111' }]} numberOfLines={1}>
                        {r.plan}
                      </Text>
                      <Text style={[S.tableCellText, { flex: 0.9, color: '#EA580C', fontWeight: '700' }]}>
                        {r.amount != null ? `₹${r.amount}` : '—'}
                      </Text>
                      <Text style={[S.tableCellText, { flex: 1.1 }]}>{r.started}</Text>
                      <Text style={[S.tableCellText, { flex: 1.1 }]}>{r.ends}</Text>
                      <View style={{ flex: 0.9, alignItems: 'flex-end' }}>
                        <View style={[S.statusPill, r.status === 'Active' ? S.statusPillActive : r.status === 'Expired' ? S.statusPillExpired : S.badgePending]}>
                          <Text style={[S.statusPillText, { color: r.status === 'Active' ? '#15803D' : r.status === 'Expired' ? '#B91C1C' : '#92400E' }]}>
                            {r.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}