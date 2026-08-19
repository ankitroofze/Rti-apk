import React, { useState, useEffect } from 'react';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi'; // ⚠️ path apne project structure ke hisaab se confirm/adjust kar lena

// ── Design Tokens ──────────────────────────────────────────────────────────────
const C = {
  orange:       '#F97316',
  orangeLight:  '#FFF7ED',
  orangeMid:    '#FED7AA',
  orangeBorder: '#FFE8D6',
  orangeDark:   '#C2410C',
  green:        '#16a34a',
  greenLight:   '#f0fdf4',
  greenBorder:  '#bbf7d0',
  white:        '#ffffff',
  bg:           '#FFF7ED',
  text:         '#111111',
  textSub:      '#888888',
  border:       '#FFE8D6',
};

const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 10
  : 54;


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
  features.push(`Post ${credits} Ads`);
  features.push('Edit Ads (1 credit each)');
  features.push(`Valid for ${validityDays} days`);

  return {
    id:            String(id),
    name:          raw?.title || `${credits} Credits Plan`, // title null ho sakta hai
    price:         finalPrice,
    originalPrice: hasOffer ? basePrice : null, // offer hai to asli price strike-through dikhane ke liye
    credits,
    duration:      `${validityDays} Days`,
    validity_days: validityDays,
    popular:       false, // API mein abhi "popular" jaisa koi flag nahi hai
    color:         C.orange,
    features,
    raw, // original API object safe rakha — purchase call mein kaam aa sakta hai
  };
};

// ── Credit Info Row ────────────────────────────────────────────────────────────
function CreditInfoRow({ icon, text }) {
  return (
    <View style={inf.row}>
      <View style={inf.iconWrap}>
        <Ionicons name={icon} size={14} color={C.orange} />
      </View>
      <Text style={inf.text}>{text}</Text>
    </View>
  );
}
const inf = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  iconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center' },
  text:     { fontSize: 13, color: C.textSub, flex: 1, fontWeight: '500' },
});

// ── Plan Card ──────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect, isWeb }) {
  const isSel = selected === plan.id;
  return (
    <TouchableOpacity
      style={[pc.card, isSel && pc.cardSel, plan.popular && pc.cardPopular, isWeb && pc.cardWeb]}
      onPress={() => onSelect(plan.id)}
      activeOpacity={0.85}
    >
      {plan.popular && (
        <View style={pc.popularBadge}>
          <Ionicons name="flame" size={11} color="#fff" />
          <Text style={pc.popularText}>Most Popular</Text>
        </View>
      )}

      {/* Top row */}
      <View style={pc.topRow}>
        <View style={[pc.iconBox, isSel && pc.iconBoxSel]}>
          <Ionicons
            name={plan.credits <= 10 ? 'sparkles-outline' : plan.credits <= 20 ? 'rocket-outline' : 'diamond-outline'}
            size={20}
            color={isSel ? '#fff' : C.orange}
          />
        </View>
        <View style={[pc.radioCircle, isSel && pc.radioCircleSel]}>
          {isSel && <View style={pc.radioDot} />}
        </View>
      </View>

      {/* Plan name & credits */}
      <Text style={[pc.planName, isSel && pc.planNameSel]}>{plan.name}</Text>
      <View style={pc.creditsRow}>
        <Text style={[pc.creditsNum, isSel && pc.creditsNumSel]}>{plan.credits}</Text>
        <Text style={[pc.creditsLabel, isSel && pc.creditsLabelSel]}>credits</Text>
      </View>

      {/* Price */}
      <View style={[pc.priceBox, isSel && pc.priceBoxSel]}>
        <Text style={[pc.priceRs, isSel && pc.priceRsSel]}>₹</Text>
        <Text style={[pc.priceVal, isSel && pc.priceValSel]}>{plan.price}</Text>
        {plan.originalPrice != null && (
          <Text style={pc.priceOriginal}>₹{plan.originalPrice}</Text>
        )}
        <Text style={[pc.priceDur, isSel && pc.priceDurSel]}>/ {plan.duration}</Text>
      </View>

      {/* Features */}
      <View style={pc.featuresList}>
        {plan.features.map((f, i) => (
          <View key={i} style={pc.featureRow}>
            <Ionicons name="checkmark-circle" size={14} color={isSel ? C.orange : C.green} />
            <Text style={[pc.featureText, isSel && pc.featureTextSel]}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const pc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 14,
    position: 'relative',
  },
  cardWeb: {
    flex: 1,
    minWidth: 260,
    marginBottom: 0,
  },
  cardSel: {
    borderColor: C.orange,
    backgroundColor: C.orangeLight,
    shadowColor: C.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  cardPopular: {
    borderColor: C.orange,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: C.orange,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 6 },
  iconBox:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.orangeBorder },
  iconBoxSel:  { backgroundColor: C.orange, borderColor: C.orange },

  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioCircleSel: { borderColor: C.orange },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.orange },

  planName:    { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 6 },
  planNameSel: { color: C.orangeDark },

  creditsRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 10 },
  creditsNum:      { fontSize: 38, fontWeight: '900', color: C.text },
  creditsNumSel:   { color: C.orange },
  creditsLabel:    { fontSize: 14, color: C.textSub, fontWeight: '600' },
  creditsLabelSel: { color: C.orange },

  priceBox:    { flexDirection: 'row', alignItems: 'baseline', gap: 2, backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14, alignSelf: 'flex-start' },
  priceBoxSel: { backgroundColor: 'rgba(249,115,22,0.1)' },
  priceRs:     { fontSize: 14, fontWeight: '700', color: C.textSub },
  priceRsSel:  { color: C.orange },
  priceVal:    { fontSize: 22, fontWeight: '900', color: C.text },
  priceValSel: { color: C.orange },
  priceDur:    { fontSize: 12, color: C.textSub, fontWeight: '500' },
  priceDurSel: { color: C.orange },
  priceOriginal: { fontSize: 13, color: C.textSub, fontWeight: '600', textDecorationLine: 'line-through' },

  featuresList: { gap: 6 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText:  { fontSize: 12, color: C.textSub, fontWeight: '500', flex: 1 },
  featureTextSel: { color: '#444' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function AdPlansScreen({ navigation, route }) {
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = windowWidth >= 860;

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
        setPlansError(plansResult?.message || 'Plans load nahi ho paaye.');
      }
      setPlansLoading(false);

      if (summary) setCurrentCredits(summary.credits || 0);
      setLoadingData(false);
    })();
  }, []);

  // const handleBuy = async () => {
  //   const plan = plans.find(p => p.id === selectedPlan);
  //   if (!plan) return;

  //   setLoading(true);
  //   const result = await UserStore.buyAdCredits({
  //     plan_id:       plan.id,
  //     plan_name:     plan.name,
  //     price:         plan.price,
  //     credits:       plan.credits,
  //     duration:      plan.duration,
  //     validity_days: plan.validity_days,
  //   });
  //   setLoading(false);

  //   if (result?.ok) {
  //     setCurrentCredits(result.credits || 0);
  //     showToast(`🎉 ${plan.credits} credits add ho gaye! Total: ${result.credits}`);
  //     setTimeout(() => {
  //       try {
  //         const returnTo = route?.params?.returnTo;
  //         navigation.navigate(returnTo === 'MyAds' ? 'MyAds' : 'Advertise');
  //       } catch (e) {
  //         navigation.goBack();
  //       }
  //     }, 2000);
  //   } else {
  //     showToast(result?.message || 'Unable to activate plan.', 'error');
  //   }
  // };

  const handleBuy = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    const orderResult = await UserStore.createAdOrder({ planId: plan.id });
    if (!orderResult?.ok) {
      setLoading(false);
      showToast(orderResult?.message || 'Unable to create order.', 'error');
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
          showToast(`🎉 ${plan.credits} credits add ho gaye! Total: ${verifyResult.credits}`);
          setTimeout(() => {
            try {
              const returnTo = route?.params?.returnTo;
              navigation.navigate(returnTo === 'MyAds' ? 'MyAds' : 'Advertise');
            } catch (e) { navigation.goBack(); }
          }, 2000);
        } else {
          showToast(verifyResult?.message || 'Payment verification failed.', 'error');
        }
      },
      onFailed: async (errorInfo) => {
        setLoading(false);
        await UserStore.markPaymentFailed(
          errorInfo.razorpay_order_id,
          errorInfo.error_code,
          errorInfo.error_description
        );
        showToast(errorInfo.error_description || 'Payment failed.', 'error');
      },
    });
  };

  const plan = plans.find(p => p.id === selectedPlan);

  // ── Shared: Plans list ke liye loading / empty / error state ────────────────
  const renderPlansState = (containerStyle) => {
    if (plansLoading) {
      return (
        <View style={[containerStyle, { alignItems: 'center', paddingVertical: 30 }]}>
          <ActivityIndicator size="small" color={C.orange} />
          <Text style={{ marginTop: 10, color: C.textSub, fontWeight: '600' }}>Plans load ho rahe hain...</Text>
        </View>
      );
    }
    if (plansError) {
      return (
        <View style={[containerStyle, { alignItems: 'center', paddingVertical: 30 }]}>
          <Ionicons name="alert-circle-outline" size={22} color={C.orangeDark} />
          <Text style={{ marginTop: 8, color: C.orangeDark, fontWeight: '700', textAlign: 'center' }}>{plansError}</Text>
        </View>
      );
    }
    if (plans.length === 0) {
      return (
        <View style={[containerStyle, { alignItems: 'center', paddingVertical: 30 }]}>
          <Text style={{ color: C.textSub, fontWeight: '600' }}>Abhi koi ad plan available nahi hai.</Text>
        </View>
      );
    }
    return null;
  };

  // ── WEB LAYOUT ──────────────────────────────────────────────────────────────
  if (isWeb && isWide) {
    return (
      <View style={ws.root}>
        {toast && (
          <View style={[ws.toast, toast.type === 'error' ? ws.toastError : ws.toastSuccess]}>
            <Text style={ws.toastText}>{toast.message}</Text>
          </View>
        )}
        {/* Top Bar */}
        <View style={ws.topBar}>
          <TouchableOpacity style={ws.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color={C.orangeDark} />
            <Text style={ws.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={ws.topBarTitle}>Ad Credit Plans</Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView style={ws.scroll} contentContainerStyle={ws.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={ws.innerWrap}>

            {/* Header */}
            <View style={ws.pageHeader}>
              <View style={ws.eyebrowRow}>
                <Ionicons name="megaphone-outline" size={14} color={C.orange} />
                <Text style={ws.eyebrow}>ADVERTISE WITH US</Text>
              </View>
              <Text style={ws.pageTitle}>Choose Your Ad Credit Plan</Text>
              <Text style={ws.pageSub}>
                Credits are used to post and edit ads. 1 credit = 1 post or 1 edit.
              </Text>

              {/* Current credits badge */}
              {!loadingData && (
                <View style={ws.currentCreditsBox}>
                  <Ionicons name="wallet-outline" size={16} color={C.orange} />
                  <Text style={ws.currentCreditsText}>
                    Current Balance: <Text style={{ fontWeight: '900', color: C.orange }}>{currentCredits} credits</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* How credits work */}
            <View style={ws.infoCard}>
              <Text style={ws.infoTitle}>How Credits Work</Text>
              <View style={ws.infoGrid}>
                <CreditInfoRow icon="add-circle-outline"    text="1 credit is used when you post a new ad" />
                <CreditInfoRow icon="create-outline"        text="1 credit is used when you edit an existing ad" />
                <CreditInfoRow icon="time-outline"          text="Credits are valid for 30 days from purchase" />
                <CreditInfoRow icon="layers-outline"        text="Credits carry over — buying more adds to existing balance" />
              </View>
            </View>

            {/* Plans */}
            {renderPlansState(ws.plansRow)}
            {!plansLoading && !plansError && plans.length > 0 && (
              <View style={[ws.plansRow, isWide && ws.plansRowWide]}>
                {plans.map(p => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    selected={selectedPlan}
                    onSelect={setSelectedPlan}
                    isWeb
                  />
                ))}
              </View>
            )}

            {/* Summary + Buy */}
            {plan && (
              <View style={ws.summaryCard}>
                <View style={ws.summaryLeft}>
                  <Text style={ws.summaryTitle}>Order Summary</Text>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Plan</Text>
                    <Text style={ws.summaryValue}>{plan?.name}</Text>
                  </View>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Credits</Text>
                    <Text style={ws.summaryValue}>{plan?.credits} credits</Text>
                  </View>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Valid for</Text>
                    <Text style={ws.summaryValue}>{plan?.duration}</Text>
                  </View>
                  <View style={ws.summaryDivider} />
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryTotalLabel}>Total</Text>
                    <Text style={ws.summaryTotalPrice}>₹{plan?.price}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[ws.buyBtn, loading && { opacity: 0.6 }]}
                  onPress={handleBuy}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flash" size={18} color="#fff" />
                  <Text style={ws.buyBtnText}>
                    {loading ? 'Processing...' : `Buy ${plan?.credits} Credits — ₹${plan?.price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    );
  }

  // ── MOBILE LAYOUT ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {toast && (
        <View style={[s.toast, toast.type === 'error' ? s.toastError : s.toastSuccess]}>
          <Text style={s.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.orange} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ad Credit Plans</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Current Credits Badge */}
        {!loadingData && (
          <View style={s.currentCreditsBox}>
            <Ionicons name="wallet-outline" size={16} color={C.orange} />
            <Text style={s.currentCreditsText}>
              Current Balance:{' '}
              <Text style={{ fontWeight: '900', color: C.orange }}>{currentCredits} credits</Text>
            </Text>
          </View>
        )}

        {/* How credits work */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>How Credits Work</Text>
          <CreditInfoRow icon="add-circle-outline"    text="1 credit used when you post a new ad" />
          <CreditInfoRow icon="create-outline"        text="1 credit used when you edit an existing ad" />
          <CreditInfoRow icon="time-outline"          text="Credits valid for 30 days from purchase" />
          <CreditInfoRow icon="layers-outline"        text="Buying more credits adds to existing balance" />
        </View>

        {/* Plans */}
        <Text style={s.sectionTitle}>Choose a Plan</Text>
        {renderPlansState(s.scrollContent)}
        {!plansLoading && !plansError && plans.map(p => (
          <PlanCard
            key={p.id}
            plan={p}
            selected={selectedPlan}
            onSelect={setSelectedPlan}
            isWeb={false}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Buy Bar */}
      {plan && (
        <View style={s.bottomBar}>
          <View>
            <Text style={s.bottomLabel}>
              {plan?.credits} credits · {plan?.duration}
            </Text>
            <Text style={s.bottomPrice}>₹{plan?.price}</Text>
          </View>
          <TouchableOpacity
            style={[s.buyBtn, loading && { opacity: 0.6 }]}
            onPress={handleBuy}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={s.buyBtnText}>
              {loading ? 'Processing...' : 'Buy Credits'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

// ── Mobile Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: SAFE_TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
    elevation: 3,
    shadowColor: C.orange, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  backBtn:     { padding: 8, borderRadius: 10, backgroundColor: C.orangeLight },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },

  currentCreditsBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.white, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1.5, borderColor: C.orangeBorder,
  },
  currentCreditsText: { fontSize: 14, color: C.text, fontWeight: '600' },

  infoCard: {
    backgroundColor: C.white, borderRadius: 16,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },

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
  bottomLabel: { fontSize: 12, color: C.textSub, marginBottom: 2 },
  bottomPrice: { fontSize: 22, fontWeight: '900', color: C.text },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.orange, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 14,
    elevation: 4,
    shadowColor: C.orange, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  buyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 9999,
    elevation: 20,
    alignItems: 'center',
  },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError:   { backgroundColor: '#dc2626' },
  toastText:    { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});

// ── Web Styles ─────────────────────────────────────────────────────────────────
const ws = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg, minHeight: '100vh' },

  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 14, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.border, borderRadius: 8 },
  backBtnText: { fontSize: 13, fontWeight: '700', color: C.orangeDark },
  topBarTitle: { fontSize: 15, fontWeight: '800', color: C.text },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 60, alignItems: 'center' },
  innerWrap:     { width: '100%', maxWidth: 1000, alignSelf: 'center' },

  pageHeader:   { marginBottom: 28, alignItems: 'flex-start' },
  eyebrowRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  eyebrow:      { fontSize: 11, fontWeight: '800', color: C.orange, letterSpacing: 1.5 },
  pageTitle:    { fontSize: 28, fontWeight: '900', color: C.text, marginBottom: 6 },
  pageSub:      { fontSize: 14, color: C.textSub, marginBottom: 14 },

  currentCreditsBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.white, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: C.orangeBorder,
    alignSelf: 'flex-start',
  },
  currentCreditsText: { fontSize: 14, color: C.text, fontWeight: '600' },

  infoCard: {
    backgroundColor: C.white, borderRadius: 16,
    padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
    width: '100%',
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 14 },
  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  plansRow:     { flexDirection: 'column', gap: 14, marginBottom: 24, width: '100%' },
  plansRowWide: { flexDirection: 'row', alignItems: 'stretch' },

  summaryCard: {
    backgroundColor: C.white, borderRadius: 16,
    padding: 24, borderWidth: 2, borderColor: C.orange,
    width: '100%', gap: 16,
  },
  summaryLeft:       { flex: 1 },
  summaryTitle:      { fontSize: 16, fontWeight: '900', color: C.text, marginBottom: 16 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.orangeLight },
  summaryLabel:      { fontSize: 13, color: C.textSub, fontWeight: '500' },
  summaryValue:      { fontSize: 13, fontWeight: '700', color: C.text },
  summaryDivider:    { height: 1, backgroundColor: C.orangeBorder, marginVertical: 8 },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  summaryTotalPrice: { fontSize: 22, fontWeight: '900', color: C.orange },

  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.orange, borderRadius: 14, paddingVertical: 16,
  },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  toast: {
    position: 'fixed',
    bottom: 40,
    left: '50%',
    transform: [{ translateX: -200 }],
    width: 400,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 9999,
    elevation: 20,
    alignItems: 'center',
  },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError:   { backgroundColor: '#dc2626' },
  toastText:    { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});