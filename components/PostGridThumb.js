import React, { useEffect, useState } from 'react';
import { Image, Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';

/**
 * Grid tile content for "My Posts".
 *  - imageUri  : real image / thumbnail (shown first)
 *  - videoUri  : video url (first frame is shown when there is no image,
 *                or when the image fails to load)
 *  - fallback  : React node shown when nothing can be displayed
 */

// Native (Android / iOS): paused expo-video, shows first frame
function NativeVideoFrame({ uri, fit = 'cover' }) {
  const player = useVideoPlayer(uri, (p) => {
    try { p.muted = true; p.loop = false; p.pause(); } catch {}
    try { p.currentTime = 0.1; } catch {}
  });
  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit={fit}
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
      surfaceType="textureView"
      pointerEvents="none"
    />
  );
}

// Web: plain <video> tag, #t=0.1 makes the browser paint the first frame
function WebVideoFrame({ uri, fit = 'cover' }) {
  const [src, setSrc] = useState(isIdbMediaUri(uri) ? null : uri);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;
    if (!isIdbMediaUri(uri)) { setSrc(uri); return undefined; }
    (async () => {
      const next = await resolveIdbMediaUriToObjectUrl(uri);
      if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
      objectUrl = next;
      setSrc(next);
    })();
    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [uri]);

  if (!src) return null;
  const withFrame = /^(blob:|data:)/i.test(src) || src.includes('#') ? src : `${src}#t=0.1`;
  return React.createElement('video', {
    src: withFrame,
    muted: true,
    playsInline: true,
    preload: 'metadata',
    style: { width: '100%', height: '100%', objectFit: fit, display: 'block', pointerEvents: 'none', background: '#0f172a' },
  });
}

// natural=true  -> list/feed card: poori image dikhe (crop nahi), apne asli ratio me
// natural=false -> grid tile: parent box bhar kar (cover) dikhe
export default function PostGridThumb({ imageUri, videoUri, fallback = null, natural = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [ratio, setRatio] = useState(null);

  useEffect(() => { setImageFailed(false); setRatio(null); }, [imageUri]);

  // natural mode: image ka asli width/height ratio nikalo
  useEffect(() => {
    if (!natural || !imageUri) return undefined;
    let alive = true;
    try {
      Image.getSize(
        imageUri,
        (w, h) => { if (alive && w > 0 && h > 0) setRatio(w / h); },
        () => { /* ratio na mile to 16:9 */ }
      );
    } catch (_) { /* ignore */ }
    return () => { alive = false; };
  }, [natural, imageUri]);

  if (imageUri && !imageFailed) {
    if (natural) {
      // bahut lambi / chaudi image par box control me rahe (0.75 se 2:1), image phir bhi poori dikhti hai (contain)
      const r = Math.min(2, Math.max(0.75, ratio || 16 / 9));
      return (
        <View style={{ width: '100%', aspectRatio: r, backgroundColor: '#0f172a' }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        </View>
      );
    }
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (videoUri) {
    const fit = natural ? 'contain' : 'cover';
    return (
      <View style={[{ width: '100%', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }, natural ? { aspectRatio: 16 / 9 } : { height: '100%' }]}>
        {Platform.OS === 'web' ? <WebVideoFrame uri={videoUri} fit={fit} /> : <NativeVideoFrame uri={videoUri} fit={fit} />}
        {/* dark icon behind the frame if the video cannot load */}
        <View pointerEvents="none" style={{ position: 'absolute', zIndex: -1 }}>
          <Feather name="video" size={22} color="#64748b" />
        </View>
      </View>
    );
  }

  return fallback;
}