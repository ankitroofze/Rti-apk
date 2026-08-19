import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function FooterBlock({ data = {}, isEditing = false }) {
  const {
    left = '© भारतीय माहिती अधिकार',
    right = 'www.rtinewsnetwork.com',
    content = '',
    bgColor = '#fafafa',
    textColor = '#444444',
  } = data;

  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.footer, { backgroundColor: bgColor }, isEditing && styles.editing]}>
      <View style={styles.borderTop1} />
      <View style={styles.borderTop2} />

      {content ? (
        // New single editor content
        isWeb ? (
          <div
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              padding: '6px 12px',
              fontSize: 9,
              color: textColor,
              backgroundColor: bgColor,
              lineHeight: 1.4,
            }}
          />
        ) : (
          <View style={[styles.inner, { backgroundColor: bgColor }]}>
            <Text style={[styles.text, { color: textColor }]}>{content.replace(/<[^>]*>/g, '')}</Text>
          </View>
        )
      ) : (
        // Old 3-column fallback
        <View style={styles.inner}>
          <Text style={[styles.text, { color: textColor }]}>{left}</Text>
          <Text style={[styles.center, { color: textColor }]}>
            {'सर्वसामान्य जनतेत भारतीय कायद्याचे प्रबोधन करणारे एकमेव न्यूज पेपर!'}
          </Text>
          <Text style={[styles.text, { color: textColor }]}>{right}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#fafafa',
  },
  editing: {
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  borderTop1: {
    height: 2,
    backgroundColor: '#111',
  },
  borderTop2: {
    height: 1,
    backgroundColor: '#111',
    marginTop: 2,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 9,
    color: '#444',
    flex: 1,
  },
  center: {
    fontSize: 9,
    color: '#222',
    fontWeight: '700',
    textAlign: 'center',
    flex: 2,
    fontStyle: 'italic',
  },
});