import { Icon } from '@/components/ui/icon';
import {
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/lib/themePreference';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

const LABEL: Record<ThemePreference, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

/** Cycles System → Light → Dark and remembers the choice. */
export function ThemeToggle() {
  const { setColorScheme } = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    loadThemePreference().then((value) => {
      if (active) setPreference(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
    setPreference(next);
    setColorScheme(next);
    saveThemePreference(next);
  };

  return (
    <Pressable
      onPress={cycle}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${LABEL[preference]}. Tap to change.`}
      className="border-border bg-card h-11 w-11 items-center justify-center rounded-xl border shadow-sm shadow-primary/10 active:opacity-80"
    >
      <Icon as={ICON[preference]} size={19} className="text-primary" />
    </Pressable>
  );
}
