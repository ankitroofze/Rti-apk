// utils/razorpayCheckout.js
import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
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
export const openRazorpayCheckout = async (orderData, planType, { onVerified, onFailed } = {}) => {
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

    try {
      const response = await RazorpayCheckout.open(options);
      // native SDK response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      await onVerified?.(response);
    } catch (err) {
      // native SDK error: { code, description }
      onFailed?.({
        razorpay_order_id: orderData?.order_id,
        error_code: err?.code || 'PAYMENT_FAILED',
        error_description: err?.description || 'Payment failed.',
      });
    }
    return;
  }

  try {
    await loadRazorpayScript();
  } catch (err) {
    onFailed?.({
      razorpay_order_id: orderData?.order_id,
      error_code: 'SCRIPT_LOAD_FAILED',
      error_description: err?.message || 'Razorpay script load nahi ho paya.',
    });
    return;
  }

  const options = {
    key: orderData.key,
    amount: orderData.amount,
    currency: orderData.currency,
    order_id: orderData.order_id,
    name: 'RTI',
    description: `${planType} subscription`,
    handler: async function (response) {
      await onVerified?.(response);
    },
    modal: {
      ondismiss: async function () {
        onFailed?.({
          razorpay_order_id: orderData.order_id,
          error_code: 'PAYMENT_CANCELLED',
          error_description: 'Payment cancelled by user',
        });
      },
    },
    theme: { color: '#2563EB' },
  };

  const razorpay = new window.Razorpay(options);

  razorpay.on('payment.failed', async function (response) {
    onFailed?.({
      razorpay_order_id: orderData.order_id,
      error_code: response.error?.code || 'PAYMENT_FAILED',
      error_description: response.error?.description || 'Payment failed',
    });
  });

  razorpay.open();
};