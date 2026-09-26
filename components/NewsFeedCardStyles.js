import { StyleSheet, Platform } from 'react-native';

const CARD_H_PAD = 16;
const CARD_MARGIN_H = 10;

const styles = StyleSheet.create({

  // ── Card shell ──
  storyCardShell: {
    backgroundColor: '#ffffff',
    paddingTop: 16,
    paddingBottom: 6,
    marginLeft: 4,
    marginRight: 10,
    marginTop: 10,
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1,
    borderColor: '#cbcdd1',
    overflow: 'visible',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(15, 23, 42, 0.07)' },
      default: {
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
    }),
  },
  // Android home feed is an editorial list: no floating card treatment, only
  // a clean white surface with a divider between consecutive news posts.
  androidStoryCardShell: {
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    borderWidth: 0,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
  },

  cardSeparator: {
    height: 10,
    backgroundColor: '#f2f3f5',
  },
  androidCardSeparator: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },

  // ── Author row ──
storyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ Center aligned
    paddingHorizontal: CARD_H_PAD,
    marginBottom: 12,
    ...(Platform.OS === 'android' && { flexWrap: 'wrap' }),
    gap: 6,
  },
  storyAuthorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
  },
  
  storyAuthorAvatarFallback: {
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAuthorAvatarInitial: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
storyAuthorTextWrap: {
    flex: 1,
    minWidth: 90,
    gap: 3,
  },
  storyAuthorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storyAuthorName: {
    color: '#0f172a',
    fontSize: 15.5,
    fontWeight: '600', // ✅ Weight 600
   fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
    flexShrink: 1,
  },

    storyMoreBtnTop: {
    padding: 8,
    marginLeft: 2,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  storyMoreBtnTopActive: {
    backgroundColor: 'transparent',
  },
  // ── Follow Button ──
storyFollowBtnWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
 storyFollowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
   storyFollowBtnActive: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 999,
  },
  storyFollowBtnDisabled: {
    opacity: 0.65,
  },
    storyFollowBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
   fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
   storyFollowBtnTextActive: {
    color: '#16a34a',
  },

  // ── Social Share Buttons (WhatsApp + Facebook) ──
 storySocialShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 2,
    flexShrink: 0,
  },
  storyShareCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── "Journalist" style badge pill (Shuru: dark navy bg + gold text) ──
 storyReporterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#0f2a5f',
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 4,
    maxWidth: '100%',
  },
  storyReporterPillText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '600', // ✅ Weight 600
   fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
    flexShrink: 1,
  },

  // ── Meta row ──
  storyAuthorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    flexWrap: 'wrap',
  },
  storyMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  storyMetaSmall: {
    color: '#94a3b8',
    fontSize: 12,
   fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '500',
  },

  // ── Text content ──
  storyContentWrap: {
    paddingHorizontal: CARD_H_PAD,
    marginBottom: 12,
  },
   storyHeadlineText: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
    marginBottom: 4,
  },
  storySubtitleText: {
    color: '#475569',
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  storyExcerptText: {
    color: '#374151',
    fontSize: 14.5,
    lineHeight: 22,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },
  storyDescriptionText: {
    color: '#374151',
    fontSize: 14.5,
    lineHeight: 22,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },

  inlineReadMoreWrap: {
    width: '100%',
  },
  inlineReadMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 3,
    paddingVertical: 2,
  },
  inlineReadMoreLink: {
    color: '#e11d48',
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Hero image ──
  storyHeroImageWrap: {
    marginHorizontal: CARD_H_PAD,
    height: 240,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
 storyHeroImage: {
    width: '100%',
    height: '100%',
  },

  fileAttachmentBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fileAttachmentName: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    maxWidth: '85%',
  },
  fileAttachmentBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fileAttachmentBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },

  topStoryRibbon: {
    position: 'absolute',
    top: 12,
    left: 0,
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopRightRadius: 6, // ✅ Border radius 6px
    borderBottomRightRadius: 6, // ✅ Border radius 6px
  },
  topStoryRibbonText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '600', // ✅ Weight 600
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  storyCategoryChip: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  storyCategoryChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Ad Lead Strip ──
  adLeadStrip: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6, // ✅ Border radius 6px
    padding: 8,
  },
  adLeadStripHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  adLeadStripHalfBordered: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  adCallOnlyStrip: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  adLeadStripText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Video overlays ──
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoadingBadge: {
    width: 48,
    height: 48,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoadingText: {
    fontSize: 22,
  },
  storyVideoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  storyVideoPlayBadge: {
    width: 58,
    height: 58,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(0,0,0,0.25)' },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
    }),
  },
  videoPlayingIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Shuru-style Info Row: Likes/Views (left) · Shares/View Post (right) ──
  storyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 12,
    paddingBottom: 4,
  },
  storyStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storyStatsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginLeft: 'auto',
  },
    storyStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIconCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  videoDurationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  storyExpandBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyStatText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#262626',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  storyStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#262626',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  storyViewPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storyViewPostText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#262626',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── LIKE / COMMENT / SHARE / BOOKMARK — Shuru-style bordered pill row ──
   singleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 6,
    paddingHorizontal: CARD_H_PAD,
    paddingBottom: 4,
    gap: 4,
  },
  singleActionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  singleActionItemActive: {
    backgroundColor: 'transparent',
  },
  singleActionText: {
    fontSize: 12.5,
    fontWeight: '700', // ✅ Shuru buttons use bold labels
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  singleActionTextActive: {
    color: '#ef4444',
  },
  singleActionBookmark: {
    padding: 8,
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },

  // ── Comment Section ──
  commentSection: {
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 11,
    paddingBottom: 13,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  commentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentUserAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 6, // ✅ Border radius 6px
  },
  commentUserAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    backgroundColor: '#f8fafc',
    maxHeight: 80,
    minHeight: 40,
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  commentsList: {
    gap: 10,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentReplyItem: {
    marginLeft: 40,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarImg: {
    width: 30,
    height: 30,
    borderRadius: 6, // ✅ Border radius 6px
  },
  commentAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 6, // ✅ Border radius 6px
    padding: 10,
  },
  commentAuthor: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600', // ✅ Weight 600
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentText: {
    color: '#1e293b',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },
  commentTime: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },
  commentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  commentActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  commentActionText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentActionTextLiked: {
    color: '#e11d48',
  },
  commentDeleteText: {
    color: '#ef4444',
  },
  commentEditContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6, // ✅ Border radius 6px
    padding: 8,
  },
  commentEditInput: {
    borderWidth: 1,
    borderColor: '#dbe3ee',
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    backgroundColor: '#ffffff',
    maxHeight: 80,
    minHeight: 40,
  },
  commentEditActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  commentEditBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 6, // ✅ Border radius 6px
  },
  commentEditBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentCancelBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 6, // ✅ Border radius 6px
  },
  commentCancelBtnText: {
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  commentReplyForm: {
    marginTop: 8,
    marginLeft: 8,
  },
  commentReplyInput: {
    borderWidth: 1,
    borderColor: '#dbe3ee',
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    backgroundColor: '#f8fafc',
    maxHeight: 80,
    minHeight: 40,
  },
  commentReplyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  commentReplyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 6, // ✅ Border radius 6px
  },
  commentReplyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentRepliesWrap: {
    marginTop: 8,
  },
  commentRepliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
    marginBottom: 4,
  },
  commentRepliesLine: {
    width: 24,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  commentRepliesToggleText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  commentReplies: {
    marginTop: 8,
  },

  // ── More Menu ──
  storyMoreMenuWrapper: {
    position: 'absolute',
    top: 52,
    right: CARD_H_PAD,
    zIndex: 999,
  },
  storyMoreMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  storyMoreMenuSheet: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#ffffff',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 10,
  },
  storyMoreMenuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 10,
  },
  storyMoreMenu: {
    width: 190,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)' },
      default: {
        elevation: 12,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
    }),
  },
  storyMoreMenuItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  storyMoreMenuText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Trending / Section Cards ──
  sectionBlockCard: {
    paddingHorizontal: CARD_H_PAD,
    marginVertical: 8,
  },
  sectionBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  trndCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
    overflow: 'hidden',
  },
  trndCardImg: {
    width: '100%',
    height: 80,
  },
  trndCategoryChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6, // ✅ Border radius 6px
  },
  trndCategoryChipText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  trndCardTitle: {
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    padding: 8,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  trndCardActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  trndActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trndActionText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },

  // ── Ad Top Box ──
  adTopBox: {
    paddingHorizontal: CARD_H_PAD,
    marginBottom: 8,
  },

  // ── Story Stats ──
  storyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 13,
    paddingBottom: 11,
  },
  storyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storyStatText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Action Buttons Row ──
  storyActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: CARD_H_PAD,
    paddingBottom: 13,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 11,
  },
  storySimpleStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_H_PAD,
    paddingTop: 13,
    paddingBottom: 13,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  storySimpleStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storySimpleStatText: {
    fontSize: 14.5,
    color: '#64748b',
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  storySimpleStatTextActive: {
    color: '#e11d48',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  storyActionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1.4,
    borderColor: '#eef0f4',
    backgroundColor: '#ffffff',
  },
  storyActionPillBtnActive: {
    backgroundColor: '#fdf2f7',
    borderColor: '#ffe0ed',
  },
  storyActionPillText: {
    fontSize: 14.5,
    color: '#374151',
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },

  // ── Secondary Share Row ──
  storySecondaryShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: CARD_H_PAD,
    paddingBottom: 13,
  },
  storyMoreBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  storyMoreBtnActive: {
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#f1f5f9',
  },

  // ── Top Meta Row ──
  storyTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_H_PAD,
    marginBottom: 10,
  },
  storyTopMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyTopCategoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#eff6ff',
  },
  storyTopCategoryPillText: {
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    color: '#2563eb',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  storyTopTimeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    fontWeight: '400',
  },

  // ── Byline ──
  storyByline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyBylineText: {
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    color: '#334155',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  storyBylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_H_PAD,
    marginTop: 12,
    marginBottom: 2,
  },

  // ── Ad Advertiser Row ──
  adAdvertiserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CARD_H_PAD,
    marginBottom: 10,
    gap: 10,
  },
  adAdvertiserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: '#e2e8f0',
  },
  adAdvertiserTextWrap: {
    flex: 1,
  },
  adAdvertiserName: {
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  adAdvertiserSubLabel: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
    marginTop: 1,
  },
});

export default styles;
