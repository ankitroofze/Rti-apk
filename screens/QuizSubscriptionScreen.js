// screens/QuizSubscriptionScreen.js
// ─────────────────────────────────────────────────────────
// Same design as Role/Membership Subscription page — isliye
// implement karta hai components/SubscriptionPlanPurchase.js
// (see that file's header comment for why).
// ─────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import SubscriptionPlanPurchase from '../components/SubscriptionPlanPurchase';

const FEATURES = [
  'All certification quizzes unlocked',
  'Instant result access',
  'Progress tracking',
];

// Static fallback (backend response na aane tak) — quizCount = is plan me kitne quiz
// attempts milte hain. Ek baar quizCount khatam ho jaaye to expiry baaki hone ke bawajood
// dobara subscription lena padega (see UserStore.hasActiveQuizSubscription).
const PLANS = [
  { id: '1', label: '1 Month',  price: 299, duration: 1, unit: 'month',  tag: null,         quizCount: 5 },
  { id: '2', label: '2 Months', price: 399, duration: 2, unit: 'months', tag: 'Popular',     quizCount: 12 },
  { id: '3', label: '3 Months', price: 499, duration: 3, unit: 'months', tag: 'Best Value',  quizCount: 20 },
];

// Backend/static plan shape -> shared UI ka common plan shape
const toUiPlan = (plan) => ({
  id: plan.id,
  name: plan.label,
  duration: `${plan.duration} ${plan.unit}`,
  price: plan.price,
  originalPrice: null,
  popular: plan.tag === 'Popular' || plan.tag === 'Best Value',
  features: [
    plan.quizCount ? `${plan.quizCount} quiz attempts included` : null,
    ...FEATURES,
  ].filter(Boolean),
});

export default function QuizSubscriptionScreen({ navigation, route }) {
  const { showPopup } = useToast();

  const quizItem   = route?.params?.quizItem ?? null;
  const subject    = route?.params?.subject ?? null;
  const difficulty = route?.params?.difficulty ?? null;

  const [plans, setPlans]               = useState(PLANS); // static fallback until backend responds
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [loading, setLoading]           = useState(false);
 const [plansLoading, setPlansLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [remainingCount, setRemainingCount] = useState(null); // null = no existing / unlimited-legacy sub

  useEffect(() => {
    let active = true;
    (async () => {
      const backendPlans = await UserStore.getQuizSubscriptionPlans();
      if (active && backendPlans.length) {
        setPlans(backendPlans);
        setSelectedPlan(backendPlans[1]?.id ?? backendPlans[0]?.id);
      }
      if (active) setPlansLoading(false);
    })();
    return () => { active = false; };
  }, []);

  // Agar user yaha isliye redirect hua kyunki uske quiz attempts khatam ho gaye the
  // (expiry baaki thi phir bhi), to usko clearly bata do ki kitne attempts bache hain.
  useEffect(() => {
    let active = true;
    (async () => {
      const user = await UserStore.getCurrentUser();
      if (!active || !user) return;
      const remaining = UserStore.getQuizSubscriptionRemainingCount(user);
      const total = user.quiz_subscription_total_count;
      if (total !== undefined && total !== null) setRemainingCount(remaining ?? 0);
    })();
    return () => { active = false; };
  }, []);

 const doSubscribe = useCallback(async (plan) => {
    setProcessingPlanId(plan?.id ?? null);
    if (!plan) return;
    setLoading(true);
    try {
      const orderRes = await UserStore.createQuizSubscriptionOrder({ planId: plan.id });
      if (!orderRes?.ok) {
        setLoading(false);
        showPopup(orderRes?.message || 'Unable to start payment. Please try again.', 'error');
        return;
      }

      await openRazorpayCheckout(orderRes.razorpay, 'quiz', {
        onVerified: async (response) => {
          const verifyRes = await UserStore.verifyQuizPayment({
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

          showPopup('Quiz Subscription activated! You can now attempt all quizzes.', 'success');
          if (quizItem) {
            navigation.replace('AttemptQuiz', { quiz: quizItem, subject, difficulty });
          } else {
            navigation.goBack();
          }
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
  }, [navigation, quizItem, subject, difficulty, showPopup]);

  const handlePay = useCallback((uiPlan) => {
    const plan = plans.find((p) => p.id === uiPlan.id);
    if (!plan) return;
    showPopup(
      `Do you want to subscribe to ${plan.label} Quiz Subscription for ₹${plan.price}?`,
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
      headerTitle="Quiz Subscription"
      heroTitle="Choose Your Quiz Plan"
      heroSubtitle="A subscription is required to attempt quizzes. Each plan gives you a fixed number of attempts."
      loading={plansLoading}
      plans={plans.map(toUiPlan)}
      selectedPlanId={selectedPlan}
      onSelectPlan={(plan) => setSelectedPlan(plan.id)}
      statusCard={
        remainingCount !== null
          ? {
              isActive: remainingCount > 0,
              countLabel: remainingCount > 0
                ? `${remainingCount} quiz attempt${remainingCount === 1 ? '' : 's'} remaining`
                : 'Your quiz attempts are used up — buy a new plan to continue.',
            }
          : null
      }
      onPay={loading ? undefined : handlePay}
       payLabel="Pay Now"
      processingPlanId={loading ? processingPlanId : null}
    />
  );
}