import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useTemplateStore, useEditorStore } from '../store/newspaperStore';
import LayoutOne from '../components/newspaper/LayoutOne';
import LayoutTwo from '../components/newspaper/LayoutTwo';
import { printDirectly } from '../components/newspaper/PDFExporter';

export default function PreviewScreen({ navigation }) {
  const { templateId } = useTemplateStore();
  const { sections }   = useEditorStore();
  const IS_WEB = Platform.OS === 'web';

  const Layout = templateId === 'layout1' ? LayoutOne : LayoutTwo;

  const handlePrint = async () => {
    if (IS_WEB) {
      window.print();
    } else {
      await printDirectly(sections, templateId);
    }
  };

  // ── WEB ──────────────────────────────────────────────────────────────────────
  if (IS_WEB) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#e8e4df' }}>

        {/* Top bar */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
          position: 'sticky', top: 0, zIndex: 10,
        }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigation.goBack()}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 7,
                background: '#fef6ec', border: '1px solid #fbcfa0',
                fontSize: 11, fontWeight: 700, color: '#7a420a', cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>
              Preview — {templateId === 'layout1' ? 'June Layout' : 'March Layout'}
            </span>
          </div>
          <button
            onClick={handlePrint}
            style={{
              padding: '6px 16px', borderRadius: 7,
              background: '#16a34a', border: 'none',
              fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* Page */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,3vw,32px)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', boxShadow: '0 8px 48px rgba(0,0,0,0.2)' }}>
            <Layout sections={sections} activeSection={null} onSelectSection={null} />
          </div>
        </div>

      </div>
    );
  }

  // ── MOBILE ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={styles.root}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={14} color="#7a420a" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {templateId === 'layout1' ? 'June Layout' : 'March Layout'} — Preview
        </Text>

        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Feather name="printer" size={14} color="#fff" />
          <Text style={styles.printText}>Print</Text>
        </TouchableOpacity>
      </View>

      {/* Newspaper — horizontal scroll for small screens */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 640 }}>
            <Layout sections={sections} activeSection={null} onSelectSection={null} />
          </View>
        </ScrollView>
      </ScrollView>

    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e8e4df' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 7, backgroundColor: '#fef6ec',
    borderWidth: 1, borderColor: '#fbcfa0',
  },
  backText: { fontSize: 11, fontWeight: '700', color: '#7a420a' },

  title: { fontSize: 11, color: '#555', fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },

  printBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 7, backgroundColor: '#16a34a',
  },
  printText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 40 },
});