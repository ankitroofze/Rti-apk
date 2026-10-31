import React from 'react';
import { View, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import ControlledVideo from './ControlledVideo';

/**
 * Ad video player (web + Android + iOS).
 * autoPlay=true  -> muted + loop + auto start (sidebar / feed jaisi jagah)
 * autoPlay=false -> news jaisa player: play/pause, progress line, timer, poora video visible (ad banate waqt)
 * Caller `key={uri}` de to uri badalne par player naya ban jaata hai.
 */
function AutoPlayAdVideo({ uri, style, contentFit }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.muted = true; // browser autoplay ke liye muted zaroori hai
    p.play();
  });
  return (
    <View style={[{ backgroundColor: '#000', overflow: 'hidden' }, style]}>
      <VideoView
        player={player}
        style={[{ width: '100%', height: '100%' }, Platform.OS === 'web' ? { objectFit: contentFit } : null]}
        contentFit={contentFit}
        nativeControls
      />
    </View>
  );
}

export default function AdVideoPlayer({ uri, style, autoPlay = false, contentFit = 'contain' }) {
  if (!uri) return null;
  if (!autoPlay) return <ControlledVideo uri={uri} style={style} />;
  return <AutoPlayAdVideo uri={uri} style={style} contentFit={contentFit} />;
}