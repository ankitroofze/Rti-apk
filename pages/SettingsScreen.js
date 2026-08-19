import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList, Linking, Modal, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../components/ui/ToastProvider';
import s from '../styles/SettingsStyles';
import { UserStore } from '../store/UserStore';
import { INDIAN_STATES, getDistricts, getTalukas } from './locationData';

// ── Dropdown Modal ────────────────────────────────────────────────────────────
const dropStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, borderWidth: 1, borderColor: '#e2e8f0',
    elevation: 20,
  },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, marginBottom: 3,
  },
  itemSelected: { backgroundColor: '#eff6ff' },
  itemText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  itemTextSelected: { color: '#2563eb', fontWeight: '700' },
});

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dropStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={dropStyles.sheet}>
        <View style={dropStyles.handle} />
        <Text style={dropStyles.title}>{title}</Text>
        <View style={dropStyles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#2563eb" />
          <TextInput
            style={dropStyles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[dropStyles.item, selected === item && dropStyles.itemSelected]}
              onPress={() => { onSelect(item); onClose(); setSearch(''); }}
            >
              <Text style={[dropStyles.itemText, selected === item && dropStyles.itemTextSelected]}>{item}</Text>
              {selected === item && <Ionicons name="checkmark-circle" size={18} color="#2563eb" />}
            </TouchableOpacity>
          )}
          style={{ maxHeight: 340 }}
        />
      </View>
    </Modal>
  );
}

// ── Settings Row Item ─────────────────────────────────────────────────────────
function SettingsItem({ emoji, label, onPress, isToggle, toggleValue, onToggleChange, isDestructive }) {
  return (
    <TouchableOpacity
      style={[s.item, isDestructive && s.itemDestructive]}
      onPress={onPress}
      activeOpacity={isToggle ? 1 : 0.6}
    >
      <Text style={s.itemEmoji}>{emoji}</Text>
      <Text style={[s.itemLabel, isDestructive && s.itemLabelDestructive]}>{label}</Text>
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
          thumbColor={toggleValue ? '#2563eb' : '#94a3b8'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={isDestructive ? '#ef4444' : '#cbd5e1'} />
      )}
    </TouchableOpacity>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { showToast } = useToast();
  const [saving, setSaving]               = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [settingsData, setSettingsData]   = useState({ currentUser: null, settings: { language: 'English', password: '' } });
  const [form, setForm]                   = useState({ language: 'English', password: '' });

  const [dataSaver, setDataSaver]       = useState(false);
  const [disableMedia, setDisableMedia] = useState(false);

  const [locState, setLocState]           = useState('');
  const [locDistrict, setLocDistrict]     = useState('');
  const [locTaluka, setLocTaluka]         = useState('');
  const [stateModal, setStateModal]       = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [talukaModal, setTalukaModal]     = useState(false);
  const [locationCardVisible, setLocationCardVisible] = useState(false);

  const loadSettings = useCallback(async () => {
    const data = await UserStore.getSettingsSummary();
    if (!data) { navigation.replace('Login'); return; }
    setSettingsData(data);
    setForm({ language: data.settings.language || 'English', password: '' });
    const user = data.currentUser;
    setLocState(user?.state || '');
    setLocDistrict(user?.district || '');
    setLocTaluka(user?.taluka || '');
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadSettings(); }, [loadSettings]));

  const districtList = locState ? getDistricts(locState) : [];
  const talukaList   = locDistrict ? getTalukas(locState, locDistrict) : [];

  const handleStateChange    = (val) => { setLocState(val); setLocDistrict(''); setLocTaluka(''); };
  const handleDistrictChange = (val) => { setLocDistrict(val); setLocTaluka(''); };

  const handleSaveLocation = async () => {
    if (!locState) { showToast('Please select your state.', 'error'); return; }
    setSavingLocation(true);
    const result = await UserStore.updateUser(settingsData.currentUser.email, {
      state: locState, district: locDistrict, taluka: locTaluka,
    });
    setSavingLocation(false);
    if (!result) { showToast('Unable to update location.', 'error'); return; }
    showToast('Location updated! ✅', 'success');
    setLocationCardVisible(false);
    loadSettings();
  };

  const handleSave = async () => {
    if (!form.language.trim()) { showToast('Language is required.', 'error'); return; }
    setSaving(true);
    const result = await UserStore.updateSettings({ language: form.language.trim(), password: form.password });
    setSaving(false);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    showToast('Settings updated!', 'success');
    loadSettings();
  };

  const handleLogout = async () => {
    await UserStore.clearCurrentUser?.();
    navigation.replace('Home');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await UserStore.deleteCurrentUser?.();
            if (!result?.ok) {
              showToast(result?.message || 'Unable to delete account.', 'error');
              return;
            }
            showToast('Account deleted.', 'success');
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  // ── Apni details yahan daalo ──────────────────────────────────────────────
  const WHATSAPP_NUMBER  = '919999999999'; // 91XXXXXXXXXX
  const COMPANY_EMAIL    = 'support@yourcompany.com';
  const PLAY_STORE_ID    = 'com.yourcompany.rtiapp'; // Apna package name daalo

  const handleWhatsappJoin = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`).catch(() =>
      showToast('WhatsApp open nahi hua. Check karo.', 'error')
    );
  };

  const handleContactCompany = () => {
    Linking.openURL(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${COMPANY_EMAIL}&su=Support%20Request`
    ).catch(() => showToast('Gmail open nahi hua. Check karo.', 'error'));
  };

  const handleRateApp = () => {
    // Android: pehle Play Store app try karo, nahi hai toh browser mein kholo
    // iOS: App Store khulega
    const androidUrl = `market://details?id=${PLAY_STORE_ID}`;
    const androidFallback = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
    const iosUrl = `itms-apps://itunes.apple.com/app/id${PLAY_STORE_ID}`;

    if (Platform.OS === 'ios') {
      Linking.openURL(iosUrl).catch(() =>
        showToast('App Store open nahi hua.', 'error')
      );
    } else {
      Linking.openURL(androidUrl).catch(() =>
        Linking.openURL(androidFallback).catch(() =>
          showToast('Play Store open nahi hua.', 'error')
        )
      );
    }
  };

  const nav = (screen) => navigation.navigate(screen);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <View style={s.card}>
          <SettingsItem emoji="📍" label="Change Location" onPress={() => nav('ChangeLocation')} />
          <SettingsItem emoji="🧑‍💼" label="Reporter Registration"             onPress={() => nav('Register')} />
         <SettingsItem emoji="📢" label="Advertise"                          onPress={() => nav('Advertise')} />
          <SettingsItem emoji="🎯" label="My Advertisement Subscription" onPress={() => nav('My Ads Subscription')} />
          <SettingsItem emoji="✅" label="Purchase blue tick"                 onPress={() => nav('PurchaseBlueTick')} />
          <SettingsItem emoji="📱" label="My subscriptions"                   onPress={() => nav('Subscription Plans')} />
          <SettingsItem emoji="🛒" label="Commerce & Ads Center"             onPress={() => nav('CommerceAdsCenter')} />
          <SettingsItem emoji="🔄" label="Refund policy"                      onPress={() => showToast('Coming soon', 'success')} />
          <SettingsItem emoji="💬" label="Join on Whatsapp"                   onPress={handleWhatsappJoin} />
          <SettingsItem emoji="💰" label="My earnings"                        onPress={() => showToast('Coming soon', 'success')} />
          <SettingsItem emoji="👤" label="Update account and profile details" onPress={() => nav('Profile')} />
        </View>

        {/* Change Location Inline Card */}
        {locationCardVisible && (
          <View style={s.inlineCard}>
            <Text style={s.inlineCardTitle}>Change Location</Text>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>State</Text>
              <TouchableOpacity style={s.dropdown} onPress={() => setStateModal(true)} activeOpacity={0.8}>
                <Ionicons name="location-outline" size={18} color="#2563eb" />
                <Text style={[s.dropdownText, !locState && s.placeholder]}>{locState || 'Select state'}</Text>
                <Ionicons name="chevron-down-outline" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {districtList.length > 0 && (
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>District</Text>
                <TouchableOpacity style={s.dropdown} onPress={() => setDistrictModal(true)} activeOpacity={0.8}>
                  <Ionicons name="business-outline" size={18} color="#2563eb" />
                  <Text style={[s.dropdownText, !locDistrict && s.placeholder]}>{locDistrict || 'Select district'}</Text>
                  <Ionicons name="chevron-down-outline" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}
            {locDistrict !== '' && talukaList.length > 0 && (
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Taluka</Text>
                <TouchableOpacity style={s.dropdown} onPress={() => setTalukaModal(true)} activeOpacity={0.8}>
                  <Ionicons name="map-outline" size={18} color="#2563eb" />
                  <Text style={[s.dropdownText, !locTaluka && s.placeholder]}>{locTaluka || 'Select taluka'}</Text>
                  <Ionicons name="chevron-down-outline" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={s.saveBtn} onPress={handleSaveLocation} disabled={savingLocation}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.saveBtnText}>{savingLocation ? 'Saving...' : 'Save Location'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Preferences ── */}
        <SectionHeader title="Preferences" />
        <View style={s.card}>
          <SettingsItem emoji="🌐" label="Change Language"         onPress={() => showToast('Coming soon', 'success')} />
          <SettingsItem emoji="🚫" label="People you blocked"      onPress={() => showToast('Coming soon', 'success')} />
          <SettingsItem emoji="⭐" label="Get Famous On The RTI" onPress={() => showToast('Coming soon', 'success')} />
        </View>

        {/* ── About & Support ── */}
        <SectionHeader title="About & Support" />
        <View style={s.card}>
          <SettingsItem emoji="⭐" label="Rate this app"                 onPress={handleRateApp} />
          <SettingsItem emoji="📞" label="Contact our company"           onPress={handleContactCompany} />
          <SettingsItem emoji="🔗" label="Refer your family and friends" onPress={() => nav('Refer')} />
          <SettingsItem emoji="🔒" label="Privacy Policy"                onPress={() => showToast('Coming soon', 'success')} />
          <SettingsItem emoji="📄" label="Terms & Conditions"            onPress={() => showToast('Coming soon', 'success')} />
        </View>

        {/* ── Account Actions ── */}
        <SectionHeader title="Account Actions" />
        <View style={s.card}>
          <SettingsItem emoji="🗑️" label="Delete Account"         onPress={handleDeleteAccount} isDestructive />
          <SettingsItem emoji="0️⃣" label="Disable Media Encoding"  isToggle toggleValue={disableMedia} onToggleChange={setDisableMedia} />
          <SettingsItem emoji="🚪" label="Logout Account"          onPress={handleLogout} isDestructive />
        </View>

      </ScrollView>

      {/* Modals */}
      <DropdownModal visible={stateModal}    title="Select State"    items={INDIAN_STATES}
        selected={locState}    onSelect={handleStateChange}    onClose={() => setStateModal(false)} />
      <DropdownModal visible={districtModal} title="Select District" items={districtList}
        selected={locDistrict} onSelect={handleDistrictChange} onClose={() => setDistrictModal(false)} />
      <DropdownModal visible={talukaModal}   title="Select Taluka"   items={talukaList}
        selected={locTaluka}   onSelect={setLocTaluka}         onClose={() => setTalukaModal(false)} />
    </View>
    </SafeAreaView>
  );
}