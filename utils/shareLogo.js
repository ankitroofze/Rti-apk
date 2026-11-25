// utils/shareLogo.js
// WEB: share / download hone wali image ya video ke top-left corner me RTI logo draw karta hai
// (bilkul waise jaise news card me MediaLogo dikhta hai).
import { Image as RNImage } from 'react-native';

let _logoPromise = null;

function resolveAssetUri(asset) {
  if (!asset) return '';
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
  } catch (_) { /* ignore */ }
  try {
    if (typeof RNImage?.resolveAssetSource === 'function') {
      const src = RNImage.resolveAssetSource(asset);
      if (src?.uri) return src.uri;
    }
  } catch (_) { /* ignore */ }
  return '';
}

const loadImg = (src) => new Promise((res, rej) => {
  const img = new window.Image();
  img.onload = () => res(img);
  img.onerror = () => rej(new Error('logo load failed'));
  img.src = src;
});

// Logo ek hi baar load hota hai (cache). Fail ho to null — share phir bhi chalega.
export function loadShareLogo() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!_logoPromise) {
    _logoPromise = (async () => {
      try {
        // eslint-disable-next-line global-require
        const uri = resolveAssetUri(require('../assets/images/certificate_logo.jpg'));
        return uri ? await loadImg(uri) : null;
      } catch (_) {
        return null;
      }
    })();
  }
  return _logoPromise;
}

// White gol badge + logo, top-left (MediaLogo jaisa). `W` = canvas width.
export function drawShareLogo(ctx, logo, W) {
  if (!ctx || !logo) return;
  const size = Math.round(W * 0.095);   // 1280 => ~122px, news card ke logo ke anupaat me
  const pad = Math.round(W * 0.0125);
  const r = size / 2;
  const cx = pad + r;
  const cy = pad + r;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(1, Math.round(size * 0.02));
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.stroke();
  // logo ko gol clip karke andar fit
  const inner = r - Math.max(2, size * 0.035);
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const s = Math.min((inner * 2) / logo.width, (inner * 2) / logo.height);
  const dw = logo.width * s;
  const dh = logo.height * s;
  ctx.drawImage(logo, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}