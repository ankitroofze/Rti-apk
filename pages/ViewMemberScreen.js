import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ViewMemberStyles from '../styles/ViewMemberStyles';
import PremiumBadge from '../components/PremiumBadge';
import { UserStore } from '../store/UserStore';

export default function ViewMemberScreen({ route, navigation }) {
  const { member } = route.params || {};

  const initials = member?.name
    ? member.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const InfoRow = ({ icon, label, value }) => (
    <View style={ViewMemberStyles.infoRow}>
      <View style={ViewMemberStyles.infoIconWrap}>
        <Feather name={icon} size={15} color="#ea580c" />
      </View>
      <View style={ViewMemberStyles.infoTextWrap}>
        <Text style={ViewMemberStyles.infoLabel}>{label}</Text>
        <Text style={ViewMemberStyles.infoValue}>{value ?? '—'}</Text>
      </View>
    </View>
  );

  return (
    <View style={ViewMemberStyles.root}>

      {/* ── Top Bar ── */}
      <View style={ViewMemberStyles.topBar}>
        <TouchableOpacity
          style={ViewMemberStyles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={ViewMemberStyles.topBarTitle}>Member Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={ViewMemberStyles.scrollView}
        contentContainerStyle={ViewMemberStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Card ── */}
        <View style={ViewMemberStyles.avatarCard}>
          <View style={ViewMemberStyles.avatarCircle}>
            <Text style={ViewMemberStyles.avatarInitials}>{initials}</Text>
          </View>
          <View style={ViewMemberStyles.nameRow}>
            <Text style={ViewMemberStyles.memberName}>{member?.name ?? '—'}</Text>
            {UserStore.hasActiveSubscription(member) ? (
              <PremiumBadge size={16} style={ViewMemberStyles.premiumBadge} />
            ) : null}
          </View>
          <Text style={ViewMemberStyles.memberId}>ID: {member?.user_id ?? '—'}</Text>
          <View style={ViewMemberStyles.levelPill}>
            <Text style={ViewMemberStyles.levelPillText}>
              Level {member?.level ?? '—'}
            </Text>
          </View>
        </View>

        {/* ── Basic Info Card ── */}
        <View style={ViewMemberStyles.detailCard}>
          <Text style={ViewMemberStyles.sectionTitle}>Basic Info</Text>
          <InfoRow icon="user"   label="Full Name"   value={member?.name} />
          <InfoRow icon="hash"   label="User ID"     value={member?.user_id} />
          <InfoRow icon="users"  label="Referred By" value={member?.referred_by} />
          <InfoRow icon="layers" label="Level"       value={`Level ${member?.level}`} />
        </View>

        {/* ── Commission Card ── */}
        <View style={ViewMemberStyles.commissionCard}>
          <View style={ViewMemberStyles.commissionLeft}>
            <Text style={ViewMemberStyles.commissionLabel}>Total Commission</Text>
            <Text style={ViewMemberStyles.commissionAmount}>
              ₹{member?.commission ?? '0'}
            </Text>
          </View>
          <View style={ViewMemberStyles.commissionIconWrap}>
            <Feather name="trending-up" size={24} color="#16a34a" />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
