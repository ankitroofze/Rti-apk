import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { callback } from 'react-native-nitro-modules';
import { RtmpPublisherView } from 'react-native-nitro-rtmp-publisher';
import LiveStreamingStyles from '../styles/LiveStreamingStyles';

const isExpoGo = Constants.appOwnership === 'expo';

export default function RtmpBroadcaster({
  streamUrl,
  streamKey,
  style,
  isPublishing,
  isMuted = false,
  switchCameraSignal = 0,
  onConnectionSuccess,
  onConnectionFailed,
  onDisconnect,
}) {
  const publisherRef = useRef(null);
  const lastSwitchSignal = useRef(switchCameraSignal);
  const preparedRef = useRef(false);

  const hybridRef = useMemo(
    () => callback((ref) => {
      publisherRef.current = ref;
      if (!ref || preparedRef.current) return;
      preparedRef.current = true;

      const rotation = ref.getCameraOrientation();
      ref.prepareVideo(1280, 720, 30, 2_500_000, 2, rotation);
      ref.prepareAudio(128_000, 44_100, true);
      ref.startPreview('back', 1280, 720);
      ref.setAutoReconnect(5, 3000);

      ref.setOnConnectionEvent((event, message) => {
        if (event === 'connectionSuccess') onConnectionSuccess?.();
        else if (event === 'connectionFailed') onConnectionFailed?.(message);
        else if (event === 'disconnect') onDisconnect?.(message);
      });
    }),
    []
  );

  useEffect(() => {
    if (switchCameraSignal === lastSwitchSignal.current) return;
    lastSwitchSignal.current = switchCameraSignal;
    publisherRef.current?.switchCamera?.();
  }, [switchCameraSignal]);

  useEffect(() => {
    publisherRef.current?.setAudioMuted?.(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!publisherRef.current || !streamUrl || !streamKey) return;
    const fullUrl = streamUrl.endsWith(`/${streamKey}`)
      ? streamUrl
      : `${streamUrl.replace(/\/+$/, '')}/${streamKey}`;

    if (isPublishing) {
      publisherRef.current.startStream(fullUrl);
    } else {
      publisherRef.current.stopStream();
    }
  }, [isPublishing, streamKey, streamUrl]);

  if (isExpoGo || Platform.OS === 'web') {
    return (
      <View style={LiveStreamingStyles.publisherFallback}>
        <Text style={LiveStreamingStyles.publisherFallbackTitle}>Broadcaster unavailable here</Text>
        <Text style={LiveStreamingStyles.playerUnavailableText}>
          {isExpoGo
            ? 'Expo Go supports viewing the live stream, but RTMP publishing needs a native Android build.'
            : 'RTMP publishing needs a native Android build.'}
        </Text>
      </View>
    );
  }

  return (
    <RtmpPublisherView
      style={[LiveStreamingStyles.publisherCamera, style]}
      videoCodec="h264"
      audioCodec="aac"
      aspectRatioMode="adjust"
      audioSource="camcorder"
      streamMode="balanced"
      hybridRef={hybridRef}
    />
  );
}