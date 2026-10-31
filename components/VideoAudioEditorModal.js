// components/VideoAudioEditorModal.js
// Full-screen editor to add Music and/or Voice to a video.
//
//  - Original sound is ALWAYS muted.
//  - "Music" tab : bundled Music Library. Tap a song to select it and preview it.
//  - "Voice" tab : Record Voice button. Tap to start, tap again to stop.
//  - Output      : onDone({ musicId, musicUrl, musicTitle, music, musicVolume, voiceUri, voiceMime, muteOriginal })
//
// Layout:
//  - Web (wide screen) : video preview card on the left (9:16), controls card on the right.
//  - Mobile / narrow   : full-screen video with a bottom sheet.
//
// Web audio uses plain HTMLAudioElement (music + voice) and MediaRecorder (recording),
// native uses expo-audio.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, StatusBar, Alert, Platform,
  useWindowDimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  useAudioPlayer, useAudioRecorder, RecordingPresets,
  requestRecordingPermissionsAsync, setAudioModeAsync,
} from 'expo-audio';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MUSIC_LIBRARY, resolveSong } from '../constants/musicLibrary';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';

const IS_WEB = Platform.OS === 'web';
const VOLUMES = [0.3, 0.6, 1.0];
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

export default function VideoAudioEditorModal({ visible, videoUri, initial, onClose, onDone }) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const isWide = IS_WEB && winW >= 900;

  const [tab, setTab] = useState('music');                    // 'music' | 'voice'
  const [music, setMusic] = useState(initial?.music || null); // library item
  const [musicVolume, setMusicVolume] = useState(initial?.musicVolume ?? 0.6);
  const [voiceUri, setVoiceUri] = useState(initial?.voiceUri || null);
  const [voiceMime, setVoiceMime] = useState(initial?.voiceMime || null);
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [progress, setProgress] = useState(0);                // 0..1

  // Web: video is stored in IndexedDB ("idb-media:") — the player needs a playable blob URL
  const [resolvedWebUri, setResolvedWebUri] = useState(null);
  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    (async () => {
      if (!IS_WEB || !videoUri || !isIdbMediaUri(videoUri)) { setResolvedWebUri(null); return; }
      const next = await resolveIdbMediaUriToObjectUrl(videoUri);
      if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
      objectUrl = next;
      setResolvedWebUri(next);
    })();
    return () => { alive = false; try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {} };
  }, [videoUri]);
  const playUri = IS_WEB && isIdbMediaUri(videoUri) ? resolvedWebUri : videoUri;

  // Players
  const videoPlayer = useVideoPlayer(visible ? playUri : null, (p) => {
    p.loop = false;
    p.muted = true;
    try { p.playbackRate = 1; } catch {}
    try { p.timeUpdateEventInterval = 0.25; } catch {}
  });
  const musicPlayer = useAudioPlayer(null);   // native only
  const voicePlayer = useAudioPlayer(null);   // native only
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY); // native only

  // Web-only helpers
  const webAudio = useRef({ music: null, voice: null });
  const webRec = useRef({ mr: null, stream: null, chunks: [], mime: '' });

  const playVideoFromStart = useCallback(() => {
    try {
      videoPlayer.muted = true;
      try { videoPlayer.playbackRate = 1; } catch {}   // never let the video run faster than normal
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    } catch {}
  }, [videoPlayer]);

  // One function to play an audio track (music / voice) on web or native
  const playAudio = useCallback((key, uri, volume = 1, loop = false) => {
    if (!uri) return;
    if (IS_WEB) {
      try {
        let a = webAudio.current[key];
        if (!a) { a = new window.Audio(); a.preload = 'auto'; webAudio.current[key] = a; }
        if (a.dataset.src !== uri) { a.src = uri; a.dataset.src = uri; }
        a.loop = loop;
        a.volume = clamp01(volume);
        a.playbackRate = 1;
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch((e) => console.warn('web audio play failed', e));
      } catch (e) { console.warn('web audio failed', e); }
      return;
    }
    try {
      const player = key === 'music' ? musicPlayer : voicePlayer;
      player.replace({ uri });
      player.volume = clamp01(volume);
      player.loop = loop;
      player.seekTo(0);
      player.play();
    } catch (e) { console.warn('audio play failed', e); }
  }, [musicPlayer, voicePlayer]);

  const pauseAudio = useCallback(() => {
    if (IS_WEB) {
      ['music', 'voice'].forEach((k) => { try { webAudio.current[k]?.pause(); } catch {} });
      return;
    }
    try { musicPlayer.pause(); } catch {}
    try { voicePlayer.pause(); } catch {}
  }, [musicPlayer, voicePlayer]);

  const stopAll = useCallback(() => {
    try { videoPlayer.pause(); } catch {}
    pauseAudio();
    setPreviewing(false);
  }, [videoPlayer, pauseAudio]);

  // Reset every time the modal opens
  useEffect(() => {
    if (!visible) { stopAll(); return; }
    setTab('music');
    setMusic(initial?.music || null);
    setMusicVolume(initial?.musicVolume ?? 0.6);
    setVoiceUri(initial?.voiceUri || null);
    setVoiceMime(initial?.voiceMime || null);
    setProgress(0);
    try { videoPlayer.muted = true; videoPlayer.currentTime = 0; } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Video finished -> stop everything. Also drives the progress bar.
  useEffect(() => {
    const subEnd = videoPlayer.addListener?.('playToEnd', () => { stopAll(); setProgress(0); });
    const subTime = videoPlayer.addListener?.('timeUpdate', (e) => {
      const cur = Number(e?.currentTime ?? videoPlayer.currentTime ?? 0);
      const dur = Number(videoPlayer.duration || 0);
      if (dur > 0) setProgress(Math.max(0, Math.min(1, cur / dur)));
    });
    return () => { subEnd?.remove?.(); subTime?.remove?.(); };
  }, [videoPlayer, stopAll]);

  // Cleanup on unmount
  useEffect(() => () => {
    ['music', 'voice'].forEach((k) => {
      try { webAudio.current[k]?.pause(); webAudio.current[k] = null; } catch {}
    });
    try { webRec.current.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
  }, []);

  // Preview: video (muted) + music + voice together
  const startPreview = async () => {
    stopAll();
    if (!IS_WEB) { try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {} }
    playVideoFromStart();
    if (music?.url) playAudio('music', music.url, musicVolume, true);
    if (voiceUri) playAudio('voice', voiceUri, 1, false);
    setPreviewing(true);
  };

  const selectSong = async (song) => {
    if (recording) return;
    const same = music?.id === song.id;
    stopAll();
    if (same) { setMusic(null); return; }
    const resolved = await resolveSong(song);   // bundled mp3 -> playable uri
    setMusic(resolved);
    if (!IS_WEB) { try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {} }
    playAudio('music', resolved.url, musicVolume, true);
    playVideoFromStart();
    setPreviewing(true);
  };

  const changeVolume = (v) => {
    setMusicVolume(v);
    if (IS_WEB) { try { if (webAudio.current.music) webAudio.current.music.volume = clamp01(v); } catch {} }
    else { try { musicPlayer.volume = v; } catch {} }
  };

  // Voice recording
  const startWebRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      Alert.alert('Recording', 'This browser does not support voice recording. Please use Chrome, Edge or Safari.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mime = candidates.find((m) => window.MediaRecorder.isTypeSupported?.(m)) || '';
      const mr = mime ? new window.MediaRecorder(stream, { mimeType: mime }) : new window.MediaRecorder(stream);
      webRec.current = { mr, stream, chunks: [], mime: mr.mimeType || mime || 'audio/webm' };
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) webRec.current.chunks.push(e.data); };
      mr.start(250);
      return true;
    } catch (e) {
      console.warn('web record start failed', e);
      Alert.alert('Permission', 'Microphone permission is required. Please allow it in your browser and try again.');
      return false;
    }
  };

  const stopWebRecording = () => new Promise((resolve) => {
    const { mr, stream } = webRec.current;
    if (!mr) { resolve(null); return; }
    mr.onstop = () => {
      try { stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
      const mime = webRec.current.mime || 'audio/webm';
      const blob = new Blob(webRec.current.chunks, { type: mime });
      webRec.current = { mr: null, stream: null, chunks: [], mime: '' };
      if (!blob.size) { resolve(null); return; }
      resolve({ uri: URL.createObjectURL(blob), mime });
    };
    try { mr.stop(); } catch { resolve(null); }
  });

  const toggleRecord = async () => {
    if (recording) {
      try {
        if (IS_WEB) {
          const res = await stopWebRecording();
          stopAll();
          setRecording(false);
          if (res?.uri) { setVoiceUri(res.uri); setVoiceMime(res.mime); }
          else Alert.alert('Recording', 'No audio was captured. Please try again.');
        } else {
          await recorder.stop();
          const uri = recorder.uri;
          stopAll();
          setRecording(false);
          if (uri) { setVoiceUri(uri); setVoiceMime('audio/mp4'); }
          try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {}
        }
      } catch (e) {
        console.warn('stop record failed', e);
        setRecording(false);
      }
      return;
    }

    try {
      stopAll();
      if (IS_WEB) {
        const ok = await startWebRecording();
        if (!ok) return;
      } else {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm?.granted) { Alert.alert('Permission', 'Microphone permission is required.'); return; }
        try { await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); } catch {}
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
      setRecording(true);
      // The user speaks while watching the muted video (music plays softly if selected)
      playVideoFromStart();
      if (music?.url) playAudio('music', music.url, Math.min(musicVolume, 0.3), true);
    } catch (e) {
      console.warn('start record failed', e);
      Alert.alert('Recording', 'Could not start recording. Please try again.');
    }
  };

  const removeVoice = () => { stopAll(); setVoiceUri(null); setVoiceMime(null); };

  const finish = () => {
    stopAll();
    onDone?.({
      musicId: music?.id || null,
      musicUrl: music?.url || null,
      musicTitle: music?.title || null,
      music,
      musicVolume,
      voiceUri: voiceUri || null,
      voiceMime: voiceUri ? (voiceMime || null) : null,
      muteOriginal: true,
    });
  };

  const close = () => {
    if (recording) {
      if (IS_WEB) { try { webRec.current.mr?.stop(); webRec.current.stream?.getTracks?.().forEach((t) => t.stop()); } catch {} }
      else { try { recorder.stop(); } catch {} }
      setRecording(false);
    }
    stopAll();
    onClose?.();
  };

  const renderSong = ({ item }) => {
    const on = music?.id === item.id;
    return (
      <TouchableOpacity style={[s.song, on && s.songOn]} onPress={() => selectSong(item)} activeOpacity={0.85}>
        <View style={[s.cover, on && s.coverOn]}>
          <Ionicons name="musical-notes" size={20} color="#fff" />
        </View>
        <View style={s.songInfo}>
          <Text style={s.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.songArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Ionicons
          name={on ? 'checkmark-circle' : 'play-circle-outline'}
          size={28}
          color={on ? '#22c55e' : '#e5e7eb'}
        />
      </TouchableOpacity>
    );
  };

  // Sizes
  const stageH = isWide ? Math.max(360, Math.min(winH - 110, 720)) : 0;
  const stageW = isWide ? Math.round(stageH * 9 / 16) : 0;
  const listMaxH = isWide ? Math.max(180, stageH - 170) : 250;

  const stageStyle = isWide
    ? [s.stage, { width: stageW, height: stageH }]
    : [StyleSheet.absoluteFill];

  const panelStyle = isWide
    ? [s.panel, s.panelWide, { maxHeight: stageH }]
    : [s.panel, s.panelSheet, { paddingBottom: insets.bottom + 10 }];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.root}>
        <View style={[s.body, isWide && s.bodyWide, isWide && { paddingTop: 64 }]}>
          {/* VIDEO STAGE */}
          <View style={stageStyle}>
            {playUri ? (
              <VideoView
                player={videoPlayer}
                style={StyleSheet.absoluteFill}
                contentFit={isWide ? 'contain' : (IS_WEB ? 'contain' : 'cover')}
                nativeControls={false}
              />
            ) : null}
            <View style={s.dim} pointerEvents="none" />

            {!recording ? (
              <TouchableOpacity
                style={[s.centerPlay, !isWide && s.centerPlayFull]}
                onPress={() => (previewing ? stopAll() : startPreview())}
                activeOpacity={0.8}
              >
                <Ionicons name={previewing ? 'pause' : 'play'} size={32} color="#fff" style={!previewing && { marginLeft: 3 }} />
              </TouchableOpacity>
            ) : (
              <View style={s.recPill} pointerEvents="none">
                <View style={s.recDot} />
                <Text style={s.recPillText}>Recording</Text>
              </View>
            )}

            {/* progress bar */}
            <View style={[s.progressTrack, !isWide && { bottom: undefined, top: insets.top + 54 }]} pointerEvents="none">
              <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </View>

          {/* CONTROLS PANEL */}
          <View style={panelStyle}>
            <View style={s.tabs}>
              <TouchableOpacity onPress={() => setTab('music')} style={[s.tab, tab === 'music' && s.tabOn]}>
                <Ionicons name="musical-notes" size={15} color={tab === 'music' ? '#fff' : '#e5e7eb'} />
                <Text style={[s.tabText, tab === 'music' && s.tabTextOn]}>Music{music ? ' ✓' : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTab('voice')} style={[s.tab, tab === 'voice' && s.tabOn]}>
                <Ionicons name="mic" size={15} color={tab === 'voice' ? '#fff' : '#e5e7eb'} />
                <Text style={[s.tabText, tab === 'voice' && s.tabTextOn]}>Voice{voiceUri ? ' ✓' : ''}</Text>
              </TouchableOpacity>
            </View>

            {tab === 'music' ? (
              <>
                <FlatList
                  data={MUSIC_LIBRARY}
                  keyExtractor={(i) => i.id}
                  renderItem={renderSong}
                  style={{ maxHeight: listMaxH, flexGrow: 0 }}
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
                  <Text style={s.recText}>{recording ? 'Stop Recording' : 'Record Voice'}</Text>
                </TouchableOpacity>
                <Text style={s.voiceHint}>
                  {recording
                    ? 'Recording… speak while watching the video.'
                    : voiceUri
                      ? 'Voice added. Tap ▶ on the video to preview video + voice.'
                      : 'Tap the button and record your voice. Only your voice will be in the final video.'}
                </Text>
                {voiceUri && !recording ? (
                  <TouchableOpacity onPress={removeVoice} style={s.removeVoice}>
                    <Feather name="trash-2" size={14} color="#fca5a5" />
                    <Text style={s.removeVoiceText}>Remove voice</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* TOP BAR */}
        <View style={[s.top, { paddingTop: (isWide ? 14 : insets.top + 6) }]}>
          <TouchableOpacity onPress={close} style={s.topBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={s.badge}>
            <Feather name="volume-x" size={13} color="#fff" />
            <Text style={s.badgeText}>Original sound muted</Text>
          </View>
          <TouchableOpacity onPress={finish} style={[s.doneBtn, recording && { opacity: 0.4 }]} disabled={recording}>
            <Text style={s.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  body: { flex: 1 },
  bodyWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, paddingBottom: 20, paddingHorizontal: 20 },

  // video stage
  stage: { backgroundColor: '#000', overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  centerPlay: {
    position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -32, width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  centerPlayFull: { top: '38%', marginTop: 0 },
  recPill: {
    position: 'absolute', alignSelf: 'center', top: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(127,29,29,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  recPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: 3, backgroundColor: '#ea580c' },

  // top bar
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6 },
  topBtn: { padding: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  doneBtn: { backgroundColor: '#ea580c', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18 },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // panel
  panel: { backgroundColor: 'rgba(17,24,39,0.96)', paddingTop: 12, paddingHorizontal: 12 },
  panelSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  panelWide: { width: 440, borderRadius: 16, paddingBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabOn: { backgroundColor: '#ea580c' },
  tabText: { color: '#e5e7eb', fontWeight: '700', fontSize: 13 },
  tabTextOn: { color: '#fff' },

  // songs
  song: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12 },
  songOn: { backgroundColor: 'rgba(34,197,94,0.16)' },
  cover: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  coverOn: { backgroundColor: '#16a34a' },
  songInfo: { flex: 1, minWidth: 0 },
  songTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  songArtist: { color: '#9ca3af', fontSize: 12, marginTop: 1 },

  // volume
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12 },
  volLabel: { color: '#d1d5db', fontSize: 12, flex: 1 },
  volChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)' },
  volChipOn: { backgroundColor: '#ea580c' },
  volText: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },

  // voice
  voiceBox: { alignItems: 'center', paddingVertical: 18, gap: 14 },
  recBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#dc2626', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30 },
  recBtnOn: { backgroundColor: '#7f1d1d', borderWidth: 2, borderColor: '#ef4444' },
  recText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  voiceHint: { color: '#d1d5db', fontSize: 12, textAlign: 'center', paddingHorizontal: 16, lineHeight: 18 },
  removeVoice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeVoiceText: { color: '#fca5a5', fontSize: 12, fontWeight: '700' },
});