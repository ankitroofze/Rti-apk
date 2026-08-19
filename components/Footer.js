// import React from 'react';
// import { View, Text, Platform } from 'react-native';
// import styles from '../styles/FooterStyles';

// export default function Footer({ visible = true }) {
//   if (!visible) return null;

//   return (
//     <View style={[
//       styles.footerRow,
//       Platform.OS === 'web' && {
//         paddingBottom: 'env(safe-area-inset-bottom, 0px)',
//         marginBottom: 0,
//         flexShrink: 0,
//       }
//     ]}>
//       <Text style={styles.footerText}>Designed & Developed by Roofze Digital Hub</Text>
//     </View>
//   );
// }