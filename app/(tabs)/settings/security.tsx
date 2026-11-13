import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppLockStore } from '@/lib/stores/appLockStore';

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const biometricEnabled = useAppLockStore((s) => s.biometricEnabled);
  const hydrated = useAppLockStore((s) => s.hydrated);
  const hydrate = useAppLockStore((s) => s.hydrate);
  const setBiometricEnabled = useAppLockStore((s) => s.setBiometricEnabled);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const handleToggleBiometrics = async (next: boolean) => {
    if (Platform.OS === 'web') {
      showAlert({ title: 'Mobile Only', message: 'Biometric / device lock is available on iOS and Android devices.' });
      return;
    }
    setToggling(true);
    try {
      const ok = await setBiometricEnabled(next);
      if (!ok) {
        showAlert({
          title: 'Biometrics Unavailable',
          message: 'Ensure Face ID, Fingerprint, or a device passcode is enrolled in your phone settings.',
        });
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Security</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/settings/change-password')} activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
              <IconSymbol name="lock.fill" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.label, { color: theme.onBackground }]}>Change password</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={theme.outline} />
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
              <IconSymbol name="person.fill" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.label, { color: theme.onBackground }]}>Biometric / device lock</Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometrics}
            disabled={toggling}
            trackColor={{ false: theme.outlineVariant, true: Colors.main.primary }}
          />
        </View>
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
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[8],
    marginBottom: Spacing[4],
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
  section: {
    paddingHorizontal: Spacing[6],
    gap: 8,
    marginBottom: 20, // 20px section spacing
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[1],
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // 6px spacing
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
});
