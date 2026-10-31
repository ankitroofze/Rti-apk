import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, Image, Text, StyleSheet } from 'react-native';
import ControlledVideo from './ControlledVideo';
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

  // Android se upload hue video ke URL me extension na ho ya alag ho (.3gp, bina extension) to bhi web par
  // chalna chahiye. Ye function sirf video items ke liye bulaya jaata hai, isliye sirf saaf-saaf image/pdf URL reject karo.
  return /^https?:/i.test(uri) && !/\.(jpe?g|png|gif|webp|bmp|svg|heic|avif|pdf)(\?.*)?(#.*)?$/i.test(uri);
}

export default function VideoPreview({ uri, style, contentFit = 'contain' }) {
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
  if (!playableUri) return null;

  return (
    // ✅ kaala background + contain: video crop / zoom nahi hota, poora dikhta hai
    <View style={{ position: 'relative', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
      {/* News jaisa player: play/pause, progress line + timer; video poora dikhta hai */}
      <ControlledVideo uri={playableUri} style={style} />
      <View pointerEvents="none" style={wm.bar}>
        <Image source={require('../assets/images/logo.jpg')} style={wm.logo} />
        <Text style={wm.text}>RTI NEWS</Text>
      </View>
    </View>
  );
}

const wm = StyleSheet.create({
  bar: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: 4,
  },
  logo: { width: 18, height: 18, borderRadius: 9 },
  text: { color: '#ffffff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});