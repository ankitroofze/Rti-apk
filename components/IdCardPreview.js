import { Image, Text, View } from 'react-native';
import IdCardStyles from '../styles/IdCardStyles';

const CERT_LOGO = require('../assets/images/certificate_logo.jpg');
const DEFAULT_AVATAR = require('../assets/images/icon.png');
const MIC_ICON = require('../assets/images/mic_icon.png');
const QR_CODE = require('../assets/images/QR.png');
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
function fmtValidUpto(d = new Date()) {
  const n = new Date(d); n.setFullYear(n.getFullYear() + 1);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(n);
}

export default function AutoIdCardPreview({ profile }) {
  const rank = getRank(profile.referral_count || 0);
  const memberId = generateMemberId(profile.email);
  const seatName = String(profile?.state_seat?.seat_name || profile?.author_seat_name || '').trim();
  const designation = seatName || `${rank.label} - RTI News Member`;

  return (
    <View style={IdCardStyles.idCardPreview}>

      {/* ── HEADER ── */}
      <View style={IdCardStyles.idCardHeader}>
        <Text style={IdCardStyles.idCardHeaderTitle}>Bhartiya Mahiti Adhikar</Text>
        <View style={IdCardStyles.idCardHeaderRow}>
          <Image source={MIC_ICON} style={IdCardStyles.idCardMicIcon} />
          <View style={{ flex: 1 }}>
            <Text style={IdCardStyles.idCardHeaderNetwork}>ALL INDIA RTI{'\n'}NEWS NETWORK</Text>
          </View>
        </View>
        <Text style={IdCardStyles.idCardHeaderSub}>BhaRTIya V😊ice / RTI Media</Text>
        <Text style={IdCardStyles.idCardHeaderReg}>RNI.MAH/MUL/66399 ★ UDYAM-MH-29-0022246</Text>
      </View>

      {/* ── GREEN BANNER ── */}
      <Image
        source={GREEN_BANNER}
        resizeMode="stretch"
        style={{ width: '100%', height: 15 }}
      />

      {/* ── PHOTO ROW ── */}
      <View style={IdCardStyles.idCardPhotoRow}>
        <Image source={CERT_LOGO} style={IdCardStyles.idCardLogoImg} />
        <View style={IdCardStyles.idCardPhotoBox}>
          <Image
            source={profile.profile_image ? { uri: profile.profile_image } : DEFAULT_AVATAR}
            style={IdCardStyles.idCardPhoto}
          />
        </View>
        <View style={IdCardStyles.idCardQRBox}>
          <Image source={QR_CODE} style={IdCardStyles.idCardQRImage} />
        </View>
      </View>

      {/* ── DETAILS ── */}
      <View style={IdCardStyles.idCardDetails}>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyBold}>Name;-</Text>
          <Text style={IdCardStyles.idCardVal}>{profile.name || ''}</Text>
        </View>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyBold}>Desig;-</Text>
          <Text style={IdCardStyles.idCardVal}>{designation}</Text>
        </View>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>Area;-</Text>
          <Text style={IdCardStyles.idCardValLight}>
            {[profile.village, profile.state].filter(Boolean).join(', ') || ''}
          </Text>
        </View>

        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>Mo:</Text>
          <Text style={IdCardStyles.idCardValLight}>{profile.contact_number || ''}</Text>
        </View>

        {/* ID No */}
        <View style={IdCardStyles.idCardRow}>
          <Text style={IdCardStyles.idCardKeyLight}>ID No;-</Text>
          <Text style={IdCardStyles.idCardValLight}>{memberId}</Text>
        </View>

        {/* Valid Upto — center aligned */}
        <View style={{ alignItems: 'center', marginTop: 2, marginBottom: 4 }}>
          <Text style={{ fontSize: 11, color: '#374151', fontWeight: '600' }}>
            Valid Upto ;-  {fmtValidUpto()}
          </Text>
        </View>

      </View>

      {/* ── PRESS FOOTER ── */}
      <View style={IdCardStyles.pressFooterWrapper}>
        <View style={IdCardStyles.pressGreenBar}>
          <View style={IdCardStyles.pressGreenBlock} />
          <View style={IdCardStyles.pressApprovedCenter}>
            <Text style={IdCardStyles.pressApprovedFrom}>This Identity Card is approved from</Text>
            <Text style={IdCardStyles.pressApprovedDesig}>
              Chief Editor, All india President  
            </Text>
          </View>
          <View style={IdCardStyles.pressGreenBlock} />
        </View>

        <View style={IdCardStyles.pressRedBar}>
          <View style={IdCardStyles.pressRedSideBlock} />
          <View style={IdCardStyles.pressRedBox}>
            <Text style={IdCardStyles.pressRedText}>PRESS</Text>
          </View>
          <View style={IdCardStyles.pressRedSideBlock} />
        </View>
      </View>

    </View>
  );
}
