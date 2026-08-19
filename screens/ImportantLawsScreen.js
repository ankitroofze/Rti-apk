import React from 'react';
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteCopy } from '../constants/siteCopy';

const laws = [
  {
    title: 'Right to Information Act, 2005',
    short: 'RTI Act 2005',
    desc: 'This law gives Indian citizens the right to request government information. Public authorities must provide information within 30 days.',
    color: '#f97316',
    icon: '📜',
  },
  {
    title: 'Office Delay Prevention Act',
    short: 'Delay Prevention Act',
    desc: 'Maharashtra Government Servants\' Transfer Regulation and Prevention of Delay in Government Duties Act, 2005.',
    color: '#3b82f6',
    icon: '⚖️',
  },
  {
    title: 'Central Information Commission (CIC)',
    short: 'Central Information Commission',
    desc: 'For complaints regarding public authorities under the central government. Address: August Kranti Bhawan, Bhikaji Cama Place, New Delhi 110006.',
    color: '#16a34a',
    icon: '🏛️',
  },
  {
    title: 'State Information Commission (SIC)',
    short: 'State Information Commission',
    desc: 'Complaints regarding public authorities under the state government should be filed with the respective state information commission.',
    color: '#a855f7',
    icon: '🏢',
  },
  {
    title: 'Section 8 - Exemptions from Disclosure',
    short: 'Section 8 - Exemptions',
    desc: 'Information can be denied in matters such as national security, personal privacy, and court proceedings.',
    color: '#ef4444',
    icon: '🚫',
  },
  {
    title: 'Section 9 - Copyright Information',
    short: 'Section 9 - Copyright',
    desc: 'Information can be denied if it falls under the copyright of any person other than the state.',
    color: '#14b8a6',
    icon: '©️',
  },
];

const isWeb = Platform.OS === 'web';

export default function ImportantLawsScreen({ navigation }) {
  const { language } = useLanguage();
  const copy = getSiteCopy(language);
  const lawsCopy = copy.laws;
  const factItems = [
    { icon: '💰', label: lawsCopy.applicationFee, value: '₹10 only' },
    { icon: '⏱️', label: lawsCopy.responseTime, value: '30 Days' },
    { icon: '🚨', label: lawsCopy.lifeLiberty, value: '48 Hours' },
    { icon: '🆓', label: lawsCopy.bplCitizens, value: 'Free' },
  ];

  // Split laws into pairs for 2-column layout
  const lawPairs = [];
  for (let i = 0; i < laws.length; i += 2) {
    lawPairs.push(laws.slice(i, i + 2));
  }

  return (
    <View style={{ flex: 1 }}>
      {isWeb ? <AppNavbar navigation={navigation} activeScreen="ImportantLaws" /> : null}

      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          <Text style={s.heroEmoji}>⚖️</Text>
          <Text style={s.heroTitle}>{lawsCopy.heroTitle}</Text>
          <Text style={s.heroSub}>{lawsCopy.heroSubtitle}</Text>
        </View>

        <View style={s.body}>

          {/* Key Facts Section - 4 cards in one row */}
          <View style={s.factsRow}>
            {factItems.map((f) => (
              <View key={f.label} style={s.factCard}>
                <Text style={s.factIcon}>{f.icon}</Text>
                <Text style={s.factValue}>{f.value}</Text>
                <Text style={s.factLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionLabel}>{lawsCopy.sectionLabel}</Text>
          <Text style={s.sectionTitle}>{lawsCopy.sectionTitle}</Text>

          {/* Law Cards - 2 per row */}
          {lawPairs.map((pair, pairIdx) => (
            <View key={pairIdx} style={s.lawRow}>
              {pair.map((law, idx) => (
                <View key={idx} style={[s.lawCard, { borderLeftColor: law.color }]}>
                  <View style={s.lawCardHeader}>
                    <View style={[s.lawIcon, { backgroundColor: law.color }]}>
                      <Text style={s.lawIconText}>{law.icon}</Text>
                    </View>
                    <View style={s.lawTitleWrap}>
                      <Text style={[s.lawShort, { color: law.color }]}>{law.short}</Text>
                      <Text style={s.lawTitle}>{law.title}</Text>
                    </View>
                  </View>
                  <Text style={s.lawDesc}>{law.desc}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* RTI Process Steps - Improved */}
          <View style={s.stepsCard}>
            <Text style={s.stepsTitle}>📋 {lawsCopy.stepsTitle}</Text>
            <View style={s.stepsGrid}>
              {[
                { step: '1', title: 'Prepare Application', desc: 'Write information request on plain paper by hand or type.' },
                { step: '2', title: 'Pay Fee', desc: 'Pay ₹10 via DD, Postal Order, or cash. BPL holders exempted.' },
                { step: '3', title: 'Submit Application', desc: 'Submit to Public Information Officer & get acknowledgment.' },
                { step: '4', title: 'Wait for Response', desc: 'Response in 30 days. No response means denial.' },
                { step: '5', title: 'File Appeal', desc: 'File first appeal in 30 days, then appeal to CIC/SIC.' },
              ].map((item) => (
                <View key={item.step} style={s.stepItem}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{item.step}</Text>
                  </View>
                  <View style={s.stepContent}>
                    <Text style={s.stepTitle}>{item.title}</Text>
                    <Text style={s.stepDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Contact CIC Banner - Fixed container */}
          <View style={s.cicBanner}>
            <Text style={s.cicTitle}>🏛️ {lawsCopy.cicTitle}</Text>
            <Text style={s.cicAddress}>
              August Kranti Bhawan, Bhikaji Cama Place, New Delhi - 110006
            </Text>
            <Text style={s.cicWeb}>🌐 www.cic.gov.in</Text>
          </View>

        </View>

        <AppFooter navigation={navigation} />
      </ScrollView>

      {!isWeb && <AppNavbar navigation={navigation} activeScreen="ImportantLaws" />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  hero: { backgroundColor: '#1e293b', padding: 28, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  heroCircle1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(249,115,22,0.15)' },
  heroCircle2: { position: 'absolute', bottom: -50, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(249,115,22,0.1)' },
  heroEmoji: { fontSize: 40, marginBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 10, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  heroSub: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },

  body: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 },

  factsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 24 },
  factCard: { flex: 1, backgroundColor: '#fff', borderRadius: 5, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
  factIcon: { fontSize: 22, marginBottom: 4 },
  factValue: { fontSize: 16, fontWeight: 'bold', color: '#f97316', marginBottom: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  factLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },

  sectionLabel: { color: '#f97316', fontWeight: '700', fontSize: 11, letterSpacing: 1, textAlign: 'center', marginBottom: 4 },
  sectionTitle: { color: '#111827', fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },

  lawRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  lawCard: { flex: 1, backgroundColor: '#fff', borderRadius: 5, padding: 14, borderLeftWidth: 4, elevation: 1, borderWidth: 1, borderColor: '#e5e7eb' },
  lawCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  lawIcon: { width: 36, height: 36, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  lawIconText: { fontSize: 18 },
  lawTitleWrap: { flex: 1 },
  lawShort: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  lawTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827', lineHeight: 16, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  lawDesc: { fontSize: 11, color: '#6b7280', lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },

  stepsCard: { backgroundColor: '#fff', borderRadius: 5, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1 },
  stepsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  stepsGrid: { gap: 14 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumText: { color: '#fff', fontWeight: 'bold', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 3, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  stepDesc: { fontSize: 11, color: '#6b7280', lineHeight: 17, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },

  cicBanner: { backgroundColor: '#1e293b', borderRadius: 5, padding: 16, marginBottom: 16, alignItems: 'center', marginHorizontal: 0 },
  cicTitle: { color: '#f97316', fontSize: 15, fontWeight: 'bold', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  cicAddress: { color: '#e2e8f0', fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  cicWeb: { color: '#38bdf8', fontSize: 12, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
});
