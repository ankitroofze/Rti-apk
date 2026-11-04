import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ionicons pehle se load hota hai (MaterialCommunityIcons 1.3 MB tha)
import { CONTENT_TABS } from './profileContent';

/**
 * Instagram jaisa icon-tab bar: Posts · Reels · Ads · Ecom
 * Icon par click karte hi parent us category ka content dikhata hai.
 *
 *  active   : 'post' | 'reel' | 'ad' | 'ecom'
 *  onChange : (key) => void
 *  accent   : active icon + underline ka color
 */
export default function ProfileContentTabs({ active = 'post', onChange, accent = '#F97316', style }) {
  return (
    <View style={[s.row, style]}>
      {CONTENT_TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, isActive && { borderBottomColor: accent }]}
            onPress={() => onChange && onChange(tab.key)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons name={tab.ioIcon} size={26} color={isActive ? accent : '#94a3b8'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
});