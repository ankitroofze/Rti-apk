import { StyleSheet } from 'react-native';

const ProfileStyles = StyleSheet.create({

  // ─── Root ──────────────────────────────────────────────────────────────────
  root:           { flex: 1, backgroundColor: '#ffffff', fontFamily: 'Roboto, sans-serif' },
  bgOrbPrimary:   { position: 'absolute', top: -40, left: -60,  width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(249,115,22,0.05)' },
  bgOrbSecondary: { position: 'absolute', top: 100, right: 10,  width: 60,  height: 60,  borderRadius: 30,  backgroundColor: 'rgba(249,115,22,0.07)' },
  bgOrbTertiary:  { position: 'absolute', bottom: 100, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.4)' },

  // ─── Top Bar ───────────────────────────────────────────────────────────────
  topBar: {
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarBackBtn: { width: 36, height: 36, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarIconBtn: { width: 36, height: 36, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },

  // ─── Scroll ────────────────────────────────────────────────────────────────
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  profileShell:  { gap: 0 },

  // ─── Summary Card ──────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#ffffff',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // ── TOP ROW: avatar LEFT + info RIGHT (Threads/Instagram style) ────────────
  summaryTopRow: {
    flexDirection: 'row',        // horizontal
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },

  // Avatar — LEFT side, bigger
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 3,
    borderColor: '#F97316',
  },
  avatar:    { width: 78, height: 78, borderRadius: 39, backgroundColor: '#FED7AA' },
  onlineDot: { position: 'absolute', bottom: 4, left: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#F97316', borderWidth: 3, borderColor: '#ffffff' },

  // Info — RIGHT side
  summaryContent: {
    flex: 1,
  },

  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: '#111111', flexShrink: 1, fontFamily: 'Roboto, sans-serif' },
  profileRole: { fontSize: 13, color: '#999999', fontWeight: '400', fontFamily: 'Roboto, sans-serif' },
  profileBio: {
  fontSize: 13,
  color: '#444444',
  lineHeight: 19,
  marginBottom: 12,
  marginTop: -4,
  fontFamily: 'Roboto, sans-serif',
},
  

  // ── Stats row: 0 posts | 1 follower | 1 following ─────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 6,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Roboto, sans-serif',
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
    marginTop: 1,
    fontFamily: 'Roboto, sans-serif',
  },

  summaryRankRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  summaryRankEmoji: { fontSize: 12 },
  summaryRankText:  { fontSize: 12, fontWeight: '600', color: '#555555', fontFamily: 'Roboto, sans-serif' },
  summaryDot:       { fontSize: 12, color: '#DDDDDD' },
  locationRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText:     { fontSize: 12, color: '#999999', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },

  // Progress bar section (below top row)
  metricRow: { width: '100%', marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabel:        { fontSize: 13, color: '#555555', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  metricValuePrimary: { fontSize: 15, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  metricRightBlock:   { alignItems: 'flex-end' },
  metricValueAccent:  { fontSize: 12, fontWeight: '700', color: '#F97316', fontFamily: 'Roboto, sans-serif' },

  uploadBarCard:  { width: '100%' },
  uploadBarTrack: { height: 7, backgroundColor: '#EEEEEE', borderRadius: 3, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  uploadWaveOne:  { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#111111', borderRadius: 3 },
  uploadWaveTwo:  { display: 'none', position: 'absolute', width: 0 },
  uploadDotOne:   { display: 'none', position: 'absolute', width: 0 },
  uploadDotTwo:   { display: 'none', position: 'absolute', width: 0 },
  uploadDotThree: { display: 'none', position: 'absolute', width: 0 },

  quickIconRow: {
  marginTop: 10,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
quickIconButtonText: {
  fontSize: 13,
  fontWeight: '700',
  color: '#111111',
  fontFamily: 'Roboto, sans-serif',
},
  quickIconButton: {
  flex: 1, height: 36, borderRadius: 3,
  alignItems: 'center', justifyContent: 'center',
  backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0',
},

  // Post News button
  quickPostNewsBtn: {
  flexDirection: 'row', alignItems: 'center',
  justifyContent: 'center', gap: 5, height: 36,
  paddingHorizontal: 20,
  backgroundColor: '#F97316', borderRadius: 3,
  borderWidth: 1, borderColor: '#F97316',
  alignSelf: 'flex-start',
},
quickPostNewsBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'Roboto, sans-serif' },

  // ─── Rank Card ─────────────────────────────────────────────────────────────
  rankCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ffffff', marginHorizontal: 12, marginBottom: 6,
    borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  rankIconWrap:   { width: 34, height: 34, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#E0E0E0' },
  rankEmoji:      { fontSize: 17 },
  rankLabel:      { fontSize: 9, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Roboto, sans-serif' },
  rankName:       { fontSize: 13, fontWeight: '700', color: '#111111', marginTop: 1, fontFamily: 'Roboto, sans-serif' },
  rankNext:       { fontSize: 10, color: '#AAAAAA', marginTop: 1, fontFamily: 'Roboto, sans-serif' },
  rankCountBadge: { marginLeft: 'auto', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', backgroundColor: '#F97316' },
  rankCountText:  { fontSize: 13, fontWeight: '800', color: '#ffffff', fontFamily: 'Roboto, sans-serif' },
  rankCountSub:   { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontFamily: 'Roboto, sans-serif' },

  // ─── Referral Card ─────────────────────────────────────────────────────────
  referralCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F97316', marginHorizontal: 12, marginBottom: 6,
    borderRadius: 6, paddingVertical: 11, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E07D16',
    gap: 10,
  },
  referralLeft:    { flex: 1 },
  referralLabel:   { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, fontFamily: 'Roboto, sans-serif' },
  referralCode:    { fontSize: 16, fontWeight: '800', color: '#ffffff', letterSpacing: 1, fontFamily: 'Roboto, sans-serif' },
  referralCopyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  referralCopyText:{ fontSize: 11, fontWeight: '700', color: '#ffffff', fontFamily: 'Roboto, sans-serif' },

  // ─── Dropdown ──────────────────────────────────────────────────────────────
  dropdownTrigger:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', minHeight: 44 },
  dropdownValue:         { flex: 1, color: '#111111', fontSize: 14, fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  dropdownPlaceholder:   { flex: 1, color: '#BBBBBB', fontSize: 14, fontFamily: 'Roboto, sans-serif' },
  dropdownList:          { position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 3, borderWidth: 1, borderColor: '#E0E0E0', zIndex: 9999, overflow: 'hidden' },
  dropdownItem:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  dropdownItemActive:    { backgroundColor: '#FFF7ED' },
  dropdownItemText:      { fontSize: 14, color: '#111111', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  dropdownItemTextActive:{ color: '#F97316', fontWeight: '700' },

  // ─── ID Card & Appointment Letter ──────────────────────────────────────────
  idCardTemplate:  { width: '100%', aspectRatio: 54 / 85 },
  idCardImage:     { resizeMode: 'cover' },
  idCardOverlay:   { ...StyleSheet.absoluteFillObject },
  idCardPhotoFrame:{ position: 'absolute', top: '30%', left: '30%', width: '40%', aspectRatio: 1, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0' },
  idCardNameValue: { position: 'absolute', top: '60%', left: '24%', right: '8%', fontSize: 11, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  idCardDesigValue:{ position: 'absolute', top: '65%', left: '24%', right: '8%', fontSize: 10, fontWeight: '600', color: '#333333', fontFamily: 'Roboto, sans-serif' },
  idCardAreaValue: { position: 'absolute', top: '70%', left: '24%', right: '8%', fontSize: 9.5, color: '#333333', fontFamily: 'Roboto, sans-serif' },
  idCardMoValue:   { position: 'absolute', top: '74.5%', left: '24%', right: '8%', fontSize: 9.5, color: '#333333', fontFamily: 'Roboto, sans-serif' },
  idCardIdValue:   { position: 'absolute', top: '79%', left: '24%', fontSize: 10, fontWeight: '800', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  idCardValidValue:{ position: 'absolute', top: '79%', right: '8%', fontSize: 9, fontWeight: '700', color: '#333333', fontFamily: 'Roboto, sans-serif' },

  apptTemplate:      { width: '100%', aspectRatio: 210 / 297 },
  apptImage:         { resizeMode: 'cover' },
  apptOverlay:       { ...StyleSheet.absoluteFillObject },
  apptNameValue:     { position: 'absolute', top: '55%', left: '24%', right: '10%', fontSize: 12, fontWeight: '700', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  apptDesigValue:    { position: 'absolute', top: '59%', left: '28%', right: '10%', fontSize: 11, fontWeight: '600', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  apptLocationValue: { position: 'absolute', top: '63%', left: '36%', right: '10%', fontSize: 10.5, fontWeight: '600', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  apptDateFromValue: { position: 'absolute', top: '67%', left: '24%', fontSize: 10.5, fontWeight: '600', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  apptDateToValue:   { position: 'absolute', top: '67%', left: '40%', fontSize: 10.5, fontWeight: '600', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  apptPhotoFrame:    { position: 'absolute', top: '61%', right: '14%', width: '18%', aspectRatio: 3 / 4, borderWidth: 1, borderColor: '#EEEEEE', backgroundColor: '#F5F5F5', overflow: 'hidden' },

  // ─── Saved Profile Card ────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: '#ffffff', marginHorizontal: 12, borderRadius: 6,
    marginBottom: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  headerStrip:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconWrap: { width: 28, height: 28, borderRadius: 3, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  cardTitle:      { fontSize: 14, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  cardSubtitle:   { fontSize: 11, color: '#999999', marginTop: 1, fontFamily: 'Roboto, sans-serif' },
  memberBadge:    { backgroundColor: '#FFF7ED', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#E0E0E0' },
  memberBadgeText:{ fontSize: 11, fontWeight: '700', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  divider:        { height: 1, backgroundColor: '#F5F5F5' },

  fieldList: { paddingHorizontal: 0, paddingVertical: 0 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 14,
    gap: 10, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  fieldRowFull:   { alignItems: 'flex-start' },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  accentBar:      { display: 'none', width: 0 },
  fieldIconWrap:  { width: 32, height: 32, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  fieldContent:   { flex: 1 },
  fieldLabel:     { fontSize: 10, fontWeight: '600', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, fontFamily: 'Roboto, sans-serif' },
  fieldValue:     { fontSize: 14, fontWeight: '500', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  fieldValueEmpty:{ color: '#CCCCCC', fontStyle: 'italic', fontWeight: '400' },
  statusDot:      { width: 7, height: 7, borderRadius: 3.5 },
  hintRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8F8F8', paddingHorizontal: 14, paddingVertical: 10 },
  hintText:       { fontSize: 11, color: '#999999', lineHeight: 16, flex: 1, fontFamily: 'Roboto, sans-serif' },
  hintBold:       { fontWeight: '700', color: '#F97316' },

  // ─── Edit Form ─────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: '#ffffff', marginHorizontal: 12, borderRadius: 6,
    padding: 16, marginBottom: 6,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  sectionHeading:   { fontSize: 17, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  sectionSubtitle:  { marginTop: 3, fontSize: 12, lineHeight: 17, color: '#999999', maxWidth: 200, fontFamily: 'Roboto, sans-serif' },
  successText:      { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#F97316', backgroundColor: '#FFF7ED', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 3, borderWidth: 1, borderColor: '#E0E0E0', fontFamily: 'Roboto, sans-serif' },
  uploadPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF7ED', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start', flexShrink: 0, borderWidth: 1, borderColor: '#E0E0E0' },
  uploadPillText:   { color: '#F97316', fontWeight: '700', fontSize: 12, fontFamily: 'Roboto, sans-serif' },

  previewRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8F8F8', borderRadius: 3, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  formPreviewAvatar:{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#FED7AA' },
  previewInfo:      { flex: 1 },
  previewTitle:     { fontSize: 13, fontWeight: '600', color: '#111111', marginBottom: 2, fontFamily: 'Roboto, sans-serif' },
  helperText:       { fontSize: 11, color: '#999999', lineHeight: 15, fontFamily: 'Roboto, sans-serif' },
  removeMiniButton: { width: 26, height: 26, borderRadius: 3, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0E0E0' },

  fieldGrid:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputGroup:     { width: '48.5%', marginBottom: 12 },
  fullWidthGroup: { width: '100%', marginBottom: 12 },
  inputLabel:     { fontSize: 11, fontWeight: '600', marginBottom: 6, color: '#666666', fontFamily: 'Roboto, sans-serif' },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 3, paddingHorizontal: 12, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', minHeight: 44 },
  inputWrapDisabled:{ backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
  input:            { flex: 1, color: '#111111', paddingVertical: 10, fontSize: 14, fontFamily: 'Roboto, sans-serif' },
  inputDisabled:    { color: '#BBBBBB' },
  textAreaWrap:     { alignItems: 'flex-start', paddingTop: 10 },
  textAreaIcon:     { marginTop: 2 },
  textArea:         { minHeight: 72, textAlignVertical: 'top', paddingTop: 0 },

  // ─── Documents Section ─────────────────────────────────────────────────────
  documentSection:      { marginTop: 8, marginBottom: 4, backgroundColor: '#F8F8F8', borderRadius: 3, padding: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  documentSectionTitle: { fontSize: 11, fontWeight: '700', color: '#AAAAAA', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Roboto, sans-serif' },
  documentRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  documentInfo:         { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  documentLabel:        { fontSize: 13, fontWeight: '600', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  autoDocHint:          { fontSize: 10, fontWeight: '700', color: '#F97316', fontFamily: 'Roboto, sans-serif' },
  documentSpacer:       { height: 10 },
  generatedDownloadBtn: { marginTop: 8, borderRadius: 3, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: '#F97316', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#E07D16' },
  generatedDownloadBtnAlt:{ backgroundColor: '#F97316' },
  generatedDownloadText:  { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'Roboto, sans-serif' },

  // ─── Form Footer ───────────────────────────────────────────────────────────
  formFooterRow:    { flexDirection: 'row', gap: 8, marginTop: 14 },
  cancelButton:     { flex: 1, borderRadius: 3, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  cancelButtonText: { color: '#666666', fontSize: 14, fontWeight: '600', fontFamily: 'Roboto, sans-serif' },
  submitButton:     { flex: 1, borderRadius: 3, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F97316', borderWidth: 1, borderColor: '#E07D16' },
  submitButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700', fontFamily: 'Roboto, sans-serif' },

  // ─── Misc ──────────────────────────────────────────────────────────────────
  stickyActionWrap: { paddingHorizontal: 12, paddingBottom: 6, paddingTop: 4 },
  stickyActionCard: { backgroundColor: '#ffffff', borderRadius: 3, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  actionTitle: { fontSize: 10, fontWeight: '700', color: '#BBBBBB', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Roboto, sans-serif' },
  actionRow:   { flexDirection: 'row' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E07D16' },
  updateButton:     { backgroundColor: '#F97316' },
  actionButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13, fontFamily: 'Roboto, sans-serif' },
  loadingText:      { textAlign: 'center', color: '#999999', fontSize: 12, marginTop: 12, fontFamily: 'Roboto, sans-serif' },

  followModalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  followModalCard: { maxHeight: '90%', backgroundColor: '#ffffff', borderTopLeftRadius: 3, borderTopRightRadius: 3, paddingTop: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  followModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  followModalTitle: { fontSize: 16, fontWeight: '800', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  followModalClose: { width: 32, height: 32, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  followModalList: { maxHeight: 420 },
  followModalListContent: { paddingVertical: 8, paddingBottom: 24 },
  followUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  followUserAvatar: { width: 42, height: 42, borderRadius: 3, backgroundColor: '#FED7AA', borderWidth: 1, borderColor: '#E0E0E0' },
  followUserInfo: { flex: 1 },
  followUserName: { fontSize: 14, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  followUserEmail: { marginTop: 2, fontSize: 11, color: '#999999', fontFamily: 'Roboto, sans-serif' },
  followEmptyText: { textAlign: 'center', color: '#999999', fontSize: 13, paddingVertical: 28, fontFamily: 'Roboto, sans-serif' },

  bottomShell:     { backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  bottomAppFooter: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: '#ffffff' },
  postNewsBtn: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, paddingHorizontal: 28, borderRadius: 3, backgroundColor: '#F97316',
    borderWidth: 1, borderColor: '#E07D16',
  },
  postNewsBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700', fontFamily: 'Roboto, sans-serif' },

  // Login prompt
  loginPromptWrap:     { alignItems: 'center', padding: 30, margin: 12, backgroundColor: '#ffffff', borderRadius: 3, borderWidth: 1, borderColor: '#E0E0E0' },
  loginPromptIconWrap: { width: 64, height: 64, borderRadius: 3, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  loginPromptHeading:  { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 6, fontFamily: 'Roboto, sans-serif' },
  loginPromptText:     { fontSize: 13, color: '#999999', textAlign: 'center', marginBottom: 16, fontFamily: 'Roboto, sans-serif' },
  loginPromptBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F97316', borderRadius: 3, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: '#E07D16' },
 loginPromptBtnText:  { color: '#ffffff', fontWeight: '700', fontSize: 14, fontFamily: 'Roboto, sans-serif' },

  // ─── Profile Metric Rows (Completion / Referral / Rank) — image match ─────
  metricRowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 3, marginHorizontal: 12, marginBottom: 8,
    paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E0E0E0',
  },
  metricIconWrap:      { width: 38, height: 38, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#E0E0E0' },
  metricBody:          { flex: 1 },
  metricLabel:         { fontSize: 11, color: '#999999', fontWeight: '600', marginBottom: 2, fontFamily: 'Roboto, sans-serif' },
  metricValue:         { fontSize: 15, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  metricSubValue:      { fontSize: 11, color: '#AAAAAA', marginTop: 2, fontFamily: 'Roboto, sans-serif' },
  metricProgressTrack: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0' },
  metricProgressFill:  { height: '100%', backgroundColor: '#F97316', borderRadius: 3 },
  metricCopyBtn:       { borderWidth: 1, borderColor: '#F97316', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  metricCopyBtnText:   { color: '#F97316', fontWeight: '700', fontSize: 12, fontFamily: 'Roboto, sans-serif' },

  // ─── Header name row (name + Post News button, side by side) ──────────────
  headerNameRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  memberIdRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  memberIdLabelText: { fontSize: 12, color: '#999999', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  memberIdValueText: { fontSize: 12, fontWeight: '800', color: '#F97316', fontFamily: 'Roboto, sans-serif' },

  // ─── Edit chip (Profile Details header) ────────────────────────────────────
  editChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 5 },
  editChipText: { fontSize: 12, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },

  // ─── View/Download button grid (bottom of Profile Details) ────────────────
  docButtonsWrap:       { padding: 14, gap: 8 },
  docButtonsRow:        { flexDirection: 'row', gap: 8 },
  docButtonPrimary:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F97316', borderRadius: 3, paddingVertical: 11, borderWidth: 1, borderColor: '#E07D16' },
  docButtonPrimaryText: { color: '#ffffff', fontSize: 13, fontWeight: '700', fontFamily: 'Roboto, sans-serif' },
  docButtonOutline:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ffffff', borderRadius: 3, paddingVertical: 11, borderWidth: 1, borderColor: '#E0E0E0' },
  docButtonOutlineText: { color: '#111111', fontSize: 13, fontWeight: '700', fontFamily: 'Roboto, sans-serif' },
});

export default ProfileStyles;