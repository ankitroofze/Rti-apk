import { StyleSheet, Platform } from 'react-native';

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Primary Orange: #ea580c
// Orange Light  : #FFE8F0
// Orange Mid    : #FFB3CC
// White         : #FFFFFF
// Page BG       : #F8F8F8
// Text Dark     : #111111
// Text Mid      : #555555
// Text Muted    : #999999
// Border        : #EEEEEE
// Green         : #16a34a
// Green Light   : #dcfce7
// Red           : #dc2626
// Red Light     : #fee2e2

const C = {
  orange:     '#ea580c',
  orangeLight:'#FFE8F0',
  orangeMid:  '#FFB3CC',
  white:      '#FFFFFF',
  pageBg:     '#F8F8F8',
  surface:    '#F5F5F5',
  textDark:   '#111111',
  textMid:    '#555555',
  textMuted:  '#999999',
  border:     '#EEEEEE',
  green:      '#16a34a',
  greenLight: '#dcfce7',
  greenMid:   '#86efac',
  red:        '#dc2626',
  redLight:   '#fee2e2',
};

const EPaperStyles = StyleSheet.create({

  // ── SafeArea & Root ───────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
    paddingTop: Platform.OS === 'android' ? 28 : 0,
  },
  root: {
    flex: 1,
    backgroundColor: C.pageBg,
  },

  // ── Status Bar Spacer (web only) ──────────────────────────────────────────
  statusBarSpacer: {
    height: 20,
    backgroundColor: C.white,
  },

  // ── Back Row ──────────────────────────────────────────────────────────────
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backText: {
    color: C.orange,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },

  // ── Status Badge ──────────────────────────────────────────────────────────
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Success Toast ─────────────────────────────────────────────────────────
  successOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    zIndex: 999,
    pointerEvents: 'none',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.greenLight,
    borderWidth: 1,
    borderColor: C.greenMid,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    elevation: 6,
    maxWidth: '85%',
  },
  successBoxText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    flexShrink: 1,
  },

  // ── Hero Card ─────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: C.orange,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: 11,
    color: C.orangeLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.white,
    marginBottom: 6,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    lineHeight: 19,
  },

  // ── Metrics Row ───────────────────────────────────────────────────────────
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricPrimary:   { borderTopWidth: 3, borderTopColor: C.orange },
  metricSecondary: { borderTopWidth: 3, borderTopColor: C.green },
  metricAccent:    { borderTopWidth: 3, borderTopColor: C.orangeMid },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: C.textDark,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // ── Add Button ────────────────────────────────────────────────────────────
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.orange,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },

  // ── Section Card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 14,
  },

  // ── Paper Card ────────────────────────────────────────────────────────────
  paperCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  paperTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  publishDate: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  paperTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 6,
    lineHeight: 22,
  },
  paperDesc: {
    fontSize: 12,
    color: C.textMid,
    marginBottom: 10,
    lineHeight: 19,
  },

  // ── Media Badge ───────────────────────────────────────────────────────────
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.orangeLight,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.orangeMid,
  },
  mediaBadgeText: { fontSize: 11, fontWeight: '700', color: C.orange },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText:  { fontSize: 12, fontWeight: '600', color: C.textMid },

  // ── Action Buttons ────────────────────────────────────────────────────────
  actionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1,
    minWidth: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.orangeLight,
    borderWidth: 1,
    borderColor: C.orangeMid,
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: C.orange },

  actionBtnDanger: {
    flex: 1,
    minWidth: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: '#e8732a',
  },
  actionBtnDangerText: { fontSize: 11, fontWeight: '700', color: C.red },

  adminActionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.greenLight,
    borderWidth: 1,
    borderColor: C.greenMid,
  },
  approveBtnText: { fontSize: 11, fontWeight: '700', color: C.green },

  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: '#e8732a',
  },
  rejectBtnText: { fontSize: 11, fontWeight: '700', color: C.red },

  // ── States ────────────────────────────────────────────────────────────────
  loadingText: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 12 },
  emptyText:   { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 16 },

  // ── Modal SafeArea & Layout ───────────────────────────────────────────────
  modalSafeArea: {
    flex: 1,
    backgroundColor: C.white,
  },
  viewModalSafeArea: {
    flex: 1,
    backgroundColor: C.orange,
  },
  modalKeyboardView: {
    flex: 1,
    backgroundColor: C.pageBg,
  },

  // ── Modal Header ──────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.orange,
  },
  modalCloseBtn: { padding: 6 },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  modalHeaderRight: { width: 72 },
  modalSaveBtn: {
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.orange,
  },

  // ── Form Modal Content ────────────────────────────────────────────────────
  modalScrollView: { flex: 1, backgroundColor: C.pageBg },
  modalContent: {
    padding: 16,
    paddingBottom: 60,
    backgroundColor: C.pageBg,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 6,
  },
  fieldLabelSpaced: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textDark,
    marginTop: 16,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 8,
  },

  // ── Web TextInput (fallback for RichEditor) ───────────────────────────────
  webTextInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.textDark,
    backgroundColor: C.white,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  webTextInputDesc: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.textDark,
    backgroundColor: C.white,
    textAlignVertical: 'top',
    marginBottom: 4,
  },

  // ── State Selector ────────────────────────────────────────────────────────
  stateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: C.white,
    marginTop: 4,
  },
  stateSelectorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: C.textDark,
  },
  stateSelectorPlaceholder: {
    color: C.textMuted,
    fontWeight: '400',
  },
  stateChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.pinkLight,
    borderWidth: 1,
    borderColor: C.pinkMid,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stateChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.orange,
  },

  // ── Rich Editor ───────────────────────────────────────────────────────────
  richToolbar: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
    height: 44,
  },
  richEditorTitle: {
    minHeight: 80,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: C.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 4,
    backgroundColor: C.white,
    overflow: 'hidden',
  },
  richEditorDesc: {
    minHeight: 160,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: C.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 4,
    backgroundColor: C.white,
    overflow: 'hidden',
  },
  richEditorInner: {
    backgroundColor: C.white,
    color: C.textDark,
    fontSize: 14,
    placeholderColor: C.textMuted,
    contentCSSText: 'font-family: sans-serif; padding: 10px; line-height: 1.6;',
  },

  // ── Media Showcase Card ───────────────────────────────────────────────────
  mediaShowcaseCard: {
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 20,
    padding: 16,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  mediaShowcaseEyebrow: {
    fontSize: 11,
    color: C.orange,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  mediaShowcaseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 6,
  },
  mediaShowcaseSubtitle: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 18,
    marginBottom: 14,
  },
  mediaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  mediaInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.orangeLight,
    borderWidth: 1,
    borderColor: C.orangeMid,
  },
  mediaInfoPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.orange,
  },
  mediaInfoPillAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.orangeLight,
    borderWidth: 1,
    borderColor: C.orangeMid,
  },
  mediaInfoPillAltText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.orange,
  },

  // ── Media Section ─────────────────────────────────────────────────────────
  mediaSection: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  mediaSectionCaption: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  mediaSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 10,
  },
  mediaPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.pinkMid,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: C.pinkLight,
  },
  mediaPickBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.orange,
  },
  videoPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.orangeMid,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: C.orangeLight,
  },
  thumbRow:  { marginTop: 12 },
  videoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  videoStatusText: { fontSize: 12, color: C.green, fontWeight: '700' },

  // ── State Picker Modal ────────────────────────────────────────────────────
  stateModalOverlay: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    justifyContent: 'center',
    padding: 18,
    zIndex: 1000,
  },
  stateModalBackdrop: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stateModalBox: {
    maxHeight: '80%',
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 18,
    elevation: 12,
  },
  stateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stateModalTitle: { fontSize: 16, fontWeight: '800', color: C.textDark },
  stateSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: C.surface,
  },
  stateSearchInput: { flex: 1, fontSize: 13, color: C.textDark, padding: 0 },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: C.surface,
  },
  stateItemActive:     { backgroundColor: C.orangeLight },
  stateItemText:       { fontSize: 13, fontWeight: '700', color: C.textMid },
  stateItemTextActive: { color: C.orange },

  // ── Image Thumbs ──────────────────────────────────────────────────────────
  imageThumbContainer: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.pinkMid,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4, right: 4,
    backgroundColor: C.red,
    borderRadius: 999,
    width: 18, height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Admin Note ────────────────────────────────────────────────────────────
  adminNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  adminNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#854d0e',
    fontWeight: '600',
    lineHeight: 18,
  },

  // ── View Modal ────────────────────────────────────────────────────────────
  viewModalContent: {
    padding: 16,
    paddingBottom: 60,
    backgroundColor: C.pageBg,
  },
  viewTextCard: {
    marginTop: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 16,
  },
  viewTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textDark,
    lineHeight: 28,
    marginBottom: 12,
  },
  viewDescriptionText: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 22,
  },
  viewImagesSection: { marginTop: 14 },
  viewImage: {
    width: 180,
    height: 130,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  videoAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.orangeLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.orangeMid,
  },
  videoAttachedText: {
    fontSize: 13,
    color: C.orange,
    fontWeight: '700',
  },
});


export default EPaperStyles;