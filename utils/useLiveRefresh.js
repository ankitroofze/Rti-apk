// utils/useLiveRefresh.js
// Screen par data "live" rakhne ka ek hi reusable tareeka — user ko refresh na karna pade.
//
//   useLiveRefresh(async ({ silent }) => { await load(); }, { intervalMs: 30000 });
//
// Ye ye sab apne aap karta hai (sirf tab jab screen focus me ho):
//   • screen focus par           -> refresh (runOnFocus: true ho to)
//   • app background -> foreground / browser tab wapas visible -> refresh
//   • intervalMs ke hisaab se     -> chupchap (silent) refresh, jab tak app active hai
// Ek time par sirf ek refresh chalta hai (overlap nahi hota), aur error aaye to screen crash nahi hoti.
import { useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const MIN_GAP_MS = 2500; // foreground/focus ke baar-baar events par request spam na ho

export default function useLiveRefresh(refresh, options = {}) {
  const {
    intervalMs = 0,        // 0 = polling nahi, sirf focus/foreground par
    enabled = true,
    runOnFocus = true,     // jin screens me pehle se useFocusEffect load hai wahan false rakho
    skipFirstFocus = false,
  } = options;

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const inFlightRef = useRef(false);
  const lastRunRef = useRef(0);
  const firstFocusRef = useRef(true);

  const run = useCallback(async (reason) => {
    if (inFlightRef.current) return;
    const now = Date.now();
    if (reason !== 'interval' && now - lastRunRef.current < MIN_GAP_MS) return;
    inFlightRef.current = true;
    lastRunRef.current = now;
    try {
      await refreshRef.current?.({ silent: true, reason });
    } catch (_) { /* silent refresh fail ho to purana data dikhta rahe */ } finally {
      inFlightRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;

      if (runOnFocus && !(skipFirstFocus && firstFocusRef.current)) run('focus');
      firstFocusRef.current = false;

      let timer = null;
      if (intervalMs > 0) {
        timer = setInterval(() => {
          if (AppState.currentState === 'active') run('interval');
        }, intervalMs);
      }

      const sub = AppState.addEventListener?.('change', (state) => {
        if (state === 'active') run('foreground');
      });

      // Web par kuch browsers me AppState change pe bharosa nahi — visibility bhi suno
      let onVisible = null;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        onVisible = () => { if (document.visibilityState === 'visible') run('visible'); };
        document.addEventListener('visibilitychange', onVisible);
      }

      return () => {
        if (timer) clearInterval(timer);
        try { sub?.remove?.(); } catch (_) { /* ignore */ }
        if (onVisible && typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
      };
    }, [enabled, intervalMs, runOnFocus, skipFirstFocus, run])
  );

  return run;
}