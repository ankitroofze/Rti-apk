// HomePromoPopup.js
// Full-screen "ad" popup shown on the Home screen — dimmed backdrop with a
// centered image card + a close button. Re-appears every time the Home
// screen regains focus.

import React, { useState } from 'react';
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

export default function HomePromoPopup({ ad, onPress }) {
  const [visible, setVisible] = useState(false);
    const { width: winW, height: winH } = useWindowDimensions();

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
        <Text style={styles.adCaption}>ADVERTISEMENT</Text>

        <View style={styles.imageBox}>
          <TouchableOpacity activeOpacity={0.92} onPress={handlePress}>
            <AutoFitAdImage
              uri={ad.image || ad.brandLogo}
              maxWidth={Math.min(winW * 0.88, 520)}
              maxHeight={winH * 0.75}
            />
          </TouchableOpacity>

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