import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const MenuItem = ({
    icon,
    label,
    onPress,
    destructive = false,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <IconSymbol name={icon as any} size={22} color={destructive ? theme.error : theme.onBackground} />
        <Text style={[styles.menuItemLabel, { color: destructive ? theme.error : theme.onBackground }]}>
          {label}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={theme.outline} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.onBackground }]}>Settings</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <MenuItem icon="person.fill" label="Profile" onPress={() => router.push('/settings/profile')} />
        <MenuItem icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
        <MenuItem icon="arrow.down.doc.fill" label="Data & Export" onPress={() => router.push('/settings/data-export')} />
        <MenuItem icon="lock.fill" label="Security" onPress={() => router.push('/settings/security')} />
        <MenuItem icon="help-circle" label="Help" onPress={() => router.push('/settings/help')} />
      </View>

      <Text style={[styles.version, { color: theme.outline }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing[6],
    paddingTop: Spacing[16],
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  menuItemLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  version: {
    textAlign: 'center',
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelS,
    marginTop: Spacing[8],
  },
});
