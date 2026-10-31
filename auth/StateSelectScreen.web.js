import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { useToast } from '../components/ui/ToastProvider';
import { INDIAN_STATES } from '../pages/locationData';
import styles from '../styles/RegisterStyles';
import webStyles from '../styles/LocationWebStyles';
import BackTitleRow from '../components/BackTitleRow';
import LocationDropdownModal from '../components/LocationDropdownModal';

// Web-only rendition: illustration left, white form right — matches
// LoginScreen.web.js / RegisterScreen.web.js. Android/iOS keep using
// StateSelectScreen.js, completely unchanged.

function DropdownModal(props) {
  return <LocationDropdownModal placeholder="Search state..." emptyText="No state found" {...props} />;
}

export default function StateSelectScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
  const { showPopup } = useToast();

  const [state, setState] = useState('');
  const [stateModal, setStateModal] = useState(false);

  const fromPremium = route?.params?.fromPremium;
  const needsCreateUser = route?.params?.needsCreateUser;
  const autoOpen = route?.params?.autoOpen;
  const preselectedState = route?.params?.preselectedState;
  const allowLeaveRef = useRef(false);

  useEffect(() => { if (preselectedState) setState(String(preselectedState)); }, [preselectedState]);
  useEffect(() => { if (autoOpen) setStateModal(true); }, [autoOpen]);

  const handleClose = () => { allowLeaveRef.current = true; navigation.goBack(); };

  const handleNext = async () => {
    if (!state) { showPopup('Please select your state to continue.', 'error'); return; }
    try { navigation.replace('DistrictSelect', { selectedState: state, fromPremium, needsCreateUser }); }
    catch (error) { console.error('Navigation error:', error); }
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
              <Text style={[styles.formTitle, webStyles.formTitle]}>Select Your State</Text>
            </BackTitleRow>

            <View style={[styles.inputGroup, { marginTop: 20 }]}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>State <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.inputWrap} onPress={() => setStateModal(true)} activeOpacity={0.8}>
                <Ionicons name="location-outline" size={16} color="#888" />
                <Text style={[styles.input, !state && { color: '#9ca3af' }]}>{state || 'Select your state'}</Text>
                <Ionicons name="chevron-down-outline" size={16} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[webStyles.submitBtnWrap, !state && styles.submitBtnDisabled]} onPress={handleNext} disabled={!state}>
              <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={webStyles.submitBtn}>
                <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <DropdownModal visible={stateModal} title="Select State" items={INDIAN_STATES} selected={state} onSelect={setState} onClose={() => setStateModal(false)} />
    </View>
  );
}