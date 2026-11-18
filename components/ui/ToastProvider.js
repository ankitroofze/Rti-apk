// components/ui/ToastProvider.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import SystemBars from '../SystemBars'; // ✅ Android navigation bar ko brand red karta hai (neeche ki safed patti hatane ke liye)

const ToastContext = createContext({
  showToast: () => {}, showPopup: () => {}, hidePopup: () => {},
  showLoader: () => {}, hideLoader: () => {},
});

// ✅ Toast kabhi "error" jaisa nahi dikhega: na laal color, na "Oops!/Error" heading.
// App ke 200+ jagah se showToast(msg, 'error') aata hai (validation, permission, normal flow ke messages bhi) —
// un sab ko yahin ek jagah se neutral "Notice" bana diya, taaki kisi file me kuch badalna na pade.
const GENERIC_ERROR_TITLES = /^\s*(error|errors|oops!?|failed|failure|something went wrong)\s*$/i;
const normalizeToastType = (type) => (type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');
const cleanToastMessage = (message) => {
  const text = typeof message === 'string' ? message : (message?.message ? String(message.message) : String(message ?? ''));
  // "Error: xyz" / "Error - xyz" jaise prefix hata do, sirf kaam ki baat dikhao
  return text.replace(/^\s*(error|failed)\s*[:\-–]\s*/i, '').trim();
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [popup, setPopup] = useState(null);
  const timeoutRef = useRef(null);

  // ── Global loader ──
  const [loaderVisible, setLoaderVisible] = useState(false);
  const loaderCount = useRef(0);
  const loaderTimer = useRef(null);
  const failsafeTimer = useRef(null);

  const showLoader = useCallback(() => {
    loaderCount.current += 1;
    if (loaderCount.current === 1) {
      loaderTimer.current = setTimeout(() => setLoaderVisible(true), 250);
      failsafeTimer.current = setTimeout(() => {
        loaderCount.current = 0;
        setLoaderVisible(false);
      }, 30000);
    }
  }, []);

  const hideLoader = useCallback(() => {
    loaderCount.current = Math.max(0, loaderCount.current - 1);
    if (loaderCount.current === 0) {
      clearTimeout(loaderTimer.current);
      clearTimeout(failsafeTimer.current);
      setLoaderVisible(false);
    }
  }, []);

  // 3rd arg optional: { title } -> toast par generic "Error" ki jagah samajhne layak heading
  // (jaise "Wrong image format"). Title na do to purana behaviour (Success / Error / Notice).
  const showToast = useCallback((message, type = 'info', options = {}) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rawTitle = options?.title || '';
    setToast({
      message: cleanToastMessage(message),
      type: normalizeToastType(type),
      title: GENERIC_ERROR_TITLES.test(rawTitle) ? '' : rawTitle,
    });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, 2600);
  }, []);

  const hidePopup = useCallback(() => setPopup(null), []);

  const showPopup = useCallback((message, type = 'info', options = {}) => {
    const {
      title,
      buttons,
      primaryLabel,
      onPrimaryPress,
      secondaryLabel,
      onSecondaryPress,
      isDestructive,
    } = options || {};

    setPopup({
      message,
      type,
      title,
      buttons,
      primaryLabel,
      onPrimaryPress,
      secondaryLabel,
      onSecondaryPress,
      isDestructive,
    });
  }, []);

  // ✅ App me koi bhi Alert.alert(...) / window.alert(...) ab system alert nahi dikhata:
  // - Informational messages (0 or 1 button): Auto-dismissing floating TOAST dikhate hain (non-blocking).
  // - Confirmation alerts (2+ buttons / cancel + action): Custom POPUP dialog dikhate hain.
  useEffect(() => {
    const origNative = Alert.alert;
    const origWindow = typeof window !== 'undefined' ? window.alert : null;
    const origConfirm = typeof window !== 'undefined' ? window.confirm : null;

    Alert.alert = function patchedAlert(title, message, buttons, options) {
      const list = Array.isArray(buttons) ? buttons.filter(Boolean) : [];
      const t = String(title ?? '').trim();
      const m = message != null ? String(message).trim() : '';
      const body = cleanToastMessage(m || t);
      const popupTitle = m && !GENERIC_ERROR_TITLES.test(t) ? t : '';

      // Check if this is a confirmation alert: 2+ buttons OR explicit cancel choice
      const isConfirmation = list.length >= 2 || (list.length === 1 && list[0]?.style === 'cancel');

      if (!isConfirmation) {
        // ✅ USER REQUEST: "agar koi massage hai to oo toast"
        const full = `${t} ${m}`.toLowerCase();
        let toastType = 'info';
        if (/success|saved|done|copied|published|approved|created|updated/i.test(full)) {
          toastType = 'success';
        } else if (/error|failed|failure|invalid|wrong|cannot|unable|denied|required/i.test(full)) {
          toastType = 'error';
        }

        showToast(body, toastType, { title: popupTitle || undefined });

        // Agar single button me callback ho (e.g. navigation.goBack()), smoothly trigger karo
        if (list.length === 1 && typeof list[0]?.onPress === 'function') {
          setTimeout(() => {
            try { list[0].onPress(); } catch (err) { console.warn('[patchedAlert] onPress error:', err); }
          }, 250);
        }
        return undefined;
      }

      // ✅ USER REQUEST: "ya confirmation alert hai to oo mujhe pop me dikhna chiye"
      const primary = list.find((x) => x.style === 'destructive') || list.find((x) => x.style !== 'cancel') || list[list.length - 1];
      const secondary = list.find((x) => x !== primary) || null;
      const isDestructive = primary?.style === 'destructive' || /delete|remove|clear|reset|block/i.test(primary?.text || '');

      showPopup(body, 'info', {
        title: popupTitle || 'Confirm',
        buttons: list.length > 2 ? list : undefined,
        primaryLabel: primary?.text || 'OK',
        onPrimaryPress: primary?.onPress,
        secondaryLabel: secondary?.text || 'Cancel',
        onSecondaryPress: secondary?.onPress,
        isDestructive,
      });
      return undefined;
    };

    if (origWindow) {
      window.alert = (msg) => {
        showToast(cleanToastMessage(msg), 'info');
      };
    }

    if (typeof window !== 'undefined') {
      window.confirm = (msg) => {
        Alert.alert('Confirm', cleanToastMessage(msg), [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK' },
        ]);
        return false;
      };
    }

    return () => {
      Alert.alert = origNative;
      if (origWindow) window.alert = origWindow;
      if (origConfirm && typeof window !== 'undefined') window.confirm = origConfirm;
    };
  }, [showPopup, showToast]);

  const value = useMemo(
    () => ({ showToast, showPopup, hidePopup, showLoader, hideLoader }),
    [hidePopup, showPopup, showToast, showLoader, hideLoader]
  );

  const dismissPopup = useCallback(() => {
    const cancelAction = popup?.onSecondaryPress || popup?.onCancel;
    hidePopup();
    try { cancelAction?.(); } catch (_) {}
  }, [hidePopup, popup]);

  return (
    <ToastContext.Provider value={value}>
      <SystemBars />
      {children}
      {popup ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={dismissPopup}
          statusBarTranslucent
        >
          <Pressable style={styles.popupBackdrop} onPress={dismissPopup} />
          <View
            style={[styles.popupContainer, Platform.OS === 'web' ? styles.pointerEventsBoxNone : null]}
            {...(Platform.OS === 'web' ? {} : { pointerEvents: 'box-none' })}
          >
            <View style={[styles.popupCard, styles[popup.type] || styles.info]}>
              <Text style={styles.popupTitle}>
                {popup.title || (popup.type === 'success' ? 'Success' : popup.type === 'error' ? 'Notice' : 'Confirm')}
              </Text>
              <Text style={styles.popupMessage}>{popup.message}</Text>

              {Array.isArray(popup.buttons) && popup.buttons.length > 0 ? (
                <View style={styles.popupActions}>
                  {popup.buttons.map((btn, idx) => {
                    const isCancel = btn.style === 'cancel' || /cancel|no/i.test(btn.text || '');
                    const isDest = btn.style === 'destructive' || /delete|remove|clear|reset|block/i.test(btn.text || '');
                    return (
                      <Pressable
                        key={btn.text || idx}
                        style={[
                          styles.popupBtn,
                          isCancel ? styles.popupBtnSecondary : isDest ? styles.popupBtnDestructive : styles.popupBtnPrimary,
                        ]}
                        onPress={() => {
                          hidePopup();
                          try { btn.onPress?.(); } catch (err) { console.warn(err); }
                        }}
                      >
                        <Text
                          style={[
                            isCancel ? styles.popupBtnSecondaryText : styles.popupBtnPrimaryText,
                          ]}
                        >
                          {btn.text || 'OK'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.popupActions}>
                  {popup.secondaryLabel ? (
                    <Pressable
                      style={[styles.popupBtn, styles.popupBtnSecondary]}
                      onPress={() => {
                        hidePopup();
                        try { popup.onSecondaryPress?.(); } catch (err) { console.warn(err); }
                      }}
                    >
                      <Text style={styles.popupBtnSecondaryText}>{popup.secondaryLabel}</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    style={[
                      styles.popupBtn,
                      popup.isDestructive ? styles.popupBtnDestructive : styles.popupBtnPrimary,
                    ]}
                    onPress={() => {
                      hidePopup();
                      try { popup.onPrimaryPress?.(); } catch (err) { console.warn(err); }
                    }}
                  >
                    <Text style={styles.popupBtnPrimaryText}>{popup.primaryLabel || 'OK'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
      {toast ? (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={[styles.overlay, toast.type === 'success' ? styles.overlayBottom : styles.overlayTop]} pointerEvents="none">
            <View style={[styles.toast, styles[toast.type] || styles.info]}>
              <Text style={styles.title}>
                {toast.title || (toast.type === 'success' ? 'Success' : 'Notice')}
              </Text>
              <Text style={styles.message}>{toast.message}</Text>
            </View>
          </View>
        </Modal>
      ) : null}
       {loaderVisible ? (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
          <View style={styles.loaderBackdrop}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.loaderText}>Please wait...</Text>
            </View>
          </View>
        </Modal>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// Jab tak `active` true hai, global loader dikhega
export function useBusy(active) {
  const { showLoader, hideLoader } = useContext(ToastContext);
  useEffect(() => {
    if (!active) return undefined;
    showLoader();
    return () => hideLoader();
  }, [active, showLoader, hideLoader]);
}

const styles = StyleSheet.create({
  loaderBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  loaderText: { marginTop: 10, fontSize: 13, color: '#334155', fontWeight: '600' },
  // Font Family for all text
  fontFamily: {
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },

  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayTop: {
    top: 18,
  },
  overlayBottom: {
    bottom: 110,
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  popupContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  pointerEventsBoxNone: {
    pointerEvents: 'none',
  },
  popupCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    elevation: 12,
    ...Platform.select({
      web: { boxShadow: '0px 14px 28px rgba(2, 6, 23, 0.28)', pointerEvents: 'auto' },
      ios: {
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.28,
        shadowRadius: 28,
      },
      default: {},
    }),
  },
  popupTitle: {
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  popupMessage: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  popupActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  popupBtn: {
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  popupBtnPrimary: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  popupBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  popupBtnSecondary: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  popupBtnSecondaryText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600', // ✅ Weight 600
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  popupBtnDestructive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  popupBtnDestructiveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto',
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 6, // ✅ Border radius 6px
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    boxShadow: '0px 10px 16px rgba(2, 6, 23, 0.16)',
    elevation: 8,
  },
  info: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  success: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  title: {
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  message: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '600', // ✅ Weight 600
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
});