import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth-utils';
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
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !agreed) return;
    setLoading(true);
    try {
      const { user, session } = await signUpWithEmail(email, password);

      if (user && !session) {
        Alert.alert(
          'Verification Required',
          'Please check your email for a verification link to activate your account.'
        );
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Auth Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.onBackground }]}>Create an Account</Text>
      <Text style={[styles.subtitle, { color: theme.onBackground }]}>Start your journey to financial freedom today</Text>

      <TextInput
        label="Full Name"
        placeholder="Your full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        containerStyle={{ marginBottom: 8 }}
      />
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
        placeholder="Min 8 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        containerStyle={{ marginBottom: 8 }}
      />

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
      >
        <View style={[styles.radio, agreed && { backgroundColor: theme.primary, borderColor: theme.primary }]} />
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
        <GoogleLogo size={20} />
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#9E9E9E',
    marginTop: 2,
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
