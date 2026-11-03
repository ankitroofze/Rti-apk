// pages/MyEcomSubscriptionScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// Ecom Subscription Plans — ek hi page par 3 cheezein (sidebar ke andar khulta hai):
//   1) Active Plan   — bada hero card: plan, credits, days left (progress bar), purchased / expires
//   2) All Plans     — backend ke saare plans (barabar size ke responsive cards) + Pay Now / Renew
//   3) Closed Plans  — expired / credits khatam / purane plans ki list
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useMemo } from 'react';
import {
  Platform, View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, ImageBackground,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';
import { getCardTheme } from '../constants/subscriptionThemes';
import { useQuickMenuRedirect } from '../utils/useQuickMenuRedirect';

const FEATURES = [
  'Post product listings on the Sell page',
  'Buyer enquiries directly on your listings',
  'Manage / edit listings anytime',
];

const GAP = 16;

const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
};

const daysLeft = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
};

// Plan kitna "use" ho chuka (0..1) — purchased se expires ke beech
const usedFraction = (from, to) => {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return Math.min(1, Math.max(0, (Date.now() - a) / (b - a)));
};

export default function MyEcomSubscriptionScreen({ navigation }) {
  // Desktop web par ye page kabhi bina sidebar ke na khule
  const redirectingToSidebar = useQuickMenuRedirect(navigation, 'My Ecom Subscription');
  const { showPopup } = useToast();

  const [boxW, setBoxW] = useState(0); // content column ki asli width (sidebar ke baad)
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [sub, setSub] = useState(null);          // user.ecome_subscription
  const [credits, setCredits] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState([]);    // purane ecom subscriptions (backend)
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [user, backendPlans, mine] = await Promise.all([
        UserStore.getCurrentUserSynced(),
        UserStore.getEcomSubscriptionPlans(),
        UserStore.getMySubscriptions(),
      ]);
      setPlans(Array.isArray(backendPlans) ? backendPlans : []);
      setSub(user?.ecome_subscription || null);
      setCredits(Number(user?.ecome_credits || 0));
      setIsActive(user ? UserStore.hasActiveEcomSubscription(user) : false);
      const items = (mine?.items || []).filter((i) =>
        /ecom/i.test(String(i.type || '')) || /ecom/i.test(String(i.planName || ''))
      );
      setHistory(items);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { if (!redirectingToSidebar) load(); }, [load, redirectingToSidebar]));

  // ── Payment (EcomSubscriptionScreen jaisa hi flow) ───────────────────────
  const doSubscribe = useCallback(async (plan) => {
    if (!plan) return;
    if (!Number.isInteger(Number(plan.id))) {
      showPopup('Plans have not loaded yet. Please refresh the screen and try again.', 'error');
      return;
    }
    setProcessingPlanId(plan.id);
    try {
      const orderRes = await UserStore.createEcomOrder({ planId: plan.id });
      if (!orderRes?.ok) {
        setProcessingPlanId(null);
        showPopup(orderRes?.message || 'Unable to start payment. Please try again.', 'error');
        return;
      }
      await openRazorpayCheckout(orderRes.razorpay, 'ecom', {
        onVerified: async (response) => {
          const verifyRes = await UserStore.verifyEcomPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });
          setProcessingPlanId(null);
          if (!verifyRes?.ok) {
            showPopup(verifyRes?.message || 'Payment verification failed.', 'error');
            return;
          }
          showPopup('E-Commerce Subscription activated! You can now post listings on Sell.', 'success');
          load();
        },
        onFailed: async (errorInfo) => {
          setProcessingPlanId(null);
          await UserStore.markPaymentFailed(errorInfo.razorpay_order_id, errorInfo.error_code, errorInfo.error_description);
          showPopup(errorInfo.error_description || 'Payment failed or cancelled.', 'error');
        },
      });
    } catch (e) {
      setProcessingPlanId(null);
      showPopup('Something went wrong. Please try again.', 'error');
    }
  }, [load, showPopup]);

  const handlePay = useCallback((plan) => {
    showPopup(
      `Do you want to subscribe to this E-Commerce plan? ${plan.label} — ₹${plan.price}`,
      'info',
      { primaryLabel: 'Subscribe', secondaryLabel: 'Cancel', onPrimaryPress: () => doSubscribe(plan) }
    );
  }, [doSubscribe, showPopup]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const activePlanIndex = useMemo(() => {
    if (!sub) return -1;
    return plans.findIndex((p) => String(p.id) === String(sub.plan_id) || String(p.label).trim().toLowerCase() === String(sub.plan_name || '').trim().toLowerCase());
  }, [plans, sub]);

  const closedPlans = useMemo(() => {
    const out = [];
    if (sub && !isActive) {
      const left = daysLeft(sub.expires_at);
      out.push({
        key: `current-${sub.plan_name}-${sub.purchased_at}`,
        planName: sub.plan_name || 'E-Commerce Plan',
        price: sub.price,
        purchasedAt: fmtDate(sub.purchased_at),
        endedAt: fmtDate(sub.expires_at),
        reason: left !== null && left < 0 ? 'Expired' : 'Credits used up',
      });
    }
    history.filter((h) => h.status !== 'active').forEach((h, i) => {
      out.push({
        key: `hist-${h.id ?? i}`,
        planName: h.planName,
        price: h.price,
        purchasedAt: fmtDate(h.purchasedAt),
        endedAt: fmtDate(h.expiresAt),
        reason: 'Closed',
      });
    });
    const seen = new Set();
    return out.filter((c) => {
      const k = `${c.planName}|${c.purchasedAt}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [sub, isActive, history]);

  if (redirectingToSidebar) return null;

  const activeTheme = getCardTheme(activePlanIndex >= 0 ? activePlanIndex : 3);
  const left = sub ? daysLeft(sub.expires_at) : null;
  const used = sub ? usedFraction(sub.purchased_at, sub.expires_at) : null;

  // Responsive grid: width ke hisaab se 3 / 2 / 1 columns (sab cards barabar size)
  const w = boxW || 360;
  const cols = w >= 940 ? 3 : w >= 600 ? 2 : 1;
  const cardW = Math.floor((w - GAP * (cols - 1)) / cols);
  const closedCols = w >= 600 ? 2 : 1;
  const closedW = Math.floor((w - GAP * (closedCols - 1)) / closedCols);
  const heroWide = w >= 700;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      {Platform.OS === 'web' ? (
        <ModuleWebHeader title="Ecom Subscription Plans" navigation={navigation} onBack={() => navigation.goBack()} />
      ) : (
        <ModuleMobileHeader title="Ecom Subscription Plans" navigation={navigation} onBack={() => navigation.goBack()} />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={styles.container}
          onLayout={(e) => {
            const nw = Math.round(e.nativeEvent.layout.width);
            if (nw && nw !== boxW) setBoxW(nw);
          }}
        >
          <Text style={styles.pageTitle}>Ecom Subscription Plans</Text>
          <Text style={styles.pageSub}>Your plan status, all available plans and past plans for the Sell page.</Text>

          {loading ? (
            <ActivityIndicator color="#F97316" style={{ marginTop: 30 }} />
          ) : (
            <>
              {/* ── 1. ACTIVE PLAN ── */}
              <Text style={styles.sectionHead}>Active Plan</Text>
              {isActive && sub ? (
                <View style={styles.heroWrap}>
                  <ImageBackground
                    source={activeTheme.image}
                    resizeMode="cover"
                    style={styles.heroCard}
                    imageStyle={styles.bgImage}
                  >
                    <View style={[styles.heroInner, heroWide && { flexDirection: 'row', alignItems: 'stretch' }]}>
                      {/* left: plan info */}
                      <View style={[styles.heroLeft, heroWide && { flex: 1, paddingRight: 24 }]}>
                        <View style={styles.activeBadge}>
                          <View style={styles.activeDot} />
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                        <Text style={styles.activeName} numberOfLines={2}>{sub.plan_name || 'E-Commerce Plan'}</Text>
                        {sub.price !== undefined && sub.price !== null ? (
                          <Text style={styles.activePrice}>₹{sub.price}</Text>
                        ) : null}
                        <View style={styles.dateRow}>
                          <View style={styles.dateItem}>
                            <Text style={styles.dateLabel}>Purchased</Text>
                            <Text style={styles.dateValue}>{fmtDate(sub.purchased_at) || '-'}</Text>
                          </View>
                          <View style={styles.dateDivider} />
                          <View style={styles.dateItem}>
                            <Text style={styles.dateLabel}>Expires</Text>
                            <Text style={styles.dateValue}>{fmtDate(sub.expires_at) || '-'}</Text>
                          </View>
                        </View>
                      </View>

                      {/* right: stats */}
                      <View style={[styles.heroRight, heroWide && { flex: 1 }]}>
                        <View style={styles.statRow}>
                          <View style={styles.statBox}>
                            <Feather name="layers" size={16} color="rgba(255,255,255,0.85)" />
                            <Text style={styles.statValue}>{credits}</Text>
                            <Text style={styles.statLabel}>Available credits</Text>
                          </View>
                          {left !== null ? (
                            <View style={styles.statBox}>
                              <Feather name="clock" size={16} color="rgba(255,255,255,0.85)" />
                              <Text style={styles.statValue}>{Math.max(left, 0)}</Text>
                              <Text style={styles.statLabel}>Days left</Text>
                            </View>
                          ) : null}
                        </View>
                        {used !== null ? (
                          <View style={styles.progressWrap}>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, { width: `${Math.round(used * 100)}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{Math.round(used * 100)}% of plan period used</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Feather name="info" size={16} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No active plan right now. Choose a plan below to start selling.</Text>
                </View>
              )}

              {/* ── 2. ALL PLANS ── */}
              <Text style={styles.sectionHead}>All Plans</Text>
              {plans.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>No plans are available right now.</Text></View>
              ) : (
                <View style={styles.grid}>
                  {plans.map((plan, index) => {
                    const theme = getCardTheme(index);
                    const isCurrent = isActive && index === activePlanIndex;
                    const features = [plan.credits ? `${plan.credits} listing credits included` : null, ...FEATURES].filter(Boolean);
                    const busy = processingPlanId === plan.id;
                    return (
                      <View key={plan.id} style={{ width: cardW }}>
                        <ImageBackground
                          source={theme.image}
                          style={[styles.planCard, isCurrent && styles.planCardCurrent]}
                          imageStyle={styles.bgImage}
                          resizeMode="cover"
                        >
                          <View style={styles.planTop}>
                            <Text style={[styles.planName, { color: theme.textColor }]} numberOfLines={1}>{plan.label}</Text>
                            {isCurrent ? (
                              <View style={styles.currentPill}>
                                <Feather name="check" size={11} color="#15803d" />
                                <Text style={styles.currentPillText}>Current</Text>
                              </View>
                            ) : null}
                          </View>
                          {plan.duration ? (
                            <View style={styles.durationPill}>
                              <Feather name="calendar" size={11} color="#fff" />
                              <Text style={styles.durationText}>{plan.duration}</Text>
                            </View>
                          ) : null}

                          <Text style={[styles.planPrice, { color: theme.textColor }]}>₹{plan.price}</Text>

                          <View style={styles.featuresList}>
                            {features.slice(0, 4).map((f, i) => (
                              <View key={i} style={styles.featureRow}>
                                <View style={styles.featureTick}>
                                  <Feather name="check" size={10} color="#fff" />
                                </View>
                                <Text style={[styles.featureText, { color: theme.textColor }]} numberOfLines={2}>{f}</Text>
                              </View>
                            ))}
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={Boolean(processingPlanId)}
                            onPress={() => handlePay(plan)}
                            style={[styles.payBtn, processingPlanId && !busy && { opacity: 0.5 }]}
                          >
                            <Text style={styles.payBtnText} numberOfLines={1}>
                              {busy ? 'Processing…' : (isCurrent ? 'Renew' : 'Pay Now')}
                            </Text>
                            <Feather name="arrow-right" size={15} color="#b91c1c" />
                          </TouchableOpacity>
                        </ImageBackground>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ── 3. CLOSED PLANS ── */}
              <Text style={styles.sectionHead}>Closed Plans</Text>
              {closedPlans.length === 0 ? (
                <View style={styles.emptyBox}><Text style={styles.emptyText}>No closed plans yet.</Text></View>
              ) : (
                <View style={styles.grid}>
                  {closedPlans.map((c) => (
                    <View key={c.key} style={[styles.closedCard, { width: closedW }]}>
                      <View style={styles.closedTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.closedName} numberOfLines={1}>{c.planName}</Text>
                          {c.price !== undefined && c.price !== null ? <Text style={styles.closedPrice}>₹{c.price}</Text> : null}
                        </View>
                        <View style={styles.closedBadge}>
                          <Feather name="x-circle" size={12} color="#6B7280" />
                          <Text style={styles.closedBadgeText}>{c.reason}</Text>
                        </View>
                      </View>
                      <View style={styles.closedDates}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.closedDateLabel}>Purchased</Text>
                          <Text style={styles.closedDateValue}>{c.purchasedAt || '-'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.closedDateLabel}>Ended</Text>
                          <Text style={styles.closedDateValue}>{c.endedAt || '-'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 40 }} />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const shadow = Platform.select({
  web: { boxShadow: '0 4px 16px rgba(15,23,42,0.10)' },
  default: { elevation: 3, shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 20, alignItems: 'center' },
  container: { width: '100%', maxWidth: 1040 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 2 },
  pageSub: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  sectionHead: { fontSize: 17, fontWeight: '800', color: '#111827', marginTop: 26, marginBottom: 14 },

  // ImageBackground ke andar ka image — width/height style me nahi dete (web par half-width bug hota tha)
  bgImage: { borderRadius: 20, ...(Platform.OS === 'web' ? { width: '100%', height: '100%' } : null) },

  // Active hero
  heroWrap: { width: '100%', borderRadius: 20, backgroundColor: '#1d4ed8', ...shadow },
  heroCard: { width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#4c1d95' },
  heroInner: { padding: 22 },
  heroLeft: { justifyContent: 'center' },
  heroRight: { justifyContent: 'center', marginTop: 18 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  activeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  activeName: { color: '#fff', fontSize: 26, fontWeight: '800', textTransform: 'capitalize' },
  activePrice: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600', marginTop: 2, marginBottom: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' },
  dateItem: { minWidth: 96 },
  dateDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 14 },
  dateLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.6 },
  dateValue: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, gap: 4 },
  statValue: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 34 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  progressWrap: { marginTop: 14 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, marginTop: 6 },

  emptyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 16 },
  emptyText: { flex: 1, fontSize: 13, color: '#6B7280' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },

  // Plan card (sab barabar height)
  planCard: { minHeight: 300, borderRadius: 20, padding: 20, overflow: 'hidden', backgroundColor: '#4c1d95', borderWidth: 3, borderColor: 'transparent', justifyContent: 'space-between', ...shadow },
  planCardCurrent: { borderColor: '#22c55e' },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  planName: { flex: 1, fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  currentPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  currentPillText: { color: '#15803d', fontSize: 11, fontWeight: '800' },
  durationPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 8 },
  durationText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  planPrice: { fontSize: 34, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  featureTick: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  featureText: { flex: 1, fontSize: 13, lineHeight: 18 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'stretch', ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null) },
  payBtnText: { color: '#b91c1c', fontSize: 14, fontWeight: '800' },

  // Closed
  closedCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  closedTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  closedName: { color: '#111827', fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
  closedPrice: { color: '#6B7280', fontSize: 14, marginTop: 2 },
  closedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  closedBadgeText: { color: '#6B7280', fontSize: 11.5, fontWeight: '700' },
  closedDates: { flexDirection: 'row', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  closedDateLabel: { color: '#9CA3AF', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  closedDateValue: { color: '#111827', fontSize: 14, fontWeight: '700', marginTop: 2 },
});