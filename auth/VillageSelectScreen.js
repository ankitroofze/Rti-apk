import { AuthAPI } from './ClientAPI/AuthApi';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { UserStore } from '../store/UserStore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { getVillages } from '../pages/locationData';
import styles from '../styles/RegisterStyles';

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dropStyles.overlay} activeOpacity={1} onPress={onClose}>
      <View style={dropStyles.sheet}>
        <View style={dropStyles.handle} />
        <Text style={dropStyles.title}>{title}</Text>
        <View style={dropStyles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#e8732a" />
          <TextInput
            style={dropStyles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search village..."
            placeholderTextColor="#b0a898"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor="#e8732a"
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[dropStyles.item, selected === item && dropStyles.itemSelected]}
              onPress={() => { onSelect(item); onClose(); setSearch(''); }}
            >
              <Text style={[dropStyles.itemText, selected === item && dropStyles.itemTextSelected]}>
                {item}
              </Text>
              {selected === item && <Ionicons name="checkmark-circle" size={18} color="#e8732a" />}
            </TouchableOpacity>
          )}
        />
      </View>
      </TouchableOpacity>
    </Modal>
  );
}

const dropStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(180,170,160,0.5)',
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
      justifyContent: 'center',
    }),
  },
  sheet: {
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: 480,
          maxHeight: '80%',
          borderRadius: 24,
        }
      : {
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }),
    backgroundColor: '#ece7e0',
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#b8afa6',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#c8c0b8',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d2a26',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ece7e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
    shadowColor: '#b8afa6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2d2a26',
    paddingVertical: 0,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 3,
  },
  itemSelected: {
    backgroundColor: 'rgba(232,115,42,0.12)',
  },
  itemText: {
    fontSize: 14,
    color: '#4a4540',
    fontWeight: '500',
  },
  itemTextSelected: {
    color: '#e8732a',
    fontWeight: '700',
  },
});

export default function VillageSelectScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { login } = useAuth();
  const { showPopup } = useToast();
  const { selectedState, selectedDistrict, selectedTaluka, fromPremium, needsCreateUser, needsLogin } = route.params || {};

  const [village, setVillage] = useState('');
  const [villageModal, setVillageModal] = useState(false);
  const allowLeaveRef = useRef(false);
  const registrationJustCompleted = !fromPremium;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current) return;
      const targetRoute = e.data.action.payload?.name;
      if (targetRoute === 'Home') return;
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation]);

  const handleClose = () => {
    allowLeaveRef.current = true;
    navigation.replace('TalukaSelect', {
      selectedState, selectedDistrict, fromPremium, needsCreateUser, needsLogin,
    });
  };

  const villageList = selectedTaluka ? getVillages(selectedState, selectedDistrict, selectedTaluka) : [];

  const goToHome = (userName, shouldLogin = false) => {
    // ✅ Register complete -> seedha Home. reset() se Register/State/District/Taluka/Village
    // stack saaf ho jaata hai, isliye back dabane par wapas register screen nahi aati.
    allowLeaveRef.current = true;
    const params = { fromRegistration: true, registrationJustCompleted, userName: userName || 'User' };
    try {
      navigation.reset({ index: 0, routes: [{ name: 'Home', params }] });
    } catch (e) {
      try { navigation.replace('Home', params); } catch (_) { /* ignore */ }
    }
    // ✅ login() sabse LAST me, navigation ke baad — pehle login() chalane se navigator re-render hota tha
    // aur Home par jaate waqt app band ho jaata tha.
    if (shouldLogin) {
      setTimeout(() => { try { login(); } catch (_) { /* ignore */ } }, 350);
    }
  };

  // Registration (verified email OTP ke saath) Register screen par hi server par ho chuki hoti hai.
  // Yahan sirf location server par update hoti hai.
  const syncRegistrationLocation = async (villageValue = '') => {
    try {
      const stateResult = await AuthAPI.updateState({
        state: selectedState,
        district: selectedDistrict,
        taluka: selectedTaluka,
        village: villageValue,
      });
      if (!stateResult.ok) console.warn('[VillageSelect] State API failed:', stateResult.message);
    } catch (error) {
      console.warn('[VillageSelect] API sync failed:', error);
    }
  };

  const handleComplete = async () => {
    if (!village.trim()) {
      showPopup('Please select or enter your village', 'error');
      return;
    }
    const villageValue = village.trim();

    if (needsCreateUser) {
      const pending = await UserStore.getPendingRegistration();
      if (!pending?.email) {
        showPopup('Registration data not found. Please register again.', 'error');
        allowLeaveRef.current = true;
        navigation.replace('Register');
        return;
      }

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: selectedState,
        district: selectedDistrict, taluka: selectedTaluka, village: villageValue,
        profile_image: pending.profile_image || '',
        bio: pending.bio || '',
      });

      if (created && !created.ok) {
        // Account server par ban chuka hai (Register screen par) — sirf local copy save nahi hui.
        // Login karte hi profile server se sync ho jaati hai.
        await UserStore.clearPendingRegistration();
        allowLeaveRef.current = true;
        showPopup('Your account has been created. Please sign in to continue.', 'success');
        navigation.replace('Login');
        return;
      }

      await UserStore.setCurrentUser(pending.email);
      try {
        await UserStore.completeLocationSetup(pending.email, selectedState, selectedDistrict, selectedTaluka, villageValue);
        await UserStore.clearPendingRegistration();
      } catch (e) { console.warn('[register] local setup failed:', e?.message || e); }

      syncRegistrationLocation(villageValue);

      goToHome(pending.name, true);
      return;
    }

    const user = await UserStore.getCurrentUser();
    if (!user) { allowLeaveRef.current = true; navigation.replace('Login'); return; }

    const result = await UserStore.completeLocationSetup(user.email, selectedState, selectedDistrict, selectedTaluka, villageValue);
    if (!result) { showPopup('Failed to save location. Please try again.', 'error'); return; }
    // API update
    AuthAPI.updateState({
      state:    selectedState,
      district: selectedDistrict,
      taluka:   selectedTaluka,
      village:  villageValue,
    }).catch(() => {});

    goToHome(user.name, !!needsLogin);
  };

  const handleSkip = async () => {
    if (needsCreateUser) {
      const pending = await UserStore.getPendingRegistration();
      if (!pending?.email) {
        showPopup('Registration data not found. Please register again.', 'error');
        allowLeaveRef.current = true;
        navigation.replace('Register');
        return;
      }

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: selectedState,
        district: selectedDistrict, taluka: selectedTaluka, village: '',
        profile_image: pending.profile_image || '',
        bio: pending.bio || '',
      });
      if (created && !created.ok) {
        await UserStore.clearPendingRegistration();
        allowLeaveRef.current = true;
        showPopup('Your account has been created. Please sign in to continue.', 'success');
        navigation.replace('Login');
        return;
      }

      await UserStore.setCurrentUser(pending.email);
      try {
        await UserStore.completeLocationSetup(pending.email, selectedState, selectedDistrict, selectedTaluka, '');
        await UserStore.clearPendingRegistration();
      } catch (e) { console.warn('[register] local setup failed:', e?.message || e); }

      syncRegistrationLocation('');

      goToHome(pending.name, true);
      return;
    }

    const user = await UserStore.getCurrentUser();
    if (!user) { allowLeaveRef.current = true; navigation.replace('Login'); return; }

    await UserStore.completeLocationSetup(user.email, selectedState, selectedDistrict, selectedTaluka, '');
    goToHome(user.name, !!needsLogin);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#B91C1C' }} edges={[]}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'}>
      <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" style={styles.root}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />

        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.formContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={[styles.closeButton, { width: 'auto', paddingHorizontal: 10 }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="arrow-back" size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' }}>Back</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.topAccent} />

            {/* Header — label + title + state/district/taluka info */}
            <View style={styles.headerBlock}>
              <Text style={styles.welcomeBack}>Setup Location</Text>
              <Text style={styles.formTitle}>Select Your Village</Text>
              {(selectedState || selectedDistrict || selectedTaluka) && (
                <Text style={localStyles.locationInfo}>
                  {[selectedState, selectedDistrict, selectedTaluka].filter(Boolean).join(' › ')}
                </Text>
              )}
            </View>

            {villageList.length > 0 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Village <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.inputWrap}
                    onPress={() => setVillageModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="home-outline" size={16} color="#a09890" />
                    <Text style={[styles.input, !village && { color: '#b0a898' }]}>
                      {village || 'Select your village'}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={16} color="#a09890" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, !village && styles.submitBtnDisabled]}
                  onPress={handleComplete}
                  disabled={!village}
                >
                  <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginButtonGradient}>
                    <Text style={styles.submitBtnText}>Complete Setup</Text>
                    <Ionicons name="checkmark" size={18} color="#B91C1C" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Village <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="home-outline" size={16} color="#a09890" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your village"
                      placeholderTextColor="#b0a898"
                      value={village}
                      onChangeText={setVillage}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, !village.trim() && styles.submitBtnDisabled]}
                  onPress={handleComplete}
                  disabled={!village.trim()}
                >
                  <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginButtonGradient}>
                    <Text style={styles.submitBtnText}>Complete Setup</Text>
                    <Ionicons name="checkmark" size={18} color="#B91C1C" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Skip Button */}
            <TouchableOpacity style={localStyles.skipBtn} onPress={handleSkip} activeOpacity={0.75}>
              <Text style={localStyles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {villageList.length > 0 && (
          <DropdownModal
            visible={villageModal}
            title="Select Village"
            items={villageList}
            selected={village}
            onSelect={setVillage}
            onClose={() => setVillageModal(false)}
          />
        )}
      </ImageBackground>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  locationInfo: {
    marginTop: 4,
    fontSize: 12,
    color: '#a09890',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  skipBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    color: '#a09890',
    fontSize: 13,
    fontWeight: '600',
  },
});