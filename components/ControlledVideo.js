// components/ControlledVideo.js
// Kisi bhi jagah (ad preview, create-news preview, etc.) video dikhane ke liye ek hi jaisa player:
//   - beech me play/pause, -5 / +15, progress line, timer (00:12 · 01:29), speed, fullscreen
//   - video poora dikhta hai (crop / stretch nahi) — web par browser ka <video> + objectFit: contain
//     aur Android/iOS par video ke asli ratio wala box, isliye har laptop / phone par same dikhta hai.
// Ye MediaGallery ke video slide ko hi use karta hai — wahi player jo news card me chalta hai.
import React, { useState } from 'react';
import { View } from 'react-native';
import MediaGallery from './MediaGallery';

export default function ControlledVideo({ uri, style, maxHeight = 420 }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  if (!uri) return null;
  const limitH = box.h > 0 ? Math.min(box.h, maxHeight) : maxHeight;
  return (
    <View
      style={[{ width: '100%', backgroundColor: '#000', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        const h = Math.round(e.nativeEvent.layout.height);
        if (w !== box.w || h !== box.h) setBox({ w, h });
      }}
    >
      {box.w > 0 ? (
        <MediaGallery key={uri} images={[]} video={uri} width={box.w} maxHeight={limitH} />
      ) : null}
    </View>
  );
}