// pages/SubscriptionPlanDetailsScreen.js
// ─────────────────────────────────────────────────────────────────
// GENERIC "plan details" page — reused by every subscription card in
// the app (Role/Membership Plans, Quiz Subscription, Ecom Subscription,
// Ads Subscription). Jab bhi kisi subscription card pe tap kiya jaata
// hai, yeh page open hota hai poori details ke saath, aur neeche wahi
// "Buy" button bhi milta hai jo card list wale page pe milta tha —
// isliye user is details page se hi seedha buy kar sakta hai.
//
// Is page ko call karne wala screen ye params bhejta hai:
//   navigation.navigate('SubscriptionPlanDetails', {
//     headerTitle: 'Subscription Plans',       // top bar ka title
//     plan: plan,                               // wahi plan object jo card pe tha
//     theme: theme,                             // (optional) getCardTheme(index) wala object
//     isActive: false,                          // true = already purchased, Buy button hide
//     buyLabel: 'Buy Now',                      // (optional)
//     onBuyPlan: (plan) => { ... }               // tap karte hi yehi function chalega
//   })
//
// `plan` dono shape accept karta hai:
//   Role plans shape : { plan_id, plan_name, price, duration, original_price, features, role_id_raw }
//   Generic shape    : { id, name, duration, price, originalPrice, features }
// ─────────────────────────────────────────────────────────────────
import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React from 'react';
import { Platform, ScrollView, Text, View, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import S from '../styles/SubscriptionPlansStyles';
import { getCardTheme, HEADER_BG_IMAGE, getPayBtnImage } from '../constants/subscriptionThemes';
import { UserStore } from '../store/UserStore';

export default function SubscriptionPlanDetailsScreen({ navigation, route }) {
  const {
    headerTitle = 'Plan Details',
    plan,
    theme,
    isActive = false,
    buyLabel = 'Buy Now',
    onBuyPlan,
  } = route?.params || {};

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={S.root}>
          <Text style={S.loadingText}>Plan not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const planName     = plan.plan_name ?? plan.name;
  const planPrice     = plan.price;
  const planDuration   = plan.duration;
  const originalPrice = plan.original_price ?? plan.originalPrice ?? null;
  const features      = Array.isArray(plan.features) ? plan.features : [];
  const description   = plan.description || '';
  const cardTheme     = theme || getCardTheme(0);

  // ✅ Role/Membership plans ke saath role bhi juda hota hai (Chief Editor,
  // Executive Editor, Pratinidhi, waghera) — agar plan me role_id_raw hai
  // to wahi role naam yahan dikhao, bilkul roles list jaisa.
  const roleName = plan.role_id_raw != null
    ? UserStore.getSeatRoleNameForPlanRoleId(plan.role_id_raw)
    : (plan.role || null);

  const handleBuy = () => {
    if (typeof onBuyPlan === 'function') {
      onBuyPlan(plan);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <View style={S.root}>
        {Platform.OS === 'android' ? (
<ModuleAndroidHeader title={headerTitle} onBack={() => navigation.goBack()} />
) : (
<>
<ImageBackground source={HEADER_BG_IMAGE} style={S.headerImageWrap} resizeMode="cover">
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBackBtn}>
            <Feather name="arrow-left" size={20} color="#ffffff" />
            <Text style={S.headerBackBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={S.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          <View style={{ width: 60 }} />
        </ImageBackground>
</>
)}

        <ScrollView
          contentContainerStyle={[S.scrollContent, !isActive ? { paddingBottom: 140 } : null]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Compact summary card: name + role + price + duration ── */}
          <ImageBackground
            source={cardTheme.image}
            style={local.summaryCard}
            imageStyle={local.summaryCardImage}
            resizeMode="cover"
          >
            <Text style={[local.planName, { color: cardTheme.textColor }]} numberOfLines={1}>
              {planName}
            </Text>

            {roleName ? (
              <Text style={[local.roleName, { color: cardTheme.mutedColor }]} numberOfLines={1}>
                {roleName}
              </Text>
            ) : null}

            <View style={local.priceRow}>
              <Text style={[local.price, { color: cardTheme.textColor }]}>
                ₹{planPrice}
                {planDuration ? (
                  <Text style={[local.priceSuffix, { color: cardTheme.mutedColor }]}> / {planDuration}</Text>
                ) : null}
              </Text>
              {originalPrice != null ? (
                <Text style={[local.priceOriginal, { color: cardTheme.mutedColor }]}>₹{originalPrice}</Text>
              ) : null}
            </View>
          </ImageBackground>

          {description ? (
            <Text style={local.description}>{description}</Text>
          ) : null}

          {features.length > 0 ? (
            <>
              <Text style={local.sectionTitle}>What's included</Text>
              <View style={local.featuresList}>
                {features.map((feature, idx) => (
                  <View key={idx} style={local.featureRow}>
                    <Text style={[local.bullet, { color: cardTheme.checkColor || '#16a34a' }]}>{'\u2022'}</Text>
                    <Text style={local.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>

        {!isActive ? (
          <View style={[S.payBar, local.payBarNoShadow]}>
            <View style={{ flex: 1 }}>
              <Text style={S.payBarLabel} numberOfLines={1}>
                {planName}{planDuration ? ` · ${planDuration}` : ''}
              </Text>
              <Text style={S.payBarPrice}>₹{planPrice}</Text>
            </View>
            <TouchableOpacity onPress={handleBuy} activeOpacity={0.85}>
                         <ImageBackground
               source={cardTheme.image}
                style={S.payBtn}
                imageStyle={S.payBtnImage}
                resizeMode="cover"
              >
                <Text style={[S.payBtnText, { color: cardTheme.textColor }]}>{buyLabel}</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  // Chota, compact summary card — fixed-height wale grid card jaisa nahi,
  // sirf itna bada jitna content ke liye chahiye.
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  summaryCardImage: { borderRadius: 20 },

  planName: { fontSize: 20, fontWeight: '800' },
  roleName: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 },
  price: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  priceSuffix: { fontSize: 14, fontWeight: '600' },
  priceOriginal: { fontSize: 15, textDecorationLine: 'line-through' },

  description: { fontSize: 13.5, color: '#57534e', lineHeight: 20, marginBottom: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 12 },

  featuresList: { gap: 12, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  featureText: { fontSize: 15, fontWeight: '700', color: '#1c1917', flex: 1, lineHeight: 21 },

  // Pay bar ke upar/aas-paas koi bhi colored shadow nahi chahiye.
  payBarNoShadow: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
});