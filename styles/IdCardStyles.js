import { StyleSheet } from 'react-native';

const IdCardStyles = StyleSheet.create({

  // ── CARD WRAPPER ──
  idCardPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
    elevation: 6,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: 'rgba(218, 213, 213, 0.76)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
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
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
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
  },
  idCardHeaderNetwork: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    lineHeight: 28,
    fontFamily: 'Poppins-Bold',
  },
  idCardHeaderSub: {
    fontSize: 18,
    color: '#8B2E1A',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  idCardHeaderReg: {
    fontSize: 11,
    color: '#1a3a8a',
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── PHOTO ROW ──
  idCardPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(218, 213, 213, 0.76)',
  },
  idCardLogoImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: 'cover',
  },
  idCardPhotoBox: {
    width: 138,
    height: 145,
    borderWidth: 2.5,
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
    width: 64,
    height: 64,
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
    backgroundColor: 'rgba(218, 213, 213, 0.76)',
  },
  idCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 6,
  },
  idCardKeyBold: {
    width: 66,
    fontSize: 13,
    fontWeight: '900',
    color: '#cc2200',
  },
  idCardKeyLight: {
    width: 66,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  idCardVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  idCardValLight: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  idCardValidUpto: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
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
    fontSize: 12,
    color: '#cc2200',
    fontWeight: '900',
    fontStyle: 'italic',
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
});

export default IdCardStyles;
