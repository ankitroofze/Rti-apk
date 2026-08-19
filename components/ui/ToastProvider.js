// components/ui/ToastProvider.js
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const ToastContext = createContext({ showToast: () => {}, showPopup: () => {}, hidePopup: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [popup, setPopup] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ message, type });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, 2600);
  }, []);

  const hidePopup = useCallback(() => setPopup(null), []);

  const showPopup = useCallback((message, type = 'info', options = {}) => {
    const {
      title,
      primaryLabel,
      onPrimaryPress,
      secondaryLabel,
      onSecondaryPress,
    } = options || {};

    setPopup({
      message,
      type,
      title,
      primaryLabel,
      onPrimaryPress,
      secondaryLabel,
      onSecondaryPress,
    });
  }, []);

  const value = useMemo(() => ({ showToast, showPopup, hidePopup }), [hidePopup, showPopup, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {popup ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={hidePopup}
          statusBarTranslucent
        >
          <Pressable style={styles.popupBackdrop} onPress={hidePopup} />
          <View
            style={[styles.popupContainer, Platform.OS === 'web' ? styles.pointerEventsBoxNone : null]}
            {...(Platform.OS === 'web' ? {} : { pointerEvents: 'box-none' })}
          >
            <View style={[styles.popupCard, styles[popup.type] || styles.info]}>
              <Text style={styles.popupTitle}>
                {popup.title || (popup.type === 'success' ? 'Success' : popup.type === 'error' ? 'Error' : 'Notice')}
              </Text>
              <Text style={styles.popupMessage}>{popup.message}</Text>

              <View style={styles.popupActions}>
                {popup.secondaryLabel ? (
                  <Pressable
                    style={[styles.popupBtn, styles.popupBtnSecondary]}
                    onPress={() => {
                      hidePopup();
                      popup.onSecondaryPress?.();
                    }}
                  >
                    <Text style={styles.popupBtnSecondaryText}>{popup.secondaryLabel}</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={[styles.popupBtn, styles.popupBtnPrimary]}
                  onPress={() => {
                    hidePopup();
                    popup.onPrimaryPress?.();
                  }}
                >
                  <Text style={styles.popupBtnPrimaryText}>{popup.primaryLabel || 'OK'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {toast ? (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={[styles.overlay, toast.type === 'success' ? styles.overlayBottom : styles.overlayTop]} pointerEvents="none">
            <View style={[styles.toast, styles[toast.type] || styles.info]}>
              <Text style={styles.title}>
                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice'}
              </Text>
              <Text style={styles.message}>{toast.message}</Text>
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

const styles = StyleSheet.create({
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