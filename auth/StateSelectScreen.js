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
  StyleSheet,
  Keyboard,          // ✅ ADD THIS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../components/ui/ToastProvider';
import { INDIAN_STATES } from '../pages/locationData';
import styles from '../styles/RegisterStyles';

function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0); // ✅ ADD THIS

  // ✅ ADD THIS: manually track keyboard height, Modal is a separate
  // native layer so the outer screen's KeyboardAvoidingView doesn't
  // reach inside it — some OEMs (Xiaomi/Vivo/Oppo) don't auto-resize
  // Modals the way stock Android does.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filtered = (items || []).filter((i) =>
    String(i || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={dropStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={{ width: '100%', alignItems: 'center', flex: 1 }} onPress={() => {}}>
          <View
            style={[
              dropStyles.sheet,
              // ✅ ADD THIS: push the sheet up by keyboard height on mobile
              Platform.OS !== 'web' && { marginBottom: keyboardHeight },
            ]}
          >
            <View style={dropStyles.handle} />

            <Text style={dropStyles.title}>{title}</Text>

            <View style={dropStyles.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#e8732a" />
              <TextInput
                style={dropStyles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search state..."
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
              // ✅ CHANGE THIS: shrink list height when keyboard is open
              // so results stay visible above the keyboard instead of
              // being pushed under it
              style={{
                maxHeight: keyboardHeight > 0 ? 220 : 320,
              }}
              keyboardShouldPersistTaps="handled" // ✅ ADD THIS
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#a09890', paddingVertical: 20 }}>
                  No states found
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dropStyles.item,
                    selected === item && dropStyles.itemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                    setSearch('');
                  }}
                >
                  <Text
                    style={[
                      dropStyles.itemText,
                      selected === item && dropStyles.itemTextSelected,
                    ]}
                  >
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
          bottom: 0,
          left: 0,
          right: 0,
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

export default function StateSelectScreen({ navigation, route }) {
  const { showPopup } = useToast();

  const [state, setState] = useState('');
  const [stateModal, setStateModal] = useState(false);

  const fromPremium = route?.params?.fromPremium;
  const needsCreateUser = route?.params?.needsCreateUser;
  const autoOpen = route?.params?.autoOpen;
  const preselectedState = route?.params?.preselectedState;

  const allowLeaveRef = useRef(false);

  useEffect(() => {
    if (!preselectedState) return;
    setState(String(preselectedState));
  }, [preselectedState]);

  useEffect(() => {
    if (autoOpen) {
      setStateModal(true);
    }
  }, [autoOpen]);

  // ⚠️ TEMPORARILY DISABLED FOR DEBUGGING — is listener ko dobara enable karna
  // hai jab dropdown issue fix ho jaaye. Ye Android back-button / modal close
  // gestures ke saath conflict kar sakta hai kuch navigation versions mein.
  //
  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('beforeRemove', (e) => {
  //     if (allowLeaveRef.current) return;
  //     const targetRoute = e.data.action.payload?.name;
  //     if (targetRoute === 'DistrictSelect') return;
  //     e.preventDefault();
  //   });
  //   return unsubscribe;
  // }, [navigation]);

  const handleClose = () => {
    allowLeaveRef.current = true;
    navigation.goBack();
  };

  const handleNext = async () => {
    if (!state) {
      showPopup('Please select your state to continue.', 'error');
      return;
    }
    try {
      navigation.replace('DistrictSelect', {
        selectedState: state,
        fromPremium,
        needsCreateUser,
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleStateSelect = (selectedState) => {
    setState(selectedState);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
        <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

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
                <Ionicons name="arrow-back-outline" size={18} color="#8a8078" />
                <Text style={{ color: '#8a8078', fontWeight: '800', fontSize: 13 }}>
                  Back
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.topAccent} />

            {/* Header — only label + title, no logo/icon/subtitle */}
            <View style={styles.headerBlock}>
              <Text style={styles.welcomeBack}>Setup Location</Text>
              <Text style={styles.formTitle}>Select Your State</Text>
            </View>

            {/* State Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                State <Text style={styles.required}>*</Text>
              </Text>

              <TouchableOpacity
                style={styles.inputWrap}
                onPress={() => setStateModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="location-outline" size={16} color="#a09890" />

                <Text
                  style={[
                    styles.input,
                    !state && { color: '#b0a898' },
                  ]}
                >
                  {state || 'Select your state'}
                </Text>

                <Ionicons name="chevron-down-outline" size={16} color="#a09890" />
              </TouchableOpacity>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.submitBtn, !state && styles.submitBtnDisabled]}
              onPress={handleNext}
              disabled={!state}
            >
              <Text style={styles.submitBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <DropdownModal
          visible={stateModal}
          title="Select State"
          items={INDIAN_STATES}
          selected={state}
          onSelect={handleStateSelect}
          onClose={() => setStateModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}