import React, { useCallback, useState, useMemo } from 'react';
import {
  ScrollView, Text, View, TouchableOpacity, TextInput, Platform, useWindowDimensions, StatusBar, StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import Sidebar from '../components/Sidebar';
import PremiumBadge from '../components/PremiumBadge';
import MyNetworkStyles from '../styles/MyNetworkStyles';
import { UserStore } from '../store/UserStore';

const PAGE_SIZE = 10;

// ─── Header override — matches AdvertiseScreen's top bar exactly (font, back arrow, spacing) ───
const HEADER_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54;
const H = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: HEADER_TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E6E6E6',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 3, marginLeft: -6, borderWidth: 1, borderColor: '#E0E0E0' },
  title:   { flex: 1, fontSize: 15, color: '#353535', fontFamily: 'Roboto, sans-serif' },
});
// Tablet-responsive content wrapper — matches AdvertiseScreen's centered max-width pattern
const TABLET_CONTENT_WRAP = { maxWidth: 720, width: '100%', alignSelf: 'center' };

// ─── Amber/Orange design tokens ────────────────────────────────────
const O = {
  50:  '#FFF4EC',
  100: '#FFE2CE',
  200: '#F8C29B',
  400: '#e8732a',
  600: '#C95C18',
  800: '#7A360E',
  900: '#4A2108',
};

// ─── Web inline styles ────────────────────────────────────────────────────────
const w = {
  // Root — no sidebar
  root: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    flexDirection: 'column',
    minHeight: '100vh',
    fontFamily: 'Roboto, sans-serif',
  },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topLeft:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bcStep:      { fontSize: 13, color: '#888888', fontFamily: 'Roboto, sans-serif' },
  bcSep:       { fontSize: 15, color: '#CCCCCC', marginHorizontal: 4 },
  bcCur:       { fontSize: 13, fontWeight: '600', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 3,
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#111111', fontFamily: 'Roboto, sans-serif' },

  // ── Scroll / page ─────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 60, alignItems: 'center' },
  innerWrap:     { width: '100%', maxWidth: 1100, alignSelf: 'center' },

  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111111', marginBottom: 4, fontFamily: 'Roboto, sans-serif' },
  pageSub:   { fontSize: 14, color: '#888888', marginBottom: 26, fontFamily: 'Roboto, sans-serif' },

  // ── Metric cards ──────────────────────────────────────────────────────────
  metricsRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  mc: {
    flex: 1, backgroundColor: '#ffffff',
    borderRadius: 6, padding: 20,
    borderWidth: 1, borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  mcBar:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#E0E0E0' },
  mcBarHot: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#e8732a' },
  mcTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  mcIcon:   {
    width: 38, height: 38, borderRadius: 3,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  mcBadge: {
    fontSize: 11, fontWeight: '600', color: '#111111',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 3,
    fontFamily: 'Roboto, sans-serif',
  },
  mcVal: { fontSize: 28, fontWeight: '800', color: '#111111', marginBottom: 3, fontFamily: 'Roboto, sans-serif' },
  mcLbl: { fontSize: 12, color: '#888888', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },

  // ── Table card ────────────────────────────────────────────────────────────
  tableCard: {
    backgroundColor: '#ffffff', borderRadius: 6,
    borderWidth: 1, borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  tcHead: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0,
  },
  tcTitle: { fontSize: 16, fontWeight: '800', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  tcSub:   { fontSize: 12, color: '#888888', marginTop: 2, fontFamily: 'Roboto, sans-serif' },

  tcToolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  searchBox: {
    flex: 1, maxWidth: 300, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111111', fontWeight: '500', paddingVertical: 0, fontFamily: 'Roboto, sans-serif' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 5,
  },
  pillTxt: { fontSize: 12, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },

  tblHeader: {
    flexDirection: 'row', backgroundColor: '#FAFAF8',
    paddingVertical: 11, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0', alignItems: 'center',
  },
  hc: { fontSize: 10, fontWeight: '800', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: 'Roboto, sans-serif' },

  trow: {
    flexDirection: 'row', paddingVertical: 13, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F5F2EE',
    alignItems: 'center', backgroundColor: '#ffffff',
  },
  trowAlt: { backgroundColor: '#FDFCFB' },
  trowCur: { backgroundColor: '#FFF4EC', borderLeftWidth: 3, borderLeftColor: '#e8732a', paddingLeft: 17 },

  av: {
    width: 34, height: 34, borderRadius: 3,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0,
  },
  avTxt: { fontSize: 12, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },

  uname:    { fontSize: 13, fontWeight: '700', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  unameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  uemail:   { fontSize: 11, color: '#AAAAAA', marginTop: 1, fontFamily: 'Roboto, sans-serif' },
  refCell:  { fontSize: 13, color: '#666666', fontFamily: 'Roboto, sans-serif' },

  lbadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
  },
  lbadgeHi:    { backgroundColor: '#FFF4EC', borderColor: '#e8732a' },
  lbadgeTxt:   { fontSize: 12, fontWeight: '700', color: '#666666', fontFamily: 'Roboto, sans-serif' },
  lbadgeTxtHi: { color: '#e8732a' },

  commTxt: { fontSize: 13, fontWeight: '800', color: '#111111', fontFamily: 'Roboto, sans-serif' },
  eyeBtn:  {
    width: 30, height: 30, borderRadius: 3,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },

  // column widths
  colUser:       { flex: 2, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  colRef:        { flex: 1.4, paddingRight: 10 },
  colLevel:      { width: 72, alignItems: 'center' },
  colCommission: { width: 96, alignItems: 'center' },
  colAction:     { width: 52, alignItems: 'center' },

  // pagination
  paginationRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  pagInfo: { fontSize: 12, color: '#888888', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
  pagBtns: { flexDirection: 'row', gap: 4 },
  pb: {
    minWidth: 32, height: 32, borderRadius: 3,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  pbOn:    { backgroundColor: '#e8732a', borderColor: '#e8732a' },
  pbOff:   { opacity: 0.3 },
  pbTxt:   { fontSize: 13, fontWeight: '700', color: '#555555', fontFamily: 'Roboto, sans-serif' },
  pbTxtOn: { color: '#ffffff' },

  // states
  loadingText: { fontSize: 14, color: '#888888', paddingVertical: 40, textAlign: 'center', fontFamily: 'Roboto, sans-serif' },
  emptyWrap:   { alignItems: 'center', paddingVertical: 40 },
  emptyText:   { fontSize: 14, color: '#888888', fontWeight: '500', fontFamily: 'Roboto, sans-serif' },
};

// ─── Avatar initials helper ───────────────────────────────────────────────────
function getInitials(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] || '?').toUpperCase();
}

export default function MyNetworkScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [networkData, setNetworkData]       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [currentPage, setCurrentPage]       = useState(1);

  const moduleName = 'My Network';
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isWeb = Platform.OS === 'web';
  const isMobileWeb = isWeb && windowWidth <= 760;

  const loadNetwork = useCallback(async () => {
    setLoading(true);
    const data = await UserStore.getMyNetwork();
    setLoading(false);
    if (!data) { navigation.replace('Login'); return; }
    setNetworkData(data);
    setCurrentPage(1);
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadNetwork(); }, [loadNetwork]));

  const allRows = networkData?.rows || [];

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) =>
      row.name?.toLowerCase().includes(q) ||
      row.user_id?.toLowerCase().includes(q) ||
      row.referred_by?.toLowerCase().includes(q) ||
      String(row.level).toLowerCase().includes(q)
    );
  }, [allRows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pagedRows  = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (text) => { setSearchQuery(text); setCurrentPage(1); };
  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, safePage - 2);
    const end   = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  // ══════════════════════════════════════════════════════════════════════════
  // WEB TABLE CONTENT
  // ══════════════════════════════════════════════════════════════════════════
  const webTableContent = () => (
    <>
      {/* Toolbar: search + pill */}
      <View style={w.tcToolbar}>
        <View style={w.searchBox}>
          <Feather name="search" size={14} color="#888888" />
          <TextInput
            style={w.searchInput}
            placeholder="Search by name, ID, level..."
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Feather name="x" size={14} color="#888888" />
            </TouchableOpacity>
          )}
        </View>
        {!loading && (
          <View style={w.pill}>
            <Feather name="list" size={12} color="#888888" />
            <Text style={w.pillTxt}>
              {filteredRows.length} record{filteredRows.length !== 1 ? 's' : ''}
              {searchQuery ? ` · "${searchQuery}"` : ''}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <Text style={w.loadingText}>Loading network data...</Text>
      ) : pagedRows.length ? (
        <>
          {/* Table header */}
          <View style={w.tblHeader}>
            <Text style={[w.hc, w.colUser]}>User</Text>
            <Text style={[w.hc, w.colRef]}>Referred by</Text>
            <Text style={[w.hc, w.colLevel]}>Level</Text>
            <Text style={[w.hc, w.colCommission]}>Commission</Text>
            <Text style={[w.hc, w.colAction]}>View</Text>
          </View>

          {/* Rows */}
          {pagedRows.map((row, index) => {
            const isCur = row.isCurrentUser;
            const rowStyle = [
              w.trow,
              index % 2 !== 0 && w.trowAlt,
              isCur && w.trowCur,
            ];
            return (
              <View key={`${row.user_id}-${index}`} style={rowStyle}>
                {/* User */}
                <View style={w.colUser}>
                  <View style={w.av}>
                    <Text style={w.avTxt}>{getInitials(row.name)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={w.unameRow}>
                      <Text style={w.uname} numberOfLines={1}>{row.name}</Text>
                      {UserStore.hasActiveSubscription(row) && (
                        <PremiumBadge size={13} />
                      )}
                    </View>
                    <Text style={w.uemail} numberOfLines={1}>{row.user_id}</Text>
                  </View>
                </View>

                {/* Referred by */}
                <View style={w.colRef}>
                  <Text style={w.refCell} numberOfLines={1}>
                    {row.referred_by || 'Direct signup'}
                  </Text>
                </View>

                {/* Level */}
                <View style={w.colLevel}>
                  <View style={[w.lbadge, isCur && w.lbadgeHi]}>
                    <Text style={[w.lbadgeTxt, isCur && w.lbadgeTxtHi]}>
                      {row.level ?? '—'}
                    </Text>
                  </View>
                </View>

                {/* Commission */}
                <View style={w.colCommission}>
                  <Text style={w.commTxt}>
                    ₹{row.commission?.toLocaleString() ?? '0'}
                  </Text>
                </View>

                {/* Action */}
                <View style={w.colAction}>
                  <TouchableOpacity
                    style={w.eyeBtn}
                    onPress={() => navigation.navigate('ViewMember', { member: row })}
                  >
                    <Feather name="eye" size={13} color="#888888" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Pagination */}
          <View style={w.paginationRow}>
            <Text style={w.pagInfo}>
              Page {safePage} of {totalPages} · {filteredRows.length} records
            </Text>
            <View style={w.pagBtns}>
              <TouchableOpacity
                style={[w.pb, safePage === 1 && w.pbOff]}
                onPress={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
              >
                <Feather name="chevron-left" size={14} color={safePage === 1 ? '#CCCCCC' : '#111111'} />
              </TouchableOpacity>

              {pageNumbers.map((page) => (
                <TouchableOpacity
                  key={page}
                  style={[w.pb, page === safePage && w.pbOn]}
                  onPress={() => goToPage(page)}
                >
                  <Text style={[w.pbTxt, page === safePage && w.pbTxtOn]}>{page}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[w.pb, safePage === totalPages && w.pbOff]}
                onPress={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
              >
                <Feather name="chevron-right" size={14} color={safePage === totalPages ? '#CCCCCC' : '#111111'} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={w.emptyWrap}>
          <Text style={w.emptyText}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No network data found yet.'}
          </Text>
        </View>
      )}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // WEB LAYOUT — premium amber, no sidebar
  // ══════════════════════════════════════════════════════════════════════════════════
  if (isWeb && !isMobileWeb) {
    return (
      <View style={w.root}>

        {/* ── Top Bar ── */}
        <View style={w.topBar}>
          <View style={w.topLeft}>
            <Feather name="home" size={14} color="#888888" />
            <Text style={w.bcSep}>›</Text>
            <Text style={w.bcStep}>Dashboard</Text>
            <Text style={w.bcSep}>›</Text>
            <Text style={w.bcCur}>My Network</Text>
          </View>
          <TouchableOpacity
            style={w.backBtn}
            onPress={() => navigation.navigate('QuickMenu')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={13} color="#111111" />
            <Text style={w.backBtnText}>Back to menu</Text>
          </TouchableOpacity>
        </View>

        {/* ── Scrollable Content ── */}
        <ScrollView
          style={w.scroll}
          contentContainerStyle={w.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={w.innerWrap}>
          {/* Page heading */}
          <Text style={w.pageTitle}>My Network</Text>
          <Text style={w.pageSub}>
            Track your referred members and monitor commission activity across all levels.
          </Text>

          {/* ── Metric cards ── */}
          <View style={w.metricsRow}>

            {/* Total members — hot bar */}
            <View style={w.mc}>
              <View style={w.mcBarHot} />
              <View style={w.mcTop}>
                <View style={w.mcIcon}>
                  <Feather name="users" size={17} color="#111111" />
                </View>
                <Text style={w.mcBadge}>All time</Text>
              </View>
              <Text style={w.mcVal}>{networkData?.totalMembers ?? 0}</Text>
              <Text style={w.mcLbl}>Total members</Text>
            </View>

            {/* Linked members */}
            <View style={w.mc}>
              <View style={w.mcBar} />
              <View style={w.mcTop}>
                <View style={w.mcIcon}>
                  <Feather name="link" size={17} color="#111111" />
                </View>
                <Text style={w.mcBadge}>Active</Text>
              </View>
              <Text style={w.mcVal}>{networkData?.linkedMembers ?? 0}</Text>
              <Text style={w.mcLbl}>Linked members</Text>
            </View>

            {/* Total commission */}
            <View style={w.mc}>
              <View style={w.mcBar} />
              <View style={w.mcTop}>
                <View style={w.mcIcon}>
                  <Feather name="trending-up" size={17} color="#111111" />
                </View>
                <Text style={w.mcBadge}>Earned</Text>
              </View>
              <Text style={w.mcVal}>
                ₹{(allRows.reduce((s, r) => s + (r.commission || 0), 0)).toLocaleString()}
              </Text>
              <Text style={w.mcLbl}>Total commission</Text>
            </View>
          </View>

          {/* ── Member Records Table ── */}
          <View style={w.tableCard}>
            <View style={w.tcHead}>
              <View>
                <Text style={w.tcTitle}>Member records</Text>
                <Text style={w.tcSub}>All referred members across levels</Text>
              </View>
            </View>
            {webTableContent()}
          </View>

          </View>{/* end innerWrap */}

        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT — bilkul same, koi change nahi
  // ══════════════════════════════════════════════════════════════════════════

  const PINK = '#e8732a';

  const mobileTableContent = () => {
    const colUser       = MyNetworkStyles.colUser;
    const colReferred   = MyNetworkStyles.colReferred;
    const colLevel      = MyNetworkStyles.colLevel;
    const colCommission = MyNetworkStyles.colCommission;
    const colAction     = MyNetworkStyles.colAction;

    return (
      <>
        <View style={MyNetworkStyles.searchWrap}>
          <Feather name="search" size={16} color={PINK} />
          <TextInput
            style={MyNetworkStyles.searchInput}
            placeholder="Search by name, ID, level..."
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Feather name="arrow-left" size={18} color={PINK} />
            </TouchableOpacity>
          )}
        </View>

        {!loading && (
          <Text style={MyNetworkStyles.resultsInfo}>
            Showing {pagedRows.length} of {filteredRows.length} records
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </Text>
        )}

        {loading ? (
          <Text style={MyNetworkStyles.loadingText}>Loading network data...</Text>
        ) : pagedRows.length ? (
          <>
            <View style={MyNetworkStyles.tableWrap}>
              <View style={MyNetworkStyles.tableHeader}>
                <Text style={[MyNetworkStyles.headerCell, colUser]}>User</Text>
                <Text style={[MyNetworkStyles.headerCell, colReferred]}>Referred By</Text>
                <Text style={[MyNetworkStyles.headerCell, colLevel]}>Level</Text>
                <Text style={[MyNetworkStyles.headerCell, colCommission]}>Commission</Text>
                <Text style={[MyNetworkStyles.headerCell, colAction]}>Action</Text>
              </View>

              {pagedRows.map((row, index) => {
                const isCurrentUser = row.isCurrentUser;
                const rowStyle = [
                  MyNetworkStyles.tableRow,
                  index % 2 === 0 && MyNetworkStyles.tableRowEven,
                  isCurrentUser && MyNetworkStyles.currentUserRow,
                ];
                return (
                  <View key={`${row.user_id}-${index}`} style={rowStyle}>
                    <View style={colUser}>
                      <View style={MyNetworkStyles.rowTitleWrap}>
                        <Text style={MyNetworkStyles.rowTitle} numberOfLines={1}>
                          {row.name}
                        </Text>
                        {UserStore.hasActiveSubscription(row) ? (
                          <PremiumBadge size={14} style={MyNetworkStyles.rowBadge} />
                        ) : null}
                      </View>
                      <Text style={MyNetworkStyles.rowSubText} numberOfLines={1}>
                        {row.user_id}
                      </Text>
                    </View>
                    <View style={colReferred}>
                      <Text style={MyNetworkStyles.rowText} numberOfLines={1}>
                        {row.referred_by || '—'}
                      </Text>
                    </View>
                    <View style={colLevel}>
                      <View style={[
                        MyNetworkStyles.levelBadge,
                        isCurrentUser && MyNetworkStyles.currentLevelBadge,
                      ]}>
                        <Text style={[
                          MyNetworkStyles.levelBadgeText,
                          isCurrentUser && MyNetworkStyles.currentLevelBadgeText,
                        ]}>
                          {row.level}
                        </Text>
                      </View>
                    </View>
                    <View style={colCommission}>
                      <Text style={MyNetworkStyles.commissionText}>
                        ₹{row.commission?.toLocaleString() ?? '0'}
                      </Text>
                    </View>
                    <View style={colAction}>
                      <TouchableOpacity
                        style={MyNetworkStyles.viewBtn}
                        onPress={() => navigation.navigate('ViewMember', { member: row })}
                      >
                        <Feather name="eye" size={14} color={PINK} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={MyNetworkStyles.paginationWrap}>
              <TouchableOpacity
                style={[MyNetworkStyles.pageBtn, safePage === 1 && MyNetworkStyles.pageBtnDisabled]}
                onPress={() => goToPage(safePage - 1)} disabled={safePage === 1}
              >
                <Feather name="chevron-left" size={16} color={safePage === 1 ? '#F8C29B' : PINK} />
              </TouchableOpacity>
              {pageNumbers.map((page) => (
                <TouchableOpacity
                  key={page}
                  style={[MyNetworkStyles.pageBtn, page === safePage && MyNetworkStyles.pageBtnActive]}
                  onPress={() => goToPage(page)}
                >
                  <Text style={[MyNetworkStyles.pageBtnText, page === safePage && MyNetworkStyles.pageBtnTextActive]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[MyNetworkStyles.pageBtn, safePage === totalPages && MyNetworkStyles.pageBtnDisabled]}
                onPress={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
              >
                <Feather name="chevron-right" size={16} color={safePage === totalPages ? '#F8C29B' : PINK} />
              </TouchableOpacity>
            </View>
            <Text style={MyNetworkStyles.pageInfo}>Page {safePage} of {totalPages}</Text>
          </>
        ) : (
          <Text style={MyNetworkStyles.emptyText}>
            {searchQuery ? `No results found for "${searchQuery}"` : 'No network data found yet.'}
          </Text>
        )}
      </>
    );
  };

  return (
    <View style={MyNetworkStyles.root}>
      {/* Top Bar — matches AdvertiseScreen header style */}
      <View style={H.header}>
        <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={H.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={[H.title, fontsLoaded && { fontFamily: 'Roboto, sans-serif' }]}>My Network</Text>
      </View>

      <ScrollView
        style={MyNetworkStyles.scrollView}
        contentContainerStyle={[MyNetworkStyles.scrollContent, isTablet && TABLET_CONTENT_WRAP]}
        showsVerticalScrollIndicator={false}
      >
        <View style={MyNetworkStyles.metricsRow}>
          <View style={[MyNetworkStyles.metricCard, MyNetworkStyles.metricPrimary]}>
            <Text style={MyNetworkStyles.metricValue}>{networkData?.totalMembers ?? 0}</Text>
            <Text style={MyNetworkStyles.metricLabel}>Total Members</Text>
          </View>
          <View style={[MyNetworkStyles.metricCard, MyNetworkStyles.metricAccent]}>
            <Text style={MyNetworkStyles.metricValue}>{networkData?.linkedMembers ?? 0}</Text>
            <Text style={MyNetworkStyles.metricLabel}>Linked Members</Text>
          </View>
        </View>

        <View style={MyNetworkStyles.card}>
          <Text style={MyNetworkStyles.sectionTitle}>Member Records</Text>
          {mobileTableContent()}
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