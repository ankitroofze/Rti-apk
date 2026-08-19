import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ImageBlock({ uri = '', onPick, onRemove }) {
  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Media library access is needed to upload images.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      onPick && onPick(dataUri);
    }
  };

  if (uri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Text style={styles.actionText}>Replace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.removeBtn]} onPress={onRemove}>
            <Text style={[styles.actionText, { color: '#f87171' }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
      <Text style={styles.uploadIcon}>📷</Text>
      <Text style={styles.uploadText}>Image upload karein</Text>
      <Text style={styles.uploadHint}>JPG, PNG support</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  preview: { width: '100%', height: 120, borderRadius: 6, borderWidth: 1, borderColor: '#ccc' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: {
    flex: 1, padding: 6, borderRadius: 5,
    borderWidth: 1, borderColor: '#444',
    backgroundColor: '#2a2a2a', alignItems: 'center',
  },
  removeBtn: { borderColor: '#f87171' },
  actionText: { fontSize: 11, color: '#ccc' },
  uploadArea: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#444',
    borderRadius: 8, padding: 16, alignItems: 'center',
    marginBottom: 10,
  },
  uploadIcon: { fontSize: 28, marginBottom: 4 },
  uploadText: { fontSize: 12, color: '#888' },
  uploadHint: { fontSize: 10, color: '#555', marginTop: 2 },
});
