import React, { useState } from 'react';
import { View } from 'react-native';

export default function ScaledCard({ width = 170, naturalWidth = 360, children, style }) {
  const [naturalHeight, setNaturalHeight] = useState(null);
  const scale = width / naturalWidth;

  // ✅ `transformOrigin: 'top left'` Android pe reliably kaam nahi karta —
  // isliye manually translate karke top-left se scale karte hain. Ye
  // Android + iOS + web teeno pe same tarah kaam karta hai.
  const translateX = -(naturalWidth * (1 - scale)) / 2;
  const translateY = naturalHeight ? -(naturalHeight * (1 - scale)) / 2 : 0;

  return (
    <View style={[{ width, height: naturalHeight ? naturalHeight * scale : undefined, overflow: 'hidden' }, style]}>
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && Math.abs(h - (naturalHeight || 0)) > 1) setNaturalHeight(h);
        }}
        style={{
          width: naturalWidth,
          transform: [
            { translateY },
            { translateX },
            { scale },
          ],
        }}
      >
        {children}
      </View>
    </View>
  );
}