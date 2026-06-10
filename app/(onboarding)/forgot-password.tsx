import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!sent) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/(onboarding)/sign-in');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sent]);

  const handleSendLink = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      showAlert({ title: 'Error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <Text style={[styles.confirmIcon, { color: theme.primary }]}>✓</Text>
          <Text style={[styles.confirmTitle, { color: theme.onBackground }]}>
            Check Your Email
          </Text>
          <Text style={[styles.confirmBody, { color: theme.outline }]}>
            We've sent a password reset link to{' '}
            <Text style={{ color: theme.onBackground, fontWeight: '600' }}>{email}</Text>
            . Follow the instructions in the email to reset your password.
          </Text>
          <Text style={[styles.redirectText, { color: theme.outline }]}>
            Redirecting to sign in in {countdown}s...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.onBackground }]}>Reset Your Password</Text>
        <Text style={[styles.body, { color: theme.onBackground }]}>
          Enter your email address and we will send instructions to help you regain access to your account.
        </Text>

        <TextInput
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={{ marginBottom: 20 }}
        />

        <Button
          title="Send Reset Link"
          onPress={handleSendLink}
          loading={loading}
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backLink}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 40,
    marginBottom: Spacing[1],
    textAlign: 'left',
    fontFamily: Typography.fonts.display,
  },
  body: {
    fontSize: Typography.sizes.bodyM,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left',
    fontFamily: Typography.fonts.body,
  },
  backLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
    fontWeight: '500',
  },
  confirmIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Typography.fonts.display,
  },
  confirmBody: {
    fontSize: Typography.sizes.bodyM,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: Typography.fonts.body,
    marginBottom: 24,
  },
  redirectText: {
    fontSize: Typography.sizes.bodyS,
    textAlign: 'center',
    fontFamily: Typography.fonts.body,
  },
});
