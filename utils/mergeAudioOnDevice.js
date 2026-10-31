// utils/mergeAudioOnDevice.js
// Video + (voice / music) ko phone par hi merge karke ek FINAL MP4 banata hai.
// Upload hone wali file me original awaaz nahi hoti — sirf user ki voice / chuna hua music hota hai,
// isliye feed / reels me wahi sunai deta hai.
//
//   Music only  : original awaaz band  + music (loop hokar poori video par)
//   Voice only  : original awaaz band  + recorded voice
//   Music+Voice : original awaaz band  + music (chuna volume)  + voice (100%)
//
// Engine 1 (recommended): `react-native-video-trim`  ->  mixAudio()   (npx expo install react-native-video-trim)
// Engine 2 (purana)     : `ffmpeg-kit-react-native` (retired — sirf tab jab pehle se installed ho)
// Dono na ho / fail ho jaaye to null return hota hai; wajah getLastMergeError() me milti hai.
import { Platform } from 'react-native';

let VideoTrim = null;
try {
  // eslint-disable-next-line global-require
  VideoTrim = require('react-native-video-trim');
} catch (_) {
  VideoTrim = null;
}

let FFmpegKit = null;
let ReturnCode = null;
try {
  // eslint-disable-next-line global-require
  const mod = require('ffmpeg-kit-react-native');
  FFmpegKit = mod.FFmpegKit;
  ReturnCode = mod.ReturnCode;
} catch (_) {
  FFmpegKit = null;
}

let FileSystem = null;
try {
  // eslint-disable-next-line global-require
  FileSystem = require('expo-file-system/legacy');
} catch (_) {
  try {
    // eslint-disable-next-line global-require
    FileSystem = require('expo-file-system');
  } catch (__) {
    FileSystem = null;
  }
}

let lastError = null;
const fail = (reason) => {
  lastError = reason;
  console.warn('[mergeAudioOnDevice]', reason);
  return null;
};
export const getLastMergeError = () => lastError;

const stripFileScheme = (uri) => String(uri || '').replace(/^file:\/\//i, '');
const withFileScheme = (p) => (String(p).startsWith('file://') ? String(p) : `file://${p}`);
const q = (p) => `"${String(p).replace(/"/g, '\\"')}"`;
const isRemote = (u) => /^https?:/i.test(String(u || ''));
// content:// / ph:// URIs ko native tools seedha nahi padh paate — pehle cache me copy karo.
const needsCopy = (u) => /^(content|ph|assets-library):\/\//i.test(String(u || ''));
const rand = () => `${Date.now()}_${Math.floor(Math.random() * 1e5)}`;

// Input ko local file path me badlo (remote => download, content:// => copy). Fail => null.
async function toLocalPath(uri, ext) {
  if (!uri) return null;
  if (isRemote(uri)) {
    // Dono engines remote https nahi padhte — music pehle download karo.
    const dest = `${FileSystem.cacheDirectory}mix_dl_${rand()}.${ext}`;
    const res = await FileSystem.downloadAsync(uri, dest);
    if (!res || (res.status && res.status >= 400)) return null;
    return stripFileScheme(res.uri || dest);
  }
  if (needsCopy(uri)) {
    const dest = `${FileSystem.cacheDirectory}mix_in_${rand()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return stripFileScheme(dest);
  }
  return stripFileScheme(uri);
}

async function fileOk(path) {
  try {
    const info = await FileSystem.getInfoAsync(withFileScheme(path));
    return !!(info?.exists && info.size > 0);
  } catch (_) {
    return false;
  }
}

// ── Engine 1: react-native-video-trim -> mixAudio() ──────────────────────────
async function mergeWithVideoTrim({ videoPath, voicePath, musicPath, vol }) {
  let current = videoPath;
  // 1) Music: original awaaz band (0), music loop hokar video ki poori length par
  if (musicPath) {
    const r = await VideoTrim.mixAudio(current, musicPath, {
      originalAudioVolume: 0,
      backgroundAudioVolume: vol,
      loopAudio: true,
    });
    if (!r?.outputPath) throw new Error('mixAudio(music) ne outputPath nahi diya');
    current = stripFileScheme(r.outputPath);
  }
  // 2) Voice: music-only audio (agar hai) ke upar voice; sirf-voice me original (0) band
  if (voicePath) {
    const r = await VideoTrim.mixAudio(current, voicePath, {
      originalAudioVolume: musicPath ? 1 : 0,
      backgroundAudioVolume: 1,
      loopAudio: false,
    });
    if (!r?.outputPath) throw new Error('mixAudio(voice) ne outputPath nahi diya');
    // intermediate (music-only) file saaf karo
    if (musicPath && current !== videoPath) { try { await VideoTrim.deleteFile?.(current); } catch (_) { /* ignore */ } }
    current = stripFileScheme(r.outputPath);
  }
  return current;
}

// ── Engine 2: ffmpeg-kit-react-native (purana) ───────────────────────────────
async function mergeWithFFmpegKit({ videoPath, voicePath, musicPath, vol }) {
  const out = `${FileSystem.cacheDirectory}merged_${rand()}.mp4`;
  let inputs = `-i ${q(videoPath)}`;
  let idx = 1;
  let voiceIdx = -1;
  let musicIdx = -1;
  if (voicePath) { inputs += ` -i ${q(voicePath)}`; voiceIdx = idx; idx += 1; }
  if (musicPath) { inputs += ` -stream_loop -1 -i ${q(musicPath)}`; musicIdx = idx; idx += 1; }

  const parts = [];
  const labels = [];
  if (voiceIdx > 0) { parts.push(`[${voiceIdx}:a]aresample=44100,volume=1.0,apad[v]`); labels.push('[v]'); }
  if (musicIdx > 0) { parts.push(`[${musicIdx}:a]aresample=44100,volume=${vol}[m]`); labels.push('[m]'); }
  const filter = labels.length === 2
    ? `${parts.join(';')};${labels.join('')}amix=inputs=2:duration=longest:dropout_transition=0,volume=2[a]`
    : parts[0].replace(/\[(v|m)\]$/, '[a]');

  const cmd = `-y ${inputs} -filter_complex ${q(filter)} -map 0:v:0 -map "[a]" `
    + `-c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart ${q(stripFileScheme(out))}`;
  const session = await FFmpegKit.execute(cmd);
  const rc = await session.getReturnCode();
  if (!ReturnCode?.isSuccess?.(rc)) {
    let logs = '';
    try { logs = String((await session.getAllLogsAsString?.()) || '').slice(-600); } catch (_) { /* ignore */ }
    throw new Error(`ffmpeg-kit failed (code ${rc?.getValue?.()}): ${logs}`);
  }
  return stripFileScheme(out);
}

/**
 * @param {{videoUri:string, voiceUri?:string|null, musicUrl?:string|null, musicVolume?:number}} opts
 * @returns {Promise<string|null>} merged FINAL mp4 ka file:// uri, ya null (fallback)
 */
export async function mergeAudioOnDevice({ videoUri, voiceUri, musicUrl, musicVolume = 0.6 }) {
  lastError = null;
  try {
    if (Platform.OS === 'web') return fail('web par on-device merge available nahi');
    if (!VideoTrim?.mixAudio && !FFmpegKit) {
      return fail('react-native-video-trim installed nahi hai (npx expo install react-native-video-trim, phir naya dev build / APK)');
    }
    if (!FileSystem?.cacheDirectory) return fail('expo-file-system cacheDirectory nahi mili');
    if (!videoUri || (!voiceUri && !musicUrl)) return fail('video ya audio input missing');

    const vol = Math.max(0, Math.min(1, Number(musicVolume) || 0.6));
    const videoPath = await toLocalPath(videoUri, 'mp4');
    const voicePath = voiceUri ? await toLocalPath(voiceUri, 'm4a') : null;
    const musicPath = musicUrl ? await toLocalPath(musicUrl, 'mp3') : null;
    if (!videoPath) return fail('video file read nahi ho paayi');
    if (voiceUri && !voicePath) return fail('voice file read nahi ho paayi');
    if (musicUrl && !musicPath) return fail('music download nahi ho paaya (internet / URL check karo)');

    let outPath = null;
    if (VideoTrim?.mixAudio) {
      try {
        outPath = await mergeWithVideoTrim({ videoPath, voicePath, musicPath, vol });
      } catch (e) {
        lastError = `video-trim mixAudio failed: ${e?.message || e}`;
        console.warn('[mergeAudioOnDevice]', lastError);
        outPath = null;
      }
    }
    if (!outPath && FFmpegKit) {
      try {
        outPath = await mergeWithFFmpegKit({ videoPath, voicePath, musicPath, vol });
      } catch (e) {
        lastError = `${lastError ? `${lastError} | ` : ''}${e?.message || e}`;
        console.warn('[mergeAudioOnDevice]', lastError);
        outPath = null;
      }
    }
    if (!outPath) return fail(lastError || 'merge fail');
    if (!(await fileOk(outPath))) return fail('merge success bola par output file khaali/missing hai');
    return withFileScheme(outPath);
  } catch (e) {
    return fail(`error: ${e?.message || e}`);
  }
}

export const isOnDeviceMergeAvailable = () => !!(VideoTrim?.mixAudio || FFmpegKit);