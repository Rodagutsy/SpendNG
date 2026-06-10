import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { signInWithEmail, signInWithGoogle } from '@/lib/auth-utils';
import { useState } from 'react';
import { GoogleLogo } from '@/components/GoogleLogo';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { SMSService } from '@/lib/sms-service';
import { EmailService } from '@/lib/email-service';

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfterAuth = async () => {
    router.replace('/(tabs)');
    if (Platform.OS === 'android') {
      SMSService.rescanMissedAlerts();
    }
    EmailService.rescanMissedEmails();
  };

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      await redirectAfterAuth();
    } catch (error: any) {
      showAlert({ title: 'Sign In Error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      await redirectAfterAuth();
    } catch (error: any) {
      showAlert({ title: 'Google Auth Error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.onBackground }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: theme.onBackground }]}>Continue tracking your finances and stay on top of your money.</Text>
      <TextInput
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        containerStyle={{ marginBottom: 8 }}
      />
      <TextInput
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        containerStyle={{ marginBottom: 6 }}
      />
      <Text
        style={[styles.forgotPassword, { color: theme.primary }]}
        onPress={() => router.push('/(onboarding)/forgot-password')}
      >
        Forgot password?
      </Text>

      <Button
        title="Sign In"
        onPress={handleSignIn}
        loading={loading}
        style={{ marginTop: 20 }}
      />

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.outline }]} />
        <Text style={[styles.dividerText, { color: theme.outline }]}>OR</Text>
        <View style={[styles.line, { backgroundColor: theme.outline }]} />
      </View>

      <TouchableOpacity
        onPress={handleGoogleAuth}
        disabled={loading}
        style={[styles.googleButton, { borderColor: theme.outline }]}
        activeOpacity={0.8}
      >
        <GoogleLogo size={16} />
        <Text style={[styles.googleButtonText, { color: theme.onBackground }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      <Text style={[styles.footerText, { color: theme.onBackground }]}>
        Don't have an account?{' '}
        <Text style={{ color: theme.primary }} onPress={() => router.push('/(onboarding)/account-creation')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  subtitle: {
    fontSize: Typography.sizes.bodyM,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left',
    fontFamily: Typography.fonts.body,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontWeight: '600',
    fontFamily: Typography.fonts.body,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing[2],
  },
  googleButtonText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.buttonM,
  },
  forgotPassword: {
    textAlign: 'right',
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelL,

  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
});
