import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Bottom sheet / popup jab POST /api/news 403 + code "NEWS_LIMIT_REACHED" de.
 *
 * Props:
 *  - visible   : boolean
 *  - message   : backend ka `message` (response.message) — jaisa aaya waisa dikhao
 *  - onBuy     : "Buy Role Subscription" dabane par (role subscription plans screen kholo)
 *  - onCancel  : "Cancel" ya bahar tap / back press
 */
export default function NewsLimitModal({ visible, message, onBuy, onCancel }) {
  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Feather name="lock" size={24} color="#ea580c" />
          </View>
          <Text style={styles.title}>Free limit reached</Text>
          <Text style={styles.message}>
            {message || '2 free news used. Purchase a role subscription.'}
          </Text>

          <TouchableOpacity style={styles.buyBtn} onPress={onBuy} activeOpacity={0.85}>
            <Text style={styles.buyText}>Buy Role Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 18,
  },
  buyBtn: {
    width: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  buyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelText: { color: '#374151', fontSize: 15, fontWeight: '600' },
});