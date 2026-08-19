import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function HeadlineBlock({ data = {}, isEditing = false }) {
  const { title = '', sub = '', subsub = '' } = data;

  return (
    <View style={[styles.wrapper, { backgroundColor: data.headlineBgColor || '#111' }, isEditing && styles.editing]}>
      <View style={styles.inner}>
        {!!title && (
          Platform.OS === 'web'
            ? <div dangerouslySetInnerHTML={{ __html: title }} style={{ color:'#fff', fontSize:28, fontWeight:900, textAlign:'center', lineHeight:1.2, margin:'6px 0' }} />
            : <Text style={styles.title}>{title}</Text>
        )}
        {!!sub && (
          Platform.OS === 'web'
            ? <div dangerouslySetInnerHTML={{ __html: sub }} style={{ color:'#fff', fontSize:22, fontWeight:900, textAlign:'center', marginTop:2, textDecoration:'underline' }} />
            : <Text style={styles.sub}>{sub}</Text>
        )}
        {!!subsub && (
          Platform.OS === 'web'
            ? <div dangerouslySetInnerHTML={{ __html: subsub }} style={{ color:'#fff', fontSize:16, fontWeight:700, textAlign:'center', marginTop:6, borderTop:'1px solid #444', paddingTop:6 }} />
            : <View style={styles.subsubRow}><Text style={styles.subsub}>{subsub}</Text></View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#111',
    marginHorizontal: 20, 
    paddingHorizontal: 20,
  },
  editing: {
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  inner: {
    paddingHorizontal: 20,  // kam karo
    paddingVertical: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  subsubRow: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  subsub: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});