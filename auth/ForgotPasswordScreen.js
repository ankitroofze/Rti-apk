// import add karo upar
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from './ClientAPI/AuthApi';
import styles from '../styles/LoginStyles';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';
// import
export default function ForgotPasswordScreen({ navigation }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      showToast('Please enter your email', 'error');
      return;
    }

    setLoading(true);

    const result = await AuthAPI.requestForgotOTP({ email: email.trim() });
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }

    showToast(result.message || 'OTP sent to your email!', 'success');
    navigation.navigate('Otp', { email: email.trim() });
  };
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      bbehavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.root}>
          <View style={[styles.glow, styles.glowTop]} />
          <View style={[styles.glow, styles.glowBottom]} />

          <ScrollView
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.formContainer,
                styles.forgotFormContainer,
              ]}
            >
              <View style={styles.topAccent} />

              <View style={styles.logoCircle}>
                <Ionicons
                  name="lock-open-outline"
                  size={28}
                  color="#eff6ff"
                />
              </View>

              <Text style={styles.brandName}>RTI News</Text>

              <View style={styles.headerBlock}>
                <View style={styles.formIconWrap}>
                  <Ionicons
                    name="mail-open-outline"
                    size={18}
                    color="#7dd3fc"
                  />
                </View>

                <Text style={styles.welcomeBack}>
                  Password recovery
                </Text>

                <Text style={styles.formTitle}>
                  Forgot Password
                </Text>

                <Text style={styles.formSubtitle}>
                  Enter your email to receive an OTP
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Email address
                </Text>

                <View style={styles.inputWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#38bdf8"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  loading && styles.btnDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#ffffff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.switchText}>
                  Back to{' '}
                  <Text style={styles.switchLink}>
                    Sign In
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>           
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}