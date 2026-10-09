import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Share } from 'react-native';
import { AppState, Image, Linking, PermissionsAndroid, Platform, ScrollView, Text, TextInput, TouchableOpacity, UIManager, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import { LinearGradient } from 'expo-linear-gradient';
import RtmpBroadcaster from '../components/RtmpBroadcaster';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import { useToast } from '../components/ui/ToastProvider';
import LiveStreamingStyles from '../styles/LiveStreamingStyles';
import { UserStore } from '../store/UserStore';
import {
  DEMO_PLAYBACK_URL,
  DEMO_STREAM_TITLE,
  YOUTUBE_RTMPS_URL,
  YOUTUBE_STREAM_KEY_PLACEHOLDER,
} from '../constants/liveStreamingConfig';

// Tablet-responsive content wrapper — matches AdvertiseScreen's centered max-width pattern
const TABLET_CONTENT_WRAP = { maxWidth: 720, width: '100%', alignSelf: 'center' };

const DEFAULT_RTMP_URL = YOUTUBE_RTMPS_URL;
const DEFAULT_STREAM_KEY = YOUTUBE_STREAM_KEY_PLACEHOLDER;
const DEFAULT_PLAYBACK_URL = DEMO_PLAYBACK_URL;
const toIndiaIsoString = (date) => {
  const indiaTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return `${indiaTime.toISOString().slice(0, 19)}+05:30`;
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const isExpoGo = Constants.appOwnership === 'expo';
const hasNativePublisher = Platform.OS === 'android' && !isExpoGo;
// Web par browser se RTMP push nahi ho sakta, lekin YouTube broadcast bana kar
// RTMP URL + Stream Key de sakte hain (OBS / encoder me paste karne ke liye).
const isWeb = Platform.OS === 'web';
const canStartHere = hasNativePublisher || isWeb;

// Camera + Microphone runtime permission request (Android 6+ requires this
// even when the manifest already declares the permissions).
const requestCameraAndMicPermission = async () => {
  if (Platform.OS !== 'android') return true; // iOS asks via Info.plist prompts automatically
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
};

export default function LiveBroadcastScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= 768;
  const { showToast, showPopup } = useToast();
 const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastId, setBroadcastId] = useState(null);
  const [activeWatchUrl, setActiveWatchUrl] = useState('');
  const [cameraFlipCount, setCameraFlipCount] = useState(0);
  const [cameraPreviewSession, setCameraPreviewSession] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const startRequestInFlight = useRef(false);
  const awaitingYoutubeAuthRef = useRef(false);
  const broadcastIdRef = useRef(null);
  const endingBroadcastRef = useRef(false);

  const endLiveOnExit = useCallback(async () => {
    const activeBroadcastId = broadcastIdRef.current;
    if (!activeBroadcastId || endingBroadcastRef.current) return;

    endingBroadcastRef.current = true;
    try {
      await UserStore.endYoutubeLive(activeBroadcastId);
    } finally {
      broadcastIdRef.current = null;
      endingBroadcastRef.current = false;
    }
  }, []);
const [form, setForm] = useState({
  stream_title: '',
  privacy_status: 'unlisted',
  scheduled_start_time: toIndiaIsoString(new Date(Date.now() + 60 * 1000)),
  stream_url: '',
  ingest_url: '',
  stream_key: '',
});
  // Camera must not mount (native Camera.open()) until permission is confirmed,
  // otherwise it crashes with "Fail to connect to camera service".
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(Platform.OS !== 'android');
  const [permissionChecked, setPermissionChecked] = useState(Platform.OS !== 'android');

  useFocusEffect(
    useCallback(() => {
      setIsPublishing(false);
      if (Platform.OS === 'android' && !isExpoGo && hasNativePublisher) {
        let alive = true;
        requestCameraAndMicPermission().then((granted) => {
          if (!alive) return;
          setCameraPermissionGranted(granted);
          setPermissionChecked(true);
          if (granted) setCameraPreviewSession((session) => session + 1);
        });
        return () => { alive = false; };
      }
    }, [])
  );

  useFocusEffect(
    useCallback(() => () => {
      endLiveOnExit();
    }, [endLiveOnExit])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      UserStore.getCurrentUser().then((user) => {
        if (active) setIsYoutubeConnected(Boolean(user?.youtube_connected));
      });
      return () => { active = false; };
    }, [])
  );

  // YouTube login browser me hota hai. Wapas app me aane par screen dobara focus nahi hoti,
  // isliye "Connect YouTube Account" purana dikhta rehta tha. App foreground me aate hi
  // connection dobara check karte hain.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || !awaitingYoutubeAuthRef.current) return;
      awaitingYoutubeAuthRef.current = false;
      const summary = await UserStore.getLiveStreamingSummary();
      if (summary && !summary.error) {
        setIsYoutubeConnected(true);
        const user = summary.currentUser;
        if (user?.email) UserStore.updateUser(user.email, { youtube_connected: true }).catch(() => {});
        showToast('YouTube account connected.', 'success');
      } else {
        showToast(summary?.error || 'YouTube connection not completed. Please try again.', 'error');
      }
    });
    return () => sub.remove();
  }, [showToast]);

  // Restore the stream already running on YouTube when this screen is opened
  // again. This is view-only: it does not attempt to restart the local camera
  // or assume ownership of a broadcast started from another app/session.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      UserStore.getLiveStreamingSummary().then((summary) => {
        if (!active || !summary?.items) return;

        const existingLive = summary.items.find(
          (stream) => stream.status?.toLowerCase() === 'live' && stream.stream_url
        );
        setActiveWatchUrl(existingLive?.stream_url || '');
      });

      return () => { active = false; };
    }, [])
  );

  const handleRetryPermission = useCallback(async () => {
    const granted = await requestCameraAndMicPermission();
    setCameraPermissionGranted(granted);
    setPermissionChecked(true);
    if (granted) setCameraPreviewSession((session) => session + 1);
    if (!granted) {
      showToast('Camera and microphone permission is required to broadcast. Enable it from phone Settings > Apps > RTI News > Permissions.', 'error');
    }
  }, [showToast]);
const publishUrl = useMemo(() => {
  const ingest = form.ingest_url.trim();
  const key = form.stream_key.trim();

  if (!ingest || !key) return '';
  return ingest.endsWith(`/${key}`) ? ingest : `${ingest.replace(/\/+$/, '')}/${key}`;
}, [form.ingest_url, form.stream_key]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
const handleStartLive = async () => {
  if (isExpoGo || !canStartHere) {
    showToast('Start Live works only in a native Android build or on web. Expo Go can watch live streams only.', 'error');
    return;
  }
  if (!form.stream_title.trim()) {
    showToast('Enter a stream title before going live.', 'error');
    return;
  }
  if (!form.privacy_status.trim()) {
    showToast('Enter a privacy status before going live.', 'error');
    return;
  }
  if (!form.scheduled_start_time.trim() || Number.isNaN(Date.parse(form.scheduled_start_time))) {
    showToast('Enter a valid scheduled start time.', 'error');
    return;
  }
  // Screen khulte waqt start time "abhi + 1 min" set hota hai. YouTube login me der lagne par
  // wo time nikal jata hai aur server create reject kar deta hai, isliye purana ho to naya set karo.
  let scheduledStartTime = form.scheduled_start_time.trim();
  if (Date.parse(scheduledStartTime) < Date.now() + 30 * 1000) {
    scheduledStartTime = toIndiaIsoString(new Date(Date.now() + 60 * 1000));
    updateField('scheduled_start_time', scheduledStartTime);
  }

  const permissionGranted = await requestCameraAndMicPermission();
  if (!permissionGranted) {
    showToast('Camera and microphone permission is required to go live.', 'error');
    return;
  }
setIsSaving(true);
  const result = await UserStore.createYoutubeLive(
    form.stream_title.trim(),
    form.privacy_status.trim(),
    scheduledStartTime,
  );
  setIsSaving(false);

  if (!result.ok) {
    if (result.isAuth) {
      showPopup(result.message || 'Please connect your YouTube account first.', 'error');
      return;
    }
    showPopup(result.message || 'Unable to create the live stream.', 'error');
    return;
  }

  setIsYoutubeConnected(true);

  const createdBroadcastId = result.liveData?.broadcast_id;
  if (!createdBroadcastId) {
    showPopup('Live stream was created without a broadcast ID. Backend response: ' + JSON.stringify(result.liveData || {}).slice(0, 300), 'error');
    return;
  }

  setBroadcastId(createdBroadcastId);
  broadcastIdRef.current = createdBroadcastId;
  updateField('ingest_url', result.liveData?.ingestion_address || '');
  updateField('stream_key', result.liveData?.stream_key || '');
  if (hasNativePublisher) {
    setIsPublishing(true);
    showToast('Live created. Connecting to YouTube...', 'success');
  } else {
    // Web: camera se direct stream nahi hoti — encoder (OBS) me URL + key daalna hoga
    showPopup('YouTube live create ho gayi. Neeche "RTMP Ingest URL" aur "Stream Key" OBS (ya kisi encoder) me daalo, stream start karo, phir "Go Live on YouTube" dabao.', 'success');
  }
};

  // Web only: encoder connect hone ke baad broadcast ko YouTube par live karo
  const handleGoLiveWeb = async () => {
    const id = broadcastIdRef.current;
    if (!id || startRequestInFlight.current) return;
    startRequestInFlight.current = true;
    setIsSaving(true);
    const result = await UserStore.confirmYoutubeLive(id);
    setIsSaving(false);
    startRequestInFlight.current = false;
    if (result?.ok) {
      setActiveWatchUrl(result.data?.data?.watch_url || result.data?.watch_url || '');
      showToast('You are now LIVE on YouTube.', 'success');
      return;
    }
    showPopup(result?.message || 'YouTube stream abhi inactive hai. Pehle OBS se stream start karo, 10-15 second ruko, phir dobara try karo.', 'error');
  };
  const handleStopLive = async () => {
    setIsSaving(true);
    const result = broadcastId
      ? await UserStore.endYoutubeLive(broadcastId)
      : await UserStore.stopActiveLiveStream();
    setIsSaving(false);
    setIsPublishing(false);
    setIsMicMuted(false);
    setBroadcastId(null);
    setActiveWatchUrl('');
    broadcastIdRef.current = null;
    startRequestInFlight.current = false;

    if (!result.ok) {
      showToast(result.message || 'Unable to stop the live stream.', 'error');
      return;
    }

    showToast('Live session stopped.', 'success');
  };
  // Start Live button kyun disabled hai — screen par saaf dikhane ke liye
  const startBlockReason = isExpoGo
    ? 'Expo Go me Start Live nahi chalta. Native Android APK build chahiye.'
    : !canStartHere
      ? `Start Live sirf Android APK ya web par chalta hai (abhi platform: ${Platform.OS}).`
      : isPublishing
        ? 'Live pehle se chal rahi hai ya atak gayi hai. "Stop Live" dabao, phir dobara Start Live karo.'
        : isSaving
          ? 'Request chal rahi hai, thoda wait karo...'
          : '';

  return (
    <SafeAreaView style={LiveStreamingStyles.root} edges={Platform.OS === 'android' ? ['left', 'right', 'bottom'] : ['top', 'left', 'right', 'bottom']}>
      {/* Top Bar with Back Arrow — matches AdvertiseScreen header style */}
      {Platform.OS === 'android' ? (
<ModuleAndroidHeader title="Start Live" onBack={async () => {
 await endLiveOnExit();
 navigation.goBack();
 }} />
) : (
<>
<View style={LiveStreamingStyles.topBar}>
        <TouchableOpacity
          style={LiveStreamingStyles.backBtn}
          onPress={async () => {
            await endLiveOnExit();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={[LiveStreamingStyles.topBarTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Start Live</Text>
        <View style={LiveStreamingStyles.topBarSpacer} />
      </View>
</>
)}

      <ScrollView
        style={LiveStreamingStyles.scrollView}
        contentContainerStyle={[LiveStreamingStyles.scrollContent, isTablet && TABLET_CONTENT_WRAP]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={LiveStreamingStyles.heroCard}>
          <Text style={[LiveStreamingStyles.heroEyebrow, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Reporter Console</Text>
          <Text style={[LiveStreamingStyles.heroTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Broadcast To YouTube RTMP</Text>
          <Text style={[LiveStreamingStyles.heroSubtitle, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
            Configure the YouTube Live encoder target and keep the demo playback URL ready for viewer-side testing.
          </Text>
          {isExpoGo || !hasNativePublisher ? (
            <View style={LiveStreamingStyles.infoBox}>
              <Text style={[LiveStreamingStyles.infoTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Native build required</Text>
              <Text style={[LiveStreamingStyles.infoText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
                This screen can preview configuration in Expo Go, but actual RTMP broadcasting works only in a native Android app build.
              </Text>
            </View>
          ) : null}
        </View>

      <View style={LiveStreamingStyles.card}>
          {isYoutubeConnected ? (
            <View style={LiveStreamingStyles.youtubeConnectedBox}>
              <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
              <View style={LiveStreamingStyles.youtubeConnectedCopy}>
                <Text style={LiveStreamingStyles.youtubeConnectedTitle}>YouTube account connected</Text>
                <Text style={LiveStreamingStyles.youtubeConnectedText}>Your YouTube account is successfully verified.</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={LiveStreamingStyles.playBtn}
              onPress={async () => {
                awaitingYoutubeAuthRef.current = true;
                const res = await UserStore.connectYoutubeAccount();
                if (!res.ok) {
                  awaitingYoutubeAuthRef.current = false;
                  showToast(res.message || 'Unable to open YouTube authorization.', 'error');
                }
              }}
            >
              <Text style={LiveStreamingStyles.playBtnText}>Connect YouTube Account</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={LiveStreamingStyles.card}>
          <Text style={LiveStreamingStyles.sectionTitle}>Camera Preview</Text>
          {!isExpoGo && hasNativePublisher && Platform.OS === 'android' && !cameraPermissionGranted ? (
            <View style={LiveStreamingStyles.infoBox}>
              <Text style={[LiveStreamingStyles.infoTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>
                {permissionChecked ? 'Camera & microphone permission needed' : 'Checking camera permission...'}
              </Text>
              {permissionChecked ? (
                <>
                  <Text style={[LiveStreamingStyles.infoText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
                    Broadcasting needs camera and microphone access. Please allow it to continue.
                  </Text>
                  <TouchableOpacity style={LiveStreamingStyles.playBtn} onPress={handleRetryPermission} activeOpacity={0.85}>
                    <Text style={LiveStreamingStyles.playBtnText}>Grant Permission</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          ) : (
            <View style={LiveStreamingStyles.publisherFrame}>
              <RtmpBroadcaster
                key={`camera-preview-${cameraPreviewSession}`}
                streamUrl={form.ingest_url.trim()}
                streamKey={form.stream_key.trim()}
                isPublishing={isPublishing}
                isMuted={isMicMuted}
                switchCameraSignal={cameraFlipCount}
          onConnectionSuccess={async () => {
    showToast('RTMP connection established.', 'success');

    const activeBroadcastId = broadcastIdRef.current;
    if (!activeBroadcastId || startRequestInFlight.current) return;

    startRequestInFlight.current = true;
    setIsSaving(true);
    // YouTube can take a few seconds to detect the newly connected RTMP encoder.
    // Calling the broadcast transition repeatedly after a failure leaves it in an
    // invalid transition state, so this is intentionally a single request.
    await wait(10000);
    const result = await UserStore.confirmYoutubeLive(activeBroadcastId);
    setIsSaving(false);

    if (result?.ok) {
      setActiveWatchUrl(result.data?.data?.watch_url || result.data?.watch_url || '');
      showToast('You are now LIVE on YouTube.', 'success');
      return;
    }

    startRequestInFlight.current = false;
    setIsPublishing(false);
    setActiveWatchUrl('');
    showPopup(result?.message || 'YouTube stream is still inactive. Please try again.', 'error');

}}
                onConnectionFailed={(message) => {
                  setIsPublishing(false);
                  startRequestInFlight.current = false;
                  showPopup(`RTMP connection failed${message ? `: ${message}` : '.'}`, 'error');
                }}
              />
              <View pointerEvents="none" style={LiveStreamingStyles.publisherBrandOverlay}>
                <View style={LiveStreamingStyles.publisherBrandBar}>
                  <Image source={require('../assets/images/logo.jpg')} style={LiveStreamingStyles.publisherLogo} />
                  <Text style={LiveStreamingStyles.publisherBrandName}>RTI NEWS</Text>
                  <View style={LiveStreamingStyles.publisherLiveBadge}>
                    <View style={LiveStreamingStyles.publisherLiveDot} />
                    <Text style={LiveStreamingStyles.publisherLiveText}>LIVE</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
       {isPublishing ? (
            <View style={LiveStreamingStyles.cameraControls}>
              <TouchableOpacity
                style={LiveStreamingStyles.cameraSwitchBtn}
                onPress={() => setCameraFlipCount((count) => count + 1)}
              >
                <Ionicons name="camera-reverse-outline" size={18} color="#fff" />
                <Text style={LiveStreamingStyles.cameraSwitchBtnText}>Switch Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[LiveStreamingStyles.cameraSwitchBtn, isMicMuted && LiveStreamingStyles.cameraMuteBtn]}
                onPress={() => setIsMicMuted((muted) => !muted)}
              >
                <Ionicons name={isMicMuted ? 'mic-off-outline' : 'mic-outline'} size={18} color="#fff" />
                <Text style={LiveStreamingStyles.cameraSwitchBtnText}>{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={LiveStreamingStyles.cameraSwitchBtn}
                disabled={!activeWatchUrl}
                onPress={async () => {
                  try {
                    await Share.share({ message: `Live dekho: ${activeWatchUrl}` });
                  } catch {
                    showToast('Unable to share link.', 'error');
                  }
                }}
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={LiveStreamingStyles.cameraSwitchBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {activeWatchUrl ? (
            <View style={LiveStreamingStyles.broadcastWatchFrame}>
              <Text style={LiveStreamingStyles.broadcastWatchTitle}>Live on YouTube</Text>
              <LiveStreamPlayer
                streamUrl={activeWatchUrl}
                onError={() => showToast('Unable to load the live YouTube preview.', 'error')}
              />
              <TouchableOpacity
                style={LiveStreamingStyles.openYoutubeBtn}
                onPress={() => Linking.openURL(activeWatchUrl).catch(() => {
                  showToast('Unable to open this live stream in YouTube.', 'error');
                })}
              >
                <Ionicons name="logo-youtube" size={18} color="#fff" />
                <Text style={LiveStreamingStyles.openYoutubeBtnText}>Open in YouTube</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={LiveStreamingStyles.card}>
          <Text style={[LiveStreamingStyles.sectionTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Live Settings</Text>

          <Text style={[LiveStreamingStyles.fieldLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Stream Title</Text>
          <TextInput
            value={form.stream_title}
            onChangeText={(value) => updateField('stream_title', value)}
            style={[LiveStreamingStyles.input, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}
            placeholder="RTI News Live Bulletin"
            placeholderTextColor="#94a3b8"
          />

          <Text style={[LiveStreamingStyles.fieldLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Privacy Status</Text>
          <TextInput
            value={form.privacy_status}
            onChangeText={(value) => updateField('privacy_status', value)}
            style={[LiveStreamingStyles.input, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}
            placeholder="unlisted"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={[LiveStreamingStyles.fieldLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Scheduled Start Time</Text>
          <TextInput
            value={form.scheduled_start_time}
            onChangeText={(value) => updateField('scheduled_start_time', value)}
            style={[LiveStreamingStyles.input, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}
            placeholder="2026-08-06T11:00:00+05:30"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={[LiveStreamingStyles.fieldLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>RTMP Ingest URL</Text>
          <TextInput
            value={form.ingest_url}
            onChangeText={(value) => updateField('ingest_url', value)}
            style={[LiveStreamingStyles.input, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}
            placeholder="rtmp://your-server/live"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={[LiveStreamingStyles.fieldLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Stream Key</Text>
          <TextInput
            value={form.stream_key}
            onChangeText={(value) => updateField('stream_key', value)}
            style={[LiveStreamingStyles.input, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}
            placeholder="stream"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={[LiveStreamingStyles.fieldLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Playback URL (.m3u8)</Text>
          <TextInput
            value={form.stream_url}
            onChangeText={(value) => updateField('stream_url', value)}
            style={[LiveStreamingStyles.input, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}
            placeholder="https://your-server/live/stream.m3u8"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <View style={LiveStreamingStyles.infoBox}>
            <Text style={[LiveStreamingStyles.infoTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>YouTube setup</Text>
            <Text style={[LiveStreamingStyles.infoText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
              Copy the stream key from YouTube Studio Live Control Room and paste it here. Replace the stream URL too if Studio shows a different RTMP or RTMPS target.
            </Text>
            <Text style={[LiveStreamingStyles.infoText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>Publish target: {publishUrl || 'Not ready'}</Text>
            <Text style={[LiveStreamingStyles.infoText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>Demo playback: {DEFAULT_PLAYBACK_URL}</Text>
          </View>

          {isWeb && !broadcastId ? (
            <Text style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>
              Web par camera se direct live nahi hoti. "Create Live" dabao, phir RTMP URL + Stream Key OBS me daalo, stream start karo aur "Go Live on YouTube" dabao.
            </Text>
          ) : null}
          {startBlockReason ? (
            <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{startBlockReason}</Text>
          ) : null}

          <View style={LiveStreamingStyles.actionRow}>
            <TouchableOpacity
              style={[
                LiveStreamingStyles.playBtn,
                (isSaving || isPublishing || isExpoGo || !canStartHere || (isWeb && Boolean(broadcastId))) && LiveStreamingStyles.buttonDisabled,
              ]}
              onPress={handleStartLive}
           disabled={
  isSaving ||
  isPublishing ||
  isExpoGo ||
  !canStartHere ||
  (isWeb && Boolean(broadcastId))
}
            >
              <Feather name="radio" size={16} color="#fff" />
              <Text style={[LiveStreamingStyles.playBtnText, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>
                {isSaving && !isPublishing ? 'Starting...' : (isWeb ? 'Create Live' : 'Start Live')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                LiveStreamingStyles.stopBtn,
                ((!isPublishing && !broadcastId) || isSaving) && LiveStreamingStyles.buttonDisabled,
              ]}
              onPress={handleStopLive}
              disabled={(!isPublishing && !broadcastId) || isSaving}
            >
              <Feather name="square" size={14} color="#fff" />
              <Text style={[LiveStreamingStyles.stopBtnText, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>
                {isSaving && (isPublishing || broadcastId) ? 'Stopping...' : 'Stop Live'}
              </Text>
            </TouchableOpacity>
          </View>
          {isWeb && broadcastId && !activeWatchUrl ? (
            <TouchableOpacity
              style={[LiveStreamingStyles.playBtn, { marginTop: 12 }, isSaving && LiveStreamingStyles.buttonDisabled]}
              onPress={handleGoLiveWeb}
              disabled={isSaving}
            >
              <Feather name="radio" size={16} color="#fff" />
              <Text style={LiveStreamingStyles.playBtnText}>{isSaving ? 'Please wait...' : 'Go Live on YouTube'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}