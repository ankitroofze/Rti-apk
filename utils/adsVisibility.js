// utils/adsVisibility.js
// ─────────────────────────────────────────────────────────
// Ads hide/show ka SINGLE source of truth = backend GET /api/ads-details ka `ads_hidden`.
// Local subscription/plan data dekh kar yahan kuch decide NAHI hota.
//
// Flow:
//   AuthAPI.getAdsDetails()  ->  setAdsHidden(data.ads_hidden)  ->  sab subscribers (Home, popup, feed, panels) update
//   Plan expire / subscription change / login / logout par  refreshAdsVisibility()  se latest status dobara aata hai.
// ─────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

let _hidden = false;           // latest ads_hidden (API se)
let _loaded = false;           // kam se kam ek baar API se aa chuka?
const _listeners = new Set();
let _refresher = null;         // AuthAPI.getAdsDetails wrapper (circular import se bachne ke liye register hota hai)

export const isAdsHidden = () => _hidden;
export const isAdsVisibilityLoaded = () => _loaded;

export const setAdsHidden = (value) => {
  const next = value === true || value === 1 || value === '1' || value === 'true';
  _loaded = true;
  if (next === _hidden) return;
  _hidden = next;
  _listeners.forEach((fn) => { try { fn(_hidden); } catch (_) { /* ignore */ } });
};

// Logout par reset — agle user ka status naye sire se API se aayega
export const resetAdsVisibility = () => {
  _loaded = false;
  if (_hidden) {
    _hidden = false;
    _listeners.forEach((fn) => { try { fn(_hidden); } catch (_) { /* ignore */ } });
  }
};

export const subscribeAdsHidden = (fn) => {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
};

export const registerAdsRefresher = (fn) => { _refresher = fn; };

// Latest status API se dobara lao (plan expire / subscription change / login ke baad call karo)
export const refreshAdsVisibility = async () => {
  try { if (_refresher) await _refresher(); } catch (_) { /* purana status rahe */ }
  return _hidden;
};

// React hook: ads_hidden badalte hi component re-render hota hai
export const useAdsHidden = () => {
  const [hidden, setHidden] = useState(_hidden);
  useEffect(() => {
    setHidden(_hidden);
    return subscribeAdsHidden(setHidden);
  }, []);
  return hidden;
};