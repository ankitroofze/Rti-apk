import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Consistent safe-area wrapper for screens that manage their own header
 * (i.e. don't use <AppNavbar />, which already applies top insets itself).
 *
 * Usage:
 *   <SafeScreen style={styles.container}>
 *     ...screen content...
 *   </SafeScreen>
 *
 * `edges` lets a screen opt out of an edge it doesn't need padding on —
 * e.g. a screen with its own bottom action bar can pass edges={['top']}
 * so it doesn't get extra padding twice.
 */
export default function SafeScreen({ children, style, edges = ['top', 'bottom'], backgroundColor }) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.flex, backgroundColor ? { backgroundColor } : null, paddingStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});