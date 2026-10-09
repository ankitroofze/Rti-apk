import { Platform, StatusBar, StyleSheet } from 'react-native';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';
const SAFE_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 4
  : 50;

const orange        = '#ea580c';
const orange_LIGHT  = '#FED7AA';
const orange_BORDER = '#FED7AA';
const orange_MUTED  = '#FED7AA';

// ✅ NEW: news-feed description ke saath match karne ke liye same Roboto family
const FONT = {
  regular: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  medium:  Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  bold:    Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  black:   Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_900Black',
};
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
    // ✅ Web par content ek center column me rahe (card left-stuck na lage)
      ...(Platform.OS === 'web'
      ? { width: '100%', maxWidth: 1100, marginHorizontal: 'auto' }
      : null),
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
   fontFamily: FONT.medium,},

  // ── Header (image background — screenshot jaisa) ──
       headerImageWrap: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#b91c1c',
    // ✅ Web par sidebar ke "NewsHub" brand bar (.qm-brand = 60px) ke barabar
    // height, taaki dono ki bottom line ek hi level par aaye
    ...(Platform.OS === 'web'
      ? { height: MODULE_HEADER_HEIGHT_WEB, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 20 }
      : { height: SAFE_TOP + 56, paddingTop: SAFE_TOP, paddingBottom: 16, paddingHorizontal: 16 }),
  },
   headerImageInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  headerBackBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: FONT.medium },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', fontFamily: FONT.medium },

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
    fontFamily: FONT.bold,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONT.regular,
  },

  // ── Plain Hero (screenshot jaisa — koi colored box nahi, seedha bold text) ──
  heroPlain: {
    marginTop: 14,
    marginBottom: 18,
    ...(Platform.OS === 'web' ? { paddingLeft: 290 } : null),
  },
  heroTitlePlain: {
    fontSize: 24,
    fontFamily: FONT.medium,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 6,
  },
  heroSubtitlePlain: {
    fontSize: 14,
    fontFamily: FONT.regular,
    color: '#374151',
    lineHeight: 20,
  },

  // ── Owner Row ──
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  ownerBadge: {
    width: 50,
    height: 50,
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
   fontFamily: FONT.bold,},
  ownerEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
   fontFamily: FONT.regular,},

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
   fontFamily: FONT.bold,},
  activeBannerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
   fontFamily: FONT.bold,},
  activeBannerMeta: {
    fontSize: 13,
    color: '#14b87a',
    fontWeight: '700',
   fontFamily: FONT.bold,},
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
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 14,
    fontFamily: FONT.medium,
  },

    // ── Plans Grid (2-column, screenshot jaisa, koi horizontal scroll nahi) ──
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  planCardWrap: {
    width: '48.5%',
    marginBottom: 14,
  },

   // ── Plan Card (2-column grid card) ──
  // NOTE: borderWidth यहाँ हमेशा fixed (3) रखा गया है — चाहे card select/active
  // हो या ना हो — सिर्फ borderColor बदलता है। Pehle select hone par borderWidth
  // 0 se 3 badalta tha, jispe grid ke sabhi cards ka layout re-measure hota
  // tha aur ImageBackground wale image kabhi-kabhi gayab/blank dikhne lagte
  // the (agla card click karte hi pehla card gayab ho jaata tha). Fixed
  // borderWidth rakhne se layout kabhi reflow nahi hota, to yeh bug fix ho
  // jaata hai.
    planCard: {
    height: 258,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
    planCardImage: {
      borderRadius: 18, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      ...(Platform.OS === 'web' ? { width: '100%', height: '100%' } : null),
    },
  planCardSelected: { borderColor: '#ffffff' },
  planCardActive: { opacity: 1, borderColor: '#16a34a' },

  // ── Horizontal Carousel + Side Arrows ──
  carouselRow: { flexDirection: 'row', alignItems: 'center' },
  carouselScroll: { flexGrow: 0 },
  carouselArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 6, borderWidth: 1, borderColor: orange_BORDER,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3,
  },
  carouselArrowDisabled: { opacity: 0.45 },

  // ── "Most Popular" ribbon ──
  popularBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.28)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  popularBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800', fontFamily: FONT.bold },

  // ── "Select Plan" pill andar card ke ──
   selectPlanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingVertical: 11, paddingHorizontal: 10,
  marginTop: 8, alignSelf: 'stretch',
    // ✅ Web par button poori card width na le — chhota rahe. Android/iOS same as before.
    ...(Platform.OS === 'web' ? { alignSelf: 'flex-start', width: 200, maxWidth: '100%' } : null),
  },
  selectPlanBtnActive: { backgroundColor: '#ffffff' },
selectPlanBtnText: { color: '#b91c1c', fontSize: 13, fontWeight: '800', fontFamily: FONT.bold, flexShrink: 1, textAlign: 'center' },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  planTitleWrap: {
    flex: 1,
  },
   planName: { fontSize: 15, fontWeight: '600', fontFamily: FONT.medium },
  planDuration: { fontSize: 11, marginTop: 2, marginBottom: 8, fontFamily: FONT.regular },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  planPrice: { fontSize: 22, fontWeight: '600', fontFamily: FONT.medium },
  planPriceOriginal: { fontSize: 13, textDecorationLine: 'line-through', fontFamily: FONT.regular },
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
   fontFamily: FONT.bold,},

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
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
    fontFamily: FONT.bold,
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
    fontFamily: FONT.bold,
  },

  // ── Fixed Bottom "Pay" Bar (screenshot ke Pay button jaisa) ──
  payBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f7',
    elevation: 12,
    shadowColor: orange,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  payBarLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 2,
    fontFamily: FONT.regular,
  },
  payBarPrice: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: FONT.medium,
  },
   payBtn: {
    minWidth: 140,
    borderRadius: 100,
    paddingHorizontal: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
payBtnImage: { borderRadius: 100, width: '100%', height: '100%', resizeMode: 'cover' },
  payBtnText: { fontSize: 16, fontWeight: '800', fontFamily: FONT.bold },
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
   fontFamily: FONT.bold,},

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
   fontFamily: FONT.bold,},
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
   fontFamily: FONT.medium,},
  seatLoadingText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    paddingVertical: 10,
   fontFamily: FONT.medium,},

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
   fontFamily: FONT.bold,},
  pendingPlanName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
   fontFamily: FONT.bold,},
  pendingPlanMeta: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
   fontFamily: FONT.medium,},

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
   fontFamily: FONT.medium,},
  seatItemNameDisabled: {
    color: '#b0b8cc',
  },
  seatItemStatus: {
    fontSize: 11,
    fontWeight: '500',
    color: orange,
    marginTop: 3,
   fontFamily: FONT.medium,},
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
  seatSubmitBtn: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#ea580c',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  seatSubmitBtnDisabled: {
    backgroundColor: '#fcd9b8',
  },
  seatSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
   fontFamily: FONT.bold,},
  // ── States ──
  loadingText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 10,
   fontFamily: FONT.regular,},
  emptyText: {
    fontSize: 13,
    color: '#b0b8cc',
    textAlign: 'center',
    paddingVertical: 10,
   fontFamily: FONT.regular,},
});

export default SubscriptionPlansStyles;