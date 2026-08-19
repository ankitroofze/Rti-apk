import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import QuizResultStyles from '../styles/QuizResultStyles';

export default function QuizResultScreen({ navigation, route }) {
  const { showToast } = useToast();
  
  const { result } = route.params || {};
console.log('QUIZ RESULT DATA:', JSON.stringify(result));
  const [downloading, setDownloading] = useState(false);
  const [savedPath, setSavedPath] = useState('');

 const isPass = (result?.percentage ?? 0) >= 50;
  // Certificate sirf Exam test type ke liye hi valid hai.
  // ✅ FIX: case/whitespace-insensitive compare — backend "Exam"/" exam" jaisa bhi
  // bhej sakta hai, strict '===' pehle certificate ko silently hide kar deta tha.
  const isExamResult = String(result?.quiz_type || '').trim().toLowerCase() === 'exam';

  // Note: certificate view/download ke liye ab koi subscription check nahi hai —
  // subscription sirf quiz *attempt* karne ke liye zaroori hai. Pass hone ke baad
  // certificate dekhna/download karna hamesha free hai.
  const handleViewCertificate = () => {
    navigation.navigate('CertificatePreview', { result });
  };

 const handleDownload = async () => {
    if (!isPass || !isExamResult) {
      showToast('Certificate only available for passed Exam attempts.', 'error');
      return;
    }

    if (Platform.OS === 'web') {
      navigation.navigate('CertificatePreview', { result });
      return;
    }

    setDownloading(true);

    try {
      const downloadResult = await UserStore.downloadCertificateForAttempt(result || {});
      if (!downloadResult.ok) {
        showToast(downloadResult.message || 'Failed to save certificate.', 'error');
        return;
      }

      setSavedPath(downloadResult.savedPath || '');
      showToast('Certificate saved to your device!', 'success');
    } catch (error) {
      console.error('Certificate download error:', error);
      showToast('Failed to save certificate. Try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const CertificateCard = () => (
    <View collapsable={false} style={QuizResultStyles.certOuter}>
      <View style={QuizResultStyles.certFrame}>
        <View style={QuizResultStyles.certHeaderBand}>
          <Text style={QuizResultStyles.certHeaderText}>RTI NEWS</Text>
          <Text style={QuizResultStyles.certHeaderSub}>Official Certificate</Text>
        </View>

        <View style={QuizResultStyles.certSealRow}>
          <View style={QuizResultStyles.certSeal}>
            <Feather name="award" size={32} color="#b45309" />
          </View>
        </View>

        <Text style={QuizResultStyles.certTitle}>Certificate of Achievement</Text>
        <Text style={QuizResultStyles.certPresented}>This is to certify that</Text>

        <Text style={QuizResultStyles.certName}>
          {result?.user_name || 'Participant'}
        </Text>

        <View style={QuizResultStyles.certDivider} />

        <Text style={QuizResultStyles.certBody}>
          has successfully completed the examination
        </Text>
        <Text style={QuizResultStyles.certQuizTitle}>
          {result?.quiz_title || 'Quiz Examination'}
        </Text>

        <View style={QuizResultStyles.certScoreRow}>
          <View style={QuizResultStyles.certScoreBox}>
            <Text style={QuizResultStyles.certScoreLabel}>Score</Text>
            <Text style={QuizResultStyles.certScoreValue}>{result?.obtained_marks ?? 0}/{result?.total_marks ?? 0}</Text>
          </View>
          <View style={QuizResultStyles.certScoreBox}>
            <Text style={QuizResultStyles.certScoreLabel}>Result</Text>
            <Text style={QuizResultStyles.certScoreValuePass}>
              {isPass ? 'PASS' : 'FAIL'}
            </Text>
          </View>
          <View style={QuizResultStyles.certScoreBox}>
            <Text style={QuizResultStyles.certScoreLabel}>Date</Text>
            <Text style={QuizResultStyles.certScoreValue}>
              {result?.date || new Date().toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={QuizResultStyles.certDivider} />

        <View style={QuizResultStyles.certFooterRow}>
          <View style={QuizResultStyles.certSignatureBox}>
            <View style={QuizResultStyles.certSignatureLine} />
            <Text style={QuizResultStyles.certSignatureLabel}>Authorized Signatory</Text>
          </View>
          <View style={QuizResultStyles.certStampBox}>
            <View style={QuizResultStyles.certStamp}>
              <Text style={QuizResultStyles.certStampText}>OK</Text>
            </View>
            <Text style={QuizResultStyles.certSignatureLabel}>Official Seal</Text>
          </View>
        </View>

        <Text style={QuizResultStyles.certFooterNote}>
          {result?.certificate_number || 'RTI News Verified Certificate'} | {new Date().getFullYear()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={QuizResultStyles.root}>
      {/* Custom Header with Back Button */}
      <View style={QuizResultStyles.customHeader}>
        <TouchableOpacity
          style={QuizResultStyles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#F97316" />
        </TouchableOpacity>
        <Text style={QuizResultStyles.headerTitle}>Quiz Result</Text>
        <View style={QuizResultStyles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={QuizResultStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={QuizResultStyles.heroCard}>
          <Text style={QuizResultStyles.heroEyebrow}>Result</Text>
          <Text style={QuizResultStyles.heroTitle}>{result?.quiz_title || 'Quiz Result'}</Text>
        </View>

        {/* Result Badge */}
        <View style={QuizResultStyles.resultCard}>
          <View style={[QuizResultStyles.resultBadge, isPass ? QuizResultStyles.passBadge : QuizResultStyles.failBadge]}>
            <Feather
              name={isPass ? 'check-circle' : 'x-circle'}
              size={28}
              color={isPass ? '#16a34a' : '#F97316'}
            />
            <Text style={[QuizResultStyles.resultText, isPass ? QuizResultStyles.passText : QuizResultStyles.failText]}>
              {isPass ? 'Pass' : 'Fail'}
            </Text>
          </View>

          <View style={QuizResultStyles.infoRow}>
            <Text style={QuizResultStyles.infoLabel}>Score</Text>
            <Text style={QuizResultStyles.infoValue}>{result?.obtained_marks ?? 0}/{result?.total_marks ?? 0} ({result?.percentage ?? 0}%)</Text>
          </View>
          <View style={QuizResultStyles.infoRow}>
            <Text style={QuizResultStyles.infoLabel}>Status</Text>
            <Text style={isPass ? QuizResultStyles.infoValuePass : QuizResultStyles.infoValueFail}>
              {isPass ? 'Passed' : 'Failed'}
            </Text>
          </View>
        </View>

    {isPass && isExamResult ? (
          <>
            <Text style={QuizResultStyles.certSectionLabel}>Your Certificate</Text>
            <CertificateCard />

            <TouchableOpacity
              style={QuizResultStyles.downloadBtn}
              onPress={handleViewCertificate}
            >
              <Feather name="eye" size={18} color="#fff" />
              <Text style={QuizResultStyles.downloadBtnText}>View Certificate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[QuizResultStyles.downloadBtn, downloading && QuizResultStyles.downloadBtnDisabled]}
              onPress={handleDownload}
              disabled={downloading}
            >
              <Feather name="download" size={18} color="#fff" />
              <Text style={QuizResultStyles.downloadBtnText}>
                {downloading ? 'Saving...' : 'Download Certificate'}
              </Text>
            </TouchableOpacity>

            {savedPath ? (
              <Text style={QuizResultStyles.savedNote}>
                Saved locally: {savedPath.split('/').pop()}
              </Text>
            ) : null}
          </>
      ) : (
          <View style={QuizResultStyles.failMessageBox}>
            <Feather name="info" size={16} color="#F97316" />
            <Text style={QuizResultStyles.failMessageText}>
              {isPass
                ? 'Certificate sirf Exam type ke liye issue hota hai. Practice/Training me certificate nahi milta.'
                : 'Certificate is only issued for passing scores. Please retake the exam.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}