// components/SubscriptionPlanPurchase.js
// ─────────────────────────────────────────────────────────────────
// SHARED UI for every "buy a subscription" screen in the app:
//   - Role / Membership Plans  (pages/SubscriptionPlansScreen.js)
//   - Quiz Subscription Plans  (screens/QuizSubscriptionScreen.js)
//   - Ads Subscription Plans   (pages/AdPlansScreen.js)
//   - Ecom Subscription Plans  (screens/EcomSubscriptionScreen.js)
//
// Isko yahan ek hi jagah rakha gaya hai taaki chaaron subscription
// pages ka DESIGN hamesha ek jaisa (identical) rahe — kal ko kisi
// bhi ek page ka style badalna ho to sirf yeh ek file badalni hogi,
// baaki teeno khud-ba-khud match karenge.
//
// Yeh component sirf UI render karta hai — data fetch / payment
// wagera ka logic har screen apna khud rakhta hai aur props/callbacks
// ke through isko values deta hai.
// ─────────────────────────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import S from '../styles/SubscriptionPlansStyles';
import { getCardTheme, HEADER_BG_IMAGE, getNativeThemeImage } from '../constants/subscriptionThemes';
import SubscriptionStatusCard from './SubscriptionStatusCard';

/**
 * props:
 *  navigation        - required, used for the back button
 *  headerTitle       - text shown on the colored header bar (e.g. "Ads Subscription")
 *  heroTitle         - big title under the header (e.g. "Choose Your Ad Credit Plan")
 *  heroSubtitle      - small line under heroTitle
 *  loading           - true while plans are being fetched
 *  plans             - [{ id, name, duration, price, originalPrice, features: string[], popular }]
 *  selectedPlanId    - id of the plan currently highlighted
 *  onSelectPlan(plan)- called when a card is tapped
 *  activePlanId      - id of the plan the user already owns (shows "Currently active", disabled)
 *  statusCard        - optional: { isActive, planName, price, countLabel, purchasedAt, expiresAt }
 *                       pass this to show the "My current subscription" card up top, same as Roles page
 *  onPay(plan)       - called when the fixed bottom "Pay" button is pressed
 *  payLabel          - default 'Pay'
 *  emptyText         - shown when plans is empty and not loading
 */
export default function SubscriptionPlanPurchase({
  navigation,
  headerTitle = 'Subscription Plans',
  heroTitle = 'Choose Your Subscription Plan',
  heroSubtitle = 'Unlock more benefits and a stronger presence.',
  loading = false,
  plans = [],
  selectedPlanId,
  onSelectPlan,
  activePlanId,
  statusCard,
  onPay,
 payLabel = 'Pay Now',
  processingPlanId = null,
  emptyText = 'Abhi koi plan available nahi hai.',
}) {
    const insets = useSafeAreaInsets();
  const [detailsModal, setDetailsModal] = React.useState(null); // Read More click hote hi { plan, theme } set hoga

  const selectedIndex = plans.findIndex((p) => p.id === selectedPlanId);
  const selectedPlan = selectedIndex >= 0 ? plans[selectedIndex] : null;
  const isSelectedActive = Boolean(selectedPlan && activePlanId && selectedPlan.id === activePlanId);
  const selectedTheme = getCardTheme(selectedIndex >= 0 ? selectedIndex : 0);

  const activeIndex = activePlanId ? plans.findIndex((p) => p.id === activePlanId) : -1;
  const activeTheme = activeIndex >= 0 ? getCardTheme(activeIndex) : null;

  const showPayBar = Boolean(selectedPlan) && !isSelectedActive && typeof onPay === 'function';

  return (
    <View style={S.root}>
           <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header — same image background used on every subscription screen */}
      <ImageBackground source={HEADER_BG_IMAGE} style={S.headerImageWrap} resizeMode="cover">
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBackBtn}>
          <Feather name="arrow-left" size={20} color="#ffffff" />
          <Text style={S.headerBackBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        <View style={{ width: 60 }} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={[S.scrollContent, showPayBar ? { paddingBottom: 200 } : null]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.heroPlain}>
          <Text style={S.heroTitlePlain}>{heroTitle}</Text>
          <Text style={S.heroSubtitlePlain}>{heroSubtitle}</Text>
        </View>

        {/* Current subscription status — same card used on My Subscriptions pages */}
        {statusCard && !loading ? (
          <View style={{ width: '100%', maxWidth: 560, marginBottom: 16 }}>
            <SubscriptionStatusCard
              isActive={Boolean(statusCard.isActive)}
              planName={statusCard.planName}
              price={statusCard.price}
              countLabel={statusCard.countLabel}
              purchasedAt={statusCard.purchasedAt}
              expiresAt={statusCard.expiresAt}
              themeImage={getNativeThemeImage(activeTheme)}
              textColor={activeTheme?.textColor}
            />
          </View>
        ) : null}

        <Text style={S.sectionTitle}>Our Plans</Text>

        {loading ? (
          <Text style={S.loadingText}>Loading plans…</Text>
        ) : plans.length === 0 ? (
          <Text style={S.emptyText}>{emptyText}</Text>
        ) : (
          <View style={S.plansGrid}>
            {plans.map((plan, index) => {
              const isActive = activePlanId != null && plan.id === activePlanId;
              const isSelected = selectedPlanId === plan.id;
              const theme = getCardTheme(index);
                        return (
                <View key={plan.id} style={S.planCardWrap}>
                  <ImageBackground
                    source={theme.image}
                    style={[S.planCard, isSelected && S.planCardSelected, isActive && S.planCardActive]}
                    imageStyle={S.planCardImage}
                    resizeMode="cover"
                  >
                    {plan.popular ? (
                      <View style={S.popularBadge}>
                        <Feather name="star" size={11} color="#fff" />
                        <Text style={S.popularBadgeText}>Most Popular</Text>
                      </View>
                    ) : null}

                    <Text style={[S.planName, { color: theme.textColor }]} numberOfLines={1}>
                      {plan.name}
                    </Text>
                    {plan.duration ? (
                      <Text style={[S.planDuration, { color: theme.mutedColor }]}>{plan.duration}</Text>
                    ) : null}

                    <View style={S.planPriceRow}>
                      <Text style={[S.planPrice, { color: theme.textColor }]}>₹{plan.price}</Text>
                      {plan.originalPrice != null ? (
                        <Text style={[S.planPriceOriginal, { color: theme.mutedColor }]}>
                          ₹{plan.originalPrice}
                        </Text>
                      ) : null}
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
disabled={isActive || Boolean(processingPlanId)}
onPress={() => { if (typeof onPay === 'function') onPay(plan); }}
style={[S.selectPlanBtn, isSelected && S.selectPlanBtnActive, processingPlanId && processingPlanId !== plan.id && { opacity: 0.5 }]}
                    >
                    <Text style={S.selectPlanBtnText} numberOfLines={1}>
{isActive ? 'Currently active' : (processingPlanId === plan.id ? 'Processing…' : payLabel)}
                      </Text>
                      {!isActive && <Feather name="chevron-right" size={14} color="#b91c1c" />}
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
          <View style={S.seatSheet}>
            <View style={S.seatHandle} />
            {detailsModal && (
              <>
                <Text style={S.seatTitle}>{detailsModal.plan.name}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 8, marginBottom: 4 }}>
                  ₹{detailsModal.plan.price}
                  {detailsModal.plan.originalPrice != null && (
                    <Text style={{ fontSize: 14, textDecorationLine: 'line-through', color: '#999' }}> ₹{detailsModal.plan.originalPrice}</Text>
                  )}
                </Text>
                {detailsModal.plan.duration ? (
                  <Text style={{ color: '#666', marginBottom: 12 }}>{detailsModal.plan.duration}</Text>
                ) : null}
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                  {(detailsModal.plan.features || []).map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <Feather name="check" size={14} color={detailsModal.theme.checkColor} />
                      <Text style={{ flex: 1 }}>{f}</Text>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => { const p = detailsModal.plan; setDetailsModal(null); onPay(p); }}
                  style={[S.seatSubmitBtn, { marginTop: 14 }]}
                >
                  <Text style={S.seatSubmitBtnText}>{payLabel}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}