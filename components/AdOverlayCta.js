// components/AdOverlayCta.js
// Ad ke media (image / video) ke UPAR neeche-right me dark pill button —
// bilkul feed ke "Message on Whatsapp" jaisa. Feed, in-feed ad aur side panel (Sponsored)
// teeno jagah yahi component use hota hai taaki sab ek jaisa dikhe.
// Parent View `position: 'relative'` hona chahiye (media ko wrap karne wala).
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl, buildWhatsappUrl, openPhoneCall, getAdPhone, openAdRedirect } from '../utils/adRedirect';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

const FONT = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold';

export default function AdOverlayCta({ ad, onOpenLeadForm, navigation, bottom = 12, right = 10 }) {
  if (!ad) return null;
  const isLead = ad.redirect === 'lead_form';
  const hasWa = Boolean(buildWhatsappUrl(ad));
  const isWa = ad.redirect === 'whatsapp' || (hasWa && !isLead && ad.redirect !== 'website' && ad.redirect !== 'shop');
  const directLink = String(ad.extraValues?.website_url || ad.extraValues?.shop_url || ad.url || ad.redirection_url || '').trim();
  const hasDirectWeb = Boolean(directLink && /^(https?:)/i.test(directLink));
  const isLink = ad.redirect === 'website' || ad.redirect === 'shop' || isWa || (!isLead && hasDirectWeb);
  const phone = getAdPhone(ad);
  const canCall = Boolean(phone) && ad.allowCalls !== false;
  const isProfile = !isLead && !isLink && !canCall;

  const stop = (e) => { try { e?.stopPropagation?.(); } catch (_) { /* ignore */ } };

  const onLinkPress = (e) => {
    stop(e);
    if (isWa) {
      const waUrl = buildWhatsappUrl(ad);
      if (waUrl) {
        try {
          const adId = ad.originalAdId || ad.id;
          if (adId) {
            AuthAPI.createEcomEnquiry({
              ecom_id: adId,
              type: 'ads',
              message: 'Contacted via WhatsApp',
            }).catch(() => {});
          }
        } catch {}
        openExternalUrl(waUrl);
      } else {
        Alert.alert('WhatsApp', 'This advertiser has not added a WhatsApp number yet.');
      }
      return;
    }
    const targetUrl = ad.redirect === 'shop'
      ? (ad.extraValues?.shop_url || directLink)
      : (ad.extraValues?.website_url || directLink);
    if (targetUrl) {
      openExternalUrl(targetUrl);
    } else {
      openAdRedirect(ad, navigation, { onOpenLeadForm });
    }
  };

  const onCallPress = (e) => {
    stop(e);
    openPhoneCall(ad);
  };

  const onProfilePress = (e) => {
    stop(e);
    openAdRedirect(ad, navigation, { onOpenLeadForm });
  };

  const linkIcon = ad.redirect === 'shop' ? 'storefront-outline' : isWa ? 'logo-whatsapp' : 'globe-outline';
  const linkLabel = ad.redirect === 'shop' ? 'Visit Shop' : isWa ? 'Message on WhatsApp' : 'Visit Website';

  const items = [];
  if (isLead) items.push({ key: 'lead', icon: 'document-text-outline', label: 'Fill Lead Form', onPress: (e) => { stop(e); onOpenLeadForm?.(ad); } });
  if (isLink) items.push({ key: 'link', icon: linkIcon, label: linkLabel, onPress: onLinkPress });
  if (canCall) items.push({ key: 'call', icon: 'call-outline', label: 'Call Now', onPress: onCallPress });
  if (isProfile) items.push({ key: 'profile', icon: 'person-circle-outline', label: 'View Profile', onPress: onProfilePress });

  return (
    <View pointerEvents="box-none" style={[styles.strip, { bottom, right }]}>
      {items.map((it, i) => {
        const isItemWa = it.key === 'link' && isWa;
        const isItemCall = it.key === 'call';
        return (
          <TouchableOpacity
            key={it.key}
            style={[
              styles.half,
              isItemWa && styles.halfWa,
              isItemCall && styles.halfCall,
            ]}
            activeOpacity={0.85}
            onPress={it.onPress}
          >
            <Ionicons name={it.icon} size={16} color="#ffffff" />
            <Text style={styles.text} numberOfLines={1}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
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
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    maxWidth: '96%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  half: {
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  halfWa: {
    backgroundColor: '#166534',
    borderColor: '#22c55e',
  },
  halfCall: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  halfBordered: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  text: { color: '#ffffff', fontSize: 12, fontWeight: '700', fontFamily: FONT },
});