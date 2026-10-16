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
function NativeVideoFrame({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    try { p.muted = true; p.loop = false; p.pause(); } catch {}
    try { p.currentTime = 0.1; } catch {}
  });
  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
      surfaceType="textureView"
      pointerEvents="none"
    />
  );
}

// Web: plain <video> tag, #t=0.1 makes the browser paint the first frame
function WebVideoFrame({ uri }) {
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
    style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', background: '#0f172a' },
  });
}

export default function PostGridThumb({ imageUri, videoUri, fallback = null }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => { setImageFailed(false); }, [imageUri]);

  if (imageUri && !imageFailed) {
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
    return (
      <View style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        {Platform.OS === 'web' ? <WebVideoFrame uri={videoUri} /> : <NativeVideoFrame uri={videoUri} />}
        {/* dark icon behind the frame if the video cannot load */}
        <View pointerEvents="none" style={{ position: 'absolute', zIndex: -1 }}>
          <Feather name="video" size={22} color="#64748b" />
        </View>
      </View>
    );
  }

  return fallback;
}