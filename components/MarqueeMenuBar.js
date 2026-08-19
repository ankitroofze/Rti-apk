import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HOME_CATEGORY_PILLS } from '../constants/homeData';

const VISIBLE_COUNT = 9; // "All" + 8 pills visible, baaki "More" ke andar

export default function MarqueeMenuBar({ activeMenuKey, onSelectMenu, commonCopy }) {
  const [showMore, setShowMore] = useState(false);
  const visibleItems = HOME_CATEGORY_PILLS.slice(0, VISIBLE_COUNT);
  const overflowItems = HOME_CATEGORY_PILLS.slice(VISIBLE_COUNT);

  const renderPill = (item) => {
    const isActive = (activeMenuKey || 'all') === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.pill,
          {
            borderColor: isActive ? item.accentColor : `${item.accentColor}55`,
            backgroundColor: isActive ? item.accentColor : '#ffffff',
          },
        ]}
        onPress={() => { onSelectMenu(item.key); setShowMore(false); }}
        activeOpacity={0.82}
      >
        <Ionicons name={item.icon} size={14} color={isActive ? '#ffffff' : item.accentColor} />
        <Text style={[styles.pillLabel, { color: isActive ? '#ffffff' : item.accentColor }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    // ✅ outer wrapper centers the whole row (pills + More button) as a
    // single group, and caps its width so it lines up with the header's
    // content — logo se leke profile icons tak — instead of stretching
    // edge to edge
    <View style={styles.outerWrapper}>
      <View style={styles.wrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.track}
          style={styles.trackScroll}
        >
          {visibleItems.map(renderPill)}
        </ScrollView>

        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowMore(true)} activeOpacity={0.85}>
          <Text style={styles.moreBtnText}>More</Text>
          <Ionicons name="chevron-down" size={14} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <Modal visible={showMore} transparent animationType="fade" onRequestClose={() => setShowMore(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMore(false)}>
          <View style={styles.moreDropdown}>
            {overflowItems.map(renderPill)}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // full-width bottom-border strip, but centers its inner content
  outerWrapper: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
    alignItems: 'center',
  },
  // this is the row that actually holds the pills + "More" — capped to
  // 1360 (same max-width used for the header/page body) and centered,
  // and justifyContent: 'center' keeps everything grouped in the middle
  // instead of spreading to the edges
  wrapper: {
    width: '100%',
    maxWidth: 1360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  // flexGrow: 0 stops the ScrollView from stretching to fill remaining
  // space (that stretch was what pushed "More" all the way to the right)
  trackScroll: { flexGrow: 0, flexShrink: 1 },
  track: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5,
  },
  pillLabel: { fontSize: 12.5, fontWeight: '700' },
  moreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#ffffff',
  },
  moreBtnText: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  moreDropdown: {
    marginTop: 120, marginRight: 20, backgroundColor: '#fff', borderRadius: 12, padding: 10, gap: 8,
    ...Platform.select({ web: { boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } }),
  },
});