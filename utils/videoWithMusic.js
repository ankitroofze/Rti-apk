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
import { mergeAudioOnDevice, getLastMergeError } from './mergeAudioOnDevice';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from './webMediaStore';

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(Number(n)) ? Number(n) : 0.6));
const squash = (t) => String(t || '').replace(/\s+/g, ' ').trim();

export const hasMusic = (musicUrl) => Boolean(String(musicUrl || '').trim());

// Web par CORS bypass ke liye media requests proxy route se bhejte hain
export function toCorsSafeMediaUrl(url) {
  if (Platform.OS !== 'web') return url;
  const s = String(url || '').trim();
  if (!s) return s;
  if (/^https?:\/\/rtiapi\.roofze\.in\/storage\//i.test(s)) {
    return s.replace(/^https?:\/\/rtiapi\.roofze\.in\/storage\//i, '/storage-proxy/');
  }
  return s;
}

// story => frame options. Frame burn ke liye frame data return karta hai jab bhi useFrame active ho.
export function frameOptsFromStory(story) {
  if (!story || !story.useFrame) return null;
  return {
    templateId: story.frameTemplate || 'glossy2',
    title: story.title || '',
    description: story.description || story.excerpt || '',
  };
}

// Image par frame: image news me frame hamesha dikhta hai — download / share ke liye
export function imageFrameOptsFromStory(story) {
  if (!story || !story.useFrame) return null;
  return {
    templateId: story.frameTemplate || 'glossy2',
    title: story.title || '',
    description: story.description || story.excerpt || '',
  };
}

// story => { musicUrl, musicVolume, muteOriginal, voiceUri, frame } (download / share ko ek hi object me dene ke liye)
export function exportOptsFromStory(story) {
  return {
    musicUrl: story?.musicUrl || story?.music_url || '',
    musicVolume: story?.musicVolume ?? story?.music_volume ?? 0.6,
    muteOriginal: Boolean(story?.muteOriginal),
    voiceUri: story?.voiceUri || story?.voice_url || null,
    frame: frameOptsFromStory(story) || imageFrameOptsFromStory(story),
  };
}

export const needsVideoMerge = (opts) => Boolean(opts && (hasMusic(opts.musicUrl) || opts.voiceUri || opts.frame));

// ───────────────────────── WEB ─────────────────────────
const OUT_W = 1280;
const OUT_H = 720;   // app me media box 16:9 hota hai — download bhi wahi dikhta hai

const loadImage = (src) => new Promise((res, rej) => {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => res(img);
  img.onerror = () => rej(new Error('Failed to load frame image.'));
  img.src = src;
});

function resolveFrameAssetUri(asset) {
  if (!asset) return '';
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'object') {
    if (typeof asset.default === 'string') return asset.default;
    if (asset.default?.uri) return asset.default.uri;
    if (typeof asset.uri === 'string') return asset.uri;
  }
  try {
    if (typeof RNImage?.resolveAssetSource === 'function') {
      const src = RNImage.resolveAssetSource(asset);
      if (src?.uri) return src.uri;
    }
  } catch (_) {}
  return '';
}

// NewsFrameOverlay ke bands jaisa hi: text, color, speed — canvas par draw karne ke liye ready
async function prepareFrame(ctx, frame) {
  const tpl = getFrameTemplate(frame.templateId);
  const src = resolveFrameAssetUri(tpl.asset);
  if (!src) throw new Error('Frame image not found.');
  const img = await loadImage(src);
  const bannerH = Math.round(OUT_W / tpl.aspect);
  const title = squash(frame.title);
  const desc = squash(frame.description);
  const bands = (tpl.bands || []).map((b) => {
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
  ctx.drawImage(fr.img, 0, OUT_H - fr.bannerH, OUT_W, fr.bannerH);
  fr.bands.forEach((x) => {
    if (!x.text || !x.unitW) return;
    const sp = (x.b.speed || 40) * (OUT_W / 640);              // display width ~640px ki speed ke barabar
    const intro = (x.bw + x.unitW) / sp;                        // pehle right edge se andar aata hai
    const off = t < intro ? x.bw - sp * t : -(((t - intro) * sp) % x.unitW);
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
      const vr = await fetch(vSrc, { mode: 'cors', cache: 'no-store' });
      if (!vr.ok) throw new Error(`Video fetch failed (${vr.status})`);
      videoBlobUrl = URL.createObjectURL(await vr.blob());
      toRevoke.push(videoBlobUrl);
    }

    ctx = new AC();
    try { await ctx.resume(); } catch (_) { /* ignore */ }

    let music = null;
    if (musicSrc) {
      try {
        const mUrl = toCorsSafeMediaUrl(musicSrc);
        const mr = await fetch(mUrl, { mode: 'cors', cache: 'no-store' });
        if (mr.ok) {
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

    const video = document.createElement('video');
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.src = videoBlobUrl;
    await new Promise((res, rej) => {
      video.onloadedmetadata = res;
      video.onerror = () => rej(new Error('Failed to load video.'));
    });

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
      const paint = () => {
        c2d.fillStyle = '#000';
        c2d.fillRect(0, 0, OUT_W, OUT_H);
        const vw = video.videoWidth || OUT_W;
        const vh = video.videoHeight || OUT_H;
        const s = Math.min(OUT_W / vw, OUT_H / vh);
        const dw = vw * s;
        const dh = vh * s;
        try { c2d.drawImage(video, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh); } catch (_) { /* ignore */ }
        drawFrame(c2d, fr, (performance.now() - t0) / 1000);
        raf = requestAnimationFrame(paint);
      };
      startDraw = () => { t0 = performance.now(); paint(); };
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

    rec.start(500);
    if (mSrc) mSrc.start(0);
    if (vSrcNode) vSrcNode.start(0);
    await video.play();
    startDraw();
    const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 600;
    await new Promise((res) => {
      video.onended = res;
      setTimeout(res, dur * 1000 + 15000);   // safety timeout
    });
    await new Promise((r) => setTimeout(r, 250));   // aakhri frames flush
    try { if (mSrc) mSrc.stop(); } catch (_) { /* ignore */ }
    try { if (vSrcNode) vSrcNode.stop(); } catch (_) { /* ignore */ }
    try { video.pause(); } catch (_) { /* ignore */ }
    if (rec.state !== 'inactive') rec.stop();
    await stopped;

    if (!chunks.length) throw new Error('Final video khaali aayi.');
    const outType = String(rec.mimeType || mime || 'video/webm').split(';')[0];
    const blob = new Blob(chunks, { type: outType });
    return { uri: URL.createObjectURL(blob), ext: outType.includes('mp4') ? 'mp4' : 'webm', blob };
  } finally {
    if (raf) cancelAnimationFrame(raf);
    try { if (ctx) ctx.close(); } catch (_) { /* ignore */ }
    toRevoke.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) { /* ignore */ } });
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