import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// KeyboardAwareScroll — har form ke liye ek hi solution (Android + iOS + Web).
//
// Problem: Android 15 / edge-to-edge build me `adjustResize` kaam nahi karta aur
// KeyboardAvoidingView(behavior="height") bharosemand nahi hota, isliye focused input
// keyboard ke NEECHE chhup jaata tha.
//
// Ye component:
//  1. Keyboard ki height + uska top (screenY) sunta hai
//  2. ScrollView ke neeche utni jagah (padding) jodta hai, taaki last input tak scroll ho sake
//  3. Jo TextInput focused hai, usse keyboard ke thoda upar scroll kar deta hai
//     (keyboard khulne par bhi aur keyboard khule rehte hue dusre input par jaane par bhi)
// Web par kuch nahi karta — browser khud focused input ko scroll kar deta hai.
//
// Use: <ScrollView ...>  ki jagah  <KeyboardAwareScroll ...>  (baaki saare props same)
// ─────────────────────────────────────────────────────────────────────────────

const GAP = Platform.OS === 'android' ? 44 : 28; // input ke neeche keyboard se kitni jagah chhodni hai

const KeyboardAwareScroll = forwardRef(function KeyboardAwareScroll(
  { children, contentContainerStyle, onScroll, extraGap = GAP, ...rest },
  ref
) {
  const scrollRef = useRef(null);
  const offsetY = useRef(0);
  const kbTop = useRef(null);
  const lastFocused = useRef(null);
  const [kbHeight, setKbHeight] = useState(0);

  useImperativeHandle(ref, () => scrollRef.current);

  const ensureVisible = useCallback(() => {
    if (Platform.OS === 'web') return;
    try {
      const input = TextInput.State?.currentlyFocusedInput?.();
      if (!input || kbTop.current == null) return;
      lastFocused.current = input;
      input.measureInWindow((_x, y, _w, h) => {
        if (!Number.isFinite(y) || !Number.isFinite(h)) return;
        const overlap = y + h + extraGap - kbTop.current;
        if (overlap > 0) {
          scrollRef.current?.scrollTo?.({ y: Math.max(0, offsetY.current + overlap), animated: true });
        } else if (y < 60) {
          // input upar (status bar / header ke neeche) chhup gaya ho
          scrollRef.current?.scrollTo?.({ y: Math.max(0, offsetY.current + y - 120), animated: true });
        }
      });
    } catch (_) { /* measure fail ho to chup-chaap ignore */ }
  }, [extraGap]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      const h = e?.endCoordinates?.height || 0;
      kbTop.current = e?.endCoordinates?.screenY ?? (Dimensions.get('window').height - h);
      setKbHeight(h);
      setTimeout(ensureVisible, 140); // padding apply hone ke baad scroll
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      kbTop.current = null;
      lastFocused.current = null;
      setKbHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [ensureVisible]);

  // Keyboard khula hai aur user dusre input par gaya -> dobara visible karo
  useEffect(() => {
    if (Platform.OS === 'web' || !kbHeight) return undefined;
    const id = setInterval(() => {
      try {
        const cur = TextInput.State?.currentlyFocusedInput?.();
        if (cur && cur !== lastFocused.current) ensureVisible();
      } catch (_) { /* ignore */ }
    }, 250);
    return () => clearInterval(id);
  }, [kbHeight, ensureVisible]);

  const flat = StyleSheet.flatten(contentContainerStyle) || {};
  const paddedStyle = kbHeight > 0
    ? [contentContainerStyle, { paddingBottom: (Number(flat.paddingBottom) || 0) + kbHeight }]
    : contentContainerStyle;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      scrollEventThrottle={32}
      {...rest}
      ref={scrollRef}
      onScroll={(e) => {
        offsetY.current = e?.nativeEvent?.contentOffset?.y || 0;
        if (onScroll) onScroll(e);
      }}
      contentContainerStyle={paddedStyle}
    >
      {children}
    </ScrollView>
  );
});

export default KeyboardAwareScroll;