import { Platform } from 'react-native';

export function isMobileWebDevice() {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const screenRef = window.screen || {};
  const screenWidth = Number(screenRef.width || 0);
  const screenHeight = Number(screenRef.height || 0);
  const smallestScreenSide = Math.min(
    screenWidth || Number.MAX_SAFE_INTEGER,
    screenHeight || Number.MAX_SAFE_INTEGER
  );
  const hasTouch = Number(nav.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(String(nav.userAgent || ''));

  return Boolean(hasTouch && (mobileUa || smallestScreenSide <= 820));
}

export function getMobileWebViewportWidth(fallbackWidth = 360) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return fallbackWidth;

  const screenRef = window.screen || {};
  const candidates = [
    Number(window.visualViewport?.width || 0),
    Number(document?.documentElement?.clientWidth || 0),
    Number(window.innerWidth || 0),
    Number(screenRef.width || 0),
    Number(screenRef.height || 0),
    Number(fallbackWidth || 0),
  ].filter((value) => Number.isFinite(value) && value > 0);

  return candidates.length ? Math.min(...candidates) : fallbackWidth;
}

export function getResponsiveWindowWidth(width, fallbackWidth = 360) {
  if (!isMobileWebDevice()) return width;
  return getMobileWebViewportWidth(fallbackWidth);
}
