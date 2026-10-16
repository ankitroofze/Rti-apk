import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, StatusBar,
  FlatList, Linking, Modal, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View, Platform, ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { useToast } from '../components/ui/ToastProvider';
import s from '../styles/SettingsStyles';
import { UserStore } from '../store/UserStore';
import ModuleWebHeader from '../components/Modulewebheader';
import { INDIAN_STATES, getDistricts, getTalukas, getVillages } from './locationData';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, languageDisplay } from '../constants/indianLanguages';


// ── Delete Account modal styles ───────────────────────────────────────────────
const delStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#e11d48', marginBottom: 6 },
  sub: { fontSize: 13, color: '#475569', marginBottom: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#f8fafc' },
  inputWrapError: { borderColor: '#e11d48' },
  input: { flex: 1, fontSize: 14, color: '#0f172a' },
  errorText: { color: '#e11d48', fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#f1f5f9' },
  cancelText: { color: '#334155', fontWeight: '700' },
  deleteBtn: { backgroundColor: '#e11d48' },
  deleteText: { color: '#fff', fontWeight: '700' },
});

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
function SettingsItem({ icon, label, onPress, isToggle, toggleValue, onToggleChange, isDestructive }) {
  return (
    <TouchableOpacity
      style={[s.item, isDestructive && s.itemDestructive]}
      onPress={onPress}
      activeOpacity={isToggle ? 1 : 0.6}
    >
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={30} color={isDestructive ? '#e11d48' : '#94a3b8'} />
      </View>
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
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { showToast } = useToast();
    const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { language: appLanguage, changeLanguage } = useLanguage();
  const [languageModal, setLanguageModal] = useState(false);
  const languageItems = SUPPORTED_LANGUAGES.map(languageDisplay);
  const currentLanguageItem = languageDisplay(SUPPORTED_LANGUAGES.find((l) => l.code === appLanguage) || SUPPORTED_LANGUAGES.find((l) => l.code === 'en'));
  const handleLanguageSelect = (item) => {
    const picked = SUPPORTED_LANGUAGES.find((l) => languageDisplay(l) === item);
    if (!picked) return;
    changeLanguage(picked.code);
    showToast(`Language changed to ${picked.label}`, 'success');
  };
  // ✅ Delete Account: password modal state
  const [deleteModal, setDeleteModal]       = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePwd, setShowDeletePwd]   = useState(false);
  const [deleteError, setDeleteError]       = useState('');
  const [deleting, setDeleting]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [settingsData, setSettingsData]   = useState({ currentUser: null, settings: { language: 'English', password: '' } });
  const [form, setForm]                   = useState({ language: 'English', password: '' });

  const [dataSaver, setDataSaver]       = useState(false);
  const [disableMedia, setDisableMedia] = useState(false);

  const [locState, setLocState]           = useState('');
  const [locDistrict, setLocDistrict]     = useState('');
    const [locTaluka, setLocTaluka]         = useState('');
  const [locVillage, setLocVillage]       = useState('');
  const [villageModal, setVillageModal]   = useState(false);
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
    setLocVillage(user?.village || '');
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadSettings(); }, [loadSettings]));

  const districtList = locState ? getDistricts(locState) : [];
   const talukaList   = locDistrict ? getTalukas(locState, locDistrict) : [];
  const villageList  = locTaluka ? getVillages(locState, locDistrict, locTaluka) : [];

  const handleStateChange    = (val) => { setLocState(val); setLocDistrict(''); setLocTaluka(''); setLocVillage(''); };
  const handleDistrictChange = (val) => { setLocDistrict(val); setLocTaluka(''); setLocVillage(''); };
  const handleTalukaChange   = (val) => { setLocTaluka(val); setLocVillage(''); };

  const handleSaveLocation = async () => {
    if (!locState) { showToast('Please select your state.', 'error'); return; }
    setSavingLocation(true);
    const result = await UserStore.updateUser(settingsData.currentUser.email, {
      state: locState, district: locDistrict, taluka: locTaluka, village: locVillage,
    });
    setSavingLocation(false);
    if (!result) { showToast('Unable to update location.', 'error'); return; }
        AuthAPI.updateState({ state: locState, district: locDistrict, taluka: locTaluka, village: locVillage }).catch(() => {});
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
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // ── Delete Account (server API) ───────────────────────────────────────────
  const DELETE_CONFIRM_MSG = 'Your account will become inactive. You can reactivate it any time by logging in again.';

  const openDeletePasswordModal = () => {
    setDeletePassword('');
    setDeleteError('');
    setShowDeletePwd(false);
    setDeleteModal(true);
  };

  // Step 1: confirm dialog
  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      // react-native-web par Alert.alert multi-button support nahi karta
      if (typeof window !== 'undefined' && window.confirm(`Delete Account\n\n${DELETE_CONFIRM_MSG}`)) {
        openDeletePasswordModal();
      }
      return;
    }
    Alert.alert('Delete Account', DELETE_CONFIRM_MSG, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: openDeletePasswordModal },
    ]);
  };

  // Local token + user data clear karke Login screen par bhejo (logout API call NAHI)
  const finishAccountRemoval = async () => {
    try { await UserStore.deleteCurrentUser?.(); } catch {}
    try { await UserStore.clearCurrentUser?.(); } catch {}
    try { await logout(); } catch {}
    setDeleteModal(false);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Step 2: password dalke API call
  const submitDeleteAccount = async () => {
    if (deleting) return;
    if (!deletePassword) { setDeleteError('Password is required.'); return; }
    setDeleteError('');
    setDeleting(true);
    const result = await AuthAPI.deleteAccount({ password: deletePassword });
    setDeleting(false);

    if (result.ok) {
      showToast(result.message || 'Your account has been deleted.', 'success');
      await finishAccountRemoval();
      return;
    }
    if (result.isAuth) {            // 401 — token expire / invalid
      showToast('Session expired. Please login again.', 'error');
      await finishAccountRemoval();
      return;
    }
    if (result.forbidden) {         // 403 — admin account
      setDeleteModal(false);
      showToast(result.message, 'error');
      return;
    }
    if (result.passwordError) {     // 422 — password field ke neeche error
      setDeleteError(result.passwordError);
      return;
    }
    if (result.isNetwork) {         // internet band — modal khula rehta hai, user Retry kar sake
      setDeleteError('No internet connection. Please check and try again.');
      return;
    }
    setDeleteError(result.message || 'Unable to delete account.');
  };

  // ── Apni details yahan daalo ──────────────────────────────────────────────
  const WHATSAPP_NUMBER  = '917020667971'; // 91XXXXXXXXXX
  const COMPANY_EMAIL    = 'support@yourcompany.com';
  const PLAY_STORE_ID    = 'com.yourcompany.rtiapp'; // Apna package name daalo

  const handleWhatsappJoin = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`).catch(() =>
      showToast('Could not open WhatsApp. Please check and try again.', 'error')
    );
  };

  const handleContactCompany = () => {
    Linking.openURL(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${COMPANY_EMAIL}&su=Support%20Request`
    ).catch(() => showToast('Could not open Gmail. Please check and try again.', 'error'));
  };

  const handleRateApp = () => {
    // Android: pehle Play Store app try karo, nahi hai toh browser mein kholo
    // iOS: App Store khulega
    const androidUrl = `market://details?id=${PLAY_STORE_ID}`;
    const androidFallback = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
    const iosUrl = `itms-apps://itunes.apple.com/app/id${PLAY_STORE_ID}`;

    if (Platform.OS === 'ios') {
      Linking.openURL(iosUrl).catch(() =>
        showToast('Could not open the App Store.', 'error')
      );
    } else {
      Linking.openURL(androidUrl).catch(() =>
        Linking.openURL(androidFallback).catch(() =>
          showToast('Could not open the Play Store.', 'error')
        )
      );
    }
  };

  const nav = (screen, params) => navigation.navigate(screen, params);

   return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Web header — shared red image header, same design as Wallet/Withdraw */}
      <ModuleWebHeader title="Settings" navigation={navigation} />

      {/* Native header (unchanged) */}
      {Platform.OS !== 'web' && (
        <ImageBackground
          source={require('../assets/images/profile-red.png')}
          resizeMode="cover"
          style={[s.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Settings</Text>
            <Text style={s.headerSubtitle}>Manage your account & preferences</Text>
          </View>
        </ImageBackground>
      )}

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <View style={s.card}>
             {/* Change Location — temporarily removed from all platforms */}
          {/* Reporter Registration — temporarily hidden
          <SettingsItem icon="person-add-outline" label="Reporter Registration"             onPress={() => nav('Register')} />
          */}
         <SettingsItem icon="megaphone-outline" label="Advertise"                          onPress={() => nav('Advertise')} />
      <SettingsItem icon="pricetags-outline" label="Ads Subscription" onPress={() => nav('AdPlans')} />
          <SettingsItem icon="newspaper-outline" label="My Ads" onPress={() => nav('MyAds')} />
          {/* Purchase blue tick — temporarily removed from all platforms */}
          <SettingsItem icon="card-outline" label="My subscriptions"                   onPress={() => nav('Subscription Plans')} />
          <SettingsItem icon="cart-outline" label="Commerce & Ads Center"             onPress={() => nav('CommerceAdsCenter')} />
          <SettingsItem icon="refresh-outline" label="Refund & Cancellation Policy"        onPress={() => nav('LegalPolicy', { document: 'RefundCancellation' })} />
          <SettingsItem icon="logo-whatsapp" label="Join on Whatsapp"                   onPress={handleWhatsappJoin} />
          <SettingsItem icon="wallet-outline" label="Wallet"                             onPress={() => nav('Wallet', { returnTo: 'Settings' })} />
          <SettingsItem icon="person-circle-outline" label="Update account and profile details" onPress={() => nav('Profile', { openEdit: true })} />
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
                       {locTaluka !== '' && villageList.length > 0 && (
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Village</Text>
                <TouchableOpacity style={s.dropdown} onPress={() => setVillageModal(true)} activeOpacity={0.8}>
                  <Ionicons name="home-outline" size={18} color="#2563eb" />
                  <Text style={[s.dropdownText, !locVillage && s.placeholder]}>{locVillage || 'Select village'}</Text>
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
                <SettingsItem icon="language-outline" label="Change Language"         onPress={() => setLanguageModal(true)} />
         <SettingsItem icon="card-outline" label="Payment History"      onPress={() => navigation.navigate('PaymentHistory')} />
         <SettingsItem icon="ban-outline" label="People you blocked"      onPress={() => navigation.navigate('BlockedUsersScreen')} />
          <SettingsItem icon="trending-up-outline" label="Get Famous On The RTI" onPress={() => showToast('Coming soon', 'success')} />
        </View>

        {/* ── About & Support ── */}
        <SectionHeader title="About & Support" />
        <View style={s.card}>
                  <SettingsItem icon="star-outline" label="Rate this app"                 onPress={handleRateApp} />
          <SettingsItem icon="call-outline" label="Contact our company"           onPress={handleContactCompany} />
          {UserStore.hasActiveSubscription(settingsData.currentUser) ? (
            <SettingsItem icon="share-social-outline" label="Refer your family and friends" onPress={() => nav('Refer')} />
          ) : null}
          <SettingsItem icon="lock-closed-outline" label="Privacy Policy"                onPress={() => nav('LegalPolicy', { document: 'PrivacyPolicy' })} />
          <SettingsItem icon="people-outline" label="Community Guidelines"                onPress={() => nav('LegalPolicy', { document: 'CommunityGuidelines' })} />
          <SettingsItem icon="document-text-outline" label="Terms & Conditions"            onPress={() => nav('LegalPolicy', { document: 'TermsConditions' })} />
        </View>

        {/* ── Account Actions ── */}
        <SectionHeader title="Account Actions" />
        <View style={s.card}>
                 <SettingsItem icon="trash-outline" label="Delete Account"         onPress={handleDeleteAccount} isDestructive />
          <SettingsItem icon="flash-off-outline" label="Disable Media Encoding"  isToggle toggleValue={disableMedia} onToggleChange={setDisableMedia} />
          <SettingsItem icon="log-out-outline" label="Logout Account"          onPress={handleLogout} isDestructive />
        </View>

      </ScrollView>

      {/* Delete Account — password modal */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => { if (!deleting) setDeleteModal(false); }}>
        <View style={delStyles.overlay}>
          <View style={delStyles.box}>
            <Text style={delStyles.title}>Delete Account</Text>
            <Text style={delStyles.sub}>Enter your current password to confirm.</Text>
            <View style={[delStyles.inputWrap, !!deleteError && delStyles.inputWrapError]}>
              <Ionicons name="lock-closed-outline" size={18} color="#888" />
              <TextInput
                style={delStyles.input}
                value={deletePassword}
                onChangeText={(v) => { setDeletePassword(v); setDeleteError(''); }}
                placeholder="Current password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showDeletePwd}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!deleting}
                onSubmitEditing={submitDeleteAccount}
              />
              <TouchableOpacity onPress={() => setShowDeletePwd((v) => !v)}>
                <Ionicons name={showDeletePwd ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            {deleteError ? <Text style={delStyles.errorText}>{deleteError}</Text> : null}
            <View style={delStyles.row}>
              <TouchableOpacity style={[delStyles.btn, delStyles.cancelBtn]} disabled={deleting} onPress={() => setDeleteModal(false)}>
                <Text style={delStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[delStyles.btn, delStyles.deleteBtn, deleting && { opacity: 0.6 }]} disabled={deleting} onPress={submitDeleteAccount}>
                {deleting ? <ActivityIndicator color="#fff" /> : <Text style={delStyles.deleteText}>{deleteError && deleteError.startsWith('Internet') ? 'Retry' : 'Delete'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <DropdownModal visible={languageModal} title="Select Language" items={languageItems}
        selected={currentLanguageItem} onSelect={handleLanguageSelect} onClose={() => setLanguageModal(false)} />
      <DropdownModal visible={stateModal}    title="Select State"    items={INDIAN_STATES}
        selected={locState}    onSelect={handleStateChange}    onClose={() => setStateModal(false)} />
      <DropdownModal visible={districtModal} title="Select District" items={districtList}
        selected={locDistrict} onSelect={handleDistrictChange} onClose={() => setDistrictModal(false)} />
      <DropdownModal visible={talukaModal}   title="Select Taluka"   items={talukaList}
       selected={locTaluka}   onSelect={handleTalukaChange}    onClose={() => setTalukaModal(false)} />
      <DropdownModal visible={villageModal}  title="Select Village"  items={villageList}
        selected={locVillage}  onSelect={setLocVillage}         onClose={() => setVillageModal(false)} />
    </View>
    </SafeAreaView>
  );
}