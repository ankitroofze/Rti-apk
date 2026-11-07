import { Ionicons } from '@expo/vector-icons';
import { readReferralCodeFromUrl } from '../utils/Referralservice';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Animated,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { AuthAPI } from './ClientAPI/AuthApi';
import OtpModal from '../components/Otpmodal';
import { UserStore } from '../store/UserStore';
import { compressImageToBase64 } from '../utils/imageHandling';
import { MAX_IMAGE_SIZE } from '../constants/profileConstants';
import { useAuth } from '../contexts/AuthContext';
import { INDIAN_STATES, getDistricts, getTalukas, getVillages, getLocationIds } from '../pages/locationData';
import styles, { toastStyles, localStyles } from '../styles/RegisterStyles';
import webStyles from '../styles/RegisterWebStyles';
import BackTitleRow from '../components/BackTitleRow';
import LocationDropdownModal from '../components/LocationDropdownModal';

// Web-only rendition of the Register screen: illustration on the left,
// white form panel on the right — matching the reference design.
// This file is picked up automatically for web builds only (Metro/Expo
// platform-extension resolution). Android/iOS keep using RegisterScreen.js,
// completely unchanged. All validation / OTP / registration logic below is
// copied as-is from RegisterScreen.js — only the outer layout changed.

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
// Location field — upar ke inputs jaisa look + click par searchable dropdown
// ─────────────────────────────────────────────────────────────
function LocationField({ label, value, placeholder, icon, disabled, error, onPress }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, webStyles.darkLabel]}>{label} <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.8}
        onPress={disabled ? undefined : onPress}
        style={[styles.inputWrap, !!error && styles.inputWrapError, disabled && { opacity: 0.55 }, { cursor: disabled ? 'not-allowed' : 'pointer' }]}
      >
        <Ionicons name={icon} size={16} color="#AAAAAA" />
        <Text style={[styles.input, { color: value ? '#111111' : '#CCCCCC' }]} numberOfLines={1}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Register Screen (web)
// ─────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation, route }) {
  const { login } = useAuth();
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;

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
  // Backend validation errors: { field: 'message' } — response.errors[field] se aate hain
  const [fieldErrors, setFieldErrors] = useState({});
  const clearFieldError = (...fields) => setFieldErrors((prev) => {
    if (!fields.some((f) => prev[f])) return prev;
    const next = { ...prev }; fields.forEach((f) => { delete next[f]; }); return next;
  });
  const districtOptions = useMemo(() => (locState ? getDistricts(locState) : []), [locState]);
  const talukaOptions = useMemo(() => (locState && locDistrict ? getTalukas(locState, locDistrict) : []), [locState, locDistrict]);
  const villageOptions = useMemo(() => (locState && locDistrict && locTaluka ? getVillages(locState, locDistrict, locTaluka) : []), [locState, locDistrict, locTaluka]);
  const locationComplete = Boolean(locState && locDistrict && locTaluka && locVillage);
  const [locPicker, setLocPicker] = useState(null); // 'state' | 'district' | 'taluka' | 'village' | null
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

  // Backend ke errors ko form fields par map karo
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
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: false }),
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
    if (!emailOk) { setEmailTouched(true); showToast('Please enter a valid email address', 'error'); return; }
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
    if (!passwordStrong) { setPasswordTouched(true); showToast('Please use a strong password', 'error'); return; }
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
  const openInfoPage = (pageKey) => { try { navigation.navigate('InfoPage', { pageKey }); } catch (_) { /* ignore */ } };
  const mobileShowError = mobileTouched && mobile.length > 0 && !mobileOk;

  return (
    <View style={webStyles.page}>
      {showImagePanel && (
        <View style={webStyles.imagePanel}>
          <Image
            source={require('../assets/images/login.png')}
            resizeMode="cover"
            style={webStyles.imagePanelPicture}
          />
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

            <BackTitleRow onBack={handleClose} style={{ marginTop: 8, marginBottom: 20 }} titleHeight={32}>
              <View style={{ alignItems: 'center' }}>
              <Text style={[styles.formTitle, webStyles.formTitle]}>Register</Text>
            </View>
            </BackTitleRow>

            <StepIndicator currentStep={formStep - 1} totalSteps={2} />

          
            {formStep === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>First Name <Text style={styles.required}>*</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Middle Name <Text style={styles.optional}>(optional)</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Last Name <Text style={styles.required}>*</Text></Text>
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

                <TouchableOpacity
                  style={[styles.submitBtnWrap, !isStep1Valid && styles.submitBtnDisabled]}
                  onPress={handleNextStep}
                  disabled={!isStep1Valid}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Next</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Mobile Number <Text style={styles.required}>*</Text></Text>
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
                  {mobileShowError && <Text style={styles.errorText}>Enter a valid 10-digit Indian mobile number (starting with 6-9)</Text>}
                  {!!fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Referral Code <Text style={styles.optional}>(optional)</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Password <Text style={styles.required}>*</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Confirm Password <Text style={styles.required}>*</Text></Text>
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

                <LocationField label="State" icon="map-outline" placeholder="Select state" value={locState}
                  error={fieldErrors.state} onPress={() => setLocPicker('state')} />
                <LocationField label="District" icon="business-outline" placeholder="Select district" value={locDistrict}
                  disabled={!locState} error={fieldErrors.district} onPress={() => setLocPicker('district')} />
                <LocationField label="Taluka" icon="location-outline" placeholder="Select taluka" value={locTaluka}
                  disabled={!locDistrict} error={fieldErrors.taluka} onPress={() => setLocPicker('taluka')} />
                <LocationField label="Village" icon="home-outline" placeholder="Select village" value={locVillage}
                  disabled={!locTaluka} error={fieldErrors.village} onPress={() => setLocPicker('village')} />

                {/* Sirf checkbox click se toggle hoga — text ya khali jagah par click se nahi */}
                <View style={[localStyles.termsRow, { width: '100%', alignItems: 'center' }]}>
                  <TouchableOpacity
                    onPress={() => { setTermsAccepted(!termsAccepted); setTermsTouched(true); }}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: termsAccepted }}
                  >
                    <View style={[
                      localStyles.checkbox,
                      termsAccepted && localStyles.checkboxChecked,
                      termsTouched && !termsAccepted && localStyles.checkboxError
                    ]}>
                      {termsAccepted && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={[localStyles.termsText, { flex: 1, fontSize: 12, lineHeight: 18, whiteSpace: 'nowrap' }]}>
                    I accept the{' '}
                    <Text style={localStyles.termsLink} onPress={() => openInfoPage('terms')} accessibilityRole="link">Terms & Conditions</Text>
                    {' '}and{' '}
                    <Text style={localStyles.termsLink} onPress={() => openInfoPage('privacy')} accessibilityRole="link">Privacy Policy</Text>
                  </Text>
                </View>
                {termsTouched && !termsAccepted &&
                  <Text style={[styles.errorText, { marginTop: 4, marginBottom: 6 }]}>Please accept the Terms & Conditions</Text>}

                <TouchableOpacity
                  style={[styles.submitBtnWrap, !isStep2Valid && styles.submitBtnDisabled]}
                  onPress={handleRegister}
                  disabled={!isStep2Valid || submitting}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>{submitting ? 'Creating account...' : 'Create Account'}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>

                {emailOk && !emailVerified &&
                  <Text style={localStyles.verifyHintBottom}>{'⚠️ Email verification is required to create account'}</Text>}

                <View style={styles.switchBtn}>
<Text style={webStyles.darkSwitchText}>
                    Already have an account? <Text style={webStyles.darkSwitchLink} onPress={() => navigation.navigate('Login')} accessibilityRole="link">Sign In</Text></Text>
</View>
              </>
            )}
          </View>
        </ScrollView>

        <Toast toast={toast} opacity={opacity} translateY={translateY} />


        <LocationDropdownModal
          visible={locPicker === 'state'}
          title="Select State"
          placeholder="Search state..."
          emptyText="No state found"
          items={INDIAN_STATES}
          selected={locState}
          onSelect={(v) => handleSelectLocation('state', v)}
          onClose={() => setLocPicker(null)}
        />
        <LocationDropdownModal
          visible={locPicker === 'district'}
          title="Select District"
          placeholder="Search district..."
          emptyText="No district found"
          items={districtOptions}
          selected={locDistrict}
          onSelect={(v) => handleSelectLocation('district', v)}
          onClose={() => setLocPicker(null)}
        />
        <LocationDropdownModal
          visible={locPicker === 'taluka'}
          title="Select Taluka"
          placeholder="Search taluka..."
          emptyText="No taluka found"
          items={talukaOptions}
          selected={locTaluka}
          onSelect={(v) => handleSelectLocation('taluka', v)}
          onClose={() => setLocPicker(null)}
        />
        <LocationDropdownModal
          visible={locPicker === 'village'}
          title="Select Village"
          placeholder="Search village..."
          emptyText="No village found"
          items={villageOptions}
          selected={locVillage}
          onSelect={(v) => handleSelectLocation('village', v)}
          onClose={() => setLocPicker(null)}
        />
        <OtpModal
          visible={otpModalVisible}
          purpose="register"
          email={normalizedEmail}
          onClose={() => setOtpModalVisible(false)}
          onVerified={handleOtpVerified}
        />
      </View>
    </View>
  );
}