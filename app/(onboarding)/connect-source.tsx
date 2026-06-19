import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { importHistoricalSms } from '@/lib/sms-import';
import { IngestionEngine } from '@/lib/ingestion-engine';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/lib/stores/uiStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const DURATION_OPTIONS = [
  { label: '3 months', value: 90 },
  { label: '6 months', value: 180 },
  { label: '12 months', value: 365 },
] as const;

type SourceType = 'sms' | null;
type ScreenState = 'selection' | 'duration' | 'scanning' | 'success';

export default function ConnectSourceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const importProgress = useUIStore((s) => s.importProgress);

  const [screenState, setScreenState] = useState<ScreenState>('selection');
  const [selectedSource, setSelectedSource] = useState<SourceType>(null);
  const [selectedDuration, setSelectedDuration] = useState(90);
  const [scanLabel, setScanLabel] = useState('');

  const closeDurationModal = useCallback(() => setScreenState('selection'), []);
  const { translateY: durationTranslateY, panResponder: durationPanResponder } = useSwipeToClose(closeDurationModal);

  const startSMSScan = useCallback(async (startDate: number) => {
    setScanLabel('Reading SMS messages...');
    setScreenState('scanning');
    try {
      const messages = await importHistoricalSms(startDate);
      if (messages.length === 0) {
        showAlert({ title: 'No Messages', message: 'No SMS messages found in the selected date range.' });
        setScreenState('success');
        return;
      }

      const alerts = messages.map((msg) => ({
        body: msg.body,
        sender: msg.address,
        timestamp: msg.date,
        sourceChannel: 'sms' as const,
      }));

      await IngestionEngine.processBatch(alerts);
      setScreenState('success');
    } catch (e) {
      console.warn('SMS scan error:', e);
      showAlert({ title: 'SMS Scan Error', message: 'SMS scanning encountered an error. You can try again from Settings later.' });
      setScreenState('success');
    }
  }, []);

  // Mark onboarding complete and redirect on success
  useEffect(() => {
    if (screenState === 'success') {
      (async () => {
        await supabase.auth.updateUser({
          data: { onboarding_completed: true },
        });
        router.replace('/(tabs)');
      })();
    }
  }, [screenState]);

  const handleSourceSelect = (source: SourceType) => {
    setSelectedSource(source);
    setScreenState('duration');
  };

  const handleDurationConfirm = () => {
    const startDate = selectedDuration === 0 ? 0 : Date.now() - selectedDuration * 24 * 60 * 60 * 1000;
    startSMSScan(startDate);
  };

  const found = importProgress?.found ?? 0;
  const processed = importProgress?.processed ?? 0;
  const percent = found > 0 ? Math.round((processed / found) * 100) : 0;

  // Selection state
  if (screenState === 'selection') {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryContainer }]}>
            <MaterialIcons name="sms" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.onBackground }]}>Connect your bank alerts</Text>
          <Text style={[styles.subtitle, { color: theme.outline }]}>
            SpendNG automatically imports your transaction alerts so you can track every naira.
          </Text>

          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[styles.sourceBtn, { backgroundColor: theme.primary }, Shadows.sm]}
              onPress={() => handleSourceSelect('sms')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sourceBtnText, { color: theme.onSecondary }]}>Connect by SMS</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.skipBtn} onPress={async () => { await supabase.auth.updateUser({ data: { onboarding_completed: true } }); router.replace('/(tabs)'); }} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: theme.outline }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Duration picker modal
  if (screenState === 'duration') {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <Modal visible transparent animationType="slide" onRequestClose={closeDurationModal}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => {
              Animated.timing(durationTranslateY, {
                toValue: 2000,
                duration: 200,
                useNativeDriver: true,
              }).start(() => closeDurationModal());
            }}>
              <Animated.View style={[styles.sheet, { backgroundColor: theme.surface, transform: [{ translateY: durationTranslateY }] }]}>
                <View style={[styles.handle, { backgroundColor: theme.outlineVariant }]} {...durationPanResponder.panHandlers} />
                <Text style={[styles.sheetTitle, { color: theme.onSurface }]}>Select scan duration</Text>
                <Text style={[styles.sheetSubtitle, { color: theme.outline }]}>
                  How far back should we scan your SMS?
                </Text>

                {DURATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.durationRow, selectedDuration === opt.value && { backgroundColor: theme.primaryContainer }]}
                    onPress={() => setSelectedDuration(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.durationLabel, { color: selectedDuration === opt.value ? theme.primary : theme.onSurface }]}>
                      {opt.label}
                    </Text>
                    {selectedDuration === opt.value && (
                      <MaterialIcons name="check" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
                  onPress={handleDurationConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmBtnText, { color: theme.onPrimary }]}>Start Scan</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // Scanning state
  if (screenState === 'scanning') {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.title, { color: theme.onBackground }]}>{scanLabel}</Text>

          {found > 0 && (
            <View style={styles.progressSection}>
              <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceContainer }]}>
                <View
                  style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${percent}%` }]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.outline }]}>
                {processed} of {found} scanned ({percent}%)
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Success popup
  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Modal visible transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={[styles.successCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.checkCircle, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcons name="check" size={36} color={theme.primary} />
              </View>
              <Text style={[styles.successTitle, { color: theme.onSurface }]}>All messages parsed!</Text>
              <Text style={[styles.successMessage, { color: theme.outline }]}>
                Your transaction alerts have been imported and categorised.
              </Text>
            </View>
          </View>
        </Modal>
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
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: Radius.sm,
    gap: 10,
  },
  sourceBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 16,
  },
  skipBtn: {
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing[5],
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[5],
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing[4],
  },
  sheetTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    marginBottom: Spacing[4],
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  durationLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
  },
  confirmBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[4],
  },
  confirmBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 15,
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
  successCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 80,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
