import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Returns 'light' regardless of system preference to disable dark mode.
 */
export function useColorScheme(): 'light' {
  return 'light';
}
