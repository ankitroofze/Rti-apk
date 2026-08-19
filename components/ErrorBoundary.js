import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    try {
      // Ensure this shows up in Metro/Logcat.
      console.error('App crashed:', error, errorInfo);
    } catch {}
  }

  handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // noop
    }
  };

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;

    const message = String(error?.message || error);
    const stack = String(errorInfo?.componentStack || error?.stack || '');

    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>The app hit a fatal render error.</Text>

        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Message</Text>
          <Text style={styles.mono}>{message}</Text>
          {stack ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Component stack</Text>
              <Text style={styles.mono}>{stack.trim()}</Text>
            </>
          ) : null}
        </ScrollView>

        <TouchableOpacity style={styles.btn} onPress={this.handleReload} activeOpacity={0.85}>
          <Text style={styles.btnText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, backgroundColor: '#0b1220' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#94a3b8', marginTop: 6, fontSize: 13, fontWeight: '600' },
  card: { marginTop: 14, flex: 1, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  cardContent: { padding: 12 },
  label: { color: '#60a5fa', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  mono: { color: '#e5e7eb', fontSize: 12, lineHeight: 18, marginTop: 6 },
  btn: { marginTop: 12, height: 44, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#ffffff', fontWeight: '800' },
});
