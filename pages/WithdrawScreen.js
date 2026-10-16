import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform, useWindowDimensions, StatusBar, StyleSheet, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ui/ToastProvider';
import WithdrawStyles from '../styles/WithdrawStyles';
import { UserStore } from '../store/UserStore';
import { MODULE_HEADER_HEIGHT_WEB, HEADER_BG_IMAGE } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';

const PAGE_SIZE = 10;

// === Shuru theme accent (was ORANGE '#e8603c') ===
const ORANGE = '#dc2626';

// ✅ Post News (Addnewsscreen) ke exact tokens — input border aur button color
// dono screens par bilkul same rakhne ke liye yahin se aate hain.
const PN_FIELD_BORDER = '#D1D5DB';
const PN_GRADIENT_RED = ['#450A0A', '#B91C1C', '#7F1D1D'];

// ─── Header override — matches AdvertiseScreen's top bar exactly (font, back arrow, spacing) ───
const HEADER_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54;
const H = StyleSheet.create({
    header: {
    width: '100%', alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    ...(Platform.OS === 'web' ? { height: MODULE_HEADER_HEIGHT_WEB, paddingBottom: 0 } : null),
  },
  headerImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1, fontSize: 15, fontWeight: '600', color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
});

const TABLET_CONTENT_WRAP = { maxWidth: 720, width: '100%', alignSelf: 'center' };

// ─── Shuru-style form design (numbered labels, flat inputs, radio cards) ───
// screens/WithdrawScreen.js - Update the FS StyleSheet

const FS = StyleSheet.create({
  section:        { marginTop: 24 },
  labelRow:       { flexDirection: 'row', flexWrap: 'wrap' },
  labelText:      { 
    fontSize: 14, 
    fontWeight: '600', // ✅ Weight 600
    color: '#353535',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  required:       { color: '#dc2626' },
  subtitle:       { 
    fontSize: 11, 
    fontWeight: '500', 
    color: '#6B6B6B', 
    marginTop: 3,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
    // ✅ Post News ke webInput jaisa exact: 1px #D1D5DB border, radius 8, white bg
    input:          {
    marginTop: 10, minHeight: 48, borderRadius: 8,
    borderWidth: 1,
    borderColor: PN_FIELD_BORDER, backgroundColor: '#ffffff',
    paddingHorizontal: 12, paddingVertical: 14,
    fontSize: 13, color: '#111111',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  errorText:      { 
    marginTop: 4, 
    fontSize: 11, 
    color: '#dc2626', 
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  radioCard:      {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: PN_FIELD_BORDER, borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  radioCardActive: { borderColor: ORANGE, backgroundColor: '#FDF1F1' },
  radioTitle:     { 
    fontSize: 13, 
    fontWeight: '600', // ✅ Weight 600
    color: '#222',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  radioDesc:      { 
    fontSize: 11, 
    color: '#6B6B6B', 
    marginTop: 2, 
    maxWidth: '90%',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  radioDot:       {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCCCCC',
    alignItems: 'center', justifyContent: 'center',
  },
  radioDotActive: { borderColor: ORANGE },
  radioDotFill:   { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  checkRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  checkBox:       { 
    width: 18, height: 18, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1.5, borderColor: ORANGE, 
    alignItems: 'center', justifyContent: 'center' 
  },
  checkBoxActive: { backgroundColor: ORANGE },
  checkLabel:     { 
    fontSize: 13, 
    color: '#353535', 
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
   // ✅ Post News ke submit button jaisa — pill shape + red gradient
   submitBtn:      {
    marginTop: 28, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 100,
    paddingVertical: 13, overflow: 'hidden',
  },
  submitBtnText:  { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  submitBtnDisabled: { opacity: 0.6 },
});

const initialForm = {
  amount:              '',
  payment_mode:        'bank',
  account_holder_name: '',
  bank_name:           '',
  account_number:      '',
  ifsc:                '',
  pan_number:          '',
  upi_id:              '',
  transferFull:        false,
};

const IFSC_REGEX    = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;
const PAN_REGEX      = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function validateForm(form) {
  const errors = {};
  if (!form.amount.trim()) {
    errors.amount = 'Amount is required.';
  } else if (isNaN(form.amount) || Number(form.amount) <= 0) {
    errors.amount = 'Enter a valid amount greater than 0.';
  }
  if (!form.pan_number.trim()) {
    errors.pan_number = 'PAN number is required.';
  } else if (!PAN_REGEX.test(form.pan_number.trim().toUpperCase())) {
    errors.pan_number = 'Invalid PAN (e.g. ABCDE1234F).';
  }
  if (form.payment_mode === 'bank') {
    if (!form.account_holder_name.trim()) {
      errors.account_holder_name = 'Account holder name is required.';
    }
    if (!form.bank_name.trim()) {
      errors.bank_name = 'Bank name is required.';
    } else if (form.bank_name.trim().length < 3) {
      errors.bank_name = 'Enter a valid bank name (min 3 chars).';
    }
    if (!form.account_number.trim()) {
      errors.account_number = 'Account number is required.';
    } else if (!ACCOUNT_REGEX.test(form.account_number.trim())) {
      errors.account_number = 'Account number must be 9–18 digits only.';
    }
    if (!form.ifsc.trim()) {
      errors.ifsc = 'IFSC code is required.';
    } else if (!IFSC_REGEX.test(form.ifsc.trim().toUpperCase())) {
      errors.ifsc = 'Invalid IFSC (e.g. SBIN0001234).';
    }
  }
  if (form.payment_mode === 'upi') {
    if (!form.upi_id.trim()) {
      errors.upi_id = 'UPI ID is required.';
    } else if (!form.upi_id.includes('@')) {
      errors.upi_id = 'Enter a valid UPI ID (e.g. name@upi).';
    }
  }
  return errors;
}

// Mask account number like: XXXXXXXXXX8745
const maskAccount = (acc) => {
  if (!acc || acc.length <= 4) return acc;
  return 'X'.repeat(acc.length - 4) + acc.slice(-4);
};

const statusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return WithdrawStyles.statusApproved;
    case 'rejected': return WithdrawStyles.statusRejected;
    default:         return WithdrawStyles.statusPending;
  }
};
const statusTextStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return WithdrawStyles.statusTextApproved;
    case 'rejected': return WithdrawStyles.statusTextRejected;
    default:         return WithdrawStyles.statusTextPending;
  }
};

// ─── Web status badge styles (same logic, Shuru red theme) ──────────────────
const webStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return { backgroundColor: '#f0fdf4' };
    case 'rejected': return { backgroundColor: '#fef2f2' };
    default:         return { backgroundColor: '#fffbeb' };
  }
};
const webStatusTextStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return { color: '#16a34a' };
    case 'rejected': return { color: ORANGE };
    default:         return { color: '#b45309' };
  }
};

export default function WithdrawScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && windowWidth <= 760;
  const isTablet = windowWidth >= 768;
  const { showToast } = useToast();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm]     = useState(initialForm);
  const [errors, setErrors] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [withdrawData, setWithdrawData] = useState({
    currentUser:       null,
    wallet:            null,
    available_balance: 0,
    requests:          [],
  });

  const moduleName = 'Withdraw';

  const loadWithdraw = useCallback(async () => {
    setLoading(true);
    const data = await UserStore.getWithdrawSummary();
    setLoading(false);
    if (!data) {
      navigation.replace('Login');
      return;
    }
    setWithdrawData(data);
    setCurrentPage(1);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadWithdraw();
    }, [loadWithdraw])
  );

  const handleLogout = async () => {
    await UserStore.clearCurrentUser();
    navigation.replace('Login');
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleTransferFull = () => {
    const newVal = !form.transferFull;
    setForm((prev) => ({
      ...prev,
      transferFull: newVal,
      amount: newVal ? String(withdrawData.available_balance) : '',
    }));
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    const payload = {
      amount:     Number(form.amount),
      method:     form.payment_mode,
      pan_number: form.pan_number.trim().toUpperCase(),
      ...(form.payment_mode === 'bank'
        ? {
            account_holder_name: form.account_holder_name.trim(),
            account_number:      form.account_number.trim(),
            ifsc_code:           form.ifsc.trim().toUpperCase(),
            bank_name:           form.bank_name.trim(),
          }
        : { upi_id: form.upi_id.trim() }),
    };
    const result = await UserStore.createWithdrawRequest(payload);
    setSubmitting(false);
    if (!result.ok) {
      if (result.errors) {
        const mapped = {};
        Object.entries(result.errors).forEach(([key, msgs]) => {
          const localKey = key === 'ifsc_code' ? 'ifsc' : key; // form field key alag hai, response key alag
          mapped[localKey] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      }
      showToast(result.message || 'Withdrawal request failed.', 'error');
      return;
    }
    setForm(initialForm);
    setErrors({});
    setSuccessMessage('Withdrawal request submitted successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
    loadWithdraw();
  };

  const handleCancelRequest = async (id) => {
    const result = await UserStore.cancelWithdrawRequest(id);
    if (!result.ok) {
      showToast(result.message || 'Unable to cancel withdrawal request.', 'error');
      return;
    }
    showToast('Withdrawal request cancelled.', 'success');
    loadWithdraw();
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return withdrawData.requests;
    const q = searchQuery.toLowerCase();
    return withdrawData.requests.filter(
      (r) =>
        r.amount?.toString().includes(q) ||
        r.payment_mode?.toLowerCase().includes(q) ||
        r.bank_name?.toLowerCase().includes(q) ||
        r.account_number?.toString().includes(q) ||
        r.ifsc?.toLowerCase().includes(q) ||
        r.upi_id?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.date?.toLowerCase().includes(q)
    );
  }, [withdrawData.requests, searchQuery]);

  const totalRecords  = filteredRequests.length;
  const totalPages    = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, currentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // WEB LAYOUT — Centered card, Shuru red theme
  // ═══════════════════════════════════════════════════════════════════════════
  if (isWeb && !isMobileWeb) {
    return (
      <View style={WithdrawStyles.root}>
        {/* ── Top Bar — red image header, subscription screen jaisa ── */}
        {/* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */}
        <ModuleWebHeader title="Withdraw Earnings" navigation={navigation} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={WithdrawStyles.webPage}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
       {/* ── WITHDRAW EARNING — flat, numbered, Shuru form style (web) ── */}
          <View style={{ maxWidth: 560, width: '100%', alignSelf: 'center', paddingHorizontal: 12 }}>

            {/* ── Available Balance ── */}
            <View style={WithdrawStyles.webBalanceCard}>
              <Feather name="credit-card" size={20} color="#fff" />
              <View style={WithdrawStyles.webBalanceInfo}>
                <Text style={WithdrawStyles.webBalanceLabel}>Available Balance</Text>
                <Text style={WithdrawStyles.webBalanceValue}>
                  ₹{withdrawData.available_balance}
                </Text>
              </View>
            </View>

            {withdrawData.wallet?.is_frozen ? (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#F5B5B5', borderRadius: 10, padding: 12, marginTop: 14 }}>
                <Feather name="alert-triangle" size={16} color="#7F1D1D" />
                <Text style={{ color: '#7F1D1D', fontSize: 13, fontWeight: '600', flex: 1 }}>
                  {withdrawData.wallet.freeze_reason || 'Your wallet is frozen. Withdrawals are disabled.'}
                </Text>
              </View>
            ) : withdrawData.wallet?.pending_withdrawal_count > 0 ? (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FDE59A', borderRadius: 10, padding: 12, marginTop: 14 }}>
                <Feather name="clock" size={16} color="#7A5B00" />
                <Text style={{ color: '#7A5B00', fontSize: 13, fontWeight: '600', flex: 1 }}>
                  Aapki {withdrawData.wallet.pending_withdrawal_count} withdrawal request process me hai.
                </Text>
              </View>
            ) : null}

            {successMessage ? (
              <Text style={[WithdrawStyles.webSuccessText, { marginTop: 14 }]}>{successMessage}</Text>
            ) : null}

            {/* 1. Amount */}
            <View style={FS.section}>
              <View style={FS.labelRow}>
                <Text style={FS.labelText}>1. Enter Withdrawal Amount</Text>
                <Text style={FS.required}> *</Text>
              </View>
              <Text style={FS.subtitle}>
                Available balance: ₹{withdrawData.available_balance}
              </Text>
              <TextInput
                style={FS.input}
                value={form.amount}
                onChangeText={(v) => handleChange('amount', v)}
                placeholder="₹0"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
              />
              {errors.amount ? <Text style={FS.errorText}>{errors.amount}</Text> : null}

              <TouchableOpacity style={FS.checkRow} onPress={handleTransferFull}>
                <View style={[FS.checkBox, form.transferFull && FS.checkBoxActive]}>
                  {form.transferFull && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={FS.checkLabel}>Transfer full amount</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Payment mode */}
            <View style={FS.section}>
              <View style={FS.labelRow}>
                <Text style={FS.labelText}>2. Choose Payment Mode</Text>
                <Text style={FS.required}> *</Text>
              </View>

              <TouchableOpacity
                style={[FS.radioCard, form.payment_mode === 'bank' && FS.radioCardActive]}
                onPress={() => { handleChange('payment_mode', 'bank'); setErrors({}); }}
              >
                <View>
                  <Text style={FS.radioTitle}>Bank Transfer</Text>
                  <Text style={FS.radioDesc}>Amount will be sent directly to your bank account</Text>
                </View>
                <View style={[FS.radioDot, form.payment_mode === 'bank' && FS.radioDotActive]}>
                  {form.payment_mode === 'bank' && <View style={FS.radioDotFill} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[FS.radioCard, form.payment_mode === 'upi' && FS.radioCardActive]}
                onPress={() => { handleChange('payment_mode', 'upi'); setErrors({}); }}
              >
                <View>
                  <Text style={FS.radioTitle}>UPI</Text>
                  <Text style={FS.radioDesc}>Amount will be sent to your UPI ID instantly</Text>
                </View>
                <View style={[FS.radioDot, form.payment_mode === 'upi' && FS.radioDotActive]}>
                  {form.payment_mode === 'upi' && <View style={FS.radioDotFill} />}
                </View>
              </TouchableOpacity>
            </View>

            {/* PAN — backend har withdrawal (bank ya UPI dono) me pan_number maangta hai */}
            <View style={FS.section}>
              <View style={FS.labelRow}>
                <Text style={FS.labelText}>PAN Number</Text>
                <Text style={FS.required}> *</Text>
              </View>
              <Text style={FS.subtitle}>Required — a withdrawal request cannot be submitted without a PAN</Text>
              <TextInput
                style={FS.input}
                value={form.pan_number}
                onChangeText={(v) => handleChange('pan_number', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. ABCDE1234F"
                placeholderTextColor="#ccc"
                autoCapitalize="characters"
                maxLength={10}
              />
              {errors.pan_number ? <Text style={FS.errorText}>{errors.pan_number}</Text> : null}
            </View>

            {/* 3. Bank details */}
            {form.payment_mode === 'bank' && (
              <View style={FS.section}>
                <View style={FS.labelRow}>
                  <Text style={FS.labelText}>3. Bank Account Details</Text>
                  <Text style={FS.required}> *</Text>
                </View>
                <Text style={FS.subtitle}>Add your bank name, account number and IFSC code</Text>

                <TextInput
                  style={FS.input}
                  value={form.account_holder_name}
                  onChangeText={(v) => handleChange('account_holder_name', v)}
                  placeholder="Account Holder Name"
                  placeholderTextColor="#ccc"
                />
                {errors.account_holder_name ? <Text style={FS.errorText}>{errors.account_holder_name}</Text> : null}

                <TextInput
                  style={FS.input}
                  value={form.bank_name}
                  onChangeText={(v) => handleChange('bank_name', v)}
                  placeholder="Bank Name — e.g. State Bank of India"
                  placeholderTextColor="#ccc"
                />
                {errors.bank_name ? <Text style={FS.errorText}>{errors.bank_name}</Text> : null}

                <TextInput
                  style={FS.input}
                  value={form.account_number}
                  onChangeText={(v) => handleChange('account_number', v.replace(/\D/g, ''))}
                  placeholder="Account Number (9–18 digits)"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  maxLength={18}
                />
                {errors.account_number ? <Text style={FS.errorText}>{errors.account_number}</Text> : null}

                <TextInput
                  style={FS.input}
                  value={form.ifsc}
                  onChangeText={(v) => handleChange('ifsc', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="IFSC Code — e.g. SBIN0001234"
                  placeholderTextColor="#ccc"
                  autoCapitalize="characters"
                  maxLength={11}
                />
                {errors.ifsc ? (
                  <Text style={FS.errorText}>{errors.ifsc}</Text>
                ) : (
                  <Text style={FS.subtitle}>Format: 4 letters + 0 + 6 alphanumeric</Text>
                )}
              </View>
            )}

            {/* 3. UPI details */}
            {form.payment_mode === 'upi' && (
              <View style={FS.section}>
                <View style={FS.labelRow}>
                  <Text style={FS.labelText}>3. UPI ID</Text>
                  <Text style={FS.required}> *</Text>
                </View>
                <Text style={FS.subtitle}>Amount will be transferred to this UPI ID</Text>
                <TextInput
                  style={FS.input}
                  value={form.upi_id}
                  onChangeText={(v) => handleChange('upi_id', v)}
                  placeholder="e.g. name@upi"
                  placeholderTextColor="#ccc"
                  autoCapitalize="none"
                />
                {errors.upi_id ? <Text style={FS.errorText}>{errors.upi_id}</Text> : null}
              </View>
            )}

                       <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || withdrawData.wallet?.is_frozen || withdrawData.wallet?.can_withdraw === false}
              activeOpacity={0.85}
              style={(submitting || withdrawData.wallet?.is_frozen) ? { opacity: 0.6 } : undefined}
            >
              <LinearGradient
                colors={PN_GRADIENT_RED}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={FS.submitBtn}
              >
                <Feather name="arrow-up-circle" size={17} color="#fff" />
                <Text style={FS.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>

          {/* ── Withdrawal History Card ── */}
          <View style={WithdrawStyles.webTableCard}>
            <View style={WithdrawStyles.webTableHeader}>
              <Text style={WithdrawStyles.webTableTitle}>Withdrawal Status</Text>
              <Text style={WithdrawStyles.webRecordCount}>
                {totalRecords} record{totalRecords !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={WithdrawStyles.webTableBody}>
              {loading ? (
                <Text style={WithdrawStyles.webLoadingText}>Loading withdrawal data...</Text>
              ) : withdrawData.requests.length === 0 ? (
                <Text style={WithdrawStyles.webEmptyText}>No withdrawal requests found.</Text>
              ) : (
                <>
                  <View style={WithdrawStyles.webSearchWrap}>
                    <Feather name="search" size={15} color="#ccc" />
                    <TextInput
                      style={WithdrawStyles.webSearchInput}
                      value={searchQuery}
                      onChangeText={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                      placeholder="Search by amount, bank, status…"
                      placeholderTextColor="#ccc"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => { setSearchQuery(''); setCurrentPage(1); }}>
                        <Feather name="x" size={15} color="#ccc" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {totalRecords === 0 ? (
                    <Text style={WithdrawStyles.webEmptyText}>No records match your search.</Text>
                  ) : (
                    <>
                      {pagedRequests.map((item, index) => (
                        <View
                          key={item.id ?? index}
                          style={[
                            WithdrawStyles.webRequestCard,
                            index % 2 === 0 && WithdrawStyles.webRequestCardEven,
                          ]}
                        >
                          <View style={WithdrawStyles.webRequestTopRow}>
                            <Text style={WithdrawStyles.webRequestAmount}>₹{item.amount}</Text>
                            <View style={[WithdrawStyles.statusBadge, webStatusStyle(item.status)]}>
                              <Text style={[WithdrawStyles.statusText, webStatusTextStyle(item.status)]}>
                                {item.status}
                              </Text>
                            </View>
                          </View>

                          <View style={WithdrawStyles.webRequestMetaRow}>
                            <Feather name="credit-card" size={12} color="#ccc" />
                            <Text style={WithdrawStyles.webRequestMeta}>
                              Mode:{' '}
                              <Text style={WithdrawStyles.webRequestMetaBold}>
                                {item.payment_mode === 'upi' ? 'UPI' : 'Bank Transfer'}
                              </Text>
                            </Text>
                          </View>

                          {item.payment_mode === 'bank' ? (
                            <>
                              <View style={WithdrawStyles.webRequestMetaRow}>
                                <Feather name="home" size={12} color="#ccc" />
                                <Text style={WithdrawStyles.webRequestMeta}>
                                  Bank: <Text style={WithdrawStyles.webRequestMetaBold}>{item.bank_name}</Text>
                                </Text>
                              </View>
                              <View style={WithdrawStyles.webRequestMetaRow}>
                                <Feather name="hash" size={12} color="#ccc" />
                                <Text style={WithdrawStyles.webRequestMeta}>
                                  Account:{' '}
                                  <Text style={WithdrawStyles.webRequestMetaBold}>
                                    {maskAccount(item.account_number)}
                                  </Text>
                                </Text>
                              </View>
                              <View style={WithdrawStyles.webRequestMetaRow}>
                                <Feather name="tag" size={12} color="#ccc" />
                                <Text style={WithdrawStyles.webRequestMeta}>
                                  IFSC: <Text style={WithdrawStyles.webRequestMetaBold}>{item.ifsc_code || item.ifsc}</Text>
                                </Text>
                              </View>
                            </>
                          ) : (
                            <View style={WithdrawStyles.webRequestMetaRow}>
                              <Feather name="smartphone" size={12} color="#ccc" />
                              <Text style={WithdrawStyles.webRequestMeta}>
                                UPI ID: <Text style={WithdrawStyles.webRequestMetaBold}>{item.upi_id}</Text>
                              </Text>
                            </View>
                          )}

                          {item.status?.toLowerCase() === 'paid' && item.payout_reference ? (
                            <View style={WithdrawStyles.webRequestMetaRow}>
                              <Feather name="check-circle" size={12} color="#16a34a" />
                              <Text style={WithdrawStyles.webRequestMeta}>
                                UTR/Reference: <Text style={WithdrawStyles.webRequestMetaBold}>{item.payout_reference}</Text>
                              </Text>
                            </View>
                          ) : null}
                          {item.status?.toLowerCase() === 'rejected' && item.rejection_reason ? (
                            <View style={WithdrawStyles.webRequestMetaRow}>
                              <Feather name="alert-circle" size={12} color={ORANGE} />
                              <Text style={WithdrawStyles.webRequestMeta}>
                                Reason: <Text style={WithdrawStyles.webRequestMetaBold}>{item.rejection_reason}</Text>
                              </Text>
                            </View>
                          ) : null}

                          <Text style={WithdrawStyles.webRequestDate}>
                            Requested on: {item.date}
                          </Text>

                          {item.status?.toLowerCase() === 'pending' ? (
                            <TouchableOpacity
                              style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: ORANGE }}
                              onPress={() => handleCancelRequest(item.id)}
                            >
                              <Text style={{ color: ORANGE, fontSize: 12, fontWeight: '700' }}>Cancel Request</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ))}

                      <View style={WithdrawStyles.webPaginationWrap}>
                        <Text style={WithdrawStyles.webPaginationInfo}>
                          Showing{' '}
                          {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalRecords)}–
                          {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords}
                        </Text>
                        <View style={WithdrawStyles.webPaginationControls}>
                          <TouchableOpacity
                            style={[WithdrawStyles.webPageBtn, currentPage === 1 && WithdrawStyles.webPageBtnDisabled]}
                            onPress={() => goToPage(1)} disabled={currentPage === 1}
                          >
                            <Feather name="chevrons-left" size={13} color={currentPage === 1 ? '#ddd' : '#666'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[WithdrawStyles.webPageBtn, currentPage === 1 && WithdrawStyles.webPageBtnDisabled]}
                            onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                          >
                            <Feather name="chevron-left" size={13} color={currentPage === 1 ? '#ddd' : '#666'} />
                          </TouchableOpacity>
                          {pageNumbers.map((page) => (
                            <TouchableOpacity
                              key={page}
                              style={[WithdrawStyles.webPageBtn, page === currentPage && WithdrawStyles.webPageBtnActive]}
                              onPress={() => goToPage(page)}
                            >
                              <Text style={[WithdrawStyles.webPageBtnText, page === currentPage && WithdrawStyles.webPageBtnTextActive]}>
                                {page}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity
                            style={[WithdrawStyles.webPageBtn, currentPage === totalPages && WithdrawStyles.webPageBtnDisabled]}
                            onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                          >
                            <Feather name="chevron-right" size={13} color={currentPage === totalPages ? '#ddd' : '#666'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[WithdrawStyles.webPageBtn, currentPage === totalPages && WithdrawStyles.webPageBtnDisabled]}
                            onPress={() => goToPage(totalPages)} disabled={currentPage === totalPages}
                          >
                            <Feather name="chevrons-right" size={13} color={currentPage === totalPages ? '#ddd' : '#666'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
          </View>

        </ScrollView>

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          activeItem={moduleName}
        />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE — Same layout, Shuru red theme
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={WithdrawStyles.root}>

         {/* Top Bar — ek hi common header (components/ModuleMobileHeader.js) */}
      <ModuleMobileHeader
        title="Withdraw Earnings"
        navigation={navigation}
        onBack={() => navigation.navigate('QuickMenu')}
      />

      <ScrollView
        style={WithdrawStyles.scrollView}
        contentContainerStyle={[WithdrawStyles.scrollContent, isTablet && TABLET_CONTENT_WRAP]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <ImageBackground
          source={require('../assets/images/profile-red.png')}
          resizeMode="cover"
          imageStyle={{ borderRadius: 6 }}
          style={WithdrawStyles.heroCard}
        >
          <Text style={WithdrawStyles.heroEyebrow}>Earnings</Text>
          <Text style={WithdrawStyles.heroTitle}>Withdraw Earnings</Text>
        </ImageBackground>

        {/* ── Available Balance ── */}
        <View style={WithdrawStyles.balanceCard}>
          <Feather name="credit-card" size={22} color="#fff" />
          <View style={WithdrawStyles.balanceInfo}>
            <Text style={WithdrawStyles.balanceLabel}>Available Balance</Text>
            <Text style={WithdrawStyles.balanceValue}>
              ₹{withdrawData.available_balance}
            </Text>
          </View>
        </View>

        {withdrawData.wallet?.is_frozen ? (
          <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#F5B5B5', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <Feather name="alert-triangle" size={15} color="#7F1D1D" />
            <Text style={{ color: '#7F1D1D', fontSize: 12, fontWeight: '600', flex: 1 }}>
              {withdrawData.wallet.freeze_reason || 'Your wallet is frozen. Withdrawals are disabled.'}
            </Text>
          </View>
        ) : withdrawData.wallet?.pending_withdrawal_count > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FDE59A', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <Feather name="clock" size={15} color="#7A5B00" />
            <Text style={{ color: '#7A5B00', fontSize: 12, fontWeight: '600', flex: 1 }}>
              Aapki {withdrawData.wallet.pending_withdrawal_count} withdrawal request process me hai.
            </Text>
          </View>
        ) : null}

        {successMessage ? (
          <Text style={WithdrawStyles.successText}>{successMessage}</Text>
        ) : null}

     {/* ── WITHDRAW EARNING — flat, numbered, no card box (Shuru form style) ── */}
        <View style={{ paddingHorizontal: 4 }}>

          {/* 1. Amount */}
          <View style={FS.section}>
            <View style={FS.labelRow}>
              <Text style={FS.labelText}>1. Enter Withdrawal Amount</Text>
              <Text style={FS.required}> *</Text>
            </View>
            <Text style={FS.subtitle}>
              Available balance: ₹{withdrawData.available_balance}
            </Text>
            <TextInput
              style={FS.input}
              value={form.amount}
              onChangeText={(v) => handleChange('amount', v)}
              placeholder="₹0"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
            />
            {errors.amount ? <Text style={FS.errorText}>{errors.amount}</Text> : null}

            <TouchableOpacity style={FS.checkRow} onPress={handleTransferFull}>
              <View style={[FS.checkBox, form.transferFull && FS.checkBoxActive]}>
                {form.transferFull && <Feather name="check" size={11} color="#fff" />}
              </View>
              <Text style={FS.checkLabel}>Transfer full amount</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Payment mode */}
          <View style={FS.section}>
            <View style={FS.labelRow}>
              <Text style={FS.labelText}>2. Choose Payment Mode</Text>
              <Text style={FS.required}> *</Text>
            </View>

            <TouchableOpacity
              style={[FS.radioCard, form.payment_mode === 'bank' && FS.radioCardActive]}
              onPress={() => { handleChange('payment_mode', 'bank'); setErrors({}); }}
            >
              <View>
                <Text style={FS.radioTitle}>Bank Transfer</Text>
                <Text style={FS.radioDesc}>Amount will be sent directly to your bank account</Text>
              </View>
              <View style={[FS.radioDot, form.payment_mode === 'bank' && FS.radioDotActive]}>
                {form.payment_mode === 'bank' && <View style={FS.radioDotFill} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[FS.radioCard, form.payment_mode === 'upi' && FS.radioCardActive]}
              onPress={() => { handleChange('payment_mode', 'upi'); setErrors({}); }}
            >
              <View>
                <Text style={FS.radioTitle}>UPI</Text>
                <Text style={FS.radioDesc}>Amount will be sent to your UPI ID instantly</Text>
              </View>
              <View style={[FS.radioDot, form.payment_mode === 'upi' && FS.radioDotActive]}>
                {form.payment_mode === 'upi' && <View style={FS.radioDotFill} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* PAN — backend har withdrawal (bank ya UPI dono) me pan_number maangta hai */}
          <View style={FS.section}>
            <View style={FS.labelRow}>
              <Text style={FS.labelText}>PAN Number</Text>
              <Text style={FS.required}> *</Text>
            </View>
            <Text style={FS.subtitle}>Required — a withdrawal request cannot be submitted without a PAN</Text>
            <TextInput
              style={FS.input}
              value={form.pan_number}
              onChangeText={(v) => handleChange('pan_number', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. ABCDE1234F"
              placeholderTextColor="#ccc"
              autoCapitalize="characters"
              maxLength={10}
            />
            {errors.pan_number ? <Text style={FS.errorText}>{errors.pan_number}</Text> : null}
          </View>

          {/* 3. Bank details */}
          {form.payment_mode === 'bank' && (
            <View style={FS.section}>
              <View style={FS.labelRow}>
                <Text style={FS.labelText}>3. Bank Account Details</Text>
                <Text style={FS.required}> *</Text>
              </View>
              <Text style={FS.subtitle}>Add your bank name, account number and IFSC code</Text>

              <TextInput
                style={FS.input}
                value={form.account_holder_name}
                onChangeText={(v) => handleChange('account_holder_name', v)}
                placeholder="Account Holder Name"
                placeholderTextColor="#ccc"
              />
              {errors.account_holder_name ? <Text style={FS.errorText}>{errors.account_holder_name}</Text> : null}

              <TextInput
                style={FS.input}
                value={form.bank_name}
                onChangeText={(v) => handleChange('bank_name', v)}
                placeholder="Bank Name — e.g. State Bank of India"
                placeholderTextColor="#ccc"
              />
              {errors.bank_name ? <Text style={FS.errorText}>{errors.bank_name}</Text> : null}

              <TextInput
                style={FS.input}
                value={form.account_number}
                onChangeText={(v) => handleChange('account_number', v.replace(/\D/g, ''))}
                placeholder="Account Number (9–18 digits)"
                placeholderTextColor="#ccc"
                keyboardType="numeric"
                maxLength={18}
              />
              {errors.account_number ? <Text style={FS.errorText}>{errors.account_number}</Text> : null}

              <TextInput
                style={FS.input}
                value={form.ifsc}
                onChangeText={(v) => handleChange('ifsc', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="IFSC Code — e.g. SBIN0001234"
                placeholderTextColor="#ccc"
                autoCapitalize="characters"
                maxLength={11}
              />
              {errors.ifsc ? (
                <Text style={FS.errorText}>{errors.ifsc}</Text>
              ) : (
                <Text style={FS.subtitle}>Format: 4 letters + 0 + 6 alphanumeric</Text>
              )}
            </View>
          )}

          {/* 3. UPI details */}
          {form.payment_mode === 'upi' && (
            <View style={FS.section}>
              <View style={FS.labelRow}>
                <Text style={FS.labelText}>3. UPI ID</Text>
                <Text style={FS.required}> *</Text>
              </View>
              <Text style={FS.subtitle}>Amount will be transferred to this UPI ID</Text>
              <TextInput
                style={FS.input}
                value={form.upi_id}
                onChangeText={(v) => handleChange('upi_id', v)}
                placeholder="e.g. name@upi"
                placeholderTextColor="#ccc"
                autoCapitalize="none"
              />
              {errors.upi_id ? <Text style={FS.errorText}>{errors.upi_id}</Text> : null}
            </View>
          )}

            <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || withdrawData.wallet?.is_frozen || withdrawData.wallet?.can_withdraw === false}
            activeOpacity={0.85}
            style={(submitting || withdrawData.wallet?.is_frozen) ? FS.submitBtnDisabled : undefined}
          >
            <LinearGradient
              colors={PN_GRADIENT_RED}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={FS.submitBtn}
            >
              <Feather name="arrow-up-circle" size={17} color="#fff" />
              <Text style={FS.submitBtnText}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Withdrawal Status DataTable ── */}
        <View style={WithdrawStyles.card}>
          <View style={WithdrawStyles.tableTopRow}>
            <Text style={WithdrawStyles.sectionTitle}>Withdrawal Status</Text>
            <Text style={WithdrawStyles.recordCount}>
              {totalRecords} record{totalRecords !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading ? (
            <Text style={WithdrawStyles.loadingText}>Loading withdrawal data...</Text>
          ) : withdrawData.requests.length === 0 ? (
            <Text style={WithdrawStyles.emptyText}>No withdrawal requests found.</Text>
          ) : (
            <>
              <View style={WithdrawStyles.searchWrap}>
                <Feather name="search" size={15} color="#ccc" />
                <TextInput
                  style={WithdrawStyles.searchInput}
                  value={searchQuery}
                  onChangeText={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                  placeholder="Search by amount, bank, status…"
                  placeholderTextColor="#ccc"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setCurrentPage(1); }}>
                    <Feather name="x" size={15} color="#ccc" />
                  </TouchableOpacity>
                )}
              </View>

              {totalRecords === 0 ? (
                <Text style={WithdrawStyles.emptyText}>No records match your search.</Text>
              ) : (
                <>
                  {pagedRequests.map((item, index) => (
                    <View
                      key={item.id ?? index}
                      style={[
                        WithdrawStyles.requestCard,
                        index % 2 === 0 && WithdrawStyles.requestCardEven,
                        index === pagedRequests.length - 1 && WithdrawStyles.requestCardLast,
                      ]}
                    >
                      <View style={WithdrawStyles.requestTopRow}>
                        <Text style={WithdrawStyles.requestAmount}>₹{item.amount}</Text>
                        <View style={[WithdrawStyles.statusBadge, statusStyle(item.status)]}>
                          <Text style={[WithdrawStyles.statusText, statusTextStyle(item.status)]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View style={WithdrawStyles.requestMetaRow}>
                        <Feather name="credit-card" size={12} color="#ccc" />
                        <Text style={WithdrawStyles.requestMeta}>
                          Mode:{' '}
                          <Text style={WithdrawStyles.requestMetaBold}>
                            {item.payment_mode === 'upi' ? 'UPI' : 'Bank Transfer'}
                          </Text>
                        </Text>
                      </View>

                      {item.payment_mode === 'bank' ? (
                        <>
                          <View style={WithdrawStyles.requestMetaRow}>
                            <Feather name="home" size={12} color="#ccc" />
                            <Text style={WithdrawStyles.requestMeta}>
                              Bank: <Text style={WithdrawStyles.requestMetaBold}>{item.bank_name}</Text>
                            </Text>
                          </View>
                          <View style={WithdrawStyles.requestMetaRow}>
                            <Feather name="hash" size={12} color="#ccc" />
                            <Text style={WithdrawStyles.requestMeta}>
                              Account:{' '}
                              <Text style={WithdrawStyles.requestMetaBold}>
                                {maskAccount(item.account_number)}
                              </Text>
                            </Text>
                          </View>
                          <View style={WithdrawStyles.requestMetaRow}>
                            <Feather name="tag" size={12} color="#ccc" />
                            <Text style={WithdrawStyles.requestMeta}>
                              IFSC: <Text style={WithdrawStyles.requestMetaBold}>{item.ifsc_code || item.ifsc}</Text>
                            </Text>
                          </View>
                        </>
                      ) : (
                        <View style={WithdrawStyles.requestMetaRow}>
                          <Feather name="smartphone" size={12} color="#ccc" />
                          <Text style={WithdrawStyles.requestMeta}>
                            UPI ID: <Text style={WithdrawStyles.requestMetaBold}>{item.upi_id}</Text>
                          </Text>
                        </View>
                      )}

                      {item.status?.toLowerCase() === 'paid' && item.payout_reference ? (
                        <View style={WithdrawStyles.requestMetaRow}>
                          <Feather name="check-circle" size={12} color="#16a34a" />
                          <Text style={WithdrawStyles.requestMeta}>
                            UTR/Reference: <Text style={WithdrawStyles.requestMetaBold}>{item.payout_reference}</Text>
                          </Text>
                        </View>
                      ) : null}
                      {item.status?.toLowerCase() === 'rejected' && item.rejection_reason ? (
                        <View style={WithdrawStyles.requestMetaRow}>
                          <Feather name="alert-circle" size={12} color={ORANGE} />
                          <Text style={WithdrawStyles.requestMeta}>
                            Reason: <Text style={WithdrawStyles.requestMetaBold}>{item.rejection_reason}</Text>
                          </Text>
                        </View>
                      ) : null}

                      <Text style={WithdrawStyles.requestDate}>
                        Requested on: {item.date}
                      </Text>

                      {item.status?.toLowerCase() === 'pending' ? (
                        <TouchableOpacity
                          style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: ORANGE }}
                          onPress={() => handleCancelRequest(item.id)}
                        >
                          <Text style={{ color: ORANGE, fontSize: 12, fontWeight: '700' }}>Cancel Request</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}

                  <View style={WithdrawStyles.paginationWrap}>
                    <Text style={WithdrawStyles.paginationInfo}>
                      Showing{' '}
                      {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalRecords)}–
                      {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords}
                    </Text>
                    <View style={WithdrawStyles.paginationControls}>
                      <TouchableOpacity
                        style={[WithdrawStyles.pageBtn, currentPage === 1 && WithdrawStyles.pageBtnDisabled]}
                        onPress={() => goToPage(1)} disabled={currentPage === 1}
                      >
                        <Feather name="chevrons-left" size={13} color={currentPage === 1 ? '#ddd' : '#666'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[WithdrawStyles.pageBtn, currentPage === 1 && WithdrawStyles.pageBtnDisabled]}
                        onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                      >
                        <Feather name="chevron-left" size={13} color={currentPage === 1 ? '#ddd' : '#666'} />
                      </TouchableOpacity>
                      {pageNumbers.map((page) => (
                        <TouchableOpacity
                          key={page}
                          style={[WithdrawStyles.pageBtn, page === currentPage && WithdrawStyles.pageBtnActive]}
                          onPress={() => goToPage(page)}
                        >
                          <Text style={[WithdrawStyles.pageBtnText, page === currentPage && WithdrawStyles.pageBtnTextActive]}>
                            {page}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[WithdrawStyles.pageBtn, currentPage === totalPages && WithdrawStyles.pageBtnDisabled]}
                        onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                      >
                        <Feather name="chevron-right" size={13} color={currentPage === totalPages ? '#ddd' : '#666'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[WithdrawStyles.pageBtn, currentPage === totalPages && WithdrawStyles.pageBtnDisabled]}
                        onPress={() => goToPage(totalPages)} disabled={currentPage === totalPages}
                      >
                        <Feather name="chevrons-right" size={13} color={currentPage === totalPages ? '#ddd' : '#666'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        activeItem={moduleName}
      />
    </View>
  );
}