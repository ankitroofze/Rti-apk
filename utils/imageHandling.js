import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// PDF Image Resolution
export async function resolvePdfImageSrc(uri = '') {
  if (!uri) return '';
  if (uri.startsWith('data:') || uri.startsWith('http') || uri.startsWith('blob:')) return uri;
  
  if (uri.startsWith('file://')) {
    const ext = uri.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    try {
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:image/${ext};base64,${b64}`;
    } catch (_) {
      return '';
    }
  }
  return uri;
}

// Module Image Resolution
export async function resolveModuleImageSrc(moduleRef, mimeType = 'image/jpeg') {
  try {
    const asset = Asset.fromModule(moduleRef);
    if (Platform.OS === 'web') {
      try {
        if (!asset?.uri && asset?.downloadAsync) await asset.downloadAsync();
      } catch (_) {}

      const uri = asset?.localUri || asset?.uri || '';
      if (!uri) return '';
      if (uri.startsWith('data:')) return uri;

      let abs = uri;
      try {
        abs = new URL(uri, typeof window !== 'undefined' ? window.location.href : undefined).toString();
      } catch (_) {}

      const cache = resolveModuleImageSrc._cache || (resolveModuleImageSrc._cache = new Map());
      const key = `${mimeType}|${abs}`;
      if (cache.has(key)) return cache.get(key);

      try {
        const response = await fetch(abs);
        if (!response.ok) throw new Error('asset fetch failed');
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.readAsDataURL(blob);
        });
        const result = dataUrl || abs;
        cache.set(key, result);
        return result;
      } catch (_) {
        cache.set(key, abs);
        return abs;
      }
    }

    if (!asset.localUri) await asset.downloadAsync();
    const assetUri = asset.localUri || asset.uri || '';
    if (!assetUri) return '';
    
    if (assetUri.startsWith('file://')) {
      const b64 = await FileSystem.readAsStringAsync(assetUri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:${mimeType};base64,${b64}`;
    }
    
    if (Platform.OS === 'web' && (assetUri.startsWith('http') || assetUri.startsWith('blob:'))) {
      const response = await fetch(assetUri);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.readAsDataURL(blob);
      });
    }
    return assetUri;
  } catch (_) {
    return '';
  }
}

// Image Compression for Web
export const compressImageToBase64 = (uri) => new Promise((res, rej) => {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 200;
    c.getContext('2d').drawImage(img, 0, 0, 200, 200);
    res(c.toDataURL('image/jpeg', 0.5));
  };
  img.onerror = rej;
  img.src = uri;
});
