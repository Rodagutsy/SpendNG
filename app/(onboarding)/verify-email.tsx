import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const RESEND_COOLDOWN = 20;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (resending || countdown > 0 || !email) return;
    setResending(true);
    try {
      await supabase.auth.resend({ type: 'signup', email });
      showAlert({
        title: 'Email Resent',
        message: 'A new verification link has been sent to your inbox.',
      });
      setCountdown(RESEND_COOLDOWN);
    } catch (error: any) {
      showAlert({ title: 'Resend Error', message: error.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="mail-outline" size={64} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.onBackground }]}>
        Check your email
      </Text>

      <Text style={[styles.message, { color: theme.outline }]}>
        We sent a verification link to{'\n'}
        <Text style={{ color: theme.onBackground, fontFamily: Typography.fonts.medium }}>
          {email || 'your email'}
        </Text>
      </Text>

      <TouchableOpacity
        style={[
          styles.resendButton,
          { backgroundColor: countdown > 0 ? theme.outlineVariant : theme.primary },
        ]}
        onPress={handleResend}
        disabled={countdown > 0 || resending}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name="refresh"
          size={18}
          color={countdown > 0 ? theme.outline : theme.onPrimary}
        />
        <Text
          style={[
            styles.resendButtonText,
            { color: countdown > 0 ? theme.outline : theme.onPrimary },
          ]}
        >
          {countdown > 0
            ? `Resend in ${countdown}s`
            : resending
              ? 'Sending...'
              : 'Resend Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signInLink}
        onPress={() => router.replace('/(onboarding)/sign-in')}
        activeOpacity={0.7}
      >
        <Text style={[styles.signInLinkText, { color: theme.primary }]}>
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.full,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    maxWidth: 280,
  },
  resendButtonText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
  signInLink: {
    marginTop: 24,
    padding: 8,
  },
  signInLinkText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.bodyM,
  },
});
