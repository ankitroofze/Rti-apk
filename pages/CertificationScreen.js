import { smartGoBack } from '../utils/smartBack';
import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
    StatusBar,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, useBusy } from '../components/ui/ToastProvider';
import Text from '../components/RobotoText';
import CertificationStyles from '../styles/CertificationStyles';
import { UserStore } from '../store/UserStore';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
// Compact "input-style" dropdown — click to open a small anchored menu, not a full-screen modal.
function DropdownField({ label, value, options, onChange, placeholder = 'Select', disabled = false, icon = 'chevron-down' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '800', color: '#111111', marginBottom: 8 }}>{label}</Text>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => !disabled && setOpen((o) => !o)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#EDE8E1',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: disabled ? '#F9FAFB' : '#fff',
        }}
      >
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Feather name={icon} size={14} color="#dc2626" />
        </View>
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: selected ? '#111827' : '#9CA3AF', fontSize: 13, fontWeight: '600', marginRight: 6 }}
        >
          {selected ? selected.label : placeholder}
        </Text>
        {!disabled && <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#6B7280" />}
      </TouchableOpacity>

      {open && !disabled && (
        <View
          style={{
            position: 'absolute',
            top: 66,
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            paddingVertical: 4,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
          }}
        >
          {options.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={{ paddingVertical: 9, paddingHorizontal: 14 }}
              onPress={() => { onChange(o.value); setOpen(false); }}
            >
              <Text style={{ fontSize: 13, color: o.value === value ? '#dc2626' : '#374151', fontWeight: o.value === value ? '700' : '500' }}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CertificationScreen({ navigation }) {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
const [loading, setLoading] = useState(false);
useBusy(loading);
  const [certData, setCertData] = useState({
    currentUser:    null,
    items:          [],
    totalAttempts:  0,
    passedCount:    0,
    totalDownloads: 0,
  });
const SUBJECTS = [
  { label: 'RTI', value: 'rti' },
  { label: 'BNS', value: 'bns' },
  { label: 'Journalism', value: 'journalism' },
];
const TEST_TYPES = [
  { label: 'Practice', value: 'practice' },
  { label: 'Training', value: 'training' },
  { label: 'Exam', value: 'exam' },
];
const DIFFICULTIES = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];
const [subject, setSubject] = useState(null);
const [testType, setTestType] = useState(null);
const [difficulty, setDifficulty] = useState(null);
 const loadCertification = useCallback(async () => {
    // Subject/Test Type select na ho tab bhi fetch hoga — getCertificationSummary
    // subject/testType undefined hone par practice+training+exam teeno APIs ko
    // bina filter ke call karta hai, isliye poore records (sab attempts) mil jaate hain.
    setLoading(true);
    // Difficulty only makes sense for Practice — don't send it for Training/Exam.
    const data = await UserStore.getCertificationSummary(subject, testType, testType === 'practice' ? difficulty : undefined);
    setLoading(false);
    if (!data) { navigation.replace('Login'); return; }
    if (data.authExpired) {
      showToast('Token expired. Please login again.', 'error');
      navigation.replace('Login');
      return;
    }
    setCertData(data);
  }, [navigation, subject, testType, difficulty]);

  // null = no tracked quiz-subscription count (legacy/unlimited-till-expiry or never subscribed).
  const quizAttemptsLeft = certData.currentUser?.quiz_subscription_total_count != null
    ? UserStore.getQuizSubscriptionRemainingCount(certData.currentUser)
    : null;

  // Har filter change par aur jab bhi screen focus me aaye (Back se QuickMenu se wapas
  // aane par bhi) records fetch honge — filter chuna ho ya nahi.
   useEffect(() => { loadCertification(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { loadCertification(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  const promptSubscriptionRequired = useCallback(() => {
    Alert.alert(
      'Subscription Required',
     'A subscription is required to view or download the certificate.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Subscription', onPress: () => navigation.navigate('Subscription Plans') },
      ]
    );
  }, [navigation]);
const handleAttemptQuiz = useCallback((item) => {
    // Result already record ho chuka hai (Pass ya Fail dono) — dobara attempt allowed nahi,
    // naya attempt lene ke liye user ko dobara subscription/quiz-count lena hoga.
    if (item.result_type) {
   showToast('You have already attempted this quiz.', 'error');
      return;
    }
    // Listing API only returns quiz metadata — questions come later from /quiz/start
    if (!subject) {
      showToast('Please choose a subject first.', 'error');
      return;
    }

    // Check if user has active QUIZ subscription
    const hasQuizSub = UserStore.hasActiveQuizSubscription(certData.currentUser);
    if (!hasQuizSub) {
      // Send user to Quiz Subscription screen, pass quiz item so it can redirect back after payment
      navigation.navigate('QuizSubscription', {
        quizItem: item,
        subject,
        difficulty: item.quiz_type === 'practice' ? difficulty : undefined,
      });
      return;
    }

    // Difficulty travels with the attempt only for Practice quizzes.
    const attemptDifficulty = item.quiz_type === 'practice' ? difficulty : undefined;
    if (item.quiz_type === 'practice' && !attemptDifficulty) {
      showToast('Please choose a difficulty first.', 'error');
      return;
    }

    navigation.navigate('AttemptQuiz', { quiz: item, subject, difficulty: attemptDifficulty });
  }, [certData.currentUser, navigation, showToast, subject, difficulty]);
  // ────────────────────────────────────────────────────────────────────────────

  const handleViewResult = (item) => {
    if (!item.score && item.score !== 0) {
      showToast('No result available. Attempt the quiz first.', 'error');
      return;
    }
   navigation.navigate('QuizResult', {
      result: {
        id:                     item.id,
        quiz_title:             item.quiz_title,
        quiz_type:              item.quiz_type,
        percentage:             item.score,
        total_questions:        item.total_questions,
        correct_answers:        item.correct_answers,
        result_type:            item.result_type,
        certificate_file:       item.certificate_file,
        local_certificate_path: item.local_certificate_path,
        certificate_number:     item.certificate_number,
        user_name:              item.user_name,
        date:                   item.issued_at
          ? new Date(item.issued_at).toLocaleDateString('en-IN')
          : undefined,
      },
    });
  };

 const handleDownload = async (item) => {
    if (item.quiz_type !== 'exam') {
     showToast('Certificate is only available for Exam type quizzes.', 'error');
      return;
    }
    // if (!item.certificate_file) {
    //   showToast('Certificate not available yet.', 'error');
    //   return;
    // }
   const result = await UserStore.downloadCertificateForAttempt(item);
    if (!result.ok) {
      showToast(result.message || 'Download failed.', 'error');
      return;
    }
    showToast(
      result.savedPath ? 'Certificate downloaded and saved locally.' : 'Certificate downloaded successfully.',
      'success'
    );
    loadCertification();
  };

  const resultColor = (result_type) =>
    result_type?.toLowerCase() === 'pass'
      ? CertificationStyles.passText
      : CertificationStyles.failText;

  const resultBadgeStyle = (result_type) =>
    result_type?.toLowerCase() === 'pass'
      ? CertificationStyles.passBadge
      : CertificationStyles.retryBadge;

   return (
    <View style={[CertificationStyles.root]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
{Platform.OS === 'web' ? (
  /* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */
  <ModuleWebHeader title="Certification" navigation={navigation} />
) : (
(Platform.OS === 'android' || Platform.OS === 'ios') ? (
<ModuleAndroidHeader title="Certification" onBack={() => smartGoBack(navigation, 'QuickMenu')} />
) : (
<View
  style={{
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: insets.top + 8,
  }}
>
  <Image
    source={require('../assets/images/profile-red.png')}
    resizeMode="cover"
    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
  />
  <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
    <Ionicons name="chevron-back" size={24} color="#ffffff" />
  </TouchableOpacity>
  <Text style={{ fontSize: 15, color: '#fff', fontFamily: 'Roboto_400Regular' }}>Certification</Text>
</View>
)
)}
      <ScrollView
        style={CertificationStyles.scrollView}
        contentContainerStyle={[
          CertificationStyles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
                   {/* Hero */}
        <View
          style={{
            width: '100%',
            maxWidth: 1100,
            alignSelf: 'center',
            borderRadius: 12,
            padding: 22,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '#7f1d1d',
          }}
        >
          {/* <Image
            source={require('../assets/images/profile-red.png')}
            resizeMode="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', borderRadius: 12 }}
          /> */}
          <View style={{ width: 54, height: 54, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Feather name="award" size={28} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textTransform: 'uppercase' }}>RTI Certification</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>My Certifications</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>Manage your certifications, track progress and download your records.</Text>
          </View>
          <Feather name="file-text" size={64} color="rgba(255,255,255,0.15)" style={{ marginLeft: 10 }} />
        </View>

                     {/* My Attempts + Quiz Subscription */}
        <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center', flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF5F5', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 14 }}
            onPress={() => navigation.navigate('MyAttempts')}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
              <Feather name="list" size={14} color="#dc2626" />
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#dc2626' }} numberOfLines={1}>My Attempts</Text>
            </View>
            <Feather name="chevron-right" size={14} color="#dc2626" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF5F5', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 14 }}
            onPress={() => navigation.navigate('My Quiz Subscription')}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
              <Feather name="external-link" size={14} color="#dc2626" />
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#dc2626' }} numberOfLines={1}>Quiz Subscription</Text>
            </View>
            <Feather name="chevron-right" size={14} color="#dc2626" />
          </TouchableOpacity>
        </View>
                    {/* Metrics */}
        <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center', flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDF3F3', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10, overflow: 'hidden' }}>
            <View style={{ width: Platform.OS === 'web' ? 36 : 32, height: Platform.OS === 'web' ? 36 : 32, borderRadius: Platform.OS === 'web' ? 18 : 16, backgroundColor: '#FBC7C7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Feather name="file-text" size={Platform.OS === 'web' ? 16 : 14} color="#dc2626" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111111' }}>{certData.totalAttempts}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.3 }} numberOfLines={1}>Attempts</Text>
            </View>
          </View>

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1FAF4', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10, overflow: 'hidden' }}>
            <View style={{ width: Platform.OS === 'web' ? 36 : 32, height: Platform.OS === 'web' ? 36 : 32, borderRadius: Platform.OS === 'web' ? 18 : 16, backgroundColor: '#A7E3BE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Feather name="check" size={Platform.OS === 'web' ? 16 : 14} color="#15803D" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111111' }}>{certData.passedCount}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.3 }} numberOfLines={1}>Passed</Text>
            </View>
          </View>

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F6FE', borderWidth: 1, borderColor: '#EDE8E1', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10, overflow: 'hidden' }}>
            <View style={{ width: Platform.OS === 'web' ? 36 : 32, height: Platform.OS === 'web' ? 36 : 32, borderRadius: Platform.OS === 'web' ? 18 : 16, backgroundColor: '#AFC9F5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Feather name="download" size={Platform.OS === 'web' ? 16 : 14} color="#1D4ED8" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111111' }}>{certData.totalDownloads}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.3 }} numberOfLines={1}>Downloads</Text>
            </View>
          </View>
        </View>

        {/* Quiz subscription remaining attempts — only shown when a count is being tracked */}
        {quizAttemptsLeft !== null && (
          <View style={[CertificationStyles.card, { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <Feather name={quizAttemptsLeft > 0 ? 'zap' : 'alert-circle'} size={16} color={quizAttemptsLeft > 0 ? '#16a34a' : '#F97316'} />
            <Text style={{ fontSize: 12.5, color: '#374151', fontWeight: '500', flex: 1 }}>
              {quizAttemptsLeft > 0
                ? `${quizAttemptsLeft} quiz attempt${quizAttemptsLeft === 1 ? '' : 's'} remaining on your quiz subscription.`
                : `Your quiz subscription attempts are used up. Buy a new plan to attempt more quizzes.`}
            </Text>
          </View>
        )}

          {/* Subject + Test Type + Difficulty */}
              <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#EDE8E1', padding: 20, marginBottom: 16, zIndex: 20, elevation: Platform.OS === 'android' ? 20 : 0 }}>
                   <View style={{ flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 16, zIndex: 30, elevation: Platform.OS === 'android' ? 20 : 0 }}>
            <DropdownField
              label="Subject"
              value={subject}
              options={SUBJECTS}
              onChange={setSubject}
              placeholder="Choose"
              icon="book-open"
            />

            <DropdownField
              label="Test Type"
              value={testType}
              options={TEST_TYPES}
              onChange={(v) => { setTestType(v); if (v !== 'practice') setDifficulty(null); }}
              placeholder="Choose"
              icon="file-text"
            />

            <DropdownField
              label="Difficulty"
              value={difficulty}
              options={DIFFICULTIES}
              onChange={setDifficulty}
              placeholder={testType === 'practice' ? 'Choose' : 'N/A'}
              disabled={testType !== 'practice'}
              icon="activity"
            />
          </View>

          <TouchableOpacity onPress={loadCertification} activeOpacity={0.8} style={{ marginTop: 18, zIndex: 1, elevation: 0 }}>
            <LinearGradient
              colors={['#7f1d1d', '#ef4444', '#7f1d1d']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Feather name="send" size={15} color="#ffffff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Submit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
            {/* Records */}
                <View style={{
          width: '100%', maxWidth: 1100, alignSelf: 'center',
          backgroundColor: '#ffffff', borderRadius: 14, padding: 20,
          borderTopWidth: 3, borderTopColor: '#dc2626',
          borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#EDE8E1',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="award" size={16} color="#dc2626" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111111' }}>Certification Records</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => navigation.navigate('MyAttempts')}>
              <Feather name="external-link" size={13} color="#dc2626" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>View All</Text>
              <Feather name="chevron-right" size={13} color="#dc2626" />
            </TouchableOpacity>
          </View>

{loading ? (
            <Text style={CertificationStyles.loadingText}>Loading certification records...</Text>
          ) : certData.items.length ? (
            certData.items.map((item) => (
              <View key={item.id} style={CertificationStyles.certCard}>

                {/* Title + Badge */}
                <View style={CertificationStyles.certTopRow}>
                  <Text style={CertificationStyles.certTitle} numberOfLines={2}>
                    {item.quiz_title || `Quiz #${item.id}`}
                  </Text>
                  {item.result_type ? (
                    <View style={[CertificationStyles.resultBadge, resultBadgeStyle(item.result_type)]}>
                      <Text style={[CertificationStyles.resultBadgeText, resultColor(item.result_type)]}>
                        {item.result_type}
                      </Text>
                    </View>
                  ) : (
                    <View style={CertificationStyles.pendingBadge}>
                      <Text style={CertificationStyles.pendingBadgeText}>Not Attempted</Text>
                    </View>
                  )}
                </View>

                {/* Score */}
                {item.score !== undefined && item.score !== null && (
                  <View style={CertificationStyles.scoreRow}>
                    <Feather name="bar-chart-2" size={15} color="#F97316" />
                    <Text style={CertificationStyles.scoreText}>
                      Score: <Text style={CertificationStyles.scoreBold}>{item.score}</Text>
                    </Text>
                  </View>
                )}

                {/* Certificate pill */}
                {item.certificate_file ? (
                  <View style={CertificationStyles.certFileRow}>
                    <Feather name="file-text" size={13} color="#16a34a" />
                    <Text style={CertificationStyles.certFileText}>Certificate available</Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
               <View style={CertificationStyles.actionRow}>
                  <TouchableOpacity
                    style={
                      item.result_type
                        ? [CertificationStyles.actionBtn, CertificationStyles.actionBtnDisabled]
                        : CertificationStyles.actionBtn
                    }
                    onPress={() => handleAttemptQuiz(item)}
                    disabled={!!item.result_type}
                    activeOpacity={0.75}
                  >
                    <Feather name="play-circle" size={14} color={item.result_type ? '#9CA3AF' : '#F97316'} />
                    <Text style={item.result_type ? CertificationStyles.actionBtnTextDisabled : CertificationStyles.actionBtnText}>
                      Attempt Quiz
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={CertificationStyles.actionBtn}
                    onPress={() => handleViewResult(item)}
                    activeOpacity={0.75}
                  >
                    <Feather name="eye" size={14} color="#F97316" />
                    <Text style={CertificationStyles.actionBtnText}>View Result</Text>
                  </TouchableOpacity>

               <TouchableOpacity
                    style={
                      (item.quiz_type === 'exam' && item.result_type?.toLowerCase() === 'pass')
                        ? CertificationStyles.actionBtnGreen
                        : [CertificationStyles.actionBtn, CertificationStyles.actionBtnDisabled]
                    }
                    onPress={() => handleDownload(item)}
                    disabled={!(item.quiz_type === 'exam' && item.result_type?.toLowerCase() === 'pass')}
                    activeOpacity={0.75}
                  >
                    <Feather
                      name="download"
                      size={14}
                      color={(item.quiz_type === 'exam' && item.result_type?.toLowerCase() === 'pass') ? '#16a34a' : '#9CA3AF'}
                    />
                    <Text
                      style={
                        (item.quiz_type === 'exam' && item.result_type?.toLowerCase() === 'pass')
                          ? CertificationStyles.actionBtnTextGreen
                          : CertificationStyles.actionBtnTextDisabled
                      }
                    >
                      Download
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
                ) : (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Feather name="file-text" size={26} color="#dc2626" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111111', marginBottom: 4 }}>No certification records found.</Text>
              <Text style={{ fontSize: 13, color: '#888888' }}>Complete a test to see your certification records here.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}