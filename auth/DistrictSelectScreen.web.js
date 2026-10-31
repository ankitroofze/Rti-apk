import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { getDistricts } from '../pages/locationData';
import styles from '../styles/RegisterStyles';
import webStyles from '../styles/LocationWebStyles';
import BackTitleRow from '../components/BackTitleRow';
import LocationDropdownModal from '../components/LocationDropdownModal';

function DropdownModal(props) {
  return <LocationDropdownModal placeholder="Search district..." emptyText="No district found" {...props} />;
}

export default function DistrictSelectScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
  const { selectedState, fromPremium, needsCreateUser } = route.params || {};
  const preselectedDistrict = route?.params?.preselectedDistrict;

  const [district, setDistrict] = useState(preselectedDistrict ? String(preselectedDistrict) : '');
  const [districtModal, setDistrictModal] = useState(false);
  const [districtTouched, setDistrictTouched] = useState(false);
  const allowLeaveRef = useRef(false);

  useEffect(() => { if (preselectedDistrict) setDistrict(String(preselectedDistrict)); }, [preselectedDistrict]);

  const districtList = selectedState ? getDistricts(selectedState) : [];

  const handleNext = async () => {
    if (!district.trim()) { setDistrictTouched(true); return; }
    navigation.replace('TalukaSelect', { selectedState, selectedDistrict: district.trim(), fromPremium, needsCreateUser });
  };

  const handleClose = () => {
    allowLeaveRef.current = true;
    navigation.replace('StateSelect', { fromPremium, needsCreateUser, preselectedState: selectedState, autoOpen: true });
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
              <Text style={[styles.formTitle, webStyles.formTitle]}>Select Your District</Text>
            </BackTitleRow>
            {selectedState ? <Text style={webStyles.locationInfo}>{selectedState}</Text> : null}

            <View style={[styles.inputGroup, { marginTop: 20 }]}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>District <Text style={styles.required}>*</Text></Text>

              {districtList.length > 0 ? (
                <TouchableOpacity style={[styles.inputWrap, districtTouched && !district.trim() && styles.inputWrapError]} onPress={() => setDistrictModal(true)} activeOpacity={0.8}>
                  <Ionicons name="business-outline" size={16} color="#888" />
                  <Text style={[styles.input, !district && { color: '#9ca3af' }]}>{district || 'Select your district'}</Text>
                  <Ionicons name="chevron-down-outline" size={16} color="#888" />
                </TouchableOpacity>
              ) : (
                <View style={[styles.inputWrap, districtTouched && !district.trim() && styles.inputWrapError]}>
                  <Ionicons name="business-outline" size={16} color="#888" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your district"
                    placeholderTextColor="#9ca3af"
                    value={district}
                    onChangeText={(t) => { setDistrict(t); if (!districtTouched) setDistrictTouched(true); }}
                    onBlur={() => setDistrictTouched(true)}
                  />
                </View>
              )}
              {districtTouched && !district.trim() ? <Text style={styles.errorText}>Please select or enter your district</Text> : null}
            </View>

            <TouchableOpacity style={[webStyles.submitBtnWrap, !district.trim() && styles.submitBtnDisabled]} onPress={handleNext} disabled={!district.trim()}>
              <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={webStyles.submitBtn}>
                <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {districtList.length > 0 && (
        <DropdownModal visible={districtModal} title="Select District" items={districtList} selected={district} onSelect={(next) => { setDistrict(next); setDistrictTouched(true); }} onClose={() => setDistrictModal(false)} />
      )}
    </View>
  );
}