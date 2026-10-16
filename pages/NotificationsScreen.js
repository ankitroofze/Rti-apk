import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../components/ui/ToastProvider';
import styles, { C } from '../styles/NotificationsStyles';
import { UserStore } from '../store/UserStore';
import { navigateFromNotification } from '../utils/Notificationnavigation';
import { subscribePushEvents, refreshBadge } from '../utils/Pushnotifications';

const getNotificationAccent = (item = {}) => {
  const haystack = `${item.title || ''} ${item.message || ''}`.toLowerCase();

  // NEW: distinct accent for lead-form submission notifications
  if (item.type === 'lead_form_submission' || haystack.includes('lead form')) {
    return { icon: 'clipboard', tint: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
  }
  if (haystack.includes('wallet') || haystack.includes('bonus') || haystack.includes('credited')) {
    return { icon: 'credit-card', tint: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  }
  if (haystack.includes('profile') || haystack.includes('account')) {
    return { icon: 'user', tint: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
  }
  if (haystack.includes('plan') || haystack.includes('subscription') || haystack.includes('upgrade')) {
    return { icon: 'star', tint: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  }

  return {
    icon: 'bell',
    tint: Platform.OS === 'web' ? '#E07020' : '#FF2D78',
    bg: Platform.OS === 'web' ? '#fff3e8' : '#fff0f5',
    border: Platform.OS === 'web' ? '#ffd4a8' : '#ffc3d8',
  };
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
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Web-only: wraps scroll content to center it at max 640px
const WebContentWrapper = ({ children, isMobile }) => {
  if (Platform.OS !== 'web') return children;
  return (
    <View
      style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 950,
        alignSelf: 'center',
        paddingHorizontal: isMobile ? 16 : 24,
      }}
    >
      {children}
    </View>
  );
};

export default function NotificationsScreen({ navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && windowWidth <= 760;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notificationData, setNotificationData] = useState({
    currentUser: null,
    items: [],
    unreadCount: 0,
    readCount: 0,
    hasMore: false,
    nextCursor: null,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const data = await UserStore.getNotificationsSummary();
    setLoading(false);

    if (!data) {
      navigation.replace('Login');
      return;
    }
    setNotificationData(data);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // When a foreground push arrives, silently refresh the list
  useEffect(() => {
    const unsub = subscribePushEvents(async () => {
      const data = await UserStore.getNotificationsSummary();
      if (data) setNotificationData(data);
    });
    return () => unsub?.();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !notificationData.hasMore) return;
    setLoadingMore(true);
    const res = await UserStore.getMoreNotifications(notificationData.nextCursor);
    setLoadingMore(false);
    if (!res.ok) { showToast(res.message || 'Unable to load more.', 'error'); return; }
    setNotificationData((prev) => {
      const seen = new Set(prev.items.map((i) => i.id));
      const fresh = res.items.filter((i) => !seen.has(i.id));
      return {
        ...prev,
        items: [...prev.items, ...fresh],
        readCount: prev.readCount + fresh.filter((i) => i.status !== 'Unread').length,
        hasMore: res.hasMore,
        nextCursor: res.nextCursor,
      };
    });
  };

  const handleMarkAllRead = async () => {
    const result = await UserStore.markAllNotificationsRead();
    if (!result.ok) { showToast(result.message, 'error'); return; }
    await loadNotifications();
    refreshBadge();
  };

  const handleDelete = async (itemId) => {
    const result = await UserStore.deleteNotificationItem(itemId);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    await loadNotifications();
    refreshBadge();
  };

  const handleRead = async (itemId) => {
    const result = await UserStore.updateNotificationItem(itemId);
    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }
    await loadNotifications();
    refreshBadge();
  };

  // NEW: tapping any notification — marks it read (if unread) and, for a
  // lead-form submission notification, opens the response detail screen so
  // the ad owner can see exactly which ad the lead came from and what was
  // answered.
  const handleItemPress = async (item) => {
    if (String(item.status || '').toLowerCase() === 'unread') {
      await handleRead(item.id);
    }

    // Open the right screen based on type + data (news / profile / wallet / ...)
    navigateFromNotification(navigation, item);
  };

  const sortedItems = [...notificationData.items].sort(
    (a, b) => getNotificationSortValue(b) - getNotificationSortValue(a)
  );
  const currentUser = notificationData.currentUser;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* Header */}
        {Platform.OS === 'android' ? (
<ModuleAndroidHeader title="Notifications" onBack={() => navigation.navigate('QuickMenu')} />
) : (
<>
<View style={styles.customHeader}>
          <View
            style={[
              styles.headerInner,
              Platform.OS === 'web' && {
                paddingHorizontal: isMobileWeb ? 12 : 20,
                maxWidth: '100%',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('QuickMenu')}
              activeOpacity={0.75}
            >
              <Feather name="arrow-left" size={20} color={C.accent} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerGhost} />
          </View>
        </View>
</>
)}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'web' && { paddingHorizontal: 0, alignItems: 'stretch' },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <WebContentWrapper isMobile={isMobileWeb}>
            {/* Hero card */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Feather name="bell" size={22} color={C.accent} />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroEyebrow}>INBOX CENTER</Text>
                <Text style={styles.heroTitle}>Stay updated with every activity</Text>
                <Text style={styles.heroSubtitle}>Account alerts, plan updates</Text>
              </View>
              {!isMobileWeb && (currentUser?.name || currentUser?.email) ? (
                <View style={styles.heroOwner}>
                  <Text style={styles.ownerName} numberOfLines={1}>{currentUser?.name || 'RTI User'}</Text>
                  <Text style={styles.ownerEmail} numberOfLines={1}>{currentUser?.email || ''}</Text>
                </View>
              ) : null}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardMessages]}>
                <View style={[styles.statIconWrap, styles.statIconMessages]}>
                  <Feather name="inbox" size={20} color={C.blue} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{notificationData.items.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
              <View style={[styles.statCard, styles.statCardUnread]}>
                <View style={[styles.statIconWrap, styles.statIconUnread]}>
                  <Feather name="bell" size={20} color={C.red} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{notificationData.unreadCount}</Text>
                  <Text style={styles.statLabel}>Unread</Text>
                </View>
              </View>
              <View style={[styles.statCard, styles.statCardRead]}>
                <View style={[styles.statIconWrap, styles.statIconRead]}>
                  <Feather name="check-circle" size={20} color={C.green} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statValue}>{notificationData.readCount}</Text>
                  <Text style={styles.statLabel}>Read</Text>
                </View>
              </View>
            </View>

            {/* Notifications list card */}
            <View style={styles.listCard}>
              <View style={styles.listHeaderRow}>
                <View style={styles.listTitleWrap}>
                  <Text style={styles.listTitle}>Recent Notifications</Text>
                  <View style={styles.listTitleUnderline} />
                  <Text style={styles.listSubtitle}>
                    Unread notifications are shown at the top. Tap a notification to mark it as read.
                  </Text>
                </View>
                <View style={styles.listHeaderActions}>
                  <View style={styles.filterPill}>
                    <Feather name="clock" size={13} color={C.accent} />
                    <Text style={styles.filterPillText}>Latest First</Text>
                  </View>
                  {notificationData.unreadCount > 0 ? (
                    <TouchableOpacity
                      style={styles.markReadPill}
                      onPress={handleMarkAllRead}
                      activeOpacity={0.8}
                    >
                      <Feather name="check-circle" size={13} color={C.accent} />
                      <Text style={styles.markReadPillText}>Mark all as read</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {loading ? (
                <View style={styles.stateCard}>
                  <Feather name="loader" size={18} color="#94a3b8" />
                  <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
              ) : sortedItems.length ? (
                <View style={styles.notificationList}>
                  {sortedItems.map((item, index) => {
                    const accent = getNotificationAccent(item);
                    const unread = String(item.status || '').toLowerCase() === 'unread';
                    const isLeadForm = item.type === 'lead_form_submission';
                    const isLast = index === sortedItems.length - 1;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.notificationRow,
                          unread && styles.notificationRowUnread,
                          isLast && { borderBottomWidth: 0 },
                        ]}
                        activeOpacity={0.86}
                        onPress={() => handleItemPress(item)}
                      >
                        <View
                          style={[
                            styles.notificationIconWrap,
                            { backgroundColor: accent.bg, borderWidth: 1, borderColor: accent.border },
                          ]}
                        >
                          <Feather name={accent.icon} size={18} color={accent.tint} />
                        </View>

                        <View style={styles.notificationContent}>
                          <View style={styles.notificationTitleRow}>
                            <Text style={styles.notificationTitle}>{item.title}</Text>
                            {unread ? (
                              <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.notificationMessage}>{item.message}</Text>

                          {isLeadForm ? (
                            <View style={styles.rowAction}>
                              <Feather name="clipboard" size={13} color={C.accent} />
                              <Text style={styles.rowActionText}>View Response</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.notificationRight}>
                          <View style={styles.notificationTimeRow}>
                            <Text style={styles.notificationTime}>
                              {formatNotificationDate(item.date)}
                            </Text>
                            {unread ? <View style={styles.unreadDot} /> : null}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                          >
                            <Feather name="trash-2" size={15} color="#94a3b8" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {notificationData.hasMore ? (
                    <TouchableOpacity
                      style={[styles.markReadPill, { alignSelf: 'center', marginTop: 14 }]}
                      onPress={handleLoadMore}
                      activeOpacity={0.8}
                    >
                      <Feather name="chevrons-down" size={14} color={C.accent} />
                      <Text style={styles.markReadPillText}>{loadingMore ? 'Loading...' : 'Load more'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="inbox" size={24} color={C.accent} />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyText}>
                    New updates will appear here when they arrive.
                  </Text>
                </View>
              )}
            </View>
          </WebContentWrapper>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}