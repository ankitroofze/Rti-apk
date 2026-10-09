// HomePromoPopup.js
// Full-screen "ad" popup shown on the Home screen — dimmed backdrop with a
// centered image card + a close button. Re-appears every time the Home
// screen regains focus.
// Multiple ads (alag-alag users) hon to popup me har 3 second me ad badal jaata hai.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Image,
    Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import AutoFitAdImage from './AutoFitAdImage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { openExternalUrl } from '../utils/adRedirect';

const ROTATE_MS = 3000; // har 3 second me next ad

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

  // 2+ ads hon tabhi rotate karo, aur sirf jab popup khula ho
  useEffect(() => {
    if (!visible || list.length < 2) return undefined;
    const timer = setInterval(() => setIndex((c) => (c + 1) % list.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [visible, list.length]);

  const current = list.length ? list[index % list.length] : null;
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

      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setVisible(false)}
      />

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
            style={styles.closeBtn}
            onPress={() => setVisible(false)}
            accessibilityLabel="Close advertisement"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#fff" />
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
  closeBtn: {
    position: 'absolute',
    top: -14,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});