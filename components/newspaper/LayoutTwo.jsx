import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import ArticleBlock from './ArticleBlock';
import FooterBlock from './FooterBlock';

const NEWSPAPER_WIDTH = 1056;
const NEWSPAPER_HEIGHT = 2112;

export default function LayoutTwo({ sections = {}, activeSection, onSelectSection, onSectionChange }) {
  const sel = (id) => activeSection === id;
  const press = (id) => () => onSelectSection && onSelectSection(id);

  return (
    <View style={styles.pageWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={true} horizontal={false}>
        <View style={styles.page}>

          {/* ── 1. Masthead Strip ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('masthead')}>
            <View style={[styles.mastheadStrip, sel('masthead') && styles.editing]}>
              <Text style={styles.mastheadLeft}>{sections.masthead?.date || ''}</Text>
              <Text style={styles.mastheadCenter}>{sections.masthead?.title || ''}</Text>
              <Text style={styles.mastheadRight}>{sections.masthead?.website || ''}</Text>
            </View>
          </TouchableOpacity>

          {/* ── 2. Top: 2 Featured Articles ── */}
          <View style={[styles.row, styles.borderBottom]}>
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('top_left')}>
              <ArticleBlock data={sections.top_left} isMain isEditing={sel('top_left')} onDataChange={(u) => onSectionChange && onSectionChange('top_left', u)} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('top_right')}>
              <ArticleBlock data={sections.top_right} isMain isEditing={sel('top_right')} onDataChange={(u) => onSectionChange && onSectionChange('top_right', u)} />
            </TouchableOpacity>
          </View>

          {/* ── 3. Middle: 2 Equal Articles ── */}
          <View style={[styles.row, styles.borderBottom]}>
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('mid_left')}>
              <ArticleBlock data={sections.mid_left} isEditing={sel('mid_left')} onDataChange={(u) => onSectionChange && onSectionChange('mid_left', u)} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('mid_right')}>
              <ArticleBlock data={sections.mid_right} isEditing={sel('mid_right')} onDataChange={(u) => onSectionChange && onSectionChange('mid_right', u)} />
            </TouchableOpacity>
          </View>

          {/* ── 4. Bottom: 60% main + 40% side ── */}
          <View style={[styles.row, styles.borderBottom]}>
            <TouchableOpacity style={styles.colBottom60} activeOpacity={0.85} onPress={press('bot_main')}>
              <ArticleBlock data={sections.bot_main} isMain columns={3} isEditing={sel('bot_main')} onDataChange={(u) => onSectionChange && onSectionChange('bot_main', u)} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.colBottom40} activeOpacity={0.85} onPress={press('bot_side')}>
              <View style={styles.sideBox}>
                <ArticleBlock data={sections.bot_side} isEditing={sel('bot_side')} onDataChange={(u) => onSectionChange && onSectionChange('bot_side', u)} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── 5. Footer ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('footer')}>
            <FooterBlock data={sections.footer} isEditing={sel('footer')} onDataChange={(u) => onSectionChange && onSectionChange('footer', u)} />
          </TouchableOpacity>

          {/* ── 6. Slogan Bar ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('slogan')}>
            <View style={[styles.sloganBar, sel('slogan') && styles.editing]}>
              <Text style={styles.sloganText}>{sections.slogan?.text || ''}</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrapper: { flex: 1, backgroundColor: '#e8e4df', paddingVertical: 20 },
  scrollContainer: { alignItems: 'center', justifyContent: 'center' },
  page: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#888',
    width: NEWSPAPER_WIDTH,
    minHeight: NEWSPAPER_HEIGHT,
  },
  row: { flexDirection: 'row' },
  editing: { borderWidth: 2, borderColor: '#ea580c' },

  // Masthead
  mastheadStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0ddd8',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
  },
  mastheadLeft: { fontSize: 10, color: '#333', fontWeight: '600' },
  mastheadCenter: { fontSize: 10, color: '#333', fontWeight: '700', textAlign: 'center', flex: 1, marginHorizontal: 10 },
  mastheadRight: { fontSize: 10, color: '#333', fontWeight: '600' },

  // Columns
  colHalf: { flex: 1, padding: 14 },
  colBottom60: { flex: 60, padding: 14 },
  colBottom40: { flex: 40, padding: 10 },

  sideBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#444',
    padding: 10,
  },

  // Slogan
  sloganBar: {
    backgroundColor: '#e0ddd8',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#bbb',
    alignItems: 'center',
  },
  sloganText: { fontSize: 10, color: '#333', fontWeight: '600', textAlign: 'center' },

  // Dividers
  borderRight: { borderRightWidth: 1, borderRightColor: '#ccc' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#ccc' },
});