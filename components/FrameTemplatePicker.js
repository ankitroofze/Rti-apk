// components/FrameTemplatePicker.js
// Add News screen: image / video post karte time template chuno (ya "No Template").
// Chune hue template ka live preview (apni photo / video thumbnail + title) neeche dikhta hai.
import React, { useCallback, useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FRAME_TEMPLATES, getFrameTemplate } from '../constants/frameTemplates';
import NewsFrameOverlay, { getFrameBoxAspect, getFrameWindow } from './NewsFrameOverlay';

const THUMB_W = 132;
const THUMB_H = 74;
const THUMB_GAP = 10;
const ARROW_SIZE = 32;

function TemplateThumb({ template, selected, onPress }) {
  const lower = true;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={st.item}>
      <View style={[st.thumb, selected && st.thumbOn]}>
        {template ? (
          <Image
            source={template.asset}
            style={lower ? st.thumbLower : st.thumbFull}
            resizeMode={lower ? 'stretch' : 'contain'}
          />
        ) : (
          <Ionicons name="ban-outline" size={26} color="#9CA3AF" />
        )}
        {selected ? (
          <View style={st.check}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        ) : null}
      </View>
      <Text style={[st.label, selected && st.labelOn]} numberOfLines={1}>
        {template ? template.label : 'No Template'}
      </Text>
    </TouchableOpacity>
  );
}

export default function FrameTemplatePicker({
  value,                 // '' (koi template nahi) ya template id
  onChange,
  previewUri,            // selected photo / video thumbnail
  previewTitle = '',
  previewDescription = '',
}) {
  const [boxW, setBoxW] = useState(0);
  // ── left / right arrow buttons (web + Android + iOS) ──
  const listRef = useRef(null);
  const [listW, setListW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const maxX = Math.max(0, contentW - listW);
  const canLeft = scrollX > 2;
  const canRight = scrollX < maxX - 2;
  const hasOverflow = maxX > 2;
  const scrollByThumbs = useCallback((dir) => {
    const step = (THUMB_W + THUMB_GAP) * 2;
    const target = Math.max(0, Math.min(maxX, scrollX + dir * step));
    try { listRef.current?.scrollTo({ x: target, y: 0, animated: true }); } catch (_) { /* ignore */ }
    setScrollX(target);
  }, [maxX, scrollX]);
  const selected = value ? getFrameTemplate(value) : null;
  const aspect = selected ? getFrameBoxAspect(selected) : 16 / 9;
  const boxH = boxW ? Math.round(boxW / aspect) : 0;
  const win = selected ? getFrameWindow(selected) : null;

  return (
    <View style={st.wrap}>
      <Text style={st.heading}>News Template (optional)</Text>
      <Text style={st.sub}>
        Choose a breaking-news template — the title / description will scroll inside the banner. Your post will appear in the feed with this template.
      </Text>

      <View style={st.listWrap} onLayout={(e) => setListW(Math.round(e.nativeEvent.layout.width))}>
        <ScrollView
          ref={listRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.row}
          scrollEventThrottle={16}
          onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
          onContentSizeChange={(w) => setContentW(Math.round(w))}
        >
          <TemplateThumb template={null} selected={!value} onPress={() => onChange('')} />
          {FRAME_TEMPLATES.map((t) => (
            <TemplateThumb key={t.id} template={t} selected={value === t.id} onPress={() => onChange(t.id)} />
          ))}
        </ScrollView>

        {hasOverflow ? (
          <>
            <TouchableOpacity
              onPress={() => scrollByThumbs(-1)}
              disabled={!canLeft}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              style={[st.arrowBtn, st.arrowLeft, !canLeft && st.arrowDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Previous templates"
            >
              <Ionicons name="chevron-back" size={20} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => scrollByThumbs(1)}
              disabled={!canRight}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              style={[st.arrowBtn, st.arrowRight, !canRight && st.arrowDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Next templates"
            >
              <Ionicons name="chevron-forward" size={20} color="#111827" />
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {selected ? (
        <View style={st.previewWrap}>
          <Text style={st.previewLabel}>Preview</Text>
          <View
            onLayout={(e) => {
              const w = Math.round(e.nativeEvent.layout.width);
              if (w && w !== boxW) setBoxW(w);
            }}
            style={[st.preview, boxH ? { height: boxH } : { aspectRatio: aspect }]}
          >
            {boxW ? (
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: `${win.left * 100}%`,
                    top: `${win.top * 100}%`,
                    width: `${win.width * 100}%`,
                    height: `${win.height * 100}%`,
                    overflow: 'hidden',
                    backgroundColor: '#1F2937',
                  }}
                >
                  {previewUri ? (
                    <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : null}
                </View>
                <NewsFrameOverlay
                  width={boxW}
                  height={boxH}
                  title={previewTitle || 'Your news title appears here'}
                  description={previewDescription || 'Description will scroll here'}
                  templateId={selected.id}
                />
              </>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginTop: 16 },
  heading: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 11.5, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  listWrap: { position: 'relative' },
  row: { paddingTop: 10, paddingBottom: 2, gap: THUMB_GAP },
  arrowBtn: {
    position: 'absolute',
    top: 10 + THUMB_H / 2 - ARROW_SIZE / 2,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 }),
  },
  arrowLeft: { left: 4 },
  arrowRight: { right: 4 },
  arrowDisabled: { opacity: 0.35 },
  item: { width: THUMB_W },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#111827',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOn: { borderColor: '#DC2626' },
  thumbFull: { width: '100%', height: '100%' },
  // lower-third banner thumbnail me niche chipka dikhta hai
  thumbLower: { position: 'absolute', left: 0, right: 0, bottom: 6, width: '100%', height: 24 },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: 5, fontSize: 11.5, color: '#4B5563', textAlign: 'center', fontWeight: '600' },
  labelOn: { color: '#DC2626' },
  previewWrap: { marginTop: 12 },
  previewLabel: { fontSize: 11.5, color: '#6B7280', marginBottom: 6, fontWeight: '600' },
  preview: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    ...(Platform.OS === 'web' ? null : null),
  },
});