// screens/AttemptQuizScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';
import AttemptQuizStyles from '../styles/AttemptQuizStyles';
import { getQuizResultTier } from '../utils/quizResultLogic';

const getAttemptDurationMinutes = (attempt, fallbackQuiz) => {
  const keys = ['time_in_min', 'time_in_minutes', 'duration_minutes', 'duration_min', 'timer_minutes'];
  for (const source of [attempt, attempt?.quiz, fallbackQuiz]) {
    for (const key of keys) {
      const value = Number(source?.[key]);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return 0;
};
export default function AttemptQuizScreen({ navigation, route }) {
  const { showToast } = useToast();
  const { quiz, subject, difficulty } = route.params || {};
  const [currentQIndex, setCurrentQIndex]   = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting]           = useState(false);
  const [starting, setStarting]               = useState(true);
  const [attemptId, setAttemptId]             = useState(null);
  const [questions, setQuestions]             = useState(() => quiz?.questions || []);
  const [timeLeft, setTimeLeft]               = useState(null); // seconds remaining
  const [timerDeadline, setTimerDeadline]     = useState(null);
  const submissionStartedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const beginAttempt = async () => {
const user = await UserStore.ensureUserId();
      const userId = user?.id || user?.user_id;
      const quizTypeId = quiz?.quiz_type_id || quiz?.quizTypeId || quiz?.id;
      console.log('[AttemptQuiz] userId:', userId, 'quizTypeId:', quizTypeId, 'subject:', subject, 'difficulty:', difficulty, 'quiz obj:', JSON.stringify(quiz));
if (!userId || !quizTypeId) {
        console.warn('[AttemptQuiz] Missing userId/quizTypeId — start API not called', { userId, quizTypeId, quiz });
        if (active) { setStarting(false); showToast('Quiz ID missing. Please try selecting the quiz again.', 'error'); }
        return;
      }
    const started = await AuthAPI.startQuiz({ userId, quizTypeId, subject, difficulty });
      if (!active) return;
      if (started.ok) {
        setAttemptId(started.attemptId || null);
        const minutes = getAttemptDurationMinutes(started.attempt, quiz);
        if (minutes > 0) {
          const deadline = Date.now() + (minutes * 60 * 1000);
          setTimerDeadline(deadline);
          setTimeLeft(Math.ceil((deadline - Date.now()) / 1000));
        }
        const apiQuestions = started.attempt?.questions || started.attempt?.quiz?.questions || [];
        if (Array.isArray(apiQuestions) && apiQuestions.length) {
          const LETTERS = ['A', 'B', 'C', 'D'];
          // Backend sends `option` as a plain array (["5","2","6","7"]) instead of
          // an {A,B,C,D} object — map it into the shape the UI already renders.
          const normalized = apiQuestions.map((q) => {
            if (q.options && typeof q.options === 'object') return q; // already correct shape
            const optionArray = Array.isArray(q.option) ? q.option : Array.isArray(q.options) ? q.options : [];
            const options = {};
            optionArray.forEach((text, idx) => {
              if (LETTERS[idx]) options[LETTERS[idx]] = text;
            });
            return { ...q, options };
          });
          setQuestions(normalized);
        }
      } else if (!questions.length) {
        showToast(started.message || 'Unable to start quiz.', 'error');
      }
      setStarting(false);
    };
   beginAttempt();
    return () => { active = false; };
  }, [quiz]);

  // Start countdown once quiz has loaded — backend ka time_in_min minutes me hota hai.
  useEffect(() => {
    if (starting || timerDeadline) return;
    const minutes = Number(quiz?.time_in_min) || 0;
    if (minutes > 0) setTimeLeft(minutes * 60);
  }, [starting, timerDeadline]);

  useEffect(() => {
    if (timeLeft === null || !timerDeadline) return;
    if (timeLeft <= 0) {
      submitAttempt(); // time up — auto submit jo bhi answer diya hai
      return;
    }
    const t = setTimeout(
      () => setTimeLeft(Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000))),
      250
    );
    return () => clearTimeout(t);
  }, [timeLeft, timerDeadline]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };
  const handleSelectAnswer = (option) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: option }));
  };

  const handleNext = () => {
    if (!selectedAnswers[currentQIndex]) {
      showToast('Please select an answer.', 'error');
      return;
    }
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      showToast('Yeh last question hai — Submit dabaye ya piche jaake skip kiya hua answer kare.', 'info');
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) setCurrentQIndex((prev) => prev - 1);
  };

  const submitAttempt = async () => {
    if (!questions.length) return;
    if (submissionStartedRef.current) return;
    submissionStartedRef.current = true;
    setTimerDeadline(null);
    setTimeLeft(null); // stop timer
    setSubmitting(true);
    let result;
    if (attemptId) {
      const answers = questions.map((question, index) => ({
        question_id: Number(question.id || question.question_id),
        // Backend's correct_answer is a letter (A/B/C/D) — submit the letter, not the option text.
        selected_answer: selectedAnswers[index],
      }));
     const submitted = await AuthAPI.submitQuiz({ attemptId, answers });
      console.log('SUBMITTED RAW:', JSON.stringify(submitted));
      if (submitted.ok) {
      const fetched = await AuthAPI.getQuizResult(attemptId);
        console.log('FETCHED RAW:', JSON.stringify(fetched));
        const apiResult = fetched.ok ? fetched.result : submitted.result;
        console.log('API RESULT:', JSON.stringify(apiResult));
       const raw = apiResult?.result || apiResult || {};
        // ✅ FIX: backend kabhi 'Exam' / ' exam ' jaisa casing/whitespace ke saath bhej
        // sakta hai — strict === 'exam' fail hota to certificate silently gayab ho jaata.
        // Case/whitespace-insensitive check zyada robust hai.
        const isExamQuiz = String(quiz?.quiz_type || '').trim().toLowerCase() === 'exam';
        const percentageValue = Number(raw?.percentage ?? 0);
        const resultTier = getQuizResultTier(percentageValue);
        result = {
          ok: true,
          percentage: percentageValue,
          result_type: resultTier.result,
          obtained_marks: raw?.obtained_marks ?? 0,
          total_marks: raw?.total_marks ?? 0,
                correct_answers: raw?.correct_answers ?? null,
          wrong_answers: raw?.wrong_answers ?? 0,
          total_questions: raw?.total_questions || questions.length,
          // Backend agar practice/training me galti se bhi certificate bhej de, front-end usse ignore karega.
          certificate_file: isExamQuiz ? (raw?.certificate_file || null) : null,
          certificate_number: isExamQuiz ? (raw?.certificate_number || null) : null,
          user_name: raw?.user_name || null,
          date: raw?.date || raw?.submitted_at || new Date().toLocaleDateString('en-IN'),
        };
      } else {
        result = submitted;
      }
    } else {
      result = await UserStore.submitQuizAnswers(quiz.id, selectedAnswers);
    }
    setSubmitting(false);

    if (!result.ok) {
      submissionStartedRef.current = false;
      showToast(result.message || 'Submission failed.', 'error');
      return;
    }

    // Attempt successfully submit ho gaya — quiz-subscription ka remaining count 1 se
    // ghata do. (Legacy/unlimited users ke liye ye no-op rahega — see consumeQuizAttempt.)
    UserStore.consumeQuizAttempt();

  navigation.replace('QuizResult', {
      result: {
        id:                     quiz.id,
        quiz_title:             quiz.quiz_title,
        quiz_type:              quiz.quiz_type,
        percentage:             result.percentage,
        result_type:            result.result_type,
        obtained_marks:         result.obtained_marks,
        total_marks:            result.total_marks,
        correct_answers:        result.correct_answers,
        wrong_answers:          result.wrong_answers,
        total_questions:        result.total_questions,
        certificate_file:       result.certificate_file,
        local_certificate_path: result.local_certificate_path,
        certificate_number:     result.certificate_number,
        user_name:              result.user_name,
        date:                   result.date,
    },
    });
  };

  const handleSubmitPress = () => submitAttempt();

  return (
    <SafeAreaView style={AttemptQuizStyles.root}>

      {/* Top Bar */}
      <View style={AttemptQuizStyles.topBar}>
        <TouchableOpacity
          style={AttemptQuizStyles.backBtn}
          onPress={() => navigation.goBack()}
        >
          {/* ← White icon because topBar background is red */}
          <Feather name="arrow-left" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={AttemptQuizStyles.topBarTitle}>Attempt Quiz</Text>
        <View style={AttemptQuizStyles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={AttemptQuizStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {starting ? (
          <View style={AttemptQuizStyles.card}><ActivityIndicator size="large" color="#dc2626" /></View>
        ) : null}
        {/* Hero */}
        <View style={AttemptQuizStyles.heroCard}>
          <Text style={AttemptQuizStyles.heroEyebrow}>Quiz</Text>
          <Text style={AttemptQuizStyles.heroTitle}>{quiz.quiz_title || 'Quiz'}</Text>
        </View>

        {/* Question Card */}
        {!starting && <View style={AttemptQuizStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={AttemptQuizStyles.quizProgress}>
              Question {currentQIndex + 1} of {questions.length}
            </Text>
            {timeLeft !== null && (
              <Text style={{ color: '#dc2626', fontWeight: '700' }}>{formatTime(timeLeft)}</Text>
            )}
          </View>

          <View style={AttemptQuizStyles.progressBarWrap}>
            <View
              style={[
                AttemptQuizStyles.progressBarFill,
                { width: `${((currentQIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>

          <Text style={AttemptQuizStyles.questionText}>
            {questions[currentQIndex]?.question}
          </Text>

          {['A', 'B', 'C', 'D'].map((opt) => {
            const optionText = questions[currentQIndex]?.options?.[opt];
            if (!optionText) return null;
            const isSelected = selectedAnswers[currentQIndex] === opt;

            return (
              <TouchableOpacity
                key={opt}
                style={[AttemptQuizStyles.optionBtn, isSelected && AttemptQuizStyles.optionBtnSelected]}
                onPress={() => handleSelectAnswer(opt)}
              >
                <View style={[AttemptQuizStyles.optionLabel, isSelected && AttemptQuizStyles.optionLabelSelected]}>
                  <Text style={[AttemptQuizStyles.optionLabelText, isSelected && AttemptQuizStyles.optionLabelTextSelected]}>
                    {opt}
                  </Text>
                </View>
                <Text style={[AttemptQuizStyles.optionText, isSelected && AttemptQuizStyles.optionTextSelected]}>
                  {optionText}
                </Text>
              </TouchableOpacity>
            );
          })}

       <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[AttemptQuizStyles.nextBtn, { flex: 1, backgroundColor: '#9CA3AF' }]}
              onPress={currentQIndex > 0 ? handlePrevious : () => navigation.goBack()}
              disabled={submitting}
            >
              <Feather name="arrow-left" size={16} color="#fff" />
              <Text style={AttemptQuizStyles.nextBtnText}>Back</Text>
            </TouchableOpacity>
            {currentQIndex < questions.length - 1 && (
              <TouchableOpacity
                style={[AttemptQuizStyles.nextBtn, { flex: 1, backgroundColor: '#fca5a5' }]}
                onPress={handleSkip}
                disabled={submitting}
              >
                <Text style={AttemptQuizStyles.nextBtnText}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[AttemptQuizStyles.nextBtn, { flex: 1 }, submitting && AttemptQuizStyles.nextBtnDisabled]}
              onPress={currentQIndex === questions.length - 1 ? handleSubmitPress : handleNext}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={AttemptQuizStyles.nextBtnText}>
                    {currentQIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                  </Text>
                  <Feather
                    name={currentQIndex === questions.length - 1 ? 'check' : 'arrow-right'}
                    size={16}
                    color="#fff"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}