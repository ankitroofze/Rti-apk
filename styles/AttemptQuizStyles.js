// styles/AttemptQuizStyles.js
import { StyleSheet, Platform } from 'react-native';
import { CommonStyles, COLORS, TYPOGRAPHY, BORDER_RADIUS } from './CommonStyles';

const RED = '#dc2626';
const RED_DARK = '#b91c1c';
const RED_LIGHT = '#fef2f2';
const RED_MID = '#fecaca';

const AttemptQuizStyles = StyleSheet.create({
  root: CommonStyles.rootContainer,

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: RED_DARK,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  backBtn: {
    padding: 4,
  },
  topBarSpacer: {
    width: 30,
  },

  scrollContent: CommonStyles.scrollContainer,

  heroCard: { ...CommonStyles.heroContainer, backgroundColor: RED_DARK },
  heroEyebrow: { ...CommonStyles.heroEyebrow, color: RED_MID },
  heroTitle: { ...CommonStyles.heroTitle, color: '#ffffff' },

  card: {
    ...CommonStyles.largeCard,
    padding: 20,
  },

  quizProgress: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 8,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  progressBarWrap: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: RED,
    borderRadius: 999,
  },

  questionText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    lineHeight: 23,
    marginBottom: 16,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BORDER_RADIUS.medium, // 7px
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
  optionBtnSelected: {
    borderColor: RED,
    backgroundColor: RED_LIGHT,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelSelected: { 
    backgroundColor: RED 
  },
  optionLabelText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.textMid,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  optionLabelTextSelected: { 
    color: COLORS.white 
  },
  optionText: { 
    flex: 1, 
    fontSize: 14, 
    color: COLORS.textMid, 
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  optionTextSelected: { 
    color: RED, 
    fontWeight: TYPOGRAPHY.headingWeight 
  },

  nextBtn: { ...CommonStyles.primaryButton, backgroundColor: RED },
  nextBtnDisabled: { 
    ...CommonStyles.primaryButton, 
    backgroundColor: RED,
    opacity: 0.45 
  },
  nextBtnText: CommonStyles.primaryButtonText,
});

export default AttemptQuizStyles;