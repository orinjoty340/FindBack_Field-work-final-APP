import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColors } from '@/lib/useColors';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

type Props = {
  type: 'error' | 'success';
  message: string;
};

export function FormMessage({ type, message }: Props) {
  const c = useColors();

  if (!message) return null;

  const isError = type === 'error';
  const color = isError ? c.lost : c.found;

  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start gap-2 rounded-xl border p-3"
      style={{
        backgroundColor: isError ? c.lostBg : c.foundBg,
        borderColor: isError ? c.lostBorder : c.foundBorder,
      }}
    >
      <Icon as={isError ? CircleAlert : CircleCheck} size={18} color={color} />
      <Text className="flex-1 text-sm" style={{ color }}>
        {message}
      </Text>
    </View>
  );
}