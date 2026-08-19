import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATE_LABELS, STATE_CARD_COLORS, EDITORIAL_FONT_FAMILY } from '../constants/homeData';

export default function StateDirectorySection({ stateSearchQuery, onSearchChange, onSelectState, isCompactLayout, homeCopy }) {
  const filteredStates = useMemo(() => {
    const q = String(stateSearchQuery || '').trim().toLowerCase();
    if (!q) return STATE_LABELS;
    return STATE_LABELS.filter((s) => s.toLowerCase().includes(q));
  }, [stateSearchQuery]);

  return (
    <View style={styles.stateDirectoryShell}>
      <Text style={styles.stateDirectoryTitle}>{homeCopy.stateDirectoryTitle}</Text>
      <Text style={styles.stateDirectoryDescription}>{homeCopy.stateDirectoryDescription}</Text>
      <View style={[styles.sectionSearchRow, isCompactLayout && styles.sectionSearchRowCompact]}>
        <View style={styles.sectionSearchField}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            value={stateSearchQuery} onChangeText={onSearchChange}
            placeholder={homeCopy.searchStatePlaceholder} placeholderTextColor="#94a3b8"
            style={styles.sectionSearchInput}
          />
        </View>
      </View>
      <View style={styles.stateDirectoryGrid}>
        {filteredStates.map((stateName, index) => {
          const borderColor = STATE_CARD_COLORS[index % STATE_CARD_COLORS.length];
          return (
            <TouchableOpacity
              key={stateName}
              style={[styles.stateDirectoryCard, { borderColor, backgroundColor: `${borderColor}14` }, isCompactLayout && styles.stateDirectoryCardCompact]}
              onPress={() => onSelectState(stateName)} activeOpacity={0.84}
            >
              <Text style={[styles.stateDirectoryCardText, { color: borderColor }]} numberOfLines={1}>{stateName}</Text>
              <Ionicons name="chevron-forward-outline" size={18} color={borderColor} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stateDirectoryShell: {
    width: '100%', maxWidth: 840, alignSelf: 'center', borderRadius: 5,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 18, paddingTop: 24, paddingBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0 18px 34px rgba(15, 23, 42, 0.08)' },
      default: { elevation: 4, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 18 },
    }),
  },
  stateDirectoryTitle: { color: '#0f172a', fontSize: 34, fontWeight: '900', fontFamily: EDITORIAL_FONT_FAMILY, textAlign: 'center' },
  stateDirectoryDescription: { color: '#64748b', fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 16, textAlign: 'center' },
  sectionSearchRow: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionSearchRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
  sectionSearchField: {
    flex: 1, minHeight: 42, borderRadius: 18, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#dbe3ee', paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  sectionSearchInput: { flex: 1, fontSize: 13, color: '#0f172a', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  stateDirectoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  stateDirectoryCard: { width: 156, minWidth: 0, flexBasis: 'auto', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' },
  stateDirectoryCardCompact: { width: '100%', minWidth: 0, flexBasis: 'auto' },
  stateDirectoryCardText: { flex: 1, marginRight: 8, fontSize: 14, fontWeight: '700' },
});