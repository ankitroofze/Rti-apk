import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Linking, Alert, Platform, Modal, useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteCopy } from '../constants/siteCopy';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';

const faqs = [
  {
    q: 'How can I file an RTI application?',
    a: 'You can file an RTI application online through the official RTI Online Portal (rtionline.gov.in) or submit a physical application to the concerned Public Information Officer (PIO). We also provide free RTI guides on our website.',
  },
  {
    q: 'How much does it cost to file an RTI?',
    a: 'The application fee for filing an RTI is ₹10 for central government departments. State government fees may vary. BPL cardholders are exempt from paying the fee.',
  },
  {
    q: 'How long does it take to get a response?',
    a: 'Under the RTI Act, the Public Information Officer must respond within 30 days from the date of application. In case of matters related to life or liberty, the response must be provided within 48 hours.',
  },
  {
    q: 'Can I get help with drafting an RTI application?',
    a: 'Yes! Our team provides free guidance on drafting RTI applications. You can reach out to us via email or phone, and we will help you frame your questions effectively.',
  },
  {
    q: 'Is there any fee for BPL cardholders?',
    a: 'No, BPL (Below Poverty Line) cardholders are exempt from paying the RTI application fee. They need to attach a copy of their BPL certificate with the application.',
  },
  {
    q: 'What is the time limit for response?',
    a: 'Normally 30 days from date of receipt. For life and liberty matters, it is 48 hours. For third party information, it can be extended to 60 days.',
  },
];

const mapUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.6895!2d72.8344!3d19.1381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b63b5c5c5c5d%3A0x5c5c5c5c5c5c5c5c!2sJogeshwari%20West%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000';

const cardShadow = Platform.select({
  web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.06)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});

const modalShadow = Platform.select({
  web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.15)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
});

function MapEmbed() {
  if (Platform.OS === 'web') {
    return (
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 'none', borderRadius: 5, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
  const androidMapUrl = 'https://www.google.com/maps?q=Jogeshwari+West+Mumbai+Maharashtra&z=15&output=embed';
  return (
    <View style={{ flex: 1, borderRadius: 5, overflow: 'hidden', backgroundColor: '#f9fafb' }}>
      <WebView
        source={{ uri: androidMapUrl }}
        style={{ flex: 1, backgroundColor: '#f9fafb' }}
        scrollEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

function SubjectPicker({ value, onChange, subjects, contactCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={s.pickerBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[s.pickerBtnText, !value && { color: '#9ca3af' }]}>
          {value || contactCopy.selectSubject}
        </Text>
        <Text style={s.pickerArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{contactCopy.selectSubjectTitle}</Text>
            {subjects.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[s.modalOption, value === sub && s.modalOptionActive]}
                onPress={() => { onChange(sub); setOpen(false); }}
              >
                <Text style={[s.modalOptionText, value === sub && s.modalOptionTextActive]}>{sub}</Text>
                {value === sub && <Text style={s.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const isWeb = Platform.OS === 'web';

export default function ContactScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { language } = useLanguage();
  const copy = getSiteCopy(language);
  const contactCopy = copy.contact;
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const subjects = contactCopy.subjects;
  const responsiveWidth = getResponsiveWindowWidth(width);
  const isMobileWeb = isWeb && (isMobileWebDevice() || responsiveWidth < 768);
  const scrollContentStyle = !isWeb
    ? s.mobileScrollContent
    : isMobileWeb
      ? s.mobileWebScrollContent
      : null;

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleContactPress = (action) => {
    if (action) {
      Linking.openURL(action);
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !selectedSubject || !form.message) {
      Alert.alert(contactCopy.errorTitle, contactCopy.errorRequiredFields);
      return;
    }
    Alert.alert(contactCopy.successTitle, contactCopy.successMessage);
    setForm({ name: '', phone: '', email: '', message: '' });
    setSelectedSubject('');
  };

  return (
    <View style={{ flex: 1 }}>
      {isWeb ? (
        <AppNavbar navigation={navigation} activeScreen="Contact" />
      ) : (
        <AppNavbar navigation={navigation} activeScreen="Contact" hideBottomBar />
      )}

      <ScrollView
        style={s.container}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* Smaller Hero Section - No Curves */}
        <View style={s.hero}>
          <View style={s.heroContent}>
            <Text style={s.heroBadge}>{contactCopy.heroBadge}</Text>
            <Text style={s.heroTitle}>{contactCopy.heroTitle}</Text>
            <Text style={s.heroSub}>{contactCopy.heroSubtitle}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Map + Contact Details Section - Side by Side */}
          <View style={s.mapDetailsSection}>
            {/* Left Side - Map */}
            <View style={s.mapColumn}>
              <View style={s.mapCard}>
                <View style={s.mapHeader}>
                  <Text style={s.mapTitle}>{contactCopy.ourLocation}</Text>
                  <Text style={s.mapSubtitle}>Jogeshwari West, Mumbai - 400102</Text>
                </View>
                <View style={s.mapContainer}>
                  <MapEmbed />
                </View>
                <TouchableOpacity 
                  style={s.directionBtn} 
                  onPress={() => Linking.openURL('https://maps.google.com/?q=Jogeshwari+West+Mumbai')}
                >
                  <Text style={s.directionBtnText}>{contactCopy.getDirections}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Side - Contact Details */}
            <View style={s.detailsColumn}>
              <View style={s.detailsCard}>
                <Text style={s.detailsSectionTitle}>{contactCopy.contactInformation}</Text>
                
                {/* Phone */}
                <TouchableOpacity style={s.detailRow} onPress={() => handleContactPress('tel:+917020667971')} activeOpacity={0.7}>
                  <View style={s.detailContent}>
                    <Text style={s.detailLabel}>{contactCopy.phoneNumber}</Text>
                    <Text style={s.detailValue}>+91 70206 67971</Text>
                    <Text style={s.detailSub}>{contactCopy.callForInquiries}</Text>
                  </View>
                </TouchableOpacity>

                {/* Email */}
                <TouchableOpacity style={s.detailRow} onPress={() => handleContactPress('mailto:info@rtinews.in')} activeOpacity={0.7}>
                  <View style={s.detailContent}>
                    <Text style={s.detailLabel}>{contactCopy.emailAddress}</Text>
                    <Text style={s.detailValue}>info@rtinews.in</Text>
                    <Text style={s.detailSub}>{contactCopy.respondWithinDay}</Text>
                  </View>
                </TouchableOpacity>

                {/* Working Hours */}
                <View style={s.detailRow}>
                  <View style={s.detailContent}>
                    <Text style={s.detailLabel}>{contactCopy.workingHours}</Text>
                    <Text style={s.detailValue}>Monday - Saturday: 10:00 AM - 7:00 PM</Text>
                    <Text style={s.detailSub}>{contactCopy.sundayClosed}</Text>
                  </View>
                </View>

                {/* Office Address */}
                <View style={s.detailRow}>
                  <View style={s.detailContent}>
                    <Text style={s.detailLabel}>{contactCopy.officeAddress}</Text>
                    <Text style={s.detailValue}>
                      Flat No. 1106 Lotus Residency{'\n'}
                      A Wing Ram Mandir Chowk SV Road{'\n'}
                      Mahatma Jyotiba Phule Nagar, Jogeshwari West{'\n'}
                      Mumbai - 400102, Maharashtra
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* FAQ + Contact Form Section - Equal Height */}
          <View style={s.bottomSection}>
            {/* Left Side - FAQ */}
            <View style={s.faqColumn}>
              <View style={s.faqCard}>
                <Text style={s.sectionTitle}>{contactCopy.faqTitle}</Text>
                <View style={s.faqList}>
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={[s.faqItem, isOpen && s.faqItemOpen]} 
                        onPress={() => setOpenFaq(isOpen ? null : idx)} 
                        activeOpacity={0.85}
                      >
                        <View style={s.faqHeader}>
                          <Text style={s.faqQ} numberOfLines={isOpen ? undefined : 2}>
                            {faq.q}
                          </Text>
                          <View style={[s.faqToggle, isOpen && s.faqToggleActive]}>
                            <Text style={s.faqToggleText}>{isOpen ? '−' : '+'}</Text>
                          </View>
                        </View>
                        {isOpen ? <Text style={s.faqA}>{faq.a}</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Right Side - Contact Form (Same height as FAQ) */}
            <View style={s.formColumn}>
              <View style={s.formCard}>
                <Text style={s.formTitle}>{contactCopy.formTitle}</Text>
                <Text style={s.formSubtitle}>{contactCopy.formSubtitle}</Text>

                <Text style={s.label}>{contactCopy.fullName} <Text style={s.required}>*</Text></Text>
                <TextInput 
                  style={s.input} 
                  placeholder={contactCopy.namePlaceholder}
                  placeholderTextColor="#9ca3af" 
                  value={form.name} 
                  onChangeText={(t) => updateField('name', t)} 
                />

                <Text style={s.label}>{contactCopy.phone}</Text>
                <TextInput 
                  style={s.input} 
                  placeholder={contactCopy.phonePlaceholder}
                  placeholderTextColor="#9ca3af" 
                  keyboardType="phone-pad" 
                  value={form.phone} 
                  onChangeText={(t) => updateField('phone', t)} 
                />

                <Text style={s.label}>{contactCopy.emailAddress} <Text style={s.required}>*</Text></Text>
                <TextInput 
                  style={s.input} 
                  placeholder={contactCopy.emailPlaceholder}
                  placeholderTextColor="#9ca3af" 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  value={form.email} 
                  onChangeText={(t) => updateField('email', t)} 
                />

                <Text style={s.label}>{contactCopy.subject} <Text style={s.required}>*</Text></Text>
                <SubjectPicker value={selectedSubject} onChange={setSelectedSubject} subjects={subjects} contactCopy={contactCopy} />

                <Text style={s.label}>{contactCopy.message} <Text style={s.required}>*</Text></Text>
                <TextInput 
                  style={[s.input, s.textarea]} 
                  placeholder={contactCopy.messagePlaceholder}
                  placeholderTextColor="#9ca3af" 
                  multiline 
                  numberOfLines={4} 
                  value={form.message} 
                  onChangeText={(t) => updateField('message', t)} 
                />

                <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
                  <Text style={s.submitBtnText}>{contactCopy.sendMessage}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {isWeb ? <AppFooter navigation={navigation} /> : null}
      </ScrollView>

      {!isWeb ? <AppNavbar navigation={navigation} activeScreen="Contact" hideTopHeader /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  mobileScrollContent: { paddingBottom: 8 },
  mobileWebScrollContent: { paddingBottom: 140 },

  // Smaller Hero Section - No Curves
  hero: { 
    backgroundColor: '#1a2c3e', 
    paddingVertical: 32, 
    paddingHorizontal: 24, 
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 700,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#ffffff',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  heroTitle: { 
    color: '#ffffff', 
    fontSize: 36, 
    fontWeight: '700', 
    marginBottom: 12, 
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSub: { 
    color: '#5a6e8a', 
    fontSize: 14, 
    textAlign: 'center', 
    lineHeight: 22,
    maxWidth: 500,
    fontWeight: '400',
  },

  body: { 
    paddingHorizontal: 8, 
    paddingTop: 32, 
    paddingBottom: 16,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%'
  },

  // Map + Details Section - Side by Side
  mapDetailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
  },
  
  // Left Column - Map
  mapColumn: {
    flex: 1,
    minWidth: 300,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    height: '100%',
    ...cardShadow,
  },
  mapHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fafbfc',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2c3e',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  mapContainer: {
    height: 380,
    backgroundColor: '#f1f5f9',
  },
  directionBtn: {
    backgroundColor: '#2c3e50',
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
  },
  directionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Right Column - Contact Details
  detailsColumn: {
    flex: 1,
    minWidth: 300,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    height: '100%',
    ...cardShadow,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2c3e',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailRow: {
    marginBottom: 24,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a2c3e',
    marginBottom: 4,
    lineHeight: 24,
  },
  detailSub: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Bottom Section - FAQ + Form (Equal Height)
  bottomSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  
  // Left Column - FAQ (Larger items)
  faqColumn: {
    flex: 1.5,
    minWidth: 320,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    height: '100%',
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2c3e',
    marginBottom: 24,
  },
  faqList: {
    gap: 16,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    padding: 20,
    backgroundColor: '#fafbfc',
  },
  faqItemOpen: {
    borderColor: '#2c3e50',
    backgroundColor: '#fff',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a2c3e',
    lineHeight: 22,
  },
  faqToggle: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  faqToggleActive: {
    backgroundColor: '#2c3e50',
  },
  faqToggleText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  faqA: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },

  // Right Column - Contact Form (Same Height as FAQ)
  formColumn: {
    flex: 1,
    minWidth: 300,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    height: '100%',
    ...cardShadow,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2c3e',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a2c3e',
    backgroundColor: '#fafbfc',
    marginBottom: 8,
  },
  textarea: {
    height: 110,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fafbfc',
    marginBottom: 8,
  },
  pickerBtnText: {
    fontSize: 14,
    color: '#1a2c3e',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 8,
    width: '100%',
    maxWidth: 380,
    ...modalShadow,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a2c3e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 5,
  },
  modalOptionActive: {
    backgroundColor: '#f0f9ff',
  },
  modalOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  modalOptionTextActive: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  modalCheck: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2c3e50',
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
