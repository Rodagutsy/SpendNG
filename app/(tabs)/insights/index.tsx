import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.onBackground }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: theme.outline }]}>
          Understand your spending habits and financial health.
        </Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={[styles.placeholderText, { color: theme.outline }]}>
          Detailed insights and analytics coming soon.
        </Text>
      </View>
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
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.headlineM,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
    marginTop: Spacing[2],
  },
  placeholder: {
    padding: Spacing[10],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  placeholderText: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyL,
    textAlign: 'center',
  }
});
