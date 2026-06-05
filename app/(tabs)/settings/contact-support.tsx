import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ContactSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.onBackground }]}>Contact Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.comingSoon}>
        <IconSymbol name="help-circle" size={48} color={theme.outline} />
        <Text style={[styles.comingSoonText, { color: theme.onBackground }]}>Coming soon</Text>
        <Text style={[styles.comingSoonSub, { color: theme.outline }]}>Support is not available yet. Check back later.</Text>
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
    paddingTop: Spacing[8],
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
    fontSize: Typography.sizes.titleM,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  comingSoonText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.titleS,
  },
  comingSoonSub: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
    textAlign: 'center',
    paddingHorizontal: Spacing[8],
  },
});
