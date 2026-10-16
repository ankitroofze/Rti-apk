// pages/AdPlansScreen.js
// ─────────────────────────────────────────────────────────────
// Ads Subscription screen.
// Same design as Role/Membership Subscription page — isliye
// implement karta hai components/SubscriptionPlanPurchase.js
// (see that file's header comment for why).
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi'; // ⚠️ path apne project structure ke hisaab se confirm/adjust kar lena
import { useToast } from '../components/ui/ToastProvider';
import SubscriptionPlanPurchase from '../components/SubscriptionPlanPurchase';

const normalizePlan = (raw, index) => {
  const id = raw?.id ?? `plan-${index}`;
  const credits = Number(raw?.credits ?? 0);
  const validityDays = Number(raw?.days ?? 30); // days null ho to 30 default

  const basePrice = Number(raw?.price ?? 0);
  const hasOffer  = raw?.offer_price !== null && raw?.offer_price !== undefined && Number(raw.offer_price) > 0;
  const finalPrice = hasOffer ? Number(raw.offer_price) : basePrice;

  const features = [];
  if (raw?.description) features.push(raw.description); // admin-panel se aaya description
  features.push(`${credits} Ad Credits`);
  features.push('Edit Ads (1 credit each)');

  return {
    id:            String(id),
    name:          raw?.title || `${credits} Credits Plan`, // title null ho sakta hai
    price:         finalPrice,
    originalPrice: hasOffer ? basePrice : null, // offer hai to asli price strike-through dikhane ke liye
    credits,
    duration:      `${validityDays} Days`,
    validity_days: validityDays,
    popular:       false, // API mein abhi "popular" jaisa koi flag nahi hai
    features,
    raw, // original API object safe rakha — purchase call mein kaam aa sakta hai
  };
};

export default function AdPlansScreen({ navigation, route }) {
  const { showPopup } = useToast();

  const [plans, setPlans] = useState([]);
 const [plansLoading, setPlansLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [plansError, setPlansError] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);
    const [currentCredits, setCurrentCredits] = useState(0);
  const [adSub, setAdSub] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  // ── Fetch plans (API) + current credits summary ──────────────────────────
  useEffect(() => {
    (async () => {
      const [plansResult, summary] = await Promise.all([
        AuthAPI.getAdSubscriptionPlans(),
        UserStore.getAdCreditsSummary(),
      ]);

      if (plansResult?.ok) {
        // status === 0 wale plans admin-panel se disable kiye gaye hote hain, unhe list mein mat dikhao
        const activeOnly = (plansResult.plans || []).filter(p => Number(p?.status) !== 0);
        const normalized = activeOnly.map(normalizePlan);
        setPlans(normalized);
        // Default selection: popular plan agar hai, warna pehla plan
        const defaultPlan = normalized.find(p => p.popular) || normalized[0];
        if (defaultPlan) setSelectedPlan(defaultPlan.id);
      } else {
        setPlansError(plansResult?.message || 'Could not load the plans.');
      }
      setPlansLoading(false);

      if (summary) {
        setCurrentCredits(summary.credits || 0);
        setAdSub(summary.ad_subscription || null);
      }
      setLoadingData(false);
    })();
  }, []);
const doBuy = useCallback(async (plan) => {
    setProcessingPlanId(plan?.id ?? null);
  
    if (!plan) return;
    setLoading(true);
    const orderResult = await UserStore.createAdOrder({ planId: plan.id });
    if (!orderResult?.ok) {
      setLoading(false);
      showPopup(orderResult?.message || 'Unable to create order.', 'error');
      return;
    }

    await openRazorpayCheckout(orderResult.razorpay, 'ads', {
      onVerified: async (response) => {
        const verifyResult = await UserStore.verifyAdPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          plan,
        });
        setLoading(false);

        if (verifyResult?.ok) {
          setCurrentCredits(verifyResult.credits || 0);
          try {
            const fresh = await UserStore.getAdCreditsSummary();
            if (fresh) { setCurrentCredits(fresh.credits || 0); setAdSub(fresh.ad_subscription || null); }
          } catch (e) { /* ignore */ }
          showPopup(`🎉 ${plan.credits} credits added! Total: ${verifyResult.credits}`, 'success');
          setTimeout(() => {
            try {
              const returnTo = route?.params?.returnTo;
              navigation.navigate(returnTo === 'MyAds' ? 'MyAds' : 'Advertise');
            } catch (e) { navigation.goBack(); }
          }, 1500);
        } else {
          showPopup(verifyResult?.message || 'Payment verification failed.', 'error');
        }
      },
      onFailed: async (errorInfo) => {
        setLoading(false);
        await UserStore.markPaymentFailed(
          errorInfo.razorpay_order_id,
          errorInfo.error_code,
          errorInfo.error_description
        );
        showPopup(errorInfo.error_description || 'Payment failed.', 'error');
      },
    });
  }, [navigation, route, showPopup]);

  const handlePay = useCallback((uiPlan) => {
    const plan = plans.find(p => p.id === uiPlan.id);
    if (!plan) return;
    showPopup(
      `Buy ${plan.credits} ad credits for ₹${plan.price}?`,
      'info',
      {
        primaryLabel: 'Buy',
        secondaryLabel: 'Cancel',
        onPrimaryPress: () => doBuy(plan),
      }
    );
  }, [plans, doBuy, showPopup]);

  return (
    <SubscriptionPlanPurchase
      navigation={navigation}
      headerTitle="Ads Subscription"
      heroTitle="Choose Your Ad Credit Plan"
      heroSubtitle="Credits are used to post and edit ads. 1 credit = 1 post or 1 edit."
      loading={plansLoading}
      plans={plans}
      selectedPlanId={selectedPlan}
      onSelectPlan={(plan) => setSelectedPlan(plan.id)}
      statusCard={
        !loadingData
          ? {
              isActive: currentCredits > 0,
              planName: adSub?.plan_name,
              price: adSub?.price,
              purchasedAt: adSub?.purchased_at,
              expiresAt: adSub?.expires_at,
              countLabel: currentCredits > 0
                ? `${currentCredits} ad credit${currentCredits === 1 ? '' : 's'} available`
                : 'No ad credits available — buy a plan to start posting.',
            }
          : null
      }
      onPay={loading ? undefined : handlePay}
     payLabel="Pay Now"
      processingPlanId={loading ? processingPlanId : null}
      emptyText={plansError || 'No ad plans are available right now.'}
    />
  );
}