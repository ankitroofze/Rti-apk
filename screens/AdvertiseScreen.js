import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, Alert, Modal, Dimensions, Platform, StatusBar,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getResponsiveWindowWidth } from '../utils/webDevice';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';

// ── Design tokens — matched to source (Shuru) promotion form ───────────────────
// Source uses: bg-primary / text-primary / border-primary (orange),
// upload box bg #FDF1F1 (light rose), dashed inner box border #DDDDDD,
// radio cards border-neutral-400, white bg, rounded-md corners, rounded-full CTA.
const C = {
  primary:      '#ea580c',   // --primary
  primaryDark:  '#C8700F',
  uploadBg:     '#FDF1F1',   // bg-[#FDF1F1]
  dashedBorder: '#DDDDDD',   // border-[#DDDDDD]
  neutral400:   '#A3A3A3',   // border-neutral-400
  textMain:     '#353535',   // header title color
  textBody:     '#111111',
  textSub:      '#6B6B6B',   // text-[#6B6B6B]
  textMuted:    '#8F8F8F',   // helper text color
  headerBorder: '#E6E6E6',   // border-b-[#E6E6E6]
  border:       '#E5E5E5',
  white:        '#ffffff',
  bg:           '#F7F7F7',   // page bg
  danger:       '#EF4444',   // text-red-500 asterisk
  green:        '#16a34a',
  greenLight:   '#f0fdf4',
  greenBorder:  '#bbf7d0',
};

const FONT = {
  regular: 'Roboto_400Regular',
  medium:  'Roboto_500Medium',
  bold:    'Roboto_700Bold',
  black:   'Roboto_900Black',
};
const AD_DRAFT_KEY = 'rti-advertisement-draft';

const { width: RAW_SW } = Dimensions.get('window');
const SW = getResponsiveWindowWidth(RAW_SW);

const HEADER_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 10
  : 54;

// ── Redirect Options (functionality unchanged) ─────────────────────────────────
const REDIRECT_OPTIONS = [
  { id: 'profile',   title: 'My RTI Profile',      desc: 'On clicking the banner, users will directly reach to your profile',            icon: 'person-circle-outline', extra: null },
  { id: 'website',   title: 'My Website',           desc: 'On clicking the banner, users will be directly sent to your website',           icon: 'globe-outline',         extra: 'website_url' },
  { id: 'shop',      title: 'My Shop',              desc: 'On clicking the banner, users will be directly sent to your online shop',        icon: 'storefront-outline',    extra: 'shop_url' },
  { id: 'lead_form', title: 'Lead Form',            desc: 'On clicking the banner, users can fill out a form you created.',                 icon: 'document-text-outline', extra: null },
  { id: 'whatsapp',  title: 'My Whatsapp Number',   desc: 'On clicking the banner, users will be able to message you on whatsapp',          icon: 'logo-whatsapp',         extra: 'whatsapp_number' },
];

// ── Lead Form Builder — answer types ────────────────────────────────────────────
const FIELD_TYPES = [
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'paragraph',    label: 'Paragraph' },
  { id: 'single_choice', label: 'Single Choice' },
  { id: 'multi_choice',  label: 'Multiple Choice' },
];

const makeFieldId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const normalizeIndianMobileNumber = (value = '') => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(0, 10);
};

const isValidIndianMobileNumber = (value = '') => /^[6-9]\d{9}$/.test(normalizeIndianMobileNumber(value));

const buildNextExtraValues = (key, value, previous = {}) => ({
  ...previous,
  [key]: key === 'whatsapp_number' ? normalizeIndianMobileNumber(value) : value,
});

// ── Section Label — matches source's "1. Title *" inline numbering (no circle) ─
function SectionLabel({ number, title, hint }) {
  return (
    <View style={st.wrap}>
      <Text style={st.title}>
        {number}. <Text>{title}</Text> <Text style={st.req}>*</Text>
      </Text>
      {hint ? <Text style={st.hint}>{hint}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap:  { flexDirection: 'column', marginBottom: 12 },
  title: { fontSize: 15, fontFamily: FONT.bold, color: C.textBody },
  req:   { color: C.danger },
  hint:  { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, marginTop: 2 },
});

// ── Helper "info" hint row (matches the info-icon caption under inputs) ────────
function InfoHint({ text }) {
  return (
    <View style={ih.row}>
      <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
      <Text style={ih.text}>{text}</Text>
    </View>
  );
}
const ih = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  text: { fontSize: 10, fontFamily: FONT.medium, color: C.textMuted },
});

// ✅ FIX: pehle preview modal me CHAHE koi bhi redirect option (Shop/Lead Form/Website)
// select karo, hardcoded hamesha "Message on Whatsapp" hi dikhta tha. Ab selected
// redirect ke hisaab se sahi label/icon dikhega — bilkul waisa hi jaisa asli home
// feed card (NewsFeedCard.js) me dikhta hai.
const PREVIEW_CTA_BY_REDIRECT = {
  website:   { icon: 'globe-outline',         label: 'Visit Website' },
  shop:      { icon: 'storefront-outline',     label: 'Visit Shop' },
  lead_form: { icon: 'document-text-outline',  label: 'Fill Lead Form' },
  whatsapp:  { icon: 'logo-whatsapp',          label: 'Message on Whatsapp' },
  profile:   { icon: 'person-circle-outline',  label: 'View Profile' },
};
const getPreviewCta = (redirect) => PREVIEW_CTA_BY_REDIRECT[redirect] || PREVIEW_CTA_BY_REDIRECT.profile;

// ── Ad Preview Modal ────────────────────────────────────────────────────────────
function AdPreviewModal({ visible, onClose, onNext, adData, userMobile }) {
  const isWeb = Platform.OS === 'web';
  // ✅ FIX: call button ab hardcoded nahi hai — jis number se user ne apna
  // account/login banaya hai (userMobile), preview me call button sirf tabhi
  // dikhega jab wo number available ho, aur usi number ka istemal hoga.
  const cta = getPreviewCta(adData?.redirect);
  const showCallBtn = Boolean(userMobile);

  if (isWeb) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={wpm.overlay}>
          <TouchableOpacity style={wpm.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={wpm.box}>
            <View style={wpm.header}>
              <TouchableOpacity onPress={onClose} style={wpm.backBtn}>
                <Ionicons name="arrow-back" size={18} color="#111111" />
              </TouchableOpacity>
              <Text style={wpm.headerTitle}>Your Ad will look like this</Text>
              <View style={{ width: 34 }} />
            </View>

            <View style={wpm.adCard}>
              <View style={wpm.adBadgeRow}>
                <View style={wpm.adBadge}>
                  <Text style={wpm.adBadgeEmoji}>👑</Text>
                  <Text style={wpm.adBadgeText}>Advertisement</Text>
                </View>
              </View>
              <Text style={wpm.adTitle}>{adData.title || 'Ad Title'}</Text>
              <Text style={wpm.adDesc}>{adData.description || 'Ad Description'}</Text>
              {adData.photo ? (
                <Image source={{ uri: adData.photo }} style={wpm.adImage} resizeMode="cover" />
              ) : (
                <View style={wpm.adImagePlaceholder}>
                  <Ionicons name="image-outline" size={36} color="#CCCCCC" />
                </View>
              )}
              <View style={wpm.ctaRow}>
                <TouchableOpacity style={wpm.ctaWhatsapp}>
                  <Ionicons name={cta.icon} size={15} color="#fff" />
                  <Text style={wpm.ctaWhatsappText}>{cta.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                </TouchableOpacity>
                {showCallBtn ? (
                  <TouchableOpacity style={wpm.ctaCall}>
                    <Ionicons name="call-outline" size={15} color="#16a34a" />
                    <Text style={wpm.ctaCallText}>Call</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={wpm.btnRow}>
              <TouchableOpacity style={wpm.changeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={wpm.changeBtnText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity style={wpm.nextBtn} onPress={onNext} activeOpacity={0.85}>
                <Text style={wpm.nextBtnText}>Next  →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <View style={pm.header}>
            <TouchableOpacity onPress={onClose} style={pm.backBtn}>
              <Ionicons name="arrow-back" size={20} color={C.textBody} />
            </TouchableOpacity>
            <Text style={pm.headerTitle}>Your Ad will look like this</Text>
          </View>
          <View style={pm.adCard}>
            <View style={pm.adBadgeRow}>
              <View style={pm.adBadge}>
                <Text style={pm.adBadgeEmoji}>👑</Text>
                <Text style={pm.adBadgeText}>Advertisement</Text>
              </View>
            </View>
            <Text style={pm.adTitle}>{adData.title || 'Ad Title'}</Text>
            <Text style={pm.adDesc}>{adData.description || 'Ad Description'}</Text>
            {adData.photo ? (
              <Image source={{ uri: adData.photo }} style={pm.adImage} resizeMode="cover" />
            ) : (
              <View style={pm.adImagePlaceholder}>
                <Ionicons name="image-outline" size={36} color={C.textSub} />
              </View>
            )}
            <View style={pm.ctaRow}>
              <TouchableOpacity style={pm.ctaWhatsapp}>
                <Ionicons name={cta.icon} size={15} color="#fff" />
                <Text style={pm.ctaWhatsappText}>{cta.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </TouchableOpacity>
              {showCallBtn ? (
                <TouchableOpacity style={pm.ctaCall}>
                  <Ionicons name="call-outline" size={15} color={C.green} />
                  <Text style={pm.ctaCallText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={pm.btnRow}>
            <TouchableOpacity style={pm.changeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={pm.changeBtnText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pm.nextBtn} onPress={onNext} activeOpacity={0.85}>
              <Text style={pm.nextBtnText}>Next  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 },
  handle:             { width: 44, height: 4, backgroundColor: C.border, borderRadius: 99, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:             { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.headerBorder },
  backBtn:            { padding: 6, borderRadius: 8, backgroundColor: C.uploadBg },
  headerTitle:        { fontSize: 15, fontFamily: FONT.bold, color: C.textMain },
  adCard:             { marginHorizontal: 16, marginTop: 14, backgroundColor: C.uploadBg, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.primary },
  adBadgeRow:         { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  adBadge:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.white, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  adBadgeEmoji:       { fontSize: 13 },
  adBadgeText:        { fontSize: 11, color: C.primary, fontFamily: FONT.bold },
  adTitle:            { fontSize: 15, fontFamily: FONT.bold, color: C.textBody, paddingHorizontal: 12, paddingBottom: 2 },
  adDesc:             { fontSize: 12, color: C.textSub, paddingHorizontal: 12, paddingBottom: 10 },
  adImage:            { width: '100%', height: 180 },
  adImagePlaceholder: { width: '100%', height: 180, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  ctaRow:             { flexDirection: 'row', height: 48 },
  ctaWhatsapp:        { flex: 1, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  ctaWhatsappText:    { color: '#fff', fontFamily: FONT.bold, fontSize: 13 },
  ctaCall:            { width: 88, backgroundColor: C.greenLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderLeftWidth: 1, borderLeftColor: C.greenBorder },
  ctaCallText:        { color: C.green, fontFamily: FONT.bold, fontSize: 13 },
  btnRow:             { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  changeBtn:          { flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  changeBtnText:      { color: C.primary, fontFamily: FONT.bold, fontSize: 15 },
  nextBtn:            { flex: 1, backgroundColor: C.primary, borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  nextBtnText:        { color: '#fff', fontFamily: FONT.bold, fontSize: 15 },
});

const wpm = StyleSheet.create({
  overlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', justifyContent:'center', padding:24 },
  backdrop:  { position:'absolute', top:0, left:0, right:0, bottom:0 },
  box:       { width:'100%', maxWidth:520, backgroundColor:'#ffffff', borderRadius:16, overflow:'hidden' },
  header:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor: C.headerBorder },
  backBtn:   { width:34, height:34, borderRadius:8, backgroundColor: C.uploadBg, alignItems:'center', justifyContent:'center' },
  headerTitle: { fontSize:15, fontFamily: FONT.bold, color:'#111111' },
  adCard:    { margin:16, backgroundColor: C.uploadBg, borderRadius:8, overflow:'hidden', borderWidth:1, borderColor: C.primary },
  adBadgeRow:{ paddingHorizontal:12, paddingTop:10, paddingBottom:4 },
  adBadge:   { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#ffffff', alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  adBadgeEmoji: { fontSize:13 },
  adBadgeText:  { fontSize:11, color: C.primary, fontFamily: FONT.bold },
  adTitle:   { fontSize:15, fontFamily: FONT.bold, color:'#111111', paddingHorizontal:12, paddingBottom:2 },
  adDesc:    { fontSize:12, color:'#888888', paddingHorizontal:12, paddingBottom:10 },
  adImage:   { width:'100%', height:200 },
  adImagePlaceholder: { width:'100%', height:200, backgroundColor:'#ffffff', alignItems:'center', justifyContent:'center' },
  ctaRow:        { flexDirection:'row', height:48 },
  ctaWhatsapp:   { flex:1, backgroundColor: C.primary, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5 },
  ctaWhatsappText: { color:'#fff', fontFamily: FONT.bold, fontSize:13 },
  ctaCall:       { width:88, backgroundColor:'#f0fdf4', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:4, borderLeftWidth:1, borderLeftColor:'#bbf7d0' },
  ctaCallText:   { color:'#16a34a', fontFamily: FONT.bold, fontSize:13 },
  btnRow:    { flexDirection:'row', gap:12, padding:16 },
  changeBtn: { flex:1, borderWidth:1.5, borderColor: C.primary, borderRadius:100, paddingVertical:13, alignItems:'center' },
  changeBtnText: { color: C.primary, fontFamily: FONT.bold, fontSize:14 },
  nextBtn:   { flex:1, backgroundColor: C.primary, borderRadius:100, paddingVertical:13, alignItems:'center' },
  nextBtnText: { color:'#ffffff', fontFamily: FONT.bold, fontSize:14 },
});

// ── Lead Form Builder Modal ──────────────────────────────────────────────────────
// Reuses the exact same chrome (pm/wpm) as the Ad Preview modal, and the exact
// same design tokens (ws.* field styles) so it feels like one continuous flow.
function LeadFormBuilderModal({
  visible, onClose, onSave,
  fields, onAddField, onUpdateField, onRemoveField,
  onAddOption, onUpdateOption, onRemoveOption,
  submitAction, setSubmitAction,
  whatsappNumber, setWhatsappNumber,
}) {
  const isWeb = Platform.OS === 'web';
  const title = fields.length === 0 ? 'Create Lead Form' : 'Edit Lead Form';

  const renderTypeChips = (field) => (
    <View style={ws.chipsRow}>
      {FIELD_TYPES.map((t) => {
        const sel = field.type === t.id;
        const needsOptions = ['single_choice', 'multi_choice'].includes(t.id);
        return (
          <TouchableOpacity
            key={t.id}
            style={[ws.chip, sel && ws.chipOn]}
            onPress={() => onUpdateField(field.id, {
              type: t.id,
              options: needsOptions ? (field.options.length ? field.options : ['', '']) : field.options,
            })}
            activeOpacity={0.8}
          >
            <Text style={[ws.chipText, sel && ws.chipTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderField = (field, index) => (
    <View key={field.id} style={ws.fieldCard}>
      <View style={ws.fieldCardHeader}>
        <Text style={ws.fieldIndex}>Question {index + 1}</Text>
        <TouchableOpacity onPress={() => onRemoveField(field.id)} style={ws.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={C.danger} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={ws.fieldInput}
        placeholder="Write your question..."
        placeholderTextColor={C.neutral400}
        value={field.question}
        onChangeText={(v) => onUpdateField(field.id, { question: v })}
      />

      <Text style={ws.smallLabel}>Select answer type</Text>
      {renderTypeChips(field)}

      {['single_choice', 'multi_choice'].includes(field.type) && (
        <View style={ws.optionsWrap}>
          <Text style={ws.smallLabel}>Add options for your question</Text>
          {field.options.map((opt, idx) => (
            <View key={idx} style={ws.optionRow}>
              <TextInput
                style={ws.optionInput}
                placeholder="Enter option..."
                placeholderTextColor={C.neutral400}
                value={opt}
                onChangeText={(v) => onUpdateOption(field.id, idx, v)}
              />
              <TouchableOpacity onPress={() => onRemoveOption(field.id, idx)} style={ws.optionRemoveBtn}>
                <Ionicons name="close" size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={ws.addOptionBtn} onPress={() => onAddOption(field.id)} activeOpacity={0.8}>
            <Ionicons name="add" size={15} color={C.primary} />
            <Text style={ws.addOptionText}>Add Option</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={ws.leadFieldRow}
        onPress={() => onUpdateField(field.id, { required: !field.required })}
        activeOpacity={0.8}
      >
        <View style={[ws.leadCheckbox, field.required && ws.leadCheckboxOn]}>
          {field.required && <Ionicons name="checkmark" size={12} color="#fff" />}
        </View>
        <Text style={ws.leadFieldLabel}>Required</Text>
      </TouchableOpacity>
    </View>
  );

  const body = (
    <>
      <ScrollView style={ws.formScroll} contentContainerStyle={ws.formScrollContent} showsVerticalScrollIndicator={false}>
        {fields.length === 0 ? (
          <View style={ws.emptyWrap}>
            <Ionicons name="document-text-outline" size={38} color={C.neutral400} />
            <Text style={ws.emptyText}>Start creating the form by adding fields, click the button below to add a new field</Text>
          </View>
        ) : (
          fields.map((f, i) => renderField(f, i))
        )}

        <TouchableOpacity style={ws.addFieldBtn} onPress={onAddField} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={18} color={C.primary} />
          <Text style={ws.addFieldBtnText}>Add Form Field</Text>
        </TouchableOpacity>

        <View style={ws.submitActionSection}>
          <Text style={ws.sectionTitleSmall}>Form submission action</Text>

          <TouchableOpacity
            style={[ws.radioCard, submitAction === 'thankyou' && ws.radioCardSel]}
            onPress={() => setSubmitAction('thankyou')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={ws.radioTitle}>Show Thank You Page</Text>
              <Text style={ws.radioDesc}>User will see a thank you message after submitting the form</Text>
            </View>
            <View style={ws.radioOuter}>
              {submitAction === 'thankyou' && <View style={ws.radioInnerDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[ws.radioCard, submitAction === 'whatsapp' && ws.radioCardSel]}
            onPress={() => setSubmitAction('whatsapp')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={ws.radioTitle}>Redirect to WhatsApp</Text>
              <Text style={ws.radioDesc}>User will be redirected to message you on WhatsApp after submitting</Text>

              {submitAction === 'whatsapp' && (
                <View style={ws.floatingWrap}>
                  <View style={ws.floatingLabelBox}>
                    <Text style={ws.floatingLabel}>Enter whatsapp number</Text>
                  </View>
                  <TextInput
                    style={ws.floatingInput}
                    placeholder="Eg. 9999999999"
                    placeholderTextColor={C.neutral400}
                    value={whatsappNumber || ''}
                    onChangeText={setWhatsappNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              )}
            </View>
            <View style={ws.radioOuter}>
              {submitAction === 'whatsapp' && <View style={ws.radioInnerDot} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={ws.formFooter}>
        <TouchableOpacity style={ws.saveFormBtn} onPress={onSave} activeOpacity={0.85}>
          <Text style={ws.saveFormBtnText}>Save Form</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isWeb) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={wpm.overlay}>
          <TouchableOpacity style={wpm.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={[wpm.box, { maxHeight: '85vh' }]}>
            <View style={wpm.header}>
              <TouchableOpacity onPress={onClose} style={wpm.backBtn}>
                <Ionicons name="arrow-back" size={18} color="#111111" />
              </TouchableOpacity>
              <Text style={wpm.headerTitle}>{title}</Text>
              <View style={{ width: 34 }} />
            </View>
            {body}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={[pm.sheet, { maxHeight: '90%' }]}>
          <View style={pm.handle} />
          <View style={pm.header}>
            <TouchableOpacity onPress={onClose} style={pm.backBtn}>
              <Ionicons name="arrow-back" size={20} color={C.textBody} />
            </TouchableOpacity>
            <Text style={pm.headerTitle}>{title}</Text>
          </View>
          {body}
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function AdvertiseScreen({ navigation, route }) {
  // ============================================================
  // ALL HOOKS MUST BE CALLED FIRST, UNCONDITIONALLY, EVERY RENDER
  // ============================================================
  const [fontsLoaded] = useFonts({
    Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black,
  });

const editAd = route?.params?.editAd || null;
  const isEditing = Boolean(editAd?.id);
  const { showToast } = useToast();

  // ── Agar subscription/credits nahi hai to form dikhane se pehle hi AdPlans pe bhej do ──
  useEffect(() => {
    if (isEditing) return;
    let active = true;
    (async () => {
      const adSummary = await UserStore.getAdCreditsSummary();
      const hasCredits = adSummary && !adSummary.expired && adSummary.credits > 0;
      if (active && !hasCredits) {
        showToast('Please take a subscription to post an advertisement.', 'info');
        navigation.replace ? navigation.replace('AdPlans') : navigation.navigate('AdPlans');
      }
    })();
    return () => { active = false; };
  }, [isEditing]);

  const [photo, setPhoto] = useState(editAd?.photo || null);
  const [title, setTitle] = useState(editAd?.title || '');

  // ✅ FIX: preview ke "Call" button ke liye — jis number se user ne account
  // banaya/login kiya hai (registered mobile), wahi yaha use hoga, koi hardcoded
  // ya manual number nahi.
  const [userMobile, setUserMobile] = useState('');
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await UserStore.getCurrentUser();
        if (active) setUserMobile(user?.mobile || user?.contact_number || '');
      } catch { /* Call button bas hide ho jayega agar number na mile */ }
    })();
    return () => { active = false; };
  }, []);

  const [leadFormFields, setLeadFormFields] = useState(
    editAd?.extraValues?.lead_form_fields || []
  );
  const [leadFormSubmitAction, setLeadFormSubmitAction] = useState(
    editAd?.extraValues?.lead_form_submit_action || 'thankyou'
  );
  const [showLeadFormBuilder, setShowLeadFormBuilder] = useState(false);

  const addFormField = () => {
    setLeadFormFields((prev) => [...prev, {
      id: makeFieldId(),
      question: '',
      type: 'short_answer',
      required: true,
      options: [],
    }]);
  };
  const updateFormField = (id, patch) => {
    setLeadFormFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };
  const removeFormField = (id) => {
    setLeadFormFields((prev) => prev.filter((f) => f.id !== id));
  };
  const addFieldOption = (id) => {
    setLeadFormFields((prev) => prev.map((f) => (f.id === id ? { ...f, options: [...f.options, ''] } : f)));
  };
  const updateFieldOption = (id, idx, value) => {
    setLeadFormFields((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const options = [...f.options];
      options[idx] = value;
      return { ...f, options };
    }));
  };
  const removeFieldOption = (id, idx) => {
    setLeadFormFields((prev) => prev.map((f) => (
      f.id === id ? { ...f, options: f.options.filter((_, i) => i !== idx) } : f
    )));
  };

  const [description, setDescription] = useState(editAd?.description || '');
  const [selectedRedirect, setSelectedRedirect] = useState(editAd?.redirect || 'whatsapp');
  const [extraValues, setExtraValues] = useState(editAd?.extraValues || {});
  const [allowCalls, setAllowCalls] = useState(editAd?.allowCalls !== undefined ? Boolean(editAd.allowCalls) : true);
  const [showPreview, setShowPreview] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const mobileScrollRef = useRef(null);
  const webScrollRef = useRef(null);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const tutorialPlayer = useVideoPlayer(
    { uri: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    (player) => {
      player.loop = false;
    }
  );

  useEffect(() => {
    if (!editAd) return;
    setPhoto(editAd.photo || null);
    setTitle(editAd.title || '');
    setDescription(editAd.description || '');
    setSelectedRedirect(editAd.redirect || 'whatsapp');
    setExtraValues(editAd.extraValues || {});
    setAllowCalls(editAd.allowCalls !== undefined ? Boolean(editAd.allowCalls) : true);
    setLeadFormFields(editAd.extraValues?.lead_form_fields || []);
    setLeadFormSubmitAction(editAd.extraValues?.lead_form_submit_action || 'thankyou');
  }, [editAd]);

  // Keep an unfinished ad while the user is sent to buy credits. The draft
  // includes the selected image and all redirect / lead-form values.
  useEffect(() => {
    if (isEditing) return;
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AD_DRAFT_KEY);
        if (!raw || !active) return;
        const draft = JSON.parse(raw);
        setPhoto(draft.photo || null); setTitle(draft.title || '');
        setDescription(draft.description || ''); setSelectedRedirect(draft.selectedRedirect || 'whatsapp');
        setExtraValues(draft.extraValues || {}); setAllowCalls(draft.allowCalls !== false);
        setLeadFormFields(Array.isArray(draft.leadFormFields) ? draft.leadFormFields : []);
        setLeadFormSubmitAction(draft.leadFormSubmitAction || 'thankyou');
      } catch { /* Ignore an invalid/old draft. */ }
    })();
    return () => { active = false; };
  }, [isEditing]);

  const saveDraft = async () => {
    await AsyncStorage.setItem(AD_DRAFT_KEY, JSON.stringify({
      photo, title, description, selectedRedirect, extraValues, allowCalls,
      leadFormFields, leadFormSubmitAction,
    }));
  };

  // ============================================================
  // Everything above this line is a hook — safe to bail out now.
  // ============================================================
  if (!fontsLoaded) return null;

  const webWidth = getResponsiveWindowWidth(windowWidth);
  const isWebSmall = Platform.OS === 'web' && webWidth < 920;
  const isWebCompact = Platform.OS === 'web' && webWidth < 720;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      setTimeout(() => {
        (Platform.OS === 'web' ? webScrollRef : mobileScrollRef).current?.scrollTo({ y: 360, animated: true });
        titleInputRef.current?.focus();
      }, 180);
    }
  };

  const handleNext = async () => {
    if (!photo) {
      Alert.alert('Required', 'Please add an advertisement photo.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please write an advertisement title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please write a description.');
      return;
    }
    if (selectedRedirect === 'whatsapp' && !isValidIndianMobileNumber(extraValues.whatsapp_number)) {
      showToast('Please enter a valid 10 digit WhatsApp number.', 'error');
      return;
    }
    if (selectedRedirect === 'website' && !String(extraValues.website_url || '').trim()) {
      showToast('Please enter your website link.', 'error');
      return;
    }
    if (selectedRedirect === 'shop' && !String(extraValues.shop_url || '').trim()) {
      showToast('Please enter your shop link.', 'error');
      return;
    }

    // if (selectedRedirect === 'lead_form') {
    //   if (leadFormFields.length === 0) {
    //     showToast('Please create your lead form first.', 'error');
    //     return;
    //   }
    //   const incomplete = leadFormFields.some((f) => (
    //     !f.question.trim()
    //     || (['single_choice', 'multi_choice'].includes(f.type) && f.options.filter((o) => o.trim()).length < 2)
    //   ));
    //   if (incomplete) {
    //     showToast('Please complete all form fields before continuing.', 'error');
    //     return;
    //   }
    //   if (leadFormSubmitAction === 'whatsapp' && !isValidIndianMobileNumber(extraValues.lead_form_whatsapp)) {
    //     showToast('Please enter a valid 10 digit WhatsApp number for the form.', 'error');
    //     return;
    //   }
    // }

    if (!isEditing) {
      const adSummary = await UserStore.getAdCreditsSummary();
      const hasCredits = adSummary && !adSummary.expired && adSummary.credits > 0;

      if (!hasCredits) {
        await saveDraft();
        showToast('Please take a subscription to post an advertisement.', 'info');
        setTimeout(() => {
          navigation.navigate('AdPlans');
        }, 1200);
        return;
      }
    }
    setShowPreview(true);
  };

  const handlePreviewNext = async () => {
    setShowPreview(false);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (isEditing) {
      const spendAdCredit = UserStore.useAdCredit;
      const result = await spendAdCredit('edit', {
        id:          editAd.id,
        title:       title.trim(),
        description: description.trim(),
        photo,
        redirect:    selectedRedirect,
        extraValues: {
          ...extraValues,
          lead_form_fields: leadFormFields,
          lead_form_submit_action: leadFormSubmitAction,
        },
        allowCalls,
      });

      if (!result.ok) {
        Alert.alert('Unable to Update', result.message || 'Unable to update ad.');
        return;
      }

      showToast('Ad updated successfully. 1 credit has been used.', 'success');
      navigation.navigate('MyAds');
      return;
    }

    navigation.navigate('ChoosePlan', {
      adData: {
        photo,
        title,
        description,
        redirect: selectedRedirect,
        extraValues: {
          ...extraValues,
          lead_form_fields: leadFormFields,
          lead_form_submit_action: leadFormSubmitAction,
        },
        allowCalls
      },
      showSubscriptionToast: true,
    });
  };

  // ── Redirect option row (shared by mobile + web) ─────────────────────────────
  const renderRedirectOption = (opt, styles) => {
    const sel = selectedRedirect === opt.id;
    return (
      <TouchableOpacity
        key={opt.id}
        style={styles.radioCard}
        onPress={() => setSelectedRedirect(opt.id)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.radioTitle}>{opt.title}</Text>
          <Text style={styles.radioDesc}>{opt.desc}</Text>

          {sel && opt.extra && (
            <View style={styles.floatingWrap}>
              <View style={styles.floatingLabelBox}>
                <Text style={styles.floatingLabel}>
                  {opt.extra === 'whatsapp_number' ? 'Enter whatsapp number'
                    : opt.extra === 'website_url' ? 'Enter website link' : 'Enter shop link'}
                </Text>
              </View>
              <TextInput
                style={styles.floatingInput}
                placeholder={opt.extra === 'whatsapp_number' ? 'Eg. 9999999999' : 'https://...'}
                placeholderTextColor={C.neutral400}
                value={extraValues[opt.extra] || ''}
                onChangeText={(v) => setExtraValues(p => buildNextExtraValues(opt.extra, v, p))}
                keyboardType={opt.extra === 'whatsapp_number' ? 'phone-pad' : 'url'}
                maxLength={opt.extra === 'whatsapp_number' ? 10 : undefined}
              />
            </View>
          )}

          {/* {sel && opt.id === 'lead_form' && (
            <View style={styles.floatingWrap}>
              <Text style={styles.extraLabelPlain}>
                {leadFormFields.length === 0
                  ? 'Start creating the form by adding fields'
                  : `${leadFormFields.length} field${leadFormFields.length > 1 ? 's' : ''} added to your form`}
              </Text>
              <TouchableOpacity
                style={styles.createFormBtn}
                onPress={() => setShowLeadFormBuilder(true)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={leadFormFields.length === 0 ? 'add-circle-outline' : 'create-outline'}
                  size={16}
                  color={C.primary}
                />
                <Text style={styles.createFormBtnText}>
                  {leadFormFields.length === 0 ? 'Create Lead Form' : 'Edit Lead Form'}
                </Text>
              </TouchableOpacity>
            </View>
          )} */}
        </View>

        {/* native-style radio dot, right aligned — matches source's <input type=radio> */}
        <View style={styles.radioOuter}>
          {sel && <View style={styles.radioInnerDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  // ── WEB LAYOUT ─────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={ws.root}>
        <View style={[ws.topBar, isWebCompact && ws.topBarCompact]}>
          <TouchableOpacity style={ws.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color={C.primaryDark} />
          </TouchableOpacity>
          <Text style={[ws.topBarTitle, isWebCompact && ws.topBarTitleCompact]}>Fill advertisement information below</Text>
        </View>

        <ScrollView ref={webScrollRef} style={ws.scroll} contentContainerStyle={[ws.scrollContent, isWebCompact && ws.scrollContentCompact]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
          <View style={ws.innerWrap}>

            <View style={[ws.tutorialCard, isWebSmall && ws.tutorialCardFull]}>
              <VideoView player={tutorialPlayer} style={ws.tutorialVideo} nativeControls contentFit="cover" />
              <View style={ws.tutorialVideoTag}>
                <Ionicons name="play-circle" size={13} color={C.primary} />
                <Text style={ws.tutorialVideoTagText}>How to advertise — watch this</Text>
              </View>
            </View>

            {/* 1. Photo/Video */}
            <View style={ws.section}>
              <SectionLabel number="1" title="Select Advertisement Photo or Video" />
              <Text style={ws.subLabel}>Add photo or video of visiting card, shop, pamphlet, or poster</Text>
              <TouchableOpacity style={ws.uploadOuter} onPress={handlePickPhoto} activeOpacity={0.85}>
                {photo ? (
                  <>
                    <Image source={{ uri: photo }} style={ws.photoPreview} resizeMode="cover" />
                    <TouchableOpacity style={ws.changeOverlay} onPress={handlePickPhoto}>
                      <Ionicons name="pencil" size={13} color="#fff" />
                      <Text style={ws.changeOverlayText}>Change Image/Video</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={ws.uploadInnerDashed}>
                    <MaterialIcons name="add-photo-alternate" size={44} color={C.primary} />
                    <Text style={ws.uploadCaption}>Add Advertisement Photo or Video (jpeg/png/mp4)</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* 2. Title */}
            <View style={ws.section}>
              <SectionLabel number="2" title="Write Advertisement Title" />
              <Text style={ws.subLabel}>Add a main headline for your promotion or advertisement</Text>
              <TextInput
                ref={titleInputRef}
                style={ws.input}
                placeholder="Eg. Best Electronics Shop in your area"
                placeholderTextColor={C.neutral400}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
                returnKeyType="next"
                onSubmitEditing={() => descriptionInputRef.current?.focus()}
              />
              <InfoHint text="Headline should not exceed 200 characters" />
            </View>

            {/* 3. Description */}
            <View style={ws.section}>
              <SectionLabel number="3" title="Write Description For Advertisement" />
              <Text style={ws.subLabel}>Add promotional message for this advertisment</Text>
              <TextInput
                ref={descriptionInputRef}
                style={ws.inputMulti}
                placeholder="Eg. We sell washing machines, air conditioner and televisions."
                placeholderTextColor={C.neutral400}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={2000}
              />
              <InfoHint text="Promotion Message should not exceed 2000 characters" />
            </View>

            {/* 4. Redirect */}
            <View style={ws.section}>
              <SectionLabel number="4" title="Redirect users on advertisement banner click to:" />
              <View style={{ marginTop: 8, gap: 10 }}>
                {REDIRECT_OPTIONS.map((opt) => renderRedirectOption(opt, ws))}
              </View>
            </View>

            {/* Allow contact */}
            <View style={ws.section}>
              <TouchableOpacity style={ws.checkRow} onPress={() => setAllowCalls(!allowCalls)} activeOpacity={0.8}>
                <View style={[ws.checkbox, allowCalls && ws.checkboxOn]}>
                  {allowCalls && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ws.checkLabel}>Allow people to call you</Text>
                  <Text style={ws.checkHint}>A call button will be shown under your advertisement</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[ws.nextBtn, isWebSmall && ws.nextBtnFull]} onPress={handleNext} activeOpacity={0.85}>
              <Text style={ws.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AdPreviewModal
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          onNext={handlePreviewNext}
          adData={{ photo, title, description, redirect: selectedRedirect }}
          userMobile={userMobile}
        />

        <LeadFormBuilderModal
          visible={showLeadFormBuilder}
          onClose={() => setShowLeadFormBuilder(false)}
          onSave={() => setShowLeadFormBuilder(false)}
          fields={leadFormFields}
          onAddField={addFormField}
          onUpdateField={updateFormField}
          onRemoveField={removeFormField}
          onAddOption={addFieldOption}
          onUpdateOption={updateFieldOption}
          onRemoveOption={removeFieldOption}
          submitAction={leadFormSubmitAction}
          setSubmitAction={setLeadFormSubmitAction}
          whatsappNumber={extraValues.lead_form_whatsapp || ''}
          setWhatsappNumber={(v) => setExtraValues((p) => ({ ...p, lead_form_whatsapp: normalizeIndianMobileNumber(v) }))}
        />
      </View>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backRow} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Fill advertisement information below</Text>
      </View>

      <ScrollView ref={mobileScrollRef} style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
        <View style={s.videoWrapper}>
          <VideoView player={tutorialPlayer} style={s.video} nativeControls contentFit="cover" />
          <View style={s.videoTag}>
            <Ionicons name="play-circle" size={13} color={C.primary} />
            <Text style={s.videoTagText}>How to advertise — watch this</Text>
          </View>
        </View>

        {/* 1. Photo/Video */}
        <View style={s.section}>
          <SectionLabel number="1" title="Select Advertisement Photo or Video" />
          <Text style={s.subLabel}>Add photo or video of visiting card, shop, pamphlet, or poster</Text>
          <TouchableOpacity style={s.uploadOuter} onPress={handlePickPhoto} activeOpacity={0.85}>
            {photo ? (
              <>
                <Image source={{ uri: photo }} style={s.photoPreview} resizeMode="cover" />
                <TouchableOpacity style={s.changeOverlay} onPress={handlePickPhoto}>
                  <Ionicons name="pencil" size={12} color="#fff" />
                  <Text style={s.changeOverlayText}>Change</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={s.uploadInnerDashed}>
                <MaterialIcons name="add-photo-alternate" size={44} color={C.primary} />
                <Text style={s.uploadCaption}>Add Advertisement Photo or Video (jpeg/png/mp4)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Title */}
        <View style={s.section}>
          <SectionLabel number="2" title="Write Advertisement Title" />
          <Text style={s.subLabel}>Add a main headline for your promotion or advertisement</Text>
          <TextInput
            ref={titleInputRef}
            style={s.input}
            placeholder="Eg. Best Electronics Shop in your area"
            placeholderTextColor={C.neutral400}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            returnKeyType="next"
            onSubmitEditing={() => descriptionInputRef.current?.focus()}
          />
          <InfoHint text="Headline should not exceed 200 characters" />
        </View>

        {/* 3. Description */}
        <View style={s.section}>
          <SectionLabel number="3" title="Write Description For Advertisement" />
          <Text style={s.subLabel}>Add promotional message for this advertisment</Text>
          <TextInput
            ref={descriptionInputRef}
            style={s.inputMulti}
            placeholder="Eg. We sell washing machines, air conditioner and televisions."
            placeholderTextColor={C.neutral400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
          />
          <InfoHint text="Promotion Message should not exceed 2000 characters" />
        </View>

        {/* 4. Redirect */}
        <View style={s.section}>
          <SectionLabel number="4" title="Redirect users on advertisement banner click to:" />
          <View style={{ marginTop: 8, gap: 10 }}>
            {REDIRECT_OPTIONS.map((opt) => renderRedirectOption(opt, s))}
          </View>
        </View>

        {/* Allow contact */}
        <View style={s.section}>
          <TouchableOpacity style={s.checkRow} onPress={() => setAllowCalls(!allowCalls)} activeOpacity={0.8}>
            <View style={[s.checkbox, allowCalls && s.checkboxOn]}>
              {allowCalls && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.checkLabel}>Allow people to call you</Text>
              <Text style={s.checkHint}>A call button will be shown under your advertisement</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdPreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onNext={handlePreviewNext}
        adData={{ photo, title, description, redirect: selectedRedirect }}
        userMobile={userMobile}
      />

      <LeadFormBuilderModal
        visible={showLeadFormBuilder}
        onClose={() => setShowLeadFormBuilder(false)}
        onSave={() => setShowLeadFormBuilder(false)}
        fields={leadFormFields}
        onAddField={addFormField}
        onUpdateField={updateFormField}
        onRemoveField={removeFormField}
        onAddOption={addFieldOption}
        onUpdateOption={updateFieldOption}
        onRemoveOption={removeFieldOption}
        submitAction={leadFormSubmitAction}
        setSubmitAction={setLeadFormSubmitAction}
        whatsappNumber={extraValues.lead_form_whatsapp || ''}
        setWhatsappNumber={(v) => setExtraValues((p) => ({ ...p, lead_form_whatsapp: normalizeIndianMobileNumber(v) }))}
      />
    </View>
  );
}

// ── Shared style pieces reused by mobile (s) + web (ws) ─────────────────────────
const sharedRedirect = {
  radioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.neutral400,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  radioTitle: { fontSize: 12, fontFamily: FONT.bold, color: C.textBody },
  radioDesc:  { marginTop: 4, fontSize: 11, fontFamily: FONT.medium, color: C.textSub, lineHeight: 15 },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: C.neutral400,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  radioInnerDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary },
  floatingWrap: { marginTop: 12 },
  floatingLabelBox: { position: 'absolute', top: -8, left: 10, backgroundColor: C.white, paddingHorizontal: 6, zIndex: 1 },
  floatingLabel: { fontSize: 11, fontFamily: FONT.bold, color: C.textBody },
  floatingInput: {
    borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 12, color: C.textBody, backgroundColor: C.white,
  },
  extraLabelPlain: { fontSize: 11, fontFamily: FONT.bold, color: C.textBody, marginBottom: 4 },
  leadFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  leadCheckbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: C.dashedBorder, alignItems: 'center', justifyContent: 'center' },
  leadCheckboxOn: { backgroundColor: C.green, borderColor: C.green },
  leadFieldLabel: { fontSize: 12, fontFamily: FONT.regular, color: C.textBody },

  // "Create/Edit Lead Form" pill button shown under the Lead Form redirect option
  createFormBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: C.primary, borderRadius: 100,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start',
    backgroundColor: C.uploadBg,
  },
  createFormBtnText: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },

  // ── Lead Form Builder modal — field cards, type chips, options ──────────────
  formScroll: { paddingHorizontal: 16 },
  formScrollContent: { paddingTop: 16, paddingBottom: 24 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: C.textSub, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },

  fieldCard: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 14, marginBottom: 14,
  },
  fieldCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  fieldIndex: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },
  deleteBtn: { padding: 4, borderRadius: 6 },

  fieldInput: {
    borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 12, color: C.textBody,
    backgroundColor: C.white, marginBottom: 10,
  },

  smallLabel: { fontSize: 11, fontFamily: FONT.bold, color: C.textBody, marginBottom: 6, marginTop: 2 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: C.neutral400, backgroundColor: C.white,
  },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 11, fontFamily: FONT.medium, color: C.textBody },
  chipTextOn: { color: C.white, fontFamily: FONT.bold },

  optionsWrap: { marginTop: 10, marginBottom: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionInput: {
    flex: 1, borderWidth: 1, borderColor: C.dashedBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: C.textBody, backgroundColor: C.white,
  },
  optionRemoveBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.uploadBg,
  },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 2 },
  addOptionText: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },

  addFieldBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.primary,
    borderRadius: 10, paddingVertical: 14, marginTop: 4, marginBottom: 22,
    backgroundColor: C.uploadBg,
  },
  addFieldBtnText: { fontSize: 13, fontFamily: FONT.bold, color: C.primary },

  submitActionSection: { gap: 10 },
  sectionTitleSmall: { fontSize: 13, fontFamily: FONT.bold, color: C.textBody, marginBottom: 2 },
  radioCardSel: { borderColor: C.primary, backgroundColor: C.uploadBg },

  formFooter: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.headerBorder, backgroundColor: C.white,
  },
  saveFormBtn: { backgroundColor: C.primary, borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  saveFormBtnText: { color: C.white, fontSize: 15, fontFamily: FONT.bold },
};

// ── Mobile Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  ...sharedRedirect,

  root: { flex: 1, backgroundColor: C.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: HEADER_TOP,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
  },
  backRow:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginLeft: -6 },
  headerTitle: { flex: 1, fontSize: 15, fontFamily: FONT.bold, color: C.textMain },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48, paddingTop: 8 },

  videoWrapper: { width: SW, backgroundColor: '#000' },
  video: { width: SW, height: Math.round(SW * 9 / 16) },
  videoTag: {
    position: 'absolute', bottom: 10, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  videoTagText: { color: '#fff', fontSize: 11, fontFamily: FONT.medium },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  subLabel: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, marginTop: -6, marginBottom: 10 },

  uploadOuter: {
    width: '100%',
    minHeight: 150,
    backgroundColor: C.uploadBg,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 10,
  },
  uploadInnerDashed: {
    flex: 1,
    minHeight: 130,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.dashedBorder,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  uploadCaption: { fontSize: 12, fontFamily: FONT.regular, color: C.textBody, textAlign: 'center', paddingHorizontal: 16 },
  photoPreview: { width: '100%', height: 190, borderRadius: 8 },
  changeOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,
  },
  changeOverlayText: { color: '#fff', fontSize: 11, fontFamily: FONT.medium },

  input: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 8,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 12,
    color: C.textBody,
  },
  inputMulti: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 8,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 12,
    color: C.textBody,
  },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 18, height: 18, marginTop: 2, borderRadius: 4,
    borderWidth: 1.5, borderColor: C.neutral400,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkLabel: { fontSize: 14, fontFamily: FONT.bold, color: C.textBody },
  checkHint:  { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, marginTop: 2 },

  nextBtn: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
    backgroundColor: C.primary,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { color: C.white, fontSize: 15, fontFamily: FONT.bold, textAlign: 'center' },
});

// ── Web Styles ─────────────────────────────────────────────────────────────────
const ws = StyleSheet.create({
  ...sharedRedirect,

  root: { flex: 1, backgroundColor: C.bg, minHeight: '100vh' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: C.headerBorder,
  },
  topBarCompact: { paddingHorizontal: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontFamily: FONT.bold, color: C.textMain },
  topBarTitleCompact: { flexShrink: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60, alignItems: 'center' },
  scrollContentCompact: { paddingHorizontal: 0 },
  innerWrap: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingTop: 24 },

  tutorialCard: {
    width: '100%', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.headerBorder, backgroundColor: '#000', position: 'relative',
  },
  tutorialCardFull: { width: '100%' },
  tutorialVideo: { width: '100%', height: 220, minHeight: 180 },
  tutorialVideoTag: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  tutorialVideoTagText: { color: '#fff', fontSize: 11, fontFamily: FONT.medium },

  section: { paddingTop: 24 },
  subLabel: { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, marginTop: -6, marginBottom: 10 },

  uploadOuter: {
    width: '100%', minHeight: 160,
    backgroundColor: C.uploadBg, borderWidth: 1, borderColor: C.primary,
    borderRadius: 8, overflow: 'hidden', padding: 12,
  },
  uploadInnerDashed: {
    flex: 1, minHeight: 140,
    borderWidth: 1, borderStyle: 'dashed', borderColor: C.dashedBorder, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24,
  },
  uploadCaption: { fontSize: 13, fontFamily: FONT.regular, color: C.textBody, textAlign: 'center', paddingHorizontal: 16 },
  photoPreview: { width: '100%', height: 220, borderRadius: 8 },
  changeOverlay: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,
  },
  changeOverlayText: { color: '#fff', fontSize: 11, fontFamily: FONT.medium },

  input: {
    minHeight: 40, borderWidth: 1, borderColor: C.primary, borderRadius: 8,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 14, fontSize: 13, color: C.textBody,
  },
  inputMulti: {
    minHeight: 40, borderWidth: 1, borderColor: C.primary, borderRadius: 8,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 14, fontSize: 13, color: C.textBody,
  },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 18, height: 18, marginTop: 2, borderRadius: 4,
    borderWidth: 1.5, borderColor: C.neutral400, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkLabel: { fontSize: 14, fontFamily: FONT.bold, color: C.textBody },
  checkHint:  { fontSize: 11, fontFamily: FONT.medium, color: C.textSub, marginTop: 2 },

  nextBtn: {
    marginTop: 30, marginBottom: 16,
    backgroundColor: C.primary, borderRadius: 100, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  nextBtnFull: { width: '100%' },
  nextBtnText: { color: '#ffffff', fontSize: 15, fontFamily: FONT.bold },
});