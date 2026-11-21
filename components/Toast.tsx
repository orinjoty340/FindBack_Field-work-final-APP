import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColors } from '@/lib/useColors';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

export type ToastState = { type: 'success' | 'error'; message: string } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((type: 'success' | 'error', message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ type, message });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState }) {
  const c = useColors();

  if (!toast) return null;

  const ok = toast.type === 'success';

  return (
    <View
      pointerEvents="none"
      className="absolute bottom-6 left-5 right-5 items-center"
      style={{ zIndex: 50 }}
    >
      <View
        className="w-full max-w-[560px] flex-row items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lg"
        style={{ backgroundColor: c.navyDark, borderWidth: 1, borderColor: c.borderStrong }}
      >
        <Icon as={ok ? CircleCheck : CircleAlert} size={18} color={ok ? '#4ADE80' : '#F87171'} />
        <Text className="flex-1 text-sm text-white">{toast.message}</Text>
      </View>
    </View>
  );
}