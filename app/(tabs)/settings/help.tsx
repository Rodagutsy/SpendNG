import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const rows = [
  { icon: 'bubble.left.fill' as const, label: 'Contact support', route: '/settings/contact-support', iconBg: '#E6EEFF', iconColor: '#0B5CFF' },
  { icon: 'lock.fill' as const, label: 'Privacy policy', route: '/settings/privacy-policy', iconBg: '#FDECEB', iconColor: '#dc2626' },
  { icon: 'info.circle.fill' as const, label: 'Terms', route: '/settings/terms', iconBg: '#E8F5E9', iconColor: '#16a34a' },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.onBackground }]}>Help</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.section}>
          {rows.map((row) => (
            <TouchableOpacity
              key={row.label}
              style={styles.row}
              onPress={() => router.push(row.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: row.iconBg }]}>
                  <IconSymbol name={row.icon} size={16} color={row.iconColor} />
                </View>
                <Text style={[styles.label, { color: theme.onBackground }]}>{row.label}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={theme.outline} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
});
