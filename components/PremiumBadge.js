import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function PremiumBadge({ size = 16, style }) {
  const badgeSize = Number(size) || 16;
  const iconSize = Math.max(8, Math.round(badgeSize * 0.6));

  return (
    <View style={[styles.badge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }, style]}>
      <Feather name="check" size={iconSize} color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
