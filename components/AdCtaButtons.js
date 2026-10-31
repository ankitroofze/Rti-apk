// components/AdCtaButtons.js
// Ad ke neeche ke orange action buttons (Fill Leads Form / Visit Website / Visit Shop /
// WhatsApp / Call Now). Side panel (RightUtilityPanel) jaisa hi look — ab feed ke
// beech wale (center) ads me bhi yahi dikhta hai.
import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl } from '../utils/adRedirect';

export default function AdCtaButtons({ ad, onOpenLeadForm, style }) {
  if (!ad) return null;
  const isLead = ad.redirect === 'lead_form';
  const isLink = ad.redirect === 'website' || ad.redirect === 'shop' || ad.redirect === 'whatsapp';
  const canCall = Boolean(ad.owner_mobile) && ad.allowCalls !== false;
  if (!isLead && !isLink && !canCall) return null;

  const onLinkPress = () => {
    if (ad.redirect === 'whatsapp') {
      const phone = String(ad.extraValues?.whatsapp_number || ad.owner_mobile || '').replace(/\D/g, '');
      if (phone) openExternalUrl(`https://wa.me/91${phone}`);
      return;
    }
    openExternalUrl(ad.redirect === 'shop' ? ad.extraValues?.shop_url : ad.extraValues?.website_url);
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
            name={ad.redirect === 'shop' ? 'storefront-outline' : ad.redirect === 'whatsapp' ? 'logo-whatsapp' : 'globe-outline'}
            size={14}
            color="#fff"
          />
          <Text style={styles.btnText}>
            {ad.redirect === 'shop' ? 'Visit Shop' : ad.redirect === 'whatsapp' ? 'Message on Whatsapp' : 'Visit Website'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {canCall ? (
        <TouchableOpacity style={[styles.btn, styles.green]} activeOpacity={0.88} onPress={() => Linking.openURL(`tel:${ad.owner_mobile}`)}>
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
    borderRadius: 2,
    paddingVertical: 10,
  },
  orange: { backgroundColor: '#ea580c' },
  green: { backgroundColor: '#16a34a' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});