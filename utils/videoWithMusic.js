// utils/videoWithMusic.js
// Video ko uske FRAME (breaking-news banner + chalta hua title) aur MUSIC (backend `music_url`)
// ke saath ek final file me badalta hai — download aur share dono isi se jaate hain.
//
//  - WEB    : browser me hi canvas par video + frame + scrolling text banakar, music mix karke record karta hai
//             (MediaRecorder + WebAudio). Video ki length jitna time lagta hai (real-time).
//  - NATIVE : music `react-native-video-trim` se asli MP4 me merge hota hai.
//             Frame native par sirf tab judta hai jab backend ne use pehle se video me merge kiya ho (`frameMerged`).
//
// Hamesha { uri, merged, ext, error, owned } return karta hai (throw nahi karta).
//   merged=false => kuch judaa nahi (error me wajah) — caller original video hi use kare.
//   owned=true   => (web) uri naya blob: URL hai, caller baad me revoke kare.
import { Image as RNImage, Platform } from 'react-native';
import { resolveMusicUrl } from '../constants/musicLibrary';
import { getFrameTemplate } from '../constants/frameTemplates';
import { FRAME_DATA_URIS } from '../constants/frameBase64';
import { mergeAudioOnDevice, getLastMergeError } from './mergeAudioOnDevice';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from './webMediaStore';

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(Number(n)) ? Number(n) : 0.6));
const squash = (t) => String(t || '').replace(/\s+/g, ' ').trim();

export const hasMusic = (musicUrl) => Boolean(String(musicUrl || '').trim());

// Web par CORS bypass ke liye media requests proxy route se bhejte hain
export function toCorsSafeMediaUrl(url) {
  if (Platform.OS !== 'web') return url;
  let s = String(url || '').trim();
  if (!s) return s;
  if (/^(blob:|data:|file:|content:)/i.test(s)) return s;

  // Map any /storage/ url to /storage-proxy/ so that storage-proxy.php adds CORS and forwards to backend
  if (s.includes('/storage/')) {
    s = s.replace(/^https?:\/\/[^/]+\/storage\//i, '/storage-proxy/');
    if (s.startsWith('/storage/')) {
      s = s.replace(/^\/storage\//, '/storage-proxy/');
    }
  }
  return s;
}

// story => frame options. News me frame hamesha news content ke saath burn hota hai.
export function frameOptsFromStory(story) {
  if (!story) return { templateId: 'glossy2', title: 'RTI NEWS', description: '' };
  const title = story.title || story.headline || story.name || '';
  const desc = story.description || story.excerpt || story.subtitle || story.caption || '';
  return {
    templateId: story.frameTemplate || 'glossy2',
    title: title || 'RTI NEWS',
    description: desc,
  };
}

// Image par frame: image news me frame hamesha dikhta hai — download / share ke liye
export function imageFrameOptsFromStory(story) {
  return frameOptsFromStory(story);
}

// story => { musicUrl, musicVolume, muteOriginal, voiceUri, frame } (download / share ko ek hi object me dene ke liye)
export function exportOptsFromStory(story) {
  return {
    musicUrl: story?.musicUrl || story?.music_url || '',
    musicVolume: story?.musicVolume ?? story?.music_volume ?? 0.6,
    muteOriginal: Boolean(story?.muteOriginal),
    voiceUri: story?.voiceUri || story?.voice_url || null,
    frame: frameOptsFromStory(story),
  };
}

export const needsVideoMerge = (opts) => Boolean(opts && (hasMusic(opts.musicUrl) || opts.voiceUri || opts.frame));

// ───────────────────────── WEB ─────────────────────────
const OUT_W = 1280;
const OUT_H = 720;   // app me media box 16:9 hota hai — download bhi wahi dikhta hai

const loadImage = (src) => new Promise((res, rej) => {
  const img = new window.Image();
  if (/^https?:/i.test(src)) {
    img.crossOrigin = 'anonymous';
  }
  img.onload = () => res(img);
  img.onerror = () => rej(new Error(`Failed to load frame image (${src})`));
  img.src = src;
});

function resolveFrameAssetUri(asset, templateFile = '') {
  if (!asset) return templateFile ? `/assets/frames/${String(templateFile).replace(/\.png$/i, '')}.png` : '';
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'object') {
    if (typeof asset.default === 'string') return asset.default;
    if (asset.default?.uri) return asset.default.uri;
    if (typeof asset.uri === 'string') return asset.uri;
  }
  try {
    // eslint-disable-next-line global-require
    const { getAssetByID } = require('react-native-web/dist/cjs/modules/AssetRegistry');
    const a = getAssetByID(asset);
    if (a) {
      const scale = a.scales && a.scales.length ? a.scales[0] : 1;
      const suffix = scale !== 1 ? `@${scale}x` : '';
      return `${a.httpServerLocation}/${a.name}${suffix}.${a.type}`;
    }
  } catch (_) {}
  try {
    if (typeof RNImage?.resolveAssetSource === 'function') {
      const src = RNImage.resolveAssetSource(asset);
      if (src?.uri) return src.uri;
    }
  } catch (_) {}
  if (templateFile) {
    return `/assets/frames/${String(templateFile).replace(/\.png$/i, '')}.png`;
  }
  return '';
}

// NewsFrameOverlay ke bands jaisa hi: text, color, speed — canvas par draw karne ke liye ready
async function prepareFrame(ctx, frame) {
  const tpl = getFrameTemplate(frame?.templateId);
  const bannerH = Math.round(OUT_W / (tpl?.aspect || (1080 / 135)));
  const title = squash(frame?.title) || 'RTI NEWS';
  const desc = squash(frame?.description);

  let img = null;
  // 1. Instant base64 data URI first (0ms load, NO network request, NO CORS, NO 404)
  const b64 = (FRAME_DATA_URIS && (FRAME_DATA_URIS[tpl?.id] || FRAME_DATA_URIS.glossy2)) || null;
  if (b64) {
    try {
      img = await loadImage(b64);
    } catch (_) {}
  }

  // 2. Candidate URIs fallback if base64 did not decode
  if (!img) {
    const candidateUris = [
      resolveFrameAssetUri(tpl?.asset, tpl?.file),
      tpl?.file ? `/assets/frames/${String(tpl.file).replace(/\.png$/i, '')}.png` : '',
      tpl?.file ? `./assets/frames/${String(tpl.file).replace(/\.png$/i, '')}.png` : '',
      tpl?.file ? `/assets/frames/${tpl.file}` : '',
    ].filter(Boolean);

    for (let src of candidateUris) {
      try {
        if (typeof window !== 'undefined' && !/^(https?:|data:|blob:|\/)/i.test(src)) {
          src = `/${src}`;
        }
        img = await loadImage(src);
        if (img) break;
      } catch (_) {}
    }
  }

  // NOTE: Even if img is null, WE DO NOT THROW! drawFrame will draw the Breaking News banner natively!
  const bands = (tpl?.bands || []).map((b) => {
    let text = '';
    if (b.source === 'title') text = title.toUpperCase();
    else if (b.source === 'description') text = desc || b.fallback || '';
    else text = [title, desc].filter(Boolean).join('   |   ');
    const bw = Math.round(OUT_W * (b.right - b.left));
    const bh = Math.round(bannerH * b.height);
    const fontSize = Math.max(10, Math.round(bh * 0.62));
    const font = `800 ${fontSize}px Roboto, "Noto Sans Devanagari", sans-serif`;
    return { b, text, bw, bh, font, x: Math.round(OUT_W * b.left), y: OUT_H - bannerH + Math.round(bannerH * b.top) };
  });
  try { await Promise.all(bands.filter((x) => x.text).map((x) => document.fonts.load(x.font, x.text))); } catch (_) { /* ignore */ }
  const SEP = '   ◆   ';
  bands.forEach((x) => {
    ctx.font = x.font;
    x.tw = ctx.measureText(x.text).width;
    x.unitW = x.tw + ctx.measureText(SEP).width;
  });
  return { img, bannerH, bands, SEP };
}

function drawFrame(ctx, fr, t) {
  const bannerH = fr.bannerH || 90;
  const y0 = OUT_H - bannerH;

  if (fr.img) {
    ctx.drawImage(fr.img, 0, y0, OUT_W, bannerH);
  } else {
    // Vector Breaking News lower-third banner fallback:
    // 1. Dark red gradient bar
    const grad = ctx.createLinearGradient(0, y0, OUT_W, y0 + bannerH);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.5, '#991b1b');
    grad.addColorStop(1, '#b91c1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y0, OUT_W, bannerH);

    // 2. Top gold line
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, y0, OUT_W, 4);

    // 3. Left angled yellow "BREAKING" badge
    const badgeW = Math.round(OUT_W * 0.22);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(badgeW, y0);
    ctx.lineTo(badgeW - 20, y0 + bannerH);
    ctx.lineTo(0, y0 + bannerH);
    ctx.closePath();
    ctx.fill();

    // 4. "BREAKING" badge text
    ctx.font = '900 28px Roboto, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText('BREAKING', 18, y0 + bannerH / 2);
  }

  // Continuous marquee text ticker across the banner:
  fr.bands.forEach((x) => {
    if (!x.text || !x.unitW) return;
    const sp = (x.b.speed || 45) * (OUT_W / 640);              // display width ~640px ki speed ke barabar
    // Continuous leftward marquee starting immediately at frame 0 (no blank intro delay)
    const shift = (sp * t) % x.unitW;
    const off = -shift;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x.x, x.y, x.bw, x.bh);
    ctx.clip();
    ctx.font = x.font;
    ctx.textBaseline = 'middle';
    const cy = x.y + x.bh / 2;
    for (let px = off; px < x.bw; px += x.unitW) {
      ctx.fillStyle = x.b.color || '#fff';
      ctx.fillText(x.text, x.x + px, cy);
      ctx.fillStyle = x.b.sep || '#FBBF24';
      ctx.fillText(fr.SEP, x.x + px + x.tw, cy);
    }
    ctx.restore();
  });
}

async function composeOnWeb(videoSrc, { musicSrc, voiceSrc, musicVolume, muteOriginal, frame }) {
  const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  if (!AC || typeof MediaRecorder === 'undefined') throw new Error('Video export is not supported in this browser.');
  const toRevoke = [];
  let ctx = null;
  let raf = 0;
  let paintTimer = null;
  let video = null;
  try {
    let vSrc = toCorsSafeMediaUrl(videoSrc);
    if (isIdbMediaUri(vSrc)) {
      vSrc = await resolveIdbMediaUriToObjectUrl(vSrc);
      if (!vSrc) throw new Error('Media not available');
      toRevoke.push(vSrc);
    }
    // Same-origin blob (warna browser captureStream / canvas ko block kar deta hai)
    let videoBlobUrl = vSrc;
    if (!/^(blob:|data:)/i.test(vSrc)) {
      let fetched = false;
      try {
        const vr = await fetch(vSrc, { mode: 'cors', cache: 'no-store' });
        if (vr && vr.ok) {
          videoBlobUrl = URL.createObjectURL(await vr.blob());
          toRevoke.push(videoBlobUrl);
          fetched = true;
        }
      } catch (_) {}

      // Fallback 1: Agar /storage-proxy/ 404 de to direct /storage/ ya full url try karo
      if (!fetched) {
        const alt = vSrc.includes('/storage-proxy/')
          ? vSrc.replace('/storage-proxy/', '/storage/')
          : (vSrc.includes('/storage/') ? vSrc.replace('/storage/', '/storage-proxy/') : vSrc);
        if (alt !== vSrc) {
          try {
            const vr2 = await fetch(alt, { mode: 'cors', cache: 'no-store' });
            if (vr2 && vr2.ok) {
              videoBlobUrl = URL.createObjectURL(await vr2.blob());
              toRevoke.push(videoBlobUrl);
              fetched = true;
            }
          } catch (_) {}
        }
      }

      // Fallback 2: Agar fetch block ho jaye to direct src video element par set hoga
      if (!fetched) {
        videoBlobUrl = vSrc;
      }
    }

    ctx = new AC();
    try { await ctx.resume(); } catch (_) { /* ignore */ }

    let music = null;
    if (musicSrc) {
      try {
        const mUrl = toCorsSafeMediaUrl(musicSrc);
        let mr = await fetch(mUrl, { mode: 'cors', cache: 'no-store' }).catch(() => null);
        if (!mr || !mr.ok) {
          const fn = String(musicSrc).split('?')[0].split(/[\\/]/).pop();
          if (fn && fn.endsWith('.mp3')) {
            mr = await fetch(`/assets/music/${fn}`, { mode: 'cors', cache: 'no-store' }).catch(() => null);
          }
        }
        if (mr && mr.ok) {
          const buf = await mr.arrayBuffer();
          music = await new Promise((res, rej) => {
            const p = ctx.decodeAudioData(buf, res, rej);
            if (p && p.catch) p.catch(rej);
          });
        }
      } catch (err) {
        console.warn('[composeOnWeb] music decode error:', err);
      }
    }

    let voice = null;
    if (voiceSrc) {
      try {
        const vUrl = toCorsSafeMediaUrl(voiceSrc);
        const vr = await fetch(vUrl, { mode: 'cors', cache: 'no-store' });
        if (vr.ok) {
          const vbuf = await vr.arrayBuffer();
          voice = await new Promise((res, rej) => {
            const p = ctx.decodeAudioData(vbuf, res, rej);
            if (p && p.catch) p.catch(rej);
          });
        }
      } catch (err) {
        console.warn('[composeOnWeb] voice decode error:', err);
      }
    }

    video = document.createElement('video');
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.src = videoBlobUrl;

    // Attach in document viewport with tiny dimensions so mobile Chrome actively renders frames and never suspends it
    video.style.position = 'fixed';
    video.style.top = '0px';
    video.style.left = '0px';
    video.style.width = '160px';
    video.style.height = '90px';
    video.style.opacity = '0.01';
    video.style.zIndex = '-9999';
    video.style.pointerEvents = 'none';
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(video);
    }

    await new Promise((res, rej) => {
      let settled = false;
      const onReady = () => {
        if (settled) return;
        settled = true;
        res();
      };
      if (video.readyState >= 3) {
        onReady();
        return;
      }
      video.oncanplay = onReady;
      video.oncanplaythrough = onReady;
      video.onloadeddata = onReady;
      video.onloadedmetadata = onReady;
      video.onerror = () => rej(new Error('Failed to load video.'));
      setTimeout(onReady, 6000);
    });

    // Accurately determine video duration
    let targetDuration = (Number.isFinite(video.duration) && video.duration > 0 && video.duration !== Infinity)
      ? video.duration
      : 0;

    // If duration is unknown/Infinity (e.g. fragmented WebM or some mobile browsers):
    if (targetDuration <= 0) {
      await new Promise((r) => {
        let done = false;
        const onSeeked = () => {
          if (done) return;
          done = true;
          video.removeEventListener('seeked', onSeeked);
          if (Number.isFinite(video.duration) && video.duration > 0 && video.duration !== Infinity) {
            targetDuration = video.duration;
          } else if (Number.isFinite(video.currentTime) && video.currentTime > 0) {
            targetDuration = video.currentTime;
          }
          r();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = 1e6;
        setTimeout(onSeeked, 800);
      });
    }

    // ALWAYS ensure video is rewound to 0 and wait for seeked event before recording starts
    if (video.currentTime > 0.05) {
      await new Promise((r) => {
        let done = false;
        const onSeeked0 = () => {
          if (done) return;
          done = true;
          video.removeEventListener('seeked', onSeeked0);
          r();
        };
        video.addEventListener('seeked', onSeeked0);
        video.currentTime = 0;
        setTimeout(onSeeked0, 800);
      });
    }

    // ── audio graph: (video ki awaaz) + music + voice => ek stream ──
    const dest = ctx.createMediaStreamDestination();
    if (muteOriginal) {
      video.muted = true;
    } else {
      try {
        const srcNode = ctx.createMediaElementSource(video);
        srcNode.connect(dest);
      } catch (err) {
        console.warn('[composeOnWeb] video element audio connect warning:', err);
      }
    }
    let mSrc = null;
    if (music) {
      mSrc = ctx.createBufferSource();
      mSrc.buffer = music;
      mSrc.loop = true;
      const g = ctx.createGain();
      g.gain.value = clamp01(musicVolume);
      mSrc.connect(g);
      g.connect(dest);
    }
    let vSrcNode = null;
    if (voice) {
      vSrcNode = ctx.createBufferSource();
      vSrcNode.buffer = voice;
      vSrcNode.loop = false;
      const vg = ctx.createGain();
      vg.gain.value = 1.0;
      vSrcNode.connect(vg);
      vg.connect(dest);
    }

    // Keep WebAudio clock running reliably
    let silentSrc = null;
    if (!music && !voice) {
      try {
        const silentBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        silentSrc = ctx.createBufferSource();
        silentSrc.buffer = silentBuf;
        silentSrc.loop = true;
        silentSrc.connect(dest);
        silentSrc.start(0);
      } catch (_) {}
    }

    // ── video track: frame ho to canvas (video + banner + scrolling text), warna video ki apni track ──
    let videoTracks;
    let startDraw = () => {};
    if (frame) {
      const canvas = document.createElement('canvas');
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const c2d = canvas.getContext('2d');
      const fr = await prepareFrame(c2d, frame);
      let t0 = 0;
      const render = () => {
        c2d.fillStyle = '#000';
        c2d.fillRect(0, 0, OUT_W, OUT_H);
        const vw = video.videoWidth || OUT_W;
        const vh = video.videoHeight || OUT_H;
        const s = Math.min(OUT_W / vw, OUT_H / vh);
        const dw = vw * s;
        const dh = vh * s;
        try { c2d.drawImage(video, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh); } catch (_) { /* ignore */ }
        const curTime = (video && Number.isFinite(video.currentTime) && video.currentTime > 0)
          ? video.currentTime
          : Math.max(0, (performance.now() - t0) / 1000);
        drawFrame(c2d, fr, curTime);
      };
      const loop = () => {
        render();
        raf = requestAnimationFrame(loop);
      };
      startDraw = () => {
        t0 = performance.now();
        loop();
        paintTimer = setInterval(render, 1000 / 30);
      };
      videoTracks = canvas.captureStream(30).getVideoTracks();
    } else {
      const cap = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
      if (!cap) throw new Error('Browser does not support video.captureStream.');
      videoTracks = cap.getVideoTracks();
    }
    const stream = new MediaStream([...videoTracks, ...dest.stream.getAudioTracks()]);

    const mimes = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = mimes.find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (_) { return false; } }) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res, rej) => {
      rec.onstop = res;
      rec.onerror = (e) => rej(e?.error || new Error('Recorder error'));
    });

    rec.start(250);
    if (mSrc) mSrc.start(0);
    if (vSrcNode) vSrcNode.start(0);

    video.currentTime = 0;
    video.playbackRate = 1.0;
    video.muted = Boolean(muteOriginal);
    try {
      await video.play();
    } catch (playErr) {
      console.warn('[composeOnWeb] video.play() warning:', playErr);
      video.muted = true;
      await video.play().catch(() => {});
    }
    startDraw();

    await new Promise((resolve) => {
      let isDone = false;
      let maxTimeReached = 0;
      const finish = () => {
        if (isDone) return;
        isDone = true;
        resolve();
      };

      // 1. Timeupdate: check if currentTime reached full video duration
      const onTimeUpdate = () => {
        if (Number.isFinite(video.duration) && video.duration > targetDuration && video.duration !== Infinity) {
          targetDuration = video.duration;
        }
        if (Number.isFinite(video.currentTime) && video.currentTime > maxTimeReached) {
          maxTimeReached = video.currentTime;
        }
        if (targetDuration > 0 && video.currentTime >= targetDuration - 0.25) {
          finish();
        }
      };
      video.addEventListener('timeupdate', onTimeUpdate);

      // 2. Ended: finish when video completes its full playback
      video.onended = () => {
        if (targetDuration > 0) {
          if (video.currentTime >= targetDuration - 0.5 || maxTimeReached >= targetDuration - 0.5) {
            finish();
          } else {
            console.warn(`[composeOnWeb] premature onended at ${video.currentTime}s of ${targetDuration}s, resuming...`);
            video.play().catch(() => {});
          }
        } else {
          if (video.currentTime >= 3 || maxTimeReached >= 3) {
            finish();
          }
        }
      };

      // 3. Pause protection: if mobile Chrome pauses video, resume it
      video.onpause = () => {
        if (!isDone) {
          if (targetDuration <= 0 || (video.currentTime < targetDuration - 0.3 && maxTimeReached < targetDuration - 0.3)) {
            video.play().catch(() => {});
          }
        }
      };

      // 4. Hard safety timeout: scaled with video duration (jitne minutes ka video utna time pura record hoga)
      const maxWait = Math.max(30000, ((targetDuration > 0 ? targetDuration : 300) + 15) * 1000);
      setTimeout(finish, maxWait);
    });

    await new Promise((r) => setTimeout(r, 300));   // aakhri frames flush
    try { if (mSrc) mSrc.stop(); } catch (_) { /* ignore */ }
    try { if (vSrcNode) vSrcNode.stop(); } catch (_) { /* ignore */ }
    try { if (silentSrc) silentSrc.stop(); } catch (_) { /* ignore */ }
    try { video.pause(); } catch (_) { /* ignore */ }
    if (rec.state !== 'inactive') rec.stop();
    await stopped;

    if (!chunks.length) throw new Error('Final video khaali aayi.');
    const outType = String(rec.mimeType || mime || 'video/webm').split(';')[0];
    const blob = new Blob(chunks, { type: outType });
    return { uri: URL.createObjectURL(blob), ext: outType.includes('mp4') ? 'mp4' : 'webm', blob };
  } finally {
    if (paintTimer) clearInterval(paintTimer);
    if (raf) cancelAnimationFrame(raf);
    try { if (ctx) ctx.close(); } catch (_) { /* ignore */ }
    if (typeof document !== 'undefined' && video && video.parentNode) {
      video.parentNode.removeChild(video);
    }
    toRevoke.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) { /* ignore */ } });
  }
}

// Image ko breaking-news frame aur chalta hua text (aur music/voice agar ho) ke sath ek 6-second MP4 Video Reel banata hai
export async function composeFramedImageAsVideoWeb(imageSrc, { frame, musicUrl = '', voiceUri = null, musicVolume = 0.6, duration = 6 } = {}) {
  const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  if (!AC || typeof MediaRecorder === 'undefined') throw new Error('Video export is not supported in this browser.');
  const toRevoke = [];
  let ctx = null;
  let raf = 0;
  let paintTimer = null;
  let video = null;
  try {
    let src = toCorsSafeMediaUrl(String(imageSrc || ''));
    if (!src) throw new Error('Image missing.');
    if (isIdbMediaUri(src)) {
      src = await resolveIdbMediaUriToObjectUrl(src);
      if (!src) throw new Error('Media not available');
      toRevoke.push(src);
    }
    if (!/^(blob:|data:)/i.test(src)) {
      try {
        const r = await fetch(src, { mode: 'cors', cache: 'no-store' });
        if (r.ok) {
          src = URL.createObjectURL(await r.blob());
          toRevoke.push(src);
        }
      } catch (_) {}
    }
    const img = await loadImage(src);

    ctx = new AC();
    try { await ctx.resume(); } catch (_) {}
    const dest = ctx.createMediaStreamDestination();

    let mSrc = null;
    if (musicUrl) {
      try {
        const mResolved = await resolveMusicUrl(musicUrl);
        if (mResolved) {
          let mr = await fetch(toCorsSafeMediaUrl(mResolved), { mode: 'cors', cache: 'no-store' }).catch(() => null);
          if (!mr || !mr.ok) {
            const fn = String(mResolved).split('?')[0].split(/[\\/]/).pop();
            if (fn && fn.endsWith('.mp3')) {
              mr = await fetch(`/assets/music/${fn}`, { mode: 'cors', cache: 'no-store' }).catch(() => null);
            }
          }
          if (mr && mr.ok) {
            const buf = await mr.arrayBuffer();
            const musicBuf = await ctx.decodeAudioData(buf);
            mSrc = ctx.createBufferSource();
            mSrc.buffer = musicBuf;
            mSrc.loop = true;
            const g = ctx.createGain();
            g.gain.value = clamp01(musicVolume);
            mSrc.connect(g);
            g.connect(dest);
          }
        }
      } catch (err) {
        console.warn('[composeFramedImageAsVideoWeb] music decode error:', err);
      }
    }

    let vSrc = null;
    if (voiceUri) {
      try {
        const vr = await fetch(toCorsSafeMediaUrl(voiceUri), { mode: 'cors', cache: 'no-store' });
        if (vr.ok) {
          const vbuf = await vr.arrayBuffer();
          const voiceBuf = await ctx.decodeAudioData(vbuf);
          vSrc = ctx.createBufferSource();
          vSrc.buffer = voiceBuf;
          const vg = ctx.createGain();
          vg.gain.value = 1.0;
          vSrc.connect(vg);
          vg.connect(dest);
        }
      } catch (err) {
        console.warn('[composeFramedImageAsVideoWeb] voice decode error:', err);
      }
    }

    let silentSrc = null;
    if (!mSrc && !vSrc) {
      try {
        const silentBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        silentSrc = ctx.createBufferSource();
        silentSrc.buffer = silentBuf;
        silentSrc.loop = true;
        silentSrc.connect(dest);
      } catch (_) {}
    }

    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const c2d = canvas.getContext('2d');
    const fr = frame ? await prepareFrame(c2d, frame) : null;

    let t0 = 0;
    const render = () => {
      c2d.fillStyle = '#0f172a';
      c2d.fillRect(0, 0, OUT_W, OUT_H);
      const s = Math.min(OUT_W / img.width, OUT_H / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      try { c2d.drawImage(img, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh); } catch (_) {}
      const curTime = Math.max(0, (performance.now() - t0) / 1000);
      if (fr) drawFrame(c2d, fr, curTime);
    };

    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };

    const videoTracks = canvas.captureStream(30).getVideoTracks();
    const audioTracks = dest.stream.getAudioTracks();
    const stream = new MediaStream([...videoTracks, ...audioTracks]);

    const mimes = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = mimes.find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch (_) { return false; } }) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res, rej) => {
      rec.onstop = res;
      rec.onerror = (e) => rej(e?.error || new Error('Recorder error'));
    });

    rec.start(250);
    if (mSrc) mSrc.start(0);
    if (vSrc) vSrc.start(0);
    if (silentSrc) silentSrc.start(0);
    t0 = performance.now();
    loop();
    paintTimer = setInterval(render, 1000 / 30);

    const runDur = Math.max(5, Math.min(duration || 8, 15));
    await new Promise((r) => setTimeout(r, runDur * 1000));
    try { if (mSrc) mSrc.stop(); } catch (_) {}
    try { if (vSrc) vSrc.stop(); } catch (_) {}
    try { if (silentSrc) silentSrc.stop(); } catch (_) {}
    if (rec.state !== 'inactive') rec.stop();
    await stopped;

    if (!chunks.length) throw new Error('Video generation failed.');
    const outType = String(rec.mimeType || mime || 'video/webm').split(';')[0];
    const blob = new Blob(chunks, { type: outType });
    return { uri: URL.createObjectURL(blob), ext: outType.includes('mp4') ? 'mp4' : 'webm', blob };
  } finally {
    if (paintTimer) clearInterval(paintTimer);
    if (raf) cancelAnimationFrame(raf);
    try { if (ctx) ctx.close(); } catch (_) {}
    toRevoke.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) {} });
  }
}

// ───────────────────────── PUBLIC ─────────────────────────
/**
 * @param {string} videoUri   remote https / file:// / blob: video
 * @param {{musicUrl?:string, voiceUri?:string|null, musicVolume?:number, muteOriginal?:boolean, frame?:{templateId?:string,title?:string,description?:string}|null}} opts
 */
export async function getVideoWithMusic(videoUri, opts = {}) {
  const { musicUrl = '', voiceUri = null, musicVolume = 0.6, muteOriginal = false, frame = null } = opts || {};
  const base = { uri: videoUri, merged: false, ext: null, error: null, owned: false, blob: null };
  if (!videoUri) return { ...base, error: 'Video missing.' };
  if (!hasMusic(musicUrl) && !voiceUri && !frame) return base;          // na music, na voice, na frame => original hi sahi
  try {
    let music = null;
    if (hasMusic(musicUrl)) {
      music = await resolveMusicUrl(musicUrl);
      if (!music) return { ...base, error: 'Music file not found in app.' };
    }

    if (Platform.OS === 'web') {
      const out = await composeOnWeb(String(videoUri), { musicSrc: music, voiceSrc: voiceUri, musicVolume, muteOriginal, frame });
      return { uri: out.uri, merged: true, ext: out.ext, error: null, owned: true, blob: out.blob };
    }

    if (!music && !voiceUri) return base;
    const merged = await mergeAudioOnDevice({ videoUri, voiceUri, musicUrl: music, musicVolume, muteOriginal });
    if (!merged) return { ...base, error: getLastMergeError() || 'Failed to merge audio.' };
    return { uri: merged, merged: true, ext: 'mp4', error: null, owned: false, blob: null };
  } catch (e) {
    return { ...base, error: e?.message || 'Failed to prepare video.' };
  }
}

export default getVideoWithMusic;