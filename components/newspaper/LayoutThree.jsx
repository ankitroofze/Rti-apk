import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import ArticleBlock from './ArticleBlock';
import FooterBlock from './FooterBlock';

const NEWSPAPER_WIDTH = 1056;
const NEWSPAPER_HEIGHT = 2112;

export default function LayoutThree({ sections = {}, activeSection, onSelectSection, onSectionChange }) {
  const sel = (id) => activeSection === id;
  const press = (id) => () => onSelectSection && onSelectSection(id);
  const s = sections;

  return (
    <View style={styles.pageWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator horizontal={false}>
        <View style={styles.page}>

          {/* ── 1. Masthead ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('masthead')}>
            <View style={[styles.mastheadStrip, sel('masthead') && styles.editing]}>
              <Text style={styles.mastheadLeft}>{s.masthead?.date || 'जून २०१९'}</Text>
              <Text style={styles.mastheadCenter}>{s.masthead?.title || 'अखिल भारतीय माहिती अधिकार न्यूज नेटवर्क'}</Text>
              <Text style={styles.mastheadRight}>{s.masthead?.website || 'www.rtinewsnetwork.com'}</Text>
            </View>
          </TouchableOpacity>

          {/* ── 2. TOP: Left story + Right black banner story ── */}
          <View style={[styles.row, styles.borderBottom]}>

            {/* Left Top */}
            <TouchableOpacity style={[styles.colHalf, styles.borderRight]} activeOpacity={0.85} onPress={press('top_left')}>
              <ArticleBlock
                data={s.top_left}
                isMain
                columns={2}
                isEditing={sel('top_left')}
                onDataChange={(u) => onSectionChange && onSectionChange('top_left', u)}
              />
            </TouchableOpacity>

            {/* Right Top — black banner style */}
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('top_right')}>
              {/* Black reverse headline */}
              <View style={styles.blackBanner}>
                <Text style={styles.blackBannerText} numberOfLines={3}>
                  {s.top_right?.title || 'मुख्य शीर्षक यहाँ'}
                </Text>
              </View>
              {/* Grey sub headline */}
              <View style={styles.greySubBanner}>
                <Text style={styles.greySubText} numberOfLines={2}>
                  {s.top_right?.sub || 'उप शीर्षक यहाँ'}
                </Text>
              </View>
              <ArticleBlock
                data={{ ...s.top_right, title: '', sub: '' }}
                columns={2}
                isEditing={sel('top_right')}
                onDataChange={(u) => onSectionChange && onSectionChange('top_right', u)}
              />
            </TouchableOpacity>
          </View>

          {/* ── 3. MIDDLE: Left article + Right notice box ── */}
          <View style={[styles.row, styles.borderBottom]}>

            {/* Middle Left */}
            <TouchableOpacity style={[styles.colHalf, styles.borderRight]} activeOpacity={0.85} onPress={press('mid_left')}>
              <ArticleBlock
                data={s.mid_left}
                columns={2}
                isEditing={sel('mid_left')}
                onDataChange={(u) => onSectionChange && onSectionChange('mid_left', u)}
              />
            </TouchableOpacity>

            {/* Middle Right — notice box */}
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('mid_right')}>
              <View style={styles.noticeBox}>
                <Text style={styles.noticeTitle}>{s.mid_right?.title || 'सूचना / नोटिस'}</Text>
                <View style={styles.noticeSubStrip}>
                  <Text style={styles.noticeSubText}>{s.mid_right?.sub || 'महत्वपूर्ण जानकारी'}</Text>
                </View>
                <ArticleBlock
                  data={{ ...s.mid_right, title: '', sub: '' }}
                  columns={2}
                  isEditing={sel('mid_right')}
                  onDataChange={(u) => onSectionChange && onSectionChange('mid_right', u)}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── 4. LOWER: Left black strip + Right dense columns ── */}
          <View style={[styles.row, styles.borderBottom]}>

            {/* Lower Left */}
            <TouchableOpacity style={[styles.colHalf, styles.borderRight]} activeOpacity={0.85} onPress={press('low_left')}>
              <View style={styles.blackHeadlineStrip}>
                <Text style={styles.blackHeadlineText} numberOfLines={2}>
                  {s.low_left?.title || 'विशेष रिपोर्ट शीर्षक'}
                </Text>
              </View>
              <View style={styles.greySubBox}>
                <Text style={styles.greySubBoxText}>{s.low_left?.sub || 'उप विवरण'}</Text>
              </View>
              <ArticleBlock
                data={{ ...s.low_left, title: '', sub: '' }}
                columns={2}
                isEditing={sel('low_left')}
                onDataChange={(u) => onSectionChange && onSectionChange('low_left', u)}
              />
            </TouchableOpacity>

            {/* Lower Right — dense columns */}
            <TouchableOpacity style={styles.colHalf} activeOpacity={0.85} onPress={press('low_right')}>
              <ArticleBlock
                data={s.low_right}
                columns={2}
                isEditing={sel('low_right')}
                onDataChange={(u) => onSectionChange && onSectionChange('low_right', u)}
              />
            </TouchableOpacity>
          </View>

          {/* ── 5. Footer ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('footer')}>
            <FooterBlock
              data={s.footer}
              isEditing={sel('footer')}
              onDataChange={(u) => onSectionChange && onSectionChange('footer', u)}
            />
          </TouchableOpacity>

          {/* ── 6. Slogan Bar ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={press('slogan')}>
            <View style={[styles.sloganBar, sel('slogan') && styles.editing]}>
              <Text style={styles.sloganText}>
                {s.slogan?.text || 'सर्वसामान्य जनतेत भारतीय कायद्याचे प्रबोधन करणारे एकमेव न्यूज पेपर!'}
              </Text>
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
  mastheadLeft:   { fontSize: 10, color: '#333', fontWeight: '600' },
  mastheadCenter: { fontSize: 10, color: '#333', fontWeight: '700', textAlign: 'center', flex: 1, marginHorizontal: 10 },
  mastheadRight:  { fontSize: 10, color: '#333', fontWeight: '600' },

  // Columns
  colHalf: { flex: 1, padding: 14 },

  // Black banner (top right headline)
  blackBanner: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  blackBannerText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 30,
  },

  // Grey sub banner
  greySubBanner: {
    backgroundColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  greySubText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },

  // Notice box (middle right)
  noticeBox: {
    borderWidth: 1.5,
    borderColor: '#444',
    padding: 10,
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  noticeSubStrip: {
    backgroundColor: '#e0ddd8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  noticeSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },

  // Black headline strip (lower left)
  blackHeadlineStrip: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 0,
  },
  blackHeadlineText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
  },

  // Grey sub box (lower left)
  greySubBox: {
    backgroundColor: '#e8e4df',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
  },
  greySubBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444',
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