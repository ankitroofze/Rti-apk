// styles/ChatStyles.js
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { COLORS as BASE } from './CommonStyles';

// ── Design tokens (kept consistent with CommonStyles.js) ──
export const C = {
  orange: BASE.orange,        // #F97316
  orangeLight: BASE.orangeLight,
  orangeMid: BASE.orangeMid,
  white: BASE.white,
  black: BASE.black,
  textDark: BASE.textDark,
  textMid: BASE.textMid,
  textMuted: BASE.textMuted,
  border: BASE.border,
  green: BASE.green,
  greenLight: BASE.greenLight,
  red: BASE.red,
  redLight: BASE.redLight,
  pageBg: '#F8F8F8',
  bubbleMine: '#FFF1E6',
  bubbleTheirs: '#FFFFFF',
  online: '#22C55E',
};

const HEADER_TOP =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight || 24) + 10
    : Platform.OS === 'web'
    ? 14
    : 54;

const ChatStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.white },
  root: { flex: 1, backgroundColor: C.pageBg },

  // ── Header (shared) ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: HEADER_TOP,
    paddingBottom: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 10,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textDark, flexShrink: 1 },
  headerSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  headerRightBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // ── Chat List: search + tabs ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark },

  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tabBtnTextActive: { color: C.orange },

  listContent: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 24 },

  // ── Chat row (list item) ──
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.orangeMid,
  },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarInitial: { fontSize: 18, fontWeight: '700', color: C.orange },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.online,
    borderWidth: 2,
    borderColor: C.white,
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },

  chatRowMain: { flex: 1, minWidth: 0 },
  chatRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatName: { fontSize: 15, fontWeight: '700', color: C.textDark, flexShrink: 1 },
  chatTime: { fontSize: 11, color: C.textMuted },
  chatRowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  chatLastMsg: { flex: 1, fontSize: 13, color: C.textMid },
  chatLastMsgUnread: { color: C.textDark, fontWeight: '600' },
  muteIcon: { marginLeft: 2 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: C.white },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 8,
  },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyStateText: { fontSize: 13, color: C.textMuted },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  // ── Conversation screen ──
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  presenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.online },

  messagesContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 14, gap: 4 },

  dateChipRow: { alignItems: 'center', marginVertical: 10 },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EFEFEF',
  },
  dateChipText: { fontSize: 11, fontWeight: '600', color: C.textMuted },

  bubbleRow: { flexDirection: 'row', marginBottom: 8, maxWidth: '100%' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },

  bubbleSenderName: { fontSize: 11, fontWeight: '700', color: C.orange, marginBottom: 2, marginLeft: 4 },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleMine: {
    backgroundColor: C.bubbleMine,
    borderTopRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: C.bubbleTheirs,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  bubbleText: { fontSize: 14, color: C.textDark, lineHeight: 20 },
  bubbleEditedTag: { fontSize: 10, color: C.textMuted, fontStyle: 'italic', marginTop: 2 },
  bubbleDeletedText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },

  bubbleMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 },
  bubbleTime: { fontSize: 10, color: C.textMuted },

  imageBubble: { width: 190, height: 140, borderRadius: 10, marginBottom: 4, backgroundColor: '#eee' },

  docBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 8,
    minWidth: 170,
  },
  docIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: C.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 12, fontWeight: '600', color: C.textDark },
  docMeta: { fontSize: 10, color: C.textMuted },

  voiceBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 160 },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#F0C9A6' },
  voiceDuration: { fontSize: 11, color: C.textMuted },

  locationBubble: {
    width: 190,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  locationMapPreview: {
    height: 90,
    backgroundColor: '#E8EDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  locationLabelText: { fontSize: 12, color: C.textDark, flexShrink: 1 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: C.bubbleTheirs,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderTopLeftRadius: 4,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.textMuted },
  typingText: { fontSize: 11, color: C.textMuted },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  attachBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.pageBg,
    paddingHorizontal: 12,
  },
  textInput: { flex: 1, fontSize: 14, color: C.textDark, paddingVertical: 8, maxHeight: 100 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Attachment sheet ──
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheetCard: {
    backgroundColor: C.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingBottom: 26,
    paddingHorizontal: 18,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 14 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  sheetItem: { width: '22%', alignItems: 'center', gap: 6 },
  sheetIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItemLabel: { fontSize: 11, color: C.textMid, textAlign: 'center' },

  // ── Message long-press action sheet (edit/delete) ──
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  actionSheetRowText: { fontSize: 14, color: C.textDark, fontWeight: '500' },
  actionSheetRowTextDanger: { color: C.red },

  // ── Group member limit / admin control rows ──
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  settingLabel: { fontSize: 14, color: C.textDark, fontWeight: '500' },
  settingSubLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 14, fontWeight: '700', color: C.textDark, minWidth: 26, textAlign: 'center' },
});

export default ChatStyles;