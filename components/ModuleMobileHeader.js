// components/ModuleMobileHeader.js
// Router: Web -> kuch nahi (web ka header Modulewebheader.js se aata hai)
//         Android -> components/ModuleAndroidHeader.js (alag design)
//         iOS -> ab Android jaisa hi (ModuleAndroidHeader). IosModuleHeader neeche backup ke liye rakha hai
import React from 'react';
import { Platform, StatusBar, View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ModuleAndroidHeader from './ModuleAndroidHeader';

const RED_IMAGE = require('../assets/images/profile-red.png');

const HEADER_CONTENT_HEIGHT = 56;

export default function ModuleMobileHeader(props) {
  if (Platform.OS === 'web') return null;
  // iOS bhi ab Android jaisa header (ModuleAndroidHeader) use karta hai
  return <ModuleAndroidHeader {...props} />;
}

function IosModuleHeader({
  title,
  subtitle,
  navigation,
  onBack,
  showBack = true,
  rightExtra = null,
  bgImage,
}) {
  const insets = useSafeAreaInsets();
  const safeTop = insets.top || 44;

  const barStyle = {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    height: safeTop + HEADER_CONTENT_HEIGHT,
    paddingTop: safeTop,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation?.goBack) navigation.goBack();
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={bgImage || RED_IMAGE}
        resizeMode="cover"
        imageStyle={S.barImg}
        style={barStyle}
      >
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

        <View style={S.right}>
          {rightExtra}
        </View>
      </ImageBackground>
    </>
  );
}

const S = {
  barImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  left:  { flexDirection: 'row', alignItems: 'center', width: 36 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 36, justifyContent: 'flex-end' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'flex-start', marginLeft: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#ffffff', fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Roboto_700Bold' : 'Roboto' },
};