// components/EcomWebNavRail.js
// ═══════════════════════════════════════════════════════════════════════════
//  Persistent LEFT NAVIGATION RAIL — web-only, wide-screen module pages
//  (Ecome Marketplace, Subscription Plans, Wallet, etc. can all reuse this).
//
//  Usage:
//      <EcomWebNavRail navigation={navigation} activeItem="eCome Marketplace" />
//
//  ⚠️ SIRF WEB + WIDE SCREEN par use karna hai — component khud kuch check
//  nahi karta, jahan bhi lagao wahan `isWideWeb &&` guard laga dena (jaisa
//  baaki wide-web-only blocks me hota hai).
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAV_ITEMS = [
  { label: 'Home', icon: 'home-outline' },
  { label: 'Profile', icon: 'person-outline' },
  { label: 'Post News', icon: 'newspaper-outline', screen: 'QuickMenu' },
  { label: 'News Feed', icon: 'list-outline' },
  { label: 'My Network', icon: 'people-outline' },
  { label: 'Wallet', icon: 'wallet-outline' },
  { label: 'Withdraw', icon: 'cash-outline' },
  { label: 'Subscription Plans', icon: 'diamond-outline' },
  { label: 'My Subscription', icon: 'layers-outline', screen: 'My Subscriptions' },
  { label: 'eCome Marketplace', icon: 'bag-outline', screen: 'FarmingBuy' },
  { label: 'My Orders', icon: 'cube-outline', screen: 'My Listings' },
  { label: 'Live Streaming', icon: 'radio-outline' },
  { label: 'Certification', icon: 'ribbon-outline' },
  { label: 'Notifications', icon: 'notifications-outline' },
  { label: 'Ecome (buy / sell)', icon: 'pricetag-outline', screen: 'Ecome' },
  { label: 'Logout', icon: 'log-out-outline' },
];

export default function EcomWebNavRail({ navigation, activeItem }) {
  const handlePress = (item) => {
    if (item.label === 'Logout') {
      navigation?.replace?.('Login');
      return;
    }
    navigation?.navigate?.(item.screen || item.label);
  };

  return (
    <View style={styles.rail}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {NAV_ITEMS.map((item) => {
          const isActive = item.label === activeItem;
          const isLogout = item.label === 'Logout';
          // ✅ Sirf 'Profile' active ho tab hi color ke bajaye image dikhao — baaki
          // sab items ka active-highlight pehle jaisa solid red hi rahega.
          const isProfileActive = isActive && item.label === 'Profile';

          const itemContent = (
            <>
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? '#ffffff' : isLogout ? '#e11d48' : '#b91c1c'}
              />
              <Text style={[styles.itemText, isActive && styles.itemTextActive, isLogout && styles.itemTextLogout]}>
                {item.label}
              </Text>
            </>
          );

          if (isProfileActive) {
            return (
              <TouchableOpacity key={item.label} activeOpacity={0.85} onPress={() => handlePress(item)}>
                <ImageBackground
                  source={require('../assets/images/profile-red.png')}
                  resizeMode="cover"
                  imageStyle={{ borderRadius: 10 }}
                  style={[styles.item, styles.itemActive, styles.itemActiveImage]}
                >
                  {itemContent}
                </ImageBackground>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.item, isActive && styles.itemActive]}
              activeOpacity={0.85}
              onPress={() => handlePress(item)}
            >
              {itemContent}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 220,
    flexShrink: 0,
    backgroundColor: '#f8f9fb',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    minHeight: '100%',
    paddingVertical: 14,
  },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 24 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
    itemActive: {
    backgroundColor: '#b91c1c',
  },
  itemActiveImage: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  itemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    fontFamily: "'Roboto', sans-serif",
  },
  itemTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  itemTextLogout: {
    color: '#e11d48',
  },
});