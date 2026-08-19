import { Platform, StatusBar, StyleSheet } from 'react-native';

const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 4
  : 50;

const ORANGE        = '#F97316';
const ORANGE_LIGHT  = '#fff0f5';
const ORANGE_BORDER = '#ffd6e7';
const ORANGE_MUTED  = '#fdf2f7';

const PaymentStyles = StyleSheet.create({

  // ── Root ──
  root: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 8,
  },

  // ── Back Button ──
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingTop: SAFE_TOP,
    gap: 5,
  },
  backBtnText: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    marginTop: 14,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  heroEyebrow: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: { flex: 1 },
  ownerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  ownerEmail: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },

  // ── Order Card ──
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: ORANGE_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  orderIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: ORANGE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHeaderInfo: { flex: 1 },
  orderPlanName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderIdText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: ORANGE_BORDER,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: ORANGE,
  },

  // ── Pay Button ──
  payBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  payBtnDisabled: {
    opacity: 0.55,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  paymentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    color: '#b0b8cc',
    fontWeight: '600',
  },

  // ── Payment Note Card ──
  testHelperCard: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: ORANGE_MUTED,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    gap: 6,
  },
  testHelperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  testHelperTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ORANGE,
  },
  testHelperText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  testHelperValue: {
    fontWeight: '800',
    color: ORANGE,
  },

  // ── No Order Card ──
  noOrderCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  noOrderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14b87a',
  },

  // ── Card ──
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eef0f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },

  // ── History Card ──
  historyCard: {
    borderWidth: 1,
    borderColor: '#eef0f5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fafbfd',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  historyMetaBold: {
    fontWeight: '700',
    color: '#475569',
  },

  // ── Status Badge ──
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPending: { backgroundColor: '#fef3c7' },
  statusSuccess: { backgroundColor: '#dcfce7' },
  statusFailed:  { backgroundColor: ORANGE_LIGHT },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  statusTextPending: { color: '#92400e' },
  statusTextSuccess: { color: '#166534' },
  statusTextFailed:  { color: ORANGE },

  // ── View Status Button ──
  viewStatusBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: ORANGE_LIGHT,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
  },
  viewStatusBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ORANGE,
  },

  // ── Status Modal ──
  // ── Status Modal ──
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(15,23,42,0.45)',
  justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
  alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
},
modalCard: {
  backgroundColor: '#ffffff',
  borderRadius: Platform.OS === 'web' ? 24 : 0,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  padding: 24,
  paddingBottom: 40,
  ...(Platform.OS === 'web' && {
    width: '90%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflowY: 'auto',
  }),
},
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: ORANGE_BORDER,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalStatusWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalStatusBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  modalStatusText: {
    fontSize: 20,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // ── States ──
  loadingText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyText: {
    fontSize: 13,
    color: '#b0b8cc',
    textAlign: 'center',
    paddingVertical: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14b87a',
    textAlign: 'center',
    marginBottom: 14,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
});

export default PaymentStyles;