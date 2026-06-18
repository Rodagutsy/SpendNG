import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user } = useAuth();
  const prefs = user?.user_metadata?.notification_preferences || {};

  const [monthlyReport, setMonthlyReport] = useState(prefs.monthly_report ?? false);
  const [overspendAlert, setOverspendAlert] = useState(prefs.overspend_alert ?? false);
  const [taxReminder, setTaxReminder] = useState(prefs.tax_reminder ?? false);

  const updatePreference = async (key: string, value: boolean) => {
    const current = { monthly_report: monthlyReport, overspend_alert: overspendAlert, tax_reminder: taxReminder };
    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: { ...current, [key]: value },
      },
    });
    if (error) {
      Alert.alert('Error', 'Failed to save preference');
    }
  };

  const toggleMonthlyReport = (val: boolean) => {
    setMonthlyReport(val);
    updatePreference('monthly_report', val);
  };

  const toggleOverspendAlert = (val: boolean) => {
    setOverspendAlert(val);
    updatePreference('overspend_alert', val);
  };

  const toggleTaxReminder = (val: boolean) => {
    setTaxReminder(val);
    updatePreference('tax_reminder', val);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={20} color={theme.onBackground} style={{ transform: [{ rotate: '180deg' }] }} />
        </Pressable>
        <Text style={[styles.title, { color: theme.onBackground }]}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.row}>
          <IconSymbol name="calendar" size={20} color={theme.primary} />
          <Text style={[styles.label, { color: theme.onBackground }]}>Monthly report ready</Text>
          <Switch
            value={monthlyReport}
            onValueChange={toggleMonthlyReport}
            trackColor={{ false: theme.outlineVariant, true: theme.primaryContainer }}
            thumbColor={monthlyReport ? theme.primary : theme.outline}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
        <View style={styles.row}>
          <IconSymbol name="chart-up" size={20} color={theme.primary} />
          <Text style={[styles.label, { color: theme.onBackground }]}>Overspending alerts</Text>
          <Switch
            value={overspendAlert}
            onValueChange={toggleOverspendAlert}
            trackColor={{ false: theme.outlineVariant, true: theme.primaryContainer }}
            thumbColor={overspendAlert ? theme.primary : theme.outline}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
        <View style={styles.row}>
          <IconSymbol name="bell" size={20} color={theme.primary} />
          <Text style={[styles.label, { color: theme.onBackground }]}>Tax reminder</Text>
          <Switch
            value={taxReminder}
            onValueChange={toggleTaxReminder}
            trackColor={{ false: theme.outlineVariant, true: theme.primaryContainer }}
            thumbColor={taxReminder ? theme.primary : theme.outline}
          />
        </View>
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
  label: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyS,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
});
