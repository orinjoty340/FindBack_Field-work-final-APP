import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { thumbUrl } from '@/lib/images';
import { useColors } from '@/lib/useColors';
import { ImageOff, Maximize2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

type Props = {
  uri?: string;
  title?: string;
  /** 'card' = wide banner on top of a card, 'thumb' = small square. */
  variant?: 'card' | 'thumb';
};

/**
 * Report photo with loading state, error fallback and tap-to-preview.
 * Renders nothing when the report has no image.
 */
export function ReportImage({ uri, title, variant = 'card' }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [uri]);

  if (!uri) return null;

  const isThumb = variant === 'thumb';
  const size = isThumb ? { width: 84, height: 84 } : { width: '100%' as const, height: 170 };

  return (
    <>
      <Pressable
        onPress={() => !failed && setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`View photo of ${title || 'item'}`}
        className="overflow-hidden rounded-xl active:opacity-90"
        style={{ ...size, backgroundColor: c.tint }}
      >
        {failed ? (
          <View className="flex-1 items-center justify-center gap-1">
            <Icon as={ImageOff} size={isThumb ? 20 : 26} color={c.textMuted} />
            {!isThumb ? (
              <Text className="text-muted-foreground text-xs">Photo unavailable</Text>
            ) : null}
          </View>
        ) : (
          <>
            <Image
              source={{ uri: thumbUrl(uri, isThumb ? 240 : 720) }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />

            {loading ? (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator color={c.navyLight} />
              </View>
            ) : null}

            {!isThumb && !loading ? (
              <View
                className="absolute bottom-2 right-2 h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <Icon as={Maximize2} size={15} color="#FFFFFF" />
              </View>
            ) : null}
          </>
        )}
      </Pressable>

      <ImagePreviewModal
        uri={uri}
        title={title}
        visible={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
