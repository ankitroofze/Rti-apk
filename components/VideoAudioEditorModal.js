// components/VideoAudioEditorModal.js
// Video par Music aur/ya Voice add karne ka full-screen editor.
//
//  • Video full-screen chalta hai, original awaaz HAMESHA mute (muteOriginal).
//  • "Music" tab  : Free Music Library (20-25 songs) — naam + cover dekhkar select, tap karte hi preview.
//  • "Voice" tab  : 🎙️ Record Voice button — dabao to record shuru, dobara dabao to stop.
//                   Record ki hui voice video ke saath preview hoti hai.
//  • Final output : onDone({ musicId, musicUrl, musicTitle, musicVolume, voiceUri, muteOriginal })
//    Final merge (video + music + voice) server par ffmpeg se hota hai (README_AUDIO_MERGE.md dekho).
//
// Dependencies: expo-audio, expo-video   ->  npx expo install expo-audio
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList, Image, StyleSheet, StatusBar, Alert, Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  useAudioPlayer, useAudioRecorder, RecordingPresets,
  requestRecordingPermissionsAsync, setAudioModeAsync,
} from 'expo-audio';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MUSIC_LIBRARY } from '../constants/musicLibrary';

const VOLUMES = [0.3, 0.6, 1.0];

export default function VideoAudioEditorModal({ visible, videoUri, initial, onClose, onDone }) {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState('music');                    // 'music' | 'voice'
  const [music, setMusic] = useState(initial?.music || null); // library item
  const [musicVolume, setMusicVolume] = useState(initial?.musicVolume ?? 0.6);
  const [voiceUri, setVoiceUri] = useState(initial?.voiceUri || null);
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Video: original awaaz mute
  const videoPlayer = useVideoPlayer(visible ? videoUri : null, (p) => { p.loop = false; p.muted = true; });
  const musicPlayer = useAudioPlayer(null);
  const voicePlayer = useAudioPlayer(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const stopAll = useCallback(() => {
    try { videoPlayer.pause(); } catch {}
    try { musicPlayer.pause(); } catch {}
    try { voicePlayer.pause(); } catch {}
    setPreviewing(false);
  }, [videoPlayer, musicPlayer, voicePlayer]);

  // modal khulte hi reset
  useEffect(() => {
    if (!visible) { stopAll(); return; }
    setTab('music');
    setMusic(initial?.music || null);
    setMusicVolume(initial?.musicVolume ?? 0.6);
    setVoiceUri(initial?.voiceUri || null);
    try { videoPlayer.muted = true; videoPlayer.currentTime = 0; } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // video khatam hote hi sab ruk jaye
  useEffect(() => {
    const sub = videoPlayer.addListener?.('playToEnd', () => stopAll());
    return () => sub?.remove?.();
  }, [videoPlayer, stopAll]);

  const loadAndPlay = (player, uri, volume = 1, loop = false) => {
    try {
      player.replace({ uri });
      player.volume = volume;
      player.loop = loop;
      player.seekTo(0);
      player.play();
    } catch (e) { console.warn('audio play failed', e); }
  };

  // ── Preview: video (mute) + music + voice ek saath ─────────────────────────
  const startPreview = async () => {
    stopAll();
    try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {}
    try { videoPlayer.muted = true; videoPlayer.currentTime = 0; videoPlayer.play(); } catch {}
    if (music?.url) loadAndPlay(musicPlayer, music.url, musicVolume, true);
    if (voiceUri) loadAndPlay(voicePlayer, voiceUri, 1, false);
    setPreviewing(true);
  };

  const selectSong = async (song) => {
    if (recording) return;
    const same = music?.id === song.id;
    setMusic(same ? null : song);
    stopAll();
    if (same) return;
    try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {}
    loadAndPlay(musicPlayer, song.url, musicVolume, true);   // song ka preview
    try { videoPlayer.muted = true; videoPlayer.currentTime = 0; videoPlayer.play(); } catch {}
    setPreviewing(true);
  };

  const changeVolume = (v) => {
    setMusicVolume(v);
    try { musicPlayer.volume = v; } catch {}
  };

  // ── Voice record ────────────────────────────────────────────────────────────
  const toggleRecord = async () => {
    if (recording) {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        stopAll();
        setRecording(false);
        if (uri) setVoiceUri(uri);
        try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {}
      } catch (e) {
        console.warn('stop record failed', e);
        setRecording(false);
      }
      return;
    }
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm?.granted) { Alert.alert('Permission', 'Microphone permission chahiye.'); return; }
      stopAll();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      // user video dekhte hue bol sake — video mute chalta hai (music bhi saath me, agar select ho)
      try { videoPlayer.muted = true; videoPlayer.currentTime = 0; videoPlayer.play(); } catch {}
      if (music?.url) loadAndPlay(musicPlayer, music.url, Math.min(musicVolume, 0.3), true);
    } catch (e) {
      console.warn('start record failed', e);
      Alert.alert('Recording', 'Recording shuru nahi ho paayi.');
    }
  };

  const removeVoice = () => { stopAll(); setVoiceUri(null); };

  const finish = () => {
    stopAll();
    onDone?.({
      musicId: music?.id || null,
      musicUrl: music?.url || null,
      musicTitle: music?.title || null,
      music,
      musicVolume,
      voiceUri: voiceUri || null,
      muteOriginal: true,
    });
  };

  const close = () => {
    if (recording) { try { recorder.stop(); } catch {} setRecording(false); }
    stopAll();
    onClose?.();
  };

  const renderSong = ({ item }) => {
    const on = music?.id === item.id;
    return (
      <TouchableOpacity style={[s.song, on && s.songOn]} onPress={() => selectSong(item)} activeOpacity={0.85}>
        <Image source={{ uri: item.cover }} style={s.cover} />
        <View style={{ flex: 1 }}>
          <Text style={s.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.songArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Ionicons name={on ? 'checkmark-circle' : 'play-circle-outline'} size={26} color={on ? '#22c55e' : '#fff'} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.root}>
        {/* full-screen video */}
        {videoUri ? (
          <VideoView
            player={videoPlayer}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        ) : null}
        <View style={s.dim} pointerEvents="none" />

        {/* top bar */}
        <View style={[s.top, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={close} style={s.topBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={s.badge}>
            <Feather name="volume-x" size={13} color="#fff" />
            <Text style={s.badgeText}>Original sound mute</Text>
          </View>
          <TouchableOpacity onPress={finish} style={s.doneBtn} disabled={recording}>
            <Text style={s.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* preview play/pause centre */}
        {!recording ? (
          <TouchableOpacity
            style={s.centerPlay}
            onPress={() => (previewing ? stopAll() : startPreview())}
            activeOpacity={0.8}
          >
            <Ionicons name={previewing ? 'pause' : 'play'} size={34} color="#fff" />
          </TouchableOpacity>
        ) : null}

        {/* bottom panel */}
        <View style={[s.panel, { paddingBottom: insets.bottom + 10 }]}>
          <View style={s.tabs}>
            <TouchableOpacity onPress={() => setTab('music')} style={[s.tab, tab === 'music' && s.tabOn]}>
              <Text style={[s.tabText, tab === 'music' && s.tabTextOn]}>🎵 Music{music ? ' ✓' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('voice')} style={[s.tab, tab === 'voice' && s.tabOn]}>
              <Text style={[s.tabText, tab === 'voice' && s.tabTextOn]}>🎙️ Voice{voiceUri ? ' ✓' : ''}</Text>
            </TouchableOpacity>
          </View>

          {tab === 'music' ? (
            <>
              <FlatList
                data={MUSIC_LIBRARY}
                keyExtractor={(i) => i.id}
                renderItem={renderSong}
                style={{ maxHeight: 250 }}
                showsVerticalScrollIndicator={false}
              />
              <View style={s.volRow}>
                <Text style={s.volLabel}>Music volume</Text>
                {VOLUMES.map((v) => (
                  <TouchableOpacity key={v} onPress={() => changeVolume(v)} style={[s.volChip, musicVolume === v && s.volChipOn]}>
                    <Text style={[s.volText, musicVolume === v && { color: '#fff' }]}>{Math.round(v * 100)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={s.voiceBox}>
              <TouchableOpacity onPress={toggleRecord} activeOpacity={0.85} style={[s.recBtn, recording && s.recBtnOn]}>
                <Ionicons name={recording ? 'stop' : 'mic'} size={22} color="#fff" />
                <Text style={s.recText}>{recording ? 'Stop Recording' : '🎙️ Record Voice'}</Text>
              </TouchableOpacity>
              <Text style={s.voiceHint}>
                {recording
                  ? 'Recording chal rahi hai... video dekhte hue bolo.'
                  : voiceUri
                    ? 'Voice add ho gayi. ▶ dabakar video + voice preview suno.'
                    : 'Button dabakar apni voice record karo. Final video me sirf tumhari voice hogi.'}
              </Text>
              {voiceUri && !recording ? (
                <TouchableOpacity onPress={removeVoice} style={s.removeVoice}>
                  <Feather name="trash-2" size={14} color="#fca5a5" />
                  <Text style={s.removeVoiceText}>Voice hatao</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  topBtn: { padding: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  doneBtn: { backgroundColor: '#ea580c', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18 },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  centerPlay: {
    position: 'absolute', alignSelf: 'center', top: '38%', width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.78)', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10, paddingHorizontal: 12 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  tabOn: { backgroundColor: '#ea580c' },
  tabText: { color: '#e5e7eb', fontWeight: '700', fontSize: 13 },
  tabTextOn: { color: '#fff' },
  song: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10 },
  songOn: { backgroundColor: 'rgba(34,197,94,0.18)' },
  cover: { width: 46, height: 46, borderRadius: 8, backgroundColor: '#374151' },
  songTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  songArtist: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 },
  volLabel: { color: '#d1d5db', fontSize: 12, flex: 1 },
  volChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  volChipOn: { backgroundColor: '#ea580c' },
  volText: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },
  voiceBox: { alignItems: 'center', paddingVertical: 12, gap: 12 },
  recBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#dc2626', paddingHorizontal: 26, paddingVertical: 14, borderRadius: 30 },
  recBtnOn: { backgroundColor: '#7f1d1d', borderWidth: 2, borderColor: '#ef4444' },
  recText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  voiceHint: { color: '#d1d5db', fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },
  removeVoice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeVoiceText: { color: '#fca5a5', fontSize: 12, fontWeight: '700' },
});