import { Ionicons } from '@expo/vector-icons';
import { readReferralCodeFromUrl } from '../utils/Referralservice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { AuthAPI } from './ClientAPI/AuthApi';

import { useEffect, useMemo, useRef, useState } from 'react';
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
    error: { bg: '#fef2f2', border: '#dc2626', icon: 'close-circle', iconColor: '#dc2626', textColor: '#991b1b', label: 'Error' },
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
export default function RegisterScreen({ navigation }) {
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
  const [otpSending, setOtpSending] = useState(false);
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
      password && confirm && password === confirm && termsAccepted;
  }, [mobileOk, emailVerified, emailOk, passwordStrong, password, confirm, termsAccepted]);

  // Email badalte hi purani verification khatam (verified OTP sirf usi email ke liye tha)
  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailVerified && text.trim().toLowerCase() !== verifiedEmail) {
      setEmailVerified(false); setVerifiedEmail(''); setVerifiedOtp('');
    }
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

    setSubmitting(true);
    try {
      // Server par registration abhi hoti hai (verified OTP ke saath) — OTP sirf 5 minute valid rehta hai,
      // isliye location screens ke baad nahi, yahin.
      const result = await AuthAPI.register({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
        email: normalizedEmail,
        password,
        referralCode: referralCode.trim(),
        profileImage: profileImage || '',
        otp: verifiedOtp,
      });

      if (!result.ok) {
        if (result.otpError) {
          setEmailVerified(false); setVerifiedEmail(''); setVerifiedOtp('');
          showToast('OTP expired or invalid. Please verify your email again.', 'error');
        } else {
          showToast(result.message || 'Registration failed. Please try again.', 'error');
        }
        return;
      }

      const ok = await UserStore.setPendingRegistration({
        name: fullName,
        mobile: mobile.trim(),
        email: normalizedEmail,
        referral_code_used: referralCode.trim() || null,
        password,
        profile_image: profileImage || '',
      });

      if (!ok) {
        showToast('Account created. Please sign in to continue.', 'info');
        navigation.navigate('Login');
        return;
      }
      // Account server par ban gaya + token save ho gaya: session turant save karo, taaki location
      // steps ke beech app band karke dobara kholne par bhi isi ID se login rahe.
      try { await UserStore.setCurrentUser(normalizedEmail); } catch (_) {}
      navigation.navigate('StateSelect', { fromPremium: false, needsCreateUser: true });
    } catch {
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => navigation.navigate('Home');
  const mobileShowError = mobileTouched && mobile.length > 0 && !mobileOk;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={[]}>
      <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your first name"
                        placeholderTextColor="#CCCCCC"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                  </View>

                  {/* Middle Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Middle Name <Text style={styles.optional}>(optional)</Text></Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="person-outline" size={16} color="#AAAAAA" />
                      <TextInput
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
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your surname"
                        placeholderTextColor="#CCCCCC"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
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
                      <TextInput
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
                  </View>

                  {/* Email + OTP */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Email Address <Text style={styles.required}>*</Text>
                      {emailVerified && <Text style={localStyles.verifiedBadge}> ✓ Verified</Text>}
                    </Text>
                    <View style={[styles.inputWrap, emailTouched && !emailOk && styles.inputWrapError, emailVerified && localStyles.inputWrapVerified]}>
                      <Ionicons name="mail-outline" size={16} color={emailVerified ? '#2e8b57' : '#AAAAAA'} />
                      <TextInput
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
                  </View>

                  {/* Referral Code */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Referral Code <Text style={styles.optional}>(optional)</Text></Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="gift-outline" size={16} color="#AAAAAA" />
                      <TextInput
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
                      <TextInput
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
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.inputWrap, confirm.length > 0 && password !== confirm && styles.inputWrapError]}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#AAAAAA" />
                      <TextInput
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

                  <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.switchText}>
                      Already have an account? <Text style={styles.switchLink}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAwareScroll>

          <Toast toast={toast} opacity={opacity} translateY={translateY} />

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