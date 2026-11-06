// components/FramedImagePreview.js
// Preview = jo dikhta hai wahi capture hota hai (ViewShot). ref.capture() -> final image ka tmp uri.
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { MAX_IMAGE_SIDE } from '../constants/mediaConfig';

const FramedImagePreview = forwardRef(function FramedImagePreview(
  { imageUrl, frameUrl, onReadyChange }, ref,
) {
  const shotRef = useRef(null);
  const [size, setSize] = useState(null);                 // base image ka asli size
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(!frameUrl);

  useEffect(() => {
    let alive = true;
    setSize(null); setBaseLoaded(false); setFrameLoaded(!frameUrl);
    Image.getSize(
      imageUrl,
      (w, h) => alive && setSize({ w, h }),
      () => alive && setSize({ w: 1080, h: 1080 }),
    );
    return () => { alive = false; };
  }, [imageUrl, frameUrl]);

  const ready = !!size && baseLoaded && frameLoaded;
  useEffect(() => { onReadyChange?.(ready); }, [ready, onReadyChange]);

  // WYSIWYG: container ka aspect ratio = image ka aspect ratio => base image me koi crop nahi,
  // frame (absoluteFill) bhi poore image par baithta hai. Capture ka output size image ke asli
  // size (max MAX_IMAGE_SIDE) par set hai, isliye gallery wali image preview se kam quality ki nahi hoti.
  const options = useMemo(() => {
    if (!size) return { format: 'jpg', quality: 0.95, result: 'tmpfile' };
    const k = Math.min(1, MAX_IMAGE_SIDE / Math.max(size.w, size.h));
    return {
      format: 'jpg', quality: 0.95, result: 'tmpfile',
      width: Math.round(size.w * k), height: Math.round(size.h * k),
    };
  }, [size]);

  useImperativeHandle(ref, () => ({
    isReady: () => ready,
    capture: async () => {
      if (!ready) throw new Error('Image abhi load ho rahi hai');
      return shotRef.current.capture();
    },
  }), [ready]);

  if (!size) return <View style={styles.loading}><ActivityIndicator /></View>;

  return (
    <View style={styles.wrap}>
      <ViewShot ref={shotRef} options={options} style={{ width: '100%', aspectRatio: size.w / size.h }}>
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setBaseLoaded(true)}
          onError={() => setBaseLoaded(true)}
        />
        {frameUrl ? (
          <Image
            source={{ uri: frameUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="stretch"   // transparent PNG poore image par stretch (video flow me FFmpeg bhi stretch karta hai)
            pointerEvents="none"
            onLoad={() => setFrameLoaded(true)}
            onError={() => setFrameLoaded(true)}
          />
        ) : null}
      </ViewShot>
      {!ready ? <ActivityIndicator style={StyleSheet.absoluteFill} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: '#000' },
  loading: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
});

export default FramedImagePreview;