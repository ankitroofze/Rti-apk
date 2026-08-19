import React from 'react';
const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim();
import { View, Text, Image, StyleSheet, Platform } from 'react-native';

export default function ArticleBlock({ data = {}, isMain = false, isEditing = false, columns = 1 }) {
  const {
    title = '',
    sub = '',
    body = '',
    reporter = '',
    location = '',
    date = '',
    image = '',
  } = data;

  return (
    <View style={[styles.article, isMain && styles.articleMain, isEditing && styles.editing]}>

      {/* Article title */}
      {!!title && (
        Platform.OS === 'web' ? (
          <div dangerouslySetInnerHTML={{ __html: title }} style={{
            fontSize: isMain ? 17 : 14, fontWeight: 900, color: '#111',
            lineHeight: isMain ? '24px' : '20px', marginBottom: 3,
            textAlign: isMain ? 'center' : 'left',
          }} />
        ) : (
          <Text style={[styles.title, isMain && styles.titleMain]}>{(title||'').replace(/<[^>]*>/g,'')}</Text>
        )
      )}

      {/* Sub headline */}
      {!!sub && (
        Platform.OS === 'web' ? (
          <div dangerouslySetInnerHTML={{ __html: sub }} style={{
            fontSize: 9, color: '#555', marginBottom: 4, fontStyle: 'italic',
          }} />
        ) : (
          <Text style={styles.sub}>{(sub||'').replace(/<[^>]*>/g,'')}</Text>
        )
      )}

      {/* Thick divider under title */}
      <View style={styles.titleDivider} />

      {/* Image */}
      {!!image && (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

    {!!body && (
  Platform.OS === 'web' ? (
    <div style={{
      columnCount: isMain ? 3 : columns,
      columnGap: 16,
      columnFill: 'balance',
      WebkitColumnCount: isMain ? 3 : columns,
      MozColumnCount: isMain ? 3 : columns,
      fontSize: isMain ? 12 : 11,
      lineHeight: isMain ? '21px' : '19px',
      color: '#222',
      textAlign: 'justify',
      width: '100%',
      display: 'block',
    }}>
      <span dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  ) : (
    <Text style={[styles.body, isMain && styles.bodyMain]}>
      {(body||'').replace(/<[^>]*>/g,'')}
    </Text>
  )
)}

      {/* Byline */}
      {(!!reporter || !!location || !!date) && (
        <View style={styles.byline}>
          {!!reporter && (
            <Text style={styles.bylineText}>✍ {stripHtml(reporter)}</Text>
          )}
          {!!location && (
            <Text style={styles.bylineText}>● {stripHtml(location)}</Text>
          )}
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  article: {
    padding: 8,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  articleMain: {
    backgroundColor: '#fffdf8',
    padding: 10,
  },
  editing: {
    borderWidth: 2,
    borderColor: '#ea580c',
  },

  // Title
  title: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    fontWeight: '900',
    color: '#111',
    lineHeight: Platform.OS === 'web' ? 20 : 18,
    marginBottom: 3,
  },
  titleMain: {
    fontSize: Platform.OS === 'web' ? 17 : 15,
    lineHeight: Platform.OS === 'web' ? 24 : 21,
    textAlign: 'center',
  },

  // Sub
  sub: {
    fontSize: 9,
    color: '#555',
    marginBottom: 4,
    fontStyle: 'italic',
  },

  // Divider
  titleDivider: {
    height: 1.5,
    backgroundColor: '#111',
    marginBottom: 6,
  },

  // Image
  imageWrap: {
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#999',
  },
  image: {
    width: '100%',
    height: Platform.OS === 'web' ? 140 : 100,
  },

  // Body
  body: {
    fontSize: Platform.OS === 'web' ? 11 : 10,
    lineHeight: Platform.OS === 'web' ? 19 : 17,
    color: '#222',
    textAlign: 'justify',
  },
  bodyMain: {
    fontSize: Platform.OS === 'web' ? 12 : 11,
    lineHeight: Platform.OS === 'web' ? 21 : 19,
  },

  // Byline
  byline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#bbb',
    flexWrap: 'wrap',
    gap: 4,
  },
  bylineText: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  },
});