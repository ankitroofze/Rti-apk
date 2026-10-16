import React from 'react';
import { Platform, View } from 'react-native';
import WebReadyGate from './WebReadyGate';

export default function WebLayout({ children, style }) {
  const base = Platform.OS === 'web'
    ? { flex: 1, width: '100%', minHeight: '100vh' }
    : { flex: 1 };

  // Web par icon/Roboto fonts load hone tak loader, phir poora page ek saath
  return (
    <View style={[base, style]}>
      <WebReadyGate>{children}</WebReadyGate>
    </View>
  );
}