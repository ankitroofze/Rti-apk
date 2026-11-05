// utils/composeFramedImage.js
// WEB: image + breaking-news frame (banner + title/description text) ko canvas par jodkar ek JPG banata hai.
// (Native par ye kaam components/FramedExportView.js + react-native-view-shot karta hai.)
// Hamesha { uri, blob, ext } return karta hai ya throw karta hai (caller fallback karega).
import { Image as RNImage } from 'react-native';
import { getFrameTemplate } from '../constants/frameTemplates';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from './webMediaStore';
import { toCorsSafeMediaUrl } from './videoWithMusic';

const OUT_W = 1280;
const OUT_H = 720; // app ka media box 16:9 hai — download bhi wahi dikhta hai

const squash = (t) => String(t || '').replace(/\s+/g, ' ').trim();

const loadImage = (src) => new Promise((res, rej) => {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => res(img);
  img.onerror = () => rej(new Error('Image load nahi hui.'));
  img.src = src;
});

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
      const r = await fetch(src, { mode: 'cors', cache: 'no-store' });
      if (!r.ok) throw new Error(`Image fetch failed (${r.status})`);
      src = URL.createObjectURL(await r.blob());
      toRevoke.push(src);
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
      const fsrc = RNImage.resolveAssetSource(tpl.asset)?.uri;
      if (!fsrc) throw new Error('Frame image nahi mili.');
      const fimg = await loadImage(fsrc);
      const bannerH = Math.round(OUT_W / tpl.aspect);
      ctx.drawImage(fimg, 0, OUT_H - bannerH, OUT_W, bannerH);

      const title = squash(frame.title);
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