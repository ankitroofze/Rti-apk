import React from 'react';
import { Platform, View } from 'react-native';

export default function WebLayout({ children, style }) {
  const base = Platform.OS === 'web'
    ? { flex: 1, width: '100%', height: '100%' }
    : { flex: 1 };

  return <View style={[base, style]}>{children}</View>;
}
