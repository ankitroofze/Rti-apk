import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { getDistricts } from '../pages/locationData';
import styles from '../styles/RegisterStyles';
import webStyles from '../styles/LocationWebStyles';
import BackTitleRow from '../components/BackTitleRow';

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = (items || []).filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={dropStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%', alignItems: 'center' }} onPress={() => {}}>
          <View style={dropStyles.sheet}>
            <View style={dropStyles.handle} />
            <Text style={dropStyles.title}>{title}</Text>
            <View style={dropStyles.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#B91C1C" />
              <TextInput style={dropStyles.searchInput} value={search} onChangeText={setSearch} placeholder="Search district..." placeholderTextColor="#9ca3af" autoCorrect={false} autoCapitalize="none" />
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