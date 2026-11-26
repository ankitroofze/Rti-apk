import normalizeValueWithProperty from 'react-native-web/dist/exports/StyleSheet/compiler/normalizeValueWithProperty';
import { themeWebValue } from './webColors';

// Apply the website palette to both StyleSheet rules and inline RN Web styles.
export default function normalizeWebStyle(value, property) {
  return themeWebValue(normalizeValueWithProperty(value, property), property);
}
