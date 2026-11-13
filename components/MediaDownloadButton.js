// components/MediaDownloadButton.js
// Chhota gol "download" button — ads / news ki image ya video ke upar lagta hai.
// Parent ko position dena hai (absolute top/right). Tap par file download hoti hai.
//  - Video  : frame + music (web) / music (native) ke saath merge hokar.
//  - Image  : frame (banner + title) ke saath. Web = canvas, Native = offscreen view + view-shot capture.
// Message existing popup (ToastProvider.showPopup) me dikhta hai.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { downloadMedia } from '../utils/downloadMedia';
import FramedExportView from './FramedExportView';
import { useToast } from './ui/ToastProvider';

export function MediaDownloadButton({ uri, type = 'image', size = 34, style, musicUrl = '', musicVolume = 0.6, muteOriginal = false, voiceUri = null, frame = null }) {
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState(null);              // native image + frame: { uri, frame }
  const captureRefView = useRef(null);
  const doneRef = useRef(false);
  const { showPopup } = useToast();
  const notify = useCallback((message) => { if (message) showPopup(message, 'info', { title: 'Download' }); }, [showPopup]);

  const finish = useCallback((res) => {
    setBusy(false);
    setJob(null);
    if (!res?.ok) notify(res?.message || 'Download failed.');
    else if (res.message) notify(res.message);
  }, [notify]);

  const rawImageFallback = useCallback(async (why) => {
    const res = await downloadMedia(uri, { type: 'image' });
    finish({ ...res, message: [res.message, why].filter(Boolean).join(' ') });
  }, [uri, finish]);

  // offscreen frame view ready => capture => gallery
  const onFrameImageLoaded = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      await new Promise((r) => setTimeout(r, 200));   // layout settle
      const out = await captureRef(captureRefView, { format: 'jpg', quality: 0.92, result: 'tmpfile', width: 1280, height: 720 });
      const res = await downloadMedia(out, { type: 'image' });
      finish(res);
    } catch (_) {
      await rawImageFallback('Could not apply frame. Original image was saved.');
    }
  }, [finish, rawImageFallback]);

  // safety: image load na ho to spinner atke nahi — 20s baad original image
  useEffect(() => {
    if (!job) return undefined;
    const t = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      rawImageFallback('');
    }, 20000);
    return () => clearTimeout(t);
  }, [job, rawImageFallback]);

  const onPress = useCallback(async (e) => {
    try { e?.stopPropagation?.(); } catch (_) { /* ignore */ }
    if (busy || !uri) return;
    setBusy(true);
    if ((type === 'video' && (frame || musicUrl || voiceUri)) || (type === 'image' && frame)) {
      notify('Preparing download with frame & sound…');
    }
    if (type === 'image' && frame && Platform.OS !== 'web' && /^(https?:|file:|content:)/i.test(String(uri))) {
      doneRef.current = false;
      setJob({ uri: String(uri), frame });             // FramedExportView render -> onLoad me capture
      return;
    }
    const res = await downloadMedia(uri, { type, musicUrl, musicVolume, muteOriginal, voiceUri, frame });   // video: frame + music merge, image(web): frame canvas
    finish(res);
  }, [busy, uri, type, musicUrl, musicVolume, muteOriginal, voiceUri, frame, finish]);

  if (!uri) return null;

  return (
    <>
      {job ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: -5000, top: 0 }}>
          <FramedExportView
            ref={captureRefView}
            imageUri={job.uri}
            frame={job.frame}
            onImageLoad={onFrameImageLoaded}
            onImageError={() => { if (!doneRef.current) { doneRef.current = true; rawImageFallback(''); } }}
          />
        </View>
      ) : null}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={type === 'video' ? 'Download video' : 'Download image'}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="download-outline" size={Math.round(size * 0.58)} color="#ffffff" />
        )}
      </TouchableOpacity>
    </>
  );
}

export default MediaDownloadButton;