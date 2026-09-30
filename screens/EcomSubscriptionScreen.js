// screens/EcomSubscriptionScreen.js
// ─────────────────────────────────────────────────────────────
// E-Commerce (Sell page) Subscription screen.
// Same design as Role/Membership Subscription page — isliye
// implement karta hai components/SubscriptionPlanPurchase.js
// (see that file's header comment for why). User yaha tabhi aata
// hai jab usne "Sell" pe click kiya ho lekin uska koi active ecom
// subscription na ho (see screens/SellScreen.js gate). Purchase +
// Razorpay verify ke baad wapas usi screen pe redirect kar deta
// hai jahan se aaya tha (default: Sell).
// ─────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import SubscriptionPlanPurchase from '../components/SubscriptionPlanPurchase';

const FEATURES = [
  'Post product listings on the Sell page',
  'Buyer enquiries directly on your listings',
  'Manage / edit listings anytime',
];

// Static fallback (backend /ecom-subscriptions response na aane tak)
const PLANS = [
  { id: 'ecome-starter-monthly', label: 'Starter', price: 499,  credits: 10, duration: '30 Days', validity_days: 30, tag: null },
  { id: 'ecome-growth-monthly',  label: 'Growth',   price: 899,  credits: 25, duration: '30 Days', validity_days: 30, tag: 'Popular' },
  { id: 'ecome-power-monthly',   label: 'Power',    price: 1499, credits: 50, duration: '30 Days', validity_days: 30, tag: 'Best Value' },
];

// Backend/static plan shape -> shared UI ka common plan shape
const toUiPlan = (plan) => ({
  id: plan.id,
  name: plan.label,
  duration: plan.duration,
  price: plan.price,
  originalPrice: null,
  popular: plan.tag === 'Popular' || plan.tag === 'Best Value',
  features: [
    plan.credits ? `${plan.credits} listing credits included` : null,
    ...FEATURES,
  ].filter(Boolean),
});

export default function EcomSubscriptionScreen({ navigation, route }) {
  const { showPopup } = useToast();

  // Jahan se user redirect hua tha (default: Sell page) — purchase complete
  // hone ke baad wahi wapas bhej dena hai.
  const redirectTo = route?.params?.redirectTo || 'Sell';
  const redirectParams = route?.params?.redirectParams || undefined;

  const [plans, setPlans] = useState(PLANS);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [loading, setLoading] = useState(false);
const [plansLoading, setPlansLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [existingCredits, setExistingCredits] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const backendPlans = await UserStore.getEcomSubscriptionPlans();
      if (active && backendPlans.length) {
        setPlans(backendPlans);
        setSelectedPlan(backendPlans[1]?.id ?? backendPlans[0]?.id);
      }
      if (active) setPlansLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await UserStore.getCurrentUserSynced();
      if (!active || !user) return;
      const hasSub = UserStore.hasActiveEcomSubscription(user);
      setExistingCredits(hasSub ? Number(user.ecome_credits || 0) : null);
    })();
    return () => { active = false; };
  }, []);

  const doSubscribe = useCallback(async (plan) => {
    setProcessingPlanId(plan?.id ?? null);
    if (!plan) return;
    setLoading(true);
    try {
      const orderRes = await UserStore.createEcomOrder({ planId: plan.id });
      if (!orderRes?.ok) {
        setLoading(false);
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
          setLoading(false);

          if (!verifyRes?.ok) {
            showPopup(verifyRes?.message || 'Payment verification failed.', 'error');
            return;
          }

          showPopup('E-Commerce Subscription activated! You can now post listings on Sell.', 'success');
          navigation.replace(redirectTo, redirectParams);
        },
        onFailed: async (errorInfo) => {
          setLoading(false);
          await UserStore.markPaymentFailed(
            errorInfo.razorpay_order_id,
            errorInfo.error_code,
            errorInfo.error_description
          );
          showPopup(errorInfo.error_description || 'Payment failed or cancelled.', 'error');
        },
      });
    } catch (e) {
      setLoading(false);
      showPopup('Something went wrong. Please try again.', 'error');
    }
  }, [navigation, redirectTo, redirectParams, showPopup]);

  const handlePay = useCallback((uiPlan) => {
    const plan = plans.find((p) => p.id === uiPlan.id);
    if (!plan) return;
    showPopup(
      `Do you want to subscribe to the ${plan.label} E-Commerce plan for ₹${plan.price}?`,
      'info',
      {
        primaryLabel: 'Subscribe',
        secondaryLabel: 'Cancel',
        onPrimaryPress: () => doSubscribe(plan),
      }
    );
  }, [plans, doSubscribe, showPopup]);

  return (
    <SubscriptionPlanPurchase
      navigation={navigation}
      headerTitle="Ecom Subscription"
      heroTitle="Choose Your E-Commerce Plan"
      heroSubtitle="An active subscription is required to post a product on the Sell page."
      loading={plansLoading}
      plans={plans.map(toUiPlan)}
      selectedPlanId={selectedPlan}
      onSelectPlan={(plan) => setSelectedPlan(plan.id)}
      statusCard={
        existingCredits !== null
          ? {
              isActive: existingCredits > 0,
              countLabel: existingCredits > 0
                ? `${existingCredits} listing credit${existingCredits === 1 ? '' : 's'} remaining`
                : 'Your listing credits are used up — buy a new plan to keep selling.',
            }
          : null
      }
      onPay={loading ? undefined : handlePay}
payLabel="Pay Now"
      processingPlanId={loading ? processingPlanId : null}
    />
  );
}