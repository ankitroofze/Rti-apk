import React, { useCallback, useState } from 'react';
import {
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
import { getQuizResultTier } from '../utils/quizResultLogic';

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
  if (!getQuizResultTier(item.percentage).passed) {
    showToast('Certificate only available for passed exams.', 'error');
    return;
  }
  navigation.navigate('CertificatePreview', {
    result: {
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

  const canDownload = (item) => (item.result_type || '').toLowerCase() === 'pass';

  return (
    <View style={[CertificationStyles.root]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      {/* Back Header */}
      <TouchableOpacity
        style={CertificationStyles.backRow}
        onPress={() => navigation.goBack()}
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
          <Text style={CertificationStyles.heroTitle}>My Attempts</Text>
        </View>

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
                    Type: <Text style={CertificationStyles.scoreBold}>{TYPE_LABEL[item.quiz_type] || item.quiz_type || '—'}</Text>
                  </Text>
                </View>

                {(item.percentage !== undefined && item.percentage !== null) && (
                  <View style={CertificationStyles.scoreRow}>
                    <Feather name="bar-chart-2" size={15} color="#F97316" />
                    <Text style={CertificationStyles.scoreText}>
                      Score: <Text style={CertificationStyles.scoreBold}>
                        {item.obtained_marks ?? 0}/{item.total_marks ?? 0} ({item.percentage}%)
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
              Aapne abhi tak koi quiz attempt nahi kiya hai.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
