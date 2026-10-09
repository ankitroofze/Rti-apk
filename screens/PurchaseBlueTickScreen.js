import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserStore } from '../store/UserStore';

// ── Benefits list ──────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: 'star',
    text: 'Get Blue tick on Profile',
    sub: 'Stand out as a verified voice',
    colors: ['#FFC371', '#FF5F6D'],
  },
  {
    icon: 'document-text',
    text: 'For creators, grow profile faster',
    sub: 'Priority placement & recommendations',
    colors: ['#A18CD1', '#FBC2EB'],
  },
  {
    icon: 'diamond',
    text: 'Achieve 2X reach and more visibility',
    sub: 'Get discovered by more readers',
    colors: ['#36D1DC', '#5B86E5'],
  },
  {
    icon: 'play-circle',
    text: 'Watch unlimited, local & premium',
    sub: 'Zero ads, zero limits',
    colors: ['#FF8177', '#FF5858'],
  },
];

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function PurchaseBlueTickScreen({ navigation, route }) {
  const user = route?.params?.user || {};
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(shineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(900),
      ])
    ).start();
  }, []);

  const handleStartTrial = () => {
    // Blue tick is not separately activatable; verified Premium Plan payment is required.
    navigation.replace('Subscription Plans');
  };

  const handleCloseSuccess = () => setShowSuccess(false);

  const shineTranslate = shineAnim.interpolate({ inputRange: [0, 1], outputRange: [-220, 220] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#060D1A' }} edges={['top']}>
    <View style={s.root}>
      <LinearGradient colors={['#0A1F44', '#0A1628', '#060D1A']} style={s.bgGradient} />

      {/* Decorative glow blobs */}
      <View pointerEvents="none" style={[s.blob, { top: -60, left: -60, backgroundColor: '#1565C0' }]} />
      <View pointerEvents="none" style={[s.blob, { top: 160, right: -80, backgroundColor: '#4FC3F7', opacity: 0.18 }]} />
      <View pointerEvents="none" style={[s.blob, { top: 420, left: -90, backgroundColor: '#7C4DFF', opacity: 0.14 }]} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={s.backText}>back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Get Blue Tick</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Success Message Toast ── */}
      {showSuccess && (
        <View style={s.successOverlay} pointerEvents="box-none">
          <View style={s.successToast}>
            <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />
            <Text style={s.successText} numberOfLines={2}>Blue tick activated successfully!</Text>
            <TouchableOpacity onPress={handleCloseSuccess} style={s.successClose}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', alignItems: 'center' }}>

          {/* ── Limited offer ribbon ── */}
          <View style={s.ribbon}>
            <Ionicons name="flash" size={13} color="#FFD54F" />
            <Text style={s.ribbonText}>LIMITED TIME OFFER · 97% OFF</Text>
          </View>

          {/* ── Blue Tick Badge ── */}
          <View style={s.badgeWrap}>
            <Animated.View style={[s.badgeGlow, { transform: [{ scale: pulseAnim }] }]} />
            <View style={s.badgeRing}>
              <LinearGradient colors={['#5BC8FF', '#1565C0']} style={s.badgeCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.sparkleTL}>✦</Text>
            <Text style={s.sparkleBR}>✦</Text>
          </View>

          {/* ── Social proof ── */}
          <View style={s.proofRow}>
            <Ionicons name="star" size={13} color="#FFD54F" />
            <Ionicons name="star" size={13} color="#FFD54F" />
            <Ionicons name="star" size={13} color="#FFD54F" />
            <Ionicons name="star" size={13} color="#FFD54F" />
            <Ionicons name="star-half" size={13} color="#FFD54F" />
            <Text style={s.proofText}>Trusted by 10,000+ creators</Text>
          </View>

          {/* ── Title ── */}
          <Text style={s.title}>Verified tick comes with many</Text>
          <Text style={s.titleHighlight}>Benefits</Text>

          {/* ── Benefits Cards ── */}
          <View style={s.benefitsList}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={s.benefitCard}>
                <LinearGradient colors={b.colors} style={s.benefitIconCircle}>
                  <Ionicons name={b.icon} size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.benefitText}>{b.text}</Text>
                  <Text style={s.benefitSub}>{b.sub}</Text>
                </View>
                <View style={s.benefitCheckWrap}>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                </View>
              </View>
            ))}
          </View>

          {/* ── Trial Pill ── */}
          <View style={s.trialPill}>
            <Ionicons name="time-outline" size={14} color="#4FC3F7" />
            <Text style={s.trialLabel}>3 day free trial, then just ₹90 / quarter</Text>
          </View>

          {/* ── Info Points ── */}
          <View style={s.infoBox}>
            <View style={s.infoRow}>
              <Text style={s.infoDot}>•</Text>
              <Text style={s.infoText}>
                Your plan auto-renews based on the selected plan. You can cancel anytime from settings before renewal, your subscription stays active until it expires.
              </Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoDot}>•</Text>
              <Text style={s.infoText}>
                All services of Shuru local news app are paid, to watch local news you will have to start a subscription.
              </Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={s.divider} />

          {/* ── Price + CTA (now inline, not a fixed bar) ── */}
          <View style={s.priceSection}>
            <View style={s.bottomLinks}>
              <TouchableOpacity onPress={() => Alert.alert('Coming soon')}>
                <Text style={s.bottomLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={s.bottomDot}>•</Text>
              <TouchableOpacity onPress={() => Alert.alert('Coming soon')}>
                <Text style={s.bottomLink}>Refund Policy</Text>
              </TouchableOpacity>
            </View>

            <View style={s.priceRow}>
              <Text style={s.strikePrice}>₹399</Text>
              <View style={s.priceMain}>
                <Text style={s.priceTag}>₹1</Text>
                <Text style={s.priceTagSlash}>/-</Text>
              </View>
            </View>
            <Text style={s.priceSubtitle}>Become a premium member in just ₹1</Text>

            <TouchableOpacity
              onPress={handleStartTrial}
              activeOpacity={0.85}
              disabled={loading}
              style={s.ctaShadowWrap}
            >
              <LinearGradient
                colors={loading ? ['#2ECC71aa', '#149954aa'] : ['#34E37A', '#1FAA59']}
                style={s.ctaBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={s.ctaBtnText}>Choose Premium Plan</Text>
                    <Ionicons name="arrow-forward-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
                {!loading && (
                  <Animated.View
                    pointerEvents="none"
                    style={[s.shine, { transform: [{ translateX: shineTranslate }, { rotate: '20deg' }] }]}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.trustRow}>
              <Ionicons name="lock-closed" size={12} color="#7E97C2" />
              <Text style={s.trustText}>Secure payment</Text>
              <Text style={s.trustDot}>•</Text>
              <Ionicons name="close-circle-outline" size={12} color="#7E97C2" />
              <Text style={s.trustText}>Cancel anytime</Text>
            </View>
          </View>

        </Animated.View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const CARD_BLUE = '#142A52';
const GREEN     = '#2ECC71';

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#060D1A', overflow: 'hidden' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  blob: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    opacity: 0.22,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20, alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText:   { color: '#fff', fontSize: 14, fontWeight: '500' },
  headerTitle:{ fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center', flex: 1, letterSpacing: 0.3 },

  // Ribbon
  ribbon: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,213,79,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,213,79,0.4)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    marginTop: 8, marginBottom: 22,
  },
  ribbonText: { fontSize: 11, fontWeight: '800', color: '#FFD54F', letterSpacing: 0.5 },

  // Badge
  badgeWrap:   { alignItems: 'center', justifyContent: 'center', marginBottom: 18, width: 150, height: 150 },
  badgeGlow: {
    position: 'absolute',
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#1565C0',
    opacity: 0.28,
  },
  badgeRing: {
    width: 114, height: 114, borderRadius: 57,
    borderWidth: 1.5, borderColor: 'rgba(127,216,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#9FE6FF',
    elevation: 12, shadowColor: '#4FC3F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 16,
  },
  sparkleTL: { position: 'absolute', top: 6, left: 14, color: '#9FE6FF', fontSize: 16 },
  sparkleBR: { position: 'absolute', bottom: 10, right: 10, color: '#FFD54F', fontSize: 13 },

  // Social proof
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  proofText: { fontSize: 12, color: '#9FB3D1', fontWeight: '600', marginLeft: 6 },

  // Title
  title:          { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 4 },
  titleHighlight: { fontSize: 26, fontWeight: '900', color: '#4FC3F7', textAlign: 'center', marginBottom: 28, letterSpacing: 0.3 },

  // Benefits
  benefitsList: { paddingHorizontal: 16, gap: 12, marginBottom: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  benefitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BLUE,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(127,180,255,0.15)',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  benefitIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 13,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  benefitText:  { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  benefitSub:   { fontSize: 11.5, color: '#8FA3C4', fontWeight: '500' },
  benefitCheckWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  // Trial pill
  trialPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(79,195,247,0.08)',
    borderWidth: 1, borderColor: 'rgba(79,195,247,0.3)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 24,
  },
  trialLabel: { fontSize: 12.5, color: '#B8CCE8', fontWeight: '600' },

  // Info
  infoBox: { paddingHorizontal: 20, gap: 12, width: '100%', maxWidth: 480, alignSelf: 'center' },
  infoRow:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoDot:  { color: '#94A3B8', fontSize: 16, lineHeight: 20 },
  infoText: { flex: 1, fontSize: 12, color: '#94A3B8', lineHeight: 18 },

  // Divider
  divider: {
    width: '88%', maxWidth: 420, height: 1,
    backgroundColor: 'rgba(127,180,255,0.15)',
    marginTop: 28, marginBottom: 22,
  },

  // Price + CTA section (now part of normal scroll flow, not a fixed bar)
  priceSection: {
    width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  bottomLink:  { fontSize: 12, color: '#4FC3F7', textDecorationLine: 'underline', fontWeight: '500' },
  bottomDot:   { color: '#4FC3F7', fontSize: 12 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strikePrice: { fontSize: 18, color: '#6B7F9E', textDecorationLine: 'line-through', fontWeight: '600' },
  priceMain: { flexDirection: 'row', alignItems: 'flex-end' },
  priceTag:      { fontSize: 38, fontWeight: '900', color: '#fff', textAlign: 'center' },
  priceTagSlash: { fontSize: 20, fontWeight: '700', color: '#8FA3C4', marginBottom: 4, marginLeft: 2 },
  priceSubtitle: { fontSize: 13, fontWeight: '600', color: '#CBD5E1', textAlign: 'center', marginBottom: 16, marginTop: 4 },

  ctaShadowWrap: {
    width: '100%', maxWidth: 400,
    elevation: 8, shadowColor: GREEN, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 14,
    borderRadius: 999,
  },
  ctaBtn: {
    flexDirection: 'row', overflow: 'hidden',
    borderRadius: 999, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText:     { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  shine: {
    position: 'absolute', top: -40, width: 60, height: 160,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 },
  trustText: { fontSize: 11, color: '#7E97C2', fontWeight: '500' },
  trustDot: { color: '#7E97C2', fontSize: 11, marginHorizontal: 2 },

  // Success Toast
  successOverlay: {
    position: 'absolute',
    top: 110, left: 0, right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  successToast: {
    width: '90%', maxWidth: 380,
    backgroundColor: '#0D2245',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
    elevation: 10,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 10,
    borderWidth: 1, borderColor: '#2ECC71',
  },
  successText:  { flex: 1, color: '#fff', fontSize: 13.5, fontWeight: '600', marginLeft: 10, marginRight: 6 },
  successClose: { padding: 4 },
});
