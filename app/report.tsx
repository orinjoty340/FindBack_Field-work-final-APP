
import { FormField } from '@/components/FormField';
import { FormMessage } from '@/components/FormMessage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useColors } from '@/lib/useColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  CalendarDays,
  ImagePlus,
  LogIn,
  MapPin,
  PackageCheck,
  PackageSearch,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'https://findback-lostandfound.onrender.com';
const USER_STORAGE_KEY = 'findback_user';
const TOKEN_STORAGE_KEY = 'findback_token';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const categories = ['Electronics', 'Documents', 'Accessories', 'Pets', 'Other'];

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(year, month - 1, day);

  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function Label({ children }: { children: ReactNode }) {
  return <Text className="mb-1.5 text-sm font-medium">{children}</Text>;
}

function TypeOption({
  active,
  title,
  hint,
  icon,
  color,
  bg,
  onPress,
}: {
  active: boolean;
  title: string;
  hint: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  const c = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-1 gap-3 rounded-2xl border-2 p-4 active:opacity-80 ${
        active ? '' : 'border-border bg-card'
      }`}
      style={active ? { backgroundColor: bg, borderColor: color } : undefined}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: active ? color : c.tint }}
      >
        <Icon as={icon} size={20} color={active ? '#FFFFFF' : c.navyLight} />
      </View>

      <View>
        <Text className="font-semibold" style={active ? { color } : undefined}>
          {title}
        </Text>
        <Text className="text-muted-foreground text-xs">{hint}</Text>
      </View>
    </Pressable>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [type, setType] = useState<'Lost' | 'Found'>('Lost');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [token, user] = await AsyncStorage.multiGet([
            TOKEN_STORAGE_KEY,
            USER_STORAGE_KEY,
          ]);
          setLoggedIn(Boolean(token[1]) && Boolean(user[1]));
        } catch {
          setLoggedIn(false);
        }
      })();
    }, [])
  );

  const fail = (message: string, login = false) => {
    setSuccess('');
    setError(message);
    setNeedsLogin(login);
  };

  // Select image from gallery
  const pickImage = async () => {
    try {
      setError('');

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        fail('Gallery permission is required to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      const extension = asset.fileName?.split('.').pop()?.toLowerCase()
        || asset.uri.split('?')[0].split('.').pop()?.toLowerCase()
        || '';

      let mimeType = asset.mimeType?.toLowerCase() || '';

      if (!mimeType) {
        if (extension === 'jpg' || extension === 'jpeg') {
          mimeType = 'image/jpeg';
        } else if (extension === 'png') {
          mimeType = 'image/png';
        } else if (extension === 'webp') {
          mimeType = 'image/webp';
        }
      }

      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        fail('Only JPG, PNG and WEBP images are allowed.');
        return;
      }

      if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
        fail('Image size must be less than 5 MB.');
        return;
      }

      setSelectedImage({
        ...asset,
        mimeType,
      });

      setError('');
    } catch (err) {
      console.error('Image picker error:', err);
      fail('Could not select image. Please try again.');
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setError('');
  };

  const submitReport = async () => {
    setError('');
    setNeedsLogin(false);

    if (
      !itemName.trim() ||
      !description.trim() ||
      !location.trim() ||
      !date.trim()
    ) {
      fail('Please fill in all the required fields.');
      return;
    }

    if (!isValidDate(date.trim())) {
      fail('Please enter a valid date in YYYY-MM-DD format (e.g. 2026-10-28).');
      return;
    }

    if (loading || success) return;

    setLoading(true);

    try {
      const [storedUser, token] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      ]);

      if (!storedUser || !token) {
        fail('Please log in before submitting a report.', true);
        return;
      }

      let user;

      try {
        user = JSON.parse(storedUser);
      } catch {
        fail('Your saved login information is invalid. Please log in again.', true);
        return;
      }

      if (!user?.id && !user?._id) {
        fail('User information is missing. Please log in again.', true);
        return;
      }

      // Create multipart form data
      const formData = new FormData();

      formData.append('type', type);
      formData.append('itemName', itemName.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('date', date.trim());

      // Attach image if selected
      if (selectedImage) {
        const extension = selectedImage.mimeType === 'image/png'
          ? 'png'
          : selectedImage.mimeType === 'image/webp'
            ? 'webp'
            : 'jpg';

        const fileName =
          selectedImage.fileName || `findback-${Date.now()}.${extension}`;

        if (Platform.OS === 'web' && selectedImage.file) {
          formData.append('image', selectedImage.file as any);
        } else {
          formData.append(
            'image',
            {
              uri: selectedImage.uri,
              name: fileName,
              type: selectedImage.mimeType || 'image/jpeg',
            } as any
          );
        }
      }

      const response = await axios.post(
        `${API_URL}/api/reports`,
        formData,
        {
          timeout: 60000,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        setSuccess('Report submitted! Taking you back home...');

        setItemName('');
        setCategory('Other');
        setDescription('');
        setLocation('');
        setDate('');
        setType('Lost');
        setSelectedImage(null);

        redirectTimer.current = setTimeout(() => router.replace('/'), 1300);
      } else {
        fail(response.data?.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error(
        'Report submission error:',
        axios.isAxiosError(err) ? err.response?.data || err.message : err
      );

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          fail('Your session expired. Please log in again to submit your report.', true);
        } else if (err.response?.status === 413) {
          fail('Image is too large. Please select an image under 5 MB.');
        } else {
          fail(
            err.response?.data?.message ||
              'Could not submit the report. Check your internet connection and try again.'
          );
        }
      } else {
        fail('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="w-full max-w-[640px] gap-5 px-5"
          style={{ paddingTop: insets.top + 12 }}
        >
          <ScreenHeader
            title="Report an item"
            subtitle="Help someone find what they lost."
          />

          {/* Login required notice */}
          {loggedIn === false && (
            <View className="border-border bg-card flex-row items-center gap-3 rounded-2xl border p-4 shadow-sm shadow-primary/10">
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: c.goldSoft }}
              >
                <Icon as={LogIn} size={20} color={c.gold} />
              </View>

              <View className="flex-1">
                <Text className="font-semibold">Login required</Text>
                <Text className="text-muted-foreground text-xs">
                  You need to log in to submit a report.
                </Text>
              </View>

              <Button size="sm" onPress={() => router.push('/login')}>
                <Text>Login</Text>
              </Button>
            </View>
          )}

          {/* Report type */}
          <View className="gap-2">
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Report type
            </Text>

            <View className="flex-row gap-3">
              <TypeOption
                active={type === 'Lost'}
                title="Lost item"
                hint="I lost something"
                icon={PackageSearch}
                color={c.lost}
                bg={c.lostBg}
                onPress={() => setType('Lost')}
              />

              <TypeOption
                active={type === 'Found'}
                title="Found item"
                hint="I found something"
                icon={PackageCheck}
                color={c.found}
                bg={c.foundBg}
                onPress={() => setType('Found')}
              />
            </View>
          </View>

          {/* Details form */}
          <View className="border-border bg-card gap-5 rounded-3xl border p-5 shadow-sm shadow-primary/10">
            <FormField
              label="Item name *"
              icon={Tag}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. Samsung mobile phone"
              maxLength={100}
              returnKeyType="next"
            />

            <View>
              <Label>Category</Label>

              <View className="flex-row flex-wrap gap-2">
                {categories.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={category === item ? 'default' : 'outline'}
                    className="rounded-full px-4"
                    onPress={() => setCategory(item)}
                  >
                    <Text>{item}</Text>
                  </Button>
                ))}
              </View>
            </View>

            <View>
              <Label>Description *</Label>

              <Textarea
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the item, colour, brand, or identifying details..."
                maxLength={1000}
                className="bg-card min-h-28 rounded-xl px-4 py-3"
              />

              <Text className="text-muted-foreground mt-1 text-right text-xs">
                {description.length}/1000
              </Text>
            </View>

            <FormField
              label="Location *"
              icon={MapPin}
              value={location}
              onChangeText={setLocation}
              placeholder="Where was it lost or found?"
              maxLength={200}
              returnKeyType="next"
            />

            <View>
              <Label>Date *</Label>

              <View className="flex-row items-center gap-2">
                <View className="flex-1 justify-center">
                  <View
                    pointerEvents="none"
                    className="absolute bottom-0 left-4 top-0 z-10 justify-center"
                  >
                    <Icon
                      as={CalendarDays}
                      size={18}
                      className="text-muted-foreground"
                    />
                  </View>

                  <Input
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    maxLength={10}
                    keyboardType="numbers-and-punctuation"
                    className="pl-11"
                  />
                </View>

                <Button
                  variant="outline"
                  className="h-12 rounded-xl px-4"
                  onPress={() => setDate(todayString())}
                >
                  <Text>Today</Text>
                </Button>
              </View>
            </View>

            {/* Image upload section */}
            <View className="gap-3">
              <View>
                <Label>Item image (Optional)</Label>
                <Text className="text-muted-foreground text-xs">
                  Add a photo to help others identify the item.
                </Text>
              </View>

              {selectedImage ? (
                <View
                  className="border-border overflow-hidden rounded-2xl border"
                  style={{ backgroundColor: c.tint }}
                >
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={{
                      width: '100%',
                      height: 210,
                      backgroundColor: c.tint,
                    }}
                    resizeMode="contain"
                  />

                  <View className="flex-row items-center justify-between p-3">
                    <View className="flex-1">
                      <Text className="font-medium" numberOfLines={1}>
                        {selectedImage.fileName || 'Selected image'}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        Image ready to upload
                      </Text>
                    </View>

                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={pickImage}
                        disabled={loading}
                        className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
                      >
                        <Icon as={ImagePlus} size={19} color={c.primary} />
                      </Pressable>

                      <Pressable
                        onPress={removeImage}
                        disabled={loading}
                        className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
                      >
                        <Icon as={Trash2} size={19} color={c.lost} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={pickImage}
                  disabled={loading}
                  className="items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 active:opacity-70"
                  style={{
                    borderColor: c.borderStrong,
                    backgroundColor: c.tint,
                  }}
                >
                  <View
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: c.surface }}
                  >
                    <Icon as={ImagePlus} size={26} color={c.primary} />
                  </View>

                  <View className="items-center gap-1">
                    <Text className="font-semibold">
                      Choose an image
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      JPG, PNG or WEBP · Maximum 5 MB
                    </Text>
                  </View>
                </Pressable>
              )}

              <Text className="text-muted-foreground text-xs">
                Photos are securely uploaded when you submit your report.
              </Text>
            </View>
          </View>

          {/* Feedback + submit */}
          <FormMessage type="error" message={error} />
          <FormMessage type="success" message={success} />

          {needsLogin && (
            <Button variant="outline" onPress={() => router.push('/login')}>
              <Icon as={LogIn} size={18} className="text-primary" />
              <Text className="text-primary">Go to login</Text>
            </Button>
          )}

          <Button
            size="lg"
            onPress={submitReport}
            disabled={loading || Boolean(success)}
          >
            {loading ? (
              <ActivityIndicator color={c.white} />
            ) : (
              <Text>Submit {type.toLowerCase()} report</Text>
            )}
          </Button>

          <Text className="text-muted-foreground text-center text-xs leading-5">
            * Required fields. Your report will be submitted to FindBack.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
