import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SIDEBAR_MENU_ITEMS } from '../constants/homeData';
import { getMenuLabel } from '../utils/storyHelpers';

export default function NewsMenuSidebar({ activeMenuKey, onSelectMenu, isCompactLayout, commonCopy }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const positionRef = useRef(0);
  const totalWidthRef = useRef(0);

  useEffect(() => {
    if (!isCompactLayout) return;

    const ITEM_WIDTH = 90; // approx pill width + gap
    totalWidthRef.current = SIDEBAR_MENU_ITEMS.length * ITEM_WIDTH;

    const interval = setInterval(() => {
      positionRef.current += 1;
      if (positionRef.current >= totalWidthRef.current) {
        positionRef.current = 0;
        scrollRef.current?.scrollTo({ x: 0, animated: false });
      } else {
        scrollRef.current?.scrollTo({ x: positionRef.current, animated: false });
      }
    }, 20); // speed: lower = faster

    return () => clearInterval(interval);
  }, [isCompactLayout]);

  // Desktop: vertical sidebar (unchanged)
  if (!isCompactLayout) {
    return (
      <View style={styles.sidebarShell}>
        {SIDEBAR_MENU_ITEMS.map((menuItem) => {
          const isActive = activeMenuKey === menuItem.key;
          return (
            <TouchableOpacity
              key={menuItem.key}
              style={[
                styles.sidebarMenuButton,
                { borderColor: menuItem.accentColor, backgroundColor: isActive ? menuItem.surfaceColor : '#ffffff' },
                isActive && styles.sidebarMenuButtonActive,
              ]}
              onPress={() => onSelectMenu(menuItem.key)}
              activeOpacity={0.86}
            >
              <View style={[styles.sidebarMenuIconWrap, { backgroundColor: `${menuItem.accentColor}18` }]}>
                <Ionicons name={menuItem.icon} size={15} color={menuItem.accentColor} />
              </View>
              <Text style={[styles.sidebarMenuLabel, { color: menuItem.accentColor }]}>
                {getMenuLabel(menuItem, commonCopy)}
              </Text>
              <Ionicons name="chevron-forward-outline" size={13} color={menuItem.accentColor} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Mobile: Marquee scrolling pills
  const doubledItems = [...SIDEBAR_MENU_ITEMS, ...SIDEBAR_MENU_ITEMS];

  return (
    <View style={styles.marqueeShell}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true} // user bhi manually scroll kar sake
        contentContainerStyle={styles.marqueeContent}
      >
        {doubledItems.map((menuItem, index) => {
          const isActive = activeMenuKey === menuItem.key;
          return (
            <TouchableOpacity
              key={`${menuItem.key}-${index}`}
              style={[
                styles.marqueePill,
                {
                  borderColor: isActive ? menuItem.accentColor : `${menuItem.accentColor}55`,
                  backgroundColor: isActive ? menuItem.surfaceColor : '#fff',
                },
              ]}
              onPress={() => onSelectMenu(menuItem.key)}
              activeOpacity={0.82}
            >
              <View style={[styles.pillIcon, { backgroundColor: `${menuItem.accentColor}18` }]}>
                <Ionicons name={menuItem.icon} size={16} color={menuItem.accentColor} />
              </View>
              <Text style={[styles.pillLabel, { color: menuItem.accentColor }]}>
                {getMenuLabel(menuItem, commonCopy)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Desktop vertical sidebar ──
  sidebarShell: {
    width: 252,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0,
    padding: 14,
    gap: 10,
  },
  sidebarMenuButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarMenuButtonActive: {
    transform: [{ translateX: 2 }],
  },
  sidebarMenuIconWrap: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarMenuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Mobile Marquee ──
  marqueeShell: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  marqueeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  marqueePill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    minWidth: 68,
  },
  pillIcon: {
    width: 30, height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});