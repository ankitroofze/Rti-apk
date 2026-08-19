import { StyleSheet, Platform, StatusBar } from 'react-native';

// Orange tokens (mobile)
const O = {
  50:  '#FEF6EC',
  100: '#FDECD8',
  200: '#FBCFA0',
  400: '#ef810c',
  500: '#e07709',
  600: '#C8700F',
  800: '#7A420A',
};

const GREEN_BG     = '#E8F5E9';
const GREEN_TEXT   = '#2E7D32';
const RED_BG       = '#FCE4EC';
const RED_TEXT     = '#C62828';
const MAIN_BORDER  = '#EDE8E1';

export default StyleSheet.create({

  // ── Root ──────────────────────────────────────────────────────────────────
  root: { flex: 1, backgroundColor: '#F7F4F0' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 110 },

  // ── Top Bar ───────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8E1',
  },
  backButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#f5f5f5', borderRadius: 6, borderWidth: 1, borderColor: '#d0d0d0',
  },
  backButtonText: { color: '#be5600', fontSize: 14, fontWeight: '700', fontFamily: 'Roboto_700Bold' },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#111111', fontFamily: 'Roboto_900Black' },
  headerSpacer:   { width: 70 },

  // ── HERO BALANCE CARD ─────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: O[400],
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: O[600],
  },
  heroDecor1: { position: 'absolute', top: -50, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroDecor2: { position: 'absolute', bottom: -40, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBalanceLbl: {
    fontSize: 12, fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase', letterSpacing: 0.8,
    fontFamily: 'Roboto_700Bold',
  },
  heroAmount: {
    fontSize: 44, fontWeight: '900',
    color: '#ffffff', letterSpacing: -1,
    marginBottom: 4,
    fontFamily: 'Roboto_900Black',
  },
  heroHint: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '400', fontFamily: 'Roboto_400Regular' },
  heroBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  heroBadgeTxt: { fontSize: 13, fontWeight: '700', color: O[500], fontFamily: 'Roboto_700Bold' },

  // ── Credit / Debit Cards ─────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: '#ffffff',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EDE8E1',
    overflow: 'hidden',
  },
  statCardCredit: { borderColor: '#EDE8E1' },
  statCardDebit:  { borderColor: '#EDE8E1' },
  ribbonCorner: {
    position: 'absolute', top: 0, right: 0, width: 0, height: 0,
    borderTopWidth: 26, borderLeftWidth: 26,
    borderTopColor: O[400], borderLeftColor: 'transparent',
  },
  statTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  statIconCredit: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: O[50],
    alignItems: 'center', justifyContent: 'center',
  },
  statIconDebit: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FDEEEE',
    alignItems: 'center', justifyContent: 'center',
  },
  statBadgeCredit: {
    backgroundColor: GREEN_BG, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statBadgeCreditTxt: { 
    fontSize: 11, fontWeight: '700', color: GREEN_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },
  statBadgeDebit: {
    backgroundColor: RED_BG, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statBadgeDebitTxt: { 
    fontSize: 11, fontWeight: '700', color: RED_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },
  statTitle: { 
    fontSize: 13, fontWeight: '700', color: '#333333', 
    marginBottom: 6, fontFamily: 'Roboto_700Bold' 
  },
  statLbl: { 
    fontSize: 11, color: '#888888', fontWeight: '500', 
    fontFamily: 'Roboto_500Medium' 
  },
  statVal: { 
    fontSize: 20, fontWeight: '900', color: '#111111', 
    marginBottom: 2, fontFamily: 'Roboto_900Black' 
  },

  // ── SECTION HEADER ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10, marginTop: 4,
  },
  sectionTitle: { 
    fontSize: 15, fontWeight: '800', color: '#111111', 
    fontFamily: 'Roboto_900Black' 
  },
  sectionBadge: {
    backgroundColor: O[100], borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: O[200],
  },
  sectionBadgeText: { 
    fontSize: 11, fontWeight: '700', color: O[600], 
    fontFamily: 'Roboto_700Bold' 
  },

  // ── LATEST TRANSACTION CARD ───────────────────────────────────────────────
  latestCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#ffffff', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#EDE8E1',
  },
  latestCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  latestCardTitle: { 
    fontSize: 15, fontWeight: '800', color: '#111111', 
    fontFamily: 'Roboto_900Black' 
  },
  sourceBadge: {
    backgroundColor: O[100], borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: O[200],
  },
  sourceBadgeText: { 
    fontSize: 11, fontWeight: '700', color: O[600], 
    fontFamily: 'Roboto_700Bold' 
  },
  latestRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  latestLbl:  { 
    fontSize: 10, color: '#AAAAAA', fontWeight: '700', 
    textTransform: 'uppercase', letterSpacing: 0.4, 
    marginBottom: 4, fontFamily: 'Roboto_700Bold' 
  },
  latestAmt:  { 
    fontSize: 26, fontWeight: '900', color: '#111111', 
    fontFamily: 'Roboto_900Black' 
  },
  latestDate: { 
    fontSize: 12, color: '#AAAAAA', fontWeight: '500', 
    fontFamily: 'Roboto_500Medium' 
  },

  typePillCredit: {
    paddingHorizontal: 12, paddingVertical: 3,
    backgroundColor: GREEN_BG, borderWidth: 1, borderColor: '#A5D6A7', borderRadius: 20,
  },
  typePillDebit: {
    paddingHorizontal: 12, paddingVertical: 3,
    backgroundColor: RED_BG, borderWidth: 1, borderColor: '#EF9A9A', borderRadius: 20,
  },
  typeTxtCredit: { 
    fontSize: 12, fontWeight: '700', color: GREEN_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },
  typeTxtDebit:  { 
    fontSize: 12, fontWeight: '700', color: RED_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },

  // ── TRANSACTION TABLE ─────────────────────────────────────────────────────
  tableWrap: {
    marginHorizontal: 16, 
    marginBottom: 16,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: '#EDE8E1',
    backgroundColor: '#ffffff',
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#F5F5F5',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    fontSize: 10, fontWeight: '800', color: '#999999',
    textTransform: 'uppercase', letterSpacing: 0.5,
    fontFamily: 'Roboto_700Bold',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    backgroundColor: '#ffffff',
  },
  tableRowEven: { backgroundColor: '#FAFAFA' },

  colAmount: { flex: 1.1 },
  colType:   { flex: 0.8 },
  colSource: { flex: 1.2 },
  colDate:   { flex: 1, alignItems: 'flex-end' },

  amountCredit: { 
    fontSize: 12, fontWeight: '800', color: GREEN_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },
  amountDebit:  { 
    fontSize: 12, fontWeight: '800', color: RED_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },

  typePill: { 
    borderRadius: 20, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    alignSelf: 'flex-start',
  },
  typePillTextCredit: { 
    fontSize: 9, fontWeight: '700', color: GREEN_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },
  typePillTextDebit:  { 
    fontSize: 9, fontWeight: '700', color: RED_TEXT, 
    fontFamily: 'Roboto_700Bold' 
  },
  rowText:   { 
    fontSize: 11, color: '#666666', fontWeight: '500', 
    fontFamily: 'Roboto_500Medium' 
  },

  // ── PAGINATION ────────────────────────────────────────────────────────────
  paginationWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  paginationInfo: {
    fontSize: 11, color: '#888888', fontWeight: '500',
    fontFamily: 'Roboto_500Medium',
  },
  paginationControls: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  pageBtn: {
    minWidth: 28, height: 28, borderRadius: 999,
    borderWidth: 1, borderColor: '#d0d0d0',
    backgroundColor: '#ffffff', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 5,
  },
  pageBtnActive:   { backgroundColor: O[400], borderColor: O[400] },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText:     { 
    fontSize: 12, fontWeight: '700', color: '#555555', 
    fontFamily: 'Roboto_700Bold' 
  },
  pageBtnTextActive: { color: '#ffffff' },

  // ── STATES ────────────────────────────────────────────────────────────────
  loadingText: { 
    fontSize: 13, color: '#888888', paddingVertical: 40, 
    textAlign: 'center', fontFamily: 'Roboto_400Regular' 
  },
  emptyText: {
    fontSize: 13, color: '#888888', paddingVertical: 40, 
    textAlign: 'center', fontFamily: 'Roboto_400Regular'
  },
});