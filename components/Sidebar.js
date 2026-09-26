// components/Sidebar.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ImageBackground,
  Modal, Pressable, Platform, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/SidebarStyles';
import { UserStore } from '../store/UserStore';
import { getProfileTier } from '../utils/profileHelpers';
import { PROFILE_TIERS } from '../constants/profileConstants';

const menuItems = [
  // ✅ Home sirf web pe dikhega APK mein nahi
  ...(Platform.OS === 'web' ? [{ label: 'Home', icon: 'home-outline' }] : []),
  // { label: 'Dashboard',          icon: 'grid-outline' },
  { label: 'Profile',            icon: 'person-outline' },
  { label: 'My Network',         icon: 'people-outline' },
  { label: 'Wallet',             icon: 'wallet-outline' },
  { label: 'Payment History',    icon: 'card-outline' },
  { label: 'Withdraw',           icon: 'cash-outline' },
  { label: 'Subscription Plans', icon: 'star-outline' },
  { label: 'My Ads Subscription', icon: 'megaphone-outline' },
   { label: 'My Ecom Subscription', icon: 'storefront-outline' },
  { label: 'My Quiz Subscription', icon: 'school-outline' },
  { label: 'News Feed',          icon: 'newspaper-outline' },
  { label: 'e-Paper',            icon: 'document-text-outline' },
  { label: 'Live Streaming',     icon: 'radio-outline' },
  { label: 'Certification',      icon: 'ribbon-outline' },
  { label: 'Notifications',      icon: 'notifications-outline' },
  { label: 'Settings',           icon: 'settings-outline' },
  { label: 'Logout',             icon: 'log-out-outline' },
];

export default function Sidebar({ visible, onClose, onItemPress, activeItem = 'Dashboard' }) {
  const navigation = useNavigation();
  const [profileTier, setProfileTier] = useState(PROFILE_TIERS.common);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await UserStore.getCurrentUser();
      if (mounted && user) setProfileTier(getProfileTier({ ...user, has_blue_tick: UserStore.hasBlueTick(user) }));
    })();
    return () => { mounted = false; };
  }, [activeItem, visible]);

  useEffect(() => {
    if (Platform.OS === 'web' && document?.activeElement?.blur) {
      document.activeElement.blur();
    }
  }, [visible]);

  const handleClose = () => {
    if (Platform.OS === 'web' && document?.activeElement?.blur) {
      document.activeElement.blur();
    }
    onClose();
  };
  const handlePress = (label) => {
    if (onItemPress) onItemPress(label);

    if (label === 'Logout') {
      navigation.replace('Login');
      return;
    }

    if (label === 'Payment History') {
      navigation.navigate('PaymentHistory');
      return;
    }

    navigation.navigate(label);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
           <View style={styles.overlay}>
                     <ImageBackground
          source={activeItem === 'Profile' && profileTier ? profileTier.bgImage : null}
          style={styles.drawer}
          imageStyle={{ resizeMode: 'cover' }}
        >

          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerBrand}>
              <View style={styles.logoBox}>
                
              </View>
              <Text style={styles.drawerTitle}>RTI News</Text>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={styles.menuLabel}>MAIN MENU</Text>

          {/* Menu + Footer inside scroll */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>

            {menuItems.map((item) => {
              const isActive = activeItem === item.label;
              const isLogout = item.label === 'Logout';

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    isLogout && styles.menuItemLogout,
                  ]}
                  onPress={() => {
                    handlePress(item.label);
                    handleClose();
                  }}
                >
                  <View style={[
                    styles.menuIconContainer,
                    isActive && styles.menuIconActive,
                    isLogout && styles.menuIconLogout,
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isActive ? '#fff' : isLogout ? '#ef4444' : '#64748b'}
                    />
                  </View>

                  <Text style={[
                    styles.menuText,
                    isActive && styles.menuTextActive,
                    isLogout && styles.menuTextLogout,
                  ]}>
                    {item.label}
                  </Text>

                  {isActive && !isLogout ? <View style={styles.activeIndicator} /> : null}
                </TouchableOpacity>
              );
            })}

            {/* ✅ Footer now properly placed */}
            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterText}>RTI News v1.0.0</Text>
              <Text style={styles.drawerFooterSub}>© 2026 All rights reserved</Text>
            </View>

          </ScrollView>
        </ImageBackground>

        <Pressable style={styles.backdrop} onPress={handleClose} />
      </View>
    </Modal>
  );
}