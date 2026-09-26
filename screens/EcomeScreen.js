import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModuleWebHeader from '../components/Modulewebheader';

/* ─────────────────────────────────────────────────────────────────────────
 * SHURU DESIGN TOKENS (same family as EcomeSellScreen for consistency)
 * ───────────────────────────────────────────────────────────────────────── */
const SHURU = {
  primary: '#dc2626',
  primaryDark: '#b91c1c',
  primaryLight: '#fef2f2',
  primaryBorder: '#fecaca',
  radius: 14,        // card radius — slightly bigger for a premium feel
  radiusSm: 10,       // icon / small-element radius
  radiusPill: 999,
  textDark: '#1e293b',
  textMuted: '#6B7280',
};

const ECOME_MENU = [
  {
    id: 'sell',
    label: 'Sell',
    icon: 'storefront-outline',
    emoji: '🏪',
    iconStyle: 'primary',
    desc: 'List your farm produce or equipment for sale',
    screen: 'Sell',
    image: require('../assets/images/ecom-sell.png'),
  },
  {
    id: 'buy',
    label: 'Buy',
    icon: 'cart-outline',
    emoji: '🛒',
    iconStyle: 'dark',
    desc: 'Browse and buy farm produce or equipment',
    screen: 'FarmingBuy',   // ✅ FIXED: was 'Ecome' (self-loop)
    image: require('../assets/images/ecom-buy.png'),
  },
];

// Hero image for the top "Buy, Sell & Grow Together" banner
const ECOM_HERO_IMAGE = require('../assets/images/ecom-h.png');

// ✅ Web par require() kabhi-kabhi { uri, width, height } object deta hai —
// CSS url() ke andar seedha object nahi daal sakte, isliye asli string URI nikaalte hain.
const resolveWebUri = (source) => {
  if (typeof source === 'string') return source;

  if (source && typeof source === 'object') {
    if (typeof source.uri === 'string') return source.uri;
    if (source.default) return resolveWebUri(source.default);
  }

  try {
    if (Image && typeof Image.resolveAssetSource === 'function') {
      const resolved = Image.resolveAssetSource(source);
      return resolved?.uri || source;
    }
  } catch (_) {
    // ignore
  }

  return source;
};
const ECOM_HERO_IMAGE_URI = resolveWebUri(ECOM_HERO_IMAGE);
const ECOM_SELL_IMAGE_URI = resolveWebUri(require('../assets/images/ecom-sell.png'));
const ECOM_BUY_IMAGE_URI  = resolveWebUri(require('../assets/images/ecom-buy.png'));
const PROFILE_RED_IMAGE_URI = resolveWebUri(require('../assets/images/profile-red.png'));

const ICON_STYLES = {
  primary: { bg: SHURU.primaryLight, border: SHURU.primaryBorder, color: SHURU.primary },
  dark:    { bg: '#f1f5f9', border: '#e2e8f0', color: '#334155' },
};

function openEcomeMenuItem(navigation, item) {
  if (item.id === 'sell') {
    navigation.navigate('Sell');
    return;
  }
  navigation.navigate(item.screen);
}

// ─── Inject CSS at module load (FOUC fix) ────────────────────────────────────
if (typeof document !== 'undefined') {
  const id = 'ecome-web-styles';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const el = document.createElement('style');
  el.id = id;
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif&display=swap');
    @keyframes ecomeFadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ecome-root { display: flex; flex-direction: column; height: 100vh; font-family: 'DM Sans', sans-serif; background: #fff; }
    .ecome-topbar { height: 56px; background-image: url(${PROFILE_RED_IMAGE_URI}); background-size: cover; background-position: center; border-bottom: 1px solid #EDEDED; display: flex; align-items: center; padding: 0 20px; gap: 14px; }
    .ecome-topbar button {
      background: transparent; border: none; padding: 0;
      font-size: 14px; font-weight: 800; color: #ffffff; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    }
    .ecome-topbar button:hover { opacity: 0.85; }
    .ecome-main { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 28px 24px 56px; overflow-y: auto; background: #f8fafc; }
    .ecome-card-wrap { width: 100%; max-width: 1180px; }

    /* ── Hero ─────────────────────────────────────────────── */
    .ecome-hero {
      display: flex; align-items: center; justify-content: space-between; gap: 32px;
      background-image: url(${ECOM_HERO_IMAGE_URI});
      background-size: cover; background-position: center;
      border-radius: 20px; padding: 22px 44px; margin-bottom: 20px; overflow: hidden;
      border: 1px solid #fde3e5; min-height: 0;
    }
    .ecome-hero-left {
      flex: 1; min-width: 280px;
      background: transparent;
      border-radius: 16px; padding: 20px 24px;
    }
    .ecome-hero-badge {
      display: inline-flex; align-items: center; gap: 6px; background: ${SHURU.primary}; color: #fff;
      font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; margin-bottom: 18px;
    }
    .ecome-hero-title { font-family: 'DM Sans', sans-serif; font-size: 38px; font-weight: 800; line-height: 1.18; color: #1e293b; margin-bottom: 14px; }
    .ecome-hero-title span { color: ${SHURU.primary}; }
    .ecome-hero-desc { font-size: 15px; color: #64748b; line-height: 1.6; max-width: 480px; margin-bottom: 22px; }
    .ecome-hero-features { display: flex; flex-wrap: wrap; gap: 22px; }
    .ecome-feature-item { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: #334155; }
    .ecome-feature-icon {
      width: 30px; height: 30px; border-radius: 999px; background: #fff; display: flex; align-items: center;
      justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    .ecome-hero-right { flex-shrink: 0; width: 320px; display: flex; align-items: center; justify-content: center; }
    .ecome-hero-img { width: 100%; max-width: 320px; height: auto; object-fit: contain; border-radius: 16px; }

    /* ── Marketplace banner ───────────────────────────────── */
    .ecome-banner {
      background: linear-gradient(120deg, ${SHURU.primary}, ${SHURU.primaryDark} 70%);
      border-radius: 18px; padding: 22px 28px; display: flex; align-items: center; gap: 16px;
      margin-bottom: 28px; box-shadow: 0 10px 26px rgba(220,38,38,0.22);
    }
    .ecome-banner-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 22px; }
    .ecome-banner-title { font-size: 17px; font-weight: 800; color: #fff; }
    .ecome-banner-sub { font-size: 13px; color: rgba(255,255,255,0.88); margin-top: 3px; }
    .ecome-banner-cta {
      display: flex; align-items: center; gap: 8px; background: #fff; color: ${SHURU.primaryDark};
      font-size: 13.5px; font-weight: 800; padding: 11px 20px; border-radius: 999px; cursor: pointer;
      flex-shrink: 0; white-space: nowrap; transition: transform 0.15s ease;
    }
    .ecome-banner-cta:hover { transform: translateY(-2px); }

    /* ── Section header ───────────────────────────────────── */
    .ecome-sec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .ecome-sec-title { font-size: 19px; font-weight: 800; color: #1e293b; }
    .ecome-sec-sub { font-size: 13px; color: #94a3b8; margin: 4px 0 18px 0; }

    /* ── Sell / Buy cards ──────────────────────────────────── */
    .ecome-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .ecome-card {
      position: relative; overflow: hidden; min-height: 190px; border-radius: 20px;
      padding: 26px 26px; display: flex; flex-direction: column; justify-content: center; gap: 8px;
      cursor: pointer; animation: ecomeFadeUp 0.28s ease both; border: 1px solid rgba(0,0,0,0.04);
      transition: box-shadow 0.16s ease, transform 0.16s ease;
    }
    .ecome-card:hover { box-shadow: 0 14px 28px rgba(0,0,0,0.10); transform: translateY(-3px); }
    .ecome-card--sell {
      background-image: url(${ECOM_SELL_IMAGE_URI});
      background-size: 240% auto;
      background-position: 68% 55%;
      background-repeat: no-repeat;
    }
    .ecome-card--buy {
      background-image: url(${ECOM_BUY_IMAGE_URI});
      background-size: cover; background-position: center;
    }
    .ecome-card-body {
      position: relative; z-index: 2; max-width: 62%;
      background: transparent;
      border-radius: 12px; padding: 10px 14px;
    }
    .ecome-icon {
      width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center;
      justify-content: center; margin-bottom: 10px; font-size: 22px; line-height: 1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .ecome-label { font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -0.2px; }
    .ecome-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 4px; }
    .ecome-go-btn {
      position: absolute; top: 16px; right: 16px; z-index: 3; width: 34px; height: 34px; border-radius: 999px;
      background: ${SHURU.primary}; color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 800; box-shadow: 0 4px 10px rgba(220,38,38,0.35);
    }

    /* ── Stat cards ────────────────────────────────────────── */
    .ecome-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
    .ecome-stat-card {
      background: #fff; border: 1px solid #EDEDED; border-radius: 18px; padding: 20px 22px;
      display: flex; flex-direction: column; gap: 4px; box-shadow: 0 6px 18px rgba(0,0,0,0.04);
    }
    .ecome-stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 8px; }
    .ecome-stat-label { font-size: 13px; font-weight: 700; color: #64748b; }
    .ecome-stat-value { font-size: 23px; font-weight: 800; color: #1e293b; }
    .ecome-stat-foot { font-size: 12px; color: #94a3b8; margin-top: 2px; }

    /* ── Responsive ────────────────────────────────────────── */
    @media (max-width: 900px) {
      /* Mobile par hero ka photo background hata ke soft brand-gradient laga diya —
         single column layout mein poori photo (boxes/pins/phone) seedha text ke peeche
         chali jaati thi aur overlap karke ganda dikhti thi. Gradient text ke liye clean
         aur readable rehta hai, aur "sirf image dikhna chahiye" wale look ko bhi
         professional tareeke se maintain karta hai. */
      .ecome-hero {
        flex-direction: column; align-items: stretch; padding: 0; overflow: hidden;
        background-image: none;
      }
      .ecome-hero-left {
        background: linear-gradient(160deg, ${SHURU.primaryLight} 0%, #ffffff 100%);
        padding: 26px 22px; border-radius: 20px;
      }
      .ecome-hero-badge { margin-bottom: 14px; }
      .ecome-hero-title { font-size: 26px; margin-bottom: 10px; }
      .ecome-hero-desc { font-size: 14px; margin-bottom: 18px; }
      .ecome-hero-features { flex-direction: column; align-items: flex-start; gap: 12px; }
      .ecome-hero-right { display: none; }
      .ecome-grid { grid-template-columns: 1fr; }
      .ecome-stats-grid { grid-template-columns: 1fr; }
      .ecome-banner { flex-wrap: wrap; }
    }
  `;
  document.head.appendChild(el);
}

// ─── Mobile Layout ────────────────────────────────────────────────────────────

function EcomeMobile({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ecome (buy / sell)</Text>
          <Text style={styles.headerSubtitle}>Buy, sell or rent e-commerce resources</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="leaf" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Ecome Marketplace</Text>
            <Text style={styles.bannerSub}>Connect with sellers & buyers across your region</Text>
          </View>
        </View>

     {/* My Ecommerce Subscription — red banner ke turant niche */}
        <TouchableOpacity
          style={styles.mySubBtn}
          onPress={() => navigation.navigate('My Ecom Subscription')}
          activeOpacity={0.75}
        >
          <Ionicons name="receipt-outline" size={18} color={SHURU.primary} />
          <Text style={styles.mySubBtnText}>My Ecommerce Subscription</Text>
          <Ionicons name="chevron-forward" size={18} color={SHURU.primary} />
        </TouchableOpacity>

        {/* Menu Items */}
        <Text style={styles.sectionLabel}>What would you like to do?</Text>

        {ECOME_MENU.map((item) => {
          const ic = ICON_STYLES[item.iconStyle];
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => openEcomeMenuItem(navigation, item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: ic.bg, borderColor: ic.border }]}>
                <Ionicons name={item.icon} size={26} color={ic.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <View style={styles.goBtn}>
                <Ionicons name="chevron-forward" size={20} color={SHURU.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Web Layout ───────────────────────────────────────────────────────────────

function EcomeWeb({ navigation }) {
  const webItems = ECOME_MENU.map((item) => {
    const ic = ICON_STYLES[item.iconStyle];
    return (
      <div
        key={item.id}
        className={`ecome-card ecome-card--${item.id}`}
        onClick={() => openEcomeMenuItem(navigation, item)}
      >
        <div className="ecome-go-btn">→</div>
        <div className="ecome-card-body">
          <div className="ecome-icon" style={{ background: ic.bg }}>
            {item.emoji}
          </div>
          <div className="ecome-label">{item.label}</div>
          <div className="ecome-desc">{item.desc}</div>
        </div>
      </div>
    );
  });

  return (
    <div className="ecome-root">
      {/* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */}
      <ModuleWebHeader title="Ecome (buy / sell)" navigation={navigation} onBack={() => navigation.goBack()} />
      <div className="ecome-main">
        <div className="ecome-card-wrap">

          {/* Hero */}
          <div className="ecome-hero">
            <div className="ecome-hero-left">
              <div className="ecome-hero-badge">🛒 Ecome Marketplace</div>
              <div className="ecome-hero-title">Buy, Sell &amp; Grow <span>Together</span></div>
              <div className="ecome-hero-desc">
                Explore thousands of products, connect with trusted sellers and buyers, and grow your business in your region.
              </div>
              <div className="ecome-hero-features">
                <div className="ecome-feature-item"><span className="ecome-feature-icon">🛡️</span>Safe Transactions</div>
                <div className="ecome-feature-item"><span className="ecome-feature-icon">🚚</span>Local &amp; Regional</div>
                <div className="ecome-feature-item"><span className="ecome-feature-icon">🤝</span>Trusted Community</div>
              </div>
            </div>
          </div>

          {/* Marketplace subscription banner */}
          <div className="ecome-banner">
            <div className="ecome-banner-icon">👑</div>
            <div style={{ flex: 1 }}>
              <div className="ecome-banner-title">Ecome Marketplace</div>
              <div className="ecome-banner-sub">Connect with sellers &amp; Buyers across your region</div>
            </div>
            <div
              className="ecome-banner-cta"
              onClick={() => navigation.navigate('My Ecom Subscription')}
            >
              View Plans <span>→</span>
            </div>
          </div>

          {/* What would you like to do */}
          <div className="ecome-sec-header">
            <div>
              <div className="ecome-sec-title">What Would You Like To Do?</div>
              <div className="ecome-sec-sub">Quick access to your marketplace activities</div>
            </div>
          </div>
          <div className="ecome-grid">
            {webItems}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function EcomeScreen({ navigation }) {
  if (Platform.OS === 'web') return <EcomeWeb navigation={navigation} />;
  return <EcomeMobile navigation={navigation} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: SHURU.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  listContainer: { paddingHorizontal: 16, paddingTop: 18 },

  // === Banner: bold solid color, premium feel ===
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: SHURU.primary,
    borderRadius: SHURU.radius,
    padding: 18,
    marginBottom: 26,
    shadowColor: SHURU.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  bannerIconWrap: {
    width: 50,
    height: 50,
    borderRadius: SHURU.radiusSm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  bannerSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.88)', marginTop: 3, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  mySubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SHURU.primaryLight,
    borderWidth: 1,
    borderColor: SHURU.primaryBorder,
    borderRadius: SHURU.radius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  mySubBtnText: { flex: 1, fontSize: 14.5, fontWeight: '700', color: SHURU.primaryDark },
  // === Menu item: bigger touch target, subtle elevation — feels like a button ===
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: SHURU.radius,
    borderWidth: 1,
    borderColor: '#EDEDED',
    marginBottom: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: SHURU.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 16.5, fontWeight: '700', color: '#1e293b' },
  menuDesc: { fontSize: 13, color: '#94a3b8', marginTop: 3, lineHeight: 18 },
  goBtn: {
    width: 36,
    height: 36,
    borderRadius: SHURU.radiusPill,
    backgroundColor: SHURU.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});