import { Platform, StyleSheet } from 'react-native';

const RegisterStyles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === 'web' && { minHeight: '100vh', width: '100%' }),
  },

  scrollView: {
    flex: 1,
  },

    // Centers the card vertically & horizontally, scrollable
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

  // Close / X button — top-left of card
  closeButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Unused stubs
  topAccent:    { display: 'none' },
  brandLogoWrap:{ display: 'none' },
  brandLogo:    { display: 'none' },
  formIconWrap: { display: 'none' },
  formSubtitle: { display: 'none' },

  iconCircleWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFE8F0',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 8, marginTop: 2,
  },

  // Header block — centered eyebrow + big title
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },

  welcomeBack: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    fontFamily: 'Roboto',
  },

  backButtonContainer: { alignSelf: 'flex-start', marginBottom: 6 },
  backButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 9,
    borderRadius: 9, backgroundColor: '#F5F5F5',
  },
  backButtonText: { fontSize: 12, color: '#333333', fontWeight: '600', marginLeft: 4 },

  // ─── Input Fields ─────────────────────────────────────────────────────────
  inputGroup: { marginBottom: 12 },

  inputLabel: {
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 6,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },

   required: {
    color: '#e8732a', fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  optional: {
    color: '#BBBBBB', fontWeight: '500', fontSize: 11,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F8F8',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 52,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },

  inputWrapError: {
    borderColor: '#e8732a',
    backgroundColor: 'rgba(255,45,120,0.03)',
  },

  errorText: {
    marginTop: 4,
    color: '#e8732a',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },

  // ─── Password Hints ───────────────────────────────────────────────────────
  passwordHintsBox: {
    marginTop: 6,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  helperTitle: {
    color: '#555555', fontSize: 11, fontWeight: '800',
    marginBottom: 6, letterSpacing: 0.2,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  helperText:   { color: '#BBBBBB', fontSize: 11, fontWeight: '600' },
  helperTextOk: { color: '#2e8b57' },

  // ─── Sub cards (unused but kept for compatibility) ────────────────────────
  subRow:     { flexDirection: 'row', gap: 8 },
  subCard:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 6, backgroundColor: '#F8F8F8', borderRadius: 12, borderWidth: 1.5, borderColor: '#EEEEEE', position: 'relative' },
  subCardText:{ fontSize: 10, fontWeight: '600', color: '#999999', textAlign: 'center' },
  subDot:     { position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: 4 },

  // ─── Submit Button ────────────────────────────────────────────────────────
   submitBtnWrap: {
    borderRadius: 50,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  submitBtn: {
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.45 },
  loginButtonGradient: { minHeight: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 50 },
  submitBtnText: { color: '#B91C1C', fontWeight: '700', fontSize: 16, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' },

  // ─── Switch to Login ──────────────────────────────────────────────────────
  switchBtn:  { marginTop: 14, alignItems: 'center' },
  switchText: { color: '#ffffff', fontSize: 13, textAlign: 'center', fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular' },
  switchLink: { color: '#ffffff', fontWeight: '700', fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' },
});

// ─── Toast Styles ─────────────────────────────────────────────────────────────
export const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    width: Platform.OS === 'web' ? 360 : '85%',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    backgroundColor: '#ffffff',
  },
  label:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  message: { fontSize: 13, fontWeight: '500', lineHeight: 18, color: '#111111' },
});

// ─── OTP Modal Styles ─────────────────────────────────────────────────────────
export const otpStyles = StyleSheet.create({
  overlay: {
    ...(Platform.OS === 'web' ? { position: 'fixed' } : { position: 'absolute' }),
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 28, padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 16,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFE8F0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
   title:    {
    fontSize: 22, fontWeight: '700', color: '#111111', marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  subtitle: {
    fontSize: 13, color: '#999999', textAlign: 'center', marginBottom: 3,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  sentTo:   {
    fontSize: 13, color: '#B91C1C', fontWeight: '700', marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  devNoteWrap: {
    borderRadius: 10, marginTop: 10, marginBottom: 20, overflow: 'hidden',
  },
  devNote:  {
    fontSize: 11, color: '#ffffff',
    paddingHorizontal: 12, paddingVertical: 6, textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  digitRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  digitBox: {
    width: 46, height: 54, borderRadius: 12,
    backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#EEEEEE',
    color: '#111111', fontSize: 22, fontWeight: '800', textAlign: 'center',
  },
  digitBoxFilled: { backgroundColor: '#e8732a', borderColor: '#e8732a', color: '#ffffff' },
  verifyBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, backgroundColor: '#e8732a',
    borderRadius: 50, paddingVertical: 14, marginBottom: 14,
    shadowColor: '#e8732a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
   verifyBtnDisabled: { opacity: 0.45 },
  verifyBtnText: {
    color: '#ffffff', fontWeight: '700', fontSize: 15,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  resendRow:  { marginBottom: 12 },
  resendTimer:{
    color: '#BBBBBB', fontSize: 13, textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  resendLink: {
    color: '#B91C1C', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  closeBtn:   { paddingVertical: 8 },
  closeBtnText:{
    color: '#BBBBBB', fontSize: 13, fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
});

// ─── Dropdown Modal Styles ────────────────────────────────────────────────────
export const dropStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 16,
  },
  handle: { width: 40, height: 4, backgroundColor: '#DDDDDD', borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
  title:  { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 12, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8F8F8', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10,
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111111' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, marginBottom: 3 },
  itemSelected:     { backgroundColor: 'rgba(255,45,120,0.07)' },
  itemText:         { fontSize: 14, color: '#444444', fontWeight: '500' },
  itemTextSelected: { color: '#e8732a', fontWeight: '700' },
});

// ─── Local Styles ─────────────────────────────────────────────────────────────
export const localStyles = StyleSheet.create({
  avatarWrap: { alignItems: 'center', marginBottom: 18 },
  avatarContainer: { position: 'relative', width: 84, height: 84 },
  avatarImage: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#F8F8F8', borderWidth: 2, borderColor: '#EEEEEE',
  },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#F8F8F8', borderWidth: 2, borderColor: '#EEEEEE',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#e8732a', borderWidth: 2, borderColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { marginTop: 6, fontSize: 11, color: '#999999', fontWeight: '600' },
  inputWrapVerified: { borderColor: 'rgba(46,139,87,0.5)' },
  verifiedBadge:     { color: '#2e8b57', fontSize: 11, fontWeight: '700' },
  sendOtpBtn: {
    backgroundColor: '#e8732a', borderRadius: 50,
    paddingHorizontal: 11, paddingVertical: 5,
    shadowColor: '#e8732a', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  sendOtpBtnText:  { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  otpHint:         { marginTop: 4, fontSize: 10, color: '#e8732a', fontWeight: '600' },
  verifyHintBottom:{
    textAlign: 'center', marginTop: 6, fontSize: 10, color: '#e8732a', fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  termsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: 2, marginBottom: 8, paddingHorizontal: 2,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#DDDDDD',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#e8732a', borderColor: '#e8732a' },
  checkboxError:   { borderColor: '#e8732a' },
   termsText: {
    flex: 1, fontSize: 12, color: '#999999', lineHeight: 17,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  termsLink: {
    color: '#e8732a', fontWeight: '700', textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
});

export default RegisterStyles;

