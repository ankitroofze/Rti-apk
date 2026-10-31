// components/NewsVideoControls.js
// News video ke upar controls — bilkul ad player (screenshot) jaise:
//   beech me:  |<   (5)↺   ( ▶ )   ↻(15)   >|
//   neeche:    progress bar
//              00:12 · 01:29   (1:17 baki)                 ⚙  ⛶
// Bada alag play button nahi; yahi play/pause hai. Video chalte time controls
// kuch second baad chhup jaate hain, video par tap karne se wapas aate hain.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SPEEDS = [1, 1.25, 1.5, 2, 0.5];

export function fmt(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${r < 10 ? '0' : ''}${r}`;
}

function readTimes(player) {
  let cur = 0;
  let dur = 0;
  try { cur = Number(player.currentTime) || 0; } catch (_) {}
  try { dur = Number(player.duration) || 0; } catch (_) {}
  return { cur, dur };
}

function SkipIcon({ back, seconds, disabled, onPress }) {
  return (
    <TouchableOpacity
      onPress={(e) => { e?.stopPropagation?.(); onPress?.(); }}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={[st.skipBtn, disabled && st.dim]}
      accessibilityRole="button"
      accessibilityLabel={back ? `Back ${seconds} seconds` : `Forward ${seconds} seconds`}
    >
      <Ionicons
        name="reload"
        size={34}
        color="#fff"
        style={back ? { transform: [{ scaleX: -1 }] } : null}
      />
      <Text style={st.skipNum}>{seconds}</Text>
    </TouchableOpacity>
  );
}

export default function NewsVideoControls({
  player,            // expo-video player (video activate hone se pehle null)
  visible = true,
  paused = true,
  ended = false,
  buffering = false,
  bottomInset = 0,   // niche banner / ticker ke upar jagah chhodne ke liye
  onTogglePlay,
  onFullscreen,
  onInteract,        // koi bhi button dabe to auto-hide timer reset
  compact = false,
}) {
  const [times, setTimes] = useState({ cur: 0, dur: 0 });
  const [speedIdx, setSpeedIdx] = useState(0);
  const trackW = useRef(0);

  // current time / duration — player ho tabhi, aur controls dikh rahe ho tabhi poll
  useEffect(() => {
    if (!player || !visible) return undefined;
    const tick = () => {
      const t = readTimes(player);
      setTimes((prev) =>
        Math.abs(prev.cur - t.cur) < 0.2 && Math.abs(prev.dur - t.dur) < 0.2 ? prev : t
      );
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [player, visible]);

  // naya player / naya video => reset
  useEffect(() => {
    if (!player) {
      setTimes({ cur: 0, dur: 0 });
      setSpeedIdx(0);
    }
  }, [player]);

  const { cur, dur } = times;
  const pct = dur > 0 ? Math.min(1, Math.max(0, cur / dur)) : 0;
  const left = Math.max(0, dur - cur);
  const ready = Boolean(player);

  const seekTo = (t) => {
    if (!player) return;
    const target = Math.min(dur > 0 ? dur : t, Math.max(0, t));
    try { player.currentTime = target; } catch (_) {
      try { player.seekBy(target - cur); } catch (__) {}
    }
    setTimes((prev) => ({ ...prev, cur: target }));
  };

  const seekFromEvent = (e) => {
    onInteract?.();
    if (!trackW.current || !dur) return;
    const x = e?.nativeEvent?.locationX ?? 0;
    seekTo(Math.min(1, Math.max(0, x / trackW.current)) * dur);
  };

  const cycleSpeed = () => {
    onInteract?.();
    if (!player) return;
    const next = (speedIdx + 1) % SPEEDS.length;
    try { player.playbackRate = SPEEDS[next]; } catch (_) {}
    setSpeedIdx(next);
  };

  if (!visible) return null;

  const playSize = compact ? 54 : 64;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { bottom: bottomInset, zIndex: 4, elevation: 4 }]}>
      {/* halka dark scrim — jaise ad player me */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, st.scrim, paused ? null : { backgroundColor: 'transparent' }]} />
      <View pointerEvents="none" style={st.bottomShade} />

      {/* ── beech ka row: prev | -5 | play | +15 | next ── */}
      <View pointerEvents="box-none" style={st.centerRow}>
        <TouchableOpacity disabled activeOpacity={1} style={[st.skipBtn, st.dim]} accessibilityLabel="Previous">
          <Ionicons name="play-skip-back" size={30} color="#fff" />
        </TouchableOpacity>

        <SkipIcon back seconds={5} disabled={!ready} onPress={() => { onInteract?.(); seekTo(cur - 5); }} />

        <TouchableOpacity
          onPress={(e) => { e?.stopPropagation?.(); onInteract?.(); onTogglePlay?.(); }}
          activeOpacity={0.85}
          style={[st.playCircle, { width: playSize, height: playSize, borderRadius: playSize / 2 }]}
          accessibilityRole="button"
          accessibilityLabel={ended ? 'Replay' : paused ? 'Play' : 'Pause'}
        >
          {buffering && !paused ? (
            <ActivityIndicator size="small" color="#111" />
          ) : ended ? (
            <Ionicons name="reload" size={playSize * 0.5} color="#111" />
          ) : paused ? (
            <Ionicons name="play" size={playSize * 0.52} color="#111" style={{ marginLeft: 3 }} />
          ) : (
            <Ionicons name="pause" size={playSize * 0.5} color="#111" />
          )}
        </TouchableOpacity>

        <SkipIcon seconds={15} disabled={!ready} onPress={() => { onInteract?.(); seekTo(cur + 15); }} />

        <TouchableOpacity disabled activeOpacity={1} style={[st.skipBtn, st.dim]} accessibilityLabel="Next">
          <Ionicons name="play-skip-forward" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── neeche: progress bar + time + settings + fullscreen ── */}
      <View pointerEvents="box-none" style={st.bottom}>
        <View
          onLayout={(e) => { trackW.current = e.nativeEvent.layout.width; }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={seekFromEvent}
          onResponderMove={seekFromEvent}
          style={st.trackHit}
        >
          <View style={st.track}>
            <View style={[st.fill, { width: `${pct * 100}%` }]} />
          </View>
          <View style={[st.knob, { left: `${pct * 100}%` }]} />
        </View>

        <View style={st.infoRow}>
          <Text style={st.time} numberOfLines={1}>
            {fmt(cur)} <Text style={st.timeDim}>·</Text> {dur > 0 ? fmt(dur) : '--:--'}
          </Text>
          {dur > 0 ? (
            <Text style={st.left} numberOfLines={1}>{fmt(left)} baki</Text>
          ) : null}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); cycleSpeed(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            style={st.iconBtn}
            accessibilityLabel="Playback speed"
          >
            {SPEEDS[speedIdx] !== 1 ? <Text style={st.speedTxt}>{SPEEDS[speedIdx]}x</Text> : null}
            <Ionicons name="settings-sharp" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e?.stopPropagation?.(); onInteract?.(); onFullscreen?.(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            style={[st.iconBtn, { marginLeft: 14 }]}
            accessibilityLabel="Fullscreen"
          >
            <Ionicons name="scan-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.12)' }, // video saaf dikhe, bas halka sa
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, backgroundColor: 'rgba(0,0,0,0.35)' },
  centerRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    paddingBottom: 26, // progress bar ke liye jagah
  },
  skipBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skipNum: {
    position: 'absolute',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
    ...(Platform.OS === 'web' ? { fontFamily: "'Roboto', sans-serif" } : null),
  },
  dim: { opacity: 0.35 },
  playCircle: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.35)' },
      default: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5 },
    }),
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 8 },
  trackHit: { height: 22, justifyContent: 'center' },
  track: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  fill: { height: 3, backgroundColor: '#fff' },
  knob: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    backgroundColor: '#fff',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  time: {
    color: '#fff',
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? { fontFamily: "'Roboto', sans-serif" } : null),
  },
  timeDim: { color: 'rgba(255,255,255,0.7)' },
  left: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginLeft: 8 },
  iconBtn: { flexDirection: 'row', alignItems: 'center' },
  speedTxt: { color: '#fff', fontSize: 11, fontWeight: '700', marginRight: 4 },
});