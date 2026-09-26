import { Platform, StatusBar, StyleSheet } from 'react-native';
import { MODULE_PAGE_BG } from '../constants/subscriptionThemes';

// ✅ Poore app jaisa hi Roboto family — headings ke liye
const FONT = {
  regular: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  medium:  Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  bold:    Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
};

export const C = {
  pageBg: MODULE_PAGE_BG,          // ✅ ab yeh shared constant se aata hai
  white: '#ffffff',
  textDark: '#111827',
  textNavy: '#1e293b',
  textMid: '#64748b',
  textMuted: '#94a3b8',
  border: '#e5e7eb',
  red: '#dc2626',
  redSoft: '#fee2e2',
   redPill: '#fdf3f4',
  green: '#16a34a',
  greenSoft: '#dcfce7',
   greenPill: '#f2fbf6',
  blue: '#2563eb',
  blueSoft: '#dbeafe',
  bluePill: '#f2f7fe',
  purple: '#7c3aed',
  purpleSoft: '#ede9fe',
    purplePill: '#f7f4fe',
  amber: '#d97706',
  amberSoft: '#fef3c7',
  accent: '#dc2626',
  accentSoft: '#fee2e2',
  accentBorder: '#fecdd3',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.pageBg },
  root: { flex: 1, backgroundColor: C.pageBg },
  statusBarSpacer: { height: 20, backgroundColor: C.pageBg },

  // Native (non-web) fallback header — unchanged design
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight || 24) + 10
        : Platform.OS === 'web'
        ? 14
        : 54,
    paddingBottom: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerInner: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 950 : '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.accentSoft,
    borderWidth: 1, borderColor: C.accentBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.textDark },
  headerGhost: { width: 38, height: 38 },

  scrollView: { flex: 1, backgroundColor: C.pageBg },
  scrollContent: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingTop: 20,
    paddingBottom: 96,
    backgroundColor: C.pageBg,
    minHeight: '100%',
    ...(Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 9999 } : {}),
  },

  // ── Hero banner ──
     heroCard: {
    backgroundColor: C.redPill,
    borderRadius: 16,
    minHeight: 110,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroTextWrap: { flex: 1, paddingHorizontal: 24 },
  heroCardImage: {
    borderRadius: 12,
  },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.redSoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
 
   heroTitle: { fontSize: 24, fontWeight: '800', color: C.textDark, fontFamily: FONT.bold },
  heroSubtitle: { fontSize: 13.5, color: C.textMid, marginTop: 3, fontFamily: FONT.regular },
  heroDecoIcon: { opacity: 0.18, marginLeft: 10 },

  // ── Stat cards row ──
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 200,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCardUnread: { backgroundColor: C.redPill },
  statCardRead: { backgroundColor: C.greenPill },
  statCardMessages: { backgroundColor: C.bluePill },
  statCardSystem: { backgroundColor: C.purplePill },
   statIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  statIconUnread: { backgroundColor: C.redSoft, borderColor: '#fca5a5' },
  statIconRead: { backgroundColor: C.greenSoft, borderColor: '#86efac' },
  statIconMessages: { backgroundColor: C.blueSoft, borderColor: '#93c5fd' },
  statIconSystem: { backgroundColor: C.purpleSoft, borderColor: '#c4b5fd' },
  statTextWrap: { flex: 1 },
   statValue: { fontSize: 22, fontWeight: '800', color: C.textDark, fontFamily: FONT.bold },
  statLabel: { fontSize: 12.5, color: C.textMid, marginTop: 1, fontFamily: FONT.regular },

  // ── Notification list card ──
  listCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 22,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  listTitleWrap: {},
    listTitle: { fontSize: 18, fontWeight: '800', color: C.textDark, fontFamily: FONT.bold },
  listTitleUnderline: {
    width: 38, height: 3, borderRadius: 2,
    backgroundColor: C.red, marginTop: 6,
  },
  listHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  filterPillText: { fontSize: 13, fontWeight: '600', color: C.textDark },
  markReadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  markReadPillText: { fontSize: 13, fontWeight: '700', color: C.textDark },

  notificationList: {},
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notificationContent: { flex: 1, minWidth: 0 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  notificationTitle: { fontSize: 14.5, fontWeight: '700', color: C.textNavy, fontFamily: FONT.bold },
  newBadge: {
    backgroundColor: C.red,
    borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  notificationMessage: { fontSize: 13, color: C.textMid, marginTop: 4, lineHeight: 18 },

  notificationRight: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  notificationTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationTime: { fontSize: 12, color: C.textMuted },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },

  stateCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 13, color: C.textMid },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.redPill,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.textDark },
  emptyText: { fontSize: 13, color: C.textMid, textAlign: 'center' },
});

export default styles;