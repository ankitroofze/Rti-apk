import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import HeaderBlock from './HeaderBlock';
import HeadlineBlock from './HeadlineBlock';
import ArticleBlock from './ArticleBlock';
import FooterBlock from './FooterBlock';

const { width: screenWidth } = Dimensions.get('window');

const NEWSPAPER_WIDTH = 1056;
const NEWSPAPER_HEIGHT = 2112;

const scaleFactor = Math.min(screenWidth / NEWSPAPER_WIDTH, 1);

export default function LayoutOne({ sections = {}, activeSection, onSelectSection, onSectionChange }) {
  const sel = (id) => activeSection === id;
  const press = (id) => () => onSelectSection && onSelectSection(id);

  return (
    <View style={styles.pageWrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        horizontal={false}
      >
        <View style={styles.page}>

          {/* ── Header (unchanged) ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('header')}>
            <HeaderBlock
              data={sections.header}
              isEditing={sel('header')}
              onDataChange={(updated) => onSectionChange && onSectionChange('header', updated)}
            />
          </TouchableOpacity>

          {/* ── Main Headline (unchanged) ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('headline')}>
            <HeadlineBlock
              data={sections.headline}
              isEditing={sel('headline')}
              onDataChange={(updated) => onSectionChange && onSectionChange('headline', updated)}
            />
          </TouchableOpacity>

          {/*
          ╔══════════════════════════════════════════════════════════════╗
          ║                   FINAL LAYOUT STRUCTURE                    ║
          ║                                                             ║
          ║  ┌───────────┬──────────────────────┬──────────────────┐   ║
          ║  │           │  center_top (isMain) │                  │   ║
          ║  │ left_big  ├──────────────────────┤   right          │   ║
          ║  │           │  center_mid          │   (full height   │   ║
          ║  ├───────────┼──────────────────────┤    + image)      │   ║
          ║  │left_small │ ┌──────────────────┐ │                  │   ║
          ║  │ (box)     │ │  center_bottom   │ │                  │   ║
          ║  │           │ │  (bordered box)  │ │                  │   ║
          ║  └───────────┴─┴──────────────────┴─┴──────────────────┘   ║
          ╚══════════════════════════════════════════════════════════════╝
          */}

          {/* 3 true columns: Left | Center | Right */}
          <View style={styles.mainRow}>

            {/* ══ COL LEFT (~27%) ══ */}
            <View style={[styles.colLeft, styles.borderRight]}>

              {/* Left Big Article ~65% height */}
              <TouchableOpacity
                style={[styles.leftBig, styles.borderBottom]}
                activeOpacity={0.85}
                onPress={press('left_big')}
              >
                <ArticleBlock
  data={sections.left_big}
  isEditing={sel('left_big')}
  onDataChange={(updated) => onSectionChange && onSectionChange('left_big', updated)}
/>
              </TouchableOpacity>

              {/* Left Small — bordered box ~35% height */}
              <TouchableOpacity
                style={styles.leftSmallWrapper}
                activeOpacity={0.85}
                onPress={press('left_small')}
              >
                <View style={styles.leftSmallBox}>
                  <ArticleBlock
                    data={sections.left_small}
                    isEditing={sel('left_small')}
                    onDataChange={(updated) => onSectionChange && onSectionChange('left_small', updated)}
                  />
                </View>
              </TouchableOpacity>

            </View>

          {/* ══ COL CENTER + RIGHT (~73%) ══ */}
            <View style={styles.colCenterRight}>

              {/* Center Top — full width, ~45% */}
              <TouchableOpacity
                style={[styles.centerTop, styles.borderBottom]}
                activeOpacity={0.85}
                onPress={press('center_top')}
              >
                <ArticleBlock
                  data={sections.center_top}
                  isMain
                  isEditing={sel('center_top')}
                  onDataChange={(updated) => onSectionChange && onSectionChange('center_top', updated)}
                />
              </TouchableOpacity>

              {/* Mid Row: left side (center_mid + center_bottom) + right side (soyabin full height) */}
              <View style={styles.midRow}>

                {/* Left side of mid row */}
                <View style={styles.midLeft}>
                  <TouchableOpacity
                    style={[styles.centerMid, styles.centerMidBorder]}
                    activeOpacity={0.85}
                    onPress={press('center_mid')}
                  >
                    <ArticleBlock
                      data={sections.center_mid}
                      isEditing={sel('center_mid')}
                      onDataChange={(updated) => onSectionChange && onSectionChange('center_mid', updated)}
                    />
                  </TouchableOpacity>

                  {/* Center Bottom — bordered box, under center_mid */}
                  <TouchableOpacity
                    style={styles.centerBottomWrapper}
                    activeOpacity={0.85}
                    onPress={press('center_bottom')}
                  >
                    <View style={styles.centerBottomBox}>
                      <ArticleBlock
                        data={sections.center_bottom}
                        isEditing={sel('center_bottom')}
                        onDataChange={(updated) => onSectionChange && onSectionChange('center_bottom', updated)}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Right side - soyabin full height */}
                <TouchableOpacity
                  style={styles.midRight}
                  activeOpacity={0.85}
                  onPress={press('right')}
                >
                  <ArticleBlock
  data={sections.right}
  isEditing={sel('right')}
  columns={2}
  onDataChange={(updated) => onSectionChange && onSectionChange('right', updated)}
/>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Footer ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('footer')}>
            <FooterBlock
              data={sections.footer}
              isEditing={sel('footer')}
              onDataChange={(updated) => onSectionChange && onSectionChange('footer', updated)}
            />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: '#e8e4df',
    paddingVertical: 20,
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#888',
    width: NEWSPAPER_WIDTH,
    minHeight: NEWSPAPER_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // True 3-column row
  mainRow: {
    flexDirection: 'row',
    flex: 1,
  },

  // Left col ~27%
  colLeft: {
    flex: 27,
    flexDirection: 'column',
  },

  // Left big ~65% of left col height
  leftBig: {
    padding: 12,
  },

  // Left small wrapper ~35%
  leftSmallWrapper: {
    padding: 10,
  },

  // Bordered box for left_small
  leftSmallBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#444',
    padding: 10,
  },

  // Center col ~43%
  colCenter: {
    flex: 43,
    flexDirection: 'column',
  },

  // Center + Right combined col ~73%
  colCenterRight: {
    flex: 73,
    flexDirection: 'column',
  },

  // Mid row: center_mid + right side by side
  midRow: {
    flexDirection: 'row',
    marginLeft: -1,
  },
  // Left side of mid row
  midLeft: {
    flex: 60,
    flexDirection: 'column',
    borderLeftWidth: 0,
    marginLeft: -1,
  },

  // center_mid in mid row - chota
  centerMid: {
    padding: 12,
    borderLeftWidth: 0,
  },
  // right/soyabin in mid row ~40%
  midRight: {
    flex: 40,
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },

  // Center top ~45%
  centerTop: {
  padding: 12,
},

  // Center mid — inside midRow

  // Center bottom wrapper ~70%
  centerBottomWrapper: {
    padding: 10,
  },

  // Bordered box for center_bottom
  centerBottomBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#444',
    padding: 10,
  },

  // Right col ~30% — full height, no internal splits
  colRight: {
    flex: 30,
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  // Center mid — top + bottom only, left open, right open
  centerMidBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  // Dividers
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});