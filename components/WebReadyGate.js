import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Font from 'expo-font';
import {
  AntDesign,
  Feather,
  FontAwesome,
  FontAwesome5,
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
 * Icons + Roboto fonts ek hi baar load hote hain (promise cache).
 * Jab tak ye ready nahi, page ke icons khaali circle ban ke dikhte hain
 * aur text purane font me — isi liye half-loaded page dikhta tha.
 * Ab loader dikhega aur sab ready hone par poora page ek saath aayega.
 */
let fontsPromise = null;
let fontsReady = false;
const MAX_WAIT_MS = 5000; // font fail ho to bhi page atke nahi

export function preloadAppFonts() {
  if (Platform.OS !== 'web') return Promise.resolve();
  if (fontsPromise) return fontsPromise;

  const load = Font.loadAsync({
    ...Feather.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...FontAwesome.font,
    ...FontAwesome5.font,
    ...AntDesign.font,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
  }).catch(() => {});

  const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));
  fontsPromise = Promise.race([load, timeout]).then(() => { fontsReady = true; });
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