import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/TextInput';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setFormError('');
    if (!currentPassword) { setCurrentPasswordError('Enter your current password'); return; }
    if (!newPassword) { setNewPasswordError('Enter a new password'); return; }
    if (!confirmPassword) { setConfirmPasswordError('Confirm your new password'); return; }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 10) {
      setNewPasswordError('Password must be at least 10 characters');
      return;
    }

    setSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword,
      });
      if (signInError) {
        setCurrentPasswordError('Current password is incorrect');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      router.back();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('password')) {
        setNewPasswordError(msg);
      } else {
        setFormError(msg || 'Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {formError ? <Text style={[styles.formError, { color: Colors.main.error }]}>{formError}</Text> : null}

        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.onBackground, borderColor: theme.surfaceContainerLow }]}
          label="Current Password"
          value={currentPassword}
          onChangeText={(v) => { setCurrentPassword(v); setCurrentPasswordError(''); setFormError(''); }}
          secureTextEntry
          placeholder="Enter current password"
          error={currentPasswordError}
        />
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.onBackground, borderColor: theme.surfaceContainerLow }]}
          label="New Password"
          value={newPassword}
          onChangeText={(v) => { setNewPassword(v); setNewPasswordError(''); setFormError(''); }}
          secureTextEntry
          placeholder="Enter new password"
          error={newPasswordError}
        />
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.surfaceContainerLow, color: theme.onBackground, borderColor: theme.surfaceContainerLow }]}
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setConfirmPasswordError(''); setFormError(''); }}
          secureTextEntry
          placeholder="Confirm new password"
          error={confirmPasswordError}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleChangePassword}
          activeOpacity={0.8}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.onPrimary} />
          ) : (
            <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>Change Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[6],
    marginTop: Spacing[10],
    marginBottom: Spacing[2],
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleS,
  },
  card: {
    marginHorizontal: Spacing[6],
    borderRadius: Radius.sm,
    padding: Spacing[6],
    gap: Spacing[1],
  },
  textInput: {
    width: '100%',
    height: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2],
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    lineHeight: 24,
    justifyContent: 'center',
  },
  formError: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginBottom: 12,
  },
  primaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: 15,
  },
});
