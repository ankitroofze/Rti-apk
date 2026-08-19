import { StyleSheet } from 'react-native';

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Primary Pink : #FF6600   Pink Light: #FFE8F0
// Black: #0f172a           Muted: #64748b
// BG: #F0F0F5              Card: #ffffff   Border: #EEEEEE

const AddNewsStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F0F5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 110 },

  // ─── Top Bar ─────────────────────────────────────────────────────────────
  topBar: {
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFE8F0', borderWidth: 1, borderColor: '#FFD0E6',
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  topBarRight: { width: 38, height: 38 },

  // ─── Hero Card ───────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 18, marginBottom: 12,
    elevation: 2, shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  heroEyebrow: {
    fontSize: 10, color: '#FF6600', fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  heroSubtitle: { fontSize: 12, color: '#64748b' },

  // ─── Generic Card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6,
  },

  // ─── Fields ──────────────────────────────────────────────────────────────
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 5 },
  fieldHint: { fontSize: 11, color: '#94a3b8', marginBottom: 7 },
  required: { color: '#FF6600' },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moreToggleText: { fontSize: 11, fontWeight: '700', color: '#FF6600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#F8F8F8', marginBottom: 4,
  },
  input: { flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 },
  inputExpanded: { minHeight: 70, textAlignVertical: 'top' },

  // ─── Rich Editor ─────────────────────────────────────────────────────────
  richToolbar: {
    backgroundColor: '#FFF0F5', borderTopLeftRadius: 10, borderTopRightRadius: 10,
    borderWidth: 1, borderColor: '#FFD0E6', borderBottomWidth: 0, height: 44,
  },
  richEditor: {
    minHeight: 160, borderWidth: 1, borderColor: '#EEEEEE',
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    backgroundColor: '#ffffff', overflow: 'hidden', marginBottom: 4,
  },
  richEditorExpanded: { minHeight: 220 },
  richEditorInner: {
    backgroundColor: '#ffffff', color: '#0f172a', fontSize: 14,
    placeholderColor: '#94a3b8',
    contentCSSText: 'font-family: sans-serif; padding: 8px; line-height: 1.6;',
  },
  webTextInput: {
    minHeight: 160, borderWidth: 1, borderColor: '#EEEEEE',
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    backgroundColor: '#ffffff', padding: 12, fontSize: 14,
    color: '#0f172a', textAlignVertical: 'top',
  },

  // ─── State Selector ──────────────────────────────────────────────────────
  stateSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 13, backgroundColor: '#F8F8F8',
  },
  stateSelectorText: { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '500' },
  locationLockCard: {
    borderWidth: 1, borderColor: '#FFD0E6', backgroundColor: '#FFF5F8',
    borderRadius: 14, padding: 14, marginBottom: 6,
  },
  locationLockHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  locationLockTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  locationLockSubtitle: { marginTop: 2, fontSize: 11, color: '#64748b' },
  locationLockBadge: {
    backgroundColor: '#FF6600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  locationLockBadgeText: { fontSize: 9, letterSpacing: 0.6, fontWeight: '800', color: '#ffffff' },
  locationLockText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  // ─── Media Toggles ───────────────────────────────────────────────────────
  mediaToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 6 },
  mediaToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#EEEEEE', backgroundColor: '#F8F8F8',
  },
  mediaToggleBtnActive: { borderColor: '#FF6600', backgroundColor: '#FFE8F0' },
  mediaToggleBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  mediaToggleBtnTextActive: { color: '#FF6600' },

  // ─── Media Pick Buttons ──────────────────────────────────────────────────
  mediaSection: { marginBottom: 12 },
  mediaPickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#FF6600', borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFF5F8',
  },
  mediaPickBtnText: { fontSize: 13, fontWeight: '700', color: '#FF6600' },
  mediaPickBtnDisabled: { borderColor: '#cbd5e1', backgroundColor: '#F8F8F8' },
  mediaPickBtnTextDisabled: { color: '#94a3b8' },
  videoPickBtn: { borderColor: '#FF6600', backgroundColor: '#FFF0F5' },
  videoPickBtnText: { color: '#FF6600' },
  filePickBtn: { borderColor: '#FF6600', backgroundColor: '#FFF5F8' },
  filePickBtnText: { color: '#FF6600' },

  fileInfoRow: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FFF5F8', borderWidth: 1, borderColor: '#FFD0E6',
  },
  fileInfoText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#FF6600' },
  fileRemoveBtn: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6600',
  },

  mediaStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  mediaStatusText: { fontSize: 12, color: '#FF6600', fontWeight: '700', flex: 1 },

  videoPreviewWrap: {
    marginTop: 10, borderRadius: 12, overflow: 'hidden',
    position: 'relative', borderWidth: 1, borderColor: '#EEEEEE',
  },
  videoPreview: { width: '100%', height: 190, backgroundColor: '#0f172a' },
  videoRemoveBtn: {
    position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.7)', alignItems: 'center', justifyContent: 'center',
  },

  thumbContainer: { position: 'relative', marginRight: 8 },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  thumbRemoveBtn: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#FF6600',
    borderRadius: 999, width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },

  // ─── Admin Note ──────────────────────────────────────────────────────────
  adminNoteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF5F8', borderWidth: 1, borderColor: '#FFD0E6',
    borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 12,
  },
  adminNoteText: { flex: 1, fontSize: 12, color: '#FF6600', fontWeight: '600', lineHeight: 18 },

  // ─── Submit Button ───────────────────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FF6600', borderRadius: 14, paddingVertical: 14, marginTop: 6,
    elevation: 4, shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },

  // ─── State Modal ─────────────────────────────────────────────────────────
  stateModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  stateModalBox: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '75%',
  },
  stateModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  stateModalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  stateSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, backgroundColor: '#F8F8F8',
  },
  stateSearchInput: { flex: 1, fontSize: 13, color: '#0f172a' },
  stateItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  stateItemActive: { backgroundColor: '#FFF5F8' },
  stateItemText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  stateItemTextActive: { color: '#FF6600', fontWeight: '700' },

  // ═══════════════════════════════════════════════════════════════════════════
  // WEB — Centered responsive layout
  // ═══════════════════════════════════════════════════════════════════════════

  // Full-page scroll container — grey background, centers the card
  webPageContainer: {
  flexGrow: 1,
  alignItems: 'center',
  paddingVertical: 20,
  paddingHorizontal: 0,
  backgroundColor: '#F0F0F5',
},

  // The white centered card — fills width up to 760px, never overflows
  webCard: {
  width: '100%',
  maxWidth: 980,
  backgroundColor: '#ffffff',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 4,
  alignSelf: 'center',
},

  // Header area (back btn + title row + stepper)
  webCardHeader: {
  paddingHorizontal: 16,
  paddingTop: 20,
  paddingBottom: 0,
},
  // Back button
  webBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 18,
  },
  webBackBtnText: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  // Title + badge row
  webFormHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  webFormHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  webFormHeaderSub: { fontSize: 13, color: '#64748b', fontWeight: '400' },
  webFormBadge: {
    backgroundColor: '#FFE8F0', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 999, marginTop: 2,
  },
  webFormBadgeText: { fontSize: 10, fontWeight: '800', color: '#CC1A5E', letterSpacing: 0.6 },

  // Divider
  webDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 16 },

  // ─── Stepper ─────────────────────────────────────────────────────────────
  webStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  webStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  webStepCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  webStepCircleActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  webStepCircleDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  webStepCircleText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  webStepLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  webStepLabelActive: { color: '#0f172a' },
  webStepLabelDone: { color: '#10b981' },
  webStepLine: {
    flex: 1, height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 8,
  },
  webStepLineDone: { backgroundColor: '#10b981' },

  // ─── Form fields area ────────────────────────────────────────────────────
  webFormContent: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    gap: 18,
  },

  webField: { flexDirection: 'column', gap: 5 },
  webLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  webHint: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },

  webInput: {
    borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#0f172a',
    backgroundColor: '#F8F9FB', textAlignVertical: 'top',
    outlineStyle: 'none',
  },
  webSelect: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 13, backgroundColor: '#F8F9FB',
  },
  webSelectText: { flex: 1, fontSize: 13, color: '#0f172a', fontWeight: '500' },

  // Two-column row — stacks on very small screens naturally via flex
  webRow2: { flexDirection: 'column', gap: 14 },

  // ─── Card Footer ─────────────────────────────────────────────────────────
  webCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexWrap: 'wrap',
  },
  webCancelBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
    borderColor: '#EEEEEE', backgroundColor: '#ffffff',
  },
  webCancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  // Web submit button (same base as mobile submitBtn but no marginTop)
  webSubmitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FF6600', borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 24,
    elevation: 2, shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  webSubmitBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
});

export default AddNewsStyles;
