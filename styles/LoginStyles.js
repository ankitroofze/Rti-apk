import { Platform, StyleSheet } from 'react-native';

const LoginStyles = StyleSheet.create({
  flex: { flex: 1, ...(Platform.OS === 'web' && { minHeight: '100vh' }) },

  root: {
    flex: 1,
    backgroundColor: '#B91C1C', // keyboard band hone par white nahi, red dikhe
    ...(Platform.OS === 'web' && { minHeight: '100vh', width: '100%' }),
  },

  scrollView: {
    flex: 1,
    width: '100%',
  },

  // KEY FIX: justifyContent centers card vertically, paddingTop for status bar
  formScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 40,
  },

  formContainer: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 8,
    paddingTop: 36,
    alignItems: 'stretch',
  },

  // Back button — top-left, plain icon, no background/shadow
  closeButton: {
    position: 'absolute',
    top: 14, left: 14, zIndex: 10,
    width: 34, height: 34,
    backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center',
  },

  iconCircleWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#FFE8F0',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 16, marginTop: 8,
  },

  // Header
  pageTitle: {
    fontSize: 30, fontWeight: Platform.OS === 'web' ? '800' : 'normal', color: '#ffffff',
    textAlign: 'center', marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  pageSubtitle: {
    fontSize: 14, color: '#ffffff',
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },

  // General error box
  generalErrorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,45,120,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,45,120,0.2)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14,
  },
  generalErrorText: { flex: 1, fontSize: 13, color: '#e8732a', fontWeight: '600' },

  // Inputs
  inputGroup:  { marginBottom: 14 },
  inputLabel:  {
    fontSize: 13, color: '#ffffff', marginBottom: 6, fontWeight: Platform.OS === 'web' ? '600' : 'normal',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#EEEEEE',
    borderRadius: 8, paddingHorizontal: 16, minHeight: 52,
  },
  inputWrapError: { borderColor: '#e8732a', backgroundColor: 'rgba(255,45,120,0.03)' },
  input: {
    flex: 1, fontSize: 14, color: '#111111', paddingVertical: 0,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },

  inlineErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, paddingHorizontal: 4 },
  inlineErrorText: { fontSize: 12, color: '#e8732a', fontWeight: '600', flex: 1 },

  forgotBtn:  { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  forgotText: {
    color: '#ffffff', fontSize: 14, fontWeight: Platform.OS === 'web' ? '600' : 'normal',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },

  // Submit button — LinearGradient (red, same shades as the Edit Profile button) lives in submitBtn
   submitBtnWrap: {
    borderRadius: 50, overflow: 'hidden', marginBottom: 18,
    shadowColor: '#7F1D1D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', // 👈 NAYA
  },
  submitBtn: {
    minHeight: 52, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
  },
  btnDisabled:   { opacity: 0.6 },
   submitBtnText: {
    color: '#B91C1C', fontWeight: Platform.OS === 'web' ? '700' : 'normal', fontSize: 17,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEEEEE' },
  dividerText: { color: '#BBBBBB', fontSize: 13 },

  // Social buttons
  socialRow: { flexDirection: 'column', gap: 10 },
  socialBtn: {
    minHeight: 48, borderRadius: 50,
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#EEEEEE',
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: 10, paddingHorizontal: 16,
  },
  socialText: { fontSize: 14, color: '#111111', fontWeight: '600' },

  // Switch to register
  switchBtn:  { marginTop: 20, alignItems: 'center' },
  switchText: {
    color: '#ffffff', fontSize: 14, textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  switchLink: {
    color: '#ffffff', fontWeight: Platform.OS === 'web' ? '700' : 'normal',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // Forgot Password screens ke liye
  forgotFormContainer: {
    paddingTop: 28,
  },

  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#e8732a',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 8,
  },

  brandName: {
    fontSize: 13, fontWeight: '700', color: '#e8732a',
    textAlign: 'center', marginBottom: 16, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto',
  },

  headerBlock: {
    alignItems: 'center', marginBottom: 20,
  },

  formIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },

  welcomeBack: {
    fontSize: 12, fontWeight: '600', color: '#999999',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto',
  },

  formTitle: {
    fontSize: 24, fontWeight: '800', color: '#111111',
    textAlign: 'center', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Roboto_900Black' : 'Roboto',
  },

  formSubtitle: {
    fontSize: 13, color: '#999999',
    textAlign: 'center', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Roboto_400Regular' : 'Roboto',
  },

  // Unused stubs kept for compatibility
  glow:        { display: 'none', position: 'absolute' },
  glowTop:     {},
  glowBottom:  {},
  topAccent:   { display: 'none' },
});
export default LoginStyles;