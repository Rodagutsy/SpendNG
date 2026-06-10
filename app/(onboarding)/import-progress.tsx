import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUIStore } from '@/lib/stores/uiStore';

export default function ImportProgressScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const importProgress = useUIStore((s) => s.importProgress);

  const found = importProgress?.found ?? 0;
  const processed = importProgress?.processed ?? 0;
  const isDone = found > 0 && processed >= found;
  const percent = found > 0 ? Math.round((processed / found) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {isDone ? (
          <Text style={styles.emoji}>✅</Text>
        ) : (
          <ActivityIndicator size="large" color={theme.primary} />
        )}

        <Text style={[styles.title, { color: theme.onBackground }]}>
          {isDone ? 'Import complete!' : found > 0 ? 'Importing your transactions...' : 'Setting up...'}
        </Text>

        {found > 0 && (
          <View style={styles.progressSection}>
            <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceContainer }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: theme.primary, width: `${percent}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.outline }]}>
              {processed} of {found} SMS imported ({percent}%)
            </Text>
          </View>
        )}

        {found === 0 && (
          <Text style={[styles.statusText, { color: theme.outline }]}>
            No bank alerts found to import
          </Text>
        )}

        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: theme.primary }, Shadows.sm]}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueBtnText, { color: theme.onPrimary }]}>
            Continue to SpendNG
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  statusText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  continueBtn: {
    width: '100%',
    height: 50,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 16,
  },
});