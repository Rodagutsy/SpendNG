import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/Tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/context/AlertContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { ExportService, ExportFormat } from '@/lib/export-service';

export default function DataExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showAlert } = useAlert();
  const clearAllTransactions = useTransactionStore((s) => s.clearAllTransactions);

  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
        showAlert({ title: 'No Data', message: 'There are no transactions to export.' });
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
        () => { },
      );

      await ExportService.shareFile(filePath);
      showAlert({ title: 'Export Successful', message: `Your data has been exported as ${format}.` });
    } catch (err: any) {
      if (err.message === 'Export cancelled') return;
      showAlert({ title: 'Export Failed', message: err.message || 'An error occurred.' });
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExportData = () => {
    setShowExportModal(true);
  };

  const handleDeleteAllData = () => {
    showAlert({
      title: 'Delete All Data',
      message: 'WARNING: This will permanently delete all transaction records. This action cannot be undone. Do you wish to proceed?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            clearAllTransactions();
            showAlert({ title: 'Data Cleared', message: 'All local transaction data has been permanently deleted.' });
          },
        },
      ],
    });
  };

  const MenuItem = ({ icon, label, onPress, destructive = false }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: destructive ? '#FDECEB' : theme.primaryContainer }]}>
          <IconSymbol name={icon as any} size={16} color={destructive ? Colors.main.error : theme.primary} />
        </View>
        <Text style={[styles.menuItemLabel, { color: destructive ? Colors.main.error : theme.onBackground }]}>{label}</Text>
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

      <Modal visible={showExportModal} transparent animationType="slide" onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.exportOverlay}>
          <TouchableOpacity style={styles.exportOverlayBg} activeOpacity={1} onPress={() => setShowExportModal(false)} />
          <View style={[styles.exportSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.exportSheetHeader}>
              <Text style={[styles.exportSheetTitle, { color: theme.onBackground }]}>Export All Data</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)} style={styles.exportCloseBtn} activeOpacity={0.7}>
                <MaterialIcons name="close" size={22} color={theme.onBackground} />
              </TouchableOpacity>
            </View>
            <View style={styles.exportButtonRow}>
              <TouchableOpacity
                style={[styles.exportBtn, styles.exportBtnSecondary, { borderColor: theme.outlineVariant }]}
                onPress={() => { setShowExportModal(false); doExport('CSV'); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.exportBtnText, { color: theme.onBackground }]}>Export as CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportBtn, styles.exportBtnPrimary, { backgroundColor: theme.primary }]}
                onPress={() => { setShowExportModal(false); doExport('PDF'); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.exportBtnText, { color: theme.onPrimary }]}>Export as PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 8,
    marginBottom: 16, // 20px section spacing
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
  exportOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  exportOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  exportSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing[2],
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing[5],
    paddingHorizontal: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  exportSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
  },
  exportSheetTitle: {
    fontFamily: Typography.fonts.display,
    fontSize: Typography.sizes.titleS,
  },
  exportCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing[4],
  },
  exportBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportBtnPrimary: {},
  exportBtnSecondary: {
    borderWidth: 1.5,
  },
  exportBtnText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Typography.sizes.buttonM,
  },
});
