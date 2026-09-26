import { Text, TextInput, Platform } from 'react-native';

const DEFAULT_FONT = Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_400Regular';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: DEFAULT_FONT }, Text.defaultProps.style];

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: DEFAULT_FONT }, TextInput.defaultProps.style];