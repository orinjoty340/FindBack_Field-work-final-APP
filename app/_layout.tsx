import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { loadThemePreference } from '@/lib/themePreference';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const navTheme = NAV_THEME[scheme];

  // Restore the theme the user picked last time (Light / Dark / System).
  useEffect(() => {
    let active = true;

    let timer: ReturnType<typeof setTimeout> | undefined;

    loadThemePreference().then((preference) => {
      // Apply after the first paint/hydration so React never sees a theme
      // change while the tree is still mounting.
      if (active) timer = setTimeout(() => setColorScheme(preference), 0);
    });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [setColorScheme]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: navTheme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="report" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="users" />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
