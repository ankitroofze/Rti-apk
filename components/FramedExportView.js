// components/FramedExportView.js
// NATIVE: image + frame (banner + title/description) ka offscreen view. react-native-view-shot se capture
// hokar download / share ke liye ek hi JPG banta hai. Marquee yahan static hota hai (capture me scroll nahi hota).
import React, { forwardRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { getFrameTemplate } from '../constants/frameTemplates';

export const EXPORT_W = 640;   // logical px — capture 2x => 1280 x 720
export const EXPORT_H = 360;

const squash = (t) => String(t || '').replace(/\s+/g, ' ').trim();
const FONT = Platform.OS === 'web'
  ? { fontFamily: "'Roboto', sans-serif", fontWeight: '800' }
  : { fontFamily: 'Roboto_700Bold' };

const FramedExportView = forwardRef(function FramedExportView({ imageUri, frame = null, onImageLoad, onImageError }, ref) {
  const tpl = frame ? getFrameTemplate(frame.templateId) : null;
  const bannerH = tpl ? Math.round(EXPORT_W / tpl.aspect) : 0;
  const title = squash(frame?.title);
  const desc = squash(frame?.description);

  return (
    <View ref={ref} collapsable={false} style={st.box}>
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="contain" onLoad={onImageLoad} onError={onImageError} />
      {tpl ? (
        <>
          <Image source={tpl.asset} style={{ position: 'absolute', left: 0, top: EXPORT_H - bannerH, width: EXPORT_W, height: bannerH }} resizeMode="stretch" />
          {(tpl.bands || []).map((b, i) => {
            let text = '';
            if (b.source === 'title') text = title.toUpperCase();
            else if (b.source === 'description') text = desc || b.fallback || '';
            else text = [title, desc].filter(Boolean).join('   |   ');
            if (!text) return null;
            const bw = Math.round(EXPORT_W * (b.right - b.left));
            const bh = Math.round(bannerH * b.height);
            return (
              <View key={i} style={{ position: 'absolute', left: EXPORT_W * b.left, top: EXPORT_H - bannerH + bannerH * b.top, width: bw, height: bh, overflow: 'hidden', justifyContent: 'center' }}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={[FONT, { fontSize: Math.max(10, Math.round(bh * 0.62)), lineHeight: bh, color: b.color || '#fff', letterSpacing: 0.4, includeFontPadding: false }]}>
                  {text}
                </Text>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
});

export default FramedExportView;

const st = StyleSheet.create({
  box: { width: EXPORT_W, height: EXPORT_H, backgroundColor: '#0f172a', overflow: 'hidden' },
});