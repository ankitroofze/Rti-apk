// styles/WithdrawStyles.js
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';

const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 4
  : 50;

const PINK       = '#ea580c';
const PINK_LIGHT = '#fff0f5';
const PINK_BORDER= '#ffd6e7';

// ── Web / Orange theme tokens ──
const ORANGE       = '#ea580c';
const ORANGE_LIGHT = '#fff4f0';
const ORANGE_BORDER= '#ffd0c0';

// Font Family
const FONT_FAMILY = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto';

const WithdrawStyles = StyleSheet.create({

  // ══════════════════════════════════════════════════════
  //  MOBILE — original styles (untouched)
  // ══════════════════════════════════════════════════════

  root: { flex: 1, backgroundColor: '#f8f9fb' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 8 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: SAFE_TOP, paddingBottom: 12, gap: 6,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f0f2f7',
  },
  backBtnText: { 
    color: PINK, 
    fontSize: 14, 
    fontWeight: '600', 
    fontFamily: FONT_FAMILY,
  },

  heroCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 6,
    marginTop: 14,
    overflow: 'hidden',
    shadowColor: PINK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroEyebrow: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
    fontFamily: FONT_FAMILY,
  },
  heroBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
  },

  balanceCard: {
    backgroundColor: '#ffffff', 
    borderRadius: 6, // ✅ Border radius 6px
    padding: 18, 
    marginBottom: 14,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14,
    borderWidth: 1.5, 
    borderColor: PINK_BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  balanceInfo: { flex: 1 },
  balanceLabel: {
    fontSize: 11, 
    fontWeight: '600', // ✅ Weight 600
    color: PINK,
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  balanceValue: { 
    fontSize: 30, 
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },

  card: {
    backgroundColor: '#ffffff', 
    borderRadius: 12,
    padding: 16, 
    marginTop: 14,
    marginBottom: 14,
    borderWidth: 1, 
    borderColor: '#eef0f5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a', 
    marginBottom: 16,
    fontFamily: FONT_FAMILY,
  },

  tableTopRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 12,
  },
  recordCount: { 
    fontSize: 12, 
    color: '#9CA3AF', 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 11, 
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8',
    textTransform: 'uppercase', 
    letterSpacing: 0.6, 
    marginBottom: 7,
    fontFamily: FONT_FAMILY,
  },
  input: {
    borderWidth: 1.5, 
    borderColor: '#e8ecf4', 
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#f8f9fb', 
    paddingHorizontal: 14, 
    paddingVertical: 13,
    color: '#0f172a', 
    fontSize: 15, 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  inputError: { borderColor: PINK, backgroundColor: '#fff5f9' },
  errorText: { 
    marginTop: 5, 
    fontSize: 12, 
    color: PINK, 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  hintText: { 
    marginTop: 5, 
    fontSize: 11, 
    color: '#b0b8cc',
    fontFamily: FONT_FAMILY,
  },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1.5, borderColor: '#e8ecf4', backgroundColor: '#f8f9fb',
  },
  modeBtnActive: { backgroundColor: PINK, borderColor: PINK },
  modeBtnText: { 
    fontSize: 13, 
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8',
    fontFamily: FONT_FAMILY,
  },
  modeBtnTextActive: { color: '#ffffff' },

  submitButton: {
    marginTop: 8, 
    backgroundColor: PINK, 
    borderRadius: 6, // ✅ Border radius 6px
    paddingVertical: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'row', 
    gap: 8,
    shadowColor: PINK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonText: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: '600', // ✅ Weight 600
    letterSpacing: 0.3,
    fontFamily: FONT_FAMILY,
  },

  withdrawMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  withdrawMetaItem: { gap: 2 },
  withdrawMetaLabel: { 
    fontSize: 11, 
    color: '#b0b8cc', 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  withdrawMetaValue: { 
    fontSize: 13, 
    color: '#0f172a', 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 },
  checkBox: {
    width: 18, height: 18, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1.5, borderColor: '#e8ecf4', backgroundColor: '#f8f9fb',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: { backgroundColor: PINK, borderColor: PINK },
  checkLabel: { 
    fontSize: 13, 
    color: '#64748b', 
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb',
    borderWidth: 1.5, borderColor: '#e8ecf4', borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 13, 
    color: '#0f172a', 
    fontWeight: '500', 
    padding: 0,
    fontFamily: FONT_FAMILY,
  },

  requestCard: {
    borderWidth: 1, borderColor: '#eef0f5', borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    borderRadius: 10,
    padding: 14, marginBottom: 10, backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  requestCardEven: { backgroundColor: '#ffffff' },
  requestCardLast: { marginBottom: 0 },
  requestTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  requestAmount: { 
    fontSize: 22, 
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  statusPending:  { backgroundColor: '#fff4e0' },
  statusApproved: { backgroundColor: '#e6faf3' },
  statusCancelled: { backgroundColor: '#F3F4F6' },
  statusRejected: { backgroundColor: PINK_LIGHT },
  statusText: { 
    fontSize: 11, 
    fontWeight: '600', // ✅ Weight 600
    textTransform: 'capitalize',
    fontFamily: FONT_FAMILY,
  },
  statusTextPending:  { color: '#c47a00' },
  statusTextApproved: { color: '#14b87a' },
  statusTextCancelled: { color: '#6B7280' },
  statusTextRejected: { color: PINK },

  requestMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  requestMeta: { 
    fontSize: 13, 
    color: '#6B7280',
    fontFamily: FONT_FAMILY,
  },
  requestMetaBold: { 
    fontWeight: '600', // ✅ Weight 600
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  requestDate: { 
    marginTop: 6, 
    fontSize: 11, 
    color: '#b0b8cc',
    fontFamily: FONT_FAMILY,
  },

  paginationWrap: { marginTop: 14, gap: 8 },
  paginationInfo: { 
    fontSize: 12, 
    color: '#94a3b8', 
    textAlign: 'center', 
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  paginationControls: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 5, flexWrap: 'wrap',
  },
  pageBtn: {
    minWidth: 32, height: 32, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1, borderColor: '#e8ecf4', backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  pageBtnActive: { backgroundColor: PINK, borderColor: PINK },
  pageBtnDisabled: { backgroundColor: '#f8f9fb', borderColor: '#eef0f5', elevation: 0, shadowOpacity: 0 },
  pageBtnText: { 
    fontSize: 12, 
    fontWeight: '600', // ✅ Weight 600
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  pageBtnTextActive: { color: '#ffffff' },

  loadingText: { 
    fontSize: 13, 
    color: '#b0b8cc',
    fontFamily: FONT_FAMILY,
  },
  successText: {
    fontSize: 14, 
    fontWeight: '600', // ✅ Weight 600
    color: '#14b87a',
    textAlign: 'center', 
    marginBottom: 14, 
    backgroundColor: '#e6faf3',
    padding: 12, 
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1, 
    borderColor: '#b2ead8',
    fontFamily: FONT_FAMILY,
  },
  emptyText: { 
    fontSize: 13, 
    color: '#b0b8cc', 
    textAlign: 'center', 
    paddingVertical: 8,
    fontFamily: FONT_FAMILY,
  },

  // ══════════════════════════════════════════════════════
  //  WEB — Orange centered layout (Image 1 style)
  // ══════════════════════════════════════════════════════

  webPage: {
    flexGrow: 1,
    backgroundColor: '#f5f5f8',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },

  // ── Red image header — desktop web (same profile-red.png used on mobile) ──
  webHeader: {
    width: '100%',
    alignSelf: 'stretch',
    // ✅ image ab header ke bahar nahi nikalti
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    height: MODULE_HEADER_HEIGHT_WEB,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 0,
  },
  webHeaderImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  webHeaderBackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
  },
  webHeaderBackBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff', fontFamily: FONT_FAMILY },
  webHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', fontFamily: FONT_FAMILY },

  webBackBtn: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  webBackBtnText: { 
    fontSize: 14, 
    color: ORANGE, 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  webCard: {
    width: '100%',
    maxWidth: 950,
    backgroundColor: '#ffffff',
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1,
    borderColor: '#eeeeee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },

  webCardBody: {
    padding: 24,
  },

  webSectionTitle: {
    fontSize: 16,
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    letterSpacing: 0.3,
    marginBottom: 14,
    fontFamily: FONT_FAMILY,
  },

  webMetaRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  webMetaItem: { gap: 3 },
  webMetaLabel: { 
    fontSize: 11, 
    color: '#b0b8cc', 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  webMetaValue: { 
    fontSize: 13, 
    color: '#0f172a', 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  webInputGroup: { marginBottom: 16 },
  webInputLabel: {
    fontSize: 11, 
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8',
    textTransform: 'uppercase', 
    letterSpacing: 0.6, 
    marginBottom: 7,
    fontFamily: FONT_FAMILY,
  },
  webInput: {
    borderWidth: 1.5,
    borderColor: '#e8ecf4',
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#f8f9fb',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    outlineStyle: 'none',
    fontFamily: FONT_FAMILY,
  },
  webInputError: { borderColor: ORANGE, backgroundColor: '#fff8f5' },
  webErrorText: { 
    marginTop: 5, 
    fontSize: 12, 
    color: ORANGE, 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  webHintText: { 
    marginTop: 5, 
    fontSize: 11, 
    color: '#b0b8cc',
    fontFamily: FONT_FAMILY,
  },

  webCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  webCheckBox: {
    width: 18, height: 18, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1.5, borderColor: '#e8ecf4', backgroundColor: '#f8f9fb',
    alignItems: 'center', justifyContent: 'center',
  },
  webCheckBoxActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  webCheckLabel: { 
    fontSize: 13, 
    color: '#64748b', 
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },

  webModeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  webModeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1.5, borderColor: '#e8ecf4', backgroundColor: '#f8f9fb',
  },
  webModeBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  webModeBtnText: { 
    fontSize: 13, 
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8',
    fontFamily: FONT_FAMILY,
  },
  webModeBtnTextActive: { color: '#ffffff' },

  webSubmitBtn: {
    backgroundColor: ORANGE,
    borderRadius: 6, // ✅ Border radius 6px
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  webSubmitBtnDisabled: { opacity: 0.55 },
  webSubmitBtnText: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: '600', // ✅ Weight 600
    letterSpacing: 0.3,
    fontFamily: FONT_FAMILY,
  },

  webBalanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6, // ✅ Border radius 6px
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: ORANGE_BORDER,
    marginBottom: 0,
  },
  webBalanceInfo: { flex: 1 },
  webBalanceLabel: {
    fontSize: 11, 
    fontWeight: '600', // ✅ Weight 600
    color: ORANGE,
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  webBalanceValue: { 
    fontSize: 28, 
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },

  webSuccessText: {
    fontSize: 13, 
    fontWeight: '600', // ✅ Weight 600
    color: '#14b87a',
    textAlign: 'center', 
    marginBottom: 14, 
    backgroundColor: '#e6faf3',
    padding: 12, 
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1, 
    borderColor: '#b2ead8',
    fontFamily: FONT_FAMILY,
  },

  webTableCard: {
    width: '100%',
    maxWidth: 950,
    backgroundColor: '#ffffff',
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1,
    borderColor: '#eeeeee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  webTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  webTableTitle: { 
    fontSize: 15, 
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  webRecordCount: { 
    fontSize: 12, 
    color: '#b0b8cc', 
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  webTableBody: { padding: 16 },

  webSearchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f9fb', borderWidth: 1.5, borderColor: '#e8ecf4',
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8,
  },
  webSearchInput: { 
    flex: 1, 
    fontSize: 13, 
    color: '#0f172a', 
    fontWeight: '500', 
    padding: 0, 
    outlineStyle: 'none',
    fontFamily: FONT_FAMILY,
  },

  webRequestCard: {
    borderWidth: 1, borderColor: '#eef0f5', borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    borderRadius: 10,
    padding: 14, marginBottom: 10, backgroundColor: '#ffffff',
  },
  webRequestCardEven: { backgroundColor: '#fafbfd' },
  webRequestTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  webRequestAmount: { 
    fontSize: 18, 
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: FONT_FAMILY,
  },
  webRequestMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  webRequestMeta: { 
    fontSize: 12, 
    color: '#94a3b8',
    fontFamily: FONT_FAMILY,
  },
  webRequestMetaBold: { 
    fontWeight: '600', // ✅ Weight 600
    color: '#475569',
    fontFamily: FONT_FAMILY,
  },
  webRequestDate: { 
    marginTop: 6, 
    fontSize: 11, 
    color: '#b0b8cc',
    fontFamily: FONT_FAMILY,
  },

  webPaginationWrap: { marginTop: 12, gap: 8 },
  webPaginationInfo: { 
    fontSize: 12, 
    color: '#94a3b8', 
    textAlign: 'center', 
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
  webPaginationControls: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 5, flexWrap: 'wrap',
  },
  webPageBtn: {
    minWidth: 32, height: 32, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1, borderColor: '#e8ecf4', backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  webPageBtnActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  webPageBtnDisabled: { backgroundColor: '#f8f9fb', borderColor: '#eef0f5' },
  webPageBtnText: { 
    fontSize: 12, 
    fontWeight: '600', // ✅ Weight 600
    color: '#64748b',
    fontFamily: FONT_FAMILY,
  },
  webPageBtnTextActive: { color: '#ffffff' },

  webEmptyText: { 
    fontSize: 13, 
    color: '#b0b8cc', 
    textAlign: 'center', 
    paddingVertical: 12,
    fontFamily: FONT_FAMILY,
  },
  webLoadingText: { 
    fontSize: 13, 
    color: '#b0b8cc', 
    textAlign: 'center', 
    paddingVertical: 12,
    fontFamily: FONT_FAMILY,
  },
});

export default WithdrawStyles;