import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import LiveStreamingStyles from '../styles/LiveStreamingStyles';

// Web fallback for RtmpBroadcaster.
// react-native-nitro-modules / react-native-nitro-rtmp-publisher are native-only
// (JSI/TurboModules) and cannot run on web, so this file (picked up automatically
// by Metro for web builds via the .web.js extension) renders a simple message
// instead of crashing the app.
export default function RtmpBroadcaster({
  style,
  isPublishing,
  onConnectionFailed,
}) {
  useEffect(() => {
    if (isPublishing) {
      onConnectionFailed?.('Live broadcasting is not supported on web.');
    }
  }, [isPublishing, onConnectionFailed]);

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', textAlign: 'center', padding: 16 }}>
        Live streaming is not supported on web. Please use the mobile app to
        go live.
      </Text>
    </View>
  );
}