// pages/GroupInfoScreen.js
// UI-only screen. MOCK data used for layout/demo. Wire up to real group API later.

import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles, { C } from '../styles/ChatStyles';

const MOCK_MEMBERS = [
  { id: 'u1', name: 'Suresh Jadhav', role: 'admin' },
  { id: 'u2', name: 'Anita Deshmukh', role: 'moderator' },
  { id: 'u3', name: 'Ramesh Patil', role: 'member' },
  { id: 'u4', name: 'Sunil Kadam', role: 'member' },
  { id: 'u5', name: 'Priya Shinde', role: 'member' },
];

const ROLE_LABEL = { admin: 'Admin', moderator: 'Moderator', member: 'Member' };
const ROLE_COLOR = {
  admin: { text: C.orange, bg: C.orangeLight },
  moderator: { text: '#2563EB', bg: '#EFF6FF' },
  member: { text: C.textMuted, bg: '#F1F1F1' },
};

function RoleBadge({ role }) {
  const c = ROLE_COLOR[role] || ROLE_COLOR.member;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: c.text }}>{ROLE_LABEL[role]}</Text>
    </View>
  );
}

export default function GroupInfoScreen({ navigation, route }) {
  const params = route?.params || {};
  const groupName = params.name || 'Taluka RTI Volunteers';

  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [memberLimit, setMemberLimit] = useState(256);
  const [onlyAdminCanPost, setOnlyAdminCanPost] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [actionsFor, setActionsFor] = useState(null); // member row action sheet

  const currentUserIsAdmin = true; // TODO: derive from logged-in user's role

  const bumpLimit = (delta) => {
    setMemberLimit((v) => Math.max(members.length, Math.min(1000, v + delta)));
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setActionsFor(null);
  };

  const makeModerator = (id) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: 'moderator' } : m)));
    setActionsFor(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Feather name="arrow-left" size={20} color={C.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group info</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Group summary */}
          <View style={{ alignItems: 'center', paddingVertical: 22, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View style={[styles.avatarCircle, { width: 80, height: 80, borderRadius: 40 }]}>
              <Feather name="users" size={30} color={C.orange} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.textDark, marginTop: 10 }}>{groupName}</Text>
            <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{members.length} members · Public group</Text>
          </View>

          {/* Quick actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.white, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            {[
              { icon: 'search', label: 'Search' },
              { icon: 'bell-off', label: 'Mute' },
              { icon: 'user-plus', label: 'Add' },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={{ alignItems: 'center', gap: 5 }}>
                <View style={[styles.sheetIconWrap, { width: 44, height: 44, backgroundColor: C.orangeLight }]}>
                  <Feather name={a.icon} size={18} color={C.orange} />
                </View>
                <Text style={{ fontSize: 11, color: C.textMid }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Admin-controlled settings */}
          {currentUserIsAdmin ? (
            <>
              <Text style={styles.sectionLabel}>Admin controls</Text>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Only admins can post</Text>
                  <Text style={styles.settingSubLabel}>Members can still comment/react</Text>
                </View>
                <Switch
                  value={onlyAdminCanPost}
                  onValueChange={setOnlyAdminCanPost}
                  trackColor={{ true: C.orangeMid, false: '#D1D5DB' }}
                  thumbColor={onlyAdminCanPost ? C.orange : '#f4f3f4'}
                />
              </View>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Approval required to join</Text>
                  <Text style={styles.settingSubLabel}>New members wait for admin approval</Text>
                </View>
                <Switch
                  value={approvalRequired}
                  onValueChange={setApprovalRequired}
                  trackColor={{ true: C.orangeMid, false: '#D1D5DB' }}
                  thumbColor={approvalRequired ? C.orange : '#f4f3f4'}
                />
              </View>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Member limit</Text>
                  <Text style={styles.settingSubLabel}>Reasonable cap, admin controlled</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => bumpLimit(-10)}>
                    <Feather name="minus" size={14} color={C.textDark} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{memberLimit}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => bumpLimit(10)}>
                    <Feather name="plus" size={14} color={C.textDark} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : null}

          {/* Members list */}
          <Text style={styles.sectionLabel}>{members.length} Members</Text>
          <View style={{ backgroundColor: C.white }}>
            {members.map((m) => (
              <View key={m.id} style={styles.settingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={[styles.avatarCircle, { width: 40, height: 40, borderRadius: 20 }]}>
                    <Text style={[styles.avatarInitial, { fontSize: 14 }]}>{m.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{m.name}</Text>
                    <View style={{ marginTop: 3 }}>
                      <RoleBadge role={m.role} />
                    </View>
                  </View>
                </View>
                {currentUserIsAdmin && m.role !== 'admin' ? (
                  <TouchableOpacity onPress={() => setActionsFor(m)}>
                    <Feather name="more-vertical" size={18} color={C.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.actionSheetRow, { backgroundColor: C.white, paddingHorizontal: 16, borderBottomWidth: 0, marginTop: 4 }]}>
            <Feather name="log-out" size={17} color={C.red} />
            <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Exit group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionSheetRow, { backgroundColor: C.white, paddingHorizontal: 16, borderBottomWidth: 0 }]}>
            <Feather name="flag" size={17} color={C.red} />
            <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Report group</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Member moderation action sheet */}
      <Modal visible={!!actionsFor} transparent animationType="fade" onRequestClose={() => setActionsFor(null)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setActionsFor(null)}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{actionsFor?.name}</Text>
            {actionsFor?.role === 'member' ? (
              <TouchableOpacity style={styles.actionSheetRow} onPress={() => makeModerator(actionsFor.id)}>
                <Feather name="shield" size={17} color={C.textDark} />
                <Text style={styles.actionSheetRowText}>Make moderator</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.actionSheetRow}>
              <Feather name="slash" size={17} color={C.red} />
              <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Block member</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetRow, { borderBottomWidth: 0 }]}
              onPress={() => removeMember(actionsFor?.id)}
            >
              <Feather name="user-x" size={17} color={C.red} />
              <Text style={[styles.actionSheetRowText, styles.actionSheetRowTextDanger]}>Remove from group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}