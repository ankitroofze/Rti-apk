import { Platform, StyleSheet } from 'react-native';

const ID_CARD_FONT = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular';
const ID_CARD_FONT_BOLD = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold';
const ID_CARD_FONT_BLACK = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_900Black';

const IdCardStyles = StyleSheet.create({

  // ── CARD WRAPPER ──
   idCardShadowWrap: {
    marginBottom: 4,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  idCardPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  // ── HEADER ──
  idCardHeader: {
    backgroundColor: '#EB8C28',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
      idCardHeaderTitle: {
    fontSize: 26,
    fontWeight: Platform.OS === 'web' ? '800' : 'normal',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: ID_CARD_FONT_BOLD,
  },
  idCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  idCardMicIcon: {
    width: 44,
    height: 69,
    resizeMode: 'contain',
    marginleft: 37,
  },
  idCardHeaderNetwork: {
    fontSize: 28,
    fontWeight: Platform.OS === 'web' ? '900' : 'normal',
    color: '#1a1a1a',
    lineHeight: 28,
      marginRight: 67,
    fontFamily: ID_CARD_FONT_BLACK,
  },
    idCardHeaderSub: {
    fontSize: 18,
    color: '#8B2E1A',
    fontWeight: Platform.OS === 'web' ? '700' : 'normal',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: ID_CARD_FONT_BOLD,
  },
   idCardHeaderReg: {
    fontSize: 11,
    color: '#1a3a8a',
    fontWeight: Platform.OS === 'web' ? '700' : 'normal',
    marginTop: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: ID_CARD_FONT_BOLD,
  },
  // ── PHOTO ROW ──
  idCardPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
backgroundColor: '#ffffff',
  },
 
       idCardLogoImg: {
    width: 100,
    height: 100,
    borderRadius: 6,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
   idCardPhotoBox: {
    width: 138,
    height: 145,
    borderWidth: 0.5,
    borderColor: '#16a34a',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#d1d5db',
  },
  idCardPhoto: {
    width: '100%',
    height: '100%',
  },
              idCardQRBox: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idCardQRInner: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#1f2937',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  idCardQRText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1f2937',
  },
  idCardQRSubText: {
    fontSize: 6,
    color: '#374151',
    textAlign: 'center',
    marginTop: 2,
  },
  idCardQRImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // ── DETAILS ──
  idCardDetails: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
   
  },
  idCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
     idCardKeyBold: {
    width: 66,
    fontSize: 17,
    fontWeight: Platform.OS === 'web' ? '900' : 'normal',
    color: '#15803d',
    fontFamily: ID_CARD_FONT_BLACK,
  },
  idCardKeyLight: {
    width: 66,
    fontSize: 17,
    fontWeight: Platform.OS === 'web' ? '900' : 'normal',
    color: '#15803d',
    fontFamily: ID_CARD_FONT_BLACK,
  },
  idCardDesignationKey: {
  width: 68,
  fontSize: 17,
  fontWeight: '900',
  color: '#cc2200',
  flexShrink: 0,
},
     idCardVal: {
    flex: 1,
    fontSize: 17,
    fontWeight: Platform.OS === 'web' ? '900' : 'normal',
    color: '#cc2200',
    fontFamily: ID_CARD_FONT_BLACK,
  },
  idCardValLight: {
    flex: 1,
    fontSize: 17,
    fontWeight: Platform.OS === 'web' ? '900' : 'normal',
    color: '#cc2200',
    fontFamily: ID_CARD_FONT_BLACK,
  },
  idCardValidUpto: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },

    // ── IDENTITY BANNER ──
  identityLabelBar: {
    backgroundColor: '#15803d',
    alignItems: 'center',
    paddingVertical: 2,
  },
  identityLabelText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  identityGreenBar: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  identityGreenBlock: {
    width: 45,
    backgroundColor: '#15803d',
  },
  identityImgBox: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    overflow: 'hidden',
  },
  identityImg: {
    width: '100%',
    height: 66.5,
  },
  // ── PRESS FOOTER ──
  pressFooterWrapper: {
    overflow: 'hidden',
  },
  pressGreenBar: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  pressGreenBlock: {
    width: 45,
    alignSelf: 'stretch',
    backgroundColor: '#15803d',
  },
  pressApprovedCenter: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  pressApprovedFrom: {
    fontSize: 9,
    color: '#374151',
    fontWeight: '500',
  },
    pressApprovedName: {
    fontSize: 13,
    color: '#cc2200',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 1,
  },
  pressApprovedDesig: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'center',
    marginTop: 1,
  },

  // PRESS red box with green sides
  pressRedBar: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 1,
  },
  pressRedSideBlock: {
    flex: 1,
    backgroundColor: '#15803d',
  },
  pressRedBox: {
    backgroundColor: '#dc2626',
    paddingVertical: 0,
    paddingHorizontal: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressRedText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 12,
    fontStyle: 'italic',
  },

  // ── TEMPLATE OVERLAY (unchanged) ──
  idCardTemplate:   { width: '100%', aspectRatio: 54 / 85 },
  idCardImage:      { resizeMode: 'cover' },
  idCardOverlay:    { ...StyleSheet.absoluteFillObject },
  idCardPhotoFrame: { position: 'absolute', top: '30%', left: '30%', width: '40%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden' },
  idCardNameValue:  { position: 'absolute', top: '60%', left: '24%', right: '8%', fontSize: 11, fontWeight: '700', color: '#1f2937' },
  idCardDesigValue: { position: 'absolute', top: '65%', left: '24%', right: '8%', fontSize: 10, fontWeight: '600', color: '#374151' },
  idCardAreaValue:  { position: 'absolute', top: '70%', left: '24%', right: '8%', fontSize: 9.5, color: '#374151' },
  idCardMoValue:    { position: 'absolute', top: '74.5%', left: '24%', right: '8%', fontSize: 9.5, color: '#374151' },
  idCardIdValue:    { position: 'absolute', top: '79%', left: '24%', fontSize: 10, fontWeight: '800', color: '#b91c1c' },
  idCardValidValue: { position: 'absolute', top: '79%', right: '8%', fontSize: 9, fontWeight: '700', color: '#374151' },

  // ── BACK SIDE ──
  idCardBackPressBar: { backgroundColor: '#dc2626', alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  idCardBackPressText: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 9, fontStyle: 'italic' },
  idCardBackOrangeStrip: { backgroundColor: '#EB8C28', height: 8, width: '100%' },
  idCardBackLiveBar: { backgroundColor: '#dc2626', alignItems: 'center', paddingVertical: 8 },
  idCardBackLivePill: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 2, borderRadius: 2 },
  idCardBackLiveText: { fontSize: 22, fontWeight: '900', color: '#dc2626', letterSpacing: 3 },

  idCardBackBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, backgroundColor: '#fff' },
  idCardBackLogo: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#EB8C28' },
  idCardBackTitleLine1: { fontSize: 14, fontWeight: '900', color: '#111827', fontStyle: 'italic' },
  idCardBackTitleLine2: { fontSize: 14, fontWeight: '900', color: '#1d4ed8', fontStyle: 'italic' },

  idCardBackRulesTitle: { textAlign: 'center', fontSize: 13, fontWeight: '900', color: '#dc2626', marginBottom: 6, backgroundColor: '#fff' },
  idCardBackRulesWrap: { paddingHorizontal: 16, backgroundColor: '#fff' },
  idCardBackRuleRow: { flexDirection: 'row', marginBottom: 5 },
  idCardBackRuleBullet: { fontSize: 9, fontWeight: '700', color: '#1f2937', width: 14 },
  idCardBackRuleText: { flex: 1, fontSize: 9, lineHeight: 12, fontWeight: '600', color: '#1f2937' },

  idCardBackWarning: { marginHorizontal: 14, marginBottom: 8, textAlign: 'center', fontSize: 9, fontWeight: '800', color: '#dc2626', backgroundColor: '#fff' },
  idCardBackCall: { marginHorizontal: 14, marginBottom: 8, textAlign: 'center', fontSize: 9, lineHeight: 12, color: '#1d4ed8', fontWeight: '700', backgroundColor: '#fff' },
  idCardBackPill: { marginHorizontal: 14, marginBottom: 10, backgroundColor: '#EB8C28', borderRadius: 16, paddingVertical: 5, paddingHorizontal: 8 },
  idCardBackPillText: { textAlign: 'center', fontSize: 8, fontWeight: '800', color: '#111827' },

  idCardBackAppBox: { marginHorizontal: 12, marginBottom: 10, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  idCardBackAppHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  idCardBackAppBadge: { backgroundColor: '#111827', color: '#fff', fontSize: 8, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  idCardBackAppName: { fontSize: 12, fontWeight: '900', color: '#EB8C28' },
  idCardBackFeaturesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  idCardBackFeatureChip: { fontSize: 7, fontWeight: '700', color: '#1f2937', backgroundColor: '#f3f4f6', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  idCardBackDlBtn: { alignSelf: 'flex-start', backgroundColor: '#1d4ed8', color: '#fff', fontSize: 8.5, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, overflow: 'hidden' },

  idCardBackSite: { textAlign: 'center', fontSize: 9, fontWeight: '800', color: '#111827', marginHorizontal: 14, marginBottom: 4, backgroundColor: '#fff' },
  idCardBackProgram: { textAlign: 'center', fontSize: 9, fontWeight: '800', color: '#dc2626', marginHorizontal: 14, marginBottom: 10, backgroundColor: '#fff' },
  idCardBackFooter: { backgroundColor: '#15803d', paddingHorizontal: 12, paddingVertical: 10 },
  idCardBackFooterText: { textAlign: 'center', fontSize: 9, fontWeight: '800', color: '#fff', lineHeight: 13 },
});

export default IdCardStyles;