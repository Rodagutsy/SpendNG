import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SecurityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Security</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={styles.row} onPress={() => {}} activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <IconSymbol name="lock.fill" size={22} color={theme.onBackground} />
            <Text style={[styles.label, { color: theme.onBackground }]}>Change password</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={theme.outline} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => {}} activeOpacity={0.7}>
          <View style={styles.rowLeft}>
            <IconSymbol name="person.fill" size={22} color={theme.onBackground} />
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
    padding: Spacing[6],
    paddingTop: Spacing[16],
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
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
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
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  label: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
});
