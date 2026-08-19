import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Platform, useWindowDimensions, StatusBar, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import Sidebar from '../components/Sidebar';
import { UserStore } from '../store/UserStore';

const PAGE_SIZE = 10;

// ─── Header override — matches AdvertiseScreen's top bar exactly ───
const HEADER_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54;
const H = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: HEADER_TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E6E6E6',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginLeft: -6 },
  title:   { flex: 1, fontSize: 15, fontWeight: '600', color: '#353535' },
});

// ─── Orange tokens ───
const O = {
  50:  '#FEF6EC',
  100: '#FDECD8',
  200: '#FBCFA0',
  400: '#ef810c',
  500: '#e07709',
  600: '#C8700F',
  800: '#7A420A',
};

// ═══════════════════════════════════════════════════════════════════════════
// WEB styles — clean, minimal dashboard
// ═══════════════════════════════════════════════════════════════════════════
const w = {
  root: { flex: 1, backgroundColor: '#F7F4F0', flexDirection: 'column', minHeight: '100vh' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingVertical: 14,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#EDE8E1',
  },
  topLeft:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bcStep:     { fontSize: 13, color: '#888888', fontFamily: 'Roboto_400Regular' },
  bcSep:      { fontSize: 15, color: '#CCCCCC', marginHorizontal: 4, fontFamily: 'Roboto_400Regular' },
  bcCur:      { fontSize: 13, fontWeight: '600', color: '#111111', fontFamily: 'Roboto_500Medium' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 8,
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#be5600', fontFamily: 'Roboto_500Medium' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 60, alignItems: 'center' },
  innerWrap:     { width: '100%', maxWidth: 1100, alignSelf: 'center' },

  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111111', marginBottom: 4, fontFamily: 'Roboto_900Black' },
  pageSub:   { fontSize: 14, color: '#888888', marginBottom: 26, fontFamily: 'Roboto_400Regular' },

  topRow:   { flexDirection: 'row', gap: 14, marginBottom: 16 },

 heroCard: {
    flex: 1.4, borderRadius: 20,
    overflow: 'hidden', padding: 26,
  },
  heroDecor1: { position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroDecor2: { position: 'absolute', bottom: -70, right: 60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  heroBadgeTxt: { fontSize: 13, fontWeight: '700', color: O[500], fontFamily: 'Roboto_700Bold' },
  heroLbl:   { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontFamily: 'Roboto_500Medium' },
  heroAmt:   { fontSize: 46, fontWeight: '800', color: '#ffffff', letterSpacing: -1, marginBottom: 6, fontFamily: 'Roboto_900Black' },
  heroHint:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Roboto_400Regular' },

 statsCol:  { flex: 1, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#ffffff',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EDE8E1', overflow: 'hidden',
  },
  ribbonCorner: {
    position: 'absolute', top: 0, right: 0, width: 0, height: 0,
    borderTopWidth: 26, borderLeftWidth: 26,
    borderTopColor: O[400], borderLeftColor: 'transparent',
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statIconCredit: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: O[50],
    alignItems: 'center', justifyContent: 'center',
  },
  statIconDebit: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FDEEEE',
    alignItems: 'center', justifyContent: 'center',
  },
  statBadgeCredit: {
    backgroundColor: '#E7F7EE', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statBadgeCreditTxt: { fontSize: 11, fontWeight: '700', color: '#1FA35C', fontFamily: 'Roboto_700Bold' },
  statBadgeDebit: {
    backgroundColor: '#FDEBEE', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statBadgeDebitTxt: { fontSize: 11, fontWeight: '700', color: '#E15252', fontFamily: 'Roboto_700Bold' },
  statTitle: { fontSize: 13, fontWeight: '700', color: '#333333', marginBottom: 6, fontFamily: 'Roboto_700Bold' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#111111', marginBottom: 2, fontFamily: 'Roboto_900Black' },
  statLbl: { fontSize: 11, color: '#888888', fontWeight: '500', fontFamily: 'Roboto_500Medium' },
 card: {
    backgroundColor: '#ffffff', borderRadius: 16,
    borderWidth: 1, borderColor: '#EDE8E1',
    overflow: 'hidden', marginBottom: 16,
  },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: '#111111', fontFamily: 'Roboto_900Black' },
  cardSub:      { fontSize: 12, color: '#888888', marginTop: 2, fontFamily: 'Roboto_400Regular' },
  cardBody:     { padding: 20 },

  latestWrap: {
    borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 12, padding: 16, backgroundColor: '#fafafa',
  },
  latestTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sourceBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 20,
  },
  sourceBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#333333', fontFamily: 'Roboto_700Bold' },
  latestDate:     { fontSize: 12, color: '#AAAAAA', fontWeight: '500', fontFamily: 'Roboto_500Medium' },
  latestRow:      { flexDirection: 'row', gap: 40 },
  latestLbl:      { fontSize: 10, color: '#AAAAAA', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: 'Roboto_700Bold' },
  latestAmt:      { fontSize: 26, fontWeight: '800', color: '#111111', fontFamily: 'Roboto_900Black' },
  typePillCredit: { paddingHorizontal: 12, paddingVertical: 3, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7', borderRadius: 20 },
  typePillDebit:  { paddingHorizontal: 12, paddingVertical: 3, backgroundColor: '#fce4ec', borderWidth: 1, borderColor: '#ef9a9a', borderRadius: 20 },
  typeTxtCredit:  { fontSize: 12, fontWeight: '700', color: '#2e7d32', fontFamily: 'Roboto_700Bold' },
  typeTxtDebit:   { fontSize: 12, fontWeight: '700', color: '#c62828', fontFamily: 'Roboto_700Bold' },

 pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: O[100], borderWidth: 1, borderColor: O[200],
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  pillTxt: { fontSize: 12, fontWeight: '700', color: O[600], fontFamily: 'Roboto_700Bold' },

  tblWrap: { 
    borderWidth: 1, 
    borderColor: '#EDE8E1', 
    borderRadius: 0,
    overflow: 'hidden', 
    marginHorizontal: 0, 
    marginBottom: 4 
  },
  tblHdr: {
    flexDirection: 'row', backgroundColor: '#f5f5f5',
    paddingVertical: 10, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0', alignItems: 'center',
  },
  hc: { fontSize: 10, fontWeight: '800', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Roboto_700Bold' },
  trow: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    alignItems: 'center', backgroundColor: '#ffffff',
  },
  trowAlt: { backgroundColor: '#fafafa' },

  colAmount: { flex: 1 },
  colType:   { flex: 0.8 },
  colSource: { flex: 1.4 },
  colDate:   { flex: 1.2, alignItems: 'flex-end' },

  amtCredit: { fontSize: 13, fontWeight: '800', color: '#2e7d32', fontFamily: 'Roboto_700Bold' },
  amtDebit:  { fontSize: 13, fontWeight: '800', color: '#c62828', fontFamily: 'Roboto_700Bold' },
  rowTxt:    { fontSize: 13, color: '#666666', fontWeight: '500', fontFamily: 'Roboto_500Medium' },
  rowPillCredit: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    backgroundColor: '#e8f5e9', 
    borderWidth: 1, 
    borderColor: '#a5d6a7', 
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rowPillDebit: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    backgroundColor: '#fce4ec', 
    borderWidth: 1, 
    borderColor: '#ef9a9a', 
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rowPillTxtCredit: { fontSize: 10, fontWeight: '700', color: '#2e7d32', fontFamily: 'Roboto_700Bold' },
  rowPillTxtDebit:  { fontSize: 10, fontWeight: '700', color: '#c62828', fontFamily: 'Roboto_700Bold' },

  pagRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
    borderTopWidth: 1, borderTopColor: '#e0e0e0',
  },
  pagInfo: { fontSize: 12, color: '#888888', fontWeight: '500', fontFamily: 'Roboto_500Medium' },
  pagBtns: { flexDirection: 'row', alignItems: 'center', gap: 4 },
 pb: {
    minWidth: 34, height: 34, borderRadius: 9,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDE8E1',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  pbOn:    { backgroundColor: O[400], borderColor: O[400] },
  pbOff:   { opacity: 0.3 },
  pbTxt:   { fontSize: 13, fontWeight: '700', color: '#555555', fontFamily: 'Roboto_700Bold' },
  pbTxtOn: { color: '#ffffff' },

  loadingTxt: { fontSize: 14, color: '#888888', paddingVertical: 40, textAlign: 'center', fontFamily: 'Roboto_400Regular' },
  emptyWrap:  { alignItems: 'center', paddingVertical: 40 },
  emptyTxt:   { fontSize: 14, color: '#888888', fontFamily: 'Roboto_400Regular' },
};

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE styles — clean, minimal design
// ═══════════════════════════════════════════════════════════════════════════
const m = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F7F4F0' },
  scrollView:  { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

heroCard: {
    backgroundColor: '#2c3e50', borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: '#34495e',
    overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  heroDecor1: { position: 'absolute', top: -50, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' },
  heroDecor2: { position: 'absolute', bottom: -40, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  heroIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  heroBalanceLbl: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', fontFamily: 'Roboto_700Bold' },
  heroAmount: { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: -1, marginBottom: 2, fontFamily: 'Roboto_900Black' },
  heroHint:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16, fontFamily: 'Roboto_400Regular' },

  heroStatsRow: { flexDirection: 'row', gap: 10 },
  heroStat: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  heroStatIcon: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  heroStatTextWrap: { flex: 1 },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: 'Roboto_500Medium' },
  heroStatVal: { fontSize: 14, color: '#ffffff', fontWeight: '800', marginTop: 1, fontFamily: 'Roboto_900Black' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: '#222222', fontFamily: 'Roboto_900Black' },
  sectionBadge:  { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: '#333333', fontFamily: 'Roboto_700Bold' },

  // Latest transaction card
 latestCard: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#d0d0d0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  latestCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  latestCardTitle:  { fontSize: 13, fontWeight: '700', color: '#333333', fontFamily: 'Roboto_700Bold' },
  sourceBadge:      { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  sourceBadgeText:  { fontSize: 11, fontWeight: '700', color: '#333333', fontFamily: 'Roboto_700Bold' },
  latestRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  latestLbl:  { fontSize: 10, color: '#AAAAAA', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4, fontFamily: 'Roboto_700Bold' },
  latestAmt:  { fontSize: 22, fontWeight: '800', color: '#111111', fontFamily: 'Roboto_900Black' },
  latestDate: { fontSize: 11, color: '#AAAAAA', fontWeight: '500', fontFamily: 'Roboto_500Medium' },
  typePillCredit: { paddingHorizontal: 12, paddingVertical: 3, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7', borderRadius: 20 },
  typePillDebit:  { paddingHorizontal: 12, paddingVertical: 3, backgroundColor: '#fce4ec', borderWidth: 1, borderColor: '#ef9a9a', borderRadius: 20 },
  typeTxtCredit:  { fontSize: 12, fontWeight: '700', color: '#2e7d32', fontFamily: 'Roboto_700Bold' },
  typeTxtDebit:   { fontSize: 12, fontWeight: '700', color: '#c62828', fontFamily: 'Roboto_700Bold' },

  // Table
  tableWrap: {
    backgroundColor: '#ffffff', borderRadius: 0, overflow: 'hidden',
    borderWidth: 1, borderColor: '#d0d0d0', marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f5f5f5',
    paddingVertical: 8, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: { fontSize: 10, fontWeight: '800', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Roboto_700Bold' },
  tableRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center',
  },
  tableRowEven: { backgroundColor: '#fafafa' },

  colAmount: { flex: 1.1 },
  colType:   { flex: 0.8 },
  colSource: { flex: 1.2 },
  colDate:   { flex: 1, alignItems: 'flex-end' },

  amountCredit: { fontSize: 12, fontWeight: '800', color: '#2e7d32', fontFamily: 'Roboto_700Bold' },
  amountDebit:  { fontSize: 12, fontWeight: '800', color: '#c62828', fontFamily: 'Roboto_700Bold' },
  rowText:      { fontSize: 11, color: '#666666', fontWeight: '500', fontFamily: 'Roboto_500Medium' },

  typePill: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 20, 
    alignSelf: 'flex-start',
  },
  typePillTextCredit: { fontSize: 9, fontWeight: '700', color: '#2e7d32', fontFamily: 'Roboto_700Bold' },
  typePillTextDebit:  { fontSize: 9, fontWeight: '700', color: '#c62828', fontFamily: 'Roboto_700Bold' },

  paginationWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  paginationInfo: { fontSize: 11, color: '#888888', fontWeight: '500', fontFamily: 'Roboto_500Medium' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
 pageBtn: {
    minWidth: 28, height: 28, borderRadius: 999,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d0d0d0',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  pageBtnActive:   { backgroundColor: O[400], borderColor: O[400] },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText:       { fontSize: 12, fontWeight: '700', color: '#555555', fontFamily: 'Roboto_700Bold' },
  pageBtnTextActive: { color: '#ffffff' },

  loadingText: { fontSize: 13, color: '#888888', textAlign: 'center', paddingVertical: 40, fontFamily: 'Roboto_400Regular' },
  emptyText:   { fontSize: 13, color: '#888888', textAlign: 'center', paddingVertical: 40, fontFamily: 'Roboto_400Regular' },
});

export default function WalletScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading]               = useState(true);
  const [currentUser, setCurrentUser]       = useState(null);
  const [currentPage, setCurrentPage]       = useState(1);

  const [summary, setSummary] = useState({
    total_balance: 0, total_credit: 0, total_debit: 0, transactions: [],
  });

  const moduleName = 'Wallet';
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && windowWidth <= 760;
  const isTablet = windowWidth >= 768;

  const loadWallet = useCallback(async () => {
    setLoading(true);
    const [walletSummary, user] = await Promise.all([
      UserStore.getWalletSummary(),
      UserStore.getCurrentUser(),
    ]);
    setLoading(false);
    if (!walletSummary || !user) { navigation.replace('Login'); return; }
    setSummary(walletSummary);
    setCurrentUser(user);
    setCurrentPage(1);
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadWallet(); }, [loadWallet]));

  const latestTransaction = useMemo(
    () => summary.transactions.length ? summary.transactions[0] : null,
    [summary.transactions]
  );

  const totalRecords = summary.transactions.length;
  const totalPages   = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return summary.transactions.slice(start, start + PAGE_SIZE);
  }, [summary.transactions, currentPage]);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const pageNumbers = useMemo(() => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  // ══════════════════════════════════════════════════════════════════════════
  // WEB LAYOUT — clean minimal dashboard
  // ══════════════════════════════════════════════════════════════════════════
  if (isWeb && !isMobileWeb) {
    return (
      <View style={w.root}>
        <View style={w.topBar}>
          <View style={w.topLeft}>
            <Feather name="home" size={14} color="#888888" />
            <Text style={w.bcSep}>›</Text>
            <Text style={w.bcStep}>Dashboard</Text>
            <Text style={w.bcSep}>›</Text>
            <Text style={w.bcCur}>Wallet</Text>
          </View>
          <TouchableOpacity style={w.backBtn} onPress={() => navigation.navigate('QuickMenu')} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={13} color="#333" />
            <Text style={w.backBtnText}>Back to menu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={w.scroll} contentContainerStyle={w.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={w.innerWrap}>
            <Text style={w.pageTitle}>Wallet</Text>
            <Text style={w.pageSub}>Your balance, credits, debits and full transaction history.</Text>

            <View style={w.topRow}>
              <LinearGradient
                colors={[O[400], O[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={w.heroCard}
              >
                <View style={w.heroDecor1} />
                <View style={w.heroDecor2} />
                <View style={w.heroTopRow}>
                  <View style={w.heroIconWrap}>
                    <Feather name="credit-card" size={18} color="#ffffff" />
                  </View>
                  <View style={w.heroBadge}>
                    <Text style={w.heroBadgeTxt}>Available</Text>
                  </View>
                </View>
                <Text style={w.heroLbl}>Total Balance</Text>
                <Text style={w.heroAmt}>₹{summary.total_balance.toLocaleString()}</Text>
                <Text style={w.heroHint}>Available balance in your wallet</Text>
              </LinearGradient>

              <View style={w.statsCol}>
                <View style={w.statCard}>
                  <View style={w.ribbonCorner} />
                  <View style={w.statTop}>
                    <View style={w.statIconCredit}>
                      <Feather name="arrow-down-circle" size={17} color={O[400]} />
                    </View>
                    <View style={w.statBadgeCredit}>
                      <Text style={w.statBadgeCreditTxt}>Received</Text>
                    </View>
                  </View>
                  <Text style={w.statTitle}>Total Credit</Text>
                  <Text style={w.statVal}>₹{summary.total_credit.toLocaleString()}</Text>
                  <Text style={w.statLbl}>Amount received</Text>
                </View>
                <View style={w.statCard}>
                  <View style={w.ribbonCorner} />
                  <View style={w.statTop}>
                    <View style={w.statIconDebit}>
                      <Feather name="arrow-up-circle" size={17} color="#E15252" />
                    </View>
                    <View style={w.statBadgeDebit}>
                      <Text style={w.statBadgeDebitTxt}>Spent</Text>
                    </View>
                  </View>
                  <Text style={w.statTitle}>Total Debit</Text>
                  <Text style={w.statVal}>₹{summary.total_debit.toLocaleString()}</Text>
                  <Text style={w.statLbl}>Amount spent</Text>
                </View>
              </View>
            </View>

            <View style={[w.card, { marginBottom: 16 }]}>
              <View style={w.cardHead}>
                <View style={w.cardHeadLeft}>
                  <Feather name="clock" size={16} color={O[400]} />
                  <Text style={w.cardTitle}>Latest Transaction</Text>
                </View>
              </View>
              <View style={w.cardBody}>
                {latestTransaction ? (
                  <View style={w.latestWrap}>
                    <View style={w.latestTop}>
                      <View style={latestTransaction.type === 'credit' ? w.typePillCredit : w.typePillDebit}>
                        <Text style={latestTransaction.type === 'credit' ? w.typeTxtCredit : w.typeTxtDebit}>
                          {latestTransaction.type === 'credit' ? 'Income' : 'Expense'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Feather name="calendar" size={13} color="#AAAAAA" />
                        <Text style={w.latestDate}>{latestTransaction.date}</Text>
                      </View>
                    </View>
                    <View style={w.latestRow}>
                      <View>
                        <Text style={w.latestLbl}>Amount</Text>
                        <Text style={w.latestAmt}>₹{latestTransaction.amount.toLocaleString()}</Text>
                      </View>
                      <View>
                        <Text style={w.latestLbl}>Type</Text>
                        <View style={latestTransaction.type === 'credit' ? w.typePillCredit : w.typePillDebit}>
                          <Text style={latestTransaction.type === 'credit' ? w.typeTxtCredit : w.typeTxtDebit}>
                            {latestTransaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={w.emptyWrap}><Text style={w.emptyTxt}>No transactions found.</Text></View>
                )}
              </View>
            </View>

            <View style={w.card}>
              <View style={w.cardHead}>
                <View style={w.cardHeadLeft}>
                  <Feather name="list" size={16} color={O[400]} />
                  <View>
                    <Text style={w.cardTitle}>Transaction History</Text>
                    <Text style={w.cardSub}>All wallet credits and debits</Text>
                  </View>
                </View>
                <View style={w.pill}>
                  <Feather name="list" size={12} color={O[600]} />
                  <Text style={w.pillTxt}>{totalRecords} Record{totalRecords !== 1 ? 's' : ''}</Text>
                </View>
              </View>

              {loading ? (
                <Text style={w.loadingTxt}>Loading wallet data...</Text>
              ) : totalRecords === 0 ? (
                <View style={w.emptyWrap}><Text style={w.emptyTxt}>No wallet records found.</Text></View>
              ) : (
                <>
                  <View style={w.tblWrap}>
                    <View style={w.tblHdr}>
                      <Text style={[w.hc, w.colAmount]}>Amount</Text>
                      <Text style={[w.hc, w.colType]}>Type</Text>
                      <Text style={[w.hc, w.colSource]}>Source</Text>
                      <Text style={[w.hc, w.colDate]}>Date</Text>
                    </View>
                    {pagedTransactions.map((item, index) => (
                      <View key={item.id ?? index} style={[w.trow, index % 2 !== 0 && w.trowAlt]}>
                        <View style={w.colAmount}>
                          <Text style={item.type === 'credit' ? w.amtCredit : w.amtDebit}>
                            ₹{item.amount.toLocaleString()}
                          </Text>
                        </View>
                        <View style={w.colType}>
                          <View style={item.type === 'credit' ? w.rowPillCredit : w.rowPillDebit}>
                            <Text style={item.type === 'credit' ? w.rowPillTxtCredit : w.rowPillTxtDebit}>
                              {item.type === 'credit' ? 'Credit' : 'Debit'}
                            </Text>
                          </View>
                        </View>
                        <View style={w.colSource}><Text style={w.rowTxt}>{item.source}</Text></View>
                        <View style={w.colDate}><Text style={w.rowTxt}>{item.date}</Text></View>
                      </View>
                    ))}
                  </View>
                  <View style={w.pagRow}>
                    <Text style={w.pagInfo}>
                      Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalRecords)}–{Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords}
                    </Text>
                    <View style={w.pagBtns}>
                      <TouchableOpacity style={[w.pb, currentPage === 1 && w.pbOff]} onPress={() => goToPage(1)} disabled={currentPage === 1}>
                        <Feather name="chevrons-left" size={14} color={currentPage === 1 ? '#CCC' : O[600]} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[w.pb, currentPage === 1 && w.pbOff]} onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                        <Feather name="chevron-left" size={14} color={currentPage === 1 ? '#CCC' : O[600]} />
                      </TouchableOpacity>
                      {pageNumbers.map((page) => (
                        <TouchableOpacity key={page} style={[w.pb, page === currentPage && w.pbOn]} onPress={() => goToPage(page)}>
                          <Text style={[w.pbTxt, page === currentPage && w.pbTxtOn]}>{page}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[w.pb, currentPage === totalPages && w.pbOff]} onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                        <Feather name="chevron-right" size={14} color={currentPage === totalPages ? '#CCC' : O[600]} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[w.pb, currentPage === totalPages && w.pbOff]} onPress={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                        <Feather name="chevrons-right" size={14} color={currentPage === totalPages ? '#CCC' : O[600]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT — clean minimal design
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={m.root}>

      <View style={H.header}>
        <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={H.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={[H.title, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Wallet</Text>
      </View>

      <ScrollView
        style={m.scrollView}
        contentContainerStyle={[m.scrollContent, isTablet && { maxWidth: 720, width: '100%', alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HERO BALANCE CARD ── */}
        <View style={m.heroCard}>
          <View style={m.heroDecor1} />
          <View style={m.heroDecor2} />
          <View style={m.heroTopRow}>
            <View style={m.heroIconWrap}>
              <Feather name="credit-card" size={16} color="#ffffff" />
            </View>
            <Text style={m.heroBalanceLbl}>My Wallet</Text>
          </View>
          <Text style={m.heroAmount}>₹{summary.total_balance.toLocaleString()}</Text>
          <Text style={m.heroHint}>Available balance</Text>

          <View style={m.heroStatsRow}>
            <View style={m.heroStat}>
              <View style={m.heroStatIcon}>
                <Feather name="arrow-down-circle" size={13} color="#ffffff" />
              </View>
              <View style={m.heroStatTextWrap}>
                <Text style={m.heroStatLbl}>Credit</Text>
                <Text style={m.heroStatVal}>₹{summary.total_credit.toLocaleString()}</Text>
              </View>
            </View>
            <View style={m.heroStat}>
              <View style={m.heroStatIcon}>
                <Feather name="arrow-up-circle" size={13} color="#ffffff" />
              </View>
              <View style={m.heroStatTextWrap}>
                <Text style={m.heroStatLbl}>Debit</Text>
                <Text style={m.heroStatVal}>₹{summary.total_debit.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── LATEST TRANSACTION ── */}
        {latestTransaction && (
          <>
            <View style={m.sectionHeader}>
              <Text style={m.sectionTitle}>Latest Transaction</Text>
            </View>
            <View style={m.latestCard}>
              <View style={m.latestCardHeader}>
                <Text style={m.latestCardTitle}>{latestTransaction.source}</Text>
                <View style={m.sourceBadge}>
                  <Text style={m.sourceBadgeText}>{latestTransaction.source}</Text>
                </View>
              </View>
              <View style={m.latestRow}>
                <View>
                  <Text style={m.latestLbl}>Amount</Text>
                  <Text style={m.latestAmt}>₹{latestTransaction.amount.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={m.latestLbl}>Type</Text>
                  <View style={latestTransaction.type === 'credit' ? m.typePillCredit : m.typePillDebit}>
                    <Text style={latestTransaction.type === 'credit' ? m.typeTxtCredit : m.typeTxtDebit}>
                      {latestTransaction.type === 'credit' ? 'Credit' : 'Debit'}
                    </Text>
                  </View>
                  <Text style={[m.latestDate, { marginTop: 4 }]}>{latestTransaction.date}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── TRANSACTION HISTORY ── */}
        <View style={m.sectionHeader}>
          <Text style={m.sectionTitle}>Transaction History</Text>
          <View style={m.sectionBadge}>
            <Text style={m.sectionBadgeText}>{totalRecords} total</Text>
          </View>
        </View>

        {loading ? (
          <Text style={m.loadingText}>Loading wallet data...</Text>
        ) : totalRecords === 0 ? (
          <Text style={m.emptyText}>No wallet records found.</Text>
        ) : (
          <>
            <View style={m.tableWrap}>
              <View style={m.tableHeader}>
                <Text style={[m.tableHeaderText, m.colAmount]}>Amount</Text>
                <Text style={[m.tableHeaderText, m.colType]}>Type</Text>
                <Text style={[m.tableHeaderText, m.colSource]}>Source</Text>
                <Text style={[m.tableHeaderText, m.colDate]}>Date</Text>
              </View>
              {pagedTransactions.map((item, index) => (
                <View key={item.id ?? index} style={[m.tableRow, index % 2 === 0 && m.tableRowEven]}>
                  <View style={m.colAmount}>
                    <Text style={item.type === 'credit' ? m.amountCredit : m.amountDebit}>
                      ₹{item.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={m.colType}>
                    <View style={[
                      m.typePill,
                      item.type === 'credit' ? m.typePillCredit : m.typePillDebit,
                    ]}>
                      <Text style={item.type === 'credit' ? m.typePillTextCredit : m.typePillTextDebit}>
                        {item.type === 'credit' ? 'Credit' : 'Debit'}
                      </Text>
                    </View>
                  </View>
                  <View style={m.colSource}>
                    <Text style={m.rowText}>{item.source}</Text>
                  </View>
                  <View style={m.colDate}>
                    <Text style={m.rowText}>{item.date}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={m.paginationWrap}>
              <Text style={m.paginationInfo}>
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalRecords)}–
                {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords}
              </Text>
              <View style={m.paginationControls}>
                <TouchableOpacity style={[m.pageBtn, currentPage === 1 && m.pageBtnDisabled]} onPress={() => goToPage(1)} disabled={currentPage === 1}>
                  <Feather name="chevrons-left" size={13} color={currentPage === 1 ? '#CCC' : O[600]} />
                </TouchableOpacity>
                <TouchableOpacity style={[m.pageBtn, currentPage === 1 && m.pageBtnDisabled]} onPress={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                  <Feather name="chevron-left" size={13} color={currentPage === 1 ? '#CCC' : O[600]} />
                </TouchableOpacity>
                {pageNumbers.map((page) => (
                  <TouchableOpacity key={page} style={[m.pageBtn, page === currentPage && m.pageBtnActive]} onPress={() => goToPage(page)}>
                    <Text style={[m.pageBtnText, page === currentPage && m.pageBtnTextActive]}>{page}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[m.pageBtn, currentPage === totalPages && m.pageBtnDisabled]} onPress={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  <Feather name="chevron-right" size={13} color={currentPage === totalPages ? '#CCC' : O[600]} />
                </TouchableOpacity>
                <TouchableOpacity style={[m.pageBtn, currentPage === totalPages && m.pageBtnDisabled]} onPress={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                  <Feather name="chevrons-right" size={13} color={currentPage === totalPages ? '#CCC' : O[600]} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

      </ScrollView>

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} activeItem={moduleName} />
    </View>
  );
}