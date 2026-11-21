import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { FormMessage } from '@/components/FormMessage';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

const API_URL = 'https://findback-lostandfound.onrender.com';
const USER_STORAGE_KEY = 'findback_user';
const TOKEN_STORAGE_KEY = 'findback_token';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        { timeout: 15000 }
      );

      const user = response.data?.user;
      const token = response.data?.token;

      if (!response.data?.success || !user?.id || !token) {
        setError('The server did not return valid user information or authentication token.');
        return;
      }

      // Save user information and JWT token in app storage.
      await AsyncStorage.multiSet([
        [USER_STORAGE_KEY, JSON.stringify(user)],
        [TOKEN_STORAGE_KEY, token],
      ]);

      router.replace('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(err.response.data?.message || 'Unable to log in.');
        } else {
          setError('Cannot reach the server. Check your network and try again.');
        }
      } else {
        setError('Could not save login information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to FindBack"
      footer={
        <Button variant="ghost" className="mt-4" onPress={() => router.replace('/')}>
          <Text className="text-primary">Continue as guest</Text>
        </Button>
      }
    >
      <FormMessage type="error" message={error} />

      <FormField
        label="Email address"
        icon={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />

      <FormField
        label="Password"
        icon={Lock}
        isPassword
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      <Button size="lg" onPress={handleLogin} disabled={loading} className="mt-1">
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text>Login</Text>}
      </Button>

      <View className="flex-row items-center justify-center">
        <Text className="text-muted-foreground text-sm">Don't have an account? </Text>
        <Pressable onPress={() => router.push('/signup')} hitSlop={8}>
          <Text className="text-primary text-sm font-semibold">Sign up</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}