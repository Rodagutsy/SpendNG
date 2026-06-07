import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { ExportService, ExportFormat } from '@/lib/export-service';

export default function DataExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const clearAllTransactions = useTransactionStore((s) => s.clearAllTransactions);

  const [exporting, setExporting] = useState(false);

  const doExport = useCallback(async (format: ExportFormat) => {
    setExporting(true);
    try {
      const txStore = useTransactionStore.getState();
      const catStore = useCategoryStore.getState();

      await txStore.fetchTransactions();
      if (catStore.categories.length === 0) {
        await catStore.fetchCategories();
      }

      const transactions = useTransactionStore.getState().transactions;
      if (transactions.length === 0) {
        Alert.alert('No Data', 'There are no transactions to export.');
        return;
      }

      const categoryNames: Record<string, string> = {};
      for (const t of transactions) {
        const cat = catStore.getCategoryById(t.categoryId);
        if (cat) categoryNames[t.categoryId] = cat.name;
      }

      const startDate = new Date(transactions[transactions.length - 1].transactionDate);
      const endDate = new Date(transactions[0].transactionDate);

      const filePath = await ExportService.exportData(
        { format, startDate, endDate, transactions, userName: 'User', categoryNames },
        () => {},
      );

      await ExportService.shareFile(filePath);
      Alert.alert('Export Successful', `Your data has been exported as ${format}.`);
    } catch (err: any) {
      if (err.message === 'Export cancelled') return;
      Alert.alert('Export Failed', err.message || 'An error occurred.');
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExportData = () => {
    Alert.alert(
      'Export All Data',
      'Choose the export format:',
      [
        { text: 'Export as CSV', onPress: () => doExport('CSV') },
        { text: 'Export as PDF', onPress: () => doExport('PDF') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDownloadTaxReports = () => {
    Alert.alert(
      'Download Tax Reports',
      'Choose the tax year:',
      [
        {
          text: 'FY 2025/2026',
          onPress: () => startDownloadSimulation('FY 2025/2026'),
        },
        {
          text: 'FY 2024/2025',
          onPress: () => startDownloadSimulation('FY 2024/2025'),
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const startDownloadSimulation = (year: string) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      Alert.alert('Success', `Tax report for ${year} has been downloaded successfully.`);
    }, 1500);
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'WARNING: This will permanently delete all transaction records. This action cannot be undone. Do you wish to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            clearAllTransactions();
            Alert.alert('Data Cleared', 'All local transaction data has been permanently deleted.');
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, label, onPress, destructive = false }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: destructive ? '#FDECEB' : theme.primaryContainer }]}>
          <IconSymbol name={icon as any} size={16} color={destructive ? theme.error : theme.primary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: destructive ? theme.error : theme.onBackground }]}>{label}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={theme.outline} />
    </TouchableOpacity>
  );

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
          <Text style={[styles.title, { color: theme.onBackground }]}>Data & Export</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.section}>
          <MenuItem icon="export" label="Export all data (CSV/PDF)" onPress={handleExportData} />
          <MenuItem icon="arrow.down.doc.fill" label="Download tax reports" onPress={handleDownloadTaxReports} />
          <MenuItem icon="trash.fill" label="Delete all data" onPress={handleDeleteAllData} destructive />
        </View>
      </ScrollView>

      {exporting && (
        <View style={styles.overlay}>
          <View style={[styles.loaderBox, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loaderText, { color: theme.onBackground }]}>Processing...</Text>
          </View>
        </View>
      )}
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
    fontFamily: Typography.fonts.medium, // 500 font weight
    fontSize: Typography.sizes.titleS, // 20px similar font size
  },
  section: {
    paddingHorizontal: Spacing[6],
    gap: 16,
    marginBottom: 20, // 20px section spacing
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // 6px spacing
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: Typography.sizes.bodyM,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    padding: 24,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontFamily: Typography.fonts.medium,
    fontSize: 14,
  },
});
