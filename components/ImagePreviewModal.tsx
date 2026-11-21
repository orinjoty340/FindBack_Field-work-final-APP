import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { fullUrl } from '@/lib/images';
import { ImageOff, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  uri?: string;
  title?: string;
  visible: boolean;
  onClose: () => void;
};

/** Full-screen image viewer. Tap anywhere or the close button to dismiss. */
export function ImagePreviewModal({ uri, title, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setFailed(false);
    }
  }, [visible, uri]);

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close image preview"
        />

        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text className="flex-1 text-base font-semibold text-white" numberOfLines={1}>
            {title || 'Photo'}
          </Text>

          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.closeButton}
          >
            <Icon as={X} size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.stage} pointerEvents="box-none">
          {failed ? (
            <View style={styles.center}>
              <Icon as={ImageOff} size={40} color="#CBD5E1" />
              <Text className="mt-3 text-sm text-white/80">
                This image could not be loaded.
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: fullUrl(uri) }}
              style={styles.image}
              resizeMode="contain"
              onLoadStart={() => setLoading(true)}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />
          )}

          {loading && !failed ? (
            <View style={styles.center} pointerEvents="none">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
