import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const TOGGLES = [
  { key: 'monthly-report', label: 'Monthly report ready' },
  { key: 'overspending', label: 'Overspending alerts' },
  { key: 'tax-reminder', label: 'Tax reminder' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [settings, setSettings] = useState<Record<string, boolean>>({
    'monthly-report': true,
    'overspending': true,
    'tax-reminder': false,
  });

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        {TOGGLES.map((item) => (
          <View key={item.key} style={styles.row}>
            <Text style={[styles.label, { color: theme.onBackground }]}>{item.label}</Text>
            <Switch
              value={settings[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: theme.outlineVariant, true: theme.primary }}
              thumbColor={theme.surface}
            />
          </View>
        ))}
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
    paddingTop: Spacing[16],
    marginBottom: Spacing[2]
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
    fontSize: Typography.sizes.headlineS,
  },
  section: {
    marginHorizontal: Spacing[6],
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
});
