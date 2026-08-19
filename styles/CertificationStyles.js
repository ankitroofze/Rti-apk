// styles/CertificationStyles.js
import { StyleSheet, Platform } from 'react-native';
import { CommonStyles, COLORS, TYPOGRAPHY, BORDER_RADIUS } from './CommonStyles';

const CertificationStyles = StyleSheet.create({
  root: CommonStyles.rootContainer,
  
  backRow: CommonStyles.backRow,
  backText: CommonStyles.backText,

  scrollView: { 
    flex: 1, 
    backgroundColor: COLORS.white 
  },
  scrollContent: CommonStyles.scrollContainer,

  heroCard: CommonStyles.heroContainer,
  heroEyebrow: CommonStyles.heroEyebrow,
  heroTitle: CommonStyles.heroTitle,

  metricsRow: CommonStyles.metricsContainer,
  metricCard: CommonStyles.metricCard,
  metricPrimary: { 
    ...CommonStyles.metricCard, 
    borderTopWidth: 3, 
    borderTopColor: COLORS.orange 
  },
  metricSecondary: { 
    ...CommonStyles.metricCard, 
    borderTopWidth: 3, 
    borderTopColor: COLORS.green 
  },
  metricAccent: { 
    ...CommonStyles.metricCard, 
    borderTopWidth: 3, 
    borderTopColor: COLORS.orangeMid 
  },
  metricValue: CommonStyles.metricValue,
  metricLabel: CommonStyles.metricLabel,

  card: CommonStyles.largeCard,
  sectionTitle: CommonStyles.sectionTitle,

  topButtonRow: {
    flexDirection: 'row',
    width: '55%',
    alignSelf: 'center',
    gap: 12,
    marginBottom: 14,
  },
  topButton: {
    ...CommonStyles.actionButton,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  certCard: CommonStyles.quizCard,
  certTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  certTitle: CommonStyles.quizTitle,

  resultBadge: CommonStyles.badgeContainer,
  passBadge: { 
    ...CommonStyles.badgeContainer, 
    backgroundColor: COLORS.greenLight, 
    borderWidth: 1, 
    borderColor: COLORS.greenMid 
  },
  retryBadge: { 
    ...CommonStyles.badgeContainer, 
    backgroundColor: COLORS.redLight, 
    borderWidth: 1, 
    borderColor: COLORS.redMid 
  },
  resultBadgeText: CommonStyles.badgeText,
  passText: { color: COLORS.green },
  failText: { color: COLORS.red },

  pendingBadge: {
    ...CommonStyles.badgeContainer,
    backgroundColor: COLORS.orangeLight,
    borderWidth: 1,
    borderColor: COLORS.orangeMid,
  },
  pendingBadgeText: {
    ...CommonStyles.badgeText,
    color: COLORS.orange,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  scoreText: { 
    fontSize: 13, 
    color: COLORS.textMid,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  scoreBold: { 
    fontWeight: TYPOGRAPHY.headingWeight, 
    color: COLORS.textDark,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  certFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
    backgroundColor: COLORS.greenLight,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.greenMid,
  },
  certFileText: { 
    fontSize: 12, 
    color: COLORS.green, 
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  actionRow: CommonStyles.actionRow,
  actionBtn: CommonStyles.actionButton,
  actionBtnGreen: CommonStyles.actionButtonGreen,
  actionBtnDisabled: {
    ...CommonStyles.actionButton,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  actionBtnText: CommonStyles.actionButtonText,
  actionBtnTextGreen: CommonStyles.actionButtonTextGreen,
  actionBtnTextDisabled: {
    ...CommonStyles.actionButtonText,
    color: COLORS.textMuted,
  },

  loadingText: { 
    fontSize: 13, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    paddingVertical: 12,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  emptyText: { 
    fontSize: 13, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    paddingVertical: 16,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
});

export default CertificationStyles;