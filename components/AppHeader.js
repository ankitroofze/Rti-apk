import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Platform, StatusBar, Dimensions, Image,
  TextInput, ScrollView,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RESPONSIVE_SCREEN_WIDTH = getResponsiveWindowWidth(SCREEN_WIDTH);

const IS_WEB = Platform.OS === 'web';
const IS_WEB_MOBILE = IS_WEB && (isMobileWebDevice() || RESPONSIVE_SCREEN_WIDTH < 768);
const IS_NATIVE_MOBILE = Platform.OS === 'android' || Platform.OS === 'ios';
const IS_MOBILE = IS_NATIVE_MOBILE || IS_WEB_MOBILE;

function blurActiveElement() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const activeElement = document.activeElement;
  if (activeElement && typeof activeElement.blur === 'function') {
    activeElement.blur();
  }
}

const INDIAN_LANGUAGES = [
  { code: 'as',  label: 'Assamese',  native: 'অসমীয়া'   },
  { code: 'bn',  label: 'Bengali',   native: 'বাংলা'      },
  { code: 'bo',  label: 'Bodo',      native: 'बड़ो'        },
  { code: 'do',  label: 'Dogri',     native: 'डोगरी'      },
  { code: 'en',  label: 'English',   native: 'English'    },
  { code: 'gu',  label: 'Gujarati',  native: 'ગુજરાતી'    },
  { code: 'hi',  label: 'Hindi',     native: 'हिन्दी'     },
  { code: 'kn',  label: 'Kannada',   native: 'ಕನ್ನಡ'      },
  { code: 'ks',  label: 'Kashmiri',  native: 'کٲشُر'      },
  { code: 'kok', label: 'Konkani',   native: 'कोंकणी'     },
  { code: 'mai', label: 'Maithili',  native: 'मैथिली'     },
  { code: 'ml',  label: 'Malayalam', native: 'മലയാളം'     },
  { code: 'mni', label: 'Manipuri',  native: 'মৈতৈলোন্'   },
  { code: 'mr',  label: 'Marathi',   native: 'मराठी'      },
  { code: 'ne',  label: 'Nepali',    native: 'नेपाली'     },
  { code: 'or',  label: 'Odia',      native: 'ଓଡ଼ିଆ'      },
  { code: 'pa',  label: 'Punjabi',   native: 'ਪੰਜਾਬੀ'     },
  { code: 'sa',  label: 'Sanskrit',  native: 'संस्कृतम्'  },
  { code: 'sat', label: 'Santali',   native: 'ᱥᱟᱱᱛᱟᱲᱤ'   },
  { code: 'sd',  label: 'Sindhi',    native: 'سنڌي'       },
  { code: 'ta',  label: 'Tamil',     native: 'தமிழ்'      },
  { code: 'te',  label: 'Telugu',    native: 'తెలుగు'     },
  { code: 'ur',  label: 'Urdu',      native: 'اردو'       },
];

function LanguageSelector({ compact = false }) {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[4];

  const filtered = search.trim()
    ? INDIAN_LANGUAGES.filter(
        (l) =>
          l.label.toLowerCase().includes(search.toLowerCase()) ||
          l.native.toLowerCase().includes(search.toLowerCase())
      )
    : INDIAN_LANGUAGES;

  const handleSelect = (lang) => {
    changeLanguage(lang.code);
    blurActiveElement();
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={{ position: 'relative', zIndex: 1000 }}>
      <TouchableOpacity
        style={[s.langBtn, compact && s.langBtnCompact]}
        onPress={() => {
          if (open) blurActiveElement();
          setOpen(!open);
          setSearch('');
        }}
        activeOpacity={0.8}
      >
        <Text style={s.langBtnIcon}>🌐</Text>
        <Text style={[s.langBtnText, compact && s.langBtnTextCompact]}>
          {selected.native}
        </Text>
        <Text style={s.langChevron}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {open ? (
        <>
          <TouchableOpacity
            style={s.dropdownOverlay}
            activeOpacity={1}
            onPress={() => {
              blurActiveElement();
              setOpen(false);
              setSearch('');
            }}
          />
          <View style={s.dropdown}>
            <View style={s.searchRow}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Search..."
                placeholderTextColor="#bbb"
                value={search}
                onChangeText={setSearch}
                autoFocus={Platform.OS === 'web'}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: '#bbb', fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={s.langList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {filtered.length === 0
                ? <Text style={s.noResult}>No language found</Text>
                : filtered.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      style={[s.langItem, item.code === selected.code && s.langItemSelected]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.langItemNative}>{item.native}</Text>
                      <Text style={s.langItemLabel}>{item.label}</Text>
                      {item.code === selected.code
                        ? <Text style={s.langItemCheck}>✓</Text>
                        : null}
                    </TouchableOpacity>
                  ))
              }
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
}

export default function AppHeader({ navigation, compact = false }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const formatTime = (date) => date.toLocaleTimeString('en-IN');

  const androidPad = Platform.OS === 'android'
    ? { paddingTop: StatusBar.currentHeight || 0 }
    : null;

  // ── MOBILE LAYOUT ──
  if (IS_MOBILE) {
    return (
      <View style={[s.root, androidPad]}>
        {/* Row 1: Logo + Title */}
        <View style={s.mobileRow1}>
          <TouchableOpacity onPress={() => navigation?.navigate('Home')}>
            <Image
              source={require('../assets/images/certificate_logo.jpg')}
              style={s.mobileLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation?.navigate('Home')}
            style={{ flex: 1 }}
          >
            <Text style={s.mobileTitle} numberOfLines={2} adjustsFontSizeToFit>
              {'भारतीय माहिती अधिकार'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Language + SignIn */}
        <View style={s.mobileRow2}>
          <LanguageSelector compact />
          <TouchableOpacity
            style={s.signInBtn}
            onPress={() => navigation?.navigate('Login')}
          >
            <Text style={s.signInIcon}>{'👤'}</Text>
            <Text style={s.signInText}>{'Sign IN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Orange Date/Time */}
        <View style={s.brandBar}>
          <Text style={s.tickerText}>{'📅 '}{formatDate(time)}</Text>
          <Text style={s.tickerText}>{'⏰ '}{formatTime(time)}</Text>
        </View>

        <View style={s.bottomBar} />
      </View>
    );
  }

  // ── DESKTOP WEB LAYOUT ──
  return (
    <View style={[s.root, androidPad]}>
      <View style={s.utilityBar}>
        <TouchableOpacity
          onPress={() => navigation?.navigate('Home')}
          style={s.logoWrap}
        >
          <Image
            source={require('../assets/images/certificate_logo.jpg')}
            style={s.logoTop}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.navigate('Home')}>
          <View style={s.titleContainer}>
            <Text style={s.centerTitleSaffron}>{'भारतीय'}</Text>
            <Text style={s.centerTitleWhite}>{'माहिती'}</Text>
            <Text style={s.centerTitleGreen}>{'अधिकार'}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.rightGroup}>
          <LanguageSelector />
          <TouchableOpacity
            style={s.signupBtn}
            onPress={() => navigation?.navigate('Login')}
          >
            <Text style={s.signupIcon}>{'👤'}</Text>
            <Text style={s.signupText}>{'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.brandBar, compact && s.brandBarCompact]}>
        <Text style={s.tickerText}>{'📅 '}{formatDate(time)}</Text>
        <Text style={s.tickerText}>{'⏰ '}{formatTime(time)}</Text>
      </View>

      <View style={s.bottomBar} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    elevation: 6,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.10)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
      default: {},
    }),
  },

  // ── Mobile ──
  mobileRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },
  mobileLogo: {
    width: 50,
    height: 50,
    flexShrink: 0,
  },
  mobileTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: '#f97316',
    textAlign: 'center',
  },
  mobileRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 1000,
  },

  // ── Sign In Button (mobile) — FIX: ye styles missing thi ──
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f97316',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  signInIcon: { fontSize: 12 },
  signInText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // ── Desktop ──
  utilityBar: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249,115,22,0.15)',
    zIndex: 100,
  },
  logoWrap: {
    position: 'absolute',
    left: 12,
  },
  logoTop: {
    width: 85,
    height: 85,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerTitleSaffron: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FF9933',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  centerTitleWhite: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  centerTitleGreen: {
    fontSize: 54,
    fontWeight: '900',
    color: '#138808',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  rightGroup: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 200,
  },

  // ── Language Button ──
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#f97316',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  langBtnCompact: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  langBtnIcon: { fontSize: 13 },
  langBtnText: { color: '#f97316', fontSize: 13, fontWeight: '800' },
  langBtnTextCompact: { fontSize: 11 },
  langChevron: { color: '#f97316', fontSize: 10, fontWeight: '800' },

  // ── Dropdown ──
  dropdownOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 998,
    ...Platform.select({
      web: { position: 'fixed' },
      default: { position: 'absolute', width: 9999, height: 9999 },
    }),
  },
  dropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f97316',
    zIndex: 9999,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(249,115,22,0.20)' },
      ios: { shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 },
      android: { elevation: 20 },
    }),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249,115,22,0.12)',
    gap: 6,
    backgroundColor: '#fff',
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    paddingVertical: 2,
    outlineStyle: 'none',
  },
  langList: { maxHeight: 220, backgroundColor: '#fff' },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  langItemSelected: { backgroundColor: '#fff7ed' },
  langItemNative: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  langItemLabel: { fontSize: 11, color: '#999' },
  langItemCheck: { fontSize: 14, color: '#f97316', fontWeight: '900' },
  noResult: { textAlign: 'center', padding: 16, color: '#bbb', fontSize: 13 },

  // ── Signup (desktop) ──
  signupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f97316',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  signupIcon: { fontSize: 12 },
  signupText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // ── Brand Bar ──
  brandBar: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  brandBarCompact: {},
  tickerText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  bottomBar: { height: 4, backgroundColor: 'white' },
});
