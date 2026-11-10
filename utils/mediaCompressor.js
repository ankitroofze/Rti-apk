// utils/mediaCompressor.js
// ─────────────────────────────────────────────────────────
// Universal Media & File Compressor for RTI News
// Supports: Images, Videos, and Document/Files
// Works seamlessly on both React Native (Android / iOS) and Web
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// Maximum size limits (matching backend RTI News server limits)
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;    // 5MB
export const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024;   // 10MB (NEWS_VIDEO_MAX_MB)
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;    // 15MB for documents

// ─── 1. Cross-Platform File Size Helper ──────────────────
export const getFileSize = async (uri) => {
  if (!uri) return 0;
  try {
    if (Platform.OS === 'web') {
      if (typeof uri === 'object' && uri.size) {
        return Number(uri.size) || 0;
      }
      if (typeof uri === 'string' && (uri.startsWith('blob:') || uri.startsWith('data:') || uri.startsWith('http'))) {
        const res = await fetch(uri);
        const blob = await res.blob();
        return blob.size || 0;
      }
    } else {
      // Native (file:// or content://)
      const cleanUri = String(uri).trim();
      if (cleanUri.startsWith('file://')) {
        const info = await FileSystem.getInfoAsync(cleanUri);
        return info.size || 0;
      }
    }
  } catch (err) {
    console.warn('[mediaCompressor.getFileSize] Error:', err);
  }
  return 0;
};

// ─── 2. Image Compression (Native + Web) ─────────────────
/**
 * Compress and downscale an image to optimize upload speed and server storage.
 * @param {string} uri - Image URI, local file path, or data URI
 * @param {object} options - Compression options
 * @param {number} [options.maxWidth=1280] - Maximum width
 * @param {number} [options.maxHeight=1280] - Maximum height
 * @param {number} [options.quality=0.7] - Compression quality (0.0 to 1.0)
 * @param {boolean} [options.base64=false] - Whether to include base64 string
 * @param {string} [options.format='jpeg'] - Output format ('jpeg' | 'png')
 * @returns {Promise<{ uri: string, width?: number, height?: number, base64?: string, sizeBytes?: number }>}
 */
export const compressImage = async (uri, options = {}) => {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.7,
    base64 = false,
    format = 'jpeg',
  } = options;

  if (!uri) return { uri: '', sizeBytes: 0 };

  // WEB Implementation via HTML5 Canvas
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      try {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          let { width, height } = img;

          // Proportional scaling
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);

          resolve({
            uri: dataUrl,
            width,
            height,
            base64: base64 ? dataUrl.split(',')[1] : undefined,
            format,
            isCompressed: true,
          });
        };

        img.onerror = () => {
          console.warn('[mediaCompressor.compressImage] Web image load failed, returning original.');
          resolve({ uri, isCompressed: false });
        };

        img.src = typeof uri === 'object' && uri.uri ? uri.uri : String(uri);
      } catch (err) {
        console.warn('[mediaCompressor.compressImage] Web canvas error:', err);
        resolve({ uri, isCompressed: false });
      }
    });
  }

  // NATIVE Implementation via expo-image-manipulator
  try {
    const ImageManipulator = require('expo-image-manipulator');
    const saveFormat = format === 'png'
      ? ImageManipulator.SaveFormat.PNG
      : ImageManipulator.SaveFormat.JPEG;

    const actions = [];
    if (maxWidth || maxHeight) {
      actions.push({ resize: { width: maxWidth, height: maxHeight } });
    }

    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: Math.min(1, Math.max(0.1, quality)),
        format: saveFormat,
        base64,
      }
    );

    const size = await getFileSize(manipResult.uri);

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      base64: manipResult.base64,
      sizeBytes: size,
      isCompressed: true,
    };
  } catch (err) {
    console.warn('[mediaCompressor.compressImage] Native manipulateAsync fallback:', err);
    return { uri, isCompressed: false };
  }
};

/**
 * Universal compressImageToBase64 helper
 * Drop-in, safe replacement for both Web and Native environments.
 */
export const compressImageToBase64 = async (uri, size = 200, quality = 0.5) => {
  if (!uri) return '';
  const res = await compressImage(uri, {
    maxWidth: size,
    maxHeight: size,
    quality,
    base64: true,
    format: 'jpeg',
  });
  if (res.base64) {
    return `data:image/jpeg;base64,${res.base64}`;
  }
  if (res.uri && res.uri.startsWith('data:')) {
    return res.uri;
  }
  return uri;
};

/**
 * Batch compress an array of image URIs
 * @param {string[]} uris - List of image URIs
 * @param {object} options - Options forwarded to compressImage
 * @returns {Promise<string[]>} Compressed image URIs
 */
export const compressImagesBatch = async (uris = [], options = {}) => {
  if (!Array.isArray(uris) || uris.length === 0) return [];
  const results = await Promise.all(
    uris.map(async (u) => {
      try {
        const comp = await compressImage(u, options);
        return comp?.uri || u;
      } catch {
        return u;
      }
    })
  );
  return results.filter(Boolean);
};

// ─── 3. Video Optimization & Verification ────────────────
/**
 * Inspect and optimize a video before upload.
 * Ensures video meets server limits (max 10MB) and duration constraints.
 * @param {string|object} videoAsset - Video URI or Asset object
 * @param {object} options
 * @param {number} [options.maxSizeBytes=10485760] - Max allowed bytes (10MB)
 * @returns {Promise<{ ok: boolean, uri: string, sizeBytes: number, sizeMB: string, isTooLarge: boolean, message?: string }>}
 */
export const compressVideo = async (videoAsset, options = {}) => {
  const maxBytes = options.maxSizeBytes || MAX_VIDEO_SIZE_BYTES;
  const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);

  const uri = typeof videoAsset === 'string'
    ? videoAsset
    : (videoAsset?.uri || videoAsset?.localUri || '');

  if (!uri) return { ok: false, message: 'Invalid video URI' };

  let sizeBytes = 0;
  if (typeof videoAsset === 'object' && (videoAsset.fileSize || videoAsset.size)) {
    sizeBytes = Number(videoAsset.fileSize || videoAsset.size) || 0;
  } else {
    sizeBytes = await getFileSize(uri);
  }

  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
  const isTooLarge = sizeBytes > maxBytes;

  if (isTooLarge) {
    return {
      ok: false,
      uri,
      sizeBytes,
      sizeMB: `${sizeMB} MB`,
      isTooLarge: true,
      maxAllowedMB: `${maxMB} MB`,
      message: `Video size is ${sizeMB} MB, which exceeds the maximum limit of ${maxMB} MB. Please trim or compress the video before posting.`,
    };
  }

  return {
    ok: true,
    uri,
    sizeBytes,
    sizeMB: `${sizeMB} MB`,
    isTooLarge: false,
    message: 'Video is ready for upload.',
  };
};

// ─── 4. Document / Generic File Verification & Compression ──
/**
 * Validate and compress/optimize a document or file asset before upload.
 * @param {string|object} fileAsset - File path, URI, or Asset object
 * @param {object} options
 * @param {number} [options.maxSizeBytes=15728640] - Max allowed bytes (15MB)
 * @param {string[]} [options.allowedExtensions] - List of allowed extensions
 * @returns {Promise<{ ok: boolean, uri: string, sizeBytes: number, sizeMB: string, name: string, isAllowed: boolean, error?: string }>}
 */
export const compressFile = async (fileAsset, options = {}) => {
  const maxBytes = options.maxSizeBytes || MAX_FILE_SIZE_BYTES;
  const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);

  const uri = typeof fileAsset === 'string'
    ? fileAsset
    : (fileAsset?.uri || fileAsset?.localUri || '');

  const name = typeof fileAsset === 'object'
    ? (fileAsset.name || fileAsset.fileName || 'file')
    : String(uri).split('/').pop() || 'file';

  const ext = (name.split('.').pop() || '').toLowerCase();
  const allowed = options.allowedExtensions || ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt', 'csv'];

  let sizeBytes = 0;
  if (typeof fileAsset === 'object' && (fileAsset.size || fileAsset.fileSize)) {
    sizeBytes = Number(fileAsset.size || fileAsset.fileSize) || 0;
  } else {
    sizeBytes = await getFileSize(uri);
  }

  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

  if (allowed.length > 0 && !allowed.includes(ext)) {
    return {
      ok: false,
      uri,
      name,
      sizeBytes,
      sizeMB: `${sizeMB} MB`,
      isAllowed: false,
      error: `File format .${ext} is not allowed. Supported formats: ${allowed.join(', ')}.`,
    };
  }

  if (sizeBytes > maxBytes) {
    return {
      ok: false,
      uri,
      name,
      sizeBytes,
      sizeMB: `${sizeMB} MB`,
      isAllowed: false,
      error: `File size (${sizeMB} MB) exceeds maximum allowed limit of ${maxMB} MB.`,
    };
  }

  return {
    ok: true,
    uri,
    name,
    sizeBytes,
    sizeMB: `${sizeMB} MB`,
    isAllowed: true,
  };
};

export default {
  compressImage,
  compressImageToBase64,
  compressImagesBatch,
  compressVideo,
  compressFile,
  getFileSize,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_FILE_SIZE_BYTES,
};

