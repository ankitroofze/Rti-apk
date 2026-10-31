import { smartGoBack } from '../utils/smartBack';
import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { useToast } from '../components/ui/ToastProvider';
import S from '../styles/SubscriptionPlansStyles';
import { UserStore } from '../store/UserStore';
import SubscriptionStatusCard from '../components/SubscriptionStatusCard';
// ✅ Theme images ab constants/subscriptionThemes.js se aate hain — yehi
// file Quiz / Ads / Ecom subscription screens bhi use karte hain, taaki
// sabhi "buy a plan" pages ka design/colors hamesha ek jaisa rahe.
import { getCardTheme, HEADER_BG_IMAGE, getNativeThemeImage } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
import { INDIAN_STATES, getDistricts, getTalukas, getVillages } from './locationData';

// ─────────────────────────────────────────────
// LocationFilterDropdown — State/District/Taluka filter chip
// (web/Android/iOS teeno par same dikhta hai, koi Platform check nahi)
// ─────────────────────────────────────────────
function LocationFilterDropdown({ label, value, options, onChange, placeholder = 'All', disabled = false, cellStyle }) {
  const [open, setOpen] = useState(false);
  const active = !!value;
  return (
    <View style={[{ position: 'relative', zIndex: open ? 30 : 1, elevation: open ? 30 : 1 }, cellStyle]}>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => !disabled && setOpen((o) => !o)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          height: 42, paddingHorizontal: 10,
          borderWidth: 1, borderRadius: 10,
          borderColor: open ? '#dc2626' : active ? '#fecaca' : '#E5E7EB',
          backgroundColor: disabled ? '#F3F4F6' : active ? '#FEF2F2' : '#fff',
        }}
      >
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={{ fontSize: 9, lineHeight: 11, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {label}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: disabled ? '#C0C5CE' : value ? '#111827' : '#6B7280' }}
          >
            {value || placeholder}
          </Text>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={disabled ? '#C0C5CE' : '#6B7280'} />
      </TouchableOpacity>

      {open && !disabled && (
        <View
          style={{
            position: 'absolute', top: 46, left: 0, right: 0, zIndex: 40, elevation: 40,
            maxHeight: 200,
            backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
            paddingVertical: 4, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
          }}
        >
          <ScrollView style={{ maxHeight: 192 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {value ? (
              <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 12 }} onPress={() => { onChange(''); setOpen(false); }}>
                <Text style={{ fontSize: 12.5, color: '#EF4444', fontWeight: '700' }}>Clear ({placeholder})</Text>
              </TouchableOpacity>
            ) : null}
            {options.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: '#9CA3AF', paddingVertical: 8, paddingHorizontal: 12 }}>
                {label === 'Village' ? 'No villages found' : 'No data found'}
              </Text>
            ) : null}
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                onPress={() => { onChange(opt); setOpen(false); }}
              >
                <Text style={{ fontSize: 12.5, color: opt === value ? '#dc2626' : '#374151', fontWeight: opt === value ? '700' : '500' }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen — Platform.OS check here only
// ─────────────────────────────────────────────
export default function SubscriptionPlansScreen({ navigation, route }) {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && windowWidth <= 1024;
  const { showPopup } = useToast();

    const [loading, setLoading]               = useState(true);
  const [activeReady, setActiveReady]         = useState(false); // active plan card ke liye (plans ka wait nahi)
  const [seatSummary, setSeatSummary]       = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState('');
  const [pendingPlan, setPendingPlan]       = useState(null);
    const [seatModalOpen, setSeatModalOpen]   = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [detailsModal, setDetailsModal] = useState(null); // Read More pe click hote hi { plan, theme } set hogaoga
  // ✅ Sold seats (plan + location key). Backend 409 seat_unavailable aate hi yahan add hota hai.
  const [soldKeys, setSoldKeys] = useState([]);
  const [paying, setPaying] = useState(false);        // checkout chal raha hai — buttons disable
  const [loadError, setLoadError] = useState('');      // plans refresh fail hone par inline message
  const navTimerRef = useRef(null);

   const [subscriptionData, setSubscriptionData] = useState({
    currentUser:      null,
    activePlan:       null,
    plans:            [],
    currentRole:      'free',
    currentRoleLabel: 'Free Member',
  });

   // ✅ NEW: Subscription Plans ke liye State/District/Taluka/Village filter
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterTaluka, setFilterTaluka] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  // ✅ Level plans: user ki profile location (state/district/taluka/village) se filters pehle se bhare aate
  // hain, taaki user ko apne gaon/taluka/district/state ke hisaab se plans + Sold status turant dikhe.
  // User chahe to dropdown se badal sakta hai. `LOCK_TO_PROFILE_LOCATION = true` karoge to sirf
  // apni profile wali location par hi kharid payega.
  const LOCK_TO_PROFILE_LOCATION = false;
  const prefilledRef = useRef(false);
  useEffect(() => {
    const u = subscriptionData.currentUser;
    if (prefilledRef.current || !u?.state) return;
    prefilledRef.current = true;
    setFilterState(u.state || '');
    setFilterDistrict(u.district || '');
    setFilterTaluka(u.taluka || '');
    setFilterVillage(u.village || '');
  }, [subscriptionData.currentUser]);
  const filterDistrictOptions = filterState ? getDistricts(filterState) : [];
    const filterTalukaOptions   = filterState && filterDistrict ? getTalukas(filterState, filterDistrict) : [];
  // ✅ UPDATED: ab village bhi wahi master LGD list se aata hai jo Register flow
  // (VillageSelectScreen) me use hota hai — locationData.js ki getVillages()
  const filterVillageOptions = filterState && filterDistrict && filterTaluka
    ? getVillages(filterState, filterDistrict, filterTaluka)
    : [];

   // ✅ FIX: plan ka apna location field khaali ho tabhi woh "national" maan ke hamesha dikhega.
  // Agar plan ka koi field bhara hai (jaise state = "Maharashtra"), to woh plan TABHI dikhega
  // jab user ne exact wahi filter explicitly select kiya ho — khaali filter pe nahi dikhega.
  // ✅ Sirf LIVE (expire na hua) active plan hi "active" maana jaayega
  const activePlanLive = (() => {
    const ap = subscriptionData.activePlan;
    if (!ap) return null;
    if (ap.expires_at && UserStore.isExpired(ap.expires_at)) return null;
    return ap;
  })();
  const LEVEL_LABEL = { state: 'State', district: 'District', taluka: 'Taluka', village: 'Village' };
  const filteredPlans = subscriptionData.plans.filter((plan) => {
    // ✅ Level plan (admin ne sirf level ke saath banaya, location nahi) tabhi dikhega jab user ne
    // us level tak ki location chun li ho: Village plan => State + District + Taluka + Village sab chune hon,
    // Taluka plan => State + District + Taluka, District plan => State + District, State plan => State.
    // Jab tak location poori nahi chuni, plan hidden rehta hai.
    if (plan.location_level) {
      return !UserStore.getMissingLocationField(plan.location_level, {
        state: filterState, district: filterDistrict, taluka: filterTaluka, village: filterVillage,
      });
    }
    const matchState    = !plan.state    || (filterState    && String(plan.state).trim().toLowerCase()    === filterState.toLowerCase());
    const matchDistrict = !plan.district || (filterDistrict && String(plan.district).trim().toLowerCase() === filterDistrict.toLowerCase());
    const matchTaluka   = !plan.taluka   || (filterTaluka   && String(plan.taluka).trim().toLowerCase()   === filterTaluka.toLowerCase());
    const matchVillage  = !plan.village  || (filterVillage  && String(plan.village).trim().toLowerCase()  === filterVillage.toLowerCase());
    const isMyActivePlan = activePlanLive?.plan_id === plan.plan_id;
    return isMyActivePlan || (matchState && matchDistrict && matchTaluka && matchVillage);
  });
  const returnTo = route?.params?.returnTo || 'Subscription Plans';
   const firstLoadDone = useRef(false);
  const payingRef = useRef(false); // Pay Now double-tap / back ke baad turant dobara tap se 2 orders na bane
  const lastSyncAt = useRef(0); // backend sync ka last time (focus par har baar sync na ho, par stale bhi na rahe)
  const loadPlans = useCallback(async () => {
    // full-screen loader sirf pehli baar; filter badalne par silent refresh
    const isFirstLoad = !firstLoadDone.current;
    try {
      if (isFirstLoad) {
        setLoading(true);
        // ✅ FAST: pehle local saved data se Active plan card turant dikha do,
        // network (sync + plans list) ka wait mat karo
        const quick = await UserStore.getActivePlanQuick();
        if (quick) {
          setSubscriptionData((prev) => ({ ...prev, ...quick, plans: prev.plans?.length ? prev.plans : quick.plans }));
          setActiveReady(true);
        }
      }
      const [data, seatData] = await Promise.all([
        UserStore.getSubscriptionSummary({
          state: filterState,
          district: filterDistrict,
          taluka: filterTaluka,
          village: filterVillage,
        }, { skipSync: !isFirstLoad && (Date.now() - lastSyncAt.current) < 60000 }),
        UserStore.getStateSeatSummary(),
      ]);
      firstLoadDone.current = true;
      if (isFirstLoad || (Date.now() - lastSyncAt.current) >= 60000) lastSyncAt.current = Date.now();
      // ✅ data null SIRF tab aata hai jab user logged-out ho. Network/server error par
      // ab cached data + loadFailed aata hai, Login par nahi bheja jaata.
      if (!data) { navigation.replace('Login'); return; }
      setSubscriptionData(data);
      setSeatSummary(seatData || null);
      setLoadError(data.loadFailed ? 'Unable to refresh plans. Showing saved data — please check your internet connection.' : '');
      const seatId = seatData?.current_seat?.seat_id || '';
      setSelectedSeatId((prev) => prev || seatId);
    } catch (err) {
      console.warn('[SubscriptionPlans] loadPlans failed:', err?.message || err);
      setLoadError('Unable to load plans. Please check your internet connection and try again.');
    } finally {
      // ✅ Kuch bhi ho (error/return), loader kabhi atka nahi rahega
      setLoading(false);
      setActiveReady(true);
    }
  }, [navigation, filterState, filterDistrict, filterTaluka, filterVillage]);

  useFocusEffect(useCallback(() => { loadPlans(); }, [loadPlans]));

  // ✅ Pichla payment kat gaya tha par verify nahi ho paya (net/server issue / app band) —
  // screen khulte hi automatically dobara verify karo.
  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      if (payingRef.current) return;
      const r = await UserStore.retryPendingRolePayment();
      if (!alive || !r) return;
      if (r.ok) {
        lastSyncAt.current = 0;
        try { await loadPlans(); } catch (e) { /* ignore */ }
        showPopup(`🎉 ${r.plan_name || 'Your plan'} activated!`, 'success');
      } else if (r.stillPending) {
        showPopup('Your payment was received. We are still confirming your subscription — it will be activated automatically. Please do not pay again.', 'info');
      } else if (r.message) {
        showPopup(r.message, 'error');
      }
    })();
    return () => { alive = false; };
  }, [loadPlans, showPopup]));

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); }, []);
const stateName    = filterState || seatSummary?.state || subscriptionData.currentUser?.state || '';
const activeSeatId = seatSummary?.current_seat?.seat_id || '';
// ✅ NEW: seat sirf State se nahi, plan ke apne District/Taluka/Village se bhi
// lock ho sakti hai — pendingPlan (jis plan ko user kharidne wala hai) se hi
// yeh location liya jaayega, profile se nahi (spec: "applicable location").
const districtName = pendingPlan?.district || subscriptionData.currentUser?.district || '';
const talukaName   = pendingPlan?.taluka   || subscriptionData.currentUser?.taluka   || '';
const villageName  = pendingPlan?.village  || subscriptionData.currentUser?.village  || '';
const allowedSeatIds = pendingPlan ? UserStore.getSeatIdsForRoleId(pendingPlan.role_id_raw) : [];
const restrictedSeats = (seatSummary?.seats || []).map((seat) =>
  (allowedSeatIds.length && !allowedSeatIds.includes(seat.id)) ? { ...seat, status: 'disabled' } : seat
);

// ✅ Seat location: plan ki fixed location > screen ka filter > profile
const getSeatLocation = (plan) => {
  // ✅ NEW: level plan par location SIRF screen ke filter se aati hai (profile se nahi),
  // aur plan ke level tak trim hoti hai (district plan = state + district).
  if (plan?.location_level) {
    const t = UserStore.trimLocationToLevel(plan.location_level, {
      state: filterState, district: filterDistrict, taluka: filterTaluka, village: filterVillage,
    });
    return { seatState: t.state, planDistrict: t.district, planTaluka: t.taluka, planVillage: t.village };
  }
  return {
    seatState:    plan?.state    || filterState    || stateName,
    planDistrict: plan?.district || filterDistrict || subscriptionData.currentUser?.district || '',
    planTaluka:   plan?.taluka   || filterTaluka   || subscriptionData.currentUser?.taluka   || '',
    planVillage:  plan?.village  || filterVillage  || subscriptionData.currentUser?.village  || '',
  };
};
// ✅ NEW: level plan ke liye abhi kaun si location chunni baaki hai ('' = poori chuni hui)
const missingLocationFor = (plan) => (plan?.location_level
  ? UserStore.getMissingLocationField(plan.location_level, {
      state: filterState, district: filterDistrict, taluka: filterTaluka, village: filterVillage,
    })
  : '');
// ✅ NEW: level plan "currently active" sirf usi location par jahan kharida gaya hai
const isPlanActiveHere = (plan) => {
  if (!plan || String(activePlanLive?.plan_id) !== String(plan.plan_id)) return false;
  if (!plan.location_level) return true;
  const ap = activePlanLive || {};
  if (!ap.state && !ap.district && !ap.taluka && !ap.village) return true; // location info nahi mili
  const l = getSeatLocation(plan);
  const eq = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  return eq(ap.state, l.seatState) && eq(ap.district, l.planDistrict) && eq(ap.taluka, l.planTaluka) && eq(ap.village, l.planVillage);
};
const soldKeyFor = (plan) => {
  const l = getSeatLocation(plan);
  // ✅ Seat = ROLE + LOCATION. Ek village me 5 roles hain, har role ka ek hi user ho sakta hai.
  // Isliye level plan par key role_id se banti hai (plan_id se nahi) — same role ke do plan hon
  // tab bhi ek hi seat maani jaayegi.
  const seatIdentity = plan?.location_level ? `role:${plan.role_id_raw}` : plan?.plan_id;
  return [seatIdentity, l.seatState, l.planDistrict, l.planTaluka, l.planVillage]
    .map((v) => String(v || '').trim().toLowerCase()).join('|');
};
// Premium par seat lock nahi — wo kabhi Sold nahi hota. Active plan bhi Sold nahi dikhega.
const isPlanSold = (plan) => {
  if (!plan) return false;
  // ✅ Premium plan kabhi Sold nahi dikhega (seat lock nahi hota) — backend is_sold bheje tab bhi nahi
  if (UserStore.isPremiumPlan(plan)) return false;
  // Apna active plan Sold nahi dikhega ("Currently active" dikhega)
  if (isPlanActiveHere(plan)) return false;
  // ✅ NEW: level plan par location poori chuni ho tabhi Sold/Available decide hota hai
  if (missingLocationFor(plan)) return false;
  // Baaki saare role plans: backend ka is_sold ya 409 seat_unavailable ke baad local sold key
  return Boolean(plan.is_sold) || soldKeys.includes(soldKeyFor(plan));
};
const markPlanSold = (plan) => {
  const k = soldKeyFor(plan);
  setSoldKeys((prev) => (prev.includes(k) ? prev : [...prev, k]));
};

// 👇 YAHAN ADD KARO (navigateToPayment ki jagah)
const startSubscriptionPayment = async (plan, seatRoleId) => {
  if (payingRef.current) return; // pichla order/checkout abhi chal raha hai
  payingRef.current = true;
  setPaying(true);
  try {
    await runSubscriptionPayment(plan, seatRoleId);
  } catch (err) {
    console.warn('[SubscriptionPlans] payment flow error:', err?.message || err);
    showPopup('Something went wrong. If money was deducted, it will be confirmed automatically. Please try again.', 'error');
  } finally {
    payingRef.current = false;
    setPaying(false);
  }
};
const runSubscriptionPayment = async (plan, seatRoleId) => {
  // ✅ FIX: pendingPlan (outer state) ek render peeche reh sakta hai kyunki
  // setPendingPlan() async hai — isliye location seedha `plan` argument se
  // nikalo, taaki hamesha wahi plan ki apni district/taluka/village jaaye
  // jiske liye actually payment ho raha hai.
  // ✅ Seat location ki priority: plan ki fixed location > screen par chuna hua filter > profile.
  const { seatState, planDistrict, planTaluka, planVillage } = getSeatLocation(plan);

  const orderResult = await UserStore.createPaymentOrder({
    plan_id: plan.plan_id,
    plan,
    seat_state: seatState,
    seat_district: planDistrict,
    seat_taluka: planTaluka,
    seat_village: planVillage,
    seat_role_id: seatRoleId,
  });

  // ✅ 409 seat_unavailable / koi bhi error: message dikhao, Razorpay mat kholo,
  // user dusri location chun sakta hai
  if (!orderResult || orderResult.error) {
    if (orderResult?.seatUnavailable) {
      markPlanSold(plan);
      // ✅ latest plans reload — backend ka is_sold SOLD state dikhaye
      lastSyncAt.current = 0;
      try { await loadPlans(); } catch (e) { /* ignore */ }
    }
    showPopup(
      orderResult?.seatUnavailable ? 'Sorry, this plan is already sold. Please choose another location.' : (orderResult?.message || 'Unable to create order.'),
      'error',
      orderResult?.seatUnavailable ? { title: 'Sorry, Sold' } : undefined
    );
    return;
  }

  const confirmLater = () => showPopup(
    'Your payment was received, but we could not confirm it yet. Please do not pay again — it will be activated automatically when you reopen this screen.',
    'info'
  );

  await openRazorpayCheckout(orderResult.razorpay, 'role', {
    onVerified: async (response) => {
      const verifyParams = {
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        plan_id:      plan.plan_id,
        plan,               // ✅ asli clicked plan object seedha bhejo — dobara dhoondhna nahi padega
        seat_state:   seatState,
        seat_district: planDistrict,
        seat_taluka: planTaluka,
        seat_village: planVillage,
        seat_role_id: seatRoleId,
      };
      // ✅ Paise kat chuke hain — pehle pending record save karo, taaki verify fail / app band
      // hone par bhi next open par automatically verify ho jaye.
      await UserStore.savePendingRolePayment({ params: verifyParams, plan_name: plan.plan_name });
      const verifyResult = await UserStore.verifyPaymentWithRetry(verifyParams);

      if (verifyResult?.ok) {
        await UserStore.clearPendingRolePayment();
        // ✅ turant fresh data load karo (sync skip nahi) taaki Active plan card / "Currently active" abhi dikhe
        lastSyncAt.current = 0;
        try { await loadPlans(); } catch (e) { /* ignore */ }
        showPopup(`🎉 ${plan.plan_name} activated!`, 'success');
        if (navTimerRef.current) clearTimeout(navTimerRef.current);
        navTimerRef.current = setTimeout(() => navigation.navigate(returnTo), 1500);
        return;
      }
      if (verifyResult?.seatUnavailable) {
        // final answer (409) — dobara verify karne ka fayda nahi
        await UserStore.clearPendingRolePayment();
        markPlanSold(plan);
        showPopup('Sorry, this plan was just sold to someone else. Please choose another location.', 'error', { title: 'Sorry, Sold' });
        return;
      }
      const retryable = Boolean(verifyResult?.isNetwork) || Number(verifyResult?.status) >= 500;
      if (retryable) { confirmLater(); return; } // pending record rakha hai — auto retry hoga
      // final reject (4xx): dobara try nahi hoga
      await UserStore.clearPendingRolePayment();
      showPopup(
        `${verifyResult?.message || 'Payment verification failed.'} If money was deducted, please contact support with your payment receipt.`,
        'error'
      );
    },
    // Payment ho gaya par verify step me unexpected error aaya — pending record bachta hai
    onVerifyError: async () => { confirmLater(); },
    onFailed: async (errorInfo) => {
      // ✅ 'role' pass karo -> POST /role-subscriptions/payment/failed (seat turant free)
      // Back/cancel par seat release na ho to retry par "seat taken" aata hai, isliye ek baar dobara try karte hain
      try {
        const release = () => UserStore.markPaymentFailed(
          errorInfo.razorpay_order_id,
          errorInfo.error_code,
          errorInfo.error_description,
          'role'
        );
        const res = await release();
        if (!res?.ok) {
          await new Promise((r) => setTimeout(r, 1500));
          await release();
        }
      } catch (e) { /* seat release best-effort */ }
      // Back dabane par "failed" nahi, simple cancel message
      showPopup(
        errorInfo.cancelled ? 'Payment cancelled. You can try again anytime.' : (errorInfo.error_description || 'Payment failed.'),
        'error'
      );
    },
  });
};
const handleBuyPlan = (plan) => {
  if (payingRef.current) return; // checkout pehle se chal raha hai
  // ✅ Sold plan ko koi doosra user buy nahi kar sakta
  if (isPlanSold(plan)) {
    showPopup('Sorry, this plan is already sold. Please choose another location.', 'error', { title: 'Sorry, Sold' });
    return;
  }
  // ✅ NEW: level plan — pehle uski location (state/district/taluka/village) chuno
  const missing = missingLocationFor(plan);
  if (missing) {
    showPopup(`Please select ${LEVEL_LABEL[missing]} above to buy this ${LEVEL_LABEL[plan.location_level]}-level plan.`, 'error');
    return;
  }
  // ✅ Optional: sirf apni profile wali location par kharid (LOCK_TO_PROFILE_LOCATION = true)
  if (LOCK_TO_PROFILE_LOCATION && plan.location_level) {
    const u = subscriptionData.currentUser || {};
    const mine = UserStore.trimLocationToLevel(plan.location_level, u);
    const l = getSeatLocation(plan);
    const eq = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
    if (!(eq(mine.state, l.seatState) && eq(mine.district, l.planDistrict) && eq(mine.taluka, l.planTaluka) && eq(mine.village, l.planVillage))) {
      showPopup('You can buy this plan only for your own registered location.', 'error');
      return;
    }
  }
  // ✅ Premium par seat lock nahi — state check / seat ke bina seedha payment
  if (UserStore.isPremiumPlan(plan)) {
    startSubscriptionPayment(plan, '');
    return;
  }
  if (!stateName && !plan.location_level) {
    showPopup('Please select your state first.', 'error', {
      primaryLabel: 'Open',
      secondaryLabel: 'Cancel',
      onPrimaryPress: () =>
        navigation.navigate('StateSelect', { fromPremium: true, autoOpen: true }),
    });
    return;
  }
   setPendingPlan(plan);
  if (activeSeatId) {
    // ✅ Purani seat tabhi use karo jab wo is plan ke role ke liye valid ho; warna plan ke role ki seat.
    const allowedForPlan = UserStore.getSeatIdsForRoleId(plan.role_id_raw) || [];
    const seatForPlan = allowedForPlan.length
      ? (allowedForPlan.includes(activeSeatId) ? activeSeatId : allowedForPlan[0])
      : activeSeatId;
    startSubscriptionPayment(plan, seatForPlan);
    return;
  }
   // ✅ Web par bhi ab seat-select dropdown nahi aayega — Android/iOS jaisa hi
  // seat auto-assign ho jaayega, seedha payment start hoga
  startSubscriptionPayment(plan, UserStore.getSeatIdForRoleId(plan.role_id_raw) || activeSeatId || '');
};

   // ── App (iOS / Android) — image header + horizontal carousel (side arrows
  // se ya swipe se scroll), fixed bottom "Pay" bar jiska color selected card
  // ke hisaab se badalta hai ──
  const selectedPlanIndex = subscriptionData.plans.findIndex((p) => p.plan_id === selectedPlanId);
  const selectedPlanObj = selectedPlanIndex >= 0 ? subscriptionData.plans[selectedPlanIndex] : null;
  const isSelectedPlanActive = Boolean(
    selectedPlanObj && activePlanLive?.plan_id === selectedPlanObj.plan_id
  );
  const selectedTheme = getCardTheme(selectedPlanIndex >= 0 ? selectedPlanIndex : 0);

  // ✅ jo plan buy kiya hua hai (active), uska theme (color/image) — status card isi color ka dikhega
  const activePlanIndex = subscriptionData.plans.findIndex(
    (p) => String(p.plan_id) === String(subscriptionData.activePlan?.plan_id)
  );
  // ✅ FIX: plan list khaali ho ya id match na kare tab bhi red theme fallback lo,
  // taaki active card hamesha themed (red) dikhe — plain white kabhi na ho
  const activePlanTheme = getCardTheme(activePlanIndex >= 0 ? activePlanIndex : 1);

  // ✅ filter cell width: wide web = 4 in a row, baaki sab jagah 2x2
  const filterCellStyle = (isWeb && !isCompactWeb) ? { flex: 1 } : { width: '48.5%' };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
    <View style={S.root}>

      {/* Header — image background (screenshot jaisa) */}
      {Platform.OS === 'web' ? (
        /* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */
        <ModuleWebHeader title="Upgrade Your Role" navigation={navigation} />
      ) : (
         Platform.OS !== 'web' ? (
<ModuleAndroidHeader title="Upgrade Your Role" onBack={() => smartGoBack(navigation, 'QuickMenu')} />
) : (
<ImageBackground
        source={HEADER_BG_IMAGE}
        style={S.headerImageWrap}
        imageStyle={S.headerImageInner}
        resizeMode="cover"
      >
        <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={S.headerBackBtn}>
          <Feather name="arrow-left" size={20} color="#ffffff" />
          <Text style={S.headerBackBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>Upgrade Your Role</Text>
        <View style={{ width: 60 }} />
      </ImageBackground>
)
      )}

      <ScrollView
        contentContainerStyle={[
          S.scrollContent,
          selectedPlanObj && !isSelectedPlanActive ? { paddingBottom: 200 } : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.heroPlain}>
          <Text style={S.heroTitlePlain}>Choose Your Subscription Plan</Text>
          <Text style={S.heroSubtitlePlain}>
            Unlock more benefits, greater visibility and a stronger presence.
          </Text>
        </View>

      {activeReady ? (
           <View style={{ width: '100%', maxWidth: 560, marginBottom: 16, alignSelf: 'center' }}>
            <SubscriptionStatusCard
              isActive={Boolean(activePlanLive)}
              roles={subscriptionData.activePlan?.role_names}
              planName={subscriptionData.activePlan?.plan_name}
              price={subscriptionData.activePlan?.price}
              duration={subscriptionData.activePlan?.duration}
              credits={subscriptionData.activePlan?.credits}
              features={subscriptionData.activePlan?.features}
              purchasedAt={subscriptionData.activePlan?.purchased_at}
              expiresAt={subscriptionData.activePlan?.expires_at}
                            themeImage={getNativeThemeImage(activePlanTheme)}
              textColor={activePlanTheme?.textColor}
            />
          </View>
        ) : null}

             {/* Plans — 2x2 static grid (screenshot jaisa), no horizontal scroll */}
        {/* Title + Reset (sirf tab dikhta hai jab koi filter laga ho) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={[S.sectionTitle, { marginBottom: 0 }]}>Our Premium Plans</Text>
          {(filterState || filterDistrict || filterTaluka || filterVillage) ? (
            <TouchableOpacity
              onPress={() => { setFilterState(''); setFilterDistrict(''); setFilterTaluka(''); setFilterVillage(''); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Feather name="x" size={13} color="#dc2626" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626', marginLeft: 3 }}>Reset</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ✅ Compact filter grid — mobile par 2x2, wide web par ek hi row me 4 */}
        <View
          style={{
            flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
            rowGap: 8, columnGap: 8, marginBottom: 12,
            position: 'relative', zIndex: 50, elevation: 50,
          }}
        >
          <LocationFilterDropdown
            label="State"
            value={filterState}
            options={INDIAN_STATES}
            placeholder="All States"
            cellStyle={filterCellStyle}
            onChange={(v) => { setFilterState(v); setFilterDistrict(''); setFilterTaluka(''); setFilterVillage(''); }}
          />
          <LocationFilterDropdown
            label="District"
            value={filterDistrict}
            options={filterDistrictOptions}
            placeholder="All Districts"
            disabled={!filterState}
            cellStyle={filterCellStyle}
            onChange={(v) => { setFilterDistrict(v); setFilterTaluka(''); setFilterVillage(''); }}
          />
          <LocationFilterDropdown
            label="Taluka"
            value={filterTaluka}
            options={filterTalukaOptions}
            placeholder="All Talukas"
            disabled={!filterDistrict}
            cellStyle={filterCellStyle}
            onChange={(v) => { setFilterTaluka(v); setFilterVillage(''); }}
          />
          <LocationFilterDropdown
            label="Village"
            value={filterVillage}
            options={filterVillageOptions}
            placeholder="All Villages"
            disabled={!filterTaluka}
            cellStyle={filterCellStyle}
            onChange={setFilterVillage}
          />
        </View>

            {loadError ? (
          <Text style={[S.loadingText, { color: '#b91c1c', marginBottom: 10 }]}>{loadError}</Text>
        ) : null}

            {!loading && subscriptionData.plans.length > filteredPlans.length ? (
          <Text style={[S.loadingText, { marginBottom: 10, paddingVertical: 0, fontSize: 11.5, lineHeight: 16 }]}>
            {subscriptionData.plans.length - filteredPlans.length} more plan(s) are available for specific locations. Select State / District / Taluka / Village above to see them.
          </Text>
        ) : null}

            {loading ? (
          <Text style={S.loadingText}>Loading plans…</Text>
        ) : filteredPlans.length === 0 ? (
          <Text style={S.loadingText}>
            No subscription plans are available for this location. Try changing the State / District / Taluka filter.
          </Text>
        ) : (
          <View style={S.plansGrid}>
            {filteredPlans.map((plan, index) => {
              const isActive = isPlanActiveHere(plan);
              const isSold = isPlanSold(plan);
              const needLoc = !isActive && !isSold ? missingLocationFor(plan) : '';
              const isSelected = selectedPlanId === plan.plan_id;
              const theme = getCardTheme(index);
                        return (
                <View key={plan.plan_id} style={S.planCardWrap}>
                  <ImageBackground
                    source={theme.image}
                    style={[S.planCard, isSelected && S.planCardSelected, isActive && S.planCardActive]}
                    imageStyle={S.planCardImage}
                    resizeMode="cover"
                  >
                             <Text style={[S.planName, { color: theme.textColor }]} numberOfLines={1}>
                      {plan.plan_name}
                    </Text>
                    <Text style={[S.planDuration, { color: theme.mutedColor }]}>{plan.duration}</Text>
                    {plan.location_level ? (
                      <Text style={{ color: theme.mutedColor, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                        {`Per ${LEVEL_LABEL[plan.location_level]} • same price for every ${LEVEL_LABEL[plan.location_level].toLowerCase()}`}
                      </Text>
                    ) : null}

                    <View style={S.planPriceRow}>
                      <Text style={[S.planPrice, { color: theme.textColor }]}>₹{plan.price}</Text>
                      {plan.original_price != null && (
                        <Text style={[S.planPriceOriginal, { color: theme.mutedColor }]}>
                          ₹{plan.original_price}
                        </Text>
                      )}
                    </View>

                                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <View style={S.featuresList}>
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <View key={idx} style={S.featureRow}>
                            <Feather name="check" size={12} color={theme.checkColor} style={S.featureIcon} />
                            <Text style={[S.featureText, { color: theme.textColor }]} numberOfLines={1}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {Array.isArray(plan.features) && plan.features.length > 3 && (
                      <TouchableOpacity onPress={() => setDetailsModal({ plan, theme })}>
                        <Text style={{ color: theme.textColor, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline', marginBottom: 6 }}>
                          Read more
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isActive || paying}
                      onPress={() => handleBuyPlan(plan)}
                      style={[S.selectPlanBtn, isSelected && S.selectPlanBtnActive, isSold && { opacity: 0.6, backgroundColor: '#e5e7eb' }, paying && !isActive && !isSold && { opacity: 0.6 }]}
                    >
                      <Text style={[S.selectPlanBtnText, isSold && { color: '#6b7280' }]}>
                        {isActive ? 'Currently active' : isSold ? 'Sold' : paying ? 'Please wait…' : needLoc ? `Select ${LEVEL_LABEL[needLoc]}` : 'Pay Now'}
                      </Text>
                      {!isActive && !isSold && <Feather name="chevron-right" size={14} color="#b91c1c" />}
                    </TouchableOpacity>
                  </ImageBackground>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

           <Modal visible={!!detailsModal} transparent animationType="fade" onRequestClose={() => setDetailsModal(null)}>
        <TouchableOpacity style={S.seatBackdrop} activeOpacity={1} onPress={() => setDetailsModal(null)}>
          <Pressable style={S.seatSheet} onPress={() => {}}>
            <View style={S.seatHandle} />
            {detailsModal && (
              <>
                <Text style={S.seatTitle}>{detailsModal.plan.plan_name}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 8, marginBottom: 4 }}>
                  ₹{detailsModal.plan.price}
                  {detailsModal.plan.original_price != null && (
                    <Text style={{ fontSize: 14, textDecorationLine: 'line-through', color: '#999' }}> ₹{detailsModal.plan.original_price}</Text>
                  )}
                </Text>
                <Text style={{ color: '#666', marginBottom: 12 }}>{detailsModal.plan.duration}</Text>
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  {(detailsModal.plan.features || []).map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <Feather name="check" size={14} color={detailsModal.theme.checkColor} />
                      <Text style={{ flex: 1 }}>{f}</Text>
                    </View>
                  ))}
                </ScrollView>
                           <TouchableOpacity
                  onPress={() => { const p = detailsModal.plan; setDetailsModal(null); handleBuyPlan(p); }}
                  style={[S.seatSubmitBtn, { marginTop: 14 }]}
                >
                  <Text style={S.seatSubmitBtnText}>Pay Now</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </View>
    </SafeAreaView>
  );
}