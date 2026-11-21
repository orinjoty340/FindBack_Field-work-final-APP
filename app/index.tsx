
import { AppLogo } from '@/components/AppLogo';
import { TypeBadge } from '@/components/Badges';
import NotificationBell from '@/components/NotificationBell';
import { ReportImage } from '@/components/ReportImage';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { C } from '@/lib/palette';
import { useColors } from '@/lib/useColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Backpack,
  CalendarDays,
  ClipboardList,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'https://findback-lostandfound.onrender.com';

const USER_STORAGE_KEY = 'findback_user';
const TOKEN_STORAGE_KEY = 'findback_token';

type Report = {
  id: string;
  type: 'Lost' | 'Found';
  itemName: string;
  category: string;
  description: string;
  location: string;
  date: string;
  imageUrl?: string;
  createdAt?: string;
};

const categories: { icon: LucideIcon; name: string }[] = [
  { icon: Backpack, name: 'Bags' },
  { icon: Smartphone, name: 'Electronics' },
  { icon: KeyRound, name: 'Keys' },
  { icon: Wallet, name: 'Wallets' },
  { icon: Package, name: 'Other' },
];

const steps = [
  { number: '1', title: 'Report an item', desc: 'Share what you lost or found.' },
  { number: '2', title: 'Explore listings', desc: 'Browse reported belongings.' },
  { number: '3', title: 'Reconnect', desc: 'Help an item reach its owner.' },
];

const filters = ['All', 'Lost', 'Found'];

function confirmAction(
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

function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    (globalThis as any).alert?.(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xl font-bold tracking-tight">{title}</Text>
      {right}
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border-border bg-card flex-1 flex-row items-center gap-3 rounded-2xl border p-4 shadow-sm shadow-primary/10 active:opacity-80"
    >
      <View className="bg-accent h-11 w-11 items-center justify-center rounded-xl">
        <Icon as={icon} size={20} className="text-primary" />
      </View>

      <View className="flex-1">
        <Text className="font-semibold">{title}</Text>
        <Text className="text-muted-foreground text-xs">{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function ReportCard({ report }: { report: Report }) {
  return (
    <View className="border-border bg-card rounded-2xl border p-3 shadow-sm shadow-primary/10">
      {/* Item image: tap to open the full-size preview */}
      {report.imageUrl ? (
        <View className="mb-3">
          <ReportImage uri={report.imageUrl} title={report.itemName} />
        </View>
      ) : null}

      {/* Report type and date */}
      <View className="mb-3 flex-row items-center justify-between">
        <TypeBadge type={report.type} />

        <View className="flex-row items-center gap-1">
          <Icon as={CalendarDays} size={13} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-xs">{report.date}</Text>
        </View>
      </View>

      <Text className="text-lg font-semibold">{report.itemName}</Text>

      <Text className="text-primary mt-0.5 text-sm font-medium">
        {report.category}
      </Text>

      <View className="mt-2 flex-row items-center gap-1.5">
        <Icon as={MapPin} size={14} className="text-muted-foreground" />
        <Text className="text-muted-foreground flex-1 text-sm">
          {report.location}
        </Text>
      </View>

      {report.description ? (
        <Text
          className="text-muted-foreground mt-3 text-sm leading-5"
          numberOfLines={3}
        >
          {report.description}
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check login session
  const checkSession = useCallback(async () => {
    try {
      const [token, user] = await AsyncStorage.multiGet([
        TOKEN_STORAGE_KEY,
        USER_STORAGE_KEY,
      ]);

      setIsLoggedIn(Boolean(token[1]) && Boolean(user[1]));
    } catch (err) {
      console.log('Session check error:', err);
      setIsLoggedIn(false);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  // Logout
  const handleLogout = () => {
    confirmAction(
      'Logout',
      'Are you sure you want to logout?',
      'Logout',
      async () => {
        try {
          await AsyncStorage.multiRemove([
            TOKEN_STORAGE_KEY,
            USER_STORAGE_KEY,
          ]);

          setIsLoggedIn(false);
          notify('Logged Out', 'You have successfully logged out.');
        } catch (err) {
          notify('Error', 'Could not logout. Please try again.');
        }
      }
    );
  };

  // Load reports from backend
  const loadReports = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await fetch(`${API_URL}/api/reports`);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Could not load reports.');
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.reports)
          ? data.reports
          : [];

      const normalized: Report[] = list.map((item: any) => ({
        id: String(item._id || item.id || ''),
        type: item.type === 'Found' ? 'Found' : 'Lost',
        itemName: String(item.itemName || 'Unnamed item'),
        category: String(item.category || 'Other'),
        description: String(item.description || ''),
        location: String(item.location || 'Location not provided'),
        date: item.date
          ? String(item.date).slice(0, 10)
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : 'Date not provided',
        imageUrl: String(item.imageUrl || ''),
        createdAt: item.createdAt,
      }));

      normalized.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setReports(normalized);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the server.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh session and reports whenever Home screen is focused
  useFocusEffect(
    useCallback(() => {
      checkSession();
      loadReports();
    }, [checkSession, loadReports])
  );

  // Search and category filters
  const filteredReports = reports.filter((report) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      report.itemName.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.location.toLowerCase().includes(query);

    const matchesType =
      selectedType === 'All' || report.type === selectedType;

    const matchesCategory =
      selectedCategory === 'All' ||
      report.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesType && matchesCategory;
  });

  const hasActiveFilter =
    search !== '' ||
    selectedType !== 'All' ||
    selectedCategory !== 'All';

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        alignItems: 'center',
        paddingBottom: 48,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        className="w-full max-w-[760px] gap-6 px-5"
        style={{ paddingTop: insets.top + 16 }}
      >

        {/* Header */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-2">
              <AppLogo size={48} />

              <View className="min-w-0 flex-1">
                <Text className="text-xl font-bold tracking-tight">
                  FindBack
                </Text>
                <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                  Find it. Return it. Reconnect.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <ThemeToggle />

              {!checkingSession && (
                <NotificationBell isLoggedIn={isLoggedIn} />
              )}

              <Button
                size="icon"
                variant="outline"
                onPress={() => router.push('/report')}
              >
                <Icon as={Plus} size={20} className="text-primary" />
              </Button>
            </View>
          </View>

          {!checkingSession && !isLoggedIn && (
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => router.push('/login')}
              >
                <Text>Login</Text>
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onPress={() => router.push('/signup')}
              >
                <Text>Sign Up</Text>
              </Button>
            </View>
          )}
        </View>

        {/* Hero */}
        <View
          className="overflow-hidden rounded-3xl p-6 shadow-lg shadow-primary/30"
          style={{ backgroundColor: C.navy }}
        >
          <View
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
            style={{ backgroundColor: C.navyLight, opacity: 0.35 }}
          />

          <View
            className="absolute -bottom-12 right-14 h-28 w-28 rounded-full"
            style={{ borderWidth: 16, borderColor: C.gold, opacity: 0.2 }}
          />

          <Text
            className="text-xs font-bold tracking-widest"
            style={{ color: C.gold }}
          >
            LOST SOMETHING?
          </Text>

          <Text className="mt-3 text-3xl font-bold leading-10 text-white">
            Find it with{' '}
            {'\n'}FindBack.
          </Text>

          <Text className="mb-5 mt-3 max-w-[420px] text-sm leading-6 text-white/80">
            Every lost item has a way home. Report a lost or found item and help
            belongings return to their owners.
          </Text>

          {/* Compact subtle purple report button */}
          <Button
            variant="default"
            size="sm"
            className="self-start rounded-xl px-3"
            onPress={() => router.push('/report')}
          >
            <Icon as={Plus} size={16} className="text-primary-foreground" />
            <Text className="text-sm">Report an item</Text>
          </Button>
        </View>

        {/* Quick actions */}
        <View className="flex-row gap-3">
          <QuickAction
            icon={ClipboardList}
            title="My Reports"
            subtitle="Your posts"
            onPress={() => router.push('/reports')}
          />

          <QuickAction
            icon={Users}
            title="Manage Users"
            subtitle="View accounts"
            onPress={() => router.push('/users')}
          />
        </View>

        {/* Search and filters */}
        <View className="border-border bg-card rounded-2xl border p-4 shadow-sm shadow-primary/10">
          <View className="mb-3 flex-row items-center gap-2">
            <Icon as={Search} size={18} className="text-primary" />
            <Text className="text-lg font-bold">Find an item</Text>
          </View>

          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search item, description or location..."
            className="mb-4"
          />

          <Text className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
            Type
          </Text>

          <View className="mb-4 flex-row flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={selectedType === filter ? 'default' : 'outline'}
                className="rounded-full px-4"
                onPress={() => setSelectedType(filter)}
              >
                <Text>{filter}</Text>
              </Button>
            ))}
          </View>

          <Text className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
            Category
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {['All', ...categories.map((item) => item.name)].map((category) => (
              <Button
                key={category}
                size="sm"
                variant={
                  selectedCategory === category ? 'default' : 'outline'
                }
                className="rounded-full px-4"
                onPress={() => setSelectedCategory(category)}
              >
                <Text>{category}</Text>
              </Button>
            ))}
          </View>
        </View>

        {/* Recent Listings */}
        <View className="gap-4">
          <SectionTitle
            title="Recent listings"
            right={
              <View className="flex-row items-center gap-3">
                <Text className="text-muted-foreground text-xs font-semibold">
                  {filteredReports.length} ITEMS
                </Text>

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={refreshing}
                  onPress={() => loadReports(true)}
                >
                  <Icon
                    as={RefreshCw}
                    size={15}
                    className="text-primary"
                  />
                  <Text className="text-primary text-sm">
                    {refreshing ? 'Refreshing' : 'Refresh'}
                  </Text>
                </Button>
              </View>
            }
          />

          {loading ? (
            <View className="border-border bg-card items-center rounded-2xl border p-8">
              <ActivityIndicator size="large" color={c.navyLight} />
              <Text className="text-muted-foreground mt-3 text-sm">
                Loading reports...
              </Text>
            </View>
          ) : error ? (
            <View className="border-border bg-card rounded-2xl border p-5">
              <Text className="mb-1 text-base font-semibold">
                Could not load reports
              </Text>

              <Text className="text-muted-foreground mb-4 text-sm">
                {error}
              </Text>

              <Button
                className="self-start"
                onPress={() => loadReports(true)}
              >
                <Text>Try again</Text>
              </Button>
            </View>
          ) : filteredReports.length === 0 ? (
            <View className="border-border bg-card items-center rounded-2xl border p-8">
              <View className="bg-accent mb-3 h-14 w-14 items-center justify-center rounded-full">
                <Icon as={Package} size={26} className="text-primary" />
              </View>

              <Text className="text-base font-semibold">
                No items found
              </Text>

              <Text className="text-muted-foreground mt-1 text-center text-sm">
                Try another search or filter, or submit a new report.
              </Text>

              {hasActiveFilter && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onPress={() => {
                    setSearch('');
                    setSelectedType('All');
                    setSelectedCategory('All');
                  }}
                >
                  <Text>Clear filters</Text>
                </Button>
              )}
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {filteredReports.map((report) => (
                <View
                  key={report.id}
                  className="w-full md:w-[48.8%]"
                >
                  <ReportCard report={report} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Compact Browse Categories */}
        <View className="gap-3">
          <SectionTitle title="Browse categories" />

          <View className="flex-row flex-wrap gap-2">
            {categories.map((item) => {
              const active = selectedCategory === item.name;

              return (
                <Pressable
                  key={item.name}
                  onPress={() => {
                    setSelectedCategory(item.name);
                    setSearch('');
                    setSelectedType('All');
                  }}
                  className={`w-[48.5%] flex-row items-center gap-2 rounded-xl border p-2 active:opacity-80 md:w-[31.8%] ${
                    active
                      ? 'border-primary bg-accent'
                      : 'border-border bg-card'
                  }`}
                >
                  <View className="bg-accent h-8 w-8 items-center justify-center rounded-lg">
                    <Icon
                      as={item.icon}
                      size={17}
                      className="text-primary"
                    />
                  </View>

                  <Text className="text-sm font-semibold">
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* How it works */}
        <View className="border-border bg-card rounded-3xl border p-5 shadow-sm shadow-primary/10">
          <Text className="mb-5 text-xl font-bold tracking-tight">
            How it works
          </Text>

          {steps.map((step, index) => (
            <View
              key={step.number}
              className={`flex-row items-center gap-4 ${
                index === steps.length - 1 ? '' : 'mb-5'
              }`}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: C.navy }}
              >
                <Text className="font-bold" style={{ color: C.gold }}>
                  {step.number}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="font-semibold">{step.title}</Text>
                <Text className="text-muted-foreground mt-0.5 text-sm">
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        {!checkingSession && isLoggedIn && (
          <Button
            variant="outline"
            size="lg"
            onPress={handleLogout}
          >
            <Icon as={LogOut} size={18} className="text-destructive" />
            <Text className="text-destructive">Logout</Text>
          </Button>
        )}

        <Text className="text-muted-foreground text-center text-xs">
          FindBack — A little help brings things home.
        </Text>
      </View>
    </ScrollView>
  );
}
