// auth/ForgotPasswordScreen.web.js  (NEW FILE)
// Sirf WEB ke liye — LoginScreen.web.js jaisa split screen (left image, right white form).
// Metro web build me apne aap isi file ko uthata hai; Android me ForgotPasswordScreen.js chalta rahega.

import React, { useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, Text, TextInput,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { AuthAPI } from './ClientAPI/AuthApi';
import styles from '../styles/LoginStyles';
import webStyles from '../styles/LoginWebStyles';
import OtpModal from '../components/Otpmodal';

export default function ForgotPasswordScreen({ navigation }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
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

            <Text style={webStyles.title}>Forgot Password</Text>
            <Text style={webStyles.subtitle}>Enter your email to receive an OTP</Text>

            {errors.general ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#e8732a" />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>Email address</Text>
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
              style={[styles.submitBtnWrap, { marginTop: 8 }, submitting && styles.btnDisabled]}
              disabled={submitting}
              onPress={handleSendOtp}
            >
              <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={webStyles.darkSwitchText}>
                Back to <Text style={webStyles.darkSwitchLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* OTP popup — screen ke center me card (position: fixed overlay) */}
      <OtpModal
        visible={otpVisible}
        email={normalizedEmail}
        onClose={() => setOtpVisible(false)}
        onVerified={handleVerified}
      />
    </View>
  );
}