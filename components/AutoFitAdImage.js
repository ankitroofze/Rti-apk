import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

// Image ko uske asli ratio me, maxWidth x maxHeight box ke andar fit karta hai.
// Na crop hota hai, na khali jagah bachti hai.
export default function AutoFitAdImage({ uri, maxWidth, maxHeight, radius = 0, style }) {
  const [ratio, setRatio] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!uri) return undefined;
    Image.getSize(
      uri,
      (w, h) => { if (alive && w && h) setRatio(w / h); },
      () => { if (alive) setRatio(1); }
    );
    return () => { alive = false; };
  }, [uri]);

  if (!ratio) return <View style={{ width: maxWidth, height: maxWidth * 0.5 }} />;

  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return (
    <Image
      source={{ uri }}
      style={[{ width, height, borderRadius: radius }, style]}
      resizeMode="contain"
    />
  );
}