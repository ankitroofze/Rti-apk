// auth/ForgotPasswordScreen.js  (POORA REPLACE)
// Android/iOS: LoginScreen.js jaisa hi design (profile-red background, white text, white pill button).
// "Send OTP" dabane par email par OTP jaata hai aur center me OTP popup card khulta hai.

import React, { useState } from 'react';
import {
  ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { AuthAPI } from './ClientAPI/AuthApi';
import styles from '../styles/LoginStyles';
import OtpModal from '../components/Otpmodal';

export default function ForgotPasswordScreen({ navigation }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: '', general: '' });
  const [otpVisible, setOtpVisible] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSendOtp = async () => {
    if (!normalizedEmail) {
      setErrors({ email: 'Email is required.', general: '' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setErrors({ email: 'Enter a valid email address.', general: '' });
      return;
    }

    setSubmitting(true);
    setErrors({ email: '', general: '' });
    const result = await AuthAPI.requestForgotOTP({ email: normalizedEmail });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ email: '', general: result.message || 'Unable to send OTP. Please try again.' });
      return;
    }
    setOtpVisible(true); // center popup
  };

  const handleVerified = (otp) => {
    setOtpVisible(false);
    navigation.navigate('ResetPassword', { email: normalizedEmail, otp });
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: '#B91C1C' }]} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'}>
        <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" style={styles.root}>
          <KeyboardAwareScroll
            style={styles.scrollView}
            contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('Login')}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.pageTitle}>Forgot Password</Text>
              <Text style={styles.pageSubtitle}>Enter your email to receive an OTP</Text>

              {errors.general ? (
                <View style={styles.generalErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#e8732a" />
                  <Text style={styles.generalErrorText}>{errors.general}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                  <Ionicons name="mail-outline" size={18} color="#888" />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(value) => { setEmail(value); setErrors({ email: '', general: '' }); }}
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                </View>
                {errors.email ? <Text style={styles.inlineErrorText}>{errors.email}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.submitBtnWrap, submitting && styles.btnDisabled]}
                disabled={submitting}
                onPress={handleSendOtp}
              >
                <LinearGradient
                  colors={['#ffffff', '#f8fafc', '#f1f5f9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtn}
                >
                  {submitting ? (
                    <ActivityIndicator color="#B91C1C" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Send OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color="#B91C1C" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.switchBtn}>
<Text style={styles.switchText}>
                  Back to <Text style={styles.switchLink} onPress={() => navigation.navigate('Login')} accessibilityRole="link">Sign In</Text></Text>
</View>
            </View>
          </KeyboardAwareScroll>

          {/* OTP popup — screen ke center me card */}
          <OtpModal
            visible={otpVisible}
            email={normalizedEmail}
            onClose={() => setOtpVisible(false)}
            onVerified={handleVerified}
          />
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}