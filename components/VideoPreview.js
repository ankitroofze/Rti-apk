import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';

function isLikelyPlayableVideoSource(uri) {
  if (typeof uri !== 'string' || !uri.trim()) {
    return false;
  }

  if (Platform.OS !== 'web') {
    return true;
  }

  if (isIdbMediaUri(uri)) return true;
  if (/^(blob:|data:)/i.test(uri)) return true;

  return /^https?:/i.test(uri) && /\.(mp4|m4v|mov|webm|ogv|m3u8)(\?.*)?$/i.test(uri);
}

export default function VideoPreview({ uri, style, contentFit = 'cover' }) {
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;

    (async () => {
      if (Platform.OS !== 'web') { setResolved(null); return; }
      if (!isIdbMediaUri(uri)) { setResolved(null); return; }
      const next = await resolveIdbMediaUriToObjectUrl(uri);
      // Component pehle hi unmount ho chuka / uri badal chuka —
      // is blob ko turant revoke karo warna wo kabhi track/revoke
      // nahi hoga aur "ghost" blob URL ban ke reh jayega.
      if (!alive) {
        if (next) { try { URL.revokeObjectURL(next); } catch {} }
        return;
      }
      objectUrl = next;
      setResolved(next);
    })();

    return () => {
      alive = false;
      try { if (objectUrl) URL.revokeObjectURL(objectUrl); } catch {}
    };
  }, [uri]);

  const finalUri = useMemo(() => {
    if (Platform.OS === 'web' && isIdbMediaUri(uri)) return resolved;
    return uri;
  }, [resolved, uri]);

  const playableUri = isLikelyPlayableVideoSource(finalUri) ? finalUri : null;
  const player = useVideoPlayer(playableUri, (p) => {
    p.loop = false;
  });

  if (!playableUri) return null;

  return (
    <View>
      <VideoView
        player={player}
        style={style}
        contentFit={contentFit}
        fullscreenOptions={{ enabled: true }}
      />
    </View>
  );
}