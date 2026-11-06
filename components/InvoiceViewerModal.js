// components/InvoiceViewerModal.js
// Invoice / receipt ko download kiye bina app ke andar dekhne ke liye popup viewer (web + Android + iOS).
//   - Native : react-native-webview me HTML (same HTML jo PDF banata hai => jo dikhta hai wahi download hota hai)
//   - Web    : iframe srcDoc
// Header me Close + Download; neeche bhi Download button.
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// WebView sirf native par (web par react-native-webview kaam nahi karta)
const NativeWebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

export default function InvoiceViewerModal({ visible, html, title = 'Invoice', onClose, onDownload, downloading = false }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const source = useMemo(() => ({ html: html || '' }), [html]);

  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={[st.root, { paddingTop: Platform.OS === 'web' ? 0 : insets.top }]}>
        <View style={st.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Close">
            <Feather name="x" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={st.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onDownload} disabled={downloading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Download">
            {downloading ? <ActivityIndicator size="small" color="#dc2626" /> : <Feather name="download" size={22} color="#dc2626" />}
          </TouchableOpacity>
        </View>

        <View style={st.body}>
          {Platform.OS === 'web' ? (
            React.createElement('iframe', {
              title: 'Invoice',
              srcDoc: html || '',
              style: { width: '100%', height: '100%', border: 0, background: '#fff' },
            })
          ) : (
            <NativeWebView
              originWhitelist={['*']}
              source={source}
              style={{ flex: 1, backgroundColor: '#fff' }}
              onLoadEnd={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
              scalesPageToFit
              setSupportMultipleWindows={false}
            />
          )}
          {loading && Platform.OS !== 'web' ? <ActivityIndicator style={StyleSheet.absoluteFill} color="#dc2626" /> : null}
        </View>

        <View style={[st.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <TouchableOpacity style={[st.btn, downloading && { opacity: 0.6 }]} onPress={onDownload} disabled={downloading} activeOpacity={0.85}>
            <Feather name="download" size={16} color="#fff" />
            <Text style={st.btnText}>{downloading ? 'Preparing…' : 'Download PDF'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111827' },
  body: { flex: 1, backgroundColor: '#f3f4f6' },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});