// HomePromoPopup.js
// Full-screen "ad" popup shown on the Home screen — dimmed backdrop with a
// centered image card. Re-appears every time the Home screen regains focus.
// Rules:
//  - Har ad apni tay duration (ad.duration / duration_seconds, default 5s) tak chalta hai.
//  - Duration poori hone tak Skip button disabled rehta hai ("Skip in 3s" countdown).
//  - Ad sirf user ke Skip/Close dabane se band hota hai — backdrop tap, scroll ya
//    Android back button se nahi.
//  - Multiple ads hon to ek ad ki duration poori hone ke baad hi agla ad aata hai.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Image,
    Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import AutoFitAdImage from './AutoFitAdImage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { openExternalUrl } from '../utils/adRedirect';

const DEFAULT_AD_SECONDS = 5; // ad me duration na ho to default
const MAX_AD_SECONDS = 60;

// Ad ki tay duration (seconds) — backend ke alag-alag field names support
const getAdSeconds = (ad) => {
  const raw = Number(ad?.duration ?? ad?.duration_seconds ?? ad?.display_seconds ?? ad?.ad_duration ?? ad?.durationSec);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_AD_SECONDS;
  return Math.min(Math.round(raw), MAX_AD_SECONDS);
};

export default function HomePromoPopup({ ad, ads, onPress }) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const { width: winW, height: winH } = useWindowDimensions();

  // `ads` (array) ho to wahi, warna purana single `ad` — dono chalte hain
  const list = useMemo(() => {
    const src = Array.isArray(ads) && ads.length ? ads : (ad ? [ad] : []);
    return src.filter((a) => a && (a.image || a.brandLogo));
  }, [ads, ad]);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(true);
      setIndex(0);
      return undefined;
    }, [])
  );

  const current = list.length ? list[index % list.length] : null;
  const currentKey = current ? String(current.id ?? index) : '';
  const totalSeconds = current ? getAdSeconds(current) : 0;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [unlocked, setUnlocked] = useState(false);

  // Har naye ad par countdown dobara shuru
  useEffect(() => {
    if (!visible || !current) return undefined;
    setRemaining(totalSeconds);
    const timer = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, currentKey, index, totalSeconds]);

  // 2+ ads hon to ek ad ki duration poori hone ke BAAD hi agla ad aata hai
  useEffect(() => {
    if (!visible || list.length < 2 || remaining > 0) return undefined;
    const t = setTimeout(() => setIndex((c) => (c + 1) % list.length), 300);
    return () => clearTimeout(t);
  }, [visible, list.length, remaining]);

  // Pehle ad ki duration poori hote hi Skip unlock ho jaata hai (agle ads par bhi)
  const canSkip = unlocked || remaining <= 0;
  useEffect(() => { if (visible && remaining <= 0 && current) setUnlocked(true); }, [visible, remaining, current]);

  // Android back button: countdown chalte waqt ad band nahi hoga
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canSkip) return true; // block
      setVisible(false);
      return true;
    });
    return () => sub.remove();
  }, [visible, canSkip]);

  const handleSkip = () => {
    if (!canSkip) return; // duration poori hone se pehle skip nahi
    setVisible(false);
  };

  if (!visible || !current) return null;

  const handlePress = () => {
    if (onPress) {
      onPress(current);
    } else if (current.ctaUrl) {
      openExternalUrl(current.ctaUrl);
    }
    setVisible(false);
  };

  return (
    <View style={styles.overlayWrap} pointerEvents="box-none">
      <View style={[StyleSheet.absoluteFill, styles.dim]} />

      {/* Backdrop tap se ad band nahi hota — sirf Skip button se */}
      <View style={StyleSheet.absoluteFill} pointerEvents="auto" />

           <View style={styles.card} pointerEvents="box-none">
        <Text style={styles.adCaption}>ADVERTISEMENT</Text>

        <View style={styles.imageBox}>
          <TouchableOpacity activeOpacity={0.92} onPress={handlePress}>
            <AutoFitAdImage
              key={current.image || current.brandLogo}
              uri={current.image || current.brandLogo}
              maxWidth={Math.min(winW * 0.88, 520)}
              maxHeight={winH * 0.75}
            />
          </TouchableOpacity>

          {list.length > 1 ? (
            <View style={styles.dotsRow} pointerEvents="none">
              {list.map((a, i) => (
                <View key={String(a.id ?? i)} style={[styles.dot, i === index % list.length && styles.dotActive]} />
              ))}
            </View>
          ) : null}

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
}

const CARD_WIDTH = '82%';

const styles = StyleSheet.create({
   overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({ web: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }, default: {} }),
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { backgroundColor: 'rgba(15,15,20,0.55)' },
  card: { alignItems: 'center', justifyContent: 'center' },
  adCaption: { fontSize: 10, color: '#ffffff', fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  imageBox: { position: 'relative' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#ffffff', width: 18 },
  imageWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden', // ✅ sirf image yahan clip/round hoti hai, close button nahi
  },
  imageTouchable: { width: '100%', height: '100%' },
  fullImage: { width: '100%', height: '100%' },
  skipBtn: {
    position: 'absolute',
    top: -16,
    right: -6,
    minWidth: 32,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 5,
  },
  skipBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.55)', opacity: 0.9 },
  skipBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});