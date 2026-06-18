import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { supabase } from '@/lib/supabase';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { mode, name } = useLocalSearchParams<{ email: string; mode: string; name?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSetPassword = async () => {
    setPasswordError('');
    setConfirmError('');
    setFormError('');

    if (!password) { setPasswordError('Enter a password'); return; }
    if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    if (!confirmPassword) { setConfirmError('Confirm your password'); return; }
    if (password !== confirmPassword) { setConfirmError('Passwords do not match'); return; }

    setSaving(true);
    try {
      await supabase.auth.updateUser({ password });

      if (mode === 'signup' && name) {
        await supabase.auth.updateUser({ data: { full_name: name } });
      }

      if (mode === 'signup') {
        router.replace('/(onboarding)/connect-source');
      } else {
        router.replace('/(onboarding)/sign-in');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('password')) {
        setPasswordError(msg);
      } else {
        setFormError(msg || 'Failed to set password');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.onBackground }]}>
          {mode === 'reset' ? 'Create New Password' : 'Create your password'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.outline }]}>
          {mode === 'reset'
            ? 'Choose a new password for your account.'
            : 'Set a password so you can sign in anytime.'}
        </Text>

        {formError ? <Text style={[styles.formError, { color: Colors.main.error }]}>{formError}</Text> : null}

        <TextInput
          label="Password"
          placeholder="Min 6 characters"
          value={password}
          onChangeText={(v) => { setPassword(v); setPasswordError(''); setFormError(''); }}
          secureTextEntry
          error={passwordError}
          containerStyle={{ marginBottom: 6 }}
        />
        <TextInput
          label="Confirm Password"
          placeholder="Enter password again"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setConfirmError(''); setFormError(''); }}
          secureTextEntry
          error={confirmError}
          containerStyle={{ marginBottom: 6 }}
        />

        <Button
          title={saving ? 'Saving...' : 'Set Password'}
          onPress={handleSetPassword}
          loading={saving}
          style={{ marginTop: 16 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
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
});
