// components/ModuleWebHeader.js
// ═══════════════════════════════════════════════════════════════════════════
//  SINGLE SOURCE OF TRUTH — sab modules ka WEB header yahin se aata hai.
//
//  Har screen sirf itna likhti hai:
//      <ModuleWebHeader title="Wallet" navigation={navigation} />
//
//  Design (red image background, height, back button, bell icon, profile
//  icon) yahin define hai — kal ko kuch bhi badalna ho to SIRF is file me
//  badlo, poore app me apne aap apply ho jayega. Screen me sirf `title`
//  change hota hai.
//
//  ⚠️ SIRF WEB. Platform.OS !== 'web' hone par ye component `null` return
//  karta hai, isliye Android/iOS ka purana header bilkul waisa hi rehta hai —
//  mobile me koi change nahi.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';
import { getProfileTier, AVATAR_IMAGE } from '../utils/profileHelpers';
import { MODULE_HEADER_HEIGHT_WEB, HEADER_BG_IMAGE } from '../constants/subscriptionThemes';

// Profile icon ke andar bhi yahi red image lagti hai
const RED_IMAGE = require('../assets/images/profile-red.png');

const S = {
  // Bar — fixed height + overflow hidden, warna image header ke bahar phail jaati hai
  bar: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#b91c1c',           // image load hone tak ka fallback
    height: MODULE_HEADER_HEIGHT_WEB,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 0,
    flexShrink: 0,
  },
  barImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },

  left:  { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },

   backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  backTxt: { fontSize: 13, fontWeight: '600', color: '#ffffff', fontFamily: "'Roboto', sans-serif" },

  title: { fontSize: 15, fontWeight: '600', color: '#ffffff', fontFamily: "'Roboto', sans-serif" },

  bellBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },

  // Profile icon — circle ke andar bhi red wali image
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#b91c1c',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarImg: { borderRadius: 17, resizeMode: 'cover' },
  avatarPhoto: { width: '100%', height: '100%', borderRadius: 17 },
};

export default function ModuleWebHeader({
  title,                 // ← sirf yehi har screen me alag hota hai
  navigation,
  onBack,                // optional — default: QuickMenu par wapas
  showBack = true,
  bgImage,               // optional — Profile screen apna tier image bhejti hai
  avatarUri,             // optional — user ki profile photo
 avatarBgImage = null,  // optional — sirf Profile screen bhejti hai
  avatarBgColor = null,  // optional — sirf Profile screen bhejti hai
  rightExtra = null,
}) {
  // ── Mobile par kuch render nahi — Android/iOS bilkul pehle jaisa ──
   // Profile circle: user ki apni photo (sirf Role/Premium/Verified ke liye) warna default avatar.png
  const [selfAvatar, setSelfAvatar] = useState(null);
  useEffect(() => {
    if (avatarUri || Platform.OS !== 'web') return undefined;
    let alive = true;
    (async () => {
      try {
        const user = await UserStore.getCurrentUser();
        if (!alive || !user) return;
        const tier = getProfileTier({ ...user, has_blue_tick: UserStore.hasBlueTick(user) });
        const uri = String(user.profile_image || '').trim();
        setSelfAvatar(tier.key !== 'common' && uri ? { uri } : AVATAR_IMAGE);
      } catch { /* icon fallback rahega */ }
    })();
    return () => { alive = false; };
  }, [avatarUri]);

  if (Platform.OS !== 'web') return null;

  const go = (screen) => {
    if (navigation?.navigate) navigation.navigate(screen);
  };

  const handleBack = () => {
    if (onBack) return onBack();
    go('QuickMenu');
  };

  return (
    <ImageBackground
      source={bgImage || HEADER_BG_IMAGE}
      resizeMode="cover"
      imageStyle={S.barImg}
      style={S.bar}
    >
      <View style={S.left}>
        {showBack ? (
          <TouchableOpacity style={S.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Feather name="arrow-left" size={15} color="#ffffff" />
            <Text style={S.backTxt}>Back</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={S.title} numberOfLines={1}>{title}</Text>
      </View>

      <View style={S.right}>
        {rightExtra}

        {/* Bell */}
        <TouchableOpacity style={S.bellBtn} onPress={() => go('Notifications')} activeOpacity={0.8}>
          <Feather name="bell" size={16} color="#ffffff" />
        </TouchableOpacity>

        {/* Profile — icon ke andar bhi red image */}
        <TouchableOpacity onPress={() => go('Profile')} activeOpacity={0.8}>
          <ImageBackground
           source={avatarBgImage || RED_IMAGE}
            resizeMode="cover"
            imageStyle={S.avatarImg}
style={[S.avatarBtn, avatarBgColor ? { backgroundColor: avatarBgColor } : null]}
          >
            {avatarUri || selfAvatar ? (
            <Image source={avatarUri ? { uri: avatarUri } : selfAvatar} style={S.avatarPhoto} />
            ) : (
              <Feather name="user" size={16} color="#ffffff" />
            )}
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}