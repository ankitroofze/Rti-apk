// components/OtpModal.js
// Center wala email-OTP popup card — Android + iOS + Web teeno me same.
// Do flows ke liye use hota hai (prop `purpose`):
//   purpose="forgot"    (default) -> AuthAPI.requestForgotOTP / verifyForgotOTP
//   purpose="register"            -> AuthAPI.requestRegisterOTP / verifyRegisterOTP
// Verify yahin hota hai; success hone par parent ko onVerified(otp) milta hai.
// OTP 5 minute tak valid rehta hai (backend rule).

import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import { otpStyles } from '../styles/RegisterStyles';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const OTP_VALID_MINUTES = 5;
const emptyDigits = () => Array(OTP_LENGTH).fill('');

export default function OtpModal({ visible, email, onClose, onVerified, purpose = 'forgot' }) {
  const isRegister = purpose === 'register';
  const verifyOtp = isRegister ? AuthAPI.verifyRegisterOTP : AuthAPI.verifyForgotOTP;
  const requestOtp = isRegister ? AuthAPI.requestRegisterOTP : AuthAPI.requestForgotOTP;
  const [digits, setDigits] = useState(emptyDigits);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inputRefs = useRef([]);

  // Popup khulte hi sab reset + 30s resend timer start
  useEffect(() => {
    if (!visible) return undefined;
    setDigits(emptyDigits());
    setError('');
    setInfo('');
    setLoading(false);
    setResendTimer(RESEND_SECONDS);
    const focusId = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    const tickId = setInterval(() => setResendTimer((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => {
      clearTimeout(focusId);
      clearInterval(tickId);
    };
  }, [visible]);

  // Android back button: pehle popup band ho, screen pichhe na jaaye
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  const handleDigitChange = (text, index) => {
    const clean = text.replace(/[^0-9]/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    setError('');
    if (clean && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = digits.join('');


  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH || loading) return;
    setLoading(true);
    setError('');
    setInfo('');
    const result = await verifyOtp({ email, otp });
    setLoading(false);
    if (!result.ok) {
      setError(result.message || 'Invalid or expired OTP.');
      return;
    }
    onVerified?.(otp);
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    setInfo('');
    const result = await requestOtp({ email });
    setResending(false);
    if (!result.ok) {
      setError(result.message || 'Could not resend OTP. Please try again.');
      return;
    }
    setDigits(emptyDigits());
    setResendTimer(RESEND_SECONDS);
    setInfo('A new OTP has been sent to your email.');
    inputRefs.current[0]?.focus();
  };

  if (!visible) return null;

  return (
    <View style={otpStyles.overlay}>
      <View style={otpStyles.card}>
        <View style={otpStyles.iconWrap}>
          <Ionicons name="shield-checkmark" size={32} color="#e8732a" />
        </View>
        <Text style={otpStyles.title}>{isRegister ? 'Verify your email' : 'Enter OTP'}</Text>
        <Text style={otpStyles.subtitle}>OTP has been sent to:</Text>
        <Text style={otpStyles.sentTo}>📧 {email}</Text>
        <Text style={[otpStyles.subtitle, local.validText]}>Valid for {OTP_VALID_MINUTES} minutes</Text>



        <View style={[otpStyles.digitRow, local.digitRow]}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[otpStyles.digitBox, local.digitBox, digit ? otpStyles.digitBoxFilled : null]}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              onSubmitEditing={handleVerify}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={local.errorText}>{error}</Text> : null}
        {info ? <Text style={local.infoText}>{info}</Text> : null}

        <TouchableOpacity
          style={[otpStyles.verifyBtn, (otp.length < OTP_LENGTH || loading) && otpStyles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={otp.length < OTP_LENGTH || loading}
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
          {resendTimer === 0 ? (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={otpStyles.resendLink}>{resending ? 'Sending...' : 'Resend OTP'}</Text>
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
  );
}

const local = StyleSheet.create({

  validText: { marginBottom: 16 },
  // chhoti screen par 6 boxes fit ho jaayein
  digitRow: { gap: 8, width: '100%', justifyContent: 'center' },
  digitBox: {
    flexShrink: 1, minWidth: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  errorText: { color: '#e8732a', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: -10, marginBottom: 12 },
  infoText: { color: '#15803d', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: -10, marginBottom: 12 },
});