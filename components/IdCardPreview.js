import { Image, Platform, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import IdCardStyles from '../styles/IdCardStyles';
import { buildVerificationUrl } from '../utils/verificationHelpers';
import { getIssueDate } from '../utils/profileHelpers';

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

export default function AutoIdCardPreview({ profile }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const rank = getRank(profile.referral_count || 0);
  const memberId = profile.member_id || generateMemberId(profile.email);
  const seatName = String(profile?.state_seat?.seat_name || profile?.author_seat_name || '').trim();
  const designation = seatName || `${rank.label} - RTI News Member`;
  const issueDate = getIssueDate(profile);
  const verificationUrl = buildVerificationUrl(profile);

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
            source={profile.profile_image ? { uri: profile.profile_image } : DEFAULT_AVATAR}
            style={IdCardStyles.idCardPhoto}
          />
        </View>
        <View style={IdCardStyles.idCardQRBox}>
          <QRCode value={verificationUrl} size={70} backgroundColor="#ffffff" color="#000000" />
        </View>
      </View>

      {/* ── DETAILS ── */}
      <View style={IdCardStyles.idCardDetails}>

   <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyBold}>Name:-</Text>
          <Text style={IdCardStyles.idCardVal}>{profile.name || ''}</Text>
        </View>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyBold}>Role:-</Text>
          <Text style={IdCardStyles.idCardVal}>{designation}</Text>
        </View>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>Area:-</Text>
          <Text style={IdCardStyles.idCardValLight}>
            {[profile.village, profile.state].filter(Boolean).join(', ') || ''}
          </Text>
        </View>

      <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>Mo:-</Text>
          <Text style={IdCardStyles.idCardValLight}>{profile.contact_number || ''}</Text>
        </View>

        {/* ID No + Valid Upto — ek hi row me */}
     <View style={[IdCardStyles.idCardRow, { marginBottom: 6 }]}>
          <Text style={IdCardStyles.idCardKeyLight}>ID No:-</Text>
          <Text style={{ fontSize: 15, fontWeight: Platform.OS === 'web' ? '900' : 'normal', color: '#cc2200', fontFamily: ID_CARD_FONT_BLACK }}>{memberId}</Text>
         <Text style={{ fontSize: 15, color: '#15803d', fontWeight: Platform.OS === 'web' ? '900' : 'normal', marginLeft: 10, fontFamily: ID_CARD_FONT_BLACK }}>Valid Upto:</Text>
          <Text style={{ fontSize: 13, color: '#cc2200', fontWeight: Platform.OS === 'web' ? '900' : 'normal', marginLeft: 3, fontFamily: ID_CARD_FONT_BLACK }}>{fmtValidUpto(issueDate)}</Text>
        </View>

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