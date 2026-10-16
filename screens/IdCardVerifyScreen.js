// screens/IdCardVerifyScreen.js
// PUBLIC API: Authorization header kabhi nahi bhejna. Cache nahi, har baar fresh call.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants/idCardVerifyConfig';
import { DEFAULT_AVATAR } from '../constants/profileConstants';

const TIMEOUT_MS = 15000;

const STATUS_UI = {
  active:    { color: '#15803d', bg: '#ecfdf5', icon: 'checkmark-circle', label: 'Valid ID Card' },
  expired:   { color: '#ea580c', bg: '#fff7ed', icon: 'time',             label: 'ID Card Expired' },
  suspended: { color: '#dc2626', bg: '#fef2f2', icon: 'close-circle',     label: 'ID Card Suspended' },
  cancelled: { color: '#dc2626', bg: '#fef2f2', icon: 'close-circle',     label: 'ID Card Cancelled' },
  inactive:  { color: '#dc2626', bg: '#fef2f2', icon: 'close-circle',     label: 'ID Card Inactive' },
};
const INVALID_UI = { color: '#dc2626', bg: '#fef2f2', icon: 'alert-circle', label: 'Invalid / Fake ID Card' };

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const cap = (v) => (v ? String(v).replace(/_/g, ' ') : '-');

export default function IdCardVerifyScreen({ navigation, route }) {
  const token = route?.params?.token;
  const [state, setState] = useState({ phase: 'loading' }); // loading | ok | invalid | network | error

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE_URL}/id-cards/verify/${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }, // NO Authorization
        cache: 'no-store',
        signal: ctrl.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 200) setState({ phase: 'ok', data: body });
      else if (res.status === 404) setState({ phase: 'invalid', message: body?.message });
      else setState({ phase: 'error' });
    } catch (e) {
      setState({ phase: 'network' });
    } finally {
      clearTimeout(timer);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const scanAgain = () => navigation.navigate('QrScanner');
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : scanAgain());

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={goBack} style={s.back}><Ionicons name="chevron-back" size={24} color="#fff" /></TouchableOpacity>
      <Text style={s.headerTitle}>ID Card Verification</Text>
    </View>
  );

  const Actions = (
    <View style={s.actions}>
      <TouchableOpacity style={s.primary} onPress={scanAgain}><Ionicons name="qr-code-outline" size={18} color="#fff" /><Text style={s.primaryText}>Scan Again</Text></TouchableOpacity>
      <TouchableOpacity style={s.secondary} onPress={goBack}><Text style={s.secondaryText}>Back</Text></TouchableOpacity>
    </View>
  );

  const Badge = ({ ui, sub }) => (
    <View style={[s.badge, { backgroundColor: ui.bg, borderColor: ui.color }]}>
      <Ionicons name={ui.icon} size={34} color={ui.color} />
      <Text style={[s.badgeText, { color: ui.color }]}>{ui.label}</Text>
      {sub ? <Text style={[s.badgeSub, { color: ui.color }]}>{sub}</Text> : null}
    </View>
  );

  let content;
  if (state.phase === 'loading') {
    content = <View style={s.center}><ActivityIndicator size="large" color="#B91C1C" /><Text style={s.muted}>Verifying...</Text></View>;
  } else if (state.phase === 'invalid') {
    content = (<ScrollView contentContainerStyle={s.body}><Badge ui={INVALID_UI} sub={state.message} />{Actions}</ScrollView>);
  } else if (state.phase === 'network' || state.phase === 'error') {
    content = (
      <View style={s.center}>
        <Ionicons name={state.phase === 'network' ? 'cloud-offline-outline' : 'warning-outline'} size={54} color="#6b7280" />
        <Text style={s.errTitle}>{state.phase === 'network' ? 'Check your internet connection' : 'Something went wrong'}</Text>
        <TouchableOpacity style={[s.primary, { marginTop: 16 }]} onPress={load}><Ionicons name="refresh" size={18} color="#fff" /><Text style={s.primaryText}>Retry</Text></TouchableOpacity>
        <TouchableOpacity style={[s.secondary, { marginTop: 10 }]} onPress={scanAgain}><Text style={s.secondaryText}>Scan Again</Text></TouchableOpacity>
      </View>
    );
  } else {
    const d = state.data || {};
    const ui = STATUS_UI[String(d.status || '').toLowerCase()] || INVALID_UI; // rang sirf `status` se
    const rows = [
      ['Name', d.name], ['Designation', d.designation], ['Organisation', d.organisation],
      ['ID Number', d.id_number], ['Valid From', fmtDate(d.valid_from)], ['Valid Until', fmtDate(d.valid_until)],
      ['Profile Status', cap(d.profile_status)],
    ];
    content = (
      <ScrollView contentContainerStyle={s.body}>
        <Badge ui={ui} />
        <View style={s.card}>
          <Image source={{ uri: d.profile_image_url || DEFAULT_AVATAR }} style={[s.avatar, { borderColor: ui.color }]} />
          <Text style={s.name}>{d.name || '-'}</Text>
          {d.designation ? <Text style={s.desig}>{d.designation}</Text> : null}
          <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
            {rows.map(([k, v]) => (
              <View key={k} style={s.row}><Text style={s.k}>{k}</Text><Text style={s.v}>{v || '-'}</Text></View>
            ))}
          </View>
        </View>
        {Actions}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#B91C1C" />
      {Header}
      {content}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#B91C1C', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#64748b', marginTop: 12, fontSize: 14 },
  errTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginTop: 12 },
  body: { padding: 16, paddingBottom: 30 },
  badge: { borderWidth: 2, borderRadius: 16, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12 },
  badgeText: { fontSize: 22, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  badgeSub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, marginTop: 14, padding: 18, alignItems: 'center', elevation: 2 },
  avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, backgroundColor: '#e2e8f0' },
  name: { fontSize: 21, fontWeight: '800', color: '#0f172a', marginTop: 10, textAlign: 'center' },
  desig: { fontSize: 14, color: '#64748b', marginTop: 2, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7', gap: 14 },
  k: { color: '#64748b', fontSize: 14 },
  v: { color: '#0f172a', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right', textTransform: 'capitalize' },
  actions: { marginTop: 18, gap: 10 },
  primary: { backgroundColor: '#B91C1C', borderRadius: 30, paddingVertical: 13, paddingHorizontal: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: { borderWidth: 1.5, borderColor: '#B91C1C', borderRadius: 30, paddingVertical: 12, alignItems: 'center', paddingHorizontal: 26 },
  secondaryText: { color: '#B91C1C', fontWeight: '700', fontSize: 15 },
});