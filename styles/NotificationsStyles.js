import { Platform, StatusBar, StyleSheet } from 'react-native';

const C = {
  // — Orange palette (web override) —
  orange: '#E07020',
  orangeSoft: '#fff3e8',
  orangeBorder: '#ffd4a8',
  orangeMuted: '#ffc07a',
  // — Original pink palette (app) —
  pink: '#FF2D78',
  pinkSoft: '#fff0f5',
  pinkBorder: '#ffe4ef',
  pinkMuted: '#ffc3d8',
  white: '#ffffff',
  bg: '#ffffff',
  pageBg: Platform.OS === 'web' ? '#fff7f0' : '#fffafb',
  textDark: '#0f172a',
  textMid: '#64748b',
  textMuted: '#94a3b8',
  greenBg: '#ecfdf5',
  greenText: '#047857',
  greenBorder: '#a7f3d0',
  yellowBg: '#fff7ed',
  yellowText: '#b45309',
  yellowBorder: '#ffd4a8',

  // accent = orange on web, pink on app
  accent: Platform.OS === 'web' ? '#E07020' : '#FF2D78',
  accentSoft: Platform.OS === 'web' ? '#fff3e8' : '#fff0f5',
  accentBorder: Platform.OS === 'web' ? '#ffd4a8' : '#ffe4ef',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
  },
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  statusBarSpacer: {
    height: 20,
    backgroundColor: C.white,
  },
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
    borderBottomColor: C.accentBorder,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerInner: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 950 : '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
    letterSpacing: 0.2,
  },
  headerGhost: {
    width: 38,
    height: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Web: center content at 640px max-width
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    paddingTop: 14,
    paddingBottom: 96,
    backgroundColor: C.pageBg,
    ...(Platform.OS === 'web'
      ? {
          alignSelf: 'center',
          width: '100%',
          maxWidth: 9999,
        }
      : {}),
  },
  // Web scroll outer wrapper — wrap scrollContent inside this on web
  scrollContentWeb: {
    backgroundColor: C.pageBg,
    paddingHorizontal: 24,
  },
  heroCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    marginHorizontal: Platform.OS === 'web' ? 0 : 0,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  heroEyebrow: {
    fontSize: 11,
    color: C.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 24,
    lineHeight: Platform.OS === 'web' ? 28 : 32,
    color: C.textDark,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: C.textMid,
  },
  ownerRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.accentBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
  },
  ownerEmail: {
    marginTop: 2,
    fontSize: 12,
    color: C.textMid,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  metricPrimary: {
    backgroundColor: C.accentSoft,
  },
  metricSecondary: {
    backgroundColor: Platform.OS === 'web' ? '#fff3e8' : '#fff7ed',
  },
  metricAccent: {
    backgroundColor: '#ecfdf5',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 2,
  },
  metricValueUnread: {
    fontSize: 26,
    fontWeight: '800',
    color: Platform.OS === 'web' ? C.orange : C.pink,
    marginBottom: 2,
  },
  metricValueRead: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2d9a6e',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 20,
    padding: 18,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    color: C.textDark,
    fontWeight: '700',
    marginBottom: 3,
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  livePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
  },
  stateCard: {
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fffdfd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: C.textMuted,
  },
  notificationList: {
    gap: 10,
  },
  notificationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    backgroundColor: C.white,
  },
  notificationCardUnread: {
    borderColor: C.accentBorder,
    backgroundColor: Platform.OS === 'web' ? '#fffaf6' : '#fffafd',
  },
  notificationCardRead: {
    borderColor: '#eef2f7',
    backgroundColor: '#fcfdff',
  },
  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: C.textDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: C.accent,
    marginTop: 2,
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: C.textMid,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  notificationDate: {
    fontSize: 11,
    color: C.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  unreadBadge: {
    backgroundColor: C.accentSoft,
    borderColor: C.accentBorder,
  },
  readBadge: {
    backgroundColor: C.greenBg,
    borderColor: C.greenBorder,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unreadBadgeText: {
    color: Platform.OS === 'web' ? '#b45309' : C.yellowText,
  },
  readBadgeText: {
    color: C.greenText,
  },
  actionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  actionButtonText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentSoft,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: C.textMuted,
    textAlign: 'center',
  },
});

export default styles;
export { C };
