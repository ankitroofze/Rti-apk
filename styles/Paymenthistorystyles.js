// styles/PaymentHistoryStyles.js
// ─────────────────────────────────────────────────────────
// Payment History screen — Subscription Plans jaisa hi header
// (HEADER_BG_IMAGE + same height/pattern) aur News Feed jaisa
// hi Roboto font family use karta hai, taaki poori app me
// design consistent rahe.
// ─────────────────────────────────────────────────────────
import { Platform, StatusBar, StyleSheet } from 'react-native';

const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 4
  : 50;

// ✅ Same Roboto family jo NewsFeedCard / SubscriptionPlans me use hoti hai
const FONT = {
  regular: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  medium:  Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  bold:    Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  black:   Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_900Black',
};

const orange = '#ea580c';
const green  = '#16a34a';
const red    = '#dc2626';
const grey   = '#6B7280';

const PaymentHistoryStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f9fb' },
    tableWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '800',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT.bold,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  tableDataRowAlt: { backgroundColor: '#fafafa' },
  tableCellText: {
    fontSize: 12,
    color: '#555555',
    fontFamily: FONT.regular,
  },

  // ── Header (SubscriptionPlansStyles ke headerImageWrap jaisa hi) ──
  headerImageWrap: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
       height: SAFE_TOP + 56,
    backgroundColor: '#B91C1C',
    paddingTop: SAFE_TOP,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerImageInner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 70 },
  headerBackBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: FONT.medium },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', fontFamily: FONT.medium },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    ...(Platform.OS === 'web' ? { width: '100%', maxWidth: 720, marginHorizontal: 'auto' } : null),
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    fontFamily: FONT.bold,
    marginBottom: 10,
    marginTop: 18,
  },

  // ── Module filter chips (All / Role / Ads / Ecom / Quiz) ──
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#374151', fontFamily: FONT.medium },
  filterChipTextActive: { color: '#ffffff' },

  // ── "Current Plan" card (per module) ──
  planCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F4',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  moduleIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  planCardBody: { flex: 1, minWidth: 0 },
  moduleLabel: { fontSize: 11, color: grey, fontFamily: FONT.medium, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  planCardName: { fontSize: 15, fontWeight: '700', color: '#111827', fontFamily: FONT.bold, marginBottom: 4, flexShrink: 1 },
  planCardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 2 },
  planCardMetaLabel: { fontSize: 10, color: grey, fontFamily: FONT.regular, textTransform: 'uppercase', letterSpacing: 0.3 },
  planCardMetaValue: { fontSize: 12, color: '#111827', fontFamily: FONT.medium, marginTop: 1 },
  planCardPrice: { fontSize: 15, fontWeight: '800', color: orange, fontFamily: FONT.bold, marginLeft: 8, flexShrink: 0 },

  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  statusPillActive: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC' },
  statusPillExpired: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  statusPillText: { fontSize: 10, fontWeight: '700', fontFamily: FONT.bold },

  // ── Transaction list row ──
  txnRow: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF0F4',
  },
  txnTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  txnPlanName: { fontSize: 14, fontWeight: '700', color: '#111827', fontFamily: FONT.bold, flex: 1, marginRight: 8 },
  txnAmount: { fontSize: 15, fontWeight: '800', color: '#111827', fontFamily: FONT.bold },
  txnMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  txnDateText: { fontSize: 12, color: grey, fontFamily: FONT.regular },
  txnOrderId: { fontSize: 10, color: '#9CA3AF', fontFamily: FONT.regular, marginTop: 4 },

  badgeSuccess: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC' },
  badgePending: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D' },
  badgeFailed:  { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  badgeSuccessText: { color: green },
  badgePendingText: { color: '#B45309' },
  badgeFailedText:  { color: red },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: { fontSize: 13, color: grey, fontFamily: FONT.regular, textAlign: 'center', marginTop: 10, lineHeight: 19 },
  loadingText: { fontSize: 13, color: grey, fontFamily: FONT.regular, textAlign: 'center', marginTop: 30 },

  noteBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  noteText: { fontSize: 11.5, color: '#9A3412', fontFamily: FONT.regular, lineHeight: 17 },
});

export default PaymentHistoryStyles;
export { FONT };