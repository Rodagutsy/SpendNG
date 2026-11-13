import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { sendOtp, storePendingPassword, consumePendingPassword, signInWithGoogle } from '@/lib/auth-utils';
import { useState } from 'react';
import { GoogleLogo } from '@/components/GoogleLogo';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AccountCreationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setFormError('');
    if (!name) { setNameError('Enter your full name'); return; }
    if (!email) { setEmailError('Enter your email address'); return; }
    if (!password) { setPasswordError('Enter a password'); return; }
    if (password.length < 10) { setPasswordError('Password must be at least 10 characters'); return; }
    if (!agreed) { setFormError('You must agree to the Terms of Service and Privacy Policy'); return; }
    setLoading(true);
    try {
      storePendingPassword(email, password);
      await sendOtp(email, true);
      router.replace(`/(onboarding)/verify-pin?email=${encodeURIComponent(email)}&mode=signup&name=${encodeURIComponent(name)}`);
    } catch (error: any) {
      if (error instanceof Error) consumePendingPassword(email);
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('invalid email')) {
        setEmailError('Enter a valid email address');
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered') || msg.toLowerCase().includes('user already exists')) {
        setFormError('Unable to complete sign up with those details. Please sign in or reset your password.');
      } else {
        setFormError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setFormError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(onboarding)/connect-source');
    } catch (error: any) {
      setFormError(error?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.onBackground }]}>Create an Account</Text>
      <Text style={[styles.subtitle, { color: theme.outline }]}>Start your journey to financial freedom today</Text>

      {formError ? <Text style={[styles.formError, { color: Colors.main.error }]}>{formError}</Text> : null}

      <TextInput
        label="Full Name"
        placeholder="First name and last name"
        value={name}
        onChangeText={(v) => { setName(v); setNameError(''); }}
        autoCapitalize="words"
        error={nameError}
        containerStyle={{ marginBottom: 8 }}
      />
      <TextInput
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={(v) => { setEmail(v); setEmailError(''); setFormError(''); }}
        autoCapitalize="none"
        error={emailError}
        containerStyle={{ marginBottom: 8 }}
      />
      <TextInput
        label="Password"
        placeholder="Min 6 characters"
        secureTextEntry
        value={password}
        onChangeText={(v) => { setPassword(v); setPasswordError(''); setFormError(''); }}
        error={passwordError}
        containerStyle={{ marginBottom: 8 }}
      />
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
      >
        <View style={[styles.radio, agreed && { borderColor: theme.primary }]}>
          {agreed && <View style={[styles.radioFill, { backgroundColor: theme.primary }]} />}
        </View>
        <Text style={[styles.termsText, { color: theme.onBackground }]}>
          By creating an account, you agree to our{' '}
          <Text style={{ color: theme.primary }} onPress={() => { }}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={{ color: theme.primary }} onPress={() => { }}>
            Privacy Policy
          </Text>
          .
        </Text>
      </TouchableOpacity>

      <Button
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
        disabled={!agreed}
        style={{ marginTop: 20 }}
      />

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.outlineVariant }]} />
        <Text style={[styles.dividerText, { color: theme.outline }]}>OR</Text>
        <View style={[styles.line, { backgroundColor: theme.outlineVariant }]} />
      </View>

      <TouchableOpacity
        onPress={handleGoogleAuth}
        disabled={loading}
        style={[styles.googleButton, { borderColor: theme.outlineVariant }]}
        activeOpacity={0.8}
      >
        <GoogleLogo size={16} />
        <Text style={[styles.googleButtonText, { color: theme.onBackground }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      <Text style={[styles.footerText, { color: theme.onBackground }]}>
        Have an account?{' '}
        <Text style={{ color: theme.primary }} onPress={() => router.push('/(onboarding)/sign-in')}>
          Sign In
        </Text>
      </Text>
    </ScrollView>
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
  formError: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
    marginTop: 8,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#9E9E9E',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
  termsText: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    lineHeight: 20,
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
    fontSize: 12,
    lineHeight: 16,
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
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
});
