import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SMSService } from '@/lib/sms-service';
import { useUIStore } from '@/lib/stores/uiStore';

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

const RANGE_OPTIONS = [
  { label: 'Last 3 months', value: 90 },
  { label: 'Last 6 months', value: 180 },
  { label: 'Last 12 months', value: 365 },
  { label: 'All time', value: 0 },
] as const;

export default function SMSPermissionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skipable?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState(180);
  const isSkipable = params.skipable === 'true';
  const isIOS = Platform.OS === 'ios';
  const importProgress = useUIStore((s) => s.importProgress);

  const getDateRange = () => {
    if (selectedRange === 0) return { startDate: 0, endDate: Date.now() };
    const startDate = Date.now() - selectedRange * 24 * 60 * 60 * 1000;
    return { startDate, endDate: Date.now() };
  };

  const handleAllow = async () => {
    if (isIOS) return;
    useUIStore.getState().setImportProgress(null);
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const result = await SMSService.requestAndScan(startDate, endDate);
      if (!result.permissionsGranted) {
        showAlert({ title: 'Permission Denied', message: 'SMS access was denied. You can enable it later in Settings.' });
      }
      router.push('/(onboarding)/import-progress');
    } catch (e) {
      console.warn('SMS setup error:', e);
      showAlert({ title: 'SMS Setup Error', message: 'SMS setup encountered an issue. You can configure it later in Settings.' });
      router.push('/(onboarding)/import-progress');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/import-progress');
  };

  if (loading) {
    const found = importProgress?.found ?? 0;
    const processed = importProgress?.processed ?? 0;
    const percent = found > 0 ? Math.round((processed / found) * 100) : 0;
    const remaining = Math.max(0, found - processed);

    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
            <MaterialIcons name="sms" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.onBackground }]}>Import Bank Alerts</Text>
          <Text style={[styles.subtitle, { color: theme.outline }]}>
            {found > 0 ? 'Importing your bank transactions...' : 'Scanning your SMS inbox for bank alerts...'}
          </Text>

          {found > 0 ? (
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
                {percent}% complete · {processed} of {found} processed ({remaining} left)
              </Text>
            </View>
          ) : (
            <View style={styles.progressSection}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
          <MaterialIcons name="sms" size={40} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.onBackground }]}>Import Bank Alerts</Text>
        <Text style={[styles.subtitle, { color: theme.outline }]}>
          {isIOS
            ? 'SMS import is not available on iOS. You can connect your email or add transactions manually.'
            : 'SpendNG can scan your SMS inbox for bank transaction alerts and automatically categorise them.'
          }
        </Text>

        {!isIOS && (
          <>
            <Text style={[styles.rangeLabel, { color: theme.onSurface }]}>Date range to scan:</Text>
            <View style={styles.rangeRow}>
              {RANGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.rangeChip,
                    selectedRange === opt.value && { backgroundColor: theme.primaryContainer, borderColor: theme.primary, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedRange(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      { color: selectedRange === opt.value ? theme.primary : theme.onSurface },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.allowBtn, { backgroundColor: theme.primary }, Shadows.sm]}
              onPress={handleAllow}
              activeOpacity={0.8}
            >
              <Text style={[styles.allowBtnText, { color: theme.onPrimary }]}>
                Allow & Scan SMS
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isIOS && (
          <TouchableOpacity
            style={[styles.allowBtn, { backgroundColor: theme.surfaceContainer, borderWidth: 1, borderColor: theme.outline }]}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={[styles.allowBtnText, { color: theme.outline }]}>Skip</Text>
          </TouchableOpacity>
        )}

        {isSkipable && !isIOS && (
          <TouchableOpacity
            style={styles.skipBtnWrapper}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: theme.outline }]}>{"Skip, I'll do this later"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  progressSection: {
    width: '100%',
    marginTop: Spacing[6],
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
  title: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },

  rangeLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 56,
  },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceContainer,
  },
  rangeChipText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 13,
  },
  allowBtn: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
    marginBottom: 8,
  },
  allowBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 16,
  },
  skipBtnWrapper: {
    paddingVertical: 8,
    marginTop: Spacing[4],
  },
  skipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
});