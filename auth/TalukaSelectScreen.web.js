import { AuthAPI } from './ClientAPI/AuthApi';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { UserStore } from '../store/UserStore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/ToastProvider';
import { getTalukas } from '../pages/locationData';
import styles from '../styles/RegisterStyles';
import webStyles from '../styles/LocationWebStyles';

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={dropStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%', alignItems: 'center' }} onPress={() => {}}>
          <View style={dropStyles.sheet}>
            <View style={dropStyles.handle} />
            <Text style={dropStyles.title}>{title}</Text>
            <View style={dropStyles.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#B91C1C" />
              <TextInput style={dropStyles.searchInput} value={search} onChangeText={setSearch} placeholder="Search taluka..." placeholderTextColor="#9ca3af" autoCorrect={false} autoCapitalize="none" />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={[dropStyles.item, selected === item && dropStyles.itemSelected]} onPress={() => { onSelect(item); onClose(); setSearch(''); }}>
                  <Text style={[dropStyles.itemText, selected === item && dropStyles.itemTextSelected]}>{item}</Text>
                  {selected === item && <Ionicons name="checkmark-circle" size={18} color="#B91C1C" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const dropStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '80%', borderRadius: 20, backgroundColor: '#ffffff', padding: 20, paddingBottom: 24 },
  handle: { width: 40, height: 4, backgroundColor: '#EEEEEE', borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#111111', marginBottom: 12, textAlign: 'center', fontFamily: "'Roboto', sans-serif" },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#EEEEEE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111111', paddingVertical: 0, outlineStyle: 'none', fontFamily: "'Roboto', sans-serif" },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, marginBottom: 3 },
  itemSelected: { backgroundColor: 'rgba(185,28,28,0.08)' },
  itemText: { fontSize: 14, color: '#111111', fontWeight: '500', fontFamily: "'Roboto', sans-serif" },
  itemTextSelected: { color: '#B91C1C', fontWeight: '700' },
});

export default function TalukaSelectScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
  const { login } = useAuth();
  const { showPopup } = useToast();
    const { selectedState, selectedDistrict, fromPremium, needsCreateUser, needsLogin } = route.params || {};

  const [taluka, setTaluka] = useState('');
  const [talukaModal, setTalukaModal] = useState(false);
  const allowLeaveRef = useRef(false);
  const registrationJustCompleted = !fromPremium;

  const handleClose = () => {
    allowLeaveRef.current = true;
    navigation.replace('DistrictSelect', { selectedState, fromPremium, needsCreateUser, preselectedDistrict: selectedDistrict });
  };

  const talukaList = selectedDistrict ? getTalukas(selectedState, selectedDistrict) : [];

   const goToHome = (userName) => {
    navigation.replace('Home', { fromRegistration: true, registrationJustCompleted, userName: userName || 'User' });
  };

  const goToVillageSelect = (talukaValue) => {
    navigation.replace('VillageSelect', {
      selectedState,
      selectedDistrict,
      selectedTaluka: talukaValue,
      fromPremium,
      needsCreateUser: false,
      needsLogin: !!needsCreateUser || !!needsLogin, // login() Village ke end me hoga
    });
  };

  // Registration (verified email OTP ke saath) Register screen par hi server par ho chuki hoti hai.
  // Yahan sirf location server par update hoti hai.
  const syncRegistrationLocation = async (talukaValue = '') => {
    try {
      const stateResult = await AuthAPI.updateState({
        state: selectedState,
        district: selectedDistrict,
        taluka: talukaValue,
      });
      if (!stateResult.ok) console.warn('[TalukaSelect] State API failed:', stateResult.message);
    } catch (error) {
      console.warn('[TalukaSelect] API sync failed:', error);
    }
  };


  const handleComplete = async () => {
    if (!taluka.trim()) { showPopup('Please select or enter your taluka', 'error'); return; }
    const talukaValue = taluka.trim();

    if (needsCreateUser) {
      const pending = await UserStore.getPendingRegistration();
      if (!pending?.email) { showPopup('Registration data not found. Please register again.', 'error'); navigation.replace('Register'); return; }

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: selectedState,
        district: selectedDistrict, taluka: talukaValue,
        profile_image: pending.profile_image || '', bio: pending.bio || '',
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
      // ✅ login() yahan nahi — Village screen ke end me hoga, warna VillageSelect navigation fail hota hai
      await UserStore.completeLocationSetup(pending.email, selectedState, selectedDistrict, talukaValue);
      await UserStore.clearPendingRegistration();
        syncRegistrationLocation(talukaValue);
      goToVillageSelect(talukaValue);
      return;
    }

    const user = await UserStore.getCurrentUser();
    if (!user) { navigation.replace('Login'); return; }

    const result = await UserStore.completeLocationSetup(user.email, selectedState, selectedDistrict, talukaValue);
    if (!result) { showPopup('Failed to save location. Please try again.', 'error'); return; }
    AuthAPI.updateState({ state: selectedState, district: selectedDistrict, taluka: talukaValue }).catch(() => {});
    goToVillageSelect(talukaValue);
  };

  const handleSkip = async () => {
    if (needsCreateUser) {
      const pending = await UserStore.getPendingRegistration();
      if (!pending?.email) { showPopup('Registration data not found. Please register again.', 'error'); navigation.replace('Register'); return; }

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: selectedState,
        district: selectedDistrict, taluka: '',
        profile_image: pending.profile_image || '', bio: pending.bio || '',
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
      login();
      await UserStore.completeLocationSetup(pending.email, selectedState, selectedDistrict, '');
      await UserStore.clearPendingRegistration();
      syncRegistrationLocation('');
      goToHome(pending.name);
      return;
    }

    const user = await UserStore.getCurrentUser();
    if (!user) { navigation.replace('Login'); return; }
    await UserStore.completeLocationSetup(user.email, selectedState, selectedDistrict, '');
    if (needsLogin) login();
    goToHome(user.name);
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
            {!showImagePanel && (
              <View style={webStyles.compactBrandRow}>
                <Ionicons name="location" size={20} color="#B91C1C" />
                <Text style={webStyles.compactBrandText}>RTI News</Text>
              </View>
            )}

            <TouchableOpacity style={webStyles.backRow} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={18} color="#111111" />
              <Text style={webStyles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={[styles.welcomeBack, webStyles.welcomeBack]}>Setup Location</Text>
            <Text style={[styles.formTitle, webStyles.formTitle]}>Select Your Taluka</Text>
            {(selectedState || selectedDistrict) && (
              <Text style={webStyles.locationInfo}>{[selectedState, selectedDistrict].filter(Boolean).join(' › ')}</Text>
            )}

            {talukaList.length > 0 ? (
              <>
                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Taluka <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={styles.inputWrap} onPress={() => setTalukaModal(true)} activeOpacity={0.8}>
                    <Ionicons name="map-outline" size={16} color="#888" />
                    <Text style={[styles.input, !taluka && { color: '#9ca3af' }]}>{taluka || 'Select your taluka'}</Text>
                    <Ionicons name="chevron-down-outline" size={16} color="#888" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[webStyles.submitBtnWrap, !taluka && styles.submitBtnDisabled]} onPress={handleComplete} disabled={!taluka}>
                  <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={webStyles.submitBtn}>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Complete Setup</Text>
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Taluka <Text style={styles.required}>*</Text></Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="map-outline" size={16} color="#888" />
                    <TextInput style={styles.input} placeholder="Enter your taluka" placeholderTextColor="#9ca3af" value={taluka} onChangeText={setTaluka} />
                  </View>
                </View>

                <TouchableOpacity style={[webStyles.submitBtnWrap, !taluka.trim() && styles.submitBtnDisabled]} onPress={handleComplete} disabled={!taluka.trim()}>
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

      {talukaList.length > 0 && (
        <DropdownModal visible={talukaModal} title="Select Taluka" items={talukaList} selected={taluka} onSelect={setTaluka} onClose={() => setTalukaModal(false)} />
      )}
    </View>
  );
}