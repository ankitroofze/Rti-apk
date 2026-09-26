import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TouchableOpacity, View } from 'react-native';
import ProfileStyles from '../styles/ProfileStyles';
import { generateMemberId, getRank, getNextRank, hasDocumentSource } from '../utils/profileHelpers';
   import { ROLE_SEAT_COLORS, COMMON_USER_COLOR } from '../constants/profileConstants';
import ScaledCard from './ScaledCard';
import AutoIdCardPreview from './IdCardPreview';
import AutoIdCardBackPreview from './IdCardBackPreview';
import AutoAppointmentLetterPreview from './AppointmentLetterPreview';
export function RankBadge({ referralCount }) {
  const rank = getRank(referralCount);
  const next = getNextRank(referralCount);
  const needed = next ? Math.max(0, next.minReferrals - referralCount) : 0;
  return (
    <View style={[ProfileStyles.rankCard, { borderColor: rank.color + '33' }]}>
      <View style={[ProfileStyles.rankCardBg, { backgroundColor: rank.color + '11' }]} />
      <Text style={ProfileStyles.rankIcon}>{rank.icon}</Text>
      <Text style={ProfileStyles.rankLabel}>{rank.title}</Text>
      <Text style={[ProfileStyles.rankValue, { color: rank.color }]}>{referralCount || 0}</Text>
      {next ? <Text style={ProfileStyles.rankSubtext}>{needed} more to {next.title}</Text> : null}
    </View>
  );
}

export function ReferralCodeCard({ referralCode, onCopy }) {
  return (
    <View style={ProfileStyles.referralCard}>
      <View style={ProfileStyles.referralLeft}>
        <Text style={ProfileStyles.referralLabel}>My Referral Code</Text>
        <Text style={ProfileStyles.referralCode}>{referralCode || 'Subscribe to unlock'}</Text>
        <Text style={ProfileStyles.referralHint}>Share this code to earn referral bonus</Text>
      </View>
      <TouchableOpacity style={ProfileStyles.copyBtn} onPress={onCopy} disabled={!referralCode}>
        <Feather name="copy" size={16} color="#fff" />
        <Text style={ProfileStyles.copyBtnText}>Copy</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── NEW: matches phone mockup exactly — 3 stacked rows ─────────────────────
export function ProfileCompletionRow({ percent = 0, onPress }) {
  const pct = Math.max(0, Math.min(100, parseInt(percent, 10) || 0));
  return (
    <TouchableOpacity style={ProfileStyles.metricRowCard} onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      <View style={[ProfileStyles.metricIconWrap, { backgroundColor: '#FFF7ED' }]}>
        <Feather name="bar-chart-2" size={17} color="#F97316" />
      </View>
      <View style={ProfileStyles.metricBody}>
        <Text style={ProfileStyles.metricLabel}>Profile Completion</Text>
        <Text style={ProfileStyles.metricValue}>{pct}%</Text>
        <View style={ProfileStyles.metricProgressTrack}>
          <View style={[ProfileStyles.metricProgressFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <Feather name="chevron-right" size={18} color="#CCCCCC" />
    </TouchableOpacity>
  );
}

export function ReferralRow({ referralCode, onCopy }) {
  return (
    <View style={ProfileStyles.metricRowCard}>
      <View style={[ProfileStyles.metricIconWrap, { backgroundColor: '#FFF7ED' }]}>
        <Feather name="gift" size={17} color="#F97316" />
      </View>
      <View style={ProfileStyles.metricBody}>
        <Text style={ProfileStyles.metricLabel}>Referral Code</Text>
        <Text style={[ProfileStyles.metricValue, { color: '#F97316' }]}>{referralCode || 'Generating...'}</Text>
      </View>
      <TouchableOpacity style={ProfileStyles.metricCopyBtn} onPress={onCopy} disabled={!referralCode} activeOpacity={0.8}>
        <Text style={ProfileStyles.metricCopyBtnText}>Copy</Text>
      </TouchableOpacity>
    </View>
  );
}

export function RankRow({ referralCount, onPress }) {
  const rank = getRank(referralCount);
  const next = getNextRank(referralCount);
  const target = next ? next.minReferrals : (referralCount || 0);
  return (
    <TouchableOpacity style={ProfileStyles.metricRowCard} onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      <View style={[ProfileStyles.metricIconWrap, { backgroundColor: rank.color + '18' }]}>
        <Text style={{ fontSize: 17 }}>{rank.icon}</Text>
      </View>
      <View style={ProfileStyles.metricBody}>
        <Text style={ProfileStyles.metricLabel}>Your Rank</Text>
        <Text style={ProfileStyles.metricValue}>{rank.title}</Text>
        <Text style={ProfileStyles.metricSubValue}>{referralCount || 0} / {target}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#CCCCCC" />
    </TouchableOpacity>
  );
}

// ─── SavedProfileCard — ab sirf ID Card + Appointment Letter chhote preview cards,
// har ek ke sath apna Download button, tap karne par full-screen preview khulta hai
export function SavedProfileCard({ profile, onOpenIdCard, onOpenAppointmentLetter, onDownloadIdCard, onDownloadAppointmentLetter, onEdit, profileTier }) {
  const canAccessDocuments = true;

  return (
       <View style={ProfileStyles.infoCard}>
      {canAccessDocuments ? (
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* ── ID Card (front + back) upar + apna Download button ── */}
            <View style={{ alignItems: 'center', width: '100%' }}>
                          <TouchableOpacity onPress={onOpenIdCard} activeOpacity={0.85}>
                <View style={{ flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <ScaledCard width={220} naturalWidth={360}>
                    <AutoIdCardPreview profile={profile} />
                  </ScaledCard>
                  <ScaledCard width={220} naturalWidth={360}>
                    <AutoIdCardBackPreview />
                  </ScaledCard>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 10, width: '80%', borderRadius: 6, overflow: 'hidden' }} onPress={onDownloadIdCard} activeOpacity={0.85}>
                <LinearGradient colors={profileTier?.gradientDark || ['#374151', '#6B7280', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 }}>
                  <Feather name="download" size={13} color="#ffffff" />
                  <Text style={[ProfileStyles.docButtonOutlineText, { color: '#ffffff' }]}>Download ID</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ── Appointment Letter neeche + apna Download button ── */}
            <View style={{ alignItems: 'center', width: '100%' }}>
              <TouchableOpacity onPress={onOpenAppointmentLetter} activeOpacity={0.85}>
                <ScaledCard width={240} naturalWidth={560}>
                  <AutoAppointmentLetterPreview profile={profile} />
                </ScaledCard>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 10, width: '80%', borderRadius: 6, overflow: 'hidden' }} onPress={onDownloadAppointmentLetter} activeOpacity={0.85}>
                <LinearGradient colors={profileTier?.gradientDark || ['#374151', '#6B7280', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 }}>
                  <Feather name="download" size={13} color="#ffffff" />
                  <Text style={[ProfileStyles.docButtonOutlineText, { color: '#ffffff' }]}>Download Letter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── dono ke neeche ek line ── */}
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginTop: 16 }} />
        </View>
      ) : null}
    </View>
  );
}