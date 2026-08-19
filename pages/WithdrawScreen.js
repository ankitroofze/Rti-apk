import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ui/ToastProvider';
import WithdrawStyles from '../styles/WithdrawStyles';
import { UserStore } from '../store/UserStore';

const PAGE_SIZE = 10;

// === Shuru theme accent (was ORANGE '#e8603c') ===
const ORANGE = '#dc2626';

// ─── Header override — matches AdvertiseScreen's top bar exactly (font, back arrow, spacing) ───
const HEADER_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54;
const H = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: HEADER_TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E6E6E6',
  },
  backBtn: { 
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center', 
    borderRadius: 6, // ✅ Border radius 6px
    marginLeft: -6 
  },
  title:   { 
    flex: 1, 
    fontSize: 15, 
    color: '#353535',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
    fontWeight: '600', // ✅ Weight 600
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
  input:          {
    marginTop: 10, minHeight: 46, borderRadius: 6, // ✅ Border radius 6px
    borderWidth: 1,
    borderColor: ORANGE, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: '#222',
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
    borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 6, // ✅ Border radius 6px
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
  submitBtn:      {
    marginTop: 28, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: ORANGE, borderRadius: 6, // ✅ Border radius 6px
    paddingVertical: 14,
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
  amount:         '',
  payment_mode:   'bank',
  bank_name:      '',
  account_number: '',
  ifsc:           '',
  upi_id:         '',
  transferFull:   false,
};

const IFSC_REGEX    = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{9,18}$/;

function validateForm(form) {
  const errors = {};
  if (!form.amount.trim()) {
    errors.amount = 'Amount is required.';
  } else if (isNaN(form.amount) || Number(form.amount) <= 0) {
    errors.amount = 'Enter a valid amount greater than 0.';
  }
  if (form.payment_mode === 'bank') {
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
      amount:       form.amount,
      payment_mode: form.payment_mode,
      ...(form.payment_mode === 'bank'
        ? {
            bank_name:      form.bank_name.trim(),
            account_number: form.account_number.trim(),
            ifsc:           form.ifsc.trim().toUpperCase(),
          }
        : { upi_id: form.upi_id.trim() }),
    };
    const result = await UserStore.createWithdrawRequest(payload);
    setSubmitting(false);
    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }
    setForm(initialForm);
    setErrors({});
    setSuccessMessage('Withdrawal request submitted successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={WithdrawStyles.webPage}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Back Button ── */}
          <View style={WithdrawStyles.webBackBtn}>
            <TouchableOpacity
              onPress={() => navigation.navigate('QuickMenu')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="arrow-back" size={18} color={ORANGE} />
              <Text style={WithdrawStyles.webBackBtnText}>Back</Text>
            </TouchableOpacity>
          </View>

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
              style={[FS.submitBtn, submitting && FS.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Feather name="arrow-up-circle" size={17} color="#fff" />
              <Text style={FS.submitBtnText}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Text>
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
                                  IFSC: <Text style={WithdrawStyles.webRequestMetaBold}>{item.ifsc}</Text>
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

                          <Text style={WithdrawStyles.webRequestDate}>
                            Requested on: {item.date}
                          </Text>
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

      {/* Top Bar — matches AdvertiseScreen header style */}
      <View style={H.header}>
        <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={H.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={[H.title, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Withdraw Earnings</Text>
      </View>

      <ScrollView
        style={WithdrawStyles.scrollView}
        contentContainerStyle={[WithdrawStyles.scrollContent, isTablet && TABLET_CONTENT_WRAP]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={WithdrawStyles.heroCard}>
          <Text style={WithdrawStyles.heroEyebrow}>Earnings</Text>
          <Text style={WithdrawStyles.heroTitle}>Withdraw Earnings</Text>
        </View>

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
            style={[FS.submitBtn, submitting && FS.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Feather name="arrow-up-circle" size={17} color="#fff" />
            <Text style={FS.submitBtnText}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Text>
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
                              IFSC: <Text style={WithdrawStyles.requestMetaBold}>{item.ifsc}</Text>
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

                      <Text style={WithdrawStyles.requestDate}>
                        Requested on: {item.date}
                      </Text>
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