import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
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
// Role badge colors (kept outside StyleSheet — dynamic per role)
// ─────────────────────────────────────────────
const ROLE_COLORS = {
  free:    { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
  basic:   { bg: '#fff0f5', text: '#ea580c', border: '#ffd6e7' },
  pro:     { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  premium: { bg: '#fefce8', text: '#b45309', border: '#fcd34d' },
};

// ─────────────────────────────────────────────
// LocationFilterDropdown — State/District/Taluka filter chip
// (web/Android/iOS teeno par same dikhta hai, koi Platform check nahi)
// ─────────────────────────────────────────────
function LocationFilterDropdown({ label, value, options, onChange, placeholder = 'All', disabled = false }) {
  const [open, setOpen] = useState(false);
  return (
        <View style={{ ...(Platform.OS === 'android' ? { width: '100%' } : { flex: 1 }), position: 'relative', zIndex: open ? 20 : 1, elevation: open ? 20 : 1 }}>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => !disabled && setOpen((o) => !o)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 10,
          backgroundColor: disabled ? '#F3F4F6' : '#fff',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', marginBottom: 1 }}>{label}</Text>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: value ? '#111827' : '#9CA3AF' }}>
            {value || placeholder}
          </Text>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
      </TouchableOpacity>

      {open && !disabled && (
           <View
          style={{
            marginTop: 6, maxHeight: 220,
            backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
            paddingVertical: 4, overflow: 'hidden',
          }}
        >
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {value ? (
              <TouchableOpacity style={{ paddingVertical: 9, paddingHorizontal: 14 }} onPress={() => { onChange(''); setOpen(false); }}>
                <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '700' }}>Clear ({placeholder})</Text>
              </TouchableOpacity>
            ) : null}
                  {options.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#9CA3AF', paddingVertical: 9, paddingHorizontal: 14 }}>
                      {label === 'Village' ? 'No villages found' : 'No data found'}
              </Text>
            ) : null}
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={{ paddingVertical: 9, paddingHorizontal: 14 }}
                onPress={() => { onChange(opt); setOpen(false); }}
              >
                <Text style={{ fontSize: 13, color: opt === value ? '#dc2626' : '#374151', fontWeight: opt === value ? '700' : '500' }}>
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
  onSubmit,
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

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!selectedSeatId}
          onPress={() => onSubmit?.(selectedSeatId)}
          style={[
            S.seatSubmitBtn,
            !selectedSeatId && S.seatSubmitBtnDisabled,
          ]}
        >
          <Text style={S.seatSubmitBtnText}>Submit</Text>
        </TouchableOpacity>
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
  const seatRoleName = UserStore.getSeatRoleNameForPlanRoleId(plan.role_id_raw);
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
              <View>
          <Text style={[webStyles.planCardName, compact && webStyles.planCardNameCompact, isFeatured && webStyles.planCardNameFeatured]}>
            {plan.plan_name}
          </Text>
          {seatRoleName ? (
            <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 2, color: isFeatured ? 'rgba(255,255,255,0.85)' : '#F97316' }}>
              {seatRoleName}
            </Text>
          ) : null}
        </View>
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

        {/* ✅ NEW: Active subscription status card — web par bhi dikhna chahiye */}
        {!loading ? (
          <View style={{ width: '100%', maxWidth: 560, marginHorizontal: 'auto', marginBottom: 16 }}>
                      <SubscriptionStatusCard
              isActive={Boolean(subscriptionData.activePlan) && (!subscriptionData.activePlan?.expires_at || new Date(subscriptionData.activePlan.expires_at) >= new Date())}
              planName={subscriptionData.activePlan?.plan_name}
              price={subscriptionData.activePlan?.price}
              purchasedAt={subscriptionData.activePlan?.purchased_at}
expiresAt={subscriptionData.activePlan?.expires_at}
              roles={subscriptionData.activePlan?.role_names}
              onBuyPress={() => setSeatModalOpen(true)}
            />
          </View>
        ) : null}

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
                onPress={(p) => navigation.navigate('SubscriptionPlanDetails', {
                  headerTitle: 'Subscription Plans',
                  plan: p,
                  theme: getCardTheme(index),
                  isActive: subscriptionData.activePlan?.plan_id === p.plan_id,
                  onBuyPlan: handleBuyPlan,
                })}
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
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [detailsModal, setDetailsModal] = useState(null); // Read More pe click hote hi { plan, theme } set hogaoga
  // ✅ Sold seats (plan + location key). Backend 409 seat_unavailable aate hi yahan add hota hai.
  const [soldKeys, setSoldKeys] = useState([]);

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
  const filteredPlans = subscriptionData.plans.filter((plan) => {
    const matchState    = !plan.state    || (filterState    && String(plan.state).trim().toLowerCase()    === filterState.toLowerCase());
    const matchDistrict = !plan.district || (filterDistrict && String(plan.district).trim().toLowerCase() === filterDistrict.toLowerCase());
    const matchTaluka   = !plan.taluka   || (filterTaluka   && String(plan.taluka).trim().toLowerCase()   === filterTaluka.toLowerCase());
    const matchVillage  = !plan.village  || (filterVillage  && String(plan.village).trim().toLowerCase()  === filterVillage.toLowerCase());
    const isMyActivePlan = subscriptionData.activePlan?.plan_id === plan.plan_id;
    return isMyActivePlan || (matchState && matchDistrict && matchTaluka && matchVillage);
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
const getSeatLocation = (plan) => ({
  seatState:    plan?.state    || filterState    || stateName,
  planDistrict: plan?.district || filterDistrict || subscriptionData.currentUser?.district || '',
  planTaluka:   plan?.taluka   || filterTaluka   || subscriptionData.currentUser?.taluka   || '',
  planVillage:  plan?.village  || filterVillage  || subscriptionData.currentUser?.village  || '',
});
const soldKeyFor = (plan) => {
  const l = getSeatLocation(plan);
  return [plan?.plan_id, l.seatState, l.planDistrict, l.planTaluka, l.planVillage]
    .map((v) => String(v || '').trim().toLowerCase()).join('|');
};
// Premium par seat lock nahi — wo kabhi Sold nahi hota. Active plan bhi Sold nahi dikhega.
const isPlanSold = (plan) => {
  if (!plan || UserStore.isPremiumPlan(plan)) return false;
  if (subscriptionData.activePlan?.plan_id === plan.plan_id) return false;
  return Boolean(plan.is_sold) || soldKeys.includes(soldKeyFor(plan));
};
const markPlanSold = (plan) => {
  const k = soldKeyFor(plan);
  setSoldKeys((prev) => (prev.includes(k) ? prev : [...prev, k]));
};

// 👇 YAHAN ADD KARO (navigateToPayment ki jagah)
const startSubscriptionPayment = async (plan, seatRoleId) => {
  // ✅ FIX: pendingPlan (outer state) ek render peeche reh sakta hai kyunki
  // setPendingPlan() async hai — isliye location seedha `plan` argument se
  // nikalo, taaki hamesha wahi plan ki apni district/taluka/village jaaye
  // jiske liye actually payment ho raha hai.
  // ✅ Seat location ki priority: plan ki fixed location > screen par chuna hua filter > profile.
  // Pehle filter ignore hota tha, isliye 2 users alag profile location se alag seat khareed rahe the.
  const { seatState, planDistrict, planTaluka, planVillage } = getSeatLocation(plan);

  const orderResult = await UserStore.createPaymentOrder({
    plan_id: plan.plan_id,
    seat_state: seatState,
    seat_district: planDistrict,
    seat_taluka: planTaluka,
    seat_village: planVillage,
    seat_role_id: seatRoleId,
  });

  // ✅ 409 seat_unavailable / koi bhi error: message dikhao, Razorpay mat kholo,
  // user dusri location chun sakta hai
  if (!orderResult || orderResult.error) {
    // ✅ 409 seat_unavailable -> is location par plan Sold mark, dobara buy nahi hoga
    if (orderResult?.seatUnavailable) markPlanSold(plan);
    showPopup(orderResult?.message || 'Unable to create order.', 'error');
    return;
  }

  await openRazorpayCheckout(orderResult.razorpay, 'role', {
    onVerified: async (response) => {
    const verifyResult = await UserStore.verifyPayment({
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
      });

      if (verifyResult?.ok) {
        showPopup(`🎉 ${plan.plan_name} activated!`, 'success');
        setTimeout(() => navigation.navigate(returnTo), 1500);
      } else {
        // ✅ verify 409 (seat_unavailable) yahin aata hai — "activated" mat dikhao, sirf message
        if (verifyResult?.seatUnavailable) markPlanSold(plan);
        showPopup(verifyResult?.message || 'Payment verification failed.', 'error');
      }
    },
    onFailed: async (errorInfo) => {
      // ✅ 'role' pass karo -> POST /role-subscriptions/payment/failed (seat turant free)
      await UserStore.markPaymentFailed(
        errorInfo.razorpay_order_id,
        errorInfo.error_code,
        errorInfo.error_description,
        'role'
      );
      showPopup(errorInfo.error_description || 'Payment failed.', 'error');
    },
  });
};
const handleBuyPlan = (plan) => {
  // ✅ Sold plan ko koi doosra user buy nahi kar sakta
  if (isPlanSold(plan)) {
    showPopup('This seat is already taken. Please choose another location.', 'error');
    return;
  }
  // ✅ Premium par seat lock nahi — state check / seat ke bina seedha payment
  if (UserStore.isPremiumPlan(plan)) {
    startSubscriptionPayment(plan, '');
    return;
  }
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
  if (activeSeatId) {
    startSubscriptionPayment(plan, activeSeatId);
    return;
  }
   // ✅ Web par bhi ab seat-select dropdown nahi aayega — Android/iOS jaisa hi
  // seat auto-assign ho jaayega, seedha payment start hoga
  startSubscriptionPayment(plan, UserStore.getSeatIdForRoleId(plan.role_id_raw) || activeSeatId || '');
};

// const handleBuyPlan = (plan) => {
//   if (!stateName) {
//     showPopup('Please select your state first.', 'error', {
//       primaryLabel: 'Open',
//       secondaryLabel: 'Cancel',
//       onPrimaryPress: () =>
//         navigation.navigate('StateSelect', { fromPremium: true, autoOpen: true }),
//     });
//     return;
//   }
//   setPendingPlan(plan);
//   if (activeSeatId) {
//     navigateToPayment(plan, stateName, activeSeatId);   // ✅ fixed
//     return;
//   }
//   setSeatModalOpen(true);
// };

  // ── Web renders its own full layout ──
  // if (Platform.OS === 'web') {
  //   return (
  //     <>
  //       <WebLayout
  //         subscriptionData={subscriptionData}
  //         loading={loading}
  //         handleBuyPlan={handleBuyPlan}
  //         navigation={navigation}
  //         compact={isCompactWeb}
  //       />
  //       {/* Seat modal works on web too */}
  //     <SeatSelectModal
  //       visible={seatModalOpen}
  //       stateName={stateName}
  //            seats={restrictedSeats}

  //       selectedSeatId={selectedSeatId}
  //       pendingPlan={pendingPlan}
  //       onClose={() => setSeatModalOpen(false)}
  //         onSelectSeatId={(seatId) => {
  //         if (!seatId) return;
  //         setSelectedSeatId(seatId);
  //       }}
  //       onSubmit={(seatId) => {
  //         if (!seatId || !pendingPlan) return;
  //         setSeatModalOpen(false);
  //         const selectedPlan = pendingPlan;
  //         setPendingPlan(null);
  //         startSubscriptionPayment(selectedPlan, seatId);
  //       }}
  //     />
  //     </>
  //   );
  // }
   // ── App (iOS / Android) — image header + horizontal carousel (side arrows
  // se ya swipe se scroll), fixed bottom "Pay" bar jiska color selected card
  // ke hisaab se badalta hai ──
  const selectedPlanIndex = subscriptionData.plans.findIndex((p) => p.plan_id === selectedPlanId);
  const selectedPlanObj = selectedPlanIndex >= 0 ? subscriptionData.plans[selectedPlanIndex] : null;
  const isSelectedPlanActive = Boolean(
    selectedPlanObj && subscriptionData.activePlan?.plan_id === selectedPlanObj.plan_id
  );
  const selectedTheme = getCardTheme(selectedPlanIndex >= 0 ? selectedPlanIndex : 0);

  // ✅ jo plan buy kiya hua hai (active), uska theme (color/image) — status card isi color ka dikhega
  const activePlanIndex = subscriptionData.plans.findIndex(
    (p) => String(p.plan_id) === String(subscriptionData.activePlan?.plan_id)
  );
  // ✅ FIX: plan list khaali ho ya id match na kare tab bhi red theme fallback lo,
  // taaki active card hamesha themed (red) dikhe — plain white kabhi na ho
  const activePlanTheme = getCardTheme(activePlanIndex >= 0 ? activePlanIndex : 1);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
    <View style={S.root}>

      {/* Header — image background (screenshot jaisa) */}
      {Platform.OS === 'web' ? (
        /* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */
        <ModuleWebHeader title="Upgrade Your Role" navigation={navigation} />
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

      {!loading ? (
           <View style={{ width: '100%', maxWidth: 560, marginBottom: 16, alignSelf: 'center' }}>
            <SubscriptionStatusCard
              isActive={Boolean(subscriptionData.activePlan) && (!subscriptionData.activePlan?.expires_at || new Date(subscriptionData.activePlan.expires_at) >= new Date())}
              roles={subscriptionData.activePlan?.role_names}
              planName={subscriptionData.activePlan?.plan_name}
              price={subscriptionData.activePlan?.price}
              purchasedAt={subscriptionData.activePlan?.purchased_at}
              expiresAt={subscriptionData.activePlan?.expires_at}
                            themeImage={getNativeThemeImage(activePlanTheme)}
              textColor={activePlanTheme?.textColor}
            />
          </View>
        ) : null}

             {/* Plans — 2x2 static grid (screenshot jaisa), no horizontal scroll */}
        <Text style={S.sectionTitle}>Our Premium Plans</Text>

               {/* ✅ NEW: State / District / Taluka / Village filter row */}
              <View style={{ flexDirection: Platform.OS === 'android' ? 'column' : 'row', gap: 10, marginBottom: 18, position: 'relative', zIndex: 50, elevation: 50 }}>
          <LocationFilterDropdown
            label="State"
            value={filterState}
            options={INDIAN_STATES}
            placeholder="All States"
            onChange={(v) => { setFilterState(v); setFilterDistrict(''); setFilterTaluka(''); setFilterVillage(''); }}
          />
          <LocationFilterDropdown
            label="District"
            value={filterDistrict}
            options={filterDistrictOptions}
            placeholder="All Districts"
            disabled={!filterState}
            onChange={(v) => { setFilterDistrict(v); setFilterTaluka(''); setFilterVillage(''); }}
          />
          <LocationFilterDropdown
            label="Taluka"
            value={filterTaluka}
            options={filterTalukaOptions}
            placeholder="All Talukas"
            disabled={!filterDistrict}
            onChange={(v) => { setFilterTaluka(v); setFilterVillage(''); }}
          />
          <LocationFilterDropdown
            label="Village"
            value={filterVillage}
            options={filterVillageOptions}
            placeholder="All Villages"
            disabled={!filterTaluka}
            onChange={setFilterVillage}
          />
        </View>

            {loading ? (
          <Text style={S.loadingText}>Loading plans…</Text>
        ) : filteredPlans.length === 0 ? (
          <Text style={S.loadingText}>
            Is location ke liye koi subscription plan available nahi hai.
          </Text>
        ) : (
          <View style={S.plansGrid}>
            {filteredPlans.map((plan, index) => {
              const isActive = subscriptionData.activePlan?.plan_id === plan.plan_id;
              const isSold = isPlanSold(plan);
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
                      disabled={isActive || isSold}
                      onPress={() => handleBuyPlan(plan)}
                      style={[S.selectPlanBtn, isSelected && S.selectPlanBtnActive, isSold && { opacity: 0.6, backgroundColor: '#e5e7eb' }]}
                    >
                      <Text style={[S.selectPlanBtnText, isSold && { color: '#6b7280' }]}>
                        {isActive ? 'Currently active' : isSold ? 'Sold' : 'Pay Now'}
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

      {/* Fixed bottom Pay bar — selected card ke color/image jaisa hi dikhta hai
      {selectedPlanObj && !isSelectedPlanActive ? (
        <View style={S.payBar}>
          <View style={{ flex: 1 }}>
            <Text style={S.payBarLabel} numberOfLines={1}>
              {selectedPlanObj.plan_name} · {selectedPlanObj.duration}
            </Text>
            <Text style={S.payBarPrice}>₹{selectedPlanObj.price}</Text>
          </View>
          <TouchableOpacity onPress={() => handleBuyPlan(selectedPlanObj)} activeOpacity={0.85}>
                     <ImageBackground
            source={selectedTheme.image}
              style={S.payBtn}
              imageStyle={S.payBtnImage}
              resizeMode="cover"
            >
                        <Text style={[S.payBtnText, { color: selectedTheme.textColor }]}>Pay Now</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      ) : null} */}

           <Modal visible={!!detailsModal} transparent animationType="fade" onRequestClose={() => setDetailsModal(null)}>
        <TouchableOpacity style={S.seatBackdrop} activeOpacity={1} onPress={() => setDetailsModal(null)}>
          <View style={S.seatSheet}>
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
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
    </SafeAreaView>
  );
}