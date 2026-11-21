import { AppLogo } from '@/components/AppLogo';
import { Text } from '@/components/ui/text';
import { C } from '@/lib/palette';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navy header */}
        <View
          className="items-center overflow-hidden px-6 pb-20"
          style={{
            backgroundColor: C.navy,
            paddingTop: insets.top + 28,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full"
            style={{ backgroundColor: C.navyLight, opacity: 0.35 }}
          />
          <View
            className="absolute -left-10 bottom-4 h-28 w-28 rounded-full"
            style={{ borderWidth: 16, borderColor: C.gold, opacity: 0.18 }}
          />

          <AppLogo size={96} />

          <Text className="mt-5 text-3xl font-bold tracking-tight text-white">{title}</Text>
          <Text className="mt-2 max-w-[320px] text-center text-sm leading-5 text-white/75">
            {subtitle}
          </Text>
        </View>

        {/* Form card overlapping the header */}
        <View className="w-full max-w-[460px] self-center px-5 pb-10" style={{ marginTop: -44 }}>
          <View className="bg-card border-border gap-4 rounded-3xl border p-6 shadow-lg shadow-primary/15">
            {children}
          </View>

          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}