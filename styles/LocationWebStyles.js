import { StyleSheet } from 'react-native';

// Shared web-only layout for Select State / District / Taluka (image left,
// white form right) — matches LoginWebStyles.js / RegisterWebStyles.js.
// Used only by StateSelectScreen.web.js, DistrictSelectScreen.web.js and
// TalukaSelectScreen.web.js. Native (Android/iOS) keeps using the original
// .js files and styles/RegisterStyles.js — untouched.
const LocationWebStyles = StyleSheet.create({
  page: { flex: 1, minHeight: '100vh', width: '100%', flexDirection: 'row', backgroundColor: '#ffffff' },
  imagePanel: { flex: 1.05, minHeight: '100vh', position: 'relative', overflow: 'hidden' },
  imagePanelPicture: { width: '100%', height: '100%' },
  formPanel: { flex: 1, minHeight: '100vh', backgroundColor: '#ffffff', justifyContent: 'center' },
  formPanelScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  formInner: { width: '100%', maxWidth: 420 },

  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#111111', fontWeight: '800', fontSize: 13, marginLeft: 6, fontFamily: "'Roboto', sans-serif" },

  welcomeBack: { color: '#999999' },
  formTitle: { color: '#111111' },
  darkLabel: { color: '#111111' },
  locationInfo: { color: '#6b7280', textAlign: 'center', marginTop: 6 },

  brandLogo: { width: 132, height: 132, borderRadius: 66, marginBottom: 18, alignSelf: 'center' },
  compactBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  compactBrandText: { fontSize: 16, fontWeight: '800', color: '#B91C1C', fontFamily: "'Roboto', sans-serif" },

  submitBtnWrap: {
    borderRadius: 50, overflow: 'hidden', marginTop: 20,
    shadowColor: '#7F1D1D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  submitBtn: { minHeight: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

  skipBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  skipBtnText: { color: '#888888', fontSize: 13, fontWeight: '600', fontFamily: "'Roboto', sans-serif" },
});

export default LocationWebStyles;