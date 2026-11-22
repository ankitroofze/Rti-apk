import { Alert, Linking, Platform } from 'react-native';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

const ensureExternalUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(raw)) return raw;
  return `https://${raw}`;
};

const getPhoneDigits = (value = '') => String(value || '').replace(/\D+/g, '');

// Extract best available contact phone from ad in any format
export function getAdPhone(ad = {}) {
  if (!ad) return '';
  const extra = ad.extraValues || {};
  const adOwnerObj = ad.owner || ad.user || ad.advertiser || ad.author || {};
  const candidates = [
    extra.whatsapp_number,
    extra.contact_number,
    ad.whatsapp_number,
    ad.whatsapp,
    ad.owner_mobile,
    ad.contact_number,
    ad.mobile,
    ad.phone,
    ad.contact,
    ad.conatct,
    adOwnerObj.mobile,
    adOwnerObj.phone,
    adOwnerObj.contact_number,
    adOwnerObj.contact,
    ad.url,
    ad.redirection_url,
  ];

  for (const cand of candidates) {
    const raw = String(cand || '').trim();
    if (!raw || /^rti-news:/i.test(raw)) continue;
    let digits = '';
    if (/^(https?:|whatsapp:)/i.test(raw)) {
      const m = raw.match(/wa\.me\/\+?(\d+)/i) || raw.match(/[?&]phone=\+?(\d+)/i) || raw.match(/send\/\+?(\d+)/i);
      digits = m ? m[1] : '';
    } else {
      digits = getPhoneDigits(raw);
    }
    digits = digits.replace(/^0+/, '');
    if (digits.length === 14 && digits.startsWith('9191')) digits = digits.slice(2);
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length === 10) return digits;
    if (digits.length > 10) return digits;
  }
  return '';
}

export function getAdRedirectMeta(ad = {}) {
  const redirect = String(ad.redirect || ad.redirection || '').trim().toLowerCase();
  const extraValues = ad.extraValues || {};

  if (redirect === 'website' || redirect === '2') {
    return {
      type: 'website',
      label: 'Visit Website',
      icon: 'globe-outline',
      url: ensureExternalUrl(extraValues.website_url || ad.url || ad.redirection_url),
    };
  }

  if (redirect === 'shop' || redirect === '3') {
    return {
      type: 'shop',
      label: 'Visit Shop',
      icon: 'storefront-outline',
      url: ensureExternalUrl(extraValues.shop_url || ad.url || ad.redirection_url),
    };
  }

  if (redirect === 'whatsapp' || redirect === '5') {
    return {
      type: 'whatsapp',
      label: 'Message on WhatsApp',
      icon: 'logo-whatsapp',
      url: buildWhatsappUrl(ad),
    };
  }

  if (redirect === 'lead_form' || redirect === '4' || redirect === 'lead') {
    return {
      type: 'lead_form',
      label: 'Fill Lead Form',
      icon: 'document-text-outline',
      url: '',
    };
  }

  if (redirect === 'call' || redirect === 'contact') {
    return {
      type: 'call',
      label: 'Call Now',
      icon: 'call-outline',
      url: getAdCallUrl(ad),
    };
  }

  const redirUrl = String(ad.redirection_url || ad.url || '');
  if (redirUrl.includes('wa.me') || redirUrl.includes('whatsapp.com')) {
    return {
      type: 'whatsapp',
      label: 'Message on WhatsApp',
      icon: 'logo-whatsapp',
      url: buildWhatsappUrl(ad),
    };
  }

  return {
    type: 'profile',
    label: 'View Profile',
    icon: 'person-circle-outline',
    url: '',
  };
}

// WhatsApp number -> wa.me link with pre-filled greeting text
export function buildWhatsappUrl(ad = {}) {
  const digits = getAdPhone(ad);
  if (!digits || digits.length < 10) return '';
  const fullPhone = digits.length === 10 ? `91${digits}` : digits;
  const adTitle = String(ad.title || ad.headline || '').trim();
  const text = adTitle
    ? `Hi, I saw your advertisement "${adTitle}" on RTI News.`
    : 'Hi, I saw your advertisement on RTI News.';
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
}

export function getAdCallUrl(ad = {}) {
  const phone = getAdPhone(ad);
  if (!phone) return '';
  const clean = phone.length === 10 ? `+91${phone}` : `+${phone}`;
  return `tel:${clean}`;
}

export function openPhoneCall(phoneOrAd) {
  let digits = '';
  if (typeof phoneOrAd === 'object' && phoneOrAd !== null) {
    digits = getAdPhone(phoneOrAd);
  } else {
    digits = getPhoneDigits(phoneOrAd);
  }
  digits = digits.replace(/^0+/, '');
  if (digits.length === 14 && digits.startsWith('9191')) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);

  if (!digits || digits.length < 10) {
    Alert.alert('Contact', 'Phone number is not available for this advertiser.');
    return false;
  }

  const cleanPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  const telUrl = `tel:${cleanPhone}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.location.href = telUrl;
      return true;
    } catch {
      try {
        window.open(telUrl);
        return true;
      } catch {}
    }
  }

  Linking.openURL(telUrl).catch((err) => {
    console.warn('[openPhoneCall] Linking.openURL failed:', err);
    Alert.alert('Call', `Unable to make a call to ${cleanPhone}.`);
  });
  return true;
}

export async function openExternalUrl(url) {
  const target = ensureExternalUrl(url);
  if (!target) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const a = window.document.createElement('a');
      a.href = target;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      return true;
    } catch {
      try {
        const opened = window.open(target, '_blank', 'noopener,noreferrer');
        return Boolean(opened);
      } catch (err) {
        console.warn('[openExternalUrl] Web open failed:', err);
        return false;
      }
    }
  }

  try {
    await Linking.openURL(target);
    return true;
  } catch (err) {
    console.warn('[openExternalUrl] direct Linking.openURL failed, trying canOpenURL:', err);
    try {
      const canOpen = await Linking.canOpenURL(target);
      if (canOpen) {
        await Linking.openURL(target);
        return true;
      }
    } catch {}
    return false;
  }
}

export async function openAdRedirect(ad = {}, navigation, options = {}) {
  const meta = getAdRedirectMeta(ad);

  if (meta.type === 'profile') {
    if (typeof options.onProfilePress === 'function') {
      options.onProfilePress(ad);
      return true;
    }
    const cleanId = (s) => (s == null || s === '' || String(s) === 'null' || String(s) === 'undefined') ? null : String(s);
    const email = String(ad.owner_email || ad.createdBy || ad.created_by || '').trim().toLowerCase();
    const userId = cleanId(ad.user_id ?? ad.owner_id ?? ad.userId);
    const authorName = ad.owner_name || ad.user || ad.author_name || 'Advertiser';
    const authorImg = ad.owner_profile_image || ad.avatar || ad.profile_image || '';
    if (navigation?.navigate && (email || userId)) {
      navigation.navigate('UserPublicProfile', {
        email: email || undefined,
        userId: userId || undefined,
        author: {
          id: userId || undefined,
          name: authorName,
          author_name: authorName,
          author_profile_image: authorImg,
          profile_image: authorImg,
          author_role_label: ad.owner_role_label || ad.role || 'Sponsored',
          role: ad.owner_role_label || ad.role || 'Sponsored',
          author_has_blue_tick: Boolean(ad.owner_has_blue_tick || ad.verified),
          has_blue_tick: Boolean(ad.owner_has_blue_tick || ad.verified),
          createdBy: email,
          email,
        },
      });
      return true;
    }
  }

  if (meta.type === 'whatsapp') {
    const waUrl = buildWhatsappUrl(ad);
    try {
      const adId = ad.originalAdId || ad.id;
      if (adId) {
        AuthAPI.createEcomEnquiry({
          ecom_id: adId,
          type: 'ads',
          message: 'Contacted via WhatsApp',
        }).catch(() => {});
      }
    } catch { /* best-effort */ }

    if (waUrl) {
      const opened = await openExternalUrl(waUrl);
      if (opened) return true;
    } else {
      Alert.alert('WhatsApp', 'This advertiser has not added a WhatsApp number yet.');
      return false;
    }
  }

  if (meta.type === 'call' || meta.type === 'contact') {
    return openPhoneCall(ad);
  }

  if (meta.type === 'lead_form') {
    if (typeof options.onOpenLeadForm === 'function') {
      options.onOpenLeadForm(ad);
      return true;
    }
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

  // Fallback 1: Direct link in ad.url or redirection_url
  const directUrl = String(ad.url || ad.redirection_url || '').trim();
  if (directUrl && /^(https?:|wa\.me)/i.test(directUrl)) {
    const opened = await openExternalUrl(directUrl);
    if (opened) return true;
  }

  // Fallback 2: Call if phone number exists
  const phone = getAdPhone(ad);
  if (phone) {
    return openPhoneCall(ad);
  }

  // Fallback 3: UserPublicProfile if email or id exists
  const fallbackEmail = String(ad.owner_email || ad.createdBy || ad.created_by || '').trim().toLowerCase();
  const fallbackUserId = ad.user_id || ad.owner_id || ad.userId || null;
  if (navigation?.navigate && (fallbackEmail || fallbackUserId)) {
    navigation.navigate('UserPublicProfile', {
      email: fallbackEmail || undefined,
      userId: fallbackUserId || undefined,
      author: {
        id: fallbackUserId,
        name: ad.owner_name || ad.user || 'Advertiser',
        author_name: ad.owner_name || ad.user || 'Advertiser',
        author_profile_image: ad.owner_profile_image || ad.avatar || '',
        profile_image: ad.owner_profile_image || ad.avatar || '',
        createdBy: fallbackEmail,
        email: fallbackEmail,
      },
    });
    return true;
  }

  const message = options.fallbackMessage || 'This ad does not have a valid redirect yet.';
  Alert.alert('Ad Link', message);
  return false;
}