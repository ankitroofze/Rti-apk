import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, FlatList, TextInput, Alert,
  Platform, StatusBar, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INDIAN_STATES, getDistricts } from '../pages/locationData';
import { UserStore } from '../store/UserStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Theme ──────────────────────────────────────────────────────────────────────
// This matches the web design system used on shuru.co.in (see promotion/form page):
//   • Font family: "Poppins" everywhere
//   • Primary color: the brand orange used for buttons, borders & accents
//   • Inputs / dropdowns: rounded-md (6px) border-radius with a solid primary border
const FONT = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

const RADIUS = {
  input: 6,   // Tailwind "rounded-md" used on all form inputs/dropdowns in the source
  card: 12,
  pill: 999,
};

const C = {
  primary:       '#ea580c',
  primaryDark:   '#C8700F',
  primaryLight:  '#FFF7ED',
  primaryBorder: '#FFE8D6',
  orange:        '#ea580c',
  orangeLight:   '#FFF7ED',
  orangeBorder:  '#FFE8D6',
  orangeMid:     '#FBCFA0',
  green:       '#16a34a',
  greenLight:  '#f0fdf4',
  greenBorder: '#bbf7d0',
  white:       '#ffffff',
  bg:          '#ffffff',
  text:        '#0f172a',
  textSub:     '#6B6B6B',
  border:      '#FFE8D6',
  red:         '#ef4444',
  redLight:    '#FDF1F1',
};

const HEADER_TOP = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 24) + 10
  : 54;

// ── Duration Plans ─────────────────────────────────────────────────────────────
const DURATION_PLANS = [
  { id: '1d',  label: '1 Day'   },
  { id: '3d',  label: '3 Days'  },
  { id: '7d',  label: '7 Days'  },
  { id: '15d', label: '15 Days' },
  { id: '30d', label: '1 Month' },
];

const PRICE_MATRIX = {
  district: { home: 150,  full: 250  },
  state:    { home: 450,  full: 750  },
  india:    { home: 2999, full: 4999 },
};

const daysMap = { '1d': 1, '3d': 3, '7d': 7, '15d': 15, '30d': 30 };

// ── Dropdown Modal ─────────────────────────────────────────────────────────────
function DropdownModal({ visible, title, items, selected, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const isWeb = Platform.OS === 'web';
  const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()));

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={wdm.overlay}>
          <TouchableOpacity style={wdm.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={wdm.box}>
            {/* Header */}
            <View style={wdm.header}>
              <Text style={wdm.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={wdm.closeBtn}>
                <Ionicons name="close" size={18} color={C.textSub} />
              </TouchableOpacity>
            </View>
            {/* Search */}
            <View style={wdm.searchWrap}>
              <Ionicons name="search-outline" size={15} color={C.primary} />
              <TextInput
                style={wdm.searchInput}
                placeholder="Search..."
                placeholderTextColor={C.orangeMid}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={15} color="#AAAAAA" />
                </TouchableOpacity>
              )}
            </View>
            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={i => i}
              showsVerticalScrollIndicator={false}
              style={wdm.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[wdm.item, selected === item && wdm.itemSel]}
                  onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                >
                  <Text style={[wdm.itemText, selected === item && wdm.itemTextSel]}>{item}</Text>
                  {selected === item && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // MOBILE — same as before
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dm.overlay} activeOpacity={1} onPress={onClose} />
      <View style={dm.sheet}>
        <View style={dm.handle} />
        <Text style={dm.title}>{title}</Text>
        <View style={dm.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.primary} />
          <TextInput
            style={dm.searchInput}
            placeholder="Search..."
            placeholderTextColor={C.orangeMid}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={i => i}
          showsVerticalScrollIndicator={false}
          style={dm.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[dm.item, selected === item && dm.itemSel]}
              onPress={() => { onSelect(item); onClose(); setSearch(''); }}
            >
              <Text style={[dm.itemText, selected === item && dm.itemTextSel]}>{item}</Text>
              {selected === item && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}
const dm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  handle:      { width: 44, height: 4, backgroundColor: C.border, borderRadius: RADIUS.pill, alignSelf: 'center', marginBottom: 14 },
  title:       { fontSize: 16, fontFamily: FONT.bold, color: C.text, marginBottom: 12, textAlign: 'center' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.input, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FONT.regular, color: C.text, padding: 0 },
  list:        { maxHeight: 340 },
  item:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderRadius: RADIUS.input, marginBottom: 2 },
  itemSel:     { backgroundColor: C.orangeLight },
  itemText:    { fontSize: 13, color: C.textSub, fontFamily: FONT.medium },
  itemTextSel: { color: C.primary, fontFamily: FONT.semiBold },
});

const wdm = StyleSheet.create({
  overlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding:24 },
  backdrop:  { position:'absolute', top:0, left:0, right:0, bottom:0 },
  box:       { width:'100%', maxWidth:460, backgroundColor:'#ffffff', borderRadius:16, overflow:'hidden', maxHeight:520 },

  header:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor: C.border },
  title:     { fontSize:16, fontFamily: FONT.bold, color:'#111111' },
  closeBtn:  { width:32, height:32, borderRadius: RADIUS.input, backgroundColor: C.orangeLight, alignItems:'center', justifyContent:'center' },

  searchWrap:  { flexDirection:'row', alignItems:'center', gap:8, backgroundColor: C.orangeLight, borderWidth:1, borderColor: C.border, borderRadius: RADIUS.input, paddingHorizontal:12, paddingVertical:10, margin:14, marginBottom:6 },
  searchInput: { flex:1, fontSize:13, fontFamily: FONT.regular, color:'#111111', padding:0 },

  list:        { maxHeight:360 },
  item:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:13, paddingHorizontal:20, borderBottomWidth:1, borderBottomColor: C.orangeLight },
  itemSel:     { backgroundColor: C.orangeLight },
  itemText:    { fontSize:13, color:'#555555', fontFamily: FONT.medium },
  itemTextSel: { color: C.primary, fontFamily: FONT.semiBold },
});

// ── Step Header ────────────────────────────────────────────────────────────────
function StepHeader({ number, label }) {
  return (
    <View style={sh.row}>
      <View style={sh.badge}><Text style={sh.num}>{number}</Text></View>
      <Text style={sh.label}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  num:   { color: '#fff', fontSize: 14, fontFamily: FONT.bold },
  label: { fontSize: 16, fontFamily: FONT.bold, color: C.text },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ChoosePlanScreen({ navigation, route }) {
  const adData = route?.params?.adData || {};
const { width: winWidth } = useWindowDimensions();
const isMobileWeb = Platform.OS === 'web' && winWidth < 768;

  const [selState,    setSelState]    = useState('');
  const [selDistrict, setSelDistrict] = useState('');
  const [stateModal,  setStateModal]  = useState(false);
  const [distModal,   setDistModal]   = useState(false);
  const [promoteScope, setPromoteScope] = useState('district');
  const [placement, setPlacement]       = useState('full');
  const [duration, setDuration]         = useState('');
  const [showSuccess, setShowSuccess]   = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const formatDateStr = (d) =>
    `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;

  const toInputDateValue = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const startDate = formatDateStr(selectedDate);

  const handleWebDateChange = (e) => {
    const val = e.target.value; // "YYYY-MM-DD"
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  const handleNativeDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const districtList = selState ? getDistricts(selState) : [];

  const promoteOptions = useMemo(() => {
    const opts = [];
    if (selDistrict) opts.push({ id: 'district', label: selDistrict, priceDay: null, free: true });
    if (selState)    opts.push({ id: 'state',    label: selState,    priceDay: PRICE_MATRIX.state[placement] });
    opts.push(        { id: 'india',    label: 'India',         priceDay: PRICE_MATRIX.india[placement] });
    return opts;
  }, [selState, selDistrict, placement]);

  const pricePerDay = promoteScope === 'district' ? 0
    : promoteScope === 'state' ? PRICE_MATRIX.state[placement]
    : PRICE_MATRIX.india[placement];

  const totalCharge = duration ? pricePerDay * (daysMap[duration] || 0) : null;

  const showSuccessToast = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleBuy = async () => {
    if (!selState)    { Alert.alert('Required', 'Please select your state.'); return; }
    if (!selDistrict) { Alert.alert('Required', 'Please select your city/district.'); return; }
    // Promotion scope, placement and duration are temporarily disabled in the UI.
    // Keep safe defaults so posting an ad continues to work without those inputs.
    const promotionScope = promoteScope || 'district';
    const selectedPlacement = placement || 'home';

 // ── Save ad to UserStore ──
    if (adData && adData.title) {
      const postResult = await UserStore.useAdCredit('post', {
        title:       adData.title,
        description: adData.description,
        photo:       adData.photo,
        redirect:    adData.redirect,
        adsSubId:    adData.adsSubId || (selectedPlacement === 'full' ? 1 : 2),
        redirection: adData.redirection || adData.redirect || 'profile',
        extraValues:  adData.extraValues,
        allowCalls:   adData.allowCalls,
        scope:       promotionScope,
        placement:   selectedPlacement,
        duration:    duration,
        durationDays: daysMap[duration] || 30,
        startDate:   toInputDateValue(selectedDate),
        state:       selState,
        district:    selDistrict,
      });
      if (!postResult?.ok) {
        Alert.alert('Unable to post advertisement', postResult?.message || 'Please try again.');
        return;
      }
      await AsyncStorage.removeItem('rti-advertisement-draft');
    }

    if (promotionScope === 'district') {
      showSuccessToast(`🎉 Free Promotion Activated! Your ad is now promoted in ${selDistrict} for FREE!`);
      setTimeout(() => navigation.navigate('MyAds'), 3000);
      return;
    }

    const scopeLabel     = promotionScope === 'state' ? selState : 'All of India';
    const placementLabel = selectedPlacement === 'full' ? 'Full Page' : 'Home Page';
    const durationLabel  = DURATION_PLANS.find(p => p.id === duration)?.label || duration;

    showSuccessToast(`✅ Promotion Activated! Your ad is now live on ${scopeLabel} — ${placementLabel} for ${durationLabel}.`);
    setTimeout(() => navigation.navigate('MyAds'), 3000);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={ws.root}>
        {/* Top Bar */}
        <View style={[ws.topBar, isMobileWeb && { paddingHorizontal: 12 }]}>
          <TouchableOpacity style={ws.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color={C.primaryDark} />
            <Text style={ws.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={ws.topBarTitle}>Choose Your Plan</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Success Toast */}
        {showSuccess && (
          <View style={ws.toast}>
            <Ionicons name="checkmark-circle" size={20} color={C.green} />
            <Text style={ws.toastText}>{successMessage}</Text>
            <TouchableOpacity onPress={() => setShowSuccess(false)}>
              <Ionicons name="close" size={18} color="#555" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={ws.scroll} contentContainerStyle={[ws.scrollContent, isMobileWeb && { paddingHorizontal: 12 }]} showsVerticalScrollIndicator={false}>
          <View style={ws.innerWrap}>

            {/* Two Column Layout */}
            <View style={[ws.grid, isMobileWeb && { flexDirection: 'column' }]}>

              {/* LEFT: Form */}
              <View style={[ws.leftCol, isMobileWeb && { flex: 1 }]}>

                {/* Ad Preview */}
                <View style={ws.card}>
                  <View style={ws.cardTitleRow}>
                    <View style={ws.previewBadge}><Text style={ws.previewBadgeText}>Preview</Text></View>
                  </View>
                  <View style={ws.previewInner}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={ws.previewTitle} numberOfLines={2}>{adData.title || 'Ad Title'}</Text>
                      <Text style={ws.previewDesc} numberOfLines={2}>{adData.description || 'Ad Description'}</Text>
                    </View>
                    {adData.photo ? (
                      <Image source={{ uri: adData.photo }} style={ws.previewThumb} resizeMode="cover" />
                    ) : (
                      <View style={ws.previewThumbEmpty}>
                        <Ionicons name="image-outline" size={24} color="#CCCCCC" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Step 1: Location */}
                <View style={ws.card}>
                  <View style={ws.stepRow}>
                    <View style={ws.stepBadge}><Text style={ws.stepNum}>1</Text></View>
                    <Text style={ws.stepTitle}>Select your location</Text>
                  </View>
                  <Text style={ws.fieldLabel}>State <Text style={ws.req}>*</Text></Text>
                  <TouchableOpacity style={ws.dropdown} onPress={() => setStateModal(true)} activeOpacity={0.8}>
                    <Text style={[ws.dropdownText, !selState && ws.placeholder]}>{selState || 'Select State'}</Text>
                    <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
                  </TouchableOpacity>
                  <Text style={ws.fieldLabelSpaced}>City (District) <Text style={ws.req}>*</Text></Text>
                  <TouchableOpacity
                    style={[ws.dropdown, !selState && ws.dropdownDisabled]}
                    onPress={() => selState && setDistModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ws.dropdownText, !selDistrict && ws.placeholder]}>
                      {selDistrict || 'Select City / District'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#AAAAAA" />
                  </TouchableOpacity>
                </View>

                {/* Step 4: Duration */}
                <View style={[ws.card, { display: 'none' }]}>
                  <View style={ws.stepRow}>
                    <View style={ws.stepBadge}><Text style={ws.stepNum}>4</Text></View>
                    <Text style={ws.stepTitle}>Promotion Duration</Text>
                  </View>
                  {promoteScope === 'district' ? (
                    <View style={ws.freeNotice}>
                      <Ionicons name="gift-outline" size={16} color={C.green} />
                      <Text style={ws.freeNoticeText}>District promotion is FREE — no duration needed!</Text>
                    </View>
                  ) : (
                    <View style={ws.durationGrid}>
                      {DURATION_PLANS.map((plan) => {
                        const days  = daysMap[plan.id];
                        const price = pricePerDay * days;
                        const isSel = duration === plan.id;
                        return (
                          <TouchableOpacity
                            key={plan.id}
                            style={[ws.durationCard, isSel && ws.durationCardSel]}
                            onPress={() => setDuration(plan.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={[ws.durationLabel, isSel && ws.durationLabelSel]}>{plan.label}</Text>
                            <Text style={[ws.durationPrice, isSel && ws.durationPriceSel]}>₹{price}</Text>
                            {isSel && <View style={ws.durationCheck}><Ionicons name="checkmark-circle" size={15} color={C.primary} /></View>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Step 5: Start Date */}
                <View style={ws.card}>
                  <View style={ws.stepRow}>
                    <View style={ws.stepBadge}><Text style={ws.stepNum}>5</Text></View>
                    <Text style={ws.stepTitle}>Starting date of promotion</Text>
                  </View>
                  <View style={ws.dateRow}>
                    <Ionicons name="calendar-outline" size={18} color={C.primary} />
                    <Text style={ws.dateText}>{startDate}</Text>
                    <input
                      type="date"
                      value={toInputDateValue(selectedDate)}
                      min={toInputDateValue(todayDate)}
                      onChange={handleWebDateChange}
                      style={{
                        marginLeft: 'auto',
                        border: `1.5px solid ${C.border}`,
                        borderRadius: RADIUS.input,
                        padding: '8px 10px',
                        fontSize: 13,
                        fontFamily: 'Poppins, sans-serif',
                        color: '#111111',
                        backgroundColor: C.orangeLight,
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity style={ws.buyBtn} onPress={handleBuy} activeOpacity={0.85}>
                  <Text style={ws.buyBtnText}>Post Advertisement</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

             {/* RIGHT: Promotion controls temporarily hidden */}
              <View style={[ws.rightCol, isMobileWeb && { flex: 1 }, { display: 'none' }]}>

                {/* Step 2: Where to Promote */}
                <View style={ws.card}>
                  <View style={ws.stepRow}>
                    <View style={ws.stepBadge}><Text style={ws.stepNum}>2</Text></View>
                    <Text style={ws.stepTitle}>Where to promote?</Text>
                  </View>
                  {promoteOptions.length === 0 ? (
                    <Text style={ws.emptyHint}>Select your location first</Text>
                  ) : (
                    promoteOptions.map((opt) => {
                      const isSel = promoteScope === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[ws.radioCard, isSel && ws.radioCardSel]}
                          onPress={() => { setPromoteScope(opt.id); setDuration(''); }}
                          activeOpacity={0.8}
                        >
                          <View style={[ws.radioCircle, isSel && ws.radioCircleSel]}>
                            {isSel && <View style={ws.radioCircleDot} />}
                          </View>
                          <Text style={[ws.radioLabel, isSel && ws.radioLabelSel]}>{opt.label}</Text>
                          {opt.free ? (
                            <View style={ws.freeBadge}><Text style={ws.freeBadgeText}>FREE</Text></View>
                          ) : (
                            <View style={ws.priceBadge}><Text style={ws.priceBadgeText}>₹{opt.priceDay}/day</Text></View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>

                {/* Step 3: Placement */}
                <View style={ws.card}>
                  <View style={ws.stepRow}>
                    <View style={ws.stepBadge}><Text style={ws.stepNum}>3</Text></View>
                    <Text style={ws.stepTitle}>Choose Placement</Text>
                  </View>

                  <TouchableOpacity
                    style={[ws.placementCard, placement === 'home' && ws.placementCardSel]}
                    onPress={() => setPlacement('home')}
                    activeOpacity={0.8}
                  >
                    <View style={[ws.radioCircle, placement === 'home' && ws.radioCircleSel]}>
                      {placement === 'home' && <View style={ws.radioCircleDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ws.placementTitle, placement === 'home' && ws.placementTitleSel]}>Home Page</Text>
                      <Text style={ws.placementDesc}>Shown on the home page in Shuru App</Text>
                    </View>
                    <View style={ws.placementMock}>
                      <Text style={ws.placementMockTop}>HOME</Text>
                      <View style={ws.placementMockAd}><Text style={ws.placementMockAdText}>Ad</Text></View>
                      <View style={ws.placementMockLine} />
                    </View>
                  </TouchableOpacity>

                  <View style={{ position: 'relative', marginTop: 10 }}>
                    <View style={ws.bestBadge}><Text style={ws.bestBadgeText}>🔥 Best Results</Text></View>
                    <TouchableOpacity
                      style={[ws.placementCard, placement === 'full' && ws.placementCardSel, { marginBottom: 0 }]}
                      onPress={() => setPlacement('full')}
                      activeOpacity={0.8}
                    >
                      <View style={[ws.radioCircle, placement === 'full' && ws.radioCircleSel]}>
                        {placement === 'full' && <View style={ws.radioCircleDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[ws.placementTitle, placement === 'full' && ws.placementTitleSel]}>Full Page</Text>
                        <Text style={ws.placementDesc}>Shown on home + full page when app opens</Text>
                      </View>
                      <View style={ws.placementMockFull}>
                        <View style={ws.placementMockFullAd}><Text style={ws.placementMockAdText}>Ad</Text></View>
                        <View style={ws.placementMockLine} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Summary Card */}
                <View style={ws.summaryCard}>
                  <Text style={ws.summaryTitle}>Order Summary</Text>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Scope</Text>
                    <Text style={ws.summaryValue}>{promoteScope === 'district' ? selDistrict || '—' : promoteScope === 'state' ? selState || '—' : 'India'}</Text>
                  </View>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Placement</Text>
                    <Text style={ws.summaryValue}>{placement === 'full' ? 'Full Page' : 'Home Page'}</Text>
                  </View>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Duration</Text>
                    <Text style={ws.summaryValue}>{promoteScope === 'district' ? 'Ongoing (Free)' : DURATION_PLANS.find(p => p.id === duration)?.label || '—'}</Text>
                  </View>
                  <View style={ws.summaryRow}>
                    <Text style={ws.summaryLabel}>Start Date</Text>
                    <Text style={ws.summaryValue}>{startDate}</Text>
                  </View>
                  <View style={ws.summaryDivider} />
                  <View style={ws.summaryTotalRow}>
                    <Text style={ws.summaryTotalLabel}>Total Charge</Text>
                    <Text style={ws.summaryTotalPrice}>
                      {promoteScope === 'district' ? '₹0 (FREE)' : totalCharge !== null ? `₹${totalCharge}` : '₹N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity style={ws.buyBtn} onPress={handleBuy} activeOpacity={0.85}>
                    <Text style={ws.buyBtnText}>Buy Promotion</Text>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </View>
        </ScrollView>

        <DropdownModal
          visible={stateModal} title="Select State" items={INDIAN_STATES}
          selected={selState}
          onSelect={(v) => { setSelState(v); setSelDistrict(''); setPromoteScope('district'); }}
          onClose={() => setStateModal(false)}
        />
        <DropdownModal
          visible={distModal} title="Select City / District" items={districtList}
          selected={selDistrict}
          onSelect={(v) => { setSelDistrict(v); setPromoteScope('district'); }}
          onClose={() => setDistModal(false)}
        />
      </View>
    );
  }

  return (
    <View style={s.root}>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <View style={s.successToast}>
          <Ionicons name="checkmark-circle" size={24} color={C.green} />
          <Text style={s.successText}>{successMessage}</Text>
          <TouchableOpacity onPress={() => setShowSuccess(false)} style={s.successClose}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Choose your plan</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Ad Preview Card ── */}
        <View style={s.previewCard}>
          <View style={s.previewBadge}>
            <Text style={s.previewBadgeText}>Preview</Text>
          </View>
          <View style={s.previewInner}>
            <View style={s.previewTextWrap}>
              <Text style={s.previewTitle} numberOfLines={2}>{adData.title || 'Ad Title'}</Text>
              <Text style={s.previewDesc}  numberOfLines={2}>{adData.description || 'Ad Description'}</Text>
            </View>
            {adData.photo ? (
              <Image source={{ uri: adData.photo }} style={s.previewThumb} resizeMode="cover" />
            ) : (
              <View style={s.previewThumbPlaceholder}>
                <Ionicons name="image-outline" size={24} color={C.textSub} />
              </View>
            )}
          </View>
        </View>

        {/* ── Step 1: Location ── */}
        <View style={s.section}>
          <StepHeader number="1" label="Select your location" />

          <Text style={s.fieldLabel}>State <Text style={s.req}>*</Text></Text>
          <TouchableOpacity style={s.dropdown} onPress={() => setStateModal(true)} activeOpacity={0.8}>
            <Text style={[s.dropdownText, !selState && s.placeholder]}>{selState || 'Select State'}</Text>
            <Ionicons name="chevron-down" size={18} color={C.textSub} />
          </TouchableOpacity>

          <Text style={s.fieldLabelSpaced}>City (District) <Text style={s.req}>*</Text></Text>
          <TouchableOpacity
            style={[s.dropdown, !selState && s.dropdownDisabled]}
            onPress={() => selState && setDistModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[s.dropdownText, !selDistrict && s.placeholder]}>
              {selDistrict || 'Select City / District'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {/* ── Step 2: Where to promote ── */}
        <View style={[s.section, { display: 'none' }]}>
          <StepHeader number="2" label="Where do you want to promote?" />
          {promoteOptions.length === 0 ? (
            <Text style={s.emptyHint}>Select your location first</Text>
          ) : (
            promoteOptions.map((opt) => {
              const isSel = promoteScope === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.radioCard, isSel && s.radioCardSel]}
                  onPress={() => { setPromoteScope(opt.id); setDuration(''); }}
                  activeOpacity={0.8}
                >
                  <View style={[s.radioCircle, isSel && s.radioCircleSel]}>
                    {isSel && <View style={s.radioCircleDot} />}
                  </View>
                  <Text style={[s.radioLabel, isSel && s.radioLabelSel]}>{opt.label}</Text>
                  {opt.free ? (
                    <View style={s.freeBadge}><Text style={s.freeBadgeText}>FREE</Text></View>
                  ) : (
                    <View style={s.priceBadge}>
                      <Text style={s.priceBadgeText}>₹ {opt.priceDay}/day</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Step 3: Placement ── */}
        <View style={[s.section, { display: 'none' }]}>
          <StepHeader number="3" label="Choose Placement" />

          <TouchableOpacity
            style={[s.placementCard, placement === 'home' && s.placementCardSel]}
            onPress={() => setPlacement('home')}
            activeOpacity={0.8}
          >
            <View style={[s.radioCircle, placement === 'home' && s.radioCircleSel]}>
              {placement === 'home' && <View style={s.radioCircleDot} />}
            </View>
            <View style={s.placementInfo}>
              <Text style={[s.placementTitle, placement === 'home' && s.placementTitleSel]}>Home Page</Text>
              <Text style={s.placementDesc}>Your advertisement will be shown on the home page in Shuru App</Text>
            </View>
            <View style={s.placementMock}>
              <Text style={s.placementMockTop}>HOME</Text>
              <View style={s.placementMockAd}><Text style={s.placementMockAdText}>Ads</Text></View>
              <View style={s.placementMockLines}>
                <View style={s.placementMockLine} />
                <View style={s.placementMockLine} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={s.bestResultsWrap}>
            <View style={s.bestResultsBadge}>
              <Text style={s.bestResultsText}>🔥 Best Results</Text>
            </View>
            <TouchableOpacity
              style={[s.placementCard, s.placementCardFullPage, placement === 'full' && s.placementCardSel]}
              onPress={() => setPlacement('full')}
              activeOpacity={0.8}
            >
              <View style={[s.radioCircle, placement === 'full' && s.radioCircleSel]}>
                {placement === 'full' && <View style={s.radioCircleDot} />}
              </View>
              <View style={s.placementInfo}>
                <Text style={[s.placementTitle, placement === 'full' && s.placementTitleSel]}>Full Page</Text>
                <Text style={s.placementDesc}>Shown on home page and as full page when user opens the Shuru App</Text>
              </View>
              <View style={s.placementMockFull}>
                <View style={s.placementMockFullAd}><Text style={s.placementMockAdText}>Ads</Text></View>
                <View style={s.placementMockLine} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Step 4: Duration ── */}
        <View style={[s.section, { display: 'none' }]}>
          <StepHeader number="4" label="Choose your Promotion duration" />
          {promoteScope === 'district' ? (
            <View style={s.freeNotice}>
              <Ionicons name="gift-outline" size={18} color={C.green} />
              <Text style={s.freeNoticeText}>District promotion is FREE — no duration needed!</Text>
            </View>
          ) : (
            <View style={s.durationGrid}>
              {DURATION_PLANS.map((plan) => {
                const days  = daysMap[plan.id];
                const price = pricePerDay * days;
                const isSel = duration === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[s.durationCard, isSel && s.durationCardSel]}
                    onPress={() => setDuration(plan.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.durationLabel, isSel && s.durationLabelSel]}>{plan.label}</Text>
                    <Text style={[s.durationPrice, isSel && s.durationPriceSel]}>₹{price}</Text>
                    {isSel && (
                      <View style={s.durationCheck}>
                        <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Step 5: Start date ── */}
        <View style={s.section}>
          <StepHeader number="5" label="Starting date of promotion" />
          <TouchableOpacity style={s.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={20} color={C.primary} />
            <Text style={s.dateText}>{startDate}</Text>
            <Text style={s.dateSub}>
              {selectedDate.getTime() === todayDate.getTime() ? '(starts today)' : '(tap to change)'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={C.textSub} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={todayDate}
              onChange={handleNativeDateChange}
            />
          )}
        </View>

        <View style={s.scrollSpacer} />
      </ScrollView>

      {/* ── Fixed Bottom Bar ── */}
      <View style={s.bottomBar}>
        <View>
          <Text style={s.bottomLabel}>Advertisement</Text>
          <Text style={s.bottomPrice}>
            {promoteScope === 'district'
              ? '₹0 (FREE)'
              : totalCharge !== null
              ? `₹${totalCharge}`
              : '₹N/A'}
          </Text>
        </View>
        <TouchableOpacity
          style={s.buyBtn}
          onPress={handleBuy}
          activeOpacity={0.85}
        >
          <Text style={s.buyBtnText}>Post Advertisement</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <DropdownModal
        visible={stateModal} title="Select State" items={INDIAN_STATES}
        selected={selState}
        onSelect={(v) => { setSelState(v); setSelDistrict(''); setPromoteScope('district'); }}
        onClose={() => setStateModal(false)}
      />
      <DropdownModal
        visible={distModal} title="Select City / District" items={districtList}
        selected={selDistrict}
        onSelect={(v) => { setSelDistrict(v); setPromoteScope('district'); }}
        onClose={() => setDistModal(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.white,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: HEADER_TOP,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    elevation: 3,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  backBtn: {
    padding: 8,
    borderRadius: RADIUS.input,
    backgroundColor: C.orangeLight,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: C.text,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 20 },
  scrollSpacer:  { height: 90 },

  // ── Preview Card ──
  previewCard: {
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  previewBadge: {
    backgroundColor: C.primary,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  previewBadgeText:        { color: '#fff', fontSize: 12, fontFamily: FONT.bold },
  previewInner:            { flexDirection: 'row', alignItems: 'center' },
  previewTextWrap:         { flex: 1, paddingRight: 8 },
  previewTitle:            { fontSize: 16, fontFamily: FONT.bold, color: C.text, marginBottom: 4 },
  previewDesc:             { fontSize: 12, fontFamily: FONT.regular, color: C.textSub },
  previewThumb:            { width: 80, height: 70, borderRadius: RADIUS.input },
  previewThumbPlaceholder: { width: 80, height: 70, borderRadius: RADIUS.input, backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center' },

  section: { paddingHorizontal: 16, paddingTop: 24 },

  fieldLabel:       { fontSize: 13, fontFamily: FONT.semiBold, color: C.text, marginBottom: 6 },
  fieldLabelSpaced: { fontSize: 13, fontFamily: FONT.semiBold, color: C.text, marginBottom: 6, marginTop: 14 },
  req:              { color: C.primary },
  // Input / dropdown — matches the web source: rounded-md border, 1 solid border color, px-3 py-4, text-xs
  dropdown:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderWidth: 1, borderColor: C.primary, borderRadius: RADIUS.input, paddingHorizontal: 12, paddingVertical: 16 },
  dropdownDisabled: { opacity: 0.5 },
  dropdownText:     { fontSize: 12, fontFamily: FONT.medium, color: C.text },
  placeholder:      { color: C.orangeMid },

  emptyHint: { fontSize: 13, fontFamily: FONT.regular, color: C.textSub, fontStyle: 'italic', paddingVertical: 8 },

  // ── Radio ──
  radioCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10, gap: 12 },
  radioCardSel:   { borderColor: C.primary, backgroundColor: C.orangeLight },
  radioCircle:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioCircleSel: { borderColor: C.primary },
  radioCircleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  radioLabel:     { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: C.text },
  radioLabelSel:  { color: C.primary, fontFamily: FONT.semiBold },
  freeBadge:      { backgroundColor: C.greenLight, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.greenBorder },
  freeBadgeText:  { fontSize: 12, fontFamily: FONT.semiBold, color: C.green },
  priceBadge:     { backgroundColor: C.orangeLight, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.orangeBorder },
  priceBadgeText: { fontSize: 12, fontFamily: FONT.semiBold, color: C.primary },

  // ── Placement ──
  placementCard:         { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.card, padding: 14, marginBottom: 12, gap: 10 },
  placementCardSel:      { borderColor: C.primary, backgroundColor: C.orangeLight },
  placementCardFullPage: { marginBottom: 0 },
  placementInfo:         { flex: 1 },
  placementTitle:        { fontSize: 15, fontFamily: FONT.bold, color: C.text, marginBottom: 3 },
  placementTitleSel:     { color: C.primary },
  placementDesc:         { fontSize: 12, fontFamily: FONT.regular, color: C.textSub, lineHeight: 17 },

  placementMock:       { width: 56, alignItems: 'center', gap: 3 },
  placementMockTop:    { fontSize: 9, fontFamily: FONT.bold, color: C.textSub },
  placementMockAd:     { width: 48, height: 20, backgroundColor: C.primary, borderRadius: RADIUS.input, alignItems: 'center', justifyContent: 'center' },
  placementMockAdText: { color: '#fff', fontSize: 10, fontFamily: FONT.bold },
  placementMockLines:  { gap: 3 },
  placementMockLine:   { width: 44, height: 4, backgroundColor: C.border, borderRadius: 2 },
  placementMockFull:   { width: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  placementMockFullAd: { width: 48, height: 52, backgroundColor: C.primary, borderRadius: RADIUS.input, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },

  bestResultsWrap:  { position: 'relative', marginTop: 4 },
  bestResultsBadge: { position: 'absolute', top: -12, left: 14, zIndex: 10, backgroundColor: C.primary, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 4 },
  bestResultsText:  { color: '#fff', fontSize: 12, fontFamily: FONT.bold },

  // ── Duration ──
  durationGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationCard:     { width: '30%', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.card, paddingVertical: 14, alignItems: 'center', position: 'relative' },
  durationCardSel:  { borderColor: C.primary, backgroundColor: C.orangeLight },
  durationLabel:    { fontSize: 13, fontFamily: FONT.semiBold, color: C.text, marginBottom: 4 },
  durationLabelSel: { color: C.primary },
  durationPrice:    { fontSize: 13, fontFamily: FONT.bold, color: C.textSub },
  durationPriceSel: { color: C.primary },
  durationCheck:    { position: 'absolute', top: 6, right: 6 },

  freeNotice:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.greenLight, borderRadius: RADIUS.card, padding: 12, borderWidth: 1, borderColor: C.greenBorder },
  freeNoticeText: { fontSize: 13, fontFamily: FONT.medium, color: C.green, flex: 1 },

  // Date input — same rounded-md, solid-border treatment as the dropdown inputs
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.primary, borderRadius: RADIUS.input, paddingHorizontal: 12, paddingVertical: 16 },
  dateText: { fontSize: 13, fontFamily: FONT.semiBold, color: C.text },
  dateSub:  { fontSize: 12, fontFamily: FONT.regular, color: C.textSub },

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomLabel: { fontSize: 12, fontFamily: FONT.regular, color: C.textSub, marginBottom: 2 },
  bottomPrice: { fontSize: 22, fontFamily: FONT.bold, color: C.text },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 22,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buyBtnText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },

  // ── Success Toast ──
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: C.white,
    borderRadius: RADIUS.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  successText:  { flex: 1, color: C.text, fontSize: 13, fontFamily: FONT.medium, marginLeft: 10 },
  successClose: { padding: 4 },
});

const ws = StyleSheet.create({
  root:        { flex:1, backgroundColor:'#F7F7F7', minHeight:'100vh' },

  topBar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:32, paddingVertical:14, backgroundColor:'#ffffff', borderBottomWidth:1, borderBottomColor: C.border },
  backBtn:     { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8, backgroundColor: C.orangeLight, borderWidth:1, borderColor: C.border, borderRadius: RADIUS.input },
  backBtnText: { fontSize:13, fontFamily: FONT.bold, color: C.primaryDark },
  topBarTitle: { fontSize:15, fontFamily: FONT.bold, color:'#111111' },

  toast:       { position:'absolute', top:60, left:32, right:32, backgroundColor:'#ffffff', borderRadius: RADIUS.card, padding:14, flexDirection:'row', alignItems:'center', gap:10, zIndex:1000, borderWidth:1, borderColor:'#bbf7d0', elevation:8 },
  toastText:   { flex:1, fontSize:13, fontFamily: FONT.medium, color:'#111111' },

  scroll:        { flex:1 },
  scrollContent: { paddingHorizontal:32, paddingTop:28, paddingBottom:60, alignItems:'center' },
  innerWrap:     { width:'100%', maxWidth:1000, alignSelf:'center' },

  grid:     { flexDirection:'row', gap:20, alignItems:'flex-start' },
  leftCol:  { flex:1.1, gap:16 },
  rightCol: { flex:0.9, gap:16 },

  card:        { backgroundColor:'#ffffff', borderRadius: RADIUS.card, padding:20, borderWidth:1, borderColor: C.border },
  cardTitleRow:{ marginBottom:12 },

  stepRow:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:16 },
  stepBadge: { width:28, height:28, borderRadius:14, backgroundColor: C.primary, alignItems:'center', justifyContent:'center' },
  stepNum:   { color:'#ffffff', fontSize:13, fontFamily: FONT.bold },
  stepTitle: { fontSize:15, fontFamily: FONT.bold, color:'#111111' },

  previewBadge:     { backgroundColor: C.primary, alignSelf:'flex-start', borderRadius: RADIUS.pill, paddingHorizontal:12, paddingVertical:4, marginBottom:10 },
  previewBadgeText: { color:'#fff', fontSize:12, fontFamily: FONT.bold },
  previewInner:     { flexDirection:'row', alignItems:'center' },
  previewTitle:     { fontSize:15, fontFamily: FONT.bold, color:'#111111', marginBottom:4 },
  previewDesc:      { fontSize:12, fontFamily: FONT.regular, color:'#888888' },
  previewThumb:     { width:80, height:70, borderRadius: RADIUS.input },
  previewThumbEmpty:{ width:80, height:70, borderRadius: RADIUS.input, backgroundColor: C.orangeLight, alignItems:'center', justifyContent:'center' },

  fieldLabel:       { fontSize:12, fontFamily: FONT.semiBold, color:'#111111', marginBottom:6 },
  fieldLabelSpaced: { fontSize:12, fontFamily: FONT.semiBold, color:'#111111', marginBottom:6, marginTop:14 },
  req:              { color: C.primary },
  // Input / dropdown — matches web source exactly: rounded-md, solid border-primary, px-3 py-4, text-xs
  dropdown:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#ffffff', borderWidth:1, borderColor: C.primary, borderRadius: RADIUS.input, paddingHorizontal:12, paddingVertical:16 },
  dropdownDisabled: { opacity:0.4 },
  dropdownText:     { fontSize:12, fontFamily: FONT.medium, color:'#111111' },
  placeholder:      { color: C.orangeMid },

  emptyHint: { fontSize:13, fontFamily: FONT.regular, color:'#AAAAAA', fontStyle:'italic' },

  radioCard:      { flexDirection:'row', alignItems:'center', backgroundColor:'#ffffff', borderWidth:1, borderColor: C.border, borderRadius: RADIUS.card, paddingHorizontal:14, paddingVertical:13, marginBottom:8, gap:10 },
  radioCardSel:   { borderColor: C.primary, backgroundColor: C.orangeLight },
  radioCircle:    { width:18, height:18, borderRadius:9, borderWidth:2, borderColor: C.border, alignItems:'center', justifyContent:'center' },
  radioCircleSel: { borderColor: C.primary },
  radioCircleDot: { width:8, height:8, borderRadius:4, backgroundColor: C.primary },
  radioLabel:     { flex:1, fontSize:13, fontFamily: FONT.medium, color:'#111111' },
  radioLabelSel:  { color: C.primary, fontFamily: FONT.semiBold },
  freeBadge:      { backgroundColor:'#f0fdf4', borderRadius: RADIUS.pill, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'#bbf7d0' },
  freeBadgeText:  { fontSize:11, fontFamily: FONT.semiBold, color:'#16a34a' },
  priceBadge:     { backgroundColor: C.orangeLight, borderRadius: RADIUS.pill, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor: C.border },
  priceBadgeText: { fontSize:11, fontFamily: FONT.semiBold, color: C.primary },

  placementCard:     { flexDirection:'row', alignItems:'flex-start', backgroundColor:'#ffffff', borderWidth:1, borderColor: C.border, borderRadius: RADIUS.card, padding:14, gap:10, marginBottom:8, overflow:'hidden' },
  placementCardSel:  { borderColor: C.primary, backgroundColor: C.orangeLight },
  placementTitle:    { fontSize:13, fontFamily: FONT.bold, color:'#111111', marginBottom:2 },
  placementTitleSel: { color: C.primary },
  placementDesc:     { fontSize:11, fontFamily: FONT.regular, color:'#AAAAAA', lineHeight:16, flexShrink:1, flexWrap:'wrap' },
  placementMock:     { width:50, alignItems:'center', gap:3 },
  placementMockTop:  { fontSize:8, fontFamily: FONT.bold, color:'#AAAAAA' },
  placementMockAd:   { width:44, height:18, backgroundColor: C.primary, borderRadius: RADIUS.input, alignItems:'center', justifyContent:'center' },
  placementMockAdText:{ color:'#fff', fontSize:9, fontFamily: FONT.bold },
  placementMockLine: { width:40, height:3, backgroundColor: C.border, borderRadius:2 },
  placementMockFull: { width:50, alignItems:'center', gap:4 },
  placementMockFullAd:{ width:44, height:46, backgroundColor: C.primary, borderRadius: RADIUS.input, alignItems:'center', justifyContent:'center' },
  bestBadge:         { position:'absolute', top:-11, left:12, zIndex:10, backgroundColor: C.primary, borderRadius: RADIUS.pill, paddingHorizontal:10, paddingVertical:3 },
  bestBadgeText:     { color:'#fff', fontSize:11, fontFamily: FONT.bold },

  durationGrid:     { flexDirection:'row', flexWrap:'wrap', gap:8 },
  durationCard:     { width:'30%', backgroundColor:'#ffffff', borderWidth:1, borderColor: C.border, borderRadius: RADIUS.card, paddingVertical:13, alignItems:'center', position:'relative' },
  durationCardSel:  { borderColor: C.primary, backgroundColor: C.orangeLight },
  durationLabel:    { fontSize:12, fontFamily: FONT.semiBold, color:'#111111', marginBottom:3 },
  durationLabelSel: { color: C.primary },
  durationPrice:    { fontSize:12, fontFamily: FONT.bold, color:'#AAAAAA' },
  durationPriceSel: { color: C.primary },
  durationCheck:    { position:'absolute', top:5, right:5 },

  freeNotice:     { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#f0fdf4', borderRadius: RADIUS.card, padding:12, borderWidth:1, borderColor:'#bbf7d0' },
  freeNoticeText: { fontSize:13, fontFamily: FONT.medium, color:'#16a34a', flex:1 },

  // Date input — same rounded-md, solid-border treatment as the dropdown inputs
  dateRow:  { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#ffffff', borderRadius: RADIUS.input, padding:12, borderWidth:1, borderColor: C.primary },
  dateText: { fontSize:13, fontFamily: FONT.semiBold, color:'#111111' },
  dateSub:  { fontSize:12, fontFamily: FONT.regular, color:'#AAAAAA' },

  summaryCard:       { backgroundColor:'#ffffff', borderRadius: RADIUS.card, padding:20, borderWidth:2, borderColor: C.primary },
  summaryTitle:      { fontSize:16, fontFamily: FONT.bold, color:'#111111', marginBottom:16 },
  summaryRow:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8, borderBottomWidth:1, borderBottomColor: C.orangeLight },
  summaryLabel:      { fontSize:13, fontFamily: FONT.regular, color:'#AAAAAA' },
  summaryValue:      { fontSize:13, fontFamily: FONT.semiBold, color:'#111111' },
  summaryDivider:    { height:1, backgroundColor: C.border, marginVertical:12 },
  summaryTotalRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  summaryTotalLabel: { fontSize:14, fontFamily: FONT.semiBold, color:'#111111' },
  summaryTotalPrice: { fontSize:22, fontFamily: FONT.bold, color: C.primary },
  buyBtn:            { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor: C.primary, borderRadius: RADIUS.pill, paddingVertical:14 },
  buyBtnText:        { color:'#ffffff', fontSize:15, fontFamily: FONT.bold },
});