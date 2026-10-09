// components/ModuleAndroidHeader.js
// ═══════════════════════════════════════════════════════════════════════════
//  SIRF ANDROID ka module header (Wallet, Withdraw, News Feed, Network ...).
//  Web aur iOS ka header yahan se alag hai — unme koi change nahi.
//
//  Android header ka design badalna ho to SIRF is file me badlo.
//    • Header ki height  -> ANDROID_HEADER_CONTENT_HEIGHT
//    • Red image ka mode -> IMAGE_RESIZE_MODE ('stretch' = poori image dikhegi,
//                           'cover' = crop hogi)
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Image, StatusBar, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const RED_IMAGE = require('../assets/images/profile-red.png');

// Status bar ke neeche header ki height (pehle 56 thi -> ab 68, image zyada dikhegi)
const ANDROID_HEADER_CONTENT_HEIGHT = 68;

// 'stretch' => poori red image header me fit (kam crop). 'cover' => purane jaisa.
const IMAGE_RESIZE_MODE = 'stretch';

export default function ModuleAndroidHeader({
  title,
  subtitle,
  navigation,
  onBack,
  showBack = true,
  rightExtra = null,
  bgImage,
}) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const safeTop = insets.top || StatusBar.currentHeight || 24;
  const totalH = safeTop + ANDROID_HEADER_CONTENT_HEIGHT;

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation?.goBack) navigation.goBack();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View
        style={{
          width: '100%',
          alignSelf: 'stretch',
          overflow: 'hidden',
          backgroundColor: '#b91c1c',
          height: totalH,
          paddingTop: safeTop,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Red image — poore header ke peeche */}
        <Image
          source={bgImage || RED_IMAGE}
          resizeMode={IMAGE_RESIZE_MODE}
          resizeMethod="scale"
          fadeDuration={0}
          style={[S.bgImg, { width: screenW, height: totalH }]}
          pointerEvents="none"
        />

        <View style={S.left}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={S.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#ffffff" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={S.titleWrap}>
          <Text style={S.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={S.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        <View style={S.right}>{rightExtra}</View>
      </View>
    </>
  );
}

const S = {
  bgImg: { position: 'absolute', top: 0, left: 0 },
  left: { flexDirection: 'row', alignItems: 'center', width: 36 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 36, justifyContent: 'flex-end' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'flex-start', marginLeft: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#ffffff', fontFamily: 'Roboto' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 1, fontFamily: 'Roboto' },
};