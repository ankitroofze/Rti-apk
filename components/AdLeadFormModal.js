// import React, { useEffect, useState } from 'react';
// import {
//   Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
//   TouchableOpacity, View, Linking,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { UserStore } from '../store/UserStore';
// import { useToast } from './ui/ToastProvider';

// const C = {
//   primary: '#16a34a',        // ✅ green CTA jaisa screenshot mein hai
//   primaryLight: '#f0fdf4',
//   primaryBorder: '#bbf7d0',
//   border: '#E5E5E5',
//   neutral400: '#A3A3A3',
//   text: '#111111',
//   sub: '#6B6B6B',
//   white: '#ffffff',
//   green: '#16a34a',
//   greenLight: '#f0fdf4',
// };

// export default function AdLeadFormModal({ visible, ad, onClose }) {
//   const { showToast } = useToast();
//   const isWeb = Platform.OS === 'web';
//   const fields = Array.isArray(ad?.extraValues?.lead_form_fields) ? ad.extraValues.lead_form_fields : [];

//   const [answers, setAnswers] = useState({});
//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);

//   useEffect(() => {
//     if (visible) {
//       setAnswers({});
//       setSubmitting(false);
//       setSubmitted(false);
//     }
//   }, [visible, ad?.id]);

//   const setAnswer = (fieldId, value) => setAnswers((prev) => ({ ...prev, [fieldId]: value }));

//   const toggleMultiOption = (fieldId, option) => {
//     setAnswers((prev) => {
//       const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
//       const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
//       return { ...prev, [fieldId]: next };
//     });
//   };

//   const handleSubmit = async () => {
//     if (submitting) return;
//     setSubmitting(true);
//     const result = await UserStore.submitAdLeadForm(ad, answers);
//     setSubmitting(false);

//     if (!result.ok) {
//       showToast(result.message || 'Unable to submit form.', 'error');
//       return;
//     }

//     if (result.submitAction === 'whatsapp' && result.whatsappNumber) {
//       const url = `https://wa.me/91${String(result.whatsappNumber).replace(/\D/g, '')}`;
//       onClose?.();
//       Linking.openURL(url).catch(() => {});
//       return;
//     }

//     setSubmitted(true);
//     showToast('Form submitted successfully!', 'success');
//   };

//   // ── Ek field ke saare answers filled hain ya nahi (Submit button enable/disable ke liye) ──
//   const isFieldAnswered = (field) => {
//     const val = answers[field.id];
//     if (['single_choice'].includes(field.type)) return Boolean(val);
//     if (field.type === 'multi_choice') return Array.isArray(val) && val.length > 0;
//     return Boolean(String(val || '').trim());
//   };
//   const canSubmit = fields.every((f) => !f.required || isFieldAnswered(f));

//   const renderField = (field) => {
//     const options = (field.options || []).filter(Boolean);
//     const isYesNo = field.type === 'single_choice' && options.length === 2;

//     switch (field.type) {
//       case 'paragraph':
//         return (
//           <TextInput
//             style={[styles.input, styles.inputMulti]}
//             placeholder="Your answer..."
//             placeholderTextColor={C.neutral400}
//             value={answers[field.id] || ''}
//             onChangeText={(v) => setAnswer(field.id, v)}
//             multiline
//             numberOfLines={4}
//             textAlignVertical="top"
//           />
//         );

//       case 'single_choice':
//         // ✅ Exactly 2 options ho to screenshot jaisa side-by-side Yes/No pill style
//         if (isYesNo) {
//           return (
//             <View style={styles.yesNoRow}>
//               {options.map((opt, idx) => {
//                 const selected = answers[field.id] === opt;
//                 return (
//                   <TouchableOpacity
//                     key={idx}
//                     style={[styles.yesNoPill, selected && styles.yesNoPillSelected]}
//                     onPress={() => setAnswer(field.id, opt)}
//                     activeOpacity={0.8}
//                   >
//                     <Text style={[styles.yesNoPillText, selected && styles.yesNoPillTextSelected]}>{opt}</Text>
//                     <View style={[styles.yesNoRadio, selected && styles.yesNoRadioSelected]}>
//                       {selected ? <Ionicons name="checkmark" size={11} color="#fff" /> : null}
//                     </View>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           );
//         }
//         // 3+ options ho to stacked choice list
//         return (
//           <View style={{ gap: 8 }}>
//             {options.map((opt, idx) => {
//               const selected = answers[field.id] === opt;
//               return (
//                 <TouchableOpacity
//                   key={idx}
//                   style={[styles.choiceRow, selected && styles.choiceRowSelected]}
//                   onPress={() => setAnswer(field.id, opt)}
//                   activeOpacity={0.8}
//                 >
//                   <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
//                     {selected && <View style={styles.radioInnerDot} />}
//                   </View>
//                   <Text style={styles.choiceText}>{opt}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         );

//       case 'multi_choice':
//         return (
//           <View style={{ gap: 8 }}>
//             {options.map((opt, idx) => {
//               const selected = Array.isArray(answers[field.id]) && answers[field.id].includes(opt);
//               return (
//                 <TouchableOpacity
//                   key={idx}
//                   style={[styles.choiceRow, selected && styles.choiceRowSelected]}
//                   onPress={() => toggleMultiOption(field.id, opt)}
//                   activeOpacity={0.8}
//                 >
//                   <View style={[styles.checkbox, selected && styles.checkboxOn]}>
//                     {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
//                   </View>
//                   <Text style={styles.choiceText}>{opt}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         );

//       default:
//         return (
//           <TextInput
//             style={styles.input}
//             placeholder="Your answer..."
//             placeholderTextColor={C.neutral400}
//             value={answers[field.id] || ''}
//             onChangeText={(v) => setAnswer(field.id, v)}
//           />
//         );
//     }
//   };

//   if (!ad) return null;

//   // ── Screen 3: Submit ke baad Thank You (same ad-card feel) ──
//   const thankYouBody = (
//     <View style={styles.thankYouWrap}>
//       <View style={styles.thankYouIconCircle}>
//         <Ionicons name="checkmark-circle" size={54} color={C.green} />
//       </View>
//       <Text style={styles.thankYouTitle}>Thank You!</Text>
//       <Text style={styles.thankYouText}>
//         Your response has been submitted successfully.{'\n'}We will get back to you soon.
//       </Text>
//       <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
//         <Text style={styles.doneBtnText}>Done</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // ── Screen 2: Lead Form ──
//   const formBody = (
//     <>
//       <ScrollView style={styles.formScroll} contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
//         <Text style={styles.formSubtitle}>Please fill the form below</Text>
//         {fields.map((field) => (
//           <View key={field.id} style={styles.fieldWrap}>
//             <Text style={styles.questionText}>
//               {field.question} {field.required ? <Text style={styles.req}>*</Text> : null}
//             </Text>
//             {renderField(field)}
//           </View>
//         ))}
//       </ScrollView>
//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={[styles.submitBtn, (submitting || !canSubmit) && styles.submitBtnDisabled]}
//           onPress={handleSubmit}
//           activeOpacity={0.85}
//           disabled={submitting || !canSubmit}
//         >
//           <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
//         </TouchableOpacity>
//         <View style={styles.privacyRow}>
//           <Ionicons name="lock-closed-outline" size={11} color={C.sub} />
//           <Text style={styles.privacyText}>We will never share your information.</Text>
//         </View>
//       </View>
//     </>
//   );

//   const body = submitted ? thankYouBody : formBody;
//   const headerTitle = submitted ? (ad.title || 'Advertisement') : 'Lead Form';

//   if (isWeb) {
//     return (
//       <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
//         <View style={styles.webOverlay}>
//           <TouchableOpacity style={styles.webBackdrop} activeOpacity={1} onPress={onClose} />
//           <View style={[styles.webBox, { maxHeight: '85vh' }]}>
//             <View style={styles.header}>
//               <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
//               <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//                 <Ionicons name="close" size={20} color={C.text} />
//               </TouchableOpacity>
//             </View>
//             {body}
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={styles.sheetOverlay}>
//         <View style={[styles.sheet, { maxHeight: '90%' }]}>
//           <View style={styles.handle} />
//           <View style={styles.header}>
//             <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
//             <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//               <Ionicons name="close" size={20} color={C.text} />
//             </TouchableOpacity>
//           </View>
//           {body}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   webOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
//   webBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
//   webBox: { width: '100%', maxWidth: 460, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden' },
//   sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
//   sheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
//   handle: { width: 44, height: 4, backgroundColor: C.border, borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 4 },

//   header: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//     paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
//   },
//   headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: C.text },
//   closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

//   formScroll: { paddingHorizontal: 18 },
//   formScrollContent: { paddingTop: 16, paddingBottom: 8 },
//   formSubtitle: { fontSize: 13, color: C.sub, fontWeight: '600', marginBottom: 18 },

//   fieldWrap: { marginBottom: 20 },
//   questionText: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10, lineHeight: 20 },
//   req: { color: '#EF4444' },

//   // ✅ Yes/No side-by-side pill row — screenshot ke exact style
//   yesNoRow: { flexDirection: 'row', gap: 10 },
//   yesNoPill: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     borderWidth: 1.4,
//     borderColor: C.border,
//     borderRadius: 10,
//     paddingVertical: 12,
//     backgroundColor: C.white,
//   },
//   yesNoPillSelected: {
//     borderColor: C.primary,
//     backgroundColor: C.primaryLight,
//   },
//   yesNoPillText: { fontSize: 13.5, fontWeight: '700', color: C.text },
//   yesNoPillTextSelected: { color: C.primary },
//   yesNoRadio: {
//     width: 18, height: 18, borderRadius: 9,
//     borderWidth: 1.4, borderColor: C.neutral400,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   yesNoRadioSelected: { backgroundColor: C.primary, borderColor: C.primary },

//   input: {
//     borderWidth: 1, borderColor: C.border, borderRadius: 8,
//     paddingHorizontal: 12, paddingVertical: 12, fontSize: 13, color: C.text, backgroundColor: C.white,
//   },
//   inputMulti: { minHeight: 90 },

//   choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12 },
//   choiceRowSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
//   choiceText: { fontSize: 13, color: C.text, flex: 1 },

//   radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.neutral400, alignItems: 'center', justifyContent: 'center' },
//   radioOuterSelected: { borderColor: C.primary },
//   radioInnerDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary },

//   checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: C.neutral400, alignItems: 'center', justifyContent: 'center' },
//   checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },

//   footer: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
//   submitBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
//   submitBtnDisabled: { opacity: 0.5 },
//   submitBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
//   privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 },
//   privacyText: { fontSize: 11, color: C.sub, fontWeight: '500' },

//   // ✅ Thank You screen — screenshot ke exact style
//   thankYouWrap: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 28 },
//   thankYouIconCircle: {
//     width: 84, height: 84, borderRadius: 42,
//     backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.primaryBorder,
//     alignItems: 'center', justifyContent: 'center', marginBottom: 16,
//   },
//   thankYouTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
//   thankYouText: { fontSize: 13.5, color: C.sub, textAlign: 'center', lineHeight: 20, marginBottom: 26 },
//   doneBtn: { backgroundColor: C.primary, borderRadius: 100, paddingVertical: 13, paddingHorizontal: 40 },
//   doneBtnText: { color: C.white, fontSize: 14, fontWeight: '800' },
// });

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserStore } from '../store/UserStore';
import { useToast } from './ui/ToastProvider';

const C = {
  primary: '#ea580c',
  primaryLight: '#fff7ed',
  primaryBorder: '#fed7aa',
  border: '#e2e8f0',
  text: '#0f172a',
  sub: '#64748b',
  white: '#ffffff',
};

const normalizeIndianMobileNumber = (value = '') => String(value).replace(/\D/g, '').slice(-10);
const isValidIndianMobileNumber = (value = '') => /^[6-9]\d{9}$/.test(normalizeIndianMobileNumber(value));
const splitName = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
};

export default function AdLeadFormModal({ visible, ad, onClose }) {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSubmitting(false);
    setSubmitted(false);
    setMessage('');
    (async () => {
      const user = await UserStore.getCurrentUser();
      if (!user) return;
      const nameParts = splitName(user.name);
      setFirstName(String(user.first_name || user.firstName || nameParts.firstName || '').trim());
      setLastName(String(user.last_name || user.lastName || nameParts.lastName || '').trim());
      setEmail(String(user.email || '').trim());
      setContact(normalizeIndianMobileNumber(user.mobile || user.mobile_number || user.contact_number || ''));
    })();
  }, [visible, ad?.id]);

  const handleSubmit = async () => {
    if (submitting) return;
    const normalizedContact = normalizeIndianMobileNumber(contact);
    if (!firstName.trim()) { showToast('Please enter your first name.', 'error'); return; }
    if (!email.trim()) { showToast('Please enter your email.', 'error'); return; }
    if (!normalizedContact) { showToast('Please enter your contact number.', 'error'); return; }
    if (!isValidIndianMobileNumber(normalizedContact)) {
      showToast('Please enter a valid 10 digit contact number.', 'error');
      return;
    }
    setSubmitting(true);
    const result = await UserStore.submitAdLeadForm(ad, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      contact: normalizedContact,
      message: message.trim(),
    });
    setSubmitting(false);
    if (!result.ok) {
      showToast(result.message || 'Unable to submit form.', 'error');
      return;
    }
    setSubmitted(true);
    showToast('Form submitted successfully!', 'success');
  };

  if (!ad) return null;

  const thankYouBody = (
    <View style={styles.thankYouWrap}>
      <View style={styles.thankYouIconCircle}>
        <Ionicons name="checkmark-circle" size={54} color={C.primary} />
      </View>
      <Text style={styles.thankYouTitle}>Thank You!</Text>
      <Text style={styles.thankYouText}>
        Your response has been submitted successfully.{'\n'}We will get back to you soon.
      </Text>
      <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const formBody = (
    <ScrollView
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.productInfoBox}>
        <View style={styles.productInfoIcon}>
          <Ionicons name="megaphone-outline" size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productInfoLabel}>Advertisement</Text>
          <Text style={styles.productInfoValue} numberOfLines={1}>{ad.title || 'Advertisement'}</Text>
        </View>
      </View>

      <Text style={styles.formLabel}>First Name</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={16} color="#94a3b8" />
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Enter first name" placeholderTextColor="#94a3b8" />
      </View>

      <Text style={styles.formLabel}>Last Name</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={16} color="#94a3b8" />
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Enter last name" placeholderTextColor="#94a3b8" />
      </View>

      <Text style={styles.formLabel}>Email</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="mail-outline" size={16} color="#94a3b8" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" />
      </View>

      <Text style={styles.formLabel}>Contact Number</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="call-outline" size={16} color="#94a3b8" />
        <TextInput style={styles.input} value={contact} onChangeText={(v) => setContact(normalizeIndianMobileNumber(v))} placeholder="Enter contact number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" maxLength={10} />
      </View>

      <Text style={styles.formLabel}>Message</Text>
      <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="e.g. What is the final price?" placeholderTextColor="#94a3b8" multiline />

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.65 }]} onPress={handleSubmit} activeOpacity={0.85} disabled={submitting}>
        {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
          <>
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>Send Enquiry</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const body = submitted ? thankYouBody : formBody;
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.webOverlay}>
          <TouchableOpacity style={styles.webBackdrop} activeOpacity={1} onPress={onClose} />
          <View style={[styles.webBox, { maxHeight: '85vh' }]}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Send Enquiry</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={C.text} />
              </TouchableOpacity>
            </View>
            {body}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { maxHeight: '90%' }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Send Enquiry</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>
          </View>
          {body}
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  webBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  webBox: { width: '100%', maxWidth: 460, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  handle: { width: 44, height: 4, backgroundColor: C.border, borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: C.text },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  formContent: { padding: 18, paddingBottom: 28 },
  productInfoBox: {
    backgroundColor: C.primaryLight, borderRadius: 12, borderWidth: 1,
    borderColor: C.primaryBorder, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  productInfoIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.primaryBorder,
  },
  productInfoLabel: { fontSize: 11, color: C.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  productInfoValue: { fontSize: 15, color: C.text, fontWeight: '800' },

  formLabel: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 2,
  },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 12, outlineStyle: 'none' },
  textArea: {
    minHeight: 90, textAlignVertical: 'top',
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    backgroundColor: '#fff', paddingHorizontal: 14,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, marginTop: 20,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  thankYouWrap: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 28 },
  thankYouIconCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  thankYouTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
  thankYouText: { fontSize: 13.5, color: C.sub, textAlign: 'center', lineHeight: 20, marginBottom: 26 },
  doneBtn: { backgroundColor: C.primary, borderRadius: 100, paddingVertical: 13, paddingHorizontal: 40 },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

