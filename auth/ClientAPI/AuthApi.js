// ClientAPI/AuthApi.js
// ─────────────────────────────────────────────────────────
// RTI News — Auth API Client
// Native (iOS/Android): direct hit -> https://rtiapi.roofze.in/api
// Web: relative path -> /api-proxy (dev-server / production reverse-proxy
//      forwards this to https://rtiapi.roofze.in/api, avoiding CORS)
// ─────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getIdbMediaBlob, isIdbMediaUri } from '../../utils/webMediaStore';

// BASE_URL environment config se aata hai (EXPO_PUBLIC_API_URL). Env set na ho to purana default.
const NATIVE_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rtiapi.roofze.in/api';
const BASE_URL = Platform.OS === 'web'
  ? '/api-proxy'
  : NATIVE_BASE_URL;

const REQUEST_TIMEOUT_MS = 30000;

const redactHeaders = (headers = {}) => {
  const safe = { ...headers };
  if (safe.Authorization) safe.Authorization = 'Bearer <redacted>';
  return safe;
};

const serializeError = (err) => ({
  name: err?.name,
  message: err?.message,
  stack: err?.stack,
  cause: err?.cause ? String(err.cause) : undefined,
});

const summarizePayload = (payload) => {
  if (!payload) return null;
  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    return '[FormData payload]';
  }
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return '[Unserializable payload]';
  }
};

const readResponseBody = async (response, context) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    const rawBody = text.slice(0, 1000);
    console.error('[AuthAPI] Response JSON parse failed:', {
      ...context,
      status: response.status,
      contentType: response.headers?.get?.('content-type'),
      rawBody,
      error: serializeError(err),
    });
    return {
      message: rawBody || `Unexpected non-JSON response (${response.status}).`,
      rawBody,
      parseError: serializeError(err),
    };
  }
};

const fetchWithDebug = async (endpoint, options = {}, debugBody = null, customTimeoutMs = null) => {
  const url = `${BASE_URL}${endpoint}`;
  const startedAt = Date.now();
  const effectiveTimeoutMs = customTimeoutMs || REQUEST_TIMEOUT_MS;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), effectiveTimeoutMs)
    : null;
  const context = {
    url,
    method: options.method || 'GET',
    platform: Platform.OS,
    timeoutMs: effectiveTimeoutMs,
  };

  console.log('[AuthAPI] Request:', {
    ...context,
    headers: redactHeaders(options.headers),
  });

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller?.signal,
    });
    const data = await readResponseBody(response, context);
    const result = {
      status: response.status,
      ok: response.ok,
      contentType: response.headers?.get?.('content-type'),
      durationMs: Date.now() - startedAt,
      data,
    };

    console.log('[AuthAPI] Response:', {
      ...context,
      status: result.status,
      ok: result.ok,
      contentType: result.contentType,
      durationMs: result.durationMs,
    });

    return result;
   } catch (err) {
    const isTimeout = err?.name === 'AbortError';
    const logFn = isTimeout ? console.warn : console.error;
    logFn('[AuthAPI] Fetch failed:', {
      ...context,
      durationMs: Date.now() - startedAt,
      isTimeout,
      error: serializeError(err),
    });
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const getAuthToken = async () => {
  const asyncToken = await AsyncStorage.getItem('auth_token');
  if (asyncToken) return asyncToken;

  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('auth_token');
  }

  return null;
};

// ✅ NEW: expired token hatane ke liye
const clearAuthToken = async () => {
  try { await AsyncStorage.removeItem('auth_token'); } catch {}
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem('auth_token'); } catch {}
};

// ✅ NEW: delete ke baad local token + user data saaf karne ke liye
const clearLocalSession = async () => {
  await clearAuthToken();
  try { await AsyncStorage.removeItem('current_user_email'); } catch {}
};

// ✅ NEW: login/reactivate response se token save karo (dono ka response same hai)
const saveAuthToken = async (token) => {
  if (!token) return;
  try {
    await AsyncStorage.setItem('auth_token', token);
    if (typeof localStorage !== 'undefined') localStorage.setItem('auth_token', token);
  } catch (e) {
    console.warn('[AuthAPI] Token save failed:', e);
  }
};

// ✅ NEW: backend error -> user friendly message (401 alag handle hota hai)
const apiErrorMessage = (status, data) => {
  if (status === 422) {
    const errors = data?.errors || {};
    return Object.values(errors).flat()[0] || data?.message || 'Please check the entered details.';
  }
  if (status === 403) return data?.message || 'You do not have permission to do this.';
  if (status === 404) return data?.message || 'This item is no longer available.';
  if (status === 429) return 'Please try again later.';
  return data?.message || `Server error (${status}).`;
};

// ✅ NEW: PUBLIC endpoints ke liye. Token ho to bhejta hai; 401 aaye (expired token)
// to token clear karke SIRF EK BAAR bina token retry karta hai. Loop nahi banega.
const publicRequest = async (endpoint, { method = 'GET', body = null } = {}) => {
  const buildOptions = (token) => {
    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) };
  };
  const token = await getAuthToken();
  let res = await fetchWithDebug(endpoint, buildOptions(token));
  if (res.status === 401 && token) {
    await clearAuthToken();
    res = await fetchWithDebug(endpoint, buildOptions(null));
  }
  return { status: res.status, data: res.data };
};



// OTP se related failure (expired / invalid / not verified) pehchano
// ya message me "otp" word bhejta hai.
const isOtpProblem = (errors = {}, message = '') =>
  Boolean(errors && errors.otp) || /\botp\b/i.test(String(message || ''));

// ─── Helper: FormData request ─────────────────────────────
const postFormData = async (endpoint, fields = {}, token = null) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetchWithDebug(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  }, formData);

  return { status: response.status, data: response.data };
};

// ─── Helper: uri se file ka asli mime/extension nikalo (hardcoded jpeg/mp4 galat tha) ───
const MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic',
  mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', '3gp': 'video/3gpp', mkv: 'video/x-matroska',
};
const guessFileMeta = (uri = '', kind = 'image', index = 0) => {
  const clean = String(uri || '').split('?')[0].split('#')[0];
  const m = clean.match(/\.([a-z0-9]{2,4})$/i);
  let ext = m ? m[1].toLowerCase() : '';
  if (!MIME_BY_EXT[ext]) ext = kind === 'video' ? 'mp4' : 'jpg'; // content:// jaise uri me ext nahi hoti
  return { type: MIME_BY_EXT[ext], name: `ad-${kind}-${index + 1}.${ext}` };
};

// ─── Helper: JSON request ─────────────────────────────────
const postJSON = async (endpoint, body = {}, token = null) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetchWithDebug(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }, body);

  return { status: response.status, data: response.data };
};

const getJSON = async (endpoint, token = null, timeoutMs = null) => {
  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetchWithDebug(endpoint, {
    method: 'GET',
    headers,
  }, null, timeoutMs);

  return { status: response.status, data: response.data };
};

// ✅ NEW: token-required JSON call (POST / PUT / DELETE) — Comment Interaction APIs ke liye
const authedJSON = async (method, endpoint, body = null) => {
  const token = await getAuthToken();
  if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetchWithDebug(
    endpoint,
    { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) },
    body
  );
  if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status, data: res.data || {} };
  if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
  if (res.status === 404) return { ok: false, notFound: true, message: apiErrorMessage(404, res.data) };
  return { ok: false, status: res.status, message: apiErrorMessage(res.status, res.data), errors: res.data?.errors };
};

// ─────────────────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────────────────
export const AuthAPI = {

  /**
   * Register a new user
   * POST /register
   * Body: firstname, middlename, lastname, phone, email, password, confirmed, referral_code
   */
   register: async ({ firstName, middleName = '', lastName, mobile, email, password, referralCode = '', profileImage = '', bio = '', otp = '' }) => {
    try {
      const { status, data } = await postJSON('/register', {
        firstname:     firstName.trim(),
        middlename:    middleName.trim(),
        lastname:      lastName.trim(),
        phone:         mobile.trim(),
        email:         email.trim().toLowerCase(),
        password:      password,
        confirmed:     password,
        referral_code: referralCode.trim() || '',
        profile_image: profileImage || '',
        bio:           bio.trim(),
        // Server /register par otp field required rakhta hai, isliye hamesha bhejo.
            otp:           String(otp || '').trim(),
      });

      if (status === 200 || status === 201) {
        // Token save karo future requests ke liye
        const token = data?.token || data?.access_token || data?.authorization?.token || null;
        if (token) {
          try {
            await AsyncStorage.setItem('auth_token', token);
            // Web fallback
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('auth_token', token);
            }
          } catch {}
        }
        return {
          ok:      true,
          data,
          token:   data?.token || data?.access_token || null,
          user:    data?.user || data?.data?.user || data?.data || null,
          message: data?.message || 'Registration successful!',
        };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError =
                   (errors.referral_code && errors.referral_code[0]) ||
          Object.values(errors).flat()[0] ||
          data?.message ||
          'Validation failed. Please check your details.';
              return { ok: false, status, message: firstError, errors, otpError: isOtpProblem(errors, firstError) };
      }

      return {
        ok:      false,
        status,
        message: data?.message || `Server error (${status}). Please try again.`,
        errors:  data?.errors  || {},
        otpError: isOtpProblem(data?.errors, data?.message),
      };

    } catch (err) {
      console.error('[AuthAPI.register] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Login user
   * POST /login
   * Body: email, password
   */
  login: async ({ email, password }) => {
    try {
      const { status, data } = await postJSON('/login', {
        email:    email.trim().toLowerCase(),
        password: password,
      });

      if (status === 200 || status === 201) {
        const token = data?.token || data?.access_token || data?.authorization?.token || null;
        console.log('[AuthAPI.login] Response data:', JSON.stringify(data));
        console.log('[AuthAPI.login] Token found:', token);
        if (token) {
          try {
            await AsyncStorage.setItem('auth_token', token);
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('auth_token', token);
            }
            console.log('[AuthAPI.login] Token saved successfully');
          } catch (e) {
            console.warn('[AuthAPI.login] Token save failed:', e);
          }
        }
        return {
          ok:      true,
          token:   token,
          user:    data?.user  || null,
          message: data?.message || 'Login successful!',
        };
      }

      // ✅ NEW: deleted account -> 422 + code 'account_deleted'
      if (data?.code === 'account_deleted') {
        return {
          ok:             false,
          status,
          code:           'account_deleted',
          accountDeleted: true,
          message:        data?.message || 'Your account is deleted. Reactivate it to continue.',
        };
      }

      return {
        ok:      false,
        status,
        code:    data?.code || null,
        message: data?.message || 'Invalid credentials.',
      };
    } catch (err) {
      console.error('[AuthAPI.login] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * ✅ NEW: Account Delete (login zaroori)
   * DELETE /account   Body: { password }
   * 405 aaye (hosting DELETE block kare) to same URL par POST.
   * Success par local token + user data clear hota hai. Logout API call NAHI karni (server token band kar deta hai).
   * Return: { ok } | { ok:false, isAuth } | { ok:false, forbidden } | { ok:false, errors, passwordError } | { ok:false, isNetwork }
   */
  deleteAccount: async ({ password }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const buildOptions = (method) => ({
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      let res = await fetchWithDebug('/account', buildOptions('DELETE'));
      if (res.status === 405) {
        res = await fetchWithDebug('/account', buildOptions('POST'));
      }
      const { status, data } = res;

      if (status === 200 || status === 204) {
        await clearLocalSession();
        return {
          ok: true,
          message: data?.message || 'Your account has been deleted. You can reactivate it anytime by logging in again.',
        };
      }
      if (status === 401) {
        await clearLocalSession();
        return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      }
      if (status === 403) {
        return { ok: false, forbidden: true, message: data?.message || 'This account cannot be deleted.' };
      }
      if (status === 422) {
        const errors = data?.errors || {};
        const passwordError = Array.isArray(errors.password) ? errors.password[0] : (errors.password || '');
        const firstError = passwordError || Object.values(errors).flat()[0] || data?.message || 'Please check the entered details.';
        return { ok: false, status, errors, passwordError: passwordError || '', message: firstError };
      }
      if (status === 429) {
        return { ok: false, status, message: 'Too many attempts. Please try again in a minute.' };
      }
      return { ok: false, status, message: data?.message || `Server error (${status}). Please try again.` };
    } catch (err) {
      console.error('[AuthAPI.deleteAccount] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * ✅ NEW: Account Reactivate (PUBLIC — Authorization header MAT bhejo)
   * POST /account/reactivate   Body: { email, password }
   * 200 -> login jaisa response { message, user, profile, authorization: { token } } — token save hota hai.
   */
  reactivateAccount: async ({ email, password }) => {
    try {
      // Direct fetch: publicRequest/postJSON token attach kar sakte hain, yahan nahi chahiye
      const { status, data } = await fetchWithDebug('/account/reactivate', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: String(email || '').trim().toLowerCase(),
          password,
        }),
      });

      if (status === 200 || status === 201) {
        const token = data?.token || data?.access_token || data?.authorization?.token || null;
        await saveAuthToken(token);
        return {
          ok: true,
          token,
          user: data?.user || null,
          profile: data?.profile || null,
          message: data?.message || 'Your account has been reactivated.',
        };
      }
      if (status === 422) {
        const errors = data?.errors || {};
        const emailError = Array.isArray(errors.email) ? errors.email[0] : (errors.email || '');
        const firstError = emailError || Object.values(errors).flat()[0] || data?.message || 'Unable to reactivate account.';
        return { ok: false, status, errors, message: firstError };
      }
      if (status === 429) {
        return { ok: false, status, rateLimited: true, message: 'Bahut zyada try, 1 minute baad dobara karein.' };
      }
      return { ok: false, status, message: data?.message || `Server error (${status}). Please try again.` };
    } catch (err) {
      console.error('[AuthAPI.reactivateAccount] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Forgot Password — Step 1: Request OTP
   * POST /forgot-password/request-otp
   * Body: email
   */
  requestForgotOTP: async ({ email }) => {
    try {
      const { status, data } = await postFormData('/forgot-password/request-otp', {
        email: email.trim().toLowerCase(),
      });

      if (status === 200 || status === 201) {
        return { ok: true, message: data?.message || 'OTP sent successfully!', data };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Invalid email address.';
        return { ok: false, message: firstError, errors };
      }

      return { ok: false, message: data?.message || `Server error (${status}). Please try again.` };
    } catch (err) {
      console.error('[AuthAPI.requestForgotOTP] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Forgot Password — Step 2: Verify OTP
   * POST /forgot-password/verify-otp
   * Body: email, otp
   */
  verifyForgotOTP: async ({ email, otp }) => {
    try {
      const { status, data } = await postFormData('/forgot-password/verify-otp', {
        email: email.trim().toLowerCase(),
        otp:   String(otp).trim(),
      });

      if (status === 200 || status === 201) {
        return {
          ok:         true,
          message:    data?.message || 'OTP verified successfully!',
          resetToken: data?.reset_token || data?.token || null,
          data,
        };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Invalid or expired OTP.';
        return { ok: false, message: firstError, errors };
      }

      return { ok: false, message: data?.message || 'Invalid or expired OTP. Please try again.' };
    } catch (err) {
      console.error('[AuthAPI.verifyForgotOTP] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Registration — Step 1: email par OTP bhejo
   * POST /register/request-otp
   * Body: email
   */
   requestRegisterOTP: async ({ email }) => {
    try {
      const { status, data } = await postJSON('/register/request-otp', {
        email: String(email || '').trim().toLowerCase(),
      });

      if (status === 200 || status === 201) {
        return { ok: true, message: data?.message || 'OTP sent to your email.', data };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Invalid email address.';
        return { ok: false, status, message: firstError, errors };
      }

      if (status === 429) {
        return { ok: false, status, message: data?.message || 'Too many attempts. Please wait a moment and try again.' };
      }

      return { ok: false, status, message: data?.message || `Server error (${status}). Please try again.` };
    } catch (err) {
      console.error('[AuthAPI.requestRegisterOTP] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Registration — Step 2: OTP verify karo
   * POST /register/verify-otp
   * Body: email, otp   (verified OTP hi baad me /register me bhejna hai)
   */
   verifyRegisterOTP: async ({ email, otp }) => {
    try {
      const { status, data } = await postJSON('/register/verify-otp', {
        email: String(email || '').trim().toLowerCase(),
        otp:   String(otp || '').trim(),
      });

      if (status === 200 || status === 201) {
        return { ok: true, message: data?.message || 'Email verified successfully!', data };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Invalid or expired OTP.';
        return { ok: false, status, message: firstError, errors };
      }

      if (status === 429) {
        return { ok: false, status, message: data?.message || 'Too many attempts. Please wait a moment and try again.' };
      }

      return { ok: false, status, message: data?.message || 'Invalid or expired OTP. Please try again.' };
    } catch (err) {
      console.error('[AuthAPI.verifyRegisterOTP] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Forgot Password — Step 3: Reset Password
   * POST /forgot-password/reset-password
   * Body: email, otp, password
   */
  resetPassword: async ({ email, otp, password }) => {
    try {
      const { status, data } = await postFormData('/forgot-password/reset-password', {
        email:    email.trim().toLowerCase(),
        otp:      String(otp).trim(),
        password: password,
      });

      if (status === 200 || status === 201) {
        return { ok: true, message: data?.message || 'Password reset successfully!', data };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Reset failed. Please try again.';
        return { ok: false, message: firstError, errors };
      }

      return { ok: false, message: data?.message || `Server error (${status}). Please try again.` };
    } catch (err) {
      console.error('[AuthAPI.resetPassword] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Update State / District / Taluka
   * POST /state
   * Headers: Authorization: Bearer {token}
   * Body: state, district, taluka
   */
  updateState: async ({ state, district, taluka, village = '' }, tokenOverride = null) => {
    try {
      const token = tokenOverride || await getAuthToken();
      if (!token) {
        return { ok: false, isAuth: true, message: 'Not logged in.' };
      }

      const { status, data } = await postFormData('/state', {
        state:    state    || '',
        district: district || '',
       taluka:   taluka   || '', village:  village  || '',
      }, token);

      if (status === 200 || status === 201) {
        return { ok: true, message: data?.message || 'Location updated successfully!', data };
      }

      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }

      if (status === 401) {
        return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      }

      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.updateState] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  // ── PROFILE API ────────────────────────────────────────

  /**
   * Get current user profile
   * GET /profile
   */
  getProfile: async () => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await getJSON('/profile', token);

      if (status === 200 || status === 201) {
        return { ok: true, user: data?.user || data?.data || data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      return { ok: false, message: data?.message || 'Unable to fetch profile.' };
    } catch (_err) {
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

    getPublicProfileById: async (id) => {
    try {
      const { status, data } = await getJSON(`/profile/${id}`);
      if (status === 200) return { ok: true, profile: data?.profile };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getPublicProfileById] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Upload profile image (first time)
   * POST /profile  (form-data: profile_image)
   */
  uploadProfileImage: async (imageUri) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Web: base64 uri ko Blob mein convert karo
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('profile_image', blob, 'profile.jpg');
      } else {
        // Native: file uri directly
        formData.append('profile_image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      }

      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          // Content-Type: multipart/form-data - intentionally omit, browser sets boundary
        },
        body: formData,
      });

      const json = await res.json();
      if (res.status === 200 || res.status === 201) {
        return { ok: true, data: json, imageUrl: json?.profile_image || json?.data?.profile_image || '' };
      }
      if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      return { ok: false, message: json?.message || 'Upload failed.' };
    } catch (_err) {
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Update profile image
   * POST /profile/image  (form-data: profile_image)
   */
  updateProfileImage: async (imageUri) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('profile_image', blob, 'profile.jpg');
      } else {
        formData.append('profile_image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      }

      const res = await fetch(`${BASE_URL}/profile/image`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

     const json = await res.json();
      if (res.status === 200 || res.status === 201) {
        // ✅ Image turant overwrite nahi hoti — admin approve na kare tab tak
        // pending_profile_image_url me hi save rehti hai.
           const profile = json?.user?.profile || json?.profile || json?.data?.profile || json?.data || json;
        return {
          ok: true,
          data: json,
          pendingImageUrl: profile?.pending_profile_image_url || '',
          imageUrl: profile?.profile_image_url || profile?.profile_image || '',
          profileUpdateStatus: profile?.profile_update_status ?? null,
        };
      }
      if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      return { ok: false, message: json?.message || 'Update failed.' };
    } catch (_err) {
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Update profile text fields
  /**
   * Update profile text fields — backend ye pending-approval flow khud handle karta hai:
   * phone/bio turant overwrite nahi hote, pending_phone/pending_bio me chale jaate hain
   * jab tak admin approve na kare.
   * POST /profile  (form-data: phone, bio)
   */
   updateProfile: async ({ name, email, phone, bio }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const formData = new FormData();
      if (name !== undefined) formData.append('name', name || '');
      if (email !== undefined) formData.append('email', email || '');
      if (phone !== undefined) formData.append('phone', phone || '');
      if (bio !== undefined) formData.append('bio', bio || '');

      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (res.status === 200 || res.status === 201) {
        const profile = json?.user?.profile || json?.profile || json?.data?.profile || json?.data || json;
        return { ok: true, profile };
      }
      if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (res.status === 422) {
        const errors = json?.errors || {};
        const firstError = Object.values(errors).flat()[0] || json?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: json?.message || 'Update failed.' };
    } catch (_err) {
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  // ── REFERRAL API ────────────────────────────────────────

  /**
   * Get referral summary for current user
   * GET /referrals (no params needed — backend reads current user from token)
   * Headers: Authorization: Bearer {token}
   */
  getReferrals: async () => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await getJSON('/referral', token);

      if (status === 200 || status === 201) {
        return { ok: true, data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getReferrals] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  // ── NEWS API ────────────────────────────────────────────

  /**
   * Create News
   * POST /news
   * Body (form-data): tittle, sub_tittle, description, report_type, media_type, media (file)
   * Headers: Authorization: Bearer {token}
   * media_type: 0 = None, 1 = Image, 2 = Video, 3 = File  (confirm with backend if unsure)
   */



  // ─────────────────────────────────────────────────────────
  // ROLE SUBSCRIPTION API
  // ─────────────────────────────────────────────────────────

  /**
   * Create Razorpay order for Role Subscription
   * POST /role-subscriptions/purchase
   * Body: { plan_id }
   */
   purchaseRoleSubscription: async ({ planId, isPremium = false, state = '', district = '', taluka = '', village = '' }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      // ✅ NEW: backend ab sirf seat ka display-naam nahi, balki designation_id
      // (STATE_SEAT_ROLES ka id / role_id) aur poori applicable location
      // (state/district/taluka/village) bhi paayega — isi se woh seat ko
      // uski exact location par lock/unlock kar sakega.
      // ✅ Seat Lock: Premium plan par seat lock nahi hota — sirf plan_id bhejo.
      // Role plan par state (required) + district/taluka/village (optional, beech me gap nahi).
      // Purana `state_seat` param hata diya — naya code sirf `state` use karta hai.
      const body = { plan_id: planId };
      if (!isPremium) {
        body.state = state;
        if (district) body.district = district;
        if (taluka && district) body.taluka = taluka;
        if (village && taluka && district) body.village = village;
      }
      const { status, data } = await postJSON('/role-subscriptions/purchase', body, token);

      if (status === 200 || status === 201) {
        // seat.reserved_until se 15-min countdown dikha sakte ho (Premium par seat = null)
        return { ok: true, razorpay: data?.razorpay, seat: data?.seat || null, message: data?.message };
      }
      // ✅ 409 seat_unavailable — seat kisi aur ke paas hai. Razorpay MAT kholo.
      if (status === 409) {
        return {
          ok: false,
          seatUnavailable: true,
          code: data?.code || 'seat_unavailable',
          message: data?.message || 'This seat is already taken. Please choose another location.',
        };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.purchaseRoleSubscription] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Verify Role Subscription Payment
   * POST /role-subscriptions/payment/verify
   */
  verifyRoleSubscriptionPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await postJSON('/role-subscriptions/payment/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }, token);

      if (status === 200 || status === 201) {
        return { ok: true, data };
      }
      // ✅ 409 seat_unavailable — payment ho gaya par 15 min ke baad seat kisi aur ko mil chuki.
      // Backend refund try karta hai. "Subscription active" MAT dikhao.
      if (status === 409) {
        return {
          ok: false,
          seatUnavailable: true,
          code: data?.code || 'seat_unavailable',
          message: data?.message || 'This seat was taken by someone else before your payment completed. A refund will be initiated.',
        };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Payment verification failed (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.verifyRoleSubscriptionPayment] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error during verification.' };
    }
  },

  /**
   * ✅ NEW: Role Subscription payment fail / cancel
   * POST /role-subscriptions/payment/failed
   * Isse reserved seat turant release hoti hai (warna 15 min hold rehti hai).
   */
  markRoleSubscriptionPaymentFailed: async ({ razorpay_order_id, error_code, error_description }) => {
    try {
      const token = await getAuthToken();
      const { status, data } = await postJSON('/role-subscriptions/payment/failed', {
        razorpay_order_id,
        error_code,
        error_description,
      }, token);
      return { ok: status === 200 || status === 201, data, message: data?.message };
    } catch (err) {
      console.error('[AuthAPI.markRoleSubscriptionPaymentFailed] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },
 /**
   * Get all available Role Subscription Plans
   * GET /role-subscription-plans
   * Headers: Authorization: Bearer {token}
   */
getRoleSubscriptionPlans: async (userId, loc = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const numericUserId = Number(userId);
           const qs = [];
      if (Number.isFinite(numericUserId) && numericUserId > 0) qs.push(`user_id=${numericUserId}`);
      // ✅ chuni hui location -> backend is_sold isi location ke hisaab se dega
      if (loc.state) {
        qs.push(`state=${encodeURIComponent(loc.state)}`);
        if (loc.district) qs.push(`district=${encodeURIComponent(loc.district)}`);
        if (loc.district && loc.taluka) qs.push(`taluka=${encodeURIComponent(loc.taluka)}`);
        if (loc.district && loc.taluka && loc.village) qs.push(`village=${encodeURIComponent(loc.village)}`);
      }
      const endpoint = qs.length
        ? `/role-subscription-plans?${qs.join('&')}`
        : '/role-subscription-plans';

       let { status, data } = await getJSON(endpoint, token);

      const pickList = (d) => (Array.isArray(d)
        ? d
        : (d?.role_subscription_plans || d?.data || d?.plans || d?.subscription_plans || []));

      if (status === 200 || status === 201) {
        let rawList = pickList(data);

        // ✅ FIX: agar user_id ke saath list khaali aayi, to bina user_id dobara try karo
        if ((!rawList || rawList.length === 0) && endpoint.includes('user_id=')) {
          const retry = await getJSON('/role-subscription-plans', token);
          console.log('[AuthAPI.getRoleSubscriptionPlans] retry raw ->', retry.status, retry.data);
          if (retry.status === 200 || retry.status === 201) {
            rawList = pickList(retry.data);
          }
        }

        console.log('[AuthAPI.getRoleSubscriptionPlans] final count ->', rawList?.length, rawList?.[0]);
        return { ok: true, plans: rawList || [] };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getRoleSubscriptionPlans] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },
/**
   * Get Ad Subscription Plans (public route)
   * GET /subscription-plans
   * ⚠️ ASSUMPTION: exact wrapper key backend se confirm nahi hai abhi —
   * isliye common patterns (data / subscription_plans / plans) try kiye hain.
   * Console log check karke agar mismatch ho to yahan key fix karenge.
   */
  getAdSubscriptionPlans: async () => {
    try {
      const { status, data } = await getJSON('/subscription-plans');
      if (status === 200 || status === 201) {
        const rawList = Array.isArray(data)
          ? data
          : (data?.subscription_plans || data?.data || data?.plans || []);
        return { ok: true, plans: rawList };
      }
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getAdSubscriptionPlans] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Get current user's Role Subscription (Backend Sync)
   * GET /my-role-subscriptions
   * Headers: Authorization: Bearer {token}
   */

  getMyRoleSubscriptions: async () => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await getJSON('/my-role-subscriptions', token);

      if (status === 200 || status === 201) {
        return { ok: true, subscriptions: data?.data || data?.subscriptions || data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
   console.error('[AuthAPI.getMyRoleSubscriptions] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Get current user's ALL subscriptions (combined — role/quiz/ecom/ads)
   * GET /my-subscriptions
   * Headers: Authorization: Bearer {token}
   */
  getMySubscriptions: async () => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await getJSON('/my-subscriptions', token);

      if (status === 200 || status === 201) {
        const raw = data?.data || data?.subscriptions || data;
        return { ok: true, subscriptions: Array.isArray(raw) ? raw : (raw ? [raw] : []) };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getMySubscriptions] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },


  // ─────────────────────────────────────────────────────────
  // ID CARD — verification_url + qr_payload (backend se)
  // ─────────────────────────────────────────────────────────

  /**
   * GET /id-cards   (Authorization: Bearer <login-token>)
   * Response: { id_cards: [{ id, id_number, verification_url, qr_payload }] }
   */
  getIdCards: async () => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
      const { status, data } = await getJSON('/id-cards', token);
      if (status === 200) {
        const raw = data?.id_cards || data?.data || data?.id_card || [];
        return { ok: true, idCards: Array.isArray(raw) ? raw : (raw ? [raw] : []) };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getIdCards] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * POST /id-cards   Body: { subscription_id }
   * Card na ho tabhi call hota hai. Response me bhi verification_url + qr_payload aate hain.
   */
  createIdCard: async ({ subscriptionId }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
      const { status, data } = await postJSON('/id-cards', { subscription_id: subscriptionId }, token);
      if (status === 200 || status === 201) {
        const card = data?.id_card || data?.data || data;
        return { ok: true, idCard: card };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.createIdCard] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * PUBLIC verify — verification_url ko seedha hit karo.
   * ⚠️ Yahan Authorization header JAAN-BUJHKE nahi bheja jaata (login JWT kabhi nahi).
   * Valid: { verified: true, status: 'active' } | Invalid: { verified: false }
   */
  verifyIdCard: async (verificationUrl) => {
    try {
      const res = await fetch(String(verificationUrl), { method: 'GET', headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      return { ok: true, verified: data?.verified === true, status: data?.status || null, data };
    } catch (err) {
      console.error('[AuthAPI.verifyIdCard] Error:', err);
      return { ok: false, isNetwork: true, verified: false };
    }
  },

  // ─────────────────────────────────────────────────────────
  // ADS SUBSCRIPTION — ORDER CREATE + VERIFY
  // ─────────────────────────────────────────────────────────
  createAdSubscriptionOrder: async ({ planId }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await postJSON('/subscription-plans/purchase', {
        plan_id: planId,
      }, token);

      if (status === 200 || status === 201) {
        return { ok: true, razorpay: data?.razorpay, message: data?.message };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.createAdSubscriptionOrder] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  // ─────────────────────────────────────────────────────────
  // ECOM SUBSCRIPTION — ORDER CREATE
  // POST /ecom-subscriptions/purchase (route khud type='ecom' set karta hai,
  // body mein sirf plan_id chahiye — type bhejne ki zaroorat nahi)
  // ─────────────────────────────────────────────────────────
  createEcomSubscriptionOrder: async ({ planId }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

          const { status, data } = await postJSON('/ecom-subscriptions/purchase', {
        plan_id: Number(planId),
      }, token);
      if (status === 200 || status === 201) {
        return { ok: true, razorpay: data?.razorpay, message: data?.message };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.createEcomSubscriptionOrder] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  // ─────────────────────────────────────────────────────────
  // ADS / ECOM — SHARED VERIFY
  // POST /subscriptions/payment/verify
  // ─────────────────────────────────────────────────────────
  verifySubscriptionPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await postJSON('/subscriptions/payment/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }, token);

      if (status === 200 || status === 201) {
        return { ok: true, data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Payment verification failed (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.verifySubscriptionPayment] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error during verification.' };
    }
  },

  // ─────────────────────────────────────────────────────────
  // COMMON — PAYMENT FAILED (sab plan types ke liye)
  // POST /subscriptions/payment/failed
  // ─────────────────────────────────────────────────────────
  markSubscriptionPaymentFailed: async ({ razorpay_order_id, error_code, error_description }) => {
    try {
      const token = await getAuthToken();
      const { status, data } = await postJSON('/subscriptions/payment/failed', {
        razorpay_order_id,
        error_code,
        error_description,
      }, token);

      return { ok: status === 200 || status === 201, data, message: data?.message };
    } catch (err) {
      console.error('[AuthAPI.markSubscriptionPaymentFailed] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  // ─────────────────────────────────────────────────────────
  // NEWS API
  // ─────────────────────────────────────────────────────────
  // Public quiz-type lists used by the certification screen.
 getQuizType: async (type, subject, difficulty) => {
    try {
      const allowedTypes = ['practice', 'training', 'exam'];
      if (!allowedTypes.includes(type)) return { ok: false, message: 'Invalid quiz type.' };
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Please login to view quizzes.' };
      const qs = new URLSearchParams();
      if (subject) qs.append('subject', subject);
      if (difficulty && type === 'practice') qs.append('difficulty', difficulty);
      const query = qs.toString() ? `?${qs.toString()}` : '';
     const { status, data } = await getJSON(`/quiz-types/${type}${query}`, token);
      if (status === 200 || status === 201) {
        const raw = data?.quiz_type || data?.data || data?.quizzes || data?.quiz_types || data;
        const allQuizzes = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
        // ✅ FIX: backend se "test_type" number aata hai: 1 = practice, 2 = training, 3 = exam.
        // Backend kabhi kabhi teeno type ek hi list me bhej deta hai, isliye yahan
        // sirf wahi quizzes rakho jinka test_type selected type se match karta hai.
        // Agar item me test_type hai hi nahi to usko filter nahi karte (purana behaviour).
        const TEST_TYPE_ID = { practice: 1, training: 2, exam: 3 };
        const TEST_TYPE_NAME = { practice: 1, training: 2, exam: 3 };
        const wanted = TEST_TYPE_ID[type];
        const quizzes = allQuizzes.filter((q) => {
          const rawType = q?.test_type ?? q?.testType;
          if (rawType === undefined || rawType === null || rawType === '') return true;
          const asNumber = Number(rawType);
          if (Number.isFinite(asNumber)) return asNumber === wanted;
          const asName = String(rawType).trim().toLowerCase();
          return TEST_TYPE_NAME[asName] === wanted;
        });
        return { ok: true, quizzes };
      }
      if (status === 401) return { ok: false, isAuth: true, message: data?.message || 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getQuizType] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

 getPracticeQuizzes: async (subject, difficulty) => AuthAPI.getQuizType('practice', subject, difficulty),
  getTrainingQuizzes: async (subject) => AuthAPI.getQuizType('training', subject),
  getExamQuizzes: async (subject) => AuthAPI.getQuizType('exam', subject),

  // Full quiz attempt history for the logged-in user — used by the "My Attempts" screen.
  // GET /quiz/history?user_id=<id>
  getQuizHistory: async (userId) => {
    try {
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
        return { ok: false, message: 'Unable to identify your account. Please re-login.' };
      }
      const token = await getAuthToken();
      // ✅ quiz_type=exam bhejna hai (My Attempts/Certificate flow sirf Exam type
      // attempts ke liye history maangta hai).
      const { status, data } = await getJSON(`/quiz/history?user_id=${numericUserId}&quiz_type=exam`, token);
      if (status === 200 || status === 201) {
        const raw = data?.data || data?.history || data?.quizzes || data;
        const history = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
        return { ok: true, history };
      }
      if (status === 401) return { ok: false, isAuth: true, message: data?.message || 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getQuizHistory] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },
  // Quiz attempt endpoints. These accept the same optional bearer token used by
  // the rest of the app, while still working with the backend's user_id payload.

  
  startQuiz: async ({ userId, quizTypeId, subject, difficulty }) => {
    try {
      const numericUserId = Number(userId);
      const numericQuizTypeId = Number(quizTypeId);

      if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
        return { ok: false, message: 'Unable to identify your account. Please re-login.' };
      }
      if (!Number.isFinite(numericQuizTypeId) || numericQuizTypeId <= 0) {
        return { ok: false, message: 'Invalid quiz. Please go back and select a quiz again.' };
      }
     const token = await getAuthToken();
      const payload = {
        user_id: numericUserId,
        quiz_type_id: numericQuizTypeId,
      };
      if (subject) payload.subject = subject;
      if (difficulty) payload.difficulty = difficulty;

    const { status, data } = await postJSON('/quiz/start', payload, token);
console.log('[startQuiz RAW]', JSON.stringify(data));
if (status === 200 || status === 201) {
  const payload = data?.data || data;
  return { ok: true, attempt: payload, attemptId: payload?.attempt_id || payload?.id };
}
      if (status === 401) return { ok: false, isAuth: true, message: data?.message || 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.startQuiz] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },
 submitQuiz: async ({ attemptId, answers }) => {
    try {
      const numericAttemptId = Number(attemptId);
      if (!Number.isFinite(numericAttemptId) || numericAttemptId <= 0) {
        return { ok: false, message: 'Invalid quiz attempt. Please restart the quiz.' };
      }
      if (!Array.isArray(answers) || answers.length === 0) {
        return { ok: false, message: 'No answers to submit.' };
      }

      const token = await getAuthToken();
      const { status, data } = await postJSON('/quiz/submit', {
        attempt_id: numericAttemptId,
        answers,
      }, token);
      if (status === 200 || status === 201) return { ok: true, result: data?.data || data };
      if (status === 401) return { ok: false, isAuth: true, message: data?.message || 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.submitQuiz] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },
  getQuizResult: async (attemptId) => {
    try {
      const token = await getAuthToken();
      const { status, data } = await getJSON(`/quiz/result/${attemptId}`, token);
      if (status === 200 || status === 201) return { ok: true, result: data?.data || data };
      if (status === 401) return { ok: false, isAuth: true, message: data?.message || 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getQuizResult] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },


  // ─────────────────────────────────────────────────────────
  // QUIZ SUBSCRIPTION API
  // ─────────────────────────────────────────────────────────

  /**
   * Get all active Quiz Subscription Plans (public route)
   * GET /quiz-subscription-plans
   */
  getQuizSubscriptionPlans: async () => {
    try {
      const { status, data } = await getJSON('/quiz-subscription-plans');
      if (status === 200 || status === 201) {
        const rawList = Array.isArray(data)
          ? data
          : (data?.quiz_subscription_plans || data?.data || data?.plans || []);
        return { ok: true, plans: rawList };
      }
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getQuizSubscriptionPlans] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Create Razorpay order for Quiz Subscription
   * POST /quiz-subscriptions/purchase
   * Body: { plan_id }
   */
  purchaseQuizSubscription: async ({ planId }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await postJSON('/quiz-subscriptions/purchase', {
        plan_id: planId,
      }, token);

      if (status === 200 || status === 201) {
        return { ok: true, razorpay: data?.razorpay, message: data?.message };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      if (status === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.purchaseQuizSubscription] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  /**
   * Verify Quiz Subscription Payment
   * POST /quiz-subscriptions/payment/verify
   */
  verifyQuizSubscriptionPayment: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await postJSON('/quiz-subscriptions/payment/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }, token);

      if (status === 200 || status === 201) return { ok: true, data };
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Payment verification failed (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.verifyQuizSubscriptionPayment] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error during verification.' };
    }
  },

  /**
   * Get current user's Quiz Subscriptions
   * GET /my-quiz-subscriptions
   */
  getMyQuizSubscriptions: async () => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await getJSON('/my-quiz-subscriptions', token);
      if (status === 200 || status === 201) {
        return { ok: true, subscriptions: data?.data || data?.subscriptions || data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getMyQuizSubscriptions] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },
  /**
   * Quiz payment fail / cancel
   * POST /quiz-subscriptions/payment/failed
   * Body: { razorpay_order_id, error_code, error_description }
   */
  markQuizSubscriptionPaymentFailed: async ({ razorpay_order_id, error_code, error_description }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
      const { status, data } = await postJSON('/quiz-subscriptions/payment/failed', {
        razorpay_order_id,
        error_code,
        error_description,
      }, token);
      return { ok: status === 200 || status === 201, data, message: data?.message };
    } catch (err) {
      console.error('[AuthAPI.markQuizSubscriptionPaymentFailed] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * User ki apni Payment History (Role / Ads / Ecom / Quiz — ek hi API)
   * GET /payment-history
   * Query (sab optional): module (role|ads|ecom|quiz), status (all|created|paid|failed),
   *                       from, to (YYYY-MM-DD), page, per_page (default 20, max 100)
   * user_id yahan kabhi nahi bhejte — backend token se user pehchanta hai.
   */
  getPaymentHistory: async (params = {}) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const qs = new URLSearchParams();
      const allowed = ['module', 'status', 'from', 'to', 'page', 'per_page'];
      allowed.forEach((key) => {
        const v = params?.[key];
        if (v === undefined || v === null || v === '') return;
        if (v === 'all' && (key === 'module' || key === 'status')) return; // 'all' = default, bhejna zaroori nahi
        qs.append(key, String(v));
      });
      const query = qs.toString();
      const { status, data } = await getJSON(query ? `/payment-history?${query}` : '/payment-history', token);

      if (status === 200 || status === 201) {
        return {
          ok: true,
          items: Array.isArray(data?.data) ? data.data : [],
          meta: data?.meta || null,
          summary: data?.summary || null,
        };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getPaymentHistory] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
    }
  },

  // getQuizHistory: async (userId) => {
  //   try {
  //     const token = await getAuthToken();
  //     // ✅ quiz_type=exam bhejna hai.
  //     const { status, data } = await getJSON(`/quiz/history?user_id=${encodeURIComponent(String(userId))}&quiz_type=exam`, token);
  //     if (status === 200 || status === 201) return { ok: true, history: data?.data || data?.history || data };
  //     if (status === 401) return { ok: false, isAuth: true, message: data?.message || 'Session expired. Please login again.' };
  //     return { ok: false, message: data?.message || `Server error (${status}).` };
  //   } catch (err) {
  //     console.error('[AuthAPI.getQuizHistory] Error:', err);
  //     return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
  //   }
  // },

  createNews: async ({
    type = 1, // 1 = News, 2 = Feed (Reel)
    title,
    subTitle = '',
    description,
    reportType,
    mediaType = 0,
    mediaUri = null,
    mediaName = 'media',
    mediaMime = '',
    extraImages = [],
  }) => {
    try {
      console.log("Received mediaUri:", mediaUri);
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const formData = new FormData();
      formData.append('type', String(Number(type) === 2 ? 2 : 1));
      formData.append('tittle', title || '');
      formData.append('sub_tittle', subTitle || '');
      formData.append('description', description || '');
      formData.append('report_type', reportType || '');
      formData.append('media_type', String(mediaType));

      if (mediaUri) {
        if (Platform.OS === 'web') {
          const fileRes = await fetch(mediaUri);
          const blob = await fileRes.blob();
          formData.append(Number(mediaType) === 1 ? 'images[]' : 'media', blob, mediaName);
        } else {
                 formData.append(Number(mediaType) === 1 ? 'images[]' : 'media', {
            uri: mediaUri,
            type: mediaMime || 'application/octet-stream',
            name: mediaName,
          });
        }
      }

      for (let i = 0; i < (extraImages || []).length; i += 1) {
        const uri = extraImages[i];
        if (!uri) continue;
        if (Platform.OS === 'web') {
          const blob = await fetch(uri).then((r) => r.blob());
          formData.append('images[]', blob, `image_${i + 1}.jpg`);
        } else {
          formData.append('images[]', { uri, type: 'image/jpeg', name: `image_${i + 1}.jpg` });
        }
      }

      const res = await fetch(`${BASE_URL}/news`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          // Content-Type intentionally omit — browser/RN sets multipart boundary
        },
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (res.status === 200 || res.status === 201) {
        // ✅ Null-safe: free user => free_posts_remaining number, remaining_credits null.
        // Subscriber => remaining_credits number, free_posts_remaining null.
        // Number(null) === 0 hota hai, isliye pehle explicit null check.
        const toNumOrNull = (v) => {
          if (v === null || v === undefined || v === '') return null;
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };
        return {
          ok: true,
          data: json,
          news: json?.news || json?.data || json,
          freePostsRemaining: toNumOrNull(json?.free_posts_remaining),
          remainingCredits: toNumOrNull(json?.remaining_credits),
        };
      }
      if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      // ✅ Free limit khatam — generic error nahi, screen popup dikhayegi.
      // 403 ke baaki cases (alag code) neeche generic handling se hi jaayenge.
      if (res.status === 403 && json?.code === 'NEWS_LIMIT_REACHED') {
        return {
          ok: false,
          limitReached: true,
          code: 'NEWS_LIMIT_REACHED',
          message: json?.message || '2 free news used. Purchase a role subscription.',
        };
      }
      if (res.status === 422) {
        const errors = json?.errors || {};
        const firstError = Object.values(errors).flat()[0] || json?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: json?.message || `Server error (${res.status}).` };
    } catch (err) {
      console.error('[AuthAPI.createNews] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },


  /**
   * Like a news item (toggle-style backend — POST /likes creates a like)
   * POST /likes
   * Body (form-data): user_id, news_id
   * Headers: Authorization: Bearer {token}
   * Response: { message, like: { like: 1|0, is_deleted: 0|1, ... } }
   */
   likeNews: async ({ userId = null, newsId, adsId = null }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const numericId = Number(adsId || newsId);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        return { ok: false, message: 'This post is not synced with the server yet.' };
      }

      let status; let data;
      if (adsId) {
        // Ads ka backend contract doc mein nahi hai — purana behaviour as-is
        const numericUserId = Number(userId);
        if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
          return { ok: false, message: 'Unable to identify your account. Please re-login.' };
        }
        ({ status, data } = await postFormData('/likes', { user_id: numericUserId, ads_id: numericId }, token));
      } else {
        // ✅ News: sirf news_id. user_id NAHI — backend token se user pehchanta hai
        ({ status, data } = await postJSON('/likes', { news_id: numericId }, token));
      }

      if (status === 200 || status === 201) {
        const liked = data?.liked !== undefined ? Boolean(data.liked) : Number(data?.like?.like) === 1;
        const likesCount = data?.likes_count != null ? Number(data.likes_count) : null;
        return { ok: true, liked, likesCount, data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      return { ok: false, message: apiErrorMessage(status, data) };
    } catch (err) {
      console.error('[AuthAPI.likeNews] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Unlike a news item — explicit DELETE route
   * DELETE /likes/{newsId}
   * Headers: Authorization: Bearer {token}
   * ⚠️ ASSUMPTION: newsId jaata hai URL mein, koi body nahi. Agar 422/404 aaye to yahan fix karenge.
   */
  unlikeNews: async (newsId) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const response = await fetch(`${BASE_URL}/likes/${newsId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        return { ok: true, liked: false, likesCount: json?.likes_count != null ? Number(json.likes_count) : null, message: json?.message || 'Unliked.', data: json };
      }
      if (response.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      // ✅ FIX: 404 ka matlab hai already unliked hai (idempotent) — isse
      // error na maano, warna app "unlike fail hua" dikhake wapis liked
      // state pe revert kar deta tha jabki backend pe already unliked tha.
      if (response.status === 404) return { ok: true, liked: false, message: 'Already not liked.', data: json };
      return { ok: false, message: json?.message || `Server error (${response.status}).` };
    } catch (err) {
      console.error('[AuthAPI.unlikeNews] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**

   * Get comments for a news item
   * GET /comments/{newsId}
   * Headers: Authorization: Bearer {token}
   * ⚠️ ASSUMPTION: response array ka exact shape/wrapper pata nahi — sab common patterns try karta hai
   */
    getComments: async (newsId, { perPage = 20, cursor = null } = {}) => {
    try {
      const params = { per_page: Math.min(Number(perPage) || 20, 50) };
      if (cursor) params.cursor = cursor;
      // ✅ PUBLIC endpoint — guest bhi dekh sakta hai, expired token par ek baar retry
      const { status, data } = await publicRequest(`/comments/${newsId}?${new URLSearchParams(params).toString()}`);

      if (status === 200 || status === 201) {
        const list = Array.isArray(data?.comments) ? data.comments
          : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
        const nextCursor = data?.next_cursor || data?.pagination?.next_cursor || null;
        const hasMore = Boolean((data?.has_more ?? data?.pagination?.has_more) && nextCursor);
        return { ok: true, comments: list, hasMore, nextCursor };
      }
      if (status === 404) return { ok: false, notFound: true, message: apiErrorMessage(status, data) };
      return { ok: false, message: apiErrorMessage(status, data) };
    } catch (err) {
      console.error('[AuthAPI.getComments] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },


postComment: async ({ newsId, adsId = null, text, parentId = null }) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

    const numericNewsId = Number(adsId || newsId);
    if (!Number.isFinite(numericNewsId) || numericNewsId <= 0) {
      return { ok: false, message: 'This post is not synced with the server yet.' };
    }

    // ✅ FIX: backend "comment" field chahta hai top-level ke liye,
    // aur reply ke liye "sub_comment" + parent_id
    const contentIdField = adsId ? { ads_id: numericNewsId } : { news_id: numericNewsId };
    const fields = parentId
      ? { ...contentIdField, sub_comment: text || '', parent_id: String(parentId) }
      : { ...contentIdField, comment: text || '' };

       const { status, data } = await postFormData('/comments', fields, token);
    if (status === 403 || status === 429) return { ok: false, message: apiErrorMessage(status, data) };

    if (status === 200 || status === 201) {
      return {
        ok: true,
        comment: data?.comment_detail || data?.data || data?.comment || data,
        commentsCount: data?.comments_count != null ? Number(data.comments_count) : null,
      };
    }
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (status === 422) {
      const errors = data?.errors || {};
      const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.postComment] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},


  /**
   * Delete a comment
   * DELETE /comments/{commentId}
   * Headers: Authorization: Bearer {token}
   */
  deleteComment: async (commentId) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const response = await fetch(`${BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        return { ok: true, message: json?.message || 'Comment deleted.', commentsCount: json?.comments_count != null ? Number(json.comments_count) : null, data: json };
      }
      if (response.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (response.status === 404) return { ok: false, notFound: true, message: 'Comment not found.' };
      if (response.status === 403) return { ok: false, message: json?.message || 'You cannot delete this comment.' };
      if (response.status === 429) return { ok: false, message: 'Please try again later.' };
      return { ok: false, message: json?.message || `Server error (${response.status}).` };
    } catch (err) {
      console.error('[AuthAPI.deleteComment] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  

  // ═══════════════════════════════════════════════════════════
  // ✅ COMMENT INTERACTION API (like / edit / replies)
  // ═══════════════════════════════════════════════════════════

  /** GET /comments/{newsId}/detailed — likes_count, liked_by_me, replies_count, is_mine ke saath */
  getCommentsDetailed: async (newsId, { perPage = 20, cursor = null } = {}) => {
    try {
      const params = { per_page: Math.min(Number(perPage) || 20, 50) };
      if (cursor) params.cursor = cursor;
      const { status, data } = await publicRequest(`/comments/${newsId}/detailed?${new URLSearchParams(params).toString()}`);
      if (status === 200 || status === 201) {
        const list = Array.isArray(data?.comments) ? data.comments : [];
        const nextCursor = data?.next_cursor || null;
        return { ok: true, comments: list, hasMore: Boolean(data?.has_more && nextCursor), nextCursor };
      }
      return { ok: false, notFound: status === 404, message: apiErrorMessage(status, data) };
    } catch (err) {
      console.error('[AuthAPI.getCommentsDetailed] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /** POST /comments/{commentId} — edit (POST WAF-safe) */
  editComment: async (commentId, text) => {
    try {
      const r = await authedJSON('POST', `/comments/${commentId}`, { comment: text });
      return r.ok ? { ok: true, comment: r.data.comment_detail || null } : r;
    } catch (err) { return { ok: false, isNetwork: true, message: 'Network error.' }; }
  },

  /** POST /comments/{commentId}/like — toggle */
  likeComment: async (commentId) => {
    try {
      const r = await authedJSON('POST', `/comments/${commentId}/like`);
      return r.ok ? { ok: true, liked: Boolean(r.data.liked), likesCount: Number(r.data.likes_count ?? 0) } : r;
    } catch (err) { return { ok: false, isNetwork: true, message: 'Network error.' }; }
  },

  /** GET /comments/{commentId}/replies */
  getReplies: async (commentId, { perPage = 20, cursor = null } = {}) => {
    try {
      const params = { per_page: Math.min(Number(perPage) || 20, 50) };
      if (cursor) params.cursor = cursor;
      const { status, data } = await publicRequest(`/comments/${commentId}/replies?${new URLSearchParams(params).toString()}`);
      if (status === 200 || status === 201) {
        const list = Array.isArray(data?.replies) ? data.replies : [];
        const nextCursor = data?.next_cursor || null;
        return { ok: true, replies: list, hasMore: Boolean(data?.has_more && nextCursor), nextCursor };
      }
      return { ok: false, notFound: status === 404, message: apiErrorMessage(status, data) };
    } catch (err) {
      console.error('[AuthAPI.getReplies] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /** POST /comments/{commentId}/replies — body: { reply } */
  addReply: async (commentId, text) => {
    try {
      const r = await authedJSON('POST', `/comments/${commentId}/replies`, { reply: text });
      return r.ok
        ? { ok: true, reply: r.data.reply || null, repliesCount: r.data.replies_count != null ? Number(r.data.replies_count) : null }
        : r;
    } catch (err) { return { ok: false, isNetwork: true, message: 'Network error.' }; }
  },

  /** POST /comment-replies/{replyId} — edit */
  editReply: async (replyId, text) => {
    try {
      const r = await authedJSON('POST', `/comment-replies/${replyId}`, { reply: text });
      return r.ok ? { ok: true, reply: r.data.reply || null } : r;
    } catch (err) { return { ok: false, isNetwork: true, message: 'Network error.' }; }
  },

  /** DELETE /comment-replies/{replyId} */
  deleteReply: async (replyId) => {
    try {
      const r = await authedJSON('DELETE', `/comment-replies/${replyId}`);
      return r.ok ? { ok: true, repliesCount: r.data.replies_count != null ? Number(r.data.replies_count) : null } : r;
    } catch (err) { return { ok: false, isNetwork: true, message: 'Network error.' }; }
  },

  /** POST /comment-replies/{replyId}/like — toggle */
  likeReply: async (replyId) => {
    try {
      const r = await authedJSON('POST', `/comment-replies/${replyId}/like`);
      return r.ok ? { ok: true, liked: Boolean(r.data.liked), likesCount: Number(r.data.likes_count ?? 0) } : r;
    } catch (err) { return { ok: false, isNetwork: true, message: 'Network error.' }; }
  },

  /**
   * Get News List (Index)
   * GET /news
   * Headers: Authorization: Bearer {token}
   */
     getNewsList: async (params = {}) => {
    try {
      const query = {};
      if (params.per_page) query.per_page = Math.min(Number(params.per_page) || 10, 30);
      if (params.cursor) query.cursor = params.cursor;   // pehli request mein cursor NAHI jaata
      if (params.type === 1 || params.type === 2) query.type = params.type; // 1 = news, 2 = feeds/reels
      const qs = new URLSearchParams(query).toString();
      const { status, data } = await publicRequest(qs ? `/news?${qs}` : '/news');

      if (status === 200 || status === 201) {
        const list = Array.isArray(data?.news) ? data.news
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.data?.data) ? data.data.data
          : (Array.isArray(data) ? data : []);
        const pg = data?.pagination || {};
        const nextCursor = pg.next_cursor || data?.next_cursor || null;
        const hasMore = Boolean((pg.has_more ?? data?.has_more) && nextCursor);
        return {
          ok: true,
          news: list,
          pagination: {
            per_page: pg.per_page || Number(query.per_page) || 10,
            has_more: hasMore,
            next_cursor: nextCursor,
            next_page_url: pg.next_page_url || data?.next_page_url || null,
          },
        };
      }
      // Public API hai — 401 yahan tak aaye to bhi guest ko Login pe NAHI bhejna
      return { ok: false, message: apiErrorMessage(status, data) };
    } catch (err) {
      console.error('[AuthAPI.getNewsList] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * ✅ NEW: Share count — POST /news/{id}/share (public, no body)
   * Sirf native share SUCCESS hone ke baad call karna.
   */
  shareNews: async (newsId) => {
    try {
      const { status, data } = await publicRequest(`/news/${newsId}/share`, { method: 'POST' });
      if (status === 200 || status === 201) {
        const raw = data?.share_count ?? data?.shares_count ?? data?.shares;
        return { ok: true, shareCount: raw != null ? Number(raw) : null, data };
      }
      if (status === 429) return { ok: false, rateLimited: true, message: 'Please try again later.' };
      return { ok: false, message: apiErrorMessage(status, data) };
    } catch (err) {
      console.error('[AuthAPI.shareNews] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Get single News by ID (Show)
   * GET /news/{id}
   * Headers: Authorization: Bearer {token}
   */
  getNewsById: async (newsId) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await getJSON(`/news/${newsId}`, token);

      if (status === 200 || status === 201) {
        return { ok: true, news: data?.data || data?.news || data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (status === 404) return { ok: false, message: 'News not found.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getNewsById] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Update News
   * POST /news/{id}  (Laravel mein _method: PUT bhejna form-data ke saath)
   * Body (form-data): tittle, sub_tittle, description, report_type, media_type, media (file, optional)
   * Headers: Authorization: Bearer {token}
   */
  updateNews: async (newsId, {
    type, // optional: 1 = News, 2 = Feed (Reel). Na bhejo to purana rahega
    title,
    subTitle = '',
    description,
    reportType,
    mediaType = 0,
    mediaUri = null,
    mediaName = 'media',
    mediaMime = '',
    extraImages = [],
  }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel form-data + PUT trick
      if (type === 1 || type === 2 || type === '1' || type === '2') formData.append('type', String(type));
      formData.append('tittle', title || '');
      formData.append('sub_tittle', subTitle || '');
      formData.append('description', description || '');
      formData.append('report_type', reportType || '');
      formData.append('media_type', String(mediaType));

      if (mediaUri) {
        if (Platform.OS === 'web') {
          const fileRes = await fetch(mediaUri);
          const blob = await fileRes.blob();
          formData.append('media', blob, mediaName);
        } else {
          formData.append('media', {
            uri: mediaUri,
            type: mediaMime || 'application/octet-stream',
            name: mediaName,
          });
        }
      }

      // Keep edit uploads consistent with create: send every additional image,
      // not only the first cover image.
      for (let i = 0; i < (extraImages || []).length; i += 1) {
        const uri = extraImages[i];
        if (!uri) continue;
        if (Platform.OS === 'web') {
          const blob = await fetch(uri).then((response) => response.blob());
          formData.append('images[]', blob, `image_${i + 1}.jpg`);
        } else {
          formData.append('images[]', { uri, type: 'image/jpeg', name: `image_${i + 1}.jpg` });
        }
      }

      const res = await fetch(`${BASE_URL}/news/${newsId}`, {
        method: 'POST', // _method override PUT ke liye
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();

      if (res.status === 200 || res.status === 201) {
        return { ok: true, data: json, news: json?.news || json?.data || json };
      }
      if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (res.status === 404) return { ok: false, message: 'News not found.' };
      if (res.status === 422) {
        const errors = json?.errors || {};
        const firstError = Object.values(errors).flat()[0] || json?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: json?.message || `Server error (${res.status}).` };
    } catch (err) {
      console.error('[AuthAPI.updateNews] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Update News Status
   * POST /news/{id}/status  (ya PUT, backend route confirm kar lena)
   * Body (form-data): status
   * Headers: Authorization: Bearer {token}
   */
  updateNewsStatus: async (newsId, status) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status: resStatus, data } = await postFormData(`/news/${newsId}/status`, {
        status: status,
      }, token);

      if (resStatus === 200 || resStatus === 201) {
        return { ok: true, message: data?.message || 'Status updated successfully!', data };
      }
      if (resStatus === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (resStatus === 404) return { ok: false, message: 'News not found.' };
      if (resStatus === 422) {
        const errors = data?.errors || {};
        const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
        return { ok: false, message: firstError, errors };
      }
      return { ok: false, message: data?.message || `Server error (${resStatus}).` };
    } catch (err) {
      console.error('[AuthAPI.updateNewsStatus] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Delete News (Destroy)
   * DELETE /news/{id}
   * Headers: Authorization: Bearer {token}
   */
  deleteNews: async (newsId) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const response = await fetch(`${BASE_URL}/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        return { ok: true, message: json?.message || 'News deleted successfully!', data: json };
      }
      if (response.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      if (response.status === 404) return { ok: false, message: 'News not found.' };
      return { ok: false, message: json?.message || `Server error (${response.status}).` };
    } catch (err) {
      console.error('[AuthAPI.deleteNews] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },

  /**
   * Get news counts (likes, comments, shares, views)
   * POST /counts
   * Body (form-data): news_id
   * Headers: Authorization: Bearer {token}
   */
  getNewsCounts: async ({ newsId }) => {
    try {
      const token = await getAuthToken();
      if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

      const { status, data } = await postFormData('/counts', {
        news_id: String(newsId),
      }, token);

      if (status === 200 || status === 201) {
        return { ok: true, counts: data?.counts || data?.data || data };
      }
      if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
      return { ok: false, message: data?.message || `Server error (${status}).` };
    } catch (err) {
      console.error('[AuthAPI.getNewsCounts] Error:', err);
      return { ok: false, isNetwork: true, message: 'Network error.' };
    }
  },


 getAdsDetails: async () => {
  try {
    // Some deployments expose this route publicly while others protect it.
    // Sending a token when one exists works in both cases and prevents a
    // valid signed-in advertiser from receiving an empty ads response.
    const token = await getAuthToken();
    const { status, data } = await getJSON('/ads-details', token, 45000);
    // ✅ FIX: backend ka actual wrapper key "ads_details" hai (pehle "data"/"ads"
    // dhoondh raha tha jo kabhi match hi nahi hota tha — isi wajah se Home screen
    // pe ads kabhi dikhte hi nahi the, hamesha khaali array milta tha)
    if (status === 200 || status === 201) {
      const ads = data?.ads_details
        || data?.data?.ads_details
        || data?.data?.ads
        || data?.data
        || data?.ads
        || data;
      return { ok: true, ads: Array.isArray(ads) ? ads : [] };
    }
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getAdsDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getAdsDetailsById: async (id) => {
  try {
    const { status, data } = await getJSON(`/ads-details/${id}`);
    if (status === 200 || status === 201) return { ok: true, ad: data?.data || data?.ad || data };
    if (status === 404) return { ok: false, message: 'Ad not found.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getAdsDetailsById] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},


createAdsDetails: async ({
  title, description, image, url, adsSubId = 1, redirection = '',
 redirectionUrl = '', startDate = '', endDate = '', status = 1, images = [], video = '',
}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

    const redirectionIds = {
      profile: 1,
      'my rti profile': 1,
      website: 2,
      'my website': 2,
      shop: 3,
      'my shop': 3,
      lead_form: 4,      // ✅ FIX: app screens/AdvertiseScreen.js hamesha 'lead_form' (underscore)
      'lead form': 4,    //    bhejta hai — pehle sirf space-wale keys the isliye ye kabhi match
      'lead forms': 4,   //    nahi hota tha aur redirectionId hamesha default 1 (profile) ban jaata tha
      whatsapp: 5,
      'my whatsapp number': 5,
    };
    // ✅ FIX: 'lead_form' jaisa underscore-wala id normalize karke bhi match karo,
    // taaki key naming kahin bhi thodi alag ho to bhi sahi id mile
    const normalizedRedirection = String(redirection).trim().toLowerCase().replace(/_/g, ' ');
    const redirectionId = Number(redirection)
      || redirectionIds[String(redirection).trim().toLowerCase()]
      || redirectionIds[normalizedRedirection]
      || 1;

    // ✅ FIX: image ab generic postFormData() se plain STRING ki tarah nahi bheji jaati
    // (jo blob:/file: URI ko sirf text bana deta tha — isliye backend pe image kabhi
    // khulti hi nahi thi, chahe preview me dikh bhi rahi ho). Ab yaha khud FormData
    // banake asli image Blob/file bheja ja raha hai — bilkul wahi pattern jo
    // uploadProfileImage() aur ecom images upload me already sahi se use ho raha hai.
    const formData = new FormData();
    formData.append('title', title || '');
    formData.append('description', description || '');
    formData.append('url', url || '');
    formData.append('ads_sub_id', String(Number(adsSubId) || 1));
    formData.append('redirection', String(redirectionId));
    formData.append('redirection_url', redirectionUrl || url || 'rti-news://advertisement');
    formData.append('start_date', startDate || new Date().toISOString().slice(0, 10));
    formData.append('end_date', endDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10));
    formData.append('status', String(status));

    if (image) {
      if (Platform.OS === 'web') {
        let imageBlob = image instanceof Blob ? image : null;
        // blob: URL kabhi-kabhi revoke ho jaata hai — IndexedDB me store kiya
        // hua media hoga to wahan se uthao, warna seedha fetch() se blob banao
        if (!imageBlob && isIdbMediaUri(image)) imageBlob = await getIdbMediaBlob(image);
        if (!imageBlob) {
          try { imageBlob = await fetch(image).then((response) => response.blob()); } catch { /* niche validation handle karega */ }
        }
        if (imageBlob) formData.append('image', imageBlob, 'ad-image.jpg');
      } else {
        // Native (Android/iOS): local file uri seedha bhej do
        const meta = guessFileMeta(image, 'image', 0);
        formData.append('image', { uri: image, type: meta.type, name: meta.name });
      }
    }
    for (let i = 0; i < (images || []).length; i += 1) {
      const uri = images[i];
      if (!uri || uri === image) continue;
      if (Platform.OS === 'web') {
        let blob = null;
        try { blob = await fetch(uri).then((r) => r.blob()); } catch (e) {}
        if (blob) formData.append('images[]', blob, `ad-image-${i + 1}.jpg`);
      } else {
        const meta = guessFileMeta(uri, 'image', i + 1);
        formData.append('images[]', { uri, type: meta.type, name: meta.name });
      }
    }

    if (video) {
      if (Platform.OS === 'web') {
        let videoBlob = video instanceof Blob ? video : null;
        if (!videoBlob && isIdbMediaUri(video)) videoBlob = await getIdbMediaBlob(video);
        if (!videoBlob) {
          try { videoBlob = await fetch(video).then((r) => r.blob()); } catch (e) {}
        }
        // ✅ FIX: pehle video read fail hone par chupchap drop ho jaata tha — ab saaf error milega
        if (!videoBlob) return { ok: false, message: 'Video read nahi ho paaya. Please video dobara select karein.' };
        const vExt = (videoBlob.type.split('/')[1] || 'mp4').replace('quicktime', 'mov').split(';')[0];
        formData.append('video', videoBlob, `ad-video.${vExt}`);
      } else {
        const meta = guessFileMeta(video, 'video', 0);
        formData.append('video', { uri: video, type: meta.type, name: meta.name });
      }
    }
      // ✅ FIX: images/video upload me 30s default timeout kam padta tha (Android pe
    // "Network error" yahi se aata tha). Ab upload ke liye lamba timeout.
    const uploadTimeoutMs = video ? 300000 : 120000;
    const { status: resStatus, data } = await fetchWithDebug('/ads-details', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        // Content-Type jaan-bujhke set nahi kiya — browser/RN khud multipart boundary set karega
      },
      body: formData,
    }, formData, uploadTimeoutMs);
    if (resStatus === 200 || resStatus === 201) return { ok: true, ad: data?.data || data?.ad || data };
    if (resStatus === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (resStatus === 422) {
      const errors = data?.errors || {};
      const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: data?.message || `Server error (${resStatus}).` };
  } catch (err) {
    console.error('[AuthAPI.createAdsDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

updateAdsDetails: async (id, fields = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

    // ✅ FIX: agar image update ho rahi hai aur wo ek naya local uri hai (blob:/file:),
    // to usko bhi createAdsDetails ki tarah asli Blob/file banake bhejo — text string
    // ki tarah nahi, warna edit karne pe bhi image backend pe kabhi save/khulti nahi thi.
    const { image, ...restFields } = fields;
    const isLocalImageUri = typeof image === 'string' && /^(blob:|file:|content:|idb-media:|data:)/i.test(image);

    let status, data;
    if (isLocalImageUri || image instanceof Blob) {
      const formData = new FormData();
      Object.entries({ ...restFields, _method: 'PUT' }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, String(value));
      });
      if (Platform.OS === 'web') {
        let imageBlob = image instanceof Blob ? image : null;
        if (!imageBlob && isIdbMediaUri(image)) imageBlob = await getIdbMediaBlob(image);
        if (!imageBlob) {
          try { imageBlob = await fetch(image).then((response) => response.blob()); } catch { /* niche validation handle karega */ }
        }
        if (imageBlob) formData.append('image', imageBlob, 'ad-image.jpg');
      } else {
        formData.append('image', { uri: image, type: 'image/jpeg', name: 'ad-image.jpg' });
      }
      const res = await fetchWithDebug(`/ads-details/${id}`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: formData,
      }, formData);
      status = res.status; data = res.data;
    } else {
      // Image change nahi hui (ya already ek hosted URL hai) — purane simple text flow se bhejo
      const res = await postFormData(`/ads-details/${id}`, { ...fields, _method: 'PUT' }, token);
      status = res.status; data = res.data;
    }
    if (status === 200 || status === 201) return { ok: true, ad: data?.data || data?.ad || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (status === 404) return { ok: false, message: 'Ad not found.' };
    if (status === 422) {
      const errors = data?.errors || {};
      const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.updateAdsDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

deleteAdsDetails: async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const response = await fetch(`${BASE_URL}/ads-details/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const json = await response.json().catch(() => null);
    if (response.status === 200 || response.status === 201 || response.status === 204) {
      return { ok: true, message: json?.message || 'Ad deleted.' };
    }
    if (response.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (response.status === 404) return { ok: false, message: 'Ad not found.' };
    return { ok: false, message: json?.message || `Server error (${response.status}).` };
  } catch (err) {
    console.error('[AuthAPI.deleteAdsDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

// ── ADS VIEWS API ───────────────────────────────────────────
recordAdView: async (adsId) => {
  try {
    const token = await getAuthToken(); // optional — agar route auth nahi maangta to bhi chalega
    const { status, data } = await postFormData('/ads-views', { ads_id: String(adsId) }, token);
    if (status === 200 || status === 201) return { ok: true, data };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.recordAdView] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getAdViews: async (adsId) => {
  try {
    const { status, data } = await getJSON(`/ads-views/${adsId}`);
    if (status === 200 || status === 201) return { ok: true, views: data?.data || data?.views || data };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getAdViews] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

// ✅ NEW: /ads-views index route (image me diya hua GET /ads-views, public)
getAdViewsList: async () => {
  try {
    // This request belongs to My Ads. Include a token when available so an
    // auth-protected backend does not return 401; public ad rendering never
    // needs to call this endpoint.
    const token = await getAuthToken();
    const { status, data } = await getJSON('/ads-views', token);
    if (status === 200 || status === 201) {
      const rawList = Array.isArray(data) ? data : (data?.data || data?.ads_views || data?.views || []);
      return { ok: true, views: rawList };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getAdViewsList] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

// ── ECOM ENQUIRIES API ──────────────────────────────────────
getEcomEnquiries: async () => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await getJSON('/ecom-enquiries', token);
   if (status === 200 || status === 201) return { ok: true, enquiries: data?.ecom_enquiries || data?.data || data?.enquiries || [] };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getEcomEnquiries] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getReceivedEcomEnquiries: async ({ cursor = null, ecomId = null, status = null, perPage = 20 } = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const q = [`per_page=${perPage}`];
    if (cursor) q.push(`cursor=${encodeURIComponent(cursor)}`);
    if (ecomId) q.push(`ecom_id=${encodeURIComponent(ecomId)}`);
    if (status) q.push(`status=${encodeURIComponent(status)}`);
    const { status: code, data } = await getJSON(`/ecom-enquiries/received?${q.join('&')}`, token);
    if (code === 200 || code === 201) {
      return {
        ok: true,
        enquiries: Array.isArray(data?.ecom_enquiries) ? data.ecom_enquiries : [],
        hasMore: Boolean(data?.has_more),
        nextCursor: data?.next_cursor || null,
      };
    }
    if (code === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${code}).` };
  } catch (err) {
    console.error('[AuthAPI.getReceivedEcomEnquiries] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getEcomEnquiryById: async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await getJSON(`/ecom-enquiries/${id}`, token);
    if (status === 200 || status === 201) return { ok: true, enquiry: data?.data || data?.enquiry || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (status === 404) return { ok: false, message: 'Enquiry not found.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getEcomEnquiryById] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

createEcomEnquiry: async (fields = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postFormData('/ecom-enquiries', fields, token);
    if (status === 200 || status === 201) return { ok: true, enquiry: data?.data || data?.enquiry || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (status === 422) {
      const errors = data?.errors || {};
      const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.createEcomEnquiry] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

updateEcomEnquiry: async (id, fields = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postFormData(`/ecom-enquiries/${id}`, { ...fields, _method: 'PUT' }, token);
    if (status === 200 || status === 201) return { ok: true, enquiry: data?.data || data?.enquiry || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (status === 404) return { ok: false, message: 'Enquiry not found.' };
    if (status === 422) {
      const errors = data?.errors || {};
      const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.updateEcomEnquiry] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},


deleteEcomEnquiry: async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const response = await fetch(`${BASE_URL}/ecom-enquiries/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const json = await response.json().catch(() => null);
    if (response.status === 200 || response.status === 201 || response.status === 204) {
      return { ok: true, message: json?.message || 'Enquiry deleted.' };
    }
    if (response.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (response.status === 404) return { ok: false, message: 'Enquiry not found.' };
    return { ok: false, message: json?.message || `Server error (${response.status}).` };
  } catch (err) {
    console.error('[AuthAPI.deleteEcomEnquiry] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

// ─────────────────────────────────────────────────────────
// ECOM SUBSCRIPTIONS API (Sell screen ke monthly plans)
// GET /ecom-subscriptions
// Headers: Authorization: Bearer {token}
// ─────────────────────────────────────────────────────────
getEcomSubscriptions: async () => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

    const { status, data } = await getJSON('/ecom-subscriptions', token);

    if (status === 200 || status === 201) {
      // ⚠️ ASSUMPTION: exact wrapper key backend se confirm nahi hai —
      // common patterns (ecom_subscriptions / data / plans) try kiye hain.
      console.log('[AuthAPI.getEcomSubscriptions] raw ->', status, JSON.stringify(data)?.slice(0, 600));
      const rawList = Array.isArray(data)
        ? data
        : (data?.ecom_subscriptions || data?.ecom_subscription_plans || data?.subscriptions || data?.data || data?.plans || []);
      return { ok: true, plans: rawList };
    }

    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getEcomSubscriptions] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error. Please check your internet connection.' };
  }
},

// ─────────────────────────────────────────────────────────
// ECOM DETAILS API (product add/update/delete/view/status)
// GET /ecom-details is PUBLIC, baaki sab auth token se
// ─────────────────────────────────────────────────────────
getEcomDetails: async () => {
  try {
    // Optional token: logged-in user ke liye backend mutual-block filter lagata hai, guest ke liye public rehta hai
    const token = await getAuthToken();
    const { status, data } = await getJSON('/ecom-details', token);
    if (status === 200 || status === 201) {
      const rawList = Array.isArray(data) ? data : (data?.data || data?.ecom_details || data?.details || []);
      return { ok: true, details: rawList };
    }
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getEcomDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getEcomDetailsById: async (id) => {
  try {
    const { status, data } = await getJSON(`/ecom-details/${id}`);
    if (status === 200 || status === 201) return { ok: true, detail: data?.data || data?.detail || data };
    if (status === 404) return { ok: false, message: 'Product not found.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getEcomDetailsById] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

createEcomDetails: async ({
  ecomSubId, category, productName, quantity, price, description, city, contact,
  startDate = '', endDate = '', images = [],
}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

    const formData = new FormData();
    formData.append('ecom_sub_id', String(ecomSubId ?? ''));
    formData.append('category', category || '');
    formData.append('product_name', productName || '');
    formData.append('quantity', String(quantity ?? ''));
    formData.append('price', String(price ?? ''));
    formData.append('description', description || '');
    formData.append('city', city || '');
    // ⚠️ backend field name "conatct" (typo) hai, curl example ke hisaab se waisa hi bhejna hai
    formData.append('conatct', contact || '');
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);

    for (let idx = 0; idx < (images || []).length; idx += 1) {
      const img = images[idx];
      if (!img) continue;
      if (Platform.OS === 'web') {
        let imageBlob = img instanceof Blob ? img : null;
        const imageUri = typeof img === 'string' ? img : (img.previewUri || img.uri || '');
        if (!imageBlob && isIdbMediaUri(imageUri)) imageBlob = await getIdbMediaBlob(imageUri);
        if (!imageBlob && imageUri) {
          try { imageBlob = await fetch(imageUri).then((response) => response.blob()); } catch { /* validation below handles it */ }
        }
        if (imageBlob) formData.append('images[]', imageBlob, img.name || `image_${idx}.jpg`);
      } else {
        formData.append('images[]', {
          uri: img.uri || img,
          type: img.type || 'image/jpeg',
          name: img.name || `image_${idx}.jpg`,
        });
      }
    }

   const res = await fetch(`${BASE_URL}/ecom-details`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json().catch(() => null);
    if (res.status === 200 || res.status === 201) return { ok: true, detail: json?.data || json?.detail || json };
    // ✅ FIX: backend "Token has expired." bhi 401 ke sath dega, isko clearly session-expired maano
    if (res.status === 401) return { ok: false, isAuth: true, message: json?.message || 'Session expired. Please login again.' };
    if (res.status === 422) {
      const errors = json?.errors || {};
      const firstError = Object.values(errors).flat()[0] || json?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: json?.message || `Server error (${res.status}).` };
  } catch (err) {
    console.error('[AuthAPI.createEcomDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

updateEcomDetails: async (id, fields = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };

    // ✅ curl example seedha PUT + form-data bhej raha hai, isliye direct fetch se PUT
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });

    const res = await fetch(`${BASE_URL}/ecom-details/${id}`, {
      method: 'PUT',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: formData,
    });
const json = await res.json().catch(() => null);
    if (res.status === 200 || res.status === 201) return { ok: true, detail: json?.data || json?.detail || json };
    if (res.status === 401) return { ok: false, isAuth: true, message: json?.message || 'Session expired. Please login again.' };
    if (res.status === 404) return { ok: false, message: 'Product not found.' };
    if (res.status === 422) {
      const errors = json?.errors || {};
      const firstError = Object.values(errors).flat()[0] || json?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: json?.message || `Server error (${res.status}).` };
  } catch (err) {
    console.error('[AuthAPI.updateEcomDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

updateEcomDetailsStatus: async (id, statusValue) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const res = await fetch(`${BASE_URL}/ecom-details/${id}/status`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: statusValue }),
    });
    const json = await res.json().catch(() => null);
    if (res.status === 200 || res.status === 201) return { ok: true, detail: json?.data || json?.detail || json };
    if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (res.status === 404) return { ok: false, message: 'Product not found.' };
    return { ok: false, message: json?.message || `Server error (${res.status}).` };
  } catch (err) {
    console.error('[AuthAPI.updateEcomDetailsStatus] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

deleteEcomDetails: async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const response = await fetch(`${BASE_URL}/ecom-details/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const json = await response.json().catch(() => null);
    if (response.status === 200 || response.status === 201 || response.status === 204) {
      return { ok: true, message: json?.message || 'Product deleted.' };
    }
    if (response.status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (response.status === 404) return { ok: false, message: 'Product not found.' };
    return { ok: false, message: json?.message || `Server error (${response.status}).` };
  } catch (err) {
    console.error('[AuthAPI.deleteEcomDetails] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getMyNews: async ({ type } = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const typeQs = type === 1 || type === 2 ? `?type=${type}` : '';
    const { status, data } = await getJSON(`/my-news${typeQs}`, token);
    if (status === 200 || status === 201) return { ok: true, news: data?.data || data?.news || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch {
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getMyNewsById: async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await getJSON(`/my-news/${id}`, token);
    if (status === 200 || status === 201) return { ok: true, news: data?.data || data?.news || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    if (status === 404) return { ok: false, message: 'News not found.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getMyNewsById] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }

  },
// ── YOUTUBE LIVE STREAMING API ──────────────────────────────
getYoutubeAuthUrl: async () => {
  const token = await getAuthToken();
  if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
  try {
    const { status, data } = await getJSON(`/youtube/auth?token=${token}`, token);
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    const authUrl = data?.authorization_url || data?.data?.authorization_url || data?.url;
    if ((status === 200 || status === 201) && authUrl) {
      return { ok: true, url: authUrl };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getYoutubeAuthUrl] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},
getYoutubeLiveList: async () => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await getJSON('/youtube/live/list', token);
    if (status === 200 || status === 201) {
      const liveData = data?.data;
      return {
        ok: true,
        items: Array.isArray(liveData) ? liveData : (liveData?.watch_url ? [liveData] : []),
      };
    }
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getYoutubeLiveList] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},
createYoutubeLive: async (streamTitle, privacyStatus = 'unlisted', scheduledStartTime) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postJSON('/youtube/live/create', {
      title: streamTitle,                 // 'stream_title' nahi, backend 'title' maangta hai
      privacyStatus,
      scheduledStartTime,                 // ISO string
      // The backend must pass this to YouTube's liveBroadcast.contentDetails
      // so the returned watch URL can play inside the app's WebView.
      enableEmbed: true,
    }, token);
    if (status === 200 || status === 201) return { ok: true, data: data?.data || data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.createYoutubeLive] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

startYoutubeBroadcast: async (broadcastId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { ok: false, isAuth: true, message: "Not logged in." };
    }

    const { status, data } = await postJSON(
      "/youtube/live/start",
      { broadcast_id: broadcastId },
      token
    );

    if (status === 200 || status === 201) {
      return { ok: true, data };
    }

    return {
      ok: false,
      status,
      message: data?.message || data?.error?.message || `Server error (${status}).`,
    };
  } catch (err) {
    console.error(err);

    return {
      ok: false,
      isNetwork: true,
      message: "Network error.",
    };
  }
},

endYoutubeBroadcast: async (broadcastId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postJSON('/youtube/live/end', { broadcast_id: broadcastId }, token);
    if (status === 200 || status === 201) return { ok: true, data };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.endYoutubeBroadcast] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

// ── FOLLOW / BLOCK API ──────────────────────────────────────
followUserApi: async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
     const { status, data } = await postJSON('/users/follow', { user_id: userId }, token);
    if (status === 200 || status === 201) return { ok: true, data };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.followUserApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

unfollowUserApi: async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
       const { status, data } = await postJSON('/users/unfollow', { user_id: userId }, token);
    if (status === 200 || status === 201) return { ok: true, data };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.unfollowUserApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getFollowersApi: async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const endpoint = userId ? `/users/followers?user_id=${userId}` : '/users/followers';
    const { status, data } = await getJSON(endpoint, token);
    if (status === 200 || status === 201) {
      // Backend kabhi { followers: [...] }, kabhi { data: [...] }, kabhi seedha [...] bhejta hai — teeno handle karo
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.followers) ? data.followers
        : Array.isArray(data?.data) ? data.data
        : [];
      return { ok: true, list };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getFollowersApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getFollowingApi: async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const endpoint = userId ? `/users/following?user_id=${userId}` : '/users/following';
    const { status, data } = await getJSON(endpoint, token);
    if (status === 200 || status === 201) {
      // Backend kabhi { following: [...] }, kabhi { data: [...] }, kabhi seedha [...] bhejta hai — teeno handle karo
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.following) ? data.following
        : Array.isArray(data?.data) ? data.data
        : [];
      return { ok: true, list };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getFollowingApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

blockUserApi: async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postJSON('/users/block', { user_id: userId }, token);
    if (status === 200 || status === 201) return { ok: true, data };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.blockUserApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

unblockUserApi: async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postJSON('/users/unblock', { user_id: userId }, token);
    if (status === 200 || status === 201) return { ok: true, data };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.unblockUserApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},
getBlockedUsersApi: async () => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
      const { status, data } = await getJSON('/users/blocked', token);
    if (status === 200 || status === 201) return { ok: true, list: data?.blocked_users || data?.data || data || [] };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getBlockedUsersApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

// ─────────────────────────────────────────────────────────
// WALLET API
// ─────────────────────────────────────────────────────────
getWalletApi: async () => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await getJSON('/wallet', token);
    if (status === 200) return { ok: true, wallet: data?.wallet || null };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getWalletApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getWalletCommissionsApi: async ({ status: statusFilter, level, page = 1, perPage = 20 } = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const params = new URLSearchParams();
    (Array.isArray(statusFilter) ? statusFilter : statusFilter ? [statusFilter] : []).forEach((s) => params.append('status[]', s));
    if (level) params.append('level', level);
    params.append('page', page);
    params.append('per_page', perPage);
    const { status, data } = await getJSON(`/wallet/commissions?${params.toString()}`, token);
    if (status === 200) return { ok: true, commissions: data?.data || data?.commissions || [], meta: data?.meta || null };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getWalletCommissionsApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getWalletTransactionsApi: async ({ type, page = 1, perPage = 20 } = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const params = new URLSearchParams();
    (Array.isArray(type) ? type : type ? [type] : []).forEach((t) => params.append('type[]', t));
    params.append('page', page);
    params.append('per_page', perPage);
    const { status, data } = await getJSON(`/wallet/transactions?${params.toString()}`, token);
    if (status === 200) return { ok: true, transactions: data?.data || data?.transactions || [], meta: data?.meta || null };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getWalletTransactionsApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

getWalletWithdrawalsApi: async ({ page = 1, perPage = 20 } = {}) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await getJSON(`/wallet/withdrawals?page=${page}&per_page=${perPage}`, token);
    if (status === 200) return { ok: true, requests: data?.data || data?.withdrawals || [], meta: data?.meta || null };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.getWalletWithdrawalsApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

createWithdrawalApi: async (payload) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const { status, data } = await postJSON('/wallet/withdrawals', payload, token);
    if (status === 201 || status === 200) return { ok: true, withdrawal: data?.withdrawal || null, wallet: data?.wallet || null };
    if (status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    if (status === 422) {
      const errors = data?.errors || {};
      const firstError = Object.values(errors).flat()[0] || data?.message || 'Validation failed.';
      return { ok: false, message: firstError, errors };
    }
    return { ok: false, message: data?.message || `Server error (${status}).` };
  } catch (err) {
    console.error('[AuthAPI.createWithdrawalApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},

cancelWithdrawalApi: async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { ok: false, isAuth: true, message: 'Not logged in.' };
    const res = await fetch(`${BASE_URL}/wallet/withdrawals/${id}/cancel`, {
      method: 'PATCH',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => null);
    if (res.status === 200 || res.status === 201) return { ok: true, wallet: json?.wallet || null };
    if (res.status === 401) return { ok: false, isAuth: true, message: 'Session expired. Please login again.' };
    return { ok: false, message: json?.message || `Server error (${res.status}).` };
  } catch (err) {
    console.error('[AuthAPI.cancelWithdrawalApi] Error:', err);
    return { ok: false, isNetwork: true, message: 'Network error.' };
  }
},
};

export { postFormData, postJSON, getJSON };