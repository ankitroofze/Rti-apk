import React, { useEffect, useRef } from 'react';
import { Platform, Text, UIManager, View } from 'react-native';
import Constants from 'expo-constants';
import LiveStreamingStyles from '../styles/LiveStreamingStyles';

let RtmpPublisher = null;

try {
  const publisherModule = require('react-native-rtmp-publisher');
  RtmpPublisher = publisherModule.default || publisherModule;
} catch {
  RtmpPublisher = null;
}

const isExpoGo = Constants.appOwnership === 'expo';
const hasNativePublisher =
  Platform.OS !== 'web' &&
  (
    UIManager.getViewManagerConfig?.('RTMPPublisher') ||
    UIManager.getViewManagerConfig?.('NodeCameraView')
  );

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

  useEffect(() => {
    let cancelled = false;

    const verifyPreview = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!cancelled && publisherRef.current?.isCameraOnPreview) {
          const previewActive = await publisherRef.current.isCameraOnPreview();
          if (!previewActive) {
            console.warn('RTMP camera preview did not start; check Android logcat for RTMPPreview.');
          }
        }
      } catch (error) {
        console.warn('Unable to verify RTMP camera preview.', error);
      }
    };

    verifyPreview();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (switchCameraSignal === lastSwitchSignal.current) return;
    lastSwitchSignal.current = switchCameraSignal;
    publisherRef.current?.switchCamera?.().catch(() => {});
  }, [switchCameraSignal]);

  useEffect(() => {
    const method = isMuted ? 'mute' : 'unmute';
    publisherRef.current?.[method]?.().catch(() => {
      console.warn(`Unable to ${method} RTMP microphone.`);
    });
  }, [isMuted]);

  useEffect(() => {
    if (!publisherRef.current || !streamUrl || !streamKey) return undefined;

    if (isPublishing) {
      publisherRef.current.startStream().catch(() => {
        console.warn('Unable to start RTMP publishing.');
      });
    } else {
      publisherRef.current.stopStream().catch(() => {});
    }

    return undefined;
  }, [isPublishing, streamKey, streamUrl]);

  if (isExpoGo || !RtmpPublisher || !hasNativePublisher) {
    return (
      <View style={LiveStreamingStyles.publisherFallback}>
        <Text style={LiveStreamingStyles.publisherFallbackTitle}>Broadcaster unavailable here</Text>
        <Text style={LiveStreamingStyles.playerUnavailableText}>
          {isExpoGo
            ? 'Expo Go supports viewing the live stream, but RTMP publishing needs a native Android build.'
            : 'RTMP publisher native module is not present in this app build yet. Rebuild the Android app to enable broadcasting.'}
        </Text>
      </View>
    );
  }

  return (
    <RtmpPublisher
      ref={publisherRef}
      style={[LiveStreamingStyles.publisherCamera, style]}
      streamURL={streamUrl}
      streamName={streamKey}
      onConnectionSuccess={onConnectionSuccess}
      onConnectionFailed={onConnectionFailed}
      onDisconnect={onDisconnect}
    />
  );
}
