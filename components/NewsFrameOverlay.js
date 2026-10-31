// components/NewsFrameOverlay.js
// Breaking-news templates jo photo / video ke upar lagte hain.
// Media poore box me, neeche banner; title / description banner ke andar scroll hota hai.
// Templates ki list / positions: constants/frameTemplates.js
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { DEFAULT_FRAME_ID, getFrameTemplate } from '../constants/frameTemplates';

const FONT =
  Platform.OS === 'web'
    ? { fontFamily: "'Roboto', sans-serif", fontWeight: '800' }
    : { fontFamily: 'Roboto_700Bold' }; // native par custom font ke saath fontWeight mat do

// Template ke hisaab se media box ka ratio (feed card height nikalne ke liye)
export function getFrameBoxAspect() {
  return 16 / 9;
}

// Photo / video ki window (box ke fraction me)
export function getFrameWindow() {
  return { left: 0, top: 0, width: 1, height: 1 };
}

// Lower-third banner ki height (controls ko banner ke upar rakhne ke liye)
export function getLowerBannerHeight(template, width) {
  if (template?.kind !== 'lower' || !width) return 0;
  return Math.round(width / template.aspect);
}

// ── Seamless horizontal marquee ────────────────────────────────────────────
// Text pehle right edge se andar aata hai, phir bina jhatke loop me chalta rehta hai.
function Marquee({ text, width, height, speed = 40, textStyle, sepColor = '#FBBF24' }) {
  const [unitW, setUnitW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (!unitW || !width) return undefined;
    let loop = null;
    x.setValue(width); // right edge se start
    const intro = Animated.timing(x, {
      toValue: -unitW,
      duration: ((width + unitW) / speed) * 1000,
      easing: Easing.linear,
      useNativeDriver: native,
    });
    intro.start(({ finished }) => {
      if (!finished) return;
      x.setValue(0);
      loop = Animated.loop(
        Animated.timing(x, {
          toValue: -unitW,
          duration: Math.max(800, (unitW / speed) * 1000),
          easing: Easing.linear,
          useNativeDriver: native,
        })
      );
      loop.start();
    });
    return () => {
      intro.stop();
      if (loop) loop.stop();
    };
  }, [unitW, width, speed, x, native, clean]);

  if (!clean) return null;

  // Ek "unit" = text + separator. Itni copies jo band ko poora bhar de, taaki gap na dikhe.
  const reps = unitW && width ? Math.max(2, Math.ceil(width / unitW) + 1) : 1;

  return (
    <View style={{ width, height, overflow: 'hidden', justifyContent: 'center' }}>
      <Animated.View style={[st.row, { height, transform: [{ translateX: x }] }]}>
        {Array.from({ length: reps }).map((_, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={[st.unit, textStyle]}
            onLayout={
              i === 0
                ? (e) => {
                    const w = Math.round(e.nativeEvent.layout.width);
                    if (w && w !== unitW) setUnitW(w);
                  }
                : undefined
            }
          >
            {clean}
            <Text style={{ color: sepColor }}>{'   ◆   '}</Text>
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

// ── Lower-third templates (Glossy / Red Bar / White+Blue ...) ───────────────
function LowerThirdOverlay({ template, width, height, title, description }) {
  const bannerH = Math.round(width / template.aspect);
  const top = height - bannerH;
  const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const cleanDesc = String(description || '').replace(/\s+/g, ' ').trim();

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 6, elevation: 6 }]}>
      <Image
        source={template.asset}
        style={{ position: 'absolute', left: 0, top, width, height: bannerH }}
        resizeMode="stretch"
      />
      {(template.bands || []).map((b, i) => {
        let text = '';
        if (b.source === 'title') text = cleanTitle;
        else if (b.source === 'description') text = cleanDesc || b.fallback || '';
        else text = [cleanTitle, cleanDesc].filter(Boolean).join('   |   ');
        const bw = Math.round(width * (b.right - b.left));
        const bh = Math.round(bannerH * b.height);
        return (
          <View
            key={i}
            style={{ position: 'absolute', left: width * b.left, top: top + bannerH * b.top }}
          >
            <Marquee
              text={b.source === 'title' ? text.toUpperCase() : text}
              width={bw}
              height={bh}
              speed={b.speed || 40}
              sepColor={b.sep}
              textStyle={[
                FONT,
                {
                  fontSize: Math.max(10, Math.round(bh * 0.62)),
                  lineHeight: bh,
                  color: b.color || '#fff',
                  letterSpacing: 0.4,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function NewsFrameOverlay({
  width,
  height,
  title = '',
  description = '',
  templateId = DEFAULT_FRAME_ID,
}) {
  if (!width || !height) return null;
  const template = getFrameTemplate(templateId);
  return <LowerThirdOverlay template={template} width={width} height={height} title={title} description={description} />;
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 20000, // text ko parent width me wrap / shrink hone se rokta hai
  },
  unit: {
    flexShrink: 0,
    includeFontPadding: false,
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : null),
  },
});