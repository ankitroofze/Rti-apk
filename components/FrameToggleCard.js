// components/FrameToggleCard.js
// Add News screen me: "Breaking News Frame lagao" select karne ka card (preview + switch).
import React from 'react';
import { Image, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { FRAME_ASSET } from './NewsFrameOverlay';

export default function FrameToggleCard({ value, onChange }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onChange(!value)}
      style={[st.card, value && st.cardOn]}
    >
      <View style={st.thumbWrap}>
        <Image source={FRAME_ASSET} style={st.thumb} resizeMode="contain" />
      </View>
      <View style={st.textWrap}>
        <Text style={st.title}>Add Breaking News Frame</Text>
        <Text style={st.sub}>
          Red news frame lagega — title upar aur description neeche smoothly scroll hoga.
        </Text>
      </View>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
        thumbColor={value ? '#DC2626' : '#F9FAFB'}
        {...(Platform.OS === 'web' ? { activeThumbColor: '#DC2626' } : null)}
      />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cardOn: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  thumbWrap: {
    width: 84,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#111827',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: '100%', height: '100%' },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 11.5, color: '#6B7280', marginTop: 2, lineHeight: 15 },
});