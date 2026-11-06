// pages/FramedMediaPreviewScreen.js
// Use:  <FramedMediaPreviewScreen item={{ type:'video', media_url:'abc.mp4', frame_name:'f1.png', music_name:'m1.mp3' }} />
//  (ya React Navigation me route.params.item)
// Backend se jo aata hai (sirf names) -> buildMediaUrl se full URL.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FramedImagePreview from '../components/FramedImagePreview';
import FramedVideoPreview from '../components/FramedVideoPreview';
import { buildMediaUrl } from '../constants/mediaConfig';
import { notify } from '../utils/notify';
import { saveCapturedImage } from '../utils/saveFramedImage';
import { saveFramedVideo } from '../utils/saveFramedVideo';

export default function FramedMediaPreviewScreen({ item: itemProp, route }) {
  const item = itemProp || route?.params?.item;
  const isVideo = item?.type === 'video';

  // 1) Full URLs
  const mediaUrl = buildMediaUrl(item?.media_url);
  const frameUrl = buildMediaUrl(item?.frame_name);
  const musicUrl = buildMediaUrl(item?.music_name);

  const imageRef = useRef(null);
  const [imageReady, setImageReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });
  const [paused, setPaused] = useState(false);

  // App background me jaye to video + music dono pause
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setPaused(s !== 'active'));
    return () => sub.remove();
  }, []);

  const onDownload = async () => {
    if (busy) return;
    setBusy(true);
    setProgress({ stage: 'Starting', percent: 0 });
    try {
      if (isVideo) {
        await saveFramedVideo({ videoUrl: mediaUrl, frameUrl, musicUrl, onProgress: setProgress });
      } else {
        setProgress({ stage: 'Saving to gallery', percent: 50 });
        const uri = await imageRef.current.capture();     // preview jaisi final image
        await saveCapturedImage(uri);
      }
      notify('Gallery me save ho gaya ✅');
    } catch (e) {
      notify(e?.message || 'Kuch galat ho gaya, dobara try karo.', true);
    } finally {
      setBusy(false);
      setProgress({ stage: '', percent: 0 });
    }
  };

  if (!item) return null;
  const disabled = busy || (!isVideo && !imageReady);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isVideo ? (
        <FramedVideoPreview videoUrl={mediaUrl} frameUrl={frameUrl} musicUrl={musicUrl} paused={paused || busy} />
      ) : (
        <FramedImagePreview ref={imageRef} imageUrl={mediaUrl} frameUrl={frameUrl} onReadyChange={setImageReady} />
      )}

      <TouchableOpacity style={[styles.btn, disabled && styles.btnDisabled]} onPress={onDownload} disabled={disabled} activeOpacity={0.8}>
        {busy ? <ActivityIndicator color="#fff" /> : null}
        <Text style={styles.btnText}>
          {busy ? `${progress.stage}… ${progress.percent}%` : 'Download'}
        </Text>
      </TouchableOpacity>

      {busy && isVideo ? (
        <View style={styles.track}><View style={[styles.fill, { width: `${progress.percent}%` }]} /></View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 14 },
  btn: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e3a5f', borderRadius: 14, paddingVertical: 14 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#1e3a5f' },
});