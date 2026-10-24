import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StatusBar, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Native splash ko tab tak roke rakho jab tak ye component dikh na jaye
SplashScreen.preventAutoHideAsync().catch(() => {});

// Is color ko apni splash image ke background se match rakho (taaki koi gap na dikhe)
const SPLASH_BG = '#ffffff';

/**
 * Full-screen splash.
 *
 * Usage (App.js / root layout):
 *   <FullScreenSplash
 *     image={require('./assets/images/splash.png')}   // wahi blue RTI MEDIA image
 *     ready={appIsReady}                              // fonts/auth/etc load hone ke baad true
 *     minDuration={1500}
 *   >
 *     <YourApp />
 *   </FullScreenSplash>
 */
export default function FullScreenSplash({ image, ready = true, minDuration = 1500, children }) {
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  // Hide native splash as soon as our full-screen image is mounted
  const onLayout = () => {
    SplashScreen.hideAsync().catch(() => {});
  };

  useEffect(() => {
    if (ready && minTimePassed) {
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() =>
        setDone(true)
      );
    }
  }, [ready, minTimePassed, opacity]);

  return (
    <View style={styles.root}>
      {children}
      {!done && (
        <Animated.View
          style={[styles.overlay, { opacity }]}
          pointerEvents="auto"
          onLayout={onLayout}
        >
          <StatusBar hidden />
          <Image source={image} style={styles.image} resizeMode="contain" />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  image: { width: 300, height: 300 },
});
