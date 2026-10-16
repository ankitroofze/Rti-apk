// Web par push nahi hai — sab no-op, taaki native Firebase packages web bundle me na aayein.
export const subscribePushEvents = () => () => {};
// Badge bus web par bhi kaam karta hai (pure JS) — inbox read/delete ke baad bell refresh
const badgeListeners = new Set();
export const subscribeBadgeRefresh = (cb) => {
  badgeListeners.add(cb);
  return () => badgeListeners.delete(cb);
};
export const refreshBadge = () => badgeListeners.forEach((cb) => { try { cb(); } catch {} });
export const setupChannel = async () => {};
export const requestPermission = async () => false;
export const registerDeviceToken = async () => null;
export const unregisterDeviceToken = async () => {};
export const listenTokenRefresh = () => () => {};
export const listenForeground = () => () => {};
export const listenOpened = () => () => {};