// HomePromoPopup.js
// Modern, premium sponsored video & image advertisement popup.
// Clean, centered modal with rounded corners, subtle translucent backdrop blur,
// skip countdown timer, progress indicators, and mute/unmute controls.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { openExternalUrl } from '../utils/adRedirect';
import { useGlobalMuted, getGlobalMuted } from '../utils/Globalmutestore';
import { safePause, safePlay, safeSetMuted } from '../utils/videoPlayerSafe';

const AD_SECONDS = 5;          // har ad ka fixed time (image + video)
const AD_FIT = 'contain';      // ad poora dikhta hai (crop nahi)
const IS_WEB = Platform.OS === 'web';

// ── WEB video: asli <video> tag ──────────────────────────────────────────────
function PromoVideoWeb({ uri, onSize }) {
  const [muted, , toggleMuted] = useGlobalMuted();
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (el) el.muted = Boolean(muted);
  }, [muted]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return undefined;
    el.muted = Boolean(getGlobalMuted());
    const tryPlay = () => {
      const pr = el.play?.();
      if (pr && pr.catch) {
        // Browser unmuted autoplay block kare to muted karke chalao
        pr.catch(() => { try { el.muted = true; el.play?.().catch(() => { }); } catch (_) { /* ignore */ } });
      }
    };
    tryPlay();
    return () => { try { el.pause?.(); } catch (_) { /* ignore */ } };
  }, [uri]);

  const reportSize = (e) => {
    const v = e?.target;
    if (v?.videoWidth && v?.videoHeight && onSize) onSize({ w: v.videoWidth, h: v.videoHeight });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {React.createElement('video', {
        ref: elRef,
        src: uri,
        autoPlay: true,
        loop: true,
        playsInline: true,
        controls: false,
        preload: 'auto',
        onLoadedMetadata: reportSize,
        style: {
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
          backgroundColor: '#000',
          pointerEvents: 'none',
        },
      })}
      <TouchableOpacity
        style={styles.muteBtn}
        onPress={toggleMuted}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={muted ? 'Unmute' : 'Mute'}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Native Video ad (muted autoplay) ─────────────────────────────────────────
function PromoVideo({ uri, poster, onSize }) {
  const [muted, , toggleMuted] = useGlobalMuted();
  const player = useVideoPlayer(uri ? { uri } : null, (p) => {
    try {
      p.loop = true;
      p.muted = getGlobalMuted();
      p.volume = 1;
      p.play();
    } catch (_) { /* ignore */ }
  });

  useEffect(() => { safeSetMuted(player, muted); }, [player, muted]);

  useEffect(() => {
    if (!player || !onSize) return undefined;
    const report = (track) => {
      const sz = track?.size;
      if (sz?.width && sz?.height) onSize({ w: sz.width, h: sz.height });
    };
    try { report(player.videoTrack); } catch (_) { /* ignore */ }
    let sub;
    try { sub = player.addListener?.('videoTrackChange', (e) => report(e?.videoTrack ?? e)); } catch (_) { /* ignore */ }
    return () => { try { sub?.remove?.(); } catch (_) { /* ignore */ } };
  }, [player, onSize]);

  useEffect(() => {
    safePlay(player);
    return () => { safePause(player); };
  }, [player]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {poster ? <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} resizeMode={AD_FIT} /> : null}
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, IS_WEB ? { objectFit: AD_FIT, backgroundColor: 'transparent' } : null]}
        contentFit={AD_FIT}
        nativeControls={false}
        fullscreenOptions={{ enabled: false }}
        pointerEvents="none"
      />
      <TouchableOpacity
        style={styles.muteBtn}
        onPress={toggleMuted}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={muted ? 'Unmute' : 'Mute'}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// Seen-wise ordered list helper
const SEEN_KEY = 'home_promo_ads_seen_v1';
const adKey = (a) => String(a?.id ?? a?.ad_id ?? '');
const orderBySeen = (src = [], seen = {}) => {
  const pos = new Map(src.map((a, i) => [a, i]));
  return [...src].sort((a, b) => {
    const sa = Number(seen[adKey(a)]) || 0;
    const sb = Number(seen[adKey(b)]) || 0;
    if (!sa && !sb) return pos.get(a) - pos.get(b);
    if (!sa) return -1;
    if (!sb) return 1;
    return (sa - sb) || (pos.get(a) - pos.get(b));
  });
};

export default function HomePromoPopup({ ad, ads, onPress }) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();

  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(AD_SECONDS);
  const [, setUnlocked] = useState(false);
  const [mediaNatural, setMediaNatural] = useState(null);

  // `ads` (array) ho to wahi, warna purana single `ad`
  const rawList = useMemo(() => {
    const src = Array.isArray(ads) && ads.length ? ads : (ad ? [ad] : []);
    return src.filter((a) => a && (a.video || a.image || a.brandLogo));
  }, [ads, ad]);

  const seenRef = useRef({});
  const rawListRef = useRef(rawList);
  rawListRef.current = rawList;
  const [list, setList] = useState([]);

  const loadSeen = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SEEN_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      seenRef.current = parsed && typeof parsed === 'object' ? parsed : {};
    } catch { seenRef.current = {}; }
  }, []);

  useEffect(() => { setList(orderBySeen(rawList, seenRef.current)); }, [rawList]);

  useEffect(() => {
    list.forEach((a) => {
      const uri = String(a.image || a.brandLogo || '').trim();
      if (uri) Image.prefetch(uri).catch(() => { });
    });
  }, [list]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSeen().then(() => {
        if (!alive) return;
        setList(orderBySeen(rawListRef.current, seenRef.current));
        setVisible(true);
        setIndex(0);
        setRemaining(AD_SECONDS);
        setUnlocked(false);
      });
      return () => { alive = false; };
    }, [loadSeen])
  );

  const current = list.length ? list[Math.min(index, list.length - 1)] : null;
  const currentKey = current ? `${current.id ?? 'ad'}-${index}` : '';
  const isLast = index >= list.length - 1;

  useEffect(() => {
    if (!visible || !current) return;
    const key = adKey(current);
    if (!key) return;
    const next = { ...seenRef.current, [key]: Date.now() };
    const live = new Set(rawListRef.current.map(adKey));
    Object.keys(next).forEach((k) => { if (!live.has(k)) delete next[k]; });
    seenRef.current = next;
    AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next)).catch(() => { });
  }, [visible, currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || !current) return undefined;
    setRemaining(AD_SECONDS);
    setUnlocked(false);
    const timer = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [visible, currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || !current || remaining > 0) return undefined;
    setUnlocked(true);
    if (isLast) return undefined;
    const t = setTimeout(() => setIndex((i) => i + 1), 150);
    return () => clearTimeout(t);
  }, [visible, current, remaining, isLast]);

  const canSkip = index > 0 || remaining <= 0;

  useEffect(() => {
    setMediaNatural(null);
    if (!current) return;
    if (String(current.video || '').trim()) return;
    const uri = String(current.image || current.brandLogo || '').trim();
    if (!uri) return;
    let alive = true;
    Image.getSize(uri, (w, h) => { if (alive && w && h) setMediaNatural({ w, h }); }, () => { });
    return () => { alive = false; };
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => setVisible(false);
  const handleSkip = () => { if (canSkip) close(); };

  if (!visible || !current) return null;

  const handlePress = () => {
    if (onPress) onPress(current);
    else if (current.ctaUrl) openExternalUrl(current.ctaUrl);
    close();
  };

  const videoUri = String(current.video || '').trim();
  const imageUri = String(current.image || current.brandLogo || '').trim();

  // ── Responsive Dimensions Calculation ──────────────────────────────────────
  const cardW = Math.min(winW - (IS_WEB ? 32 : 24), 440);
  const maxVideoH = Math.min(winH * 0.62, 520);
  const minVideoH = Math.min(240, winH * 0.36);

  let targetVideoH = Math.round((cardW - 28) * (9 / 16));
  if (mediaNatural?.w && mediaNatural?.h) {
    const naturalRatio = mediaNatural.h / mediaNatural.w;
    targetVideoH = Math.round((cardW - 28) * naturalRatio);
  }
  const videoHeight = Math.max(minVideoH, Math.min(maxVideoH, targetVideoH));

  const adTitle = current.brandName || current.title || current.headline || '';
  const adSubtitle = current.subheadline || current.description || '';

  return (
    <Modal
      visible={visible && Boolean(current)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { if (canSkip) close(); }}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop touch blocker: tapping outside does NOT dismiss ad */}
        <View style={StyleSheet.absoluteFill} pointerEvents="auto" />

        {/* Centered Premium Dark Modal Card */}
        <View style={[styles.modalCard, { width: cardW }]}>
          {/* Top Progress Indicators */}
          <View style={styles.progressRow} pointerEvents="none">
            {list.map((a, i) => {
              const done = i < index || (i === index && remaining <= 0);
              const active = i === index;
              const fill = done ? 1 : active ? (AD_SECONDS - remaining) / AD_SECONDS : 0;
              return (
                <View key={String(a.id ?? i)} style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(fill * 100)}%` }]} />
                </View>
              );
            })}
          </View>

          {/* Top Header Row: Sponsored Pill & Skip Action */}
          <View style={styles.headerRow} pointerEvents="box-none">
            <View style={styles.adBadge} pointerEvents="none">
              <View style={styles.adTag}>
                <Text style={styles.adTagText}>AD</Text>
              </View>
              <View style={styles.adDot} />
              <Text style={styles.sponsoredText}>Sponsored</Text>
            </View>

            <TouchableOpacity
              style={[styles.skipBtn, !canSkip && styles.skipBtnDisabled]}
              onPress={handleSkip}
              disabled={!canSkip}
              activeOpacity={0.8}
              accessibilityLabel={canSkip ? 'Skip advertisement' : `Skip available in ${remaining} seconds`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {canSkip ? (
                <>
                  <Text style={styles.skipBtnText}>Skip</Text>
                  <Ionicons name="close" size={15} color="#ffffff" />
                </>
              ) : (
                <View style={styles.skipCountdownRow}>
                  <View style={styles.skipTimerDot} />
                  <Text style={styles.skipCountdownText}>Skip in {remaining}s</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Centered Video / Media Player Container */}
          <View style={[styles.videoContainer, { height: videoHeight }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={0.96}
              onPress={handlePress}
            >
              {videoUri ? (
                IS_WEB
                  ? <PromoVideoWeb key={`v-${currentKey}`} uri={videoUri} onSize={setMediaNatural} />
                  : <PromoVideo key={`v-${currentKey}`} uri={videoUri} poster={imageUri} onSize={setMediaNatural} />
              ) : (
                <Image
                  key={`i-${currentKey}`}
                  source={{ uri: imageUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode={AD_FIT}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Ad Headline / Info Bar */}
          {Boolean(adTitle) && (
            <TouchableOpacity
              style={styles.infoArea}
              activeOpacity={0.88}
              onPress={handlePress}
            >
              <View style={styles.infoTextCol}>
                <Text style={styles.adTitleText} numberOfLines={1}>
                  {adTitle}
                </Text>
                {Boolean(adSubtitle) && (
                  <Text style={styles.adSubtitleText} numberOfLines={1}>
                    {adSubtitle}
                  </Text>
                )}
              </View>
              <View style={styles.actionPill}>
                <Text style={styles.actionPillText}>
                  {current.ctaLabel && current.ctaLabel !== 'SHOP NOW' ? current.ctaLabel : 'Click Me'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 10, 24, 0.40)', // translucent veil so the website behind is clearly visible
    paddingHorizontal: 16,
    paddingVertical: 24,
    ...(IS_WEB ? {
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    } : null),
  },
  modalCard: {
    backgroundColor: '#0a101f', // Premium dark navy / black container
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.65,
    shadowRadius: 36,
    elevation: 24,
    ...(IS_WEB ? {
      boxShadow: '0 25px 65px -10px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
    } : null),
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  adBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    gap: 6,
  },
  adTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  adTagText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sponsoredText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  skipBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...(IS_WEB ? { cursor: 'pointer' } : null),
  },
  skipBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...(IS_WEB ? { cursor: 'not-allowed' } : null),
  },
  skipBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  skipCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skipTimerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  skipCountdownText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 16, 31, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(IS_WEB ? {
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      cursor: 'pointer',
    } : null),
  },
  infoArea: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
    ...(IS_WEB ? { cursor: 'pointer' } : null),
  },
  infoTextCol: {
    flex: 1,
  },
  adTitleText: {
    color: '#F8FAFC',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  adSubtitleText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '400',
    marginTop: 1.5,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  actionPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
