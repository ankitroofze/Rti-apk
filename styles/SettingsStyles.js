import { StyleSheet, Platform } from 'react-native';

const SettingsStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },

  // ── Header ──
   header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#ffffff',
    marginTop: 1,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },

   // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 100,
    ...(Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 800 } : {}),
  },

  // ── Section Header ──
   sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Card ──
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },

  // ── List Item ──
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 14,
  },
  itemDestructive: {
    backgroundColor: '#fff5f5',
  },
   iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 20,
    color: '#1e293b',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  itemLabelDestructive: {
    color: '#ef4444',
  },

  // ── Inline Location Card ──
  inlineCard: {
    marginHorizontal: 12,
    marginTop: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 16,
  },
  inlineCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 12,
  },

  // ── Inputs ──
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 14,
  },

  // ── Dropdown ──
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  placeholder: {
    color: '#94a3b8',
  },

  // ── Save Button ──
  saveBtn: {
    marginTop: 4,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SettingsStyles;