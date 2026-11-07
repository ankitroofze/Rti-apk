import { Ionicons } from '@expo/vector-icons';
import { readReferralCodeFromUrl } from '../utils/Referralservice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { AuthAPI } from './ClientAPI/AuthApi';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import OtpModal from '../components/Otpmodal';
import { UserStore } from '../store/UserStore';
import { useAuth } from '../contexts/AuthContext';
import { compressImageToBase64 } from '../utils/imageHandling';
import { MAX_IMAGE_SIZE, DEFAULT_AVATAR } from '../constants/profileConstants';
import { INDIAN_STATES, getDistricts, getTalukas, getVillages, getLocationIds } from '../pages/locationData';
import styles, { toastStyles, dropStyles, localStyles } from '../styles/RegisterStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function isValidEmailAddress(value) {
  const emailValue = String(value || '').trim().toLowerCase();
  if (!emailValue) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(emailValue);
}

function isValidMobileNumber(value) {
  return /^[6-9]\d{9}$/.test(String(value || '').trim());
}

function getPasswordChecks(value) {
  const v = String(value || '');
  return {
    length: v.length >= 8,
    lower: /[a-z]/.test(v),
    upper: /[A-Z]/.test(v),
    number: /\d/.test(v),
    special: /[^A-Za-z0-9]/.test(v),
    noSpace: !/\s/.test(v),
  };
}

// (ye style ab component ke andar useEffect se lagega, taaki page chhodte
// hi html/body ka overflow:hidden reset ho jaye — neeche RegisterScreen
// function ke start me effect add karna)
// ─────────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────────
function Toast({ toast, opacity, translateY }) {
  if (!toast) return null;
  const config = {
    success: { bg: '#f0fdf4', border: '#16a34a', icon: 'checkmark-circle', iconColor: '#16a34a', textColor: '#166534', label: 'Success' },
    error: { bg: '#fef2f2', border: '#dc2626', icon: 'close-circle', iconColor: '#dc2626', textColor: '#991b1b', label: 'Oops!' },
    info: { bg: '#eff6ff', border: '#3b82f6', icon: 'information-circle', iconColor: '#3b82f6', textColor: '#1e40af', label: 'Info' },
  };
  const c = config[toast.type] || config.error;
  return (
    <Animated.View style={[toastStyles.toast, { backgroundColor: c.bg, borderColor: c.border, opacity, transform: [{ translateY }] }]}>
      <Ionicons name={c.icon} size={22} color={c.iconColor} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={[toastStyles.label, { color: c.iconColor }]}>{c.label.toUpperCase()}</Text>
        <Text style={[toastStyles.message, { color: c.textColor }]}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Dropdown Modal
// ─────────────────────────────────────────────────────────────
export function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dropStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={dropStyles.sheet}>
        <View style={dropStyles.handle} />
        <Text style={dropStyles.title}>{title}</Text>
        <View style={dropStyles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#e8732a" />
          <TextInput
            style={dropStyles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#AAAAAA"
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
              <Text style={[dropStyles.itemText, selected === item && dropStyles.itemTextSelected]}>
                {item}
              </Text>
              {selected === item && <Ionicons name="checkmark-circle" size={18} color="#e8732a" />}
            </TouchableOpacity>
          )}
          style={{ maxHeight: 320 }}
        />
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Step Indicator Component
// ─────────────────────────────────────────────────────────────
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <View style={localStyles.stepIndicatorContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View key={index} style={localStyles.stepIndicatorWrapper}>
          <View style={[
            localStyles.stepDot,
            index < currentStep && localStyles.stepDotFilled,
            index === currentStep && localStyles.stepDotActive
          ]}>
            {index < currentStep && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
          {index < totalSteps - 1 && (
            <View style={[
              localStyles.stepLine,
              index < currentStep && localStyles.stepLineFilled
            ]} />
          )}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Register Screen
// ─────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { login } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `html, body, #root { height: 100%; margin: 0; padding: 0; background-color: #F0F0F5; overflow: hidden; }`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
    const [referralCode, setReferralCode] = useState('');
  // Referral link (?ref=CODE) se aaya to code prefill karo — sirf padhna, banana nahi
  useEffect(() => { readReferralCodeFromUrl().then((c) => { if (c) setReferralCode((prev) => prev || c); }); }, []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');

  // ✅ Location steps se back karke is screen par aane par pending (unsaved) registration hata do —
  // jab tak taluka/village poora na ho, kuch bhi save nahi rehna chahiye. Form ke fields screen par bane rehte hain.
  useFocusEffect(
    useCallback(() => {
      UserStore.clearPendingRegistration();
      if (route?.params?.otpExpired) {
        setEmailVerified(false); setVerifiedEmail(''); setVerifiedOtp('');
        try { navigation.setParams({ otpExpired: undefined }); } catch (_) { /* ignore */ }
      }
    }, [route?.params?.otpExpired]) // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [otpSending, setOtpSending] = useState(false);

  // ✅ Location (cascading): State -> District -> Taluka -> Village
  const [locState, setLocState] = useState('');
  const [locDistrict, setLocDistrict] = useState('');
  const [locTaluka, setLocTaluka] = useState('');
  const [locVillage, setLocVillage] = useState('');
  const [locPicker, setLocPicker] = useState(null); // 'state' | 'district' | 'taluka' | 'village' | null
  // Backend validation errors: { field: 'message' } — response.errors[field] se aate hain
  const [fieldErrors, setFieldErrors] = useState({});
  const setFieldError = (field, msg) => setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  const clearFieldError = (...fields) => setFieldErrors((prev) => {
    if (!fields.some((f) => prev[f])) return prev;
    const next = { ...prev }; fields.forEach((f) => { delete next[f]; }); return next;
  });
  const districtOptions = useMemo(() => (locState ? getDistricts(locState) : []), [locState]);
  const talukaOptions = useMemo(() => (locState && locDistrict ? getTalukas(locState, locDistrict) : []), [locState, locDistrict]);
  const villageOptions = useMemo(() => (locState && locDistrict && locTaluka ? getVillages(locState, locDistrict, locTaluka) : []), [locState, locDistrict, locTaluka]);
  const locationComplete = Boolean(locState && locDistrict && locTaluka && locVillage);
  const [submitting, setSubmitting] = useState(false);

  const [profileImage, setProfileImage] = useState('');
  const [imagePicking, setImagePicking] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef(null);

  const normalizedEmail = useMemo(() => String(email || '').trim().toLowerCase(), [email]);
  const emailOk = useMemo(() => isValidEmailAddress(normalizedEmail), [normalizedEmail]);
  const mobileOk = useMemo(() => isValidMobileNumber(mobile), [mobile]);
  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrong = useMemo(
    () => passwordChecks.length && passwordChecks.lower && passwordChecks.upper &&
    passwordChecks.number && passwordChecks.special && passwordChecks.noSpace,
    [passwordChecks]
  );
  const fullName = useMemo(() =>
    [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' '),
    [firstName, middleName, lastName]
  );

  const isStep1Valid = useMemo(() => {
    return Boolean(firstName.trim()) && Boolean(lastName.trim());
  }, [firstName, lastName]);

  const isStep2Valid = useMemo(() => {
    return mobileOk && emailVerified && emailOk && passwordStrong &&
      password && confirm && password === confirm && termsAccepted && locationComplete;
  }, [mobileOk, emailVerified, emailOk, passwordStrong, password, confirm, termsAccepted, locationComplete]);

  // Email badalte hi purani verification khatam (verified OTP sirf usi email ke liye tha)
  const handleEmailChange = (text) => {
    setEmail(text);
    clearFieldError('email', 'otp');
    if (emailVerified && text.trim().toLowerCase() !== verifiedEmail) {
      setEmailVerified(false); setVerifiedEmail(''); setVerifiedOtp('');
    }
  };

  // Parent badalne par neeche ke saare levels reset (cascade)
  const handleSelectLocation = (level, value) => {
    if (level === 'state') { setLocState(value); setLocDistrict(''); setLocTaluka(''); setLocVillage(''); clearFieldError('state', 'district', 'taluka', 'village'); }
    if (level === 'district') { setLocDistrict(value); setLocTaluka(''); setLocVillage(''); clearFieldError('district', 'taluka', 'village'); }
    if (level === 'taluka') { setLocTaluka(value); setLocVillage(''); clearFieldError('taluka', 'village'); }
    if (level === 'village') { setLocVillage(value); clearFieldError('village'); }
  };

  const pickerConfig = {
    state: { title: 'Select State', items: INDIAN_STATES, selected: locState },
    district: { title: 'Select District', items: districtOptions, selected: locDistrict },
    taluka: { title: 'Select Taluka', items: talukaOptions, selected: locTaluka },
    village: { title: 'Select Village', items: villageOptions, selected: locVillage },
  };

  // Backend ke errors ko form fields par map karo (firstname/phone ka error bhi dikhega)
  const applyBackendErrors = (errors = {}, otpError = false) => {
    const mapped = {};
    Object.keys(errors || {}).forEach((key) => {
      const val = errors[key];
      mapped[key] = Array.isArray(val) ? String(val[0] || '') : String(val || '');
    });
    if (otpError && !mapped.otp) mapped.otp = 'OTP expired or invalid. Please verify your email again.';
    setFieldErrors(mapped);
    return mapped;
  };

  const handleNextStep = () => {
    if (!isStep1Valid) {
      showToast('Please enter your first and last name.', 'error');
      return;
    }
    setFormStep(2);
  };

  const showToast = (message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start(() => setToast(null));
    }, 3000);
  };

  const handlePickProfileImage = async () => {
    try {
      setImagePicking(true);
      if (ImagePicker.requestMediaLibraryPermissionsAsync) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { showToast('Gallery permission is required.', 'error'); setImagePicking(false); return; }
      }
      const mediaType = ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType || 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
          showToast('Image is too large (max 5MB).', 'error');
          setImagePicking(false);
          return;
        }
        const uri = asset.uri || '';
        if (typeof document !== 'undefined' && uri) {
          try { setProfileImage(await compressImageToBase64(uri)); }
          catch { setProfileImage(uri); }
        } else {
          setProfileImage(uri);
        }
      }
    } catch {
      showToast('Unable to pick image.', 'error');
    } finally {
      setImagePicking(false);
    }
  };

  const handleSendOTP = async () => {
    if (otpSending) return;
    if (!emailOk) { setEmailTouched(true); showToast('Please enter a valid email address.', 'error'); return; }
    setOtpSending(true);
    try {
      const result = await AuthAPI.requestRegisterOTP({ email: normalizedEmail });
      if (!result.ok) { showToast(result.message || 'Could not send OTP. Please try again.', 'error'); return; }
      setOtpModalVisible(true);
    } finally {
      setOtpSending(false);
    }
  };

  // OtpModal (purpose="register") verify ho jaane par yahan aata hai
  const handleOtpVerified = (otp) => {
    setEmailVerified(true);
    setVerifiedEmail(normalizedEmail);
    setVerifiedOtp(otp);
    setOtpModalVisible(false);
    showToast('Email verified successfully! ✅', 'success');
  };

  const handleRegister = async () => {
    if (submitting) return;
    if (!isStep1Valid) { showToast('Please enter your first and last name', 'error'); return; }
    if (!mobileOk) { setMobileTouched(true); showToast('Please enter a valid 10-digit mobile number', 'error'); return; }
    if (!normalizedEmail) { setEmailTouched(true); showToast('Please enter your email address', 'error'); return; }
    if (!emailOk) { setEmailTouched(true); showToast('Please enter a valid email address', 'error'); return; }
    if (!emailVerified || verifiedEmail !== normalizedEmail || !verifiedOtp) { showToast('Please verify your email first', 'error'); return; }
    if (!passwordStrong) { setPasswordTouched(true); showToast('Please enter a strong password', 'error'); return; }
    if (password !== confirm) { showToast('Passwords do not match', 'error'); return; }
    if (!termsAccepted) { setTermsTouched(true); showToast('Please accept the Terms & Conditions', 'error'); return; }

    if (!locationComplete) {
      setFieldErrors((prev) => ({
        ...prev,
        ...(!locState ? { state: 'State is required.' } : {}),
        ...(!locDistrict ? { district: 'District is required.' } : {}),
        ...(!locTaluka ? { taluka: 'Taluka is required.' } : {}),
        ...(!locVillage ? { village: 'Village is required.' } : {}),
      }));
      showToast('Please select State, District, Taluka and Village', 'error');
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const ids = getLocationIds({ state: locState, district: locDistrict, taluka: locTaluka, village: locVillage });
      const ok = await UserStore.setPendingRegistration({
        name: fullName,
        mobile: mobile.trim(),
        email: normalizedEmail,
        referral_code_used: referralCode.trim() || null,
        password,
        profile_image: profileImage || '',
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        referral_code: referralCode.trim(),
        otp: verifiedOtp,
        state: locState, district: locDistrict, taluka: locTaluka, village: locVillage,
        ...ids,
      });
      if (!ok) {
        showToast('Unable to continue registration. Please try again.', 'error');
        return;
      }

      // ✅ Ab register API yahin chalegi (names + available IDs ke saath)
      const commit = await UserStore.commitPendingRegistration();
      if (!commit.ok) {
        const mapped = applyBackendErrors(commit.errors, commit.otpError);
        if (commit.otpError) { setEmailVerified(false); setVerifiedEmail(''); setVerifiedOtp(''); }
        if (!Object.keys(mapped).length) showToast(commit.message || 'Registration failed. Please try again.', 'error');
        else if (mapped.firstname || mapped.lastname || mapped.phone) setFormStep(1);
        return;
      }
      const pending = commit.pending;

      const created = await UserStore.saveUser({
        name: pending.name, mobile: pending.mobile, email: pending.email,
        referral_code_used: pending.referral_code_used || null,
        password: pending.password, state: locState,
        district: locDistrict, taluka: locTaluka, village: locVillage,
        profile_image: pending.profile_image || '',
        bio: pending.bio || '',
      });
      if (created && !created.ok) {
        // Account server par ban chuka hai — sirf local copy save nahi hui. Login par profile sync ho jaati hai.
        await UserStore.clearPendingRegistration();
        showToast('Your account has been created. Please sign in to continue.', 'success');
        navigation.replace('Login');
        return;
      }

      await UserStore.setCurrentUser(pending.email);
      try {
        await UserStore.completeLocationSetup(pending.email, locState, locDistrict, locTaluka, locVillage, commit.token);
        await UserStore.clearPendingRegistration();
      } catch (e) { console.warn('[register] local setup failed:', e?.message || e); }

      // ✅ Backend /state API ko registration ke token ke saath link & sync karo
      try {
        await AuthAPI.updateState({
          state: locState,
          district: locDistrict,
          taluka: locTaluka,
          village: locVillage,
          ...ids,
        }, commit.token);
      } catch (e) {
        console.warn('[register] updateState failed:', e?.message || e);
      }

      // Register complete -> Home (stack reset), login() sabse last me
      try {
        navigation.reset({ index: 0, routes: [{ name: 'Home', params: { fromRegistration: true, registrationJustCompleted: true, userName: pending.name || 'User' } }] });
      } catch (_) {
        try { navigation.replace('Home', { fromRegistration: true, registrationJustCompleted: true, userName: pending.name || 'User' }); } catch (__) { /* ignore */ }
      }
      setTimeout(() => { try { login(); } catch (_) { /* ignore */ } }, 350);
    } catch {
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => navigation.navigate('Home');
  const mobileShowError = mobileTouched && mobile.length > 0 && !mobileOk;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#B91C1C' }} edges={[]}>
      <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'}
        >
          <KeyboardAwareScroll
            style={styles.scrollView}
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.formContainer}>

              {/* ── Close Button ── */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={22} color="#ffffff" />
              </TouchableOpacity>

              {/* ── Header ── */}
              <View style={styles.headerBlock}>
                <Text style={styles.welcomeBack}>Create your account</Text>
                <Text style={styles.formTitle}>Register</Text>
              </View>

              {/* ── Step Indicator ── */}
              <StepIndicator currentStep={formStep - 1} totalSteps={2} />

             

              {/* ── STEP 1: Personal Info ── */}
              {formStep === 1 ? (
                <>
                  {/* First Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>First Name <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.inputWrap, !firstName.trim() && firstName.length > 0 && styles.inputWrapError]}>
                      <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                      <TextInput onSubmitEditing={handleNextStep}
                        style={styles.input}
                        placeholder="Enter your first name"
                        placeholderTextColor="#CCCCCC"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                    {!!fieldErrors.firstname && <Text style={styles.errorText}>{fieldErrors.firstname}</Text>}
                  </View>

                  {/* Middle Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Middle Name <Text style={styles.optional}>(optional)</Text></Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                      <TextInput onSubmitEditing={handleNextStep}
                        style={styles.input}
                        placeholder="Enter middle name"
                        placeholderTextColor="#CCCCCC"
                        value={middleName}
                        onChangeText={setMiddleName}
                      />
                    </View>
                  </View>

                  {/* Last Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Last Name <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.inputWrap, !lastName.trim() && lastName.length > 0 && styles.inputWrapError]}>
                      <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                      <TextInput onSubmitEditing={handleNextStep}
                        style={styles.input}
                        placeholder="Enter your surname"
                        placeholderTextColor="#CCCCCC"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                    {!!fieldErrors.lastname && <Text style={styles.errorText}>{fieldErrors.lastname}</Text>}
                  </View>

                  {/* Next Button - White like Login */}
                  <TouchableOpacity
                    style={[styles.submitBtnWrap, !isStep1Valid && styles.submitBtnDisabled]}
                    onPress={handleNextStep}
                    disabled={!isStep1Valid}
                    activeOpacity={0.85}
                  >
                                      <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                      <Text style={styles.submitBtnText}>Next</Text>
                      <Ionicons name="arrow-forward" size={18} color="#B91C1C" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                /* ── STEP 2: Contact & Security Info ── */
                <>
                  {/* Mobile */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mobile Number <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.inputWrap, mobileShowError && styles.inputWrapError]}>
                      <Ionicons name="call-outline" size={16} color={mobileShowError ? '#ff4444' : '#AAAAAA'} />
                      <TextInput onSubmitEditing={handleRegister}
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        placeholderTextColor="#CCCCCC"
                        value={mobile}
                        onChangeText={setMobile}
                        onBlur={() => setMobileTouched(true)}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                      {mobileShowError ? <Ionicons name="close-circle" size={16} color="#ff4444" /> : null}
                    </View>
                    {mobileShowError && <Text style={styles.errorText}>Enter a valid 10-digit Indian mobile number (must start with 6-9)</Text>}
                    {!!fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}
                  </View>

                  {/* Email + OTP */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Email Address <Text style={styles.required}>*</Text>
                      {emailVerified && <Text style={localStyles.verifiedBadge}> ✓ Verified</Text>}
                    </Text>
                    <View style={[styles.inputWrap, emailTouched && !emailOk && styles.inputWrapError, emailVerified && localStyles.inputWrapVerified]}>
                      <Ionicons name="mail-outline" size={16} color={emailVerified ? '#2e8b57' : '#AAAAAA'} />
                      <TextInput onSubmitEditing={handleRegister}
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#CCCCCC"
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={() => setEmailTouched(true)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                      />
                      {emailVerified ? (
                        <Ionicons name="checkmark-circle" size={20} color="#2e8b57" />
                      ) : emailOk ? (
                        <TouchableOpacity style={localStyles.sendOtpBtn} onPress={handleSendOTP} disabled={otpSending} activeOpacity={0.8}>
                          <Text style={localStyles.sendOtpBtnText}>{otpSending ? 'Sending...' : 'Send OTP'}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {emailTouched && !emailOk && normalizedEmail.length > 0 &&
                      <Text style={styles.errorText}>Enter a valid email, e.g. you@example.com</Text>}
                    {emailOk && !emailVerified && <Text style={localStyles.otpHint}>{'👆 Press "Send OTP" to verify your email'}</Text>}
                    {!!fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
                    {!!fieldErrors.otp && <Text style={styles.errorText}>{fieldErrors.otp}</Text>}
                  </View>

                  {/* Referral Code */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Referral Code <Text style={styles.optional}>(optional)</Text></Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="gift-outline" size={16} color="#AAAAAA" />
                      <TextInput onSubmitEditing={handleRegister}
                        style={styles.input}
                        placeholder="Enter referral code e.g. RTI-AB12CD"
                        placeholderTextColor="#CCCCCC"
                        value={referralCode}
                        onChangeText={(t) => setReferralCode(t.toUpperCase())}
                        autoCapitalize="characters"
                      />
                      {referralCode.length > 0 && (
                        <TouchableOpacity onPress={() => setReferralCode('')}>
                          <Ionicons name="close-circle-outline" size={16} color="#AAAAAA" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.inputWrap, passwordTouched && !passwordStrong && styles.inputWrapError]}>
                      <Ionicons name="lock-closed-outline" size={16} color="#AAAAAA" />
                      <TextInput onSubmitEditing={handleRegister}
                        style={styles.input}
                        placeholder="Use a strong password"
                        placeholderTextColor="#CCCCCC"
                        value={password}
                        onChangeText={setPassword}
                        onBlur={() => setPasswordTouched(true)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#AAAAAA" />
                      </TouchableOpacity>
                    </View>
                    {!passwordStrong && (passwordTouched || password.length > 0) && (
                      <View style={styles.passwordHintsBox}>
                        <Text style={styles.helperTitle}>Password must include:</Text>
                        {[
                          { key: 'length', label: '8+ characters' },
                          { key: 'upper', label: '1 uppercase (A-Z)' },
                          { key: 'lower', label: '1 lowercase (a-z)' },
                          { key: 'number', label: '1 number (0-9)' },
                          { key: 'special', label: '1 symbol (!@#$...)' },
                          { key: 'noSpace', label: 'No spaces' },
                        ].map(({ key, label }) => (
                          <View key={key} style={styles.hintRow}>
                            <Ionicons name={passwordChecks[key] ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={passwordChecks[key] ? '#2e8b57' : '#AAAAAA'} />
                            <Text style={[styles.helperText, passwordChecks[key] && styles.helperTextOk]}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {!!fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.inputWrap, confirm.length > 0 && password !== confirm && styles.inputWrapError]}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#AAAAAA" />
                      <TextInput onSubmitEditing={handleRegister}
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor="#CCCCCC"
                        value={confirm}
                        onChangeText={setConfirm}
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#AAAAAA" />
                      </TouchableOpacity>
                    </View>
                    {confirm.length > 0 && password !== confirm &&
                      <Text style={styles.errorText}>Passwords do not match</Text>}
                  </View>

                  {/* ── Location (State → District → Taluka → Village) ── */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>State <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.inputWrap, !!fieldErrors.state && styles.inputWrapError, false && { opacity: 0.5 }]}
                      activeOpacity={0.8}
                      disabled={false}
                      onPress={() => setLocPicker('state')}
                    >
                      <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                      <Text style={[styles.input, { paddingVertical: 12, color: locState ? '#222' : '#CCCCCC' }]} numberOfLines={1}>
                        {locState || 'Select state'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
                    </TouchableOpacity>
                    {!!fieldErrors.state && <Text style={styles.errorText}>{fieldErrors.state}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>District <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.inputWrap, !!fieldErrors.district && styles.inputWrapError, !locState && { opacity: 0.5 }]}
                      activeOpacity={0.8}
                      disabled={!locState}
                      onPress={() => setLocPicker('district')}
                    >
                      <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                      <Text style={[styles.input, { paddingVertical: 12, color: locDistrict ? '#222' : '#CCCCCC' }]} numberOfLines={1}>
                        {locDistrict || 'Select district'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
                    </TouchableOpacity>
                    {!!fieldErrors.district && <Text style={styles.errorText}>{fieldErrors.district}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Taluka <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.inputWrap, !!fieldErrors.taluka && styles.inputWrapError, !locDistrict && { opacity: 0.5 }]}
                      activeOpacity={0.8}
                      disabled={!locDistrict}
                      onPress={() => setLocPicker('taluka')}
                    >
                      <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                      <Text style={[styles.input, { paddingVertical: 12, color: locTaluka ? '#222' : '#CCCCCC' }]} numberOfLines={1}>
                        {locTaluka || 'Select taluka'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
                    </TouchableOpacity>
                    {!!fieldErrors.taluka && <Text style={styles.errorText}>{fieldErrors.taluka}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Village <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.inputWrap, !!fieldErrors.village && styles.inputWrapError, !locTaluka && { opacity: 0.5 }]}
                      activeOpacity={0.8}
                      disabled={!locTaluka}
                      onPress={() => setLocPicker('village')}
                    >
                      <Ionicons name="location-outline" size={16} color="#AAAAAA" />
                      <Text style={[styles.input, { paddingVertical: 12, color: locVillage ? '#222' : '#CCCCCC' }]} numberOfLines={1}>
                        {locVillage || 'Select village'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
                    </TouchableOpacity>
                    {!!fieldErrors.village && <Text style={styles.errorText}>{fieldErrors.village}</Text>}
                  </View>

                  {/* Terms - Fixed */}
                  <TouchableOpacity
                    style={localStyles.termsRow}
                    onPress={() => { setTermsAccepted(!termsAccepted); setTermsTouched(true); }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      localStyles.checkbox,
                      termsAccepted && localStyles.checkboxChecked,
                      termsTouched && !termsAccepted && localStyles.checkboxError
                    ]}>
                      {termsAccepted && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={localStyles.termsText}>
                      I accept the <Text style={localStyles.termsLink}>Terms & Conditions</Text> and <Text style={localStyles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </TouchableOpacity>
                  {termsTouched && !termsAccepted &&
                    <Text style={[styles.errorText, { marginTop: 4, marginBottom: 6 }]}>Please accept the Terms & Conditions</Text>}

                  {/* Create Account Button - White like Login */}
                  <TouchableOpacity
                    style={[styles.submitBtnWrap, !isStep2Valid && styles.submitBtnDisabled]}
                    onPress={handleRegister}
                    disabled={!isStep2Valid || submitting}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                      <Text style={styles.submitBtnText}>{submitting ? 'Creating account...' : 'Create Account'}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#B91C1C" />
                    </LinearGradient>
                  </TouchableOpacity>

                  {emailOk && !emailVerified &&
                    <Text style={localStyles.verifyHintBottom}>{'⚠️ Email verification is required to create account'}</Text>}

                  <View style={styles.switchBtn}>
<Text style={styles.switchText}>
                      Already have an account? <Text style={styles.switchLink} onPress={() => navigation.navigate('Login')} accessibilityRole="link">Sign In</Text></Text>
</View>
                </>
              )}
            </View>
          </KeyboardAwareScroll>

          <Toast toast={toast} opacity={opacity} translateY={translateY} />

          {locPicker && (
            <DropdownModal
              visible
              title={pickerConfig[locPicker].title}
              items={pickerConfig[locPicker].items}
              selected={pickerConfig[locPicker].selected}
              onSelect={(v) => handleSelectLocation(locPicker, v)}
              onClose={() => setLocPicker(null)}
            />
          )}

          <OtpModal
            visible={otpModalVisible}
            purpose="register"
            email={normalizedEmail}
            onClose={() => setOtpModalVisible(false)}
            onVerified={handleOtpVerified}
          />
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}