// import add karo upar
import React, { useEffect, useRef, useState } from 'react';
import { AuthAPI } from './ClientAPI/AuthApi';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import loginStyles from '../styles/LoginStyles';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';

export default function OtpScreen({ navigation, route }) {
  const { showToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const email = route?.params?.email || '';

  useEffect(() => {
    let isMounted = true;

    const syncTimer = async () => {
      if (!email) {
        return;
      }

      const otpRecord = await UserStore.getResetOtp(email);
      if (!isMounted || !otpRecord?.expiresAt) {
        return;
      }

      const remaining = Math.max(0, Math.floor((otpRecord.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    syncTimer();

    return () => {
      isMounted = false;
    };
  }, [email]);

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((currentTime) => currentTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleOtpChange = (value, index) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }

    setLoading(true);

    const result = await AuthAPI.verifyForgotOTP({
      email: email.trim(),
      otp: otpValue,
    });
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }

    showToast('OTP verified successfully', 'success');
    navigation.navigate('ResetPassword', {
      email: email.trim(),
      otp: otpValue,
    });
  };

  const formatTime = (totalSeconds) => {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={loginStyles.root}>
      <View style={[loginStyles.glow, loginStyles.glowTop]} />
      <View style={[loginStyles.glow, loginStyles.glowBottom]} />

      <ScrollView contentContainerStyle={loginStyles.formScroll}>
        <View style={[loginStyles.formContainer, loginStyles.forgotFormContainer]}>
          <View style={loginStyles.topAccent} />

          <View style={loginStyles.logoCircle}>
            <Ionicons name="shield-checkmark-outline" size={28} color="#eff6ff" />
          </View>
          <Text style={loginStyles.brandName}>RTI News</Text>

          <View style={loginStyles.headerBlock}>
            <View style={loginStyles.formIconWrap}>
              <Ionicons name="key-outline" size={18} color="#7dd3fc" />
            </View>
            <Text style={loginStyles.welcomeBack}>Account verification</Text>
            <Text style={loginStyles.formTitle}>Enter OTP</Text>
            <Text style={loginStyles.formSubtitle}>
              Enter the 6-digit OTP sent to {email || 'your email'}
            </Text>
          </View>

          <Text style={styles.timerText}>
            OTP valid for{' '}
            <Text style={timeLeft === 0 ? styles.timerExpired : styles.timerActive}>
              {formatTime(timeLeft)}
            </Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={`${index + 1}`}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(event) => handleKeyPress(event, index)}
                keyboardType="number-pad"
                maxLength={1}
                placeholder="0"
                placeholderTextColor="#475569"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              loginStyles.submitBtn,
              styles.verifyButton,
              (timeLeft === 0 || loading) && loginStyles.btnDisabled,
            ]}
            onPress={handleVerify}
            disabled={timeLeft === 0 || loading}
          >
            <Text style={loginStyles.submitBtnText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={loginStyles.switchBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={loginStyles.switchText}>
              {"Didn't get the code? "}
              <Text style={loginStyles.switchLink}>Try again</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',  // ← space-between se center
    marginTop: 6,
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 4,
  },
  otpInput: {
    width: 44,           // ← flex:1 hatao, fixed width do
    height: 52,
    backgroundColor: '#0b1423',
    borderWidth: 1,
    borderColor: '#22324a',
    borderRadius: 12,
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    outlineStyle: 'none',
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  verifyButton: {
    marginTop: 2,
  },
  timerText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  timerActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  timerExpired: {
    color: '#e8732a',
    fontWeight: '700',
  },
});