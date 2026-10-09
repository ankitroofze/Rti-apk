import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SvgXml } from 'react-native-svg';

const MAX_QR_CHARS = 1200; // isse lamba text scan hone layak QR nahi banta

const classify = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return { kind: 'none' };
  if (/^data:image\//i.test(v)) return { kind: 'image', uri: v };
  if (/^<svg[\s>]|^<\?xml/i.test(v)) return { kind: 'svg', xml: v };
  if (/^(iVBOR|\/9j\/|R0lGOD)[A-Za-z0-9+/=]{100,}$/.test(v)) {
    const mime = v.startsWith('iVBOR') ? 'png' : v.startsWith('/9j/') ? 'jpeg' : 'gif';
    return { kind: 'image', uri: `data:image/${mime};base64,${v}` };
  }
  if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(v)) return { kind: 'image', uri: v };
  return { kind: 'text', value: v };
};

export default function IdCardQr({ payload, fallbackValue = '', size = 70 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const info = classify(payload);

  if (info.kind === 'image' && !imgFailed) {
    return (
      <Image
        source={{ uri: info.uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setImgFailed(true)}
      />
    );
  }

  if (info.kind === 'svg') {
    return <SvgXml xml={info.xml} width={size} height={size} />;
  }

  let value = info.kind === 'text' ? info.value : '';
  if (useFallback || !value || value.length > MAX_QR_CHARS) value = fallbackValue || value;

  if (!value) {
    return <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>QR{'\n'}unavailable</Text>;
  }

  return (
    <View style={{ width: size, height: size }}>
      <QRCode
        value={value}
        size={size}
        ecl="L"
        quietZone={0}
        backgroundColor="#ffffff"
        color="#000000"
        onError={(e) => {
          console.warn('[IdCardQr] QR generate error', e?.message || e);
          if (fallbackValue && value !== fallbackValue) setUseFallback(true);
        }}
      />
    </View>
  );
}