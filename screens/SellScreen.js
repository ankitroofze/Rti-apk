import React, { useRef, useState, useEffect } from 'react';
import { Keyboard, findNodeHandle } from 'react-native';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TextInput,
  Image,
  KeyboardAvoidingView,
   Modal,
  ActivityIndicator,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserStore } from '../store/UserStore';
import * as ToastKit from '../components/ui/ToastProvider';
const { useToast } = ToastKit;
// Purane/stale bundle me useBusy na mile to bhi screen crash na ho ("Property 'useBusy' doesn't exist")
const useBusy = ToastKit.useBusy || (() => {});
import { getDistricts } from '../pages/locationData';
import { storeWebUriToIdbMedia } from '../utils/webMediaStore';

/* ─────────────────────────────────────────────────────────────────────────
 * SHURU DESIGN TOKENS
 * Extracted from shuru.co.in promotion form (border-primary, rounded-md,
 * px-3 py-4, text-xs). Primary hex is not exposed as a literal in Shuru's
 * CSS (it's a CSS variable --col-lt-btn-bg), so this uses the closest
 * Tailwind match to the light background they pair it with (#FDF1F1).
 * Change PRIMARY below if you have the exact brand hex.
 * ───────────────────────────────────────────────────────────────────────── */
const SHURU = {
  primary: '#dc2626',       // border-primary / bg-primary
  primaryLight: '#fef2f2',  // bg-[#FDF1F1] equivalent
  primaryBorder: '#dc2626',
  fieldBorder: '#d1d5db',
  radius: 8,                // rounded-md
  radiusPill: 999,          // rounded-full (buttons)
  borderWidth: 1,           // Shuru inputs use a thin 1px border
  textDark: '#1e293b',
  textMuted: '#6B6B6B',
  placeholder: '#9CA3AF',
  inputBg: '#ffffff',
};

const ECOME_SECTORS = [
  'Electronics',
  'Mobiles & Tablets',
  'Computers & Laptops',
  'Home Appliances',
  'Furniture',
  'Fashion',
  'Vehicles',
  'Books & Stationery',
  'Sports & Fitness',
  'Tools & Equipment',
  'Services',
  'Other',
];

// The API requires ecom_sub_id to be an integer, not the category label.
const ECOME_SUB_ID_BY_SECTOR = Object.fromEntries(
  ECOME_SECTORS.map((name, index) => [name, index + 1])
);

const ECOME_CREDIT_PLANS = [
  { plan_id: 'ecome-starter-monthly', plan_name: 'Starter', price: 499, credits: 10, duration: '30 Days', validity_days: 30 },
  { plan_id: 'ecome-growth-monthly', plan_name: 'Growth', price: 899, credits: 25, duration: '30 Days', validity_days: 30 },
  { plan_id: 'ecome-power-monthly', plan_name: 'Power', price: 1499, credits: 50, duration: '30 Days', validity_days: 30 },
];

const getAssetMimeType = (asset = {}) => {
  const mimeType = String(asset.mimeType || '').trim();
  if (mimeType) return mimeType;
  const uri = String(asset.uri || '').toLowerCase();
  if (uri.endsWith('.png')) return 'image/png';
  if (uri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const getPersistentMediaUri = (asset = {}) => {
  const type = String(asset.type || '').toLowerCase();
  if (Platform.OS === 'web' && type !== 'video' && asset.base64) {
    return `data:${getAssetMimeType(asset)};base64,${asset.base64}`;
  }
  return asset.uri || '';
};
const getMediaItemFromAsset = async (asset = {}) => {
  const rawUri = getPersistentMediaUri(asset);
  const type = String(asset.type || (String(asset.uri || '').toLowerCase().endsWith('.mp4') ? 'video' : 'image')).trim();
  const storedUri = Platform.OS === 'web'
    ? await storeWebUriToIdbMedia(rawUri, {
        prefix: type === 'video' ? 'ecome-video' : 'ecome-image',
        mimeType: asset.mimeType || '',
      })
    : rawUri;
  const uri = Platform.OS === 'web' && storedUri === rawUri && /^data:/i.test(rawUri)
    ? ''
    : storedUri;
 return {
    uri,
    previewUri: Platform.OS === 'web' ? rawUri : '',
    type,
    mimeType: type === 'video' ? (asset.mimeType || 'video/mp4') : getAssetMimeType(asset),
  };
};

const getMediaItemsFromPickerResult = async (result = {}) => {
  const assets = Array.isArray(result.selected)
    ? result.selected
    : Array.isArray(result.assets)
      ? result.assets
      : [result];
  const mediaAssets = (assets || [])
    .filter((asset) => asset && asset.uri)
    .slice(0, 5);
  return Promise.all(mediaAssets.map(getMediaItemFromAsset));
};

const normalizeIndianMobileNumber = (value = '') => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(0, 10);
};

const isValidIndianMobileNumber = (value = '') => /^[6-9]\d{9}$/.test(normalizeIndianMobileNumber(value));

const getProfileLocationText = (user = {}) => {
  const parts = [user.taluka, user.district, user.state]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.join(', ');
};

const getCityChoices = (user = {}) => {
  const choices = [
    getProfileLocationText(user),
    user.taluka,
    user.district,
    ...getDistricts(user.state || ''),
  ];
  return Array.from(new Set(choices.map((value) => String(value || '').trim()).filter(Boolean)));
};

// ─── Shared Form Logic (hook) ─────────────────────────────────────────────────

function useSellForm(navigation) {
  const { showToast } = useToast();
  const [sectorOpen, setSectorOpen] = useState(false);
  const [sector, setSector] = useState('');
  const [whatSelling, setWhatSelling] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [cityChoices, setCityChoices] = useState([]);
  const [contact, setContact] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaUri, setMediaUri] = useState('');
  const [mediaType, setMediaType] = useState('');
    const [saving, setSaving] = useState(false);
  useBusy(saving);
  const [credits, setCredits] = useState(0);
  const [plans, setPlans] = useState(ECOME_CREDIT_PLANS);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const whatSellingInputRef = useRef(null);

  React.useEffect(() => {
    let alive = true;
    const loadSummary = async () => {
      const summary = await UserStore.getEcomeMarketplaceSummary({
        includeListings: false,
        includeEnquiries: false,
        needPlans: true,
      });
      if (alive) {
        setCredits(summary.credits || 0);
        if (Array.isArray(summary.plans) && summary.plans.length > 0) {
          setPlans(summary.plans);
        }
        const locationChoices = getCityChoices(summary.currentUser || {});
        setCityChoices(locationChoices);
        // City user khud type karega (pehle profile ka poora address auto-fill hota tha)
        if (summary.expired) {
          setSubscriptionExpired(true);
          setShowSubscriptionAlert(true);
        }
      }
    };
    loadSummary();
    return () => { alive = false; };
  }, []);

  const openMediaPicker = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access your media is required.', 'error');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: Platform.OS === 'web',
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;
    const items = await getMediaItemsFromPickerResult(result);
    if (!items.length) return;
    setMediaItems((prev) => {
      const next = [...prev, ...items].slice(0, 5);
      setMediaUri(next[0]?.uri || '');
      setMediaType(next[0]?.type || '');
      setTimeout(() => whatSellingInputRef.current?.focus(), 180);
      return next;
    });
  };

  const removeMediaItem = (index) => {
    setMediaItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      setMediaUri(next[0]?.uri || '');
      setMediaType(next[0]?.type || '');
      return next;
    });
  };

  const handleBuyPlan = (plan) => setConfirmPlan(plan);

  const handleConfirmBuy = async () => {
    const plan = confirmPlan;
    setConfirmPlan(null);
    const result = await UserStore.buyEcomeCredits(plan);
    if (result.ok) {
      setCredits(result.credits || 0);
      showToast(`${plan.credits} credits added. Total: ${result.credits}`, 'success');
    } else {
      showToast(result.message || 'Unable to buy credits.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (subscriptionExpired) {
      showToast('Your subscription has expired. Please buy a new plan to continue selling.', 'error');
      return;
    }
    if (!sector || !whatSelling) {
      showToast('Please fill Category and What are you selling.', 'error');
      return;
    }
    if (!mediaItems.length) {
      showToast('Please upload at least one product image.', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Please add a description.', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Please add a description.', 'error');
      return;
    }
    if (contact.trim() && !isValidIndianMobileNumber(contact)) {
      showToast('Please enter a valid 10 digit contact number.', 'error');
      return;
    }
    setSaving(true);
    const user = await UserStore.getCurrentUser();
    if (!user?.email) {
      setSaving(false);
      showToast('Please login again to upload your listing.', 'error');
      return;
    }
    const listing = {
      id: `sell-${Date.now()}`,
      type: 'ecome_sell',
      title: whatSelling.trim() || 'Ecome Sell Listing',
      sector,
      ecomSubId: ECOME_SUB_ID_BY_SECTOR[sector] || 1,
      description: description.trim(),
      quantity: quantity.trim(),
      price: price.trim(),
      city: city.trim(),
      contact: normalizeIndianMobileNumber(contact),
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10),
      mediaItems,
      mediaType,
      mediaUri,
      author_name: user.name || 'User',
      author_profile_image: user.profile_image || '',
      createdBy: user.email,
    };
    const result = await UserStore.createEcomeListing(listing);
    setSaving(false);
    if (!result.ok) {
      if (result.isAuth) {
        showToast('Your session has expired. Please login again.', 'error');
        navigation.navigate('Login');
        return;
      }
      showToast(result.message || 'Unable to save your listing. Please try again.', 'error');
      return;
    }
    setCredits(result.credits || 0);
    showToast('Your listing has been uploaded successfully and is visible on Buy page.', 'success');
    setSector(''); setWhatSelling(''); setQuantity(''); setPrice('');
    setDescription(''); setCity(''); setContact('');
    setMediaItems([]); setMediaUri(''); setMediaType('');
    navigation.navigate('Ecome');
  };

  return {
    sectorOpen, setSectorOpen, sector, setSector,
    whatSelling, setWhatSelling, quantity, setQuantity,
    price, setPrice, description, setDescription,
    city, setCity, cityOpen, setCityOpen, cityChoices,
    contact, setContact, mediaItems, mediaUri, mediaType,
    saving, credits, plans, subscriptionExpired,
    showSubscriptionAlert, setShowSubscriptionAlert,
    confirmPlan, setConfirmPlan,
    whatSellingInputRef,
    openMediaPicker, removeMediaItem,
    handleBuyPlan, handleConfirmBuy, handleSubmit,
  };
}

// ─── Confirm Plan Modal (shared) ──────────────────────────────────────────────

function ConfirmPlanModal({ plan, onConfirm, onCancel }) {
  if (!plan) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={shared.modalBackdrop}>
        <View style={shared.modalCard}>
          <View style={shared.modalIconWrap}>
            <Ionicons name="cart-outline" size={24} color={SHURU.primary} />
          </View>
          <Text style={shared.modalTitle}>Confirm Purchase</Text>
          <Text style={shared.modalDesc}>
            Are you sure you want to buy the{' '}
            <Text style={{ color: SHURU.primary, fontWeight: '800' }}>{plan.plan_name}</Text> plan?
            {'\n'}
            <Text style={{ fontWeight: '700' }}>₹{plan.price}</Text>
            {' · '}{plan.credits} listings{' · '}{plan.duration}
          </Text>
          <View style={shared.modalBtnRow}>
            <TouchableOpacity style={shared.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={shared.cancelBtnText}>No, Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={shared.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={shared.confirmBtnText}>Yes, Buy Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Mobile Layout ────────────────────────────────────────────────────────────

function EcomeSellMobile({ navigation }) {
  const insets = useSafeAreaInsets();
  const form = useSellForm(navigation);
    const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef(null);

  const scrollToFocusedInput = () => {
    setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput?.();
      const scrollNode = findNodeHandle(scrollRef.current);
      if (!input || !scrollNode) return;
      input.measureLayout(
        scrollNode,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true }),
        () => {}
      );
    }, 120);
  };

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => {
      setKbHeight(e.endCoordinates?.height || 0);
    });
    const h = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  return (
        <View style={styles.root}>
       {Platform.OS === 'android' ? null : <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />}

      {form.showSubscriptionAlert && (
        <View style={styles.alertBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Subscription Expired</Text>
              <Text style={styles.alertSub}>Buy a new plan to list products</Text>
            </View>
            <TouchableOpacity onPress={() => form.setShowSubscriptionAlert(false)}>
              <Ionicons name="close" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      )}

           {Platform.OS === 'android' ? (
<ModuleAndroidHeader title="Sell" subtitle="Ecome (buy / sell)" onBack={() => navigation.goBack()} />
) : (
<>
<ImageBackground
        source={require('../assets/images/profile-red.png')}
        resizeMode="cover"
        imageStyle={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover' }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Sell</Text>
          <Text style={styles.headerSub}>Ecome (buy / sell)</Text>
        </View>
      </ImageBackground>
</>
)}
      <KeyboardAwareScroll
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
    

        {/* 1. Category */}
        <Text style={styles.fieldLabel}>1. Category<Text style={styles.required}> *</Text></Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => form.setSectorOpen(!form.sectorOpen)} activeOpacity={0.8}>
          <Text style={form.sector ? styles.selectValue : styles.selectPlaceholder}>
            {form.sector || 'Select Category'}
          </Text>
          <Ionicons name={form.sectorOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
        </TouchableOpacity>
        {form.sectorOpen && (
          <View style={styles.dropdown}>
            {ECOME_SECTORS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.dropdownItem, form.sector === s && styles.dropdownItemActive]}
                onPress={() => { form.setSector(s); form.setSectorOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, form.sector === s && styles.dropdownItemTextActive]}>{s}</Text>
                {form.sector === s && <Ionicons name="checkmark" size={16} color={SHURU.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 2. What are you selling */}
        <Text style={styles.fieldLabel}>2. What are you selling?<Text style={styles.required}> *</Text></Text>
        <TextInput ref={form.whatSellingInputRef} style={styles.inputBox} placeholder="e.g. Laptop, mobile, sofa, washing machine" placeholderTextColor={SHURU.placeholder} value={form.whatSelling} onChangeText={form.setWhatSelling} multiline />

        <Text style={styles.fieldLabel}>Quantity Available</Text>
        <TextInput style={styles.inputBox} placeholder="e.g. 100 kg, 1 machine, 2 cows" placeholderTextColor={SHURU.placeholder} value={form.quantity} onChangeText={form.setQuantity} />

        <Text style={styles.fieldLabel}>Price (₹)</Text>
        <TextInput style={styles.inputBox} placeholder="Enter price amount" placeholderTextColor={SHURU.placeholder} value={form.price} onChangeText={form.setPrice} keyboardType="numeric" />

        <Text style={styles.fieldLabel}>City</Text>
        <TextInput style={styles.inputBox} placeholder="Enter your city / town" placeholderTextColor={SHURU.placeholder} value={form.city} onChangeText={form.setCity} maxLength={60} autoCapitalize="words" />

        {/* 3. Media */}
        <Text style={styles.fieldLabel}>3. Select Photo or Video<Text style={styles.required}> *</Text></Text>
        <Text style={styles.fieldSubLabel}>Add photo or video of the product</Text>
            {form.mediaItems.length > 0 ? (
          <View style={styles.mediaBtn}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaThumbRow}>
              {form.mediaItems.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.mediaThumbWrap}>
                  {item.type === 'video' ? (
                    <View style={styles.mediaVideoThumb}>
                      <Ionicons name="videocam-outline" size={20} color="#64748b" />
                    </View>
                  ) : (
                    <Image source={{ uri: item.previewUri || item.uri }} style={styles.mediaThumb} resizeMode="cover" />
                  )}
                  <TouchableOpacity style={styles.removeMediaBtn} onPress={() => form.removeMediaItem(index)} activeOpacity={0.7}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.mediaAddMoreTile} onPress={form.openMediaPicker} activeOpacity={0.8}>
                <Ionicons name="add" size={26} color={SHURU.primary} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity style={styles.mediaBtn} onPress={form.openMediaPicker} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={30} color={SHURU.primary} />
            <Text style={styles.mediaBtnText}>Add Photo or Video</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.fieldLabel}>Description<Text style={styles.required}> *</Text></Text>
        <TextInput style={[styles.inputBox, styles.textArea]} placeholder="Add more detail" placeholderTextColor={SHURU.placeholder} value={form.description} onChangeText={form.setDescription} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.fieldLabel}>Contact</Text>
        <TextInput style={styles.inputBox} placeholder="Enter your contact number" placeholderTextColor={SHURU.placeholder} value={form.contact} onChangeText={(v) => form.setContact(normalizeIndianMobileNumber(v))} keyboardType="phone-pad" maxLength={10} />

        <TouchableOpacity style={styles.submitBtnFull} onPress={form.handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnFullText}>Next</Text>
        </TouchableOpacity>
      </KeyboardAwareScroll>

      <ConfirmPlanModal
        plan={form.confirmPlan}
        onConfirm={form.handleConfirmBuy}
        onCancel={() => form.setConfirmPlan(null)}
      />
    </View>
  );
}

// ─── Web Layout (pure RN — no HTML) ──────────────────────────────────────────

function EcomeSellWeb({ navigation }) {
  const form = useSellForm(navigation);
  const { width } = useWindowDimensions();
  const isNarrow = width <= 720;

  return (
    <View style={web.root}>
      <ImageBackground
        source={require('../assets/images/profile-red.png')}
        resizeMode="cover"
        imageStyle={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', resizeMode: 'cover' }}
        style={web.topbar}
      >
        <Text style={web.logo}>
          News<Text style={{ color: 'rgba(255,255,255,0.75)' }}>Hub</Text>
        </Text>
        <TouchableOpacity style={web.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={14} color="#ffffff" />
          <Text style={web.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={web.topSubmitBtn} onPress={form.handleSubmit} activeOpacity={0.85}>
          <Text style={web.topSubmitBtnText}>Submit</Text>
        </TouchableOpacity>
      </ImageBackground>

      <ScrollView
        style={web.scroll}
        contentContainerStyle={[web.scrollContent, isNarrow && { paddingHorizontal: 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[web.formWrap, isNarrow && { maxWidth: '100%' }]}>
          <Text style={web.pageTitle}>Sell</Text>
          <Text style={web.pageSub}>Ecome (buy / sell) — List your product for sale</Text>

          <Text style={web.label}>1. Category <Text style={web.required}>*</Text></Text>
          <TouchableOpacity style={[web.selectBtn, form.sectorOpen && web.selectBtnOpen]} onPress={() => form.setSectorOpen(!form.sectorOpen)} activeOpacity={0.8}>
            <Text style={form.sector ? web.selectValue : web.selectPlaceholder}>
              {form.sector || 'Select Category'}
            </Text>
            <Ionicons name={form.sectorOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
          </TouchableOpacity>
          {form.sectorOpen && (
            <View style={web.dropdown}>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {ECOME_SECTORS.map((s, i) => (
                  <TouchableOpacity
                    key={s}
                    style={[web.dropdownItem, form.sector === s && web.dropdownItemSelected, i < ECOME_SECTORS.length - 1 && web.dropdownItemBorder]}
                    onPress={() => { form.setSector(s); form.setSectorOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[web.dropdownItemText, form.sector === s && web.dropdownItemTextSelected]}>{s}</Text>
                    {form.sector === s && <Ionicons name="checkmark" size={16} color={SHURU.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={web.label}>2. What are you selling? <Text style={web.required}>*</Text></Text>
          <TextInput ref={form.whatSellingInputRef} style={web.input} placeholder="e.g. Laptop, mobile, sofa, washing machine" placeholderTextColor={SHURU.placeholder} value={form.whatSelling} onChangeText={form.setWhatSelling} />

          <Text style={web.label}>Quantity Available</Text>
          <TextInput style={web.input} placeholder="e.g. 100 kg, 1 machine, 2 cows" placeholderTextColor={SHURU.placeholder} value={form.quantity} onChangeText={form.setQuantity} />

          <Text style={web.label}>Price (₹)</Text>
          <TextInput style={web.input} placeholder="Enter price amount" placeholderTextColor={SHURU.placeholder} value={form.price} onChangeText={form.setPrice} keyboardType="numeric" />

          <Text style={web.label}>City</Text>
          <TextInput style={web.input} placeholder="Enter your city / town" placeholderTextColor={SHURU.placeholder} value={form.city} onChangeText={form.setCity} maxLength={60} autoCapitalize="words" />

          <Text style={web.label}>3. Media <Text style={web.required}>*</Text></Text>
          <TouchableOpacity style={web.mediaBtn} onPress={form.openMediaPicker} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={28} color={SHURU.primary} />
            <Text style={web.mediaBtnText}>Add Photo or Video</Text>
          </TouchableOpacity>
          {form.mediaItems.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {form.mediaItems.map((item, index) => (
                  <View key={`${item.uri}-${index}`} style={web.mediaThumbWrap}>
                    {item.type === 'video' ? (
                      <View style={web.mediaVideoThumb}>
                        <Ionicons name="videocam-outline" size={22} color="#64748b" />
                      </View>
                    ) : (
                      <Image source={{ uri: item.previewUri || item.uri }} style={web.mediaThumb} resizeMode="cover" />
                    )}
                    <TouchableOpacity style={web.removeMediaBtn} onPress={() => form.removeMediaItem(index)} activeOpacity={0.7}>
                      <Ionicons name="close" size={13} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <Text style={web.mediaCountText}>{form.mediaItems.length} media item{form.mediaItems.length !== 1 ? 's' : ''} selected</Text>
            </View>
          )}

          <Text style={web.label}>Description <Text style={web.required}>*</Text></Text>
          <TextInput style={[web.input, web.textarea]} placeholder="Add more detail" placeholderTextColor={SHURU.placeholder} value={form.description} onChangeText={form.setDescription} multiline numberOfLines={4} textAlignVertical="top" />

          <Text style={web.label}>Contact</Text>
          <TextInput style={web.input} placeholder="Enter your contact number" placeholderTextColor={SHURU.placeholder} value={form.contact} onChangeText={(v) => form.setContact(normalizeIndianMobileNumber(v))} keyboardType="phone-pad" maxLength={10} />

          <TouchableOpacity style={web.submitBtn} onPress={form.handleSubmit} activeOpacity={0.85}>
            <Text style={web.submitBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmPlanModal
        plan={form.confirmPlan}
        onConfirm={form.handleConfirmBuy}
        onCancel={() => form.setConfirmPlan(null)}
      />
    </View>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function EcomeSellScreen({ navigation }) {
  // ✅ NEW: Sell page pe aane se pehle ecom subscription active hai ya nahi check karo.
  // Agar nahi hai, to EcomSubscription screen pe bhej do — plan lene ke baad wahi wapas
  // 'Sell' pe redirect kar dega (see screens/EcomSubscriptionScreen.js).
  const [checkingSub, setCheckingSub] = useState(true);
  const [subOk, setSubOk] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
        const user = await UserStore.getCurrentUserSynced();
      if (!active) return;
      const hasSub = UserStore.hasActiveEcomSubscription(user);
      if (!hasSub) {
        navigation.replace('EcomSubscription', { redirectTo: 'Sell' });
        return;
      }
      setSubOk(true);
      setCheckingSub(false);
    })();
    return () => { active = false; };
  }, [navigation]);

  if (checkingSub || !subOk) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={SHURU.primary} size="large" />
      </View>
    );
  }

  if (Platform.OS === 'web') return <EcomeSellWeb navigation={navigation} />;
  return <EcomeSellMobile navigation={navigation} />;
}

// ─── Shared Modal Styles ──────────────────────────────────────────────────────

const shared = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: SHURU.radius + 4,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: SHURU.radius + 6,
    backgroundColor: SHURU.primaryLight,
    borderWidth: SHURU.borderWidth,
    borderColor: SHURU.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SHURU.radius,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: SHURU.radiusPill,
    backgroundColor: SHURU.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});

// ─── Web Styles ───────────────────────────────────────────────────────────────

const web = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F7' },
  topbar: {
    height: 60,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  logo: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: SHURU.borderWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: SHURU.radius,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  backBtnText: { fontSize: 13, color: '#ffffff' },
  topSubmitBtn: {
    backgroundColor: '#ffffff',
    borderRadius: SHURU.radiusPill,
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  topSubmitBtnText: { fontSize: 14, fontWeight: '700', color: SHURU.primary },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 36,
    paddingTop: 36,
    paddingBottom: 80,
    alignItems: 'center',
  },
  formWrap: {
    width: '100%',
    maxWidth: 620,
  },

  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  pageSub: { fontSize: 13, color: '#94a3b8', marginBottom: 28 },

  creditsCard: {
    backgroundColor: '#fff',
    borderWidth: SHURU.borderWidth,
    borderColor: '#e2e8f0',
    borderRadius: SHURU.radius + 4,
    padding: 16,
    marginBottom: 22,
  },
  creditsTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  creditsSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  plansRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planBtn: {
    borderWidth: SHURU.borderWidth,
    borderColor: SHURU.primaryBorder,
    backgroundColor: SHURU.primaryLight,
    borderRadius: SHURU.radius + 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  planBtnText: { fontSize: 13, fontWeight: '800', color: SHURU.primary },

  // === Shuru-style label: "font-semibold" + red required asterisk ===
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#353535',
    marginBottom: 7,
    marginTop: 12,
  },
  required: { color: '#ef4444' },

  // === Shuru input: rounded-md, border-primary, px-3 py-4, text-xs ===
  input: {
    borderWidth: SHURU.borderWidth,
    borderColor: SHURU.fieldBorder,
    borderRadius: SHURU.radius,
    paddingHorizontal: 12,   // px-3
    paddingVertical: 16,     // py-4
    fontSize: 12,            // text-xs
    color: SHURU.textDark,
    backgroundColor: SHURU.inputBg,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },

  // === Shuru select: same border-primary + rounded-md look ===
  selectBtn: {
    borderWidth: SHURU.borderWidth,
    borderColor: SHURU.fieldBorder,
    borderRadius: SHURU.radius,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: SHURU.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBtnOpen: {
    borderColor: SHURU.primary,
  },
  selectValue: { fontSize: 12, color: SHURU.textDark, fontWeight: '600' },
  selectPlaceholder: { fontSize: 12, color: SHURU.placeholder },

  dropdown: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderWidth: SHURU.borderWidth,
    borderColor: SHURU.fieldBorder,
    borderRadius: SHURU.radius + 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 4,
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: { backgroundColor: SHURU.primaryLight },
  dropdownItemText: { fontSize: 14, color: '#334155' },
  dropdownItemTextSelected: { color: SHURU.primary, fontWeight: '600' },

  // === Shuru upload box: bg-[#FDF1F1] + border-primary (dashed inner box) ===
  mediaBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: SHURU.borderWidth,
    borderColor: SHURU.primaryBorder,
    borderRadius: SHURU.radius,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: SHURU.primaryLight,
    width: 140,
  },
  mediaBtnText: { fontSize: 12, fontWeight: '600', color: SHURU.primary, textAlign: 'center' },
  mediaThumbWrap: {
    width: 110,
    height: 110,
    borderRadius: SHURU.radius,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginRight: 10,
    position: 'relative',
  },
  mediaThumb: { width: '100%', height: '100%' },
  mediaVideoThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
  },

  // === Shuru submit button: rounded-full pill, bg-primary ===
  submitBtn: {
    backgroundColor: SHURU.primary,
    borderRadius: SHURU.radiusPill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Mobile Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  alertBox: {
    backgroundColor: '#fee2e2',
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#dc2626', marginBottom: 2 },
  alertSub: { fontSize: 12, color: '#991b1b' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
     paddingVertical: 12,
    backgroundColor: '#b91c1c',
    overflow: 'hidden',
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: SHURU.radiusPill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
  },
  headerTitle: {
    fontSize: 15, fontWeight: '400', color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  headerSub: {
    fontSize: 11, color: '#ffffff', marginTop: 1,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  submitBtn: {
    backgroundColor: SHURU.primary, borderRadius: SHURU.radiusPill,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  formContainer: { paddingHorizontal: 18, paddingTop: 22 },

  // === Shuru-style field label ===
  fieldLabel: {
    fontSize: 16, fontWeight: '600', color: '#353535', marginBottom: 4, marginTop: 12,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium',
  },
  fieldSubLabel: {
    fontSize: 13, fontWeight: '500', color: SHURU.textMuted, marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  required: { color: '#ef4444' },

  // === Shuru select box (rounded-md + border-primary) ===
  selectBox: {
    borderWidth: SHURU.borderWidth, borderColor: SHURU.fieldBorder, borderRadius: SHURU.radius,
    paddingHorizontal: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SHURU.inputBg,
  },
  selectPlaceholder: { fontSize: 12, color: SHURU.placeholder },
  selectValue: { fontSize: 12, color: SHURU.textDark, fontWeight: '600' },
  dropdown: {
    borderWidth: SHURU.borderWidth, borderColor: SHURU.fieldBorder, borderRadius: SHURU.radius + 4,
    backgroundColor: '#fff', marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5, zIndex: 99,
  },
  dropdownItem: {
    paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: { backgroundColor: SHURU.primaryLight },
  dropdownItemText: { fontSize: 14, color: '#334155' },
  dropdownItemTextActive: { color: SHURU.primary, fontWeight: '600' },

  // === Shuru input box (rounded-md, border-primary, px-3 py-4, text-xs) ===
  inputBox: {
    borderWidth: SHURU.borderWidth, borderColor: '#cbd5e1', borderRadius: SHURU.radius,
    paddingHorizontal: 12, paddingVertical: 16,
    fontSize: 13, color: SHURU.textDark, backgroundColor: SHURU.inputBg,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
  cityInput: { marginTop: 10 },
  textArea: { minHeight: 100, textAlignVertical: 'top', paddingTop: 16 },

  // === Shuru upload box: bg-[#FDF1F1], border-primary, dashed inner (approximated) ===
  mediaBtn: {
    width: '100%', minHeight: 120,
    borderWidth: SHURU.borderWidth, borderColor: SHURU.primaryBorder,
    borderRadius: SHURU.radius, alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: SHURU.primaryLight,
  },
  mediaBtnText: { fontSize: 13, fontWeight: '600', color: SHURU.primary },
  mediaPreview: {
    marginTop: 12, padding: 12, borderRadius: SHURU.radius,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  mediaThumbRow: { flexDirection: 'row', marginBottom: 10 },
  mediaThumbWrap: {
    width: 92, height: 92, borderRadius: SHURU.radius,
    overflow: 'hidden', backgroundColor: '#e2e8f0',
    position: 'relative', marginRight: 10,
  },
    mediaThumb: { width: '100%', height: '100%' },
  mediaVideoThumb: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mediaAddMoreTile: {
    width: 92, height: 92, borderRadius: SHURU.radius,
    borderWidth: SHURU.borderWidth, borderColor: SHURU.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: SHURU.primaryLight,
  },
  removeMediaBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.8)',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaPreviewText: { fontSize: 13, color: '#334155', fontWeight: '600', marginBottom: 4 },

  creditCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: SHURU.radius + 4, backgroundColor: SHURU.primaryLight,
    borderWidth: SHURU.borderWidth, borderColor: SHURU.primaryBorder, marginBottom: 12,
  },
  creditTitle: { fontSize: 15, fontWeight: '800', color: '#9a1c1c' },
  creditSub: { fontSize: 12, color: SHURU.primary, marginTop: 3 },
  planRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  planCard: {
    flex: 1, padding: 10, borderRadius: SHURU.radius,
    backgroundColor: '#ffffff', borderWidth: SHURU.borderWidth, borderColor: SHURU.primaryBorder,
    alignItems: 'center',
  },
  planPrice: { fontSize: 14, fontWeight: '900', color: SHURU.primary },
  planCredits: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 2 },

  // === Shuru "Next" button: rounded-full, bg-primary, no icon (like source form) ===
  submitBtnFull: {
    backgroundColor: SHURU.primary, borderRadius: SHURU.radiusPill, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 28, marginBottom: 20,
  },
  submitBtnFullText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  
});