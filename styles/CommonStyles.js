// styles/CommonStyles.js
import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  orangeMid: '#FDBA74',
  white: '#FFFFFF',
  black: '#000000',
  textDark: '#111111',
  textMid: '#555555',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  green: '#16a34a',
  greenLight: '#F0FDF4',
  greenMid: '#86EFAC',
  red: '#DC2626',
  redLight: '#FEF2F2',
  redMid: '#FCA5A5',
  pageBg: '#FFFFFF', // Changed to white
};

export const TYPOGRAPHY = {
  fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  headingWeight: '600',
  bodyWeight: '400',
};

export const BORDER_RADIUS = {
  large: 8,
  medium: 7,
  small: 4,
};

export const CommonStyles = StyleSheet.create({
  // Container Styles
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 14,
    paddingBottom: 110,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },

  // Card Styles
  largeCard: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.large, // 8px
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  mediumCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium, // 7px
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Header Styles
  heroContainer: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: COLORS.orange,
    borderRadius: BORDER_RADIUS.large, // 8px
    paddingVertical: 22,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: 11,
    color: '#FED7AA',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.headingWeight, // 600
    color: COLORS.black,
    lineHeight: 32,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Button Styles
  primaryButton: {
    backgroundColor: COLORS.orange,
    borderRadius: BORDER_RADIUS.small, // 4px
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  greenButton: {
    backgroundColor: COLORS.green,
    borderRadius: BORDER_RADIUS.small, // 4px
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  greenButtonText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Back Button
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    marginBottom: 14,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Badge Styles
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.headingWeight,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Metrics Card
  metricsContainer: {
    width: '100%',
    maxWidth: 1100,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium, // 7px
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    marginBottom: 4,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Quiz Card
  quizCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium, // 7px
    padding: Platform.OS === 'web' ? 16 : 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    width: '100%',
  },
  quizTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.textDark,
    lineHeight: 22,
    flexShrink: 1,
    fontFamily: TYPOGRAPHY.fontFamily,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
   actionButton: {
    flexGrow: 1,
    flexBasis: Platform.OS === 'web' ? 0 : '30%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.small, // 4px
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: '#DC2626',
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  actionButtonGreen: {
    flexGrow: 1,
    flexBasis: Platform.OS === 'web' ? 0 : '30%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.small, // 4px
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenMid,
  },
  actionButtonTextGreen: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.headingWeight,
    color: COLORS.green,
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
});