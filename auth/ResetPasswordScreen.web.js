// auth/ResetPasswordScreen.web.js  (NEW FILE)
// Sirf WEB ke liye — LoginScreen.web.js / ForgotPasswordScreen.web.js jaisa split screen
// (left image, right white form). Metro web build me apne aap isi file ko uthata hai;
// Android/iOS me auth/ResetPasswordScreen.js hi chalta rahega (usme koi change nahi).

import React, { useState } from 'react';
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

// Register screen wala hi password rule (8+ chars, upper, lower, number, special, no space)
const isStrongPassword = (value) => {
  const v = String(value || '');
  return v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v) && !/\s/.test(v);
};

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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirm: '', general: '' });

  const validate = () => {
    const next = { password: '', confirm: '', general: '' };
    if (sessionMissing) next.general = 'Reset session expired. Please request a new OTP.';
    if (!password) next.password = 'New password is required.';
    else if (!isStrongPassword(password)) next.password = 'Use 8+ characters with upper & lower case, a number and a special character (no spaces).';
    if (!confirmPassword) next.confirm = 'Please confirm your password.';
    else if (password !== confirmPassword) next.confirm = 'Passwords do not match.';
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
      // Server par reset ho chuka hai — local store update fail ho to bhi user ko rokna nahi hai
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>New password</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#888" />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(value) => { setPassword(value); setErrors((prev) => ({ ...prev, password: '', general: '' })); }}
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
              {errors.password
                ? <Text style={styles.inlineErrorText}>{errors.password}</Text>
                : <Text style={local.hint}>At least 8 characters with upper & lower case, a number and a special character.</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>Confirm password</Text>
              <View style={[styles.inputWrap, errors.confirm && styles.inputWrapError]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#888" />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(value) => { setConfirmPassword(value); setErrors((prev) => ({ ...prev, confirm: '', general: '' })); }}
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
              {errors.confirm ? <Text style={styles.inlineErrorText}>{errors.confirm}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.submitBtnWrap, { marginTop: 8 }, submitting && styles.btnDisabled]}
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
                  Need a new OTP? <Text style={webStyles.darkSwitchLink} onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="link">Start again</Text></Text>
</View>
            ) : null}

            <View style={styles.switchBtn}>
<Text style={webStyles.darkSwitchText}>
                Back to <Text style={webStyles.darkSwitchLink} onPress={() => navigation.navigate('Login')} accessibilityRole="link">Sign In</Text></Text>
</View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  hint: { fontSize: 12, color: '#6b7280', marginTop: 6, lineHeight: 17 },
});