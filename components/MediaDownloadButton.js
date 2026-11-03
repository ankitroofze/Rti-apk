// components/MediaDownloadButton.js
// Chhota gol "download" button — ads / news ki image ya video ke upar lagta hai.
// Parent ko position dena hai (absolute top/right). Tap par file download hoti hai.
// (Self-contained: koi ToastProvider / context ki zaroorat nahi.)
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadMedia } from '../utils/downloadMedia';

function notify(message) {
  if (!message) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(message);
  else Alert.alert('Download', message);
}

export function MediaDownloadButton({ uri, type = 'image', size = 34, style }) {
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(async (e) => {
    try { e?.stopPropagation?.(); } catch (_) { /* ignore */ }
    if (busy || !uri) return;
    setBusy(true);
    const res = await downloadMedia(uri, { type });
    setBusy(false);
    if (!res.ok) notify(res.message || 'Download failed.');
    else if (res.message) notify(res.message);
  }, [busy, uri, type]);

  if (!uri) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={type === 'video' ? 'Download video' : 'Download image'}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Ionicons name="download-outline" size={Math.round(size * 0.58)} color="#ffffff" />
      )}
    </TouchableOpacity>
  );
}

export default MediaDownloadButton;