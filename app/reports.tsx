import { StatusBadge, TypeBadge } from '@/components/Badges';
import { FormField } from '@/components/FormField';
import { FormMessage } from '@/components/FormMessage';
import { ReportImage } from '@/components/ReportImage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Toast, useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { confirmAction } from '@/lib/feedback';
import { useColors } from '@/lib/useColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CalendarDays,
  Check,
  ClipboardList,
  LogIn,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'https://findback-lostandfound.onrender.com';
const USER_STORAGE_KEY = 'findback_user';
const TOKEN_STORAGE_KEY = 'findback_token';

type Report = {
  id: string;
  _id?: string;
  type: 'Lost' | 'Found';
  itemName: string;
  category: string;
  description: string;
  location: string;
  date: string;
  imageUrl?: string;
  createdAt?: string;
  status: 'Active' | 'Resolved';
};

type EditFields = {
  type: 'Lost' | 'Found';
  itemName: string;
  category: string;
  description: string;
  location: string;
  date: string;
};

const statusOptions = ['All', 'Active', 'Resolved'];

// YYYY-MM-DD format ar real date kina check kore
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

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'Could not connect to the server.';
  }

  return error instanceof Error ? error.message : fallback;
}

function MetaRow({ icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={icon} size={15} className="text-muted-foreground" />
      <Text className="text-muted-foreground flex-1 text-sm">{text}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="border-border bg-card flex-1 rounded-2xl border p-4 shadow-sm shadow-primary/10">
      <Text className="text-2xl font-bold">{value}</Text>
      <Text className="text-muted-foreground text-xs">{label}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show } = useToast();
  const c = useColors();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState('');

  const [editFields, setEditFields] = useState<EditFields>({
    type: 'Lost',
    itemName: '',
    category: '',
    description: '',
    location: '',
    date: '',
  });

  // Get the logged-in user's ID.
  const getUserId = async () => {
    const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

    if (!savedUser) {
      throw new Error('Please log in again to manage your reports.');
    }

    const user = JSON.parse(savedUser);
    const userId = String(user.id || user._id || '');

    if (!userId) {
      throw new Error('User information is missing. Please log in again.');
    }

    return userId;
  };

  // Get JWT token for protected API requests.
  const getAuthConfig = async () => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      throw new Error('Authentication token missing. Please log in again.');
    }

    return {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Load reports belonging to the logged-in user.
  const loadReports = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setNeedsLogin(false);

    try {
      const userId = await getUserId();
      const authConfig = await getAuthConfig();

      const response = await axios.get(
        `${API_URL}/api/reports/user/${userId}`,
        authConfig
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not fetch reports.');
      }

      const fetchedReports: Report[] = (response.data.reports || []).map(
        (report: any) => ({
          ...report,
          id: String(report._id || report.id),
          imageUrl: String(report.imageUrl || ''),
          status: report.status || 'Active',
        })
      );

      setReports(fetchedReports);
    } catch (error) {
      const message = errorMessage(error, 'Could not load your reports.');

      setLoadError(message);
      setNeedsLogin(
        /log in/i.test(message) ||
          (axios.isAxiosError(error) && error.response?.status === 401)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  // Update report status.
  const updateStatus = async (report: Report) => {
    const nextStatus = report.status === 'Resolved' ? 'Active' : 'Resolved';

    setSaving(true);

    try {
      const authConfig = await getAuthConfig();

      const response = await axios.put(
        `${API_URL}/api/reports/${report.id}`,
        { status: nextStatus },
        authConfig
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not update status.');
      }

      setReports((current) =>
        current.map((item) =>
          item.id === report.id ? { ...item, status: nextStatus } : item
        )
      );

      show(
        'success',
        nextStatus === 'Resolved'
          ? 'Marked as resolved.'
          : 'Your report is active again.'
      );
    } catch (error) {
      show('error', errorMessage(error, 'Could not update status.'));
    } finally {
      setSaving(false);
    }
  };

  // Start editing a report.
  const startEditing = (report: Report) => {
    setEditFields({
      type: report.type,
      itemName: report.itemName,
      category: report.category,
      description: report.description,
      location: report.location,
      date: String(report.date || '').slice(0, 10),
    });

    setEditError('');
    setEditingId(report.id);
  };

  const cancelEditing = () => {
    setEditError('');
    setEditingId(null);
  };

  // Save edited report.
  const saveEdit = async (report: Report) => {
    const fields = {
      type: editFields.type,
      itemName: editFields.itemName.trim(),
      category: editFields.category.trim(),
      description: editFields.description.trim(),
      location: editFields.location.trim(),
      date: editFields.date.trim(),
    };

    if (
      !fields.itemName ||
      !fields.category ||
      !fields.description ||
      !fields.location ||
      !fields.date
    ) {
      setEditError('Please fill in every field.');
      return;
    }

    if (!isValidDate(fields.date)) {
      setEditError('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    setEditError('');
    setSaving(true);

    try {
      const authConfig = await getAuthConfig();

      const response = await axios.put(
        `${API_URL}/api/reports/${report.id}`,
        fields,
        authConfig
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not save your changes.');
      }

      const updated = response.data.report;

      setReports((current) =>
        current.map((item) =>
          item.id === report.id
            ? {
                ...item,
                ...fields,
                status: updated?.status || item.status || 'Active',
              }
            : item
        )
      );

      setEditingId(null);
      show('success', 'Your report has been updated.');
    } catch (error) {
      setEditError(errorMessage(error, 'Could not save your report.'));
    } finally {
      setSaving(false);
    }
  };

  // Delete report.
  const deleteReport = (report: Report) => {
    confirmAction(
      'Delete report',
      `Delete "${report.itemName}" permanently?`,
      'Delete',
      async () => {
        setSaving(true);

        try {
          const authConfig = await getAuthConfig();

          const response = await axios.delete(
            `${API_URL}/api/reports/${report.id}`,
            authConfig
          );

          if (!response.data?.success) {
            throw new Error(response.data?.message || 'Could not delete report.');
          }

          setReports((current) => current.filter((item) => item.id !== report.id));

          if (editingId === report.id) {
            setEditingId(null);
          }

          show('success', 'Your report has been deleted.');
        } catch (error) {
          show('error', errorMessage(error, 'Could not delete the report.'));
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const visibleReports = reports.filter((report) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Resolved') return report.status === 'Resolved';
    return report.status !== 'Resolved';
  });

  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;
  const activeCount = reports.length - resolvedCount;

  const changeField = <K extends keyof EditFields>(
    field: K,
    value: EditFields[K]
  ) => {
    setEditFields((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <View className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 96 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="w-full max-w-[720px] gap-5 px-5"
            style={{ paddingTop: insets.top + 12 }}
          >
            <ScreenHeader
              title="My reports"
              subtitle="Manage your posts."
              right={
                <View className="flex-row gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={loading || saving}
                    onPress={loadReports}
                  >
                    <Icon as={RefreshCw} size={18} className="text-primary" />
                  </Button>

                  <Button
                    size="icon"
                    variant="gold"
                    onPress={() => router.push('/report')}
                  >
                    <Icon as={Plus} size={20} />
                  </Button>
                </View>
              }
            />

            {loading ? (
              <View className="border-border bg-card items-center rounded-2xl border p-8">
                <ActivityIndicator size="large" color={c.navyLight} />
                <Text className="text-muted-foreground mt-3 text-sm">
                  Loading your reports...
                </Text>
              </View>
            ) : loadError ? (
              <View className="border-border bg-card rounded-2xl border p-5">
                <Text className="mb-1 text-base font-semibold">
                  Could not load reports
                </Text>
                <Text className="text-muted-foreground mb-4 text-sm">{loadError}</Text>

                <View className="flex-row gap-2">
                  <Button onPress={loadReports}>
                    <Text>Try again</Text>
                  </Button>

                  {needsLogin && (
                    <Button variant="outline" onPress={() => router.push('/login')}>
                      <Icon as={LogIn} size={18} className="text-primary" />
                      <Text className="text-primary">Login</Text>
                    </Button>
                  )}
                </View>
              </View>
            ) : reports.length === 0 ? (
              <View className="border-border bg-card items-center rounded-2xl border p-8">
                <View className="bg-accent mb-3 h-14 w-14 items-center justify-center rounded-full">
                  <Icon as={ClipboardList} size={26} className="text-primary" />
                </View>

                <Text className="text-base font-semibold">No reports yet</Text>
                <Text className="text-muted-foreground mt-1 text-center text-sm">
                  Reports you submit will appear here.
                </Text>

                <Button
                  variant="gold"
                  className="mt-5"
                  onPress={() => router.push('/report')}
                >
                  <Icon as={Plus} size={18} />
                  <Text>Report an item</Text>
                </Button>
              </View>
            ) : (
              <>
                {/* Stats */}
                <View className="flex-row gap-3">
                  <Stat label="Total" value={reports.length} />
                  <Stat label="Active" value={activeCount} />
                  <Stat label="Resolved" value={resolvedCount} />
                </View>

                {/* Filter */}
                <View className="flex-row flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const count =
                      option === 'All'
                        ? reports.length
                        : option === 'Active'
                          ? activeCount
                          : resolvedCount;

                    return (
                      <Button
                        key={option}
                        size="sm"
                        variant={statusFilter === option ? 'default' : 'outline'}
                        className="rounded-full px-4"
                        onPress={() => setStatusFilter(option)}
                      >
                        <Text>
                          {option} ({count})
                        </Text>
                      </Button>
                    );
                  })}
                </View>

                {/* List */}
                {visibleReports.length === 0 ? (
                  <View className="border-border bg-card items-center rounded-2xl border p-6">
                    <Text className="text-muted-foreground text-sm">
                      No {statusFilter.toLowerCase()} reports yet.
                    </Text>
                  </View>
                ) : (
                  visibleReports.map((report) => {
                    const isResolved = report.status === 'Resolved';
                    const isEditing = editingId === report.id;

                    return (
                      <View
                        key={report.id}
                        className="border-border bg-card rounded-2xl border p-4 shadow-sm shadow-primary/10"
                        style={isResolved ? { borderColor: c.navyLight } : undefined}
                      >
                        <View className="mb-3 flex-row items-center justify-between">
                          <TypeBadge type={report.type} />
                          <StatusBadge status={report.status} />
                        </View>

                        {isEditing ? (
                          <View className="gap-4">
                            <View className="gap-1.5">
                              <Text className="text-sm font-medium">Report type</Text>
                              <View className="flex-row gap-2">
                                {(['Lost', 'Found'] as const).map((type) => (
                                  <Button
                                    key={type}
                                    size="sm"
                                    variant={editFields.type === type ? 'default' : 'outline'}
                                    className="flex-1"
                                    onPress={() => changeField('type', type)}
                                  >
                                    <Text>{type}</Text>
                                  </Button>
                                ))}
                              </View>
                            </View>

                            <FormField
                              label="Item name"
                              icon={Tag}
                              value={editFields.itemName}
                              onChangeText={(v) => changeField('itemName', v)}
                              placeholder="Item name"
                              maxLength={100}
                            />

                            <FormField
                              label="Category"
                              icon={Tag}
                              value={editFields.category}
                              onChangeText={(v) => changeField('category', v)}
                              placeholder="Category"
                            />

                            <FormField
                              label="Location"
                              icon={MapPin}
                              value={editFields.location}
                              onChangeText={(v) => changeField('location', v)}
                              placeholder="Location"
                              maxLength={200}
                            />

                            <FormField
                              label="Date"
                              icon={CalendarDays}
                              value={editFields.date}
                              onChangeText={(v) => changeField('date', v)}
                              placeholder="YYYY-MM-DD"
                              maxLength={10}
                            />

                            <View className="gap-1.5">
                              <Text className="text-sm font-medium">Description</Text>
                              <Textarea
                                value={editFields.description}
                                onChangeText={(v) => changeField('description', v)}
                                placeholder="Description"
                                maxLength={1000}
                                className="bg-card min-h-28 rounded-xl px-4 py-3"
                              />
                            </View>

                            <FormMessage type="error" message={editError} />

                            <View className="flex-row gap-2">
                              <Button
                                className="flex-1"
                                disabled={saving}
                                onPress={() => saveEdit(report)}
                              >
                                {saving ? (
                                  <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                  <>
                                    <Icon as={Check} size={18} />
                                    <Text>Save changes</Text>
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                className="flex-1"
                                disabled={saving}
                                onPress={cancelEditing}
                              >
                                <Text>Cancel</Text>
                              </Button>
                            </View>
                          </View>
                        ) : (
                          <>
                            <View className="flex-row gap-3">
                              {report.imageUrl ? (
                                <ReportImage
                                  uri={report.imageUrl}
                                  title={report.itemName}
                                  variant="thumb"
                                />
                              ) : null}

                              <View className="min-w-0 flex-1">
                                <Text className="text-lg font-semibold" numberOfLines={2}>
                                  {report.itemName}
                                </Text>

                                <View className="mt-2 gap-1.5">
                                  <MetaRow icon={Tag} text={report.category} />
                                  <MetaRow icon={MapPin} text={report.location} />
                                  <MetaRow
                                    icon={CalendarDays}
                                    text={String(report.date || '').slice(0, 10)}
                                  />
                                </View>
                              </View>
                            </View>

                            {report.description ? (
                              <Text className="text-muted-foreground mt-3 text-sm leading-5">
                                {report.description}
                              </Text>
                            ) : null}

                            <View className="mt-4 gap-2">
                              <Button
                                variant={isResolved ? 'outline' : 'default'}
                                disabled={saving}
                                onPress={() => updateStatus(report)}
                              >
                                <Icon as={isResolved ? RotateCcw : Check} size={18} />
                                <Text>
                                  {saving
                                    ? 'Please wait...'
                                    : isResolved
                                      ? 'Reopen report'
                                      : 'Mark as resolved'}
                                </Text>
                              </Button>

                              <View className="flex-row gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  disabled={saving}
                                  onPress={() => startEditing(report)}
                                >
                                  <Icon as={Pencil} size={16} />
                                  <Text>Edit</Text>
                                </Button>

                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  disabled={saving}
                                  onPress={() => deleteReport(report)}
                                >
                                  <Icon as={Trash2} size={16} className="text-destructive" />
                                  <Text className="text-destructive">Delete</Text>
                                </Button>
                              </View>
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast toast={toast} />
    </View>
  );
}