// components/NewsMusicSync.js
// Backend se aaya `music_url` (jaise "krasnoshchok-news-breaking-news-music-529078.mp3") ka asli gaana
// assets/music se dhoondh kar video ke saath chalata hai:
//   - video play  -> music play (video shuru se ho to music bhi shuru se)
//   - video pause / khatam -> music pause
//   - mute_original = 1 -> video ki apni awaaz band (sirf music)
//   - global mute / video mute -> music bhi mute
// Dono tarah ke players support: expo-video `player` ya web ka <video> element (`videoEl`).
// Kuch render nahi karta.
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { resolveMusicUrl } from '../constants/musicLibrary';

const IS_WEB = Platform.OS === 'web';
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

export default function NewsMusicSync({
  player = null,
  videoEl = null,
  musicUrl = '',
  volume = 0.6,
  muted = false,
  muteOriginal = false,
}) {
  const key = String(musicUrl || '').trim();
  const [uri, setUri] = useState(null);
  const nativeAudio = useAudioPlayer(null);
  const webAudio = useRef(null);
  const loadedRef = useRef(null);
  const wantVol = useRef(0.6);
  const api = useRef({});

  // gaana resolve (assets/music file name -> playable uri)
  useEffect(() => {
    let alive = true;
    setUri(null);
    loadedRef.current = null;
    if (!key) return undefined;
    resolveMusicUrl(key)
      .then((u) => {
        if (!u) console.warn('[NewsMusic] assets/music me ye song nahi mila (musicLibrary.js me entry check karo):', key);
        if (alive) setUri(u || null);
      })
      .catch((err) => console.warn('[NewsMusic] song load nahi hua:', key, err?.message || err));
    return () => { alive = false; };
  }, [key]);

  useEffect(() => {
    if (IS_WEB) return;
    try { setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }); } catch (_) { /* ignore */ }
  }, []);

  wantVol.current = muted ? 0 : clamp01(volume);

  const ensureLoaded = () => {
    if (!uri) return false;
    if (loadedRef.current === uri) return true;
    try {
      if (IS_WEB) {
        if (!webAudio.current) webAudio.current = new window.Audio();
        const a = webAudio.current;
        a.src = uri; a.loop = true; a.preload = 'auto'; a.playbackRate = 1;
      } else {
        nativeAudio.replace({ uri });
        nativeAudio.loop = true;
      }
      loadedRef.current = uri;
      return true;
    } catch (_) { return false; }
  };
  const applyVol = () => {
    try {
      if (IS_WEB) { if (webAudio.current) webAudio.current.volume = wantVol.current; }
      else nativeAudio.volume = wantVol.current;
    } catch (_) { /* ignore */ }
  };
  api.current.play = (restart) => {
    if (!ensureLoaded()) return;
    applyVol();
    try {
      if (IS_WEB) {
        const a = webAudio.current;
        if (restart) a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch((err) => console.warn('[NewsMusic] browser ne play roka (video par click ke baad chalega):', err?.message || err));
      } else {
        if (restart) nativeAudio.seekTo(0);
        nativeAudio.play();
      }
    } catch (_) { /* ignore */ }
  };
  api.current.pause = (rewind) => {
    try {
      if (IS_WEB) {
        const a = webAudio.current;
        if (a) { a.pause(); if (rewind) a.currentTime = 0; }
      } else {
        nativeAudio.pause();
        if (rewind) nativeAudio.seekTo(0);
      }
    } catch (_) { /* ignore */ }
  };
  api.current.applyVol = applyVol;

  // volume / mute badle to turant lage
  useEffect(() => { applyVol(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [muted, volume, uri]);

  // expo-video player se sync
  useEffect(() => {
    if (!player || !uri) return undefined;
    const subs = [];
    const onPlaying = (isPlaying) => {
      if (isPlaying) {
        let restart = false;
        try { restart = Number(player.currentTime || 0) < 0.6; } catch (_) { /* ignore */ }
        api.current.play(restart);
      } else {
        api.current.pause();
      }
    };
    try { subs.push(player.addListener('playingChange', (e) => onPlaying(typeof e === 'object' ? Boolean(e?.isPlaying) : Boolean(e)))); } catch (_) { /* ignore */ }
    try { subs.push(player.addListener('playToEnd', () => api.current.pause(true))); } catch (_) { /* ignore */ }
    try { subs.push(player.addListener('mutedChange', (e) => { try { wantVol.current = (e?.muted ?? player.muted) ? 0 : clamp01(volume); api.current.applyVol(); } catch (_) { /* ignore */ } })); } catch (_) { /* ignore */ }
    try { if (player.playing) onPlaying(true); } catch (_) { /* ignore */ }
    return () => { subs.forEach((s) => { try { s?.remove?.(); } catch (_) { /* ignore */ } }); api.current.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, uri]);

  // web <video> element se sync
  useEffect(() => {
    if (!videoEl || !uri) return undefined;
    const onPlay = () => api.current.play(Number(videoEl.currentTime || 0) < 0.6);
    const onPause = () => api.current.pause();
    const onEnded = () => api.current.pause(true);
    const onVol = () => { wantVol.current = videoEl.muted ? 0 : clamp01(volume); api.current.applyVol(); };
    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('ended', onEnded);
    videoEl.addEventListener('volumechange', onVol);
    if (!videoEl.paused && !videoEl.ended) onPlay();
    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('ended', onEnded);
      videoEl.removeEventListener('volumechange', onVol);
      api.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoEl, uri]);

  // mute_original = 1 -> video ki apni awaaz band (muted flag user ke mute button ke liye alag rehta hai)
  useEffect(() => {
    if (!muteOriginal || !uri) return undefined;
    try { if (player) player.volume = 0; } catch (_) { /* ignore */ }
    try { if (videoEl) videoEl.volume = 0; } catch (_) { /* ignore */ }
    return () => {
      try { if (player) player.volume = 1; } catch (_) { /* ignore */ }
      try { if (videoEl) videoEl.volume = 1; } catch (_) { /* ignore */ }
    };
  }, [muteOriginal, player, videoEl, uri]);

  // unmount
  useEffect(() => () => {
    try { if (IS_WEB && webAudio.current) { webAudio.current.pause(); webAudio.current.src = ''; webAudio.current = null; } } catch (_) { /* ignore */ }
  }, []);

  return null;
}