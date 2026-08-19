import { Platform, StatusBar, StyleSheet } from 'react-native';
import { OrganizeImportsMode } from 'typescript';

const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 4
  : 50;

const orange        = '#ea580c';
const orange_LIGHT  = '#FED7AA';
const orange_BORDER = '#FED7AA';
const orange_MUTED  = '#FED7AA';

const SubscriptionPlansStyles = StyleSheet.create({

  // ── Root ──
  root: {
    flex: 1,
    backgroundColor: '#f8f9fb',
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
    paddingHorizontal: 16,
    paddingTop: SAFE_TOP,
    paddingBottom: 12,
    gap: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  backBtnText: {
    color: orange,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: orange,
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
    marginTop: 14,
    shadowColor: orange,
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
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Owner Row ──
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  ownerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  ownerEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },

  // ── Active Banner ──
  activeBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  activeBannerLeft: {
    flex: 1,
  },
  activeBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activeBannerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  activeBannerMeta: {
    fontSize: 13,
    color: '#14b87a',
    fontWeight: '700',
  },
  activeBannerIcon: {
    marginLeft: 12,
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

  // ── Plan Card ──
  planCard: {
    backgroundColor: '#fafbfd',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#eef0f5',
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: orange,
    backgroundColor: orange_LIGHT,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  planTitleWrap: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  planDuration: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: orange,
    marginBottom: 10,
  },

  // ── Active Pill ──
  activePill: {
    backgroundColor: '#14b87a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Features ──
  featuresList: {
    marginBottom: 12,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    marginTop: 1,
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },

  // ── Tap hint ──
  tapHint: {
    marginTop: 8,
    fontSize: 12,
    color: orange,
    fontWeight: '700',
  },

  // ── Buy Button ──
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: orange,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ── Role Badge ──
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Seat Modal ──
  seatBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
      justifyContent: 'center',
    }),
  },
  seatList: {
    gap: 0,
    paddingBottom: 18,
  },
  seatItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  seatSheet: {
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: 460,
          borderRadius: 24,
        }
      : {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }),
    backgroundColor: '#ffffff',
    padding: 18,
    paddingBottom: 28,
    maxHeight: '78%',
  },
  seatHandle: {
    width: 36,
    height: 4,
    backgroundColor: orange_BORDER,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 16,
  },
  seatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  seatStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  seatStateDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: orange,
  },
  seatStateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  seatLoadingText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    paddingVertical: 10,
  },

  // ── Pending Plan Preview ──
  pendingPlanBox: {
    marginBottom: 14,
    backgroundColor: orange_MUTED,
    borderWidth: 1,
    borderColor: orange_BORDER, 
    borderRadius: 14,
    padding: 12,
  },
  pendingPlanLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pendingPlanName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  pendingPlanMeta: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // ── Seat Item ──
  seatItem: {
    borderWidth: 1.5,
    borderColor: '#eef0f5',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seatItemSelected: {
    borderColor: orange,
    backgroundColor: orange_LIGHT,
  },
  seatItemDisabled: {
    borderColor: '#f0f2f7',
    backgroundColor: '#fafbfd',
  },
  seatItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  seatItemNameDisabled: {
    color: '#b0b8cc',
  },
  seatItemStatus: {
    fontSize: 11,
    fontWeight: '500',
    color: orange,
    marginTop: 3,
  },
  seatItemStatusMuted: {
    color: '#b0b8cc',
  },
  seatCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 99,
    backgroundColor: orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCheckCircleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },

  // ── States ──
  loadingText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#b0b8cc',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export default SubscriptionPlansStyles;