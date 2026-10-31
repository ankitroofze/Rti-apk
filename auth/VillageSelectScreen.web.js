import { AuthAPI } from './ClientAPI/AuthApi';
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { UserStore } from '../store/UserStore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { getVillages } from '../pages/locationData';
import styles from '../styles/RegisterStyles';
import webStyles from '../styles/LocationWebStyles';
import BackTitleRow from '../components/BackTitleRow';
import LocationDropdownModal from '../components/LocationDropdownModal';

function DropdownModal(props) {
  return <LocationDropdownModal placeholder="Search village..." emptyText="No village found" {...props} />;
}

export default function VillageSelectScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
  const { login } = useAuth();
  const { showPopup } = useToast();
  const { selectedState, selectedDistrict, selectedTaluka, fromPremium, needsCreateUser, needsLogin } = route.params || {};

  const [village, setVillage] = useState('');
  const [villageModal, setVillageModal] = useState(false);
  const allowLeaveRef = useRef(false);
  const registrationJustCompleted = !fromPremium;

  const handleClose = () => {
    allowLeaveRef.current = true;
    navigation.replace('TalukaSelect', { selectedState, selectedDistrict, fromPremium, needsCreateUser, needsLogin });
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
    if (!village.trim()) { showPopup('Please select or enter your village', 'error'); return; }
    const villageValue = village.trim();

    if (needsCreateUser) {
      const commit = await UserStore.commitPendingRegistration();
      if (!commit.ok) {
        showPopup(commit.message || 'Registration failed. Please try again.', 'error');
        if (!commit.isNetwork) { try { navigation.navigate('Register', commit.otpError ? { otpExpired: true } : undefined); } catch (_) { /* ignore */ } }
        return;
      }
      const pending = commit.pending;

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: selectedState,
        district: selectedDistrict, taluka: selectedTaluka, village: villageValue,
        profile_image: pending.profile_image || '', bio: pending.bio || '',
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
        await UserStore.completeLocationSetup(pending.email, selectedState, selectedDistrict, selectedTaluka, villageValue);
        await UserStore.clearPendingRegistration();
      } catch (e) { console.warn('[register] local setup failed:', e?.message || e); }
      syncRegistrationLocation(villageValue);
      goToHome(pending.name, true);
      return;
    }

    const user = await UserStore.getCurrentUser();
    if (!user) { navigation.replace('Login'); return; }

    const result = await UserStore.completeLocationSetup(user.email, selectedState, selectedDistrict, selectedTaluka, villageValue);
    if (!result) { showPopup('Failed to save location. Please try again.', 'error'); return; }
    AuthAPI.updateState({ state: selectedState, district: selectedDistrict, taluka: selectedTaluka, village: villageValue }).catch(() => {});
    goToHome(user.name, !!needsLogin);
  };

  const handleSkip = async () => {
    if (needsCreateUser) {
      const commit = await UserStore.commitPendingRegistration();
      if (!commit.ok) {
        showPopup(commit.message || 'Registration failed. Please try again.', 'error');
        if (!commit.isNetwork) { try { navigation.navigate('Register', commit.otpError ? { otpExpired: true } : undefined); } catch (_) { /* ignore */ } }
        return;
      }
      const pending = commit.pending;

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: selectedState,
        district: selectedDistrict, taluka: selectedTaluka, village: '',
        profile_image: pending.profile_image || '', bio: pending.bio || '',
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
    if (!user) { navigation.replace('Login'); return; }
    await UserStore.completeLocationSetup(user.email, selectedState, selectedDistrict, selectedTaluka, '');
    goToHome(user.name, !!needsLogin);
  };

  return (
    <View style={webStyles.page}>
      {showImagePanel && (
        <View style={webStyles.imagePanel}>
          <Image source={require('../assets/images/login.png')} resizeMode="cover" style={webStyles.imagePanelPicture} />
        </View>
      )}

      <View style={webStyles.formPanel}>
        <ScrollView contentContainerStyle={webStyles.formPanelScroll} showsVerticalScrollIndicator={false}>
          <View style={webStyles.formInner}>
            <Image
              source={require('../assets/images/certificate_logo.jpg')}
              resizeMode="contain"
              style={webStyles.brandLogo}
              accessibilityLabel="RTI News logo"
            />

            <BackTitleRow onBack={handleClose} titleHeight={32}>
              <Text style={[styles.welcomeBack, webStyles.welcomeBack]}>Setup Location</Text>
              <Text style={[styles.formTitle, webStyles.formTitle]}>Select Your Village</Text>
            </BackTitleRow>
            {(selectedState || selectedDistrict || selectedTaluka) && (
              <Text style={webStyles.locationInfo}>{[selectedState, selectedDistrict, selectedTaluka].filter(Boolean).join(' › ')}</Text>
            )}

            {villageList.length > 0 ? (
              <>
                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Village <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={styles.inputWrap} onPress={() => setVillageModal(true)} activeOpacity={0.8}>
                    <Ionicons name="home-outline" size={16} color="#888" />
                    <Text style={[styles.input, !village && { color: '#9ca3af' }]}>{village || 'Select your village'}</Text>
                    <Ionicons name="chevron-down-outline" size={16} color="#888" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[webStyles.submitBtnWrap, !village && styles.submitBtnDisabled]} onPress={handleComplete} disabled={!village}>
                  <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={webStyles.submitBtn}>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Complete Setup</Text>
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Village <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="home-outline" size={16} color="#888" />
                    <TextInput style={styles.input} placeholder="Enter your village" placeholderTextColor="#9ca3af" value={village} onChangeText={setVillage} />
                  </View>
                </View>

                <TouchableOpacity style={[webStyles.submitBtnWrap, !village.trim() && styles.submitBtnDisabled]} onPress={handleComplete} disabled={!village.trim()}>
                  <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={webStyles.submitBtn}>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Complete Setup</Text>
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={webStyles.skipBtn} onPress={handleSkip} activeOpacity={0.75}>
              <Text style={webStyles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {villageList.length > 0 && (
        <DropdownModal visible={villageModal} title="Select Village" items={villageList} selected={village} onSelect={setVillage} onClose={() => setVillageModal(false)} />
      )}
    </View>
  );
}