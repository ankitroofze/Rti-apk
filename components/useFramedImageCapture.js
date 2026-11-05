// components/useFramedImageCapture.js
// NATIVE: image + frame (banner + title/description) ko offscreen render karke JPG file (local uri) banata hai.
// Use:  const { capture, host } = useFramedImageCapture();   ...  {host}   (JSX me kahin bhi)
//       const localUri = await capture(imageUrl, frameOpts);  // web par / fail hone par null
import React, { useCallback, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import FramedExportView from './FramedExportView';

export default function useFramedImageCapture() {
  const viewRef = useRef(null);
  const pending = useRef(null);
  const [job, setJob] = useState(null);

  const finish = useCallback((value) => {
    const p = pending.current;
    pending.current = null;
    setJob(null);
    if (p) p.resolve(value);
  }, []);

  const capture = useCallback((uri, frame) => new Promise((resolve) => {
    if (Platform.OS === 'web' || !uri || !frame) { resolve(null); return; }
    pending.current = { resolve };
    setJob({ uri: String(uri), frame });
    setTimeout(() => { if (pending.current && pending.current.resolve === resolve) finish(null); }, 15000);   // image load na ho to atke nahi
  }), [finish]);

  const onLoad = useCallback(async () => {
    if (!pending.current) return;
    try {
      await new Promise((r) => setTimeout(r, 200));   // layout settle
      const out = await captureRef(viewRef, { format: 'jpg', quality: 0.92, result: 'tmpfile', width: 1280, height: 720 });
      finish(out);
    } catch (_) {
      finish(null);
    }
  }, [finish]);

  const host = job ? (
    <View pointerEvents="none" style={{ position: 'absolute', left: -5000, top: 0 }}>
      <FramedExportView ref={viewRef} imageUri={job.uri} frame={job.frame} onImageLoad={onLoad} onImageError={() => finish(null)} />
    </View>
  ) : null;

  return { capture, host };
}