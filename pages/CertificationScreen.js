import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../components/ui/ToastProvider';
import CertificationStyles from '../styles/CertificationStyles';
import { UserStore } from '../store/UserStore';

// Compact "input-style" dropdown — click to open a small anchored menu, not a full-screen modal.
function DropdownField({ label, value, options, onChange, placeholder = 'Select', disabled = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[CertificationStyles.sectionTitle, { textAlign: 'center', marginBottom: 8 }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => !disabled && setOpen((o) => !o)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
     minWidth: Platform.OS === 'web' ? 160 : 108,
          backgroundColor: disabled ? '#F9FAFB' : '#fff',
        }}
      >
        <Text
          numberOfLines={1}
          style={{ color: selected ? '#111827' : '#9CA3AF', fontSize: 13, fontWeight: '600', marginRight: 6 }}
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
            zIndex: 30,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
            minWidth: 120,
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
              <Text style={{ fontSize: 13, color: o.value === value ? '#F97316' : '#374151', fontWeight: o.value === value ? '700' : '500' }}>
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
  useEffect(() => { loadCertification(); }, [loadCertification]);
  useFocusEffect(useCallback(() => { loadCertification(); }, [loadCertification]));

  const promptSubscriptionRequired = useCallback(() => {
    Alert.alert(
      'Subscription Required',
      'Certificate dekhne ya download karne ke liye subscription lena zaroori hai.',
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
      showToast('Is quiz ka attempt already ho chuka hai.', 'error');
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
      showToast('Certificate sirf Exam type ke liye milta hai.', 'error');
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
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      {/* Back Header */}
      <TouchableOpacity
        style={CertificationStyles.backRow}
        onPress={() => navigation.navigate('QuickMenu')}
        activeOpacity={0.75}
      >
        <Feather name="arrow-left" size={20} color="#F97316" />
        <Text style={CertificationStyles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={CertificationStyles.scrollView}
        contentContainerStyle={[
          CertificationStyles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
       {/* Hero */}
        <View style={CertificationStyles.heroCard}>
          <Text style={CertificationStyles.heroEyebrow}>RTI Certification</Text>
          <Text style={CertificationStyles.heroTitle}>My Certifications</Text>
        </View>

     {/* My Attempts + My Subscriptions — horizontal row, 90% width */}
        <View style={CertificationStyles.topButtonRow}>
          <TouchableOpacity
            style={CertificationStyles.topButton}
            onPress={() => navigation.navigate('MyAttempts')}
            activeOpacity={0.75}
          >
            <Feather name="list" size={14} color="#F97316" />
            <Text style={CertificationStyles.actionBtnText}>My Attempts</Text>
          </TouchableOpacity>

        <TouchableOpacity
            style={CertificationStyles.topButton}
            onPress={() => navigation.navigate('My Quiz Subscription')}
            activeOpacity={0.75}
          >
            <Feather name="check-square" size={14} color="#F97316" />
            <Text style={CertificationStyles.actionBtnText}>Quiz Subscription</Text>
          </TouchableOpacity>
        </View>
        {/* Metrics */}
        <View style={CertificationStyles.metricsRow}>
          <View style={[CertificationStyles.metricCard, CertificationStyles.metricPrimary]}>
            <Text style={CertificationStyles.metricValue}>{certData.totalAttempts}</Text>
            <Text style={CertificationStyles.metricLabel}>Attempts</Text>
          </View>
          <View style={[CertificationStyles.metricCard, CertificationStyles.metricSecondary]}>
            <Text style={CertificationStyles.metricValue}>{certData.passedCount}</Text>
            <Text style={CertificationStyles.metricLabel}>Passed</Text>
          </View>
          <View style={[CertificationStyles.metricCard, CertificationStyles.metricAccent]}>
            <Text style={CertificationStyles.metricValue}>{certData.totalDownloads}</Text>
            <Text style={CertificationStyles.metricLabel}>Downloads</Text>
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
        <View style={[CertificationStyles.card, { zIndex: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <DropdownField
              label="Subject"
              value={subject}
              options={SUBJECTS}
              onChange={setSubject}
              placeholder="Choose"
            />

            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: '#E5E7EB', marginHorizontal: 16 }} />

            <DropdownField
              label="Test Type"
              value={testType}
              options={TEST_TYPES}
              onChange={(v) => { setTestType(v); if (v !== 'practice') setDifficulty(null); }}
              placeholder="Choose"
            />

            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: '#E5E7EB', marginHorizontal: 16 }} />

            <DropdownField
              label="Difficulty"
              value={difficulty}
              options={DIFFICULTIES}
              onChange={setDifficulty}
              placeholder={testType === 'practice' ? 'Choose' : 'N/A'}
              disabled={testType !== 'practice'}
            />
          </View>
        </View>

        {/* Records */}
        <View style={CertificationStyles.card}>
          <Text style={CertificationStyles.sectionTitle}>Certification Records</Text>

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
            <Text style={CertificationStyles.emptyText}>No certification records found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}