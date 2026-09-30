import React from 'react';
import { Text as RNText, StyleSheet, Platform } from 'react-native';

const pickFamily = (weight) => {
  if (Platform.OS === 'web') return "'Roboto', sans-serif";
  const w = String(weight || '400');
  if (w === 'bold' || Number(w) >= 700) return 'Roboto_700Bold';
  if (Number(w) >= 500) return 'Roboto_500Medium';
  return 'Roboto_400Regular';
};

export default function Text({ style, ...props }) {
  const flat = StyleSheet.flatten(style) || {};
  const family = pickFamily(flat.fontWeight);
  return (
    <RNText
      {...props}
      style={[style, { fontFamily: family }, Platform.OS !== 'web' ? { fontWeight: 'normal' } : null]}
    />
  );
}