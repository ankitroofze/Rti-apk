import React from 'react';
import { Text, View } from 'react-native';
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

export default function LiveStreamPlayer({ streamUrl, onError, style }) {
  const youtubeEmbedUrl = getYoutubeEmbedUrl(streamUrl);
  const playableStreamUrl = youtubeEmbedUrl ? null : (isLikelyPlayableStream(streamUrl) ? streamUrl : null);
  const player = useVideoPlayer(playableStreamUrl, (instance) => {
    instance.loop = false;
  });

  if (youtubeEmbedUrl) {
    return (
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
    <VideoView
      player={player}
      style={[LiveStreamingStyles.videoPlayer, style]}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enabled: true }}
      onMountError={onError}
    />
  );
}
