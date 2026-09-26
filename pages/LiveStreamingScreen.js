import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import LiveStreamPlayer from '../components/LiveStreamPlayer';
import { useToast } from '../components/ui/ToastProvider';
import LiveStreamingStyles from '../styles/LiveStreamingStyles';
import { UserStore } from '../store/UserStore';
import { requirePremium } from '../utils/profileHelpers';
import { MODULE_HEADER_HEIGHT_WEB } from '../constants/subscriptionThemes';
import ModuleWebHeader from '../components/Modulewebheader';
// ─── Header override — matches AdvertiseScreen's top bar exactly (font, back arrow, spacing) ───
const HEADER_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 2 : 32; // 👈 aur height kam ki
const F_REG  = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular';
const F_BOLD = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold';

const H = StyleSheet.create({
   header: {
      width: '100%', alignSelf: 'stretch',
      overflow: 'hidden',
      backgroundColor: '#b91c1c',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    ...(Platform.OS === 'web' ? { height: MODULE_HEADER_HEIGHT_WEB, paddingBottom: 0 } : null),
  },
  headerImg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1, fontSize: 15, fontWeight: '400', color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular',
  },
});
// Tablet-responsive content wrapper — matches AdvertiseScreen's centered max-width pattern
const TABLET_CONTENT_WRAP = { maxWidth: 720, width: '100%', alignSelf: 'center' };

export default function LiveStreamingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black });
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= 768;
  const { showToast } = useToast();

  const [loading, setLoading]               = useState(true);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const currentStreamIdRef = useRef(null);

  // ── Stream data ──
  // Each item: { id, stream_title, stream_url, status }
  // status: 'live' | 'upcoming' | 'ended'
  const [streamData, setStreamData] = useState({
    currentUser:    null,
    items:          [],
    liveCount:      0,
    upcomingCount:  0,
    endedCount:     0,
  });
  const currentStream = streamData.items.find((stream) => stream.id === currentStreamId) || null;


  // ── Load data ──
  const loadStreams = useCallback(async () => {
    setLoading(true);
    const data = await UserStore.getLiveStreamingSummary();
    setLoading(false);

    if (!data) {
      navigation.replace('Login');
      return;
    }
    setStreamData(data);

    if (currentStreamIdRef.current) {
      const refreshedCurrent = data.items.find((stream) => stream.id === currentStreamIdRef.current);
      if (!refreshedCurrent || refreshedCurrent.status !== 'live') {
        currentStreamIdRef.current = null;
        setCurrentStreamId(null);
      }
    } else {
      const firstLiveStream = data.items.find((stream) => stream.status === 'live' && stream.stream_url);
      if (firstLiveStream) {
        currentStreamIdRef.current = firstLiveStream.id;
        setCurrentStreamId(firstLiveStream.id);
      }
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadStreams();
    }, [loadStreams])
  );


  // ── Play: open YouTube link ──
  const handlePlay = async (item) => {
    if (item.status !== 'live') {
      showToast('Only live streams can be played right now.', 'error');
      return;
    }
    if (!item.stream_url) {
      showToast('Playback URL not available for this stream.', 'error');
      return;
    }
    currentStreamIdRef.current = item.id;
    setCurrentStreamId(item.id);
  };

  // ── Stop: update status on backend ──
  // ── Status badge style ──
  const statusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':     return LiveStreamingStyles.liveBadge;
      case 'upcoming': return LiveStreamingStyles.upcomingBadge;
      default:         return LiveStreamingStyles.endedBadge;
    }
  };
  const statusTextStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':     return LiveStreamingStyles.liveText;
      case 'upcoming': return LiveStreamingStyles.upcomingText;
      default:         return LiveStreamingStyles.endedText;
    }
  };

  return (
    <View style={LiveStreamingStyles.root}>
      {/* Top Bar — matches AdvertiseScreen header style */}
     <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
{Platform.OS === 'web' ? (
  /* ✅ Web header — design ek hi jagah (components/ModuleWebHeader.js) se aata hai */
  <ModuleWebHeader title="Live Streaming" navigation={navigation} />
) : (
<ImageBackground
  source={require('../assets/images/profile-red.png')}
  resizeMode="cover"
  imageStyle={H.headerImg}
  style={[H.header, { paddingTop: insets.top + 8 }]}
>
  <TouchableOpacity onPress={() => navigation.navigate('QuickMenu')} style={H.backBtn} activeOpacity={0.7}>
    <Ionicons name="chevron-back" size={24} color="#ffffff" />
  </TouchableOpacity>
  <Text style={H.title}>Live Streaming</Text>
</ImageBackground>
)}

      <ScrollView
        style={LiveStreamingStyles.scrollView}
        contentContainerStyle={[LiveStreamingStyles.scrollContent, isTablet && TABLET_CONTENT_WRAP]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card – no user info */}
        <View style={LiveStreamingStyles.heroCard}>
          <Text style={[LiveStreamingStyles.heroEyebrow, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Live TV</Text>
          <Text style={[LiveStreamingStyles.heroTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Live Streaming</Text>
          <Text style={[LiveStreamingStyles.heroSubtitle, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
            Watch the active bulletin inside the app and keep a single channel on screen at a time.
          </Text>
                  <TouchableOpacity
                     onPress={async () => {
              const user = await UserStore.getCurrentUser();
              if (!requirePremium(user, UserStore.hasActiveSubscription, showToast, navigation, 'Start Live')) return;
              navigation.navigate('Start Live');
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#ef4444', '#b91c1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={LiveStreamingStyles.startLiveCta}
            >
              <Feather name="radio" size={16} color="#fff" />
              <Text style={[LiveStreamingStyles.startLiveCtaText, fontsLoaded && { fontFamily: F_BOLD }]}>Start Live</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={LiveStreamingStyles.card}>
          <View style={LiveStreamingStyles.playerHeaderRow}>
            <Text style={[LiveStreamingStyles.sectionTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Live Player</Text>
            {currentStream ? (
              <View style={LiveStreamingStyles.playerLivePill}>
                <View style={LiveStreamingStyles.liveDotInline} />
                <Text style={[LiveStreamingStyles.playerLivePillText, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>LIVE</Text>
              </View>
            ) : null}
          </View>

          <View style={LiveStreamingStyles.playerShell}>
            <LiveStreamPlayer
              streamUrl={currentStream?.stream_url || ''}
              onError={() => {
                currentStreamIdRef.current = null;
                setCurrentStreamId(null);
                showToast('Unable to play this live stream.', 'error');
              }}
            />
            {currentStream ? (
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
            ) : null}
          </View>

          <Text style={[LiveStreamingStyles.playerCaption, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
            {currentStream?.stream_title || 'Select an active stream to start playback.'}
          </Text>
        </View>

        {/* Metrics */}
        <View style={LiveStreamingStyles.metricsRow}>
          <View style={[LiveStreamingStyles.metricCard, LiveStreamingStyles.metricLive]}>
            <View style={LiveStreamingStyles.liveMetricTop}>
              <View style={LiveStreamingStyles.liveDot} />
              <Text style={[LiveStreamingStyles.metricValue, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>{streamData.liveCount}</Text>
            </View>
            <Text style={[LiveStreamingStyles.metricLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Live</Text>
          </View>
          <View style={[LiveStreamingStyles.metricCard, LiveStreamingStyles.metricUpcoming]}>
            <Text style={[LiveStreamingStyles.metricValue, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>{streamData.upcomingCount}</Text>
            <Text style={[LiveStreamingStyles.metricLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Upcoming</Text>
          </View>
          <View style={[LiveStreamingStyles.metricCard, LiveStreamingStyles.metricEnded]}>
            <Text style={[LiveStreamingStyles.metricValue, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>{streamData.endedCount}</Text>
            <Text style={[LiveStreamingStyles.metricLabel, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Ended</Text>
          </View>
        </View>

        {/* Stream Records */}
        <View style={LiveStreamingStyles.card}>
          <Text style={[LiveStreamingStyles.sectionTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>Stream Records</Text>

          {loading ? (
            <Text style={[LiveStreamingStyles.loadingText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
              Loading stream records...
            </Text>
          ) : streamData.items.length ? (
            streamData.items.map((item) => {
              const isLive = item.status?.toLowerCase() === 'live';

              return (
                <View
                  key={item.id}
                  style={[
                    LiveStreamingStyles.streamCard,
                    isLive && LiveStreamingStyles.streamCardLive,
                  ]}
                >
                  {/* Top Row: title + status badge */}
                  <View style={LiveStreamingStyles.streamTopRow}>
                    <View style={LiveStreamingStyles.streamTitleWrap}>
                      {isLive ? <View style={LiveStreamingStyles.liveDotInline} /> : null}
                      <Text style={[LiveStreamingStyles.streamTitle, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]} numberOfLines={2}>
                        {item.stream_title}
                      </Text>
                    </View>
                    <View style={[LiveStreamingStyles.statusBadge, statusBadgeStyle(item.status)]}>
                      <Text style={[LiveStreamingStyles.statusBadgeText, statusTextStyle(item.status), fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Playback URL */}
                  <View style={LiveStreamingStyles.linkRow}>
                    <Feather name="video" size={13} color="#dc2626" />
                    <Text style={[LiveStreamingStyles.linkText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]} numberOfLines={1}>
                      {item.stream_url || 'Playback URL not available'}
                    </Text>
                  </View>

                  {/* Play + Stop Buttons */}
                  <View style={LiveStreamingStyles.actionRow}>
                    <TouchableOpacity
                      style={[
                        LiveStreamingStyles.playBtn,
                        !isLive && LiveStreamingStyles.buttonDisabled,
                      ]}
                      onPress={() => handlePlay(item)}
                      disabled={!isLive}
                    >
                      <Feather name="play-circle" size={16} color="#fff" />
                      <Text style={[LiveStreamingStyles.playBtnText, fontsLoaded && { fontFamily: 'Roboto_700Bold' }]}>
                        {isLive ? 'Watch Live' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>

                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[LiveStreamingStyles.emptyText, fontsLoaded && { fontFamily: 'Roboto_400Regular' }]}>
              No stream records found.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}