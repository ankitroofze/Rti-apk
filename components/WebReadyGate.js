import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Font from 'expo-font';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';

/**
 * Fonts ki loading (web):
 *  1) CRITICAL (page dikhne se pehle) : Ionicons + Feather + Roboto 400/700  (~0.8 MB)
 *  2) BACKGROUND (page dikhne ke baad): MaterialIcons, MaterialCommunityIcons (1.3 MB), Roboto 500/900
 * Pehle 8 fonts (AntDesign / FontAwesome / FontAwesome5 samet ~3 MB) ek saath aate the — mobile par bahut slow.
 * Icon fonts ab /fonts/*.ttf (public/fonts) se aate hain; index.html me <link rel="preload"> hai,
 * isliye download JS bundle se pehle hi shuru ho jata hai. Static file fail ho to bundled font fallback.
 */
let fontsPromise = null;
let fontsReady = false;
const MAX_WAIT_MS = 4000; // font fail / slow ho to bhi page atke nahi

const familyOf = (iconSet) => Object.keys((iconSet && iconSet.font) || {})[0];
const staticFont = (iconSet, file) => {
  const family = familyOf(iconSet);
  return family ? { [family]: { uri: `/fonts/${file}` } } : {};
};

export function preloadAppFonts() {
  if (Platform.OS !== 'web') return Promise.resolve();
  if (fontsPromise) return fontsPromise;

  const robotoCritical = { Roboto_400Regular, Roboto_700Bold };
  const critical = Font.loadAsync({
    ...staticFont(Ionicons, 'Ionicons.ttf'),
    ...staticFont(Feather, 'Feather.ttf'),
    ...robotoCritical,
  }).catch(() => Font.loadAsync({ ...Ionicons.font, ...Feather.font, ...robotoCritical }).catch(() => {}));

  const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));
  fontsPromise = Promise.race([critical, timeout]).then(() => {
    fontsReady = true;
    // Baaki fonts page dikhne ke BAAD, background me (critical fonts ki bandwidth nahi khate)
    critical.finally(() => {
      Font.loadAsync({
        ...staticFont(MaterialIcons, 'MaterialIcons.ttf'),
        ...staticFont(MaterialCommunityIcons, 'MaterialCommunityIcons.ttf'),
        Roboto_500Medium,
        Roboto_900Black,
      }).catch(() => Font.loadAsync({ ...MaterialIcons.font, ...MaterialCommunityIcons.font, Roboto_500Medium, Roboto_900Black }).catch(() => {}));
    });
  });
  return fontsPromise;
}

// Module load hote hi fonts ki download shuru
preloadAppFonts();

export function useAppFontsReady() {
  const [ready, setReady] = useState(Platform.OS !== 'web' || fontsReady);
  useEffect(() => {
    if (ready) return undefined;
    let alive = true;
    preloadAppFonts().then(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [ready]);
  return ready;
}

export function PageLoader() {
  return (
    <View style={{ flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : 300, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#b91c1c" />
    </View>
  );
}

export default function WebReadyGate({ children }) {
  const ready = useAppFontsReady();
  return ready ? <>{children}</> : <PageLoader />;
}