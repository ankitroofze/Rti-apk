// components/AdOverlayCta.js
// Ad ke media (image / video) ke UPAR neeche-right me dark pill button —
// bilkul feed ke "Message on Whatsapp" jaisa. Feed, in-feed ad aur side panel (Sponsored)
// teeno jagah yahi component use hota hai taaki sab ek jaisa dikhe.
// Parent View `position: 'relative'` hona chahiye (media ko wrap karne wala).
import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl, buildWhatsappUrl } from '../utils/adRedirect';

const FONT = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold';

export default function AdOverlayCta({ ad, onOpenLeadForm, bottom = 12, right = 10 }) {
  if (!ad) return null;
  const isLead = ad.redirect === 'lead_form';
  const isLink = ad.redirect === 'website' || ad.redirect === 'shop' || ad.redirect === 'whatsapp';
  const canCall = Boolean(ad.owner_mobile) && ad.allowCalls !== false;
  if (!isLead && !isLink && !canCall) return null;

  const stop = (e) => { try { e?.stopPropagation?.(); } catch (_) { /* ignore */ } };

  const onLinkPress = (e) => {
    stop(e);
    if (ad.redirect === 'whatsapp') {
      const waUrl = buildWhatsappUrl(ad);
      if (waUrl) {
        openExternalUrl(waUrl);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('This advertiser has not added a WhatsApp number yet.');
      } else {
        Alert.alert('WhatsApp', 'This advertiser has not added a WhatsApp number yet.');
      }
      return;
    }
    openExternalUrl(ad.redirect === 'shop' ? ad.extraValues?.shop_url : ad.extraValues?.website_url);
  };

  const linkIcon = ad.redirect === 'shop' ? 'storefront-outline' : ad.redirect === 'whatsapp' ? 'logo-whatsapp' : 'globe-outline';
  const linkLabel = ad.redirect === 'shop' ? 'Visit Shop' : ad.redirect === 'whatsapp' ? 'Message on Whatsapp' : 'Visit Website';

  const items = [];
  if (isLead) items.push({ key: 'lead', icon: 'document-text-outline', label: 'Fill Lead Form', onPress: (e) => { stop(e); onOpenLeadForm?.(ad); } });
  if (isLink) items.push({ key: 'link', icon: linkIcon, label: linkLabel, onPress: onLinkPress });
  if (canCall) items.push({ key: 'call', icon: 'call-outline', label: 'Call Now', onPress: (e) => { stop(e); Linking.openURL(`tel:${ad.owner_mobile}`); } });

  return (
    <View pointerEvents="box-none" style={[styles.strip, { bottom, right }]}>
      {items.map((it, i) => (
        <TouchableOpacity
          key={it.key}
          style={[styles.half, i < items.length - 1 && styles.halfBordered]}
          activeOpacity={0.85}
          onPress={it.onPress}
        >
          <Ionicons name={it.icon} size={16} color="#ffffff" />
          <Text style={styles.text} numberOfLines={1}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    zIndex: 30,
    elevation: 30,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    padding: 8,
    maxWidth: '94%',
  },
  half: {
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  halfBordered: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  text: { color: '#ffffff', fontSize: 11, fontWeight: '600', fontFamily: FONT },
});