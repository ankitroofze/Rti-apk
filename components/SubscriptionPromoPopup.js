// components/SubscriptionPromoPopup.js
// ─────────────────────────────────────────────────────────────────
// Professional, Clean Role Membership Popup Modal
// Displays official press role subscription plans with location context.
// All images properly cover their containers with no background bleed.
// Typography unified with Roboto throughout.
// ─────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
const { height: WIN_H } = Dimensions.get('window');

const ROBOTO_REGULAR = IS_WEB ? "'Roboto', sans-serif" : 'Roboto_400Regular';
const ROBOTO_MEDIUM  = IS_WEB ? "'Roboto', sans-serif" : 'Roboto_500Medium';
const ROBOTO_BOLD    = IS_WEB ? "'Roboto', sans-serif" : 'Roboto_700Bold';
const ROBOTO_BLACK   = IS_WEB ? "'Roboto', sans-serif" : 'Roboto_900Black';

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

  useEffect(() => {
    let alive = true;
    (async () => {
      const isSubscribed = Boolean(
        UserStore.hasActiveSubscription?.(currentUser)
        || UserStore.hasActiveRolePlan?.(currentUser)
        || (currentUser?.is_subscribed)
      );
      if (isSubscribed) return;

      if (sessionDismissed) return;
      try {
        const dismissedAt = await AsyncStorage.getItem(SESSION_DISMISS_KEY);
        if (dismissedAt && Date.now() - Number(dismissedAt) < 4 * 60 * 60 * 1000) {
          sessionDismissed = true;
          return;
        }
      } catch (_) { }

      if (!alive) return;

      const loc = [userDistrict, userState].filter(Boolean).join(', ') || 'All India';
      setUserLocationLabel(loc);

      setLoading(true);
      try {
        const summary = await UserStore.getSubscriptionSummary?.({
          state: userState,
          district: userDistrict,
        }, { skipSync: true });

        const rawPlans = Array.isArray(summary?.plans) ? summary.plans : [];
        const available = rawPlans.filter((p) => !p?.is_sold && Number(p?.price) > 0);
        if (alive) {
          setPlans(available.slice(0, 4));
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
          {/* ── Banner Header ── */}
          <View style={st.bannerHeaderWrap}>
            <ImageBackground
              source={HEADER_BG_IMAGE}
              style={st.bannerHeader}
              imageStyle={st.bannerHeaderImg}
              resizeMode="cover"
            >
              {/* Close Button */}
              <TouchableOpacity
                style={st.cancelBtn}
                onPress={handleDismiss}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close subscription popup"
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>

              {/* Pill Badge */}
              <View style={st.badgePill}>
                <MaterialCommunityIcons name="crown" size={13} color="#fef08a" />
                <Text style={st.badgePillText}>OFFICIAL JOURNALIST ROLES</Text>
              </View>

              <Text style={st.bannerTitle}>Join RTI India News Network</Text>
              <Text style={st.bannerSub}>Get your Official Press ID Card &amp; Appointment Letter</Text>

              {/* Location Badge */}
              <View style={st.locTag}>
                <Ionicons name="location-sharp" size={11} color="#fcd34d" />
                <Text style={st.locTagText} numberOfLines={1}>
                  {userLocationLabel}
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* ── 4 Key Perks ── */}
          <View style={st.perksGrid}>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="card" size={15} color="#dc2626" />
              </View>
              <Text style={st.perkText}>Press ID Card</Text>
            </View>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="document-text" size={15} color="#d97706" />
              </View>
              <Text style={st.perkText}>Appt. Letter</Text>
            </View>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="checkmark-circle" size={15} color="#2563eb" />
              </View>
              <Text style={st.perkText}>Blue Tick</Text>
            </View>
            <View style={st.perkItem}>
              <View style={[st.perkIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="megaphone" size={15} color="#16a34a" />
              </View>
              <Text style={st.perkText}>Publish Rights</Text>
            </View>
          </View>

          {/* ── Role Plans Scrollable List ── */}
          <ScrollView
            style={st.plansScroll}
            contentContainerStyle={st.plansContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={st.loadingBox}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={st.loadingText}>Loading role plans…</Text>
              </View>
            ) : plans.length === 0 ? (
              <View style={st.emptyBox}>
                <Text style={st.emptyText}>Tap below to explore all available role plans.</Text>
              </View>
            ) : (
              plans.map((plan, idx) => {
                const theme = getCardTheme(idx);
                return (
                  <TouchableOpacity
                    key={String(plan.plan_id || idx)}
                    style={st.planCardOuter}
                    activeOpacity={0.92}
                    onPress={() => handleSelectPlan(plan)}
                  >
                    <ImageBackground
                      source={theme.image}
                      style={[st.planCardInner, { backgroundColor: theme.bgColor || '#6b21a8' }]}
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

                      {/* Benefits */}
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

                      {/* Action Button */}
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

          {/* ── Footer ── */}
          <View style={st.footer}>
            <TouchableOpacity
              style={st.exploreBtn}
              onPress={handleExploreAll}
              activeOpacity={0.88}
            >
              <Text style={st.exploreBtnText}>Explore All Roles &amp; Seats</Text>
              <Feather name="chevron-right" size={16} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={st.skipBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={st.skipBtnText}>Continue to News Feed</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: IS_WEB ? 20 : 12,
  },
  cardContainer: {
    width: '100%',
    maxWidth: IS_WEB ? 460 : 400,
    maxHeight: Math.min(720, WIN_H * 0.92),
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bannerHeaderWrap: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#991b1b',
  },
  bannerHeader: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    position: 'relative',
    backgroundColor: '#991b1b',
    overflow: 'hidden',
  },
  bannerHeaderImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.92,
  },
  cancelBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgePillText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: ROBOTO_BOLD,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
    fontFamily: ROBOTO_BLACK,
    paddingRight: 36,
  },
  bannerSub: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    fontFamily: ROBOTO_MEDIUM,
  },
  locTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: ROBOTO_BOLD,
  },
  perksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
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
    fontFamily: ROBOTO_BOLD,
  },
  plansScroll: {
    flex: 1,
    maxHeight: 330,
    backgroundColor: '#f8fafc',
  },
  plansContent: {
    padding: 14,
    gap: 12,
  },
  planCardOuter: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardInner: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  planCardImg: {
    borderRadius: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
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
    fontFamily: ROBOTO_BOLD,
  },
  planName: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: ROBOTO_BLACK,
  },
  planDuration: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: ROBOTO_MEDIUM,
  },
  planPriceBox: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: ROBOTO_BLACK,
  },
  planOrigPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 1,
    fontFamily: ROBOTO_REGULAR,
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
    fontFamily: ROBOTO_MEDIUM,
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
    fontFamily: ROBOTO_BOLD,
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
    fontFamily: ROBOTO_BOLD,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: ROBOTO_MEDIUM,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
    fontFamily: ROBOTO_REGULAR,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: ROBOTO_REGULAR,
  },
});
