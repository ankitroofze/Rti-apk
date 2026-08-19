import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import WebLayout from '../components/WebLayout';

const IS_WEB = Platform.OS === 'web';

const INFO_PAGE_CONTENT = {
  terms: {
    title: 'Terms and Conditions',
    subtitle: 'These terms explain how readers can use the RTI News platform and related public-interest services.',
    sections: [
      {
        title: 'Use of the Platform',
        body: 'RTI News is intended for lawful reading, sharing, and citizen-awareness use. Users must not misuse the platform for harassment, misinformation, or any activity that violates applicable law.',
      },
      {
        title: 'Content and Accuracy',
        body: 'We aim to publish verified and responsible reporting. News, explainers, and public-interest resources are informational in nature and should not be treated as personal legal advice.',
      },
      {
        title: 'Accounts and Access',
        body: 'If you create an account, you are responsible for maintaining accurate details and safeguarding your login credentials. We may suspend misuse, impersonation, or abusive activity.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'This page outlines the basic information we may collect and how it supports reader experience and platform security.',
    sections: [
      {
        title: 'Information We Collect',
        body: 'We may collect account details, device information, usage signals, and information voluntarily submitted through forms or news interactions.',
      },
      {
        title: 'How We Use Information',
        body: 'Collected information may be used to personalize the feed, improve stability, manage support requests, and maintain platform safety.',
      },
      {
        title: 'Data Sharing and Contact',
        body: 'We do not intend to sell reader data. Limited sharing may occur with service providers when needed to operate the app. For privacy questions, contact our editorial support team.',
      },
    ],
  },
  careers: {
    title: 'Team and Career',
    subtitle: 'RTI News works with reporters, editors, researchers, and civic contributors who care about transparent public-interest journalism.',
    sections: [
      {
        title: 'Who We Look For',
        body: 'We value strong reporting ethics, clear writing, local-ground understanding, and a serious commitment to accuracy and public accountability.',
      },
      {
        title: 'Ways to Contribute',
        body: 'Openings may include bureau reporting, editorial support, civic research, digital production, and field-based public records storytelling.',
      },
      {
        title: 'How to Reach Us',
        body: 'If you would like to work with RTI News, prepare your profile, sample work, and reporting interests, then contact us through the official communication channels listed in the footer.',
      },
    ],
  },
  refund: {
    title: 'Refund and Cancellation Policy',
    subtitle: 'This page explains the general cancellation and refund expectations for paid plans or editorial service access, where applicable.',
    sections: [
      {
        title: 'Cancellation',
        body: 'Users may request cancellation of eligible paid services according to the terms shared at the time of purchase or onboarding.',
      },
      {
        title: 'Refund Eligibility',
        body: 'Refund decisions may depend on the nature of the plan, delivery status, and whether access or service benefits have already been used.',
      },
      {
        title: 'Support Requests',
        body: 'For subscription or payment concerns, contact the RTI News support desk with your registered details and transaction reference so the request can be reviewed promptly.',
      },
    ],
  },
};

export default function InfoPageScreen({ route, navigation }) {
  const pageKey = String(route?.params?.pageKey || 'terms').trim().toLowerCase();
  const pageContent = useMemo(
    () => INFO_PAGE_CONTENT[pageKey] || INFO_PAGE_CONTENT.terms,
    [pageKey]
  );

  const page = (
    <View style={styles.screenShell}>
      {IS_WEB ? <AppNavbar navigation={navigation} activeScreen={null} /> : null}

      <ScrollView
        style={styles.pageScrollView}
        contentContainerStyle={[
          styles.pageScrollContent,
          !IS_WEB && styles.pageScrollContentWithMobileNav,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageBodyShell}>
          <View style={styles.pageBodyInner}>
            <View style={styles.utilityRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation?.goBack?.()}
                activeOpacity={0.84}
              >
                <Ionicons name="arrow-back-outline" size={18} color="#0f172a" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => navigation?.navigate?.('Contact')}
                activeOpacity={0.84}
              >
                <Ionicons name="call-outline" size={16} color="#f97316" />
                <Text style={styles.contactButtonText}>Contact Us</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.contentEyebrow}>Footer Information</Text>
              <Text style={styles.contentTitle}>{pageContent.title}</Text>
              <Text style={styles.contentSubtitle}>{pageContent.subtitle}</Text>

              <View style={styles.sectionStack}>
                {pageContent.sections.map((section) => (
                  <View key={section.title} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionBody}>{section.body}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <AppFooter navigation={navigation} />
        </View>
      </ScrollView>

      {!IS_WEB ? <AppNavbar navigation={navigation} activeScreen={null} /> : null}
    </View>
  );

  return IS_WEB ? <WebLayout>{page}</WebLayout> : page;
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
    backgroundColor: '#edf1f4',
  },
  pageScrollView: {
    flex: 1,
  },
  pageScrollContent: {
    paddingBottom: 24,
  },
  pageScrollContentWithMobileNav: {
    paddingBottom: 110,
  },
  pageBodyShell: {
    marginTop: -1,
    backgroundColor: '#edf1f4',
  },
  pageBodyInner: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ee',
  },
  backButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  contactButtonText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '800',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 28,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 18px 34px rgba(15, 23, 42, 0.08)' },
      default: {
        elevation: 4,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
    }),
  },
  contentEyebrow: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  contentTitle: {
    color: '#0f172a',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 10,
    fontFamily: Platform.select({
      web: 'Georgia, "Times New Roman", serif',
      ios: 'Georgia',
      android: 'serif',
      default: undefined,
    }),
  },
  contentSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 760,
  },
  sectionStack: {
    marginTop: 24,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 18,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
  },
  sectionBody: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 8,
  },
});
