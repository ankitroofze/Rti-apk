// utils/saveFramedVideo.js
// Video + frame (PNG overlay) + music ko phone par FFmpeg se merge karke gallery me save karta hai.
//
// Flow: permission -> purani files delete -> download (video/frame/music) -> ffprobe -> ffmpeg merge
//       -> CameraRoll.save -> (finally) temp files cleanup.
import RNFS from 'react-native-fs';
import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { ensureGalleryPermission } from './permissions';
import { KEEP_ORIGINAL_AUDIO, MUSIC_VOLUME, ORIGINAL_VOLUME } from '../constants/mediaConfig';

const TMP_DIR = RNFS.CachesDirectoryPath;
const PREFIX = 'fp_'; // humari saari temp/output files isi prefix se -> cleanup aasaan

const extOf = (url, fallback) => {
  const m = String(url).split('#')[0].split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : fallback;
};

const safeUnlink = async (path) => {
  try { if (path && (await RNFS.exists(path))) await RNFS.unlink(path); } catch (_) { /* ignore */ }
};

// Purane output / bachi hui temp files (pichhli baar crash ya cancel se) pehle hi hata do.
async function deleteOldFiles() {
  try {
    const items = await RNFS.readDir(TMP_DIR);
    await Promise.all(items.filter((f) => f.name.startsWith(PREFIX)).map((f) => safeUnlink(f.path)));
  } catch (_) { /* ignore */ }
}

async function download(url, dest, onFraction) {
  const { promise } = RNFS.downloadFile({
    fromUrl: url,
    toFile: dest,
    background: false,
    progressDivider: 5,
    progress: (p) => onFraction?.(p.contentLength > 0 ? p.bytesWritten / p.contentLength : 0),
  });
  const res = await promise;
  if (res.statusCode !== 200) throw new Error(`Download fail (${res.statusCode}): ${url}`);
}

async function probe(path) {
  const session = await FFprobeKit.getMediaInformation(path);
  const info = session.getMediaInformation();
  if (!info) throw new Error('Video read nahi ho paaya');
  const duration = parseFloat(info.getDuration()) || 0; // seconds
  const hasAudio = (info.getStreams() || []).some((s) => s.getType() === 'audio');
  return { duration, hasAudio };
}

function runFfmpeg(args, totalMs, onFraction) {
  return new Promise((resolve, reject) => {
    FFmpegKit.executeWithArgumentsAsync(
      args,
      async (session) => {
        const rc = await session.getReturnCode();
        if (ReturnCode.isSuccess(rc)) return resolve();
        const logs = (await session.getAllLogsAsString()) || '';
        return reject(new Error(`Video merge fail: ${logs.slice(-300)}`));
      },
      undefined,
      (stats) => { if (totalMs > 0) onFraction?.(Math.min(1, stats.getTime() / totalMs)); },
    );
  });
}

/**
 * @param {object}   p
 * @param {string}   p.videoUrl   original video (full URL)
 * @param {string=}  p.frameUrl   transparent PNG overlay (full URL)
 * @param {string=}  p.musicUrl   music (full URL)
 * @param {boolean=} p.keepOriginalAudio  default config se
 * @param {(s:{stage:string,percent:number})=>void=} p.onProgress  percent 0..100
 */
export async function saveFramedVideo({
  videoUrl, frameUrl, musicUrl, keepOriginalAudio = KEEP_ORIGINAL_AUDIO, onProgress,
}) {
  if (!videoUrl) throw new Error('Video URL missing');
  if (!(await ensureGalleryPermission())) throw new Error('Gallery permission nahi mili');

  const report = (stage, percent) => onProgress?.({ stage, percent: Math.round(percent) });
  const id = Date.now();
  const vPath = `${TMP_DIR}/${PREFIX}${id}_video.${extOf(videoUrl, 'mp4')}`;
  const fPath = frameUrl ? `${TMP_DIR}/${PREFIX}${id}_frame.${extOf(frameUrl, 'png')}` : null;
  const mPath = musicUrl ? `${TMP_DIR}/${PREFIX}${id}_music.${extOf(musicUrl, 'mp3')}` : null;
  const outPath = `${TMP_DIR}/${PREFIX}${id}_out.mp4`;

  await deleteOldFiles(); // purani output file pehle delete

  try {
    // ── 1) Download: progress 0..35% ─────────────────────────────────────────
    const jobs = [[videoUrl, vPath], [frameUrl, fPath], [musicUrl, mPath]].filter(([u, p]) => u && p);
    const fractions = jobs.map(() => 0);
    await Promise.all(jobs.map(([u, p], i) => download(u, p, (f) => {
      fractions[i] = f;
      report('Downloading', (fractions.reduce((a, b) => a + b, 0) / jobs.length) * 35);
    })));

    // ── 2) Probe: duration + audio stream hai ya nahi ────────────────────────
    const { duration, hasAudio } = await probe(vPath);

    // ── 3) FFmpeg args ───────────────────────────────────────────────────────
    const args = ['-y', '-i', vPath];
    let n = 1;
    let frameIdx = -1;
    let musicIdx = -1;
    if (fPath) { args.push('-i', fPath); frameIdx = n++; }
    // -stream_loop input option hai: ISSE PEHLE -i par lagta hai. Music chhota ho to loop hota hai.
    if (mPath) { args.push('-stream_loop', '-1', '-i', mPath); musicIdx = n++; }

    const fg = [];
    // VIDEO: frame ko video ke size par stretch karo (preview me resizeMode="stretch" ke barabar).
    // NOTE: `scale2ref=w=iw:h=ih` — is filter me "iw/ih" REFERENCE input (= video) ka size hota hai
    // (FFmpeg 6.x par test kiya). `main_w/rw/ref_w` galat nikle: ya to frame apne hi size par rehta hai
    // ya "undefined constant" error. scale2ref [0:v] (autorotate ke BAAD ka) size leta hai, isliye
    // iPhone ke rotated portrait videos me bhi frame sahi baithta hai.
    // Aakhri scale: libx264 ko even width/height chahiye.
    if (frameIdx >= 0) {
      fg.push(`[${frameIdx}:v][0:v]scale2ref=w=iw:h=ih[fr][vid]`);
      fg.push('[vid][fr]overlay=0:0:format=auto,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[v]');
    } else {
      fg.push('[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[v]');
    }

    // AUDIO (preview jaisa hi): music volume = MUSIC_VOLUME; original sirf keepOriginalAudio ho to.
    const useOriginal = keepOriginalAudio && hasAudio;
    let audioArgs = ['-an'];
    if (musicIdx >= 0) {
      if (useOriginal) {
        fg.push(`[0:a]volume=${ORIGINAL_VOLUME}[a0]`);
        fg.push(`[${musicIdx}:a]volume=${MUSIC_VOLUME}[a1]`);
        // amix inputs ko barabar baant deta hai (volume aadha) -> volume=2 se wapas barabar.
        // duration=first: video ki audio khatam = mix khatam (music loop me infinite hai).
        fg.push('[a0][a1]amix=inputs=2:duration=first:dropout_transition=0,volume=2[a]');
      } else {
        fg.push(`[${musicIdx}:a]volume=${MUSIC_VOLUME}[a]`);
      }
      audioArgs = ['-map', '[a]', '-c:a', 'aac', '-b:a', '128k'];
    } else if (useOriginal) {
      audioArgs = ['-map', '0:a', '-c:a', 'aac', '-b:a', '128k'];
    }

    args.push(
      '-filter_complex', fg.join(';'),
      '-map', '[v]', ...audioArgs,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    );
    if (musicIdx >= 0) {
      args.push('-shortest'); // output video ki length par ruke (music loop infinite hai)
      // IMPORTANT: sirf -shortest + -stream_loop -1 FFmpeg 6.1 par "No space left on device"
      // (exit 228) de raha tha. Video ki duration ka -t saath me lagao — sab versions par safe.
    }
    if (duration > 0) args.push('-t', duration.toFixed(3));
    args.push(outPath);

    // ── 4) Merge: progress 35..95% ───────────────────────────────────────────
    report('Merging frame & music', 35);
    await runFfmpeg(args, duration * 1000, (f) => report('Merging frame & music', 35 + f * 60));

    // ── 5) Gallery me save ───────────────────────────────────────────────────
    report('Saving to gallery', 97);
    await CameraRoll.save(`file://${outPath}`, { type: 'video' });
    report('Done', 100);
  } finally {
    // Temp files hamesha hatao (success ho ya error). Gallery me copy ban chuki hai.
    await Promise.all([vPath, fPath, mPath, outPath].map(safeUnlink));
  }
}