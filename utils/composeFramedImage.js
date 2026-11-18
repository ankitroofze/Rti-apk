// utils/composeFramedImage.js
// WEB: image + breaking-news frame (banner + title/description text) ko canvas par jodkar ek JPG banata hai.
// (Native par ye kaam components/FramedExportView.js + react-native-view-shot karta hai.)
// Hamesha { uri, blob, ext } return karta hai ya throw karta hai (caller fallback karega).
import { Image as RNImage } from 'react-native';
import { getFrameTemplate } from '../constants/frameTemplates';
import { FRAME_DATA_URIS } from '../constants/frameBase64';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from './webMediaStore';
import { toCorsSafeMediaUrl } from './videoWithMusic';

const OUT_W = 1280;
const OUT_H = 720; // app ka media box 16:9 hai — download bhi wahi dikhta hai

const squash = (t) => String(t || '').replace(/\s+/g, ' ').trim();

const loadImage = (src) => new Promise((res, rej) => {
  const img = new window.Image();
  if (/^https?:/i.test(src)) {
    img.crossOrigin = 'anonymous';
  }
  img.onload = () => res(img);
  img.onerror = () => rej(new Error(`Failed to load image (${src})`));
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

// text ko band ki width me fit karo (static image me scroll nahi hota, isliye "…" lagta hai)
function fitText(ctx, text, maxW) {
  if (!text || ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

export async function composeFramedImageWeb(imageSrc, frame) {
  const toRevoke = [];
  try {
    let src = toCorsSafeMediaUrl(String(imageSrc || ''));
    if (!src) throw new Error('Image missing.');
    if (isIdbMediaUri(src)) {
      src = await resolveIdbMediaUriToObjectUrl(src);
      if (!src) throw new Error('Media not available');
      toRevoke.push(src);
    }
    // same-origin blob (warna canvas "tainted" ho jaata hai)
    if (!/^(blob:|data:)/i.test(src)) {
      try {
        const r = await fetch(src, { mode: 'cors', cache: 'no-store' });
        if (r.ok) {
          src = URL.createObjectURL(await r.blob());
          toRevoke.push(src);
        }
      } catch (err) {
        console.warn('[composeFramedImageWeb] fetch blob fallback to direct src:', err);
      }
    }
    const img = await loadImage(src);

    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    const s = Math.min(OUT_W / img.width, OUT_H / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh);

    if (frame) {
      const tpl = getFrameTemplate(frame.templateId);
      const bannerH = Math.round(OUT_W / (tpl?.aspect || (1080 / 135)));
      const y0 = OUT_H - bannerH;

      let fimg = null;
      // 1. Instant base64 data URI first (0ms load, NO network request, NO CORS, NO 404)
      const b64 = (FRAME_DATA_URIS && (FRAME_DATA_URIS[tpl?.id] || FRAME_DATA_URIS.glossy2)) || null;
      if (b64) {
        try {
          fimg = await loadImage(b64);
        } catch (_) {}
      }

      if (!fimg) {
        const candidateUris = [
          resolveFrameAssetUri(tpl?.asset, tpl?.file),
          tpl?.file ? `/assets/frames/${String(tpl.file).replace(/\.png$/i, '')}.png` : '',
          tpl?.file ? `./assets/frames/${String(tpl.file).replace(/\.png$/i, '')}.png` : '',
          tpl?.file ? `/assets/frames/${tpl.file}` : '',
        ].filter(Boolean);

        for (let fsrc of candidateUris) {
          try {
            if (typeof window !== 'undefined' && !/^(https?:|data:|blob:|\/)/i.test(fsrc)) {
              fsrc = `/${fsrc}`;
            }
            fimg = await loadImage(fsrc);
            if (fimg) break;
          } catch (_) {}
        }
      }

      if (fimg) {
        ctx.drawImage(fimg, 0, y0, OUT_W, bannerH);
      } else {
        // Vector Breaking News lower-third banner fallback:
        const grad = ctx.createLinearGradient(0, y0, OUT_W, y0 + bannerH);
        grad.addColorStop(0, '#7f1d1d');
        grad.addColorStop(0.5, '#991b1b');
        grad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y0, OUT_W, bannerH);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, y0, OUT_W, 4);

        const badgeW = Math.round(OUT_W * 0.22);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(badgeW, y0);
        ctx.lineTo(badgeW - 20, y0 + bannerH);
        ctx.lineTo(0, y0 + bannerH);
        ctx.closePath();
        ctx.fill();

        ctx.font = '900 28px Roboto, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.fillText('BREAKING', 18, y0 + bannerH / 2);
      }

      const title = squash(frame.title) || 'RTI NEWS';
      const desc = squash(frame.description);
      for (const b of tpl.bands || []) {
        let text = '';
        if (b.source === 'title') text = title.toUpperCase();
        else if (b.source === 'description') text = desc || b.fallback || '';
        else text = [title, desc].filter(Boolean).join('   |   ');
        if (!text) continue;
        const bw = Math.round(OUT_W * (b.right - b.left));
        const bh = Math.round(bannerH * b.height);
        const fontSize = Math.max(10, Math.round(bh * 0.62));
        const font = `800 ${fontSize}px Roboto, "Noto Sans Devanagari", sans-serif`;
        try { await document.fonts.load(font, text); } catch (_) { /* ignore */ }
        ctx.font = font;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = b.color || '#fff';
        const x = Math.round(OUT_W * b.left);
        const y = OUT_H - bannerH + Math.round(bannerH * b.top) + bh / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y - bh / 2, bw, bh);
        ctx.clip();
        ctx.fillText(fitText(ctx, text, bw), x, y);
        ctx.restore();
      }
    }

    const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Image export fail.'))), 'image/jpeg', 0.92));
    return { uri: URL.createObjectURL(blob), blob, ext: 'jpg' };
  } finally {
    toRevoke.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) { /* ignore */ } });
  }
}

export default composeFramedImageWeb;