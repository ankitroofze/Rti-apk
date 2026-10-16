import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import AutoFitAdImage from './AutoFitAdImage';

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
function WebVideoSlide({ uri, width, maxHeight, coverMode, onRatio }) {
  const [ratio, setRatio] = useState(null);
  const handleMeta = (e) => {
    const v = e?.currentTarget || e?.target;
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      const r = v.videoWidth / v.videoHeight;
      setRatio(r);
      onRatio?.(uri, r);
    }
  };

  const { w, h } = coverMode
    ? { w: width, h: Math.round(width * 9 / 16) }
    : getVideoBox(width, ratio, maxHeight);

  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      {React.createElement('video', {
        key: uri,
        src: uri,
        controls: true,
        playsInline: true,
        preload: 'metadata',
        onLoadedMetadata: handleMeta,
        style: { width: '100%', height: '100%', objectFit: 'contain', display: 'block', backgroundColor: '#000' },
      })}
    </View>
  );
}

function NativeVideoSlide({ uri, width, maxHeight, coverMode, onRatio }) {
  const player = useVideoPlayer({ uri }, (p) => { p.loop = false; });
  const ratio = useVideoRatio(uri, player);

  useEffect(() => { if (ratio) onRatio?.(uri, ratio); }, [ratio, uri, onRatio]);

  // cover mode (purana behaviour): fixed 16:9 frame
  if (coverMode) {
    return (
      <View style={{ width, height: Math.round(width * 9 / 16), backgroundColor: '#000' }}>
        <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls surfaceType={Platform.OS === 'android' ? 'textureView' : undefined} />
      </View>
    );
  }

  const { w, h } = getVideoBox(width, ratio, maxHeight);
  return (
    <View style={{ width: w, height: h, backgroundColor: '#000', overflow: 'hidden' }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls surfaceType={Platform.OS === 'android' ? 'textureView' : undefined} />
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