// components/AppFooter.js
import React from 'react';
import {
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

const SOCIAL_LINK_ITEMS = [
  { label: 'Facebook', icon: 'logo-facebook', url: 'https://www.facebook.com/', color: '#2563eb' },
  { label: 'YouTube', icon: 'logo-youtube', url: 'https://www.youtube.com/', color: '#ef4444' },
  { label: 'LinkedIn', icon: 'logo-linkedin', url: 'https://www.linkedin.com/', color: '#0284c7' },
  { label: 'Instagram', icon: 'logo-instagram', url: 'https://www.instagram.com/', color: '#e8732a' },
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
      try {
        await Linking.openURL(action.url);
      } catch {
        // no-op
      }
      return;
    }

    if (action.email) {
      try {
        await Linking.openURL(`mailto:${action.email}`);
      } catch {
        // no-op
      }
      return;
    }

    if (action.screen) {
      navigation?.navigate?.(action.screen, action.params);
    }
  };

  const stateItems = STATE_LINK_ITEMS.map((stateName) => ({
    label: stateName,
    action: {
      screen: 'Home',
      params: {
        initialView: 'feed',
        initialMenuKey: 'latest',
        initialStateName: stateName,
      },
    },
  }));

  const trendingItems = [
    { label: copy.common.latestNews, action: { screen: 'Home', params: { initialView: 'feed', initialMenuKey: 'latest' } } },
    { label: copy.common.newsByState, action: { screen: 'Home', params: { initialView: 'states', initialMenuKey: 'states' } } },
    { label: copy.common.politics, action: { screen: 'Home', params: { initialView: 'feed', initialMenuKey: 'politics' } } },
    { label: copy.common.elections, action: { screen: 'Home', params: { initialView: 'feed', initialMenuKey: 'elections' } } },
    { label: copy.common.viral, action: { screen: 'Home', params: { initialView: 'feed', initialMenuKey: 'viral' } } },
    { label: copy.common.latestPoliticalNews, action: { screen: 'Home', params: { initialView: 'feed', initialMenuKey: 'latest_political' } } },
  ];

  const quickLinks = [
    { label: copy.common.home, action: { screen: 'Home' } },
    { label: copy.common.feed, action: { screen: 'Feed' } },
    { label: copy.common.rti, action: { screen: 'WhatIsRTI' } },
    { label: copy.common.laws, action: { screen: 'ImportantLaws' } },
    { label: copy.common.aboutUs, action: { screen: 'About' } },
    { label: copy.common.contactUs, action: { screen: 'Contact' } },
  ];

  const aboutLinks = [
    { label: copy.common.aboutUs, action: { screen: 'About' } },
    { label: copy.common.contactUs, action: { screen: 'Contact' } },
    { label: copy.common.terms, action: { screen: 'InfoPage', params: { pageKey: 'terms' } } },
    { label: copy.common.privacy, action: { screen: 'InfoPage', params: { pageKey: 'privacy' } } },
    { label: copy.common.teamCareer, action: { screen: 'InfoPage', params: { pageKey: 'careers' } } },
    { label: copy.common.refund, action: { screen: 'InfoPage', params: { pageKey: 'refund' } } },
  ];

  return (
    <View style={styles.footerShell}>
      <View style={styles.footerInner}>
        <View style={styles.footerBrandRow}>
          <View style={styles.footerBrandBlock}>
            <Text style={styles.footerBrandTitle}>{copy.footer.brandTitle}</Text>
            <Text style={styles.footerBrandSubtitle}>{copy.footer.brandSubtitle}</Text>
          </View>

          <TouchableOpacity
            style={styles.footerBrandLink}
            onPress={() => handleOpenAction({ screen: 'About' })}
            activeOpacity={0.84}
          >
            <Text style={styles.footerBrandLinkText}>{copy.common.aboutUs}</Text>
            <Ionicons name="open-outline" size={15} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footerContactLink}
          onPress={() => handleOpenAction({ email: 'info@rtinews.in' })}
          activeOpacity={0.84}
        >
          <Text style={styles.footerContactText}>{copy.footer.contactLine}</Text>
        </TouchableOpacity>

        <View style={styles.footerDivider} />

        <FooterSection title={copy.common.trendingNews}>
          <FooterInlineLinks items={trendingItems} onPress={handleOpenAction} />
        </FooterSection>

        <FooterSection title={copy.common.stateCoverage}>
          <FooterInlineLinks items={stateItems} onPress={handleOpenAction} />
        </FooterSection>

        <FooterSection title={copy.common.quickLinks}>
          <FooterInlineLinks items={quickLinks} onPress={handleOpenAction} />
        </FooterSection>

        <FooterSection title={copy.common.aboutRtiNews}>
          <FooterInlineLinks items={aboutLinks} onPress={handleOpenAction} />
        </FooterSection>

        <View style={styles.footerBottomDivider} />

        <View style={styles.footerSocialWrap}>
          <Text style={styles.footerSocialTitle}>{copy.common.followOn}</Text>
          <View style={styles.footerSocialRow}>
            {SOCIAL_LINK_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.footerSocialButton}
                onPress={() => handleOpenAction({ url: item.url })}
                activeOpacity={0.84}
              >
                <Ionicons name={item.icon} size={28} color={item.color} />
              </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 22,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  footerBrandBlock: {
    flex: 1,
    minWidth: 240,
  },
  footerBrandTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerBrandSubtitle: {
    color: '#d7f2ef',
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    marginTop: 4,
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerBrandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerBrandLinkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerContactLink: {
    marginTop: 22,
    alignSelf: 'flex-start',
  },
  footerContactText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerDivider: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(186, 230, 253, 0.18)',
  },
  footerSection: {
    marginTop: 28,
  },
  footerSectionTitle: {
    color: '#ffe4e6',
    fontSize: 16,
    fontWeight: '600', // ✅ Weight 600
    marginBottom: 14,
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerInlineList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  footerInlineButton: {
    paddingRight: 18,
    marginRight: 4,
    borderRightWidth: 1,
    borderRightColor: 'rgba(186, 230, 253, 0.16)',
  },
  footerInlineButtonLast: {
    borderRightWidth: 0,
    paddingRight: 0,
    marginRight: 0,
  },
  footerInlineButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerBottomDivider: {
    marginTop: 26,
    borderTopWidth: 1,
    borderTopColor: 'rgba(186, 230, 253, 0.18)',
  },
  footerSocialWrap: {
    marginTop: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSocialTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: FONT_FAMILY, // ✅ Roboto font
  },
  footerSocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  footerSocialButton: {
    width: 42,
    height: 42,
    borderRadius: 6, // ✅ Border radius 6px
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});