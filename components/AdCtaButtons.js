// components/AdCtaButtons.js
// Ad ke neeche ke orange action buttons (Fill Leads Form / Visit Website / Visit Shop /
// WhatsApp / Call Now). Side panel (RightUtilityPanel) jaisa hi look — ab feed ke
// beech wale (center) ads me bhi yahi dikhta hai.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl, buildWhatsappUrl, openPhoneCall, getAdPhone } from '../utils/adRedirect';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

export default function AdCtaButtons({ ad, onOpenLeadForm, style }) {
  if (!ad) return null;
  const isLead = ad.redirect === 'lead_form';
  const hasWa = Boolean(buildWhatsappUrl(ad));
  const isWa = ad.redirect === 'whatsapp' || (hasWa && !isLead && ad.redirect !== 'website' && ad.redirect !== 'shop');
  const isLink = ad.redirect === 'website' || ad.redirect === 'shop' || isWa;
  const phone = getAdPhone(ad);
  const canCall = Boolean(phone) && ad.allowCalls !== false;
  if (!isLead && !isLink && !canCall) return null;

  const onLinkPress = () => {
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
    openExternalUrl(ad.redirect === 'shop' ? ad.extraValues?.shop_url : ad.extraValues?.website_url);
  };

  const onCallPress = () => {
    openPhoneCall(ad);
  };

  return (
    <View style={[styles.row, style]}>
      {isLead ? (
        <TouchableOpacity style={[styles.btn, styles.orange]} activeOpacity={0.88} onPress={() => onOpenLeadForm?.(ad)}>
          <Ionicons name="document-text-outline" size={14} color="#fff" />
          <Text style={styles.btnText}>Fill Leads Form</Text>
        </TouchableOpacity>
      ) : null}
      {isLink ? (
        <TouchableOpacity style={[styles.btn, styles.orange]} activeOpacity={0.88} onPress={onLinkPress}>
          <Ionicons
            name={ad.redirect === 'shop' ? 'storefront-outline' : isWa ? 'logo-whatsapp' : 'globe-outline'}
            size={14}
            color="#fff"
          />
          <Text style={styles.btnText}>
            {ad.redirect === 'shop' ? 'Visit Shop' : isWa ? 'Message on WhatsApp' : 'Visit Website'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {canCall ? (
        <TouchableOpacity style={[styles.btn, styles.green]} activeOpacity={0.88} onPress={onCallPress}>
          <Ionicons name="call" size={14} color="#fff" />
          <Text style={styles.btnText}>Call Now</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 11,
  },
  orange: { backgroundColor: '#ea580c' },
  green: { backgroundColor: '#16a34a' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});