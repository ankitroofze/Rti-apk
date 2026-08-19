import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    iconStyle: 'primary',
    desc: 'List your farm produce or equipment for sale',
    screen: 'Sell',
  },
  {
    id: 'buy',
    label: 'Buy',
    icon: 'cart-outline',
    iconStyle: 'dark',
    desc: 'Browse and buy farm produce or equipment',
    screen: 'FarmingBuy',   // ✅ FIXED: was 'Ecome' (self-loop)
  },
];

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
    .ecome-root { display: flex; flex-direction: column; height: 100vh; font-family: 'DM Sans', sans-serif; background: #FAFAF9; }
    .ecome-topbar { height: 60px; background: #fff; border-bottom: 1px solid #EDEDED; display: flex; align-items: center; padding: 0 24px; gap: 14px; }
    .ecome-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #1e293b; flex: 1; }
    .ecome-logo span { color: #94a3b8; }
    .ecome-main { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 56px 24px; overflow-y: auto; }
    .ecome-card-wrap { width: 100%; max-width: 560px; }
    .ecome-page-title { font-family: 'Instrument Serif', serif; font-size: 30px; color: #1e293b; margin-bottom: 6px; }
    .ecome-page-sub { font-size: 14px; color: #94a3b8; margin-bottom: 28px; }

    .ecome-banner { background: linear-gradient(135deg, ${SHURU.primary}, ${SHURU.primaryDark}); border-radius: ${SHURU.radius}px; padding: 22px 24px; display: flex; align-items: center; gap: 16px; margin-bottom: 32px; box-shadow: 0 8px 24px rgba(220,38,38,0.18); }
    .ecome-banner-icon { width: 48px; height: 48px; border-radius: ${SHURU.radiusSm}px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 24px; }
    .ecome-banner-title { font-size: 16px; font-weight: 700; color: #fff; }
    .ecome-banner-sub { font-size: 12.5px; color: rgba(255,255,255,0.85); margin-top: 3px; }

.ecome-sec-label { font-size: 10px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #b0b0b0; margin-bottom: 14px; }
    .ecome-mysub-btn { display: flex; align-items: center; justify-content: space-between; background: ${SHURU.primaryLight}; border: 1px solid ${SHURU.primaryBorder}; border-radius: ${SHURU.radius}px; padding: 14px 16px; margin-bottom: 22px; font-size: 14px; font-weight: 700; color: ${SHURU.primaryDark}; cursor: pointer; }

    .ecome-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ecome-card {
      background: #fff; border: 1px solid #EDEDED; border-radius: ${SHURU.radius}px;
      padding: 20px 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
      cursor: pointer; animation: ecomeFadeUp 0.28s ease both;
      transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
    }
    .ecome-card:hover { border-color: ${SHURU.primary}; box-shadow: 0 10px 24px rgba(0,0,0,0.06); transform: translateY(-3px); }
    .ecome-icon { width: 42px; height: 42px; border-radius: ${SHURU.radiusSm}px; display: flex; align-items: center; justify-content: center; }
    .ecome-label-row { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 2px; }
    .ecome-label { font-size: 15px; font-weight: 700; color: #1e293b; }
    .ecome-desc { font-size: 12.5px; color: #94a3b8; line-height: 1.45; }
    .ecome-go-btn { width: 28px; height: 28px; border-radius: 999px; background: ${SHURU.primaryLight}; display: flex; align-items: center; justify-content: center; color: ${SHURU.primary}; font-size: 14px; flex-shrink: 0; }
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
        className="ecome-card"
        onClick={() => openEcomeMenuItem(navigation, item)}
      >
        <div className="ecome-icon" style={{ background: ic.bg }}>
          <Ionicons name={item.icon} size={20} color={ic.color} />
        </div>
        <div className="ecome-label-row">
          <div className="ecome-label">{item.label}</div>
          <div className="ecome-go-btn">↗</div>
        </div>
        <div className="ecome-desc">{item.desc}</div>
      </div>
    );
  });

  return (
    <div className="ecome-root">
      <div className="ecome-topbar">
        <div className="ecome-logo">News<span>Hub</span></div>
        <button
          onClick={() => navigation.goBack()}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: SHURU.radiusSm, padding: '6px 14px', fontSize: 13, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Back
        </button>
      </div>
      <div className="ecome-main">
        <div className="ecome-card-wrap">
          <div className="ecome-page-title">Ecome (buy / sell)</div>
          <div className="ecome-page-sub">Buy, sell or rent e-commerce resources in your region</div>
          <div className="ecome-banner">
            <div className="ecome-banner-icon">🛒</div>
            <div>
              <div className="ecome-banner-title">Ecome Marketplace</div>
              <div className="ecome-banner-sub">Connect with sellers & buyers across your region</div>
            </div>
          </div>
          <div
            className="ecome-mysub-btn"
            onClick={() => navigation.navigate('My Ecom Subscription')}
          >
            <span>🧾 My Ecommerce Subscription</span>
            <span>→</span>
          </div>
          <div className="ecome-sec-label">What would you like to do?</div>
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