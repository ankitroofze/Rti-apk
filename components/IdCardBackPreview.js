import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const ID_CARD_BACK = require('../assets/images/id-back.jpeg');

// Front card (minHeight 590, width 360) ke barabar: 360 x 590
export default function AutoIdCardBackPreview() {
  return (
    <View style={styles.card}>
      <Image source={ID_CARD_BACK} style={styles.image} resizeMode="stretch" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 360 / 590,
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