import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getPermissionState, isWebPushSupported, registerDeviceToken } from '../utils/Pushnotifications';

const SNOOZE_KEY = 'rti_web_push_prompt_snooze';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // "Later" dabane par 7 din tak nahi dikhega
const SHOW_DELAY_MS = 4000;

const snoozed = () => {
  try {
    return Date.now() < Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
  } catch {
    return false;
  }
};

// Login ke baad ek chhota banner: browsers permission popup user click ke baad hi bharosemand dikhate hain.
export default function WebPushPrompt() {
  const { isLoggedIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isWebPushSupported() || getPermissionState() !== 'default' || snoozed()) {
      setVisible(false);
      return undefined;
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  if (!visible) return null;

  const enable = async () => {
    setBusy(true);
    await registerDeviceToken({ askPermission: true });
    setBusy(false);
    setVisible(false);
  };

  const later = () => {
    try { window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch {}
    setVisible(false);
  };

  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={s.card}>
        <View style={s.iconWrap}>
          <Ionicons name="notifications" size={20} color="#e8732a" />
        </View>
        <View style={s.textWrap}>
          <Text style={s.title}>Get instant alerts</Text>
          <Text style={s.sub}>Comments, likes, approvals aur news updates seedha notification me.</Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={s.enableBtn} onPress={enable} disabled={busy} activeOpacity={0.85}>
            <Text style={s.enableText}>{busy ? 'Please wait…' : 'Enable'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={later} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.laterText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'fixed',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 100000,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 12,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 11.5, color: '#475569', marginTop: 1 },
  actions: { alignItems: 'center', gap: 6 },
  enableBtn: {
    backgroundColor: '#e8732a',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  enableText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  laterText: { color: '#64748b', fontSize: 11.5, fontWeight: '700' },
});