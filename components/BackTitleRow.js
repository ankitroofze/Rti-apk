// components/BackTitleRow.js
// Web auth pages (Login / Register / State / District / Taluka / Village) ka shared header row:
// "Back" button LEFT me, heading (title) bilkul CENTER me, dono ek hi line par.
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './RobotoText';

export default function BackTitleRow({ onBack, children, style, titleHeight = 34, label = 'Back' }) {
  return (
    <View style={[styles.row, style]}>
      {/* heading: center me. Side padding taaki lamba title Back button ke upar na chadhe */}
      <View style={styles.center}>{children}</View>

      {/* Back button: title wali line par, left me */}
      <TouchableOpacity
        style={[styles.back, { height: titleHeight }]}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={18} color="#111111" />
        <Text style={styles.backText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', position: 'relative', justifyContent: 'center' },
  center: { alignItems: 'center', paddingHorizontal: 68 },
  back: {
    position: 'absolute', left: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', zIndex: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  backText: { color: '#111111', fontWeight: '700', fontSize: 14, marginLeft: 6 },
});