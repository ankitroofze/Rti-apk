// components/SubscriptionStatusCard.js
// ─────────────────────────────────────────────────────────
// Ek generic card jo "mera kaunsa subscription active hai" dikhata hai.
// Ads / Ecom / Quiz — teeno "My Subscription" screens isi card ko reuse
// karte hain taaki design consistent rahe.
// ─────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

const C = {
  orange:      '#F97316',
  orangeLight: '#FFF7ED',
  white:       '#FFFFFF',
  textDark:    '#111111',
  textMid:     '#555555',
  textMuted:   '#9CA3AF',
  border:      '#E5E7EB',
  green:       '#16a34a',
  greenLight:  '#F0FDF4',
  greenMid:    '#86EFAC',
  redLight:    '#FEF2F2',
  red:         '#DC2626',
};

/**
 * props:
 *  isActive        - boolean
 *  planName         - string
 *  price            - number|string
 *  countLabel       - e.g. "12 listing credits remaining" / "5 quiz attempts remaining"
 *  purchasedAt      - date string
 *  expiresAt        - date string
 *  onBuyPress       - callback for "Buy / Renew" button
 *  buyButtonLabel   - string (default "Subscribe")
 */
export default function SubscriptionStatusCard({
  isActive,
  planName,
  price,
  countLabel,
  purchasedAt,
  expiresAt,
  onBuyPress,
  buyButtonLabel = 'Subscribe',
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Feather name={isActive ? 'check-circle' : 'x-circle'} size={13} color={isActive ? C.green : C.red} />
          <Text style={[styles.badgeText, { color: isActive ? C.green : C.red }]}>
            {isActive ? 'Active' : 'No active subscription'}
          </Text>
        </View>
      </View>

      {isActive ? (
        <>
          <Text style={styles.planName}>{planName || 'Subscription Plan'}</Text>
          {price !== undefined && price !== null ? (
            <Text style={styles.price}>₹{price}</Text>
          ) : null}
          {countLabel ? <Text style={styles.countLabel}>{countLabel}</Text> : null}

          <View style={styles.metaRow}>
            {purchasedAt ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Purchased</Text>
                <Text style={styles.metaValue}>{purchasedAt}</Text>
              </View>
            ) : null}
            {expiresAt ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expires</Text>
                <Text style={styles.metaValue}>{expiresAt}</Text>
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>
          You don't have an active subscription right now. Subscribe to unlock this feature.
        </Text>
      )}

      {onBuyPress ? (
        <TouchableOpacity style={styles.buyBtn} onPress={onBuyPress} activeOpacity={0.85}>
          <Feather name="zap" size={15} color={C.white} />
          <Text style={styles.buyBtnText}>{isActive ? 'Renew / Change Plan' : buyButtonLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerRow: { flexDirection: 'row', marginBottom: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeActive: { backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.greenMid },
  badgeInactive: { backgroundColor: C.redLight, borderWidth: 1, borderColor: '#FCA5A5' },
  badgeText: { fontSize: 12, fontWeight: '700' },

  planName: { fontSize: 18, fontWeight: '700', color: C.textDark, marginBottom: 2 },
  price: { fontSize: 14, color: C.textMid, marginBottom: 6 },
  countLabel: { fontSize: 13, color: C.green, fontWeight: '600', marginBottom: 10 },

  metaRow: { flexDirection: 'row', gap: 24, marginTop: 4 },
  metaItem: {},
  metaLabel: { fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: C.textDark, fontWeight: '600', marginTop: 2 },

  emptyText: { fontSize: 13, color: C.textMuted, lineHeight: 19, marginBottom: 4 },

  buyBtn: {
    marginTop: 16,
    backgroundColor: C.orange,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
});
