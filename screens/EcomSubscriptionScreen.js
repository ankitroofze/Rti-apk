// screens/EcomSubscriptionScreen.js
// ─────────────────────────────────────────────────────────
// E-Commerce (Sell page) Subscription screen.
// Same pattern as QuizSubscriptionScreen.js — user yaha tabhi aata hai jab
// usne "Sell" pe click kiya ho lekin uska koi active ecom subscription na
// ho (see screens/SellScreen.js gate). Purchase + Razorpay verify ke baad
// wapas usi screen pe redirect kar deta hai jahan se aaya tha (default: Sell).
// ─────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';

const C = {
  orange:      '#F97316',
  orangeLight: '#FFF7ED',
  orangeMid:   '#FDBA74',
  white:       '#FFFFFF',
  pageBg:      '#F3F4F6',
  surface:     '#F9FAFB',
  textDark:    '#111111',
  textMid:     '#555555',
  textMuted:   '#9CA3AF',
  border:      '#E5E7EB',
  green:       '#16a34a',
  greenLight:  '#F0FDF4',
  greenMid:    '#86EFAC',
};

// Static fallback (backend /ecom-subscriptions response na aane tak)
const PLANS = [
  { id: 'ecome-starter-monthly', label: 'Starter', price: 499, credits: 10, duration: '30 Days', validity_days: 30, tag: null },
  { id: 'ecome-growth-monthly', label: 'Growth', price: 899, credits: 25, duration: '30 Days', validity_days: 30, tag: 'Popular' },
  { id: 'ecome-power-monthly', label: 'Power', price: 1499, credits: 50, duration: '30 Days', validity_days: 30, tag: 'Best Value' },
];

const FEATURES = [
  'Post product listings on the Sell page',
  'Fixed number of listing credits per plan',
  'Buyer enquiries directly on your listings',
  'Manage / edit listings anytime',
];

export default function EcomSubscriptionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { showToast, showPopup } = useToast();

  // Jahan se user redirect hua tha (default: Sell page) — purchase complete
  // hone ke baad wahi wapas bhej dena hai.
  const redirectTo = route?.params?.redirectTo || 'Sell';
  const redirectParams = route?.params?.redirectParams || undefined;

  const [plans, setPlans] = useState(PLANS);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [loading, setLoading] = useState(false);
  const [existingCredits, setExistingCredits] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const backendPlans = await UserStore.getEcomSubscriptionPlans();
      if (!active || !backendPlans.length) return;
      setPlans(backendPlans);
      setSelectedPlan(backendPlans[1]?.id ?? backendPlans[0]?.id);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await UserStore.getCurrentUser();
      if (!active || !user) return;
      const hasSub = UserStore.hasActiveEcomSubscription(user);
      setExistingCredits(hasSub ? Number(user.ecome_credits || 0) : null);
    })();
    return () => { active = false; };
  }, []);

  const doSubscribe = useCallback(async () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      const orderRes = await UserStore.createEcomOrder({ planId: plan.id });
      if (!orderRes?.ok) {
        setLoading(false);
        showToast(orderRes?.message || 'Unable to start payment. Please try again.', 'error');
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
          setLoading(false);

          if (!verifyRes?.ok) {
            showToast(verifyRes?.message || 'Payment verification failed.', 'error');
            return;
          }

          showToast('E-Commerce Subscription activated! You can now post listings on Sell.', 'success');
          navigation.replace(redirectTo, redirectParams);
        },
        onFailed: async (errorInfo) => {
          setLoading(false);
          await UserStore.markPaymentFailed(
            errorInfo.razorpay_order_id,
            errorInfo.error_code,
            errorInfo.error_description
          );
          showToast(errorInfo.error_description || 'Payment failed or cancelled.', 'error');
        },
      });
    } catch (e) {
      setLoading(false);
      showToast('Something went wrong. Please try again.', 'error');
    }
  }, [selectedPlan, plans, navigation, redirectTo, redirectParams, showToast]);

  const handleSubscribe = useCallback(() => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    showPopup(
      `Do you want to subscribe to the ${plan.label} E-Commerce plan for ₹${plan.price}?`,
      'info',
      {
        primaryLabel: 'Subscribe',
        secondaryLabel: 'Cancel',
        onPrimaryPress: doSubscribe,
      }
    );
  }, [selectedPlan, plans, doSubscribe, showPopup]);

  const selectedPlanObj = plans.find((p) => p.id === selectedPlan);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={{ height: insets.top, backgroundColor: C.white }} />

      {/* Back Header */}
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => navigation.goBack()}
        activeOpacity={0.75}
      >
        <Feather name="arrow-left" size={20} color={C.orange} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Feather name="shopping-bag" size={28} color={C.white} />
          </View>
          <Text style={styles.heroEyebrow}>Sell on RTI News</Text>
          <Text style={styles.heroTitle}>E-Commerce Subscription</Text>
          <Text style={styles.heroSubtitle}>
            An active subscription is required to post a product on the Sell page
          </Text>
        </View>

        {existingCredits !== null && (
          <View style={styles.remainingBanner}>
            <Feather name={existingCredits > 0 ? 'check-circle' : 'alert-circle'} size={14} color={existingCredits > 0 ? C.green : C.orange} />
            <Text style={styles.remainingBannerText}>
              {existingCredits > 0
                ? `You have ${existingCredits} listing credit${existingCredits === 1 ? '' : 's'} remaining on your current plan.`
                : `Your listing credits are used up. Buy a new plan to keep selling.`}
            </Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What you'll get</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Feather name="check" size={13} color={C.green} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plan Cards */}
        <Text style={styles.choosePlanLabel}>Choose a plan</Text>

        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.tag ? (
                <View style={styles.planTagWrap}>
                  <View style={styles.planTag}>
                    <Text style={styles.planTagText}>{plan.tag}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.planRow}>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                <View style={styles.planInfo}>
                  <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                    {plan.label}
                  </Text>
                  {plan.credits ? (
                    <Text style={styles.planQuizCount}>
                      {plan.credits} listing credits included
                    </Text>
                  ) : null}
                </View>

                <View style={styles.planPriceWrap}>
                  <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                    ₹{plan.price}
                  </Text>
                  <Text style={styles.planDuration}>{plan.duration}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.noteRow}>
          <Feather name="info" size={13} color={C.textMuted} />
          <Text style={styles.noteText}>
            Each plan gives you a fixed number of listing credits. Once your credits are used up, you'll need to buy a new subscription to keep posting on the Sell page.
          </Text>
        </View>
      </ScrollView>

      {/* Subscribe Button — sticky bottom */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <>
              <Feather name="zap" size={16} color={C.white} />
              <Text style={styles.subscribeBtnText}>
                Subscribe — ₹{selectedPlanObj?.price}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.pageBg },
  scrollView:    { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  backRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingHorizontal: 20,
    paddingVertical:   14,
    backgroundColor:   C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backText: { color: C.orange, fontSize: 14, fontWeight: '500' },

  heroCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: C.orange,
    borderRadius:    18,
    padding:         24,
    marginBottom:    16,
    alignItems:      'flex-start',
  },
  heroIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius:    12,
    padding:         10,
    marginBottom:    14,
  },
  heroEyebrow: {
    fontSize:      11,
    color:         '#FED7AA',
    fontWeight:    '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom:  6,
  },
  heroTitle: {
    fontSize:     26,
    fontWeight:   '600',
    color:        C.white,
    lineHeight:   32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize:   13,
    color:      '#FED7AA',
    lineHeight: 20,
  },

  remainingBanner: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  remainingBannerText: { flex: 1, fontSize: 12.5, color: C.textMid, fontWeight: '500', lineHeight: 18 },

  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: C.white,
    borderRadius:    16,
    padding:         18,
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     C.border,
  },
  sectionTitle: {
    fontSize:     15,
    fontWeight:   '600',
    color:        C.textDark,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  10,
  },
  featureCheck: {
    backgroundColor: C.greenLight,
    borderRadius:    999,
    width:           24,
    height:          24,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     C.greenMid,
  },
  featureText: { fontSize: 13, color: C.textMid, fontWeight: '500', flex: 1 },

  choosePlanLabel: {
    width: '100%',
    maxWidth: 720,
    fontSize:      13,
    fontWeight:    '600',
    color:         C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  10,
  },

  planCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: C.white,
    borderRadius:    14,
    padding:         16,
    marginBottom:    12,
    borderWidth:     1.5,
    borderColor:     C.border,
  },
  planCardSelected: {
    borderColor:     C.orange,
    backgroundColor: C.orangeLight,
  },

  planTagWrap: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    marginBottom:   10,
  },
  planTag: {
    backgroundColor:  C.orange,
    borderRadius:     999,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  planTagText: { fontSize: 11, fontWeight: '600', color: C.white },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width:          20,
    height:         20,
    borderRadius:   10,
    borderWidth:    2,
    borderColor:    C.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.orange },
  radioDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: C.orange,
  },

  planInfo:          { flex: 1 },
  planLabel:         { fontSize: 15, fontWeight: '600', color: C.textDark },
  planLabelSelected: { color: C.orange },
  planQuizCount:     { fontSize: 12, color: C.green, fontWeight: '600', marginTop: 4 },

  planPriceWrap:     { alignItems: 'flex-end' },
  planPrice:         { fontSize: 20, fontWeight: '700', color: C.textDark },
  planPriceSelected: { color: C.orange },
  planDuration:      { fontSize: 11, color: C.textMuted, marginTop: 2 },

  noteRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             8,
    marginTop:       6,
    marginBottom:    20,
    padding:         14,
    backgroundColor: C.surface,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     C.border,
    width: '100%',
    maxWidth: 720,
  },
  noteText: { flex: 1, fontSize: 12, color: C.textMuted, lineHeight: 18 },

  stickyBottom: {
    backgroundColor:   C.white,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    paddingHorizontal: 20,
    paddingTop:        14,
    alignItems:        'center',
  },
  subscribeBtn: {
    width:            '100%',
    maxWidth:         720,
    backgroundColor: C.orange,
    borderRadius:    14,
    paddingVertical: 15,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText:     { fontSize: 16, fontWeight: '600', color: C.white },
});
