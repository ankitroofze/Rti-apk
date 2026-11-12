import { AuthAPI } from './ClientAPI/AuthApi';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/LoginStyles';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';

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
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const email = route?.params?.email || '';
  const otpFromRoute = route?.params?.otp || '';

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordStrong = useMemo(
    () => passwordChecks.length && passwordChecks.lower && passwordChecks.upper &&
      passwordChecks.number && passwordChecks.special && passwordChecks.noSpace,
    [passwordChecks]
  );
  const passwordsMatch = Boolean(confirmPassword.length > 0 && password === confirmPassword);
  const passwordMismatch = Boolean(confirmPassword.length > 0 && password !== confirmPassword);
  const passwordShowError = passwordTouched && !passwordStrong && password.length > 0;

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      showToast('Please fill all fields', 'error');
      setPasswordTouched(true);
      setConfirmTouched(true);
      return;
    }

    if (!passwordStrong) {
      showToast('Please satisfy all password requirements', 'error');
      setPasswordTouched(true);
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      setConfirmTouched(true);
      return;
    }

    if (!email) {
      showToast('Missing reset session. Please request OTP again.', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthAPI.resetPassword({
        email: email.trim(),
        otp: otpFromRoute,
        password,
      });

      if (!result.ok) {
        showToast(result.message || 'Unable to reset password.', 'error');
        return;
      }

      try {
        await UserStore.updatePassword(email, password);
        await UserStore.clearResetOtp(email);
      } catch {}

      showToast('Password reset successfully', 'success');
      navigation.navigate('Login');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.formContainer, styles.forgotFormContainer]}>
          <View style={styles.topAccent} />

          <View style={styles.logoCircle}>
            <Ionicons name="lock-closed-outline" size={28} color="#eff6ff" />
          </View>
          <Text style={styles.brandName}>RTI News</Text>

          <View style={styles.headerBlock}>
            <View style={styles.formIconWrap}>
              <Ionicons name="shield-outline" size={18} color="#7dd3fc" />
            </View>
            <Text style={styles.welcomeBack}>Secure your account</Text>
            <Text style={styles.formTitle}>Reset Password</Text>
            <Text style={styles.formSubtitle}>Create a new password for your account</Text>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New password</Text>
            <View style={[
              styles.inputWrap,
              passwordShowError && styles.inputWrapError,
              passwordStrong && local.inputWrapSuccess,
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passwordShowError ? '#ef4444' : passwordStrong ? '#22c55e' : '#38bdf8'}
              />
              <TextInput
                onSubmitEditing={handleReset}
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setPasswordTouched(true)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Checklist */}
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
                      size={13}
                      color={passwordChecks[key] ? '#22c55e' : '#64748b'}
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
                <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                <Text style={{ fontSize: 12, color: '#22c55e', fontWeight: '600' }}>Strong password</Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm password</Text>
            <View style={[
              styles.inputWrap,
              passwordMismatch && styles.inputWrapError,
              passwordsMatch && passwordStrong && local.inputWrapSuccess,
            ]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={passwordMismatch ? '#ef4444' : (passwordsMatch && passwordStrong) ? '#22c55e' : '#38bdf8'}
              />
              <TextInput
                onSubmitEditing={handleReset}
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => setConfirmTouched(true)}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {passwordMismatch && (
              <Text style={[styles.inlineErrorText, { color: '#ef4444', marginTop: 4 }]}>Passwords do not match</Text>
            )}
            {passwordsMatch && passwordStrong && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                <Text style={{ fontSize: 12, color: '#22c55e', fontWeight: '600' }}>Passwords match</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (loading || !passwordStrong || !passwordsMatch) && styles.btnDisabled,
            ]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Reset Password</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.switchText}>
              Back to <Text style={styles.switchLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  passwordHintsBox: {
    marginTop: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helperTitle: {
    color: '#e2e8f0',
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
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  helperTextOk: {
    color: '#22c55e',
    fontWeight: '600',
  },
  inputWrapSuccess: {
    borderColor: '#22c55e',
  },
});
