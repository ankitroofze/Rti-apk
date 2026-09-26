import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Platform, useWindowDimensions, StatusBar, StyleSheet, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import Sidebar from '../components/Sidebar';
import { UserStore } from '../store/UserStore';
import { MODULE_HEADER_HEIGHT_WEB, HEADER_BG_IMAGE } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
import ModuleMobileHeader from '../components/ModuleMobileHeader';

const PAGE_SIZE = 10;

// ✅ Wallet ke har "orange" block ki jagah ab yahi red wali image use hoti hai
// (Subscription Plans screen me jo header/card image lagti hai — bilkul wahi).
const RED_IMAGE = require('../assets/images/profile-red.png');

// ─── Header override — matches AdvertiseScreen's top bar exactly ───
const HEADER_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54;
const H = StyleSheet.create({
   header: {
    width: '100%', alignSelf: 'stretch',
    // ✅ image ko header ke bahar nikalne se rokta hai
    overflow: 'hidden',
    backgroundColor: '#b91c1c',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    ...(Platform.OS === 'web' ? { height: MODULE_HEADER_HEIGHT_WEB, paddingBottom: 0 } : null),
  },
  // ✅ Subscription screen ke headerImageInner jaisa — image poore header ko cover kare
  headerImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1, fontSize: 15, fontWeight: '400', color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
});
// ─── Red tokens (pehle orange the — ab Subscription screen jaisa red) ───
const O = {
  50:  '#FDF1F1',
  100: '#FEE2E2',
  200: '#FCC7C7',
  400: '#dc2626',
  500: '#c62828',
  600: '#b91c1c',
  800: '#7F1D1D',
};

// ─── Font helpers — header (H.title) jaisa hi pattern ───
const F_REG   = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular';
const F_MED   = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_500Medium';
const F_BOLD  = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold';
const F_BLACK = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_900Black';
const RED_GRADIENT = ['#ef4444', '#b91c1c'];

// ═══════════════════════════════════════════════════════════════════════════
// WEB styles — clean, minimal dashboard
// ═══════════════════════════════════════════════════════════════════════════
const w = {
  root: { flex: 1, backgroundColor: '#ffffff', flexDirection: 'column', minHeight: '100vh' },
  // ✅ Web header — Subscription Plans ke headerImageWrap jaisa exact:
  // fixed height + overflow hidden, warna red image apni natural size me
  // header ke neeche tak phail jaati thi.
  topBar: {
    width: '100%', alignSelf: 'stretch', overflow: 'hidden',
    backgroundColor: '#b91c1c',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingVertical: 0,
    height: MODULE_HEADER_HEIGHT_WEB,
  },
  topBarImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  topLeft:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bcStep:     { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Roboto_400Regular' },
  bcSep:      { fontSize: 15, color: 'rgba(255,255,255,0.55)', marginHorizontal: 4, fontFamily: 'Roboto_400Regular' },
  bcCur:      { fontSize: 13, fontWeight: '600', color: '#ffffff', fontFamily: 'Roboto_500Medium' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 8,
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff', fontFamily: 'Roboto_500Medium' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 60, alignItems: 'center' },
  innerWrap:     { width: '100%', maxWidth: 1100, alignSelf: 'center' },

  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111111', marginBottom: 4, fontFamily: 'Roboto_900Black' },
  pageSub:   { fontSize: 14, color: '#888888', marginBottom: 26, fontFamily: 'Roboto_400Regular' },
  topRow:   { flexDirection: 'row', gap: 14, marginBottom: 16 },

        heroCard: {
    flex: 1, minWidth: 0, borderRadius: 16, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#EDE8E1',
    overflow: 'hidden', padding: 16,
  },

  heroDecor1: { position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroDecor2: { position: 'absolute', bottom: -70, right: 60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  heroBadgeTxt: { fontSize: 13, fontWeight: '700', color: O[500], fontFamily: 'Roboto_700Bold' },
   heroLbl:   { fontSize: 12, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontFamily: 'Roboto_500Medium' },
  heroAmt:   { fontSize: 46, fontWeight: '800', color: '#111111', letterSpacing: -1, marginBottom: 6, fontFamily: 'Roboto_900Black' },
  heroHint:  { fontSize: 13, color: '#888888', fontFamily: 'Roboto_400Regular' },

  statsCol:  { gap: 12 },
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E7F7EE',
    alignItems: 'center', justifyContent: 'center',
  },
  statIconDebit: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FDEBEE',
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
  root:        { flex: 1, backgroundColor: '#ffffff' },
  scrollView:  { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

heroCard: {
    borderRadius: 12, padding: 18,
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
    heroBalanceLbl: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.95)', fontFamily: F_MED },
  heroAmount: { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: -1, marginBottom: 2, fontFamily: F_BLACK },
  heroHint:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 16, fontFamily: F_REG },

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
   heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: F_MED },
  heroStatVal: { fontSize: 14, color: '#ffffff', fontWeight: '800', marginTop: 1, fontFamily: F_BLACK },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
    sectionTitle:  { fontSize: 14, fontWeight: '800', color: '#222222', fontFamily: F_BLACK },
  sectionBadge:  { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: '#333333', fontFamily: F_BOLD },

  // Latest transaction card
 latestCard: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#d0d0d0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  latestCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  latestCardTitle:  { fontSize: 13, fontWeight: '700', color: '#333333', fontFamily: F_BOLD },
  sourceBadge:      { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#d0d0d0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  sourceBadgeText:  { fontSize: 11, fontWeight: '700', color: '#333333', fontFamily: F_BOLD },
  latestRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  latestLbl:  { fontSize: 10, color: '#AAAAAA', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4, fontFamily: F_BOLD },
  latestAmt:  { fontSize: 22, fontWeight: '800', color: '#111111', fontFamily: F_BLACK },
  latestDate: { fontSize: 11, color: '#AAAAAA', fontWeight: '500', fontFamily: F_MED },
  typePillCredit: { paddingHorizontal: 12, paddingVertical: 3, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7', borderRadius: 20 },
  typePillDebit:  { paddingHorizontal: 12, paddingVertical: 3, backgroundColor: '#fce4ec', borderWidth: 1, borderColor: '#ef9a9a', borderRadius: 20 },
  typeTxtCredit:  { fontSize: 12, fontWeight: '700', color: '#2e7d32', fontFamily: F_BOLD },
  typeTxtDebit:   { fontSize: 12, fontWeight: '700', color: '#c62828', fontFamily: F_BOLD },

  // Table
    tableWrap: {
    backgroundColor: '#ffffff', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#d0d0d0', marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f5f5f5',
    paddingVertical: 8, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
    borderTopLeftRadius: 10, borderTopRightRadius: 10,
  },
  tableHeaderText: { fontSize: 10, fontWeight: '800', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: F_BOLD },
  tableRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center',
  },
  tableRowEven: { backgroundColor: '#fafafa' },

  colAmount: { flex: 1.1 },
  colType:   { flex: 0.8 },
  colSource: { flex: 1.2 },
  colDate:   { flex: 1, alignItems: 'flex-end' },

   amountCredit: { fontSize: 12, fontWeight: '800', color: '#2e7d32', fontFamily: F_BOLD },
  amountDebit:  { fontSize: 12, fontWeight: '800', color: '#c62828', fontFamily: F_BOLD },
  rowText:      { fontSize: 11, color: '#666666', fontWeight: '500', fontFamily: F_MED },

  typePill: { 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 20, 
    alignSelf: 'flex-start',
  },
   typePillTextCredit: { fontSize: 9, fontWeight: '700', color: '#2e7d32', fontFamily: F_BOLD },
  typePillTextDebit:  { fontSize: 9, fontWeight: '700', color: '#c62828', fontFamily: F_BOLD },

  paginationWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  paginationInfo: { fontSize: 11, color: '#888888', fontWeight: '500', fontFamily: F_MED },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
 pageBtn: {
    minWidth: 28, height: 28, borderRadius: 999,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d0d0d0',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
    overflow: 'hidden',
  },
  pageBtnActive:   { borderColor: 'transparent' },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText:       { fontSize: 12, fontWeight: '700', color: '#555555', fontFamily: F_BOLD },
  pageBtnTextActive: { color: '#ffffff' },

  loadingText: { fontSize: 13, color: '#888888', textAlign: 'center', paddingVertical: 40, fontFamily: F_REG },
  emptyText:   { fontSize: 13, color: '#888888', textAlign: 'center', paddingVertical: 40, fontFamily: F_REG },

  // ── Web-jaisa design: intro banner, stat cards, payment-history promo ──
  introCard: {
    borderRadius: 14, padding: 16, marginBottom: 14,
    backgroundColor: O[50], flexDirection: 'row', alignItems: 'center',
  },
  introIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  introLabel: { fontSize: 11, fontWeight: '700', color: '#C62828', letterSpacing: 1, fontFamily: F_BOLD },
  introTitle: { fontSize: 18, fontWeight: '800', color: '#111111', marginTop: 2, fontFamily: F_BOLD },
  introSub:   { fontSize: 12, color: '#888888', marginTop: 3, fontFamily: F_REG },

  statCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#EDE8E1',
  },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statIconWrapPink: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center',
  },
  statIconWrapGreen: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#E7F7EE',
    alignItems: 'center', justifyContent: 'center',
  },
  statIconWrapRed: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDEBEE',
    alignItems: 'center', justifyContent: 'center',
  },
  statBadgeCredit: { backgroundColor: '#E7F7EE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statBadgeCreditTxt: { fontSize: 11, fontWeight: '700', color: '#1FA35C', fontFamily: F_BOLD },
  statBadgeDebit: { backgroundColor: '#FDEBEE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statBadgeDebitTxt: { fontSize: 11, fontWeight: '700', color: '#E15252', fontFamily: F_BOLD },
  statLbl:   { fontSize: 11, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, fontFamily: F_MED },
  statTitle: { fontSize: 12, fontWeight: '700', color: '#333333', marginBottom: 6, fontFamily: F_BOLD },
  statVal:   { fontSize: 26, fontWeight: '800', color: '#111111', letterSpacing: -0.5, marginBottom: 4, fontFamily: F_BLACK },
  statHint:  { fontSize: 12, color: '#888888', fontFamily: F_REG },

  promoCard: {
    borderRadius: 14, padding: 18, marginTop: 2, marginBottom: 16,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDE8E1',
  },
  promoIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  promoLabel: { fontSize: 11, fontWeight: '700', color: '#C62828', letterSpacing: 1, fontFamily: F_BOLD },
  promoTitle: { fontSize: 16, fontWeight: '800', color: '#111111', marginTop: 3, fontFamily: F_BOLD },
  promoSub:   { fontSize: 12, color: '#888888', marginTop: 3, marginBottom: 14, fontFamily: F_REG },
  promoBtn: {
    backgroundColor: '#b91c1c', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  promoBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: F_BOLD },
});

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
        {/* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */}
        <ModuleWebHeader title="Wallet" navigation={navigation} />

        <ScrollView style={w.scroll} contentContainerStyle={w.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={w.innerWrap}>
                    <View style={{ borderRadius: 16, padding: 22, marginBottom: 20, backgroundColor: O[50], flexDirection: 'row', alignItems: 'center' }}>
  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#FCE4EC', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
    <Feather name="credit-card" size={22} color="#C62828" />
  </View>
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#C62828', letterSpacing: 1, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' }}>WALLET</Text>
    <Text style={{ fontSize: 24, fontWeight: '800', color: '#111111', marginTop: 2, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' }}>Your Wallet</Text>
    <Text style={{ fontSize: 13, color: '#888888', marginTop: 3, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular' }}>Manage your balance, credits and transactions</Text>
  </View>
</View>
                  <View style={w.topRow}>
              <View style={w.heroCard}>
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(220,38,38,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(220,38,38,0.10)'}}/>
                <View style={w.heroTopRow}>
                  <View style={w.heroIconWrap}>
                    <Feather name="credit-card" size={18} color="#C62828" />
                  </View>
                </View>
                <Text style={w.heroLbl}>Total Balance</Text>
                <Text style={w.heroAmt}>₹{summary.total_balance.toLocaleString()}</Text>
                <Text style={w.heroHint}>Available balance in your wallet</Text>
              </View>

              <View style={w.statCard}>
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(34,197,94,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(34,197,94,0.10)'}}/>
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
                <View style={{position:'absolute',bottom:-46,right:-34,width:150,height:150,borderRadius:75,backgroundColor:'rgba(220,38,38,0.07)'}}/>
                <View style={{position:'absolute',bottom:-66,right:-54,width:180,height:180,borderRadius:90,backgroundColor:'rgba(220,38,38,0.10)'}}/>
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

            {/* <View style={[w.card, { marginBottom: 16 }]}>
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
            </View> */}
<View style={{ borderRadius: 16, padding: 22, marginBottom: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#EDE8E1', flexDirection: 'row', alignItems: 'center' }}>
  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#FCE4EC', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
    <Feather name="file-text" size={22} color="#C62828" />
  </View>
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: '#C62828', letterSpacing: 1, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' }}>PAYMENT HISTORY</Text>
    <Text style={{ fontSize: 22, fontWeight: '800', color: '#111111', marginTop: 4, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' }}>View Your Transactions</Text>
    <Text style={{ fontSize: 13, color: '#888888', marginTop: 4, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular' }}>Check your complete payment history, including credits, debits and more.</Text>
  </View>
  <TouchableOpacity
    style={{ backgroundColor: '#b91c1c', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
    onPress={() => navigation.navigate('PaymentHistory')}
  >
    <Feather name="clock" size={14} color="#fff" />
    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold' }}>Go to Payment History</Text>
      <Feather name="arrow-right" size={14} color="#fff" />
  </TouchableOpacity>
</View>
            {/* <View style={w.card}>
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
                        page === currentPage ? (
                          <ImageBackground
                            key={page}
                            source={RED_IMAGE}
                            resizeMode="cover"
                            imageStyle={{ borderRadius: 9 }}
                            style={[w.pb, w.pbOn]}
                          >
                            <TouchableOpacity
                              onPress={() => goToPage(page)}
                              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={[w.pbTxt, w.pbTxtOn]}>{page}</Text>
                            </TouchableOpacity>
                          </ImageBackground>
                        ) : (
                          <TouchableOpacity key={page} style={w.pb} onPress={() => goToPage(page)}>
                            <Text style={w.pbTxt}>{page}</Text>
                          </TouchableOpacity>
                        )
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
            </View> */}
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

     <ModuleMobileHeader
      title="Wallet"
      navigation={navigation}
      onBack={() => navigation.navigate('QuickMenu')}
    />
      <ScrollView
        style={m.scrollView}
        contentContainerStyle={[m.scrollContent, isTablet && { maxWidth: 720, width: '100%', alignSelf: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── WALLET INTRO BANNER (web jaisa) ── */}
        <View style={m.introCard}>
          <View style={m.introIconWrap}>
            <Feather name="credit-card" size={20} color="#C62828" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={m.introLabel}>WALLET</Text>
            <Text style={m.introTitle}>Your Wallet</Text>
            <Text style={m.introSub}>Manage your balance, credits and transactions</Text>
          </View>
        </View>

        {/* ── TOTAL BALANCE / CREDIT / DEBIT CARDS (web jaisa) ── */}
        <View style={m.statCard}>
          <View style={m.statTop}>
            <View style={m.statIconWrapPink}>
              <Feather name="credit-card" size={16} color="#C62828" />
            </View>
          </View>
          <Text style={m.statLbl}>Total Balance</Text>
          <Text style={m.statVal}>₹{summary.total_balance.toLocaleString()}</Text>
          <Text style={m.statHint}>Available balance in your wallet</Text>
        </View>

        <View style={m.statCard}>
          <View style={m.statTop}>
            <View style={m.statIconWrapGreen}>
              <Feather name="arrow-down-circle" size={16} color={O[400]} />
            </View>
            <View style={m.statBadgeCredit}>
              <Text style={m.statBadgeCreditTxt}>Received</Text>
            </View>
          </View>
          <Text style={m.statTitle}>Total Credit</Text>
          <Text style={m.statVal}>₹{summary.total_credit.toLocaleString()}</Text>
          <Text style={m.statHint}>Amount received</Text>
        </View>

        <View style={m.statCard}>
          <View style={m.statTop}>
            <View style={m.statIconWrapRed}>
              <Feather name="arrow-up-circle" size={16} color="#E15252" />
            </View>
            <View style={m.statBadgeDebit}>
              <Text style={m.statBadgeDebitTxt}>Spent</Text>
            </View>
          </View>
          <Text style={m.statTitle}>Total Debit</Text>
          <Text style={m.statVal}>₹{summary.total_debit.toLocaleString()}</Text>
          <Text style={m.statHint}>Amount spent</Text>
        </View>

        {/* ── PAYMENT HISTORY PROMO CARD (web jaisa) ── */}
        <View style={m.promoCard}>
          <View style={m.promoIconWrap}>
            <Feather name="file-text" size={20} color="#C62828" />
          </View>
          <Text style={m.promoLabel}>PAYMENT HISTORY</Text>
          <Text style={m.promoTitle}>View Your Transactions</Text>
          <Text style={m.promoSub}>Check your complete payment history, including credits, debits and more.</Text>
          <TouchableOpacity
            style={m.promoBtn}
            onPress={() => navigation.navigate('PaymentHistory')}
          >
            <Feather name="clock" size={14} color="#fff" />
            <Text style={m.promoBtnTxt}>Go to Payment History</Text>
            <Feather name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} activeItem={moduleName} />
    </View>
  );
}