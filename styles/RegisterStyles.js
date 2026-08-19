import { Platform, StyleSheet } from 'react-native';

const RegisterStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scrollView: {
    flex: 1,
  },

  // Centers the card vertically & horizontally, scrollable
  // formScroll: {
  //   flexGrow: 1,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingHorizontal: 16,
  //   paddingTop: 52,       // pushed down for status bar on Android/web
  //   paddingBottom: 32,
  // },

  formContainer: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 720 : 480,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
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
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
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
    color: '#e8732a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: 'Roboto',
  },

  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#999999',
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
    color: '#333333',
    marginBottom: 6,
    fontWeight: '600',
  },

  required: { color: '#e8732a', fontWeight: '800' },
  optional: { color: '#BBBBBB', fontWeight: '500', fontSize: 11 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F8F8',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
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
  submitBtn: {
    backgroundColor: '#e8732a',
    borderRadius: 50,
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: '#e8732a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },

  // ─── Switch to Login ──────────────────────────────────────────────────────
  switchBtn:  { marginTop: 14, alignItems: 'center' },
  switchText: { color: '#999999', fontSize: 13, textAlign: 'center' },
  switchLink: { color: '#111111', fontWeight: '700' },
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
    flex: 1,
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
  title:    { fontSize: 22, fontWeight: '700', color: '#111111', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#999999', textAlign: 'center', marginBottom: 3 },
  sentTo:   { fontSize: 13, color: '#e8732a', fontWeight: '700', marginBottom: 2 },
  devNote:  {
    fontSize: 11, color: '#e8732a',
    backgroundColor: 'rgba(255,45,120,0.08)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5,
    marginTop: 10, marginBottom: 20, textAlign: 'center',
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
  verifyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  resendRow:  { marginBottom: 12 },
  resendTimer:{ color: '#BBBBBB', fontSize: 13, textAlign: 'center' },
  resendLink: { color: '#e8732a', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center' },
  closeBtn:   { paddingVertical: 8 },
  closeBtnText:{ color: '#BBBBBB', fontSize: 13, fontWeight: '600' },
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
  verifyHintBottom:{ textAlign: 'center', marginTop: 6, fontSize: 10, color: '#e8732a', fontWeight: '600' },
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
  termsText: { flex: 1, fontSize: 12, color: '#999999', lineHeight: 17 },
  termsLink: { color: '#e8732a', fontWeight: '700', textDecorationLine: 'underline' },
});

export default RegisterStyles;