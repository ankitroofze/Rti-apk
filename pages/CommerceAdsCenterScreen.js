import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserStore } from '../store/UserStore';

const notify = (title, message) => {
  if (typeof alert !== 'undefined') {
    alert(`${title}\n${message}`);
  }
};

const StatCard = ({ icon, label, value, color, onPress, cardWidth }) => (
  <TouchableOpacity
    style={[styles.statCard, { width: cardWidth }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </TouchableOpacity>
);

const ActionButton = ({ icon, label, onPress, color, cardWidth }) => (
  <TouchableOpacity
    style={[styles.actionButton, { width: cardWidth }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function CommerceAdsCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    myListings: 0,
    receivedEnquiries: 0,
    sentEnquiries: 0,
    credits: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── Responsive sizing ───────────────────────────────────────────────────
  // Use most of the available width, only cap it on very large screens (web/tablet)
  const CONTENT_MAX_WIDTH = 1100;
  const contentWidth = Math.min(windowWidth, CONTENT_MAX_WIDTH);
  const horizontalPadding = windowWidth > 700 ? 32 : 16;
  const gap = 16;

  // Decide columns based on available width so cards never look tiny in the middle
  const usableWidth = contentWidth - horizontalPadding * 2;
  const statColumns = usableWidth > 760 ? 4 : usableWidth > 460 ? 2 : 1;
  const actionColumns = usableWidth > 760 ? 3 : usableWidth > 460 ? 2 : 1;

  const statCardWidth = (usableWidth - gap * (statColumns - 1)) / statColumns;
  const actionCardWidth = (usableWidth - gap * (actionColumns - 1)) / actionColumns;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await UserStore.getCurrentUser();
      setUser(currentUser || null);

      const summary = await UserStore.getEcomeMarketplaceSummary();
      const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
      const listings = Array.isArray(summary?.listings) ? summary.listings : [];
      const enquiries = Array.isArray(summary?.enquiries) ? summary.enquiries : [];

      const myListings = listings.filter(
        (item) => String(item.createdBy || '').trim().toLowerCase() === currentEmail
      ).length;

      const receivedEnquiries = enquiries.filter((enquiry) => {
        return listings.some(
          (listing) =>
            String(listing.id) === String(enquiry.product_id) &&
            String(listing.createdBy || '').trim().toLowerCase() === currentEmail
        );
      }).length;

      const sentEnquiries = enquiries.filter(
        (enquiry) =>
          String(enquiry.buyer_email || '').trim().toLowerCase() === currentEmail
      ).length;

      setStats({
        myListings,
        receivedEnquiries,
        sentEnquiries,
        credits: summary?.credits || 0,
      });
    } catch (error) {
      console.error('Commerce hub load error:', error);
      notify('Load failed', 'Unable to load commerce dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Commerce Hub</Text>
          <Text style={styles.headerSub}>Manage listings and enquiries</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.container,
            { width: contentWidth, paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="storefront" size={32} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>Welcome, {user?.name || 'Seller'}</Text>
              <Text style={styles.welcomeSub}>Your subscription marketplace dashboard</Text>
            </View>
          </View>

          <View style={[styles.statsGrid, { gap }]}>
            <StatCard
              icon="layers"
              label="My Listings"
              value={stats.myListings}
              color="#3b82f6"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('MyListings')}
            />
            <StatCard
              icon="chatbubble-ellipses"
              label="Received Enquiries"
              value={stats.receivedEnquiries}
              color="#f59e0b"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('SellerEnquiryDashboard')}
            />
            <StatCard
              icon="send"
              label="Sent Enquiries"
              value={stats.sentEnquiries}
              color="#10b981"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('MyEnquiries')}
            />
            <StatCard
              icon="cash"
              label="Credits"
              value={stats.credits}
              color="#8b5cf6"
              cardWidth={statCardWidth}
              onPress={() => navigation.navigate('Sell')}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={[styles.actionsContainer, { gap }]}>
              <ActionButton
                icon="add-circle-outline"
                label="Create Listing"
                color="#16a34a"
                cardWidth={actionCardWidth}
                onPress={() => navigation.navigate('Sell')}
              />
              <ActionButton
                icon="list-outline"
                label="Browse Products"
                color="#3b82f6"
                cardWidth={actionCardWidth}
                onPress={() => navigation.navigate('FarmingBuy')}
              />
              <ActionButton
                icon="chatbubble-outline"
                label="My Enquiries"
                color="#10b981"
                cardWidth={actionCardWidth}
                onPress={() => navigation.navigate('MyEnquiries')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    alignItems: 'center',
  },
  container: {
    paddingTop: 20,
    alignSelf: 'center',
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    gap: 14,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  welcomeSub: {
    fontSize: 13,
    color: '#295e20',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 130,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    minHeight: 76,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
});