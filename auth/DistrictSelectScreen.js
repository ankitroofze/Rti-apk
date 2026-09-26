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
import { getDistricts } from '../pages/locationData';
import styles from '../styles/RegisterStyles';

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = items.filter((i) =>
    i.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Search district..."
            placeholderTextColor="#b0a898"
            autoCorrect={false}
            autoCapitalize="none"
            selectionColor="#e8732a"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
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
              {selected === item && (
                <Ionicons name="checkmark-circle" size={18} color="#e8732a" />
              )}
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

export default function DistrictSelectScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { selectedState, fromPremium, needsCreateUser } = route.params || {};
  const preselectedDistrict = route?.params?.preselectedDistrict;

  const [district, setDistrict] = useState(preselectedDistrict ? String(preselectedDistrict) : '');
  const [districtModal, setDistrictModal] = useState(false);
  const [districtTouched, setDistrictTouched] = useState(false);
  const allowLeaveRef = useRef(false);

  useEffect(() => {
    if (!preselectedDistrict) return;
    setDistrict(String(preselectedDistrict));
  }, [preselectedDistrict]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current) return;
      const targetRoute = e.data.action.payload?.name;
      if (targetRoute === 'TalukaSelect') return;
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation]);

  const districtList = selectedState ? getDistricts(selectedState) : [];

  const handleNext = async () => {
    if (!district.trim()) {
      setDistrictTouched(true);
      return;
    }
    navigation.replace('TalukaSelect', {
      selectedState,
      selectedDistrict: district.trim(),
      fromPremium,
      needsCreateUser,
    });
  };

  const handleClose = () => {
    allowLeaveRef.current = true;
    navigation.replace('StateSelect', {
      fromPremium,
      needsCreateUser,
      preselectedState: selectedState,
      autoOpen: true,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={[]}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

            {/* Header — label + title + state info, no logo/icon */}
            <View style={styles.headerBlock}>
              <Text style={styles.welcomeBack}>Setup Location</Text>
              <Text style={styles.formTitle}>Select Your District</Text>
              {selectedState ? (
                <Text style={localStyles.locationInfo}>{selectedState}</Text>
              ) : null}
            </View>

            {/* District Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                District <Text style={styles.required}>*</Text>
              </Text>

              {districtList.length > 0 ? (
                <TouchableOpacity
                  style={[
                    styles.inputWrap,
                    districtTouched && !district.trim() && styles.inputWrapError,
                  ]}
                  onPress={() => setDistrictModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="business-outline" size={16} color="#a09890" />
                  <Text style={[styles.input, !district && { color: '#b0a898' }]}>
                    {district || 'Select your district'}
                  </Text>
                  <Ionicons name="chevron-down-outline" size={16} color="#a09890" />
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.inputWrap,
                    districtTouched && !district.trim() && styles.inputWrapError,
                  ]}
                >
                  <Ionicons name="business-outline" size={16} color="#a09890" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your district"
                    placeholderTextColor="#b0a898"
                    value={district}
                    onChangeText={(t) => {
                      setDistrict(t);
                      if (!districtTouched) setDistrictTouched(true);
                    }}
                    onBlur={() => setDistrictTouched(true)}
                  />
                </View>
              )}

              {districtTouched && !district.trim() ? (
                <Text style={styles.errorText}>Please select or enter your district</Text>
              ) : null}
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.submitBtn, !district.trim() && styles.submitBtnDisabled]}
              onPress={handleNext}
              disabled={!district.trim()}
            >
              <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginButtonGradient}>
                <Text style={styles.submitBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#B91C1C" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {districtList.length > 0 && (
          <DropdownModal
            visible={districtModal}
            title="Select District"
            items={districtList}
            selected={district}
            onSelect={(next) => {
              setDistrict(next);
              setDistrictTouched(true);
            }}
            onClose={() => setDistrictModal(false)}
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
});
