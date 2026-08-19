import React, { useCallback, useState } from 'react';
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

const getNotificationAccent = (item = {}) => {
  const haystack = `${item.title || ''} ${item.message || ''}`.toLowerCase();

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
  });

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

  const handleRead = async (itemId) => {
    const result = await UserStore.updateNotificationItem(itemId);
    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }
    showToast('Notification marked as read.', 'success');
    await loadNotifications();
  };

  const sortedItems = [...notificationData.items].sort(
    (a, b) => getNotificationSortValue(b) - getNotificationSortValue(a)
  );
  const currentUser = notificationData.currentUser;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {Platform.OS === 'web' && <View style={styles.statusBarSpacer} />}

        {/* Header */}
        <View style={styles.customHeader}>
          <View
            style={[
              styles.headerInner,
              Platform.OS === 'web' && {
                paddingHorizontal: isMobileWeb ? 16 : 24,
                maxWidth: isMobileWeb ? '100%' : 950,
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            // Web: page background stretches full-width, inner content is centered
            Platform.OS === 'web' && {
              paddingHorizontal: 0,
              alignItems: 'stretch',
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <WebContentWrapper isMobile={isMobileWeb}>
            {/* Hero card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Inbox Center</Text>
              <Text style={styles.heroTitle}>Stay updated with every activity</Text>
              <Text style={styles.heroSubtitle}>Account alerts, plan updates</Text>

              <View style={styles.ownerRow}>
                <View style={styles.ownerBadge}>
                  <Feather name="bell" size={18} color={C.accent} />
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{currentUser?.name || 'RTI User'}</Text>
                  <Text style={styles.ownerEmail}>{currentUser?.email || 'Your notification inbox'}</Text>
                </View>
              </View>
            </View>

            {/* Metrics row */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, styles.metricPrimary]}>
                <Text style={styles.metricValue}>{notificationData.items.length}</Text>
                <Text style={styles.metricLabel}>Total</Text>
              </View>
              <View style={[styles.metricCard, styles.metricSecondary]}>
                <Text style={[styles.metricValue, styles.metricValueUnread]}>
                  {notificationData.unreadCount}
                </Text>
                <Text style={styles.metricLabel}>Unread</Text>
              </View>
              <View style={[styles.metricCard, styles.metricAccent]}>
                <Text style={[styles.metricValue, styles.metricValueRead]}>
                  {notificationData.readCount}
                </Text>
                <Text style={styles.metricLabel}>Read</Text>
              </View>
            </View>

            {/* Notifications list card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Recent Notifications</Text>
                  <Text style={styles.sectionText}>
                    Unread notifications upar rakhe gaye hain. Tap karke read mark kar sakte ho.
                  </Text>
                </View>
                <View style={styles.livePill}>
                  <Feather name="clock" size={12} color={C.accent} />
                  <Text style={styles.livePillText}>Latest First</Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.stateCard}>
                  <Feather name="loader" size={18} color="#94a3b8" />
                  <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
              ) : sortedItems.length ? (
                <View style={styles.notificationList}>
                  {sortedItems.map((item) => {
                    const accent = getNotificationAccent(item);
                    const unread = String(item.status || '').toLowerCase() === 'unread';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.notificationCard,
                          unread ? styles.notificationCardUnread : styles.notificationCardRead,
                        ]}
                        activeOpacity={unread ? 0.86 : 0.95}
                        onPress={unread ? () => handleRead(item.id) : undefined}
                      >
                        <View style={styles.notificationTopRow}>
                          <View
                            style={[
                              styles.notificationIconWrap,
                              { backgroundColor: accent.bg, borderColor: accent.border },
                            ]}
                          >
                            <Feather name={accent.icon} size={18} color={accent.tint} />
                          </View>

                          <View style={styles.notificationContent}>
                            <View style={styles.notificationMetaRow}>
                              <Text style={styles.notificationTitle}>{item.title}</Text>
                              {unread ? <View style={styles.unreadDot} /> : null}
                            </View>

                            <Text style={styles.notificationMessage}>{item.message}</Text>

                            <View style={styles.notificationFooter}>
                              <Text style={styles.notificationDate}>
                                {formatNotificationDate(item.date)}
                              </Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  unread ? styles.unreadBadge : styles.readBadge,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusBadgeText,
                                    unread ? styles.unreadBadgeText : styles.readBadgeText,
                                  ]}
                                >
                                  {unread ? 'Unread' : 'Read'}
                                </Text>
                              </View>
                            </View>

                            {unread ? (
                              <View style={styles.actionButton}>
                                <Feather name="check-circle" size={15} color={C.accent} />
                                <Text style={styles.actionButtonText}>Mark as Read</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="inbox" size={24} color={C.accent} />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyText}>
                    Jab new updates aayenge, wo yahin dikhengi.
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
