import { useColorScheme } from 'nativewind';
import { darkPalette, lightPalette, type Palette } from '@/lib/palette';

/** Returns the palette for the currently active (light / dark) theme. */
export function useColors(): Palette {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? darkPalette : lightPalette;
}
