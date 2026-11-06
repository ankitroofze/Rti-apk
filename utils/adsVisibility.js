// utils/adsVisibility.js
// ─────────────────────────────────────────────────────────
// Ads hide/show ka SINGLE rule:
//   User ke paas koi ACTIVE subscription ho jiske plan me backend ne `hide_ads: true` bheja ho
//   (admin panel se banaya hua "Ads Free" subscription) => SIRF POP-UP ADS band hote hain.
//   Home page ke right-side ads aur center feed ads PHIR BHI dikhte hain (2-2 sec me random badalte hue).
//   Premium / Role / Ads / Ecom / Quiz — sirf type se pop-up hide NAHI hota. Sirf `hide_ads: true` se.
//
//   NOTE: `isAdsHidden / useAdsHidden` ka matlab ab "POPUP ads hidden" hai.
//   Naye naam `isPopupAdsHidden / usePopupAdsHidden` neeche alias hain (same cheez).
//
// Flow:
//   AuthAPI.getAdsDetails()  ->  /my-subscriptions + /my-role-subscriptions me `hide_ads` check
//                            ->  setAdsHidden(...)  ->  sab subscribers (Home, popup, feed, panels) update
//   Subscription purchase / login / logout par  refreshAdsVisibility()  se latest status dobara aata hai.
// ─────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

let _hidden = false;           // latest ads_hidden (API se)
let _loaded = false;           // kam se kam ek baar API se aa chuka?
const _listeners = new Set();
let _refresher = null;         // AuthAPI.getAdsDetails wrapper (circular import se bachne ke liye register hota hai)

const _truthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

// Subscription record active hai ya nahi (pending / failed / expired ko chhod kar baaki active)
const _isActiveSubscriptionRecord = (s = {}) => {
  const status = String(s.status ?? '').toLowerCase();
  if (['expired', 'inactive', 'cancelled', 'canceled', 'failed', 'refunded', 'pending', 'created'].includes(status)) return false;
  const ps = s.payment_status;
  if (ps !== undefined && ps !== null && ps !== '') {
    if (!['1', 'true', 'paid', 'success', 'captured', 'completed', 'active'].includes(String(ps).toLowerCase())) return false;
  }
  const exp = s.expires_at || s.expiry || s.end_date || s.expiry_date;
  if (exp) {
    const t = new Date(`${String(exp).slice(0, 10)}T23:59:59`).getTime();
    if (Number.isFinite(t) && Date.now() > t) return false;
  }
  return true;
};

// `hide_ads` subscription record par ho ya uske nested plan object me
const _recordHasHideAds = (s = {}) => (
  _truthy(s.hide_ads)
  || _truthy(s.plan?.hide_ads)
  || _truthy(s.subscription_plan?.hide_ads)
  || _truthy(s.role_subscription_plan?.hide_ads)
);

// Backend response (kisi bhi shape me: array / {data:[...]} / {role:[...], ads:[...]}) me
// koi bhi ACTIVE subscription jiska `hide_ads: true` ho => true
export const subscriptionsHideAds = (raw) => {
  const RECORD_KEYS = ['id', 'plan_id', 'plan_name', 'expires_at', 'status', 'payment_status', 'purchased_at'];
  const walk = (node, depth = 0) => {
    if (!node || depth > 6) return false;
    if (Array.isArray(node)) return node.some((x) => walk(x, depth + 1));
    if (typeof node !== 'object') return false;
    if (RECORD_KEYS.some((k) => node[k] !== undefined)) {
      return _recordHasHideAds(node) && _isActiveSubscriptionRecord(node);
    }
    return Object.values(node).some((x) => x && typeof x === 'object' && walk(x, depth + 1));
  };
  return walk(raw);
};

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

// Latest status API se dobara lao (subscription purchase / plan expire / login ke baad call karo)
export const refreshAdsVisibility = async () => {
  try { if (_refresher) await _refresher(); } catch (_) { /* purana status rahe */ }
  return _hidden;
};

// Alias — naam ka matlab saaf: ad-free user ke liye sirf popup band hota hai
export const isPopupAdsHidden = () => _hidden;

// React hook: ads_hidden badalte hi component re-render hota hai
export const useAdsHidden = () => {
  const [hidden, setHidden] = useState(_hidden);
  useEffect(() => {
    setHidden(_hidden);
    return subscribeAdsHidden(setHidden);
  }, []);
  return hidden;
};
export const usePopupAdsHidden = useAdsHidden;