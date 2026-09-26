// HomePromoPopup.js
// Full-screen "ad" popup shown on the Home screen — dimmed backdrop with a
// centered image card + a close button. Re-appears every time the Home
// screen regains focus.

import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { openExternalUrl } from '../utils/adRedirect';

export default function HomePromoPopup({ ad, onPress }) {
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setVisible(true);
      return undefined;
    }, [])
  );

  if (!visible || !ad || !(ad.image || ad.brandLogo)) return null;

  const handlePress = () => {
    if (onPress) {
      onPress(ad);
    } else if (ad.ctaUrl) {
      openExternalUrl(ad.ctaUrl);
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
        {/* ── Sirf image, poore container ke andar ── */}
        <View style={styles.imageWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.imageTouchable}>
            <Image source={{ uri: ad.image || ad.brandLogo }} style={styles.fullImage} resizeMode="cover" />
          </TouchableOpacity>
        </View>

        {/* ── Close button — card ke overflow:hidden ke BAHAR (sibling), isliye clip nahi hota ── */}
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
  );
}

const CARD_WIDTH = '82%';

const styles = StyleSheet.create({
  overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { backgroundColor: 'rgba(15,15,20,0.55)' },
  card: {
    width: CARD_WIDTH,
    maxWidth: 340,
    aspectRatio: 3 / 4,
    borderRadius: 22,
    backgroundColor: '#000',
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(0,0,0,0.35)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
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