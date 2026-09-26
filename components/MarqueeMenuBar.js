import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HOME_CATEGORY_PILLS } from '../constants/homeData';

const VISIBLE_COUNT = 9; // "All" + 8 pills visible, baaki "More" ke andar



  export default function MarqueeMenuBar({ activeMenuKey, onSelectMenu, commonCopy }) {
  const renderPill = (item) => {
    const isActive = (activeMenuKey || 'all') === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={styles.tab}
        onPress={() => onSelectMenu(item.key)}
        activeOpacity={0.82}
      >
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {item.label}
        </Text>
        {isActive ? <View style={styles.tabUnderline} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.outerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
        style={styles.trackScroll}
      >
             {HOME_CATEGORY_PILLS.filter((item) => !(item.key === 'india' && Platform.OS === 'web')).map(renderPill)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // full-width bottom-border strip, but centers its inner content
            outerWrapper: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopWidth: 0,
    alignItems: 'center',
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.15)' },
      default: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 1.5, elevation: 1 },
    }),
  },
  trackScroll: { width: '100%' },
 track: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  gap: 15,
  paddingVertical: 0,
  minHeight: 40,

  backgroundColor: '#ffffff',

  // Roboto
  fontFamily: Platform.OS === 'web'
    ? "'Roboto', sans-serif"
    : 'Roboto_400Regular',

  // Android + iOS
  ...(Platform.OS !== 'web' && {
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  }),

  // Web
  ...(Platform.OS === 'web' && {
    boxShadow: '0px 3px 5px rgba(15, 23, 42, 0.12)',
  }),
},
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5,
      tab: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
    // Match the news description font across Android, iOS, and web.
    tabLabel: { fontSize: 14.5, fontWeight: '400', color: '#4e5663', fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular' },
  tabLabelActive: { color: '#f97316', fontWeight: '700' },
  tabUnderline: { marginTop: 4, height: 2, width: '100%', backgroundColor: '#f97316', borderRadius: 2 },
  },
  pillLabel: { fontSize: 12.5, fontWeight: '700' },
  moreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#ffffff',
      tab: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
   tabLabel: { fontSize: 14.5, fontWeight: '400', color: '#64748b', fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular' },
  tabLabelActive: { color: '#f97316', fontWeight: '700' },
  tabUnderline: { marginTop: 4, height: 2, width: '100%', backgroundColor: '#f97316', borderRadius: 2 },
  },
  moreBtnText: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  moreDropdown: {
    marginTop: 120, marginRight: 20, backgroundColor: '#fff', borderRadius: 12, padding: 10, gap: 8,
    ...Platform.select({ web: { boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } }),
  },
});
