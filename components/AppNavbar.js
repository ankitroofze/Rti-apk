import NameWithTick from './NameWithTick';
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
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { subscribeBadgeRefresh, unregisterDeviceToken } from '../utils/Pushnotifications';
import { getSiteCopy } from '../constants/siteCopy';
import RefreshButton from './RefreshButton';
import { UserStore } from '../store/UserStore';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfileTier, AVATAR_IMAGE } from '../utils/profileHelpers';
import { isValidImageUrl } from '../utils/storyHelpers';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';

const IS_WEB = Platform.OS === 'web';

const DESKTOP_NAV_ITEMS = [
  { labelKey: 'home', screen: 'Home', icon: 'home-outline' },
  { labelKey: 'News Feed', screen: 'Feed', icon: 'newspaper-outline' },
  { labelKey: 'Publish', screen: 'QuickMenu', icon: 'grid-outline', isCreateBtn: true },
  { labelKey: 'Promote', screen: 'Advertise', icon: 'megaphone-outline', isAdvertiseBtn: true },
  { labelKey: 'My Profile', screen: 'Profile', icon: 'person-outline' },
  { labelKey: 'E-Paper', screen: 'NewspaperList', icon: 'newspaper-outline' },

];

const MOBILE_NAV_ITEMS = [
  { labelKey: 'home', screen: 'Home', icon: 'home-outline' },
  { labelKey: 'feed', screen: 'Feed', icon: 'compass-outline' },
  { labelKey: 'create', screen: 'QuickMenu', icon: 'add', isCreateBtn: true },
  { labelKey: 'advertise', screen: 'Advertise', icon: 'megaphone-outline' },
  { labelKey: 'Settings', screen: 'Settings', icon: 'settings-outline' },
];
// Gallery / stories style slider — shown in the mobile top header, next to the logo.
// "Post News" opens Quick Menu (create), "Live" jumps straight into Live Streaming.
const GALLERY_SLIDER_ITEMS = [
  { labelKey: 'create', screen: 'QuickMenu',   isCreate: true, label: 'Post', image: require('../assets/images/news.png') },
  { labelKey: 'liveStreaming', screen: 'Live Streaming',   isLive: true, label: 'Live', image: require('../assets/images/live.png') },
  { labelKey: 'ePaper', screen: 'e-Paper',  label: 'e-paper', image: require('../assets/images/e-paper.png') },
  { labelKey: 'ecome', screen: 'Ecome',   label: 'Ecom', image: require('../assets/images/ecom.png') },
  { labelKey: 'certification', screen: 'Certification',   label: 'Certificate', image: require('../assets/images/certifcate.png') },
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
function NavbarLanguageSelector({ compact = false }) {
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
        style={compact ? styles.notificationBellBtn : styles.utilityPillButton}
        onPress={openDropdown}
        activeOpacity={0.85}
      >
        <Ionicons name="globe-outline" size={compact ? 20 : 16} color="#0f172a" />
        {!compact && (
          <>
            <Text style={styles.utilityPillText}>{selectedLanguage.label}</Text>
            <Ionicons name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color="#ef4444" />
          </>
        )}
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
function NotificationBell({ navigation, style }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const loadCount = async () => {
      try {
        const n = await UserStore.getUnreadNotificationCount();
        if (alive) setCount(n || 0);
      } catch {
        if (alive) setCount(0);
      }
    };
    loadCount();
    // foreground push aaye to badge turant refresh
    const unsub = subscribeBadgeRefresh(loadCount);
    return () => { alive = false; unsub?.(); };
  }, []);
  return (
    <TouchableOpacity
      style={[styles.notificationBellBtn, style]}
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
  useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { language } = useLanguage();
  const { isLoggedIn, logout, refresh } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserTick, setCurrentUserTick] = useState(false);
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
         const userTier = getProfileTier({ ...user, has_blue_tick: UserStore.hasBlueTick(user) });
          const validUri = userTier.key !== 'common' && isValidImageUrl(uri) ? uri : '';
          setAvatarUri(prev => {
            if (prev !== validUri) setAvatarError(false);
            return validUri;
          });
          setCurrentUserName(user?.name || '');
          setCurrentUserTick(UserStore.hasBlueTick(user));
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
    await unregisterDeviceToken(); // ✅ pehle device token hatao, phir logout
    await logout();
    setIsOpen(false);
    setAvatarError(false);
    setAvatarUri('');
      navigation?.reset?.({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (!isReady) return null;

  if (!isLoggedIn) {
    return (
      <TouchableOpacity
        style={styles.primaryActionButtonWrap}
        onPress={() => navigation?.navigate?.('Login')}
        activeOpacity={0.88}
      >
        <LinearGradient colors={['#ef4444', '#b91c1c', '#7f1d1d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryActionButton}>
          <Ionicons name="person-add-outline" size={16} color="#ffffff" />
          <Text style={styles.primaryActionButtonText}>{copy.common.signIn}</Text>
        </LinearGradient>
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
        <Ionicons name="person-outline" size={18} color="#ef4444" />
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
{true ? (
          <Image
            source={avatarUri && !avatarError ? { uri: avatarUri } : AVATAR_IMAGE}
            style={styles.profileAvatarImg}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <View style={styles.profileIconFallbackRing}>
            <Ionicons name="person" size={20} color="#ffffff" />
          </View>
        )}
        {showNameLabel ? (
          <View style={styles.profileNameLabelWrap}>
            <NameWithTick name={currentUserName} show={currentUserTick} style={styles.profileNameLabel} badgeSize={14} />
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

// ─── Desktop Nav Item — grey icon by default, label turns red on hover ─────
function DesktopNavItem({ item, isActive, onPress, label }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = IS_WEB
    ? { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) }
    : {};
  const iconColor = isActive ? '#e8732a' : (isHovered ? '#ef4444' : '#94a3b8');
  return (
    <TouchableOpacity
      style={[styles.desktopNavLink, isActive && styles.desktopNavLinkActive]}
      onPress={onPress}
      activeOpacity={0.85}
      {...hoverProps}
    >
      <Ionicons name={item.icon} size={16} color={iconColor} />
      <Text
        style={[
          styles.desktopNavLabel,
          isActive && styles.desktopNavLabelActive,
          !isActive && isHovered && styles.desktopNavLabelHover,
        ]}
      >
        {label}
      </Text>
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
                    <View style={styles.galleryIconRing}>
            <View style={[styles.galleryIconFill, { backgroundColor: item.image ? '#ffffff' : item.color + '18' }]}>
              {item.image ? (
                <Image source={item.image} style={styles.galleryIconImage} resizeMode="cover" />
              ) : (
                <Ionicons name={item.icon} size={20} color={item.color} />
              )}
            </View>
            {item.isLive && <LiveDot style={styles.galleryLiveDot} />}
          </View>
          <Text style={styles.galleryItemLabel} numberOfLines={1}>
            {item.label}
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
          <NavbarBrand onPressHome={() => handleNavigate('Home')} compact />
                  <View style={{ marginLeft: 8, flexShrink: 1, minWidth: 0 }}>
            <Text style={styles.mobileBrandTitle} numberOfLines={1}>
              RTI <Text style={{ color: '#1d3fae' }}>VOICE</Text>
            </Text>
            <Text style={styles.mobileBrandSubtitle} numberOfLines={1}>ALL INDIA RTI NEWS NETWORK</Text>
          </View>
        </View>
              <View style={styles.mobileTopHeaderActions}>
          <NavbarLanguageSelector compact />
<RefreshButton />
<NotificationBell navigation={navigation} />
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
  const [currentProfileTier, setCurrentProfileTier] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await UserStore.getCurrentUser();
      if (mounted && user) setCurrentProfileTier(getProfileTier({ ...user, has_blue_tick: UserStore.hasBlueTick(user) }));
    })();
    return () => { mounted = false; };
  }, [activeScreen]);
  return (
    <View style={[styles.mobileBottomBar, { paddingBottom: bottomPad }]}>
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.screen;
        const iconColor = isActive ? '#000000' : '#94a3b8';
        const iconName = isActive ? item.icon.replace('-outline', '') : item.icon;

           if (item.isCreateBtn) {
          return (
            <TouchableOpacity
              key={item.screen}
              style={styles.mobileTabButton}
              onPress={() => handleNavigate(item.screen)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#ffffff', '#f3f4f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mobileTabFabWrap}
              >
                <Ionicons name="add" size={34} color="#000000" />
              </LinearGradient>

              <Text style={styles.mobileTabLabel} numberOfLines={1}>
                {copy.common.create || ''}
              </Text>
            </TouchableOpacity>
          );
        }

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
            <View style={styles.mobileTabIconWrap}>
              <Ionicons
                name={iconName}
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
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <View style={[styles.desktopNavbarShell, isScrolled && styles.desktopNavbarShellScrolled]}>
      <View style={styles.desktopNavbarInner}>
        <NavbarBrand onPressHome={() => handleNavigate('Home')} />

        <View style={styles.desktopNavLinksRow}>
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.screen;
            return (
              <DesktopNavItem
                key={item.screen}
                item={item}
                isActive={isActive}
                onPress={() => handleNavigate(item.screen)}
                label={copy.common[item.labelKey] || item.labelKey}
              />
            );
          })}
        </View>

        <View style={styles.desktopUtilityRow}>
          <NavbarLanguageSelector />
        <RefreshButton />
<NotificationBell navigation={navigation} style={{ marginRight: 22 }} />
        </View>

        <View style={styles.desktopActionsRow}>
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
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease, backdrop-filter 0.2s ease',
      },
      default: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
      },
    }),
  },
  desktopNavbarShellScrolled: {
    ...Platform.select({
      web: {
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.12)',
      },
      default: { backgroundColor: '#ffffff' },
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
    fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto',
  },
   desktopNavLabelActive: {
    color: '#e8732a',
  },
  desktopNavLabelHover: {
    color: '#ef4444',
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
    marginLeft: 20,
  },
   desktopUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    marginLeft: 12,
  },

  // ─── Mobile Top Header ─────────────────────────────────────────────────
  // Shell wraps both the logo/actions row AND the gallery slider row below it.
   mobileTopHeaderShell: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 10,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
      },
      android: {
        elevation: 6,
        shadowColor: '#000',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
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
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  // Gallery / stories style slider row
   gallerySliderWrap: {
    borderTopWidth: 0,
  },
  gallerySliderContent: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
    galleryItem: {
    alignItems: 'center',
    gap: 2,
    width: 68,
  },
   galleryIconRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    backgroundColor: 'transparent',
  },
  galleryIconFill: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
   galleryIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  galleryLiveDot: {
    position: 'absolute',
    top: -1,
    right: -1,
  },
       galleryItemLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
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
    flexShrink: 0,
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
    fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto',
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
    width: 40,
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconFallbackRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 6, // bell thoda andar (kinare se door)
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    shadowOpacity: 0,
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
    color: '#2196F3',
  },
  profileAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ef4444',
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
    fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto',
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
  primaryActionButtonWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    flexShrink: 0,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
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
     mobileBrandTitle: {
  fontSize: 23.5,
  fontWeight: '600',
  color: '#c40b0b',
  letterSpacing: 0.3,
  marginLeft: -21,
  fontFamily: Platform.OS === 'web'
    ? "'Roboto', sans-serif"
    : 'Roboto_500Medium',
},

mobileBrandSubtitle: {
  fontSize: 13,
  fontWeight: '500',
  color: '#374151',
  letterSpacing: 0.3,
  marginTop: 1,
  marginLeft: -21,
  fontFamily: Platform.OS === 'web'
    ? "'Roboto', sans-serif"
    : 'Roboto_500Medium',
},
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
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
        boxShadow: '0 -6px 20px rgba(5, 5, 5, 0.35)',
      },
      default: {
        elevation: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
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
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  mobileTabLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // FAB-style button for the center tab (matching image's blue circle)
  mobileTabFabWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#686262',
    marginTop: -24,
    ...Platform.select({
      default: {
        elevation: 2,
        shadowColor: '#030303',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.62,
        shadowRadius: 6,
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