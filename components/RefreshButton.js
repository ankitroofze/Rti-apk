import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

export default function RefreshButton({ size = 20, color = '#0f172a', style }) {
  const handleRefresh = async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
      return;
    }
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.warn('Reload failed', e);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleRefresh}
      activeOpacity={0.7}
      style={[{ padding: 6, marginHorizontal: 4 }, style]}
    >
      <Ionicons name="refresh" size={size} color={color} />
    </TouchableOpacity>
  );
}