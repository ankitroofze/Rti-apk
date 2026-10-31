// HomePromoPopup.js
// Home screen khulte hi aane wala FULL-SCREEN ad popup (image + video dono).
// Rules (client ke hisaab se):
//  - Har ad (image ho ya video) sirf AD_SECONDS = 5 second chalta hai, phir apne aap agla ad.
//  - Skip button pehle 5 second tak "Skip in 5s" countdown dikhata hai, uske baad chalu hota hai.
//  - Skip dabane par POORA popup ek baar me band ho jaata hai (agla ad nahi).
//  - Backdrop / blur area par tap karne se popup KABHI band nahi hota (na 5 sec se pehle, na baad me).
//    Popup sirf Skip button se band hota hai (5 sec poore hone ke baad).
//  - Aakhri ad par ruk jaata hai (loop nahi) — user Skip dabake band kare.
//  - Sirf ASLI image / video par tap karne se ad ka redirect khulta hai (onPress).

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
const AD_FIT = 'contain';      // ad poora dikhta hai (crop nahi); khaali jagah BLUR background se bharti hai, black se nahi
const IS_WEB = Platform.OS === 'web';

// ── Video ad (muted autoplay, 5 sec ke baad parent agla ad / ruk jaata hai) ──
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

  // Video ka asli size batao taaki sirf video ke upar tap redirect ho (blur par nahi)
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
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ✅ NEW: Jo ad user ek baar dekh chuka hai wo agli baar app kholne par LAST me aata hai.
// Naye (unseen) ads pehle, dekhe hue ads baad me — jo sabse pehle dekha tha wo pehle, jo abhi dekha wo sabse last.
// "Dekha hua" phone me AsyncStorage me save hota hai ({ adId: lastSeenTime }), isliye app band karke
// dobara kholne par bhi yaad rehta hai.
const SEEN_KEY = 'home_promo_ads_seen_v1';
const adKey = (a) => String(a?.id ?? a?.ad_id ?? '');
const orderBySeen = (src = [], seen = {}) => {
  const pos = new Map(src.map((a, i) => [a, i]));
  return [...src].sort((a, b) => {
    const sa = Number(seen[adKey(a)]) || 0;
    const sb = Number(seen[adKey(b)]) || 0;
    if (!sa && !sb) return pos.get(a) - pos.get(b); // dono naye: original order
    if (!sa) return -1;                              // naya ad pehle
    if (!sb) return 1;
    return (sa - sb) || (pos.get(a) - pos.get(b));   // dono dekhe hue: purana-dekha pehle, abhi-dekha last
  });
};

export default function HomePromoPopup({ ad, ads, onPress }) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  // Web: chhota centered popup card. Mobile: poori screen.
  const cardW = Math.min(440, winW * 0.92);
  const cardH = Math.min(760, winH * 0.8);
  const topPad = IS_WEB ? 14 : (insets.top || StatusBar.currentHeight || 24) + 8;
  const bottomPad = IS_WEB ? 16 : Math.max(insets.bottom, 12) + 6;

  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(AD_SECONDS);
  const [unlocked, setUnlocked] = useState(false);
  const [areaSize, setAreaSize] = useState({ w: 0, h: 0 });   // media area ka size
  const [mediaNatural, setMediaNatural] = useState(null);       // image/video ka asli size {w,h}

  // `ads` (array) ho to wahi, warna purana single `ad`. Image YA video wale ads.
  const rawList = useMemo(() => {
    const src = Array.isArray(ads) && ads.length ? ads : (ad ? [ad] : []);
    return src.filter((a) => a && (a.video || a.image || a.brandLogo));
  }, [ads, ad]);

  // ✅ NEW: seen-wise ordered list (order popup khulte waqt fix hota hai, beech me nahi badalta)
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

  // ✅ SPEED: popup khulte hi ad turant dikhe isliye saari ad images pehle se download (cache) kar lo
  useEffect(() => {
    list.forEach((a) => {
      const uri = String(a.image || a.brandLogo || '').trim();
      if (uri) Image.prefetch(uri).catch(() => {});
    });
  }, [list]);

  // Home screen par har baar aane par popup dobara, countdown naye sire se
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      // pehle "dekhe hue ads" load karo, phir order lagake popup kholo (dekhe hue ads last me)
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

  // ✅ NEW: ad screen par aate hi "dekha hua" mark + save (order agli baar khulne par badlega)
  useEffect(() => {
    if (!visible || !current) return;
    const key = adKey(current);
    if (!key) return;
    const next = { ...seenRef.current, [key]: Date.now() };
    // purane / hat chuke ads ka record saaf karo (storage chhota rahe)
    const live = new Set(rawListRef.current.map(adKey));
    Object.keys(next).forEach((k) => { if (!live.has(k)) delete next[k]; });
    seenRef.current = next;
    AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next)).catch(() => {});
  }, [visible, currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Har ad ka 5 sec countdown
  useEffect(() => {
    if (!visible || !current) return undefined;
    setRemaining(AD_SECONDS);
    setUnlocked(false);
    const timer = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [visible, currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5 sec poore: Skip unlock + (aakhri ad na ho to) agla ad
  useEffect(() => {
    if (!visible || !current || remaining > 0) return undefined;
    setUnlocked(true);
    if (isLast) return undefined;
    const t = setTimeout(() => setIndex((i) => i + 1), 150);
    return () => clearTimeout(t);
  }, [visible, current, remaining, isLast]);

  // ✅ Skip ka 5 sec countdown SIRF pehle ad par. Pehla ad khatam hone ke baad (index > 0) baaki ads par
  // Skip seedha available rehta hai — "Skip in 5s" har ad par dobara nahi aata.
  const canSkip = index > 0 || remaining <= 0;

  // Current ad ka asli size nikaalo (image ke liye Image.getSize; video ke liye PromoVideo se aata hai)
  useEffect(() => {
    setMediaNatural(null);
    if (!current) return;
    if (String(current.video || '').trim()) return;
    const uri = String(current.image || current.brandLogo || '').trim();
    if (!uri) return;
    let alive = true;
    Image.getSize(uri, (w, h) => { if (alive && w && h) setMediaNatural({ w, h }); }, () => {});
    return () => { alive = false; };
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => setVisible(false);
  const handleSkip = () => { if (canSkip) close(); };

  if (!visible || !current) return null;

  const handlePress = () => {
    // Sirf asli image/video par tap -> ad ka redirect. (Blur par tap kuch nahi karta.)
    if (onPress) onPress(current);
    else if (current.ctaUrl) openExternalUrl(current.ctaUrl);
    close();
  };

  const videoUri = String(current.video || '').trim();
  const imageUri = String(current.image || current.brandLogo || '').trim();

  // 'contain' ke hisaab se image/video jitni jagah me dikh rahi hai utna hi tappable area
  let hit = { width: '100%', height: '100%' };
  // Video: always use the full media area with 'contain' so the WHOLE video is visible (track metadata can be wrong/rotated).
  if (!videoUri && areaSize.w && areaSize.h && mediaNatural?.w && mediaNatural?.h) {
    const scale = Math.min(areaSize.w / mediaNatural.w, areaSize.h / mediaNatural.h);
    hit = { width: Math.round(mediaNatural.w * scale), height: Math.round(mediaNatural.h * scale) };
  }

  const stage = (
    <View style={IS_WEB ? [styles.webCard, { width: cardW, height: cardH }] : styles.screen}>
      {/* Blur background: ad ki hi image blur hoke peeche (black nahi) */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={Platform.OS === 'android' ? 25 : 40} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, imageUri ? styles.blurTint : styles.noImageBg]} pointerEvents="none" />

      {/* Ad media — top/bottom bar se bachke beech me. Container touch nahi leta (blur par tap = kuch nahi),
          sirf andar ka asli image/video wala box tappable hai. */}
      <View
        style={[styles.mediaArea, styles.mediaAreaCenter, { top: topPad + 52, bottom: bottomPad }]}
        pointerEvents="box-none"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setAreaSize((p) => (p.w === width && p.h === height ? p : { w: width, h: height }));
        }}
      >
        <TouchableOpacity
          style={{ width: hit.width, height: hit.height, maxWidth: '100%', maxHeight: '100%' }}
          activeOpacity={0.95}
          onPress={handlePress}
        >
          {videoUri ? (
            <PromoVideo key={`v-${currentKey}`} uri={videoUri} poster={imageUri} onSize={setMediaNatural} />
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

      {/* Top: progress bars + label + skip */}
      <View style={[styles.topBar, { paddingTop: topPad }]} pointerEvents="box-none">
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

        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.adPill} pointerEvents="none">
            <Text style={styles.adCaption}>AD</Text>
            <View style={styles.adDot} />
            <Text style={styles.adCaptionLight}>Sponsored</Text>
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
                <Ionicons name="close" size={16} color="#fff" />
              </>
            ) : (
              <Text style={styles.skipBtnText}>Skip in {remaining}s</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );

  return (
    <Modal
      visible
      transparent={IS_WEB}
      animationType="fade"
      statusBarTranslucent
      presentationStyle={IS_WEB ? undefined : 'fullScreen'}
      onRequestClose={() => { if (canSkip) close(); }} // Android back: countdown me block
    >
      {IS_WEB ? (
        // Web: poora page cover nahi — blurred (black nahi) backdrop + center popup
        <View style={styles.webBackdrop}>
          {/* backdrop tap se popup band nahi hota — sirf Skip button se */}
          <View style={StyleSheet.absoluteFill} pointerEvents="auto" />
          {stage}
        </View>
      ) : stage}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a', overflow: 'hidden' },
  webBackdrop: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.35)',
    ...(IS_WEB ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : null),
  },
  webCard: {
    backgroundColor: '#0f172a', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    ...(IS_WEB ? { boxShadow: '0 24px 70px rgba(0,0,0,0.45)' } : null),
  },
  blurTint: { backgroundColor: 'rgba(15,23,42,0.45)' },
  noImageBg: { backgroundColor: '#1e293b' },
  mediaArea: { position: 'absolute', left: 0, right: 0 },
  mediaAreaCenter: { alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14 },
  progressRow: { flexDirection: 'row', gap: 4 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#ffffff' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  adPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11,
    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  adCaption: { fontSize: 11, color: '#fbbf24', fontWeight: '900', letterSpacing: 1 },
  adCaptionLight: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600', letterSpacing: 0.3 },
  adDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)' },
  skipBtn: {
    minWidth: 34,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  skipBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.5)', opacity: 0.9 },
  skipBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  muteBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});