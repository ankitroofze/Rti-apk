// pages/MyEcomSubscriptionScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// Ecom Subscription Plans — Enterprise-Grade SaaS Design:
//   1) Header Banner — Clean title, category pill & status indicator
//   2) Active Plan   — Premium glassmorphic hero card with real-time metrics
//   3) All Plans     — Responsive pricing cards with feature list & CTA
//   4) Closed Plans  — Archived subscription history with modern cards
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

const GAP = 20;

const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
};

const fmtDateDisplay = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatPlanTitle = (name) => {
  if (!name) return 'E-Commerce Plan';
  return String(name).replace(/Premuim/gi, 'Premium');
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
      `Do you want to subscribe to this E-Commerce plan? ${formatPlanTitle(plan.label)} — ₹${plan.price}`,
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
        planName: formatPlanTitle(sub.plan_name || 'E-Commerce Plan'),
        price: sub.price,
        purchasedAt: fmtDateDisplay(sub.purchased_at),
        endedAt: fmtDateDisplay(sub.expires_at),
        reason: left !== null && left < 0 ? 'Expired' : 'Credits used up',
      });
    }
    history.filter((h) => h.status !== 'active').forEach((h, i) => {
      out.push({
        key: `hist-${h.id ?? i}`,
        planName: formatPlanTitle(h.planName),
        price: h.price,
        purchasedAt: fmtDateDisplay(h.purchasedAt),
        endedAt: fmtDateDisplay(h.expiresAt),
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
  const cols = w >= 980 ? 3 : w >= 640 ? 2 : 1;
  const cardW = Math.floor((w - GAP * (cols - 1)) / cols);
  const closedCols = w >= 640 ? 2 : 1;
  const closedW = Math.floor((w - GAP * (closedCols - 1)) / closedCols);
  const heroWide = w >= 740;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
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
          {/* ── Page Header Banner ── */}
          <View style={styles.headerBanner}>
            <View style={styles.topBadgeRow}>
              <View style={styles.tagBadge}>
                <Feather name="shopping-bag" size={12} color="#4F46E5" />
                <Text style={styles.tagBadgeText}>E-COMMERCE SELLER HUB</Text>
              </View>
              {isActive ? (
                <View style={styles.statusLivePill}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.statusLiveText}>Subscription Active</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.pageTitle}>Ecom Subscription Plans</Text>
            <Text style={styles.pageSub}>
              Manage your active selling capacity, track listing credit balances, and discover plans designed for high-conversion farm produce & equipment sales.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loaderText}>Loading your subscription details…</Text>
            </View>
          ) : (
            <>
              {/* ── 1. ACTIVE PLAN ── */}
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Feather name="zap" size={17} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHead}>Active Plan</Text>
                  <Text style={styles.sectionSubHead}>Your current live selling allocation and expiration timeline</Text>
                </View>
              </View>

              {isActive && sub ? (
                <View style={styles.heroWrap}>
                  <ImageBackground
                    source={activeTheme.image}
                    resizeMode="cover"
                    style={styles.heroCard}
                    imageStyle={styles.bgImage}
                  >
                    <View style={[styles.heroInner, heroWide && { flexDirection: 'row', alignItems: 'stretch' }]}>
                      {/* Left: Plan Info */}
                      <View style={[styles.heroLeft, heroWide && { flex: 1.15, paddingRight: 28 }]}>
                        <View style={styles.activeBadge}>
                          <View style={styles.activeDot} />
                          <Text style={styles.activeBadgeText}>ACTIVE PLAN</Text>
                        </View>
                        <Text style={styles.activeName} numberOfLines={2}>
                          {formatPlanTitle(sub.plan_name || 'E-Commerce Plan')}
                        </Text>
                        {sub.price !== undefined && sub.price !== null ? (
                          <View style={styles.priceRowHero}>
                            <Text style={styles.activePrice}>₹{sub.price}</Text>
                            <Text style={styles.activePricePeriod}>/ package period</Text>
                          </View>
                        ) : null}

                        <View style={styles.dateBar}>
                          <View style={styles.dateBlock}>
                            <View style={styles.dateIconCircle}>
                              <Feather name="calendar" size={12} color="#ffffff" />
                            </View>
                            <View>
                              <Text style={styles.dateLabel}>PURCHASED</Text>
                              <Text style={styles.dateValue}>{fmtDateDisplay(sub.purchased_at)}</Text>
                            </View>
                          </View>
                          <View style={styles.dateDivider} />
                          <View style={styles.dateBlock}>
                            <View style={styles.dateIconCircle}>
                              <Feather name="clock" size={12} color="#ffffff" />
                            </View>
                            <View>
                              <Text style={styles.dateLabel}>EXPIRES</Text>
                              <Text style={styles.dateValue}>{fmtDateDisplay(sub.expires_at)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Right: Metrics & Progress */}
                      <View style={[styles.heroRight, heroWide && { flex: 1 }]}>
                        <View style={styles.statRow}>
                          <View style={styles.metricCard}>
                            <View style={styles.metricCardHeader}>
                              <View style={styles.metricIconWrap}>
                                <Feather name="layers" size={14} color="#ffffff" />
                              </View>
                              <Text style={styles.metricLabel}>AVAILABLE CREDITS</Text>
                            </View>
                            <Text style={styles.metricValue}>{credits}</Text>
                            <Text style={styles.metricNote}>Listings remaining</Text>
                          </View>
                          {left !== null ? (
                            <View style={styles.metricCard}>
                              <View style={styles.metricCardHeader}>
                                <View style={styles.metricIconWrap}>
                                  <Feather name="clock" size={14} color="#ffffff" />
                                </View>
                                <Text style={styles.metricLabel}>DAYS REMAINING</Text>
                              </View>
                              <Text style={styles.metricValue}>{Math.max(left, 0)}</Text>
                              <Text style={styles.metricNote}>{left <= 5 ? 'Expiring soon' : 'Valid & active'}</Text>
                            </View>
                          ) : null}
                        </View>

                        {used !== null ? (
                          <View style={styles.progressContainer}>
                            <View style={styles.progressHeaderRow}>
                              <Text style={styles.progressHeaderLabel}>Duration Consumed</Text>
                              <Text style={styles.progressPercent}>{Math.round(used * 100)}% Used</Text>
                            </View>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, { width: `${Math.round(used * 100)}%` }]} />
                            </View>
                            <Text style={styles.progressSubtext}>
                              {left !== null ? `${Math.max(left, 0)} days left until next renewal` : 'Active plan timeline'}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              ) : (
                <View style={styles.emptyHeroCard}>
                  <View style={styles.emptyHeroIconWrap}>
                    <Feather name="shopping-bag" size={24} color="#6366F1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyHeroTitle}>No Active Seller Subscription</Text>
                    <Text style={styles.emptyHeroText}>
                      You currently do not have an active listing package. Choose one of the verified plans below to list products and receive direct buyer enquiries.
                    </Text>
                  </View>
                </View>
              )}

              {/* ── 2. ALL PLANS ── */}
              <View style={[styles.sectionHeaderRow, { marginTop: 34 }]}>
                <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                  <Feather name="grid" size={17} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHead}>Available Plans</Text>
                  <Text style={styles.sectionSubHead}>Select a tailored capacity plan to boost your sales reach</Text>
                </View>
              </View>

              {plans.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Feather name="inbox" size={20} color="#94A3B8" />
                  <Text style={styles.emptyText}>No subscription plans are available at this moment. Please check back shortly.</Text>
                </View>
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
                          {/* Current Active Badge Overlay */}
                          {isCurrent ? (
                            <View style={styles.topCurrentRibbon}>
                              <Feather name="check-circle" size={12} color="#15803d" />
                              <Text style={styles.topCurrentRibbonText}>CURRENT ACTIVE PLAN</Text>
                            </View>
                          ) : null}

                          <View style={styles.planCardTop}>
                            <View style={styles.planHeaderRow}>
                              <Text style={[styles.planName, { color: theme.textColor }]} numberOfLines={1}>
                                {formatPlanTitle(plan.label)}
                              </Text>
                            </View>

                            {plan.duration ? (
                              <View style={styles.durationPill}>
                                <Feather name="calendar" size={11} color="rgba(255,255,255,0.95)" />
                                <Text style={styles.durationText}>{plan.duration}</Text>
                              </View>
                            ) : null}

                            <View style={styles.priceContainer}>
                              <Text style={[styles.planPrice, { color: theme.textColor }]}>₹{plan.price}</Text>
                              <Text style={styles.planPriceSub}>one-time subscription</Text>
                            </View>

                            <View style={styles.featuresList}>
                              {features.slice(0, 4).map((f, i) => (
                                <View key={i} style={styles.featureRow}>
                                  <View style={styles.featureTick}>
                                    <Feather name="check" size={10} color="#ffffff" />
                                  </View>
                                  <Text style={[styles.featureText, { color: theme.textColor }]} numberOfLines={2}>
                                    {f}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.88}
                            disabled={Boolean(processingPlanId)}
                            onPress={() => handlePay(plan)}
                            style={[
                              styles.payBtn,
                              isCurrent ? styles.payBtnCurrent : null,
                              processingPlanId && !busy && { opacity: 0.5 },
                            ]}
                          >
                            <Text style={[styles.payBtnText, isCurrent ? styles.payBtnTextCurrent : null]} numberOfLines={1}>
                              {busy ? 'Processing…' : (isCurrent ? 'Renew Plan' : 'Subscribe Now')}
                            </Text>
                            <Feather name="arrow-right" size={15} color={isCurrent ? '#15803d' : '#b91c1c'} />
                          </TouchableOpacity>
                        </ImageBackground>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ── 3. CLOSED PLANS ── */}
              <View style={[styles.sectionHeaderRow, { marginTop: 36 }]}>
                <View style={[styles.sectionIconWrap, { backgroundColor: '#F1F5F9' }]}>
                  <Feather name="archive" size={17} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHead}>Closed Plans</Text>
                  <Text style={styles.sectionSubHead}>Historical record of expired and utilized plans</Text>
                </View>
              </View>

              {closedPlans.length === 0 ? (
                <View style={styles.emptyClosedCard}>
                  <View style={styles.emptyClosedIconWrap}>
                    <Feather name="inbox" size={20} color="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyClosedTitle}>No Closed Plans</Text>
                    <Text style={styles.emptyClosedText}>
                      Your expired or previously renewed subscription packages will be archived here for recordkeeping.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.grid}>
                  {closedPlans.map((c) => (
                    <View key={c.key} style={[styles.closedCard, { width: closedW }]}>
                      <View style={styles.closedTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.closedName} numberOfLines={1}>{c.planName}</Text>
                          {c.price !== undefined && c.price !== null ? (
                            <Text style={styles.closedPrice}>₹{c.price}</Text>
                          ) : null}
                        </View>
                        <View style={styles.closedBadge}>
                          <Feather name="slash" size={11} color="#64748B" />
                          <Text style={styles.closedBadgeText}>{c.reason}</Text>
                        </View>
                      </View>
                      <View style={styles.closedDates}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.closedDateLabel}>PURCHASED</Text>
                          <Text style={styles.closedDateValue}>{c.purchasedAt || '-'}</Text>
                        </View>
                        <View style={styles.closedDivider} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.closedDateLabel}>ENDED</Text>
                          <Text style={styles.closedDateValue}>{c.endedAt || '-'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 48 }} />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const shadowHero = Platform.select({
  web: { boxShadow: '0 12px 36px -6px rgba(79, 70, 229, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.08)' },
  default: { elevation: 6, shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
});

const shadowCard = Platform.select({
  web: { boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.06)' },
  default: { elevation: 4, shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
  container: { width: '100%', maxWidth: 1080 },

  // Header Banner
  headerBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' },
      default: { elevation: 1 },
    }),
  },
  topBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagBadgeText: { color: '#4F46E5', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6 },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  statusLiveText: { color: '#15803D', fontSize: 11.5, fontWeight: '700' },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.4, marginBottom: 6 },
  pageSub: { fontSize: 13.5, color: '#64748B', lineHeight: 20, maxWidth: 840 },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  sectionSubHead: { fontSize: 12.5, color: '#64748B', marginTop: 1 },

  // Loader
  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loaderText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // Background Image
  bgImage: { borderRadius: 22, ...(Platform.OS === 'web' ? { width: '100%', height: '100%' } : null) },

  // Active Hero Card
  heroWrap: { width: '100%', borderRadius: 24, backgroundColor: '#312E81', ...shadowHero },
  heroCard: { width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#312E81' },
  heroInner: { padding: 26 },
  heroLeft: { justifyContent: 'space-between' },
  heroRight: { justifyContent: 'space-between', marginTop: 20 },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  activeBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  activeName: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: -0.3, textTransform: 'capitalize' },
  priceRowHero: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4, marginBottom: 18 },
  activePrice: { color: '#ffffff', fontSize: 24, fontWeight: '800' },
  activePricePeriod: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500' },

  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'flex-start',
  },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 115 },
  dateIconCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  dateDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 14 },
  dateLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.7 },
  dateValue: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginTop: 1 },

  // Hero Right Stats
  statRow: { flexDirection: 'row', gap: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  metricCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  metricIconWrap: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  metricLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  metricValue: { color: '#ffffff', fontSize: 32, fontWeight: '900', lineHeight: 36 },
  metricNote: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 4 },

  progressContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressHeaderLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  progressPercent: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: '#38BDF8' },
  progressSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6 },

  // Empty Hero Card
  emptyHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' },
      default: { elevation: 2 },
    }),
  },
  emptyHeroIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  emptyHeroTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  emptyHeroText: { fontSize: 13, color: '#64748B', lineHeight: 19 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },

  // Plan Card
  planCard: {
    minHeight: 340,
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
    backgroundColor: '#312E81',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'space-between',
    ...shadowCard,
  },
  planCardCurrent: {
    borderColor: '#10B981',
    ...Platform.select({
      web: { boxShadow: '0 12px 32px -4px rgba(16, 185, 129, 0.28), 0 2px 8px rgba(0,0,0,0.06)' },
      default: { elevation: 6 },
    }),
  },
  topCurrentRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  topCurrentRibbonText: { color: '#15803D', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  planCardTop: { flex: 1 },
  planHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  planName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.2, textTransform: 'capitalize' },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  durationText: { color: '#ffffff', fontSize: 11.5, fontWeight: '700' },
  priceContainer: { marginTop: 14, marginBottom: 16 },
  planPrice: { fontSize: 36, fontWeight: '900', letterSpacing: -0.5 },
  planPriceSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  featuresList: { gap: 10, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureTick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: '500' },

  // Pay Button
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignSelf: 'stretch',
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)' },
      default: { elevation: 2 },
    }),
  },
  payBtnCurrent: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  payBtnText: { color: '#B91C1C', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  payBtnTextCurrent: { color: '#15803D' },

  // Empty Box
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
  },
  emptyText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 19 },

  // Empty Closed Card
  emptyClosedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyClosedIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  emptyClosedTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  emptyClosedText: { fontSize: 12.5, color: '#64748B', lineHeight: 18 },

  // Closed Cards
  closedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' },
      default: { elevation: 1 },
    }),
  },
  closedTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  closedName: { color: '#0F172A', fontSize: 16, fontWeight: '800', textTransform: 'capitalize' },
  closedPrice: { color: '#475569', fontSize: 13.5, fontWeight: '700', marginTop: 2 },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  closedBadgeText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  closedDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  closedDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  closedDateLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  closedDateValue: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginTop: 2 },
});
