import { StyleSheet } from 'react-native';

// Web-only layout for the split-screen Register page (image left / white form right).
// Only ever imported by RegisterScreen.web.js — never touches styles/RegisterStyles.js
// or anything the native (Android/iOS) build uses.
const RegisterWebStyles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },

  imagePanel: {
    flex: 1.75,
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePanelPicture: {
    width: '100%',
    height: '100%',
  },

  formPanel: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  },
  formPanelScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  formInner: {
    width: '100%',
    maxWidth: 420,
  },

  // Text overrides for a white background (originals are styled for a dark overlay)
  welcomeBack: { color: '#999999' },
  formTitle: { color: '#111111' },
  pageSubtitle: { color: '#6b7280' },
  darkLabel: { color: '#111111' },
  darkSwitchText: { color: '#555555' },
  darkSwitchLink: { color: '#B91C1C', fontWeight: '700' },

  compactBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  compactBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    fontFamily: "'Roboto', sans-serif",
  },
});

export default RegisterWebStyles;
