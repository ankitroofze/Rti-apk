import { AuthAPI } from './ClientAPI/AuthApi';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/LoginStyles';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';

export default function ResetPasswordScreen({ navigation, route }) {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route?.params?.email || '';
const otpFromRoute = route?.params?.otp || '';

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      showToast('Please fill all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (!email) {
      showToast('Missing reset session. Please try again.', 'error');
      return;
    }

    setLoading(true);

    const result = await AuthAPI.resetPassword({
      email: email.trim(),
      otp: otpFromRoute,
      password,
    });
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }

    await UserStore.updatePassword(email, password);
    await UserStore.clearResetOtp(email);

    showToast('Password reset successfully', 'success');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.root}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <ScrollView contentContainerStyle={styles.formScroll}>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#38bdf8" />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#38bdf8" />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
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
