import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from './ClientAPI/AuthApi';
import { UserStore } from '../store/UserStore';
import styles from '../styles/LoginStyles';
import BackTitleRow from '../components/BackTitleRow';
import webStyles from '../styles/LoginWebStyles';

// Web-only rendition of the Sign In screen: illustration on the left,
// white form panel on the right — matching the reference design.
// This file is picked up automatically for web builds only (Metro/Expo
// platform-extension resolution). Android/iOS keep using LoginScreen.js,
// completely unchanged.
export default function LoginScreen({ navigation, route }) {
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width } = useWindowDimensions();
  const showImagePanel = width >= 900;
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
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
    if (!stored) throw new Error('Unable to restore your account details.');
    await UserStore.setCurrentUser(stored.email);
    login();
    navigation.reset({ index: 0, routes: [{ name: redirectTo }] });
  };

  // ✅ NEW: deleted account ko reactivate karo (public API, token nahi bhejna)
  const reactivateAccount = async (email) => {
    setSubmitting(true);
    try {
      const result = await AuthAPI.reactivateAccount({ email, password });
      if (result.ok) {
        // Reactivate response bilkul login jaisa hai — token AuthAPI me save ho chuka hai
        await finishLogin(email, result.user);
        return;
      }
      // 422 (incorrect creds / already active / inactive-admin), 429, network — sab message dikhao
      setErrors((prev) => ({ ...prev, general: result.message || 'Unable to reactivate account.' }));
    } catch {
      setErrors((prev) => ({ ...prev, general: 'Reactivation failed. Please try again.' }));
    } finally { setSubmitting(false); }
  };

  const confirmReactivate = (email) => {
    const message = 'This account has been deleted. Do you want to reactivate it?';
    if (Platform.OS === 'web') {
      // react-native-web par Alert.alert multi-button support nahi karta
      if (typeof window !== 'undefined' && window.confirm(message)) reactivateAccount(email);
      return;
    }
    Alert.alert('Account Deleted', message, [
      { text: 'No', style: 'cancel' },
      { text: 'Reactivate', onPress: () => reactivateAccount(email) },
    ]);
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
        // ✅ NEW: deleted account -> reactivate ka option do
        if (result.code === 'account_deleted') { setErrors((prev) => ({ ...prev, general: 'Your account has been deleted. Please register with a new account.' })); return; }
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
            {/* Header wala same logo — center me, bada */}
            <Image
              source={require('../assets/images/certificate_logo.jpg')}
              resizeMode="contain"
              style={webStyles.brandLogo}
              accessibilityLabel="RTI News logo"
            />

            {/* Back (left) + Sign In (center) ek hi line par */}
            <BackTitleRow onBack={() => navigation.navigate('Home')} titleHeight={36}>
              <Text style={webStyles.title}>Sign In</Text>
            </BackTitleRow>
            <Text style={webStyles.subtitle}>Please enter your credentials to continue</Text>

            {errors.general ? (
              <View style={styles.generalErrorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#e8732a" />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>Email / Mobile</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                <Ionicons name="mail-outline" size={18} color="#888" />
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={(value) => { setIdentifier(value); setErrors((prev) => ({ ...prev, email: '', general: '' })); }}
                  placeholder="you@example.com or 10-digit mobile"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email ? <Text style={styles.inlineErrorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, webStyles.darkLabel]}>Password</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#888" />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(value) => { setPassword(value); setErrors((prev) => ({ ...prev, password: '', general: '' })); }}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.inlineErrorText}>{errors.password}</Text> : null}
            </View>

            <View style={styles.forgotBtn}>
<Text style={[styles.forgotText, webStyles.darkLink]} onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="link">Forgot password?</Text>
</View>

            <TouchableOpacity style={[styles.submitBtnWrap, submitting && styles.btnDisabled]} disabled={submitting} onPress={handleLogin}>
              <LinearGradient colors={['#B91C1C', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : (
                  <>
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchBtn}>
<Text style={webStyles.darkSwitchText}>
                {"Don't have an account? "}
                <Text style={webStyles.darkSwitchLink} onPress={() => navigation.navigate('Register')} accessibilityRole="link">Sign Up</Text></Text>
</View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}