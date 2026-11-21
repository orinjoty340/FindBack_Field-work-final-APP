import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  const router = useRouter();

  const goBack = () => {
    // Web e direct open/refresh korle back history thake na, tai Home e pathai
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={goBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="border-border bg-card h-11 w-11 items-center justify-center rounded-xl border shadow-sm shadow-primary/10 active:opacity-80"
      >
        <Icon as={ArrowLeft} size={20} className="text-primary" />
      </Pressable>

      <View className="flex-1">
        <Text className="text-2xl font-bold tracking-tight">{title}</Text>
        {subtitle ? (
          <Text className="text-muted-foreground text-sm">{subtitle}</Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}