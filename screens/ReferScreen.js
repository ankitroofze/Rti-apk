import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Share, Linking, Clipboard, Platform, ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import ModuleWebHeader from '../components/Modulewebheader';

const REFER_LINK = 'https://play.google.com/store/apps/details?id=com.yourcompany.rtiapp';
const APP_NAME = 'RTI App';

const buildReferLink = (code = '') => `${REFER_LINK}${code ? `&ref=${encodeURIComponent(code)}` : ''}`;
const buildReferMessage = (code = '') => (
  `Join ${APP_NAME} using my referral code: ${code || 'RTI'}\n\n` +
  `Signup karo, mobile verify karo aur subscription lo.\n\n` +
  `Download: ${buildReferLink(code)}`
);

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', bg: '#e9fbe9', getUrl: (msg) => `https://wa.me/?text=${encodeURIComponent(msg)}` },
  { id: 'whatsapp_status', label: 'WhatsApp Status', icon: 'logo-whatsapp', color: '#128C7E', bg: '#e0f4f2', getUrl: (msg) => `https://wa.me/?text=${encodeURIComponent(msg)}` },
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C', bg: '#fde8ef', getUrl: () => 'https://www.instagram.com/', note: 'Link copy ho jayega' },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2', bg: '#e7f0fd', getUrl: (_msg, link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { id: 'twitter', label: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2', bg: '#e7f5fd', getUrl: (msg) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}` },
  { id: 'telegram', label: 'Telegram', icon: 'paper-plane-outline', color: '#229ED9', bg: '#e4f4fb', getUrl: (msg, link) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}` },
  { id: 'gmail', label: 'Gmail', icon: 'mail-outline', color: '#EA4335', bg: '#fde9e7', getUrl: (msg) => `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(`${APP_NAME} Referral`)}&body=${encodeURIComponent(msg)}` },
  {
    id: 'sms',
    label: 'SMS',
    icon: 'chatbubble-outline',
    color: '#6366f1',
    bg: '#eeeffd',
    getUrl: (msg) => Platform.OS === 'ios' ? `sms:&body=${encodeURIComponent(msg)}` : `sms:?body=${encodeURIComponent(msg)}`,
  },
  { id: 'more', label: 'More Options', icon: 'share-social-outline', color: '#64748b', bg: '#f1f5f9', isNativeShare: true },
];

export default function ReferScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const cu = await UserStore.getCurrentUser();
      if (mounted) setEligible(Boolean(cu?.is_subscribed));
      const localSummary = await UserStore.getReferralSummary();
      if (mounted) setSummary(localSummary);

      // CORS issue pe silently fail karo, local data use karo
let apiResult = { ok: false };
try {
  apiResult = await AuthAPI.getReferrals();
} catch {}
      console.log('[ReferScreen] getReferrals result:', JSON.stringify(apiResult));

      if (mounted && apiResult.ok) {
        const root = apiResult.data?.data || apiResult.data || {};
        const referralCode = String(root.referral_code || root.my_referral_code || '').trim();
        const referralCount = Number(root.total_referrals ?? root.referral_count ?? 0);
        const totalCommission = Number(root.total_commission ?? root.commission ?? 0);
        const currentTier = UserStore.getReferralTier(referralCount);
        const nextTier = UserStore.getNextReferralTier(referralCount);

        setSummary((prev) => ({
          ...prev,
          my_referral_code: referralCode,
          referral_count: referralCount,
          total_commission: totalCommission,
          referred_users: Array.isArray(root.referred_users) ? root.referred_users : [],
          applied_referral: root.applied_referral || null,
          rank: currentTier.rank,
          bonus: currentTier.bonus,
          next_rank: nextTier,
          tiers: prev?.tiers || UserStore.getReferralTiers(),
        }));
      }

      if (mounted) setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, []);

  // API se referral code aaya to local update karo
useEffect(() => {
  if (summary?.my_referral_code) {
    UserStore.getCurrentUser().then(user => {
      if (user && summary.my_referral_code !== user.my_referral_code) {
        UserStore.updateUser(user.email, { 
          my_referral_code: summary.my_referral_code 
        });
      }
    });
  }
}, [summary?.my_referral_code]);

  const referralCode = summary?.my_referral_code || '';
  const personalLink = useMemo(() => buildReferLink(referralCode), [referralCode]);
  const referMessage = useMemo(() => buildReferMessage(referralCode), [referralCode]);
  const nextRank = summary?.next_rank;
  const validCount = Number(summary?.referral_count || 0);
  const nextNeeded = nextRank ? Math.max(0, nextRank.min - validCount) : 0;
  // ✅ Subscription nahi li to referral screen locked rahegi
  if (!loading && !eligible) {
    return (
           <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <View style={styles.root}>
          <ModuleWebHeader title="Refer & Earn" navigation={navigation} />
          {Platform.OS !== 'web' && (
            <ImageBackground
              source={require('../assets/images/profile-red.png')}
              resizeMode="cover"
              style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={22} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Refer & Earn</Text>
              <View style={{ width: 36 }} />
            </ImageBackground>
          )}
          <View style={[styles.content, Platform.OS === 'web' && styles.webContent]}>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>Referral Locked</Text>
              <Text style={styles.bannerSub}>
                Referral code sirf un members ko milta hai jinhone role / premium subscription purchase ki hai. Subscription lene ke baad aapka referral code generate ho jayega.
              </Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#1d4ed8', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
              onPress={() => navigation.navigate('Subscription Plans')}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Take Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleCopy = (value = personalLink) => {

    Clipboard.setString(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async (platform) => {
    if (platform.isNativeShare) {
      try {
        await Share.share({ message: referMessage, url: personalLink });
      } catch (_e) {}
      return;
    }
    if (platform.id === 'instagram') {
      handleCopy(personalLink);
      Linking.openURL('instagram://').catch(() => Linking.openURL('https://www.instagram.com/'));
      return;
    }
    const url = platform.getUrl(referMessage, personalLink);
    Linking.openURL(url).catch(() => {
      Share.share({ message: referMessage });
    });
  };

  return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <View style={styles.root}>
      <ModuleWebHeader title="Refer & Earn" navigation={navigation} />
      {Platform.OS !== 'web' && (
        <ImageBackground
          source={require('../assets/images/profile-red.png')}
          resizeMode="cover"
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={{ width: 36 }} />
        </ImageBackground>
      )}

      <ScrollView contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>RTI</Text>
          <Text style={styles.bannerTitle}>Referral Bonus</Text>
                  <Text style={styles.bannerSub}>
            Referral benefits may continue for the eligible referral relationship during the applicable subscription/renewal period, subject to the referrer's continued eligibility, active required plan/status, qualifying purchases/renewals, applicable commission rules, platform policies and applicable law.
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary?.rank || 'Member'}</Text>
            <Text style={styles.statLabel}>Current Rank</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{validCount}</Text>
            <Text style={styles.statLabel}>Valid Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Rs. {summary?.total_commission ?? summary?.bonus ?? 0}</Text>
            <Text style={styles.statLabel}>Total Commission</Text>
          </View>
        </View>

        {nextRank ? (
          <View style={styles.nextBox}>
            <Text style={styles.nextText}>
              {nextNeeded} And with valid referrals, the {nextRank.rank} rank will be unlocked.
            </Text>
            <Text style={styles.nextSub}>Bonus: Rs. {nextRank.bonus}</Text>
          </View>
        ) : null}

        <View style={Platform.OS === 'web' ? styles.twoCol : null}>
  <View style={[styles.linkBox, Platform.OS === 'web' && { flex: 1, marginBottom: 0 }]}>
          <Text style={styles.linkLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode || 'Login required'}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={() => handleCopy(referralCode)}
              activeOpacity={0.8}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.linkLabel, { marginTop: 14 }]}>Your Refer Link</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>{personalLink}</Text>
            <TouchableOpacity style={styles.smallCopyBtn} onPress={() => handleCopy(personalLink)} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={15} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        </View>
  <View style={Platform.OS === 'web' ? { flex: 1 } : null}>
    <Text style={styles.sectionTitle}>Rank & Bonus</Text>
        <View style={styles.tierBox}>
          {(summary?.tiers || UserStore.getReferralTiers()).map((tier) => (
            <View key={tier.rank} style={styles.tierRow}>
              <Text style={styles.tierRank}>{tier.rank}</Text>
              <Text style={styles.tierMeta}>{tier.min} referrals</Text>
              <Text style={styles.tierBonus}>Rs. {tier.bonus}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Share via</Text>
        <View style={styles.grid}>
          {PLATFORMS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.platformCard}
              onPress={() => handleShare(p)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconCircle, { backgroundColor: p.bg }]}>
                <Ionicons name={p.icon} size={28} color={p.color} />
              </View>
              <Text style={styles.platformLabel}>{p.label}</Text>
              {p.note && <Text style={styles.platformNote}>{p.note}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
   header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  content: { padding: 16, paddingBottom: 40 },
webContent: {
  maxWidth: 720,
  width: '100%',
  alignSelf: 'center',
  paddingHorizontal: 24,
  paddingTop: 24,
  paddingBottom: 40,
},
twoCol: {
  flexDirection: 'row',
  gap: 14,
  marginBottom: 20,
  alignItems: 'flex-start',
},
  banner: {
    backgroundColor: '#1d4ed8', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 14,
  },
  bannerEmoji: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 8, letterSpacing: 2 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  bannerSub: { fontSize: 13, color: '#bfdbfe', textAlign: 'center', lineHeight: 20 },
  statsCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16,
    borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 16,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0' },
  statValue: { fontSize: 16, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  nextBox: {
    backgroundColor: '#ecfdf5', borderColor: '#bbf7d0', borderWidth: 1,
    borderRadius: 14, padding: 12, marginBottom: 14,
  },
  nextText: { color: '#166534', fontSize: 13, fontWeight: '800' },
  nextSub: { color: '#15803d', fontSize: 12, fontWeight: '700', marginTop: 3 },
  linkBox: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20,
  },
  linkLabel: {
    fontSize: 11, color: '#64748b', fontWeight: '700',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeText: { flex: 1, fontSize: 18, color: '#0f172a', fontWeight: '900', letterSpacing: 0.4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10,
  },
  smallCopyBtn: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#eff6ff',
  },
  copyBtnDone: { backgroundColor: '#16a34a' },
  copyBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  tierBox: {
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1,
    borderColor: '#e2e8f0', marginBottom: 22, overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tierRank: { flex: 1, fontSize: 13, fontWeight: '900', color: '#0f172a' },
  tierMeta: { width: 96, fontSize: 12, fontWeight: '700', color: '#64748b', textAlign: 'right' },
  tierBonus: { width: 78, fontSize: 12, fontWeight: '900', color: '#2563eb', textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  platformCard: {
    width: '29%', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    elevation: 1,
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  platformLabel: { fontSize: 12, color: '#334155', fontWeight: '700', textAlign: 'center' },
  platformNote: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 2 },
});