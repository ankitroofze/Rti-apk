import { StyleSheet } from 'react-native';

// Web-only layout for the split-screen Sign In page (image left / white form right).
// This file is only ever imported by LoginScreen.web.js, which Metro/Expo will
// automatically use for web builds and never for native (Android/iOS) builds.
// It does not replace or modify styles/LoginStyles.js.
const LoginWebStyles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },

  // Left illustration panel
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

  // Right form panel
  formPanel: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
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
    maxWidth: 400,
  },

  // Text overrides for a white background (originals are styled for a dark overlay)
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 8,
    fontFamily: "'Roboto', sans-serif",
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 28,
    fontFamily: "'Roboto', sans-serif",
  },
  darkLabel: { color: '#111111' },
  darkLink: { color: '#B91C1C' },
  darkSwitchText: { color: '#555555' },
  darkSwitchLink: { color: '#B91C1C', fontWeight: '700' },

  // Small brand mark shown above the form on narrow web widths (when the
  // image panel is hidden), so the page never feels like a blank white screen.
  compactBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  compactBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    fontFamily: "'Roboto', sans-serif",
  },
});

export default LoginWebStyles;
