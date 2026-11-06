// components/FramedVideoPreview.js
// Video + frame overlay + (alag) music player — sab loop me, output (FFmpeg) jaisa hi.
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { KEEP_ORIGINAL_AUDIO, MUSIC_VOLUME, ORIGINAL_VOLUME } from '../constants/mediaConfig';

export default function FramedVideoPreview({ videoUrl, frameUrl, musicUrl, paused = false }) {
  const musicRef = useRef(null);
  const lastTime = useRef(0);
  const [aspect, setAspect] = useState(null);   // pehle load hone do, phir container ka ratio set

  const onLoad = useCallback(({ naturalSize }) => {
    const { width, height, orientation } = naturalSize || {};
    if (!width || !height) { setAspect(16 / 9); return; }
    // Rotated (iPhone portrait) videos me width/height sensor ke hote hain; orientation se sahi ratio lo.
    // FFmpeg autorotate karta hai, isliye output ka size bhi isi (displayed) ratio ka hota hai.
    const hi = Math.max(width, height);
    const lo = Math.min(width, height);
    if (orientation === 'portrait') setAspect(lo / hi);
    else if (orientation === 'landscape') setAspect(hi / lo);
    else setAspect(width / height);
  }, []);

  // Output me music video ke saath shuru hota hai aur video khatam hote hi kat jata hai (-shortest/-t).
  // Preview me video loop hote hi music bhi 0 se restart -> har loop output jaisa lagta hai.
  const onProgress = useCallback(({ currentTime }) => {
    if (currentTime + 0.5 < lastTime.current) musicRef.current?.seek(0);
    lastTime.current = currentTime;
  }, []);

  return (
    // Container ka aspect ratio = video ka aspect ratio  ->  frame (absoluteFill) FFmpeg overlay=0:0 jaisa hi baithta hai.
    <View style={[styles.box, { aspectRatio: aspect || 16 / 9 }]}>
      <Video
        source={{ uri: videoUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        paused={paused}
        muted={!KEEP_ORIGINAL_AUDIO}        // output me original audio ho/na ho — wahi preview me
        volume={ORIGINAL_VOLUME}
        onLoad={onLoad}
        onProgress={onProgress}
        progressUpdateInterval={250}
      />
      {frameUrl ? (
        <Image
          source={{ uri: frameUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"              // FFmpeg: scale2ref (video size par stretch) + overlay=0:0
          pointerEvents="none"
        />
      ) : null}
      {musicUrl ? (
        <Video
          ref={musicRef}
          source={{ uri: musicUrl }}
          audioOnly
          repeat                             // FFmpeg: -stream_loop -1
          paused={paused}
          volume={MUSIC_VOLUME}              // FFmpeg: volume=MUSIC_VOLUME (same value)
          style={styles.hidden}
        />
      ) : null}
      {!aspect ? <ActivityIndicator style={StyleSheet.absoluteFill} color="#fff" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  hidden: { width: 0, height: 0 },
});