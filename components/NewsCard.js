import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const categoryColorMap = {
  red:    { bg: '#fee2e2', text: '#b91c1c' },
  blue:   { bg: '#dbeafe', text: '#1d4ed8' },
  green:  { bg: '#dcfce7', text: '#15803d' },
  orange: { bg: '#ffedd5', text: '#c2410c' },
  purple: { bg: '#f3e8ff', text: '#7e22ce' },
  teal:   { bg: '#ccfbf1', text: '#0f766e' },
};

export default function NewsCard({ article }) {
  const { title, category, categoryColor = 'orange', image, date, author, excerpt } = article;
  const badge = categoryColorMap[categoryColor] || categoryColorMap.orange;

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85}>
      {/* Image */}
      <View style={s.imageContainer}>
        <Image source={{ uri: image }} style={s.image} />
        <View style={[s.badge, { backgroundColor: badge.bg }]}>
          <Text style={[s.badgeText, { color: badge.text }]}>{category}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={s.content}>
        <Text style={s.title} numberOfLines={2}>{title}</Text>
        {Boolean(excerpt) && (
          <Text style={s.excerpt} numberOfLines={2}>{excerpt}</Text>
        )}
        <View style={s.meta}>
          <Text style={s.date}>{date}</Text>
          {Boolean(author) && (
            <>
              <Text style={s.dot}> • </Text>
              <Text style={s.author}>{author}</Text>
            </>
          )}
          <Text style={s.readMore}>  Read More →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 14,  marginHorizontal: 500,
    overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  imageContainer: { height: 180, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  badge: {
    position: 'absolute', top: 10, left: 10,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  content: { padding: 12 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20, marginBottom: 6 },
  excerpt: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  date: { fontSize: 11, color: '#9ca3af' },
  dot: { fontSize: 11, color: '#d1d5db' },
  author: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  readMore: { fontSize: 11, color: '#f97316', fontWeight: '700', marginLeft: 'auto' },
});
