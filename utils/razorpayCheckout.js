// utils/razorpayCheckout.js
import { Platform } from 'react-native';
const RazorpayCheckout = Platform.OS === 'web' ? null : require('react-native-razorpay').default;
let scriptLoadingPromise = null;

/**
 * Razorpay ka checkout.js script dynamically load karta hai (web only).
 * Ek hi baar load hoga, baar baar call karo to bhi dobara load nahi hoga.
 */
export const loadRazorpayScript = () => {
  if (Platform.OS !== 'web') {
    return Promise.reject(new Error('Razorpay checkout web-only supported abhi.'));
  }
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Razorpay script load failed.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay script load failed.'));
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * orderData: backend se mila hua { key, order_id, amount, currency } (razorpay object)
 * planType: 'role' | 'ads' | 'ecom'  — sirf description/label ke liye use hota hai
 * callbacks:
 *   onVerified(razorpayResponse) -> called jab payment success hokar Razorpay se response mile
 *   onFailed(errorInfo)          -> called jab payment fail ho ya user cancel kare
 */
// Native SDK error aksar JSON string hota hai ('{"error":{"code":"BAD_REQUEST_ERROR","description":"Payment processing cancelled by user"}}')
// aur back dabane par code 0 aata hai. Isse clean message + cancelled flag nikalte hain.
const EMPTY_DESC = /^(undefined|null|\s*)$/i;

// err kisi bhi shape me aa sakta hai: object, JSON string, ya nested { error: {...} } — sabko ek flat object me badalte hain
const flattenNativeError = (err) => {
  const out = {};
  const visit = (node, depth = 0) => {
    if (node == null || depth > 4) return;
    if (typeof node === 'string') {
      const t = node.trim();
      if (t.startsWith('{')) {
        try { visit(JSON.parse(t), depth + 1); return; } catch { /* plain string */ }
      }
      if (!out.text && !EMPTY_DESC.test(t)) out.text = t;
      return;
    }
    if (typeof node !== 'object') return;
    if (out.code == null && node.code != null) out.code = node.code;
    ['source', 'step', 'reason'].forEach((k) => { if (!out[k] && node[k]) out[k] = String(node[k]); });
    if (typeof node.description === 'string' && !EMPTY_DESC.test(node.description) && !node.description.trim().startsWith('{')) {
      if (!out.text) out.text = node.description.trim();
    } else {
      visit(node.description, depth + 1);
    }
    visit(node.error, depth + 1);
    if (typeof node.message === 'string') visit(node.message, depth + 1);
  };
  visit(err);
  return out;
};

const parseNativeError = (err) => {
  const f = flattenNativeError(err);
  // Back dabane par Razorpay kabhi "cancel" text nahi bhejta — kabhi code 0/2, kabhi
  // {source:'customer', step:'payment_authentication', description:'undefined'}.
  const cancelled =
    Number(f.code) === 0 ||
    Number(f.code) === 2 ||
    String(f.code) === 'PAYMENT_CANCELLED' ||
    /cancel/i.test(`${f.text || ''} ${f.reason || ''}`) ||
    (f.source === 'customer' && !f.text);
  return {
    cancelled,
    error_code: cancelled ? 'PAYMENT_CANCELLED' : (f.code ?? 'PAYMENT_FAILED'),
    // Raw JSON kabhi user ko mat dikhao
    error_description: cancelled ? 'Payment cancelled by user' : (f.text || 'Payment failed. Please try again.'),
  };
};

export const openRazorpayCheckout = async (orderData, planType, { onVerified, onFailed, onVerifyError } = {}) => {
  // A successful web checkout also closes its modal. Do not mistake that
  // dismiss event for a cancellation and release an already-paid seat.
  let paymentCompleted = false;
  let failureReported = false;
  const reportFailure = async (errorInfo) => {
    if (paymentCompleted || failureReported) return;
    failureReported = true;
    try {
      await onFailed?.(errorInfo);
    } catch (err) {
      console.error('[openRazorpayCheckout] onFailed error:', err);
    }
  };

  // Payment ho chuka hai, lekin verify step me koi error aaya (network / server / code bug).
  // Isse "cancel/failed" na maane — paise kat chuke hain. Caller ko batao taaki wo retry /
  // pending-payment flow chala sake. Pehle yeh error chup-chaap nigal liya jaata tha.
  const runVerified = async (response) => {
    paymentCompleted = true;
    try {
      await onVerified?.(response);
    } catch (err) {
      console.error('[openRazorpayCheckout] onVerified error:', err);
      try { await onVerifyError?.(err, response); } catch (e2) { console.error('[openRazorpayCheckout] onVerifyError error:', e2); }
    }
  };

  // ✅ Android / iOS — native Razorpay SDK
  if (Platform.OS !== 'web') {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.order_id,
      name: 'RTI',
      description: `${planType} subscription`,
      theme: { color: '#2563EB' },
    };

    let response;
    try {
      response = await RazorpayCheckout.open(options);
      // native SDK response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    } catch (err) {
      // native SDK error: { code, description }
      const parsed = parseNativeError(err);
      await reportFailure({
        razorpay_order_id: orderData?.order_id,
        error_code: parsed.error_code,
        error_description: parsed.error_description,
        cancelled: parsed.cancelled,
      });
      return;
    }
    // open() success — verify alag se chalta hai, uska error "payment failed" nahi maana jaata
    await runVerified(response);
    return;
  }

  try {
    await loadRazorpayScript();
  } catch (err) {
    await reportFailure({
      razorpay_order_id: orderData?.order_id,
      error_code: 'SCRIPT_LOAD_FAILED',
      error_description: err?.message || 'Razorpay script load nahi ho paya.',
    });
    return;
  }

  // ✅ Web par yeh function ab tab tak return nahi karta jab tak checkout band na ho
  // (payment done / dismiss). Pehle `razorpay.open()` ke turant baad return ho jaata tha,
  // isliye caller ka "payment chal raha hai" guard turant hat jaata tha aur double-tap par
  // 2 orders ban sakte the.
  await new Promise((resolve) => {
    let settled = false;
    const settle = () => { if (!settled) { settled = true; resolve(); } };

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.order_id,
      name: 'RTI',
      description: `${planType} subscription`,
      handler: async function (response) {
        await runVerified(response);
        settle();
      },
      modal: {
        ondismiss: async function () {
          await reportFailure({
            razorpay_order_id: orderData.order_id,
            error_code: 'PAYMENT_CANCELLED',
            error_description: 'Payment cancelled by user',
            cancelled: true,
          });
          settle();
        },
      },
      theme: { color: '#2563EB' },
    };

    try {
      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', async function (response) {
        await reportFailure({
          razorpay_order_id: orderData.order_id,
          error_code: response.error?.code || 'PAYMENT_FAILED',
          error_description: response.error?.description || 'Payment failed',
        });
        // modal abhi khula hai (user retry kar sakta hai) — settle dismiss/handler par hoga
      });

      razorpay.open();
    } catch (err) {
      reportFailure({
        razorpay_order_id: orderData?.order_id,
        error_code: 'CHECKOUT_OPEN_FAILED',
        error_description: err?.message || 'Unable to open payment window.',
      }).finally(settle);
    }
  });
};