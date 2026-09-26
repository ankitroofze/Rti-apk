import { Image, Text, View } from 'react-native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import ProfileStyles from '../styles/AppointmentLetterStyles';
import { getIssueDate, generateMemberId } from '../utils/profileHelpers';
const AP_H = require('../assets/images/AP-H.png');
const HP_TEXT = require('../assets/images/HP-TEXT.png');
const HP_R = require('../assets/images/HP-R.png');
const HP_T = require('../assets/images/HP-T.png');
const HP_TEXT2 = require('../assets/images/HP-TEXT2.png');
const HP_TEXT3 = require('../assets/images/HP-TEXT3.png');
const RTI_VOICE_LOGO = require('../assets/images/logo.jpg');
const CERT_LOGO = require('../assets/images/certificate_logo.jpg');
const DEFAULT_AVATAR = require('../assets/images/icon.png');
const RIBBON_IMAGE = require('../assets/images/ribon.png');
const GREEN_BANNER = require('../assets/images/green_banner.jpeg');
function fmt(d = new Date()) { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d); }
// ✅ FIX: pehle "aaj + 1 saal" nikalta tha (har baar shift hota tha). Ab fixed issue date + 1 saal.
function fmtValidUpto(issueDate) { const n = new Date(issueDate); n.setFullYear(n.getFullYear() + 1); return fmt(n); }

// ✅ Ye dummy/fixed values hain — PDF download wale layout jaisa hi, profile/API se nahi aate
const CONTACT_NUMBER_1 = '7020667971';
const CONTACT_NUMBER_2 = '8484029332';
const CONTACT_EMAIL = 'rticheck@gmail.com';

export default function AutoAppointmentLetterPreview({ profile }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const issueDate = getIssueDate(profile);
  const location = [profile.village, profile.state].filter(Boolean).join(', ') || 'Not provided';

  return (
    <View style={ProfileStyles.apptCard}>
      <View style={ProfileStyles.apptPressBadge}>
        <Text style={ProfileStyles.apptPressBadgeText}>PRESS</Text>
      </View>

      <View style={ProfileStyles.apptLogoRow}>
        <View style={ProfileStyles.apptBrandLeft}>
          <Text style={ProfileStyles.apptBrandTitle}>
            <Text style={ProfileStyles.apptBrandBha}>Bha</Text>
            <Text style={ProfileStyles.apptBrandRti}>RTI</Text>
            <Text style={ProfileStyles.apptBranya}>ya</Text>
          </Text>
        <Text style={ProfileStyles.apptBrandVoice}>
            V<Text style={ProfileStyles.apptBrandEmoji}>😊</Text>ICE
          </Text>
          <Text style={ProfileStyles.apptRNI}>RNI/MAH/MUL/66399</Text>
        </View>
        <Image source={CERT_LOGO} style={ProfileStyles.apptCertLogo} />
        <View style={ProfileStyles.apptNetworkRight}>
          <View style={ProfileStyles.apptNetworkBadge}>
            <Text style={ProfileStyles.apptNetworkText}>All India RTI News</Text>
            <Text style={ProfileStyles.apptNetworkText}>Network</Text>
          </View>
          <Text style={ProfileStyles.apptRNI}>UDYAM-MH-29-0022246</Text>
        </View>
      </View>

      <View style={ProfileStyles.apptRedBanner}>
        <Text style={ProfileStyles.apptRedBannerText}>Bhartiya Mahiti Adhikar</Text>
      </View>

      {/* ── GREEN BANNER ── */}
      <View style={{ paddingHorizontal: 12 }}>
        <Image
          source={GREEN_BANNER}
          resizeMode="stretch"
          style={{ width: '100%', height: 15 }}
        />
      </View>

     <Text style={ProfileStyles.apptSubtitle}>
        {`News Paper Published in Marathi, Hindi & English language\nMember ID: ${profile.member_id || generateMemberId(profile.email)}`}
      </Text>

      <View style={ProfileStyles.apptRibbonRow}>
        <Image
          source={RIBBON_IMAGE}
          style={ProfileStyles.apptRibbonImage}
          resizeMode="contain"
        />
        <Image
          source={RTI_VOICE_LOGO}
          style={ProfileStyles.apptRibbonLogo}
          resizeMode="contain"
        />
      </View>

      <Text style={ProfileStyles.apptSince}>
        Subjected to the Movement of Right to Information in The organisational Social Work Field Since{' '}
        <Text style={ProfileStyles.apptSinceHighlight}>{'\''}15th{'\''}</Text> Years
      </Text>

      <View style={ProfileStyles.apptDetailsRow}>
        <View style={ProfileStyles.apptDetailsLeft}>
          <Text style={ProfileStyles.apptDetailLine}>
            <Text style={ProfileStyles.apptDetailBold}>Mr/Mrs :- </Text>
            <Text style={ProfileStyles.apptDetailName}>{profile.name || '___________'}</Text>
          </Text>
          <Text style={ProfileStyles.apptDetailLine}>
            <Text style={ProfileStyles.apptDetailBold}>appointed as </Text>
            <Text style={ProfileStyles.apptDetailRed}>All India</Text>
          </Text>
          <Text style={ProfileStyles.apptDetailLine}>
            <Text style={ProfileStyles.apptDetailBold}>State/District/Taluka/Village :- </Text><Text style={ProfileStyles.apptDetailRed}>{location}</Text>
          </Text>
          <Text style={ProfileStyles.apptDate}>
            Date: <Text style={ProfileStyles.apptDateRed}>{fmt()}</Text>  to  <Text style={ProfileStyles.apptDateRed}>{fmtValidUpto(issueDate)}</Text>
          </Text>
          <Text style={ProfileStyles.apptBody}>
            On a Non-Payment basis as a Social Activity and will follow all {'"'}Bhartiya <Text style={ProfileStyles.apptBodyBold}>Sanvidhan</Text>{'"'} Rules and Regulations.
          </Text>
        </View>
        <View style={ProfileStyles.apptPhotoBox}>
          <Image
            source={profile.profile_image ? { uri: profile.profile_image } : DEFAULT_AVATAR}
            style={ProfileStyles.apptPhoto}
          />
        </View>
      </View>

      <View style={ProfileStyles.apptSignRow}>
        <View>
          <Text style={ProfileStyles.apptContact}>Contact</Text>
          <Text style={ProfileStyles.apptContactNum}>{CONTACT_NUMBER_1}</Text>
          <Text style={ProfileStyles.apptContactNum}>{CONTACT_NUMBER_2}</Text>
        </View>
        <View style={ProfileStyles.apptSignRight}>
          <Text style={ProfileStyles.apptFaithfully}>Your Faithfully</Text>
          <Text style={ProfileStyles.apptSignName}>Owner/Publisher/All India President</Text>
          <Text style={ProfileStyles.apptSignName}>Chief Editor Bhartiya Mahiti Adhikar</Text>
          <Text style={ProfileStyles.apptSignSub}>(All India RTI News Network)</Text>
        </View>
      </View>

      <View style={ProfileStyles.apptFooter}>
        <Text style={ProfileStyles.apptFooterText}>E-mail: {CONTACT_EMAIL}  |  Web: www.bhartiyamahitladhikar.com</Text>
      </View>
    </View>
  );
}