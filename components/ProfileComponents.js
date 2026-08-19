import { Feather } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import ProfileStyles from '../styles/ProfileStyles';
import { generateMemberId, getRank, getNextRank, hasDocumentSource } from '../utils/profileHelpers';

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
        <Text style={ProfileStyles.referralCode}>{referralCode || 'Generating...'}</Text>
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

// ─── SavedProfileCard — ab "Profile Details" header + Edit chip + View/Download button grid, bilkul image jaisa
export function SavedProfileCard({ profile, onOpenIdCard, onOpenAppointmentLetter, onDownloadIdCard, onDownloadAppointmentLetter, onEdit }) {
  const fields = [
    { icon: 'user', label: 'Name', value: profile.name, accent: '#7d38ff' },
    { icon: 'mail', label: 'Email', value: profile.email, accent: '#22aaf3' },
    { icon: 'phone', label: 'Phone', value: profile.mobile_number || profile.contact_number || profile.phone_number, accent: '#1ec9b0' },
    { icon: 'map-pin', label: 'Location', value: profile.state || profile.village, accent: '#f97316' },
    { icon: 'file-text', label: 'Bio', value: profile.bio, accent: '#EA580C', fullWidth: true },
    { icon: 'star', label: 'Subscription', value: profile.subscription_type, accent: '#eab308' },
    { icon: 'credit-card', label: 'Member ID', value: generateMemberId(profile.email), accent: '#F97316' },
    { icon: 'gift', label: 'Referral Code', value: profile.referral_code, accent: '#F97316' },
  ];

  return (
    <View style={ProfileStyles.infoCard}>
      <View style={ProfileStyles.headerStrip}>
        <Text style={ProfileStyles.cardTitle}>Profile Details</Text>
        {onEdit ? (
          <TouchableOpacity style={ProfileStyles.editChip} onPress={onEdit} activeOpacity={0.8}>
            <Feather name="edit-2" size={12} color="#111111" />
            <Text style={ProfileStyles.editChipText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={ProfileStyles.divider} />
      <View style={ProfileStyles.fieldList}>
        {fields.map((f, i) => (
          <View
            key={f.label}
            style={[ProfileStyles.fieldRow, f.fullWidth && ProfileStyles.fieldRowFull, i !== fields.length - 1 && ProfileStyles.fieldRowBorder]}
          >
            <View style={[ProfileStyles.fieldIconWrap, { backgroundColor: f.accent + '18' }]}>
              <Feather name={f.icon} size={14} color={f.accent} />
            </View>
            <View style={ProfileStyles.fieldContent}>
              <Text style={ProfileStyles.fieldLabel}>{f.label}</Text>
              <Text style={[ProfileStyles.fieldValue, !f.value && ProfileStyles.fieldValueEmpty]} numberOfLines={f.fullWidth ? 3 : 1}>
                {f.value || 'Not set'}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={ProfileStyles.docButtonsWrap}>
        <View style={ProfileStyles.docButtonsRow}>
          <TouchableOpacity style={ProfileStyles.docButtonPrimary} onPress={onOpenIdCard} activeOpacity={0.85}>
            <Feather name="credit-card" size={14} color="#ffffff" />
            <Text style={ProfileStyles.docButtonPrimaryText}>View ID</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ProfileStyles.docButtonPrimary} onPress={onOpenAppointmentLetter} activeOpacity={0.85}>
            <Feather name="file-text" size={14} color="#ffffff" />
            <Text style={ProfileStyles.docButtonPrimaryText}>View Letter</Text>
          </TouchableOpacity>
        </View>
        <View style={ProfileStyles.docButtonsRow}>
          <TouchableOpacity style={ProfileStyles.docButtonOutline} onPress={onDownloadIdCard} activeOpacity={0.85}>
            <Feather name="download" size={14} color="#111111" />
            <Text style={ProfileStyles.docButtonOutlineText}>Download ID</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ProfileStyles.docButtonOutline} onPress={onDownloadAppointmentLetter} activeOpacity={0.85}>
            <Feather name="download" size={14} color="#111111" />
            <Text style={ProfileStyles.docButtonOutlineText}>Download Letter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}