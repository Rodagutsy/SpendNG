import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TextInput } from '@/components/ui/TextInput';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert({ title: 'Error', message: 'Please fill in all fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert({ title: 'Error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ title: 'Error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    // Simulate successful password change
    setTimeout(() => {
      setLoading(false);
      showAlert({ title: 'Success', message: 'Password changed successfully! Redirecting you back...' });

      // Auto redirect back within 3 seconds
      setTimeout(() => {
        router.back();
      }, 3000);
    }, 1200);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.form}>
        <TextInput
          label="Old Password"
          placeholder="Enter old password"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />

        <TextInput
          label="New Password"
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInput
          label="Confirm New Password"
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={[styles.saveBtnText, { color: theme.onPrimary }]}>
            {loading ? 'Saving...' : 'Change Password'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[8],
    paddingBottom: Spacing[4]
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
  form: {
    paddingHorizontal: Spacing[6],
    gap: Spacing[1]
  },
  saveBtn: {
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  saveBtnText: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.buttonL,
  },
});
