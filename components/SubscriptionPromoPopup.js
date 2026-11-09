// components/SubscriptionPromoPopup.js
// ─────────────────────────────────────────────────────────────────
// Attractive Shuru-Style Subscription / Role Membership Popup Modal
// Displays role subscription plans according to user's location.
// Includes a prominent cancel / cross (X) icon at the top to dismiss.
// ─────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStore } from '../store/UserStore';
import { getCardTheme, HEADER_BG_IMAGE } from '../constants/subscriptionThemes';

const IS_WEB = Platform.OS === 'web';
const { width: WIN_W, height: WIN_H } = Dimensions.get('window');

// Session storage key / memory flag taaki ek hi session me user ko baar-baar na sataye
let sessionDismissed = false;
const SESSION_DISMISS_KEY = '@subscription_promo_dismissed_v1';

export default function SubscriptionPromoPopup({
  navigation,
  currentUser = null,
  selectedStateName = '',
  selectedDistrictName = '',
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [userLocationLabel, setUserLocationLabel] = useState('');

  // Determine user's location
  const userState = useMemo(() => {
    return selectedStateName
      || currentUser?.state
      || currentUser?.state_seat?.state
      || '';
  }, [selectedStateName, currentUser]);

  const userDistrict = useMemo(() => {
    return selectedDistrictName
      || currentUser?.district
      || currentUser?.state_seat?.district
      || '';
  }, [selectedDistrictName, currentUser]);

  // Check whether to show the popup
  useEffect(() => {
    let alive = true;
    (async () => {
      // 1. Agar user already subscribed hai, popup nahi dikhana
      const isSubscribed = Boolean(
        UserStore.hasActiveSubscription?.(currentUser)
        || UserStore.hasActiveRolePlan?.(currentUser)
        || (currentUser?.is_subscribed)
      );
      if (isSubscribed) return;

      // 2. Check session dismissal
      if (sessionDismissed) return;
      try {
        const dismissedAt = await AsyncStorage.getItem(SESSION_DISMISS_KEY);
        // 4 ghante ka cooldown taaki user refresh kare to turant wapas spam na ho
        if (dismissedAt && Date.now() - Number(dismissedAt) < 4 * 60 * 60 * 1000) {
          sessionDismissed = true;
          return;
        }
      } catch (_) { }

      if (!alive) return;

      // Location label
      const loc = [userDistrict, userState].filter(Boolean).join(', ') || 'All India';
      setUserLocationLabel(loc);

      // Load plans according to location
      setLoading(true);
      try {
        const summary = await UserStore.getSubscriptionSummary?.({
          state: userState,
          district: userDistrict,
        }, { skipSync: true });

        const rawPlans = Array.isArray(summary?.plans) ? summary.plans : [];
        // Filter out sold/inactive plans and show top 3-4 attractive role plans
        const available = rawPlans.filter((p) => !p?.is_sold && Number(p?.price) > 0);
        if (alive) {
          setPlans(available.slice(0, 4));
          // Agar plans mile to popup dikhao
          if (available.length > 0) {
            setVisible(true);
          }
        }
      } catch (err) {
        console.warn('[SubscriptionPromoPopup] failed to load plans:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [currentUser, userState, userDistrict]);

  const handleDismiss = useCallback(() => {
    sessionDismissed = true;
    setVisible(false);
    AsyncStorage.setItem(SESSION_DISMISS_KEY, String(Date.now())).catch(() => {});
    if (onClose) onClose();
  }, [onClose]);

  const handleSelectPlan = useCallback((plan) => {
    handleDismiss();
    navigation?.navigate?.('Subscription Plans', {
      returnTo: 'Home',
      preselectedPlanId: plan?.plan_id,
      selectedPlanId: plan?.plan_id,
      autoOpenPlan: plan,
    });
  }, [handleDismiss, navigation]);

  const handleExploreAll = useCallback(() => {
    handleDismiss();
    navigation?.navigate?.('Subscription Plans', { returnTo: 'Home' });
  }, [handleDismiss, navigation]);

  if (!visible || !isFocused) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={st.backdrop}>
        <View style={st.cardContainer}>
          {/* ── Banner Header (Shuru Style) ── */}
          <ImageBackground
            source={HEADER_BG_IMAGE}
            style={st.bannerHeader}
            imageStyle={st.bannerHeaderImg}
            resizeMode="cover"
          >
            {/* Prominent Cancel / Cross (X) icon at top right */}
            <TouchableOpacity
              style={st.cancelBtn}
              onPress={handleDismiss}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close subscription popup"
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>

            {/* Crown / Shield Pill */}
            <View style={st.badgePill}>
              <MaterialCommunityIcons name="crown" size={14} color="#fef08a" />
              <Text style={st.badgePillText}>OFFICIAL JOURNALIST &amp; ROLES</Text>
            </View>

            <Text style={st.bannerTitle}>Join RTI India News Network</Text>
            <Text style={st.bannerSub}>Get your Official Press ID Card &amp; Appointment Letter</Text>

            {/* Location Tag */}
            <View style={st.locTag}>
              <Ionicons name="location-sharp" size={12} color="#fbbf24" />
              <Text style={st.locTagText} numberOfLines={1}>
                Roles available for: <Text style={{ fontWeight: '800' }}>{userLocationLabel}</Text>
              </Text>
            </View>
          </ImageBackground>

          {/* ── 4 Key Perks (Shuru Style highlight pills) ── */}
          <View style={st.perksGrid}>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="card-outline" size={16} color="#dc2626" />
              </View>
              <Text style={st.perkText}>Press ID Card</Text>
            </View>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="document-text-outline" size={16} color="#d97706" />
              </View>
              <Text style={st.perkText}>Letter of Appt.</Text>
            </View>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#2563eb" />
              </View>
              <Text style={st.perkText}>Blue Tick Badge</Text>
            </View>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="megaphone-outline" size={16} color="#16a34a" />
              </View>
              <Text style={st.perkText}>Publish News</Text>
            </View>
          </View>

          {/* ── Role Plans List ── */}
          <ScrollView
            style={st.plansScroll}
            contentContainerStyle={st.plansContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={st.loadingText}>Loading role plans…</Text>
              </View>
            ) : plans.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Text style={st.emptyText}>Tap below to explore all available role plans.</Text>
              </View>
            ) : (
              plans.map((plan, idx) => {
                const theme = getCardTheme(idx);
                return (
                  <TouchableOpacity
                    key={String(plan.plan_id || idx)}
                    style={st.planCardOuter}
                    activeOpacity={0.9}
                    onPress={() => handleSelectPlan(plan)}
                  >
                    <ImageBackground
                      source={theme.image}
                      style={st.planCardInner}
                      imageStyle={st.planCardImg}
                      resizeMode="cover"
                    >
                      <View style={st.planTopRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={st.planRoleBadge}>
                            <Text style={st.planRoleBadgeText}>OFFICIAL ROLE</Text>
                          </View>
                          <Text style={[st.planName, { color: theme.textColor }]} numberOfLines={1}>
                            {plan.plan_name || 'Membership Plan'}
                          </Text>
                          <Text style={[st.planDuration, { color: theme.mutedColor }]}>
                            {plan.duration || '90 Days'}
                          </Text>
                        </View>
                        <View style={st.planPriceBox}>
                          <Text style={[st.planPrice, { color: theme.textColor }]}>₹{plan.price}</Text>
                          {plan.original_price ? (
                            <Text style={[st.planOrigPrice, { color: theme.mutedColor }]}>₹{plan.original_price}</Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Benefits bullets */}
                      <View style={st.featuresBox}>
                        <View style={st.featureItem}>
                          <Feather name="check" size={13} color={theme.checkColor} />
                          <Text style={[st.featureText, { color: theme.textColor }]}>
                            Official Press ID Card &amp; Appointment Letter
                          </Text>
                        </View>
                        <View style={st.featureItem}>
                          <Feather name="check" size={13} color={theme.checkColor} />
                          <Text style={[st.featureText, { color: theme.textColor }]}>
                            Verified Profile &amp; Post News Rights
                          </Text>
                        </View>
                      </View>

                      {/* Select Button */}
                      <View style={st.selectBtnRow}>
                        <View style={st.selectBtn}>
                          <Text style={st.selectBtnText}>Activate Role</Text>
                          <Feather name="arrow-right" size={13} color="#b91c1c" />
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* ── Footer Actions ── */}
          <View style={st.footer}>
            <TouchableOpacity
              style={st.exploreBtn}
              onPress={handleExploreAll}
              activeOpacity={0.85}
            >
              <Text style={st.exploreBtnText}>Explore All Roles &amp; Seats</Text>
              <Feather name="chevron-right" size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={st.skipBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={st.skipBtnText}>Continue to News Feed (Free)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: IS_WEB ? 20 : 12,
  },
  cardContainer: {
    width: '100%',
    maxWidth: IS_WEB ? 500 : 420,
    maxHeight: Math.min(740, WIN_H * 0.92),
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  bannerHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    position: 'relative',
    backgroundColor: '#991b1b',
  },
  bannerHeaderImg: {
    opacity: 0.95,
  },
  cancelBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgePillText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  locTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locTagText: {
    color: '#ffffff',
    fontSize: 11,
  },
  perksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  perkItem: {
    alignItems: 'center',
    flex: 1,
  },
  perkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  perkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  plansScroll: {
    flex: 1,
    maxHeight: 320,
  },
  plansContent: {
    padding: 16,
    gap: 12,
  },
  planCardOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardInner: {
    padding: 14,
    borderRadius: 14,
  },
  planCardImg: {
    borderRadius: 14,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  planRoleBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
  },
  planDuration: {
    fontSize: 11,
    marginTop: 2,
  },
  planPriceBox: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '900',
  },
  planOrigPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  featuresBox: {
    marginTop: 8,
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  selectBtnRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectBtnText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});

