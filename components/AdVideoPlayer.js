import React from 'react';
import { View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

/**
 * Ad video player (web + Android + iOS).
 * autoPlay=true  -> muted + loop + auto start (sidebar / feed jaisi jagah)
 * autoPlay=false -> sirf controls ke saath preview (ad banate waqt)
 * Caller `key={uri}` de to uri badalne par player naya ban jaata hai.
 */
export default function AdVideoPlayer({ uri, style, autoPlay = false, contentFit = 'contain' }) {
  const player = useVideoPlayer(uri ? { uri } : null, (p) => {
    p.loop = autoPlay;
    p.muted = autoPlay; // browser autoplay ke liye muted zaroori hai
    if (autoPlay) p.play();
  });

  if (!uri) return null;
  return (
    <View style={[{ backgroundColor: '#000', overflow: 'hidden' }, style]}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit={contentFit} nativeControls />
    </View>
  );
}