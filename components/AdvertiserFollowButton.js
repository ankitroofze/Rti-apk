import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { UserStore } from '../store/UserStore';
import { useToast } from './ui/ToastProvider';

export default function AdvertiserFollowButton({ ownerId: rawId, email: rawEmail, navigation }) {
  const id = String(rawId ?? '').trim();
  const ownerId = /^(null|undefined)?$/i.test(id) ? '' : id;
  const email = String(rawEmail || '').trim().toLowerCase();
  const hasOwner = Boolean(ownerId || email);
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [following, setFollowing] = useState(false);
  const [ownAd, setOwnAd] = useState(false);
  const [followTargetId, setFollowTargetId] = useState(ownerId);
  const [followReady, setFollowReady] = useState(false);
  const [savingFollow, setSavingFollow] = useState(false);
  const isOwner = useCallback((user) => Boolean(
    (email && String(user?.email || '').trim().toLowerCase() === email)
    || (ownerId && String(user?.id ?? user?.user_id ?? '') === ownerId)
  ), [email, ownerId]);

  useEffect(() => {
    setFollowing(false);
    setOwnAd(false);
    setFollowTargetId(ownerId);
    setFollowReady(false);
    if (!isLoggedIn || !hasOwner) return undefined;
    let active = true;
    let receivedUpdate = false;
    let targetId = ownerId;
    const unsubscribe = UserStore.subscribeFollowState((change) => {
      if (UserStore.matchesFollowTarget(change, email, targetId || null)) {
        receivedUpdate = true;
        setFollowing(Boolean(change.isFollowing));
      }
    });
    (async () => {
      const me = await UserStore.getCurrentUser();
      if (!active) return;
      if (!me) return;
      const self = isOwner(me);
      setOwnAd(self);
      if (self) return;
      if (!targetId && email) targetId = await UserStore.resolveUserIdByEmail(email);
      if (!active) return;
      if (targetId && String(me.id ?? me.user_id ?? '') === String(targetId)) {
        setOwnAd(true);
        return;
      }
      setFollowTargetId(targetId);
      const isFollowing = await UserStore.checkIsFollowing(email, targetId || null);
      if (active && !receivedUpdate) setFollowing(isFollowing);
    })().catch(() => {}).finally(() => {
      if (active) setFollowReady(true);
    });
    return () => { active = false; unsubscribe?.(); };
  }, [email, ownerId, hasOwner, isLoggedIn, isOwner]);

  const handleFollow = async () => {
    if (!isLoggedIn) { navigation?.navigate?.('Login'); return; }
    if (!followReady || savingFollow || ownAd) return;
    setSavingFollow(true);
    try {
      const result = await (following ? UserStore.unfollowUser(email, followTargetId) : UserStore.followUser(email, followTargetId));
      if (result?.ok) setFollowing(!following);
      else showToast(result?.message || 'Unable to update follow status.', 'error');
    } catch {
      showToast('Unable to update follow status.', 'error');
    } finally {
      setSavingFollow(false);
    }
  };

  const followLabel = isLoggedIn && !followReady ? 'Checking…' : following ? 'Following' : 'Follow';
  return hasOwner && !ownAd ? (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={followLabel}
      disabled={savingFollow || (isLoggedIn && !followReady)}
      style={[styles.sponsoredFollow, following && styles.sponsoredFollowing]}
      onPress={handleFollow}
    >
      <Text style={[styles.sponsoredFollowText, following && styles.sponsoredFollowingText]}>{followLabel}</Text>
    </TouchableOpacity>
  ) : null;
}

const styles = StyleSheet.create({
  sponsoredFollow: {
    minHeight: 34,
    minWidth: 84,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsoredFollowing: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  sponsoredFollowText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sponsoredFollowingText: { color: '#0f172a' },
});
