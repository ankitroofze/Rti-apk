// styles/QuizResultStyles.js
import { StyleSheet, Platform } from 'react-native';
import { CommonStyles, COLORS, TYPOGRAPHY, BORDER_RADIUS } from './CommonStyles';

const QuizResultStyles = StyleSheet.create({
  root: CommonStyles.rootContainer,

  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  headerPlaceholder: {
    width: 30,
  },

  scrollContent: CommonStyles.scrollContainer,

  heroCard: CommonStyles.heroContainer,
  heroEyebrow: CommonStyles.heroEyebrow,
  heroTitle: CommonStyles.heroTitle,

  resultCard: {
    ...CommonStyles.largeCard,
    alignItems: 'center',
  },

  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.medium, // 7px
    marginBottom: 16,
  },
  passBadge: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenMid,
  },
  failBadge: {
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: COLORS.redMid,
  },
  resultText: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.headingWeight,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  passText: { color: COLORS.green },
  failText: { color: COLORS.red },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  infoValuePass: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.green,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  infoValueFail: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.red,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  certSectionLabel: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
certOuter: {
  width: '100%',
  maxWidth: 500,
  alignSelf: 'center',
  paddingHorizontal: 4,
},
  certFrame: {
    ...CommonStyles.mediumCard,
    borderWidth: 2,
    borderColor: '#b45309',
    backgroundColor: '#fef3c7',
    padding: 16,
  },
  certHeaderBand: {
    alignItems: 'center',
    marginBottom: 12,
  },
  certHeaderText: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: '#b45309',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certHeaderSub: {
    fontSize: 12,
    color: COLORS.textMid,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certSealRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  certSeal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#b45309',
  },
  certTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: '#b45309',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certPresented: {
    fontSize: 11,
    color: COLORS.textMid,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certName: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certDivider: {
    height: 1,
    backgroundColor: '#d97706',
    marginVertical: 10,
  },
  certBody: {
    fontSize: 13,
    color: COLORS.textMid,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certQuizTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  certScoreBox: {
    alignItems: 'center',
  },
  certScoreLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certScoreValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certScoreValuePass: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.green,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  certSignatureBox: {
    alignItems: 'center',
  },
  certSignatureLine: {
    width: 80,
    height: 1,
    backgroundColor: COLORS.textDark,
    marginBottom: 4,
  },
  certSignatureLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certStampBox: {
    alignItems: 'center',
  },
  certStamp: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  certStampText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: '#b45309',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  certFooterNote: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },

downloadBtn: { ...CommonStyles.greenButton, borderRadius: 3, marginTop: 8, marginBottom: 12, flex: 1 , width:190 },
downloadBtnText: CommonStyles.greenButtonText,
  savedNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  failMessageBox: {
    ...CommonStyles.largeCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.orangeLight,
    borderColor: COLORS.orangeMid,
  },
  failMessageText: {
    fontSize: 14,
    color: COLORS.orange,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
});

export default QuizResultStyles;