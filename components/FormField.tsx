import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type Props = React.ComponentProps<typeof Input> & {
  label: string;
  icon?: LucideIcon;
  isPassword?: boolean;
};

export function FormField({ label, icon, isPassword, className, ...props }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium">{label}</Text>

      <View className="justify-center">
        {icon && (
          <View
            pointerEvents="none"
            className="absolute bottom-0 left-4 top-0 z-10 justify-center"
          >
            <Icon as={icon} size={18} className="text-muted-foreground" />
          </View>
        )}

        <Input
          {...props}
          secureTextEntry={isPassword && !show}
          className={cn(icon && 'pl-11', isPassword && 'pr-12', className)}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShow((value) => !value)}
            hitSlop={10}
            accessibilityLabel={show ? 'Hide password' : 'Show password'}
            className="absolute bottom-0 right-4 top-0 justify-center"
          >
            <Icon as={show ? EyeOff : Eye} size={18} className="text-muted-foreground" />
          </Pressable>
        )}
      </View>
    </View>
  );
}