// components/MediaBrandOverlay.js
// News feed ke media frame (photo / video) ke upar:
//  • MediaLogo   -> top-left corner me header wala logo
//  • MediaTicker -> bottom me "RTI INDIA NEWS" horizontal auto-scroll (breaking news jaisa)
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';

export const MEDIA_TICKER_HEIGHT = 30;

export function MediaLogo({ size = 56 }) {
  return (
    <View
      pointerEvents="none"
      style={[st.logoWrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Image
        source={require('../assets/images/certificate_logo.jpg')}
        style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function MediaTicker({ text = 'RTI INDIA NEWS', speed = 50 }) {
  const [segW, setSegW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  // ek segment ki width frame se badi rakhne ke liye text kai baar repeat
  const segment = `${Array(8).fill(text).join('    •    ')}    •    `;

  useEffect(() => {
    if (!segW) return undefined;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -segW,
        duration: Math.max(1000, (segW / speed) * 1000),
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    loop.start();
    return () => loop.stop();
  }, [segW, speed, x]);

  return (
    <View pointerEvents="none" style={st.tickerBar}>
      <Animated.View style={[st.tickerRow, { transform: [{ translateX: x }] }]}>
        <Text
          numberOfLines={1}
          style={st.tickerText}
          onLayout={(e) => {
            const w = Math.round(e.nativeEvent.layout.width);
            if (w && w !== segW) setSegW(w);
          }}
        >
          {segment}
        </Text>
        <Text numberOfLines={1} style={st.tickerText}>{segment}</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  logoWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    zIndex: 5,
    elevation: 5,
  },
  tickerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MEDIA_TICKER_HEIGHT,
    backgroundColor: 'rgba(75,85,99,0.62)', // halka transparent grey
    overflow: 'hidden',
    justifyContent: 'center',
    zIndex: 4,
    elevation: 4,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 6000, // text ko parent width me wrap/shrink hone se rokta hai
  },
  tickerText: {
    flexShrink: 0,
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 0.8,
    // ✅ Roboto: web par CSS font, Android/iOS par expo-google-fonts ka loaded Roboto
    // (native par custom font ke saath fontWeight mat do — Android par font toot jaata hai)
    ...(Platform.OS === 'web'
      ? { fontFamily: "'Roboto', sans-serif", fontWeight: '700', whiteSpace: 'nowrap' }
      : { fontFamily: 'Roboto_700Bold' }),
  },
});