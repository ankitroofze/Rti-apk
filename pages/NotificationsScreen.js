import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../components/ui/ToastProvider';
import styles, { C } from '../styles/NotificationsStyles';
import { UserStore } from '../store/UserStore';
import ModuleWebHeader from '../components/Modulewebheader';

// ── Notification type → icon/colour rules (image jaisa) ──
const NOTIFICATION_TYPE_RULES = [
  { type: 'comment',      match: (t) => t.includes('comment') || t.includes('message'), icon: 'message-circle', tint: C.purple, bg: C.purpleSoft },
  { type: 'follower',     match: (t) => t.includes('follow'),                            icon: 'user-plus',      tint: C.green,  bg: C.greenSoft },
  { type: 'wallet',       match: (t) => t.includes('wallet') || t.includes('credited') || t.includes('bonus'), icon: 'credit-card', tint: C.amber, bg: C.amberSoft },
  { type: 'subscription', match: (t) => t.includes('subscription') || t.includes('plan') || t.includes('upgrade') || t.includes('expir'), icon: 'award', tint: C.red, bg: C.redSoft },
  { type: 'system',       match: (t) => t.includes('system') || t.includes('feature') || t.includes('update'), icon: 'settings', tint: C.purple, bg: C.purpleSoft },
  { type: 'news',         match: (t) => t.includes('news') || t.includes('article') || t.includes('publish'), icon: 'file-text', tint: C.red, bg: C.redSoft },
];

const getNotificationAccent = (item = {}) => {
  const haystack = `${item.title || ''} ${item.message || ''}`.toLowerCase();
  const rule = NOTIFICATION_TYPE_RULES.find((r) => r.match(haystack));
  return rule || { type: 'default', icon: 'bell', tint: C.red, bg: C.redSoft };
};

const getNotificationSortValue = (item = {}) => {
  const unreadBoost = String(item.status || '').toLowerCase() === 'unread' ? 1e13 : 0;
  const dateValue = new Date(item.date || 0).getTime();
  const idValue = Number(String(item.id || '').replace(/\D/g, '')) || 0;
  const base = Number.isFinite(dateValue) && dateValue > 0 ? dateValue : idValue;
  return unreadBoost + base;
};

const formatNotificationDate = (value) => {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return String(value || '');
  const diffMs = Date.now() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Web-only: wraps scroll content to center it
const WebContentWrapper = ({ children, isMobile }) => {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={{ width: '100%', maxWidth: isMobile ? '100%' : 1080, alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 24 }}>
      {children}
    </View>
  );
};

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && windowWidth <= 760;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [notificationData, setNotificationData] = useState({
    currentUser: null,
    items: [],
    unreadCount: 0,
    readCount: 0,
  });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const data = await UserStore.getNotificationsSummary();
    setLoading(false);
    if (!data) { navigation.replace('Login'); return; }
    setNotificationData(data);
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  const handleRead = async (itemId) => {
    const result = await UserStore.updateNotificationItem(itemId);
    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }
    await loadNotifications();
  };

  const sortedItems = useMemo(
    () => [...notificationData.items].sort((a, b) => getNotificationSortValue(b) - getNotificationSortValue(a)),
    [notificationData.items]
  );

  const messagesCount = useMemo(
    () => sortedItems.filter((i) => getNotificationAccent(i).type === 'comment').length,
    [sortedItems]
  );
  const systemAlertsCount = useMemo(
    () => sortedItems.filter((i) => getNotificationAccent(i).type === 'system').length,
    [sortedItems]
  );

  const handleMarkAllRead = async () => {
    const unreadIds = sortedItems
      .filter((i) => String(i.status || '').toLowerCase() === 'unread')
      .map((i) => i.id);
    if (!unreadIds.length) return;
    setMarkingAll(true);
    await Promise.all(unreadIds.map((id) => UserStore.updateNotificationItem(id)));
    setMarkingAll(false);
    showToast('All notifications marked as read.', 'success');
    await loadNotifications();
  };

  const currentUser = notificationData.currentUser;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
              <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {Platform.OS === 'web' ? (
          <ModuleWebHeader title="Notifications" navigation={navigation} />
        ) : (
          Platform.OS === 'android' ? (
<ModuleAndroidHeader title="Notifications" onBack={() => navigation.navigate('QuickMenu')} />
) : (
<ImageBackground
            source={require('../assets/images/profile-red.png')}
            resizeMode="cover"
            style={{ width: '100%', alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14, paddingTop: insets.top + 8 }}
          >
            <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={{ fontSize: 15, color: '#fff' }}>Notifications</Text>
          </ImageBackground>
)
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <WebContentWrapper isMobile={isMobileWeb}>

                    {/* Hero banner */}
                        <ImageBackground
              // source={require('../assets/images/notification-back.png')}
              style={styles.heroCard}
              imageStyle={styles.heroCardImage}
              resizeMode="stretch"
            >
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Notifications</Text>
                <Text style={styles.heroSubtitle}>Stay updated with the latest news, activities and alerts.</Text>
              </View>
            </ImageBackground>

            {/* Stat cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardUnread]}>
                <View style={[styles.statIconWrap, styles.statIconUnread]}>
                  <Feather name="bell" size={18} color={C.red} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{notificationData.unreadCount}</Text>
                  <Text style={styles.statLabel}>Unread</Text>
                </View>
                <Feather name="chevron-right" size={16} color={C.textMuted} />
              </View>

              <View style={[styles.statCard, styles.statCardRead]}>
                <View style={[styles.statIconWrap, styles.statIconRead]}>
                  <Feather name="check-circle" size={18} color={C.green} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{notificationData.readCount}</Text>
                  <Text style={styles.statLabel}>Read</Text>
                </View>
                <Feather name="chevron-right" size={16} color={C.textMuted} />
              </View>

              <View style={[styles.statCard, styles.statCardMessages]}>
                <View style={[styles.statIconWrap, styles.statIconMessages]}>
                  <Feather name="message-circle" size={18} color={C.blue} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{messagesCount}</Text>
                  <Text style={styles.statLabel}>Messages</Text>
                </View>
                <Feather name="chevron-right" size={16} color={C.textMuted} />
              </View>

              <View style={[styles.statCard, styles.statCardSystem]}>
                <View style={[styles.statIconWrap, styles.statIconSystem]}>
                  <Feather name="settings" size={18} color={C.purple} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{systemAlertsCount}</Text>
                  <Text style={styles.statLabel}>System Alerts</Text>
                </View>
                <Feather name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </View>

            {/* Notification list card */}
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <View style={styles.listTitleWrap}>
                  <Text style={styles.listTitle}>Notification List</Text>
                  <View style={styles.listTitleUnderline} />
                </View>
                <View style={styles.listHeaderActions}>
                  <View style={styles.filterPill}>
                    <Text style={styles.filterPillText}>All Notifications</Text>
                    <Feather name="chevron-down" size={14} color={C.textMid} />
                  </View>
                  <TouchableOpacity
                    style={styles.markReadPill}
                    onPress={handleMarkAllRead}
                    disabled={markingAll || notificationData.unreadCount === 0}
                    activeOpacity={0.8}
                  >
                    <Feather name="check" size={14} color={C.textDark} />
                    <Text style={styles.markReadPillText}>Mark all as read</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={styles.stateCard}>
                  <Feather name="loader" size={18} color={C.textMuted} />
                  <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
              ) : sortedItems.length ? (
                <View style={styles.notificationList}>
                  {sortedItems.map((item) => {
                    const accent = getNotificationAccent(item);
                    const unread = String(item.status || '').toLowerCase() === 'unread';
                    const isNew = unread && accent.type === 'news';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.notificationRow}
                        activeOpacity={unread ? 0.8 : 1}
                        onPress={unread ? () => handleRead(item.id) : undefined}
                      >
                        <View style={[styles.notificationIconWrap, { backgroundColor: accent.bg }]}>
                          <Feather name={accent.icon} size={18} color={accent.tint} />
                        </View>

                        <View style={styles.notificationContent}>
                          <View style={styles.notificationTitleRow}>
                            <Text style={styles.notificationTitle}>{item.title}</Text>
                            {isNew ? (
                              <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>New</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
                        </View>

                        <View style={styles.notificationRight}>
                          <View style={styles.notificationTimeRow}>
                            <Text style={styles.notificationTime}>{formatNotificationDate(item.date)}</Text>
                            {unread ? <View style={styles.unreadDot} /> : null}
                          </View>
                          <Feather name="chevron-right" size={16} color={C.textMuted} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="inbox" size={24} color={C.red} />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyText}>Jab new updates aayenge, wo yahin dikhengi.</Text>
                </View>
              )}
            </View>
          </WebContentWrapper>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}