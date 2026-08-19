import { StyleSheet } from 'react-native';

const SettingsStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

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
  itemEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
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