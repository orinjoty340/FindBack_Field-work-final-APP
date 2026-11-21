import { FormField } from '@/components/FormField';
import { FormMessage } from '@/components/FormMessage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Toast, useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { confirmAction } from '@/lib/feedback';
import { useColors } from '@/lib/useColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  LogIn,
  Mail,
  Pencil,
  RefreshCw,
  Trash2,
  User as UserIcon,
  Users as UsersIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'https://findback-lostandfound.onrender.com';
const TOKEN_STORAGE_KEY = 'findback_token';
const USER_STORAGE_KEY = 'findback_user';

type User = {
  _id: string;
  name: string;
  email: string;
};

type SavedUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
};

type AuthIssue = {
  title: string;
  message: string;
  clearSession: boolean;
} | null;

const getAuthConfig = async () => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    throw new Error('NO_TOKEN');
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  };
};

function apiMessage(error: unknown, fallback: string) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message || fallback
    : fallback;
}

export default function UsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, show } = useToast();
  const c = useColors();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [authIssue, setAuthIssue] = useState<AuthIssue>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Login lagle ba session expire hole true return kore
  const handleAuthError = (error: unknown) => {
    if (error instanceof Error && error.message === 'NO_TOKEN') {
      setAuthIssue({
        title: 'Login required',
        message: 'Please log in to access user management.',
        clearSession: false,
      });
      return true;
    }

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setAuthIssue({
        title: 'Session expired',
        message: 'Please log in again.',
        clearSession: true,
      });
      return true;
    }

    return false;
  };

  const goToLogin = async () => {
    if (authIssue?.clearSession) {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
    }

    router.replace('/login');
  };

  const fetchUsers = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setLoadError('');
      setAuthIssue(null);

      const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

      if (savedUser) {
        const parsedUser: SavedUser = JSON.parse(savedUser);
        setCurrentUserId(parsedUser.id || parsedUser._id || '');
      }

      const config = await getAuthConfig();

      const response = await axios.get(`${API_URL}/api/users`, config);

      setUsers(response.data.users ?? []);
    } catch (error: unknown) {
      if (!handleAuthError(error)) {
        setLoadError(apiMessage(error, 'Could not load users.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const startEdit = (user: User) => {
    if (user._id !== currentUserId) {
      show('error', 'You can only edit your own account.');
      return;
    }

    setEditError('');
    setEditingId(user._id);
    setName(user.name);
    setEmail(user.email);
  };

  const cancelEdit = () => {
    setEditError('');
    setEditingId(null);
    setName('');
    setEmail('');
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (editingId !== currentUserId) {
      setEditError('You can only edit your own account.');
      return;
    }

    if (!name.trim() || !email.trim()) {
      setEditError('Name and email cannot be empty.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEditError('Please enter a valid email address.');
      return;
    }

    setEditError('');
    setSaving(true);

    try {
      const config = await getAuthConfig();

      const response = await axios.put(
        `${API_URL}/api/users/${editingId}`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
        config
      );

      show('success', response.data.message || 'User updated successfully.');

      cancelEdit();
      await fetchUsers(true);
    } catch (error: unknown) {
      if (!handleAuthError(error)) {
        setEditError(apiMessage(error, 'Could not update user.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = (user: User) => {
    if (user._id !== currentUserId) {
      show('error', 'You can only delete your own account.');
      return;
    }

    confirmAction(
      'Delete account',
      `Are you sure you want to delete your account, ${user.name}? You will need to sign up again to use FindBack.`,
      'Delete',
      async () => {
        try {
          const config = await getAuthConfig();

          const response = await axios.delete(
            `${API_URL}/api/users/${user._id}`,
            config
          );

          await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);

          show('success', response.data.message || 'Your account was deleted.');

          setTimeout(() => router.replace('/login'), 1200);
        } catch (error: unknown) {
          if (!handleAuthError(error)) {
            show('error', apiMessage(error, 'Could not delete account.'));
          }
        }
      }
    );
  };

  const subtitle =
    loading || authIssue || loadError
      ? 'Manage accounts'
      : `${users.length} registered ${users.length === 1 ? 'user' : 'users'}`;

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUsers(true)}
              tintColor={c.navyLight}
            />
          }
        >
          <View
            className="w-full max-w-[720px] gap-5 px-5"
            style={{ paddingTop: insets.top + 12 }}
          >
            <ScreenHeader
              title="Users"
              subtitle={subtitle}
              right={
                <Button
                  size="icon"
                  variant="outline"
                  disabled={loading || refreshing}
                  onPress={() => fetchUsers(true)}
                >
                  <Icon as={RefreshCw} size={18} className="text-primary" />
                </Button>
              }
            />

            {loading ? (
              <View className="border-border bg-card items-center rounded-2xl border p-8">
                <ActivityIndicator size="large" color={c.navyLight} />
                <Text className="text-muted-foreground mt-3 text-sm">Loading users...</Text>
              </View>
            ) : authIssue ? (
              <View className="border-border bg-card items-center rounded-2xl border p-8">
                <View
                  className="mb-3 h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: c.goldSoft }}
                >
                  <Icon as={LogIn} size={26} color={c.gold} />
                </View>

                <Text className="text-base font-semibold">{authIssue.title}</Text>
                <Text className="text-muted-foreground mt-1 text-center text-sm">
                  {authIssue.message}
                </Text>

                <Button className="mt-5" onPress={goToLogin}>
                  <Icon as={LogIn} size={18} />
                  <Text>Go to login</Text>
                </Button>
              </View>
            ) : loadError ? (
              <View className="border-border bg-card rounded-2xl border p-5">
                <Text className="mb-1 text-base font-semibold">Could not load users</Text>
                <Text className="text-muted-foreground mb-4 text-sm">{loadError}</Text>
                <Button className="self-start" onPress={() => fetchUsers(true)}>
                  <Text>Try again</Text>
                </Button>
              </View>
            ) : users.length === 0 ? (
              <View className="border-border bg-card items-center rounded-2xl border p-8">
                <View className="bg-accent mb-3 h-14 w-14 items-center justify-center rounded-full">
                  <Icon as={UsersIcon} size={26} className="text-primary" />
                </View>
                <Text className="text-base font-semibold">No users found</Text>
                <Text className="text-muted-foreground mt-1 text-center text-sm">
                  Registered users will appear here.
                </Text>
              </View>
            ) : (
              users.map((item, index) => {
                const isCurrentUser = item._id === currentUserId;
                const isEditing = editingId === item._id;

                return (
                  <View
                    key={item._id}
                    className="border-border bg-card rounded-2xl border p-4 shadow-sm shadow-primary/10"
                    style={isCurrentUser ? { borderColor: c.gold } : undefined}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: isCurrentUser ? c.navy : c.tint }}
                      >
                        <Text
                          className="text-lg font-bold"
                          style={{ color: isCurrentUser ? c.gold : c.primary }}
                        >
                          {item.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="flex-shrink text-base font-semibold" numberOfLines={1}>
                            {item.name}
                          </Text>

                          {isCurrentUser && (
                            <View
                              className="rounded-full px-2 py-0.5"
                              style={{ backgroundColor: c.goldSoft }}
                            >
                              <Text className="text-[11px] font-semibold" style={{ color: c.goldText }}>
                                You
                              </Text>
                            </View>
                          )}
                        </View>

                        <View className="mt-1 flex-row items-center gap-1.5">
                          <Icon as={Mail} size={13} className="text-muted-foreground" />
                          <Text className="text-muted-foreground flex-1 text-sm" numberOfLines={1}>
                            {item.email}
                          </Text>
                        </View>

                        <Text className="text-muted-foreground mt-1 text-xs">
                          Member #{index + 1}
                        </Text>
                      </View>
                    </View>

                    {isCurrentUser && isEditing && (
                      <View className="border-border mt-4 gap-4 border-t pt-4">
                        <FormField
                          label="Full name"
                          icon={UserIcon}
                          value={name}
                          onChangeText={setName}
                          placeholder="Full name"
                          autoCapitalize="words"
                        />

                        <FormField
                          label="Email address"
                          icon={Mail}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="Email address"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />

                        <FormMessage type="error" message={editError} />

                        <View className="flex-row gap-2">
                          <Button className="flex-1" disabled={saving} onPress={saveEdit}>
                            {saving ? (
                              <ActivityIndicator color="#FFFFFF" />
                            ) : (
                              <Text>Save changes</Text>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            className="flex-1"
                            disabled={saving}
                            onPress={cancelEdit}
                          >
                            <Text>Cancel</Text>
                          </Button>
                        </View>
                      </View>
                    )}

                    {isCurrentUser && !isEditing && (
                      <View className="mt-4 flex-row gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onPress={() => startEdit(item)}
                        >
                          <Icon as={Pencil} size={16} />
                          <Text>Edit</Text>
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-1"
                          onPress={() => deleteUser(item)}
                        >
                          <Icon as={Trash2} size={16} className="text-destructive" />
                          <Text className="text-destructive">Delete account</Text>
                        </Button>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast toast={toast} />
    </View>
  );
}