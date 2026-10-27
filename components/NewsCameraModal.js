// components/NewsCameraModal.js
// Full-screen in-app camera (Photo + Video), reference screenshot jaisa:
//  • top par scrolling hint text
//  • report-type chips (optional)
//  • bada shutter button, flip camera, gallery shortcut
//  • neeche "Photo | Video" toggle
//
// Dependencies: expo-camera, expo-image-picker
//   npx expo install expo-camera
// app.json plugins me "expo-camera" add karo (camera + microphone permission text ke saath).
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_VIDEO_SECONDS = 60;

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function NewsCameraModal({
  visible,
  onClose,
  onCapture,            // ({ type: 'photo' | 'video', uri, durationMs? }) => void
  initialMode = 'photo',
  chips = [],           // e.g. REPORT_TYPES
  selectedChip = '',
  onSelectChip,
  hint = 'See an accident, local issue or important event nearby? Capture a photo/video right away',
}) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [mode, setMode] = useState(initialMode);     // 'photo' | 'video'
  const [facing, setFacing] = useState('back');
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setReady(false);
    setRecording(false);
    setSeconds(0);
    (async () => {
      if (!camPerm?.granted) await requestCamPerm();
      if (!micPerm?.granted) await requestMicPerm();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || busy) return;
    try {
      setBusy(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: false });
      if (photo?.uri) onCapture?.({ type: 'photo', uri: photo.uri });
    } catch (e) {
      console.warn('takePicture failed', e);
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || recording) return;
    try {
      setRecording(true);
      setSeconds(0);
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => setSeconds((v) => v + 1), 1000);
      const result = await cameraRef.current.recordAsync({ maxDuration: MAX_VIDEO_SECONDS });
      stopTimer();
      setRecording(false);
      if (result?.uri) {
        onCapture?.({ type: 'video', uri: result.uri, durationMs: Date.now() - startedAtRef.current });
      }
    } catch (e) {
      console.warn('recordAsync failed', e);
      stopTimer();
      setRecording(false);
    }
  };

  const stopRecording = () => {
    try { cameraRef.current?.stopRecording(); } catch {}
  };

  const onShutter = () => {
    if (mode === 'photo') return takePhoto();
    return recording ? stopRecording() : startRecording();
  };

  const openGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mode === 'video' ? ['videos'] : ['images'],
        allowsMultipleSelection: false,
        quality: 0.7,
        videoMaxDuration: MAX_VIDEO_SECONDS,
      });
      if (!res.canceled && res.assets?.[0]) {
        const a = res.assets[0];
        onCapture?.({
          type: a.type === 'video' ? 'video' : 'photo',
          uri: a.uri,
          durationMs: a.duration,
        });
      }
    } catch (e) {
      console.warn('gallery failed', e);
    }
  };

  const permsOk = camPerm?.granted && (mode === 'photo' || micPerm?.granted);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.root}>
        {permsOk ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mode={mode === 'video' ? 'video' : 'picture'}
            onCameraReady={() => setReady(true)}
          />
        ) : (
          <View style={s.permWrap}>
            <Text style={s.permText}>Camera / Microphone permission chahiye.</Text>
            <TouchableOpacity
              style={s.permBtn}
              onPress={async () => { await requestCamPerm(); await requestMicPerm(); }}
            >
              <Text style={s.permBtnText}>Allow</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* top hint + close */}
        <View style={[s.top, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} disabled={recording}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={s.hint} numberOfLines={1}>{hint}</Text>
        </View>

        {recording ? (
          <View style={[s.recBadge, { top: insets.top + 56 }]}>
            <View style={s.recDot} />
            <Text style={s.recText}>{fmt(seconds)} / {fmt(MAX_VIDEO_SECONDS)}</Text>
          </View>
        ) : null}

        {/* bottom controls */}
        <View style={[s.bottom, { paddingBottom: insets.bottom + 8 }]}>
          {chips.length > 0 && !recording ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              {chips.map((c) => {
                const on = c === selectedChip;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => onSelectChip?.(c)}
                    style={[s.chip, on && s.chipOn]}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={s.shutterRow}>
            <TouchableOpacity onPress={openGallery} style={s.sideBtn} disabled={recording}>
              <Feather name="image" size={26} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onShutter} activeOpacity={0.85} disabled={!ready || busy}>
              <View style={s.shutterOuter}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : mode === 'video' ? (
                  recording ? <View style={s.stopSquare} /> : <View style={s.recordDot} />
                ) : (
                  <View style={s.photoDot} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              style={s.sideBtn}
              disabled={recording}
            >
              <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.modeRow}>
            <TouchableOpacity onPress={() => !recording && setMode('photo')} style={s.modeBtn}>
              <Text style={[s.modeText, mode === 'photo' && s.modeTextOn]}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => !recording && setMode('video')} style={s.modeBtn}>
              <Text style={[s.modeText, mode === 'video' && s.modeTextOn]}>Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  permText: { color: '#fff', fontSize: 14 },
  permBtn: { backgroundColor: '#ea580c', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 8 },
  permBtnText: { color: '#fff', fontWeight: '700' },

  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  closeBtn: { padding: 6 },
  hint: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  recBadge: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  recText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  chipsRow: { paddingHorizontal: 12, gap: 8, paddingBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)' },
  chipOn: { backgroundColor: '#ea580c' },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  chipTextOn: { color: '#fff' },

  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 24, paddingBottom: 14 },
  sideBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  photoDot: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  recordDot: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ef4444' },
  stopSquare: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#ef4444' },

  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 44, paddingVertical: 10, backgroundColor: '#000' },
  modeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  modeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modeTextOn: { color: '#f59e0b' },
});