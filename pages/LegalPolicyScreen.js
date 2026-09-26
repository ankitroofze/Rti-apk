import React from 'react';
import { ImageBackground, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModuleWebHeader from '../components/Modulewebheader';
import { useFonts, Roboto_400Regular, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';

const contact = 'support@rtivoice.com';
const website = 'https://www.rtivoice.com';

const FONT = {
  regular: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  bold:    Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  black:   Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_900Black',
};

const documents = {
  PrivacyPolicy: {
    title: 'Privacy Policy', icon: 'shield-checkmark-outline',
    intro: 'Effective Date: 06 August 2026',
    sections: [
      ['1. Introduction', 'Welcome to RTI Voice. RTI Voice is a digital platform that combines social networking, news sharing, RTI awareness, community engagement, live streaming, subscriptions, referrals, and public information services. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, mobile applications, and related services. By using RTI Voice, you agree to this Privacy Policy.'],
      ['2. Information We Collect', 'We may collect your full name, mobile number, email address, profile photo, username, device and IP information, app usage information, and login information. Users may also upload images, videos, voice recordings, PDF documents, text posts, comments, and live streams.'],
      ['3. How We Use Your Information', 'We use information to manage accounts; display profiles and content; provide feeds, community features, notifications, subscriptions and referrals; improve the platform; prevent fraud, spam and abuse; and comply with legal requirements.'],
      ['4. User Content', 'Users are responsible for uploaded images, videos, PDFs, voice recordings, live streams, news articles and comments. RTI Voice may remove content that violates laws or Platform policies.'],
      ['5. Referral & QR Identity', 'Each registered user may receive a unique referral link and QR code for profile identification and referral tracking. This information is used only to operate related Platform services.'],
      ['6. Subscription & Premium Services', 'Premium users may receive higher upload limits, live streaming access, a premium badge, and additional features. Payment information is processed securely through authorized payment partners; RTI Voice does not store complete card or UPI credentials.'],
      ['7. Live Streaming', 'Approved users may broadcast live. Streams may be reviewed, restricted, or removed when they violate Platform rules, community guidelines, or applicable laws.'],
      ['8. Data Storage & Security', 'We use reasonable safeguards such as secure servers, encryption where appropriate, authentication controls, and access restrictions. No internet transmission or electronic storage method is completely secure.'],
      ['9. Third-Party Services', 'RTI Voice may integrate with YouTube, WhatsApp, Facebook, Instagram, X (Twitter), Razorpay, and other payment gateways. Their own privacy policies apply.'],
      ['10. Sharing of Information', 'We do not sell personal information. It may be shared with trusted service providers, to process payments, meet legal obligations, protect users and Platform security, or where required by law.'],
      ['11. Cookies & Analytics', 'Our website may use cookies and analytics tools to improve performance, understand usage, and enhance user experience.'],
      ['12. User Rights', 'You may have rights to access, update, correct, or delete your account and personal information, subject to applicable law.'],
      ["13. Children's Privacy", 'RTI Voice is not intended for users below the minimum age permitted by applicable law without appropriate parental or guardian consent.'],
      ['14. Changes to This Privacy Policy', 'We may update this policy. The latest version will be published on the website and in the application. Continued use means acceptance of the revised policy.'],
    ],
  },
  CommunityGuidelines: {
    title: 'Community Guidelines', icon: 'people-outline', intro: 'Help us keep RTI Voice safe, respectful, and informative for everyone.',
    sections: [['Respect Others', 'Harassment, bullying, hate speech, discrimination, and abusive behavior are not allowed.'], ['Share Authentic Information', 'Do not post fake news, misleading information, or manipulated content intended to deceive others.'], ['Respect Privacy', "Do not publish another person's private information, personal conversations, or confidential data without permission."], ['Illegal Content', 'Do not upload content that violates Indian laws or promotes criminal activity, violence, terrorism, or other illegal acts.'], ['Intellectual Property', 'Only upload content you own or have permission to use. Respect copyright and trademark rights.'], ['Spam & Misuse', 'Avoid spam, fake engagement, repeated promotional posts, and automated activities.'], ['Live Streaming Rules', 'Live streams must follow Platform policies and applicable laws. RTI Voice may stop or remove violating streams.'], ['Reporting', 'Users can report content or accounts that violate these guidelines. RTI Voice may review and take appropriate action.'], ['Enforcement', 'Violations may result in content removal, feature restrictions, temporary suspension, or permanent account termination.']],
  },
  RefundCancellation: {
    title: 'Refund & Cancellation Policy', icon: 'receipt-outline', intro: 'Effective Date: 06 August 2026',
    sections: [['Subscription Payments', 'RTI Voice may offer premium subscriptions and paid digital services.'], ['Refunds', 'Refund requests are reviewed according to applicable laws and the terms of the purchased service. Refunds may not be available for services already fully delivered or used, unless required by law.'], ['Failed Transactions', 'If a payment fails but money is deducted, the refund or reversal follows the payment gateway and banking partner process.'], ['Cancellation', 'Users may cancel future subscription renewals where applicable. Cancellation does not automatically provide a refund for the current billing period unless stated otherwise.'], ['Promotional Offers', 'Promotional credits, referral rewards, discount coupons, and bonus offers may have separate terms and may not be redeemable for cash.']],
  },
  TermsConditions: {
    title: 'Terms & Conditions', icon: 'document-text-outline', intro: 'Effective Date: 06 August 2026',
    sections: [['1. Acceptance of Terms', 'By accessing or using RTI Voice, you agree to these Terms & Conditions. If you do not agree, please do not use the Platform.'], ['2. Platform Services', 'RTI Voice provides social networking, news sharing, RTI awareness, live streaming, community engagement, referral programs, subscriptions, and other digital services.'], ['3. User Accounts', 'Users are responsible for keeping account credentials confidential and for all activity performed through their account.'], ['4. User Content', 'Users may upload text, images, videos, PDFs, voice recordings, comments, and live streams. You retain ownership, while granting RTI Voice a limited licence to display and distribute content within the Platform.'], ['5. Prohibited Activities', 'Users must not upload illegal or harmful content; spread false information; harass others; infringe intellectual-property rights; use fake identities; or attempt unauthorized access.'], ['6. Premium Services', 'Premium features are available through paid subscriptions. Access, pricing, and benefits may change from time to time.'], ['7. Account Suspension', 'RTI Voice may suspend or terminate accounts that violate these Terms, Community Guidelines, or applicable laws.'], ['8. Intellectual Property', 'The RTI Voice name, logo, design, and Platform software are protected by applicable intellectual-property laws.'], ['9. Limitation of Liability', 'RTI Voice is not responsible for user-generated content or indirect damages arising from Platform use.'], ['10. Changes', 'We may update these Terms at any time. Continued use indicates acceptance of the updated Terms.'], ['11. Governing Law', 'These Terms are governed by the laws of India.']],
  },
};

export default function LegalPolicyScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_700Bold, Roboto_900Black });
  const insets = useSafeAreaInsets();
  const document = documents[route.params?.document] || documents.PrivacyPolicy;
   return <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
    <ModuleWebHeader title={document.title} navigation={navigation} />
    {Platform.OS !== 'web' && (
      <ImageBackground source={require('../assets/images/profile-red.png')} resizeMode="cover" style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity><Text style={styles.headerTitle}>{document.title}</Text><View style={styles.back} />
      </ImageBackground>
    )}
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}><Ionicons name={document.icon} size={30} color="#dc2626" /><Text style={styles.title}>{document.title}</Text><Text style={styles.effective}>{document.intro}</Text></View>
      {document.sections.map(([heading, body]) => <View key={heading} style={styles.section}><Text style={styles.heading}>{heading}</Text><Text style={styles.body}>{body}</Text></View>)}
      <View style={styles.contact}><Text style={styles.heading}>Contact Us</Text><Text style={styles.body}>For questions related to this policy or your account, contact RTI Voice.</Text><TouchableOpacity onPress={() => Linking.openURL(website)}><Text style={styles.link}>{website}</Text></TouchableOpacity><TouchableOpacity onPress={() => Linking.openURL(`mailto:${contact}`)}><Text style={styles.link}>{contact}</Text></TouchableOpacity></View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ root:{flex:1,backgroundColor:'#f8fafc'}, header:{flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingBottom:14}, back:{width:38,alignItems:'center'}, headerTitle:{flex:1,textAlign:'center',color:'#fff',fontSize:17,fontWeight:'800',fontFamily:FONT.bold}, content:{width:'100%',maxWidth:800,alignSelf:'center',padding:16,paddingBottom:36}, hero:{backgroundColor:'#fff1f2',borderRadius:18,padding:20,borderWidth:1,borderColor:'#fecdd3',marginBottom:14}, title:{fontSize:24,fontWeight:'900',color:'#0f172a',marginTop:10,fontFamily:FONT.black}, effective:{fontSize:13,color:'#64748b',lineHeight:20,marginTop:4,fontFamily:FONT.regular}, section:{backgroundColor:'#fff',borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'#e2e8f0'}, heading:{fontSize:16,fontWeight:'800',color:'#1e293b',marginBottom:7,fontFamily:FONT.bold}, body:{fontSize:14,color:'#475569',lineHeight:21,fontFamily:FONT.regular}, contact:{backgroundColor:'#eff6ff',borderRadius:14,padding:16,borderWidth:1,borderColor:'#bfdbfe',marginTop:4}, link:{color:'#2563eb',fontSize:14,fontWeight:'700',marginTop:8,fontFamily:FONT.bold}, });
