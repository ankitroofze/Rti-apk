import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useToast } from '../components/ui/ToastProvider';
import S from '../styles/SubscriptionPlansStyles';
import { UserStore } from '../store/UserStore';

// ─────────────────────────────────────────────
// Role badge colors (kept outside StyleSheet — dynamic per role)
// ─────────────────────────────────────────────
const ROLE_COLORS = {
  free:    { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
  basic:   { bg: '#fff0f5', text: '#ea580c', border: '#ffd6e7' },
  pro:     { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  premium: { bg: '#fefce8', text: '#b45309', border: '#fcd34d' },
};

// ─────────────────────────────────────────────
// RoleBadge — unchanged (used in both app & web)
// ─────────────────────────────────────────────
function RoleBadge({ role = 'free', label }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.free;
  const iconName =
    role === 'premium' ? 'star'
    : role === 'pro'   ? 'award'
    : role === 'basic' ? 'check-circle'
    : 'user';

  return (
    <View style={[S.roleBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Feather name={iconName} size={12} color={colors.text} />
      <Text style={[S.roleBadgeText, { color: colors.text }]}>
        {label || UserStore.getRoleLabel(role)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// SeatSelectModal — unchanged
// ─────────────────────────────────────────────
function SeatSelectModal({
  visible,
  stateName,
  seats,
  selectedSeatId,
  pendingPlan,
  onClose,
  onSelectSeatId,
}) {
  const seatsToShow = Array.isArray(seats) ? seats : [];
  const isLoadingSeats = seatsToShow.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={S.seatBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
      <View style={S.seatSheet}>
        <View style={S.seatHandle} />
        <Text style={S.seatTitle}>Select your seat</Text>
        <View style={S.seatStateRow}>
          <View style={S.seatStateDot} />
          <Text style={S.seatStateText}>{stateName || '-'}</Text>
        </View>
        {pendingPlan ? (
          <View style={S.pendingPlanBox}>
            <Text style={S.pendingPlanLabel}>Selected Plan</Text>
            <Text style={S.pendingPlanName}>{pendingPlan.plan_name}</Text>
            <Text style={S.pendingPlanMeta}>₹{pendingPlan.price} · {pendingPlan.duration}</Text>
          </View>
        ) : null}
        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoadingSeats ? (
            <Text style={S.seatLoadingText}>Loading seats…</Text>
          ) : null}
          <View style={S.seatList}>
            {seatsToShow.map((seat) => {
              const isTaken    = seat.status === 'taken';
              const isDisabled = seat.status === 'disabled';
              const isSelected = selectedSeatId === seat.id;
              const disabled   = isTaken || isDisabled;
              const statusText =
                seat.status === 'mine' ? 'Yours'
                : isTaken              ? 'Taken'
                : isDisabled           ? 'Disabled'
                : 'Available';
              return (
                <TouchableOpacity
                  key={seat.id}
                  activeOpacity={0.85}
                  disabled={disabled}
                  onPress={() => onSelectSeatId(seat.id)}
                  style={[
                    S.seatItem,
                    isSelected && S.seatItemSelected,
                    disabled   && S.seatItemDisabled,
                  ]}
                >
                  <View style={S.seatItemLeft}>
                    <Text style={[S.seatItemName, disabled && S.seatItemNameDisabled]}>
                      {seat.name}
                    </Text>
                    <Text style={[S.seatItemStatus, disabled && S.seatItemStatusMuted]}>
                      {statusText}
                    </Text>
                  </View>
                  {isSelected
                    ? <View style={S.seatCheckCircle}><Feather name="check" size={13} color="#fff" /></View>
                    : <View style={S.seatCheckCircleEmpty} />
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// WEB-ONLY: 3-column pricing layout
// (renders only when Platform.OS === 'web')
// ─────────────────────────────────────────────
const WEB_ORANGE       = '#ea580c';
const WEB_ORANGE_DARK  = '#ea6a0a';
const WEB_ORANGE_LIGHT = '#fff7ed';

const webStyles = StyleSheet.create({
  pageScroller: {
    flex: 1,
    backgroundColor: '#fff4ec',
  },
  // ── Page wrapper ──
  pageWrapper: {
    flexGrow: 1,
    backgroundColor: '#fff4ec',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  pageWrapperCompact: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  innerBox: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    width: '100%',
    maxWidth: 1100,
    overflow: 'hidden',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 8,
  },
  innerBoxCompact: {
    maxWidth: '100%',
    borderRadius: 0,
    minHeight: 'auto',
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Navbar ──
  navbar: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 32,
  paddingVertical: 18,
  borderBottomWidth: 1,
  borderBottomColor: '#ffede0',
},
  navbarCompact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: WEB_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 36,
  },
  navLogoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  navLinks: {
    flexDirection: 'row',
    flex: 1,
    gap: 36,
  },
  navLink: {
    fontSize: 15,
    fontWeight: '500',
    color: '#78716c',
  },
  navLinkActive: {
    color: WEB_ORANGE,
    fontWeight: '700',
  },
  navLoginBtn: {
    backgroundColor: WEB_ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: WEB_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  navLoginText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Hero ──
  heroSection: {
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 28,
    paddingHorizontal: 32,
  },
  heroSectionCompact: {
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroSubRowCompact: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroSubText: {
    fontSize: 15,
    color: '#78716c',
  },
  heroSubLink: {
    fontSize: 15,
    color: WEB_ORANGE,
    fontWeight: '600',
  },

  // ── Plans grid ──
  plansGrid: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 18,
    alignItems: 'stretch',
  },
  plansGridCompact: {
    flexDirection: 'column',
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 12,
    alignItems: 'stretch',
  },

  // ── Plan card ──
  planCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#ffe8d6',
    backgroundColor: '#fffaf7',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  planCardCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planCardFeatured: {
    backgroundColor: WEB_ORANGE,
    borderColor: WEB_ORANGE,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
  planCardFeaturedCompact: {
    shadowOpacity: 0.18,
  },

  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  planCardHeaderCompact: {
    marginBottom: 10,
    gap: 10,
  },
  planCardName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1c1917',
  },
  planCardNameCompact: {
    fontSize: 16,
    flex: 1,
  },
  planCardNameFeatured: {
    color: '#ffffff',
  },
  popularBadge: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  planCardPrice: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: -1,
    marginBottom: 4,
  },
  planCardPriceCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  planCardPriceFeatured: {
    color: '#ffffff',
  },
  planCardPriceSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: '#a8a29e',
    letterSpacing: 0,
  },
  planCardPriceSuffixCompact: {
    fontSize: 13,
  },
  planCardPriceSuffixFeatured: {
    color: 'rgba(255,255,255,0.7)',
  },

  planCardDesc: {
    fontSize: 13,
    color: '#78716c',
    lineHeight: 20,
    marginBottom: 18,
    minHeight: 40,
  },
  planCardDescCompact: {
    minHeight: 0,
    marginBottom: 12,
  },
  planCardDescFeatured: {
    color: 'rgba(255,255,255,0.82)',
  },

  planDivider: {
    height: 1,
    backgroundColor: '#ffe8d6',
    marginBottom: 16,
  },
  planDividerFeatured: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  featuresList: {
    flex: 1,
    gap: 10,
    marginBottom: 24,
  },
  featuresListCompact: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    fontSize: 13.5,
    color: '#57534e',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  featureTextCompact: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  featureTextFeatured: {
    color: 'rgba(255,255,255,0.90)',
  },
  featureCheckIcon: {
    marginTop: 3,
  },

  planBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: WEB_ORANGE,
    shadowColor: WEB_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  planBtnCompact: {
    paddingVertical: 11,
    borderRadius: 12,
  },
  planBtnOutlined: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowOpacity: 0,
    elevation: 0,
  },
  planBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  planBtnTextCompact: {
    fontSize: 14,
  },
  planBtnTextOutlined: {
    color: WEB_ORANGE,
  },

  // ── Hover state for non-featured cards ──
  planCardHovered: {
    borderColor: WEB_ORANGE,
    backgroundColor: '#fff7ed',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
    transform: [{ translateY: -4 }],
  },

  // ── Nav back button ──
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 28,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffe8d6',
  },
  navBackBtnCompact: {
    marginRight: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navBackBtnText: {
    color: WEB_ORANGE,
    fontSize: 14,
    fontWeight: '700',
  },
});

// Web plan card data — index 1 (middle) is featured
const WEB_PLAN_CARD_META = [
  { featured: false, popular: false },
  { featured: true,  popular: true  },
  { featured: false, popular: false },
];

function WebPlanCard({ plan, index, onPress, compact }) {
  const meta       = WEB_PLAN_CARD_META[index] || {};
  const isFeatured = meta.featured;
  const planRole   = UserStore.getRoleFromPlanId(plan.plan_id);
  const [hovered, setHovered] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress(plan)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        webStyles.planCard,
        compact && webStyles.planCardCompact,
        isFeatured && webStyles.planCardFeatured,
        compact && isFeatured && webStyles.planCardFeaturedCompact,
        !isFeatured && hovered && webStyles.planCardHovered,
      ]}
    >
      {/* Header row */}
      <View style={[webStyles.planCardHeader, compact && webStyles.planCardHeaderCompact]}>
        <Text style={[webStyles.planCardName, compact && webStyles.planCardNameCompact, isFeatured && webStyles.planCardNameFeatured]}>
          {plan.plan_name}
        </Text>
        {meta.popular && (
          <View style={webStyles.popularBadge}>
            <Text style={webStyles.popularBadgeText}>Popular</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <Text style={[webStyles.planCardPrice, compact && webStyles.planCardPriceCompact, isFeatured && webStyles.planCardPriceFeatured]}>
        ₹{plan.price}{' '}
        <Text style={[webStyles.planCardPriceSuffix, compact && webStyles.planCardPriceSuffixCompact, isFeatured && webStyles.planCardPriceSuffixFeatured]}>
          /{plan.duration}
        </Text>
      </Text>

      {/* Description / role badge as desc */}
      <Text style={[webStyles.planCardDesc, compact && webStyles.planCardDescCompact, isFeatured && webStyles.planCardDescFeatured]}>
        {plan.description || `${plan.plan_name} for a comprehensive experience.`}
      </Text>

      {/* Divider */}
      <View style={[webStyles.planDivider, isFeatured && webStyles.planDividerFeatured]} />

      {/* Features */}
      <View style={[webStyles.featuresList, compact && webStyles.featuresListCompact]}>
        {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
          <View key={idx} style={webStyles.featureRow}>
            <Feather
              name="check"
              size={14}
              color={isFeatured ? 'rgba(255,255,255,0.9)' : WEB_ORANGE}
              style={webStyles.featureCheckIcon}
            />
            <Text style={[webStyles.featureText, compact && webStyles.featureTextCompact, isFeatured && webStyles.featureTextFeatured]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => onPress(plan)}
        style={[webStyles.planBtn, compact && webStyles.planBtnCompact, isFeatured && webStyles.planBtnOutlined]}
      >
        <Text style={[webStyles.planBtnText, compact && webStyles.planBtnTextCompact, isFeatured && webStyles.planBtnTextOutlined]}>
          Go Premium
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function WebLayout({ subscriptionData, loading, handleBuyPlan, navigation, compact }) {
  return (
    <ScrollView
      style={webStyles.pageScroller}
      contentContainerStyle={[webStyles.pageWrapper, compact && webStyles.pageWrapperCompact]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[webStyles.innerBox, compact && webStyles.innerBoxCompact]}>

        {/* Navbar */}
<View style={[webStyles.navbar, compact && webStyles.navbarCompact]}>
  <TouchableOpacity
    style={[webStyles.navBackBtn, compact && webStyles.navBackBtnCompact]}
    onPress={() => navigation.goBack()}
  >
    <Feather name="arrow-left" size={16} color={WEB_ORANGE} />
    <Text style={webStyles.navBackBtnText}>Back</Text>
  </TouchableOpacity>
</View>

        {/* Hero */}
        <View style={[webStyles.heroSection, compact && webStyles.heroSectionCompact]}>
          <Text style={[webStyles.heroTitle, compact && webStyles.heroTitleCompact]}>Unlock Fitness Excellence With Premium</Text>
          <View style={[webStyles.heroSubRow, compact && webStyles.heroSubRowCompact]}>
            <Text style={webStyles.heroSubText}>Pick the plan that's best for you, or </Text>
            <Text style={webStyles.heroSubLink}>call us</Text>
            <Text style={webStyles.heroSubText}> to find it</Text>
          </View>
        </View>

        {/* 3-column Plans */}
        <View style={[webStyles.plansGrid, compact && webStyles.plansGridCompact]}>
          {loading ? (
            <Text style={S.loadingText}>Loading plans…</Text>
          ) : (
            subscriptionData.plans.map((plan, index) => (
              <WebPlanCard
                key={plan.plan_id}
                plan={plan}
                index={index}
                onPress={handleBuyPlan}
                compact={compact}
              />
            ))
          )}
        </View>

      </View>
    </ScrollView>
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
  const [seatSummary, setSeatSummary]       = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState('');
  const [pendingPlan, setPendingPlan]       = useState(null);
  const [seatModalOpen, setSeatModalOpen]   = useState(false);

  const [subscriptionData, setSubscriptionData] = useState({
    currentUser:      null,
    activePlan:       null,
    plans:            [],
    currentRole:      'free',
    currentRoleLabel: 'Free Member',
  });
  const returnTo = route?.params?.returnTo || 'Subscription Plans';

  const loadPlans = useCallback(async () => {
    setLoading(true);
    const [data, seatData] = await Promise.all([
      UserStore.getSubscriptionSummary(),
      UserStore.getStateSeatSummary(),
    ]);
    setLoading(false);
    if (!data) { navigation.replace('Login'); return; }
    setSubscriptionData(data);
    setSeatSummary(seatData || null);
    const seatId = seatData?.current_seat?.seat_id || '';
    setSelectedSeatId((prev) => prev || seatId);
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadPlans(); }, [loadPlans]));

  const stateName    = seatSummary?.state || subscriptionData.currentUser?.state || '';
  const activeSeatId = seatSummary?.current_seat?.seat_id || '';

  const navigateToPayment = (plan, seatStateName, seatRoleIdToUse) => {
    navigation.navigate('Payment', {
      order: {
        plan_id:      plan.plan_id,
        plan_name:    plan.plan_name,
        amount:       plan.price,
        seat_state:   seatStateName,
        seat_role_id: seatRoleIdToUse,
      },
      returnTo,
    });
  };

  const handleBuyPlan = (plan) => {
    if (!stateName) {
      showPopup('Please select your state first.', 'error', {
        primaryLabel: 'Open',
        secondaryLabel: 'Cancel',
        onPrimaryPress: () =>
          navigation.navigate('StateSelect', { fromPremium: true, autoOpen: true }),
      });
      return;
    }
    setPendingPlan(plan);
    // if (activeSeatId) { navigateToPayment(plan, stateName, activeSeatId); return; }
    if (activeSeatId) {
    startSubscriptionPayment(plan, activeSeatId);
    return;
}
    setSeatModalOpen(true);
  };

  // ── Web renders its own full layout ──
  if (Platform.OS === 'web') {
    return (
      <>
        <WebLayout
          subscriptionData={subscriptionData}
          loading={loading}
          handleBuyPlan={handleBuyPlan}
          navigation={navigation}
          compact={isCompactWeb}
        />
        {/* Seat modal works on web too */}
        <SeatSelectModal
          visible={seatModalOpen}
          stateName={stateName}
          seats={seatSummary?.seats || []}
          selectedSeatId={selectedSeatId}
          pendingPlan={pendingPlan}
          onClose={() => setSeatModalOpen(false)}
          onSelectSeatId={(seatId) => {
            if (!seatId || !pendingPlan) return;
            setSelectedSeatId(seatId);
            setSeatModalOpen(false);
            const selectedPlan = pendingPlan;
            setPendingPlan(null);
         startSubscriptionPayment(selectedPlan, seatId);
          }}
        />
      </>
    );
  }

  // ── App (iOS / Android) — original code untouched ──
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={S.root}>

      <TouchableOpacity
        onPress={() => navigation.navigate('QuickMenu')}
        style={S.backBtn}
      >
        <Feather name="arrow-left" size={20} color="#ea580c" />
        <Text style={S.backBtnText}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.heroCard}>
          <Text style={S.heroEyebrow}>Plans</Text>
          <Text style={S.heroTitle}>Subscription Plans</Text>
          <Text style={S.heroSubtitle}>Choose a plan that suits your needs</Text>
        </View>

        {/* Plans */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Available Plans</Text>

          {loading ? (
            <Text style={S.loadingText}>Loading plans…</Text>
          ) : (
            subscriptionData.plans.map((plan) => {
              const isActive = subscriptionData.activePlan?.plan_id === plan.plan_id;
              const planRole = UserStore.getRoleFromPlanId(plan.plan_id);

              return (
                <TouchableOpacity
                  key={plan.plan_id}
                  activeOpacity={0.92}
                  disabled={isActive}
                  onPress={() => handleBuyPlan(plan)}
                  style={[S.planCard, isActive && S.planCardActive]}
                >
                  <View style={S.planTopRow}>
                    <View style={S.planTitleWrap}>
                      <Text style={S.planName}>{plan.plan_name}</Text>
                      <Text style={S.planDuration}>{plan.duration}</Text>
                    </View>
                    <RoleBadge role={planRole} />
                  </View>

                  <Text style={S.planPrice}>₹{plan.price}</Text>

                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <View style={S.featuresList}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={S.featureRow}>
                          <Feather name="check" size={13} color="#14b87a" style={S.featureIcon} />
                          <Text style={S.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!isActive && <Text style={S.tapHint}>Tap to continue →</Text>}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <SeatSelectModal
        visible={seatModalOpen}
        stateName={stateName}
        seats={seatSummary?.seats || []}
        selectedSeatId={selectedSeatId}
        pendingPlan={pendingPlan}
        onClose={() => setSeatModalOpen(false)}
        onSelectSeatId={(seatId) => {
          if (!seatId || !pendingPlan) return;
          setSelectedSeatId(seatId);
          setSeatModalOpen(false);
          const selectedPlan = pendingPlan;
          setPendingPlan(null);
          startSubscriptionPayment(selectedPlan, seatId);
        }}
      />
    </View>
    </SafeAreaView>
  );
}