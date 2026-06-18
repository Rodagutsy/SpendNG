import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { sendOtp } from '@/lib/auth-utils';
import { useState } from 'react';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendLink = async () => {
    setEmailError('');
    setFormError('');
    if (!email) { setEmailError('Enter your email address'); return; }
    setLoading(true);
    try {
      await sendOtp(email, false);
      router.replace(`/(onboarding)/verify-pin?email=${encodeURIComponent(email)}&mode=reset`);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('invalid email') || msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('does not exist')) {
        setEmailError('No account found with this email');
      } else {
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.onBackground }]}>Reset Your Password</Text>
        <Text style={[styles.body, { color: theme.outline }]}>
          Enter your email address and we will send a code to reset your password.
        </Text>

        {formError ? <Text style={[styles.formError, { color: Colors.main.error }]}>{formError}</Text> : null}

        <TextInput
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={(v) => { setEmail(v); setEmailError(''); setFormError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError}
          containerStyle={{ marginBottom: 20 }}
        />

        <Button
          title="Send Code"
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
    marginTop: 20,
  },
  title: {
    fontSize: 20,
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
  formError: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginBottom: 12,
  },
});
