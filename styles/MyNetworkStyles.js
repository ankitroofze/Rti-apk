import { StyleSheet } from 'react-native';

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Orange       : #e8732a
// Orange Light : #FFF4EC
// Orange Border: #E0E0E0
// White        : #ffffff
// Page BG      : #F8F8F8
// Text Dark    : #111111
// Text Muted   : #888888
// Border       : #E0E0E0

const MyNetworkStyles = StyleSheet.create({

  // ─── Root ────────────────────────────────────────────────────────────────
  root:        { flex: 1, backgroundColor: '#F8F8F8', fontFamily: 'Roboto, sans-serif' },
  scrollView:  { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 110 },

  // ─── Top Bar ─────────────────────────────────────────────────────────────
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topBarBackBtn: {
    width: 36, height: 36, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  topBarTitle: {
    fontSize: 16, fontWeight: '700', color: '#111111',
    fontFamily: 'Roboto, sans-serif',
  },

  // Back button row (full touchable row at top) — replaces inline style
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    gap: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtnIcon: {
    width: 34, height: 34, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  backBtnText: {
    fontSize: 15, fontWeight: '700', color: '#111111',
    fontFamily: 'Roboto, sans-serif',
  },

  // ─── Metrics Row ─────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 12,
  },
  metricCard: {
    flex: 1, borderRadius: 3,
    paddingVertical: 16, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  metricPrimary:   { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0' },
  metricAccent:    { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0' },
  metricValue:     { fontSize: 26, fontWeight: '800', color: '#111111', marginBottom: 4, fontFamily: 'Roboto, sans-serif' },
  metricLabel:     { fontSize: 12, fontWeight: '600', color: '#888888', fontFamily: 'Roboto, sans-serif' },

  // ─── Main Card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 3, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: '#111111', marginBottom: 14,
    fontFamily: 'Roboto, sans-serif',
  },

  // ─── Search Bar ──────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 3, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#111111',
    paddingVertical: 0, fontWeight: '500',
    fontFamily: 'Roboto, sans-serif',
  },

  // ─── Results Info ────────────────────────────────────────────────────────
  resultsInfo: {
    fontSize: 12, color: '#888888', marginBottom: 10,
    fontWeight: '600', backgroundColor: '#ffffff',
    padding: 8, borderRadius: 3, textAlign: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
    fontFamily: 'Roboto, sans-serif',
  },

  // ─── Table ───────────────────────────────────────────────────────────────
  tableWrap: {
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 3, overflow: 'hidden',
    marginBottom: 14, backgroundColor: '#ffffff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 10, fontWeight: '800', color: '#111111',
    textTransform: 'uppercase', letterSpacing: 0.5,
    fontFamily: 'Roboto, sans-serif',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 13, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    alignItems: 'center', backgroundColor: '#ffffff',
  },
  tableRowEven:    { backgroundColor: '#FAFAFA' },
  currentUserRow:  {
    backgroundColor: '#FFF4EC',
    borderLeftWidth: 3, borderLeftColor: '#e8732a',
  },

  // ─── Column Widths ───────────────────────────────────────────────────────
  colUser:       { flex: 1.4, paddingRight: 8 },
  colReferred:   { flex: 1.2, paddingRight: 8 },
  colLevel:      { width: 55,  alignItems: 'center' },
  colCommission: { width: 75,  alignItems: 'center' },
  colAction:     { width: 40,  alignItems: 'center', justifyContent: 'center' },

  // ─── Cell Content ────────────────────────────────────────────────────────
  rowTitle:     { fontSize: 14, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  rowTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowBadge:     { marginTop: 1 },
  rowSubText:   { marginTop: 3, fontSize: 10, color: '#888888', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  rowText:      { fontSize: 12, color: '#555555', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },

  // ─── Level Badge ─────────────────────────────────────────────────────────
  levelBadge: {
    minWidth: 40, paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 3, backgroundColor: '#ffffff',
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  currentLevelBadge:     { backgroundColor: '#FFF4EC', borderColor: '#e8732a' },
  levelBadgeText:        { fontSize: 11, fontWeight: '800', color: '#555555', fontFamily: 'Roboto, sans-serif' },
  currentLevelBadgeText: { color: '#e8732a' },

  // ─── Commission ──────────────────────────────────────────────────────────
  commissionText: { fontSize: 13, fontWeight: '800', color: '#111111', fontFamily: 'Roboto, sans-serif' },

  // ─── Action Button ───────────────────────────────────────────────────────
  viewBtn: {
    width: 32, height: 32, borderRadius: 3,
    backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },

  // ─── Pagination ──────────────────────────────────────────────────────────
  paginationWrap: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 10,
  },
  pageBtn: {
    minWidth: 36, height: 36, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff', paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  pageBtnActive: {
    backgroundColor: '#e8732a', borderColor: '#e8732a',
  },
  pageBtnDisabled:    { opacity: 0.35 },
  pageBtnText:        { fontSize: 14, fontWeight: '700', color: '#555555', fontFamily: 'Roboto, sans-serif' },
  pageBtnTextActive:  { color: '#ffffff' },
  pageInfo: {
    fontSize: 12, color: '#888888', textAlign: 'center',
    fontWeight: '600', backgroundColor: '#ffffff',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 3, alignSelf: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
    fontFamily: 'Roboto, sans-serif',
  },

  // ─── States ──────────────────────────────────────────────────────────────
  loadingText: {
    fontSize: 14, color: '#888888',
    paddingVertical: 20, textAlign: 'center', fontWeight: '500',
    fontFamily: 'Roboto, sans-serif',
  },
  emptyText: {
    fontSize: 14, color: '#888888',
    paddingVertical: 28, textAlign: 'center',
    fontWeight: '500', backgroundColor: '#ffffff',
    borderRadius: 3, marginTop: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
    fontFamily: 'Roboto, sans-serif',
  },
});

export default MyNetworkStyles;
