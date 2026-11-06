// components/DocumentThumb.js
// Document (PDF / Word / Excel / PPT / file) wali post ka proper preview tile.
//  - Image file ho to wahi image dikhti hai.
//  - Baaki documents par: coloured "page" card + extension badge (PDF, DOCX ...) + file ka naam.
// Size parent tile se aata hai (width/height 100%), isliye grid, list aur detail page — sab jagah chalta hai.
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

const FONT = Platform.OS === 'web' ? "'Roboto', sans-serif" : undefined;

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif', 'heic'];
const KINDS = {
  pdf: { color: '#DC2626', bg: '#FEF2F2', label: 'PDF' },
  doc: { color: '#2563EB', bg: '#EFF6FF', label: 'DOC' },
  docx: { color: '#2563EB', bg: '#EFF6FF', label: 'DOCX' },
  xls: { color: '#16A34A', bg: '#F0FDF4', label: 'XLS' },
  xlsx: { color: '#16A34A', bg: '#F0FDF4', label: 'XLSX' },
  csv: { color: '#16A34A', bg: '#F0FDF4', label: 'CSV' },
  ppt: { color: '#EA580C', bg: '#FFF7ED', label: 'PPT' },
  pptx: { color: '#EA580C', bg: '#FFF7ED', label: 'PPTX' },
  txt: { color: '#475569', bg: '#F1F5F9', label: 'TXT' },
};
const DEFAULT_KIND = { color: '#475569', bg: '#F1F5F9', label: 'FILE' };

export function getFileExt(file) {
  const raw = String(file?.name || file?.uri || '').split('?')[0].split('#')[0].toLowerCase();
  const m = raw.match(/\.([a-z0-9]{1,5})$/);
  return m ? m[1] : '';
}

export function isImageFile(file) {
  return IMAGE_EXT.includes(getFileExt(file));
}

export function isPdfFile(file) {
  return getFileExt(file) === 'pdf';
}

// post se file nikalo (mapped item: post.file = { uri, name })
export function getPostFile(post = {}) {
  const f = post.file;
  if (f && typeof f === 'object' && String(f.uri || f.url || '').trim()) {
    return { uri: String(f.uri || f.url).trim(), name: String(f.name || '').trim() };
  }
  if (typeof f === 'string' && f.trim()) return { uri: f.trim(), name: '' };
  return null;
}

function prettyName(file, title) {
  const n = String(file?.name || '').trim();
  if (n) return n;
  try {
    const last = decodeURIComponent(String(file?.uri || '').split('?')[0].split('/').pop() || '');
    if (last) return last;
  } catch (_) { /* ignore */ }
  return String(title || 'Document').trim();
}

export default function DocumentThumb({ file, title = '', showName = true }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!file?.uri) return null;

  if (isImageFile(file) && !imgFailed) {
    return (
      <Image
        source={{ uri: file.uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onError={() => setImgFailed(true)}
      />
    );
  }

  const ext = getFileExt(file);
  const kind = KINDS[ext] || DEFAULT_KIND;
  const label = (KINDS[ext]?.label || (ext ? ext.toUpperCase() : DEFAULT_KIND.label));

  return (
    <View style={[st.wrap, { backgroundColor: kind.bg }]}>
      <View style={st.sheet}>
        <View style={[st.band, { backgroundColor: kind.color }]} />
        <View style={st.lines}>
          <View style={[st.line, { width: '86%' }]} />
          <View style={[st.line, { width: '70%' }]} />
          <View style={[st.line, { width: '78%' }]} />
          <View style={[st.line, { width: '55%' }]} />
        </View>
        <View style={[st.badge, { backgroundColor: kind.color }]}>
          <Text style={st.badgeText}>{label}</Text>
        </View>
      </View>
      {showName ? (
        <Text style={[st.name, { color: kind.color }]} numberOfLines={2}>
          {prettyName(file, title)}
        </Text>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 6 },
  sheet: {
    width: '46%',
    maxWidth: 150,
    aspectRatio: 0.78,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15,23,42,0.18)' },
      default: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 3 },
    }),
  },
  band: { height: '16%', width: '100%' },
  lines: { flex: 1, paddingHorizontal: '10%', paddingTop: '10%', gap: 5 },
  line: { height: 3, borderRadius: 2, backgroundColor: '#e2e8f0' },
  badge: { position: 'absolute', right: 5, bottom: 5, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', ...(FONT ? { fontFamily: FONT } : null) },
  name: { marginTop: 8, fontSize: 10, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6, ...(FONT ? { fontFamily: FONT } : null) },
});