import React from 'react';
import { Text, View, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import LiveStreamingStyles from '../styles/LiveStreamingStyles';

function isLikelyPlayableStream(streamUrl) {
  return typeof streamUrl === 'string' && /^(https?:|blob:|data:)/i.test(streamUrl);
}

function getYoutubeEmbedUrl(streamUrl) {
  if (typeof streamUrl !== 'string') return null;
  const match = streamUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^?&#/]+)/i);
  return match?.[1]
    ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&playsinline=1&controls=1&fs=1&rel=0&origin=https%3A%2F%2Frtiapi.roofze.in&widget_referrer=https%3A%2F%2Frtiapi.roofze.in`
    : null;
}

// Reusable watermark overlay — VideoPreview.js jaisa hi
function WatermarkOverlay() {
  return (
    <View pointerEvents="none" style={wm.bar}>
      <Image source={require('../assets/images/logo.jpg')} style={wm.logo} />
      <Text style={wm.text}>RTI NEWS</Text>
    </View>
  );
}

export default function LiveStreamPlayer({ streamUrl, onError, style }) {
  const youtubeEmbedUrl = getYoutubeEmbedUrl(streamUrl);
  const playableStreamUrl = youtubeEmbedUrl ? null : (isLikelyPlayableStream(streamUrl) ? streamUrl : null);
  const player = useVideoPlayer(playableStreamUrl, (instance) => {
    instance.loop = false;
  });

  if (youtubeEmbedUrl) {
    return (
      <View style={{ position: 'relative' }}>
        <WebView
          source={{
            uri: youtubeEmbedUrl,
            headers: { Referer: 'https://rtiapi.roofze.in/' },
          }}
          style={[LiveStreamingStyles.videoPlayer, style]}
          javaScriptEnabled
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          onError={onError}
        />
        <WatermarkOverlay />
      </View>
    );
  }

  if (!playableStreamUrl) {
    return (
      <View style={LiveStreamingStyles.playerUnavailable}>
        <Text style={LiveStreamingStyles.playerUnavailableTitle}>No stream selected</Text>
        <Text style={LiveStreamingStyles.playerUnavailableText}>
          Choose a valid live bulletin to begin playback.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <VideoView
        player={player}
        style={[LiveStreamingStyles.videoPlayer, style]}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enabled: true }}
        onMountError={onError}
      />
      <WatermarkOverlay />
    </View>
  );
}

const wm = StyleSheet.create({
  bar: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: 4,
  },
  logo: { width: 18, height: 18, borderRadius: 9 },
  text: { color: '#ffffff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});