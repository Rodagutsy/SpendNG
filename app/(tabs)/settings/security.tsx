import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleBiometrics = () => {
    Alert.alert('Coming Soon', 'Enable PIN / biometric login feature is coming soon!');
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

        <TouchableOpacity style={styles.row} onPress={handleBiometrics} activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
              <IconSymbol name="person.fill" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.label, { color: theme.onBackground }]}>Enable PIN / biometric login</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={theme.outline} />
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
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[4],
    marginBottom: 32, // 32px bottom spacing
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleL,
  },
  section: {
    paddingHorizontal: Spacing[6],
    gap: 16,
    marginBottom: 20, // 20px section spacing
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
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
