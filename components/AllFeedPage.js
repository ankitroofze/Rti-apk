// components/AllFeedPage.js
// Home ke "View More" (Ads) aur "See All" (News) par ALAG PAGE kholta hai —
// bich ke feed me inline nahi. kind="ads" => sirf ads, kind="news" => sirf news.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppNavbar from './AppNavbar';
import AppFooter from './AppFooter';
import WebLayout from './WebLayout';
import NewsFeedCard from './NewsFeedCard';
import AdLeadFormModal from './AdLeadFormModal';
import { UserStore } from '../store/UserStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './ui/ToastProvider';
import { getSiteCopy } from '../constants/siteCopy';
import { IS_WEB } from '../constants/homeData';
import { normalizeStoryItem, dedupeStories } from '../utils/storyHelpers';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';
import { smartGoBack } from '../utils/smartBack';
import { useAdsHidden } from '../utils/adsVisibility';
import { homeStoryFromAd } from '../screens/HomeScreen';

const newestFirst = (a, b) => {
  const da = new Date(a?.createdAt || a?.created_at || a?.date || 0).getTime() || 0;
  const db = new Date(b?.createdAt || b?.created_at || b?.date || 0).getTime() || 0;
  if (db !== da) return db - da;
  return String(b?.id || '').localeCompare(String(a?.id || ''), undefined, { numeric: true });
};

export default function AllFeedPage({ navigation, kind = 'news' }) {
  const isAds = kind === 'ads';
  const { language } = useLanguage();
  const { showToast } = useToast();
  const commonCopy = useMemo(() => getSiteCopy(language).common, [language]);
  const { width } = useWindowDimensions();
  const responsiveWidth = getResponsiveWindowWidth(width);
  const isMobileLayout = !IS_WEB || isMobileWebDevice() || responsiveWidth < 768;
  // Desktop/laptop web: cards 3 ek line me (chhoti laptop screen par 2), phir agli line — poora grid
  const gridCols = isMobileLayout ? 1 : (responsiveWidth >= 1000 ? 3 : 2);
  const GRID_GAP = 16;
  const cellWidth = gridCols > 1 ? `calc((100% - ${GRID_GAP * (gridCols - 1)}px) / ${gridCols})` : undefined;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const adsHidden = useAdsHidden();
  // ✅ ads_hidden=true => 'Sponsored Ads' page par bhi koi ad nahi
  useEffect(() => { if (isAds && adsHidden) setItems([]); }, [isAds, adsHidden]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [leadFormAd, setLeadFormAd] = useState(null);
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(true);
  const busyRef = useRef(false);

  const load = useCallback(async ({ more = false } = {}) => {
    if (busyRef.current) return;
    if (more && (isAds || !hasMoreRef.current)) return;
    busyRef.current = true;
    if (more) setLoadingMore(true);
    try {
      if (isAds) {
        const ads = await UserStore.getActiveAdsFeed().catch(() => []);
        setItems((Array.isArray(ads) ? ads : []).map(homeStoryFromAd));
      } else {
        const summary = await UserStore.getNewsFeedSummary({
          feedType: 'all', type: 1, perPage: 10, ...(more && cursorRef.current ? { cursor: cursorRef.current } : {}),
        });
        const page = Array.isArray(summary?.items)
          ? summary.items.map((it, i) => normalizeStoryItem(it, i)).filter(Boolean)
          : [];
        const pg = summary?.pagination || null;
        cursorRef.current = pg?.next_cursor || null;
        hasMoreRef.current = Boolean(pg?.has_more && pg?.next_cursor);
        setItems((prev) => dedupeStories(more ? [...prev, ...page] : page)
          .filter((s) => !s.isAd && !s.isEcome)
          .sort(newestFirst));
      }
    } catch (_) {
      if (!more) setItems([]);
    } finally {
      busyRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isAds]);

  useEffect(() => {
    load();
    UserStore.getCurrentUser().then((u) => setCurrentUser(u || null)).catch(() => {});
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    await load();
    setRefreshing(false);
  }, [load]);

  // ── Card actions (Home jaisa hi behaviour) ──
  const handleOpenDetails = useCallback((story) => {
    if (!story) return;
    try { if (story.id && !story.isAd) Promise.resolve(UserStore.updateNewsFeedItem(story.id, 'view')).catch(() => {}); } catch (_) {}
    navigation?.navigate?.('NewsDetails', { article: story });
  }, [navigation]);

  const handleOpenLocation = useCallback((stateName) => {
    if (!stateName) return;
    navigation?.navigate?.('Home', { initialView: 'feed', initialMenuKey: 'all', initialStateName: stateName });
  }, [navigation]);

  const handleOpenCategory = useCallback((story) => {
    const menuTag = (story?.menuTags || []).find((tag) => tag !== 'latest');
    if (!menuTag) return;
    navigation?.navigate?.('Home', { initialView: 'feed', initialMenuKey: menuTag });
  }, [navigation]);

  const handleOpenAuthorProfile = useCallback(async (story) => {
    if (!story) return;
    const fallbackAuthor = {
      name: story.author_name || '', author_profile_image: story.author_profile_image || '',
      author_seat_name: story.author_seat_name || '', author_role_label: story.author_role_label || '',
      author_has_blue_tick: Boolean(story.author_has_blue_tick),
      author_is_premium: Boolean(story.author_is_premium),
    };
    if (!story.createdBy && !fallbackAuthor.name) return;
    const me = await UserStore.getCurrentUser();
    const viewerEmail = String(me?.email || '').trim().toLowerCase();
    const authorEmail = String(story.createdBy || '').trim().toLowerCase();
    const isOwnPost = (viewerEmail && authorEmail && viewerEmail === authorEmail)
      || (me?.id && story.author_id && String(me.id) === String(story.author_id));
    if (isOwnPost) { navigation?.navigate?.('Profile'); return; }
    navigation?.navigate?.('UserPublicProfile', { email: story.createdBy || '', author: fallbackAuthor, userId: story.author_id || null });
  }, [navigation]);

  const handleOpenLeadForm = useCallback(async (story) => {
    if (!story) return;
    let user = null;
    try { user = await UserStore.getCurrentUser(); } catch (_) {}
    if (!user) {
      showToast('Please login to send an enquiry.', 'error');
      navigation?.navigate?.('Login');
      return;
    }
    setLeadFormAd(story);
  }, [navigation, showToast]);

  const cardUser = currentUser ? {
    name: currentUser.name,
    avatar: currentUser.profile_image,
    email: currentUser.email,
    has_blue_tick: UserStore.hasBlueTick(currentUser),
    state_seat: currentUser.state_seat,
    is_subscribed: currentUser.is_subscribed,
  } : null;

  const title = isAds ? 'Sponsored Ads' : 'All News';

  const body = (
    <>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => smartGoBack(navigation, 'Home')} activeOpacity={0.8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#f97316" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <View style={s.titleWrap}>
          <Ionicons name={isAds ? 'megaphone' : 'trending-up'} size={20} color={isAds ? '#e11d48' : '#dc2626'} />
          <Text style={s.title}>{title}</Text>
          {!loading ? <Text style={s.count}>({items.length})</Text> : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 40 }} color="#f97316" />
      ) : items.length === 0 ? (
        <Text style={s.empty}>{isAds ? 'No ads available right now.' : 'No news available right now.'}</Text>
      ) : (
        <View style={[s.stack, isMobileLayout && s.stackMobile, gridCols > 1 && s.stackGrid]}>
          {items.map((story, index) => (
            <View key={`${kind}-${story.id || 'item'}-${index}`} style={cellWidth ? { width: cellWidth } : null}>
            <NewsFeedCard
              story={story}
              isCompactLayout={isMobileLayout}
              altShade={!isAds && isMobileLayout && index % 2 === 1}
              navigation={navigation}
              onOpenDetails={handleOpenDetails}
              onOpenLocation={handleOpenLocation}
              onOpenCategory={handleOpenCategory}
              onOpenAuthorProfile={handleOpenAuthorProfile}
              onOpenLeadForm={handleOpenLeadForm}
              commonCopy={commonCopy}
              currentUser={cardUser}
            />
            </View>
          ))}
        </View>
      )}
      {loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color="#f97316" /> : null}
    </>
  );

  const page = (
    <View style={s.shell}>
      <AppNavbar navigation={navigation} activeScreen="Home" hideBottomBar={true} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, isMobileLayout && { paddingBottom: 90 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          if (!isAds && contentOffset.y + layoutMeasurement.height >= contentSize.height - 800) load({ more: true });
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />}
      >
        <View style={[s.column, isMobileLayout && s.columnMobile, gridCols > 1 && s.columnGrid]}>{body}</View>
        {IS_WEB && !loading ? <AppFooter navigation={navigation} /> : null}
      </ScrollView>
      {isMobileLayout ? <AppNavbar navigation={navigation} activeScreen="Home" hideTopHeader={true} /> : null}
      <AdLeadFormModal visible={Boolean(leadFormAd)} ad={leadFormAd} onClose={() => setLeadFormAd(null)} />
    </View>
  );

  return IS_WEB ? <WebLayout>{page}</WebLayout> : page;
}

const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { flexGrow: 1, backgroundColor: '#f1f5f9', alignItems: 'center', paddingTop: 8 },
  column: { width: '100%', maxWidth: 560, paddingHorizontal: 12, paddingBottom: 24 },
  columnGrid: { maxWidth: 1280, paddingHorizontal: 24 },
  columnMobile: { maxWidth: '100%', paddingHorizontal: 0 },
  headerRow: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, alignSelf: 'flex-start' },
  backText: { color: '#f97316', fontWeight: '800', fontSize: 13 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  count: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  empty: { color: '#64748b', fontSize: 14, paddingVertical: 32, textAlign: 'center' },
  stack: { gap: 12 },
  stackMobile: { gap: 0 },
  stackGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 },
});