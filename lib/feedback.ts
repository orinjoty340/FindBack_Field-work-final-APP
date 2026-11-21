import { Alert, Platform } from 'react-native';

export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void
) {
  if (Platform.OS === 'web') {
    const ok = (globalThis as any).confirm?.(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}