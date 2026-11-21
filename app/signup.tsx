import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { FormMessage } from '@/components/FormMessage';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

const API_URL = 'https://findback-lostandfound.onrender.com';

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async () => {
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Both passwords must match.');
      return;
    }

    if (loading || success) return;

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/signup`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        { timeout: 15000 }
      );

      if (!response.data?.success) {
        setError(response.data?.message || 'Unable to create account.');
        return;
      }

      setSuccess(
        `Welcome to FindBack, ${response.data.user?.name || name}! Taking you to login...`
      );

      setTimeout(() => router.replace('/login'), 1600);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(err.response.data?.message || 'Unable to create account.');
        } else {
          setError('Cannot reach the server. Check your network and try again.');
        }
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join FindBack and help items find their way home."
      footer={
        <Button variant="ghost" className="mt-4" onPress={() => router.replace('/')}>
          <Text className="text-primary">Continue as guest</Text>
        </Button>
      }
    >
      <FormMessage type="error" message={error} />
      <FormMessage type="success" message={success} />

      <FormField
        label="Full name"
        icon={User}
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
        autoCapitalize="words"
        returnKeyType="next"
      />

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
        placeholder="At least 6 characters"
        returnKeyType="next"
      />

      <FormField
        label="Confirm password"
        icon={Lock}
        isPassword
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Enter password again"
        returnKeyType="go"
        onSubmitEditing={handleSignup}
      />

      <Button
        size="lg"
        onPress={handleSignup}
        disabled={loading || Boolean(success)}
        className="mt-1"
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text>Create account</Text>}
      </Button>

      <View className="flex-row flex-wrap items-center justify-center">
        <Text className="text-muted-foreground text-sm">Already have an account? </Text>
        <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
          <Text className="text-primary text-sm font-semibold">Login</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}