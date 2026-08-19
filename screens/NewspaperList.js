import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Platform, SafeAreaView, Image, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserStore } from '../store/UserStore';
import LayoutOne from '../components/newspaper/LayoutOne';
import LayoutTwo from '../components/newspaper/LayoutTwo';

const stripHtml = (html) =>
  String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// ── Full-screen Layout Viewer ─────────────────────────────────────────────────
function LayoutViewer({ layout, onClose }) {
  if (!layout) return null;
  const Layout = layout.templateId === 'layout2' ? LayoutTwo : LayoutOne;
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: '#1a1a1a',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#111',
          borderBottom: '2px solid #ea580c',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: '#fef6ec', border: '1px solid #fbcfa0',
                fontSize: 12, fontWeight: 700, color: '#7a420a', cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <span style={{ color: '#ffd700', fontSize: 15, fontWeight: 800 }}>
              📰 {layout.publishDate}
            </span>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8,
              background: '#16a34a', border: 'none',
              fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}
          >
            🖨️ Print / PDF
          </button>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            .nlv-header { display: none !important; }
            body { margin: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4 landscape; margin: 5mm; }
          }
        `}</style>

        {/* Layout area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', background: '#e8e4df', padding: 20 }}>
          <div style={{ maxWidth: 1050, margin: '0 auto', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
            <Layout
              sections={layout.sections}
              activeSection={null}
              onSelectSection={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  // Mobile
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 14, paddingVertical: 10,
          backgroundColor: '#111', borderBottomWidth: 2, borderBottomColor: '#ea580c',
        }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
              backgroundColor: '#fef6ec', borderWidth: 1, borderColor: '#fbcfa0',
            }}
          >
            <Feather name="arrow-left" size={14} color="#7a420a" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#7a420a' }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#ffd700', fontSize: 14, fontWeight: '800' }}>
            📰 {layout.publishDate}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: '#e8e4df' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 700, padding: 12 }}>
              <Layout
                sections={layout.sections}
                activeSection={null}
                onSelectSection={() => {}}
              />
            </View>
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NewspaperList({ navigation }) {
  const [grouped, setGrouped] = useState({});
  const [layouts, setLayouts] = useState([]);   // ← layout snapshots
  const [loading, setLoading] = useState(true);
  const [activeLayout, setActiveLayout] = useState(null);
  const isWeb = Platform.OS === 'web';

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        try {
          const data = await UserStore.getEPaperSummary();
          if (!alive) return;

          // Articles
          const allPapers = (data?.items || [])
            .filter(p => p.status === 'approved')
            .map(p => ({
              id: p.id || '',
              title: p.title || '',
              description: p.description || '',
              state: p.state || '',
              publishDate: p.publishDate || p.createdAt?.slice(0, 10) || '',
              createdAt: p.createdAt || '',
              createdBy: p.createdBy || '',
              images: p.images || [],
            }));
          const g = {};
          allPapers.forEach(item => {
            const dk = item.publishDate || 'Unknown';
            if (!g[dk]) g[dk] = [];
            g[dk].push(item);
          });
          setGrouped(g);

          // Layout snapshots
          setLayouts(data?.layouts || []);
        } catch (e) {
          console.log('NewspaperList error:', e);
        }
        if (alive) setLoading(false);
      })();
      return () => { alive = false; };
    }, [])
  );

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Find layout snapshot for a date
  const getLayout = (dateKey) =>
    layouts.find(l => l.publishDate === dateKey) || null;

  // ── Web ───────────────────────────────────────────────────────────────────
  if (isWeb) {
    if (activeLayout) {
      return <LayoutViewer layout={activeLayout} onClose={() => setActiveLayout(null)} />;
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F7F4F0' }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => navigation.goBack()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: '#fef6ec', border: '1px solid #fbcfa0',
              fontSize: 12, fontWeight: 700, color: '#7a420a', cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111', fontFamily: 'serif' }}>
            📰 Newspaper
          </span>
        </div>

        <div style={{ padding: 'clamp(14px,3vw,32px) clamp(10px,2vw,24px) 80px', maxWidth: 1100, margin: '0 auto' }}>
          {loading ? (
            <p style={{ color: '#888', textAlign: 'center', paddingTop: 60 }}>Loading…</p>
          ) : sortedDates.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: '#888' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📰</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No published articles available.</div>
            </div>
          ) : sortedDates.map(dateKey => {
            const layout = getLayout(dateKey);
            return (
              <div key={dateKey} style={{ marginBottom: 28 }}>

                {/* ── Date Header (clickable if layout exists) ── */}
                <div
                  onClick={() => layout && setActiveLayout(layout)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 12, paddingBottom: 10, paddingTop: 6,
                    borderBottom: '2px solid #FBCFA0',
                    cursor: layout ? 'pointer' : 'default',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => layout && (e.currentTarget.style.background = '#FEF6EC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13, color: '#C8700F' }}>📅</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#C8700F' }}>{dateKey}</span>
                  {layout && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 700, color: '#16a34a',
                      backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 999, padding: '2px 10px',
                    }}>
                      📰 View Layout
                    </span>
                  )}
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    color: '#7A420A', backgroundColor: '#FEF6EC',
                    border: '1px solid #FBCFA0', borderRadius: 999,
                    padding: '2px 10px',
                  }}>
                    {grouped[dateKey].length} article{grouped[dateKey].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Articles Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}>
                  {grouped[dateKey].map(item => (
                    <div key={item.id} style={{
                      backgroundColor: '#fff', borderRadius: 14, padding: 16,
                      border: '1px solid #EDE8E1',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'transform 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {item.images?.length > 0 && (
                        <img src={item.images[0]} alt={item.title}
                          style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
                        />
                      )}
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111', lineHeight: 1.4, marginBottom: 8 }}>
                        {stripHtml(item.title) || 'Untitled'}
                      </div>
                      {item.description && (
                        <div style={{
                          fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 10,
                          display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {stripHtml(item.description)}
                        </div>
                      )}
                      {item.state && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 700, color: '#C8700F',
                          backgroundColor: '#FEF6EC', border: '1px solid #FBCFA0',
                          borderRadius: 999, padding: '3px 10px', marginBottom: 8,
                        }}>
                          📍 {item.state}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 4 }}>
                        By {item.createdBy?.split('@')[0] || 'Reporter'} • {item.publishDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F4F0' }}>
      {activeLayout && (
        <LayoutViewer layout={activeLayout} onClose={() => setActiveLayout(null)} />
      )}

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            padding: 8, borderRadius: 8,
            backgroundColor: '#fef6ec', borderWidth: 1, borderColor: '#fbcfa0',
          }}
        >
          <Feather name="arrow-left" size={14} color="#7a420a" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#7a420a' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>📰 Newspaper</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
        {loading ? (
          <Text style={{ color: '#888', textAlign: 'center', paddingTop: 60 }}>Loading…</Text>
        ) : sortedDates.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ fontSize: 40 }}>📰</Text>
            <Text style={{ fontSize: 14, color: '#888', marginTop: 12, fontWeight: '600' }}>
              Koi published article nahi hai
            </Text>
          </View>
        ) : sortedDates.map(dateKey => {
          const layout = getLayout(dateKey);
          return (
            <View key={dateKey} style={{ marginBottom: 24 }}>

              {/* Date Header — clickable */}
              <TouchableOpacity
                onPress={() => layout && setActiveLayout(layout)}
                activeOpacity={layout ? 0.7 : 1}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  marginBottom: 10, paddingBottom: 10, paddingVertical: 8,
                  borderBottomWidth: 2, borderBottomColor: '#FBCFA0',
                  backgroundColor: layout ? '#FEF6EC' : 'transparent',
                  borderRadius: 8, paddingHorizontal: 6,
                }}
              >
                <Text style={{ fontSize: 13, color: '#C8700F' }}>📅</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#C8700F', flex: 1 }}>{dateKey}</Text>
                {layout && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
                    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
                  }}>
                    <Feather name="layout" size={10} color="#16a34a" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>View Layout</Text>
                  </View>
                )}
                <Text style={{
                  fontSize: 11, fontWeight: '700', color: '#7A420A',
                  backgroundColor: '#FEF6EC', borderRadius: 999,
                  paddingHorizontal: 10, paddingVertical: 3,
                }}>
                  {grouped[dateKey].length} articles
                </Text>
              </TouchableOpacity>

              {/* Article Cards */}
              {grouped[dateKey].map(item => (
                <View key={item.id} style={{
                  backgroundColor: '#fff', borderRadius: 14, padding: 14,
                  marginBottom: 12, borderWidth: 1, borderColor: '#EDE8E1',
                }}>
                  {item.images?.length > 0 && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={{ width: '100%', height: 150, borderRadius: 10, marginBottom: 10 }}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#111', lineHeight: 22, marginBottom: 6 }}>
                    {stripHtml(item.title) || 'Untitled'}
                  </Text>
                  {!!item.description && (
                    <Text style={{ fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 8 }} numberOfLines={3}>
                      {stripHtml(item.description)}
                    </Text>
                  )}
                  {!!item.state && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      alignSelf: 'flex-start', backgroundColor: '#FEF6EC',
                      borderWidth: 1, borderColor: '#FBCFA0', borderRadius: 999,
                      paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#C8700F' }}>📍 {item.state}</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: '#AAAAAA' }}>
                    By {item.createdBy?.split('@')[0] || 'Reporter'} • {item.publishDate}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}