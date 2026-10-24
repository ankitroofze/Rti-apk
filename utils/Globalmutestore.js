import { useSyncExternalStore } from 'react';

// ── Global mute state (poore app me ek hi) ───────────────────────────────────
// Feed me kisi bhi video par mute/unmute karoge to baaki SAARE videos par
// turant wahi state lag jaati hai (reel feed, news feed card, popup, etc.).
// Default: muted = true (autoplay ke liye safe). User unmute kare to sab jagah unmute.
let _muted = true;
const _listeners = new Set();

export function getGlobalMuted() {
  return _muted;
}

export function setGlobalMuted(next) {
  const value = Boolean(next);
  if (value === _muted) return;
  _muted = value;
  _listeners.forEach((fn) => {
    try { fn(); } catch (_) { /* ignore */ }
  });
}

export function toggleGlobalMuted() {
  setGlobalMuted(!_muted);
}

function subscribe(listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

// const [muted, setMuted, toggleMuted] = useGlobalMuted();
export function useGlobalMuted() {
  const muted = useSyncExternalStore(subscribe, getGlobalMuted, getGlobalMuted);
  return [muted, setGlobalMuted, toggleGlobalMuted];
}