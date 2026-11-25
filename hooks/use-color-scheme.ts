import { useTheme } from '../contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  try {
    const { isDark } = useTheme();
    return isDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
