import React from 'react';
import {
  ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Linking, Platform,
} from 'react-native';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteCopy } from '../constants/siteCopy';
import { getMobileWebViewportWidth, isMobileWebDevice } from '../utils/webDevice';

const values = [
  { icon: '🛡️', title: 'Transparency', desc: 'We believe every citizen has the right to know. We report openly, without fear or favour, holding power accountable.', color: '#f97316' },
  { icon: '⚖️', title: 'Accuracy',     desc: 'Every story we publish is verified thoroughly. We take responsibility for every word — precision is our promise.',      color: '#3b82f6' },
  { icon: '🎯', title: 'Independence', desc: 'RTI News is free from political or corporate influence. Our only allegiance is to truth and public interest.',           color: '#16a34a' },
  { icon: '💡', title: 'Empowerment',  desc: "We don't just report news — we educate citizens on how to use RTI to fight corruption and demand accountability.",      color: '#a855f7' },
];

const team = [
  { name: 'Rajesh Kumar',  role: 'Founder & Editor-in-Chief',   bio: 'RTI activist for 15+ years. Former journalist with The Hindu. Fought and won 200+ RTI cases.',              avatar: 'https://i.pravatar.cc/120?u=rajesh-kumar',  badge: 'Founder' },
  { name: 'Priya Sharma',  role: 'Senior Legal Correspondent',  bio: 'LLB from Delhi University. Covers Supreme Court RTI verdicts and constitutional law updates.',             avatar: 'https://i.pravatar.cc/120?u=priya-sharma',  badge: 'Legal Expert' },
  { name: 'Amit Patil',    role: 'Maharashtra Bureau Chief',    bio: 'Based in Pune. Specialises in state government transparency and Gram Panchayat RTI filings.',             avatar: 'https://i.pravatar.cc/120?u=amit-patil',    badge: 'Bureau Chief' },
  { name: 'Deepa Iyer',    role: 'Education & RTI Trainer',     bio: "Conducts RTI workshops in schools and colleges. Has trained over 1 lakh students on citizens' rights.",   avatar: 'https://i.pravatar.cc/120?u=deepa-iyer',    badge: 'Trainer' },
  { name: 'Vikram Singh',  role: 'Investigations Editor',       bio: 'Award-winning investigative journalist. Exposed major RTI-related corruption cases in 5 states.',         avatar: 'https://i.pravatar.cc/120?u=vikram-singh',  badge: 'Investigator' },
  { name: 'Kavya Nair',    role: 'Digital & Social Media Head', bio: 'Makes RTI accessible through social media. Runs RTI News YouTube channel with 500K subscribers.',         avatar: 'https://i.pravatar.cc/120?u=kavya-nair',    badge: 'Digital Head' },
];

const milestones = [
  { year: '2015', title: 'RTI News Founded',         desc: 'Started as a blog by Rajesh Kumar to cover RTI case outcomes across India.',             side: 'left'  },
  { year: '2017', title: 'Went National',            desc: 'Expanded coverage to all 28 states. Hired our first team of 10 reporters.',             side: 'right' },
  { year: '2019', title: '1 Lakh Readers Milestone', desc: 'Crossed 1 lakh monthly readers. Launched RTI helpline for citizens.',                   side: 'left'  },
  { year: '2021', title: 'Best RTI Media Award',     desc: 'Received National Press Foundation award for outstanding RTI journalism.',               side: 'right' },
  { year: '2023', title: 'RTI App Launch',           desc: "Launched India's first RTI news mobile app. 5 lakh downloads in 3 months.",             side: 'left'  },
  { year: '2026', title: '1.2M Monthly Readers',     desc: 'Reached 1.2 million monthly readers. Expanded to 8 Indian languages.',                  side: 'right' },
];

const points = [
  '100% independent — no political or corporate funding',
  'Verified reporting on every RTI case we cover',
  'Free RTI guides and helpline for all citizens',
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function SectionLabel({ label, title, isMobile }) {
  return (
    <>
      <View style={s.centeredLabelRow}>
        <View style={s.labelLine} />
        <Text style={[s.sectionLabel, isMobile && s.sectionLabelMobile]}>{label}</Text>
        <View style={s.labelLine} />
      </View>
      <Text style={[s.sectionTitle, isMobile && s.sectionTitleMobile]}>{title}</Text>
    </>
  );
}

const isWeb = Platform.OS === 'web';
const cardShadow = Platform.select({
  web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
});
const cardShadowLarge = Platform.select({
  web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.06)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
const milestoneDotShadow = Platform.select({
  web: { boxShadow: '0px 2px 4px rgba(249,115,22,0.4)' },
  default: {
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default function AboutScreen({ navigation }) {
  const { language } = useLanguage();
  const copy = getSiteCopy(language);
  const aboutCopy = copy.about;

  const getWidth = () => {
    if (Platform.OS !== 'web') return 360;
    if (isMobileWebDevice()) return getMobileWebViewportWidth(360);
    if (typeof document !== 'undefined') return document.documentElement.clientWidth;
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1200;
  };
  const [isMobile, setIsMobile] = React.useState(() => isMobileWebDevice() || getWidth() < 768);
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const update = () => setIsMobile(isMobileWebDevice() || getWidth() < 768);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const teamRows = chunk(team, isMobile ? 1 : 3);

  // ✅ FIX: AppNavbar ScrollView ke BAHAR
  return (
    <View style={{ flex: 1 }}>
      {/* Web pe TOP navbar */}
      {isWeb ? <AppNavbar navigation={navigation} activeScreen="About" /> : null}

      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={[s.hero, isMobile && s.heroMobile]}>
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          <View style={s.heroBadge}>
            <Text style={[s.heroBadgeText, isMobile && s.heroBadgeTextMobile]}>🇮🇳 {aboutCopy.heroBadge}</Text>
          </View>
          <Text style={[s.heroTitle, isMobile && s.heroTitleMobile]}>{aboutCopy.heroTitle}</Text>
          <Text style={[s.heroSub, isMobile && s.heroSubMobile]}>
            {aboutCopy.heroSubtitle}
          </Text>
        </View>

        <View style={[s.body, isMobile && s.bodyMobile]}>

          {/* ── Mission ── */}
          <View style={[s.missionCard, isMobile && s.missionCardMobile]}>
            <View style={isMobile ? s.missionRowMobile : s.missionRow}>
              <View style={isMobile ? s.missionImgWrapMobile : s.missionImgWrap}>
                <Image
                  source={{ uri: 'https://picsum.photos/700/450?random=300' }}
                  style={isMobile ? s.missionImgMobile : s.missionImg}
                  resizeMode="cover"
                />
                <View style={[s.missionBadge, isMobile && s.missionBadgeMobile]}>
                  <Text style={[s.missionBadgeTitle, isMobile && s.missionBadgeTitleMobile]}>11+ Years</Text>
                  <Text style={[s.missionBadgeSub, isMobile && s.missionBadgeSubMobile]}>of RTI Journalism</Text>
                </View>
              </View>
              <View style={isMobile ? s.missionTextMobile : s.missionText}>
                <View style={s.missionLabelRow}>
                  <View style={s.orangeBar} />
                  <Text style={s.missionLabel}>{aboutCopy.missionLabel}</Text>
                </View>
                <Text style={[s.missionTitle, isMobile && s.missionTitleMobile]}>
                  {aboutCopy.missionTitle}
                </Text>
                <Text style={[s.missionDesc, isMobile && s.missionDescMobile]}>
                  RTI News was founded with a single, powerful belief —{' '}
                  <Text style={{ fontWeight: '700', color: '#111827' }}>every Indian citizen deserves to know</Text>
                  {' '}how their government functions, where public money goes, and what decisions are being made in their name.
                </Text>
                <Text style={[s.missionDesc2, isMobile && s.missionDescMobile]}>
                  We cover RTI case outcomes, legal updates, government accountability stories, and empower citizens to exercise their Right to Information. From village panchayats to the highest courts, we bring you the truth.
                </Text>
                {points.map((p) => (
                  <View key={p} style={s.pointRow}>
                    <Text style={s.pointIcon}>✅</Text>
                    <Text style={[s.pointText, isMobile && s.pointTextMobile]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Core Values ── */}
          <View style={[s.section, isMobile && s.sectionMobile]}>
            <SectionLabel label={aboutCopy.valuesLabel} title={aboutCopy.valuesTitle} isMobile={isMobile} />
            <View style={isMobile ? s.valuesGridMobile : s.valuesGrid}>
              {values.map((v, i) => (
                <View
                  key={v.title}
                  style={[
                    isMobile ? s.valueCardMobile : s.valueCard,
                    !isMobile && i < values.length - 1 && s.valueCardGap,
                    isMobile && i < values.length - 1 && s.valueCardMobileGap,
                  ]}
                >
                  <View style={[s.valueIcon, { backgroundColor: v.color }, isMobile && s.valueIconMobile]}>
                    <Text style={[s.valueIconText, isMobile && s.valueIconTextMobile]}>{v.icon}</Text>
                  </View>
                  <View style={s.valueTextWrap}>
                    <Text style={[s.valueName, isMobile && s.valueNameMobile]}>{v.title}</Text>
                    <Text style={[s.valueDesc, isMobile && s.valueDescMobile]}>{v.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Team ── */}
          <View style={[s.section, isMobile && s.sectionMobile]}>
            <SectionLabel label={aboutCopy.teamLabel} title={aboutCopy.teamTitle} isMobile={isMobile} />
            {teamRows.map((row, ri) => (
              <View
                key={ri}
                style={[
                  isMobile ? s.teamRowMobile : s.teamRow,
                  ri < teamRows.length - 1 && s.teamRowGap,
                ]}
              >
                {row.map((m, mi) => (
                  <View
                    key={m.name}
                    style={[
                      isMobile ? s.teamCardMobile : s.teamCard,
                      !isMobile && mi < row.length - 1 && s.teamCardGap,
                      isMobile && mi < row.length - 1 && s.teamCardMobileGap,
                    ]}
                  >
                    <View style={[s.teamAvatarWrap, isMobile && s.teamAvatarWrapMobile]}>
                      <Image
                        source={{ uri: m.avatar }}
                        style={isMobile ? s.teamAvatarMobile : s.teamAvatar}
                      />
                      <View style={[s.teamBadge, isMobile && s.teamBadgeMobile]}>
                        <Text style={s.teamBadgeText}>{m.badge}</Text>
                      </View>
                    </View>
                    <View style={isMobile ? s.teamInfoMobile : s.teamInfo}>
                      <Text style={[s.teamName, isMobile && s.teamNameMobile]}>{m.name}</Text>
                      <Text style={[s.teamRole, isMobile && s.teamRoleMobile]}>{m.role}</Text>
                      <Text style={[s.teamBio, isMobile && s.teamBioMobile]}>{m.bio}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* ── Milestones Timeline ── */}
          <View style={[s.section, isMobile && s.sectionMobile]}>
            <SectionLabel label={aboutCopy.journeyLabel} title={aboutCopy.journeyTitle} isMobile={isMobile} />
            {isMobile ? (
              <View style={s.timelineMobile}>
                <View style={s.timelineVLineMobile} />
                {milestones.map((m, i) => (
                  <View key={m.year} style={[s.milestoneMobileRow, i < milestones.length - 1 && s.milestoneMobileRowGap]}>
                    <View style={s.milestoneDotWrapMobile}>
                      <View style={s.milestoneDot} />
                    </View>
                    <View style={s.milestoneCardMobile}>
                      <Text style={s.milestoneYear}>{m.year}</Text>
                      <Text style={s.milestoneTitleText}>{m.title}</Text>
                      <Text style={s.milestoneDesc}>{m.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.timeline}>
                <View style={s.timelineVLine} />
                {milestones.map((m, i) => (
                  <View key={m.year} style={[s.milestoneRow, i < milestones.length - 1 && s.milestoneRowGap]}>
                    <View style={s.milestoneSlot}>
                      {m.side === 'left' && (
                        <View style={s.milestoneCard}>
                          <Text style={s.milestoneYear}>{m.year}</Text>
                          <Text style={s.milestoneTitleText}>{m.title}</Text>
                          <Text style={s.milestoneDesc}>{m.desc}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.milestoneDotWrap}>
                      <View style={s.milestoneDot} />
                    </View>
                    <View style={s.milestoneSlot}>
                      {m.side === 'right' && (
                        <View style={s.milestoneCard}>
                          <Text style={s.milestoneYear}>{m.year}</Text>
                          <Text style={s.milestoneTitleText}>{m.title}</Text>
                          <Text style={s.milestoneDesc}>{m.desc}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── CTA Banner ── */}
          <View style={[s.ctaBanner, isMobile && s.ctaBannerMobile]}>
            <Image source={{ uri: 'https://picsum.photos/1200/200?random=301' }} style={s.ctaBannerImg} resizeMode="cover" />
            <View style={s.ctaOverlay} />
            <View style={[s.ctaContent, isMobile && s.ctaContentMobile]}>
              <View style={s.ctaBadgeWrap}>
                <Text style={[s.ctaBadge, isMobile && s.ctaBadgeMobile]}>🤝 {aboutCopy.ctaBadge}</Text>
              </View>
              <Text style={[s.ctaTitle, isMobile && s.ctaTitleMobile]}>{aboutCopy.ctaTitle}</Text>
              <Text style={[s.ctaDesc, isMobile && s.ctaDescMobile]}>{aboutCopy.ctaDescription}</Text>
              <View style={[s.ctaButtons, isMobile && s.ctaButtonsMobile]}>
                <TouchableOpacity style={[s.ctaBtn1, isMobile ? s.ctaBtnMobile : s.ctaBtn1Gap]} onPress={() => navigation.navigate('Contact')}>
                  <Text style={[s.ctaBtn1Text, isMobile && s.ctaBtnTextMobile]}>👥 {aboutCopy.joinReporter}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.ctaBtn2, isMobile && s.ctaBtnMobile]} onPress={() => navigation.navigate('Contact')}>
                  <Text style={[s.ctaBtn2Text, isMobile && s.ctaBtnTextMobile]}>✉️ {aboutCopy.contactUs}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Contact Strip ── */}
          <View style={[s.contactStrip, isMobile && s.contactStripMobile]}>
            <View style={[s.contactStripLeft, isMobile && s.contactStripLeftMobile]}>
              <Text style={[s.contactStripTitle, isMobile && s.contactStripTitleMobile]}>{aboutCopy.questionsTitle}</Text>
              <Text style={[s.contactStripSub, isMobile && s.contactStripSubMobile]}>{aboutCopy.questionsSubtitle}</Text>
            </View>
            <View style={[s.contactBtns, isMobile && s.contactBtnsMobile]}>
              <TouchableOpacity style={[s.contactBtn1, isMobile ? s.contactBtnFullMobile : s.contactBtn1Gap]} onPress={() => Linking.openURL('tel:+911234567890')}>
                <Text style={[s.contactBtn1Text, isMobile && s.contactBtnTextMobile]}>📞 +91 12345 67890</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.contactBtn2, isMobile && s.contactBtnFullMobile]} onPress={() => Linking.openURL('mailto:info@rtinews.in')}>
                <Text style={[s.contactBtn2Text, isMobile && s.contactBtnTextMobile]}>✉️ info@rtinews.in</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        <AppFooter navigation={navigation} />
      </ScrollView>

      {/* Mobile pe BOTTOM navbar — ScrollView ke BAHAR */}
      {!isWeb && <AppNavbar navigation={navigation} activeScreen="About" />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  body:       { paddingHorizontal: 24, paddingTop: 8 },
  bodyMobile: { paddingHorizontal: 12 },
  section:       { marginBottom: 40 },
  sectionMobile: { marginBottom: 28 },

  hero: { backgroundColor: '#f97316', padding: 40, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  heroMobile: { padding: 24 },
  heroCircle1: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroCircle2: { position: 'absolute', bottom: -50, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
  heroBadgeText:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroBadgeTextMobile: { fontSize: 11 },
  heroTitle:       { color: '#fff', fontSize: 30, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  heroTitleMobile: { fontSize: 22, marginBottom: 8 },
  heroSub:       { color: '#fed7aa', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  heroSubMobile: { fontSize: 12, lineHeight: 20 },

  missionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', ...cardShadowLarge, marginBottom: 40 },
  missionCardMobile: { marginBottom: 28, padding: 0, borderRadius: 14 },
  missionRow:       { flexDirection: 'row', alignItems: 'flex-start' },
  missionRowMobile: { flexDirection: 'column' },
  missionImgWrap:       { flex: 1, position: 'relative', marginRight: 28 },
  missionImgWrapMobile: { width: '100%', position: 'relative' },
  missionImg:       { width: '100%', height: 320, borderRadius: 16 },
  missionImgMobile: { width: '100%', height: 200, borderRadius: 14 },
  missionBadge: { position: 'absolute', bottom: -14, right: 16, backgroundColor: '#f97316', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  missionBadgeMobile: { bottom: 12, right: 12, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  missionBadgeTitle:       { color: '#fff', fontWeight: '900', fontSize: 18 },
  missionBadgeTitleMobile: { fontSize: 14 },
  missionBadgeSub:       { color: '#fed7aa', fontSize: 11 },
  missionBadgeSubMobile: { fontSize: 10 },
  missionText:       { flex: 1, paddingTop: 8 },
  missionTextMobile: { padding: 16 },
  missionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  orangeBar:       { width: 4, height: 20, backgroundColor: '#f97316', borderRadius: 2, marginRight: 8 },
  missionLabel:    { color: '#f97316', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  missionTitle:       { fontSize: 26, fontWeight: '900', color: '#111827', marginBottom: 12, lineHeight: 34 },
  missionTitleMobile: { fontSize: 20, lineHeight: 28 },
  missionDesc:       { color: '#6b7280', fontSize: 14, lineHeight: 24, marginBottom: 10 },
  missionDesc2:      { color: '#6b7280', fontSize: 14, lineHeight: 24, marginBottom: 14 },
  missionDescMobile: { fontSize: 13, lineHeight: 20 },
  pointRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  pointIcon:      { fontSize: 14, marginTop: 2, marginRight: 8 },
  pointText:      { color: '#374151', fontSize: 14, flex: 1, lineHeight: 22 },
  pointTextMobile:{ fontSize: 13, lineHeight: 20 },

  centeredLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  labelLine:        { height: 1, width: 40, backgroundColor: '#f97316', opacity: 0.5, marginHorizontal: 10 },
  sectionLabel:       { color: '#f97316', fontWeight: '800', fontSize: 11, letterSpacing: 1, textAlign: 'center' },
  sectionLabelMobile: { fontSize: 10, letterSpacing: 0.5 },
  sectionTitle:       { color: '#111827', fontWeight: '900', fontSize: 22, textAlign: 'center', marginBottom: 20 },
  sectionTitleMobile: { fontSize: 18, marginBottom: 14 },

  valuesGrid:       { flexDirection: 'row' },
  valuesGridMobile: { flexDirection: 'column' },
  valueCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#f3f4f6', ...cardShadow },
  valueCardGap:   { marginRight: 14 },
  valueCardMobile: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', alignItems: 'flex-start', ...cardShadow },
  valueCardMobileGap: { marginBottom: 10 },
  valueIcon:       { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  valueIconMobile: { width: 44, height: 44, borderRadius: 12, marginBottom: 0, flexShrink: 0, marginRight: 12 },
  valueIconText:       { fontSize: 24 },
  valueIconTextMobile: { fontSize: 20 },
  valueTextWrap: { flex: 1 },
  valueName:       { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 8 },
  valueNameMobile: { fontSize: 14, marginBottom: 4 },
  valueDesc:       { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  valueDescMobile: { fontSize: 12, lineHeight: 17 },

  teamRow:       { flexDirection: 'row' },
  teamRowMobile: {},
  teamRowGap:    { marginBottom: 14 },
  teamCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6', ...cardShadow },
  teamCardGap:    { marginRight: 14 },
  teamCardMobile: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#f3f4f6', ...cardShadow },
  teamCardMobileGap: { marginBottom: 10 },
  teamAvatarWrap:       { position: 'relative', marginBottom: 12 },
  teamAvatarWrapMobile: { marginBottom: 0, flexShrink: 0, marginRight: 14 },
  teamAvatar:       { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#ffedd5' },
  teamAvatarMobile: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#ffedd5' },
  teamBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', left: 0, right: 0, alignItems: 'center', backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  teamBadgeMobile: { bottom: -8, left: 0, right: 'auto', alignSelf: undefined, alignItems: undefined, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  teamBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  teamInfo:       { alignItems: 'center' },
  teamInfoMobile: { flex: 1, alignItems: 'flex-start', paddingTop: 2 },
  teamName:       { fontSize: 14, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  teamNameMobile: { textAlign: 'left', fontSize: 13 },
  teamRole:       { fontSize: 11, color: '#f97316', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  teamRoleMobile: { textAlign: 'left', marginBottom: 4 },
  teamBio:       { fontSize: 12, color: '#6b7280', lineHeight: 18, textAlign: 'center' },
  teamBioMobile: { textAlign: 'left', fontSize: 12, lineHeight: 17 },

  timeline:      { position: 'relative', paddingVertical: 8 },
  timelineVLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, backgroundColor: '#fed7aa', marginLeft: -1 },
  milestoneRow:    { flexDirection: 'row', alignItems: 'center' },
  milestoneRowGap: { marginBottom: 24 },
  milestoneSlot:    { flex: 1, paddingHorizontal: 12 },
  milestoneDotWrap: { width: 20, alignItems: 'center' },
  timelineMobile:    { position: 'relative', paddingLeft: 28 },
  timelineVLineMobile: { position: 'absolute', top: 8, bottom: 8, left: 8, width: 2, backgroundColor: '#fed7aa' },
  milestoneMobileRow:    { flexDirection: 'row', alignItems: 'flex-start' },
  milestoneMobileRowGap: { marginBottom: 16 },
  milestoneDotWrapMobile:{ width: 20, alignItems: 'center', paddingTop: 4, marginLeft: -28, marginRight: 12 },
  milestoneCardMobile:   { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f3f4f6', ...cardShadow },
  milestoneDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#f97316', borderWidth: 3, borderColor: '#fff', ...milestoneDotShadow },
  milestoneCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', ...cardShadow },
  milestoneYear:      { color: '#f97316', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  milestoneTitleText: { color: '#111827', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  milestoneDesc:      { color: '#6b7280', fontSize: 13, lineHeight: 20 },

  ctaBanner: { backgroundColor: '#111827', borderRadius: 18, overflow: 'hidden', marginBottom: 20, position: 'relative' },
  ctaBannerMobile: { borderRadius: 14 },
  ctaBannerImg: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
  ctaOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,20,0.5)' },
  ctaContent:       { padding: 36, alignItems: 'center' },
  ctaContentMobile: { padding: 20 },
  ctaBadgeWrap:    { marginBottom: 14 },
  ctaBadge:        { color: '#fff', backgroundColor: '#f97316', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 8, fontSize: 13, fontWeight: '700', overflow: 'hidden' },
  ctaBadgeMobile:  { fontSize: 12, paddingHorizontal: 14, paddingVertical: 6 },
  ctaTitle:        { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 12, lineHeight: 30 },
  ctaTitleMobile:  { fontSize: 16, lineHeight: 22, marginBottom: 8 },
  ctaDesc:         { color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  ctaDescMobile:   { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  ctaButtons:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  ctaButtonsMobile: { flexDirection: 'column', width: '100%' },
  ctaBtn1:          { backgroundColor: '#f97316', borderRadius: 24, paddingHorizontal: 22, paddingVertical: 12 },
  ctaBtn1Gap:       { marginRight: 12 },
  ctaBtn1Text:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  ctaBtn2:          { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, paddingHorizontal: 22, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  ctaBtn2Text:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  ctaBtnMobile:     { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  ctaBtnTextMobile: { fontSize: 13 },

  contactStrip:       { backgroundColor: '#fff7ed', borderRadius: 16, borderWidth: 1, borderColor: '#fed7aa', padding: 20, marginBottom: 32, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  contactStripMobile: { flexDirection: 'column', alignItems: 'flex-start', padding: 16 },
  contactStripLeft:       { flex: 1, minWidth: 180, marginRight: 16 },
  contactStripLeftMobile: { flex: 0, width: '100%', marginRight: 0, marginBottom: 14 },
  contactStripTitle:       { fontSize: 17, fontWeight: '900', color: '#111827', marginBottom: 4 },
  contactStripTitleMobile: { fontSize: 15 },
  contactStripSub:         { color: '#6b7280', fontSize: 13 },
  contactStripSubMobile:   { fontSize: 12 },
  contactBtns:       { flexDirection: 'row', flexWrap: 'wrap' },
  contactBtnsMobile: { flexDirection: 'column', width: '100%' },
  contactBtn1:           { borderWidth: 1.5, borderColor: '#f97316', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#fff' },
  contactBtn1Gap:        { marginRight: 10 },
  contactBtn1Text:       { color: '#ea580c', fontWeight: '700', fontSize: 13 },
  contactBtn2:           { backgroundColor: '#f97316', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10 },
  contactBtn2Text:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  contactBtnFullMobile:  { borderRadius: 12, paddingVertical: 12, alignItems: 'center', width: '100%', marginBottom: 10 },
  contactBtnTextMobile:  { fontSize: 13 },
});
