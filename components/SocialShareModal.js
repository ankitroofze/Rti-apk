// components/SocialShareModal.js
// Modal that allows sharing a news post directly to social media (WhatsApp, Telegram, Twitter/X, Facebook, Copy Link)
// with the news title, description, and post URL.
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

async function copyToClipboard(text) {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  try {
    // eslint-disable-next-line global-require
    const expoClipboard = require('expo-clipboard');
    if (expoClipboard?.setStringAsync) {
      await expoClipboard.setStringAsync(text);
      return true;
    }
  } catch (_) {}
  try {
    // eslint-disable-next-line global-require
    const { Clipboard } = require('react-native');
    if (Clipboard?.setString) {
      Clipboard.setString(text);
      return true;
    }
  } catch (_) {}
  return false;
}

export function SocialShareModal({
  visible,
  onClose,
  title = '',
  description = '',
  url = '',
  onShareSuccess,
  mediaKind = '',        // 'video' | 'image' — parent ne diya ho to "media + link" button dikhta hai
  onShareMedia,          // async () => parent shareNewsPackage chalata hai (frame + music + link, share count bhi wahi badhata hai)
}) {
  const [copied, setCopied] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);

  if (!visible) return null;

  const cleanTitle = String(title || '').trim();
  const cleanDesc = String(description || '').trim();
  const cleanUrl = String(url || '').trim();

  const shareText = cleanTitle
    ? `${cleanTitle}${cleanDesc ? '\n\n' + cleanDesc : ''}\n\n${cleanUrl}`
    : cleanUrl;

  // Video / image (frame + music ke saath) + news link ek saath.
  // Modal pehle band hota hai, taaki "Preparing…" / "Share" popup saaf dikhe (web par popup modal ke peeche chhup jaata hai).
  const handleMediaShare = async () => {
    if (mediaBusy || !onShareMedia) return;
    setMediaBusy(true);
    try {
      onClose?.();
      await onShareMedia();
    } catch (err) {
      console.warn('[SocialShareModal] Media share error:', err);
    } finally {
      setMediaBusy(false);
    }
  };

  const handlePlatformPress = async (action) => {
    try {
      await action();
      onShareSuccess?.();
    } catch (err) {
      console.warn('[SocialShareModal] Share action error:', err);
    }
  };

  const openUrlSafe = (targetUrl) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      Linking.openURL(targetUrl).catch(() => {
        try {
          Share.share({ message: shareText, url: cleanUrl, title: cleanTitle });
        } catch (_) {}
      });
    }
  };

  const platforms = [
    {
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      action: () => {
        const waMsg = encodeURIComponent(shareText);
        const waUrl = `https://api.whatsapp.com/send?text=${waMsg}`;
        openUrlSafe(waUrl);
      },
    },
    {
      name: 'Telegram',
      icon: 'paper-plane',
      color: '#0088cc',
      action: () => {
        const tgMsg = encodeURIComponent(cleanTitle + (cleanDesc ? '\n\n' + cleanDesc : ''));
        const tgLink = encodeURIComponent(cleanUrl);
        const tgUrl = `https://t.me/share/url?url=${tgLink}&text=${tgMsg}`;
        openUrlSafe(tgUrl);
      },
    },
    {
      name: 'Twitter / X',
      icon: 'logo-twitter',
      color: '#1DA1F2',
      action: () => {
        const twText = encodeURIComponent(cleanTitle);
        const twLink = encodeURIComponent(cleanUrl);
        const twUrl = `https://twitter.com/intent/tweet?text=${twText}&url=${twLink}`;
        openUrlSafe(twUrl);
      },
    },
    {
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl)}`;
        openUrlSafe(fbUrl);
      },
    },
    {
      name: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? 'checkmark-circle' : 'link-outline',
      color: copied ? '#10b981' : '#475569',
      action: async () => {
        const success = await copyToClipboard(cleanUrl || shareText);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      },
    },
  ];

  const handleSystemShare = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: cleanTitle,
          text: cleanDesc || cleanTitle,
          url: cleanUrl,
        });
        onShareSuccess?.();
      } else {
        const res = await Share.share({
          title: cleanTitle,
          message: shareText,
          url: cleanUrl,
        });
        if (res.action === Share.sharedAction) {
          onShareSuccess?.();
        }
      }
    } catch (_) {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Share Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Preview Box */}
          <View style={styles.previewBox}>
            {cleanTitle ? (
              <Text style={styles.previewTitle} numberOfLines={2}>
                {cleanTitle}
              </Text>
            ) : null}
            {cleanDesc ? (
              <Text style={styles.previewDesc} numberOfLines={2}>
                {cleanDesc}
              </Text>
            ) : null}
            {cleanUrl ? (
              <Text style={styles.previewUrl} numberOfLines={1}>
                🔗 {cleanUrl}
              </Text>
            ) : null}
          </View>

          {/* Media + link: frame + music wali video / image aur news link ek saath */}
          {mediaKind && onShareMedia ? (
            <TouchableOpacity style={styles.mediaShareBtn} onPress={handleMediaShare} activeOpacity={0.85} disabled={mediaBusy}>
              {mediaBusy ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name={mediaKind === 'video' ? 'videocam' : 'image'} size={20} color="#ffffff" />
              )}
              <Text style={styles.mediaShareText}>
                {mediaKind === 'video' ? 'Share Video + Link (frame & music)' : 'Share Image + Link (frame)'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Social Platform Grid */}
          <View style={styles.grid}>
            {platforms.map((p) => (
              <TouchableOpacity
                key={p.name}
                style={styles.platformBtn}
                onPress={() => handlePlatformPress(p.action)}
                activeOpacity={0.75}
              >
                <View style={[styles.platformCircle, { backgroundColor: p.color }]}>
                  <Ionicons name={p.icon} size={24} color="#ffffff" />
                </View>
                <Text style={styles.platformName} numberOfLines={1}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* More options button */}
          {(Platform.OS !== 'web' || (typeof navigator !== 'undefined' && Boolean(navigator.share))) ? (
            <TouchableOpacity style={styles.moreOptionsBtn} onPress={handleSystemShare} activeOpacity={0.82}>
              <Ionicons name="share-outline" size={18} color="#e2e8f0" />
              <Text style={styles.moreOptionsText}>More Options…</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  closeIconBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  previewBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  previewDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  previewUrl: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  platformBtn: {
    alignItems: 'center',
    width: '19%',
    minWidth: 56,
    marginBottom: 6,
  },
  platformCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  platformName: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  mediaShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    marginBottom: 16,
  },
  mediaShareText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  moreOptionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  moreOptionsText: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SocialShareModal;