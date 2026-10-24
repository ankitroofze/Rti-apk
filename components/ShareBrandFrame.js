// components/ShareBrandFrame.js
// Share karne ke liye image ke upar RTI Voice branding (logo + ticker band + footer).
// Ye frame screenshot (react-native-view-shot) lekar branded image file banata hai.
import React, { forwardRef } from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';

export const SHARE_FRAME_SIZE = 1080 / 2; // 540 logical px (capture 2x => 1080)

const ShareBrandFrame = forwardRef(function ShareBrandFrame(
  { imageUri, onImageLoad, onImageError, title = '', refCode = '', tickerText = 'RTI INDIA NEWS' },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={st.frame}>
      <Image
        source={{ uri: imageUri }}
        style={st.photo}
        resizeMode="cover"
        onLoad={onImageLoad}
        onError={onImageError}
      />

      {/* logo — top-left */}
      <View style={st.logoWrap}>
        <Image source={require('../assets/images/certificate_logo.jpg')} style={st.logo} resizeMode="contain" />
      </View>

      {/* headline strip */}
      {title ? (
        <View style={st.titleBar}>
          <Text style={st.titleText} numberOfLines={2}>{title}</Text>
        </View>
      ) : null}

      {/* bottom brand band */}
      <View style={st.band}>
        <Text style={st.bandText} numberOfLines={1}>
          {`${tickerText}   •   RTI VOICE${refCode ? `   •   REF: ${refCode}` : ''}`}
        </Text>
      </View>
    </View>
  );
});

export default ShareBrandFrame;

const st = StyleSheet.create({
  frame: { width: SHARE_FRAME_SIZE, height: SHARE_FRAME_SIZE, backgroundColor: '#000', overflow: 'hidden' },
  photo: { ...StyleSheet.absoluteFillObject },
  logoWrap: {
    position: 'absolute', top: 12, left: 12, width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)',
  },
  logo: { width: 58, height: 58, borderRadius: 29 },
  titleBar: {
    position: 'absolute', left: 0, right: 0, bottom: 34, backgroundColor: 'rgba(185,28,28,0.92)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  titleText: { color: '#fff', fontSize: 20, lineHeight: 26, fontWeight: '800' },
  band: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 34,
    backgroundColor: 'rgba(31,41,55,0.9)', justifyContent: 'center', paddingHorizontal: 12,
  },
  bandText: {
    color: '#fff', fontSize: 13, letterSpacing: 0.8, fontWeight: '700',
    ...(Platform.OS === 'web' ? { fontFamily: "'Roboto', sans-serif" } : {}),
  },
});