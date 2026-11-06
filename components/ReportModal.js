// components/ReportModal.js
// Post / Account report ke liye common modal (web + Android + iOS).
//  - Reason dropdown (required)
//  - "Other" select karne par details textbox (optional)
//  - Result (success / 401 / 404 / 422 / network) modal ke andar hi dikhta hai,
//    isliye Alert / Toast par depend nahi (RN-web par Alert.alert kaam nahi karta).
//
// Props:
//   visible   : boolean
//   onClose   : () => void
//   kind      : 'post' | 'account'   (title / texts ke liye)
//   onSubmit  : async ({ reason, details }) => ({ ok, message })
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export const REPORT_REASONS = [
  'Spam',
  'Fake account / impersonation',
  'Harassment',
  'Hate speech',
  'Nudity / inappropriate content',
  'Misinformation',
  'Other',
];

const OTHER = 'Other';
const DETAILS_MAX = 500;

export default function ReportModal({ visible, onClose, kind = 'post', onSubmit }) {
  const isAccount = kind === 'account';
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  // Har baar modal khulne par fresh state
  useEffect(() => {
    if (visible) {
      setReason('');
      setDetails('');
      setListOpen(false);
      setBusy(false);
      setError('');
      setDone(false);
      setDoneMessage('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (busy) return;
    if (!reason) {
      setError('Please select a reason.');
      setListOpen(true);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const payload = { reason };
      const trimmed = details.trim();
      if (reason === OTHER && trimmed) payload.details = trimmed;
      const result = await onSubmit?.(payload);
      if (result?.ok) {
        setDone(true);
        setDoneMessage(result.message || 'Report submitted successfully.');
      } else {
        setError(result?.message || 'Unable to submit report. Please try again.');
      }
    } catch {
      setError('Unable to submit report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={busy ? undefined : onClose}>
          <View style={s.backdrop}>
            <TouchableWithoutFeedback>
              <View style={s.card}>
                {done ? (
                  <View style={s.doneWrap}>
                    <View style={s.doneIcon}><Feather name="check" size={28} color="#16a34a" /></View>
                    <Text style={s.doneTitle}>Report submitted</Text>
                    <Text style={s.doneText}>{doneMessage} Thanks, our team will review it.</Text>
                    <TouchableOpacity style={[s.primaryBtn, s.doneBtn]} onPress={onClose} activeOpacity={0.85}>
                      <Text style={s.primaryBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={s.header}>
                      <Text style={s.title}>{isAccount ? 'Report account' : 'Report post'}</Text>
                      <TouchableOpacity onPress={onClose} disabled={busy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="x" size={20} color="#0f172a" />
                      </TouchableOpacity>
                    </View>
                    <Text style={s.sub}>
                      {isAccount ? 'Why are you reporting this account?' : 'Why are you reporting this post?'}
                    </Text>

                    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
                      <Text style={s.label}>Reason <Text style={{ color: '#ef4444' }}>*</Text></Text>
                      <TouchableOpacity
                        style={[s.select, error && !reason ? s.selectError : null]}
                        onPress={() => setListOpen((v) => !v)}
                        activeOpacity={0.8}
                        disabled={busy}
                      >
                        <Text style={[s.selectText, !reason && { color: '#94a3b8' }]} numberOfLines={1}>
                          {reason || 'Select a reason'}
                        </Text>
                        <Feather name={listOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                      </TouchableOpacity>

                      {listOpen ? (
                        <View style={s.list}>
                          {REPORT_REASONS.map((r, i) => {
                            const active = r === reason;
                            return (
                              <TouchableOpacity
                                key={r}
                                style={[s.option, i > 0 && s.optionBorder, active && s.optionActive]}
                                onPress={() => { setReason(r); setListOpen(false); setError(''); }}
                                activeOpacity={0.8}
                              >
                                <Text style={[s.optionText, active && { color: '#c2410c', fontWeight: '700' }]}>{r}</Text>
                                {active ? <Feather name="check" size={16} color="#c2410c" /> : null}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null}

                      {reason === OTHER ? (
                        <>
                          <Text style={[s.label, { marginTop: 14 }]}>Details <Text style={s.optional}>(optional)</Text></Text>
                          <TextInput
                            style={s.textarea}
                            value={details}
                            onChangeText={(t) => setDetails(t.slice(0, DETAILS_MAX))}
                            placeholder="Tell us more about the problem"
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            editable={!busy}
                          />
                          <Text style={s.counter}>{details.length}/{DETAILS_MAX}</Text>
                        </>
                      ) : null}

                      {error ? <Text style={s.errorText}>{error}</Text> : null}
                    </ScrollView>

                    <View style={s.actions}>
                      <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={busy} activeOpacity={0.8}>
                        <Text style={s.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.primaryBtn, { flex: 1, marginTop: 0 }, (!reason || busy) && { opacity: 0.55 }]}
                        onPress={handleSubmit}
                        disabled={busy}
                        activeOpacity={0.85}
                      >
                        {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.primaryBtnText}>Submit report</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#94a3b8' },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#f8fafc' },
  selectError: { borderColor: '#ef4444' },
  selectText: { fontSize: 14, color: '#0f172a', flex: 1, marginRight: 8 },
  list: { marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  optionBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  optionActive: { backgroundColor: '#fff7ed' },
  optionText: { fontSize: 14, color: '#0f172a' },
  textarea: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, minHeight: 96, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: '#94a3b8', marginTop: 4 },
  errorText: { marginTop: 12, fontSize: 13, color: '#dc2626', fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  cancelBtn: { minHeight: 46, justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#f1f5f9' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  primaryBtn: { marginTop: 16, backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  doneWrap: { alignItems: 'center', paddingVertical: 8, alignSelf: 'stretch' },
  doneBtn: { alignSelf: 'stretch', minHeight: 46, marginTop: 18 },
  doneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  doneTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  doneText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 4 },
});