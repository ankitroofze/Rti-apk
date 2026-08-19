import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';
import { getResponsiveWindowWidth } from '../utils/webDevice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 1;
const GRID_COLS = 3;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
// Responsive helpers for mobile
const POST_THUMB_SIZE = Math.floor(THUMB_SIZE);
const AVATAR_SIZE = SCREEN_WIDTH < 360 ? 72 : SCREEN_WIDTH < 420 ? 80 : 88;
const NAME_FONT_SIZE = SCREEN_WIDTH < 360 ? 18 : 20;

const C = {
  orange1: '#FFD1AD',
  orange2: '#FFC39B',
  orange3: '#FFB58A',
  orange4: '#FF9967',
  orangeDark: '#CC5C1F',
  white: '#ffffff',
  border: '#FFD1AD',
  borderMid: '#FFB58A',
  text: '#0f172a',
  textSub: '#64748b',
  textMuted: '#94a3b8',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
};

const UserPublicProfileStyles = StyleSheet.create({

  // ── Root ──────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: C.white,
  },

  // ── Top Bar ───────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 10
      : 14,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray200,
    backgroundColor: C.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.gray100,
    borderWidth: 0.5,
    borderColor: C.gray200,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.gray200,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },

  // ── Scroll ────────────────────────────────────────────
  scrollView: {
    flex: 1,
    backgroundColor: C.white,
  },
  scrollContent: {
    paddingBottom: 96,
  },

  // ── Profile Header Section ────────────────────────────
  // name LEFT, avatar RIGHT  (AppKit style)
  profileSection: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
    backgroundColor: C.white,
  },
 profileTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},
  profileInfo: {
  flex: 1,
  paddingLeft: 14,
},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  name: {
    fontSize: NAME_FONT_SIZE,
    fontWeight: '700',
    color: C.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.orange4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  feedVerifiedBadge: {
    marginLeft: 4,
  },
  bioInline: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 19,
    marginBottom: 12,
  },

  // Followers / Following / Network stats
  statsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 36,
  marginTop: 4,
},
  statBox: {},
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },

  // Avatar — right side
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    padding: 3,
    backgroundColor: C.orange4,
    flexShrink: 0,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2 - 2,
    backgroundColor: C.orange1,
  },
  verifiedOnAvatar: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.orange4,
    borderWidth: 2,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Role / seat pills
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0E6',
    borderWidth: 0.5,
    borderColor: C.orange3,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.orangeDark,
  },
  seatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: C.gray100,
    borderWidth: 0.5,
    borderColor: C.gray200,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  seatPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.text,
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  locationLineText: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '500',
    flex: 1,
  },

  // ── Action Buttons ────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  subscribeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.orange4,
    borderRadius: 12,
    paddingVertical: 12,
  },
  subscribeBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.orange3,
    borderRadius: 12,
    paddingVertical: 12,
  },
  shareBtnText: {
    color: C.orangeDark,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Tabs + Grid Toggle ────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray100,
  },
  tabsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  tabBtn: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: C.orange4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.orange4,
  },
  gridToggleIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  // ── 3-column Post Grid ────────────────────────────────
  postGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},
postThumb: {
  width: POST_THUMB_SIZE,
  height: POST_THUMB_SIZE,
  borderRadius: 0,
  overflow: 'hidden',
  backgroundColor: C.orange1,
  margin: 0.25,
},
  postThumbImage: {
    width: '100%',
    height: '100%',
  },
  postThumbOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  postThumbOverlayText: {
    fontSize: 10,
    color: C.white,
    fontWeight: '600',
  },

  // ── Activity / Empty ──────────────────────────────────
  activityCard: {
    margin: 16,
    borderWidth: 0.5,
    borderColor: C.gray200,
    borderRadius: 16,
    padding: 16,
    backgroundColor: C.white,
    alignItems: 'center',
  },
  mutedText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '500',
  },

  // ── Feed Cards (list view) ────────────────────────────
  followModalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  followModalCard: { maxHeight: '72%', backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12 },
  followModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: C.gray200 },
  followModalTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  followModalClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray100 },
  followModalList: { maxHeight: 420 },
  followModalListContent: { paddingVertical: 8, paddingBottom: 24 },
  followUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.gray100 },
  followUserAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.orange1 },
  followUserInfo: { flex: 1 },
  followUserName: { fontSize: 14, fontWeight: '700', color: C.text },
  followUserEmail: { marginTop: 2, fontSize: 11, color: C.textMuted },
  followEmptyText: { textAlign: 'center', color: C.textMuted, fontSize: 13, paddingVertical: 28 },

  feedList: {
    padding: 12,
  },
  feedCard: {
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 13,
    backgroundColor: C.white,
    marginBottom: 10,
    marginHorizontal: 12,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 9,
  },
  feedAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.orange1,
  },
  feedHeaderMain: {
    flex: 1,
  },
  feedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  feedRoleMiniPill: {
    backgroundColor: '#FFF0E6',
    borderWidth: 0.5,
    borderColor: C.orange3,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  feedRoleMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.orangeDark,
  },
  feedName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    flexShrink: 1,
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  feedMetaText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
    maxWidth: 200,
  },
  feedMetaDot: {
    fontSize: 11,
    color: C.gray300,
    fontWeight: '700',
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    lineHeight: 23,
    marginBottom: 7,
  },
  feedDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '400',
  },
  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: C.orange1,
    marginBottom: 9,
  },
  feedVideoBox: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
    marginBottom: 9,
  },
  feedVideo: {
    width: '100%',
    height: 220,
  },
  feedGalleryScroll: {
    marginBottom: 9,
  },
  feedGalleryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedGalleryThumb: {
    width: 88,
    height: 64,
    borderRadius: 12,
    backgroundColor: C.orange1,
  },
  feedStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#fef3c7',
    borderWidth: 0.5,
    borderColor: '#fcd34d',
    paddingVertical: 3,
    paddingHorizontal: 9,
    marginBottom: 9,
  },
  feedStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#FFF0E6',
    paddingTop: 9,
  },
  feedActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  feedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
  },
  feedActionButtonActive: {
    backgroundColor: '#fff1f2',
    borderWidth: 0.5,
    borderColor: '#fecdd3',
  },
  feedActionText: {
    fontSize: 12,
    color: C.text,
    fontWeight: '700',
  },

  // ── Comment Modal ─────────────────────────────────────
  commentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  commentSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  commentList: {
    marginBottom: 8,
  },
  commentListContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  commentItem: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.gray200,
    backgroundColor: C.gray50,
    marginBottom: 8,
  },
  commentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  commentDate: {
    fontSize: 10,
    color: C.textMuted,
  },
  commentText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  commentEditInput: {
    borderWidth: 0.5,
    borderColor: C.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: C.text,
    backgroundColor: C.white,
    marginTop: 4,
  },
  commentActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
    borderWidth: 0.5,
    borderColor: '#fecaca',
  },
  commentActionBtnActive: {
    backgroundColor: '#fecaca',
  },
  commentActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  commentActionTextActive: {
    color: '#b91c1c',
  },
  commentMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF0E6',
    borderWidth: 0.5,
    borderColor: C.orange3,
  },
  commentMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.orangeDark,
  },
  commentEmptyText: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 0.5,
    borderColor: C.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
    backgroundColor: C.white,
  },
  commentSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.orange4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentReplyForm: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.gray200,
    backgroundColor: C.white,
  },
  commentReplyInput: {
    borderWidth: 0.5,
    borderColor: C.gray200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: C.text,
    backgroundColor: C.gray50,
    minHeight: 40,
    maxHeight: 80,
  },
  commentReplyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  commentReplyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.orange4,
  },
  commentReplyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.white,
  },
  commentCancelBtn: {
    backgroundColor: C.gray100,
  },
  commentCancelBtnText: {
    color: C.textSub,
  },
  commentReplies: {
    marginTop: 8,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: C.orange1,
  },
  commentReplyItem: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.gray100,
    backgroundColor: '#fafbfc',
    marginBottom: 6,
  },

  // Expandable description
  expandableContainer: {
    marginBottom: 9,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 3,
    gap: 3,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.orange4,
  },

  // Legacy compat
  premiumBadge: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#FFF0E6', borderWidth: 0.5, borderColor: C.orange3, maxWidth: 280 },
  metaPillText: { fontSize: 12, fontWeight: '700', color: C.orangeDark },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  locationText: { fontSize: 12, fontWeight: '600', color: C.textSub, backgroundColor: C.gray50, borderWidth: 0.5, borderColor: C.gray200, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
  emailText: { fontSize: 12, color: C.textMuted, textAlign: 'center' },
  loadingText: { marginTop: 10, fontSize: 12, color: C.textSub, textAlign: 'center', fontWeight: '500' },
  metricsRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 18 },
  metricBox: { flex: 1 },
  metricValue: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 1 },
  metricLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  bioCard: { marginTop: 12, borderWidth: 0.5, borderColor: C.gray200, borderRadius: 16, padding: 14, backgroundColor: C.white },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  bioText: { fontSize: 13, lineHeight: 20, color: '#475569' },
});

export default UserPublicProfileStyles;
