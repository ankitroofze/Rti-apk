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
// enabled=false => ye component mute badalne par re-render nahi hota (jin cards me video nahi unke liye).
const _alwaysMuted = () => true;
export function useGlobalMuted(enabled = true) {
  const snap = enabled ? getGlobalMuted : _alwaysMuted;
  const muted = useSyncExternalStore(subscribe, snap, snap);
  return [muted, setGlobalMuted, toggleGlobalMuted];
}