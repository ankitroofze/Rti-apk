// components/NameWithTick.js
// ═══════════════════════════════════════════════════════════════════════════
//  Kisi bhi user ke NAAM ke bagal me blue tick dikhata hai.
//
//  Use:
//    <NameWithTick name={user.name} user={user} style={styles.name} />
//    <NameWithTick name="Rahul" show={true} style={styles.name} />
//
//  Tick tab dikhta hai jab user ka Premium plan ACTIVE ho (UserStore.hasBlueTick).
//  Subscription expire hote hi tick apne aap gayab ho jata hai.
//  Tick ka rule badalna ho to SIRF userHasBlueTick() me badlo.
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { Text, View } from 'react-native';
import VerifiedBadge from './VerifiedBadge';
import { UserStore } from '../store/UserStore';

export const userHasBlueTick = (u) => {
  if (!u || typeof u !== 'object') return false;
  const hasPlanInfo = Boolean(u.subscription_plan || u.active_plan || u.role_subscription_plan || u.subscription);
  // Plan ki detail (expiry ke saath) ho to live check — expire hote hi tick hat jayega
  if (hasPlanInfo) {
    try { return Boolean(UserStore.hasBlueTick(u)); } catch { return false; }
  }
  // Warna server ka flag (jaise comments / followers / feed me aata hai)
  return Boolean(
    u.has_blue_tick || u.author_has_blue_tick || u.owner_has_blue_tick ||
    u.authorHasBlueTick || u.user_has_blue_tick
  );
};

export default function NameWithTick({
  name,
  user,
  show,                 // optional: seedha true/false do
  style,                // naam ka text style
  badgeSize = 16,
  numberOfLines = 1,
  containerStyle,
}) {
  const tick = show !== undefined ? Boolean(show) : userHasBlueTick(user);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }, containerStyle]}>
      <Text style={[style, { flexShrink: 1 }]} numberOfLines={numberOfLines}>{name}</Text>
      {tick ? <VerifiedBadge size={badgeSize} style={{ marginLeft: 4 }} /> : null}
    </View>
  );
}