import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTemplateStore } from '../../store/newspaperStore';

const TEMPLATES = [
  {
    id: 'layout1',
    name: 'June Layout',
    desc: 'Header · Headline · 25|50|25 · 50|50 · Footer',
    grid: [
      ['████████████████████'],
      ['████████████████████'],
      ['████', '████████████', '████'],
      ['██████████', '██████████'],
      ['████████████████████'],
    ],
  },
  {
    id: 'layout2',
    name: 'March Layout',
    desc: 'Header · Headline · 35|40|25 · Lawyer · 33|33|34 · Footer',
    grid: [
      ['████████████████████'],
      ['████████████████████'],
      ['███████', '████████', '█████'],
      ['━━━━━━━━━━━━━━━━━━━━'],
      ['██████', '██████', '████████'],
      ['████████████████████'],
    ],
  },
  {
    id: 'layout3',
    name: 'Traditional Layout',
    desc: 'Header · 50|50 Top · 50|50 Mid · Black Strip · Slogan',
    grid: [
      ['████████████████████'],
      ['██████████', '██████████'],
      ['██████████', '██████████'],
      ['██████████', '██████████'],
      ['████████████████████'],
    ],
  },
  {
    id: 'layout4',
    name: 'Broadsheet Layout',
    desc: 'Header · 33|33|33 Top · 33|33|33 Mid · 70|30 Feature · Footer',
    grid: [
      ['████████████████████'],
      ['██████', '██████', '████████'],
      ['██████', '██████', '████████'],
      ['██████████████', '██████'],
      ['████████████████████'],
    ],
  },
];

export default function TemplateSelector({ onSelect }) {
  const { templateId, setTemplate } = useTemplateStore();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Template choose</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {TEMPLATES.map((tpl) => {
          const selected = templateId === tpl.id;
          return (
            <TouchableOpacity
              key={tpl.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => {
                setTemplate(tpl.id);
                onSelect && onSelect(tpl.id);
              }}
            >
              {/* Mini grid preview */}
              <View style={styles.gridPreview}>
                {tpl.grid.map((row, ri) => (
                  <View key={ri} style={styles.gridRow}>
                    {row.map((cell, ci) => (
                      <View
                        key={ci}
                        style={[
                          styles.gridCell,
                          { flex: cell.length },
                          selected && styles.gridCellSelected,
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                {tpl.name}
              </Text>
              <Text style={styles.cardDesc}>{tpl.desc}</Text>
              {selected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#ea580c',
  },
  heading: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  list: { gap: 12, paddingBottom: 4 },
  card: {
    width: 180,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    padding: 12,
  },
  cardSelected: {
    borderColor: '#ffd700',
    backgroundColor: '#2d2400',
  },
  gridPreview: { gap: 3, marginBottom: 10 },
  gridRow: { flexDirection: 'row', gap: 2, height: 10 },
  gridCell: { backgroundColor: '#555', borderRadius: 1 },
  gridCellSelected: { backgroundColor: '#ffd700' },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ccc',
    marginBottom: 3,
  },
  cardTitleSelected: { color: '#ffd700' },
  cardDesc: { fontSize: 10, color: '#666', lineHeight: 14 },
  selectedBadge: {
    marginTop: 8,
    backgroundColor: '#ffd700',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: { fontSize: 10, fontWeight: '700', color: '#111' },
});