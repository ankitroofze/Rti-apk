import NameWithTick from '../components/NameWithTick';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View,
  ImageBackground, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '../components/ui/ToastProvider';
import ProfileAvatar from '../components/ProfileAvatar';
import { UserStore } from '../store/UserStore';
import ModuleWebHeader from '../components/Modulewebheader';

// ── Styles (SettingsStyles ke saath consistent) ─────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  listContent: { padding: 12, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
  },
  avatar: { borderRadius: 22 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 12, color: '#64748b', marginTop: 2 },
  unblockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3',
  },
  unblockBtnDisabled: { opacity: 0.5 },
  unblockText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});



const UnblockConfirmModal = ({ visible, name, onCancel, onConfirm }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 16, padding: 24 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>Unblock User</Text>
        <Text style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>{`Are you sure you want to unblock "${name || 'this user'}"? They will be able to appear in your feed again.`}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.75} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} activeOpacity={0.75} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#ef4444', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Unblock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function BlockedUsersScreen({ navigation }) {
const insets = useSafeAreaInsets();
const { showToast, showPopup } = useToast();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlockedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await UserStore.getBlockedUsers();
      if (result?.ok) {
        setList(Array.isArray(result.list) ? result.list : []);
      } else {
        setList([]);
        if (result?.message) showToast(result.message, 'error');
      }
    } catch (err) {
      console.error('[BlockedUsersScreen] load error:', err);
      setList([]);
      showToast('Unable to load blocked users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { loadBlockedUsers(); }, [loadBlockedUsers]));

  const runUnblock = async (item) => {
    const key = String(item.id ?? item.email ?? '');
    setUnblockingId(key);
    try {
      const result = await UserStore.unblockUser(item.email, item.id);
      if (result?.ok) {
        showToast(`"${item.name || 'User'}" has been unblocked.`, 'success');
        setList((prev) => prev.filter((u) => String(u.id ?? u.email ?? '') !== key));
      } else {
        showToast(result?.message || 'Unable to unblock user.', 'error');
      }
    } catch (err) {
      console.error('[BlockedUsersScreen] unblock error:', err);
      showToast('Something went wrong while unblocking.', 'error');
    } finally {
      setUnblockingId(null);
    }
  };

    const [confirmTarget, setConfirmTarget] = useState(null);

  const handleUnblock = (item) => {
    setConfirmTarget(item);
  };

  const cancelUnblockConfirm = () => setConfirmTarget(null);

  const confirmUnblock = () => {
    const item = confirmTarget;
    setConfirmTarget(null);
    if (item) runUnblock(item);
  };

  const renderItem = ({ item }) => {
    const key = String(item.id ?? item.email ?? '');
    const isUnblocking = unblockingId === key;
    return (
      <View style={s.row}>
        <ProfileAvatar uri={item.profile_image} size={44} style={s.avatar} />
        <View style={s.info}>
          <NameWithTick name={item.name || 'User'} user={item} style={s.name} />
          {item.email ? <Text style={s.email} numberOfLines={1}>{item.email}</Text> : null}
        </View>
        <TouchableOpacity
          style={[s.unblockBtn, isUnblocking && s.unblockBtnDisabled]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
          activeOpacity={0.7}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Feather name="user-check" size={14} color="#ef4444" />
              <Text style={s.unblockText}>Unblock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

   return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <View style={s.root}>
        <ModuleWebHeader title="People you blocked" navigation={navigation} />
        {Platform.OS !== 'web' && (
          <ImageBackground
            source={require('../assets/images/profile-red.png')}
            resizeMode="cover"
            style={[s.header, { paddingTop: insets.top + 8 }]}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color="#ffffff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>People you blocked</Text>
            <View style={{ width: 36 }} />
          </ImageBackground>
        )}

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : list.length === 0 ? (
          <View style={s.center}>
            <Feather name="user-x" size={40} color="#cbd5e1" />
            <Text style={s.emptyText}>You haven't blocked anyone yet.</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id ?? item.email ?? Math.random())}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
       </View>
      <UnblockConfirmModal
        visible={!!confirmTarget}
        name={confirmTarget?.name}
        onCancel={cancelUnblockConfirm}
        onConfirm={confirmUnblock}
      />
    </SafeAreaView>
  );
}