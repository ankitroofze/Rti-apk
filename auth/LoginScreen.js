import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from './ClientAPI/AuthApi';
import { UserStore } from '../store/UserStore';
import styles from '../styles/LoginStyles';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const scrollRef = useRef(null);
  const redirectTo = route?.params?.redirectTo || 'Home';

  const validate = () => {
    const next = { email: '', password: '', general: '' };
    const value = identifier.trim();
    if (!value) next.email = 'Email or mobile number is required.';
    else if (!/\S+@\S+\.\S+/.test(value) && !/^\d{10}$/.test(value.replace(/\s/g, ''))) next.email = 'Enter a valid email or 10-digit mobile number.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return !next.email && !next.password;
  };

  const finishLogin = async (email, apiUser = null) => {
    let stored = await UserStore.getUser(email);
    if (!stored && apiUser) {
      const sync = await UserStore.saveUserFromApi({
        id: apiUser.id,
        name: `${apiUser.firstname || ''} ${apiUser.lastname || ''}`.trim() || apiUser.name || '',
        mobile: apiUser.mobile_no || apiUser.mobile || '',
        email: apiUser.email || email,
        password,
        state: apiUser.state || '',
      });
      stored = sync?.user || null;
    }
    // Save the session before changing navigation. Otherwise protected Android
    // screens can run their auth check before the current user is available.
    if (!stored) throw new Error('Unable to restore your account details.');
    await UserStore.setCurrentUser(stored.email);
    login();
    navigation.reset({ index: 0, routes: [{ name: redirectTo }] });
  };

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => subscription.remove();
  }, []);

  const revealActiveField = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const value = identifier.trim();
      const isEmail = /\S+@\S+\.\S+/.test(value);
      if (isEmail) {
        const result = await AuthAPI.login({ email: value.toLowerCase(), password });
        if (result.ok) { await finishLogin(value.toLowerCase(), result.user); return; }
        if (!result.isNetwork) { setErrors((prev) => ({ ...prev, general: result.message || 'Invalid credentials.' })); return; }
      }
      const mobile = value.replace(/\s/g, '');
      const users = await UserStore.getAllUsers();
      const localUser = !isEmail && Array.isArray(users) ? users.find((user) => String(user.mobile || '').trim() === mobile) : null;
      if (!localUser) { setErrors((prev) => ({ ...prev, email: isEmail ? 'Unable to connect. Please try again.' : 'Account not found. Please sign up first.' })); return; }
      if (String(localUser.password || '') !== password) { setErrors((prev) => ({ ...prev, password: 'Incorrect password. Please try again.' })); return; }
      await UserStore.setCurrentUser(localUser.email);
      login();
      navigation.reset({ index: 0, routes: [{ name: redirectTo }] });
    } catch {
      setErrors((prev) => ({ ...prev, general: 'Login failed. Please try again.' }));
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <ScrollView ref={scrollRef} style={styles.scrollView} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="none" showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('Home')}><Ionicons name="close-outline" size={22} color="#888" /></TouchableOpacity>
            <Text style={styles.pageTitle}>Sign In</Text>
            <Text style={styles.pageSubtitle}>Please enter your credentials to continue</Text>
            {errors.general ? <View style={styles.generalErrorBox}><Ionicons name="alert-circle-outline" size={16} color="#e8732a" /><Text style={styles.generalErrorText}>{errors.general}</Text></View> : null}
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Email / Mobile</Text><View style={[styles.inputWrap, errors.email && styles.inputWrapError]}><Ionicons name="mail-outline" size={18} color="#888" /><TextInput style={styles.input} value={identifier} onFocus={revealActiveField} onChangeText={(value) => { setIdentifier(value); setErrors((prev) => ({ ...prev, email: '', general: '' })); }} placeholder="you@example.com or 10-digit mobile" autoCapitalize="none" autoCorrect={false} /></View>{errors.email ? <Text style={styles.inlineErrorText}>{errors.email}</Text> : null}</View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Password</Text><View style={[styles.inputWrap, errors.password && styles.inputWrapError]}><Ionicons name="lock-closed-outline" size={18} color="#888" /><TextInput style={styles.input} value={password} onFocus={revealActiveField} onChangeText={(value) => { setPassword(value); setErrors((prev) => ({ ...prev, password: '', general: '' })); }} placeholder="Enter your password" secureTextEntry={!showPassword} /><TouchableOpacity onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" /></TouchableOpacity></View>{errors.password ? <Text style={styles.inlineErrorText}>{errors.password}</Text> : null}</View>
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.btnDisabled]} disabled={submitting} onPress={handleLogin}>{submitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitBtnText}>Sign In</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}</TouchableOpacity>
            <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Register')}><Text style={styles.switchText}>{"Don't have an account? "}<Text style={styles.switchLink}>Sign Up</Text></Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}