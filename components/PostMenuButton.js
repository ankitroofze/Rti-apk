import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const IS_WEB = Platform.OS === 'web';

// Touch device (phone browser) par hover nahi hota — wahan 3-dot hamesha dikhna chahiye.
const isHoverCapable = () => {
  if (!IS_WEB || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return false; }
};

/**
 * Post ke upar right-corner par 3-dot button + dropdown (Delete).
 *
 *  - Web (desktop): mouse tile/card ke upar aate hi 3-dot dikhta hai, click karne par dropdown khulta hai.
 *  - Web (mobile view) / Android / iOS: 3-dot hamesha dikhta hai.
 *      Android/iOS par click karne par bottom sheet (Delete / Cancel) khulti hai.
 *
 * Isse parent ke andar (position: 'relative') rakho — ye khud top-right par absolute lagta hai.
 *
 *  onDelete   : async () => { ok, message }   (confirm ke baad call hota hai)
 *  canDelete  : false ho to kuch render nahi hota (sirf owner ko dikhana hai)
 *  inline     : true ho to absolute nahi, normal flow me render hota hai (detail page header ke liye)
 *  dark       : true -> dark icon (white/light background par)
 *  label      : confirm text me item ka naam ('post' / 'reel' / 'ad' / 'product')
 */
export default function PostMenuButton({
  onDelete,
  canDelete = true,
  inline = false,
  dark = false,
  label = 'post',
  style,
  size = 28,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef(null);
  const hoverCapable = useRef(isHoverCapable()).current;

  // Web desktop: parent tile/card par mouse aate hi button dikhao (parent ke DOM node par listener).
  useEffect(() => {
    if (!IS_WEB || !hoverCapable || inline) return undefined;
    const node = rootRef.current;
    const parent = node && (node.parentElement || node.parentNode);
    if (!parent || typeof parent.addEventListener !== 'function') return undefined;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    parent.addEventListener('mouseenter', enter);
    parent.addEventListener('mouseleave', leave);
    return () => {
      parent.removeEventListener('mouseenter', enter);
      parent.removeEventListener('mouseleave', leave);
    };
  }, [hoverCapable, inline]);

  // Web: dropdown ke bahar click karte hi band
  useEffect(() => {
    if (!IS_WEB || !open || typeof document === 'undefined') return undefined;
    const close = (e) => {
      const node = rootRef.current;
      if (node && typeof node.contains === 'function' && node.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  const runDelete = useCallback(async () => {
    setOpen(false);
    setBusy(true);
    try {
      const result = await onDelete?.();
      if (result && result.ok === false) {
        const msg = result.message || 'Delete failed. Please try again.';
        if (IS_WEB && typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(msg);
        else Alert.alert('Delete failed', msg);
      }
    } catch (e) {
      const msg = 'Delete failed. Please try again.';
      if (IS_WEB && typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(msg);
      else Alert.alert('Delete failed', msg);
    } finally {
      setBusy(false);
    }
  }, [onDelete]);

  const askDelete = useCallback(() => {
    setOpen(false);
    const title = `Delete ${label}?`;
    const message = `Are you sure you want to delete this ${label}? This cannot be undone.`;
    if (IS_WEB) {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(message)
        : true;
      if (ok) runDelete();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: runDelete },
    ]);
  }, [label, runDelete]);

  if (!canDelete) return null;

  // Desktop web par jab tak hover na ho (aur dropdown band ho) button hide rahe
  const visible = !IS_WEB || !hoverCapable || inline || hovered || open || busy;
  const iconColor = dark ? '#0f172a' : '#ffffff';

  const btnStyle = [
    inline ? null : s.abs,
    { width: size, height: size, borderRadius: size / 2 },
    dark ? s.btnLight : s.btnDark,
    !visible && s.hidden,
    style,
  ];

  return (
    <View
      ref={rootRef}
      pointerEvents="box-none"
      style={inline ? s.inlineRoot : s.absRoot}
      collapsable={false}
    >
      <TouchableOpacity
        style={btnStyle}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
        disabled={busy}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        {busy
          ? <ActivityIndicator size="small" color={iconColor} />
          : <Feather name="more-vertical" size={Math.round(size * 0.62)} color={iconColor} />}
      </TouchableOpacity>

      {/* ── Web: chhota dropdown ── */}
      {IS_WEB && open ? (
        <View style={[s.dropdown, inline ? s.dropdownInline : s.dropdownAbs]}>
          <Pressable
            onPress={askDelete}
            style={({ hovered: h }) => [s.dropdownItem, h && s.dropdownItemHover]}
            accessibilityRole="menuitem"
          >
            <Feather name="trash-2" size={15} color="#dc2626" />
            <Text style={s.dropdownText}>Delete</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── Android / iOS: bottom sheet ── */}
      {!IS_WEB ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={s.sheetBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={s.sheet} onPress={() => {}}>
              <View style={s.sheetHandle} />
              <TouchableOpacity style={s.sheetItem} onPress={askDelete} activeOpacity={0.8}>
                <Feather name="trash-2" size={19} color="#dc2626" />
                <Text style={s.sheetDeleteText}>Delete {label}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetItem, s.sheetCancel]} onPress={() => setOpen(false)} activeOpacity={0.8}>
                <Text style={s.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  absRoot: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, zIndex: 20 },
  inlineRoot: { position: 'relative', alignItems: 'flex-end' },
  abs: { position: 'absolute', top: 5, right: 5 },
  btnDark: { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  btnLight: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },

  dropdown: {
    minWidth: 96,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 4,
    zIndex: 50,
    ...(IS_WEB ? { boxShadow: '0 6px 18px rgba(15,23,42,0.18)' } : null),
  },
  dropdownAbs: { position: 'absolute', top: 38, right: 5 },
  dropdownInline: { position: 'absolute', top: 36, right: 0 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  dropdownItemHover: { backgroundColor: '#fef2f2' },
  dropdownText: { fontSize: 13, fontWeight: '600', color: '#dc2626' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  sheetDeleteText: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  sheetCancel: { justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sheetCancelText: { fontSize: 15, fontWeight: '600', color: '#475569', textAlign: 'center', flex: 1 },
});