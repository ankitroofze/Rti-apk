import { Platform, StatusBar, StyleSheet } from 'react-native';

const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;

const fam = (native) => (Platform.OS === 'web' ? "'Roboto', sans-serif" : native);

const LiveStreamingStyles = StyleSheet.create({
  // ── Root ──
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 32,
      paddingTop: 16, // 👈 aur kam kiya (pehle 24 tha)
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    }),
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16, // 👈 kam kiya (pehle 20 tha)
    paddingBottom: 14, // 👈 kam kiya
    marginBottom: 12, // 👈 kam kiya (pehle 14 tha)
    elevation: 3,
    boxShadow: '0px 8px 18px rgba(15, 23, 42, 0.06)',
    ...(Platform.OS === 'web' && {
      padding: 20, // 👈 kam kiya (pehle 28 tha)
      borderWidth: 1,
      borderColor: '#e2e8f0',
    }),
  },
  heroEyebrow: {
    fontSize: 11, // 👈 kam kiya (pehle 12 tha)
    color: '#FF6600',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8, // 👈 kam kiya (pehle 1 tha)
    marginBottom: 2, // 👈 kam kiya (pehle 4 tha)
    fontFamily: 'Roboto_700Bold',
  },
  heroTitle: {
    fontSize: 18, // 👈 kam kiya (pehle 22 tha)
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6, // 👈 kam kiya (pehle 12 tha)
    fontFamily: 'Roboto_700Bold',
  },
  heroSubtitle: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    lineHeight: 17, // 👈 kam kiya (pehle 20 tha)
    color: '#475569',
    marginBottom: 10, // 👈 kam kiya (pehle 14 tha)
    fontFamily: 'Roboto_400Regular',
  },
  startLiveCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // 👈 kam kiya (pehle 8 tha)
    paddingHorizontal: 12, // 👈 kam kiya (pehle 14 tha)
    paddingVertical: 8, // 👈 kam kiya (pehle 10 tha)
    borderRadius: 3,
    overflow: 'hidden',
  },
  startLiveCtaText: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Roboto_700Bold',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: { flex: 1 },
  ownerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Roboto_700Bold',
  },
  ownerEmail: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Roboto_400Regular',
  },

  // ── Metrics ──
  metricsRow: {
    flexDirection: 'row',
    gap: 8, // 👈 kam kiya (pehle 10 tha)
    marginBottom: 12, // 👈 kam kiya (pehle 14 tha)
  },
  metricCard: {
    flex: 1,
    borderRadius: 8, // 👈 kam kiya (pehle 9 tha)
    paddingVertical: 12, // 👈 kam kiya (pehle 16 tha)
    paddingHorizontal: 8, // 👈 kam kiya (pehle 12 tha)
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricLive:     { backgroundColor: '#ffffff' },
  metricUpcoming: { backgroundColor: '#ffffff' },
  metricEnded:    { backgroundColor: '#ffffff' },
  liveMetricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // 👈 kam kiya (pehle 6 tha)
  },
  liveDot: {
    width: 6, // 👈 kam kiya (pehle 8 tha)
    height: 6, // 👈 kam kiya (pehle 8 tha)
    borderRadius: 3,
    backgroundColor: '#FF6600',
  },
  metricValue: {
    fontSize: 20, // 👈 kam kiya (pehle 24 tha)
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2, // 👈 kam kiya (pehle 4 tha)
    fontFamily: 'Roboto_700Bold',
  },
  metricLabel: {
    fontSize: 10, // 👈 kam kiya (pehle 11 tha)
    fontWeight: '700',
    color: '#475569',
    fontFamily: 'Roboto_700Bold',
  },

  // ── Card ──
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14, // 👈 kam kiya (pehle 16 tha)
    marginBottom: 12, // 👈 kam kiya (pehle 14 tha)
    elevation: 3,
    boxShadow: '0px 6px 16px rgba(15, 23, 42, 0.05)',
  },
  sectionTitle: {
    fontSize: 15, // 👈 kam kiya (pehle 16 tha)
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10, // 👈 kam kiya (pehle 14 tha)
    fontFamily: 'Roboto_700Bold',
  },
  playerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8, // 👈 kam kiya (pehle 10 tha)
  },
  playerLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // 👈 kam kiya (pehle 6 tha)
    paddingHorizontal: 8, // 👈 kam kiya (pehle 10 tha)
    paddingVertical: 3, // 👈 kam kiya (pehle 5 tha)
    borderRadius: 999,
    backgroundColor: '#ffe4ee',
  },
  playerLivePillText: {
    fontSize: 10, // 👈 kam kiya (pehle 11 tha)
    fontWeight: '800',
    color: '#FF6600',
    fontFamily: 'Roboto_700Bold',
  },
  playerShell: {
    overflow: 'hidden',
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    backgroundColor: '#020617',
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  playerUnavailable: {
    width: '100%',
    aspectRatio: 16 / 9,
    padding: 14, // 👈 kam kiya (pehle 18 tha)
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  playerUnavailableTitle: {
    fontSize: 14, // 👈 kam kiya (pehle 16 tha)
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4, // 👈 kam kiya (pehle 8 tha)
    fontFamily: 'Roboto_700Bold',
  },
  playerUnavailableText: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    lineHeight: 17, // 👈 kam kiya (pehle 19 tha)
    textAlign: 'center',
    color: '#cbd5e1',
    fontFamily: 'Roboto_400Regular',
  },
  playerUnavailableMeta: {
    marginTop: 6, // 👈 kam kiya (pehle 10 tha)
    fontSize: 10, // 👈 kam kiya (pehle 11 tha)
    color: '#94a3b8',
    fontFamily: 'Roboto_400Regular',
  },
  playerCaption: {
    marginTop: 8, // 👈 kam kiya (pehle 10 tha)
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    color: '#475569',
    fontFamily: 'Roboto_400Regular',
  },

  // ── Stream Card ──
  streamCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    padding: 12, // 👈 kam kiya (pehle 16 tha)
    marginBottom: 10, // 👈 kam kiya (pehle 12 tha)
    backgroundColor: '#fafafa',
  },
  streamCardLive: {
    borderColor: '#ffb3cc',
    backgroundColor: '#fff5f8',
    borderWidth: 1.5,
  },

  // ── Stream Top Row ──
  streamTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8, // 👈 kam kiya (pehle 10 tha)
    marginBottom: 4, // 👈 kam kiya (pehle 8 tha)
  },
  streamTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6, // 👈 kam kiya (pehle 8 tha)
  },
  liveDotInline: {
    width: 6, // 👈 kam kiya (pehle 8 tha)
    height: 6, // 👈 kam kiya (pehle 8 tha)
    borderRadius: 3,
    backgroundColor: '#FF6600',
    marginTop: 4, // 👈 kam kiya (pehle 6 tha)
  },
  streamTitle: {
    flex: 1,
    fontSize: 14, // 👈 kam kiya (pehle 16 tha)
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 19, // 👈 kam kiya (pehle 22 tha)
    fontFamily: 'Roboto_700Bold',
  },

  // ── Status Badge ──
  statusBadge: {
    paddingHorizontal: 8, // 👈 kam kiya (pehle 10 tha)
    paddingVertical: 3, // 👈 kam kiya (pehle 5 tha)
    borderRadius: 3,
  },
  liveBadge:     { backgroundColor: '#fdf8fa' },
  upcomingBadge: { backgroundColor: '#dbeafe' },
  endedBadge:    { backgroundColor: '#f1f5f9' },
  statusBadgeText: {
    fontSize: 10, // 👈 kam kiya (pehle 11 tha)
    fontWeight: '800',
    textTransform: 'capitalize',
    fontFamily: 'Roboto_700Bold',
  },
  liveText:     { color: '#FF6600' },
  upcomingText: { color: '#1d4ed8' },
  endedText:    { color: '#64748b' },

  // ── Link Row ──
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // 👈 kam kiya (pehle 6 tha)
    marginBottom: 8, // 👈 kam kiya (pehle 12 tha)
  },
  linkText: {
    flex: 1,
    fontSize: 11, // 👈 kam kiya (pehle 12 tha)
    color: '#64748b',
    fontFamily: 'Roboto_400Regular',
  },

  // ── Action Buttons ──
  actionRow: {
    flexDirection: 'row',
    gap: 8, // 👈 kam kiya (pehle 10 tha)
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5, // 👈 kam kiya (pehle 7 tha)
    paddingVertical: 8, // 👈 kam kiya (pehle 11 tha)
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  playBtnText: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Roboto_700Bold',
  },
  stopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5, // 👈 kam kiya (pehle 7 tha)
    paddingVertical: 8, // 👈 kam kiya (pehle 11 tha)
    borderRadius: 3,
    backgroundColor: '#FF6600',
  },
  stopBtnDisabled: {
    opacity: 0.6,
  },
  stopBtnText: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Roboto_700Bold',
  },

  // ── States ──
  loadingText: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    color: '#64748b',
    fontFamily: 'Roboto_400Regular',
  },
  emptyText: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 6, // 👈 kam kiya (pehle 8 tha)
    fontFamily: 'Roboto_400Regular',
  },
  fieldLabel: {
    marginBottom: 4, // 👈 kam kiya (pehle 6 tha)
    fontSize: 11, // 👈 kam kiya (pehle 12 tha)
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Roboto_700Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    paddingHorizontal: 12, // 👈 kam kiya (pehle 14 tha)
    paddingVertical: 10, // 👈 kam kiya (pehle 12 tha)
    fontSize: 13, // 👈 kam kiya (pehle 14 tha)
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 10, // 👈 kam kiya (pehle 12 tha)
    fontFamily: 'Roboto_400Regular',
  },
  infoBox: {
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    padding: 10, // 👈 kam kiya (pehle 14 tha)
    marginBottom: 10, // 👈 kam kiya (pehle 14 tha)
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '800',
    color: '#9b0038',
    marginBottom: 4, // 👈 kam kiya (pehle 6 tha)
    fontFamily: 'Roboto_700Bold',
  },
  infoText: {
    fontSize: 11, // 👈 kam kiya (pehle 12 tha)
    lineHeight: 16, // 👈 kam kiya (pehle 18 tha)
    color: '#FF6600',
    fontFamily: 'Roboto_400Regular',
  },
  publisherCamera: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  publisherFrame: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  publisherBrandOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    zIndex: 2,
    elevation: 2,
  },
  livePreviewPlayer: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    aspectRatio: undefined,
    zIndex: 1,
  },
  hiddenPublisherCamera: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 1,
    height: 1,
    aspectRatio: undefined,
  },
  publisherBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // 👈 kam kiya (pehle 8 tha)
    paddingHorizontal: 8, // 👈 kam kiya (pehle 10 tha)
    paddingVertical: 6, // 👈 kam kiya (pehle 8 tha)
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  publisherLogo: {
    width: 22, // 👈 kam kiya (pehle 26 tha)
    height: 22, // 👈 kam kiya (pehle 26 tha)
    borderRadius: 11,
  },
  publisherBrandName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 11, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '900',
    letterSpacing: 0.6, // 👈 kam kiya (pehle 0.8 tha)
  },
  publisherLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // 👈 kam kiya (pehle 5 tha)
    borderRadius: 3, // 👈 kam kiya (pehle 4 tha)
    paddingHorizontal: 5, // 👈 kam kiya (pehle 7 tha)
    paddingVertical: 3, // 👈 kam kiya (pehle 4 tha)
    backgroundColor: '#dc2626',
  },
  publisherLiveDot: {
    width: 4, // 👈 kam kiya (pehle 5 tha)
    height: 4, // 👈 kam kiya (pehle 5 tha)
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  publisherLiveText: {
    color: '#ffffff',
    fontSize: 9, // 👈 kam kiya (pehle 10 tha)
    fontWeight: '800',
  },
  cameraSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // 👈 kam kiya (pehle 7 tha)
    marginTop: 10, // 👈 kam kiya (pehle 12 tha)
    paddingHorizontal: 12, // 👈 kam kiya (pehle 14 tha)
    paddingVertical: 7, // 👈 kam kiya (pehle 9 tha)
    borderRadius: 6, // 👈 kam kiya (pehle 7 tha)
    backgroundColor: '#1e293b',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8, // 👈 kam kiya (pehle 10 tha)
    marginTop: 10, // 👈 kam kiya (pehle 12 tha)
  },
  cameraMuteBtn: {
    backgroundColor: '#b91c1c',
  },
  cameraSwitchBtnText: {
    color: '#ffffff',
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '700',
  },
  broadcastWatchFrame: {
    marginTop: 12, // 👈 kam kiya (pehle 16 tha)
    overflow: 'hidden',
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    backgroundColor: '#020617',
  },
  broadcastWatchTitle: {
    paddingHorizontal: 10, // 👈 kam kiya (pehle 12 tha)
    paddingVertical: 7, // 👈 kam kiya (pehle 9 tha)
    color: '#ffffff',
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '700',
    backgroundColor: '#1e293b',
  },
  openYoutubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6, // 👈 kam kiya (pehle 8 tha)
    paddingVertical: 9, // 👈 kam kiya (pehle 11 tha)
    backgroundColor: '#dc2626',
  },
  openYoutubeBtnText: {
    color: '#ffffff',
    fontSize: 12, // 👈 kam kiya (pehle 13 tha)
    fontWeight: '700',
  },
  youtubeConnectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 👈 kam kiya (pehle 10 tha)
    padding: 10, // 👈 kam kiya (pehle 12 tha)
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  youtubeConnectedCopy: {
    flex: 1,
  },
  youtubeConnectedTitle: {
    color: '#166534',
    fontSize: 13, // 👈 kam kiya (pehle 14 tha)
    fontWeight: '800',
  },
  youtubeConnectedText: {
    marginTop: 2,
    color: '#15803d',
    fontSize: 11, // 👈 kam kiya (pehle 12 tha)
  },
  publisherFallback: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 6, // 👈 kam kiya (pehle 8 tha)
    padding: 14, // 👈 kam kiya (pehle 18 tha)
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  publisherFallbackTitle: {
    fontSize: 14, // 👈 kam kiya (pehle 16 tha)
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4, // 👈 kam kiya (pehle 8 tha)
    fontFamily: 'Roboto_700Bold',
  },
  publisherFallbackMeta: {
    marginTop: 4, // 👈 kam kiya (pehle 8 tha)
    fontSize: 11, // 👈 kam kiya (pehle 12 tha)
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: 'Roboto_400Regular',
  },
  // ── Top Bar (Updated - Aur Chhota) ──
    topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 2 : 32,
    paddingBottom: 4,
    paddingHorizontal: 10,
    backgroundColor: '#b91c1c',
    borderBottomWidth: 0.5,
    borderBottomColor: '#7f1d1d',
    minHeight: Platform.OS === 'web' ? 40 : 44,
  },
  backBtn: {
    width: 28, // 👈 aur chhota kiya (pehle 32 tha)
    height: 28, // 👈 aur chhota kiya (pehle 32 tha)
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginLeft: -2,
  },
   topBarTitle: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'Roboto_700Bold',
  },
  topBarSpacer: {
    width: 28,
  },
});

export default LiveStreamingStyles;