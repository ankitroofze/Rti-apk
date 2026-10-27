import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

export default function AutoFitAdImage({ uri, maxWidth, maxHeight, radius = 0, style, onError, fill = false, onRatio }) {
  const [ratio, setRatio] = useState(null);

  // Android pe onLoad ka nativeEvent.source kabhi-kabhi nahi aata -> getSize se ratio lo
  useEffect(() => {
    let alive = true;
    setRatio(null);
    if (!uri) return undefined;
    Image.getSize(
      uri,
      (w, h) => { if (alive && w && h) setRatio(w / h); },
      () => {},
    );
    return () => { alive = false; };
  }, [uri]);

  useEffect(() => { if (ratio && onRatio) onRatio(uri, ratio); }, [ratio, uri, onRatio]);

  if (!uri) return null;

  // fill=true: image poore frame (maxWidth x maxHeight) ko cover kare — koi khali side nahi
  if (fill) {
    return (
      <Image
        source={{ uri }}
        onError={onError}
        style={[{ width: maxWidth, height: maxHeight, borderRadius: radius }, style]}
        resizeMode="cover"
        fadeDuration={0}
        resizeMethod="resize"
      />
    );
  }

  let width = maxWidth;
  let height = ratio ? maxWidth / ratio : Math.min(maxWidth * 0.6, maxHeight);
  if (ratio && height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return (
    <View style={{ width: maxWidth, alignItems: 'center' }}>
      <Image
        source={{ uri }}
        onError={onError}
        onLoad={(e) => {
          const { width: w, height: h } = e.nativeEvent.source || {};
          if (w && h && !ratio) setRatio(w / h);
        }}
        style={[{ width, height, borderRadius: radius }, style]}
        resizeMode="contain"
        fadeDuration={0}
        resizeMethod="resize"
      />
    </View>
  );
}