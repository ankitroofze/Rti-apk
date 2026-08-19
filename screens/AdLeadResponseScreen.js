import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';

const C = {
  primary: '#ea580c',
  primaryLight: '#FDF1F1',
  border: '#E5E5E5',
  text: '#111111',
  sub: '#6B6B6B',
  bg: '#F7F7F7',
  white: '#ffffff',
};

// navigation route params expected: { submissionId }
export default function AdLeadResponseScreen({ navigation, route }) {
  const submissionId = route?.params?.submissionId;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const found = await UserStore.getAdLeadSubmissionById(submissionId);
      if (mounted) {
        setSubmission(found);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [submissionId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Form Response</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : !submission ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={36} color={C.sub} />
            <Text style={styles.muted}>This response is no longer available.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.adBadge}>
                <Ionicons name="megaphone-outline" size={13} color={C.primary} />
                <Text style={styles.adBadgeText}>Advertisement</Text>
              </View>
              <Text style={styles.adTitle}>{submission.ad_title}</Text>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={C.sub} />
                <Text style={styles.metaText}>{submission.submitted_by_name || 'Visitor'}</Text>
              </View>
              {submission.submitted_by_email ? (
                <View style={styles.metaRow}>
                  <Ionicons name="mail-outline" size={14} color={C.sub} />
                  <Text style={styles.metaText}>{submission.submitted_by_email}</Text>
                </View>
              ) : null}
              {submission.submitted_by_mobile ? (
                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={14} color={C.sub} />
                  <Text style={styles.metaText}>{submission.submitted_by_mobile}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={C.sub} />
                <Text style={styles.metaText}>
                  {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('en-IN') : '-'}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Answers</Text>
            {(submission.answers || []).map((a, idx) => (
              <View key={a.question_id || idx} style={styles.qCard}>
                <Text style={styles.qText}>{idx + 1}. {a.question}</Text>
                <Text style={styles.aText}>
                  {Array.isArray(a.answer) ? (a.answer.join(', ') || '—') : (a.answer || '—')}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  muted: { color: C.sub, textAlign: 'center', marginTop: 10 },
  emptyWrap: { alignItems: 'center', gap: 10, marginTop: 60 },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: C.border },
  adBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  adBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary },
  adTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText: { fontSize: 13, color: C.sub },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 10 },
  qCard: { backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  qText: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  aText: { fontSize: 13, color: C.sub },
});
