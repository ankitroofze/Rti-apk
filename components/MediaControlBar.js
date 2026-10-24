import React, { useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Audio-only ad (mp3/m4a ya bina video-track wali file) ko bhi bilkul video jaisa dikhane ke liye:
// niche dark bar -> play/pause, "0:00 / 0:13", progress line, volume.
// Web + Android + iOS teeno par same dikhta hai (native audio "pill" use nahi hota).

const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|amr)(\?|#|$)/i;
export const isAudioUrl = (uri) => AUDIO_EXT.test(String(uri || ''));

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

export default function MediaControlBar({ playing, current = 0, duration = 0, muted, onToggle, onSeek, onMute }) {
  const trackW = useRef(0);
  const pct = duration > 0 ? Math.min(1, Math.max(0, current / duration)) : 0;

  const seekFromEvent = (e) => {
    if (!trackW.current || !duration) return;
    const x = e?.nativeEvent?.locationX ?? 0;
    onSeek?.(Math.min(1, Math.max(0, x / trackW.current)) * duration);
  };

  return (
    <View
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={onToggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'}>
          <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 13, marginLeft: 14, fontVariant: ['tabular-nums'] }}>
          {formatTime(current)} / {formatTime(duration)}
        </Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={onMute} hitSlop={10} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* progress line (touch/drag se seek) */}
      <View
        onLayout={(e) => { trackW.current = e.nativeEvent.layout.width; }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={seekFromEvent}
        onResponderMove={seekFromEvent}
        style={{ height: 18, justifyContent: 'center', marginTop: 4 }}
      >
        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: 3, backgroundColor: '#fff' }} />
        </View>
      </View>
    </View>
  );
}