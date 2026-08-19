# Live Streaming Setup

## Current Status

- `Watch Live` works inside the app with `expo-video`, so playback can be tested in Expo Go and Android.
- `Start Live` uses `react-native-rtmp-publisher`, so broadcasting requires a native Android build.
- The app is now prepared for a YouTube Live RTMP workflow.

## YouTube Live Configuration

1. Open YouTube Live Control Room.
2. Copy the stream URL and stream key from YouTube Studio.
3. In the app, open `Live Streaming` -> `Start Live`.
4. Paste:
   - `RTMP Ingest URL`: YouTube Studio stream URL
   - `Stream Key`: YouTube Studio stream key
   - `Playback URL`: keep the demo HLS URL during app testing unless you have a production in-app playback source

Prepared defaults in the app:

```txt
RTMPS URL: rtmps://a.rtmps.youtube.com/live2
Demo playback URL: https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
```

## Working Demo

1. Start Expo for viewer-side testing:

```bash
npx expo start -c
```

2. Open `Live Streaming` and use `Watch Live` to verify the in-app demo stream.

3. For broadcaster testing on Android native:

```bash
npx expo run:android
```

4. Open `Start Live`, paste the real YouTube stream key, and begin publishing from the device camera.

## What Is Still Needed

- The actual YouTube Studio stream key, or channel access to retrieve it
- The final in-app playback source for the production YouTube live feed
- iOS native broadcaster setup if RTMP publishing is required on iPhone builds too
