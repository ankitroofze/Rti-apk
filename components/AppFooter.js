// components/AppFooter.js
import React from 'react';
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteCopy } from '../constants/siteCopy';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';

// Font Family
const FONT_FAMILY = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto';

const STATE_LINK_ITEMS = [
  'Bihar',
  'Chhattisgarh',
  'Madhya Pradesh',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Goa',
  'Kerala',
  'Odisha',
  'Andaman And Nicobar Islands',
  'Gujarat',
  'Uttar Pradesh',
  'Meghalaya',
  'Rajasthan',
  'Uttarakhand',
  'Manipur',
  'Andhra Pradesh',
  'Punjab',
  'Tamil Nadu',
  'Assam',
  'Jammu And Kashmir',
  'Telangana',
  'Tripura',
  'Chandigarh',
  'Nagaland',
  'West Bengal',
  'Haryana',
  'Himachal Pradesh',
];

import { SOCIAL_LINKS } from '../constants/socialLinks';

const SOCIAL_LINK_ITEMS = [
  { label: 'Facebook', icon: 'logo-facebook', url: SOCIAL_LINKS.facebook },
  { label: 'X', icon: 'logo-twitter', url: SOCIAL_LINKS.twitter },
  { label: 'YouTube', icon: 'logo-youtube', url: SOCIAL_LINKS.youtube },
  { label: 'Instagram', icon: 'logo-instagram', url: SOCIAL_LINKS.instagram },
  { label: 'Telegram', icon: 'paper-plane-outline', url: 'https://telegram.org/' },
];

function FooterSection({ title, children }) {
  return (
    <View style={styles.footerSection}>
      <Text style={styles.footerSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FooterInlineLinks({ items, onPress }) {
  return (
    <View style={styles.footerInlineList}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={`${item.label}-${index}`}
          style={[
            styles.footerInlineButton,
            index === items.length - 1 && styles.footerInlineButtonLast,
          ]}
          onPress={() => onPress(item.action)}
          activeOpacity={0.82}
        >
          <Text style={styles.footerInlineButtonText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AppFooter({ navigation }) {
  const { width } = useWindowDimensions();
  const responsiveWidth = getResponsiveWindowWidth(width);
  const { language } = useLanguage();
  if (Platform.OS !== 'web' || isMobileWebDevice() || responsiveWidth < 768) return null;

  const copy = getSiteCopy(language);

  const handleOpenAction = async (action) => {
    if (!action) return;
    if (action.url) {
      try { await Linking.openURL(action.url); } catch {}
      return;
    }
    if (action.email) {
      try { await Linking.openURL(`mailto:${action.email}`); } catch {}
      return;
    }
    if (action.screen) {
      navigation?.navigate?.(action.screen, action.params);
    }
  };

  const quickLinks = [
    { label: copy.common.home, action: { screen: 'Home' } },
    { label: copy.common.feed, action: { screen: 'Feed' } },
    { label: 'Create', action: { screen: 'QuickMenu' } },
    { label: 'Advertise', action: { screen: 'Advertise' } },
  ];

  const moreLinks = [
    { label: 'Profile', action: { screen: 'Profile' } },
    { label: 'Newspaper', action: { screen: 'Newspaper' } },
    { label: copy.common.aboutUs, action: { screen: 'About' } },
    { label: copy.common.privacy, action: { screen: 'InfoPage', params: { pageKey: 'privacy' } } },
  ];

  const bottomLinks = [
    { label: copy.common.aboutUs, action: { screen: 'About' } },
    { label: copy.common.terms, action: { screen: 'InfoPage', params: { pageKey: 'terms' } } },
    { label: copy.common.privacy, action: { screen: 'InfoPage', params: { pageKey: 'privacy' } } },
    { label: copy.common.contactUs, action: { screen: 'Contact' } },
  ];

  return (
    <View style={styles.footerShell}>
      <View style={styles.footerInner}>
        <View style={styles.footerTopRow}>
          <View style={styles.footerBrandCol}>
            <View style={styles.footerBrandHeaderRow}>
              <Image
                source={require('../assets/images/certificate_logo.jpg')}
                style={styles.footerLogo}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.footerBrandTitle}>{copy.footer.brandTitle}</Text>
                <Text style={styles.footerBrandSubtitle}>{copy.footer.brandSubtitle}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.footerContactLink}
              onPress={() => handleOpenAction({ email: 'info@rtinews.in' })}
              activeOpacity={0.84}
            >
              <Ionicons name="mail-outline" size={16} color="#ffffff" />
              <Text style={styles.footerContactText}>{copy.footer.contactLine}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinksCol}>
            <Text style={styles.footerSectionTitle}>{copy.common.quickLinks}</Text>
            {quickLinks.map((item) => (
              <TouchableOpacity key={item.label} style={styles.footerLinkRow} onPress={() => handleOpenAction(item.action)} activeOpacity={0.82}>
                <Text style={styles.footerLinkText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerLinksCol}>
            <Text style={styles.footerSectionTitle}>More</Text>
            {moreLinks.map((item) => (
              <TouchableOpacity key={item.label} style={styles.footerLinkRow} onPress={() => handleOpenAction(item.action)} activeOpacity={0.82}>
                <Text style={styles.footerLinkText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerAboutCol}>
            <Text style={styles.footerSectionTitle}>{copy.common.aboutUs}</Text>
            <Text style={styles.footerAboutText}>
              RTI News Network is a platform dedicated to transparent governance, citizen rights and authentic news from across India.
            </Text>
            <View style={styles.footerSocialRow}>
              {SOCIAL_LINK_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.footerSocialButton}
                  onPress={() => handleOpenAction({ url: item.url })}
                  activeOpacity={0.84}
                >
                  <Ionicons name={item.icon} size={18} color="#ffffff" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footerBottomDivider} />

        <View style={styles.footerBottomRow}>
          <Text style={styles.footerCopyrightText}>
            © {new Date().getFullYear()} {copy.footer.brandTitle}. All rights reserved.
          </Text>
          <View style={styles.footerBottomLinksRow}>
            {bottomLinks.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity onPress={() => handleOpenAction(item.action)} activeOpacity={0.82}>
                  <Text style={styles.footerBottomLinkText}>{item.label}</Text>
                </TouchableOpacity>
                {index < bottomLinks.length - 1 ? <Text style={styles.footerBottomLinkSep}>|</Text> : null}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerShell: {
    backgroundColor: '#073b44',
    marginTop: 28,
  },
  footerInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 32 : 18,
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
  },
  footerBrandCol: { flex: 1.4, minWidth: 240 },
  footerBrandHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerLogo: { width: 44, height: 44, borderRadius: 22 },
  footerBrandTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', fontFamily: FONT_FAMILY },
  footerBrandSubtitle: { color: '#d7f2ef', fontSize: 12, fontWeight: '600', marginTop: 2, fontFamily: FONT_FAMILY },
  footerContactLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  footerContactText: { color: '#ffffff', fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY },
  footerLinksCol: { minWidth: 140 },
  footerSectionTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 12, fontFamily: FONT_FAMILY },
  footerLinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, gap: 6 },
  footerLinkText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY },
  footerAboutCol: { flex: 1.4, minWidth: 240 },
  footerAboutText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20, fontFamily: FONT_FAMILY },
  footerSocialRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  footerSocialButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  footerBottomDivider: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(186, 230, 253, 0.18)',
  },
  footerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 16,
  },
  footerCopyrightText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: FONT_FAMILY },
  footerBottomLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  footerBottomLinkText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', fontFamily: FONT_FAMILY },
  footerBottomLinkSep: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
});