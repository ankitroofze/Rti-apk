import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';

const money = (val) => {
  if (!val) return '₹0';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN');
};

const notify = (title, msg) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n${msg}`);
  } else {
    Alert.alert(title, msg);
  }
};

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const PerformanceRow = ({ label, value, unit }) => (
  <View style={styles.performanceRow}>
    <Text style={styles.performanceLabel}>{label}</Text>
    <View style={styles.performanceBar}>
      <View
        style={[
          styles.performanceBarFill,
          { width: `${Math.min(Number(value) || 0, 100)}%` },
        ]}
      />
    </View>
    <Text style={styles.performanceValue}>
      {value}
      {unit}
    </Text>
  </View>
);

const ProductRow = ({ product }) => (
  <View style={styles.productRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.productRowTitle} numberOfLines={2}>
        {product.title}
      </Text>
      <Text style={styles.productRowMeta}>{product.city || 'Location N/A'}</Text>
    </View>
    <View style={styles.productRowRight}>
      <Text style={styles.productRowPrice}>{money(product.price)}</Text>
      <Text style={styles.productRowQty}>Qty: {product.quantity}</Text>
    </View>
  </View>
);

export default function SellerReportsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalEnquiries: 0,
    credits: 0,
    subscription: null,
  });
  const [performance, setPerformance] = useState({
    avgEnquiries: 0,
    responseRate: 0,
    activeProducts: 0,
  });
  const [recentListings, setRecentListings] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await UserStore.getCurrentUser();
      if (!currentUser) {
        notify('Not Logged In', 'Please login to view your reports.');
        setLoading(false);
        return;
      }

      const summary = await UserStore.getEcomeMarketplaceSummary();
      if (!summary) {
        setLoading(false);
        return;
      }

      const userEmail = String(currentUser.email || '').trim().toLowerCase();

      // Get user's listings
      const userListings = (Array.isArray(summary.listings) ? summary.listings : [])
        .filter((item) => String(item.createdBy || '').trim().toLowerCase() === userEmail);

      // Get user's enquiries
      const userEnquiries = (Array.isArray(summary.enquiries) ? summary.enquiries : [])
        .filter((eq) => {
          const product = userListings.find((l) => String(l.id) === String(eq.product_id));
          return !!product;
        });

      // Calculate stats
      const totalListings = userListings.length;
      const totalEnquiries = userEnquiries.length;
      const credits = summary.credits || 0;
      const subscription = summary.subscription || null;

      const avgEnquiries = totalListings > 0 ? (totalEnquiries / totalListings).toFixed(1) : 0;
      const respondedEnquiries = userEnquiries.filter((eq) =>
        ['replied', 'responded', 'closed'].includes(String(eq.status || '').trim().toLowerCase())
      ).length;
      const responseRate = totalEnquiries > 0
        ? Math.round((respondedEnquiries / totalEnquiries) * 100)
        : 0;
      const activeProducts = userListings.filter((p) => p.status === 'active').length;

      // Get recent listings (top 5)
      const recent = userListings.slice(0, 5);

      setStats({
        totalListings,
        totalEnquiries,
        credits,
        subscription,
      });

      setPerformance({
        avgEnquiries,
        responseRate,
        activeProducts,
      });

      setRecentListings(recent);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRenewSubscription = async () => {
    navigation?.navigate?.('Sell');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Your Reports</Text>
          <Text style={styles.headerSub}>Seller Analytics</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={loadData}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 32 }}
      >
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <StatCard icon="layers-outline" label="Total Listings" value={stats.totalListings} color="#0369a1" />
          <StatCard icon="chatbubble-outline" label="Total Enquiries" value={stats.totalEnquiries} color="#16a34a" />
          <StatCard icon="ticket-outline" label="Active Credits" value={stats.credits} color="#9333ea" />
          <StatCard icon="trending-up-outline" label="Active Products" value={performance.activeProducts} color="#ea580c" />
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceBox}>
            <PerformanceRow label="Avg Enquiries/Product" value={performance.avgEnquiries} unit="" />
            <PerformanceRow label="Response Rate" value={performance.responseRate} unit="%" />
          </View>
        </View>

        {/* Subscription Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Status</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionContent}>
              <View style={styles.subscriptionIcon}>
                <Ionicons name="card-outline" size={32} color="#0369a1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subscriptionLabel}>Current Subscription</Text>
                <Text style={styles.subscriptionValue}>
                  {stats.subscription
                    ? `Active${stats.subscription.expires_at ? ` - Expires ${formatDate(stats.subscription.expires_at)}` : ''}`
                    : 'No Active Plan'}
                </Text>
                <Text style={styles.subscriptionDesc}>
                  {stats.credits} credits available
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.renewBtn}
              onPress={handleRenewSubscription}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.renewBtnText}>Renew</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Listings</Text>
            <Text style={styles.sectionSubtitle}>{recentListings.length} shown</Text>
          </View>
          {recentListings.length > 0 ? (
            <View style={styles.listingsBox}>
              {recentListings.map((product, idx) => (
                <ProductRow key={idx} product={product} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyListings}>
              <Ionicons name="layers-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>No listings yet</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation?.navigate?.('Sell')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="add-circle" size={24} color="#16a34a" />
              </View>
              <Text style={styles.actionLabel}>Add Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation?.navigate?.('SellerEnquiryDashboard')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="chatbubble" size={24} color="#0369a1" />
              </View>
              <Text style={styles.actionLabel}>View Enquiries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation?.navigate?.('Sell')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="card" size={24} color="#db2777" />
              </View>
              <Text style={styles.actionLabel}>Buy Credits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation?.navigate?.('CommerceAdsCenter')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fed7aa' }]}>
                <Ionicons name="grid" size={24} color="#ea580c" />
              </View>
              <Text style={styles.actionLabel}>Dashboard</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  performanceBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  performanceRow: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    backgroundColor: '#0369a1',
    borderRadius: 3,
  },
  performanceValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  subscriptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  subscriptionValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  subscriptionDesc: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0369a1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  renewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  listingsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  productRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  productRowMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  productRowRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  productRowPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  productRowQty: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  emptyListings: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
});
