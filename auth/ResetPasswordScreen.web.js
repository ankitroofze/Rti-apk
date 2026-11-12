// auth/ResetPasswordScreen.web.js
// Web rendition of ResetPassword screen with full real-time password criteria
// checklist, matching RegisterScreen.web.js live validation indicators.

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { AuthAPI } from './ClientAPI/AuthApi';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';
import styles from '../styles/LoginStyles';
import webStyles from '../styles/LoginWebStyles';

// Same password checks as RegisterScreen (8+ chars, upper, lower, number, special, no space)
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

export default function ResetPasswordScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
  const { showToast } = useToast();

  const email = route?.params?.email || '';
  const otp = route?.params?.otp || '';
  const sessionMissing = !email || !otp; // page refresh / direct URL par params nahi milte

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirm: '', general: '' });

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrong = useMemo(
    () => passwordChecks.length && passwordChecks.lower && passwordChecks.upper &&
      passwordChecks.number && passwordChecks.special && passwordChecks.noSpace,
    [passwordChecks]
  );
  const passwordsMatch = Boolean(confirmPassword.length > 0 && password === confirmPassword);
  const passwordMismatch = Boolean(confirmPassword.length > 0 && password !== confirmPassword);
  const passwordShowError = (passwordTouched || Boolean(errors.password)) && !passwordStrong && password.length > 0;

  const validate = () => {
    const next = { password: '', confirm: '', general: '' };
    if (sessionMissing) next.general = 'Reset session expired. Please request a new OTP.';
    if (!password) {
      next.password = 'New password is required.';
      setPasswordTouched(true);
    } else if (!passwordStrong) {
      next.password = 'Please meet all password requirements listed below.';
      setPasswordTouched(true);
    }
    if (!confirmPassword) {
      next.confirm = 'Please confirm your password.';
      setConfirmTouched(true);
    } else if (password !== confirmPassword) {
      next.confirm = 'Passwords do not match.';
      setConfirmTouched(true);
    }
    setErrors(next);
    return !next.password && !next.confirm && !next.general;
  };

  const handleReset = async () => {
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      const result = await AuthAPI.resetPassword({ email: email.trim(), otp, password });
      if (!result.ok) {
        setErrors({ password: '', confirm: '', general: result.message || 'Unable to reset password. Please try again.' });
        return;
      }
      try {
        await UserStore.updatePassword(email, password);
        await UserStore.clearResetOtp(email);
      } catch {}
      showToast('Password reset successfully', 'success');
      navigation.navigate('Login');
    } catch {
      setErrors({ password: '', confirm: '', general: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

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

            <Text style={webStyles.title}>Reset Password</Text>
            <Text style={webStyles.subtitle}>Create a new password for your account</Text>

            {sessionMissing || errors.general ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#e8732a" />
                <Text style={styles.generalErrorText}>
                  {errors.general || 'Reset session expired. Please request a new OTP.'}
                </Text>
              </View>
            ) : null}

            {/* ─── New Password ─── */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>New password</Text>
              <View style={[
                styles.inputWrap,
                (passwordShowError || errors.password) && styles.inputWrapError,
                passwordStrong && local.inputWrapSuccess,
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={passwordShowError ? '#ef4444' : passwordStrong ? '#16a34a' : '#888'}
                />
                <TextInput
                  onSubmitEditing={handleReset}
                  style={styles.input}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setErrors((prev) => ({ ...prev, password: '', general: '' }));
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.inlineErrorText}>{errors.password}</Text>
              ) : null}

              {/* Live interactive validation checklist */}
              {!passwordStrong && (passwordTouched || password.length > 0) && (
                <View style={local.passwordHintsBox}>
                  <Text style={local.helperTitle}>Password must include:</Text>
                  {[
                    { key: 'length', label: '8+ characters' },
                    { key: 'upper', label: '1 uppercase (A-Z)' },
                    { key: 'lower', label: '1 lowercase (a-z)' },
                    { key: 'number', label: '1 number (0-9)' },
                    { key: 'special', label: '1 symbol (!@#$...)' },
                    { key: 'noSpace', label: 'No spaces' },
                  ].map(({ key, label }) => (
                    <View key={key} style={local.hintRow}>
                      <Ionicons
                        name={passwordChecks[key] ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={passwordChecks[key] ? '#16a34a' : '#9ca3af'}
                      />
                      <Text style={[local.helperText, passwordChecks[key] && local.helperTextOk]}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {passwordStrong && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>Strong password</Text>
                </View>
              )}
            </View>

            {/* ─── Confirm Password ─── */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>Confirm password</Text>
              <View style={[
                styles.inputWrap,
                (passwordMismatch || errors.confirm) && styles.inputWrapError,
                passwordsMatch && passwordStrong && local.inputWrapSuccess,
              ]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={passwordMismatch ? '#ef4444' : (passwordsMatch && passwordStrong) ? '#16a34a' : '#888'}
                />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setErrors((prev) => ({ ...prev, confirm: '', general: '' }));
                  }}
                  onBlur={() => setConfirmTouched(true)}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
                <TouchableOpacity onPress={() => setShowConfirm((value) => !value)}>
                  <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              {passwordMismatch ? (
                <Text style={styles.inlineErrorText}>Passwords do not match</Text>
              ) : passwordsMatch && passwordStrong ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>Passwords match</Text>
                </View>
              ) : errors.confirm ? (
                <Text style={styles.inlineErrorText}>{errors.confirm}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtnWrap,
                { marginTop: 12 },
                (submitting || !passwordStrong || !passwordsMatch) && styles.btnDisabled,
              ]}
              disabled={submitting}
              onPress={handleReset}
            >
              <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Reset Password</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {sessionMissing || errors.general ? (
              <View style={styles.switchBtn}>
                <Text style={webStyles.darkSwitchText}>
                  Need a new OTP? <Text style={webStyles.darkSwitchLink} onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="link">Start again</Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.switchBtn}>
              <Text style={webStyles.darkSwitchText}>
                Back to <Text style={webStyles.darkSwitchLink} onPress={() => navigation.navigate('Login')} accessibilityRole="link">Sign In</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  passwordHintsBox: {
    marginTop: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  helperTitle: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  helperTextOk: {
    color: '#16a34a',
    fontWeight: '600',
  },
  inputWrapSuccess: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22, 163, 74, 0.03)',
  },
});
