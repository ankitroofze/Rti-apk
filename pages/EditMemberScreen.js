import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import EditMemberStyles from '../styles/Editmemberstyles';

export default function EditMemberScreen({ route, navigation }) {
  const { member } = route.params || {};

  const [name, setName]           = useState(member?.name ?? '');
  const [referredBy, setReferredBy] = useState(member?.referred_by ?? '');
  const [level, setLevel]         = useState(String(member?.level ?? ''));
  const [commission, setCommission] = useState(String(member?.commission ?? ''));
  const [saving, setSaving]       = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      // TODO: Replace with your actual API / UserStore update call
      // const updatedMember = { ...member, name, referred_by: referredBy, level, commission };
      // await UserStore.updateMember(updatedMember);

      Alert.alert('Success', 'Member updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, icon, value, onChangeText, keyboardType = 'default', editable = true }) => (
    <View style={EditMemberStyles.fieldWrap}>
      <Text style={EditMemberStyles.fieldLabel}>{label}</Text>
      <View style={[
        EditMemberStyles.inputRow,
        !editable && EditMemberStyles.inputRowDisabled,
      ]}>
        <View style={EditMemberStyles.inputIconWrap}>
          <Feather name={icon} size={15} color={editable ? '#2563eb' : '#94a3b8'} />
        </View>
        <TextInput
          style={EditMemberStyles.textInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          editable={editable}
          placeholderTextColor="#94a3b8"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={EditMemberStyles.root}>

      {/* ── Top Bar ── */}
      <View style={EditMemberStyles.topBar}>
        <TouchableOpacity
          style={EditMemberStyles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={EditMemberStyles.topBarTitle}>Edit Member</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScroll
        style={EditMemberStyles.scrollView}
        contentContainerStyle={EditMemberStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── ID Badge ── */}
        <View style={EditMemberStyles.idBadgeRow}>
          <Feather name="hash" size={14} color="#64748b" />
          <Text style={EditMemberStyles.idBadgeText}>
            User ID: {member?.user_id}
          </Text>
        </View>

        {/* ── Form Card ── */}
        <View style={EditMemberStyles.formCard}>
          <Text style={EditMemberStyles.sectionTitle}>Edit Details</Text>

          <InputField
            label="Full Name"
            icon="user"
            value={name}
            onChangeText={setName}
          />
          <InputField
            label="Referred By"
            icon="users"
            value={referredBy}
            onChangeText={setReferredBy}
          />
          <InputField
            label="Level"
            icon="layers"
            value={level}
            onChangeText={setLevel}
            keyboardType="numeric"
          />
          <InputField
            label="Commission (₹)"
            icon="trending-up"
            value={commission}
            onChangeText={setCommission}
            keyboardType="numeric"
          />
          <InputField
            label="User ID (Read Only)"
            icon="lock"
            value={member?.user_id ?? ''}
            onChangeText={() => {}}
            editable={false}
          />
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[EditMemberStyles.saveBtn, saving && EditMemberStyles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check" size={16} color="#fff" />
              <Text style={EditMemberStyles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Cancel ── */}
        <TouchableOpacity
          style={EditMemberStyles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={EditMemberStyles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </KeyboardAwareScroll>
    </View>
    </SafeAreaView>
  );
}