import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import AutoFitAdImage from './AutoFitAdImage';
import MediaControlBar, { isAudioUrl } from './MediaControlBar';
import NewsVideoControls from './NewsVideoControls';
import { subscribeUserScroll } from '../utils/feedScrollBus';

// Video ka asli width/height ratio nikalta hai (native + web) taaki video bina zoom/crop/stretch ke
// bilkul waisa dikhe jaisa upload kiya gaya tha.
function useVideoRatio(uri, player) {
  const [ratio, setRatio] = useState(null);

  useEffect(() => {
    setRatio(null);
    if (!uri) return undefined;
    let alive = true;
    const subs = [];
    const apply = (size) => {
      if (alive && size && size.width > 0 && size.height > 0) setRatio(size.width / size.height);
    };

    if (player) {
      const read = () => { try { apply(player.videoTrack?.size); } catch (e) { /* ignore */ } };
      try {
        read();
        // Android/iOS: size alag-alag waqt par milta hai, isliye saare events + chhota polling fallback
        subs.push(player.addListener('videoTrackChange', (e) => apply(e?.videoTrack?.size)));
        subs.push(player.addListener('sourceLoad', (e) => { apply(e?.availableVideoTracks?.[0]?.size); read(); }));
        subs.push(player.addListener('statusChange', () => read()));
      } catch (e) { /* purana expo-video: 16:9 fallback */ }
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        read();
        if (tries >= 20) clearInterval(timer); // ~6 sec tak koshish
      }, 300);
      subs.push({ remove: () => clearInterval(timer) });
    }
    return () => { alive = false; subs.forEach((x) => { try { x?.remove?.(); } catch (e) { /* ignore */ } }); };
  }, [uri, player]);

  return ratio;
}

// Video frame ka size uske apne ratio se nikalta hai (width me fit, height maxHeight tak)
function getVideoBox(width, ratio, maxHeight) {
  const r = ratio || 16 / 9;
  let h = Math.round(width / r);
  let w = width;
  if (maxHeight && h > maxHeight) { h = maxHeight; w = Math.round(h * r); }
  return { w, h };
}

// WEB: browser ka apna <video> tag. Browser video ka asli size (videoWidth/videoHeight) khud jaanta hai,
// to video kabhi stretch/zoom nahi hota aur frame ki height asli ratio se hi banti hai.
// Audio-only file (videoWidth === 0) par browser ka alag "pill" player aata hai — usse hata kar
// hum apna video-jaisa control bar dikhate hain (MediaControlBar).
// Video chal raha ho aur user scroll karke use screen se bahar kar de to video khud pause ho jaye.
// Video chal raha ho aur user SCROLL kare => pause. Bina scroll kiye kabhi pause nahi.
// (auto-slide / sidebar / marquee ke scroll se nahi — sirf asli user scroll se: utils/feedScrollBus.js)
function useWebAutoPause(vref) {
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const el = vref.current;
    if (!el) return undefined;
    let unsub = null;
    const stop = () => { if (unsub) { unsub(); unsub = null; } };
    const start = () => {
      stop();
      unsub = subscribeUserScroll(() => el, () => { try { el.pause(); } catch (e) { /* ignore */ } });
    };
    el.addEventListener('play', start);
    el.addEventListener('pause', stop);
    el.addEventListener('ended', stop);
    if (!el.paused) start();
    return () => {
      stop();
      el.removeEventListener('play', start);
      el.removeEventListener('pause', stop);
      el.removeEventListener('ended', stop);
    };
  }, [vref]);
}

function useNativeAutoPause(viewRef, player) {
  useEffect(() => {
    if (Platform.OS === 'web' || !player) return undefined;
    let unsub = null;
    const stop = () => { if (unsub) { unsub(); unsub = null; } };
    const start = () => {
      stop();
      unsub = subscribeUserScroll(() => viewRef.current, () => { try { player.pause(); } catch (e) { /* ignore */ } });
    };
    let sub;
    try {
      sub = player.addListener('playingChange', (e) => {
        const now = typeof e === 'object' ? e?.isPlaying : e;
        if (now) start(); else stop();
      });
    } catch (e) { /* purana expo-video */ }
    try { if (player.playing) start(); } catch (e) { /* ignore */ }
    return () => { stop(); try { sub?.remove?.(); } catch (e) { /* ignore */ } };
  }, [viewRef, player]);
}

// Ad video par news card jaise controls: prev | -5 | play/pause | +15 | next, progress bar, time, speed, fullscreen.
// Chalte time kuch second baad chhup jaate hain, video par tap karne se wapas aate hain.
function AdVideoControls({ player, playing, ended, buffering, onToggle, onFullscreen }) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const poke = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (playingRef.current) timerRef.current = setTimeout(() => setVisible(false), 3500);
  }, []);
  useEffect(() => {
    if (!playing) { if (timerRef.current) clearTimeout(timerRef.current); setVisible(true); } else { poke(); }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, poke]);
  return (
    <>
      <TouchableOpacity activeOpacity={1} onPress={poke} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 3 }} />
      <NewsVideoControls
        player={player}
        visible={visible}
        paused={!playing}
        ended={ended}
        buffering={buffering}
        onTogglePlay={onToggle}
        onFullscreen={onFullscreen}
        onInteract={poke}
        compact
      />
    </>
  );
}

function WebVideoSlide({ uri, width, maxHeight, coverMode, onRatio }) {
  const [ratio, setRatio] = useState(null);
  const [audioOnly, setAudioOnly] = useState(() => isAudioUrl(uri));
  const [st, setSt] = useState({ playing: false, ended: false, cur: 0, dur: 0, muted: false });
  const [waiting, setWaiting] = useState(false);
  const [vel, setVel] = useState(null);
  const vref = useRef(null);
  // stable callback ref (naya function har render par banta to ref baar-baar reset hota)
  const setVideoNode = useCallback((n) => { vref.current = n; setVel(n); }, []);
  useWebAutoPause(vref);

  const sync = (e) => {
    const v = e?.currentTarget || e?.target || vref.current;
    if (!v) return;
    setSt({
      playing: !v.paused && !v.ended,
      ended: !!v.ended,
      cur: v.currentTime || 0,
      dur: Number.isFinite(v.duration) ? v.duration : 0,
      muted: !!v.muted,
    });
  };

  const handleMeta = (e) => {
    const v = e?.currentTarget || e?.target;
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      const r = v.videoWidth / v.videoHeight;
      setRatio(r);
      setAudioOnly(false);
      onRatio?.(uri, r);
    } else if (v) {
      setAudioOnly(true); // video track nahi hai -> audio ad
    }
    sync(e);
  };

  const toggle = () => {
    const v = vref.current;
    if (!v) return;
    if (v.paused || v.ended) { if (v.ended) v.currentTime = 0; v.play?.(); } else v.pause();
  };

  const goFullscreen = () => {
    const v = vref.current;
    if (!v) return;
    try {
      if (v.requestFullscreen) v.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    } catch (err) { /* ignore */ }
  };

  // ✅ Frame hamesha poori width (kaala background) — video apne asli ratio me beech me, crop / stretch nahi.
  const frameH = coverMode ? Math.round(width * 9 / 16) : getVideoBox(width, ratio, maxHeight).h;

  return (
    <View style={{ width, height: frameH, backgroundColor: '#000', overflow: 'hidden' }}>
      {React.createElement('video', {
        key: uri,
        ref: setVideoNode,
        src: uri,
        controls: false,
        playsInline: true,
        preload: 'metadata',
        onLoadedMetadata: handleMeta,
        onPlay: sync,
        onPause: sync,
        onEnded: sync,
        onTimeUpdate: sync,
        onDurationChange: sync,
        onVolumeChange: sync,
        onWaiting: () => setWaiting(true),
        onPlaying: () => setWaiting(false),
        onCanPlay: () => setWaiting(false),
        style: { width: '100%', height: '100%', objectFit: 'contain', display: 'block', backgroundColor: '#000' },
      })}
      {audioOnly ? (
        <>
          <TouchableOpacity activeOpacity={1} onPress={toggle} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 56 }} />
          <MediaControlBar
            playing={st.playing}
            current={st.cur}
            duration={st.dur}
            muted={st.muted}
            onToggle={toggle}
            onSeek={(t) => { if (vref.current) vref.current.currentTime = t; }}
            onMute={() => { if (vref.current) vref.current.muted = !vref.current.muted; }}
          />
        </>
      ) : (
        <AdVideoControls
          player={vel}
          playing={st.playing}
          ended={st.ended}
          buffering={waiting}
          onToggle={toggle}
          onFullscreen={goFullscreen}
        />
      )}
    </View>
  );
}

function NativeVideoSlide({ uri, width, maxHeight, coverMode, onRatio }) {
  const player = useVideoPlayer({ uri }, (p) => { p.loop = false; });
  const ratio = useVideoRatio(uri, player);
  const [audioOnly, setAudioOnly] = useState(() => isAudioUrl(uri));
  const [st, setSt] = useState({ playing: false, cur: 0, dur: 0, muted: false });
  const [np, setNp] = useState({ playing: false, ended: false, loading: false });
  const boxRef = useRef(null);
  const videoViewRef = useRef(null);
  useNativeAutoPause(boxRef, player);

  useEffect(() => { if (ratio) onRatio?.(uri, ratio); }, [ratio, uri, onRatio]);
  useEffect(() => { if (ratio) setAudioOnly(false); }, [ratio]);

  // Source load hone par video track na ho to audio-only maano
  useEffect(() => {
    let sub;
    try {
      sub = player.addListener('sourceLoad', (e) => {
        const tracks = e?.availableVideoTracks;
        if (Array.isArray(tracks) && tracks.length === 0) setAudioOnly(true);
      });
    } catch (e) { /* purana expo-video */ }
    return () => { try { sub?.remove?.(); } catch (e) { /* ignore */ } };
  }, [player]);

  // Play / end / loading state (ad controls ke liye)
  useEffect(() => {
    const subs = [];
    try {
      subs.push(player.addListener('playingChange', (e) => {
        const now = typeof e === 'object' ? Boolean(e?.isPlaying) : Boolean(e);
        setNp((prev) => ({ ...prev, playing: now, ended: now ? false : prev.ended, loading: now ? false : prev.loading }));
      }));
    } catch (e) { /* ignore */ }
    try {
      subs.push(player.addListener('playToEnd', () => setNp((prev) => ({ ...prev, playing: false, ended: true }))));
    } catch (e) { /* ignore */ }
    try {
      subs.push(player.addListener('statusChange', (e) => {
        const status = typeof e === 'object' ? e?.status : e;
        setNp((prev) => ({ ...prev, loading: status === 'loading' }));
      }));
    } catch (e) { /* ignore */ }
    return () => { subs.forEach((x) => { try { x?.remove?.(); } catch (e) { /* ignore */ } }); };
  }, [player]);

  // Audio bar ke liye time/play state (chhota polling — saare expo-video versions par chalta hai)
  useEffect(() => {
    if (!audioOnly) return undefined;
    const read = () => {
      try {
        setSt((prev) => {
          const next = {
            playing: !!player.playing,
            cur: Number(player.currentTime) || 0,
            dur: Number(player.duration) || 0,
            muted: !!player.muted,
          };
          return prev.playing === next.playing && prev.muted === next.muted
            && Math.abs(prev.cur - next.cur) < 0.2 && prev.dur === next.dur ? prev : next;
        });
      } catch (e) { /* ignore */ }
    };
    read();
    const timer = setInterval(read, 250);
    return () => clearInterval(timer);
  }, [audioOnly, player]);

  const toggle = () => {
    try {
      if (player.playing) { player.pause(); return; }
      const dur = Number(player.duration) || 0;
      if (np.ended || (dur > 0 && Number(player.currentTime) >= dur - 0.3)) player.currentTime = 0;
      player.play();
    } catch (e) { /* ignore */ }
  };

  const goFullscreen = () => {
    try { videoViewRef.current?.enterFullscreen?.(); } catch (e) { /* ignore */ }
  };

  const bar = audioOnly ? (
    <>
      <TouchableOpacity activeOpacity={1} onPress={toggle} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 56 }} />
      <MediaControlBar
        playing={st.playing}
        current={st.cur}
        duration={st.dur}
        muted={st.muted}
        onToggle={toggle}
        onSeek={(t) => { try { player.currentTime = t; } catch (e) { /* ignore */ } }}
        onMute={() => { try { player.muted = !player.muted; } catch (e) { /* ignore */ } }}
      />
    </>
  ) : (
    <AdVideoControls
      player={player}
      playing={np.playing}
      ended={np.ended}
      buffering={np.loading}
      onToggle={toggle}
      onFullscreen={goFullscreen}
    />
  );

  const surface = Platform.OS === 'android' ? 'textureView' : undefined;

  // ✅ Frame hamesha poori width (kaala background); video asli ratio me beech me (crop / stretch nahi)
  const frameH = coverMode ? Math.round(width * 9 / 16) : getVideoBox(width, ratio, maxHeight).h;
  return (
    <View ref={boxRef} collapsable={false} style={{ width, height: frameH, backgroundColor: '#000', overflow: 'hidden' }}>
      <VideoView
        ref={videoViewRef}
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls={false}
        fullscreenOptions={{ enable: true }}
        surfaceType={surface}
      />
      {bar}
    </View>
  );
}

function VideoSlide(props) {
  return Platform.OS === 'web' ? <WebVideoSlide {...props} /> : <NativeVideoSlide {...props} />;
}

// images = [url, url...], video = 'url' (optional). Swipe + auto-slide (Android, iOS, web)
export default function MediaGallery({ images = [], video = '', width, maxHeight = 420, onPressImage, radius = 0, fit = 'contain' }) {
  const [page, setPage] = useState(0);
  const [failedUris, setFailedUris] = useState([]);
  const scrollRef = useRef(null);
  const pageRef = useRef(0);
  const touchingRef = useRef(false);
  const [videoRatios, setVideoRatios] = useState({});
  const [imageRatios, setImageRatios] = useState({});
  const handleImageRatio = useCallback((uri, r) => {
    setImageRatios((prev) => (prev[uri] === r ? prev : { ...prev, [uri]: r }));
  }, []);
  const handleVideoRatio = useCallback((uri, r) => {
    setVideoRatios((prev) => (prev[uri] === r ? prev : { ...prev, [uri]: r }));
  }, []);

  const slides = useMemo(() => {
    const list = [];
    const seen = new Set();
    (images || []).forEach((u) => {
      const s = String(u || '').trim();
      // jo image load nahi hui (khali slide) use gallery se hata do
      if (s && !seen.has(s) && !failedUris.includes(s)) { seen.add(s); list.push({ type: 'image', uri: s }); }
    });
    const v = String(video || '').trim();
    if (v) list.push({ type: 'video', uri: v });
    return list;
  }, [images, video, failedUris]);

  const count = slides.length;
  const hasVideoSlide = slides.some((x) => x.type === 'video');
  const coverMode = fit === 'cover';
  // cover mode: frame hamesha 16:9 (video jaisa) — image poora fill karti hai, chhoti nahi dikhti
  // video slide par frame ki height video ke asli ratio se aati hai (koi extra khali jagah nahi)
  const currentSlide = slides[Math.min(page, Math.max(0, slides.length - 1))];
  const frameHeight = coverMode
    ? Math.round((width || 0) * 9 / 16)
    : (currentSlide?.type === 'video'
      ? getVideoBox(width || 0, videoRatios[currentSlide.uri], maxHeight).h
      : (imageRatios[currentSlide?.uri]
        ? Math.min(Math.round((width || 0) / imageRatios[currentSlide.uri]), maxHeight)
        : Math.min(Math.round((width || 0) * 0.6), maxHeight)));
  const slidesKey = slides.map((s) => s.uri).join('|');

  const goTo = useCallback((i) => {
    if (!count || !width) return;
    const n = Math.max(0, Math.min(count - 1, i));
    pageRef.current = n;
    setPage(n);
    scrollRef.current?.scrollTo({ x: n * width, y: 0, animated: true });
  }, [count, width]);

  // Auto-slide: har 4 sec, user swipe kar raha ho to ruk jata hai
  useEffect(() => {
    if (count < 2 || !width) return undefined;
    const timer = setInterval(() => {
      if (touchingRef.current) return;
      goTo((pageRef.current + 1) % count);
    }, 4000);
    return () => clearInterval(timer);
  }, [count, width, goTo]);

  // Reset sirf tab jab images sach me badal jayein (reference badalne se nahi)
  useEffect(() => {
    pageRef.current = 0;
    setPage(0);
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [slidesKey]);

  const syncPage = (e) => {
    if (!width) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== pageRef.current) {
      pageRef.current = next;
      setPage(next);
    }
  };

  if (!count || !width) return null;

  return (
    <View style={{ width }}>
      <View>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => { touchingRef.current = true; }}
          onScrollEndDrag={() => { setTimeout(() => { touchingRef.current = false; }, 2500); }}
          onMomentumScrollEnd={syncPage}
          onScroll={Platform.OS === 'web' ? syncPage : undefined}
          style={{ width, height: frameHeight }}
          contentContainerStyle={{ height: frameHeight }}
          removeClippedSubviews={false}
        >
          {slides.map((s, i) => (
            <View
              key={`${s.type}-${i}`}
              style={[
                { width, alignItems: 'center', justifyContent: 'center' },
                { height: frameHeight },
              ]}
            >
              {s.type === 'video' ? (
                <VideoSlide uri={s.uri} width={width} maxHeight={maxHeight} coverMode={coverMode} onRatio={handleVideoRatio} />
              ) : (
                <TouchableOpacity activeOpacity={0.92} disabled={!onPressImage} onPress={onPressImage}>
                  <AutoFitAdImage
                    uri={s.uri}
                    maxWidth={width}
                    maxHeight={coverMode ? frameHeight : maxHeight}
                    radius={coverMode ? 0 : radius}
                    fill={coverMode}
                    onRatio={handleImageRatio}
                    onError={() => setFailedUris((prev) => (prev.includes(s.uri) ? prev : [...prev, s.uri]))}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        {count > 1 ? (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{page + 1}/{count}</Text>
          </View>
        ) : null}

        {Platform.OS === 'web' && count > 1 ? (
          <>
            {page > 0 ? (
              <TouchableOpacity onPress={() => goTo(page - 1)} style={{ position: 'absolute', left: 6, top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}
            {page < count - 1 ? (
              <TouchableOpacity onPress={() => goTo(page + 1)} style={{ position: 'absolute', right: 6, top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}
      </View>

      {count > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Show image ${i + 1}`}
              onPress={() => goTo(i)}
              hitSlop={8}
              style={{ paddingVertical: 5 }}
            >
              <View style={{ width: i === page ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? '#f97316' : '#cbd5e1' }} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}