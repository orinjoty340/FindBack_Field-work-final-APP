import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColors } from '@/lib/useColors';
import { Check, CircleDot } from 'lucide-react-native';
import { View } from 'react-native';

export function TypeBadge({ type }: { type: 'Lost' | 'Found' }) {
  const c = useColors();
  const isLost = type === 'Lost';
  const color = isLost ? c.lost : c.found;

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
      style={{ backgroundColor: isLost ? c.lostBg : c.foundBg }}
    >
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-semibold" style={{ color }}>
        {type}
      </Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: 'Active' | 'Resolved' }) {
  const c = useColors();
  const resolved = status === 'Resolved';
  const color = resolved ? c.primary : c.pending;

  return (
    <View
      className="flex-row items-center gap-1 rounded-full px-3 py-1"
      style={{ backgroundColor: resolved ? c.tint : c.pendingBg }}
    >
      <Icon as={resolved ? Check : CircleDot} size={12} color={color} />
      <Text className="text-xs font-semibold" style={{ color }}>
        {resolved ? 'Resolved' : 'Active'}
      </Text>
    </View>
  );
}