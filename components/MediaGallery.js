import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import AutoFitAdImage from './AutoFitAdImage';

function VideoSlide({ uri, width }) {
  const player = useVideoPlayer({ uri }, (p) => { p.loop = false; });
  return (
    <View style={{ width, height: Math.round(width * 9 / 16), backgroundColor: '#000' }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls />
    </View>
  );
}

// images = [url, url...], video = 'url' (optional). Swipe + auto-slide (Android, iOS, web)
export default function MediaGallery({ images = [], video = '', width, maxHeight = 420, onPressImage, radius = 0, fit = 'contain' }) {
  const [page, setPage] = useState(0);
  const [failedUris, setFailedUris] = useState([]);
  const scrollRef = useRef(null);
  const pageRef = useRef(0);
  const touchingRef = useRef(false);

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
  const frameHeight = coverMode
    ? Math.round((width || 0) * 9 / 16)
    : (hasVideoSlide ? Math.max(maxHeight, Math.round((width || 0) * 9 / 16)) : maxHeight);
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
                <VideoSlide uri={s.uri} width={width} />
              ) : (
                <TouchableOpacity activeOpacity={0.92} disabled={!onPressImage} onPress={onPressImage}>
                  <AutoFitAdImage
                    uri={s.uri}
                    maxWidth={width}
                    maxHeight={coverMode ? frameHeight : maxHeight}
                    radius={coverMode ? 0 : radius}
                    fill={coverMode}
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