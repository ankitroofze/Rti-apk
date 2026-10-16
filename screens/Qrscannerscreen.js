// screens/QrScannerScreen.js
// Install: npx expo install expo-camera
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { extractVerifyToken } from '../constants/idCardVerifyConfig';

export default function QrScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState('');
  const lockRef = useRef(false); // duplicate scan roko

  // Screen par wapas aane (Scan Again) par scanner dobara chalu
  useFocusEffect(useCallback(() => {
    lockRef.current = false;
    setPaused(false);
    setError('');
  }, []));

  const onScan = useCallback(({ data }) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setPaused(true); // camera pause

    const token = extractVerifyToken(data);
    if (!token) {
      setError('Invalid QR code');
      setTimeout(() => { setError(''); setPaused(false); lockRef.current = false; }, 2000);
      return;
    }
    navigation.navigate('IdCardVerify', { token });
  }, [navigation]);

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));

  if (!permission) {
    return <View style={s.center}><ActivityIndicator color="#fff" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Ionicons name="camera-outline" size={56} color="#fff" />
        <Text style={s.permTitle}>Camera permission required</Text>
        <Text style={s.permText}>Camera permission is required to scan the ID card QR.</Text>
        {permission.canAskAgain ? (
          <TouchableOpacity style={s.btn} onPress={requestPermission}><Text style={s.btnText}>Allow Camera</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.btn} onPress={() => Linking.openSettings()}><Text style={s.btnText}>Open Settings</Text></TouchableOpacity>
        )}
        <TouchableOpacity onPress={goBack} style={{ marginTop: 14 }}><Text style={s.link}>Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : onScan}
      />
      <SafeAreaView style={s.overlay} pointerEvents="box-none">
        <TouchableOpacity onPress={goBack} style={s.back}><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <View style={s.frameWrap} pointerEvents="none">
          <View style={[s.frame, error ? { borderColor: '#ef4444' } : null]} />
          <Text style={[s.hint, error ? s.hintErr : null]}>{error || 'Point the camera at the ID card QR code'}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#7F1D1D', alignItems: 'center', justifyContent: 'center', padding: 28 },
  overlay: { ...StyleSheet.absoluteFillObject },
  back: { margin: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 250, height: 250, borderRadius: 20, borderWidth: 3, borderColor: '#fff' },
  hint: { marginTop: 18, color: '#fff', fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },
  hintErr: { backgroundColor: '#dc2626' },
  permTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 14 },
  permText: { color: '#fecaca', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  btn: { backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30 },
  btnText: { color: '#B91C1C', fontWeight: '700', fontSize: 15 },
  link: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' },
});