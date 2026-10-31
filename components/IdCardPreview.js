import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import IdCardQr from './IdCardQr';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import IdCardStyles from '../styles/IdCardStyles';
import { useIdCardVerification, cardFromProfile, buildFallbackQrUrl, buildPageVerifyUrl, formatCardDate } from '../utils/idCardService';
import { getIssueDate, resolveRoleTitle, resolveAreaText, pickPhoneNumber } from '../utils/profileHelpers';
import { UserStore } from '../store/UserStore';

const CERT_LOGO = require('../assets/images/certificate_logo.jpg');
const ID_LOGO = require('../assets/images/id-logo.png');
const IDENTITY_IMAGE = require('../assets/images/id-identity.png');
const DEFAULT_AVATAR = require('../assets/images/icon.png');
const MIC_ICON = require('../assets/images/mic_icon.png');
const GREEN_BANNER = require('../assets/images/green_banner.jpeg');

const RANKS = [
  { label: 'Director', minReferrals: 500 },
  { label: 'Manager',  minReferrals: 100 },
  { label: 'Leader',   minReferrals: 25  },
  { label: 'Promoter', minReferrals: 5   },
  { label: 'Starter',  minReferrals: 1   },
  { label: 'Member',   minReferrals: 0   },
];

function getRank(n = 0) {
  return RANKS.find((r) => n >= r.minReferrals) || RANKS[RANKS.length - 1];
}
function generateMemberId(email = '') {
  if (!email) return 'N/A';
  let h = 0;
  for (let i = 0; i < email.length; i++) { h = (h << 5) - h + email.charCodeAt(i); h |= 0; }
  return 'RTI' + Math.abs(h).toString().slice(0, 6);
}
function fmtValidUpto(issueDate) {
  const n = new Date(issueDate); n.setFullYear(n.getFullYear() + 1);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(n);
}

const ID_CARD_FONT = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular';
const ID_CARD_FONT_BLACK = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_900Black';

// viewOnly=true -> public profile (kisi aur ka card): data profile owner ka hi dikhega, viewer ka nahi.
// fallbackMobile: public profile API number na de to feed/author object se mila number yahan aata hai.
export default function AutoIdCardPreview({ profile, viewOnly = false, fallbackMobile = '' }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const safeProfile = profile || {};
  const seat = safeProfile?.state_seat || safeProfile?.seat || {};
  const rank = getRank(safeProfile.referral_count || 0);
  // ROLE: purchased role / designation hi dikhao — seat_name kabhi jagah ka naam hota hai
  // ("Taloje Majkur"), isliye wo Role me nahi, Area me jaata hai.
  const planRoleNames = (() => {
    try {
      return UserStore.getSeatRoleNameForPlanRoleId?.(
        safeProfile?.subscription_plan?.role_id_raw || safeProfile?.subscription_plan?.role_id || ''
      ) || '';
    } catch { return ''; }
  })();
  const designation = resolveRoleTitle(safeProfile, planRoleNames, (id) => { try { return UserStore.getSeatRoleNameForPlanRoleId?.(id) || ''; } catch { return ''; } }) || `${rank.label} - RTI News Member`;
  const area = resolveAreaText(safeProfile);
  // ✅ FIX: mobile number ab har naam / nested object se uthaya jaata hai (public profile me bhi dikhega)
  const mobile = pickPhoneNumber(safeProfile) || pickPhoneNumber({ phone: fallbackMobile }) || '';
  const issueDate = getIssueDate(profile);
  const own = useIdCardVerification({ enabled: !viewOnly }); // sirf apne profile par backend /id-cards
  const idCard = viewOnly ? cardFromProfile(safeProfile) : own.idCard;
  // ID No + Valid Upto sirf /id-cards API se (fallback purana logic)
  const memberId = idCard?.id_number || safeProfile.id_number || safeProfile.id_card_number ||
    safeProfile.idcard_number || safeProfile.card_number || safeProfile.id_card?.id_number ||
    safeProfile.member_id || safeProfile.memberId || safeProfile.user_id ||
    (safeProfile.email ? generateMemberId(safeProfile.email) : (safeProfile.id != null && safeProfile.id !== '' ? `#${safeProfile.id}` : 'N/A'));
  const planExpiry = formatCardDate(safeProfile?.subscription_plan?.expires_at || safeProfile?.subscription_plan?.expiry || safeProfile?.subscription_plan?.end_date);
  const validUpto = formatCardDate(idCard?.valid_until) || planExpiry || fmtValidUpto(issueDate);

  return (
    <View style={IdCardStyles.idCardShadowWrap}>
    <View style={IdCardStyles.idCardPreview}>

      {/* ── HEADER ── */}
      <View style={IdCardStyles.idCardHeader}>
        <Text style={IdCardStyles.idCardHeaderTitle}>Bhartiya Mahiti Adhikar</Text>
         <View style={IdCardStyles.idCardHeaderRow}>
          <Image source={MIC_ICON} style={[IdCardStyles.idCardMicIcon, { marginLeft: 35 }]} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[IdCardStyles.idCardHeaderNetwork, { textAlign: 'center' }]}>ALL INDIA RTI{'\n'}NEWS NETWORK</Text>
          </View>
        </View>
        <Text style={IdCardStyles.idCardHeaderSub}>BhaRTIya V😊ice / RTI Media</Text>
        <Text style={IdCardStyles.idCardHeaderReg}>RNI.MAH/MUL/66399 ★ UDYAM-MH-29-0022246</Text>
      </View>

      {/* ── GREEN BANNER ── */}
      <Image source={GREEN_BANNER} resizeMode="stretch" style={{ width: '100%', height: 15 }} />

      {/* ── PHOTO ROW ── */}
      <View style={IdCardStyles.idCardPhotoRow}>
        <Image source={ID_LOGO} style={IdCardStyles.idCardLogoImg} resizeMode="contain" />
        <View style={IdCardStyles.idCardPhotoBox}>
          <Image
            source={safeProfile.profile_image ? { uri: safeProfile.profile_image } : DEFAULT_AVATAR}
            style={IdCardStyles.idCardPhoto}
          />
        </View>
        <View style={IdCardStyles.idCardQRBox}>
                <IdCardQr
     payload={buildPageVerifyUrl(idCard?.qr_payload) || buildFallbackQrUrl(profile)}
            fallbackValue=""
            size={70}
          />
        </View>
      </View>

      {/* ── DETAILS ── */}
      <View style={IdCardStyles.idCardDetails}>

   <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyBold}>Name:-</Text>
          <Text style={IdCardStyles.idCardVal}>{safeProfile.name || safeProfile.full_name || safeProfile.author_name || ''}</Text>
        </View>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyBold}>Role:-</Text>
          <Text style={IdCardStyles.idCardVal}>{designation}</Text>
        </View>

        {(!viewOnly || area) ? (
        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>Area:-</Text>
          <Text style={IdCardStyles.idCardValLight}>
            {area}
          </Text>
        </View>
        ) : null}

        {/* Mo: row ab web / mobile-web / Android sab par hamesha dikhta hai (public profile me bhi) */}
        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>Mo:-</Text>
          <Text style={IdCardStyles.idCardValLight}>{mobile || '-'}</Text>
        </View>

        {/* ID No + Valid Upto — ek hi row me */}
     <View style={[IdCardStyles.idCardRow, { marginBottom: 6, flexWrap: 'wrap' }]}>
          <Text style={IdCardStyles.idCardKeyLight}>ID No:-</Text>
          <Text style={{ fontSize: 15, fontWeight: Platform.OS === 'web' ? '900' : 'normal', color: '#cc2200', fontFamily: ID_CARD_FONT_BLACK }}>{memberId}</Text>
         <Text style={{ fontSize: 15, color: '#15803d', fontWeight: Platform.OS === 'web' ? '900' : 'normal', marginLeft: 10, fontFamily: ID_CARD_FONT_BLACK }}>Valid Upto:</Text>
          <Text style={{ fontSize: 13, color: '#cc2200', fontWeight: Platform.OS === 'web' ? '900' : 'normal', marginLeft: 3, fontFamily: ID_CARD_FONT_BLACK }}>{validUpto}</Text>
        </View>

        {/* Verification URL — backend se aaya hua, as-is */}
        {idCard?.verification_url ? (
          <Text numberOfLines={1} style={{ fontSize: 8, color: '#1a3a8a', marginBottom: 4 }}>
            Verify: {idCard.verification_url}
          </Text>
        ) : null}

      </View>

      {/* ── IDENTITY BANNER (image only) ── */}
      <View style={IdCardStyles.identityGreenBar}>
        <View style={IdCardStyles.identityGreenBlock} />
        <View style={IdCardStyles.identityImgBox}>
          <Image source={IDENTITY_IMAGE} style={IdCardStyles.identityImg} resizeMode="contain" />
        </View>
        <View style={IdCardStyles.identityGreenBlock} />
      </View>

      </View>
    </View>
  );
}