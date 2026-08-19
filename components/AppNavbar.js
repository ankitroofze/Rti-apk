import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getSiteCopy } from '../constants/siteCopy';
import { UserStore } from '../store/UserStore';
import { isValidImageUrl } from '../utils/storyHelpers';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';

const IS_WEB = Platform.OS === 'web';

const DESKTOP_NAV_ITEMS = [
  { labelKey: 'home', screen: 'Home', icon: 'home-outline' },
  { labelKey: 'feed', screen: 'Feed', icon: 'newspaper-outline' },
  { labelKey: 'create', screen: 'QuickMenu', icon: 'grid-outline', isCreateBtn: true },
  { labelKey: 'advertise', screen: 'Advertise', icon: 'megaphone-outline', isAdvertiseBtn: true },
  { labelKey: 'Profile', screen: 'Profile', icon: 'person-outline' },
  { labelKey: 'newspaper', screen: 'NewspaperList', icon: 'newspaper-outline' },

];

const MOBILE_NAV_ITEMS = [
  { labelKey: 'home', screen: 'Home', icon: 'home-outline' },
  { labelKey: 'feed', screen: 'Feed', icon: 'newspaper-outline' },
  { labelKey: 'liveStreaming', screen: 'Live Streaming', icon: 'radio-outline', isLiveBtn: true },
  { labelKey: 'advertise', screen: 'Advertise', icon: 'megaphone-outline', isAdvertiseBtn: true },
  { labelKey: 'Profile', screen: 'Profile', icon: 'person-outline' },


];

// Gallery / stories style slider — shown in the mobile top header, next to the logo.
// "Post News" opens Quick Menu (create), "Live" jumps straight into Live Streaming.
const GALLERY_SLIDER_ITEMS = [
  { labelKey: 'create', screen: 'QuickMenu', icon: 'add-circle', color: '#ea580c', isCreate: true },
  { labelKey: 'liveStreaming', screen: 'Live Streaming', icon: 'radio', color: '#e11d48', isLive: true },
  { labelKey: 'ePaper', screen: 'e-Paper', icon: 'document-text', color: '#4f46e5' },
  { labelKey: 'ecome', screen: 'Ecome', icon: 'leaf', color: '#16a34a' },
  { labelKey: 'certification', screen: 'Certification', icon: 'ribbon', color: '#0891b2' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

// Icon color map per tab (matching image style)
const TAB_ICON_COLORS = {
  Home: '#2196F3',
  Feed: '#4CAF50',
  QuickMenu: '#ffffff',
  'Live Streaming': '#ffffff',
  Advertise: '#FF9800',
  Profile: '#9C27B0',
};

// Simple looping pulse (opacity + scale) used to draw attention to "live" elements
function useBlink() {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

function blurActiveElement() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const el = document.activeElement;
  if (el && typeof el.blur === 'function') el.blur();
}

function useIsDesktop() {
  const { width } = useWindowDimensions();
  if (!IS_WEB) return false;
  if (isMobileWebDevice()) return false;
  // Tablets use the same touch-first header and navigation as phones.
  return getResponsiveWindowWidth(width) >= 1024;
}

// ─── Language Selector ─────────────────────────────────────────────────────
function NavbarLanguageSelector() {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);

  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((item) => item.code === language) || LANGUAGE_OPTIONS[0],
    [language]
  );

  const openDropdown = () => {
    if (IS_WEB) {
      setIsOpen(true);
      return;
    }
    triggerRef.current?.measure((fx, fy, width, height, px, py) => {
      const screenWidth = Dimensions.get('window').width;
      setDropdownPos({
        top: py + height + 4,
        right: screenWidth - px - width,
      });
      setIsOpen(true);
    });
  };

  const handleSelect = async (code) => {
    await changeLanguage(code);
    blurActiveElement();
    setIsOpen(false);
  };

  const dropdownContent = (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {LANGUAGE_OPTIONS.map((item) => {
        const isActive = item.code === selectedLanguage.code;
        return (
          <TouchableOpacity
            key={item.code}
            style={[styles.languageDropdownItem, isActive && styles.languageDropdownItemActive]}
            onPress={() => handleSelect(item.code)}
            activeOpacity={0.8}
          >
            <Text style={[styles.languageDropdownLabel, isActive && styles.languageDropdownLabelActive]}>
              {item.label}
            </Text>
            {isActive ? <Ionicons name="checkmark-circle" size={16} color="#e8732a" /> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.languageSelectorWrap}>
      <TouchableOpacity
        ref={triggerRef}
        style={styles.utilityPillButton}
        onPress={openDropdown}
        activeOpacity={0.85}
      >
        <Ionicons name="globe-outline" size={16} color="#0f172a" />
        <Text style={styles.utilityPillText}>{selectedLanguage.label}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={14}
          color="#475569"
        />
      </TouchableOpacity>

      {IS_WEB ? (
        isOpen ? (
          <>
            <TouchableOpacity
              style={styles.webOverlay}
              activeOpacity={1}
              onPress={() => { blurActiveElement(); setIsOpen(false); }}
            />
            <View style={styles.languageDropdownCard}>
              {dropdownContent}
            </View>
          </>
        ) : null
      ) : (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          onRequestClose={() => setIsOpen(false)}
          statusBarTranslucent
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={[
                styles.languageDropdownCard,
                styles.modalDropdownCard,
                { top: dropdownPos.top, right: dropdownPos.right },
              ]}
            >
              {dropdownContent}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

// ─── Profile Dropdown ──────────────────────────────────────────────────────
function NotificationBell({ navigation }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const summary = await UserStore.getNotificationsSummary();
        if (alive) setCount(summary?.unreadCount || 0);
      } catch {
        if (alive) setCount(0);
      }
    })();
    return () => { alive = false; };
  }, []);
  return (
    <TouchableOpacity
      style={styles.notificationBellBtn}
      onPress={() => navigation?.navigate?.('Notifications')}
      activeOpacity={0.85}
    >
      <Ionicons name="notifications-outline" size={20} color="#0f172a" />
      {count > 0 ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function ProfileDropdown({ navigation, showNameLabel }) {
  const { language } = useLanguage();
  const { isLoggedIn, logout, refresh } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const triggerRef = useRef(null);
  const copy = useMemo(() => getSiteCopy(language), [language]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      refresh?.();
      (async () => {
        try {
          const user = await UserStore.getCurrentUser();
          if (!alive) return;
          const uri = String(user?.profile_image || '').trim();
          const validUri = isValidImageUrl(uri) ? uri : '';
          setAvatarUri(prev => {
            if (prev !== validUri) setAvatarError(false);
            return validUri;
          });
          setCurrentUserName(user?.name || '');
          setIsPremiumUser(UserStore.hasPremiumAccess(user));
        } catch {
          if (!alive) return;
        } finally {
          if (alive) setIsReady(true);
        }
      })();
      return () => { alive = false; };
    }, [refresh])
  );

  const openDropdown = () => {
    if (IS_WEB) {
      setIsOpen(true);
      return;
    }
    triggerRef.current?.measure((fx, fy, width, height, px, py) => {
      const screenWidth = Dimensions.get('window').width;
      setDropdownPos({
        top: py + height + 4,
        right: screenWidth - px - width,
      });
      setIsOpen(true);
    });
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    setAvatarError(false);
    setAvatarUri('');
    navigation?.navigate?.('Home');
  };

  if (!isReady) return null;

  if (!isLoggedIn) {
    return (
      <TouchableOpacity
        style={styles.primaryActionButton}
        onPress={() => navigation?.navigate?.('Login')}
        activeOpacity={0.88}
      >
        <Ionicons name="person-add-outline" size={16} color="#ffffff" />
        <Text style={styles.primaryActionButtonText}>{copy.common.signIn}</Text>
      </TouchableOpacity>
    );
  }

  const dropdownContent = (
    <>
      <TouchableOpacity
        style={styles.profileDropdownItem}
        onPress={() => { setIsOpen(false); navigation?.navigate?.('Profile'); }}
        activeOpacity={0.7}
      >
        <Ionicons name="person-outline" size={18} color="#475569" />
        <Text style={styles.profileDropdownText}>{copy.common.profile}</Text>
      </TouchableOpacity>

      <View style={styles.dropdownDivider} />

      <TouchableOpacity
        style={[styles.profileDropdownItem, styles.logoutItem]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={18} color="#e8732a" />
        <Text style={[styles.profileDropdownText, styles.logoutText]}>{copy.common.logout}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.profileDropdownWrap}>
      <TouchableOpacity
        ref={triggerRef}
        style={styles.profileIconButton}
        onPress={openDropdown}
        activeOpacity={0.85}
      >
        {avatarUri && !avatarError ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.profileAvatarImg}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={32} color="#e8732a" />
        )}
        {showNameLabel ? (
          <View style={styles.profileNameLabelWrap}>
            <Text style={styles.profileNameLabel} numberOfLines={1}>{currentUserName}</Text>
            {isPremiumUser ? <Text style={styles.profilePremiumLabel}>Premium</Text> : null}
          </View>
        ) : null}
      </TouchableOpacity>

      {IS_WEB ? (
        isOpen ? (
          <>
            <TouchableOpacity
              style={styles.webOverlay}
              activeOpacity={1}
              onPress={() => { blurActiveElement(); setIsOpen(false); }}
            />
            <View style={styles.profileDropdownCard}>
              {dropdownContent}
            </View>
          </>
        ) : null
      ) : (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          onRequestClose={() => setIsOpen(false)}
          statusBarTranslucent
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={[
                styles.profileDropdownCard,
                styles.modalDropdownCard,
                { top: dropdownPos.top, right: dropdownPos.right },
              ]}
            >
              {dropdownContent}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

// ─── Brand ────────────────────────────────────────────────────────────────
function NavbarBrand({ onPressHome, compact }) {
  return (
    <TouchableOpacity style={styles.brandLink} onPress={onPressHome} activeOpacity={0.88}>
      <Image
        source={require('../assets/images/certificate_logo.jpg')}
        style={[styles.brandLogo, compact && styles.brandLogoCompact]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

// ─── Small blinking red dot — used to flag "live" / urgent items ──────────
function LiveDot({ size = 9, style }) {
  const anim = useBlink();
  return (
    <Animated.View
      style={[
        styles.liveDot,
        { width: size, height: size, borderRadius: size / 2, opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
        style,
      ]}
    />
  );
}

// ─── Gallery / Stories style slider — sits next to the logo in the mobile
// top header. First item opens Quick Menu (create/post), the rest are quick
// jumps into Live Streaming, e-Paper, Ecome and Certification. ──────────────
function GallerySlider({ handleNavigate, handleHomeShortcut }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gallerySliderWrap}
      contentContainerStyle={styles.gallerySliderContent}
    >
      {GALLERY_SLIDER_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.galleryItem}
          onPress={() => handleHomeShortcut(item.screen)}
          activeOpacity={0.8}
        >
          <View style={[styles.galleryIconRing, { borderColor: item.color }]}>
            <View style={[styles.galleryIconFill, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            {item.isLive && <LiveDot style={styles.galleryLiveDot} />}
          </View>
          <Text style={styles.galleryItemLabel} numberOfLines={1}>
            {item.isCreate ? 'Post' : item.isLive ? 'Live' : item.labelKey}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Mobile Top Header ────────────────────────────────────────────────────
function MobileTopHeader({ navigation, handleNavigate, handleHomeShortcut }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.mobileTopHeaderShell, { paddingTop: insets.top + 8 }]}>
      <View style={styles.mobileTopHeader}>
        <View style={styles.mobileTopHeaderLeft}>
          {/* Logo bada — aur uske bagal ka quick-menu icon hata diya gaya,
              "Post" gallery slider row me already available hai neeche */}
          <NavbarBrand onPressHome={() => handleNavigate('Home')} compact />
        </View>
        <View style={styles.mobileTopHeaderActions}>
          <NavbarLanguageSelector />
          <TouchableOpacity
            style={styles.mobileNewspaperBtn}
            onPress={() => handleNavigate('NewspaperList')}
            activeOpacity={0.85}
          >
            <Ionicons name="newspaper-outline" size={20} color="#e8732a" />
          </TouchableOpacity>
          <ProfileDropdown navigation={navigation} />
        </View>
      </View>
      <GallerySlider handleNavigate={handleNavigate} handleHomeShortcut={handleHomeShortcut} />
    </View>
  );
}

// ─── Mobile Bottom Bar ────────────────────────────────────────────────────
function MobileBottomBar({ activeScreen, handleNavigate }) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const copy = useMemo(() => getSiteCopy(language), [language]);
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.mobileBottomBar, { paddingBottom: bottomPad }]}>
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.screen;
        const iconColor = isActive
          ? (item.screen === 'QuickMenu' ? '#ffffff' : TAB_ICON_COLORS[item.screen] || '#2196F3')
          : '#94a3b8';

        if (item.isLiveBtn) {
          return (
            <TouchableOpacity
              key={item.screen}
              style={styles.mobileTabButton}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.85}
            >
              <View style={[styles.mobileTabFabWrap, styles.mobileTabFabWrapLive]}>
                <Ionicons name={item.icon} size={24} color="#ffffff" />
                <LiveDot size={10} style={styles.fabLiveDot} />
              </View>
              <Text style={[styles.mobileTabLabel, styles.mobileTabLabelLive]} numberOfLines={1}>
                {copy.common.liveStreaming || 'Live'}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.screen}
            style={styles.mobileTabButton}
            onPress={() => handleNavigate(item.screen)}
            activeOpacity={0.8}
          >
            <View style={[styles.mobileTabIconWrap, isActive && styles.mobileTabIconWrapActive]}>
              <Ionicons
                name={item.icon}
                size={20}
                color={iconColor}
              />
            </View>
            <Text
              style={[styles.mobileTabLabel, isActive && styles.mobileTabLabelActive]}
              numberOfLines={1}
            >
              {copy.common[item.labelKey] || item.labelKey}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────
export default function AppNavbar({ activeScreen, navigation, hideTopHeader = false, hideBottomBar = false }) {
  const { language } = useLanguage();
  const copy = useMemo(() => getSiteCopy(language), [language]);
  const isDesktop = useIsDesktop();

  const handleNavigate = (screenName) => {
    blurActiveElement();
    navigation?.navigate?.(screenName);
  };

  // Header shortcuts always begin a Home -> destination stack. Back therefore
  // returns Home, while links opened inside Quick Menu retain Quick Menu as
 const handleHomeShortcut = (screenName) => {
  blurActiveElement();
  navigation?.navigate?.(screenName);
};
  if (!isDesktop) {
    return (
      <>
        {!hideTopHeader && (
          <MobileTopHeader navigation={navigation} handleNavigate={handleNavigate} handleHomeShortcut={handleHomeShortcut} />
        )}
        {!hideBottomBar && (
          <MobileBottomBar activeScreen={activeScreen} handleNavigate={handleNavigate} />
        )}
      </>
    );
  }

  // ─── Desktop ───────────────────────────────────────────────────────────
  return (
    <View style={styles.desktopNavbarShell}>
      <View style={styles.desktopNavbarInner}>
        <NavbarBrand onPressHome={() => handleNavigate('Home')} />

        <View style={styles.desktopNavLinksRow}>
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.screen;
            return (
              <TouchableOpacity
                key={item.screen}
                style={[styles.desktopNavLink, isActive && styles.desktopNavLinkActive]}
                onPress={() => handleNavigate(item.screen)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={isActive ? '#e8732a' : '#475569'}
                />
                <Text style={[styles.desktopNavLabel, isActive && styles.desktopNavLabelActive]}>
                  {copy.common[item.labelKey] || item.labelKey}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.desktopActionsRow}>
          <NavbarLanguageSelector />
          <NotificationBell navigation={navigation} />
          <ProfileDropdown navigation={navigation} showNameLabel />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Desktop ───────────────────────────────────────────────────────────
  desktopNavbarShell: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 5000,
        overflow: 'visible',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
      },
      default: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
      },
    }),
  },
  desktopNavbarInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'nowrap',
    overflow: 'visible',
  },
  brandLink: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginRight: 4,
  },
  brandLogo: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ scale: 1.28 }],
  },
  // Mobile header logo — made noticeably bigger, no border around it
  brandLogoCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    transform: [{ scale: 1 }],
  },
  desktopNavLinksRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    minWidth: 0,
  },
  desktopNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  desktopNavLinkActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#e8732a',
  },
  desktopNavLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Roboto',
  },
  desktopNavLabelActive: {
    color: '#e8732a',
  },
  desktopActionsRow: {
    position: 'relative',
    zIndex: 5003,
    overflow: 'visible',
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },

  // ─── Mobile Top Header ─────────────────────────────────────────────────
  // Shell wraps both the logo/actions row AND the gallery slider row below it.
  mobileTopHeaderShell: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
      },
      default: {
        elevation: 6,
        ...Platform.select({
  web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
}),
      },
    }),
  },
  mobileTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  mobileTopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Gallery / stories style slider row
  gallerySliderWrap: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gallerySliderContent: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  galleryItem: {
    alignItems: 'center',
    gap: 4,
    width: 56,
  },
  galleryIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIconFill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryLiveDot: {
    position: 'absolute',
    top: -1,
    right: -1,
  },
  galleryItemLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  liveDot: {
    backgroundColor: '#e11d48',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  mobileTopHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ─── Web overlay ───────────────────────────────────────────────────────
  webOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5001,
  },

  // ─── Modal backdrop ────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ─── Language Selector ─────────────────────────────────────────────────
  // Border hata diya gaya — sirf globe icon + text + chevron, bina kisi outline ke
  languageSelectorWrap: {
    position: 'relative',
    zIndex: 5003,
  },
  utilityPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  utilityPillText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Roboto',
  },
  languageDropdownCard: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 190,
    maxHeight: 260,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 5004,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 18px 38px rgba(15, 23, 42, 0.16)' },
      default: {
        elevation: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
    }),
  },
  modalDropdownCard: {
    position: 'absolute',
  },
  languageDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageDropdownItemActive: {
    backgroundColor: '#fff7ed',
  },
  languageDropdownLabel: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Roboto',
  },
  languageDropdownLabelActive: {
    color: '#e8732a',
  },

  // ─── Profile Dropdown ──────────────────────────────────────────────────
  // Border/shadow hata diya gaya profile icon ke around, sirf avatar dikhega
  profileDropdownWrap: {
    position: 'relative',
    zIndex: 5003,
  },
  profileIconButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  profileNameLabelWrap: {
    marginLeft: 8,
    maxWidth: 120,
  },
  profileNameLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  profilePremiumLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e8732a',
  },
  profileAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  profileDropdownCard: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 200,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 5004,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 18px 38px rgba(15, 23, 42, 0.16)' },
      default: {
        elevation: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
    }),
  },
  profileDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileDropdownText: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  logoutItem: {
    marginBottom: 4,
  },
  logoutText: {
    color: '#e8732a',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#e8732a',
    ...Platform.select({
      default: {
        elevation: 4,
        shadowColor: '#e8732a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
    }),
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Roboto',
  },
  mobileNewspaperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fbd5b0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Mobile Bottom Bar ─────────────────────────────────────────────────
  // Image-style: white card, floating shadow, rounded top corners
  mobileBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 8,
    paddingTop: 10,
    borderTopWidth: 0,
    ...Platform.select({
      web: {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        boxShadow: '0 -8px 32px rgba(15, 23, 42, 0.14)',
      },
      default: {
        elevation: 20,
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
    }),
  },

  // Regular tab button wrapper
  mobileTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },

  // Regular tab icon container — small rounded square, no border
  mobileTabIconWrap: {
    width: 44,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // Active tab icon container — light tinted background
  mobileTabIconWrapActive: {
    backgroundColor: '#EBF5FF',
  },

  mobileTabLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  mobileTabLabelActive: {
    color: '#e8732a',
    fontWeight: '700',
  },

  // FAB-style button for the center tab (matching image's blue circle)
  mobileTabFabWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8732a',
    marginTop: -22,
    ...Platform.select({
      default: {
        elevation: 8,
        shadowColor: '#e8732a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
    }),
  },
  // Live Streaming now takes over the center FAB slot — red + blinking dot
  mobileTabFabWrapLive: {
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
  },
  fabLiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  mobileTabLabelLive: {
    color: '#e11d48',
    fontWeight: '700',
  },
});