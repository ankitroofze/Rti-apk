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
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inputRefs = useRef([]);

  // Distribute any numeric string (e.g. from paste or fast typing) across boxes
  const applyOtpString = (rawString, startIndex = 0) => {
    const clean = String(rawString || '').replace(/[^0-9]/g, '');
    if (!clean) return;

    setDigits((prev) => {
      const next = [...prev];
      // If a full or multi-digit OTP is pasted, fill from 0
      const start = clean.length >= OTP_LENGTH ? 0 : startIndex;
      for (let i = 0; i < clean.length && (start + i) < OTP_LENGTH; i++) {
        next[start + i] = clean[i];
      }
      return next;
    });
    setError('');

    const start = clean.length >= OTP_LENGTH ? 0 : startIndex;
    const nextTarget = Math.min(start + clean.length, OTP_LENGTH - 1);
    setTimeout(() => {
      inputRefs.current[nextTarget]?.focus();
    }, 30);
  };

  // Popup khulte hi sab reset + 30s resend timer start + focus box 0
  useEffect(() => {
    if (!visible) return undefined;
    setDigits(emptyDigits());
    setFocusedIndex(0);
    setError('');
    setInfo('');
    setLoading(false);
    setResendTimer(RESEND_SECONDS);
    const focusId = setTimeout(() => inputRefs.current[0]?.focus(), 250);
    const tickId = setInterval(() => setResendTimer((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => {
      clearTimeout(focusId);
      clearInterval(tickId);
    };
  }, [visible]);

  // Web native paste listener (Ctrl+V anywhere in modal)
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return undefined;
    const handleGlobalPaste = (e) => {
      const pasted = (e.clipboardData || (typeof window !== 'undefined' && window.clipboardData))?.getData('text') || '';
      const clean = pasted.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
      if (clean) {
        e.preventDefault();
        applyOtpString(clean, 0);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('paste', handleGlobalPaste);
      return () => {
        window.removeEventListener('paste', handleGlobalPaste);
      };
    }
    return undefined;
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
    const raw = String(text || '');
    const clean = raw.replace(/[^0-9]/g, '');

    // Case 1: Multi-digit entered (paste or rapid typing)
    if (clean.length > 1) {
      // Check if user was replacing an existing digit (e.g. box had "5" and user typed "9" -> "59")
      if (clean.length === 2 && digits[index] && clean[0] === digits[index]) {
        const newDigit = clean[1];
        setDigits((prev) => {
          const next = [...prev];
          next[index] = newDigit;
          return next;
        });
        setError('');
        if (index < OTP_LENGTH - 1) {
          setTimeout(() => inputRefs.current[index + 1]?.focus(), 20);
        }
        return;
      }
      applyOtpString(clean, index);
      return;
    }

    // Case 2: Single digit or cleared
    const digit = clean.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 20);
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    const key = nativeEvent?.key;
    if (key === 'Backspace') {
      if (!digits[index] && index > 0) {
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      } else {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      }
    } else if (key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
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
          {digits.map((digit, index) => {
            const isFilled = Boolean(digit);
            const isCurrentFocus = focusedIndex === index;

            return (
              <View
                key={index}
                style={[
                  otpStyles.digitBox,
                  local.digitBoxWrap,
                  isFilled && otpStyles.digitBoxFilled,
                  isCurrentFocus && !isFilled && local.digitBoxFocused,
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    local.innerInput,
                    isFilled ? { color: '#ffffff' } : { color: '#111111' },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(text, index)}
                  onKeyPress={(event) => handleKeyPress(event, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onSubmitEditing={handleVerify}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                />
              </View>
            );
          })}
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
  digitRow: { gap: 8, width: '100%', justifyContent: 'center' },
  digitBoxWrap: {
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  digitBoxFocused: {
    borderColor: '#e8732a',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 0 3px rgba(232, 115, 42, 0.15)',
    } : {}),
  },
  innerInput: {
    width: '100%',
    height: '100%',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  errorText: { color: '#e8732a', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: -10, marginBottom: 12 },
  infoText: { color: '#15803d', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: -10, marginBottom: 12 },
});
