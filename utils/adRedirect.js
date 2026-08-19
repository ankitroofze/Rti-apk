import { Alert, Linking, Platform } from 'react-native';

const ensureExternalUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(raw)) return raw;
  return `https://${raw}`;
};

const getPhoneDigits = (value = '') => String(value || '').replace(/\D+/g, '');

export function getAdRedirectMeta(ad = {}) {
  const redirect = String(ad.redirect || '').trim();
  const extraValues = ad.extraValues || {};

  if (redirect === 'website') {
    return {
      type: redirect,
      label: 'Visit Website',
      icon: 'globe-outline',
      url: ensureExternalUrl(extraValues.website_url),
    };
  }

  if (redirect === 'shop') {
    return {
      type: redirect,
      label: 'Visit Shop',
      icon: 'storefront-outline',
      url: ensureExternalUrl(extraValues.shop_url),
    };
  }

  if (redirect === 'whatsapp') {
    const phone = getPhoneDigits(extraValues.whatsapp_number || ad.owner_mobile || ad.mobile || ad.phone);
    return {
      type: redirect,
      label: 'WhatsApp',
      icon: 'logo-whatsapp',
      url: phone ? `https://wa.me/${phone}` : '',
    };
  }

  if (redirect === 'lead_form') {
    return {
      type: redirect,
      label: 'Send Enquiry',
      icon: 'document-text-outline',
      url: '',
    };
  }

  return {
    type: 'profile',
    label: 'View Profile',
    icon: 'person-circle-outline',
    url: '',
  };
}

export function getAdCallUrl(ad = {}) {
  const extraValues = ad.extraValues || {};
  const phone = getPhoneDigits(
    extraValues.whatsapp_number ||
    ad.owner_mobile ||
    ad.mobile ||
    ad.phone ||
    ad.contact_number
  );
  return phone ? `tel:${phone}` : '';
}

export async function openExternalUrl(url) {
  const target = ensureExternalUrl(url);
  if (!target) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(target, '_blank', 'noopener,noreferrer');
    return true;
  }

  const canOpen = await Linking.canOpenURL(target);
  if (!canOpen) return false;
  await Linking.openURL(target);
  return true;
}

export async function openAdRedirect(ad = {}, navigation, options = {}) {
  const meta = getAdRedirectMeta(ad);

  if (meta.type === 'profile') {
    if (typeof options.onProfilePress === 'function') {
      options.onProfilePress(ad);
      return true;
    }
    const email = String(ad.owner_email || ad.createdBy || ad.created_by || '').trim().toLowerCase();
    if (navigation?.navigate && email) {
      navigation.navigate('UserProfile', {
        email,
        author: {
          name: ad.owner_name || ad.user || 'Advertiser',
          author_profile_image: ad.owner_profile_image || ad.avatar || '',
          author_role_label: ad.owner_role_label || ad.role || 'Sponsored',
          author_has_blue_tick: Boolean(ad.owner_has_blue_tick || ad.verified),
          has_blue_tick: Boolean(ad.owner_has_blue_tick || ad.verified),
          createdBy: email,
        },
      });
      return true;
    }
  }

  if (meta.type === 'lead_form') {
    if (navigation?.navigate) {
      navigation.navigate('Contact', {
        source: 'ad',
        adId: ad.originalAdId || ad.id,
        adTitle: ad.title || ad.headline || '',
        ownerEmail: ad.owner_email || ad.createdBy || ad.created_by || '',
      });
      return true;
    }
  }

  if (meta.url) {
    const opened = await openExternalUrl(meta.url);
    if (opened) return true;
  }

  const message = options.fallbackMessage || 'This ad does not have a valid redirect yet.';
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  } else {
    Alert.alert('Ad Link', message);
  }
  return false;
}
