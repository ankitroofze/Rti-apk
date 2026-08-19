import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthAPI } from './ClientAPI/AuthApi';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserStore } from '../store/UserStore';
import { useAuth } from '../contexts/AuthContext';
import styles, { toastStyles, otpStyles, dropStyles, localStyles } from '../styles/RegisterStyles';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';


const OTPService = {
  generate() { return '123456'; },
  async sendSMS(mobile, otp) { console.log(`[OTP] SMS to +91${mobile}: ${otp}`); return true; },
  async sendEmail(email, otp) { console.log(`[OTP] Email to ${email}: ${otp}`); return true; },
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
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
    length:  v.length >= 8,
    lower:   /[a-z]/.test(v),
    upper:   /[A-Z]/.test(v),
    number:  /\d/.test(v),
    special: /[^A-Za-z0-9]/.test(v),
    noSpace: !/\s/.test(v),
  };
}

if (Platform.OS === 'web') {
  try {
    const style = document.createElement('style');
    style.textContent = `html, body, #root { height: 100%; margin: 0; padding: 0; background-color: #F0F0F5; overflow: hidden; }`;
    document.head.appendChild(style);
  } catch {}
}

// ─────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────
function Toast({ toast, opacity, translateY }) {
  if (!toast) return null;
  const config = {
    success: { bg: '#f0fdf4', border: '#16a34a', icon: 'checkmark-circle', iconColor: '#16a34a', textColor: '#166534', label: 'Success' },
    error:   { bg: '#fef2f2', border: '#dc2626', icon: 'close-circle',     iconColor: '#dc2626', textColor: '#991b1b', label: 'Error' },
    info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'information-circle',iconColor: '#3b82f6', textColor: '#1e40af', label: 'Info' },
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

// ─────────────────────────────────────────────────────────
// OTP Modal
// ─────────────────────────────────────────────────────────
function OTPModal({ visible, onClose, onVerify, mobile, email }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  const startTimer = () => {
    setResendTimer(30);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useMemo(() => {
    if (visible) { setDigits(['', '', '', '', '', '']); startTimer(); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible]);

  const handleDigitChange = (text, index) => {
    const newDigits = [...digits];
    const clean = text.replace(/[^0-9]/g, '').slice(-1);
    newDigits[index] = clean;
    setDigits(newDigits);
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < 6) return;
    setLoading(true);
    await onVerify(otp);
    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setDigits(['', '', '', '', '', '']);
    startTimer();
    await onVerify('RESEND');
  };

  const otp = digits.join('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={otpStyles.overlay}>
        <View style={otpStyles.card}>
          <View style={otpStyles.iconWrap}>
            <Ionicons name="shield-checkmark" size={32} color="#e8732a" />
          </View>
          <Text style={otpStyles.title}>Verify OTP</Text>
          <Text style={otpStyles.subtitle}>OTP has been sent to:</Text>
          <Text style={otpStyles.sentTo}>📱 +91{mobile}</Text>
          {email ? <Text style={otpStyles.sentTo}>📧 {email}</Text> : null}
          <Text style={otpStyles.devNote}>
            💡 Testing mode: Use OTP: <Text style={{ color: '#e8732a', fontWeight: 'bold', fontSize: 16 }}>123456</Text>
          </Text>

          <View style={otpStyles.digitRow}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[otpStyles.digitBox, digit ? otpStyles.digitBoxFilled : null]}
                value={digit}
                onChangeText={text => handleDigitChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[otpStyles.verifyBtn, otp.length < 6 && otpStyles.verifyBtnDisabled]}
            onPress={handleVerify}
            disabled={otp.length < 6 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={otpStyles.verifyBtnText}>Verifying...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={otpStyles.verifyBtnText}>Verify OTP</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={otpStyles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={otpStyles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={otpStyles.resendTimer}>
                Resend in <Text style={{ color: '#e8732a', fontWeight: '700' }}>{resendTimer}s</Text>
              </Text>
            )}
          </View>

          <TouchableOpacity style={otpStyles.closeBtn} onPress={onClose}>
            <Text style={otpStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Dropdown Modal
// ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────
// Main Register Screen
// ─────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();

  const [firstName,  setFirstName]  = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName,   setLastName]   = useState('');
  const [mobile,     setMobile]     = useState('');
  const [email,      setEmail]      = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [emailTouched,    setEmailTouched]    = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [mobileTouched,   setMobileTouched]   = useState(false);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [mobileVerified,  setMobileVerified]  = useState(false);
  const [otpSending,      setOtpSending]      = useState(false);
  const [currentOtp,      setCurrentOtp]      = useState('');
  const [verifiedMobile,  setVerifiedMobile]  = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsTouched,  setTermsTouched]  = useState(false);

  const [toast,      setToast]      = useState(null);
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef   = useRef(null);

  const normalizedEmail = useMemo(() => String(email || '').trim().toLowerCase(), [email]);
  const emailOk    = useMemo(() => isValidEmailAddress(normalizedEmail), [normalizedEmail]);
  const mobileOk   = useMemo(() => isValidMobileNumber(mobile), [mobile]);
  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrong = useMemo(
    () => passwordChecks.length && passwordChecks.lower && passwordChecks.upper
          && passwordChecks.number && passwordChecks.special && passwordChecks.noSpace,
    [passwordChecks]
  );
  const fullName = useMemo(() =>
    [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' '),
    [firstName, middleName, lastName]
  );

  const handleMobileChange = (text) => {
    setMobile(text);
    if (mobileVerified && text !== verifiedMobile) { setMobileVerified(false); setVerifiedMobile(''); }
  };

  const formOk = useMemo(() => {
    const nameOk    = Boolean(firstName.trim()) && Boolean(lastName.trim());
    const confirmOk = password && confirm && password === confirm;
    return nameOk && mobileOk && mobileVerified && emailOk && passwordStrong && confirmOk && termsAccepted;
  }, [firstName, lastName, mobileOk, mobileVerified, emailOk, passwordStrong, password, confirm, termsAccepted]);

  const showToast = (message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start(() => setToast(null));
    }, 3000);
  };

  const handleSendOTP = async () => {
    if (!mobileOk) { setMobileTouched(true); showToast('Enter a valid 10-digit mobile number', 'error'); return; }
    setOtpSending(true);
    const otp = OTPService.generate();
    setCurrentOtp(otp);
    await OTPService.sendSMS(mobile, otp);
    if (emailOk) await OTPService.sendEmail(normalizedEmail, otp);
    setOtpSending(false);
    setOtpModalVisible(true);
    showToast('OTP sent! Use 123456 to verify', 'info');
  };

  const handleVerifyOTP = async (enteredOtp) => {
    if (enteredOtp === 'RESEND') {
      const newOtp = OTPService.generate();
      setCurrentOtp(newOtp);
      await OTPService.sendSMS(mobile, newOtp);
      if (emailOk) await OTPService.sendEmail(normalizedEmail, newOtp);
      showToast('OTP resent! Use 123456 to verify', 'info');
      return;
    }
    if (enteredOtp === '123456') {
      setMobileVerified(true); setVerifiedMobile(mobile);
      setOtpModalVisible(false);
      showToast('Mobile number verified successfully! ✅', 'success');
    } else {
      showToast('Invalid OTP. Use 123456 to verify.', 'error');
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim())    { showToast('First name daalo', 'error'); return; }
    if (!lastName.trim())     { showToast('Last name daalo', 'error'); return; }
    if (!mobileOk)            { setMobileTouched(true); showToast('Valid 10-digit mobile number daalo', 'error'); return; }
    if (!mobileVerified)      { showToast('Mobile number verify karo pehle', 'error'); return; }
    if (!normalizedEmail)     { setEmailTouched(true); showToast('Email address daalo', 'error'); return; }
    if (!emailOk)             { setEmailTouched(true); showToast('Valid email address daalo', 'error'); return; }
    if (!passwordStrong)      { setPasswordTouched(true); showToast('Strong password use karo', 'error'); return; }
    if (password !== confirm)  { showToast('Passwords match nahi kar rahe', 'error'); return; }
    if (!termsAccepted)       { setTermsTouched(true); showToast('Terms & Conditions accept karo', 'error'); return; }

   // ── Local Save only (API call baad mein hoga Home pe) ──
    const ok = await UserStore.setPendingRegistration({
      name:               fullName,
      mobile:             mobile.trim(),
      email:              normalizedEmail,
      referral_code_used: referralCode.trim() || null,
      password,
    });

    if (!ok) { showToast('Registration failed. Please try again.', 'error'); return; }
    navigation.navigate('StateSelect', { fromPremium: false, needsCreateUser: true });
  };

  const handleClose = () => navigation.navigate('Home');
  const mobileShowError = mobileTouched && mobile.length > 0 && !mobileOk;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.formContainer}>

          {/* ── Close Button ── */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close-outline" size={22} color="#888888" />
          </TouchableOpacity>

          {/* ── Header ── */}
          <View style={styles.headerBlock}>
            <Text style={styles.welcomeBack}>Create your account</Text>
            <Text style={styles.formTitle}>Register</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#AAAAAA" />
              <TextInput style={styles.input} placeholder="Enter your name" placeholderTextColor="#CCCCCC" value={firstName} onChangeText={setFirstName} />
            </View>
          </View>

          {/* Middle Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Middle Name <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#AAAAAA" />
              <TextInput style={styles.input} placeholder="Enter middle name" placeholderTextColor="#CCCCCC" value={middleName} onChangeText={setMiddleName} />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#AAAAAA" />
              <TextInput style={styles.input} placeholder="Enter your surname" placeholderTextColor="#CCCCCC" value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          {/* Mobile + OTP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Mobile Number <Text style={styles.required}>*</Text>
              {mobileVerified && <Text style={localStyles.verifiedBadge}> ✅ Verified</Text>}
            </Text>
            <View style={[styles.inputWrap, mobileShowError && styles.inputWrapError, mobileVerified && localStyles.inputWrapVerified]}>
              <Ionicons name="call-outline" size={16} color={mobileVerified ? '#2e8b57' : mobileShowError ? '#FF2D78' : '#AAAAAA'} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#CCCCCC"
                value={mobile}
                onChangeText={handleMobileChange}
                onBlur={() => setMobileTouched(true)}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!mobileVerified}
              />
              {mobileVerified ? (
                <Ionicons name="checkmark-circle" size={20} color="#2e8b57" />
              ) : mobileOk ? (
                <TouchableOpacity style={localStyles.sendOtpBtn} onPress={handleSendOTP} disabled={otpSending} activeOpacity={0.8}>
                  <Text style={localStyles.sendOtpBtnText}>{otpSending ? 'Sending...' : 'Send OTP'}</Text>
                </TouchableOpacity>
              ) : mobileShowError ? (
                <Ionicons name="close-circle" size={16} color="#e8732a" />
              ) : null}
            </View>
            {mobileShowError && <Text style={styles.errorText}>Valid 10-digit Indian mobile number daalo (6-9 se shuru)</Text>}
            {mobileOk && !mobileVerified && <Text style={localStyles.otpHint}>{'👆 Press "Send OTP" to verify your mobile number'}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputWrap, emailTouched && !emailOk && styles.inputWrapError]}>
              <Ionicons name="mail-outline" size={16} color="#AAAAAA" />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#CCCCCC"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setEmailTouched(true)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailTouched && !emailOk && normalizedEmail.length > 0 &&
              <Text style={styles.errorText}>Valid email daalo, e.g. you@example.com</Text>}
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
                  { key: 'length',  label: '8+ characters' },
                  { key: 'upper',   label: '1 uppercase (A-Z)' },
                  { key: 'lower',   label: '1 lowercase (a-z)' },
                  { key: 'number',  label: '1 number (0-9)' },
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

          {/* Terms */}
          <TouchableOpacity
            style={localStyles.termsRow}
            onPress={() => { setTermsAccepted(!termsAccepted); setTermsTouched(true); }}
            activeOpacity={0.8}
          >
            <View style={[localStyles.checkbox, termsAccepted && localStyles.checkboxChecked, termsTouched && !termsAccepted && localStyles.checkboxError]}>
              {termsAccepted ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
            </View>
            <Text style={localStyles.termsText}>
              I accept the <Text style={localStyles.termsLink}>Terms & Conditions</Text> and <Text style={localStyles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {termsTouched && !termsAccepted &&
            <Text style={[styles.errorText, { marginTop: 4, marginBottom: 6 }]}>Please accept the Terms & Conditions</Text>}

          {/* Submit */}
          <TouchableOpacity style={[styles.submitBtn, !formOk && styles.submitBtnDisabled]} onPress={handleRegister} disabled={!formOk}>
            <Text style={styles.submitBtnText}>Create Account</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>

          {mobileOk && !mobileVerified &&
            <Text style={localStyles.verifyHintBottom}>{'⚠️ Mobile verification is required to create account'}</Text>}

          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <Toast toast={toast} opacity={opacity} translateY={translateY} />

      <OTPModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        onVerify={handleVerifyOTP}
        mobile={mobile}
        email={emailOk ? normalizedEmail : ''}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}