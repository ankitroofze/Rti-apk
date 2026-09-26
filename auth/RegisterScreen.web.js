import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useRef, useState } from 'react';
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
import styles, { toastStyles, localStyles } from '../styles/RegisterStyles';
import webStyles from '../styles/RegisterWebStyles';

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
// Main Register Screen (web)
// ─────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [bio, setBio] = useState('');
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
    if (!emailOk) { setEmailTouched(true); showToast('Valid email address daalo', 'error'); return; }
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
    if (!isStep1Valid) { showToast('First and Last name daalo', 'error'); return; }
    if (!mobileOk) { setMobileTouched(true); showToast('Valid 10-digit mobile number daalo', 'error'); return; }
    if (!normalizedEmail) { setEmailTouched(true); showToast('Email address daalo', 'error'); return; }
    if (!emailOk) { setEmailTouched(true); showToast('Valid email address daalo', 'error'); return; }
    if (!emailVerified || verifiedEmail !== normalizedEmail || !verifiedOtp) { showToast('Email verify karo pehle', 'error'); return; }
    if (!passwordStrong) { setPasswordTouched(true); showToast('Strong password use karo', 'error'); return; }
    if (password !== confirm) { showToast('Passwords match nahi kar rahe', 'error'); return; }
    if (!termsAccepted) { setTermsTouched(true); showToast('Terms & Conditions accept karo', 'error'); return; }

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
        bio: bio.trim(),
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
        bio: bio.trim(),
      });

      if (!ok) {
        showToast('Account created. Please sign in to continue.', 'info');
        navigation.navigate('Login');
        return;
      }
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
            {!showImagePanel && (
              <View style={webStyles.compactBrandRow}>
                <Ionicons name="location" size={20} color="#B91C1C" />
                <Text style={webStyles.compactBrandText}>RTI News</Text>
              </View>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color="#111111" />
            </TouchableOpacity>

            <View style={styles.headerBlock}>
              <Text style={[styles.welcomeBack, webStyles.welcomeBack]}>Create your account</Text>
              <Text style={[styles.formTitle, webStyles.formTitle]}>Register</Text>
            </View>

            <StepIndicator currentStep={formStep - 1} totalSteps={2} />

          
            {formStep === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>First Name <Text style={styles.required}>*</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Middle Name <Text style={styles.optional}>(optional)</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Last Name <Text style={styles.required}>*</Text></Text>
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
                  {mobileShowError && <Text style={styles.errorText}>Valid 10-digit Indian mobile number daalo (6-9 se shuru)</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>
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
                    <Text style={styles.errorText}>Valid email daalo, e.g. you@example.com</Text>}
                  {emailOk && !emailVerified && <Text style={localStyles.otpHint}>{'👆 Press "Send OTP" to verify your email'}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Referral Code <Text style={styles.optional}>(optional)</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Password <Text style={styles.required}>*</Text></Text>
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Bio</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="document-text-outline" size={16} color="#AAAAAA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Tell us a bit about yourself (optional)"
                      placeholderTextColor="#CCCCCC"
                      value={bio}
                      onChangeText={setBio}
                      multiline
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, webStyles.darkLabel]}>Confirm Password <Text style={styles.required}>*</Text></Text>
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

                <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
                  <Text style={webStyles.darkSwitchText}>
                    Already have an account? <Text style={webStyles.darkSwitchLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        <Toast toast={toast} opacity={opacity} translateY={translateY} />

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