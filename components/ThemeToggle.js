import React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ compact = false, lightIconColor = '#171717' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, compact && styles.compact]}
      onPress={toggleTheme}
      activeOpacity={0.75}
      accessibilityRole={Platform.OS === 'web' ? 'button' : 'switch'}
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: isDark }}
      aria-pressed={Platform.OS === 'web' ? isDark : undefined}
    >
      <Svg width={compact ? 31 : 36} height={compact ? 20 : 23} viewBox="0 0 64 40" accessible={false}>
        {isDark ? (
          <>
            <Rect x="2" y="1" width="60" height="38" rx="19" fill="#171717" stroke="#64748b" />
            <Path
              fill="#fff"
              d="M27 7a13.5 13.5 0 1 0 14 19A12 12 0 0 1 27 7ZM41 9c1 3 1.5 3.5 4 4.5-2.5 1-3 1.5-4 4.5-1-3-1.5-3.5-4-4.5 2.5-1 3-1.5 4-4.5ZM49 17c.7 2.2 1.1 2.7 3.2 3.4-2.1.7-2.5 1.2-3.2 3.4-.7-2.2-1.1-2.7-3.2-3.4 2.1-.7 2.5-1.2 3.2-3.4Z"
            />
          </>
        ) : (
          <>
            <Path d="M34 5a17 17 0 0 1 8-2h3a17 17 0 0 1 0 34h-3a17 17 0 0 1-8-2" fill="none" stroke={lightIconColor} strokeWidth="2.6" strokeLinecap="round" />
            <Circle cx="20" cy="20" r="9" fill={lightIconColor} />
            <Path d="M20 2v5m0 26v5M2 20h5m26 0h5M7 7l4 4m18 18 4 4M7 33l4-4m18-18 4-4" fill="none" stroke={lightIconColor} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  compact: { width: 36, height: 36 },
});
