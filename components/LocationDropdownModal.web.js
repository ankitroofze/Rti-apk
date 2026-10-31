import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Shared searchable dropdown for Select State / District / Taluka / Village (WEB only).
//
// Pehle ke bugs:
//  1. FlatList height auto-parent me 0 ho jaati thi -> "maha" type karte hi list gayab.
//  2. Chrome is input ko address field samajh ke "Maharashtra / Manage addresses"
//     autofill popup dikhata tha (screenshot) -> autoComplete off + unique name.
//  3. Search sirf simple includes() tha -> ab case / extra spaces / accents / symbols
//     ignore hote hain, aur "starts with" results upar aate hain.

const ROW_HEIGHT = 46;
const MAX_LIST_HEIGHT = 320;
const MAX_RENDER = 300; // bahut bade lists (villages) me web ko hang hone se bachata hai

const norm = (v) =>
  String(v == null ? '' : v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function filterAndRank(items, query) {
  const list = Array.isArray(items) ? items.filter((i) => i != null && String(i).trim() !== '') : [];
  const q = norm(query);
  if (!q) return list;
  const words = q.split(' ');
  const compactQ = q.replace(/ /g, '');
  const starts = [];
  const wordStarts = [];
  const contains = [];
  for (const item of list) {
    const n = norm(item);
    const compact = n.replace(/ /g, '');
    if (n.startsWith(q) || compact.startsWith(compactQ)) starts.push(item);
    else if (words.every((w) => n.split(' ').some((t) => t.startsWith(w)))) wordStarts.push(item);
    else if (words.every((w) => n.includes(w)) || compact.includes(compactQ)) contains.push(item);
  }
  return [...starts, ...wordStarts, ...contains];
}

export default function LocationDropdownModal({ visible, title, items, selected, onSelect, onClose, placeholder, emptyText }) {
  const [search, setSearch] = useState('');

  useEffect(() => { if (!visible) setSearch(''); }, [visible]);

  const filtered = useMemo(() => filterAndRank(items, search), [items, search]);
  const shown = filtered.length > MAX_RENDER ? filtered.slice(0, MAX_RENDER) : filtered;
  const listHeight = Math.max(ROW_HEIGHT, Math.min(MAX_LIST_HEIGHT, shown.length * ROW_HEIGHT));

  const pick = (item) => { onSelect(item); onClose(); setSearch(''); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ width: '100%', alignItems: 'center' }} onPress={() => {}}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>{title}</Text>
            <View style={s.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#B91C1C" />
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={placeholder || 'Search...'}
                placeholderTextColor="#9ca3af"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="off"
                // Chrome address-autofill band karne ke liye (React Native Web in attrs ko DOM tak pahunchata hai)
                name="rti-location-search"
                dataSet={{ lpignore: 'true', formtype: 'other' }}
                autoFocus
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {shown.length === 0 ? (
              <Text style={s.empty}>{emptyText || 'No results found'}</Text>
            ) : (
              <ScrollView style={{ height: listHeight }} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                {shown.map((item, index) => {
                  const isSel = selected === item;
                  return (
                    <TouchableOpacity key={`${item}-${index}`} style={[s.item, isSel && s.itemSelected]} onPress={() => pick(item)}>
                      <Text style={[s.itemText, isSel && s.itemTextSelected]} numberOfLines={1}>{String(item)}</Text>
                      {isSel ? <Ionicons name="checkmark-circle" size={18} color="#B91C1C" /> : null}
                    </TouchableOpacity>
                  );
                })}
                {filtered.length > MAX_RENDER ? (
                  <Text style={s.more}>Showing first {MAX_RENDER} of {filtered.length} — type more letters to narrow down</Text>
                ) : null}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const FONT = "'Roboto', sans-serif";
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '85%', borderRadius: 20, backgroundColor: '#ffffff', padding: 20, paddingBottom: 24 },
  handle: { width: 40, height: 4, backgroundColor: '#EEEEEE', borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: '#111111', marginBottom: 12, textAlign: 'center', fontFamily: FONT },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#EEEEEE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111111', paddingVertical: 0, outlineStyle: 'none', fontFamily: FONT },
  item: { height: ROW_HEIGHT - 3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12, marginBottom: 3 },
  itemSelected: { backgroundColor: 'rgba(185,28,28,0.08)' },
  itemText: { flex: 1, fontSize: 14, color: '#111111', fontWeight: '500', fontFamily: FONT },
  itemTextSelected: { color: '#B91C1C', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', paddingVertical: 20, fontFamily: FONT },
  more: { textAlign: 'center', color: '#9ca3af', fontSize: 12, paddingVertical: 10, fontFamily: FONT },
});