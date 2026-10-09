import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import ModuleWebHeader from '../components/Modulewebheader';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, useBusy } from '../components/ui/ToastProvider';
import CertificationStyles from '../styles/CertificationStyles';
import { UserStore } from '../store/UserStore';
import { getQuizResultTier, getScoreText } from '../utils/quizResultLogic';

const TYPE_LABEL = {
  practice: 'Practice',
  training: 'Training',
  exam:     'Exam',
};

export default function MyAttemptsScreen({ navigation }) {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
   const [attempts, setAttempts] = useState([]);
  useBusy(loading);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    // Real backend attempt history — GET /quiz/history?user_id=...
    const data = await UserStore.getQuizHistory();
    setLoading(false);
    if (!data) { navigation.replace('Login'); return; }
    if (data.authExpired) {
      showToast('Token expired. Please login again.', 'error');
      navigation.replace('Login');
      return;
    }
    setAttempts(data.items || []);
  }, [navigation, showToast]);

  useFocusEffect(useCallback(() => { loadAttempts(); }, [loadAttempts]));

  const handleViewResult = (item) => {
    navigation.navigate('QuizResult', {
      result: {
        id:                     item.id,
        quiz_title:             item.quiz_title,
        quiz_type:              item.quiz_type,
        percentage:             item.percentage,
        obtained_marks:         item.obtained_marks,
        total_marks:            item.total_marks,
        correct_answers:        item.correct_answers,
        wrong_answers:          item.wrong_answers,
        total_questions:        item.total_questions,
        score:                  item.score,
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
const handleDownload = (item) => {
  // Certificate sirf Exam type + Pass ke liye. Practice/Training me nahi milta.
  if (String(item.quiz_type || '').trim().toLowerCase() !== 'exam') {
  showToast('Certificate is available only for Exam attempts, not for Practice or Training.', 'error');
    return;
  }
  if (!getQuizResultTier(item.percentage).passed) {
    showToast('Certificate only available for passed exams.', 'error');
    return;
  }
  navigation.navigate('CertificatePreview', {
    result: {
      quiz_type: item.quiz_type,
      quiz_title: item.quiz_title,
      percentage: item.percentage,
      user_name: item.user_name,
      date: item.issued_at
        ? new Date(item.issued_at).toLocaleDateString('en-IN')
        : undefined,
    },
  });
};
  const resultColor = (result_type) =>
    result_type?.toLowerCase() === 'pass'
      ? CertificationStyles.passText
      : CertificationStyles.failText;

  const resultBadgeStyle = (result_type) =>
    result_type?.toLowerCase() === 'pass'
      ? CertificationStyles.passBadge
      : CertificationStyles.retryBadge;

  // Certificate: sirf Exam type + Pass. Pehle sirf pass check hota tha, isliye
  // Practice/Training pass hone par bhi Download button chalu ho jata tha.
  const isExamAttempt = (item) => String(item.quiz_type || '').trim().toLowerCase() === 'exam';
  const canDownload = (item) => isExamAttempt(item) && getQuizResultTier(item.percentage).passed;

  return (
    <View style={[CertificationStyles.root]}>
         <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {Platform.OS === 'web' ? (
        <ModuleWebHeader title="My Attempts" navigation={navigation} />
      ) : (
        Platform.OS === 'android' ? (
<ModuleAndroidHeader title="My Attempts" onBack={() => navigation.goBack()} />
) : (
<View
          style={{
            width: '100%',
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, color: '#fff', fontFamily: 'Roboto_400Regular' }}>My Attempts</Text>
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
              <ImageBackground
          source={require('../assets/images/profile-red.png')}
          resizeMode="cover"
          imageStyle={{ borderRadius: 12 }}
          style={[CertificationStyles.heroCard, { backgroundColor: '#b91c1c', overflow: 'hidden' }]}
        >
          <Text style={[CertificationStyles.heroEyebrow, { color: 'rgba(255,255,255,0.85)' }]}>RTI Certification</Text>
          <Text style={[CertificationStyles.heroTitle, { color: '#ffffff' }]}>My Attempts</Text>
        </ImageBackground>

        {/* List */}
        <View style={CertificationStyles.card}>
          <Text style={CertificationStyles.sectionTitle}>All Quiz Attempts</Text>

          {loading ? (
            <Text style={CertificationStyles.loadingText}>Loading your attempts...</Text>
          ) : attempts.length ? (
            attempts.map((item) => (
              <View key={item.id} style={CertificationStyles.certCard}>

                {/* Title + Badge */}
                <View style={CertificationStyles.certTopRow}>
                  <Text style={CertificationStyles.certTitle} numberOfLines={2}>
                    {item.quiz_title || `Quiz #${item.id}`}
                  </Text>
                  <View style={[CertificationStyles.resultBadge, resultBadgeStyle(item.result_type)]}>
                    <Text style={[CertificationStyles.resultBadgeText, resultColor(item.result_type)]}>
                      {item.result_type}
                    </Text>
                  </View>
                </View>

                {/* Type + Score */}
                <View style={CertificationStyles.scoreRow}>
                  <Feather name="tag" size={13} color="#F97316" />
                  <Text style={CertificationStyles.scoreText}>
                    Type: <Text style={CertificationStyles.scoreBold}>{TYPE_LABEL[String(item.quiz_type || '').trim().toLowerCase()] || item.quiz_type || '—'}</Text>
                  </Text>
                </View>

                {(item.percentage !== undefined && item.percentage !== null) && (
                  <View style={CertificationStyles.scoreRow}>
                    <Feather name="bar-chart-2" size={15} color="#F97316" />
                    <Text style={CertificationStyles.scoreText}>
                      Score: <Text style={CertificationStyles.scoreBold}>
                       {getScoreText(item).full}
                      </Text>
                    </Text>
                  </View>
                )}

                {item.issued_at ? (
                  <View style={CertificationStyles.scoreRow}>
                    <Feather name="calendar" size={13} color="#F97316" />
                    <Text style={CertificationStyles.scoreText}>
                      Date: <Text style={CertificationStyles.scoreBold}>
                        {new Date(item.issued_at).toLocaleDateString('en-IN')}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                {/* Certificate pill — exam + pass only */}
                {canDownload(item) ? (
                  <View style={CertificationStyles.certFileRow}>
                    <Feather name="file-text" size={13} color="#16a34a" />
                    <Text style={CertificationStyles.certFileText}>Certificate available</Text>
                  </View>
                ) : null}

                {/* Actions — Attempt Quiz hamesha blocked (already attempted).
                    Fail: sirf View Result. Pass: View Result + Download. */}
                <View style={CertificationStyles.actionRow}>
                  <TouchableOpacity
                    style={[CertificationStyles.actionBtn, CertificationStyles.actionBtnDisabled]}
                    disabled
                    activeOpacity={1}
                  >
                    <Feather name="play-circle" size={14} color="#9CA3AF" />
                    <Text style={CertificationStyles.actionBtnTextDisabled}>Attempt Quiz</Text>
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
                      canDownload(item)
                        ? CertificationStyles.actionBtnGreen
                        : [CertificationStyles.actionBtn, CertificationStyles.actionBtnDisabled]
                    }
                    onPress={() => handleDownload(item)}
                    disabled={!canDownload(item)}
                    activeOpacity={0.75}
                  >
                    <Feather
                      name="download"
                      size={14}
                      color={canDownload(item) ? '#16a34a' : '#9CA3AF'}
                    />
                    <Text
                      style={
                        canDownload(item)
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
            <Text style={CertificationStyles.emptyText}>
           You have not attempted any quiz yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}