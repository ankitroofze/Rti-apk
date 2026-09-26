import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const ID_CARD_BACK = require('../assets/images/id-back.jpeg');

export default function AutoIdCardBackPreview() {
  return (
    <View style={styles.card}>
      <Image
        source={ID_CARD_BACK}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1024 / 1536,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
