import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ContactSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleEmail = () => {
    Linking.openURL('mailto:support@spendng.app');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Contact Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={styles.row} onPress={handleEmail} activeOpacity={0.7}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primaryContainer }]}>
            <IconSymbol name="envelope.fill" size={20} color={theme.primary} />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: theme.onBackground }]}>Email Us</Text>
            <Text style={[styles.rowDesc, { color: theme.outline }]}>support@spendng.app</Text>
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
    padding: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing[2],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.bodyS,
  },
  rowDesc: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.labelM,
    marginTop: 1,
  },
});
