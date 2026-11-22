// screens/QuizSubscriptionScreen.js
// ─────────────────────────────────────────────────────────
// Unified Quiz Subscription screen:
//   - Upar: Active subscription card (agar active ho)
//   - Niche: "Our Plans" grid with direct checkout
// ─────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import SubscriptionPlanPurchase from '../components/SubscriptionPlanPurchase';
import { useQuickMenuRedirect } from '../utils/useQuickMenuRedirect';
import { getCardTheme, getNativeThemeImage } from '../constants/subscriptionThemes';

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

export default function QuizSubscriptionScreen({ navigation, route, redirectScreenName = 'QuizSubscription' }) {
  // Desktop web par ye page kabhi bina sidebar ke na khule (quizItem wagairah params bhi saath jaate hain)
  const redirectingToSidebar = useQuickMenuRedirect(navigation, redirectScreenName, route?.params);
  const { showPopup } = useToast();

  const quizItem   = route?.params?.quizItem ?? null;
  const subject    = route?.params?.subject ?? null;
  const difficulty = route?.params?.difficulty ?? null;

  const [plans, setPlans]               = useState(PLANS); // static fallback until backend responds
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [loading, setLoading]           = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  // Active quiz subscription state
  const [userSub, setUserSub]           = useState(null);
  const [isSubActive, setIsSubActive]   = useState(false);
  const [subLoading, setSubLoading]     = useState(true);
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

  // Active subscription details fetch karo
  const loadUserSub = useCallback(async () => {
    try {
      const user = await UserStore.getCurrentUserSynced();
      if (!user) {
        setUserSub(null);
        setIsSubActive(false);
        setRemainingCount(null);
        return;
      }
      const activeState = UserStore.hasActiveQuizSubscription(user);
      const remaining = UserStore.getQuizSubscriptionRemainingCount(user);
      setIsSubActive(Boolean(activeState));
      setRemainingCount(remaining);
      setUserSub(user.quiz_subscription_plan || null);
    } catch (_) {}
    finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserSub();
  }, [loadUserSub]);

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
          // Reload active subscription state
          loadUserSub();
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
            errorInfo.error_description,
            'quiz'
          );
          showPopup(errorInfo.error_description || 'Payment failed or cancelled.', 'error');
        },
      });
    } catch (e) {
      setLoading(false);
      showPopup('Something went wrong. Please try again.', 'error');
    }
  }, [navigation, quizItem, subject, difficulty, showPopup, loadUserSub]);

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

  const statusCard = useMemo(() => {
    if (subLoading) return null;
    if (isSubActive) {
      return {
        isActive: true,
        planName: userSub?.plan_name || 'Subscription Plan',
        price: userSub?.price,
        purchasedAt: userSub?.purchased_at,
        expiresAt: userSub?.expires_at,
        countLabel: remainingCount === null
          ? 'Unlimited attempts till expiry'
          : `${remainingCount} quiz attempt${remainingCount === 1 ? '' : 's'} remaining`,
        themeImage: getNativeThemeImage(getCardTheme(4)),
        textColor: '#ffffff',
      };
    }
    if (userSub && !isSubActive) {
      return {
        isActive: false,
        planName: userSub?.plan_name || 'Subscription Plan',
        price: userSub?.price,
        purchasedAt: userSub?.purchased_at,
        expiresAt: userSub?.expires_at,
        countLabel: remainingCount === 0
          ? 'Quiz attempts used up — renew or buy a new plan.'
          : 'Expired — buy a new plan to continue.',
      };
    }
    return null;
  }, [subLoading, isSubActive, userSub, remainingCount]);

  if (redirectingToSidebar) return null;

  const heroTitle = isSubActive ? 'My Quiz Subscription' : 'Choose Your Quiz Plan';
  const heroSubtitle = isSubActive
    ? 'Status of your Certification quiz plan and available renewal options.'
    : 'A subscription is required to attempt quizzes. Each plan gives you a fixed number of attempts.';

  return (
    <SubscriptionPlanPurchase
      navigation={navigation}
      headerTitle="Quiz Subscription"
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      loading={plansLoading}
      plans={plans.map(toUiPlan)}
      selectedPlanId={selectedPlan}
      onSelectPlan={(plan) => setSelectedPlan(plan.id)}
      statusCard={statusCard}
      onPay={loading ? undefined : handlePay}
      payLabel="Pay Now"
      processingPlanId={loading ? processingPlanId : null}
    />
  );
}