import { StyleSheet, Platform, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({

  // ── Reel Card ─────────────────────────────────────────────────────────────
  reel: {
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },

  // ✅ FIXED: Bottom gradient overlay — covers full bottom area
  reelOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    pointerEvents: 'none',
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
        pointerEvents: 'none',
      },
      default: {},
    }),
  },

  // ── Pause overlay ──────────────────────────────────────────────────────────
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pausedIcon: {
    fontSize: 64,
    opacity: 0.9,
  },

  // ── Top bar (mute only) ────────────────────────────────────────────────────
  reelTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  muteBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },

  // ── Tag Badge ──────────────────────────────────────────────────────────────
  reelTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  reelTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Action button (icon + count) ───────────────────────────────────────────
  reelActionBtn: {
    alignItems: 'center',
    gap: 4,
  },

  actionCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    ...Platform.select({
      web: { textShadow: '0px 1px 3px rgba(0,0,0,0.8)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },

  actionLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },

  igIcon: {
    fontSize: 28,
    color: '#fff',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0,0,0,0.6)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  igIconLiked: { color: '#ff3b5c' },
  igIconSaved: { color: '#f97316' },

  reelActionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Bottom info (inside video, bottom-left) ────────────────────────────────
  reelBottom: {
    position: 'absolute',
    left: 14,
    // right is set dynamically in ReelCard based on isMobileLayout
    zIndex: 5,
  },

  reelUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  reelUserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  reelUserName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    ...Platform.select({
      web: { textShadow: '0px 1px 3px rgba(0,0,0,0.9)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  reelUserRole: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
  },

  followBtn: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  followBtnFollowing: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  followBtnTextFollowing: {
    color: '#fff',
  },

  reelLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  reelLocationIcon: { fontSize: 11 },
  reelLocationText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
  },

  reelHeadline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 5,
    ...Platform.select({
      web: { textShadow: '0px 1px 4px rgba(0,0,0,0.95)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.95)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  reelCaption: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
  },
  reelCaptionMore: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  reelViewComments: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },

  // ── Modal Overlay ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  // ── Upload Sheet ───────────────────────────────────────────────────────────
  uploadSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // ── Comments Sheet ─────────────────────────────────────────────────────────
  commentsSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.75,
    minHeight: SCREEN_HEIGHT * 0.5,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexShrink: 1,
  },

  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // ── Upload Form ────────────────────────────────────────────────────────────
  mediaBox: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mediaBoxIcon: { fontSize: 30, marginBottom: 5 },
  mediaBoxText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  mediaBoxSub: { fontSize: 11, color: '#475569', marginTop: 2 },

  captionInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 13,
    fontSize: 13,
    color: '#f1f5f9',
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    marginBottom: 10,
  },

  tagLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  tagRow: { marginBottom: 16 },
  tagChip: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tagChipActive: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249,115,22,0.15)',
  },
  tagChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tagChipTextActive: { color: '#f97316', fontWeight: '800' },

  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  postBtn: {
    flex: 2,
    backgroundColor: '#f97316',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  postBtnText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // ── Comments List ──────────────────────────────────────────────────────────
  noComments: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 14,
    marginVertical: 28,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  commentUser: { fontSize: 12, fontWeight: '800', color: '#f1f5f9', marginBottom: 3 },
  commentText: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },

  commentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 10,
    color: '#64748b',
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  commentEditInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#f1f5f9',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 4,
  },
  commentActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  commentActionBtnActive: {
    backgroundColor: 'rgba(255,59,92,0.2)',
  },
  commentActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  commentActionTextActive: {
    color: '#ff3b5c',
  },
  commentMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commentMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  commentReplyForm: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  commentReplyInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#f1f5f9',
    backgroundColor: 'rgba(255,255,255,0.03)',
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
    backgroundColor: '#f97316',
  },
  commentReplyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  commentCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  commentCancelBtnText: {
    color: '#64748b',
  },
  commentReplies: {
    marginTop: 8,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  commentRepliesWrap: {
    marginTop: 8,
  },
  commentRepliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentRepliesLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  commentRepliesToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  commentReplyItem: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },
  commentReplyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentReplyAvatar: {
    marginTop: 2,
  },
  commentPostHeadline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  commentPostCaption: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  replyingPill: {
    backgroundColor: 'rgba(249,115,22,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  replyingText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '600',
  },
  replyingClose: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },

  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 13,
    color: '#f1f5f9',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { fontSize: 17, color: '#fff' },
  closeBtn: { alignItems: 'center', paddingVertical: 10 },
  closeBtnText: { fontSize: 14, color: '#475569', fontWeight: '600' },
});

export default styles;
